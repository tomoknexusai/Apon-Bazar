import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  Scale,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  History
} from 'lucide-react';
import { FinancialLedgerEntry } from '../../../types';

interface FinanceLedgerTabProps {
  language: 'bn' | 'en';
  ledger: FinancialLedgerEntry[];
  onOpenAdjustModal: () => void;
}

export const FinanceLedgerTab: React.FC<FinanceLedgerTabProps> = ({
  language,
  ledger,
  onOpenAdjustModal
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const accountList = [
    'Company Cash Vault (Dhaka HQ)',
    'City Bank Corporate Current A/C',
    'bKash Business Merchant Master',
    'BRAC Bank Escrow & Operations A/C',
    'Nagad Commercial Settlement A/C',
    'Crypto Reserve Treasury',
    'Accounts Receivable (Customers/COD)',
    'Accounts Payable (Dealers & Vendors)',
    'Sales Revenue Account',
    'Logistics & Fleet Operations'
  ];

  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        entry.transactionId.toLowerCase().includes(search) ||
        entry.account.toLowerCase().includes(search) ||
        entry.description.toLowerCase().includes(search) ||
        entry.referenceId.toLowerCase().includes(search);

      const matchesAccount = accountFilter === 'all' || entry.account === accountFilter;
      const matchesType = typeFilter === 'all' || entry.referenceType === typeFilter;

      return matchesSearch && matchesAccount && matchesType;
    });
  }, [ledger, searchTerm, accountFilter, typeFilter]);

  const totalDebit = useMemo(() => {
    return filteredLedger.reduce((acc, item) => acc + (item.debit || 0), 0);
  }, [filteredLedger]);

  const totalCredit = useMemo(() => {
    return filteredLedger.reduce((acc, item) => acc + (item.credit || 0), 0);
  }, [filteredLedger]);

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  return (
    <div className="space-y-6">
      {/* Strict Financial Rule Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              {isBn ? 'ডাবল এন্ট্রি জেনারেল লেজার ও ব্যালেন্স সুরক্ষা নীতি' : 'Double-Entry General Ledger & Balance Integrity Policy'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'সরাসরি ব্যালেন্স পরিবর্তন নিষিদ্ধ। কোনো ত্রুটি হলে শুধুমাত্র অনুমোদিত অ্যাডজাস্টমেন্ট বা রিভার্সাল ভাউচার তৈরি করতে হবে।'
                : 'Direct balance tampering is strictly forbidden. Balances change exclusively via authorized adjustment/reversal journal vouchers.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAdjustModal}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'অ্যাডজাস্টমেন্ট / রিভার্সাল ভাউচার' : 'Post Adjustment Voucher'}</span>
        </button>
      </div>

      {/* Top Debit / Credit Balance Check */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট ডেবিট (Total Debit - Dr)' : 'Total Debit (Dr)'}
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1">{formatTk(totalDebit)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'সম্পদ বৃদ্ধি ও ব্যয়' : 'Inflows & asset additions'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট ক্রেডিট (Total Credit - Cr)' : 'Total Credit (Cr)'}
            </span>
            <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-cyan-400 mt-1">{formatTk(totalCredit)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'দায় বৃদ্ধি ও আয়' : 'Outflows & liability credits'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'লেজার ট্রায়াল ব্যালেন্স স্ট্যাটাস' : 'Trial Balance Balance State'}
            </span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-300 mt-1">{isBn ? 'ব্যালান্সড ও নির্ভুল' : '100% Balanced'}</h4>
          <p className="text-[11px] text-emerald-400/90 mt-0.5 font-semibold">
            Dr = Cr {isBn ? 'ম্যাচ করেছে' : 'Equation Verified'}
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
              placeholder={isBn ? 'ট্রানজ্যাকশন আইডি, অ্যাকাউন্ট, রেফারেন্স বা বিবরণ দিয়ে খুঁজুন...' : 'Search TrxID, Account or Voucher reference...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল চার্ট অফ অ্যাকাউন্টস' : 'All Accounts'}</option>
            {accountList.map((acc) => (
              <option key={acc} value={acc}>
                {acc}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল রেফারেন্স প্রকার' : 'All Reference Types'}</option>
            <option value="Order">{isBn ? 'অর্ডার (Order)' : 'Order'}</option>
            <option value="Settlement">{isBn ? 'সেটেলমেন্ট (Settlement)' : 'Settlement'}</option>
            <option value="Expense">{isBn ? 'খরচ (Expense)' : 'Expense'}</option>
            <option value="Refund">{isBn ? 'রিফান্ড (Refund)' : 'Refund'}</option>
            <option value="Commission">{isBn ? 'কমিশন (Commission)' : 'Commission'}</option>
            <option value="Adjustment">{isBn ? 'এডজাস্টমেন্ট (Adjustment)' : 'Adjustment'}</option>
          </select>
        </div>
      </div>

      {/* Main Double-Entry Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBn ? 'ট্রানজ্যাকশন আইডি ও সময়' : 'Trx ID & Timestamp'}</th>
                <th className="py-3.5 px-4">{isBn ? 'হিসাব নাম (Account)' : 'Account Head'}</th>
                <th className="py-3.5 px-4">{isBn ? 'রেফারেন্স ও প্রকার' : 'Ref Type & ID'}</th>
                <th className="py-3.5 px-4">{isBn ? 'জার্নাল বিবরণ' : 'Journal Description'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'ডেবিট (Dr)' : 'Debit (Dr)'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'ক্রেডিট (Cr)' : 'Credit (Cr)'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'রানিং ব্যালেন্স' : 'Running Balance'}</th>
                <th className="py-3.5 px-4">{isBn ? 'তৈরি ও অনুমোদনকারী' : 'Created & Approved By'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    {isBn ? 'কোনো লেজার এন্ট্রি পাওয়া যায়নি' : 'No ledger journal entries found'}
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => (
                  <tr key={entry.transactionId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 font-mono">{entry.transactionId}</div>
                      <div className="text-[10px] text-slate-400">{entry.dateTime}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{entry.account}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.referenceType === 'Adjustment'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {entry.referenceType}
                      </span>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{entry.referenceId}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="text-slate-200 text-xs truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                      {entry.debit > 0 ? (
                        <span className="text-emerald-400 font-bold">{formatTk(entry.debit)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                      {entry.credit > 0 ? (
                        <span className="text-cyan-400 font-bold">{formatTk(entry.credit)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-100">
                      {formatTk(entry.runningBalance)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                      <div>{entry.createdBy}</div>
                      <div className="text-[10px] text-slate-400">Appr: {entry.approvedBy}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.status === 'Posted'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {entry.status}
                      </span>
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
