import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiAuth } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Email is required');

    setLoading(true);
    setError('');
    try {
      await apiAuth.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Reset Password</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Enter your email and we'll send you a link to reset your password.
      </p>

      {success ? (
        <div style={{ padding: 16, background: 'rgba(79, 209, 197, 0.1)', color: 'var(--color-teal)', borderRadius: 8, marginBottom: 24 }}>
          If an account exists with that email, a password reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ color: 'var(--color-red)', fontSize: 14 }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                color: 'var(--text-primary)', outline: 'none'
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              padding: '12px', background: 'var(--color-teal)', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 15,
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              marginTop: 8
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
        Remember your password? <Link to="/login" style={{ color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
      </div>
    </div>
  );
}
