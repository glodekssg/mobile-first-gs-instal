import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../../lib/format';

export default function Dashboard() {
  const [visits, setVisits] = useState([]);
  const [nba, setNba] = useState([]);
  const [offers, setOffers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    Promise.all([
      api('/visits'),
      api('/nba'),
      api('/offers'),
      api('/issues'),
      api('/leads'),
    ]).then(([vs, n, o, i, l]) => {
      setVisits(vs); setNba(n); setOffers(o); setIssues(i); setLeads(l);
    }).catch(console.error);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const todayVisits = visits.filter(v => v.scheduled_at?.slice(0, 10) === today && v.status === 'umowiona');
  const weekVisits = visits.filter(v => v.scheduled_at?.slice(0, 10) >= today && v.scheduled_at?.slice(0, 10) <= weekAhead && v.status === 'umowiona');
  const overdue = nba.filter(a => a.action_type === 'umow_kontrole');
  const activeOffers = offers.filter(o => o.status === 'wyslana');
  const newLeads = leads.filter(l => l.status === 'new');
  const openIssues = issues.filter(i => i.status === 'open');

  const upcoming = visits
    .filter(v => v.status === 'umowiona' && v.scheduled_at >= new Date().toISOString())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Witaj z powrotem — kliknij liczbę żeby zobaczyć szczegóły.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard to={`/panel/kominiarz/wizyty?status=umowiona&date=${today}`}
          label="Dziś" value={todayVisits.length} hint="zaplanowanych wizyt" />
        <KpiCard to="/panel/kominiarz/wizyty?status=umowiona"
          label="Najbliższe 7 dni" value={weekVisits.length} hint="umówionych wizyt" />
        <KpiCard to="/panel/kominiarz/nba?type=umow_kontrole" tone="rose"
          label="Zaległe kontrole" value={overdue.length} hint="wymagają działania" />
        <KpiCard to="/panel/kominiarz/oferty?status=wyslana" tone="amber"
          label="Aktywne oferty" value={activeOffers.length} hint="czekają na decyzję" />
        <KpiCard to="/panel/kominiarz/leady?status=new" tone="emerald"
          label="Nowe leady" value={newLeads.length} hint="ze strony www" />
        <KpiCard to="/panel/kominiarz/zgloszenia?status=open" tone="rose"
          label="Zgłoszenia" value={openIssues.length} hint="usterki mieszkańców" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Najbliższe wizyty" link="/panel/kominiarz/kalendarz" linkLabel="Kalendarz →">
          {upcoming.length === 0 && <Empty>Brak nadchodzących wizyt.</Empty>}
          <div className="divide-y">
            {upcoming.map(v => (
              <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`}
                className="block py-3 hover:bg-slate-50 -mx-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900">{v.building_address}{v.apt_number && <span className="text-slate-500"> / m. {v.apt_number}</span>}</div>
                    <div className="text-sm text-slate-500">{visitTypeLabel[v.type] || v.type} • {fmtDateTime(v.scheduled_at)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span>
                </div>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Next Best Action" link="/panel/kominiarz/nba" linkLabel="Wszystkie →">
          {nba.length === 0 && <Empty>System nie ma rekomendacji.</Empty>}
          <div className="divide-y">
            {nba.slice(0, 5).map(a => (
              <Link key={a.id} to={`/panel/kominiarz/nba`}
                className="block py-3 -mx-4 px-4 hover:bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityDot priority={a.priority} />
                  <div className="font-medium text-slate-900 text-sm">{a.title}</div>
                </div>
                <div className="text-xs text-slate-500">{a.rationale}</div>
              </Link>
            ))}
          </div>
        </Section>
      </div>

      {openIssues.length > 0 && (
        <Section title={`Otwarte zgłoszenia (${openIssues.length})`} link="/panel/kominiarz/zgloszenia" linkLabel="Wszystkie →">
          <div className="divide-y">
            {openIssues.slice(0, 5).map(i => (
              <Link key={i.id} to={`/panel/kominiarz/zgloszenia?status=open`}
                className="block py-3 -mx-4 px-4 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{i.title}</div>
                    <div className="text-xs text-slate-500">
                      {i.reporter_name || '(magic link)'} • {i.address}{i.apt_number ? `, m. ${i.apt_number}` : ''} • {fmtDateTime(i.created_at)}
                    </div>
                  </div>
                  {i.severity === 'urgent' && <span className="text-xs px-2 py-1 rounded bg-rose-200 text-rose-800">PILNE</span>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function KpiCard({ to, label, value, hint, tone = 'slate' }) {
  const colors = {
    slate: 'bg-white',
    rose: 'bg-rose-50 border-rose-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200',
  };
  return (
    <Link to={to}
      className={`rounded-xl border p-5 ${colors[tone]} transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}>
      <div className="text-xs uppercase text-slate-500 font-medium">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{hint}</div>
    </Link>
  );
}
function Section({ title, link, linkLabel, children }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {link && <Link to={link} className="text-sm text-orange-600 hover:underline">{linkLabel}</Link>}
      </div>
      {children}
    </div>
  );
}
function Empty({ children }) {
  return <div className="text-sm text-slate-400 py-4 text-center">{children}</div>;
}
function PriorityDot({ priority }) {
  const tone = priority <= 20 ? 'bg-rose-500' : priority <= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`w-2 h-2 rounded-full ${tone}`} />;
}
