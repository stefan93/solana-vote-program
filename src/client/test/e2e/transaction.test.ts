import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SendTransactionError } from "@solana/web3.js";
import { CreateVotingInstruction, VotingOption } from "../../src/instructions"
import { establishConnection, getRndKeypairWithLamports } from "./testUtils";
import { VoteAPI } from "../../src/api";
import { ErrorCode } from "../../src/errors";

let connection: Connection;
let api: VoteAPI;

beforeAll(async () => {
    connection = await establishConnection();
    api = new VoteAPI(connection);
});

describe('create voting', () => {
    let acc1: Keypair;

    beforeAll(async () => {
        acc1 = await getRndKeypairWithLamports(connection, 10 * LAMPORTS_PER_SOL);
    });


    test('create voting uid empty string', async () => {

        let startDate = new Date(), endDate = new Date();
        startDate.setHours(startDate.getHours() - 1);
        endDate.setHours(startDate.getHours() + 2);

        await expect(async () => {
            await api.createVoting(
                acc1,
                new CreateVotingInstruction({
                    votingUid: '',
                    votingName: 'Pick a color?',
                    startDate: startDate.valueOf() / 1000,
                    endDate: endDate.valueOf() / 1000,
                    votingOptions: [
                        new VotingOption({ counter: 3, id: 1, description: 'red' }),
                        new VotingOption({ counter: 4, id: 2, description: 'blue' })
                    ]
                })
            );
        }).rejects.toThrowError("invalid program argument");

    });

    test('create start in past', async () => {

        let startDate = new Date(), endDate = new Date();
        startDate.setHours(startDate.getHours() - 1);
        endDate.setHours(startDate.getHours() + 2);

        await expect(async () => {
            await api.createVoting(
                acc1,
                new CreateVotingInstruction({
                    votingUid: 'color_voting_past',
                    votingName: 'Pick a color?',
                    startDate: startDate.valueOf() / 1000,
                    endDate: endDate.valueOf() / 1000,
                    votingOptions: [
                        new VotingOption({ counter: 3, id: 1, description: 'red' }),
                        new VotingOption({ counter: 4, id: 2, description: 'blue' })
                    ]
                })
            );
        }).rejects.toThrowError(ErrorCode.StartVotindDateInPast);

    });


    test('create sucess', async () => {

        let startDate = new Date(), endDate = new Date();
        endDate.setHours(startDate.getHours() + 1);
        await api.createVoting(
            acc1,
            new CreateVotingInstruction({
                votingUid: 'color_voting_success',
                votingName: 'Pick a color?',
                startDate: startDate.valueOf() / 1000,
                endDate: endDate.valueOf() / 1000,
                votingOptions: [
                    new VotingOption({ counter: 3, id: 1, description: 'red' }),
                    new VotingOption({ counter: 4, id: 2, description: 'blue' })
                ]
            })
        )

        let accInfo = await api.readVoteAccount(acc1.publicKey, "color_voting_success");

        await expect(accInfo).toMatchObject({
            votingUid: 'color_voting_success',
            votingName: 'Pick a color?',
            votingOptions: [
                { counter: 0, id: 1, description: 'red' },
                { counter: 0, id: 2, description: 'blue' }
            ]
        });
    });
});


describe('voting', () => {
    let votingOwner: Keypair;
    let voter: Keypair;
    beforeAll(async () => {
        votingOwner = await getRndKeypairWithLamports(connection, 10 * LAMPORTS_PER_SOL);
        voter = await getRndKeypairWithLamports(connection, 10 * LAMPORTS_PER_SOL);
    });

    test('vote success', async () => {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setHours(startDate.getHours() + 1);

        await api.createVoting(
            votingOwner,
            new CreateVotingInstruction({
                votingUid: 'color_voting_votingSucess',
                votingName: 'Pick a color?',
                startDate: startDate.valueOf() / 1000,
                endDate: endDate.valueOf() / 1000,
                votingOptions: [
                    new VotingOption({ counter: 3, id: 1, description: 'red' }),
                    new VotingOption({ counter: 4, id: 2, description: 'blue' })
                ]
            })
        )

        // sleep 2 seconds
        await new Promise((r) => setTimeout(r, 2000));

        await api.vote(votingOwner.publicKey, "color_voting_votingSucess", voter, 1);
    
        let accInfo = await api.readVoteAccount(votingOwner.publicKey, 'color_voting_votingSucess');
    
        await expect(accInfo).toMatchObject({
            votingUid: 'color_voting_votingSucess',
            votingName: 'Pick a color?',
            votingOptions: [
                { counter: 1, id: 1, description: 'red' },
                { counter: 0, id: 2, description: 'blue' }
            ]
        });
    });

    test('not existable voting option', async () => {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setHours(startDate.getHours() + 1);

        await createTestVoting(votingOwner, 'color_voting_votingOptNotExist', startDate, endDate);

        // sleep 2 seconds
        await new Promise((r) => setTimeout(r, 2000));

        await expect(async () => await api.vote(votingOwner.publicKey, "color_voting_votingOptNotExist", voter, 323))
                .rejects.toThrowError("invalid instruction data");
    });

    test('voting not started', async () => {
        let startDate = new Date();
        let endDate = new Date();

        startDate.setHours(startDate.getHours() + 1)
        endDate.setHours(startDate.getHours() + 1);

        await createTestVoting(votingOwner, 'color_voting_votingNotStarted', startDate, endDate);

        await expect(async () => await api.vote(votingOwner.publicKey, "color_voting_votingNotStarted", voter, 1))
                .rejects.toThrowError(ErrorCode.VotingNotStartedYet);
        
    });

    test('voting expired', async () => {
        let startDate = new Date();
        let endDate = new Date();
        endDate.setSeconds(startDate.getSeconds() + 1);

        await createTestVoting(votingOwner, 'color_voting_votingExpired', startDate, endDate);

        // wait for 3 seconds
        await new Promise((r) => setTimeout(r, 3000));

        await expect(async () => await api.vote(votingOwner.publicKey, "color_voting_votingExpired", voter, 1))
                .rejects.toThrowError(ErrorCode.VotingExpired);
        
    });

});


async function createTestVoting(votingOwner: Keypair, votingUid: string, startDate: Date, endDate: Date) {

    await api.createVoting(
        votingOwner,
        new CreateVotingInstruction({
            votingUid: votingUid,
            votingName: 'Pick a color?',
            startDate: startDate.valueOf() / 1000,
            endDate: endDate.valueOf() / 1000,
            votingOptions: [
                new VotingOption({ counter: 3, id: 1, description: 'red' }),
                new VotingOption({ counter: 4, id: 2, description: 'blue' })
            ]
        })
    );
}