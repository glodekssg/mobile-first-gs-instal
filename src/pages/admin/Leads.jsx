import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, Mail, UserPlus2 } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

const STATUS = {
  new: { label: 'Nowy', cls: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Kontakt', cls: 'bg-amber-100 text-amber-700' },
  scheduled: { label: 'Umówiony', cls: 'bg-emerald-100 text-emerald-700' },
  converted: { label: 'Klient', cls: 'bg-emerald-200 text-emerald-800' },
  rejected: { label: 'Odrzucony', cls: 'bg-slate-100 text-slate-500' },
};

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [params, setParams] = useSearchParams();
  const filter = params.get('status') || 'all';

  function load() { api('/leads').then(setLeads); }
  useEffect(load, []);

  async function update(id, fields) {
    await api(`/leads/${id}`, { method: 'PATCH', body: fields });
    load();
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const counts = useMemo(() => Object.keys(STATUS).reduce((acc, k) => { acc[k] = leads.filter(l => l.status === k).length; return acc; }, {}), [leads]);
  const conv = leads.length ? Math.round(((counts.converted || 0) / leads.length) * 100) : 0;
  const filters = [
    { value: null, label: 'Wszystkie', count: leads.length },
    ...Object.entries(STATUS).map(([k, s]) => ({ value: k, label: s.label, count: counts[k] || 0 })),
  ];

  return (
    <div className="panel-page">
      <MobilePageHeader title="Leady" subtitle={`Konwersja: ${conv}%`} />

      <FilterBar
        filters={filters}
        value={filter === 'all' ? null : filter}
        onChange={(v) => v ? setParams({ status: v }) : setParams({})}
      />

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={UserPlus2} title="Brak zapytań" />
        ) : (
          filtered.map(l => (
            <article key={l.id} className="mobile-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900">{l.full_name}</div>
                  {l.email && <div className="text-xs text-slate-500 truncate">{l.email}</div>}
                  <div className="text-xs text-slate-500">{l.phone}</div>
                </div>
                <select value={l.status} onChange={e => update(l.id, { status: e.target.value })}
                  className={`chip ${STATUS[l.status]?.cls} px-2 py-1 border-0 outline-0`}>
                  {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </div>
              {l.service_type && <div className="text-xs mt-1"><strong>Usługa:</strong> {l.service_type}</div>}
              {l.message && <p className="text-sm text-slate-700 mt-2 line-clamp-3">{l.message}</p>}
              <div className="text-xs text-slate-400 mt-2">{fmtDateTime(l.created_at)}</div>
              <div className="flex gap-2 mt-3">
                <a href={`tel:${l.phone}`} className="btn-secondary flex-1">
                  <Phone className="w-4 h-4 text-orange-500" /> Zadzwoń
                </a>
                {l.email && (
                  <a href={`mailto:${l.email}`} className="btn-secondary flex-1">
                    <Mail className="w-4 h-4" /> Email
                  </a>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
