import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ---- USERS ----
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerifiedAt: text('email_verified_at'),
  emailVerifyToken: text('email_verify_token'),
  resetToken: text('reset_token'),
  resetTokenExpiresAt: text('reset_token_expires_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ---- HABITS ----
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default('health'),
  color: text('color').notNull().default('#1DB87E'),
  icon: text('icon').notNull().default('✅'),
  frequency: text('frequency').notNull().default('daily'), // daily | specific | times
  specificDays: text('specific_days').notNull().default('[]'), // JSON array of day indices
  timesPerWeek: integer('times_per_week').notNull().default(7),
  timeOfDay: text('time_of_day').notNull().default(''),
  status: text('status').notNull().default('active'), // active | paused | archived
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ---- HABIT SCHEDULES ----
export const habitSchedules = sqliteTable('habit_schedules', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  timeOfDay: text('time_of_day').notNull(), // HH:MM format e.g. "07:00"
  daysOfWeek: text('days_of_week').notNull().default('[0,1,2,3,4,5,6]'), // JSON [0=Mon..6=Sun]
  reminderBeforeMins: integer('reminder_before_mins').notNull().default(10),
  escalationAfterMins: integer('escalation_after_mins').notNull().default(60),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ---- HABIT LOGS ----
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id').notNull().references(() => habits.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  status: text('status').notNull().default('completed'), // completed | missed | skipped
  completedAt: text('completed_at'),
  note: text('note').notNull().default(''),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ---- NOTIFICATIONS ----
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  habitId: text('habit_id').references(() => habits.id, { onDelete: 'set null' }),
  type: text('type').notNull(), // upcoming | due_now | missed | milestone | escalation
  message: text('message').notNull(),
  habitName: text('habit_name'),
  status: text('status').notNull().default('unread'), // unread | read | dismissed | acted
  scheduledFor: text('scheduled_for'), // ISO datetime
  sentAt: text('sent_at'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ---- NOTIFICATION SETTINGS ----
export const notificationSettings = sqliteTable('notification_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  enableInApp: integer('enable_in_app', { mode: 'boolean' }).notNull().default(true),
  enableEmail: integer('enable_email', { mode: 'boolean' }).notNull().default(false),
  enablePush: integer('enable_push', { mode: 'boolean' }).notNull().default(false),
  reminderIntensity: text('reminder_intensity').notNull().default('medium'), // low | medium | high
  quietHoursStart: text('quiet_hours_start').default('22:00'),
  quietHoursEnd: text('quiet_hours_end').default('07:00'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ---- PUSH SUBSCRIPTIONS ----
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ---- TYPE EXPORTS ----
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitSchedule = typeof habitSchedules.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
