import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import type { Habit } from '../../utils/habits';
import { getStreak, getLast7Days } from '../../utils/habits';
import { getCategoryById } from '../../data/categories';

interface HabitRowProps {
  habit: Habit;
  completed: boolean;
  onEdit: (h: Habit) => void;
}

export default function HabitRow({ habit, completed, onEdit }: HabitRowProps) {
  const navigate = useNavigate();
  const { toggleCompletion, completions, archiveHabit } = useApp();
  const streak = getStreak(habit.id, completions);
  const cat = getCategoryById(habit.category);
  const last7 = getLast7Days();

  const [animating, setAnimating] = useState(false);
  const [showPlus, setShowPlus] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCheck = () => {
    if (animating) return;
    if (!completed) {
      setAnimating(true);
      setShowPlus(true);
      setTimeout(() => setShowPlus(false), 700);
      setTimeout(() => setAnimating(false), 600);
    }
    toggleCompletion(habit.id);
  };

  const handleLongPressStart = () => {
    longPressTimer.current = setTimeout(() => setShowMenu(true), 500);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
      onMouseDown={handleLongPressStart}
      onMouseUp={handleLongPressEnd}
    >
      <motion.div
        layout
        style={{
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '11px 12px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          opacity: completed ? 0.6 : 1,
          transition: 'opacity 0.25s ease',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Left accent bar */}
        <div style={{
          width: 3, height: 36, borderRadius: 99,
          background: habit.color, flexShrink: 0,
        }} />

        {/* Circular checkbox */}
        <button
          onClick={e => { e.stopPropagation(); handleCheck(); }}
          style={{ width: 26, height: 26, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative' }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            {/* Outer ring */}
            <circle cx="13" cy="13" r="11" stroke={completed ? habit.color : 'var(--border-strong)'} strokeWidth="1.5" fill={completed ? habit.color : 'transparent'} />
            {/* Fill animation */}
            {completed && (
              <motion.circle
                cx="13" cy="13" r="11"
                fill={habit.color}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25 }}
              />
            )}
            {/* Checkmark */}
            {completed && (
              <motion.path
                d="M8 13l3.5 3.5L18 9"
                stroke="white" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              />
            )}
          </svg>
        </button>

        {/* Name & category */}
        <div
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => navigate(`/habit/${habit.id}`)}
        >
          <div style={{
            fontWeight: 500, fontSize: 14, lineHeight: 1.2,
            color: completed ? 'var(--text-secondary)' : 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {habit.name}
          </div>
          <div style={{ fontSize: 11, color: cat.color, marginTop: 2, fontWeight: 400 }}>
            {cat.label}
          </div>
        </div>

        {/* Streak badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)',
            padding: '3px 8px',
            fontSize: 12, fontWeight: 500,
            color: streak > 0 ? 'var(--color-amber)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            {streak}d
          </div>
          <AnimatePresence>
            {showPlus && (
              <motion.div
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -18, scale: 1.1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  position: 'absolute', top: -14, right: 0,
                  fontSize: 11, fontWeight: 700, color: 'var(--color-amber)',
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}
              >
                +1
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 7-day mini heatmap */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {last7.map(date => {
            const done = completions.some(c => c.habitId === habit.id && c.date === date);
            return (
              <div key={date} style={{
                width: 8, height: 8, borderRadius: 2,
                background: done ? habit.color : 'var(--bg-elevated)',
                border: done ? 'none' : '1px solid var(--border)',
              }} />
            );
          })}
        </div>

        {/* Desktop hover actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', gap: 4, flexShrink: 0 }}
            >
              {[
                { label: '✏️', title: 'Edit', onClick: (e: React.MouseEvent) => { e.stopPropagation(); onEdit(habit); } },
                { label: '📁', title: 'Archive', onClick: (e: React.MouseEvent) => { e.stopPropagation(); archiveHabit(habit.id); } },
                { label: '→', title: 'History', onClick: (e: React.MouseEvent) => { e.stopPropagation(); navigate(`/habit/${habit.id}`); } },
              ].map(a => (
                <button key={a.label} onClick={a.onClick} title={a.title} style={{
                  width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', fontSize: 12, cursor: 'pointer',
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Long-press quick menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            style={{
              position: 'absolute', right: 8, top: '110%',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
              zIndex: 50, overflow: 'hidden', minWidth: 140,
            }}
          >
            {[
              { label: '✏️  Edit', onClick: () => { setShowMenu(false); onEdit(habit); } },
              { label: '📁  Archive', onClick: () => { setShowMenu(false); archiveHabit(habit.id); } },
              { label: '📈  View history', onClick: () => { setShowMenu(false); navigate(`/habit/${habit.id}`); } },
            ].map(item => (
              <button key={item.label} onClick={item.onClick} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', fontSize: 13,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--border)', color: 'var(--text-primary)',
              }}>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
