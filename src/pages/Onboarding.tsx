import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../contexts/AppContext';


const CURATED_HABITS = [
  { name: 'Run daily', category: 'health', icon: '🏃', color: '#639922' },
  { name: 'Read 20 pages', category: 'learning', icon: '📖', color: '#378ADD' },
  { name: 'Drink 2L water', category: 'health', icon: '💧', color: '#639922' },
  { name: 'Meditate', category: 'mindfulness', icon: '🧘', color: '#7F77DD' },
  { name: 'Journal', category: 'mindfulness', icon: '📔', color: '#7F77DD' },
  { name: 'Sleep by 10pm', category: 'health', icon: '🌙', color: '#639922' },
  { name: 'No social media', category: 'productivity', icon: '📵', color: '#E07B39' },
  { name: 'Exercise 30 min', category: 'health', icon: '🏋️', color: '#639922' },
  { name: 'Cold shower', category: 'health', icon: '🚿', color: '#639922' },
  { name: 'Learn something', category: 'learning', icon: '🎓', color: '#378ADD' },
  { name: 'Gratitude list', category: 'mindfulness', icon: '🙏', color: '#7F77DD' },
  { name: 'Save money', category: 'finance', icon: '💵', color: '#1D9E75' },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { setOnboardingDone, updateSettings, addHabit } = useApp();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const skip = () => { setOnboardingDone(); navigate('/'); };
  const next = () => { setDir(1); setStep(s => s + 1); };

  const handleFinish = () => {
    updateSettings({ name, wakeUpTime: wakeTime });
    selected.forEach(idx => {
      const h = CURATED_HABITS[idx];
      addHabit({
        name: h.name,
        category: h.category,
        frequency: 'daily',
        specificDays: [],
        timesPerWeek: 7,
        timeOfDay: '',
        customTime: '',
        reminder: false,
        reminderTime: '',
        color: h.color,
        icon: h.icon,
      });
    });
    setOnboardingDone();
    navigate('/');
  };

  const steps = [Step1, Step2, Step3, Step4];
  const StepComponent = steps[step];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 6,
            height: 6,
            borderRadius: 99,
            background: i === step ? 'var(--color-teal)' : 'var(--border)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          >
            <StepComponent
              name={name} setName={setName}
              wakeTime={wakeTime} setWakeTime={setWakeTime}
              selected={selected} setSelected={setSelected}
              onNext={step < 3 ? next : handleFinish}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Skip */}
      <button
        onClick={skip}
        style={{
          marginTop: 24,
          fontSize: 13,
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Skip onboarding
      </button>
    </div>
  );
}

interface StepProps {
  name: string; setName: (v: string) => void;
  wakeTime: string; setWakeTime: (v: string) => void;
  selected: Set<number>; setSelected: (v: Set<number>) => void;
  onNext: () => void;
}

function Step1({ onNext }: StepProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
      <h1 style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-teal)', marginBottom: 8, letterSpacing: -1 }}>
        Habitual
      </h1>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 40 }}>
        Small habits. Big life.
      </p>
      <PrimaryButton onClick={onNext}>Get started</PrimaryButton>
    </div>
  );
}

function Step2({ name, setName, wakeTime, setWakeTime, onNext }: StepProps) {
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Nice to meet you!</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
        Let's personalise your experience.
      </p>
      <label style={{ display: 'block', marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          Your name
        </span>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Alex"
          autoFocus
          style={inputStyle}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 32 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
          I usually wake up at
        </span>
        <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} style={inputStyle} />
      </label>
      <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
    </div>
  );
}

function Step3({ selected, setSelected, onNext }: StepProps) {
  const toggle = (i: number) => {
    const s = new Set(selected);
    s.has(i) ? s.delete(i) : s.add(i);
    setSelected(s);
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Pick your first habits</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 15 }}>
        Choose one or more to get started — you can always add more later.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        {CURATED_HABITS.map((h, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: selected.has(i) ? `2px solid ${h.color}` : '1.5px solid var(--border)',
              background: selected.has(i) ? `${h.color}15` : 'var(--bg-card)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{h.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{h.name}</div>
            <div style={{ fontSize: 11, color: h.color, marginTop: 2, textTransform: 'capitalize' }}>{h.category}</div>
          </button>
        ))}
      </div>
      <PrimaryButton onClick={onNext} disabled={selected.size === 0}>
        {selected.size === 0 ? 'Select at least one' : `Add ${selected.size} habit${selected.size > 1 ? 's' : ''}`}
      </PrimaryButton>
    </div>
  );
}

function Step4({ onNext }: StepProps) {
  const panels = [
    { icon: '✅', title: 'Check it off', desc: 'Tap the circle each day you complete a habit.' },
    { icon: '🔥', title: 'Streak grows', desc: 'Do it consecutive days and watch your streak climb.' },
    { icon: '🏆', title: 'Hit milestones', desc: 'Reach streaks of 3, 7, 14, 30 days to earn badges.' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>How streaks work</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
        It's simple — consistency is everything.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        {panels.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 32 }}>{p.icon}</span>
            <div>
              <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={onNext}>Start tracking</PrimaryButton>
    </div>
  );
}

function PrimaryButton({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '14px',
        background: disabled ? 'var(--bg-secondary)' : 'var(--color-teal)',
        color: disabled ? 'var(--text-muted)' : '#fff',
        borderRadius: 'var(--radius-md)',
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        border: 'none',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--border)',
  fontSize: 15,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  outline: 'none',
};
