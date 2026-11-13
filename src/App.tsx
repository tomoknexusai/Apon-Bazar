/**
 * Enterprise Application Main Root Component
 * Project: Apon Bazar
 */

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { SystemSettingsProvider } from './context/SystemSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ECommerceProvider } from './context/ECommerceContext';
import { ProductMasterDatabaseProvider } from './context/ProductMasterDatabaseContext';
import { NetworkMarketingProvider } from './context/NetworkMarketingContext';
import { BDLocalDatabaseProvider } from './context/BDLocalDatabaseContext';
import { LocalAddressDatabaseProvider } from './context/LocalAddressDatabaseContext';
import { RoleApplicationProvider } from './context/RoleApplicationContext';
import { SEOHead } from './components/common/SEOHead';
import { DigitalBackground } from './components/common/DigitalBackground';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AccessDenied403 } from './components/common/AccessDenied403';
import {
  isRoleAuthorized,
  canAccessActiveUserList,
  normalizeUserRole,
  getDashboardPathForRole,
  resolveUserHighestRole,
  isImmutableSuperAdmin
} from './lib/rbac';
import { UserRole } from './types';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';

// Independent Role Dashboards
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { FinanceDashboard } from './components/dashboards/FinanceDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard';
import { NetworkMemberDashboard } from './components/dashboards/NetworkMemberDashboard';
import { VendorDashboard } from './components/dashboards/VendorDashboard';
import { OperationsPartnerDashboard } from './components/dashboards/OperationsPartnerDashboard';
import { DeliveryRiderDashboard } from './components/dashboards/DeliveryRiderDashboard';
import { ECommerceStorefront } from './components/shop/ECommerceStorefront';

