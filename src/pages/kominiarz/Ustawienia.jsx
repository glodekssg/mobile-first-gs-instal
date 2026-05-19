import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function Ustawienia() {
  const [calConnected, setCalConnected] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [logs, setLogs] = useState([]);

  function reload() {
    api('/calendar/status').then(s => setCalConnected(s.connected)).catch(() => {});
    api('/automation/notifications').then(setNotifs).catch(() => {});
    api('/automation/log').then(setLogs).catch(() => {});
  }
  useEffect(reload, []);

  async function connect() {
    await api('/calendar/connect-google', { method: 'POST' });
    reload();
  }
  async function disconnect() {
    await api('/calendar/disconnect', { method: 'POST' });
    reload();
  }
  async function runAutomation() {
    await api('/automation/run', { method: 'POST' });
    reload();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-lg mb-2">Integracja Google Calendar</h3>
        <p className="text-sm text-slate-500 mb-4">
          Po połączeniu wizyty w panelu automatycznie tworzą eventy w Twoim Google Calendar,
          a sloty oferowane mieszkańcom są wyliczane z Twoich wolnych okien.
        </p>
        {calConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-emerald-600">● Połączono (mock token)</span>
            <button onClick={disconnect} className="text-sm text-rose-600 hover:underline">Rozłącz</button>
          </div>
        ) : (
          <button onClick={connect} className="px-4 py-2 bg-white border-2 border-slate-300 rounded-md text-sm font-medium flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full" />
            Połącz z Google Calendar (mock)
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Automatyzacja</h3>
          <button onClick={runAutomation} className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded">Uruchom teraz</button>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Codziennie o 7:00 system wysyła przypomnienia 3 dni przed wizytą, SMS w dniu wizyty,
          przelicza Next Best Action i oznacza wygasłe oferty.
        </p>
        <div className="text-xs text-slate-500">Ostatnie wykonania:</div>
        <ul className="text-xs text-slate-700 mt-1 space-y-1 max-h-40 overflow-auto">
          {logs.map(l => (
            <li key={l.id} className="font-mono">{l.created_at?.slice(0, 19)} • {l.rule_name} • {l.outcome}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-lg mb-3">Powiadomienia (mock SMS/email)</h3>
        <div className="divide-y max-h-96 overflow-auto">
          {notifs.map(n => (
            <div key={n.id} className="py-2 text-sm">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{n.channel}</span>
                <span className="text-slate-400">{n.created_at?.slice(0, 19)}</span>
                <span className="text-slate-500">→ {n.recipient}</span>
              </div>
              {n.subject && <div className="font-medium mt-1">{n.subject}</div>}
              <div className="text-slate-700">{n.body}</div>
            </div>
          ))}
          {notifs.length === 0 && <div className="text-slate-400 text-sm py-4 text-center">Brak powiadomień.</div>}
        </div>
      </div>
    </div>
  );
}
