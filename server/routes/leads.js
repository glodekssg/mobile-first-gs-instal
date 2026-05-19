import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { notifyProfile } from '../services/notify.js';

const router = Router();

// PUBLIC — formularz "Umów się" na stronie głównej
router.post('/public', (req, res) => {
  const { full_name, phone, email, service_type, message } = req.body || {};
  if (!full_name || !phone) return res.status(400).json({ error: 'Imię i telefon są wymagane' });
  const info = db.prepare(`
    INSERT INTO leads (full_name, phone, email, service_type, message, source)
    VALUES (?, ?, ?, ?, ?, 'public_form')
  `).run(full_name, phone, email || null, service_type || null, message || null);

  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  if (kominiarz) {
    notifyProfile(kominiarz.id, 'in_app', `Nowe zapytanie: ${full_name}`,
      `Telefon: ${phone}. Usługa: ${service_type || '—'}. ${message || ''}`);
  }
  res.json({ id: info.lastInsertRowid, ok: true });
});

router.use(authRequired);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all());
});

router.patch('/:id', (req, res) => {
  const fields = ['status', 'notes', 'assigned_to'];
  const sets = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// Konwersja leada do klienta + opcjonalnie umówienie wizyty
router.post('/:id/convert', async (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead nie znaleziony' });
  const { create_account = true, apartment_id, schedule_visit, visit_type = 'kontrola', visit_when } = req.body || {};

  let profile_id = null;
  if (create_account && lead.email) {
    const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(lead.email);
    if (existing) {
      profile_id = existing.id;
    } else {
      const tempPwd = (await import('node:crypto')).default.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
      const bcrypt = (await import('bcryptjs')).default;
      const hash = bcrypt.hashSync(tempPwd, 10);
      const info = db.prepare(`
        INSERT INTO profiles (email, password_hash, role, full_name, phone)
        VALUES (?, ?, 'mieszkaniec', ?, ?)
      `).run(lead.email, hash, lead.full_name, lead.phone || null);
      profile_id = info.lastInsertRowid;
      // wyślij hasło notyfikacją
      notifyProfile(profile_id, 'email', 'Twoje konto w GS Instal',
        `Witaj ${lead.full_name}! Twoje konto zostało utworzone. Login: ${lead.email}, hasło tymczasowe: ${tempPwd} — zmień je po zalogowaniu.`);
    }
  }

  if (profile_id && apartment_id) {
    db.prepare('UPDATE apartments SET resident_id = ? WHERE id = ?').run(profile_id, apartment_id);
  }

  let visit_id = null;
  if (schedule_visit && visit_when) {
    const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
    const apt = apartment_id ? db.prepare('SELECT building_id FROM apartments WHERE id = ?').get(apartment_id) : null;
    if (apt) {
      const info = db.prepare(`
        INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, notes, created_by)
        VALUES (?, ?, ?, ?, ?, 'umowiona', ?, ?)
      `).run(apt.building_id, apartment_id, kominiarz?.id, visit_when, visit_type,
            `Konwersja leada #${lead.id}: ${lead.full_name}`, req.user.sub);
      visit_id = info.lastInsertRowid;
    }
  }

  db.prepare(`UPDATE leads SET status='converted', notes = COALESCE(notes,'') || ' [skonwertowano]' WHERE id = ?`).run(lead.id);
  res.json({ profile_id, apartment_id: apartment_id || null, visit_id });
});

// Wyślij wiadomość do leada (email/SMS mock)
router.post('/:id/contact', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead nie znaleziony' });
  const { channel = 'email', subject = 'GS Instal — w sprawie zapytania', body } = req.body || {};
  if (!body) return res.status(400).json({ error: 'Treść wymagana' });
  const recipient = channel === 'sms' ? lead.phone : lead.email;
  if (!recipient) return res.status(400).json({ error: `Brak ${channel === 'sms' ? 'telefonu' : 'emaila'} u leada` });
  db.prepare(`INSERT INTO notifications (channel, recipient, subject, body) VALUES (?, ?, ?, ?)`)
    .run(channel, recipient, subject, body);
  db.prepare(`UPDATE leads SET status='contacted' WHERE id = ? AND status='new'`).run(lead.id);
  res.json({ ok: true });
});

export default router;
