/**
 * Comprehensive Delivery Rate Engine & Logistics Calculator
 * Project: TOMSHOPBD (Ghorer Bazar BD)
 * 
 * Implements:
 * 1. Dealer Point Address -> Customer Delivery Address distance calculation (Google Maps / Haversine road model)
 * 2. 4 Delivery Modes: Motorcycle (Local), Courier, Road Cargo / Covered Van, Air Cargo
 * 3. Normal Courier (0-10 KG) with 10 weight slabs (0-0.5kg=60, 0.51-1kg=70, 1.01-2kg=90, 2.01-3kg=110, 3.01-5kg=150, 5.01-6kg=175, 6.01-7kg=200, 7.01-8kg=225, 8.01-9kg=250, 9.01-10kg=275)
 * 4. Local Heavy Delivery (10-50 KG) with FIXED distance slabs (0-0.5km=20, 0.51-1km=50, 1.01-2km=70, 2.01-3km=90, 3.01-5km=120, 5.01-10km=180) - NO distance multiplier, NO courier per-kg charge
 * 5. Heavy Cargo (50-100 KG, 100-200 KG, 200+ KG)
 * 6. Road Cargo / Covered Van & Air Cargo formula engines
 * 7. 11-step rate precedence order
 * 8. Comprehensive immutable Delivery Rate Snapshot generator
 * 9. Multi-vendor / Multi-dealer aggregation
 */

import {
  Product,
  ProductVariant,
  CartItem,
  ServiceAddress,
  SuperAdminDeliveryConfig,
  DeliveryZoneType,
  DistanceRoundingMode,
  DeliveryMode,
  CourierWeightSlab,
  LocalHeavyDistanceSlab,
  LocalHeavyDeliveryConfig,
  CargoWeightTierConfig,
  RoadCargoConfig,
  AirCargoConfig,
  DealerPoint,
  RiderIncentiveConfig,
  OrderDeliverySnapshot
} from '../types';

export const DEFAULT_DEALER_POINTS: DealerPoint[] = [
  {
    id: 'DLR-THAK-001',
    name: 'M/S Rahman Enterprise',
    tradeLicenseBusinessName: 'M/S Rahman Enterprise',
    dealerOwnerName: 'মোঃ আব্দুর রহমান',
    tradeLicenseNumber: 'TRAD/THAK/2026/0192',
    dealerId: 'DLR-THAK-001',
    code: 'DLR-THAK-001',
    contactPerson: 'মোঃ আব্দুর রহমান (স্বত্বাধিকারী)',
    contactPhone: '+8801711223344',
    address: 'পুরাতন বাসস্ট্যান্ড রোড, ঠাকুরগাঁও সদর, ঠাকুরগাঁও',
    division: 'রংপুর',
    district: 'ঠাকুরগাঁও',
    upazila: 'ঠাকুরগাঁও সদর',
    zoneId: 'upz_435',
    zoneName: 'Thakurgaon Sadar Zone',
    unionOrArea: 'ঠাকুরগাঁও পৌরসভা',
    latitude: 26.0336,
    longitude: 88.4617,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo']
  },
  {
    id: 'DLR-SAID-002',
    name: 'M/S Karim Traders',
    tradeLicenseBusinessName: 'M/S Karim Traders',
    dealerOwnerName: 'মোঃ করিম উদ্দিন',
    tradeLicenseNumber: 'TRAD/NIL/2026/4821',
    dealerId: 'DLR-SAID-002',
    code: 'DLR-SAID-002',
    contactPerson: 'মোঃ করিম উদ্দিন (স্বত্বাধিকারী)',
    contactPhone: '+8801712334455',
    address: 'রেলওয়ে মার্কেট, সৈয়দপুর, নীলফামারী',
    division: 'রংপুর',
    district: 'নীলফামারী',
    upazila: 'সৈয়দপুর',
    zoneId: 'upz_425',
    zoneName: 'Saidpur Zone',
    unionOrArea: 'সৈয়দপুর পৌরসভা',
    latitude: 25.7785,
    longitude: 88.8974,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo']
  },
  {
    id: 'DLR-DIN-003',
    name: 'M/S Noor Traders',
    tradeLicenseBusinessName: 'M/S Noor Traders',
    dealerOwnerName: 'মোঃ নূরুল ইসলাম',
    tradeLicenseNumber: 'TRAD/DIN/2026/3310',
    dealerId: 'DLR-DIN-003',
    code: 'DLR-DIN-003',
    contactPerson: 'মোঃ নূরুল ইসলাম (স্বত্বাধিকারী)',
    contactPhone: '+8801713445566',
    address: 'বাহাদুর বাজার, দিনাজপুর সদর, দিনাজপুর',
    division: 'রংপুর',
    district: 'দিনাজপুর',
    upazila: 'দিনাজপুর সদর',
    zoneId: 'upz_408',
    zoneName: 'Dinajpur Sadar Zone',
    unionOrArea: 'দিনাজপুর পৌরসভা',
    latitude: 25.6279,
    longitude: 88.6332,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo']
  },
  {
    id: 'DLR-DHK-004',
    name: 'M/S Chowdhury & Sons',
    tradeLicenseBusinessName: 'M/S Chowdhury & Sons',
    dealerOwnerName: 'কবির হোসেন চৌধুরী',
    tradeLicenseNumber: 'TRAD/DSCC/2026/8821',
    dealerId: 'DLR-DHK-004',
    code: 'DLR-DHK-004',
    contactPerson: 'কবির হোসেন চৌধুরী (স্বত্বাধিকারী)',
    contactPhone: '+8801711002233',
    address: 'প্লট ১৪, রোড ০২, মিরপুর ১০ গোলচত্বর, ঢাকা',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    zoneId: 'upz_101',
    zoneName: 'Mirpur Zone',
    unionOrArea: 'মিরপুর-১০',
    latitude: 23.8069,
    longitude: 90.3687,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo', 'air_cargo']
  },
  {
    id: 'DLR-CTG-005',
    name: 'M/S Al-Madina Enterprise',
    tradeLicenseBusinessName: 'M/S Al-Madina Enterprise',
    dealerOwnerName: 'আবুল কালাম',
    tradeLicenseNumber: 'TRAD/CCC/2026/1029',
    dealerId: 'DLR-CTG-005',
    code: 'DLR-CTG-005',
    contactPerson: 'আবুল কালাম (স্বত্বাধিকারী)',
    contactPhone: '+8801819223344',
    address: 'দোকান ১২, নিউ মার্কেট লেন, আন্দরকিল্লা, কোতোয়ালী, চট্টগ্রাম',
    division: 'চট্টগ্রাম',
    district: 'চট্টগ্রাম',
    upazila: 'কোতোয়ালী',
    zoneId: 'upz_201',
    zoneName: 'Kotwali Zone',
    unionOrArea: 'আন্দরকিল্লা',
    latitude: 22.3390,
    longitude: 91.8320,
    coverageRadiusKm: 30,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo', 'air_cargo']
  },
  {
    id: 'DLR-RAJ-006',
    name: 'M/S Padma Traders',
    tradeLicenseBusinessName: 'M/S Padma Traders',
    dealerOwnerName: 'মাহবুব আলম',
    tradeLicenseNumber: 'TRAD/RCC/2026/0542',
    dealerId: 'DLR-RAJ-006',
    code: 'DLR-RAJ-006',
    contactPerson: 'মাহবুব আলম (স্বত্বাধিকারী)',
    contactPhone: '+8801712889900',
    address: 'সাহেব বাজার মেইন রোড, বোয়ালিয়া, রাজশাহী',
    division: 'রাজশাহী',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    zoneId: 'upz_301',
    zoneName: 'Boalia Zone',
    unionOrArea: 'সাহেব বাজার',
    latitude: 24.3750,
    longitude: 88.6050,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo']
  },
  {
    id: 'DLR-SYL-007',
    name: 'M/S Surma Agro & Enterprise',
    tradeLicenseBusinessName: 'M/S Surma Agro & Enterprise',
    dealerOwnerName: 'ফারুক আহমেদ',
    tradeLicenseNumber: 'TRAD/SCC/2026/0912',
    dealerId: 'DLR-SYL-007',
    code: 'DLR-SYL-007',
    contactPerson: 'ফারুক আহমেদ (স্বত্বাধিকারী)',
    contactPhone: '+8801713998877',
    address: 'জিন্দাবাজার মেইন পয়েন্ট, সিলেট সদর, সিলেট',
    division: 'সিলেট',
    district: 'সিলেট',
    upazila: 'সিলেট সদর',
    zoneId: 'upz_501',
    zoneName: 'Sylhet Sadar Zone',
    unionOrArea: 'জিন্দাবাজার',
    latitude: 24.8949,
    longitude: 91.8687,
    coverageRadiusKm: 20,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo', 'air_cargo']
  }
];

