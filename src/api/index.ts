import type { Habit, HabitLog, HabitSchedule } from '../../server/db/schema';
export type { Habit, HabitLog, HabitSchedule };

const API_BASE = '/api';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'API Request failed');
  }

  return res.json();
}

// --- Auth ---
export const apiAuth = {
  me: () => fetcher<{ user: { id: string; name: string; email: string } }>('/auth/me'),
  logout: () => fetcher<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  login: (data: any) => fetcher<{ user: any }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetcher<{ user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (token: string) => fetcher<{ ok: true }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  forgotPassword: (email: string) => fetcher<{ ok: true }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => fetcher<{ ok: true }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// --- Habits ---
export type HabitWithSchedules = Habit & { schedules: HabitSchedule[] };

export const apiHabits = {
  sync: () => fetcher<any>('/habits/sync'),
  list: () => fetcher<HabitWithSchedules[]>('/habits'),
  create: (data: Partial<Habit & HabitSchedule>) => fetcher<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Habit>) => fetcher<Habit>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archive: (id: string) => fetcher<{ ok: true }>(`/habits/${id}`, { method: 'DELETE' }),
  delete: (id: string) => fetcher<{ ok: true }>(`/habits/${id}/hard`, { method: 'DELETE' }),
  
  // Logs
  getLogs: (id: string) => fetcher<HabitLog[]>(`/habits/${id}/logs`),
  toggleLog: (id: string, date: string, status?: string, note?: string) => fetcher<HabitLog | { ok: true, deleted: true }>(`/habits/${id}/log`, { 
    method: 'POST', body: JSON.stringify({ date, status, note }) 
  }),
};

// --- Notifications ---
export const apiNotifications = {
  list: () => fetcher<any[]>('/notifications'),
  markRead: (id: string) => fetcher<{ ok: boolean }>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'read' }) }),
  getSettings: () => fetcher<any>('/notifications/settings'),
  updateSettings: (data: any) => fetcher<any>('/notifications/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  subscribePush: (sub: any) => fetcher<{ ok: boolean }>('/notifications/push-subscribe', { method: 'POST', body: JSON.stringify(sub) }),
};
