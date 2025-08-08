use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use super::InitializeEscrow;
use crate::state::Escrow;

pub fn initialize_escrow(ctx: Context<InitializeEscrow>, sol_amount: u64) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    escrow.buyer = ctx.accounts.buyer.key();
    escrow.seller = ctx.accounts.seller.key();
    escrow.credit_token = ctx.accounts.credit_token.key();
    escrow.sol_amount = sol_amount;
    escrow.buyer_confirmed = false;
    escrow.seller_confirmed = false;

    // Transfer SOL to escrow
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.buyer.to_account_info(),
        to: ctx.accounts.escrow_vault.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, sol_amount)?;

    // Transfer token to escrow
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        1,
    )?;

    Ok(())
}
