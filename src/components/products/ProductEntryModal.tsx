/**
 * Master Product Entry & Edit Form Modal
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 * Strictly enforces Category -> Subcategory -> Brand dependent hierarchy & validation
 */

import React, { useState, useEffect } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useProductMasterDatabase } from '../../context/ProductMasterDatabaseContext';
import { useAuth } from '../../context/AuthContext';
import { useBDLocalDatabase } from '../../context/BDLocalDatabaseContext';
import { Product, ProductVariant } from '../../types';
import { ProductImageUploader } from './ProductImageUploader';
import { ClothingVariantManager } from './ClothingVariantManager';
import { isClothingCategory } from '../../lib/deliveryWeightCalculator';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import { ProductVatPricingSection, ProductVatPricingValues } from './ProductVatPricingSection';
import { resolveProductVatPricing, getStoredGlobalVatSettings, round2 } from '../../lib/vatPricingEngine';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  Calculator,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Layers,
  Award,
  Lock,
  AlertCircle,
  Globe,
  Percent
} from 'lucide-react';

interface ProductEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProductData?: Product | null;
}

export const ProductEntryModal: React.FC<ProductEntryModalProps> = ({
  isOpen,
  onClose,
  editProductData
}) => {
  const { currentUser } = useAuth();
  const { addProduct, editProduct, warehouses, getApplicableDiscount, discountSettings } = useECommerce();

  // Super Admin Authorization Gate
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
    validateHierarchy,
    requestNewBrand
  } = useProductMasterDatabase();
  const { markets } = useBDLocalDatabase();

  // Step 1: Category
  const [categoryId, setCategoryId] = useState<string>(
    editProductData?.categoryId || ''
  );

  // Step 2: Subcategory
  const [subCategory, setSubCategory] = useState<string>(editProductData?.subCategory || '');

  // Step 3: Brand
  const [brandId, setBrandId] = useState<string>(editProductData?.brandId || '');

  // Step 4: Warehouse
  const [warehouseId, setWarehouseId] = useState<string>(editProductData?.warehouseId || '');

  // Step 4 & 5: Product Title & Description
  const [titleBn, setTitleBn] = useState(editProductData?.titleBn || '');
  const [title, setTitle] = useState(editProductData?.title || '');
  const [descriptionBn, setDescriptionBn] = useState(editProductData?.descriptionBn || editProductData?.description || '');

  // Step 8: Images
  const [images, setImages] = useState<string[]>(
    editProductData?.images && editProductData.images.length > 0
      ? editProductData.images
      : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800']
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Clothing & Fashion Variants
  const [variants, setVariants] = useState<ProductVariant[]>(editProductData?.variants || []);

  // Step 9: Unit & Stock
  const [unit, setUnit] = useState(editProductData?.unit || 'piece');
  const [stock, setStock] = useState<number | ''>(editProductData?.stock ?? editProductData?.stockQuantity ?? 50);

  // Step 6 & 7: Pricing & Automatic PV Calculation
  const [mrp, setMrp] = useState<number | ''>(editProductData?.mrp ?? 1000);
  const [dealerPrice, setDealerPrice] = useState<number | ''>(editProductData?.dealerPrice ?? 800);
  const [discountPrice, setDiscountPrice] = useState<number | ''>(editProductData?.discountPrice ?? editProductData?.campaignPrice ?? '');
  const [vatTax, setVatTax] = useState<number | ''>(editProductData?.vatTax ?? '');
  const [warranty, setWarranty] = useState(editProductData?.warranty || '');
  const [expiryDate, setExpiryDate] = useState(editProductData?.expiryDate || '');

  // Step 10: Location, Shop & Dealer Details
  const userShopName = currentUser?.fullName ? `${currentUser.fullName} - ডিলার শপ` : 'TOMSHOPBD প্রাইম আউটলেট';
  const [shopName, setShopName] = useState(editProductData?.vendorShopName || userShopName);
  
  const userMarketName = currentUser?.mandatoryAddress?.marketBazar || markets[0]?.nameBn || 'মিরপুর ১০ কেন্দ্রীয় বাজার';
  const [marketBazar, setMarketBazar] = useState(editProductData?.marketBazar || userMarketName);

  const defaultMapsUrl = currentUser?.mandatoryAddress?.fullServiceAddress 
    ? `https://maps.google.com/?q=${encodeURIComponent(currentUser.mandatoryAddress.fullServiceAddress)}`
    : 'https://maps.google.com/?q=23.8069,90.3687';
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editProductData?.googleMapsUrl || defaultMapsUrl);

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const isClothing = isClothingCategory(
    selectedCategoryObj?.name,
    categoryId,
    selectedCategoryObj?.nameBn
  );

  // Brand Request Modal State
  const [showBrandRequestModal, setShowBrandRequestModal] = useState(false);
  const [reqBrandName, setReqBrandName] = useState('');
  const [reqBrandType, setReqBrandType] = useState<'National/Established Brand' | 'Local Brand' | 'Other Brand'>('Local Brand');
  const [reqCountry, setReqCountry] = useState('Bangladesh');
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState<string | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Super Admin Product Discount Override State
  const [isOverrideDiscount, setIsOverrideDiscount] = useState<boolean>(
    Boolean(editProductData?.isDiscountOverridden && Number(editProductData?.discount) > 0)
  );
  const [overrideDiscountPercent, setOverrideDiscountPercent] = useState<string>(
    editProductData?.isDiscountOverridden && Number(editProductData?.discount) > 0
      ? String(editProductData.discount)
      : ''
  );

  // Full-Featured Product VAT / Tax Pricing State
  const [vatPricingValues, setVatPricingValues] = useState<ProductVatPricingValues>(() => {
    const global = getStoredGlobalVatSettings();
    return {
      mrpExclTax: 1000,
      mrpInclTax: 1150,
      sellingPriceExclTax: 900,
      sellingPriceInclTax: 1035,
      taxRate: global.defaultVatRate,
      taxMode: global.defaultVatMode || 'included',
      taxSource: 'global',
      discount: 10,
      discountAmount: 100,
      isManualOverride: false
    };
  });

  useEffect(() => {
    if (isOpen) {
      if (editProductData) {
        setCategoryId(editProductData.categoryId || '');
        setSubCategory(editProductData.subCategory || '');
        setBrandId(editProductData.brandId || '');
        setWarehouseId(editProductData.warehouseId || '');
        setTitleBn(editProductData.titleBn || '');
        setTitle(editProductData.title || '');
        setDescriptionBn(editProductData.descriptionBn || editProductData.description || '');
        setImages(
          editProductData.images && editProductData.images.length > 0
            ? editProductData.images
            : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800']
        );
        setUnit(editProductData.unit || 'kg');
        setStock(editProductData.stock ?? editProductData.stockQuantity ?? 50);
        setMrp(editProductData.mrp ?? 1000);
        setDealerPrice(editProductData.dealerPrice ?? 800);
        setVatTax(editProductData.vatTax ?? '');
        setWarranty(editProductData.warranty || '');
        setExpiryDate(editProductData.expiryDate || '');
        const isOverridden = Boolean(editProductData.isDiscountOverridden === true || editProductData.discount_scope === 'product');
        setIsOverrideDiscount(isOverridden);
        setOverrideDiscountPercent(
          isOverridden && editProductData.discount !== undefined ? String(editProductData.discount) : ''
        );

        // Resolve complete VAT pricing
        const resolved = resolveProductVatPricing(editProductData);
        setVatPricingValues({
          mrpExclTax: resolved.mrpExclTax,
          mrpInclTax: resolved.mrpInclTax,
          sellingPriceExclTax: resolved.sellingPriceExclTax,
          sellingPriceInclTax: resolved.sellingPriceInclTax,
          taxRate: resolved.effectiveVatRate,
          taxMode: resolved.vatTaxMode,
          taxSource: resolved.taxSource,
          discount: resolved.discountPercentage,
          discountAmount: resolved.discountAmount,
          isManualOverride: resolved.isManualOverride
        });
      } else {
        setCategoryId('');
        setSubCategory('');
        setBrandId('');
        setWarehouseId('');
        setTitleBn('');
        setTitle('');
        setDescriptionBn('');
        setImages(['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800']);
        setUnit('kg');
        setStock(50);
        setMrp(1000);
        setDealerPrice(800);
        setVatTax('');
        setWarranty('');
        setExpiryDate('');
        setIsOverrideDiscount(false);
        setOverrideDiscountPercent('');

        const global = getStoredGlobalVatSettings();
        setVatPricingValues({
          mrpExclTax: 1000,
          mrpInclTax: 1150,
          sellingPriceExclTax: 900,
          sellingPriceInclTax: 1035,
          taxRate: global.defaultVatRate,
          taxMode: global.defaultVatMode || 'included',
          taxSource: 'global',
          discount: 10,
          discountAmount: 100,
          isManualOverride: false
        });
      }
      setPricingSuccessMsg(null);
      setPricingError(null);
    }
  }, [isOpen, editProductData]);

  if (!isOpen) return null;

  // ==========================================
  // DEPENDENT FILTERING ENGINE
  // Category -> Subcategory -> Brand
  // ==========================================

  // Selected Category Object
  const availableSubCategories = getSubCategoriesByCategory(categoryId);

  // Dynamically Filter Brands strictly based on selected Category ID AND Subcategory
  const availableBrands = (categoryId && subCategory) ? getBrandsByCategoryAndSubCategory(categoryId, subCategory) : [];

  // Handle Category Change -> Reset Subcategory, Brand & Warehouse
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    setSubCategory('');
    setBrandId('');
    setWarehouseId('');
  };

  // Handle Subcategory Change -> Reset Brand & Warehouse
  const handleSubCategoryChange = (newSub: string) => {
    setSubCategory(newSub);
    setBrandId('');
    setWarehouseId('');
  };

  // Handle Brand Change -> Reset Warehouse
  const handleBrandChange = (newBrandId: string) => {
    setBrandId(newBrandId);
    setWarehouseId('');
  };

  // ==========================================
  // 3-LEVEL CENTRALIZED DISCOUNT & PRICING ENGINE
  // Hierarchy: Product Override > Category Discount > Global Discount
  // STRICT BUSINESS FORMULAS:
  // 1. Discount Amount = (MRP * Discount %) / 100
  // 2. Selling Price = MRP - Discount Amount
  // 3. Gross Profit = Selling Price - Dealer Price
  // 4. Admin Cost = Gross Profit * 20%
  // 5. Net Profit = Gross Profit - Admin Cost
  // 6. PV = Net Profit / 10
  // ==========================================
  const applicableDiscountInfo = getApplicableDiscount({
    id: editProductData?.id,
    categoryId: categoryId,
    category: selectedCategoryObj ? selectedCategoryObj.name : categoryId,
    categoryName: selectedCategoryObj ? selectedCategoryObj.nameBn : categoryId
  });

  const effectiveDiscountPercent = (isOverrideDiscount && isSuperAdmin)
    ? Math.min(100, Math.max(0, parseFloat(overrideDiscountPercent) || 0))
    : (vatPricingValues.discount !== undefined ? vatPricingValues.discount : applicableDiscountInfo.discountPercent);

  const numMrp = vatPricingValues.taxMode === 'included' ? vatPricingValues.mrpInclTax : vatPricingValues.mrpExclTax;
  const numDealerPrice = Number(dealerPrice) || 0;
  const sellingPrice = vatPricingValues.taxMode === 'included' ? vatPricingValues.sellingPriceInclTax : vatPricingValues.sellingPriceExclTax;

  const discountAmount = vatPricingValues.discountAmount;

  const isValidPrices = numMrp > 0 && numDealerPrice >= 0 && numDealerPrice <= sellingPrice;

  const calculatedProfit = (sellingPrice > 0 && numDealerPrice >= 0 && sellingPrice >= numDealerPrice)
    ? Math.max(0, Number((sellingPrice - numDealerPrice).toFixed(2)))
    : 0;
  const calculatedAdminCost = Number((calculatedProfit * 0.20).toFixed(2));
  const calculatedNetProfit = Math.max(0, Number((calculatedProfit - calculatedAdminCost).toFixed(2)));
  const calculatedPv = Number((calculatedNetProfit / 10).toFixed(2));
  const calculatedDiscountPercent = effectiveDiscountPercent;

  const handleVatPricingChange = (updates: Partial<ProductVatPricingValues & {
    mrp: number;
    sellingPrice: number;
    vatTax: number;
  }>) => {
    setVatPricingValues((prev) => {
      const next = { ...prev, ...updates };
      if (updates.mrp !== undefined) setMrp(updates.mrp);
      if (updates.vatTax !== undefined) setVatTax(updates.vatTax);
      return next;
    });
  };

  const handleUpdatePricingAndCommission = () => {
    setPricingError(null);
    setPricingSuccessMsg(null);

    if (numMrp <= 0) {
      setPricingError('এমআরপি মূল্য (MRP Price) অবশ্যই ০ (শূন্য)-এর চেয়ে বেশি হতে হবে।');
      return;
    }
    if (dealerPrice === '' || numDealerPrice < 0) {
      setPricingError('ডিলার ক্রয় মূল্য (Dealer Price) অবশ্যই ০ (শূন্য) বা তার বেশি হতে হবে।');
      return;
    }
    if (numDealerPrice > sellingPrice) {
      setPricingError(`ডিলার ক্রয় মূল্য (৳${numDealerPrice}) কার্যকর বিক্রয় মূল্যের (৳${sellingPrice}) চেয়ে বেশি হতে পারবে না।`);
      return;
    }

    setPricingSuccessMsg(`প্রাইসিং ও কমিশন কনফিগার সফল! MRP: ৳${numMrp} | Selling Price: ৳${sellingPrice} | Dealer: ৳${numDealerPrice} | Profit: ৳${calculatedProfit} | Admin Cost (20%): ৳${calculatedAdminCost} | Net Profit: ৳${calculatedNetProfit} | Discount: ${effectiveDiscountPercent}% (${isOverrideDiscount && isSuperAdmin ? 'Product Override' : applicableDiscountInfo.sourceLabel}) | PV: ${calculatedPv} PV`);
  };

  // Image Helpers
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    if (images.length > 1) {
      setImages(images.filter((_, i) => i !== index));
    }
  };

  // ==========================================
  // STRICT SUBMISSION VALIDATION
  // ==========================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (numMrp <= 0) {
      alert('এমআরপি মূল্য (MRP Price) অবশ্যই 0-এর চেয়ে বেশি হতে হবে');
      return;
    }
    if (dealerPrice === '' || numDealerPrice < 0) {
      alert('ডিলার ক্রয় মূল্য (Dealer Price) অবশ্যই 0 বা তার বেশি হতে হবে');
      return;
    }
    if (numDealerPrice > sellingPrice) {
      alert(`ডিলার ক্রয় মূল্য (৳${numDealerPrice}) কার্যকর বিক্রয় মূল্যের (৳${sellingPrice}) চেয়ে বেশি হতে পারবে না`);
      return;
    }

    // 1. Strict Hierarchy Validation via ProductMasterDatabase
    const hierarchyCheck = validateHierarchy(categoryId, subCategory, brandId);
    if (!hierarchyCheck.valid) {
      alert(`ত্রুটি: ${hierarchyCheck.reason}`);
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const brandObj = availableBrands.find((b) => b.id === brandId);

    // 4. Verify Titles
    if (!titleBn.trim() && !title.trim()) {
      alert('অনুগ্রহ করে পণ্যের বাংলা অথবা ইংরেজি নাম প্রদান করুন।');
      return;
    }

    // 5. Verify Prices
    if (numMrp <= 0 || numDealerPrice < 0) {
      alert('এমআরপি মূল্য শূন্যের চেয়ে বেশি এবং ডিলার প্রাইস ০ বা তার বেশি হতে হবে।');
      return;
    }

    if (numDealerPrice > sellingPrice) {
      alert(`সতর্কতা: ডিলার প্রাইস (৳${numDealerPrice}) কখনো বিক্রয় মূল্যের (৳${sellingPrice}) চেয়ে বেশি হতে পারে না!`);
      return;
    }

    const userRole = currentUser?.primaryRole || currentUser?.roles?.[0] || 'customer';
    const isAutoApproved = userRole === 'admin' || userRole === 'super_admin' || userRole === 'operations_partner';
    const initialApprovalStatus: 'Pending' | 'Approved' = isAutoApproved ? 'Approved' : 'Pending';

    const payload: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'reviewsCount' | 'rating'> = {
      title: title.trim() || titleBn.trim(),
      titleBn: titleBn.trim() || title.trim(),
      slug: (title || titleBn).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      categoryId,
      categoryName: catObj ? (catObj.nameBn || catObj.name) : '',
      subCategory,
      brandId,
      brandName: brandObj ? brandObj.name : 'Generic',
      sku: editProductData?.sku || `GBBD-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: editProductData?.barcode || `8809123${Math.floor(1000 + Math.random() * 9000)}`,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'],
      description: descriptionBn || title,
      descriptionBn,
      mrp: numMrp,
      mrpExclTax: vatPricingValues.mrpExclTax,
      mrpInclTax: vatPricingValues.mrpInclTax,
      dealerPrice: numDealerPrice,
      sellingPrice: sellingPrice,
      sellingPriceExclTax: vatPricingValues.sellingPriceExclTax,
      sellingPriceInclTax: vatPricingValues.sellingPriceInclTax,
      discountPrice: sellingPrice,
      discount: effectiveDiscountPercent,
      discount_percent: effectiveDiscountPercent,
      discountAmount: vatPricingValues.discountAmount,
      vatTax: vatPricingValues.taxRate,
      taxRate: vatPricingValues.taxRate,
      taxMode: vatPricingValues.taxMode,
      taxSource: vatPricingValues.taxSource,
      isManualOverride: vatPricingValues.isManualOverride,
      discount_scope: (isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0)
        ? 'product'
        : (applicableDiscountInfo.scope === 'none' ? 'global' : applicableDiscountInfo.scope),
      discount_source: (isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0)
        ? 'Product Override'
        : applicableDiscountInfo.sourceLabel,
      isDiscountOverridden: Boolean(isOverrideDiscount && isSuperAdmin && Number(overrideDiscountPercent) > 0),
      profit: calculatedProfit,
      adminCost: calculatedAdminCost,
      netProfit: calculatedNetProfit,
      campaignPrice: sellingPrice,
      warranty: warranty.trim() || undefined,
      expiryDate: expiryDate || undefined,
      pvValue: calculatedPv,
      pvPoint: calculatedPv,
      unit,
      stock: Number(stock) || 0,
      stockQuantity: Number(stock) || 0,
      vendorId: currentUser?.id || 'guest',
      vendorShopName: shopName,
      marketBazar,
      googleMapsUrl,
      addedByRole: userRole,
      isApproved: isAutoApproved,
      approvalStatus: initialApprovalStatus,
      status: isAutoApproved ? 'Published' : 'Pending',
      codAvailable: true,
      variants: isClothing ? variants : (editProductData?.variants || []),
      tags: [subCategory, brandObj.name].filter(Boolean)
    };

    if (editProductData) {
      editProduct(editProductData.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-emerald-800 to-teal-900 text-white sticky top-0 z-10 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {editProductData ? 'পণ্য সংশোধন (Product Editor)' : 'নতুন পণ্য এন্ট্রি ফরম (Add New Product)'}
              </h2>
              <p className="text-[11px] text-emerald-200">
                ডিপেন্ডেন্ট হায়ারার্কি: Category → Subcategory → Brand → Product
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          
          {/* DEPENDENT HIERARCHY BOX (Steps 1, 2, 3, 4) */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/30 to-emerald-50/50 dark:from-emerald-950/30 dark:via-neutral-900 dark:to-teal-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>ডিপেন্ডেন্ট ক্যাটালগ সিলেকশন (Category ➔ Subcategory ➔ Brand ➔ Warehouse)</span>
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold rounded-full">
                Strict Automatic Flow
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Step 1: Category */}
              <div>
                <label className="block text-neutral-800 dark:text-neutral-200 font-bold mb-1">
                  ১. ক্যাটাগরি (Category) <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
                  required
                >
                  <option value="">-- ক্যাটাগরি বেছে নিন --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Subcategory */}
              <div>
                <label className="block text-neutral-800 dark:text-neutral-200 font-bold mb-1">
                  ২. সাব-ক্যাটাগরি (Sub Category) <span className="text-red-500">*</span>
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                  disabled={!categoryId}
                  className={`w-full border rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 text-xs ${
                    !categoryId
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
                      : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                  }`}
                  required
                >
                  <option value="">
                    {!categoryId ? 'প্রথমে ক্যাটাগরি বাছুন' : '-- সাব-ক্যাটাগরি বেছে নিন --'}
                  </option>
                  {availableSubCategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                  {categoryId && availableSubCategories.length === 0 && (
                    <option value="" disabled>No sub-categories available</option>
                  )}
                </select>
              </div>

              {/* Step 3: Brand */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-800 dark:text-neutral-200 font-bold">
                    ৩. ব্র্যান্ড (Brand) <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBrandRequestModal(true)}
                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>আবেদন</span>
                  </button>
                </div>
                <select
                  value={brandId}
                  onChange={(e) => {
                    if (e.target.value === 'request_new') {
                      setShowBrandRequestModal(true);
                    } else {
                      handleBrandChange(e.target.value);
                    }
                  }}
                  disabled={!categoryId || !subCategory}
                  className={`w-full border rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 text-xs ${
                    !categoryId || !subCategory
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
                      : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                  }`}
                  required
                >
                  <option value="">
                    {!subCategory ? 'প্রথমে সাব-ক্যাটাগরি বাছুন' : '-- ব্র্যান্ড বেছে নিন --'}
                  </option>
                  {availableBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.brandType})
                    </option>
                  ))}
                  {categoryId && subCategory && availableBrands.length === 0 && (
                    <option value="" disabled>No brands available</option>
                  )}
                  {subCategory && (
                    <option value="request_new" className="font-bold text-emerald-700">
                      ➕ নতুন ব্র্যান্ডের আবেদন
                    </option>
                  )}
                </select>
              </div>

              {/* Step 4: Warehouse */}
              <div>
                <label className="block text-neutral-800 dark:text-neutral-200 font-bold mb-1">
                  ৪. ওয়্যারহাউজ (Warehouse) <span className="text-red-500">*</span>
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  disabled={!categoryId || !subCategory || !brandId}
                  className={`w-full border rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 text-xs ${
                    !categoryId || !subCategory || !brandId
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
                      : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                  }`}
                  required
                >
                  <option value="">
                    {!brandId ? 'প্রথমে ব্র্যান্ড বাছুন' : '-- ওয়্যারহাউজ বেছে নিন --'}
                  </option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.division})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Steps 4 & 5: Product Titles & Description */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-4">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>৪ ও ৫. পণ্যের নাম ও বিস্তারিত বিবরণ (Title & Description)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ৪.১. পণ্যের নাম (বাংলা) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titleBn}
                  onChange={(e) => setTitleBn(e.target.value)}
                  placeholder="যেমন: তীর ফর্টিফাইড সয়াবিন তেল ৫ লিটার"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ৪.২. Product Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Teer Fortified Soybean Oil 5L"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                ৫. পণ্যের বিস্তারিত বিবরণ (Product Description)
              </label>
              <textarea
                value={descriptionBn}
                onChange={(e) => setDescriptionBn(e.target.value)}
                rows={3}
                placeholder="পণ্যের গুণাগুণ, প্রিমিয়াম গ্রেড, উৎপাদন তারিখ ও ব্যবহারের নিয়ম..."
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Steps 6 & 7: Pricing & Commission Configuration */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>৬ ও ৭. মূল্য নির্ধারণ এবং ডিসকাউন্ট কনফিগারেশন (Pricing & Discount Configuration)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isOverrideDiscount && isSuperAdmin
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : applicableDiscountInfo.scope === 'category'
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-neutral-700'
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

            {pricingError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{pricingError}</span>
              </div>
            )}

            {pricingSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pricingSuccessMsg}</span>
              </div>
            )}

            {/* Super Admin Discount Override Section */}
            <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-emerald-600" />
                    সেন্ট্রালাইজড ডিসকাউন্ট আর্কিটেকচার (Super Admin Only)
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                    স্বাভাবিকভাবে পণ্যটি ক্যাটাগরি বা গ্লোবাল ডিসকাউন্ট অনুসরণ করে। শুধুমাত্র সুপার এডমিন স্বতন্ত্র ডিসকাউন্ট সেট করতে পারবেন।
                  </p>
                </div>

                {isSuperAdmin ? (
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition">
                    <input
                      id="modal-checkbox-override-discount"
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
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 select-none">
                      ডিসকাউন্ট ওভাররাইড করুন (Override)
                    </span>
                  </label>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>ডিসকাউন্ট নিয়ন্ত্রণ সুপার এডমিন কর্তৃক নির্ধারিত</span>
                  </div>
                )}
              </div>

              {/* Custom Discount Input for Super Admin */}
              {isSuperAdmin && isOverrideDiscount && (
                <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-full sm:w-64">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-neutral-300 mb-1">
                      কাস্টম ডিসকাউন্ট শতকরা হার (%) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="modal-input-product-override-discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={overrideDiscountPercent}
                        onChange={(e) => setOverrideDiscountPercent(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg px-3 py-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    এই পণ্যের জন্য ক্যাটাগরি/গ্লোবাল ডিসকাউন্ট বাতিল হয়ে <strong>{effectiveDiscountPercent}%</strong> কার্যকর হবে।
                  </div>
                </div>
              )}
            </div>

            {/* PRICING & VAT/TAX CALCULATION MATRIX */}
            <ProductVatPricingSection
              values={vatPricingValues}
              onChange={handleVatPricingChange}
              dealerPrice={numDealerPrice}
              onDealerPriceChange={(val) => setDealerPrice(val)}
            />

            {/* Commissions & PV Points Calculation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 5. Profit - READ-ONLY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                    গ্রস প্রফিট - Profit (৳)
                  </label>
                  <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Selling - Dealer
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${calculatedProfit}`}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-extrabold text-blue-600 dark:text-blue-400 text-xs cursor-not-allowed select-none"
                />
              </div>

              {/* 6. Administration Cost (20%) - READ-ONLY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                    অ্যাডমিন খরচ (Admin Cost 20%)
                  </label>
                  <span className="text-[10px] text-slate-500 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${calculatedAdminCost}`}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-extrabold text-neutral-600 dark:text-neutral-400 text-xs cursor-not-allowed select-none"
                />
              </div>

              {/* 7. Net Profit - READ-ONLY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                    নিট প্রফিট (Net Profit ৳)
                  </label>
                  <span className="text-[10px] text-teal-600 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Read-Only
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`৳ ${calculatedNetProfit}`}
                  className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-extrabold text-teal-600 dark:text-teal-400 text-xs cursor-not-allowed select-none"
                />
              </div>

              {/* 8. Network Marketing PV Point - READ-ONLY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-neutral-700 dark:text-neutral-300 font-bold text-xs">
                    Network Marketing PV Point
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Net Profit ÷ 10
                  </span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={`${calculatedPv} PV`}
                  className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-2.5 font-extrabold text-amber-700 dark:text-amber-400 text-xs cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Action Button & Formula Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <button
                type="button"
                onClick={handleUpdatePricingAndCommission}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>প্রাইসিং ও কমিশন ক্যালকুলেট করুন</span>
              </button>

              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                Formula: Selling = MRP - Discount | Gross Profit = Selling - Dealer | Net Profit = Profit - 20% | PV = Net ÷ 10
              </div>
            </div>

            {/* Optional Pricing Fields */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-semibold text-xs mb-1">
                  ডিসকাউন্ট প্রাইজ (Optional ৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="950"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-semibold text-xs mb-1">
                  VAT/Tax % (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={vatTax}
                  onChange={(e) => setVatTax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="5"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-semibold text-xs mb-1">
                  ওয়ারেন্টি (Optional)
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="যেমন: ১ বছরের ওয়ারেন্টি"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-neutral-400 font-semibold text-xs mb-1">
                  মেয়াদোত্তীর্ণ তারিখ (Expiry Date)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Step 8: Images Upload */}
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={10}
            label="৮. পণ্যের ছবি আপলোড ও গ্যালারি (Product Picture Gallery)"
          />

          {/* Clothing & Fashion Variant Matrix (Color + Size + Weight) */}
          {isClothing && (
            <ClothingVariantManager
              variants={variants}
              onChange={setVariants}
              basePrice={Number(sellingPrice) || 0}
              baseMrp={numMrp}
              productSlugOrSku={title || 'PROD'}
              onStockSumChange={(totalVariantStock) => {
                setStock(totalVariantStock);
              }}
            />
          )}

          {/* Step 9: Stock & Unit */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>৯. স্টক ও পরিমাপের একক (Unit & Stock Quantity)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ৯.১. পরিমাপের একক (Unit) <span className="text-red-500">*</span>
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold"
                  required
                >
                  <option value="kg">কেজী (kg)</option>
                  <option value="liter">লিটার (liter)</option>
                  <option value="piece">পিস (piece)</option>
                  <option value="packet">প্যাকেট (packet)</option>
                  <option value="gm">গ্রাম (gm)</option>
                  <option value="box">বক্স (box)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ৯.২. বর্তমানে মজুত স্টক পরিমাণ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 10: Location, Shop & Dealer Details */}
          <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 space-y-3">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>১০. শপ, বাজার ও লোকেশন ম্যাপিং (Location / Shop / Market Info)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ১০.১. শপ / ডিলার নাম
                </label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ১০.২. মার্কেট / বাজার
                </label>
                <input
                  type="text"
                  value={marketBazar}
                  onChange={(e) => setMarketBazar(e.target.value)}
                  placeholder="বাজারের নাম"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
                  ১০.৩. Google Maps Location URL
                </label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
            >
              বাতিল করুন
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-lg flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editProductData ? 'হালনাগাদ ডিরেক্টরি সংরক্ষণ করুন' : 'পণ্য জমা দিন (Save Product)'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Brand Request Modal for Dealers/Vendors */}
      {showBrandRequestModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-emerald-800 dark:text-emerald-400">
                নতুন ব্র্যান্ড অনুমোদনের আবেদন (Brand Request)
              </h3>
              <button
                type="button"
                onClick={() => setShowBrandRequestModal(false)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                ক্যাটাগরি: {selectedCategoryObj?.nameBn} ({selectedCategoryObj?.name})
              </div>
              <div className="font-bold text-emerald-800 dark:text-emerald-300">
                সাব-ক্যাটাগরি: {subCategory || 'নির্দিষ্ট নয়'}
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 pt-1">
                উক্ত সাব-ক্যাটাগরির অধীনে ব্র্যান্ডটি অনুমোদনের জন্য এডমিনের নিকট প্রেরিত হবে।
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-xs mb-1">
                  ব্র্যান্ড নাম (Brand Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reqBrandName}
                  onChange={(e) => setReqBrandName(e.target.value)}
                  placeholder="যেমন: ACI Pure Organic"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-xs mb-1">
                  ব্র্যান্ড টাইপ (Brand Type)
                </label>
                <select
                  value={reqBrandType}
                  onChange={(e) => setReqBrandType(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium text-xs"
                >
                  <option value="National/Established Brand">National/Established Brand</option>
                  <option value="Local Brand">Local Brand</option>
                  <option value="Other Brand">Other Brand</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-xs mb-1">
                  উৎপাদনকারী দেশ / স্থান (Country / Origin)
                </label>
                <input
                  type="text"
                  value={reqCountry}
                  onChange={(e) => setReqCountry(e.target.value)}
                  placeholder="যেমন: Bangladesh"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowBrandRequestModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-neutral-300 dark:border-neutral-700"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!reqBrandName.trim()) {
                    alert('অনুগ্রহ করে ব্র্যান্ডের নাম প্রদান করুন।');
                    return;
                  }
                  const res = requestNewBrand({
                    brandName: reqBrandName.trim(),
                    brandType: reqBrandType,
                    countryOfOrigin: reqCountry,
                    categoryId,
                    categoryName: selectedCategoryObj?.nameBn || selectedCategoryObj?.name || 'Category',
                    subCategory,
                    requestedByUserId: currentUser?.id || 'guest',
                    requestedByUserName: currentUser?.fullName || 'Dealer User',
                    requestedByUserRole: currentUser?.primaryRole || 'dealer'
                  });

                  if (res.success) {
                    setShowBrandRequestModal(false);
                    setReqBrandName('');
                  } else {
                    alert(res.message);
                  }
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 shadow"
              >
                আবেদন জমা দিন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
