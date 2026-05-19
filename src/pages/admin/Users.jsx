import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { fmtDateTime, roleLabel } from '../../lib/format';

const ROLE_BADGE = {
  admin: 'bg-rose-100 text-rose-700',
  kominiarz: 'bg-orange-100 text-orange-700',
  zarzadca: 'bg-blue-100 text-blue-700',
  mieszkaniec: 'bg-emerald-100 text-emerald-700',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'mieszkaniec', full_name: '', phone: '', uprawnienia: '', nr_uprawnien: '' });
  const [editId, setEditId] = useState(null);

  function load() { api('/admin/users').then(setUsers); }
  useEffect(load, []);

  const filtered = users.filter(u => filter === 'all' || u.role === filter);

  async function save(e) {
    e.preventDefault();
    if (editId) {
      await api(`/admin/users/${editId}`, { method: 'PATCH', body: form });
    } else {
      await api('/admin/users', { method: 'POST', body: form });
    }
    setShow(false); setEditId(null);
    setForm({ email: '', password: '', role: 'mieszkaniec', full_name: '', phone: '', uprawnienia: '', nr_uprawnien: '' });
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

  function edit(u) {
    setEditId(u.id);
    setForm({ email: u.email, role: u.role, full_name: u.full_name, phone: u.phone || '', uprawnienia: u.uprawnienia || '', nr_uprawnien: u.nr_uprawnien || '', password: '' });
    setShow(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Użytkownicy</h1>
        <button onClick={() => { setEditId(null); setForm({ email: '', password: '', role: 'mieszkaniec', full_name: '', phone: '', uprawnienia: '', nr_uprawnien: '' }); setShow(true); }}
          className="px-4 py-2 bg-orange-500 text-white rounded-md">+ Nowy użytkownik</button>
      </div>

      <div className="flex gap-2">
        {['all', 'admin', 'kominiarz', 'zarzadca', 'mieszkaniec'].map(r => (
          <button key={r} onClick={() => setFilter(r)}
            className={`px-3 py-1.5 text-sm rounded-md ${filter === r ? 'bg-slate-900 text-white' : 'bg-white border'}`}>
            {r === 'all' ? `Wszyscy (${users.length})` : `${roleLabel[r]} (${users.filter(u => u.role === r).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto w-full pb-2"><table className="w-full text-sm whitespace-nowrap min-w-[600px]">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="text-left p-3">Imię i nazwisko</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rola</th>
              <th className="text-left p-3">Telefon</th>
              <th className="text-left p-3">Dodano</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium">{u.full_name}</div>
                  {u.uprawnienia && <div className="text-xs text-slate-500">{u.uprawnienia} {u.nr_uprawnien && `• ${u.nr_uprawnien}`}</div>}
                </td>
                <td className="p-3">
                  {u.email}
                  {u.oauth_provider && <span className="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{u.oauth_provider}</span>}
                </td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded ${ROLE_BADGE[u.role]}`}>{roleLabel[u.role]}</span></td>
                <td className="p-3 text-slate-500">{u.phone || '—'}</td>
                <td className="p-3 text-slate-500 text-xs">{fmtDateTime(u.created_at)}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => edit(u)} className="text-orange-600 text-sm hover:underline mr-3">Edytuj</button>
                  <button onClick={() => resetPwd(u.id)} className="text-blue-600 text-sm hover:underline mr-3">Reset hasła</button>
                  <button onClick={() => del(u.id)} className="text-rose-600 text-sm hover:underline">Usuń</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {show && (
        <Modal onClose={() => { setShow(false); setEditId(null); }}>
          <form onSubmit={save} className="space-y-3">
            <h3 className="font-semibold text-lg">{editId ? 'Edytuj użytkownika' : 'Nowy użytkownik'}</h3>
            <input className="w-full border rounded p-2" placeholder="Imię i nazwisko" required
              value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <input className="w-full border rounded p-2" type="email" placeholder="Email" required disabled={!!editId}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            {!editId && (
              <input className="w-full border rounded p-2" type="password" placeholder="Hasło (opcjonalne, dla OAuth zostaw puste)"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            )}
            <input className="w-full border rounded p-2" placeholder="Telefon"
              value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <select className="w-full border rounded p-2" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="mieszkaniec">Mieszkaniec</option>
              <option value="zarzadca">Zarządca / Spółdzielnia</option>
              <option value="kominiarz">Kominiarz</option>
              <option value="admin">Administrator</option>
            </select>
            {form.role === 'kominiarz' && (
              <>
                <select className="w-full border rounded p-2" value={form.uprawnienia}
                  onChange={e => setForm(f => ({ ...f, uprawnienia: e.target.value }))}>
                  <option value="">— wybierz —</option>
                  <option value="mistrz">Mistrz Kominiarski</option>
                  <option value="czeladnik">Czeladnik</option>
                </select>
                <input className="w-full border rounded p-2" placeholder="Numer uprawnień"
                  value={form.nr_uprawnien} onChange={e => setForm(f => ({ ...f, nr_uprawnien: e.target.value }))} />
              </>
            )}
            <button className="w-full bg-orange-500 text-white py-2 rounded">{editId ? 'Zapisz zmiany' : 'Utwórz konto'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Modal({ children, onClose }) {
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl p-6 w-full max-w-md"><button onClick={onClose} className="float-right text-slate-400">✕</button>{children}</div>
  </div>;
}
