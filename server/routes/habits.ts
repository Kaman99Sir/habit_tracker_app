import { Router, Response } from 'express';
import { db } from '../db/index';
import { habits, habitSchedules, habitLogs, notificationSettings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateId, todayStr, nowTimeStr } from '../utils';

const router = Router();
router.use(requireAuth);

// --- Sync All Data ---
router.get('/sync', async (req: AuthRequest, res: Response) => {
  const allHabits = await db.select().from(habits).where(eq(habits.userId, req.userId!));
  const logs = await db.select().from(habitLogs).where(eq(habitLogs.userId, req.userId!));
  const settings = (await db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).limit(1))[0];

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
router.get('/', async (req: AuthRequest, res: Response) => {
  const result = await db.select().from(habits).where(eq(habits.userId, req.userId!));
  
  // Attach schedules
  const allHabits = await Promise.all(result.map(async h => {
    const schedules = await db.select().from(habitSchedules).where(eq(habitSchedules.habitId, h.id));
    return { ...h, schedules };
  }));

  return res.json(allHabits);
});

// --- Create Habit ---
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, category, color, icon, frequency, specificDays, timesPerWeek, timeOfDay, reminderBeforeMins } = req.body;
  
  const habitId = generateId();
  await db.insert(habits).values({
    id: habitId,
    userId: req.userId!,
    title, category, color, icon, frequency,
    specificDays: JSON.stringify(specificDays || []),
    timesPerWeek: timesPerWeek || 7,
    timeOfDay: timeOfDay || '',
  });

  // If timeOfDay is set, create a schedule
  if (timeOfDay) {
    await db.insert(habitSchedules).values({
      id: generateId(),
      habitId,
      timeOfDay,
      daysOfWeek: JSON.stringify(frequency === 'specific' ? specificDays : [0,1,2,3,4,5,6]),
      reminderBeforeMins: reminderBeforeMins || 10,
    });
  }

  const newHabit = (await db.select().from(habits).where(eq(habits.id, habitId)).limit(1))[0];
  return res.status(201).json(newHabit);
});

// --- Update Habit ---
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const updates = req.body;

  await db.update(habits).set({ ...updates, updatedAt: new Date().toISOString() })
    .where(and(eq(habits.id, id), eq(habits.userId, req.userId!)));
  
  const updated = (await db.select().from(habits).where(eq(habits.id, id)).limit(1))[0];
  return res.json(updated);
});

// --- Archive Habit ---
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await db.update(habits).set({ status: 'archived', updatedAt: new Date().toISOString() })
    .where(and(eq(habits.id, id), eq(habits.userId, req.userId!)));
  return res.json({ ok: true });
});

// --- Hard Delete Habit ---
router.delete('/:id/hard', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, req.userId!)));
  return res.json({ ok: true });
});

// --- Logs CRUD ---
router.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const logs = await db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, req.userId!)));
  return res.json(logs);
});

router.post('/:id/log', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { date, status, note } = req.body;
  const targetDate = date || todayStr();

  const existing = (await db.select().from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.userId, req.userId!), eq(habitLogs.date, targetDate))).limit(1))[0];

  if (existing) {
    // Toggle or update
    if (status === 'uncompleted') {
      await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
      return res.json({ ok: true, deleted: true });
    } else {
      await db.update(habitLogs).set({ status: status || existing.status, note: note ?? existing.note })
        .where(eq(habitLogs.id, existing.id));
      const updated = (await db.select().from(habitLogs).where(eq(habitLogs.id, existing.id)).limit(1))[0];
      return res.json(updated);
    }
  } else {
    // Insert new
    const logId = generateId();
    await db.insert(habitLogs).values({
      id: logId,
      habitId: id,
      userId: req.userId!,
      date: targetDate,
      status: status || 'completed',
      note: note || '',
      completedAt: new Date().toISOString(),
    });
    
    const newLog = (await db.select().from(habitLogs).where(eq(habitLogs.id, logId)).limit(1))[0];
    return res.status(201).json(newLog);
  }
});

export { router as habitsRouter };
