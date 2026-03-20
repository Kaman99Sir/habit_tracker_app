import { randomUUID, randomBytes } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns current time in HH:MM format in local timezone */
export function nowTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Returns date-time string at specified HH:MM on today's date */
export function todayAtTime(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/** Minutes since midnight for a time string "HH:MM" */
export function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Is the current time within quiet hours? */
export function isQuietHours(start: string, end: string): boolean {
  const now = timeToMins(nowTimeStr());
  const s = timeToMins(start);
  const e = timeToMins(end);
  if (s <= e) return now >= s && now <= e;
  // Wraps midnight (e.g. 22:00 – 07:00)
  return now >= s || now <= e;
}
