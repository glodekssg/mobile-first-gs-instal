import { useEffect, useState } from 'react';
import { Save, RotateCcw, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { fetchContent } from '../../lib/cms';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';

const SECTIONS = [
  { key: 'hero', label: 'Hero', schema: [
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'subtitle', label: 'Podtytuł', type: 'textarea' },
    { k: 'cta_label', label: 'Tekst przycisku', type: 'text' },
    { k: 'cta_anchor', label: 'Cel (anchor)', type: 'text', placeholder: '#kontakt-form' },
  ]},
  { key: 'about', label: 'O Firmie', schema: [
    { k: 'eyebrow', label: 'Nadtytuł', type: 'text' },
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'body', label: 'Treść', type: 'textarea' },
    { k: 'benefits', label: 'Lista zalet', type: 'list' },
    { k: 'badge_number', label: 'Liczba w odznace', type: 'text' },
    { k: 'badge_text', label: 'Tekst odznaki', type: 'text' },
  ]},
  { key: 'cta_banner', label: 'CTA banner', schema: [
    { k: 'title', label: 'Tytuł', type: 'text' },
    { k: 'subtitle', label: 'Podtytuł', type: 'textarea' },
    { k: 'cta_label', label: 'Tekst przycisku', type: 'text' },
  ]},
  { key: 'contact_info', label: 'Dane firmy', schema: [
    { k: 'company', label: 'Pełna nazwa firmy', type: 'text' },
    { k: 'phone', label: 'Telefon biura', type: 'text' },
    { k: 'phone_grzegorz', label: 'Telefon Grzegorz Sitek', type: 'text' },
    { k: 'phone_kamil', label: 'Telefon Kamil Głodek', type: 'text' },
    { k: 'email', label: 'Email firmowy', type: 'text' },
    { k: 'address_line_1', label: 'Adres linia 1', type: 'text' },
    { k: 'address_line_2', label: 'Adres linia 2', type: 'text' },
    { k: 'region', label: 'Region', type: 'text' },
    { k: 'nip', label: 'NIP', type: 'text' },
    { k: 'regon', label: 'REGON', type: 'text' },
    { k: 'krs', label: 'KRS', type: 'text' },
    { k: 'bank_account', label: 'Numer konta', type: 'text' },
    { k: 'bank_name', label: 'Nazwa banku', type: 'text' },
    { k: 'hours', label: 'Godziny otwarcia', type: 'hours' },
  ]},
  { key: 'seo', label: 'SEO', schema: [
    { k: 'page_title', label: 'Tytuł strony', type: 'text' },
    { k: 'meta_description', label: 'Meta description', type: 'textarea' },
    { k: 'keywords', label: 'Słowa kluczowe', type: 'text' },
  ]},
];
const ICON_OPTIONS = ['ShieldCheck', 'Wrench', 'Wind', 'Flame', 'Camera', 'FileCheck', 'Phone', 'Mail', 'Zap', 'Settings'];

