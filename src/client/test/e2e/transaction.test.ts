import { Connection, Keypair, LAMPORTS_PER_SOL, SendTransactionError } from "@solana/web3.js";
import { CreateVotingInstruction, VotingOption } from "../../src/instructions"
import { getKeypair, airDrop, establishConnection } from "./testUtils";
import { VoteAPI } from "../../src/api";

let connection : Connection;
let acc1 : Keypair;
let acc2 : Keypair;
let api : VoteAPI;

beforeAll(async () => {
    connection = await establishConnection();
    acc1 = getKeypair("acc1");
    acc2 = getKeypair("acc2");
    api = new VoteAPI(connection);

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
    }

    if (await connection.getBalance(acc2.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc2.publicKey, 10 * LAMPORTS_PER_SOL);
    }
});

test('create start in past', async () => {

    let startDate = new Date(), endDate = new Date();
    startDate.setHours(startDate.getHours() - 1);
    endDate.setHours(startDate.getHours() + 2);

    await expect(async () => {
        await api.createVoting(
            acc1,
            new CreateVotingInstruction({
                votingUid: 'color_voting1',
                votingName: 'Pick a color?',
                startDate: startDate.valueOf() / 1000,
                endDate: endDate.valueOf() / 1000,
                votingOptions: [
                    new VotingOption({ counter: 3, id: 1, description: 'red' }),
                    new VotingOption({ counter: 4, id: 2, description: 'blue' })
                ]
            })
        );
    }).rejects.toThrow("custom program error");

});


test('create sucess', async () => {

    let startDate = new Date(), endDate = new Date();
    endDate.setHours(startDate.getHours() + 1);
    await printMsg(async () =>
        await api.createVoting(
            acc1,
            new CreateVotingInstruction({
                votingUid: 'color_voting1',
                votingName: 'Pick a color?',
                startDate: startDate.valueOf() / 1000,
                endDate: endDate.valueOf() / 1000,
                votingOptions: [
                    new VotingOption({ counter: 3, id: 1, description: 'red' }),
                    new VotingOption({ counter: 4, id: 2, description: 'blue' })
                ]
            })
        )
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

test('vote success', async () => {

    let votingOwner = getKeypair("acc1");
    let voter = getKeypair("acc2");

    await printMsg(async () => await api.vote(votingOwner.publicKey, voter, 1));

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


async function printMsg(fn: () => void) {
    try {
        await fn();
    } catch (e) {
        console.error(e);
        throw e;
    }
}