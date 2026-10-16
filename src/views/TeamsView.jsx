import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Wallet, TrendingUp, ChevronRight, Trash2 } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import TeamModal from '../components/TeamModal';

const TeamsView = () => {
  const navigate = useNavigate();
  const { activeTournamentId, addTeam, teams, deleteTeam, getTeamValue, activeTournament } = useTournament();

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const filteredTeams = teams.filter(t => t.tournamentId === activeTournamentId).sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = (teamId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this team from the tournament?')) {
      deleteTeam(teamId, activeTournamentId);
    }
  };

  const openTeamModal = (e) => {
    e.stopPropagation();
    setIsTeamModalOpen(true);
  };

  const handleAddTeam = (tournamentId, teamData) => {
    addTeam(tournamentId, teamData);
  };

  return (
    <div className="view-container">
      <header className="view-header">
        <div className="header-text">
          <h1>TOURNAMENT TEAMS</h1>
          <p className="text-muted">Browse all teams participating in the tournament</p>
        </div>
        {activeTournament?.status === 'Recruiting' && (
          <div>
            <button
              className="btn btn-primary"
              onClick={(e) => openTeamModal(e)}
              disabled={!activeTournamentId}
              title={!activeTournamentId ? "You must select a tournament to add a team" : ""}
          >
            <Plus size={16} />
            Add New Team
          </button>
        </div>)}
      </header>

      <div className="teams-grid">
        {filteredTeams.length > 0 ? filteredTeams.map((team) => (
          <div
            key={team.id}
            className="team-card animate-in"
            onClick={() => navigate(`/teams/${team.id}`)}
          >
            <button
              className="delete-team-btn"
              onClick={(e) => handleDelete(team.id, e)}
              title="Delete Team"
            >
              <Trash2 size={16} />
            </button>

            <div className="team-card-header">
              <div className="team-icon" style={{ backgroundColor: team.color }}>
                {team.icon}
              </div>
              <div className="team-info">
                <h3>{team.name}</h3>
                <span className="text-muted">{team.race}</span>
              </div>
              <ChevronRight className="chevron" size={20} />
            </div>

            <div className="team-stats">
              <div className="stat-row">
                <span className="stat-label"><User size={14} /> Coach</span>
                <span className="stat-value">{team.coach}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label"><Wallet size={14} /> Treasury</span>
                <span className="stat-value text-gold">{team.treasury}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label"><TrendingUp size={14} /> Team Value</span>
                <span className="stat-value">{getTeamValue(team.id)}</span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>
            No teams registered for this tournament yet.
          </div>
        )}
      </div>

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSave={handleAddTeam}
        tournamentId={activeTournamentId}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .view-container {
          padding: 2rem;
        }
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
        }
        .view-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .teams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        .team-card {
          background-color: var(--color-card);
          border-radius: var(--radius);
          padding: 1.5rem;
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }
        .team-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-4px);
          box-shadow: 0 10px 30px -10px rgba(211, 16, 39, 0.2);
        }
        .delete-team-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(0,0,0,0.3);
          color: var(--color-text-muted);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          opacity: 0;
          transition: var(--transition);
          z-index: 2;
        }
        .team-card:hover .delete-team-btn {
          opacity: 1;
        }
        .delete-team-btn:hover {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .team-card-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
          position: relative;
        }
        .team-icon {
          width: 50px;
          height: 50px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.2rem;
          color: white;
        }
        .team-info h3 {
          font-size: 1.25rem;
          margin-bottom: 0.1rem;
        }
        .chevron {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          transition: var(--transition);
        }
        .team-card:hover .chevron {
          color: var(--color-primary);
          transform: translateY(-50%) translateX(4px);
          opacity: 0;
        }
        .team-card:hover .delete-team-btn ~ .team-card-header .chevron {
            opacity: 0; /* Hide chevron when delete is visible if thematically better, or just leave both */
        }

        .team-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
        }
        .stat-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font-size: 0.85rem;
          font-weight: 500;
        }
        .stat-value {
          font-weight: 700;
          font-size: 0.9rem;
        }
        
        .animate-in {
          animation: slideUp 0.4s ease-out forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .teams-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </div>
  );
};

export default TeamsView;
