import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDate, fmtDateTime, statusColor, statusLabel, visitTypeLabel } from '../../lib/format';

export default function BudynekDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);

  useEffect(() => { api(`/buildings/${id}`).then(setB).catch(console.error); }, [id]);
  if (!b) return <div>Ładowanie...</div>;

  return (
    <div className="space-y-6">
      <Link to="/panel/kominiarz/klienci" className="text-sm text-slate-500">← Obiekty</Link>
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{b.address}</h1>
            <p className="text-slate-500">{b.city} {b.postal_code} • {b.type} • {b.apartments_count} mieszkań</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to={`/panel/kominiarz/wizyty?building_id=${b.id}`}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded">+ Nowa wizyta</Link>
            <Link to={`/panel/kominiarz/oferty?building_id=${b.id}`}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded">+ Oferta</Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Mieszkania ({b.apartments.length})</h3>
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left p-2">Numer</th><th className="text-left p-2">Piętro</th><th className="text-left p-2">Mieszkaniec</th><th className="text-left p-2">Kod zaproszenia</th></tr>
          </thead>
          <tbody className="divide-y">
            {b.apartments.map(a => (
              <tr key={a.id}>
                <td className="p-2 font-medium">m. {a.number}</td>
                <td className="p-2">{a.floor || '—'}</td>
                <td className="p-2">{a.resident_name || <span className="text-slate-400">nieprzypisany</span>}</td>
                <td className="p-2"><code className="bg-slate-100 px-2 py-0.5 rounded">{a.resident_invite_code}</code></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Przewody i urządzenia ({b.chimneys.length})</h3>
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left p-2">Typ</th><th className="text-left p-2">Paliwo</th><th className="text-left p-2">Urządzenie</th><th className="text-left p-2">Ostatnia kontrola</th><th className="text-left p-2">Wkład</th><th className="text-left p-2">Nasada</th></tr>
          </thead>
          <tbody className="divide-y">
            {b.chimneys.map(c => (
              <tr key={c.id}>
                <td className="p-2 capitalize">{c.kind}</td>
                <td className="p-2">{c.fuel || '—'}</td>
                <td className="p-2">{c.device || '—'}</td>
                <td className="p-2">{fmtDate(c.last_inspection)}</td>
                <td className="p-2">{c.has_wklad ? '✓' : '—'}</td>
                <td className="p-2">{c.has_nasada ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Wizyty ({b.visits.length})</h3>
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left p-2">Data</th><th className="text-left p-2">Typ</th><th className="text-left p-2">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y">
            {b.visits.map(v => (
              <tr key={v.id}>
                <td className="p-2">{fmtDateTime(v.scheduled_at)}</td>
                <td className="p-2">{visitTypeLabel[v.type] || v.type}</td>
                <td className="p-2"><span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span></td>
                <td className="p-2 text-right">
                  <Link to={`/panel/kominiarz/wizyta/${v.id}`} className="text-orange-600 hover:underline">Otwórz</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
