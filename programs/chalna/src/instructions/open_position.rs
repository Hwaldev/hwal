use crate::constants::*;
use crate::errors::ChalnaError;
use crate::events::PositionOpened;
use crate::state::{Config, Position, PriceFeed};
use anchor_lang::prelude::*;
use anchor_lang::system_program;

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub feed: Account<'info, PriceFeed>,

    #[account(
        init,
        payer = owner,
        space = 8 + Position::INIT_SPACE,
        seeds = [POSITION_SEED, owner.key().as_ref(), &nonce.to_le_bytes()],
        bump,
    )]
    pub position: Account<'info, Position>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<OpenPosition>,
    nonce: u64,
    side: u8,
    collateral: u64,
    stop_price: u64,
    take_profit_price: u64,
    trailing_offset: u64,
) -> Result<()> {
    require!(
        side == SIDE_LONG || side == SIDE_SHORT,
        ChalnaError::InvalidSide
    );
    require!(
        collateral >= MIN_COLLATERAL_LAMPORTS,
        ChalnaError::CollateralTooSmall
    );

    let clock = Clock::get()?;
    let feed = &ctx.accounts.feed;
    require!(feed.price > 0, ChalnaError::PriceFeedZero);
    let staleness = clock.unix_timestamp.saturating_sub(feed.last_updated);
    require!(
        staleness <= MAX_FEED_STALENESS_SECS,
        ChalnaError::PriceFeedStale
    );

    let entry_price = feed.price;

    if side == SIDE_LONG {
        if stop_price > 0 {
            require!(stop_price < entry_price, ChalnaError::InvalidStopPrice);
        }
        if take_profit_price > 0 {
            require!(
                take_profit_price > entry_price,
                ChalnaError::InvalidTakeProfitPrice
            );
        }
    } else {
        if stop_price > 0 {
            require!(stop_price > entry_price, ChalnaError::InvalidStopPrice);
        }
        if take_profit_price > 0 {
            require!(
                take_profit_price < entry_price,
                ChalnaError::InvalidTakeProfitPrice
            );
        }
    }
    if trailing_offset > 0 {
        require!(
            trailing_offset < entry_price,
            ChalnaError::InvalidTrailingOffset
        );
    }

    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.owner.to_account_info(),
        to: ctx.accounts.position.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    system_program::transfer(cpi_ctx, collateral)?;

    let position = &mut ctx.accounts.position;
    position.owner = ctx.accounts.owner.key();
    position.feed = ctx.accounts.feed.key();
    position.vault = position.key();
    position.nonce = nonce;
    position.side = side;
    position.status = STATUS_OPEN;
    position.trigger_reason = TRIGGER_NONE;
    position._pad = 0;
    position.collateral = collateral;
    position.entry_price = entry_price;
    position.stop_price = stop_price;
    position.take_profit_price = take_profit_price;
    position.trailing_offset = trailing_offset;
    position.trailing_extreme = entry_price;
    position.opened_at = clock.unix_timestamp;
    position.last_tick_at = clock.unix_timestamp;
    position.settled_at = 0;
    position.tick_count = 0;
    position.bump = ctx.bumps.position;
    position.vault_bump = 0;

    let config = &mut ctx.accounts.config;
    config.total_positions_opened = config.total_positions_opened.saturating_add(1);

    emit!(PositionOpened {
        position: position.key(),
        owner: position.owner,
        feed: position.feed,
        side,
        collateral,
        entry_price,
        stop_price,
        take_profit_price,
        trailing_offset,
        opened_at: position.opened_at,
    });

    Ok(())
}
