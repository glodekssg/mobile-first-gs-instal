import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function MobilePageHeader({ title, subtitle, back, right, sticky = true }) {
  const nav = useNavigate();
  const cls = sticky
    ? 'sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-slate-200 md:static md:bg-transparent md:border-0 md:backdrop-blur-none md:py-0 md:mx-0 md:px-0 md:mb-2'
    : '';
  return (
    <header className={cls}>
      <div className="flex items-center gap-2">
        {back && (
          <button
            onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}
            className="btn-ghost -ml-2 md:hidden"
            aria-label="Wróć"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
