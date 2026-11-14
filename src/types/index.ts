/**
 * Enterprise Foundation Type Definitions
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

export const FIXED_SUPER_ADMIN_ID = 'AANO-SADMIN-001';
export const FIXED_FOUNDER_ID = 'AANO-FOUNDER-001';

export type Language = 'bn' | 'en';

export type FinalRole =
  | 'customer_networker'
  | 'operations_officer'
  | 'vendor_dealer_shop'
  | 'rider'
  | 'admin'
  | 'super_admin'
  | 'account_officer'
  | 'hr';

export type BusinessType = 'Vendor' | 'Dealer' | 'Shop';

export interface FinalRoleInfo {
  code: FinalRole;
  nameBn: string;
  nameEn: string;
  prefix: string;
  defaultBusinessType?: BusinessType;
}

export const FINAL_ROLE_DEFINITIONS: Record<FinalRole, FinalRoleInfo> = {
  customer_networker: {
    code: 'customer_networker',
    nameBn: 'কাস্টমার ও নেটওয়ার্কার',
    nameEn: 'Customer & Networker',
    prefix: 'AponCN-'
  },
  operations_officer: {
    code: 'operations_officer',
    nameBn: 'অপারেশন অফিসার',
    nameEn: 'Operation Officer',
    prefix: 'AponOO-'
  },
  vendor_dealer_shop: {
    code: 'vendor_dealer_shop',
    nameBn: 'ভেন্ডর / ডিলার / শপ',
    nameEn: 'Vendor / Dealer / Shop',
    prefix: 'AponVDS-',
    defaultBusinessType: 'Dealer'
  },
  rider: {
    code: 'rider',
    nameBn: 'রাইডার',
    nameEn: 'Rider',
    prefix: 'AponR-'
  },
  admin: {
    code: 'admin',
    nameBn: 'এডমিন',
    nameEn: 'Admin',
    prefix: 'AponA-'
  },
  super_admin: {
    code: 'super_admin',
    nameBn: 'সুপার এডমিন',
    nameEn: 'Super Admin',
    prefix: 'AponSA-'
  },
  account_officer: {
    code: 'account_officer',
    nameBn: 'একাউন্ট অফিসার',
    nameEn: 'Account Officer',
    prefix: 'AponAO-'
  },
  hr: {
    code: 'hr',
    nameBn: 'এইচআর',
    nameEn: 'HR',
    prefix: 'AponHR-'
  }
};

export type UserRole =
  | 'customer_networker'
  | 'operations_officer'
  | 'vendor_dealer_shop'
  | 'rider'
  | 'admin'
  | 'super_admin'
  | 'account_officer'
  | 'hr'
  | 'founder'
  | 'district_admin'
  | 'finance'
  | 'finance_officer'
  | 'customer'
  | 'network_member'
  | 'vendor'
  | 'dealer'
  | 'operations_partner'
  | 'delivery_rider'
  | 'delivery_man';

export type FinancialDateFilter =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export type FinancialAccessLevel =
  | 'founder_full'
  | 'super_admin_full'
  | 'finance_officer_full'
  | 'district_admin_scoped'
  | 'operations_officer_scoped'
  | 'delivery_man_scoped'
  | 'seller_dealer_scoped'
  | 'customer_scoped';

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'banned';

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export type Gender = 'male' | 'female' | 'other';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  image?: string;
  schemaType?: string;
}

export type MarketType =
  | 'Daily Market'
  | 'Weekly Hat'
  | 'Shopping Mall'
  | 'Super Shop'
  | 'Wholesale Market'
  | 'Local Market'
  | 'Other';

export interface MarketItem {
  id: string;
  nameBn: string;
  nameEn: string;
  marketType: MarketType;
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  ward: string; // Ward e.g. "ওয়ার্ড ০১" or "Ward 01"
  googleMapsUrl: string; // Required Google Maps Location
  status: 'Active' | 'Inactive';
  latitude?: number;
  longitude?: number;
  addedByRole: 'admin' | 'operations_partner' | 'super_admin';
  addedByUserId?: string;
  addedByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAuditLog {
  id: string;
  marketId: string;
  marketNameBn: string;
  marketNameEn?: string;
  action: 'ADD' | 'EDIT' | 'DELETE';
  actorName: string;
  actorRole: string;
  details: string;
  ward?: string;
  unionName?: string;
  timestamp: string;
}

export interface ServiceAddress {
  id: string;
  userId: string;
  title: string;
  userType?: 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider' | 'admin';
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  ward?: string;
  village?: string;
  para?: string;
  houseNo?: string;
  area: string;
  roadNo?: string;
  landmark?: string;
  shopName?: string;
  shopNo?: string;
  marketName?: string;
  marketBazar?: string;
  marketId?: string;
  businessOfficeName?: string;
  shopOfficeName?: string;
  motorcycleModel?: string;
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  shoppingMall?: string;
  localShop?: string;
  postOffice?: string;
  postalCode: string;
  fullServiceAddress?: string;
  latitude?: number;
  longitude?: number;
  isPaurashava?: boolean;
  distanceKm?: number;
  isMandatoryServiceAddress: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  internalId?: string;
  aponUniqueId?: string; // Standard Role-Based / Customer ID: AB-1000000001+, AponVDS-000001, etc.
  legacyCustomerId?: string;
  businessType?: BusinessType; // For Vendor / Dealer / Shop (Vendor, Dealer, Shop)
  finalRole?: FinalRole;
  username?: string; // User-chosen login ID (unique, e.g. customer01)
  customerId?: string; // Auto-generated Customer ID (e.g. AB-1000000002)
  email: string;
  fullName: string;
  name?: string;
  role?: UserRole | string;
  mobileNumber: string;
  password?: string;
  profilePhotoUrl?: string;
  nationalId?: string;
  registrationStatus?: 'pending' | 'completed';
  emailStatus?: 'sent' | 'pending' | 'failed' | 'retry_queued';
  dateOfBirth?: string;
  gender?: Gender;
  latitude?: number;
  longitude?: number;
  languagePreference: Language;
  accountStatus: AccountStatus;
  verificationStatus: KycStatus;
  tomokTokenBalance: number;
  roles: UserRole[];
  primaryRole: UserRole;
  permanentMemberId?: string;
  binaryCompanyId?: string;
  registrationSource?: 'Dashboard' | 'Binary Tree' | string;
  sponsorId?: string;
  referralId?: string;
  placementId?: string;
  placementLeg?: 'left' | 'right';
  isNetworkActive?: boolean;
  mandatoryAddress?: ServiceAddress;
  shopName?: string;
  tradeLicenseBusinessName?: string;
  tradeLicenseNumber?: string;
  dealerOwnerName?: string;
  zoneId?: string;
  zoneName?: string;
  vehicleType?: string;
  vehicleRegNumber?: string;
  motorcycleModel?: string;
  drivingLicenseNumber?: string;
  lastLogin?: string;
  mustChangePassword?: boolean;
  lastPasswordResetAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KycVerification {
  id: string;
  userId: string;
  nidNumber: string;
  nidFrontImageUrl?: string;
  nidBackImageUrl?: string;
  dob: string;
  status: KycStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  shopName: string;
  tradeLicenseNumber?: string;
  commissionTier: string;
  outletAddress: string;
  division: string;
  district: string;
  upazila: string;
  unionName: string;
  isApproved: boolean;
  createdAt: string;
}

export interface OperationsPartnerProfile {
  id: string;
  userId: string;
  hubCode: string;
  coverageDivision: string;
  coverageDistrict: string;
  coverageUpazila: string;
  assignedRidersCount: number;
  isApproved: boolean;
  createdAt: string;
}

export interface DeliveryRiderProfile {
  id: string;
  userId: string;
  vehicleType: string;
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  currentDivision: string;
  currentDistrict: string;
  currentUpazila: string;
  isAvailable: boolean;
  activeOrdersCount: number;
  rating: number;
  createdAt: string;
}

// =========================================================================
// AANO BAZAR APPLICATION ROLE SYSTEM (Admin, Operational Officer, Delivery Man)
// =========================================================================
export type ApplicationRoleType = 'admin' | 'operational_officer' | 'delivery_man';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'cancelled' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ApplicationAttachment {
  title: string;
  url: string;
  type: string;
}

export interface ApplicationInternalNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  isInfoRequest?: boolean;
}

export interface ApplicationHistoryItem {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  note?: string;
}

export interface RoleApplication {
  id: string; // Tracking ID e.g. APP-ADM-260124 or APP-000001
  applicationId?: string; // Standard Application ID e.g. APP-000001
  trackingNumber: string;
  roleType: ApplicationRoleType;
  appliedPosition?: 'Admin' | 'Operations Officer' | 'Product Delivery Man';
  fullName: string;
  applicantName?: string;
  mobileNumber: string;
  email?: string;
  nationalId: string;
  dateOfBirth?: string;
  gender?: Gender;
  
  // Area Hierarchy Assignment
  division: string;
  district: string;
  upazila?: string; // Required for operational_officer and delivery_man
  unionName?: string; // Optional/Required for delivery_man service area
  villagePara?: string;
  serviceAreaName?: string;
  address?: string;
  fullAddress?: string;

  // Qualifications & Experience
  educationalQualification?: string;
  experienceYears?: string;
  previousExperience?: string;
  statementOfPurpose?: string;
  
  // Delivery Man specific fields
  vehicleType?: 'Bicycle' | 'Motorcycle' | 'Electric Scooter' | 'Van/Easybike' | 'Foot/Walking' | 'Other';
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  emergencyContact?: string;
  emergencyContactRelation?: string;
  
  // Documents / Attachments
  documents?: ApplicationAttachment[];
  profilePhotoUrl?: string;
  nidFrontPhotoUrl?: string;
  nidBackPhotoUrl?: string;
  drivingLicensePhotoUrl?: string;
  tradeLicensePhotoUrl?: string;
  cvAttachmentUrl?: string;
  educationalCertificateUrl?: string;

  // Application Lifecycle
  status: ApplicationStatus;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedByUserId?: string;
  reviewedByUserName?: string;
  reviewDate?: string;
  reviewedAt?: string;
  
  // Internal Notes & Audit History
  internalNotes?: ApplicationInternalNote[];
  history?: ApplicationHistoryItem[];
  
  // Resulting User Info once approved
  assignedUserId?: string;
  assignedRoleUniqueId?: string; // e.g. ADM-DHAKA-01, OPS-DUMURIA-01, DEL-100234
  approvedAt?: string;
  
  applicationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationAuditLog {
  id: string;
  superAdminId: string;
  superAdminName?: string;
  applicationId: string;
  applicantName?: string;
  appliedPosition?: string;
  action:
    | 'Application Submitted'
    | 'Application Viewed'
    | 'Application Reviewed'
    | 'Application Approved'
    | 'Application Rejected'
    | 'Information Requested'
    | 'Status Changed'
    | string;
  date: string;
  time: string;
  reasonOrNote?: string;
  createdAt: string;
}

export interface DistrictAdminQuota {
  districtName: string;
  divisionName: string;
  hasActiveAdmin: boolean;
  activeAdminId?: string;
  activeAdminName?: string;
  activeAdminMobile?: string;
  activeAdminMemberId?: string;
  pendingApplicationsCount: number;
}

export interface UpazilaOfficerQuota {
  upazilaName: string;
  districtName: string;
  divisionName: string;
  hasActiveOfficer: boolean;
  activeOfficerId?: string;
  activeOfficerName?: string;
  activeOfficerMobile?: string;
  activeOfficerMemberId?: string;
  pendingApplicationsCount: number;
}

export interface DeliveryManAreaStat {
  divisionName: string;
  districtName: string;
  upazilaName: string;
  totalActiveDeliveryMen: number;
  pendingApplicationsCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  channel: NotificationChannel;
  metadata?: any;
  createdAt: string;
}

export type NotificationItem = AppNotification;

// Network Marketing (MLM) Engine Interfaces
export type BinaryLeg = 'left' | 'right';

export interface NetworkMemberNode {
  id: string;
  fullName: string;
  sponsorId?: string;
  parentId?: string;
  placementLeg?: BinaryLeg;
  totalPersonalPv: number;
  leftLegPv: number;
  rightLegPv: number;
  totalLeftMembersCount: number;
  totalRightMembersCount: number;
  rankTitle: string;
  children: {
    left?: NetworkMemberNode;
    right?: NetworkMemberNode;
  };
  isActive: boolean;
}

export interface NetworkCommissionLedger {
  id: string;
  userId: string;
  amount: number;
  type: 'sponsor_bonus' | 'matching_bonus' | 'rank_reward';
  description: string;
  createdAt: string;
}

// E-Commerce & Product Interfaces
export interface ProductCategory {
  id: string;
  name: string;
  nameBn: string;
  slug: string;
  icon?: string;
  image?: string;
  status?: 'active' | 'inactive';
  subCategories: string[];
}

export type BrandType = 'National/Established Brand' | 'Local Brand' | 'Other Brand';

export interface Brand {
  id: string;
  name: string;
  brandId?: string; // Canonical / parent Brand ID
  productName?: string; // Associated Product Name under this brand entry
  brandType: BrandType;
  logoUrl?: string;
  countryOfOrigin?: string;
  description?: string;
  status: 'active' | 'inactive';
  categoryId?: string; // Direct Associated Category ID
  categoryName?: string; // Direct Associated Category Name (English)
  categoryNameBn?: string; // Direct Associated Category Name (Bengali)
  categoryIds?: string[]; // Allowed/Associated Category IDs
  subCategories?: string[]; // Allowed/Associated SubCategory names
  isApproved?: boolean;
  requestedByUserId?: string;
  requestedByUserName?: string;
  requestedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface BrandRequest {
  id: string;
  brandName: string;
  brandType: BrandType;
  countryOfOrigin?: string;
  logoUrl?: string;
  categoryId: string;
  categoryName: string;
  subCategory?: string;
  requestedByUserId: string;
  requestedByUserName: string;
  requestedByUserRole: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  code?: string;
  division?: string;
  district?: string;
  upazila?: string;
  unionName?: string;
  latitude?: number;
  longitude?: number;
  stockCount?: number;
}

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'percentage' | 'flat' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiryDate?: string;
  isActive?: boolean;
  description?: string;
}

export interface ProductVariant {
  id: string;
  title?: string;
  name?: string;
  sku: string;
  mrp?: number;
  price: number;
  dealerPrice?: number;
  stockQuantity?: number;
  stock?: number;
  pvPoint?: number;
  barcode?: string;
  weightKg?: number;
  weight?: string | number; // e.g. '220g', '250g', '270g', or 250
  weightGrams?: number; // exact numeric grams for delivery calculation (e.g. 250)
  color?: string; // e.g. 'Black', 'White', 'Navy'
  size?: string; // e.g. 'S', 'M', 'L', 'XL'
  image?: string; // variant-specific product photo
  priceAdjustment?: number; // optional price adjustment e.g. +50, -20, or 0
  isAvailable?: boolean;
  dimensionsCm?: string;
}

export interface ProductReview {
  id?: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: string;
  date?: string;
  verifiedPurchase?: boolean;
}

export interface Product {
  id: string;
  title: string;
  titleBn?: string;
  slug: string;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  sku?: string;
  barcode?: string;
  mrp: number;
  discount: number;
  campaignPrice: number;
  price?: number;
  dealerPrice?: number;
  profit?: number;
  adminCost?: number;
  netProfit?: number;
  vendorCost?: number;
  serviceCharge?: number;
  platformFee?: number;
  flashSalePrice?: number;
  couponDiscount?: number;
  cashbackPct?: number;
  pvValue?: number;
  deliveryCost?: number;
  weightKg?: number;
  dimensionsCm?: string;
  codAvailable?: boolean;
  returnPolicyDays?: number;
  unit?: string;
  tags?: string[];
  isFeatured?: boolean;
  pvPoint?: number;
  vendorId: string;
  vendorShopName: string;
  images: string[];
  thumbnail?: string;
  description?: string;
  descriptionBn?: string;
  shortDescription?: string;
  longDescription?: string;
  videoUrl?: string;
  inStock?: boolean;
  stockQuantity?: number;
  stock?: number;
  warehouseId?: string;
  warehouseName?: string;
  isOrganicCertified?: boolean;
  subCategory?: string;
  vatTax?: number;
  warranty?: string;
  expiryDate?: string;
  marketBazar?: string;
  googleMapsUrl?: string;
  discountPrice?: number;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  isNewArrival?: boolean;
  isBestSelling?: boolean;
  addedByRole?: string;
  variants: ProductVariant[];
  rating: number;
  reviewsCount: number;
  reviews?: ProductReview[];
  isApproved?: boolean;
  status?: string;
  createdAt?: string;
  pvMode?: 'auto' | 'manual';
  manualPv?: number;
  paymentOptions?: ProductPaymentOptions;
  // Centralized Discount Architecture Fields
  discount_scope?: 'global' | 'category' | 'product';
  discount_percent?: number;
  discount_source?: string;
  isDiscountOverridden?: boolean;
  // Advanced VAT/Tax & Dual Pricing Architecture
  sellingPrice?: number;
  mrpExclTax?: number;
  mrpInclTax?: number;
  dealerPriceExclTax?: number;
  sellingPriceExclTax?: number;
  sellingPriceInclTax?: number;
  taxRate?: number;
  taxMode?: 'included' | 'excluded';
  taxSource?: 'global' | 'custom';
  taxAmount?: number;
  sellingTaxAmount?: number;
  isManualOverride?: boolean;
  pricingMode?: 'auto' | 'manual';
  discountAmount?: number;
  discountPercentage?: number;
  // Delivery Zone & Seller / Dealer Geographic Association
  dealer_id?: string;
  dealer_name?: string;
  dealer_shop_name?: string;
  tradeLicenseBusinessName?: string;
  tradeLicenseNumber?: string;
  dealerOwnerName?: string;
  dealer_address?: string;
  district?: string;
  upazila?: string;
  zone_id?: string;
  zone_name?: string;
  zone_name_bn?: string;
  dealerStocks?: DealerStockLocation[];
}

export interface CatalogDiscountSettings {
  globalDiscountPercent: number;
  categoryDiscounts: Record<string, number>;
  updatedAt?: string;
  updatedBy?: string;
}

export interface DiscountAuditLog {
  id: string;
  superAdminId: string;
  superAdminName?: string;
  actionType: 'GLOBAL_DISCOUNT_UPDATE' | 'CATEGORY_DISCOUNT_UPDATE' | 'PRODUCT_DISCOUNT_UPDATE' | 'PRODUCT_DISCOUNT_RESET';
  scope: 'global' | 'category' | 'product';
  targetId?: string;
  targetName?: string;
  previousDiscount: number;
  newDiscount: number;
  affectedProductsCount?: number;
  date: string;
  time: string;
  createdAt: string;
}

export interface ProductPaymentOptions {
  nagad: boolean;
  bkash: boolean;
  rocket: boolean;
  bank: boolean;
  cod: boolean;
}

export interface PaymentChargesConfig {
  codRate: number;     // e.g. 0%
  bkashRate: number;   // e.g. 1.8%
  nagadRate: number;   // e.g. 1.8%
  rocketRate: number;  // e.g. 1.8%
  bankRate: number;    // configurable (default 0%)
}

export interface ProductPricingAuditLog {
  id: string;
  productId: string;
  productName: string;
  changedField: string;
  previousValue: string | number | boolean;
  newValue: string | number | boolean;
  changedBy: string;
  changedByRole: string;
  dateTime: string;
}

// ==========================================
// Delivery Charge & Logistics Management Types
// ==========================================
export type DeliveryZoneType = 'inside_dhaka' | 'suburban_dhaka' | 'outside_dhaka';
export type DistanceRoundingMode = 'exact' | 'round_down' | 'round_up';
export type DeliveryMode = 'motorcycle' | 'courier' | 'road_cargo' | 'air_cargo';

export interface ZoneWeightRates {
  weight0To500g: number;
  weight500gTo1kg: number;
  weight1To2kg: number;
  weightAbove2kgPerKg: number;
}

export interface DeliveryZoneConfig {
  id: DeliveryZoneType;
  name: string;
  nameBn: string;
  enabled: boolean;
  baseCharge: number;
  insidePaurashavaRate: number;
  outsidePaurashavaRate: number;
  weightRates: ZoneWeightRates;
}

export interface DistanceDeliveryRule {
  enabled: boolean;
  baseDistanceKm: number; // e.g. 1 KM
  extraPerKmCharge: number; // e.g. 15 Tk/km
  roundingMode: DistanceRoundingMode; // 'exact' | 'round_down' | 'round_up'
  maxDistanceKm?: number;
}

export interface CourierWeightSlab {
  id: string;
  minKg: number;
  maxKg: number;
  rateInsideDhaka: number;
  rateSuburban: number;
  rateOutsideDhaka: number;
  label: string;
}

export interface LocalHeavyDistanceSlab {
  id: string;
  minKm: number;
  maxKm: number;
  charge: number; // Fixed distance slab charge, NOT multiplied by distance
  label: string;
}

export interface LocalHeavyDeliveryConfig {
  enabled: boolean;
  minWeightKg: number; // Default 10 kg
  maxWeightKg: number; // Default 50 kg
  maxDistanceKm: number; // Default 10 km
  slabs: LocalHeavyDistanceSlab[];
  beyondMaxDistancePolicy: 'road_cargo' | 'courier' | 'custom_quote';
}

export interface CargoWeightTierConfig {
  id: string;
  name: string;
  nameBn: string;
  minKg: number;
  maxKg: number;
  baseCharge: number;
  perKgCharge: number;
  perKmCharge: number;
  minTotalCharge: number;
  maxTotalCharge?: number;
  requiresCustomQuote?: boolean;
}

export interface RoadCargoConfig {
  enabled: boolean;
  basePickupFee: number;
  hubHandlingFee: number;
  perKgRate: number;
  perKmRate: number;
  destinationHandlingFee: number;
  lastMileFee: number;
  minimumCharge: number;
}

export interface AirCargoConfig {
  enabled: boolean;
  dealerToAirportFee: number;
  departureAirportHandlingFee: number;
  airFreightPerKgRate: number;
  minimumFreightCharge: number;
  destinationAirportHandlingFee: number;
  finalLastMileFee: number;
}

export interface DealerStockLocation {
  dealerId: string;
  dealerOwnerName?: string;
  tradeLicenseBusinessName: string;
  tradeLicenseNumber?: string;
  contactPhone?: string;
  address?: string;
  division: string;
  district: string;
  upazila: string;
  zoneId: string;
  zoneName: string;
  stock: number;
  availableStock?: number;
  updatedAt?: string;
}

export interface DealerPoint {
  id: string;
  name: string; // Official display name = Trade License Business Name
  tradeLicenseBusinessName: string;
  dealerOwnerName?: string;
  tradeLicenseNumber?: string;
  dealerId?: string;
  code: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  division: string;
  district: string;
  upazila: string;
  zoneId?: string;
  zoneName?: string;
  unionOrArea?: string;
  latitude: number;
  longitude: number;
  coverageRadiusKm: number;
  isActive: boolean;
  supportedModes?: DeliveryMode[];
}

export interface RiderIncentiveConfig {
  baseFeePerOrder: number;
  extraPerKmFee: number;
  heavyWeightBonusKg10To50: number;
  heavyWeightBonusKg50Plus: number;
}

export interface DeliveryAuditLog {
  id: string;
  type: 'rate_config_change' | 'manual_order_override' | 'dealer_point_change';
  orderId?: string;
  adminId: string;
  adminName: string;
  actionSummary: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  reason?: string;
}

export interface SuperAdminDeliveryConfig {
  id: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
  status: 'active' | 'inactive';
  emergencyNotice?: string;
  zones: {
    inside_dhaka: DeliveryZoneConfig;
    suburban_dhaka: DeliveryZoneConfig;
    outside_dhaka: DeliveryZoneConfig;
  };
  distanceRule: DistanceDeliveryRule;
  paurashavaRule: {
    enabled: boolean;
    insidePaurashavaBaseModifier: number;
    outsidePaurashavaSurcharge: number;
  };
  defaultWeightRates: ZoneWeightRates;
  courierSlabs?: CourierWeightSlab[];
  localHeavyConfig?: LocalHeavyDeliveryConfig;
  cargoTiers?: CargoWeightTierConfig[];
  roadCargoConfig?: RoadCargoConfig;
  airCargoConfig?: AirCargoConfig;
  dealerPoints?: DealerPoint[];
  riderIncentive?: RiderIncentiveConfig;
  auditLogs?: DeliveryAuditLog[];
}

export interface OrderDeliverySnapshot {
  deliveryZone: DeliveryZoneType;
  deliveryZoneName: string;
  zoneNameBn?: string;
  district: string;
  upazila: string;
  paurashavaOrUnion: string;
  isPaurashava: boolean;
  distanceKm: number;
  distanceMode: DistanceRoundingMode;
  effectiveDistanceKm: number;
  totalWeightGrams: number;
  totalWeightKg: number;
  totalWeightDisplay?: string;
  weightSlab: string;
  distanceSlab?: string;
  baseDeliveryCharge: number;
  extraDistanceCharge: number;
  weightSurcharge: number;
  paurashavaSurcharge?: number;
  handlingCharge?: number;
  finalDeliveryCharge: number;
  rateBreakdown: string;
  calculatedAt: string;

  deliveryMode?: DeliveryMode;
  deliveryModeLabel?: string;
  appliedRule?: string;
  routeCalculationMethod?: 'google_maps' | 'haversine_road' | 'manual';
  dealerPoint?: {
    id: string;
    name: string;
    address: string;
    district: string;
    upazila: string;
    latitude: number;
    longitude: number;
  };
  customerAddress?: {
    address: string;
    district: string;
    upazila: string;
    isPaurashava: boolean;
    latitude?: number;
    longitude?: number;
  };
  manualOverride?: {
    isOverridden: boolean;
    originalCharge: number;
    overrideCharge: number;
    reason: string;
    adminName: string;
    overriddenAt: string;
  };
  rateVersion?: number;
}

export type ZoneDeliveryType = 'WITHIN_ZONE' | 'ZONE_TO_ZONE';

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

export interface CartItem {
  id?: string;
  productId: string;
  product?: Product;
  productTitle?: string;
  productImage?: string;
  selectedVariant?: ProductVariant;
  variantName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  mrp?: number;
  pv?: number;
  totalPrice?: number;
  pvPoint?: number;
  productTitleBn?: string;
  // Historical VAT & Pricing Snapshot
  mrpExclTax?: number;
  mrpInclTax?: number;
  sellingPriceExclTax?: number;
  sellingPriceInclTax?: number;
  vatTaxRate?: number;
  vatTaxAmount?: number;
  totalVatTax?: number;
  vatTaxMode?: 'included' | 'excluded';
  taxSource?: 'global' | 'custom';
  discountAmount?: number;
  finalPrice?: number;
  vatSnapshot?: {
    unitPriceExclTax: number;
    unitPriceInclTax: number;
    unitTaxAmount: number;
    totalTaxAmount: number;
    totalPriceExclTax?: number;
    totalPriceInclTax?: number;
    vatRate: number;
    taxMode?: 'included' | 'excluded';
    taxSource?: 'global' | 'custom';
    discountAmount?: number;
  };
}

export type OrderItem = CartItem;

export type PaymentMethod = 'cod' | 'wallet' | 'online_bkash' | 'online_rocket' | 'online_nagad' | 'online_card' | 'bank_transfer';

export type OrderStatus =
  | 'pending'
  | 'placed'             // 1. ORDER PLACED
  | 'op_assigned'        // 2. OPERATION PARTNER ASSIGNED
  | 'dealer_assigned'    // 3. DEALER ASSIGNED
  | 'product_ready'      // 4. PRODUCT READY
  | 'delivery_assigned'   // 5. DELIVERY MAN ASSIGNED
  | 'picked_up'          // 6. PICKED UP
  | 'out_for_delivery'   // 7. OUT FOR DELIVERY
  | 'delivered'          // 8. DELIVERED
  | 'completed'          // 9. COMPLETED
  | 'processing'
  | 'confirmed'
  | 'packed'
  | 'assigned'
  | 'picked'
  | 'shipped'
  | 'in_transit'
  | 'vendor_accepted'
  | 'rider_assigned'
  | 'delivery_failed'
  | 'returned_to_dealer'
  | 'cancelled'
  | 'returned';

export interface OrderRoutingAssignment {
  opPartnerId: string;
  opPartnerName: string;
  opPartnerHubCode?: string;
  opPartnerCoverageUpazila?: string;
  dealerId: string;
  dealerName: string;
  dealerShopName: string;
  dealerOutletAddress?: string;
  deliveryRiderId: string;
  deliveryRiderName: string;
  deliveryRiderPhone: string;
  deliveryRiderVehicle?: string;
  routedDivision: string;
  routedDistrict: string;
  routedUpazila: string;
  routedUnionOrArea: string;
  latitude?: number;
  longitude?: number;
  routedAt: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  updatedByRole: string;
  updatedByUserId?: string;
  updatedByUserName?: string;
  timestamp: string;
  notes?: string;
}

export type ReassignmentReason =
  | 'rider_rejected'
  | 'timeout'
  | 'officer_manual_reassign'
  | 'rider_offline'
  | 'capacity_exceeded'
  | 'vehicle_issue'
  | 'emergency_reassign'
  | 'customer_requested';

export interface ReassignmentHistoryItem {
  id: string;
  orderId: string;
  timestamp: string;
  previousRiderId?: string;
  previousRiderName?: string;
  previousRiderPhone?: string;
  newRiderId?: string;
  newRiderName?: string;
  newRiderPhone?: string;
  reason: ReassignmentReason;
  reasonBn?: string;
  notes?: string;
  reassignedByRole: string;
  reassignedByUserId?: string;
  reassignedByUserName?: string;
}

export interface OperationOffice {
  operation_office_id: string;
  office_name: string;
  zone_id: string; // matches Upazila ID
  zone_name?: string;
  zone_name_bn?: string;
  division: string;
  district: string;
  upazila: string;
  address: string;
  mobile: string;
  officer_name?: string;
  officer_user_id?: string;
  officer_phone?: string;
  latitude?: number;
  longitude?: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface OperationOfficeSummary {
  operation_office_id: string;
  office_name: string;
  zone_id: string;
  address: string;
  mobile: string;
  officer_name?: string;
}

export interface LogisticsAssignment {
  id?: string;
  orderId?: string;
  vendorId?: string;
  vendorShopName: string;
  vendorDistanceKm: number;
  vendorAddress?: string;
  hubId?: string;
  hubCode: string;
  hubDistanceKm: number;
  hubAddress?: string;
  riderId?: string;
  riderName: string;
  riderPhone: string;
  riderVehicle: string;
  riderDistanceKm?: number;
  riderLat?: number;
  riderLng?: number;
  riderFound?: boolean;
  riderStatus?: string;
  riderUnavailableReason?: string;
  nearestRider?: {
    id: string;
    name: string;
    phone: string;
    vehicle?: string;
    distanceKm?: number;
  };
  opPartnerId?: string;
  opPartnerName?: string;
  dealerId?: string;
  dealerName?: string;
  dealerShopName?: string;
  status?: string;
}

export type OrderChannel = 'website' | 'whatsapp' | 'messenger' | 'sms' | 'voice_call';

export interface ChannelCustomerProfile {
  id: string;
  customerId: string; // Unique permanent customer ID (e.g. CUST-98421)
  fullName: string;
  mobileNumber: string;
  isVerified: boolean;
  channel: OrderChannel;
  channelIdentifier?: string; // E.g. whatsapp number or messenger PSID, separate from Customer ID
  address?: ServiceAddress;
  createdAt: string;
  orderHistoryIds?: string[];
}

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  orderChannel?: OrderChannel;
  generatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: ServiceAddress;
  items: CartItem[];
  mrpTotal: number;
  subtotal: number;
  subtotalExclTax?: number;
  subtotalInclTax?: number;
  shippingCharge: number;
  tax: number;
  totalVatTax?: number;
  taxMode?: 'included' | 'excluded';
  paymentCharge: number;
  couponDiscount: number;
  grandTotal: number;
  pvEarned: number;
  cashbackEarned: number;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  otpCode: string;
  orderStatus: OrderStatus;
  routingAssignment?: OrderRoutingAssignment;
  deliverySnapshot?: OrderDeliverySnapshot;
  zoneSnapshot?: OrderZoneSnapshot;
  operationOffice?: OperationOfficeSummary;
  reassignmentHistory?: ReassignmentHistoryItem[];
  riderAcceptanceStatus?: 'pending' | 'accepted' | 'rejected' | 'timeout';
}

export interface Order {
  id: string;
  invoiceNumber?: string;
  invoiceGeneratedAt?: string;
  invoice?: InvoiceData;
  orderChannel?: OrderChannel;
  userId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: CartItem[];
  subtotal: number;
  subtotalExclTax?: number;
  subtotalInclTax?: number;
  taxMode?: 'included' | 'excluded';
  mrpTotal?: number;
  discountAmount?: number;
  couponCode?: string;
  couponDiscount: number;
  shippingCharge: number;
  tax: number;
  totalVatTax?: number;
  paymentCharge?: number;
  platformFee: number;
  grandTotal: number;
  totalPvEarned?: number;
  pvEarned?: number;
  cashbackEarned?: number;
  codCollected?: boolean;
  codSettled?: boolean;
  deliveryProofNote?: string;
  deliveryFailureReason?: string;
  riderSettlementAmount?: number;
  estimatedDelivery?: string;
  notes?: string;
  shippingAddress: ServiceAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'unpaid' | 'paid' | 'failed';
  orderStatus: OrderStatus;
  logistics: LogisticsAssignment;
  assignedOpPartnerId?: string;
  assignedOpPartnerName?: string;
  assignedDealerId?: string;
  assignedDealerName?: string;
  assignedDealerShopName?: string;
  assignedDeliveryRiderId?: string;
  assignedDeliveryRiderName?: string;
  assignedDeliveryRiderPhone?: string;
  routingAssignment?: OrderRoutingAssignment;
  statusHistory?: OrderStatusHistoryItem[];
  reassignmentHistory?: ReassignmentHistoryItem[];
  operationOffice?: OperationOfficeSummary;
  riderAcceptanceStatus?: 'pending' | 'accepted' | 'rejected' | 'timeout';
  riderAssignedAt?: string;
  riderAcceptedAt?: string;
  otpCode: string;
  specialNotes?: string;
  deliverySnapshot?: OrderDeliverySnapshot;
  zoneSnapshot?: OrderZoneSnapshot;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName?: string;
  category?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  userId?: string;
  orderId: string;
  productName?: string;
  refundType?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SystemSettings {
  siteName?: string;
  companyName: string;
  tokenName: string;
  currencyCode: string;
  currencySymbol: string;
  defaultLanguage?: string;
  timezone: string;
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;
  maintenanceMode?: boolean;
  currency?: string;
  sellerContactEmail?: string;
  dealerContactEmail?: string;
  supportEmail?: string;
  globalDiscount?: number;
  discountSettings?: CatalogDiscountSettings;
  companyMasterId?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  resource?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt?: string;
  timestamp?: string;
}

export type SmsMessageStatus = 'received' | 'ai_parsed' | 'confirmed' | 'rejected' | 'need_info' | 'converted_to_order';
export type SmsIntentType = 'place_order' | 'check_status' | 'price_inquiry' | 'delivery_inquiry' | 'general_chat' | 'unknown';
export type SmsAiTone = 'polite_bangla' | 'corporate_bangla' | 'fast_english' | 'bilingual';

export interface SmsParsedItem {
  productId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice?: number;
  mrp?: number;
  total?: number;
}

export interface SmsParsedAddress {
  division?: string;
  district?: string;
  upazila?: string;
  unionName?: string;
  ward?: string;
  area?: string;
  rawAddress?: string;
  fullServiceAddress?: string;
}

export interface SmsOrderMessage {
  id: string;
  senderPhone: string;
  senderName?: string;
  rawText: string;
  receivedAt: string;
  channel: 'sms' | 'whatsapp' | 'web_sms';
  status: SmsMessageStatus;
  confidenceScore: number;
  parsedIntent: SmsIntentType;
  parsedItems: SmsParsedItem[];
  parsedAddress: SmsParsedAddress;
  missingInfo?: string[];
  totalCalculatedAmount: number;
  deliveryCharge: number;
  aiReplyText: string;
  aiRepliedAt: string;
  aiModelUsed: string;
  convertedOrderId?: string;
  assignedOpPartnerId?: string;
  assignedOpPartnerName?: string;
  assignedDealerId?: string;
  notes?: string;
  isAiAutoReplied: boolean;
}

export interface SmsGatewayConfig {
  gatewayName: string;
  senderId: string;
  apiUrl: string;
  apiKey?: string;
  simulationMode: boolean;
  aiAutoReplyEnabled: boolean;
  aiAutoOrderConversion: boolean;
  aiTone: SmsAiTone;
  dailySmsQuota: number;
  smsUsedToday: number;
  systemPromptGuideline?: string;
}

// ==========================================
// Finance & Accounting Enterprise Types
// ==========================================

export type LedgerEntryType = 'debit' | 'credit';

export type FinancialCategory =
  | 'ecommerce_sale'
  | 'vendor_payout'
  | 'rider_delivery_fee'
  | 'rider_payout'
  | 'ops_hub_allowance'
  | 'mlm_binary_commission'
  | 'mlm_referral_bonus'
  | 'token_mint'
  | 'token_burn'
  | 'gateway_fee'
  | 'server_infra'
  | 'sms_api_bill'
  | 'staff_payroll'
  | 'tax_vat_payment'
  | 'corporate_capital_deposit'
  | 'refund_reversal'
  | 'delivery_collection'
  | 'commission_disbursement'
  | 'office_expense'
  | 'marketing_expense'
  | 'advertising'
  | 'transportation'
  | 'supplier_expense'
  | 'maintenance'
  | 'adjustment_entry';

export type TransactionStatus = 'settled' | 'pending' | 'processing' | 'rejected' | 'refunded' | 'Posted' | 'Pending' | 'Draft' | string;

export interface FinancialLedgerEntry {
  id?: string;
  transactionId?: string;
  voucherNumber?: string;
  date?: string;
  dateTime?: string;
  title?: string;
  category?: FinancialCategory | string;
  account: string;
  referenceType: 'order' | 'settlement' | 'commission' | 'expense' | 'refund' | 'adjustment' | 'deposit' | 'withdrawal' | 'payout' | 'Order' | 'Settlement' | 'Commission' | 'Expense' | 'Refund' | 'Adjustment' | string;
  referenceId: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  entryType?: LedgerEntryType;
  amount?: number;
  vatAmount?: number;
  taxAitAmount?: number;
  currency?: string;
  paymentMethod?: string;
  accountNumber?: string;
  payeeOrPayerName?: string;
  payeeOrPayerRole?: UserRole;
  status: TransactionStatus;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
}

export interface BankAccountRecord {
  accountId?: string;
  id?: string;
  accountName: string;
  accountNumber: string;
  bankOrGateway?: string;
  accountType: string;
  openingBalance: number;
  currentBalance: number;
  totalDebit: number;
  totalCredit: number;
  pendingInflow?: number;
  pendingOutflow?: number;
  currency?: string;
  lastReconciledAt?: string;
  reconciliationStatus?: 'Reconciled' | 'Pending' | 'Discrepancy' | 'Matched' | 'reconciled' | 'pending' | 'discrepancy' | string;
  status?: string;
}

export interface FinanceSettlementRecord {
  settlementId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryRole: string;
  grossSalesAmount: number;
  deductions: number;
  platformFee?: number;
  taxDeducted?: number;
  netPayableAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  requestDate: string;
  approvalDate?: string;
  paymentDate?: string;
  status: 'Requested' | 'Under Review' | 'Approved' | 'Settled' | 'Rejected' | 'Pending Approval' | string;
  settledBy?: string;
  approvedBy?: string;
  notes?: string;
}

export type PayoutBeneficiaryRole = 'vendor' | 'dealer' | 'delivery_rider' | 'operations_partner' | 'network_member';

export type PayoutStatus = 'pending' | 'approved' | 'disbursed' | 'rejected' | 'on_hold';

export interface PayoutRequest {
  id: string;
  requestNumber: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  role: PayoutBeneficiaryRole;
  requestedAmount: number;
  platformDeductionFee: number; // e.g. 2% gateway or admin fee
  taxWithheldAit: number; // AIT 2-5%
  netPayableAmount: number;
  payoutMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Bank_Transfer' | 'Cash' | 'Crypto';
  payoutAccountDetails: string;
  division: string;
  district: string;
  upazila?: string;
  requestedAt: string;
  processedAt?: string;
  status: PayoutStatus;
  notes?: string;
  transactionReference?: string;
}

export interface BankAccountReserve {
  id: string;
  accountName: string;
  bankOrGateway: string;
  accountNumber: string;
  accountType: 'mobile_banking_merchant' | 'commercial_current' | 'escrow_reserve' | 'petty_cash_vault' | 'crypto_treasury' | 'payment_gateway';
  openingBalance: number;
  currentBalance: number;
  totalDebit: number;
  totalCredit: number;
  pendingInflow: number;
  pendingOutflow: number;
  currency: string;
  lastReconciledAt: string;
  reconciliationStatus: 'reconciled' | 'pending' | 'discrepancy';
  status: 'active' | 'under_audit' | 'frozen';
}

export interface VatTaxReportSummary {
  period: string; // e.g. "August 2026"
  totalGrossTurnover: number;
  vatRateStandard: number; // 5% or 15%
  totalVatPayable: number;
  totalVatRebate: number;
  netVatPayable: number;
  totalAitWithheld: number;
  nbrMushakChallanNumber?: string;
  filingStatus: 'draft' | 'audited' | 'submitted_to_nbr';
}

// ----------------------------------------------------
// Specialized Finance Records for Comprehensive Dash
// ----------------------------------------------------

export interface FinanceSaleRecord {
  orderId: string;
  orderDate: string;
  date?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  sellerOrDealerId: string;
  sellerOrDealerName?: string;
  district?: string;
  upazila?: string;
  product: string;
  quantity: number;
  subtotal?: number;
  deliveryFee?: number;
  mrp: number;
  discount: number;
  taxVat?: number;
  tax: number;
  cashback: number;
  finalSaleAmount: number;
  totalAmount?: number;
  deliveryCost: number;
  costOfGoods?: number;
  cogs?: number;
  netCommission?: number;
  paymentMethod: 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Bank' | 'Crypto' | 'Other approved payment methods' | 'Other' | string;
  paymentStatus: 'Pending' | 'Processing' | 'Received' | 'Failed' | 'Refunded' | 'Partially Refunded' | 'Paid' | 'Collected' | string;
  orderStatus: 'delivered' | 'processing' | 'shipped' | 'pending' | 'cancelled' | 'failed' | string;
  deliveryStatus?: 'Delivered' | 'In Transit' | 'Processing' | 'Pending' | 'Cancelled' | string;
  settlementStatus?: 'Settled' | 'Pending' | 'Processing' | 'On Hold' | string;
}

export interface FinancePaymentRecord {
  paymentId: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  amount: number;
  paymentMethod: 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Bank' | 'Crypto' | 'Other approved payment methods' | 'Other' | string;
  gatewayName?: string;
  gatewayTrxId?: string;
  gatewayFeePercentage?: number;
  gatewayFeeAmount?: number;
  gatewayCharge?: number; // 1.8% for bKash and Nagad
  netSettledAmount?: number;
  transactionId: string;
  paymentDate: string;
  dateTime?: string;
  paymentStatus: 'Pending' | 'Processing' | 'Received' | 'Failed' | 'Refunded' | 'Partially Refunded' | string;
  status?: 'Pending' | 'Processing' | 'Received' | 'Failed' | 'Refunded' | 'Partially Refunded' | 'Captured' | string;
  receivedBy: string;
  verifiedBy: string;
  notes?: string;
}

export interface DeliveryCollectionRecord {
  orderId: string;
  customerId: string;
  customerName?: string;
  deliveryManId: string;
  deliveryManName: string;
  deliveryManPhone?: string;
  district?: string;
  upazila?: string;
  collectionAmount: number;
  paymentMethod: 'Cash on Delivery' | 'bKash' | 'Nagad' | 'Bank' | string;
  moneyReceiptStatus: 'issued' | 'pending' | 'confirmed_by_customer' | 'confirmed';
  collectionDate: string;
  settlementStatus: 'Pending' | 'Under Review' | 'Approved' | 'Paid' | 'Rejected' | 'Reconciled' | 'Settled';
  settlementId?: string;
  settlementDate?: string;
  approvedBy?: string;
  receiptNumber?: string;
  buyingCode?: string;
  notes?: string;
}

export interface FinanceCommissionRecord {
  commissionId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryRole: 'Seller / Dealer' | 'Operations Officer' | 'Delivery Man' | 'Referral / Sponsor' | 'Network Member' | 'Company / Admin' | 'dealer' | 'operations_partner' | 'delivery_rider' | 'network_member' | 'vendor' | 'company_admin' | string;
  orderId: string;
  commissionType: 'Seller/Dealer Commission' | 'Operations Officer Commission' | 'Delivery Man Commission' | 'Referral Commission' | 'Network Commission' | 'Company/Admin Share' | 'Other approved commissions' | 'Dealer Commission' | 'Delivery Rider Commission' | 'Company Platform Share' | 'Other' | string;
  grossAmount: number;
  commissionRate: number; // percentage, e.g. 5%
  commissionAmount: number;
  status: 'Pending' | 'Approved' | 'Payable' | 'Paid' | 'Hold' | 'Cancelled';
  approvalDate?: string;
  paymentDate?: string;
  approvedBy?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Delivery Expense'
  | 'Employee Salary'
  | 'Office Expense'
  | 'Marketing Expense'
  | 'Advertising'
  | 'Technology/Server'
  | 'Payment Gateway Fee'
  | 'Refund Expense'
  | 'Transportation'
  | 'Supplier Expense'
  | 'Maintenance'
  | 'Other Expense'
  | string;

export interface FinanceExpenseRecord {
  expenseId: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  submittedBy: string;
  approvedBy?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Rejected';
  attachmentUrl?: string;
  notes?: string;
}

export interface FinanceReceivableRecord {
  receivableId?: string;
  partyId: string;
  partyName?: string;
  name?: string;
  partyRole?: string;
  role?: 'Customer' | 'Delivery Collection' | 'Vendor Advance' | 'Other Receivable' | string;
  reference: string;
  totalAmount?: number;
  amount?: number;
  dueDate: string;
  aging?: string;
  collectedAmount?: number;
  paidAmount?: number;
  outstandingAmount: number;
  status: 'Current' | 'Overdue' | 'Partially Paid' | 'Collected' | 'Partially Collected' | 'Pending';
}

export interface FinancePayableRecord {
  payableId?: string;
  partyId: string;
  partyName?: string;
  name?: string;
  partyRole?: string;
  role?: 'Seller/Dealer' | 'Delivery Man' | 'Operations Officer' | 'Network Member' | 'Supplier' | 'Service Provider' | 'Other' | string;
  category?: string;
  reference: string;
  totalAmount?: number;
  amount?: number;
  dueDate: string;
  aging?: string;
  paidAmount: number;
  outstandingAmount: number;
  status: 'Pending Review' | 'Approved' | 'Due' | 'Paid' | 'Partially Paid' | 'On Hold' | 'Pending';
}

export interface FinanceRefundRecord {
  refundId: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  originalAmount?: number;
  originalOrderAmount?: number;
  refundAmount: number;
  reason?: string;
  refundReason?: string;
  refundMethod: 'bKash' | 'Nagad' | 'Bank' | 'Cash' | 'Wallet_Credit' | string;
  requestedDate?: string;
  date?: string;
  refundDate?: string;
  approvedDate?: string;
  paidDate?: string;
  approvedBy?: string;
  status: 'Requested' | 'Under Review' | 'Approved' | 'Processing' | 'Refunded' | 'Rejected';
}

export interface BankReconciliationItem {
  id?: string;
  reconciliationId?: string;
  transactionId: string;
  bankName?: string;
  accountName?: string;
  bankAccountNumber?: string;
  systemAmount: number;
  bankAmount: number;
  difference: number;
  transactionDate?: string;
  statementDate?: string;
  status?: 'Matched' | 'Partially Matched' | 'Unmatched' | 'Investigating' | 'Reconciled';
  reconciliationStatus?: 'Matched' | 'Partially Matched' | 'Unmatched' | 'Investigating' | 'Reconciled';
  notes?: string;
  reconciledBy?: string;
}

export interface FinanceAuditLogRecord {
  id?: string;
  logId?: string;
  userId: string;
  userName?: string;
  userRole: string;
  action: string;
  targetEntity?: string;
  entityId?: string;
  transactionId?: string;
  previousValue?: string;
  newValue?: string;
  dateTime?: string;
  date?: string;
  time?: string;
  ipAddress: string;
  reason?: string;
  details?: string;
  approvalStatus?: string;
  status?: string;
}

export interface FinanceNotification {
  id: string;
  type: 'large_payment' | 'pending_settlement' | 'failed_payment' | 'refund_request' | 'unapproved_expense' | 'commission_payable' | 'unmatched_bank' | 'suspicious_adjustment' | 'settlement_overdue';
  title: string;
  message: string;
  timestamp: string;
  amount?: number;
  referenceId?: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

