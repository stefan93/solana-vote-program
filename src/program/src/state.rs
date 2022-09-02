use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;
use solana_program::clock::UnixTimestamp;



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

