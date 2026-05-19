import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { getProfile, clearSession } from '../lib/api';
import NotificationBell from '../components/NotificationBell';
import { Menu, X } from 'lucide-react';

const NAV = {
  kominiarz: [
    { to: '/panel/kominiarz', label: 'Dashboard' },
    { to: '/panel/kominiarz/kalendarz', label: 'Kalendarz' },
    { to: '/panel/kominiarz/wizyty', label: 'Wizyty' },
    { to: '/panel/kominiarz/klienci', label: 'Obiekty / Klienci' },
    { to: '/panel/kominiarz/nba', label: 'Next Best Action' },
    { to: '/panel/kominiarz/oferty', label: 'Oferty / Upsell' },
    { to: '/panel/kominiarz/leady', label: 'Leady' },
    { to: '/panel/kominiarz/zgloszenia', label: 'Zgłoszenia' },
    { to: '/panel/kominiarz/magic-linki', label: 'Magic linki' },
    { to: '/panel/kominiarz/ustawienia', label: 'Ustawienia' },
  ],
  zarzadca: [
    { to: '/panel/spoldzielnia', label: 'Dashboard' },
    { to: '/panel/spoldzielnia/obiekty', label: 'Obiekty' },
    { to: '/panel/spoldzielnia/zgloszenia', label: 'Zgłoszenia' },
    { to: '/panel/spoldzielnia/raporty', label: 'Raporty' },
  ],
  mieszkaniec: [
    { to: '/panel/mieszkaniec', label: 'Moje mieszkanie' },
    { to: '/panel/mieszkaniec/termin', label: 'Umów wizytę' },
    { to: '/panel/mieszkaniec/historia', label: 'Historia kontroli' },
    { to: '/panel/mieszkaniec/oferty', label: 'Oferty dla mnie' },
    { to: '/panel/mieszkaniec/zgloszenie', label: 'Zgłoś usterkę' },
  ],
  admin: [
    { to: '/panel/admin', label: 'Dashboard' },
    { to: '/panel/admin/users', label: 'Użytkownicy' },
    { to: '/panel/admin/dane', label: 'Dane biznesowe' },
    { to: '/panel/admin/magic-links', label: 'Magic linki' },
    { to: '/panel/admin/leads', label: 'Leady' },
    { to: '/panel/admin/zgloszenia', label: 'Zgłoszenia' },
    { to: '/panel/admin/cms', label: 'CMS strony' },
    { to: '/panel/admin/audit', label: 'Audit log' },
    { to: '/panel/kominiarz', label: '→ Tryb kominiarza' },
  ],
};

const ROLE_LABEL = { kominiarz: 'Kominiarz', zarzadca: 'Zarządca / Spółdzielnia', mieszkaniec: 'Mieszkaniec', admin: 'Administrator' };

export default function PanelLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const profile = getProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!profile) nav('/login');
  }, [profile, nav]);

  // Zamykaj menu mobilne po nawigacji
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [loc.pathname]);

  if (!profile) return null;

  const menu = NAV[profile.role] || NAV.kominiarz;

  function logout() {
    clearSession();
    nav('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navigation */}
      <div className="md:hidden bg-slate-900 text-white flex items-center justify-between px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 -ml-1 rounded-lg hover:bg-slate-800 transition-colors">
            <Menu className="w-7 h-7 text-orange-400" />
          </button>
          <div className="text-lg font-bold text-orange-400">GS Instal</div>
        </div>
        <NotificationBell />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/" className="block">
            <div className="text-lg font-bold text-orange-400">GS Instal</div>
            <div className="text-xs text-slate-400">Panel CRM</div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden md:block"><NotificationBell /></div>
            <button className="md:hidden p-1 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map(item => (
            <NavLink
              key={item.to} to={item.to} end={item.to.split('/').length <= 3}
              className={({ isActive }) =>
                `block px-3 py-3 md:py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-orange-500 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-900/50">
          <div className="font-semibold text-slate-200">{profile.full_name}</div>
          <div className="mb-1 text-orange-400/80">{ROLE_LABEL[profile.role]}</div>
          <div className="truncate mb-3">{profile.email}</div>
          <Link to="/panel/profil" className="block text-slate-300 hover:text-white text-sm py-1">⚙ Mój profil</Link>
          <button onClick={logout} className="mt-2 w-full text-left font-medium text-rose-400 hover:text-rose-300 text-sm py-1">Wyloguj się</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col h-[calc(100vh-60px)] md:h-screen">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet key={loc.pathname} />
          </div>
        </div>
      </main>
    </div>
  );
}
