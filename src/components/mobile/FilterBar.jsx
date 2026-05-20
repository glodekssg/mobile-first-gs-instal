export default function FilterBar({ filters, value, onChange, ariaLabel = 'Filtry' }) {
  return (
    <div className="chip-row" role="tablist" aria-label={ariaLabel}>
      {filters.map(f => {
        const active = value === f.value;
        return (
          <button
            key={f.value ?? 'all'}
            onClick={() => onChange(f.value)}
            role="tab"
            aria-selected={active}
            className={`chip ${active ? 'chip-active' : 'chip-idle'}`}
          >
            {f.label}
            {typeof f.count === 'number' && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 ${active ? 'bg-white/25' : 'bg-slate-200'}`}>
                {f.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
