-- =========================================================================
-- GS Instal CRM — schemat bazy
-- =========================================================================
PRAGMA foreign_keys = ON;

-- Konta użytkowników (kominiarz, zarządca, mieszkaniec)
CREATE TABLE IF NOT EXISTS profiles (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,                       -- NULL jeśli tylko OAuth
  oauth_provider  TEXT,                       -- 'google' | 'facebook' | NULL
  oauth_id        TEXT,
  role            TEXT NOT NULL CHECK (role IN ('kominiarz','zarzadca','mieszkaniec','admin')),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- dla kominiarza:
  uprawnienia     TEXT,                       -- 'mistrz' | 'czeladnik'
  nr_uprawnien    TEXT,
  google_cal_token TEXT                       -- mock token Google Calendar
);

-- Spółdzielnia / Wspólnota / Zarządca nieruchomości
CREATE TABLE IF NOT EXISTS cooperatives (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  nip          TEXT,
  address      TEXT,
  contact_id   INTEGER REFERENCES profiles(id),
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Obiekty (budynki / domy jednorodzinne)
CREATE TABLE IF NOT EXISTS buildings (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cooperative_id  INTEGER REFERENCES cooperatives(id) ON DELETE CASCADE,
  address         TEXT NOT NULL,
  city            TEXT,
  postal_code     TEXT,
  type            TEXT,                       -- 'wielorodzinny' | 'jednorodzinny' | 'uslugowy'
  apartments_count INTEGER DEFAULT 1,
  notes           TEXT
);

-- Lokale w obiekcie
CREATE TABLE IF NOT EXISTS apartments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id  INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  number       TEXT NOT NULL,
  floor        TEXT,
  resident_id  INTEGER REFERENCES profiles(id),
  resident_invite_code TEXT
);

-- Przewody/urządzenia w obiekcie (kluczowa tabela — od tego liczymy terminy ustawowe)
CREATE TABLE IF NOT EXISTS chimneys (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id     INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
  apartment_id    INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
  kind            TEXT NOT NULL,              -- 'dymowy' | 'spalinowy' | 'wentylacyjny'
  material        TEXT,                       -- 'ceramika' | 'stal' | 'murowany'
  fuel            TEXT,                       -- 'gaz' | 'olej' | 'stale' | 'brak' (wentylacja)
  device          TEXT,                       -- 'kociol gazowy' | 'kominek' | 'piec' | 'wentylacja' ...
  length_m        REAL,
  installed_year  INTEGER,
  last_inspection TEXT,                       -- ISO date — ostatnia kontrola roczna
  last_cleaning   TEXT,
  has_nasada      INTEGER DEFAULT 0,
  has_wklad       INTEGER DEFAULT 0,
  notes           TEXT
);

-- Wizyty / zlecenia
CREATE TABLE IF NOT EXISTS visits (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id   INTEGER REFERENCES buildings(id) ON DELETE CASCADE,
  apartment_id  INTEGER REFERENCES apartments(id) ON DELETE SET NULL,
  kominiarz_id  INTEGER REFERENCES profiles(id),
  scheduled_at  TEXT,                         -- ISO datetime
  duration_min  INTEGER DEFAULT 60,
  type          TEXT NOT NULL,                -- 'kontrola' | 'czyszczenie' | 'inspekcja_kamera' | 'montaz_wkladu' | 'montaz_nasady' | 'kontrola_gaz' | 'opinia'
  status        TEXT NOT NULL DEFAULT 'umowiona', -- 'nowa'|'umowiona'|'w_trakcie'|'zakonczona'|'odwolana'|'odmowa_wpuszczenia'
  notes         TEXT,
  gcal_event_id TEXT,
  created_by    INTEGER REFERENCES profiles(id),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at  TEXT
);

-- Protokoły z wizyt
CREATE TABLE IF NOT EXISTS protocols (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id      INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  result        TEXT NOT NULL,                -- 'sprawny' | 'nieszczelny' | 'niesprawny'
  findings      TEXT,                         -- wykryte usterki
  recommendations TEXT,
  signed_by     TEXT,
  signed_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  photos_json   TEXT
);

-- Oferty upsell wygenerowane z protokołów lub przez NBA
CREATE TABLE IF NOT EXISTS offers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  target_profile_id INTEGER REFERENCES profiles(id),
  building_id  INTEGER REFERENCES buildings(id),
  apartment_id INTEGER REFERENCES apartments(id),
  source_visit_id INTEGER REFERENCES visits(id),
  service_type TEXT NOT NULL,                 -- 'wklad' | 'nasada' | 'inspekcja_kamera' | 'opinia' | 'pakiet_roczny' | 'czyszczenie_went'
  title        TEXT NOT NULL,
  description  TEXT,
  price_pln    REAL,
  status       TEXT NOT NULL DEFAULT 'wyslana', -- 'wyslana'|'otwarta'|'zaakceptowana'|'odrzucona'|'wygasla'
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   TEXT,
  decided_at   TEXT
);

