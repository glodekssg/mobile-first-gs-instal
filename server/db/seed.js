import bcrypt from 'bcryptjs';
import db from './index.js';

console.log('▸ seedowanie bazy demo...');

db.pragma('foreign_keys = OFF');
db.exec(`
  DELETE FROM admin_audit;
  DELETE FROM site_content;
  DELETE FROM leads;
  DELETE FROM magic_links;
  DELETE FROM next_actions;
  DELETE FROM notifications;
  DELETE FROM offers;
  DELETE FROM protocols;
  DELETE FROM visits;
  DELETE FROM chimneys;
  DELETE FROM apartments;
  DELETE FROM buildings;
  DELETE FROM cooperatives;
  DELETE FROM issues;
  DELETE FROM automation_log;
  DELETE FROM profiles;
  DELETE FROM sqlite_sequence;
`);
db.pragma('foreign_keys = ON');

const hash = bcrypt.hashSync('demo1234', 10);

// Konta
const adminId = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone)
  VALUES (?, ?, 'admin', ?, ?)
`).run('admin@gs-instal.pl', hash, 'Administrator GS', '+48 600 000 000').lastInsertRowid;

const kominiarzId = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone, uprawnienia, nr_uprawnien)
  VALUES (?, ?, 'kominiarz', ?, ?, 'mistrz', '12345/2018')
`).run('mistrz@gs-instal.pl', hash, 'Jan Kowalski', '+48 600 100 200').lastInsertRowid;

const zarzadcaId = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone)
  VALUES (?, ?, 'zarzadca', ?, ?)
`).run('zarzadca@spoldzielnia.pl', hash, 'Anna Nowak', '+48 600 200 300').lastInsertRowid;

const m1 = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone)
  VALUES (?, ?, 'mieszkaniec', ?, ?)
`).run('marek@example.com', hash, 'Marek Wiśniewski', '+48 600 300 401').lastInsertRowid;
const m2 = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone)
  VALUES (?, ?, 'mieszkaniec', ?, ?)
`).run('kasia@example.com', hash, 'Katarzyna Lewandowska', '+48 600 300 402').lastInsertRowid;
const m3 = db.prepare(`
  INSERT INTO profiles (email, password_hash, role, full_name, phone)
  VALUES (?, ?, 'mieszkaniec', ?, ?)
`).run('piotr@example.com', hash, 'Piotr Zieliński', '+48 600 300 403').lastInsertRowid;

// Spółdzielnia
const coopId = db.prepare(`
  INSERT INTO cooperatives (name, nip, address, contact_id) VALUES (?, ?, ?, ?)
`).run('SM "Słoneczna"', '5252523456', 'ul. Słoneczna 1, 02-100 Warszawa', zarzadcaId).lastInsertRowid;

const coop2Id = db.prepare(`
  INSERT INTO cooperatives (name, nip, address) VALUES (?, ?, ?)
`).run('Wspólnota Kwiatowa 4', '5252998877', 'ul. Kwiatowa 4, 02-200 Warszawa').lastInsertRowid;

// Budynki
const b1 = db.prepare(`INSERT INTO buildings (cooperative_id, address, city, postal_code, type, apartments_count) VALUES (?, ?, ?, ?, ?, ?)`)
  .run(coopId, 'ul. Słoneczna 1', 'Warszawa', '02-100', 'wielorodzinny', 12).lastInsertRowid;
const b2 = db.prepare(`INSERT INTO buildings (cooperative_id, address, city, postal_code, type, apartments_count) VALUES (?, ?, ?, ?, ?, ?)`)
  .run(coopId, 'ul. Słoneczna 3', 'Warszawa', '02-100', 'wielorodzinny', 8).lastInsertRowid;
const b3 = db.prepare(`INSERT INTO buildings (cooperative_id, address, city, postal_code, type, apartments_count) VALUES (?, ?, ?, ?, ?, ?)`)
  .run(coop2Id, 'ul. Kwiatowa 4', 'Warszawa', '02-200', 'wielorodzinny', 6).lastInsertRowid;
const b4 = db.prepare(`INSERT INTO buildings (address, city, postal_code, type, apartments_count) VALUES (?, ?, ?, ?, ?)`)
  .run('ul. Leśna 12', 'Warszawa', '03-150', 'jednorodzinny', 1).lastInsertRowid;

// Lokale + mieszkańcy
const a1 = db.prepare(`INSERT INTO apartments (building_id, number, floor, resident_id, resident_invite_code) VALUES (?, ?, ?, ?, ?)`)
  .run(b1, '3', '1', m1, 'CODE1').lastInsertRowid;
const a2 = db.prepare(`INSERT INTO apartments (building_id, number, floor, resident_id, resident_invite_code) VALUES (?, ?, ?, ?, ?)`)
  .run(b1, '5', '2', m2, 'CODE2').lastInsertRowid;
const a3 = db.prepare(`INSERT INTO apartments (building_id, number, floor, resident_id, resident_invite_code) VALUES (?, ?, ?, ?, ?)`)
  .run(b2, '1', '0', m3, 'CODE3').lastInsertRowid;
const a4 = db.prepare(`INSERT INTO apartments (building_id, number, floor, resident_invite_code) VALUES (?, ?, ?, ?)`)
  .run(b3, '2', '1', 'CODE4').lastInsertRowid;
const a5 = db.prepare(`INSERT INTO apartments (building_id, number, floor, resident_invite_code) VALUES (?, ?, ?, ?)`)
  .run(b4, '—', null, 'HOMECODE').lastInsertRowid;

// Przewody
const oldDate = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const recentDate = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);

db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b1, a1, 'spalinowy', 'gaz', 'kocioł gazowy', 'ceramika', oldDate, 0, 1);
db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b1, a1, 'wentylacyjny', null, 'wentylacja grawitacyjna', 'murowany', recentDate, 0, 0);
db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b1, a2, 'spalinowy', 'gaz', 'kocioł gazowy', 'stal', recentDate, 1, 1);
db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b2, a3, 'dymowy', 'stale', 'kominek', 'murowany', oldDate, 0, 0);
db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b4, a5, 'dymowy', 'stale', 'piec', 'ceramika', null, 0, 1);
db.prepare(`INSERT INTO chimneys (building_id, apartment_id, kind, fuel, device, material, last_inspection, has_nasada, has_wklad) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  .run(b3, a4, 'spalinowy', 'gaz', 'kocioł gazowy', 'stal', oldDate, 0, 1);

