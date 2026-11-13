/**
 * AANO BAZAR & TOMSHOPBD Pricing & PV Calculation Engine
 * 
 * Strict Business Rules:
 * 1. Customer-facing price visibility:
 *    Customer ONLY sees: MRP, Selling Price, Delivery Cost, VAT/Tax, PV, Total Amount.
 *    Customer NEVER sees: Dealer Price, Gross Profit, Admin Cost, Profit, or Internal Commission calculations.
 * 
 * 2. Pricing Formula:
 *    Discount Amount = MRP * Discount%
 *    Selling Price = MRP - Discount Amount
 * 
 * 3. PV Calculation Formula:
 *    Gross Profit = MRP - Dealer Price
 *    Admin Cost = Gross Profit * 20%
 *    PV Value = Gross Profit - Admin Cost
 *    PV = PV Value / 10
 *    (Delivery Charge, VAT/Tax, and Discount are NEVER part of PV calculation)
 * 
 * 4. 1 PV = ৳10
 *    Dynamic calculation for every product with consistent 2-decimal rounding.
 */

import {
  Product,
  ProductCategory,
  ProductVariant,
  ProductPaymentOptions,
  PaymentChargesConfig,
  CatalogDiscountSettings
} from '../types';
import {
  resolveProductVatPricing,
  round2,
  getStoredGlobalVatSettings,
  GlobalVatSettings
} from './vatPricingEngine';

export const DEFAULT_PRODUCT_PAYMENT_OPTIONS: ProductPaymentOptions = {
  nagad: true,
  bkash: true,
  rocket: true,
  bank: true,
  cod: true
};

export const DEFAULT_PAYMENT_CHARGES: PaymentChargesConfig = {
  codRate: 0,
  bkashRate: 1.8,
  nagadRate: 1.8,
  rocketRate: 1.8,
  bankRate: 0
};

export const DEFAULT_CATALOG_DISCOUNT_SETTINGS: CatalogDiscountSettings = {
  globalDiscountPercent: 0,
  categoryDiscounts: {}
};

export const getStoredDiscountSettings = (): CatalogDiscountSettings => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('tomshopbd_catalog_discount_settings');
      let baseSettings = DEFAULT_CATALOG_DISCOUNT_SETTINGS;
      if (saved) {
        baseSettings = { ...DEFAULT_CATALOG_DISCOUNT_SETTINGS, ...JSON.parse(saved) };
      }
      // Also sync from system_settings if globalDiscount is set there
      const sysSaved = localStorage.getItem('tomshopbd_system_settings');
      if (sysSaved) {
        const sys = JSON.parse(sysSaved);
        if (sys.globalDiscount !== undefined && (!saved || baseSettings.globalDiscountPercent === 0)) {
          baseSettings.globalDiscountPercent = Number(sys.globalDiscount) || 0;
        }
      }
      return baseSettings;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_CATALOG_DISCOUNT_SETTINGS;
};

export const saveStoredDiscountSettings = (settings: CatalogDiscountSettings): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('tomshopbd_catalog_discount_settings', JSON.stringify(settings));
      // Keep system_settings in sync
      const sysSaved = localStorage.getItem('tomshopbd_system_settings');
      if (sysSaved) {
        const sys = JSON.parse(sysSaved);
        sys.globalDiscount = settings.globalDiscountPercent;
        sys.discountSettings = settings;
        localStorage.setItem('tomshopbd_system_settings', JSON.stringify(sys));
      }
    }
  } catch (e) {
    // ignore
  }
};

export interface ApplicableDiscountResult {
  discountPercent: number;
  discountAmount: number;
  sellingPrice: number;
  scope: 'product' | 'category' | 'global' | 'none';
  sourceLabel: string;
  isOverridden: boolean;
}

export interface DiscountedPricingDetails {
  discountPercent: number;
  discountAmountExclTax: number;
  discountedSellingPriceExclTax: number;
  vatRate: number;
  vatAmount: number;
  finalSellingPriceInclTax: number;
  mrpInclTax: number;
  basePriceExclTax: number;
  totalDiscountAmount: number;
  profit: number;
  adminCost: number;
  netProfit: number;
  pv: number;
}

/**
 * Calculates pricing following the exact business rule:
 * Discount calculation base price = MRP Excluding VAT/Tax
 * 
 * MRP Excl VAT
 * -> Global Discount %
 * -> Discount Amount = MRP Excl VAT × Discount % / 100
 * -> Selling Price Excl VAT = MRP Excl VAT - Discount Amount
 * -> VAT Amount = Selling Price Excl VAT × VAT Rate / 100
 * -> Selling Price Incl VAT = Selling Price Excl VAT + VAT Amount
 */
