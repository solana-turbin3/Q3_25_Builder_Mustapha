#![allow(deprecated)]
#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod instructions;
pub mod states;

pub use instructions::*;
pub use states::*;

// use crate::instructions::*;
// use crate::states::*;

declare_id!("79p2LqH7nZagKSmPZGGrVgBRh78mMKPn9PA4aKcRrbqg");

#[program]
pub mod anchor_vault_q3 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(ctx.bumps)
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