// Trochę wizyt + 1 zakończona z protokołem
const visitDone = db.prepare(`
  INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, completed_at, created_by)
  VALUES (?, ?, ?, datetime('now','-30 days'), 'kontrola', 'zakonczona', datetime('now','-30 days'), ?)
`).run(b1, a2, kominiarzId, kominiarzId).lastInsertRowid;

db.prepare(`
  INSERT INTO protocols (visit_id, result, findings, recommendations, signed_by)
  VALUES (?, 'sprawny', 'Brak uwag.', 'Następna kontrola za 12 miesięcy.', 'Jan Kowalski (nr upr. 12345/2018)')
`).run(visitDone);

// Wizyta umówiona za 5 dni
db.prepare(`
  INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, created_by)
  VALUES (?, ?, ?, datetime('now','+5 days','start of day','+10 hours'), 'kontrola', 'umowiona', ?)
`).run(b1, a1, kominiarzId, kominiarzId);

// Wizyta jutrzejsza
db.prepare(`
  INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, created_by)
  VALUES (?, ?, ?, datetime('now','+1 days','start of day','+9 hours'), 'czyszczenie', 'umowiona', ?)
`).run(b2, a3, kominiarzId, kominiarzId);

// Wizyta z odmową wpuszczenia x 2 (do testu eskalacji)
for (let i = 0; i < 2; i++) {
  db.prepare(`
    INSERT INTO visits (building_id, apartment_id, kominiarz_id, scheduled_at, type, status, created_by, completed_at)
    VALUES (?, ?, ?, datetime('now','-${20 - i * 5} days'), 'kontrola', 'odmowa_wpuszczenia', ?, datetime('now','-${20 - i * 5} days'))
  `).run(b3, a4, kominiarzId, kominiarzId);
}

