/**
 * Comprehensive Product Pricing & VAT/Tax Engine
 * Project: Apon Bazar (Ghorer Bazar BD)
 * 
 * Enforces:
 * - Accurate 2-decimal money calculation (no floating point errors)
 * - Bidirectional auto-calculation (Price Excl <-> Price Incl)
 * - Tax modes: VAT Included vs VAT Excluded
 * - Tax sources: Global vs Custom per-product
 * - Manual price override protection and warnings
 * - Immutable historical order snapshots
 * - Full audit logging for VAT and pricing adjustments
 */

import { Product, OrderItem, UserProfile } from '../types';

export const GLOBAL_VAT_STORAGE_KEY = 'aponbazar_global_vat_settings_v2';
export const VAT_AUDIT_LOG_STORAGE_KEY = 'aponbazar_vat_audit_logs_v2';

export interface GlobalVatSettings {
  enabled: boolean;
  defaultVatRate: number; // Percentage e.g. 15 or 5
  defaultVatMode: 'included' | 'excluded';
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_GLOBAL_VAT_SETTINGS: GlobalVatSettings = {
  enabled: true,
  defaultVatRate: 15,
  defaultVatMode: 'included',
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'APON-SADMIN-001'
};

export interface VatAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: 'GLOBAL_VAT_UPDATE' | 'PRODUCT_VAT_UPDATE' | 'BULK_VAT_APPLIED';
  productId?: string;
  productTitle?: string;
  previousValue?: string | number | Record<string, any>;
  newValue?: string | number | Record<string, any>;
  vatRate?: number;
  details: string;
  timestamp: string;
}

/**
 * Strict 2-decimal precision money rounding
 */
export function round2(num: number): number {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Number((Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2));
}

/**
 * Calculate Price Including VAT from Price Excluding VAT
 * Tax Amount = Price Excl * (VAT Rate / 100)
 * Price Incl = Price Excl + Tax Amount
 */
export function calcFromExcl(
  priceExcl: number,
  vatRate: number
): { priceExcl: number; taxAmount: number; priceIncl: number } {
  const safeExcl = Math.max(0, round2(priceExcl));
  const safeRate = Math.max(0, vatRate);
  const taxAmount = round2(safeExcl * (safeRate / 100));
  const priceIncl = round2(safeExcl + taxAmount);
  return { priceExcl: safeExcl, taxAmount, priceIncl };
}

/**
 * Calculate Price Excluding VAT from Price Including VAT
 * Price Excl = Price Incl / (1 + VAT Rate / 100)
 * Tax Amount = Price Incl - Price Excl
 */
export function calcFromIncl(
  priceIncl: number,
  vatRate: number
): { priceExcl: number; taxAmount: number; priceIncl: number } {
  const safeIncl = Math.max(0, round2(priceIncl));
  const safeRate = Math.max(0, vatRate);
  if (safeRate === 0) {
    return { priceExcl: safeIncl, taxAmount: 0, priceIncl: safeIncl };
  }
  const priceExcl = round2(safeIncl / (1 + safeRate / 100));
  const taxAmount = round2(safeIncl - priceExcl);
  return { priceExcl, taxAmount, priceIncl: safeIncl };
}

/**
 * Retrieve Global VAT Settings from local storage with fallback
 */
export function getStoredGlobalVatSettings(): GlobalVatSettings {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(GLOBAL_VAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_GLOBAL_VAT_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    // fallback
  }
  return { ...DEFAULT_GLOBAL_VAT_SETTINGS };
}

/**
 * Save Global VAT Settings to local storage
 */
