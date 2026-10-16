import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PlayerInjuryModal = ({ isOpen, onClose, onSave, player }) => {
    const [injuryType, setInjuryType] = useState('mng');
    const [statToDecrease, setStatToDecrease] = useState('ma'); // default stat

    useEffect(() => {
        if (isOpen) {
            setInjuryType('mng');
            setStatToDecrease('ma');
        }
    }, [isOpen]);

    if (!isOpen || !player) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (injuryType === 'dead') {
            const confirmed = window.confirm(
                `WARNING: Are you sure ${player.name} died? This will permanently remove them from the active team roster. Historical statistics and SPP will be preserved.`
            );
            if (!confirmed) return;
        }

        onSave({
            injuryType,
            statToDecrease: injuryType === 'stat' ? statToDecrease : null
        });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="modal-content card"
                    onClick={e => e.stopPropagation()}
                >
                    <header className="modal-header">
                        <h2>REGISTER INJURY</h2>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="player-context">
                            <div className="context-main">
                                <span className="text-muted label-tiny">PLAYER INJURED</span>
                                <h3 style={{ color: '#ef4444' }}>{player.name}</h3>
                                <p className="text-muted">{player.position}</p>
                            </div>
                            <div className="icon-display">
                                <AlertTriangle size={32} className="text-danger" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Injury Severity</label>
                            <div className="radio-group">
                                <label className={`radio-card ${injuryType === 'bad' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="injuryType"
                                        value="bad"
                                        checked={injuryType === 'bad'}
                                        onChange={() => setInjuryType('bad')}
                                    />
                                    <div className="radio-content">
                                        <strong>Badly Hurt</strong>
                                        <span className="text-muted text-small">Misses This Game only. No long term effects.</span>
                                    </div>
                                </label>

                                <label className={`radio-card ${injuryType === 'mng' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="injuryType"
                                        value="mng"
                                        checked={injuryType === 'mng'}
                                        onChange={() => setInjuryType('mng')}
                                    />
                                    <div className="radio-content">
                                        <strong>Seriously Hurt</strong>
                                        <span className="text-muted text-small">Misses Next Game only. No long term effects.</span>
                                    </div>
                                </label>

                                <label className={`radio-card ${injuryType === 'niggling' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="injuryType"
                                        value="niggling"
                                        checked={injuryType === 'niggling'}
                                        onChange={() => setInjuryType('niggling')}
                                    />
                                    <div className="radio-content">
                                        <strong>Serious Injury</strong>
                                        <span className="text-muted text-small">Gains "Niggling Injury" + MNG.</span>
                                    </div>
                                </label>

                                <label className={`radio-card ${injuryType === 'stat' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="injuryType"
                                        value="stat"
                                        checked={injuryType === 'stat'}
                                        onChange={() => setInjuryType('stat')}
                                    />
                                    <div className="radio-content">
                                        <strong>Lasting Injury</strong>
                                        <span className="text-muted text-small">Stat Decrease + MNG.</span>
                                    </div>
                                </label>

                                <label className={`radio-card death-card ${injuryType === 'dead' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="injuryType"
                                        value="dead"
                                        checked={injuryType === 'dead'}
                                        onChange={() => setInjuryType('dead')}
                                    />
                                    <div className="radio-content">
                                        <strong style={{ color: '#ef4444' }}>Killed in Action (Death)</strong>
                                        <span className="text-muted text-small">Permanently removes player from active team. Career stats & SPP are preserved.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {injuryType === 'stat' && (
                            <div className="form-group animate-in">
                                <label>Select Stat to Decrease</label>
                                <select
                                    value={statToDecrease}
                                    onChange={(e) => setStatToDecrease(e.target.value)}
                                    className="stat-select"
                                >
                                    <option value="ma">Movement Allowance (MA)</option>
                                    <option value="st">Strength (ST)</option>
                                    <option value="ag">Agility (AG)</option>
                                    <option value="pa">Passing Ability (PA)</option>
                                    <option value="av">Armour Value (AV)</option>
                                </select>
                            </div>
                        )}

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-danger">
                                Confirm Injury
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0,0,0,0.85);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .modal-content {
                    width: 100%;
                    max-width: 500px;
                    max-height: calc(100vh - 2rem);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.2);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                .modal-header {
                    flex-shrink: 0;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(to right, rgba(239, 68, 68, 0.1), transparent);
                }
                .modal-header h2 { font-size: 1.25rem; letter-spacing: 0.1em; color: #ef4444; }
                .close-btn { background: none; color: var(--color-text-muted); cursor: pointer; border: none; }
                .close-btn:hover { color: white; }

                .modal-form { 
                    padding: 1.5rem; 
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .form-group { margin-bottom: 1.5rem; }
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                }

                .player-context {
                    background: rgba(239, 68, 68, 0.05);
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .label-tiny { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
                .text-danger { color: #ef4444; }

                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .radio-card {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .radio-card:hover { background: rgba(255,255,255,0.06); }
                .radio-card.selected {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: #ef4444;
                }
                .radio-card input { margin-top: 0.25rem; }
                
                .radio-content { display: flex; flex-direction: column; gap: 0.2rem; }
                .text-small { font-size: 0.8rem; }

                .stat-select {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    font-family: inherit;
                }
                .stat-select:focus { border-color: #ef4444; outline: none; }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--color-border);
                }
                .btn-secondary {
                    background-color: transparent;
                    color: var(--color-text-muted);
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    border-radius: 6px;
                }
                .btn-secondary:hover { color: white; background: rgba(255,255,255,0.05); }
                
                .btn-danger {
                    background-color: #ef4444;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .btn-danger:hover { background-color: #dc2626; }

                .animate-in {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}} />
        </AnimatePresence>
    );
};

export default PlayerInjuryModal;
