import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getProfile } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const me = getProfile();

  useEffect(() => { api('/admin/stats').then(setStats).catch(console.error); }, []);

  if (!stats) return <div>Ładowanie…</div>;
  const userCounts = Object.fromEntries(stats.users.map(u => [u.role, u.n]));
  const totalUsers = stats.users.reduce((a, u) => a + u.n, 0);
  const visitsDone = stats.visits.find(v => v.status === 'zakonczona')?.n || 0;
  const visitsBooked = stats.visits.find(v => v.status === 'umowiona')?.n || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel administracyjny</h1>
        <p className="text-slate-500">Zalogowany: {me?.full_name} (admin) • <strong>kliknij liczbę żeby zobaczyć szczegóły</strong></p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi to="/panel/admin/users" label="Użytkownicy" value={totalUsers}
          hint={`${userCounts.kominiarz || 0} kominiarzy • ${userCounts.zarzadca || 0} zarządców • ${userCounts.mieszkaniec || 0} mieszkańców`} />
        <Kpi to="/panel/admin/dane" label="Budynki" value={stats.buildings} hint="wszystkie obiekty" />
        <Kpi to="/panel/admin/leads?status=new" label="Leady (nowe)" value={stats.open_leads} tone="emerald" />
        <Kpi to="/panel/admin/zgloszenia?status=open" label="Zgłoszenia (otwarte)" value={stats.open_issues} tone="rose" />
        <Kpi to="/panel/kominiarz/oferty?status=wyslana" label="Aktywne oferty" value={stats.open_offers} tone="amber" />
        <Kpi to="/panel/kominiarz/nba" label="Akcje NBA" value={stats.open_actions} />
        <Kpi to="/panel/kominiarz/wizyty?status=zakonczona" label="Wizyty zakończone" value={visitsDone} />
        <Kpi to="/panel/kominiarz/wizyty?status=umowiona" label="Wizyty umówione" value={visitsBooked} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard to="/panel/admin/users" title="Użytkownicy" desc="CRUD kont, reset haseł, role" />
        <ActionCard to="/panel/admin/dane" title="Dane biznesowe" desc="Spółdzielnie, budynki, mieszkania, przewody" />
        <ActionCard to="/panel/admin/magic-links" title="Magic linki" desc="Linki dostępu bez logowania" />
        <ActionCard to="/panel/admin/leads" title="Leady" desc="Zapytania ze strony www" />
        <ActionCard to="/panel/admin/zgloszenia" title="Zgłoszenia" desc="Usterki mieszkańców" />
        <ActionCard to="/panel/admin/cms" title="CMS strony" desc="Edycja treści Hero/Usługi/O nas itp." />
        <ActionCard to="/panel/admin/audit" title="Audit log" desc="Historia akcji adminów" />
        <ActionCard to="/panel/kominiarz" title="Tryb kominiarza" desc="Otwórz pełen panel CRM" />
      </div>
    </div>
  );
}

function Kpi({ to, label, value, hint, tone = 'slate' }) {
  const c = { slate: 'bg-white', rose: 'bg-rose-50 border-rose-200', amber: 'bg-amber-50 border-amber-200', emerald: 'bg-emerald-50 border-emerald-200' }[tone];
  return (
    <Link to={to}
      className={`rounded-xl border p-5 ${c} transition hover:shadow-md hover:-translate-y-0.5 cursor-pointer block`}>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-1">{hint}</div>}
    </Link>
  );
}
function ActionCard({ to, title, desc }) {
  return <Link to={to} className="bg-white rounded-xl border p-5 hover:border-orange-300 hover:shadow-sm"><div className="font-semibold">{title}</div><div className="text-sm text-slate-500 mt-1">{desc}</div></Link>;
}
