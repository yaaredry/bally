import { useEffect, useState } from 'react';
import api from '../../api/client';
import SportIcon from '../../components/SportIcon';

function StatCard({ label, value, sub, color = 'text-brand-600' }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`text-3xl font-bold ${color}`}>{value ?? '—'}</div>
      <div className="text-sm font-medium text-slate-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarRow({ label, count, max }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-24 text-slate-600 font-medium truncate shrink-0">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div className="bg-brand-500 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-right text-slate-500 text-xs">{count}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!stats) return <div className="p-8 text-red-500">Failed to load stats</div>;

  const gamesByStatus = Object.fromEntries(stats.games.by_status.map(r => [r.status, parseInt(r.count)]));
  const maxPlayers = Math.max(...stats.users.by_level.map(r => parseInt(r.count)), 1);
  const maxGames = Math.max(...stats.locations.popular.map(r => parseInt(r.count)), 1);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.users.total} />
        <StatCard label="Active (30d)" value={stats.users.active_last_30d} color="text-green-600" />
        <StatCard label="Games (7d)" value={stats.games.last_7_days} color="text-accent-500" />
        <StatCard label="Games (30d)" value={stats.games.last_30_days} color="text-purple-600" />
      </div>

      {/* Game status + approval rate */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open games"      value={gamesByStatus.open || 0} color="text-green-600" />
        <StatCard label="Full games"      value={gamesByStatus.full || 0} color="text-yellow-600" />
        <StatCard label="Completed"       value={gamesByStatus.completed || 0} color="text-brand-600" />
        <StatCard label="Approval rate"   value={`${stats.requests.approval_rate}%`}
                  sub={`${stats.requests.approved} / ${stats.requests.total} requests`} color="text-teal-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Level distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Players by Level</h2>
          <div className="space-y-2.5">
            {stats.users.by_level.map(row => (
              <BarRow key={row.skill_level} label={row.skill_level} count={parseInt(row.count)} max={maxPlayers} />
            ))}
          </div>
        </div>

        {/* Popular locations */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Most Popular Beaches</h2>
          <div className="space-y-2.5">
            {stats.locations.popular.map(row => (
              <BarRow key={row.location_name} label={row.location_name} count={parseInt(row.count)} max={maxGames} />
            ))}
          </div>
        </div>
      </div>

      {/* Sport breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Users by Sport</h2>
        <div className="flex gap-6">
          {stats.users.by_sport.map(row => (
            <div key={row.sport} className="text-center">
              <div className="text-2xl font-bold text-brand-600">{row.count}</div>
              <div className="text-sm text-slate-600 mt-0.5">
                <SportIcon sport={row.sport} size={16} className="mr-1" />{row.sport === 'Beach Volleyball' ? 'Volleyball' : row.sport}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top active players */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Most Active Players</h2>
        <div className="space-y-2">
          {stats.players.top_active.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <div className="text-xs text-slate-400 w-5 text-right">{i + 1}</div>
              <div className="flex-1 text-sm font-medium text-slate-800">{p.display_name}</div>
              <div className="text-xs text-slate-500">{p.games_hosted} hosted · {p.games_played} played</div>
              <div className="text-xs font-bold text-brand-600">{p.total_activity} total</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
