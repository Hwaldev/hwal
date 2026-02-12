//! Chalna trigger engine.

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

pub use crate::constants::*;
pub use crate::errors::ChalnaError;
pub use crate::events::*;
pub use crate::instructions::*;
pub use crate::state::*;

declare_id!("fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ");

#[program]
pub mod chalna {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        fee_bps: u16,
        keeper_reward_bps: u16,
    ) -> Result<()> {
        instructions::initialize_config::handler(ctx, fee_bps, keeper_reward_bps)
    }

    pub fn initialize_price_feed(
        ctx: Context<InitializePriceFeed>,
        symbol: [u8; 16],
        decimals: u8,
        initial_price: u64,
    ) -> Result<()> {
        instructions::initialize_price_feed::handler(ctx, symbol, decimals, initial_price)
    }

    pub fn update_price_feed(ctx: Context<UpdatePriceFeed>, new_price: u64) -> Result<()> {
        instructions::update_price_feed::handler(ctx, new_price)
    }
}
