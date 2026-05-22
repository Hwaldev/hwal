use crate::constants::*;
use crate::errors::HwalError;
use crate::events::{LazerPriceVerified, PriceFeedUpdated};
use crate::state::{PriceFeed, FEED_SOURCE_LAZER};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::ed25519_program;
use anchor_lang::solana_program::sysvar;

#[derive(Accounts)]
pub struct UpdatePriceFeedFromLazer<'info> {
    pub poster: Signer<'info>,

    #[account(mut)]
    pub feed: Account<'info, PriceFeed>,

    /// CHECK: sysvar checked by address
    #[account(address = sysvar::instructions::ID)]
    pub instructions: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<UpdatePriceFeedFromLazer>, payload: Vec<u8>) -> Result<()> {
    let feed = &mut ctx.accounts.feed;
    require!(feed.source == FEED_SOURCE_LAZER, HwalError::FeedNotLazer);

    require!(payload.len() >= 25, HwalError::LazerPayloadInvalid);
    let feed_id = u64::from_le_bytes(
        payload[0..8]
            .try_into()
            .map_err(|_| error!(HwalError::LazerPayloadInvalid))?,
    );
    let payload_timestamp = i64::from_le_bytes(
        payload[8..16]
            .try_into()
            .map_err(|_| error!(HwalError::LazerPayloadInvalid))?,
    );
    let new_price = u64::from_le_bytes(
        payload[16..24]
            .try_into()
            .map_err(|_| error!(HwalError::LazerPayloadInvalid))?,
    );
    let channel = payload[24];

    require!(new_price > 0, HwalError::PriceFeedZero);
    require!(
        feed.lazer_feed_id == feed_id,
        HwalError::LazerFeedIdMismatch
    );
    require!(feed.lazer_channel == channel, HwalError::LazerFeedIdMismatch);

    let clock = Clock::get()?;
    let age = clock.unix_timestamp.saturating_sub(payload_timestamp);
    require!(
        age >= 0 && age <= MAX_LAZER_PAYLOAD_AGE_SECS,
        HwalError::LazerPayloadStale
    );

    verify_lazer_signature_present(&ctx.accounts.instructions.to_account_info(), &payload)?;

    let old_price = feed.price;
    feed.price = new_price;
    feed.last_updated = clock.unix_timestamp;
    feed.update_count = feed.update_count.saturating_add(1);

    emit!(LazerPriceVerified {
        feed: feed.key(),
        lazer_feed_id: feed_id,
        channel,
        price: new_price,
        payload_timestamp,
        on_chain_timestamp: clock.unix_timestamp,
    });

    emit!(PriceFeedUpdated {
        feed: feed.key(),
        old_price,
        new_price,
        timestamp: feed.last_updated,
        update_count: feed.update_count,
    });

    Ok(())
}

fn verify_lazer_signature_present(
    instructions_sysvar: &AccountInfo,
    expected_payload: &[u8],
) -> Result<()> {
    use anchor_lang::solana_program::sysvar::instructions::{
        load_current_index_checked, load_instruction_at_checked,
    };

    let current_index = load_current_index_checked(instructions_sysvar)
        .map_err(|_| error!(HwalError::LazerSignatureMissing))?;
    require!(current_index > 0, HwalError::LazerSignatureMissing);

    let prior_ix =
        load_instruction_at_checked((current_index as usize) - 1, instructions_sysvar)
            .map_err(|_| error!(HwalError::LazerSignatureMissing))?;
    require!(
        prior_ix.program_id == ed25519_program::ID,
        HwalError::LazerSignatureMissing
    );

    require!(
        prior_ix
            .data
            .windows(expected_payload.len())
            .any(|w| w == expected_payload),
        HwalError::LazerSignatureMissing
    );

    Ok(())
}
