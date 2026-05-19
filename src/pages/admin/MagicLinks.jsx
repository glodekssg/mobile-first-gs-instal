// Admin: pełna konfiguracja magic linków
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SlotConfigEditor from '../../components/SlotConfigEditor';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createResident, residentFields, createApartment } from '../../lib/creators';

const SERVICE_TYPES = [
  { k: 'kontrola', l: 'Kontrola okresowa' },
  { k: 'czyszczenie', l: 'Czyszczenie' },
  { k: 'inspekcja_kamera', l: 'Inspekcja kamerą' },
  { k: 'montaz_wkladu', l: 'Montaż wkładu' },
  { k: 'montaz_nasady', l: 'Montaż nasady' },
  { k: 'kontrola_gaz', l: 'Kontrola gazu' },
  { k: 'opinia', l: 'Opinia kominiarska' },
];

const EMPTY = {
  profile_id: '', apartment_id: '',
  full_name: '', phone: '', email: '',
  days: 30,
  slots_from: '', slots_to: '',
  allowed_services: [], suggested_services: [],
  slot_hour_from: null, slot_hour_to: null, slot_duration_min: null, slot_weekdays: [],
};

export default function AdminMagicLinks() {
  const [links, setLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [created, setCreated] = useState(null);

  function load() {
    api('/admin/magic-links').then(setLinks);
    api('/admin/users').then(setUsers);
    api('/buildings').then(async bs => {
      const apts = [];
      for (const b of bs) {
        const d = await api(`/buildings/${b.id}`);
        d.apartments.forEach(a => apts.push({ ...a, building_address: b.address }));
      }
      setApartments(apts);
    });
  }
  useEffect(load, []);

  async function create(e) {
    e.preventDefault();
    const body = { ...form };
    if (!body.profile_id) delete body.profile_id;
    if (!body.apartment_id) delete body.apartment_id;
    if (!body.slots_from) delete body.slots_from;
    else body.slots_from = new Date(body.slots_from).toISOString();
    if (!body.slots_to) delete body.slots_to;
    else body.slots_to = new Date(body.slots_to + 'T23:59:59').toISOString();
    if (body.allowed_services.length === 0) delete body.allowed_services;
    if (body.suggested_services.length === 0) delete body.suggested_services;
    if (body.slot_hour_from == null) delete body.slot_hour_from;
    if (body.slot_hour_to == null) delete body.slot_hour_to;
    if (!body.slot_duration_min) delete body.slot_duration_min;
    if (!body.slot_weekdays || body.slot_weekdays.length === 0) delete body.slot_weekdays;

    const r = await api('/admin/magic-links', { method: 'POST', body });
    setCreated(r);
    load();
  }

  async function revoke(id) {
    if (!confirm('Unieważnić link?')) return;
    await api(`/admin/magic-links/${id}/revoke`, { method: 'POST' });
    load();
  }

  function copy(token) {
    const url = `${location.origin}/p/${token}`;
    navigator.clipboard.writeText(url);
    alert('Skopiowano link:\n' + url);
  }

  function toggleService(field, key) {
    setForm(f => {
      const cur = f[field] || [];
      const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
      return { ...f, [field]: next };
    });
  }

  const residents = users.filter(u => u.role === 'mieszkaniec');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Magic linki</h1>
          <p className="text-slate-500 text-sm">Linki dostępu bez logowania z opcjonalnymi ograniczeniami (zakres dat, dozwolone usługi).</p>
        </div>
        <button onClick={() => { setShow(true); setCreated(null); setForm(EMPTY); }}
          className="px-4 py-2 bg-orange-500 text-white rounded-md">+ Wygeneruj link</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Dla kogo</th>
              <th className="text-left p-3">Adres</th>
              <th className="text-left p-3">Ograniczenia</th>
              <th className="text-left p-3">Wygasa</th>
              <th className="text-left p-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {links.map(l => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium">{l.profile_name || l.full_name || '(anonimowy)'}</div>
                  <div className="text-xs text-slate-500">{l.phone} {l.email}</div>
                </td>
                <td className="p-3 text-slate-500">{l.address || '—'}{l.apt_number ? `, m. ${l.apt_number}` : ''}</td>
                <td className="p-3 text-xs space-y-0.5">
                  {(l.slots_from || l.slots_to) ? (
                    <div className="text-blue-700">📅 {l.slots_from?.slice(0, 10) || '∞'} – {l.slots_to?.slice(0, 10) || '∞'}</div>
                  ) : <div className="text-slate-400">bez limitu dat</div>}
                  {l.allowed_services?.length ? (
                    <div className="text-orange-700">🔧 {l.allowed_services.length} usług</div>
                  ) : null}
                  {l.suggested_services?.length ? (
                    <div className="text-emerald-700">💡 {l.suggested_services.length} sugest.</div>
                  ) : null}
                </td>
                <td className="p-3 text-slate-500 text-xs">{fmtDateTime(l.expires_at)}</td>
                <td className="p-3">
                  {l.revoked ? <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded">Unieważniony</span>
                  : new Date(l.expires_at) < new Date() ? <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Wygasły</span>
                  : <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Aktywny</span>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => copy(l.token)} className="text-orange-600 text-sm hover:underline mr-3">Kopiuj link</button>
                  <a href={`/p/${l.token}`} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline mr-3">Otwórz</a>
                  {!l.revoked && <button onClick={() => revoke(l.id)} className="text-rose-600 text-sm hover:underline">Unieważnij</button>}
                </td>
              </tr>
            ))}
            {links.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-slate-400">Brak magic linków.</td></tr>}
          </tbody>
        </table></div>
      </div>

      {show && (
        <Modal onClose={() => { setShow(false); setCreated(null); }}>
          {created ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">✓ Link wygenerowany</h3>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                <div className="text-xs text-emerald-800 mb-1">Skopiuj i wyślij użytkownikowi:</div>
                <code className="block break-all text-sm">{location.origin}{created.url}</code>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`${location.origin}${created.url}`); alert('Skopiowano!'); }}
                className="w-full bg-orange-500 text-white py-2 rounded">Skopiuj do schowka</button>
              <a href={created.url} target="_blank" rel="noreferrer"
                className="w-full block text-center border py-2 rounded hover:bg-slate-50">Otwórz podgląd</a>
              <button onClick={() => { setShow(false); setCreated(null); }} className="w-full text-sm text-slate-500">Zamknij</button>
            </div>
          ) : (
            <form onSubmit={create} className="space-y-3">
              <h3 className="font-semibold text-lg">Nowy magic link</h3>

              <SelectOrCreate
                label="Mieszkaniec (z bazy — opcjonalnie)"
                value={form.profile_id}
                onChange={v => setForm(f => ({ ...f, profile_id: v }))}
                options={residents}
                getLabel={u => `${u.full_name} (${u.email})`}
                emptyLabel="— anonimowy —"
                createTitle="Nowy mieszkaniec"
                createFields={residentFields}
                onCreate={async (data) => {
                  const r = await createResident(data);
                  const next = await api('/admin/users');
                  setUsers(next);
                  return r;
                }}
              />
              <SelectOrCreate
                label="Mieszkanie"
                value={form.apartment_id}
                onChange={v => setForm(f => ({ ...f, apartment_id: v }))}
                options={apartments}
                getLabel={a => `${a.building_address}, m. ${a.number}`}
                emptyLabel="— bez przypisania —"
                createTitle="Szybkie nowe mieszkanie"
                createFields={[
                  { k: 'building_id', label: 'ID budynku', required: true, type: 'number' },
                  { k: 'number', label: 'Numer', required: true },
                  { k: 'floor', label: 'Piętro' },
                ]}
                onCreate={async (data) => {
                  const a = await createApartment(data);
                  load();
                  return a;
                }}
              />
              <input className="w-full border rounded p-2" placeholder="Imię i nazwisko (gdy bez profilu)"
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded p-2" placeholder="Telefon" type="tel"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                <input className="border rounded p-2" placeholder="Email" type="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div className="border-t pt-3">
                <label className="text-sm font-medium block mb-2">📅 Zakres dat dostępnych slotów</label>
                <div className="grid grid-cols-2 gap-2">
                  <input className="border rounded p-2 text-sm" type="date"
                    value={form.slots_from} onChange={e => setForm(f => ({ ...f, slots_from: e.target.value }))} />
                  <input className="border rounded p-2 text-sm" type="date"
                    value={form.slots_to} onChange={e => setForm(f => ({ ...f, slots_to: e.target.value }))} />
                </div>
              </div>

              <SlotConfigEditor form={form} setForm={setForm} />

              <div className="border-t pt-3">
                <label className="text-sm font-medium block mb-2">🔧 Dozwolone usługi (puste = wszystkie)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SERVICE_TYPES.map(s => (
                    <label key={s.k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.allowed_services.includes(s.k)}
                        onChange={() => toggleService('allowed_services', s.k)} />
                      {s.l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3">
                <label className="text-sm font-medium block mb-2">💡 Sugerowane (CTA dla mieszkańca)</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SERVICE_TYPES.map(s => (
                    <label key={s.k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.suggested_services.includes(s.k)}
                        onChange={() => toggleService('suggested_services', s.k)} />
                      {s.l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <label className="text-sm">Ważność linku:</label>
                <select className="border rounded p-1.5 text-sm" value={form.days}
                  onChange={e => setForm(f => ({ ...f, days: Number(e.target.value) }))}>
                  <option value={7}>7 dni</option>
                  <option value={30}>30 dni</option>
                  <option value={90}>90 dni</option>
                  <option value={365}>1 rok</option>
                </select>
              </div>

              <button className="w-full bg-orange-500 text-white py-2 rounded font-medium">Wygeneruj link</button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
function Modal({ children, onClose }) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
      <button onClick={onClose} className="float-right text-slate-400">✕</button>
      {children}
    </div>
  </div>;
}