export default function AdminCMS() {
  const [content, setContent] = useState(null);
  const [active, setActive] = useState('hero');
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api('/cms/content').then(c => { setContent(c); setForm(c[active] || {}); });
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (content) setForm(content[active] || {}); }, [active, content]);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      await api(`/cms/content/${active}`, { method: 'PUT', body: form });
      await fetchContent();
      setMsg('Zapisano. Strona publiczna jest już zaktualizowana.');
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  }

  const sections = [
    ...SECTIONS,
    { key: 'services', label: 'Usługi' },
    { key: 'team', label: 'Zespół' },
  ];
  const section = SECTIONS.find(s => s.key === active);
  const editingServices = active === 'services';
  const editingTeam = active === 'team';

  return (
    <div className="panel-page">
      <MobilePageHeader
        title="CMS — treść strony"
        subtitle="Zmiany są widoczne natychmiast"
        right={(
          <a href="/" target="_blank" rel="noreferrer" className="btn-ghost text-orange-600 text-sm">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      />

      <div className="chip-row">
        {sections.map(s => (
          <button key={s.key} onClick={() => setActive(s.key)}
            className={`chip ${active === s.key ? 'chip-active' : 'chip-idle'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="mobile-card space-y-4">
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

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <button onClick={save} disabled={busy} className="btn-primary flex-1 py-3">
            <Save className="w-4 h-4" />
            {busy ? '…' : 'Zapisz'}
          </button>
          <button onClick={() => setForm(content[active] || {})} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Cofnij
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <div>
        <label className="form-label">{field.label}</label>
        <textarea className="form-input resize-none" rows="3"
          value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === 'list') {
    return (
      <div>
        <label className="form-label">{field.label}</label>
        <textarea className="form-input resize-none" rows="5"
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={e => onChange(e.target.value.split('\n').filter(Boolean))} />
        <div className="text-xs text-slate-400 mt-1">Każda linia = jeden element.</div>
      </div>
    );
  }
  if (field.type === 'hours') {
    const hours = Array.isArray(value) ? value : [];
    return (
      <div>
        <label className="form-label">{field.label}</label>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className="form-input flex-1" placeholder="Dzień"
                value={h.day || ''} onChange={e => { const c = [...hours]; c[i] = { ...c[i], day: e.target.value }; onChange(c); }} />
              <input className="form-input w-28" placeholder="Godziny"
                value={h.hours || ''} onChange={e => { const c = [...hours]; c[i] = { ...c[i], hours: e.target.value }; onChange(c); }} />
              <button type="button" onClick={() => onChange(hours.filter((_, j) => j !== i))}
                className="btn-secondary text-rose-600 px-3" aria-label="Usuń">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange([...hours, { day: '', hours: '' }])} className="btn-ghost text-orange-600 mt-2">
          <Plus className="w-4 h-4" /> Dodaj wiersz
        </button>
      </div>
    );
  }
  return (
    <div>
      <label className="form-label">{field.label}</label>
      <input className="form-input" placeholder={field.placeholder || ''}
        value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function TeamEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  function update(i, patch) { const c = [...list]; c[i] = { ...c[i], ...patch }; onChange(c); }
  return (
    <div className="space-y-3">
      {list.map((p, i) => (
        <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-sm">Osoba #{i + 1}</strong>
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="btn-ghost text-rose-600 -mr-2 text-sm">
              <Trash2 className="w-4 h-4" /> Usuń
            </button>
          </div>
          <input className="form-input" placeholder="Imię i nazwisko"
            value={p.name || ''} onChange={e => update(i, { name: e.target.value })} />
          <input className="form-input" placeholder="Rola"
            value={p.role || ''} onChange={e => update(i, { role: e.target.value })} />
          <textarea className="form-input resize-none" rows="3" placeholder="Opis"
            value={p.description || ''} onChange={e => update(i, { description: e.target.value })} />
          <input className="form-input" type="tel" placeholder="Telefon"
            value={p.phone || ''} onChange={e => update(i, { phone: e.target.value })} />
          <input className="form-input" type="email" placeholder="Email"
            value={p.email || ''} onChange={e => update(i, { email: e.target.value })} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { name: '', role: '', description: '', phone: '', email: '' }])}
        className="btn-ghost text-orange-600">
        <Plus className="w-4 h-4" /> Dodaj osobę
      </button>
    </div>
  );
}

function ServicesEditor({ value, onChange }) {
  const list = Array.isArray(value) ? value : [];
  function update(i, patch) { const c = [...list]; c[i] = { ...c[i], ...patch }; onChange(c); }
  return (
    <div className="space-y-3">
      {list.map((s, i) => (
        <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-sm">Usługa #{i + 1}</strong>
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="btn-ghost text-rose-600 -mr-2 text-sm">
              <Trash2 className="w-4 h-4" /> Usuń
            </button>
          </div>
          <input className="form-input" placeholder="Tytuł"
            value={s.title || ''} onChange={e => update(i, { title: e.target.value })} />
          <select className="form-input" value={s.icon || 'Wrench'} onChange={e => update(i, { icon: e.target.value })}>
            {ICON_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <textarea className="form-input resize-none" rows="2" placeholder="Opis"
            value={s.desc || ''} onChange={e => update(i, { desc: e.target.value })} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { title: '', desc: '', icon: 'Wrench' }])}
        className="btn-ghost text-orange-600">
        <Plus className="w-4 h-4" /> Dodaj usługę
      </button>
    </div>
  );
}
