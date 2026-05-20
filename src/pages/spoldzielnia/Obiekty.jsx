import { useEffect, useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

export default function Obiekty() {
  const [coops, setCoops] = useState([]);
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    api('/cooperatives').then(async cs => {
      setCoops(cs);
      const sts = {};
      for (const c of cs) {
        sts[c.id] = await api(`/cooperatives/${c.id}/status`);
      }
      setStatuses(sts);
    });
  }, []);

  const now = useMemo(() => Date.now(), []);
  function badge(b) {
    if (!b.oldest_inspection) return { label: 'brak danych', cls: 'bg-rose-100 text-rose-700' };
    const daysAgo = (now - new Date(b.oldest_inspection).getTime()) / 86400000;
    if (daysAgo > 330) return { label: 'termin minął', cls: 'bg-rose-100 text-rose-700' };
    if (daysAgo > 270) return { label: '< 90 dni', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'w terminie', cls: 'bg-emerald-100 text-emerald-700' };
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title="Obiekty" />

      {coops.length === 0 && <EmptyState icon={Building2} title="Brak obiektów" />}

      {coops.map(c => (
        <section key={c.id} className="space-y-2">
          <div className="px-1">
            <h2 className="font-bold text-slate-900">{c.name}</h2>
            <p className="text-xs text-slate-500">{c.address}</p>
          </div>
          <div className="mobile-stack">
            {(statuses[c.id] || []).map(b => {
              const bg = badge(b);
              return (
                <article key={b.building_id} className="mobile-card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {b.address}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {b.apartments_count} mieszkań • {b.chimneys_count} przewodów
                      </div>
                    </div>
                    <span className={`chip ${bg.cls} flex-shrink-0`}>{bg.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><span className="text-slate-400">Ost. kontrola:</span> <strong>{fmtDate(b.oldest_inspection)}</strong></div>
                    <div><span className="text-slate-400">Wizyt:</span> <strong>{b.visits_done} zakończ. / {b.visits_scheduled} umów.</strong></div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
