import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from '../components/layout/AppShell';
import { MILESTONES } from '../data/milestones';

export default function Profile() {
  const { completions, settings, updateSettings, earnedMilestones, perfectDays, getLongestActiveStreak } = useApp();
  const [name, setName] = useState(settings.name);
  const [wakeTime, setWakeTime] = useState(settings.wakeUpTime);
  const [saved, setSaved] = useState(false);

  const save = () => {
    updateSettings({ name, wakeUpTime: wakeTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const totalCompletions = completions.length;
  const longestStreak = getLongestActiveStreak();

  return (
    <AppShell>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20, letterSpacing: -0.5 }}>Profile</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: '✅', value: totalCompletions, label: 'Check-offs' },
          { icon: '🔥', value: `${longestStreak}d`, label: 'Best streak' },
          { icon: '⭐', value: perfectDays.length, label: 'Perfect days' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px 10px', textAlign: 'center',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 19 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Badges</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {MILESTONES.map(m => {
            const earned = earnedMilestones.includes(m.id);
            return (
              <div key={m.id} style={{
                textAlign: 'center', padding: '10px 6px',
                borderRadius: 'var(--radius-md)',
                background: earned ? 'var(--color-teal-light)' : 'var(--bg-elevated)',
                border: earned ? '1px solid rgba(29,184,126,0.3)' : '1px solid var(--border)',
                opacity: earned ? 1 : 0.4,
              }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{m.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: earned ? 'var(--color-teal)' : 'var(--text-muted)', lineHeight: 1.3 }}>{m.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Settings</div>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Your name</span>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} />
        </label>
        <label style={{ display: 'block', marginBottom: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Wake-up time</span>
          <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={inp} />
        </label>
        <button onClick={save} style={{
          padding: '9px 18px',
          background: saved ? 'var(--color-teal)' : 'var(--bg-elevated)',
          color: saved ? '#fff' : 'var(--text-primary)',
          borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500,
          border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s',
        }}>
          {saved ? '✓ Saved!' : 'Save settings'}
        </button>
      </div>

      {/* Account */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '14px', marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Account</div>
        
        {user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--color-teal)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 600
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-teal)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Safely synced to cloud
            </div>
            <button onClick={handleLogout} style={{
              padding: '9px 18px', width: '100%',
              background: 'transparent',
              color: 'var(--color-red)',
              borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
              border: '1px solid var(--color-red)', cursor: 'pointer', transition: 'all 0.2s',
            }}>
              Log out
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Sign in to sync your habits across devices, get push notifications, and ensure you never lose your progress.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigate('/login')} style={{
                flex: 1, padding: '10px 0',
                background: 'var(--color-teal)', color: '#fff',
                borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}>
                Log in
              </button>
              <button onClick={() => navigate('/register')} style={{
                flex: 1, padding: '10px 0',
                background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500,
                border: '1px solid var(--border)', cursor: 'pointer',
              }}>
                Create Account
              </button>
            </div>
          </div>
        )}
      </div>

    </AppShell>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)', fontSize: 13,
  background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none',
  fontFamily: 'var(--font)',
};
