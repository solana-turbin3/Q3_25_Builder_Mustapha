use anchor_lang::prelude::*;

declare_id!("CN5cQDV3qzYqhr8e8F8RfbD3r85vwZt3ipRhX15rTQC3");

#[program]
pub mod carvix {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
