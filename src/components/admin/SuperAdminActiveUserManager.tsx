/**
 * Super Admin Active User Management & Strict Visibility Control Panel
 * Project: Apon Bazar
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, ActiveUserFilterParams } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { canAccessActiveUserList } from '../../lib/rbac';
import { AccessDenied403 } from '../common/AccessDenied403';
import { UserProfile, UserRole, AccountStatus, KycStatus } from '../../types';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  UserCheck,
  ShieldCheck,
  Users,
  Eye,
  Edit3,
  Lock,
  Building2,
  Phone,
  Mail,
  MapPin,
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Sparkles,
  Download,
  X,
  UserPlus,
  LogIn,
  Save,
  CheckSquare,
  Edit,
  ArrowLeft,
  Store,
  Truck,
  Loader2
} from 'lucide-react';

export const SuperAdminActiveUserManager: React.FC = () => {
  const {
    currentUser,
    getActiveUsersForSuperAdmin,
    allUsers,
    updateUserStatusByAdmin,
    updateUserByAdmin,
    enterUserDashboard,
    addAuditLog
  } = useAuth();
  const { language } = useLanguage();

  // Strict RBAC Verification: Is requesting user Super Admin?
  const isSuperAdmin = canAccessActiveUserList(currentUser);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'balance'>('newest');

  // Selected User Modal & Edit State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editMobileNumber, setEditMobileNumber] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editDivision, setEditDivision] = useState<string>('ঢাকা');
  const [editDistrict, setEditDistrict] = useState<string>('ঢাকা');
  const [editUpazila, setEditUpazila] = useState<string>('ধানমন্ডি');
  const [editArea, setEditArea] = useState<string>('');
  const [editFullAddress, setEditFullAddress] = useState<string>('');
  const [editAccountStatus, setEditAccountStatus] = useState<AccountStatus>('active');
  const [editSuccessMsg, setEditSuccessMsg] = useState<string>('');
  const [editErrorMsg, setEditErrorMsg] = useState<string>('');
  const [statusChangeMessage, setStatusChangeMessage] = useState<string>('');
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<{ user: UserProfile; newStatus: AccountStatus } | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Role Counts for Section 3 Summary Cards
  const roleCounts = useMemo(() => {
    return {
      admin: allUsers.filter((u) => u?.roles?.includes('admin') || u?.roles?.includes('super_admin')).length,
      customer: allUsers.filter((u) => u?.primaryRole === 'customer' || u?.roles?.includes('customer')).length,
      network_member: allUsers.filter((u) => u?.roles?.includes('network_member') || u?.isNetworkActive).length,
      dealer: allUsers.filter((u) => u?.roles?.includes('dealer') || u?.roles?.includes('vendor')).length,
      operations_partner: allUsers.filter((u) => u?.roles?.includes('operations_partner')).length
    };
  }, [allUsers]);

  // Log search action for audit compliance when filters change
  useEffect(() => {
    if (isSuperAdmin && (searchTerm || startDate || endDate || roleFilter !== 'all')) {
      const logDetails = `Super Admin searched Active Users. Query: '${searchTerm}', Role: '${roleFilter}', Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`;
      addAuditLog('SUPER_ADMIN_ACTIVE_USERS_SEARCH', 'ActiveUsersDirectory', logDetails);
    }
  }, [searchTerm, startDate, endDate, roleFilter, isSuperAdmin]);

  // Construct Filter Params
  const filterParams: ActiveUserFilterParams = useMemo(
    () => ({
      search: searchTerm,
      role: roleFilter,
      status: statusFilter as AccountStatus | 'all',
      kycStatus: kycFilter as KycStatus | 'all',
      startDate,
      endDate,
      division: divisionFilter,
      sortBy
    }),
    [searchTerm, roleFilter, statusFilter, kycFilter, startDate, endDate, divisionFilter, sortBy]
  );

  // Execute Guarded Fetch
  const queryResult = useMemo(() => {
    return getActiveUsersForSuperAdmin(filterParams);
  }, [getActiveUsersForSuperAdmin, filterParams]);

  // Handle Preset Date Range Shortcuts
  const handleSetPresetDate = (days: number | 'all' | 'this_month') => {
    if (days === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const today = new Date();
    const endDateStr = today.toISOString().slice(0, 10);

    if (days === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(endDateStr);
      return;
    }

    const start = new Date();
    start.setDate(today.getDate() - days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(endDateStr);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setKycFilter('all');
    setDivisionFilter('all');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
  };

  // Handle View User Details (Triggers Audit Log Entry & Populates Edit State)
  const handleViewUserDetail = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditingProfile(false);
    setEditFullName(user.fullName || '');
    setEditMobileNumber(user.mobileNumber || '');
    setEditEmail(user.email || '');
    setEditDivision(user.mandatoryAddress?.division || 'ঢাকা');
    setEditDistrict(user.mandatoryAddress?.district || 'ঢাকা');
    setEditUpazila(user.mandatoryAddress?.upazila || 'ধানমন্ডি');
    setEditArea(user.mandatoryAddress?.area || '');
    setEditFullAddress(user.mandatoryAddress?.fullServiceAddress || '');
    setEditAccountStatus(user.accountStatus || 'active');
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setShowDetailModal(true);

    addAuditLog(
      'SUPER_ADMIN_ACCESSED_SENSITIVE_USER_PROFILE',
      'ActiveUsersDirectory',
      `Super Admin inspected sensitive user profile: '${user.fullName}' (ID: ${user.id}, Permanent ID: ${user.permanentMemberId})`
    );
  };

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Cancel profile editing and discard draft
  const handleCancelProfileEdit = () => {
    if (selectedUser) {
      setEditFullName(selectedUser.fullName || '');
      setEditMobileNumber(selectedUser.mobileNumber || '');
      setEditEmail(selectedUser.email || '');
      setEditDivision(selectedUser.mandatoryAddress?.division || 'ঢাকা');
      setEditDistrict(selectedUser.mandatoryAddress?.district || 'ঢাকা');
      setEditUpazila(selectedUser.mandatoryAddress?.upazila || 'ধানমন্ডি');
      setEditArea(selectedUser.mandatoryAddress?.area || '');
      setEditFullAddress(selectedUser.mandatoryAddress?.fullServiceAddress || '');
      setEditAccountStatus(selectedUser.accountStatus || 'active');
    }
    setIsEditingProfile(false);
    setEditSuccessMsg('');
    setEditErrorMsg('');
  };

  // Save profile modifications as Super Admin
  const handleSaveUserProfile = async () => {
    if (!selectedUser) return;
    setIsSavingProfile(true);
    setEditSuccessMsg('');
    setEditErrorMsg('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const res = updateUserByAdmin(
        selectedUser.id,
        {
          fullName: editFullName,
          mobileNumber: editMobileNumber,
          email: editEmail,
          accountStatus: editAccountStatus
        },
        {
          division: editDivision,
          district: editDistrict,
          upazila: editUpazila,
          area: editArea,
          fullServiceAddress: editFullAddress
        }
      );

      if (res.success) {
        setEditSuccessMsg(res.message || 'ইউজার প্রোফাইল ডাটাবেজে সফলভাবে আপডেট করা হয়েছে!');
        setSelectedUser((prev) =>
          prev
            ? {
                ...prev,
                fullName: editFullName,
                mobileNumber: editMobileNumber,
                email: editEmail,
                accountStatus: editAccountStatus,
                mandatoryAddress: {
                  ...prev.mandatoryAddress,
                  division: editDivision,
                  district: editDistrict,
                  upazila: editUpazila,
                  area: editArea,
                  fullServiceAddress: editFullAddress
                }
              }
            : null
        );
      } else {
        setEditErrorMsg(res.message || 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে!');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Exit profile editing and return to Super Admin Directory
  const handleCompleteEdit = () => {
    setIsEditingProfile(false);
    setEditSuccessMsg('');
    setEditErrorMsg('');
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  // Super Admin: Enter User Dashboard / Login as User
  const handleEnterDashboard = (userId: string) => {
    const res = enterUserDashboard(userId);
    if (res.success) {
      setShowDetailModal(false);
      setSelectedUser(null);
    } else {
      setEditErrorMsg(res.message);
    }
  };

  // Handle Status Change Confirmation Trigger by Super Admin
  const handleInitiateStatusToggle = (user: UserProfile, newStatus: AccountStatus) => {
    setStatusConfirmTarget({ user, newStatus });
    setStatusReason('');
  };

  // Explicit Save & Execute Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusConfirmTarget) return;
    setIsUpdatingStatus(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const res = updateUserStatusByAdmin(
        statusConfirmTarget.user.id,
        statusConfirmTarget.newStatus,
        statusReason || 'Status changed via Super Admin Active Users Panel'
      );
      setStatusChangeMessage(res.message);

      // Refresh selectedUser if open in modal
      if (selectedUser && selectedUser.id === statusConfirmTarget.user.id) {
        setSelectedUser({ ...selectedUser, accountStatus: statusConfirmTarget.newStatus });
      }

      setStatusConfirmTarget(null);
      setStatusReason('');
      setTimeout(() => setStatusChangeMessage(''), 4000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Render Access Denied 403 screen if user is NOT Super Admin
  if (!isSuperAdmin) {
    return <AccessDenied403 attemptedRole="super_admin" />;
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Security Control Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-white space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {language === 'bn'
                    ? 'অ্যাক্টিভ ইউজার ডিরেক্টরি ও দৃশ্যমানতা নিয়ন্ত্রণ (Super Admin Only)'
                    : 'Active Users Directory & Strict Visibility Control'}
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  RBAC Level 0 Enforced
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1">
                {language === 'bn'
                  ? 'সকল অ্যাক্টিভ ইউজার দেখা, সার্চ করা ও ফিল্টারিং এর সর্বাধিনায়ক প্যানেল। নরমাল এডমিন, ডিলার, পার্টনার ও কাস্টমারদের জন্য এক্সেস কঠোরভাবে নিষিদ্ধ।'
                  : 'Master Active User directory with strict RBAC protection. Complete user lists are restricted from normal admins, partners, and customers.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-4 py-2 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-xs text-slate-300 font-mono">
              <span className="text-neutral-400 block text-[10px]">মোট ইউজার অ্যাকাউন্টস</span>
              <span className="text-base font-black text-white">{allUsers.length} জন</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: ROLE SUMMARY CARDS (Clickable filter triggers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Admin Card */}
        <button
          type="button"
          onClick={() => setRoleFilter('admin')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-md flex flex-col justify-between ${
            roleFilter === 'admin'
              ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-indigo-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${roleFilter === 'admin' ? 'text-indigo-200' : 'text-neutral-500'}`}>
              Total Admin
            </span>
            <ShieldCheck className={`w-4 h-4 ${roleFilter === 'admin' ? 'text-white' : 'text-indigo-500'}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono">{roleCounts.admin}</span>
            <span className={`text-[10px] block font-bold ${roleFilter === 'admin' ? 'text-indigo-200' : 'text-neutral-400'}`}>
              এডমিন তালিকা দেখতে ক্লিক করুন
            </span>
          </div>
        </button>

        {/* Total Customer Card */}
        <button
          type="button"
          onClick={() => setRoleFilter('customer')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-md flex flex-col justify-between ${
            roleFilter === 'customer'
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${roleFilter === 'customer' ? 'text-emerald-200' : 'text-neutral-500'}`}>
              Total Customer
            </span>
            <Users className={`w-4 h-4 ${roleFilter === 'customer' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono">{roleCounts.customer}</span>
            <span className={`text-[10px] block font-bold ${roleFilter === 'customer' ? 'text-emerald-200' : 'text-neutral-400'}`}>
              কাস্টমার তালিকা দেখতে ক্লিক করুন
            </span>
          </div>
        </button>

        {/* Total Network Active Member Card */}
        <button
          type="button"
          onClick={() => setRoleFilter('network_member')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-md flex flex-col justify-between ${
            roleFilter === 'network_member'
              ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${roleFilter === 'network_member' ? 'text-amber-200' : 'text-neutral-500'}`}>
              Network Active
            </span>
            <UserCheck className={`w-4 h-4 ${roleFilter === 'network_member' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono">{roleCounts.network_member}</span>
            <span className={`text-[10px] block font-bold ${roleFilter === 'network_member' ? 'text-amber-200' : 'text-neutral-400'}`}>
              মেম্বার তালিকা দেখতে ক্লিক করুন
            </span>
          </div>
        </button>

        {/* Total Dealer Card */}
        <button
          type="button"
          onClick={() => setRoleFilter('dealer')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-md flex flex-col justify-between ${
            roleFilter === 'dealer'
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${roleFilter === 'dealer' ? 'text-blue-200' : 'text-neutral-500'}`}>
              Total Dealer
            </span>
            <Store className={`w-4 h-4 ${roleFilter === 'dealer' ? 'text-white' : 'text-blue-500'}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono">{roleCounts.dealer}</span>
            <span className={`text-[10px] block font-bold ${roleFilter === 'dealer' ? 'text-blue-200' : 'text-neutral-400'}`}>
              ডিলার তালিকা দেখতে ক্লিক করুন
            </span>
          </div>
        </button>

        {/* Total Operation Partner Card */}
        <button
          type="button"
          onClick={() => setRoleFilter('operations_partner')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-md flex flex-col justify-between ${
            roleFilter === 'operations_partner'
              ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${roleFilter === 'operations_partner' ? 'text-purple-200' : 'text-neutral-500'}`}>
              Op Partner
            </span>
            <Truck className={`w-4 h-4 ${roleFilter === 'operations_partner' ? 'text-white' : 'text-purple-500'}`} />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black font-mono">{roleCounts.operations_partner}</span>
            <span className={`text-[10px] block font-bold ${roleFilter === 'operations_partner' ? 'text-purple-200' : 'text-neutral-400'}`}>
              পার্টনার দেখতে ক্লিক করুন
            </span>
          </div>
        </button>
      </div>

      {/* Status Action Message Toast */}
      {statusChangeMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fade-in shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{statusChangeMessage}</span>
        </div>
      )}

      {/* Robust Search & Filtering Component */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>
              {language === 'bn'
                ? 'এডভান্সড সার্চ, নিবন্ধন তারিখ ও রোল ফিল্টারিং হাব'
                : 'Advanced Search & Date Range Filters'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>{language === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filters'}</span>
          </button>
        </div>

        {/* Search Bar & Primary Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Text Search Input */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {language === 'bn' ? 'সার্চ (আইডি, নাম, মোবাইল, ইমেইল, ঠিকানা)' : 'Search Query'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  language === 'bn'
                    ? 'TMK000001 / নাম / মোবাইল / ইমেইল / ঠিকানা দিয়ে খোঁজুন...'
                    : 'Search by ID, Name, Mobile, Email...'
                }
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Registration Start Date */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'bn' ? 'নিবন্ধন শুরু তারিখ' : 'Reg Start Date'}</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
            />
          </div>

          {/* Registration End Date */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'bn' ? 'নিবন্ধন শেষ তারিখ' : 'Reg End Date'}</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Date Range Preset Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-neutral-500 text-[11px]">
            {language === 'bn' ? 'তারিখ ফিল্টার শর্টকাট:' : 'Date Presets:'}
          </span>
          <button
            type="button"
            onClick={() => handleSetPresetDate(0)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              startDate === new Date().toISOString().slice(0, 10)
                ? 'bg-indigo-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            {language === 'bn' ? 'আজকে' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate(7)}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {language === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate('this_month')}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {language === 'bn' ? 'এই মাস' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate('all')}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {language === 'bn' ? 'সব তারিখ' : 'All Time'}
          </button>
        </div>

        {/* Secondary Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          {/* User Role Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {language === 'bn' ? 'ইউজার রোল / পদবী' : 'User Role Status'}
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল রোল (All Roles)</option>
              <option value="super_admin">সুপার এডমিন (Super Admin)</option>
              <option value="admin">সিস্টেম এডমিন (Admin)</option>
              <option value="dealer">ডিলার (Dealer)</option>
              <option value="vendor">ভেন্ডর / মার্চেন্ট (Vendor)</option>
              <option value="operations_partner">অপারেশনস পার্টনার (Partner)</option>
              <option value="delivery_rider">ডেলিভারি ম্যান (Rider)</option>
              <option value="network_member">নেটওয়ার্ক মেম্বার (Network Member)</option>
              <option value="customer">কাস্টমার (Customer)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল স্ট্যাটাস (All)</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="pending">পেন্ডিং (Pending)</option>
              <option value="suspended">সাসপেন্ডেড (Suspended)</option>
              <option value="banned">ব্যান্ড (Banned)</option>
            </select>
          </div>

          {/* Division Location Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {language === 'bn' ? 'বিভাগ (Division)' : 'Division Filter'}
            </label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল বিভাগ (All Divisions)</option>
              <option value="রংপুর">রংপুর বিভাগ</option>
              <option value="ঢাকা">ঢাকা বিভাগ</option>
              <option value="চট্টগ্রাম">চট্টগ্রাম বিভাগ</option>
              <option value="রাজশাহী">রাজশাহী বিভাগ</option>
              <option value="খুলনা">খুলনা বিভাগ</option>
              <option value="বরিশাল">বরিশাল বিভাগ</option>
              <option value="সিলেট">সিলেট বিভাগ</option>
              <option value="ময়মনসিংহ">ময়মনসিংহ বিভাগ</option>
            </select>
          </div>

          {/* Sort Order Dropdown */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {language === 'bn' ? 'সাজানো (Sorting)' : 'Sort By'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="newest">সর্বশেষ নিবন্ধিত (Newest)</option>
              <option value="oldest">পুরাতন নিবন্ধিত (Oldest)</option>
              <option value="name">নামানুসারে (Name A-Z)</option>
              <option value="balance">টোকেন ব্যালেন্স (Highest Balance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Users Results List Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Results Metadata Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-neutral-900 dark:text-white text-base">
              {language === 'bn' ? 'অ্যাক্টিভ ইউজার তালিকা' : 'Active Users Records'}
            </h3>
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-mono font-black">
              {queryResult.totalCount} জন প্রদর্শিত
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {language === 'bn'
              ? `মোট ডাটাবেজ ইউজার: ${allUsers.length} জন | সুপার এডমিন অডিট নিরাপত্তা নিশ্চিতকৃত`
              : `Total Users: ${allUsers.length} | Audit Verified`}
          </div>
        </div>

        {/* Results Table */}
        {queryResult.users.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
            <Users className="w-10 h-10 text-neutral-400 mx-auto" />
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {language === 'bn'
                ? 'প্রদত্ত ফিল্টার অনুযায়ী কোনো অ্যাক্টিভ ইউজার রেকর্ড খুঁজে পাওয়া যায়নি।'
                : 'No active users match your selected filters.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700"
            >
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-black uppercase text-[11px] border-b border-neutral-200 dark:border-neutral-700">
                  <th className="p-3.5 rounded-l-xl">ইউজার আইডি ও নাম</th>
                  <th className="p-3.5">যোগাযোগ তথ্য</th>
                  <th className="p-3.5">নিবন্ধন তারিখ</th>
                  <th className="p-3.5">রোল ও একাউন্ট স্ট্যাটাস</th>
                  <th className="p-3.5">সার্ভিস এলাকা / অবস্থান</th>
                  <th className="p-3.5 text-right">টোকেন ব্যালেন্স</th>
                  <th className="p-3.5 text-center rounded-r-xl">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {queryResult.users.map((user) => {
                  const regDateFormatted = user?.createdAt
                    ? (() => {
                        try {
                          return new Date(user.createdAt).toLocaleDateString(
                            language === 'bn' ? 'bn-BD' : 'en-US',
                            { year: 'numeric', month: 'short', day: '2-digit' }
                          );
                        } catch {
                          return user.createdAt.slice(0, 10);
                        }
                      })()
                    : 'N/A';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      {/* User Name & Permanent ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.profilePhotoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'
                            }
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-white block text-sm">
                              {user.fullName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] bg-slate-900 text-indigo-300 px-2 py-0.2 rounded-full font-bold">
                                {user.permanentMemberId || user.id}
                              </span>
                              {user.primaryRole === 'super_admin' && (
                                <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <p className="font-mono font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            <span>{user.mobileNumber}</span>
                          </p>
                          {user.email && (
                            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-sky-500" />
                              <span className="truncate max-w-[150px]">{user.email}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{regDateFormatted}</span>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="p-3.5 space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 block w-fit capitalize">
                          {(user?.primaryRole || 'customer').replace('_', ' ')}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                            user.accountStatus === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : user.accountStatus === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {user.accountStatus === 'active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{(user?.accountStatus || 'active').toUpperCase()}</span>
                        </span>
                      </td>

                      {/* Location */}
                      <td className="p-3.5">
                        <div className="text-[11px] text-neutral-700 dark:text-neutral-300 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>
                              {user.mandatoryAddress?.district || 'ঢাকা'}, {user.mandatoryAddress?.division || 'ঢাকা'}
                            </span>
                          </p>
                          <p className="text-neutral-500 text-[10px]">
                            {user.mandatoryAddress?.upazila || 'নভ্যা এলাকা'}
                          </p>
                        </div>
                      </td>

                      {/* Token Balance */}
                      <td className="p-3.5 text-right">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center justify-end gap-1">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{(user?.tomokTokenBalance ?? 0).toLocaleString()}</span>
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">TOMOK</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleViewUserDetail(user)}
                            className="p-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                            title="সম্পূর্ণ প্রোফাইল দেখুন (Super Admin Audit Logged)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user.primaryRole !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() =>
                                handleInitiateStatusToggle(
                                  user,
                                  user.accountStatus === 'active' ? 'suspended' : 'active'
                                )
                              }
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                user.accountStatus === 'active'
                                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 hover:bg-rose-100'
                                  : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100'
                              }`}
                              title={
                                user.accountStatus === 'active' ? 'সাসপেন্ড করার জন্য পর্যালোচনা করুন' : 'সক্রিয় করার জন্য পর্যালোচনা করুন'
                              }
                            >
                              {user.accountStatus === 'active' ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sensitive User Profile Inspection Modal (Audit Logged) */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto my-auto relative">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'ইউজার প্রোফাইল বিশদ (Super Admin View)' : 'User Detailed Profile'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Header & Super Admin Action Toolbar */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedUser.profilePhotoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={selectedUser.fullName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400 shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-lg">{selectedUser.fullName}</h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                        {selectedUser.accountStatus}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-200 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>স্থায়ী রেজিস্ট্রেশন আইডি: <strong>{selectedUser.permanentMemberId || selectedUser.id}</strong></span>
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      মূল রোল: <span className="font-bold text-amber-400">{(selectedUser?.primaryRole || 'customer').toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEnterDashboard(selectedUser.id)}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="এই ইউজারের ড্যাশবোর্ডে প্রবেশ করুন"
                  >
                    <LogIn className="w-4 h-4 text-slate-950" />
                    <span>ইউজার ড্যাশবোর্ডে প্রবেশ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{isEditingProfile ? 'ভিউ মোড' : 'এডিট মোড'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Success & Error Messages */}
            {editSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{editSuccessMsg}</span>
              </div>
            )}

            {editErrorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-800 dark:text-rose-300 font-bold text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            {/* EDIT PROFILE FORM (Super Admin Control) */}
            {isEditingProfile ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    সিকিউরিটি পলিসি: রেজিস্ট্রেশন আইডি (Registration ID) স্থায়ীভাবে লক করা রয়েছে। যেকোনো আইডি সংশোধন সম্পূর্ণ নিষিদ্ধ।
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Registration ID (LOCKED & READ ONLY) */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span>রেজিস্ট্রেশন আইডি / স্থায়ী মেম্বারশিপ আইডি</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> আইডি লক করা (LOCKED)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={selectedUser.permanentMemberId || selectedUser.id}
                      disabled
                      readOnly
                      className="w-full bg-neutral-200 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono font-bold rounded-xl p-2.5 cursor-not-allowed"
                    />
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">পূর্ণ নাম</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">মোবাইল নম্বর</label>
                    <input
                      type="text"
                      value={editMobileNumber}
                      onChange={(e) => setEditMobileNumber(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold font-mono rounded-xl p-2.5"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">ইমেইল ঠিকানা</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* Account Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">অ্যাকাউন্ট স্ট্যাটাস</label>
                    <select
                      value={editAccountStatus}
                      onChange={(e) => setEditAccountStatus(e.target.value as AccountStatus)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    >
                      <option value="active">ACTIVE (সক্রিয়)</option>
                      <option value="suspended">SUSPENDED (সাসপেন্ডেড)</option>
                      <option value="pending">PENDING (অপেক্ষমান)</option>
                    </select>
                  </div>

                  {/* Division */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">বিভাগ</label>
                    <input
                      type="text"
                      value={editDivision}
                      onChange={(e) => setEditDivision(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* District */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">জেলা</label>
                    <input
                      type="text"
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* Upazila */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">উপজেলা / থানা</label>
                    <input
                      type="text"
                      value={editUpazila}
                      onChange={(e) => setEditUpazila(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* Area */}
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">এলাকা / ইউনিয়ন</label>
                    <input
                      type="text"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>

                  {/* Full Service Address */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">সম্পূর্ণ সেবা ঠিকানা</label>
                    <textarea
                      rows={2}
                      value={editFullAddress}
                      onChange={(e) => setEditFullAddress(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                    />
                  </div>
                </div>

                {/* Save, Cancel & Complete Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    id="btn-cancel-user-profile-edit"
                    disabled={isSavingProfile}
                    onClick={handleCancelProfileEdit}
                    className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>পরিবর্তন বাতিল (Cancel / Discard)</span>
                  </button>

                  <button
                    type="button"
                    id="btn-save-user-profile"
                    disabled={isSavingProfile}
                    onClick={handleSaveUserProfile}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>আপডেট হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>পরিবর্তন সংরক্ষণ ও আপডেট করুন (Save Changes / Update)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn-complete-user-edit"
                    disabled={isSavingProfile}
                    onClick={handleCompleteEdit}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>সম্পন্ন করুন (Complete & Return)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW PROFILE MODE */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block">মোবাইল নম্বর</span>
                    <p className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                      {selectedUser.mobileNumber}
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block">ইমেইল ঠিকানা</span>
                    <p className="font-bold text-neutral-900 dark:text-white truncate">
                      {selectedUser.email || 'N/A'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block">জাতীয় পরিচয়পত্র (NID)</span>
                    <p className="font-mono font-bold text-neutral-900 dark:text-white">
                      {selectedUser.nationalId || 'যাচাই হয়নি'}
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block">TOMOK টোকেন ব্যালেন্স</span>
                    <p className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {selectedUser.tomokTokenBalance?.toLocaleString() || 0} TOMOK
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase block">বাধ্যতামূলক সেবা ঠিকানা (Mandatory Address)</span>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {selectedUser.mandatoryAddress?.fullServiceAddress ||
                        `${selectedUser.mandatoryAddress?.area}, ${selectedUser.mandatoryAddress?.unionName}, ${selectedUser.mandatoryAddress?.upazila}, ${selectedUser.mandatoryAddress?.district}, ${selectedUser.mandatoryAddress?.division}`}
                    </p>
                  </div>
                </div>

                {/* Audit Trail Banner Notice */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-[11px] font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    এই প্রোফাইল পরিদর্শনের ঘটনাটি সুপার এডমিন সিকিউরিটি অডিট লগে লিপিবদ্ধ করা হয়েছে।
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit Super Admin Status Change Confirmation Modal */}
      {statusConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-neutral-900 dark:text-white">
                  অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusConfirmTarget(null)}
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">ইউজার:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{statusConfirmTarget.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">মোবাইল:</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{statusConfirmTarget.user.mobileNumber}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-neutral-500">বর্তমান অবস্থা:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  statusConfirmTarget.user.accountStatus === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {statusConfirmTarget.user.accountStatus.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">নতুন নির্ধারিত অবস্থা:</span>
                <span className={`px-2 py-0.5 rounded-full font-black text-xs ${
                  statusConfirmTarget.newStatus === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {statusConfirmTarget.newStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                স্ট্যাটাস পরিবর্তনের কারণ / অডিট নোট:
              </label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="যেমন: নিয়ম লঙ্ঘন, পলিসি আপডেট, ভেরিফিকেশন ইত্যাদি"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 leading-relaxed">
              সতর্কতা: স্ট্যাটাস পরিবর্তনটি ডাটাবেজে রেকর্ড করা হবে এবং ইউজারের সিস্টেমে প্রবেশাধিকার অবিলম্বে পরিবর্তিত হবে।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => setStatusConfirmTarget(null)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                id="btn-confirm-save-user-status"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatusChange}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>স্ট্যাটাস পরিবর্তন সংরক্ষণ ও কার্যকর করুন (Save & Update)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