export const DEFAULT_COURIER_SLABS: CourierWeightSlab[] = [
  { id: 'cs-1', minKg: 0, maxKg: 0.5, rateInsideDhaka: 60, rateSuburban: 90, rateOutsideDhaka: 110, label: '০ – ০.৫ কেজি' },
  { id: 'cs-2', minKg: 0.51, maxKg: 1.0, rateInsideDhaka: 70, rateSuburban: 100, rateOutsideDhaka: 120, label: '০.৫১ – ১ কেজি' },
  { id: 'cs-3', minKg: 1.01, maxKg: 2.0, rateInsideDhaka: 90, rateSuburban: 120, rateOutsideDhaka: 140, label: '১.০১ – ২ কেজি' },
  { id: 'cs-4', minKg: 2.01, maxKg: 3.0, rateInsideDhaka: 110, rateSuburban: 140, rateOutsideDhaka: 160, label: '২.০১ – ৩ কেজি' },
  { id: 'cs-5', minKg: 3.01, maxKg: 5.0, rateInsideDhaka: 150, rateSuburban: 180, rateOutsideDhaka: 200, label: '৩.০১ – ৫ কেজি' },
  { id: 'cs-6', minKg: 5.01, maxKg: 6.0, rateInsideDhaka: 175, rateSuburban: 205, rateOutsideDhaka: 225, label: '৫.০১ – ৬ কেজি' },
  { id: 'cs-7', minKg: 6.01, maxKg: 7.0, rateInsideDhaka: 200, rateSuburban: 230, rateOutsideDhaka: 250, label: '৬.০১ – ৭ কেজি' },
  { id: 'cs-8', minKg: 7.01, maxKg: 8.0, rateInsideDhaka: 225, rateSuburban: 255, rateOutsideDhaka: 275, label: '৭.০১ – ৮ কেজি' },
  { id: 'cs-9', minKg: 8.01, maxKg: 9.0, rateInsideDhaka: 250, rateSuburban: 280, rateOutsideDhaka: 300, label: '৮.০১ – ৯ কেজি' },
  { id: 'cs-10', minKg: 9.01, maxKg: 10.0, rateInsideDhaka: 275, rateSuburban: 305, rateOutsideDhaka: 330, label: '৯.০১ – ১০ কেজি' }
];

export const DEFAULT_LOCAL_HEAVY_CONFIG: LocalHeavyDeliveryConfig = {
  enabled: true,
  minWeightKg: 10,
  maxWeightKg: 50,
  maxDistanceKm: 10,
  slabs: [
    { id: 'lh-1', minKm: 0, maxKm: 0.5, charge: 20, label: '০ – ০.৫ কিমি (৳২০)' },
    { id: 'lh-2', minKm: 0.51, maxKm: 1.0, charge: 50, label: '০.৫১ – ১ কিমি (৳৫০)' },
    { id: 'lh-3', minKm: 1.01, maxKm: 2.0, charge: 70, label: '১.০১ – ২ কিমি (৳৭০)' },
    { id: 'lh-4', minKm: 2.01, maxKm: 3.0, charge: 90, label: '২.০১ – ৩ কিমি (৳৯০)' },
    { id: 'lh-5', minKm: 3.01, maxKm: 5.0, charge: 120, label: '৩.০১ – ৫ কিমি (৳১২০)' },
    { id: 'lh-6', minKm: 5.01, maxKm: 10.0, charge: 180, label: '৫.০১ – ১০ কিমি (৳১৮০)' }
  ],
  beyondMaxDistancePolicy: 'road_cargo'
};

export const DEFAULT_CARGO_TIERS: CargoWeightTierConfig[] = [
  {
    id: 'cg-tier-1',
    name: 'Heavy Cargo (50-100 KG)',
    nameBn: 'হেভি কার্গো (৫০–১০০ কেজি)',
    minKg: 50.01,
    maxKg: 100,
    baseCharge: 350,
    perKgCharge: 8,
    perKmCharge: 4,
    minTotalCharge: 400,
    requiresCustomQuote: false
  },
  {
    id: 'cg-tier-2',
    name: 'Heavy Road Transport (100-200 KG)',
    nameBn: 'হেভি রোড ট্রান্সপোর্ট (১০০–২০০ কেজি)',
    minKg: 100.01,
    maxKg: 200,
    baseCharge: 700,
    perKgCharge: 6,
    perKmCharge: 5,
    minTotalCharge: 800,
    requiresCustomQuote: false
  },
  {
    id: 'cg-tier-3',
    name: 'Bulk Custom Transport (200+ KG)',
    nameBn: 'বাল্ক কাস্টম ট্রান্সপোর্ট (২০০+ কেজি)',
    minKg: 200.01,
    maxKg: 10000,
    baseCharge: 1500,
    perKgCharge: 5,
    perKmCharge: 6,
    minTotalCharge: 1800,
    requiresCustomQuote: true
  }
];

export const DEFAULT_ROAD_CARGO_CONFIG: RoadCargoConfig = {
  enabled: true,
  basePickupFee: 150,
  hubHandlingFee: 100,
  perKgRate: 6,
  perKmRate: 4,
  destinationHandlingFee: 100,
  lastMileFee: 150,
  minimumCharge: 450
};

export const DEFAULT_AIR_CARGO_CONFIG: AirCargoConfig = {
  enabled: true,
  dealerToAirportFee: 200,
  departureAirportHandlingFee: 150,
  airFreightPerKgRate: 45,
  minimumFreightCharge: 500,
  destinationAirportHandlingFee: 150,
  finalLastMileFee: 250
};

export const DEFAULT_RIDER_INCENTIVE: RiderIncentiveConfig = {
  baseFeePerOrder: 35,
  extraPerKmFee: 6,
  heavyWeightBonusKg10To50: 45,
  heavyWeightBonusKg50Plus: 120
};

