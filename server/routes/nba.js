import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { runNBA } from '../services/nba.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const role = req.user.role;
  const rows = db.prepare(`
    SELECT n.*, b.address AS building_address, a.number AS apt_number
    FROM next_actions n
    LEFT JOIN buildings b ON b.id = n.related_building_id
    LEFT JOIN apartments a ON a.id = n.related_apartment_id
    WHERE n.status = 'open' AND (n.target_role = ? OR n.target_profile_id = ?)
    ORDER BY n.priority ASC, n.created_at DESC
    LIMIT 50
  `).all(role, req.user.sub);
  res.json(rows);
});

router.post('/run', (req, res) => {
  const n = runNBA();
  res.json({ open: n });
});

router.post('/:id/done', (req, res) => {
  db.prepare("UPDATE next_actions SET status='done' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post('/:id/dismiss', (req, res) => {
  db.prepare("UPDATE next_actions SET status='dismissed' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
