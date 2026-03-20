import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Habit, Completion, JournalEntry } from '../utils/habits';
import { todayStr, getStreak, getBestStreak } from '../utils/habits';
import { MILESTONES } from '../data/milestones';
import { useAuth } from './AuthContext';
import { apiHabits, apiNotifications } from '../api';

interface Settings {
  name: string;
  wakeUpTime: string;
}

interface AppState {
  onboardingDone: boolean;
  habits: Habit[];
  completions: Completion[];
  journalEntries: JournalEntry[];
  settings: Settings;
  earnedMilestones: string[];
  pendingMilestone: string | null;
  perfectDays: string[];
}

interface AppContextType extends AppState {
  setOnboardingDone: () => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  archiveHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  toggleCompletion: (habitId: string) => void;
  isCompletedToday: (habitId: string) => boolean;
  addJournalEntry: (habitId: string, date: string, text: string) => void;
  getJournalEntries: (habitId: string) => JournalEntry[];
  dismissMilestone: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  getTodayCompletionPercent: () => number;
  getLongestActiveStreak: () => number;
}

const AppContext = createContext<AppContextType | null>(null);

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_STATE: AppState = {
  onboardingDone: false,
  habits: [],
  completions: [],
  journalEntries: [],
  settings: { name: '', wakeUpTime: '07:00' },
  earnedMilestones: [],
  pendingMilestone: null,
  perfectDays: [],
};

// Map backend to frontend
function mapHabitToFrontend(h: any): Habit {
  return {
    id: h.id,
    name: h.title,
    category: h.category,
    frequency: h.frequency,
    specificDays: h.specificDays || [],
    timesPerWeek: h.timesPerWeek || 7,
    timeOfDay: h.timeOfDay || '',
    customTime: h.timeOfDay || '',
    reminder: !!h.timeOfDay,
    reminderTime: h.timeOfDay || '',
    color: h.color,
    icon: h.icon,
    createdAt: h.createdAt,
    archived: h.status === 'archived'
  };
}

