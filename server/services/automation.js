// Automatyczne akcje uruchamiane cron-em
import db from '../db/index.js';
import { notifyProfile } from './notify.js';
import { runNBA } from './nba.js';

export function runAutomation() {
  const logs = [];

  // 1. 3 dni przed wizytą → SMS przypomnienie
  const upcoming = db.prepare(`
    SELECT v.*, a.resident_id, b.address, a.number AS apt_number
    FROM visits v
    LEFT JOIN apartments a ON a.id = v.apartment_id
    LEFT JOIN buildings b ON b.id = v.building_id
    WHERE v.status = 'umowiona'
      AND julianday(v.scheduled_at) - julianday('now') BETWEEN 2.9 AND 3.1
  `).all();
  for (const v of upcoming) {
    if (v.resident_id) {
      notifyProfile(v.resident_id, 'sms', null,
        `GS Instal: przypominamy o wizycie kominiarskiej ${new Date(v.scheduled_at).toLocaleString('pl-PL')} pod adresem ${v.address}.`);
      logs.push(`reminder-3d v#${v.id}`);
    }
  }

  // 2. W dniu wizyty rano (08:00) → SMS "kominiarz dziś przyjdzie"
  const today = db.prepare(`
    SELECT v.*, a.resident_id, b.address
    FROM visits v
    LEFT JOIN apartments a ON a.id = v.apartment_id
    LEFT JOIN buildings b ON b.id = v.building_id
    WHERE v.status = 'umowiona' AND date(v.scheduled_at) = date('now')
  `).all();
  for (const v of today) {
    if (v.resident_id) {
      notifyProfile(v.resident_id, 'sms', null,
        `GS Instal: dziś o ${new Date(v.scheduled_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} odwiedzi Państwa kominiarz.`);
      logs.push(`reminder-today v#${v.id}`);
    }
  }

  // 3. NBA refresh
  runNBA();

  // 4. Oferty wygasłe
  db.prepare("UPDATE offers SET status='wygasla' WHERE status='wyslana' AND expires_at < datetime('now')").run();

  db.prepare("INSERT INTO automation_log (rule_name, outcome) VALUES (?, ?)").run('automation', logs.join(', ') || 'nic do zrobienia');
  return logs;
}
