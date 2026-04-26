import { useEffect, useState } from 'react';
import { Trash2, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/client';

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

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState({ key: 'game_date', dir: 'desc' });

  const toggleSort = (key) => setSort(prev => ({
    key,
    dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
  }));

  const fetchRatings = () => {
    api.get('/admin/ratings')
      .then(res => setRatings(res.data.ratings))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRatings(); }, []);

  const sorted = [...ratings].sort((a, b) => {
    const val = x => x[sort.key] ?? '';
    const av = val(a), bv = val(b);
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  const deleteRating = async (id) => {
    if (!window.confirm('Delete this rating?')) return;
    await api.delete(`/admin/ratings/${id}`);
    fetchRatings();
  };

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Ratings</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : ratings.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No ratings yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <Th label="Stars" col="stars"      sort={sort} onSort={toggleSort} />
                <Th label="From"  col="rater_name" sort={sort} onSort={toggleSort} />
                <Th label="To"    col="rated_name" sort={sort} onSort={toggleSort} />
                <Th label="Game"  col="sport"      sort={sort} onSort={toggleSort} />
                <Th label="Date"  col="game_date"  sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="text-yellow-500 font-bold">{'★'.repeat(r.stars)}</span>
                    <span className="text-slate-200">{'★'.repeat(5 - r.stars)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.rater_name}</div>
                    <div className="text-xs text-slate-400">{r.rater_email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.rated_name}</div>
                    <div className="text-xs text-slate-400">{r.rated_email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.sport} · {r.location_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(r.game_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRating(r.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 text-xs text-slate-400">{ratings.length} ratings</div>
    </div>
  );
}
