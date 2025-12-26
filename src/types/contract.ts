import { Contract } from 'ethers';

export interface VotingContract extends Contract {
    electionCount(): Promise<bigint>;
    currentElectionId(): Promise<bigint>;
    createElection(name: string): Promise<any>;
    addCandidate(name: string): Promise<any>;
    startElection(duration: number): Promise<any>;
    endElection(): Promise<any>;
    vote(candidateId: number): Promise<any>;
    getCurrentElection(): Promise<any>;
    getAllCandidates(): Promise<any[]>;
    getAllElections(): Promise<any[]>;
    getElectionCandidates(electionId: number): Promise<any[]>;
    getElection(electionId: number): Promise<any>;
    getRemainingTime(): Promise<bigint>;
    hasUserVoted(electionId: number, address: string): Promise<boolean>;
}

export interface ContractABI {
    abi: any[];
    bytecode: string;
}