// Magic link dla Marka (mieszkańca który nie chce się logować)
import('node:crypto').then(({ default: crypto }) => {
  const linkToken = 'demo-marek-' + crypto.randomBytes(8).toString('base64url');
  const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare(`
    INSERT INTO magic_links (token, profile_id, apartment_id, full_name, phone, email, expires_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(linkToken, m1, a1, 'Marek Wiśniewski', '+48 600 300 401', 'marek@example.com', expires, kominiarzId);
  console.log(`✓ Demo magic link: /p/${linkToken}`);
});

// Kilka leadów demo
db.prepare(`INSERT INTO leads (full_name, phone, email, service_type, message, source) VALUES (?, ?, ?, ?, ?, 'public_form')`)
  .run('Tomasz Mazur', '+48 601 234 567', 'tomek@example.com', 'kontrola', 'Proszę o kontakt — potrzebuję pilnej kontroli.');
db.prepare(`INSERT INTO leads (full_name, phone, email, service_type, message, source, status) VALUES (?, ?, ?, ?, ?, 'public_form', 'contacted')`)
  .run('Agnieszka Wójcik', '+48 601 999 888', null, 'czyszczenie', 'Dom jednorodzinny, kominek + 2 wentylacje.');

// CMS — domyślna treść strony głównej
const cmsContent = {
  hero: {
    title: 'Eksperci od Komina i Gazu w Twoim Domu',
    subtitle: 'Bezpieczeństwo i profesjonalizm od lat. Specjalizujemy się w przeglądach, czyszczeniu oraz montażu instalacji kominowych i gazowych.',
    cta_label: 'Skontaktuj się z nami',
    cta_anchor: '#kontakt-form',
  },
  services: [
    { title: 'Okresowe kontrole', desc: 'Zadbaj o bezpieczeństwo. Przeprowadzamy regularne kontrole przewodów kominowych zgodnie z wymogami prawa.', icon: 'ShieldCheck' },
    { title: 'Wkłady kominowe', desc: 'Profesjonalny montaż wkładów kominowych, które zabezpieczają komin przed kwasami i wilgocią.', icon: 'Wrench' },
    { title: 'Nasady kominowe', desc: 'Montaż nasad poprawiających ciąg kominowy i chroniących przed warunkami atmosferycznymi.', icon: 'Wind' },
    { title: 'Instalacje gazowe', desc: 'Kompleksowa kontrola szczelności i bezpieczeństwa domowych instalacji gazowych.', icon: 'Flame' },
    { title: 'Kamera inspekcyjna', desc: 'Dokładne badanie przewodów kominowych za pomocą zaawansowanej kamery inspekcyjnej.', icon: 'Camera' },
    { title: 'Opiniowanie', desc: 'Wydajemy profesjonalne opinie kominiarskie dla nadzoru budowlanego oraz gazowni.', icon: 'FileCheck' },
  ],
  about: {
    eyebrow: 'O Firmie GS Instal',
    title: 'Eksperci, którym możesz zaufać. Od lat dbamy o Wasze bezpieczeństwo.',
    body: 'Firma GS Instal Sp. z o.o. to zespół doświadczonych specjalistów z branży kominiarskiej i gazowej. Naszym priorytetem jest najwyższa jakość świadczonych usług oraz zapewnienie spokoju i bezpieczeństwa naszym klientom.',
    benefits: [
      'Certyfikowani Mistrzowie Kominiarscy',
      'Szybki czas reakcji i terminowość',
      'Nowoczesny sprzęt diagnostyczny',
      'Pełna dokumentacja powykonawcza',
    ],
    badge_number: '15+',
    badge_text: 'Lat Doświadczenia',
  },
  cta_banner: {
    title: 'Twój komin w dobrych rękach',
    subtitle: 'Od ponad dekady dostarczamy profesjonalne rozwiązania, dbając o czyste powietrze i bezpieczeństwo w domach naszych klientów.',
    cta_label: 'Zarezerwuj termin',
  },
  contact_info: {
    phone: '+48 123 456 789',
    email: 'biuro@gsinstal.pl',
    address_line_1: 'ul. Kominiarska 15',
    address_line_2: '00-123 Warszawa',
    hours: [
      { day: 'Poniedziałek - Piątek', hours: '8:00 - 18:00' },
      { day: 'Sobota', hours: '9:00 - 14:00' },
      { day: 'Niedziela', hours: 'Zamknięte' },
    ],
  },
};
for (const [key, value] of Object.entries(cmsContent)) {
  db.prepare(`INSERT INTO site_content (key, value, updated_by) VALUES (?, ?, ?)`)
    .run(key, JSON.stringify(value), adminId);
}

// Stara oferta wisząca (do reguły follow-up)
db.prepare(`
  INSERT INTO offers (target_profile_id, building_id, apartment_id, service_type, title, description, price_pln, status, created_at, expires_at)
  VALUES (?, ?, ?, 'inspekcja_kamera', 'Inspekcja kamerą inspekcyjną', 'Sprawdzenie szczelności przewodu kamerą HD.', 250, 'wyslana',
    datetime('now','-10 days'), datetime('now','+20 days'))
`).run(m1, b1, a1);

// Uruchom NBA aby od razu mieć rekomendacje
import('../services/nba.js').then(({ runNBA }) => {
  const n = runNBA();
  console.log(`✓ NBA wygenerowało ${n} akcji`);
  console.log('');
  console.log('━━━ Konta demo (hasło: demo1234) ━━━');
  console.log('  Administrator: admin@gs-instal.pl');
  console.log('  Kominiarz:    mistrz@gs-instal.pl');
  console.log('  Zarządca:     zarzadca@spoldzielnia.pl');
  console.log('  Mieszkaniec:  marek@example.com');
  console.log('  Mieszkaniec:  kasia@example.com');
  console.log('  Mieszkaniec:  piotr@example.com');
  console.log('');
  console.log('━━━ Kody zaproszeń mieszkań ━━━');
  console.log('  CODE1 — Słoneczna 1/3');
  console.log('  CODE2 — Słoneczna 1/5');
  console.log('  CODE3 — Słoneczna 3/1');
  console.log('  CODE4 — Kwiatowa 4/2');
  console.log('  HOMECODE — Leśna 12');
  process.exit(0);
});
