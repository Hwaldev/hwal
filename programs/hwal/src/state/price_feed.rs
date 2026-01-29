use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PriceFeed {
    pub authority: Pubkey,
    pub symbol: [u8; 16],
    pub decimals: u8,
    pub price: u64,
    pub last_updated: i64,
    pub update_count: u64,
    pub bump: u8,
    pub _reserved: [u8; 32],
}
