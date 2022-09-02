import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } from "@solana/web3.js";
import { VotingAccount } from "./account";
import { CreateVotingInstruction, VotingOption } from "./instructions";
import { VoteProgram } from "./vote";

export class VoteAPI {
    connection: Connection;

    constructor(_connecton: Connection) {
        this.connection = _connecton;
    }

   public async createVoting(owner: Keypair, createVotingInstruction: CreateVotingInstruction) : Promise<string> {

    let instr = VoteProgram.createVoting(createVotingInstruction, owner.publicKey);

    return await sendAndConfirmTransaction(this.connection, new Transaction().add(instr), [owner]);

   } 

   public async vote(votingOwner: PublicKey, voter: Keypair, votingOptionId: number) : Promise<string> {
    let pdaAndBumb = VoteProgram.getPdaPubkey(votingOwner);

    let instr = VoteProgram.vote(pdaAndBumb[0], voter.publicKey, votingOwner, votingOptionId);

    return await sendAndConfirmTransaction(this.connection,
        new Transaction().add(instr),
        [voter]
    );

   }

   public async readVoteAccount(votingOwner: PublicKey) : Promise<VotingAccount> {
    return await VoteProgram.readAccountData(this.connection, votingOwner);
   }
    
}