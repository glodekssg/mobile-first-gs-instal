import { Router } from 'express';
import db from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { notifyProfile } from '../services/notify.js';

const router = Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const role = req.user.role;
  if (role === 'mieszkaniec') {
    res.json(db.prepare('SELECT * FROM issues WHERE reporter_id = ? ORDER BY created_at DESC').all(req.user.sub));
  } else {
    res.json(db.prepare(`
      SELECT i.*, b.address, a.number AS apt_number, p.full_name AS reporter_name,
             p.email AS reporter_email, p.phone AS reporter_phone,
             v.scheduled_at AS visit_date, k.full_name AS assigned_to_name
      FROM issues i
      LEFT JOIN apartments a ON a.id = i.apartment_id
      LEFT JOIN buildings b ON b.id = i.building_id
      LEFT JOIN profiles p ON p.id = i.reporter_id
      LEFT JOIN visits v ON v.id = i.visit_id
      LEFT JOIN profiles k ON k.id = i.assigned_to
      ORDER BY i.created_at DESC
    `).all());
  }
});

router.post('/', (req, res) => {
  const { apartment_id, title, description, severity } = req.body || {};
  const apt = apartment_id ? db.prepare('SELECT building_id FROM apartments WHERE id = ?').get(apartment_id) : null;
  const info = db.prepare(`
    INSERT INTO issues (reporter_id, apartment_id, building_id, title, description, severity)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.sub, apartment_id || null, apt?.building_id || null, title, description || null, severity || 'normal');
  res.json({ id: info.lastInsertRowid });
});

router.patch('/:id', (req, res) => {
  if (req.user.role === 'mieszkaniec') return res.status(403).json({ error: 'Brak uprawnień' });
  const allowed = ['status', 'severity', 'description', 'internal_notes', 'visit_id', 'assigned_to'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) {
    sets.push(`${k} = ?`);
    params.push(req.body[k] === '' ? null : req.body[k]);
  }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.params.id);
  db.prepare(`UPDATE issues SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

// Odpowiedz na zgłoszenie — notyfikacja do reportera
router.post('/:id/reply', (req, res) => {
  if (req.user.role === 'mieszkaniec') return res.status(403).json({ error: 'Brak uprawnień' });
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Nie znaleziono' });
  const { message, channel = 'email' } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Treść wiadomości wymagana' });

  if (issue.reporter_id) {
    notifyProfile(issue.reporter_id, channel, `Re: ${issue.title}`,
      `Otrzymaliśmy Twoje zgłoszenie. Odpowiedź:\n\n${message}`);
  }
  // doklej do internal_notes z timestampem
  const author = db.prepare('SELECT full_name FROM profiles WHERE id = ?').get(req.user.sub);
  const stamp = new Date().toISOString().slice(0, 16);
  const append = `[${stamp} odpowiedź od ${author?.full_name || '?'}]: ${message}`;
  db.prepare(`UPDATE issues SET internal_notes = COALESCE(internal_notes || char(10), '') || ? WHERE id = ?`)
    .run(append, req.params.id);
  res.json({ ok: true });
});

router.get('/:id', (req, res) => {
  const issue = db.prepare(`
    SELECT i.*, b.address, b.city, a.number AS apt_number,
           p.full_name AS reporter_name, p.email AS reporter_email, p.phone AS reporter_phone,
           v.scheduled_at AS visit_date, v.type AS visit_type, k.full_name AS assigned_to_name
    FROM issues i
    LEFT JOIN apartments a ON a.id = i.apartment_id
    LEFT JOIN buildings b ON b.id = i.building_id
    LEFT JOIN profiles p ON p.id = i.reporter_id
    LEFT JOIN visits v ON v.id = i.visit_id
    LEFT JOIN profiles k ON k.id = i.assigned_to
    WHERE i.id = ?
  `).get(req.params.id);
  if (!issue) return res.status(404).json({ error: 'Nie znaleziono' });
  if (req.user.role === 'mieszkaniec' && issue.reporter_id !== req.user.sub) {
    return res.status(403).json({ error: 'Brak dostępu' });
  }
  res.json(issue);
});

export default router;
