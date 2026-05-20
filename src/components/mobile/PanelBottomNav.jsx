import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import BottomSheet from './BottomSheet';

export default function PanelBottomNav({ items, profile, onLogout }) {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const primary = items.slice(0, 4);
  const rest = items.slice(4);

  const isActive = (to) => loc.pathname === to || loc.pathname.startsWith(to + '/');

  return (
    <>
      <nav className="bottom-nav md:hidden flex items-stretch" aria-label="Nawigacja główna">
        {primary.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? true}
              className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              {Icon && <Icon className="w-5 h-5" strokeWidth={2.2} />}
              <span className="text-[11px] leading-tight">{item.short || item.label}</span>
            </NavLink>
          );
        })}
        {rest.length > 0 && (
          <button
            className={`bottom-nav-item ${rest.some(r => isActive(r.to)) ? 'active' : ''}`}
            onClick={() => setOpen(true)}
            aria-label="Więcej opcji"
          >
            <MoreHorizontal className="w-5 h-5" strokeWidth={2.2} />
            <span className="text-[11px] leading-tight">Więcej</span>
          </button>
        )}
      </nav>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Więcej opcji"
      >
        <div className="space-y-1">
          {rest.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? true}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3.5 rounded-xl ${isActive ? 'bg-orange-50 text-orange-700' : 'text-slate-800 active:bg-slate-100'}`
                }
              >
                {Icon && <Icon className="w-5 h-5 text-orange-500" strokeWidth={2} />}
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
        {profile && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
            <Link
              to="/panel/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-800 active:bg-slate-100"
            >
              <span className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                {(profile.full_name || profile.email || '?').slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{profile.full_name || profile.email}</div>
                <div className="text-xs text-slate-500 truncate">{profile.email}</div>
              </div>
            </Link>
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl text-rose-600 active:bg-rose-50 font-medium"
            >
              Wyloguj się
            </button>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
