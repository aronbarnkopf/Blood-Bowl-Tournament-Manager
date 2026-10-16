import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FORMATS = ['Round Robin', 'Multi Round Robin', 'Swiss', 'Single Elimination', 'Double Elimination'];

const ManagementModal = ({ isOpen, onClose, onSave, tournament }) => {
    const [formData, setFormData] = useState({
        name: '',
        format: 'Round Robin',
        cycles: 2,
        hideFutureRounds: false,
    });

    useEffect(() => {
        if (tournament) {
            setFormData({
                name: tournament.name,
                format: tournament.format,
                cycles: tournament.cycles || 2,
                hideFutureRounds: tournament.hideFutureRounds || false,
            });
        } else {
            setFormData({
                name: '',
                format: 'Round Robin',
                cycles: 2,
                hideFutureRounds: false,
            });
        }
    }, [tournament, isOpen]);



    const handleSubmit = (e) => {
        e.preventDefault();
        // New tournaments always start in "Recruiting"
        const finalData = tournament
            ? { ...tournament, ...formData }
            : { ...formData, status: 'Recruiting' };

        onSave(finalData);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay" onClick={onClose} key="management-overlay">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="modal-content card"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="modal-header">
                            <h2>{tournament ? 'EDIT TOURNAMENT' : 'CREATE NEW TOURNAMENT'}</h2>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </header>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Tournament Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. The Bloodweiser Cup"
                                />
                            </div>

                            <div className="form-group">
                                <label>Format</label>
                                <select
                                    value={formData.format}
                                    onChange={e => setFormData({ ...formData, format: e.target.value })}
                                >
                                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>

                            {formData.format === 'Multi Round Robin' && (
                                <div className="form-group">
                                    <label>Number of Cycles</label>
                                    <input
                                        type="number"
                                        min="2"
                                        max="10"
                                        required
                                        value={formData.cycles}
                                        onChange={e => setFormData({ ...formData, cycles: parseInt(e.target.value) || 2 })}
                                    />
                                    <p className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                        Every team will play every other team {formData.cycles} times.
                                    </p>
                                </div>
                            )}

                            {['Round Robin', 'Multi Round Robin'].includes(formData.format) && (
                                <div className="form-group checkbox-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.hideFutureRounds}
                                            onChange={e => setFormData({ ...formData, hideFutureRounds: e.target.checked })}
                                            style={{ width: 'auto', marginBottom: 0 }}
                                        />
                                        Hide future rounds
                                    </label>
                                    <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginLeft: '1.5rem', textTransform: 'none' }}>
                                        Only the current round and played rounds will be visible on the Home screen.
                                    </p>
                                </div>
                            )}

                            {!tournament && (
                                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                                    * New tournaments start with <strong>Recruiting</strong> status by default.
                                </p>
                            )}

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {tournament ? 'Save Changes' : 'Create Tournament'}
                                </button>
                            </div>
                        </form>
                    </motion.div>

                    <style dangerouslySetInnerHTML={{
                        __html: `
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0,0,0,0.8);
                    backdrop-filter: blur(4px);
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
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .modal-header {
                    flex-shrink: 0;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--color-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-header h2 { font-size: 1.25rem; }
                .close-btn { background: none; color: var(--color-text-muted); }
                .close-btn:hover { color: white; }

                .modal-form { 
                    padding: 1.5rem;
                    overflow-y: auto;
                    scrollbar-width: none; 
                }
                .form-group { margin-bottom: 1.25rem; }
                .form-group label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    margin-bottom: 0.5rem;
                }
                .form-group input, .form-group select {
                    width: 100%;
                    background-color: #1a1a1a;
                    border: 1px solid var(--color-border);
                    color: white;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-family: inherit;
                }
                .form-group input:focus { border-color: var(--color-primary); outline: none; }
                
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .btn-secondary {
                    background-color: transparent;
                    color: var(--color-text-muted);
                    padding: 0.6rem 1.2rem;
                    font-weight: 600;
                }
                .btn-secondary:hover { color: white; }
            `}} />
                </div>
            )
            }
        </AnimatePresence >
    );
};

export default ManagementModal;
