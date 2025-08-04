use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::{Listing, Escrow};
use crate::CarxitError;

pub fn list_credit(ctx: Context<ListCredit>, price: u64) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    listing.seller = ctx.accounts.seller.key();
    listing.credit_token = ctx.accounts.credit_token.key();
    listing.price = price;
    Ok(())
}

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
            token::Transfer {
                from: ctx.accounts.seller_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.seller.to_account_info(),
            },
        ),
        1,
    )?;

    Ok(())
}

pub fn confirm_escrow(ctx: Context<ConfirmEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    if ctx.accounts.signer.key() == escrow.buyer {
        escrow.buyer_confirmed = true;
    } else if ctx.accounts.signer.key() == escrow.seller {
        escrow.seller_confirmed = true;
    } else {
        return Err(CarxitError::EscrowNotConfirmed.into());
    }

    if escrow.buyer_confirmed && escrow.seller_confirmed {
        // Transfer SOL to seller
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.seller.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        anchor_lang::system_program::transfer(cpi_ctx, escrow.sol_amount)?;

        // Transfer token to buyer
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.escrow_token_account.to_account_info(),
                    to: ctx.accounts.buyer_token_account.to_account_info(),
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
    }

    Ok(())
}

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
            token::Transfer {
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

#[derive(Accounts)]
pub struct ListCredit<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8,
        seeds = [b"listing", credit_token.key().as_ref()],
        bump
    )]
    pub listing: Account<'info, Listing>,
    pub credit_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(sol_amount: u64)]
pub struct InitializeEscrow<'info> {
    #[account(
        init,
        payer = buyer,
        space = 8 + 32 + 32 + 32 + 8 + 1 + 1,
        seeds = [b"escrow", buyer.key().as_ref(), seller.key().as_ref(), credit_token.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: SystemAccount<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    pub credit_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ConfirmEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: SystemAccount<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RefundEscrow<'info> {
    #[account(mut)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub escrow_vault: SystemAccount<'info>,
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}