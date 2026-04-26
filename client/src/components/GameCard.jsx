import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Clock, Users } from 'lucide-react';
import SkillBadge from './SkillBadge';
import AvatarDisplay from './AvatarDisplay';
import SportIcon from './SportIcon';

export default function GameCard({ game }) {
  const navigate = useNavigate();

  const slotsLeft = game.slots_remaining ?? (game.max_players - (game.approved_count ?? 0));
  const isFull = slotsLeft <= 0;

  return (
    <button
      onClick={() => navigate(`/games/${game.id}`)}
      className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="leading-none mt-0.5"><SportIcon sport={game.sport} size={28} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{game.format}</span>
            <SkillBadge level={game.skill_level} small />
            {isFull && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Full</span>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{game.location_name}</span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {format(new Date(game.game_date), 'EEE MMM d, h:mm a')}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${isFull ? 'text-danger' : 'text-coral'}`}>
              <Users size={13} />
              {isFull ? 'Full' : `${slotsLeft} left`}
            </div>
          </div>

          {game.host_name && (
            <div className="flex items-center gap-1.5 mt-2">
              <AvatarDisplay seed={game.host_avatar} name={game.host_name} size="xs" />
              <span className="text-xs text-slate-400">{game.host_name}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
