import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, getDaysInMonth, startOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { getStreak, getBestStreak, getMonthCompletions, getCompletionRate } from '../utils/habits';
import { getCategoryById } from '../data/categories';
import HabitSheet from '../components/habits/HabitSheet';

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, completions, journalEntries, addJournalEntry } = useApp();

  const habit = habits.find(h => h.id === id);
  if (!habit) return (
    <AppShell>
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <div style={{ fontWeight: 500 }}>Habit not found</div>
        <button onClick={() => navigate('/')} style={{ marginTop: 16, color: 'var(--color-teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back</button>
      </div>
    </AppShell>
  );

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [journalText, setJournalText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popover, setPopover] = useState<{ day: number } | null>(null);

  const streak = getStreak(habit.id, completions);
  const best = getBestStreak(habit.id, completions);
  const thisMonthCount = getMonthCompletions(habit.id, completions, year, month);
  const rate = getCompletionRate(habit.id, habit, completions, year, month);
  const cat = getCategoryById(habit.category);

  const entries = journalEntries.filter(e => e.habitId === id).sort((a, b) => b.date.localeCompare(a.date));

  const daysInMonth = getDaysInMonth(new Date(year, month));
  const firstDow = startOfMonth(new Date(year, month)).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    addJournalEntry(habit.id, todayStr, journalText);
    setJournalText('');
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <AppShell>
      {/* Back */}
      <button onClick={() => navigate('/')} style={{
        fontSize: 12, color: 'var(--text-muted)', marginBottom: 14,
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        ← Today
      </button>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: cat.color,
          background: `${cat.color}18`, padding: '3px 10px',
          borderRadius: 'var(--radius-full)', display: 'inline-block', marginBottom: 8,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {cat.label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{habit.name}</h1>
          <button onClick={() => setSheetOpen(true)} style={{
            padding: '5px 14px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)', background: 'var(--bg-elevated)',
            fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)',
          }}>
            Edit
          </button>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
          <span style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>
            {streak}
          </span>
          <span style={{ fontSize: 16, color: 'var(--text-secondary)' }}>day streak</span>
          {streak >= 7 && <span style={{ fontSize: 22 }}>🔥</span>}
        </div>
        {streak === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            💙 Start again today — every streak begins with one day
          </div>
        )}
      </div>

      {/* Calendar heatmap */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: '16px', marginBottom: 14,
      }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, padding: '2px 6px' }}>‹</button>
          <span style={{ fontWeight: 500, fontSize: 14 }}>{format(new Date(year, month), 'MMMM yyyy')}</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, padding: '2px 6px' }}>›</button>
        </div>

        {/* Day labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: offset }).map((_, i) => <div key={`off-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
            const done = completions.some(c => c.habitId === id && c.date === dateStr);
            const isToday = dateStr === todayStr;
            const isFuture = new Date(year, month, day) > now;

            return (
              <div key={day} style={{ position: 'relative' }}>
                <button
                  onClick={() => setPopover(popover?.day === day ? null : { day })}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 5, cursor: 'pointer',
                    background: done ? habit.color : isToday ? 'transparent' : 'var(--bg-elevated)',
                    border: isToday ? `1.5px solid ${habit.color}` : done ? 'none' : '1px solid var(--border)',
                    opacity: isFuture ? 0.2 : done ? 1 : isToday ? 1 : 0.5,
                    transition: 'opacity 0.15s',
                  }}
                />
                <AnimatePresence>
                  {popover?.day === day && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      style={{
                        position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                        borderRadius: 'var(--radius-md)', padding: '8px 12px', minWidth: 130,
                        boxShadow: 'var(--shadow-md)', zIndex: 20, fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: 3 }}>{format(new Date(year, month, day), 'MMM d')}</div>
                      <div style={{ color: done ? 'var(--color-teal)' : 'var(--text-muted)' }}>
                        {done ? '✅ Completed' : '○ Not done'}
                      </div>
                      {entries.find(e => e.date === dateStr)?.text && (
                        <div style={{ marginTop: 5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {entries.find(e => e.date === dateStr)?.text}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
          {[
            { label: 'Done', color: habit.color, dim: false },
            { label: 'Missed', color: 'var(--color-red)', dim: false },
            { label: 'Today', isOutline: true },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 3,
                background: l.isOutline ? 'transparent' : l.color,
                border: l.isOutline ? `1.5px solid ${habit.color}` : 'none',
              }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Current', value: streak },
          { label: 'Best', value: best },
          { label: 'This month', value: thisMonthCount },
          { label: 'Rate', value: `${rate}%` },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 8px', textAlign: 'center',
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Journal */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', padding: '14px', marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Today's note
        </h3>
        <textarea
          value={journalText}
          onChange={e => setJournalText(e.target.value)}
          placeholder="How did this go today?"
          rows={2}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)', fontSize: 13, resize: 'none',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)',
            fontFamily: 'var(--font)', outline: 'none', marginBottom: 8,
          }}
        />
        <button
          onClick={handleSaveJournal}
          disabled={!journalText.trim()}
          style={{
            padding: '7px 16px',
            background: journalText.trim() ? 'var(--color-teal)' : 'var(--bg-elevated)',
            color: journalText.trim() ? '#fff' : 'var(--text-muted)',
            borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 500,
            border: '1px solid var(--border)', cursor: 'pointer',
          }}
        >
          Save note
        </button>

        {entries.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Previous notes
            </div>
            {entries.slice(0, 8).map((e, i) => (
              <div key={i} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: i < entries.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                  {format(parseISO(e.date), 'MMM d')} · {e.text.slice(0, 50)}{e.text.length > 50 ? '…' : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{e.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sheetOpen && <HabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editHabit={habit} />}
    </AppShell>
  );
}
