// Reusable dropdown z opcją "+ Dodaj nowy" — otwiera modal z polami i tworzy element on-the-fly
import { useState } from 'react';

export default function SelectOrCreate({
  label,
  value, onChange,
  options = [],
  getLabel,
  getValue = (o) => o.id,
  emptyLabel = '— wybierz —',
  createLabel = '+ Dodaj',
  createTitle = 'Dodaj nowy',
  createFields = [],
  onCreate,         // async (data) => newItem (with id)
  onCreated,        // optional callback (newItem) — parent może odświeżyć listę
  disabled = false,
  required = false,
  className = '',
  filter,
  helpText,
}) {
  const [showModal, setShowModal] = useState(false);
  const filtered = filter ? options.filter(filter) : options;

  function handleCreated(newItem) {
    if (!newItem) return;
    if (onCreated) onCreated(newItem);
    const id = newItem.id ?? newItem.lastInsertRowid ?? newItem.value;
    if (id != null) onChange(String(id));
    setShowModal(false);
  }

  return (
    <div className={className}>
      {label && <label className="text-sm font-medium block mb-1">{label}</label>}
      <div className="flex gap-2">
        <select className="flex-1 border rounded p-2 text-sm"
          value={value || ''} disabled={disabled} required={required}
          onChange={e => onChange(e.target.value)}>
          <option value="">{emptyLabel}</option>
          {filtered.map(o => (
            <option key={getValue(o)} value={getValue(o)}>{getLabel(o)}</option>
          ))}
        </select>
        {onCreate && (
          <button type="button" onClick={() => setShowModal(true)} disabled={disabled}
            className="px-3 py-2 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded text-sm whitespace-nowrap font-medium">
            {createLabel}
          </button>
        )}
      </div>
      {helpText && <div className="text-xs text-slate-400 mt-1">{helpText}</div>}

      {showModal && (
        <InlineCreateModal
          title={createTitle}
          fields={createFields}
          onSubmit={async (data) => {
            try {
              const r = await onCreate(data);
              handleCreated(r);
            } catch (e) {
              alert(e.message || 'Błąd utworzenia');
            }
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function InlineCreateModal({ title, fields, onSubmit, onClose }) {
  const initial = {};
  for (const f of fields) initial[f.k] = f.default ?? '';
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await onSubmit(data);
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
        <button type="button" onClick={onClose} className="float-right text-slate-400">✕</button>
        <h3 className="font-semibold text-lg mb-3">{title}</h3>
        <form onSubmit={submit} className="space-y-3">
          {fields.map(field => (
            <FieldInput key={field.k} field={field}
              value={data[field.k]} onChange={v => setData(d => ({ ...d, [field.k]: v }))} />
          ))}
          <div className="flex gap-2 pt-2">
            <button disabled={busy} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-medium disabled:opacity-50">
              {busy ? '...' : 'Utwórz'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Anuluj</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  const cls = "w-full border rounded p-2 text-sm";
  if (field.type === 'select') {
    return (
      <div>
        <label className="text-sm block mb-1">{field.label}{field.required && ' *'}</label>
        <select className={cls} value={value || ''} required={field.required}
          onChange={e => onChange(e.target.value)}>
          {!field.required && <option value="">— wybierz —</option>}
          {(field.options || []).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === 'textarea') {
    return (
      <div>
        <label className="text-sm block mb-1">{field.label}{field.required && ' *'}</label>
        <textarea className={cls} rows="3" placeholder={field.placeholder}
          value={value || ''} required={field.required}
          onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div>
      <label className="text-sm block mb-1">{field.label}{field.required && ' *'}</label>
      <input className={cls} type={field.type || 'text'} placeholder={field.placeholder}
        value={value || ''} required={field.required}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}
