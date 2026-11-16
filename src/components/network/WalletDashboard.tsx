/**
 * 5-Wallet Enterprise Dashboard & Instant Payout Center
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { WithdrawalModal } from './WithdrawalModal';
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, ShieldCheck, RefreshCw, Landmark, CreditCard, Send, Sparkles, Coins } from 'lucide-react';

export const WalletDashboard: React.FC = () => {
  const { wallets, walletSummary, tokenSummary, transactions, processPendingHoldingAutoRelease, commissionConfig } = useNetworkMarketing();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [filterWallet, setFilterWallet] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filterWallet === 'all') return true;
    return tx.walletType === filterWallet;
  });

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/40">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-300" />
            <h3 className="font-black text-xl">আপনার ৫টি ওয়ালেট হাব ও পেমেন্ট সেন্টার</h3>
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            মেইন ওয়ালেট, কমিশন ওয়ালেট, পেন্ডিং ওয়ালেট, রিওয়ার্ড ওয়ালেট ও ক্যাশ ওয়ালেট সেন্ট্রাল ম্যানেজমেন্ট
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWithdrawModalOpen(true)}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-2xl text-xs shadow-xl flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
        >
          <Landmark className="w-4 h-4" />
          <span>ইনস্ট্যান্ট টাকা উত্তোলন (Instant Withdrawal)</span>
        </button>
      </div>

      {/* 5 Wallets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Main Wallet */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500">মেইন ওয়ালেট (Main)</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            ৳ {(wallets?.mainWallet ?? 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-400 block">প্যাকেজ ক্রয় ও কেনাকাটা ব্যালেন্স</span>
        </div>

        {/* 2. Commission Wallet */}
        <div className="p-4 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-neutral-900 border-2 border-emerald-500/60 rounded-3xl shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">কমিশন ওয়ালেট</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            ৳ {(wallets?.commissionWallet ?? 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold block">উত্তোলনের জন্য প্রস্তুত ফ্রি ব্যালেন্স</span>
        </div>

        {/* 3. Pending Commission Wallet */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600">পেন্ডিং ওয়ালেট</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            ৳ {(wallets?.pendingCommissionWallet ?? 0).toLocaleString()}
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] text-neutral-400 block">{commissionConfig?.pendingHoldingDays ?? 7} দিন সিকিউরিটি হোল্ড</span>
            <button
              type="button"
              onClick={processPendingHoldingAutoRelease}
              title="অটো-রিলিজ ট্রিগার"
              className="text-[9px] font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
            >
              <RefreshCw className="w-3 h-3" /> রিলিজ
            </button>
          </div>
        </div>

        {/* 4. Reward Wallet */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">রিওয়ার্ড ওয়ালেট</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 font-mono">
            ৳ {(wallets?.rewardWallet ?? 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-400 block">র‍্যাঙ্ক প্রমোশন ও ক্যাশ ইনসেন্টিভ</span>
        </div>

        {/* 5. Cash Wallet */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600">ক্যাশ ওয়ালেট</span>
            <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-teal-600 font-mono">
            ৳ {(wallets?.cashWallet ?? 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-400 block">ই-কমার্স ক্যাশব্যাক ও রিফান্ড</span>
        </div>

      </div>

      {/* Commission Wallet Ledger Breakdown */}
      <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-sm text-neutral-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>কমিশন ওয়ালেট লেজার বিবরণী (Ledger-Derived Summary)</span>
          </h4>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
            Zero Hardcoded Balance
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">Opening Balance</span>
            <strong className="font-mono font-black text-neutral-900 dark:text-white text-sm">
              ৳ {(walletSummary?.openingBalance ?? 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Total Credit (+)</span>
            <strong className="font-mono font-black text-emerald-600 text-sm">
              ৳ {(walletSummary?.totalCredit ?? 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <span className="text-[10px] text-rose-700 dark:text-rose-300 block">Total Debit (-)</span>
            <strong className="font-mono font-black text-rose-600 text-sm">
              ৳ {(walletSummary?.totalDebit ?? 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-200 block font-bold">Available Balance</span>
            <strong className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
              ৳ {(walletSummary?.availableBalance ?? 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <span className="text-[10px] text-amber-700 dark:text-amber-300 block">Pending Balance</span>
            <strong className="font-mono font-black text-amber-600 text-sm">
              ৳ {(walletSummary?.pendingBalance ?? 0).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-black text-base text-neutral-900 dark:text-white">
              ওয়ালেট লেনদেন ইতিহাস (Transaction History)
            </h4>
            <p className="text-[11px] text-neutral-500">
              সকল ইনকাম, বোনাস, পে-আউট এবং উইথড্রয়াল এর বিবরণ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-500">ওয়ালেট ফিল্টার:</span>
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold text-xs"
            >
              <option value="all">সব ৫টি ওয়ালেট</option>
              <option value="commission">কমিশন ওয়ালেট</option>
              <option value="pending">পেনডিন ওয়ালেট</option>
              <option value="main">মেইন ওয়ালেট</option>
              <option value="reward">রিওয়ার্ড ওয়ালেট</option>
              <option value="cash">ক্যাশ ওয়ালেট</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                <th className="py-2.5 px-3">তারিখ ও সময়</th>
                <th className="py-2.5 px-3">ওয়ালেট</th>
                <th className="py-2.5 px-3">বিবরণ (Source & Notes)</th>
                <th className="py-2.5 px-3">টাইপ</th>
                <th className="py-2.5 px-3 text-right">পরিমাণ (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                    এখনো কোনো ওয়ালেট লেনদেন রেকর্ড নেই। সকল নতুন অ্যাকাউন্টের প্রাথমিক ব্যালেন্স ৳ ০ থেকে শুরু হয়।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit' || tx.type === 'auto_release';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="py-3 px-3 font-mono text-neutral-500">{tx.date}</td>
                      <td className="py-3 px-3 capitalize font-bold text-emerald-600">{tx.walletType}</td>
                      <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 max-w-xs truncate">{tx.description}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          isCredit
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}>
                          {isCredit ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type.toUpperCase()}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-black font-mono text-sm ${
                        isCredit ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {isCredit ? '+' : '-'}৳ {(tx.amount ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* TOMOK Token Balance & Ledger History Section */}
      <div className="bg-white dark:bg-neutral-900 border border-teal-200 dark:border-teal-900/60 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              <span>TOMOK টোকেন ব্যালেন্স ও লেজার ইতিহাস</span>
            </h4>
            <p className="text-[11px] text-neutral-500">
              অর্ডার, রিওয়ার্ড ও অনুমোদিত ক্রেডিট-ডেবিট লেজার থেকে সরাসরি হিসাবকৃত টোকেন ব্যালেন্স
            </p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-right">
            <span className="text-[10px] text-teal-700 dark:text-teal-300 block font-semibold">বর্তমান ব্যালেন্স</span>
            <strong className="font-mono font-black text-lg text-teal-700 dark:text-teal-200">
              {(tokenSummary?.balance ?? 0).toLocaleString()} TOMOK
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">Opening Token</span>
            <strong className="font-mono font-black">{(tokenSummary?.openingBalance ?? 0).toLocaleString()} TOMOK</strong>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">Total Credit</span>
            <strong className="font-mono font-black text-emerald-600">+{(tokenSummary?.totalCredit ?? 0).toLocaleString()} TOMOK</strong>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <span className="text-[10px] text-rose-700 dark:text-rose-300 block">Total Debit</span>
            <strong className="font-mono font-black text-rose-600">-{(tokenSummary?.totalDebit ?? 0).toLocaleString()} TOMOK</strong>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
            <span className="text-[10px] text-teal-700 dark:text-teal-300 block">Net Token Balance</span>
            <strong className="font-mono font-black text-teal-600">{(tokenSummary?.balance ?? 0).toLocaleString()} TOMOK</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                <th className="py-2 px-3">তারিখ</th>
                <th className="py-2 px-3">উৎস</th>
                <th className="py-2 px-3">বিবরণ</th>
                <th className="py-2 px-3 text-right">পরিমাণ (TOMOK)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {!tokenSummary?.transactions?.length ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-500 dark:text-neutral-400">
                    এখনো কোনো TOMOK টোকেন লেনদেন নেই (ব্যালেন্স: ০ TOMOK)।
                  </td>
                </tr>
              ) : (
                tokenSummary.transactions.map((ttx) => (
                  <tr key={ttx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {new Date(ttx.createdAt).toLocaleString('bn-BD')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold uppercase text-[10px] text-teal-700 dark:text-teal-300">
                      {ttx.source}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800 dark:text-neutral-200">{ttx.description}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-black ${ttx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {ttx.type === 'credit' ? '+' : '-'}{(ttx.amount ?? 0).toLocaleString()} TOMOK
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WithdrawalModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
      />

    </div>
  );
};
