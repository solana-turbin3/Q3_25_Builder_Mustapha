use crate::states::VaultState;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};

#[derive(Accounts)]
pub struct Deposit<'info> {
    //mut is required cause the account will decrease their SOL
    #[account(mut)]
    pub user: Signer<'info>,
    //users PDA metadata account must match the one created during initailize
    #[account(
        seeds = [b"state", user.key().as_ref()],
        bump = state.state_bump,
    )]
    pub state: Account<'info, VaultState>,

    //PDA where the SOL is deposited, it is marked mut cause the balance will increase.
    #[account(
        mut,
        seeds = [b"vault", state.key().as_ref()],
        bump = state.vault_bump,
    )]

    pub vault: SystemAccount<'info>,
    //system program to incoke native sol transfers using CPI.
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    //logic that defines how it accepts amount in lamports (1 SOL =  1,000,000,000).
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        //creates a Cross Program Invocation context for the system program.
        // this will allow anchor to call transfer() as if it were running system program code.
        let cpi_program = self.system_program.to_account_info();
        let accounts = Transfer {
            from: self.user.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, accounts);

        //transfer of SOL from user -> vault.
        // it fails if there is an error or if a user dosent have enough lampors.
        transfer(cpi_ctx, amount)?;

        Ok(())
    }
}