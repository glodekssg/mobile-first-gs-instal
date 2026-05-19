import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';

export default function AdminAudit() {
  const [log, setLog] = useState([]);
  useEffect(() => { api('/admin/audit').then(setLog); }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-slate-500 text-sm">Historia akcji wykonanych z poziomu panelu administratora.</p>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Data</th>
              <th className="text-left p-3">Aktor</th>
              <th className="text-left p-3">Akcja</th>
              <th className="text-left p-3">Cel</th>
              <th className="text-left p-3">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {log.map(e => (
              <tr key={e.id}>
                <td className="p-3 text-xs text-slate-500">{fmtDateTime(e.created_at)}</td>
                <td className="p-3"><div className="font-medium">{e.actor_name}</div><div className="text-xs text-slate-500">{e.actor_email}</div></td>
                <td className="p-3"><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{e.action}</code></td>
                <td className="p-3 text-slate-500 text-xs">{e.target || '—'}</td>
                <td className="p-3 text-slate-500 text-xs font-mono max-w-md truncate">{e.payload || '—'}</td>
              </tr>
            ))}
            {log.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">Brak wpisów.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
