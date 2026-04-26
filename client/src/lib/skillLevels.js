export const SKILL_LEVELS_BY_SPORT = {
  'Beach Volleyball': ['1', '2', '3', '4', '5', '6', '7'],
  'Footvolley':       ['E', 'D', 'C', 'B', 'A', 'League'],
  'Teqball':          ['E', 'D', 'C', 'B', 'A', 'League'],
};

// Tailwind classes per level (lowest → highest within each sport)
export const SKILL_BADGE_COLORS = {
  // Beach Volleyball  1=lowest, 7=highest
  '1':      'bg-slate-100 text-slate-600',
  '2':      'bg-green-100 text-green-700',
  '3':      'bg-teal-100 text-teal-700',
  '4':      'bg-blue-100 text-blue-700',
  '5':      'bg-yellow-100 text-yellow-700',
  '6':      'bg-orange-100 text-orange-700',
  '7':      'bg-purple-100 text-purple-700',
  // Footvolley  E=lowest, League=highest
  'E':      'bg-slate-100 text-slate-600',
  'D':      'bg-green-100 text-green-700',
  'C':      'bg-blue-100 text-blue-700',
  'B':      'bg-yellow-100 text-yellow-700',
  'A':      'bg-orange-100 text-orange-700',
  'League': 'bg-purple-100 text-purple-700',
  // Game-level option
  'All welcome': 'bg-slate-100 text-slate-500',
};

// Hex colors for map pins
export const SKILL_HEX = {
  '1': '#64748b', '2': '#16a34a', '3': '#0d9488',
  '4': '#2563eb', '5': '#ca8a04', '6': '#ea580c', '7': '#9333ea',
  'E': '#64748b', 'D': '#16a34a', 'C': '#2563eb',
  'B': '#ca8a04', 'A': '#ea580c', 'League': '#9333ea',
  'All welcome': '#94a3b8',
};

/** Returns skill levels for a given sport selection (array of sport strings). */
export function getSkillLevelsForSports(sports) {
  if (!sports?.length) return [];
  const sets = sports.map(s => SKILL_LEVELS_BY_SPORT[s] || []);
  // Deduplicate while preserving order
  return [...new Set(sets.flat())];
}
