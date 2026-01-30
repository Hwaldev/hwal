use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub feed: Pubkey,
    pub vault: Pubkey,
    pub nonce: u64,
    pub side: u8,
    pub status: u8,
    pub trigger_reason: u8,
    pub _pad: u8,
    pub collateral: u64,
    pub entry_price: u64,
    pub stop_price: u64,
    pub take_profit_price: u64,
    pub trailing_offset: u64,
    pub trailing_extreme: u64,
    pub opened_at: i64,
    pub last_tick_at: i64,
    pub settled_at: i64,
    pub tick_count: u64,
    pub bump: u8,
    pub vault_bump: u8,
    pub _reserved: [u8; 32],
}
