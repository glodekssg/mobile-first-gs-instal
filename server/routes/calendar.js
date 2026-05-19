import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

// Mock połączenie Google Calendar — w realu redirect na OAuth Google
router.post('/connect-google', requireRole('kominiarz', 'admin'), (req, res) => {
  const token = `mock_gcal_${Date.now()}`;
  db.prepare('UPDATE profiles SET google_cal_token = ? WHERE id = ?').run(token, req.user.sub);
  res.json({ connected: true, mocked: true });
});

router.post('/disconnect', requireRole('kominiarz', 'admin'), (req, res) => {
  db.prepare('UPDATE profiles SET google_cal_token = NULL WHERE id = ?').run(req.user.sub);
  res.json({ disconnected: true });
});

router.get('/status', (req, res) => {
  const p = db.prepare('SELECT google_cal_token FROM profiles WHERE id = ?').get(req.user.sub);
  res.json({ connected: !!p?.google_cal_token });
});

export default router;
