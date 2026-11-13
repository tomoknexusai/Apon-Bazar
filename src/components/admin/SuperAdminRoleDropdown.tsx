/**
 * Super Admin Role Dropdown UI Component
 * Project: Apon Bazar
 *
 * STRICT SECURITY & RBAC ENFORCEMENT:
 * - This component renders ONLY for authenticated Super Admins verified via RBAC.
 * - This component must exist ONLY in the Super Admin Dashboard header/top navigation.
 * - Selecting a role switches the administrative navigation view/dashboard for testing/management.
 * - It does NOT mutate database user records, alter permissions, or grant super admin privileges.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { isImmutableSuperAdmin, validateBackendRoleAccess } from '../../lib/rbac';
import {
  Crown,
  Shield,
  User,
  Network,
  Store,
  Handshake,
  Truck,
  ChevronDown,
  Check,
  Sparkles,
  Landmark,
  UserCheck
} from 'lucide-react';

interface RoleDropdownOption {
  role: UserRole;
  labelEn: string;
  labelBn: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
}

export const SuperAdminRoleDropdown: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentUser, activeRole, setActiveRole, isLoggedIn } = useAuth();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Strict RBAC Authentication Verification: Founder or Super Admin
  const isSuperAdminVerified = Boolean(
    isLoggedIn &&
    currentUser &&
    (
      isImmutableSuperAdmin(currentUser) ||
      currentUser.primaryRole === 'super_admin' ||
      currentUser.primaryRole === 'founder' ||
      currentUser.roles?.includes('super_admin') ||
      currentUser.roles?.includes('founder')
    )
  );

  // If not authenticated Super Admin / Founder, strictly reject rendering
  if (!isSuperAdminVerified || !currentUser) {
    return null;
  }

  // Complete Role Dropdown Options
  const roleOptions: RoleDropdownOption[] = [
    {
      role: 'founder',
      labelEn: 'Founder & MD',
      labelBn: 'ফাউন্ডার ও নির্বাহী ড্যাশবোর্ড',
      emoji: '🌟',
      icon: Sparkles,
      accentColor: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-400/50'
    },
    {
      role: 'super_admin',
      labelEn: 'Super Admin',
      labelBn: 'সুপার অ্যাডমিন',
      emoji: '👑',
      icon: Crown,
      accentColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      role: 'finance',
      labelEn: 'Finance & Accounts',
      labelBn: 'ফিন্যান্স ও অ্যাকাউন্টস',
      emoji: '💰',
      icon: Landmark,
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      role: 'admin',
      labelEn: 'District Admin',
      labelBn: 'জেলা অ্যাডমিন',
      emoji: '🛡️',
      icon: Shield,
      accentColor: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      role: 'hr',
      labelEn: 'HR Officer',
      labelBn: 'এইচআর অফিসার',
      emoji: '🧑‍💼',
      icon: UserCheck,
      accentColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      role: 'operations_partner',
      labelEn: 'Upazila Ops Officer',
      labelBn: 'উপজেলা অপারেশনাল অফিসার',
      emoji: '🤝',
      icon: Handshake,
      accentColor: 'text-orange-400',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    {
      role: 'delivery_rider',
      labelEn: 'Delivery Man',
      labelBn: 'ডেলিভারি ম্যান',
      emoji: '🚚',
      icon: Truck,
      accentColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      role: 'network_member',
      labelEn: 'Network Active Member',
      labelBn: 'নেটওয়ার্ক অ্যাক্টিভ মেম্বার',
      emoji: '🌐',
      icon: Network,
      accentColor: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      role: 'dealer',
      labelEn: 'Dealer & Outlet',
      labelBn: 'ডিলার ও পয়েন্ট',
      emoji: '🏪',
      icon: Store,
      accentColor: 'text-teal-400',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      role: 'customer',
      labelEn: 'Customer / Storefront',
      labelBn: 'গ্রাহক ও অনলাইন শপ',
      emoji: '👤',
      icon: User,
      accentColor: 'text-blue-400',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  ];

  const handleSelectRole = (targetRole: UserRole) => {
    setIsOpen(false);

    // Validate RBAC operation before executing navigation
    const validation = validateBackendRoleAccess(currentUser, targetRole);
    if (!validation.authorized) {
      console.warn('Unauthorized role switch attempt prevented:', validation.message);
      return;
    }

    // Pure administrative navigation view switch
    setActiveRole(targetRole);
  };

  const currentOption = roleOptions.find((opt) => opt.role === activeRole) || roleOptions[0];
  const CurrentIcon = currentOption.icon;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Visual Placement Button: [ 👑 Super Admin ▼ ] */}
      <button
        id="super-admin-role-dropdown-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-neutral-800 border border-[#A5D6A7] hover:border-[#198754] shadow-xs font-bold text-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <span className="text-base leading-none select-none">{currentOption.emoji}</span>
        <CurrentIcon className={`w-4 h-4 shrink-0 text-[#157347]`} />
        <span className="font-extrabold tracking-tight text-neutral-900">
          {currentOption.labelEn}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#157347]' : ''
          }`}
        />
      </button>

      {/* Role Dropdown Menu */}
      {isOpen && (
        <div
          id="super-admin-role-dropdown-menu"
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#C8E6C9] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#E8F5E9]"
        >
          {/* Header */}
          <div className="px-3.5 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#157347]">
                Administrative Role Switcher
              </span>
              <span className="text-[10px] font-semibold text-neutral-500">
                Super Admin Only
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              {language === 'bn'
                ? 'টেস্টিং ও প্রশাসনের জন্য যেকোনো ড্যাশবোর্ডে প্রবেশ করুন'
                : 'Switch dashboard view for admin/testing purposes'}
            </p>
          </div>

          {/* List of 7 options */}
          <div className="py-1 max-h-80 overflow-y-auto">
            {roleOptions.map((opt) => {
              const isSelected = activeRole === opt.role;
              const OptIcon = opt.icon;

              return (
                <button
                  key={opt.role}
                  id={`super-admin-role-opt-${opt.role}`}
                  type="button"
                  onClick={() => handleSelectRole(opt.role)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#E8F5E9] text-[#157347] border-l-4 border-[#198754]'
                      : 'hover:bg-[#F4FBF5] text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0 select-none">
                      {opt.emoji}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#F4FBF5] flex items-center justify-center shrink-0 border border-[#C8E6C9]">
                      <OptIcon className="w-3.5 h-3.5 text-[#157347]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-neutral-900">
                          {opt.labelEn}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          ({opt.labelBn})
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#198754] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
