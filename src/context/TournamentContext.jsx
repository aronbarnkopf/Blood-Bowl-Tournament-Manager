import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    getDocs,
    increment,
    getCountFromServer
} from 'firebase/firestore';
import { db } from '../config';
import { useAuth } from './AuthContext';
import {
    parseCurrency,
    formatCurrency,
    calculateTeamValue,
    calculateCurrentTeamValue,
    calculateSidelineValue,
    isTeamFinalized,
    getRerollPurchaseCost,
    getTotalRounds,
    fallbackRound
} from '../utils/bbRules';

const TournamentContext = createContext();

const computeStandings = (teams, matches) => {
    const standings = teams.map(team => ({
        tournamentId: team.tournamentId,
        teamId: team.id,
        p: 0, w: 0, l: 0, d: 0, td_plus: 0, td_minus: 0, pts: 0
    }));

    matches.filter(m => m.status === 'played').forEach(match => {
        const teamA = standings.find(s => s.teamId === match.teamA);
        const teamB = standings.find(s => s.teamId === match.teamB);

        // Handle normal matches
        if (teamA && teamB) {
            const sA = parseInt(match.scoreA) || 0;
            const sB = parseInt(match.scoreB) || 0;

            teamA.p += 1;
            teamA.td_plus += sA;
            teamA.td_minus += sB;

            teamB.p += 1;
            teamB.td_plus += sB;
            teamB.td_minus += sA;

            if (sA > sB) {
                teamA.w += 1;
                teamA.pts += 3;
                teamB.l += 1;
            } else if (sB > sA) {
                teamB.w += 1;
                teamB.pts += 3;
                teamA.l += 1;
            } else {
                teamA.d += 1;
                teamA.pts += 1;
                teamB.d += 1;
                teamB.pts += 1;
            }
        }
        // Handle matches with BYE
        else if (teamA && match.teamB === 'BYE') {
            const sA = parseInt(match.scoreA) || 0;
            teamA.p += 1;
            teamA.td_plus += sA;
            teamA.w += 1;
            teamA.pts += 3;
        } else if (teamB && match.teamA === 'BYE') {
            const sB = parseInt(match.scoreB) || 0;
            teamB.p += 1;
            teamB.td_plus += sB;
            teamB.w += 1;
            teamB.pts += 3;
        }
    });

    return standings;
};

