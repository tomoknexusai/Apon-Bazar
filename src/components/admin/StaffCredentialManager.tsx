/**
 * Super Admin Reusable Staff Credential Management Engine (Riders & Dealers)
 * Project: APON BAZAR (আপন বাজার)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ManagedStaffAccount, CredentialAuditLogRecord } from '../../types';
import {
  Truck,
  Store,
  Search,
  Plus,
  Edit3,
  KeyRound,
  Power,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Activity,
  X,
  UserCheck,
  Ban,
  Mail
} from 'lucide-react';

interface StaffCredentialManagerProps {
  roleGroup: 'rider' | 'dealer';
}

function evaluatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  label: string;
  colorClass: string;
  issues: string[];
} {
  const issues: string[] = [];
  if (password.length < 8) {
    issues.push('কমপক্ষে ৮ অক্ষরের হতে হবে');
  }
  if (!/[a-zA-Z]/.test(password)) {
    issues.push('কমপক্ষে ১টি ইংরেজি অক্ষর (A-Z / a-z) থাকতে হবে');
  }
  if (!/\d/.test(password)) {
    issues.push('কমপক্ষে ১টি সংখ্যা (0-9) থাকতে হবে');
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (issues.length > 0) {
    return {
      valid: false,
      score,
      label: 'দুর্বল (অগ্রহণযোগ্য)',
      colorClass: 'bg-rose-500 text-rose-700',
      issues
    };
  }
  if (score >= 4) {
    return {
      valid: true,
      score,
      label: 'শক্তিশালী পাসওয়ার্ড',
      colorClass: 'bg-emerald-600 text-emerald-700',
      issues: []
    };
  }
  return {
    valid: true,
    score,
    label: 'মাঝারি মানের পাসওয়ার্ড',
    colorClass: 'bg-amber-500 text-amber-700',
    issues: []
  };
}

export const StaffCredentialManager: React.FC<StaffCredentialManagerProps> = ({ roleGroup }) => {
  const { currentUser, activeRole, systemSettings, upsertStaffUserLocal } = useAuth();
  const isRider = roleGroup === 'rider';
  const apiBase = isRider ? '/api/super-admin/riders' : '/api/super-admin/dealers';

  const [accounts, setAccounts] = useState<ManagedStaffAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<CredentialAuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createMobile, setCreateMobile] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirmPassword, setCreateConfirmPassword] = useState('');
  const [createShowPass, setCreateShowPass] = useState(false);
  const [createForceChange, setCreateForceChange] = useState(true);
  const [createVehicleType, setCreateVehicleType] = useState('Motorcycle (125cc)');
  const [createVehicleReg, setCreateVehicleReg] = useState('');
  const [createDrivingLicense, setCreateDrivingLicense] = useState('');
  const [createShopName, setCreateShopName] = useState('');
  const [createTradeLicense, setCreateTradeLicense] = useState('');
  const [createZoneName, setCreateZoneName] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Credentials Modal State
  const [editTarget, setEditTarget] = useState<ManagedStaffAccount | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');
  const [editDrivingLicense, setEditDrivingLicense] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editTradeLicense, setEditTradeLicense] = useState('');
  const [editZoneName, setEditZoneName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetTarget, setResetTarget] = useState<ManagedStaffAccount | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetShowPass, setResetShowPass] = useState(false);
  const [resetForceChange, setResetForceChange] = useState(true);
  const [resetSendEmail, setResetSendEmail] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Status Toggle Modal State
  const [statusTarget, setStatusTarget] = useState<ManagedStaffAccount | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      'x-user-role': currentUser?.primaryRole || activeRole || '',
      'x-user-id': currentUser?.id || '',
      'x-user-name': encodeURIComponent(currentUser?.fullName || '')
    }),
    [currentUser?.primaryRole, currentUser?.id, currentUser?.fullName, activeRole]
  );

  const loadData = async () => {
    setLoading(true);
    setBannerError(null);
    try {
      const [accountsResp, logsResp] = await Promise.all([
        fetch(apiBase, { headers: authHeaders }),
        fetch('/api/super-admin/credential-audit-logs?limit=50', { headers: authHeaders })
      ]);

      if (!accountsResp.ok) {
        const errData = await accountsResp.json().catch(() => ({}));
        setBannerError(errData?.message || 'অ্যাকাউন্ট তালিকা লোড করতে সমস্যা হয়েছে।');
      } else {
        const data = await accountsResp.json();
        setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
      }

      if (logsResp.ok) {
        const logData = await logsResp.json();
        const logs = Array.isArray(logData?.logs) ? (logData.logs as CredentialAuditLogRecord[]) : [];
        const prefix = isRider ? 'RIDER_' : 'DEALER_';
        setAuditLogs(logs.filter((l) => l.actionType.startsWith(prefix) || l.actionType === 'STAFF_OWN_PASSWORD_CHANGED'));
      }
    } catch (err: any) {
      setBannerError(err?.message || 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleGroup, currentUser?.id, activeRole]);

  const filteredAccounts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return accounts.filter((acc) => {
      if (statusFilter !== 'all' && acc.accountStatus !== statusFilter) return false;
      if (!q) return true;
      return [
        acc.id,
        acc.username,
        acc.permanentMemberId,
        acc.fullName,
        acc.email,
        acc.mobileNumber,
        acc.vehicleType,
        acc.vehicleRegNumber,
        acc.shopName,
        acc.zoneName,
        acc.tradeLicenseNumber
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [accounts, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.accountStatus === 'active').length;
    const deactivated = total - active;
    const pendingChange = accounts.filter((a) => a.mustChangePassword).length;
    return { total, active, deactivated, pendingChange };
  }, [accounts]);

  const createStrength = evaluatePasswordStrength(createPassword);
  const resetStrength = evaluatePasswordStrength(resetNewPass);
  const isEmailConfigured = Boolean(systemSettings.emailProviderStatus?.configured);

  const openCreateModal = () => {
    setCreateFullName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreateMobile('');
    setCreatePassword('');
    setCreateConfirmPassword('');
    setCreateShowPass(false);
    setCreateForceChange(true);
    setCreateVehicleType('Motorcycle (125cc)');
    setCreateVehicleReg('');
    setCreateDrivingLicense('');
    setCreateShopName('');
    setCreateTradeLicense('');
    setCreateZoneName('');
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createFullName.trim() || !createUsername.trim() || !createEmail.trim() || !createMobile.trim()) {
      setCreateError('নাম, লগইন আইডি, ইমেইল ও মোবাইল নম্বর আবশ্যক।');
      return;
    }
    if (!createStrength.valid) {
      setCreateError(`পাসওয়ার্ড যথেষ্ট শক্তিশালী নয়: ${createStrength.issues.join(', ')}`);
      return;
    }
    if (createPassword !== createConfirmPassword) {
      setCreateError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    setCreateSubmitting(true);
    try {
      const resp = await fetch(apiBase, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          fullName: createFullName.trim(),
          username: createUsername.trim(),
          email: createEmail.trim(),
          mobileNumber: createMobile.trim(),
          password: createPassword,
          forceChangeOnNextLogin: createForceChange,
          vehicleType: isRider ? createVehicleType.trim() : undefined,
          vehicleRegNumber: isRider ? createVehicleReg.trim() : undefined,
          drivingLicenseNumber: isRider ? createDrivingLicense.trim() : undefined,
          shopName: !isRider ? createShopName.trim() : undefined,
          tradeLicenseNumber: !isRider ? createTradeLicense.trim() : undefined,
          zoneName: !isRider ? createZoneName.trim() : undefined
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setCreateError(data?.message || 'নতুন অ্যাকাউন্ট তৈরি করা যায়নি।');
        return;
      }

      if (data.account) {
        upsertStaffUserLocal(data.account);
      }
      setShowCreateModal(false);
      setBannerSuccess(data.message || 'নতুন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!');
      await loadData();
      setTimeout(() => setBannerSuccess(null), 5000);
    } catch (err: any) {
      setCreateError(err?.message || 'নেটওয়ার্ক ত্রুটি হয়েছে।');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (acc: ManagedStaffAccount) => {
    setEditTarget(acc);
    setEditUsername(acc.username);
    setEditEmail(acc.email);
    setEditFullName(acc.fullName);
    setEditMobile(acc.mobileNumber);
    setEditVehicleType(acc.vehicleType || '');
    setEditVehicleReg(acc.vehicleRegNumber || '');
    setEditDrivingLicense(acc.drivingLicenseNumber || '');
    setEditShopName(acc.shopName || '');
    setEditTradeLicense(acc.tradeLicenseNumber || '');
    setEditZoneName(acc.zoneName || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditError(null);

    if (!editUsername.trim()) {
      setEditError('লগইন আইডি (Login ID) খালি রাখা যাবে না।');
      return;
    }

    setEditSubmitting(true);
    try {
      const resp = await fetch(`${apiBase}/${encodeURIComponent(editTarget.id)}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          username: editUsername.trim(),
          email: editEmail.trim(),
          fullName: editFullName.trim(),
          mobileNumber: editMobile.trim(),
          vehicleType: isRider ? editVehicleType.trim() : undefined,
          vehicleRegNumber: isRider ? editVehicleReg.trim() : undefined,
          drivingLicenseNumber: isRider ? editDrivingLicense.trim() : undefined,
          shopName: !isRider ? editShopName.trim() : undefined,
          tradeLicenseNumber: !isRider ? editTradeLicense.trim() : undefined,
          zoneName: !isRider ? editZoneName.trim() : undefined
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setEditError(data?.message || 'ক্রেডেনশিয়াল আপডেট ব্যর্থ হয়েছে।');
        return;
      }

      if (data.account) {
        upsertStaffUserLocal(data.account);
      }
      setEditTarget(null);
      setBannerSuccess(data.message || 'লগইন আইডি ও ইমেইল সফলভাবে আপডেট হয়েছে!');
      await loadData();
      setTimeout(() => setBannerSuccess(null), 5000);
    } catch (err: any) {
      setEditError(err?.message || 'নেটওয়ার্ক ত্রুটি হয়েছে।');
    } finally {
      setEditSubmitting(false);
    }
  };

  const openResetPasswordModal = (acc: ManagedStaffAccount) => {
    setResetTarget(acc);
    setResetNewPass('');
    setResetConfirmPass('');
    setResetShowPass(false);
    setResetForceChange(true);
    setResetSendEmail(false);
    setResetConfirmStep(false);
    setResetError(null);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetError(null);

    if (!resetStrength.valid) {
      setResetError(`পাসওয়ার্ড নীতিমালা পূরণ হয়নি: ${resetStrength.issues.join(', ')}`);
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।');
      return;
    }

    if (!resetConfirmStep) {
      setResetConfirmStep(true);
      return;
    }

    setResetSubmitting(true);
    try {
      const resp = await fetch(`${apiBase}/${encodeURIComponent(resetTarget.id)}/reset-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          newPassword: resetNewPass,
          forceChangeOnNextLogin: resetForceChange,
          sendNotificationEmail: resetSendEmail
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setResetError(data?.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
        setResetConfirmStep(false);
        return;
      }

      if (data.account) {
        upsertStaffUserLocal(data.account);
      }

      const emailNote =
        resetSendEmail && data.emailNotificationMessage
          ? ` — ${data.emailNotificationMessage}`
          : '';
      setResetTarget(null);
      setResetNewPass('');
      setResetConfirmPass('');
      setBannerSuccess(`${data.message}${emailNote}`);
      await loadData();
      setTimeout(() => setBannerSuccess(null), 7000);
    } catch (err: any) {
      setResetError(err?.message || 'সার্ভার ত্রুটি হয়েছে।');
    } finally {
      setResetSubmitting(false);
    }
  };

  const openStatusModal = (acc: ManagedStaffAccount) => {
    setStatusTarget(acc);
    setStatusReason('');
    setStatusError(null);
  };

  const handleStatusToggleConfirm = async () => {
    if (!statusTarget) return;
    setStatusError(null);
    const nextStatus = statusTarget.accountStatus === 'active' ? 'suspended' : 'active';
    setStatusSubmitting(true);
    try {
      const resp = await fetch(`${apiBase}/${encodeURIComponent(statusTarget.id)}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          status: nextStatus,
          reason: statusReason.trim()
        })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.success) {
        setStatusError(data?.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।');
        return;
      }

      if (data.account) {
        upsertStaffUserLocal(data.account);
      }
      setStatusTarget(null);
      setBannerSuccess(data.message || 'অ্যাকাউন্ট স্ট্যাটাস আপডেট হয়েছে।');
      await loadData();
      setTimeout(() => setBannerSuccess(null), 5000);
    } catch (err: any) {
      setStatusError(err?.message || 'সার্ভার ত্রুটি হয়েছে।');
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-neutral-800">
      {/* Section Header */}
      <div className="bg-white border border-[#C8E6C9] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] flex items-center justify-center shrink-0">
              {isRider ? <Truck className="w-6 h-6 text-[#157347]" /> : <Store className="w-6 h-6 text-[#157347]" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#157347]">
                {isRider
                  ? 'ডেলিভারি রাইডার অ্যাকাউন্ট ও ক্রেডেনশিয়াল ম্যানেজমেন্ট (Delivery Rider Accounts)'
                  : 'ডিলার অ্যাকাউন্ট ও ক্রেডেনশিয়াল ম্যানেজমেন্ট (Dealer Accounts)'}
              </h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                {isRider
                  ? 'নতুন রাইডার তৈরি, লগইন আইডি ও ইমেইল পরিবর্তন, পাসওয়ার্ড রিসেট এবং অ্যাকাউন্ট সক্রিয়/নিষ্ক্রিয় নিয়ন্ত্রণ।'
                  : 'নতুন ডিলার তৈরি, লগইন আইডি ও ইমেইল পরিবর্তন, পাসওয়ার্ড রিসেট এবং অ্যাকাউন্ট সক্রিয়/নিষ্ক্রিয় নিয়ন্ত্রণ।'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 bg-[#F4FBF5] hover:bg-[#E8F5E9] text-[#157347] border border-[#C8E6C9] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
            <button
              type="button"
              id={isRider ? 'btn-create-new-rider-account' : 'btn-create-new-dealer-account'}
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#198754] hover:bg-[#157347] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRider ? 'নতুন রাইডার অ্যাকাউন্ট' : 'নতুন ডিলার অ্যাকাউন্ট'}</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-3">
            <span className="text-neutral-600 font-semibold block">মোট {isRider ? 'রাইডার' : 'ডিলার'}</span>
            <span className="text-xl font-black text-[#157347] mt-1 block">{stats.total}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <span className="text-emerald-800 font-semibold block">সক্রিয় (Active)</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{stats.active}</span>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <span className="text-rose-800 font-semibold block">নিষ্ক্রিয় (Deactivated)</span>
            <span className="text-xl font-black text-rose-700 mt-1 block">{stats.deactivated}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <span className="text-amber-800 font-semibold block">পাসওয়ার্ড পরিবর্তন বাকি</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">{stats.pendingChange}</span>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isRider
                  ? 'আইডি, লগইন আইডি, নাম, ইমেইল, মোবাইল বা গাড়ির নম্বর দিয়ে খুঁজুন...'
                  : 'আইডি, লগইন আইডি, নাম, ইমেইল, মোবাইল, শপ বা এলাকা দিয়ে খুঁজুন...'
              }
              className="w-full pl-9 pr-3 py-2.5 bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl text-xs outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
            className="px-3.5 py-2.5 bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl text-xs font-bold text-neutral-700 outline-none"
          >
            <option value="all">সকল স্ট্যাটাস (All)</option>
            <option value="active">শুধু সক্রিয় (Active)</option>
            <option value="suspended">নিষ্ক্রিয় (Deactivated)</option>
          </select>
        </div>

        {bannerSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-[#198754] shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
        )}

        {bannerError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{bannerError}</span>
          </div>
        )}
      </div>

      {/* Account List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white border border-[#C8E6C9] rounded-2xl p-8 text-center text-xs text-neutral-600 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#157347]" />
            <span>অ্যাকাউন্ট তালিকা লোড হচ্ছে...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-white border border-[#C8E6C9] rounded-2xl p-8 text-center text-xs text-neutral-500">
            কোনো {isRider ? 'রাইডার' : 'ডিলার'} অ্যাকাউন্ট পাওয়া যায়নি।
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const isActive = acc.accountStatus === 'active';
            return (
              <div
                key={acc.id}
                className="bg-white border border-[#C8E6C9] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#E8F5E9] text-[#157347] border border-[#A5D6A7]">
                      Login ID: {acc.username}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                      Permanent ID: {acc.permanentMemberId || acc.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {isActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Deactivated)'}
                    </span>
                    {acc.mustChangePassword && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        পরবর্তী লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-neutral-900">{acc.fullName}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 mt-1">
                      <span>ইমেইল: <strong className="font-mono text-neutral-800">{acc.email || 'সেট করা নেই'}</strong></span>
                      <span>মোবাইল: <strong className="font-mono text-neutral-800">{acc.mobileNumber}</strong></span>
                      {isRider ? (
                        <>
                          {acc.vehicleType && <span>যানবাহন: <strong>{acc.vehicleType}</strong></span>}
                          {acc.vehicleRegNumber && <span>রেজি. নং: <strong className="font-mono">{acc.vehicleRegNumber}</strong></span>}
                        </>
                      ) : (
                        <>
                          {acc.shopName && <span>শপ/ডিলার পয়েন্ট: <strong>{acc.shopName}</strong></span>}
                          {acc.zoneName && <span>এলাকা: <strong>{acc.zoneName}</strong></span>}
                          {acc.tradeLicenseNumber && <span>ট্রেড লাইসেন্স: <strong className="font-mono">{acc.tradeLicenseNumber}</strong></span>}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                    <span>তৈরি: {new Date(acc.createdAt).toLocaleDateString('bn-BD')}</span>
                    <span>সর্বশেষ লগইন: {acc.lastLogin ? new Date(acc.lastLogin).toLocaleString('bn-BD') : 'এখনো লগইন করেনি'}</span>
                    {acc.lastPasswordResetAt && (
                      <span>সর্বশেষ পাসওয়ার্ড রিসেট: {new Date(acc.lastPasswordResetAt).toLocaleString('bn-BD')}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(acc)}
                    className="px-3 py-2 bg-[#F4FBF5] hover:bg-[#E8F5E9] text-[#157347] border border-[#C8E6C9] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>আইডি ও ইমেইল</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openResetPasswordModal(acc)}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>পাসওয়ার্ড রিসেট</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openStatusModal(acc)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                      isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Credential Audit Trail */}
      <div className="bg-white border border-[#C8E6C9] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-2">
          <div className="flex items-center gap-2 text-sm font-black text-[#157347]">
            <Activity className="w-4 h-4 text-[#198754]" />
            <span>ক্রেডেনশিয়াল ও পাসওয়ার্ড অডিট লগ (Credential Audit Log)</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">{auditLogs.length} টি রেকর্ড</span>
        </div>
        {auditLogs.length === 0 ? (
          <p className="text-xs text-neutral-500 py-2">এখনো কোনো ক্রেডেনশিয়াল পরিবর্তন রেকর্ড হয়নি।</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-[#F4FBF5] border border-[#E8F5E9] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-[#157347] font-mono text-[10px] font-bold">
                      {log.actionType}
                    </span>
                    {log.targetUsername && (
                      <span className="font-mono font-bold text-neutral-800">{log.targetUsername}</span>
                    )}
                  </div>
                  <p className="text-neutral-700 mt-1">{log.details}</p>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    সম্পাদনকারী: {log.superAdminName} ({log.superAdminId})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                  {new Date(log.timestamp).toLocaleString('bn-BD')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#C8E6C9] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-3">
              <h3 className="text-base font-black text-[#157347]">
                {isRider ? 'নতুন ডেলিভারি রাইডার অ্যাকাউন্ট তৈরি' : 'নতুন ডিলার অ্যাকাউন্ট তৈরি'}
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">পূর্ণ নাম *</label>
                  <input
                    type="text"
                    required
                    value={createFullName}
                    onChange={(e) => setCreateFullName(e.target.value)}
                    placeholder={isRider ? 'যেমন: মোঃ হাসান আলী' : 'যেমন: করিম ট্রেডার্স'}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">লগইন আইডি (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder={isRider ? 'যেমন: AponR-000101' : 'যেমন: AponVDS-000101'}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">ইমেইল *</label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="user@domain.com"
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    value={createMobile}
                    onChange={(e) => setCreateMobile(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                {isRider ? (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">যানবাহনের ধরন</label>
                      <input
                        type="text"
                        value={createVehicleType}
                        onChange={(e) => setCreateVehicleType(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">গাড়ির রেজিস্ট্রেশন নম্বর</label>
                      <input
                        type="text"
                        value={createVehicleReg}
                        onChange={(e) => setCreateVehicleReg(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">শপ / ডিলার পয়েন্টের নাম</label>
                      <input
                        type="text"
                        value={createShopName}
                        onChange={(e) => setCreateShopName(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">ট্রেড লাইসেন্স ও এলাকা</label>
                      <input
                        type="text"
                        value={createZoneName}
                        onChange={(e) => setCreateZoneName(e.target.value)}
                        placeholder="যেমন: উত্তরা, ঢাকা"
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">শক্তিশালী পাসওয়ার্ড *</label>
                  <div className="relative">
                    <input
                      type={createShowPass ? 'text' : 'password'}
                      required
                      value={createPassword}
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="কমপক্ষে ৮ অক্ষর (অক্ষর + সংখ্যা)"
                      className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 pr-9 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateShowPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 cursor-pointer"
                    >
                      {createShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <input
                    type={createShowPass ? 'text' : 'password'}
                    required
                    value={createConfirmPassword}
                    onChange={(e) => setCreateConfirmPassword(e.target.value)}
                    placeholder="আবার লিখুন"
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
              </div>

              {createPassword && (
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">পাসওয়ার্ডের মান: {createStrength.label}</span>
                    <span className="font-mono">{createStrength.score}/5</span>
                  </div>
                  {createStrength.issues.length > 0 && (
                    <p className="text-rose-600 text-[11px]">{createStrength.issues.join(' • ')}</p>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForceChange}
                  onChange={(e) => setCreateForceChange(e.target.checked)}
                />
                <span>প্রথম লগইনে ব্যবহারকারীকে নতুন পাসওয়ার্ড সেট করতে বাধ্য করুন</span>
              </label>

              {createError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8F5E9]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>অ্যাকাউন্ট তৈরি করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Login ID & Email Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#C8E6C9] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-3">
              <h3 className="text-base font-black text-[#157347]">
                লগইন আইডি ও ইমেইল সম্পাদনা
              </h3>
              <button type="button" onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl flex items-center justify-between">
              <span className="text-neutral-600 font-semibold">অপরিবর্তনীয় অভ্যন্তরীণ/স্থায়ী আইডি:</span>
              <span className="font-mono font-black text-[#157347] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                {editTarget.permanentMemberId || editTarget.id}
              </span>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">লগইন আইডি (Login ID) *</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">ইমেইল</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">পূর্ণ নাম</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 block">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
                {isRider ? (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">যানবাহনের ধরন</label>
                      <input
                        type="text"
                        value={editVehicleType}
                        onChange={(e) => setEditVehicleType(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">গাড়ির নম্বর</label>
                      <input
                        type="text"
                        value={editVehicleReg}
                        onChange={(e) => setEditVehicleReg(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">শপের নাম</label>
                      <input
                        type="text"
                        value={editShopName}
                        onChange={(e) => setEditShopName(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 block">জোন / এলাকা</label>
                      <input
                        type="text"
                        value={editZoneName}
                        onChange={(e) => setEditZoneName(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {editError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8F5E9]">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>পরিবর্তন সংরক্ষণ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset / Set Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#C8E6C9] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-3">
              <h3 className="text-base font-black text-[#157347] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>পাসওয়ার্ড রিসেট / নতুন পাসওয়ার্ড সেট</span>
              </h3>
              <button type="button" onClick={() => setResetTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl space-y-1">
              <div className="font-bold text-neutral-900">{resetTarget.fullName}</div>
              <div className="text-neutral-600 font-mono">
                Login ID: {resetTarget.username} • Email: {resetTarget.email || 'নাই'}
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">নতুন পাসওয়ার্ড *</label>
                <div className="relative">
                  <input
                    type={resetShowPass ? 'text' : 'password'}
                    required
                    value={resetNewPass}
                    onChange={(e) => {
                      setResetNewPass(e.target.value);
                      setResetConfirmStep(false);
                    }}
                    placeholder="কমপক্ষে ৮ অক্ষর (ইংরেজি অক্ষর + সংখ্যা)"
                    className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 pr-9 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setResetShowPass((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 cursor-pointer"
                  >
                    {resetShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 block">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input
                  type={resetShowPass ? 'text' : 'password'}
                  required
                  value={resetConfirmPass}
                  onChange={(e) => {
                    setResetConfirmPass(e.target.value);
                    setResetConfirmStep(false);
                  }}
                  placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 font-mono outline-none"
                />
              </div>

              {resetNewPass && (
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">পাসওয়ার্ডের শক্তি: {resetStrength.label}</span>
                    <span className="font-mono">{resetStrength.score}/5</span>
                  </div>
                  {resetStrength.issues.length > 0 && (
                    <p className="text-rose-600 text-[11px]">{resetStrength.issues.join(' • ')}</p>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetForceChange}
                  onChange={(e) => setResetForceChange(e.target.checked)}
                />
                <span>পরবর্তী লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক করুন (Recommended)</span>
              </label>

              <label className="flex items-start gap-2 font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetSendEmail}
                  onChange={(e) => setResetSendEmail(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  ব্যবহারকারীর ইমেইলে নোটিফিকেশন পাঠানোর চেষ্টা করুন (পাসওয়ার্ড নয়, কেবল রিসেট বার্তা)
                </span>
              </label>

              {resetSendEmail && !isEmailConfigured && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px]">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    সতর্কতা: সার্ভারে বর্তমানে কোনো বাস্তব ইমেইল প্রোভাইডার (SMTP / Resend / SendGrid) কনফিগার করা নেই। তাই পাসওয়ার্ড রিসেট সংরক্ষণ হলেও ইমেইল ডেলিভারি সম্ভব হবে না।
                  </span>
                </div>
              )}

              {resetConfirmStep && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-bold">
                  নিশ্চিতকরণ: সাবমিট করলে "{resetTarget.username}"-এর পুরোনো পাসওয়ার্ড তৎক্ষণাৎ অকার্যকর হবে। নিশ্চিত করতে আবার ক্লিক করুন।
                </div>
              )}

              {resetError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8F5E9]">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-5 py-2 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resetSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{resetConfirmStep ? 'নিশ্চিত ও পাসওয়ার্ড রিসেট করুন' : 'পাসওয়ার্ড আপডেট করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate / Deactivate Confirmation Modal */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#C8E6C9] rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-3">
              <h3 className="text-base font-black text-[#157347] flex items-center gap-2">
                {statusTarget.accountStatus === 'active' ? (
                  <>
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>অ্যাকাউন্ট নিষ্ক্রিয় করুন (Deactivate)</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>অ্যাকাউন্ট সক্রিয় করুন (Activate)</span>
                  </>
                )}
              </h3>
              <button type="button" onClick={() => setStatusTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-700 leading-relaxed">
              {statusTarget.accountStatus === 'active'
                ? `আপনি "${statusTarget.fullName}" (${statusTarget.username}) অ্যাকাউন্টটি নিষ্ক্রিয় করতে যাচ্ছেন। নিষ্ক্রিয় করলে তিনি সিস্টেমে লগইন করতে পারবেন না, তবে তাঁর পূর্বের সকল অর্ডার, ওয়ালেট ও তথ্য সুরক্ষিত থাকবে।`
                : `আপনি "${statusTarget.fullName}" (${statusTarget.username}) অ্যাকাউন্টটি পুনরায় সক্রিয় করতে যাচ্ছেন। সক্রিয় করলে তিনি লগইন করতে পারবেন।`}
            </p>

            <div className="space-y-1">
              <label className="font-bold text-neutral-700 block">কারণ (ঐচ্ছিক)</label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="অডিট লগের জন্য কারণ উল্লেখ করতে পারেন"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl p-2.5 outline-none"
              />
            </div>

            {statusError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8F5E9]">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleStatusToggleConfirm}
                disabled={statusSubmitting}
                className={`px-5 py-2 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  statusTarget.accountStatus === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#198754] hover:bg-[#157347]'
                }`}
              >
                {statusSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{statusTarget.accountStatus === 'active' ? 'নিশ্চিত নিষ্ক্রিয় করুন' : 'নিশ্চিত সক্রিয় করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
