import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from "react-native";

export default function VotingPage({ contract, account, showNotification }) {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [electionStatus, setElectionStatus] = useState({ started: false, ended: false, endTime: 0 });
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [electionName, setElectionName] = useState("");
    const [electionHistory, setElectionHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [electionCount, setElectionCount] = useState(0);

    useEffect(() => {
        if (contract) {
            fetchData();
        }
    }, [contract]);

    useEffect(() => {
        if (electionStatus.started && !electionStatus.ended && electionStatus.endTime > 0) {
            const timer = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const remaining = electionStatus.endTime - now;
                setTimeRemaining(remaining > 0 ? remaining : 0);

                if (remaining <= 0 && contract) {
                    fetchData();
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [electionStatus, contract]);

    const fetchData = async () => {
        try {
            const count = await contract.electionCount();
            setElectionCount(Number(count));

            if (Number(count) > 0) {
                const currentElection = await contract.getCurrentElection();
                setElectionName(currentElection.name);
                setElectionStatus({
                    started: currentElection.started,
                    ended: currentElection.ended,
                    endTime: Number(currentElection.endTime)
                });

                const candidatesList = await contract.getAllCandidates();
                const formattedCandidates = candidatesList.map((c) => ({
                    id: Number(c.id),
                    name: c.name,
                    voteCount: Number(c.voteCount),
                }));
                setCandidates(formattedCandidates);

                // Fetch election history
                const allElections = await contract.getAllElections();
                setElectionHistory(allElections.map(e => ({
                    id: Number(e.id),
                    name: e.name,
                    started: e.started,
                    ended: e.ended,
                    totalVotes: Number(e.totalVotes),
                    startTime: Number(e.startTime),
                    endTime: Number(e.endTime)
                })));
            }
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    const castVote = async (id) => {
        if (!contract) return;
        try {
            setLoading(true);
            const tx = await contract.vote(id);
            await tx.wait();
            showNotification("Vote cast successfully!", "success");
            fetchData();
        } catch (err) {
            console.error(err);
            showNotification(err.reason || "Error voting", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (timestamp) => {
        if (timestamp === 0) return "Not started";
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const getTotalVotes = () => candidates.reduce((sum, c) => sum + c.voteCount, 0);
    const getVotePercentage = (voteCount) => {
        const total = getTotalVotes();
        return total > 0 ? ((voteCount / total) * 100).toFixed(1) : 0;
    };

    const getLeadingCandidate = () => {
        if (candidates.length === 0) return null;
        return candidates.reduce((max, c) => c.voteCount > max.voteCount ? c : max, candidates[0]);
    };

    const getInitials = (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const isElectionEnded = () => {
        return electionStatus.started && (electionStatus.ended || timeRemaining === 0);
    };

    return (
        <ScrollView style={styles.container}>
            {/* Election Name */}
            {electionName && (
                <View style={styles.electionNameCard}>
                    <Text style={styles.electionNameLabel}>Current Election</Text>
                    <Text style={styles.electionNameText}>{electionName}</Text>
                    <TouchableOpacity
                        style={styles.historyButton}
                        onPress={() => setShowHistory(!showHistory)}
                    >
                        <Text style={styles.historyButtonText}>
                            {showHistory ? '📊 Hide History' : `📜 View History (${electionCount} elections)`}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Election History */}
            {showHistory && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📜 Past Elections</Text>
                    {electionHistory.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No past elections</Text>
                        </View>
                    ) : (
                        <View style={styles.historyList}>
                            {electionHistory.slice().reverse().map((election) => (
                                <ElectionHistoryItem
                                    key={election.id}
                                    election={election}
                                    contract={contract}
                                    formatDate={formatDate}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Election Timer */}
            {electionStatus.started && !isElectionEnded() && (
                <View style={styles.timerCard}>
                    <Text style={styles.timerLabel}>Time Remaining</Text>
                    <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, {
                            width: `${timeRemaining > 0 ? 100 : 0}%`
                        }]} />
                    </View>
                </View>
            )}

            {/* Winner Announcement */}
            {isElectionEnded() && getTotalVotes() > 0 && (
                <View style={styles.winnerCard}>
                    <Text style={styles.winnerLabel}>🏆 Winner</Text>
                    <Text style={styles.winnerName}>{getLeadingCandidate()?.name}</Text>
                    <Text style={styles.winnerVotes}>
                        {getLeadingCandidate()?.voteCount} votes ({getVotePercentage(getLeadingCandidate()?.voteCount)}%)
                    </Text>
                </View>
            )}

            {/* Live Prediction (during active election) */}
            {electionStatus.started && !isElectionEnded() && getTotalVotes() > 0 && (
                <View style={styles.predictionCard}>
                    <Text style={styles.predictionTitle}>📈 Live Prediction</Text>
                    <View style={styles.predictionContent}>
                        <Text style={styles.predictionLabel}>Currently Leading:</Text>
                        <Text style={styles.predictionName}>{getLeadingCandidate()?.name}</Text>
                        <Text style={styles.predictionVotes}>
                            {getLeadingCandidate()?.voteCount} votes ({getVotePercentage(getLeadingCandidate()?.voteCount)}%)
                        </Text>
                    </View>
                </View>
            )}

            {/* Election Status Info */}
            {!electionStatus.started && electionCount > 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>⏳</Text>
                    <Text style={styles.infoTitle}>Election Not Started</Text>
                    <Text style={styles.infoText}>The election hasn't started yet. Please wait for the admin to start it.</Text>
                </View>
            )}

            {electionCount === 0 && (
                <View style={styles.infoCard}>
                    <Text style={styles.infoIcon}>📭</Text>
                    <Text style={styles.infoTitle}>No Elections Available</Text>
                    <Text style={styles.infoText}>There are no elections created yet. Please wait for the admin to create one.</Text>
                </View>
            )}

            {/* Candidates Section */}
            {electionStatus.started && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📊 Candidates</Text>
                        {getTotalVotes() > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{getTotalVotes()} Total Votes</Text>
                            </View>
                        )}
                    </View>

                    {loading && <ActivityIndicator size="large" color="#6366f1" style={styles.loader} />}

                    {candidates.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No candidates available</Text>
                            <Text style={styles.emptySubtext}>Wait for admin to add candidates</Text>
                        </View>
                    ) : (
                        <View style={styles.candidatesList}>
                            {candidates.map((candidate, index) => {
                                const isLeading = getLeadingCandidate()?.id === candidate.id && getTotalVotes() > 0;
                                return (
                                    <View key={candidate.id} style={[styles.candidateCard, isLeading && styles.leadingCard]}>
                                        <View style={styles.candidateInfo}>
                                            <View style={[styles.avatar, { backgroundColor: `hsl(${index * 60}, 70%, 50%)` }]}>
                                                <Text style={styles.avatarText}>{getInitials(candidate.name)}</Text>
                                            </View>
                                            <View style={styles.candidateDetails}>
                                                <View style={styles.candidateHeader}>
                                                    <Text style={styles.candidateName}>{candidate.name}</Text>
                                                    {isLeading && <Text style={styles.leadingBadge}>👑 Leading</Text>}
                                                </View>
                                                <Text style={styles.voteCount}>{candidate.voteCount} votes</Text>
                                                {getTotalVotes() > 0 && (
                                                    <>
                                                        <View style={styles.voteBar}>
                                                            <View style={[styles.voteBarFill, {
                                                                width: `${getVotePercentage(candidate.voteCount)}%`,
                                                                backgroundColor: isLeading ? '#10b981' : '#6366f1'
                                                            }]} />
                                                        </View>
                                                        <Text style={styles.percentage}>{getVotePercentage(candidate.voteCount)}%</Text>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                        <TouchableOpacity
                                            style={[
                                                styles.voteButton,
                                                (isElectionEnded() || loading) && styles.disabledButton
                                            ]}
                                            onPress={() => castVote(candidate.id)}
                                            disabled={isElectionEnded() || loading}
                                        >
                                            <Text style={styles.buttonText}>
                                                {isElectionEnded() ? "Ended" : "Vote"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

// Election History Item Component
function ElectionHistoryItem({ election, contract, formatDate }) {
    const [candidates, setCandidates] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const loadCandidates = async () => {
        if (expanded) {
            setExpanded(false);
            return;
        }

        try {
            setLoading(true);
            const candidatesList = await contract.getElectionCandidates(election.id);
            const formatted = candidatesList.map(c => ({
                id: Number(c.id),
                name: c.name,
                voteCount: Number(c.voteCount)
            }));
            setCandidates(formatted);
            setExpanded(true);
        } catch (err) {
            console.error("Error loading candidates", err);
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
    electionNameCard: {
        backgroundColor: "#1a1a2e",
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6366f1",
    },
    electionNameLabel: {
        fontSize: 12,
        color: "#888",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    electionNameText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#6366f1",
        marginBottom: 16,
    },
    historyButton: {
        backgroundColor: "#6366f1",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    historyButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    section: {
        marginBottom: 20,
    },
    historyList: {
        gap: 12,
    },
    historyItem: {
        backgroundColor: "#1a1a2e",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#2d2d44",
    },
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    historyHeaderLeft: {
        flex: 1,
    },
    historyHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    historyElectionName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 12,
        color: "#888",
    },
    historyVotes: {
        fontSize: 14,
        color: "#6366f1",
        fontWeight: "600",
    },
    expandIcon: {
        fontSize: 12,
        color: "#888",
    },
    historyResults: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#2d2d44",
    },
    historyWinner: {
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        alignItems: "center",
    },
    historyWinnerLabel: {
        fontSize: 14,
        color: "#fbbf24",
        marginBottom: 4,
    },
    historyWinnerName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    historyWinnerVotes: {
        fontSize: 14,
        color: "#888",
    },
    historyCandidates: {
        gap: 8,
    },
    historyCandidateItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 8,
    },
    historyCandidateRank: {
        fontSize: 14,
        color: "#888",
        width: 30,
    },
    historyCandidateName: {
        flex: 1,
        fontSize: 14,
        color: "#fff",
    },
    historyCandidateVotes: {
        fontSize: 14,
        color: "#6366f1",
    },
    timerCard: {
        backgroundColor: "#1a1a2e",
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#6366f1",
    },
    timerLabel: {
        color: "#e0e0e0",
        fontSize: 14,
        marginBottom: 8,
    },
    timerValue: {
        color: "#fff",
        fontSize: 36,
        fontWeight: "bold",
        marginBottom: 16,
    },
    progressBar: {
        width: "100%",
        height: 8,
        backgroundColor: "#2d2d44",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#10b981",
    },
    winnerCard: {
        backgroundColor: "#1a1a2e",
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fbbf24",
    },
    winnerLabel: {
        fontSize: 18,
        color: "#fbbf24",
        marginBottom: 8,
    },
    winnerName: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 4,
    },
    winnerVotes: {
        fontSize: 16,
        color: "#888",
    },
    predictionCard: {
        backgroundColor: "#1a1a2e",
        padding: 24,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: "#10b981",
    },
    predictionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#10b981",
        marginBottom: 16,
        textAlign: "center",
    },
    predictionContent: {
        alignItems: "center",
    },
    predictionLabel: {
        fontSize: 14,
        color: "#888",
        marginBottom: 8,
    },
    predictionName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 8,
    },
    predictionVotes: {
        fontSize: 16,
        color: "#10b981",
    },
    infoCard: {
        backgroundColor: "#1a1a2e",
        padding: 32,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2d2d44",
    },
    infoIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        color: "#fff",
        fontWeight: "600",
    },
    badge: {
        backgroundColor: "#6366f1",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    badgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    loader: {
        marginVertical: 20,
    },
    candidatesList: {
        gap: 16,
    },
    candidateCard: {
        backgroundColor: "#1a1a2e",
        padding: 20,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2d2d44",
    },
    leadingCard: {
        borderColor: "#10b981",
        borderWidth: 2,
    },
    candidateInfo: {
        flex: 1,
        flexDirection: "row",
        gap: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    candidateDetails: {
        flex: 1,
    },
    candidateHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    candidateName: {
        fontSize: 18,
        color: "#fff",
        fontWeight: "600",
    },
    leadingBadge: {
        fontSize: 12,
        color: "#10b981",
    },
    voteCount: {
        color: "#888",
        fontSize: 14,
        marginBottom: 8,
    },
    voteBar: {
        width: "100%",
        height: 6,
        backgroundColor: "#2d2d44",
        borderRadius: 3,
        overflow: "hidden",
        marginBottom: 4,
    },
    voteBarFill: {
        height: "100%",
    },
    percentage: {
        color: "#6366f1",
        fontSize: 12,
        fontWeight: "600",
    },
    voteButton: {
        backgroundColor: "#6366f1",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    disabledButton: {
        backgroundColor: "#2d2d44",
        opacity: 0.5,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        color: "#888",
        fontSize: 18,
        marginBottom: 8,
    },
    emptySubtext: {
        color: "#666",
        fontSize: 14,
    },
});
