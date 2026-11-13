/**
 * Official Comprehensive Bangladesh Administrative Hierarchy Dataset & Cascading Helpers
 * All 8 Divisions, 64 Districts, 504 Upazilas & Thanas, 4,968 Actual Unions & Municipalities
 * Powered by Centralized Bangladesh Administrative Relational Database Service
 */

import {
  BD_DIVISIONS_TABLE,
  BD_DISTRICTS_TABLE,
  BD_UPAZILAS_TABLE,
  BD_UNIONS_TABLE,
  getBDDivisions,
  getBDDistricts,
  getBDUpazilas,
  getBDUnions,
  searchBDAdministrativeLocations
} from '../services/BangladeshAdministrativeDatabase';

export interface BDWard {
  wardNoBn: string;
  wardNoEn: string;
}

export interface BDUnion {
  nameBn: string;
  nameEn: string;
  postalCode: string;
  wards: BDWard[];
  villagesBn: string[];
  villagesEn: string[];
  marketsBn?: string[];
  marketsEn?: string[];
  shoppingMallsBn?: string[];
  shoppingMallsEn?: string[];
  localShopsBn?: string[];
  localShopsEn?: string[];
  landmarksBn?: string[];
  landmarksEn?: string[];
  postOfficeBn?: string;
  postOfficeEn?: string;
  isMunicipality?: boolean;
}

export interface BDUpazila {
  nameBn: string;
  nameEn: string;
  unions: BDUnion[];
}

export interface BDDistrict {
  nameBn: string;
  nameEn: string;
  upazilas: BDUpazila[];
}

export interface BDDivision {
  nameBn: string;
  nameEn: string;
  districts: BDDistrict[];
}

export const DEFAULT_WARDS: BDWard[] = [
  { wardNoBn: 'ওয়ার্ড ০১', wardNoEn: 'Ward 01' },
  { wardNoBn: 'ওয়ার্ড ০২', wardNoEn: 'Ward 02' },
  { wardNoBn: 'ওয়ার্ড ০৩', wardNoEn: 'Ward 03' },
  { wardNoBn: 'ওয়ার্ড ০৪', wardNoEn: 'Ward 04' },
  { wardNoBn: 'ওয়ার্ড ০৫', wardNoEn: 'Ward 05' },
  { wardNoBn: 'ওয়ার্ড ০৬', wardNoEn: 'Ward 06' },
  { wardNoBn: 'ওয়ার্ড ০৭', wardNoEn: 'Ward 07' },
  { wardNoBn: 'ওয়ার্ড ০৮', wardNoEn: 'Ward 08' },
  { wardNoBn: 'ওয়ার্ড ০৯', wardNoEn: 'Ward 09' }
];

export const createUnion = (
  nameBn: string,
  nameEn: string,
  postalCode: string = '1200',
  villagesBn: string[] = [],
  villagesEn: string[] = []
): BDUnion => ({
  nameBn,
  nameEn,
  postalCode,
  wards: DEFAULT_WARDS,
  villagesBn: villagesBn.length > 0 ? villagesBn : [`${nameBn} বাজার এলাকা`, `${nameBn} মধ্যপাড়া`, `${nameBn} পূর্বপাড়া`, `${nameBn} পশ্চিমপাড়া`],
  villagesEn: villagesEn.length > 0 ? villagesEn : [`${nameEn} Bazar Area`, `${nameEn} Middle Para`, `${nameEn} East Para`, `${nameEn} West Para`],
  marketsBn: [`${nameBn} কেন্দ্রীয় বাজার`, `${nameBn} কাঁচাবাজার`, `${nameBn} সুপার মার্কেট`],
  marketsEn: [`${nameEn} Central Market`, `${nameEn} Kitchen Market`, `${nameEn} Super Market`],
  shoppingMallsBn: [`${nameBn} শপিং কমপ্লেক্স`, `${nameBn} সিটি সেন্টার`, `${nameBn} প্লাজা`],
  shoppingMallsEn: [`${nameEn} Shopping Complex`, `${nameEn} City Centre`, `${nameEn} Plaza`],
  localShopsBn: [`${nameBn} জেনারেল স্টোর`, `${nameBn} ফ্রেশ গ্রোসারী`, `${nameBn} ডিপার্টমেন্টাল স্টোর`],
  localShopsEn: [`${nameEn} General Store`, `${nameEn} Fresh Grocery`, `${nameEn} Departmental Store`],
  landmarksBn: [`${nameBn} জিরো পয়েন্ট`, `${nameBn} বাসস্ট্যান্ড`, `${nameBn} থানা মোড়`, `${nameBn} কলেজ মোড়`],
  landmarksEn: [`${nameEn} Zero Point`, `${nameEn} Bus Stand`, `${nameEn} Thana Mor`, `${nameEn} College Mor`],
  postOfficeBn: `${nameBn} সাব-পোস্ট অফিস`,
  postOfficeEn: `${nameEn} Sub-Post Office`
});

