pub mod initialize_token;
pub mod mint_token;
pub mod retire_token;

// Re-export functions
pub use initialize_token::initialize_token;
pub use mint_token::mint_token;
pub use retire_token::retire_token;

// Define all account context structs in this module to avoid Anchor macro issues
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use crate::state::Project;

// Argument structs for instruction parameters
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeTokenArgs {
    pub project_id: String,
    pub co2e: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct MintTokenArgs {
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct RetireTokenArgs {
    pub amount: u64,
}

#[derive(Accounts)]
#[instruction(project_id: String, co2e: u64)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 1,
        seeds = [b"project", user.key().as_ref()],
        bump
    )]
    pub project: Account<'info, Project>,
    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = mint_authority
    )]
    pub mint: Account<'info, Mint>,
    /// CHECK: This is the mint authority PDA, validated by seeds constraint
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub project: Account<'info, Project>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    /// CHECK: This is the mint authority PDA, validated by seeds constraint
    #[account(seeds = [b"mint_authority"], bump)]
    pub mint_authority: AccountInfo<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RetireToken<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
