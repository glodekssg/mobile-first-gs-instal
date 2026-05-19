import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { runAutomation } from '../services/automation.js';

const router = Router();
router.use(authRequired);

router.get('/log', (req, res) => {
  res.json(db.prepare('SELECT * FROM automation_log ORDER BY created_at DESC LIMIT 100').all());
});

router.post('/run', (req, res) => {
  const out = runAutomation();
  res.json({ executed: out });
});

router.get('/notifications', (req, res) => {
  res.json(db.prepare(`
    SELECT * FROM notifications
    WHERE profile_id = ? OR recipient = ?
    ORDER BY created_at DESC LIMIT 100
  `).all(req.user.sub, req.user.email));
});

router.get('/notifications/me/count', (req, res) => {
  const r = db.prepare(`
    SELECT COUNT(*) AS n FROM notifications
    WHERE (profile_id = ? OR recipient = ?) AND read_at IS NULL
  `).get(req.user.sub, req.user.email);
  res.json({ unread: r.n });
});

router.post('/notifications/mark-read', (req, res) => {
  db.prepare(`
    UPDATE notifications SET read_at = CURRENT_TIMESTAMP
    WHERE (profile_id = ? OR recipient = ?) AND read_at IS NULL
  `).run(req.user.sub, req.user.email);
  res.json({ ok: true });
});

export default router;
