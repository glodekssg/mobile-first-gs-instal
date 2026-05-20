import { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, RefreshCw, Building2, Users, Home, Wind } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import {
  createCooperative, cooperativeFields,
  createBuilding, buildingFields,
} from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import EmptyState from '../../components/mobile/EmptyState';

const TABS = [
  { k: 'coops', label: 'Spółdzielnie', icon: Users },
  { k: 'buildings', label: 'Budynki', icon: Building2 },
  { k: 'apartments', label: 'Mieszkania', icon: Home },
  { k: 'chimneys', label: 'Przewody', icon: Wind },
];

export default function AdminData() {
  const [tab, setTab] = useState('coops');

  return (
    <div className="panel-page">
      <MobilePageHeader title="Dane biznesowe" subtitle="CRUD danych podstawowych" />

      <div className="chip-row">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`chip ${tab === t.k ? 'chip-active' : 'chip-idle'}`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'coops' && <Cooperatives />}
      {tab === 'buildings' && <Buildings />}
      {tab === 'apartments' && <Apartments />}
      {tab === 'chimneys' && <Chimneys />}
    </div>
  );
}

function Cooperatives() {
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(null);

  function load() {
    api('/cooperatives').then(setRows);
    api('/admin/users').then(setUsers);
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    if (edit.id) await api(`/cooperatives/${edit.id}`, { method: 'PATCH', body: edit });
    else await api('/cooperatives', { method: 'POST', body: edit });
    setEdit(null); load();
  }
  async function del(id) {
    if (!confirm('Usunąć? Powiązane budynki zostaną oderwane.')) return;
    await api(`/cooperatives/${id}`, { method: 'DELETE' });
    load();
  }

  const zarzadcy = users.filter(u => u.role === 'zarzadca');

  return (
    <>
      <div className="mobile-stack">
        {rows.length === 0 ? <EmptyState icon={Users} title="Brak spółdzielni" /> : rows.map(r => (
          <article key={r.id} className="mobile-card">
            <div className="font-bold text-slate-900">{r.name}</div>
            <div className="text-xs text-slate-500">
              {r.nip ? `NIP ${r.nip}` : ''}{r.address ? ` • ${r.address}` : ''}
            </div>
            <div className="text-xs text-slate-400 mt-1">{r.buildings_count} budynk(ów)</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEdit({ ...r })} className="btn-secondary flex-1">
                <Edit3 className="w-4 h-4" /> Edytuj
              </button>
              <button onClick={() => del(r.id)} className="btn-secondary text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <button onClick={() => setEdit({ name: '', nip: '', address: '', contact_id: '' })} className="fab md:hidden" aria-label="Nowa spółdzielnia">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edytuj spółdzielnię' : 'Nowa spółdzielnia'}
        footer={<button form="coop-form" type="submit" className="btn-primary w-full py-3.5">{edit?.id ? 'Zapisz' : 'Utwórz'}</button>}
      >
        {edit && (
          <form id="coop-form" onSubmit={save} className="space-y-3">
            <div>
              <label className="form-label">Nazwa</label>
              <input className="form-input" required placeholder="SM «Słoneczna»"
                value={edit.name || ''} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">NIP</label>
              <input className="form-input" value={edit.nip || ''} onChange={e => setEdit(s => ({ ...s, nip: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Adres</label>
              <input className="form-input" value={edit.address || ''} onChange={e => setEdit(s => ({ ...s, address: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Zarządca</label>
              <select className="form-input" value={edit.contact_id || ''} onChange={e => setEdit(s => ({ ...s, contact_id: e.target.value }))}>
                <option value="">— bez zarządcy —</option>
                {zarzadcy.map(z => <option key={z.id} value={z.id}>{z.full_name} ({z.email})</option>)}
              </select>
            </div>
          </form>
        )}
      </BottomSheet>
    </>
  );
}

function Buildings() {
  const [rows, setRows] = useState([]);
  const [coops, setCoops] = useState([]);
  const [edit, setEdit] = useState(null);

  function load() {
    api('/buildings').then(setRows);
    api('/cooperatives').then(setCoops);
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    const body = { ...edit };
    if (body.apartments_count) body.apartments_count = Number(body.apartments_count);
    if (edit.id) await api(`/buildings/${edit.id}`, { method: 'PATCH', body });
    else await api('/buildings', { method: 'POST', body });
    setEdit(null); load();
  }
  async function del(id) {
    if (!confirm('Usunąć budynek? Powiązane mieszkania, przewody i wizyty znikną.')) return;
    await api(`/buildings/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <>
      <div className="mobile-stack">
        {rows.length === 0 ? <EmptyState icon={Building2} title="Brak budynków" /> : rows.map(r => (
          <article key={r.id} className="mobile-card">
            <div className="font-bold text-slate-900">{r.address}</div>
            <div className="text-xs text-slate-500">{r.city} • {r.type}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="chip chip-idle">{r.apartments_count} mieszkań</span>
              {r.cooperative_name && <span className="chip bg-blue-100 text-blue-700">{r.cooperative_name}</span>}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEdit({ ...r })} className="btn-secondary flex-1">
                <Edit3 className="w-4 h-4" /> Edytuj
              </button>
              <button onClick={() => del(r.id)} className="btn-secondary text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <button onClick={() => setEdit({ cooperative_id: '', address: '', city: '', postal_code: '', type: 'wielorodzinny', apartments_count: 1 })}
        className="fab md:hidden" aria-label="Nowy budynek">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edytuj budynek' : 'Nowy budynek'}
        footer={<button form="b-form" type="submit" className="btn-primary w-full py-3.5">{edit?.id ? 'Zapisz' : 'Utwórz'}</button>}
      >
        {edit && (
          <form id="b-form" onSubmit={save} className="space-y-3">
            <div>
              <label className="form-label">Adres</label>
              <input className="form-input" required placeholder="ul. ..."
                value={edit.address || ''} onChange={e => setEdit(s => ({ ...s, address: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Miasto</label>
                <input className="form-input" value={edit.city || ''} onChange={e => setEdit(s => ({ ...s, city: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Kod pocztowy</label>
                <input className="form-input" value={edit.postal_code || ''} onChange={e => setEdit(s => ({ ...s, postal_code: e.target.value }))} />
              </div>
            </div>
            <SelectOrCreate
              label="Spółdzielnia"
              value={edit.cooperative_id || ''}
              onChange={v => setEdit(s => ({ ...s, cooperative_id: v }))}
              options={coops}
              getLabel={c => c.name}
              emptyLabel="— bez spółdzielni —"
              createTitle="Nowa spółdzielnia"
              createFields={cooperativeFields}
              onCreate={async (data) => {
                const c = await createCooperative(data);
                const next = await api('/cooperatives');
                setCoops(next);
                return c;
              }}
            />
            <div>
              <label className="form-label">Typ</label>
              <select className="form-input" value={edit.type || 'wielorodzinny'} onChange={e => setEdit(s => ({ ...s, type: e.target.value }))}>
                <option value="wielorodzinny">Wielorodzinny</option>
                <option value="jednorodzinny">Jednorodzinny</option>
                <option value="uslugowy">Usługowy</option>
              </select>
            </div>
            <div>
              <label className="form-label">Liczba mieszkań</label>
              <input className="form-input" type="number" inputMode="numeric" min="1"
                value={edit.apartments_count || ''} onChange={e => setEdit(s => ({ ...s, apartments_count: e.target.value }))} />
            </div>
          </form>
        )}
      </BottomSheet>
    </>
  );
}

function Apartments() {
  const [rows, setRows] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState(null);

  function load() {
    api('/apartments').then(setRows);
    api('/buildings').then(setBuildings);
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    if (edit.id) await api(`/apartments/${edit.id}`, { method: 'PATCH', body: edit });
    else await api('/apartments', { method: 'POST', body: edit });
    setEdit(null); load();
  }
  async function regen(id) {
    const r = await api(`/apartments/${id}/regenerate-code`, { method: 'POST' });
    alert(`Nowy kod zaproszenia: ${r.invite_code}\n\nMieszkaniec został odłączony.`);
    load();
  }
  async function del(id) {
    if (!confirm('Usunąć mieszkanie? Powiązane wizyty i przewody znikną.')) return;
    await api(`/apartments/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = filter ? rows.filter(r => r.building_id === Number(filter)) : rows;

  return (
    <>
      <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Wszystkie budynki ({rows.length})</option>
        {buildings.map(b => <option key={b.id} value={b.id}>{b.address}</option>)}
      </select>

      <div className="mobile-stack">
        {filtered.length === 0 ? <EmptyState icon={Home} title="Brak mieszkań" /> : filtered.map(r => (
          <article key={r.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900">{r.building_address} m. {r.number}</div>
                <div className="text-xs text-slate-500">{r.floor ? `p. ${r.floor}` : ''}</div>
                <div className="text-sm text-slate-600 mt-0.5">
                  {r.resident_name || <span className="text-slate-400">nieprzypisany</span>}
                </div>
              </div>
              <code className="text-xs bg-slate-100 px-2 py-1 rounded">{r.resident_invite_code}</code>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEdit({ ...r })} className="btn-secondary flex-1">
                <Edit3 className="w-4 h-4" /> Edytuj
              </button>
              <button onClick={() => regen(r.id)} className="btn-secondary flex-1 text-blue-600">
                <RefreshCw className="w-4 h-4" /> Nowy kod
              </button>
              <button onClick={() => del(r.id)} className="btn-secondary text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <button onClick={() => setEdit({ building_id: buildings[0]?.id || '', number: '', floor: '' })}
        className="fab md:hidden" aria-label="Nowe mieszkanie">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edytuj mieszkanie' : 'Nowe mieszkanie'}
        footer={<button form="apt-form" type="submit" className="btn-primary w-full py-3.5">{edit?.id ? 'Zapisz' : 'Utwórz'}</button>}
      >
        {edit && (
          <form id="apt-form" onSubmit={save} className="space-y-3">
            <SelectOrCreate
              label="Budynek"
              value={edit.building_id || ''}
              onChange={v => setEdit(s => ({ ...s, building_id: Number(v) }))}
              options={buildings}
              getLabel={b => `${b.address}, ${b.city || ''}`}
              required
              disabled={!!edit.id}
              createTitle="Nowy budynek"
              createFields={buildingFields}
              onCreate={async (data) => {
                const b = await createBuilding(data);
                const next = await api('/buildings');
                setBuildings(next);
                return b;
              }}
            />
            <div>
              <label className="form-label">Numer</label>
              <input className="form-input" required placeholder="3"
                value={edit.number || ''} onChange={e => setEdit(s => ({ ...s, number: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Piętro</label>
              <input className="form-input" placeholder="2"
                value={edit.floor || ''} onChange={e => setEdit(s => ({ ...s, floor: e.target.value }))} />
            </div>
          </form>
        )}
      </BottomSheet>
    </>
  );
}

function Chimneys() {
  const [rows, setRows] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [filter, setFilter] = useState('');
  const [edit, setEdit] = useState(null);

  function load() {
    api('/chimneys').then(setRows);
    api('/buildings').then(setBuildings);
    api('/apartments').then(setApartments);
  }
  useEffect(load, []);

  async function save(e) {
    e.preventDefault();
    const body = { ...edit };
    if (body.length_m) body.length_m = parseFloat(body.length_m);
    if (body.installed_year) body.installed_year = parseInt(body.installed_year);
    if (edit.id) await api(`/chimneys/${edit.id}`, { method: 'PATCH', body });
    else await api('/chimneys', { method: 'POST', body });
    setEdit(null); load();
  }
  async function del(id) {
    if (!confirm('Usunąć przewód?')) return;
    await api(`/chimneys/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = filter ? rows.filter(r => r.building_id === Number(filter)) : rows;
  const aptsForBuilding = edit?.building_id ? apartments.filter(a => a.building_id === Number(edit.building_id)) : [];

  return (
    <>
      <select className="form-input" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Wszystkie budynki ({rows.length})</option>
        {buildings.map(b => <option key={b.id} value={b.id}>{b.address}</option>)}
      </select>

      <div className="mobile-stack">
        {filtered.length === 0 ? <EmptyState icon={Wind} title="Brak przewodów" /> : filtered.map(r => (
          <article key={r.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 capitalize">{r.kind}{r.device ? ` — ${r.device}` : ''}</div>
                <div className="text-xs text-slate-500">{r.building_address}{r.apt_number ? `, m. ${r.apt_number}` : ' (wspólny)'}</div>
                <div className="text-xs text-slate-500 mt-0.5">{r.fuel || '—'} • ost. kontrola {fmtDate(r.last_inspection)}</div>
              </div>
              <div className="flex flex-col gap-1">
                {r.has_wklad && <span className="chip bg-emerald-100 text-emerald-700">Wkład</span>}
                {r.has_nasada && <span className="chip bg-emerald-100 text-emerald-700">Nasada</span>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEdit({ ...r })} className="btn-secondary flex-1">
                <Edit3 className="w-4 h-4" /> Edytuj
              </button>
              <button onClick={() => del(r.id)} className="btn-secondary text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </article>
        ))}
      </div>

      <button onClick={() => setEdit({ building_id: buildings[0]?.id || '', kind: 'spalinowy', has_nasada: 0, has_wklad: 0 })}
        className="fab md:hidden" aria-label="Nowy przewód">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edytuj przewód' : 'Nowy przewód'}
        footer={<button form="ch-form" type="submit" className="btn-primary w-full py-3.5">{edit?.id ? 'Zapisz' : 'Utwórz'}</button>}
      >
        {edit && (
          <form id="ch-form" onSubmit={save} className="space-y-3">
            <SelectOrCreate
              label="Budynek"
              value={edit.building_id || ''}
              onChange={v => setEdit(s => ({ ...s, building_id: Number(v), apartment_id: null }))}
              options={buildings}
              getLabel={b => b.address}
              required
              disabled={!!edit.id}
              createTitle="Nowy budynek"
              createFields={buildingFields}
              onCreate={async (data) => {
                const b = await createBuilding(data);
                const next = await api('/buildings');
                setBuildings(next);
                return b;
              }}
            />
            <div>
              <label className="form-label">Mieszkanie</label>
              <select className="form-input" value={edit.apartment_id || ''}
                onChange={e => setEdit(s => ({ ...s, apartment_id: e.target.value ? Number(e.target.value) : null }))}>
                <option value="">— wspólny dla budynku —</option>
                {aptsForBuilding.map(a => <option key={a.id} value={a.id}>m. {a.number}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Typ</label>
              <select className="form-input" required value={edit.kind || 'spalinowy'}
                onChange={e => setEdit(s => ({ ...s, kind: e.target.value }))}>
                <option value="dymowy">Dymowy</option>
                <option value="spalinowy">Spalinowy</option>
                <option value="wentylacyjny">Wentylacyjny</option>
              </select>
            </div>
            <div>
              <label className="form-label">Paliwo</label>
              <select className="form-input" value={edit.fuel || ''} onChange={e => setEdit(s => ({ ...s, fuel: e.target.value }))}>
                <option value="">— paliwo —</option>
                <option value="gaz">Gaz</option>
                <option value="olej">Olej opałowy</option>
                <option value="stale">Paliwo stałe</option>
                <option value="brak">Brak (wentylacja)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Urządzenie</label>
              <input className="form-input" placeholder="np. kocioł gazowy"
                value={edit.device || ''} onChange={e => setEdit(s => ({ ...s, device: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Materiał</label>
              <select className="form-input" value={edit.material || ''} onChange={e => setEdit(s => ({ ...s, material: e.target.value }))}>
                <option value="">— materiał —</option>
                <option value="ceramika">Ceramika</option>
                <option value="stal">Stal</option>
                <option value="murowany">Murowany</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Ost. kontrola</label>
                <input className="form-input" type="date"
                  value={edit.last_inspection || ''} onChange={e => setEdit(s => ({ ...s, last_inspection: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Ost. czyszczenie</label>
                <input className="form-input" type="date"
                  value={edit.last_cleaning || ''} onChange={e => setEdit(s => ({ ...s, last_cleaning: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={!!edit.has_wklad}
                  onChange={e => setEdit(s => ({ ...s, has_wklad: e.target.checked ? 1 : 0 }))} />
                <span className="font-semibold text-sm">Wkład</span>
              </label>
              <label className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={!!edit.has_nasada}
                  onChange={e => setEdit(s => ({ ...s, has_nasada: e.target.checked ? 1 : 0 }))} />
                <span className="font-semibold text-sm">Nasada</span>
              </label>
            </div>
          </form>
        )}
      </BottomSheet>
    </>
  );
}
