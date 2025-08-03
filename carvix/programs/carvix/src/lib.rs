use anchor_lang::prelude::*;

declare_id!("AJy3SmNCcKiwJPjHKD3pGXeGspby93mjdQwfxAi8kxSt");

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
