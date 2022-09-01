import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { CString} from "@solana/buffer-layout";
import { serialize } from 'borsh';

enum VoteInstructionType {
    CreateVoting = 0,
    Vote = 1
}


class VoteProgramInstruction {
    instruction: VoteInstructionType;

    constructor(data: {instruction: VoteInstructionType}) {
      this.instruction = data.instruction;
    }
}

class CreateVotingInstruction extends VoteProgramInstruction {
  votingUid: String;
    votingName: String;
    votingOptions: VotingOption[];

    constructor(data: {votingUid: String, votingName: String, votingOptions: VotingOption[]}) {
      super({instruction: VoteInstructionType.CreateVoting})
      this.votingUid = data.votingUid;
      this.votingName = data.votingName;
      this.votingOptions = data.votingOptions;
    }
}

export class VotingOption {
  counter: Number;
  id: Number;
  description: String;

  constructor(data: {counter: Number, id: Number, description: String}) {
    this.counter = data.counter;
    this.id = data.id;
    this.description = data.description;
  }

}

export class VoteProgram {
    
    static programId: PublicKey = new PublicKey('AYJ7F7tPhvUu6gUucew7AJqhasTEx8tH3UF9GAuyfQQz');


    static createVoting(votingUid: string, votingName: string, votingOptions: VotingOption[], owner: PublicKey) : TransactionInstruction {

        const schema = new Map<any, any>([
          [CreateVotingInstruction, 
            { 
                kind: 'struct', 
                fields: [
                  ['instruction', 'u8'], 
                  ['votingUid', 'string'], 
                  ['votingName', 'string'], 
                  ['votingOptions',  [VotingOption] ]
                ]
            }, 
          ],
          [VotingOption,
            {
              kind: 'struct',
              fields: [
                ['counter', 'u32'],
                ['id', 'u8'], 
                ['description', 'string'] 
              ]
            }
          ]
        ]);
           
        const buffer = serialize(schema, new CreateVotingInstruction({votingUid: votingUid, votingName: votingName, votingOptions: votingOptions}));
        let pda = PublicKey.findProgramAddressSync([owner.toBytes()], this.programId)[0];

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