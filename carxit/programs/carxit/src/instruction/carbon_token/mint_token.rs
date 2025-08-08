use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo};
use super::MintToken;
use crate::state::Project;
use crate::CarxitError;

pub fn mint_token(ctx: Context<MintToken>, amount: u64) -> Result<()> {
    require!(ctx.accounts.project.verified, CarxitError::UnverifiedProject);
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            &[&[b"mint_authority", &[ctx.bumps.mint_authority]]],
        ),
        amount,
    )?;
    Ok(())
}
