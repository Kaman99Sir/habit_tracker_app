import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import * as schema from './schema';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'habitual.db');

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// --- Run migrations inline (create tables if not exist) ---
export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email_verified_at TEXT,
      email_verify_token TEXT,
      reset_token TEXT,
      reset_token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'health',
      color TEXT NOT NULL DEFAULT '#1DB87E',
      icon TEXT NOT NULL DEFAULT '✅',
      frequency TEXT NOT NULL DEFAULT 'daily',
      specific_days TEXT NOT NULL DEFAULT '[]',
      times_per_week INTEGER NOT NULL DEFAULT 7,
      time_of_day TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_schedules (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      time_of_day TEXT NOT NULL,
      days_of_week TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
      reminder_before_mins INTEGER NOT NULL DEFAULT 10,
      escalation_after_mins INTEGER NOT NULL DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      completed_at TEXT,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      habit_id TEXT REFERENCES habits(id) ON DELETE SET NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      habit_name TEXT,
      status TEXT NOT NULL DEFAULT 'unread',
      scheduled_for TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notification_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      enable_in_app INTEGER NOT NULL DEFAULT 1,
      enable_email INTEGER NOT NULL DEFAULT 0,
      enable_push INTEGER NOT NULL DEFAULT 0,
      reminder_intensity TEXT NOT NULL DEFAULT 'medium',
      quiet_hours_start TEXT DEFAULT '22:00',
      quiet_hours_end TEXT DEFAULT '07:00',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
    CREATE INDEX IF NOT EXISTS idx_habit_schedules_habit_id ON habit_schedules(habit_id);
  `);
  console.log('✅ Database migrations complete');
}

export { sqlite };
