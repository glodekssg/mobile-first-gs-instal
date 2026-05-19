// Strona profilu — dla każdej roli. Edycja danych + zmiana hasła.
import { useState } from 'react';
import { api, getProfile, setSession, getToken } from '../../lib/api';
import { roleLabel } from '../../lib/format';

export default function Profile() {
  const initial = getProfile();
  const [form, setForm] = useState({ full_name: initial?.full_name || '', phone: initial?.phone || '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });
  const [msg1, setMsg1] = useState(null);
  const [msg2, setMsg2] = useState(null);
  const [busy, setBusy] = useState(false);

  async function saveProfile(e) {
    e.preventDefault(); setBusy(true); setMsg1(null);
    try {
      const r = await api('/auth/me', { method: 'PATCH', body: form });
      setSession(getToken(), r.profile);
      setMsg1({ ok: true, text: '✓ Dane zapisane.' });
    } catch (e) { setMsg1({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  }

  async function changePwd(e) {
    e.preventDefault(); setBusy(true); setMsg2(null);
    if (pwd.new_password !== pwd.confirm) {
      setMsg2({ ok: false, text: 'Hasła nie są identyczne' });
      setBusy(false); return;
    }
    try {
      await api('/auth/change-password', { method: 'POST', body: { current_password: pwd.current_password, new_password: pwd.new_password } });
      setPwd({ current_password: '', new_password: '', confirm: '' });
      setMsg2({ ok: true, text: '✓ Hasło zmienione.' });
    } catch (e) { setMsg2({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Mój profil</h1>
        <p className="text-slate-500 text-sm">Edytuj swoje dane oraz hasło.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Dane konta</h2>
          <span className="text-xs px-2 py-1 bg-slate-100 rounded">{roleLabel[initial?.role]}</span>
        </div>
        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Email (nie można zmienić)</label>
            <input className="w-full border rounded p-2 bg-slate-50 text-slate-500" disabled value={initial?.email || ''} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Imię i nazwisko</label>
            <input className="w-full border rounded p-2" required value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Telefon</label>
            <input className="w-full border rounded p-2" type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+48 ___ ___ ___" />
          </div>
          {msg1 && <div className={`text-sm ${msg1.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg1.text}</div>}
          <button disabled={busy} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium disabled:opacity-50">
            {busy ? '...' : 'Zapisz zmiany'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Zmiana hasła</h2>
        <form onSubmit={changePwd} className="space-y-3">
          <input className="w-full border rounded p-2" type="password" placeholder="Aktualne hasło"
            value={pwd.current_password} onChange={e => setPwd(p => ({ ...p, current_password: e.target.value }))} required />
          <input className="w-full border rounded p-2" type="password" placeholder="Nowe hasło (min. 6 znaków)"
            value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} required minLength="6" />
          <input className="w-full border rounded p-2" type="password" placeholder="Powtórz nowe hasło"
            value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} required />
          {msg2 && <div className={`text-sm ${msg2.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg2.text}</div>}
          <button disabled={busy} className="px-5 py-2 bg-slate-900 text-white rounded-md font-medium disabled:opacity-50">
            {busy ? '...' : 'Zmień hasło'}
          </button>
        </form>
      </div>
    </div>
  );
}