// Map frontend to backend
function mapHabitToBackend(h: Partial<Habit>): any {
  const backend: any = {};
  if (h.name !== undefined) backend.title = h.name;
  if (h.category !== undefined) backend.category = h.category;
  if (h.frequency !== undefined) backend.frequency = h.frequency;
  if (h.specificDays !== undefined) backend.specificDays = h.specificDays;
  if (h.timesPerWeek !== undefined) backend.timesPerWeek = h.timesPerWeek;
  if (h.timeOfDay !== undefined) backend.timeOfDay = h.customTime || h.timeOfDay;
  if (h.color !== undefined) backend.color = h.color;
  if (h.icon !== undefined) backend.icon = h.icon;
  if (h.reminder) {
    backend.timeOfDay = h.reminderTime;
    backend.reminderBeforeMins = 10;
  }
  return backend;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>('habitual_state', DEFAULT_STATE);
  const { user } = useAuth();

  // 1. Server Sync on Auth
  useEffect(() => {
    if (user) {
      apiHabits.sync().then((data) => {
        setState(s => ({
          ...s,
          habits: (data.habits || []).map(mapHabitToFrontend),
          completions: data.completions || [],
          journalEntries: data.journalEntries || [],
          settings: { ...s.settings, ...data.settings },
        }));
      }).catch(err => console.error('Failed to sync from server', err));
    }
  }, [user, setState]);

  const setOnboardingDone = useCallback(() => {
    setState(s => ({ ...s, onboardingDone: true }));
  }, [setState]);

  // 2. Add Habit (Optimistic + Backend)
  const addHabit = useCallback(async (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const tempId = generateId();
    const newHabit = { ...habit, id: tempId, createdAt: new Date().toISOString(), archived: false };
    
    setState(s => ({ ...s, habits: [...s.habits, newHabit] }));

    if (user) {
      try {
        const created = await apiHabits.create(mapHabitToBackend(newHabit));
        setState(s => ({
          ...s,
          habits: s.habits.map(h => h.id === tempId ? mapHabitToFrontend(created) : h),
        }));
      } catch (err) {
        console.error('Failed to create habit remotely', err);
      }
    }
  }, [setState, user]);

  // 3. Update Habit
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    setState(s => ({
      ...s,
      habits: s.habits.map(h => h.id === id ? { ...h, ...updates } : h),
    }));

    if (user) {
      try {
        await apiHabits.update(id, mapHabitToBackend(updates));
      } catch (err) {
        console.error('Failed to update remotely', err);
      }
    }
  }, [setState, user]);

  // 4. Archive Habit
  const archiveHabit = useCallback(async (id: string) => {
    setState(s => ({
      ...s,
      habits: s.habits.map(h => h.id === id ? { ...h, archived: true } : h),
    }));

    if (user) {
      try {
        await apiHabits.archive(id);
      } catch (err) {
        console.error('Failed to archive remotely', err);
      }
    }
  }, [setState, user]);

  const deleteHabit = useCallback(async (id: string) => {
    setState(s => ({
      ...s,
      habits: s.habits.filter(h => h.id !== id),
      completions: s.completions.filter(c => c.habitId !== id),
      journalEntries: s.journalEntries.filter(j => j.habitId !== id),
    }));

    if (user) {
      try {
        await apiHabits.delete(id);
      } catch (err) {
        console.error('Failed to delete remotely', err);
      }
    }
  }, [setState, user]);

  const isCompletedToday = useCallback((habitId: string) => {
    const today = todayStr();
    return state.completions.some(c => c.habitId === habitId && c.date === today);
  }, [state.completions]);

  const checkMilestones = useCallback((completions: Completion[], habits: Habit[], earned: string[]) => {
    const totalCompletions = completions.length;
    const allStreaks = habits.filter(h => !h.archived).map(h => getStreak(h.id, completions));
    const longestStreak = allStreaks.length > 0 ? Math.max(...allStreaks) : 0;
    const bestStreaks = habits.filter(h => !h.archived).map(h => getBestStreak(h.id, completions));
    const bestEver = bestStreaks.length > 0 ? Math.max(...bestStreaks) : 0;

    const stats = {
      totalCompletions,
      longestStreak: Math.max(longestStreak, bestEver),
      perfectWeeks: 0,
      perfectMonths: 0,
      firstCompletion: totalCompletions >= 1,
    };

    for (const m of MILESTONES) {
      if (!earned.includes(m.id) && m.condition(stats)) return m.id;
    }
    return null;
  }, []);

  // 5. Toggle Completion
  const toggleCompletion = useCallback(async (habitId: string) => {
    const today = todayStr();
    
    let nextStatus = 'completed';
    const isCurrentlyDone = state.completions.some(c => c.habitId === habitId && c.date === today);
    if (isCurrentlyDone) nextStatus = 'uncompleted';

    setState(s => {
      const alreadyDone = s.completions.some(c => c.habitId === habitId && c.date === today);
      let newCompletions: Completion[];
      if (alreadyDone) {
        newCompletions = s.completions.filter(c => !(c.habitId === habitId && c.date === today));
      } else {
        newCompletions = [...s.completions, { habitId, date: today }];
      }

      const activeHabits = s.habits.filter(h => !h.archived);
      const allDoneToday = activeHabits.length > 0 &&
        activeHabits.every(h => newCompletions.some(c => c.habitId === h.id && c.date === today));
      const newPerfectDays = allDoneToday && !s.perfectDays.includes(today)
        ? [...s.perfectDays, today]
        : s.perfectDays.filter(d => d !== today || allDoneToday);

      const newMilestone = !alreadyDone ? checkMilestones(newCompletions, s.habits, s.earnedMilestones) : null;
      const newEarned = newMilestone ? [...s.earnedMilestones, newMilestone] : s.earnedMilestones;

      return {
        ...s,
        completions: newCompletions,
        perfectDays: newPerfectDays,
        pendingMilestone: newMilestone ?? s.pendingMilestone,
        earnedMilestones: newEarned,
      };
    });

    if (user) {
      try {
        await apiHabits.toggleLog(habitId, today, nextStatus);
      } catch (err) {
        console.error('Remote toggle fail', err);
      }
    }
  }, [state.completions, setState, checkMilestones, user]);

  const addJournalEntry = useCallback(async (habitId: string, date: string, text: string) => {
    setState(s => {
      const existing = s.journalEntries.findIndex(e => e.habitId === habitId && e.date === date);
      const entries = [...s.journalEntries];
      if (existing >= 0) entries[existing] = { habitId, date, text };
      else entries.push({ habitId, date, text });
      return { ...s, journalEntries: entries };
    });

    if (user) {
      try {
        await apiHabits.toggleLog(habitId, date, undefined, text); 
      } catch (err) {
        console.error("Journal remote save fail", err);
      }
    }
  }, [setState, user]);

  const getJournalEntries = useCallback((habitId: string) => {
    return state.journalEntries
      .filter(e => e.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.journalEntries]);

  const dismissMilestone = useCallback(() => {
    setState(s => ({ ...s, pendingMilestone: null }));
  }, [setState]);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...updates } }));
    
    if (user) {
      try {
        await apiNotifications.updateSettings({
          quietHoursEnd: updates.wakeUpTime
        });
      } catch (err) {}
    }
  }, [setState, user]);

  const getTodayCompletionPercent = useCallback(() => {
    const active = state.habits.filter(h => !h.archived);
    if (active.length === 0) return 0;
    const done = active.filter(h => isCompletedToday(h.id)).length;
    return Math.round((done / active.length) * 100);
  }, [state.habits, isCompletedToday]);

  const getLongestActiveStreak = useCallback(() => {
    const streaks = state.habits
      .filter(h => !h.archived)
      .map(h => getStreak(h.id, state.completions));
    return streaks.length > 0 ? Math.max(...streaks) : 0;
  }, [state.habits, state.completions]);

  const value: AppContextType = {
    ...state,
    setOnboardingDone,
    addHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
    toggleCompletion,
    isCompletedToday,
    addJournalEntry,
    getJournalEntries,
    dismissMilestone,
    updateSettings,
    getTodayCompletionPercent,
    getLongestActiveStreak,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
