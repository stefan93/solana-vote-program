use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;


#[derive(BorshSerialize, BorshDeserialize, BorshSize, Debug)]
pub struct VotingAccount {
    pub uid: String,
    pub voting_name: String,
    pub voting_options: Vec<VotingOption>,
}

#[derive(BorshSerialize, BorshDeserialize, BorshSize, Debug)]
pub struct VotingOption {
    pub counter: u32,
    pub option_id: u8,
    pub option_description: String,
}
