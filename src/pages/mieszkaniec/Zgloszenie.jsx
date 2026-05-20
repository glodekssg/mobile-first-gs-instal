import { useEffect, useState } from 'react';
import { Camera, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

const SEVERITIES = [
  ['low', 'Niski', 'bg-slate-100 text-slate-700 border-slate-200'],
  ['normal', 'Normalny', 'bg-blue-50 text-blue-700 border-blue-200'],
  ['high', 'Wysoki', 'bg-amber-50 text-amber-700 border-amber-200'],
  ['urgent', 'PILNE', 'bg-rose-50 text-rose-700 border-rose-200'],
];

export default function Zgloszenie() {
  const [apartments, setApartments] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ apartment_id: '', title: '', description: '', severity: 'normal' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

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
    setBusy(true); setErr(null);
    try {
      const body = { ...form };
      if (photoPreview) body.photo_data_url = photoPreview;
      await api('/issues', { method: 'POST', body });
      setMsg('Zgłoszenie przyjęte. Skontaktujemy się wkrótce.');
      setForm({ apartment_id: form.apartment_id, title: '', description: '', severity: 'normal' });
      setPhotoPreview(null);
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  function handlePhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title="Zgłoś usterkę" back="/panel/mieszkaniec" subtitle="Szybko i prosto" />

      {msg && (
        <div className="mobile-card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="text-emerald-800 text-sm">{msg}</div>
        </div>
      )}

      <form onSubmit={submit} className="mobile-card space-y-4">
        {apartments.length > 1 && (
          <div>
            <label htmlFor="apt" className="form-label">Mieszkanie</label>
            <select
              id="apt"
              className="form-input"
              value={form.apartment_id}
              onChange={e => setForm(f => ({ ...f, apartment_id: Number(e.target.value) }))}
              required
            >
              <option value="">— wybierz —</option>
              {apartments.map(a => <option key={a.id} value={a.id}>{a.building_address}, m. {a.number}</option>)}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="title" className="form-label">Co się dzieje?</label>
          <input
            id="title"
            className="form-input"
            required
            placeholder="np. Dymi z kominka"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div>
          <label htmlFor="desc" className="form-label">Szczegóły (opcjonalnie)</label>
          <textarea
            id="desc"
            className="form-input resize-none"
            rows="4"
            placeholder="Opisz problem dokładniej…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div>
          <span className="form-label">Priorytet</span>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITIES.map(([k, label, cls]) => (
              <button
                key={k}
                type="button"
                onClick={() => setForm(f => ({ ...f, severity: k }))}
                className={`p-3 rounded-xl border-2 font-semibold text-sm transition-colors ${form.severity === k ? cls + ' ring-2 ring-orange-300' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="form-label">Zdjęcie (opcjonalnie)</span>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Podgląd" className="w-full rounded-xl border" />
              <button
                type="button"
                onClick={() => setPhotoPreview(null)}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-rose-600 shadow-md"
              >
                Usuń
              </button>
            </div>
          ) : (
            <label className="block">
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
              <span className="btn-secondary w-full py-4 cursor-pointer">
                <Camera className="w-5 h-5 text-orange-500" />
                Zrób zdjęcie / wybierz z galerii
              </span>
            </label>
          )}
        </div>

        {err && (
          <div className="flex items-center gap-2 text-rose-600 text-sm" role="alert">
            <AlertCircle className="w-4 h-4" />
            {err}
          </div>
        )}

        <button disabled={busy} className="btn-primary w-full py-4">
          {busy ? '…' : 'Wyślij zgłoszenie'}
        </button>
      </form>

      <section>
        <h2 className="font-bold text-slate-900 mb-2 px-1">Twoje zgłoszenia</h2>
        <div className="mobile-stack">
          {issues.map(i => (
            <div key={i.id} className="mobile-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{i.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{fmtDate(i.created_at)}</div>
                </div>
                <span className={`chip ${i.severity === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                  {i.status === 'open' ? 'Otwarte' : 'Zamknięte'}
                </span>
              </div>
              {i.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{i.description}</p>}
            </div>
          ))}
          {issues.length === 0 && (
            <EmptyState icon={Wrench} title="Brak zgłoszeń" body="Wyślij pierwsze zgłoszenie — pomożemy szybko." />
          )}
        </div>
      </section>
    </div>
  );
}
