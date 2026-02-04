use crate::errors::ChalnaError;
use anchor_lang::prelude::*;

pub fn bps_of(amount: u64, bps: u16) -> Result<u64> {
    (amount as u128)
        .checked_mul(bps as u128)
        .and_then(|v| v.checked_div(crate::constants::BPS_DENOMINATOR as u128))
        .and_then(|v| u64::try_from(v).ok())
        .ok_or_else(|| error!(ChalnaError::MathOverflow))
}

pub fn checked_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b).ok_or_else(|| error!(ChalnaError::MathOverflow))
}

pub fn checked_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b).ok_or_else(|| error!(ChalnaError::MathOverflow))
}

pub fn transfer_lamports_from_pda<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let from_lamports = from.lamports();
    if from_lamports < amount {
        return err!(ChalnaError::InsufficientVaultLamports);
    }
    **from.try_borrow_mut_lamports()? = from_lamports
        .checked_sub(amount)
        .ok_or_else(|| error!(ChalnaError::MathOverflow))?;
    **to.try_borrow_mut_lamports()? = to
        .lamports()
        .checked_add(amount)
        .ok_or_else(|| error!(ChalnaError::MathOverflow))?;
    Ok(())
}
