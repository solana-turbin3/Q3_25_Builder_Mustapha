use anchor_lang::prelude::*;

declare_id!("3GPVnk3jdqzYnjs9DWUXoVFjveJeGjybUtbBTekXDABa");

#[program]
pub mod carxit {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
