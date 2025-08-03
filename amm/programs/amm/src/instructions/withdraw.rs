use anchor_lang::prelude::*;
use anchor_spl::{associated_token, token, 
    token::{Mint, TokenAccount, Token, Burn, Transfer, burn}
};

use crate::state::Config;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub config: Account<'info, Config>,

    // vaults to withdraw tokens from
    #[account(mut)]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_y: Account<'info, TokenAccount>,

    //user token account to recive withdrawn tokens
    #[account(mut)]
    pub user_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_y: Account<'info, TokenAccount>,

    // user token account to burn LP tokens
    #[account(mut)]
    pub lp_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_lp: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,

}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&self, amount: u64) -> Result<()> {
        self.burn_lp_tokens(amount)?;
        self.transfer_tokens(true, amount)?;
        self.transfer_tokens(false, amount)?;
        Ok(())
    }

    pub fn burn_lp_tokens(&self, amount: u64) -> Result<()> {
        // burn LP tokens from the user
        let cpi_ctx = CpiContext::new(
            self.token_program.to_account_info(),
            Burn {   
            mint: self.lp_mint.to_account_info(),
            from: self.user_lp.to_account_info(),
            authority: self.authority.to_account_info(),
        },
    );
        token::burn(cpi_ctx, amount)?;

        Ok(())
    }

    // transfer tokens from vaults to user accounts
    pub fn transfer_tokens(&self, is_x: bool, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = if is_x {
            Transfer {
                from: self.vault_x.to_account_info(),
                to: self.user_x.to_account_info(),
                authority: self.config.to_account_info(),
            }
        } else {
            Transfer {
                from: self.vault_y.to_account_info(),
                to: self.user_y.to_account_info(),
                authority: self.config.to_account_info(),
            }
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        Ok(())    
    }
}