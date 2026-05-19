import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../../lib/format';

const TYPES = ['kontrola', 'czyszczenie', 'inspekcja_kamera', 'montaz_wkladu', 'montaz_nasady', 'kontrola_gaz', 'opinia'];

export default function WizytaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [visit, setVisit] = useState(null);
  const [protocol, setProtocol] = useState(null);
  const [form, setForm] = useState({ result: 'sprawny', findings: '', recommendations: '' });
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
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
        try { setProtocol(await api(`/protocols/visit/${id}`)); } catch {}
      }
    } catch (e) { console.error(e); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function complete() {
    setBusy(true);
    await api(`/visits/${id}/complete`, { method: 'POST', body: form });
    setBusy(false);
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
      setEditMode(false);
      load();
    } finally { setBusy(false); }
  }

  if (!visit) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <Link to="/panel/kominiarz/wizyty" className="text-sm text-slate-500">← Wszystkie wizyty</Link>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{visit.building_address}{visit.apt_number && ` / m. ${visit.apt_number}`}</h1>
            <div className="text-slate-500">{visitTypeLabel[visit.type] || visit.type} • {fmtDateTime(visit.scheduled_at)}</div>
            {visit.duration_min && <div className="text-xs text-slate-400">Czas: {visit.duration_min} min</div>}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded ${statusColor[visit.status]}`}>{statusLabel[visit.status]}</span>
            {visit.status === 'umowiona' && !editMode && (
              <button onClick={() => setEditMode(true)} className="text-sm text-orange-600 hover:underline">Edytuj</button>
            )}
          </div>
        </div>
        {visit.notes && !editMode && <div className="mt-4 p-3 bg-slate-50 rounded text-sm">{visit.notes}</div>}

        {editMode && (
          <form onSubmit={saveEdit} className="mt-4 pt-4 border-t space-y-3">
            <h3 className="font-semibold text-sm">Edycja wizyty</h3>
            <input className="w-full border rounded p-2 text-sm" type="datetime-local" required
              value={edit.scheduled_at} onChange={e => setEdit(s => ({ ...s, scheduled_at: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <select className="border rounded p-2 text-sm" value={edit.type}
                onChange={e => setEdit(s => ({ ...s, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{visitTypeLabel[t]}</option>)}
              </select>
              <input className="border rounded p-2 text-sm" type="number" min="15" step="15"
                value={edit.duration_min} onChange={e => setEdit(s => ({ ...s, duration_min: e.target.value }))} />
            </div>
            <textarea className="w-full border rounded p-2 text-sm" rows="2" placeholder="Uwagi"
              value={edit.notes} onChange={e => setEdit(s => ({ ...s, notes: e.target.value }))} />
            <div className="flex gap-2">
              <button disabled={busy} className="px-4 py-2 bg-orange-500 text-white rounded text-sm">{busy ? '...' : 'Zapisz'}</button>
              <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 border rounded text-sm">Anuluj</button>
            </div>
          </form>
        )}
      </div>

      {visit.status === 'umowiona' && !editMode && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Zakończ wizytę — protokół</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {['sprawny', 'nieszczelny', 'niesprawny'].map(r => (
              <button key={r} type="button" onClick={() => setForm(f => ({ ...f, result: r }))}
                className={`p-3 rounded-md border-2 ${form.result === r
                  ? r === 'sprawny' ? 'border-emerald-500 bg-emerald-50' : r === 'nieszczelny' ? 'border-amber-500 bg-amber-50' : 'border-rose-500 bg-rose-50'
                  : 'border-slate-200'}`}>
                {r === 'sprawny' ? '✓ Sprawny' : r === 'nieszczelny' ? '⚠ Nieszczelny' : '✗ Niesprawny'}
              </button>
            ))}
          </div>
          <textarea className="w-full border rounded-md p-2 text-sm" rows="3" placeholder="Wykryte usterki (jeśli są)..."
            value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} />
          <textarea className="w-full border rounded-md p-2 text-sm" rows="2" placeholder="Zalecenia..."
            value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
          <div className="flex gap-3 flex-wrap">
            <button disabled={busy} onClick={complete}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium disabled:opacity-50">
              {busy ? '...' : 'Zatwierdź protokół'}
            </button>
            <button onClick={refused} className="px-4 py-2 border-2 border-rose-500 text-rose-600 rounded-md hover:bg-rose-50">
              Odmowa wpuszczenia
            </button>
            <button onClick={cancel} className="px-4 py-2 border-2 border-slate-300 text-slate-600 rounded-md hover:bg-slate-50">
              Anuluj wizytę
            </button>
          </div>
          {(form.result === 'nieszczelny' || form.result === 'niesprawny') && (
            <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded p-3">
              💡 Po zatwierdzeniu protokołu z usterką system automatycznie wygeneruje ofertę upsell dla mieszkańca.
            </div>
          )}
        </div>
      )}

      {protocol && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-lg mb-3">Protokół</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Wynik:</span> <strong>{protocol.result}</strong></div>
            <div><span className="text-slate-500">Podpisał:</span> {protocol.signed_by}</div>
            <div className="col-span-2"><span className="text-slate-500">Usterki:</span> {protocol.findings || '—'}</div>
            <div className="col-span-2"><span className="text-slate-500">Zalecenia:</span> {protocol.recommendations || '—'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
