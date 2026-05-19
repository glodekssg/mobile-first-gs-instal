import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../../.data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(resolve(DATA_DIR, 'crm.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Migracje przyrostowe — dodawanie kolumn do istniejących tabel
function ensureColumn(table, column, type) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`[db migration] dodano ${table}.${column}`);
  }
}
ensureColumn('magic_links', 'slots_from', 'TEXT');
ensureColumn('magic_links', 'slots_to', 'TEXT');
ensureColumn('magic_links', 'allowed_services', 'TEXT');
ensureColumn('magic_links', 'suggested_services', 'TEXT');
ensureColumn('magic_links', 'slot_hour_from', 'INTEGER');
ensureColumn('magic_links', 'slot_hour_to', 'INTEGER');
ensureColumn('magic_links', 'slot_duration_min', 'INTEGER');
ensureColumn('magic_links', 'slot_weekdays', 'TEXT');
ensureColumn('issues', 'internal_notes', 'TEXT');
ensureColumn('issues', 'visit_id', 'INTEGER');
ensureColumn('issues', 'assigned_to', 'INTEGER');
ensureColumn('offers', 'sent_at', 'TEXT');
ensureColumn('offers', 'sent_count', 'INTEGER DEFAULT 0');
ensureColumn('site_content', 'source_lang', "TEXT DEFAULT 'pl'");

// Idempotentnie utwórz dwie nowe tabele jeśli baza istniała wcześniej
db.exec(`
  CREATE TABLE IF NOT EXISTS site_content_translations (
    key TEXT NOT NULL,
    lang TEXT NOT NULL,
    value TEXT NOT NULL,
    source_hash TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key, lang)
  );
  CREATE TABLE IF NOT EXISTS translation_cache (
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translated TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_lang, target_lang, source_text)
  );
`);

export default db;
