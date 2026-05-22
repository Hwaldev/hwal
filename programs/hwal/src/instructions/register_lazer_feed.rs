use crate::constants::*;
use crate::errors::HwalError;
use crate::events::LazerFeedRegistered;
use crate::state::{
    Config, PriceFeed, FEED_SOURCE_AUTHORITY, FEED_SOURCE_LAZER, LAZER_CHANNEL_200MS,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterLazerFeed<'info> {
    #[account(address = config.admin @ HwalError::NotAdmin)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub feed: Account<'info, PriceFeed>,
}

pub fn handler(ctx: Context<RegisterLazerFeed>, lazer_feed_id: u64, channel: u8) -> Result<()> {
    require!(channel <= LAZER_CHANNEL_200MS, HwalError::LazerPayloadInvalid);

    let feed = &mut ctx.accounts.feed;
    require!(
        feed.source == FEED_SOURCE_AUTHORITY,
        HwalError::FeedAlreadyLazer
    );

    feed.source = FEED_SOURCE_LAZER;
    feed.lazer_feed_id = lazer_feed_id;
    feed.lazer_channel = channel;

    emit!(LazerFeedRegistered {
        feed: feed.key(),
        lazer_feed_id,
        channel,
    });

    Ok(())
}
