import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Users,
  DollarSign,
  Send,
  Calendar
} from 'lucide-react';
import { FinanceReceivableRecord, FinancePayableRecord } from '../../../types';

interface FinanceReceivablesPayablesTabProps {
  language: 'bn' | 'en';
  receivables: FinanceReceivableRecord[];
  payables: FinancePayableRecord[];
  onDisbursePayable: (payableId: string) => void;
}

export const FinanceReceivablesPayablesTab: React.FC<FinanceReceivablesPayablesTabProps> = ({
  language,
  receivables,
  payables,
  onDisbursePayable
}) => {
  const isBn = language === 'bn';
  const [activeSubTab, setActiveSubTab] = useState<'receivables' | 'payables'>('payables');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReceivables = useMemo(() => {
    return receivables.filter((r) => {
      const search = searchTerm.toLowerCase();
      return (
        r.receivableId.toLowerCase().includes(search) ||
        r.partyName.toLowerCase().includes(search) ||
        r.partyId.toLowerCase().includes(search) ||
        r.reference.toLowerCase().includes(search)
      );
    });
  }, [receivables, searchTerm]);

  const filteredPayables = useMemo(() => {
    return payables.filter((p) => {
      const search = searchTerm.toLowerCase();
      return (
        p.payableId.toLowerCase().includes(search) ||
        p.partyName.toLowerCase().includes(search) ||
        p.partyId.toLowerCase().includes(search) ||
        p.reference.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    });
  }, [payables, searchTerm]);

  const totalOutstandingReceivables = useMemo(() => {
    return receivables.reduce((acc, r) => acc + r.outstandingAmount, 0);
  }, [receivables]);

  const totalOutstandingPayables = useMemo(() => {
    return payables.reduce((acc, p) => acc + p.outstandingAmount, 0);
  }, [payables]);

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট প্রাপ্য অর্থ (Accounts Receivable)' : 'Total Accounts Receivable'}
            </span>
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="text-2xl font-black text-emerald-400 mt-2">{formatTk(totalOutstandingReceivables)}</h4>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'কাস্টমার, ডেলিভারি ক্যাশ ইন ট্রানজিট ও হোলসেল বকেয়া' : 'COD in transit & B2B receivables'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট প্রদেয় দেনা (Accounts Payable)' : 'Total Accounts Payable'}
            </span>
            <ArrowDownLeft className="w-5 h-5 text-rose-400" />
          </div>
          <h4 className="text-2xl font-black text-rose-400 mt-2">{formatTk(totalOutstandingPayables)}</h4>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'ডিলার, রাইডার, অফিসার ও সরবরাহকারী প্রদেয়' : 'Dealers, fleet, suppliers & ops obligations'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'নেট ওয়ার্কিং ক্যাপিটাল পজিশন' : 'Net Working Capital Balance'}
            </span>
            <Building className="w-5 h-5 text-cyan-400" />
          </div>
          <h4 className="text-2xl font-black text-cyan-300 mt-2">
            {formatTk(totalOutstandingReceivables - totalOutstandingPayables)}
          </h4>
          <p className="text-xs text-cyan-400 mt-1 font-medium">
            {isBn ? 'তারল্য উদ্বৃত্ত (Liquid Surplus)' : 'Healthy Liquidity Ratio'}
          </p>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('payables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'payables'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isBn ? 'প্রদেয় দেনা তালিকা (Payables)' : 'Accounts Payable'} ({payables.length})
          </button>
          <button
            onClick={() => setActiveSubTab('receivables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'receivables'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isBn ? 'প্রাপ্য পাওনা তালিকা (Receivables)' : 'Accounts Receivable'} ({receivables.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isBn ? 'নাম, আইডি বা রেফারেন্স দিয়ে খুঁজুন...' : 'Search by name, ID or ref...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Payables Sub-View */}
      {activeSubTab === 'payables' && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">{isBn ? 'প্রদেয় আইডি ও তারিখ' : 'Payable ID & Date'}</th>
                  <th className="py-3.5 px-4">{isBn ? 'প্রাপক (Party)' : 'Beneficiary Party'}</th>
                  <th className="py-3.5 px-4">{isBn ? 'খাত / ক্যাটাগরি' : 'Category'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'মোট দাবি' : 'Total Amount'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'পরিশোধিত' : 'Paid Amount'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'বকেয়া দেনা' : 'Outstanding'}</th>
                  <th className="py-3.5 px-4">{isBn ? 'নির্দিষ্ট মেয়াদী তারিখ' : 'Due Date & Aging'}</th>
                  <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPayables.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      {isBn ? 'কোনো প্রদেয় রেকর্ড পাওয়া যায়নি' : 'No payables records found'}
                    </td>
                  </tr>
                ) : (
                  filteredPayables.map((item) => (
                    <tr key={item.payableId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-100 font-mono">{item.payableId}</div>
                        <div className="text-[10px] text-slate-400">Ref: {item.reference}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{item.partyName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.partyId} ({item.partyRole})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-300">
                        {formatTk(item.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-emerald-400">
                        {formatTk(item.paidAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-rose-400 font-mono text-sm">
                        {formatTk(item.outstandingAmount)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.dueDate}</span>
                        </div>
                        <div className="text-[10px] text-amber-400 font-semibold">{item.aging}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'Partially Paid'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.outstandingAmount > 0 ? (
                          <button
                            onClick={() => onDisbursePayable(item.payableId)}
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1 mx-auto"
                          >
                            <Send className="w-3 h-3" />
                            <span>{isBn ? 'পরিশোধ' : 'Disburse'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold">{isBn ? 'সম্পন্ন' : 'Settled'}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receivables Sub-View */}
      {activeSubTab === 'receivables' && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">{isBn ? 'প্রাপ্য আইডি ও অর্ডার' : 'Receivable & Order ID'}</th>
                  <th className="py-3.5 px-4">{isBn ? 'দেনাদার পক্ষ (Party)' : 'Debtor Party'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'মোট পাওনা' : 'Total Amount'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'সংগৃহীত' : 'Collected'}</th>
                  <th className="py-3.5 px-4 text-right">{isBn ? 'বাকি পাওনা' : 'Outstanding'}</th>
                  <th className="py-3.5 px-4">{isBn ? 'প্রত্যাশিত আদায় তারিখ' : 'Due Date & Aging'}</th>
                  <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredReceivables.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {isBn ? 'কোনো প্রাপ্য রেকর্ড পাওয়া যায়নি' : 'No receivables records found'}
                    </td>
                  </tr>
                ) : (
                  filteredReceivables.map((item) => (
                    <tr key={item.receivableId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-100 font-mono">{item.receivableId}</div>
                        <div className="text-[10px] text-emerald-400">Ref: {item.reference}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{item.partyName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.partyId} ({item.partyRole})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-300">
                        {formatTk(item.totalAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-cyan-400">
                        {formatTk(item.collectedAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-emerald-400 font-mono text-sm">
                        {formatTk(item.outstandingAmount)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                        <div>{item.dueDate}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">{item.aging}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Collected'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'Partially Collected'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
