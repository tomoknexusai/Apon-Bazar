/**
 * Add Product Form Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 * Strictly enforces hierarchical relationships:
 * CATEGORY ➔ SUBCATEGORY ➔ BRAND ➔ PRODUCT
 */

import React, { useState } from 'react';
import { useProductMasterDatabase } from '../../context/ProductMasterDatabaseContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import { getStoredGlobalVatSettings } from '../../lib/vatPricingEngine';
import { calculateCompleteProductPricing } from '../../lib/pricing';
import { ProductHierarchyBreadcrumb } from './ProductHierarchyBreadcrumb';
import { ProductImageUploader } from './ProductImageUploader';
import {
  Package,
  Layers,
  Tag,
  Building2,
  DollarSign,
  Boxes,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Image as ImageIcon,
  RotateCcw,
  Loader2,
  X,
  ChevronRight,
  FolderTree,
  Check,
  Search,
  Lock,
  Calculator,
  Globe,
  Percent,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface AddProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddProductForm: React.FC<AddProductFormProps> = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { addProduct, warehouses, getApplicableDiscount, discountSettings } = useECommerce();
  const { addToast } = useNotifications();

  // Super Admin Check (Only Super Admin can control or override discounts)
  const isSuperAdmin = Boolean(
    currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    )
  );
  const {
    categories,
    getSubCategoriesByCategory,
    getBrandsByCategoryAndSubCategory,
    validateHierarchy
  } = useProductMasterDatabase();

  // Selected Hierarchical State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');

  // Dropdown Loading States
  const [isSubCategoryLoading, setIsSubCategoryLoading] = useState<boolean>(false);
  const [isBrandLoading, setIsBrandLoading] = useState<boolean>(false);

  // Form Fields State
  const [titleBn, setTitleBn] = useState<string>('');
  const [titleEn, setTitleEn] = useState<string>('');
  const [descriptionBn, setDescriptionBn] = useState<string>('');
  const [unit, setUnit] = useState<string>('১ কেজি');
  const [mrp, setMrp] = useState<string>('');
  const [dealerPrice, setDealerPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('50');
  const [images, setImages] = useState<string[]>([]);
  
  // Dynamic Option Calculations based on Master Database Context
  // 1. Get Sub-Categories for selected Category (deduplicated)
  const rawSubCategories = selectedCategory
    ? getSubCategoriesByCategory(selectedCategory)
    : [];
  const availableSubCategories = Array.from(
    new Set(rawSubCategories.map((s) => s.trim()))
  ).filter(Boolean);

  // 2. Get Brands for selected Category and Sub-Category (deduplicated)
  const rawBrands = (selectedCategory && selectedSubCategory)
    ? getBrandsByCategoryAndSubCategory(selectedCategory, selectedSubCategory)
    : [];
  const availableBrands = rawBrands.filter(
    (brand, index, self) =>
      index === self.findIndex((b) => b.id === brand.id || b.name.toLowerCase().trim() === brand.name.toLowerCase().trim())
  );

  // Feedback/Error Messages & Toast
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [relationshipToast, setRelationshipToast] = useState<{ title: string; message: string } | null>(null);

  // Super Admin Product Discount Override State
  const [isOverrideDiscount, setIsOverrideDiscount] = useState<boolean>(false);
  const [overrideDiscountPercent, setOverrideDiscountPercent] = useState<string>('');

  // Resolve 3-Level Applicable Discount (Product > Category > Global)
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const applicableDiscountInfo = getApplicableDiscount({
    categoryId: selectedCategory,
    category: currentCategoryObj ? currentCategoryObj.name : selectedCategory,
    categoryName: currentCategoryObj ? currentCategoryObj.nameBn : selectedCategory
  });

  const globalVat = getStoredGlobalVatSettings();
  const effectiveVatRate = globalVat.enabled ? globalVat.defaultVatRate : 0;
  const numMrpExcl = Math.max(0, parseFloat(mrp) || 0);
  const numDealerPriceExcl = dealerPrice === '' ? 0 : Math.max(0, parseFloat(dealerPrice) || 0);

  const effectiveDiscountPercent = (isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0)
    ? Math.min(100, Math.max(0, parseFloat(overrideDiscountPercent) || 0))
    : applicableDiscountInfo.discountPercent;

  const pricing = calculateCompleteProductPricing(
    numMrpExcl,
    effectiveDiscountPercent,
    effectiveVatRate,
    dealerPrice === '' ? undefined : numDealerPriceExcl
  );

  const numericMrp = pricing.mrpInclTax;
  const numericDealerPrice = pricing.dealerPriceExclTax;
  const discountAmount = pricing.discountAmount;
  const sellingPrice = pricing.sellingPriceInclTax;
  const calculatedProfit = pricing.profit;
  const calculatedAdminCost = pricing.adminCost;
  const calculatedNetProfit = pricing.netProfit;
  const calculatedPv = pricing.pv;
  const calculatedDiscount = pricing.discountPercent;

  // Handler for Update Pricing & Commission button
  const handleUpdatePricingAndCommission = () => {
    setError(null);
    setPricingSuccessMsg(null);

    if (!mrp || numMrpExcl <= 0) {
      const msg = 'MRP Price (Excl. VAT/Tax) অবশ্যই ০ (শূন্য)-এর চেয়ে বেশি হতে হবে।';
      setError(msg);
      triggerInvalidToast('Pricing Error', msg);
      return;
    }
    if (dealerPrice === '' || numDealerPriceExcl < 0) {
      const msg = 'Dealer Price (Excl. VAT/Tax) অবশ্যই ০ (শূন্য) বা তার বেশি হতে হবে।';
      setError(msg);
      triggerInvalidToast('Pricing Error', msg);
      return;
    }

    const msg = `প্রাইসিং ও কমিশন আপডেট সফল! MRP Excl: ৳${pricing.mrpExclTax.toLocaleString()} | MRP Incl: ৳${pricing.mrpInclTax.toLocaleString()} | ডিসকাউন্ট: ${pricing.discountPercent}% (সুপার অ্যাডমিন কর্তৃক গ্লোবালি নির্ধারিত) | Discount Amount: ৳${pricing.discountAmount.toLocaleString()} | বিক্রয় মূল্য Excl: ৳${pricing.sellingPriceExclTax.toLocaleString()} | VAT (${pricing.vatRate}%): ৳${pricing.vatAmount.toLocaleString()} | বিক্রয় মূল্য Incl: ৳${pricing.sellingPriceInclTax.toLocaleString()} | Dealer Price Excl: ৳${pricing.dealerPriceExclTax.toLocaleString()} | গ্রস প্রফিট: ৳${pricing.profit.toLocaleString()}${pricing.isLoss ? ' (Loss)' : ''} | Admin Cost (20%): ৳${pricing.adminCost.toLocaleString()} | Net Profit: ৳${pricing.netProfit.toLocaleString()} | PV: ${pricing.pv} PV`;
    setPricingSuccessMsg(msg);
    addToast('প্রাইসিং এবং কমিশন আপডেট হয়েছে', msg, 'success');
  };

  const triggerInvalidToast = (title: string, message: string) => {
    addToast(title, message, 'error');
    setRelationshipToast({ title, message });
    setTimeout(() => {
      setRelationshipToast(null);
    }, 5000);
  };

  // Handlers for Dependent Cascading Dropdowns
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedSubCategory(''); // Reset dependent Subcategory
    setSelectedBrand('');       // Reset dependent Brand
    setSelectedWarehouse('');   // Reset dependent Warehouse
    setError(null);

    if (catId) {
      setIsSubCategoryLoading(true);
      setIsBrandLoading(true);
      setTimeout(() => {
        setIsSubCategoryLoading(false);
        setIsBrandLoading(false);
      }, 150);
    } else {
      setIsSubCategoryLoading(false);
      setIsBrandLoading(false);
    }
  };

  const handleSubCategoryChange = (subCatName: string) => {
    setSelectedSubCategory(subCatName);
    setSelectedBrand('');       // Reset dependent Brand
    setSelectedWarehouse('');   // Reset dependent Warehouse
    setError(null);

    if (subCatName) {
      setIsBrandLoading(true);
      setTimeout(() => {
        setIsBrandLoading(false);
      }, 150);
    } else {
      setIsBrandLoading(false);
    }
  };

  const handleBrandChange = (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedWarehouse('');   // Reset dependent Warehouse
    setError(null);
  };

  const handleWarehouseChange = (whId: string) => {
    setSelectedWarehouse(whId);
    setError(null);
  };

  const handleResetForm = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSelectedBrand('');
    setSelectedWarehouse('');
    setTitleBn('');
    setTitleEn('');
    setDescriptionBn('');
    setUnit('১ কেজি');
    setMrp('');
    setDealerPrice('');
    setStock('50');
    setImages([]);
    setError(null);
    setSuccessMsg(null);
  };

  // Validate Selection Check Handler
  const validateSelection = (): boolean => {
    if (!selectedCategory || !selectedSubCategory || !selectedBrand) {
      const msg = 'ক্যাটাগরি, সাব-ক্যাটাগরি এবং ব্র্যান্ড নির্বাচন সম্পূর্ণ করুন।';
      setError(msg);
      triggerInvalidToast('Relationship Invalid', msg);
      return false;
    }

    const validation = validateHierarchy(selectedCategory, selectedSubCategory, selectedBrand);
    if (!validation.valid) {
      const errorReason = validation.reason || 'Selected Category, Subcategory, and Brand hierarchy is invalid.';
      setError(`হায়্যারার্কি এরর: ${errorReason}`);
      triggerInvalidToast('Relationship Invalid', errorReason);
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Mandatory Fields Check
    if (!selectedCategory) {
      setError('অনুগ্রহ করে ক্যাটাগরি নির্বাচন করুন।');
      return;
    }
    if (!selectedSubCategory) {
      setError('অনুগ্রহ করে সাব-ক্যাটাগরি নির্বাচন করুন।');
      return;
    }
    if (!selectedBrand) {
      setError('অনুগ্রহ করে ব্র্যান্ড নির্বাচন করুন।');
      return;
    }
    if (!selectedWarehouse) {
      setError('অনুগ্রহ করে ওয়্যারহাউজ নির্বাচন করুন।');
      return;
    }
    if (!titleBn.trim() && !titleEn.trim()) {
      setError('পণ্যটির নাম (বাংলা অথবা ইংরেজি) প্রদান করুন।');
      return;
    }
    if (!mrp || numMrpExcl <= 0) {
      setError('সর্বোচ্চ খুচরা মূল্য (MRP Price Excl. VAT/Tax) অবশ্যই ০ (শূন্য)-এর চেয়ে বেশি হতে হবে।');
      return;
    }
    if (dealerPrice === '' || numDealerPriceExcl < 0) {
      setError('ডিলার ক্রয় মূল্য (Dealer Price Excl. VAT/Tax) অবশ্যই ০ (শূন্য) বা তার বেশি হতে হবে।');
      return;
    }

    // 2. Cross-reference Category, Subcategory, and Brand IDs against Relationship Map
    if (!validateSelection()) {
      return;
    }

    // Find objects for metadata
    const catObj = categories.find((c) => c.id === selectedCategory);
    const brandObj = availableBrands.find((b) => b.id === selectedBrand);
    const whObj = warehouses.find((w) => w.id === selectedWarehouse);

    const numericStock = parseInt(stock, 10) || 0;

    const productTitle = titleEn || titleBn;
    const computedSlug = productTitle.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || `prod-${Date.now()}`;

    // Build Product Record
    const result = addProduct({
      titleBn: titleBn || titleEn,
      title: productTitle,
      slug: computedSlug,
      variants: [],
      categoryId: selectedCategory,
      categoryName: catObj ? catObj.nameBn : '',
      subCategory: selectedSubCategory,
      brandId: selectedBrand,
      brandName: brandObj ? brandObj.name : 'Unknown Brand',
      warehouseId: selectedWarehouse,
      warehouseName: whObj ? whObj.name : 'ডিফল্ট ওয়্যারহাউজ',
      mrp: pricing.mrpInclTax,
      mrpExclTax: pricing.mrpExclTax,
      mrpInclTax: pricing.mrpInclTax,
      sellingPriceExclTax: pricing.sellingPriceExclTax,
      sellingTaxAmount: pricing.vatAmount,
      sellingPriceInclTax: pricing.sellingPriceInclTax,
      price: pricing.sellingPriceInclTax,
      campaignPrice: pricing.sellingPriceInclTax,
      discountPrice: pricing.sellingPriceInclTax,
      dealerPrice: pricing.dealerPriceExclTax,
      dealerPriceExclTax: pricing.dealerPriceExclTax,
      discount: pricing.discountPercent,
      discount_percent: pricing.discountPercent,
      discount_scope: (isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0)
        ? 'product'
        : (applicableDiscountInfo.scope === 'none' ? 'global' : applicableDiscountInfo.scope),
      discount_source: (isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0)
        ? 'Product Override'
        : applicableDiscountInfo.sourceLabel,
      isDiscountOverridden: Boolean(isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0),
      profit: pricing.profit,
      adminCost: pricing.adminCost,
      netProfit: pricing.netProfit,
      pvPoint: pricing.pv,
      pvValue: pricing.pv,
      vatTax: pricing.vatRate,
      taxRate: pricing.vatRate,
      taxMode: 'excluded',
      stock: numericStock,
      unit: unit || '১ পিস',
      descriptionBn: descriptionBn,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'],
      vendorId: currentUser?.id || 'system',
      vendorShopName: currentUser?.fullName || 'Authorized Dealer',
      status: 'pending' // Vendor/Dealer products submitted for review
    });

    if (result && typeof result === 'object' && result.success) {
      setSuccessMsg(`"${titleBn || titleEn}" সফলভাবে ক্যাটালগে জমা দেওয়া হয়েছে।`);
      setTimeout(() => {
        handleResetForm();
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      const errorMsg = result && typeof result === 'object' && 'message' in result ? (result as { message: string }).message : 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে।';
      setError(errorMsg);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden max-w-4xl mx-auto relative">
      {/* Floating Relationship Invalid Toast Notification */}
      {relationshipToast && (
        <div className="absolute top-4 right-4 z-50 max-w-md bg-rose-900 text-white p-4 rounded-xl shadow-2xl border border-rose-700 flex items-start space-x-3 transition-all duration-300">
          <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
          <div className="flex-1 pr-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-200">{relationshipToast.title}</h4>
            <p className="text-xs text-rose-100 mt-0.5 font-medium">{relationshipToast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setRelationshipToast(null)}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-700/50 rounded-lg backdrop-blur-sm border border-emerald-600/40">
              <PlusCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">নতুন পণ্য ক্যাটালগে যুক্ত করুন</h2>
              <p className="text-emerald-200/80 text-xs mt-0.5">
                মাস্টার ডাটাবেজ অনুযায়ী সঠিক ক্যাটাগরি, সাব-ক্যাটাগরি এবং ব্র্যান্ড নির্বাচন করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center space-x-1.5 text-xs text-emerald-200 hover:text-white bg-emerald-800/60 hover:bg-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-700 transition"
            title="ফর্ম রিসেট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Status Notifications */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">জমা দেওয়া ব্যর্থ হয়েছে:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Section 1: Strict Dependent Hierarchy Selection */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>১. প্রোডাক্ট হায়্যারার্কি নির্বাচন (Hierarchy Flow)</span>
            </div>
            {/* Completion Percentage Badge */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-medium text-slate-500">অগ্রগতি:</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                (selectedCategory ? (selectedSubCategory ? (selectedBrand ? (selectedWarehouse ? 100 : 75) : 50) : 25) : 0) === 100
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {selectedCategory ? (selectedSubCategory ? (selectedBrand ? (selectedWarehouse ? '100% সম্পূর্ণ' : '75% ধাপ') : '50% ধাপ') : '25% ধাপ') : '0% শুরু করুন'}
              </span>
            </div>
          </div>

          {/* VISUAL HIERARCHY BREADCRUMB TRAIL */}
          <ProductHierarchyBreadcrumb
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            selectedBrand={selectedBrand}
            selectedWarehouse={selectedWarehouse}
            categories={categories}
            availableBrands={availableBrands}
            warehouses={warehouses}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ১. ক্যাটাগরি (Category) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  required
                >
                  <option value="">-- ক্যাটাগরি বেছে নিন --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nameBn} ({cat.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Subcategory */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ২. সম্পর্কিত সাব-ক্যাটাগরি <span className="text-rose-500">*</span>
                </label>
                {isSubCategoryLoading && (
                  <span className="flex items-center text-[10px] text-emerald-600 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    লোড হচ্ছে...
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedSubCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={!selectedCategory || isSubCategoryLoading}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none transition ${
                    !selectedCategory || isSubCategoryLoading
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                  required
                >
                  <option value="">
                    {isSubCategoryLoading
                      ? 'সাব-ক্যাটাগরি লোড হচ্ছে...'
                      : !selectedCategory
                      ? 'প্রথমে ক্যাটাগরি বাছুন'
                      : '-- সাব-ক্যাটাগরি বেছে নিন --'}
                  </option>
                  {!isSubCategoryLoading &&
                    availableSubCategories.map((subCat, index) => (
                      <option key={`${subCat}-${index}`} value={subCat}>
                        {subCat}
                      </option>
                    ))}
                  {!isSubCategoryLoading && selectedCategory && availableSubCategories.length === 0 && (
                    <option value="" disabled>No sub-categories available</option>
                  )}
                </select>
                {isSubCategoryLoading && (
                  <div className="absolute right-8 top-2.5 pointer-events-none">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Brand */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  ৩. অনুমোদিত ব্র্যান্ড (Brand) <span className="text-rose-500">*</span>
                </label>
                {isBrandLoading && (
                  <span className="flex items-center text-[10px] text-emerald-600 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    লোড হচ্ছে...
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  disabled={!selectedCategory || !selectedSubCategory || isBrandLoading}
                  className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none transition ${
                    !selectedCategory || !selectedSubCategory || isBrandLoading
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                  required
                >
                  <option value="">
                    {isBrandLoading
                      ? 'ব্র্যান্ড লোড হচ্ছে...'
                      : !selectedCategory
                      ? 'প্রথমে ক্যাটাগরি বাছুন'
                      : !selectedSubCategory
                      ? 'প্রথমে সাব-ক্যাটাগরি বাছুন'
                      : '-- ব্র্যান্ড বেছে নিন --'}
                  </option>
                  {!isBrandLoading &&
                    availableBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name} ({brand.brandType})
                      </option>
                    ))}
                  {!isBrandLoading && selectedCategory && selectedSubCategory && availableBrands.length === 0 && (
                    <option value="" disabled>No brands available</option>
                  )}
                </select>
                {isBrandLoading && (
                  <div className="absolute right-8 top-2.5 pointer-events-none">
                    <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Warehouse */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ৪. ওয়্যারহাউজ (Warehouse) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedWarehouse}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                disabled={!selectedCategory || !selectedBrand}
                className={`w-full border rounded-lg px-3 py-2 text-xs font-medium outline-none transition ${
                  !selectedCategory || !selectedBrand
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`}
                required
              >
                <option value="">
                  {!selectedCategory
                    ? 'প্রথমে ক্যাটাগরি বাছুন'
                    : !selectedBrand
                    ? 'প্রথমে ব্র্যান্ড বাছুন'
                    : '-- ওয়্যারহাউজ বেছে নিন --'}
                </option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.division})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Path Indicator & Manual Validate Selection Check */}
          {selectedCategory && selectedSubCategory && selectedBrand && selectedWarehouse && (
            <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between space-x-2 text-xs text-emerald-800">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>নির্বাচিত প্রবাহ (Hierarchy Path):</strong>{' '}
                  {categories.find((c) => c.id === selectedCategory)?.nameBn} ➔{' '}
                  {selectedSubCategory} ➔{' '}
                  {availableBrands.find((b) => b.id === selectedBrand)?.name} ➔{' '}
                  {warehouses.find((w) => w.id === selectedWarehouse)?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (validateSelection()) {
                    addToast('Hierarchy Valid', 'Selected Category ➔ Subcategory ➔ Brand relationship is verified!', 'success');
                  }
                }}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition shrink-0"
              >
                Validate Selection
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Product Name & Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm border-b border-slate-100 pb-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>২. পণ্যের মৌলিক বিবরণ</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                পণ্যের নাম (বাংলা) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                placeholder="যেমন: খাঁটি সরিষার তেল"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name (English)
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Pure Mustard Oil"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              প্যাক সাইজ / পরিমাপের একক
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="যেমন: ১ লিটার, ৫০০ গ্রাম, ১ পিস"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সংক্ষিপ্ত বিবরণ (বিবরণ)
            </label>
            <textarea
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              rows={2}
              placeholder="পণ্যের গুণগত মান ও বৈশিষ্ট্য সম্পর্কে লিখুন..."
              className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Product Image Uploader & Gallery */}
          <div className="pt-2">
            <ProductImageUploader
              images={images}
              onChange={setImages}
              maxImages={10}
              label="পণ্যের ছবি গ্যালারি (Product Picture Management)"
            />
          </div>
        </div>

        {/* Section 3: Pricing & Commission Configuration */}
        <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>৩. মূল্য নির্ধারণ এবং ডিসকাউন্ট কনফিগারেশন (Pricing & Discount Configuration)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isOverrideDiscount && isSuperAdmin
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : applicableDiscountInfo.scope === 'category'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {isOverrideDiscount && isSuperAdmin ? (
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                ) : applicableDiscountInfo.scope === 'category' ? (
                  <Layers className="w-3 h-3 text-blue-600" />
                ) : (
                  <Globe className="w-3 h-3 text-slate-500" />
                )}
                <span>
                  {isOverrideDiscount && isSuperAdmin
                    ? `প্রোডাক্ট ওভাররাইড: ${effectiveDiscountPercent}%`
                    : `${applicableDiscountInfo.sourceLabel}: ${effectiveDiscountPercent}%`}
                </span>
              </span>
            </div>
          </div>

          {pricingSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{pricingSuccessMsg}</span>
            </div>
          )}

          {/* Super Admin Discount Override Section */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" />
                  সেন্ট্রালাইজড ডিসকাউন্ট আর্কিটেকচার (Super Admin Only)
                </span>
                <p className="text-[11px] text-slate-500">
                  স্বাভাবিকভাবে পণ্যটি ক্যাটাগরি বা গ্লোবাল ডিসকাউন্ট অনুসরণ করে। শুধুমাত্র সুপার এডমিন স্বতন্ত্র ডিসকাউন্ট সেট করতে পারবেন।
                </p>
              </div>

              {isSuperAdmin ? (
                <label className="inline-flex items-center gap-2 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition">
                  <input
                    id="checkbox-override-discount"
                    type="checkbox"
                    checked={isOverrideDiscount}
                    onChange={(e) => {
                      setIsOverrideDiscount(e.target.checked);
                      if (e.target.checked && !overrideDiscountPercent) {
                        setOverrideDiscountPercent(String(applicableDiscountInfo.discountPercent));
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-emerald-900 select-none">
                    ডিসকাউন্ট ওভাররাইড করুন (Override Discount)
                  </span>
                </label>
              ) : (
                <div className="text-[11px] text-slate-500 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>ডিসকাউন্ট নিয়ন্ত্রণ সুপার এডমিন কর্তৃক নির্ধারিত</span>
                </div>
              )}
            </div>

            {/* Custom Discount Input for Super Admin */}
            {isSuperAdmin && isOverrideDiscount && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-64">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    কাস্টম প্রোডাক্ট ডিসকাউন্ট শতকরা হার (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-product-override-discount"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={overrideDiscountPercent}
                      onChange={(e) => setOverrideDiscountPercent(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-lg px-3 py-1.5 text-xs font-black text-emerald-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  এই পণ্যের জন্য ক্যাটাগরি/গ্লোবাল ডিসকাউন্ট বাতিল হয়ে <strong>{effectiveDiscountPercent}%</strong> কার্যকর হবে।
                </div>
              </div>
            )}
          </div>

          {/* Loss Warning Banner */}
          {pricing.isLoss && (
            <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-sm text-rose-900">
                  Warning: Selling Price is lower than Dealer Price. This product will result in a loss.
                </p>
                <p className="text-xs text-rose-700 font-medium">
                  সতর্কতা: বিক্রয় মূল্য (৳{pricing.sellingPriceExclTax.toLocaleString()}) ডিলার ক্রয় মূল্যের (৳{pricing.dealerPriceExclTax.toLocaleString()}) চেয়ে কম। এই পণ্যটি বিক্রয়ে লোকসান হবে (লোকসান: ৳{Math.abs(pricing.profit).toLocaleString()})।
                </p>
              </div>
            </div>
          )}

          {/* Dealer Input Section */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Dealer Input (ডিলার কর্তৃক নির্ধারিত ফিল্ড — ২ টি)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Field 1: MRP Price (Excl. VAT/Tax) (৳) * */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border-2 border-emerald-500/50">
                <label className="block text-xs font-extrabold text-emerald-950 mb-1">
                  MRP Price (Excl. VAT/Tax) (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="৳ 0.00"
                    className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                </div>
                <p className="text-[10px] text-emerald-800 font-semibold mt-1">Editable • Required (ডিলার ইনপুট)</p>
              </div>

              {/* Field 2: Dealer Price (Excl. VAT/Tax) (৳) * */}
              <div className="p-3 bg-blue-50/60 rounded-xl border-2 border-blue-500/50">
                <label className="block text-xs font-extrabold text-blue-950 mb-1">
                  Dealer Price (Excl. VAT/Tax) (৳) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={dealerPrice}
                    onChange={(e) => setDealerPrice(e.target.value)}
                    placeholder="৳ 0.00"
                    className="w-full bg-white border border-blue-400 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
                </div>
                <p className="text-[10px] text-blue-800 font-semibold mt-1">Editable • Required (ডিলারের নিজস্ব নির্ধারিত base/cost price)</p>
              </div>
            </div>
          </div>

          {/* Auto Calculated & Read-Only Breakdown Grid */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Auto Calculated & Read-Only (সুপার অ্যাডমিন ও সিস্টেম ক্যালকুলেশন)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Field 3: MRP Price (Incl. VAT/Tax) (৳) — Auto Calculated */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    MRP Price (Incl. VAT/Tax) (৳)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.mrpInclTax.toLocaleString()}`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-black text-slate-800 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Auto Calculated (MRP Excl + VAT on MRP)</p>
              </div>

              {/* Field 4: Discount (%) — Read-Only (Set globally by Super Admin) */}
              <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-amber-900">
                    Discount (%) — Read-Only
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${pricing.discountPercent}%`}
                  className="w-full bg-amber-100/80 border border-amber-300 rounded-lg px-3 py-2 text-xs font-black text-amber-900 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-amber-800 font-bold mt-1">
                  Set globally by Super Admin (সুপার অ্যাডমিন কর্তৃক গ্লোবালি নির্ধারিত)
                </p>
              </div>

              {/* Field 5: Discount Amount (৳) — Auto Calculated */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Discount Amount (৳)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.discountAmount.toLocaleString()}`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold text-amber-700 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Auto Calculated (MRP Excl × {pricing.discountPercent}%)</p>
              </div>

              {/* Field 6: Selling Price (Excl. VAT/Tax) (৳) — Auto Calculated */}
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-emerald-900">
                    Selling Price (Excl. VAT/Tax) (৳)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.sellingPriceExclTax.toLocaleString()}`}
                  className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-xs font-black text-slate-900 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">MRP Excl VAT minus Global Discount</p>
              </div>

              {/* Field 7: VAT/Tax (%) — Global / Read-Only */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    VAT/Tax (%) — Global
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${pricing.vatRate}%`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Global / Read-Only</p>
              </div>

              {/* Field 8: VAT/Tax Amount (৳) — Auto Calculated */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    VAT/Tax Amount (৳)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.vatAmount.toLocaleString()}`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold text-slate-700 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Auto Calculated (Selling Excl × {pricing.vatRate}%)</p>
              </div>

              {/* Field 9: Selling Price (Incl. VAT/Tax) (৳) — Auto Calculated */}
              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-emerald-900">
                    Selling Price (Incl. VAT/Tax) (৳)
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.sellingPriceInclTax.toLocaleString()}`}
                  className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-xs font-black text-emerald-900 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-emerald-700 font-medium mt-0.5">Auto Calculated (Selling Excl + VAT)</p>
              </div>

              {/* Field 10: Profit (৳) — Read-Only */}
              <div className={pricing.isLoss ? 'bg-rose-50 p-2 rounded-xl border border-rose-300' : ''}>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block text-xs font-bold ${pricing.isLoss ? 'text-rose-900 font-black' : 'text-slate-700'}`}>
                    Profit (৳) {pricing.isLoss && '— Loss'}
                  </label>
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${pricing.isLoss ? 'text-rose-600' : 'text-blue-700'}`}>
                    {pricing.isLoss ? <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> : <Lock className="w-2.5 h-2.5" />} {pricing.isLoss ? 'Loss' : 'Read-Only'}
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={pricing.isLoss ? `-৳ ${Math.abs(pricing.profit).toLocaleString()}` : `৳ ${pricing.profit.toLocaleString()}`}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-extrabold cursor-not-allowed outline-none select-none ${
                    pricing.isLoss
                      ? 'bg-rose-100 border border-rose-300 text-rose-700 font-black'
                      : 'bg-slate-100 border border-slate-300 text-blue-700'
                  }`}
                />
                <p className={`text-[10px] mt-0.5 ${pricing.isLoss ? 'text-rose-700 font-bold' : 'text-slate-500'}`}>
                  Selling Excl VAT minus Dealer Price Excl VAT
                </p>
              </div>

              {/* Field 11: Admin Cost (20%) — Read-Only */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Admin Cost (20%)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${pricing.adminCost.toLocaleString()}`}
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-extrabold text-slate-700 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Read-Only (Profit × 20%)</p>
              </div>

              {/* Field 12: Net Profit (৳) — Read-Only */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Net Profit (৳)
                  </label>
                  <span className="text-[10px] text-teal-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={pricing.isLoss ? `-৳ ${Math.abs(pricing.netProfit).toLocaleString()}` : `৳ ${pricing.netProfit.toLocaleString()}`}
                  className={`w-full rounded-lg px-3 py-2 text-xs font-extrabold cursor-not-allowed outline-none select-none ${
                    pricing.isLoss
                      ? 'bg-rose-50 border border-rose-300 text-rose-600'
                      : 'bg-slate-100 border border-slate-300 text-teal-700'
                  }`}
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Read-Only (Profit - Admin Cost)</p>
              </div>

              {/* Field 13: Network Marketing PV Point — Read-Only */}
              <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-300">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Network Marketing PV Point
                  </label>
                  <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`${pricing.pv} PV`}
                  className="w-full bg-amber-100/70 border border-amber-300 rounded-lg px-3 py-2 text-xs font-black text-amber-800 cursor-not-allowed outline-none select-none"
                />
                <p className="text-[10px] text-amber-700 font-medium mt-0.5">Read-Only (Net Profit ÷ 10)</p>
              </div>
            </div>
          </div>

          {/* Pricing Update Action & Inventory Stock */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
            <div>
              <button
                type="button"
                onClick={handleUpdatePricingAndCommission}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>প্রাইসিং ও কমিশন ক্যালকুলেট করুন</span>
              </button>
            </div>

            <div className="w-full sm:w-1/3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                প্রারম্ভিক স্টক (পরিমাণ)
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="যেমন: ৫০"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              বাতিল
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-900/20 hover:shadow-lg transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>পণ্য জমা দিন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
