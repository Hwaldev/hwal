use anchor_lang::prelude::*;

#[error_code]
pub enum ChalnaError {
    #[msg("Fee bps exceeds maximum allowed")]
    FeeBpsTooHigh,
    #[msg("Keeper reward bps exceeds maximum allowed")]
    KeeperRewardTooHigh,
    #[msg("Caller is not the configured admin")]
    NotAdmin,
    #[msg("Caller is not the position owner")]
    NotPositionOwner,
    #[msg("Caller is not the price feed authority")]
    NotFeedAuthority,
    #[msg("Invalid position side: must be 0 (long) or 1 (short)")]
    InvalidSide,
    #[msg("Collateral is below the minimum allowed")]
    CollateralTooSmall,
    #[msg("Position is not open")]
    PositionNotOpen,
    #[msg("Price feed has not been updated recently enough")]
    PriceFeedStale,
    #[msg("Price feed price is zero")]
    PriceFeedZero,
    #[msg("Stop price is on the wrong side of entry for this side")]
    InvalidStopPrice,
    #[msg("Take-profit price is on the wrong side of entry for this side")]
    InvalidTakeProfitPrice,
    #[msg("Trailing offset is larger than entry price")]
    InvalidTrailingOffset,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Trailing extreme underflow")]
    TrailingUnderflow,
    #[msg("Insufficient lamports in position vault")]
    InsufficientVaultLamports,
    #[msg("Position vault PDA does not match expected")]
    InvalidVault,
    #[msg("No trigger condition met")]
    NoTriggerHit,
    #[msg("Feed mismatch: position was opened against a different feed")]
    FeedMismatch,
}
