import { useEffect, useState } from 'react';
import { getLang, useLang } from './i18n';

const cachedContent = {};  // { lang: content }
const inFlight = {};       // { lang: Promise } — żeby nie podwójnie pobierać
const subscribers = new Set();

export async function fetchContent(lang) {
  const code = lang || getLang();
  if (inFlight[code]) return inFlight[code];

  const p = (async () => {
    const res = await fetch(`/api/cms/content?lang=${code}`);
    if (!res.ok) throw new Error('CMS fetch failed');
    const data = await res.json();
    cachedContent[code] = data;
    subscribers.forEach(fn => fn(code, data));
    return data;
  })();
  inFlight[code] = p;
  try { return await p; }
  finally { delete inFlight[code]; }
}

export function getContent(lang) {
  return cachedContent[lang || getLang()];
}

// Hook reaktywny — odświeża się przy zmianie języka oraz po fetchu
export function useContent(key) {
  const [lang] = useLang();
  const [, force] = useState(0);

  useEffect(() => {
    // Po zmianie języka: jeśli mamy w cache, OK. Jeśli nie — pobierz.
    if (!cachedContent[lang] && !inFlight[lang]) {
      fetchContent(lang).catch(console.error);
    }
    // Wymuś re-render przy każdym powiadomieniu o nowym fetch dla aktualnego języka
    const sub = (c) => { if (c === lang) force(x => x + 1); };
    subscribers.add(sub);
    return () => { subscribers.delete(sub); };
  }, [lang]);

  const content = cachedContent[lang];
  return key ? content?.[key] : content;
}
