use anchor_lang::prelude::*;

use crate::constants::*;
use crate::errors::HwalError;
use crate::events::{PositionTicked, PositionTriggered};
use crate::state::{Config, Position, PriceFeed};

pub fn handler(_ctx: Context<TickPosition>) -> Result<()> {
    // Scaffold body. Trigger evaluation and settlement land in later commits.
    Ok(())
}

#[derive(Accounts)]
pub struct TickPosition<'info> {
    #[account(mut)]
    pub position: Account<'info, Position>,
    /// CHECK: vault PDA holds collateral; verified inside the handler.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    pub feed: Account<'info, PriceFeed>,
    pub config: Account<'info, Config>,
    /// CHECK: fee receiver from config.
    #[account(mut)]
    pub fee_receiver: UncheckedAccount<'info>,
    #[account(mut)]
    pub keeper: Signer<'info>,
    /// CHECK: position.owner is asserted in the handler.
    #[account(mut)]
    pub owner: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}
