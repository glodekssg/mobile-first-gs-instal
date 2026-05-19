// Współdzielony edytor konfiguracji slotów dla magic linków
const WEEKDAYS = [
  { v: 1, l: 'Pn' },
  { v: 2, l: 'Wt' },
  { v: 3, l: 'Śr' },
  { v: 4, l: 'Cz' },
  { v: 5, l: 'Pt' },
  { v: 6, l: 'Sb' },
  { v: 7, l: 'Nd' },
];

export default function SlotConfigEditor({ form, setForm }) {
  function toggleDay(d) {
    const cur = form.slot_weekdays || [];
    const next = cur.includes(d) ? cur.filter(x => x !== d) : [...cur, d].sort();
    setForm(f => ({ ...f, slot_weekdays: next }));
  }

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="text-sm font-medium text-slate-700">⏰ Konfiguracja slotów (godziny, długość, dni)</div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Godziny od – do (np. 8 → 16)</label>
        <div className="flex items-center gap-2">
          <input type="number" min="0" max="23" step="1"
            className="w-20 border rounded p-2 text-sm" placeholder="8"
            value={form.slot_hour_from ?? ''}
            onChange={e => setForm(f => ({ ...f, slot_hour_from: e.target.value === '' ? null : Number(e.target.value) }))} />
          <span className="text-slate-400">–</span>
          <input type="number" min="0" max="23" step="1"
            className="w-20 border rounded p-2 text-sm" placeholder="16"
            value={form.slot_hour_to ?? ''}
            onChange={e => setForm(f => ({ ...f, slot_hour_to: e.target.value === '' ? null : Number(e.target.value) }))} />
          <span className="text-xs text-slate-400">puste = 8–16</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Długość pojedynczej wizyty</label>
        <select className="w-full border rounded p-2 text-sm"
          value={form.slot_duration_min || ''}
          onChange={e => setForm(f => ({ ...f, slot_duration_min: e.target.value === '' ? null : Number(e.target.value) }))}>
          <option value="">domyślnie (60 min)</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">60 min (1 godz.)</option>
          <option value="90">90 min</option>
          <option value="120">120 min (2 godz.)</option>
          <option value="180">180 min (3 godz.)</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-600 block mb-1">Dni tygodnia</label>
        <div className="flex gap-1.5 flex-wrap">
          {WEEKDAYS.map(d => {
            const active = (form.slot_weekdays || []).includes(d.v);
            return (
              <button key={d.v} type="button" onClick={() => toggleDay(d.v)}
                className={`px-3 py-1.5 text-xs rounded border-2 ${active
                  ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                  : 'border-slate-200 hover:border-orange-300'}`}>
                {d.l}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {!form.slot_weekdays || form.slot_weekdays.length === 0 ? 'puste = poniedziałek–piątek' : `${form.slot_weekdays.length} dni wybranych`}
        </div>
      </div>
    </div>
  );
}
