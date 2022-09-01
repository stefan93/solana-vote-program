use std::fmt::{Formatter, Display, self};

use borsh::BorshDeserialize;

#[derive(BorshDeserialize, Debug)]
pub enum VotingProgramInstruction {
    CreateVoting {
        voting_uid: String,
        voting_name: String,
        voting_options: Vec<VotingOption>,
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


impl Display for VotingProgramInstruction {
    fn fmt(&self, f: &mut Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}
