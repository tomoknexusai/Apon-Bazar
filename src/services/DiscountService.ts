/**
 * Centralized Discount Service
 * Project: Apon Bazar
 * 
 * CORE BUSINESS RULES:
 * 1. Priority Hierarchy:
 *    Priority 1: Product-specific discount (individual override)
 *    Priority 2: Category-specific discount
 *    Priority 3: Global Catalog Discount (from SystemSettings / central config)
 *    Priority 4: Fallback to 0% (when no discount applies)
 * 
 * 2. Mathematical Consistency:
 *    discountAmount = (originalPrice * effectiveDiscount) / 100
 *    finalPrice = Math.max(0, originalPrice - discountAmount)
 * 
 * 3. Dynamic Application:
 *    Used across Product Listing, Product Card, Details Modal, Search,
 *    Cart, Checkout, and Order Summary so prices never mismatch.
 */

import { Product, ProductCategory, CatalogDiscountSettings, SystemSettings } from '../types';
import {
  getStoredDiscountSettings,
  saveStoredDiscountSettings,
  getProductSpecificDiscount,
  getCategorySpecificDiscount,
  hasActiveProductDiscountOverride
} from '../lib/pricing';

export interface EffectiveDiscountResolution {
  effectiveDiscount: number;
  discountScope: 'product' | 'category' | 'global' | 'none';
  discountSource: string;
  isOverridden: boolean;
  productDiscount?: number;
  categoryDiscount?: number;
  globalDiscount: number;
}

export interface DiscountedPriceBreakdown {
  originalPrice: number;
  effectiveDiscount: number;
  discountAmount: number;
  finalPrice: number;
  savings: number;
  discountScope: 'product' | 'category' | 'global' | 'none';
  discountSource: string;
}

export function isSystemSettingsObject(val: any): val is SystemSettings {
  return (
    val !== null &&
    typeof val === 'object' &&
    ('companyName' in val || 'globalDiscount' in val || 'companyMasterId' in val || 'currencySymbol' in val)
  );
}

/**
 * Resolves the numeric global discount percentage from:
 * 1. Direct number (e.g. systemSettings.globalDiscount)
 * 2. SystemSettings object (systemSettings.globalDiscount or systemSettings.discountSettings.globalDiscountPercent)
 * 3. CatalogDiscountSettings object (discountSettings.globalDiscountPercent)
 * 4. Stored local settings fallback
 */
export function resolveGlobalDiscountValue(
  globalDiscountInput?: number | SystemSettings | CatalogDiscountSettings | null
): number {
  if (globalDiscountInput !== undefined && globalDiscountInput !== null) {
    if (typeof globalDiscountInput === 'number' && !isNaN(globalDiscountInput)) {
      return Math.min(100, Math.max(0, globalDiscountInput));
    }
    if (typeof globalDiscountInput === 'object') {
      // Check SystemSettings.globalDiscount
      if ('globalDiscount' in globalDiscountInput && typeof (globalDiscountInput as any).globalDiscount === 'number') {
        const val = Number((globalDiscountInput as any).globalDiscount);
        if (!isNaN(val)) return Math.min(100, Math.max(0, val));
      }
      // Check SystemSettings.discountSettings
      if ('discountSettings' in globalDiscountInput && (globalDiscountInput as any).discountSettings) {
        const val = Number((globalDiscountInput as any).discountSettings.globalDiscountPercent);
        if (!isNaN(val)) return Math.min(100, Math.max(0, val));
      }
      // Check CatalogDiscountSettings.globalDiscountPercent directly
      if ('globalDiscountPercent' in globalDiscountInput) {
        const val = Number((globalDiscountInput as any).globalDiscountPercent);
        if (!isNaN(val)) return Math.min(100, Math.max(0, val));
      }
    }
  }

  // Fallback to central stored configuration
  try {
    const stored = getStoredDiscountSettings();
    return Math.min(100, Math.max(0, Number(stored.globalDiscountPercent) || 0));
  } catch {
    return 0;
  }
}

