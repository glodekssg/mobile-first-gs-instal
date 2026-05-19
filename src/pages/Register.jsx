import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', role: 'mieszkaniec' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const { token, profile } = await api('/auth/register', { method: 'POST', auth: false, body: form });
      setSession(token, profile);
      nav('/panel/' + (profile.role === 'zarzadca' ? 'spoldzielnia' : profile.role));
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-900">← Logowanie</Link>
        <h1 className="text-2xl font-bold mt-2 mb-6">Rejestracja</h1>

        <form onSubmit={submit} className="space-y-3">
          <input className="w-full border rounded-md px-3 py-2" placeholder="imię i nazwisko"
            value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
          <input className="w-full border rounded-md px-3 py-2" placeholder="email" type="email"
            value={form.email} onChange={e => set('email', e.target.value)} required />
          <input className="w-full border rounded-md px-3 py-2" placeholder="telefon"
            value={form.phone} onChange={e => set('phone', e.target.value)} />
          <input className="w-full border rounded-md px-3 py-2" placeholder="hasło" type="password"
            value={form.password} onChange={e => set('password', e.target.value)} required />
          <select className="w-full border rounded-md px-3 py-2" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="mieszkaniec">Jestem mieszkańcem</option>
            <option value="zarzadca">Jestem zarządcą / przedstawicielem spółdzielni</option>
            <option value="kominiarz">Jestem kominiarzem (GS Instal)</option>
          </select>
          {err && <div className="text-rose-600 text-sm">{err}</div>}
          <button disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md font-medium disabled:opacity-50">
            {busy ? '...' : 'Załóż konto'}
          </button>
        </form>
      </div>
    </div>
  );
}
