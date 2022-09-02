//! Error types

use num_derive::FromPrimitive;
use solana_program::{
    decode_error::DecodeError,
    msg,
    program_error::{PrintProgramError, ProgramError},
};
use thiserror::Error;

/// Errors that may be returned by the Token program.
#[derive(Clone, Debug, Eq, Error, FromPrimitive, PartialEq)]
pub enum VoteProgramError {
    #[error("Lamport balance below rent-exempt threshold")]
    NotRentExempt,
    #[error("Pda key missmatch")]
    WrongPdaKey,
    #[error("StartVotindDateInPast")]
    StartVotindDateInPast,
    #[error("StartVotingDateAfterEndDate")]
    StartVotingDateAfterEndDate,
    #[error("VotingNotStartedYet")]
    VotingNotStartedYet,
    #[error("VotingExpired")]
    VotingExpired,
}


impl From<VoteProgramError> for ProgramError {
    fn from(e: VoteProgramError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
impl<T> DecodeError<T> for VoteProgramError {
    fn type_of() -> &'static str {
        "VoteProgramError"
    }
}

impl PrintProgramError for VoteProgramError {
    fn print<E>(&self)
    where
        E: 'static
            + std::error::Error
            + DecodeError<E>
            + PrintProgramError
            + num_traits::FromPrimitive,
    {
        match self {
            VoteProgramError::NotRentExempt => msg!("NotRentExempt"),
            VoteProgramError::WrongPdaKey => msg!("WrongPdaKey"),
            VoteProgramError::StartVotindDateInPast => msg!("StartVotindDateInPast"),
            VoteProgramError::StartVotingDateAfterEndDate => msg!("StartVotingDateAfterEndDate"),
            VoteProgramError::VotingNotStartedYet => msg!("VotingNotStartedYet"),
            VoteProgramError::VotingExpired => msg!("VotingExpired"),
        }
    }
}
