import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';

const ROLE_HOME = {
  kominiarz: '/panel/kominiarz',
  zarzadca: '/panel/spoldzielnia',
  mieszkaniec: '/panel/mieszkaniec',
  admin: '/panel/admin',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const { token, profile } = await api('/auth/login', { method: 'POST', auth: false, body: { email, password } });
      setSession(token, profile);
      nav(ROLE_HOME[profile.role] || '/panel');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function oauth(provider) {
    setBusy(true); setErr(null);
    try {
      const role = prompt('Demo OAuth — wybierz rolę: kominiarz / zarzadca / mieszkaniec', 'mieszkaniec');
      if (!role) { setBusy(false); return; }
      const mock_email = prompt(`Demo OAuth (${provider}) — email do zalogowania:`, `${role}.${provider}@example.com`);
      const { token, profile } = await api(`/auth/oauth/${provider}`, {
        method: 'POST', auth: false,
        body: { role, mock_email, mock_name: `${provider} user (${role})` }
      });
      setSession(token, profile);
      nav(ROLE_HOME[profile.role] || '/panel');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">← Strona główna</Link>
        <h1 className="text-2xl font-bold mt-2 mb-1">GS Instal — panel</h1>
        <p className="text-slate-500 text-sm mb-6">Zaloguj się aby zarządzać kontrolami kominiarskimi.</p>

        <form onSubmit={submit} className="space-y-3">
          <input className="w-full border rounded-md px-3 py-2" placeholder="email" type="email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full border rounded-md px-3 py-2" placeholder="hasło" type="password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {err && <div className="text-rose-600 text-sm">{err}</div>}
          <button disabled={busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md font-medium disabled:opacity-50">
            {busy ? '...' : 'Zaloguj'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" /> lub <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="space-y-2">
          <button onClick={() => oauth('google')} disabled={busy}
            className="w-full border border-slate-300 hover:bg-slate-50 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full" />
            Zaloguj przez Google
          </button>
          <button onClick={() => oauth('facebook')} disabled={busy}
            className="w-full bg-[#1877F2] hover:bg-[#1565d8] text-white py-2 rounded-md text-sm font-medium">
            Zaloguj przez Facebook
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          Nie masz konta? <Link to="/register" className="text-orange-600 font-medium">Zarejestruj się</Link>
        </div>

        <div className="mt-6 border-t pt-4 text-xs text-slate-500 space-y-1">
          <div className="font-semibold text-slate-700">Konta demo (hasło: demo1234)</div>
          <div>• admin@gs-instal.pl — administrator</div>
          <div>• mistrz@gs-instal.pl — kominiarz</div>
          <div>• zarzadca@spoldzielnia.pl — zarządca</div>
          <div>• marek@example.com — mieszkaniec</div>
        </div>
      </div>
    </div>
  );
}
