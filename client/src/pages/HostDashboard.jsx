import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronLeft, Check, X, AlertTriangle, Trophy } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/AvatarDisplay';
import SkillBadge from '../components/SkillBadge';
import SportIcon from '../components/SportIcon';

const GEAR_ITEMS = [
  { id: 'ball',    label: 'Ball',    emoji: null },
  { id: 'lines',   label: 'Lines',   emoji: '📏' },
  { id: 'speaker', label: 'Speaker', emoji: '🔊' },
  { id: 'hose',    label: 'Hose',    emoji: '💧' },
];

export default function HostDashboard() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [requests, setRequests] = useState([]);
  const [gear, setGear] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchData = async () => {
    try {
      const [gameRes, reqRes] = await Promise.all([
        api.get(`/games/${gameId}`),
        api.get(`/games/${gameId}/requests`),
      ]);
      setGame(gameRes.data.game);
      setGear(gameRes.data.game.gear || []);
      setRequests(reqRes.data.requests);
    } catch {
      navigate('/my-games');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [gameId]);

  const handleRequest = async (requestId, status) => {
    setActionLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await api.put(`/games/${gameId}/requests/${requestId}`, { status });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleCancel = async () => {
    try {
      await api.delete(`/games/${gameId}`);
      navigate('/my-games', { replace: true });
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel');
    }
  };

  const handleComplete = async () => {
    try {
      await api.post(`/games/${gameId}/complete`);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not mark as complete');
    }
  };

  const toggleGear = async (item) => {
    const isBringing = gear.some(g => g.item === item && g.player_id === user.id);
    try {
      if (isBringing) {
        await api.delete(`/games/${gameId}/gear/${item}`);
        setGear(prev => prev.filter(g => !(g.item === item && g.player_id === user.id)));
      } else {
        await api.post(`/games/${gameId}/gear`, { item });
        setGear(prev => [...prev, { item, player_id: user.id, display_name: user.display_name, avatar_seed: user.avatar_seed }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading…</div>;
  if (!game) return null;

  const pending = requests.filter(r => r.status === 'pending');
  const approved = requests.filter(r => r.status === 'approved');
  const isCancelled = game.status === 'cancelled';
  const isCompleted = game.status === 'completed';
  const isPast = new Date(game.game_date) < new Date();

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10" style={{ background: '#fbf7ef', borderBottom: '0.5px solid rgba(31,26,20,0.08)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-sand text-ink-70">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-ink">Host Dashboard</h1>
          <p className="text-xs text-ink-55">{game.sport} · {game.format} · {format(new Date(game.game_date), 'MMM d, h:mm a')}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Status */}
        {isCancelled && <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm font-medium text-center">Game cancelled</div>}
        {isCompleted && <div className="bg-green-50 text-green-600 rounded-xl p-3 text-sm font-medium text-center">✓ Game completed</div>}

        {/* Game summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SkillBadge level={game.skill_level} />
                <span className="text-sm text-slate-500">{game.location_name}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{format(new Date(game.game_date), 'EEEE, MMMM d · h:mm a')}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-coral">{approved.length}/{game.max_players}</div>
              <div className="text-xs text-slate-500">players</div>
            </div>
          </div>
        </div>

        {/* Pending requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Pending Requests</h2>
            {pending.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No pending requests</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pending.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3">
                  <AvatarDisplay seed={req.avatar_seed} name={req.display_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{req.display_name}</p>
                    <SkillBadge level={req.skill_level} small />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequest(req.id, 'declined')}
                      disabled={actionLoading[req.id] || isCancelled}
                      className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => handleRequest(req.id, 'approved')}
                      disabled={actionLoading[req.id] || isCancelled || approved.length >= game.max_players}
                      className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-colors"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved roster */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Approved Roster ({approved.length})</h2>
          </div>
          {approved.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No approved players yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {approved.map(req => (
                <div key={req.id} className="flex items-center gap-3 p-3">
                  <AvatarDisplay seed={req.avatar_seed} name={req.display_name} size="sm" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{req.display_name}</p>
                    <SkillBadge level={req.skill_level} small />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gear */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gear</p>
            <div className="grid grid-cols-2 gap-2">
              {GEAR_ITEMS.map(({ id: item, label, emoji }) => {
                const bringers = gear.filter(g => g.item === item);
                const iMBringing = bringers.some(g => g.player_id === user.id);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleGear(item)}
                    className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 text-left transition-all ${
                      iMBringing
                        ? 'border-coral bg-coral-soft'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item === 'ball'
                        ? <SportIcon sport={game.sport} size={24} />
                        : <span className="text-xl">{emoji}</span>}
                      <span className={`text-sm font-semibold ${iMBringing ? 'text-brand-700' : 'text-slate-700'}`}>
                        {label}
                      </span>
                    </div>
                    {bringers.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {bringers.map(g => (
                          <span
                            key={g.player_id}
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              g.player_id === user.id
                                ? 'bg-coral-soft text-coral-deep'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {g.player_id === user.id ? 'You' : g.display_name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Nobody yet</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2">Tap an item to say you'll bring it</p>
          </div>
        )}

        {/* Actions */}
        {!isCancelled && !isCompleted && (
          <div className="space-y-3">
            {(isPast || game.status === 'full') && (
              <button
                onClick={handleComplete}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
              >
                <Trophy size={18} />
                Mark as completed
              </button>
            )}

            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-100 text-red-500 hover:bg-red-50 font-semibold transition-colors"
              >
                <AlertTriangle size={16} />
                Cancel game
              </button>
            ) : (
              <div className="bg-red-50 rounded-2xl p-4 space-y-3">
                <p className="text-sm text-red-700 font-medium text-center">Cancel this game? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm">
                    Keep it
                  </button>
                  <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors">
                    Yes, cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
