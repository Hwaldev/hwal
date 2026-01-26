use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

#[constant]
pub const FEED_SEED: &[u8] = b"feed";

#[constant]
pub const POSITION_SEED: &[u8] = b"position";

#[constant]
pub const VAULT_SEED: &[u8] = b"vault";

pub const BPS_DENOMINATOR: u64 = 10_000;

pub const MAX_FEE_BPS: u16 = 500;

pub const MAX_KEEPER_REWARD_BPS: u16 = 200;

pub const MIN_COLLATERAL_LAMPORTS: u64 = 1_000_000;

pub const MAX_FEED_STALENESS_SECS: i64 = 120;

pub const SIDE_LONG: u8 = 0;
pub const SIDE_SHORT: u8 = 1;

pub const STATUS_OPEN: u8 = 0;
pub const STATUS_TRIGGERED: u8 = 1;
pub const STATUS_CANCELLED: u8 = 2;

pub const TRIGGER_NONE: u8 = 0;
pub const TRIGGER_STOP_LOSS: u8 = 1;
pub const TRIGGER_TAKE_PROFIT: u8 = 2;
pub const TRIGGER_TRAILING: u8 = 3;
