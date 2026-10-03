import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  User,
  Gauge,
  Settings,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import ThemedSelect from '../ThemedSelect';
import ThemedDatePicker from '../ThemedDatePicker';
import { api } from '../../services/api';

export default function VehicleModal({
  isOpen,
  onClose,
  onSave,
  vehicleToEdit = null,
  drivers = [],
  canManageDocuments = true,
}) {
  const [formData, setFormData] = useState({
    name: '',
    vehicleNumber: '',
    model: '',
    fuelType: 'Diesel',
    driverId: '',
    driverName: '',
    currentOdometer: '',
    lastServiceKm: '0',
    serviceIntervalKm: '30000',
    insuranceExpiryDate: '',
    pucExpiryDate: '',
    fitnessExpiryDate: '',
    permitExpiryDate: '',
    taxExpiryDate: '',
    rcExpiryDate: '',
    notes: '',
  });

  const [documents, setDocuments] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docSuccess, setDocSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicleToEdit) {
      setFormData({
        name: vehicleToEdit.name || '',
        vehicleNumber: vehicleToEdit.vehicleNumber || '',
        model: vehicleToEdit.model || '',
        fuelType: vehicleToEdit.fuelType || 'Diesel',
        driverId: vehicleToEdit.driverId || '',
        driverName: vehicleToEdit.driverName || '',
        currentOdometer: vehicleToEdit.currentOdometer ?? '',
        lastServiceKm: vehicleToEdit.lastServiceKm ?? '0',
        serviceIntervalKm: vehicleToEdit.serviceIntervalKm ?? '30000',
        insuranceExpiryDate: vehicleToEdit.insuranceExpiryDate || '',
        pucExpiryDate: vehicleToEdit.pucExpiryDate || '',
        fitnessExpiryDate: vehicleToEdit.fitnessExpiryDate || '',
        permitExpiryDate: vehicleToEdit.permitExpiryDate || '',
        taxExpiryDate: vehicleToEdit.taxExpiryDate || '',
        rcExpiryDate: vehicleToEdit.rcExpiryDate || '',
        notes: vehicleToEdit.notes || '',
      });
      setDocuments(vehicleToEdit.documents || []);
    } else {
      setFormData({
        name: '',
        vehicleNumber: '',
        model: 'Maruti Suzuki Ertiga',
        fuelType: 'Diesel',
        driverId: '',
        driverName: '',
        currentOdometer: '',
        lastServiceKm: '0',
        serviceIntervalKm: '30000',
        insuranceExpiryDate: '',
        pucExpiryDate: '',
        fitnessExpiryDate: '',
        permitExpiryDate: '',
        taxExpiryDate: '',
        rcExpiryDate: '',
        notes: '',
      });
      setDocuments([]);
    }
    setPendingFile(null);
    setError('');
    setDocSuccess('');
  }, [isOpen, vehicleToEdit]);

  if (!isOpen) return null;

  const handleDriverChange = (e) => {
    const dId = e.target.value;
    const found = drivers.find((d) => String(d.id) === String(dId));
    setFormData((prev) => ({
      ...prev,
      driverId: dId,
      driverName: found ? found.name : '',
    }));
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only genuine PDF, JPEG, PNG and WebP files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Document file size must be less than 10 MB.');
      return;
    }

    setError('');
    setDocSuccess('');

    if (vehicleToEdit?.id) {
      try {
        setUploadingDoc(true);
        const res = await api.uploadVehicleDocument(vehicleToEdit.id, {
          file,
          documentType: 'Vehicle Registration Certificate (RC)',
          title: `${formData.vehicleNumber || 'Vehicle'} RC`,
        });

        if (res?.document) {
          setDocuments((prev) => [res.document, ...prev]);
          setDocSuccess('Vehicle RC document uploaded from system successfully!');
        }
      } catch (err) {
        setError(err.message || 'Failed to upload vehicle document.');
      } finally {
        setUploadingDoc(false);
        e.target.value = '';
      }
    } else {
      setPendingFile(file);
      setDocSuccess(`File "${file.name}" selected from system. It will be uploaded automatically when you save the vehicle.`);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!vehicleToEdit?.id) return;
    try {
      setError('');
      await api.deleteVehicleDocument(vehicleToEdit.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err.message || 'Failed to delete vehicle document.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.vehicleNumber.trim()) {
      setError('Vehicle name and registration plate number are required.');
      return;
    }

    setSaving(true);
    try {
      const savedVehicle = await onSave(
        {
          ...formData,
          currentOdometer: Number(formData.currentOdometer) || 0,
          lastServiceKm: Number(formData.lastServiceKm) || 0,
          serviceIntervalKm: Number(formData.serviceIntervalKm) || 30000,
        },
        vehicleToEdit?.id,
      );

      if (pendingFile) {
        const targetId = savedVehicle?.id || vehicleToEdit?.id;
        if (targetId) {
          await api.uploadVehicleDocument(targetId, {
            file: pendingFile,
            documentType: 'Vehicle Registration Certificate (RC)',
            title: `${formData.vehicleNumber || 'Vehicle'} RC`,
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save vehicle details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif] overflow-y-auto">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">
                {vehicleToEdit ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Configure vehicle specifications, RC registration, and RTO compliance dates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {docSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>{docSuccess}</span>
            </div>
          )}

          {/* Vehicle Name & Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vehicle Model / Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota Innova Crysta"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registration Plate <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MH 12 QX 4589"
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
              />
            </div>
          </div>

          {/* Fuel & Driver Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel / Powertrain Type
              </label>
              <ThemedSelect
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full form-input"
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric (EV)</option>
              </ThemedSelect>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Fleet Driver</span>
              </label>
              <ThemedSelect
                value={formData.driverId}
                onChange={handleDriverChange}
                className="w-full form-input"
              >
                <option value="">Unassigned (General Fleet)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </ThemedSelect>
            </div>
          </div>

          {/* Odometers & Maintenance */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-600" />
              <span>Odometer & Maintenance Schedule</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Odometer (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 45200"
                  value={formData.currentOdometer}
                  onChange={(e) => setFormData({ ...formData, currentOdometer: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">
                  Last Serviced at (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 0 or 30000"
                  value={formData.lastServiceKm}
                  onChange={(e) => setFormData({ ...formData, lastServiceKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-700 mb-1 whitespace-nowrap">
                  Interval Target (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.serviceIntervalKm}
                  onChange={(e) => setFormData({ ...formData, serviceIntervalKm: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Default is 30,000 KM. The system will activate reminders when cumulative distance reaches this interval.
            </p>
          </div>

          {/* RTO Documents Compliance & Expiry Dates */}
          <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>RTO Document Expiry Dates (PUC, RC, Fitness & Tax Alerts)</span>
            </h4>

            <div className="space-y-3">
              {/* 1st 3 in a row */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="RC (Registration) Expiry">
                    RC (Registration) Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.rcExpiryDate}
                    onChange={(e) => setFormData({ ...formData, rcExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="PUC Expiry">
                    PUC Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.pucExpiryDate}
                    onChange={(e) => setFormData({ ...formData, pucExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="Insurance Expiry">
                    Insurance Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.insuranceExpiryDate}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>
              </div>

              {/* 2nd 3 in a row */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="Fitness Cert Expiry">
                    Fitness Cert Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.fitnessExpiryDate}
                    onChange={(e) => setFormData({ ...formData, fitnessExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="Tourist Permit Expiry">
                    Tourist Permit Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.permitExpiryDate}
                    onChange={(e) => setFormData({ ...formData, permitExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>

                <div className="flex flex-col min-w-0">
                  <label className="text-[11px] font-bold text-slate-700 mb-1.5 h-7 flex items-end leading-tight truncate" title="Road Tax Expiry">
                    Road Tax Expiry
                  </label>
                  <ThemedDatePicker
                    value={formData.taxExpiryDate}
                    onChange={(e) => setFormData({ ...formData, taxExpiryDate: e.target.value })}
                    placeholder="dd - mm - yyyy"
                    className="w-full py-1.5 text-xs font-mono"
                    containerClassName="w-full"
                  />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * The CRM will automatically warn on the Dashboard and Fleet table within 30 days of expiry.
            </p>
          </div>

          {/* Vehicle RC Document Upload & Management */}
          {canManageDocuments && <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-navy-900" />
                <span>Vehicle RC Document (Scan / PDF)</span>
              </label>
              <label className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingDoc ? 'Uploading...' : 'Upload RC from System'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleDocUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
            </div>

            {/* Staged file selected from system for new vehicle */}
            {pendingFile && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-emerald-950 truncate">{pendingFile.name}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      {(pendingFile.size / 1024).toFixed(1)} KB • Selected from system (will be uploaded automatically on save)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors ml-2 shrink-0"
                  title="Remove selected file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {documents.length > 0 ? (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {doc.title || doc.fileName || 'Vehicle Document'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded transition-colors"
                        title="View Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !pendingFile ? (
              <p className="text-[11px] text-slate-500 italic">
                No RC document attached yet. Click "Upload RC from System" above to select a PDF or image scan from your computer.
              </p>
            ) : null}
          </div>}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Vehicle Notes / Usage Info</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Dedicated corporate vehicle, Fastag enabled"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-navy-950 hover:bg-navy-900 text-white text-xs font-bold rounded-md shadow-md transition-all flex items-center gap-2"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>
                {saving ? 'Saving...' : vehicleToEdit ? 'Save Changes' : 'Register Vehicle'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
