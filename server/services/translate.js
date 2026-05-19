// Tłumaczenie z cache + free MyMemory API
import db from '../db/index.js';
import crypto from 'node:crypto';

const SUPPORTED = ['pl', 'en', 'uk', 'ru', 'de', 'vi'];

function isShortNonText(s) {
  if (!s || typeof s !== 'string') return true;
  if (s.length < 2) return true;
  // Tylko numery/symbole — nie tłumacz
  if (/^[\d\s\W]+$/.test(s)) return true;
  // Email/URL/telefon
  if (/^https?:\/\//.test(s)) return true;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(s)) return true;
  if (/^[+\d\s()-]{5,}$/.test(s)) return true;
  // Hex/CSS class
  if (/^#[0-9a-fA-F]{3,6}$/.test(s)) return true;
  return false;
}

// MyMemory ma limit znaków per zapytanie ~500. Krótkie zapytania = lepiej.
async function callMyMemory(text, fromLang, toLang) {
  if (text.length > 480) {
    // Podziel długi tekst na zdania
    const parts = text.split(/(?<=[.!?])\s+/);
    const translated = [];
    for (const p of parts) {
      translated.push(await callMyMemory(p, fromLang, toLang));
    }
    return translated.join(' ');
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}&de=biuro@gsinstal.pl`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return text;
    const json = await res.json();
    const out = json?.responseData?.translatedText;
    if (out && out !== text && !out.startsWith('PLEASE SELECT')) return out;
    return text;
  } catch (e) {
    return text;
  }
}

export async function translateText(text, sourceLang, targetLang) {
  if (sourceLang === targetLang) return text;
  if (!SUPPORTED.includes(sourceLang) || !SUPPORTED.includes(targetLang)) return text;
  if (isShortNonText(text)) return text;

  // Cache lookup
  const cached = db.prepare(
    'SELECT translated FROM translation_cache WHERE source_lang = ? AND target_lang = ? AND source_text = ?'
  ).get(sourceLang, targetLang, text);
  if (cached) return cached.translated;

  const translated = await callMyMemory(text, sourceLang, targetLang);

  // Cache
  try {
    db.prepare(
      'INSERT OR REPLACE INTO translation_cache (source_lang, target_lang, source_text, translated) VALUES (?, ?, ?, ?)'
    ).run(sourceLang, targetLang, text, translated);
  } catch {}

  return translated;
}

// Rekurencyjnie tłumaczy wszystkie stringi w obiekcie/tablicy/JSON
export async function translateValue(value, sourceLang, targetLang) {
  if (sourceLang === targetLang) return value;
  if (typeof value === 'string') return await translateText(value, sourceLang, targetLang);
  if (Array.isArray(value)) {
    const out = [];
    for (const v of value) out.push(await translateValue(v, sourceLang, targetLang));
    return out;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Klucze które są kodami / nazwami techniczymi pomijamy
      if (['icon', 'cta_anchor', 'service_type', 'email', 'phone', 'phone_grzegorz', 'phone_kamil',
           'nip', 'regon', 'krs', 'bank_account', 'badge_number'].includes(k)) {
        out[k] = v;
      } else {
        out[k] = await translateValue(v, sourceLang, targetLang);
      }
    }
    return out;
  }
  return value;
}

// Sprawdź czy mamy aktualne tłumaczenie sekcji CMS; jeśli nie — wygeneruj i zapisz
export async function getOrCreateTranslation(key, sourceValue, sourceLang, targetLang) {
  if (sourceLang === targetLang) return sourceValue;

  const sourceJson = JSON.stringify(sourceValue);
  const hash = crypto.createHash('md5').update(sourceJson).digest('hex');

  const cached = db.prepare(
    'SELECT value, source_hash FROM site_content_translations WHERE key = ? AND lang = ?'
  ).get(key, targetLang);

  if (cached && cached.source_hash === hash) {
    try { return JSON.parse(cached.value); } catch { /* fall through */ }
  }

  // Tłumacz
  const translated = await translateValue(sourceValue, sourceLang, targetLang);

  // Zapisz
  try {
    db.prepare(`
      INSERT INTO site_content_translations (key, lang, value, source_hash, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key, lang) DO UPDATE SET value = excluded.value, source_hash = excluded.source_hash, updated_at = CURRENT_TIMESTAMP
    `).run(key, targetLang, JSON.stringify(translated), hash);
  } catch (e) { /* ignore */ }

  return translated;
}

export { SUPPORTED };
