import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, c.name AS cooperative_name
    FROM buildings b LEFT JOIN cooperatives c ON c.id = b.cooperative_id
    ORDER BY b.address
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const b = db.prepare('SELECT * FROM buildings WHERE id = ?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Nie znaleziono' });
  const apartments = db.prepare(`
    SELECT a.*, p.full_name AS resident_name, p.email AS resident_email
    FROM apartments a LEFT JOIN profiles p ON p.id = a.resident_id
    WHERE a.building_id = ? ORDER BY a.number
  `).all(req.params.id);
  const chimneys = db.prepare('SELECT * FROM chimneys WHERE building_id = ?').all(req.params.id);
  const visits = db.prepare('SELECT * FROM visits WHERE building_id = ? ORDER BY scheduled_at DESC LIMIT 50')
    .all(req.params.id);
  res.json({ ...b, apartments, chimneys, visits });
});

router.post('/', requireRole('kominiarz', 'admin'), (req, res) => {
  const { cooperative_id, address, city, postal_code, type, apartments_count, notes } = req.body || {};
  if (!address) return res.status(400).json({ error: 'Adres wymagany' });
  const info = db.prepare(
    'INSERT INTO buildings (cooperative_id, address, city, postal_code, type, apartments_count, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(cooperative_id || null, address, city || null, postal_code || null, type || 'wielorodzinny', apartments_count || 1, notes || null);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/:id', requireRole('kominiarz', 'admin'), (req, res) => {
  const allowed = ['cooperative_id', 'address', 'city', 'postal_code', 'type', 'apartments_count', 'notes'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k] || null); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE buildings SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM buildings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
