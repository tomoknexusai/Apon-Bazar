import React, { useState } from 'react';
import {
  Building2,
  Wallet,
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  TrendingUp,
  CreditCard,
  Building,
  DollarSign
} from 'lucide-react';
import { BankAccountRecord } from '../../../types';

interface FinanceAccountsTabProps {
  language: 'bn' | 'en';
  accounts: BankAccountRecord[];
  onTransferFunds: (fromAcc: string, toAcc: string, amount: number, note: string) => void;
}

export const FinanceAccountsTab: React.FC<FinanceAccountsTabProps> = ({
  language,
  accounts,
  onTransferFunds
}) => {
  const isBn = language === 'bn';
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccount, setFromAccount] = useState(accounts[0]?.accountName || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.accountName || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const totalTreasuryBalance = accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || Number(transferAmount) <= 0 || fromAccount === toAccount) return;

    onTransferFunds(fromAccount, toAccount, Number(transferAmount), transferNote);
    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNote('');
  };

  return (
    <div className="space-y-6">
      {/* Top Treasury Summary Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {isBn ? 'মোট কর্পোরেট ট্রেজারি ও ক্যাশ ভল্ট রিজার্ভ' : 'Total Corporate Treasury & Vault Liquidity'}
          </span>
          <h3 className="text-3xl font-black text-white mt-1 font-mono">{formatTk(totalTreasuryBalance)}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isBn ? 'সকল তফসিলি ব্যাংক, মার্চেন্ট অ্যাকাউন্ট ও ক্যাশ ভল্টে সংরক্ষিত অর্থ' : 'Consolidated multi-account institutional reserves'}
          </p>
        </div>

        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isBn ? 'অভ্যন্তরীণ ফান্ড স্থানান্তর' : 'Inter-Account Fund Transfer'}</span>
        </button>
      </div>

      {/* Grid of Bank & Digital Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc.accountId}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                    {acc.accountType === 'Cash Vault' ? (
                      <Wallet className="w-5 h-5" />
                    ) : acc.accountType === 'Crypto / Token Reserve' ? (
                      <Coins className="w-5 h-5" />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{acc.accountName}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{acc.accountNumber}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    acc.reconciliationStatus === 'Reconciled'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {acc.reconciliationStatus}
                </span>
              </div>

              <div className="my-4">
                <span className="text-xs text-slate-400">{isBn ? 'বর্তমান ব্যালেন্স:' : 'Current Balance:'}</span>
                <div className="text-2xl font-black text-emerald-300 font-mono mt-1">
                  {formatTk(acc.currentBalance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/80">
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400">{isBn ? 'মোট ডেবিট (Dr):' : 'Total Debit:'}</span>
                  <p className="font-bold text-emerald-400 font-mono">{formatTk(acc.totalDebit)}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <span className="text-[10px] text-slate-400">{isBn ? 'মোট ক্রেডিট (Cr):' : 'Total Credit:'}</span>
                  <p className="font-bold text-cyan-400 font-mono">{formatTk(acc.totalCredit)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>{acc.accountType}</span>
              <span className="text-slate-300 font-mono">{isBn ? 'প্রারম্ভিক: ' : 'Opening: '}{formatTk(acc.openingBalance)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fund Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'অভ্যন্তরীণ অ্যাকাউন্ট ফান্ড ট্রান্সফার' : 'Inter-Account Fund Transfer'}
                </h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'যে অ্যাকাউন্ট থেকে কাটা হবে (Source / Debit):' : 'From Account (Source):'}
                </label>
                <select
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.accountId} value={acc.accountName}>
                      {acc.accountName} ({formatTk(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'যে অ্যাকাউন্টে জমা হবে (Destination / Credit):' : 'To Account (Destination):'}
                </label>
                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.accountId} value={acc.accountName}>
                      {acc.accountName} ({formatTk(acc.currentBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'স্থানান্তর পরিমাণ (টাকা):' : 'Transfer Amount (BDT):'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="৳ 0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'ট্রান্সফার কারণ / অডিট নোট:' : 'Transfer Reason / Audit Note:'}
                </label>
                <textarea
                  required
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder={isBn ? 'যেমন: পেটি ক্যাশ রিফান্ড বা মার্চেন্ট ব্যালেন্স ব্যাংকে স্থানান্তর...' : 'Enter transfer authorization reason...'}
                  className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
                {isBn
                  ? 'এই লেনদেনের ফলে স্বয়ংক্রিয়ভাবে দুটি ব্যালান্সিং লেজার জার্নাল তৈরি হবে।'
                  : 'This transaction generates dual balanced double-entry vouchers in the General Ledger.'}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={fromAccount === toAccount}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  {isBn ? 'স্থানান্তর সম্পন্ন করুন' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