export function calculateDiscountedProductPricing(
  product: Partial<Product>,
  discountPercent: number,
  customGlobalVatSettings?: GlobalVatSettings
): DiscountedPricingDetails {
  const globalVat = customGlobalVatSettings || getStoredGlobalVatSettings();
  const taxMode: 'included' | 'excluded' = product.taxMode || globalVat.defaultVatMode || 'included';
  const effectiveVatRate = !globalVat.enabled
    ? 0
    : product.taxSource === 'custom' && product.taxRate !== undefined
    ? Number(product.taxRate)
    : product.taxSource === 'custom' && product.vatTax !== undefined
    ? Number(product.vatTax)
    : globalVat.defaultVatRate;

  const rawMrp = Math.max(0, Number(product.mrp) || 0);

  // 1. Determine Base Price: MRP Excluding VAT/Tax (NEVER from previous selling price)
  let mrpExclTax: number;
  if (product.mrpExclTax !== undefined && Number(product.mrpExclTax) > 0) {
    mrpExclTax = round2(Number(product.mrpExclTax));
  } else if (taxMode === 'included') {
    mrpExclTax = effectiveVatRate > 0 ? round2(rawMrp / (1 + effectiveVatRate / 100)) : rawMrp;
  } else {
    mrpExclTax = round2(rawMrp);
  }

  // 2. Discount: MRP Excl. VAT -> Discount
  const safeDiscountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmountExclTax = round2((mrpExclTax * safeDiscountPct) / 100);

  // 3. Selling Price Excl VAT = MRP Excl VAT - Discount Amount
  const discountedSellingPriceExclTax = round2(mrpExclTax - discountAmountExclTax);

  // 4. VAT Amount = Selling Price Excl VAT × VAT Rate / 100
  const vatAmount = round2(discountedSellingPriceExclTax * (effectiveVatRate / 100));

  // 5. Final Selling Price Incl VAT = Selling Price Excl VAT + VAT Amount
  const finalSellingPriceInclTax = round2(discountedSellingPriceExclTax + vatAmount);

  // MRP Incl Tax for customer comparison
  const mrpInclTax = product.mrpInclTax !== undefined && Number(product.mrpInclTax) > 0
    ? round2(Number(product.mrpInclTax))
    : taxMode === 'included'
    ? round2(rawMrp)
    : round2(mrpExclTax + round2(mrpExclTax * (effectiveVatRate / 100)));

  const totalDiscountAmount = round2(Math.max(0, mrpInclTax - finalSellingPriceInclTax));

  // Dealer price & profit margins
  const dealerPrice = Math.max(0, Number(product.dealerPrice) || 0);
  const profit = round2(discountedSellingPriceExclTax - dealerPrice);
  let adminCost = 0;
  let netProfit = profit;
  let pv = 0;

  if (profit > 0) {
    adminCost = round2(profit * 0.20);
    netProfit = round2(profit - adminCost);
    pv = round2(netProfit / 10);
  }

  return {
    discountPercent: safeDiscountPct,
    discountAmountExclTax,
    discountedSellingPriceExclTax,
    vatRate: effectiveVatRate,
    vatAmount,
    finalSellingPriceInclTax,
    mrpInclTax,
    basePriceExclTax: mrpExclTax,
    totalDiscountAmount,
    profit,
    adminCost,
    netProfit,
    pv
  };
}

export interface CompleteProductPricingMetrics {
  mrpExclTax: number;
  mrpInclTax: number;
  vatOnMrp: number;
  discountPercent: number;
  discountAmount: number;
  sellingPriceExclTax: number;
  vatRate: number;
  vatAmount: number;
  sellingPriceInclTax: number;
  dealerPriceExclTax: number;
  effectiveDealerPrice: number;
  profit: number;
  adminCost: number;
  netProfit: number;
  pv: number;
  isLoss: boolean;
}

/**
 * Universal Pricing Calculation Engine for Dealer & Super Admin Dashboard
 * 
 * Strict Business Rule:
 * 1. Dealer inputs: MRP Price (Excl. VAT/Tax) and Dealer Price (Excl. VAT/Tax)
 * 2. Super Admin sets: Global Discount % and Global VAT/Tax % (Read-Only in Dealer UI)
 * 3. Selling Price Excl VAT = MRP Excl VAT - Global Discount Amount
 *    where Global Discount Amount = MRP Excl VAT × Global Discount % ÷ 100
 * 4. Selling VAT Amount = Selling Price Excl VAT × Global VAT % ÷ 100
 * 5. Selling Price Incl VAT = Selling Price Excl VAT + Selling VAT Amount
 * 6. MRP Incl VAT = MRP Excl VAT + (MRP Excl VAT × Global VAT % ÷ 100)
 * 7. Profit = Selling Price Excl. VAT - Dealer Price Excl. VAT (Negative if Selling < Dealer -> Warning Loss)
 * 8. Admin Cost (20%) = Profit > 0 ? Profit * 20% : 0
 * 9. Net Profit = Profit > 0 ? Profit - Admin Cost : Profit
 * 10. PV Point = Net Profit > 0 ? Net Profit / 10 : 0
 */
