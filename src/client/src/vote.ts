import { Connection, PublicKey, SystemProgram, TransactionInstruction, VoteAccount } from "@solana/web3.js";
import { CString} from "@solana/buffer-layout";
import { deserialize, serialize } from 'borsh';
import { CreateVotingInstruction, INSTRUCTION_SCHEMA, VoteInstructionType } from "./instructions";
import { VotingOption } from "./instructions"
import { ACCOUNT_SCHEMA, VotingAccount } from "./account";

export class VoteProgram {
    
    static programId: PublicKey = new PublicKey('AYJ7F7tPhvUu6gUucew7AJqhasTEx8tH3UF9GAuyfQQz');


    static createVoting(votingUid: string, votingName: string, votingOptions: VotingOption[], owner: PublicKey) : TransactionInstruction {
           
        const buffer = serialize(INSTRUCTION_SCHEMA, new CreateVotingInstruction({votingUid: votingUid, votingName: votingName, votingOptions: votingOptions}));
        let pda = this.getPdaPubkey(owner)[0];

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

    static getPdaPubkey(votingOwner: PublicKey) : [PublicKey, number] {
      return PublicKey.findProgramAddressSync([votingOwner.toBytes()], this.programId);
    }

    static async readAccountData(connection: Connection, owner: PublicKey) : Promise<VotingAccount> {
      let accInfo = await connection.getAccountInfo(VoteProgram.getPdaPubkey(owner)[0]);
      if (accInfo == null) {
        throw new Error("Account info is null");
      }

      return deserialize(ACCOUNT_SCHEMA, VotingAccount, accInfo.data);
    }
}

export function getAlloc(type: any, fields: any): number {
    const getItemAlloc = (item: any): number => {
      if (item.span >= 0) {
        return item.span;
      } else if (typeof item.alloc === 'function') {
        return item.alloc(fields[item.property]);
      } else if ('count' in item && 'elementLayout' in item) {
        const field = fields[item.property];
        if (Array.isArray(field)) {
          return field.length * getItemAlloc(item.elementLayout);
        }
      } else if (item.property != undefined && item instanceof CString) {
        return fields[item.property].length * 2;
      }

      // Couldn't determine allocated size of layout
      console.log('Couldnt determine allocated size of layout', item);
      
      return 0;
    };
  
    let alloc = 0;
    type.fields.forEach((item: any) => {
      alloc += getItemAlloc(item);
    });
  
    return alloc;
  }