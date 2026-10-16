import React, { useState, useMemo } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Trophy, Target, Shield, Zap, ArrowUpRight, ArrowDown, Star, BarChart2 } from 'lucide-react';

const StatisticsView = () => {
    const { teams, activeTournamentId } = useTournament();
    const [sortConfig, setSortConfig] = useState({ key: 'spp', direction: 'descending' });

    // Filter teams for active tournament
    const tournamentTeams = useMemo(() => {
        return teams.filter(t => t.tournamentId === activeTournamentId);
    }, [teams, activeTournamentId]);

    // Calculate stats for table
    const teamStats = useMemo(() => {
        return tournamentTeams.map(team => {
            const stats = team.stats || {};
            // Calculate total SPP events for a fun aggregate metric if needed, 
            // but for now we just map the raw properties
            return {
                id: team.id,
                name: team.name,
                race: team.race,
                coach: team.coach,
                icon: team.icon,
                color: team.color,

                // Stats
                td: stats.td || 0,
                cas: stats.cas || 0,
                int: stats.int || 0,
                pass: stats.pass || 0,
                ttm: stats.ttm || 0,
                safe: stats.safe || 0,
                mvp: stats.mvp || 0,
                spp: stats.spp || 0
            };
        });
    }, [tournamentTeams]);

    // Sorting Logic
    const sortedTeams = useMemo(() => {
        let sortableTeams = [...teamStats];
        if (sortConfig.key) {
            sortableTeams.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableTeams;
    }, [teamStats, sortConfig]);

    const requestSort = (key) => {
        let direction = 'descending'; // Default to descending for stats
        if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span className="sort-icon-placeholder"></span>;
        return <span className="sort-icon">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="view-container">
            <div className="section-header">
                <div className="section-title">
                    <h2><BarChart2 size={24} style={{ marginRight: '0.75rem', color: 'var(--color-primary)' }} />TEAM STATISTICS</h2>
                    <p className="text-muted">Performance metrics for the current tournament</p>
                </div>
            </div>

            <div className="table-container card animate-in" style={{ padding: 0 }}>
                <table>
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')} className="sortable-th">Team <SortIcon column="name" /></th>
                            <th onClick={() => requestSort('race')} className="sortable-th">Race <SortIcon column="race" /></th>
                            <th onClick={() => requestSort('coach')} className="sortable-th">Coach <SortIcon column="coach" /></th>

                            <th onClick={() => requestSort('td')} className="center sortable-th" title="Touchdowns">
                                <div className="th-icon"><Trophy size={16} /> TD <SortIcon column="td" /></div>
                            </th>
                            <th onClick={() => requestSort('cas')} className="center sortable-th" title="Casualties">
                                <div className="th-icon"><Target size={16} /> CAS <SortIcon column="cas" /></div>
                            </th>
                            <th onClick={() => requestSort('int')} className="center sortable-th" title="Interceptions">
                                <div className="th-icon"><Shield size={16} /> INT <SortIcon column="int" /></div>
                            </th>
                            <th onClick={() => requestSort('pass')} className="center sortable-th" title="Passes (Completions)">
                                <div className="th-icon"><Zap size={16} /> PASS <SortIcon column="pass" /></div>
                            </th>
                            <th onClick={() => requestSort('ttm')} className="center sortable-th" title="Throw Team Mate">
                                <div className="th-icon"><ArrowUpRight size={16} /> TTM <SortIcon column="ttm" /></div>
                            </th>
                            <th onClick={() => requestSort('safe')} className="center sortable-th" title="Safe Landing">
                                <div className="th-icon"><ArrowDown size={16} /> SAFE <SortIcon column="safe" /></div>
                            </th>
                            <th onClick={() => requestSort('mvp')} className="center sortable-th" title="MVPs">
                                <div className="th-icon"><Star size={16} /> MVP <SortIcon column="mvp" /></div>
                            </th>
                            <th onClick={() => requestSort('spp')} className="center sortable-th" title="Total SPP">
                                <div className="th-icon"><Zap size={16} className="text-highlight" /> SPP <SortIcon column="spp" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeams.length > 0 ? sortedTeams.map((team, index) => (
                            <tr key={team.id}>
                                <td>
                                    <div className="team-cell">
                                        <div className="team-icon-mini" style={{ backgroundColor: team.color }}>{team.icon}</div>
                                        <span className="team-name">{team.name}</span>
                                    </div>
                                </td>
                                <td className="text-muted">{team.race}</td>
                                <td className="text-muted">{team.coach}</td>

                                <td className="center stat-cell">{team.td > 0 ? <strong className="text-highlight">{team.td}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.cas > 0 ? <strong className="text-highlight">{team.cas}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.int > 0 ? <strong className="text-highlight">{team.int}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.pass > 0 ? <strong className="text-highlight">{team.pass}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.ttm > 0 ? <strong className="text-highlight">{team.ttm}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.safe > 0 ? <strong className="text-highlight">{team.safe}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell">{team.mvp > 0 ? <strong className="text-highlight">{team.mvp}</strong> : <span className="text-dim">0</span>}</td>
                                <td className="center stat-cell" style={{ fontSize: '1.1rem' }}>{team.spp > 0 ? <strong className="text-highlight">{team.spp}</strong> : <span className="text-dim">0</span>}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="11" className="center text-muted" style={{ padding: '3rem' }}>
                                    No teams found in this tournament.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .section-title h2 {
          display: flex;
          align-items: center;
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }

        .sortable-th {
          cursor: pointer;
          user-select: none;
          transition: color 0.2s;
        }
        .sortable-th:hover {
          color: white;
        }
        
        .th-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .sort-icon {
          display: inline-block;
          font-size: 0.7rem;
          margin-left: 0.3rem;
          opacity: 0.7;
        }
        .sort-icon-placeholder {
            display: inline-block;
            width: 0.7rem;
            margin-left: 0.3rem;
        }

        .team-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .team-icon-mini {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: white;
          font-weight: 700;
        }
        .team-name {
          font-weight: 700;
          color: white;
        }

        .stat-cell {
          font-family: 'Outfit', sans-serif;
          font-variant-numeric: tabular-nums;
        }
        .text-highlight {
          color: #fbbf24;
        }
        .text-dim {
          color: rgba(255, 255, 255, 0.1);
        }
      `}} />
        </div>
    );
};

export default StatisticsView;
