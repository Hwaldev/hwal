use crate::constants::*;
use crate::errors::HwalError;
use crate::events::PositionCancelled;
use crate::state::{Config, Position};
use crate::utils::transfer_lamports_from_pda;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CancelPosition<'info> {
    #[account(mut, address = position.owner @ HwalError::NotPositionOwner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [POSITION_SEED, owner.key().as_ref(), &position.nonce.to_le_bytes()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,
}

pub fn handler(ctx: Context<CancelPosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.status == STATUS_OPEN, HwalError::PositionNotOpen);

    let clock = Clock::get()?;
    let collateral = position.collateral;
    let position_ai = position.to_account_info();

    if collateral > 0 {
        transfer_lamports_from_pda(
            &position_ai,
            &ctx.accounts.owner.to_account_info(),
            collateral,
        )?;
    }

    position.collateral = 0;
    position.status = STATUS_CANCELLED;
    position.settled_at = clock.unix_timestamp;

    let config = &mut ctx.accounts.config;
    config.total_positions_cancelled = config.total_positions_cancelled.saturating_add(1);

    emit!(PositionCancelled {
        position: position.key(),
        owner: position.owner,
        collateral_returned: collateral,
        cancelled_at: position.settled_at,
    });

    Ok(())
}
