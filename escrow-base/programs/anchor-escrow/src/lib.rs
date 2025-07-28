#![allow(unexpected_cfgs, deprecated)]

use anchor_lang::prelude::*;

declare_id!("8xhmtQtUZN1AgZNE2ZeNPz3UQ7JeoYWKcH67orZpwzbv");

pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn make_offer(ctx: Context<MakeOffer>, deposit: u64, receive: u64) -> Result<()> {
        instructions::make::make_offer(ctx, deposit, receive)
    }

    pub fn take_offer(ctx: Context<TakeOffer>, deposit: u64) -> Result<()> {
        instructions::take_offer::take_offer(ctx, deposit)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close()
        // instructions::take_offer::refund_and_close(ctx)
    }
}
