use std::{fmt::Debug};
use borsh::BorshDeserialize;
use solana_program::clock::UnixTimestamp;


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
pub struct  VotingOption {
    pub counter: u32,
    pub id: u8,
    pub description: String
}