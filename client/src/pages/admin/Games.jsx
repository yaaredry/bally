import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, Ban, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/client';
import SportIcon from '../../components/SportIcon';

function Th({ label, col, sort, onSort, align = 'left' }) {
  const active = sort.key === col;
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-4 py-3 text-${align} text-xs text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 group`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={12} className={active ? 'text-brand-500' : 'text-slate-300 group-hover:text-slate-400'} />
      </span>
    </th>
  );
}

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
  const [sort, setSort] = useState({ key: 'game_date', dir: 'asc' });

  const toggleSort = (key) => setSort(prev => ({
    key,
    dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
  }));

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

  const sorted = [...games].sort((a, b) => {
    const val = x => x[sort.key] ?? '';
    const av = val(a), bv = val(b);
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

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
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <Th label="Game"       col="sport"          sort={sort} onSort={toggleSort} />
                <Th label="Created At" col="created_at"    sort={sort} onSort={toggleSort} />
                <Th label="Date"       col="game_date"     sort={sort} onSort={toggleSort} />
                <Th label="Host"       col="host_name"     sort={sort} onSort={toggleSort} />
                <Th label="Players"    col="approved_count" sort={sort} onSort={toggleSort} align="right" />
                <Th label="Pending"    col="pending_count"  sort={sort} onSort={toggleSort} align="right" />
                <Th label="Status"     col="status"        sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(g => (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">
                      <SportIcon sport={g.sport} size={16} className="mr-1" />{g.format} · {g.skill_level}
                    </div>
                    <div className="text-xs text-slate-400">{g.location_name}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(g.created_at), 'MMM d, yyyy')}</td>
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
