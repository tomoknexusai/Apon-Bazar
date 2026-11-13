/**
 * Operation Office Management Service
 * Project: Apon Bazar
 * 
 * CORE RULES:
 * 1. 1 Upazila/Thana = 1 Delivery Zone.
 * 2. Each Delivery Zone can have an assigned Operation Office.
 * 3. Operation Officers are linked to their Operation Office and therefore to their authorized Zone.
 * 4. Super Admin can create, edit, activate, deactivate, and assign/reassign offices to Zones.
 * 5. Operation Officers can only see and manage orders belonging to their authorized Zone(s).
 */

import { OperationOffice, OperationOfficeSummary, UserProfile } from '../types';
import { getAllDeliveryZones, getZoneById, getZoneByUpazila, normalizeGeoText } from './DeliveryZoneService';

export type { OperationOffice, OperationOfficeSummary };

const OPERATION_OFFICES_STORAGE_KEY = 'apon_bazar_operation_offices_v1';

// Initial pre-seeded Operation Offices for major zones across Bangladesh divisions
export const INITIAL_OPERATION_OFFICES: OperationOffice[] = [
  {
    operation_office_id: 'off_upz_435', // Thakurgaon Sadar
    office_name: 'ঠাকুরগাঁও সদর কেন্দ্রীয় অপারেশন অফিস',
    zone_id: 'upz_435',
    zone_name: 'Thakurgaon Sadar Zone',
    zone_name_bn: 'ঠাকুরগাঁও সদর জোন',
    division: 'রংপুর',
    district: 'ঠাকুরগাঁও',
    upazila: 'ঠাকুরগাঁও সদর',
    address: 'কালীবাড়ী মোড়, হাজীপাড়া রোড, ঠাকুরগাঁও সদর',
    mobile: '01312480175',
    officer_name: 'মির্জা খতিব উদ্দিন',
    officer_user_id: 'TMK000001',
    officer_phone: '01312480175',
    latitude: 26.0333,
    longitude: 88.4667,
    status: 'active',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  },
  {
    operation_office_id: 'off_upz_dhk_mirpur', // Mirpur
    office_name: 'ঢাকা মিরপুর জোনাল অপারেশন অফিস',
    zone_id: 'upz_490', // Mirpur / Keraniganj / Dhaka zone
    zone_name: 'Mirpur Zone',
    zone_name_bn: 'মিরপুর জোন',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    address: 'মিরপুর মডেল থানা সংলগ্ন, ব্লক-সি, মিরপুর-১০, ঢাকা',
    mobile: '01711000002',
    officer_name: 'তানজিনা রহমান',
    officer_user_id: 'usr-admin-02',
    officer_phone: '01711000002',
    latitude: 23.8067,
    longitude: 90.3686,
    status: 'active',
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: '2026-01-02T00:00:00.000Z'
  },
  {
    operation_office_id: 'off_upz_raj_boalia', // Boalia, Rajshahi
    office_name: 'রাজশাহী সাহেব বাজার অপারেশন অফিস',
    zone_id: 'upz_280', // Boalia
    zone_name: 'Boalia Zone',
    zone_name_bn: 'বোয়ালিয়া জোন',
    division: 'রাজশাহী',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    address: 'হাব ভবন ৩য় তলা, সাহেব বাজার জিরো পয়েন্ট, বোয়ালিয়া, রাজশাহী',
    mobile: '01611000005',
    officer_name: 'ফরিদা পারভীন',
    officer_user_id: 'usr-partner-05',
    officer_phone: '01611000005',
    latitude: 24.3636,
    longitude: 88.6241,
    status: 'active',
    created_at: '2026-01-05T00:00:00.000Z',
    updated_at: '2026-01-05T00:00:00.000Z'
  },
  {
    operation_office_id: 'off_upz_ctg_kotwali', // Kotwali, Chittagong
    office_name: 'চট্টগ্রাম কোতোয়ালী অপারেশন অফিস',
    zone_id: 'upz_060', // Kotwali
    zone_name: 'Kotwali Zone',
    zone_name_bn: 'কোতোয়ালী জোন',
    division: 'চট্টগ্রাম',
    district: 'চট্টগ্রাম',
    upazila: 'কোতোয়ালী',
    address: 'আন্দরকিল্লা মোড়, নিউ মার্কেট লেন, কোতোয়ালী, চট্টগ্রাম',
    mobile: '01911000004',
    officer_name: 'মোঃ জহিরুল ইসলাম',
    officer_user_id: 'usr-vendor-04',
    officer_phone: '01911000004',
    latitude: 22.3569,
    longitude: 91.7832,
    status: 'active',
    created_at: '2026-01-08T00:00:00.000Z',
    updated_at: '2026-01-08T00:00:00.000Z'
  },
  {
    operation_office_id: 'off_upz_syl_sadar', // Sylhet Sadar
    office_name: 'সিলেট সদর অপারেশন অফিস',
    zone_id: 'upz_410',
    zone_name: 'Sylhet Sadar Zone',
    zone_name_bn: 'সিলেট সদর জোন',
    division: 'সিলেট',
    district: 'সিলেট',
    upazila: 'সিলেট সদর',
    address: 'জিন্দাবাজার পয়েন্ট, সিলেট সদর',
    mobile: '01819000008',
    officer_name: 'মাহমুদুল হাসান',
    officer_user_id: 'usr-officer-syl',
    officer_phone: '01819000008',
    latitude: 24.8949,
    longitude: 91.8687,
    status: 'active',
    created_at: '2026-01-10T00:00:00.000Z',
    updated_at: '2026-01-10T00:00:00.000Z'
  },
  {
    operation_office_id: 'off_upz_khu_sadar', // Khulna Sadar
    office_name: 'খুলনা সদর অপারেশন অফিস',
    zone_id: 'upz_220',
    zone_name: 'Khulna Sadar Zone',
    zone_name_bn: 'খুলনা সদর জোন',
    division: 'খুলনা',
    district: 'খুলনা',
    upazila: 'খুলনা সদর',
    address: 'ডাকবাংলো মোড়, খুলনা সদর',
    mobile: '01712334455',
    officer_name: 'নূরুল ইসলাম',
    officer_user_id: 'usr-officer-khu',
    officer_phone: '01712334455',
    latitude: 22.8456,
    longitude: 89.5403,
    status: 'active',
    created_at: '2026-01-12T00:00:00.000Z',
    updated_at: '2026-01-12T00:00:00.000Z'
  }
];

