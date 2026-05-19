import { Router } from 'express';
import db from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { getOrCreateTranslation, SUPPORTED } from '../services/translate.js';

const router = Router();

// PUBLIC GET — z opcjonalnym ?lang= ; jeśli inny niż source, tłumaczymy
router.get('/content', async (req, res) => {
  const lang = req.query.lang && SUPPORTED.includes(req.query.lang) ? req.query.lang : 'pl';
  const rows = db.prepare('SELECT key, value, source_lang FROM site_content').all();
  const result = {};
  for (const r of rows) {
    let val;
    try { val = JSON.parse(r.value); } catch { val = r.value; }
    const sourceLang = r.source_lang || 'pl';
    if (lang === sourceLang) {
      result[r.key] = val;
    } else {
      try {
        result[r.key] = await getOrCreateTranslation(r.key, val, sourceLang, lang);
      } catch {
        result[r.key] = val; // fallback do oryginału
      }
    }
  }
  res.json(result);
});

// Pojedyncza sekcja (też z lang)
router.get('/content/:key', async (req, res) => {
  const row = db.prepare('SELECT value, source_lang FROM site_content WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json({ error: 'Brak sekcji' });
  const lang = req.query.lang && SUPPORTED.includes(req.query.lang) ? req.query.lang : 'pl';
  let val;
  try { val = JSON.parse(row.value); } catch { val = row.value; }
  const sourceLang = row.source_lang || 'pl';
  if (lang === sourceLang) return res.json(val);
  try {
    const translated = await getOrCreateTranslation(req.params.key, val, sourceLang, lang);
    res.json(translated);
  } catch {
    res.json(val);
  }
});

router.use(authRequired);
router.use(requireRole('admin'));

router.put('/content/:key', (req, res) => {
  const value = JSON.stringify(req.body);
  const sourceLang = req.body?.__lang || 'pl';
  // Wymaż "__lang" jeśli jest w body (pomocniczy field)
  let cleanedBody = req.body;
  if (cleanedBody?.__lang) {
    cleanedBody = { ...cleanedBody };
    delete cleanedBody.__lang;
  }
  const cleanedValue = JSON.stringify(cleanedBody);
  db.prepare(`
    INSERT INTO site_content (key, value, source_lang, updated_by, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, source_lang = excluded.source_lang,
      updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
  `).run(req.params.key, cleanedValue, sourceLang, req.user.sub);
  // Invaliduj cache tłumaczeń tego klucza (nowe tłumaczenia powstaną przy pierwszym żądaniu)
  db.prepare('DELETE FROM site_content_translations WHERE key = ?').run(req.params.key);
  db.prepare('INSERT INTO admin_audit (actor_id, action, target) VALUES (?, ?, ?)')
    .run(req.user.sub, 'cms.update', `cms_key:${req.params.key}`);
  res.json({ ok: true });
});

router.delete('/content/:key', (req, res) => {
  db.prepare('DELETE FROM site_content WHERE key = ?').run(req.params.key);
  db.prepare('DELETE FROM site_content_translations WHERE key = ?').run(req.params.key);
  res.json({ ok: true });
});

// Endpoint translacji ad-hoc (do podglądów w panelu admina)
router.post('/translate', authRequired, requireRole('admin'), async (req, res) => {
  const { text, from = 'pl', to } = req.body || {};
  if (!text || !to) return res.status(400).json({ error: 'text i to wymagane' });
  const { translateText } = await import('../services/translate.js');
  const out = await translateText(text, from, to);
  res.json({ translated: out });
});

export default router;
