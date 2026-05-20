import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MessageSquare, UserPlus, Send, ArrowRight, UserPlus2 } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createApartment, createBuilding, buildingFields } from '../../lib/creators';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

const STATUS = {
  new: { label: 'Nowy', cls: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Kontakt', cls: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Umówiony', cls: 'bg-emerald-100 text-emerald-700' },
  converted: { label: 'Klient', cls: 'bg-emerald-200 text-emerald-800' },
  rejected: { label: 'Odrzucony', cls: 'bg-slate-100 text-slate-500' },
};

export default function Leady() {
  const [leads, setLeads] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [, setBuildings] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const [sheet, setSheet] = useState(null);
  const [msg, setMsg] = useState('');
  const [convertForm, setConvertForm] = useState({ create_account: true, apartment_id: '', schedule_visit: false, visit_when: '', visit_type: 'kontrola' });
  const [contactForm, setContactForm] = useState({ channel: 'email', body: '' });
  const [busy, setBusy] = useState(false);

  function load() {
    api('/leads').then(setLeads);
    api('/apartments').then(setApartments).catch(() => {});
    api('/buildings').then(setBuildings).catch(() => {});
  }
  useEffect(load, []);

  async function update(id, status) {
    await api(`/leads/${id}`, { method: 'PATCH', body: { status } });
    load();
  }

  async function sendContact() {
    if (!contactForm.body) return;
    setBusy(true);
    try {
      await api(`/leads/${sheet.lead.id}/contact`, { method: 'POST', body: contactForm });
      setMsg('Wiadomość wysłana.');
      setSheet(null); setContactForm({ channel: 'email', body: '' });
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function convert() {
    setBusy(true);
    try {
      const body = { ...convertForm };
      if (body.apartment_id) body.apartment_id = Number(body.apartment_id); else delete body.apartment_id;
      if (body.schedule_visit && body.visit_when) body.visit_when = new Date(body.visit_when).toISOString();
      else { delete body.schedule_visit; delete body.visit_when; delete body.visit_type; }
      const r = await api(`/leads/${sheet.lead.id}/convert`, { method: 'POST', body });
      let info = '✓ Konwersja udana.';
      if (r.profile_id) info += `\n→ Konto utworzone (id ${r.profile_id}), hasło tymczasowe wysłano na email.`;
      if (r.visit_id) info += `\n→ Wizyta umówiona (id ${r.visit_id}).`;
      alert(info);
      setSheet(null);
      setConvertForm({ create_account: true, apartment_id: '', schedule_visit: false, visit_when: '', visit_type: 'kontrola' });
      load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  const counts = useMemo(() => Object.keys(STATUS).reduce((acc, k) => { acc[k] = leads.filter(l => l.status === k).length; return acc; }, {}), [leads]);
  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const filters = [
    { value: null, label: 'Wszystkie', count: leads.length },
    ...Object.entries(STATUS).map(([k, s]) => ({ value: k, label: s.label, count: counts[k] || 0 })),
  ];

  return (
    <div className="panel-page">
      <MobilePageHeader title="Leady ze strony" subtitle="Zapytania od klientów" />

      {msg && (
        <div className="mobile-card bg-emerald-50 border-emerald-200 text-emerald-800 text-sm">
          {msg}
        </div>
      )}

      <FilterBar
        filters={filters}
        value={filter === 'all' ? null : filter}
        onChange={(v) => v ? setParams({ status: v }) : setParams({})}
      />

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={UserPlus2} title="Brak zapytań" body="Zapytania ze strony www trafią tutaj." />
        ) : (
          filtered.map(l => (
            <article key={l.id} className="mobile-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{l.full_name}</div>
                  {l.email && <div className="text-xs text-slate-500 truncate">{l.email}</div>}
                  <a href={`tel:${l.phone}`} className="text-sm text-orange-600 font-semibold">{l.phone}</a>
                </div>
                <span className={`chip ${STATUS[l.status]?.cls} flex-shrink-0`}>{STATUS[l.status]?.label}</span>
              </div>
              {l.service_type && <div className="text-xs mt-2"><strong>Usługa:</strong> {l.service_type}</div>}
              {l.message && <p className="text-sm text-slate-700 mt-2 line-clamp-3">{l.message}</p>}
              <div className="text-xs text-slate-400 mt-2">{fmtDateTime(l.created_at)}</div>

              <div className="flex gap-2 mt-3 flex-wrap">
                <a href={`tel:${l.phone}`} className="btn-secondary flex-1">
                  <Phone className="w-4 h-4 text-orange-500" />
                  Zadzwoń
                </a>
                <button onClick={() => { setContactForm({ channel: l.email ? 'email' : 'sms', body: '' }); setSheet({ type: 'contact', lead: l }); }}
                  className="btn-secondary flex-1">
                  <MessageSquare className="w-4 h-4" />
                  Odpowiedz
                </button>
                {l.status !== 'converted' && (
                  <button onClick={() => setSheet({ type: 'convert', lead: l })} className="btn-primary flex-1">
                    <UserPlus className="w-4 h-4" />
                    Konwertuj
                  </button>
                )}
              </div>

              <details className="mt-3">
                <summary className="text-xs text-slate-500 cursor-pointer">Zmień status</summary>
                <select value={l.status} onChange={e => update(l.id, e.target.value)}
                  className="form-input mt-2">
                  {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </details>
            </article>
          ))
        )}
      </div>

      {/* Contact sheet */}
      <BottomSheet
        open={sheet?.type === 'contact'}
        onClose={() => setSheet(null)}
        title={sheet?.lead ? `Odpowiedz: ${sheet.lead.full_name}` : ''}
        footer={
          <button disabled={busy || !contactForm.body} onClick={sendContact} className="btn-primary w-full py-3.5">
            <Send className="w-5 h-5" /> Wyślij
          </button>
        }
      >
        {sheet?.lead && (
          <div className="space-y-3">
            <div className="text-xs bg-slate-50 rounded-xl p-3">
              📧 {sheet.lead.email || '—'} • 📞 {sheet.lead.phone}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['email', 'sms'].map(c => (
                <button key={c} type="button" onClick={() => setContactForm(f => ({ ...f, channel: c }))}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm ${contactForm.channel === c ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200'}`}>
                  {c === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
            <textarea className="form-input resize-none" rows="5"
              placeholder="Treść wiadomości…"
              value={contactForm.body} onChange={e => setContactForm(f => ({ ...f, body: e.target.value }))} />
          </div>
        )}
      </BottomSheet>

      {/* Convert sheet */}
      <BottomSheet
        open={sheet?.type === 'convert'}
        onClose={() => setSheet(null)}
        title={sheet?.lead ? `Konwertuj: ${sheet.lead.full_name}` : ''}
        footer={
          <button disabled={busy} onClick={convert} className="btn-primary w-full py-3.5">
            <ArrowRight className="w-5 h-5" /> Konwertuj
          </button>
        }
      >
        {sheet?.lead && (
          <div className="space-y-3">
            <div className="text-xs bg-slate-50 rounded-xl p-3">
              📧 {sheet.lead.email || '—'} • 📞 {sheet.lead.phone}
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-orange-500"
                checked={convertForm.create_account}
                onChange={e => setConvertForm(f => ({ ...f, create_account: e.target.checked }))} />
              <span className="text-sm">Utwórz konto (wymaga email — hasło tymczasowe na email)</span>
            </label>

            <SelectOrCreate
              label="Przypisz do mieszkania (opcjonalnie)"
              value={convertForm.apartment_id}
              onChange={v => setConvertForm(f => ({ ...f, apartment_id: v }))}
              options={apartments.filter(a => !a.resident_id)}
              getLabel={a => `${a.building_address}, m. ${a.number}`}
              emptyLabel="— bez mieszkania —"
              helpText="Pokazuję tylko niezasiedlone."
              createTitle="Nowy budynek + mieszkanie"
              createFields={[
                ...buildingFields,
                { k: 'apt_number', label: 'Numer mieszkania', required: true, placeholder: '3' },
                { k: 'apt_floor', label: 'Piętro mieszkania' },
              ]}
              onCreate={async (data) => {
                const b = await createBuilding(data);
                const a = await createApartment({ building_id: b.id, number: data.apt_number, floor: data.apt_floor });
                const aNext = await api('/apartments'); setApartments(aNext);
                const bNext = await api('/buildings'); setBuildings(bNext);
                return a;
              }}
            />

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-orange-500"
                checked={convertForm.schedule_visit}
                onChange={e => setConvertForm(f => ({ ...f, schedule_visit: e.target.checked }))} />
              <span className="text-sm">Umów pierwszą wizytę</span>
            </label>

            {convertForm.schedule_visit && (
              <div className="space-y-2 pl-2 border-l-2 border-orange-300">
                <input className="form-input" type="datetime-local" required={convertForm.schedule_visit}
                  value={convertForm.visit_when} onChange={e => setConvertForm(f => ({ ...f, visit_when: e.target.value }))} />
                <select className="form-input" value={convertForm.visit_type}
                  onChange={e => setConvertForm(f => ({ ...f, visit_type: e.target.value }))}>
                  <option value="kontrola">Kontrola okresowa</option>
                  <option value="czyszczenie">Czyszczenie</option>
                  <option value="inspekcja_kamera">Inspekcja kamerą</option>
                  <option value="kontrola_gaz">Kontrola gazu</option>
                </select>
                {!convertForm.apartment_id && <div className="text-xs text-rose-600">Wybierz mieszkanie żeby umówić wizytę.</div>}
              </div>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
