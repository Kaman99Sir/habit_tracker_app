import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiAuth } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await apiAuth.login({ email, password });
      login(user); // Wait for context update
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', paddingTop: '10vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome back</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
        Sign in to sync your habits across devices.
      </p>

      {error && (
        <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: 13, border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inp} placeholder="you@example.com" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inp} placeholder="••••••••" />
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px', background: 'var(--color-teal)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          opacity: loading ? 0.7 : 1
        }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--color-teal)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link><br/><br/>
        <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Skip for now</Link>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
  background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 14, outline: 'none'
};
