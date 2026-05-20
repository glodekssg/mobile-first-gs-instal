import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Users } from 'lucide-react';
import { api } from '../../lib/api';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import SearchBar from '../../components/mobile/SearchBar';
import EmptyState from '../../components/mobile/EmptyState';

export default function Klienci() {
  const [buildings, setBuildings] = useState([]);
  const [coops, setCoops] = useState([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('buildings');

  useEffect(() => {
    Promise.all([api('/buildings'), api('/cooperatives')])
      .then(([b, c]) => { setBuildings(b); setCoops(c); })
      .catch(console.error);
  }, []);

  const lower = search.toLowerCase();
  const filteredCoops = useMemo(() => coops.filter(c =>
    !search || c.name?.toLowerCase().includes(lower) || c.address?.toLowerCase().includes(lower) || c.nip?.includes(search)
  ), [coops, search, lower]);
  const filteredBuildings = useMemo(() => buildings.filter(b =>
    !search || b.address?.toLowerCase().includes(lower) || b.city?.toLowerCase().includes(lower) || b.cooperative_name?.toLowerCase().includes(lower)
  ), [buildings, search, lower]);

  return (
    <div className="panel-page">
      <MobilePageHeader title="Obiekty / Klienci" />

      <SearchBar value={search} onChange={setSearch} placeholder="Adres, nazwa, NIP…" />

      <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1">
        <button
          onClick={() => setTab('buildings')}
          className={`py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === 'buildings' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
        >
          Obiekty ({filteredBuildings.length})
        </button>
        <button
          onClick={() => setTab('coops')}
          className={`py-2.5 rounded-lg font-semibold text-sm transition-colors ${tab === 'coops' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}
        >
          Spółdzielnie ({filteredCoops.length})
        </button>
      </div>

      {tab === 'buildings' ? (
        <div className="mobile-stack">
          {filteredBuildings.length === 0 ? (
            <EmptyState icon={Building2} title="Brak obiektów" body={search ? 'Spróbuj innych słów kluczowych.' : 'Dodaj pierwszy obiekt.'} />
          ) : (
            filteredBuildings.map(b => (
              <Link key={b.id} to={`/panel/kominiarz/budynek/${b.id}`} className="mobile-card flex items-center gap-3 active:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{b.address}, {b.city}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {b.type} • {b.apartments_count} mieszkań
                    {b.cooperative_name && ` • ${b.cooperative_name}`}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="mobile-stack">
          {filteredCoops.length === 0 ? (
            <EmptyState icon={Users} title="Brak spółdzielni" body={search ? 'Spróbuj innych słów kluczowych.' : 'Spółdzielnie pojawią się tu po dodaniu obiektów.'} />
          ) : (
            filteredCoops.map(c => (
              <div key={c.id} className="mobile-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{c.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {c.address} • {c.buildings_count} budynk(ów){c.nip ? ` • NIP ${c.nip}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
