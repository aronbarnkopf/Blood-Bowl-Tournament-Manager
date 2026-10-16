import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== passwordConfirm) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password);
            navigate('/');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is already in use.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak (minimum 6 characters).');
            } else if (err.code === 'auth/operation-not-allowed') {
                setError('Email/password accounts are not enabled. Enable them in the Firebase Console.');
            } else {
                setError('Failed to create an account: ' + (err.message || 'Unknown error'));
            }
        }

        setLoading(false);
    }

    return (
        <div className="auth-container" style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#333' }}>Sign Up</h2>
            {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', marginBottom: '1rem', borderRadius: '4px' }}>{error}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password-confirm" style={{ display: 'block', marginBottom: '0.5rem' }}>Password Confirmation</label>
                    <input
                        type="password"
                        id="password-confirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <button disabled={loading} type="submit" style={{ padding: '0.75rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <UserPlus size={18} /> Sign Up
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                Already have an account? <Link to="/login" style={{ color: '#007bff' }}>Log In</Link>
            </div>
        </div>
    );
}
