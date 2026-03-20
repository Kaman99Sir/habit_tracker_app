export interface Milestone {
  id: string;
  title: string;
  message: string;
  icon: string;
  condition: (stats: { totalCompletions: number; longestStreak: number; perfectWeeks: number; perfectMonths: number; firstCompletion: boolean }) => boolean;
  progressLabel: (stats: { totalCompletions: number; longestStreak: number }) => string;
  nextProgressPercent: (stats: { totalCompletions: number; longestStreak: number }) => number;
  sortOrder: number;
}

export const MILESTONES: Milestone[] = [
  {
    id: 'first_completion',
    title: 'First Step!',
    message: 'You completed your very first habit. Every journey starts here.',
    icon: '🌱',
    condition: ({ firstCompletion }) => firstCompletion,
    progressLabel: ({ totalCompletions }) => `${totalCompletions}/1 completions`,
    nextProgressPercent: ({ totalCompletions }) => Math.min((totalCompletions / 1) * 100, 100),
    sortOrder: 1,
  },
  {
    id: 'streak_3',
    title: '3-Day Streak!',
    message: 'Three days in a row — you\'re building momentum.',
    icon: '🔥',
    condition: ({ longestStreak }) => longestStreak >= 3,
    progressLabel: ({ longestStreak }) => `${longestStreak}/3 days`,
    nextProgressPercent: ({ longestStreak }) => Math.min((longestStreak / 3) * 100, 100),
    sortOrder: 2,
  },
  {
    id: 'streak_7',
    title: 'On Fire!',
    message: 'A full week of consistency. You\'re forming a real habit.',
    icon: '🔥🔥',
    condition: ({ longestStreak }) => longestStreak >= 7,
    progressLabel: ({ longestStreak }) => `${longestStreak}/7 days`,
    nextProgressPercent: ({ longestStreak }) => Math.min((longestStreak / 7) * 100, 100),
    sortOrder: 3,
  },
  {
    id: 'streak_14',
    title: '2-Week Warrior',
    message: '14 days straight. Habits are becoming second nature.',
    icon: '⚡',
    condition: ({ longestStreak }) => longestStreak >= 14,
    progressLabel: ({ longestStreak }) => `${longestStreak}/14 days`,
    nextProgressPercent: ({ longestStreak }) => Math.min((longestStreak / 14) * 100, 100),
    sortOrder: 4,
  },
  {
    id: 'streak_30',
    title: 'Unstoppable',
    message: '30 days! You\'re absolutely unstoppable.',
    icon: '👑',
    condition: ({ longestStreak }) => longestStreak >= 30,
    progressLabel: ({ longestStreak }) => `${longestStreak}/30 days`,
    nextProgressPercent: ({ longestStreak }) => Math.min((longestStreak / 30) * 100, 100),
    sortOrder: 5,
  },
  {
    id: 'completions_100',
    title: '100 Check-offs!',
    message: 'You\'ve completed 100 habits total. That\'s extraordinary.',
    icon: '💯',
    condition: ({ totalCompletions }) => totalCompletions >= 100,
    progressLabel: ({ totalCompletions }) => `${totalCompletions}/100 completions`,
    nextProgressPercent: ({ totalCompletions }) => Math.min((totalCompletions / 100) * 100, 100),
    sortOrder: 6,
  },
  {
    id: 'perfect_week',
    title: 'Perfect Week!',
    message: 'Every single habit completed every day this week. Flawless.',
    icon: '🌟',
    condition: ({ perfectWeeks }) => perfectWeeks >= 1,
    progressLabel: ({ perfectWeeks }) => `${perfectWeeks}/1 perfect week`,
    nextProgressPercent: ({ perfectWeeks }) => Math.min((perfectWeeks / 1) * 100, 100),
    sortOrder: 7,
  },
  {
    id: 'perfect_month',
    title: 'Perfect Month!',
    message: 'A perfect month. You\'re in the top 1% of habit builders.',
    icon: '🏆',
    condition: ({ perfectMonths }) => perfectMonths >= 1,
    progressLabel: ({ perfectMonths }) => `${perfectMonths}/1 perfect month`,
    nextProgressPercent: ({ perfectMonths }) => Math.min((perfectMonths / 1) * 100, 100),
    sortOrder: 8,
  },
];
