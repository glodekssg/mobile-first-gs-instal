import { useEffect } from 'react';

export default function BottomSheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="sheet-panel" role="dialog" aria-modal="true" aria-label={title || 'panel'}>
        <div className="sheet-handle" aria-hidden="true" />
        {title && (
          <div className="px-5 pt-2 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <button onClick={onClose} className="btn-ghost -mr-2" aria-label="Zamknij">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
        {footer && (
          <div className="border-t border-slate-100 p-4 bg-white">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
