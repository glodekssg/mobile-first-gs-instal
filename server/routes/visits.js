import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { generateSlots } from '../services/slots.js';
import { notifyProfile } from '../services/notify.js';

const router = Router();
router.use(authRequired);

// Lista wizyt — filtrowana per rola
router.get('/', (req, res) => {
  const { role, sub } = req.user;
  let rows;
  if (role === 'kominiarz' || role === 'admin') {
    rows = db.prepare(`
      SELECT v.*, b.address AS building_address, a.number AS apt_number, p.full_name AS resident_name
      FROM visits v
      LEFT JOIN buildings b ON b.id = v.building_id
      LEFT JOIN apartments a ON a.id = v.apartment_id
      LEFT JOIN profiles p ON p.id = a.resident_id
      WHERE (v.kominiarz_id = ? OR v.kominiarz_id IS NULL)
      ORDER BY v.scheduled_at
    `).all(sub);
  } else if (role === 'zarzadca') {
    rows = db.prepare(`
      SELECT v.*, b.address AS building_address, a.number AS apt_number
      FROM visits v
      JOIN buildings b ON b.id = v.building_id
      JOIN cooperatives c ON c.id = b.cooperative_id
      LEFT JOIN apartments a ON a.id = v.apartment_id
      WHERE c.contact_id = ? ORDER BY v.scheduled_at DESC
    `).all(sub);
  } else {
    rows = db.prepare(`
      SELECT v.*, b.address AS building_address, a.number AS apt_number
      FROM visits v
      JOIN apartments a ON a.id = v.apartment_id
      JOIN buildings b ON b.id = v.building_id
      WHERE a.resident_id = ? ORDER BY v.scheduled_at DESC
    `).all(sub);
  }
  res.json(rows);
});

// Dostępne sloty dla mieszkańca (per kominiarz przypisany do rejonu/obiektu)
router.get('/slots/:apartmentId', (req, res) => {
  const apt = db.prepare('SELECT building_id FROM apartments WHERE id = ?').get(req.params.apartmentId);
  if (!apt) return res.status(404).json({ error: 'Nie znaleziono lokalu' });
  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  if (!kominiarz) return res.json({ slots: [] });
  res.json({ slots: generateSlots(kominiarz.id), kominiarz_id: kominiarz.id });
});

