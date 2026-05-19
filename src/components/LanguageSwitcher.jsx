import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, useLang } from '../lib/i18n';
import { fetchContent } from '../lib/cms';

export default function LanguageSwitcher({ dark = false }) {
  const [lang, setLang] = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function pick(code) {
    setLang(code);
    setOpen(false);
    // odśwież CMS w nowym języku
    fetchContent(code).catch(() => {});
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded transition text-sm ${
          dark ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-100 hover:bg-white/10'
        }`}
        aria-label={`Język: ${current.label}. Kliknij aby zmienić.`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline">{current.code.toUpperCase()}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Wybór języka"
          className="absolute right-0 mt-2 bg-white text-slate-900 rounded-lg shadow-xl border min-w-[180px] z-50 overflow-hidden">
          {LANGUAGES.map(l => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                onClick={() => pick(l.code)}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm ${
                  l.code === lang ? 'bg-orange-50 text-orange-700 font-medium' : ''
                }`}
              >
                <span className="text-base" aria-hidden="true">{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span className="ml-auto text-xs" aria-label="aktywny">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
