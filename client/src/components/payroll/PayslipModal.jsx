import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  User,
  Car,
  Calendar,
  CurrencyInr,
  CheckCircle,
} from '@phosphor-icons/react';
import { formatINR, formatDate, localDate } from '../../utils/formatters';

export default function PayslipModal({
  isOpen,
  onClose,
  payrollItem = null,
  selectedMonth = localDate().slice(0, 7),
  company = {
    name: 'Jagtap Travels',
    address: 'Pune, Maharashtra, India',
    phone: '+91 98220 00000',
    email: 'info@jagtaptravels.com',
  },
}) {
  const printRef = useRef(null);

  if (!isOpen || !payrollItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const advances = payrollItem.advances || [];
  const baseSalary = Number(payrollItem.baseSalary) || 0;
  const totalAdvances = Number(payrollItem.totalAdvances) || 0;
  const netPayable = Number(payrollItem.remainingSalary) || 0;

  // Format month name (e.g. September 2026)
  const [year, monthNum] = selectedMonth.split('-');
  const monthDate = new Date(parseInt(year, 10), parseInt(monthNum, 10) - 1, 1);
  const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-none print:m-0 print:max-w-none">
        {/* Modal Controls (Hidden in Print) */}
        <div className="bg-navy-950 p-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm">
            <FileText size={18} className="text-amber-400" />
            <span>Driver Salary Slip & Disbursal Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-navy-950 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer size={15} weight="bold" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div ref={printRef} className="p-6 sm:p-8 space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Header */}
          <div className="border-b-2 border-navy-950 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-navy-950">
                {company.name || 'Jagtap Travels'}
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {company.address || 'Pune, Maharashtra'} • Phone: {company.phone || '+91 98220 00000'}
              </p>
              <p className="text-xs text-slate-500">Email: {company.email || 'info@jagtaptravels.com'}</p>
            </div>

            <div className="text-left sm:text-right bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Salary Slip Period
              </span>
              <span className="text-sm font-black text-navy-950">{monthName}</span>
              <div className="text-[10px] text-slate-500 mt-0.5">Voucher Date: {new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          {/* Driver Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Driver Name</span>
              <span className="font-bold text-slate-900">{payrollItem.driverName}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
              <span className="font-semibold text-slate-800">{payrollItem.phone || '-'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Assigned Vehicle</span>
              <span className="font-semibold text-slate-800">{payrollItem.vehicleNumber || payrollItem.vehicleAssigned || 'General Pool'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Status</span>
              <span className="font-black text-navy-950">{payrollItem.status}</span>
            </div>
          </div>

          {/* Salary Statement Table */}
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-white font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Earnings / Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4">Deductions (Advances Taken)</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-3 px-4 align-top">
                    <div className="font-bold text-slate-900">Base Monthly Fixed Salary</div>
                    <div className="text-[10px] text-slate-500">Agreed monthly driver compensation</div>
                  </td>
                  <td className="py-3 px-4 text-right align-top font-bold text-slate-900">
                    {formatINR(baseSalary)}
                  </td>
                  <td className="py-3 px-4 align-top" colSpan={2}>
                    {advances.length === 0 ? (
                      <div className="text-slate-400 italic py-1">No advance deductions this month</div>
                    ) : (
                      <div className="space-y-1.5">
                        {advances.map((adv, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-600">
                              {formatDate(adv.date)} ({adv.paymentMode || 'Cash'}) {adv.notes ? `- ${adv.notes}` : ''}
                            </span>
                            <span className="font-semibold text-rose-700">
                              {formatINR(adv.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-slate-700">Gross Monthly Salary:</td>
                  <td className="py-2.5 px-4 text-right text-slate-900">{formatINR(baseSalary)}</td>
                  <td className="py-2.5 px-4 text-slate-700">Total Advances Deducted:</td>
                  <td className="py-2.5 px-4 text-right text-rose-700 font-black">
                    - {formatINR(totalAdvances)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Net Disbursable Box */}
          <div className="p-4 bg-navy-950 text-white rounded-md flex items-center justify-between shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                Net Salary Payable / Disbursed
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Amount payable after adjusting all mid-month advances for {monthName}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {formatINR(netPayable)}
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs text-slate-600">
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                {payrollItem.driverName}
              </div>
              <span>Driver Signature / Thumb Impression</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-1 mb-1 font-semibold text-slate-800">
                For {company.name || 'Jagtap Travels'}
              </div>
              <span>Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
