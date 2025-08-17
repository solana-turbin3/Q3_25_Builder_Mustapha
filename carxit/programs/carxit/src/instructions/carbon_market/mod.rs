pub mod list_credit;
pub mod initialize_escrow;
pub mod confirm_escrow;
pub mod refund_escrow;

// Re-export functions
pub use list_credit::list_credit;
pub use initialize_escrow::initialize_escrow;
pub use confirm_escrow::confirm_escrow;
pub use refund_escrow::refund_escrow;

// Define all account context structs in this module to avoid Anchor macro issues
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::{Listing, Escrow};

// Argument structs for instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ListCreditArgs {
    pub price: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeEscrowArgs {
    pub sol_amount: u64,
}

#[derive(Accounts)]
#[instruction(price: u64)]
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
    /// CHECK: This account is used to receive SOL from the escrow, no validation needed
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
    /// CHECK: This account is used to receive SOL from the escrow, no validation needed
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: This account is used to receive tokens from the escrow, no validation needed
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
    /// CHECK: This account is used to receive SOL from the escrow, no validation needed
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    /// CHECK: This account is used to receive tokens from the escrow, no validation needed
    #[account(mut)]
    pub buyer: AccountInfo<'info>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}
