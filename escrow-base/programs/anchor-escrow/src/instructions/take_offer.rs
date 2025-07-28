use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
};

use crate::state::Offer;

#[derive(Accounts)]
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint_a: InterfaceAccount<'info, Mint>, // Token A (maker's offering)

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint_b: InterfaceAccount<'info, Mint>, // Token B (taker's offering)

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = token_mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    // Where the taker will receive Token A
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    // Where the taker sends Token B from
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close = maker,
        seeds = [b"offer", offer.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub offer: Account<'info, Offer>,

    #[account(
        mut,
        associated_token::mint = token_mint_b,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    // Where the maker receives Token B (from taker)
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = token_mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    // Vault that holds Token A (from maker), now sent to taker
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn take_offer(ctx: Context<TakeOffer>, deposit: u64) -> Result<()> {
    let offer_account_seeds = &[
        b"offer",
        &ctx.accounts.offer.id.to_le_bytes()[..],
        &[ctx.bumps.offer],
    ];

    // Transfer Token B from taker to maker
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.taker_ata_b.to_account_info(),
                to: ctx.accounts.maker_ata_b.to_account_info(),
                authority: ctx.accounts.taker.to_account_info(),
                mint: ctx.accounts.token_mint_b.to_account_info(),
            },
        ),
        deposit,
        0, // You can change this to token_mint_b.decimals if needed
    )?;

    // Transfer Token A from vault (offer PDA) to taker
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.taker_ata_a.to_account_info(),
                authority: ctx.accounts.offer.to_account_info(),
                mint: ctx.accounts.token_mint_a.to_account_info(),
            },
            &[offer_account_seeds],
        ),
        ctx.accounts.offer.receive,
        0, // Same here: match token_mint_a.decimals if needed
    )?;

    Ok(())
}
