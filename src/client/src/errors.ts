import { SendTransactionError } from "@solana/web3.js";

export function handleError(e: SendTransactionError) : Promise<string> {
    console.error(e);
    return Promise.reject(e);
}

function extractErrorNumber(e: SendTransactionError) : string | undefined {
    let matchGroups = e.message.match(/(custom program error: )(\d+x\d+)/);
    if (matchGroups?.length == 3) {
        return matchGroups?.at(2);
    }
    return undefined;
}


export enum ErrorCode {
    NotRentExempt = "0x0",
    WrongPdaKey = "0x1", 
    StartVotindDateInPast = "0x2",
    StartVotingDateAfterEndDate = "0x3",
    VotingNotStartedYet = "0x4",
    VotingExpired = "0x5",

    UnknownError = "unkown"
}