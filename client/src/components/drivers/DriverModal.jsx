import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Award,
  Car,
  MapPin,
  AlertCircle,
  IndianRupee,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import ThemedSelect from '../ThemedSelect';
import { api } from '../../services/api';

export default function DriverModal({ isOpen, onClose, onSave, driverToEdit, canManageDocuments = true, canManageSalary = true }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    vehicleAssigned: '',
    vehicleNumber: '',
    experienceYears: 5,
    baseSalary: 20000,
    status: 'Available',
    licenseExpiryDate: '',
    badgeExpiryDate: '',
    address: '',
    emergencyContact: '',
    notes: '',
  });

  const [documents, setDocuments] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadSuccess, setDocUploadSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (driverToEdit) {
      setFormData({
        name: driverToEdit.name || '',
        phone: driverToEdit.phone || '',
        licenseNumber: driverToEdit.licenseNumber || driverToEdit.license_number || '',
        vehicleAssigned: driverToEdit.vehicleAssigned || driverToEdit.vehicle_assigned || '',
        vehicleNumber: driverToEdit.vehicleNumber || driverToEdit.vehicle_number || '',
        experienceYears: driverToEdit.experienceYears || driverToEdit.experience_years || 0,
        baseSalary: driverToEdit.baseSalary !== undefined ? driverToEdit.baseSalary : 20000,
        status: driverToEdit.status || 'Available',
        licenseExpiryDate: driverToEdit.licenseExpiryDate || '',
        badgeExpiryDate: driverToEdit.badgeExpiryDate || '',
        address: driverToEdit.address || '',
        emergencyContact: driverToEdit.emergencyContact || driverToEdit.emergency_contact || '',
        notes: driverToEdit.notes || '',
      });
      setDocuments(driverToEdit.documents || []);
    } else {
      setFormData({
        name: '',
        phone: '',
        licenseNumber: '',
        vehicleAssigned: 'Toyota Innova Crysta',
        vehicleNumber: '',
        experienceYears: 5,
        baseSalary: 20000,
        status: 'Available',
        licenseExpiryDate: '',
        badgeExpiryDate: '',
        address: '',
        emergencyContact: '',
        notes: '',
      });
      setDocuments([]);
    }
    setPendingFile(null);
    setError('');
    setDocUploadSuccess('');
  }, [driverToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only genuine PDF, JPEG, PNG and WebP files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('License document file size must be less than 10 MB.');
      return;
    }

    setError('');
    setDocUploadSuccess('');

    // If editing existing driver with ID, upload immediately
    if (driverToEdit?.id) {
      try {
        setUploadingDoc(true);
        const res = await api.uploadDriverDocument(driverToEdit.id, {
          file,
          documentType: "Driver's License",
          title: `${formData.name || 'Driver'} License`,
        });

        if (res?.document) {
          setDocuments((prev) => [res.document, ...prev]);
          setDocUploadSuccess('License document uploaded from system successfully!');
        }
      } catch (err) {
        setError(err.message || 'Failed to upload license document.');
      } finally {
        setUploadingDoc(false);
        e.target.value = '';
      }
    } else {
      // If registering new driver, stage the file from system
      setPendingFile(file);
      setDocUploadSuccess(`File "${file.name}" selected from system. It will be uploaded automatically when you save the driver.`);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!driverToEdit?.id) return;
    try {
      setError('');
      await api.deleteDriverDocument(driverToEdit.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err.message || 'Failed to delete document.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.licenseNumber.trim()) {
      setError('Driver Name, Phone, and License Number are required.');
      return;
    }

    setLoading(true);
    try {
      const savedDriver = await onSave(
        {
          ...formData,
          ...(canManageSalary ? { baseSalary: Number(formData.baseSalary) || 20000 } : {}),
          experienceYears: Number(formData.experienceYears) || 0,
        },
        driverToEdit?.id,
      );

      // If user selected a license file from system, upload it now
      if (canManageDocuments && pendingFile) {
        const targetId = savedDriver?.id || driverToEdit?.id;
        if (targetId) {
          await api.uploadDriverDocument(targetId, {
            file: pendingFile,
            documentType: "Driver's License",
            title: `${formData.name || 'Driver'} License`,
          });
        }
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save driver information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-md sm:rounded-md shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden my-auto sm:my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-navy-950 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold">
              {driverToEdit ? 'Edit Driver Information' : 'Add New Driver'}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Register licensed drivers, set monthly base salary, and attach license documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {docUploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{docUploadSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Driver Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Driver Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Santosh Patil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 97654 32101"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            {/* License Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Driving License Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH12 20150034521"
                  value={formData.licenseNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })
                  }
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 uppercase focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Base Monthly Salary */}
            {canManageSalary && <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-navy-900" />
                <span>Base Monthly Salary (₹) <span className="text-rose-500">*</span></span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="20000"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>}

            {/* License & Badge Expiry Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md border border-slate-200 sm:col-span-2">
              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  License Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.licenseExpiryDate}
                  onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-slate-700 mb-1">
                  Badge / Police Verification Expiry
                </label>
                <input
                  type="date"
                  value={formData.badgeExpiryDate}
                  onChange={(e) => setFormData({ ...formData, badgeExpiryDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Driving Experience (Years)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="50"
                placeholder="5"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Availability
              </label>
              <ThemedSelect
                className="form-input"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available for Trip</option>
                <option value="On Trip">Currently On Trip</option>
                <option value="Off Duty">Off Duty / Leave</option>
              </ThemedSelect>
            </div>

            {/* Assigned Vehicle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Vehicle Model
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Car className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Toyota Innova Crysta / Ertiga"
                  value={formData.vehicleAssigned}
                  onChange={(e) => setFormData({ ...formData, vehicleAssigned: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Vehicle Registration Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                placeholder="e.g. MH 12 QX 4589"
                value={formData.vehicleNumber}
                onChange={(e) =>
                  setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })
                }
                className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 uppercase focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>

            {/* Emergency Contact */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Contact
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  placeholder="e.g. +91 97654 32102"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* License Document Upload & Management */}
          {canManageDocuments && <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-navy-900" />
                <span>Driver's License Document (Scan / PDF)</span>
              </label>
              <label className="px-2.5 py-1 bg-navy-900 hover:bg-navy-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingDoc ? 'Uploading...' : 'Upload License from System'}</span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden"
                />
              </label>
            </div>

            {/* Staged file selected from system for new driver */}
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
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {doc.title || doc.fileName || 'License Document'}
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
                No license document attached yet. Click "Upload License from System" above to select a PDF or photo from your computer.
              </p>
            ) : null}
          </div>}

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Residential Area / Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Hadapsar, Pune"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Driver Skills & Route Expertise
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Fluent in Marathi and Hindi. Hill station expert for Mahabaleshwar and Konkan."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-navy-900 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg shadow-sm transition-all disabled:opacity-50 text-center"
            >
              {loading ? 'Saving...' : driverToEdit ? 'Update Driver' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
