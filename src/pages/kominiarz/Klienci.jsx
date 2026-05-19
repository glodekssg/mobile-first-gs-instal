import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Klienci() {
  const [buildings, setBuildings] = useState([]);
  const [coops, setCoops] = useState([]);
  const [search, setSearch] = useState('');

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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Obiekty / Klienci</h1>
        <input
          className="border rounded-md px-3 py-2 text-sm w-72"
          placeholder="🔍 Szukaj po nazwie, adresie, NIP..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-3">Spółdzielnie / wspólnoty ({filteredCoops.length})</h3>
        <div className="divide-y">
          {filteredCoops.map(c => (
            <div key={c.id} className="py-3">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-slate-500">{c.address} • {c.buildings_count} budynk(ów){c.nip ? ` • NIP ${c.nip}` : ''}</div>
            </div>
          ))}
          {filteredCoops.length === 0 && <div className="py-6 text-center text-slate-400 text-sm">Brak wyników.</div>}
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Obiekty ({filteredBuildings.length})</h3>
        </div>
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Adres</th>
              <th className="text-left p-3">Typ</th>
              <th className="text-left p-3">Klient</th>
              <th className="text-left p-3">Mieszkania</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBuildings.map(b => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="p-3 font-medium">{b.address}, {b.city}</td>
                <td className="p-3">{b.type}</td>
                <td className="p-3 text-slate-500">{b.cooperative_name || '—'}</td>
                <td className="p-3">{b.apartments_count}</td>
                <td className="p-3 text-right">
                  <Link to={`/panel/kominiarz/budynek/${b.id}`} className="text-orange-600 hover:underline">Szczegóły →</Link>
                </td>
              </tr>
            ))}
            {filteredBuildings.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-slate-400">Brak wyników.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
