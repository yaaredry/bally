import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, UserMinus, Trash2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/client';

export default function AdminGameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchGame = () => {
    api.get(`/admin/games/${id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGame(); }, [id]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const removePlayer = async (playerId) => {
    await api.delete(`/admin/games/${id}/players/${playerId}`);
    flash('Player removed');
    fetchGame();
  };

  const clearChat = async () => {
    if (!window.confirm('Clear all chat messages?')) return;
    await api.delete(`/admin/games/${id}/chat`);
    flash('Chat cleared');
    fetchGame();
  };

  const cancelGame = async () => {
    if (!window.confirm('Cancel this game?')) return;
    await api.delete(`/admin/games/${id}`);
    flash('Game cancelled');
    fetchGame();
  };

  if (loading) return <div className="p-8 text-slate-400">Loading…</div>;
  if (!data) return <div className="p-8 text-red-500">Game not found</div>;

  const { game, requests, chat } = data;
  const approved = requests.filter(r => r.status === 'approved');
  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/games')} className="p-2 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {game.sport === 'Beach Volleyball' ? '🏐' : '⚽'} {game.format} · {game.skill_level}
          </h1>
          <p className="text-sm text-slate-500">{game.location_name} · {format(new Date(game.game_date), 'EEE MMM d, HH:mm')}</p>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
          game.status === 'open' ? 'bg-green-100 text-green-700' :
          game.status === 'full' ? 'bg-yellow-100 text-yellow-700' :
          game.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-600'
        }`}>{game.status}</span>
      </div>

      {msg && <div className="bg-brand-50 text-brand-700 text-sm rounded-xl p-3">{msg}</div>}

      {/* Game info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-slate-400 text-xs">Host</span><div className="text-slate-700">{game.host_name} <span className="text-slate-400">({game.host_email})</span></div></div>
        <div><span className="text-slate-400 text-xs">Max players</span><div className="text-slate-700">{game.max_players}</div></div>
        <div><span className="text-slate-400 text-xs">Duration</span><div className="text-slate-700">{game.duration_hours}h</div></div>
        <div><span className="text-slate-400 text-xs">Notes</span><div className="text-slate-700">{game.notes || '—'}</div></div>
      </div>

      {/* Roster */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h2 className="font-semibold text-slate-700 mb-3">Approved players ({approved.length})</h2>
        {approved.length === 0 ? <p className="text-slate-400 text-sm">No approved players</p> : (
          <div className="space-y-2">
            {approved.map(r => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-slate-800">{r.display_name}</span>
                  <span className="text-slate-400 ml-2 text-xs">{r.email}</span>
                  <span className="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{r.skill_level}</span>
                </div>
                <button onClick={() => removePlayer(r.player_id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                  <UserMinus size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {pending.length > 0 && (
          <>
            <h2 className="font-semibold text-slate-700 mt-4 mb-2">Pending requests ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm text-slate-500">
                  <div className="flex-1">{r.display_name} <span className="text-xs text-slate-400">({r.email})</span></div>
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">pending</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700">Chat ({chat.length} messages)</h2>
          {chat.length > 0 && (
            <button onClick={clearChat} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium">
              <Trash2 size={13} /> Clear chat
            </button>
          )}
        </div>
        {chat.length === 0 ? <p className="text-slate-400 text-sm">No messages</p> : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {chat.map(m => (
              <div key={m.id} className="text-sm">
                <span className="font-medium text-slate-700">{m.sender_name}: </span>
                <span className="text-slate-600">{m.message}</span>
                <span className="text-xs text-slate-400 ml-2">{format(new Date(m.created_at), 'HH:mm')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      {game.status !== 'cancelled' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
          <h2 className="font-semibold text-red-600 mb-3">Danger zone</h2>
          <button onClick={cancelGame}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100">
            <Ban size={15} /> Cancel game
          </button>
        </div>
      )}
    </div>
  );
}
