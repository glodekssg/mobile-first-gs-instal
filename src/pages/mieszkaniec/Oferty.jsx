import { useEffect, useState } from 'react';
import { Gift, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

const STATUS = {
  wyslana: { label: 'Czeka na decyzję', cls: 'bg-blue-100 text-blue-700' },
  zaakceptowana: { label: 'Zaakceptowana', cls: 'bg-emerald-100 text-emerald-700' },
  odrzucona: { label: 'Odrzucona', cls: 'bg-rose-100 text-rose-700' },
  wygasla: { label: 'Wygasła', cls: 'bg-slate-100 text-slate-500' },
};

export default function MieszkaniecOferty() {
  const [offers, setOffers] = useState([]);
  const [busy, setBusy] = useState(null);

  function load() { api('/offers').then(setOffers); }
  useEffect(load, []);

  async function accept(id) {
    if (!confirm('Zaakceptować ofertę? Wizyta realizacyjna zostanie umówiona automatycznie.')) return;
    setBusy(id);
    try { await api(`/offers/${id}/accept`, { method: 'POST' }); load(); }
    finally { setBusy(null); }
  }
  async function reject(id) {
    if (!confirm('Odrzucić tę ofertę?')) return;
    setBusy(id);
    try { await api(`/offers/${id}/reject`, { method: 'POST' }); load(); }
    finally { setBusy(null); }
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title="Oferty dla Ciebie" back="/panel/mieszkaniec" sticky={false} />

      <div className="mobile-stack">
        {offers.map(o => {
          const s = STATUS[o.status] || STATUS.wyslana;
          return (
            <article key={o.id} className="mobile-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-900">{o.title}</h3>
                  <div className="text-sm text-slate-500 truncate">📍 {o.address}</div>
                </div>
                <span className={`chip ${s.cls} flex-shrink-0`}>{s.label}</span>
              </div>
              {o.description && (
                <p className="text-sm text-slate-700 mt-3 leading-relaxed">{o.description}</p>
              )}
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-orange-600">{o.price_pln} zł</span>
                <span className="text-xs text-slate-500">ważna do {fmtDate(o.expires_at)}</span>
              </div>
              {o.status === 'wyslana' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => accept(o.id)}
                    disabled={busy === o.id}
                    className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
                  >
                    <Check className="w-5 h-5" />
                    Akceptuję
                  </button>
                  <button
                    onClick={() => reject(o.id)}
                    disabled={busy === o.id}
                    className="btn-secondary flex-1 disabled:opacity-60"
                  >
                    <X className="w-5 h-5" />
                    Odrzucam
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {offers.length === 0 && (
          <EmptyState
            icon={Gift}
            title="Brak ofert"
            body="Kiedy kominiarz przygotuje dla Ciebie ofertę, pojawi się tutaj."
          />
        )}
      </div>
    </div>
  );
}
