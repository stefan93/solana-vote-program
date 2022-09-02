export enum VoteInstructionType {
    CreateVoting = 0,
    Vote = 1
}


export class VoteProgramInstruction {
    instruction: VoteInstructionType;

    constructor(data: {instruction: VoteInstructionType}) {
      this.instruction = data.instruction;
    }
}

export class CreateVotingInstruction extends VoteProgramInstruction {
    votingUid: String;
    votingName: String;
    startDate: number;
    endDate: number;
    votingOptions: VotingOption[];

    constructor(data: {votingUid: String, votingName: String, startDate: number, endDate: number, votingOptions: VotingOption[]}) {
      super({instruction: VoteInstructionType.CreateVoting})
      this.votingUid = data.votingUid;
      this.votingName = data.votingName;
      this.startDate = data.startDate;
      this.endDate = data.endDate;
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

export const INSTRUCTION_SCHEMA = new Map<any, any>([
    [CreateVotingInstruction, 
      { 
          kind: 'struct', 
          fields: [
            ['instruction', 'u8'], 
            ['votingUid', 'string'], 
            ['votingName', 'string'], 
            ['startDate', 'u64'], 
            ['endDate', 'u64'], 
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