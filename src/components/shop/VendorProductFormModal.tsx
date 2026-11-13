/**
 * Vendor & Admin Product Management Form Modal
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useProductMasterDatabase } from '../../context/ProductMasterDatabaseContext';
import { Product, ProductVariant } from '../../types';
import { ProductImageUploader } from '../products/ProductImageUploader';
import { ClothingVariantManager } from '../products/ClothingVariantManager';
import { isClothingCategory } from '../../lib/deliveryWeightCalculator';
import { getStoredGlobalVatSettings } from '../../lib/vatPricingEngine';
import { calculateCompleteProductPricing } from '../../lib/pricing';
import { getZoneForDealer } from '../../services/DeliveryZoneService';
import { X, Plus, Trash2, CheckCircle2, Upload, Lock, Calculator, AlertCircle, ShieldCheck, AlertTriangle, MapPin } from 'lucide-react';

interface VendorProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProductData?: Product | null;
}

export const VendorProductFormModal: React.FC<VendorProductFormModalProps> = ({
  isOpen,
  onClose,
  editProductData
}) => {
  const { currentUser } = useAuth();
  const { categories, brands, warehouses, addProduct, editProduct, discountSettings } = useECommerce();
  const { getSubCategoriesByCategory, getBrandsByCategoryAndSubCategory } = useProductMasterDatabase();

  const [titleBn, setTitleBn] = useState(editProductData?.titleBn || '');
  const [title, setTitle] = useState(editProductData?.title || '');
  const [categoryId, setCategoryId] = useState(editProductData?.categoryId || '');
  const [subCategory, setSubCategory] = useState(editProductData?.subCategory || '');
  const [brandId, setBrandId] = useState(editProductData?.brandId || '');
  const [sku, setSku] = useState(editProductData?.sku || `GBBD-PROD-${Math.floor(100 + Math.random() * 900)}`);
  const [barcode, setBarcode] = useState(editProductData?.barcode || `8809123${Math.floor(1000 + Math.random() * 9000)}`);
  
  // Pricing: Dealer manually sets ONLY:
  // 1. MRP Price (Excl. VAT/Tax)
  // 2. Dealer Price (Excl. VAT/Tax)
  const [mrpExclTax, setMrpExclTax] = useState<number | ''>(
    editProductData?.mrpExclTax || editProductData?.mrp || 10000
  );
  const [dealerPriceExclTax, setDealerPriceExclTax] = useState<number | ''>(
    editProductData?.dealerPriceExclTax !== undefined
      ? Number(editProductData.dealerPriceExclTax)
      : (editProductData?.dealerPrice !== undefined ? Number(editProductData.dealerPrice) : 9500)
  );

  const [vendorCost, setVendorCost] = useState(editProductData?.vendorCost || 650);
  const [serviceCharge, setServiceCharge] = useState(editProductData?.serviceCharge || 30);
  const [platformFee, setPlatformFee] = useState(editProductData?.platformFee || 20);
  const [cashbackPct, setCashbackPct] = useState(editProductData?.cashbackPct || 5);
  
  // Stock & Warehousing
  const [stock, setStock] = useState(editProductData?.stock || 50);
  const [variants, setVariants] = useState<ProductVariant[]>(editProductData?.variants || []);
  const [unit, setUnit] = useState(editProductData?.unit || 'kg');
  const [weightKg, setWeightKg] = useState(editProductData?.weightKg || 1.0);
  const [warehouseId, setWarehouseId] = useState(editProductData?.warehouseId || '');
  const [descriptionBn, setDescriptionBn] = useState(editProductData?.descriptionBn || '');
  const [images, setImages] = useState<string[]>(
    editProductData?.images && editProductData.images.length > 0
      ? editProductData.images
      : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800']
  );
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Dynamic Options Calculations
  const rawSubCategories = categoryId ? getSubCategoriesByCategory(categoryId) : [];
  const availableSubCategories = Array.from(new Set(rawSubCategories.map((s) => s.trim()))).filter(Boolean);

  const rawBrands = (categoryId && subCategory)
    ? getBrandsByCategoryAndSubCategory(categoryId, subCategory)
    : [];
  const availableBrands = rawBrands.filter(
    (brand, index, self) =>
      index === self.findIndex((b) => b.id === brand.id || b.name.toLowerCase().trim() === brand.name.toLowerCase().trim())
  );

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSubCategory('');
    setBrandId('');
    setWarehouseId('');
  };

  const handleSubCategoryChange = (newSub: string) => {
    setSubCategory(newSub);
    setBrandId('');
    setWarehouseId('');
  };

  const handleBrandChange = (newBrandId: string) => {
    setBrandId(newBrandId);
    setWarehouseId('');
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const isClothing = isClothingCategory(selectedCategoryObj?.name, categoryId, selectedCategoryObj?.nameBn);

  // Global Settings & Unified Pricing Calculation
  const globalVat = getStoredGlobalVatSettings();
  const globalDiscountPercent = discountSettings?.globalDiscountPercent ?? 2;
  const effectiveVatRate = globalVat.enabled ? globalVat.defaultVatRate : 0;
  const numMrpExcl = Math.max(0, Number(mrpExclTax) || 0);
  const numDealerPriceExcl = dealerPriceExclTax === '' ? 0 : Math.max(0, Number(dealerPriceExclTax) || 0);

  const pricing = calculateCompleteProductPricing(
    numMrpExcl,
    globalDiscountPercent,
    effectiveVatRate,
    dealerPriceExclTax === '' ? undefined : numDealerPriceExcl
  );

  const handleUpdatePricingAndCommission = () => {
    setPricingError(null);
    setPricingSuccessMsg(null);

    if (numMrpExcl <= 0) {
      setPricingError('MRP Price (Excl. VAT/Tax) অবশ্যই ০ (শূন্য)-এর চেয়ে বেশি হতে হবে।');
      return;
    }
    if (dealerPriceExclTax === '' || numDealerPriceExcl < 0) {
      setPricingError('Dealer Price (Excl. VAT/Tax) অবশ্যই ০ (শূন্য) বা তার বেশি হতে হবে।');
      return;
    }

    setPricingSuccessMsg(
      `প্রাইসিং ও কমিশন কনফিগার সফল! MRP Excl: ৳${pricing.mrpExclTax.toLocaleString()} | MRP Incl: ৳${pricing.mrpInclTax.toLocaleString()} | Discount: ${pricing.discountPercent}% (সুপার অ্যাডমিন কর্তৃক গ্লোবালি নির্ধারিত) | Discount Amount: ৳${pricing.discountAmount.toLocaleString()} | বিক্রয় মূল্য Excl: ৳${pricing.sellingPriceExclTax.toLocaleString()} | VAT (${pricing.vatRate}%): ৳${pricing.vatAmount.toLocaleString()} | বিক্রয় মূল্য Incl: ৳${pricing.sellingPriceInclTax.toLocaleString()} | Dealer Price Excl: ৳${pricing.dealerPriceExclTax.toLocaleString()} | Profit: ৳${pricing.profit.toLocaleString()}${pricing.isLoss ? ' (Loss)' : ''} | PV: ${pricing.pv} PV`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numMrpExcl <= 0) {
      setPricingError('MRP Price (Excl. VAT/Tax) অবশ্যই 0-এর চেয়ে বেশি হতে হবে');
      return;
    }
    if (dealerPriceExclTax === '' || numDealerPriceExcl < 0) {
      setPricingError('Dealer Price (Excl. VAT/Tax) অবশ্যই ০ বা তার বেশি হতে হবে');
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const brandObj = availableBrands.find((b) => b.id === brandId) || brands.find((b) => b.id === brandId);
    const whObj = warehouses.find((w) => w.id === warehouseId);
    const dealerZone = getZoneForDealer(currentUser?.mandatoryAddress);

    const payload = {
      title,
      titleBn,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId,
      categoryName: catObj?.nameBn || 'সাধারণ ক্যাটালগ',
      subCategory,
      brandId,
      brandName: brandObj?.name || 'TOMSHOPBD',
      sku,
      barcode,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'],
      description: title,
      descriptionBn,
      mrp: pricing.mrpInclTax,
      mrpExclTax: pricing.mrpExclTax,
      mrpInclTax: pricing.mrpInclTax,
      sellingPriceExclTax: pricing.sellingPriceExclTax,
      sellingTaxAmount: pricing.vatAmount,
      sellingPriceInclTax: pricing.sellingPriceInclTax,
      dealerPrice: pricing.dealerPriceExclTax,
      dealerPriceExclTax: pricing.dealerPriceExclTax,
      price: pricing.sellingPriceInclTax,
      campaignPrice: pricing.sellingPriceInclTax,
      discountPrice: pricing.sellingPriceInclTax,
      discount: pricing.discountPercent,
      discount_percent: pricing.discountPercent,
      discount_scope: 'global' as const,
      discount_source: 'Global',
      isDiscountOverridden: false,
      profit: pricing.profit,
      adminCost: pricing.adminCost,
      netProfit: pricing.netProfit,
      pvPoint: pricing.pv,
      pvValue: pricing.pv,
      vatTax: pricing.vatRate,
      taxRate: pricing.vatRate,
      taxMode: 'excluded' as const,
      taxSource: 'global' as const,
      vendorCost: Number(vendorCost),
      serviceCharge: Number(serviceCharge),
      platformFee: Number(platformFee),
      cashbackPct: Number(cashbackPct),
      weightKg: Number(weightKg),
      dimensionsCm: '10x10x20',
      codAvailable: true,
      unit,
      tags: ['New Arrival', 'Organic'],
      stock: Number(stock),
      warehouseId,
      warehouseName: whObj?.name || 'ঢাকা কেন্দ্রীয় ওয়্যারহাউজ',
      variants: isClothing ? variants : (editProductData?.variants || []),
      // Dealer Zone & Seller Information (strictly derived from dealer registered address)
      dealer_id: editProductData?.dealer_id || currentUser?.permanentMemberId || currentUser?.id || 'DLR-10025',
      dealer_name: editProductData?.dealer_name || currentUser?.fullName || 'Apon Bazar ডিলার',
      dealer_shop_name: editProductData?.dealer_shop_name || currentUser?.shopName || currentUser?.mandatoryAddress?.shopName || 'Apon Bazar ডিলার আউটলেট',
      dealer_address: editProductData?.dealer_address || currentUser?.mandatoryAddress?.fullServiceAddress || `${dealerZone.upazila_name}, ${dealerZone.district_name}`,
      district: editProductData?.district || currentUser?.mandatoryAddress?.district || dealerZone.district_name,
      upazila: editProductData?.upazila || currentUser?.mandatoryAddress?.upazila || dealerZone.upazila_name,
      zone_id: editProductData?.zone_id || dealerZone.zone_id,
      zone_name: editProductData?.zone_name || dealerZone.zone_name,
      zone_name_bn: editProductData?.zone_name_bn || dealerZone.zone_name_bn,
      vendorId: currentUser?.id || editProductData?.vendorId || 'usr-vendor-04',
      vendorShopName: currentUser?.shopName || currentUser?.fullName || editProductData?.vendorShopName || 'ভেন্ডর আউটলেট',
      isApproved: currentUser?.primaryRole === 'super_admin' || currentUser?.primaryRole === 'admin'
    };

    if (editProductData) {
      editProduct(editProductData.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 sticky top-0 z-10">
          <h2 className="font-black text-neutral-900 dark:text-white text-base">
            {editProductData ? 'পণ্য সংশোধন করুন' : 'নতুন পণ্য ক্যাটালগে যুক্ত করুন'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Dealer Delivery Zone Association Banner */}
          {(() => {
            const currentDealerZone = getZoneForDealer(currentUser?.mandatoryAddress);
            return (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        ডিলার নির্ধারিত ডেলিভারি জোন: {currentDealerZone.zone_name_bn}
                      </span>
                      <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                        Zone ID: {currentDealerZone.zone_id}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      ভৌগোলিক অবস্থান: {currentDealerZone.division_name} বিভাগ → {currentDealerZone.district_name} জেলা → {currentDealerZone.upazila_name} (১ উপজেলা = ১ ডেলিভারি জোন)
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
                  স্বয়ংক্রিয় সংযুক্ত
                </span>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">পণ্যের নাম (বাংলা):</label>
              <input
                type="text"
                value={titleBn}
                onChange={(e) => setTitleBn(e.target.value)}
                required
                placeholder="যেমন: পাবনার খাঁটি গাওয়া ঘি ৫০০ গ্রাম"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">পণ্যের নাম (English):</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Pabna Pure Ghee 500g"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Category */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                ১. ক্যাটাগরি <span className="text-rose-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-neutral-900 dark:text-white font-medium"
              >
                <option value="">-- ক্যাটাগরি বেছে নিন --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameBn} ({c.name})</option>
                ))}
              </select>
            </div>

            {/* 2. Sub-Category */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                ২. সাব-ক্যাটাগরি <span className="text-rose-500">*</span>
              </label>
              <select
                value={subCategory}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                disabled={!categoryId}
                required
                className={`w-full border rounded-xl p-2 font-medium transition ${
                  !categoryId
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                }`}
              >
                <option value="">
                  {!categoryId ? 'প্রথমে ক্যাটাগরি বাছুন' : '-- সাব-ক্যাটাগরি বেছে নিন --'}
                </option>
                {availableSubCategories.map((sub, index) => (
                  <option key={`${sub}-${index}`} value={sub}>
                    {sub}
                  </option>
                ))}
                {categoryId && availableSubCategories.length === 0 && (
                  <option value="" disabled>No sub-categories available</option>
                )}
              </select>
            </div>

            {/* 3. Brand */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                ৩. ব্র্যান্ড (Brand) <span className="text-rose-500">*</span>
              </label>
              <select
                value={brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
                disabled={!categoryId || !subCategory}
                required
                className={`w-full border rounded-xl p-2 font-medium transition ${
                  !categoryId || !subCategory
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                }`}
              >
                <option value="">
                  {!categoryId
                    ? 'প্রথমে ক্যাটাগরি বাছুন'
                    : !subCategory
                    ? 'প্রথমে সাব-ক্যাটাগরি বাছুন'
                    : '-- ব্র্যান্ড বেছে নিন --'}
                </option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.brandType})
                  </option>
                ))}
                {categoryId && subCategory && availableBrands.length === 0 && (
                  <option value="" disabled>No brands available</option>
                )}
              </select>
            </div>

            {/* 4. Warehouse */}
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                ৪. ওয়্যারহাউজ <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                disabled={!categoryId || !subCategory || !brandId}
                required
                className={`w-full border rounded-xl p-2 font-medium transition ${
                  !categoryId || !subCategory || !brandId
                    ? 'bg-neutral-100 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white'
                }`}
              >
                <option value="">
                  {!brandId ? 'প্রথমে ব্র্যান্ড বাছুন' : '-- ওয়্যারহাউজ বেছে নিন --'}
                </option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Commission Configuration */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/70 dark:border-neutral-700/70 pb-3">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-sm flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>প্রাইসিং ও কমিশন কনফিগারেশন (Pricing & Commission Configuration)</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  ডিলার শুধুমাত্র <strong>MRP Price (Excl. VAT/Tax)</strong> এবং <strong>Dealer Price (Excl. VAT/Tax)</strong> সেট করবেন। সেলিং প্রাইস ও লাভ স্বয়ংক্রিয়ভাবে হিসাবকৃত।
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
                  Dealer Input: 2 Fields
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auto Calculated / Read-Only
                </span>
              </div>
            </div>

            {/* Profit Loss Safety Warning */}
            {pricing.isLoss && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-extrabold text-sm text-rose-900 dark:text-rose-100">
                    Warning: Selling Price is lower than Dealer Price. This product will result in a loss.
                  </p>
                  <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                    সতর্কতা: বিক্রয় মূল্য (৳{pricing.sellingPriceExclTax.toLocaleString()}) ডিলার ক্রয় মূল্যের (৳{pricing.dealerPriceExclTax.toLocaleString()}) চেয়ে কম। এই পণ্যটি বিক্রয়ে লোকসান হবে (লোকসান: ৳{Math.abs(pricing.profit).toLocaleString()})।
                  </p>
                </div>
              </div>
            )}

            {pricingError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{pricingError}</span>
              </div>
            )}

            {pricingSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pricingSuccessMsg}</span>
              </div>
            )}

            {/* Dealer Input Section */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Dealer Input (ডিলার কর্তৃক নির্ধারিত ফিল্ড — ২ টি)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Dealer Input 1: MRP Price (Excl. VAT/Tax) (৳) */}
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/25 rounded-xl border-2 border-emerald-500/60">
                  <label className="text-xs text-emerald-950 dark:text-emerald-300 font-extrabold block mb-1">
                    MRP Price (Excl. VAT/Tax) (৳) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={mrpExclTax}
                      onChange={(e) => setMrpExclTax(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="৳ 0.00"
                      className="w-full bg-white dark:bg-neutral-900 border border-emerald-400 dark:border-emerald-600 rounded-lg p-2.5 font-mono font-bold text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-sm">৳</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold mt-1.5 block">
                    Editable • Required (ডিলার ইনপুট)
                  </span>
                </div>

                {/* Dealer Input 2: Dealer Price (Excl. VAT/Tax) (৳) */}
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/25 rounded-xl border-2 border-blue-500/60">
                  <label className="text-xs text-blue-950 dark:text-blue-300 font-extrabold block mb-1">
                    Dealer Price (Excl. VAT/Tax) (৳) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={dealerPriceExclTax}
                      onChange={(e) => setDealerPriceExclTax(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="৳ 0.00"
                      className="w-full bg-white dark:bg-neutral-900 border border-blue-400 dark:border-blue-600 rounded-lg p-2.5 font-mono font-bold text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400 text-sm">৳</span>
                  </div>
                  <span className="text-[10px] text-blue-800 dark:text-blue-300 font-semibold mt-1.5 block">
                    Editable • Required (ডিলারের নিজস্ব নির্ধারিত base/cost price)
                  </span>
                </div>
              </div>
            </div>

            {/* Auto Calculated & Read-Only Breakdown Grid */}
            <div>
              <div className="flex items-center gap-1.5 mb-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
                <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
                  Auto Calculated & Read-Only (সুপার অ্যাডমিন ও সিস্টেম ক্যালকুলেশন)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Field 3: MRP Price (Incl. VAT/Tax) (৳) — Auto Calculated */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      MRP Price (Incl. VAT/Tax) (৳)
                    </label>
                    <span className="text-[9px] text-neutral-500 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.mrpInclTax.toLocaleString()}`}
                    className="w-full bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-extrabold text-neutral-800 dark:text-neutral-200 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Auto Calculated (MRP Excl + VAT on MRP)
                  </span>
                </div>

                {/* Field 4: Discount (%) — Read-Only (Super Admin Global Setting) */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-300 dark:border-amber-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-amber-900 dark:text-amber-300 font-extrabold block">
                      Discount (%) — Read-Only
                    </label>
                    <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${pricing.discountPercent}%`}
                    className="w-full bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg p-2 font-mono font-black text-amber-900 dark:text-amber-200 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-amber-800 dark:text-amber-300 font-bold mt-1 block">
                    Set globally by Super Admin
                  </span>
                </div>

                {/* Field 5: Discount Amount (৳) — Auto Calculated */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      Discount Amount (৳)
                    </label>
                    <span className="text-[9px] text-neutral-500 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.discountAmount.toLocaleString()}`}
                    className="w-full bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-extrabold text-amber-700 dark:text-amber-400 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Auto Calculated (MRP Excl × {pricing.discountPercent}%)
                  </span>
                </div>

                {/* Field 6: Selling Price (Excl. VAT/Tax) (৳) — Auto Calculated */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-emerald-900 dark:text-emerald-300 font-extrabold block">
                      Selling Price (Excl. VAT/Tax) (৳)
                    </label>
                    <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.sellingPriceExclTax.toLocaleString()}`}
                    className="w-full bg-white dark:bg-neutral-900 border border-emerald-400 dark:border-emerald-600 rounded-lg p-2 font-mono font-black text-neutral-900 dark:text-white text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 block">
                    MRP Excl VAT minus Global Discount
                  </span>
                </div>

                {/* Field 7: VAT/Tax (%) — Global / Read-Only */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      VAT/Tax (%) — Global
                    </label>
                    <span className="text-[9px] text-neutral-500 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={`${pricing.vatRate}%`}
                    className="w-full bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-extrabold text-neutral-700 dark:text-neutral-300 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Set globally by Super Admin
                  </span>
                </div>

                {/* Field 8: VAT/Tax Amount (৳) — Auto Calculated */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      VAT/Tax Amount (৳)
                    </label>
                    <span className="text-[9px] text-neutral-500 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.vatAmount.toLocaleString()}`}
                    className="w-full bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-extrabold text-neutral-700 dark:text-neutral-300 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Auto Calculated (Selling Excl × {pricing.vatRate}%)
                  </span>
                </div>

                {/* Field 9: Selling Price (Incl. VAT/Tax) (৳) — Auto Calculated */}
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-emerald-900 dark:text-emerald-300 font-extrabold block">
                      Selling Price (Incl. VAT/Tax) (৳)
                    </label>
                    <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Auto
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.sellingPriceInclTax.toLocaleString()}`}
                    className="w-full bg-white dark:bg-neutral-900 border border-emerald-400 dark:border-emerald-600 rounded-lg p-2 font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-medium mt-1 block">
                    Auto Calculated (Selling Excl + VAT)
                  </span>
                </div>

                {/* Field 10: Profit (৳) — Read-Only */}
                <div className={pricing.isLoss ? 'bg-rose-50 dark:bg-rose-950/30 p-2 rounded-xl border border-rose-300 dark:border-rose-800' : ''}>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-[11px] font-bold block ${pricing.isLoss ? 'text-rose-900 dark:text-rose-200 font-black' : 'text-neutral-700 dark:text-neutral-300'}`}>
                      Profit (৳) {pricing.isLoss && '— Loss'}
                    </label>
                    <span className={`text-[9px] font-bold flex items-center gap-0.5 ${pricing.isLoss ? 'text-rose-600' : 'text-blue-600'}`}>
                      {pricing.isLoss ? <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> : <Lock className="w-2.5 h-2.5" />} {pricing.isLoss ? 'Loss' : 'Read-Only'}
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={pricing.isLoss ? `-৳ ${Math.abs(pricing.profit).toLocaleString()}` : `৳ ${pricing.profit.toLocaleString()}`}
                    className={`w-full rounded-xl p-2 font-mono font-black text-xs cursor-not-allowed select-none ${
                      pricing.isLoss
                        ? 'bg-rose-100/90 dark:bg-rose-900/50 border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300'
                        : 'bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 text-blue-600 dark:text-blue-400'
                    }`}
                  />
                  <span className={`text-[9px] font-medium mt-1 block ${pricing.isLoss ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-neutral-500'}`}>
                    Selling Excl VAT minus Dealer Price Excl VAT
                  </span>
                </div>

                {/* Field 11: Admin Cost (20%) — Read-Only */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      Admin Cost (20%)
                    </label>
                    <span className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`৳ ${pricing.adminCost.toLocaleString()}`}
                    className="w-full bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono font-extrabold text-neutral-600 dark:text-neutral-400 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Read-Only (Profit × 20%)
                  </span>
                </div>

                {/* Field 12: Net Profit (৳) — Read-Only */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      Net Profit (৳)
                    </label>
                    <span className="text-[9px] text-teal-600 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={pricing.isLoss ? `-৳ ${Math.abs(pricing.netProfit).toLocaleString()}` : `৳ ${pricing.netProfit.toLocaleString()}`}
                    className={`w-full rounded-xl p-2 font-mono font-extrabold text-xs cursor-not-allowed select-none ${
                      pricing.isLoss
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                        : 'bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-300 dark:border-neutral-700 text-teal-600 dark:text-teal-400'
                    }`}
                  />
                  <span className="text-[9px] text-neutral-500 font-medium mt-1 block">
                    Read-Only (Profit - Admin Cost)
                  </span>
                </div>

                {/* Field 13: Network Marketing PV Point — Read-Only */}
                <div className="bg-amber-50/30 dark:bg-amber-950/20 p-2 rounded-xl border border-amber-300 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-neutral-700 dark:text-neutral-300 font-bold block">
                      Network Marketing PV Point
                    </label>
                    <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Read-Only
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={`${pricing.pv} PV`}
                    className="w-full bg-amber-100/60 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-2 font-mono font-black text-amber-700 dark:text-amber-400 text-xs cursor-not-allowed select-none"
                  />
                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-medium mt-1 block">
                    Read-Only (Net Profit ÷ 10)
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-200/60 dark:border-neutral-700/60 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUpdatePricingAndCommission}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>প্রাইসিং ও কমিশন কনফিগার করুন</span>
              </button>
              <span className="text-[11px] text-neutral-500 font-mono">
                Chain: MRP Excl (৳{pricing.mrpExclTax.toLocaleString()}) → {pricing.discountPercent}% Discount → Selling Excl (৳{pricing.sellingPriceExclTax.toLocaleString()}) → {pricing.vatRate}% VAT → Selling Incl (৳{pricing.sellingPriceInclTax.toLocaleString()})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">স্টক সংখ্যা:</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">একক (Unit):</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2"
              >
                <option value="kg">কেজী (kg)</option>
                <option value="g">গ্রাম (g)</option>
                <option value="L">লিটার (L)</option>
                <option value="ml">মি.লি (ml)</option>
                <option value="pcs">পিস (pcs)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">SKU Code:</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">Barcode:</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-mono"
              />
            </div>
          </div>

          {/* Clothing Variant System: Color + Size + Weight */}
          {isClothing && (
            <div className="pt-2">
              <ClothingVariantManager
                variants={variants}
                onChange={setVariants}
                basePrice={pricing.sellingPriceInclTax}
                baseMrp={pricing.mrpInclTax}
                productSlugOrSku={sku || title || 'PROD'}
                onStockSumChange={(totalStock) => setStock(totalStock)}
              />
            </div>
          )}

          <div className="space-y-1">
            <ProductImageUploader
              images={images}
              onChange={setImages}
              maxImages={10}
              label="পণ্যের ছবি গ্যালারি (Product Pictures)"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-neutral-700 dark:text-neutral-300">বিবরণ (বাংলা):</label>
            <textarea
              value={descriptionBn}
              onChange={(e) => setDescriptionBn(e.target.value)}
              rows={3}
              placeholder="পণ্যের গুণাগুণ ও বৈশিষ্ট্য লিখুন..."
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>সংরক্ষণ করুন (Save Product)</span>
          </button>

        </form>

      </div>
    </div>
  );
};
