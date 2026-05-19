import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime, visitTypeLabel, statusColor, statusLabel } from '../../lib/format';

export default function Historia() {
  const [visits, setVisits] = useState([]);
  const [protocols, setProtocols] = useState([]);

  useEffect(() => {
    api('/visits').then(setVisits);
    api('/protocols/mine').then(setProtocols);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Historia kontroli</h1>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Wszystkie wizyty</h3>
        <div className="divide-y">
          {visits.map(v => (
            <Link key={v.id} to={`/panel/mieszkaniec/wizyta/${v.id}`}
              className="block py-3 -mx-5 px-5 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{visitTypeLabel[v.type] || v.type}</div>
                  <div className="text-sm text-slate-500">{fmtDateTime(v.scheduled_at)} • {v.building_address}{v.apt_number ? ` / m. ${v.apt_number}` : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${statusColor[v.status]}`}>{statusLabel[v.status]}</span>
                  <span className="text-orange-600 text-sm">Szczegóły →</span>
                </div>
              </div>
            </Link>
          ))}
          {visits.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak wizyt w historii.</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Protokoły do pobrania</h3>
        <div className="divide-y">
          {protocols.map(p => (
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{visitTypeLabel[p.visit_type] || p.visit_type} — {p.result}</div>
                <div className="text-sm text-slate-500">{fmtDateTime(p.signed_at)} • podpisał: {p.signed_by}</div>
              </div>
              <button onClick={() => downloadPdf(p)} className="text-orange-600 text-sm hover:underline">Pobierz PDF</button>
            </div>
          ))}
          {protocols.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak protokołów.</div>}
        </div>
      </div>
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
