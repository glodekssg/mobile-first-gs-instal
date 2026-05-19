// Magic-link routes — działają BEZ JWT, tylko z tokenem w URL.
import { Router } from 'express';
import db from '../db/index.js';
import { generateSlots } from '../services/slots.js';
import { notifyProfile, notify } from '../services/notify.js';

const router = Router();

function getLink(token) {
  const link = db.prepare('SELECT * FROM magic_links WHERE token = ?').get(token);
  if (!link) return { error: 'Nieprawidłowy lub wygasły link', code: 404 };
  if (link.revoked) return { error: 'Link został unieważniony', code: 410 };
  if (new Date(link.expires_at) < new Date()) return { error: 'Link wygasł', code: 410 };
  return { link };
}

// Co widzi mieszkaniec po wejściu w link
router.get('/:token', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });

  db.prepare('UPDATE magic_links SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?').run(link.id);

  const apartment = link.apartment_id
    ? db.prepare(`
        SELECT a.*, b.address AS building_address, b.city, c.name AS cooperative_name
        FROM apartments a
        JOIN buildings b ON b.id = a.building_id
        LEFT JOIN cooperatives c ON c.id = b.cooperative_id
        WHERE a.id = ?
      `).get(link.apartment_id)
    : null;

  const visits = apartment
    ? db.prepare(`
        SELECT v.*, b.address AS building_address, a.number AS apt_number
        FROM visits v
        JOIN apartments a ON a.id = v.apartment_id
        JOIN buildings b ON b.id = v.building_id
        WHERE v.apartment_id = ? ORDER BY v.scheduled_at DESC
      `).all(link.apartment_id)
    : [];

  const offers = link.profile_id
    ? db.prepare(`
        SELECT o.*, b.address FROM offers o
        LEFT JOIN buildings b ON b.id = o.building_id
        WHERE o.target_profile_id = ? AND o.status IN ('wyslana','otwarta')
        ORDER BY o.created_at DESC
      `).all(link.profile_id)
    : [];

  let allowedServices = null;
  let suggestedServices = null;
  try { allowedServices = link.allowed_services ? JSON.parse(link.allowed_services) : null; } catch {}
  try { suggestedServices = link.suggested_services ? JSON.parse(link.suggested_services) : null; } catch {}

  let weekdays = null;
  try { weekdays = link.slot_weekdays ? JSON.parse(link.slot_weekdays) : null; } catch {}

  res.json({
    full_name: link.full_name || (link.profile_id ? db.prepare('SELECT full_name FROM profiles WHERE id = ?').get(link.profile_id)?.full_name : 'Mieszkańcu'),
    phone: link.phone,
    email: link.email,
    apartment,
    visits,
    offers,
    expires_at: link.expires_at,
    constraints: {
      slots_from: link.slots_from,
      slots_to: link.slots_to,
      slot_hour_from: link.slot_hour_from,
      slot_hour_to: link.slot_hour_to,
      slot_duration_min: link.slot_duration_min,
      slot_weekdays: weekdays,
      allowed_services: allowedServices,
      suggested_services: suggestedServices,
    },
  });
});

// Dostępne sloty (do przekładania) — z pełną konfiguracją z linka
router.get('/:token/slots', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  if (!kominiarz) return res.json({ slots: [] });

  const opts = {};
  if (link.slot_hour_from != null) opts.workStart = link.slot_hour_from;
  if (link.slot_hour_to != null) opts.workEnd = link.slot_hour_to;
  if (link.slot_duration_min) opts.slotMin = link.slot_duration_min;
  if (link.slot_weekdays) { try { opts.weekdays = JSON.parse(link.slot_weekdays); } catch {} }

  let slots = generateSlots(kominiarz.id, opts);
  if (link.slots_from) slots = slots.filter(s => s >= link.slots_from);
  if (link.slots_to)   slots = slots.filter(s => s <= link.slots_to);

  res.json({
    slots,
    kominiarz_id: kominiarz.id,
    duration_min: link.slot_duration_min || 60,
  });
});

