use anchor_lang::prelude::*;

declare_id!("DhmZNmbCM8G4hBB3gaXAKy6FokqSPygYe3UicYxyZG9Z");

#[program]
pub mod anchor_nft_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
