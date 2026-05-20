import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, statusLabel, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import StatusBadge from '../../components/mobile/StatusBadge';
import EmptyState from '../../components/mobile/EmptyState';

export default function Raporty() {
  const [visits, setVisits] = useState([]);

  useEffect(() => { api('/visits').then(setVisits).catch(console.error); }, []);

  const done = visits.filter(v => v.status === 'zakonczona');
  const refused = visits.filter(v => v.status === 'odmowa_wpuszczenia');

  function exportCsv() {
    const rows = [['Data', 'Adres', 'Lokal', 'Typ', 'Status']];
    visits.forEach(v => rows.push([
      v.scheduled_at || '', v.building_address || '', v.apt_number || '',
      visitTypeLabel[v.type] || v.type, statusLabel[v.status] || v.status,
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `raport-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="panel-page">
      <MobilePageHeader
        title="Raporty"
        right={(
          <button onClick={exportCsv} className="btn-primary text-sm py-2">
            <Download className="w-4 h-4" /> CSV
          </button>
        )}
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Zakończone" value={done.length} />
        <Stat label="Odmowa" value={refused.length} tone="rose" />
        <Stat label="Łącznie" value={visits.length} />
      </div>

      <div className="mobile-stack">
        {visits.length === 0 ? (
          <EmptyState icon={FileText} title="Brak danych" body="Raporty pojawią się po pierwszych wizytach." />
        ) : (
          visits.map(v => (
            <div key={v.id} className="mobile-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {v.building_address}{v.apt_number ? ` / m. ${v.apt_number}` : ''}
                  </div>
                  <div className="text-xs text-slate-500">{fmtDateTime(v.scheduled_at)} • {visitTypeLabel[v.type] || v.type}</div>
                </div>
                <StatusBadge status={v.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'slate' }) {
  const c = tone === 'rose' ? 'bg-rose-50 border-rose-200' : 'bg-white';
  return (
    <div className={`kpi-card ${c}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value mt-1">{value}</div>
    </div>
  );
}
