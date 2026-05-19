import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import SelectOrCreate from '../../components/SelectOrCreate';
import { createApartment, createBuilding, buildingFields } from '../../lib/creators';

const STATUS_BADGE = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  converted: 'bg-emerald-200 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = { new: 'Nowy', contacted: 'Kontakt', scheduled: 'Umówiony', converted: 'Klient', rejected: 'Odrzucony' };

export default function Leady() {
  const [leads, setLeads] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const [modal, setModal] = useState(null); // { type: 'contact'|'convert', lead }
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
  function setFilter(s) {
    const n = new URLSearchParams(params);
    if (s === 'all') n.delete('status'); else n.set('status', s);
    setParams(n);
  }

  async function sendContact() {
    if (!contactForm.body) return;
    setBusy(true);
    try {
      await api(`/leads/${modal.lead.id}/contact`, { method: 'POST', body: contactForm });
      setMsg('✓ Wiadomość wysłana.');
      setModal(null); setContactForm({ channel: 'email', body: '' });
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

      const r = await api(`/leads/${modal.lead.id}/convert`, { method: 'POST', body });
      let info = '✓ Konwersja udana.';
      if (r.profile_id) info += `\n→ Konto utworzone (id ${r.profile_id}), hasło tymczasowe wysłano na email.`;
      if (r.visit_id) info += `\n→ Wizyta umówiona (id ${r.visit_id}).`;
      alert(info);
      setModal(null);
      setConvertForm({ create_account: true, apartment_id: '', schedule_visit: false, visit_when: '', visit_type: 'kontrola' });
      load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const counts = Object.fromEntries(Object.keys(STATUS_LABEL).map(k => [k, leads.filter(l => l.status === k).length]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Leady ze strony</h1>
        <p className="text-slate-500 text-sm">Zapytania od potencjalnych klientów. Możesz odpowiedzieć, umówić wizytę lub przekonwertować na klienta.</p>
      </div>

      {msg && <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-800">{msg}</div>}

      <div className="flex gap-2 flex-wrap">
        {['all', ...Object.keys(STATUS_LABEL)].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {s === 'all' ? `Wszystkie (${leads.length})` : `${STATUS_LABEL[s]} (${counts[s] || 0})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Klient</th>
              <th className="text-left p-3">Kontakt</th>
              <th className="text-left p-3">Usługa</th>
              <th className="text-left p-3">Wiadomość</th>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium">{l.full_name}</div>
                  {l.email && <div className="text-xs text-slate-500">{l.email}</div>}
                </td>
                <td className="p-3"><a href={`tel:${l.phone}`} className="text-orange-600 hover:underline">{l.phone}</a></td>
                <td className="p-3">{l.service_type || '—'}</td>
                <td className="p-3 text-slate-500 text-sm max-w-xs">{l.message || '—'}</td>
                <td className="p-3 text-xs text-slate-500">{fmtDateTime(l.created_at)}</td>
                <td className="p-3">
                  <select value={l.status} onChange={e => update(l.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border-0 ${STATUS_BADGE[l.status]}`}>
                    {Object.entries(STATUS_LABEL).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                  </select>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setContactForm({ channel: l.email ? 'email' : 'sms', body: '' }); setModal({ type: 'contact', lead: l }); }}
                    className="text-blue-600 text-sm hover:underline mr-2">Odpowiedz</button>
                  {l.status !== 'converted' && (
                    <button onClick={() => setModal({ type: 'convert', lead: l })}
                      className="text-orange-600 text-sm hover:underline">Konwertuj</button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7" className="p-10 text-center text-slate-400">Brak zapytań.</td></tr>}
          </tbody>
        </table></div>
      </div>

      {/* CONTACT MODAL */}
      {modal?.type === 'contact' && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Odpowiedz: {modal.lead.full_name}</h3>
            <div className="text-sm bg-slate-50 rounded p-2">
              📧 {modal.lead.email || '—'} • 📞 {modal.lead.phone}
            </div>
            <div className="flex gap-2">
              {['email', 'sms'].map(c => (
                <button key={c} type="button" onClick={() => setContactForm(f => ({ ...f, channel: c }))}
                  className={`px-3 py-1.5 text-sm rounded border-2 ${contactForm.channel === c ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                  {c === 'email' ? '📧 Email' : '💬 SMS'}
                </button>
              ))}
            </div>
            <textarea className="w-full border rounded p-2 text-sm" rows="5"
              placeholder="Treść wiadomości..."
              value={contactForm.body} onChange={e => setContactForm(f => ({ ...f, body: e.target.value }))} />
            <button disabled={busy || !contactForm.body} onClick={sendContact}
              className="w-full bg-orange-500 text-white py-2 rounded disabled:opacity-50">
              {busy ? '...' : 'Wyślij wiadomość'}
            </button>
          </div>
        </Modal>
      )}

      {/* CONVERT MODAL */}
      {modal?.type === 'convert' && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Konwertuj leada: {modal.lead.full_name}</h3>
            <div className="text-sm bg-slate-50 rounded p-2">
              📧 {modal.lead.email || '— brak —'} • 📞 {modal.lead.phone}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={convertForm.create_account}
                onChange={e => setConvertForm(f => ({ ...f, create_account: e.target.checked }))} />
              Utwórz konto mieszkańca (wymaga email — hasło tymczasowe zostanie wysłane)
            </label>

            <SelectOrCreate
              label="Przypisz do mieszkania (opcjonalnie)"
              value={convertForm.apartment_id}
              onChange={v => setConvertForm(f => ({ ...f, apartment_id: v }))}
              options={apartments.filter(a => !a.resident_id)}
              getLabel={a => `${a.building_address}, m. ${a.number}`}
              emptyLabel="— bez mieszkania —"
              helpText="Pokazuję tylko niezasiedlone. Jeśli klient ma nowy adres — dodaj budynek i mieszkanie."
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

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={convertForm.schedule_visit}
                onChange={e => setConvertForm(f => ({ ...f, schedule_visit: e.target.checked }))} />
              Umów pierwszą wizytę
            </label>

            {convertForm.schedule_visit && (
              <div className="ml-6 space-y-2 border-l-2 border-orange-300 pl-3">
                <input className="w-full border rounded p-2 text-sm" type="datetime-local" required={convertForm.schedule_visit}
                  value={convertForm.visit_when} onChange={e => setConvertForm(f => ({ ...f, visit_when: e.target.value }))} />
                <select className="w-full border rounded p-2 text-sm" value={convertForm.visit_type}
                  onChange={e => setConvertForm(f => ({ ...f, visit_type: e.target.value }))}>
                  <option value="kontrola">Kontrola okresowa</option>
                  <option value="czyszczenie">Czyszczenie</option>
                  <option value="inspekcja_kamera">Inspekcja kamerą</option>
                  <option value="kontrola_gaz">Kontrola gazu</option>
                </select>
                {!convertForm.apartment_id && <div className="text-xs text-rose-600">Wybierz mieszkanie żeby umówić wizytę.</div>}
              </div>
            )}

            <button disabled={busy} onClick={convert}
              className="w-full bg-orange-500 text-white py-2 rounded font-medium disabled:opacity-50">
              {busy ? '...' : 'Konwertuj leada'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="float-right text-slate-400">✕</button>
        {children}
      </div>
    </div>
  );
}
