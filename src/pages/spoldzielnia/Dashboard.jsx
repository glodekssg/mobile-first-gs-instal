import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getProfile } from '../../lib/api';
import { fmtDate } from '../../lib/format';

export default function SpoldzielniaDashboard() {
  const [coops, setCoops] = useState([]);
  const [nba, setNba] = useState([]);
  const [issues, setIssues] = useState([]);
  const me = getProfile();

  useEffect(() => {
    api('/cooperatives').then(setCoops);
    api('/nba').then(setNba);
    api('/issues').then(setIssues);
  }, []);

  const escalations = nba.filter(a => a.action_type === 'eskalacja_odmowa');
  const openIssues = issues.filter(i => i.status === 'open');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel zarządcy</h1>
        <p className="text-slate-500">Witaj, {me?.full_name}. Kliknij liczbę żeby zobaczyć szczegóły.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi to="/panel/spoldzielnia/obiekty" label="Spółdzielnie/Wspólnoty" value={coops.length} />
        <Kpi to="/panel/spoldzielnia/raporty" label="Otwarte eskalacje" value={escalations.length} tone="rose" />
        <Kpi to="/panel/spoldzielnia/zgloszenia?status=open" label="Zgłoszenia mieszkańców" value={openIssues.length} tone="amber" />
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Twoje organizacje</h3>
          <Link to="/panel/spoldzielnia/obiekty" className="text-sm text-orange-600 hover:underline">Lista obiektów →</Link>
        </div>
        <div className="divide-y">
          {coops.map(c => (
            <div key={c.id} className="py-3">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-slate-500">{c.address} • {c.buildings_count} budynk(ów)</div>
            </div>
          ))}
          {coops.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak organizacji.</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Akcje wymagające Twojej uwagi</h3>
        <div className="divide-y">
          {nba.map(a => (
            <div key={a.id} className="py-3">
              <div className="flex items-center gap-2">
                <PriorityDot priority={a.priority} />
                <span className="font-medium">{a.title}</span>
              </div>
              <div className="text-sm text-slate-500 mt-1">{a.rationale}</div>
              {a.building_address && <div className="text-xs text-slate-400 mt-1">📍 {a.building_address}{a.apt_number ? ` / m. ${a.apt_number}` : ''}</div>}
            </div>
          ))}
          {nba.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak akcji.</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Najnowsze zgłoszenia mieszkańców</h3>
          <Link to="/panel/spoldzielnia/zgloszenia" className="text-sm text-orange-600 hover:underline">Wszystkie →</Link>
        </div>
        <div className="divide-y">
          {issues.slice(0, 8).map(i => (
            <Link key={i.id} to="/panel/spoldzielnia/zgloszenia"
              className="block py-3 -mx-4 px-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{i.title}</div>
                  <div className="text-xs text-slate-500">{i.reporter_name || '(magic link)'} • {i.address} m. {i.apt_number} • {fmtDate(i.created_at)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${i.severity === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                  {i.severity}
                </span>
              </div>
              {i.description && <div className="text-sm text-slate-600 mt-1">{i.description}</div>}
            </Link>
          ))}
          {issues.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak zgłoszeń.</div>}
        </div>
      </div>
    </div>
  );
}

function Kpi({ to, label, value, tone = 'slate' }) {
  const c = tone === 'rose' ? 'bg-rose-50 border-rose-200' : tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white';
  return (
    <Link to={to}
      className={`rounded-xl border p-5 ${c} transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer block`}>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </Link>
  );
}
function PriorityDot({ priority }) {
  const t = priority <= 20 ? 'bg-rose-500' : priority <= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`w-2 h-2 rounded-full ${t}`} />;
}