export const DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG: SuperAdminDeliveryConfig = {
  id: 'delivery-config-v2',
  version: 2,
  updatedAt: new Date().toISOString(),
  updatedBy: 'SUPER_ADMIN',
  status: 'active',
  emergencyNotice: '',
  zones: {
    inside_dhaka: {
      id: 'inside_dhaka',
      name: 'Inside Dhaka',
      nameBn: 'ঢাকা মেট্রো (Inside Dhaka)',
      enabled: true,
      baseCharge: 60,
      insidePaurashavaRate: 60,
      outsidePaurashavaRate: 70,
      weightRates: {
        weight0To500g: 60,
        weight500gTo1kg: 70,
        weight1To2kg: 90,
        weightAbove2kgPerKg: 20
      }
    },
    suburban_dhaka: {
      id: 'suburban_dhaka',
      name: 'Suburban / Near Dhaka',
      nameBn: 'ঢাকা উপশহর ও পার্শ্ববর্তী (Suburban Dhaka)',
      enabled: true,
      baseCharge: 100,
      insidePaurashavaRate: 100,
      outsidePaurashavaRate: 110,
      weightRates: {
        weight0To500g: 90,
        weight500gTo1kg: 100,
        weight1To2kg: 120,
        weightAbove2kgPerKg: 25
      }
    },
    outside_dhaka: {
      id: 'outside_dhaka',
      name: 'Outside Dhaka',
      nameBn: 'ঢাকার বাইরে (Outside Dhaka)',
      enabled: true,
      baseCharge: 120,
      insidePaurashavaRate: 120,
      outsidePaurashavaRate: 140,
      weightRates: {
        weight0To500g: 110,
        weight500gTo1kg: 120,
        weight1To2kg: 150,
        weightAbove2kgPerKg: 30
      }
    }
  },
  distanceRule: {
    enabled: true,
    baseDistanceKm: 1,
    extraPerKmCharge: 15,
    roundingMode: 'round_up',
    maxDistanceKm: 50
  },
  paurashavaRule: {
    enabled: true,
    insidePaurashavaBaseModifier: 0,
    outsidePaurashavaSurcharge: 15
  },
  defaultWeightRates: {
    weight0To500g: 60,
    weight500gTo1kg: 70,
    weight1To2kg: 100,
    weightAbove2kgPerKg: 25
  },
  courierSlabs: DEFAULT_COURIER_SLABS,
  localHeavyConfig: DEFAULT_LOCAL_HEAVY_CONFIG,
  cargoTiers: DEFAULT_CARGO_TIERS,
  roadCargoConfig: DEFAULT_ROAD_CARGO_CONFIG,
  airCargoConfig: DEFAULT_AIR_CARGO_CONFIG,
  dealerPoints: DEFAULT_DEALER_POINTS,
  riderIncentive: DEFAULT_RIDER_INCENTIVE,
  auditLogs: []
};

export const getStoredDeliveryConfig = (): SuperAdminDeliveryConfig => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('tomshopbd_delivery_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG,
          ...parsed,
          zones: {
            inside_dhaka: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.zones.inside_dhaka, ...parsed.zones?.inside_dhaka },
            suburban_dhaka: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.zones.suburban_dhaka, ...parsed.zones?.suburban_dhaka },
            outside_dhaka: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.zones.outside_dhaka, ...parsed.zones?.outside_dhaka }
          },
          distanceRule: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.distanceRule, ...parsed.distanceRule },
          paurashavaRule: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.paurashavaRule, ...parsed.paurashavaRule },
          defaultWeightRates: { ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG.defaultWeightRates, ...parsed.defaultWeightRates },
          courierSlabs: parsed.courierSlabs && parsed.courierSlabs.length > 0 ? parsed.courierSlabs : DEFAULT_COURIER_SLABS,
          localHeavyConfig: parsed.localHeavyConfig ? { ...DEFAULT_LOCAL_HEAVY_CONFIG, ...parsed.localHeavyConfig } : DEFAULT_LOCAL_HEAVY_CONFIG,
          cargoTiers: parsed.cargoTiers && parsed.cargoTiers.length > 0 ? parsed.cargoTiers : DEFAULT_CARGO_TIERS,
          roadCargoConfig: parsed.roadCargoConfig ? { ...DEFAULT_ROAD_CARGO_CONFIG, ...parsed.roadCargoConfig } : DEFAULT_ROAD_CARGO_CONFIG,
          airCargoConfig: parsed.airCargoConfig ? { ...DEFAULT_AIR_CARGO_CONFIG, ...parsed.airCargoConfig } : DEFAULT_AIR_CARGO_CONFIG,
          dealerPoints: parsed.dealerPoints && parsed.dealerPoints.length > 0 ? parsed.dealerPoints : DEFAULT_DEALER_POINTS,
          riderIncentive: parsed.riderIncentive ? { ...DEFAULT_RIDER_INCENTIVE, ...parsed.riderIncentive } : DEFAULT_RIDER_INCENTIVE,
          auditLogs: parsed.auditLogs || []
        };
      }
    }
  } catch (e) {
    console.error('Failed to load stored delivery config:', e);
  }
  return DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG;
};

export const saveStoredDeliveryConfig = (config: SuperAdminDeliveryConfig): { success: boolean; message: string } => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('tomshopbd_delivery_config', JSON.stringify(config));
      return { success: true, message: 'ডেলিভারি চার্জ কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে।' };
    }
  } catch (e) {
    console.error('Failed to save delivery config:', e);
    return { success: false, message: 'সংরক্ষণ ব্যর্থ হয়েছে।' };
  }
  return { success: true, message: 'সংরক্ষিত হয়েছে।' };
};

