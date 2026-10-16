import React, { useState } from 'react';
import { X, UserPlus, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ShareModal = ({ isOpen, onClose, onShare, tournament }) => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            await onShare(tournament.id, email);
            setStatus('success');
            setEmail('');
            setTimeout(() => {
                setStatus('idle');
                onClose();
            }, 1000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    className="modal-content card thematic-border"
                    onClick={e => e.stopPropagation()}
                    style={{ maxWidth: '400px' }}
                >
                    <header className="modal-header">
                        <div className="header-title">
                            <Users className="text-primary" size={24} />
                            <h2>SHARE TOURNAMENT</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Add User by Email</label>
                            <div className="input-with-icon">
                                <UserPlus size={18} className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="friend@example.com"
                                    required
                                    className="form-input"
                                />
                            </div>
                            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                The user will be able to view and manage this tournament.
                            </p>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={status === 'loading' || status === 'success'}
                            >
                                {status === 'loading' ? 'Sharing...' : status === 'success' ? 'Sent!' : 'Share Access'}
                            </button>
                        </div>
                    </form>

                    {tournament?.adminEmails && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>Current Admins</label>
                            <div className="admin-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {tournament.adminEmails.map(email => (
                                    <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }}></div>
                                        {email}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShareModal;
