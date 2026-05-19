import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fetchContent } from '../../lib/cms';

const SECTIONS = [
  { key: 'hero', label: 'Hero (banner główny)', schema: [
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'subtitle', label: 'Podtytuł', type: 'textarea' },
    { k: 'cta_label', label: 'Tekst przycisku', type: 'text' },
    { k: 'cta_anchor', label: 'Cel przycisku (anchor)', type: 'text', placeholder: '#kontakt-form' },
  ]},
  { key: 'about', label: 'O Firmie', schema: [
    { k: 'eyebrow', label: 'Nadtytuł', type: 'text' },
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'body', label: 'Treść', type: 'textarea' },
    { k: 'benefits', label: 'Lista zalet (po jednej w linii)', type: 'list' },
    { k: 'badge_number', label: 'Liczba w odznace', type: 'text' },
    { k: 'badge_text', label: 'Tekst odznaki', type: 'text' },
  ]},
  { key: 'cta_banner', label: 'CTA banner', schema: [
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'subtitle', label: 'Podtytuł', type: 'textarea' },
    { k: 'cta_label', label: 'Tekst przycisku', type: 'text' },
  ]},
  { key: 'contact_info', label: 'Dane firmy i kontakt', schema: [
    { k: 'company', label: 'Pełna nazwa firmy', type: 'text', placeholder: 'GS Instal Sp. z o.o.' },
    { k: 'phone', label: 'Telefon główny biura', type: 'text', placeholder: '+48 ___ ___ ___' },
    { k: 'phone_grzegorz', label: 'Telefon Grzegorz Sitek (Prezes)', type: 'text', placeholder: '+48 ___ ___ ___' },
    { k: 'phone_kamil', label: 'Telefon Kamil Głodek (wspólnik)', type: 'text', placeholder: '+48 ___ ___ ___' },
    { k: 'email', label: 'Email firmowy', type: 'text', placeholder: 'biuro@gsinstal.pl' },
    { k: 'address_line_1', label: 'Adres linia 1', type: 'text' },
    { k: 'address_line_2', label: 'Adres linia 2', type: 'text' },
    { k: 'region', label: 'Region (np. powiat, województwo)', type: 'text' },
    { k: 'nip', label: 'NIP', type: 'text' },
    { k: 'regon', label: 'REGON', type: 'text' },
    { k: 'krs', label: 'KRS', type: 'text' },
    { k: 'bank_account', label: 'Numer konta', type: 'text' },
    { k: 'bank_name', label: 'Nazwa banku', type: 'text' },
    { k: 'hours', label: 'Godziny otwarcia', type: 'hours' },
  ]},
  { key: 'seo', label: 'SEO', schema: [
    { k: 'page_title', label: 'Tytuł strony (HTML <title>)', type: 'text' },
    { k: 'meta_description', label: 'Meta description', type: 'textarea' },
    { k: 'keywords', label: 'Słowa kluczowe', type: 'text' },
  ]},
];

