use anchor_lang::prelude::*;


use crate::state::StakeConfig;

#[derive[Accounts]]
pub struct InitailizeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account{
        init,
        payer = admin,
        seeds = [b"config"],
        bump,
        space = 8 + StakeConfig::INIT_SPACE,
    }]
    pub config: Account<'info, StakeConfig>,
    #[account{
        init,
        payer = admin,
        seeds = [b"rewards", config.key().as_ref()],
        bump,
        mint: decimal,
        mint
        
    }]
    pub rewards_mint: Account<'info, Mint>,
    pub rewards_mint: Account<'info, System>,
    pub token_programs: program<'info, Token>,

}

impl