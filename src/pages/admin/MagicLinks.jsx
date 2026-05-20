import { useEffect, useState } from 'react';
import { Plus, Copy, ExternalLink, Ban, Link as LinkIcon, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SlotConfigEditor from '../../components/SlotConfigEditor';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createResident, residentFields, createApartment } from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import EmptyState from '../../components/mobile/EmptyState';

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
  const [copied, setCopied] = useState(null);

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
    setCopied(token);
    setTimeout(() => setCopied(null), 1500);
  }
  function toggleService(field, key) {
    setForm(f => {
      const cur = f[field] || [];
      const next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
      return { ...f, [field]: next };
    });
  }
  function openNew() { setShow(true); setCreated(null); setForm(EMPTY); }

  const residents = users.filter(u => u.role === 'mieszkaniec');

  return (
    <div className="panel-page">
      <MobilePageHeader title="Magic linki" subtitle="Dostęp bez logowania" />

      <div className="mobile-stack">
        {links.length === 0 ? (
          <EmptyState icon={LinkIcon} title="Brak linków" />
        ) : (
          links.map(l => {
            const isExpired = new Date(l.expires_at) < new Date();
            const stateChip = l.revoked
              ? { label: 'Unieważniony', cls: 'bg-rose-100 text-rose-700' }
              : isExpired ? { label: 'Wygasły', cls: 'bg-slate-100 text-slate-500' }
              : { label: 'Aktywny', cls: 'bg-emerald-100 text-emerald-700' };
            return (
              <article key={l.id} className="mobile-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{l.profile_name || l.full_name || '(anonim)'}</div>
                    <div className="text-xs text-slate-500 truncate">{l.phone} {l.email}</div>
                  </div>
                  <span className={`chip ${stateChip.cls} flex-shrink-0`}>{stateChip.label}</span>
                </div>
                {l.address && <div className="text-xs text-slate-500 mt-2">📍 {l.address}{l.apt_number ? `, m. ${l.apt_number}` : ''}</div>}
                <div className="text-xs text-slate-400 mt-1">do {fmtDateTime(l.expires_at).split(',')[0]}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => copy(l.token)} className="btn-secondary flex-1">
                    {copied === l.token ? <><Check className="w-4 h-4 text-emerald-600" /> OK</> : <><Copy className="w-4 h-4" /> Kopiuj</>}
                  </button>
                  <a href={`/p/${l.token}`} target="_blank" rel="noreferrer" className="btn-secondary flex-1">
                    <ExternalLink className="w-4 h-4" /> Otwórz
                  </a>
                  {!l.revoked && (
                    <button onClick={() => revoke(l.id)} className="btn-secondary text-rose-600">
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <button onClick={openNew} className="fab md:hidden" aria-label="Wygeneruj link">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={show}
        onClose={() => { setShow(false); setCreated(null); }}
        title={created ? '✓ Link gotowy' : 'Nowy magic link'}
        footer={created ? null : (
          <button form="aml-form" type="submit" className="btn-primary w-full py-3.5">Wygeneruj link</button>
        )}
      >
        {created ? (
          <div className="space-y-3">
            <code className="block break-all bg-emerald-50 p-3 rounded-xl text-xs">{location.origin}{created.url}</code>
            <button onClick={() => { navigator.clipboard.writeText(`${location.origin}${created.url}`); alert('Skopiowano!'); }}
              className="btn-primary w-full py-3">
              <Copy className="w-4 h-4" /> Skopiuj
            </button>
            <a href={created.url} target="_blank" rel="noreferrer" className="btn-secondary w-full py-3">
              <ExternalLink className="w-4 h-4" /> Podgląd
            </a>
          </div>
        ) : (
          <form id="aml-form" onSubmit={create} className="space-y-3">
            <SelectOrCreate
              label="Mieszkaniec (opcjonalnie)"
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
            <div>
              <label className="form-label">Imię i nazwisko (gdy bez profilu)</label>
              <input className="form-input" autoComplete="name"
                value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="form-label">Telefon</label>
                <input className="form-input" type="tel" inputMode="tel"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="form-input" type="email" inputMode="email"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <details>
              <summary className="form-label cursor-pointer">📅 Zakres dat (opcjonalnie)</summary>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className="form-input" type="date"
                  value={form.slots_from} onChange={e => setForm(f => ({ ...f, slots_from: e.target.value }))} />
                <input className="form-input" type="date"
                  value={form.slots_to} onChange={e => setForm(f => ({ ...f, slots_to: e.target.value }))} />
              </div>
            </details>

            <details>
              <summary className="form-label cursor-pointer">⏰ Sloty</summary>
              <div className="mt-2">
                <SlotConfigEditor form={form} setForm={setForm} />
              </div>
            </details>

            <details>
              <summary className="form-label cursor-pointer">🔧 Dozwolone usługi</summary>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {SERVICE_TYPES.map(s => (
                  <label key={s.k} className="flex items-center gap-2 text-sm py-1.5">
                    <input type="checkbox" className="w-5 h-5 accent-orange-500"
                      checked={form.allowed_services.includes(s.k)}
                      onChange={() => toggleService('allowed_services', s.k)} />
                    {s.l}
                  </label>
                ))}
              </div>
            </details>

            <details>
              <summary className="form-label cursor-pointer">💡 Sugerowane (CTA)</summary>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {SERVICE_TYPES.map(s => (
                  <label key={s.k} className="flex items-center gap-2 text-sm py-1.5">
                    <input type="checkbox" className="w-5 h-5 accent-orange-500"
                      checked={form.suggested_services.includes(s.k)}
                      onChange={() => toggleService('suggested_services', s.k)} />
                    {s.l}
                  </label>
                ))}
              </div>
            </details>

            <div>
              <label className="form-label">Ważność</label>
              <select className="form-input" value={form.days} onChange={e => setForm(f => ({ ...f, days: Number(e.target.value) }))}>
                <option value={7}>7 dni</option>
                <option value={30}>30 dni</option>
                <option value={90}>90 dni</option>
                <option value={365}>1 rok</option>
              </select>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
