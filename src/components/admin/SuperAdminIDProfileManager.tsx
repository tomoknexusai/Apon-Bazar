/**
 * Super Admin Complete ID & Profile Management Control System
 * Project: Apon Bazar
 * 
 * Provides Super Admin with complete control over every registered ID/profile:
 * - Comprehensive ID List Table with search, role, status, and date filters
 * - View Full Profile
 * - Edit Permitted Profile Fields (Name, Mobile, Email, Role, Status, Referral/Sponsor ID, Placement, Address, Role fields)
 * - Reset Password (Secure hashing, temporary password generator, force change on next login, no plaintext display)
 * - Activate / Deactivate / Suspend / Ban Status Management
 * - Account Reset & Advanced Maintenance
 * - Universal Confirmation Dialogs & Non-Plaintext Audit Logging
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth, ActiveUserFilterParams, normalizeBDMobileNumber } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { canAccessActiveUserList, isImmutableSuperAdmin } from '../../lib/rbac';
import { AccessDenied403 } from '../common/AccessDenied403';
import { UserProfile, UserRole, AccountStatus, KycStatus, ServiceAddress, FIXED_SUPER_ADMIN_ID, BusinessType, FinalRole, FINAL_ROLE_DEFINITIONS } from '../../types';
import { UniqueIdService } from '../../services/UniqueIdService';
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
  KeyRound,
  Key,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  HelpCircle,
  Shield,
  Layers,
  ChevronDown,
  UserX,
  Award,
  Sliders,
  MoreVertical
} from 'lucide-react';

export const SuperAdminIDProfileManager: React.FC = () => {
  const {
    currentUser,
    getActiveUsersForSuperAdmin,
    allUsers,
    updateUserStatusByAdmin,
    updateUserByAdmin,
    resetUserPasswordBySuperAdmin,
    resetUserAccountBySuperAdmin,
    deleteUserByAdmin,
    enterUserDashboard,
    addAuditLog
  } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected User State for Modals
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<boolean>(false);
  const [showResetAccountModal, setShowResetAccountModal] = useState<boolean>(false);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState<string>('');
  const [editMobileNumber, setEditMobileNumber] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editPrimaryRole, setEditPrimaryRole] = useState<UserRole>('customer');
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [editAccountStatus, setEditAccountStatus] = useState<AccountStatus>('active');
  const [editVerificationStatus, setEditVerificationStatus] = useState<KycStatus>('unverified');
  const [editSponsorId, setEditSponsorId] = useState<string>('');
  const [editReferralId, setEditReferralId] = useState<string>('');
  const [editPlacementId, setEditPlacementId] = useState<string>('');
  const [editPlacementLeg, setEditPlacementLeg] = useState<'left' | 'right'>('left');
  const [editNationalId, setEditNationalId] = useState<string>('');
  const [editDateOfBirth, setEditDateOfBirth] = useState<string>('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'other'>('male');
  const [editShopName, setEditShopName] = useState<string>('');
  const [editVehicleType, setEditVehicleType] = useState<string>('');
  const [editVehicleRegNumber, setEditVehicleRegNumber] = useState<string>('');
  const [editDrivingLicenseNumber, setEditDrivingLicenseNumber] = useState<string>('');
  const [editDivision, setEditDivision] = useState<string>('ঢাকা');
  const [editDistrict, setEditDistrict] = useState<string>('ঢাকা');
  const [editUpazila, setEditUpazila] = useState<string>('ধানমন্ডি');
  const [editUnionName, setEditUnionName] = useState<string>('');
  const [editWard, setEditWard] = useState<string>('');
  const [editArea, setEditArea] = useState<string>('');
  const [editPostalCode, setEditPostalCode] = useState<string>('1209');
  const [editFullAddress, setEditFullAddress] = useState<string>('');
  const [editBusinessType, setEditBusinessType] = useState<BusinessType>('Dealer');

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [forceChangeNextLogin, setForceChangeNextLogin] = useState<boolean>(true);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);

  // Account Reset Form State
  const [resetWalletOption, setResetWalletOption] = useState<boolean>(false);
  const [resetStatusOption, setResetStatusOption] = useState<boolean>(true);
  const [resetKycOption, setResetKycOption] = useState<boolean>(false);
  const [resetReason, setResetReason] = useState<string>('অ্যাকাউন্ট প্যারামিটার রক্ষণাবেক্ষণ ও ডাটা রিসেট');

  // Confirmation Dialog State
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    actionType: 'edit_profile' | 'reset_password' | 'toggle_status' | 'reset_account' | 'delete_user';
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'edit_profile',
    onConfirm: () => {},
    variant: 'primary'
  });

  // Action / Feedback Toast Messages
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Role & Status Counts for Top Summary Cards
  const stats = useMemo(() => {
    return {
      total: allUsers.length,
      active: allUsers.filter((u) => u?.accountStatus === 'active').length,
      suspended: allUsers.filter((u) => u?.accountStatus === 'suspended' || u?.accountStatus === 'pending').length,
      banned: allUsers.filter((u) => u?.accountStatus === 'banned').length,
      admins: allUsers.filter((u) => u?.roles?.includes('admin') || u?.roles?.includes('super_admin') || u?.primaryRole === 'admin' || u?.primaryRole === 'super_admin').length,
      dealers: allUsers.filter((u) => u?.roles?.includes('dealer') || u?.roles?.includes('vendor') || u?.primaryRole === 'dealer' || u?.primaryRole === 'vendor').length,
      riders: allUsers.filter((u) => u?.roles?.includes('delivery_rider') || u?.primaryRole === 'delivery_rider').length,
      networkMembers: allUsers.filter((u) => u?.roles?.includes('network_member') || u?.isNetworkActive).length,
      customers: allUsers.filter((u) => u?.primaryRole === 'customer').length
    };
  }, [allUsers]);

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

  // Pagination slice
  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return queryResult.users.slice(startIdx, startIdx + itemsPerPage);
  }, [queryResult.users, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(queryResult.users.length / itemsPerPage) || 1;

  // Log search action for audit compliance when filters change
  useEffect(() => {
    if (isSuperAdmin && (searchTerm || startDate || endDate || roleFilter !== 'all' || statusFilter !== 'all')) {
      const logDetails = `Super Admin queried All Registered IDs. Search: '${searchTerm || 'All'}', Role: '${roleFilter}', Status: '${statusFilter}', Date Range: ${startDate || 'Any'} to ${endDate || 'Any'}`;
      addAuditLog('SUPER_ADMIN_SEARCH_ALL_USERS', 'All_IDs_Directory', logDetails);
    }
  }, [searchTerm, startDate, endDate, roleFilter, statusFilter, isSuperAdmin]);

  // Reset filter to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, kycFilter, divisionFilter, startDate, endDate, sortBy]);

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

  // 1. ACTION: View Profile
  const handleOpenViewModal = (user: UserProfile) => {
    setSelectedUser(user);
    setShowViewModal(true);

    addAuditLog(
      'SUPER_ADMIN_VIEW_USER_PROFILE',
      'Users',
      `Super Admin viewed full profile of user: '${user.fullName}' (ID: ${user.permanentMemberId || user.id}, Role: ${user.primaryRole})`
    );
  };

  // 2. ACTION: Edit Profile
  const handleOpenEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setEditFullName(user.fullName || '');
    setEditMobileNumber(user.mobileNumber || '');
    setEditEmail(user.email || '');
    setEditPrimaryRole(user.primaryRole || 'customer');
    setEditRoles(user.roles && user.roles.length > 0 ? user.roles : [user.primaryRole || 'customer']);
    setEditBusinessType(user.businessType || 'Dealer');
    setEditAccountStatus(user.accountStatus || 'active');
    setEditVerificationStatus(user.verificationStatus || 'unverified');
    setEditSponsorId(user.sponsorId || '');
    setEditReferralId(user.referralId || '');
    setEditPlacementId(user.placementId || '');
    setEditPlacementLeg(user.placementLeg || 'left');
    setEditNationalId(user.nationalId || '');
    setEditDateOfBirth(user.dateOfBirth || '');
    setEditGender(user.gender || 'male');
    setEditShopName(user.shopName || '');
    setEditVehicleType(user.vehicleType || '');
    setEditVehicleRegNumber(user.vehicleRegNumber || '');
    setEditDrivingLicenseNumber(user.drivingLicenseNumber || '');

    // Address
    const addr = user.mandatoryAddress;
    setEditDivision(addr?.division || 'ঢাকা');
    setEditDistrict(addr?.district || 'ঢাকা');
    setEditUpazila(addr?.upazila || 'ধানমন্ডি');
    setEditUnionName(addr?.unionName || '');
    setEditWard(addr?.ward || '');
    setEditArea(addr?.area || '');
    setEditPostalCode(addr?.postalCode || '1209');
    setEditFullAddress(addr?.fullServiceAddress || '');

    setShowEditModal(true);
  };

  const handleRequestSaveProfile = () => {
    if (!selectedUser) return;

    if (!editFullName.trim()) {
      showToast('error', 'ইউজারের পূর্ণ নাম আবশ্যক!');
      return;
    }

    if (!editMobileNumber.trim() || normalizeBDMobileNumber(editMobileNumber).length < 11) {
      showToast('error', 'সঠিক ১১-সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন!');
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: isBn ? 'প্রোফাইল পরিবর্তনের নিশ্চয়তা' : 'Confirm Profile Update',
      message: isBn
        ? `আপনি কি ইউজার '${selectedUser.fullName}' (ID: ${selectedUser.permanentMemberId || selectedUser.id}) এর প্রোফাইল তথ্য ও অনুমতি আপডেট করতে নিশ্চিত?`
        : `Are you sure you want to update profile details for '${selectedUser.fullName}'?`,
      confirmButtonText: isBn ? 'হ্যাঁ, আপডেট নিশ্চিত করুন' : 'Yes, Update Profile',
      cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
      actionType: 'edit_profile',
      variant: 'primary',
      onConfirm: () => {
        executeSaveProfile();
      }
    });
  };

  const executeSaveProfile = () => {
    if (!selectedUser) return;

    const res = updateUserByAdmin(
      selectedUser.id,
      {
        fullName: editFullName.trim(),
        mobileNumber: editMobileNumber.trim(),
        email: editEmail.trim(),
        primaryRole: editPrimaryRole,
        roles: editRoles.length > 0 ? editRoles : [editPrimaryRole],
        businessType: editBusinessType,
        accountStatus: editAccountStatus,
        verificationStatus: editVerificationStatus,
        sponsorId: editSponsorId.trim() || undefined,
        referralId: editReferralId.trim() || undefined,
        placementId: editPlacementId.trim() || undefined,
        placementLeg: editPlacementLeg,
        nationalId: editNationalId.trim() || undefined,
        dateOfBirth: editDateOfBirth || undefined,
        gender: editGender,
        shopName: editShopName.trim() || undefined,
        vehicleType: editVehicleType.trim() || undefined,
        vehicleRegNumber: editVehicleRegNumber.trim() || undefined,
        drivingLicenseNumber: editDrivingLicenseNumber.trim() || undefined
      },
      {
        division: editDivision,
        district: editDistrict,
        upazila: editUpazila,
        unionName: editUnionName,
        ward: editWard,
        area: editArea,
        postalCode: editPostalCode,
        fullServiceAddress: editFullAddress
      }
    );

    if (res.success) {
      showToast('success', res.message);
      setShowEditModal(false);
      setSelectedUser(null);
    } else {
      showToast('error', res.message);
    }
  };

  // 3. ACTION: Reset Password
  const handleOpenResetPasswordModal = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordText(true);
    setForceChangeNextLogin(true);
    setCopiedPassword(false);
    setShowResetPasswordModal(true);
  };

  const handleGenerateStrongPassword = () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '@#$%=!';
    
    let pass = 'TMK@';
    for (let i = 0; i < 4; i++) pass += numbers[Math.floor(Math.random() * numbers.length)];
    for (let i = 0; i < 2; i++) pass += upper[Math.floor(Math.random() * upper.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];

    setNewPassword(pass);
    setCopiedPassword(false);
  };

  const handleCopyGeneratedPassword = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  const handleRequestPasswordReset = () => {
    if (!selectedUser) return;

    if (!newPassword || newPassword.trim().length < 6) {
      showToast('error', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: isBn ? 'পাসওয়ার্ড রিসেটের নিশ্চয়তা' : 'Confirm Password Reset',
      message: isBn
        ? `আপনি কি নিশ্চিত যে ইউজার '${selectedUser.fullName}' (ID: ${selectedUser.permanentMemberId || selectedUser.id}) এর পাসওয়ার্ড পরিবর্তন করতে চান? নতুন পাসওয়ার্ড ডাটাবেজে সল্টেড হ্যাশ হিসেবে সংরক্ষিত হবে।`
        : `Are you sure you want to reset password for user '${selectedUser.fullName}'?`,
      confirmButtonText: isBn ? 'হ্যাঁ, পাসওয়ার্ড রিসেট করুন' : 'Yes, Reset Password',
      cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
      actionType: 'reset_password',
      variant: 'warning',
      onConfirm: () => {
        executePasswordReset();
      }
    });
  };

  const executePasswordReset = async () => {
    if (!selectedUser || !newPassword) return;

    const res = await resetUserPasswordBySuperAdmin(
      selectedUser.id,
      newPassword,
      forceChangeNextLogin
    );

    if (res.success) {
      showToast('success', res.message);
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } else {
      showToast('error', res.message);
    }
  };

  // 4. ACTION: Activate / Deactivate / Change Status
  const handleRequestStatusToggle = (user: UserProfile, targetStatus: AccountStatus) => {
    if (isImmutableSuperAdmin(user.id) || user.id === FIXED_SUPER_ADMIN_ID) {
      showToast('error', 'সুপার এডমিন অ্যাকাউন্ট অপরিবর্তনীয় ও সুরক্ষিত। স্ট্যাটাস পরিবর্তন নিষিদ্ধ!');
      return;
    }

    const actionName =
      targetStatus === 'active'
        ? (isBn ? 'সক্রিয় (Activate)' : 'Activate')
        : targetStatus === 'suspended'
        ? (isBn ? 'ডিঅ্যাক্টিভেট / সাসপেন্ড (Deactivate)' : 'Deactivate')
        : (isBn ? 'ব্লক / ব্যান (Block/Ban)' : 'Block');

    setConfirmationDialog({
      isOpen: true,
      title: isBn ? 'অ্যাকাউন্ট স্ট্যাটাস পরিবর্তন' : 'Change Account Status',
      message: isBn
        ? `আপনি কি নিশ্চিত যে '${user.fullName}' (ID: ${user.permanentMemberId || user.id}) এর অ্যাকাউন্ট স্ট্যাটাস '${actionName}' এ পরিবর্তন করতে চান?`
        : `Are you sure you want to set account status to '${actionName}' for '${user.fullName}'?`,
      confirmButtonText: isBn ? `হ্যাঁ, ${actionName} করুন` : `Yes, Set to ${actionName}`,
      cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
      actionType: 'toggle_status',
      variant: targetStatus === 'active' ? 'success' : 'danger',
      onConfirm: () => {
        const res = updateUserStatusByAdmin(
          user.id,
          targetStatus,
          `Super Admin changed status to '${targetStatus}' via Complete ID Management Hub`
        );
        if (res.success) {
          showToast('success', res.message);
        } else {
          showToast('error', res.message);
        }
      }
    });
  };

  // 5. ACTION: Reset Account State
  const handleOpenResetAccountModal = (user: UserProfile) => {
    setSelectedUser(user);
    setResetWalletOption(false);
    setResetStatusOption(true);
    setResetKycOption(false);
    setResetReason('অ্যাকাউন্ট প্যারামিটার রিসেট ও ডাটা ক্লিনআপ');
    setShowResetAccountModal(true);
  };

  const handleRequestAccountReset = () => {
    if (!selectedUser) return;

    setConfirmationDialog({
      isOpen: true,
      title: isBn ? 'অ্যাকাউন্ট রিসেটের চূড়ান্ত নিশ্চয়তা' : 'Confirm Account Reset',
      message: isBn
        ? `আপনি কি নিশ্চিত যে '${selectedUser.fullName}' (ID: ${selectedUser.permanentMemberId || selectedUser.id}) এর অ্যাকাউন্ট প্যারামিটার রিসেট করতে চান?`
        : `Are you sure you want to reset parameters for '${selectedUser.fullName}'?`,
      confirmButtonText: isBn ? 'হ্যাঁ, অ্যাকাউন্ট রিসেট করুন' : 'Yes, Reset Account',
      cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
      actionType: 'reset_account',
      variant: 'danger',
      onConfirm: () => {
        const res = resetUserAccountBySuperAdmin(selectedUser.id, {
          resetWallet: resetWalletOption,
          resetStatus: resetStatusOption,
          resetKyc: resetKycOption,
          reason: resetReason
        });

        if (res.success) {
          showToast('success', res.message);
          setShowResetAccountModal(false);
          setSelectedUser(null);
        } else {
          showToast('error', res.message);
        }
      }
    });
  };

  // 6. ACTION: Delete User Account
  const handleRequestDeleteUser = (user: UserProfile) => {
    if (isImmutableSuperAdmin(user.id) || user.id === FIXED_SUPER_ADMIN_ID) {
      showToast('error', 'সুপার এডমিন অ্যাকাউন্ট স্থায়ীভাবে সংরক্ষিত। এটি ডিলিট করা অসম্ভব!');
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      title: isBn ? 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলার নিশ্চয়তা' : 'Confirm Permanent Account Deletion',
      message: isBn
        ? `সতর্কতা: আপনি কি নিশ্চিত যে '${user.fullName}' (ID: ${user.permanentMemberId || user.id}) এর অ্যাকাউন্ট স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলতে চান? এই অ্যাকশনটি অপরিবর্তনীয়!`
        : `Warning: Are you sure you want to permanently delete user account '${user.fullName}'? This action is irreversible!`,
      confirmButtonText: isBn ? 'স্থায়ীভাবে ডিলিট করুন' : 'Delete Permanently',
      cancelButtonText: isBn ? 'বাতিল' : 'Cancel',
      actionType: 'delete_user',
      variant: 'danger',
      onConfirm: () => {
        const res = deleteUserByAdmin(user.id);
        if (res.success) {
          showToast('success', res.message);
        } else {
          showToast('error', res.message);
        }
      }
    });
  };

  // Super Admin: Enter User Dashboard / Login as User
  const handleEnterDashboard = (userId: string) => {
    const res = enterUserDashboard(userId);
    if (res.success) {
      setShowViewModal(false);
      setSelectedUser(null);
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  // Toggle role in multi-role selection
  const handleToggleRoleSelection = (role: UserRole) => {
    if (editRoles.includes(role)) {
      if (editRoles.length === 1) return; // Must have at least one role
      setEditRoles(editRoles.filter((r) => r !== role));
      if (editPrimaryRole === role) {
        const remaining = editRoles.filter((r) => r !== role);
        setEditPrimaryRole(remaining[0] || 'customer');
      }
    } else {
      setEditRoles([...editRoles, role]);
    }
  };

  // Render Access Denied 403 screen if user is NOT Super Admin
  if (!isSuperAdmin) {
    return <AccessDenied403 attemptedRole="super_admin" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold transition-all animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border border-emerald-400'
              : 'bg-rose-600 text-white border border-rose-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white shrink-0" />
            )}
            <span className="text-sm">{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/20 rounded-lg text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Super Admin ID & Profile Management Master Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shrink-0 ring-2 ring-indigo-400/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {isBn
                    ? 'আইডি ও প্রোফাইল ব্যবস্থাপনা (All ID & Profile Management)'
                    : 'Super Admin ID & Profile Management Hub'}
                </h2>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Super Admin Root RBAC Enforced
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-3xl">
                {isBn
                  ? 'নিবন্ধিত প্রতিটি আইডির সম্পূর্ণ তথ্য দেখা, প্রোফাইল ও ভূমিকা এডিট, নিরাপদ পাসওয়ার্ড রিসেট, অ্যাকাউন্ট সক্রিয়/নিষ্ক্রিয় ও পরিচালনা করার সর্বাধিনায়ক প্যানেল।'
                  : 'Complete administrative control over every registered account. View profiles, edit credentials & roles, securely reset passwords, and toggle account states.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-right">
              <span className="text-neutral-400 block text-[10px] font-bold uppercase tracking-wider">
                {isBn ? 'মোট নিবন্ধিত অ্যাকাউন্ট' : 'Total Registered IDs'}
              </span>
              <span className="text-xl font-black font-mono text-white flex items-center justify-end gap-1.5">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{allUsers.length} জন</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS & QUICK FILTER CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Registered IDs */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('all');
            setStatusFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            roleFilter === 'all' && statusFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${roleFilter === 'all' && statusFilter === 'all' ? 'text-indigo-200' : 'text-neutral-500'}`}>
              মোট অ্যাকাউন্ট
            </span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.total}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${roleFilter === 'all' && statusFilter === 'all' ? 'text-indigo-200' : 'text-neutral-400'}`}>
              সকল আইডি দেখুন
            </span>
          </div>
        </button>

        {/* Active IDs */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('active');
            setRoleFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'active' ? 'text-emerald-200' : 'text-neutral-500'}`}>
              সক্রিয় (Active)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.active}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${statusFilter === 'active' ? 'text-emerald-200' : 'text-neutral-400'}`}>
              সক্রিয় আইডি ফিল্টার
            </span>
          </div>
        </button>

        {/* Suspended / Pending IDs */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('suspended');
            setRoleFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            statusFilter === 'suspended'
              ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${statusFilter === 'suspended' ? 'text-amber-200' : 'text-neutral-500'}`}>
              সাসপেন্ড / পেন্ডিং
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.suspended}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${statusFilter === 'suspended' ? 'text-amber-200' : 'text-neutral-400'}`}>
              স্থগিত অ্যাকাউন্ট
            </span>
          </div>
        </button>

        {/* Admins Count */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('admin');
            setStatusFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            roleFilter === 'admin'
              ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${roleFilter === 'admin' ? 'text-purple-200' : 'text-neutral-500'}`}>
              এডমিন ও অফিসার
            </span>
            <Shield className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.admins}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${roleFilter === 'admin' ? 'text-purple-200' : 'text-neutral-400'}`}>
              এডমিন তালিকা ফিল্টার
            </span>
          </div>
        </button>

        {/* Dealers & Vendors */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('dealer');
            setStatusFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            roleFilter === 'dealer'
              ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${roleFilter === 'dealer' ? 'text-blue-200' : 'text-neutral-500'}`}>
              ডিলার ও ভেন্ডর
            </span>
            <Store className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.dealers}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${roleFilter === 'dealer' ? 'text-blue-200' : 'text-neutral-400'}`}>
              ডিলার তালিকা ফিল্টার
            </span>
          </div>
        </button>

        {/* Delivery Riders */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('delivery_rider');
            setStatusFilter('all');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-sm flex flex-col justify-between ${
            roleFilter === 'delivery_rider'
              ? 'bg-teal-600 text-white border-teal-500 ring-2 ring-teal-400'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-extrabold uppercase ${roleFilter === 'delivery_rider' ? 'text-teal-200' : 'text-neutral-500'}`}>
              ডেলিভারি ম্যান
            </span>
            <Truck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono">{stats.riders}</span>
            <span className={`text-[9px] block font-bold mt-0.5 ${roleFilter === 'delivery_rider' ? 'text-teal-200' : 'text-neutral-400'}`}>
              রাইডার তালিকা ফিল্টার
            </span>
          </div>
        </button>
      </div>

      {/* SEARCH, FILTER & DATE RANGE CONTROL BAR */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">
            <Filter className="w-4 h-4" />
            <span>
              {isBn
                ? 'আইডি সার্চ, পদবী, অবস্থান ও রেজিস্ট্রেশন তারিখ ফিল্টারিং'
                : 'Advanced Search & Multi-Param Filtering Hub'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>{isBn ? 'ফিল্টার রিসেট' : 'Reset Filters'}</span>
          </button>
        </div>

        {/* Search Input & Primary Date Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Main Search Input */}
          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {isBn ? 'সার্চ (আইডি নম্বর, নাম, মোবাইল নম্বর, ইমেইল, এনআইডি)' : 'Search Query'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isBn
                    ? 'AponCN-000001 / AponVDS-000001 / নাম / মোবাইল / ইমেইল দিয়ে খুঁজুন...'
                    : 'Search by Unique ID (e.g. AponCN-000001, AponVDS-000001), Name, Mobile...'
                }
                className="w-full pl-9 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
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
            <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isBn ? 'নিবন্ধন শুরু তারিখ' : 'Reg Start Date'}</span>
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
            <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isBn ? 'নিবন্ধন শেষ তারিখ' : 'Reg End Date'}</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
          <span className="font-bold text-neutral-500 text-[11px]">
            {isBn ? 'তারিখ শর্টকাট:' : 'Date Presets:'}
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
            {isBn ? 'আজকে' : 'Today'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate(7)}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {isBn ? 'গত ৭ দিন' : 'Last 7 Days'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate('this_month')}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {isBn ? 'এই মাস' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDate('all')}
            className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-[11px] font-bold transition-all"
          >
            {isBn ? 'সব তারিখ' : 'All Time'}
          </button>
        </div>

        {/* Secondary Filters Dropdown Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
          {/* Role Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {isBn ? 'ভূমিকা / পদবী (Role)' : 'Role'}
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল ভূমিকা (All Roles)</option>
              <option value="customer_networker">১. কাস্টমার ও নেটওয়ার্কার (Customer & Networker - AponCN)</option>
              <option value="operations_officer">২. অপারেশন অফিসার (Operation Officer - AponOO)</option>
              <option value="vendor_dealer_shop">৩. ভেন্ডর / ডিলার / শপ (Vendor / Dealer / Shop - AponVDS)</option>
              <option value="rider">৪. রাইডার (Rider - AponR)</option>
              <option value="admin">৫. এডমিন (Admin - AponA)</option>
              <option value="super_admin">৬. সুপার এডমিন (Super Admin - AponSA)</option>
              <option value="account_officer">৭. একাউন্ট অফিসার (Account Officer - AponAO)</option>
              <option value="hr">৮. এইচআর (HR - AponHR)</option>
              <option value="dealer">ডিলার (Legacy Dealer)</option>
              <option value="vendor">ভেন্ডর (Legacy Vendor)</option>
              <option value="delivery_rider">ডেলিভারি ম্যান (Legacy Rider)</option>
              <option value="network_member">নেটওয়ার্ক মেম্বার (Legacy Network)</option>
              <option value="customer">কাস্টমার (Legacy Customer)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল স্ট্যাটাস (All)</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="pending">অপেক্ষমান (Pending)</option>
              <option value="suspended">সাসপেন্ডেড / ডিঅ্যাক্টিভ (Suspended)</option>
              <option value="banned">ব্যান্ড / ব্লকড (Banned)</option>
            </select>
          </div>

          {/* Division Location Filter */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {isBn ? 'বিভাগ (Division)' : 'Division Filter'}
            </label>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="all">সকল বিভাগ (All Divisions)</option>
              <option value="ঢাকা">ঢাকা বিভাগ</option>
              <option value="চট্টগ্রাম">চট্টগ্রাম বিভাগ</option>
              <option value="রংপুর">রংপুর বিভাগ</option>
              <option value="রাজশাহী">রাজশাহী বিভাগ</option>
              <option value="খুলনা">খুলনা বিভাগ</option>
              <option value="বরিশাল">বরিশাল বিভাগ</option>
              <option value="সিলেট">সিলেট বিভাগ</option>
              <option value="ময়মনসিংহ">ময়মনসিংহ বিভাগ</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="space-y-1">
            <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
              {isBn ? 'সাজানো (Sorting)' : 'Sort By'}
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-bold"
            >
              <option value="newest">সর্বশেষ নিবন্ধিত (Newest)</option>
              <option value="oldest">পুরাতন নিবন্ধিত (Oldest)</option>
              <option value="name">নাম অনুযায়ী (Name A-Z)</option>
              <option value="balance">টোকেন ব্যালেন্স (Highest Balance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ALL REGISTERED ID LIST TABLE */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Table Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-neutral-900 dark:text-white text-base">
              {isBn ? 'নিবন্ধিত সকল আইডি তালিকা (All Registered Accounts)' : 'All Registered ID Directory'}
            </h3>
            <span className="px-3 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-mono font-black">
              {queryResult.totalCount} জন অ্যাকাউন্ট পাওয়া গেছে
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            {isBn
              ? `প্রদর্শিত: ${Math.min(paginatedUsers.length, itemsPerPage)} জন | পৃষ্ঠা ${currentPage} এর ${totalPages}`
              : `Showing page ${currentPage} of ${totalPages}`}
          </div>
        </div>

        {/* Empty State */}
        {queryResult.users.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
            <Users className="w-12 h-12 text-neutral-400 mx-auto" />
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {isBn
                ? 'প্রদত্ত ফিল্টার বা সার্চ অনুযায়ী কোনো ইউজার আইডি রেকর্ড পাওয়া যায়নি।'
                : 'No registered accounts match your selected filter criteria.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-md"
            >
              {isBn ? 'ফিল্টার রিসেট করুন' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 font-black uppercase text-[11px] border-b border-neutral-200 dark:border-neutral-700">
                  <th className="p-3.5 rounded-l-2xl">ID No / Customer ID</th>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Mobile Number</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Registration Date</th>
                  <th className="p-3.5">Last Login</th>
                  <th className="p-3.5 text-center rounded-r-2xl min-w-[280px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {paginatedUsers.map((user) => {
                  const regDateFormatted = user?.createdAt
                    ? (() => {
                        try {
                          return new Date(user.createdAt).toLocaleDateString(
                            isBn ? 'bn-BD' : 'en-US',
                            { year: 'numeric', month: 'short', day: '2-digit' }
                          );
                        } catch {
                          return user.createdAt.slice(0, 10);
                        }
                      })()
                    : 'N/A';

                  const lastLoginFormatted = user?.lastLogin
                    ? (() => {
                        try {
                          return new Date(user.lastLogin).toLocaleDateString(
                            isBn ? 'bn-BD' : 'en-US',
                            { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }
                          );
                        } catch {
                          return user.lastLogin.slice(0, 16);
                        }
                      })()
                    : (isBn ? 'লগইন হয়নি' : 'Never logged in');

                  const isRootSuperAdmin = isImmutableSuperAdmin(user.id) || user.id === FIXED_SUPER_ADMIN_ID;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                    >
                      {/* 1. ID No / Customer ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              user.profilePhotoUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                            }
                            alt={user.fullName}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                          />
                          <div>
                            <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60 block text-[11px]">
                              {user.aponUniqueId || user.permanentMemberId || user.id}
                            </span>
                            {user.businessType && (
                              <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold text-[9px] px-1.5 py-0.2 rounded border border-amber-300 mt-1 inline-block">
                                Type: {user.businessType}
                              </span>
                            )}
                            {isRootSuperAdmin && (
                              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full mt-1 inline-block">
                                ROOT SUPER ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Name */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-neutral-900 dark:text-white block text-sm">
                            {user.fullName}
                          </span>
                          {user.email && (
                            <span className="text-neutral-500 dark:text-neutral-400 text-[11px] block truncate max-w-[180px]">
                              {user.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Mobile Number */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{user.mobileNumber}</span>
                        </div>
                      </td>

                      {/* 4. Role */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                            {UniqueIdService.getRoleTitle(user.primaryRole).en}
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-medium">
                            {UniqueIdService.getRoleTitle(user.primaryRole).bn}
                          </span>
                        </div>
                      </td>

                      {/* 5. Account Status */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 shadow-2xs ${
                            user.accountStatus === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                              : user.accountStatus === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300'
                          }`}
                        >
                          {user.accountStatus === 'active' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          )}
                          <span>{(user?.accountStatus || 'active').toUpperCase()}</span>
                        </span>
                      </td>

                      {/* 6. Registration Date */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{regDateFormatted}</span>
                        </div>
                      </td>

                      {/* 7. Last Login */}
                      <td className="p-3.5">
                        <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 block">
                          {lastLoginFormatted}
                        </span>
                      </td>

                      {/* 8. ACTIONS: View | Edit | Reset Password | Activate/Deactivate */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 1. View Profile Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewModal(user)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-2xs border border-indigo-200 dark:border-indigo-800 cursor-pointer"
                            title="ভিউ প্রোফাইল (View Profile)"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* 2. Edit Profile Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-2xs border border-amber-200 dark:border-amber-800 cursor-pointer"
                            title="এডিট প্রোফাইল (Edit Profile)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* 3. Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenResetPasswordModal(user)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-2xs border border-purple-200 dark:border-purple-800 cursor-pointer"
                            title="পাসওয়ার্ড রিসেট (Reset Password)"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                            <span>Reset Pass</span>
                          </button>

                          {/* 4. Activate / Deactivate Toggle Button */}
                          {!isRootSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleRequestStatusToggle(
                                  user,
                                  user.accountStatus === 'active' ? 'suspended' : 'active'
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-2xs border cursor-pointer ${
                                user.accountStatus === 'active'
                                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                  : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              }`}
                              title={
                                user.accountStatus === 'active'
                                  ? 'ডিঅ্যাক্টিভেট / সাসপেন্ড করুন'
                                  : 'সক্রিয় করুন'
                              }
                            >
                              {user.accountStatus === 'active' ? (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-lg text-[10px] font-mono">
                              Protected
                            </span>
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

        {/* Pagination Footer Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <span className="text-neutral-500 font-medium">
              পৃষ্ঠা {currentPage} / {totalPages} (মোট {queryResult.totalCount} জন ইউজার)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 disabled:opacity-40 rounded-xl font-bold transition-all cursor-pointer"
              >
                পূর্ববর্তী
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white font-black'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 disabled:opacity-40 rounded-xl font-bold transition-all cursor-pointer"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VIEW PROFILE MODAL */}
      {/* ========================================================================= */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto my-auto relative">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  {isBn ? 'সম্পূর্ণ ইউজার প্রোফাইল বিশদ (Super Admin Full Profile)' : 'Complete User Profile Details'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Hero Header Card */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white space-y-4 border border-indigo-500/30">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-lg">{selectedUser.fullName}</h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedUser.accountStatus === 'active'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {selectedUser.accountStatus}
                      </span>
                    </div>
                    <p className="text-sm font-mono font-black text-emerald-300 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Unique ID: <strong>{selectedUser.aponUniqueId || selectedUser.permanentMemberId || selectedUser.id}</strong></span>
                    </p>
                    <p className="text-xs text-indigo-200">
                      Role: <span className="font-bold text-amber-300">{UniqueIdService.getRoleTitle(selectedUser.primaryRole).en} ({UniqueIdService.getRoleTitle(selectedUser.primaryRole).bn})</span>
                    </p>
                    {selectedUser.businessType && (
                      <p className="text-xs text-amber-200">
                        Business Type: <span className="font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[11px]">{selectedUser.businessType}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEnterDashboard(selectedUser.id)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>ড্যাশবোর্ডে প্রবেশ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Information Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Section 1: Contact Details */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
                <h5 className="font-black text-indigo-600 dark:text-indigo-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>যোগাযোগ তথ্য</span>
                </h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">মোবাইল নম্বর:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.mobileNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">ইমেইল ঠিকানা:</span>
                    <span className="font-bold text-neutral-900 dark:text-white truncate max-w-[180px]">{selectedUser.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">জাতীয় পরিচয়পত্র (NID):</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.nationalId || 'প্রদান করা হয়নি'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">লিঙ্গ ও জন্মতারিখ:</span>
                    <span className="font-bold text-neutral-900 dark:text-white capitalize">{selectedUser.gender || 'male'} | {selectedUser.dateOfBirth || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Account & Security Stats */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
                <h5 className="font-black text-purple-600 dark:text-purple-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>নিরাপত্তা ও লগইন তথ্য</span>
                </h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">অ্যাকাউন্ট স্ট্যাটাস:</span>
                    <span className="font-bold text-emerald-600 uppercase">{selectedUser.accountStatus}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">KYC ভেরিফিকেশন:</span>
                    <span className="font-bold text-neutral-900 dark:text-white uppercase">{selectedUser.verificationStatus || 'unverified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">রেজিস্ট্রেশন তারিখ:</span>
                    <span className="font-mono text-neutral-900 dark:text-white">{selectedUser.createdAt ? selectedUser.createdAt.slice(0, 10) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">সর্বশেষ লগইন:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.lastLogin ? selectedUser.lastLogin.slice(0, 16) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Network & Referral Info */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
                <h5 className="font-black text-amber-600 dark:text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>নেটওয়ার্ক ও রেফারেল তথ্য</span>
                </h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">স্পন্সর / রেফারেল আইডি:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.sponsorId || selectedUser.referralId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">প্লেসমেন্ট আইডি:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.placementId || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">প্লেসমেন্ট লেগ (Hand):</span>
                    <span className="font-bold text-neutral-900 dark:text-white uppercase">{selectedUser.placementLeg || 'Left'} Leg</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Wallet & Role Specifics */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5">
                <h5 className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[11px] flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>ওয়ালেট ও রোল বিশেষ তথ্য</span>
                </h5>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                    <span className="text-neutral-500">টোকেন ব্যালেন্স:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {(selectedUser.tomokTokenBalance ?? 0).toLocaleString()} TOMOK
                    </span>
                  </div>
                  {selectedUser.shopName && (
                    <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                      <span className="text-neutral-500">দোকানের নাম:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{selectedUser.shopName}</span>
                    </div>
                  )}
                  {selectedUser.vehicleType && (
                    <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700/50">
                      <span className="text-neutral-500">যানবাহন:</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{selectedUser.vehicleType}</span>
                    </div>
                  )}
                  {selectedUser.vehicleRegNumber && (
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">গাড়ি রেজি. নম্বর:</span>
                      <span className="font-mono text-neutral-900 dark:text-white">{selectedUser.vehicleRegNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 5: Mandatory Service Address (Full Width) */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2.5 md:col-span-2">
                <h5 className="font-black text-rose-600 dark:text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>সেবা ও ডেলিভারি ঠিকানা (Mandatory Address)</span>
                </h5>
                <p className="font-bold text-neutral-900 dark:text-white text-xs leading-relaxed">
                  {selectedUser.mandatoryAddress?.fullServiceAddress ||
                    `${selectedUser.mandatoryAddress?.area || ''} ${selectedUser.mandatoryAddress?.unionName || ''}, ${selectedUser.mandatoryAddress?.upazila || ''}, ${selectedUser.mandatoryAddress?.district || 'ঢাকা'}, ${selectedUser.mandatoryAddress?.division || 'ঢাকা'} (পোস্টকোড: ${selectedUser.mandatoryAddress?.postalCode || '1209'})`}
                </p>
              </div>
            </div>

            {/* Modal Action Buttons Footer */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenEditModal(selectedUser);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>এডিট প্রোফাইল</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    handleOpenResetPasswordModal(selectedUser);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>পাসওয়ার্ড রিসেট</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl hover:bg-neutral-300"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT PROFILE MODAL */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto my-auto relative">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  {isBn ? 'ইউজার প্রোফাইল সংশোধন (Super Admin Profile Editor)' : 'Edit User Profile Information'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Read-Only Notice regarding ID Lock */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-300 text-xs font-bold flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                নিরাপত্তা নীতি: ইউজার আইডি (User ID) ও পারমানেন্ট মেম্বার আইডি ডাটাবেজ সুরক্ষায় অপরিবর্তনীয় (Read-Only)। অন্যান্য সকল প্রোফাইল ও ভূমিকা তথ্য পরিবর্তনযোগ্য।
              </span>
            </div>

            {/* Edit Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              {/* Permanent ID (Locked) */}
              <div className="space-y-1 sm:col-span-2 md:col-span-3">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                  <span>স্থায়ী ইউনিক আইডি (Apon Unique ID)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> আজীবন অপরিবর্তনীয় (Permanent)
                  </span>
                </label>
                <input
                  type="text"
                  value={selectedUser.aponUniqueId || selectedUser.permanentMemberId || selectedUser.id}
                  disabled
                  readOnly
                  className="w-full bg-neutral-200 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono font-black text-sm rounded-xl p-2.5 cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">পূর্ণ নাম (Full Name) *</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">মোবাইল নম্বর (Mobile) *</label>
                <input
                  type="text"
                  value={editMobileNumber}
                  onChange={(e) => setEditMobileNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">ইমেইল ঠিকানা (Email)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                />
              </div>

              {/* Primary Role Selector */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">প্রাথমিক পদবী (Primary Role)</label>
                <select
                  value={editPrimaryRole}
                  onChange={(e) => {
                    const newR = e.target.value as UserRole;
                    setEditPrimaryRole(newR);
                    if (!editRoles.includes(newR)) {
                      setEditRoles([...editRoles, newR]);
                    }
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                >
                  <option value="customer_networker">১. কাস্টমার ও নেটওয়ার্কার (Customer & Networker - AponCN)</option>
                  <option value="operations_officer">২. অপারেশন অফিসার (Operation Officer - AponOO)</option>
                  <option value="vendor_dealer_shop">৩. ভেন্ডর / ডিলার / শপ (Vendor / Dealer / Shop - AponVDS)</option>
                  <option value="rider">৪. রাইডার (Rider - AponR)</option>
                  <option value="admin">৫. এডমিন (Admin - AponA)</option>
                  <option value="super_admin">৬. সুপার এডমিন (Super Admin - AponSA)</option>
                  <option value="account_officer">৭. একাউন্ট অফিসার (Account Officer - AponAO)</option>
                  <option value="hr">৮. এইচআর (HR - AponHR)</option>
                  <option value="customer">কাস্টমার (Legacy Customer)</option>
                  <option value="network_member">নেটওয়ার্ক মেম্বার (Legacy Network)</option>
                  <option value="dealer">ডিলার (Legacy Dealer)</option>
                  <option value="vendor">ভেন্ডর (Legacy Vendor)</option>
                  <option value="operations_partner">অপারেশনস পার্টনার (Legacy Ops)</option>
                  <option value="delivery_rider">ডেলিভারি ম্যান (Legacy Rider)</option>
                </select>
              </div>

              {/* Business Type Selector for Vendor/Dealer/Shop */}
              {(editPrimaryRole === 'vendor_dealer_shop' ||
                editPrimaryRole === 'dealer' ||
                editPrimaryRole === 'vendor' ||
                selectedUser.aponUniqueId?.startsWith('AponVDS-')) && (
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block flex items-center justify-between">
                    <span>ব্যবসায়ের ধরন (Business Type)</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">ID অপরিবর্তিত থাকে</span>
                  </label>
                  <select
                    value={editBusinessType}
                    onChange={(e) => setEditBusinessType(e.target.value as BusinessType)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Dealer">Dealer (ডিলার)</option>
                    <option value="Vendor">Vendor (ভেন্ডর)</option>
                    <option value="Shop">Shop (শপ / দোকান)</option>
                  </select>
                  <p className="text-[10px] text-neutral-500">
                    ভেন্ডর/ডিলার/শপ পরিবর্তন করলেও স্থায়ী ইউনিক আইডি ({selectedUser.aponUniqueId || 'AponVDS-000001'}) অপরিবর্তিত থাকবে।
                  </p>
                </div>
              )}

              {/* Account Status */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">অ্যাকাউন্ট স্ট্যাটাস (Account Status)</label>
                <select
                  value={editAccountStatus}
                  onChange={(e) => setEditAccountStatus(e.target.value as AccountStatus)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                >
                  <option value="active">ACTIVE (সক্রিয়)</option>
                  <option value="suspended">SUSPENDED (সাসপেন্ডেড / ডিঅ্যাক্টিভ)</option>
                  <option value="pending">PENDING (অপেক্ষমান)</option>
                  <option value="banned">BANNED (ব্যান্ড / ব্লকড)</option>
                </select>
              </div>

              {/* KYC Verification Status */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">KYC ভেরিফিকেশন</label>
                <select
                  value={editVerificationStatus}
                  onChange={(e) => setEditVerificationStatus(e.target.value as KycStatus)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                >
                  <option value="unverified">যাচাই হয়নি (Unverified)</option>
                  <option value="pending">পেন্ডিং (Pending)</option>
                  <option value="verified">যাচাইকৃত (Verified)</option>
                  <option value="rejected">বাতিলকৃত (Rejected)</option>
                </select>
              </div>

              {/* Referral / Sponsor ID */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">স্পন্সর / রেফারেল আইডি</label>
                <input
                  type="text"
                  value={editSponsorId}
                  onChange={(e) => setEditSponsorId(e.target.value)}
                  placeholder="APON-SADMIN-001"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono font-bold rounded-xl p-2.5"
                />
              </div>

              {/* Placement ID */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">প্লেসমেন্ট আইডি (Placement ID)</label>
                <input
                  type="text"
                  value={editPlacementId}
                  onChange={(e) => setEditPlacementId(e.target.value)}
                  placeholder="TMK000001"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono font-bold rounded-xl p-2.5"
                />
              </div>

              {/* Placement Leg (Left / Right) */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">প্লেসমেন্ট লেগ (Leg Hand)</label>
                <select
                  value={editPlacementLeg}
                  onChange={(e) => setEditPlacementLeg(e.target.value as 'left' | 'right')}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                >
                  <option value="left">বাম হাত (Left Leg)</option>
                  <option value="right">ডান হাত (Right Leg)</option>
                </select>
              </div>

              {/* NID */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">এনআইডি নম্বর (National ID)</label>
                <input
                  type="text"
                  value={editNationalId}
                  onChange={(e) => setEditNationalId(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono rounded-xl p-2.5"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">জন্মতারিখ (Date of Birth)</label>
                <input
                  type="date"
                  value={editDateOfBirth}
                  onChange={(e) => setEditDateOfBirth(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-mono"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">লিঙ্গ (Gender)</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold rounded-xl p-2.5"
                >
                  <option value="male">পুরুষ (Male)</option>
                  <option value="female">মহিলা (Female)</option>
                  <option value="other">অন্যান্য (Other)</option>
                </select>
              </div>

              {/* Shop Name (Dealer/Vendor) */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">দোকানের নাম (Shop/Outlet Name)</label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  placeholder="যেমন: আপন বাজার আউটলেট"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5"
                />
              </div>

              {/* Vehicle Type (Rider) */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">যানবাহনের ধরন (Vehicle Type)</label>
                <input
                  type="text"
                  value={editVehicleType}
                  onChange={(e) => setEditVehicleType(e.target.value)}
                  placeholder="মোটরসাইকেল / সাইকেল / ভ্যান"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5"
                />
              </div>

              {/* Vehicle Reg (Rider) */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">গাড়ি রেজি. নম্বর (Vehicle Reg)</label>
                <input
                  type="text"
                  value={editVehicleRegNumber}
                  onChange={(e) => setEditVehicleRegNumber(e.target.value)}
                  placeholder="ঢাকা মেট্রো-হ-১২-৩৪৫৬"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-mono"
                />
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <h5 className="font-black text-rose-600 dark:text-rose-400 uppercase text-xs flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>বাধ্যতামূলক ঠিকানা তথ্য (Mandatory Service Address)</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">বিভাগ (Division)</label>
                  <input
                    type="text"
                    value={editDivision}
                    onChange={(e) => setEditDivision(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">জেলা (District)</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">উপজেলা / থানা (Upazila)</label>
                  <input
                    type="text"
                    value={editUpazila}
                    onChange={(e) => setEditUpazila(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">পোস্টকোড (Postal Code)</label>
                  <input
                    type="text"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">এলাকা / ইউনিয়ন / ওয়ার্ড</label>
                  <input
                    type="text"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    placeholder="হাজীপাড়া, কালীবাড়ী রোড"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">সম্পূর্ণ ঠিকানা (Full Service Address)</label>
                  <input
                    type="text"
                    value={editFullAddress}
                    onChange={(e) => setEditFullAddress(e.target.value)}
                    placeholder="বাড়ি নং, রোড নং, বিস্তারিত ঠিকানা"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl hover:bg-neutral-300"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={handleRequestSaveProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>সংরক্ষণ ও আপডেট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RESET PASSWORD MODAL */}
      {/* ========================================================================= */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto my-auto relative">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  {isBn ? 'ইউজার পাসওয়ার্ড রিসেট (Super Admin Password Reset)' : 'Super Admin Password Reset'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Info Header */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-600 dark:text-neutral-300">টার্গেট ইউজার:</span>
                <span className="font-black text-neutral-900 dark:text-white text-sm">{selectedUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">স্থায়ী আইডি:</span>
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{selectedUser.permanentMemberId || selectedUser.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">মোবাইল নম্বর:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">{selectedUser.mobileNumber}</span>
              </div>
            </div>

            {/* Security Notice: Plaintext Passwords Never Displayed */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-[11px] font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                নিরাপত্তা বিধি: পূর্ববর্তী পাসওয়ার্ড কখনোই প্লেইনটেক্সট হিসেবে দেখানো হয় না। আপনি সরাসরি নতুন পাসওয়ার্ড সেট করতে পারেন অথবা নিরাপদ অস্থায়ী পাসওয়ার্ড তৈরি করতে পারেন।
              </span>
            </div>

            {/* Password Input & Generator */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 dark:text-neutral-200">
                    নতুন পাসওয়ার্ড (New Password) *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateStrongPassword}
                    className="text-purple-600 dark:text-purple-400 font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>অস্থায়ী পাসওয়ার্ড জেনারেট করুন</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন..."
                    className="w-full pr-20 pl-3.5 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-mono font-bold rounded-xl text-sm focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyGeneratedPassword}
                        className="p-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 rounded-lg text-neutral-700 dark:text-neutral-200"
                        title="পাসওয়ার্ড কপি করুন"
                      >
                        {copiedPassword ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      title={showPasswordText ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {copiedPassword && (
                  <p className="text-[11px] text-emerald-600 font-bold">পাসওয়ার্ড ক্লিপবোর্ডে কপি করা হয়েছে!</p>
                )}
              </div>

              {/* Force Change Password on Next Login Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceChangeNextLogin}
                  onChange={(e) => setForceChangeNextLogin(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded mt-0.5"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-neutral-900 dark:text-white block">
                    পরবর্তী লগইনে পাসওয়ার্ড পরিবর্তন বাধ্যতামূলক করুন
                  </span>
                  <span className="text-[11px] text-neutral-500 block">
                    ইউজার এই অস্থায়ী পাসওয়ার্ড দিয়ে লগইন করার পর তাকে নতুন পাসওয়ার্ড সেট করতে বলা হবে।
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl hover:bg-neutral-300"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleRequestPasswordReset}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>পাসওয়ার্ড রিসেট নিশ্চিত করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESET ACCOUNT MODAL */}
      {/* ========================================================================= */}
      {showResetAccountModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto my-auto relative">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  {isBn ? 'অ্যাকাউন্ট প্যারামিটার রিসেট' : 'Reset Account State'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowResetAccountModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs space-y-1">
              <span className="font-bold text-neutral-600 dark:text-neutral-300">টার্গেট অ্যাকাউন্ট:</span>
              <p className="font-black text-neutral-900 dark:text-white text-sm">{selectedUser.fullName} ({selectedUser.permanentMemberId || selectedUser.id})</p>
            </div>

            {/* Reset Options Checkboxes */}
            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetStatusOption}
                  onChange={(e) => setResetStatusOption(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <span className="font-bold text-neutral-900 dark:text-white">অ্যাকাউন্ট স্ট্যাটাস 'ACTIVE' এ রিসেট করুন</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetWalletOption}
                  onChange={(e) => setResetWalletOption(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <span className="font-bold text-neutral-900 dark:text-white">টোকেন / পয়েন্ট ব্যালেন্স ০ তে রিসেট করুন</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetKycOption}
                  onChange={(e) => setResetKycOption(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded"
                />
                <span className="font-bold text-neutral-900 dark:text-white">KYC স্ট্যাটাস 'UNVERIFIED' এ রিসেট করুন</span>
              </label>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block">রিসেটের কারণ / নোট</label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  className="w-full p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-medium"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowResetAccountModal(false)}
                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl hover:bg-neutral-300"
              >
                বাতিল
              </button>

              <button
                type="button"
                onClick={handleRequestAccountReset}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>রিসেট কার্যকর করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. UNIVERSAL CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {confirmationDialog.isOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmationDialog.variant === 'danger'
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                    : confirmationDialog.variant === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-neutral-900 dark:text-white">
                {confirmationDialog.title}
              </h4>
            </div>

            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
              {confirmationDialog.message}
            </p>

            <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs text-neutral-500 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>এই পরিবর্তনটি সুপার এডমিন সিকিউরিটি অডিট লগে স্থায়ীভাবে রেকর্ড হবে।</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmationDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                {confirmationDialog.cancelButtonText || 'বাতিল'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const onConfirm = confirmationDialog.onConfirm;
                  setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
                  onConfirm();
                }}
                className={`px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
                  confirmationDialog.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : confirmationDialog.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {confirmationDialog.confirmButtonText || 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
