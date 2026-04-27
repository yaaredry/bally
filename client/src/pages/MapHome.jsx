import { useState, useEffect, useCallback } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import { useNavigate } from 'react-router-dom';
import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';
import GameCard from '../components/GameCard';
import SportIcon from '../components/SportIcon';
import SkillBadge from '../components/SkillBadge';
import { SKILL_HEX, SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const TEL_AVIV = { longitude: 34.7818, latitude: 32.0853, zoom: 13 };

const FORMATS = ['1v1', '2v2', '3v3', '4v4'];
const SPORTS_LIST = ['Beach Volleyball', 'Footvolley', 'Teqball'];

function GamePin({ game, onClick, selected }) {
  const bg = SKILL_HEX[game.skill_level] || '#0ea5e9';
  return (
    <div
      onClick={onClick}
      style={{
        width: 42,
        height: 42,
        background: bg,
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected
          ? `0 0 0 3px white, 0 0 0 5px ${bg}, 0 6px 20px rgba(0,0,0,0.3)`
          : '0 3px 10px rgba(0,0,0,0.22), 0 0 0 2px white',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div style={{ transform: 'rotate(45deg)', display: 'flex' }}>
        <SportIcon sport={game.sport} size={20} />
      </div>
    </div>
  );
}

export default function MapHome() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [view, setView] = useState('map');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ sport: '', skill_level: '', format: '' });
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [viewState, setViewState] = useState(TEL_AVIV);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    if (userPos) {
      setViewState(v => ({ ...v, latitude: userPos.latitude, longitude: userPos.longitude }));
    }
  }, [userPos]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sport)       params.set('sport', filters.sport);
    if (filters.skill_level) params.set('skill_level', filters.skill_level);
    if (filters.format)      params.set('format', filters.format);
    if (userPos) {
      params.set('lat', userPos.latitude);
      params.set('lng', userPos.longitude);
      params.set('radius_km', '100');
    }
    api.get(`/games?${params}`)
      .then(res => setGames(res.data.games))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, userPos]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: '' }));
  const handleMapClick = useCallback(() => setSelectedGame(null), []);

  return (
    <div className="relative h-full flex flex-col">
      {/* Top bar — floats above the map */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-2 space-y-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shadow text-sm font-medium transition-colors ${
              activeFiltersCount > 0 ? 'bg-coral text-white' : 'bg-white text-ink-70'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-coral-deep text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {Object.entries(filters).filter(([, v]) => v).map(([key, val]) => (
            <button
              key={key}
              onClick={() => clearFilter(key)}
              className="flex items-center gap-1 bg-white text-slate-700 text-xs px-2.5 py-1.5 rounded-xl shadow font-medium"
            >
              {val} <X size={12} />
            </button>
          ))}

          {/* Map / List toggle */}
          <div className="ml-auto flex bg-white rounded-xl shadow overflow-hidden">
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${view === 'map' ? 'bg-coral text-white' : 'text-ink-55'}`}
            >
              <MapIcon size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-coral text-white' : 'text-ink-55'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3 pointer-events-auto">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Sport</p>
              <div className="flex gap-2">
                {SPORTS_LIST.map(s => (
                  <button key={s} onClick={() => setFilters(prev => ({ ...prev, sport: prev.sport === s ? '' : s, skill_level: '' }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${filters.sport === s ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'}`}>
                    <span className="inline-flex items-center gap-1">
                      <SportIcon sport={s} size={14} />
                      {s === 'Beach Volleyball' ? 'Volleyball' : s}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Skill</p>
              {filters.sport ? (
                <div className="flex gap-1.5 flex-wrap">
                  {[...(SKILL_LEVELS_BY_SPORT[filters.sport] || []), 'All welcome'].map(s => (
                    <button key={s} onClick={() => setFilters(prev => ({ ...prev, skill_level: prev.skill_level === s ? '' : s }))}
                      className={`py-1 px-2.5 rounded-lg text-xs font-medium border transition-all ${filters.skill_level === s ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a sport to filter by skill level</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Format</p>
              <div className="flex gap-1.5">
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setFilters(prev => ({ ...prev, format: prev.format === f ? '' : f }))}
                    className={`py-1 px-3 rounded-lg text-xs font-medium border transition-all ${filters.format === f ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className="flex-1 relative">
          <Map
            {...viewState}
            onMove={e => setViewState(e.viewState)}
            mapStyle={MAP_STYLE}
            style={{ height: '100%', width: '100%' }}
            onClick={handleMapClick}
          >
            {/* User position dot */}
            {userPos && (
              <Marker longitude={userPos.longitude} latitude={userPos.latitude} anchor="center">
                <div style={{
                  width: 14, height: 14,
                  background: '#3b82f6',
                  borderRadius: '50%',
                  border: '2.5px solid white',
                  boxShadow: '0 0 0 3px rgba(59,130,246,0.25)',
                }} />
              </Marker>
            )}

            {/* Game pins */}
            {games.map(game => (
              <Marker
                key={game.id}
                longitude={parseFloat(game.lng)}
                latitude={parseFloat(game.lat)}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedGame(game); }}
              >
                <GamePin game={game} selected={selectedGame?.id === game.id} />
              </Marker>
            ))}

            {/* Selected game popup */}
            {selectedGame && (
              <Popup
                longitude={parseFloat(selectedGame.lng)}
                latitude={parseFloat(selectedGame.lat)}
                anchor="bottom"
                offset={52}
                closeButton={false}
                onClose={() => setSelectedGame(null)}
              >
                <div className="p-3 w-52">
                  <div className="flex items-center gap-2 mb-1.5">
                    <SportIcon sport={selectedGame.sport} size={16} />
                    <span className="font-semibold text-slate-800 text-sm leading-tight">
                      {selectedGame.sport} · {selectedGame.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <SkillBadge level={selectedGame.skill_level} small />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{selectedGame.location_name}</p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(selectedGame.game_date), 'EEE MMM d · h:mm a')}
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    {selectedGame.slots_remaining ?? selectedGame.max_players} slot{selectedGame.slots_remaining !== 1 ? 's' : ''} left
                  </p>
                  <button
                    onClick={() => navigate(`/games/${selectedGame.id}`)}
                    className="w-full py-2 rounded-xl text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(180deg,#ee8856 0%,#d85e3a 100%)' }}
                  >
                    View game
                  </button>
                </div>
              </Popup>
            )}
          </Map>

          {/* Game count badge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow text-sm font-medium text-ink-70 z-10"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
          >
            {loading ? 'Loading…' : `${games.length} game${games.length !== 1 ? 's' : ''} nearby`}
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto p-3 pt-24 space-y-2">
          {loading ? (
            <div className="text-center text-slate-400 py-10">Loading games…</div>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-ink-35">
              <p>No games found nearby. Create one!</p>
            </div>
          ) : (
            games.map(game => <GameCard key={game.id} game={game} />)
          )}
        </div>
      )}
    </div>
  );
}
