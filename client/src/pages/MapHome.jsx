import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { List, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';
import GameCard from '../components/GameCard';
import { SKILL_HEX, SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';

const SPORT_ICON = { 'Beach Volleyball': '🏐', 'Footvolley': '⚽', 'Teqball': '🏓' };

const createGameIcon = (game) => L.divIcon({
  className: '',
  html: `<div style="background:${SKILL_HEX[game.skill_level] || '#0ea5e9'};width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid white;">
    <span style="transform:rotate(45deg);font-size:18px;line-height:1;">${SPORT_ICON[game.sport] || '🏐'}</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -44],
});

function LocationSetter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
}

const FORMATS = ['1v1', '2v2', '3v3', '4v4'];
const SPORTS_LIST = ['Beach Volleyball', 'Footvolley', 'Teqball'];

export default function MapHome() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [view, setView] = useState('map');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ sport: '', skill_level: '', format: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => setUserPos([32.0853, 34.7818]) // Default: Tel Aviv Gordon Beach
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.sport) params.set('sport', filters.sport);
    if (filters.skill_level) params.set('skill_level', filters.skill_level);
    if (filters.format) params.set('format', filters.format);
    if (userPos) {
      params.set('lat', userPos[0]);
      params.set('lng', userPos[1]);
      params.set('radius_km', '100');
    }

    api.get(`/games?${params}`)
      .then(res => setGames(res.data.games))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, userPos]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: '' }));

  const defaultCenter = userPos || [32.0853, 34.7818];

  return (
    <div className="relative h-full flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-2 space-y-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shadow text-sm font-medium transition-colors ${
              activeFiltersCount > 0
                ? 'bg-brand-500 text-white'
                : 'bg-white text-slate-700'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-white text-brand-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
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
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${view === 'map' ? 'bg-brand-500 text-white' : 'text-slate-600'}`}
            >
              <MapIcon size={15} />
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${view === 'list' ? 'bg-brand-500 text-white' : 'text-slate-600'}`}
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
                  <button key={s} onClick={() => setFilters(prev => ({ ...prev, sport: prev.sport === s ? '' : s }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${filters.sport === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
                    {s === 'Beach Volleyball' ? '🏐 Volleyball' : s === 'Footvolley' ? '⚽ Footvolley' : '🏓 Teqball'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Skill</p>
              {filters.sport ? (
                <div className="flex gap-1.5 flex-wrap">
                  {[...( SKILL_LEVELS_BY_SPORT[filters.sport] || []), 'All welcome'].map(s => (
                    <button key={s} onClick={() => setFilters(prev => ({ ...prev, skill_level: prev.skill_level === s ? '' : s }))}
                      className={`py-1 px-2.5 rounded-lg text-xs font-medium border transition-all ${filters.skill_level === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
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
                    className={`py-1 px-3 rounded-lg text-xs font-medium border transition-all ${filters.format === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>
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
          <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {userPos && <LocationSetter position={userPos} />}
            {games.map(game => (
              <Marker key={game.id} position={[parseFloat(game.lat), parseFloat(game.lng)]} icon={createGameIcon(game)}>
                <Popup>
                  <div className="min-w-[160px] text-sm">
                    <div className="font-semibold">{game.sport} · {game.format}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{game.location_name}</div>
                    <div className="text-slate-500 text-xs">{format(new Date(game.game_date), 'EEE MMM d, h:mm a')}</div>
                    <div className="text-slate-500 text-xs">{game.slots_remaining ?? game.max_players} slots left</div>
                    <button
                      onClick={() => navigate(`/games/${game.id}`)}
                      className="mt-2 w-full bg-brand-500 text-white text-xs font-semibold py-1.5 rounded-lg"
                    >
                      View game
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Game count badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-4 py-2 shadow text-sm font-medium text-slate-700 z-10">
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
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">🏖️</div>
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
