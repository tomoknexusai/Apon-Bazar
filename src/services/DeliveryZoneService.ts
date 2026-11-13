/**
 * Centralized Delivery Zone Foundation Service
 * Project: Apon Bazar
 * 
 * CORE BUSINESS RULES:
 * 1. Every Bangladesh Upazila/Thana = One Active Delivery Zone (1 Upazila = 1 Zone).
 * 2. Uses the official Bangladesh geographic database (504 Upazilas, 64 Districts, 8 Divisions).
 *    No duplicate or disconnected location database.
 * 3. Stable unique Zone ID = Upazila ID (e.g. upz_435 -> zone_id: upz_435).
 * 4. Dealer Zone is strictly derived from Dealer Division -> District -> Upazila.
 * 5. Customer Zone is strictly identified from Customer Division -> District -> Upazila during checkout.
 * 6. Delivery Decision:
 *    - Dealer Zone ID === Customer Zone ID => WITHIN ZONE
 *    - Dealer Zone ID !== Customer Zone ID => ZONE TO ZONE
 * 7. Delivery Rates are NOT hardcoded permanently: Super Admin configurable via ZoneDeliveryRateConfig.
 */

import {
  BD_UPAZILAS_TABLE,
  BD_DISTRICTS_TABLE,
  BD_DIVISIONS_TABLE
} from './BangladeshAdministrativeDatabase';
import { UpazilaRecord } from '../types/local-address';

export interface DeliveryZone {
  zone_id: string; // matches Upazila ID, e.g. "upz_435"
  zone_name: string; // e.g. "Thakurgaon Sadar Zone"
  zone_name_bn: string; // e.g. "ঠাকুরগাঁও সদর জোন"
  zone_name_en: string; // e.g. "Thakurgaon Sadar Zone"
  division_id: string; // e.g. "div_55"
  division_name: string; // e.g. "রংপুর"
  division_name_en?: string;
  district_id: string; // e.g. "dist_94"
  district_name: string; // e.g. "ঠাকুরগাঁও"
  district_name_en?: string;
  upazila_id: string; // e.g. "upz_435"
  upazila_name: string; // e.g. "ঠাকুরগাঁও সদর"
  upazila_name_en?: string; // e.g. "Thakurgaon Sadar"
  zone_point_name: string;
  zone_point_address: string;
  latitude?: number;
  longitude?: number;
  operation_office_id?: string;
  operation_office_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type ZoneDeliveryType = 'WITHIN_ZONE' | 'ZONE_TO_ZONE';

export interface ZoneDeliveryDecision {
  deliveryType: ZoneDeliveryType;
  deliveryTypeBn: string; // "একই জোন (Within Zone)" | "জোন টু জোন (Zone to Zone)"
  isSameZone: boolean;
  isSameDistrict: boolean;
  isSameDivision: boolean;
  appliedReason: string;
}

export interface ZoneDeliveryRateConfig {
  withinZoneBaseRate: number; // e.g. 50 ৳
  zoneToZoneBaseRate: number; // e.g. 100 ৳
  interDistrictBaseRate: number; // e.g. 130 ৳
  interDivisionBaseRate: number; // e.g. 150 ৳
  weightSurchargePerKg: number; // e.g. 20 ৳/kg above 1kg
  freeDeliveryThreshold: number; // e.g. 2500 ৳
  status: 'active' | 'inactive';
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface OrderZoneSnapshot {
  customerZone: {
    zone_id: string;
    zone_name: string;
    zone_name_bn: string;
    division: string;
    district: string;
    upazila: string;
  };
  dealerZone: {
    zone_id: string;
    zone_name: string;
    zone_name_bn: string;
    division: string;
    district: string;
    upazila: string;
    dealerId?: string;
    dealerName?: string;
    dealerShopName?: string;
    dealerAddress?: string;
  };
  deliveryType: ZoneDeliveryType;
  deliveryTypeBn: string;
  isSameZone: boolean;
  baseRate: number;
  finalDeliveryCost: number;
  rateBreakdown: string;
  snapshotTimestamp: string;
  rateVersion: number;
}

// Default Super Admin Configurable Rate Store
export const DEFAULT_ZONE_RATE_CONFIG: ZoneDeliveryRateConfig = {
  withinZoneBaseRate: 50,
  zoneToZoneBaseRate: 100,
  interDistrictBaseRate: 130,
  interDivisionBaseRate: 150,
  weightSurchargePerKg: 20,
  freeDeliveryThreshold: 3000,
  status: 'active',
  version: 1,
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedBy: 'SUPER_ADMIN'
};

const ZONE_RATE_CONFIG_STORAGE_KEY = 'apon_bazar_zone_delivery_rate_config_v1';
const ZONE_OVERRIDES_STORAGE_KEY = 'apon_bazar_zone_overrides_v1';

// Internal indexed caches for high performance
let zonesCache: DeliveryZone[] | null = null;
const zoneByIdMap = new Map<string, DeliveryZone>();
const zoneByNameMap = new Map<string, DeliveryZone>();
const zoneByDistrictAndUpazilaMap = new Map<string, DeliveryZone>();

/**
 * Normalizes text for robust geographical string matching
 */
export function normalizeGeoText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\u0980-\u09FFa-z0-9]/g, '');
}