export function calculateCompleteProductPricing(
  mrpExclInput: number,
  discountPercentInput: number,
  vatRateInput?: number,
  dealerPriceInput?: number
): CompleteProductPricingMetrics {
  const globalVat = getStoredGlobalVatSettings();
  const effectiveVatRate = vatRateInput !== undefined
    ? Math.max(0, Number(vatRateInput) || 0)
    : (globalVat.enabled ? globalVat.defaultVatRate : 0);
  const safeDiscountPct = Math.min(100, Math.max(0, Number(discountPercentInput) || 0));
  const numMrpExcl = Math.max(0, round2(Number(mrpExclInput) || 0));

  // 1. MRP Incl VAT = MRP Excl VAT + VAT on MRP
  const vatOnMrp = round2(numMrpExcl * (effectiveVatRate / 100));
  const mrpInclTax = round2(numMrpExcl + vatOnMrp);

  // 2. Global Discount Amount = MRP Excl VAT × Global Discount % ÷ 100
  const discountAmount = round2((numMrpExcl * safeDiscountPct) / 100);

  // 3. Selling Price Excl VAT = MRP Excl VAT - Global Discount Amount
  const sellingPriceExclTax = round2(numMrpExcl - discountAmount);

  // 4. Selling VAT Amount = Selling Price Excl VAT × Global VAT % ÷ 100
  const vatAmount = round2(sellingPriceExclTax * (effectiveVatRate / 100));

  // 5. Selling Price Incl VAT = Selling Price Excl VAT + VAT Amount
  const sellingPriceInclTax = round2(sellingPriceExclTax + vatAmount);

  // 6. Dealer Price Excl VAT: Manually entered by Dealer (base/cost price)
  const dealerPriceExclTax = (dealerPriceInput !== undefined && !isNaN(Number(dealerPriceInput)) && Number(dealerPriceInput) >= 0)
    ? round2(Number(dealerPriceInput))
    : round2(sellingPriceExclTax * 0.8);

  // 7. Profit = Selling Price Excl. VAT - Dealer Price Excl. VAT
  // If Selling Price < Dealer Price, profit becomes negative (loss)
  const profit = round2(sellingPriceExclTax - dealerPriceExclTax);
  const isLoss = profit < 0;

  // 8. Admin Cost, Net Profit, PV
  let adminCost = 0;
  let netProfit = profit;
  let pv = 0;

  if (profit > 0) {
    adminCost = round2(profit * 0.20);
    netProfit = round2(profit - adminCost);
    pv = round2(netProfit / 10);
  }

  return {
    mrpExclTax: numMrpExcl,
    mrpInclTax,
    vatOnMrp,
    discountPercent: safeDiscountPct,
    discountAmount,
    sellingPriceExclTax,
    vatRate: effectiveVatRate,
    vatAmount,
    sellingPriceInclTax,
    dealerPriceExclTax,
    effectiveDealerPrice: dealerPriceExclTax,
    profit,
    adminCost,
    netProfit,
    pv,
    isLoss
  };
}

export interface DiscountEligibilityResult {
  isEligible: boolean;
  reason?: 'Product inactive' | 'Missing selling price' | 'Product override active' | 'Category discount active' | string;
}

/**
 * Determines whether a product has an EXPLICIT POSITIVE custom product-level discount override.
 * Business Rules:
 * 1. Global Discount % is the default discount for all active catalog products.
 * 2. 0%, null, undefined, empty value, or legacy override flags = NO ACTIVE OVERRIDE.
 * 3. Only an explicit positive custom product discount (> 0%) counts as an active product override.
 */
/**
 * Checks for a product-specific discount (individual override).
 * Returns the numeric discount percent if a valid product-specific discount exists, otherwise undefined.
 */
export function getProductSpecificDiscount(product?: Partial<Product> | null): number | undefined {
  if (!product) return undefined;

  // 1. Explicit override flag
  if (product.isDiscountOverridden === true && Number(product.discount) > 0) {
    return Math.min(100, Math.max(0, Number(product.discount)));
  }

  // 2. Explicit product scope
  if (product.discount_scope === 'product' && Number(product.discount) > 0) {
    return Math.min(100, Math.max(0, Number(product.discount)));
  }

  // 3. Product override source label
  if (product.discount_source === 'Product Override' && Number(product.discount) > 0) {
    return Math.min(100, Math.max(0, Number(product.discount)));
  }

  // 4. Dedicated productDiscount / individualDiscount property
  const dedicated = (product as any).productDiscount ?? (product as any).individualDiscount;
  if (dedicated !== undefined && dedicated !== null && dedicated !== '' && Number(dedicated) > 0) {
    return Math.min(100, Math.max(0, Number(dedicated)));
  }

  // 5. Product has a raw discount > 0 and is NOT marked as global or category
  const rawDiscount = product.discount;
  if (
    rawDiscount !== null &&
    rawDiscount !== undefined &&
    !isNaN(Number(rawDiscount)) &&
    Number(rawDiscount) > 0
  ) {
    const isTaggedGlobal =
      product.discount_scope === 'global' ||
      product.discount_source === 'Global';
    const isTaggedCategory =
      product.discount_scope === 'category' ||
      (typeof product.discount_source === 'string' && product.discount_source.startsWith('Category'));

    if (!isTaggedGlobal && !isTaggedCategory) {
      return Math.min(100, Math.max(0, Number(rawDiscount)));
    }
  }

  return undefined;
}

