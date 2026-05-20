export default function Spinner({ label = 'Ładowanie…' }) {
  return (
    <div className="flex items-center justify-center py-8 text-slate-400 gap-3" role="status" aria-live="polite">
      <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
