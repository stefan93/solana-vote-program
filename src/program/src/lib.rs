use solana_program::{program_error::ProgramError, account_info::AccountInfo, pubkey::Pubkey};

pub mod entrypoint;
pub mod processor;
pub mod state;
pub mod instruction;
pub mod errors;

pub trait Validate {
    fn validate(&self) -> Result<(), ProgramError>;
}

fn get_voting_pda_and_bump(owner: &AccountInfo, voting_uid: &String, program_id: &Pubkey) -> (Pubkey, u8) {

    let seeds = get_seed(owner.key.as_ref(), voting_uid);  
    return Pubkey::find_program_address(&seeds, program_id);
}

fn get_seed<'a>(owner_key_bytes: &'a[u8], voting_uid: &'a String,) -> [&'a [u8]; 3] { 
    [
        owner_key_bytes, 
        voting_uid.as_bytes(), 
        b"voting"
    ]
}

fn get_pda_sign<'a>(owner_key_bytes: &'a[u8], voting_uid: &'a String, bump: &'a[u8]) -> [&'a [u8]; 4] { 
    [
        owner_key_bytes, 
        voting_uid.as_bytes(), 
        b"voting",
        bump
    ]
}