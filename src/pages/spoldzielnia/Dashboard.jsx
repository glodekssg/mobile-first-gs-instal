import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, AlertTriangle, FileText, Lightbulb, MapPin, ChevronRight } from 'lucide-react';
import { api, getProfile } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

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
    <div className="panel-page">
      <MobilePageHeader title={`Witaj, ${me?.full_name?.split(' ')[0] || ''}`} subtitle="Panel zarządcy" sticky={false} />

      <section className="grid grid-cols-3 gap-2">
        <Kpi to="/panel/spoldzielnia/obiekty" icon={Building2} label="Organizacje" value={coops.length} />
        <Kpi to="/panel/spoldzielnia/raporty" icon={AlertTriangle} label="Eskalacje" value={escalations.length} tone="rose" />
        <Kpi to="/panel/spoldzielnia/zgloszenia?status=open" icon={FileText} label="Zgłoszenia" value={openIssues.length} tone="amber" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-bold text-slate-900">Twoje organizacje</h2>
          <Link to="/panel/spoldzielnia/obiekty" className="text-sm text-orange-600 font-semibold">Lista obiektów →</Link>
        </div>
        <div className="mobile-stack">
          {coops.length === 0 ? (
            <EmptyState icon={Building2} title="Brak organizacji" body="Skontaktuj się z administratorem." />
          ) : (
            coops.map(c => (
              <Link key={c.id} to="/panel/spoldzielnia/obiekty" className="mobile-card flex items-center gap-3 active:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">{c.address} • {c.buildings_count} budynk(ów)</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </section>

      {nba.length > 0 && (
        <section>
          <h2 className="font-bold text-slate-900 mb-2 px-1">Akcje wymagające uwagi</h2>
          <div className="mobile-stack">
            {nba.map(a => (
              <Link key={a.id} to="/panel/spoldzielnia/obiekty" className="mobile-card flex items-start gap-3 active:bg-slate-50">
                <PriorityDot priority={a.priority} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{a.title}</div>
                  <p className="text-sm text-slate-600">{a.rationale}</p>
                  {a.building_address && (
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {a.building_address}{a.apt_number ? ` / m. ${a.apt_number}` : ''}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {issues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold text-slate-900">Najnowsze zgłoszenia</h2>
            <Link to="/panel/spoldzielnia/zgloszenia" className="text-sm text-orange-600 font-semibold">Wszystkie →</Link>
          </div>
          <div className="mobile-stack">
            {issues.slice(0, 5).map(i => (
              <Link key={i.id} to="/panel/spoldzielnia/zgloszenia" className="mobile-card flex items-start gap-3 active:bg-slate-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i.severity === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{i.title}</div>
                  <div className="text-xs text-slate-500 truncate">{i.reporter_name || '(magic link)'} • {i.address}{i.apt_number ? `, m. ${i.apt_number}` : ''}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{fmtDate(i.created_at)}</div>
                </div>
                {i.severity === 'urgent' && <span className="chip bg-rose-200 text-rose-800">PILNE</span>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ to, icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-white',
    rose: 'bg-rose-50 border-rose-200',
    amber: 'bg-amber-50 border-amber-200',
  };
  return (
    <Link to={to} className={`kpi-card ${tones[tone]} active:opacity-90`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-orange-600" />
        <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{label}</span>
      </div>
      <div className="kpi-value mt-2">{value}</div>
    </Link>
  );
}

function PriorityDot({ priority }) {
  const tone = priority <= 20 ? 'bg-rose-500' : priority <= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`w-3 h-3 rounded-full mt-1.5 ${tone} flex-shrink-0`} />;
}