/**
 * Centralized getEffectiveDiscount function
 * Implements strict priority: Product-specific > Category-specific > Global discount (fallback to 0%).
 * 
 * Supports both standard signatures:
 * 1. getEffectiveDiscount(product, globalDiscountFromSettings, category?)
 *    e.g. getEffectiveDiscount(product, systemSettings.globalDiscount)
 *    e.g. getEffectiveDiscount(product, systemSettings)
 * 2. getEffectiveDiscount(product, category?, globalDiscount?)
 * 
 * Accepts:
 * @param product Product or partial product record
 * @param arg2 Current global discount (number/SystemSettings) OR category (string/ProductCategory)
 * @param arg3 Category OR global discount (depending on arg2)
 * @returns Effective discount percentage (0 to 100)
 */
export function getEffectiveDiscount(
  product?: Partial<Product> | null,
  arg2?: number | SystemSettings | CatalogDiscountSettings | ProductCategory | string | null,
  arg3?: number | SystemSettings | CatalogDiscountSettings | ProductCategory | string | null
): number {
  if (!product) return 0;

  // Resolve polymorphic arguments
  let globalDiscountInput: number | SystemSettings | CatalogDiscountSettings | null | undefined;
  let categoryInput: ProductCategory | string | number | null | undefined;

  if (typeof arg2 === 'number' || isSystemSettingsObject(arg2)) {
    globalDiscountInput = arg2 as any;
    categoryInput = arg3 as any;
  } else if (typeof arg3 === 'number' || isSystemSettingsObject(arg3)) {
    globalDiscountInput = arg3 as any;
    categoryInput = arg2 as any;
  } else if (typeof arg2 === 'string' || (arg2 && typeof arg2 === 'object' && ('nameBn' in arg2 || 'subCategories' in arg2))) {
    categoryInput = arg2 as any;
    globalDiscountInput = arg3 as any;
  } else {
    globalDiscountInput = arg2 as any;
    categoryInput = arg3 as any;
  }

  // PRIORITY 1: Product-specific discount
  const prodDiscount = getProductSpecificDiscount(product);
  if (prodDiscount !== undefined && prodDiscount > 0) {
    return prodDiscount;
  }

  // PRIORITY 2: Category-specific discount
  let catSettings: CatalogDiscountSettings | undefined;
  if (globalDiscountInput && typeof globalDiscountInput === 'object') {
    if ('categoryDiscounts' in globalDiscountInput) {
      catSettings = globalDiscountInput as CatalogDiscountSettings;
    } else if ('discountSettings' in globalDiscountInput && (globalDiscountInput as any).discountSettings) {
      catSettings = (globalDiscountInput as any).discountSettings;
    }
  }
  const catDiscount = getCategorySpecificDiscount(product, categoryInput, catSettings);
  if (catDiscount !== undefined && catDiscount > 0) {
    return catDiscount;
  }

  // PRIORITY 3: Global Catalog Discount (central fallback from SystemSettings)
  const resolvedGlobal = resolveGlobalDiscountValue(globalDiscountInput);
  if (resolvedGlobal > 0) {
    return resolvedGlobal;
  }

  // PRIORITY 4: Fallback to 0%
  return 0;
}

/**
 * Detailed resolution providing full breakdown of which rule won
 */
