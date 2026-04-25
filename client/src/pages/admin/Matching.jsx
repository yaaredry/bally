import { useEffect, useState } from 'react';
import api from '../../api/client';
import { getAvatarUrl } from '../../lib/avatars';

const SPORT_COLORS = {
  'Beach Volleyball': 'bg-blue-100 text-blue-700',
  'Footvolley': 'bg-green-100 text-green-700',
};

function DistributionBar({ label, count, max, sports }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  const bvLevels = ['1','2','3','4','5','6','7'];
  const fvLevels = ['E','D','C','B','A','League'];
  const isBV = bvLevels.includes(label);
  const isFV = fvLevels.includes(label);
  const barColor = isBV ? 'bg-brand-500' : isFV ? 'bg-green-500' : 'bg-slate-400';

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-16 text-right shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBV ? 'bg-blue-100 text-blue-700' : isFV ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {label}
        </span>
      </div>
      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
        <div className={`${barColor} h-3 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-6 text-right text-slate-500 text-xs font-medium">{count}</div>
    </div>
  );
}

export default function Matching() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/matching')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load</div>;

  const maxCount = Math.max(...data.distribution.map(r => parseInt(r.count)), 1);

  const bvLevels = ['1','2','3','4','5','6','7'];
  const fvLevels = ['E','D','C','B','A','League'];
  const bvDist = data.distribution.filter(r => bvLevels.includes(r.skill_level));
  const fvDist = data.distribution.filter(r => fvLevels.includes(r.skill_level));

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Player Matching</h1>

      {/* Level Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            🏐 Beach Volleyball levels
          </h2>
          <div className="space-y-2.5">
            {bvDist.length === 0 && <p className="text-slate-400 text-sm">No data</p>}
            {bvDist.map(row => (
              <DistributionBar key={row.skill_level} label={row.skill_level} count={parseInt(row.count)} max={maxCount} />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            ⚽ Footvolley levels
          </h2>
          <div className="space-y-2.5">
            {fvDist.length === 0 && <p className="text-slate-400 text-sm">No data</p>}
            {fvDist.map(row => (
              <DistributionBar key={row.skill_level} label={row.skill_level} count={parseInt(row.count)} max={maxCount} />
            ))}
          </div>
        </div>
      </div>

      {/* Match Suggestions */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Suggested matches — same level, never played
          </h2>
          <span className="text-xs text-slate-400">{data.suggestions.length} pairs</span>
        </div>

        {data.suggestions.length === 0 ? (
          <p className="text-slate-400 text-sm">All same-level players have already played together!</p>
        ) : (
          <div className="space-y-3">
            {data.suggestions.map((pair, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                {/* Player A */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <img
                    src={getAvatarUrl(pair.avatar_a)}
                    alt=""
                    className="w-9 h-9 rounded-full bg-slate-200 shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{pair.name_a}</div>
                    <div className="flex gap-1 flex-wrap">
                      {(pair.sports_a || []).map(s => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded font-medium ${SPORT_COLORS[s] || 'bg-slate-100 text-slate-600'}`}>
                          {s === 'Beach Volleyball' ? '🏐' : '⚽'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Level badge */}
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-xs font-bold bg-brand-100 text-brand-700 px-3 py-1 rounded-full">
                    {pair.skill_level}
                  </span>
                  <span className="text-slate-300 text-xs mt-0.5">same level</span>
                </div>

                {/* Player B */}
                <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                  <img
                    src={getAvatarUrl(pair.avatar_b)}
                    alt=""
                    className="w-9 h-9 rounded-full bg-slate-200 shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="min-w-0 text-right">
                    <div className="text-sm font-medium text-slate-800 truncate">{pair.name_b}</div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(pair.sports_b || []).map(s => (
                        <span key={s} className={`text-xs px-1.5 py-0.5 rounded font-medium ${SPORT_COLORS[s] || 'bg-slate-100 text-slate-600'}`}>
                          {s === 'Beach Volleyball' ? '🏐' : '⚽'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
