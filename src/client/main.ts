import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getRpcUrl } from "./utils";
import { createHash } from 'crypto';
import { VoteProgram, VotingOption } from "./vote";


/**
 * Establish a connection to the cluster
 */
 export async function establishConnection(): Promise<Connection> {
    const rpcUrl = await getRpcUrl();
    let connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
    return connection;
}

async function main() {
    let connection = await establishConnection();
    let acc1 = getKeypair("acc1");
    let acc2 = getKeypair("acc2");
    console.log('Acc1', acc1.publicKey.toBase58());
    console.log('Acc2', acc2.publicKey.toBase58());

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
       await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
    }


    console.log('Acc1 balance', await connection.getBalance(acc1.publicKey))
    console.log('Acc2 balance', await connection.getBalance(acc2.publicKey))

    let transferInstruction = SystemProgram.transfer({
        fromPubkey: acc1.publicKey,
        toPubkey: acc2.publicKey,
        lamports: 3 * LAMPORTS_PER_SOL
    })

    let txSig = await connection.sendTransaction(new Transaction().add(transferInstruction), [acc1]);
    let latestBlockHash = await connection.getLatestBlockhash()

    let result = await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txSig
    });
    console.log(result);

    console.log('Acc1 balance', await connection.getBalance(acc1.publicKey))
    console.log('Acc2 balance', await connection.getBalance(acc2.publicKey))

}

async function createVoting() {
    let connection = await establishConnection();
    let acc1 = getKeypair("acc1");
    console.log('Acc1', acc1.publicKey.toBase58());

    if (await connection.getBalance(acc1.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc1.publicKey, 10 * LAMPORTS_PER_SOL);
     }
 

    let instr = VoteProgram.createVoting('color_voting1', 'Pick a color?', [
         new VotingOption({counter: 3, id: 1, description: 'red'}), new VotingOption({counter: 4, id: 2, description: 'blue'})], 
         acc1.publicKey);

    let res = await sendAndConfirmTransaction(connection, new Transaction().add(instr), [acc1]);

    console.log(res);
}

async function vote() {
    let connection = await establishConnection();
    let votingOwner = getKeypair("acc1");
    let acc2 = getKeypair("acc2");
    console.log('Acc2', acc2.publicKey.toBase58());

    if (await connection.getBalance(acc2.publicKey) < 5 * LAMPORTS_PER_SOL) {
        await airDrop(connection, acc2.publicKey, 10 * LAMPORTS_PER_SOL);
     }
 

    let pdaAndBumb = VoteProgram.getPdaPubkey(votingOwner.publicKey);

    let instr = VoteProgram.vote(pdaAndBumb[0], acc2.publicKey, votingOwner.publicKey, 1);

    let res = await sendAndConfirmTransaction(connection,
        new Transaction().add(instr),
        [acc2]
    );

    console.log(res);
}

async function airDrop(connection: Connection, acc: PublicKey, lamports: number) {
    let airDropSig = await connection.requestAirdrop(acc, lamports);
    let latestBlockHash = await connection.getLatestBlockhash()
    await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: airDropSig,
      });
    let acc1_ai = await connection.getAccountInfo(acc);
    console.log('Airdropped to: ', acc1_ai);
}

function getKeypair(secret: string) {
    let secretHashHex = createHash('sha256').update(secret).digest('hex');
    let unsignedIntegers = secretHashHex.match(/[\dA-F]{2}/gi)!.map(function(s) {
        return parseInt(s, 16);
    });
    let bytes = new Uint8Array(unsignedIntegers);
    return Keypair.fromSeed(bytes);
}



vote().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