export default function AdminCMS() {
  const [content, setContent] = useState(null);
  const [active, setActive] = useState('hero');
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api('/cms/content').then(c => {
      setContent(c);
      setForm(c[active] || {});
    });
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (content) setForm(content[active] || {}); }, [active, content]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api(`/cms/content/${active}`, { method: 'PUT', body: form });
      await fetchContent(); // odśwież publiczny cache
      setMsg('✓ Zapisano. Strona publiczna jest już zaktualizowana.');
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const section = SECTIONS.find(s => s.key === active);
  // Specjalna sekcja "services" - lista kart
  const editingServices = active === 'services';
  const editingTeam = active === 'team';

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">CMS — treść strony</h1>
        <p className="text-slate-500 text-sm">Edytuj treść strony głównej. Zmiany są widoczne natychmiast.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[...SECTIONS,
          { key: 'services', label: 'Usługi (lista kart)' },
          { key: 'team', label: 'Zespół (Grzegorz i Kamil)' },
        ].map(s => (
          <button key={s.key} onClick={() => setActive(s.key)}
            className={`px-3 py-1.5 text-sm rounded-md ${active === s.key ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        {editingServices ? (
          <ServicesEditor value={form} onChange={setForm} />
        ) : editingTeam ? (
          <TeamEditor value={form} onChange={setForm} />
        ) : (
          section?.schema.map(field => (
            <Field key={field.k} field={field} value={form?.[field.k]} onChange={v => setForm(f => ({ ...f, [field.k]: v }))} />
          ))
        )}

        {msg && <div className="text-sm text-emerald-700">{msg}</div>}

        <div className="flex gap-2 pt-3 border-t">
          <button onClick={save} disabled={busy}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium disabled:opacity-50">
            {busy ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
          <button onClick={() => setForm(content[active] || {})} className="px-5 py-2 border rounded-md">Cofnij</button>
          <a href="/" target="_blank" rel="noreferrer" className="ml-auto px-5 py-2 text-orange-600 hover:underline">Otwórz stronę publiczną →</a>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      <textarea className="w-full border rounded p-2" rows="3"
        value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>;
  }
  if (field.type === 'list') {
    return <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      <textarea className="w-full border rounded p-2" rows="5"
        value={Array.isArray(value) ? value.join('\n') : ''}
        onChange={e => onChange(e.target.value.split('\n').filter(Boolean))} />
      <div className="text-xs text-slate-400 mt-1">Każda linia = jeden element.</div>
    </div>;
  }
  if (field.type === 'hours') {
    const hours = Array.isArray(value) ? value : [];
    return <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
      {hours.map((h, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input className="flex-1 border rounded p-1.5 text-sm" placeholder="Dzień"
            value={h.day} onChange={e => { const c = [...hours]; c[i] = { ...c[i], day: e.target.value }; onChange(c); }} />
          <input className="w-32 border rounded p-1.5 text-sm" placeholder="Godziny"
            value={h.hours} onChange={e => { const c = [...hours]; c[i] = { ...c[i], hours: e.target.value }; onChange(c); }} />
          <button type="button" onClick={() => onChange(hours.filter((_, j) => j !== i))} className="text-rose-500 px-2">×</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...hours, { day: '', hours: '' }])} className="text-sm text-orange-600">+ dodaj wiersz</button>
    </div>;
  }
  return <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
    <input className="w-full border rounded p-2" placeholder={field.placeholder || ''}
      value={value || ''} onChange={e => onChange(e.target.value)} />
  </div>;
}

const ICON_OPTIONS = ['ShieldCheck', 'Wrench', 'Wind', 'Flame', 'Camera', 'FileCheck', 'Phone', 'Mail', 'Zap', 'Settings'];

function TeamEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  function update(i, patch) { const c = [...list]; c[i] = { ...c[i], ...patch }; onChange(c); }
  return <div className="space-y-3">
    {list.map((p, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-2 bg-slate-50">
        <div className="flex gap-2">
          <input className="flex-1 border rounded p-2" placeholder="Imię i nazwisko"
            value={p.name || ''} onChange={e => update(i, { name: e.target.value })} />
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-rose-500 px-2">Usuń</button>
        </div>
        <input className="w-full border rounded p-2" placeholder="Rola (np. Prezes Zarządu • Mistrz Kominiarski)"
          value={p.role || ''} onChange={e => update(i, { role: e.target.value })} />
        <textarea className="w-full border rounded p-2 text-sm" rows="3" placeholder="Opis osoby"
          value={p.description || ''} onChange={e => update(i, { description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="border rounded p-2 text-sm" type="tel" placeholder="Telefon (+48 ___ ___ ___)"
            value={p.phone || ''} onChange={e => update(i, { phone: e.target.value })} />
          <input className="border rounded p-2 text-sm" type="email" placeholder="Email (opcjonalnie)"
            value={p.email || ''} onChange={e => update(i, { email: e.target.value })} />
        </div>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...list, { name: '', role: '', description: '', phone: '', email: '' }])}
      className="text-sm text-orange-600">+ dodaj osobę</button>
  </div>;
}

function ServicesEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  function update(i, patch) {
    const c = [...list]; c[i] = { ...c[i], ...patch }; onChange(c);
  }
  return <div className="space-y-3">
    {list.map((s, i) => (
      <div key={i} className="border rounded-lg p-3 space-y-2">
        <div className="flex gap-2">
          <input className="flex-1 border rounded p-1.5" placeholder="Tytuł"
            value={s.title || ''} onChange={e => update(i, { title: e.target.value })} />
          <select className="w-40 border rounded p-1.5" value={s.icon || 'Wrench'}
            onChange={e => update(i, { icon: e.target.value })}>
            {ICON_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="text-rose-500 px-2">Usuń</button>
        </div>
        <textarea className="w-full border rounded p-1.5 text-sm" rows="2" placeholder="Opis"
          value={s.desc || ''} onChange={e => update(i, { desc: e.target.value })} />
      </div>
    ))}
    <button type="button" onClick={() => onChange([...list, { title: '', desc: '', icon: 'Wrench' }])}
      className="text-sm text-orange-600">+ dodaj usługę</button>
  </div>;
}
