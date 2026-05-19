// Generowanie magic-linków dla kominiarza i admina (z zaawansowanymi opcjami)
import { Router } from 'express';
import crypto from 'node:crypto';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { notify, notifyProfile } from '../services/notify.js';

const router = Router();
router.use(authRequired);
router.use(requireRole('kominiarz', 'admin'));

router.post('/', (req, res) => {
  const {
    profile_id, apartment_id, full_name, phone, email,
    days = 30, send = true,
    slots_from, slots_to, allowed_services, suggested_services,
    slot_hour_from, slot_hour_to, slot_duration_min, slot_weekdays,
  } = req.body || {};
  if (!apartment_id && !profile_id && !email && !phone) {
    return res.status(400).json({ error: 'Podaj apartment_id, profile_id, email lub phone' });
  }
  const token = crypto.randomBytes(24).toString('base64url');
  const expires = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
  const info = db.prepare(`
    INSERT INTO magic_links
      (token, profile_id, apartment_id, full_name, phone, email, expires_at, created_by,
       slots_from, slots_to, allowed_services, suggested_services,
       slot_hour_from, slot_hour_to, slot_duration_min, slot_weekdays)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    token, profile_id || null, apartment_id || null, full_name || null, phone || null, email || null,
    expires, req.user.sub,
    slots_from || null,
    slots_to || null,
    allowed_services ? JSON.stringify(allowed_services) : null,
    suggested_services ? JSON.stringify(suggested_services) : null,
    slot_hour_from ?? null,
    slot_hour_to ?? null,
    slot_duration_min || null,
    slot_weekdays ? JSON.stringify(slot_weekdays) : null,
  );

  const url = `/p/${token}`;

  if (send) {
    if (profile_id) {
      notifyProfile(profile_id, 'sms', null,
        `GS Instal: zarządzaj swoimi wizytami bez logowania pod adresem ${url}`);
    } else if (email) {
      notify({ channel: 'email', recipient: email, subject: 'Twój link do panelu GS Instal',
        body: `Witaj ${full_name || ''}! Twój prywatny link: ${url}` });
    } else if (phone) {
      notify({ channel: 'sms', recipient: phone, body: `GS Instal: zarządzaj wizytami: ${url}` });
    }
  }

  res.json({ id: info.lastInsertRowid, token, url, expires_at: expires });
});

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.full_name AS profile_name, a.number AS apt_number, b.address
    FROM magic_links m
    LEFT JOIN profiles p ON p.id = m.profile_id
    LEFT JOIN apartments a ON a.id = m.apartment_id
    LEFT JOIN buildings b ON b.id = a.building_id
    ORDER BY m.created_at DESC LIMIT 100
  `).all();
  // Parsuj JSONy
  for (const r of rows) {
    try { r.allowed_services = r.allowed_services ? JSON.parse(r.allowed_services) : null; } catch {}
    try { r.suggested_services = r.suggested_services ? JSON.parse(r.suggested_services) : null; } catch {}
    try { r.slot_weekdays = r.slot_weekdays ? JSON.parse(r.slot_weekdays) : null; } catch {}
  }
  res.json(rows);
});

router.post('/:id/revoke', (req, res) => {
  db.prepare('UPDATE magic_links SET revoked = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
