import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { ChevronLeft } from 'lucide-react';
import api from '../api/client';
import { SKILL_LEVELS_BY_SPORT } from '../lib/skillLevels';

const SPORTS = ['Beach Volleyball', 'Footvolley'];
const FORMATS = ['2v2', '3v3', '4v4', 'Custom'];
const DURATIONS = [1, 1.5, 2, 2.5, 3];
const MAX_PLAYERS_DEFAULT = { '2v2': 4, '3v3': 6, '4v4': 8, 'Custom': 8 };

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter] = useState([32.0853, 34.7818]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleFormatChange = (fmt) => {
    set('format', fmt);
    set('max_players', MAX_PLAYERS_DEFAULT[fmt] || 8);
  };

  const handleSportChange = (sport) => {
    set('sport', sport);
    set('skill_level', ''); // reset when sport changes
  };

  const skillOptions = form.sport
    ? [...(SKILL_LEVELS_BY_SPORT[form.sport] || []), 'All welcome']
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sport) { setError('Select a sport'); return; }
    if (!form.format) { setError('Select a format'); return; }
    if (!form.skill_level) { setError('Select skill level'); return; }
    if (!form.game_date) { setError('Set date and time'); return; }
    if (!form.location_name) { setError('Enter a location name'); return; }
    if (!form.lat || !form.lng) { setError('Tap the map to drop a pin on your location'); return; }

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
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>
        )}

        {/* Sport */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Sport</label>
          <div className="flex gap-2">
            {SPORTS.map(s => (
              <button key={s} type="button" onClick={() => handleSportChange(s)}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.sport === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                }`}>
                {s === 'Beach Volleyball' ? '🏐 Volleyball' : '⚽ Footvolley'}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Format</label>
          <div className="grid grid-cols-4 gap-2">
            {FORMATS.map(f => (
              <button key={f} type="button" onClick={() => handleFormatChange(f)}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.format === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
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
                    form.skill_level === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
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
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Duration</label>
            <select
              value={form.duration_hours}
              onChange={e => set('duration_hours', parseFloat(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              {DURATIONS.map(d => (
                <option key={d} value={d}>{d}h</option>
              ))}
            </select>
          </div>
        </div>

        {/* Max players */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Max players <span className="text-slate-400 font-normal text-xs">(auto-filled by format)</span>
          </label>
          <input
            type="number"
            min="2"
            max="30"
            value={form.max_players}
            onChange={e => set('max_players', parseInt(e.target.value))}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Location name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Location name</label>
          <input
            type="text"
            value={form.location_name}
            onChange={e => set('location_name', e.target.value)}
            placeholder="e.g. Gordon Beach Court 3"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Map pin drop */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Pin location
            {form.lat && <span className="ml-2 text-xs text-green-600 font-normal">✓ Pin set</span>}
          </label>
          <p className="text-xs text-slate-500 mb-2">Tap the map to mark your exact location</p>
          <div className="h-48 rounded-2xl overflow-hidden border border-slate-200">
            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPinPicker onSelect={(lat, lng) => { set('lat', lat); set('lng', lng); }} />
            </MapContainer>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="e.g. Bring your own ball, warm-up starts 10 min early"
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-base transition-colors shadow-lg shadow-accent-500/25"
        >
          {loading ? 'Publishing…' : 'Publish Game 🏐'}
        </button>
      </form>
    </div>
  );
}
