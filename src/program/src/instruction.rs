use std::{fmt::Debug};
use borsh::BorshDeserialize;
use solana_program::{clock::UnixTimestamp, account_info::{AccountInfo, next_account_info}, program_error::ProgramError, system_program, msg};

use crate::{Validate};


#[derive(BorshDeserialize, Debug)]
pub enum VotingProgramInstruction {
    CreateVoting {
        voting_uid: String,
        voting_name: String,
        start_date: UnixTimestamp,
        end_date: UnixTimestamp,
        voting_options: Vec<VotingOption>
    },
    Vote {
        voting_option_id: u8
    }
}

#[derive(BorshDeserialize, Debug)]
pub struct VotingOption {
    pub counter: u32,
    pub id: u8,
    pub description: String
}


// Create Voting Instruction Accounts
pub struct CreateVotingAccounts<'a> {
    pub owner: &'a AccountInfo<'a>,
    pub pda: &'a AccountInfo<'a>,
    pub sys_program: &'a AccountInfo<'a>,
} 

impl CreateVotingAccounts<'_> {
    
    pub fn new<'a>(accounts: &'a [AccountInfo<'a>]) -> Result<CreateVotingAccounts<'a>, ProgramError> {
        let acc_iter = &mut accounts.iter();

        return Ok(CreateVotingAccounts {
            owner: next_account_info(acc_iter)?,
            pda: next_account_info(acc_iter)?,
            sys_program: next_account_info(acc_iter)?,
        });
    }
}

impl Validate for CreateVotingAccounts<'_> {
    fn validate(&self) -> Result<(), solana_program::program_error::ProgramError> {
        
        if !self.owner.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if !self.pda.data_is_empty() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        if self.sys_program.key != &system_program::ID {
            msg!("Invalid program_id for system_program");
            return Err(ProgramError::InvalidAccountData);
        }

        Ok(())
    }
}


// Vote Instruction Accounts
pub struct VoteAccounts<'a> {
    pub voter: &'a AccountInfo<'a>,
    pub owner: &'a AccountInfo<'a>, 
    pub voting_pda: &'a AccountInfo<'a>
}

impl VoteAccounts<'_> {
    pub fn new<'a>(accounts: &'a [AccountInfo<'a>]) -> Result<VoteAccounts, ProgramError> {
        let acc_iter = &mut accounts.iter();

        Ok(
            VoteAccounts {
                voter: next_account_info(acc_iter)?,
                owner: next_account_info(acc_iter)?,
                voting_pda: next_account_info(acc_iter)?,
            }
        )
    }
}


impl Validate for VoteAccounts<'_> {
    fn validate(&self) -> Result<(), ProgramError> {
        if !self.voter.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if self.voting_pda.data_is_empty() {
            return Err(ProgramError::UninitializedAccount);
        }

        Ok(())
    }
}

