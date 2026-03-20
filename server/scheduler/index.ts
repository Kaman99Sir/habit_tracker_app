import cron from 'node-cron';
import { db } from '../db/index';
import { habits, habitSchedules, habitLogs, notifications, notificationSettings } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { todayStr, nowTimeStr, timeToMins, isQuietHours, generateId } from '../utils';
import { pushToUser } from '../routes/notifications';
import { sendWebPush } from '../services/push';
import { sendEmailNotification } from '../services/email';

export function startScheduler() {
  console.log('⏳ Starting background scheduler (cron: * * * * *)');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    const today = todayStr();
    const now = nowTimeStr();
    const nowMins = timeToMins(now);
    const dayOfWeek = new Date().getDay(); // 0-6 (Sun-Sat)

    console.log(`[CRON] Running check at ${now}`);

    // Get all active schedules and join with habit & user settings
    const activeSchedules = (await db.select({
      schedule: habitSchedules,
      habit: habits,
      settings: notificationSettings,
    })
      .from(habitSchedules)
      .innerJoin(habits, eq(habitSchedules.habitId, habits.id))
      .innerJoin(notificationSettings, eq(habits.userId, notificationSettings.userId))
      .where(and(eq(habitSchedules.isActive, true), eq(habits.status, 'active')))) as any[];

    for (const { schedule, habit, settings } of activeSchedules) {
      // 1. Check if habit is scheduled for today
      const hDays = JSON.parse(schedule.daysOfWeek) as number[];
      if (!hDays.includes(dayOfWeek)) continue; // Not scheduled today

      // 2. Check if already completed today
      const log = (await db.select().from(habitLogs)
        .where(and(
          eq(habitLogs.habitId, habit.id),
          eq(habitLogs.date, today),
          eq(habitLogs.status, 'completed')
        )).limit(1))[0];
      if (log) continue; // Already done

      // 3. Time calculations
      const targetMins = timeToMins(schedule.timeOfDay);
      const diffMins = targetMins - nowMins;

      // 4. Quiet hours check
      const isQuiet = isQuietHours(settings.quietHoursStart || '22:00', settings.quietHoursEnd || '07:00');

      let type: 'upcoming' | 'due_now' | 'escalation' | null = null;
      let message = '';

      // Logic: Pre-reminder
      if (diffMins === schedule.reminderBeforeMins && diffMins > 0) {
        type = 'upcoming';
        message = `${habit.title} starts in ${diffMins} minutes.`;
      } 
      // Logic: Due Now
      else if (diffMins === 0) {
        type = 'due_now';
        message = `Time for: ${habit.title}`;
      } 
      // Logic: Escalation (Missed)
      else if (diffMins === -Math.abs(schedule.escalationAfterMins)) {
        type = 'escalation';
        message = `You missed ${habit.title}. Want to do it now?`;
      }

      if (!type) continue;
      if (isQuiet && type !== 'escalation') continue; // Skip non-critical during quiet hours

      // Dedup check: Ensure we haven't already sent this EXACT type of notification today
      const alreadySent = (await db.select().from(notifications)
        .where(and(
          eq(notifications.habitId, habit.id),
          eq(notifications.type, type),
          gt(notifications.createdAt, sql`(date('now'))`)
        )).limit(1))[0];
      
      if (alreadySent) continue;

      // --- Trigger Notification ---
      const notifId = generateId();
      
      await db.insert(notifications).values({
        id: notifId,
        userId: habit.userId,
        habitId: habit.id,
        type,
        message,
        habitName: habit.title,
        scheduledFor: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        status: 'unread',
      });

      const notifData = (await db.select().from(notifications).where(eq(notifications.id, notifId)).limit(1))[0];

      // Dispatch channels
      if (settings.enableInApp) {
        pushToUser(habit.userId, 'notification', notifData);
      }
      if (settings.enablePush) {
        sendWebPush(habit.userId, 'Habitual Reminder', message, settings);
      }
      if (settings.enableEmail && type === 'escalation') {
        // Only email on escalation to avoid spam
        sendEmailNotification(habit.userId, `Missed Habit: ${habit.title}`, message, settings);
      }
      
      console.log(`[NOTIFY] Sent ${type} to user ${habit.userId} for habit ${habit.title}`);
    }
  });
}
