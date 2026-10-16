import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Edit2, Trash2, Wallet, TrendingUp, User, Users, DollarSign, MoreHorizontal, Zap, X, Check, Activity, AlertTriangle, RotateCcw, Award, GripVertical, ArrowLeftRight } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import PlayerModal from '../components/PlayerModal';
import PlayerAdvanceModal from '../components/PlayerAdvanceModal';
import PlayerSppModal from '../components/PlayerSppModal';
import PlayerInjuryModal from '../components/PlayerInjuryModal';
import SidelineManager from '../components/SidelineManager';
import { Star } from 'lucide-react';
import { isTeamFinalized } from '../utils/bbRules';

const TeamDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournaments, matches, teams, players, addPlayer, updatePlayer, deletePlayer, reassignPlayerSlot, getTeamValue, getCurrentTeamValue, advancePlayer, awardSpp, undoRecentEvent, updateTeam, updateSideline } = useTournament();

  const team = teams.find(t => t.id === id);
  const tournament = tournaments.find(t => t.id === team?.tournamentId);
  const teamPlayers = players[id] || [];

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  // editingPlayer: an existing player object with a Firestore id (for Edit flow)
  const [editingPlayer, setEditingPlayer] = useState(null);
  // draftSlot: the slot number pre-assigned when opening the modal for a NEW player
  const [draftSlot, setDraftSlot] = useState(1);
  const [activePlayerMenu, setActivePlayerMenu] = useState(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advancingPlayer, setAdvancingPlayer] = useState(null);
  const [isSppModalOpen, setIsSppModalOpen] = useState(false);
  const [awardingPlayer, setAwardingPlayer] = useState(null);
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [injuredPlayer, setInjuredPlayer] = useState(null);

  // Drag-and-drop state
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  // Move-to-slot modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(null);

  // Treasury Editing State
  const [isEditingTreasury, setIsEditingTreasury] = useState(false);
  const [treasuryInput, setTreasuryInput] = useState('');
  const [isHoveringTreasury, setIsHoveringTreasury] = useState(false);

  // Dedicated Fans Editing State
  const [isEditingFans, setIsEditingFans] = useState(false);
  const [fansInput, setFansInput] = useState(1);
  const [isHoveringFans, setIsHoveringFans] = useState(false);

  // Active non-dead players
  const activePlayers = React.useMemo(() => {
    return teamPlayers.filter(p => p.status !== 'dead');
  }, [teamPlayers]);

  const deadPlayers = React.useMemo(() => {
    return teamPlayers.filter(p => p.status === 'dead');
  }, [teamPlayers]);

  // Fixed 16-slot representation
  const rosterSlots = React.useMemo(() => {
    const slots = [];
    const assignedPlayers = [...activePlayers];

    for (let slotNum = 1; slotNum <= 16; slotNum++) {
      // Find player with this jersey number
      const playerIndex = assignedPlayers.findIndex(p => (parseInt(p.number) || 0) === slotNum);
      if (playerIndex !== -1) {
        slots.push({ slot: slotNum, player: assignedPlayers[playerIndex] });
        assignedPlayers.splice(playerIndex, 1);
      } else {
        slots.push({ slot: slotNum, player: null });
      }
    }

    // Place any remaining unassigned players (e.g. invalid jersey # or duplicate) into remaining empty slots
    assignedPlayers.forEach(p => {
      const firstEmpty = slots.find(s => s.player === null);
      if (firstEmpty) {
        firstEmpty.player = p;
      } else {
        slots.push({ slot: slots.length + 1, player: p });
      }
    });

    return slots;
  }, [activePlayers]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Click away listener for action menu
  React.useEffect(() => {
    const handleClickAway = () => setActivePlayerMenu(null);
    if (activePlayerMenu) {
      window.addEventListener('click', handleClickAway);
    }
    return () => window.removeEventListener('click', handleClickAway);
  }, [activePlayerMenu]);

  if (!team) return <div className="view-container"><h1>Team not found</h1></div>;

  const handleSavePlayer = (playerData) => {
    if (editingPlayer && editingPlayer.id) {
      // Real edit: update the existing Firestore document
      updatePlayer(id, { ...playerData, id: editingPlayer.id });
    } else {
      // New draft: draftSlot is the pre-chosen jersey number
      addPlayer(id, { ...playerData, number: parseInt(playerData.number) || draftSlot });
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setDraftSlot(player.number || 1);
    setIsPlayerModalOpen(true);
  };

  const handleDeletePlayer = (playerId) => {
    const playerToFire = teamPlayers.find(p => p.id === playerId);
    const finalized = isTeamFinalized(team, tournament, matches);
    const message = finalized
      ? `Are you sure you want to fire ${playerToFire?.name || 'this player'}? Under Blood Bowl league rules, dismissed players provide NO treasury refund during active season play.`
      : `Are you sure you want to fire ${playerToFire?.name || 'this player'}? The drafting cost (${playerToFire?.cost || '0'}) will be returned to your Treasury.`;

    if (window.confirm(message)) {
      deletePlayer(id, playerId);
    }
  };

  /** Find the lowest empty slot (1-16) among active players */
  const getNextEmptySlot = () => {
    const usedSlots = new Set(
      activePlayers.map(p => parseInt(p.number)).filter(n => n >= 1 && n <= 16)
    );
    for (let slot = 1; slot <= 16; slot++) {
      if (!usedSlots.has(slot)) return slot;
    }
    return null; // roster full
  };

  const handleAddPlayer = () => {
    const nextSlot = getNextEmptySlot();
    if (nextSlot === null) {
      alert('The roster is full! You cannot have more than 16 players.');
      return;
    }
    setEditingPlayer(null);
    setDraftSlot(nextSlot);
    setIsPlayerModalOpen(true);
  };

  // --- Drag-and-drop handlers ---
  const handleDragStart = (e, playerId) => {
    setDraggedPlayerId(playerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDragOverSlot(null);
  };

  const handleDragOver = (e, slot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot(slot);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e, targetSlot) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!draggedPlayerId) return;
    const sourcePlayer = activePlayers.find(p => p.id === draggedPlayerId);
    if (!sourcePlayer || parseInt(sourcePlayer.number) === parseInt(targetSlot)) {
      setDraggedPlayerId(null);
      return;
    }
    await reassignPlayerSlot(id, draggedPlayerId, targetSlot);
    setDraggedPlayerId(null);
  };

  // --- Move-to-slot modal handlers ---
  const handleOpenMoveSlot = (player, e) => {
    e.stopPropagation();
    setMovingPlayer(player);
    setIsMoveModalOpen(true);
    setActivePlayerMenu(null);
  };

  const handleMoveToSlot = async (targetSlot) => {
    if (!movingPlayer) return;
    await reassignPlayerSlot(id, movingPlayer.id, targetSlot);
    setIsMoveModalOpen(false);
    setMovingPlayer(null);
  };

  const togglePlayerMenu = (playerId, e) => {
    e.stopPropagation();
    setActivePlayerMenu(activePlayerMenu === playerId ? null : playerId);
  };

  const handleOpenAdvance = (player, e) => {
    e.stopPropagation();
    setAdvancingPlayer(player);
    setIsAdvanceModalOpen(true);
    setActivePlayerMenu(null);
  };

  const handleSaveAdvance = (playerId, skill, valueIncrease, sppCost) => {
    advancePlayer(id, playerId, skill, valueIncrease, sppCost);
  };

  const handleEditPlayerAction = (player, e) => {
    e.stopPropagation();
    handleEditPlayer(player);
    setActivePlayerMenu(null);
  };

  const handleDeletePlayerAction = (playerId, e) => {
    e.stopPropagation();
    handleDeletePlayer(playerId);
    setActivePlayerMenu(null);
  };

  const handleOpenSpp = (player, e) => {
    e.stopPropagation();
    setAwardingPlayer(player);
    setIsSppModalOpen(true);
    setActivePlayerMenu(null);
  };

  const handleSaveSpp = (playerId, amount, reason) => {
    awardSpp(id, playerId, amount, reason);
  };

  const handleUndoEvent = async () => {
    if (window.confirm("Undo the most recent event on this team?")) {
      const res = await undoRecentEvent(id);
      if (res && res.message) {
        alert(res.message);
      }
    }
  };

  // Injury Handlers
  const handleOpenInjury = (player, e) => {
    e.stopPropagation();
    setInjuredPlayer(player);
    setIsInjuryModalOpen(true);
    setActivePlayerMenu(null);
  };

  const handleRecoverPlayer = (player, e) => {
    e.stopPropagation();
    const updatedPlayer = { ...player, status: 'active' };
    updatePlayer(id, updatedPlayer);
    setActivePlayerMenu(null);
  };

  const handleSaveInjury = (injuryData) => {
    if (!injuredPlayer) return;

    let updatedPlayer = {
      ...injuredPlayer,
      status: 'injured'
    };

    const { injuryType, statToDecrease } = injuryData;

    if (injuryType === 'dead') {
      updatedPlayer.status = 'dead';
    } else if (injuryType === 'bad') {
      updatedPlayer.status = 'recovering';
    } else if (injuryType === 'niggling') {
      const skills = updatedPlayer.skills || [];
      const nigglingIndex = skills.findIndex(s => s.startsWith('Niggling Injury'));

      if (nigglingIndex !== -1) {
        // Already has Niggling Injury, increment it
        const currentSkill = skills[nigglingIndex];
        const match = currentSkill.match(/\(\+(\d+)\)/);
        const currentCount = match ? parseInt(match[1]) : 1;

        const newSkills = [...skills];
        newSkills[nigglingIndex] = `Niggling Injury (+${currentCount + 1})`;
        updatedPlayer.skills = newSkills;
      } else {
        // First Niggling Injury
        updatedPlayer.skills = [...skills, 'Niggling Injury (+1)'];
      }
    } else if (injuryType === 'stat' && statToDecrease) {
      // Handle Stat Decrease logic
      if (statToDecrease === 'ma' || statToDecrease === 'st') {
        // These are numbers, simply decrease
        updatedPlayer[statToDecrease] = Math.max(1, (updatedPlayer[statToDecrease] || 0) - 1);
      } else if (statToDecrease === 'ag' || statToDecrease === 'pa') {
        // These are 'X+', increase target (worse)
        const currentVal = parseInt(updatedPlayer[statToDecrease]) || 0;
        updatedPlayer[statToDecrease] = `${Math.min(currentVal + 1, 6)}+`;
      } else if (statToDecrease === 'av') {
        // AV is 'X+', decrease target (worse armor?) 
        // NOTE: In BB2020, AV 10+ -> 9+ is effectively -1 to the stat. 
        // But mechanically you roll to break. So 9+ is easier to break than 10+.
        const currentVal = parseInt(updatedPlayer[statToDecrease]) || 0;
        updatedPlayer[statToDecrease] = `${Math.max(2, currentVal - 1)}+`;
      }
    }

    updatePlayer(id, updatedPlayer);
  };

  const handleEditTreasury = () => {
    const currentAmount = parseInt(team.treasury?.replace(/\D/g, '') || '0');
    setTreasuryInput(currentAmount);
    setIsEditingTreasury(true);
  };

  const handleSaveTreasury = () => {
    const newAmount = parseInt(treasuryInput) || 0;
    updateTeam(id, { treasury: newAmount.toLocaleString() + ' gold' });
    setIsEditingTreasury(false);
    setIsHoveringTreasury(false);
  };

  const handleEditFans = () => {
    setFansInput(team.dedicatedFans || 1);
    setIsEditingFans(true);
  };

  const handleSaveFans = () => {
    updateTeam(id, { dedicatedFans: parseInt(fansInput) || 1 });
    setIsEditingFans(false);
    setIsHoveringFans(false);
  };

  return (
    <div className="view-container">
      <button className="back-btn" onClick={() => navigate('/teams')}>
        <ArrowLeft size={16} /> Back to Teams
      </button>

      <header className="team-banner card">
        <div className="banner-content">
          <div className="team-icon-large" style={{ backgroundColor: team.color }}>
            {team.icon}
          </div>
          <div className="team-info-large">
            <h1>{team.name}</h1>
            <p className="text-muted">{team.race} Team</p>
          </div>
        </div>

        <div className="banner-stats">
          <div className="stat-pill">
            <User size={14} className="text-muted" />
            <span className="text-muted">Coach:</span>
            <strong>{team.coach}</strong>
          </div>
          <div
            className="stat-pill"
            onMouseEnter={() => setIsHoveringTreasury(true)}
            onMouseLeave={() => setIsHoveringTreasury(false)}
            style={{ position: 'relative', minWidth: '200px' }}
          >
            <Wallet size={14} className="text-muted" />
            <span className="text-muted">Treasury:</span>

            {isEditingTreasury ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 10 }}>
                <input
                  type="number"
                  step={5000}
                  min={0}
                  value={treasuryInput}
                  onChange={(e) => setTreasuryInput(e.target.value)}
                  autoFocus
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid var(--color-primary)',
                    color: 'white',
                    width: '100px',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '700'
                  }}
                />
                <button
                  onClick={handleSaveTreasury}
                  className="btn-icon-action save"
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingTreasury(false);
                    setIsHoveringTreasury(false);
                  }}
                  className="btn-icon-action cancel"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <strong className="text-gold">{team.treasury}</strong>
                {(isHoveringTreasury || window.innerWidth < 768) && (
                  <button
                    onClick={handleEditTreasury}
                    className="edit-treasury-btn"
                    title="Edit Treasury"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
          <div
            className="stat-pill"
            onMouseEnter={() => setIsHoveringFans(true)}
            onMouseLeave={() => setIsHoveringFans(false)}
            style={{ position: 'relative', minWidth: '160px' }}
          >
            <Users size={14} className="text-muted" />
            <span className="text-muted">Fans:</span>

            {isEditingFans ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', zIndex: 10 }}>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={fansInput}
                  onChange={(e) => setFansInput(e.target.value)}
                  autoFocus
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid var(--color-primary)',
                    color: 'white',
                    width: '60px',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '700'
                  }}
                />
                <button
                  onClick={handleSaveFans}
                  className="btn-icon-action save"
                  title="Save"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setIsEditingFans(false);
                    setIsHoveringFans(false);
                  }}
                  className="btn-icon-action cancel"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <strong className="text-gold">{team.dedicatedFans || 1}</strong>
                {(isHoveringFans || window.innerWidth < 768) && (
                  <button
                    onClick={handleEditFans}
                    className="edit-treasury-btn"
                    title="Edit Fans"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>

          <div className="stat-pill">
            <TrendingUp size={14} className="text-muted" />
            <div>
              <span className="text-muted">TV: </span>
              <strong>{getTeamValue(id).replace(' gold', '')}</strong>
              <small className="text-muted" style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                (Cur: {getCurrentTeamValue(id).replace(' gold', '')})
              </small>
            </div>
          </div>
        </div>
      </header>

      <div className="section-header">
        <div className="section-title">
          <h2>TEAM ROSTER (16 SLOTS)</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{activePlayers.length} Active / 16 Slots Filled {deadPlayers.length > 0 && `• ${deadPlayers.length} Deceased`}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(team?.recentEvents || []).length > 0 && (
            <button className="btn-secondary" onClick={handleUndoEvent} title="Undo most recent SPP award">
              <RotateCcw size={16} /> Undo Recent SPP
            </button>
          )}
          <button className="btn-primary shadow-glow" onClick={handleAddPlayer}>
            <UserPlus size={18} /> Draft Player
          </button>
        </div>
      </div>

      <div className="table-container animate-in card" style={{ padding: 0, overflow: 'visible' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: '45px' }}>Slot</th>
              <th>Name</th>
              <th>Position</th>
              <th className="center">MA</th>
              <th className="center">ST</th>
              <th className="center">AG</th>
              <th className="center">PA</th>
              <th className="center">AV</th>
              <th>Skills & Upgrades</th>
              <th className="center">Adv</th>
              <th className="center" title="Current Unspent SPP (Lifetime Earned)">SPP (Career)</th>
              <th className="center">Value</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rosterSlots.map(({ slot, player }) => {
              const isDropTarget = dragOverSlot === slot && draggedPlayerId;
              if (!player) {
                return (
                  <tr
                    key={`slot-${slot}`}
                    className={`empty-slot-row${isDropTarget ? ' drag-over-slot' : ''}`}
                    onDragOver={(e) => handleDragOver(e, slot)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, slot)}
                  >
                    <td className="text-muted" style={{ fontWeight: 800 }}>#{slot}</td>
                    <td colSpan="11" style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{isDropTarget ? `↓ Drop here to move to #${slot}` : `Empty Slot #${slot}`}</span>
                        <button
                          onClick={() => {
                            setEditingPlayer(null);
                            setDraftSlot(slot);
                            setIsPlayerModalOpen(true);
                          }}
                          className="btn-icon-action"
                          style={{ width: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
                          title={`Draft into Slot #${slot}`}
                        >
                          <UserPlus size={12} /> Fill Slot
                        </button>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                );
              }

              const advCount = player.advancementsCount || (player.advancements || []).length || 0;
              const careerSpp = player.careerSpp !== undefined ? player.careerSpp : player.spp;
              const isDragging = draggedPlayerId === player.id;

              return (
                <tr
                  key={player.id}
                  className={`${player.status === 'injured' ? 'row-injured' : player.status === 'recovering' ? 'row-recovering' : ''}${isDragging ? ' row-dragging' : ''}${isDropTarget ? ' drag-over-slot' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, slot)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slot)}
                >
                  <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GripVertical
                        size={14}
                        style={{ color: 'var(--color-text-muted)', cursor: 'grab', flexShrink: 0, opacity: 0.5 }}
                        title="Drag to move slot"
                      />
                      #{player.number || slot}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                      {player.name}
                      {player.status === 'injured' && <span className="injury-dot" title="Injured / Miss Next Game"></span>}
                      {player.status === 'recovering' && <span className="recovery-dot" title="Recovering / Badly Hurt"></span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem' }}>
                    {player.position?.toUpperCase()}
                  </td>
                  <td className="center"><strong>{player.ma}</strong></td>
                  <td className="center"><strong>{player.st}</strong></td>
                  <td className="center"><strong>{player.ag}</strong></td>
                  <td className="center"><strong>{player.pa}</strong></td>
                  <td className="center"><strong>{player.av}</strong></td>
                  <td>
                    <div className="skills-tags">
                      {player.skills && player.skills.length > 0 ? player.skills.map((skill, i) => (
                        <span key={`${skill}-${i}`} className="skill-tag">{skill}</span>
                      )) : <span className="text-muted" style={{ fontSize: '0.7rem' }}>None</span>}
                    </div>
                  </td>
                  <td className="center">
                    {advCount > 0 ? (
                      <span className="skill-tag" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>
                        +{advCount}
                      </span>
                    ) : <span className="text-dim">0</span>}
                  </td>
                  <td className="center">
                    <strong className="text-gold">{player.spp || 0}</strong>
                    <span className="text-muted" style={{ fontSize: '0.75rem', marginLeft: '4px' }}>({careerSpp || 0})</span>
                  </td>
                  <td className="center" style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{player.cost}</td>
                  <td style={{ textAlign: 'right', position: 'relative' }}>
                    <button className="icon-btn" onClick={(e) => togglePlayerMenu(player.id, e)}>
                      <MoreHorizontal size={18} />
                    </button>

                    {activePlayerMenu === player.id && (
                      <div className="action-menu card thematic-menu-shadow">
                        <button className="status-advance inprogress" onClick={(e) => handleOpenAdvance(player, e)}>
                          <TrendingUp size={14} /> Advance
                        </button>
                        <button className="status-advance" onClick={(e) => handleOpenSpp(player, e)}>
                          <Star size={14} /> Award SPP
                        </button>
                        <button onClick={(e) => handleOpenMoveSlot(player, e)}>
                          <ArrowLeftRight size={14} /> Move to Slot
                        </button>
                        {player.status !== 'injured' ? (
                          <button className="status-injury" onClick={(e) => handleOpenInjury(player, e)}>
                            <AlertTriangle size={14} className="text-danger" /> Register Injury
                          </button>
                        ) : (
                          <button className="status-recover" onClick={(e) => handleRecoverPlayer(player, e)}>
                            <Activity size={14} className="text-success" /> Recover Player
                          </button>
                        )}
                        <button onClick={(e) => handleEditPlayerAction(player, e)}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="delete-action" onClick={(e) => handleDeletePlayerAction(player.id, e)}>
                          <Trash2 size={14} /> Fire Player
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deadPlayers.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#ef4444', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> HALL OF FALLEN WARRIORS (CASUALTIES / DECEASED)
          </h3>
          <div className="table-container card" style={{ padding: 0, opacity: 0.85 }}>
            <table>
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Position</th>
                  <th className="center">Career SPP</th>
                  <th className="center">Upgrades</th>
                  <th>Final Skills</th>
                  <th className="center">Status</th>
                </tr>
              </thead>
              <tbody>
                {deadPlayers.map(p => (
                  <tr key={p.id}>
                    <td style={{ textDecoration: 'line-through', color: '#ef4444', fontWeight: 700 }}>{p.name}</td>
                    <td className="text-muted">{p.position}</td>
                    <td className="center text-gold"><strong>{p.careerSpp || p.spp || 0}</strong></td>
                    <td className="center">{p.advancementsCount || (p.advancements || []).length || 0}</td>
                    <td>
                      <div className="skills-tags">
                        {(p.skills || []).map((s, idx) => (
                          <span key={idx} className="skill-tag" style={{ opacity: 0.7 }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="center" style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem' }}>DECEASED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => { setIsPlayerModalOpen(false); setEditingPlayer(null); }}
        onSave={handleSavePlayer}
        player={editingPlayer}
        defaultSlot={draftSlot}
        availableTreasury={team?.treasury}
        teamRace={team?.race}
      />

      {/* ── Move-to-Slot Modal ── */}
      {isMoveModalOpen && movingPlayer && (
        <div className="modal-overlay" onClick={() => setIsMoveModalOpen(false)} style={{ zIndex: 1100 }}>
          <div
            className="modal-content card"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: 0 }}
          >
            <header className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>MOVE PLAYER — SLOT #{movingPlayer.number}</h2>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  {movingPlayer.name} · {movingPlayer.position}
                </p>
              </div>
              <button className="close-btn" onClick={() => setIsMoveModalOpen(false)}><X size={20} /></button>
            </header>
            <div style={{ padding: '1.25rem' }}>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                Select a target slot. Dropping on an occupied slot will <strong>swap</strong> the two players.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {Array.from({ length: 16 }, (_, i) => i + 1).map(slotNum => {
                  const occupant = activePlayers.find(p => parseInt(p.number) === slotNum && p.id !== movingPlayer.id);
                  const isCurrent = parseInt(movingPlayer.number) === slotNum;
                  return (
                    <button
                      key={slotNum}
                      onClick={() => !isCurrent && handleMoveToSlot(slotNum)}
                      disabled={isCurrent}
                      style={{
                        padding: '0.6rem 0.4rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: isCurrent
                          ? '2px solid var(--color-primary)'
                          : occupant
                            ? '1px solid #f97316'
                            : '1px solid var(--color-border)',
                        background: isCurrent
                          ? 'rgba(211,16,39,0.15)'
                          : occupant
                            ? 'rgba(249,115,22,0.08)'
                            : 'rgba(255,255,255,0.03)',
                        color: isCurrent ? 'var(--color-primary)' : occupant ? '#f97316' : 'white',
                        cursor: isCurrent ? 'not-allowed' : 'pointer',
                        opacity: isCurrent ? 0.6 : 1,
                        textAlign: 'center',
                        lineHeight: 1.3
                      }}
                      title={isCurrent ? 'Current slot' : occupant ? `Swap with ${occupant.name}` : `Move to #${slotNum}`}
                    >
                      #{slotNum}
                      {occupant && <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>{occupant.name.split(' ')[0]}</div>}
                      {!occupant && !isCurrent && <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '2px' }}>empty</div>}
                      {isCurrent && <div style={{ fontSize: '0.65rem', opacity: 0.8, marginTop: '2px' }}>current</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <PlayerAdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onSave={handleSaveAdvance}
        player={advancingPlayer}
      />

      <PlayerSppModal
        isOpen={isSppModalOpen}
        onClose={() => setIsSppModalOpen(false)}
        onAward={handleSaveSpp}
        player={awardingPlayer}
      />

      <PlayerInjuryModal
        isOpen={isInjuryModalOpen}
        onClose={() => setIsInjuryModalOpen(false)}
        onSave={handleSaveInjury}
        player={injuredPlayer}
      />

      <SidelineManager
        team={team}
        tournament={tournament}
        matches={matches}
        treasury={team.treasury || '0 gold'}
        updateSideline={updateSideline}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .view-container { padding: 2rem; }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          color: var(--color-text-muted);
          font-weight: 500;
          margin-bottom: 2rem;
          padding: 0;
        }
        .back-btn:hover { color: white; }
        
        .team-banner {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        .banner-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .team-icon-large {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: white;
        }
        .team-info-large h1 { font-size: 2.5rem; }
        
        .banner-stats {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .stat-pill {
          background-color: rgba(255,255,255,0.05);
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .skill-tag {
          background-color: var(--color-neutral);
          color: white;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .skills-tags {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        .injury-dot {
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 10px #ef4444;
        }
        .recovery-dot {
          width: 8px;
          height: 8px;
          background-color: #22c55e;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 10px #22c55e;
        }
        .row-injured {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        .row-recovering {
          background-color: rgba(34, 197, 94, 0.1) !important;
        }
        .text-danger { color: #ef4444; }
        .text-success { color: #22c55e; }

        .action-row {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            justify-content: flex-end;
        }

        .icon-btn {
          background: none;
          color: var(--color-text-muted);
          width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }
        .icon-btn:hover {
          color: white;
        }
        .icon-btn.delete-icon:hover {
            color: #f87171;
        }

        .action-menu {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 180px;
            background-color: #0f0f0f;
            border: 1px solid var(--color-border);
            padding: 0.5rem;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            border-radius: 0;
        }

        .action-menu button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.6rem 0.75rem;
            background: none;
            border: none;
            color: var(--color-text-muted);
            font-size: 0.85rem;
            font-weight: 600;
            border-radius: 6px;
            text-align: left;
            transition: all 0.2s ease;
        }

        .action-menu button:hover {
            background-color: rgba(255, 255, 255, 0.08);
            color: white;
        }

        .status-advance.inprogress:hover {
            color: #facc15;
        }
        
        .status-injury:hover {
            color: #ef4444 !important;
            background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        .status-recover:hover {
            color: #22c55e !important;
            background-color: rgba(34, 197, 94, 0.1) !important;
        }

        .action-menu button.delete-action:hover {
            color: #f87171;
        }

        .thematic-menu-shadow {
            box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 15px rgba(211, 16, 39, 0.1);
        }

        .edit-treasury-btn {
          position: absolute;
          right: 0.5rem;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.4);
          color: var(--color-text-muted);
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          transition: var(--transition);
          cursor: pointer;
        }
        .edit-treasury-btn:hover {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .btn-icon-action {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--color-border);
          transition: var(--transition);
          cursor: pointer;
        }
        .btn-icon-action.save {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.3);
        }
        .btn-icon-action.save:hover {
          background: #22c55e;
          color: white;
        }
        .btn-icon-action.cancel {
          background: rgba(0,0,0,0.4);
          color: var(--color-text-muted);
        }
        .btn-icon-action.cancel:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        /* Drag-and-drop styles */
        tr[draggable="true"] { cursor: grab; }
        tr[draggable="true"]:active { cursor: grabbing; }
        .row-dragging {
          opacity: 0.35;
          background: rgba(211, 16, 39, 0.06) !important;
        }
        .drag-over-slot td {
          background-color: rgba(234, 179, 8, 0.07) !important;
          outline: 2px dashed rgba(234, 179, 8, 0.55);
          outline-offset: -2px;
        }
      `}} />
    </div>
  );
};

export default TeamDetailView;
