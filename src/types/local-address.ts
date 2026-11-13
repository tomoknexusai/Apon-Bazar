/**
 * Level 2 Local Service Address Database Types & Models
 * Project: Apon Somaj / Apon Bazar
 * 
 * Centralized local-address database hierarchy:
 * Bangladesh -> Division -> District -> Upazila/Thana -> Union/Paurashava -> Ward -> Local Area
 * Normalized using relational IDs: division_id, district_id, upazila_id, union_id, ward_id, place_id
 */

export type RecordStatus = 'active' | 'inactive';

export type PlaceType = 
  | 'village'       // গ্রাম (Village Name)
  | 'area'          // এলাকা / পাড়া (Area Name)
  | 'bazar'         // বাজার (Bazar Name - separate database type!)
  | 'market'        // মার্কেট (Market Name)
  | 'shopping_mall' // শপিং মল (Shopping Mall)
  | 'local_shop'    // লোকাল শপ (Local Shop)
  | 'grocery'       // গ্রোসারী (Grocery - separate database type!)
  | 'landmark'      // ল্যান্ডমার্ক (Landmark)
  | 'post_office'   // পোস্ট অফিস (Post Office)
  | 'hospital'      // হাসপাতাল / ক্লিনিক (Hospital / Clinic)
  | 'school'        // স্কুল / কলেজ / শিক্ষা প্রতিষ্ঠান (School / College / Institution)
  | 'bank'          // ব্যাংক / এটিএম (Bank / ATM)
  | 'other';        // অন্যান্য স্থান

export interface PlaceTypeConfig {
  type: PlaceType;
  labelBn: string;
  labelEn: string;
  color: string;
  bgLight: string;
  bgDark: string;
  badgeBorder: string;
}

export const PLACE_TYPE_CONFIGS: Record<PlaceType, PlaceTypeConfig> = {
  village: {
    type: 'village',
    labelBn: 'গ্রাম',
    labelEn: 'Village',
    color: 'text-emerald-700 dark:text-emerald-300',
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/60',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800'
  },
  area: {
    type: 'area',
    labelBn: 'এলাকা / পাড়া',
    labelEn: 'Area',
    color: 'text-cyan-700 dark:text-cyan-300',
    bgLight: 'bg-cyan-50',
    bgDark: 'dark:bg-cyan-950/60',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800'
  },
  bazar: {
    type: 'bazar',
    labelBn: 'বাজার',
    labelEn: 'Bazar',
    color: 'text-amber-800 dark:text-amber-300',
    bgLight: 'bg-amber-100',
    bgDark: 'dark:bg-amber-950/70',
    badgeBorder: 'border-amber-300 dark:border-amber-700'
  },
  market: {
    type: 'market',
    labelBn: 'মার্কেট',
    labelEn: 'Market',
    color: 'text-sky-700 dark:text-sky-300',
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-950/60',
    badgeBorder: 'border-sky-200 dark:border-sky-800'
  },
  shopping_mall: {
    type: 'shopping_mall',
    labelBn: 'শপিং মল',
    labelEn: 'Shopping Mall',
    color: 'text-blue-700 dark:text-blue-300',
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/60',
    badgeBorder: 'border-blue-200 dark:border-blue-800'
  },
  local_shop: {
    type: 'local_shop',
    labelBn: 'লোকাল দোকান / শপ',
    labelEn: 'Local Shop',
    color: 'text-rose-700 dark:text-rose-300',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/60',
    badgeBorder: 'border-rose-200 dark:border-rose-800'
  },
  grocery: {
    type: 'grocery',
    labelBn: 'মুদি দোকান / গ্রোসারী',
    labelEn: 'Grocery',
    color: 'text-teal-700 dark:text-teal-300',
    bgLight: 'bg-teal-50',
    bgDark: 'dark:bg-teal-950/60',
    badgeBorder: 'border-teal-200 dark:border-teal-800'
  },
  landmark: {
    type: 'landmark',
    labelBn: 'ল্যান্ডমার্ক',
    labelEn: 'Landmark',
    color: 'text-purple-700 dark:text-purple-300',
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/60',
    badgeBorder: 'border-purple-200 dark:border-purple-800'
  },
  post_office: {
    type: 'post_office',
    labelBn: 'পোস্ট অফিস',
    labelEn: 'Post Office',
    color: 'text-rose-700 dark:text-rose-300',
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/60',
    badgeBorder: 'border-rose-200 dark:border-rose-800'
  },
  hospital: {
    type: 'hospital',
    labelBn: 'হাসপাতাল / ক্লিনিক',
    labelEn: 'Hospital / Clinic',
    color: 'text-red-700 dark:text-red-300',
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/60',
    badgeBorder: 'border-red-200 dark:border-red-800'
  },
  school: {
    type: 'school',
    labelBn: 'স্কুল / শিক্ষা প্রতিষ্ঠান',
    labelEn: 'School / Institution',
    color: 'text-indigo-700 dark:text-indigo-300',
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/60',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800'
  },
  bank: {
    type: 'bank',
    labelBn: 'ব্যাংক / এটিএম',
    labelEn: 'Bank / ATM',
    color: 'text-emerald-800 dark:text-emerald-400',
    bgLight: 'bg-emerald-100',
    bgDark: 'dark:bg-emerald-950/70',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700'
  },
  other: {
    type: 'other',
    labelBn: 'অন্যান্য',
    labelEn: 'Other',
    color: 'text-neutral-700 dark:text-neutral-300',
    bgLight: 'bg-neutral-100',
    bgDark: 'dark:bg-neutral-800',
    badgeBorder: 'border-neutral-200 dark:border-neutral-700'
  }
};

