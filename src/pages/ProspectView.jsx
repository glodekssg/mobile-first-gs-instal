// Strona dostępna bez logowania, na podstawie magic linka /p/:token
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../lib/format';

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
  const [bookForm, setBookForm] = useState({ type: 'kontrola', notes: '' });

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
    setMode({ type: 'reschedule', visitId });
    await loadSlots();
  }
  async function openBook() {
    const allowed = data?.constraints?.allowed_services;
    const defaultType = (allowed && allowed.length > 0) ? allowed[0] : 'kontrola';
    setBookForm({ type: defaultType, notes: '' });
    setMode('book');
    await loadSlots();
  }
  async function reschedule(visitId, when) {
    setBusy(true);
    try {
      await api(`/visits/${visitId}/reschedule`, { method: 'POST', body: { scheduled_at: when } });
      setMsg('✓ Wizyta przełożona.');
      setMode(null); load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function book(when) {
    setBusy(true);
    try {
      await api('/visits/book', { method: 'POST', body: { scheduled_at: when, type: bookForm.type, notes: bookForm.notes } });
      setMsg('✓ Wizyta umówiona!');
      setMode(null); load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function cancel(visitId) {
    const reason = prompt('Powód odwołania (opcjonalnie):') || '';
    if (reason === null) return;
    setBusy(true);
    try {
      await api(`/visits/${visitId}/cancel`, { method: 'POST', body: { reason } });
      setMsg('✓ Wizyta odwołana.');
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function submitIssue(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/issue', { method: 'POST', body: issue });
      setMsg('✓ Zgłoszenie wysłane.');
      setMode(null); setIssue({ title: '', description: '', severity: 'normal' });
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }
  async function acceptOffer(id) {
    if (!confirm('Zaakceptować ofertę?')) return;
    await api(`/offers/${id}/accept`, { method: 'POST' });
    setMsg('✓ Oferta zaakceptowana. Wizyta realizacyjna umówiona.');
    load();
  }
  async function rejectOffer(id) {
    await api(`/offers/${id}/reject`, { method: 'POST' });
    load();
  }

  if (err) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md text-center">
        <div className="text-rose-600 text-xl font-semibold mb-2">Link nieprawidłowy</div>
        <p className="text-slate-600">{err}</p>
        <Link to="/" className="mt-4 inline-block text-orange-600 hover:underline">← Strona główna</Link>
      </div>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center">Ładowanie…</div>;

  const c = data.constraints || {};
  const allowed = c.allowed_services;
  const suggested = c.suggested_services;
  const allowedTypes = (allowed && allowed.length > 0) ? ALL_TYPES.filter(t => allowed.includes(t.k)) : ALL_TYPES;
  const byDay = slots.reduce((acc, s) => { const d = s.slice(0, 10); (acc[d] = acc[d] || []).push(s); return acc; }, {});
  const dateRangeLabel = c.slots_from || c.slots_to
    ? `${c.slots_from ? new Date(c.slots_from).toLocaleDateString('pl-PL') : 'dowolnie'} – ${c.slots_to ? new Date(c.slots_to).toLocaleDateString('pl-PL') : 'dowolnie'}`
    : null;
  const hourLabel = (c.slot_hour_from != null || c.slot_hour_to != null)
    ? `${c.slot_hour_from ?? 8}:00 – ${c.slot_hour_to ?? 16}:00`
    : null;
  const WEEKDAY_LABELS = ['', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb', 'nd'];
  const weekdaysLabel = c.slot_weekdays && c.slot_weekdays.length > 0
    ? c.slot_weekdays.map(d => WEEKDAY_LABELS[d]).join(', ')
    : null;

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <header className="bg-slate-900 text-white py-6">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black tracking-tight">GS INSTAL<span className="text-orange-500">.</span></Link>
          <div className="text-sm text-slate-300">Bezpieczny link osobisty</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-1">Witaj, {data.full_name}</h1>
          {data.apartment && (
            <p className="text-slate-500">
              {data.apartment.building_address}, m. {data.apartment.number} • {data.apartment.city}
              {data.apartment.cooperative_name && ` • ${data.apartment.cooperative_name}`}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 self-center">Link działa do {new Date(data.expires_at).toLocaleDateString('pl-PL')}</span>
            {dateRangeLabel && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">📅 Daty: {dateRangeLabel}</span>
            )}
            {hourLabel && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">⏰ Godziny: {hourLabel}</span>
            )}
            {weekdaysLabel && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">📆 Dni: {weekdaysLabel}</span>
            )}
            {c.slot_duration_min && (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">⏱ Wizyta: {c.slot_duration_min} min</span>
            )}
            {allowed && allowed.length > 0 && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                🔧 Usługi: {allowed.map(a => visitTypeLabel[a]).join(', ')}
              </span>
            )}
          </div>
        </div>

        {msg && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">{msg}</div>}

        {suggested && suggested.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-2">💡 Kominiarz sugeruje dla Pana/Pani:</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggested.map(s => (
                <span key={s} className="bg-white border border-orange-300 px-3 py-1 rounded-full text-sm">{visitTypeLabel[s] || s}</span>
              ))}
            </div>
            <p className="text-sm text-slate-600">Kliknij „Umów nową wizytę" poniżej, aby wybrać termin.</p>
          </div>
        )}

        {/* WIZYTY */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Twoje wizyty</h2>
            {data.apartment && (
              <button onClick={openBook} className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600">
                + Umów nową wizytę
              </button>
            )}
          </div>
          {data.visits.length === 0 && <div className="text-slate-400 text-sm py-4 text-center">Brak wizyt.</div>}
          <div className="space-y-3">
            {data.visits.map(v => (
              <div key={v.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold">{visitTypeLabel[v.type] || v.type}</div>
                    <div className="text-sm text-slate-500">{fmtDateTime(v.scheduled_at)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span>
                </div>
                {v.status === 'umowiona' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openReschedule(v.id)} disabled={busy}
                      className="px-3 py-1.5 text-sm border-2 border-slate-300 hover:border-orange-400 rounded">Przełóż</button>
                    <button onClick={() => cancel(v.id)} disabled={busy}
                      className="px-3 py-1.5 text-sm border-2 border-rose-300 text-rose-600 hover:bg-rose-50 rounded">Odwołaj</button>
                  </div>
                )}
                {mode?.type === 'reschedule' && mode.visitId === v.id && (
                  <SlotPicker byDay={byDay} onPick={(s) => reschedule(v.id, s)} onCancel={() => setMode(null)} busy={busy} />
                )}
              </div>
            ))}
          </div>

          {mode === 'book' && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold mb-3">Umów nową wizytę</h3>
              <label className="block text-sm font-medium mb-1">Rodzaj wizyty</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {allowedTypes.map(t => (
                  <button key={t.k} type="button" onClick={() => setBookForm(f => ({ ...f, type: t.k }))}
                    className={`p-2 text-sm rounded border-2 ${bookForm.type === t.k ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                    {t.l}
                  </button>
                ))}
              </div>
              <textarea className="w-full border rounded p-2 text-sm mb-3" rows="2" placeholder="Uwagi (opcjonalnie)"
                value={bookForm.notes} onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))} />
              <SlotPicker byDay={byDay} onPick={(s) => book(s)} onCancel={() => setMode(null)} busy={busy} title="Wybierz termin:" />
            </div>
          )}
        </div>

        {/* OFERTY */}
        {data.offers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-3">Mamy dla Pana/Pani propozycję</h2>
            {data.offers.map(o => (
              <div key={o.id} className="bg-white rounded-lg p-4 mb-3">
                <h3 className="font-semibold">{o.title}</h3>
                {o.description && <p className="text-sm text-slate-600 mt-1">{o.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-2xl font-bold text-orange-600">{o.price_pln} zł</div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptOffer(o.id)} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded">Akceptuję</button>
                    <button onClick={() => rejectOffer(o.id)} className="px-3 py-1.5 text-sm border-2 rounded">Odrzucam</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ZGŁOSZENIE USTERKI */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {mode === 'issue' ? (
            <form onSubmit={submitIssue} className="space-y-3">
              <h2 className="text-lg font-semibold">Zgłoś usterkę</h2>
              <input className="w-full border rounded p-2" required placeholder="np. Dymi z komina"
                value={issue.title} onChange={e => setIssue(i => ({ ...i, title: e.target.value }))} />
              <textarea className="w-full border rounded p-2" rows="3" placeholder="Opisz szczegóły..."
                value={issue.description} onChange={e => setIssue(i => ({ ...i, description: e.target.value }))} />
              <select className="w-full border rounded p-2" value={issue.severity}
                onChange={e => setIssue(i => ({ ...i, severity: e.target.value }))}>
                <option value="low">Niski priorytet</option>
                <option value="normal">Normalny</option>
                <option value="high">Wysoki</option>
                <option value="urgent">PILNE</option>
              </select>
              <div className="flex gap-2">
                <button disabled={busy} className="px-4 py-2 bg-orange-500 text-white rounded">{busy ? '...' : 'Wyślij'}</button>
                <button type="button" onClick={() => setMode(null)} className="px-4 py-2 border rounded">Anuluj</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setMode('issue')}
              className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-orange-400 rounded-lg text-slate-600 hover:text-orange-600">
              + Zgłoś usterkę (np. dymi z kominka, problem z wentylacją)
            </button>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-600">
            Chcesz mieć stały dostęp i historię? <Link to="/register" className="text-orange-600 font-medium hover:underline">Załóż darmowe konto</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function SlotPicker({ byDay, onPick, onCancel, busy, title = 'Wybierz nowy termin:' }) {
  if (Object.keys(byDay).length === 0) {
    return <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded text-sm text-rose-700">
      Brak dostępnych terminów. Skontaktuj się z kominiarzem.
      <button onClick={onCancel} className="ml-3 text-xs underline">Zamknij</button>
    </div>;
  }
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded">
      <div className="font-medium mb-2 text-sm">{title}</div>
      {Object.entries(byDay).map(([day, dayslots]) => (
        <div key={day} className="mb-2">
          <div className="text-xs font-medium text-slate-600 mb-1">
            {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {dayslots.map(s => (
              <button key={s} onClick={() => onPick(s)} disabled={busy}
                className="px-2.5 py-1 text-xs border hover:bg-orange-50 hover:border-orange-400 rounded">
                {s.slice(11, 16)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button onClick={onCancel} className="mt-2 text-xs text-slate-500">Anuluj</button>
    </div>
  );
}
