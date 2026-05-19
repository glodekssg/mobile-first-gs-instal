import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, COUNT(b.id) AS buildings_count
    FROM cooperatives c
    LEFT JOIN buildings b ON b.cooperative_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const coop = db.prepare('SELECT * FROM cooperatives WHERE id = ?').get(req.params.id);
  if (!coop) return res.status(404).json({ error: 'Nie znaleziono' });
  const buildings = db.prepare('SELECT * FROM buildings WHERE cooperative_id = ?').all(req.params.id);
  res.json({ ...coop, buildings });
});

router.post('/', requireRole('kominiarz', 'admin'), (req, res) => {
  const { name, nip, address, contact_id } = req.body || {};
  const info = db.prepare('INSERT INTO cooperatives (name, nip, address, contact_id) VALUES (?, ?, ?, ?)')
    .run(name, nip || null, address || null, contact_id || null);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/:id', requireRole('kominiarz', 'admin'), (req, res) => {
  const allowed = ['name', 'nip', 'address', 'contact_id'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k] || null); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE cooperatives SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('UPDATE buildings SET cooperative_id = NULL WHERE cooperative_id = ?').run(req.params.id);
  db.prepare('DELETE FROM cooperatives WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Status kontroli per obiekt (dla panelu zarządcy)
router.get('/:id/status', (req, res) => {
  const rows = db.prepare(`
    SELECT b.id AS building_id, b.address, b.apartments_count,
           (SELECT MIN(c.last_inspection) FROM chimneys c WHERE c.building_id = b.id) AS oldest_inspection,
           (SELECT COUNT(*) FROM chimneys c WHERE c.building_id = b.id) AS chimneys_count,
           (SELECT COUNT(*) FROM visits v WHERE v.building_id = b.id AND v.status='zakonczona') AS visits_done,
           (SELECT COUNT(*) FROM visits v WHERE v.building_id = b.id AND v.status='umowiona') AS visits_scheduled
    FROM buildings b WHERE b.cooperative_id = ?
  `).all(req.params.id);
  res.json(rows);
});

export default router;
