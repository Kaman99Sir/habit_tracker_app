import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiAuth } from '../api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', padding: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, color: 'var(--text-primary)' }}>Invalid Link</h1>
        <p style={{ color: 'var(--text-secondary)' }}>This password reset link is invalid or has expired.</p>
        <button onClick={() => navigate('/forgot-password')} style={{
          marginTop: 16, padding: '10px 20px', background: 'var(--color-teal)', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer'
        }}>Request New Link</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);
    setError('');
    try {
      await apiAuth.resetPassword(token, password);
      navigate('/login?reset=success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Set New Password</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        {error && <div style={{ color: 'var(--color-red)', fontSize: 14 }}>{error}</div>}
        
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', outline: 'none'
            }}
            required
            minLength={6}
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
          {loading ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