/**
 * Builds standard DeliveryZone from UpazilaRecord
 */
function buildDeliveryZoneFromUpazila(upz: UpazilaRecord, overrides?: Partial<DeliveryZone>): DeliveryZone {
  const zoneNameEn = upz.nameEn ? `${upz.nameEn} Zone` : `${upz.nameBn} Zone`;
  const zoneNameBn = `${upz.nameBn} জোন`;

  return {
    zone_id: upz.id,
    zone_name: zoneNameEn,
    zone_name_bn: zoneNameBn,
    zone_name_en: zoneNameEn,
    division_id: upz.divisionId || upz.division_id || '',
    division_name: upz.divisionName || '',
    division_name_en: upz.divisionName,
    district_id: upz.districtId || upz.district_id || '',
    district_name: upz.districtName || '',
    district_name_en: upz.districtName,
    upazila_id: upz.id,
    upazila_name: upz.nameBn,
    upazila_name_en: upz.nameEn,
    zone_point_name: `${upz.nameBn} জোন পয়েন্ট`,
    zone_point_address: `${upz.nameBn}, ${upz.districtName}`,
    operation_office_id: `office_${upz.id}`,
    operation_office_name: `${upz.nameBn} অপারেশন অফিস`,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

/**
 * Load Super Admin zone overrides from storage
 */
export function getZoneOverrides(): Record<string, Partial<DeliveryZone>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ZONE_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load zone overrides:', err);
    return {};
  }
}

/**
 * Save zone override by Super Admin (e.g. custom point, status, coordinates)
 */
export function saveZoneOverride(zoneId: string, override: Partial<DeliveryZone>): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getZoneOverrides();
    current[zoneId] = { ...(current[zoneId] || {}), ...override, updated_at: new Date().toISOString() };
    localStorage.setItem(ZONE_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
    // Invalidate cache
    zonesCache = null;
    return true;
  } catch (err) {
    console.error('Failed to save zone override:', err);
    return false;
  }
}

/**
 * Returns all active Bangladesh Upazila Delivery Zones
 */
export function getAllDeliveryZones(): DeliveryZone[] {
  if (zonesCache) return zonesCache;

  const overrides = getZoneOverrides();
  const list: DeliveryZone[] = [];

  BD_UPAZILAS_TABLE.forEach((upz) => {
    const override = overrides[upz.id] || {};
    const zone = buildDeliveryZoneFromUpazila(upz, override);
    list.push(zone);

    zoneByIdMap.set(zone.zone_id, zone);
    zoneByIdMap.set(upz.id, zone);

    const keyNameBn = normalizeGeoText(zone.upazila_name);
    const keyNameEn = normalizeGeoText(zone.upazila_name_en);
    if (keyNameBn) zoneByNameMap.set(keyNameBn, zone);
    if (keyNameEn) zoneByNameMap.set(keyNameEn, zone);

    const distUpzKeyBn = `${normalizeGeoText(zone.district_name)}_${keyNameBn}`;
    const distUpzKeyEn = `${normalizeGeoText(zone.district_name_en)}_${keyNameEn}`;
    if (distUpzKeyBn) zoneByDistrictAndUpazilaMap.set(distUpzKeyBn, zone);
    if (distUpzKeyEn) zoneByDistrictAndUpazilaMap.set(distUpzKeyEn, zone);
  });

  zonesCache = list;
  return list;
}