let cachedOffices: OperationOffice[] | null = null;

/**
 * Loads all operation offices from storage or pre-seeds initial ones
 */
export function getAllOperationOffices(): OperationOffice[] {
  if (cachedOffices) return cachedOffices;

  if (typeof window === 'undefined') return INITIAL_OPERATION_OFFICES;

  try {
    const raw = localStorage.getItem(OPERATION_OFFICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OPERATION_OFFICES_STORAGE_KEY, JSON.stringify(INITIAL_OPERATION_OFFICES));
      cachedOffices = INITIAL_OPERATION_OFFICES;
      return INITIAL_OPERATION_OFFICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedOffices = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read operation offices from storage:', err);
  }

  cachedOffices = INITIAL_OPERATION_OFFICES;
  return INITIAL_OPERATION_OFFICES;
}

/**
 * Gets an operation office by its ID
 */
export function getOperationOfficeById(officeId?: string | null): OperationOffice | undefined {
  if (!officeId) return undefined;
  const list = getAllOperationOffices();
  return list.find((o) => o.operation_office_id === officeId);
}

/**
 * Gets the assigned Operation Office for a specific Delivery Zone
 */
export function getOperationOfficeByZoneId(zoneId?: string | null): OperationOffice | undefined {
  if (!zoneId) return undefined;
  const list = getAllOperationOffices();
  // 1. Exact zone_id match
  const matched = list.find((o) => o.zone_id === zoneId && o.status === 'active');
  if (matched) return matched;

  // 2. Zone record check
  const zone = getZoneById(zoneId);
  if (zone) {
    // Check by Upazila or District
    const byUpazila = list.find(
      (o) =>
        normalizeGeoText(o.upazila) === normalizeGeoText(zone.upazila_name) ||
        normalizeGeoText(o.zone_name) === normalizeGeoText(zone.zone_name_en)
    );
    if (byUpazila) return byUpazila;

    const byDistrict = list.find(
      (o) => normalizeGeoText(o.district) === normalizeGeoText(zone.district_name)
    );
    if (byDistrict) return byDistrict;
  }

  // Fallback to primary headquarters (Thakurgaon Sadar)
  return list[0];
}

/**
 * Gets a clean OperationOfficeSummary for lightweight storage on orders
 */
export function getOperationOfficeSummary(zoneId?: string | null): OperationOfficeSummary {
  const office = getOperationOfficeByZoneId(zoneId);
  if (!office) {
    return {
      operation_office_id: 'off_default',
      office_name: 'Apon Bazar কেন্দ্রীয় অপারেশন অফিস',
      zone_id: zoneId || 'upz_435',
      address: 'কালীবাড়ী, ঠাকুরগাঁও সদর',
      mobile: '01312480175',
      officer_name: 'মির্জা খতিব উদ্দিন'
    };
  }

  return {
    operation_office_id: office.operation_office_id,
    office_name: office.office_name,
    zone_id: office.zone_id,
    address: office.address,
    mobile: office.mobile,
    officer_name: office.officer_name
  };
}

/**
 * Creates or updates an Operation Office (Super Admin action)
 */
