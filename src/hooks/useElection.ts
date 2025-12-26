import { useState, useEffect, useCallback, useRef } from 'react';
import { VotingContract, Candidate, Election, ElectionStatus } from '../types';

export const useElection = (contract: VotingContract | null) => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [electionStatus, setElectionStatus] = useState<ElectionStatus>({
        started: false,
        ended: false,
        endTime: 0,
    });
    const [electionName, setElectionName] = useState('');
    const [electionCount, setElectionCount] = useState(0);
    const [electionHistory, setElectionHistory] = useState<Election[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const hasRefetchedOnZero = useRef(false);

    const fetchElectionData = useCallback(async () => {
        if (!contract) return;

        try {
            const count = await contract.electionCount();
            setElectionCount(Number(count));

            if (Number(count) > 0) {
                const currentElection = await contract.getCurrentElection();
                setElectionName(currentElection.name);
                setElectionStatus({
                    started: currentElection.started,
                    ended: currentElection.ended,
                    endTime: Number(currentElection.endTime),
                });

                const candidatesList = await contract.getAllCandidates();
                setCandidates(
                    candidatesList.map((c: any) => ({
                        id: Number(c.id),
                        name: c.name,
                        voteCount: Number(c.voteCount),
                    }))
                );

                const allElections = await contract.getAllElections();
                setElectionHistory(
                    allElections.map((e: any) => ({
                        id: Number(e.id),
                        name: e.name,
                        started: e.started,
                        ended: e.ended,
                        totalVotes: Number(e.totalVotes),
                        startTime: Number(e.startTime),
                        endTime: Number(e.endTime),
                    }))
                );
            } else {
                setElectionName('');
                setElectionStatus({
                    started: false,
                    ended: false,
                    endTime: 0,
                });
                setCandidates([]);
                setElectionHistory([]);
            }
        } catch (error) {
            console.error('Failed to fetch election data:', error);
        }
    }, [contract]);

    useEffect(() => {
        fetchElectionData();
        hasRefetchedOnZero.current = false;
    }, [fetchElectionData]);

    useEffect(() => {
        if (electionStatus.started && !electionStatus.ended && electionStatus.endTime > 0) {
            const timer = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const remaining = electionStatus.endTime - now;
                setTimeRemaining(remaining > 0 ? remaining : 0);

                if (remaining <= 0 && !hasRefetchedOnZero.current) {
                    hasRefetchedOnZero.current = true;
                    fetchElectionData();
                }
            }, 1000);

            return () => clearInterval(timer);
        } else {
            setTimeRemaining(0);
        }
    }, [electionStatus, fetchElectionData]);

    return {
        candidates,
        electionStatus,
        electionName,
        electionCount,
        electionHistory,
        timeRemaining,
        refetch: fetchElectionData,
    };
};
