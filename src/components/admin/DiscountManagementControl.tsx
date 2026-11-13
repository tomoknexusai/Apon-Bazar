/**
 * Centralized 3-Level Discount Management System
 * Exclusively for Super Admin Control
 * Hierarchy: Product Override > Category Discount > Global Discount > Default (0%)
 * Formulas:
 * - Discount Amount = MRP - Selling Price
 * - Discount % = ((MRP - Selling Price) / MRP) * 100
 * - Selling Price = MRP - (MRP * Discount %)
 * - Gross Profit = Selling Price - Dealer Price
 * - Admin Cost = Gross Profit * 20%
 * - PV Value = Gross Profit - Admin Cost
 * - PV = PV Value / 10
 */

import React, { useState, useMemo } from 'react';
import {
  Percent,
  Tag,
  Layers,
  Globe,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  History,
  Info,
  ChevronRight,
  X,
  Lock,
  Sparkles,
  Check,
  Edit2,
  RotateCcw,
  Sliders,
  Eye,
  ArrowRight,
  Package,
  Boxes,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useNotifications } from '../../context/NotificationContext';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import { Product, ProductCategory, DiscountAuditLog } from '../../types';
import {
  formatPrice,
  formatPV,
  analyzeCatalogDiscountEligibility,
  evaluateDiscountEligibility,
  hasActiveProductDiscountOverride,
  calculateDiscountedProductPricing,
  resolveApplicableDiscount,
  getEffectiveDiscount
} from '../../lib/pricing';

