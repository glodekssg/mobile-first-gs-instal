import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-[100svh] flex flex-col bg-slate-100" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <div className="px-4 pt-4">
        <Link to="/login" className="btn-ghost -ml-2 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Logowanie
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6">Rejestracja</h1>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="full_name" className="form-label">Imię i nazwisko</label>
              <input id="full_name" className="form-input" autoComplete="name"
                value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" className="form-input" type="email" inputMode="email" autoComplete="email"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="phone" className="form-label">Telefon</label>
              <input id="phone" className="form-input" type="tel" inputMode="tel" autoComplete="tel"
                value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="form-label">Hasło</label>
              <input id="password" className="form-input" type="password" autoComplete="new-password"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div>
              <label htmlFor="role" className="form-label">Jestem</label>
              <select id="role" className="form-input"
                value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="mieszkaniec">mieszkańcem</option>
                <option value="zarzadca">zarządcą / przedstawicielem spółdzielni</option>
                <option value="kominiarz">kominiarzem (GS Instal)</option>
              </select>
            </div>
            {err && <div className="text-rose-600 text-sm" role="alert">{err}</div>}
            <button disabled={busy} className="btn-primary w-full py-4 text-base">
              {busy ? '…' : 'Załóż konto'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
