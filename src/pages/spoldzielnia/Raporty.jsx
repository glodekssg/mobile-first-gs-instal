import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDateTime, statusLabel, statusColor, visitTypeLabel } from '../../lib/format';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Raporty</h1>
        <button onClick={exportCsv} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm">Eksport CSV</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Wykonane kontrole" value={done.length} />
        <Stat label="Odmowa wpuszczenia" value={refused.length} tone="rose" />
        <Stat label="Łącznie wizyt" value={visits.length} />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Obiekt / lokal</th>
              <th className="text-left p-3">Typ</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {visits.map(v => (
              <tr key={v.id}>
                <td className="p-3">{fmtDateTime(v.scheduled_at)}</td>
                <td className="p-3">{v.building_address}{v.apt_number ? ` / m. ${v.apt_number}` : ''}</td>
                <td className="p-3">{visitTypeLabel[v.type] || v.type}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
function Stat({ label, value, tone = 'slate' }) {
  const c = tone === 'rose' ? 'bg-rose-50 border-rose-200' : 'bg-white';
  return <div className={`rounded-xl border p-5 ${c}`}><div className="text-xs uppercase text-slate-500">{label}</div><div className="text-3xl font-bold mt-1">{value}</div></div>;
}
