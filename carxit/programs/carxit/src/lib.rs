#![allow(unexpected_cfgs, deprecated)]
use anchor_lang::prelude::*;

// Import modules
mod instructions;
mod state;
mod error;

// Import account context structs
use instructions::*;
use instructions::carbon_token::{InitializeToken, MintToken, RetireToken};
use instructions::carbon_market::{ListCredit, InitializeEscrow, ConfirmEscrow, RefundEscrow};
use state::*;
use error::CarxitError;

declare_id!("9z9vKD4orxyW5XYj1mKVhyUJGafukK8uQKgh4TARPGm");

#[program]
pub mod carxit {
    use super::*;

    pub fn initialize_token(ctx: Context<InitializeToken>, project_id: String, co2e: u64) -> Result<()> {
        instructions::carbon_token::initialize_token(ctx, project_id, co2e)
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        instructions::carbon_token::mint_token(ctx, amount)
    }

    pub fn retire_token(ctx: Context<RetireToken>, amount: u64) -> Result<()> {
        instructions::carbon_token::retire_token(ctx, amount)
    }

    pub fn list_credit(ctx: Context<ListCredit>, price: u64) -> Result<()> {
        instructions::carbon_market::list_credit(ctx, price)
    }

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, sol_amount: u64) -> Result<()> {
        instructions::carbon_market::initialize_escrow(ctx, sol_amount)
    }

    pub fn confirm_escrow(ctx: Context<ConfirmEscrow>) -> Result<()> {
        instructions::carbon_market::confirm_escrow(ctx)
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        instructions::carbon_market::refund_escrow(ctx)
    }
}