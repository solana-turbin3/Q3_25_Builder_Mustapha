use anchor_lang::prelude::*;

mod instructions;
mod states;

use crate::instructions::*;

declare_id!("2aHq1dg44vmdxxBuzPqw2jZTGMtvex12Kt3dqmHqe93U");

#[program]
pub mod anchor_vault_q3 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps);
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount:u64) -> Result<()> {
        ctx.accounts.withdraw(amount)
    }
    
    pub fn close(ctx: Context<Close>) -> Result<()> {
        ctx.accounts.close()
    }
}

