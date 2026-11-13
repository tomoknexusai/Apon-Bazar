/**
 * Navigation Drawer Menu Component for "আপন বাজার (Apon Bazar)"
 * Responsive Mobile & Desktop Slide-Out Main Menu
 * Project: আপন বাজার (Apon Bazar)
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import { BrandLogo } from '../common/BrandLogo';
import {
  X,
  ShoppingBag,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Truck,
  Heart,
  Scale,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Building2,
  PhoneCall,
  Zap,
  Tag,
  Grid,
  LayoutDashboard,
  Flame,
  Store,
  Settings,
  Award
} from 'lucide-react';
import { roleLabels } from '../../lib/i18n';
import { resolveUserHighestRole, getDashboardPathForRole } from '../../lib/rbac';

interface BazarSadaiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCatId: string;
  onSelectCategory: (catId: string) => void;
  onOpenCart: () => void;
  onOpenWishlist?: () => void;
  onOpenOrderTracker: () => void;
  onOpenCompare: () => void;
  onOpenAccount: () => void;
  onOpenLogin?: () => void;
  onOpenRegister?: () => void;
  onLogout?: () => void;
  onOpenAppDeals?: () => void;
  onOpenSellOn?: () => void;
  onOpenApplicationModal?: (role?: any) => void;
  onNavigateToDashboard?: () => void;
  onToggleMap: () => void;
  onOpenMultiChannel?: (channel?: any) => void;
}

export const BazarSadaiDrawer: React.FC<BazarSadaiDrawerProps> = ({
  isOpen,
  onClose,
  selectedCatId,
  onSelectCategory,
  onOpenCart,
  onOpenWishlist,
  onOpenOrderTracker,
  onOpenCompare,
  onOpenAccount,
  onOpenLogin,
  onOpenRegister,
  onLogout,
  onOpenAppDeals,
  onOpenSellOn,
  onOpenApplicationModal,
  onNavigateToDashboard,
  onToggleMap,
  onOpenMultiChannel
}) => {
  const { currentUser, isLoggedIn, logout, setActiveRole } = useAuth();
  const { categories, products, cart, wishlist, compareList, orders } = useECommerce();
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
    }
    onClose();
  };

  const handleDashboard = () => {
    onClose();
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    } else {
      const targetRole = resolveUserHighestRole(currentUser?.roles, currentUser?.primaryRole, currentUser?.id);
      setActiveRole(targetRole);
      if (typeof window !== 'undefined') {
        const targetPath = getDashboardPathForRole(targetRole);
        window.history.pushState({}, '', targetPath);
        window.dispatchEvent(new Event('popstate'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const permanentId = currentUser?.permanentMemberId || (currentUser?.id ? `APON-${currentUser.id.slice(-6).toUpperCase()}` : 'APON-100293');

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 h-full overflow-y-auto flex flex-col justify-between p-5 space-y-6 shadow-2xl z-10 text-xs">
        
        {/* Drawer Header & Content */}
        <div className="space-y-4">
          
          {/* Top Brand Header & Close Button */}
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" iconOnly={true} className="shrink-0" />
              <div>
                <h2 className="font-black text-sm text-neutral-900 dark:text-white leading-none flex items-center gap-1">
                  <span className="text-emerald-700 dark:text-emerald-400">Apon</span>
                  <span className="text-orange-500">Bazar</span>
                </h2>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                  — আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* =========================================================================
              MAIN MENU AUTH SECTION:
              - Logged Out: Shows Sign In + Registration buttons
              - Logged In: Shows User Profile summary + Logout button
             ========================================================================= */}
          {isLoggedIn && currentUser ? (
            /* Logged In View */
            <div className="space-y-2">
              {/* User Profile Card */}
              <div
                onClick={handleDashboard}
                className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-neutral-800 dark:to-neutral-800/80 rounded-2xl border border-emerald-200/80 dark:border-neutral-700 cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={
                        currentUser.profilePhotoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                      }
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-500"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-neutral-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-neutral-900 dark:text-white text-xs truncate">
                      {currentUser.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-wider">
                        {(roleLabels[currentUser.primaryRole || 'customer']?.[language] || currentUser.primaryRole || 'Customer').toUpperCase()}
                      </span>
                      <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {permanentId}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>

              {/* Dashboard Link & Logout Button */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDashboard}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}</span>
                </button>

                {/* LOGOUT BUTTON IN MAIN MENU */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 rounded-xl font-bold transition-all text-[11px] cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>{language === 'bn' ? 'লগআউট' : 'Log Out'}</span>
                </button>
              </div>

              {/* Quick Switch / Register actions */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <LogIn className="w-3 h-3 text-blue-500" />
                  <span>{language === 'bn' ? 'অন্য লগইন' : 'Switch Login'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenRegister) onOpenRegister();
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3 h-3 text-emerald-500" />
                  <span>{language === 'bn' ? 'নতুন রেজিস্টার' : 'Register'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out View: Shows Sign In + Registration */
            <div className="space-y-2.5 p-3 bg-gradient-to-br from-neutral-50 via-emerald-50/30 to-teal-50/20 dark:from-neutral-800/80 dark:to-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <div className="text-center space-y-0.5">
                <h3 className="font-extrabold text-xs text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'Apon Bazar-এ স্বাগতম' : 'Welcome to Apon Bazar'}
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {language === 'bn'
                    ? 'অর্ডার ট্র্যাকিং ও কেনাকাটায় প্রবেশ করুন'
                    : 'Sign in to track orders and manage account'}
                </p>
              </div>

              {/* MAIN MENU AUTH BUTTONS: Sign In + Registration */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* 1. SIGN IN BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] shadow-sm transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'লগইন' : 'Sign In'}</span>
                </button>

                {/* 2. REGISTRATION BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenRegister) onOpenRegister();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-600 rounded-xl font-black text-[11px] transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Categories Navigation */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-black uppercase text-neutral-400 tracking-wider block flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'bn' ? 'প্রোডাক্ট ক্যাটাগরি' : 'Product Categories'}</span>
            </span>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl font-bold text-left flex items-center justify-between transition-colors ${
                  selectedCatId === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'bn' ? 'সব পণ্য' : 'All Products'} ({products.length})</span>
                </span>
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>

              {categories.map((c) => {
                const count = products.filter((p) => p.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(c.id);
                      onClose();
                    }}
                    className={`w-full p-2.5 rounded-xl font-bold text-left flex items-center justify-between transition-colors ${
                      selectedCatId === c.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span>{language === 'bn' ? c.nameBn : c.name}</span>
                    <span className="text-[10px] opacity-80 px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-[11px] font-black uppercase text-neutral-400 tracking-wider block">
              {language === 'bn' ? 'কুইক সার্ভিস ও টুলস' : 'Quick Services & Tools'}
            </span>

            <div className="space-y-1 font-bold">
              
              {/* Wishlist Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenWishlist) onOpenWishlist();
                }}
                className="w-full p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>{language === 'bn' ? 'পছন্দের তালিকা (Wishlist)' : 'My Wishlist'}</span>
                </span>
                {wishlist.length > 0 && (
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-black rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* 5-Channel Order Hub Link */}
              {onOpenMultiChannel && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMultiChannel('whatsapp');
                  }}
                  className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-300/40 flex items-center justify-between cursor-pointer font-bold"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>৫-চ্যানেল অর্ডার (WhatsApp/Voice)</span>
                  </span>
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-sm">
                    NEW
                  </span>
                </button>
              )}

              {/* Shopping Cart Link */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="w-full p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'bn' ? 'আমার শপিং কার্ট' : 'Shopping Cart'}</span>
                </span>
                {totalCartCount > 0 && (
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full animate-pulse">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {/* Order Tracker */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrderTracker();
                }}
                className="w-full p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-500" />
                  <span>{language === 'bn' ? 'অর্ডার ট্র্যাকিং ও ডেলিভারি' : 'Order Tracking'}</span>
                </span>
                {orders.length > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-neutral-950 text-[10px] font-black rounded-full">
                    {orders.length}
                  </span>
                )}
              </button>

              {/* App Exclusive Deals */}
              {onOpenAppDeals && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAppDeals();
                  }}
                  className="w-full p-2.5 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>{language === 'bn' ? 'অ্যাপ এক্সক্লুসিভ অফার' : 'App Deals'}</span>
                  </span>
                  <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1 rounded-sm uppercase">
                    HOT
                  </span>
                </button>
              )}

              {/* Sell On Apon Bazar */}
              {onOpenSellOn && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSellOn();
                  }}
                  className="w-full p-2.5 rounded-xl text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-teal-500" />
                    <span>{language === 'bn' ? 'Apon Bazar সেলার হন' : 'Sell on Apon Bazar'}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </button>
              )}

              {/* Compare */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCompare();
                }}
                className="w-full p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  <span>{language === 'bn' ? 'পণ্য তুলনা (Compare)' : 'Compare Products'}</span>
                </span>
                <span className="text-neutral-400 font-mono text-[10px]">
                  {compareList.length}
                </span>
              </button>

              {/* Warehouse & Logistics */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleMap();
                }}
                className="w-full p-2.5 rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-500" />
                  <span>{language === 'bn' ? 'ওয়্যারহাউজ ও হাব ম্যাপ' : 'Warehouse & Hubs'}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

            </div>
          </div>

        </div>

        {/* Drawer Footer / Brand Footer */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-center text-[10px] text-neutral-500">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{language === 'bn' ? '১০০% খাঁটি পণ্য ও ক্যাশ অন ডেলিভারি' : '100% Authentic & Cash on Delivery'}</span>
          </div>

          <p>© ২০২৬ {language === 'bn' ? 'Apon Bazar' : 'Apon Bazar'}. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>

      </div>

    </div>
  );
};