/**
 * Resolves a category-specific discount.
 * Returns the numeric discount percent if a valid category discount exists, otherwise undefined.
 */
export function getCategorySpecificDiscount(
  product?: Partial<Product> | null,
  category?: ProductCategory | string | number | null,
  customSettings?: CatalogDiscountSettings
): number | undefined {
  // If category is directly passed as a number
  if (typeof category === 'number' && !isNaN(category) && category > 0) {
    return Math.min(100, Math.max(0, category));
  }

  // If category is passed as an object with discount property
  if (category && typeof category === 'object') {
    const raw = (category as any).discount ?? (category as any).categoryDiscount ?? (category as any).discountPercent;
    if (raw !== undefined && !isNaN(Number(raw)) && Number(raw) > 0) {
      return Math.min(100, Math.max(0, Number(raw)));
    }
  }

  // Look up in categoryDiscounts settings
  const settings = customSettings || getStoredDiscountSettings();
  const categoryDiscounts = settings.categoryDiscounts || {};

  const catId = typeof category === 'string'
    ? category.trim()
    : (product?.categoryId || '').trim();
  const catName = (product?.categoryName || product?.category || '').trim();

  let foundVal: number | undefined;

  if (catId && categoryDiscounts[catId] !== undefined) {
    foundVal = Number(categoryDiscounts[catId]);
  } else if (catId && categoryDiscounts[catId.toLowerCase()] !== undefined) {
    foundVal = Number(categoryDiscounts[catId.toLowerCase()]);
  } else if (catName && categoryDiscounts[catName] !== undefined) {
    foundVal = Number(categoryDiscounts[catName]);
  } else if (catName && categoryDiscounts[catName.toLowerCase()] !== undefined) {
    foundVal = Number(categoryDiscounts[catName.toLowerCase()]);
  } else if (catId || catName) {
    const key = Object.keys(categoryDiscounts).find(
      (k) =>
        (catId && k.toLowerCase() === catId.toLowerCase()) ||
        (catName && k.toLowerCase() === catName.toLowerCase())
    );
    if (key && categoryDiscounts[key] !== undefined) {
      foundVal = Number(categoryDiscounts[key]);
    }
  }

  if (foundVal !== undefined && !isNaN(foundVal) && foundVal > 0) {
    return Math.min(100, Math.max(0, foundVal));
  }

  // Check if product was tagged with category scope and discount
  if (
    product?.discount_scope === 'category' &&
    product.discount !== undefined &&
    Number(product.discount) > 0
  ) {
    return Math.min(100, Math.max(0, Number(product.discount)));
  }

  return undefined;
}

/**
 * Resolves effective discount percent following the strict 4-level hierarchy:
 * 1. Product-specific discount
 * 2. Category-specific discount
 * 3. Global Catalog Discount (central fallback)
 * 4. 0% (fallback when no discount applies)
 *
 * @param product Product or partial product object
 * @param category Category object, category ID / name string, or numeric category discount
 * @param globalDiscount Numeric global discount percentage (or null/undefined to read from central settings)
 * @param customSettings Optional central discount settings override
 * @returns Effective discount percentage (0 - 100)
 */
export function getEffectiveDiscount(
  product?: Partial<Product> | null,
  category?: ProductCategory | string | number | null,
  globalDiscount?: number | null,
  customSettings?: CatalogDiscountSettings
): number {
  // 1. Product-specific discount
  const prodDiscount = getProductSpecificDiscount(product);
  if (prodDiscount !== undefined && prodDiscount > 0) {
    return prodDiscount;
  }

  // 2. Category-specific discount
  const catDiscount = getCategorySpecificDiscount(product, category, customSettings);
  if (catDiscount !== undefined && catDiscount > 0) {
    return catDiscount;
  }

  // 3. Global Catalog Discount
  const settings = customSettings || getStoredDiscountSettings();
  let effectiveGlobal: number | undefined;

  if (globalDiscount !== undefined && globalDiscount !== null && !isNaN(Number(globalDiscount))) {
    effectiveGlobal = Number(globalDiscount);
  } else {
    effectiveGlobal = Number(settings.globalDiscountPercent) || 0;
  }

  if (effectiveGlobal > 0) {
    return Math.min(100, Math.max(0, effectiveGlobal));
  }

  // 4. Default: 0%
  return 0;
}

/**
 * Returns true if an active product-level discount override is present (> 0%).
 */
export function hasActiveProductDiscountOverride(product: Partial<Product>): boolean {
  if (!product) return false;
  const prodDisc = getProductSpecificDiscount(product);
  return prodDisc !== undefined && prodDisc > 0;
}

/**
 * Checks if a product is eligible for Global Discount
 */