// Mieszkaniec rezerwuje slot
router.post('/book', (req, res) => {
  const { apartment_id, scheduled_at, type, kominiarz_id, notes } = req.body || {};
  const apt = db.prepare('SELECT * FROM apartments WHERE id = ?').get(apartment_id);
  if (!apt) return res.status(404).json({ error: 'Nie ma lokalu' });
  if (req.user.role === 'mieszkaniec' && apt.resident_id !== req.user.sub) {
    return res.status(403).json({ error: 'To nie Twoje mieszkanie' });
  }
  const info = db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, 'umowiona', ?, ?)
  `).run(apt.building_id, apartment_id, kominiarz_id, scheduled_at, type || 'kontrola', notes || null, req.user.sub);

  // mock GCal event id
  db.prepare("UPDATE visits SET gcal_event_id = ? WHERE id = ?")
    .run(`gcal_mock_${info.lastInsertRowid}`, info.lastInsertRowid);

  // powiadom kominiarza i mieszkańca
  notifyProfile(kominiarz_id, 'in_app', 'Nowa wizyta', `Wizyta umówiona na ${scheduled_at}`);
  if (apt.resident_id) {
    notifyProfile(apt.resident_id, 'email', 'Potwierdzenie wizyty',
      `Twoja wizyta kominiarska została zaplanowana na ${new Date(scheduled_at).toLocaleString('pl-PL')}`);
  }
  res.json({ id: info.lastInsertRowid });
});

// Kominiarz tworzy wizytę
router.post('/', requireRole('kominiarz', 'admin'), (req, res) => {
  const { building_id, apartment_id, scheduled_at, type, notes, duration_min } = req.body || {};
  const info = db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, duration_min, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(building_id, apartment_id || null, req.user.sub, scheduled_at, type, duration_min || 60, notes || null, req.user.sub);
  res.json({ id: info.lastInsertRowid });
});

// Zmiana statusu / zakończenie z protokołem
router.post('/:id/complete', requireRole('kominiarz', 'admin'), (req, res) => {
  const { result, findings, recommendations } = req.body || {};
  const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(req.params.id);
  if (!visit) return res.status(404).json({ error: 'Nie ma wizyty' });

  db.prepare("UPDATE visits SET status='zakonczona', completed_at=CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.id);

  const me = db.prepare('SELECT full_name, nr_uprawnien FROM profiles WHERE id = ?').get(req.user.sub);
  db.prepare(`
    INSERT INTO protocols (visit_id, result, findings, recommendations, signed_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, result, findings || null, recommendations || null,
        `${me.full_name}${me.nr_uprawnien ? ' (nr upr. ' + me.nr_uprawnien + ')' : ''}`);

  // jeśli usterka → wygeneruj ofertę upsell
  if (result === 'nieszczelny' || result === 'niesprawny' || /wkład|nasada|inspekcj/i.test(findings || '')) {
    const apt = db.prepare('SELECT resident_id FROM apartments WHERE id = ?').get(visit.apartment_id);
    db.prepare(`
      INSERT INTO offers (target_profile_id, building_id, apartment_id, source_visit_id, service_type, title, description, price_pln, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      apt?.resident_id || null,
      visit.building_id,
      visit.apartment_id,
      visit.id,
      'wklad',
      'Wymiana wkładu kominowego',
      `Podczas kontroli wykryto: ${findings || 'usterkę wymagającą napraw'}. Rekomendujemy wymianę wkładu.`,
      2800,
      new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    );
  }

  res.json({ ok: true });
});

// Mieszkaniec odwołuje
router.post('/:id/cancel', (req, res) => {
  db.prepare("UPDATE visits SET status='odwolana' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Kominiarz: odmowa wpuszczenia
router.post('/:id/refused', requireRole('kominiarz', 'admin'), (req, res) => {
  db.prepare("UPDATE visits SET status='odmowa_wpuszczenia', completed_at=CURRENT_TIMESTAMP WHERE id = ?")
    .run(req.params.id);
  res.json({ ok: true });
});

// Kominiarz/admin: edycja wizyty (data, typ, notes, kominiarz_id, duration)
router.patch('/:id', requireRole('kominiarz', 'admin'), (req, res) => {
  const allowed = ['scheduled_at', 'type', 'notes', 'kominiarz_id', 'duration_min', 'building_id', 'apartment_id', 'status'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k]); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE visits SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  // powiadom mieszkańca o zmianie
  const v = db.prepare('SELECT v.*, a.resident_id FROM visits v LEFT JOIN apartments a ON a.id = v.apartment_id WHERE v.id = ?').get(req.params.id);
  if (v?.resident_id) {
    notifyProfile(v.resident_id, 'email', 'Zmiana terminu wizyty',
      `Twoja wizyta kominiarska została zaktualizowana. Nowy termin: ${new Date(v.scheduled_at).toLocaleString('pl-PL')}`);
  }
  res.json({ ok: true });
});

// Detail dla mieszkańca — z danymi kominiarza
router.get('/:id', (req, res) => {
  const v = db.prepare(`
    SELECT v.*, b.address AS building_address, b.city, a.number AS apt_number, a.resident_id,
           p.full_name AS kominiarz_name, p.phone AS kominiarz_phone, p.email AS kominiarz_email,
           p.nr_uprawnien
    FROM visits v
    LEFT JOIN buildings b ON b.id = v.building_id
    LEFT JOIN apartments a ON a.id = v.apartment_id
    LEFT JOIN profiles p ON p.id = v.kominiarz_id
    WHERE v.id = ?
  `).get(req.params.id);
  if (!v) return res.status(404).json({ error: 'Nie znaleziono' });
  // mieszkaniec widzi tylko swoje
  if (req.user && req.user.role === 'mieszkaniec' && v.resident_id !== req.user.sub) {
    return res.status(403).json({ error: 'Brak dostępu' });
  }
  res.json(v);
});

export default router;
