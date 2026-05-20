import { useEffect, useState } from 'react';
import { Calendar, Play, Bell, Mail, MessageSquare } from 'lucide-react';
import { api } from '../../lib/api';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';

export default function Ustawienia() {
  const [calConnected, setCalConnected] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [busy, setBusy] = useState(false);

  function reload() {
    api('/calendar/status').then(s => setCalConnected(s.connected)).catch(() => {});
    api('/automation/notifications').then(setNotifs).catch(() => {});
    api('/automation/log').then(setLogs).catch(() => {});
  }
  useEffect(reload, []);

  async function connect() { await api('/calendar/connect-google', { method: 'POST' }); reload(); }
  async function disconnect() { await api('/calendar/disconnect', { method: 'POST' }); reload(); }
  async function runAutomation() {
    setBusy(true);
    try { await api('/automation/run', { method: 'POST' }); reload(); }
    finally { setBusy(false); }
  }

  function channelIcon(ch) {
    if (ch === 'email') return <Mail className="w-3.5 h-3.5" />;
    if (ch === 'sms') return <MessageSquare className="w-3.5 h-3.5" />;
    return <Bell className="w-3.5 h-3.5" />;
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title="Ustawienia" />

      <section className="mobile-card">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900">Google Calendar</h2>
            <p className="text-sm text-slate-500 mt-1">
              Dwukierunkowa synchronizacja wizyt + sloty mieszkańców z wolnych okien.
            </p>
            {calConnected ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="chip bg-emerald-100 text-emerald-700">● Połączono</span>
                <button onClick={disconnect} className="btn-ghost text-rose-600 text-sm">Rozłącz</button>
              </div>
            ) : (
              <button onClick={connect} className="btn-secondary w-full mt-3">
                <span className="inline-block w-4 h-4 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full" />
                Połącz z Google Calendar (mock)
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mobile-card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-900">Automatyzacja</h2>
          <button onClick={runAutomation} disabled={busy} className="btn-primary py-2 px-3 text-sm">
            <Play className="w-4 h-4" />
            {busy ? '…' : 'Uruchom'}
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Codziennie o 7:00 system wysyła przypomnienia 3 dni przed wizytą, SMS w dniu wizyty,
          przelicza NBA i oznacza wygasłe oferty.
        </p>
        {logs.length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-slate-500 font-semibold cursor-pointer">Ostatnie wykonania ({logs.length})</summary>
            <ul className="text-xs text-slate-700 mt-2 space-y-1 max-h-40 overflow-auto">
              {logs.map(l => (
                <li key={l.id} className="font-mono">{l.created_at?.slice(0, 19)} • {l.rule_name} • {l.outcome}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mobile-card">
        <h2 className="font-bold text-slate-900 mb-3">Powiadomienia (mock SMS/email)</h2>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {notifs.length === 0 && <div className="text-slate-400 text-sm py-4 text-center">Brak powiadomień.</div>}
          {notifs.map(n => (
            <div key={n.id} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="chip chip-idle">{channelIcon(n.channel)} {n.channel}</span>
                <span className="text-slate-400">{n.created_at?.slice(0, 19)}</span>
              </div>
              <div className="text-xs text-slate-500 truncate mt-1">→ {n.recipient}</div>
              {n.subject && <div className="font-medium text-sm mt-1">{n.subject}</div>}
              <div className="text-sm text-slate-700">{n.body}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
