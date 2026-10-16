import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Zap, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdvancementCostAndValue, parseCurrency } from '../utils/bbRules';

const ADVANCEMENT_TYPES = [
    { id: 'chosenPrimary', label: 'Chosen Primary Skill', desc: 'Select any Primary skill (+20k TV)' },
    { id: 'randomPrimary', label: 'Random Primary Skill', desc: 'Randomly determined Primary (+20k TV)' },
    { id: 'chosenSecondary', label: 'Chosen Secondary Skill', desc: 'Select any Secondary skill (+40k TV)' },
    { id: 'characteristic_av', label: '+1 AV Characteristic', desc: 'Characteristic upgrade (+10k TV)' },
    { id: 'characteristic_ma', label: '+1 MA Characteristic', desc: 'Characteristic upgrade (+20k TV)' },
    { id: 'characteristic_pa', label: '+1 PA Characteristic', desc: 'Characteristic upgrade (+20k TV)' },
    { id: 'characteristic_ag', label: '+1 AG Characteristic', desc: 'Characteristic upgrade (+30k TV)' },
    { id: 'characteristic_st', label: '+1 ST Characteristic', desc: 'Characteristic upgrade (+60k TV)' },
];

const PlayerAdvanceModal = ({ isOpen, onClose, onSave, player }) => {
    const currentAdvCount = player?.advancementsCount || (player?.advancements || []).length || 0;
    const [advType, setAdvType] = useState('chosenPrimary');
    const [formData, setFormData] = useState({
        skill: '',
        valueIncrease: 20000,
        sppCost: 6
    });
    const isCharacteristic = advType.startsWith('characteristic_');

    useEffect(() => {
        if (isOpen && player) {
            const { sppCost, tvIncrease } = getAdvancementCostAndValue(currentAdvCount, advType);
            setFormData({
                skill: '',
                valueIncrease: tvIncrease,
                sppCost
            });
        }
    }, [isOpen, player, advType, currentAdvCount]);

    if (!isOpen || !player) return null;

    const handleAdvTypeChange = (e) => {
        const newType = e.target.value;
        setAdvType(newType);
        const { sppCost, tvIncrease } = getAdvancementCostAndValue(currentAdvCount, newType);
        setFormData(prev => ({
            ...prev,
            skill: newType.startsWith('characteristic_') ? '' : prev.skill,
            valueIncrease: tvIncrease,
            sppCost
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const skillName = isCharacteristic
        ? `${advType.replace('characteristic_', '')}`
        : formData.skill;
        onSave(player.id, skillName, parseInt(formData.valueIncrease), parseInt(formData.sppCost));
        onClose();
    };

    const nextCost = parseCurrency(player.cost) + (parseInt(formData.valueIncrease) || 0);
    const hasEnoughSpp = (player.spp || 0) >= formData.sppCost;

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award className="text-gold" size={20} />
                            <h2>PLAYER ADVANCEMENT #{currentAdvCount + 1}</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="player-advance-context">
                            <div className="context-main">
                                <span className="text-muted label-tiny">PLAYER TO ADVANCE</span>
                                <h3>{player.name}</h3>
                                <p className="text-muted">{player.position} • {currentAdvCount} previous upgrades</p>
                            </div>
                            <div className="spp-display">
                                <span className="text-muted label-tiny">CURRENT UNSPENT SPP</span>
                                <div className="spp-value">
                                    <Zap size={16} className="text-primary" />
                                    <span>{player.spp}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Advancement Category</label>
                            <select
                                value={advType}
                                onChange={handleAdvTypeChange}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    padding: '0.85rem 1rem',
                                    borderRadius: '8px'
                                }}
                            >
                                {ADVANCEMENT_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.label} ({t.desc})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Chosen Skill / Upgrade Name</label>
                            <input
                                type="text"
                                required={!isCharacteristic}
                                disabled={isCharacteristic}
                                value={formData.skill}
                                onChange={e => setFormData({ ...formData, skill: e.target.value })}
                                placeholder="e.g. Block, Dodge, Guard, +1 ST..."
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>SPP Cost (Auto-calculated)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.sppCost}
                                    onChange={e => setFormData({ ...formData, sppCost: parseInt(e.target.value) || 0 })}
                                />
                                {!hasEnoughSpp && (
                                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px', display: 'block' }}>
                                        Insufficient SPP! Needs {formData.sppCost} SPP (has {player.spp || 0}).
                                    </span>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Team Value Increase (Gold)</label>
                                <input
                                    type="number"
                                    required
                                    step="10000"
                                    min="0"
                                    value={formData.valueIncrease}
                                    onChange={e => setFormData({ ...formData, valueIncrease: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="cost-preview">
                            <div className="preview-item">
                                <span className="text-muted">Current Value</span>
                                <span>{player.cost}</span>
                            </div>
                            <div className="preview-arrow">→</div>
                            <div className="preview-item highlight">
                                <span className="text-muted">New Player Value</span>
                                <strong className="text-gold">{nextCost.toLocaleString()} gold</strong>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={!hasEnoughSpp || (!isCharacteristic && !formData.skill)}>
                                Confirm Advancement
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
                .form-group { margin-bottom: 1.5rem; }
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.75rem;
                }
                .form-group input {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.85rem 1rem;
                    border-radius: 8px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                }
                .form-group input:focus { border-color: var(--color-primary); outline: none; }
                
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

                .player-advance-context {
                    background: rgba(255,255,255,0.03);
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border: 1px solid var(--color-border);
                    position: relative;
                    overflow: hidden;
                }
                .player-advance-context h3 { margin: 0.25rem 0; font-size: 1.5rem; }
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

                .cost-preview {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 2rem;
                    padding: 1.25rem;
                    background: rgba(0,0,0,0.3);
                    border-radius: 8px;
                    margin: 1.5rem 0;
                    border: 1px dashed var(--color-border);
                }
                .preview-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.25rem;
                }
                .preview-item.highlight {
                    background: rgba(211, 16, 39, 0.05);
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                }
                .preview-arrow {
                    font-size: 1.5rem;
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

export default PlayerAdvanceModal;