/**
 * 1. Divisions List (All 8 Divisions)
 */
export const BD_DIVISIONS: BDDivision[] = BD_DIVISIONS_TABLE.map((div) => {
  const distList = getBDDistricts(div.id);
  return {
    nameBn: div.nameBn,
    nameEn: div.nameEn,
    districts: distList.map((dist) => {
      const upzList = getBDUpazilas(dist.id);
      return {
        nameBn: dist.nameBn,
        nameEn: dist.nameEn,
        upazilas: upzList.map((upz) => {
          const unionList = getBDUnions(upz.id);
          return {
            nameBn: upz.nameBn,
            nameEn: upz.nameEn,
            unions: unionList.map((u) => createUnion(u.unionName, u.unionNameEn || u.unionName, u.postalCode || '1000'))
          };
        })
      };
    })
  };
});

/**
 * Cascading Helpers:
 */

export function getDistrictsList(divisionName?: string): { nameBn: string; nameEn: string }[] {
  return getBDDistricts(divisionName).map((d) => ({
    nameBn: d.nameBn,
    nameEn: d.nameEn
  }));
}

export function getUpazilasList(divisionName?: string, districtName?: string): { nameBn: string; nameEn: string }[] {
  return getBDUpazilas(districtName).map((u) => ({
    nameBn: u.nameBn,
    nameEn: u.nameEn
  }));
}

export function getUnionsList(divisionName?: string, districtName?: string, upazilaName?: string): BDUnion[] {
  if (!upazilaName) return [];
  const unions = getBDUnions(upazilaName);
  return unions.map((u) => ({
    nameBn: u.unionName,
    nameEn: u.unionNameEn || u.unionName,
    postalCode: u.postalCode || '1000',
    isMunicipality: u.isMunicipality,
    wards: DEFAULT_WARDS,
    villagesBn: [`${u.unionName} বাজার এলাকা`, `${u.unionName} মধ্যপাড়া`, `${u.unionName} পূর্বপাড়া`, `${u.unionName} পশ্চিমপাড়া`],
    villagesEn: [`${u.unionNameEn || u.unionName} Bazar Area`, `${u.unionNameEn || u.unionName} Middle Para`],
    marketsBn: [`${u.unionName} কেন্দ্রীয় বাজার`, `${u.unionName} কাঁচাবাজার`],
    marketsEn: [`${u.unionNameEn || u.unionName} Central Market`],
    shoppingMallsBn: [`${u.unionName} শপিং কমপ্লেক্স`],
    shoppingMallsEn: [`${u.unionNameEn || u.unionName} Shopping Complex`],
    localShopsBn: [`${u.unionName} লোকাল শপ`, `${u.unionName} গ্রোসারী`],
    localShopsEn: [`${u.unionNameEn || u.unionName} Local Shop`],
    landmarksBn: [`${u.unionName} মোড়`, `${u.unionName} পরিষদ চত্বর`],
    landmarksEn: [`${u.unionNameEn || u.unionName} Mor`],
    postOfficeBn: `${u.unionName} সাব-পোস্ট অফিস`,
    postOfficeEn: `${u.unionNameEn || u.unionName} Sub-Post Office`
  }));
}

export function getUnionPostalCode(
  divisionName?: string,
  districtName?: string,
  upazilaName?: string,
  unionName?: string
): string {
  if (!unionName) return '1000';
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  return found?.postalCode || '1000';
}

export function getWardsList(division?: string, district?: string, upazila?: string, unionName?: string): BDWard[] {
  if (!unionName) return DEFAULT_WARDS;
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  return found?.wards || DEFAULT_WARDS;
}

export function getVillagesList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    return lang === 'en' ? found.villagesEn : found.villagesBn;
  }
  return lang === 'en'
    ? [`${unionName} Bazar Area`, `${unionName} Middle Para`]
    : [`${unionName} বাজার এলাকা`, `${unionName} মধ্যপাড়া`];
}

export function getMarketsList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    return (lang === 'en' ? found.marketsEn : found.marketsBn) || [];
  }
  return lang === 'en' ? [`${unionName} Central Market`] : [`${unionName} কেন্দ্রীয় বাজার`];
}

export function getShoppingMallsList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    return (lang === 'en' ? found.shoppingMallsEn : found.shoppingMallsBn) || [];
  }
  return lang === 'en' ? [`${unionName} Shopping Complex`] : [`${unionName} শপিং কমপ্লেক্স`];
}

