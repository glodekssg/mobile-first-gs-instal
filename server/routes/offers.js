import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { notifyProfile, notify } from '../services/notify.js';

const router = Router();
router.use(authRequired);

// Lista ofert (z danymi mieszkanie + budynek + target)
router.get('/', (req, res) => {
  const { role, sub } = req.user;
  if (role === 'kominiarz' || role === 'admin') {
    res.json(db.prepare(`
      SELECT o.*, p.full_name AS target_name, p.email AS target_email, p.phone AS target_phone,
             b.address, a.number AS apt_number
      FROM offers o
      LEFT JOIN profiles p ON p.id = o.target_profile_id
      LEFT JOIN buildings b ON b.id = o.building_id
      LEFT JOIN apartments a ON a.id = o.apartment_id
      ORDER BY o.created_at DESC
    `).all());
  } else {
    res.json(db.prepare(`
      SELECT o.*, b.address, a.number AS apt_number FROM offers o
      LEFT JOIN buildings b ON b.id = o.building_id
      LEFT JOIN apartments a ON a.id = o.apartment_id
      WHERE o.target_profile_id = ? ORDER BY o.created_at DESC
    `).all(sub));
  }
});

// Single offer
router.get('/:id', (req, res) => {
  const o = db.prepare(`
    SELECT o.*, p.full_name AS target_name, p.email AS target_email, p.phone AS target_phone,
           b.address, b.city, a.number AS apt_number, v.scheduled_at AS source_visit_date
    FROM offers o
    LEFT JOIN profiles p ON p.id = o.target_profile_id
    LEFT JOIN buildings b ON b.id = o.building_id
    LEFT JOIN apartments a ON a.id = o.apartment_id
    LEFT JOIN visits v ON v.id = o.source_visit_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(o);
});

// Stwórz ofertę. Jeśli auto_send → wysyła powiadomienie. Inaczej status='draft'.
router.post('/', requireRole('kominiarz', 'admin'), (req, res) => {
  const { target_profile_id, building_id, apartment_id, service_type, title, description, price_pln, auto_send = true, custom_message } = req.body || {};
  if (!service_type || !title) return res.status(400).json({ error: 'service_type i title wymagane' });

  // Jeśli mieszkanie ma rezydenta a target nie podano — przypisz automatycznie
  let resolvedTarget = target_profile_id || null;
  if (!resolvedTarget && apartment_id) {
    const apt = db.prepare('SELECT resident_id FROM apartments WHERE id = ?').get(apartment_id);
    if (apt?.resident_id) resolvedTarget = apt.resident_id;
  }

  const status = (auto_send && resolvedTarget) ? 'wyslana' : 'draft';
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
  const info = db.prepare(`
    INSERT INTO offers (target_profile_id, building_id, apartment_id, service_type, title, description, price_pln, status, expires_at, sent_at, sent_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(resolvedTarget, building_id || null, apartment_id || null, service_type, title, description || null, price_pln || null,
        status, expires, status === 'wyslana' ? now.toISOString() : null, status === 'wyslana' ? 1 : 0);

  if (status === 'wyslana' && resolvedTarget) {
    const msg = custom_message ||
      `Mamy dla Pana/Pani propozycję: ${title} za ${price_pln} zł. ${description || ''} Zaloguj się do panelu, by zaakceptować lub odrzucić ofertę.`;
    notifyProfile(resolvedTarget, 'email', `Oferta: ${title}`, msg);
  }
  res.json({ id: info.lastInsertRowid, status });
});

// Edytuj
router.patch('/:id', requireRole('kominiarz', 'admin'), (req, res) => {
  const o = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Nie znaleziono' });
  if (o.status === 'zaakceptowana' || o.status === 'odrzucona') {
    return res.status(400).json({ error: 'Nie można edytować zdecydowanej oferty' });
  }
  const allowed = ['target_profile_id', 'building_id', 'apartment_id', 'service_type', 'title', 'description', 'price_pln', 'expires_at'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) {
    sets.push(`${k} = ?`);
    params.push(req.body[k] === '' ? null : req.body[k]);
  }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE offers SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// Wyślij / wyślij ponownie
router.post('/:id/send', requireRole('kominiarz', 'admin'), (req, res) => {
  const o = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Nie znaleziono' });
  if (!o.target_profile_id) return res.status(400).json({ error: 'Brak target_profile_id — wybierz odbiorcę' });

  const { custom_message, channel = 'email' } = req.body || {};
  const msg = custom_message ||
    `Mamy dla Pana/Pani propozycję: ${o.title} za ${o.price_pln} zł. ${o.description || ''}`;
  notifyProfile(o.target_profile_id, channel, `Oferta: ${o.title}`, msg);
  db.prepare(`UPDATE offers SET status='wyslana', sent_at=CURRENT_TIMESTAMP, sent_count = COALESCE(sent_count,0)+1 WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// Wyślij do email/telefon bez profilu (np. do anonimowego leada)
router.post('/:id/send-external', requireRole('kominiarz', 'admin'), (req, res) => {
  const o = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Nie znaleziono' });
  const { email, phone, custom_message } = req.body || {};
  if (!email && !phone) return res.status(400).json({ error: 'Podaj email lub telefon' });

  const msg = custom_message ||
    `GS Instal: Oferta ${o.title} za ${o.price_pln} zł. ${o.description || ''}. Skontaktuj się z nami żeby zaakceptować.`;
  if (email) notify({ channel: 'email', recipient: email, subject: `Oferta: ${o.title}`, body: msg });
  if (phone) notify({ channel: 'sms', recipient: phone, body: msg });
  db.prepare(`UPDATE offers SET status='wyslana', sent_at=CURRENT_TIMESTAMP, sent_count = COALESCE(sent_count,0)+1 WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// Anuluj
router.post('/:id/cancel', requireRole('kominiarz', 'admin'), (req, res) => {
  db.prepare("UPDATE offers SET status='odrzucona', decided_at=CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Mieszkaniec akceptuje
router.post('/:id/accept', (req, res) => {
  const o = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Brak oferty' });
  db.prepare("UPDATE offers SET status='zaakceptowana', decided_at=CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  const when = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, 'umowiona', ?, ?)
  `).run(o.building_id, o.apartment_id, kominiarz?.id, when,
        o.service_type === 'wklad' ? 'montaz_wkladu' : o.service_type === 'nasada' ? 'montaz_nasady' : 'kontrola',
        `Realizacja oferty #${o.id}: ${o.title}`, req.user?.sub || null);
  if (kominiarz) {
    notifyProfile(kominiarz.id, 'in_app', `Oferta zaakceptowana: ${o.title}`,
      `Oferta #${o.id} została zaakceptowana — utworzono wizytę realizacyjną.`);
  }
  res.json({ ok: true });
});

// Mieszkaniec odrzuca
router.post('/:id/reject', (req, res) => {
  db.prepare("UPDATE offers SET status='odrzucona', decided_at=CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// Delete (tylko admin)
router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM offers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
