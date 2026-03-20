import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import NotificationBell from '../notifications/NotificationBell';

const NAV_ITEMS = [
  { to: '/', label: 'Today', icon: '✓' },
  { to: '/analytics', label: 'Progress', icon: '▦' },
  { to: '/calendar', label: 'Calendar', icon: '⬚' },
  { to: '/profile', label: 'Profile', icon: '◎' },
];

// === DESKTOP SIDEBAR ===
export function DesktopSidebar() {
  const { settings, getLongestActiveStreak } = useApp();
  const longestStreak = getLongestActiveStreak();

  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0', position: 'fixed', top: 0, left: 0,
    }}>
      <div style={{ padding: '0 20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-teal)', letterSpacing: -0.5 }}>Habitual</div>
          {settings.name && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {settings.name}
            </div>
          )}
        </div>
        <NotificationBell />
      </div>
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 'var(--radius-md)', fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            color: isActive ? 'var(--color-teal)' : 'var(--text-secondary)',
            background: isActive ? 'var(--color-teal-light)' : 'transparent',
            marginBottom: 2, transition: 'all 0.15s',
          })}>
            <span style={{ fontSize: 14 }}>{item.icon}</span>{item.label}
          </NavLink>
        ))}
      </nav>
      {longestStreak > 0 && (
        <div style={{ margin: '0 10px', padding: '12px', background: 'var(--color-amber-light)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
          <div style={{ color: 'var(--color-amber)', fontWeight: 500, marginBottom: 4 }}>🔥 Best streak</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{longestStreak} days</div>
        </div>
      )}
    </aside>
  );
}

// === TABLET TOP NAV ===
export function TabletTopNav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 52,
      background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-teal)' }}>Habitual</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
            padding: '5px 12px', borderRadius: 'var(--radius-full)',
            fontSize: 13, fontWeight: 500,
            color: isActive ? 'var(--color-teal)' : 'var(--text-secondary)',
            background: isActive ? 'var(--color-teal-light)' : 'transparent',
          })}>
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginLeft: 8 }}><NotificationBell /></div>
      </div>
    </nav>
  );
}

// === MOBILE BOTTOM TABS ===
export function MobileBottomTabs() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 60,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      display: 'flex', zIndex: 200,
    }}>
      {NAV_ITEMS.map(item => (
        <NavLink key={item.to} to={item.to} end={item.to === '/'} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
          fontSize: 11, fontWeight: 500,
          color: isActive ? 'var(--color-teal)' : 'var(--text-muted)',
        })}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

// === BREAKPOINT ===
type Breakpoint = 'mobile' | 'tablet' | 'desktop';
function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    const w = window.innerWidth;
    return w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  });
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return bp;
}

// === APP SHELL ===
export function AppShell({ children }: { children: React.ReactNode }) {
  const bp = useBreakpoint();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {bp === 'desktop' && <DesktopSidebar />}
      <div style={{ flex: 1, marginLeft: bp === 'desktop' ? 220 : 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {bp === 'tablet' && <TabletTopNav />}
        <main style={{
          flex: 1, maxWidth: 720, width: '100%', margin: '0 auto',
          padding: bp === 'mobile' ? '16px 16px 80px' : '20px 24px',
        }}>
          {bp === 'mobile' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-teal)', letterSpacing: -0.5 }}>Habitual</div>
              <NotificationBell />
            </div>
          )}
          {children}
        </main>
        {bp === 'mobile' && <MobileBottomTabs />}
      </div>
    </div>
  );
}
