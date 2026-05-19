import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { fmtDateTime } from '../lib/format';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const dropdownRef = useRef(null);

  function pollCount() {
    api('/automation/notifications/me/count').then(r => setCount(r.unread)).catch(() => {});
  }
  function loadList() {
    api('/automation/notifications').then(d => setItems(d.slice(0, 15))).catch(() => {});
  }

  useEffect(() => {
    pollCount();
    const t = setInterval(pollCount, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function toggleOpen() {
    if (!open) {
      loadList();
      setOpen(true);
      if (count > 0) {
        await api('/automation/notifications/mark-read', { method: 'POST' });
        setCount(0);
      }
    } else {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold rounded-full px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white text-slate-900 rounded-lg shadow-xl border z-50 max-h-[500px] overflow-auto">
          <div className="p-3 border-b font-semibold text-sm sticky top-0 bg-white">Powiadomienia</div>
          {items.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">Brak powiadomień.</div>}
          {items.map(n => (
            <div key={n.id} className={`px-3 py-2 border-b last:border-0 text-sm ${!n.read_at ? 'bg-orange-50/50' : ''}`}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded">{n.channel}</span>
                <span className="text-xs text-slate-400 ml-auto">{fmtDateTime(n.created_at).split(',')[0]}</span>
              </div>
              {n.subject && <div className="font-medium text-sm">{n.subject}</div>}
              <div className="text-slate-700 text-sm">{n.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
