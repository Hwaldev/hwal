use crate::constants::*;
use crate::errors::HwalError;
use crate::events::ConfigInitialized;
use crate::state::Config;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: receiver of trigger fees, may be any account
    pub fee_receiver: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeConfig>,
    fee_bps: u16,
    keeper_reward_bps: u16,
) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, HwalError::FeeBpsTooHigh);
    require!(
        keeper_reward_bps <= MAX_KEEPER_REWARD_BPS,
        HwalError::KeeperRewardTooHigh
    );

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.fee_receiver = ctx.accounts.fee_receiver.key();
    config.fee_bps = fee_bps;
    config.keeper_reward_bps = keeper_reward_bps;
    config.total_positions_opened = 0;
    config.total_positions_triggered = 0;
    config.total_positions_cancelled = 0;
    config.total_fees_collected = 0;
    config.total_keeper_rewards_paid = 0;
    config.bump = ctx.bumps.config;

    emit!(ConfigInitialized {
        admin: config.admin,
        fee_bps,
        keeper_reward_bps,
    });

    Ok(())
}
