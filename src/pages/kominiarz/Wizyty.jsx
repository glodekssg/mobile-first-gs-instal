import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, X, MapPin, ClipboardList } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusLabel } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createBuilding, buildingFields, createApartment } from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';
import StatusBadge from '../../components/mobile/StatusBadge';

const TYPES = ['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'];
const STATUSES = ['umowiona', 'zakonczona', 'odwolana', 'odmowa_wpuszczenia'];

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

  useEffect(() => {
    const bid = params.get('building_id');
    const aid = params.get('apartment_id');
    if (bid || aid) {
      setForm(f => ({ ...f, building_id: bid || '', apartment_id: aid || '' }));
      setShow(true);
    }
    // eslint-disable-next-line
  }, []);

  let filtered = visits;
  if (filter !== 'all') filtered = filtered.filter(v => v.status === filter);
  if (dateFilter) filtered = filtered.filter(v => v.scheduled_at?.slice(0, 10) === dateFilter);

  const filters = useMemo(() => ([
    { value: null, label: 'Wszystkie', count: visits.length },
    ...STATUSES.map(s => ({ value: s, label: statusLabel[s], count: visits.filter(v => v.status === s).length })),
  ]), [visits]);

  function setFilter(s) {
    const next = new URLSearchParams(params);
    if (!s) next.delete('status'); else next.set('status', s);
    setParams(next);
  }

  async function create(e) {
    e.preventDefault();
    const body = { ...form };
    if (!body.apartment_id) delete body.apartment_id;
    else body.apartment_id = Number(body.apartment_id);
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
    <div className="panel-page">
      <MobilePageHeader title="Wizyty" subtitle={dateFilter ? `Data: ${dateFilter}` : undefined} />

      {dateFilter && (
        <button
          onClick={() => { const n = new URLSearchParams(params); n.delete('date'); setParams(n); }}
          className="chip chip-idle self-start"
        >
          <X className="w-3 h-3" /> wyczyść filtr daty
        </button>
      )}

      <FilterBar filters={filters} value={filter === 'all' ? null : filter} onChange={setFilter} />

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Brak wizyt" body="Spróbuj zmienić filtr albo dodaj nową wizytę." />
        ) : (
          filtered.map(v => (
            <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`} className="mobile-card active:bg-slate-50 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 mb-0.5">{fmtDateTime(v.scheduled_at)}</div>
                <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {v.building_address}{v.apt_number && <span className="text-slate-500"> / m. {v.apt_number}</span>}
                </div>
                <div className="text-sm text-slate-500">{visitTypeLabel[v.type] || v.type}</div>
                <StatusBadge status={v.status} className="mt-2" />
              </div>
            </Link>
          ))
        )}
      </div>

      <button onClick={() => setShow(true)} className="fab md:hidden" aria-label="Nowa wizyta">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
      <button onClick={() => setShow(true)} className="btn-primary hidden md:inline-flex fixed top-6 right-8 z-30">
        <Plus className="w-4 h-4" /> Nowa wizyta
      </button>

      <BottomSheet
        open={show}
        onClose={() => setShow(false)}
        title="Nowa wizyta"
        footer={
          <button form="new-visit-form-wiz" type="submit" className="btn-primary w-full py-3.5">
            Zaplanuj wizytę
          </button>
        }
      >
        <form id="new-visit-form-wiz" onSubmit={create} className="space-y-3">
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
            <label className="form-label">Termin</label>
            <input className="form-input" type="datetime-local" required
              value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="form-label">Rodzaj</label>
              <select className="form-input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Czas (min)</label>
              <input className="form-input" type="number" min="15" step="15" inputMode="numeric"
                value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Uwagi</label>
            <textarea className="form-input resize-none" rows="2"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
