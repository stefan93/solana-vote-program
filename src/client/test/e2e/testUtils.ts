import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getRpcUrl } from "../../src/utils";
import { createHash } from 'crypto';

export function getKeypair(secret: string) : Keypair {
    let secretHashHex = createHash('sha256').update(secret).digest('hex');
    let unsignedIntegers = secretHashHex.match(/[\dA-F]{2}/gi)!.map(function(s) {
        return parseInt(s, 16);
    });
    let bytes = new Uint8Array(unsignedIntegers);
    return Keypair.fromSeed(bytes);
}

export async function establishConnection(): Promise<Connection> {
    const rpcUrl = await getRpcUrl();
    let connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
    return connection;
}

export async function airDrop(connection: Connection, acc: PublicKey, lamports: number) {
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