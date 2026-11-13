/**
 * Super Admin Control Panel for Network Marketing Engine
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { WalletType } from '../../types/networkMarketing';
import { Settings, ShieldAlert, DollarSign, Sliders, Edit3, CheckCircle2, Lock, Unlock, AlertTriangle } from 'lucide-react';

export const AdminNetworkControlPanel: React.FC = () => {
  const {
    commissionConfig,
    updateCommissionConfig,
    withdrawals,
    toggleWithdrawalHold,
    manualWalletAdjustment
  } = useNetworkMarketing();

  const [sponsorPct, setSponsorPct] = useState(commissionConfig.sponsorCommissionPct);
  const [binaryRate, setBinaryRate] = useState(commissionConfig.binaryMatchingRateBDT);
  const [binaryCap, setBinaryCap] = useState(commissionConfig.binaryMatchingCapDailyPV);
  const [holdingDays, setHoldingDays] = useState(commissionConfig.pendingHoldingDays);
  const [withdrawalMin, setWithdrawalMin] = useState(commissionConfig.withdrawalMinBDT);
  const [withdrawalFee, setWithdrawalFee] = useState(commissionConfig.withdrawalFeePct);

  // Manual adjustment form state
  const [adjUserId, setAdjUserId] = useState('usr-cust-001');
  const [adjWallet, setAdjWallet] = useState<WalletType>('commission');
  const [adjAmount, setAdjAmount] = useState<number>(500);
  const [adjIsCredit, setAdjIsCredit] = useState(true);
  const [adjReason, setAdjReason] = useState('বিশেষ বোনাস এডজাস্টমেন্ট');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCommissionConfig({
      sponsorCommissionPct: sponsorPct,
      binaryMatchingRateBDT: binaryRate,
      binaryMatchingCapDailyPV: binaryCap,
      pendingHoldingDays: holdingDays,
      withdrawalMinBDT: withdrawalMin,
      withdrawalFeePct: withdrawalFee
    });
  };

  const handleManualAdjSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualWalletAdjustment(adjUserId, adjWallet, adjAmount, adjIsCredit, adjReason);
    alert('ম্যানুয়াল ওয়ালেট এডজাস্টমেন্ট সফল হয়েছে!');
  };

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100 text-xs">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-red-400" />
            <h3 className="font-black text-xl">সুপার এডমিন নেটওয়ার্ক মার্কেটিং কন্ট্রোল প্যানেল</h3>
          </div>
          <p className="text-xs text-red-100/80 mt-1">
            কমিশন শতাংশ, বাইনারি ক্যাপ, জেনারেশন লেভেল, সিকিউরিটি হোল্ড ও ওয়ালেট এডজাস্টমেন্ট
          </p>
        </div>

        <span className="px-3.5 py-1.5 bg-red-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow">
          Super Admin Privileges Required
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Global Commission & Withdrawal Rule Editor */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h4 className="font-black text-base text-neutral-900 dark:text-white">
              কমিশন ও সিকিউরিটি কনফিগারেশন সম্পাদক
            </h4>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  স্পন্সর কমিশন (%):
                </label>
                <input
                  type="number"
                  value={sponsorPct}
                  onChange={(e) => setSponsorPct(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  বাইনারি ম্যাচিং রেট (BDT / PV):
                </label>
                <input
                  type="number"
                  value={binaryRate}
                  onChange={(e) => setBinaryRate(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  দৈনিক বাইনারি ক্যাপ (PV):
                </label>
                <input
                  type="number"
                  value={binaryCap}
                  onChange={(e) => setBinaryCap(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  পেন্ডিং হোল্ডিং সময় (দিন):
                </label>
                <input
                  type="number"
                  value={holdingDays}
                  onChange={(e) => setHoldingDays(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  সর্বনিম্ন উইথড্রয়াল (BDT):
                </label>
                <input
                  type="number"
                  value={withdrawalMin}
                  onChange={(e) => setWithdrawalMin(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  উইথড্রয়াল প্রসেসিং ফি (%):
                </label>
                <input
                  type="number"
                  value={withdrawalFee}
                  onChange={(e) => setWithdrawalFee(Number(e.target.value))}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all text-center"
              >
                সুপার এডমিন রুলস সংরক্ষণ করুন
              </button>
            </div>

          </form>
        </div>

        {/* 2. Manual Wallet Credit / Debit Tool */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h4 className="font-black text-base text-neutral-900 dark:text-white">
              ম্যানুয়াল ওয়ালেট এডজাস্টমেন্ট (Manual Credit / Debit)
            </h4>
          </div>

          <form onSubmit={handleManualAdjSubmit} className="space-y-3">
            
            <div>
              <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                টার্গেট ইউজারের ID:
              </label>
              <input
                type="text"
                required
                value={adjUserId}
                onChange={(e) => setAdjUserId(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  ওয়ালেট সিলেক্ট করুন:
                </label>
                <select
                  value={adjWallet}
                  onChange={(e) => setAdjWallet(e.target.value as WalletType)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold"
                >
                  <option value="main">মেইন ওয়ালেট</option>
                  <option value="commission">কমিশন ওয়ালেট</option>
                  <option value="pending">পেন্ডিং ওয়ালেট</option>
                  <option value="reward">রিওয়ার্ড ওয়ালেট</option>
                  <option value="cash">ক্যাশ ওয়ালেট</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  ট্রানজেকশন টাইপ:
                </label>
                <select
                  value={adjIsCredit ? 'credit' : 'debit'}
                  onChange={(e) => setAdjIsCredit(e.target.value === 'credit')}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold text-emerald-600"
                >
                  <option value="credit">CREDIT (+) ওয়ালেটে যোগ</option>
                  <option value="debit">DEBIT (-) ওয়ালেট থেকে কর্তন</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                পরিমাণ (BDT):
              </label>
              <input
                type="number"
                required
                value={adjAmount}
                onChange={(e) => setAdjAmount(Number(e.target.value))}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                কারণ / এডমিন নোট:
              </label>
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl shadow-md transition-all text-center"
            >
              ওয়ালেট এডজাস্টমেন্ট কার্যকর করুন
            </button>

          </form>
        </div>

      </div>

      {/* 3. Fraud Review & Withdrawal Security Override Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h4 className="font-black text-base text-neutral-900 dark:text-white">
              উইথড্রয়াল ফ্রড ও সিকিউরিটি রিভিউ কন্ট্রোল
            </h4>
          </div>
          <span className="text-[11px] text-neutral-400">
            স্বাভাবিক পরিস্থিতিতে ইনস্ট্যান্ট উইথড্রয়াল সক্রিয়। প্রয়োজন হলে স্থগিত করুন।
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                <th className="py-2.5 px-3">রিকোয়েস্ট ID</th>
                <th className="py-2.5 px-3">ইউজার নাম & মোবাইল</th>
                <th className="py-2.5 px-3">পদ্ধতি ও একাউন্ট</th>
                <th className="py-2.5 px-3">পরিমাণ (BDT)</th>
                <th className="py-2.5 px-3">স্ট্যাটাস</th>
                <th className="py-2.5 px-3 text-right">সিকিউরিটি অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {withdrawals.map((w) => {
                const isHeld = w.status === 'held_for_security_review';

                return (
                  <tr key={w.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-3 font-mono font-bold text-neutral-600">{w.id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold block text-neutral-900 dark:text-white">{w.userName}</span>
                      <span className="text-[10px] text-neutral-400 block font-mono">{w.userMobile}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-bold text-emerald-600 block">{w.method}</span>
                      <span className="text-[10px] text-neutral-500 block truncate max-w-[150px]">{w.accountDetails}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-neutral-900 dark:text-white">
                      ৳ {(w.netAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHeld
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {w.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isHeld ? (
                        <button
                          type="button"
                          onClick={() => toggleWithdrawalHold(w.id, false)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 ml-auto"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>রিলিজ করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const reason = prompt('স্থগিতের কারণ লিখুন:');
                            if (reason) toggleWithdrawalHold(w.id, true, reason);
                          }}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center gap-1 ml-auto"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>হোল্ড করুন</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
