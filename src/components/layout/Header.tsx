/**
 * Enterprise Responsive Header Component for "আপন বাজার (Apon Bazar)"
 * - Logged Out: Main menu shows Sign In + Registration, Top bar hides My Account
 * - Logged In / Auto-Login: Main menu shows Logout, Top bar shows My Account
 * - Wishlist + Cart always visible with live counters
 * - Brand: Apon Bazar / আপন বাজার
 * - Responsive & Mobile-First
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { useECommerce } from '../../context/ECommerceContext';
import { LanguageToggle } from '../common/LanguageToggle';
import { ThemeToggle } from '../common/ThemeToggle';
import { NotificationBell } from '../common/NotificationBell';
import { PhoneOtpModal } from '../auth/PhoneOtpModal';
import { RegisterModal } from '../auth/RegisterModal';
import { NetworkMemberProfileModal } from '../profile/NetworkMemberProfileModal';
import { WishlistModal } from '../shop/WishlistModal';
import { AppDealsModal } from '../shop/AppDealsModal';
import { SellOnModal } from '../shop/SellOnModal';
import { OrderTrackerModal } from '../shop/OrderTrackerModal';
import { BazarSadaiDrawer } from '../shop/BazarSadaiDrawer';
import { CartDrawer } from '../shop/CartDrawer';
import { CheckoutModal } from '../shop/CheckoutModal';
import { ApplicationHubModal } from '../application/ApplicationHubModal';
import { ApplicationRoleType } from '../../types';
import { CategoryMenuSticky } from '../shop/CategoryMenuSticky';
import { BrandLogo } from '../common/BrandLogo';
import {
  Home,
  Menu as MenuIcon,
  ShoppingBag,
  Search,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Sparkles,
  Flame,
  Store,
  ChevronDown,
  LayoutDashboard,
  PackageCheck,
  Heart,
  Settings,
  Building2,
  Briefcase,
  Truck,
  Users,
  Award,
  X
} from 'lucide-react';
import { roleLabels } from '../../lib/i18n';
import { getDashboardPathForRole, getRoleVisibleName, resolveUserHighestRole } from '../../lib/rbac';

export const Header: React.FC = () => {
  const { currentUser, activeRole, isLoggedIn, logout, setActiveRole } = useAuth();
  const { language, t } = useLanguage();
  const { isPilotMode, pilotArea } = useSystemSettings();
  const {
    wishlist,
    cart,
    selectedCategory,
    setSelectedCategory,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useECommerce();

  // Show category menu directly below top main menu when viewing the customer storefront
  const isStorefront = !isLoggedIn || activeRole === 'customer';

  // Modals & Popovers
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerInitialRole, setRegisterInitialRole] = useState<'buyer' | 'seller' | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [showAppDealsModal, setShowAppDealsModal] = useState(false);
  const [showSellOnModal, setShowSellOnModal] = useState(false);
  const [showOrderTrackerModal, setShowOrderTrackerModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [initialApplicationRole, setInitialApplicationRole] = useState<ApplicationRoleType | 'tracker' | undefined>(undefined);
  
  // Navigation Drawers & Checkout
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleOpenApplication = (role?: ApplicationRoleType | 'tracker') => {
    setInitialApplicationRole(role);
    setShowApplicationModal(true);
  };

  // Dropdown & Search States
  const [isCustomerMenuOpen, setIsCustomerMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sync search input with global storefront search query
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setGlobalSearchQuery(value);
  };

  // Refs for customer dropdown and outside click detection
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const desktopCustomerButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCustomerButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Live item counts
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlist.length;

  // Focus search input when mobile search opens
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  // Click outside & Escape key listeners for Customer Profile Dropdown
  useEffect(() => {
    if (!isCustomerMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInsideDropdown = customerDropdownRef.current?.contains(target);
      const clickedDesktopButton = desktopCustomerButtonRef.current?.contains(target);
      const clickedMobileButton = mobileCustomerButtonRef.current?.contains(target);

      // If clicked outside the dropdown container AND outside the trigger buttons, close it
      if (!clickedInsideDropdown && !clickedDesktopButton && !clickedMobileButton) {
        setIsCustomerMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        setIsCustomerMenuOpen(false);
      }
    };

    // Attach document-level listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCustomerMenuOpen]);

  // Automatically close customer dropdown when any modal, drawer, or search overlay opens
  useEffect(() => {
    if (
      isDrawerOpen ||
      isCartOpen ||
      isCheckoutOpen ||
      showLoginModal ||
      showRegisterModal ||
      showProfileModal ||
      showWishlistModal ||
      showAppDealsModal ||
      showSellOnModal ||
      showOrderTrackerModal ||
      showApplicationModal ||
      isMobileSearchOpen
    ) {
      setIsCustomerMenuOpen(false);
    }
  }, [
    isDrawerOpen,
    isCartOpen,
    isCheckoutOpen,
    showLoginModal,
    showRegisterModal,
    showProfileModal,
    showWishlistModal,
    showAppDealsModal,
    showSellOnModal,
    showOrderTrackerModal,
    showApplicationModal,
    isMobileSearchOpen,
  ]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsCustomerMenuOpen(false);
      await logout();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Header logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavigateToDashboard = () => {
    setIsCustomerMenuOpen(false);
    const targetRole = resolveUserHighestRole(currentUser?.roles, currentUser?.primaryRole, currentUser?.id);
    setActiveRole(targetRole);
    if (typeof window !== 'undefined') {
      const targetPath = getDashboardPathForRole(targetRole);
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new Event('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    setActiveRole('customer');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const permanentId = currentUser?.permanentMemberId || (currentUser?.id ? `APON-${currentUser.id.slice(-6).toUpperCase()}` : 'APON-100293');

  return (
    <>
      <header
        id="aponbazar-fixed-top-header"
        className="sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 z-50 transition-shadow duration-200 shadow-xs"
      >
        {/* 1. TOP MAIN MENU CONTAINER */}
        <div id="aponbazar-top-main-menu" className="max-w-7xl mx-auto px-3 sm:px-4 py-2 relative">
          
          {/* =========================================================================
              1. TOP ROW: Brand Identity, Search (Desktop), Actions & Controls
             ========================================================================= */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            
            {/* Left: Hamburger Menu & Logo & Brand Identity */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                id="top-main-nav-hamburger"
                onClick={() => setIsDrawerOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs"
                title="Open Navigation Menu"
                aria-label="Open Menu"
              >
                <MenuIcon className="w-5 h-5 text-neutral-800 dark:text-neutral-100" />
              </button>

              <div
                className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none"
                onClick={handleHomeClick}
                title="Apon Bazar Home"
              >
                <BrandLogo size="md" iconOnly={true} className="shrink-0" />
                <div>
                  <h1 className="text-sm sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-1.5 flex-wrap">
                    <span className="text-emerald-700 dark:text-emerald-400 font-extrabold tracking-tight">
                      Apon <span className="text-orange-500">Bazar</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-600 dark:text-neutral-300 hidden sm:inline">
                      ({t('companyName')})
                    </span>
                    {isPilotMode ? (
                      <span className="text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                        <Sparkles className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                        <span>পাইলট: {pilotArea.upazilaBn}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        আপন এক্সপ্রেস
                      </span>
                    )}
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-emerald-800 dark:text-emerald-300 font-medium hidden sm:block">
                    — আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Desktop Search Bar (Hidden on Mobile) */}
            <div className="hidden md:flex items-center flex-1 max-w-sm xl:max-w-md mx-2 relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 pl-9 pr-8 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Desktop Navigation & Action Buttons (Hidden on Mobile) */}
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              
              {/* 1. GET APP DEALS BUTTON */}
              <button
                type="button"
                onClick={() => setShowAppDealsModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Get App Exclusive Deals & Coupons"
              >
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{language === 'bn' ? 'অ্যাপ অফার' : 'App Deals'}</span>
              </button>

              {/* 2. SELL ON Apon Bazar BUTTON */}
              <button
                type="button"
                onClick={() => setShowSellOnModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Sell on Apon Bazar as Merchant or Dealer"
              >
                <Store className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{language === 'bn' ? 'সেলার হন' : 'Sell on App'}</span>
              </button>

              {/* 3. APPLICATION BUTTON */}
              <button
                type="button"
                onClick={() => handleOpenApplication()}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Apply for Admin, Operational Officer, Delivery Man roles"
              >
                <Award className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{language === 'bn' ? 'আবেদন পোর্টাল' : 'Apply'}</span>
              </button>

              {/* 4. WISHLIST BUTTON */}
              <button
                type="button"
                onClick={() => setShowWishlistModal(true)}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden xl:inline">{language === 'bn' ? 'পছন্দ' : 'Wishlist'}</span>
                {totalWishlistCount > 0 && (
                  <span className="bg-rose-600 text-white font-bold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {totalWishlistCount}
                  </span>
                )}
              </button>

              {/* 4. CART BUTTON */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{language === 'bn' ? 'কার্ট' : 'Cart'}</span>
                {totalCartCount > 0 && (
                  <span className="bg-white text-emerald-700 font-bold text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* 5. TOP BAR AUTH SECTION:
                  - Logged In: SHOWS "My Account" dropdown (with switch/register/logout actions inside)
                  - Logged Out: SHOWS prominent Log In and Registration buttons */}
              {isLoggedIn && currentUser && currentUser.id !== 'guest' ? (
                /* LOGGED IN: MY ACCOUNT DROPDOWN */
                <div className="relative">
                  <button
                    ref={desktopCustomerButtonRef}
                    type="button"
                    onClick={() => setIsCustomerMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border ${
                      isCustomerMenuOpen
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-200'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                    }`}
                    aria-expanded={isCustomerMenuOpen}
                    aria-haspopup="true"
                    id="desktop-account-menu-button"
                  >
                    <div className="relative">
                      <img
                        src={
                          currentUser.profilePhotoUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        }
                        alt={currentUser.fullName}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-emerald-500"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-neutral-900" />
                    </div>
                    <span className="max-w-[85px] sm:max-w-[110px] truncate font-extrabold">
                      {currentUser.fullName.split(' ')[0] || (language === 'bn' ? 'অ্যাকাউন্ট' : 'Account')}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isCustomerMenuOpen ? 'rotate-180 text-emerald-600' : 'text-neutral-400'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                /* LOGGED OUT: High-visibility Login & Registration buttons */
                <div className="flex items-center gap-1.5">
                  <button
                    id="desktop-header-login-btn"
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-700/80 rounded-xl transition-all shadow-2xs cursor-pointer group"
                    title={language === 'bn' ? 'লগইন করুন' : 'Log In'}
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>{language === 'bn' ? 'লগইন' : 'Log In'}</span>
                  </button>
                  <button
                    id="desktop-header-register-btn"
                    type="button"
                    onClick={() => {
                      setRegisterInitialRole(undefined);
                      setShowRegisterModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-all cursor-pointer shadow-xs group"
                    title={language === 'bn' ? 'নতুন অ্যাকাউন্ট রেজিস্টার করুন' : 'Register New Account'}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                    <span>{language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}</span>
                  </button>
                </div>
              )}

              {/* Language & Theme Switchers */}
              <LanguageToggle />
              <ThemeToggle />

              {/* Notification Bell */}
              <NotificationBell />

            </div>

            {/* Mobile Top Right Utilities (Wishlist, Cart, Language, Theme, Bell) */}
            <div className="flex md:hidden items-center gap-1">
              
              {/* Mobile Header Wishlist */}
              <button
                type="button"
                onClick={() => setShowWishlistModal(true)}
                className="relative p-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="Wishlist"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                {totalWishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white font-black text-[8px] min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white dark:border-neutral-900">
                    {totalWishlistCount}
                  </span>
                )}
              </button>

              {/* Mobile Header Cart */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="Cart"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white font-black text-[8px] min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center border border-white dark:border-neutral-900 animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <LanguageToggle />
              <ThemeToggle />
              <NotificationBell />
            </div>

          </div>

          {/* =========================================================================
              2. MOBILE SEARCH BAR (Clean & Compact)
             ========================================================================= */}
          <div className="block md:hidden mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
            {/* Full-Width Mobile Search Bar */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={language === 'bn' ? 'পণ্য বা ক্যাটাগরি খুঁজুন...' : 'Search products or categories...'}
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-2 pl-9 pr-9 text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  aria-label="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {/* =========================================================================
              3. SHARED MY ACCOUNT DROPDOWN MENU POPOVER (WHEN LOGGED IN)
             ========================================================================= */}
          {isCustomerMenuOpen && isLoggedIn && currentUser && currentUser.id !== 'guest' && (
            <div
              ref={customerDropdownRef}
              id="aponbazar-customer-profile-dropdown"
              className="fixed md:absolute bottom-16 md:bottom-auto md:top-full right-3 sm:right-4 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto"
              role="menu"
              aria-orientation="vertical"
            >
              <div className="space-y-2">
                {/* User Profile Card */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-neutral-800 dark:to-neutral-800/80 rounded-xl border border-emerald-100 dark:border-neutral-700/80">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        currentUser.profilePhotoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                      }
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-xl object-cover border-2 border-emerald-500 shadow-2xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs text-neutral-900 dark:text-white truncate">
                        {currentUser.fullName}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {currentUser.mobileNumber || currentUser.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider">
                          {(() => {
                            const topRole = resolveUserHighestRole(currentUser.roles, currentUser.primaryRole, currentUser.id);
                            return (roleLabels[topRole]?.[language] || topRole || 'Customer').toUpperCase();
                          })()}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono">
                          {permanentId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-0.5 pt-1">
                  {/* 1. Dashboard */}
                  <button
                    type="button"
                    onClick={handleNavigateToDashboard}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Dashboard'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-emerald-600">→</span>
                  </button>

                  {/* 2. My Orders & Tracking */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setShowOrderTrackerModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <PackageCheck className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'আমার অর্ডারসমূহ ও ট্র্যাকিং' : 'My Orders & Tracking'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-blue-600">→</span>
                  </button>

                  {/* 3. Wishlist */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setShowWishlistModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'পছন্দের তালিকা (Wishlist)' : 'My Wishlist'}</span>
                    </div>
                    {totalWishlistCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black">
                        {totalWishlistCount}
                      </span>
                    )}
                  </button>

                  {/* 4. App Deals */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setShowAppDealsModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                        <Flame className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'অ্যাপ এক্সক্লুসিভ অফার' : 'Get App Deals'}</span>
                    </div>
                    <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1 rounded-sm uppercase">
                      HOT
                    </span>
                  </button>

                  {/* 5. Role Applications Portal */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      handleOpenApplication();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'আবেদন ও ক্যারিয়ার পোর্টাল' : 'Role Applications (Admin/Ops/Rider)'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-indigo-600">→</span>
                  </button>

                  {/* 6. Profile & Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'প্রোফাইল ও সেটিংস' : 'Profile & Settings'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-purple-600">→</span>
                  </button>

                  {/* 7. Switch / Log In to Another Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'অন্য অ্যাকাউন্টে লগইন' : 'Switch / Log In'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-blue-600">→</span>
                  </button>

                  {/* 8. Register New Account */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomerMenuOpen(false);
                      setRegisterInitialRole(undefined);
                      setShowRegisterModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <span>{language === 'bn' ? 'নতুন অ্যাকাউন্ট রেজিস্ট্রেশন' : 'Register New Account'}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-emerald-600">→</span>
                  </button>
                </div>

                {/* Log Out Button */}
                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2">
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-all border border-rose-200/60 dark:border-rose-900/60 cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-5 h-5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 flex items-center justify-center">
                      <LogOut className={`w-3.5 h-3.5 ${isLoggingOut ? 'animate-spin' : ''}`} />
                    </div>
                    <span>{isLoggingOut ? (language === 'bn' ? 'লগআউট হচ্ছে...' : 'Logging out...') : (language === 'bn' ? 'লগআউট করুন' : 'Log Out')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. CATEGORY MENU DIRECTLY BELOW TOP MAIN MENU
            Both Top Main Menu and Category Menu are fixed/sticky together at the top.
            When the user scrolls the page, both menus remain visible.
           ========================================================================= */}
        {isStorefront && (
          <CategoryMenuSticky
            selectedCategoryId={selectedCategory}
            onSelectCategory={(catId) => {
              setSelectedCategory(catId);
              if (typeof window !== 'undefined') {
                const productSection = document.getElementById('aponbazar-main-catalog-section');
                if (productSection) {
                  const yOffset = -140;
                  const y = productSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
                }
              }
            }}
          />
        )}
      </header>

      {/* =========================================================================
          4. MODALS, DRAWERS & PORTALS
         ========================================================================= */}
      
      {/* 1. Slide-Out Main Menu Drawer */}
      <BazarSadaiDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedCatId={selectedCategory}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setIsDrawerOpen(false);
          if (typeof window !== 'undefined') {
            const productSection = document.getElementById('aponbazar-main-catalog-section');
            if (productSection) {
              const yOffset = -140;
              const y = productSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
            }
          }
        }}
        onOpenCart={() => {
          setIsDrawerOpen(false);
          setIsCartOpen(true);
        }}
        onOpenWishlist={() => {
          setIsDrawerOpen(false);
          setShowWishlistModal(true);
        }}
        onOpenOrderTracker={() => {
          setIsDrawerOpen(false);
          setShowOrderTrackerModal(true);
        }}
        onOpenCompare={() => setIsDrawerOpen(false)}
        onOpenAccount={() => {
          setIsDrawerOpen(false);
          setIsCustomerMenuOpen(true);
        }}
        onOpenLogin={() => {
          setIsDrawerOpen(false);
          setShowLoginModal(true);
        }}
        onOpenRegister={() => {
          setIsDrawerOpen(false);
          setRegisterInitialRole(undefined);
          setShowRegisterModal(true);
        }}
        onOpenAppDeals={() => {
          setIsDrawerOpen(false);
          setShowAppDealsModal(true);
        }}
        onOpenSellOn={() => {
          setIsDrawerOpen(false);
          setShowSellOnModal(true);
        }}
        onOpenApplicationModal={(role) => {
          setIsDrawerOpen(false);
          handleOpenApplication(role);
        }}
        onNavigateToDashboard={handleNavigateToDashboard}
        onLogout={handleLogout}
        onToggleMap={() => setIsDrawerOpen(false)}
      />

      {/* 2. Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* 3. Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* 4. App Deals Modal */}
      <AppDealsModal
        isOpen={showAppDealsModal}
        onClose={() => setShowAppDealsModal(false)}
      />

      {/* 5. Sell On Apon Bazar Modal */}
      <SellOnModal
        isOpen={showSellOnModal}
        onClose={() => setShowSellOnModal(false)}
        onOpenRegisterAsDealer={() => {
          setShowSellOnModal(false);
          setRegisterInitialRole('seller');
          setShowRegisterModal(true);
        }}
      />

      {/* 6. Wishlist Modal */}
      <WishlistModal
        isOpen={showWishlistModal}
        onClose={() => setShowWishlistModal(false)}
      />

      {/* 7. Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={showOrderTrackerModal}
        onClose={() => setShowOrderTrackerModal(false)}
      />

      {/* 8. User Profile Modal */}
      <NetworkMemberProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* 9. Login Modal (Phone OTP / Credential / Demo Login) */}
      <PhoneOtpModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setRegisterInitialRole(undefined);
          setShowRegisterModal(true);
        }}
      />

      {/* 10. Registration Modal (Multi-Role Buyer & Seller Registration System) */}
      <RegisterModal
        isOpen={showRegisterModal}
        initialRole={registerInitialRole}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* 11. Official Application Hub Modal (3 Role Applications & Tracking) */}
      <ApplicationHubModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        initialRole={initialApplicationRole}
      />

      {/* =========================================================================
          12. LARGE PROMINENT FIXED MOBILE BOTTOM NAVIGATION BAR
          (Home, Menu, Cart, Search, Account) - Specially optimized for Android one-hand ergonomics
         ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/90 dark:border-neutral-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] block md:hidden pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center px-1 py-1.5">
          
          {/* 1. HOME */}
          <button
            id="mobile-bottom-nav-home"
            type="button"
            onClick={handleHomeClick}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer min-h-[52px]"
          >
            <Home className="w-5 h-5 mb-1 stroke-[2.2]" />
            <span className="text-[11px] font-black leading-none">
              {language === 'bn' ? 'হোম' : 'Home'}
            </span>
          </button>

          {/* 2. MENU */}
          <button
            id="mobile-bottom-nav-menu"
            type="button"
            onClick={() => {
              setIsCustomerMenuOpen(false);
              setIsDrawerOpen(true);
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer min-h-[52px]"
          >
            <MenuIcon className="w-5 h-5 mb-1 stroke-[2.2]" />
            <span className="text-[11px] font-black leading-none">
              {language === 'bn' ? 'মেনু' : 'Menu'}
            </span>
          </button>

          {/* 3. CART (Center Highlighted with Live Count Badge) */}
          <button
            id="mobile-bottom-nav-cart"
            type="button"
            onClick={() => {
              setIsCustomerMenuOpen(false);
              setIsCartOpen(true);
            }}
            className="relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all active:scale-95 cursor-pointer min-h-[52px]"
          >
            <div className="relative">
              <div className="p-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                <ShoppingBag className="w-5 h-5 stroke-[2.4]" />
              </div>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white font-black text-[10px] min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow-sm animate-pulse">
                  {totalCartCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-black leading-none mt-1 text-emerald-700 dark:text-emerald-400">
              {language === 'bn' ? 'কার্ট' : 'Cart'}
            </span>
          </button>

          {/* 4. SEARCH */}
          <button
            id="mobile-bottom-nav-search"
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                mobileSearchInputRef.current?.focus();
              }, 250);
            }}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer min-h-[52px]"
          >
            <Search className="w-5 h-5 mb-1 stroke-[2.2]" />
            <span className="text-[11px] font-black leading-none">
              {language === 'bn' ? 'সার্চ' : 'Search'}
            </span>
          </button>

          {/* 5. ACCOUNT / LOGIN */}
          {isLoggedIn && currentUser && currentUser.id !== 'guest' ? (
            <div className="relative flex flex-col items-center">
              <button
                id="mobile-bottom-nav-account"
                ref={mobileCustomerButtonRef}
                type="button"
                onClick={() => setIsCustomerMenuOpen((prev) => !prev)}
                className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95 cursor-pointer min-h-[52px]"
                aria-expanded={isCustomerMenuOpen}
                aria-haspopup="true"
              >
                <img
                  src={
                    currentUser.profilePhotoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                  }
                  alt={currentUser.fullName}
                  className="w-5 h-5 mb-1 rounded-full object-cover border border-emerald-500"
                />
                <span className="text-[11px] font-black leading-none truncate max-w-full">
                  {currentUser.fullName.split(' ')[0] || (language === 'bn' ? 'প্রোফাইল' : 'Account')}
                </span>
              </button>
            </div>
          ) : (
            <button
              id="mobile-bottom-nav-login"
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-all active:scale-95 cursor-pointer min-h-[52px]"
            >
              <LogIn className="w-5 h-5 mb-1 stroke-[2.4] text-emerald-600 dark:text-emerald-400" />
              <span className="text-[11px] font-black leading-none text-emerald-700 dark:text-emerald-300">
                {language === 'bn' ? 'লগইন' : 'Log In'}
              </span>
            </button>
          )}

        </div>
      </div>
    </>
  );
};
