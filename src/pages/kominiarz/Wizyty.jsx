import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createBuilding, buildingFields, createApartment } from '../../lib/creators';

const TYPES = ['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'];

export default function Wizyty() {
  const [visits, setVisits] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const dateFilter = params.get('date');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ building_id: '', apartment_id: '', scheduled_at: '', type: 'kontrola', duration_min: 60, notes: '' });

  function load() {
    api('/visits').then(setVisits).catch(console.error);
    api('/buildings').then(setBuildings).catch(console.error);
    api('/apartments').then(setApartments).catch(console.error);
  }
  useEffect(load, []);

  // Auto-otwórz formularz z parametrami URL
  useEffect(() => {
    const bid = params.get('building_id');
    const aid = params.get('apartment_id');
    if (bid || aid) {
      setForm(f => ({ ...f, building_id: bid || '', apartment_id: aid || '' }));
      setShow(true);
    }
  }, []);

  let filtered = visits;
  if (filter !== 'all') filtered = filtered.filter(v => v.status === filter);
  if (dateFilter) filtered = filtered.filter(v => v.scheduled_at?.slice(0, 10) === dateFilter);

  function setFilter(s) {
    const next = new URLSearchParams(params);
    if (s === 'all') next.delete('status'); else next.set('status', s);
    setParams(next);
  }

  async function create(e) {
    e.preventDefault();
    const body = { ...form };
    if (!body.apartment_id) delete body.apartment_id;
    if (body.apartment_id) body.apartment_id = Number(body.apartment_id);
    body.building_id = Number(body.building_id);
    body.duration_min = Number(body.duration_min);
    if (body.scheduled_at) body.scheduled_at = new Date(body.scheduled_at).toISOString();
    await api('/visits', { method: 'POST', body });
    setShow(false);
    setForm({ building_id: '', apartment_id: '', scheduled_at: '', type: 'kontrola', duration_min: 60, notes: '' });
    load();
  }

  const aptsForBuilding = form.building_id ? apartments.filter(a => a.building_id === Number(form.building_id)) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wizyty</h1>
          {dateFilter && (
            <div className="text-sm text-slate-500">
              Filtr daty: <strong>{dateFilter}</strong>
              <button onClick={() => { const n = new URLSearchParams(params); n.delete('date'); setParams(n); }}
                className="ml-2 text-orange-600 hover:underline">× wyczyść</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShow(true)} className="px-4 py-2 bg-orange-500 text-white rounded-md">+ Nowa wizyta</button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'umowiona', 'zakonczona', 'odwolana', 'odmowa_wpuszczenia'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {s === 'all' ? `Wszystkie (${visits.length})` : `${statusLabel[s]} (${visits.filter(v => v.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Adres / lokal</th>
              <th className="text-left p-3">Typ</th>
              <th className="text-left p-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3">{fmtDateTime(v.scheduled_at)}</td>
                <td className="p-3">
                  <div className="font-medium">{v.building_address}</div>
                  {v.apt_number && <div className="text-xs text-slate-500">m. {v.apt_number}</div>}
                </td>
                <td className="p-3">{visitTypeLabel[v.type] || v.type}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span></td>
                <td className="p-3 text-right">
                  <Link to={`/panel/kominiarz/wizyta/${v.id}`} className="text-orange-600 text-sm hover:underline">Otwórz →</Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">Brak wizyt do wyświetlenia.</td></tr>}
          </tbody>
        </table></div>
      </div>

      {show && (
        <Modal onClose={() => setShow(false)}>
          <form onSubmit={create} className="space-y-3">
            <h3 className="font-semibold text-lg">Nowa wizyta</h3>
            <SelectOrCreate
              label="Budynek"
              value={form.building_id}
              onChange={v => setForm(f => ({ ...f, building_id: v, apartment_id: '' }))}
              options={buildings}
              getLabel={b => `${b.address}${b.city ? ', ' + b.city : ''}`}
              required
              createTitle="Nowy budynek"
              createFields={buildingFields}
              onCreate={async (data) => {
                const b = await createBuilding(data);
                const next = await api('/buildings');
                setBuildings(next);
                return b;
              }}
            />
            <SelectOrCreate
              label="Mieszkanie (opcjonalnie)"
              value={form.apartment_id}
              onChange={v => setForm(f => ({ ...f, apartment_id: v }))}
              options={aptsForBuilding}
              getLabel={a => `m. ${a.number}${a.resident_name ? ` (${a.resident_name})` : ''}`}
              emptyLabel="— wspólne dla budynku —"
              disabled={!form.building_id}
              createTitle="Nowe mieszkanie"
              createFields={[
                { k: 'number', label: 'Numer', required: true },
                { k: 'floor', label: 'Piętro' },
              ]}
              onCreate={async (data) => {
                const a = await createApartment({ ...data, building_id: form.building_id });
                const next = await api('/apartments');
                setApartments(next);
                return a;
              }}
            />
            <div>
              <label className="text-sm font-medium block mb-1">Termin</label>
              <input className="w-full border rounded p-2" type="datetime-local" required
                value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="border rounded p-2" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
              </select>
              <input className="border rounded p-2" type="number" min="15" step="15" placeholder="Czas (min)"
                value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
            </div>
            <textarea className="w-full border rounded p-2 text-sm" rows="2" placeholder="Uwagi"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <button className="w-full bg-orange-500 text-white py-2 rounded font-medium">Zaplanuj wizytę</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
      <button onClick={onClose} className="float-right text-slate-400">✕</button>{children}
    </div></div>;
}
