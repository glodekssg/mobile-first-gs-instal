// Strona dostępna bez logowania, na podstawie magic linka /p/:token
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar, Check, X, CalendarClock, XCircle,
  Plus, Lightbulb, Wrench, CheckCircle2, Camera,
} from 'lucide-react';
import { fmtDateTime, visitTypeLabel } from '../lib/format';
import BottomSheet from '../components/mobile/BottomSheet';
import StatusBadge from '../components/mobile/StatusBadge';
import EmptyState from '../components/mobile/EmptyState';
import Spinner from '../components/mobile/Spinner';

const ALL_TYPES = [
  { k: 'kontrola', l: 'Kontrola okresowa' },
  { k: 'czyszczenie', l: 'Czyszczenie przewodów' },
  { k: 'inspekcja_kamera', l: 'Inspekcja kamerą' },
  { k: 'montaz_wkladu', l: 'Montaż wkładu' },
  { k: 'montaz_nasady', l: 'Montaż nasady' },
  { k: 'kontrola_gaz', l: 'Kontrola instalacji gazowej' },
  { k: 'opinia', l: 'Opinia kominiarska' },
];

export default function ProspectView() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [slots, setSlots] = useState([]);
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [issue, setIssue] = useState({ title: '', description: '', severity: 'normal' });
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [bookForm, setBookForm] = useState({ type: 'kontrola', notes: '' });
  const [chosenSlot, setChosenSlot] = useState(null);

  async function api(path, opts = {}) {
    const res = await fetch(`/api/prospect/${token}${path}`, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Błąd');
    return json;
  }
  async function load() {
    try { setData(await api('')); } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  async function loadSlots() {
    const r = await api('/slots');
    setSlots(r.slots);
  }
  async function openReschedule(visitId) {
    setChosenSlot(null);
    setMode({ type: 'reschedule', visitId });
    await loadSlots();
  }
  async function openBook() {
    const allowed = data?.constraints?.allowed_services;
    const defaultType = (allowed && allowed.length > 0) ? allowed[0] : 'kontrola';
    setBookForm({ type: defaultType, notes: '' });
    setChosenSlot(null);
    setMode({ type: 'book' });
    await loadSlots();
  }
  async function confirmReschedule() {
    if (!chosenSlot) return;
    setBusy(true);
    try {
      await api(`/visits/${mode.visitId}/reschedule`, { method: 'POST', body: { scheduled_at: chosenSlot } });
      setMsg('Wizyta przełożona.');
      setMode(null); setChosenSlot(null); load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function confirmBook() {
    if (!chosenSlot) return;
    setBusy(true);
    try {
      await api('/visits/book', { method: 'POST', body: { scheduled_at: chosenSlot, type: bookForm.type, notes: bookForm.notes } });
      setMsg('Wizyta umówiona!');
      setMode(null); setChosenSlot(null); load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function cancel(visitId) {
    const reason = prompt('Powód odwołania (opcjonalnie):') || '';
    if (reason === null) return;
    setBusy(true);
    try {
      await api(`/visits/${visitId}/cancel`, { method: 'POST', body: { reason } });
      setMsg('Wizyta odwołana.');
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function submitIssue(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...issue };
      if (issuePhoto) body.photo_data_url = issuePhoto;
      await api('/issue', { method: 'POST', body });
      setMsg('Zgłoszenie wysłane.');
      setMode(null); setIssue({ title: '', description: '', severity: 'normal' }); setIssuePhoto(null);
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  function handlePhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setIssuePhoto(ev.target.result);
    reader.readAsDataURL(f);
  }
  async function acceptOffer(id) {
    if (!confirm('Zaakceptować ofertę?')) return;
    await api(`/offers/${id}/accept`, { method: 'POST' });
    setMsg('Oferta zaakceptowana. Wizyta realizacyjna umówiona.');
    load();
  }
  async function rejectOffer(id) {
    await api(`/offers/${id}/reject`, { method: 'POST' });
    load();
  }

  if (err) return (
    <div className="min-h-[100svh] flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-2xl p-6 max-w-md text-center w-full">
        <div className="text-rose-600 text-xl font-bold mb-2">Link nieprawidłowy</div>
        <p className="text-slate-600 text-sm">{err}</p>
        <Link to="/" className="btn-primary mt-4 w-full">Strona główna</Link>
      </div>
    </div>
  );
  if (!data) return <Spinner />;

  const c = data.constraints || {};
  const allowed = c.allowed_services;
  const suggested = c.suggested_services;
  const allowedTypes = (allowed && allowed.length > 0) ? ALL_TYPES.filter(t => allowed.includes(t.k)) : ALL_TYPES;
  const byDay = slots.reduce((acc, s) => { const d = s.slice(0, 10); (acc[d] = acc[d] || []).push(s); return acc; }, {});

  return (
    <div className="min-h-[100svh] bg-slate-50 pb-12" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 3rem)' }}>
      <header className="bg-slate-900 text-white" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-black tracking-tight">GS INSTAL<span className="text-orange-500">.</span></Link>
          <div className="text-xs text-slate-300">Link osobisty</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        <section className="mobile-card">
          <h1 className="text-xl font-bold text-slate-900">Cześć, {data.full_name?.split(' ')[0] || data.full_name}</h1>
          {data.apartment && (
            <p className="text-sm text-slate-600 mt-1">
              📍 {data.apartment.building_address}, m. {data.apartment.number}
              <span className="text-slate-400"> • {data.apartment.city}</span>
            </p>
          )}
          <div className="text-xs text-slate-400 mt-2">
            Link działa do {new Date(data.expires_at).toLocaleDateString('pl-PL')}
          </div>
        </section>

        {msg && (
          <div className="mobile-card bg-emerald-50 border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-emerald-800 text-sm">{msg}</div>
          </div>
        )}

        {suggested && suggested.length > 0 && (
          <section className="mobile-card bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900">Sugestia kominiarza</div>
                <div className="text-sm text-slate-700">Pomyśl o tych usługach:</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {suggested.map(s => (
                <span key={s} className="chip bg-white border border-amber-300 text-amber-900">{visitTypeLabel[s] || s}</span>
              ))}
            </div>
          </section>
        )}

        {/* Wizyty */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold text-slate-900">Twoje wizyty</h2>
            {data.apartment && (
              <button onClick={openBook} className="btn-primary text-sm py-2">
                <Plus className="w-4 h-4" /> Nowa
              </button>
            )}
          </div>
          <div className="mobile-stack">
            {data.visits.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Brak wizyt"
                body="Umów pierwszą wizytę kontrolną."
                action={data.apartment ? <button onClick={openBook} className="btn-primary">Umów wizytę</button> : null}
              />
            ) : (
              data.visits.map(v => (
                <article key={v.id} className="mobile-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900">{visitTypeLabel[v.type] || v.type}</div>
                      <div className="text-sm text-slate-500">{fmtDateTime(v.scheduled_at)}</div>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  {v.status === 'umowiona' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openReschedule(v.id)} disabled={busy} className="btn-secondary flex-1">
                        <CalendarClock className="w-4 h-4 text-orange-500" />
                        Przełóż
                      </button>
                      <button onClick={() => cancel(v.id)} disabled={busy} className="btn-danger flex-1">
                        <XCircle className="w-4 h-4" />
                        Odwołaj
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        {/* Oferty */}
        {data.offers.length > 0 && (
          <section>
            <h2 className="font-bold text-slate-900 mb-2 px-1">Oferty dla Ciebie</h2>
            <div className="mobile-stack">
              {data.offers.map(o => (
                <article key={o.id} className="mobile-card bg-amber-50 border-amber-200">
                  <div className="font-bold text-slate-900">{o.title}</div>
                  {o.description && <p className="text-sm text-slate-700 mt-1">{o.description}</p>}
                  <div className="text-3xl font-extrabold text-orange-600 mt-3">{o.price_pln} zł</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => acceptOffer(o.id)} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-4 h-4" /> Akceptuję
                    </button>
                    <button onClick={() => rejectOffer(o.id)} className="btn-secondary flex-1">
                      <X className="w-4 h-4" /> Odrzucam
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Zgłoś usterkę */}
        <button onClick={() => setMode({ type: 'issue' })}
          className="mobile-card w-full text-left flex items-center gap-3 active:bg-slate-50">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900">Zgłoś usterkę</div>
            <div className="text-xs text-slate-500">np. dymi z kominka, problem z wentylacją</div>
          </div>
        </button>

        <section className="text-center text-sm text-slate-500 py-4">
          Chcesz mieć stały dostęp? <Link to="/register" className="text-orange-600 font-bold">Załóż darmowe konto</Link>
        </section>
      </main>

      {/* Reschedule sheet */}
      <BottomSheet
        open={mode?.type === 'reschedule'}
        onClose={() => { setMode(null); setChosenSlot(null); }}
        title="Wybierz nowy termin"
        footer={chosenSlot ? (
          <button onClick={confirmReschedule} disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? '…' : `Potwierdź ${new Date(chosenSlot).toLocaleString('pl-PL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </button>
        ) : null}
      >
        <SlotGrid byDay={byDay} chosen={chosenSlot} onPick={setChosenSlot} />
      </BottomSheet>

      {/* Book sheet */}
      <BottomSheet
        open={mode?.type === 'book'}
        onClose={() => { setMode(null); setChosenSlot(null); }}
        title="Umów wizytę"
        footer={chosenSlot ? (
          <button onClick={confirmBook} disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? '…' : `Potwierdź ${new Date(chosenSlot).toLocaleString('pl-PL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`}
          </button>
        ) : null}
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">Rodzaj wizyty</span>
            <div className="space-y-2">
              {allowedTypes.map(t => (
                <button key={t.k} type="button" onClick={() => setBookForm(f => ({ ...f, type: t.k }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left ${bookForm.type === t.k ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${bookForm.type === t.k ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                    {bookForm.type === t.k && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="font-semibold text-slate-900">{t.l}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Uwagi (opcjonalnie)</label>
            <textarea className="form-input resize-none" rows="2"
              value={bookForm.notes} onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div>
            <span className="form-label">Wybierz termin</span>
            <SlotGrid byDay={byDay} chosen={chosenSlot} onPick={setChosenSlot} />
          </div>
        </div>
      </BottomSheet>

      {/* Issue sheet */}
      <BottomSheet
        open={mode?.type === 'issue'}
        onClose={() => setMode(null)}
        title="Zgłoś usterkę"
        footer={
          <button form="prospect-issue-form" type="submit" disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? '…' : 'Wyślij zgłoszenie'}
          </button>
        }
      >
        <form id="prospect-issue-form" onSubmit={submitIssue} className="space-y-3">
          <div>
            <label className="form-label">Co się dzieje?</label>
            <input className="form-input" required placeholder="np. Dymi z komina"
              value={issue.title} onChange={e => setIssue(i => ({ ...i, title: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Szczegóły</label>
            <textarea className="form-input resize-none" rows="3"
              value={issue.description} onChange={e => setIssue(i => ({ ...i, description: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Priorytet</label>
            <select className="form-input" value={issue.severity}
              onChange={e => setIssue(i => ({ ...i, severity: e.target.value }))}>
              <option value="low">Niski</option>
              <option value="normal">Normalny</option>
              <option value="high">Wysoki</option>
              <option value="urgent">PILNE</option>
            </select>
          </div>
          <div>
            <span className="form-label">Zdjęcie (opcjonalnie)</span>
            {issuePhoto ? (
              <div className="relative">
                <img src={issuePhoto} alt="Podgląd" className="w-full rounded-xl" />
                <button type="button" onClick={() => setIssuePhoto(null)}
                  className="absolute top-2 right-2 bg-white/90 px-3 py-1.5 rounded-full text-sm font-bold text-rose-600 shadow">
                  Usuń
                </button>
              </div>
            ) : (
              <label className="block">
                <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
                <span className="btn-secondary w-full py-3 cursor-pointer">
                  <Camera className="w-4 h-4 text-orange-500" />
                  Dodaj zdjęcie
                </span>
              </label>
            )}
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}

function SlotGrid({ byDay, chosen, onPick }) {
  if (Object.keys(byDay).length === 0) {
    return <div className="text-sm text-slate-400 text-center py-6">Brak dostępnych terminów.</div>;
  }
  return (
    <div className="space-y-4">
      {Object.entries(byDay).map(([day, dayslots]) => (
        <div key={day}>
          <div className="text-sm font-semibold text-slate-700 mb-2">
            {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {dayslots.map(s => {
              const active = chosen === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onPick(s)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 ${active ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 active:bg-orange-50 active:border-orange-300'}`}
                >
                  {s.slice(11, 16)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
