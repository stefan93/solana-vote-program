import { SendTransactionError } from "@solana/web3.js";

export function handleError(e: SendTransactionError) : string {
    console.error(e);
        
    let errNumber = extractErrorNumber(e);

    if (errNumber != undefined) {
        throw geVoteError(errNumber, e);
    }

    throw e;
}

function extractErrorNumber(e: SendTransactionError) : string | undefined {
    let matchGroups = e.message.match(/(custom program error: )(\d+x\d+)/);
    if (matchGroups?.length == 3) {
        return matchGroups?.at(2);
    }
    return undefined;
}

export class VoteError implements Error {
    name: string;
    message: string;
    stack?: string | undefined;
    errorCode: ErrorCode;

    public constructor(errorCode: ErrorCode, message: string, stack?: string | undefined) {
        this.name = errorCode.toString();
        this.errorCode = errorCode;
        this.message = message;
        this.stack = stack;
    }
}

function geVoteError(code: string, error: SendTransactionError) {
    switch (code) {
        case "0x0": new VoteError(ErrorCode.NotRentExempt, "Lamport balance below rent-exempt threshold", error.stack)
        case "0x1": new VoteError(ErrorCode.WrongPdaKey, "Pda key missmatch", error.stack)
        case "0x2": new VoteError(ErrorCode.StartVotindDateInPast, "StartVotindDateInPast", error.stack)
        case "0x3": new VoteError(ErrorCode.StartVotingDateAfterEndDate, "StartVotingDateAfterEndDate", error.stack)
        case "0x4": new VoteError(ErrorCode.VotingNotStartedYet, "VotingNotStartedYet", error.stack)
        case "0x5": new VoteError(ErrorCode.VotingExpired, "VotingExpired", error.stack)
        default: new VoteError(ErrorCode.UnknownError, error.message, error.stack)
    }
}

export enum ErrorCode {
    NotRentExempt = 0,
    WrongPdaKey = 1, 
    StartVotindDateInPast = 2,
    StartVotingDateAfterEndDate = 3,
    VotingNotStartedYet = 4,
    VotingExpired = 5,

    UnknownError = 999
}