import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getRpcUrl } from "../../src/utils";
import { createHash } from 'crypto';
import { randomUUID } from "mz/crypto";

export function getKeypair(secret: string) : Keypair {
    let secretHashHex = createHash('sha256').update(secret).digest('hex');
    let unsignedIntegers = secretHashHex.match(/[\dA-F]{2}/gi)!.map(function(s) {
        return parseInt(s, 16);
    });
    let bytes = new Uint8Array(unsignedIntegers);
    return Keypair.fromSeed(bytes);
}

export function getRndKeypair() : Keypair {
    return getKeypair(randomUUID());
}

export async function getKeypairWithLamports(conn: Connection, secret: string, lamports: number) : Promise<Keypair> {
    let kp = getKeypair(secret);
    await airDrop(conn, kp.publicKey, lamports);
    return kp;
}

export async function getRndKeypairWithLamports(conn: Connection, lamports: number) : Promise<Keypair> {
    let kp = getRndKeypair();
    await airDrop(conn, kp.publicKey, lamports);
    return kp;
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
}