// Rezerwacja nowej wizyty przez prospect (z respektowaniem allowed_services)
router.post('/:token/visits/book', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const { scheduled_at, type, notes } = req.body || {};
  if (!scheduled_at || !type) return res.status(400).json({ error: 'Brak terminu lub typu' });
  if (!link.apartment_id) return res.status(400).json({ error: 'Magic link bez przypisanego mieszkania — skontaktuj się z kominiarzem.' });

  // walidacja typu wizyty względem allowed_services
  try {
    const allowed = link.allowed_services ? JSON.parse(link.allowed_services) : null;
    if (allowed && allowed.length > 0 && !allowed.includes(type)) {
      return res.status(403).json({ error: 'Ten typ wizyty nie jest dostępny w Twoim linku' });
    }
  } catch {}

  // walidacja terminu względem slots_from/slots_to
  if (link.slots_from && scheduled_at < link.slots_from) {
    return res.status(403).json({ error: 'Termin poza dozwolonym zakresem' });
  }
  if (link.slots_to && scheduled_at > link.slots_to) {
    return res.status(403).json({ error: 'Termin poza dozwolonym zakresem' });
  }

  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  const apt = db.prepare('SELECT building_id FROM apartments WHERE id = ?').get(link.apartment_id);
  const duration = link.slot_duration_min || 60;
  const info = db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, duration_min, type, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, 'umowiona', ?, ?)
  `).run(apt.building_id, link.apartment_id, kominiarz?.id, scheduled_at, duration, type,
        notes ? `[via magic link] ${notes}` : '[via magic link]', link.profile_id || null);

  if (kominiarz) {
    notifyProfile(kominiarz.id, 'in_app', 'Nowa wizyta z magic linka',
      `Mieszkaniec ${link.full_name || ''} umówił wizytę (${type}) na ${scheduled_at}`);
  }
  res.json({ id: info.lastInsertRowid });
});

// Przełożenie wizyty
router.post('/:token/visits/:vid/reschedule', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const { scheduled_at } = req.body || {};
  if (!scheduled_at) return res.status(400).json({ error: 'Brak terminu' });

  const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(req.params.vid);
  if (!visit || visit.apartment_id !== link.apartment_id) {
    return res.status(404).json({ error: 'Wizyta nie znaleziona' });
  }
  if (link.slots_from && scheduled_at < link.slots_from) return res.status(403).json({ error: 'Termin poza dozwolonym zakresem' });
  if (link.slots_to   && scheduled_at > link.slots_to)   return res.status(403).json({ error: 'Termin poza dozwolonym zakresem' });

  db.prepare("UPDATE visits SET scheduled_at = ?, status = 'umowiona' WHERE id = ?")
    .run(scheduled_at, req.params.vid);

  if (visit.kominiarz_id) {
    notifyProfile(visit.kominiarz_id, 'in_app', 'Wizyta przełożona',
      `Mieszkaniec (${link.full_name || 'magic link'}) przełożył wizytę na ${new Date(scheduled_at).toLocaleString('pl-PL')}`);
  }
  res.json({ ok: true });
});

// Odwołanie wizyty
router.post('/:token/visits/:vid/cancel', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const { reason } = req.body || {};
  const visit = db.prepare('SELECT * FROM visits WHERE id = ?').get(req.params.vid);
  if (!visit || visit.apartment_id !== link.apartment_id) {
    return res.status(404).json({ error: 'Wizyta nie znaleziona' });
  }
  db.prepare("UPDATE visits SET status='odwolana', notes = COALESCE(notes,'') || ' [odwołano przez link: ' || ? || ']' WHERE id = ?")
    .run(reason || 'brak powodu', req.params.vid);
  if (visit.kominiarz_id) {
    notifyProfile(visit.kominiarz_id, 'in_app', 'Wizyta odwołana',
      `Mieszkaniec odwołał wizytę. Powód: ${reason || '—'}`);
  }
  res.json({ ok: true });
});

// Zgłoszenie usterki
router.post('/:token/issue', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const { title, description, severity } = req.body || {};
  if (!title) return res.status(400).json({ error: 'Tytuł wymagany' });

  const apt = link.apartment_id ? db.prepare('SELECT building_id FROM apartments WHERE id = ?').get(link.apartment_id) : null;
  const info = db.prepare(`
    INSERT INTO issues (reporter_id, apartment_id, building_id, title, description, severity)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(link.profile_id || null, link.apartment_id || null, apt?.building_id || null, title, description || null, severity || 'normal');

  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  if (kominiarz) {
    notifyProfile(kominiarz.id, 'in_app', `Nowe zgłoszenie: ${title}`,
      `Od: ${link.full_name || 'magic link'}. ${description || ''}`);
  }
  res.json({ id: info.lastInsertRowid });
});

// Akceptacja oferty bez logowania
router.post('/:token/offers/:oid/accept', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  const o = db.prepare('SELECT * FROM offers WHERE id = ?').get(req.params.oid);
  if (!o || o.target_profile_id !== link.profile_id) return res.status(404).json({ error: 'Oferta nie znaleziona' });
  db.prepare("UPDATE offers SET status='zaakceptowana', decided_at=CURRENT_TIMESTAMP WHERE id = ?").run(o.id);
  const kominiarz = db.prepare("SELECT id FROM profiles WHERE role='kominiarz' LIMIT 1").get();
  const when = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, 'umowiona', ?, ?)
  `).run(o.building_id, o.apartment_id, kominiarz?.id, when,
        o.service_type === 'wklad' ? 'montaz_wkladu' : o.service_type === 'nasada' ? 'montaz_nasady' : 'kontrola',
        `Realizacja oferty #${o.id}: ${o.title}`, link.profile_id || null);
  res.json({ ok: true });
});

router.post('/:token/offers/:oid/reject', (req, res) => {
  const { error, code, link } = getLink(req.params.token);
  if (error) return res.status(code).json({ error });
  db.prepare("UPDATE offers SET status='odrzucona', decided_at=CURRENT_TIMESTAMP WHERE id = ?").run(req.params.oid);
  res.json({ ok: true });
});

export default router;
