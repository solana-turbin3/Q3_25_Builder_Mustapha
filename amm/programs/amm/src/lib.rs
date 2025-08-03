use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;
pub mod constants;

pub use instructions::*;
pub use state::*;
pub use constants::*;

declare_id!("9FP7Q2PdN9n2pBVg7zvGWs2ELFeNDoAGhnD3EV9KWRTF");



#[program]
pub mod amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, seed: u64, fee: u16, authority: Option<Pubkey>) -> Result<()> {
        ctx.accounts.init(seed, fee, authority,ctx.bumps)
    }

    pub fn deposit(ctx:Context<Deposit>, amount: u64, max_x: u64, max_y: u64 ) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.withdraw(amount)
    }
}