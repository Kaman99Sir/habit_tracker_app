export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'health',       label: 'Health',       color: '#639922', icon: '💪' },
  { id: 'learning',     label: 'Learning',     color: '#378ADD', icon: '📚' },
  { id: 'mindfulness',  label: 'Mindfulness',  color: '#7F77DD', icon: '🧘' },
  { id: 'productivity', label: 'Productivity', color: '#E07B39', icon: '⚡' },
  { id: 'social',       label: 'Social',       color: '#D4537E', icon: '🤝' },
  { id: 'finance',      label: 'Finance',      color: '#1D9E75', icon: '💰' },
  { id: 'creative',     label: 'Creative',     color: '#B5548A', icon: '🎨' },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0];
