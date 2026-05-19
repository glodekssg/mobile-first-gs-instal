import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';

const STATUS_BADGE = {
  wyslana: 'bg-blue-100 text-blue-700',
  zaakceptowana: 'bg-emerald-100 text-emerald-700',
  odrzucona: 'bg-rose-100 text-rose-700',
  wygasla: 'bg-slate-100 text-slate-500',
};

export default function MieszkaniecOferty() {
  const [offers, setOffers] = useState([]);

  function load() { api('/offers').then(setOffers); }
  useEffect(load, []);

  async function accept(id) {
    if (!confirm('Zaakceptować ofertę? Wizyta realizacyjna zostanie umówiona automatycznie.')) return;
    await api(`/offers/${id}/accept`, { method: 'POST' });
    load();
  }
  async function reject(id) {
    await api(`/offers/${id}/reject`, { method: 'POST' });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Oferty dla Ciebie</h1>

      <div className="space-y-3">
        {offers.map(o => (
          <div key={o.id} className="bg-white rounded-xl border p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{o.title}</h3>
                <div className="text-sm text-slate-500">{o.address}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${STATUS_BADGE[o.status]}`}>{o.status}</span>
            </div>
            {o.description && <p className="text-sm text-slate-600 mt-2">{o.description}</p>}
            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-2xl font-bold text-orange-600">{o.price_pln} zł</span>
                <span className="text-xs text-slate-500 ml-3">ważna do {fmtDate(o.expires_at)}</span>
              </div>
              {o.status === 'wyslana' && (
                <div className="flex gap-2">
                  <button onClick={() => accept(o.id)} className="px-4 py-2 bg-emerald-600 text-white rounded">Akceptuję</button>
                  <button onClick={() => reject(o.id)} className="px-4 py-2 border-2 rounded">Odrzucam</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="bg-white rounded-xl border p-10 text-center text-slate-400">
            Aktualnie nie ma dla Ciebie żadnych ofert.
          </div>
        )}
      </div>
    </div>
  );
}
