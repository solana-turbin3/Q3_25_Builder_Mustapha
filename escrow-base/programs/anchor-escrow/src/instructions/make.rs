use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked},
    associated_token::AssociatedToken,
};

use crate::state::Offer;

#[derive(Accounts)]
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint_a: InterfaceAccount<'info, Mint>, // Token the maker is offering

    #[account(
        mint::token_program = token_program
    )]
    pub token_mint_b: InterfaceAccount<'info, Mint>, // Token the maker wants in return

    #[account(
        mut,
        associated_token::mint = token_mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>, // Maker's token A account

    #[account(
        init,
        payer = maker,
        seeds = [b"offer", maker.key().as_ref()],
        bump,
        space = 8 + Offer::INIT_SPACE
    )]
    pub offer: Account<'info, Offer>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = token_mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>, // PDA-owned vault to hold token A

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn make_offer(ctx: Context<MakeOffer>, deposit: u64, receive: u64) -> Result<()> {
    let offer = &mut ctx.accounts.offer;

    // Store offer state
    offer.set_inner(Offer {
        id: 0, // You may want to set this to a deterministic value or counter
        maker: ctx.accounts.maker.key(),
        mint_a: ctx.accounts.token_mint_a.key(),
        mint_b: ctx.accounts.token_mint_b.key(),
        receive,
        bump: ctx.bumps.offer,
    });

    // Transfer Token A from maker's ATA to vault
    let cpi_accounts = TransferChecked {
        from: ctx.accounts.maker_ata_a.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.maker.to_account_info(),
        mint: ctx.accounts.token_mint_a.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
    );

    // Use token_mint_a decimals (you may add mint_a.decimals if needed)
    transfer_checked(cpi_ctx, deposit, 0)?; // Replace 0 with actual decimals if necessary

    Ok(())
}