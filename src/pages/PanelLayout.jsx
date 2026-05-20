import { useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { getProfile, clearSession } from '../lib/api';
import NotificationBell from '../components/NotificationBell';
import PanelBottomNav from '../components/mobile/PanelBottomNav';
import {
  LayoutDashboard, Calendar, ClipboardList, Building2, Lightbulb,
  Tag, UserPlus, Link as LinkIcon, AlertTriangle, Settings, FileText,
  Users, FileEdit, ScrollText, Database, Home, ClipboardCheck, Wrench,
  Gift, History,
} from 'lucide-react';

const NAV = {
  kominiarz: [
    { to: '/panel/kominiarz', label: 'Dashboard', short: 'Start', icon: LayoutDashboard },
    { to: '/panel/kominiarz/kalendarz', label: 'Kalendarz', icon: Calendar },
    { to: '/panel/kominiarz/wizyty', label: 'Wizyty', icon: ClipboardList },
    { to: '/panel/kominiarz/klienci', label: 'Obiekty / Klienci', short: 'Obiekty', icon: Building2 },
    { to: '/panel/kominiarz/nba', label: 'Next Best Action', short: 'NBA', icon: Lightbulb },
    { to: '/panel/kominiarz/oferty', label: 'Oferty / Upsell', icon: Tag },
    { to: '/panel/kominiarz/leady', label: 'Leady', icon: UserPlus },
    { to: '/panel/kominiarz/zgloszenia', label: 'Zgłoszenia', icon: AlertTriangle },
    { to: '/panel/kominiarz/magic-linki', label: 'Magic linki', icon: LinkIcon },
    { to: '/panel/kominiarz/ustawienia', label: 'Ustawienia', icon: Settings },
  ],
  zarzadca: [
    { to: '/panel/spoldzielnia', label: 'Dashboard', short: 'Start', icon: LayoutDashboard },
    { to: '/panel/spoldzielnia/obiekty', label: 'Obiekty', icon: Building2 },
    { to: '/panel/spoldzielnia/zgloszenia', label: 'Zgłoszenia', icon: AlertTriangle },
    { to: '/panel/spoldzielnia/raporty', label: 'Raporty', icon: FileText },
  ],
  mieszkaniec: [
    { to: '/panel/mieszkaniec', label: 'Moje mieszkanie', short: 'Dom', icon: Home },
    { to: '/panel/mieszkaniec/termin', label: 'Umów wizytę', short: 'Umów', icon: Calendar },
    { to: '/panel/mieszkaniec/historia', label: 'Historia', icon: History },
    { to: '/panel/mieszkaniec/oferty', label: 'Oferty', icon: Gift },
    { to: '/panel/mieszkaniec/zgloszenie', label: 'Zgłoś usterkę', short: 'Zgłoś', icon: Wrench },
  ],
  admin: [
    { to: '/panel/admin', label: 'Dashboard', short: 'Start', icon: LayoutDashboard },
    { to: '/panel/admin/users', label: 'Użytkownicy', icon: Users },
    { to: '/panel/admin/dane', label: 'Dane', icon: Database },
    { to: '/panel/admin/leads', label: 'Leady', icon: UserPlus },
    { to: '/panel/admin/zgloszenia', label: 'Zgłoszenia', icon: AlertTriangle },
    { to: '/panel/admin/magic-links', label: 'Magic linki', icon: LinkIcon },
    { to: '/panel/admin/cms', label: 'CMS', icon: FileEdit },
    { to: '/panel/admin/audit', label: 'Audit', icon: ScrollText },
    { to: '/panel/kominiarz', label: '→ Tryb kominiarza', short: 'Kominiarz', icon: ClipboardCheck },
  ],
};

const ROLE_LABEL = {
  kominiarz: 'Kominiarz',
  zarzadca: 'Zarządca / Spółdzielnia',
  mieszkaniec: 'Mieszkaniec',
  admin: 'Administrator',
};

export default function PanelLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const profile = getProfile();

  useEffect(() => {
    if (!profile) nav('/login');
  }, [profile, nav]);

  if (!profile) return null;

  const menu = NAV[profile.role] || NAV.kominiarz;

  function logout() {
    clearSession();
    nav('/login');
  }

  const activeItem = menu.find(it => loc.pathname === it.to)
    || menu.find(it => loc.pathname.startsWith(it.to + '/'))
    || menu[0];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:flex-col w-64 bg-slate-900 text-slate-100 shadow-2xl">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="block">
            <div className="text-lg font-bold text-orange-400">GS Instal</div>
            <div className="text-xs text-slate-400">Panel CRM</div>
          </Link>
          <NotificationBell />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split('/').length <= 3}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-orange-500 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />}
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-900/50">
          <div className="font-semibold text-slate-200">{profile.full_name}</div>
          <div className="mb-1 text-orange-400/80">{ROLE_LABEL[profile.role]}</div>
          <div className="truncate mb-3">{profile.email}</div>
          <Link to="/panel/profil" className="block text-slate-300 hover:text-white text-sm py-1">⚙ Mój profil</Link>
          <button onClick={logout} className="mt-2 w-full text-left font-medium text-rose-400 hover:text-rose-300 text-sm py-1">Wyloguj się</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile sticky header */}
        <div className="md:hidden mobile-header flex items-center justify-between gap-2 px-4 py-2">
          <Link to="/" className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-orange-500">●</span> {activeItem?.label || 'GS Instal'}
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link
              to="/panel/profil"
              className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm"
              aria-label="Profil"
            >
              {(profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
            <Outlet key={loc.pathname} />
          </div>
        </div>

        <PanelBottomNav items={menu} profile={profile} onLogout={logout} />
      </main>
    </div>
  );
}
