/**
 * High-Security Super Admin Master Control Center
 * Project: Apon Bazar
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  UserProfile,
  UserRole,
  AccountStatus,
  ProductCategory,
  Brand,
  ServiceAddress,
  FIXED_SUPER_ADMIN_ID
} from '../../types';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import { BDAddressPicker } from '../common/BDAddressPicker';
import { SuperAdminActiveUserManager } from './SuperAdminActiveUserManager';
import { SuperAdminRoleDropdown } from './SuperAdminRoleDropdown';
import {
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Edit2,
  Lock,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Store,
  Truck,
  Shield,
  Tag,
  Package,
  Activity,
  MapPin,
  Phone,
  Mail,
  Eye,
  RefreshCw,
  FileText,
  Building,
  Check,
  X,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { ProductPricingPaymentManagement } from './ProductPricingPaymentManagement';

type ControlTab = 'categories' | 'brands' | 'pricing_payment' | 'dealers' | 'admins' | 'members' | 'delivery_men';

export const SuperAdminControlCenter: React.FC = () => {
  const {
    currentUser,
    allUsers,
    auditLogs,
    updateUserByAdmin,
    updateUserStatusByAdmin,
    addDeliveryRiderByAdmin
  } = useAuth();

  const {
    categories,
    brands,
    products,
    orders,
    addCategory,
    editCategory,
    deleteCategory,
    addBrand,
    editBrand,
    deleteBrand
  } = useECommerce();

  const { t, language } = useLanguage();
  const isBn = language === 'bn';

  // Active Tab
  const [activeTab, setActiveTab] = useState<ControlTab>('categories');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameBn, setCatNameBn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catStatus, setCatStatus] = useState<'active' | 'inactive'>('active');

  // Brand Modal State
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandCategoryId, setBrandCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandProductName, setBrandProductName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandDesc, setBrandDesc] = useState('');
  const [brandStatus, setBrandStatus] = useState<'active' | 'inactive'>('active');
  const [brandCategoryFilter, setBrandCategoryFilter] = useState<string>('all');

  // User Edit Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editShopName, setEditShopName] = useState('');
  const [editVehicleType, setEditVehicleType] = useState('');
  const [editVehicleReg, setEditVehicleReg] = useState('');
  const [editDrivingLicense, setEditDrivingLicense] = useState('');
  const [editUserRoles, setEditUserRoles] = useState<UserRole[]>([]);
  const [editAddressData, setEditAddressData] = useState<Partial<ServiceAddress>>({});
  const [isAddressValid, setIsAddressValid] = useState(true);

  // Add Delivery Rider Modal State
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [riderName, setRiderName] = useState('');
  const [riderMobile, setRiderMobile] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [riderVehicleType, setRiderVehicleType] = useState('মোটরসাইকেল (125cc)');
  const [riderVehicleReg, setRiderVehicleReg] = useState('');
  const [riderLicense, setRiderLicense] = useState('');
  const [riderAddress, setRiderAddress] = useState<Partial<ServiceAddress>>({
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    unionName: 'মিরপুর ১০'
  });

  // Action Confirm Dialog
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionType: 'status_change' | 'delete_cat' | 'delete_brand';
    targetId: string;
    payload?: any;
  }>({
    show: false,
    title: '',
    message: '',
    actionType: 'status_change',
    targetId: ''
  });

  // View User Detail Modal
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);

  // Toast / Feedback message
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const triggerFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper Stats
  const stats = useMemo(() => {
    const dealers = allUsers.filter((u) => u?.roles?.includes('dealer') || u?.roles?.includes('vendor'));
    const admins = allUsers.filter((u) => u?.roles?.includes('admin') || u?.roles?.includes('super_admin'));
    const riders = allUsers.filter((u) => u?.roles?.includes('delivery_rider'));
    const members = allUsers.filter((u) => u?.roles?.includes('network_member') || u?.roles?.includes('customer'));

    return {
      categoriesCount: categories.length,
      brandsCount: brands.length,
      dealersCount: dealers.length,
      adminsCount: admins.length,
      ridersCount: riders.length,
      membersCount: members.length,
      totalUsersCount: allUsers.length
    };
  }, [categories, brands, allUsers]);

  // Categories Handlers
  const handleOpenCategoryModal = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setCatNameEn(cat.name);
      setCatNameBn(cat.nameBn);
      setCatSlug(cat.slug);
      setCatIcon(cat.icon || '');
      setCatImage(cat.image || '');
      setCatStatus(cat.status || 'active');
    } else {
      setEditingCategory(null);
      setCatNameEn('');
      setCatNameBn('');
      setCatSlug('');
      setCatIcon('Package');
      setCatImage('');
      setCatStatus('active');
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameBn.trim() || !catNameEn.trim()) {
      triggerFeedback('error', 'ক্যাটাগরির বাংলা ও ইংরেজি নাম আবশ্যক!');
      return;
    }

    const slug = catSlug.trim() || catNameEn.toLowerCase().replace(/\s+/g, '-');

    if (editingCategory) {
      editCategory(editingCategory.id, {
        name: catNameEn.trim(),
        nameBn: catNameBn.trim(),
        slug,
        icon: catIcon || 'Package',
        image: catImage || undefined,
        status: catStatus
      });
      triggerFeedback('success', 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে!');
    } else {
      addCategory({
        name: catNameEn.trim(),
        nameBn: catNameBn.trim(),
        slug,
        icon: catIcon || 'Package',
        image: catImage || undefined,
        status: catStatus,
        subCategories: []
      });
      triggerFeedback('success', 'নতুন ক্যাটাগরি তৈরি হয়েছে!');
    }
    setShowCategoryModal(false);
  };

  // Dynamic active brands calculation for selected category
  const availableBrandsForSelectedCategory = useMemo(() => {
    if (!brandCategoryId) return [];

    // Filter active brands related to selected category
    const categoryBrands = brands.filter((b) => {
      if (b.status === 'inactive') return false;
      if (b.categoryId === brandCategoryId) return true;
      if (b.categoryIds && b.categoryIds.includes(brandCategoryId)) return true;
      return false;
    });

    const brandMap = new Map<string, { id: string; name: string; logoUrl?: string; description?: string }>();

    categoryBrands.forEach((b) => {
      const key = b.name.trim().toLowerCase();
      if (!brandMap.has(key)) {
        brandMap.set(key, {
          id: b.brandId || b.id,
          name: b.name.trim(),
          logoUrl: b.logoUrl,
          description: b.description
        });
      }
    });

    // Fallback: If no category-specific brand configured yet, list all active distinct brands
    if (brandMap.size === 0) {
      brands.filter((b) => b.status !== 'inactive').forEach((b) => {
        const key = b.name.trim().toLowerCase();
        if (!brandMap.has(key)) {
          brandMap.set(key, {
            id: b.brandId || b.id,
            name: b.name.trim(),
            logoUrl: b.logoUrl,
            description: b.description
          });
        }
      });
    }

    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, brandCategoryId]);

  // Brand Handlers
  const handleOpenBrandModal = (b?: Brand) => {
    if (b) {
      setEditingBrand(b);
      const catId = b.categoryId || (b.categoryIds && b.categoryIds[0]) || categories[0]?.id || '';
      setBrandCategoryId(catId);
      setBrandId(b.brandId || b.id);
      setBrandName(b.name);
      setBrandProductName(b.productName || '');
      setBrandLogo(b.logoUrl || '');
      setBrandDesc(b.description || '');
      setBrandStatus(b.status || 'active');
    } else {
      setEditingBrand(null);
      setBrandCategoryId('');
      setBrandId('');
      setBrandName('');
      setBrandProductName('');
      setBrandLogo('');
      setBrandDesc('');
      setBrandStatus('active');
    }
    setShowBrandModal(true);
  };

  const handleCategoryChange = (newCatId: string) => {
    setBrandCategoryId(newCatId);
    setBrandName('');
    setBrandId('');
  };

  const handleBrandSelect = (selectedName: string) => {
    setBrandName(selectedName);
    const found = availableBrandsForSelectedCategory.find(
      (b) => b.name.toLowerCase() === selectedName.toLowerCase()
    ) || brands.find((b) => b.name.toLowerCase() === selectedName.toLowerCase());

    if (found) {
      setBrandId(found.id);
      if (!brandLogo && found.logoUrl) {
        setBrandLogo(found.logoUrl);
      }
      if (!brandDesc && found.description) {
        setBrandDesc(found.description);
      }
    } else {
      setBrandId(`brand-${Date.now()}`);
    }
  };

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandCategoryId) {
      triggerFeedback('error', 'অনুগ্রহ করে Product Category নির্বাচন করুন!');
      return;
    }
    if (!brandName.trim()) {
      triggerFeedback('error', 'অনুগ্রহ করে Brand Name নির্বাচন করুন!');
      return;
    }
    if (!brandProductName.trim()) {
      triggerFeedback('error', 'অনুগ্রহ করে Product Name প্রদান করুন!');
      return;
    }

    const selectedCat = categories.find((c) => c.id === brandCategoryId);
    const catName = selectedCat?.name || '';
    const catNameBn = selectedCat?.nameBn || '';

    if (editingBrand) {
      editBrand(editingBrand.id, {
        name: brandName.trim(),
        brandId: brandId || editingBrand.brandId || editingBrand.id,
        productName: brandProductName.trim(),
        logoUrl: brandLogo.trim() || undefined,
        description: brandDesc.trim() || undefined,
        status: brandStatus,
        categoryId: brandCategoryId,
        categoryName: catName,
        categoryNameBn: catNameBn,
        categoryIds: [brandCategoryId],
        subCategories: editingBrand.subCategories || selectedCat?.subCategories || []
      });
      triggerFeedback('success', 'পণ্য ও ব্র্যান্ড তথ্য সফলভাবে আপডেট করা হয়েছে!');
    } else {
      const res = addBrand({
        name: brandName.trim(),
        brandId: brandId || `brand-${Date.now()}`,
        productName: brandProductName.trim(),
        brandType: 'National/Established Brand',
        logoUrl: brandLogo.trim() || undefined,
        description: brandDesc.trim() || undefined,
        status: brandStatus,
        categoryId: brandCategoryId,
        categoryName: catName,
        categoryNameBn: catNameBn,
        categoryIds: [brandCategoryId],
        subCategories: selectedCat?.subCategories || []
      });
      if (res && !res.success) {
        triggerFeedback('error', res.message);
        return;
      }
      triggerFeedback('success', 'নতুন পণ্য ব্র্যান্ড সফলভাবে সংরক্ষণ করা হয়েছে!');
    }
    setShowBrandModal(false);
  };

  // User Edit Modal Handlers
  const handleOpenUserModal = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditMobile(user.mobileNumber);
    setEditEmail(user.email || '');
    setEditShopName(user.shopName || '');
    setEditVehicleType(user.vehicleType || '');
    setEditVehicleReg(user.vehicleRegNumber || '');
    setEditDrivingLicense(user.drivingLicenseNumber || '');
    setEditUserRoles([...(user?.roles || [])]);
    setEditAddressData(user.mandatoryAddress || {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      unionName: 'মিরপুর ১০'
    });
    setShowUserModal(true);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editFullName.trim() || !editMobile.trim()) {
      triggerFeedback('error', 'ইউজারের নাম ও মোবাইল নম্বর পূরণ করুন!');
      return;
    }

    const res = updateUserByAdmin(
      editingUser.id,
      {
        fullName: editFullName.trim(),
        mobileNumber: editMobile.trim(),
        email: editEmail.trim(),
        shopName: editShopName.trim() || undefined,
        vehicleType: editVehicleType.trim() || undefined,
        vehicleRegNumber: editVehicleReg.trim() || undefined,
        drivingLicenseNumber: editDrivingLicense.trim() || undefined,
        roles: editUserRoles,
        primaryRole: editUserRoles[0] || editingUser.primaryRole
      },
      editAddressData
    );

    if (res.success) {
      triggerFeedback('success', res.message);
      setShowUserModal(false);
    } else {
      triggerFeedback('error', res.message);
    }
  };

  // Delivery Man Creation Handler
  const handleCreateRider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderName.trim() || !riderMobile.trim()) {
      triggerFeedback('error', 'ডেলিভারি ম্যানের নাম ও মোবাইল নম্বর প্রদান আবশ্যক!');
      return;
    }

    const res = addDeliveryRiderByAdmin({
      fullName: riderName.trim(),
      mobileNumber: riderMobile.trim(),
      email: riderEmail.trim() || undefined,
      division: riderAddress.division || 'ঢাকা',
      district: riderAddress.district || 'ঢাকা',
      upazila: riderAddress.upazila || 'মিরপুর',
      unionName: riderAddress.unionName || 'মিরপুর ১০',
      ward: riderAddress.ward || '',
      area: riderAddress.area || '',
      postalCode: riderAddress.postalCode || '1216',
      vehicleType: riderVehicleType,
      vehicleRegNumber: riderVehicleReg,
      drivingLicenseNumber: riderLicense,
      latitude: riderAddress.latitude,
      longitude: riderAddress.longitude
    });

    if (res.success) {
      triggerFeedback('success', res.message);
      setShowAddRiderModal(false);
      setRiderName('');
      setRiderMobile('');
      setRiderEmail('');
      setRiderVehicleReg('');
      setRiderLicense('');
    } else {
      triggerFeedback('error', res.message);
    }
  };

  // Status Change Confirmation Trigger
  const handlePromptStatusChange = (user: UserProfile, targetStatus: AccountStatus) => {
    setConfirmModal({
      show: true,
      title: `${user.fullName} (${user.permanentMemberId || user.id}) - স্ট্যাটাস পরিবর্তন`,
      message: `আপনি কি নিশ্চিতভাবে এই অ্যাকাউন্টের স্ট্যাটাস '${user.accountStatus}' থেকে '${targetStatus}' এ পরিবর্তন করতে চান?`,
      actionType: 'status_change',
      targetId: user.id,
      payload: targetStatus
    });
  };

  const handleConfirmAction = () => {
    if (confirmModal.actionType === 'status_change') {
      const res = updateUserStatusByAdmin(
        confirmModal.targetId,
        confirmModal.payload as AccountStatus,
        'Super Admin manual status toggle'
      );
      if (res.success) {
        triggerFeedback('success', res.message);
      } else {
        triggerFeedback('error', res.message);
      }
    } else if (confirmModal.actionType === 'delete_cat') {
      deleteCategory(confirmModal.targetId);
    } else if (confirmModal.actionType === 'delete_brand') {
      deleteBrand(confirmModal.targetId);
    }
    setConfirmModal({ show: false, title: '', message: '', actionType: 'status_change', targetId: '' });
  };

  // Filtering Logic for Users & Lists
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      // Tab based Role Filtering
      if (activeTab === 'dealers') {
        if (!u?.roles?.includes('dealer') && !u?.roles?.includes('vendor')) return false;
      } else if (activeTab === 'admins') {
        if (!u?.roles?.includes('admin') && !u?.roles?.includes('super_admin')) return false;
      } else if (activeTab === 'delivery_men') {
        if (!u?.roles?.includes('delivery_rider')) return false;
      }

      // Role Filter dropdown
      if (roleFilter !== 'all' && !u?.roles?.includes(roleFilter as UserRole)) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && u.accountStatus !== statusFilter) {
        return false;
      }

      // Division Filter
      if (
        divisionFilter !== 'all' &&
        u.mandatoryAddress?.division !== divisionFilter
      ) {
        return false;
      }

      // Search Term (ID, Name, Mobile, Email, Location)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId =
          (u?.id || '').toLowerCase().includes(query) ||
          (u?.permanentMemberId && u.permanentMemberId.toLowerCase().includes(query));
        const matchesName = (u?.fullName || '').toLowerCase().includes(query);
        const matchesMobile = (u?.mobileNumber || '').includes(query);
        const matchesEmail = u?.email && u.email.toLowerCase().includes(query);
        const matchesShop = u?.shopName && u.shopName.toLowerCase().includes(query);
        const matchesLoc =
          u?.mandatoryAddress &&
          `${u.mandatoryAddress.division || ''} ${u.mandatoryAddress.district || ''} ${u.mandatoryAddress.upazila || ''} ${u.mandatoryAddress.unionName || ''} ${u.mandatoryAddress.area || ''}`
            .toLowerCase()
            .includes(query);

        return Boolean(matchesId || matchesName || matchesMobile || matchesEmail || matchesShop || matchesLoc);
      }

      return true;
    });
  }, [allUsers, activeTab, roleFilter, statusFilter, divisionFilter, searchTerm]);

  // Paginated Data
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-xl shadow-lg border flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Control Center Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-emerald-950 border border-emerald-800/60 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Authorization
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">RBAC Matrix Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              সুপার এডমিন মাস্টার কন্ট্রোল সেন্টার (Master Control Center)
            </h1>
            <p className="text-xs text-neutral-300">
              ক্যাটাগরি, ব্র্যান্ড, ডিলার, এডমিন, ডেলিভারি ম্যান, স্থায়ী মেম্বার আইডি এবং সিকিউর সিস্টেম ম্যানেজমেন্ট
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <SuperAdminRoleDropdown />
            <div className="bg-black/40 border border-neutral-800 p-3 rounded-xl text-right">
              <span className="text-[10px] text-neutral-400 block font-semibold">লগইন ব্যবহারকারী</span>
              <span className="text-xs font-bold text-emerald-400">{currentUser?.fullName}</span>
              <span className="text-[10px] text-neutral-400 font-mono block">
                ID: {currentUser?.permanentMemberId || currentUser?.id}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-5 border-t border-neutral-800 text-xs">
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">ক্যাটাগরি</span>
            <span className="text-lg font-bold text-emerald-400">{stats.categoriesCount} টি</span>
          </div>
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">ব্র্যান্ডসমূহ</span>
            <span className="text-lg font-bold text-emerald-400">{stats.brandsCount} টি</span>
          </div>
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">ডিলার/শপ</span>
            <span className="text-lg font-bold text-amber-400">{stats.dealersCount} জন</span>
          </div>
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">এডমিন প্যানেল</span>
            <span className="text-lg font-bold text-purple-400">{stats.adminsCount} জন</span>
          </div>
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">ডেলিভারি ম্যান</span>
            <span className="text-lg font-bold text-blue-400">{stats.ridersCount} জন</span>
          </div>
          <div className="bg-neutral-800/50 p-2.5 rounded-xl border border-neutral-700/60">
            <span className="text-neutral-400 text-[10px] block font-medium">মোট রেজিস্টার্ড আইডি</span>
            <span className="text-lg font-bold text-white font-mono">{stats.totalUsersCount}</span>
          </div>
        </div>
      </div>

      {/* Primary Management Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-neutral-800 text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setActiveTab('categories');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>১. প্রোডাক্ট ক্যাটাগরি ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('brands');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brands'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Package className="w-4 h-4 text-emerald-300" />
          <span>২. প্রোডাক্ট ব্র্যান্ড ({brands.length})</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-control-pricing"
          onClick={() => {
            setActiveTab('pricing_payment');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'pricing_payment'
              ? 'bg-emerald-600 text-white shadow-md font-bold'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>৩. প্রোডাক্ট প্রাইসিং ও পেমেন্ট ম্যানেজমেন্ট</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('dealers');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dealers'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Store className="w-4 h-4 text-amber-300" />
          <span>৪. ডিলার ও শপ হোল্ডার ({stats.dealersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('admins');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'admins'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-300" />
          <span>৫. এডমিন ও পারমিশন রোলস ({stats.adminsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('members');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Users className="w-4 h-4 text-blue-300" />
          <span>৫. নেটওয়ার্ক মেম্বার ও অল স্থায়ী আইডি ({stats.totalUsersCount})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('delivery_men');
            setCurrentPage(1);
          }}
          className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'delivery_men'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          <Truck className="w-4 h-4 text-amber-200" />
          <span>৬. ডেলিভারি ম্যান প্যানেল ({stats.ridersCount})</span>
        </button>
      </div>

      {/* Global Filter Bar for User/Member Tabs */}
      {(activeTab === 'dealers' ||
        activeTab === 'admins' ||
        activeTab === 'delivery_men') && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                placeholder="আইডি, নাম, মোবাইল, ইমেইল বা এরিয়া নাম দিয়ে সার্চ করুন..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
              >
                <option value="all">সকল অ্যাকাউন্ট স্ট্যাটাস (Status: All)</option>
                <option value="active">সক্রিয় (Active)</option>
                <option value="pending">পেন্ডিং (Pending Verification)</option>
                <option value="suspended">সাসপেন্ডেড (Suspended)</option>
                <option value="banned">ব্যানড / নিষ্ক্রিয় (Banned/Inactive)</option>
              </select>
            </div>

            {/* Division Filter */}
            <div>
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
              >
                <option value="all">সকল বিভাগ (Location: All Divisions)</option>
                <option value="ঢাকা">ঢাকা বিভাগ</option>
                <option value="চট্টগ্রাম">চট্টগ্রাম বিভাগ</option>
                <option value="রাজশাহী">রাজশাহী বিভাগ</option>
                <option value="খুলনা">খুলনা বিভাগ</option>
                <option value="বরিশাল">বরিশাল বিভাগ</option>
                <option value="সিলেট">সিলেট বিভাগ</option>
                <option value="রংপুর">রংপুর বিভাগ</option>
                <option value="ময়মনসিংহ">ময়মনসিংহ বিভাগ</option>
              </select>
            </div>
          </div>

          {/* Action Header bar for Module 6 */}
          {activeTab === 'delivery_men' && (
            <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAddRiderModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ডেলিভারি ম্যান নিবন্ধন করুন</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODULE 1: PRODUCT CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                পণ্য ক্যাটাগরি ব্যবস্থাপনা (Product Categories)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                শুধুমাত্র সুপার এডমিন নতুন ক্যাটাগরি তৈরি, এডিট এবং লিংক না থাকলে ডিলিট/Deactivate করতে পারবেন
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCategoryModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const linkedCount = products.filter(
                (p) => p.category === cat.name || p.category === cat.nameBn
              ).length;
              const isCatActive = cat.status !== 'inactive';

              return (
                <div
                  key={cat.id}
                  className="p-4 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                            {cat.nameBn}
                          </h3>
                          <span className="text-[11px] text-neutral-500 font-mono block">
                            {cat.name} ({cat.slug})
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCatActive
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isCatActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                      <span>সংযুক্ত পণ্য: <strong className="text-neutral-900 dark:text-white font-bold">{linkedCount} টি</strong></span>
                      <span className="text-[10px] text-neutral-400">ID: {cat.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(cat)}
                      className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> এডিট
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        editCategory(cat.id, { status: isCatActive ? 'inactive' : 'active' });
                        triggerFeedback('success', `ক্যাটাগরি '${cat.nameBn}' ${isCatActive ? 'Deactivated' : 'Activated'} হয়েছে!`);
                      }}
                      className={`px-3 py-1.5 font-semibold rounded-lg transition-colors text-[11px] ${
                        isCatActive
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                      }`}
                    >
                      {isCatActive ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          show: true,
                          title: `ক্যাটাগরি '${cat.nameBn}' মুছে ফেলার পূর্ব সতর্কতা`,
                          message: `আপনি কি নিশ্চিতভাবে এই ক্যাটাগরি মুছে ফেলতে চান? পণ্য লিংকড থাকলে সিস্টেম ডিলিট ব্লক করবে।`,
                          actionType: 'delete_cat',
                          targetId: cat.id
                        });
                      }}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-lg transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULE 2: PRODUCT BRANDS */}
      {activeTab === 'brands' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                পণ্য ব্র্যান্ড ব্যবস্থাপনা (Product Brands)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Product Category অনুযায়ী নতুন ব্র্যান্ড সংযোজন, ব্র্যান্ডের লোগো আপডেট এবং ডেডিকেটেড স্ট্যাটাস কন্ট্রোল
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={brandCategoryFilter}
                onChange={(e) => setBrandCategoryFilter(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs rounded-lg px-2.5 py-2 text-neutral-800 dark:text-neutral-200 font-medium"
              >
                <option value="all">সব ক্যাটাগরি ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameBn} ({c.name})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleOpenBrandModal()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ব্র্যান্ড যোগ করুন</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands
              .filter((brand) => {
                if (brandCategoryFilter === 'all') return true;
                return (
                  brand.categoryId === brandCategoryFilter ||
                  (brand.categoryIds && brand.categoryIds.includes(brandCategoryFilter))
                );
              })
              .map((brand) => {
                const linkedCount = products.filter((p) => p.brandName === brand.name || p.brandId === brand.id).length;
                const isBrandActive = brand.status !== 'inactive';
                const brandCat = categories.find(
                  (c) => c.id === brand.categoryId || (brand.categoryIds && brand.categoryIds.includes(c.id))
                );
                const catDisplayName = brandCat
                  ? `${brandCat.nameBn}${brandCat.name ? ` (${brandCat.name})` : ''}`
                  : (brand.categoryName || brand.categoryNameBn);

                return (
                  <div
                    key={brand.id}
                    className="p-4 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-neutral-700 dark:text-neutral-200 overflow-hidden shrink-0">
                            {brand.logoUrl ? (
                              <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="w-10 h-10 object-cover"
                              />
                            ) : (
                              brand.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {brand.name}
                              </h3>
                              {brand.productName && (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded">
                                  পণ্য: {brand.productName}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 line-clamp-1">
                              {brand.description || (brand.productName ? `${brand.name} - ${brand.productName}` : 'অফিসিয়াল সার্টিফাইড ব্র্যান্ড')}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isBrandActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {isBrandActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Product Category Relationship Badge */}
                      {catDisplayName && (
                        <div className="text-[11px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 font-medium flex items-center gap-1.5 w-fit">
                          <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">ক্যাটাগরি: {catDisplayName}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
                        <span>সংযুক্ত পণ্য: <strong className="text-neutral-900 dark:text-white font-bold">{linkedCount} টি</strong></span>
                        <span className="text-[10px] text-neutral-400">ID: {brand.id}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenBrandModal(brand)}
                        className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> এডিট
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          editBrand(brand.id, { status: isBrandActive ? 'inactive' : 'active' });
                          triggerFeedback('success', `ব্র্যান্ড '${brand.name}' ${isBrandActive ? 'Deactivated' : 'Activated'} হয়েছে!`);
                        }}
                        className={`px-3 py-1.5 font-semibold rounded-lg transition-colors text-[11px] ${
                          isBrandActive
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {isBrandActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConfirmModal({
                            show: true,
                            title: `ব্র্যান্ড '${brand.name}' মুছে ফেলার সতর্কতা`,
                            message: `আপনি কি নিশ্চিতভাবে এই ব্র্যান্ড সরাতে চান? লিঙ্কড প্রোডাক্ট থাকলে সিস্টেম সরাতে দিবে না।`,
                            actionType: 'delete_brand',
                            targetId: brand.id
                          });
                        }}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-lg transition-colors"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODULE 3: PRODUCT PRICING & PAYMENT GATEWAY MANAGEMENT */}
      {activeTab === 'pricing_payment' && <ProductPricingPaymentManagement />}

      {/* MODULE 5: ACTIVE USERS DIRECTORY & STRICT VISIBILITY (SUPER ADMIN ONLY) */}
      {activeTab === 'members' && <SuperAdminActiveUserManager />}

      {/* MODULE 3, 4, 6: USERS / DEALERS / ADMINS / DELIVERY MEN TABLE */}
      {(activeTab === 'dealers' ||
        activeTab === 'admins' ||
        activeTab === 'delivery_men') && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                {activeTab === 'dealers' && <Store className="w-5 h-5 text-amber-500" />}
                {activeTab === 'admins' && <Shield className="w-5 h-5 text-purple-500" />}
                {activeTab === 'delivery_men' && <Truck className="w-5 h-5 text-emerald-500" />}
                <span>
                  {activeTab === 'dealers' && 'ডিলার ও শপ হোল্ডার মাস্টার লিস্ট'}
                  {activeTab === 'admins' && 'এডমিন ও প্রশাসনিক রোলস প্যানেল'}
                  {activeTab === 'delivery_men' && 'ডেলিভারি ম্যান ও লজিস্টিকস রাইডারস'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500">
                স্থায়ী মেম্বার আইডি অপরিবর্তনীয় ও সুরক্ষিত। শুধুমাত্র প্রোফাইল ও সার্ভিস এড্রেস এডিট করা যাবে।
              </p>
            </div>

            <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg font-mono">
              মোট ফলাফল: {filteredUsers.length} জন
            </span>
          </div>

          {/* Protected Warning Pill */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>ডাটা ইন্টিগ্রিটি প্রটেকশন:</strong> Sponsor ID, Placement ID, Mentor/Leader, Binary Tree অবস্থান এবং পূর্ববর্তী সকল আর্থিক ও অর্ডার লেনদেন সুরক্ষিত রাখা হয়েছে।
            </span>
          </div>

          {/* Main User Records Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
              <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-lg">স্থায়ী আইডি (ID)</th>
                  <th className="p-3">নাম ও পেশা/রোল</th>
                  <th className="p-3">যোগাযোগ (Mobile/Email)</th>
                  <th className="p-3">সার্ভিস এড্রেস / ঠিকানা</th>
                  {activeTab === 'dealers' && <th className="p-3">দোকান/আউটলেট</th>}
                  {activeTab === 'delivery_men' && <th className="p-3">যানবাহন ও লাইসেন্স</th>}
                  <th className="p-3">অ্যাকাউন্ট স্ট্যাটাস</th>
                  <th className="p-3 text-right rounded-r-lg">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400">
                      কোনো ফলাফল পাওয়া যায়নি! ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSelfSuperAdmin = isImmutableSuperAdmin(u);

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                      >
                        {/* ID Column */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900 dark:text-white">
                            <span title="Permanent ID Locked"><Lock className="w-3.5 h-3.5 text-amber-500" /></span>
                            <span>{u.permanentMemberId || u.id}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 block font-mono">
                            System ID: {u.id}
                          </span>
                        </td>

                        {/* Name & Role */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={u.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                              alt={u.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
                            />
                            <div>
                              <span className="font-bold text-neutral-900 dark:text-white block">
                                {u.fullName}
                              </span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                                  {u.primaryRole}
                                </span>
                                {u.isNetworkActive && (
                                  <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1 py-0.2 rounded">
                                    Network Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-neutral-900 dark:text-white font-mono font-semibold">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              <span>{u.mobileNumber}</span>
                            </div>
                            {u.email && (
                              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                                <Mail className="w-3 h-3 text-neutral-400" />
                                <span className="line-clamp-1">{u.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Address */}
                        <td className="p-3 max-w-xs">
                          {u.mandatoryAddress ? (
                            <div className="text-[11px]">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200">
                                {u.mandatoryAddress.division}, {u.mandatoryAddress.district}
                              </span>
                              <p className="text-neutral-500 line-clamp-1">
                                {u.mandatoryAddress.upazila}, {u.mandatoryAddress.unionName} {u.mandatoryAddress.area && `(${u.mandatoryAddress.area})`}
                              </p>
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-[11px]">ঠিকানা সংকলন করা হয়নি</span>
                          )}
                        </td>

                        {/* Shop / Dealer specific */}
                        {activeTab === 'dealers' && (
                          <td className="p-3">
                            <span className="font-bold text-neutral-900 dark:text-white block">
                              {u.shopName || 'Apon Bazar প্রাইম শপ'}
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              {u.mandatoryAddress?.marketBazar || u.mandatoryAddress?.marketName || 'মিরপুর ১০ আউটলেট'}
                            </span>
                          </td>
                        )}

                        {/* Delivery Man specific */}
                        {activeTab === 'delivery_men' && (
                          <td className="p-3">
                            <span className="font-semibold text-neutral-900 dark:text-white block">
                              {u.vehicleType || 'মোটরসাইকেল (125cc)'}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-500">
                              Reg: {u.vehicleRegNumber || 'DHK-METRO-LA-4412'}
                            </span>
                          </td>
                        )}

                        {/* Status */}
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.accountStatus === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : u.accountStatus === 'suspended'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {u.accountStatus === 'active' && <CheckCircle className="w-3 h-3" />}
                            {u.accountStatus === 'suspended' && <XCircle className="w-3 h-3" />}
                            {u.accountStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingUser(u)}
                              className="p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors"
                              title="View Full Profile Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenUserModal(u)}
                              className="p-1.5 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-lg transition-colors"
                              title="Edit Permitted Profile Info"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {!isSelfSuperAdmin && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePromptStatusChange(
                                    u,
                                    u.accountStatus === 'active' ? 'suspended' : 'active'
                                  )
                                }
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                                  u.accountStatus === 'active'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                }`}
                              >
                                {u.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <span className="text-neutral-500">
                পৃষ্ঠা {currentPage} এর {totalPages} (মোট {filteredUsers.length} জন রেকর্ড)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 disabled:opacity-50 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  পূর্ববর্তী (Prev)
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 disabled:opacity-50 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  পরবর্তী (Next)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY ADD/EDIT MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                {editingCategory ? 'ক্যাটাগরি এডিট করুন' : 'নতুন প্রোডাক্ট ক্যাটাগরি তৈরি'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  ক্যাটাগরির নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  value={catNameBn}
                  onChange={(e) => setCatNameBn(e.target.value)}
                  placeholder="যেমন: প্রাকৃতিক অর্গানিক মধু"
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  value={catNameEn}
                  onChange={(e) => setCatNameEn(e.target.value)}
                  placeholder="e.g. Natural Organic Honey"
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="natural-organic-honey"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  ইমেজ / ফটো ইউআরএল (Image URL)
                </label>
                <input
                  type="text"
                  value={catImage}
                  onChange={(e) => setCatImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  ক্যাটাগরি স্ট্যাটাস
                </label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                >
                  <option value="active">Active (সক্রিয়)</option>
                  <option value="inactive">Inactive (নিষ্ক্রিয়)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRAND ADD/EDIT MODAL */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                {editingBrand ? 'ব্র্যান্ড এডিট করুন' : 'নতুন পণ্য ব্র্যান্ড যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="space-y-3.5 text-xs">
              {/* 1. Product Category * */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Product Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={brandCategoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="" disabled>Select Product Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameBn} ({cat.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Brand Name * */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={brandName}
                  onChange={(e) => handleBrandSelect(e.target.value)}
                  disabled={!brandCategoryId}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" disabled>
                    {brandCategoryId ? 'Select Brand Name' : 'প্রথমে Product Category নির্বাচন করুন'}
                  </option>
                  {availableBrandsForSelectedCategory.map((b) => (
                    <option key={b.id || b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Product Name * */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={brandProductName}
                  onChange={(e) => setBrandProductName(e.target.value)}
                  placeholder="Enter Product Name (যেমন: Horlicks Health Drink 500g)"
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 4. ব্র্যান্ড লোগো URL (Logo Image) */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  ব্র্যান্ড লোগো URL (Logo Image)
                </label>
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 5. বিবরণ (Description) */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                  বিবরণ (Description)
                </label>
                <textarea
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  rows={3}
                  placeholder="বিবরণ..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* 6. ব্র্যান্ড স্ট্যাটাস */}
              <div>
                <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  ব্র্যান্ড স্ট্যাটাস
                </label>
                <div className="flex items-center gap-5 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="brandStatusRadio"
                      value="active"
                      checked={brandStatus === 'active'}
                      onChange={() => setBrandStatus('active')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                    <span>Active (সক্রিয়)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-800 dark:text-neutral-200">
                    <input
                      type="radio"
                      name="brandStatusRadio"
                      value="inactive"
                      checked={brandStatus === 'inactive'}
                      onChange={() => setBrandStatus('inactive')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                    <span>Inactive (নিষ্ক্রিয়)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER PROFILE EDIT MODAL */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-emerald-600" />
                  ইউজার প্রোফাইল তথ্য সম্পাদনা (Super Admin Profile Editor)
                </h3>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-mono flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3" /> আইডি: {editingUser.permanentMemberId || editingUser.id} (স্থায়ী ও অপরিবর্তনীয়)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    পূর্ণ নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    মোবাইল নম্বর (Mobile Number) *
                  </label>
                  <input
                    type="text"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    ইমেইল ঠিকানা (Email Address)
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                  />
                </div>

                {(editingUser?.roles?.includes('dealer') || editingUser?.roles?.includes('vendor')) && (
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      দোকান / আউটলেটের নাম (Shop Name)
                    </label>
                    <input
                      type="text"
                      value={editShopName}
                      onChange={(e) => setEditShopName(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                    />
                  </div>
                )}

                {editingUser?.roles?.includes('delivery_rider') && (
                  <>
                    <div>
                      <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                        যানবাহনের ধরন (Vehicle Type)
                      </label>
                      <input
                        type="text"
                        value={editVehicleType}
                        onChange={(e) => setEditVehicleType(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                        গাড়ির রেজিস্ট্রেশন নম্বর (Reg No)
                      </label>
                      <input
                        type="text"
                        value={editVehicleReg}
                        onChange={(e) => setEditVehicleReg(e.target.value)}
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* BD Address Picker */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <BDAddressPicker
                  initialAddress={editAddressData}
                  userType={
                    editingUser?.primaryRole === 'vendor' ||
                    editingUser?.primaryRole === 'operations_partner' ||
                    editingUser?.primaryRole === 'delivery_rider'
                      ? editingUser.primaryRole
                      : 'customer'
                  }
                  onChange={(data, valid) => {
                    setEditAddressData(data);
                    setIsAddressValid(valid);
                  }}
                  lang="bn"
                  title="বাংলাদেশ প্রশাসনিক এড্রেস সিস্টেম (Level 2 BD Location)"
                  subtitle="বিভাগ, জেলা, উপজেলা, ইউনিয়ন, ওয়ার্ড ও লোকাল পিকআপ স্পট"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={!isAddressValid}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  প্রোফাইল আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DELIVERY RIDER MODAL */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                নতুন ডেলিভারি ম্যান (Rider) এডমিন এন্ট্রি
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRiderModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRider} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    ডেলিভারি ম্যানের নাম *
                  </label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="যেমন: মোঃ জসিম উদ্দিন"
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    মোবাইল নম্বর (১১ ডিজিট) *
                  </label>
                  <input
                    type="text"
                    value={riderMobile}
                    onChange={(e) => setRiderMobile(e.target.value)}
                    placeholder="017XXXXXXXX"
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    যানবাহনের ধরন
                  </label>
                  <input
                    type="text"
                    value={riderVehicleType}
                    onChange={(e) => setRiderVehicleType(e.target.value)}
                    placeholder="যেমন: মোটরসাইকেল (125cc)"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    যানবাহন রেজিস্ট্রেশন নম্বর
                  </label>
                  <input
                    type="text"
                    value={riderVehicleReg}
                    onChange={(e) => setRiderVehicleReg(e.target.value)}
                    placeholder="DHK-METRO-HA-1234"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Service Area Address */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <BDAddressPicker
                  initialAddress={riderAddress}
                  userType="delivery_rider"
                  onChange={(data) => setRiderAddress(data)}
                  lang="bn"
                  title="ডেলিভারি ম্যানের সার্ভিস এরিয়া ঠিকানা"
                  subtitle="বিভাগ, জেলা, উপজেলা ও লোকাল হাব কাভারেজ"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  নিবন্ধন ও অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW USER DETAILS MODAL */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scale-up">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  অ্যাকাউন্ট ও আইডি বিস্তারিত বিবরণী
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingUser(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <img
                  src={viewingUser.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                  alt={viewingUser.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                    {viewingUser.fullName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                      ID: {viewingUser.permanentMemberId || viewingUser.id}
                    </span>
                    <span className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                      {viewingUser?.primaryRole || 'customer'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-neutral-400 block font-semibold">মোবাইল নম্বর</span>
                  <span className="font-bold text-neutral-900 dark:text-white font-mono">{viewingUser.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-semibold">ইমেইল ঠিকানা</span>
                  <span className="font-bold text-neutral-900 dark:text-white font-mono">{viewingUser.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-semibold">স্পন্সর আইডি (Sponsor ID)</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{viewingUser.sponsorId || 'mem-root'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 block font-semibold">টোকেন ব্যালেন্স</span>
                  <span className="font-bold text-amber-500 font-mono">{viewingUser.tomokTokenBalance} TMK</span>
                </div>
              </div>

              {viewingUser.mandatoryAddress && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
                  <span className="text-[10px] text-neutral-400 block font-semibold">সার্ভিস ও ডেলিভারি ঠিকানা</span>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    {viewingUser.mandatoryAddress.division}, {viewingUser.mandatoryAddress.district}, {viewingUser.mandatoryAddress.upazila}, {viewingUser.mandatoryAddress.unionName}
                  </p>
                  <p className="text-neutral-500 text-[11px]">
                    {viewingUser.mandatoryAddress.area || 'এরিয়া স্পেসিফিকেশন করা নেই'}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingUser(null)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, title: '', message: '', actionType: 'status_change', targetId: '' })}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
              >
                নিশ্চিত করুন (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