export function evaluateDiscountEligibility(
  product: Partial<Product>,
  discountSettings: CatalogDiscountSettings
): DiscountEligibilityResult {
  // 1. Status check: Active & Approved
  if (
    (product as any).isActive === false ||
    product.status === 'inactive' ||
    product.isApproved === false ||
    product.approvalStatus === 'Rejected'
  ) {
    return { isEligible: false, reason: 'Product inactive' };
  }

  // 2. Price check: positive price required
  const mrp = Number(product.mrp) || 0;
  const mrpExcl = Number(product.mrpExclTax) || 0;
  const excl = Number(product.sellingPriceExclTax) || 0;
  const incl = Number(product.sellingPriceInclTax) || 0;
  if (mrp <= 0 && mrpExcl <= 0 && excl <= 0 && incl <= 0) {
    return { isEligible: false, reason: 'Missing selling price' };
  }

  // 3. Product override check: is an explicit positive custom product discount override active?
  if (hasActiveProductDiscountOverride(product)) {
    const overrideVal = getProductSpecificDiscount(product);
    return { isEligible: false, reason: `Product override active (${overrideVal}%)` };
  }

  // 4. Category discount check: does the category have an active category discount (> 0)?
  const catDiscountVal = getCategorySpecificDiscount(product, undefined, discountSettings);
  if (catDiscountVal !== undefined && catDiscountVal > 0) {
    return { isEligible: false, reason: `Category discount active (${catDiscountVal}%)` };
  }

  return { isEligible: true };
}

export interface CatalogEligibilitySummary {
  totalCount: number;
  eligibleProducts: Product[];
  skippedProducts: { product: Product; reason: string }[];
  eligibleCount: number;
  skippedCount: number;
}

/**
 * Analyzes entire catalog for Global Discount eligibility
 */
export function analyzeCatalogDiscountEligibility(
  products: Product[],
  discountSettings: CatalogDiscountSettings
): CatalogEligibilitySummary {
  const eligibleProducts: Product[] = [];
  const skippedProducts: { product: Product; reason: string }[] = [];

  (products || []).forEach((p) => {
    const res = evaluateDiscountEligibility(p, discountSettings);
    if (res.isEligible) {
      eligibleProducts.push(p);
    } else {
      skippedProducts.push({ product: p, reason: res.reason || 'Skipped' });
    }
  });

  return {
    totalCount: (products || []).length,
    eligibleProducts,
    skippedProducts,
    eligibleCount: eligibleProducts.length,
    skippedCount: skippedProducts.length
  };
}

/**
 * Resolves discount following the strict four-level hierarchy:
 * 1. Product Discount (individual override)
 *    ↓
 * 2. Category Discount (for the product's category)
 *    ↓
 * 3. Global/Whole Catalog Discount (fallback)
 *    ↓
 * 4. 0% (default)
 */
export const resolveApplicableDiscount = (
  product: Partial<Product>,
  customDiscountSettings?: CatalogDiscountSettings
): ApplicableDiscountResult => {
  const settings = customDiscountSettings || getStoredDiscountSettings();

  // 1. Check Product-level individual override (must be active and positive)
  const prodDiscount = getProductSpecificDiscount(product);
  if (prodDiscount !== undefined && prodDiscount > 0) {
    const pricing = calculateDiscountedProductPricing(product, prodDiscount);
    return {
      discountPercent: prodDiscount,
      discountAmount: pricing.totalDiscountAmount,
      sellingPrice: pricing.finalSellingPriceInclTax,
      scope: 'product',
      sourceLabel: 'Product Override',
      isOverridden: true
    };
  }

  // 2. Check Category-level discount
  const catDiscountVal = getCategorySpecificDiscount(product, undefined, settings);
  if (catDiscountVal !== undefined && catDiscountVal > 0) {
    const catName = (product.categoryName || product.category || '').trim();
    const pricing = calculateDiscountedProductPricing(product, catDiscountVal);
    return {
      discountPercent: catDiscountVal,
      discountAmount: pricing.totalDiscountAmount,
      sellingPrice: pricing.finalSellingPriceInclTax,
      scope: 'category',
      sourceLabel: `Category (${catName || 'Category'})`,
      isOverridden: false
    };
  }

  // 3. Check Global / Whole Catalog discount
  const globalPercent = Number(settings.globalDiscountPercent) || 0;
  if (globalPercent > 0) {
    const safePercent = Math.min(100, Math.max(0, globalPercent));
    const pricing = calculateDiscountedProductPricing(product, safePercent);
    return {
      discountPercent: safePercent,
      discountAmount: pricing.totalDiscountAmount,
      sellingPrice: pricing.finalSellingPriceInclTax,
      scope: 'global',
      sourceLabel: 'Global',
      isOverridden: false
    };
  }

  // 4. Default: 0%
  const defaultPricing = calculateDiscountedProductPricing(product, 0);
  return {
    discountPercent: 0,
    discountAmount: 0,
    sellingPrice: defaultPricing.finalSellingPriceInclTax,
    scope: 'none',
    sourceLabel: 'None (0%)',
    isOverridden: false
  };
};

export const getStoredPaymentCharges = (): PaymentChargesConfig => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('aano_bazar_payment_charges');
      if (saved) return { ...DEFAULT_PAYMENT_CHARGES, ...JSON.parse(saved) };
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_PAYMENT_CHARGES;
};

