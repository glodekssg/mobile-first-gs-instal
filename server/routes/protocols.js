import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

router.get('/visit/:vid', (req, res) => {
  const p = db.prepare(`
    SELECT p.*, v.type AS visit_type, v.scheduled_at, b.address, a.number AS apt_number
    FROM protocols p
    JOIN visits v ON v.id = p.visit_id
    LEFT JOIN buildings b ON b.id = v.building_id
    LEFT JOIN apartments a ON a.id = v.apartment_id
    WHERE p.visit_id = ?
  `).get(req.params.vid);
  if (!p) return res.status(404).json({ error: 'Brak protokołu' });
  res.json(p);
});

router.get('/mine', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, v.scheduled_at, v.type AS visit_type, b.address, a.number AS apt_number
    FROM protocols p
    JOIN visits v ON v.id = p.visit_id
    JOIN apartments a ON a.id = v.apartment_id
    JOIN buildings b ON b.id = v.building_id
    WHERE a.resident_id = ?
    ORDER BY p.signed_at DESC
  `).all(req.user.sub);
  res.json(rows);
});

export default router;
