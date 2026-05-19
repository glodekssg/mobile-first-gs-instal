import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import {
  createCooperative, cooperativeFields,
  createBuilding, buildingFields,
} from '../../lib/creators';

const TABS = ['Spółdzielnie', 'Budynki', 'Mieszkania', 'Przewody'];

export default function AdminData() {
  const [tab, setTab] = useState('Spółdzielnie');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Dane biznesowe</h1>
        <p className="text-slate-500 text-sm">CRUD spółdzielni, budynków, mieszkań, przewodów.</p>
      </div>

      <div className="flex gap-2 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Spółdzielnie' && <Cooperatives />}
      {tab === 'Budynki' && <Buildings />}
      {tab === 'Mieszkania' && <Apartments />}
      {tab === 'Przewody' && <Chimneys />}
    </div>
  );
}

function Modal({ children, onClose }) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
      <button onClick={onClose} className="float-right text-slate-400">✕</button>{children}
    </div></div>;
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
    if (!confirm('Usunąć? Powiązane budynki zostaną oderwane od spółdzielni (nie usunięte).')) return;
    await api(`/cooperatives/${id}`, { method: 'DELETE' });
    load();
  }

  const zarzadcy = users.filter(u => u.role === 'zarzadca');

  return <>
    <div className="flex justify-end">
      <button onClick={() => setEdit({ name: '', nip: '', address: '', contact_id: '' })}
        className="px-4 py-2 bg-orange-500 text-white rounded">+ Nowa spółdzielnia</button>
    </div>
    <div className="bg-white rounded-xl border overflow-hidden mt-3">
      <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr><th className="text-left p-3">Nazwa</th><th className="text-left p-3">NIP</th><th className="text-left p-3">Adres</th><th className="text-left p-3">Budynki</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="p-3 font-medium">{r.name}</td>
              <td className="p-3 text-slate-500">{r.nip || '—'}</td>
              <td className="p-3 text-slate-500">{r.address || '—'}</td>
              <td className="p-3">{r.buildings_count}</td>
              <td className="p-3 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...r })} className="text-orange-600 text-sm hover:underline mr-3">Edytuj</button>
                <button onClick={() => del(r.id)} className="text-rose-600 text-sm hover:underline">Usuń</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">Brak.</td></tr>}
        </tbody>
      </table></div>
    </div>

    {edit && (
      <Modal onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <h3 className="font-semibold text-lg">{edit.id ? 'Edytuj spółdzielnię' : 'Nowa spółdzielnia'}</h3>
          <input className="w-full border rounded p-2" required placeholder="Nazwa (np. SM «Słoneczna»)"
            value={edit.name || ''} onChange={e => setEdit(s => ({ ...s, name: e.target.value }))} />
          <input className="w-full border rounded p-2" placeholder="NIP"
            value={edit.nip || ''} onChange={e => setEdit(s => ({ ...s, nip: e.target.value }))} />
          <input className="w-full border rounded p-2" placeholder="Adres"
            value={edit.address || ''} onChange={e => setEdit(s => ({ ...s, address: e.target.value }))} />
          <select className="w-full border rounded p-2" value={edit.contact_id || ''}
            onChange={e => setEdit(s => ({ ...s, contact_id: e.target.value }))}>
            <option value="">— bez zarządcy —</option>
            {zarzadcy.map(z => <option key={z.id} value={z.id}>{z.full_name} ({z.email})</option>)}
          </select>
          <button className="w-full bg-orange-500 text-white py-2 rounded">{edit.id ? 'Zapisz' : 'Utwórz'}</button>
        </form>
      </Modal>
    )}
  </>;
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
    if (!confirm('Usunąć budynek? Wszystkie powiązane mieszkania, przewody i wizyty znikną.')) return;
    await api(`/buildings/${id}`, { method: 'DELETE' });
    load();
  }

  return <>
    <div className="flex justify-end">
      <button onClick={() => setEdit({ cooperative_id: '', address: '', city: '', postal_code: '', type: 'wielorodzinny', apartments_count: 1 })}
        className="px-4 py-2 bg-orange-500 text-white rounded">+ Nowy budynek</button>
    </div>
    <div className="bg-white rounded-xl border overflow-hidden mt-3">
      <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr><th className="text-left p-3">Adres</th><th className="text-left p-3">Miasto</th><th className="text-left p-3">Spółdzielnia</th><th className="text-left p-3">Typ</th><th className="text-left p-3">Mieszkań</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="p-3 font-medium">{r.address}</td>
              <td className="p-3 text-slate-500">{r.city}</td>
              <td className="p-3 text-slate-500">{r.cooperative_name || '—'}</td>
              <td className="p-3">{r.type}</td>
              <td className="p-3">{r.apartments_count}</td>
              <td className="p-3 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...r })} className="text-orange-600 text-sm hover:underline mr-3">Edytuj</button>
                <button onClick={() => del(r.id)} className="text-rose-600 text-sm hover:underline">Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>

    {edit && (
      <Modal onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <h3 className="font-semibold text-lg">{edit.id ? 'Edytuj budynek' : 'Nowy budynek'}</h3>
          <input className="w-full border rounded p-2" required placeholder="Adres (ul. ...)"
            value={edit.address || ''} onChange={e => setEdit(s => ({ ...s, address: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded p-2" placeholder="Miasto"
              value={edit.city || ''} onChange={e => setEdit(s => ({ ...s, city: e.target.value }))} />
            <input className="border rounded p-2" placeholder="Kod pocztowy"
              value={edit.postal_code || ''} onChange={e => setEdit(s => ({ ...s, postal_code: e.target.value }))} />
          </div>
          <SelectOrCreate
            label="Spółdzielnia"
            value={edit.cooperative_id || ''}
            onChange={v => setEdit(s => ({ ...s, cooperative_id: v }))}
            options={coops}
            getLabel={c => c.name}
            emptyLabel="— bez spółdzielni (dom prywatny) —"
            createTitle="Nowa spółdzielnia"
            createFields={cooperativeFields}
            onCreate={async (data) => {
              const c = await createCooperative(data);
              const next = await api('/cooperatives');
              setCoops(next);
              return c;
            }}
          />
          <select className="w-full border rounded p-2" value={edit.type || 'wielorodzinny'}
            onChange={e => setEdit(s => ({ ...s, type: e.target.value }))}>
            <option value="wielorodzinny">Wielorodzinny</option>
            <option value="jednorodzinny">Jednorodzinny</option>
            <option value="uslugowy">Usługowy</option>
          </select>
          <input className="w-full border rounded p-2" type="number" min="1" placeholder="Liczba mieszkań"
            value={edit.apartments_count || ''} onChange={e => setEdit(s => ({ ...s, apartments_count: e.target.value }))} />
          <button className="w-full bg-orange-500 text-white py-2 rounded">{edit.id ? 'Zapisz' : 'Utwórz'}</button>
        </form>
      </Modal>
    )}
  </>;
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
    if (edit.id) {
      await api(`/apartments/${edit.id}`, { method: 'PATCH', body: edit });
    } else {
      await api('/apartments', { method: 'POST', body: edit });
    }
    setEdit(null); load();
  }
  async function regen(id) {
    const r = await api(`/apartments/${id}/regenerate-code`, { method: 'POST' });
    alert(`Nowy kod zaproszenia: ${r.invite_code}\n\nMieszkaniec został odłączony — musi użyć nowego kodu.`);
    load();
  }
  async function del(id) {
    if (!confirm('Usunąć mieszkanie? Powiązane wizyty i przewody znikną.')) return;
    await api(`/apartments/${id}`, { method: 'DELETE' });
    load();
  }

  const filtered = filter ? rows.filter(r => r.building_id === Number(filter)) : rows;

  return <>
    <div className="flex justify-between items-center">
      <select className="border rounded p-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Wszystkie budynki ({rows.length} mieszkań)</option>
        {buildings.map(b => <option key={b.id} value={b.id}>{b.address}</option>)}
      </select>
      <button onClick={() => setEdit({ building_id: buildings[0]?.id || '', number: '', floor: '' })}
        className="px-4 py-2 bg-orange-500 text-white rounded">+ Nowe mieszkanie</button>
    </div>
    <div className="bg-white rounded-xl border overflow-hidden mt-3">
      <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr><th className="text-left p-3">Adres</th><th className="text-left p-3">Numer</th><th className="text-left p-3">Piętro</th><th className="text-left p-3">Mieszkaniec</th><th className="text-left p-3">Kod zaproszenia</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {filtered.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="p-3">{r.building_address}</td>
              <td className="p-3 font-medium">m. {r.number}</td>
              <td className="p-3">{r.floor || '—'}</td>
              <td className="p-3 text-slate-500">{r.resident_name || <span className="text-slate-400">nieprzypisany</span>}</td>
              <td className="p-3"><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{r.resident_invite_code}</code></td>
              <td className="p-3 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...r })} className="text-orange-600 text-sm hover:underline mr-3">Edytuj</button>
                <button onClick={() => regen(r.id)} className="text-blue-600 text-sm hover:underline mr-3">Nowy kod</button>
                <button onClick={() => del(r.id)} className="text-rose-600 text-sm hover:underline">Usuń</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-slate-400">Brak.</td></tr>}
        </tbody>
      </table></div>
    </div>

    {edit && (
      <Modal onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <h3 className="font-semibold text-lg">{edit.id ? 'Edytuj mieszkanie' : 'Nowe mieszkanie'}</h3>
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
          <input className="w-full border rounded p-2" required placeholder="Numer (np. 3)"
            value={edit.number || ''} onChange={e => setEdit(s => ({ ...s, number: e.target.value }))} />
          <input className="w-full border rounded p-2" placeholder="Piętro (np. 2)"
            value={edit.floor || ''} onChange={e => setEdit(s => ({ ...s, floor: e.target.value }))} />
          <button className="w-full bg-orange-500 text-white py-2 rounded">{edit.id ? 'Zapisz' : 'Utwórz (kod zostanie wygenerowany)'}</button>
        </form>
      </Modal>
    )}
  </>;
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
  const aptsForBuilding = edit?.building_id
    ? apartments.filter(a => a.building_id === Number(edit.building_id))
    : [];

  return <>
    <div className="flex justify-between items-center">
      <select className="border rounded p-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="">Wszystkie budynki ({rows.length} przewodów)</option>
        {buildings.map(b => <option key={b.id} value={b.id}>{b.address}</option>)}
      </select>
      <button onClick={() => setEdit({ building_id: buildings[0]?.id || '', kind: 'spalinowy', has_nasada: 0, has_wklad: 0 })}
        className="px-4 py-2 bg-orange-500 text-white rounded">+ Nowy przewód</button>
    </div>

    <div className="bg-white rounded-xl border overflow-hidden mt-3">
      <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
        <thead className="bg-slate-50 text-xs uppercase text-slate-600">
          <tr><th className="text-left p-2">Adres</th><th className="text-left p-2">Lokal</th><th className="text-left p-2">Typ</th><th className="text-left p-2">Paliwo</th><th className="text-left p-2">Urządzenie</th><th className="text-left p-2">Ost. kontrola</th><th className="text-left p-2">Wkład</th><th className="text-left p-2">Nasada</th><th></th></tr>
        </thead>
        <tbody className="divide-y">
          {filtered.map(r => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="p-2">{r.building_address}</td>
              <td className="p-2">{r.apt_number ? `m. ${r.apt_number}` : '—'}</td>
              <td className="p-2 capitalize">{r.kind}</td>
              <td className="p-2">{r.fuel || '—'}</td>
              <td className="p-2 text-slate-500 text-xs">{r.device || '—'}</td>
              <td className="p-2 text-xs">{fmtDate(r.last_inspection)}</td>
              <td className="p-2">{r.has_wklad ? '✓' : '—'}</td>
              <td className="p-2">{r.has_nasada ? '✓' : '—'}</td>
              <td className="p-2 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...r })} className="text-orange-600 text-xs hover:underline mr-2">Edytuj</button>
                <button onClick={() => del(r.id)} className="text-rose-600 text-xs hover:underline">Usuń</button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan="9" className="p-10 text-center text-slate-400">Brak.</td></tr>}
        </tbody>
      </table></div>
    </div>

    {edit && (
      <Modal onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <h3 className="font-semibold text-lg">{edit.id ? 'Edytuj przewód' : 'Nowy przewód'}</h3>
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
          <select className="w-full border rounded p-2" value={edit.apartment_id || ''}
            onChange={e => setEdit(s => ({ ...s, apartment_id: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">— wspólny dla budynku —</option>
            {aptsForBuilding.map(a => <option key={a.id} value={a.id}>m. {a.number}</option>)}
          </select>
          <select className="w-full border rounded p-2" required value={edit.kind || 'spalinowy'}
            onChange={e => setEdit(s => ({ ...s, kind: e.target.value }))}>
            <option value="dymowy">Dymowy</option>
            <option value="spalinowy">Spalinowy</option>
            <option value="wentylacyjny">Wentylacyjny</option>
          </select>
          <select className="w-full border rounded p-2" value={edit.fuel || ''}
            onChange={e => setEdit(s => ({ ...s, fuel: e.target.value }))}>
            <option value="">— paliwo —</option>
            <option value="gaz">Gaz</option>
            <option value="olej">Olej opałowy</option>
            <option value="stale">Paliwo stałe</option>
            <option value="brak">Brak (wentylacja)</option>
          </select>
          <input className="w-full border rounded p-2" placeholder="Urządzenie (np. kocioł gazowy, kominek)"
            value={edit.device || ''} onChange={e => setEdit(s => ({ ...s, device: e.target.value }))} />
          <select className="w-full border rounded p-2" value={edit.material || ''}
            onChange={e => setEdit(s => ({ ...s, material: e.target.value }))}>
            <option value="">— materiał —</option>
            <option value="ceramika">Ceramika</option>
            <option value="stal">Stal</option>
            <option value="murowany">Murowany</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input className="border rounded p-2" type="date" placeholder="Ostatnia kontrola"
              value={edit.last_inspection || ''} onChange={e => setEdit(s => ({ ...s, last_inspection: e.target.value }))} />
            <input className="border rounded p-2" type="date" placeholder="Ostatnie czyszczenie"
              value={edit.last_cleaning || ''} onChange={e => setEdit(s => ({ ...s, last_cleaning: e.target.value }))} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!edit.has_wklad}
              onChange={e => setEdit(s => ({ ...s, has_wklad: e.target.checked ? 1 : 0 }))} /> Wkład</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!edit.has_nasada}
              onChange={e => setEdit(s => ({ ...s, has_nasada: e.target.checked ? 1 : 0 }))} /> Nasada</label>
          </div>
          <button className="w-full bg-orange-500 text-white py-2 rounded">{edit.id ? 'Zapisz' : 'Utwórz'}</button>
        </form>
      </Modal>
    )}
  </>;
}
