import React, { useEffect, useState } from 'react';
import { Eye, EyeSlash, Trash, Users, UserPlus } from '@phosphor-icons/react';
import { api } from '../services/api';
import { toast } from '../context/ToastContext';

const emptyForm = { fullName: '', email: '', password: '', active: true };

export default function TeamUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const load = async () => {
    try {
      setUsers(await api.getUsers());
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm(emptyForm); setEditingId(null); setShowPassword(false); };
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      if (editingId) {
        await api.updateUser(editingId, {
          fullName: form.fullName, email: form.email, active: form.active,
        });
        toast.success('Team user updated.');
      } else {
        await api.createUser(form);
        toast.success('Team user created.');
      }
      reset();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateActive = async (user) => {
    setBusy(true); setError('');
    try {
      await api.updateUser(user.id, {
        fullName: user.fullName, email: user.email, active: user.active === false,
      });
      await load();
      toast.success(user.active === false ? 'Team user enabled.' : 'Team user disabled and signed out.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.fullName}'s staff account? They will be signed out.`)) return;
    setBusy(true); setError('');
    try {
      await api.deleteUser(user.id);
      if (editingId === user.id) reset();
      await load();
      toast.success('Staff account deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white rounded-md p-4 sm:p-7 border border-slate-200 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5"><Users size={24} weight="bold" /><div><h2 className="text-lg font-bold">Team users</h2><p className="text-sm text-slate-500">Staff can manage daily operations, quotations, fuel and tyres. Company billing, payroll, contracts, settings and security remain administrator-only.</p></div></div>
      {error && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</p>}
      <form className="border border-slate-200 rounded-md p-4 space-y-3" onSubmit={submit}>
        <div className="flex items-center gap-2"><UserPlus size={20} /><h3 className="font-bold">{editingId ? 'Edit staff account' : 'Add staff account'}</h3></div>
        <div className={`grid gap-3 ${editingId ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          <label className="form-label">Full name<input className="form-input" required maxLength={200} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
          <label className="form-label">Email<input className="form-input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          {!editingId && (
            <div className="form-label">
              <label htmlFor="staff-password">Password</label>
              <div className="relative">
                <input id="staff-password" className="form-input pr-11" type={showPassword ? 'text' : 'password'} minLength={6} maxLength={128} required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-slate-500 hover:text-slate-900">
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2"><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save staff account' : 'Create staff account'}</button>{editingId && <button type="button" className="px-4 py-2 border rounded-md text-sm" onClick={reset}>Cancel</button>}</div>
      </form>
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
        {users.map((user) => (
          <div key={user.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {user.fullName} <span className="text-xs font-normal text-slate-500">({user.role})</span>
              </p>
              <p className="text-xs text-slate-500">
                {user.email} · {user.active === false ? 'Disabled' : 'Active'}
              </p>
            </div>
            {user.role === 'Staff' && (
              <div className="flex items-center gap-3 text-xs font-bold">
                <button type="button" disabled={busy} className="text-blue-700" onClick={() => {
                  setEditingId(user.id);
                  setForm({ fullName: user.fullName, email: user.email, password: '', active: user.active !== false });
                  setShowPassword(false);
                }}>Edit</button>
                <button type="button" disabled={busy} className="text-amber-700" onClick={() => updateActive(user)}>
                  {user.active === false ? 'Enable' : 'Disable'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(user)}
                  aria-label={`Delete staff account for ${user.fullName}`}
                  title={`Delete ${user.fullName}'s staff account`}
                  className="inline-flex items-center justify-center p-2 rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                >
                  <Trash size={17} weight="bold" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
