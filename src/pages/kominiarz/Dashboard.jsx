import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, ClipboardCheck, Tag, UserPlus, AlertTriangle, Lightbulb,
  ChevronRight, MapPin, Phone,
} from 'lucide-react';
import { api } from '../../lib/api';
import { fmtTime, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import StatusBadge from '../../components/mobile/StatusBadge';
import EmptyState from '../../components/mobile/EmptyState';

export default function Dashboard() {
  const [visits, setVisits] = useState([]);
  const [nba, setNba] = useState([]);
  const [offers, setOffers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    Promise.all([
      api('/visits'), api('/nba'), api('/offers'), api('/issues'), api('/leads'),
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

  return (
    <div className="panel-page">
      <MobilePageHeader
        title="Dzień dobry"
        subtitle={`Dziś masz ${todayVisits.length} ${todayVisits.length === 1 ? 'wizytę' : 'wizyt'}`}
        sticky={false}
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Kpi to={`/panel/kominiarz/wizyty?status=umowiona&date=${today}`} icon={Calendar} label="Dziś" value={todayVisits.length} tone="orange" />
        <Kpi to="/panel/kominiarz/wizyty?status=umowiona" icon={ClipboardCheck} label="Tydzień" value={weekVisits.length} />
        <Kpi to="/panel/kominiarz/nba?type=umow_kontrole" icon={AlertTriangle} label="Zaległe" value={overdue.length} tone="rose" />
        <Kpi to="/panel/kominiarz/oferty?status=wyslana" icon={Tag} label="Oferty" value={activeOffers.length} tone="amber" />
        <Kpi to="/panel/kominiarz/leady?status=new" icon={UserPlus} label="Leady" value={newLeads.length} tone="emerald" />
        <Kpi to="/panel/kominiarz/zgloszenia?status=open" icon={AlertTriangle} label="Zgłoszenia" value={openIssues.length} tone="rose" />
      </div>

      {/* Dziś */}
      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="font-bold text-slate-900">Dzisiaj</h2>
          <Link to="/panel/kominiarz/kalendarz" className="text-sm text-orange-600 font-semibold">Kalendarz →</Link>
        </div>
        <div className="mobile-stack">
          {todayVisits.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="Wolny dzień"
              body="Brak zaplanowanych wizyt. Sprawdź jutro lub tygodniowy plan."
            />
          )}
          {todayVisits.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)).map(v => (
            <VisitCard key={v.id} v={v} />
          ))}
        </div>
      </section>

      {/* Najbliższe (po dziś, do 7 dni) */}
      {weekVisits.filter(v => v.scheduled_at?.slice(0, 10) !== today).length > 0 && (
        <section>
          <h2 className="font-bold text-slate-900 mb-2 px-1">Najbliższe</h2>
          <div className="mobile-stack">
            {weekVisits.filter(v => v.scheduled_at?.slice(0, 10) !== today).slice(0, 5).map(v => (
              <VisitCard key={v.id} v={v} compact />
            ))}
          </div>
        </section>
      )}

      {/* NBA */}
      {nba.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold text-slate-900">Next Best Action</h2>
            <Link to="/panel/kominiarz/nba" className="text-sm text-orange-600 font-semibold">Wszystkie →</Link>
          </div>
          <div className="mobile-stack">
            {nba.slice(0, 4).map(a => (
              <Link key={a.id} to="/panel/kominiarz/nba" className="mobile-card flex items-start gap-3 active:bg-slate-50">
                <PriorityDot priority={a.priority} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{a.title}</div>
                  <div className="text-sm text-slate-500 line-clamp-2">{a.rationale}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Zgłoszenia otwarte */}
      {openIssues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="font-bold text-slate-900">Otwarte zgłoszenia ({openIssues.length})</h2>
            <Link to="/panel/kominiarz/zgloszenia" className="text-sm text-orange-600 font-semibold">Wszystkie →</Link>
          </div>
          <div className="mobile-stack">
            {openIssues.slice(0, 4).map(i => (
              <Link key={i.id} to="/panel/kominiarz/zgloszenia?status=open" className="mobile-card flex items-start gap-3 active:bg-slate-50">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i.severity === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-slate-900 truncate">{i.title}</div>
                    {i.severity === 'urgent' && <span className="chip bg-rose-200 text-rose-800">PILNE</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {i.reporter_name || '(magic link)'} • {i.address}{i.apt_number ? `, m. ${i.apt_number}` : ''}
                  </div>
                </div>
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
    emerald: 'bg-emerald-50 border-emerald-200',
    orange: 'bg-orange-500 text-white border-orange-500',
  };
  const iconColor = tone === 'orange' ? 'text-white/80' : 'text-orange-600';
  const labelColor = tone === 'orange' ? 'text-white/80' : 'text-slate-500';
  const valColor = tone === 'orange' ? 'text-white' : 'text-slate-900';
  return (
    <Link to={to} className={`kpi-card ${tones[tone]} active:opacity-90`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-xs uppercase tracking-wide font-bold ${labelColor}`}>{label}</span>
      </div>
      <div className={`kpi-value mt-2 ${valColor}`}>{value}</div>
    </Link>
  );
}

function VisitCard({ v, compact }) {
  const isToday = v.scheduled_at?.slice(0, 10) === new Date().toISOString().slice(0, 10);
  return (
    <Link to={`/panel/kominiarz/wizyta/${v.id}`} className="mobile-card active:bg-slate-50 flex items-stretch gap-3">
      <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl flex-shrink-0 ${isToday ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
        <div className="text-[10px] uppercase tracking-wide font-bold">{new Date(v.scheduled_at).toLocaleDateString('pl-PL', { weekday: 'short' })}</div>
        <div className="text-lg font-extrabold leading-none">{fmtTime(v.scheduled_at)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {v.building_address}{v.apt_number && <span className="text-slate-500"> / m. {v.apt_number}</span>}
        </div>
        <div className="text-sm text-slate-500 truncate">{visitTypeLabel[v.type] || v.type}</div>
        {!compact && (
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={v.status} />
            {v.resident_phone && (
              <a
                href={`tel:${v.resident_phone}`}
                onClick={e => e.stopPropagation()}
                className="chip bg-emerald-100 text-emerald-700 active:bg-emerald-200"
              >
                <Phone className="w-3 h-3" /> Zadzwoń
              </a>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 self-center" />
    </Link>
  );
}

function PriorityDot({ priority }) {
  const tone = priority <= 20 ? 'bg-rose-500' : priority <= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`w-3 h-3 rounded-full mt-1.5 ${tone} flex-shrink-0`} />;
}