export const validateDeliveryConfig = (config: SuperAdminDeliveryConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config) {
    return { isValid: false, errors: ['কনফিগারেশন পাওয়া যায়নি'] };
  }

  if (config.distanceRule.baseDistanceKm <= 0) {
    errors.push('বেস দূরত্ব (Base Distance) অবশ্যই ০ এর চেয়ে বেশি হতে হবে (যেমন ১ কিমি)');
  }
  if (config.distanceRule.extraPerKmCharge < 0) {
    errors.push('প্রতি অতিরিক্ত কিমি চার্জ (Extra per KM Charge) ঋণাত্মক হতে পারবে না');
  }

  const zoneKeys: DeliveryZoneType[] = ['inside_dhaka', 'suburban_dhaka', 'outside_dhaka'];
  for (const key of zoneKeys) {
    const zone = config.zones[key];
    if (!zone) {
      errors.push(`জোন '${key}' কনফিগারেশন বিদ্যমান নেই`);
      continue;
    }
    if (zone.baseCharge < 0) errors.push(`${zone.nameBn}: বেস ডেলিভারি চার্জ ঋণাত্মক হতে পারবে না`);
    if (zone.insidePaurashavaRate < 0) errors.push(`${zone.nameBn}: পৌরসভা রেট ঋণাত্মক হতে পারবে না`);
    if (zone.outsidePaurashavaRate < 0) errors.push(`${zone.nameBn}: পৌরসভার বাইরের রেট ঋণাত্মক হতে পারবে না`);
  }

  // Validate Courier slabs: minKg <= maxKg, rates >= 0
  if (config.courierSlabs) {
    for (let i = 0; i < config.courierSlabs.length; i++) {
      const slab = config.courierSlabs[i];
      if (slab.minKg >= slab.maxKg) {
        errors.push(`কুরিয়ার স্ল্যাব ${slab.label}: শুরু ওজন (${slab.minKg}) শেষ ওজনের (${slab.maxKg}) চেয়ে ছোট হতে হবে`);
      }
      if (slab.rateInsideDhaka < 0 || slab.rateSuburban < 0 || slab.rateOutsideDhaka < 0) {
        errors.push(`কুরিয়ার স্ল্যাব ${slab.label}: রেট ঋণাত্মক হতে পারবে না`);
      }
    }
  }

  // Validate Local Heavy distance slabs: minKm <= maxKm, charge >= 0
  if (config.localHeavyConfig?.slabs) {
    for (const slab of config.localHeavyConfig.slabs) {
      if (slab.minKm >= slab.maxKm) {
        errors.push(`লোকাল হেভি স্ল্যাব ${slab.label}: শুরু দূরত্ব (${slab.minKm}) শেষ দূরত্বের (${slab.maxKm}) চেয়ে ছোট হতে হবে`);
      }
      if (slab.charge < 0) {
        errors.push(`লোকাল হেভি স্ল্যাব ${slab.label}: চার্জ ঋণাত্মক হতে পারবে না`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const applyDistanceRounding = (distanceKm: number, mode: DistanceRoundingMode): number => {
  if (distanceKm <= 0) return 0;
  switch (mode) {
    case 'round_up':
      return Math.ceil(distanceKm);
    case 'round_down':
      return Math.floor(distanceKm);
    case 'exact':
    default:
      return Number(distanceKm.toFixed(2));
  }
};

/**
 * Calculates road distance between Dealer Point and Customer Address in KM.
 * Uses realistic Haversine formula with a 1.28 road winding multiplier.
 */
export const calculateRoadDistanceKm = (
  dealerLat?: number,
  dealerLng?: number,
  customerLat?: number,
  customerLng?: number,
  fallbackKm: number = 1
): { distanceKm: number; method: 'google_maps' | 'haversine_road' | 'manual' } => {
  if (
    dealerLat !== undefined &&
    dealerLng !== undefined &&
    customerLat !== undefined &&
    customerLng !== undefined &&
    dealerLat !== 0 &&
    dealerLng !== 0 &&
    customerLat !== 0 &&
    customerLng !== 0
  ) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // Earth radius in KM
    const dLat = toRad(customerLat - dealerLat);
    const dLon = toRad(customerLng - dealerLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(dealerLat)) * Math.cos(toRad(customerLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;
    const roadKm = Number((straightKm * 1.28).toFixed(2));
    return {
      distanceKm: Math.max(0.2, roadKm),
      method: 'haversine_road'
    };
  }
  return {
    distanceKm: Math.max(0.1, Number(fallbackKm) || 1),
    method: 'manual'
  };
};

/**
 * Resolves the closest active Dealer Point for the customer address.
 */
export const resolveNearestDealerPoint = (
  customerAddress?: ServiceAddress | null,
  dealerPointsArg?: DealerPoint[]
): DealerPoint => {
  const points = (dealerPointsArg && dealerPointsArg.length > 0) ? dealerPointsArg : DEFAULT_DEALER_POINTS;
  const activePoints = points.filter(p => p.isActive);
  if (activePoints.length === 0) return points[0] || DEFAULT_DEALER_POINTS[0];

  if (!customerAddress) return activePoints[0];

  const custDist = (customerAddress.district || '').trim().toLowerCase();
  const custDiv = (customerAddress.division || '').trim().toLowerCase();

  // 1. Direct match by district
  const distMatch = activePoints.find(p => p.district.toLowerCase() === custDist || custDist.includes(p.district.toLowerCase()));
  if (distMatch) return distMatch;

  // 2. Direct match by division
  const divMatch = activePoints.find(p => p.division.toLowerCase() === custDiv || custDiv.includes(p.division.toLowerCase()));
  if (divMatch) return divMatch;

  // 3. Fallback to first active point
  return activePoints[0];
};

export const resolveDeliveryZone = (
  addressOrDivision?: ServiceAddress | string | null,
  districtArg?: string
): {
  zoneId: DeliveryZoneType;
  zoneName: string;
  zoneNameBn: string;
  district: string;
  upazila: string;
  isPaurashava: boolean;
} => {
  let division = '';
  let district = '';
  let upazila = '';
  let unionName = '';
  let isPaurashava = true;

  if (typeof addressOrDivision === 'string') {
    division = addressOrDivision;
    district = districtArg || '';
  } else if (addressOrDivision && typeof addressOrDivision === 'object') {
    division = addressOrDivision.division || '';
    district = addressOrDivision.district || '';
    upazila = addressOrDivision.upazila || '';
    unionName = addressOrDivision.unionName || '';
    if (addressOrDivision.isPaurashava !== undefined) {
      isPaurashava = Boolean(addressOrDivision.isPaurashava);
    } else {
      const combined = `${unionName} ${addressOrDivision.area || ''}`.toLowerCase();
      if (
        combined.includes('পৌরসভা') ||
        combined.includes('pourashava') ||
        combined.includes('paurashava') ||
        combined.includes('municipality') ||
        combined.includes('সিটি') ||
        combined.includes('কর্পোরেশন')
      ) {
        isPaurashava = true;
      } else if (combined.includes('ইউনিয়ন') || combined.includes('union') || combined.includes('গ্রাম')) {
        isPaurashava = false;
      } else {
        isPaurashava = true;
      }
    }
  }

  const divLower = division.trim().toLowerCase();
  const distLower = district.trim().toLowerCase();
  const upaLower = upazila.trim().toLowerCase();

  const suburbanDistricts = [
    'গাজীপুর', 'gazipur',
    'নারায়ণগঞ্জ', 'narayanganj',
    'মুন্সীগঞ্জ', 'munshiganj',
    'মানিকগঞ্জ', 'manikganj',
    'নরসিংদী', 'narsingdi'
  ];

  const suburbanDhakaUpazilas = [
    'সাভার', 'savar',
    'কেরানীগঞ্জ', 'keraniganj',
    'ধামরাই', 'dhamrai',
    'নবাবগঞ্জ', 'nawabganj',
    'দোহার', 'dohar',
    'আশুলিয়া', 'ashulia'
  ];

  const isDhakaDistrict = distLower.includes('ঢাকা') || distLower.includes('dhaka');
  const isDhakaDivision = divLower.includes('ঢাকা') || divLower.includes('dhaka');

  let zoneId: DeliveryZoneType = 'outside_dhaka';
  let zoneName = 'Outside Dhaka';
  let zoneNameBn = 'ঢাকার বাইরে';

  if (isDhakaDistrict) {
    const isSuburbanUpa = suburbanDhakaUpazilas.some((u) => upaLower.includes(u));
    if (isSuburbanUpa) {
      zoneId = 'suburban_dhaka';
      zoneName = 'Suburban / Near Dhaka';
      zoneNameBn = 'ঢাকা উপশহর ও পার্শ্ববর্তী';
    } else {
      zoneId = 'inside_dhaka';
      zoneName = 'Inside Dhaka';
      zoneNameBn = 'ঢাকা মেট্রো';
    }
  } else if (suburbanDistricts.some((d) => distLower.includes(d))) {
    zoneId = 'suburban_dhaka';
    zoneName = 'Suburban / Near Dhaka';
    zoneNameBn = 'ঢাকা উপশহর ও পার্শ্ববর্তী';
  } else if (!distLower && isDhakaDivision) {
    zoneId = 'inside_dhaka';
    zoneName = 'Inside Dhaka';
    zoneNameBn = 'ঢাকা মেট্রো';
  }

  return {
    zoneId,
    zoneName,
    zoneNameBn,
    district,
    upazila,
    isPaurashava
  };
};

export const isClothingCategory = (
  category?: string,
  categoryId?: string,
  categoryName?: string
): boolean => {
  const candidates = [category, categoryId, categoryName]
    .filter(Boolean)
    .map((val) => String(val).toLowerCase().trim());

  if (candidates.length === 0) return false;

  return candidates.some(
    (c) =>
      c === 'cat-clothing-fashion' ||
      c === 'clothing-fashion' ||
      c.includes('clothing') ||
      c.includes('fashion') ||
      c.includes('পোশাক') ||
      c.includes('ক্লথিং') ||
      c.includes('ফ্যাশন') ||
      c.includes('t-shirt') ||
      c.includes('shirt') ||
      c.includes('panjabi') ||
      c.includes('saree') ||
      c.includes('jeans') ||
      c.includes('apparel')
  );
};

export const parseWeightToGrams = (
  weight?: string | number | null,
  fallbackKg?: number | null
): number => {
  if (weight !== undefined && weight !== null && weight !== '') {
    if (typeof weight === 'number') {
      if (weight <= 0) {
        // fall through
      } else if (weight <= 15) {
        return Math.round(weight * 1000);
      } else {
        return Math.round(weight);
      }
    } else {
      const str = String(weight).trim().toLowerCase();
      if (str.includes('kg') || str.includes('কেজি')) {
        const num = parseFloat(str.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) return Math.round(num * 1000);
      }
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num) && num > 0) {
        if (num <= 15 && !str.includes('g') && !str.includes('gm')) {
          return Math.round(num * 1000);
        }
        return Math.round(num);
      }
    }
  }

  if (fallbackKg && fallbackKg > 0) {
    return Math.round(fallbackKg * 1000);
  }

  return 250;
};

export const formatWeightDisplay = (grams: number): string => {
  if (grams >= 1000) {
    const kg = Number((grams / 1000).toFixed(2));
    return `${kg} kg`;
  }
  return `${Math.round(grams)}g`;
};

export const resolveVariantWeightGrams = (
  variant?: ProductVariant | null,
  product?: Product | null
): number => {
  if (variant) {
    if (variant.weightGrams && variant.weightGrams > 0) {
      return Math.round(variant.weightGrams);
    }
    if (variant.weight !== undefined && variant.weight !== null) {
      return parseWeightToGrams(variant.weight, variant.weightKg || product?.weightKg);
    }
    if (variant.weightKg && variant.weightKg > 0) {
      return Math.round(variant.weightKg * 1000);
    }
  }

  if (product?.weightKg && product.weightKg > 0) {
    return Math.round(product.weightKg * 1000);
  }

  return 250;
};

export const calculateItemTotalWeight = (
  variant?: ProductVariant | null,
  quantity: number = 1,
  product?: Product | null
): {
  unitWeightGrams: number;
  totalWeightGrams: number;
  unitWeightDisplay: string;
  totalWeightDisplay: string;
} => {
  const safeQty = Math.max(1, Number(quantity) || 1);
  const unitWeightGrams = resolveVariantWeightGrams(variant, product);
  const totalWeightGrams = unitWeightGrams * safeQty;

  return {
    unitWeightGrams,
    totalWeightGrams,
    unitWeightDisplay: formatWeightDisplay(unitWeightGrams),
    totalWeightDisplay: formatWeightDisplay(totalWeightGrams)
  };
};

export interface CourierDeliveryResult {
  baseCharge: number;
  weightSurcharge: number;
  distanceCharge: number;
  paurashavaSurcharge: number;
  handlingCharge: number;
  totalDeliveryCharge: number;
  totalWeightGrams: number;
  totalWeightKg: number;
  totalWeightDisplay: string;
  isDhaka: boolean;
  zone: DeliveryZoneType;
  zoneName: string;
  zoneNameBn: string;
  isPaurashava: boolean;
  weightSlabLabel: string;
  distanceKm: number;
  effectiveDistanceKm: number;
  isOverweight: boolean;
  extraKg: number;
  rateBreakdown: string;
  deliveryMode: DeliveryMode;
  deliveryModeLabel: string;
  appliedRule: string;
  dealerPoint: DealerPoint;
  deliverySnapshot: OrderDeliverySnapshot;
}

/**
 * CENTRALIZED DELIVERY CALCULATION ENGINE
 * 
 * Strict 11-step rate precedence order:
 * 1. Manual/Admin Override
 * 2. Product-Specific Delivery Rule
 * 3. Category-Specific Delivery Rule
 * 4. Delivery-Mode-Specific Rule
 * 5. Weight-Based Rule (Courier 0-10kg, Local Heavy 10-50kg, Cargo 50kg+)
 * 6. Local Distance/Zone Rule (Inside Dhaka, Suburban, Outside Dhaka, Pourashava)
 * 7. Courier Rate
 * 8. Cargo Rate
 * 9. Road Transport Rate
 * 10. Air Cargo Rate
 * 11. Global Default Rate
 */
export const calculateCourierShippingCharge = (
  totalWeightGrams: number,
  address?: ServiceAddress | null,
  productBaseCost?: number,
  distanceKmArg?: number,
  customConfig?: SuperAdminDeliveryConfig,
  preferredMode?: DeliveryMode,
  specificDealerPoint?: DealerPoint,
  ruleOverride?: { isFixed: boolean; fixedCharge: number; ruleName: string }
): CourierDeliveryResult => {
  const config = customConfig || getStoredDeliveryConfig();
  const zoneInfo = resolveDeliveryZone(address);
  const zone = (config.zones && config.zones[zoneInfo.zoneId]) || config.zones.inside_dhaka;

  // 1. Resolve Dealer Point & Distance
  const dealerPoint = specificDealerPoint || resolveNearestDealerPoint(address, config.dealerPoints);
  const distanceCalc = calculateRoadDistanceKm(
    dealerPoint.latitude,
    dealerPoint.longitude,
    address?.latitude,
    address?.longitude,
    distanceKmArg !== undefined && distanceKmArg >= 0 ? distanceKmArg : (address?.distanceKm || 1)
  );

  const rawDistance = distanceKmArg !== undefined && distanceKmArg >= 0
    ? distanceKmArg
    : (address?.distanceKm !== undefined && address.distanceKm > 0 ? address.distanceKm : distanceCalc.distanceKm);

  const effectiveDistance = applyDistanceRounding(rawDistance, config.distanceRule?.roundingMode || 'round_up');
  const totalWeightKg = Number((totalWeightGrams / 1000).toFixed(2));
  const totalWeightDisplay = formatWeightDisplay(totalWeightGrams);

  // 2. Determine Recommended Delivery Mode if not explicitly requested
  let resolvedMode: DeliveryMode = preferredMode || 'courier';
  if (!preferredMode) {
    if (totalWeightKg <= 10) {
      if (effectiveDistance <= 3 && totalWeightKg <= 5) {
        resolvedMode = 'motorcycle';
      } else {
        resolvedMode = 'courier';
      }
    } else if (totalWeightKg > 10 && totalWeightKg <= 50) {
      const maxLocalKm = config.localHeavyConfig?.maxDistanceKm || 10;
      if (effectiveDistance <= maxLocalKm && config.localHeavyConfig?.enabled) {
        resolvedMode = 'motorcycle'; // Local Heavy Delivery
      } else {
        resolvedMode = 'road_cargo';
      }
    } else if (totalWeightKg > 50 && totalWeightKg <= 200) {
      resolvedMode = 'road_cargo';
    } else {
      resolvedMode = 'road_cargo';
    }
  }

  // Precedence 1 & 2: Rule Override (Manual Admin or Product/Category Rule)
  if (ruleOverride && ruleOverride.isFixed) {
    const fixedCharge = ruleOverride.fixedCharge;
    const rateBreakdown = `${ruleOverride.ruleName}: ৳${fixedCharge} (স্থির রেট)`;
    const snapshot: OrderDeliverySnapshot = {
      deliveryZone: zoneInfo.zoneId,
      deliveryZoneName: zoneInfo.zoneNameBn,
      zoneNameBn: zoneInfo.zoneNameBn,
      district: zoneInfo.district || 'ঢাকা',
      upazila: zoneInfo.upazila || '',
      paurashavaOrUnion: address?.unionName || (zoneInfo.isPaurashava ? 'পৌরসভা এলাকা' : 'ইউনিয়ন / গ্রামীণ এলাকা'),
      isPaurashava: zoneInfo.isPaurashava,
      distanceKm: rawDistance,
      distanceMode: config.distanceRule?.roundingMode || 'round_up',
      effectiveDistanceKm: effectiveDistance,
      totalWeightGrams,
      totalWeightKg,
      totalWeightDisplay,
      weightSlab: 'নির্দিষ্ট নিয়ম (Override)',
      baseDeliveryCharge: fixedCharge,
      extraDistanceCharge: 0,
      weightSurcharge: 0,
      paurashavaSurcharge: 0,
      handlingCharge: 0,
      finalDeliveryCharge: fixedCharge,
      rateBreakdown,
      calculatedAt: new Date().toISOString(),
      deliveryMode: resolvedMode,
      deliveryModeLabel: 'স্পেশাল রুল ডেলিভারি',
      appliedRule: ruleOverride.ruleName,
      routeCalculationMethod: distanceCalc.method,
      dealerPoint: {
        id: dealerPoint.id,
        name: dealerPoint.name,
        address: dealerPoint.address,
        district: dealerPoint.district,
        upazila: dealerPoint.upazila,
        latitude: dealerPoint.latitude,
        longitude: dealerPoint.longitude
      },
      customerAddress: {
        address: address?.fullServiceAddress || address?.area || 'গ্রাহকের ঠিকানা',
        district: zoneInfo.district || 'ঢাকা',
        upazila: zoneInfo.upazila || '',
        isPaurashava: zoneInfo.isPaurashava,
        latitude: address?.latitude,
        longitude: address?.longitude
      },
      rateVersion: config.version
    };

    return {
      baseCharge: fixedCharge,
      weightSurcharge: 0,
      distanceCharge: 0,
      paurashavaSurcharge: 0,
      handlingCharge: 0,
      totalDeliveryCharge: fixedCharge,
      totalWeightGrams,
      totalWeightKg,
      totalWeightDisplay,
      isDhaka: zoneInfo.zoneId === 'inside_dhaka',
      zone: zoneInfo.zoneId,
      zoneName: zoneInfo.zoneName,
      zoneNameBn: zoneInfo.zoneNameBn,
      isPaurashava: zoneInfo.isPaurashava,
      weightSlabLabel: 'Override',
      distanceKm: rawDistance,
      effectiveDistanceKm: effectiveDistance,
      isOverweight: false,
      extraKg: 0,
      rateBreakdown,
      deliveryMode: resolvedMode,
      deliveryModeLabel: 'স্পেশাল রুল ডেলিভারি',
      appliedRule: ruleOverride.ruleName,
      dealerPoint,
      deliverySnapshot: snapshot
    };
  }

  // 3. Calculation by Mode & Weight
  let baseWeightCharge = 60;
  let weightSurcharge = 0;
  let distanceCharge = 0;
  let paurashavaSurcharge = 0;
  let handlingCharge = 0;
  let weightSlabLabel = '০–০.৫ কেজি';
  let distanceSlabLabel = '';
  let appliedRule = 'Normal Courier';
  let deliveryModeLabel = 'কুরিয়ার ডেলিভারি (Courier)';
  let isOverweight = false;
  let extraKg = 0;

  // A. LOCAL HEAVY DELIVERY (10–50 KG, within local distance e.g. <= 10 km)
  const isLocalHeavyEligible =
    totalWeightKg >= (config.localHeavyConfig?.minWeightKg || 10) &&
    totalWeightKg <= (config.localHeavyConfig?.maxWeightKg || 50) &&
    effectiveDistance <= (config.localHeavyConfig?.maxDistanceKm || 10) &&
    config.localHeavyConfig?.enabled;

  if (isLocalHeavyEligible) {
    appliedRule = 'Local Heavy Delivery (10–50 KG Fixed Distance Slab)';
    deliveryModeLabel = 'লোকাল হেভি ডেলিভারি (Local Heavy 10-50 KG)';
    resolvedMode = 'motorcycle';

    const slabs = config.localHeavyConfig?.slabs || DEFAULT_LOCAL_HEAVY_CONFIG.slabs;
    let matchedSlab = slabs.find((s) => effectiveDistance >= s.minKm && effectiveDistance <= s.maxKm);
    if (!matchedSlab) {
      matchedSlab = slabs[slabs.length - 1]; // Default to highest slab if within max distance
    }

    baseWeightCharge = matchedSlab.charge; // FIXED distance slab charge (e.g. 0.8km = ৳50, 2.5km = ৳90, 7km = ৳180)
    distanceSlabLabel = matchedSlab.label;
    weightSlabLabel = `১০–৫০ কেজি (${totalWeightDisplay})`;
    
    // IMPORTANT: Local Heavy Delivery uses a FIXED distance slab.
    // Do NOT multiply the local charge by distance.
    // Do NOT additionally apply normal courier per-kg charges.
    weightSurcharge = 0;
    distanceCharge = 0;
    paurashavaSurcharge = 0;
  }
  // B. HEAVY CARGO (50+ KG) or Road Cargo
  else if (resolvedMode === 'road_cargo' || totalWeightKg > 50) {
    appliedRule = 'Heavy Road Cargo / Covered Van';
    deliveryModeLabel = 'রোড কার্গো / কাভার্ড ভ্যান (Road Cargo)';

    if (totalWeightKg > 50) {
      const tiers = config.cargoTiers || DEFAULT_CARGO_TIERS;
      let matchedTier = tiers.find(t => totalWeightKg >= t.minKg && totalWeightKg <= t.maxKg);
      if (!matchedTier) matchedTier = tiers[tiers.length - 1];

      baseWeightCharge = matchedTier.baseCharge;
      extraKg = Math.max(0, Math.ceil(totalWeightKg - matchedTier.minKg));
      weightSurcharge = extraKg * matchedTier.perKgCharge;
      distanceCharge = Math.ceil(effectiveDistance) * matchedTier.perKmCharge;
      weightSlabLabel = matchedTier.nameBn;
      
      const subtotalCargo = baseWeightCharge + weightSurcharge + distanceCharge;
      if (subtotalCargo < matchedTier.minTotalCharge) {
        baseWeightCharge = matchedTier.minTotalCharge;
        weightSurcharge = 0;
        distanceCharge = 0;
      }
    } else {
      // 10-50 kg beyond 10 km using Road Cargo
      const rc = config.roadCargoConfig || DEFAULT_ROAD_CARGO_CONFIG;
      baseWeightCharge = rc.basePickupFee + rc.lastMileFee;
      handlingCharge = rc.hubHandlingFee + rc.destinationHandlingFee;
      weightSurcharge = Math.ceil(totalWeightKg) * rc.perKgRate;
      distanceCharge = Math.ceil(effectiveDistance) * rc.perKmRate;
      weightSlabLabel = `১০–৫০ কেজি দূরপাল্লা কার্গো (${totalWeightDisplay})`;

      const sumRc = baseWeightCharge + handlingCharge + weightSurcharge + distanceCharge;
      if (sumRc < rc.minimumCharge) {
        baseWeightCharge = rc.minimumCharge;
        handlingCharge = 0;
        weightSurcharge = 0;
        distanceCharge = 0;
      }
    }
  }
  // C. AIR CARGO
  else if (resolvedMode === 'air_cargo') {
    appliedRule = 'Air Cargo Express Delivery';
    deliveryModeLabel = 'এয়ার কার্গো এক্সপ্রেস (Air Cargo)';
    const ac = config.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG;

    baseWeightCharge = ac.dealerToAirportFee + ac.finalLastMileFee;
    handlingCharge = ac.departureAirportHandlingFee + ac.destinationAirportHandlingFee;
    const freightCost = Math.max(ac.minimumFreightCharge, Math.ceil(totalWeightKg) * ac.airFreightPerKgRate);
    weightSurcharge = freightCost;
    distanceCharge = 0;
    weightSlabLabel = `এয়ার কার্গো ফ্রেইট (${totalWeightDisplay})`;
  }
  // D. NORMAL COURIER / MOTORCYCLE (0–10 KG)
  else {
    deliveryModeLabel = resolvedMode === 'motorcycle' ? 'মোটরসাইকেল এক্সপ্রেস (Motorcycle)' : 'রেগুলার কুরিয়ার (Courier)';
    appliedRule = 'Normal Courier Slabs (0–10 KG)';

    const courierSlabs = config.courierSlabs || DEFAULT_COURIER_SLABS;
    const matchedSlab = courierSlabs.find(s => totalWeightKg >= s.minKg && totalWeightKg <= s.maxKg);

    if (matchedSlab) {
      weightSlabLabel = matchedSlab.label;
      if (zoneInfo.zoneId === 'inside_dhaka') {
        baseWeightCharge = matchedSlab.rateInsideDhaka;
      } else if (zoneInfo.zoneId === 'suburban_dhaka') {
        baseWeightCharge = matchedSlab.rateSuburban;
      } else {
        baseWeightCharge = matchedSlab.rateOutsideDhaka;
      }
    } else if (totalWeightKg > 10) {
      // Over 10kg courier fallback
      const topSlab = courierSlabs[courierSlabs.length - 1];
      const baseTop = zoneInfo.zoneId === 'inside_dhaka'
        ? topSlab.rateInsideDhaka
        : (zoneInfo.zoneId === 'suburban_dhaka' ? topSlab.rateSuburban : topSlab.rateOutsideDhaka);

      baseWeightCharge = baseTop;
      extraKg = Math.ceil(totalWeightKg - 10);
      weightSurcharge = extraKg * (zone.weightRates.weightAbove2kgPerKg || 25);
      weightSlabLabel = `১০ কেজির উপরে (+${extraKg} কেজি)`;
      isOverweight = true;
    } else {
      baseWeightCharge = zone.weightRates.weight0To500g || 60;
      weightSlabLabel = '০–০.৫ কেজি';
    }

    // Paurashava Status Surcharge for Courier
    if (config.paurashavaRule?.enabled && !zoneInfo.isPaurashava) {
      paurashavaSurcharge = config.paurashavaRule.outsidePaurashavaSurcharge || 0;
    }

    // Distance Charge for Courier
    if (config.distanceRule?.enabled && effectiveDistance > config.distanceRule.baseDistanceKm) {
      const extraDist = effectiveDistance - config.distanceRule.baseDistanceKm;
      distanceCharge = extraDist * (config.distanceRule.extraPerKmCharge || 0);
    }
  }

  // Combine Total
  let totalDeliveryCharge = baseWeightCharge + weightSurcharge + distanceCharge + paurashavaSurcharge + handlingCharge;

  // Product base cost floor if set
  if (productBaseCost !== undefined && productBaseCost > totalDeliveryCharge) {
    totalDeliveryCharge = productBaseCost;
  }

  // Build Breakdown
  const breakdownParts: string[] = [];
  if (isLocalHeavyEligible) {
    breakdownParts.push(`লোকাল হেভি ডেলিভারি (${distanceSlabLabel}): ৳${baseWeightCharge}`);
  } else {
    breakdownParts.push(`${zoneInfo.zoneNameBn} বেস রেট (${weightSlabLabel}): ৳${baseWeightCharge}`);
    if (weightSurcharge > 0) breakdownParts.push(`ওজন সারচার্জ: ৳${weightSurcharge}`);
    if (handlingCharge > 0) breakdownParts.push(`হ্যান্ডলিং ফি: ৳${handlingCharge}`);
    if (paurashavaSurcharge > 0) breakdownParts.push(`পৌরসভার বাইরের এলাকা সারচার্জ: ৳${paurashavaSurcharge}`);
    if (distanceCharge > 0) breakdownParts.push(`দূরত্ব চার্জ (${effectiveDistance} কিমি): ৳${distanceCharge}`);
  }

  const rateBreakdown = breakdownParts.join(' + ');

  const deliverySnapshot: OrderDeliverySnapshot = {
    deliveryZone: zoneInfo.zoneId,
    deliveryZoneName: zoneInfo.zoneNameBn,
    zoneNameBn: zoneInfo.zoneNameBn,
    district: zoneInfo.district || 'ঢাকা',
    upazila: zoneInfo.upazila || '',
    paurashavaOrUnion: address?.unionName || (zoneInfo.isPaurashava ? 'পৌরসভা এলাকা' : 'ইউনিয়ন / গ্রামীণ এলাকা'),
    isPaurashava: zoneInfo.isPaurashava,
    distanceKm: rawDistance,
    distanceMode: config.distanceRule?.roundingMode || 'round_up',
    effectiveDistanceKm: effectiveDistance,
    totalWeightGrams,
    totalWeightKg,
    totalWeightDisplay,
    weightSlab: weightSlabLabel,
    distanceSlab: distanceSlabLabel || `${effectiveDistance} কিমি`,
    baseDeliveryCharge: baseWeightCharge,
    extraDistanceCharge: distanceCharge,
    weightSurcharge,
    paurashavaSurcharge,
    handlingCharge,
    finalDeliveryCharge: totalDeliveryCharge,
    rateBreakdown,
    calculatedAt: new Date().toISOString(),
    deliveryMode: resolvedMode,
    deliveryModeLabel,
    appliedRule,
    routeCalculationMethod: distanceCalc.method,
    dealerPoint: {
      id: dealerPoint.id,
      name: dealerPoint.name,
      address: dealerPoint.address,
      district: dealerPoint.district,
      upazila: dealerPoint.upazila,
      latitude: dealerPoint.latitude,
      longitude: dealerPoint.longitude
    },
    customerAddress: {
      address: address?.fullServiceAddress || address?.area || 'গ্রাহকের ডেলিভারি ঠিকানা',
      district: zoneInfo.district || 'ঢাকা',
      upazila: zoneInfo.upazila || '',
      isPaurashava: zoneInfo.isPaurashava,
      latitude: address?.latitude,
      longitude: address?.longitude
    },
    rateVersion: config.version
  };

  return {
    baseCharge: baseWeightCharge,
    weightSurcharge,
    distanceCharge,
    paurashavaSurcharge,
    handlingCharge,
    totalDeliveryCharge,
    totalWeightGrams,
    totalWeightKg,
    totalWeightDisplay,
    isDhaka: zoneInfo.zoneId === 'inside_dhaka',
    zone: zoneInfo.zoneId,
    zoneName: zoneInfo.zoneName,
    zoneNameBn: zoneInfo.zoneNameBn,
    isPaurashava: zoneInfo.isPaurashava,
    weightSlabLabel,
    distanceKm: rawDistance,
    effectiveDistanceKm: effectiveDistance,
    isOverweight,
    extraKg,
    rateBreakdown,
    deliveryMode: resolvedMode,
    deliveryModeLabel,
    appliedRule,
    dealerPoint,
    deliverySnapshot
  };
};

export interface CartShipmentSummary {
  totalDeliveryCharge: number;
  totalDeliveryCost: number;
  totalWeightGrams: number;
  totalWeightKg: number;
  totalWeightDisplay: string;
  isMultiShipment: boolean;
  isInsideDhaka: boolean;
  zone: DeliveryZoneType;
  zoneNameBn: string;
  isPaurashava: boolean;
  deliveryMode: DeliveryMode;
  deliveryModeLabel: string;
  dealerPoint?: DealerPoint;
  deliverySnapshot?: OrderDeliverySnapshot;
  shipments: Array<{
    vendorOrDealerId: string;
    vendorOrDealerName: string;
    dealerPoint?: DealerPoint;
    itemsCount: number;
    weightGrams: number;
    weightDisplay: string;
    deliveryCharge: number;
    breakdown: string;
    deliveryMode: DeliveryMode;
    snapshot?: OrderDeliverySnapshot;
  }>;
}

export type CartDeliveryItemInput =
  | CartItem
  | {
      product?: Product | null;
      selectedVariant?: ProductVariant | null;
      quantity: number;
      productId?: string;
      unitPrice?: number;
      totalPrice?: number;
    };

/**
 * Calculates total shipment weight and delivery charge for the cart or direct order.
 * Groups by Dealer/Vendor if items ship from different locations and sums them.
 */
export const calculateCartDelivery = (
  cartItems: CartDeliveryItemInput[],
  addressOrDivision?: ServiceAddress | string | null,
  districtOrFallbackProducts?: string | Product[],
  fallbackProductsArg?: Product[],
  distanceKmArg?: number,
  configArg?: SuperAdminDeliveryConfig,
  preferredMode?: DeliveryMode
): CartShipmentSummary => {
  const config = configArg || getStoredDeliveryConfig();

  let resolvedAddress: ServiceAddress | null = null;
  let fallbackProducts: Product[] | undefined = undefined;

  if (typeof addressOrDivision === 'string') {
    resolvedAddress = {
      id: 'temp-addr',
      userId: 'temp',
      title: 'Delivery Address',
      division: addressOrDivision,
      district: typeof districtOrFallbackProducts === 'string' ? districtOrFallbackProducts : 'ঢাকা',
      upazila: '',
      unionName: '',
      area: '',
      postalCode: '',
      isMandatoryServiceAddress: false,
      createdAt: '',
      updatedAt: ''
    };
    fallbackProducts = fallbackProductsArg;
  } else if (addressOrDivision && typeof addressOrDivision === 'object') {
    resolvedAddress = addressOrDivision;
    fallbackProducts = Array.isArray(districtOrFallbackProducts) ? districtOrFallbackProducts : fallbackProductsArg;
  } else {
    fallbackProducts = Array.isArray(districtOrFallbackProducts) ? districtOrFallbackProducts : fallbackProductsArg;
  }

  const zoneInfo = resolveDeliveryZone(resolvedAddress);
  const isInsideDhaka = zoneInfo.zoneId === 'inside_dhaka';
  const primaryDealerPoint = resolveNearestDealerPoint(resolvedAddress, config.dealerPoints);

  if (!cartItems || cartItems.length === 0) {
    const singleResult = calculateCourierShippingCharge(
      250,
      resolvedAddress,
      undefined,
      distanceKmArg,
      config,
      preferredMode,
      primaryDealerPoint
    );

    return {
      totalDeliveryCharge: singleResult.totalDeliveryCharge,
      totalDeliveryCost: singleResult.totalDeliveryCharge,
      totalWeightGrams: 250,
      totalWeightKg: 0.25,
      totalWeightDisplay: '250g',
      isMultiShipment: false,
      isInsideDhaka,
      zone: zoneInfo.zoneId,
      zoneNameBn: zoneInfo.zoneNameBn,
      isPaurashava: zoneInfo.isPaurashava,
      deliveryMode: singleResult.deliveryMode,
      deliveryModeLabel: singleResult.deliveryModeLabel,
      dealerPoint: primaryDealerPoint,
      deliverySnapshot: singleResult.deliverySnapshot,
      shipments: []
    };
  }

  // Group items by dealer point or vendor
  const vendorGroups: Record<string, { name: string; items: CartDeliveryItemInput[]; dealerPoint?: DealerPoint }> = {};

  for (const item of cartItems) {
    const prod = item.product || fallbackProducts?.find((p) => p.id === item.productId);
    const vendorKey = prod?.vendorId || prod?.warehouseId || primaryDealerPoint.id;
    const vendorName = prod?.vendorShopName || prod?.warehouseName || primaryDealerPoint.name;

    if (!vendorGroups[vendorKey]) {
      vendorGroups[vendorKey] = {
        name: vendorName,
        items: [],
        dealerPoint: primaryDealerPoint
      };
    }
    vendorGroups[vendorKey].items.push(item);
  }

  const groupKeys = Object.keys(vendorGroups);
  const isMultiShipment = groupKeys.length > 1;

  let grandDeliveryCharge = 0;
  let grandTotalWeightGrams = 0;
  let primarySnapshot: OrderDeliverySnapshot | undefined;
  let dominantMode: DeliveryMode = 'courier';
  let dominantModeLabel = 'কুরিয়ার ডেলিভারি';

  const shipments = groupKeys.map((key) => {
    const group = vendorGroups[key];
    let groupWeightGrams = 0;
    let maxBaseCost: number | undefined = undefined;

    for (const item of group.items) {
      const prod = item.product || fallbackProducts?.find((p) => p.id === item.productId);
      const itemWeight = calculateItemTotalWeight(item.selectedVariant, item.quantity, prod);
      groupWeightGrams += itemWeight.totalWeightGrams;

      if (prod?.deliveryCost && (maxBaseCost === undefined || prod.deliveryCost > maxBaseCost)) {
        maxBaseCost = prod.deliveryCost;
      }
    }

    const courierResult = calculateCourierShippingCharge(
      groupWeightGrams,
      resolvedAddress,
      maxBaseCost,
      distanceKmArg,
      config,
      preferredMode,
      group.dealerPoint || primaryDealerPoint
    );

    grandDeliveryCharge += courierResult.totalDeliveryCharge;
    grandTotalWeightGrams += groupWeightGrams;

    if (!primarySnapshot) {
      primarySnapshot = courierResult.deliverySnapshot;
      dominantMode = courierResult.deliveryMode;
      dominantModeLabel = courierResult.deliveryModeLabel;
    }

    return {
      vendorOrDealerId: key,
      vendorOrDealerName: group.name,
      dealerPoint: group.dealerPoint || primaryDealerPoint,
      itemsCount: group.items.reduce((acc, curr) => acc + curr.quantity, 0),
      weightGrams: groupWeightGrams,
      weightDisplay: formatWeightDisplay(groupWeightGrams),
      deliveryCharge: courierResult.totalDeliveryCharge,
      breakdown: courierResult.rateBreakdown,
      deliveryMode: courierResult.deliveryMode,
      snapshot: courierResult.deliverySnapshot
    };
  });

  if (primarySnapshot && isMultiShipment) {
    primarySnapshot = {
      ...primarySnapshot,
      totalWeightGrams: grandTotalWeightGrams,
      totalWeightKg: Number((grandTotalWeightGrams / 1000).toFixed(2)),
      finalDeliveryCharge: grandDeliveryCharge,
      rateBreakdown: `মাল্টি-ডিলার পার্সেল (${shipments.length} টি পার্সেল মোট ৳${grandDeliveryCharge})`
    };
  }

  return {
    totalDeliveryCharge: grandDeliveryCharge,
    totalDeliveryCost: grandDeliveryCharge,
    totalWeightGrams: grandTotalWeightGrams,
    totalWeightKg: Number((grandTotalWeightGrams / 1000).toFixed(2)),
    totalWeightDisplay: formatWeightDisplay(grandTotalWeightGrams),
    isMultiShipment,
    isInsideDhaka,
    zone: zoneInfo.zoneId,
    zoneNameBn: zoneInfo.zoneNameBn,
    isPaurashava: zoneInfo.isPaurashava,
    deliveryMode: dominantMode,
    deliveryModeLabel: dominantModeLabel,
    dealerPoint: primaryDealerPoint,
    deliverySnapshot: primarySnapshot,
    shipments
  };
};
