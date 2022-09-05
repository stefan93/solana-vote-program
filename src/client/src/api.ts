import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SendTransactionError, Transaction } from "@solana/web3.js";
import { VotingAccount } from "./account";
import { handleError } from "./errors";
import { CreateVotingInstruction, VotingOption } from "./instructions";
import { VoteProgram } from "./vote";

export class VoteAPI {
    connection: Connection;

    constructor(_connecton: Connection) {
        this.connection = _connecton;
    }

   public async createVoting(owner: Keypair, createVotingInstruction: CreateVotingInstruction) : Promise<string> {

    let instr = VoteProgram.createVoting(createVotingInstruction, owner.publicKey);

    return await sendAndConfirmTransaction(this.connection, new Transaction().add(instr), [owner])
        .catch(handleError);

   } 

   public async vote(votingOwner: PublicKey, votingUid: string, voter: Keypair, votingOptionId: number) : Promise<string> {
    let pdaAndBumb = VoteProgram.getPdaPubkey(votingOwner, votingUid);

    let instr = VoteProgram.vote(pdaAndBumb[0], voter.publicKey, votingOwner, votingOptionId);

    return await sendAndConfirmTransaction(this.connection,
        new Transaction().add(instr),
        [voter]
    ).catch(handleError);
   }

   public async readVoteAccount(votingOwner: PublicKey, votingUid: string) : Promise<VotingAccount> {
    return await VoteProgram.readAccountData(this.connection, votingOwner, votingUid);
   }
    
}