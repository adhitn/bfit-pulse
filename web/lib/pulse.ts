export const AREAS = ['overall', 'cardio', 'machines', 'weights'] as const;
export type Area = typeof AREAS[number];
export type Report = { id: string; area: Area; level: number; source: 'student' | 'staff'; createdAt: number };
export const TTL = 30 * 60 * 1000;
export const LEVELS = [
  { name: 'Quiet', score: 20, hint: 'Plenty of room to move', color: 'green' },
  { name: 'Moderate', score: 50, hint: 'A little energy. Still room for you.', color: 'amber' },
  { name: 'Busy', score: 75, hint: 'Expect to share equipment', color: 'orange' },
  { name: 'Packed', score: 95, hint: 'Consider a quieter time', color: 'red' },
];
