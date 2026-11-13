/**
 * Placement Management Modal for Recruits & Spillover
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { X, UserPlus, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  leg: 'left' | 'right';
}

export const PlacementManagementModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parentId,
  leg
}) => {
  const { packages, placeMemberInTree, currentMember } = useNetworkMarketing();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id || 'pkg-100');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) return;
    placeMemberInTree(name, mobile, currentMember?.id || 'mem-root', parentId, leg, selectedPkgId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-lg text-neutral-900 dark:text-white">
              বাইনারি প্লেসমেন্ট যুক্ত করুন
            </h3>
            <p className="text-xs text-neutral-500">
              প্লেসমেন্ট শাখা: <span className="font-bold text-emerald-600">{leg === 'left' ? 'বাম লেগ (Left Leg)' : 'ডান লেগ (Right Leg)'}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 font-bold mb-1">
              নতুন মেম্বারের পূর্ণ নাম:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="উদাহরণ: মো: মেহেদী হাসান"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 font-bold mb-1">
              মোবাইল নম্বর:
            </label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01700000000"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 font-bold mb-1">
              অ্যাক্টিভেশন প্যাকেজ নির্বাচন:
            </label>
            <select
              value={selectedPkgId}
              onChange={(e) => setSelectedPkgId(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white font-bold"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.nameBn} — ৳ {(pkg.priceBDT ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              নতুন সদস্য প্লেসমেন্ট হওয়ার সাথে সাথে আপনার এবং উর্ধ্বতন স্পন্সরদের গ্রুপ ভলিউম (GV) স্বয়ংক্রিয়ভাবে হিসাব করা হবে।
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              প্লেসমেন্ট নিশ্চিত করুন
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
