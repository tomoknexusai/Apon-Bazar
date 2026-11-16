import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, LogOut, KeyRound } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { currentUser, changeOwnPassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const companyAccountId =
    currentUser?.binaryCompanyId ||
    currentUser?.username ||
    currentUser?.permanentMemberId ||
    currentUser?.id;

  const isStaffManagedAccount =
    currentUser?.primaryRole === 'delivery_rider' ||
    currentUser?.primaryRole === 'rider' ||
    currentUser?.primaryRole === 'delivery_man' ||
    currentUser?.primaryRole === 'dealer' ||
    currentUser?.primaryRole === 'vendor_dealer_shop' ||
    currentUser?.primaryRole === 'vendor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();
    const initialDefault = ['12', '34', '56', '78'].join('');

    if (!cleanCurrent) {
      setError('বর্তমান / অস্থায়ী পাসওয়ার্ডটি লিখুন।');
      return;
    }
    if (isStaffManagedAccount) {
      if (cleanNew.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(cleanNew)) {
        setError('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে এবং এতে অন্তত ১টি অক্ষর ও ১টি সংখ্যা থাকতে হবে।');
        return;
      }
    } else if (cleanNew.length < 6) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (cleanNew === initialDefault) {
      setError('নিরাপত্তার স্বার্থে প্রাথমিক পাসওয়ার্ড (12345678) আবার ব্যবহার করা যাবে না।');
      return;
    }
    if (cleanNew === cleanCurrent) {
      setError('নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে অবশ্যই ভিন্ন হতে হবে।');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setError('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    setSubmitting(true);
    try {
      const res = await changeOwnPassword(cleanCurrent, cleanNew);
      if (!res.success) {
        setError(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-password-change-title"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white border-b border-slate-800 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="force-password-change-title" className="text-base font-bold leading-snug">
              প্রথম লগইন নিরাপত্তা যাচাই — পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Mandatory Password Change Required Before Dashboard Access
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>অ্যাকাউন্ট আইডি: <span className="font-mono">{companyAccountId}</span></span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
              {currentUser?.fullName} — ড্যাশবোর্ড বা নেটওয়ার্ক ট্রি ব্যবহার করার আগে অনুগ্রহ করে আপনার অস্থায়ী/প্রাথমিক পাসওয়ার্ডটি পরিবর্তন করে একটি নিজস্ব শক্তিশালী পাসওয়ার্ড সেট করুন।
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              বর্তমান (প্রাথমিক / অস্থায়ী) পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="প্রাথমিক বা অস্থায়ী পাসওয়ার্ড লিখুন"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle current password visibility"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {isStaffManagedAccount
                ? 'নতুন শক্তিশালী পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা)'
                : 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন শক্তিশালী পাসওয়ার্ড লিখুন"
                autoComplete="new-password"
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowNew((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Toggle new password visibility"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              নতুন পাসওয়ার্ড নিশ্চিত করুন
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় নতুন পাসওয়ার্ড লিখুন"
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => void logout()}
              className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              লগআউট
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট ও প্রবেশ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
