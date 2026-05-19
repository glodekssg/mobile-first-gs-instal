import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import {
  createBuilding, buildingFields,
  createApartment,
  createResident, residentFields,
} from '../../lib/creators';

const STATUS_BADGE = {
  draft: 'bg-slate-200 text-slate-700',
  wyslana: 'bg-blue-100 text-blue-700',
  zaakceptowana: 'bg-emerald-100 text-emerald-700',
  odrzucona: 'bg-rose-100 text-rose-700',
  wygasla: 'bg-slate-100 text-slate-500',
  otwarta: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL = {
  draft: 'Szkic', wyslana: 'Wysłana', zaakceptowana: 'Zaakceptowana',
  odrzucona: 'Odrzucona', wygasla: 'Wygasła', otwarta: 'Otwarta',
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
  const [modal, setModal] = useState(null); // { type: 'new' | 'edit' | 'view' | 'send', offer? }
  const [form, setForm] = useState(EMPTY);
  const [sendForm, setSendForm] = useState({ channel: 'email', custom_message: '' });

  function load() {
    api('/offers').then(setOffers);
    api('/buildings').then(setBuildings);
    api('/apartments').then(setApartments);
    api('/admin/users').then(setUsers).catch(() => setUsers([])); // kominiarz nie ma /admin/users, OK
  }
  useEffect(load, []);

  // Auto-open form from URL params
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
      setModal({ type: 'new' });
    }
  }, []);

  // Auto-resolve target_profile_id when apartment selected
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

    if (modal.type === 'edit') {
      await api(`/offers/${modal.offer.id}`, { method: 'PATCH', body });
    } else {
      await api('/offers', { method: 'POST', body });
    }
    setModal(null);
    setForm(EMPTY);
    // Clean URL params
    const n = new URLSearchParams(params); n.delete('service_type'); n.delete('building_id'); n.delete('apartment_id'); setParams(n);
    load();
  }

  async function send(offer) {
    const body = { channel: sendForm.channel };
    if (sendForm.custom_message) body.custom_message = sendForm.custom_message;
    await api(`/offers/${offer.id}/send`, { method: 'POST', body });
    setModal(null); setSendForm({ channel: 'email', custom_message: '' });
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
    setModal({ type: 'edit', offer });
  }

  function openNew() {
    setForm(EMPTY);
    setModal({ type: 'new' });
  }

  function applyPreset(type) {
    const p = PRESETS[type];
    if (!p) return;
    setForm(f => ({ ...f, service_type: type, title: p.title, description: p.description, price_pln: p.price }));
  }

  const aptsForBuilding = form.building_id ? apartments.filter(a => a.building_id === Number(form.building_id)) : [];
  const filtered = filter === 'all' ? offers : offers.filter(o => o.status === filter);

  const stats = {
    total: offers.length,
    sent: offers.filter(o => o.status === 'wyslana').length,
    accepted: offers.filter(o => o.status === 'zaakceptowana').length,
    draft: offers.filter(o => o.status === 'draft').length,
  };
  const rate = stats.total ? Math.round((stats.accepted / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Oferty / Upsell</h1>
        <button onClick={openNew} className="px-4 py-2 bg-orange-500 text-white rounded-md">+ Nowa oferta</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Wszystkie" value={stats.total} onClick={() => setFilter('all')} active={filter === 'all'} />
        <Stat label="Szkice" value={stats.draft} tone="slate" onClick={() => setFilter('draft')} active={filter === 'draft'} />
        <Stat label="Wysłane" value={stats.sent} tone="blue" onClick={() => setFilter('wyslana')} active={filter === 'wyslana'} />
        <Stat label="Zaakceptowane" value={stats.accepted} tone="emerald" onClick={() => setFilter('zaakceptowana')} active={filter === 'zaakceptowana'} />
        <Stat label="Konwersja" value={`${rate}%`} />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Tytuł</th>
              <th className="text-left p-3">Klient</th>
              <th className="text-left p-3">Adres</th>
              <th className="text-left p-3">Cena</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Wysłano</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-slate-500">{o.service_type}</div>
                </td>
                <td className="p-3">
                  {o.target_name ? (
                    <>
                      <div>{o.target_name}</div>
                      <div className="text-xs text-slate-500">{o.target_email}</div>
                    </>
                  ) : <span className="text-slate-400 text-xs">brak odbiorcy</span>}
                </td>
                <td className="p-3 text-slate-500 text-xs">{o.address}{o.apt_number ? `, m. ${o.apt_number}` : ''}</td>
                <td className="p-3 font-semibold">{o.price_pln ? `${o.price_pln} zł` : '—'}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                <td className="p-3 text-xs text-slate-500">
                  {o.sent_at ? fmtDateTime(o.sent_at) : '—'}
                  {o.sent_count > 1 && <div className="text-amber-600">×{o.sent_count}</div>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setModal({ type: 'view', offer: o })} className="text-slate-600 text-sm hover:underline mr-2">Podgląd</button>
                  {o.status !== 'zaakceptowana' && o.status !== 'odrzucona' && (
                    <>
                      <button onClick={() => openEdit(o)} className="text-orange-600 text-sm hover:underline mr-2">Edytuj</button>
                      {o.target_profile_id && (
                        <button onClick={() => { setSendForm({ channel: 'email', custom_message: '' }); setModal({ type: 'send', offer: o }); }}
                          className="text-blue-600 text-sm hover:underline mr-2">
                          {o.sent_count > 0 ? 'Wyślij ponownie' : 'Wyślij'}
                        </button>
                      )}
                      <button onClick={() => cancel(o.id)} className="text-rose-600 text-sm hover:underline">Anuluj</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7" className="p-10 text-center text-slate-400">Brak ofert.</td></tr>}
          </tbody>
        </table></div>
      </div>

      {/* MODAL: new / edit */}
      {modal && (modal.type === 'new' || modal.type === 'edit') && (
        <Modal onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-3">
            <h3 className="font-semibold text-lg">{modal.type === 'edit' ? 'Edytuj ofertę' : 'Nowa oferta'}</h3>

            <div>
              <label className="text-sm font-medium block mb-1">Typ usługi (z prefillem)</label>
              <select className="w-full border rounded p-2" value={form.service_type}
                onChange={e => applyPreset(e.target.value)}>
                {Object.keys(PRESETS).map(k => <option key={k} value={k}>{PRESETS[k].title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Tytuł</label>
              <input className="w-full border rounded p-2" required
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Opis</label>
              <textarea className="w-full border rounded p-2" rows="3"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Cena (zł)</label>
              <input className="w-full border rounded p-2" type="number"
                value={form.price_pln} onChange={e => setForm(f => ({ ...f, price_pln: Number(e.target.value) }))} />
            </div>

            <div className="border-t pt-3">
              <div className="text-sm font-medium mb-2">🏠 Adres (opcjonalnie — pomaga zaadresować ofertę)</div>
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
              <div className="mt-3">
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
              </div>
            </div>

            <div className="border-t pt-3">
              {users.length > 0 ? (
                <SelectOrCreate
                  label="👤 Klient (odbiorca oferty)"
                  value={form.target_profile_id}
                  onChange={v => setForm(f => ({ ...f, target_profile_id: v }))}
                  options={users.filter(u => u.role === 'mieszkaniec')}
                  getLabel={u => `${u.full_name} (${u.email})`}
                  emptyLabel="— bez klienta (zapisz jako szkic) —"
                  createTitle="Nowy klient"
                  createFields={residentFields}
                  onCreate={async (data) => {
                    const r = await createResident(data);
                    const next = await api('/admin/users');
                    setUsers(next);
                    return r;
                  }}
                  helpText="Auto-przypisuje się przy wyborze mieszkania z rezydentem"
                />
              ) : target ? (
                <>
                  <label className="text-sm font-medium block mb-1">👤 Klient</label>
                  <div className="text-sm p-2 bg-slate-50 rounded">
                    ✓ Auto-przypisano: <strong>{target.full_name}</strong>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-500">Wybierz mieszkanie z rezydentem aby auto-przypisać klienta, lub utwórz jako szkic.</div>
              )}
            </div>

            {modal.type === 'new' && (
              <>
                <div className="border-t pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.auto_send}
                      onChange={e => setForm(f => ({ ...f, auto_send: e.target.checked }))} />
                    Wyślij ofertę natychmiast (jeśli wybrany jest klient)
                  </label>
                </div>
                {form.auto_send && (
                  <div>
                    <label className="text-sm block mb-1">Niestandardowa wiadomość (opcjonalnie)</label>
                    <textarea className="w-full border rounded p-2 text-sm" rows="2"
                      placeholder="Domyślnie: 'Mamy dla Pana/Pani propozycję...'"
                      value={form.custom_message} onChange={e => setForm(f => ({ ...f, custom_message: e.target.value }))} />
                  </div>
                )}
              </>
            )}

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-medium">
              {modal.type === 'edit' ? 'Zapisz zmiany' : (form.auto_send ? 'Utwórz i wyślij' : 'Zapisz jako szkic')}
            </button>
          </form>
        </Modal>
      )}

      {/* MODAL: send/resend */}
      {modal?.type === 'send' && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Wyślij ofertę</h3>
            <div className="bg-slate-50 rounded p-3 text-sm">
              <div><strong>Odbiorca:</strong> {modal.offer.target_name}</div>
              <div className="text-xs text-slate-500">{modal.offer.target_email} • {modal.offer.target_phone}</div>
              <div className="mt-2"><strong>Oferta:</strong> {modal.offer.title} — {modal.offer.price_pln} zł</div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Kanał</label>
              <div className="flex gap-2">
                {['email', 'sms', 'in_app'].map(c => (
                  <button key={c} type="button" onClick={() => setSendForm(f => ({ ...f, channel: c }))}
                    className={`px-3 py-1.5 text-sm rounded border-2 ${sendForm.channel === c ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                    {c === 'email' ? '📧 Email' : c === 'sms' ? '💬 SMS' : '🔔 In-app'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Wiadomość (opcjonalnie — własna treść)</label>
              <textarea className="w-full border rounded p-2 text-sm" rows="3"
                placeholder="Domyślnie wysyłana będzie standardowa treść z opisem oferty"
                value={sendForm.custom_message} onChange={e => setSendForm(f => ({ ...f, custom_message: e.target.value }))} />
            </div>

            <button onClick={() => send(modal.offer)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium">
              Wyślij
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: view */}
      {modal?.type === 'view' && (
        <Modal onClose={() => setModal(null)}>
          <OfferDetail offer={modal.offer} />
        </Modal>
      )}
    </div>
  );

  function setFilter(s) {
    const n = new URLSearchParams(params);
    if (s === 'all') n.delete('status'); else n.set('status', s);
    setParams(n);
  }
}

function OfferDetail({ offer }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">{offer.title}</h3>
      <div className="text-xs text-slate-500">{offer.service_type}</div>

      <div className="bg-orange-50 rounded p-3">
        <div className="text-3xl font-bold text-orange-600">{offer.price_pln} zł</div>
      </div>

      {offer.description && (
        <div>
          <div className="text-xs uppercase text-slate-500 mb-1">Opis</div>
          <div className="text-sm">{offer.description}</div>
        </div>
      )}

      <div className="border-t pt-3 space-y-2 text-sm">
        <div><span className="text-slate-500">Status:</span> <strong>{offer.status}</strong></div>
        <div><span className="text-slate-500">Adres:</span> {offer.address}{offer.apt_number ? `, m. ${offer.apt_number}` : ''}</div>
        <div><span className="text-slate-500">Odbiorca:</span> {offer.target_name || '— brak —'}</div>
        {offer.target_email && <div><span className="text-slate-500">Email:</span> {offer.target_email}</div>}
        {offer.target_phone && <div><span className="text-slate-500">Telefon:</span> {offer.target_phone}</div>}
        <div><span className="text-slate-500">Utworzono:</span> {new Date(offer.created_at).toLocaleString('pl-PL')}</div>
        {offer.sent_at && <div><span className="text-slate-500">Wysłano:</span> {new Date(offer.sent_at).toLocaleString('pl-PL')} ({offer.sent_count}×)</div>}
        {offer.decided_at && <div><span className="text-slate-500">Decyzja:</span> {new Date(offer.decided_at).toLocaleString('pl-PL')}</div>}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'slate', onClick, active }) {
  const c = { slate: 'bg-white', blue: 'bg-blue-50 border-blue-200', emerald: 'bg-emerald-50 border-emerald-200' }[tone];
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`rounded-xl border p-4 text-left ${c} ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'} ${active ? 'ring-2 ring-orange-400' : ''}`}>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </button>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="float-right text-slate-400">✕</button>
        {children}
      </div>
    </div>
  );
}
