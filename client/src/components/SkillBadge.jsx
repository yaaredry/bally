const SKILL_COLORS = {
  'Beginner':     'bg-green-100 text-green-700',
  'Intermediate': 'bg-blue-100 text-blue-700',
  'Advanced':     'bg-orange-100 text-orange-700',
  'Elite':        'bg-purple-100 text-purple-700',
  'All welcome':  'bg-slate-100 text-slate-600',
};

export default function SkillBadge({ level, small = false }) {
  const color = SKILL_COLORS[level] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`${color} ${small ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'} rounded-full font-medium whitespace-nowrap`}>
      {level}
    </span>
  );
}