export function saveOperationOffice(office: Partial<OperationOffice> & { zone_id: string; office_name: string }): {
  success: boolean;
  message: string;
  office?: OperationOffice;
} {
  if (typeof window === 'undefined') return { success: false, message: 'Window not available' };

  try {
    const list = getAllOperationOffices();
    const zone = getZoneById(office.zone_id) || getZoneByUpazila(office.upazila, office.district, office.division);

    const now = new Date().toISOString();
    const officeId = office.operation_office_id || `off_${office.zone_id}_${Date.now()}`;

    const newOrUpdated: OperationOffice = {
      operation_office_id: officeId,
      office_name: office.office_name,
      zone_id: office.zone_id,
      zone_name: zone?.zone_name || `${office.upazila || ''} Zone`,
      zone_name_bn: zone?.zone_name_bn || `${office.upazila || ''} জোন`,
      division: office.division || zone?.division_name || 'ঢাকা',
      district: office.district || zone?.district_name || 'ঢাকা',
      upazila: office.upazila || zone?.upazila_name || 'সদর',
      address: office.address || `${zone?.zone_point_address || 'অপারেশন অফিস'}`,
      mobile: office.mobile || '01312480175',
      officer_name: office.officer_name || 'দায়িত্বপ্রাপ্ত অপারেশন অফিসার',
      officer_user_id: office.officer_user_id,
      officer_phone: office.officer_phone || office.mobile,
      latitude: office.latitude || zone?.latitude,
      longitude: office.longitude || zone?.longitude,
      status: office.status || 'active',
      created_at: office.created_at || now,
      updated_at: now
    };

    const existingIdx = list.findIndex((o) => o.operation_office_id === officeId || o.zone_id === office.zone_id);
    let updatedList: OperationOffice[];

    if (existingIdx >= 0) {
      updatedList = [...list];
      updatedList[existingIdx] = newOrUpdated;
    } else {
      updatedList = [newOrUpdated, ...list];
    }

    localStorage.setItem(OPERATION_OFFICES_STORAGE_KEY, JSON.stringify(updatedList));
    cachedOffices = updatedList;

    return {
      success: true,
      message: `অপারেশন অফিস '${newOrUpdated.office_name}' সফলভাবে সংরক্ষিত হয়েছে।`,
      office: newOrUpdated
    };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

/**
 * Toggles status (active/inactive) of an Operation Office
 */
export function toggleOperationOfficeStatus(officeId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getAllOperationOffices();
    const updated = list.map((o) =>
      o.operation_office_id === officeId
        ? { ...o, status: o.status === 'active' ? ('inactive' as const) : ('active' as const), updated_at: new Date().toISOString() }
        : o
    );
    localStorage.setItem(OPERATION_OFFICES_STORAGE_KEY, JSON.stringify(updated));
    cachedOffices = updated;
    return true;
  } catch (err) {
    console.error('Failed to toggle office status:', err);
    return false;
  }
}

/**
 * Deletes an Operation Office
 */
export function deleteOperationOffice(officeId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getAllOperationOffices();
    const updated = list.filter((o) => o.operation_office_id !== officeId);
    localStorage.setItem(OPERATION_OFFICES_STORAGE_KEY, JSON.stringify(updated));
    cachedOffices = updated;
    return true;
  } catch (err) {
    console.error('Failed to delete office:', err);
    return false;
  }
}

/**
 * Checks if a given user profile is authorized to manage a specific Zone
 * Super Admin & Admin can manage ALL zones.
 * Operation Officer can ONLY manage their assigned Zone.
 */
export function isUserAuthorizedForZone(user: UserProfile | null | undefined, zoneId?: string | null): boolean {
  if (!user) return false;

  // Super Admin & Admin have nationwide administrative jurisdiction
  const isGlobalAdmin =
    user.primaryRole === 'super_admin' ||
    user.primaryRole === 'admin' ||
    (user.roles && (user.roles.includes('super_admin') || user.roles.includes('admin')));

  if (isGlobalAdmin) return true;

  if (!zoneId) return false;

  // For Operations Partner / Officer:
  const isOpOfficer =
    user.primaryRole === 'operations_partner' ||
    (user.roles && user.roles.includes('operations_partner'));

  if (!isOpOfficer) return false;

  // 1. Direct Zone match with user's mandatory address Upazila
  const userAddress = user.mandatoryAddress;
  if (userAddress) {
    const userZone = getZoneByUpazila(userAddress.upazila, userAddress.district, userAddress.division);
    if (userZone && userZone.zone_id === zoneId) return true;
  }

  // 2. Check if user is assigned as officer in any Operation Office for this zone
  const offices = getAllOperationOffices();
  const matchedOffice = offices.find(
    (o) =>
      o.zone_id === zoneId &&
      (o.officer_user_id === user.id ||
        (user.mobileNumber && o.mobile.includes(user.mobileNumber.slice(-8))) ||
        (userAddress?.upazila && normalizeGeoText(o.upazila) === normalizeGeoText(userAddress.upazila)))
  );

  return Boolean(matchedOffice);
}
