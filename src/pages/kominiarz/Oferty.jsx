import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Tag, Send, Edit3, Trash2, Eye, MapPin, Mail, MessageSquare, Bell } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import {
  createBuilding, buildingFields,
  createApartment,
  createResident, residentFields,
} from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

const STATUS = {
  draft: { label: 'Szkic', cls: 'bg-slate-200 text-slate-700' },
  wyslana: { label: 'Wysłana', cls: 'bg-blue-100 text-blue-700' },
  zaakceptowana: { label: 'Zaakceptowana', cls: 'bg-emerald-100 text-emerald-700' },
  odrzucona: { label: 'Odrzucona', cls: 'bg-rose-100 text-rose-700' },
  wygasla: { label: 'Wygasła', cls: 'bg-slate-100 text-slate-500' },
  otwarta: { label: 'Otwarta', cls: 'bg-amber-100 text-amber-700' },
};

const PRESETS = {
  wklad: { title: 'Wymiana wkładu kominowego', description: 'Wkład stalowy/kwasoodporny — zabezpieczenie komina przed kondensatem.', price: 2800 },
  nasada: { title: 'Montaż nasady kominowej', description: 'Nasada przeciwzaciągowa — poprawia ciąg i chroni przed warunkami atmosferycznymi.', price: 450 },
  inspekcja_kamera: { title: 'Inspekcja kamerą HD', description: 'Dokładne sprawdzenie przewodu kamerą inspekcyjną.', price: 250 },
  opinia: { title: 'Opinia kominiarska', description: 'Profesjonalna opinia wydana przez Mistrza Kominiarskiego.', price: 350 },
  pakiet_roczny: { title: 'Pakiet roczny czyszczenia', description: 'Cykliczne czyszczenia z przypomnieniami o terminach.', price: 600 },
  czyszczenie_went: { title: 'Czyszczenie wentylacji', description: 'Czyszczenie przewodów wentylacyjnych.', price: 350 },
};

const EMPTY = {
  service_type: 'wklad', title: '', description: '', price_pln: 0,
  building_id: '', apartment_id: '', target_profile_id: '',
  auto_send: true, custom_message: '',
};

