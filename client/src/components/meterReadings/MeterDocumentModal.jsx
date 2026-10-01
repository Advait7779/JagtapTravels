import React, { useState, useEffect } from 'react';
import {
  X,
  FilePdf,
  UploadSimple,
  Trash,
  DownloadSimple,
  ArrowSquareOut,
  Car,
  Plus,
  CheckCircle,
  Warning,
  FileText,
} from '@phosphor-icons/react';
import { api } from '../../services/api';
import ThemedSelect from '../ThemedSelect';
import ConfirmModal from '../ConfirmModal';
import { formatDate } from '../../utils/formatters';

const DOCUMENT_TYPES = [
  'Registration Certificate (RC)',
  'Vehicle Insurance Policy',
  'PUC Certificate',
  'All India Tourist Permit',
  'Fitness Certificate',
  'Signed Duty Slip Scan',
  'Toll / Parking Receipt',
  'Other Vehicle Document',
];

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function MeterDocumentModal({ isOpen, onClose, reading, onDocumentsUpdated }) {
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'upload'
  const [documentType, setDocumentType] = useState('Registration Certificate (RC)');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (reading) {
      setDocuments(reading.documents || []);
      setError('');
      setSuccess('');
      // Default to upload tab if no documents yet, otherwise list
      setActiveTab(reading.documents && reading.documents.length > 0 ? 'list' : 'upload');
      fetchLatestDocuments();
    }
  }, [reading, isOpen]);

  const fetchLatestDocuments = async () => {
    if (!reading?.id) return;
    try {
      const docs = await api.getMeterDocuments(reading.id);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch {
      // Fall back to reading.documents
    }
  };

  if (!isOpen || !reading) return null;

  const slipNo = reading.slipNumber || reading.slip_number || 'Duty Slip';
  const vehName = reading.vehicleName || reading.vehicle_name || 'Fleet Vehicle';
  const vehPlate = reading.vehicleNumber || reading.vehicle_number || '';

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    // Validate file type (PDF and images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = selectedFile.name.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((extension) =>
      lowerName.endsWith(extension),
    );
    if (!hasAllowedExtension || (selectedFile.type && !allowedTypes.includes(selectedFile.type))) {
      setError('Please upload a PDF, JPEG, PNG, or WebP document.');
      return;
    }

    // Match the server limit so oversized files fail before network transfer.
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit. Please upload a smaller document.');
      return;
    }

    setError('');
    setFile(selectedFile);
    if (!title) {
      // Auto fill title from filename without extension
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drop a PDF or image document to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        documentType,
        title: title.trim() || file.name,
        file,
        notes: notes.trim(),
      };

      const result = await api.uploadMeterDocument(reading.id, payload);
      const newDoc = result.document;

      setDocuments((prev) => [newDoc, ...prev]);
      setSuccess('Document uploaded successfully!');
      setFile(null);
      setTitle('');
      setNotes('');
      setActiveTab('list');

      if (onDocumentsUpdated) {
        onDocumentsUpdated();
      }
    } catch (err) {
      setError(err.message || 'Failed to upload document. Please check file and retry.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!docToDelete) return;
    const docId = docToDelete.id;
    setDeletingId(docId);
    setError('');
    try {
      await api.deleteMeterDocument(reading.id, docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setSuccess('Document removed.');
      if (onDocumentsUpdated) {
        onDocumentsUpdated();
      }
      setDocToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'Registration Certificate (RC)':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Vehicle Insurance Policy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PUC Certificate':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'All India Tourist Permit':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Fitness Certificate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Signed Duty Slip Scan':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Toll / Parking Receipt':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif] overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-navy-950 to-navy-900 text-white flex items-center justify-between border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FilePdf size={22} weight="bold" className="text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
                  Vehicle & Duty Slip Documents
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 text-[10px] font-mono font-bold">
                  {slipNo}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <Car size={13} weight="bold" className="text-blue-300 shrink-0" />
                <span>{vehName}</span>
                {vehPlate && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-400/30">
                    {vehPlate}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 sm:px-6 pt-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-navy-900 text-navy-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} weight="bold" />
            <span>Attached Documents</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                documents.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {documents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-navy-900 text-navy-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus size={15} weight="bold" />
            <span>Upload New Document</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
            <Warning size={16} weight="bold" className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle size={16} weight="bold" className="shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto">
          {activeTab === 'list' ? (
            /* Document List Tab */
            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-14 h-14 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-500">
                    <FilePdf size={28} weight="bold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Documents Uploaded Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Upload vehicle RC, Insurance Policy, PUC, Permit, or Duty Slip files for safe
                      keeping and quick access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-md text-xs font-bold transition-all shadow-sm"
                  >
                    <UploadSimple size={14} weight="bold" />
                    <span>Upload First Document</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {documents.map((doc) => {
                    const isPdf =
                      doc.mimeType === 'application/pdf' ||
                      (doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf'));
                    return (
                      <div
                        key={doc.id}
                        className="p-3.5 sm:p-4 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-600">
                            {isPdf ? (
                              <FilePdf size={22} weight="bold" />
                            ) : (
                              <FileText size={22} weight="bold" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTypeBadgeColor(
                                  doc.documentType,
                                )}`}
                              >
                                {doc.documentType}
                              </span>
                              <h5 className="font-bold text-slate-900 text-xs truncate max-w-[260px] sm:max-w-xs">
                                {doc.title || doc.fileName}
                              </h5>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                              <span className="font-mono text-slate-700 truncate max-w-[180px]">
                                {doc.fileName}
                              </span>
                              <span>•</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span>{formatDate(doc.uploadedAt)}</span>
                            </div>
                            {doc.notes && (
                              <p className="text-[11px] text-slate-600 mt-1 bg-slate-100/80 px-2 py-0.5 rounded italic">
                                "{doc.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Document Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* View PDF / Open in new window */}
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all shadow-xs"
                            title="View document"
                          >
                            <ArrowSquareOut size={13} weight="bold" />
                            <span>View</span>
                          </a>

                          {/* Download */}
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="Download Document"
                          >
                            <DownloadSimple size={15} weight="bold" />
                          </a>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDocToDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
                            title="Delete Document"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Upload New Document Form Tab */
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Document Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Category <span className="text-rose-500">*</span>
                </label>
                <ThemedSelect
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </ThemedSelect>
              </div>

              {/* Document Title / Label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Innova RC Book 2026, Comprehensive Insurance..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
                />
              </div>

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Document File <span className="text-rose-500">*</span>
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-md p-5 sm:p-6 text-center transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/60'
                      : file
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    id="doc-file-upload"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <FilePdf size={26} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {formatFileSize(file.size)} • {file.type || 'Document'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                        }}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline mt-1"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="doc-file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                        <UploadSimple size={24} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Click to browse or drag and drop a document here
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supports PDF, PNG, JPEG or WebP files up to 10 MB
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Validity / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valid until Dec 2026, Policy # 123456789..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-900 transition-all shadow-2xs"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-md border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-navy-900 hover:bg-navy-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.99]"
                >
                  <UploadSimple size={16} weight="bold" />
                  <span>{uploading ? 'Uploading document...' : 'Save & Attach Document'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle size={14} weight="bold" className="text-emerald-600" />
            <span>Protected administrator-only document storage</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-navy-950 hover:underline"
          >
            Done
          </button>
        </div>
      </div>

      {docToDelete && (
        <ConfirmModal
          isOpen={!!docToDelete}
          onClose={() => {
            if (!deletingId) setDocToDelete(null);
          }}
          onConfirm={confirmDeleteDoc}
          title="Delete Vehicle Document"
          message={`Are you sure you want to delete "${
            docToDelete.title || docToDelete.fileName
          }"?`}
          confirmText="Delete Document"
          loading={!!deletingId}
        />
      )}
    </div>
  );
}
