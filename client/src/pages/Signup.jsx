import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarPicker from '../components/AvatarPicker';
import { AVATAR_SEEDS } from '../lib/avatars';

const SPORTS = ['Beach Volleyball', 'Footvolley'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    password: '',
    display_name: '',
    home_beach: '',
    sports: [],
    skill_level: '',
    avatar_seed: AVATAR_SEEDS[0],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSport = (sport) => {
    set('sports', form.sports.includes(sport)
      ? form.sports.filter(s => s !== sport)
      : [...form.sports, sport]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sports.length) { setError('Select at least one sport'); return; }
    if (!form.skill_level) { setError('Select your skill level'); return; }
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-brand-500 to-brand-700">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏐</div>
          <h1 className="text-2xl font-bold text-white">Join Bally</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl">
          {/* Step indicator */}
          <div className="flex gap-1.5 mb-5">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brand-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Account details</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={e => set('display_name', e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <button
                type="button"
                disabled={!form.display_name || !form.email || form.password.length < 6}
                onClick={() => setStep(2)}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Your game</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sport(s)</label>
                <div className="flex gap-2">
                  {SPORTS.map(sport => (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => toggleSport(sport)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.sports.includes(sport)
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {sport === 'Beach Volleyball' ? '🏐 Volleyball' : '⚽ Footvolley'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Skill level</label>
                <div className="grid grid-cols-2 gap-2">
                  {SKILL_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => set('skill_level', lvl)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.skill_level === lvl
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Home beach (optional)</label>
                <input
                  type="text"
                  value={form.home_beach}
                  onChange={e => set('home_beach', e.target.value)}
                  placeholder="e.g. Gordon Beach"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold">Back</button>
                <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Pick your avatar</h2>
              <AvatarPicker selected={form.avatar_seed} onSelect={seed => set('avatar_seed', seed)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold">Back</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold transition-colors"
                >
                  {loading ? 'Creating…' : "Let's play!"}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-slate-500 mt-4">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
