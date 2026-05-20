import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'Szukaj…' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700"
          aria-label="Wyczyść"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
