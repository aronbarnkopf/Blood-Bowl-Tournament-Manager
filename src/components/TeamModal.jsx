import React, { useState, useEffect } from 'react';
import { X, Shield, Wallet, TrendingUp, Paintbrush, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRaces } from '../hooks/useRaces';

const COLOR_PRESETS = [
    { name: 'Crimson', color: '#D31027' },
    { name: 'Gold', color: '#FFD700' },
    { name: 'Royal', color: '#1e40af' },
    { name: 'Nature', color: '#166534' },
    { name: 'Void', color: '#1a1a1a' },
    { name: 'Chaos', color: '#7c3aed' },
];

const TeamModal = ({ isOpen, onClose, onSave, tournamentId }) => {
    const { races, loading } = useRaces();
    const [formData, setFormData] = useState({
        name: '',
        race: '',
        coach: '',
        treasury: '1,000,000 gold',
        dedicatedFans: 1,
        rating: 1000,
        color: '#D31027',
        icon: ''
    });

    const [previewIcon, setPreviewIcon] = useState('??');

    useEffect(() => {
        if (races.length > 0 && !formData.race) {
            setFormData(prev => ({ ...prev, race: races[0].teamName }));
        }
    }, [races]);

    useEffect(() => {
        if (formData.icon) {
            setPreviewIcon(formData.icon);
        } else if (formData.name) {
            setPreviewIcon(formData.name.substring(0, 2).toUpperCase());
        } else {
            setPreviewIcon('??');
        }
    }, [formData.name, formData.icon]);



    const handleSubmit = (e) => {
        e.preventDefault();
        const finalIcon = formData.icon || formData.name.substring(0, 2).toUpperCase();
        onSave(tournamentId, { ...formData, icon: finalIcon });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} key="team-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="modal-content card thematic-border"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="modal-header">
                            <div className="header-title">
                                <Shield className="text-primary" size={24} />
                                <h2>REGISTER NEW TEAM</h2>
                            </div>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </header>

                        <div className="thematic-banner">
                            <div className="preview-container">
                                <div className="preview-icon shadow-glow" style={{ backgroundColor: formData.color }}>
                                    {previewIcon}
                                </div>
                                <div className="preview-text">
                                    <div className="preview-name">{formData.name || 'TEAM NAME'}</div>
                                    <div className="preview-sub">{formData.race || 'SELECT RACE'} • {formData.coach || 'NO COACH'} • Fans: {formData.dedicatedFans}</div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-sections">
                                <section>
                                    <div className="form-group">
                                        <label>Team Identity</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength="24"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="The Bloodbowl Bastards..."
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Race</label>
                                            <select
                                                value={formData.race}
                                                onChange={e => setFormData({ ...formData, race: e.target.value })}
                                                disabled={loading}
                                            >
                                                {loading ? <option>Loading races...</option> : races.map(r => <option key={r.id} value={r.teamName}>{r.teamName}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Coach</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.coach}
                                                onChange={e => setFormData({ ...formData, coach: e.target.value })}
                                                placeholder="Coach Name"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="form-group">
                                        <label>Visuals & Heraldry</label>
                                        <div className="color-presets">
                                            {COLOR_PRESETS.map(p => (
                                                <button
                                                    key={p.name}
                                                    type="button"
                                                    className={`color-swatch ${formData.color === p.color ? 'active' : ''}`}
                                                    style={{ backgroundColor: p.color }}
                                                    onClick={() => setFormData({ ...formData, color: p.color })}
                                                    title={p.name}
                                                >
                                                    {formData.color === p.color && <Check size={14} />}
                                                </button>
                                            ))}
                                            <div className="color-picker-wrapper">
                                                <Paintbrush size={14} className="picker-icon" />
                                                <input
                                                    type="color"
                                                    className="custom-picker"
                                                    value={formData.color}
                                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label><Wallet size={12} /> Treasury</label>
                                            <input
                                                type="text"
                                                value={formData.treasury}
                                                onChange={e => setFormData({ ...formData, treasury: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label><Users size={12} /> Dedicated Fans</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="6"
                                                value={formData.dedicatedFans}
                                                onChange={e => setFormData({ ...formData, dedicatedFans: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={onClose}>Abandon Contract</button>
                                <button type="submit" className="btn-primary shadow-glow">Sign the Contract</button>
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
                    max-width: 560px;
                    max-height: calc(100vh - 2rem);
                    display: flex;
                    flex-direction: column;
                    padding: 0;
                    overflow: hidden;
                    background: #0a0a0a;
                    border: 1px solid rgba(211, 16, 39, 0.3);
                }
                .thematic-border {
                    box-shadow: 0 0 40px rgba(0,0,0,0.8), 0 0 100px rgba(211, 16, 39, 0.05);
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
                .header-title { display: flex; align-items: center; gap: 0.75rem; }
                .header-title h2 { font-size: 1.1rem; letter-spacing: 0.1em; font-weight: 900; }
                .close-btn { background: none; color: var(--color-text-muted); padding: 0.5rem; }
                .close-btn:hover { color: white; transform: rotate(90deg); transition: transform 0.2s; }

                .thematic-banner {
                    background-color: #121212;
                    padding: 2rem;
                    border-bottom: 1px solid var(--color-border);
                    position: relative;
                    overflow: hidden;
                }
                .thematic-banner::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle at 20% 50%, rgba(211, 16, 39, 0.08), transparent 70%);
                }

                .preview-container {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    position: relative;
                    z-index: 1;
                }
                .preview-icon {
                    width: 64px;
                    height: 64px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: white;
                    border: 2px solid rgba(255,255,255,0.1);
                    transition: var(--transition);
                }
                .shadow-glow { box-shadow: 0 0 20px rgba(0,0,0,0.5); }
                .preview-name { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
                .preview-sub { font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700; margin-top: 0.2rem; }

                .modal-form { 
                    padding: 1.5rem 2rem 2rem; 
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .form-sections { display: flex; flex-direction: column; gap: 1.5rem; }
                
                .form-group { margin-bottom: 1.25rem; }
                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.6rem;
                    letter-spacing: 0.05em;
                }
                .form-group input, .form-group select {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.85rem 1.1rem;
                    border-radius: 8px;
                    font-family: inherit;
                    transition: var(--transition);
                }
                .form-group input:focus { border-color: var(--color-primary); outline: none; background: #222; box-shadow: 0 0 0 4px rgba(211, 16, 39, 0.1); }
                
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

                .color-presets {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .color-swatch {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: var(--transition);
                }
                .color-swatch:hover { transform: scale(1.1); }
                .color-swatch.active { border-color: white; box-shadow: 0 0 10px rgba(255,255,255,0.2); }

                .color-picker-wrapper {
                    position: relative;
                    width: 32px;
                    height: 32px;
                }
                .picker-icon {
                    position: absolute;
                    inset: 0;
                    margin: auto;
                    pointer-events: none;
                    color: var(--color-text-muted);
                    z-index: 1;
                }
                .custom-picker {
                    padding: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 50% !important;
                    overflow: hidden;
                    cursor: pointer;
                }
                .custom-picker::-webkit-color-swatch-wrapper { padding: 0; }
                .custom-picker::-webkit-color-swatch { border: none; }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1.5rem;
                    margin-top: 2.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid var(--color-border);
                }
                .btn-secondary { background: none; color: var(--color-text-muted); font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
                .btn-secondary:hover { color: white; }
                .btn-primary.shadow-glow:hover { box-shadow: 0 0 20px rgba(211, 16, 39, 0.4); }
            `}} />
                </div>
            )
            }
        </AnimatePresence >
    );
};

export default TeamModal;
