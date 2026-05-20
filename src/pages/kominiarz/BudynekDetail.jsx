import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Tag, Building2, Wind, ClipboardList, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDate, fmtDateTime, visitTypeLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import Spinner from '../../components/mobile/Spinner';
import StatusBadge from '../../components/mobile/StatusBadge';

export default function BudynekDetail() {
  const { id } = useParams();
  const [b, setB] = useState(null);
  const [tab, setTab] = useState('apts');
  const [copied, setCopied] = useState(null);

  useEffect(() => { api(`/buildings/${id}`).then(setB).catch(console.error); }, [id]);
  if (!b) return (
    <div className="panel-page">
      <MobilePageHeader title="Obiekt" back="/panel/kominiarz/klienci" />
      <Spinner />
    </div>
  );

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title={b.address} subtitle={`${b.city} • ${b.type}`} back="/panel/kominiarz/klienci" />

      <section className="mobile-card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="w-6 h-6 text-orange-400" />
          <div>
            <div className="font-bold text-lg">{b.apartments_count} mieszkań</div>
            <div className="text-xs text-slate-300">{b.chimneys?.length || 0} przewodów • {b.visits?.length || 0} wizyt w historii</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/panel/kominiarz/wizyty?building_id=${b.id}`} className="btn-primary flex-1 py-2.5">
            <Plus className="w-4 h-4" /> Wizyta
          </Link>
          <Link to={`/panel/kominiarz/oferty?building_id=${b.id}`} className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 py-2.5">
            <Tag className="w-4 h-4" /> Oferta
          </Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-100 rounded-xl p-1">
        <Tab active={tab === 'apts'} onClick={() => setTab('apts')} label={`Mieszkania (${b.apartments.length})`} />
        <Tab active={tab === 'chimneys'} onClick={() => setTab('chimneys')} label={`Przewody (${b.chimneys.length})`} />
        <Tab active={tab === 'visits'} onClick={() => setTab('visits')} label={`Wizyty (${b.visits.length})`} />
      </div>

      {tab === 'apts' && (
        <div className="mobile-stack">
          {b.apartments.map(a => (
            <div key={a.id} className="mobile-card">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-bold text-slate-900">m. {a.number}</div>
                {a.floor && <span className="chip chip-idle">p. {a.floor}</span>}
              </div>
              <div className="text-sm text-slate-600">
                {a.resident_name || <span className="text-slate-400">nieprzypisany</span>}
              </div>
              {a.resident_invite_code && (
                <button
                  onClick={() => copyCode(a.resident_invite_code)}
                  className="mt-2 inline-flex items-center gap-2 bg-slate-100 active:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono"
                  aria-label={`Skopiuj kod ${a.resident_invite_code}`}
                >
                  <span>{a.resident_invite_code}</span>
                  {copied === a.resident_invite_code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              )}
            </div>
          ))}
          {b.apartments.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">Brak mieszkań.</div>}
        </div>
      )}

      {tab === 'chimneys' && (
        <div className="mobile-stack">
          {b.chimneys.map(c => (
            <div key={c.id} className="mobile-card flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                <Wind className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 capitalize">{c.kind}{c.device ? ` — ${c.device}` : ''}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Paliwo: {c.fuel || '—'} • Ostatnia kontrola: {fmtDate(c.last_inspection)}
                </div>
                <div className="flex gap-2 mt-2">
                  {c.has_wklad && <span className="chip bg-emerald-100 text-emerald-700">Wkład</span>}
                  {c.has_nasada && <span className="chip bg-emerald-100 text-emerald-700">Nasada</span>}
                  {!c.has_wklad && !c.has_nasada && <span className="chip chip-idle">brak osprzętu</span>}
                </div>
              </div>
            </div>
          ))}
          {b.chimneys.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">Brak danych o przewodach.</div>}
        </div>
      )}

      {tab === 'visits' && (
        <div className="mobile-stack">
          {b.visits.map(v => (
            <Link key={v.id} to={`/panel/kominiarz/wizyta/${v.id}`} className="mobile-card flex items-center gap-3 active:bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900">{fmtDateTime(v.scheduled_at)}</div>
                <div className="text-sm text-slate-500">{visitTypeLabel[v.type] || v.type}</div>
                <StatusBadge status={v.status} className="mt-1.5" />
              </div>
            </Link>
          ))}
          {b.visits.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">Brak wizyt.</div>}
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`py-2.5 rounded-lg font-semibold text-xs transition-colors ${active ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
    >
      {label}
    </button>
  );
}
