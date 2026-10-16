import React from 'react';
import { Trophy } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

const LeaderboardView = () => {
    const { activeTournamentId, activeTournament, teams, leaderboard } = useTournament();

    const isRecruiting = activeTournament?.status === 'Recruiting';

    const data = leaderboard
        .filter(entry => entry.tournamentId === activeTournamentId)
        .map(entry => ({
            ...entry,
            team: teams.find(t => t.id === entry.teamId)
        }))
        .sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;

            // 1. TD Difference
            const netA = a.td_plus - a.td_minus;
            const netB = b.td_plus - b.td_minus;
            if (netB !== netA) return netB - netA;

            // 2. TD Made
            if (b.td_plus !== a.td_plus) return b.td_plus - a.td_plus;

            // 3. Number of Wins
            return b.w - a.w;
        });

    const getRankIcon = (rank) => {
        if (rank === 0) return <Trophy size={18} className="text-gold" />;
        if (rank === 1) return <Trophy size={18} style={{ color: '#C0C0C0' }} />;
        if (rank === 2) return <Trophy size={18} style={{ color: '#CD7F32' }} />;
        return rank + 1;
    };

    return (
        <div className="view-container">
            <header className="leaderboard-header">
                <div className="trophy-circle">
                    <Trophy size={32} />
                </div>
                <h1>TOURNAMENT LEADERBOARD</h1>
                <p className="text-muted">Current standings for all participating teams</p>
            </header>

            {!isRecruiting ? (
                <>
                    <div className="legend">
                        <span><strong>P</strong> Played</span>
                        <span style={{ color: '#4ade80' }}><strong>W</strong> Wins</span>
                        <span style={{ color: '#f87171' }}><strong>L</strong> Losses</span>
                        <span style={{ color: '#9ca3af' }}><strong>D</strong> Draws</span>
                        <span style={{ color: '#4ade80' }}><strong>TD+</strong> Touchdowns For</span>
                        <span style={{ color: '#f87171' }}><strong>TD-</strong> Touchdowns Against</span>
                        <span style={{ color: 'var(--color-primary)' }}><strong>Pts</strong> Points</span>
                    </div>

                    <div className="table-container animate-in">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Team</th>
                                    <th className="center">P</th>
                                    <th className="center">W</th>
                                    <th className="center">L</th>
                                    <th className="center">D</th>
                                    <th className="center">TD+</th>
                                    <th className="center">TD-</th>
                                    <th className="center">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((entry, index) => (
                                    <tr key={entry.teamId}>
                                        <td className="rank-cell">{getRankIcon(index)}</td>
                                        <td>
                                            <div className="team-cell">
                                                <div className="small-icon" style={{ backgroundColor: entry.team?.color }}>
                                                    {entry.team?.icon?.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="team-name">{entry.team?.name}</div>
                                                    <div className="team-race">{entry.team?.race}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="center"><strong>{entry.p}</strong></td>
                                        <td className="center highlight-w">{entry.w}</td>
                                        <td className="center highlight-l">{entry.l}</td>
                                        <td className="center text-muted">{entry.d}</td>
                                        <td className="center highlight-w">{entry.td_plus}</td>
                                        <td className="center highlight-l">{entry.td_minus || entry.td_edge || 0}</td>
                                        <td className="center pts-cell">{entry.pts}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                            No standings recorded yet for this tournament.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="points-info card">
                        <strong>Points System:</strong> Win = 3 pts | Draw = 1 pt | Loss = 0 pts
                    </div>
                </>
            ) : (
                <div className="recruiting-placeholder card animate-in">
                    <Trophy size={48} className="text-muted" style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                    <h3>LEADERBOARD UNAVAILABLE</h3>
                    <p className="text-muted">The standings will be calculated once the tournament begins and the first blood is drawn.</p>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        .view-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .leaderboard-header { text-align: center; margin-bottom: 3rem; }
        .trophy-circle {
          display: inline-flex;
          padding: 1.5rem;
          background-color: rgba(211, 16, 39, 0.1);
          border-radius: 50%;
          color: var(--color-primary);
          margin-bottom: 1.5rem;
          border: 1px solid rgba(211, 16, 39, 0.2);
        }
        .leaderboard-header h1 { font-size: 2.8rem; margin-bottom: 0.5rem; }
        
        .legend {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
          font-size: 0.85rem;
          flex-wrap: wrap;
        }

        .center { text-align: center; }
        .rank-cell { font-weight: 800; padding-left: 1.5rem; width: 60px; }
        .team-cell { display: flex; align-items: center; gap: 1rem; }
        .small-icon {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: white;
        }
        .team-name { font-weight: 700; font-size: 0.95rem; }
        .team-race { font-size: 0.75rem; color: var(--color-text-muted); }

        .highlight-w { color: #4ade80; font-weight: 600; }
        .highlight-l { color: #f87171; font-weight: 600; }
        .pts-cell { color: var(--color-primary); font-weight: 800; font-size: 1.1rem; }

        .points-info {
          margin-top: 2rem;
          text-align: center;
          padding: 1rem;
          font-size: 0.9rem;
          background-color: rgba(255,255,255,0.02);
        }

        .recruiting-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          gap: 0.5rem;
          background: linear-gradient(to bottom, var(--color-card), transparent);
          border: 1px solid var(--color-border);
          border-radius: 12px;
        }
        .recruiting-placeholder h3 { font-size: 1.5rem; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
      `}} />
        </div>
    );
};

export default LeaderboardView;
