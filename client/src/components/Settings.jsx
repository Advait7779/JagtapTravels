import React, { useEffect, useState } from 'react';
import {
  Gear,
  ShieldCheck,
  SealCheck,
  PenNib,
  UploadSimple,
  ArrowCounterClockwise,
  Stamp,
  X,
} from '@phosphor-icons/react';
import { api } from '../services/api';
import TeamUsers from './TeamUsers';

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState(settings || {});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  useEffect(() => {
    setForm(settings || {});
  }, [settings]);

  const labels = {
    companyName: 'Company name',
    address: 'Office address',
    phone: 'Business phone 1',
    phone2: 'Business phone 2 (Below 1st number)',
    email: 'Business email',
    gstNumber: 'GSTIN',
    bankName: 'Bank name',
    bankBranch: 'Branch',
    accountName: 'Account holder',
    accountNumber: 'Account number',
    ifsc: 'IFSC',
    upi: 'UPI ID',
  };

  const isStampRemoved = form.stampUrl === 'none';
  const currentStamp = isStampRemoved ? null : (form.stampUrl || '/stamp.jpg');

  const isSigRemoved = form.signatureUrl === 'none';
  const currentSignature = isSigRemoved ? null : (form.signatureUrl || '/signature.jpg');

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStamp(true);
    setMessage('');
    try {
      const res = await api.uploadSettingsAsset(file);
      if (res?.fileUrl) {
        const updated = { ...form, stampUrl: res.fileUrl };
        setForm(updated);
        await onSave(updated);
        setMessage('Company stamp updated successfully.');
      }
    } catch (err) {
      setMessage(err.message || 'Failed to upload company stamp.');
    } finally {
      setUploadingStamp(false);
      e.target.value = '';
    }
  };

  const handleRemoveStamp = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const updated = { ...form, stampUrl: 'none' };
    setForm(updated);
    try {
      await onSave(updated);
      setMessage('Company stamp removed successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to remove company stamp.');
    }
  };

  const handleRestoreStamp = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const updated = { ...form, stampUrl: '/stamp.jpg' };
    setForm(updated);
    try {
      await onSave(updated);
      setMessage('Default Jagtap Travels stamp restored successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to restore company stamp.');
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSignature(true);
    setMessage('');
    try {
      const res = await api.uploadSettingsAsset(file);
      if (res?.fileUrl) {
        const updated = { ...form, signatureUrl: res.fileUrl };
        setForm(updated);
        await onSave(updated);
        setMessage('Authorized signature updated successfully.');
      }
    } catch (err) {
      setMessage(err.message || 'Failed to upload signature.');
    } finally {
      setUploadingSignature(false);
      e.target.value = '';
    }
  };

  const handleRemoveSignature = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const updated = { ...form, signatureUrl: 'none' };
    setForm(updated);
    try {
      await onSave(updated);
      setMessage('Authorized signature removed successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to remove signature.');
    }
  };

  const handleRestoreSignature = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const updated = { ...form, signatureUrl: '/signature.jpg' };
    setForm(updated);
    try {
      await onSave(updated);
      setMessage('Default authorized signature restored successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to restore signature.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await onSave(form);
      setMessage('Settings updated successfully.');
    } catch (err) {
      setMessage(err.message || 'Failed to update settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Business Details Form */}
      <section className="bg-white rounded-md p-4 sm:p-7 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Gear size={24} weight="bold" className="text-navy-900" />
          <h2 className="text-lg font-bold text-slate-900">Business & Bank Details</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          These details auto-populate on newly generated invoices and quotations.
        </p>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.entries(labels).map(([key, label]) => (
              <label key={key} className="form-label">
                {label}
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  className="form-input"
                  required={key === 'companyName'}
                  maxLength={500}
                  placeholder={
                    key === 'phone'
                      ? '9011507220 (Default 1st number)'
                      : key === 'phone2'
                      ? 'e.g. 8888094770 (Adds below 1st number)'
                      : key === 'bankName'
                      ? 'e.g. AXIS BANK'
                      : key === 'bankBranch'
                      ? 'e.g. SASWAD'
                      : ''
                  }
                  value={form[key] || ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>

          {/* Official Company Stamp & Digital Signature Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Stamp size={20} weight="bold" className="text-navy-900" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Official Company Stamp & Digital Signature
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Uploaded stamp and signature are automatically applied to corporate tax invoices, duty slips, and official documents.
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Stamp Card */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SealCheck size={18} weight="bold" className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase">Official Company Stamp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        currentStamp
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {currentStamp ? 'Active' : 'Removed'}
                    </span>
                    {currentStamp ? (
                      <button
                        type="button"
                        onClick={handleRemoveStamp}
                        title="Remove Stamp"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded transition-colors cursor-pointer"
                      >
                        <X size={13} weight="bold" />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRestoreStamp}
                        title="Restore default Jagtap Travels stamp"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded transition-colors cursor-pointer"
                      >
                        <ArrowCounterClockwise size={13} weight="bold" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stamp Preview */}
                <div className={`bg-white border rounded-md p-3 flex items-center justify-center min-h-[140px] relative ${
                  currentStamp ? 'border-slate-200' : 'border-dashed border-slate-300'
                }`}>
                  {currentStamp ? (
                    <>
                      <img
                        src={currentStamp}
                        alt="Company Stamp"
                        className="h-28 w-28 object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        onError={(e) => {
                          e.currentTarget.src = '/stamp.jpg';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveStamp}
                        title="Remove Stamp"
                        className="absolute top-2 right-2 p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-4 text-center">
                      <SealCheck size={32} className="opacity-30 mb-1" />
                      <span className="text-xs font-bold text-slate-600">No stamp active</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Invoices will generate without a stamp</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleStampUpload}
                      disabled={uploadingStamp}
                    />
                    <span className="btn-primary w-full py-1.5 text-xs text-center justify-center cursor-pointer flex items-center gap-1.5">
                      <UploadSimple size={14} weight="bold" />
                      {uploadingStamp ? 'Uploading…' : 'Upload New Stamp'}
                    </span>
                  </label>

                  {currentStamp ? (
                    <button
                      type="button"
                      onClick={handleRemoveStamp}
                      title="Remove Current Stamp"
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X size={14} weight="bold" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRestoreStamp}
                      title="Restore default Jagtap Travels stamp"
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowCounterClockwise size={13} weight="bold" />
                      <span>Restore Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Signature Card */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PenNib size={18} weight="bold" className="text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase">Authorized Signature</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        currentSignature
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {currentSignature ? 'Active' : 'Removed'}
                    </span>
                    {currentSignature ? (
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        title="Remove Signature"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 rounded transition-colors cursor-pointer"
                      >
                        <X size={13} weight="bold" />
                        <span>Remove</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRestoreSignature}
                        title="Restore default Pranay signature"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 rounded transition-colors cursor-pointer"
                      >
                        <ArrowCounterClockwise size={13} weight="bold" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Preview */}
                <div className={`bg-white border rounded-md p-3 flex items-center justify-center min-h-[140px] relative ${
                  currentSignature ? 'border-slate-200' : 'border-dashed border-slate-300'
                }`}>
                  {currentSignature ? (
                    <>
                      <img
                        src={currentSignature}
                        alt="Authorized Signature"
                        className="h-24 w-auto max-w-[220px] object-contain"
                        style={{ mixBlendMode: 'multiply' }}
                        onError={(e) => {
                          e.currentTarget.src = '/signature.jpg';
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        title="Remove Signature"
                        className="absolute top-2 right-2 p-1.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-md shadow-xs transition-colors cursor-pointer"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 py-4 text-center">
                      <PenNib size={32} className="opacity-30 mb-1" />
                      <span className="text-xs font-bold text-slate-600">No signature active</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Invoices will generate without a signature</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleSignatureUpload}
                      disabled={uploadingSignature}
                    />
                    <span className="btn-primary w-full py-1.5 text-xs text-center justify-center cursor-pointer flex items-center gap-1.5">
                      <UploadSimple size={14} weight="bold" />
                      {uploadingSignature ? 'Uploading…' : 'Upload New Signature'}
                    </span>
                  </label>

                  {currentSignature ? (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      title="Remove Current Signature"
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X size={14} weight="bold" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRestoreSignature}
                      title="Restore default Pranay signature"
                      className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowCounterClockwise size={13} weight="bold" />
                      <span>Restore Default</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <p
              role="status"
              className={`text-xs font-semibold p-2.5 rounded-lg border ${
                message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {message}
            </p>
          )}

          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save Business Settings'}
          </button>
        </form>
      </section>

      <TeamUsers />
    </div>
  );
}
