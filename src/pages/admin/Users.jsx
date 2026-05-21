import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit3, KeyRound, Trash2, User as UserIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { fmtDateTime, roleLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';
import BottomSheet from '../../components/mobile/BottomSheet';
import FilterBar from '../../components/mobile/FilterBar';
import EmptyState from '../../components/mobile/EmptyState';

const ROLE_CHIP = {
  admin: 'bg-rose-100 text-rose-700',
  kominiarz: 'bg-orange-100 text-orange-700',
  zarzadca: 'bg-blue-100 text-blue-700',
  mieszkaniec: 'bg-emerald-100 text-emerald-700',
};

const EMPTY = { email: '', password: '', role: 'mieszkaniec', full_name: '', phone: '', uprawnienia: '', nr_uprawnien: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [form, setForm] = useState(EMPTY);

  function load() { api('/admin/users').then(setUsers); }
  useEffect(load, []);

  const filtered = filter ? users.filter(u => u.role === filter) : users;
  const counts = useMemo(() => Object.keys(ROLE_CHIP).reduce((acc, r) => { acc[r] = users.filter(u => u.role === r).length; return acc; }, {}), [users]);
  const filters = [
    { value: null, label: 'Wszyscy', count: users.length },
    { value: 'admin', label: 'Admin', count: counts.admin || 0 },
    { value: 'kominiarz', label: 'Kominiarz', count: counts.kominiarz || 0 },
    { value: 'zarzadca', label: 'Zarządca', count: counts.zarzadca || 0 },
    { value: 'mieszkaniec', label: 'Mieszkaniec', count: counts.mieszkaniec || 0 },
  ];

  async function save(e) {
    e.preventDefault();
    if (sheet?.editId) {
      await api(`/admin/users/${sheet.editId}`, { method: 'PATCH', body: form });
    } else {
      await api('/admin/users', { method: 'POST', body: form });
    }
    setSheet(null); setForm(EMPTY);
    load();
  }
  async function resetPwd(id) {
    const r = await api(`/admin/users/${id}/reset-password`, { method: 'POST', body: {} });
    alert(`Nowe hasło: ${r.new_password}\n\nSkopiuj i przekaż użytkownikowi.`);
  }
  async function del(id) {
    if (!confirm('Usunąć konto? Tej operacji nie da się cofnąć.')) return;
    await api(`/admin/users/${id}`, { method: 'DELETE' });
    load();
  }
  function openEdit(u) {
    setForm({ email: u.email, role: u.role, full_name: u.full_name, phone: u.phone || '', uprawnienia: u.uprawnienia || '', nr_uprawnien: u.nr_uprawnien || '', password: '' });
    setSheet({ editId: u.id });
  }
  function openNew() {
    setForm(EMPTY);
    setSheet({ editId: null });
  }

  return (
    <div className="panel-page">
      <MobilePageHeader title="Użytkownicy" />

      <div className="md:flex md:items-center md:justify-between md:gap-4">
        <div className="flex-1 min-w-0">
          <FilterBar filters={filters} value={filter} onChange={setFilter} />
        </div>
        <button onClick={openNew} className="btn-primary hidden md:flex items-center gap-2 mb-4 flex-shrink-0">
          <Plus className="w-4 h-4" /> Nowy użytkownik
        </button>
      </div>

      <div className="mobile-stack">
        {filtered.length === 0 ? (
          <EmptyState icon={UserIcon} title="Brak użytkowników" />
        ) : (
          filtered.map(u => (
            <article key={u.id} className="mobile-card">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold flex-shrink-0">
                  {u.full_name?.slice(0, 1).toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-slate-900 truncate">{u.full_name}</div>
                    <span className={`chip ${ROLE_CHIP[u.role]} flex-shrink-0`}>{roleLabel[u.role]}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  {u.phone && <div className="text-xs text-slate-500">{u.phone}</div>}
                  {u.uprawnienia && <div className="text-xs text-slate-400">{u.uprawnienia} • {u.nr_uprawnien}</div>}
                  <div className="text-xs text-slate-400 mt-1">{fmtDateTime(u.created_at)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(u)} className="btn-secondary flex-1">
                  <Edit3 className="w-4 h-4" /> Edytuj
                </button>
                <button onClick={() => resetPwd(u.id)} className="btn-secondary flex-1">
                  <KeyRound className="w-4 h-4 text-blue-500" /> Reset hasła
                </button>
                <button onClick={() => del(u.id)} className="btn-secondary text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <button onClick={openNew} className="fab md:hidden" aria-label="Nowy użytkownik">
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      <BottomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.editId ? 'Edytuj użytkownika' : 'Nowy użytkownik'}
        footer={
          <button form="user-form" type="submit" className="btn-primary w-full py-3.5">
            {sheet?.editId ? 'Zapisz zmiany' : 'Utwórz konto'}
          </button>
        }
      >
        <form id="user-form" onSubmit={save} className="space-y-3">
          <div>
            <label className="form-label">Imię i nazwisko</label>
            <input className="form-input" required autoComplete="name"
              value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" inputMode="email" autoComplete="email" required disabled={!!sheet?.editId}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          {!sheet?.editId && (
            <div>
              <label className="form-label">Hasło (opcjonalne dla OAuth)</label>
              <input className="form-input" type="password" autoComplete="new-password"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="form-label">Telefon</label>
            <input className="form-input" type="tel" inputMode="tel"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Rola</label>
            <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="mieszkaniec">Mieszkaniec</option>
              <option value="zarzadca">Zarządca / Spółdzielnia</option>
              <option value="kominiarz">Kominiarz</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {form.role === 'kominiarz' && (
            <>
              <div>
                <label className="form-label">Uprawnienia</label>
                <select className="form-input" value={form.uprawnienia} onChange={e => setForm(f => ({ ...f, uprawnienia: e.target.value }))}>
                  <option value="">— wybierz —</option>
                  <option value="mistrz">Mistrz Kominiarski</option>
                  <option value="czeladnik">Czeladnik</option>
                </select>
              </div>
              <div>
                <label className="form-label">Numer uprawnień</label>
                <input className="form-input" value={form.nr_uprawnien} onChange={e => setForm(f => ({ ...f, nr_uprawnien: e.target.value }))} />
              </div>
            </>
          )}
        </form>
      </BottomSheet>
    </div>
  );
}