export default function Oferty() {
  const [offers, setOffers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const [sheet, setSheet] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sendForm, setSendForm] = useState({ channel: 'email', custom_message: '' });

  function load() {
    api('/offers').then(setOffers);
    api('/buildings').then(setBuildings);
    api('/apartments').then(setApartments);
    api('/admin/users').then(setUsers).catch(() => setUsers([]));
  }
  useEffect(load, []);

  useEffect(() => {
    const st = params.get('service_type');
    const bid = params.get('building_id');
    const aid = params.get('apartment_id');
    if (st || bid || aid) {
      const preset = PRESETS[st] || {};
      setForm({
        ...EMPTY,
        service_type: st || 'wklad',
        title: preset.title || '',
        description: preset.description || '',
        price_pln: preset.price || 0,
        building_id: bid || '',
        apartment_id: aid || '',
      });
      setSheet({ type: 'new' });
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (form.apartment_id && !form.target_profile_id) {
      const apt = apartments.find(a => a.id === Number(form.apartment_id));
      if (apt?.resident_id) setForm(f => ({ ...f, target_profile_id: apt.resident_id }));
    }
  }, [form.apartment_id, apartments]);

  const target = useMemo(() => {
    if (form.target_profile_id) return users.find(u => u.id === Number(form.target_profile_id));
    if (form.apartment_id) {
      const apt = apartments.find(a => a.id === Number(form.apartment_id));
      return apt?.resident_name ? { full_name: apt.resident_name } : null;
    }
    return null;
  }, [form.target_profile_id, form.apartment_id, users, apartments]);

  async function save(e) {
    e.preventDefault();
    const body = { ...form };
    if (!body.building_id) delete body.building_id; else body.building_id = Number(body.building_id);
    if (!body.apartment_id) delete body.apartment_id; else body.apartment_id = Number(body.apartment_id);
    if (!body.target_profile_id) delete body.target_profile_id; else body.target_profile_id = Number(body.target_profile_id);
    if (!body.price_pln) delete body.price_pln;
    if (!body.custom_message) delete body.custom_message;

    if (sheet?.type === 'edit') {
      await api(`/offers/${sheet.offer.id}`, { method: 'PATCH', body });
    } else {
      await api('/offers', { method: 'POST', body });
    }
    setSheet(null);
    setForm(EMPTY);
    const n = new URLSearchParams(params); n.delete('service_type'); n.delete('building_id'); n.delete('apartment_id'); setParams(n);
    load();
  }

  async function send(offer) {
    const body = { channel: sendForm.channel };
    if (sendForm.custom_message) body.custom_message = sendForm.custom_message;
    await api(`/offers/${offer.id}/send`, { method: 'POST', body });
    setSheet(null); setSendForm({ channel: 'email', custom_message: '' });
    load();
  }

  async function cancel(offerId) {
    if (!confirm('Anulować ofertę?')) return;
    await api(`/offers/${offerId}/cancel`, { method: 'POST' });
    load();
  }

  function openEdit(offer) {
    setForm({
      service_type: offer.service_type,
      title: offer.title,
      description: offer.description || '',
      price_pln: offer.price_pln || 0,
      building_id: offer.building_id || '',
      apartment_id: offer.apartment_id || '',
      target_profile_id: offer.target_profile_id || '',
      auto_send: false,
      custom_message: '',
    });
    setSheet({ type: 'edit', offer });
  }
  function openNew() { setForm(EMPTY); setSheet({ type: 'new' }); }
  function applyPreset(type) {
    const p = PRESETS[type];
    if (!p) return;
    setForm(f => ({ ...f, service_type: type, title: p.title, description: p.description, price_pln: p.price }));
  }

  const aptsForBuilding = form.building_id ? apartments.filter(a => a.building_id === Number(form.building_id)) : [];
  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);

  const counts = useMemo(() => ({
    all: offers.length,
    draft: offers.filter(o => o.status === 'draft').length,
    wyslana: offers.filter(o => o.status === 'wyslana').length,
    zaakceptowana: offers.filter(o => o.status === 'zaakceptowana').length,
    odrzucona: offers.filter(o => o.status === 'odrzucona').length,
  }), [offers]);
  const rate = counts.all ? Math.round((counts.zaakceptowana / counts.all) * 100) : 0;

  const filters = [
    { value: null, label: 'Wszystkie', count: counts.all },
    { value: 'draft', label: 'Szkice', count: counts.draft },
    { value: 'wyslana', label: 'Wysłane', count: counts.wyslana },
    { value: 'zaakceptowana', label: 'Zaakceptowane', count: counts.zaakceptowana },
    { value: 'odrzucona', label: 'Odrzucone', count: counts.odrzucona },
  ];

  return (
    <div className="panel-page">
      <MobilePageHeader title="Oferty / Upsell" subtitle={`Konwersja: ${rate}%`} />

      <FilterBar
        filters={filters}
        value={filter === 'all' ? null : filter}
        onChange={(v) => v ? setParams({ status: v }) : setParams({})}
      />

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={Tag} title="Brak ofert" body="Stwórz ofertę dla mieszkańca." action={<button onClick={openNew} className="btn-primary">+ Nowa oferta</button>} />
        ) : (
          filtered.map(o => {
            const s = STATUS[o.status] || STATUS.draft;
            return (
              <article key={o.id} className="mobile-card">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{o.title}</div>
                    <div className="text-xs text-slate-500 truncate">{o.service_type}</div>
                  </div>
                  <span className={`chip ${s.cls} flex-shrink-0`}>{s.label}</span>
                </div>
                <div className="text-sm text-slate-700 line-clamp-2 mb-2">
                  {o.target_name ? <strong>{o.target_name}</strong> : <span className="text-slate-400">brak odbiorcy</span>}
                  {o.address && <> <span className="text-slate-400 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{o.address}{o.apt_number ? `, m. ${o.apt_number}` : ''}</span></>}
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-extrabold text-orange-600">{o.price_pln ? `${o.price_pln} zł` : '—'}</span>
                  {o.sent_at && <span className="text-xs text-slate-500">wysłano {fmtDateTime(o.sent_at).split(',')[0]}{o.sent_count > 1 ? ` ×${o.sent_count}` : ''}</span>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setSheet({ type: 'view', offer: o })} className="btn-secondary flex-1 min-w-[100px]">
                    <Eye className="w-4 h-4" /> Podgląd
                  </button>
                  {o.status !== 'zaakceptowana' && o.status !== 'odrzucona' && (
                    <>
                      <button onClick={() => openEdit(o)} className="btn-secondary flex-1 min-w-[100px]">
                        <Edit3 className="w-4 h-4" /> Edytuj
                      </button>
                      {o.target_profile_id && (
                        <button onClick={() => { setSendForm({ channel: 'email', custom_message: '' }); setSheet({ type: 'send', offer: o }); }}
                          className="btn-primary flex-1 min-w-[100px]">
                          <Send className="w-4 h-4" />
                          {o.sent_count > 0 ? 'Wyślij ponownie' : 'Wyślij'}
                        </button>
                      )}
                      <button onClick={() => cancel(o.id)} className="btn-ghost text-rose-600">
                        <Trash2 className="w-4 h-4" /> Anuluj
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <button onClick={openNew} className="fab md:hidden" aria-label="Nowa oferta">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* New / edit sheet */}
      <BottomSheet
        open={!!sheet && (sheet.type === 'new' || sheet.type === 'edit')}
        onClose={() => setSheet(null)}
        title={sheet?.type === 'edit' ? 'Edytuj ofertę' : 'Nowa oferta'}
        footer={
          <button form="offer-form" type="submit" className="btn-primary w-full py-3.5">
            {sheet?.type === 'edit' ? 'Zapisz zmiany' : (form.auto_send ? 'Utwórz i wyślij' : 'Zapisz jako szkic')}
          </button>
        }
      >
        <form id="offer-form" onSubmit={save} className="space-y-3">
          <div>
            <label className="form-label">Typ usługi (z prefillem)</label>
            <select className="form-input" value={form.service_type} onChange={e => applyPreset(e.target.value)}>
              {Object.keys(PRESETS).map(k => <option key={k} value={k}>{PRESETS[k].title}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Tytuł</label>
            <input className="form-input" required
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Opis</label>
            <textarea className="form-input resize-none" rows="3"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Cena (zł)</label>
            <input className="form-input" type="number" inputMode="numeric"
              value={form.price_pln} onChange={e => setForm(f => ({ ...f, price_pln: Number(e.target.value) }))} />
          </div>

          <details>
            <summary className="form-label cursor-pointer">Adres / odbiorca (opcjonalnie)</summary>
            <div className="space-y-3 mt-3">
              <SelectOrCreate
                label="Budynek"
                value={form.building_id}
                onChange={v => setForm(f => ({ ...f, building_id: v, apartment_id: '', target_profile_id: '' }))}
                options={buildings}
                getLabel={b => `${b.address}${b.city ? ', ' + b.city : ''}`}
                emptyLabel="— budynek —"
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
                label="Mieszkanie"
                value={form.apartment_id}
                onChange={v => setForm(f => ({ ...f, apartment_id: v, target_profile_id: '' }))}
                options={aptsForBuilding}
                getLabel={a => `m. ${a.number}${a.resident_name ? ` (${a.resident_name})` : ''}`}
                emptyLabel="— mieszkanie —"
                disabled={!form.building_id}
                createTitle="Nowe mieszkanie"
                createFields={[
                  { k: 'number', label: 'Numer', required: true, placeholder: '3' },
                  { k: 'floor', label: 'Piętro', placeholder: '1' },
                ]}
                onCreate={async (data) => {
                  const a = await createApartment({ ...data, building_id: form.building_id });
                  const next = await api('/apartments');
                  setApartments(next);
                  return a;
                }}
                helpText={!form.building_id ? 'Wybierz najpierw budynek' : undefined}
              />
              {users.length > 0 ? (
                <SelectOrCreate
                  label="Klient (odbiorca oferty)"
                  value={form.target_profile_id}
                  onChange={v => setForm(f => ({ ...f, target_profile_id: v }))}
                  options={users.filter(u => u.role === 'mieszkaniec')}
                  getLabel={u => `${u.full_name} (${u.email})`}
                  emptyLabel="— bez klienta (szkic) —"
                  createTitle="Nowy klient"
                  createFields={residentFields}
                  onCreate={async (data) => {
                    const r = await createResident(data);
                    const next = await api('/admin/users');
                    setUsers(next);
                    return r;
                  }}
                />
              ) : target ? (
                <div className="text-sm p-3 bg-slate-50 rounded-xl">
                  ✓ Auto-przypisano: <strong>{target.full_name}</strong>
                </div>
              ) : null}
            </div>
          </details>

          {sheet?.type === 'new' && (
            <div className="border-t border-slate-100 pt-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={form.auto_send} className="w-5 h-5 accent-orange-500"
                  onChange={e => setForm(f => ({ ...f, auto_send: e.target.checked }))} />
                Wyślij ofertę natychmiast
              </label>
              {form.auto_send && (
                <textarea className="form-input resize-none mt-2" rows="2"
                  placeholder="Niestandardowa wiadomość (opcjonalnie)"
                  value={form.custom_message} onChange={e => setForm(f => ({ ...f, custom_message: e.target.value }))} />
              )}
            </div>
          )}
        </form>
      </BottomSheet>

      {/* Send sheet */}
      <BottomSheet
        open={sheet?.type === 'send'}
        onClose={() => setSheet(null)}
        title="Wyślij ofertę"
        footer={
          <button onClick={() => send(sheet.offer)} className="btn-primary w-full py-3.5">
            <Send className="w-5 h-5" /> Wyślij
          </button>
        }
      >
        {sheet?.offer && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <div><strong>Odbiorca:</strong> {sheet.offer.target_name}</div>
              <div className="text-xs text-slate-500">{sheet.offer.target_email}{sheet.offer.target_phone ? ` • ${sheet.offer.target_phone}` : ''}</div>
              <div className="mt-2"><strong>Oferta:</strong> {sheet.offer.title} — <strong className="text-orange-600">{sheet.offer.price_pln} zł</strong></div>
            </div>

            <div>
              <span className="form-label">Kanał</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'email', Ico: Mail, label: 'Email' },
                  { k: 'sms', Ico: MessageSquare, label: 'SMS' },
                  { k: 'in_app', Ico: Bell, label: 'Aplikacja' },
                ].map(({ k, Ico, label }) => (
                  <button key={k} type="button" onClick={() => setSendForm(f => ({ ...f, channel: k }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${sendForm.channel === k ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                    <Ico className={`w-5 h-5 ${sendForm.channel === k ? 'text-orange-600' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Własna wiadomość (opcjonalnie)</label>
              <textarea className="form-input resize-none" rows="4"
                placeholder="Pozostaw puste, by użyć standardowej treści"
                value={sendForm.custom_message} onChange={e => setSendForm(f => ({ ...f, custom_message: e.target.value }))} />
            </div>
          </div>
        )}
      </BottomSheet>

      {/* View sheet */}
      <BottomSheet
        open={sheet?.type === 'view'}
        onClose={() => setSheet(null)}
        title="Podgląd oferty"
      >
        {sheet?.offer && (
          <div className="space-y-3 text-sm">
            <h3 className="font-bold text-lg text-slate-900">{sheet.offer.title}</h3>
            <div className="text-xs text-slate-500">{sheet.offer.service_type}</div>
            <div className="bg-orange-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-extrabold text-orange-600">{sheet.offer.price_pln} zł</div>
            </div>
            {sheet.offer.description && (
              <div>
                <div className="text-xs uppercase text-slate-500 mb-1 font-bold">Opis</div>
                <div>{sheet.offer.description}</div>
              </div>
            )}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div><span className="text-slate-500">Status:</span> <strong>{STATUS[sheet.offer.status]?.label || sheet.offer.status}</strong></div>
              <div><span className="text-slate-500">Adres:</span> {sheet.offer.address}{sheet.offer.apt_number ? `, m. ${sheet.offer.apt_number}` : ''}</div>
              <div><span className="text-slate-500">Odbiorca:</span> {sheet.offer.target_name || '— brak —'}</div>
              {sheet.offer.target_email && <div><span className="text-slate-500">Email:</span> {sheet.offer.target_email}</div>}
              {sheet.offer.target_phone && <div><span className="text-slate-500">Telefon:</span> {sheet.offer.target_phone}</div>}
              <div><span className="text-slate-500">Utworzono:</span> {fmtDateTime(sheet.offer.created_at)}</div>
              {sheet.offer.sent_at && <div><span className="text-slate-500">Wysłano:</span> {fmtDateTime(sheet.offer.sent_at)} ({sheet.offer.sent_count}×)</div>}
              {sheet.offer.decided_at && <div><span className="text-slate-500">Decyzja:</span> {fmtDateTime(sheet.offer.decided_at)}</div>}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
