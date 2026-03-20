import { motion, AnimatePresence } from 'framer-motion';
import type { Milestone } from '../../data/milestones';

interface Props {
  milestone: Milestone;
  onDismiss: () => void;
}

export default function MilestoneOverlay({ milestone, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, backdropFilter: 'blur(6px)',
        }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.72, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.72, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 280 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)',
            padding: '40px 28px', maxWidth: 320, width: '100%',
            textAlign: 'center', border: '1px solid var(--border-strong)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 0.65, delay: 0.18 }}
            style={{ fontSize: 60, marginBottom: 18 }}
          >
            {milestone.icon}
          </motion.div>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 10, letterSpacing: -0.5 }}>
            {milestone.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 26, lineHeight: 1.6 }}>
            {milestone.message}
          </p>
          <button onClick={onDismiss} style={{
            width: '100%', padding: '12px',
            background: 'var(--color-teal)', color: '#fff',
            borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
            border: 'none', cursor: 'pointer',
          }}>
            Keep going 🚀
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
