import React, { useState, useMemo } from 'react';
import { Plus, Search, MoreHorizontal, Check, Edit2, Trash2, UserPlus, PlayCircle, CheckCircle, Users } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import ManagementModal from '../components/ManagementModal';
import TeamModal from '../components/TeamModal';
import ShareModal from '../components/ShareModal';
import { getTotalRounds, fallbackRound } from '../utils/bbRules';

const ManagementView = () => {
    const {
        tournaments,
        teams,
        activeTournamentId,
        setActiveTournament,
        addTournament,
        updateTournament,
        deleteTournament,
        addTeam,
        shareTournament,
        generateNextRound,
        matches
    } = useTournament();

    const { currentUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [formatFilter, setFormatFilter] = useState('All Formats');

    // Modal state
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [editingTournament, setEditingTournament] = useState(null);
    const [targetTournamentId, setTargetTournamentId] = useState(null);
    const [sharingTournamentData, setSharingTournamentData] = useState(null);
    const [activeRowMenu, setActiveRowMenu] = useState(null);

    // Filtered data
    const filteredTournaments = useMemo(() => {
        return tournaments.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter;
            const matchesFormat = formatFilter === 'All Formats' || t.format === formatFilter;
            return matchesSearch && matchesStatus && matchesFormat;
        });
    }, [tournaments, searchTerm, statusFilter, formatFilter]);

    // Derived team counts
    const getTeamCountString = (tournament) => {
        return (tournament.teamCount || 0).toString();
    };

    const getRoundInfo = (t) => {
        const tMatches = matches.filter(m => m.tournamentId === t.id);
        const total = t.totalRounds ?? getTotalRounds(t.format, t.teamCount, t.cycles);
        const current = t.currentRound ?? fallbackRound(tMatches);
        return { current, total };
    };

    const handleSaveTournament = (data) => {
        if (editingTournament) {
            updateTournament(data);
        } else {
            addTournament(data);
        }
    };

    const handleAddTeam = (tournamentId, teamData) => {
        addTeam(tournamentId, teamData);
    };

    const handleEdit = (t, e) => {
        e.stopPropagation();
        setEditingTournament(t);
        setIsMgmtModalOpen(true);
        setActiveRowMenu(null);
    };

    const openTeamModal = (tId, e) => {
        e.stopPropagation();
        setTargetTournamentId(tId);
        setIsTeamModalOpen(true);
        setActiveRowMenu(null);
    };

    const handleShare = async (tournamentId, email) => {
        await shareTournament(tournamentId, email);
    };

    const openShareModal = (t, e) => {
        e.stopPropagation();
        setSharingTournamentData(t);
        setIsShareModalOpen(true);
        setActiveRowMenu(null);
    };

    const handleAdvanceStatus = (tournament, e) => {
        e.stopPropagation();
        let nextStatus = '';
        let message = '';

        if (tournament.status === 'Recruiting') {
            nextStatus = 'In Progress';
            message = `Are you ready to start "${tournament.name}"? This will move it to "In Progress".`;
        } else if (tournament.status === 'In Progress') {
            nextStatus = 'Completed';
            message = `Are you sure you want to finalize "${tournament.name}"? This will mark it as "Completed".`;
        }

        if (nextStatus && nextStatus === 'In Progress') {
            const teamCount = parseInt(getTeamCountString(tournament)) || 0;
            const isElimination = ['Single Elimination', 'Double Elimination'].includes(tournament.format);
            const isPowerOfTwo = teamCount > 1 && (teamCount & (teamCount - 1)) === 0;

            if (isElimination && !isPowerOfTwo) {
                alert(`Cannot start ${tournament.format}. Elimination tournaments require a power-of-two number of teams (2, 4, 8, 16, etc.). Current count: ${teamCount}`);
                return;
            }
        }

        if (nextStatus && window.confirm(message)) {
            updateTournament({ ...tournament, status: nextStatus });
        }
        setActiveRowMenu(null);
    };

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this tournament?')) {
            deleteTournament(id);
        }
        setActiveRowMenu(null);
    };

    const handleProceedRound = async (tournamentId, e) => {
        e.stopPropagation();
        await generateNextRound(tournamentId);
        setActiveRowMenu(null);
    };

    const toggleMenu = (id, e) => {
        e.stopPropagation();
        setActiveRowMenu(activeRowMenu === id ? null : id);
    };

    // Click away listener for action menu
    React.useEffect(() => {
        const handleClickAway = () => setActiveRowMenu(null);
        if (activeRowMenu) {
            window.addEventListener('click', handleClickAway);
        }
        return () => window.removeEventListener('click', handleClickAway);
    }, [activeRowMenu]);

    return (
        <div className="view-container">
            <header className="view-header">
                <div className="header-text">
                    <h1>TOURNAMENT MANAGEMENT</h1>
                    <p className="text-muted">Create and manage your Blood Bowl tournaments</p>
                </div>
                <div>
                    <button
                        className="btn-primary"
                        onClick={() => { setEditingTournament(null); setIsMgmtModalOpen(true); }}
                        disabled={!currentUser}
                        title={!currentUser ? "You must be logged in to create a tournament" : ""}
                    >
                        <Plus size={20} /> Create New Tournament
                    </button>
                </div>
            </header>

            <div className="filters-row">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search tournaments..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option>All Status</option>
                    <option>Recruiting</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                </select>
                <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)}>
                    <option>All Formats</option>
                    <option>Round Robin</option>
                    <option>Multi Round Robin</option>
                    <option>Swiss</option>
                    <option>Single Elimination</option>
                    <option>Double Elimination</option>
                </select>
            </div>

            <div className="management-card card">
                <div className="card-header">
                    <h3>MY TOURNAMENTS</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.5rem' }}>
                        Click on a tournament to set it as active across the app.
                    </p>
                </div>
                <div className="table-container animate-in">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Tournament Name</th>
                                <th className="center">Format</th>
                                <th className="center">Status</th>
                                <th className="center"># Teams</th>
                                <th className="center">Round</th>
                                <th className="center">Created</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTournaments.length > 0 ? filteredTournaments.map(t => {
                                const isActive = t.id === activeTournamentId;
                                return (
                                    <tr
                                        key={t.id}
                                        onClick={() => setActiveTournament(t.id)}
                                        className={`navigable-row ${isActive ? 'active-tournament-row' : ''}`}
                                    >
                                        <td className="center">
                                            {isActive && <Check size={16} className="text-primary" />}
                                        </td>
                                        <td style={{ fontWeight: isActive ? '800' : '700', color: isActive ? 'white' : 'inherit' }}>
                                            {t.name}
                                            {isActive && <span className="active-tag">ACTIVE</span>}
                                        </td>
                                        <td className="center text-muted">{t.format}</td>
                                        <td className="center">
                                            <span className={`badge badge-${t.status.toLowerCase().replace(' ', '')}`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="center"><strong>{getTeamCountString(t)}</strong></td>
                                        <td className="center text-muted">
                                            {t.status === 'In Progress'
                                                ? (() => { const { current, total } = getRoundInfo(t); return `${current} / ${total}`; })()
                                                : '-'}
                                        </td>
                                        <td className="center text-muted">{t.created}</td>
                                        <td style={{ textAlign: 'right', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                            <button className="icon-btn" onClick={(e) => toggleMenu(t.id, e)}>
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {activeRowMenu === t.id && (
                                                <div className="action-menu card thematic-menu-shadow">
                                                    {t.status === 'Recruiting' && (
                                                        <button className="status-advance recruiting" onClick={(e) => handleAdvanceStatus(t, e)}>
                                                            <PlayCircle size={14} /> Start Tournament
                                                        </button>
                                                    )}
                                                    {t.status === 'In Progress' && (
                                                        <button className="status-advance inprogress" onClick={(e) => handleAdvanceStatus(t, e)}>
                                                            <CheckCircle size={14} /> Finalize League
                                                        </button>
                                                    )}

                                                    {t.status === 'In Progress' && (
                                                        (() => {
                                                            const { current, total } = getRoundInfo(t);
                                                            if (current >= total) return null;
                                                            return (
                                                                <button className="status-advance recruiting" onClick={(e) => handleProceedRound(t.id, e)}>
                                                                    <PlayCircle size={14} /> Next Round ({current}/{total})
                                                                </button>
                                                            );
                                                        })()
                                                    )}

                                                    {t.status === 'Recruiting' && (
                                                        <button onClick={(e) => openTeamModal(t.id, e)}>
                                                            <UserPlus size={14} /> Add Team
                                                        </button>
                                                    )}

                                                    <button onClick={(e) => openShareModal(t, e)}>
                                                        <Users size={14} /> Share Access
                                                    </button>

                                                    <button onClick={(e) => handleEdit(t, e)}>
                                                        <Edit2 size={14} /> Edit
                                                    </button>
                                                    <button className="delete-action" onClick={(e) => handleDelete(t.id, e)}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                        No tournaments found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ManagementModal
                isOpen={isMgmtModalOpen}
                onClose={() => setIsMgmtModalOpen(false)}
                onSave={handleSaveTournament}
                tournament={editingTournament}
            />

            <TeamModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                onSave={handleAddTeam}
                tournamentId={targetTournamentId}
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                onShare={handleShare}
                tournament={sharingTournamentData}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .view-container { padding: 2rem; }
                .view-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2.5rem;
                }
                .view-header h1 { font-size: 2.2rem; margin-bottom: 0.2rem; }

                .filters-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .search-box {
                    position: relative;
                    flex: 1;
                    max-width: 400px;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                }
                .search-box input {
                    width: 100%;
                    background-color: var(--color-card);
                    border: 1px solid var(--color-border);
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border-radius: 8px;
                    color: white;
                    font-family: inherit;
                }
                select {
                    background-color: var(--color-card);
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0 1rem;
                    border-radius: 8px;
                    font-family: inherit;
                    min-width: 150px;
                }

                .management-card { padding: 0; overflow: visible; }
                .card-header { padding: 1.5rem; border-bottom: 1px solid var(--color-border); }
                .card-header h3 { font-size: 1rem; color: var(--color-text-muted); }

                .table-container { overflow: visible; }

                .navigable-row { cursor: pointer; transition: var(--transition); }
                .navigable-row:hover { background-color: rgba(255,255,255,0.03); }
                .active-tournament-row { background-color: rgba(211, 16, 39, 0.05); }
                .active-tournament-row td { border-bottom-color: var(--color-primary) !important; }
                
                .active-tag {
                    font-size: 0.65rem;
                    background-color: var(--color-primary);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 10px;
                    vertical-align: middle;
                    font-weight: 900;
                }

                .text-primary { color: var(--color-primary); }
                .center { text-align: center; }
                .icon-btn {
                    background: none;
                    color: var(--color-text-muted);
                    width: 36px;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .icon-btn:hover { color: white; }

                .action-menu {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    padding: 0.5rem;
                    min-width: 170px;
                    background: #0f0f0f;
                    border: 1px solid var(--color-border);
                }
                .thematic-menu-shadow {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 15px rgba(211, 16, 39, 0.1);
                }
                .action-menu button {
                    background: none;
                    color: var(--color-text-muted);
                    padding: 0.6rem 0.8rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    text-align: left;
                    border-radius: 6px;
                    width: 100%;
                }
                .action-menu button:hover {
                    background-color: rgba(255,255,255,0.08);
                    color: white;
                }
                
                .status-advance.recruiting:hover { color: #4ade80; }
                .status-advance.inprogress:hover { color: #facc15; }
                .delete-action:hover { color: #f87171 !important; }
            `}} />
        </div>
    );
};

export default ManagementView;
