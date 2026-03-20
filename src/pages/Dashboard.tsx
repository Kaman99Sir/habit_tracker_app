import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';
import { AppShell } from '../components/layout/AppShell';
import HabitRow from '../components/habits/HabitRow';
import HabitSheet from '../components/habits/HabitSheet';
import MilestoneOverlay from '../components/gamification/MilestoneOverlay';
import type { Habit } from '../utils/habits';
import { MILESTONES } from '../data/milestones';

export default function Dashboard() {
  const {
    habits, settings, getTodayCompletionPercent,
    getLongestActiveStreak, isCompletedToday,
    pendingMilestone, dismissMilestone,
    earnedMilestones, completions,
  } = useApp();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | undefined>();
  const [showToast, setShowToast] = useState(false);
  const prevPercent = useRef(0);

  const activeHabits = habits.filter(h => !h.archived);
  const pct = getTodayCompletionPercent();
  const longestStreak = getLongestActiveStreak();
  const totalCompletions = completions.length;
  const todoHabits = activeHabits.filter(h => !isCompletedToday(h.id));
  const doneHabits = activeHabits.filter(h => isCompletedToday(h.id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = settings.name ? `, ${settings.name}` : '';

  useEffect(() => {
    if (pct === 100 && prevPercent.current < 100 && activeHabits.length > 0) {
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.5 }, colors: ['#1DB87E','#E08C2A','#9B93EA','#5BA3E8'] });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }
    prevPercent.current = pct;
  }, [pct, activeHabits.length]);

  const nextMilestone = MILESTONES.find(m => !earnedMilestones.includes(m.id));
  const milestoneData = pendingMilestone ? MILESTONES.find(m => m.id === pendingMilestone) : null;

  const doneCount = doneHabits.length;
  const totalCount = activeHabits.length;

  return (
    <AppShell>
      {milestoneData && <MilestoneOverlay milestone={milestoneData} onDismiss={dismissMilestone} />}

      {/* Perfect day toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -56, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -56, opacity: 0 }}
            style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--color-teal)', color: '#fff',
              padding: '10px 22px', borderRadius: 'var(--radius-full)',
              fontWeight: 500, fontSize: 14, boxShadow: 'var(--shadow-md)',
              zIndex: 500, whiteSpace: 'nowrap',
            }}
          >
            🎉 Perfect day!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>
          {format(new Date(), 'EEEE, d MMMM')}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, letterSpacing: -0.5 }}>
          {greeting}{name}
        </h1>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <DarkPill>
            <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>{doneCount}/{totalCount} done</span>
          </DarkPill>
          {longestStreak > 0 && (
            <DarkPill>
              <span style={{ fontSize: 13 }}>🔥</span>
              <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>{longestStreak}-day streak</span>
            </DarkPill>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: 'var(--color-teal)', borderRadius: 99 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          />
        </div>
      </div>

      {/* Sections */}
      {activeHabits.length === 0 ? (
        <EmptyState onAdd={() => setSheetOpen(true)} />
      ) : (
        <>
          {todoHabits.length > 0 && (
            <Section label="STILL TO DO">
              <AnimatePresence>
                {todoHabits.map(h => (
                  <motion.div key={h.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ marginBottom: 6 }}>
                    <HabitRow habit={h} completed={false} onEdit={h => { setEditHabit(h); setSheetOpen(true); }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Section>
          )}

          {doneHabits.length > 0 && (
            <Section label="COMPLETED">
              <AnimatePresence>
                {doneHabits.map(h => (
                  <motion.div key={h.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }} style={{ marginBottom: 6 }}>
                    <HabitRow habit={h} completed={true} onEdit={h => { setEditHabit(h); setSheetOpen(true); }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Section>
          )}
        </>
      )}

      {/* Add habit */}
      <button
        id="add-habit-btn"
        onClick={() => { setEditHabit(undefined); setSheetOpen(true); }}
        style={{
          width: '100%', padding: '11px', marginTop: 8,
          borderRadius: 'var(--radius-md)',
          border: '1.5px dashed var(--border-strong)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-teal)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-teal)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
        }}
      >
        <span style={{ fontSize: 16 }}>+</span> Add habit
      </button>

      {/* Next milestone */}
      {nextMilestone && (
        <div style={{
          marginTop: 20, padding: '14px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Next milestone
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{nextMilestone.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{nextMilestone.title}</div>
              <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${nextMilestone.nextProgressPercent({ totalCompletions, longestStreak })}%`,
                  background: 'var(--color-teal)', borderRadius: 99, transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <HabitSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editHabit={editHabit} />
    </AppShell>
  );
}

function DarkPill({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)',
      padding: '5px 12px', border: '1px solid var(--border)',
      fontSize: 13,
    }}>
      {children}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🌱</div>
      <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>No habits yet</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Add your first habit to get started
      </div>
      <button onClick={onAdd} style={{
        padding: '10px 22px', background: 'var(--color-teal)', color: '#fff',
        borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
      }}>
        + Add habit
      </button>
    </div>
  );
}
