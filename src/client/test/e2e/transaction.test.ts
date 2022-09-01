import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { VoteProgram } from "../../src/vote";
import { VotingOption } from "../../src/instructions"
import { getKeypair, airDrop, establishConnection } from "./testUtils";


test('voting: create', async () => {
    let connection = await establishConnection();
    let acc1 = getKeypair("acc1");

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
     }
 

    let instr = VoteProgram.createVoting('color_voting1', 'Pick a color?', [
         new VotingOption({counter: 3, id: 1, description: 'red'}), new VotingOption({counter: 4, id: 2, description: 'blue'})], 
         acc1.publicKey);

    let res = await sendAndConfirmTransaction(connection, new Transaction().add(instr), [acc1]);

    let accInfo = await VoteProgram.readAccountData(connection, acc1.publicKey);

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

    if (await connection.getBalance(voter.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, voter.publicKey, 10 * LAMPORTS_PER_SOL);
     }
 

    let pdaAndBumb = VoteProgram.getPdaPubkey(votingOwner.publicKey);

    let instr = VoteProgram.vote(pdaAndBumb[0], voter.publicKey, votingOwner.publicKey, 1);

    let res = await sendAndConfirmTransaction(connection,
        new Transaction().add(instr),
        [voter]
    );

    let accInfo = await VoteProgram.readAccountData(connection, votingOwner.publicKey);

    expect(accInfo).toMatchObject({
        votingUid: 'color_voting1',
        votingName: 'Pick a color?',
        votingOptions: [
           { counter: 1, id: 1, description: 'red' },
           { counter: 0, id: 2, description: 'blue' }
        ]
    });
});
