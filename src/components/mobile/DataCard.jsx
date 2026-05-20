import { ChevronRight } from 'lucide-react';

export default function DataCard({
  to,
  onClick,
  icon: Icon,
  title,
  subtitle,
  badge,
  right,
  meta,
  href,
  as: As = 'div',
}) {
  const isClickable = !!(to || onClick || href);
  const Wrapper = href ? 'a' : (to ? 'a' : As);
  const props = {};
  if (href) props.href = href;
  if (to) props.href = to;
  if (onClick) props.onClick = onClick;
  return (
    <Wrapper
      {...props}
      className={`mobile-card flex items-center gap-3 ${isClickable ? 'active:bg-slate-50 cursor-pointer' : ''}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-900 truncate">{title}</div>
          {badge}
        </div>
        {subtitle && <div className="text-sm text-slate-500 truncate">{subtitle}</div>}
        {meta && <div className="text-xs text-slate-400 mt-1 truncate">{meta}</div>}
      </div>
      {right ? right : (isClickable && <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />)}
    </Wrapper>
  );
}
