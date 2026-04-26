import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const G_DUSK = 'linear-gradient(160deg, #ffd9a8 0%, #e87a4a 45%, #6b3b6b 100%)';
const G_CORAL_CTA = 'linear-gradient(180deg, #ee8856 0%, #d85e3a 100%)';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: '#fbf7ef' }}>
      {/* Gradient hero */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 520, background: G_DUSK }}>
        {/* Sun glow disc */}
        <div style={{
          position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)',
          width: 96, height: 96, borderRadius: 48,
          background: 'radial-gradient(circle at 35% 30%, #fff5d8, #f5d99b 60%, #f5b765)',
          boxShadow: '0 0 100px rgba(255,220,150,0.55)',
        }} />
      </div>

      {/* Wordmark */}
      <div style={{ position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 56, lineHeight: 1, letterSpacing: -2.5, fontWeight: 700 }}>Bally</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6, fontWeight: 500, letterSpacing: -0.1 }}>
          Beach volley · Footvolley
        </div>
      </div>

      {/* Glass card */}
      <div style={{
        position: 'absolute', top: 460, left: 16, right: 16,
        background: 'linear-gradient(180deg, #ffffff 0%, #fbf6eb 100%)',
        borderRadius: 28, padding: '26px 22px',
        boxShadow: '0 20px 60px rgba(31,26,20,0.16), 0 4px 12px rgba(31,26,20,0.06)',
        border: '1px solid rgba(31,26,20,0.08)',
      }}>
        <div style={{ fontSize: 26, lineHeight: 1.1, color: '#1f1a14', letterSpacing: -0.8, fontWeight: 600 }}>
          Catch a game<br/>before sundown.
        </div>
        <div style={{ fontSize: 14, color: 'rgba(31,26,20,0.55)', marginTop: 8, lineHeight: 1.4, letterSpacing: -0.1 }}>
          Find pickups on your beach. Host your own. No drama.
        </div>

        {error && (
          <div style={{ marginTop: 14, background: '#fbe2d2', color: '#c8425a', fontSize: 13, borderRadius: 12, padding: '10px 14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
          <FieldShell label="Email">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 15, color: '#1f1a14', letterSpacing: -0.1, marginTop: 2 }}
            />
          </FieldShell>
          <div style={{ height: 10 }} />
          <FieldShell label="Password">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: 15, color: '#1f1a14', letterSpacing: -0.1, marginTop: 2 }}
            />
          </FieldShell>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 18, width: '100%', padding: '15px 0',
              background: loading ? 'rgba(31,26,20,0.15)' : G_CORAL_CTA,
              borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: -0.1,
              boxShadow: loading ? 'none' : '0 8px 22px rgba(216,89,59,0.32)',
            }}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: 'rgba(31,26,20,0.55)' }}>
          New to Bally?{' '}
          <Link to="/signup" style={{ color: '#e87a4a', fontWeight: 600, textDecoration: 'none' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

function FieldShell({ label, children }) {
  return (
    <div style={{ background: '#f6f1e8', borderRadius: 14, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'rgba(31,26,20,0.55)', fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
