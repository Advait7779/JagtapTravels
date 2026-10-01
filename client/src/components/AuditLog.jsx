import React, { useEffect, useState } from 'react';
import { ArrowClockwise, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '../services/api';
import { usePagination, PageSizeSelector, TablePaginationFooter } from './common/Pagination';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      setLogs(await api.getAuditLogs(200));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredLogs = logs.filter((entry) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (entry.action || '').toLowerCase().includes(term) ||
      (entry.userEmail || '').toLowerCase().includes(term) ||
      (entry.ip || '').toLowerCase().includes(term) ||
      (entry.outcome || '').toLowerCase().includes(term) ||
      String(entry.statusCode || '').includes(term)
    );
  });

  const {
    currentPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems: paginatedLogs,
  } = usePagination({ items: filteredLogs, initialPageSize: 10 });

  return (
    <section className="bg-white rounded-md p-4 sm:p-7 border border-slate-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={24} weight="bold" />
          <div>
            <h2 className="text-lg font-bold">Security Audit Log</h2>
            <p className="text-xs text-slate-500">
              Recent sign-ins, failures and record changes. Entries are integrity chained.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PageSizeSelector pageSize={pageSize} onPageSizeChange={setPageSize} />
          <button className="btn-primary" onClick={load} disabled={busy}>
            <ArrowClockwise size={17} /> {busy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full sm:w-80 md:w-96">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, user email, IP address, status code, outcome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-rose-700 text-sm mb-4">
          {error}
        </p>
      )}

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs">
            <thead>
              <tr className="text-left bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Outcome</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">IP</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`font-bold ${
                        entry.outcome === 'success' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {entry.outcome}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{entry.action}</td>
                  <td className="py-2.5 px-3">{entry.userEmail || 'Unauthenticated'}</td>
                  <td className="py-2.5 px-3 font-mono">{entry.ip || '—'}</td>
                  <td className="py-2.5 px-3">{entry.statusCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!busy && !logs.length && (
            <p className="py-8 text-center text-slate-500">No audit events recorded yet.</p>
          )}
        </div>

        <TablePaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredLogs.length}
          onPageChange={setPage}
          label="audit records"
        />
      </div>
    </section>
  );
}