export const saveStoredPaymentCharges = (config: PaymentChargesConfig): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('aano_bazar_payment_charges', JSON.stringify(config));
    }
  } catch (e) {
    // ignore
  }
};

export interface ProductPricingCalculation {
  mrp: number;
  dealerPrice?: number;
  discountPercent: number;
  discountAmount: number;
  sellingPrice: number;
  deliveryCost: number;
  vatTaxPercent: number;
  vatTaxAmount: number;

  // Detailed VAT & Tax Architecture
  mrpExclTax: number;
  mrpInclTax: number;
  sellingPriceExclTax: number;
  sellingPriceInclTax: number;
  taxMode: 'included' | 'excluded';
  taxSource: 'global' | 'custom';
  
  // Internal values (never display to customer)
  grossProfit: number;
  adminCost: number;
  pvValue: number;
  pv: number;

  // Multiplied by Quantity
  quantity: number;
  totalMrp: number;
  totalDiscount: number;
  totalSellingPrice: number;
  totalPv: number;
  totalVatTax: number;
  totalDeliveryCost: number;
  totalAmount: number;
}

/**
 * Calculates Gross Profit = Selling Price - Dealer Price
 * Strictly uses Selling Price (not MRP). Dealer Price is NOT used for discount calculation.
 */
export const calculateGrossProfit = (sellingPrice: number, dealerPrice: number): number => {
  if (!sellingPrice || dealerPrice === undefined || dealerPrice === null || sellingPrice <= dealerPrice) return 0;
  return Math.max(0, Number((sellingPrice - dealerPrice).toFixed(2)));
};

/**
 * Calculates Admin Cost = Gross Profit * 20%
 */
export const calculateAdminCost = (grossProfit: number): number => {
  if (!grossProfit || grossProfit <= 0) return 0;
  return Number((grossProfit * 0.20).toFixed(2));
};

/**
 * Calculates PV Value = Gross Profit - Admin Cost
 */
export const calculatePvValue = (grossProfit: number): number => {
  if (!grossProfit || grossProfit <= 0) return 0;
  const adminCost = calculateAdminCost(grossProfit);
  return Number((grossProfit - adminCost).toFixed(2));
};

/**
 * Calculates Point Value (PV) = PV Value / 10
 * Formula: ((Selling Price - Dealer Price) - 20% Admin Cost) / 10
 * 
 * Note: Delivery charge, VAT/Tax, and Payment Charge are strictly excluded from PV calculation.
 */
