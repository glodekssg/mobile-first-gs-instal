import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

export default function Zgloszenie() {
  const [apartments, setApartments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ apartment_id: '', title: '', description: '', severity: 'normal' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  function load() {
    api('/apartments/mine').then(a => {
      setApartments(a);
      if (a.length === 1 && !form.apartment_id) setForm(f => ({ ...f, apartment_id: a[0].id }));
    });
    api('/issues').then(setIssues);
  }
  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/issues', { method: 'POST', body: form });
      setMsg('✓ Zgłoszenie przyjęte. Skontaktujemy się wkrótce.');
      setForm({ apartment_id: form.apartment_id, title: '', description: '', severity: 'normal' });
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Zgłoś usterkę</h1>

      <form onSubmit={submit} className="bg-white rounded-xl border p-5 space-y-3">
        <select className="w-full border rounded p-2" value={form.apartment_id} required
          onChange={e => setForm(f => ({ ...f, apartment_id: Number(e.target.value) }))}>
          <option value="">— wybierz mieszkanie —</option>
          {apartments.map(a => <option key={a.id} value={a.id}>{a.building_address}, m. {a.number}</option>)}
        </select>
        <input className="w-full border rounded p-2" required placeholder="np. Dymi z kominka"
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <textarea className="w-full border rounded p-2" rows="4" placeholder="Opisz szczegóły..."
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <select className="w-full border rounded p-2" value={form.severity}
          onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
          <option value="low">Niski priorytet</option>
          <option value="normal">Normalny</option>
          <option value="high">Wysoki</option>
          <option value="urgent">PILNE</option>
        </select>
        {msg && <div className="text-sm text-emerald-700">{msg}</div>}
        <button disabled={busy} className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50">
          {busy ? '...' : 'Wyślij zgłoszenie'}
        </button>
      </form>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Twoje zgłoszenia</h3>
        <div className="divide-y">
          {issues.map(i => (
            <div key={i.id} className="py-3">
              <div className="font-medium">{i.title}</div>
              <div className="text-sm text-slate-500">{fmtDate(i.created_at)} • {i.status}</div>
              {i.description && <div className="text-sm text-slate-600 mt-1">{i.description}</div>}
            </div>
          ))}
          {issues.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak zgłoszeń.</div>}
        </div>
      </div>
    </div>
  );
}
