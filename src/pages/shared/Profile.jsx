import { useState } from 'react';
import { Save, Lock, User } from 'lucide-react';
import { api, getProfile, setSession, getToken } from '../../lib/api';
import { roleLabel } from '../../lib/format';
import MobilePageHeader from '../../components/mobile/MobilePageHeader';

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
      setMsg1({ ok: true, text: 'Dane zapisane.' });
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
      setMsg2({ ok: true, text: 'Hasło zmienione.' });
    } catch (e) { setMsg2({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="panel-page max-w-xl mx-auto">
      <MobilePageHeader title="Mój profil" back={-1} sticky={false} />

      <section className="mobile-card bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl">
            {(initial?.full_name || initial?.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg truncate">{initial?.full_name}</div>
            <div className="text-sm text-white/80 truncate">{initial?.email}</div>
            <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">{roleLabel[initial?.role]}</span>
          </div>
        </div>
      </section>

      <form onSubmit={saveProfile} className="mobile-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-slate-900">Dane konta</h2>
        </div>
        <div>
          <label htmlFor="email" className="form-label">Email (niezmienne)</label>
          <input id="email" className="form-input bg-slate-50 text-slate-500" disabled value={initial?.email || ''} />
        </div>
        <div>
          <label htmlFor="full_name" className="form-label">Imię i nazwisko</label>
          <input id="full_name" className="form-input" required autoComplete="name"
            value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="phone" className="form-label">Telefon</label>
          <input id="phone" className="form-input" type="tel" inputMode="tel" autoComplete="tel"
            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+48 ___ ___ ___" />
        </div>
        {msg1 && <div className={`text-sm ${msg1.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg1.text}</div>}
        <button disabled={busy} className="btn-primary w-full py-3.5">
          <Save className="w-5 h-5" />
          {busy ? '…' : 'Zapisz zmiany'}
        </button>
      </form>

      <form onSubmit={changePwd} className="mobile-card space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-5 h-5 text-orange-500" />
          <h2 className="font-bold text-slate-900">Zmiana hasła</h2>
        </div>
        <div>
          <label className="form-label">Aktualne hasło</label>
          <input className="form-input" type="password" autoComplete="current-password" required
            value={pwd.current_password} onChange={e => setPwd(p => ({ ...p, current_password: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Nowe hasło (min. 6 znaków)</label>
          <input className="form-input" type="password" autoComplete="new-password" required minLength="6"
            value={pwd.new_password} onChange={e => setPwd(p => ({ ...p, new_password: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">Powtórz nowe hasło</label>
          <input className="form-input" type="password" autoComplete="new-password" required
            value={pwd.confirm} onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))} />
        </div>
        {msg2 && <div className={`text-sm ${msg2.ok ? 'text-emerald-700' : 'text-rose-600'}`}>{msg2.text}</div>}
        <button disabled={busy} className="btn-secondary w-full py-3.5">
          <Lock className="w-5 h-5 text-orange-500" />
          {busy ? '…' : 'Zmień hasło'}
        </button>
      </form>
    </div>
  );
}
