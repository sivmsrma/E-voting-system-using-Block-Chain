import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { VotingContract, Candidate, Election, NotificationType } from '../types';
import { useElection } from '../hooks/useElection';
import { formatTime, formatDate, formatPercentage } from '../utils/formatters';

interface Props {
    contract: VotingContract | null;
    showNotification: (message: string, type: NotificationType) => void;
}

export default function AdminDashboard({ contract, showNotification }: Props) {
    const {
        candidates,
        electionStatus,
        electionName: currentElectionName,
        electionCount,
        electionHistory,
        timeRemaining,
        refetch,
    } = useElection(contract);

    const [newCandidateName, setNewCandidateName] = useState('');
    const [electionName, setElectionName] = useState('');
    const [duration, setDuration] = useState('60');
    const [loading, setLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const electionCreated = electionCount > 0;
    const isElectionEnded = electionStatus.started && (electionStatus.ended || timeRemaining === 0);
    const canCreateNewElection = !electionCreated || isElectionEnded;
    const getTotalVotes = () => candidates.reduce((sum, c) => sum + c.voteCount, 0);

    const createElection = async () => {
        if (!contract || !electionName.trim()) {
            showNotification('Please enter election name', 'error');
            return;
        }

        try {
            setLoading(true);
            const tx = await contract.createElection(electionName);
            await tx.wait();
            showNotification('Election created successfully!', 'success');
            setElectionName('');
            refetch();
        } catch (err: any) {
            showNotification(err.reason || 'Error creating election', 'error');
        } finally {
            setLoading(false);
        }
    };

    const addCandidate = async () => {
        if (!contract || !newCandidateName.trim()) {
            showNotification('Please enter candidate name', 'error');
            return;
        }

        try {
            setLoading(true);
            const tx = await contract.addCandidate(newCandidateName);
            await tx.wait();
            setNewCandidateName('');
            showNotification('Candidate added successfully!', 'success');
            refetch();
        } catch (err: any) {
            showNotification(err.reason || 'Error adding candidate', 'error');
        } finally {
            setLoading(false);
        }
    };

    const startElection = async () => {
        if (!contract) return;
        if (candidates.length < 2) {
            showNotification('Add at least 2 candidates', 'error');
            return;
        }

        const durationNum = parseInt(duration, 10);
        if (!Number.isInteger(durationNum) || durationNum <= 0) {
            showNotification('Please enter a valid positive duration in minutes', 'error');
            return;
        }

        try {
            setLoading(true);
            const tx = await contract.startElection(durationNum);
            await tx.wait();
            showNotification('Election started!', 'success');
            refetch();
        } catch (err: any) {
            showNotification(err.reason || 'Error starting election', 'error');
        } finally {
            setLoading(false);
        }
    };

    const endElection = async () => {
        if (!contract) return;

        try {
            setLoading(true);
            const tx = await contract.endElection();
            await tx.wait();
            showNotification('Election ended!', 'success');
            refetch();
        } catch (err: any) {
            showNotification(err.reason || 'Error ending election', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getLeadingCandidate = () => {
        if (candidates.length === 0) return null;
        return candidates.reduce((max, c) => (c.voteCount > max.voteCount ? c : max), candidates[0]);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <Text style={styles.statusTitle}>Current Election</Text>
                    {currentElectionName && (
                        <Text style={styles.electionNameBadge}>📋 {currentElectionName}</Text>
                    )}
                </View>
                <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Status</Text>
                        <View style={styles.statusBadge}>
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor: electionStatus.started
                                            ? isElectionEnded
                                                ? '#ef4444'
                                                : '#10b981'
                                            : '#888',
                                    },
                                ]}
                            />
                            <Text style={styles.statusValue}>
                                {electionStatus.started
                                    ? isElectionEnded
                                        ? 'Ended'
                                        : 'Active'
                                    : electionCreated
                                        ? 'Created'
                                        : 'Not Created'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Candidates</Text>
                        <Text style={styles.statusValue}>{candidates.length}</Text>
                    </View>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Total Votes</Text>
                        <Text style={styles.statusValue}>{getTotalVotes()}</Text>
                    </View>
                    {electionStatus.started && !isElectionEnded && (
                        <View style={styles.statusItem}>
                            <Text style={styles.statusLabel}>Time Left</Text>
                            <Text style={styles.statusValue}>{formatTime(timeRemaining)}</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(!showHistory)}>
                    <Text style={styles.historyButtonText}>
                        {showHistory ? '📊 Hide History' : `📜 View History (${electionCount} elections)`}
                    </Text>
                </TouchableOpacity>
            </View>

            {showHistory && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📜 Election History</Text>
                    {electionHistory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No past elections</Text>
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {electionHistory
                                .slice()
                                .reverse()
                                .map((election) => (
                                    <ElectionHistoryItem
                                        key={election.id}
                                        election={election}
                                        contract={contract}
                                        formatDate={formatDate}
                                        showNotification={showNotification}
                                    />
                                ))}
                        </View>
                    )}
                </View>
            )}

            {electionStatus.started && !isElectionEnded && getTotalVotes() > 0 && (
                <View style={styles.predictionCard}>
                    <Text style={styles.predictionTitle}>📈 Live Prediction</Text>
                    <View style={styles.predictionContent}>
                        <Text style={styles.predictionLabel}>Currently Leading:</Text>
                        <Text style={styles.predictionName}>{getLeadingCandidate()?.name}</Text>
                        <Text style={styles.predictionVotes}>
                            {getLeadingCandidate()?.voteCount} votes (
                            {formatPercentage(getLeadingCandidate()?.voteCount || 0, getTotalVotes())}%)
                        </Text>
                    </View>
                </View>
            )}

            {canCreateNewElection && (
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={styles.sectionTitle}>Create New Election</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Election Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter election name"
                            placeholderTextColor="#666"
                            value={electionName}
                            onChangeText={setElectionName}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[styles.createButton, loading && styles.disabledButton]}
                            onPress={createElection}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Create Election</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {electionCreated && !electionStatus.started && (
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.sectionTitle}>Add Candidates</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter candidate name"
                            placeholderTextColor="#666"
                            value={newCandidateName}
                            onChangeText={setNewCandidateName}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, loading && styles.disabledButton]}
                            onPress={addCandidate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Add Candidate</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {electionCreated && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Candidates List</Text>
                    {candidates.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No candidates added yet</Text>
                            {!electionStatus.started && (
                                <Text style={styles.emptySubtext}>Add at least 2 candidates to start</Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.candidatesList}>
                            {candidates.map((candidate, index) => (
                                <View key={candidate.id} style={styles.candidateItem}>
                                    <View style={styles.candidateNumber}>
                                        <Text style={styles.candidateNumberText}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.candidateInfo}>
                                        <Text style={styles.candidateName}>{candidate.name}</Text>
                                        <Text style={styles.candidateVotes}>{candidate.voteCount} votes</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {electionCreated && !electionStatus.started && candidates.length >= 2 && (
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.sectionTitle}>Start Election</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Duration (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="60"
                            placeholderTextColor="#666"
                            value={duration}
                            onChangeText={setDuration}
                            keyboardType="numeric"
                            editable={!loading}
                        />
                        <TouchableOpacity
                            style={[styles.startButton, loading && styles.disabledButton]}
                            onPress={startElection}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Start Election</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {electionStatus.started && !isElectionEnded && (
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.endButton, loading && styles.disabledButton]}
                        onPress={endElection}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>⏹️ End Election Manually</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {isElectionEnded && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Final Results</Text>
                    <View style={styles.resultsList}>
                        {[...candidates]
                            .sort((a, b) => b.voteCount - a.voteCount)
                            .map((candidate, index) => (
                                <View
                                    key={candidate.id}
                                    style={[styles.resultItem, index === 0 && styles.winnerItem]}
                                >
                                    <View style={styles.resultRank}>
                                        <Text style={styles.resultRankText}>{index === 0 ? '🏆' : `#${index + 1}`}</Text>
                                    </View>
                                    <View style={styles.resultInfo}>
                                        <Text style={styles.resultName}>{candidate.name}</Text>
                                        <Text style={styles.resultVotes}>
                                            {candidate.voteCount} votes ({formatPercentage(candidate.voteCount, getTotalVotes())}
                                            %)
                                        </Text>
                                    </View>
                                </View>
                            ))}
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

interface ElectionHistoryItemProps {
    election: Election;
    contract: VotingContract | null;
    formatDate: (timestamp: number) => string;
    showNotification: (message: string, type: NotificationType) => void;
}

function ElectionHistoryItem({ election, contract, formatDate, showNotification }: ElectionHistoryItemProps) {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadCandidates = async () => {
        if (expanded) {
            setExpanded(false);
            return;
        }

        if (!contract) return;

        try {
            setLoading(true);
            const candidatesList = await contract.getElectionCandidates(election.id);
            setCandidates(
                candidatesList.map((c: any) => ({
                    id: Number(c.id),
                    name: c.name,
                    voteCount: Number(c.voteCount),
                }))
            );
            setExpanded(true);
        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            showNotification(
                `Failed to load election history: ${errorMessage}`,
                'error'
            );
            console.error('Failed to load candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const winner = candidates.length > 0 ? [...candidates].sort((a, b) => b.voteCount - a.voteCount)[0] : null;

    return (
        <View style={styles.historyItem}>
            <TouchableOpacity onPress={loadCandidates} style={styles.historyHeader}>
                <View style={styles.historyHeaderLeft}>
                    <Text style={styles.historyElectionName}>{election.name}</Text>
                    <Text style={styles.historyDate}>{formatDate(election.startTime)}</Text>
                </View>
                <View style={styles.historyHeaderRight}>
                    <Text style={styles.historyVotes}>{election.totalVotes} votes</Text>
                    <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
                </View>
            </TouchableOpacity>

            {loading && <ActivityIndicator size="small" color="#6366f1" style={{ marginTop: 10 }} />}

            {expanded && !loading && (
                <View style={styles.historyResults}>
                    {winner && (
                        <View style={styles.historyWinner}>
                            <Text style={styles.historyWinnerLabel}>🏆 Winner:</Text>
                            <Text style={styles.historyWinnerName}>{winner.name}</Text>
                            <Text style={styles.historyWinnerVotes}>{winner.voteCount} votes</Text>
                        </View>
                    )}
                    <View style={styles.historyCandidates}>
                        {candidates.map((c, idx) => (
                            <View key={c.id} style={styles.historyCandidateItem}>
                                <Text style={styles.historyCandidateRank}>#{idx + 1}</Text>
                                <Text style={styles.historyCandidateName}>{c.name}</Text>
                                <Text style={styles.historyCandidateVotes}>{c.voteCount} votes</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    statusCard: {
        backgroundColor: '#1a1a2e',
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2d2d44',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    electionNameBadge: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    statusRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    statusItem: {
        flex: 1,
        minWidth: 120,
    },
    statusLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    historyButton: {
        marginTop: 16,
        backgroundColor: '#6366f1',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    historyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        backgroundColor: '#1a1a2e',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2d2d44',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#6366f1',
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    inputGroup: {
        gap: 12,
    },
    inputLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0f0f23',
        color: '#fff',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2d2d44',
        fontSize: 16,
        outlineWidth: 0,
    },
    createButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: '#8b5cf6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    endButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#2d2d44',
        opacity: 0.5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    predictionCard: {
        backgroundColor: '#1a1a2e',
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#10b981',
    },
    predictionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#10b981',
        marginBottom: 16,
    },
    predictionContent: {
        alignItems: 'center',
    },
    predictionLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    predictionName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    predictionVotes: {
        fontSize: 16,
        color: '#10b981',
    },
    candidatesList: {
        gap: 12,
    },
    candidateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#0f0f23',
        padding: 16,
        borderRadius: 8,
    },
    candidateNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    candidateNumberText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    candidateInfo: {
        flex: 1,
    },
    candidateName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    candidateVotes: {
        fontSize: 14,
        color: '#888',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 4,
    },
    emptySubtext: {
        color: '#666',
        fontSize: 14,
    },
    resultsList: {
        gap: 12,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: '#0f0f23',
        padding: 16,
        borderRadius: 8,
    },
    winnerItem: {
        borderWidth: 2,
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
    },
    resultRank: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2d2d44',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultRankText: {
        fontSize: 18,
        fontWeight: '600',
    },
    resultInfo: {
        flex: 1,
    },
    resultName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    resultVotes: {
        fontSize: 14,
        color: '#888',
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        backgroundColor: '#0f0f23',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2d2d44',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyHeaderLeft: {
        flex: 1,
    },
    historyHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyElectionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 12,
        color: '#888',
    },
    historyVotes: {
        fontSize: 14,
        color: '#6366f1',
        fontWeight: '600',
    },
    expandIcon: {
        fontSize: 12,
        color: '#888',
    },
    historyResults: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#2d2d44',
    },
    historyWinner: {
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    historyWinnerLabel: {
        fontSize: 14,
        color: '#fbbf24',
        marginBottom: 4,
    },
    historyWinnerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    historyWinnerVotes: {
        fontSize: 14,
        color: '#888',
    },
    historyCandidates: {
        gap: 8,
    },
    historyCandidateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 8,
    },
    historyCandidateRank: {
        fontSize: 14,
        color: '#888',
        width: 30,
    },
    historyCandidateName: {
        flex: 1,
        fontSize: 14,
        color: '#fff',
    },
    historyCandidateVotes: {
        fontSize: 14,
        color: '#6366f1',
    },
});
