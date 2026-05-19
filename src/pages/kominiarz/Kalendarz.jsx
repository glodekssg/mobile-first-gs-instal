import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { visitTypeLabel, statusColor, statusLabel } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createBuilding, buildingFields, createApartment } from '../../lib/creators';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];

export default function Kalendarz() {
  const [visits, setVisits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [creating, setCreating] = useState(null); // { date: 'YYYY-MM-DD', time: 'HH:00' }
  const [form, setForm] = useState({ building_id: '', apartment_id: '', type: 'kontrola', duration_min: 60, notes: '' });
  const nav = useNavigate();

  function load() {
    api('/visits').then(setVisits).catch(console.error);
    api('/buildings').then(setBuildings).catch(console.error);
    api('/apartments').then(setApartments).catch(console.error);
  }
  useEffect(load, []);

  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  function visitsAt(dayIso, hour) {
    return visits.filter(v => {
      if (!v.scheduled_at) return false;
      const d = v.scheduled_at.slice(0, 10);
      const h = parseInt(v.scheduled_at.slice(11, 13));
      return d === dayIso && h === hour;
    });
  }

  function openCreate(dayIso, hour) {
    setCreating({ date: dayIso, time: `${String(hour).padStart(2, '0')}:00` });
    setForm({ building_id: '', apartment_id: '', type: 'kontrola', duration_min: 60, notes: '' });
  }

  async function create(e) {
    e.preventDefault();
    if (!creating) return;
    const scheduled = new Date(`${creating.date}T${creating.time}`).toISOString();
    const body = {
      building_id: Number(form.building_id),
      scheduled_at: scheduled,
      type: form.type,
      duration_min: Number(form.duration_min),
      notes: form.notes || null,
    };
    if (form.apartment_id) body.apartment_id = Number(form.apartment_id);
    await api('/visits', { method: 'POST', body });
    setCreating(null);
    load();
  }

  const aptsForBuilding = form.building_id ? apartments.filter(a => a.building_id === Number(form.building_id)) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Kalendarz</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-7)} className="px-3 py-1.5 border rounded-md text-sm">‹ Poprzedni</button>
          <button onClick={() => setWeekStart(mondayOf(new Date()))} className="px-3 py-1.5 border rounded-md text-sm">Dziś</button>
          <button onClick={() => shiftWeek(7)} className="px-3 py-1.5 border rounded-md text-sm">Następny ›</button>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        Tydzień {weekStart.toLocaleDateString('pl-PL')} – {days[4].toLocaleDateString('pl-PL')}
        <span className="ml-3 text-xs text-slate-400">💡 Kliknij w pusty slot, by szybko umówić wizytę</span>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[80px_repeat(5,1fr)] divide-x divide-slate-200">
          <div className="bg-slate-50"></div>
          {days.map(d => (
            <div key={d.toISOString()} className="bg-slate-50 px-3 py-2 text-center">
              <div className="text-xs uppercase text-slate-500">{d.toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
              <div className="text-lg font-semibold">{d.getDate()}</div>
            </div>
          ))}
        </div>
        {HOURS.map(h => (
          <div key={h} className="grid grid-cols-[80px_repeat(5,1fr)] divide-x divide-slate-200 border-t">
            <div className="text-xs text-slate-500 p-2 text-right pr-3 bg-slate-50">{h}:00</div>
            {days.map(d => {
              const iso = d.toISOString().slice(0, 10);
              const vs = visitsAt(iso, h);
              return (
                <div key={iso + h} className="min-h-[60px] p-1 hover:bg-slate-50 relative group">
                  {vs.length === 0 ? (
                    <button onClick={() => openCreate(iso, h)}
                      className="absolute inset-1 opacity-0 group-hover:opacity-100 transition border-2 border-dashed border-slate-300 hover:border-orange-400 rounded text-xs text-slate-400 hover:text-orange-600">
                      + Umów
                    </button>
                  ) : (
                    vs.map(v => (
                      <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`}
                        className={`block text-xs rounded p-1.5 ${statusColor[v.status]} hover:opacity-80 mb-1`}>
                        <div className="font-semibold">{v.scheduled_at?.slice(11, 16)}</div>
                        <div className="truncate text-[10px]">{v.building_address}{v.apt_number ? `/m. ${v.apt_number}` : ''}</div>
                        <div className="text-[10px] opacity-70">{visitTypeLabel[v.type]}</div>
                      </Link>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        <strong>Integracja Google Calendar:</strong> kalendarz synchronizuje się dwukierunkowo z Google Calendar kominiarza
        (połącz w „Ustawienia"). Sloty udostępniane mieszkańcom są wyliczane z wolnych okien.
      </div>

      {creating && (
        <Modal onClose={() => setCreating(null)}>
          <form onSubmit={create} className="space-y-3">
            <h3 className="font-semibold text-lg">Nowa wizyta</h3>
            <div className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
              📅 {new Date(creating.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })} o {creating.time}
            </div>
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
            <div className="grid grid-cols-2 gap-2">
              <select className="border rounded p-2" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'].map(t =>
                  <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
              </select>
              <input className="border rounded p-2" type="number" min="15" step="15"
                value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
            </div>
            <textarea className="w-full border rounded p-2 text-sm" rows="2" placeholder="Uwagi"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <button className="w-full bg-orange-500 text-white py-2 rounded font-medium">Zaplanuj</button>
          </form>
        </Modal>
      )}
    </div>
  );

  function shiftWeek(days) {
    const d = new Date(weekStart); d.setDate(d.getDate() + days); setWeekStart(d);
  }
}

function mondayOf(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d); m.setDate(m.getDate() + diff); m.setHours(0, 0, 0, 0); return m;
}
function Modal({ children, onClose }) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
      <button onClick={onClose} className="float-right text-slate-400">✕</button>{children}
    </div></div>;
}
