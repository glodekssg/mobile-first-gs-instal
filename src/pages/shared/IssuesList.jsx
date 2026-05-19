// Wspólna lista zgłoszeń — używana w panelu kominiarza, admina, zarządcy.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';

const STATUS_LABEL = { open: 'Otwarte', in_progress: 'W trakcie', resolved: 'Rozwiązane', closed: 'Zamknięte' };
const STATUS_COLOR = {
  open: 'bg-rose-100 text-rose-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
};
const SEVERITY_LABEL = { low: 'Niski', normal: 'Normalny', high: 'Wysoki', urgent: 'PILNE' };
const SEVERITY_COLOR = {
  low: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-rose-200 text-rose-800',
};

export default function IssuesList() {
  const [issues, setIssues] = useState([]);
  const [visits, setVisits] = useState([]);
  const [users, setUsers] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';
  const [modal, setModal] = useState(null); // { type, issue }
  const [replyForm, setReplyForm] = useState({ message: '', channel: 'email' });
  const [editForm, setEditForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  function load() {
    api('/issues').then(setIssues);
    api('/visits').then(setVisits).catch(() => {});
    api('/admin/users').then(setUsers).catch(() => setUsers([]));
  }
  useEffect(load, []);

  async function update(id, fields) {
    await api(`/issues/${id}`, { method: 'PATCH', body: fields });
    load();
  }

  async function sendReply() {
    if (!replyForm.message) return;
    setBusy(true);
    try {
      await api(`/issues/${modal.issue.id}/reply`, { method: 'POST', body: replyForm });
      setMsg('✓ Odpowiedź wysłana do zgłaszającego.');
      setModal(null); setReplyForm({ message: '', channel: 'email' });
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await api(`/issues/${modal.issue.id}`, { method: 'PATCH', body: editForm });
      setMsg('✓ Zapisano.');
      setModal(null);
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  function openEdit(issue) {
    setEditForm({
      severity: issue.severity,
      status: issue.status,
      internal_notes: issue.internal_notes || '',
      visit_id: issue.visit_id || '',
      assigned_to: issue.assigned_to || '',
    });
    setModal({ type: 'edit', issue });
  }

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
  const counts = {
    all: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
  };
  const kominiarze = users.filter(u => u.role === 'kominiarz');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Zgłoszenia usterek</h1>
        <p className="text-slate-500 text-sm">Zgłoszenia od mieszkańców (z panelu i magic linka).</p>
      </div>

      {msg && <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-800">{msg}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Otwarte" value={counts.open} tone="rose" onClick={() => setParams({ status: 'open' })} active={filter === 'open'} />
        <Stat label="W trakcie" value={counts.in_progress} tone="amber" onClick={() => setParams({ status: 'in_progress' })} active={filter === 'in_progress'} />
        <Stat label="Rozwiązane" value={counts.resolved} tone="emerald" onClick={() => setParams({ status: 'resolved' })} active={filter === 'resolved'} />
        <Stat label="Wszystkie" value={counts.all} onClick={() => setParams({})} active={filter === 'all'} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {[['all', `Wszystkie (${counts.all})`], ['open', `Otwarte (${counts.open})`], ['in_progress', `W trakcie (${counts.in_progress})`], ['resolved', `Rozwiązane (${counts.resolved})`], ['closed', `Zamknięte (${counts.closed})`]].map(([k, l]) => (
          <button key={k} onClick={() => k === 'all' ? setParams({}) : setParams({ status: k })}
            className={`px-3 py-1.5 text-sm rounded-md ${filter === k ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Tytuł / Opis</th>
              <th className="text-left p-3">Zgłaszający</th>
              <th className="text-left p-3">Adres</th>
              <th className="text-left p-3">Priorytet</th>
              <th className="text-left p-3">Przypisany</th>
              <th className="text-left p-3">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(i => (
              <tr key={i.id} className={`hover:bg-slate-50 ${i.severity === 'urgent' ? 'bg-rose-50/50' : ''}`}>
                <td className="p-3 max-w-md">
                  <div className="font-medium">{i.title}</div>
                  {i.description && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{i.description}</div>}
                  {i.visit_date && <div className="text-xs text-emerald-700 mt-1">🔗 powiązana wizyta {fmtDateTime(i.visit_date)}</div>}
                </td>
                <td className="p-3 text-sm">
                  {i.reporter_name ? (
                    <>
                      <div>{i.reporter_name}</div>
                      {i.reporter_phone && <div className="text-xs"><a href={`tel:${i.reporter_phone}`} className="text-orange-600">{i.reporter_phone}</a></div>}
                    </>
                  ) : <span className="text-slate-400 text-xs">(magic link)</span>}
                </td>
                <td className="p-3 text-slate-500 text-sm">
                  {i.address || '—'}
                  {i.apt_number && <div className="text-xs">m. {i.apt_number}</div>}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded ${SEVERITY_COLOR[i.severity]}`}>{SEVERITY_LABEL[i.severity]}</span>
                </td>
                <td className="p-3 text-sm">{i.assigned_to_name || <span className="text-slate-400">—</span>}</td>
                <td className="p-3">
                  <select value={i.status} onChange={e => update(i.id, { status: e.target.value })}
                    className={`text-xs px-2 py-1 rounded border-0 ${STATUS_COLOR[i.status]}`}>
                    {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {i.reporter_id && <button onClick={() => { setReplyForm({ message: '', channel: 'email' }); setModal({ type: 'reply', issue: i }); }} className="text-blue-600 text-sm hover:underline mr-2">Odpowiedz</button>}
                  <button onClick={() => openEdit(i)} className="text-orange-600 text-sm hover:underline">Edytuj</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="7" className="p-10 text-center text-slate-400">Brak zgłoszeń.</td></tr>}
          </tbody>
        </table></div>
      </div>

      {modal?.type === 'reply' && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Odpowiedz zgłaszającemu</h3>
            <div className="bg-slate-50 rounded p-3 text-sm">
              <div className="font-medium">{modal.issue.title}</div>
              <div className="text-xs text-slate-500">Do: {modal.issue.reporter_name} • {modal.issue.reporter_email || modal.issue.reporter_phone}</div>
            </div>
            <div className="flex gap-2">
              {['email', 'sms', 'in_app'].map(c => (
                <button key={c} type="button" onClick={() => setReplyForm(f => ({ ...f, channel: c }))}
                  className={`px-3 py-1.5 text-sm rounded border-2 ${replyForm.channel === c ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                  {c === 'email' ? '📧' : c === 'sms' ? '💬' : '🔔'} {c}
                </button>
              ))}
            </div>
            <textarea className="w-full border rounded p-2 text-sm" rows="5"
              placeholder="Wpisz odpowiedź..."
              value={replyForm.message} onChange={e => setReplyForm(f => ({ ...f, message: e.target.value }))} />
            <button disabled={busy || !replyForm.message} onClick={sendReply}
              className="w-full bg-orange-500 text-white py-2 rounded disabled:opacity-50">
              {busy ? '...' : 'Wyślij odpowiedź'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal onClose={() => setModal(null)}>
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Edytuj zgłoszenie</h3>
            <div className="bg-slate-50 rounded p-2 text-sm font-medium">{modal.issue.title}</div>

            <div>
              <label className="text-sm block mb-1">Priorytet</label>
              <select className="w-full border rounded p-2 text-sm" value={editForm.severity}
                onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}>
                {Object.entries(SEVERITY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Status</label>
              <select className="w-full border rounded p-2 text-sm" value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Przypisz do kominiarza</label>
              <select className="w-full border rounded p-2 text-sm" value={editForm.assigned_to}
                onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">— nikt —</option>
                {kominiarze.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Powiąż z wizytą</label>
              <select className="w-full border rounded p-2 text-sm" value={editForm.visit_id}
                onChange={e => setEditForm(f => ({ ...f, visit_id: e.target.value }))}>
                <option value="">— brak —</option>
                {visits.map(v => <option key={v.id} value={v.id}>{fmtDateTime(v.scheduled_at)} — {v.building_address}{v.apt_number ? `, m. ${v.apt_number}` : ''}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Notatki wewnętrzne (tylko zespół)</label>
              <textarea className="w-full border rounded p-2 text-sm" rows="4"
                placeholder="Notatki widoczne tylko dla zespołu..."
                value={editForm.internal_notes} onChange={e => setEditForm(f => ({ ...f, internal_notes: e.target.value }))} />
            </div>

            <button disabled={busy} onClick={saveEdit} className="w-full bg-orange-500 text-white py-2 rounded">
              {busy ? '...' : 'Zapisz'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'slate', onClick, active }) {
  const c = { slate: 'bg-white', rose: 'bg-rose-50 border-rose-200', amber: 'bg-amber-50 border-amber-200', emerald: 'bg-emerald-50 border-emerald-200' }[tone];
  return (
    <button onClick={onClick}
      className={`rounded-xl border p-4 text-left transition hover:shadow-md hover:scale-[1.01] cursor-pointer ${c} ${active ? 'ring-2 ring-orange-400' : ''}`}>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </button>
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
