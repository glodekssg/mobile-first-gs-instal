import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

export default function AdminAudit() {
  const [log, setLog] = useState([]);
  useEffect(() => { api('/admin/audit').then(setLog); }, []);

  return (
    <div className="panel-page">
      <MobilePageHeader title="Audit log" subtitle="Historia akcji admina" />

      <div className="mobile-stack">
        {log.length === 0 ? (
          <EmptyState icon={ScrollText} title="Brak wpisów" />
        ) : (
          log.map(e => (
            <article key={e.id} className="mobile-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{e.actor_name}</div>
                  <div className="text-xs text-slate-500 truncate">{e.actor_email}</div>
                </div>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">{e.action}</code>
              </div>
              {e.target && <div className="text-xs text-slate-500 mt-2 truncate"><strong>Cel:</strong> {e.target}</div>}
              {e.payload && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 cursor-pointer">Payload</summary>
                  <pre className="text-xs font-mono text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg overflow-x-auto">{e.payload}</pre>
                </details>
              )}
              <div className="text-xs text-slate-400 mt-2">{fmtDateTime(e.created_at)}</div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
