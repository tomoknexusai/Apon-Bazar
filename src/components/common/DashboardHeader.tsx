/**
 * Universal Dashboard Header Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 *
 * Enforces Requirements:
 * 1. For every authenticated user, displays:
 *    - 👤 Full Name
 *    - 🆔 Permanent Member ID (Single unified ID, e.g., GBD000001)
 *    - 📱 Mobile Number
 *    - 👥 Current Role (Customer / Network Active Member / Dealer / Operations Partner / Delivery Man / Admin / Super Admin)
 *    - 🟢 Account Status (Active / Inactive)
 *    - 🌐 Network Status (Inactive / Active Member)
 *    - 🔔 Notifications
 *    - ⚙️ Settings
 *    - 👤 Profile
 *    - 🚪 Logout
 *
 * 2. When the user becomes a Network Active Member:
 *    Keeps the same Permanent Member ID and additionally displays:
 *    - 🔗 Referral Code
 *    - 🔗 Referral Link
 *    - 👥 Sponsor ID
 *    - 👥 Placement ID
 *    - 👥 Left Leg Count
 *    - 👥 Right Leg Count
 *    - ⭐ Current Rank
 *    - 💰 Commission Wallet Balance
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { formatPV } from '../../lib/ecommerce-data';
import { roleLabels } from '../../lib/i18n';
import { NotificationBell } from './NotificationBell';
import { SettingsModal } from './SettingsModal';
import { NetworkMemberProfileModal } from '../profile/NetworkMemberProfileModal';
import { UserRole } from '../../types';
import { UniqueIdService } from '../../services/UniqueIdService';
import { motion } from 'motion/react';
import {
  User,
  ShieldCheck,
  LogOut,
  Settings,
  BadgeCheck,
  Hash,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Users,
  Award,
  Wallet,
  Link as LinkIcon,
  Sparkles,
  X,
  MapPin,
  Share2,
  ChevronRight,
  Crown
} from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  icon,
  rightAction
}) => {
  const { currentUser, activeRole, logout } = useAuth();
  const { language } = useLanguage();
  const { currentMember, isNetworkActive: networkContextActive, wallets } = useNetworkMarketing();
  const { isPilotMode, pilotArea } = useSystemSettings();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError(null);
      const res = await logout();
      if (!res.success && res.message) {
        setLogoutError(res.message);
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Logout handler error:', err);
      setLogoutError(err?.message || 'লগআউট ব্যর্থ হয়েছে');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!currentUser) return null;

  // Role display label formatter
  const getFormattedRoleLabel = (role: UserRole, lang: 'bn' | 'en') => {
    switch (role) {
      case 'super_admin':
        return lang === 'bn' ? 'সুপার অ্যাডমিন' : 'Super Admin';
      case 'admin':
        return lang === 'bn' ? 'অ্যাডমিন' : 'Admin';
      case 'customer':
        return lang === 'bn' ? 'কাস্টমার' : 'Customer';
      case 'network_member':
        return lang === 'bn' ? 'নেটওয়ার্ক অ্যাক্টিভ মেম্বার' : 'Network Active Member';
      case 'dealer':
      case 'vendor':
        return lang === 'bn' ? 'ডিলার' : 'Dealer';
      case 'operations_partner':
        return lang === 'bn' ? 'অপারেশনস পার্টনার' : 'Operations Partner';
      case 'delivery_rider':
        return lang === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Man';
      default:
        return roleLabels[role]?.[lang] || role;
    }
  };

  const roleLabel = getFormattedRoleLabel(activeRole, language);

  // Single Permanent Member ID throughout the platform (e.g. GBD000001 or GBBD-XXXXXX)
  const permanentMemberId =
    currentUser.permanentMemberId ||
    `GBD${(currentUser.id || '000001').replace(/\D/g, '').padStart(6, '0')}`;

  // Check network active status across contexts
  const isNetworkActive =
    currentUser.isNetworkActive ||
    activeRole === 'network_member' ||
    networkContextActive;

  // Account status formatting
  const isAccountActive = currentUser.accountStatus === 'active';

  // Referral details for network active members
  const referralCode = permanentMemberId;
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Rank title formatting
  const rankTitle =
    currentMember?.packageName ||
    (currentMember?.rank
      ? currentMember.rank.replace(/_/g, ' ').toUpperCase()
      : language === 'bn'
      ? 'নেটওয়ার্ক মেম্বার'
      : 'Network Active Member');

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="bg-white text-neutral-900 rounded-3xl p-5 sm:p-6 shadow-xs border border-[#C8E6C9] relative overflow-hidden space-y-5"
      >
        
        {/* Decorative Background Blur Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* ----------------------------------------------------------------- */}
        {/* TOP ROW: Dashboard Icon + Title & Top Header Control Buttons      */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-[#E8F5E9] pb-4">
          
          {/* Dashboard Title & Icon */}
          <div className="flex items-center gap-3.5">
            {icon ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] flex items-center justify-center text-[#157347] shadow-xs shrink-0">
                {icon}
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] flex items-center justify-center text-[#157347] shadow-xs shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#157347] flex items-center gap-2">
                <span>{title || `${roleLabel} Dashboard`}</span>
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-neutral-600 mt-0.5 font-medium">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Control Buttons: Role Switcher (Super Admin only), Notifications, Settings, Profile, Logout */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Right Action (e.g. Super Admin Role Dropdown) */}
            {rightAction}

            {/* 🔔 Notifications */}
            <div className="bg-[#F4FBF5] rounded-xl p-1.5 border border-[#C8E6C9] shadow-xs">
              <NotificationBell />
            </div>

            {/* ⚙️ Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings / সেটিংস"
              className="p-3 sm:p-2.5 bg-white hover:bg-emerald-50 text-neutral-700 hover:text-[#157347] rounded-xl border border-[#C8E6C9] transition-all flex items-center gap-1.5 text-xs sm:text-sm font-bold shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Settings className="w-4 h-4 text-[#157347]" />
              <span className="inline">⚙️ {language === 'bn' ? 'সেটিংস' : 'Settings'}</span>
            </button>

            {/* 👤 Profile Button */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              title="User Profile / প্রোফাইল"
              className="p-3 sm:p-2.5 bg-white hover:bg-emerald-50 text-neutral-700 hover:text-[#157347] rounded-xl border border-[#C8E6C9] transition-all flex items-center gap-1.5 text-xs sm:text-sm font-bold shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
            >
              <User className="w-4 h-4 text-[#157347]" />
              <span className="inline">👤 {language === 'bn' ? 'প্রোফাইল' : 'Profile'}</span>
            </button>

            {/* 🚪 Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Log Out / লগআউট"
              className="px-4 py-3 sm:py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-rose-600 disabled:opacity-50 active:scale-95 cursor-pointer min-h-[44px]"
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
              <span>🚪 {isLoggingOut ? (language === 'bn' ? 'লগআউট হচ্ছে...' : 'Logging out...') : (language === 'bn' ? 'লগআউট' : 'Logout')}</span>
            </button>

          </div>
        </div>

        {logoutError && (
          <div className="bg-rose-50 text-rose-900 border border-rose-300 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 relative z-10 animate-fade-in">
            <span>⚠️ {logoutError}</span>
            <button
              type="button"
              onClick={() => setLogoutError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold text-sm px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* USER INFORMATION BAR (Displayed for ALL Authenticated Users)     */}
        {/* ----------------------------------------------------------------- */}
        <div className="bg-[#F4FBF5] p-4 rounded-2xl border border-[#C8E6C9] relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Avatar, Full Name, Mobile Number, Member ID */}
          <div className="flex items-center gap-3.5">
            
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title="View Profile Details"
            >
              <img
                src={
                  currentUser.profilePhotoUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                }
                alt={currentUser.fullName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-[#157347] shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isAccountActive ? 'bg-[#198754]' : 'bg-neutral-400'
              }`} />
            </button>

            <div className="space-y-1">
              {/* 👤 Full Name */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-black text-emerald-950 flex items-center gap-1">
                  👤 {currentUser.fullName}
                </span>
                <BadgeCheck className="w-4 h-4 text-[#198754] shrink-0" />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* 🆔 Unique ID */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-[#157347] font-mono text-xs font-black border border-[#A5D6A7] shadow-xs">
                  <Hash className="w-3.5 h-3.5 text-[#198754]" />
                  <span>Unique ID: {currentUser.aponUniqueId || permanentMemberId}</span>
                </span>

                {/* 📱 Mobile Number */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-neutral-700 text-xs font-bold border border-[#C8E6C9]">
                  <Phone className="w-3.5 h-3.5 text-[#157347]" />
                  <span>📱 {currentUser.mobileNumber}</span>
                </span>
              </div>
            </div>

          </div>

          {/* Badges: Current Role, Business Type, Account Status, Network Status */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 👥 Current Role */}
            <div className="px-3 py-1.5 rounded-xl bg-white border border-[#A5D6A7] text-[#157347] text-xs font-black flex items-center gap-1.5 shadow-xs">
              <Users className="w-3.5 h-3.5 text-[#198754]" />
              <span>Role: {UniqueIdService.getRoleTitle(currentUser.primaryRole).en}</span>
            </div>

            {/* 🏢 Business Type where applicable */}
            {currentUser.businessType && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 shadow-xs">
                <span>Business Type: {currentUser.businessType}</span>
              </div>
            )}

            {/* 🟢 Account Status */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-xs ${
              isAccountActive
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : 'bg-rose-100 border-rose-300 text-rose-900'
            }`}>
              {isAccountActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
                  <span>🟢 {language === 'bn' ? 'অ্যাকাউন্ট সক্রিয়' : 'Account Active'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>🔴 {language === 'bn' ? 'অ্যাকাউন্ট অসক্রিয়' : 'Account Inactive'}</span>
                </>
              )}
            </div>

            {/* 🌐 Network Status */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-xs ${
              isNetworkActive
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'bg-neutral-100 border-neutral-300 text-neutral-600'
            }`}>
              <Globe className={`w-3.5 h-3.5 ${isNetworkActive ? 'text-teal-600 animate-pulse' : 'text-neutral-400'}`} />
              <span>
                🌐 {isNetworkActive
                  ? (language === 'bn' ? 'নেটওয়ার্ক সক্রিয় মেম্বার' : 'Active Member')
                  : (language === 'bn' ? 'নেটওয়ার্ক অসক্রিয়' : 'Inactive Member')}
              </span>
            </div>

            {/* ⚡ Pilot Mode Badge */}
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-xs ${
              isPilotMode
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <Sparkles className={`w-3.5 h-3.5 ${isPilotMode ? 'text-amber-600 animate-spin' : 'text-[#198754]'}`} />
              <span>
                {isPilotMode
                  ? `⚡ PILOT MODE: ${pilotArea.upazilaBn}`
                  : (language === 'bn' ? '🇧🇩 সমগ্র বাংলাদেশ' : '🇧🇩 Nationwide')}
              </span>
            </div>

          </div>

        </div>

        {/* ----------------------------------------------------------------- */}
        {/* NETWORK ACTIVE MEMBER PANEL (Displayed when user is Network Active) */}
        {/* ----------------------------------------------------------------- */}
        {isNetworkActive && (
          <div className="bg-[#F4FBF5] p-4 rounded-2xl border border-[#C8E6C9] space-y-3 relative z-10">
            
            <div className="flex items-center justify-between border-b border-[#C8E6C9] pb-2.5">
              <div className="flex items-center gap-2 text-[#157347] text-xs font-black">
                <Sparkles className="w-4 h-4 text-[#198754]" />
                <span>
                  {language === 'bn'
                    ? 'নেটওয়ার্ক অ্যাক্টিভ মেম্বার ড্যাশবোর্ড ফিল্ডস'
                    : 'Network Active Member Dashboard Metrics'}
                </span>
              </div>
              <span className="text-[10px] bg-[#E8F5E9] text-[#157347] font-mono px-2 py-0.5 rounded-full border border-[#A5D6A7] font-bold">
                Member ID: {permanentMemberId}
              </span>
            </div>

            {/* Grid of Network Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* 🔗 Referral Code */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-600 font-semibold block">
                    🔗 Referral Code
                  </span>
                  <span className="font-mono font-black text-emerald-950 text-xs">
                    {referralCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#157347] rounded-lg border border-[#A5D6A7] transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#198754]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 🔗 Referral Link */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9] flex items-center justify-between lg:col-span-1">
                <div className="truncate pr-2 max-w-[150px] sm:max-w-[180px]">
                  <span className="text-[10px] text-neutral-600 font-semibold block truncate">
                    🔗 Referral Link
                  </span>
                  <span className="font-mono text-[10px] text-neutral-800 truncate block">
                    {referralLink}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#157347] rounded-lg border border-[#A5D6A7] transition-all text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-[#198754]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 👥 Sponsor ID */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9]">
                <span className="text-[10px] text-neutral-600 font-semibold block">
                  👥 Sponsor ID
                </span>
                <span className="font-mono font-black text-emerald-900 text-xs">
                  {currentMember?.sponsorId || currentUser.sponsorId || 'GBD000000'}
                </span>
              </div>

              {/* 👥 Placement ID */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9]">
                <span className="text-[10px] text-neutral-600 font-semibold block">
                  👥 Placement ID
                </span>
                <span className="font-mono font-black text-emerald-900 text-xs">
                  {currentMember?.parentId || 'GBD000000'}
                </span>
              </div>

              {/* 👥 Left Leg Count */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-600 font-semibold block">
                    👥 Left Leg Count
                  </span>
                  <span className="font-black text-[#157347] text-xs">
                    {formatPV(currentMember?.leftPV)} PV ({currentMember?.leftChildId ? '1+ Active' : '0 Members'})
                  </span>
                </div>
              </div>

              {/* 👥 Right Leg Count */}
              <div className="p-2.5 rounded-xl bg-white border border-[#C8E6C9] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-600 font-semibold block">
                    👥 Right Leg Count
                  </span>
                  <span className="font-black text-[#157347] text-xs">
                    {formatPV(currentMember?.rightPV)} PV ({currentMember?.rightChildId ? '1+ Active' : '0 Members'})
                  </span>
                </div>
              </div>

              {/* ⭐ Current Rank */}
              <div className="p-2.5 rounded-xl bg-white border border-amber-300 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 font-semibold block flex items-center gap-1">
                    ⭐ Current Rank
                  </span>
                  <span className="font-black text-amber-900 text-xs truncate block">
                    {rankTitle}
                  </span>
                </div>
                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              </div>

              {/* 💰 Commission Wallet Balance */}
              <div className="p-2.5 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 font-semibold block">
                    💰 Commission Wallet Balance
                  </span>
                  <span className="font-black text-[#157347] text-sm">
                    ৳ {(wallets?.commissionWallet || 0).toLocaleString()}
                  </span>
                </div>
                <Wallet className="w-5 h-5 text-[#157347] shrink-0" />
              </div>

            </div>

          </div>
        )}

      </motion.div>

      {/* ----------------------------------------------------------------- */}
      {/* SETTINGS MODAL                                                   */}
      {/* ----------------------------------------------------------------- */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* ----------------------------------------------------------------- */}
      {/* USER PROFILE MODAL                                               */}
      {/* ----------------------------------------------------------------- */}
      <NetworkMemberProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};
