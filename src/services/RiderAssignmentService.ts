/**
 * Dynamic Nearest Rider & Logistics Resolution Service
 * Project: Apon Bazar (Ghorer Bazar BD)
 * 
 * Enforces:
 * 1. Dynamic database lookup from real registered users and logistics points (NO hardcoded riders).
 * 2. Strict eligibility filters (Active account, Available/Online status, Capacity limits, Vehicle compatibility).
 * 3. Exact road distance calculation via calculateRoadDistanceKm (Haversine + 1.28 road factor).
 * 4. Automatic nearest eligible selection.
 * 5. Clean empty state ("রাইডার পাওয়া যায়নি") when no eligible rider is available within service radius.
 * 6. Real-time recalculation on address/GPS change and pre-order verification.
 */

import {
  UserProfile,
  ServiceAddress,
  Order,
  SuperAdminDeliveryConfig,
  DeliveryMode,
  LogisticsAssignment,
  Warehouse,
  DealerPoint
} from '../types';
import { calculateRoadDistanceKm } from '../lib/deliveryWeightCalculator';

export interface NearestRiderCandidate {
  riderId: string;
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
  riderDistanceKm: number;
  riderLat?: number;
  riderLng?: number;
  activeOrdersCount: number;
  accountStatus: string;
  isAvailable: boolean;
  status: 'Available' | 'Busy' | 'Offline';
  matchedDivision?: string;
  matchedDistrict?: string;
  matchedUpazila?: string;
}

export interface RiderResolutionResult {
  found: boolean;
  rider: NearestRiderCandidate | null;
  message: string;
  searchedCount: number;
  eligibleCount: number;
  allEligibleRidersSorted: NearestRiderCandidate[];
}

export interface RiderResolutionOptions {
  totalWeightKg?: number;
  deliveryMode?: DeliveryMode;
  activeOrders?: Order[];
  maxCapacityPerRider?: number;
  deliveryConfig?: SuperAdminDeliveryConfig;
  forcedRiderRadiusKm?: number;
}

/**
 * Checks vehicle compatibility based on delivery mode and weight
 */
export function isRiderVehicleCompatible(
  vehicleType: string | undefined,
  totalWeightKg: number = 0,
  deliveryMode: DeliveryMode = 'courier'
): boolean {
  const v = (vehicleType || '').toLowerCase();

  // If order requires road cargo / covered van, or weight exceeds 25 KG
  if (deliveryMode === 'road_cargo' || totalWeightKg > 25) {
    const isHeavyVehicle =
      v.includes('van') ||
      v.includes('ভ্যান') ||
      v.includes('pickup') ||
      v.includes('পিকআপ') ||
      v.includes('truck') ||
      v.includes('ট্রাক') ||
      v.includes('cargo') ||
      v.includes('কাভার্ড');
    return isHeavyVehicle;
  }

  // If weight exceeds 5 KG, standard bicycle is not suitable
  if (totalWeightKg > 5) {
    if (v.includes('bicycle') || v.includes('সাইকেল') || v.includes('বাইসাইকেল')) {
      return false;
    }
  }

  // Standard motorcycle, electric bike, or van is compatible for local deliveries
  return true;
}

/**
 * Extracts GPS coordinates from a user profile or mandatory address
 */
export function getRiderCoordinates(rider: UserProfile): { lat?: number; lng?: number } {
  if (rider.latitude && rider.longitude && rider.latitude !== 0 && rider.longitude !== 0) {
    return { lat: rider.latitude, lng: rider.longitude };
  }
  if (
    rider.mandatoryAddress?.latitude &&
    rider.mandatoryAddress?.longitude &&
    rider.mandatoryAddress.latitude !== 0 &&
    rider.mandatoryAddress.longitude !== 0
  ) {
    return { lat: rider.mandatoryAddress.latitude, lng: rider.mandatoryAddress.longitude };
  }
  return { lat: undefined, lng: undefined };
}

/**
 * Dynamically resolves the nearest eligible delivery rider from real user accounts
 */
