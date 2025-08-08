use anchor_lang::prelude::*;
use super::ListCredit;
use crate::state::Listing;

pub fn list_credit(ctx: Context<ListCredit>, price: u64) -> Result<()> {
    let listing = &mut ctx.accounts.listing;
    listing.seller = ctx.accounts.seller.key();
    listing.credit_token = ctx.accounts.credit_token.key();
    listing.price = price;
    Ok(())
}
