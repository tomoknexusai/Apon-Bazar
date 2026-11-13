/**
 * Enterprise 403 Access Denied Component for RBAC Enforcement
 * Project: Apon Bazar / ঘরের বাজার বিডি
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { getDashboardPathForRole, getRoleVisibleName } from '../../lib/rbac';
import { ShieldAlert, Lock, Home, ArrowRight, Store, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

interface AccessDenied403Props {
  attemptedRole: UserRole;
  onRedirectToAllowed?: () => void;
}

export const AccessDenied403: React.FC<AccessDenied403Props> = ({
  attemptedRole,
  onRedirectToAllowed
}) => {
  const { currentUser, isLoggedIn, setActiveRole } = useAuth();
  const { language } = useLanguage();

  const userPrimaryRole = currentUser?.primaryRole || 'customer';
  const attemptedRoleLabel = getRoleVisibleName(attemptedRole, language);
  const userRoleLabel = getRoleVisibleName(userPrimaryRole, language);
  const targetDashboardPath = getDashboardPathForRole(userPrimaryRole);

  const handleGoToMyDashboard = () => {
    // 1. Switch active role state
    setActiveRole(userPrimaryRole);

    // 2. Change browser URL dynamically to user's authorized dashboard path
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetDashboardPath);
      window.dispatchEvent(new Event('popstate'));
    }

    // 3. Clear attempted role from state
    if (onRedirectToAllowed) {
      onRedirectToAllowed();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStorefront = () => {
    setActiveRole('customer');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
    if (onRedirectToAllowed) {
      onRedirectToAllowed();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe, non-sensitive display name for logged-in user
  const userDisplayName = currentUser?.fullName?.trim() || (language === 'bn' ? 'সম্মানিত ব্যবহারকারী' : 'Valued User');

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-xl w-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-red-200/80 dark:border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden"
      >
        {/* Background Decorative Ambient Glows */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 403 Security Badge Icon */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800/80 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner"
        >
          <ShieldAlert className="w-10 h-10" />
        </motion.div>

        {/* Header & Status Indicator */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-black uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>403 Access Denied</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            {language === 'bn' ? 'অননুমোদিত ড্যাশবোর্ড প্রবেশাধিকার' : 'Unauthorized Dashboard Access'}
          </h2>
        </div>

        {/* Dynamic Context Message Box (Safe & Non-sensitive) */}
        {isLoggedIn && currentUser ? (
          <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-700/80 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 space-y-3 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700/80">
              <span className="text-neutral-500 dark:text-neutral-400 font-bold text-xs uppercase">
                {language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                {userRoleLabel}
              </span>
            </div>

            <p className="leading-relaxed">
              {language === 'bn' ? (
                <>
                  আপনার অ্যাকাউন্ট (<span className="font-bold text-neutral-900 dark:text-white">{userDisplayName}</span>) শুধুমাত্র <span className="font-bold text-emerald-600 dark:text-emerald-400">'{userRoleLabel}'</span> রোলে নির্ধারিত।
                </>
              ) : (
                <>
                  Your account (<span className="font-bold text-neutral-900 dark:text-white">{userDisplayName}</span>) is assigned the role <span className="font-bold text-emerald-600 dark:text-emerald-400">'{userRoleLabel}'</span>.
                </>
              )}
            </p>

            <p className="text-red-600 dark:text-red-400 font-semibold leading-relaxed">
              {language === 'bn'
                ? `আপনি '${attemptedRoleLabel}' ড্যাশবোর্ড দেখার বা পরিচালনা করার জন্য অনুমোদিত নন।`
                : `You do not have permission to view or manage the '${attemptedRoleLabel}' dashboard.`}
            </p>
          </div>
        ) : (
          <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-700/80 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 text-left space-y-2">
            <p className="text-neutral-800 dark:text-neutral-200 font-semibold">
              {language === 'bn'
                ? `'${attemptedRoleLabel}' ড্যাশবোর্ডে প্রবেশ করতে অনুগ্রহ করে অনুমোদিত অ্যাকাউন্টে লগইন করুন।`
                : `Please log in with an authorized account to access the '${attemptedRoleLabel}' dashboard.`}
            </p>
          </div>
        )}

        {/* Dynamic Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isLoggedIn ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="unauthorized-go-to-my-dashboard-btn"
              onClick={handleGoToMyDashboard}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>
                {language === 'bn'
                  ? `আমার ড্যাশবোর্ডে যান (${userRoleLabel})`
                  : `Go to My Dashboard (${userRoleLabel})`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              id="unauthorized-login-redirect-btn"
              onClick={handleGoToStorefront}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'bn' ? 'হোমপেজ ও লগইন' : 'Go to Home / Login'}</span>
            </motion.button>
          )}

          <button
            type="button"
            id="unauthorized-back-to-storefront-btn"
            onClick={handleGoToStorefront}
            className="w-full sm:w-auto px-5 py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-neutral-200 dark:border-neutral-700"
          >
            <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'bn' ? 'স্টোরফ্রন্ট' : 'Storefront'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
