import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  res.json(db.prepare(`
    SELECT c.*, b.address AS building_address, a.number AS apt_number
    FROM chimneys c
    LEFT JOIN buildings b ON b.id = c.building_id
    LEFT JOIN apartments a ON a.id = c.apartment_id
    ORDER BY b.address, a.number, c.kind
  `).all());
});

router.get('/building/:bid', (req, res) => {
  res.json(db.prepare('SELECT * FROM chimneys WHERE building_id = ?').all(req.params.bid));
});

router.post('/', requireRole('kominiarz', 'admin'), (req, res) => {
  const { building_id, apartment_id, kind, fuel, device, material, length_m, installed_year, has_nasada, has_wklad, last_inspection, last_cleaning } = req.body || {};
  if (!building_id || !kind) return res.status(400).json({ error: 'building_id i kind wymagane' });
  const info = db.prepare(`
    INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, length_m, installed_year, has_nasada, has_wklad, last_inspection, last_cleaning)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(building_id, apartment_id || null, kind, fuel || null, device || null, material || null, length_m || null, installed_year || null, has_nasada ? 1 : 0, has_wklad ? 1 : 0, last_inspection || null, last_cleaning || null);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/:id', requireRole('kominiarz', 'admin'), (req, res) => {
  const allowed = ['apartment_id', 'kind', 'fuel', 'device', 'material', 'length_m', 'installed_year', 'has_nasada', 'has_wklad', 'last_inspection', 'last_cleaning', 'notes'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) {
    sets.push(`${k} = ?`);
    let v = req.body[k];
    if (k === 'has_nasada' || k === 'has_wklad') v = v ? 1 : 0;
    params.push(v === '' ? null : v);
  }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE chimneys SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM chimneys WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
