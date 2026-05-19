import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';

const STATUS_BADGE = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  converted: 'bg-emerald-200 text-emerald-800',
  rejected: 'bg-slate-100 text-slate-500',
};
const STATUS_LABEL = { new: 'Nowy', contacted: 'Kontakt', scheduled: 'Umówiony', converted: 'Klient', rejected: 'Odrzucony' };

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
  function setFilter(s) {
    const n = new URLSearchParams(params);
    if (s === 'all') n.delete('status'); else n.set('status', s);
    setParams(n);
  }

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);
  const stats = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    total: leads.length,
  };
  const conv = stats.total ? Math.round((stats.converted / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Leady</h1>
        <p className="text-slate-500 text-sm">Zapytania ze strony głównej.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label="Nowe" value={stats.new} tone="blue" onClick={() => setFilter('new')} />
        <Stat label="W kontakcie" value={stats.contacted} tone="amber" onClick={() => setFilter('contacted')} />
        <Stat label="Skonwertowane" value={stats.converted} tone="emerald" onClick={() => setFilter('converted')} />
        <Stat label="Konwersja" value={`${conv}%`} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', ...Object.keys(STATUS_LABEL)].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-md ${filter === s ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {s === 'all' ? `Wszystkie (${leads.length})` : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Klient</th>
              <th className="text-left p-3">Kontakt</th>
              <th className="text-left p-3">Usługa</th>
              <th className="text-left p-3">Wiadomość</th>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium">{l.full_name}</td>
                <td className="p-3 text-sm">
                  <div><a href={`tel:${l.phone}`} className="text-orange-600 hover:underline">{l.phone}</a></div>
                  {l.email && <div className="text-slate-500"><a href={`mailto:${l.email}`}>{l.email}</a></div>}
                </td>
                <td className="p-3 text-slate-600">{l.service_type || '—'}</td>
                <td className="p-3 text-slate-500 text-sm max-w-xs">{l.message || '—'}</td>
                <td className="p-3 text-slate-500 text-xs">{fmtDateTime(l.created_at)}</td>
                <td className="p-3">
                  <select value={l.status} onChange={e => update(l.id, { status: e.target.value })}
                    className={`text-xs px-2 py-1 rounded border-0 ${STATUS_BADGE[l.status]}`}>
                    {Object.entries(STATUS_LABEL).map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-slate-400">Brak leadów.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
function Stat({ label, value, tone = 'slate', onClick }) {
  const c = { slate: 'bg-white', blue: 'bg-blue-50 border-blue-200', amber: 'bg-amber-50 border-amber-200', emerald: 'bg-emerald-50 border-emerald-200' }[tone];
  return <button onClick={onClick} className={`rounded-xl border p-4 text-left ${c} ${onClick ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}`}>
    <div className="text-xs uppercase text-slate-500">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </button>;
}
