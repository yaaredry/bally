import { SKILL_BADGE_COLORS } from '../lib/skillLevels';

export default function SkillBadge({ level, small = false }) {
  const color = SKILL_BADGE_COLORS[level] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`${color} ${small ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'} rounded-full font-medium whitespace-nowrap`}>
      {level}
    </span>
  );
}
