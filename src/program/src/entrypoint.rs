use std::ascii::escape_default;


use borsh::BorshDeserialize;
use solana_program::{
    account_info::{AccountInfo},
    entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
    msg, declare_id, program_error::{PrintProgramError, ProgramError}
};

use crate::{processor::Processor, errors::VoteProgramError, instruction::{VotingProgramInstruction, CreateVotingAccounts, VoteAccounts}};

declare_id!("AYJ7F7tPhvUu6gUucew7AJqhasTEx8tH3UF9GAuyfQQz");

entrypoint!(program_entrypoint);

fn program_entrypoint<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("program_id: {}", program_id);
    // msg!("data: {}", show(instruction_data));

    if let Err(error) = process_instruction(program_id, accounts, instruction_data) {
        error.print::<VoteProgramError>();
        return Err(error);
    }
    
    Ok(())
}

pub fn process_instruction<'a>(
    program_id: &Pubkey,
    accounts: &'a [AccountInfo<'a>],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Beginning processing");
    let instruction =
        VotingProgramInstruction::try_from_slice(instruction_data).map_err(|e| {
            msg!("Error {:?}", e);
            return ProgramError::InvalidInstructionData;
        })?;

    msg!("Instruction unpacked {:?}", instruction);

    match instruction {
        VotingProgramInstruction::CreateVoting {
            voting_uid,
            voting_name,
            voting_options,
            start_date,
            end_date,
        } => {
            msg!("Instruction CreateVoting");
            
            Processor::process_create_voting(
                program_id,
                &voting_uid,
                voting_name,
                voting_options,
                start_date,
                end_date,
                CreateVotingAccounts::new(accounts)?
            )?;
        }
        VotingProgramInstruction::Vote { voting_option_id } => {
            msg!("Instruction Vote");

            Processor::process_vote(
                program_id,
                voting_option_id,
                VoteAccounts::new(accounts)?
            )?;
        }
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