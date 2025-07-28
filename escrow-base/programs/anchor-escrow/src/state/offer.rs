use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Offer {
    pub id: u64,            // Unique offer ID
    pub maker: Pubkey,      // Wallet address of the maker
    pub mint_a: Pubkey,     // Token mint the maker is offering
    pub mint_b: Pubkey,     // Token mint the maker wants
    pub receive: u64,       // Amount the maker wants to receive
    pub bump: u8,           // Bump for the PDA
}
