# solana-vote-program
Simple vote program for solana.

- To build solana program --> <b>npm run build</b>
- To start solana-test-validator, deply program and run all tests --> <b>npm run test</b>
- e2e tests see: ./src/client/test/e2e/transaction.test.ts
- Program Instructions:
  - Create Voting
  - Vote
- Client API see: ./src/client/src/api.ts
  - VoteAPI.createVoting()
  - VoteAPI.vote()
  - VoteAPI.readVoteAccount()
- TODO: everyone can vote, restrict with custom tokens...

(note: This is just small exercies, nothig more...)