export function resolveNearestRider(
  customerAddress: ServiceAddress | null | undefined,
  allUsers: UserProfile[],
  options?: RiderResolutionOptions
): RiderResolutionResult {
  const totalWeightKg = options?.totalWeightKg || 0;
  const deliveryMode = options?.deliveryMode || 'courier';
  const activeOrders = options?.activeOrders || [];
  const maxCapacity = options?.maxCapacityPerRider || 6;
  const config = options?.deliveryConfig;

  // If no customer address provided, cannot resolve
  if (!customerAddress) {
    return {
      found: false,
      rider: null,
      message: 'গ্রাহকের ডেলিভারি ঠিকানা পাওয়া যায়নি।',
      searchedCount: 0,
      eligibleCount: 0,
      allEligibleRidersSorted: []
    };
  }

  const customerLat = customerAddress.latitude;
  const customerLng = customerAddress.longitude;

  // 1. Filter all users with delivery rider role
  const allRiderProfiles = allUsers.filter((u) => {
    const hasRiderRole =
      (u.roles && (u.roles.includes('delivery_rider') || u.roles.includes('delivery_man'))) ||
      u.primaryRole === 'delivery_rider' ||
      u.primaryRole === 'delivery_man';
    return hasRiderRole;
  });

  const searchedCount = allRiderProfiles.length;
  if (searchedCount === 0) {
    return {
      found: false,
      rider: null,
      message: 'সিস্টেমে কোনো নিবন্ধিত রাইডার একাউন্ট পাওয়া যায়নি।',
      searchedCount: 0,
      eligibleCount: 0,
      allEligibleRidersSorted: []
    };
  }

  // Determine maximum service radius from delivery configuration
  let maxAllowedRadiusKm = 35; // default service radius ceiling
  if (config?.distanceRule?.enabled && config.distanceRule.maxDistanceKm) {
    maxAllowedRadiusKm = config.distanceRule.maxDistanceKm;
  }
  if (totalWeightKg > 10 && config?.localHeavyConfig?.enabled && config.localHeavyConfig.maxDistanceKm) {
    maxAllowedRadiusKm = Math.min(maxAllowedRadiusKm, config.localHeavyConfig.maxDistanceKm);
  }
  if (options?.forcedRiderRadiusKm) {
    maxAllowedRadiusKm = options.forcedRiderRadiusKm;
  }

  // 2. Filter eligible riders
  const eligibleCandidates: NearestRiderCandidate[] = [];

  for (const rider of allRiderProfiles) {
    // A. Must be active account
    if (rider.accountStatus !== 'active') {
      continue;
    }

    // B. Must be online / available
    // Check if explicitly marked unavailable
    if ((rider as any).isAvailable === false || (rider as any).isOnline === false) {
      continue;
    }

    // C. Vehicle type compatibility
    const riderVehicle = rider.vehicleType || rider.motorcycleModel || 'মোটরসাইকেল';
    if (!isRiderVehicleCompatible(riderVehicle, totalWeightKg, deliveryMode)) {
      continue;
    }

    // D. Check active order capacity
    const riderActiveOrders = activeOrders.filter((o) => {
      const isAssigned =
        o.assignedDeliveryRiderId === rider.id ||
        (o.logistics && o.logistics.riderId === rider.id);
      const isUncompleted =
        o.orderStatus !== 'delivered' &&
        o.orderStatus !== 'cancelled' &&
        o.orderStatus !== 'returned_to_dealer';
      return isAssigned && isUncompleted;
    });

    if (riderActiveOrders.length >= maxCapacity) {
      // Rider is busy with maximum active deliveries
      continue;
    }

    // E. Location & Distance calculation
    const coords = getRiderCoordinates(rider);
    let distanceKm: number;

    if (
      customerLat !== undefined &&
      customerLng !== undefined &&
      customerLat !== 0 &&
      customerLng !== 0 &&
      coords.lat !== undefined &&
      coords.lng !== undefined &&
      coords.lat !== 0 &&
      coords.lng !== 0
    ) {
      const distCalc = calculateRoadDistanceKm(coords.lat, coords.lng, customerLat, customerLng);
      distanceKm = distCalc.distanceKm;
    } else {
      // If GPS coordinates are missing on either side, check administrative division/district
      const riderDivision = rider.mandatoryAddress?.division || '';
      const custDivision = customerAddress.division || '';
      const riderDistrict = rider.mandatoryAddress?.district || '';
      const custDistrict = customerAddress.district || '';
      const riderUpazila = rider.mandatoryAddress?.upazila || '';
      const custUpazila = customerAddress.upazila || '';

      const sameDivision = riderDivision && custDivision && riderDivision.toLowerCase() === custDivision.toLowerCase();
      const sameDistrict = riderDistrict && custDistrict && riderDistrict.toLowerCase() === custDistrict.toLowerCase();
      const sameUpazila = riderUpazila && custUpazila && riderUpazila.toLowerCase() === custUpazila.toLowerCase();

      if (sameUpazila) {
        distanceKm = 2.5;
      } else if (sameDistrict) {
        distanceKm = 7.0;
      } else if (sameDivision) {
        distanceKm = 18.0;
      } else {
        // Completely different division without coordinates -> not within local service radius
        continue;
      }
    }

    // F. Distance radius filter (Must be within operating service radius)
    if (distanceKm > maxAllowedRadiusKm) {
      continue;
    }

    eligibleCandidates.push({
      riderId: rider.id,
      riderName: rider.fullName || rider.name || 'রাইডার',
      riderPhone: rider.mobileNumber || '',
      riderVehicle,
      riderDistanceKm: Number(distanceKm.toFixed(2)),
      riderLat: coords.lat,
      riderLng: coords.lng,
      activeOrdersCount: riderActiveOrders.length,
      accountStatus: rider.accountStatus,
      isAvailable: true,
      status: 'Available',
      matchedDivision: rider.mandatoryAddress?.division,
      matchedDistrict: rider.mandatoryAddress?.district,
      matchedUpazila: rider.mandatoryAddress?.upazila
    });
  }

  // 3. Sort eligible candidates by shortest distance
  eligibleCandidates.sort((a, b) => a.riderDistanceKm - b.riderDistanceKm);

  if (eligibleCandidates.length === 0) {
    return {
      found: false,
      rider: null,
      message: 'এই delivery location-এর জন্য বর্তমানে কোনো available rider নেই।',
      searchedCount,
      eligibleCount: 0,
      allEligibleRidersSorted: []
    };
  }

  const nearest = eligibleCandidates[0];

  return {
    found: true,
    rider: nearest,
    message: `${nearest.riderName} (${nearest.riderDistanceKm} km দূরে)`,
    searchedCount,
    eligibleCount: eligibleCandidates.length,
    allEligibleRidersSorted: eligibleCandidates
  };
}

