import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, X } from 'lucide-react';
import api from '../../api/client';
import SportIcon from '../../components/SportIcon';
import { SKILL_LEVELS_BY_SPORT } from '../../lib/skillLevels';
import { format } from 'date-fns';

const SPORTS = ['Beach Volleyball', 'Footvolley'];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchUser = () => {
    api.get(`/admin/users/${id}`)
      .then(res => {
        setData(res.data);
        setForm({
          display_name: res.data.user.display_name,
          home_beach: res.data.user.home_beach || '',
          sports: res.data.user.sports || [],
          skill_level: res.data.user.skill_level || '',
          is_active: res.data.user.is_active,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUser(); }, [id]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSport = (sport) => {
    const next = form.sports.includes(sport)
      ? form.sports.filter(s => s !== sport)
      : [...form.sports, sport];
    set('sports', next);
    set('skill_level', '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${id}`, form);
      setMsg('Saved');
      setEditing(false);
      fetchUser();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handlePasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMsg('Password must be at least 6 characters');
      setTimeout(() => setMsg(''), 3000);
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/users/${id}/password`, { password: newPassword });
      setNewPassword('');
      setMsg('Password updated');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const toggleActive = async () => {
    await api.put(`/admin/users/${id}`, { is_active: !data.user.is_active });
    fetchUser();
  };

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!data) return <div className="p-8 text-red-500">User not found</div>;

  const { user, games, ratings } = data;
  const avgRating = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : null;

  const selectedSports = SPORTS.filter(s => form.sports.includes(s));

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/users')} className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">{user.display_name}</h1>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {user.is_active ? 'Active' : 'Suspended'}
        </span>
      </div>

      {msg && <div className="bg-brand-50 text-brand-700 text-sm rounded-xl p-3">{msg}</div>}

      {/* Profile edit */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-700">Profile</h2>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600"><X size={16} /></button>
              <button onClick={handleSave} disabled={saving} className="p-1.5 rounded-lg bg-brand-500 text-white"><Check size={16} /></button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs text-brand-600 font-semibold hover:underline">Edit</button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Display name</label>
              <input value={form.display_name} onChange={e => set('display_name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Home beach</label>
              <input value={form.home_beach} onChange={e => set('home_beach', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sports</label>
              <div className="flex gap-2">
                {SPORTS.map(s => (
                  <button key={s} type="button" onClick={() => toggleSport(s)}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-medium transition-all ${form.sports.includes(s) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                    <SportIcon sport={s} size={16} className="mr-1" />{s === 'Beach Volleyball' ? 'Volleyball' : s}
                  </button>
                ))}
              </div>
            </div>
            {selectedSports.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Skill level</label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSports.flatMap(sport => SKILL_LEVELS_BY_SPORT[sport] || []).map(lvl => (
                    <button key={lvl} type="button" onClick={() => set('skill_level', lvl)}
                      className={`py-1 px-2.5 rounded-lg border text-xs font-medium transition-all ${form.skill_level === lvl ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-400 text-xs">Email</span><div className="text-slate-700">{user.email}</div></div>
            <div><span className="text-slate-400 text-xs">Home beach</span><div className="text-slate-700">{user.home_beach || '—'}</div></div>
            <div><span className="text-slate-400 text-xs">Sports</span><div className="text-slate-700">{(user.sports || []).join(', ') || '—'}</div></div>
            <div><span className="text-slate-400 text-xs">Skill level</span><div className="text-slate-700 font-medium">{user.skill_level || '—'}</div></div>
            <div><span className="text-slate-400 text-xs">Games hosted</span><div className="text-slate-700">{user.games_hosted}</div></div>
            <div><span className="text-slate-400 text-xs">Games played</span><div className="text-slate-700">{user.games_played}</div></div>
            <div><span className="text-slate-400 text-xs">Avg rating</span><div className="text-yellow-600 font-medium">{avgRating ? `★ ${avgRating} (${ratings.length})` : '—'}</div></div>
            <div><span className="text-slate-400 text-xs">Joined</span><div className="text-slate-700">{format(new Date(user.created_at), 'MMM d, yyyy')}</div></div>
          </div>
        )}
      </div>

      {/* Suspend / reinstate */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 mb-3">Account status</h2>
        <button
          onClick={toggleActive}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
        >
          {user.is_active ? 'Suspend account' : 'Reinstate account'}
        </button>
      </div>

      {/* Password reset */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 mb-3">Reset password</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={handlePasswordReset}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 disabled:opacity-50"
          >
            Set
          </button>
        </div>
      </div>

      {/* Games */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 mb-3">Game history</h2>
        {games.length === 0 ? <p className="text-slate-400 text-sm">No games</p> : (
          <div className="space-y-2">
            {games.map(g => (
              <div key={g.id} className="flex items-center gap-3 text-sm py-1">
                <span className="text-xs text-slate-400 w-28 shrink-0">{format(new Date(g.game_date), 'MMM d, yyyy')}</span>
                <span className="text-slate-700 flex-1">{g.sport} · {g.format} · {g.location_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${g.role === 'host' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>{g.role}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${g.status === 'completed' ? 'bg-green-100 text-green-700' : g.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{g.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ratings received */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 mb-3">Ratings received</h2>
        {ratings.length === 0 ? <p className="text-slate-400 text-sm">No ratings yet</p> : (
          <div className="space-y-2">
            {ratings.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1">
                <span className="text-yellow-500 font-bold">{'★'.repeat(r.stars)}<span className="text-slate-200">{'★'.repeat(5 - r.stars)}</span></span>
                <span className="text-slate-600 flex-1">from <span className="font-medium">{r.rater_name}</span></span>
                <span className="text-xs text-slate-400">{r.sport} · {format(new Date(r.game_date), 'MMM d')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
