use crate::constants::*;
use crate::errors::ChalnaError;
use crate::events::{PositionTicked, PositionTriggered};
use crate::state::{Config, Position, PriceFeed};
use crate::utils::{bps_of, checked_sub, transfer_lamports_from_pda};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct TickPosition<'info> {
    #[account(mut)]
    pub keeper: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(constraint = feed.key() == position.feed @ ChalnaError::FeedMismatch)]
    pub feed: Account<'info, PriceFeed>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.nonce.to_le_bytes()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,

    /// CHECK: receives net collateral on trigger; must equal position.owner
    #[account(mut, address = position.owner @ ChalnaError::NotPositionOwner)]
    pub owner: UncheckedAccount<'info>,

    /// CHECK: receives fee on trigger; must equal config.fee_receiver
    #[account(mut, address = config.fee_receiver)]
    pub fee_receiver: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<TickPosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.status == STATUS_OPEN, ChalnaError::PositionNotOpen);

    let feed = &ctx.accounts.feed;
    require!(feed.price > 0, ChalnaError::PriceFeedZero);
    let clock = Clock::get()?;
    let staleness = clock.unix_timestamp.saturating_sub(feed.last_updated);
    require!(
        staleness <= MAX_FEED_STALENESS_SECS,
        ChalnaError::PriceFeedStale
    );

    let price = feed.price;
    position.last_tick_at = clock.unix_timestamp;
    position.tick_count = position.tick_count.saturating_add(1);

    if position.trailing_offset > 0 {
        if position.side == SIDE_LONG {
            if price > position.trailing_extreme {
                position.trailing_extreme = price;
            }
        } else if price < position.trailing_extreme || position.trailing_extreme == 0 {
            position.trailing_extreme = price;
        }
    }

    let mut trigger = TRIGGER_NONE;

    if position.side == SIDE_LONG {
        if position.stop_price > 0 && price <= position.stop_price {
            trigger = TRIGGER_STOP_LOSS;
        } else if position.take_profit_price > 0 && price >= position.take_profit_price {
            trigger = TRIGGER_TAKE_PROFIT;
        } else if position.trailing_offset > 0 {
            let threshold = position
                .trailing_extreme
                .checked_sub(position.trailing_offset)
                .ok_or_else(|| error!(ChalnaError::TrailingUnderflow))?;
            if price <= threshold {
                trigger = TRIGGER_TRAILING;
            }
        }
    } else if position.stop_price > 0 && price >= position.stop_price {
        trigger = TRIGGER_STOP_LOSS;
    } else if position.take_profit_price > 0 && price <= position.take_profit_price {
        trigger = TRIGGER_TAKE_PROFIT;
    } else if position.trailing_offset > 0 {
        let threshold = position
            .trailing_extreme
            .checked_add(position.trailing_offset)
            .ok_or_else(|| error!(ChalnaError::MathOverflow))?;
        if price >= threshold {
            trigger = TRIGGER_TRAILING;
        }
    }

    if trigger == TRIGGER_NONE {
        emit!(PositionTicked {
            position: position.key(),
            price,
            trailing_extreme: position.trailing_extreme,
            tick_at: position.last_tick_at,
        });
        return Ok(());
    }

    let config = &mut ctx.accounts.config;
    let collateral = position.collateral;
    let fee = bps_of(collateral, config.fee_bps)?;
    let keeper_reward = bps_of(collateral, config.keeper_reward_bps)?;
    let after_fee = checked_sub(collateral, fee)?;
    let net_to_owner = checked_sub(after_fee, keeper_reward)?;

    let position_ai = position.to_account_info();

    if fee > 0 {
        transfer_lamports_from_pda(
            &position_ai,
            &ctx.accounts.fee_receiver.to_account_info(),
            fee,
        )?;
    }
    if keeper_reward > 0 {
        transfer_lamports_from_pda(
            &position_ai,
            &ctx.accounts.keeper.to_account_info(),
            keeper_reward,
        )?;
    }
    if net_to_owner > 0 {
        transfer_lamports_from_pda(
            &position_ai,
            &ctx.accounts.owner.to_account_info(),
            net_to_owner,
        )?;
    }

    position.collateral = 0;
    position.status = STATUS_TRIGGERED;
    position.trigger_reason = trigger;
    position.settled_at = clock.unix_timestamp;

    config.total_positions_triggered = config.total_positions_triggered.saturating_add(1);
    config.total_fees_collected = config.total_fees_collected.saturating_add(fee);
    config.total_keeper_rewards_paid = config.total_keeper_rewards_paid.saturating_add(keeper_reward);

    emit!(PositionTriggered {
        position: position.key(),
        owner: position.owner,
        trigger_reason: trigger,
        trigger_price: price,
        collateral_returned: net_to_owner,
        fee_paid: fee,
        keeper_reward,
        keeper: ctx.accounts.keeper.key(),
        triggered_at: position.settled_at,
    });

    Ok(())
}
