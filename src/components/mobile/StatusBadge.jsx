import { statusColor, statusLabel } from '../../lib/format';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  return (
    <span className={`chip ${statusColor[status] || 'bg-slate-100 text-slate-700'} ${className}`}>
      {statusLabel[status] || status}
    </span>
  );
}
