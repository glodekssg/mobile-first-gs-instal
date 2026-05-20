import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
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
        body: { role, mock_email, mock_name: `${provider} user (${role})` },
      });
      setSession(token, profile);
      nav(ROLE_HOME[profile.role] || '/panel');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-slate-100" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <div className="px-4 pt-4">
        <Link to="/" className="btn-ghost -ml-2 text-sm" aria-label="Strona główna">
          <ArrowLeft className="w-4 h-4" />
          Strona główna
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-1">Zaloguj się</h1>
          <p className="text-slate-500 text-sm mb-6">GS Instal — panel CRM kominiarski.</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                className="form-input"
                placeholder="ty@firma.pl"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="form-label">Hasło</label>
              <input
                id="password"
                className="form-input"
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {err && <div className="text-rose-600 text-sm" role="alert">{err}</div>}
            <button disabled={busy} className="btn-primary w-full py-4 text-base">
              {busy ? '…' : (<><LogIn className="w-5 h-5" /> Zaloguj</>)}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> lub <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-2">
            <button onClick={() => oauth('google')} disabled={busy}
              className="btn-secondary w-full py-3">
              <span className="inline-block w-4 h-4 bg-gradient-to-br from-blue-500 via-red-500 to-yellow-500 rounded-full" />
              Zaloguj przez Google
            </button>
            <button onClick={() => oauth('facebook')} disabled={busy}
              className="w-full py-3 px-5 rounded-xl bg-[#1877F2] hover:bg-[#1565d8] text-white text-sm font-semibold">
              Zaloguj przez Facebook
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            Nie masz konta? <Link to="/register" className="text-orange-600 font-semibold">Zarejestruj się</Link>
          </div>

          <details className="mt-6 border-t pt-3 text-xs text-slate-500">
            <summary className="font-semibold text-slate-700 cursor-pointer py-1">Konta demo (hasło: demo1234)</summary>
            <div className="space-y-1 pt-2">
              <div>• admin@gs-instal.pl — administrator</div>
              <div>• mistrz@gs-instal.pl — kominiarz</div>
              <div>• zarzadca@spoldzielnia.pl — zarządca</div>
              <div>• marek@example.com — mieszkaniec</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