/**
 * Top Hierarchy Tables: Divisions, Districts, Upazilas
 */
export interface DivisionRecord {
  id: string;              // division_id (e.g. "div_30")
  division_id?: string;    // explicit relation key
  name_bn?: string;
  name_en?: string;
  nameBn: string;
  nameEn: string;
}

export interface DistrictRecord {
  id: string;              // district_id (e.g. "dist_94")
  district_id?: string;    // explicit relation key
  divisionId: string;      // division_id
  division_id?: string;    // explicit relation key
  name_bn?: string;
  name_en?: string;
  nameBn: string;
  nameEn: string;
  divisionName?: string;
}

export interface UpazilaRecord {
  id: string;              // upazila_id (e.g. "upz_435")
  upazila_id?: string;    // explicit relation key
  districtId: string;      // district_id
  district_id?: string;    // explicit relation key
  divisionId: string;      // division_id
  division_id?: string;    // explicit relation key
  name_bn?: string;
  name_en?: string;
  nameBn: string;
  nameEn: string;
  districtName?: string;
  divisionName?: string;
}

export interface BDDataVerificationReport {
  divisionCount: number;
  districtCount: number;
  upazilaCount: number;
  unionCount: number;
  missingDistricts: string[];
  missingUpazilas: string[];
  missingUnions: string[];
  duplicateUnions: { id: string; name: string; upazila: string }[];
  orphanUnions: { id: string; name: string }[];
  isVerified: boolean;
  timestamp: string;
}

/**
 * Union / Paurashava Entity
 */
export interface UnionRecord {
  id: string;              // union_id (e.g. "un_singia_01")
  union_id?: string;       // union_id alias
  divisionId: string;      // division_id
  division_id?: string;    // division_id alias
  districtId: string;      // district_id
  district_id?: string;    // district_id alias
  upazilaId: string;       // upazila_id
  upazila_id?: string;     // upazila_id alias
  divisionName: string;    // e.g. "রংপুর"
  districtName: string;    // e.g. "ঠাকুরগাঁও"
  upazilaName: string;     // e.g. "ঠাকুরগাঁও সদর"
  unionName: string;       // e.g. "আকচা"
  unionNameEn?: string;    // e.g. "Akcha"
  union_name_bn?: string;  // official Bengali name alias
  union_name_en?: string;  // official English name alias
  officialName?: string;   // e.g. "আকচা ইউনিয়ন পরিষদ"
  official_name?: string;  // official_name alias
  unionCode: string;       // Unique official code / ID
  postalCode?: string;     // e.g. "৫১০০"
  status: RecordStatus;    // 'active' | 'inactive'
  isMunicipality?: boolean;// true if পৌরসভা
  createdAt: string;
  updatedAt: string;
}

