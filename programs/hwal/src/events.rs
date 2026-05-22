use anchor_lang::prelude::*;

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub fee_bps: u16,
    pub keeper_reward_bps: u16,
}

#[event]
pub struct PriceFeedInitialized {
    pub feed: Pubkey,
    pub authority: Pubkey,
    pub symbol: [u8; 16],
    pub decimals: u8,
    pub initial_price: u64,
}

#[event]
pub struct PriceFeedUpdated {
    pub feed: Pubkey,
    pub old_price: u64,
    pub new_price: u64,
    pub timestamp: i64,
    pub update_count: u64,
}

#[event]
pub struct PositionOpened {
    pub position: Pubkey,
    pub owner: Pubkey,
    pub feed: Pubkey,
    pub side: u8,
    pub collateral: u64,
    pub entry_price: u64,
    pub stop_price: u64,
    pub take_profit_price: u64,
    pub trailing_offset: u64,
    pub opened_at: i64,
}

#[event]
pub struct TriggersUpdated {
    pub position: Pubkey,
    pub stop_price: u64,
    pub take_profit_price: u64,
    pub trailing_offset: u64,
}

#[event]
pub struct PositionTicked {
    pub position: Pubkey,
    pub price: u64,
    pub trailing_extreme: u64,
    pub tick_at: i64,
}

#[event]
pub struct PositionTriggered {
    pub position: Pubkey,
    pub owner: Pubkey,
    pub trigger_reason: u8,
    pub trigger_price: u64,
    pub collateral_returned: u64,
    pub fee_paid: u64,
    pub keeper_reward: u64,
    pub keeper: Pubkey,
    pub triggered_at: i64,
}

#[event]
pub struct PositionCancelled {
    pub position: Pubkey,
    pub owner: Pubkey,
    pub collateral_returned: u64,
    pub cancelled_at: i64,
}
