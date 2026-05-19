// Next Best Action engine — generator rekomendacji wg reguł heurystycznych
import db from '../db/index.js';

const ONE_DAY = 24 * 3600 * 1000;

function upsert(action) {
  // dedup po (target_role, action_type, related_apartment_id)
  const existing = db.prepare(`
    SELECT id FROM next_actions
    WHERE target_role = ? AND action_type = ?
      AND IFNULL(related_apartment_id, -1) = IFNULL(?, -1)
      AND IFNULL(related_building_id, -1) = IFNULL(?, -1)
      AND status = 'open'
  `).get(action.target_role, action.action_type, action.related_apartment_id || null, action.related_building_id || null);
  if (existing) return;
  db.prepare(`
    INSERT INTO next_actions
      (target_role, target_profile_id, related_building_id, related_apartment_id, action_type, priority, title, rationale, payload_json, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    action.target_role,
    action.target_profile_id || null,
    action.related_building_id || null,
    action.related_apartment_id || null,
    action.action_type,
    action.priority || 50,
    action.title,
    action.rationale || null,
    action.payload_json || null,
    action.deadline || null
  );
}

export function runNBA() {
  let generated = 0;

  // Reguła 1: przewody bez kontroli od >11 miesięcy
  const stale = db.prepare(`
    SELECT c.*, b.address, a.number AS apt_number, a.resident_id, b.cooperative_id
    FROM chimneys c
    LEFT JOIN buildings b ON b.id = c.building_id
    LEFT JOIN apartments a ON a.id = c.apartment_id
    WHERE c.last_inspection IS NULL OR julianday('now') - julianday(c.last_inspection) > 330
  `).all();
  for (const ch of stale) {
    upsert({
      target_role: 'kominiarz',
      related_building_id: ch.building_id,
      related_apartment_id: ch.apartment_id,
      action_type: 'umow_kontrole',
      priority: 20,
      title: `Umów kontrolę: ${ch.address}${ch.apt_number ? ' / ' + ch.apt_number : ''}`,
      rationale: `Ostatnia kontrola przewodu ${ch.kind}: ${ch.last_inspection || 'nigdy'}. Termin ustawowy zbliża się lub minął.`,
    });
    if (ch.resident_id) {
      upsert({
        target_role: 'mieszkaniec',
        target_profile_id: ch.resident_id,
        related_building_id: ch.building_id,
        related_apartment_id: ch.apartment_id,
        action_type: 'wybierz_termin',
        priority: 30,
        title: `Wybierz termin kontroli przewodu (${ch.kind})`,
        rationale: `Zbliża się termin ustawowy. Kliknij, by wybrać dogodną godzinę.`,
      });
    }
  }

  // Reguła 2: kocioł gazowy bez nasady → upsell
  const noNasada = db.prepare(`
    SELECT c.*, b.address, a.number AS apt_number, a.resident_id
    FROM chimneys c
    JOIN buildings b ON b.id = c.building_id
    LEFT JOIN apartments a ON a.id = c.apartment_id
    WHERE c.fuel = 'gaz' AND c.has_nasada = 0
  `).all();
  for (const ch of noNasada) {
    upsert({
      target_role: 'kominiarz',
      target_profile_id: ch.resident_id || null,
      related_building_id: ch.building_id,
      related_apartment_id: ch.apartment_id,
      action_type: 'wyslij_oferte_nasada',
      priority: 40,
      title: `Upsell nasada: ${ch.address}${ch.apt_number ? ' / ' + ch.apt_number : ''}`,
      rationale: 'Kocioł gazowy bez nasady — propozycja nasady przeciwzaciągowej.',
      payload_json: JSON.stringify({ service: 'nasada', price: 450 }),
    });
  }

  // Reguła 3: paliwo stałe → przypomnienie po sezonie grzewczym (kwiecień-maj)
  const today = new Date();
  if (today.getMonth() === 3 || today.getMonth() === 4) {
    const solid = db.prepare(`
      SELECT c.*, a.resident_id, b.address, a.number AS apt_number
      FROM chimneys c
      JOIN buildings b ON b.id = c.building_id
      LEFT JOIN apartments a ON a.id = c.apartment_id
      WHERE c.fuel = 'stale'
    `).all();
    for (const ch of solid) {
      if (ch.resident_id) {
        upsert({
          target_role: 'mieszkaniec',
          target_profile_id: ch.resident_id,
          related_building_id: ch.building_id,
          related_apartment_id: ch.apartment_id,
          action_type: 'czyszczenie_po_sezonie',
          priority: 35,
          title: 'Zaplanuj czyszczenie po sezonie grzewczym',
          rationale: 'Po sezonie grzewczym warto wyczyścić przewód dymowy.',
        });
      }
    }
  }

  // Reguła 4: 2 odmowy wpuszczenia → eskalacja do zarządcy
  const refused = db.prepare(`
    SELECT building_id, apartment_id, COUNT(*) AS n
    FROM visits WHERE status = 'odmowa_wpuszczenia'
    GROUP BY apartment_id HAVING n >= 2
  `).all();
  for (const r of refused) {
    upsert({
      target_role: 'zarzadca',
      related_building_id: r.building_id,
      related_apartment_id: r.apartment_id,
      action_type: 'eskalacja_odmowa',
      priority: 10,
      title: 'Eskalacja: powtarzająca się odmowa wpuszczenia',
      rationale: `${r.n} odmów. Wymagane pismo / interwencja zarządcy.`,
    });
  }

  // Reguła 5: oferta wysłana, brak decyzji 7 dni → przypomnienie
  const stuck = db.prepare(`
    SELECT * FROM offers
    WHERE status='wyslana' AND julianday('now') - julianday(created_at) > 7
  `).all();
  for (const o of stuck) {
    upsert({
      target_role: 'kominiarz',
      target_profile_id: o.target_profile_id,
      related_building_id: o.building_id,
      related_apartment_id: o.apartment_id,
      action_type: 'follow_up_oferta',
      priority: 45,
      title: `Follow-up oferty: ${o.title}`,
      rationale: `Klient nie odpowiedział od 7 dni. Zadzwoń lub przypomnij.`,
      payload_json: JSON.stringify({ offer_id: o.id }),
    });
  }

  generated = db.prepare("SELECT COUNT(*) AS n FROM next_actions WHERE status='open'").get().n;
  db.prepare("INSERT INTO automation_log (rule_name, outcome) VALUES (?, ?)").run('nba', `open=${generated}`);
  return generated;
}
