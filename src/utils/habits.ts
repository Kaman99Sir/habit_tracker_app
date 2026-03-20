import { format, subDays, parseISO, startOfDay } from 'date-fns';

export type FrequencyType = 'daily' | 'specific' | 'times';

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: FrequencyType;
  specificDays: number[]; // 0=Mon..6=Sun
  timesPerWeek: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'custom' | '';
  customTime: string;
  reminder: boolean;
  reminderTime: string;
  color: string;
  icon: string;
  createdAt: string;
  archived: boolean;
}

export interface Completion {
  habitId: string;
  date: string; // YYYY-MM-DD
  note?: string;
}

export interface JournalEntry {
  habitId: string;
  date: string;
  text: string;
}

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export function getStreak(habitId: string, completions: Completion[]): number {
  const habCompletions = new Set(
    completions.filter(c => c.habitId === habitId).map(c => c.date)
  );
  let streak = 0;
  let checkDate = new Date();
  // If today not done yet, start from yesterday for streak purposes
  // But include today if done
  if (!habCompletions.has(format(checkDate, 'yyyy-MM-dd'))) {
    checkDate = subDays(checkDate, 1);
  }
  while (habCompletions.has(format(checkDate, 'yyyy-MM-dd'))) {
    streak++;
    checkDate = subDays(checkDate, 1);
  }
  return streak;
}

export function getBestStreak(habitId: string, completions: Completion[]): number {
  const dates = completions
    .filter(c => c.habitId === habitId)
    .map(c => c.date)
    .sort();

  if (dates.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = startOfDay(parseISO(dates[i - 1]));
    const curr = startOfDay(parseISO(dates[i]));
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diff > 1) {
      current = 1;
    }
  }
  return best;
}

export function getMonthCompletions(habitId: string, completions: Completion[], year: number, month: number): number {
  return completions.filter(c => {
    if (c.habitId !== habitId) return false;
    const d = parseISO(c.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export function getCompletionRate(habitId: string, habit: Habit, completions: Completion[], year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let scheduledDays = 0;
  let completedDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (d > new Date()) break;
    const isScheduled = isHabitScheduledOnDate(habit, d);
    if (isScheduled) {
      scheduledDays++;
      const dateStr = format(d, 'yyyy-MM-dd');
      if (completions.some(c => c.habitId === habitId && c.date === dateStr)) {
        completedDays++;
      }
    }
  }

  return scheduledDays === 0 ? 0 : Math.round((completedDays / scheduledDays) * 100);
}

export function isHabitScheduledOnDate(habit: Habit, date: Date): boolean {
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'specific') {
    const dow = date.getDay(); // 0=Sun..6=Sat
    const mapped = dow === 0 ? 6 : dow - 1; // convert to Mon=0..Sun=6
    return habit.specificDays.includes(mapped);
  }
  // 'times' — approximate as daily for simplicity
  return true;
}

export function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
  );
}
