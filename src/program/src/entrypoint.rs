use std::ascii::escape_default;


use solana_program::{
    account_info::AccountInfo,
    entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
    msg, declare_id
};

use crate::{processor::Processor};

declare_id!("AYJ7F7tPhvUu6gUucew7AJqhasTEx8tH3UF9GAuyfQQz");

entrypoint!(process_instruction);

fn process_instruction<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("program_id: {}", program_id);
    msg!("data: {}", show(instruction_data));

    if let Err(error) = Processor::process_instruction(program_id, accounts, instruction_data) {
        msg!("Error {:?}", error);
        return Err(error);
    }
    
    Ok(())
}

pub fn show<B: AsRef<[u8]>>(buf: B) -> String {
    String::from_utf8(
        buf.as_ref()
           .iter()
           .map(|b| escape_default(*b))
           .flatten()
           .collect(),
    ).unwrap()
}