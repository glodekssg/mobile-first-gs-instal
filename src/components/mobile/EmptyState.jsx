export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
      {Icon && (
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <div className="font-semibold text-slate-900">{title}</div>
      {body && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
