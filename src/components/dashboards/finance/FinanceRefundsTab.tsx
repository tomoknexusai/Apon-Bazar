import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
  FileCheck,
  Building,
  Check,
  RotateCcw
} from 'lucide-react';
import { FinanceRefundRecord } from '../../../types';

interface FinanceRefundsTabProps {
  language: 'bn' | 'en';
  refunds: FinanceRefundRecord[];
  onProcessRefund: (refundId: string) => void;
  onRejectRefund: (refundId: string, reason: string) => void;
}

export const FinanceRefundsTab: React.FC<FinanceRefundsTabProps> = ({
  language,
  refunds,
  onProcessRefund,
  onRejectRefund
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRefunds = useMemo(() => {
    return refunds.filter((r) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        r.refundId.toLowerCase().includes(search) ||
        r.orderId.toLowerCase().includes(search) ||
        r.customerId.toLowerCase().includes(search) ||
        r.customerName.toLowerCase().includes(search) ||
        r.reason.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [refunds, searchTerm, statusFilter]);

  const totalRefundAmount = useMemo(() => {
    return filteredRefunds.reduce((acc, r) => acc + r.refundAmount, 0);
  }, [filteredRefunds]);

  const processedRefundAmount = useMemo(() => {
    return filteredRefunds
      .filter((r) => r.status === 'Refunded')
      .reduce((acc, r) => acc + r.refundAmount, 0);
  }, [filteredRefunds]);

  const pendingRefundAmount = useMemo(() => {
    return filteredRefunds
      .filter((r) => r.status === 'Requested' || r.status === 'Under Review' || r.status === 'Approved')
      .reduce((acc, r) => acc + r.refundAmount, 0);
  }, [filteredRefunds]);

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  return (
    <div className="space-y-6">
      {/* Top Refund KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট দাবি করা রিফান্ড' : 'Total Claimed Refunds'}
            </span>
            <RefreshCw className="w-4 h-4 text-orange-400" />
          </div>
          <h4 className="text-xl font-black text-white mt-1">{formatTk(totalRefundAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredRefunds.length} {isBn ? 'টি রিটার্ন ও রিফান্ড ক্লেইম' : 'return & refund claims'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'অনুমোদিত ও পরিশোধিত রিফান্ড' : 'Settled Customer Refunds'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1">{formatTk(processedRefundAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'গ্রাহক বিকাশ/ওয়ালেটে অর্থ ফেরত সম্পন্ন' : 'Direct bKash/wallet reversal'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'পেন্ডিং রিফান্ড পর্যালোচনা' : 'Pending Verification'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1">{formatTk(pendingRefundAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'পণ্য ওয়্যারহাউস রিসিভ ও কোয়ালিটি চেক' : 'Warehouse QC verification'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'রিফান্ড আইডি, অর্ডার, গ্রাহক বা কারণ দিয়ে খুঁজুন...' : 'Search Refund ID, Order or Customer...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল রিফান্ড স্ট্যাটাস' : 'All Refund Statuses'}</option>
            <option value="Refunded">{isBn ? 'রিফান্ড সম্পন্ন (Refunded)' : 'Refunded'}</option>
            <option value="Approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved'}</option>
            <option value="Under Review">{isBn ? 'আন্ডার রিভিউ (Under Review)' : 'Under Review'}</option>
            <option value="Requested">{isBn ? 'অনুরোধকৃত (Requested)' : 'Requested'}</option>
            <option value="Rejected">{isBn ? 'বাতিলকৃত (Rejected)' : 'Rejected'}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBn ? 'রিফান্ড আইডি ও অর্ডার' : 'Refund & Order ID'}</th>
                <th className="py-3.5 px-4">{isBn ? 'গ্রাহক তথ্য' : 'Customer Info'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'মূল অর্ডার মূল্য' : 'Original Amount'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'রিফান্ড অর্থ' : 'Refund Amount'}</th>
                <th className="py-3.5 px-4">{isBn ? 'রিফান্ডের কারণ' : 'Refund Reason'}</th>
                <th className="py-3.5 px-4">{isBn ? 'মাধ্যম' : 'Method'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অনুমোদনকারী' : 'Approved By'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    {isBn ? 'কোনো রিফান্ড রেকর্ড পাওয়া যায়নি' : 'No refund records found'}
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((ref) => (
                  <tr key={ref.refundId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 font-mono">{ref.refundId}</div>
                      <div className="text-[11px] text-emerald-400 font-mono">{ref.orderId}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{ref.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ref.customerId}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-400">
                      {formatTk(ref.originalOrderAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-orange-400 font-mono text-sm">
                      {formatTk(ref.refundAmount)}
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="truncate text-slate-200" title={ref.reason}>
                        {ref.reason}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-[11px]">
                      {ref.refundMethod}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ref.status === 'Refunded'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : ref.status === 'Approved'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : ref.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ref.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                      {ref.approvedBy || (isBn ? 'অপেক্ষমাণ' : 'Pending')}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {ref.status === 'Approved' || ref.status === 'Requested' || ref.status === 'Under Review' ? (
                        <button
                          onClick={() => onProcessRefund(ref.refundId)}
                          className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold border border-orange-500/40 transition-all flex items-center gap-1 mx-auto"
                          title="রিফান্ড প্রসেস ও লেজার ব্যালেন্সিং করুন"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isBn ? 'প্রসেস রিফান্ড' : 'Process Refund'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">{isBn ? 'সম্পন্ন' : 'Completed'}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
