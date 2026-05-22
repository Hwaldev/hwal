use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub fee_receiver: Pubkey,
    pub fee_bps: u16,
    pub keeper_reward_bps: u16,
    pub total_positions_opened: u64,
    pub total_positions_triggered: u64,
    pub total_positions_cancelled: u64,
    pub total_fees_collected: u64,
    pub total_keeper_rewards_paid: u64,
    pub bump: u8,
    pub _reserved: [u8; 64],
}
