import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, MessageSquare, Mail, Bell, Edit3, Send, Phone, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

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
  const [sheet, setSheet] = useState(null);
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

  async function sendReply() {
    if (!replyForm.message) return;
    setBusy(true);
    try {
      await api(`/issues/${sheet.issue.id}/reply`, { method: 'POST', body: replyForm });
      setMsg('Odpowiedź wysłana.');
      setSheet(null); setReplyForm({ message: '', channel: 'email' });
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      await api(`/issues/${sheet.issue.id}`, { method: 'PATCH', body: editForm });
      setMsg('Zapisano.');
      setSheet(null);
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
    setSheet({ type: 'edit', issue });
  }

  const counts = useMemo(() => ({
    all: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    closed: issues.filter(i => i.status === 'closed').length,
  }), [issues]);
  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
  const kominiarze = users.filter(u => u.role === 'kominiarz');
  const filters = [
    { value: null, label: 'Wszystkie', count: counts.all },
    { value: 'open', label: 'Otwarte', count: counts.open },
    { value: 'in_progress', label: 'W trakcie', count: counts.in_progress },
    { value: 'resolved', label: 'Rozwiązane', count: counts.resolved },
    { value: 'closed', label: 'Zamknięte', count: counts.closed },
  ];

  return (
    <div className="panel-page">
      <MobilePageHeader title="Zgłoszenia usterek" subtitle="Z panelu mieszkańca i magic linka" />

      {msg && <div className="mobile-card bg-emerald-50 border-emerald-200 text-emerald-800 text-sm">{msg}</div>}

      <FilterBar filters={filters} value={filter === 'all' ? null : filter} onChange={(v) => v ? setParams({ status: v }) : setParams({})} />

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Brak zgłoszeń" body="Spróbuj zmienić filtr." />
        ) : (
          filtered.map(i => (
            <article key={i.id} className={`mobile-card ${i.severity === 'urgent' ? 'border-rose-200 bg-rose-50/40' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{i.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {i.reporter_name || '(magic link)'}
                    {i.address && <> • <MapPin className="w-3 h-3 inline" /> {i.address}{i.apt_number ? `, m. ${i.apt_number}` : ''}</>}
                  </div>
                </div>
                <span className={`chip ${SEVERITY_COLOR[i.severity]} flex-shrink-0`}>{SEVERITY_LABEL[i.severity]}</span>
              </div>
              {i.description && <p className="text-sm text-slate-700 line-clamp-3 mt-1">{i.description}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`chip ${STATUS_COLOR[i.status]}`}>{STATUS_LABEL[i.status]}</span>
                {i.assigned_to_name && <span className="chip chip-idle">→ {i.assigned_to_name}</span>}
                {i.visit_date && <span className="chip bg-emerald-100 text-emerald-700">🔗 wizyta {fmtDateTime(i.visit_date).split(',')[0]}</span>}
              </div>
              <div className="text-xs text-slate-400 mt-2">{fmtDateTime(i.created_at)}</div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {i.reporter_phone && (
                  <a href={`tel:${i.reporter_phone}`} className="btn-secondary flex-1">
                    <Phone className="w-4 h-4 text-orange-500" />
                    Zadzwoń
                  </a>
                )}
                {i.reporter_id && (
                  <button onClick={() => { setReplyForm({ message: '', channel: 'email' }); setSheet({ type: 'reply', issue: i }); }} className="btn-secondary flex-1">
                    <MessageSquare className="w-4 h-4" />
                    Odpowiedz
                  </button>
                )}
                <button onClick={() => openEdit(i)} className="btn-primary flex-1">
                  <Edit3 className="w-4 h-4" />
                  Edytuj
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Reply sheet */}
      <BottomSheet
        open={sheet?.type === 'reply'}
        onClose={() => setSheet(null)}
        title="Odpowiedz zgłaszającemu"
        footer={
          <button disabled={busy || !replyForm.message} onClick={sendReply} className="btn-primary w-full py-3.5">
            <Send className="w-5 h-5" /> Wyślij
          </button>
        }
      >
        {sheet?.issue && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 text-sm">
              <div className="font-semibold">{sheet.issue.title}</div>
              <div className="text-xs text-slate-500">Do: {sheet.issue.reporter_name} • {sheet.issue.reporter_email || sheet.issue.reporter_phone}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'email', Ico: Mail, label: 'Email' },
                { k: 'sms', Ico: MessageSquare, label: 'SMS' },
                { k: 'in_app', Ico: Bell, label: 'In-app' },
              ].map(({ k, Ico, label }) => (
                <button key={k} type="button" onClick={() => setReplyForm(f => ({ ...f, channel: k }))}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 ${replyForm.channel === k ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                  <Ico className={`w-5 h-5 ${replyForm.channel === k ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
            <textarea className="form-input resize-none" rows="5"
              placeholder="Wpisz odpowiedź…"
              value={replyForm.message} onChange={e => setReplyForm(f => ({ ...f, message: e.target.value }))} />
          </div>
        )}
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet
        open={sheet?.type === 'edit'}
        onClose={() => setSheet(null)}
        title="Edytuj zgłoszenie"
        footer={
          <button disabled={busy} onClick={saveEdit} className="btn-primary w-full py-3.5">{busy ? '…' : 'Zapisz'}</button>
        }
      >
        {sheet?.issue && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 text-sm font-medium">{sheet.issue.title}</div>
            <div>
              <label className="form-label">Priorytet</label>
              <select className="form-input" value={editForm.severity}
                onChange={e => setEditForm(f => ({ ...f, severity: e.target.value }))}>
                {Object.entries(SEVERITY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={editForm.status}
                onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Przypisz do kominiarza</label>
              <select className="form-input" value={editForm.assigned_to}
                onChange={e => setEditForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">— nikt —</option>
                {kominiarze.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Powiąż z wizytą</label>
              <select className="form-input" value={editForm.visit_id}
                onChange={e => setEditForm(f => ({ ...f, visit_id: e.target.value }))}>
                <option value="">— brak —</option>
                {visits.map(v => <option key={v.id} value={v.id}>{fmtDateTime(v.scheduled_at)} — {v.building_address}{v.apt_number ? `, m. ${v.apt_number}` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Notatki wewnętrzne</label>
              <textarea className="form-input resize-none" rows="4"
                placeholder="Notatki tylko dla zespołu…"
                value={editForm.internal_notes} onChange={e => setEditForm(f => ({ ...f, internal_notes: e.target.value }))} />
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
