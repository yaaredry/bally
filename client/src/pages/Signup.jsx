import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';
import AvatarDisplay from '../components/AvatarDisplay';

const G_DUSK = 'linear-gradient(160deg, #ffd9a8 0%, #e87a4a 45%, #6b3b6b 100%)';
const G_CORAL_CTA = 'linear-gradient(180deg, #ee8856 0%, #d85e3a 100%)';

const SPORTS = ['Beach Volleyball', 'Footvolley'];
const SPORT_LABEL = { 'Beach Volleyball': 'Beach Volley', 'Footvolley': 'Footvolley' };

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
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSport = (sport) => {
    const next = form.sports.includes(sport)
      ? form.sports.filter(s => s !== sport)
      : [...form.sports, sport];
    set('sports', next);
    set('skill_level', '');
  };

  const selectedSports = SPORTS.filter(s => form.sports.includes(s));

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

  const step1Valid = form.display_name.trim() && form.email.trim() && form.password.length >= 6;
  const step2Valid = form.sports.length > 0 && form.skill_level;

  return (
    <div style={{ minHeight: '100%', background: '#fbf7ef', overflowX: 'hidden' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 220, background: G_DUSK, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)',
          width: 72, height: 72, borderRadius: 36,
          background: 'radial-gradient(circle at 35% 30%, #fff5d8, #f5d99b 60%, #f5b765)',
          boxShadow: '0 0 80px rgba(255,220,150,0.55)',
        }} />
        <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 40, lineHeight: 1, letterSpacing: -2, fontWeight: 700 }}>Bally</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, fontWeight: 500 }}>Beach volley · Footvolley</div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        margin: '-24px 16px 32px',
        background: 'linear-gradient(180deg, #ffffff 0%, #fbf6eb 100%)',
        borderRadius: 28,
        padding: '24px 20px',
        boxShadow: '0 20px 60px rgba(31,26,20,0.16), 0 4px 12px rgba(31,26,20,0.06)',
        border: '1px solid rgba(31,26,20,0.08)',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? '#e87a4a' : 'rgba(31,26,20,0.12)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ background: '#fbe2d2', color: '#c8425a', fontSize: 13, borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Step 1 — Account */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1f1a14', letterSpacing: -0.5, marginBottom: 18 }}>
              Create your account
            </div>
            <FieldShell label="Display name">
              <input
                type="text"
                value={form.display_name}
                onChange={e => set('display_name', e.target.value)}
                placeholder="How should we call you?"
                style={inputStyle}
              />
            </FieldShell>
            <div style={{ height: 10 }} />
            <FieldShell label="Email">
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </FieldShell>
            <div style={{ height: 10 }} />
            <FieldShell label="Password">
              <input
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="At least 6 characters"
                style={inputStyle}
              />
            </FieldShell>
            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              style={{
                marginTop: 18, width: '100%', padding: '15px 0',
                background: step1Valid ? G_CORAL_CTA : 'rgba(31,26,20,0.12)',
                borderRadius: 14, border: 'none', cursor: step1Valid ? 'pointer' : 'not-allowed',
                color: step1Valid ? '#fff' : 'rgba(31,26,20,0.35)',
                fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
                boxShadow: step1Valid ? '0 8px 22px rgba(216,89,59,0.32)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              Next
            </button>
            <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: 'rgba(31,26,20,0.55)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#e87a4a', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
            </div>
          </div>
        )}

        {/* Step 2 — Sport + Skill */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1f1a14', letterSpacing: -0.5, marginBottom: 18 }}>
              Your game
            </div>

            <div style={{ fontSize: 12, color: 'rgba(31,26,20,0.55)', fontWeight: 500, marginBottom: 8 }}>SPORT</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {SPORTS.map(sport => {
                const active = form.sports.includes(sport);
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(232,122,74,0.12)' : '#f6f1e8',
                      color: active ? '#c8425a' : 'rgba(31,26,20,0.70)',
                      fontWeight: 600, fontSize: 14, letterSpacing: -0.1,
                      outline: active ? '1.5px solid rgba(232,122,74,0.5)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {SPORT_LABEL[sport]}
                  </button>
                );
              })}
            </div>

            {selectedSports.map(sport => (
              <div key={sport} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(31,26,20,0.55)', fontWeight: 500, marginBottom: 8 }}>
                  {selectedSports.length > 1 ? `SKILL LEVEL — ${sport.toUpperCase()}` : 'SKILL LEVEL'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SKILL_LEVELS_BY_SPORT[sport].map(lvl => {
                    const active = form.skill_level === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => set('skill_level', lvl)}
                        style={{
                          padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                          background: active ? 'rgba(232,122,74,0.12)' : '#f6f1e8',
                          color: active ? '#c8425a' : 'rgba(31,26,20,0.70)',
                          fontWeight: 600, fontSize: 14,
                          outline: active ? '1.5px solid rgba(232,122,74,0.5)' : 'none',
                          transition: 'all 0.15s',
                        }}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(31,26,20,0.55)', fontWeight: 500, marginBottom: 8 }}>HOME BEACH (optional)</div>
              <FieldShell label="">
                <input
                  type="text"
                  value={form.home_beach}
                  onChange={e => set('home_beach', e.target.value)}
                  placeholder="e.g. Gordon Beach"
                  style={{ ...inputStyle, marginTop: 0 }}
                />
              </FieldShell>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={backBtnStyle}
              >
                Back
              </button>
              <button
                type="button"
                disabled={!step2Valid}
                onClick={() => setStep(3)}
                style={{
                  flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
                  cursor: step2Valid ? 'pointer' : 'not-allowed',
                  background: step2Valid ? G_CORAL_CTA : 'rgba(31,26,20,0.12)',
                  color: step2Valid ? '#fff' : 'rgba(31,26,20,0.35)',
                  fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
                  boxShadow: step2Valid ? '0 8px 22px rgba(216,89,59,0.32)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1f1a14', letterSpacing: -0.5, marginBottom: 18 }}>
              Looking good
            </div>

            {/* Preview card */}
            <div style={{
              background: '#f6f1e8', borderRadius: 18, padding: '18px 16px',
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
            }}>
              <AvatarDisplay name={form.display_name} size="lg" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1f1a14', letterSpacing: -0.3 }}>
                  {form.display_name}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(31,26,20,0.55)', marginTop: 2 }}>
                  {form.sports.join(' · ')}
                </div>
                {form.skill_level && (
                  <div style={{ fontSize: 13, color: 'rgba(31,26,20,0.55)', marginTop: 1 }}>
                    Level {form.skill_level}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={backBtnStyle}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? 'rgba(31,26,20,0.12)' : G_CORAL_CTA,
                  color: loading ? 'rgba(31,26,20,0.35)' : '#fff',
                  fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
                  boxShadow: loading ? 'none' : '0 8px 22px rgba(216,89,59,0.32)',
                  transition: 'all 0.15s',
                }}
              >
                {loading ? 'Creating account…' : "Let's play!"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'none', border: 'none', outline: 'none',
  fontSize: 15, color: '#1f1a14', letterSpacing: -0.1, marginTop: 2,
};

const backBtnStyle = {
  flex: 1, padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
  background: 'rgba(31,26,20,0.08)', color: 'rgba(31,26,20,0.70)',
  fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
};

function FieldShell({ label, children }) {
  return (
    <div style={{ background: '#f6f1e8', borderRadius: 14, padding: '10px 14px' }}>
      {label && <div style={{ fontSize: 11, color: 'rgba(31,26,20,0.55)', fontWeight: 500 }}>{label}</div>}
      {children}
    </div>
  );
}
