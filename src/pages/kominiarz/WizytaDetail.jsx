import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Edit3, CheckCircle2, XCircle, Ban, MapPin, Phone, ClipboardCheck, FileText, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import StatusBadge from '../../components/mobile/StatusBadge';
import BottomSheet from '../../components/mobile/BottomSheet';
import Spinner from '../../components/mobile/Spinner';

const TYPES = ['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'];
const RESULTS = [
  { v: 'sprawny', label: 'Sprawny', color: 'emerald', icon: CheckCircle2 },
  { v: 'nieszczelny', label: 'Nieszczelny', color: 'amber', icon: AlertTriangle },
  { v: 'niesprawny', label: 'Niesprawny', color: 'rose', icon: XCircle },
];

export default function WizytaDetail() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [protoForm, setProtoForm] = useState({ result: 'sprawny', findings: '', recommendations: '' });
  const [busy, setBusy] = useState(false);
  const [editSheet, setEditSheet] = useState(false);
  const [protocolSheet, setProtocolSheet] = useState(false);
  const [edit, setEdit] = useState({ scheduled_at: '', type: '', notes: '', duration_min: 60 });

  async function load() {
    try {
      const v = await api(`/visits/${id}`);
      setVisit(v);
      setEdit({
        scheduled_at: v.scheduled_at ? v.scheduled_at.slice(0, 16) : '',
        type: v.type, notes: v.notes || '', duration_min: v.duration_min || 60,
      });
      if (v?.status === 'zakonczona') {
        try { setProtocol(await api(`/protocols/visit/${id}`)); } catch { /* no protocol */ }
      }
    } catch (e) { console.error(e); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function complete() {
    setBusy(true);
    await api(`/visits/${id}/complete`, { method: 'POST', body: protoForm });
    setBusy(false);
    setProtocolSheet(false);
    load();
  }
  async function refused() {
    if (!confirm('Oznaczyć jako odmowę wpuszczenia?')) return;
    await api(`/visits/${id}/refused`, { method: 'POST' });
    load();
  }
  async function cancel() {
    if (!confirm('Anulować wizytę?')) return;
    await api(`/visits/${id}`, { method: 'PATCH', body: { status: 'odwolana' } });
    load();
  }
  async function saveEdit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...edit };
      if (body.scheduled_at) body.scheduled_at = new Date(body.scheduled_at).toISOString();
      body.duration_min = Number(body.duration_min);
      await api(`/visits/${id}`, { method: 'PATCH', body });
      setEditSheet(false);
      load();
    } finally { setBusy(false); }
  }

  if (!visit) return (
    <div className="panel-page">
      <MobilePageHeader title="Wizyta" back="/panel/kominiarz/wizyty" />
      <Spinner />
    </div>
  );

  const canComplete = visit.status === 'umowiona';

  return (
    <div className="panel-page">
      <MobilePageHeader title={visitTypeLabel[visit.type] || visit.type} back="/panel/kominiarz/wizyty" />

      <section className="mobile-card">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="text-xs uppercase text-slate-500 tracking-wide font-semibold">Termin</div>
            <div className="font-bold text-lg text-slate-900">{fmtDateTime(visit.scheduled_at)}</div>
            <div className="text-xs text-slate-400">{visit.duration_min || 60} min</div>
          </div>
          <StatusBadge status={visit.status} />
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400" />
          {visit.building_address}{visit.apt_number ? `, m. ${visit.apt_number}` : ''}
        </div>
        {visit.notes && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-slate-800">
            {visit.notes}
          </div>
        )}
        {visit.status === 'umowiona' && (
          <button onClick={() => setEditSheet(true)} className="btn-ghost text-orange-600 mt-3 -ml-2">
            <Edit3 className="w-4 h-4" /> Edytuj termin / typ
          </button>
        )}
      </section>

      {visit.resident_name && (
        <section className="mobile-card">
          <div className="text-xs uppercase text-slate-500 tracking-wide font-semibold mb-2">Mieszkaniec</div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              {visit.resident_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 truncate">{visit.resident_name}</div>
              {visit.resident_email && <div className="text-xs text-slate-500 truncate">{visit.resident_email}</div>}
            </div>
            {visit.resident_phone && (
              <a href={`tel:${visit.resident_phone}`} className="btn-primary py-2.5 px-4">
                <Phone className="w-4 h-4" />
                Zadzwoń
              </a>
            )}
          </div>
        </section>
      )}

      {protocol && (
        <section className="mobile-card">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <div className="font-semibold text-slate-900">Protokół</div>
          </div>
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

      {canComplete && (
        <div className="sticky-cta">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 grid grid-cols-3 gap-2">
            <button onClick={() => setProtocolSheet(true)} disabled={busy} className="btn-primary py-3 col-span-3">
              <ClipboardCheck className="w-5 h-5" />
              Zakończ wizytę
            </button>
            <button onClick={refused} disabled={busy} className="btn-secondary py-2.5 text-xs col-span-1">
              <Ban className="w-3.5 h-3.5" />
              Odmowa
            </button>
            <button onClick={cancel} disabled={busy} className="btn-secondary py-2.5 text-xs col-span-2 text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
              Anuluj wizytę
            </button>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      <BottomSheet
        open={editSheet}
        onClose={() => setEditSheet(false)}
        title="Edycja wizyty"
        footer={
          <button form="edit-visit-form" type="submit" disabled={busy} className="btn-primary w-full py-3.5">
            {busy ? '…' : 'Zapisz'}
          </button>
        }
      >
        <form id="edit-visit-form" onSubmit={saveEdit} className="space-y-3">
          <div>
            <label className="form-label">Termin</label>
            <input className="form-input" type="datetime-local" required
              value={edit.scheduled_at} onChange={e => setEdit(s => ({ ...s, scheduled_at: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Rodzaj</label>
            <select className="form-input" value={edit.type}
              onChange={e => setEdit(s => ({ ...s, type: e.target.value }))}>
              {TYPES.map(t => <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Czas (min)</label>
            <input className="form-input" type="number" min="15" step="15" inputMode="numeric"
              value={edit.duration_min} onChange={e => setEdit(s => ({ ...s, duration_min: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Uwagi</label>
            <textarea className="form-input resize-none" rows="3"
              value={edit.notes} onChange={e => setEdit(s => ({ ...s, notes: e.target.value }))} />
          </div>
        </form>
      </BottomSheet>

      {/* Protocol sheet */}
      <BottomSheet
        open={protocolSheet}
        onClose={() => setProtocolSheet(false)}
        title="Protokół wizyty"
        footer={
          <button onClick={complete} disabled={busy} className="btn-primary w-full py-3.5 bg-emerald-600 hover:bg-emerald-700">
            {busy ? '…' : 'Zatwierdź protokół'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <span className="form-label">Wynik kontroli</span>
            <div className="grid grid-cols-1 gap-2">
              {RESULTS.map(r => {
                const Ico = r.icon;
                const active = protoForm.result === r.v;
                const colorMap = {
                  emerald: active ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200',
                  amber: active ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200',
                  rose: active ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200',
                };
                return (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setProtoForm(f => ({ ...f, result: r.v }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left font-semibold ${colorMap[r.color]}`}
                  >
                    <Ico className={`w-5 h-5 text-${r.color}-600`} />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="findings" className="form-label">Wykryte usterki</label>
            <textarea
              id="findings"
              className="form-input resize-none"
              rows="3"
              placeholder="np. nieszczelność w przewodzie spalinowym…"
              value={protoForm.findings}
              onChange={e => setProtoForm(f => ({ ...f, findings: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="recommendations" className="form-label">Zalecenia</label>
            <textarea
              id="recommendations"
              className="form-input resize-none"
              rows="3"
              placeholder="np. montaż wkładu stalowego…"
              value={protoForm.recommendations}
              onChange={e => setProtoForm(f => ({ ...f, recommendations: e.target.value }))}
            />
          </div>
          {(protoForm.result === 'nieszczelny' || protoForm.result === 'niesprawny') && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
              💡 Po zatwierdzeniu system automatycznie wygeneruje ofertę upsell dla mieszkańca.
            </div>
          )}
        </div>
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
