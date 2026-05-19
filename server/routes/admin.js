import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);
router.use(requireRole('admin'));

function audit(actorId, action, target, payload) {
  db.prepare('INSERT INTO admin_audit (actor_id, action, target, payload) VALUES (?, ?, ?, ?)')
    .run(actorId, action, target || null, payload ? JSON.stringify(payload) : null);
}

// === USERS ===
router.get('/users', (req, res) => {
  const rows = db.prepare(`
    SELECT id, email, role, full_name, phone, uprawnienia, nr_uprawnien, oauth_provider, created_at,
           (google_cal_token IS NOT NULL) AS has_gcal
    FROM profiles ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

router.post('/users', (req, res) => {
  const { email, password, role, full_name, phone, uprawnienia, nr_uprawnien } = req.body || {};
  if (!email || !role || !full_name) return res.status(400).json({ error: 'email, role, full_name wymagane' });
  if (!['kominiarz', 'zarzadca', 'mieszkaniec', 'admin'].includes(role)) return res.status(400).json({ error: 'zła rola' });
  const exists = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email zajęty' });
  const hash = password ? bcrypt.hashSync(password, 10) : null;
  const info = db.prepare(`
    INSERT INTO profiles (email, password_hash, role, full_name, phone, uprawnienia, nr_uprawnien)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(email, hash, role, full_name, phone || null, uprawnienia || null, nr_uprawnien || null);
  audit(req.user.sub, 'user.create', `profile:${info.lastInsertRowid}`, { email, role });
  res.json({ id: info.lastInsertRowid });
});

router.patch('/users/:id', (req, res) => {
  const allowed = ['full_name', 'phone', 'role', 'uprawnienia', 'nr_uprawnien'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k]); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  audit(req.user.sub, 'user.update', `profile:${req.params.id}`, req.body);
  res.json({ ok: true });
});

router.post('/users/:id/reset-password', (req, res) => {
  const { password } = req.body || {};
  const newPwd = password || crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  const hash = bcrypt.hashSync(newPwd, 10);
  db.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  audit(req.user.sub, 'user.reset_password', `profile:${req.params.id}`);
  res.json({ new_password: newPwd });
});

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.sub) return res.status(400).json({ error: 'Nie możesz usunąć siebie' });
  db.prepare('DELETE FROM profiles WHERE id = ?').run(req.params.id);
  audit(req.user.sub, 'user.delete', `profile:${req.params.id}`);
  res.json({ ok: true });
});

// === MAGIC LINKS ===
router.post('/magic-links', (req, res) => {
  const { profile_id, apartment_id, full_name, phone, email, days = 30,
    slots_from, slots_to, allowed_services, suggested_services,
    slot_hour_from, slot_hour_to, slot_duration_min, slot_weekdays } = req.body || {};
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
    slots_from || null, slots_to || null,
    allowed_services ? JSON.stringify(allowed_services) : null,
    suggested_services ? JSON.stringify(suggested_services) : null,
    slot_hour_from ?? null,
    slot_hour_to ?? null,
    slot_duration_min || null,
    slot_weekdays ? JSON.stringify(slot_weekdays) : null,
  );
  audit(req.user.sub, 'magic_link.create', `link:${info.lastInsertRowid}`, { profile_id, apartment_id, slots_from, slots_to, allowed_services, slot_hour_from, slot_hour_to, slot_duration_min });
  res.json({ id: info.lastInsertRowid, token, url: `/p/${token}`, expires_at: expires });
});

router.get('/magic-links', (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.full_name AS profile_name, a.number AS apt_number, b.address
    FROM magic_links m
    LEFT JOIN profiles p ON p.id = m.profile_id
    LEFT JOIN apartments a ON a.id = m.apartment_id
    LEFT JOIN buildings b ON b.id = a.building_id
    ORDER BY m.created_at DESC LIMIT 100
  `).all();
  for (const r of rows) {
    try { r.allowed_services = r.allowed_services ? JSON.parse(r.allowed_services) : null; } catch {}
    try { r.suggested_services = r.suggested_services ? JSON.parse(r.suggested_services) : null; } catch {}
    try { r.slot_weekdays = r.slot_weekdays ? JSON.parse(r.slot_weekdays) : null; } catch {}
  }
  res.json(rows);
});

router.post('/magic-links/:id/revoke', (req, res) => {
  db.prepare('UPDATE magic_links SET revoked = 1 WHERE id = ?').run(req.params.id);
  audit(req.user.sub, 'magic_link.revoke', `link:${req.params.id}`);
  res.json({ ok: true });
});

// === AUDIT ===
router.get('/audit', (req, res) => {
  res.json(db.prepare(`
    SELECT a.*, p.full_name AS actor_name, p.email AS actor_email
    FROM admin_audit a LEFT JOIN profiles p ON p.id = a.actor_id
    ORDER BY a.created_at DESC LIMIT 200
  `).all());
});

// === STATS (system health) ===
router.get('/stats', (req, res) => {
  const stats = {
    users: db.prepare('SELECT role, COUNT(*) AS n FROM profiles GROUP BY role').all(),
    buildings: db.prepare('SELECT COUNT(*) AS n FROM buildings').get().n,
    visits: db.prepare('SELECT status, COUNT(*) AS n FROM visits GROUP BY status').all(),
    open_offers: db.prepare("SELECT COUNT(*) AS n FROM offers WHERE status='wyslana'").get().n,
    open_actions: db.prepare("SELECT COUNT(*) AS n FROM next_actions WHERE status='open'").get().n,
    open_leads: db.prepare("SELECT COUNT(*) AS n FROM leads WHERE status='new'").get().n,
    open_issues: db.prepare("SELECT COUNT(*) AS n FROM issues WHERE status='open'").get().n,
  };
  res.json(stats);
});

export default router;