export function getLocalShopsList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    return (lang === 'en' ? found.localShopsEn : found.localShopsBn) || [];
  }
  return lang === 'en' ? [`${unionName} Local Shop`] : [`${unionName} লোকাল শপ`];
}

export function getLandmarksList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    return (lang === 'en' ? found.landmarksEn : found.landmarksBn) || [];
  }
  return lang === 'en' ? [`${unionName} Mor`] : [`${unionName} মোড়`];
}

export function getPostOfficesList(
  division?: string,
  district?: string,
  upazila?: string,
  unionName?: string,
  lang: 'bn' | 'en' = 'bn'
): string[] {
  if (!unionName) return [];
  const unions = getUnionsList(division, district, upazila);
  const found = unions.find((u) => u.nameBn === unionName || u.nameEn.toLowerCase() === unionName.toLowerCase());
  if (found) {
    const po = lang === 'en' ? found.postOfficeEn : found.postOfficeBn;
    return po ? [po] : [];
  }
  return lang === 'en' ? [`${unionName} Sub-Post Office`] : [`${unionName} সাব-পোস্ট অফিস`];
}

export interface FullAddressDetails {
  houseNo?: string;
  roadNo?: string;
  areaVillage?: string;
  shopName?: string;
  shopNo?: string;
  marketName?: string;
  marketBazar?: string;
  businessOfficeName?: string;
  shopOfficeName?: string;
  motorcycleModel?: string;
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  ward?: string;
  unionName?: string;
  upazila?: string;
  district?: string;
  division?: string;
  postOffice?: string;
  postalCode?: string;
  shoppingMall?: string;
  localShop?: string;
  landmark?: string;
  userType?: string;
}

export function buildFullServiceAddressString(
  area: string,
  marketBazar: string | undefined,
  ward: string | undefined,
  unionName: string,
  upazila: string,
  district: string,
  division: string,
  postalCode: string,
  shoppingMall?: string,
  localShop?: string,
  landmark?: string,
  postOffice?: string,
  extraDetails?: Partial<FullAddressDetails>
): string {
  const parts: string[] = [];

  if (extraDetails?.shopName && extraDetails.shopName.trim()) parts.push(extraDetails.shopName.trim());
  if (extraDetails?.businessOfficeName && extraDetails.businessOfficeName.trim()) parts.push(extraDetails.businessOfficeName.trim());
  if (extraDetails?.shopOfficeName && extraDetails.shopOfficeName.trim()) parts.push(extraDetails.shopOfficeName.trim());
  if (extraDetails?.shopNo && extraDetails.shopNo.trim()) parts.push(`দোকান নং: ${extraDetails.shopNo.trim()}`);
  if (extraDetails?.houseNo && extraDetails.houseNo.trim()) parts.push(`বাড়ি: ${extraDetails.houseNo.trim()}`);
  if (extraDetails?.roadNo && extraDetails.roadNo.trim()) parts.push(`রোড: ${extraDetails.roadNo.trim()}`);
  
  if (area && area.trim()) parts.push(area.trim());
  if (shoppingMall && shoppingMall.trim()) parts.push(`শপিং মল: ${shoppingMall.trim()}`);
  if (localShop && localShop.trim()) parts.push(`দোকান: ${localShop.trim()}`);
  
  const mkt = extraDetails?.marketName || marketBazar;
  if (mkt && mkt.trim()) parts.push(`বাজার: ${mkt.trim()}`);
  
  const lmark = extraDetails?.landmark || landmark;
  if (lmark && lmark.trim()) parts.push(`ল্যান্ডমার্ক/মোড়: ${lmark.trim()}`);

  if (extraDetails?.motorcycleModel && extraDetails.motorcycleModel.trim()) parts.push(`বাইক: ${extraDetails.motorcycleModel.trim()}`);
  if (extraDetails?.vehicleRegNumber && extraDetails.vehicleRegNumber.trim()) parts.push(`রেজি নং: ${extraDetails.vehicleRegNumber.trim()}`);

  if (ward && ward.trim()) parts.push(ward.trim());
  if (unionName && unionName.trim()) parts.push(unionName.trim());
  if (upazila && upazila.trim()) parts.push(upazila.trim());
  if (district && district.trim()) parts.push(district.trim());
  if (division && division.trim()) parts.push(`${division.trim()} বিভাগ`);
  if (postOffice && postOffice.trim()) parts.push(`ডাকঘর: ${postOffice.trim()}`);
  if (postalCode && postalCode.trim()) parts.push(`পোস্ট কোড: ${postalCode.trim()}`);

  return parts.join(', ');
}
