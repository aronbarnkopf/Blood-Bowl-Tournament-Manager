import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Edit2, TrendingUp, DollarSign } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import MatchResultModal from '../components/MatchResultModal';
import { calculatePettyCash, parseCurrency } from '../utils/bbRules';

const HomeView = () => {
  const { activeTournamentId, activeTournament, matches, teams, resolveMatch, getTeamValue, getCurrentTeamValue, generateNextRound } = useTournament();
  const [currentViewRound, setCurrentViewRound] = useState(1);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Drag to scroll state
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const handleProceedRound = async (tournamentId, e) => {
        e.stopPropagation();
        await generateNextRound(tournamentId);
    };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    if (Math.abs(x - startX) > 5) {
      setHasMoved(true);
    }
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const getTeam = (id) => teams.find(t => t.id === id);

  // Filter matches by current tournament
  const allTournamentMatches = matches.filter(m => m.tournamentId === activeTournamentId);

  const isRoundRobin = ['Round Robin', 'Multi Round Robin'].includes(activeTournament?.format);

  let rounds = Array.from(new Set(allTournamentMatches.map(m => m.round))).sort((a, b) => a - b);

  if (isRoundRobin && activeTournament?.currentRound) {
    // Round Robin matches are all pre-generated, so cap by the tracked round
    rounds = rounds.filter(r => r <= activeTournament.currentRound);
  } else if (activeTournament?.hideFutureRounds) {
    const upcomingMatches = allTournamentMatches.filter(m => m.status === 'upcoming');
    const currentActiveRound = upcomingMatches.length > 0
      ? Math.min(...upcomingMatches.map(m => m.round))
      : Math.max(...rounds, 1);
    rounds = rounds.filter(r => r <= currentActiveRound);
  }

  // Automatically select the active or most relevant round on load/change
  useEffect(() => {
    if (rounds.length > 0) {
      const upcomingMatches = allTournamentMatches.filter(m => m.status === 'upcoming' && rounds.includes(m.round));
      if (upcomingMatches.length > 0) {
        const nextRound = Math.min(...upcomingMatches.map(m => m.round));
        setCurrentViewRound(nextRound);
        setActiveTab('upcoming');
        return;

      }
      // If all matches played, open the latest round on 'played' tab
      const lastRound = rounds[rounds.length - 1];
      setCurrentViewRound(lastRound);
      const playedMatchesInLast = allTournamentMatches.filter(m => m.round === lastRound && m.status === 'played');
      if (playedMatchesInLast.length > 0) {
        setActiveTab('played');
      }
    }
  }, [activeTournamentId, matches.length, activeTournament?.currentRound]);

  const currentRoundMatches = allTournamentMatches.filter(m => m.round === currentViewRound);

  const filteredMatches = currentRoundMatches.filter(m =>
    (activeTab === 'upcoming' ? m.status === 'upcoming' : m.status !== 'upcoming')
  );

  const isRecruiting = activeTournament?.status === 'Recruiting';

  const handleResolve = (match) => {
    setSelectedMatch(match);
    setIsResultModalOpen(true);
  };

  const handleSaveResult = (matchId, result) => {
    resolveMatch(matchId, result);
  };

  return (
    <div className="view-container">
      <header className="home-header">
        <div className="skull-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M12,2A9,9 0 0,0 3,11C3,14.03 4.53,16.82 7,18.47V22H9V19H11V22H13V19H15V22H17V18.46C19.47,16.81 21,14.03 21,11A9,9 0 0,0 12,2M8,11A2,2 0 0,1 10,9A2,2 0 0,1 12,11A2,2 0 0,1 10,13A2,2 0 0,1 8,11M14,11A2,2 0 0,1 16,9A2,2 0 0,1 18,11A2,2 0 0,1 16,13A2,2 0 0,1 14,11Z" />
          </svg>
        </div>
        <h1>{activeTournament?.name || 'BLOOD BOWL TOURNAMENT'}</h1>
        <p className="text-muted">Welcome to the arena! Track matches, manage teams, and follow the carnage as the greatest teams in the Old World battle for glory.</p>
      </header>

      {!isRecruiting ? (
        <section className="matches-section">
          <div className="section-divider">
            <span>TOURNAMENT MATCHES</span>
          </div>

          <div
            className={`round-navigator ${isDragging ? 'dragging' : ''}`}
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {rounds.map(r => (
              <button
                key={r}
                className={`round-btn ${currentViewRound === r ? 'active' : ''}`}
                onClick={(e) => {
                  if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  setCurrentViewRound(r);
                }}
              >
                ROUND {r}
              </button>
            ))}
            {activeTournament?.currentRound !== undefined && activeTournament?.currentRound < activeTournament?.totalRounds && (
              <button
                className="round-btn"
                onClick={(e) => handleProceedRound(activeTournamentId, e)}
                //disabeled when there is still upcoming matches in the current round
                disabled={allTournamentMatches.filter(m => m.round === currentViewRound && m.status === 'upcoming').length > 0}
                
              >
                NEXT ROUND
              </button>
            )}
          </div>

          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming <span className="tab-count">{allTournamentMatches.filter(m => m.round === currentViewRound && m.status === 'upcoming').length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'played' ? 'active' : ''}`}
              onClick={() => setActiveTab('played')}
            >
              Played <span className="tab-count">{allTournamentMatches.filter(m => m.round === currentViewRound && m.status !== 'upcoming').length}</span>
            </button>
          </div>

          <div className="matches-list animate-in">
            {filteredMatches.length > 0 ? filteredMatches.map(match => {
              const teamA = getTeam(match.teamA);
              const teamB = getTeam(match.teamB);
              const tvAStr = teamA ? getCurrentTeamValue(teamA.id) : '0 gold';
              const tvBStr = teamB ? getCurrentTeamValue(teamB.id) : '0 gold';
              const tvANum = parseCurrency(tvAStr);
              const tvBNum = parseCurrency(tvBStr);
              const { pettyCashA, pettyCashB } = calculatePettyCash(tvANum, tvBNum);

              return (
                <div key={match.id} className="match-card">
                  <div className="match-teams">
                    <div className="team-entry left">
                      <div className="small-icon" style={{ backgroundColor: teamA?.color }}>{teamA?.icon?.substring(0, 2)}</div>
                      <div className="team-details">
                        <div className="team-name">{teamA?.name}</div>
                        <div className="team-race">{teamA?.race}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.75rem' }}>
                          <span className="text-muted"><TrendingUp size={11} style={{ display: 'inline', marginRight: '2px' }} />TV: <strong>{tvAStr.replace(' gold', '')}</strong></span>
                          {pettyCashA > 0 && (
                            <span style={{ color: '#f59e0b', fontWeight: 800 }}>+{pettyCashA.toLocaleString()} Petty Cash</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="vs-badge">
                      {match.status === 'played' ? (
                        <div className="match-score">
                          <span>{match.scoreA}</span>
                          <span className="score-divider">-</span>
                          <span>{match.scoreB}</span>
                        </div>
                      ) : 'VS'}
                    </div>

                    <div className="team-entry right">
                      <div className="team-details">
                        <div className="team-name">{teamB?.name}</div>
                        <div className="team-race">{teamB?.race}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px', fontSize: '0.75rem' }}>
                          {pettyCashB > 0 && (
                            <span style={{ color: '#f59e0b', fontWeight: 800 }}>+{pettyCashB.toLocaleString()} Petty Cash</span>
                          )}
                          <span className="text-muted"><TrendingUp size={11} style={{ display: 'inline', marginRight: '2px' }} />TV: <strong>{tvBStr.replace(' gold', '')}</strong></span>
                        </div>
                      </div>
                      <div className="small-icon" style={{ backgroundColor: teamB?.color }}>{teamB?.icon?.substring(0, 2)}</div>
                    </div>
                  </div>

                  <div className="match-footer">
                    <div className="match-time">
                      <Calendar size={14} /> {match.status === 'played' ? (match.playedDate || match.date) : match.date}
                      {match.status !== 'played' && (
                        <><Clock size={14} style={{ marginLeft: '1rem' }} /> {match.time}</>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {match.status === 'upcoming' && activeTournament?.status === 'In Progress' && (
                        <button className="btn-primary" onClick={() => handleResolve(match)}>Resolve Match</button>
                      )}
                      {match.status === 'played' && (
                        <button
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleResolve(match)}
                        >
                          <Edit2 size={13} /> Edit Result
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                No {activeTab} matches in this round.
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="recruiting-placeholder card">
          <Calendar size={48} className="text-muted" />
          <h3>TOURNAMENT RECRUITING</h3>
          <p className="text-muted">Matches will be scheduled once the tournament starts with {activeTournament?.teams} teams.</p>
        </div>
      )}

      <MatchResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        onSave={handleSaveResult}
        match={selectedMatch}
        teamA={getTeam(selectedMatch?.teamA)}
        teamB={getTeam(selectedMatch?.teamB)}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .view-container { padding: 2rem; max-width: 1000px; margin: 0 auto; }
        .home-header { text-align: center; margin-bottom: 4rem; }
        .skull-icon {
          display: inline-flex;
          padding: 1.25rem;
          background-color: var(--color-card);
          border-radius: 50%;
          color: var(--color-primary);
          margin-bottom: 1.5rem;
          box-shadow: 0 0 20px rgba(211, 16, 39, 0.15);
        }
        .home-header h1 { font-size: 3.2rem; margin-bottom: 1rem; text-transform: uppercase; }
        .home-header p { max-width: 650px; margin: 0 auto; line-height: 1.6; font-size: 1.1rem; }

        .section-divider {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .section-divider::before, .section-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--color-border), transparent);
        }
        .section-divider span {
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 0.1em;
          color: var(--color-text-muted);
        }

        .tab-switcher {
          display: flex;
          background-color: var(--color-card);
          padding: 0.4rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          border: 1px solid var(--color-border);
        }
        .tab-btn {
          flex: 1;
          padding: 0.8rem;
          border-radius: 6px;
          background: none;
          color: var(--color-text-muted);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }
        .tab-btn.active {
          background-color: var(--color-primary);
          color: white;
        }
        .tab-count {
          background-color: rgba(0,0,0,0.2);
          padding: 0.1rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        .match-card {
          background-color: var(--color-card);
          border-radius: 12px;
          border: 1px solid var(--color-border);
          margin-bottom: 1.5rem;
          overflow: hidden;
        }
        .match-teams {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.02));
        }
        .team-entry { display: flex; align-items: center; gap: 1.5rem; flex: 1; }
        .team-entry.right { justify-content: flex-end; text-align: right; }
        
        .small-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: white;
        }
        .team-name { font-weight: 800; font-size: 1.1rem; }
        .team-race { font-size: 0.8rem; color: var(--color-text-muted); }

        .vs-badge {
          background-color: #1a1a1a;
          border: 1px solid var(--color-border);
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          font-weight: 900;
          color: var(--color-text-muted);
          margin: 0 2rem;
          min-width: 80px;
          display: flex;
          justify-content: center;
        }
        .match-score {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.4rem;
            color: white;
            font-weight: 900;
        }
        .score-divider {
            color: var(--color-primary);
            font-size: 1rem;
            opacity: 0.5;
        }

        .match-footer {
          padding: 1rem 2rem;
          background-color: rgba(0,0,0,0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--color-border);
        }
        .match-time {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .round-navigator {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          cursor: grab;
        }
        .round-navigator::-webkit-scrollbar {
          display: none;
        }
        .round-navigator.dragging {
          cursor: grabbing;
        }
        .round-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          font-weight: 700;
          font-size: 0.8rem;
          white-space: nowrap;
          transition: var(--transition);
        }
        .round-btn:not(:disabled):hover { border-color: var(--color-primary); color: white; }
        .round-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }

        .recruiting-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          gap: 1.5rem;
          background: linear-gradient(to bottom, var(--color-card), transparent);
        }
        .recruiting-placeholder h3 { font-size: 1.5rem; letter-spacing: 0.1em; }
      `}} />
    </div>
  );
};

export default HomeView;