export function resolveEffectiveDiscountDetails(
  product?: Partial<Product> | null,
  globalDiscountFromSettings?: number | SystemSettings | CatalogDiscountSettings | null,
  category?: ProductCategory | string | number | null
): EffectiveDiscountResolution {
  const resolvedGlobal = resolveGlobalDiscountValue(globalDiscountFromSettings);

  if (!product) {
    return {
      effectiveDiscount: 0,
      discountScope: 'none',
      discountSource: 'No Product',
      isOverridden: false,
      globalDiscount: resolvedGlobal
    };
  }

  // Priority 1: Product Override
  const prodDiscount = getProductSpecificDiscount(product);
  if (prodDiscount !== undefined && prodDiscount > 0) {
    return {
      effectiveDiscount: prodDiscount,
      discountScope: 'product',
      discountSource: product.discount_source || 'Product Specific',
      isOverridden: true,
      productDiscount: prodDiscount,
      globalDiscount: resolvedGlobal
    };
  }

  // Priority 2: Category Discount
  let catSettings: CatalogDiscountSettings | undefined;
  if (globalDiscountFromSettings && typeof globalDiscountFromSettings === 'object') {
    if ('categoryDiscounts' in globalDiscountFromSettings) {
      catSettings = globalDiscountFromSettings as CatalogDiscountSettings;
    } else if ('discountSettings' in globalDiscountFromSettings && (globalDiscountFromSettings as any).discountSettings) {
      catSettings = (globalDiscountFromSettings as any).discountSettings;
    }
  }
  const catDiscount = getCategorySpecificDiscount(product, category, catSettings);
  if (catDiscount !== undefined && catDiscount > 0) {
    const catName = product.categoryName || (category && typeof category === 'object' ? (category as any).name : String(category || 'Category'));
    return {
      effectiveDiscount: catDiscount,
      discountScope: 'category',
      discountSource: `Category (${catName})`,
      isOverridden: false,
      categoryDiscount: catDiscount,
      globalDiscount: resolvedGlobal
    };
  }

  // Priority 3: Global Discount
  if (resolvedGlobal > 0) {
    return {
      effectiveDiscount: resolvedGlobal,
      discountScope: 'global',
      discountSource: `Global Catalog (${resolvedGlobal}%)`,
      isOverridden: false,
      globalDiscount: resolvedGlobal
    };
  }

  // Priority 4: 0%
  return {
    effectiveDiscount: 0,
    discountScope: 'none',
    discountSource: 'None (0%)',
    isOverridden: false,
    globalDiscount: 0
  };
}

/**
 * Calculates discounted price and discount amount with standard currency rounding
 */
export function calculateDiscountPricing(
  originalPrice: number,
  discountPercent: number
): {
  discountAmount: number;
  finalPrice: number;
} {
  const safePrice = Math.max(0, Number(originalPrice) || 0);
  const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));

  if (safePrice === 0 || safeDiscount === 0) {
    return {
      discountAmount: 0,
      finalPrice: safePrice
    };
  }

  const rawDiscount = (safePrice * safeDiscount) / 100;
  const discountAmount = Math.round(rawDiscount);
  const finalPrice = Math.max(0, safePrice - discountAmount);

  return {
    discountAmount,
    finalPrice
  };
}

/**
 * Comprehensive product price calculation using centralized getEffectiveDiscount
 */
export function getProductEffectivePricing(
  product: Partial<Product>,
  globalDiscountFromSettings?: number | SystemSettings | CatalogDiscountSettings | null,
  category?: ProductCategory | string | number | null
): DiscountedPriceBreakdown {
  const originalPrice = Number(product.mrp ?? product.price ?? product.sellingPrice ?? 0);
  const details = resolveEffectiveDiscountDetails(product, globalDiscountFromSettings, category);
  const { discountAmount, finalPrice } = calculateDiscountPricing(originalPrice, details.effectiveDiscount);

  return {
    originalPrice,
    effectiveDiscount: details.effectiveDiscount,
    discountAmount,
    finalPrice,
    savings: discountAmount,
    discountScope: details.discountScope,
    discountSource: details.discountSource
  };
}

/**
 * Service object bundling all discount operations
 */
export const DiscountService = {
  getEffectiveDiscount,
  resolveEffectiveDiscountDetails,
  resolveGlobalDiscountValue,
  calculateDiscountPricing,
  getProductEffectivePricing,
  hasActiveProductDiscountOverride,
  getStoredDiscountSettings,
  saveStoredDiscountSettings
};

export default DiscountService;
