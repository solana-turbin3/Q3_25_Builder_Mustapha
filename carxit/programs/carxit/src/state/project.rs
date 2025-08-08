use anchor_lang::prelude::*;

#[account]
pub struct Project {
    pub project_id: String,
    pub co2e: u64,
    pub verified: bool,
}
