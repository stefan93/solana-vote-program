export class VotingAccount {
    votingUid: String;
    votingName: String;
    votingOptions: VotingOptionAccount[];

    constructor(data: {votingUid: String, votingName: String, votingOptions: VotingOptionAccount[]}) {
      this.votingUid = data.votingUid;
      this.votingName = data.votingName;
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