export const calculatePV = (sellingPrice: number, dealerPrice: number): number => {
  if (!sellingPrice || dealerPrice === undefined || dealerPrice === null || sellingPrice <= dealerPrice) return 0;
  const grossProfit = calculateGrossProfit(sellingPrice, dealerPrice);
  const pvVal = calculatePvValue(grossProfit);
  const pv = pvVal / 10;
  return Math.round((pv + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates Customer Discount Amount & Selling Price from MRP
 * Formula:
 * Selling Price = MRP - (MRP * Discount %)
 * Discount Amount = MRP - Selling Price
 * Discount % = ((MRP - Selling Price) / MRP) * 100
 * Dealer Price is NEVER used for discount calculation.
 */
export const calculateDiscountAndSellingPrice = (
  mrp: number,
  discount?: number,
  campaignPrice?: number,
  variantPrice?: number
): { discountPercent: number; discountAmount: number; sellingPrice: number } => {
  const safeMrp = Math.max(0, Number(mrp) || 0);

  // If a variant price is explicitly supplied
  if (variantPrice !== undefined && variantPrice > 0) {
    const sellingPrice = variantPrice;
    const discountAmount = Math.max(0, Number((safeMrp - sellingPrice).toFixed(2)));
    const discountPercent = safeMrp > 0 ? Number(((discountAmount / safeMrp) * 100).toFixed(2)) : 0;
    return { discountPercent, discountAmount, sellingPrice };
  }

  // If discount is explicitly provided (including 0)
  if (discount !== undefined) {
    const numDiscount = Number(discount) || 0;
    if (numDiscount <= 0) {
      return {
        discountPercent: 0,
        discountAmount: 0,
        sellingPrice: safeMrp
      };
    }
    if (numDiscount <= 100) {
      const discountPercent = numDiscount;
      const discountAmount = Number(((safeMrp * discountPercent) / 100).toFixed(2));
      const sellingPrice = Math.max(0, Number((safeMrp - discountAmount).toFixed(2)));
      return { discountPercent, discountAmount, sellingPrice };
    } else {
      // If discount is given as flat amount (greater than 100)
      const discountAmount = Math.min(safeMrp, numDiscount);
      const discountPercent = safeMrp > 0 ? Number(((discountAmount / safeMrp) * 100).toFixed(2)) : 0;
      const sellingPrice = Math.max(0, Number((safeMrp - discountAmount).toFixed(2)));
      return { discountPercent, discountAmount, sellingPrice };
    }
  }

  // If campaign price is provided (only when discount is undefined)
  if (campaignPrice !== undefined && campaignPrice > 0 && campaignPrice < safeMrp) {
    const sellingPrice = campaignPrice;
    const discountAmount = Number((safeMrp - sellingPrice).toFixed(2));
    const discountPercent = safeMrp > 0 ? Number(((discountAmount / safeMrp) * 100).toFixed(2)) : 0;
    return { discountPercent, discountAmount, sellingPrice };
  }

  // Default: full MRP, zero discount
  return {
    discountPercent: 0,
    discountAmount: 0,
    sellingPrice: safeMrp
  };
};

/**
 * Complete Product Pricing Calculator for a Product & Quantity
 */
export const calculateProductPricing = (
  product: Partial<Product>,
  quantity = 1,
  selectedVariant?: ProductVariant,
  customDiscountSettings?: CatalogDiscountSettings
): ProductPricingCalculation => {
  const safeQty = Math.max(1, Number(quantity) || 1);
  const safeMrp = Math.max(0, Number(product.mrp) || 0);
  const mrp = safeMrp;
  const dealerPrice = product.dealerPrice !== undefined ? Number(product.dealerPrice) : undefined;
  
  // Resolve effective discount through hierarchy:
  // 1. Product Override -> 2. Category Discount -> 3. Global Discount -> 4. 0%
  const resolved = resolveApplicableDiscount(product, customDiscountSettings);
  const discountPercent = resolved.discountPercent;

  let sellingPrice = resolved.sellingPrice;
  let discountAmount = resolved.discountAmount;

  if (selectedVariant?.price !== undefined && selectedVariant.price > 0) {
    sellingPrice = selectedVariant.price;
    discountAmount = Math.max(0, Number((safeMrp - sellingPrice).toFixed(2)));
  }

  // Calculate PV based on Selling Price & Dealer Price:
  // Gross Profit = Selling Price - Dealer Price
  // Admin Cost = Gross Profit * 20%
  // PV Value = Gross Profit - Admin Cost
  // PV = PV Value / 10
  let pv = 0;
  let grossProfit = 0;
  let adminCost = 0;
  let pvVal = 0;

  if (dealerPrice !== undefined && dealerPrice >= 0 && sellingPrice > dealerPrice) {
    grossProfit = calculateGrossProfit(sellingPrice, dealerPrice);
    adminCost = calculateAdminCost(grossProfit);
    pvVal = calculatePvValue(grossProfit);
  }

  if (product.pvMode === 'manual' && product.manualPv !== undefined && !isNaN(product.manualPv)) {
    pv = Math.round((Number(product.manualPv) + Number.EPSILON) * 100) / 100;
  } else if (dealerPrice !== undefined && dealerPrice >= 0 && sellingPrice > dealerPrice) {
    pv = calculatePV(sellingPrice, dealerPrice);
  } else if (product.pvValue !== undefined && product.pvValue > 0) {
    pv = Math.round((Number(product.pvValue) + Number.EPSILON) * 100) / 100;
  } else if (product.pvPoint !== undefined && product.pvPoint > 0) {
    pv = Math.round((Number(product.pvPoint) + Number.EPSILON) * 100) / 100;
  }

  // Delivery Cost
  const deliveryCost = product.deliveryCost !== undefined
    ? Number(product.deliveryCost)
    : (product.serviceCharge !== undefined ? Number(product.serviceCharge) : 60);

  // Accurate VAT/Tax Metrics
  const vatMetrics = resolveProductVatPricing(
    { ...product, mrp, campaignPrice: sellingPrice },
    undefined,
    safeQty
  );
  const vatTaxPercent = vatMetrics.effectiveVatRate;
  const vatTaxAmount = vatMetrics.sellingTaxAmount;

  // Totals for quantity
  const totalMrp = mrp * safeQty;
  const totalDiscount = discountAmount * safeQty;
  const totalSellingPrice = sellingPrice * safeQty;
  const totalPv = Math.round((pv * safeQty + Number.EPSILON) * 100) / 100;
  const totalVatTax = vatMetrics.totalTaxAmount;
  const totalDeliveryCost = deliveryCost; // Standard delivery charge per order
  const totalAmount = vatMetrics.vatTaxMode === 'included'
    ? totalSellingPrice + totalDeliveryCost
    : totalSellingPrice + totalDeliveryCost + totalVatTax;

  return {
    mrp,
    dealerPrice,
    discountPercent,
    discountAmount,
    sellingPrice,
    deliveryCost,
    vatTaxPercent,
    vatTaxAmount,

    mrpExclTax: vatMetrics.mrpExclTax,
    mrpInclTax: vatMetrics.mrpInclTax,
    sellingPriceExclTax: vatMetrics.sellingPriceExclTax,
    sellingPriceInclTax: vatMetrics.sellingPriceInclTax,
    taxMode: vatMetrics.vatTaxMode,
    taxSource: vatMetrics.taxSource,

    grossProfit,
    adminCost,
    pvValue: pvVal,
    pv,

    quantity: safeQty,
    totalMrp,
    totalDiscount,
    totalSellingPrice,
    totalPv,
    totalVatTax,
    totalDeliveryCost,
    totalAmount
  };
};

export interface PaymentChargeResult {
  rate: number;
  percentText: string;
  charge: number;
}

/**
 * Calculates Payment Gateway Charge dynamically based on Subtotal:
 * Subtotal = Selling Price + Delivery Cost + VAT/Tax
 * 
 * - COD (Cash on Delivery): 0% (Charge = ৳0, configurable)
 * - Wallet (TOMOK Wallet): 0% (Charge = ৳0)
 * - bKash: 1.8% (Charge = Subtotal * 1.8%, configurable)
 * - Rocket: 1.8% (Charge = Subtotal * 1.8%, configurable)
 * - Nagad: 1.8% (Charge = Subtotal * 1.8%, configurable)
 * - Bank Payment: 0% (Charge = Subtotal * bankRate%, configurable)
 */
export const calculatePaymentCharge = (
  subtotal: number,
  paymentMethod: string,
  customCharges?: PaymentChargesConfig
): PaymentChargeResult => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const charges = customCharges || getStoredPaymentCharges();

  if (paymentMethod === 'online_bkash' || paymentMethod === 'bkash') {
    const rate = charges.bkashRate / 100;
    const charge = Number((safeSubtotal * rate).toFixed(2));
    return { rate, percentText: `${charges.bkashRate}%`, charge };
  }

  if (paymentMethod === 'online_nagad' || paymentMethod === 'nagad') {
    const rate = charges.nagadRate / 100;
    const charge = Number((safeSubtotal * rate).toFixed(2));
    return { rate, percentText: `${charges.nagadRate}%`, charge };
  }

  if (paymentMethod === 'online_rocket' || paymentMethod === 'rocket') {
    const rate = charges.rocketRate / 100;
    const charge = Number((safeSubtotal * rate).toFixed(2));
    return { rate, percentText: `${charges.rocketRate}%`, charge };
  }

  if (paymentMethod === 'bank_transfer' || paymentMethod === 'bank') {
    const rate = (charges.bankRate || 0) / 100;
    const charge = Number((safeSubtotal * rate).toFixed(2));
    return { rate, percentText: `${charges.bankRate || 0}%`, charge };
  }

  if (paymentMethod === 'cod') {
    const rate = (charges.codRate || 0) / 100;
    const charge = Number((safeSubtotal * rate).toFixed(2));
    return { rate, percentText: `${charges.codRate || 0}%`, charge };
  }

  return { rate: 0, percentText: '0%', charge: 0 };
};

/**
 * Returns the effective payment options configured for a product
 */
export const getProductPaymentOptions = (product?: Partial<Product> | null): ProductPaymentOptions => {
  if (!product || !product.paymentOptions) {
    return { ...DEFAULT_PRODUCT_PAYMENT_OPTIONS };
  }
  return {
    nagad: product.paymentOptions.nagad !== false,
    bkash: product.paymentOptions.bkash !== false,
    rocket: product.paymentOptions.rocket !== false,
    bank: product.paymentOptions.bank !== false,
    cod: product.paymentOptions.cod !== false,
  };
};

/**
 * Validates available payment methods across multiple products in an order.
 * A payment method is available only if ALL products in the cart allow it.
 */
export const getOrderAvailablePaymentMethods = (
  products: (Product | Partial<Product> | undefined | null)[]
): { cod: boolean; bkash: boolean; nagad: boolean; rocket: boolean; bank: boolean } => {
  const validProducts = products.filter((p): p is Product | Partial<Product> => !!p);
  if (validProducts.length === 0) {
    return { cod: true, bkash: true, nagad: true, rocket: true, bank: true };
  }

  return {
    cod: validProducts.every((p) => getProductPaymentOptions(p).cod),
    bkash: validProducts.every((p) => getProductPaymentOptions(p).bkash),
    nagad: validProducts.every((p) => getProductPaymentOptions(p).nagad),
    rocket: validProducts.every((p) => getProductPaymentOptions(p).rocket),
    bank: validProducts.every((p) => getProductPaymentOptions(p).bank),
  };
};

/**
 * Formats BDT currency with exact 2 decimals if fraction exists (e.g. ৳1,649.16 or ৳29.16)
 * and integer if clean (e.g. ৳1,620 or ৳60)
 */
export const formatPrice = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '৳0';
  const num = Number(val);
  const hasDecimals = num % 1 !== 0;
  return (
    '৳' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    })
  );
};

/**
 * Format PV with consistent decimal representation (e.g. "40", "7.2", "18.4")
 */
export const formatPV = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return rounded.toString();
};

/**
 * Strip internal dealer price and profit metrics from product object for customer views
 */
export const sanitizeProductForCustomer = (product: Product): Product => {
  const sanitized = { ...product };
  delete (sanitized as any).dealerPrice;
  delete (sanitized as any).costPrice;
  delete (sanitized as any).grossProfit;
  delete (sanitized as any).adminCost;
  delete (sanitized as any).profit;
  delete (sanitized as any).netProfit;
  delete (sanitized as any).vendorCost;
  return sanitized;
};
