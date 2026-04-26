import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import AvatarDisplay from '../components/AvatarDisplay';
import SkillBadge from '../components/SkillBadge';
import SportIcon from '../components/SportIcon';

import { SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';

const SPORTS = ['Beach Volleyball', 'Footvolley', 'Teqball'];
const SPORT_LABEL = { 'Beach Volleyball': 'Volleyball', 'Footvolley': 'Footvolley', 'Teqball': 'Teqball' };

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    display_name: user.display_name,
    home_beach: user.home_beach || '',
    sports: user.sports || [],
    skill_level: user.skill_level || '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleSport = (sport) => {
    const next = form.sports.includes(sport)
      ? form.sports.filter(s => s !== sport)
      : [...form.sports, sport];
    set('sports', next);
    set('skill_level', '');
  };

  const selectedSports = SPORTS.filter(s => form.sports.includes(s));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/players/me', form);
      updateUser(res.data.player);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-start justify-between mb-4">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl bg-sand text-ink-70"><X size={18} /></button>
              <button onClick={handleSave} disabled={saving} style={{ padding: 8, borderRadius: 12, border: 'none', background: 'linear-gradient(180deg,#ee8856 0%,#d85e3a 100%)', cursor: 'pointer' }} className="text-white"><Check size={18} /></button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="p-2 rounded-xl bg-sand text-ink-70 ml-auto">
              <Edit2 size={18} />
            </button>
          )}
        </div>

        {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

        {/* Avatar */}
        <div className="flex flex-col items-center mb-4">
          <AvatarDisplay name={user.display_name} size="xl" />
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Display name</label>
              <input
                value={form.display_name}
                onChange={e => set('display_name', e.target.value)}
                className="w-full border border-hairline bg-sand rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Home beach</label>
              <input
                value={form.home_beach}
                onChange={e => set('home_beach', e.target.value)}
                placeholder="e.g. Gordon Beach"
                className="w-full border border-hairline bg-sand rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">{user.display_name}</h2>
            {user.home_beach && <p className="text-ink-55 text-sm mt-0.5">{user.home_beach}</p>}
          </div>
        )}
      </div>

      {/* Sports & Skill */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Sports & Level</h3>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Sports</label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map(sport => (
                  <button key={sport} type="button" onClick={() => toggleSport(sport)}
                    className={`flex-1 min-w-[80px] py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                      form.sports.includes(sport) ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'
                    }`}>
                    <span className="inline-flex items-center gap-1"><SportIcon sport={sport} size={14} />{SPORT_LABEL[sport]}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedSports.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Skill level</label>
                {selectedSports.map(sport => (
                  <div key={sport} className="mb-2">
                    {selectedSports.length > 1 && (
                      <p className="text-xs text-slate-400 mb-1">
                        {sport === 'Beach Volleyball' ? '🏐' : '⚽'} {sport}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {SKILL_LEVELS_BY_SPORT[sport].map(lvl => (
                        <button key={lvl} type="button" onClick={() => set('skill_level', lvl)}
                          className={`py-1.5 px-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                            form.skill_level === lvl ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'
                          }`}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {(user.sports || []).map(s => (
                <span key={s} className="bg-coral-soft text-coral-deep text-sm px-3 py-1 rounded-full font-medium">
                  <span className="inline-flex items-center gap-1"><SportIcon sport={s} size={14} />{SPORT_LABEL[s] || s}</span>
                </span>
              ))}
              {!user.sports?.length && <span className="text-slate-400 text-sm">No sport set</span>}
            </div>
            {user.skill_level && <SkillBadge level={user.skill_level} />}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-coral">{user.games_hosted ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Games hosted</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div className="text-2xl font-bold text-coral">{user.games_played ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Games played</div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 font-semibold transition-colors"
      >
        <LogOut size={18} />
        Log out
      </button>
    </div>
  );
}
