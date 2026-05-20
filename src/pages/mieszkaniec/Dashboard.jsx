import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getProfile } from '../../lib/api';
import { fmtDateTime, statusColor, statusLabel, visitTypeLabel } from '../../lib/format';
import { Home, Calendar, History, Gift, Wrench, ChevronRight, Lightbulb } from 'lucide-react';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import EmptyState from '../../components/mobile/EmptyState';

export default function MieszkaniecDashboard() {
  const [apartments, setApartments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [offers, setOffers] = useState([]);
  const [nba, setNba] = useState([]);
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const me = getProfile();

  function load() {
    api('/apartments/mine').then(setApartments);
    api('/visits').then(setVisits);
    api('/offers').then(setOffers);
    api('/nba').then(setNba);
  }
  useEffect(load, []);

  async function claim(e) {
    e.preventDefault();
    setErr(null);
    try {
      await api('/apartments/claim', { method: 'POST', body: { invite_code: code.trim() } });
      setCode('');
      load();
    } catch (e) { setErr(e.message); }
  }

  const next = visits.find(v => v.status === 'umowiona' && v.scheduled_at >= new Date().toISOString());
  const activeOffers = offers.filter(o => o.status === 'wyslana');

  return (
    <div className="panel-page">
      <MobilePageHeader
        title={`Cześć, ${me?.full_name?.split(' ')[0] || ''}`}
        subtitle="Twoje kontrole kominiarskie pod ręką"
        sticky={false}
      />

      {apartments.length === 0 && (
        <section className="mobile-card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <h2 className="font-bold text-slate-900 mb-1">Połącz swoje mieszkanie</h2>
          <p className="text-sm text-slate-700 mb-3">
            Wpisz kod zaproszenia, który otrzymałeś od zarządcy lub kominiarza.
          </p>
          <form onSubmit={claim} className="flex flex-col sm:flex-row gap-2">
            <input
              className="form-input uppercase tracking-wider"
              placeholder="np. CODE1"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect="off"
            />
            <button className="btn-primary sm:w-auto">Połącz</button>
          </form>
          {err && <div className="text-rose-600 text-sm mt-2">{err}</div>}
          <p className="text-xs text-slate-500 mt-2">Demo: CODE1, CODE2, CODE3, CODE4, HOMECODE.</p>
        </section>
      )}

      {apartments.length > 0 && (
        <section className="mobile-card bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Home className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-300 uppercase tracking-wide font-semibold">Mieszkanie</div>
              {apartments.map(a => (
                <div key={a.id} className="font-bold text-lg truncate">{a.building_address}, m. {a.number}</div>
              ))}
              <div className="text-sm text-slate-300 truncate">
                {apartments[0]?.city} • {apartments[0]?.cooperative_name || 'dom prywatny'}
              </div>
            </div>
          </div>
        </section>
      )}

      {apartments.length > 0 && next && (
        <Link
          to={`/panel/mieszkaniec/wizyta/${next.id}`}
          className="mobile-card border-blue-200 bg-blue-50 active:bg-blue-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase text-blue-700 font-bold tracking-wide">Najbliższa wizyta</div>
              <div className="font-bold text-slate-900">{fmtDateTime(next.scheduled_at)}</div>
              <div className="text-sm text-slate-700">{visitTypeLabel[next.type]}</div>
              <span className={`mt-2 inline-block chip ${statusColor[next.status]}`}>{statusLabel[next.status]}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-400 flex-shrink-0" />
          </div>
        </Link>
      )}

      {apartments.length > 0 && (
        <section className="grid grid-cols-2 gap-3">
          <Tile to="/panel/mieszkaniec/termin" icon={Calendar} label="Umów wizytę" tone="orange" />
          <Tile
            to="/panel/mieszkaniec/oferty"
            icon={Gift}
            label="Oferty"
            tone={activeOffers.length ? 'amber' : 'slate'}
            badge={activeOffers.length || null}
          />
          <Tile to="/panel/mieszkaniec/historia" icon={History} label="Historia" tone="slate" />
          <Tile to="/panel/mieszkaniec/zgloszenie" icon={Wrench} label="Zgłoś usterkę" tone="slate" />
        </section>
      )}

      {nba.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 px-1">Sugestie dla Ciebie</h2>
          <div className="space-y-2">
            {nba.map(a => (
              <Link
                key={a.id}
                to={a.action_type === 'wybierz_termin' ? '/panel/mieszkaniec/termin' : '/panel/mieszkaniec/oferty'}
                className="mobile-card flex items-start gap-3 active:bg-slate-50"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{a.title}</div>
                  <div className="text-sm text-slate-500">{a.rationale}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {apartments.length > 0 && visits.length === 0 && !next && (
        <EmptyState
          icon={Calendar}
          title="Jeszcze brak historii"
          body="Umów pierwszą wizytę kontrolną — to zajmie minutę."
          action={<Link to="/panel/mieszkaniec/termin" className="btn-primary">Umów wizytę</Link>}
        />
      )}
    </div>
  );
}

function Tile({ to, icon: Icon, label, tone = 'slate', badge }) {
  const tones = {
    slate: 'bg-white text-slate-900 border-slate-200',
    orange: 'bg-orange-500 text-white border-orange-500',
    amber: 'bg-amber-100 text-amber-900 border-amber-200',
  };
  const iconBg = {
    slate: 'bg-orange-50 text-orange-600',
    orange: 'bg-white/20 text-white',
    amber: 'bg-amber-200 text-amber-800',
  };
  return (
    <Link to={to} className={`tile ${tones[tone]} active:opacity-90`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg[tone]}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="font-bold text-base leading-snug">{label}</div>
      {badge != null && (
        <span className="absolute top-3 right-3 min-w-[24px] h-6 px-1.5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </Link>
  );
}
