import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Phone, CalendarClock, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import StatusBadge from '../../components/mobile/StatusBadge';
import BottomSheet from '../../components/mobile/BottomSheet';
import Spinner from '../../components/mobile/Spinner';

export default function WizytaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [protocol, setProtocol] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function load() {
    try {
      const data = await api(`/visits/${id}`);
      setV(data);
      if (data.status === 'zakonczona') {
        try { setProtocol(await api(`/protocols/visit/${id}`)); } catch { /* no protocol */ }
      }
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function openReschedule() {
    setSheetOpen(true);
    setSlotsLoading(true);
    try {
      const r = await api(`/visits/slots/${v.apartment_id}`);
      setSlots(r.slots);
    } finally { setSlotsLoading(false); }
  }

  async function reschedule(when) {
    setBusy(true);
    try {
      await api(`/visits/${id}/cancel`, { method: 'POST' });
      await api('/visits/book', {
        method: 'POST',
        body: { apartment_id: v.apartment_id, scheduled_at: when, type: v.type, kominiarz_id: v.kominiarz_id },
      });
      nav('/panel/mieszkaniec/historia');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function cancel() {
    if (!confirm('Anulować tę wizytę?')) return;
    setBusy(true);
    try {
      await api(`/visits/${id}/cancel`, { method: 'POST' });
      nav('/panel/mieszkaniec/historia');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (err) return (
    <div className="panel-page">
      <MobilePageHeader title="Błąd" back />
      <div className="mobile-card border-rose-200 bg-rose-50 text-rose-700">{err}</div>
    </div>
  );
  if (!v) return (
    <div className="panel-page">
      <MobilePageHeader title="Ładowanie…" back />
      <Spinner />
    </div>
  );

  const byDay = slots.reduce((acc, s) => {
    const d = s.slice(0, 10);
    (acc[d] = acc[d] || []).push(s);
    return acc;
  }, {});
  const canModify = v.status === 'umowiona' && new Date(v.scheduled_at) > new Date();

  return (
    <div className="panel-page">
      <MobilePageHeader title={visitTypeLabel[v.type] || v.type} back="/panel/mieszkaniec/historia" />

      <section className="mobile-card">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="text-xs uppercase text-slate-500 tracking-wide font-semibold">Termin</div>
            <div className="font-bold text-lg text-slate-900">{fmtDateTime(v.scheduled_at)}</div>
          </div>
          <StatusBadge status={v.status} />
        </div>
        <div className="text-sm text-slate-600">
          📍 {v.building_address}{v.apt_number ? `, m. ${v.apt_number}` : ''} • {v.city}
        </div>
      </section>

      {v.kominiarz_name && (
        <section className="mobile-card">
          <div className="text-xs uppercase text-slate-500 tracking-wide font-semibold mb-2">Kominiarz</div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg">
              {v.kominiarz_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{v.kominiarz_name}</div>
              {v.nr_uprawnien && <div className="text-xs text-slate-500">Nr uprawnień: {v.nr_uprawnien}</div>}
            </div>
            {v.kominiarz_phone && (
              <a href={`tel:${v.kominiarz_phone}`} className="btn-primary py-2.5 px-4" aria-label={`Zadzwoń ${v.kominiarz_phone}`}>
                <Phone className="w-4 h-4" />
                Zadzwoń
              </a>
            )}
          </div>
        </section>
      )}

      {v.notes && (
        <section className="mobile-card bg-blue-50 border-blue-200">
          <div className="text-xs uppercase text-blue-600 tracking-wide font-bold mb-1">Uwagi</div>
          <p className="text-sm text-slate-800">{v.notes}</p>
        </section>
      )}

      {protocol && (
        <section className="mobile-card">
          <div className="text-xs uppercase text-slate-500 tracking-wide font-semibold mb-2">Protokół wizyty</div>
          <div className="space-y-2 text-sm">
            <Row label="Wynik">
              <strong className={
                protocol.result === 'sprawny' ? 'text-emerald-600' :
                protocol.result === 'nieszczelny' ? 'text-amber-600' : 'text-rose-600'
              }>{protocol.result.toUpperCase()}</strong>
            </Row>
            <Row label="Podpisał">{protocol.signed_by}</Row>
            {protocol.findings && <Row label="Usterki">{protocol.findings}</Row>}
            {protocol.recommendations && <Row label="Zalecenia">{protocol.recommendations}</Row>}
          </div>
        </section>
      )}

      {canModify && (
        <div className="sticky-cta">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex gap-2">
            <button
              onClick={openReschedule}
              disabled={busy}
              className="btn-secondary flex-1"
            >
              <CalendarClock className="w-4 h-4 text-orange-500" />
              Przełóż
            </button>
            <button
              onClick={cancel}
              disabled={busy}
              className="btn-danger flex-1"
            >
              <XCircle className="w-4 h-4" />
              Anuluj
            </button>
          </div>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Wybierz nowy termin">
        {slotsLoading ? (
          <Spinner label="Pobieram wolne okna…" />
        ) : Object.keys(byDay).length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">Brak wolnych slotów.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDay).map(([day, dayslots]) => (
              <div key={day}>
                <div className="text-sm font-semibold text-slate-700 mb-2">
                  {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dayslots.map(s => (
                    <button
                      key={s}
                      onClick={() => reschedule(s)}
                      disabled={busy}
                      className="py-3 rounded-xl text-sm font-bold border-2 border-slate-200 active:border-orange-300 active:bg-orange-50"
                    >
                      {s.slice(11, 16)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-500 w-24 flex-shrink-0">{label}:</span>
      <span className="flex-1 text-slate-800">{children}</span>
    </div>
  );
}
