import React, { useEffect, useState } from 'react';
import { Eye, EyeSlash, Globe, ShieldCheck } from '@phosphor-icons/react';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

export default function LoginForm({ onLoginSuccess, onBackToWebsite }) {
  const [setupRequired, setSetupRequired] = useState(false);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({
    setupToken: '',
    fullName: '',
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api
      .authStatus()
      .then((result) => setSetupRequired(result.setupRequired))
      .catch((err) => setError(err.message || 'Unable to contact the CRM server.'))
      .finally(() => setChecking(false));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = setupRequired
        ? await api.setup(form)
        : await api.login({
            email: form.email,
            password: form.password,
            rememberMe: form.rememberMe,
          });
      toast.success(`Welcome, ${result.user.fullName}!`);
      onLoginSuccess(result.user);
    } catch (err) {
      const msg = err.message || 'Unable to sign in. Please check your credentials.';
      setError(msg);
      toast.error('Sign-in failed', { description: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-navy-950 grid place-items-center p-3 sm:p-4 relative font-['Plus_Jakarta_Sans',sans-serif]">
      {onBackToWebsite && (
        <button type="button" onClick={onBackToWebsite} className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold text-amber-300 bg-slate-900/80 hover:bg-slate-900 border border-amber-500/30">
          <Globe size={16} weight="bold" /> Back to Public Website
        </button>
      )}
      <section className="w-full max-w-[365px] bg-white rounded-md shadow-2xl px-6 py-8 sm:px-7 sm:py-10 border border-slate-200">
        <div className="flex items-center justify-center mb-5">
          <div className="bg-slate-950 p-2 rounded-md border border-amber-400/40">
            <img src="/jagtap-logo.png" alt="Jagtap Travels" className="h-11 w-auto object-contain" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-navy-950 text-center">Jagtap Travels</h1>
        <p className="mt-1.5 mb-6 text-sm text-slate-500 text-center">
          {setupRequired ? 'Create the first administrator account' : 'Sign in to the secure CRM'}
        </p>
        {error && <div role="alert" className="p-3 mb-4 bg-rose-50 text-rose-700 rounded-lg text-sm border border-rose-200">{error}</div>}
        {checking ? (
          <p role="status" className="text-center text-sm text-slate-500 py-6">Checking CRM setup…</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {setupRequired && (
              <>
                <label className="form-label">Setup code<input className="form-input" type="password" required value={form.setupToken} onChange={(e) => update('setupToken', e.target.value)} autoComplete="off" /></label>
                <label className="form-label">Full name<input className="form-input" required maxLength={200} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} autoComplete="name" /></label>
              </>
            )}
            <label className="form-label">Email<input className="form-input py-2.5" type="email" required autoComplete="username" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="admin@jagtaptours.com" /></label>
            <div className="form-label">
              <label htmlFor="login-password">Password</label>
              <div className="relative">
                <input id="login-password" className="form-input py-2.5 pr-11" type={showPassword ? 'text' : 'password'} required minLength={setupRequired ? 12 : undefined} autoComplete={setupRequired ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="••••••••••••" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-500 hover:text-navy-950">
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {!setupRequired && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 pt-0.5"><input type="checkbox" checked={form.rememberMe} onChange={(e) => update('rememberMe', e.target.checked)} /> Keep signed in for up to 30 days (7-day inactivity limit)</label>
            )}
            <button disabled={busy} className="btn-primary w-full text-center justify-center py-2.5 mt-2 cursor-pointer shadow-xs">
              {busy ? 'Please wait…' : setupRequired ? 'Create account and sign in' : 'Sign in'}
            </button>
          </form>
        )}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck size={16} /> Protected CRM access</div>
      </section>
    </main>
  );
}
