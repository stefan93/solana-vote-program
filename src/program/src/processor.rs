use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar, clock::{Clock, UnixTimestamp},
};
use std::{convert::TryInto};

use crate::{
    instruction::{VotingOption, VotingProgramInstruction},
    state::{VotingAccount}, errors::VoteProgramError,
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

                let acc_iter = &mut accounts.iter();
                let owner = next_account_info(acc_iter)?;
                let pda = next_account_info(acc_iter)?;
                let sys_program = next_account_info(acc_iter)?;

                Processor::process_create_voting(
                    program_id,
                    &voting_uid,
                    voting_name,
                    voting_options,
                    start_date,
                    end_date,
                    owner,
                    pda,
                    sys_program,
                )?;
            }
            VotingProgramInstruction::Vote { voting_option_id } => {
                msg!("Instruction Vote");

                let acc_iter = &mut accounts.iter();
                let voter = next_account_info(acc_iter)?;
                let owner = next_account_info(acc_iter)?;
                let voting_pda = next_account_info(acc_iter)?;

                Processor::process_vote(program_id, voter, owner, voting_pda, voting_option_id)?;
            }
        }
        Ok(())
    }

    fn process_create_voting<'a>(
        program_id: &Pubkey,
        voting_uid: &String,
        voting_name: String,
        voting_options: Vec<VotingOption>,
        start_date: UnixTimestamp,
        end_date: UnixTimestamp,
        owner: &'a AccountInfo<'a>,
        pda: &'a AccountInfo<'a>,
        sys_program: &'a AccountInfo<'a>,
    ) -> ProgramResult {
        if !owner.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let (pda_pubkey, bump_seed) = Self::get_voting_pda_and_bump(owner, &voting_uid, program_id);

        msg!("pda pubkey {}, bump {}", pda_pubkey.to_string(), bump_seed);

        if !pda_pubkey.eq(pda.key) {
            return Err(VoteProgramError::WrongPdaKey.into());
        }

        if !pda.data_is_empty() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        let clock = Clock::get()?;
        let now = clock.unix_timestamp;

        if start_date.lt(&now) {
            msg!("Start date in past");
            return Err(VoteProgramError::StartVotindDateInPast.into());
        }

        if start_date.gt(&end_date) {
            msg!("Start date after end date");
            return Err(VoteProgramError::StartVotingDateAfterEndDate.into());
        }

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
        
        let bump = &[bump_seed];
        let pda_sign_seed = Self::get_pda_sign(owner.key.as_ref(), voting_uid, bump);

        invoke_signed(
            &create_acc_ins,
            &[pda.clone(), owner.clone(), sys_program.clone()],
            &[&pda_sign_seed],
        )?;

        voting_account.serialize(&mut pda.try_borrow_mut_data()?.as_mut())?;

        Ok(())
    }

    fn process_vote<'a>(
        program_id: &Pubkey,
        voter: &'a AccountInfo<'a>,
        owner: &'a AccountInfo<'a>,
        voting_pda: &'a AccountInfo<'a>,
        voting_option_id: u8,
    ) -> ProgramResult {

        if !voter.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        if voting_pda.data_is_empty() {
            return Err(ProgramError::UninitializedAccount);
        }

        // read voting pda data
        let mut voting_account = VotingAccount::try_from_slice(&mut voting_pda.data.borrow_mut())?;

        let (pda_pubkey, _bump_seed) = Self::get_voting_pda_and_bump(owner, &voting_account.uid, program_id);

        if !pda_pubkey.eq(voting_pda.key) {
            return Err(VoteProgramError::WrongPdaKey.into());
        }

        let target_index = voting_account
            .voting_options
            .binary_search_by(|probe| probe.option_id.cmp(&voting_option_id))
            .map_err(|_e| ProgramError::InvalidInstructionData)?;

        msg!("Current vote data {:?}", voting_account);

        let clock = Clock::get()?;
        let now_ts = clock.unix_timestamp;

        if voting_account.start_date.gt(&now_ts) {
            return Err(VoteProgramError::VotingNotStartedYet.into());
        }

        if voting_account.end_date.lt(&now_ts) {
            return Err(VoteProgramError::VotingExpired.into());
        }


        voting_account.voting_options[target_index].counter += 1;

        // write data
        voting_account.serialize(&mut voting_pda.data.borrow_mut().as_mut())?;

        Ok(())
    }

    fn get_voting_pda_and_bump(owner: &AccountInfo, voting_uid: &String, program_id: &Pubkey) -> (Pubkey, u8) {

        let seeds = Self::get_seed(owner.key.as_ref(), voting_uid);  
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

}
