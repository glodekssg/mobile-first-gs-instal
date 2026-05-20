import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Check, X, Lightbulb, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

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
    await api(`/nba/${a.id}/done`, { method: 'POST' });
    nav(target.to);
  }

  const typeCounts = useMemo(() => actions.reduce((acc, a) => { acc[a.action_type] = (acc[a.action_type] || 0) + 1; return acc; }, {}), [actions]);
  const filtered = typeFilter ? actions.filter(a => a.action_type === typeFilter) : actions;
  const filters = [
    { value: null, label: 'Wszystkie', count: actions.length },
    ...Object.entries(typeCounts).map(([t, n]) => ({ value: t, label: t.replace(/_/g, ' '), count: n })),
  ];

  return (
    <div className="panel-page">
      <MobilePageHeader
        title="Next Best Action"
        subtitle="Sugestie systemu — kliknij CTA, aby zrealizować"
        right={(
          <button onClick={regenerate} disabled={busy} className="btn-ghost text-orange-600">
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          </button>
        )}
      />

      {Object.keys(typeCounts).length > 0 && (
        <FilterBar
          filters={filters}
          value={typeFilter}
          onChange={(v) => v ? setParams({ type: v }) : setParams({})}
        />
      )}

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={Lightbulb} title="Brak otwartych akcji" body="System nie ma teraz żadnych sugestii. Sprawdź ponownie później." />
        ) : (
          filtered.map(a => {
            const target = actionTarget(a);
            return (
              <article key={a.id} className="mobile-card">
                <div className="flex items-start gap-3">
                  <PriorityDot priority={a.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900">{a.title}</div>
                    <p className="text-sm text-slate-600 mt-1">{a.rationale}</p>
                    {a.building_address && (
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {a.building_address}{a.apt_number ? ` / m. ${a.apt_number}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  {target && (
                    <button onClick={() => takeAction(a)} className="btn-primary flex-1">
                      {target.label}
                    </button>
                  )}
                  <button onClick={() => done(a.id)} className="btn-secondary px-3" aria-label="Oznacz jako zrobione">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </button>
                  <button onClick={() => dismiss(a.id)} className="btn-secondary px-3" aria-label="Pomiń">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

function PriorityDot({ priority }) {
  const tone = priority <= 20 ? 'bg-rose-500' : priority <= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return <span className={`w-3 h-3 rounded-full mt-1.5 ${tone} flex-shrink-0`} />;
}
