export interface Candidate {
    id: number;
    name: string;
    voteCount: number;
}

export interface Election {
    id: number;
    name: string;
    startTime: number;
    endTime: number;
    started: boolean;
    ended: boolean;
    totalVotes: number;
}

export interface ElectionStatus {
    started: boolean;
    ended: boolean;
    endTime: number;
}

export interface CurrentElection extends Election {
    candidateCount: number;
}
