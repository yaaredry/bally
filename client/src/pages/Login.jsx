import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function BeachBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky → ocean → sand gradient */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(175deg, #0c4a6e 0%, #0369a1 25%, #0ea5e9 50%, #38bdf8 65%, #f59e0b 80%, #d97706 90%, #92400e 100%)',
      }} />

      {/* Sun glow */}
      <div className="absolute rounded-full" style={{
        width: 180, height: 180,
        top: '12%', left: '50%', transform: 'translateX(-50%)',
        background: 'radial-gradient(circle, rgba(253,224,71,0.55) 0%, rgba(251,191,36,0.2) 50%, transparent 75%)',
        filter: 'blur(8px)',
      }} />

      {/* Ocean shimmer */}
      <div className="absolute" style={{
        bottom: '28%', left: 0, right: 0, height: 80,
        background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
      }} />

      {/* SVG volleyball net */}
      <svg className="absolute" style={{ bottom: '26%', left: '50%', transform: 'translateX(-50%)', opacity: 0.18 }}
        width="380" height="90" viewBox="0 0 380 90">
        {/* Poles */}
        <rect x="4"   y="0" width="6" height="90" fill="white" rx="3" />
        <rect x="370" y="0" width="6" height="90" fill="white" rx="3" />
        {/* Top cable */}
        <line x1="7" y1="3" x2="373" y2="3" stroke="white" strokeWidth="2.5" />
        {/* Vertical net lines */}
        {Array.from({ length: 19 }, (_, i) => (
          <line key={i} x1={7 + (i + 1) * 19} y1="3" x2={7 + (i + 1) * 19} y2="88" stroke="white" strokeWidth="1.2" />
        ))}
        {/* Horizontal net lines */}
        {[22, 42, 62, 82].map(y => (
          <line key={y} x1="7" y1={y} x2="373" y2={y} stroke="white" strokeWidth="1.2" />
        ))}
      </svg>

      {/* Sand */}
      <div className="absolute bottom-0 left-0 right-0" style={{
        height: '27%',
        background: 'linear-gradient(180deg, #d97706 0%, #b45309 40%, #92400e 100%)',
      }} />
      {/* Sand texture waves */}
      <svg className="absolute" style={{ bottom: '22%', left: 0, width: '100%', opacity: 0.15 }}
        viewBox="0 0 400 20" preserveAspectRatio="none" height="20">
        <path d="M0,10 Q50,0 100,10 T200,10 T300,10 T400,10 L400,20 L0,20Z" fill="white" />
      </svg>

      {/* Floating sport icons */}
      <img src="/icons/volleyball-ball.jpg" alt="" aria-hidden="true"
        style={{ position:'absolute', width:90, height:90, top:'8%', left:'8%',
          opacity:0.22, borderRadius:'50%', transform:'rotate(-15deg)', filter:'blur(1px)' }} />
      <img src="/icons/volleyball-ball.jpg" alt="" aria-hidden="true"
        style={{ position:'absolute', width:44, height:44, top:'38%', right:'6%',
          opacity:0.18, borderRadius:'50%', transform:'rotate(20deg)', filter:'blur(1.5px)' }} />
      <img src="/icons/footvolley-ball.png" alt="" aria-hidden="true"
        style={{ position:'absolute', width:70, height:70, top:'14%', right:'10%',
          opacity:0.25, borderRadius:'50%', transform:'rotate(10deg)', filter:'blur(1px)' }} />
      <img src="/icons/footvolley-ball.png" alt="" aria-hidden="true"
        style={{ position:'absolute', width:38, height:38, top:'55%', left:'5%',
          opacity:0.18, borderRadius:'50%', transform:'rotate(-8deg)', filter:'blur(1.5px)' }} />
      <img src="/icons/teqball-table.png" alt="" aria-hidden="true"
        style={{ position:'absolute', width:80, height:80, bottom:'30%', right:'8%',
          opacity:0.2, transform:'rotate(6deg)', filter:'blur(1px)' }} />
      <img src="/icons/teqball-table.png" alt="" aria-hidden="true"
        style={{ position:'absolute', width:48, height:48, top:'30%', left:'12%',
          opacity:0.15, transform:'rotate(-12deg)', filter:'blur(1.5px)' }} />
    </div>
  );
}

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
    <div className="relative min-h-full flex flex-col items-center justify-center p-6">
      <BeachBackground />

      <div className="relative w-full max-w-sm z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/icons/volleyball-ball.jpg" alt="Volleyball" className="w-10 h-10 rounded-full object-contain shadow-lg" />
            <img src="/icons/footvolley-ball.png" alt="Footvolley" className="w-10 h-10 rounded-full object-contain shadow-lg" />
            <img src="/icons/teqball-table.png"   alt="Teqball"    className="w-10 h-10 object-contain shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">Bally</h1>
          <p className="text-white/80 mt-1 text-sm font-medium drop-shadow">Find your game on the beach</p>
        </div>

        {/* Card — frosted glass */}
        <div className="rounded-3xl p-6 shadow-2xl" style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.5)',
        }}>
          <h2 className="text-xl font-bold text-slate-800 mb-5">Welcome back</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            No account?{' '}
            <Link to="/signup" className="text-brand-600 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

