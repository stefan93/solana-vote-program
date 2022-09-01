use std::{convert::TryInto};
use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction, rent::Rent, sysvar::Sysvar,
};

use crate::{
    instruction::{VotingOption, VotingProgramInstruction},
    state::VotingAccount,
};

pub struct Processor;

impl Processor {
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

        msg!("Instruction unpacked");

        match instruction {
            VotingProgramInstruction::CreateVoting {
                voting_uid,
                voting_name,
                voting_options,
            } => {
                msg!("Instruction CreateVoting");

                let acc_iter = &mut accounts.iter();
                let owner = next_account_info(acc_iter)?;
                let pda = next_account_info(acc_iter)?;
                let sys_program = next_account_info(acc_iter)?;

                Processor::process_create_voting(
                    program_id,
                    voting_uid,
                    voting_name,
                    voting_options,
                    owner,
                    pda,
                    sys_program,
                )?;
            }
            VotingProgramInstruction::Vote { voting_option_id } => {
                msg!("Instruction Vote");

                let acc_iter = &mut accounts.iter();
                let voter= next_account_info(acc_iter)?;
                let owner = next_account_info(acc_iter)?;
                let voting_pda = next_account_info(acc_iter)?;

                Processor::process_vote(program_id,
                    voter, 
                    owner,
                    voting_pda, 
                    voting_option_id
                )?;
            },
        }
        Ok(())
    }

    fn process_create_voting<'a>(
        program_id: &Pubkey,
        voting_uid: String,
        voting_name: String,
        voting_options: Vec<VotingOption>,
        owner: &'a AccountInfo<'a>,
        pda: &'a AccountInfo<'a>,
        sys_program: &'a AccountInfo<'a>,
    ) -> ProgramResult {
        if !owner.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let (pda_pubkey, bump_seed) =
            Pubkey::find_program_address(&[&owner.key.to_bytes()[..32]], program_id);
        msg!("pda pubkey {}, bump {}", pda_pubkey.to_string(), bump_seed);

        if !pda_pubkey.eq(pda.key) {
            return Err(ProgramError::InvalidAccountData);
        }

        let mut voting_account;

        if !pda.data_is_empty() {
            return Err(ProgramError::AccountAlreadyInitialized);
        } else {
            // create pda data
            voting_account = VotingAccount {
                uid: voting_uid,
                voting_name: voting_name,
                voting_options: Vec::new(),
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
    
            let size_of_acc_data = voting_account.calculate_borsh_size();
            
            let min_lamp = Rent::get()?.minimum_balance(size_of_acc_data);
    
            msg!("Size of acc data {}", size_of_acc_data);
            let create_acc_ins = system_instruction::create_account(
                owner.key,
                &pda_pubkey,
                min_lamp,
                size_of_acc_data.try_into().unwrap(),
                program_id,
            );
    
            msg!("Invoking signed create account");
            invoke_signed(
                &create_acc_ins,
                &[pda.clone(), owner.clone(), sys_program.clone()],
                &[&[&owner.key.to_bytes()[..32], &[bump_seed]]],
            )?;
        }




        voting_account.serialize(&mut pda.try_borrow_mut_data()?.as_mut())?;


        Ok(())
    }

    fn process_vote<'a> (
        program_id: &Pubkey,
        voter: &'a AccountInfo<'a>,
        owner: &'a AccountInfo<'a>,
        voting_pda: &'a AccountInfo<'a>,
        voting_option_id: u8
    ) -> ProgramResult {
        
        if !voter.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let (pda_pubkey, bump_seed) =
        Pubkey::find_program_address(&[&owner.key.to_bytes()[..32]], program_id);
        msg!("pda pubkey {}, bump {}", pda_pubkey.to_string(), bump_seed);

        if !pda_pubkey.eq(voting_pda.key) {
            return Err(ProgramError::InvalidAccountData);
        }

        if voting_pda.data_is_empty() {
            return Err(ProgramError::UninitializedAccount);
        }

        // read voting pda data
        let mut voting_account = VotingAccount::try_from_slice(&mut voting_pda.data.borrow_mut())?;

        let target_index = voting_account.voting_options.binary_search_by(|probe| probe.option_id.cmp(&voting_option_id))
        .map_err(|_e| ProgramError::InvalidInstructionData)?;

        

        msg!("Current vote data {:?}", voting_account);

        voting_account.voting_options[target_index].counter += 1;

        
        // write data
        voting_account.serialize(&mut voting_pda.data.borrow_mut().as_mut())?;



        Ok(())
    }

}

