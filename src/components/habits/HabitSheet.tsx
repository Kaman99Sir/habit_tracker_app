import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';
import type { Habit, FrequencyType } from '../../utils/habits';
import { CATEGORIES } from '../../data/categories';

const ACCENT_COLORS = ['#1DB87E','#5BA3E8','#9B93EA','#E0678E','#E08C2A','#E07B39','#72B32A','#C4569A'];
const EMOJI_GRID = ['✅','🏃','📚','💧','🧘','📔','🌙','🏋️','🚿','🎓','🙏','💰','🎨','💪','⚡','🎯','🎵','🌿','☕','🍎','💻','✏️','🧠','❤️'];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIME_OPTIONS: { label: string; value: Habit['timeOfDay'] }[] = [
  { label: '🌅 Morning', value: 'morning' },
  { label: '☀️ Afternoon', value: 'afternoon' },
  { label: '🌙 Evening', value: 'evening' },
];

interface HabitSheetProps {
  open: boolean;
  onClose: () => void;
  editHabit?: Habit;
}

export default function HabitSheet({ open, onClose, editHabit }: HabitSheetProps) {
  const { addHabit, updateHabit } = useApp();
  const isEdit = !!editHabit;

  const [form, setForm] = useState({
    name: '', category: 'health', frequency: 'daily' as FrequencyType,
    specificDays: [] as number[], timesPerWeek: 3,
    timeOfDay: '' as Habit['timeOfDay'], customTime: '',
    reminder: false, reminderTime: '08:00',
    color: ACCENT_COLORS[0], icon: '✅',
  });

  useEffect(() => {
    if (editHabit) {
      setForm({
        name: editHabit.name, category: editHabit.category, frequency: editHabit.frequency,
        specificDays: editHabit.specificDays, timesPerWeek: editHabit.timesPerWeek,
        timeOfDay: editHabit.timeOfDay, customTime: editHabit.customTime,
        reminder: editHabit.reminder, reminderTime: editHabit.reminderTime,
        color: editHabit.color, icon: editHabit.icon,
      });
    } else {
      setForm({ name: '', category: 'health', frequency: 'daily', specificDays: [], timesPerWeek: 3, timeOfDay: '', customTime: '', reminder: false, reminderTime: '08:00', color: ACCENT_COLORS[0], icon: '✅' });
    }
  }, [editHabit, open]);

  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) setTimeout(() => nameRef.current?.focus(), 300); }, [open]);

  const set = <K extends keyof typeof form>(key: K, val: typeof form[K]) => setForm(f => ({ ...f, [key]: val }));
  const toggleDay = (i: number) => set('specificDays', form.specificDays.includes(i) ? form.specificDays.filter(d => d !== i) : [...form.specificDays, i]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (isEdit && editHabit) updateHabit(editHabit.id, form);
    else addHabit(form);
    onClose();
  };

  const cat = CATEGORIES.find(c => c.id === form.category) ?? CATEGORIES[0];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, backdropFilter: 'blur(2px)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
              background: 'var(--bg-secondary)',
              borderRadius: '18px 18px 0 0',
              maxHeight: '92vh', display: 'flex', flexDirection: 'column',
              border: '1px solid var(--border-strong)',
              borderBottom: 'none',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: 'var(--bg-elevated)', borderRadius: 99, margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 0' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{isEdit ? 'Edit habit' : 'New habit'}</h2>
              <button onClick={onClose} style={{ fontSize: 18, color: 'var(--text-muted)', padding: 4 }}>✕</button>
            </div>

            {/* Live Preview */}
            <div style={{
              margin: '12px 18px 0', padding: '11px 14px',
              borderRadius: 'var(--radius-md)', background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', gap: 10,
              border: `1px solid ${form.color}30`,
            }}>
              <div style={{ width: 3, height: 36, borderRadius: 99, background: form.color, flexShrink: 0 }} />
              <span style={{ fontSize: 20 }}>{form.icon}</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{form.name || 'Habit name'}</div>
                <div style={{ fontSize: 11, color: cat.color, marginTop: 1 }}>{cat.label}</div>
              </div>
            </div>

            {/* Form */}
            <div style={{ overflowY: 'auto', padding: '14px 18px', flex: 1 }}>

              <Field label="Name">
                <input ref={nameRef} type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Read 20 pages" style={inputSt} />
              </Field>

              <Field label="Category">
                <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => set('category', c.id)} style={{
                      padding: '5px 12px', borderRadius: 'var(--radius-full)',
                      border: form.category === c.id ? `1.5px solid ${c.color}` : '1px solid var(--border)',
                      background: form.category === c.id ? `${c.color}18` : 'var(--bg-elevated)',
                      color: form.category === c.id ? c.color : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer',
                    }}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Frequency">
                <div style={{ display: 'flex', gap: 6, marginBottom: form.frequency !== 'daily' ? 10 : 0 }}>
                  {(['daily','specific','times'] as FrequencyType[]).map(f => {
                    const labels = { daily: 'Every day', specific: 'Specific days', times: 'X times/week' };
                    return (
                      <button key={f} onClick={() => set('frequency', f)} style={{
                        flex: 1, padding: '9px 6px',
                        borderRadius: 'var(--radius-md)',
                        border: form.frequency === f ? '1.5px solid var(--color-teal)' : '1px solid var(--border)',
                        background: form.frequency === f ? 'var(--color-teal-light)' : 'var(--bg-elevated)',
                        color: form.frequency === f ? 'var(--color-teal)' : 'var(--text-secondary)',
                        fontSize: 11, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                      }}>
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
                {form.frequency === 'specific' && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    {DAYS.map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)} style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-full)',
                        border: form.specificDays.includes(i) ? '1.5px solid var(--color-teal)' : '1px solid var(--border)',
                        background: form.specificDays.includes(i) ? 'var(--color-teal)' : 'var(--bg-elevated)',
                        color: form.specificDays.includes(i) ? '#fff' : 'var(--text-secondary)',
                        fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      }}>
                        {d[0]}
                      </button>
                    ))}
                  </div>
                )}
                {form.frequency === 'times' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => set('timesPerWeek', Math.max(1, form.timesPerWeek - 1))} style={stepBtn}>–</button>
                    <span style={{ fontWeight: 500, fontSize: 15 }}>{form.timesPerWeek}×/week</span>
                    <button onClick={() => set('timesPerWeek', Math.min(7, form.timesPerWeek + 1))} style={stepBtn}>+</button>
                  </div>
                )}
              </Field>

              <Field label="Time of day (optional)">
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {TIME_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => set('timeOfDay', form.timeOfDay === t.value ? '' : t.value)} style={{
                      padding: '6px 12px', borderRadius: 'var(--radius-full)',
                      border: form.timeOfDay === t.value ? '1.5px solid var(--color-teal)' : '1px solid var(--border)',
                      background: form.timeOfDay === t.value ? 'var(--color-teal-light)' : 'var(--bg-elevated)',
                      color: form.timeOfDay === t.value ? 'var(--color-teal)' : 'var(--text-secondary)',
                      fontSize: 12, cursor: 'pointer',
                    }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Reminder">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => set('reminder', !form.reminder)} style={{
                    width: 42, height: 24, borderRadius: 99,
                    background: form.reminder ? 'var(--color-teal)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)', position: 'relative', cursor: 'pointer',
                  }}>
                    <div style={{
                      position: 'absolute', top: 2, left: form.reminder ? 19 : 2,
                      width: 19, height: 19, borderRadius: 99, background: '#fff',
                      transition: 'left 0.18s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }} />
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {form.reminder ? 'On' : 'Off'}
                  </span>
                  {form.reminder && (
                    <input type="time" value={form.reminderTime} onChange={e => set('reminderTime', e.target.value)}
                      style={{ ...inputSt, width: 'auto', padding: '5px 10px', fontSize: 12 }} />
                  )}
                </div>
              </Field>

              <Field label="Color">
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => set('color', c)} style={{
                      width: 28, height: 28, borderRadius: 'var(--radius-full)', background: c, cursor: 'pointer',
                      border: form.color === c ? '2.5px solid #fff' : '2px solid transparent',
                      outline: form.color === c ? `2px solid ${c}` : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 13,
                    }}>
                      {form.color === c && '✓'}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Icon">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {EMOJI_GRID.map(e => (
                    <button key={e} onClick={() => set('icon', e)} style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                      border: form.icon === e ? '1.5px solid var(--color-teal)' : '1px solid var(--border)',
                      background: form.icon === e ? 'var(--color-teal-light)' : 'var(--bg-elevated)',
                      fontSize: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {e}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Sticky save */}
            <div style={{ padding: '10px 18px 28px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <button onClick={handleSave} disabled={!form.name.trim()} style={{
                width: '100%', padding: '13px',
                background: form.name.trim() ? 'var(--color-teal)' : 'var(--bg-elevated)',
                color: form.name.trim() ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
                cursor: form.name.trim() ? 'pointer' : 'default', border: 'none',
              }}>
                {isEdit ? 'Save changes' : 'Create habit'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)', fontSize: 14,
  background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none',
};

const stepBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 'var(--radius-full)',
  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
  fontSize: 16, cursor: 'pointer', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
