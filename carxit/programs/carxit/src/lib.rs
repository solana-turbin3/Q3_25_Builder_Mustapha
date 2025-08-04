use anchor_lang::prelude::*;


pub use crate::instruction::*;
pub use crate::state::*;
pub use crate::error::CarxitError;

declare_id!("3GPVnk3jdqzYnjs9DWUXoVFjveJeGjybUtbBTekXDABa");

#[program]
pub mod carxit {
    use super::*;

    pub fn initialize_token(ctx: Context<InitializeToken>, project_id: String, co2e: u64) -> Result<()> {
        carbon_token::initialize_token(ctx, project_id, co2e)
    }

    pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
        carbon_token::mint_token(ctx, amount)
    }

    pub fn retire_token(ctx: Context<RetireToken>, amount: u64) -> Result<()> {
        carbon_token::retire_token(ctx, amount)
    }

    pub fn list_credit(ctx: Context<ListCredit>, price: u64) -> Result<()> {
        carbon_market::list_credit(ctx, price)
    }

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>, sol_amount: u64) -> Result<()> {
        carbon_market::initialize_escrow(ctx, sol_amount)
    }

    pub fn confirm_escrow(ctx: Context<ConfirmEscrow>) -> Result<()> {
        carbon_market::confirm_escrow(ctx)
    }

    pub fn refund_escrow(ctx: Context<RefundEscrow>) -> Result<()> {
        carbon_market::refund_escrow(ctx)
    }
}

pub mod instruction {
    pub use super::carbon_token::*;
    pub use super::carbon_market::*;
}

pub mod state {
    pub use super::project::*;
    pub use super::listing::*;
    pub use super::escrow::*;
}

pub mod error;
pub mod carbon_token;
pub mod carbon_market;