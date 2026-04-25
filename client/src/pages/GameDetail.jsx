import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { ChevronLeft, Clock, MapPin, Users, Send, Settings, Lock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/AvatarDisplay';
import SkillBadge from '../components/SkillBadge';

const SPORT_ICON = { 'Beach Volleyball': '🏐', 'Footvolley': '⚽' };

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get(`/games/${id}`)
      .then(res => {
        setGame(res.data.game);
        setMessages(res.data.game.chat_messages || []);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!game?.can_chat) return;

    const socket = io('/', { withCredentials: true });
    socketRef.current = socket;
    socket.emit('join_game_room', { gameId: id });
    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.disconnect();
  }, [id, game?.can_chat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.post(`/games/${id}/join`);
      setGame(prev => ({ ...prev, my_request_status: 'pending' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not join');
    } finally {
      setJoining(false);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!msgInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { gameId: id, message: msgInput.trim() });
    setMsgInput('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">Loading…</div>;
  }
  if (!game) return null;

  const isHost = game.host_id === user.id;
  const isFull = game.slots_remaining <= 0;
  const isPast = new Date(game.game_date) < new Date();
  const isCancelled = game.status === 'cancelled';

  const joinButtonLabel = () => {
    if (isCancelled) return 'Game cancelled';
    if (isPast) return 'Game over';
    if (game.my_request_status === 'approved') return 'You\'re in!';
    if (game.my_request_status === 'pending') return 'Request pending…';
    if (game.my_request_status === 'declined') return 'Request declined';
    if (isFull) return 'Game is full';
    return 'Request to join';
  };

  const canJoin = !isHost && !game.my_request_status && !isFull && !isPast && !isCancelled;

  return (
    <div className="h-full overflow-y-auto">
      {/* Back nav */}
      <div className="flex items-center gap-3 p-4 sticky top-0 bg-white border-b border-slate-100 z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">
          {SPORT_ICON[game.sport]} {game.sport} · {game.format}
        </h1>
        {isHost && (
          <button onClick={() => navigate(`/host/${id}`)} className="ml-auto p-1.5 rounded-xl bg-slate-100 text-slate-600">
            <Settings size={18} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Status banners */}
        {isCancelled && (
          <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm font-medium text-center">Game cancelled</div>
        )}

        {/* Info card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SkillBadge level={game.skill_level} />
            <span className="text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{game.format}</span>
            {game.status === 'full' && (
              <span className="text-sm bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Full</span>
            )}
          </div>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-brand-500 shrink-0" />
              <span>{format(new Date(game.game_date), 'EEEE, MMMM d · h:mm a')}</span>
              {game.duration_hours && <span className="text-slate-400">({game.duration_hours}h)</span>}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-brand-500 shrink-0" />
              <span>{game.location_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-brand-500 shrink-0" />
              <span>
                {game.approved_count} / {game.max_players} players
                {!isFull && <span className="text-green-600 ml-1">· {game.slots_remaining} slot{game.slots_remaining !== 1 ? 's' : ''} left</span>}
              </span>
            </div>
          </div>

          {game.notes && (
            <div className="bg-slate-50 rounded-xl p-2.5 text-sm text-slate-600 italic">
              "{game.notes}"
            </div>
          )}
        </div>

        {/* Map thumbnail */}
        {game.lat && game.lng && (
          <div className="h-36 rounded-2xl overflow-hidden border border-slate-100">
            <MapContainer
              center={[parseFloat(game.lat), parseFloat(game.lng)]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[parseFloat(game.lat), parseFloat(game.lng)]} />
            </MapContainer>
          </div>
        )}

        {/* Host */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Host</p>
          <div className="flex items-center gap-3">
            <AvatarDisplay seed={game.host_avatar} name={game.host_name} size="md" />
            <div>
              <p className="font-semibold text-slate-800">{game.host_name}</p>
              {game.host_skill && <SkillBadge level={game.host_skill} small />}
            </div>
            {isHost && <span className="ml-auto text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">You</span>}
          </div>
        </div>

        {/* Roster */}
        {game.roster?.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Roster</p>
            <div className="flex gap-2 flex-wrap">
              {game.roster.map(player => (
                <div key={player.id} className="flex flex-col items-center gap-1">
                  <AvatarDisplay seed={player.avatar_seed} name={player.display_name} size="sm" />
                  <span className="text-xs text-slate-500 max-w-[52px] truncate text-center">{player.display_name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join button */}
        {!isHost && (
          <button
            onClick={canJoin ? handleJoin : undefined}
            disabled={!canJoin || joining}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${
              game.my_request_status === 'approved'
                ? 'bg-green-500 text-white'
                : game.my_request_status === 'pending'
                ? 'bg-yellow-100 text-yellow-700 cursor-default'
                : game.my_request_status === 'declined'
                ? 'bg-red-100 text-red-600 cursor-default'
                : canJoin
                ? 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/25'
                : 'bg-slate-100 text-slate-400 cursor-default'
            }`}
          >
            {joining ? 'Sending request…' : joinButtonLabel()}
          </button>
        )}

        {/* Chat */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Game Chat</p>
            {!game.can_chat && <Lock size={12} className="text-slate-400" />}
          </div>

          {game.can_chat ? (
            <>
              <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">No messages yet. Say hi!</p>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <AvatarDisplay seed={msg.sender_avatar} name={msg.sender_name} size="xs" />
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isMe && <span className="text-xs text-slate-400 mb-0.5 ml-1">{msg.sender_name}</span>}
                          <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                            {msg.message}
                          </div>
                          <span className="text-xs text-slate-400 mt-0.5 mx-1">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-slate-100">
                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  placeholder="Message…"
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  className="p-2.5 bg-brand-500 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="p-6 text-center text-slate-400 text-sm">
              <Lock size={20} className="mx-auto mb-2 text-slate-300" />
              Chat is visible only to approved players
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
