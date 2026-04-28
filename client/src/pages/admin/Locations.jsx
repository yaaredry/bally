import { useEffect, useState } from 'react';
import {
  Plus, Pencil, Check, X, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Trash2,
} from 'lucide-react';
import api from '../../api/client';

const NET_TYPE_LABEL = { volleyball: 'Volleyball / Footvolley', teqball: 'Teqball' };
const NET_TYPE_COLOR = {
  volleyball: 'bg-sky-100 text-sky-700',
  teqball:    'bg-orange-100 text-orange-700',
};

// ── Small inline form for adding/editing a net ────────────────────────────────
function NetForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    lat:      initial.lat      ?? '',
    lng:      initial.lng      ?? '',
    net_type: initial.net_type ?? 'volleyball',
    label:    initial.label    ?? '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-wrap items-end gap-2 mt-2">
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Lat</label>
        <input
          type="number" step="0.00001" placeholder="32.08333" value={form.lat}
          onChange={e => set('lat', e.target.value)}
          className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Lng</label>
        <input
          type="number" step="0.00001" placeholder="34.76797" value={form.lng}
          onChange={e => set('lng', e.target.value)}
          className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <label className="text-xs text-slate-400">Type</label>
        <select
          value={form.net_type} onChange={e => set('net_type', e.target.value)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="volleyball">Volleyball / Footvolley</option>
          <option value="teqball">Teqball</option>
        </select>
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-[100px]">
        <label className="text-xs text-slate-400">Label (optional)</label>
        <input
          placeholder="e.g. Net 1" value={form.label}
          onChange={e => set('label', e.target.value)}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>
      <button onClick={() => onSave(form)} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50">
        <Check size={16} />
      </button>
      <button onClick={onCancel} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
        <X size={16} />
      </button>
    </div>
  );
}

// ── Single net row ────────────────────────────────────────────────────────────
function NetRow({ net, locationId, onChanged }) {
  const [editing, setEditing] = useState(false);

  const handleSave = async (form) => {
    await api.put(`/admin/locations/${locationId}/nets/${net.id}`, {
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      net_type: form.net_type,
      label: form.label || null,
    });
    setEditing(false);
    onChanged();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this net?')) return;
    await api.delete(`/admin/locations/${locationId}/nets/${net.id}`);
    onChanged();
  };

  return (
    <div className="pl-4 border-l-2 border-slate-100 ml-2">
      {editing ? (
        <NetForm initial={net} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="flex items-center gap-3 py-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${NET_TYPE_COLOR[net.net_type]}`}>
            {NET_TYPE_LABEL[net.net_type]}
          </span>
          <span className="text-sm text-slate-600 font-mono">
            {parseFloat(net.lat).toFixed(5)}, {parseFloat(net.lng).toFixed(5)}
          </span>
          {net.label && (
            <span className="text-xs text-slate-400">{net.label}</span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setEditing(true)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
              <Pencil size={13} />
            </button>
            <button onClick={handleDelete} className="p-1 rounded text-red-400 hover:bg-red-50">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Single beach row (expandable) ─────────────────────────────────────────────
function BeachRow({ loc, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(loc.name);
  const [addingNet, setAddingNet] = useState(false);

  const handleSaveName = async () => {
    await api.put(`/admin/locations/${loc.id}`, { name });
    setEditingName(false);
    onChanged();
  };

  const handleToggle = async () => {
    await api.patch(`/admin/locations/${loc.id}/toggle`);
    onChanged();
  };

  const handleAddNet = async (form) => {
    if (!form.lat || !form.lng) return;
    await api.post(`/admin/locations/${loc.id}/nets`, {
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      net_type: form.net_type,
      label: form.label || null,
    });
    setAddingNet(false);
    onChanged();
  };

  const vCount = loc.nets.filter(n => n.net_type === 'volleyball').length;
  const tCount = loc.nets.filter(n => n.net_type === 'teqball').length;

  return (
    <div className="border-b border-slate-100 last:border-0">
      {/* Beach header row */}
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-slate-50">
        <button onClick={() => setExpanded(e => !e)} className="text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        {editingName ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 flex-1 max-w-xs"
            />
            <button onClick={() => { setName(loc.name); setEditingName(false); }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={14} /></button>
            <button onClick={handleSaveName}
              className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50"><Check size={14} /></button>
          </div>
        ) : (
          <span className="font-medium text-slate-800 text-sm flex-1">{loc.name}</span>
        )}

        <span className="text-xs text-slate-400">{loc.city}</span>

        {vCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
            {vCount} net{vCount !== 1 ? 's' : ''}
          </span>
        )}
        {tCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
            {tCount} teqball
          </span>
        )}

        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          loc.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {loc.is_active ? 'Active' : 'Inactive'}
        </span>

        <div className="flex items-center gap-1">
          {!editingName && (
            <button onClick={() => setEditingName(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Pencil size={14} /></button>
          )}
          <button onClick={handleToggle} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            {loc.is_active
              ? <ToggleRight size={17} className="text-green-600" />
              : <ToggleLeft size={17} />}
          </button>
        </div>
      </div>

      {/* Nets section */}
      {expanded && (
        <div className="px-6 pb-3 bg-slate-50">
          {loc.nets.length === 0 && !addingNet && (
            <p className="text-sm text-slate-400 py-2">No nets added yet.</p>
          )}
          {loc.nets.map(net => (
            <NetRow key={net.id} net={net} locationId={loc.id} onChanged={onChanged} />
          ))}

          {addingNet ? (
            <NetForm onSave={handleAddNet} onCancel={() => setAddingNet(false)} />
          ) : (
            <button
              onClick={() => setAddingNet(true)}
              className="mt-2 flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus size={13} /> Add net
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newBeach, setNewBeach] = useState({ name: '', city: 'Tel Aviv' });
  const [msg, setMsg] = useState('');

  const fetchLocations = () => {
    setLoading(true);
    api.get('/admin/locations')
      .then(res => setLocations(res.data.locations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLocations(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAddBeach = async () => {
    if (!newBeach.name || !newBeach.city) { flash('Name and city are required'); return; }
    try {
      await api.post('/admin/locations', newBeach);
      setNewBeach({ name: '', city: 'Tel Aviv' });
      setAdding(false);
      fetchLocations();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to add');
    }
  };

  const totalNets = locations.reduce((s, l) => s + (l.nets?.length ?? 0), 0);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Locations</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600"
        >
          <Plus size={16} /> Add beach
        </button>
      </div>

      {msg && <div className="mb-4 bg-brand-50 text-brand-700 text-sm rounded-xl p-3">{msg}</div>}

      {adding && (
        <div className="mb-5 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <h2 className="font-semibold text-slate-700">New beach</h2>
          <div className="flex gap-2">
            <input
              placeholder="Beach name" value={newBeach.name}
              onChange={e => setNewBeach(f => ({ ...f, name: e.target.value }))}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <input
              placeholder="City" value={newBeach.city}
              onChange={e => setNewBeach(f => ({ ...f, city: e.target.value }))}
              className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">
              Cancel
            </button>
            <button onClick={handleAddBeach}
              className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : (
          locations.map(loc => (
            <BeachRow key={loc.id} loc={loc} onChanged={fetchLocations} />
          ))
        )}
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {locations.length} beaches · {totalNets} nets
      </div>
    </div>
  );
}