/**
 * Find Zone by exact Zone ID or Upazila ID
 */
export function getZoneById(zoneId?: string | null): DeliveryZone | undefined {
  if (!zoneId) return undefined;
  getAllDeliveryZones(); // ensure cache populated
  return zoneByIdMap.get(zoneId);
}

/**
 * Automatically identify Delivery Zone from Division -> District -> Upazila/Thana
 * Core Rule: 1 Upazila/Thana = 1 Delivery Zone
 */
export function getZoneByUpazila(
  upazilaIdOrName?: string | null,
  districtIdOrName?: string | null,
  divisionIdOrName?: string | null
): DeliveryZone {
  getAllDeliveryZones();

  if (upazilaIdOrName) {
    // 1. Direct ID match
    const byId = zoneByIdMap.get(upazilaIdOrName);
    if (byId) return byId;

    const normUpz = normalizeGeoText(upazilaIdOrName);
    const normDist = normalizeGeoText(districtIdOrName);

    // 2. District + Upazila compound match
    if (normDist && normUpz) {
      const compoundKey = `${normDist}_${normUpz}`;
      const matched = zoneByDistrictAndUpazilaMap.get(compoundKey);
      if (matched) return matched;
    }

    // 3. Name match across upazilas
    const matchedByName = zoneByNameMap.get(normUpz);
    if (matchedByName) {
      if (!normDist || normalizeGeoText(matchedByName.district_name) === normDist) {
        return matchedByName;
      }
    }

    // 4. Substring partial search
    for (const z of zonesCache || []) {
      const zUpz = normalizeGeoText(z.upazila_name);
      const zUpzEn = normalizeGeoText(z.upazila_name_en);
      if (zUpz.includes(normUpz) || normUpz.includes(zUpz) || (zUpzEn && zUpzEn.includes(normUpz))) {
        if (!normDist || normalizeGeoText(z.district_name).includes(normDist) || normDist.includes(normalizeGeoText(z.district_name))) {
          return z;
        }
      }
    }
  }

  // 5. Fallback: match by District
  if (districtIdOrName) {
    const normDist = normalizeGeoText(districtIdOrName);
    const districtZones = (zonesCache || []).filter(
      (z) => normalizeGeoText(z.district_name).includes(normDist) || normDist.includes(normalizeGeoText(z.district_name))
    );
    if (districtZones.length > 0) {
      // Pick Sadar upazila of the district if possible
      const sadar = districtZones.find((z) => z.upazila_name.includes('সদর') || (z.upazila_name_en && z.upazila_name_en.toLowerCase().includes('sadar')));
      return sadar || districtZones[0];
    }
  }

  // 6. Safe Default: Thakurgaon Sadar Zone (or Dhaka Keraniganj)
  const fallback = zoneByIdMap.get('upz_435') || (zonesCache && zonesCache[0]);
  if (fallback) return fallback;

  // In the absolute fallback case, construct a clean object
  return {
    zone_id: 'upz_435',
    zone_name: 'Thakurgaon Sadar Zone',
    zone_name_bn: 'ঠাকুরগাঁও সদর জোন',
    zone_name_en: 'Thakurgaon Sadar Zone',
    division_id: 'div_55',
    division_name: 'রংপুর',
    district_id: 'dist_94',
    district_name: 'ঠাকুরগাঁও',
    upazila_id: 'upz_435',
    upazila_name: 'ঠাকুরগাঁও সদর',
    zone_point_name: 'ঠাকুরগাঁও সদর জোন পয়েন্ট',
    zone_point_address: 'ঠাকুরগাঁও সদর, ঠাকুরগাঁও',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Determine Dealer/Seller Zone from Dealer registered address
 * Rule: Dealer/Seller Division -> District -> Upazila/Thana => Zone ID = Upazila ID
 */
export function getZoneForDealer(
  dealerAddress?: {
    upazila?: string;
    district?: string;
    division?: string;
    fullServiceAddress?: string;
  } | null
): DeliveryZone {
  if (!dealerAddress) {
    return getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');
  }

  return getZoneByUpazila(
    dealerAddress.upazila,
    dealerAddress.district,
    dealerAddress.division
  );
}

/**
 * Determine Customer Delivery Zone from Customer selected checkout location
 * Rule: Customer Division -> District -> Upazila/Thana => Customer Zone
 */
export function getZoneForCustomer(
  customerAddress?: {
    upazila?: string;
    district?: string;
    division?: string;
    fullServiceAddress?: string;
  } | null
): DeliveryZone {
  if (!customerAddress) {
    return getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');
  }

  return getZoneByUpazila(
    customerAddress.upazila,
    customerAddress.district,
    customerAddress.division
  );
}

/**
 * Compares Dealer Zone ID vs Customer Zone ID
 * Case A — Same Zone:
 *   Dealer Zone ID = Customer Zone ID => WITHIN ZONE
 * Case B — Different Zone:
 *   Dealer Zone ID != Customer Zone ID => ZONE TO ZONE
 */
export function determineZoneDeliveryType(
  dealerZone: DeliveryZone | null,
  customerZone: DeliveryZone | null
): ZoneDeliveryDecision {
  const dZone = dealerZone || getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');
  const cZone = customerZone || getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');

  const isSameZone = dZone.zone_id === cZone.zone_id;
  const isSameDistrict = normalizeGeoText(dZone.district_name) === normalizeGeoText(cZone.district_name);
  const isSameDivision = normalizeGeoText(dZone.division_name) === normalizeGeoText(cZone.division_name);

  if (isSameZone) {
    return {
      deliveryType: 'WITHIN_ZONE',
      deliveryTypeBn: 'একই জোন ডেলিভারি (Within Zone)',
      isSameZone: true,
      isSameDistrict: true,
      isSameDivision: true,
      appliedReason: `ডিলার জোন (${dZone.zone_name_bn}) এবং গ্রাহক জোন (${cZone.zone_name_bn}) একই। তাই এটি Within Zone ডেলিভারি।`
    };
  }

  return {
    deliveryType: 'ZONE_TO_ZONE',
    deliveryTypeBn: 'জোন টু জোন ডেলিভারি (Zone to Zone)',
    isSameZone: false,
    isSameDistrict,
    isSameDivision,
    appliedReason: `ডিলার জোন (${dZone.zone_name_bn}) এবং গ্রাহক জোন (${cZone.zone_name_bn}) ভিন্ন। তাই এটি Zone-to-Zone ডেলিভারি।`
  };
}

/**
 * Read configurable Super Admin Zone Delivery Rates
 */
export function getStoredZoneRateConfig(): ZoneDeliveryRateConfig {
  if (typeof window === 'undefined') return DEFAULT_ZONE_RATE_CONFIG;
  try {
    const raw = localStorage.getItem(ZONE_RATE_CONFIG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ZONE_RATE_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_ZONE_RATE_CONFIG));
      return DEFAULT_ZONE_RATE_CONFIG;
    }
    return { ...DEFAULT_ZONE_RATE_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to read zone rate config:', err);
    return DEFAULT_ZONE_RATE_CONFIG;
  }
}

/**
 * Save Super Admin Zone Delivery Rates (Not hard-coded)
 */
export function saveStoredZoneRateConfig(config: ZoneDeliveryRateConfig): { success: boolean; message: string } {
  if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
  try {
    const updated: ZoneDeliveryRateConfig = {
      ...config,
      version: (config.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(ZONE_RATE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    return { success: true, message: 'জোন ডেলিভারি রেট কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।' };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Calculates delivery cost based on Zone Foundation & Super Admin configuration
 */
export function calculateZoneDeliveryCost(params: {
  dealerZone: DeliveryZone | null;
  customerZone: DeliveryZone | null;
  totalWeightKg?: number;
  distanceKm?: number;
  rateConfig?: ZoneDeliveryRateConfig;
  orderSubtotal?: number;
}): {
  deliveryType: ZoneDeliveryType;
  deliveryTypeBn: string;
  baseRate: number;
  weightSurcharge: number;
  totalCost: number;
  explanation: string;
  decision: ZoneDeliveryDecision;
} {
  const config = params.rateConfig || getStoredZoneRateConfig();
  const decision = determineZoneDeliveryType(params.dealerZone, params.customerZone);
  const weightKg = Math.max(0.2, params.totalWeightKg || 1);

  let baseRate = config.withinZoneBaseRate;

  if (decision.deliveryType === 'WITHIN_ZONE') {
    baseRate = config.withinZoneBaseRate;
  } else {
    // Zone to Zone
    if (!decision.isSameDistrict) {
      baseRate = !decision.isSameDivision ? config.interDivisionBaseRate : config.interDistrictBaseRate;
    } else {
      baseRate = config.zoneToZoneBaseRate;
    }
  }

  // Weight surcharge above 1kg
  let weightSurcharge = 0;
  if (weightKg > 1.0) {
    const extraKg = Math.ceil(weightKg - 1.0);
    weightSurcharge = extraKg * config.weightSurchargePerKg;
  }

  let totalCost = baseRate + weightSurcharge;

  // Free delivery threshold check
  if (params.orderSubtotal && config.freeDeliveryThreshold > 0 && params.orderSubtotal >= config.freeDeliveryThreshold) {
    totalCost = 0;
  }

  const explanation = `${decision.deliveryTypeBn}: বেস রেট ৳${baseRate}${weightSurcharge > 0 ? ` + অতিরিক্ত ওজন চার্জ (${weightKg} kg) ৳${weightSurcharge}` : ''} = মোট ৳${totalCost}`;

  return {
    deliveryType: decision.deliveryType,
    deliveryTypeBn: decision.deliveryTypeBn,
    baseRate,
    weightSurcharge,
    totalCost,
    explanation,
    decision
  };
}

/**
 * Creates an immutable Order Zone Snapshot for permanent persistence
 */
export function createOrderZoneSnapshot(
  dealerZone: DeliveryZone | null,
  customerZone: DeliveryZone | null,
  dealerInfo?: {
    dealerId?: string;
    dealerName?: string;
    dealerShopName?: string;
    dealerAddress?: string;
  },
  finalDeliveryCost?: number,
  rateConfig?: ZoneDeliveryRateConfig
): OrderZoneSnapshot {
  const dZone = dealerZone || getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');
  const cZone = customerZone || getZoneByUpazila('ঠাকুরগাঁও সদর', 'ঠাকুরগাঁও', 'রংপুর');
  const decision = determineZoneDeliveryType(dZone, cZone);
  const config = rateConfig || getStoredZoneRateConfig();

  const baseRate = decision.deliveryType === 'WITHIN_ZONE'
    ? config.withinZoneBaseRate
    : (!decision.isSameDistrict ? config.interDistrictBaseRate : config.zoneToZoneBaseRate);

  const cost = finalDeliveryCost !== undefined ? finalDeliveryCost : baseRate;

  return {
    customerZone: {
      zone_id: cZone.zone_id,
      zone_name: cZone.zone_name,
      zone_name_bn: cZone.zone_name_bn,
      division: cZone.division_name,
      district: cZone.district_name,
      upazila: cZone.upazila_name
    },
    dealerZone: {
      zone_id: dZone.zone_id,
      zone_name: dZone.zone_name,
      zone_name_bn: dZone.zone_name_bn,
      division: dZone.division_name,
      district: dZone.district_name,
      upazila: dZone.upazila_name,
      dealerId: dealerInfo?.dealerId || 'DLR-DEFAULT',
      dealerName: dealerInfo?.dealerName || 'Official Dealer',
      dealerShopName: dealerInfo?.dealerShopName || dZone.zone_point_name,
      dealerAddress: dealerInfo?.dealerAddress || dZone.zone_point_address
    },
    deliveryType: decision.deliveryType,
    deliveryTypeBn: decision.deliveryTypeBn,
    isSameZone: decision.isSameZone,
    baseRate,
    finalDeliveryCost: cost,
    rateBreakdown: `${decision.deliveryTypeBn} (বেস রেট: ৳${baseRate})`,
    snapshotTimestamp: new Date().toISOString(),
    rateVersion: config.version
  };
}