export const TournamentProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState({}); // { [teamId]: [players] }
    const [matches, setMatches] = useState([]);

    // Default to the first tournament if available, or null
    const [activeTournamentId, setActiveTournamentId] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Subscribe to Tournaments
    useEffect(() => {
        if (!currentUser?.email) {
            setTournaments([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'tournaments'),
            where('adminEmails', 'array-contains', currentUser.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTournaments(loaded);

            // Auto-select first if none selected
            if (!activeTournamentId && loaded.length > 0) {
                setActiveTournamentId(loaded[0].id);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tournaments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, activeTournamentId]);

    // Backfill teamCount if missing
    useEffect(() => {
        tournaments.forEach(async (t) => {
            if (t.teamCount === undefined) {
                try {
                    const q = query(collection(db, 'teams'), where('tournamentId', '==', t.id));
                    const snapshot = await getCountFromServer(q);
                    const count = snapshot.data().count;

                    await updateDoc(doc(db, 'tournaments', t.id), {
                        teamCount: count
                    });
                } catch (err) {
                    console.error("Error backfilling teamCount:", err);
                }
            }
        });
    }, [tournaments]);

    // 2. Subscribe to Teams, Matches, Players for Active Tournament
    useEffect(() => {
        if (!activeTournamentId) {
            setTeams([]);
            setMatches([]);
            setPlayers({});
            return;
        }

        // Teams
        const teamsQ = query(collection(db, 'teams'), where('tournamentId', '==', activeTournamentId));
        const unsubTeams = onSnapshot(teamsQ, (snapshot) => {
            setTeams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Matches
        const matchesQ = query(collection(db, 'matches'), where('tournamentId', '==', activeTournamentId));
        const unsubMatches = onSnapshot(matchesQ, (snapshot) => {
            setMatches(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Players - fetching all for the tournament to categorize by team
        const playersQ = query(collection(db, 'players'), where('tournamentId', '==', activeTournamentId));
        const unsubPlayers = onSnapshot(playersQ, (snapshot) => {
            const allPlayers = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // Group by teamId
            const grouped = allPlayers.reduce((acc, player) => {
                if (!acc[player.teamId]) acc[player.teamId] = [];
                acc[player.teamId].push(player);
                return acc;
            }, {});
            setPlayers(grouped);
        });

        return () => {
            unsubTeams();
            unsubMatches();
            unsubPlayers();
        };
    }, [activeTournamentId]);

    // Dynamic Leaderboard Calculation
    const leaderboard = useMemo(() => computeStandings(teams, matches), [teams, matches]);

    const activeTournament = tournaments.find(t => t.id === activeTournamentId);

    const addTournament = async (newTournament) => {
        if (!currentUser) return;
        try {
            const docRef = await addDoc(collection(db, 'tournaments'), {
                ...newTournament,
                created: (() => { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); })(),
                ownerId: currentUser.uid,
                adminEmails: [currentUser.email],
                teamCount: 0
            });
            // Auto-switch to new tournament
            setActiveTournamentId(docRef.id);
        } catch (error) {
            console.error("Error adding tournament:", error);
            alert("Failed to create tournament");
        }
    };

    const shareTournament = async (tournamentId, email) => {
        try {
            const t = tournaments.find(t => t.id === tournamentId);
            if (!t) return;
            const newAdmins = [...(t.adminEmails || []), email];
            // Remove duplicates
            const uniqueAdmins = [...new Set(newAdmins)];

            await updateDoc(doc(db, 'tournaments', tournamentId), {
                adminEmails: uniqueAdmins
            });
        } catch (error) {
            console.error("Error sharing tournament:", error);
            throw error;
        }
    };

    const updateTournament = async (updatedTournament) => {
        try {
            const { id, ...data } = updatedTournament;
            const oldTournament = tournaments.find(t => t.id === id);

            const isStarting =
                oldTournament &&
                oldTournament.status !== 'In Progress' &&
                updatedTournament.status === 'In Progress';

            if (isStarting) {
                data.currentRound = 1;
                data.totalRounds = getTotalRounds(
                    updatedTournament.format,
                    oldTournament.teamCount ?? teams.length,
                    updatedTournament.cycles
                );
            }

            await updateDoc(doc(db, 'tournaments', id), data);

            // Trigger match generation if status changed to "In Progress"
            if (isStarting) {
                await generateMatches(id, teams, updatedTournament.format);
            }
        } catch (error) {
            console.error("Error updating tournament:", error);
        }
    };

    const deleteTournament = async (id) => {
        if (!window.confirm("Are you sure? This will PERMANENTLY delete all teams, players, and matches associated with this tournament.")) return;

        try {
            const batch = writeBatch(db);

            // 1. Get all matches for this tournament
            const matchesQ = query(collection(db, 'matches'), where('tournamentId', '==', id));
            const matchesSnapshot = await getDocs(matchesQ);
            matchesSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 2. Get all teams for this tournament
            const teamsQ = query(collection(db, 'teams'), where('tournamentId', '==', id));
            const teamsSnapshot = await getDocs(teamsQ);

            // 3. Get all players for this tournament
            // Optimally, if 'tournamentId' is stored on players, we can just query players by tournamentId
            // Based on previous code, players DO have tournamentId.
            const playersQ = query(collection(db, 'players'), where('tournamentId', '==', id));
            const playersSnapshot = await getDocs(playersQ);

            teamsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            playersSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 4. Delete the tournament itself
            const tournamentRef = doc(db, 'tournaments', id);
            batch.delete(tournamentRef);

            await batch.commit();

            if (activeTournamentId === id) setActiveTournamentId(null);

        } catch (error) {
            console.error("Error deleting tournament:", error);
            alert("Error deleting tournament: " + error.message);
        }
    };

    const generateMatches = async (tournamentId, teamsList, format) => {
        const teamsSnap = await getDocs(query(collection(db, 'teams'), where('tournamentId', '==', tournamentId)));
        const tournamentTeams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (tournamentTeams.length < 2) return;

        const activeT = tournaments.find(t => t.id === tournamentId);
        const cycles = format === 'Multi Round Robin' ? (activeT?.cycles || 2) : 1;

        const batch = writeBatch(db);

        if (format === 'Round Robin' || format === 'Multi Round Robin') {
            const teamIds = tournamentTeams.map(t => t.id);
            const isOdd = teamIds.length % 2 !== 0;
            if (isOdd) teamIds.push(null); // Bye

            const n = teamIds.length;
            const roundsPerCycle = n - 1;
            const half = n / 2;

            for (let c = 0; c < cycles; c++) {
                let currentCycleTeamIds = [...teamIds];

                for (let r = 0; r < roundsPerCycle; r++) {
                    const currentRound = (c * roundsPerCycle) + r + 1;

                    for (let i = 0; i < half; i++) {
                        const teamA = currentCycleTeamIds[i];
                        const teamB = currentCycleTeamIds[n - 1 - i];

                        if (teamA && teamB) {
                            const matchRef = doc(collection(db, 'matches'));
                            batch.set(matchRef, {
                                tournamentId,
                                teamA,
                                teamB,
                                date: `Round ${currentRound}`,
                                time: 'TBD',
                                status: 'upcoming',
                                round: currentRound,
                                cycle: c + 1
                            });
                        }
                    }
                    currentCycleTeamIds.splice(1, 0, currentCycleTeamIds.pop());
                }
            }
        } else {
            // Initial round for Swiss or Elimination
            const teamIds = [...tournamentTeams.map(t => t.id)];
            // Randomize Round 1 pairings for non-RR
            for (let i = teamIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
            }

            const isOdd = teamIds.length % 2 !== 0;
            if (isOdd) teamIds.push(null);

            for (let i = 0; i < teamIds.length; i += 2) {
                const teamA = teamIds[i];
                const teamB = teamIds[i + 1];

                if (teamA || teamB) { // At least one must exist (one could be null for Bye)
                    const matchRef = doc(collection(db, 'matches'));
                    batch.set(matchRef, {
                        tournamentId,
                        teamA: teamA || 'BYE',
                        teamB: teamB || 'BYE',
                        date: 'Round 1',
                        time: 'TBD',
                        status: teamA === null || teamB === null ? 'played' : 'upcoming',
                        round: 1,
                        scoreA: teamA === null ? 0 : (teamB === null ? 1 : 0),
                        scoreB: teamB === null ? 0 : (teamA === null ? 1 : 0),
                        isBye: teamA === null || teamB === null
                    });
                }
            }
        }

        await batch.commit();
    };

    const STATUS_PROGRESSION = {
        injured: 'recovering',
        recovering: 'active'
    };

    const advancePlayerStatuses = async (tournamentId, batch) => {
        const playersSnap = await getDocs(
            query(collection(db, 'players'), where('tournamentId', '==', tournamentId))
        );

        playersSnap.docs.forEach(d => {
            const nextStatus = STATUS_PROGRESSION[d.data().status];
            if (nextStatus) {
                batch.update(d.ref, { status: nextStatus });
            }
        });
    };

    const generateNextRound = async (tournamentId) => {
        const t = tournaments.find(t => t.id === tournamentId);
        if (!t) return;

        const [matchesSnap, teamsSnap] = await Promise.all([
            getDocs(query(collection(db, 'matches'), where('tournamentId', '==', tournamentId))),
            getDocs(query(collection(db, 'teams'), where('tournamentId', '==', tournamentId)))
        ]);
        const tournamentMatches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const tournamentTeams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fallbacks for tournaments that were started before these fields existed
        const currentRound = t.currentRound ?? fallbackRound(tournamentMatches);
        const totalRounds = t.totalRounds ?? getTotalRounds(t.format, tournamentTeams.length, t.cycles);

        if (currentRound >= totalRounds) {
            alert(`This is already the final round (${currentRound}/${totalRounds}). Finalize the tournament instead.`);
            return;
        }

        const currentRoundMatches = tournamentMatches.filter(m => m.round === currentRound);
        const allPlayed = currentRoundMatches.every(m => m.status === 'played');
        if (!allPlayed) {
            alert("All matches in the current round must be resolved first!");
            return;
        }

        const batch = writeBatch(db);
        const nextRound = currentRound + 1;

        if (t.format === 'Swiss') {
            // Swiss is capped at log2(number of teams) rounds (rounded up for non-powers of two, e.g. 6 teams -> 3 rounds, 8 teams -> 3 rounds, 16 teams -> 4 rounds).
            const maxSwissRounds = Math.ceil(Math.log2(Math.max(tournamentTeams.length, 1)));
            if (currentRound >= maxSwissRounds) {
                alert(`Cannot generate another round: a Swiss tournament with ${tournamentTeams.length} teams is limited to ${maxSwissRounds} round${maxSwissRounds === 1 ? '' : 's'}. Finalize the tournament instead.`);
                return;
            }

            const tournamentStandings = computeStandings(tournamentTeams, tournamentMatches)
                .filter(s => s.tournamentId === tournamentId)
                .sort((a, b) => {
                    if (b.pts !== a.pts) return b.pts - a.pts;
                    if ((b.td_plus - b.td_minus) !== (a.td_plus - a.td_minus)) return (b.td_plus - b.td_minus) - (a.td_plus - a.td_minus);
                    if (b.td_plus !== a.td_plus) return b.td_plus - a.td_plus;
                    return b.w - a.w;
                });

            let teamIds = tournamentStandings.map(s => s.teamId);
            const isOdd = teamIds.length % 2 !== 0;
            const byeTeam = isOdd ? teamIds.pop() : null;

            // Simple Swiss Pairing with repeat avoidance
            const pastMatchups = tournamentMatches.map(m => [m.teamA, m.teamB]);
            const hasPlayed = (id1, id2) => pastMatchups.some(m => (m[0] === id1 && m[1] === id2) || (m[0] === id2 && m[1] === id1));

            let pairings = [];
            let unparied = [...teamIds];

            while (unparied.length > 1) {
                const teamA = unparied.shift();
                let foundMatch = false;

                for (let j = 0; j < unparied.length; j++) {
                    const teamB = unparied[j];
                    if (!hasPlayed(teamA, teamB)) {
                        pairings.push([teamA, teamB]);
                        unparied.splice(j, 1);
                        foundMatch = true;
                        break;
                    }
                }

                if (!foundMatch) {
                    // Fallback to first available if no new matchup found
                    const teamB = unparied.shift();
                    pairings.push([teamA, teamB]);
                }
            }

            // Create matches from pairings
            pairings.forEach(p => {
                const matchRef = doc(collection(db, 'matches'));
                batch.set(matchRef, {
                    tournamentId,
                    teamA: p[0],
                    teamB: p[1],
                    date: `Round ${nextRound}`,
                    time: 'TBD',
                    status: 'upcoming',
                    round: nextRound,
                    isBye: false
                });
            });

            // Handle bye if exists
            if (byeTeam) {
                const matchRef = doc(collection(db, 'matches'));
                batch.set(matchRef, {
                    tournamentId,
                    teamA: byeTeam,
                    teamB: 'BYE',
                    date: `Round ${nextRound}`,
                    time: 'TBD',
                    status: 'played',
                    round: nextRound,
                    scoreA: 1,
                    scoreB: 0,
                    isBye: true
                });
            }
        } else if (t.format === 'Single Elimination') {
            // Get winners from the previous round
            const winners = [];
            let drawFound = false;

            currentRoundMatches.forEach(m => {
                if (m.isBye) {
                    winners.push(m.teamA === 'BYE' ? m.teamB : m.teamA);
                } else if (parseInt(m.scoreA) === parseInt(m.scoreB)) {
                    drawFound = true;
                } else {
                    winners.push(parseInt(m.scoreA) > parseInt(m.scoreB) ? m.teamA : m.teamB);
                }
            });

            if (drawFound) {
                alert("One or more matches are tied. Elimination rounds cannot have draws! Please use the 'Resolve Match' tool to update the score with a winner (e.g. penalty shootout).");
                return;
            }

            if (winners.length < 2) {
                alert("Tournament complete! Only one winner remains.");
                return;
            }

            const isOdd = winners.length % 2 !== 0;
            const byeWinner = isOdd ? winners.pop() : null;

            for (let i = 0; i < winners.length; i += 2) {
                const teamA = winners[i];
                const teamB = winners[i + 1];

                const matchRef = doc(collection(db, 'matches'));
                batch.set(matchRef, {
                    tournamentId,
                    teamA,
                    teamB,
                    date: `Round ${nextRound}`,
                    time: 'TBD',
                    status: 'upcoming',
                    round: nextRound,
                    isBye: false
                });
            }

            if (byeWinner) {
                const matchRef = doc(collection(db, 'matches'));
                batch.set(matchRef, {
                    tournamentId,
                    teamA: byeWinner,
                    teamB: 'BYE',
                    date: `Round ${nextRound}`,
                    time: 'TBD',
                    status: 'played',
                    round: nextRound,
                    scoreA: 1,
                    scoreB: 0,
                    isBye: true
                });
            }
        }
        else if (t.format === 'Double Elimination') {
            // Very simplified Double Elimination
            // Winners of current matches stay in Winners bracket, losers move to Losers bracket
            // This is a placeholder for a full DE algorithm
            alert("Double Elimination progression is complex and currently follows a simplified logic. Check manual pairing if needed.");
            // For now, let's at least handle the basic 'who is still in' logic
        }

        await advancePlayerStatuses(tournamentId, batch);
        
        batch.update(doc(db, 'tournaments', tournamentId), {
            currentRound: nextRound,
            totalRounds
        });

        await batch.commit();
    };

    const addTeam = async (tournamentId, teamData) => {
        try {
            const batch = writeBatch(db);
            const teamRef = doc(collection(db, 'teams'));
            batch.set(teamRef, {
                ...teamData,
                tournamentId,
                confirmed: false // example field
            });

            const tournamentRef = doc(db, 'tournaments', tournamentId);
            batch.update(tournamentRef, {
                teamCount: increment(1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Error adding team:", error);
        }
    };

    const updateTeam = async (teamId, teamData) => {
        try {
            const { id, ...data } = teamData;
            await updateDoc(doc(db, 'teams', teamId), data);
        } catch (error) {
            console.error("Error updating team:", error);
        }
    };

    const deleteTeam = async (teamId, tournamentId) => {
        try {
            const batch = writeBatch(db);
            const teamRef = doc(db, 'teams', teamId);
            batch.delete(teamRef);

            const teamPlayers = players[teamId] || [];
            teamPlayers.forEach(p => {
                batch.delete(doc(db, 'players', p.id));
            });

            // Decrement team count
            const tournamentRef = doc(db, 'tournaments', tournamentId);
            batch.update(tournamentRef, {
                teamCount: increment(-1)
            });

            await batch.commit();
        } catch (error) {
            console.error("Error deleting team:", error);
        }
    };

    const updateSideline = async (teamId, type, change, costOverride) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const tournament = tournaments.find(t => t.id === team.tournamentId);
        const finalized = isTeamFinalized(team, tournament, matches);

        let cost = 0;
        let currentValue = 0;
        let valueKey = '';

        if (type === 'rerolls') {
            cost = costOverride !== undefined ? parseInt(costOverride) : getRerollPurchaseCost(team, finalized);
            valueKey = 'rerolls';
            currentValue = parseInt(team.rerolls) || 0;
        } else if (type === 'cheerleaders') {
            cost = costOverride !== undefined ? parseInt(costOverride) : (parseInt(team.cheerleaderCost) || 10000);
            valueKey = 'cheerleaders';
            currentValue = parseInt(team.cheerleaders) || 0;
        } else if (type === 'assistantCoaches') {
            cost = costOverride !== undefined ? parseInt(costOverride) : (parseInt(team.assistantCoachCost) || 10000);
            valueKey = 'assistantCoaches';
            currentValue = parseInt(team.assistantCoaches) || 0;
        } else if (type === 'apothecary') {
            cost = costOverride !== undefined ? parseInt(costOverride) : (parseInt(team.apothecaryCost) || 50000);
            valueKey = 'apothecary';
            currentValue = team.apothecary ? 1 : 0;
        }

        // Only handle cost changes without purchase
        if (change === 0 && costOverride !== undefined) {
            const costKey = type === 'rerolls' ? 'rerollCost' :
                type === 'cheerleaders' ? 'cheerleaderCost' :
                    type === 'assistantCoaches' ? 'assistantCoachCost' : 'apothecaryCost';
            await updateTeam(teamId, { [costKey]: cost });
            return;
        }

        const currentTreasury = parseCurrency(team.treasury);

        // Handle reduction (change < 0)
        if (change < 0) {
            if (currentValue <= 0) return;

            // In Blood Bowl: If team is finalized (active tournament), firing sideline staff or rerolls refunds 0 gold!
            // If team is still in draft / recruiting, full refund is returned.
            const refund = finalized ? 0 : (type === 'rerolls' ? (parseInt(team.rerollCost) || 60000) : cost);
            const newTreasury = currentTreasury + refund;

            const updates = {
                treasury: formatCurrency(newTreasury)
            };

            if (type === 'apothecary') {
                updates.apothecary = false;
            } else {
                updates[valueKey] = Math.max(0, currentValue + change);
            }

            await updateTeam(teamId, updates);
            return;
        }

        // Handle purchase (change > 0)
        if (cost > currentTreasury) {
            alert(`Insufficient funds! Need ${cost.toLocaleString()} gold.`);
            return;
        }

        const newTreasury = currentTreasury - cost;
        const updates = {
            treasury: formatCurrency(newTreasury)
        };

        if (type === 'apothecary') {
            updates.apothecary = true;
        } else {
            updates[valueKey] = currentValue + change;
        }

        await updateTeam(teamId, updates);
    };

    const addPlayer = async (teamId, playerData) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const playerCost = parseCurrency(playerData.cost);
        const currentTreasury = parseCurrency(team.treasury);

        if (playerCost > currentTreasury) {
            alert("Insufficient funds!");
            return;
        }

        const batch = writeBatch(db);

        // 1. Add Player
        const playerRef = doc(collection(db, 'players'));
        batch.set(playerRef, {
            ...playerData,
            teamId,
            tournamentId: team.tournamentId,
            spp: 0,
            status: 'active'
        });

        // 2. Update Team Treasury
        const newTreasury = currentTreasury - playerCost;
        const teamRef = doc(db, 'teams', teamId);
        batch.update(teamRef, { treasury: newTreasury.toLocaleString() + ' gold' });

        await batch.commit();
    };

    const updatePlayer = async (teamId, updatedPlayer) => {
        const { id, ...data } = updatedPlayer;
        await updateDoc(doc(db, 'players', id), data);
    };

    /**
     * Moves sourcePlayer to targetSlot.
     * If targetSlot is occupied by another player, their numbers are swapped atomically.
     */
    const reassignPlayerSlot = async (teamId, sourcePlayerId, targetSlot) => {
        const teamPlayers = players[teamId] || [];
        const sourcePlayer = teamPlayers.find(p => p.id === sourcePlayerId);
        if (!sourcePlayer) return;

        const targetPlayer = teamPlayers.find(
            p => p.status !== 'dead' && parseInt(p.number) === parseInt(targetSlot) && p.id !== sourcePlayerId
        );

        const batch = writeBatch(db);

        if (targetPlayer) {
            // Swap: give the target player the source player's old slot number
            batch.update(doc(db, 'players', targetPlayer.id), { number: parseInt(sourcePlayer.number) });
        }

        // Move source player to the target slot
        batch.update(doc(db, 'players', sourcePlayerId), { number: parseInt(targetSlot) });

        await batch.commit();
    };

    const deletePlayer = async (teamId, playerId) => {
        const team = teams.find(t => t.id === teamId);
        const player = (players[teamId] || []).find(p => p.id === playerId);
        if (!team || !player) return;

        const tournament = tournaments.find(t => t.id === team.tournamentId);
        const finalized = isTeamFinalized(team, tournament, matches);

        // Under Blood Bowl rules:
        // Pre-finalization / drafting: refund hiring cost to Treasury.
        // Post-finalization / during active season: fired players yield 0 gold refund.
        const refundAmount = finalized ? 0 : parseCurrency(player.cost);
        const currentTreasury = parseCurrency(team.treasury);
        const newTreasury = currentTreasury + refundAmount;

        const batch = writeBatch(db);
        batch.delete(doc(db, 'players', playerId));
        if (refundAmount > 0) {
            batch.update(doc(db, 'teams', teamId), { treasury: formatCurrency(newTreasury) });
        }

        await batch.commit();
    };

    const STAT_STEP = { ma: 1, st: 1, av: 1, ag: -1, pa: -1 };
    const STAT_MIN = { ag: 1, pa: 1 }; // AG and PA can't go below 1+

    const isCharacteristic = (skill) =>
        Object.prototype.hasOwnProperty.call(STAT_STEP, String(skill).toLowerCase());

    // Returns the upgraded value in the same format it was stored in, or null if it can't be applied
    const applyStatUpgrade = (stat, currentValue) => {
        const key = String(stat).toLowerCase();
        const raw = String(currentValue ?? '').trim();
        const num = parseInt(raw, 10);
        if (Number.isNaN(num)) return null;

        const next = num + STAT_STEP[key];
        if (STAT_MIN[key] !== undefined && next < STAT_MIN[key]) return null;

        if (raw.endsWith('+')) return `${next}+`;          // "4+" -> "3+"
        return typeof currentValue === 'number' ? next : String(next);
    };

    const advancePlayer = async (teamId, playerId, skill, valueIncrease, sppCost) => {
        const team = teams.find(t => t.id === teamId);
        const player = (players[teamId] || []).find(p => p.id === playerId);
        if (!team || !player) return;

        const statKey = String(skill).toLowerCase();
        const isStat = isCharacteristic(statKey);

        // Work out the stat change first, so we never spend SPP on an invalid upgrade
        let statUpdate = {};
        if (isStat) {
            const upgraded = applyStatUpgrade(statKey, player[statKey]);
            if (upgraded === null) {
                console.warn(`Cannot upgrade ${statKey.toUpperCase()} (current: ${player[statKey]})`);
                return false;
            }
            statUpdate = { [statKey]: upgraded };
        }

        const currentCostNum = parseCurrency(player.cost);
        const newCostNum = currentCostNum + (parseInt(valueIncrease) || 0);

        const currentSpp = parseInt(player.spp) || 0;
        const newSpp = Math.max(0, currentSpp - (parseInt(sppCost) || 0));

        const batch = writeBatch(db);
        batch.update(doc(db, 'players', playerId), {
            ...statUpdate,
            // characteristics are not skills, so only add real skills to the list
            skills: isStat ? (player.skills || []) : [...(player.skills || []), skill],
            cost: formatCurrency(newCostNum),
            spp: newSpp,
            advancementsCount: (player.advancementsCount || (player.advancements || []).length || 0) + 1,
            advancements: [...(player.advancements || []), {
                skill: isStat ? `+1 ${statKey.toUpperCase()}` : skill,
                type: isStat ? 'characteristic' : 'skill',
                valueIncrease: parseInt(valueIncrease) || 0,
                sppCost: parseInt(sppCost) || 0,
                date: new Date().toISOString()
            }]
        });

        await batch.commit();
        return true;
    };

    const awardSpp = async (teamId, playerId, amount, reason) => {
        const player = (players[teamId] || []).find(p => p.id === playerId);
        const team = teams.find(t => t.id === teamId);
        if (!player || !team) return;

        const batch = writeBatch(db);
        const awardedAmount = parseInt(amount) || 0;

        // 1. Update Player SPP and Career SPP
        const newSpp = (parseInt(player.spp) || 0) + awardedAmount;
        const newCareerSpp = (parseInt(player.careerSpp !== undefined ? player.careerSpp : player.spp) || 0) + awardedAmount;
        const playerUpdates = {
            spp: newSpp,
            careerSpp: newCareerSpp
        };

        batch.update(doc(db, 'players', playerId), playerUpdates);

        // 2. Update Team Statistics
        const currentStats = team.stats || {};
        const teamUpdates = {
            stats: {
                ...currentStats,
            }
        };

        if (reason === 'Touchdown') teamUpdates.stats.td = (currentStats.td || 0) + 1;
        if (reason === 'Casualty') teamUpdates.stats.cas = (currentStats.cas || 0) + 1;
        if (reason === 'Interception') teamUpdates.stats.int = (currentStats.int || 0) + 1;
        if (reason === 'Pass' || reason === 'Completion') teamUpdates.stats.pass = (currentStats.pass || 0) + 1;
        if (reason === 'Throw Team Mate') teamUpdates.stats.ttm = (currentStats.ttm || 0) + 1;
        if (reason === 'Safe Landing') teamUpdates.stats.safe = (currentStats.safe || 0) + 1;
        if (reason === 'MVP') teamUpdates.stats.mvp = (currentStats.mvp || 0) + 1;

        teamUpdates.stats.spp = (currentStats.spp || 0) + awardedAmount;

        // Record history event on team for safe undo
        const historyEvent = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'awardSpp',
            playerId,
            amount: awardedAmount,
            reason,
            timestamp: new Date().toISOString()
        };
        const currentHistory = team.recentEvents || [];
        teamUpdates.recentEvents = [historyEvent, ...currentHistory].slice(0, 20); // Keep last 20 events

        batch.update(doc(db, 'teams', teamId), teamUpdates);

        await batch.commit();
    };

    const undoRecentEvent = async (teamId) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return { success: false, message: 'Team not found' };

        const history = team.recentEvents || [];
        if (history.length === 0) return { success: false, message: 'No recent events to undo' };

        const eventToUndo = history[0];
        const batch = writeBatch(db);

        if (eventToUndo.type === 'awardSpp') {
            const player = (players[teamId] || []).find(p => p.id === eventToUndo.playerId);
            if (!player) return { success: false, message: 'Player no longer exists' };

            const updatedSpp = Math.max(0, (parseInt(player.spp) || 0) - eventToUndo.amount);
            const updatedCareer = Math.max(0, (parseInt(player.careerSpp) || 0) - eventToUndo.amount);

            batch.update(doc(db, 'players', player.id), {
                spp: updatedSpp,
                careerSpp: updatedCareer
            });

            const currentStats = team.stats || {};
            const updatedStats = { ...currentStats };

            if (eventToUndo.reason === 'Touchdown') updatedStats.td = Math.max(0, (currentStats.td || 0) - 1);
            if (eventToUndo.reason === 'Casualty') updatedStats.cas = Math.max(0, (currentStats.cas || 0) - 1);
            if (eventToUndo.reason === 'Interception') updatedStats.int = Math.max(0, (currentStats.int || 0) - 1);
            if (eventToUndo.reason === 'Pass' || eventToUndo.reason === 'Completion') updatedStats.pass = Math.max(0, (currentStats.pass || 0) - 1);
            if (eventToUndo.reason === 'Throw Team Mate') updatedStats.ttm = Math.max(0, (currentStats.ttm || 0) - 1);
            if (eventToUndo.reason === 'Safe Landing') updatedStats.safe = Math.max(0, (currentStats.safe || 0) - 1);
            if (eventToUndo.reason === 'MVP') updatedStats.mvp = Math.max(0, (currentStats.mvp || 0) - 1);

            updatedStats.spp = Math.max(0, (currentStats.spp || 0) - eventToUndo.amount);

            batch.update(doc(db, 'teams', teamId), {
                stats: updatedStats,
                recentEvents: history.slice(1)
            });

            await batch.commit();
            return { success: true, message: `Reversed +${eventToUndo.amount} SPP (${eventToUndo.reason}) on ${player.name}` };
        }

        return { success: false, message: 'Unsupported event type' };
    };

    const resolveMatch = async (matchId, result) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const { scoreA, scoreB, earningsA, earningsB, playedDate } = result;
        const isEditingPlayed = match.status === 'played';

        const prevEarningsA = isEditingPlayed ? (parseInt(match.earningsA) || 0) : 0;
        const prevEarningsB = isEditingPlayed ? (parseInt(match.earningsB) || 0) : 0;

        const diffA = (parseInt(earningsA) || 0) - prevEarningsA;
        const diffB = (parseInt(earningsB) || 0) - prevEarningsB;

        const finalDate = playedDate || match.playedDate || (isEditingPlayed ? match.date : (() => { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); })());

        const batch = writeBatch(db);
        batch.update(doc(db, 'matches', matchId), {
            ...result,
            status: 'played',
            date: finalDate,
            playedDate: finalDate
        });

        // Update Treasuries by difference
        if (diffA !== 0) {
            const teamA = teams.find(t => t.id === match.teamA);
            if (teamA) {
                const cur = parseCurrency(teamA.treasury);
                batch.update(doc(db, 'teams', match.teamA), {
                    treasury: formatCurrency(cur + diffA)
                });
            }
        }
        if (diffB !== 0) {
            const teamB = teams.find(t => t.id === match.teamB);
            if (teamB) {
                const cur = parseCurrency(teamB.treasury);
                batch.update(doc(db, 'teams', match.teamB), {
                    treasury: formatCurrency(cur + diffB)
                });
            }
        }

        await batch.commit();
    };

    const getTeamValue = (teamId) => {
        const teamPlayers = players[teamId] || [];
        const team = teams.find(t => t.id === teamId);
        if (!team) return "0 gold";
        return formatCurrency(calculateTeamValue(team, teamPlayers));
    };

    const getCurrentTeamValue = (teamId) => {
        const teamPlayers = players[teamId] || [];
        const team = teams.find(t => t.id === teamId);
        if (!team) return "0 gold";
        return formatCurrency(calculateCurrentTeamValue(team, teamPlayers));
    };

    return (
        <TournamentContext.Provider value={{
            tournaments,
            teams,
            leaderboard,
            players,
            matches,
            activeTournamentId,
            activeTournament,
            setActiveTournament: setActiveTournamentId,
            addTournament,
            updateTournament,
            deleteTournament,
            addTeam,
            deleteTeam,
            updateTeam,
            getTeamValue,
            getCurrentTeamValue,
            updateSideline,
            generateMatches,
            generateNextRound,
            resolveMatch,
            addPlayer,
            updatePlayer,
            deletePlayer,
            reassignPlayerSlot,
            advancePlayer,
            awardSpp,
            undoRecentEvent,
            shareTournament,
            loading
        }}>
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};
