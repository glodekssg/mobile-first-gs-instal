import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../../lib/format';

export default function WizytaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [protocol, setProtocol] = useState(null);
  const [slots, setSlots] = useState([]);
  const [showReschedule, setShowReschedule] = useState(false);

  async function load() {
    try {
      const data = await api(`/visits/${id}`);
      setV(data);
      if (data.status === 'zakonczona') {
        try { setProtocol(await api(`/protocols/visit/${id}`)); } catch {}
      }
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function openReschedule() {
    setShowReschedule(true);
    const r = await api(`/visits/slots/${v.apartment_id}`);
    setSlots(r.slots);
  }

  async function reschedule(when) {
    setBusy(true);
    try {
      // mieszkaniec nie ma PATCH dostępu, więc: cancel + book nowej wizyty (same type)
      await api(`/visits/${id}/cancel`, { method: 'POST' });
      await api('/visits/book', { method: 'POST', body: {
        apartment_id: v.apartment_id, scheduled_at: when, type: v.type, kominiarz_id: v.kominiarz_id,
      }});
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

  if (err) return <div className="bg-rose-50 border border-rose-200 rounded p-4 text-rose-700">{err}</div>;
  if (!v) return <div>Ładowanie…</div>;

  const byDay = slots.reduce((acc, s) => { const d = s.slice(0, 10); (acc[d] = acc[d] || []).push(s); return acc; }, {});
  const canModify = v.status === 'umowiona' && new Date(v.scheduled_at) > new Date();

  return (
    <div className="space-y-4">
      <Link to="/panel/mieszkaniec/historia" className="text-sm text-slate-500">← Historia</Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">{visitTypeLabel[v.type] || v.type}</h1>
            <p className="text-slate-500">{fmtDateTime(v.scheduled_at)}</p>
            <p className="text-sm text-slate-500 mt-1">📍 {v.building_address}{v.apt_number ? `, m. ${v.apt_number}` : ''} • {v.city}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span>
        </div>

        {v.kominiarz_name && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-xs uppercase text-slate-500 mb-1">Kominiarz</div>
            <div className="font-semibold">{v.kominiarz_name}</div>
            {v.nr_uprawnien && <div className="text-xs text-slate-500">Nr uprawnień: {v.nr_uprawnien}</div>}
            {v.kominiarz_phone && (
              <a href={`tel:${v.kominiarz_phone}`} className="text-orange-600 text-sm hover:underline">📞 {v.kominiarz_phone}</a>
            )}
          </div>
        )}

        {v.notes && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="text-xs uppercase text-blue-600 mb-1">Uwagi</div>
            {v.notes}
          </div>
        )}

        {canModify && (
          <div className="flex gap-2 mt-6 pt-4 border-t">
            <button onClick={openReschedule} disabled={busy}
              className="px-4 py-2 border-2 border-slate-300 hover:border-orange-400 rounded-md text-sm font-medium">
              📅 Przełóż termin
            </button>
            <button onClick={cancel} disabled={busy}
              className="px-4 py-2 border-2 border-rose-300 text-rose-600 hover:bg-rose-50 rounded-md text-sm font-medium">
              ✗ Anuluj wizytę
            </button>
          </div>
        )}
      </div>

      {showReschedule && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">Wybierz nowy termin</h3>
          {Object.keys(byDay).length === 0 && <div className="text-slate-400 text-sm">Ładowanie...</div>}
          <div className="space-y-3">
            {Object.entries(byDay).map(([day, dayslots]) => (
              <div key={day}>
                <div className="text-sm font-medium text-slate-600 mb-1">
                  {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dayslots.map(s => (
                    <button key={s} onClick={() => reschedule(s)} disabled={busy}
                      className="px-3 py-1.5 border-2 hover:border-orange-400 hover:bg-orange-50 rounded text-sm">
                      {s.slice(11, 16)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowReschedule(false)} className="mt-3 text-sm text-slate-500">Anuluj</button>
        </div>
      )}

      {protocol && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">Protokół wizyty</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Wynik:</span> <strong className={
              protocol.result === 'sprawny' ? 'text-emerald-600' :
              protocol.result === 'nieszczelny' ? 'text-amber-600' : 'text-rose-600'}>{protocol.result.toUpperCase()}</strong></div>
            <div><span className="text-slate-500">Podpisał:</span> {protocol.signed_by}</div>
            <div className="col-span-2"><span className="text-slate-500">Usterki:</span> {protocol.findings || '—'}</div>
            <div className="col-span-2"><span className="text-slate-500">Zalecenia:</span> {protocol.recommendations || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
