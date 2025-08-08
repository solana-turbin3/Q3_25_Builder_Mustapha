use anchor_lang::prelude::*;
use super::InitializeToken;
use crate::state::Project;

pub fn initialize_token(ctx: Context<InitializeToken>, project_id: String, co2e: u64) -> Result<()> {
    let project = &mut ctx.accounts.project;
    project.project_id = project_id;
    project.co2e = co2e;
    project.verified = true; // Mock verification for POC
    Ok(())
}
