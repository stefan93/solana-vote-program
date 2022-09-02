import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { establishConnection, getKeypair, airDrop } from "../test/e2e/testUtils";
import { VoteAPI } from "./api";
import { CreateVotingInstruction, VotingOption } from "./instructions";



async function t() {
    let connection = await establishConnection();
    let acc1 = getKeypair("acc1");

    let api = new VoteAPI(connection);

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
    }

    let startDate = new Date(), endDate = new Date();
    startDate.setHours(10);
    endDate.setHours(23);
    await api.createVoting(
        acc1, 
        new CreateVotingInstruction({
            votingUid: 'color_voting1', 
            votingName: 'Pick a color?', 
            startDate: startDate.valueOf() / 1000,
            endDate: endDate.valueOf() / 1000,
            votingOptions: [
                new VotingOption({counter: 3, id: 1, description: 'red'}), 
                new VotingOption({counter: 4, id: 2, description: 'blue'})
                ]
            }
        )
    );

    let accInfo = await api.readVoteAccount(acc1.publicKey);
}


t().then();