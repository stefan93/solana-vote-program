use std::collections::HashSet;

use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;
use solana_program::{clock::{UnixTimestamp, Clock}, program_error::ProgramError, sysvar::Sysvar};

use crate::{errors::VoteProgramError, instruction, Validate};



#[derive(BorshSerialize, BorshDeserialize, BorshSize, Debug)]
pub struct VotingAccount {
    pub uid: String,
    pub voting_name: String,
    pub start_date: UnixTimestamp,
    pub end_date: UnixTimestamp,
    pub voting_options: Vec<VotingOption>,
}

#[derive(BorshSerialize, BorshDeserialize, BorshSize, Debug)]
pub struct VotingOption {
    pub counter: u32,
    pub option_id: u8,
    pub option_description: String,
}

impl VotingAccount {
    pub fn new(voting_uid: String, voting_name: String, start_date: UnixTimestamp, end_date: UnixTimestamp,
         voting_options: Vec<instruction::VotingOption>) -> Self {
        let mut voting_account = VotingAccount {
            uid: voting_uid.to_string(),
            voting_name: voting_name,
            voting_options: Vec::new(),
            start_date: start_date,
            end_date: end_date,
        };

        for input_vo in voting_options {
            voting_account
                .voting_options
                .push(crate::state::VotingOption {
                    option_id: input_vo.id,
                    option_description: input_vo.description,
                    counter: 0,
                });
        }

        voting_account
    }
}

impl Validate for VotingAccount {
    fn validate(&self) -> Result<(), ProgramError> {
        if self.uid.trim().is_empty() {
            return Result::Err(ProgramError::InvalidArgument);
        }

        if self.voting_name.trim().is_empty() {
            return Result::Err(ProgramError::InvalidArgument);
        }

        if self.voting_options.is_empty() {
            return Result::Err(ProgramError::InvalidArgument);
        }

        let now = Clock::get()?.unix_timestamp;
        if self.start_date.lt(&now) {
            return Err(VoteProgramError::StartVotindDateInPast.into());
        }

        if self.start_date >= self.end_date {
            return Result::Err(VoteProgramError::StartVotingDateAfterEndDate.into());
        }

        if let Err(err) = self.voting_options.validate() {
            return Result::Err(err);
        };

        Result::Ok(())
    }
}

impl Validate for Vec<VotingOption> {
    fn validate(&self) -> Result<(), ProgramError> {
        if self.is_empty() {
            return Result::Err(ProgramError::InvalidArgument);
        }

        let mut option_ids_set = HashSet::<u8>::new();

        for opt in self {
            let unique_opt_id = option_ids_set.insert(opt.option_id);

            if !unique_opt_id {
                return Result::Err(ProgramError::InvalidArgument);
            }

            if let Err(err) = opt.validate() {
                return Result::Err(err)
            } 
        }

        Ok(())
    }
}

impl Validate for VotingOption {
    fn validate(&self) -> Result<(), ProgramError> {
        if self.option_description.trim().is_empty() {
            return Result::Err(ProgramError::InvalidArgument);
        }

        Ok(())
    }
}

