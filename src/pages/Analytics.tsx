import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { getStreak } from '../utils/habits';
import { CATEGORIES } from '../data/categories';

type Range = 'week' | 'month' | 'all';

export default function Analytics() {
  const { habits, completions } = useApp();
  const [range, setRange] = useState<Range>('week');

  const activeHabits = habits.filter(h => !h.archived);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const getDays = () => {
    const lengths = { week: 7, month: 30, all: 60 };
    const n = lengths[range];
    return Array.from({ length: n }, (_, i) => {
      const d = subDays(today, n - 1 - i);
      return { label: n === 7 ? format(d, 'EEE') : format(d, 'd'), date: format(d, 'yyyy-MM-dd') };
    });
  };

  const days = getDays();
  const barData = days.map(({ label, date }) => ({
    label,
    date,
    completed: completions.filter(c => c.date === date && activeHabits.some(h => h.id === c.habitId)).length,
    target: activeHabits.length,
    isToday: date === todayStr,
  }));

  const totalThisRange = barData.reduce((s, d) => s + d.completed, 0);
  const bestDayBar = barData.reduce((best, d) => d.completed > best.completed ? d : best, barData[0] ?? { completed: 0, label: '—' });
  const overallStreak = activeHabits.length > 0 ? Math.max(...activeHabits.map(h => getStreak(h.id, completions)), 0) : 0;
  const sevenPlusStreaks = activeHabits.filter(h => getStreak(h.id, completions) >= 7).length;

  const catData = CATEGORIES.map(cat => {
    const catHabits = activeHabits.filter(h => h.category === cat.id);
    const catCompletions = completions.filter(c => catHabits.some(h => h.id === c.habitId) && barData.some(d => d.date === c.date)).length;
    const possible = catHabits.length * days.length;
    return { ...cat, count: catHabits.length, completions: catCompletions, possible, pct: possible > 0 ? Math.round((catCompletions / possible) * 100) : 0 };
  }).filter(c => c.count > 0);

  const leaderboard = activeHabits
    .map(h => {
      const streak = getStreak(h.id, completions);
      const spark = Array.from({ length: 14 }, (_, i) => {
        const date = format(subDays(today, 13 - i), 'yyyy-MM-dd');
        return { i, v: completions.some(c => c.habitId === h.id && c.date === date) ? 1 : 0 };
      });
      return { ...h, streak, spark };
    })
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const RANGES: { label: string; value: Range }[] = [
    { label: 'This week', value: 'week' },
    { label: 'This month', value: 'month' },
    { label: 'All time', value: 'all' },
  ];

  return (
    <AppShell>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 18, letterSpacing: -0.5 }}>Progress</h1>

      {/* Range switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-elevated)', padding: 3, borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
        {RANGES.map(r => (
          <button key={r.value} onClick={() => setRange(r.value)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: range === r.value ? 'var(--color-teal)' : 'transparent',
            color: range === r.value ? '#fff' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <Card>
        <SectionLabel>Habits completed vs. target</SectionLabel>
        <div style={{ height: 130, marginTop: 8, marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={2} barSize={range === 'week' ? 18 : 5} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={range === 'week' ? 0 : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="target" fill="var(--bg-elevated)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" radius={[3, 3, 0, 0]}>
                {barData.map((d, i) => (
                  <Cell key={i} fill={d.isToday ? '#1DB87E' : 'rgba(29,184,126,0.55)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Total this week', value: totalThisRange },
            { label: `Best day (${bestDayBar?.label ?? '—'})`, value: `${bestDayBar?.completed ?? 0}/${activeHabits.length}` },
            { label: 'Overall streak', value: `${overallStreak}d` },
            { label: '7d+ streaks', value: sevenPlusStreaks },
          ].map(m => (
            <div key={m.label} style={{
              padding: '10px 8px', textAlign: 'center',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{m.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.3 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* By category */}
      {catData.length > 0 && (
        <Card>
          <SectionLabel>By category</SectionLabel>
          <div style={{ marginTop: 12 }}>
            {catData.map(cat => (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.pct}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${cat.pct}%`,
                    background: cat.color, borderRadius: 99, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <SectionLabel>Streak leaderboard</SectionLabel>
          <div style={{ marginTop: 12 }}>
            {leaderboard.map((h, idx) => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0',
                borderBottom: idx < leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 14, flexShrink: 0 }}>{idx + 1}</span>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: h.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {h.name}
                </div>
                {/* Spark */}
                <div style={{ width: 52, height: 18, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={h.spark} margin={{ top: 1, bottom: 1, left: 0, right: 0 }}>
                      <Line type="monotone" dataKey="v" stroke={h.color} dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: 'var(--color-amber)',
                  display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                }}>
                  🔥 {h.streak}d
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeHabits.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>No data yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Add habits and start checking them off
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', padding: '14px 16px', marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {children}
    </div>
  );
}
