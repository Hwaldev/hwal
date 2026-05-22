use crate::constants::*;
use crate::errors::HwalError;
use crate::events::TriggersUpdated;
use crate::state::Position;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateTriggers<'info> {
    #[account(address = position.owner @ HwalError::NotPositionOwner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [POSITION_SEED, owner.key().as_ref(), &position.nonce.to_le_bytes()],
        bump = position.bump,
    )]
    pub position: Account<'info, Position>,
}

pub fn handler(
    ctx: Context<UpdateTriggers>,
    stop_price: u64,
    take_profit_price: u64,
    trailing_offset: u64,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(position.status == STATUS_OPEN, HwalError::PositionNotOpen);

    let entry_price = position.entry_price;
    if position.side == SIDE_LONG {
        if stop_price > 0 {
            require!(stop_price < entry_price, HwalError::InvalidStopPrice);
        }
        if take_profit_price > 0 {
            require!(
                take_profit_price > entry_price,
                HwalError::InvalidTakeProfitPrice
            );
        }
    } else {
        if stop_price > 0 {
            require!(stop_price > entry_price, HwalError::InvalidStopPrice);
        }
        if take_profit_price > 0 {
            require!(
                take_profit_price < entry_price,
                HwalError::InvalidTakeProfitPrice
            );
        }
    }
    if trailing_offset > 0 {
        require!(
            trailing_offset < entry_price,
            HwalError::InvalidTrailingOffset
        );
    }

    position.stop_price = stop_price;
    position.take_profit_price = take_profit_price;
    if trailing_offset != position.trailing_offset {
        position.trailing_offset = trailing_offset;
        position.trailing_extreme = entry_price;
    }

    emit!(TriggersUpdated {
        position: position.key(),
        stop_price,
        take_profit_price,
        trailing_offset,
    });

    Ok(())
}
