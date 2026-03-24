use crate::constants::*;
use crate::errors::ChalnaError;
use crate::state::Config;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(address = config.admin @ ChalnaError::NotAdmin)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
}

pub fn handler(
    ctx: Context<UpdateConfig>,
    new_admin: Option<Pubkey>,
    new_fee_receiver: Option<Pubkey>,
    new_fee_bps: Option<u16>,
    new_keeper_reward_bps: Option<u16>,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(admin) = new_admin {
        config.admin = admin;
    }
    if let Some(receiver) = new_fee_receiver {
        config.fee_receiver = receiver;
    }
    if let Some(fee_bps) = new_fee_bps {
        require!(fee_bps <= MAX_FEE_BPS, ChalnaError::FeeBpsTooHigh);
        config.fee_bps = fee_bps;
    }
    if let Some(reward_bps) = new_keeper_reward_bps {
        require!(
            reward_bps <= MAX_KEEPER_REWARD_BPS,
            ChalnaError::KeeperRewardTooHigh
        );
        config.keeper_reward_bps = reward_bps;
    }

    Ok(())
}
