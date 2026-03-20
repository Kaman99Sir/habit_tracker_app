import { Router, Response } from 'express';
import { db } from '../db/index';
import { habits, habitSchedules, habitLogs, notificationSettings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateId, todayStr, nowTimeStr } from '../utils';

const router = Router();
router.use(requireAuth);

// --- Sync All Data ---
router.get('/sync', (req: AuthRequest, res: Response) => {
  const allHabits = db.select().from(habits).where(eq(habits.userId, req.userId!)).all();
  const logs = db.select().from(habitLogs).where(eq(habitLogs.userId, req.userId!)).all();
  const settings = db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).get();

  res.json({
    habits: allHabits.map(h => ({
      ...h,
      // The frontend expects specificDays to be an array of numbers, timesPerWeek, etc.
      specificDays: JSON.parse(h.specificDays),
    })),
    completions: logs.map(l => ({ habitId: l.habitId, date: l.date, status: l.status })),
    journalEntries: logs.filter(l => l.note).map(l => ({ habitId: l.habitId, date: l.date, text: l.note })),
    settings: {
      name: '', // We get name from auth.me
      wakeUpTime: settings?.quietHoursEnd || '07:00'
    }
  });
});

// --- List Habits ---
router.get('/', (req: AuthRequest, res: Response) => {
  const result = db.select().from(habits).where(eq(habits.userId, req.userId!)).all();
  
  // Attach schedules
  const allHabits = result.map(h => {
    const schedules = db.select().from(habitSchedules).where(eq(habitSchedules.habitId, h.id)).all();
    return { ...h, schedules };
  });

  return res.json(allHabits);
});

// --- Create Habit ---
router.post('/', (req: AuthRequest, res: Response) => {
  const { title, category, color, icon, frequency, specificDays, timesPerWeek, timeOfDay, reminderBeforeMins } = req.body;
  
  const habitId = generateId();
  db.insert(habits).values({
    id: habitId,
    userId: req.userId!,
    title, category, color, icon, frequency,
    specificDays: JSON.stringify(specificDays || []),
    timesPerWeek: timesPerWeek || 7,
    timeOfDay: timeOfDay || '',
  }).run();

  // If timeOfDay is set, create a schedule
  if (timeOfDay) {
    db.insert(habitSchedules).values({
      id: generateId(),
      habitId,
      timeOfDay,
      daysOfWeek: JSON.stringify(frequency === 'specific' ? specificDays : [0,1,2,3,4,5,6]),
      reminderBeforeMins: reminderBeforeMins || 10,
    }).run();
  }

  const newHabit = db.select().from(habits).where(eq(habits.id, habitId)).get();
  return res.status(201).json(newHabit);
});

// --- Update Habit ---
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updates = req.body;

  db.update(habits).set({ ...updates, updatedAt: new Date().toISOString() })
    .where(and(eq(habits.id, id), eq(habits.userId, req.userId!))).run();
  
  const updated = db.select().from(habits).where(eq(habits.id, id)).get();
  return res.json(updated);
});

// --- Archive Habit ---
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  db.update(habits).set({ status: 'archived', updatedAt: new Date().toISOString() })
    .where(and(eq(habits.id, id), eq(habits.userId, req.userId!))).run();
  return res.json({ ok: true });
});

// --- Hard Delete Habit ---
router.delete('/:id/hard', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, req.userId!))).run();
  return res.json({ ok: true });
});

// --- Logs CRUD ---
router.get('/:id/logs', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const logs = db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, req.userId!))).all();
  return res.json(logs);
});

router.post('/:id/log', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { date, status, note } = req.body;
  const targetDate = date || todayStr();

  const existing = db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, req.userId!), eq(habitLogs.date, targetDate))).get();

  if (existing) {
    // Toggle or update
    if (status === 'uncompleted') {
      db.delete(habitLogs).where(eq(habitLogs.id, existing.id)).run();
      return res.json({ ok: true, deleted: true });
    } else {
      db.update(habitLogs).set({ status: status || existing.status, note: note ?? existing.note })
        .where(eq(habitLogs.id, existing.id)).run();
      const updated = db.select().from(habitLogs).where(eq(habitLogs.id, existing.id)).get();
      return res.json(updated);
    }
  } else {
    // Insert new
    const logId = generateId();
    db.insert(habitLogs).values({
      id: logId,
      habitId: id,
      userId: req.userId!,
      date: targetDate,
      status: status || 'completed',
      note: note || '',
      completedAt: new Date().toISOString(),
    }).run();
    
    const newLog = db.select().from(habitLogs).where(eq(habitLogs.id, logId)).get();
    return res.status(201).json(newLog);
  }
});

export { router as habitsRouter };
