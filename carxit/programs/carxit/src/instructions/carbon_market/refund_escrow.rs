use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use super::RefundEscrow;
use crate::state::Escrow;

pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
    let escrow = &ctx.accounts.escrow;

    // Refund SOL to buyer
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.escrow_vault.to_account_info(),
        to: ctx.accounts.buyer.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    anchor_lang::system_program::transfer(cpi_ctx, escrow.sol_amount)?;

    // Refund token to seller
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.escrow_vault.to_account_info(),
            },
        ),
        1,
    )?;

    // Close escrow account
    let escrow_account = ctx.accounts.escrow.to_account_info();
    let dest_account = ctx.accounts.signer.to_account_info();
    let dest_starting_lamports = dest_account.lamports();
    **dest_account.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(escrow_account.lamports())
        .unwrap();
    **escrow_account.lamports.borrow_mut() = 0;

    Ok(())
}
