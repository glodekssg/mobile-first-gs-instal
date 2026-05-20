import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';
import Spinner from '../../components/mobile/Spinner';

const TYPES = [
  ['kontrola', 'Kontrola okresowa', 'Standardowa kontrola przewodów'],
  ['czyszczenie', 'Czyszczenie', 'Sadza, smoła, mech'],
  ['inspekcja_kamera', 'Inspekcja kamerą', 'Diagnostyka komina'],
  ['kontrola_gaz', 'Kontrola gazu', 'Instalacja gazowa'],
  ['opinia', 'Opinia kominiarska', 'Dokument do urzędu'],
];

export default function WybierzTermin() {
  const [apartments, setApartments] = useState([]);
  const [selectedApt, setSelectedApt] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [kominiarzId, setKominiarzId] = useState(null);
  const [type, setType] = useState('kontrola');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [chosenSlot, setChosenSlot] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api('/apartments/mine').then(a => {
      setApartments(a);
      if (a.length === 1) {
        setSelectedApt(a[0].id);
        loadSlots(a[0].id);
      }
    });
  }, []);

  async function loadSlots(aptId) {
    setLoadingSlots(true);
    try {
      const { slots, kominiarz_id } = await api(`/visits/slots/${aptId}`);
      setSlots(slots);
      setKominiarzId(kominiarz_id);
    } finally { setLoadingSlots(false); }
  }

  async function confirmBooking() {
    if (!chosenSlot || !selectedApt) return;
    setBusy(true); setErr(null);
    try {
      await api('/visits/book', {
        method: 'POST',
        body: {
          apartment_id: Number(selectedApt),
          scheduled_at: chosenSlot,
          type,
          kominiarz_id: kominiarzId,
          notes,
        },
      });
      setMsg('Wizyta umówiona. Otrzymasz potwierdzenie e-mailem.');
      setTimeout(() => nav('/panel/mieszkaniec'), 1300);
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  if (apartments.length === 0) {
    return (
      <div className="panel-page">
        <MobilePageHeader title="Umów wizytę" back="/panel/mieszkaniec" sticky={false} />
        <EmptyState
          icon={CalendarIcon}
          title="Najpierw połącz mieszkanie"
          body="Aby umówić wizytę, wprowadź kod zaproszenia na stronie głównej panelu."
        />
      </div>
    );
  }

  const byDay = slots.reduce((acc, s) => {
    const day = s.slice(0, 10);
    (acc[day] = acc[day] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="panel-page">
      <MobilePageHeader title="Umów wizytę" back="/panel/mieszkaniec" subtitle="3 proste kroki" />

      {msg && (
        <div className="mobile-card bg-emerald-50 border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="text-emerald-800 text-sm">{msg}</div>
        </div>
      )}

      {/* Krok 1: mieszkanie (jeśli >1) */}
      {apartments.length > 1 && (
        <section className="mobile-card">
          <div className="text-xs uppercase tracking-wide text-orange-600 font-bold mb-1">Krok 1 — mieszkanie</div>
          <select
            className="form-input"
            value={selectedApt}
            onChange={e => { setSelectedApt(e.target.value); setChosenSlot(null); loadSlots(e.target.value); }}
          >
            <option value="">— wybierz —</option>
            {apartments.map(a => (
              <option key={a.id} value={a.id}>{a.building_address}, m. {a.number}</option>
            ))}
          </select>
        </section>
      )}

      {/* Krok 2: typ wizyty */}
      <section className="mobile-card">
        <div className="text-xs uppercase tracking-wide text-orange-600 font-bold mb-2">
          Krok {apartments.length > 1 ? 2 : 1} — rodzaj wizyty
        </div>
        <div className="space-y-2">
          {TYPES.map(([k, label, hint]) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${type === k ? 'border-orange-500 bg-orange-50' : 'border-slate-200 active:bg-slate-50'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${type === k ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                {type === k && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{label}</div>
                <div className="text-xs text-slate-500">{hint}</div>
              </div>
            </button>
          ))}
        </div>
        <label htmlFor="notes" className="form-label mt-4">Uwagi (opcjonalnie)</label>
        <textarea
          id="notes"
          className="form-input resize-none"
          rows="2"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="np. „prosimy dzwonić przed przyjazdem"
        />
      </section>

      {/* Krok 3: termin */}
      {selectedApt && (
        <section className="mobile-card">
          <div className="text-xs uppercase tracking-wide text-orange-600 font-bold mb-2">
            Krok {apartments.length > 1 ? 3 : 2} — wybierz termin
          </div>
          {loadingSlots ? (
            <Spinner label="Pobieram wolne okna…" />
          ) : Object.keys(byDay).length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="Brak wolnych slotów"
              body="Skontaktuj się z nami telefonicznie — postaramy się dopasować."
            />
          ) : (
            <div className="space-y-4">
              {Object.entries(byDay).map(([day, dayslots]) => (
                <div key={day}>
                  <div className="text-sm font-semibold text-slate-700 mb-2">
                    {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dayslots.map(s => {
                      const active = chosenSlot === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setChosenSlot(s)}
                          className={`py-3 rounded-xl text-sm font-bold border-2 transition-colors ${active ? 'bg-orange-500 text-white border-orange-500' : 'border-slate-200 active:border-orange-300 active:bg-orange-50 text-slate-800'}`}
                        >
                          {s.slice(11, 16)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-4 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            Okna pochodzą z Google Calendar kominiarza. Po rezerwacji event automatycznie wpadnie do jego kalendarza.
          </p>
        </section>
      )}

      {err && <div className="text-rose-600 text-sm mobile-card border-rose-200 bg-rose-50">{err}</div>}

      {/* Sticky confirm */}
      {chosenSlot && (
        <div className="sticky-cta">
          <div className="mx-auto max-w-md p-3 bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500">Wybrany termin</div>
              <div className="font-bold text-slate-900 truncate">
                {new Date(chosenSlot).toLocaleString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button
              onClick={confirmBooking}
              disabled={busy}
              className="btn-primary disabled:opacity-60"
            >
              {busy ? '…' : 'Potwierdź'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
