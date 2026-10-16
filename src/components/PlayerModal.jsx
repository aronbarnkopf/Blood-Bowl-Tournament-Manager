import React, { useState, useEffect } from 'react';
import { X, User, Zap, Shield, Target, MessageSquare, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { db } from '../config';
import { doc, getDoc } from 'firebase/firestore';

const PlayerModal = ({ isOpen, onClose, onSave, player, availableTreasury, teamRace, defaultSlot }) => {
    const [availablePositions, setAvailablePositions] = useState([]);
    // A player is being "edited" only when it has a persisted Firestore id.
    // A falsy player or a player without an id means we are drafting a new player.
    const isEditing = !!(player && player.id);

    const [formData, setFormData] = useState({
        name: '',
        number: defaultSlot || 1,
        position: '',
        ma: 6,
        st: 3,
        ag: '3+',
        pa: '4+',
        av: '9+',
        skills: '',
        cost: '50,000 gold',
        spp: 0,
        primarySkill: '',
        secondarySkill: ''
    });

    useEffect(() => {
        const fetchRaceData = async () => {
            if (teamRace && !isEditing) {
                try {
                    const raceDoc = await getDoc(doc(db, 'races', teamRace));
                    if (raceDoc.exists()) {
                        setAvailablePositions(raceDoc.data().players);
                    }
                } catch (error) {
                    console.error("Error fetching race data:", error);
                }
            }
        };

        fetchRaceData();
    }, [teamRace, isEditing, isOpen]);

    useEffect(() => {
        if (isEditing) {
            setFormData({
                ...player,
                number: player.number !== undefined ? player.number : 1,
                skills: Array.isArray(player.skills) ? player.skills.join(', ') : player.skills
            });
        } else {
            setFormData({
                name: '',
                number: defaultSlot || 1,
                position: '',
                ma: 6,
                st: 3,
                ag: '3+',
                pa: '4+',
                av: '9+',
                skills: '',
                cost: '50,000 gold',
                spp: 0,
                primarySkill: '',
                secondarySkill: ''
            });
        }
    }, [player, isOpen, defaultSlot]);

    const handlePositionChange = (e) => {
        const selectedPosName = e.target.value;
        const selectedType = availablePositions.find(p => p.position === selectedPosName);

        if (selectedType) {
            setFormData({
                ...formData,
                position: selectedType.position,
                ma: selectedType.stats.MA,
                st: selectedType.stats.ST,
                ag: selectedType.stats.AG,
                pa: selectedType.stats.PA,
                av: selectedType.stats.AV,
                skills: selectedType.skills.join(', '),
                cost: selectedType.cost.toLocaleString() + ' gold',
                primarySkill: selectedType.primarySkill,
                secondarySkill: selectedType.secondarySkill
            });
        } else {
            setFormData({ ...formData, position: selectedPosName });
        }
    };



    const parseCurrency = (str) => {
        if (!str) return 0;
        return parseInt(str.toString().replace(/\D/g, '')) || 0;
    };

    const currentCost = parseCurrency(formData.cost);
    const treasuryNum = parseCurrency(availableTreasury);
    const isOverBudget = !isEditing && availableTreasury && currentCost > treasuryNum;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isOverBudget) {
            alert("Insufficient treasury funds!");
            return;
        }
        const finalSkills = formData.skills.split(',').map(s => s.trim()).filter(s => s !== '');
        onSave({
            ...formData,
            skills: finalSkills,
            ma: parseInt(formData.ma),
            st: parseInt(formData.st)
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} key="player-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content card"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="modal-header">
                            <h2>{isEditing ? 'EDIT PLAYER' : `DRAFT PLAYER — SLOT #${formData.number}`}</h2>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row">
                                <div className="form-group" style={{ maxWidth: '100px' }}>
                                    <label>Jersey #</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="16"
                                        required
                                        value={formData.number}
                                        onChange={e => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Player Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Grimgor Ironhide"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Position</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            required
                                            value={formData.position}
                                            onChange={e => setFormData({ ...formData, position: e.target.value })}
                                            placeholder="e.g. Blitzer"
                                        />
                                    ) : (
                                        <select
                                            value={formData.position}
                                            onChange={handlePositionChange}
                                            style={{ width: '100%', padding: '0.85rem 1rem', background: '#1a1a1a', border: '1px solid var(--color-border)', color: 'white', borderRadius: '8px' }}
                                        >
                                            <option value="">Select Position...</option>
                                            {availablePositions.map((pos, idx) => (
                                                <option key={idx} value={pos.position}>{pos.position} - {pos.cost.toLocaleString()} gold</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Hiring Cost</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            required
                                            className={isOverBudget ? 'input-error' : ''}
                                            value={formData.cost}
                                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                            placeholder="50,000 gold"
                                        />
                                        {isOverBudget && (
                                            <span className="error-text">EXCEEDS TREASURY!</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="stats-section-container">
                                <label className="section-label">Player Profile</label>
                                <div className="stats-grid">
                                    <div className="stat-input">
                                        <label>MA</label>
                                        <input type="number" value={formData.ma} onChange={e => setFormData({ ...formData, ma: e.target.value })} />
                                    </div>
                                    <div className="stat-input">
                                        <label>ST</label>
                                        <input type="number" value={formData.st} onChange={e => setFormData({ ...formData, st: e.target.value })} />
                                    </div>
                                    <div className="stat-input">
                                        <label>AG</label>
                                        <input type="text" value={formData.ag} onChange={e => setFormData({ ...formData, ag: e.target.value })} />
                                    </div>
                                    <div className="stat-input">
                                        <label>PA</label>
                                        <input type="text" value={formData.pa} onChange={e => setFormData({ ...formData, pa: e.target.value })} />
                                    </div>
                                    <div className="stat-input">
                                        <label>AV</label>
                                        <input type="text" value={formData.av} onChange={e => setFormData({ ...formData, av: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Skills & Traits</label>
                                <textarea
                                    rows="2"
                                    value={formData.skills}
                                    onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                    placeholder="Block, Dodge, Mighty Blow..."
                                />
                            </div>

                            {isEditing && (
                                <div className="form-group">
                                    <label>Star Player Points (SPP)</label>
                                    <input
                                        type="number"
                                        value={formData.spp}
                                        onChange={e => setFormData({ ...formData, spp: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            )}

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={isOverBudget || !formData.position} title={!formData.position ? "Please select a position" : ""}>
                                    {isEditing ? 'Update Roster' : 'Finalize Contract'}
                                </button>
                            </div>
                        </form>
                    </motion.div>


                    <style dangerouslySetInnerHTML={{
                        __html: `
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0,0,0,0.85);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .modal-content {
                    width: 100%;
                    max-width: 520px;
                    max-height: calc(100vh - 2rem);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(211, 16, 39, 0.1);
                }
                .modal-header {
                    flex-shrink: 0;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(to right, rgba(211, 16, 39, 0.05), transparent);
                }
                .modal-header h2 { font-size: 1.25rem; letter-spacing: 0.1em; }
                .close-btn { background: none; color: var(--color-text-muted); }
                .close-btn:hover { color: white; }

                .modal-form { 
                    padding: 1.5rem; 
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .form-group { margin-bottom: 1.5rem; }

                .form-group label, .section-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                }
                .section-label { margin-bottom: 1rem; color: var(--color-primary); }

                .form-group input, .form-group textarea {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    font-family: inherit;
                    transition: all 0.2s;
                }
                .form-group input:focus, .form-group textarea:focus { border-color: var(--color-primary); outline: none; }
                .input-error { border-color: #ef4444 !important; }
                .error-text { 
                    position: absolute; 
                    right: 1rem; 
                    top: 50%; 
                    transform: translateY(-50%); 
                    color: #ef4444; 
                    font-size: 0.65rem; 
                    font-weight: 800; 
                }

                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

                .stats-section-container {
                    background: rgba(255,255,255,0.02);
                    padding: 1.25rem;
                    border-radius: 8px;
                    border: 1px solid var(--color-border);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 0.75rem;
                }
                .stat-input {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }
                .stat-input label {
                    font-size: 0.65rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                }
                .stat-input input {
                    width: 100%;
                    text-align: center;
                    background: #000;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.6rem 0;
                    border-radius: 6px;
                    font-weight: 800;
                    font-size: 1rem;
                }
                .stat-input input:focus { border-color: var(--color-primary); }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--color-border);
                }
                .btn-secondary {
                    background-color: transparent;
                    color: var(--color-text-muted);
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    border: none;
                }
                .btn-secondary:hover { color: white; }
            `}} />
                </div>
            )}
        </AnimatePresence>
    );
};

export default PlayerModal;