export function saveStoredGlobalVatSettings(settings: GlobalVatSettings): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(GLOBAL_VAT_STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Retrieve VAT Audit Logs from local storage
 */
export function getStoredVatAuditLogs(): VatAuditLog[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(VAT_AUDIT_LOG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    // fallback
  }
  return [];
}

/**
 * Add a VAT Audit Log entry
 */
export function addVatAuditLog(logData: Omit<VatAuditLog, 'id' | 'timestamp'>): VatAuditLog {
  const newLog: VatAuditLog = {
    ...logData,
    id: `vat-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString()
  };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getStoredVatAuditLogs();
      const updated = [newLog, ...current].slice(0, 500); // keep recent 500
      localStorage.setItem(VAT_AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // ignore
  }
  return newLog;
}

export interface ResolvedVatPricing {
  // Rates & Mode
  effectiveVatRate: number;
  vatTaxMode: 'included' | 'excluded';
  taxSource: 'global' | 'custom';
  isManualOverride: boolean;

  // MRP
  mrpExclTax: number;
  mrpTaxAmount: number;
  mrpInclTax: number;

  // Selling Price
  sellingPriceExclTax: number;
  sellingTaxAmount: number;
  sellingPriceInclTax: number;

  // Discounts
  discountAmount: number;
  discountPercentage: number;

  // Quantity totals
  quantity: number;
  totalExclTax: number;
  totalTaxAmount: number;
  totalInclTax: number;
}

/**
 * Resolves complete VAT/Tax metrics for a given product with fallback for legacy records
 */
export function resolveProductVatPricing(
  product: Partial<Product>,
  customGlobalSettings?: GlobalVatSettings,
  quantity: number = 1
): ResolvedVatPricing {
  const global = customGlobalSettings || getStoredGlobalVatSettings();
  const qty = Math.max(1, Math.floor(quantity));

  // 1. Determine Tax Mode and Source
  const taxSource: 'global' | 'custom' =
    product.taxSource === 'custom' || product.taxSource === 'global'
      ? product.taxSource
      : (product.vatTax !== undefined && product.vatTax !== global.defaultVatRate ? 'custom' : 'global');

  const effectiveVatRate =
    !global.enabled
      ? 0
      : taxSource === 'custom' && product.taxRate !== undefined
      ? Number(product.taxRate)
      : taxSource === 'custom' && product.vatTax !== undefined
      ? Number(product.vatTax)
      : global.defaultVatRate;

  const vatTaxMode: 'included' | 'excluded' =
    product.taxMode || global.defaultVatMode || 'included';

  const isManualOverride = Boolean(product.isManualOverride);

  // 2. Resolve MRP (Excl & Incl)
  let mrpExclTax: number;
  let mrpInclTax: number;
  let mrpTaxAmount: number;

  if (product.mrpExclTax !== undefined && product.mrpInclTax !== undefined && isManualOverride) {
    mrpExclTax = round2(product.mrpExclTax);
    mrpInclTax = round2(product.mrpInclTax);
    mrpTaxAmount = round2(mrpInclTax - mrpExclTax);
  } else if (product.mrpExclTax !== undefined && vatTaxMode === 'excluded') {
    const calc = calcFromExcl(product.mrpExclTax, effectiveVatRate);
    mrpExclTax = calc.priceExcl;
    mrpTaxAmount = calc.taxAmount;
    mrpInclTax = calc.priceIncl;
  } else if (product.mrpInclTax !== undefined && vatTaxMode === 'included') {
    const calc = calcFromIncl(product.mrpInclTax, effectiveVatRate);
    mrpExclTax = calc.priceExcl;
    mrpTaxAmount = calc.taxAmount;
    mrpInclTax = calc.priceIncl;
  } else {
    // Legacy fallback using product.mrp
    const rawMrp = Math.max(0, Number(product.mrp) || 0);
    if (vatTaxMode === 'included') {
      const calc = calcFromIncl(rawMrp, effectiveVatRate);
      mrpExclTax = calc.priceExcl;
      mrpTaxAmount = calc.taxAmount;
      mrpInclTax = calc.priceIncl;
    } else {
      const calc = calcFromExcl(rawMrp, effectiveVatRate);
      mrpExclTax = calc.priceExcl;
      mrpTaxAmount = calc.taxAmount;
      mrpInclTax = calc.priceIncl;
    }
  }

  // 3. Resolve Selling Price (Excl & Incl)
  // Legacy selling price might be in campaignPrice, discountPrice, or calculated via discount
  let sellingPriceExclTax: number;
  let sellingPriceInclTax: number;
  let sellingTaxAmount: number;

  if (
    product.sellingPriceExclTax !== undefined &&
    product.sellingPriceInclTax !== undefined &&
    isManualOverride
  ) {
    sellingPriceExclTax = round2(product.sellingPriceExclTax);
    sellingPriceInclTax = round2(product.sellingPriceInclTax);
    sellingTaxAmount = round2(sellingPriceInclTax - sellingPriceExclTax);
  } else if (product.sellingPriceExclTax !== undefined && vatTaxMode === 'excluded') {
    const calc = calcFromExcl(product.sellingPriceExclTax, effectiveVatRate);
    sellingPriceExclTax = calc.priceExcl;
    sellingTaxAmount = calc.taxAmount;
    sellingPriceInclTax = calc.priceIncl;
  } else if (product.sellingPriceInclTax !== undefined && vatTaxMode === 'included') {
    const calc = calcFromIncl(product.sellingPriceInclTax, effectiveVatRate);
    sellingPriceExclTax = calc.priceExcl;
    sellingTaxAmount = calc.taxAmount;
    sellingPriceInclTax = calc.priceIncl;
  } else {
    // Legacy fallback: determine raw selling price
    let rawSelling = mrpInclTax;
    if (product.campaignPrice !== undefined && product.campaignPrice > 0) {
      rawSelling = Number(product.campaignPrice);
    } else if (product.discountPrice !== undefined && product.discountPrice > 0) {
      rawSelling = Number(product.discountPrice);
    } else if (product.discount !== undefined && product.discount > 0) {
      rawSelling = round2(mrpInclTax - (mrpInclTax * product.discount) / 100);
    }

    if (vatTaxMode === 'included') {
      const calc = calcFromIncl(rawSelling, effectiveVatRate);
      sellingPriceExclTax = calc.priceExcl;
      sellingTaxAmount = calc.taxAmount;
      sellingPriceInclTax = calc.priceIncl;
    } else {
      const calc = calcFromExcl(rawSelling, effectiveVatRate);
      sellingPriceExclTax = calc.priceExcl;
      sellingTaxAmount = calc.taxAmount;
      sellingPriceInclTax = calc.priceIncl;
    }
  }

  // 4. Calculate Discounts
  const discountAmount = round2(Math.max(0, mrpInclTax - sellingPriceInclTax));
  const discountPercentage = mrpInclTax > 0 ? round2((discountAmount / mrpInclTax) * 100) : 0;

  // 5. Quantity Totals
  const totalExclTax = round2(sellingPriceExclTax * qty);
  const totalTaxAmount = round2(sellingTaxAmount * qty);
  const totalInclTax = round2(sellingPriceInclTax * qty);

  return {
    effectiveVatRate,
    vatTaxMode,
    taxSource,
    isManualOverride,
    mrpExclTax,
    mrpTaxAmount,
    mrpInclTax,
    sellingPriceExclTax,
    sellingTaxAmount,
    sellingPriceInclTax,
    discountAmount,
    discountPercentage,
    quantity: qty,
    totalExclTax,
    totalTaxAmount,
    totalInclTax
  };
}

/**
 * Creates an immutable OrderItem snapshot containing historical pricing and VAT parameters
 */
export function createOrderItemVatSnapshot(
  product: Product,
  quantity: number = 1,
  customGlobalSettings?: GlobalVatSettings
): Partial<OrderItem> {
  const pricing = resolveProductVatPricing(product, customGlobalSettings, quantity);

  return {
    productId: product.id,
    productTitle: product.title,
    productTitleBn: product.titleBn,
    productImage: product.images?.[0] || product.thumbnail,
    quantity,
    unitPrice: pricing.sellingPriceInclTax,
    mrp: pricing.mrpInclTax,
    totalPrice: pricing.totalInclTax,

    // Historical VAT & Pricing Snapshot (Strictly Immutable)
    mrpExclTax: pricing.mrpExclTax,
    mrpInclTax: pricing.mrpInclTax,
    sellingPriceExclTax: pricing.sellingPriceExclTax,
    sellingPriceInclTax: pricing.sellingPriceInclTax,
    vatTaxRate: pricing.effectiveVatRate,
    vatTaxAmount: pricing.sellingTaxAmount,
    totalVatTax: pricing.totalTaxAmount,
    vatTaxMode: pricing.vatTaxMode,
    taxSource: pricing.taxSource,
    discountAmount: pricing.discountAmount,
    finalPrice: pricing.sellingPriceInclTax
  };
}

/**
 * Applies Global VAT/Tax to all products with Custom rate preservation and returns count report
 */
export function bulkApplyGlobalTaxToProducts(
  products: Product[],
  globalSettings: GlobalVatSettings,
  actor: UserProfile
): {
  updatedProducts: Product[];
  affectedCount: number;
  skippedCount: number;
  customCount: number;
} {
  let affectedCount = 0;
  let skippedCount = 0;
  let customCount = 0;

  const updatedProducts = products.map((prod) => {
    // If product is set to custom tax mode, skip it to preserve product-specific custom tax
    if (prod.taxSource === 'custom') {
      customCount++;
      return prod;
    }

    // If already matching global settings and not manual override
    if (
      prod.taxRate === globalSettings.defaultVatRate &&
      prod.taxMode === globalSettings.defaultVatMode &&
      prod.vatTax === globalSettings.defaultVatRate
    ) {
      skippedCount++;
      return prod;
    }

    affectedCount++;

    // Recompute price pairs under new global tax
    const currentMode = globalSettings.defaultVatMode;
    const newRate = globalSettings.defaultVatRate;

    let mrpExcl = prod.mrpExclTax;
    let mrpIncl = prod.mrpInclTax;
    let sellExcl = prod.sellingPriceExclTax;
    let sellIncl = prod.sellingPriceInclTax;

    if (currentMode === 'included') {
      const baseMrp = prod.mrpInclTax || prod.mrp || 0;
      const mrpCalc = calcFromIncl(baseMrp, newRate);
      mrpExcl = mrpCalc.priceExcl;
      mrpIncl = mrpCalc.priceIncl;

      const baseSell = prod.sellingPriceInclTax || prod.campaignPrice || prod.discountPrice || baseMrp;
      const sellCalc = calcFromIncl(baseSell, newRate);
      sellExcl = sellCalc.priceExcl;
      sellIncl = sellCalc.priceIncl;
    } else {
      const baseMrp = prod.mrpExclTax || prod.mrp || 0;
      const mrpCalc = calcFromExcl(baseMrp, newRate);
      mrpExcl = mrpCalc.priceExcl;
      mrpIncl = mrpCalc.priceIncl;

      const baseSell = prod.sellingPriceExclTax || prod.campaignPrice || prod.discountPrice || baseMrp;
      const sellCalc = calcFromExcl(baseSell, newRate);
      sellExcl = sellCalc.priceExcl;
      sellIncl = sellCalc.priceIncl;
    }

    return {
      ...prod,
      vatTax: newRate,
      taxRate: newRate,
      taxMode: currentMode,
      taxSource: 'global' as const,
      mrpExclTax: mrpExcl,
      mrpInclTax: mrpIncl,
      mrp: mrpIncl,
      sellingPriceExclTax: sellExcl,
      sellingPriceInclTax: sellIncl,
      campaignPrice: sellIncl,
      discountPrice: sellIncl
    };
  });

  // Log the bulk update action in VAT Audit Log
  addVatAuditLog({
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.primaryRole,
    action: 'BULK_VAT_APPLIED',
    vatRate: globalSettings.defaultVatRate,
    newValue: {
      rate: globalSettings.defaultVatRate,
      mode: globalSettings.defaultVatMode,
      affected: affectedCount,
      skipped: skippedCount,
      custom: customCount
    },
    details: `Applied Global VAT (${globalSettings.defaultVatRate}% ${globalSettings.defaultVatMode}) across product catalog. ${affectedCount} products updated, ${customCount} custom preserved, ${skippedCount} skipped.`
  });

  return {
    updatedProducts,
    affectedCount,
    skippedCount,
    customCount
  };
}
