import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Settings, Clock, MapPin } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SkillBadge from '../components/SkillBadge';

const SPORT_ICON = { 'Beach Volleyball': '🏐', 'Footvolley': '⚽' };
const STATUS_STYLE = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-600',
};

function GameRow({ game, myStatus, isHosting, navigate, userId }) {
  const isPast = new Date(game.game_date) < new Date();
  return (
    <button
      onClick={() => isHosting ? navigate(`/host/${game.id}`) : navigate(`/games/${game.id}`)}
      className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{SPORT_ICON[game.sport]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{game.format}</span>
            <SkillBadge level={game.skill_level} small />
            {myStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[myStatus] || 'bg-slate-100 text-slate-600'}`}>
                {myStatus}
              </span>
            )}
            {isHosting && (
              <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">Hosting</span>
            )}
            {isPast && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Past</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
            <MapPin size={11} />
            <span className="truncate">{game.location_name}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
            <Clock size={11} />
            {format(new Date(game.game_date), 'EEE, MMM d · h:mm a')}
          </div>
        </div>
        {isHosting && (
          <Settings size={16} className="text-slate-400 shrink-0 mt-0.5" />
        )}
      </div>
    </button>
  );
}

export default function MyGames() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ hosting: [], joined: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    api.get('/games/my/games')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const allGames = [
    ...data.hosting.map(g => ({ ...g, isHosting: true })),
    ...data.joined.map(g => ({ ...g, isHosting: false, myStatus: g.my_status })),
  ].sort((a, b) => new Date(a.game_date) - new Date(b.game_date));

  const upcoming = allGames.filter(g => new Date(g.game_date) >= now && g.status !== 'completed');
  const past = allGames.filter(g => new Date(g.game_date) < now || g.status === 'completed');

  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <h1 className="text-xl font-bold text-slate-800">My Games</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {['upcoming', 'past'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t} {t === 'upcoming' ? `(${upcoming.length})` : `(${past.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-10">Loading…</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-2">🏖️</div>
          <p>{tab === 'upcoming' ? 'No upcoming games. Create or join one!' : 'No past games yet.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(game => (
            <GameRow
              key={`${game.id}-${game.isHosting}`}
              game={game}
              myStatus={game.myStatus}
              isHosting={game.isHosting}
              navigate={navigate}
              userId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
