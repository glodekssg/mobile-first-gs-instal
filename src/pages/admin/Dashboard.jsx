import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Database, UserPlus, AlertTriangle, Tag, Lightbulb,
  ClipboardCheck, Calendar, FileEdit, ScrollText, ChevronRight,
} from 'lucide-react';
import { api, getProfile } from '../../lib/api';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import Spinner from '../../components/mobile/Spinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const me = getProfile();

  useEffect(() => { api('/admin/stats').then(setStats).catch(console.error); }, []);

  if (!stats) return (
    <div className="panel-page">
      <MobilePageHeader title="Panel admina" sticky={false} />
      <Spinner />
    </div>
  );

  const userCounts = Object.fromEntries(stats.users.map(u => [u.role, u.n]));
  const totalUsers = stats.users.reduce((a, u) => a + u.n, 0);
  const visitsDone = stats.visits.find(v => v.status === 'zakonczona')?.n || 0;
  const visitsBooked = stats.visits.find(v => v.status === 'umowiona')?.n || 0;

  return (
    <div className="panel-page">
      <MobilePageHeader title="Panel administracyjny" subtitle={me?.full_name} sticky={false} />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi to="/panel/admin/users" icon={Users} label="Użytkownicy" value={totalUsers}
          hint={`${userCounts.kominiarz || 0} kominiarzy • ${userCounts.zarzadca || 0} zarządców`} />
        <Kpi to="/panel/admin/dane" icon={Database} label="Budynki" value={stats.buildings} />
        <Kpi to="/panel/admin/leads?status=new" icon={UserPlus} label="Nowe leady" value={stats.open_leads} tone="emerald" />
        <Kpi to="/panel/admin/zgloszenia?status=open" icon={AlertTriangle} label="Zgłoszenia" value={stats.open_issues} tone="rose" />
        <Kpi to="/panel/kominiarz/oferty?status=wyslana" icon={Tag} label="Aktywne oferty" value={stats.open_offers} tone="amber" />
        <Kpi to="/panel/kominiarz/nba" icon={Lightbulb} label="Akcje NBA" value={stats.open_actions} />
        <Kpi to="/panel/kominiarz/wizyty?status=zakonczona" icon={ClipboardCheck} label="Wizyty zak." value={visitsDone} />
        <Kpi to="/panel/kominiarz/wizyty?status=umowiona" icon={Calendar} label="Wizyty umów." value={visitsBooked} />
      </section>

      <section>
        <h2 className="font-bold text-slate-900 mb-2 px-1">Szybkie akcje</h2>
        <div className="mobile-stack">
          <ActionRow to="/panel/admin/users" icon={Users} title="Użytkownicy" desc="CRUD kont, reset haseł, role" />
          <ActionRow to="/panel/admin/dane" icon={Database} title="Dane biznesowe" desc="Spółdzielnie, budynki, mieszkania, przewody" />
          <ActionRow to="/panel/admin/magic-links" icon={UserPlus} title="Magic linki" desc="Dostęp bez logowania" />
          <ActionRow to="/panel/admin/leads" icon={UserPlus} title="Leady" desc="Zapytania z www" />
          <ActionRow to="/panel/admin/zgloszenia" icon={AlertTriangle} title="Zgłoszenia" desc="Usterki mieszkańców" />
          <ActionRow to="/panel/admin/cms" icon={FileEdit} title="CMS strony" desc="Hero, usługi, dane firmy" />
          <ActionRow to="/panel/admin/audit" icon={ScrollText} title="Audit log" desc="Historia akcji admina" />
          <ActionRow to="/panel/kominiarz" icon={ClipboardCheck} title="Tryb kominiarza" desc="Otwórz CRM kominiarski" />
        </div>
      </section>
    </div>
  );
}

function Kpi({ to, icon: Icon, label, value, hint, tone = 'slate' }) {
  const tones = {
    slate: 'bg-white',
    rose: 'bg-rose-50 border-rose-200',
    amber: 'bg-amber-50 border-amber-200',
    emerald: 'bg-emerald-50 border-emerald-200',
  };
  return (
    <Link to={to} className={`kpi-card ${tones[tone]} active:opacity-90`}>
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-orange-600" />
        <span className="text-[10px] uppercase tracking-wide font-bold text-slate-500">{label}</span>
      </div>
      <div className="kpi-value mt-2">{value}</div>
      {hint && <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{hint}</div>}
    </Link>
  );
}

function ActionRow({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="mobile-card flex items-center gap-3 active:bg-slate-50">
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 truncate">{desc}</div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
    </Link>
  );
}
