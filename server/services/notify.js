// Mock SMS/email — zapisuje w tabeli notifications
import db from '../db/index.js';

export function notify({ channel = 'in_app', recipient, profile_id, subject, body }) {
  db.prepare(`
    INSERT INTO notifications (channel, recipient, profile_id, subject, body)
    VALUES (?, ?, ?, ?, ?)
  `).run(channel, recipient, profile_id || null, subject || null, body);
}

export function notifyProfile(profileId, channel, subject, body) {
  const p = db.prepare('SELECT email, phone FROM profiles WHERE id = ?').get(profileId);
  if (!p) return;
  const recipient = channel === 'sms' ? (p.phone || '—') : p.email;
  notify({ channel, recipient, profile_id: profileId, subject, body });
}
