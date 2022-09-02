export class VotingAccount {
    votingUid: String;
    votingName: String;
    startDate: number;
    endDate: number;
    votingOptions: VotingOptionAccount[];

    constructor(data: {votingUid: String, votingName: String, startDate: number, endDate: number, votingOptions: VotingOptionAccount[]}) {
      this.votingUid = data.votingUid;
      this.votingName = data.votingName;
      this.startDate = data.startDate;
      this.endDate = data.endDate;
      this.votingOptions = data.votingOptions;
    }
}

export class VotingOptionAccount {
    counter: Number;
    id: Number;
    description: String;
  
    constructor(data: {counter: Number, id: Number, description: String}) {
      this.counter = data.counter;
      this.id = data.id;
      this.description = data.description;
    }
}

export const ACCOUNT_SCHEMA = new Map<any, any>([
    [VotingAccount, 
      { 
          kind: 'struct', 
          fields: [
            ['votingUid', 'string'], 
            ['votingName', 'string'], 
            ['startDate', 'u64'], 
            ['endDate', 'u64'], 
            ['votingOptions',  [VotingOptionAccount] ]
          ]
      }, 
    ],
    [VotingOptionAccount,
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

