import { useEffect, useState } from 'react';
import { Plus, ToggleLeft, ToggleRight, Pencil, Check, X, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../../api/client';

function Th({ label, col, sort, onSort, align = 'left' }) {
  const active = sort.key === col;
  const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-4 py-3 text-${align} text-xs text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 group`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon size={12} className={active ? 'text-brand-500' : 'text-slate-300 group-hover:text-slate-400'} />
      </span>
    </th>
  );
}

function LocationRow({ loc, onToggle, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: loc.name, lat: loc.lat, lng: loc.lng });

  const handleSave = async () => {
    await onSave(loc.id, form);
    setEditing(false);
  };

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50">
      <td className="px-4 py-3">
        {editing
          ? <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          : <span className="text-slate-800 font-medium text-sm">{loc.name}</span>}
      </td>
      <td className="px-4 py-3">
        <span className="text-slate-500 text-sm">{loc.city}</span>
      </td>
      <td className="px-4 py-3">
        {editing
          ? <input type="number" step="0.0001" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
              className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          : <span className="text-slate-500 text-sm">{parseFloat(loc.lat).toFixed(4)}</span>}
      </td>
      <td className="px-4 py-3">
        {editing
          ? <input type="number" step="0.0001" value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
              className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          : <span className="text-slate-500 text-sm">{parseFloat(loc.lng).toFixed(4)}</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${loc.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {loc.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={15} /></button>
              <button onClick={handleSave} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50"><Check size={15} /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Pencil size={15} /></button>
              <button onClick={() => onToggle(loc.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                {loc.is_active ? <ToggleRight size={17} className="text-green-600" /> : <ToggleLeft size={17} />}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  const toggleSort = (key) => setSort(prev => ({
    key,
    dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
  }));
  const [newLoc, setNewLoc] = useState({ name: '', lat: '', lng: '' });
  const [msg, setMsg] = useState('');

  const fetchLocations = () => {
    api.get('/admin/locations')
      .then(res => setLocations(res.data.locations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLocations(); }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAdd = async () => {
    if (!newLoc.name || !newLoc.lat || !newLoc.lng) { flash('All fields required'); return; }
    try {
      await api.post('/admin/locations', { name: newLoc.name, lat: parseFloat(newLoc.lat), lng: parseFloat(newLoc.lng) });
      setNewLoc({ name: '', lat: '', lng: '' });
      setAdding(false);
      fetchLocations();
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to add');
    }
  };

  const handleToggle = async (id) => {
    await api.patch(`/admin/locations/${id}/toggle`);
    fetchLocations();
  };

  const handleSave = async (id, form) => {
    await api.put(`/admin/locations/${id}`, { name: form.name, lat: parseFloat(form.lat), lng: parseFloat(form.lng) });
    fetchLocations();
  };

  const sorted = [...locations].sort((a, b) => {
    const val = x => x[sort.key] ?? '';
    const av = val(a), bv = val(b);
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-slate-800">Locations</h1>
        <button onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600">
          <Plus size={16} /> Add location
        </button>
      </div>

      {msg && <div className="mb-4 bg-brand-50 text-brand-700 text-sm rounded-xl p-3">{msg}</div>}

      {adding && (
        <div className="mb-5 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <h2 className="font-semibold text-slate-700">New location</h2>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Name" value={newLoc.name} onChange={e => setNewLoc(f => ({ ...f, name: e.target.value }))}
              className="col-span-3 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Lat (e.g. 32.0853)" type="number" step="0.0001" value={newLoc.lat} onChange={e => setNewLoc(f => ({ ...f, lat: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <input placeholder="Lng (e.g. 34.7818)" type="number" step="0.0001" value={newLoc.lng} onChange={e => setNewLoc(f => ({ ...f, lng: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <div className="flex gap-2">
              <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600">Add</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <Th label="Name"   col="name"      sort={sort} onSort={toggleSort} />
                <Th label="City"   col="city"      sort={sort} onSort={toggleSort} />
                <Th label="Lat"    col="lat"       sort={sort} onSort={toggleSort} />
                <Th label="Lng"    col="lng"       sort={sort} onSort={toggleSort} />
                <Th label="Status" col="is_active" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map(loc => (
                <LocationRow key={loc.id} loc={loc} onToggle={handleToggle} onSave={handleSave} />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-3 text-xs text-slate-400">{locations.length} locations</div>
    </div>
  );
}
