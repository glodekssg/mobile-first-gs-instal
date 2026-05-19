import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { fmtDateTime } from '../../lib/format';

export default function WybierzTermin() {
  const [apartments, setApartments] = useState([]);
  const [selectedApt, setSelectedApt] = useState('');
  const [slots, setSlots] = useState([]);
  const [kominiarzId, setKominiarzId] = useState(null);
  const [type, setType] = useState('kontrola');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api('/apartments/mine').then(a => {
      setApartments(a);
      if (a.length === 1) {
        setSelectedApt(a[0].id);
        loadSlots(a[0].id);
      }
    });
  }, []);

  async function loadSlots(aptId) {
    const { slots, kominiarz_id } = await api(`/visits/slots/${aptId}`);
    setSlots(slots);
    setKominiarzId(kominiarz_id);
  }

  async function book(slot) {
    setBusy(true);
    try {
      await api('/visits/book', {
        method: 'POST',
        body: { apartment_id: Number(selectedApt), scheduled_at: slot, type, kominiarz_id: kominiarzId, notes },
      });
      setMsg('✓ Wizyta umówiona. Otrzymasz potwierdzenie e-mailem.');
      setTimeout(() => nav('/panel/mieszkaniec'), 1500);
    } catch (e) {
      setMsg(e.message);
    } finally { setBusy(false); }
  }

  if (apartments.length === 0) {
    return <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">Najpierw połącz swoje mieszkanie kodem zaproszenia na stronie głównej.</div>;
  }

  // Grupowanie slotów po dniu
  const byDay = slots.reduce((acc, s) => {
    const day = s.slice(0, 10);
    (acc[day] = acc[day] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Umów wizytę</h1>
        <p className="text-slate-500">Wybierz dogodny dla siebie termin z wolnych okien w kalendarzu kominiarza.</p>
      </div>

      {apartments.length > 1 && (
        <div className="bg-white rounded-xl border p-5">
          <label className="text-sm font-medium">Mieszkanie</label>
          <select className="mt-2 w-full border rounded px-3 py-2" value={selectedApt}
            onChange={e => { setSelectedApt(e.target.value); loadSlots(e.target.value); }}>
            <option value="">— wybierz —</option>
            {apartments.map(a => <option key={a.id} value={a.id}>{a.building_address}, m. {a.number}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <label className="text-sm font-medium">Rodzaj wizyty</label>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            ['kontrola', 'Kontrola okresowa'],
            ['czyszczenie', 'Czyszczenie'],
            ['inspekcja_kamera', 'Inspekcja kamerą'],
            ['kontrola_gaz', 'Kontrola gazu'],
            ['opinia', 'Opinia'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} type="button"
              className={`p-3 text-sm rounded border-2 ${type === k ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
              {l}
            </button>
          ))}
        </div>
        <label className="text-sm font-medium mt-4 block">Dodatkowe uwagi</label>
        <textarea className="mt-2 w-full border rounded p-2 text-sm" rows="2"
          value={notes} onChange={e => setNotes(e.target.value)} placeholder="opcjonalnie" />
      </div>

      {msg && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700">{msg}</div>}

      {selectedApt && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">Dostępne terminy</h3>
          {Object.keys(byDay).length === 0 && <div className="text-slate-400 text-sm">Brak wolnych slotów.</div>}
          <div className="space-y-4">
            {Object.entries(byDay).map(([day, dayslots]) => (
              <div key={day}>
                <div className="text-sm font-medium text-slate-600 mb-2">
                  {new Date(day).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dayslots.map(s => (
                    <button key={s} onClick={() => book(s)} disabled={busy}
                      className="px-3 py-2 border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50 rounded text-sm">
                      {s.slice(11, 16)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-500">
            🗓 Wybrane okna pochodzą z Google Calendar przypisanego kominiarza. Po rezerwacji event automatycznie wpadnie do jego kalendarza i otrzymasz potwierdzenie e-mailem.
          </div>
        </div>
      )}
    </div>
  );
}
