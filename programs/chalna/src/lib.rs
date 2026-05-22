//! Chalna trigger engine.
//!
//! On-chain stop-loss / take-profit / trailing-stop engine for Solana.
//! Positions hold native SOL collateral against a configured price feed.
//! Anyone (keepers, the user, MagicBlock ER) can tick a position: the
//! program re-reads the feed, advances the trailing extreme, and if any
//! trigger condition is met it settles the position by returning collateral
//! to the owner net of a basis-point fee. Trigger evaluation is pure on-chain
//! state; off-chain components only push price updates and call `tick_position`.

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

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_admin: Option<Pubkey>,
        new_fee_receiver: Option<Pubkey>,
        new_fee_bps: Option<u16>,
        new_keeper_reward_bps: Option<u16>,
    ) -> Result<()> {
        instructions::update_config::handler(
            ctx,
            new_admin,
            new_fee_receiver,
            new_fee_bps,
            new_keeper_reward_bps,
        )
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

    pub fn open_position(
        ctx: Context<OpenPosition>,
        nonce: u64,
        side: u8,
        collateral: u64,
        stop_price: u64,
        take_profit_price: u64,
        trailing_offset: u64,
    ) -> Result<()> {
        instructions::open_position::handler(
            ctx,
            nonce,
            side,
            collateral,
            stop_price,
            take_profit_price,
            trailing_offset,
        )
    }

    pub fn update_triggers(
        ctx: Context<UpdateTriggers>,
        stop_price: u64,
        take_profit_price: u64,
        trailing_offset: u64,
    ) -> Result<()> {
        instructions::update_triggers::handler(
            ctx,
            stop_price,
            take_profit_price,
            trailing_offset,
        )
    }

    pub fn tick_position(ctx: Context<TickPosition>) -> Result<()> {
        instructions::tick_position::handler(ctx)
    }

    pub fn cancel_position(ctx: Context<CancelPosition>) -> Result<()> {
        instructions::cancel_position::handler(ctx)
    }
}
