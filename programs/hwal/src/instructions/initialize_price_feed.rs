use crate::constants::*;
use crate::errors::HwalError;
use crate::events::PriceFeedInitialized;
use crate::state::{Config, PriceFeed};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(symbol: [u8; 16])]
pub struct InitializePriceFeed<'info> {
    #[account(mut, address = config.admin @ HwalError::NotAdmin)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// CHECK: authority that may push price updates
    pub authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + PriceFeed::INIT_SPACE,
        seeds = [FEED_SEED, symbol.as_ref()],
        bump,
    )]
    pub feed: Account<'info, PriceFeed>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializePriceFeed>,
    symbol: [u8; 16],
    decimals: u8,
    initial_price: u64,
) -> Result<()> {
    require!(initial_price > 0, HwalError::PriceFeedZero);

    let clock = Clock::get()?;
    let feed = &mut ctx.accounts.feed;
    feed.authority = ctx.accounts.authority.key();
    feed.symbol = symbol;
    feed.decimals = decimals;
    feed.price = initial_price;
    feed.last_updated = clock.unix_timestamp;
    feed.update_count = 0;
    feed.bump = ctx.bumps.feed;

    emit!(PriceFeedInitialized {
        feed: feed.key(),
        authority: feed.authority,
        symbol,
        decimals,
        initial_price,
    });

    Ok(())
}
