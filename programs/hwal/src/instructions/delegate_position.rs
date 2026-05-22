use crate::constants::*;
use crate::errors::HwalError;
use crate::events::PositionDelegated;
use crate::state::Position;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke_signed;

#[derive(Accounts)]
pub struct DelegatePosition<'info> {
    #[account(address = position.owner @ HwalError::NotPositionOwner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [POSITION_SEED, position.owner.as_ref(), &position.nonce.to_le_bytes()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,

    /// CHECK: MagicBlock delegation program account
    #[account(address = MAGICBLOCK_DELEGATION_PROGRAM_ID)]
    pub delegation_program: UncheckedAccount<'info>,

    /// CHECK: delegation buffer PDA derived by the delegation program
    #[account(mut)]
    pub delegation_buffer: UncheckedAccount<'info>,

    /// CHECK: delegation record PDA derived by the delegation program
    #[account(mut)]
    pub delegation_record: UncheckedAccount<'info>,

    /// CHECK: delegation metadata PDA derived by the delegation program
    #[account(mut)]
    pub delegation_metadata: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DelegatePosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.status == STATUS_OPEN, HwalError::PositionNotOpen);
    require!(
        position.er_delegated == 0,
        HwalError::PositionAlreadyDelegated
    );

    let nonce_bytes = position.nonce.to_le_bytes();
    let owner_key = position.owner;
    let bump = position.bump;
    let signer_seeds: &[&[u8]] = &[POSITION_SEED, owner_key.as_ref(), &nonce_bytes, &[bump]];

    let delegate_ix = Instruction {
        program_id: ctx.accounts.delegation_program.key(),
        accounts: vec![
            AccountMeta::new(ctx.accounts.owner.key(), true),
            AccountMeta::new(position.key(), false),
            AccountMeta::new(ctx.accounts.delegation_buffer.key(), false),
            AccountMeta::new(ctx.accounts.delegation_record.key(), false),
            AccountMeta::new(ctx.accounts.delegation_metadata.key(), false),
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
        ],
        data: build_delegate_instruction_data(&owner_key, &nonce_bytes),
    };

    invoke_signed(
        &delegate_ix,
        &[
            ctx.accounts.owner.to_account_info(),
            position.to_account_info(),
            ctx.accounts.delegation_buffer.to_account_info(),
            ctx.accounts.delegation_record.to_account_info(),
            ctx.accounts.delegation_metadata.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.delegation_program.to_account_info(),
        ],
        &[signer_seeds],
    )?;

    position.er_delegated = 1;
    let clock = Clock::get()?;

    emit!(PositionDelegated {
        position: position.key(),
        owner: owner_key,
        delegated_at: clock.unix_timestamp,
    });

    Ok(())
}

fn build_delegate_instruction_data(owner: &Pubkey, nonce_bytes: &[u8; 8]) -> Vec<u8> {
    let mut data = Vec::with_capacity(1 + 32 + 8);
    data.push(0u8);
    data.extend_from_slice(owner.as_ref());
    data.extend_from_slice(nonce_bytes);
    data
}
