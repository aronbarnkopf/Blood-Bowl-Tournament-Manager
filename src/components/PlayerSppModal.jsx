import React, { useState } from 'react';
import { X, Zap, Trophy, Target, Shield, Star, ArrowUpRight, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SPP_ACTIONS = [
    { label: 'Touchdown', value: 3, icon: Trophy, color: '#facc15' },
    { label: 'Casualty', value: 2, icon: Target, color: '#ef4444' },
    { label: 'Pass', value: 1, icon: Zap, color: '#60a5fa' },
    { label: 'Throw Team Mate', value: 1, icon: ArrowUpRight, color: '#fb923c' },
    { label: 'Safe Landing', value: 1, icon: ArrowDown, color: '#34d399' },
    { label: 'Interception', value: 2, icon: Shield, color: '#4ade80' },
    { label: 'MVP', value: 4, icon: Star, color: '#c084fc' },
];

const PlayerSppModal = ({ isOpen, onClose, onAward, player }) => {
    const [customAmount, setCustomAmount] = useState('');
    const [selectedAction, setSelectedAction] = useState(null);

    if (!isOpen || !player) return null;

    const handleActionSelect = (action) => {
        setSelectedAction(action);
        setCustomAmount(action.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const amount = parseInt(customAmount);
        if (isNaN(amount)) return;

        // Pass the label of the selected action (e.g. "Touchdown") or "Custom"
        const reason = selectedAction ? selectedAction.label : 'Custom';

        onAward(player.id, amount, reason);
        setCustomAmount('');
        setSelectedAction(null);
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
                    style={{ maxWidth: '500px' }}
                >
                    <header className="modal-header">
                        <h2>AWARD SPP</h2>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="player-context">
                            <div className="context-main">
                                <span className="text-muted label-tiny">AWARDING POINTS TO</span>
                                <h3>{player.name}</h3>
                                <p className="text-muted">{player.position}</p>
                            </div>
                            <div className="spp-display">
                                <span className="text-muted label-tiny">CURRENT SPP</span>
                                <div className="spp-value">
                                    <Zap size={16} className="text-primary" />
                                    <span>{player.spp}</span>
                                </div>
                            </div>
                        </div>

                        <div className="spp-presets">
                            <label className="section-label">Common Actions</label>
                            <div className="presets-grid">
                                {SPP_ACTIONS.map(action => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        className={`preset-btn ${selectedAction?.label === action.label ? 'active' : ''}`}
                                        onClick={() => handleActionSelect(action)}
                                    >
                                        <action.icon size={20} style={{ color: action.color }} />
                                        <div className="preset-info">
                                            <span className="preset-label">{action.label}</span>
                                            <span className="preset-value">+{action.value} SPP</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group custom-award">
                            <label className="section-label">Custom Amount</label>
                            <div className="input-with-label">
                                <input
                                    type="number"
                                    placeholder="Enter SPP amount..."
                                    value={customAmount}
                                    onChange={e => {
                                        setCustomAmount(e.target.value);
                                        setSelectedAction(null);
                                    }}
                                />
                                <span className="input-suffix">SPP</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={!customAmount}>
                                Confirm Award
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
                    max-width: 500px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 20px rgba(211, 16, 39, 0.1);
                }

                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(to right, rgba(211, 16, 39, 0.05), transparent);
                    flex-shrink: 0;
                }
                .modal-header h2 { font-size: 1.25rem; letter-spacing: 0.1em; }
                .close-btn { background: none; color: var(--color-text-muted); }
                .close-btn:hover { color: white; }

                .modal-form {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;

                    scrollbar-width: none;
                }

                .player-context {
                    background: rgba(255,255,255,0.03);
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid var(--color-border);
                }
                .context-main h3 { margin: 0.25rem 0; font-size: 1.5rem; }
                .label-tiny { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }

                .spp-display { text-align: right; }
                .spp-value {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    margin-top: 0.25rem;
                }

                .section-label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                }

                .spp-presets { margin-bottom: 2rem; }
                .presets-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }
                .preset-btn {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: #1a1a1a;
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    text-align: left;
                    transition: all 0.2s;
                }
                .preset-btn:hover {
                    border-color: var(--color-primary);
                    background: rgba(211, 16, 39, 0.05);
                }
                .preset-btn.active {
                    border-color: var(--color-primary);
                    background: rgba(211, 16, 39, 0.1);
                    box-shadow: 0 0 15px rgba(211, 16, 39, 0.1);
                }
                .preset-info {
                    display: flex;
                    flex-direction: column;
                }
                .preset-label { font-size: 0.85rem; font-weight: 700; color: white; }
                .preset-value { font-size: 0.75rem; color: var(--color-text-muted); }

                .custom-award {
                    border-top: 1px solid var(--color-border);
                    padding-top: 1.5rem;
                }
                .input-with-label {
                    position: relative;
                }
                .input-with-label input {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.85rem 1rem;
                    padding-right: 3.5rem;
                    border-radius: 8px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                .input-with-label input:focus { border-color: var(--color-primary); outline: none; }
                
                .input-suffix {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                }

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
                }
                .btn-secondary:hover { color: white; }
            `}} />
        </AnimatePresence>
    );
};

export default PlayerSppModal;
