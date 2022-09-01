import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { VoteProgram } from "../../src/vote";
import { VotingOption } from "../../src/instructions"
import { getKeypair, airDrop, establishConnection } from "./testUtils";
import { VoteAPI } from "../../src/api";


test('voting: create', async () => {
    let connection = await establishConnection();
    let acc1 = getKeypair("acc1");

    let api = new VoteAPI(connection);

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
    }

    await api.createVoting(
        acc1, 
        'color_voting1', 
        'Pick a color?', 
        [
            new VotingOption({counter: 3, id: 1, description: 'red'}), 
            new VotingOption({counter: 4, id: 2, description: 'blue'})
        ]
    );

    let accInfo = await api.readVoteAccount(acc1.publicKey);

    expect(accInfo).toMatchObject({
        votingUid: 'color_voting1',
        votingName: 'Pick a color?',
        votingOptions: [
           { counter: 0, id: 1, description: 'red' },
           { counter: 0, id: 2, description: 'blue' }
        ]
    });
});

test('voting: vote', async () => {
    let connection = await establishConnection();
    let votingOwner = getKeypair("acc1");
    let voter = getKeypair("acc2");

    let api = new VoteAPI(connection);

    if (await connection.getBalance(voter.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, voter.publicKey, 10 * LAMPORTS_PER_SOL);
     }
 
   
    await api.vote(votingOwner.publicKey, voter, 1);

    let accInfo = await api.readVoteAccount(votingOwner.publicKey);

    expect(accInfo).toMatchObject({
        votingUid: 'color_voting1',
        votingName: 'Pick a color?',
        votingOptions: [
           { counter: 1, id: 1, description: 'red' },
           { counter: 0, id: 2, description: 'blue' }
        ]
    });
});
