import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Map, { Marker } from 'react-map-gl/maplibre';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { ChevronLeft, Clock, MapPin, Users, Send, Settings, Lock, Share2, Check, LogOut } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AvatarDisplay from '../components/AvatarDisplay';
import SkillBadge from '../components/SkillBadge';
import SportIcon from '../components/SportIcon';

function LeaveConfirmModal({ onConfirm, onCancel, leaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-6">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex flex-col items-center px-6 pt-8 pb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <LogOut size={24} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Leave this game?</h2>
          <p className="text-sm text-slate-500 text-center">
            Your spot will be freed up and the team will be notified.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold text-sm"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            disabled={leaving}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            {leaving ? 'Leaving…' : 'Leave game'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SPORT_EMOJI = { 'Beach Volleyball': '🏐', 'Footvolley': '⚽', 'Teqball': '🏓' };

const GEAR_ITEMS = [
  { id: 'ball',    label: 'Ball',    emoji: null },
  { id: 'lines',   label: 'Lines',   emoji: '📏' },
  { id: 'speaker', label: 'Speaker', emoji: '🔊' },
  { id: 'hose',    label: 'Hose',    emoji: '💧' },
];

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [submittedStars, setSubmittedStars] = useState({});
  const [lockedIds, setLockedIds] = useState(new Set());
  const [hoverStars, setHoverStars] = useState({});
  const [copied, setCopied] = useState(false);
  const [gear, setGear] = useState([]);

  const shareGame = async () => {
    const url = `${window.location.origin}/games/${id}`;
    const shareData = {
      title: `${SPORT_EMOJI[game?.sport] || '🏐'} ${game?.sport} · ${game?.format}`,
      text: `Join my game at ${game?.location_name}!`,
      url,
    };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try { await navigator.share(shareData); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    api.get(`/games/${id}`)
      .then(res => {
        setGame(res.data.game);
        setMessages(res.data.game.chat_messages || []);
        setGear(res.data.game.gear || []);
        if (res.data.game.status === 'completed') {
          api.get(`/games/${id}/my-ratings`).then(r => {
            setSubmittedStars(r.data.stars_map || {});
            setLockedIds(new Set(r.data.locked_ids || []));
          });
        }
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

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await api.delete(`/games/${id}/leave`);
      setGame(prev => ({ ...prev, my_request_status: null, approved_count: prev.approved_count - 1, slots_remaining: prev.slots_remaining + 1 }));
      setGear(prev => prev.filter(g => g.player_id !== user.id));
      setShowLeaveModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not leave game');
    } finally {
      setLeaving(false);
    }
  };

  const toggleGear = async (item) => {
    const isBringing = gear.some(g => g.item === item && g.player_id === user.id);
    try {
      if (isBringing) {
        await api.delete(`/games/${id}/gear/${item}`);
        setGear(prev => prev.filter(g => !(g.item === item && g.player_id === user.id)));
      } else {
        await api.post(`/games/${id}/gear`, { item });
        setGear(prev => [...prev, { item, player_id: user.id, display_name: user.display_name, avatar_seed: user.avatar_seed }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitRating = async (ratedId, stars) => {
    setSubmittedStars(prev => ({ ...prev, [ratedId]: stars }));
    try {
      await api.post(`/games/${id}/rate`, { rated_id: ratedId, stars });
    } catch (err) {
      setSubmittedStars(prev => ({ ...prev, [ratedId]: prev[ratedId] }));
      alert(err.response?.data?.error || 'Could not submit rating');
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
      {showLeaveModal && (
        <LeaveConfirmModal
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveModal(false)}
          leaving={leaving}
        />
      )}
      {/* Back nav */}
      <div className="flex items-center gap-3 p-4 sticky top-0 z-10" style={{ background: '#fbf7ef', borderBottom: '0.5px solid rgba(31,26,20,0.08)' }}>
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-sand text-ink-70">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-ink flex-1 truncate">
          {game.sport} · {game.format}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={shareGame}
            className="p-2 rounded-xl bg-sand text-ink-70 relative"
            title="Share game"
          >
            {copied ? <Check size={18} className="text-success" /> : <Share2 size={18} />}
          </button>
          {isHost && (
            <button onClick={() => navigate(`/host/${id}`)} className="p-2 rounded-xl bg-sand text-ink-70">
              <Settings size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Status banners */}
        {isCancelled && (
          <div className="bg-red-50 text-red-600 rounded-xl p-3 text-sm font-medium text-center">Game cancelled</div>
        )}
        {game.status === 'completed' && (
          <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm font-medium text-center">Game completed</div>
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
              <Clock size={15} className="text-coral shrink-0" />
              <span>{format(new Date(game.game_date), 'EEEE, MMMM d · h:mm a')}</span>
              {game.duration_hours && <span className="text-slate-400">({game.duration_hours}h)</span>}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-coral shrink-0" />
              <span>{game.location_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-coral shrink-0" />
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
          <div className="h-40 rounded-2xl overflow-hidden border border-slate-100 pointer-events-none">
            <Map
              initialViewState={{
                longitude: parseFloat(game.lng),
                latitude: parseFloat(game.lat),
                zoom: 15,
              }}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
              style={{ height: '100%', width: '100%' }}
              dragPan={false}
              dragRotate={false}
              scrollZoom={false}
              doubleClickZoom={false}
              keyboard={false}
            >
              <Marker longitude={parseFloat(game.lng)} latitude={parseFloat(game.lat)} anchor="bottom">
                <div style={{
                  width: 32, height: 32,
                  background: '#e87a4a',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }} />
              </Marker>
            </Map>
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
            {isHost && <span className="ml-auto text-xs bg-coral-soft text-coral px-2 py-0.5 rounded-full font-medium">You</span>}
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

        {/* Ratings */}
        {game.status === 'completed' && (game.can_chat || isHost) && (() => {
          const teammates = [
            ...(game.roster || []).filter(p => p.id !== user.id),
            ...(isHost ? [] : [{ id: game.host_id, display_name: game.host_name, avatar_seed: game.host_avatar }]),
          ];
          if (!teammates.length) return null;
          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Rate your teammates</p>
              <div className="space-y-3">
                {teammates.map(player => {
                  const submitted = submittedStars[player.id] || 0;
                  const locked = lockedIds.has(player.id);
                  const hover = hoverStars[player.id] || 0;
                  const active = locked ? submitted : (hover || submitted);
                  return (
                    <div key={player.id} className="flex items-center gap-3">
                      <AvatarDisplay seed={player.avatar_seed} name={player.display_name} size="sm" />
                      <span className="text-sm font-medium text-slate-700 flex-1">{player.display_name}</span>
                      <div
                        className="flex gap-1"
                        onMouseLeave={() => !locked && setHoverStars(p => ({ ...p, [player.id]: 0 }))}
                      >
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            disabled={locked}
                            onClick={() => !locked && submitRating(player.id, star)}
                            onMouseEnter={() => !locked && setHoverStars(p => ({ ...p, [player.id]: star }))}
                            className={`text-xl leading-none transition-all ${
                              locked ? 'cursor-default opacity-60' : 'cursor-pointer hover:scale-110'
                            } ${star <= active ? 'text-yellow-400' : 'text-slate-200'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {locked && <span className="text-xs text-slate-400">Locked</span>}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mt-3">Ratings are anonymous to other players</p>
            </div>
          );
        })()}

        {/* Gear */}
        {(game.can_chat || isHost) && (
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

        {/* Join / Leave button */}
        {!isHost && (
          <div className="space-y-2">
            <button
              onClick={canJoin ? handleJoin : undefined}
              disabled={!canJoin || joining}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-colors ${
                game.my_request_status === 'approved'
                  ? 'bg-success text-white'
                  : game.my_request_status === 'pending'
                  ? 'bg-yellow-100 text-yellow-700 cursor-default'
                  : game.my_request_status === 'declined'
                  ? 'bg-red-100 text-red-600 cursor-default'
                  : canJoin
                  ? 'text-white shadow-coral'
                  : 'bg-sand text-ink-35 cursor-default'
              }`}
              style={canJoin && !game.my_request_status ? { background: 'linear-gradient(180deg,#ee8856 0%,#d85e3a 100%)' } : undefined}
            >
              {joining ? 'Sending request…' : joinButtonLabel()}
            </button>
            {game.my_request_status === 'approved' && !isPast && !isCancelled && game.status !== 'completed' && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full py-3 rounded-2xl font-semibold text-sm border-2 border-red-100 text-red-500 hover:bg-red-50 transition-colors"
              >
                Leave game
              </button>
            )}
          </div>
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
                    if (msg.is_system) {
                      return (
                        <div key={msg.id} className="flex flex-col items-center gap-0.5 py-1">
                          <span className="text-xs text-slate-400 italic">Operator</span>
                          <div className="bg-slate-100 text-slate-500 text-xs italic px-3 py-1.5 rounded-full text-center max-w-[85%]">
                            {msg.message}
                          </div>
                          <span className="text-xs text-slate-400">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </span>
                        </div>
                      );
                    }
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <AvatarDisplay seed={msg.sender_avatar} name={msg.sender_name} size="xs" />
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isMe && <span className="text-xs text-slate-400 mb-0.5 ml-1">{msg.sender_name}</span>}
                          <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'text-white rounded-tr-sm' : 'bg-sand text-ink rounded-tl-sm'}`} style={isMe ? { background: 'linear-gradient(135deg,#ee8856,#d85e3a)' } : undefined}>
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
                  className="flex-1 border border-hairline rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                />
                <button
                  type="submit"
                  disabled={!msgInput.trim()}
                  style={{ padding: '10px', background: 'linear-gradient(180deg,#ee8856 0%,#d85e3a 100%)', borderRadius: 12, border: 'none', color: '#fff', cursor: msgInput.trim() ? 'pointer' : 'not-allowed', opacity: msgInput.trim() ? 1 : 0.4 }}
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
