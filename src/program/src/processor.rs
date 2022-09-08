use borsh::{BorshDeserialize, BorshSerialize};
use borsh_size::BorshSize;
use solana_program::{
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction::{self},
    sysvar::Sysvar, clock::{Clock, UnixTimestamp}, account_info::AccountInfo,
};
use std::{convert::TryInto};

use crate::{
    instruction::{VotingOption, CreateVotingAccounts, VoteAccounts},
    state::{VotingAccount}, errors::VoteProgramError, get_voting_pda_and_bump, get_pda_sign, Validate,
};


pub struct Processor;

impl Processor {

    pub fn process_create_voting<'a>(
        program_id: &Pubkey,
        voting_uid: &String,
        voting_name: String,
        voting_options: Vec<VotingOption>,
        start_date: UnixTimestamp,
        end_date: UnixTimestamp,
        create_voting_accounts: CreateVotingAccounts
    ) -> ProgramResult {

        create_voting_accounts.validate()?;

        let owner = create_voting_accounts.owner;
        let sys_program = create_voting_accounts.sys_program;
        let pda = create_voting_accounts.pda;

        Self::validate_pda(program_id, owner, pda, voting_uid)?;

        let voting_account = VotingAccount::new(voting_uid.to_string(), voting_name, start_date, end_date, voting_options);

        // validate voting account data
        voting_account.validate()?;

        // create pda account
        let size_of_acc_data = voting_account.calculate_borsh_size();
        let min_lamp = Rent::get()?.minimum_balance(size_of_acc_data);

        if owner.lamports() < min_lamp {
            msg!("Not enough lamps for rent. Min lamps: {}, has lams: {}", min_lamp, owner.lamports());
            return Err(ProgramError::InsufficientFunds)
        }

        let (pda_pubkey, bump_seed) = get_voting_pda_and_bump(owner, &voting_uid, program_id);
        
        let create_acc_ins = system_instruction::create_account(
            owner.key,
            &pda_pubkey,
            min_lamp,
            size_of_acc_data.try_into().unwrap(),
            program_id,
        );

        msg!("Invoking signed create account");
        
        let bump = &[bump_seed];
        let pda_sign_seed = get_pda_sign(owner.key.as_ref(), voting_uid, bump);

        invoke_signed(
            &create_acc_ins,
            &[pda.clone(), owner.clone(), sys_program.clone()],
            &[&pda_sign_seed],
        )?;

        voting_account.serialize(&mut pda.try_borrow_mut_data()?.as_mut())?;

        Ok(())
    }

    pub fn process_vote<'a>(
        program_id: &Pubkey,
        voting_option_id: u8,
        voting_accounts: VoteAccounts
    ) -> ProgramResult {

        voting_accounts.validate()?;

        let voting_pda = voting_accounts.voting_pda;
        let owner = voting_accounts.owner;

        // read voting pda data
        let mut voting_account = VotingAccount::try_from_slice(&mut voting_pda.data.borrow_mut())?;

        Self::validate_pda(program_id, owner, voting_pda, &voting_account.uid)?;

        let target_index = voting_account
            .voting_options
            .binary_search_by(|probe| probe.option_id.cmp(&voting_option_id))
            .map_err(|_e| ProgramError::InvalidInstructionData)?;

        msg!("Current vote data {:?}", voting_account);

        let clock = Clock::get()?;
        let now_ts = clock.unix_timestamp;

        if now_ts.lt(&voting_account.start_date) {
            return Err(VoteProgramError::VotingNotStartedYet.into());
        }

        if now_ts.gt(&voting_account.end_date) {
            return Err(VoteProgramError::VotingExpired.into());
        }


        voting_account.voting_options[target_index].counter += 1;

        // write data
        voting_account.serialize(&mut voting_pda.data.borrow_mut().as_mut())?;

        Ok(())
    }


    fn validate_pda(program_id: &Pubkey, owner: &AccountInfo<'_>, voting_pda: &AccountInfo<'_>, voting_uid: &String) -> Result<(), ProgramError> {
        let (pda_pubkey, _bump_seed) = get_voting_pda_and_bump(owner, voting_uid, program_id);
        if !pda_pubkey.eq(voting_pda.key) {
            return Err(VoteProgramError::WrongPdaKey.into());
        }
        Ok(())
    }


}
