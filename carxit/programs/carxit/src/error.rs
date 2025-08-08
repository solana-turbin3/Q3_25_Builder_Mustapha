use anchor_lang::prelude::*;

#[error_code]
pub enum CarxitError {
    #[msg("Project is not verified")]
    UnverifiedProject,

    #[msg("Insufficient SOL price for purchase")]
    InsufficientPrice,

    #[msg("Escrow not confirmed by both parties")]
    EscrowNotConfirmed,
}
