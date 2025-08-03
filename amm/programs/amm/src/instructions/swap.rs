use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::{state::Config, error::AmmError};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_y: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Swap<'info> {
    pub fn swap(&mut self, amount_in: u64, is_x_to_y: bool) -> Result<()> {
        // Load reserves
        let reserve_x = self.vault_x.amount;
        let reserve_y = self.vault_y.amount;

        // Input validation
        require!(amount_in > 0, AmmError::InvalidAmount);

        // Apply fee if set (e.g., 0.3% = 30 in basis points)
        let fee_bps = self.config.fee as u128;
        let amount_in_less_fee = amount_in as u128 * (10_000 - fee_bps) / 10_000;

        // Calculate amount_out using constant product formula
        let (amount_out, from, to, user_from, user_to) = if is_x_to_y {
            let amount_out = get_amount_out(amount_in_less_fee, reserve_x, reserve_y)?;
            (amount_out, &self.vault_x, &self.vault_y, &self.user_x, &self.user_y)
        } else {
            let amount_out = get_amount_out(amount_in_less_fee, reserve_y, reserve_x)?;
            (amount_out, &self.vault_y, &self.vault_x, &self.user_y, &self.user_x)
        };

        // Transfer from user to vault (token in)
        let cpi_ctx_in = CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: user_from.to_account_info(),
                to: from.to_account_info(),
                authority: self.user.to_account_info(),
            },
        );
        token::transfer(cpi_ctx_in, amount_in)?;

        // Transfer from vault to user (token out)
        let bump = self.config.bump;
        let seeds = &[b"config", &[bump]];
        let signer = &[&seeds[..]];

        let cpi_ctx_out = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            Transfer {
                from: to.to_account_info(),
                to: user_to.to_account_info(),
                authority: self.config.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx_out, amount_out as u64)?;

        Ok(())
    }
}

// Util function for price calculation (Uniswap-style)
fn get_amount_out(amount_in: u128, reserve_in: u64, reserve_out: u64) -> Result<u64> {
    require!(reserve_in > 0 && reserve_out > 0, AmmError::InvalidReserves);

    let numerator = amount_in * reserve_out as u128;
    let denominator = reserve_in as u128 + amount_in;
    let amount_out = numerator / denominator;

    Ok(amount_out as u64)
}
