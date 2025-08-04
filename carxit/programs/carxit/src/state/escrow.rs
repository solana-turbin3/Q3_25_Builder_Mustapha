use anchor_lang::prelude::*;

#[account]
pub struct Escrow {
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub credit_token: Pubkey,
    pub sol_amount: u64,
    pub buyer_confirmed: bool,
    pub seller_confirmed: bool,
}