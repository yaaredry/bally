import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { ChevronLeft } from 'lucide-react';
import api from '../api/client';
import { SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';
import SportIcon from '../components/SportIcon';

const SPORTS = ['Beach Volleyball', 'Footvolley', 'Teqball'];
const FORMATS = ['1v1', '2v2', '3v3', '4v4', 'Custom'];
const FORMATS_BY_SPORT = {
  'Beach Volleyball': ['2v2', '3v3', '4v4', 'Custom'],
  'Footvolley':       ['2v2', '3v3', '4v4', 'Custom'],
  'Teqball':          ['1v1', '2v2', 'Custom'],
};
const DURATIONS = [1, 1.5, 2, 2.5, 3];
const MAX_PLAYERS_DEFAULT = { '1v1': 2, '2v2': 4, '3v3': 6, '4v4': 8, 'Custom': 8 };
const CUSTOM = '__custom__';

function MapPinPicker({ onSelect }) {
  const [marker, setMarker] = useState(null);
  useMapEvents({
    click(e) {
      setMarker([e.latlng.lat, e.latlng.lng]);
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return marker ? <Marker position={marker} /> : null;
}

export default function CreateGame() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    sport: '',
    format: '',
    skill_level: '',
    game_date: '',
    duration_hours: 1.5,
    location_name: '',
    lat: null,
    lng: null,
    max_players: 4,
    notes: '',
  });
  const [allLocations, setAllLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter] = useState([32.0853, 34.7818]);

  useEffect(() => {
    api.get('/locations').then(res => setAllLocations(res.data.locations)).catch(() => {});
  }, []);

  const cities = useMemo(() => [...new Set(allLocations.map(l => l.city))].sort(), [allLocations]);
  const beachesForCity = useMemo(
    () => selectedCity ? allLocations.filter(l => l.city === selectedCity) : [],
    [allLocations, selectedCity]
  );

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSportChange = (sport) => {
    const defaultFormat = sport === 'Teqball' ? '1v1' : sport === 'Footvolley' ? '2v2' : '';
    setForm(prev => ({
      ...prev,
      sport,
      skill_level: '',
      format: defaultFormat,
      max_players: defaultFormat ? MAX_PLAYERS_DEFAULT[defaultFormat] : prev.max_players,
    }));
  };

  const handleFormatChange = (fmt) => {
    set('format', fmt);
    set('max_players', MAX_PLAYERS_DEFAULT[fmt] || 8);
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSelectedLocationId('');
    setForm(prev => ({ ...prev, location_name: '', lat: null, lng: null }));
  };

  const handleLocationSelect = (id) => {
    setSelectedLocationId(id);
    if (id === CUSTOM) {
      set('location_name', customLocationName);
      set('lat', null);
      set('lng', null);
    } else {
      const loc = allLocations.find(l => l.id === id);
      if (loc) {
        set('location_name', loc.name);
        set('lat', parseFloat(loc.lat));
        set('lng', parseFloat(loc.lng));
      }
    }
  };

  const availableFormats = form.sport ? (FORMATS_BY_SPORT[form.sport] || FORMATS) : FORMATS;
  const skillOptions = form.sport ? [...(SKILL_LEVELS_BY_SPORT[form.sport] || []), 'All welcome'] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sport) { setError('Select a sport'); return; }
    if (!form.format) { setError('Select a format'); return; }
    if (!form.skill_level) { setError('Select skill level'); return; }
    if (!form.game_date) { setError('Set date and time'); return; }
    if (!form.location_name) { setError('Select or enter a location'); return; }
    if (!form.lat || !form.lng) {
      setError(selectedLocationId === CUSTOM
        ? 'Tap the map to drop a pin on your custom location'
        : 'Select a beach');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.post('/games', form);
      navigate(`/games/${res.data.game.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date().toISOString().slice(0, 16);

  return (
    <div className="h-full overflow-y-auto">
      {/* Sub-header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Create Game</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-8">
        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>}

        {/* Sport */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Sport</label>
          <div className="flex gap-2">
            {SPORTS.map(s => (
              <button key={s} type="button" onClick={() => handleSportChange(s)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.sport === s ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'
                }`}>
                <SportIcon sport={s} size={18} className="mr-1" /> {s === 'Beach Volleyball' ? 'Volleyball' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Format — filtered per sport */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
          <div className="flex gap-2 flex-wrap">
            {availableFormats.map(f => (
              <button key={f} type="button" onClick={() => handleFormatChange(f)}
                className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.format === f ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Skill level */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Skill level required</label>
          {!form.sport ? (
            <p className="text-xs text-slate-400">Select a sport first</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skillOptions.map(s => (
                <button key={s} type="button" onClick={() => set('skill_level', s)}
                  className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.skill_level === s ? 'border-coral bg-coral-soft text-coral-deep' : 'border-slate-200 text-slate-600'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date/Time & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={form.game_date}
              min={minDate}
              onChange={e => set('game_date', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
            <select
              value={form.duration_hours}
              onChange={e => set('duration_hours', parseFloat(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-coral bg-white"
            >
              {DURATIONS.map(d => <option key={d} value={d}>{d}h</option>)}
            </select>
          </div>
        </div>

        {/* Max players */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Max players <span className="text-slate-400 font-normal text-xs">(auto-filled by format)</span>
          </label>
          <input
            type="number" min="2" max="30"
            value={form.max_players}
            onChange={e => set('max_players', parseInt(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-coral"
          />
        </div>

        {/* Location — city first, then beach */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Location</label>

          {/* City picker */}
          <select
            value={selectedCity}
            onChange={e => handleCityChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <option value="">Select a city…</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Beach picker — only shown once city is selected */}
          {selectedCity && (
            <select
              value={selectedLocationId}
              onChange={e => handleLocationSelect(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-coral"
            >
              <option value="">Select a beach in {selectedCity}…</option>
              {beachesForCity.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
              <option value={CUSTOM}>Other / Custom location</option>
            </select>
          )}

          {/* Custom location extras */}
          {selectedLocationId === CUSTOM && (
            <div className="space-y-2">
              <input
                type="text"
                value={customLocationName}
                onChange={e => { setCustomLocationName(e.target.value); set('location_name', e.target.value); }}
                placeholder="e.g. Herzliya Marina Court 2"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral"
              />
              <p className="text-xs text-slate-500">Tap the map to drop a pin on your location</p>
              <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
                <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPinPicker onSelect={(lat, lng) => { set('lat', lat); set('lng', lng); }} />
                </MapContainer>
              </div>
              {form.lat && <p className="text-xs text-green-600">✓ Pin set</p>}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Notes <span className="text-slate-400 font-normal text-xs">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="e.g. Bring your own ball, warm-up starts 10 min early"
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: loading ? 'rgba(31,26,20,0.12)' : 'linear-gradient(180deg,#ee8856 0%,#d85e3a 100%)', color: loading ? 'rgba(31,26,20,0.35)' : '#fff', fontWeight: 700, fontSize: 15, boxShadow: loading ? 'none' : '0 8px 22px rgba(216,89,59,0.32)' }}
        >
          {loading ? 'Publishing…' : 'Publish Game'}
        </button>
      </form>
    </div>
  );
}
