// Silnik wolnych slotów (mock Google Calendar)
import db from '../db/index.js';

const DEFAULTS = {
  workStart: 8,
  workEnd: 16,
  slotMin: 60,
  weekdays: [1, 2, 3, 4, 5],  // pon-pt (1=pon, 7=nd)
  daysAhead: 30,
};

export function generateSlots(kominiarzId, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const slots = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const existing = db.prepare(`
    SELECT scheduled_at, duration_min FROM visits
    WHERE kominiarz_id = ? AND status IN ('umowiona','w_trakcie','nowa')
      AND scheduled_at >= ?
  `).all(kominiarzId, now.toISOString());

  // Mapa zajętych przedziałów (ISO start + duration → blokuje overlap)
  const busy = existing.map(v => {
    const start = new Date(v.scheduled_at);
    const end = new Date(start.getTime() + (v.duration_min || 60) * 60000);
    return { start, end };
  });

  function isBusy(slotStart, slotEnd) {
    return busy.some(b => slotStart < b.end && slotEnd > b.start);
  }

  for (let d = 1; d <= cfg.daysAhead; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() + d);
    // weekday 0=ndz, 1=pon, ... 6=sob → przekształć na 1=pon..7=ndz
    const wday = day.getDay() === 0 ? 7 : day.getDay();
    if (!cfg.weekdays.includes(wday)) continue;

    for (let h = cfg.workStart; h + (cfg.slotMin / 60) <= cfg.workEnd; h += cfg.slotMin / 60) {
      const slotStart = new Date(day);
      slotStart.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
      if (slotStart < now) continue;
      const slotEnd = new Date(slotStart.getTime() + cfg.slotMin * 60000);
      if (isBusy(slotStart, slotEnd)) continue;
      slots.push(slotStart.toISOString());
    }
  }
  return slots.slice(0, 40);
}