/**
 * Ward Entity
 */
export interface WardRecord {
  id: string;              // ward_id (e.g. "wrd_singia_01")
  ward_id?: string;        // explicit snake_case database column alias
  unionId: string;         // union_id
  union_id?: string;       // explicit snake_case database column alias
  upazilaId: string;       // upazila_id
  upazila_id?: string;     // explicit snake_case database column alias
  districtId: string;      // district_id
  district_id?: string;    // explicit snake_case database column alias
  divisionId: string;      // division_id
  division_id?: string;    // explicit snake_case database column alias
  divisionName: string;
  districtName: string;
  upazilaName: string;
  unionName: string;
  wardNumber: string;      // e.g. "০১", "01"
  ward_number?: string;
  wardName: string;        // e.g. "ওয়ার্ড ০১"
  ward_name?: string;
  wardNameEn?: string;     // e.g. "Ward 01"
  status: RecordStatus;    // 'active' | 'inactive'
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

/**
 * Local Place Entity (Market, Village, Shopping Mall, Local Shop, Landmark, Other)
 */
export interface LocalPlaceRecord {
  id: string;              // place_id (e.g. "plc_mkt_singia_01")
  place_id?: string;       // explicit snake_case database column alias
  placeName: string;       // e.g. "সিংগিয়া বাজার কাঁচাবাজার"
  place_name?: string;     // explicit snake_case database column alias
  placeNameEn?: string;    // e.g. "Singia Kitchen Market"
  placeType: PlaceType;    // 'market' | 'bazar' | 'village' | 'area' | 'shopping_mall' | 'local_shop' | 'grocery' | 'landmark' | 'post_office'
  place_type?: PlaceType;  // explicit snake_case database column alias
  divisionId: string;      // division_id
  division_id?: string;    // explicit snake_case database column alias
  districtId: string;      // district_id
  district_id?: string;    // explicit snake_case database column alias
  upazilaId: string;       // upazila_id
  upazila_id?: string;     // explicit snake_case database column alias
  unionId: string;         // union_id
  union_id?: string;       // explicit snake_case database column alias
  wardId?: string;         // ward_id (optional if place belongs to specific ward)
  ward_id?: string;        // explicit snake_case database column alias
  divisionName: string;
  districtName: string;
  upazilaName: string;
  unionName: string;
  wardName?: string;       // e.g. "ওয়ার্ড ০১"
  villageArea?: string;    // Village / Local Area name
  village_area?: string;
  postCode?: string;       // e.g. "৫১০০" (for Post Office or place)
  post_code?: string;
  shopType?: string;       // e.g. "Grocery", "Pharmacy" (for Local Shop)
  shop_type?: string;
  status: RecordStatus;    // 'active' | 'inactive'
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
}

/**
 * Live Search Suggestion Item
 */
export interface LocalAddressSuggestion {
  placeId: string;
  placeName: string;
  placeType: PlaceType;
  placeTypeLabelBn: string;
  placeTypeLabelEn: string;
  divisionName: string;
  districtName: string;
  upazilaName: string;
  unionName: string;
  wardName?: string;
  villageArea?: string;
  formattedAddress: string;
  unionId: string;
  wardId?: string;
}

/**
 * Super Admin Filter State
 */
export interface LocalAddressFilterState {
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  ward: string;
  placeType: string;
  status: string;
  searchQuery: string;
}

/**
 * Full Database Export Representation
 */
export interface LocalAddressDBExport {
  version: string;
  exportedAt: string;
  companyName: string;
  divisions?: DivisionRecord[];
  districts?: DistrictRecord[];
  upazilas?: UpazilaRecord[];
  unions: UnionRecord[];
  wards: WardRecord[];
  places: LocalPlaceRecord[];
}
