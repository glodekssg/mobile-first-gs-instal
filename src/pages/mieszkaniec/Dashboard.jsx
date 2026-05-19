import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getProfile } from '../../lib/api';
import { fmtDateTime, statusColor, statusLabel, visitTypeLabel } from '../../lib/format';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Witaj, {me?.full_name?.split(' ')[0]}</h1>
        <p className="text-slate-500">Twój panel kontroli kominiarskich.</p>
      </div>

      {apartments.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Połącz swoje mieszkanie</h3>
          <p className="text-sm text-slate-700 mb-3">
            Aby zarządzać kontrolami, wpisz kod zaproszenia, który otrzymałeś od zarządcy / kominiarza.
          </p>
          <form onSubmit={claim} className="flex gap-2">
            <input className="flex-1 border rounded px-3 py-2" placeholder="np. CODE1"
              value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <button className="px-4 py-2 bg-orange-500 text-white rounded">Połącz</button>
          </form>
          {err && <div className="text-rose-600 text-sm mt-2">{err}</div>}
          <p className="text-xs text-slate-500 mt-2">Demo: spróbuj CODE1, CODE2, CODE3, CODE4 lub HOMECODE.</p>
        </div>
      )}

      {apartments.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="text-xs uppercase text-slate-500 mb-1">Twoje mieszkanie</div>
            {apartments.map(a => (
              <div key={a.id} className="mb-2">
                <div className="font-semibold text-lg">{a.building_address}, m. {a.number}</div>
                <div className="text-sm text-slate-500">{a.city} • {a.cooperative_name || 'dom prywatny'}</div>
              </div>
            ))}
          </div>

          <Link to={next ? `/panel/mieszkaniec/wizyta/${next.id}` : '/panel/mieszkaniec/termin'}
            className={`rounded-xl border p-5 block transition hover:shadow-md hover:-translate-y-0.5 ${next ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
            <div className="text-xs uppercase text-slate-500 mb-1">Najbliższa wizyta</div>
            {next ? (
              <>
                <div className="font-semibold">{fmtDateTime(next.scheduled_at)}</div>
                <div className="text-sm text-slate-600">{visitTypeLabel[next.type]}</div>
                <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${statusColor[next.status]}`}>{statusLabel[next.status]}</span>
              </>
            ) : (
              <div className="text-orange-600 font-medium">Umów wizytę →</div>
            )}
          </Link>

          <Link to="/panel/mieszkaniec/oferty"
            className={`rounded-xl border p-5 block transition hover:shadow-md hover:-translate-y-0.5 ${activeOffers.length ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
            <div className="text-xs uppercase text-slate-500 mb-1">Oferty czekają</div>
            <div className="text-3xl font-bold">{activeOffers.length}</div>
            {activeOffers.length > 0 && <span className="text-sm text-orange-600">Zobacz →</span>}
          </Link>
        </div>
      )}

      {nba.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">Co możesz zrobić</h3>
          <div className="space-y-2">
            {nba.map(a => (
              <Link key={a.id} to={a.action_type === 'wybierz_termin' ? '/panel/mieszkaniec/termin' : '/panel/mieszkaniec/oferty'}
                className="block p-3 rounded-md border hover:border-orange-300 hover:bg-orange-50">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-slate-500">{a.rationale}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
