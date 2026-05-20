import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { visitTypeLabel, statusColor, statusLabel, fmtTime } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createBuilding, buildingFields, createApartment } from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import EmptyState from '../../components/mobile/EmptyState';

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15];
const TYPES = ['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'];

function mondayOf(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const m = new Date(d); m.setDate(m.getDate() + diff); m.setHours(0, 0, 0, 0); return m;
}

export default function Kalendarz() {
  const [visits, setVisits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [view, setView] = useState('day'); // 'day' | 'week'
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [sheet, setSheet] = useState(null); // { date, time? }
  const [form, setForm] = useState({ building_id: '', apartment_id: '', type: 'kontrola', duration_min: 60, notes: '' });

  function load() {
    api('/visits').then(setVisits).catch(console.error);
    api('/buildings').then(setBuildings).catch(console.error);
    api('/apartments').then(setApartments).catch(console.error);
  }
  useEffect(load, []);

  const dayVisits = useMemo(() => {
    const iso = cursor.toISOString().slice(0, 10);
    return visits.filter(v => v.scheduled_at?.slice(0, 10) === iso)
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [visits, cursor]);

  const weekStart = useMemo(() => mondayOf(cursor), [cursor]);
  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  }), [weekStart]);

  function shift(days) {
    const d = new Date(cursor); d.setDate(d.getDate() + days); setCursor(d);
  }
  function openCreate(dateIso, time) {
    setSheet({ date: dateIso, time });
    setForm({ building_id: '', apartment_id: '', type: 'kontrola', duration_min: 60, notes: '' });
  }
  async function create(e) {
    e.preventDefault();
    if (!sheet) return;
    const t = sheet.time || '09:00';
    const scheduled = new Date(`${sheet.date}T${t}`).toISOString();
    const body = {
      building_id: Number(form.building_id),
      scheduled_at: scheduled,
      type: form.type,
      duration_min: Number(form.duration_min),
      notes: form.notes || null,
    };
    if (form.apartment_id) body.apartment_id = Number(form.apartment_id);
    await api('/visits', { method: 'POST', body });
    setSheet(null);
    load();
  }

  const aptsForBuilding = form.building_id ? apartments.filter(a => a.building_id === Number(form.building_id)) : [];
  const isToday = cursor.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);

  return (
    <div className="panel-page">
      <MobilePageHeader
        title="Kalendarz"
        subtitle={view === 'day'
          ? cursor.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
          : `${weekStart.toLocaleDateString('pl-PL')} – ${weekDays[4].toLocaleDateString('pl-PL')}`}
        right={(
          <div className="flex gap-1 ml-2">
            <button onClick={() => setView('day')} className={`chip ${view === 'day' ? 'chip-active' : 'chip-idle'}`}>Dzień</button>
            <button onClick={() => setView('week')} className={`chip ${view === 'week' ? 'chip-active' : 'chip-idle'}`}>Tydzień</button>
          </div>
        )}
      />

      {/* Nawigacja datami */}
      <div className="flex items-center gap-2">
        <button onClick={() => shift(view === 'day' ? -1 : -7)} className="btn-secondary px-3" aria-label="Poprzedni">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setCursor(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })}
          className={`flex-1 ${isToday ? 'btn-primary' : 'btn-secondary'} py-3`}>
          Dziś
        </button>
        <button onClick={() => shift(view === 'day' ? 1 : 7)} className="btn-secondary px-3" aria-label="Następny">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {view === 'day' ? (
        <section className="mobile-stack">
          {dayVisits.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Brak wizyt"
              body="Dodaj wizytę na ten dzień."
              action={<button onClick={() => openCreate(cursor.toISOString().slice(0, 10))} className="btn-primary">Nowa wizyta</button>}
            />
          ) : (
            dayVisits.map(v => (
              <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`} className="mobile-card flex items-stretch gap-3 active:bg-slate-50">
                <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl ${statusColor[v.status]}`}>
                  <div className="text-lg font-extrabold leading-none">{fmtTime(v.scheduled_at)}</div>
                  <div className="text-[10px] mt-1">{v.duration_min || 60}min</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {v.building_address}{v.apt_number && <span className="text-slate-500"> / m. {v.apt_number}</span>}
                  </div>
                  <div className="text-sm text-slate-500 truncate">{visitTypeLabel[v.type]}</div>
                  <div className="text-xs text-slate-500 mt-1">{statusLabel[v.status]}</div>
                </div>
              </Link>
            ))
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {weekDays.map(d => {
            const iso = d.toISOString().slice(0, 10);
            const vs = visits.filter(v => v.scheduled_at?.slice(0, 10) === iso)
              .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
            const dayIsToday = iso === new Date().toISOString().slice(0, 10);
            return (
              <div key={iso} className="mobile-card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className={`text-xs uppercase font-bold ${dayIsToday ? 'text-orange-600' : 'text-slate-500'}`}>
                      {d.toLocaleDateString('pl-PL', { weekday: 'long' })}
                    </div>
                    <div className="text-lg font-bold text-slate-900">{d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}</div>
                  </div>
                  <button onClick={() => openCreate(iso)} className="btn-ghost text-orange-600">
                    <Plus className="w-4 h-4" /> Dodaj
                  </button>
                </div>
                {vs.length === 0 ? (
                  <div className="text-sm text-slate-400">— wolny dzień —</div>
                ) : (
                  <div className="space-y-2">
                    {vs.map(v => (
                      <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`}
                        className={`block rounded-xl p-2.5 active:opacity-80 ${statusColor[v.status]}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">{fmtTime(v.scheduled_at)}</span>
                          <span className="text-xs">{visitTypeLabel[v.type]}</span>
                        </div>
                        <div className="text-xs truncate mt-0.5">{v.building_address}{v.apt_number ? ` / m. ${v.apt_number}` : ''}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      <div className="mobile-card bg-amber-50 border-amber-200 text-sm text-amber-900">
        <strong>Google Calendar:</strong> dwukierunkowa synchronizacja z kalendarzem kominiarza. Sloty dla mieszkańców wyliczane z wolnych okien.
      </div>

      <button
        type="button"
        onClick={() => openCreate(cursor.toISOString().slice(0, 10))}
        className="fab md:hidden"
        aria-label="Nowa wizyta"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title="Nowa wizyta"
        footer={
          <button form="new-visit-form" type="submit" className="btn-primary w-full py-3.5">
            Zaplanuj wizytę
          </button>
        }
      >
        {sheet && (
          <form id="new-visit-form" onSubmit={create} className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm">
              📅 {new Date(sheet.date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
              {sheet.time && ` o ${sheet.time}`}
            </div>
            {!sheet.time && (
              <div>
                <label className="form-label">Godzina</label>
                <select
                  className="form-input"
                  value={form._hour || '09:00'}
                  onChange={e => { const v = e.target.value; setForm(f => ({ ...f, _hour: v })); setSheet(s => ({ ...s, time: v })); }}
                >
                  {HOURS.map(h => <option key={h} value={`${String(h).padStart(2, '0')}:00`}>{String(h).padStart(2, '0')}:00</option>)}
                </select>
              </div>
            )}
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
              <label className="form-label">Rodzaj</label>
              <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Czas (min)</label>
              <input className="form-input" type="number" min="15" step="15" inputMode="numeric"
                value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Uwagi</label>
              <textarea className="form-input resize-none" rows="2"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
