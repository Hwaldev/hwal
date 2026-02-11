use crate::errors::ChalnaError;
use crate::events::PriceFeedUpdated;
use crate::state::PriceFeed;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdatePriceFeed<'info> {
    #[account(address = feed.authority @ ChalnaError::NotFeedAuthority)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub feed: Account<'info, PriceFeed>,
}

pub fn handler(ctx: Context<UpdatePriceFeed>, new_price: u64) -> Result<()> {
    require!(new_price > 0, ChalnaError::PriceFeedZero);
    let clock = Clock::get()?;
    let feed = &mut ctx.accounts.feed;
    let old_price = feed.price;
    feed.price = new_price;
    feed.last_updated = clock.unix_timestamp;
    feed.update_count = feed.update_count.saturating_add(1);

    emit!(PriceFeedUpdated {
        feed: feed.key(),
        old_price,
        new_price,
        timestamp: feed.last_updated,
        update_count: feed.update_count,
    });

    Ok(())
}
