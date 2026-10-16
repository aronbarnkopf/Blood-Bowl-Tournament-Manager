import React, { useState, useEffect } from 'react';
import { X, Trophy, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MatchResultModal = ({ isOpen, onClose, onSave, match, teamA, teamB }) => {
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    const [earningsA, setEarningsA] = useState(0);
    const [earningsB, setEarningsB] = useState(0);
    const [playedDate, setPlayedDate] = useState('');

    useEffect(() => {
        if (isOpen && match) {
            setScoreA(match.scoreA !== undefined ? match.scoreA : 0);
            setScoreB(match.scoreB !== undefined ? match.scoreB : 0);
            setEarningsA(match.earningsA !== undefined ? match.earningsA : 0);
            setEarningsB(match.earningsB !== undefined ? match.earningsB : 0);
            setPlayedDate(match.playedDate || (match.status === 'played' ? match.date : (() => { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0'); })()));
        }
    }, [isOpen, match]);

    if (!isOpen || !match) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(match.id, {
            scoreA: parseInt(scoreA) || 0,
            scoreB: parseInt(scoreB) || 0,
            earningsA: parseInt(earningsA) || 0,
            earningsB: parseInt(earningsB) || 0,
            playedDate: playedDate.trim() || (() => { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + String(d.getDate()).padStart(2,'0'); })()
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Trophy size={20} className="text-primary" />
                            <h2>RESOLVE MATCH</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <p className="text-muted" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            Enter the final score and earnings for this match.
                        </p>

                        <div className="match-entry-container">
                            <div className="team-score-input">
                                <div className="team-meta">
                                    <div className="small-icon" style={{ backgroundColor: teamA?.color }}>{teamA?.icon?.substring(0, 2)}</div>
                                    <span className="team-name">{teamA?.name}</span>
                                </div>
                                <div className="input-group">
                                    <label>Score</label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={scoreA}
                                        onChange={e => setScoreA(e.target.value)}
                                        autoFocus
                                        className="score-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Coins size={12} /> Earnings</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={5000}
                                        value={earningsA}
                                        onChange={e => setEarningsA(e.target.value)}
                                        className="earnings-input"
                                        placeholder="Gold"
                                    />
                                </div>
                            </div>

                            <div className="vs-divider">VS</div>

                            <div className="team-score-input">
                                <div className="team-meta">
                                    <div className="small-icon" style={{ backgroundColor: teamB?.color }}>{teamB?.icon?.substring(0, 2)}</div>
                                    <span className="team-name">{teamB?.name}</span>
                                </div>
                                <div className="input-group">
                                    <label>Score</label>
                                    <input
                                        type="number"
                                        min={0}
                                        required
                                        value={scoreB}
                                        onChange={e => setScoreB(e.target.value)}
                                        className="score-input"
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}><Coins size={12} /> Earnings</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={5000}
                                        value={earningsB}
                                        onChange={e => setEarningsB(e.target.value)}
                                        className="earnings-input"
                                        placeholder="Gold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                Match Date Played
                            </label>
                            <input
                                type="text"
                                value={playedDate}
                                onChange={e => setPlayedDate(e.target.value)}
                                placeholder="e.g. 2026. 03. 15. or Round 1"
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary shadow-glow">
                                {match.status === 'played' ? 'Update Match Result' : 'Record Result'}
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
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 1rem;
                }
                .modal-content {
                    width: 100%;
                    max-width: 600px;
                    max-height: calc(100vh - 2rem);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
                    border: 1px solid var(--color-border);
                }
                .modal-header {
                    flex-shrink: 0;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.02);
                }
                .modal-header h2 { font-size: 1.1rem; letter-spacing: 0.1em; }
                .close-btn { background: none; color: var(--color-text-muted); }
                .close-btn:hover { color: white; }

                .modal-form { 
                    padding: 2rem; 
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                
                .match-entry-container {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    background: rgba(0,0,0,0.2);
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                }

                .team-score-input {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.2rem;
                }

                .team-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    text-align: center;
                    margin-bottom: 0.5rem;
                }

                .team-name {
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: var(--color-text-muted);
                    max-width: 120px;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.4rem;
                    width: 100%;
                }
                
                .input-group label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    font-weight: 700;
                }

                .score-input {
                    width: 80px !important;
                    height: 80px !important;
                    background: #000;
                    border: 2px solid var(--color-border);
                    border-radius: 12px;
                    color: white;
                    font-size: 2.5rem;
                    font-weight: 900;
                    text-align: center;
                    transition: var(--transition);
                }

                .earnings-input {
                    width: 100%;
                    padding: 0.6rem;
                    background: #000;
                    border: 1px solid var(--color-border);
                    border-radius: 6px;
                    color: var(--color-primary);
                    font-weight: 700;
                    text-align: center;
                    font-size: 0.9rem;
                }

                .score-input:focus, .earnings-input:focus {
                    border-color: var(--color-primary);
                    background: #0a0a0a;
                    outline: none;
                    box-shadow: 0 0 20px rgba(185, 28, 28, 0.1);
                }

                .vs-divider {
                    font-family: 'Inter', sans-serif;
                    font-weight: 900;
                    font-style: italic;
                    color: var(--color-primary);
                    opacity: 0.3;
                    font-size: 1.5rem;
                    margin-top: 5rem;
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .btn-secondary {
                    background-color: transparent;
                    color: var(--color-text-muted);
                    padding: 0.75rem 1.5rem;
                    font-weight: 600;
                }
                .btn-secondary:hover { color: white; }

                /* Remove arrows from number input */
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}} />
        </AnimatePresence>
    );
};

export default MatchResultModal;
