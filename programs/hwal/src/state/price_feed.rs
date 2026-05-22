use anchor_lang::prelude::*;

pub const FEED_SOURCE_AUTHORITY: u8 = 0;
pub const FEED_SOURCE_LAZER: u8 = 1;

pub const LAZER_CHANNEL_1MS: u8 = 0;
pub const LAZER_CHANNEL_50MS: u8 = 1;
pub const LAZER_CHANNEL_200MS: u8 = 2;

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
    pub source: u8,
    pub lazer_channel: u8,
    pub lazer_feed_id: u64,
    pub _reserved: [u8; 22],
}
