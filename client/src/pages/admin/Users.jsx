import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, UserCheck, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
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

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sort, setSort] = useState({ key: 'display_name', dir: 'asc' });

  const toggleSort = (key) => setSort(prev => ({
    key,
    dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
  }));

  const fetchUsers = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterSport) params.set('sport', filterSport);
    if (filterActive !== '') params.set('is_active', filterActive);
    setLoading(true);
    api.get(`/admin/users?${params}`)
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [search, filterSport, filterActive]);

  const sorted = [...users].sort((a, b) => {
    const val = x => x[sort.key] ?? '';
    const av = val(a), bv = val(b);
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const toggleActive = async (user) => {
    await api.put(`/admin/users/${user.id}`, { is_active: !user.is_active });
    fetchUsers();
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Users</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <select
          value={filterSport}
          onChange={e => setFilterSport(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">All sports</option>
          <option value="Beach Volleyball">🏐 Volleyball</option>
          <option value="Footvolley">⚽ Footvolley</option>
        </select>
        <select
          value={filterActive}
          onChange={e => setFilterActive(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <Th label="User"   col="display_name"  sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">Sports</th>
                <Th label="Level"  col="skill_level"   sort={sort} onSort={toggleSort} />
                <Th label="Hosted" col="games_hosted"  sort={sort} onSort={toggleSort} align="right" />
                <Th label="Played" col="games_played"  sort={sort} onSort={toggleSort} align="right" />
                <Th label="Rating" col="avg_rating"    sort={sort} onSort={toggleSort} align="right" />
                <Th label="Status" col="is_active"     sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{u.display_name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {(u.sports || []).map(s => <SportIcon key={s} sport={s} size={18} className="mr-1" />)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {u.skill_level || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{u.games_hosted}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{u.games_played}</td>
                  <td className="px-4 py-3 text-right">
                    {u.avg_rating ? (
                      <span className="text-yellow-600 font-medium">★ {u.avg_rating} <span className="text-slate-400 text-xs">({u.rating_count})</span></span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Suspend' : 'Reinstate'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
                        {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/users/${u.id}`)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      >
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

      <div className="mt-3 text-xs text-slate-400">{users.length} users</div>
    </div>
  );
}
