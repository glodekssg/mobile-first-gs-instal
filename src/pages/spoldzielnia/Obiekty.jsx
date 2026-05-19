import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

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

  function badge(b) {
    if (!b.oldest_inspection) return <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded">brak danych</span>;
    const daysAgo = (Date.now() - new Date(b.oldest_inspection).getTime()) / 86400000;
    if (daysAgo > 330) return <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded">termin zbliża się / minął</span>;
    if (daysAgo > 270) return <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded">{'< 90 dni do terminu'}</span>;
    return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded">w terminie</span>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Obiekty</h1>

      {coops.map(c => (
        <div key={c.id} className="bg-white rounded-xl border overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-sm text-slate-500">{c.address}</p>
          </div>
          <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="text-left p-3">Adres</th>
                <th className="text-left p-3">Mieszkań</th>
                <th className="text-left p-3">Przewody</th>
                <th className="text-left p-3">Ost. kontrola</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Wizyty</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(statuses[c.id] || []).map(b => (
                <tr key={b.building_id}>
                  <td className="p-3 font-medium">{b.address}</td>
                  <td className="p-3">{b.apartments_count}</td>
                  <td className="p-3">{b.chimneys_count}</td>
                  <td className="p-3">{fmtDate(b.oldest_inspection)}</td>
                  <td className="p-3">{badge(b)}</td>
                  <td className="p-3 text-xs text-slate-500">{b.visits_done} zakończonych, {b.visits_scheduled} umówionych</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      ))}
    </div>
  );
}