import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';

          const borderClass = isSuccess
            ? 'border-emerald-300 dark:border-emerald-700 bg-white/95 dark:bg-neutral-900/95 shadow-emerald-500/10'
            : isWarning
            ? 'border-amber-300 dark:border-amber-700 bg-white/95 dark:bg-neutral-900/95 shadow-amber-500/10'
            : isError
            ? 'border-rose-300 dark:border-rose-700 bg-white/95 dark:bg-neutral-900/95 shadow-rose-500/10'
            : 'border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-neutral-500/10';

          const iconWrapperClass = isSuccess
            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
            : isWarning
            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
            : isError
            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto backdrop-blur-md border p-4 rounded-2xl shadow-xl flex items-start justify-between gap-3 text-xs transition-all ${borderClass}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconWrapperClass}`}>
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-black text-neutral-900 dark:text-white truncate">
                      {toast.title}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${
                        isSuccess
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : isError
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {toast.type || 'info'}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed break-words">
                    {toast.message}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const getRoleFromPathname = (pathname: string): UserRole | null => {
  if (!pathname) return null;
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '');

  // Founder paths
  if (
    cleanPath === '/founder' ||
    cleanPath === '/founder/dashboard' ||
    cleanPath === '/founder-dashboard'
  ) {
    return 'founder';
  }

  // Super Admin paths
  if (
    cleanPath === '/super-admin' ||
    cleanPath === '/super-admin/dashboard' ||
    cleanPath === '/super_admin' ||
    cleanPath === '/super_admin/dashboard' ||
    cleanPath === '/superadmin' ||
    cleanPath === '/superadmin/dashboard'
  ) {
    return 'super_admin';
  }

  // Finance & Accounts / Account Officer paths
  if (
    cleanPath === '/finance' ||
    cleanPath === '/finance/dashboard' ||
    cleanPath === '/finance-dashboard' ||
    cleanPath === '/accounts' ||
    cleanPath === '/accounts/dashboard' ||
    cleanPath === '/account-officer' ||
    cleanPath === '/account-officer/dashboard'
  ) {
    return 'finance';
  }

  // HR paths
  if (
    cleanPath === '/hr' ||
    cleanPath === '/hr/dashboard'
  ) {
    return 'hr';
  }

  // Admin paths
  if (
    cleanPath === '/admin' ||
    cleanPath === '/admin/dashboard'
  ) {
    return 'admin';
  }

  // Customer paths
  if (
    cleanPath === '/customer' ||
    cleanPath === '/customer/dashboard' ||
    cleanPath === '/account' ||
    cleanPath === '/account/dashboard'
  ) {
    return 'customer';
  }

  // Dealer paths
  if (
    cleanPath === '/dealer' ||
    cleanPath === '/dealer/dashboard'
  ) {
    return 'dealer';
  }

  // Vendor / Shop paths
  if (
    cleanPath === '/vendor' ||
    cleanPath === '/vendor/dashboard' ||
    cleanPath === '/shop' ||
    cleanPath === '/shop/dashboard'
  ) {
    return 'vendor';
  }

  // Operations Partner paths
  if (
    cleanPath === '/operations' ||
    cleanPath === '/operations/dashboard' ||
    cleanPath === '/operations-partner' ||
    cleanPath === '/operations-partner/dashboard' ||
    cleanPath === '/operations_partner' ||
    cleanPath === '/operations_partner/dashboard' ||
    cleanPath === '/operations-officer' ||
    cleanPath === '/operations-officer/dashboard' ||
    cleanPath === '/partner' ||
    cleanPath === '/partner/dashboard'
  ) {
    return 'operations_partner';
  }

  // Delivery Rider / Delivery Man paths
  if (
    cleanPath === '/delivery' ||
    cleanPath === '/delivery/dashboard' ||
    cleanPath === '/delivery-man' ||
    cleanPath === '/delivery-man/dashboard' ||
    cleanPath === '/delivery_man' ||
    cleanPath === '/delivery_man/dashboard' ||
    cleanPath === '/delivery-rider' ||
    cleanPath === '/delivery-rider/dashboard' ||
    cleanPath === '/delivery_rider' ||
    cleanPath === '/delivery_rider/dashboard' ||
    cleanPath === '/rider' ||
    cleanPath === '/rider/dashboard'
  ) {
    return 'delivery_rider';
  }

  // Network Member paths
  if (
    cleanPath === '/network' ||
    cleanPath === '/network/dashboard' ||
    cleanPath === '/network-member' ||
    cleanPath === '/network-member/dashboard' ||
    cleanPath === '/network_member' ||
    cleanPath === '/network_member/dashboard'
  ) {
    return 'network_member';
  }

  return null;
};

const MainContent: React.FC = () => {
  const { currentUser, activeRole, setActiveRole, isLoggedIn, systemSettings, impersonatedUser, exitImpersonation } = useAuth();
  const [urlAttemptedRole, setUrlAttemptedRole] = useState<UserRole | null>(null);

  // Sync and monitor URL parameters/hash/pathname for direct URL access attempts
  useEffect(() => {
    const handleUrlCheck = () => {
      const cleanPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase().replace(/\/+$/, '') : '';

      // Generic /dashboard path: Route user strictly based on priority role
      if (cleanPath === '/dashboard') {
        if (isLoggedIn && currentUser) {
          const priorityRole = resolveUserHighestRole(currentUser.roles, currentUser.primaryRole, currentUser.id);
          const targetPath = getDashboardPathForRole(priorityRole);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, targetPath);
          }
          if (activeRole !== priorityRole) {
            setActiveRole(priorityRole);
          }
          setUrlAttemptedRole(null);
          return;
        } else {
          setUrlAttemptedRole('customer');
          return;
        }
      }

      const pathRole = typeof window !== 'undefined' ? getRoleFromPathname(window.location.pathname) : null;
      const searchParams = new URLSearchParams(window.location.search);
      const rawQueryRole = searchParams.get('role') || searchParams.get('dashboard');
      const queryRole = rawQueryRole ? normalizeUserRole(rawQueryRole) : null;
      const rawHashRole = window.location.hash.replace('#', '');
      const hashRole = rawHashRole ? normalizeUserRole(rawHashRole) : null;

      const rawTarget = pathRole || queryRole || hashRole;
      const targetRoleFromUrl = rawTarget ? normalizeUserRole(rawTarget) : null;

      // Check for direct Active User URL parameters or hashes
      const isActiveUserAttempt =
        searchParams.get('activeUser') === 'true' ||
        searchParams.get('active_users') === 'true' ||
        searchParams.get('view') === 'active_users' ||
        searchParams.get('tab') === 'active_users' ||
        searchParams.get('route') === 'active_users' ||
        window.location.hash === '#active_users' ||
        window.location.hash === '#activeUsers';

      if (isActiveUserAttempt) {
        if (!currentUser || !canAccessActiveUserList(currentUser)) {
          // Deny access to non-Super-Admin and redirect them to their authorized Home/Dashboard page
          if (typeof window !== 'undefined') {
            const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          if (currentUser) {
            const fallback = resolveUserHighestRole(currentUser.roles, currentUser.primaryRole, currentUser.id);
            if (activeRole !== fallback) {
              setActiveRole(fallback);
            }
            setUrlAttemptedRole(null);
          } else {
            setUrlAttemptedRole('super_admin');
          }
          return;
        } else {
          // Authorized Super Admin
          if (activeRole !== 'super_admin') {
            setActiveRole('super_admin');
          }
        }
      }

      if (targetRoleFromUrl === 'customer') {
        // Customer view
        setUrlAttemptedRole(null);
        if (activeRole !== 'customer') {
          setActiveRole('customer');
        }
        return;
      }

      if (!isLoggedIn || !currentUser) {
        if (targetRoleFromUrl) {
          setUrlAttemptedRole(targetRoleFromUrl);
        } else {
          setUrlAttemptedRole(null);
        }
        return;
      }

      // Super Admin protection: Never allow Super Admin to fall back into Dealer or Vendor Dashboard
      const isSuperAdminUser = Boolean(
        currentUser && (
          isImmutableSuperAdmin(currentUser.id) ||
          currentUser.roles?.includes('super_admin') ||
          currentUser.primaryRole === 'super_admin'
        )
      );

      if (isSuperAdminUser) {
        const isExplicitDealerUrl = cleanPath.startsWith('/dealer') || cleanPath.startsWith('/vendor');
        if (!isExplicitDealerUrl && (activeRole === 'dealer' || activeRole === 'vendor')) {
          setActiveRole('super_admin');
          setUrlAttemptedRole(null);
          return;
        }
      }

      if (targetRoleFromUrl) {
        if (!isRoleAuthorized(currentUser?.roles, targetRoleFromUrl)) {
          // Direct URL access attempt to an unauthorized dashboard!
          setUrlAttemptedRole(targetRoleFromUrl);
        } else {
          setUrlAttemptedRole(null);
          if (activeRole !== targetRoleFromUrl) {
            setActiveRole(targetRoleFromUrl);
          }
        }
      } else {
        setUrlAttemptedRole(null);
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, [currentUser?.id, currentUser?.primaryRole, isLoggedIn, activeRole, setActiveRole]);

  const renderDashboard = () => {
    // If user is not logged in and attempts to access any protected role, show 403 or fallback to public storefront
    if (!isLoggedIn) {
      if (urlAttemptedRole && urlAttemptedRole !== 'customer') {
        return (
          <AccessDenied403
            attemptedRole={urlAttemptedRole}
            onRedirectToAllowed={() => setUrlAttemptedRole(null)}
          />
        );
      }
      return <ECommerceStorefront />;
    }

    // If direct URL access was attempted for an unauthorized role, show 403 Access Denied
    if (urlAttemptedRole && urlAttemptedRole !== 'customer') {
      return (
        <AccessDenied403
          attemptedRole={urlAttemptedRole}
          onRedirectToAllowed={() => setUrlAttemptedRole(null)}
        />
      );
    }

    // RBAC Guard check for activeRole
    const isAuthorized = isRoleAuthorized(currentUser?.roles, activeRole);
    if (!isAuthorized && activeRole !== 'customer') {
      return (
        <AccessDenied403
          attemptedRole={activeRole}
          onRedirectToAllowed={() => setUrlAttemptedRole(null)}
        />
      );
    }

    switch (activeRole) {
      case 'founder':
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'account_officer':
      case 'finance':
      case 'finance_officer':
        return <FinanceDashboard />;
      case 'admin':
      case 'district_admin':
      case 'hr':
        return <AdminDashboard />;
      case 'customer':
        return isLoggedIn ? <CustomerDashboard /> : <ECommerceStorefront />;
      case 'customer_networker':
        if (!isLoggedIn) return <ECommerceStorefront />;
        return currentUser?.isNetworkActive ? <NetworkMemberDashboard /> : <CustomerDashboard />;
      case 'network_member':
        return <NetworkMemberDashboard />;
      case 'vendor_dealer_shop':
      case 'dealer':
      case 'vendor':
        return <VendorDashboard />;
      case 'operations_officer':
      case 'operations_partner':
        return <OperationsPartnerDashboard />;
      case 'rider':
      case 'delivery_rider':
      case 'delivery_man':
        return <DeliveryRiderDashboard />;
      default:
        return <ECommerceStorefront />;
    }
  };

  // Dynamic page background styling based on active role and login status
  const getPageBackgroundStyle = () => {
    if (urlAttemptedRole && urlAttemptedRole !== 'customer') {
      return 'bg-neutral-50 dark:bg-neutral-950';
    }
    if (isLoggedIn) {
      return 'bg-[#E8F5E9] dark:bg-neutral-950';
    }
    return 'bg-[#F9FBF9] dark:bg-neutral-950';
  };

  const pageKey = (urlAttemptedRole ? `403_${urlAttemptedRole}` : '') || (isLoggedIn ? `${activeRole}_user` : 'storefront_public');

  const isStorefront = !isLoggedIn || activeRole === 'customer';

  return (
    <div className={`min-h-screen flex flex-col ${getPageBackgroundStyle()} text-neutral-900 dark:text-neutral-100 transition-colors duration-200 relative overflow-x-clip`}>
      {/* Smart Colorful Digital Ambient Background */}
      <DigitalBackground />

      <SEOHead
        title={`${systemSettings.companyName} - Enterprise Platform`}
        description="Apon Bazar: বাংলাদেশের নির্ভরযোগ্য অনলাইন শপিং, অর্গানিক গ্রোসারি, এমএলএম ও স্থানীয় ডেলিভারি প্ল্যাটফর্ম।"
      />

      {/* Super Admin Impersonation Active Banner */}
      {impersonatedUser && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-neutral-950 font-black text-xs py-2.5 px-4 shadow-lg flex items-center justify-between gap-3 sticky top-0 z-50 border-b border-amber-700"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-neutral-950 shrink-0 animate-pulse" />
            <span>
              ⚠️ আপনি বর্তমানে সুপার এডমিন হিসেবে ইউজার <strong>{impersonatedUser.fullName}</strong> (রেজিস্ট্রেশন আইডি: <strong>{impersonatedUser.permanentMemberId || impersonatedUser.id}</strong>) এর <strong>{(impersonatedUser.primaryRole || 'customer').toUpperCase().replace('_', ' ')}</strong> ড্যাশবোর্ডে প্রবেশ করে অবস্থান করছেন।
            </span>
          </div>
          <button
            type="button"
            onClick={exitImpersonation}
            className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>সুপার এডমিন ড্যাশবোর্ডে ফিরে যান</span>
          </button>
        </motion.div>
      )}

      {/* Main App Header with Sticky Top Main Menu & Category Menu */}
      <Header />

      {/* Active Dashboard Workspace or Storefront */}
      <main
        id="aponbazar-main-content"
        className={`flex-1 w-full mx-auto pb-28 md:pb-8 ${
          isStorefront
            ? 'max-w-7xl px-2 sm:px-4 pt-1 sm:pt-2'
            : 'max-w-7xl p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6'
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pageKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderDashboard()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Toast System */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <SystemSettingsProvider>
            <AuthProvider>
              <BDLocalDatabaseProvider>
                <LocalAddressDatabaseProvider>
                  <RoleApplicationProvider>
                    <ProductMasterDatabaseProvider>
                      <ECommerceProvider>
                        <NetworkMarketingProvider>
                          <GlobalErrorBoundary>
                            <MainContent />
                          </GlobalErrorBoundary>
                        </NetworkMarketingProvider>
                      </ECommerceProvider>
                    </ProductMasterDatabaseProvider>
                  </RoleApplicationProvider>
                </LocalAddressDatabaseProvider>
              </BDLocalDatabaseProvider>
            </AuthProvider>
          </SystemSettingsProvider>
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
