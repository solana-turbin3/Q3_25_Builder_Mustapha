use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Transfer, transfer, Mint, Token, TokenAccount, MintTo, mint_to}};
use constant_product_curve::ConstantProduct;


use crate::{state::Config, error::AmmError};

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"lp", config.key().as_ref()],
        bump = config.lp_bump,
    )]
    pub mint_lp: Account<'info, Mint>,

    #[account(
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"config", config.seed.to_le_bytes().as_ref()],
        bump = config.config_bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        associated_token::mint = config.mint_x,
        associated_token::authority = config,
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = config.mint_y,
        associated_token::authority = config,
    )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_x,
        associated_token::authority = user,
    )]
    pub user_x: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_y,
        associated_token::authority = user,
    )]
    pub user_y: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint_lp,
        associated_token::authority = user,
    )]
    pub user_lp: Account<'info, TokenAccount>,


    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount:u64, max_x:u64, max_y:u64) -> Result<()> {
        //security check to make sure the pool is not locked, and reject zero amounts.
        require!(
            self.config.locked == false, AmmError::PoolLocked);
        require!( amount != 0, AmmError::InvalidAmount);

        let (x, y) = match self.mint_lp.supply == 0 && self.vault_x.amount == 0 && self.vault_y.amount == 0 {
            true => (max_x, max_y), // first deposit, use max_x and max_y
            false => {
                let amount = ConstantProduct::xy_deposit_amounts_from_l(
                    self.vault_x.amount,
                    self.vault_y.amount,
                    self.mint_lp.supply,
                    amount,
                    6).unwrap();
                    (amount.x, amount.y)
            }
        };
        require!(x<=max_x && y<=max_y, AmmError::SlippageExceeded);// when the indicate a need for more tokens the what the user agreed to.

        // where tokens transfer from the user to the vaults happens.
        self.deposit_tokens(true, x);
        self.deposit_tokens(false, y);

        self.mint_lp_tokens(amount)

    }

    pub fn deposit_tokens(&self, is_x:bool, amount:u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (&self.user_x, &self.vault_x),
            false => (&self.user_y, &self.vault_y),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: from.to_account_info(),
            to: to.to_account_info(),
            authority: self.user.to_account_info(),
        };

        let ctx =  CpiContext::new(cpi_program, cpi_accounts);
        transfer(ctx, amount)
    }
    
    pub fn mint_lp_tokens(&self, amount:u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = MintTo {
            mint: self.mint_lp.to_account_info(),
            to: self.user_lp.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let config_seed = self.config.seed.to_le_bytes();
        let seeds = &[b"config", &config_seed[..], &[self.config.config_bump]];
        let signer_seeds = &[&seeds[..]];


        let ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        mint_to(ctx, amount)
    }
}