-- Next Best Action — kolejka rekomendacji
CREATE TABLE IF NOT EXISTS next_actions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  target_role  TEXT NOT NULL,                  -- 'kominiarz' | 'zarzadca' | 'mieszkaniec'
  target_profile_id INTEGER REFERENCES profiles(id),
  related_building_id INTEGER REFERENCES buildings(id),
  related_apartment_id INTEGER REFERENCES apartments(id),
  action_type  TEXT NOT NULL,                  -- 'umów_kontrolę' | 'wyślij_ofertę' | 'eskaluj' | 'kampania' ...
  priority     INTEGER NOT NULL DEFAULT 50,    -- 1=najwyższy, 100=najniższy
  title        TEXT NOT NULL,
  rationale    TEXT,
  payload_json TEXT,
  status       TEXT NOT NULL DEFAULT 'open',   -- 'open'|'done'|'dismissed'
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deadline     TEXT
);

-- Powiadomienia (mock SMS/email)
CREATE TABLE IF NOT EXISTS notifications (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  channel      TEXT NOT NULL,                  -- 'sms' | 'email' | 'in_app'
  recipient    TEXT NOT NULL,                  -- email/phone
  profile_id   INTEGER REFERENCES profiles(id),
  subject      TEXT,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'sent',   -- 'sent'|'failed'|'queued'
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at      TEXT
);

-- Zgłoszenia mieszkańców (usterki)
CREATE TABLE IF NOT EXISTS issues (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id  INTEGER REFERENCES profiles(id),
  apartment_id INTEGER REFERENCES apartments(id),
  building_id  INTEGER REFERENCES buildings(id),
  title        TEXT NOT NULL,
  description  TEXT,
  severity     TEXT DEFAULT 'normal',          -- 'low'|'normal'|'high'|'urgent'
  status       TEXT NOT NULL DEFAULT 'open',   -- 'open'|'in_progress'|'resolved'|'closed'
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Log automatyzacji (do debugowania reguł)
CREATE TABLE IF NOT EXISTS automation_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name   TEXT NOT NULL,
  trigger_data TEXT,
  outcome     TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Magic-link tokeny dla mieszkańców bez logowania
CREATE TABLE IF NOT EXISTS magic_links (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  token        TEXT NOT NULL UNIQUE,
  profile_id   INTEGER REFERENCES profiles(id),
  apartment_id INTEGER REFERENCES apartments(id),
  full_name    TEXT,                       -- gdy nie ma profilu (anonimowy mieszkaniec)
  phone        TEXT,
  email        TEXT,
  created_by   INTEGER REFERENCES profiles(id),
  expires_at   TEXT NOT NULL,
  last_used_at TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked      INTEGER DEFAULT 0,
  -- Ograniczenia twórcy linku:
  slots_from   TEXT,                        -- ISO datetime — najwcześniejszy dostępny slot (NULL = bez ograniczeń)
  slots_to     TEXT,                        -- ISO datetime — najpóźniejszy
  allowed_services TEXT,                    -- JSON array typów wizyt prospect może wybrać (NULL = wszystkie)
  suggested_services TEXT                   -- JSON array — usługi sugerowane (do wyświetlenia jako CTA)
);

-- Cold leads — formularz "umów się" na stronie głównej
CREATE TABLE IF NOT EXISTS leads (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  email        TEXT,
  service_type TEXT,
  message      TEXT,
  source       TEXT DEFAULT 'public_form',  -- 'public_form'|'phone'|'recommendation'
  status       TEXT NOT NULL DEFAULT 'new', -- 'new'|'contacted'|'scheduled'|'converted'|'rejected'
  assigned_to  INTEGER REFERENCES profiles(id),
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CMS — treść strony głównej i innych sekcji (klucz → JSON)
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,                 -- JSON (oryginał, język źródłowy = pl)
  source_lang TEXT DEFAULT 'pl',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES profiles(id)
);

-- Cache tłumaczeń CMS
CREATE TABLE IF NOT EXISTS site_content_translations (
  key        TEXT NOT NULL,
  lang       TEXT NOT NULL,
  value      TEXT NOT NULL,                 -- JSON tłumaczonej treści
  source_hash TEXT,                          -- hash źródła — invaliduj gdy się zmienia
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key, lang)
);

-- Cache pojedynczych tłumaczeń (string-level) — żeby nie wołać API kilka razy dla tego samego tekstu
CREATE TABLE IF NOT EXISTS translation_cache (
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  source_text TEXT NOT NULL,
  translated TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_lang, target_lang, source_text)
);

-- Audit log dla admin actions
CREATE TABLE IF NOT EXISTS admin_audit (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    INTEGER REFERENCES profiles(id),
  action      TEXT NOT NULL,                -- 'user.create' | 'user.update' | 'user.delete' | 'cms.update' | 'magic_link.create' ...
  target      TEXT,                         -- np. 'profile:5' | 'cms_key:hero'
  payload     TEXT,                         -- JSON
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_magic_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);
CREATE INDEX IF NOT EXISTS idx_visits_kominiarz ON visits(kominiarz_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_visits_building ON visits(building_id, status);
CREATE INDEX IF NOT EXISTS idx_chimneys_building ON chimneys(building_id);
CREATE INDEX IF NOT EXISTS idx_nba_target ON next_actions(target_role, status, priority);
CREATE INDEX IF NOT EXISTS idx_apt_resident ON apartments(resident_id);
