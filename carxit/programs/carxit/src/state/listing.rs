use anchor_lang::prelude::*;

#[account]
pub struct Listing {
    pub seller: Pubkey,
    pub credit_token: Pubkey,
    pub price: u64,
}
