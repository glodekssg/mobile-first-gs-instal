import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, History as HistoryIcon, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';
import StatusBadge from '../../components/mobile/StatusBadge';

export default function Historia() {
  const [visits, setVisits] = useState([]);
  const [protocols, setProtocols] = useState([]);

  useEffect(() => {
    api('/visits').then(setVisits);
    api('/protocols/mine').then(setProtocols);
  }, []);

  return (
    <div className="panel-page">
      <MobilePageHeader title="Historia kontroli" back="/panel/mieszkaniec" sticky={false} />

      <section>
        <h2 className="font-bold text-slate-900 mb-2 px-1">Wszystkie wizyty</h2>
        <div className="mobile-stack">
          {visits.map(v => (
            <Link
              key={v.id}
              to={`/panel/mieszkaniec/wizyta/${v.id}`}
              className="mobile-card active:bg-slate-50 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">{visitTypeLabel[v.type] || v.type}</div>
                <div className="text-sm text-slate-500 truncate">{fmtDateTime(v.scheduled_at)}</div>
                <div className="text-xs text-slate-400 truncate mt-0.5">
                  📍 {v.building_address}{v.apt_number ? ` / m. ${v.apt_number}` : ''}
                </div>
                <StatusBadge status={v.status} className="mt-2" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
            </Link>
          ))}
          {visits.length === 0 && (
            <EmptyState icon={HistoryIcon} title="Brak historii" body="Twoja pierwsza wizyta pojawi się tutaj." />
          )}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-slate-900 mb-2 px-1">Protokoły do pobrania</h2>
        <div className="mobile-stack">
          {protocols.map(p => (
            <div key={p.id} className="mobile-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {visitTypeLabel[p.visit_type] || p.visit_type} — {p.result}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {fmtDateTime(p.signed_at)} • {p.signed_by}
                </div>
              </div>
              <button onClick={() => downloadPdf(p)} className="btn-secondary text-sm">PDF</button>
            </div>
          ))}
          {protocols.length === 0 && (
            <EmptyState icon={FileDown} title="Brak protokołów" body="Protokoły pojawią się tu po zakończonych kontrolach." />
          )}
        </div>
      </section>
    </div>
  );
}

function downloadPdf(p) {
  const html = `
    <html><head><meta charset="utf-8"><title>Protokół ${p.id}</title>
    <style>body{font-family:Georgia,serif;padding:40px;max-width:800px;margin:auto}
    h1{border-bottom:2px solid #333;padding-bottom:10px}
    .grid{display:grid;grid-template-columns:200px 1fr;gap:10px;margin:20px 0}
    .label{color:#666;font-weight:bold}</style></head>
    <body>
      <h1>PROTOKÓŁ KONTROLI KOMINIARSKIEJ</h1>
      <div class="grid">
        <div class="label">Adres:</div><div>${p.address}${p.apt_number ? ' / m. ' + p.apt_number : ''}</div>
        <div class="label">Data kontroli:</div><div>${new Date(p.signed_at).toLocaleString('pl-PL')}</div>
        <div class="label">Rodzaj:</div><div>${p.visit_type}</div>
        <div class="label">Wynik:</div><div><strong>${p.result.toUpperCase()}</strong></div>
        <div class="label">Wykryte usterki:</div><div>${p.findings || '—'}</div>
        <div class="label">Zalecenia:</div><div>${p.recommendations || '—'}</div>
        <div class="label">Podpisał:</div><div>${p.signed_by}</div>
      </div>
      <p style="margin-top:60px;border-top:1px solid #ccc;padding-top:10px;font-size:11px;color:#888">
        Dokument wygenerowany przez system GS Instal Sp. z o.o.</p>
    </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}
