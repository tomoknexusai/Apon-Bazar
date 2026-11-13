import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Building,
  Check,
  FileCheck,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { BankReconciliationItem } from '../../../types';

interface FinanceReconciliationTabProps {
  language: 'bn' | 'en';
  reconciliations: BankReconciliationItem[];
  onMatchReconciliation: (reconciliationId: string) => void;
}

export const FinanceReconciliationTab: React.FC<FinanceReconciliationTabProps> = ({
  language,
  reconciliations,
  onMatchReconciliation
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredItems = useMemo(() => {
    return reconciliations.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.reconciliationId.toLowerCase().includes(search) ||
        item.transactionId.toLowerCase().includes(search) ||
        item.bankName.toLowerCase().includes(search) ||
        (item.notes && item.notes.toLowerCase().includes(search));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reconciliations, searchTerm, statusFilter]);

  const matchedCount = useMemo(() => {
    return reconciliations.filter((r) => r.status === 'Matched' || r.status === 'Reconciled').length;
  }, [reconciliations]);

  const unmatchedCount = useMemo(() => {
    return reconciliations.filter((r) => r.status === 'Unmatched' || r.status === 'Partially Matched' || r.status === 'Investigating').length;
  }, [reconciliations]);

  const totalDifference = useMemo(() => {
    return filteredItems.reduce((acc, r) => acc + Math.abs(r.difference), 0);
  }, [filteredItems]);

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  return (
    <div className="space-y-6">
      {/* Top Reconciliation Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'সফল রিকনসিলেশন হার' : 'Reconciliation Match Rate'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1">
            {reconciliations.length > 0
              ? `${Math.round((matchedCount / reconciliations.length) * 100)}%`
              : '100%'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {matchedCount} / {reconciliations.length} {isBn ? 'টি স্টেটমেন্ট ট্রানজ্যাকশন মিলেছে' : 'transactions verified'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'তদন্তাধীন অমিল (Unmatched)' : 'Pending Resolution'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1">{unmatchedCount}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'ব্যাংক ও সিস্টেম ফি বা টাইমিং পার্থক্য' : 'Bank fee or in-transit variance'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট পার্থক্য অংক (Variance)' : 'Total Net Variance'}
            </span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-cyan-400 mt-1">{formatTk(totalDifference)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'অটো-সমন্বয় প্রক্রিয়া চলমান' : 'Auto-adjustments identified'}
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
              placeholder={isBn ? 'ট্রানজ্যাকশন আইডি, ব্যাংক নাম বা বিবরণ দিয়ে খুঁজুন...' : 'Search TrxID, Bank name or notes...'}
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
            <option value="all">{isBn ? 'সকল রিকনসিলেশন স্ট্যাটাস' : 'All Statuses'}</option>
            <option value="Matched">{isBn ? 'ম্যাচড (Matched)' : 'Matched'}</option>
            <option value="Reconciled">{isBn ? 'রিকনসাইল্ড (Reconciled)' : 'Reconciled'}</option>
            <option value="Partially Matched">{isBn ? 'আংশিক অমিল' : 'Partially Matched'}</option>
            <option value="Unmatched">{isBn ? 'অমিল (Unmatched)' : 'Unmatched'}</option>
            <option value="Investigating">{isBn ? 'তদন্তাধীন (Investigating)' : 'Investigating'}</option>
          </select>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBn ? 'রিকনসিলেশন আইডি ও ট্রানজ্যাকশন' : 'Reconciliation & Trx ID'}</th>
                <th className="py-3.5 px-4">{isBn ? 'ব্যাংক / গেটওয়ে নাম' : 'Bank / Gateway Account'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'সিস্টেম রেকর্ডকৃত অর্থ' : 'System Amount'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'ব্যাংক স্টেটমেন্ট অর্থ' : 'Bank Statement Amount'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'পার্থক্য (Difference)' : 'Variance'}</th>
                <th className="py-3.5 px-4">{isBn ? 'স্টেটমেন্ট তারিখ' : 'Statement Date'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অডিট পর্যবেক্ষণ নোট' : 'Audit Remarks'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    {isBn ? 'কোনো রিকনসিলেশন আইটেম পাওয়া যায়নি' : 'No reconciliation items found'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.reconciliationId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 font-mono">{item.reconciliationId}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{item.transactionId}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{item.bankName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.bankAccountNumber}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-white">
                      {formatTk(item.systemAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-cyan-400">
                      {formatTk(item.bankAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                      {item.difference === 0 ? (
                        <span className="text-emerald-400 font-bold">৳০.০০</span>
                      ) : (
                        <span className="text-rose-400 font-bold">{formatTk(item.difference)}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                      {item.statementDate}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Matched' || item.status === 'Reconciled'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.status === 'Investigating'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px] text-[11px] text-slate-300">
                      <div className="truncate" title={item.notes}>
                        {item.notes || '100% Direct Match'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {item.status !== 'Matched' && item.status !== 'Reconciled' ? (
                        <button
                          onClick={() => onMatchReconciliation(item.reconciliationId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-all flex items-center gap-1 mx-auto"
                          title="মিল নিশ্চিত করুন"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBn ? 'ম্যাচ করুন' : 'Match'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">{isBn ? 'মিল হয়েছে' : 'Matched'}</span>
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
