import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, full_name, role, phone } = req.body || {};
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'Wymagane: email, password, full_name, role' });
  }
  if (!['kominiarz', 'zarzadca', 'mieszkaniec'].includes(role)) {
    return res.status(400).json({ error: 'Niewłaściwa rola' });
  }
  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email zajęty' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO profiles (email, password_hash, role, full_name, phone) VALUES (?, ?, ?, ?, ?)')
    .run(email, hash, role, full_name, phone || null);
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: signToken(profile), profile: stripProfile(profile) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  if (!profile || !profile.password_hash || !bcrypt.compareSync(password, profile.password_hash)) {
    return res.status(401).json({ error: 'Błędny email lub hasło' });
  }
  res.json({ token: signToken(profile), profile: stripProfile(profile) });
});

// Mock OAuth — udajemy że to Google/Facebook, w realu redirect na provider
router.post('/oauth/:provider', (req, res) => {
  const { provider } = req.params;
  if (!['google', 'facebook'].includes(provider)) {
    return res.status(400).json({ error: 'Niewspierany provider' });
  }
  const { mock_email, mock_name, role } = req.body || {};
  const email = mock_email || `${provider}.user.${Date.now()}@example.com`;
  const name = mock_name || `Użytkownik ${provider}`;
  const finalRole = role || 'mieszkaniec';

  let profile = db.prepare('SELECT * FROM profiles WHERE email = ?').get(email);
  if (!profile) {
    const info = db
      .prepare('INSERT INTO profiles (email, oauth_provider, oauth_id, role, full_name) VALUES (?, ?, ?, ?, ?)')
      .run(email, provider, `${provider}_${Date.now()}`, finalRole, name);
    profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(info.lastInsertRowid);
  }
  res.json({ token: signToken(profile), profile: stripProfile(profile), mocked: true });
});

router.get('/me', authRequired, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.sub);
  if (!profile) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ profile: stripProfile(profile) });
});

router.patch('/me', authRequired, (req, res) => {
  const allowed = ['full_name', 'phone'];
  const sets = []; const params = [];
  for (const k of allowed) if (req.body[k] !== undefined) { sets.push(`${k} = ?`); params.push(req.body[k]); }
  if (sets.length === 0) return res.json({ ok: true });
  params.push(req.user.sub);
  db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.sub);
  res.json({ profile: stripProfile(profile) });
});

router.post('/change-password', authRequired, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: 'Hasło musi mieć min. 6 znaków' });
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user.sub);
  if (!profile) return res.status(404).json({ error: 'Nie znaleziono' });
  if (profile.password_hash) {
    if (!current_password || !bcrypt.compareSync(current_password, profile.password_hash)) {
      return res.status(401).json({ error: 'Aktualne hasło jest błędne' });
    }
  }
  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?').run(hash, req.user.sub);
  res.json({ ok: true });
});

function stripProfile(p) {
  const { password_hash, google_cal_token, ...rest } = p;
  return { ...rest, has_gcal: !!google_cal_token };
}

export default router;
