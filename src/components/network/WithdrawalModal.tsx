/**
 * Instant Withdrawal Modal Component with Payment Method Options
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { WithdrawalMethod } from '../../types/networkMarketing';
import { X, Landmark, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawalModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { wallets, commissionConfig, requestInstantWithdrawal } = useNetworkMarketing();
  
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<WithdrawalMethod>('bkash');
  const [accountDetails, setAccountDetails] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const fee = Math.round(amount * (commissionConfig.withdrawalFeePct / 100));
  const netAmount = Math.max(0, amount - fee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountDetails) return;
    const res = requestInstantWithdrawal(amount, method, accountDetails);
    setStatusMsg(res);
    if (res.success) {
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 text-xs">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-neutral-900 dark:text-white">
              ইনস্ট্যান্ট টাকা উত্তোলন (Instant Payout)
            </h3>
            <p className="text-[11px] text-neutral-500">
              কমিশন ওয়ালেট থেকে রিয়েল-টাইম ব্যাংক / মোবাইল ব্যাংকিং ক্যাশআউট
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-2xl border ${
            statusMsg.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-800 dark:text-red-300'
          }`}>
            <p className="font-bold">{statusMsg.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <span className="font-semibold text-neutral-500">উত্তোলনযোগ্য কমিশন ব্যালেন্স:</span>
            <span className="font-black text-emerald-600 text-sm font-mono">
              ৳ {(wallets?.commissionWallet ?? 0).toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              উইথড্রয়াল পদ্ধতি নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bkash', name: 'bKash (বিকাশ)' },
                { id: 'nagad', name: 'Nagad (নগদ)' },
                { id: 'rocket', name: 'Rocket (রকেট)' },
                { id: 'bank', name: 'Bank Transfer' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id as WithdrawalMethod)}
                  className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                    method === m.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              একাউন্ট তথ্য / মোবাইল নম্বর / ব্যাংক ডিটেইলস:
            </label>
            <input
              type="text"
              required
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder={
                method === 'bank'
                  ? 'ব্যাংক নাম, ব্রাঞ্চ, একাউন্ট হোল্ডার ও একাউন্ট নম্বর'
                  : 'পার্সোনাল মোবাইল নম্বর (e.g. 01711998877)'
              }
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              উইথড্রয়াল পরিমাণ (BDT):
            </label>
            <input
              type="number"
              required
              min={commissionConfig.withdrawalMinBDT}
              max={wallets.commissionWallet}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-mono font-bold text-sm"
            />
            <span className="text-[10px] text-neutral-400 block mt-1">
              সর্বনিম্ন উইথড্রয়াল: ৳ {commissionConfig.withdrawalMinBDT}
            </span>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1">
            <div className="flex justify-between text-neutral-500">
              <span>উইথড্রয়াল চার্জ ({commissionConfig.withdrawalFeePct}%):</span>
              <span className="font-mono text-red-600 font-bold">-৳ {fee}</span>
            </div>
            <div className="flex justify-between font-bold text-neutral-900 dark:text-white pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span>প্রাপ্য নিট পরিমাণ:</span>
              <span className="font-mono text-emerald-600 font-black text-sm">৳ {(netAmount ?? 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
            >
              ইনস্ট্যান্ট উইথড্র নিশ্চিত করুন
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
