use anchor_lang::prelude::*;

#[error_code]
pub enum HwalError {
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
    #[msg("Feed is not configured as a Pyth Lazer feed")]
    FeedNotLazer,
    #[msg("Feed is already configured as a Pyth Lazer feed")]
    FeedAlreadyLazer,
    #[msg("Lazer payload is malformed")]
    LazerPayloadInvalid,
    #[msg("Lazer payload feed id does not match the registered feed")]
    LazerFeedIdMismatch,
    #[msg("Lazer payload timestamp is too old or in the future")]
    LazerPayloadStale,
    #[msg("Missing or invalid ed25519 signature verification instruction")]
    LazerSignatureMissing,
    #[msg("Position is already delegated to the ER")]
    PositionAlreadyDelegated,
    #[msg("Position is not currently delegated to the ER")]
    PositionNotDelegated,
}
