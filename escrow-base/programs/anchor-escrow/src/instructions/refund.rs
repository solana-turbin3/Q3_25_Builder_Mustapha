use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, Mint, TokenAccount, TokenInterface,
        TransferChecked, CloseAccount
    }
};
use crate::state::Offer;

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub maker: Signer<'info>, // Maker who created the offer

    #[account(mint::token_program = token_program)]
    pub mint_a: InterfaceAccount<'info, Mint>, // Offered token mint

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>, // Maker's associated token account

    #[account(
        mut,
        close = maker,
        has_one = maker,
        has_one = mint_a,
        seeds = [b"offer", offer.id.to_le_bytes().as_ref()],
        bump,
    )]
    pub offer: Account<'info, Offer>, // Offer state account

    #[account(
        mut,
        associated_token::mint = mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>, // Token vault for escrowed tokens

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl<'info> Refund<'info> {
    pub fn refund_and_close(&mut self) -> Result<()> {
        let id_bytes = self.offer.id.to_le_bytes();
        let bump_bytes = [self.offer.bump];
        let signer_seeds: &[&[u8]] = &[
            b"offer",
            &id_bytes,
            &bump_bytes,
            ];
        
        let signer_seeds_array: &[&[&[u8]]] = &[signer_seeds];


        // Transfer tokens back from vault to maker
        let transfer_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.maker_ata_a.to_account_info(),
            authority: self.offer.to_account_info(),
        };
        
        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            transfer_accounts,
            &signer_seeds_array,
        );

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        // Close the vault account, return lamports to maker
        let close_accounts = CloseAccount {
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
            authority: self.offer.to_account_info(),
        };

        let close_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            close_accounts,
            &signer_seeds_array,
        );

        close_account(close_ctx)?;

        Ok(())
    }
}
