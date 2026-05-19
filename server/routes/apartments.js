import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, b.address AS building_address, b.city, p.full_name AS resident_name
    FROM apartments a
    JOIN buildings b ON b.id = a.building_id
    LEFT JOIN profiles p ON p.id = a.resident_id
    ORDER BY b.address, a.number
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { building_id, number, floor } = req.body || {};
  if (!building_id || !number) return res.status(400).json({ error: 'building_id i number wymagane' });
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  const info = db.prepare(
    'INSERT INTO apartments (building_id, number, floor, resident_invite_code) VALUES (?, ?, ?, ?)'
  ).run(building_id, number, floor || null, code);
  res.json({ id: info.lastInsertRowid, invite_code: code });
});

router.patch('/:id', (req, res) => {
  const allowed = ['number', 'floor', 'resident_id'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k] || null); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE apartments SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.post('/:id/regenerate-code', (req, res) => {
  const code = Math.random().toString(36).slice(2, 10).toUpperCase();
  db.prepare('UPDATE apartments SET resident_invite_code = ?, resident_id = NULL WHERE id = ?').run(code, req.params.id);
  res.json({ invite_code: code });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM apartments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Mieszkaniec łączy konto z mieszkaniem przez kod
router.post('/claim', (req, res) => {
  const { invite_code } = req.body || {};
  const apt = db.prepare('SELECT * FROM apartments WHERE resident_invite_code = ?').get(invite_code);
  if (!apt) return res.status(404).json({ error: 'Nieprawidłowy kod' });
  if (apt.resident_id && apt.resident_id !== req.user.sub) {
    return res.status(409).json({ error: 'Mieszkanie już przypisane' });
  }
  db.prepare('UPDATE apartments SET resident_id = ? WHERE id = ?').run(req.user.sub, apt.id);
  res.json({ ok: true, apartment_id: apt.id });
});

// Mieszkaniec — moje mieszkania
router.get('/mine', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, b.address AS building_address, b.city, c.name AS cooperative_name
    FROM apartments a
    JOIN buildings b ON b.id = a.building_id
    LEFT JOIN cooperatives c ON c.id = b.cooperative_id
    WHERE a.resident_id = ?
  `).all(req.user.sub);
  res.json(rows);
});

export default router;
