//! Chalna trigger engine.

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod state;

pub use crate::constants::*;
pub use crate::errors::ChalnaError;
pub use crate::state::*;

declare_id!("fSLsjTm9PGfbrAgosY2kYb1MnFEpn8LALo5cY5a4AkJ");

#[program]
pub mod chalna {
    use super::*;
}
