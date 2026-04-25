import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Ban } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/client';

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-700',
  full: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchGames = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterSport) params.set('sport', filterSport);
    if (filterStatus) params.set('status', filterStatus);
    setLoading(true);
    api.get(`/admin/games?${params}`)
      .then(res => setGames(res.data.games))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGames(); }, [search, filterSport, filterStatus]);

  const cancelGame = async (id) => {
    await api.delete(`/admin/games/${id}`);
    fetchGames();
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Games</h1>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search location…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select value={filterSport} onChange={e => setFilterSport(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">All sports</option>
          <option value="Beach Volleyball">🏐 Volleyball</option>
          <option value="Footvolley">⚽ Footvolley</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="full">Full</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : games.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No games found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Game</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Host</th>
                <th className="text-right px-4 py-3">Players</th>
                <th className="text-right px-4 py-3">Pending</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {games.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      {g.sport === 'Beach Volleyball' ? '🏐' : '⚽'} {g.format} · {g.skill_level}
                    </div>
                    <div className="text-xs text-slate-400">{g.location_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{format(new Date(g.game_date), 'MMM d, HH:mm')}</td>
                  <td className="px-4 py-3 text-slate-600">{g.host_name}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{g.approved_count}/{g.max_players}</td>
                  <td className="px-4 py-3 text-right">
                    {parseInt(g.pending_count) > 0
                      ? <span className="text-yellow-600 font-medium">{g.pending_count}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status] || ''}`}>{g.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {g.status !== 'cancelled' && g.status !== 'completed' && (
                        <button onClick={() => cancelGame(g.id)} title="Cancel game"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Ban size={15} />
                        </button>
                      )}
                      <button onClick={() => navigate(`/admin/games/${g.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 text-xs text-slate-400">{games.length} games</div>
    </div>
  );
}
