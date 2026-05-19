import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

const TYPE_BADGE = {
  umow_kontrole: 'bg-rose-100 text-rose-700',
  wyslij_oferte_nasada: 'bg-amber-100 text-amber-700',
  follow_up_oferta: 'bg-blue-100 text-blue-700',
  czyszczenie_po_sezonie: 'bg-emerald-100 text-emerald-700',
  eskalacja_odmowa: 'bg-rose-200 text-rose-800',
  wybierz_termin: 'bg-blue-100 text-blue-700',
};

// Mapping action → CTA tekst i destination route
function actionTarget(a) {
  switch (a.action_type) {
    case 'umow_kontrole':
      return { label: 'Umów kontrolę', to: `/panel/kominiarz/wizyty?status=umowiona` };
    case 'wyslij_oferte_nasada':
      return { label: 'Wystaw ofertę nasady', to: `/panel/kominiarz/oferty?service_type=nasada${a.related_apartment_id ? '&apartment_id=' + a.related_apartment_id : ''}` };
    case 'wyslij_oferte_inspekcja':
      return { label: 'Wystaw ofertę inspekcji', to: `/panel/kominiarz/oferty?service_type=inspekcja_kamera` };
    case 'follow_up_oferta':
      return { label: 'Sprawdź ofertę', to: `/panel/kominiarz/oferty?status=wyslana` };
    case 'czyszczenie_po_sezonie':
      return { label: 'Wystaw ofertę czyszczenia', to: `/panel/kominiarz/oferty?service_type=pakiet_roczny` };
    case 'eskalacja_odmowa':
      return { label: 'Otwórz odmowy', to: `/panel/kominiarz/wizyty?status=odmowa_wpuszczenia` };
    default:
      return null;
  }
}

export default function NBA() {
  const [actions, setActions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const typeFilter = params.get('type');
  const nav = useNavigate();

  function load() { api('/nba').then(setActions).catch(console.error); }
  useEffect(load, []);

  async function regenerate() {
    setBusy(true);
    await api('/nba/run', { method: 'POST' });
    load();
    setBusy(false);
  }
  async function done(id) { await api(`/nba/${id}/done`, { method: 'POST' }); load(); }
  async function dismiss(id) { await api(`/nba/${id}/dismiss`, { method: 'POST' }); load(); }

  async function takeAction(a) {
    const target = actionTarget(a);
    if (!target) return;
    // Zaznacz jako "done" i przejdź do widoku
    await api(`/nba/${a.id}/done`, { method: 'POST' });
    nav(target.to);
  }

  let filtered = actions;
  if (typeFilter) filtered = filtered.filter(a => a.action_type === typeFilter);

  // Zlicz typów
  const typeCounts = actions.reduce((acc, a) => { acc[a.action_type] = (acc[a.action_type] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Next Best Action</h1>
          <p className="text-slate-500 text-sm">Lista akcji sugerowanych przez system. Kliknij „Wykonaj" aby przejść do odpowiedniego widoku.</p>
        </div>
        <button onClick={regenerate} disabled={busy}
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm disabled:opacity-50">
          {busy ? '...' : '⟳ Przelicz teraz'}
        </button>
      </div>

      {Object.keys(typeCounts).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { const n = new URLSearchParams(params); n.delete('type'); setParams(n); }}
            className={`px-3 py-1.5 text-sm rounded-md ${!typeFilter ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            Wszystkie ({actions.length})
          </button>
          {Object.entries(typeCounts).map(([t, n]) => (
            <button key={t} onClick={() => setParams({ type: t })}
              className={`px-3 py-1.5 text-sm rounded-md ${typeFilter === t ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
              {t} ({n})
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border divide-y">
        {filtered.map(a => {
          const target = actionTarget(a);
          return (
            <div key={a.id} className="p-4 flex items-start gap-4">
              <div className="text-2xl font-bold text-slate-300 w-10 text-center">#{a.priority}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${TYPE_BADGE[a.action_type] || 'bg-slate-100 text-slate-700'}`}>
                    {a.action_type}
                  </span>
                  <h3 className="font-medium">{a.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{a.rationale}</p>
                {a.building_address && (
                  <div className="text-xs text-slate-400 mt-1">
                    📍 {a.building_address}{a.apt_number ? ` / m. ${a.apt_number}` : ''}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 min-w-32">
                {target && (
                  <button onClick={() => takeAction(a)}
                    className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded font-medium">
                    {target.label} →
                  </button>
                )}
                <div className="flex gap-1">
                  <button onClick={() => done(a.id)} className="flex-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">✓ Zrobione</button>
                  <button onClick={() => dismiss(a.id)} className="flex-1 px-2 py-1 text-xs border rounded">Pomiń</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="p-10 text-center text-slate-400">Brak otwartych akcji.</div>}
      </div>
    </div>
  );
}
