import React, { useEffect, useState } from 'react';
import { Key, ShieldCheck, SignOut } from '@phosphor-icons/react';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

export default function SecuritySettings({ onSignedOut }) {
  const [sessions, setSessions] = useState([]);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSessions = () => api.getSessions().then(setSessions).catch((err) => setError(err.message));
  useEffect(() => { loadSessions(); }, []);
  const run = async (fn, successMsg) => {
    setBusy(true); setError(''); setMessage('');
    try {
      await fn();
      if (successMsg) toast.success(successMsg);
    } catch (err) {
      setError(err.message);
      toast.error('Security action failed', { description: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-md p-4 sm:p-7 border border-slate-200 shadow-sm space-y-7">
      <div><div className="flex items-center gap-2.5"><ShieldCheck size={24} weight="bold" /><h2 className="text-lg font-bold">Account Security</h2></div><p className="text-sm text-slate-500 mt-1">Manage your password and signed-in devices.</p></div>
      {error && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{message}</p>}

      <form className="border border-slate-200 rounded-md p-4 space-y-3" onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          if (passwords.newPassword !== passwords.confirm) throw new Error('New password confirmation does not match.');
          await api.changePassword(passwords);
          toast.success('Password updated', { description: 'Password changed successfully. Please sign in again.' });
          onSignedOut();
        });
      }}>
        <div className="flex items-center gap-2"><Key size={20} /><h3 className="font-bold">Change password</h3></div>
        <div className="grid sm:grid-cols-3 gap-3"><label className="form-label">Current password<input className="form-input" type="password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label><label className="form-label">New password<input className="form-input" type="password" required minLength={12} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label><label className="form-label">Confirm new password<input className="form-input" type="password" required minLength={12} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /></label></div>
        <button className="btn-primary" disabled={busy}>Change password and sign out everywhere</button>
      </form>

      <div className="border border-slate-200 rounded-md p-4 space-y-3">
        <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">Active sessions</h3><p className="text-xs text-slate-500">Sessions expire after inactivity. Revoke any device you do not recognize.</p></div><button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold" disabled={busy} onClick={() => run(async () => { await api.logoutAll(); toast.info('Signed out everywhere', { description: 'All active sessions have been terminated.' }); onSignedOut(); })}><SignOut size={18} /> Sign out everywhere</button></div>
        <div className="divide-y divide-slate-100">{sessions.map((session) => <div key={session.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className="text-xs text-slate-600"><p className="font-semibold text-slate-900">{session.current ? 'This device' : session.userAgent || 'Unknown device'}</p><p>Last active: {new Date(session.lastSeenAt).toLocaleString()} · IP: {session.ip || 'unknown'}</p></div><button className="text-xs font-bold text-rose-700" disabled={busy} onClick={() => run(async () => { const result = await api.revokeSession(session.id); if (result.signedOut) { toast.info('Session revoked', { description: 'Current device session signed out.' }); onSignedOut(); } else { await loadSessions(); toast.info('Session revoked', { description: 'Device session has been terminated.' }); setMessage('Session revoked.'); } })}>Revoke</button></div>)}</div>
      </div>
    </section>
  );
}
