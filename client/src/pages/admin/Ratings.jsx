import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/client';

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = () => {
    api.get('/admin/ratings')
      .then(res => setRatings(res.data.ratings))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRatings(); }, []);

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
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Stars</th>
                <th className="text-left px-4 py-3">From</th>
                <th className="text-left px-4 py-3">To</th>
                <th className="text-left px-4 py-3">Game</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ratings.map(r => (
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