export const DiscountManagementControl: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    products,
    categories,
    discountSettings,
    updateGlobalDiscount,
    updateCategoryDiscount,
    removeCategoryDiscount,
    updateProductDiscount,
    resetProductDiscount,
    getApplicableDiscount,
    discountAuditLogs
  } = useECommerce();
  const { addToast } = useNotifications();

  // 1. Strict Super Admin Security Check
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
  }, [currentUser]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'global' | 'category' | 'product' | 'audit_logs'>('global');

  // Global Tab Form State
  const [globalInput, setGlobalInput] = useState<string>(
    String(discountSettings.globalDiscountPercent || 0)
  );
  const [isConfirmGlobalModalOpen, setIsConfirmGlobalModalOpen] = useState(false);

  // Category Tab Form State
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');
  const [categoryDiscountInput, setCategoryDiscountInput] = useState<string>('');
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isConfirmCategoryModalOpen, setIsConfirmCategoryModalOpen] = useState(false);

  // Product Tab Form State
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productScopeFilter, setProductScopeFilter] = useState<'all' | 'product' | 'category' | 'global'>('all');
  const [editingProductForDiscount, setEditingProductForDiscount] = useState<Product | null>(null);
  const [productDiscountInput, setProductDiscountInput] = useState<string>('');
  const [isConfirmProductModalOpen, setIsConfirmProductModalOpen] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    let globalInheritedCount = 0;
    let categoryInheritedCount = 0;
    let productOverriddenCount = 0;

    products.forEach((p) => {
      if (hasActiveProductDiscountOverride(p)) {
        productOverriddenCount++;
      } else if (p.discount_scope === 'category') {
        categoryInheritedCount++;
      } else {
        globalInheritedCount++;
      }
    });

    return {
      totalProducts: products.length,
      globalInheritedCount,
      categoryInheritedCount,
      productOverriddenCount,
      activeCategoriesWithDiscount: Object.keys(discountSettings.categoryDiscounts || {}).filter(
        (k) => (discountSettings.categoryDiscounts[k] || 0) > 0
      ).length
    };
  }, [products, discountSettings]);

  // Full Catalog Global Discount Eligibility Analysis
  const globalDiscountEligibility = useMemo(() => {
    return analyzeCatalogDiscountEligibility(products, discountSettings);
  }, [products, discountSettings]);

  const affectedByGlobalChange = globalDiscountEligibility.eligibleCount;

  // Target count affected by changing specific Category Discount
  const affectedByCategoryChange = useMemo(() => {
    if (!selectedCategoryKey) return 0;
    const trimmed = selectedCategoryKey.trim().toLowerCase();
    return products.filter((p) => {
      const match =
        p.categoryId === selectedCategoryKey ||
        (p.category && p.category.toLowerCase() === trimmed) ||
        (p.categoryName && p.categoryName.toLowerCase() === trimmed);
      return match && !hasActiveProductDiscountOverride(p);
    }).length;
  }, [products, selectedCategoryKey]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (!categorySearchQuery.trim()) return true;
      const q = categorySearchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.nameBn && c.nameBn.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [categories, categorySearchQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        const matchTitle = (p.titleBn || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId) return false;
      }
      // Category filter
      if (productCategoryFilter !== 'all') {
        const catObj = categories.find((c) => c.id === productCategoryFilter);
        const matchCat =
          p.categoryId === productCategoryFilter ||
          (catObj && (p.category === catObj.name || p.categoryName === catObj.nameBn));
        if (!matchCat) return false;
      }
      // Scope filter
      if (productScopeFilter === 'product') {
        if (!hasActiveProductDiscountOverride(p)) return false;
      } else if (productScopeFilter === 'category') {
        const catId = (p.categoryId || '').trim();
        const catName = (p.categoryName || p.category || '').trim();
        const catDiscounts = discountSettings.categoryDiscounts || {};
        const catDiscountVal =
          (catId && catDiscounts[catId] !== undefined ? Number(catDiscounts[catId]) : undefined) ??
          (catName && catDiscounts[catName.toLowerCase()] !== undefined ? Number(catDiscounts[catName.toLowerCase()]) : undefined);
        const hasCategoryDiscount = catDiscountVal !== undefined && catDiscountVal > 0;
        if (!hasCategoryDiscount || hasActiveProductDiscountOverride(p)) return false;
      } else if (productScopeFilter === 'global') {
        const eligibility = evaluateDiscountEligibility(p, discountSettings);
        if (!eligibility.isEligible) return false;
      }
      return true;
    });
  }, [products, productSearchQuery, productCategoryFilter, productScopeFilter, categories, discountSettings]);

  // If unauthorized, render restricted view
  if (!isAuthorized) {
    return (
      <div id="discount-management-restricted" className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-rose-900">অননুমোদিত অ্যাক্সেস (Unauthorized Access)</h2>
        <p className="text-sm text-rose-700 leading-relaxed">
          সেন্ট্রালাইজড ডিসকাউন্ট ম্যানেজমেন্টের সম্পূর্ণ নিয়ন্ত্রণ শুধুমাত্র <strong>সুপার এডমিন (Super Admin)</strong>-এর জন্য সংরক্ষিত।
          অন্যান্য কোনো রোল বা গ্রাহক ডিসকাউন্ট পরিবর্তন করতে পারবেন না।
        </p>
      </div>
    );
  }

  const [isSaving, setIsSaving] = useState(false);

  // Execute Global Discount Update
  const handleApplyGlobalDiscount = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const num = Math.min(100, Math.max(0, parseFloat(globalInput) || 0));
      const result = updateGlobalDiscount(num);
      setIsConfirmGlobalModalOpen(false);
      const count = result?.affectedCount ?? globalDiscountEligibility.eligibleCount;
      addToast({
        title: 'গ্লোবাল ডিসকাউন্ট সফলভাবে আপডেট হয়েছে',
        message: `গ্লোবাল ডিসকাউন্ট ${num}% নির্ধারণ করা হয়েছে (${count} টি পণ্য সফলভাবে আপডেট হয়েছে)`,
        type: 'success'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open Category Edit Modal
  const handleOpenCategoryEdit = (catId: string) => {
    setSelectedCategoryKey(catId);
    const existing = discountSettings.categoryDiscounts[catId] ?? discountSettings.categoryDiscounts[catId.toLowerCase()] ?? discountSettings.globalDiscountPercent ?? 0;
    setCategoryDiscountInput(String(existing));
    setIsCategoryModalOpen(true);
  };

  // Execute Category Discount Update
  const handleApplyCategoryDiscount = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const num = Math.min(100, Math.max(0, parseFloat(categoryDiscountInput) || 0));
      updateCategoryDiscount(selectedCategoryKey, num);
      setIsConfirmCategoryModalOpen(false);
      setIsCategoryModalOpen(false);
      addToast({
        title: 'ক্যাটাগরি ডিসকাউন্ট সফলভাবে সংরক্ষিত হয়েছে',
        message: `${selectedCategoryKey} এর জন্য ${num}% ডিসকাউন্ট কার্যকর করা হয়েছে`,
        type: 'success'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Revert Category Discount to Global
  const handleRevertCategoryDiscount = (catId: string) => {
    removeCategoryDiscount(catId);
    addToast({
      title: 'ক্যাটাগরি ডিসকাউন্ট বাতিল',
      message: `${catId} ডিসকাউন্ট বাতিল করে গ্লোবাল নিয়মে নেওয়া হয়েছে`,
      type: 'info'
    });
  };

  // Open Product Override Modal
  const handleOpenProductOverride = (product: Product) => {
    setEditingProductForDiscount(product);
    setProductDiscountInput(String(product.discount || 0));
    setIsConfirmProductModalOpen(true);
  };

  // Execute Product Override
  const handleApplyProductOverride = async () => {
    if (!editingProductForDiscount) return;
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const num = Math.min(100, Math.max(0, parseFloat(productDiscountInput) || 0));
      updateProductDiscount(editingProductForDiscount.id, num, true);
      setIsConfirmProductModalOpen(false);
      setEditingProductForDiscount(null);
      addToast({
        title: 'পণ্য ডিসকাউন্ট ওভাররাইড সফলভাবে সংরক্ষিত হয়েছে',
        message: `${editingProductForDiscount.titleBn || editingProductForDiscount.title} পণ্যে ${num}% ডিসকাউন্ট কার্যকর হয়েছে`,
        type: 'success'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Product Discount to Inherited
  const handleResetProductOverride = (productId: string) => {
    resetProductDiscount(productId);
    addToast({
      title: 'পণ্য ডিসকাউন্ট রিসেট',
      message: 'পণ্য ডিসকাউন্ট রিসেট করে মূল ক্যাটাগরি নিয়মে ফিরিয়ে নেওয়া হয়েছে',
      type: 'info'
    });
  };

  return (
    <div id="centralized-discount-management-system" className="space-y-6">
      {/* Top Banner & Control Center Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-emerald-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Super Admin Only
              </span>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-400/30">
                ৩-স্তর ডিসকাউন্ট কন্ট্রোল
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              সেন্ট্রালাইজড ডিসকাউন্ট ম্যানেজমেন্ট সিস্টেম
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-3xl leading-relaxed">
              সুপার এডমিন কন্ট্রোল্ড ডিসকাউন্ট আর্কিটেকচার। ক্যাটালগের সকল পণ্যের ডিসকাউন্ট ৩টি স্তরে নিয়ন্ত্রিত হয়:
              <strong className="text-white"> প্রডাক্ট ওভাররাইড (Product) &gt; ক্যাটাগরি ডিসকাউন্ট (Category) &gt; গ্লোবাল ডিসকাউন্ট (Global)</strong>।
            </p>
          </div>

          {/* Hierarchy Rule Pill */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <Info className="w-4 h-4" />
              <span>ডিসকাউন্ট অগ্রাধিকার ক্রম (Hierarchy):</span>
            </div>
            <div className="space-y-1 text-[11px] text-white/90">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-[10px]">১</span>
                <span>প্রোডাক্ট ওভাররাইড (সর্বোচ্চ অগ্রাধিকার)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-400 text-slate-950 font-black flex items-center justify-center text-[10px]">২</span>
                <span>ক্যাটাগরি ডিসকাউন্ট (যদি প্রোডাক্ট ওভাররাইড না থাকে)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">৩</span>
                <span>গ্লোবাল ডিসকাউন্ট (ডিফল্ট সকল পণ্যে)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-700/60">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">বর্তমান গ্লোবাল ডিসকাউন্ট</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {discountSettings.globalDiscountPercent || 0}%
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">সমগ্র ক্যাটালগে প্রযোজ্য</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">গ্লোবাল অনুসরণকারী পণ্য</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">
              {stats.globalInheritedCount}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">মোট {stats.totalProducts} টির মধ্যে</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">ক্যাটাগরি ডিসকাউন্ট প্রাপ্ত</div>
            <div className="text-2xl font-black text-blue-300 mt-0.5">
              {stats.categoryInheritedCount}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">{stats.activeCategoriesWithDiscount} ক্যাটাগরিতে সক্রিয়</div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-emerald-200 font-medium">প্রোডাক্ট লেভেল ওভাররাইড</div>
            <div className="text-2xl font-black text-emerald-300 mt-0.5">
              {stats.productOverriddenCount}
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-1">স্বতন্ত্র ডিসকাউন্ট সেট করা</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          id="tab-discount-global"
          type="button"
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'global'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>১. গ্লোবাল ডিসকাউন্ট (Global)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
            {discountSettings.globalDiscountPercent || 0}%
          </span>
        </button>

        <button
          id="tab-discount-category"
          type="button"
          onClick={() => setActiveTab('category')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'category'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>২. ক্যাটাগরি ডিসকাউন্ট (Category)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
            {categories.length}
          </span>
        </button>

        <button
          id="tab-discount-product"
          type="button"
          onClick={() => setActiveTab('product')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
            activeTab === 'product'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>৩. প্রোডাক্ট ডিসকাউন্ট ও ওভাররাইড (Product)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 text-white font-mono">
            {stats.productOverriddenCount} ওভাররাইড
          </span>
        </button>

        <button
          id="tab-discount-audit-logs"
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ml-auto ${
            activeTab === 'audit_logs'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-800/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-emerald-500" />
          <span>অডিট লগ ও হিস্ট্রি (Audit Logs)</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
            {discountAuditLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GLOBAL DISCOUNT (লেভেল ৩: সমগ্র ক্যাটালগ) */}
      {/* ========================================================================= */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <span>গ্লোবাল ডিসকাউন্ট কনফিগারেশন (Global Catalog Discount)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  এই ডিসকাউন্ট শতকরা হারটি সমগ্র ক্যাটালগের সকল পণ্যে ডিফল্টভাবে প্রযোজ্য হবে, যদি না কোনো ক্যাটাগরি বা পণ্যে স্বতন্ত্র ডিসকাউন্ট সেট করা থাকে।
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                সক্রিয় ডিসকাউন্ট: {discountSettings.globalDiscountPercent || 0}%
              </span>
            </div>

            {/* Formula Reference Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                ক্যালকুলেশন মেকানিজম (Centralized Pricing Formula):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-slate-600">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">১. বিক্রয় মূল্য (Selling Price):</strong>
                  <code>Selling Price = MRP - (MRP × Discount %)</code>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">২. গ্রস প্রফিট (Gross Profit):</strong>
                  <code>Gross Profit = Selling Price - Dealer Price</code>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <strong className="text-slate-900 block mb-0.5">৩. নেট পিভি (PV Points):</strong>
                  <code>Net Profit = GP × 80% | PV = Net ÷ 10</code>
                </div>
              </div>
            </div>

            {/* Update Form */}
            <div className="max-w-xl p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
              <label className="block text-xs font-bold text-slate-800">
                নতুন গ্লোবাল ডিসকাউন্ট শতকরা হার (%) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="input-global-discount-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={globalInput}
                    onChange={(e) => setGlobalInput(e.target.value)}
                    placeholder="e.g. 5 or 10"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    %
                  </span>
                </div>
                <button
                  id="btn-trigger-confirm-global-discount"
                  type="button"
                  onClick={() => setIsConfirmGlobalModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>বাল্ক আপডেট প্রয়োগ করুন</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
                  <span>Total Products:</span>
                  <strong className="text-slate-900 font-mono">{globalDiscountEligibility.totalCount}</strong>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium">
                  <span>Eligible Products:</span>
                  <strong className="text-emerald-700 font-mono">{globalDiscountEligibility.eligibleCount}</strong>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-medium">
                  <span>Affected Products:</span>
                  <strong className="text-amber-900 font-mono">{globalDiscountEligibility.eligibleCount}</strong>
                </div>
                {globalDiscountEligibility.skippedCount > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-medium">
                    <span>Skipped:</span>
                    <strong className="text-rose-700 font-mono">{globalDiscountEligibility.skippedCount}</strong>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  এই পরিবর্তনে সরাসরি <strong className="text-slate-800">{globalDiscountEligibility.eligibleCount} টি পণ্য</strong> প্রভাবিত হবে। যেসব পণ্যে নিজস্ব ওভাররাইড বা ক্যাটাগরি ডিসকাউন্ট রয়েছে সেগুলি অক্ষত থাকবে।
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CATEGORY DISCOUNT (লেভেল ২: ক্যাটাগরি ভিত্তিক ডিসকাউন্ট) */}
      {/* ========================================================================= */}
      {activeTab === 'category' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <span>ক্যাটাগরি ভিত্তিক ডিসকাউন্ট ম্যানেজমেন্ট (Category-Level Discount)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  নির্দিষ্ট ক্যাটাগরির জন্য কাস্টম ডিসকাউন্ট নির্ধারণ করুন। এটি গ্লোবাল ডিসকাউন্টকে ওভাররাইড করবে।
                </p>
              </div>

              {/* Search Category */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="ক্যাটাগরি খুঁজুন..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Category Discount List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">ক্যাটাগরির নাম</th>
                    <th className="px-4 py-3">আইডি / কোড</th>
                    <th className="px-4 py-3 text-center">ক্যাটাগরি পণ্য সংখ্যা</th>
                    <th className="px-4 py-3 text-center">কার্যকরী ডিসকাউন্ট (%)</th>
                    <th className="px-4 py-3 text-center">ডিসকাউন্ট উৎস (Source)</th>
                    <th className="px-4 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCategories.map((cat) => {
                    const catId = cat.id;
                    const catKey = catId.toLowerCase();
                    const customCatDiscount =
                      discountSettings.categoryDiscounts[catId] ??
                      discountSettings.categoryDiscounts[catKey];
                    const hasCustomDiscount = customCatDiscount !== undefined && customCatDiscount >= 0;
                    const effectiveDiscount = hasCustomDiscount
                      ? customCatDiscount
                      : (discountSettings.globalDiscountPercent || 0);

                    const productCount = products.filter(
                      (p) => p.categoryId === cat.id || (p.category && p.category.toLowerCase() === cat.name.toLowerCase())
                    ).length;

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{cat.nameBn || cat.name}</div>
                          <div className="text-[11px] text-slate-400">{cat.name}</div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          {cat.id}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-slate-800">
                          {productCount} টি
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block font-black text-sm px-2.5 py-1 rounded-lg ${
                            hasCustomDiscount
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {effectiveDiscount}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hasCustomDiscount ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <Sparkles className="w-3 h-3" /> ক্যাটাগরি স্পেসিফিক
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Globe className="w-3 h-3" /> গ্লোবাল ইনহেরিটেড
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryEdit(cat.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>ডিসকাউন্ট পরিবর্তন</span>
                          </button>
                          {hasCustomDiscount && (
                            <button
                              type="button"
                              onClick={() => handleRevertCategoryDiscount(cat.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="গ্লোবাল ডিসকাউন্টে রিসেট করুন"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>রিসেট (গ্লোবাল)</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PRODUCT DISCOUNT & OVERRIDES (লেভেল ১: পণ্য লেভেল ওভাররাইড) */}
      {/* ========================================================================= */}
      {activeTab === 'product' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-emerald-600" />
                  <span>প্রোডাক্ট লেভেল ডিসকাউন্ট ও ওভাররাইড (Product-Level Override)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  যেসব পণ্যে বিশেষ অফার প্রয়োজন, সেখানে সুপার এডমিন সরাসরি স্বতন্ত্র ডিসকাউন্ট সেট বা রিসেট করতে পারেন।
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="পণ্যের নাম/আইডি..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  <option value="all">সকল ক্যাটাগরি</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn || c.name}
                    </option>
                  ))}
                </select>

                {/* Scope Filter */}
                <select
                  value={productScopeFilter}
                  onChange={(e) => setProductScopeFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                >
                  <option value="all">সকল ডিসকাউন্ট স্কোপ</option>
                  <option value="product">শুধুমাত্র প্রোডাক্ট ওভাররাইড</option>
                  <option value="category">শুধুমাত্র ক্যাটাগরি ইনহেরিটেড</option>
                  <option value="global">শুধুমাত্র গ্লোবাল ইনহেরিটেড</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">পণ্য বিবরণ</th>
                    <th className="px-4 py-3">ক্যাটাগরি</th>
                    <th className="px-4 py-3 text-right">MRP (৳)</th>
                    <th className="px-4 py-3 text-center">ডিসকাউন্ট (%)</th>
                    <th className="px-4 py-3 text-center">ডিসকাউন্ট স্তর (Scope)</th>
                    <th className="px-4 py-3 text-right">বিক্রয় মূল্য (Selling Price)</th>
                    <th className="px-4 py-3 text-right">ডিলার মূল্য (Dealer)</th>
                    <th className="px-4 py-3 text-center">পিভি (PV)</th>
                    <th className="px-4 py-3 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => {
                    const resolved = resolveApplicableDiscount(p, discountSettings);
                    const discountPercent = resolved.discountPercent;
                    const isOverridden = resolved.scope === 'product';
                    const isCategoryScope = resolved.scope === 'category';

                    // Selling price dynamically calculated based on effective discount
                    const pricing = calculateDiscountedProductPricing(p, discountPercent);
                    const sellingPrice = pricing.finalSellingPriceInclTax;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.images && p.images[0] ? p.images[0] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                              alt={p.titleBn || p.title}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-slate-900 text-xs line-clamp-1">
                                {p.titleBn || p.title}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ID: {p.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">
                          {p.categoryName || p.category || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">
                          ৳{formatPrice(p.mrp)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block font-black text-xs px-2 py-0.5 rounded-lg ${
                            isOverridden
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isCategoryScope
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {discountPercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isOverridden ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> প্রোডাক্ট ওভাররাইড
                            </span>
                          ) : isCategoryScope ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              <Layers className="w-3 h-3 text-blue-500" /> ক্যাটাগরি স্তর
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Globe className="w-3 h-3 text-slate-400" /> গ্লোবাল স্তর
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-700">
                          ৳{formatPrice(sellingPrice)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-500 font-mono text-[11px]">
                          ৳{formatPrice(p.dealerPrice || 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700 bg-amber-50/50">
                          {formatPV(p.pvPoint || p.pvValue || 0)} PV
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenProductOverride(p)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>ওভাররাইড</span>
                          </button>
                          {isOverridden && (
                            <button
                              type="button"
                              onClick={() => handleResetProductOverride(p.id)}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 transition text-[11px] inline-flex items-center gap-1 cursor-pointer"
                              title="ইনহেরিটেড ডিসকাউন্টে রিসেট করুন"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>রিসেট</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AUDIT LOGS (সম্পূর্ণ ডিসকাউন্ট পরিবর্তনের হিস্ট্রি) */}
      {/* ========================================================================= */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-800" />
                  <span>ডিসকাউন্ট অডিট লগ (Super Admin Discount Audit Logs)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  সকল স্তরের ডিসকাউন্ট পরিবর্তনের পুঙ্খানুপুঙ্খ ইতিহাস: কে, কখন, কোন স্তরে এবং কত শতাংশ পরিবর্তন করেছেন।
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-lg border border-slate-200">
                মোট রেকর্ড: {discountAuditLogs.length}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">সময় ও তারিখ</th>
                    <th className="px-4 py-3">সুপার এডমিন (কর্তা)</th>
                    <th className="px-4 py-3">অ্যাকশন টাইপ</th>
                    <th className="px-4 py-3">লক্ষ্যবস্তু (Target Scope)</th>
                    <th className="px-4 py-3 text-center">পূর্বের ডিসকাউন্ট</th>
                    <th className="px-4 py-3 text-center">নতুন ডিসকাউন্ট</th>
                    <th className="px-4 py-3 text-center">প্রভাবিত পণ্য সংখ্যা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {discountAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                        <div>{log.date}</div>
                        <div className="text-[10px] text-slate-400">{log.time}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{log.superAdminName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {log.superAdminId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          log.actionType === 'GLOBAL_DISCOUNT_UPDATE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : log.actionType === 'CATEGORY_DISCOUNT_UPDATE'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : log.actionType === 'PRODUCT_DISCOUNT_UPDATE'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {log.targetName}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">
                        {log.previousDiscount}%
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-700">
                        {log.newDiscount}%
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {log.affectedProductsCount} টি
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRM GLOBAL BULK DISCOUNT UPDATE */}
      {/* ========================================================================= */}
      {isConfirmGlobalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">গ্লোবাল ডিসকাউন্ট বাল্ক আপডেট নিশ্চিতকরণ</h4>
                  <p className="text-xs text-slate-500">সমগ্র ক্যাটালগে এই পরিবর্তন কার্যকর হবে</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmGlobalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct confirmation query requested by user */}
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-center space-y-1">
              <p className="text-base sm:text-lg font-black text-emerald-950">
                Apply {globalInput}% discount to {globalDiscountEligibility.eligibleCount} eligible products?
              </p>
              <p className="text-xs font-semibold text-emerald-700">
                {globalDiscountEligibility.eligibleCount} টি প্রযোজ্য পণ্যে {globalInput}% গ্লোবাল ডিসকাউন্ট প্রয়োগ করবেন?
              </p>
            </div>

            {/* Expected Summary: Total Products, Eligible Products, Global Discount, Affected Products */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Total Products:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{globalDiscountEligibility.totalCount}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-emerald-700 font-bold">Eligible Products:</span>
                <span className="font-black text-emerald-700 text-sm font-mono bg-emerald-100 px-2 py-0.5 rounded">
                  {globalDiscountEligibility.eligibleCount}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Global Discount:</span>
                <span className="font-black text-indigo-700 text-sm font-mono">{globalInput}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold">Affected Products:</span>
                <span className="font-black text-emerald-900 text-sm font-mono bg-emerald-200 px-2.5 py-0.5 rounded">
                  {globalDiscountEligibility.eligibleCount}
                </span>
              </div>
            </div>

            {/* Skipped Products List (if any) */}
            {globalDiscountEligibility.skippedCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-900 font-bold">
                  <span>Skipped Products ({globalDiscountEligibility.skippedCount}):</span>
                  <span className="text-[11px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono font-bold">
                    {globalDiscountEligibility.skippedCount} টি বাদ
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 font-medium">Skipped কারণ:</div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {globalDiscountEligibility.skippedProducts.map((sp, idx) => (
                    <div key={sp.product.id || idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200">
                      <span className="font-medium text-slate-800 truncate max-w-[200px]">
                        {sp.product.titleBn || sp.product.title}
                      </span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">
                        {sp.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              সতর্কতা: Selling Price Excl. VAT-এর উপর ভিত্তি করে ডিসকাউন্ট হিসাব হবে এবং এর উপর VAT যোগ হয়ে স্বয়ংক্রিয়ভাবে নতুন Selling Price Incl. VAT নির্ধারিত হবে।
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setGlobalInput(String(discountSettings.globalDiscountPercent || 0));
                  setIsConfirmGlobalModalOpen(false);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                id="btn-confirm-apply-global-discount"
                type="button"
                disabled={isSaving}
                onClick={handleApplyGlobalDiscount}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply {globalInput}% discount to {globalDiscountEligibility.eligibleCount} eligible products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATEGORY DISCOUNT EDIT & CONFIRMATION */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">ক্যাটাগরি ডিসকাউন্ট সেট করুন</h4>
                <p className="text-xs text-slate-500">
                  {categories.find((c) => c.id === selectedCategoryKey)?.nameBn || selectedCategoryKey}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                এই ক্যাটাগরির জন্য ডিসকাউন্ট (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={categoryDiscountInput}
                  onChange={(e) => setCategoryDiscountInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 8"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                এই ক্যাটাগরির <strong className="text-slate-800">{affectedByCategoryChange} টি পণ্য</strong> সরাসরি এই ডিসকাউন্ট পাবে।
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                id="btn-save-category-discount"
                disabled={isSaving}
                onClick={handleApplyCategoryDiscount}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ক্যাটাগরি ডিসকাউন্ট সংরক্ষণ করুন (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRODUCT OVERRIDE EDIT & CONFIRMATION */}
      {/* ========================================================================= */}
      {isConfirmProductModalOpen && editingProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900">পণ্য ডিসকাউন্ট ওভাররাইড</h4>
                <p className="text-xs text-slate-500 line-clamp-1">
                  {editingProductForDiscount.titleBn || editingProductForDiscount.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">MRP মূল্য:</span>
                <span className="font-bold text-slate-900">৳{formatPrice(editingProductForDiscount.mrp)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">ডিলার ক্রয় মূল্য:</span>
                <span className="font-bold text-slate-500 font-mono">৳{formatPrice(editingProductForDiscount.dealerPrice || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">বর্তমান ডিসকাউন্ট:</span>
                <span className="font-bold text-slate-800">{editingProductForDiscount.discount || 0}%</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                স্বতন্ত্র ওভাররাইড ডিসকাউন্ট (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={productDiscountInput}
                  onChange={(e) => setProductDiscountInput(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>
              {/* Preview selling price */}
              {(() => {
                const previewPercent = Math.min(100, Math.max(0, parseFloat(productDiscountInput) || 0));
                const previewDiscAmount = (editingProductForDiscount.mrp * previewPercent) / 100;
                const previewSelling = Math.max(0, editingProductForDiscount.mrp - previewDiscAmount);
                return (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-900">
                    <div className="flex justify-between font-medium">
                      <span>নতুন বিক্রয় মূল্য:</span>
                      <strong className="font-black text-sm">৳{formatPrice(previewSelling)}</strong>
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      ডিসকাউন্ট পরিমাণ: ৳{formatPrice(previewDiscAmount)} (MRP থেকে বিয়োগ)
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  setIsConfirmProductModalOpen(false);
                  setEditingProductForDiscount(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                id="btn-save-product-override-discount"
                disabled={isSaving}
                onClick={handleApplyProductOverride}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ওভাররাইড সংরক্ষণ করুন (Save Override)</span>
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
