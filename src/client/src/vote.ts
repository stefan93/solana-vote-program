import { Connection, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { deserialize, serialize } from 'borsh';
import { CreateVotingInstruction, INSTRUCTION_SCHEMA, VoteInstructionType } from "./instructions";
import { VotingOption } from "./instructions"
import { ACCOUNT_SCHEMA, VotingAccount } from "./account";

export class VoteProgram {
    
    static programId: PublicKey = new PublicKey('AYJ7F7tPhvUu6gUucew7AJqhasTEx8tH3UF9GAuyfQQz');


    static createVoting(createVotingInstruction: CreateVotingInstruction, owner: PublicKey) : TransactionInstruction {
           
        const buffer = serialize(INSTRUCTION_SCHEMA, createVotingInstruction);
        let pda = this.getPdaPubkey(owner, createVotingInstruction.votingUid.toString())[0];

        return new TransactionInstruction({
            programId: this.programId,
            keys: [{
                pubkey: owner,
                isSigner: true,
                isWritable: true
            },
            {
              pubkey: pda,
              isSigner: false,
              isWritable: true
            },
            {
              pubkey: SystemProgram.programId,
              isSigner: false,
              isWritable: false
            }],
            data: Buffer.from(buffer),
        });
    };

    static vote(pda: PublicKey, voter: PublicKey, votingOwner: PublicKey, votingOptionId: number,) : TransactionInstruction {
      return new TransactionInstruction({
        programId: this.programId,
        keys: [
          {
            pubkey: voter,
            isSigner: true,
            isWritable: false
          },
          {
            pubkey: votingOwner,
            isSigner: false,
            isWritable: false
          },
          {
            pubkey: pda,
            isSigner: false,
            isWritable: true
          }
        ],
        data: Buffer.from(Uint8Array.of(VoteInstructionType.Vote, votingOptionId)),
      });
    }

    static getPdaPubkey(votingOwner: PublicKey, voting_uid: string) : [PublicKey, number] {
      let encoder = new TextEncoder();
      let seeds = [votingOwner.toBytes(), encoder.encode(voting_uid), encoder.encode("voting")];
      return PublicKey.findProgramAddressSync(seeds, this.programId);
    }

    static async readAccountData(connection: Connection, owner: PublicKey, votingUid: string) : Promise<VotingAccount> {
      let accInfo = await connection.getAccountInfo(VoteProgram.getPdaPubkey(owner, votingUid)[0]);
      if (accInfo == null) {
        throw new Error("Account info is null");
      }

      return deserialize(ACCOUNT_SCHEMA, VotingAccount, accInfo.data);
    }
}