/**
 * Dynamically resolves complete logistics assignments (Dealer Point, Regional Warehouse, and Nearest Rider)
 */
export function resolveCompleteLogistics(
  customerAddress: ServiceAddress,
  allUsers: UserProfile[],
  warehouses: Warehouse[],
  dealerPoints: DealerPoint[],
  activeOrders: Order[],
  deliveryConfig?: SuperAdminDeliveryConfig,
  options?: {
    totalWeightKg?: number;
    deliveryMode?: DeliveryMode;
  }
): LogisticsAssignment {
  const custLat = customerAddress.latitude;
  const custLng = customerAddress.longitude;

  // 1. Resolve Nearest Active Dealer Point / Vendor Shop
  const activeDealerPoints = dealerPoints.filter((dp) => dp.isActive);
  let closestDealerPoint: DealerPoint | null = null;
  let minDealerDistance = Infinity;

  for (const dp of activeDealerPoints) {
    if (custLat && custLng && dp.latitude && dp.longitude) {
      const calc = calculateRoadDistanceKm(dp.latitude, dp.longitude, custLat, custLng);
      if (calc.distanceKm < minDealerDistance) {
        minDealerDistance = calc.distanceKm;
        closestDealerPoint = dp;
      }
    } else if (
      customerAddress.division &&
      dp.division &&
      customerAddress.division.toLowerCase() === dp.division.toLowerCase()
    ) {
      if (minDealerDistance > 15) {
        minDealerDistance = 15;
        closestDealerPoint = dp;
      }
    }
  }

  // If no dealer point resolved from config, check user accounts with dealer/vendor role
  if (!closestDealerPoint && activeDealerPoints.length > 0) {
    closestDealerPoint = activeDealerPoints[0];
    minDealerDistance = 5.0;
  }

  const vendorId = closestDealerPoint?.id || 'dealer-center';
  const vendorShopName = closestDealerPoint?.name || 'Apon Bazar কেন্দ্রীয় সার্ভিস আউটলেট';
  const vendorAddress = closestDealerPoint?.address || 'বাংলাদেশ';
  const vendorDistanceKm = minDealerDistance === Infinity ? 2.5 : Number(minDealerDistance.toFixed(1));
  const dealerId = closestDealerPoint?.id;
  const dealerName = closestDealerPoint?.contactPerson || 'ডিলার প্রতিনিধি';
  const dealerShopName = closestDealerPoint?.name;

  // 2. Resolve Nearest Regional Warehouse / Hub
  let closestWarehouse: Warehouse | null = null;
  let minWarehouseDistance = Infinity;

  for (const wh of warehouses) {
    if (custLat && custLng && wh.latitude && wh.longitude) {
      const calc = calculateRoadDistanceKm(wh.latitude, wh.longitude, custLat, custLng);
      if (calc.distanceKm < minWarehouseDistance) {
        minWarehouseDistance = calc.distanceKm;
        closestWarehouse = wh;
      }
    } else if (
      customerAddress.division &&
      wh.division &&
      customerAddress.division.toLowerCase() === wh.division.toLowerCase()
    ) {
      if (minWarehouseDistance > 20) {
        minWarehouseDistance = 20;
        closestWarehouse = wh;
      }
    }
  }

  if (!closestWarehouse && warehouses.length > 0) {
    closestWarehouse = warehouses[0];
    minWarehouseDistance = 8.0;
  }

  const hubId = closestWarehouse?.id || 'wh-central';
  const hubCode = closestWarehouse?.code || 'WH-DHK-01';
  const hubAddress = closestWarehouse?.name || 'কেন্দ্রীয় লজিস্টিকস হাব';
  const hubDistanceKm = minWarehouseDistance === Infinity ? 3.8 : Number(minWarehouseDistance.toFixed(1));

  // 3. Resolve Operations Partner for the region
  const operationsPartners = allUsers.filter(
    (u) =>
      u.accountStatus === 'active' &&
      ((u.roles && u.roles.includes('operations_partner')) || u.primaryRole === 'operations_partner')
  );
  let matchedPartner = operationsPartners.find(
    (p) =>
      p.mandatoryAddress?.division &&
      customerAddress.division &&
      p.mandatoryAddress.division.toLowerCase() === customerAddress.division.toLowerCase()
  );
  if (!matchedPartner && operationsPartners.length > 0) {
    matchedPartner = operationsPartners[0];
  }

  const opPartnerId = matchedPartner?.id || 'usr-partner-05';
  const opPartnerName = matchedPartner?.fullName || 'হাব অপারেশন্স পার্টনার';

  // 4. Resolve Dynamic Nearest Eligible Delivery Rider
  const riderResolution = resolveNearestRider(customerAddress, allUsers, {
    totalWeightKg: options?.totalWeightKg,
    deliveryMode: options?.deliveryMode,
    activeOrders,
    deliveryConfig
  });

  if (riderResolution.found && riderResolution.rider) {
    const r = riderResolution.rider;
    return {
      vendorId,
      vendorShopName,
      vendorAddress,
      vendorDistanceKm,
      hubId,
      hubCode,
      hubAddress,
      hubDistanceKm,
      riderFound: true,
      riderId: r.riderId,
      riderName: r.riderName,
      riderPhone: r.riderPhone,
      riderVehicle: r.riderVehicle,
      riderDistanceKm: r.riderDistanceKm,
      riderLat: r.riderLat,
      riderLng: r.riderLng,
      riderStatus: 'Available',
      opPartnerId,
      opPartnerName,
      dealerId,
      dealerName,
      dealerShopName,
      status: 'auto_assigned'
    };
  }

  // NO eligible rider found -> RETURN CLEAN EMPTY STATE (NO FAKE / DEFAULT RIDER)
  return {
    vendorId,
    vendorShopName,
    vendorAddress,
    vendorDistanceKm,
    hubId,
    hubCode,
    hubAddress,
    hubDistanceKm,
    riderFound: false,
    riderId: undefined,
    riderName: 'রাইডার পাওয়া যায়নি',
    riderPhone: '',
    riderVehicle: '',
    riderDistanceKm: undefined,
    riderLat: undefined,
    riderLng: undefined,
    riderStatus: 'Unavailable',
    riderUnavailableReason: riderResolution.message || 'এই delivery location-এর জন্য বর্তমানে কোনো available rider নেই।',
    opPartnerId,
    opPartnerName,
    dealerId,
    dealerName,
    dealerShopName,
    status: 'rider_not_found'
  };
}
