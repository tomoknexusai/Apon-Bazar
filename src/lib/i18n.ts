/**
 * Enterprise Multi-language Localization Engine (Bangla & English)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import { Language, UserRole } from '../types';

export const roleLabels: Record<UserRole, { bn: string; en: string }> = {
  founder: { bn: 'ফাউন্ডার ও নির্বাহী পরিচালক', en: 'Founder & Managing Director' },
  super_admin: { bn: 'সুপার এডমিন', en: 'Super Admin' },
  admin: { bn: 'এডমিন', en: 'Admin' },
  account_officer: { bn: 'একাউন্ট অফিসার', en: 'Account Officer' },
  finance: { bn: 'ফিন্যান্স ও অ্যাকাউন্টস', en: 'Finance & Accounts' },
  finance_officer: { bn: 'ফিন্যান্স ও অ্যাকাউন্টস অফিসার', en: 'Finance & Accounts Officer' },
  hr: { bn: 'এইচআর', en: 'HR' },
  district_admin: { bn: 'জেলা এডমিন', en: 'District Admin' },
  operations_officer: { bn: 'অপারেশন অফিসার', en: 'Operation Officer' },
  customer_networker: { bn: 'কাস্টমার ও নেটওয়ার্কার', en: 'Customer & Networker' },
  customer: { bn: 'কাস্টমার', en: 'Customer' },
  network_member: { bn: 'নেটওয়ার্ক মেম্বার', en: 'Network Member' },
  vendor_dealer_shop: { bn: 'ভেন্ডর / ডিলার / শপ', en: 'Vendor / Dealer / Shop' },
  vendor: { bn: 'ভেন্ডর', en: 'Vendor' },
  dealer: { bn: 'ডিলার', en: 'Dealer' },
  operations_partner: { bn: 'অপারেশনস পার্টনার', en: 'Operations Partner' },
  rider: { bn: 'রাইডার', en: 'Rider' },
  delivery_rider: { bn: 'ডেলিভারি ম্যান', en: 'Delivery Man' },
  delivery_man: { bn: 'ডেলিভারি ম্যান', en: 'Delivery Man' }
};

export const translations = {
  bn: {
    // Brand & Header
    companyName: 'TOMSHOPBD',
    tagline: 'অনলাইন গ্রোসারী, শপিং ও বিশ্বস্ত ই-কমার্স প্ল্যাটফর্ম',
    searchPlaceholder: 'পণ্য, বিভাগ বা সেবা খুঁজুন...',
    languageName: 'বাংলা',
    
    // Auth & Account
    login: 'লগইন করুন',
    register: 'রেজিস্টার করুন',
    logout: 'লগআউট',
    emailOrMobile: 'ইমেইল অথবা মোবাইল নম্বর',
    password: 'পাসওয়ার্ড',
    confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন',
    fullName: 'সম্পূর্ণ নাম',
    mobileNumber: 'মোবাইল নম্বর',
    googleLogin: 'গুগল দিয়ে প্রবেশ করুন',
    phoneLogin: 'ফোন নম্বর (ওটিপি) দিয়ে লগইন',
    rememberMe: 'আমাকে মনে রাখুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    enterOtp: '৪ ডিজিটের ওটিপি কোড লিখুন',
    sendOtp: 'ওটিপি পাঠান',
    verifyOtp: 'যাচাই করুন',
    
    // Profile & Address
    myProfile: 'আমার প্রোফাইল',
    personalInfo: 'ব্যক্তিগত তথ্য',
    nationalId: 'জাতীয় পরিচয়পত্র (NID)',
    dateOfBirth: 'জন্ম তারিখ',
    gender: 'লিঙ্গ',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    serviceAddress: 'বাধ্যতামূলক ডেলিভারি ও সেবা ঠিকানা',
    division: 'বিভাগ',
    district: 'জেলা',
    upazila: 'উপজেলা',
    union: 'ইউনিয়ন',
    areaDetails: 'রোড/বাড়ি/এলাকার বিবরণ',
    postalCode: 'পোস্টাল কোড',
    saveProfile: 'প্রোফাইল সংরক্ষণ করুন',
    
    // Status & KYC
    accountStatus: 'অ্যাকাউন্ট স্ট্যাটাস',
    active: 'সক্রিয়',
    suspended: 'স্থগিত',
    banned: 'নিষিদ্ধ',
    pending: 'অপেক্ষমাণ',
    kycStatus: 'কেওয়াইসি যাচাই স্ট্যাটাস',
    verified: 'যাচাইকৃত',
    unverified: 'অযাচাইকৃত',
    pendingKyc: 'কেওয়াইসি প্রক্রিয়াধীন',
    rejected: 'প্রত্যাখ্যাত',
    submitKyc: 'NID ও কেওয়াইসি জমা দিন',
    nidFrontImage: 'NID সামনের অংশ',
    nidBackImage: 'NID পেছনের অংশ',
    
    // Global Settings & Token
    tomokTokenBalance: 'টমক (TOMOK) টোকেন ব্যালেন্স',
    currency: 'টাকা (৳)',
    timezone: 'এশিয়া/ঢাকা',
    systemRules: 'সিস্টেম ও নিরাপত্তা নিয়মাবলী',
    rlsSecurityActive: 'রো লেভেল সিকিউরিটি (RLS) সক্রিয়',
    
    // Dashboard Common
    dashboard: 'ড্যাশবোর্ড',
    switchRoleView: 'রোলের ড্যাশবোর্ড পরিবর্তন করুন',
    notifications: 'বিজ্ঞপ্তি',
    markAllAsRead: 'সবগুলো পঠিত হিসেবে চিহ্নিত করুন',
    noNotifications: 'কোনো নতুন বিজ্ঞপ্তি নেই',
    auditLogs: 'অডিট লগ',
    globalSettings: 'গ্লোবাল সেটিংস',
    
    // Super Admin Dashboard
    superAdminTitle: 'সুপার অ্যাডমিন ড্যাশবোর্ড (Super Admin Dashboard)',
    platformOverview: 'প্ল্যাটফর্ম সার্বিক তথ্য',
    totalUsers: 'মোট ব্যবহারকারী',
    tomokReserve: 'টমক টোকেন রিজার্ভ',
    activeRolesCount: 'সক্রিয় রোল পরিসংখ্যান',
    systemHealth: 'সিস্টেম হেলথ ও সার্ভার স্ট্যাটাস',
    rlsPolicies: 'RLS সিকিউরিটি পলিসি ও পারমিশন ম্যাট্রিক্স',
    databaseTables: 'ডাটাবেস টেবিল ও মাইগ্রেশন',

    // Admin Dashboard
    adminTitle: 'অ্যাডমিন ড্যাশবোর্ড (Admin Dashboard)',
    operationalCommand: 'অপারেশনাল কমান্ড সেন্টার',
    kycQueue: 'কেওয়াইসি যাচাই সারি',
    pendingVendors: 'অপেক্ষমাণ ভেন্ডর আবেদন',
    regionalDistribution: 'বিভাগীয় ও জেলাভিত্তিক পরিসংখ্যান',
    broadcastNotification: 'সকল ব্যবহারকারীকে বাল্ক নোটিফিকেশন পাঠান',

    // Customer Dashboard
    customerTitle: 'গ্রাহক ড্যাশবোর্ড (Customer Dashboard)',
    myOrdersPreview: 'আমার অর্ডার ও টোকেন পুরস্কার',
    mandateAddressInfo: 'আপনার প্রাথমিক ডেলিভারি ঠিকানা বাংলাদেশ সরকারের প্রশাসনিক অবকাঠামো অনুযায়ী সুনির্দিষ্ট থাকতে হবে।',
    securityAndSessions: 'নিরাপত্তা ও সক্রিয় সেশন',
    
    // Vendor Dashboard
    vendorTitle: 'ভেন্ডর ও ডিলার ড্যাশবোর্ড (Vendor / Dealer Dashboard)',
    shopDetails: 'দোকান ও আউটলেটের তথ্য',
    tradeLicense: 'ট্রেড লাইসেন্স নম্বর',
    commissionTier: 'কমিশন টিয়ার স্ট্যাটাস',
    outletAddress: 'আউটলেটের অবস্থান ও সেবা এলাকা',
    salesPipeline: 'পণ্য বিক্রি ও কমিশন ড্যাশবোর্ড',

    // Operations Partner Dashboard
    partnerTitle: 'অপারেশনস পার্টনার ড্যাশবোর্ড (Operations Partner Dashboard)',
    hubCode: 'হাব কোড',
    coverageMatrix: 'ইউনিয়ন লেভেল কভারেজ মেট্রিক্স',
    partnerQuota: 'পার্টনার কোটা ও লক্ষ্যমাত্রা',
    subDealerNetwork: 'সাব-ডিলার নেটওয়ার্ক মোডাল',

    // Delivery Rider Dashboard
    riderTitle: 'ডেলিভারি রাইডার ড্যাশবোর্ড (Delivery Rider Dashboard)',
    dutyStatus: 'ডিউটি স্ট্যাটাস',
    goOnline: 'অনলাইনে যান',
    goOffline: 'অফলাইনে যান',
    vehicleInfo: 'যানবাহন ও লাইসেন্স তথ্য',
    assignedUnionArea: 'নির্ধারিত কভারেজ এলাকা (উপজেলা/ইউনিয়ন)',
    completedDeliveries: 'সম্পন্ন ডেলিভারি',
    todayEarnings: 'আজকের আয় preview',

    // Actions & Buttons
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    close: 'বন্ধ করুন',
    edit: 'সম্পাদনা',
    delete: 'মুছে ফেলুন',
    confirm: 'নিশ্চিত করুন',
    filter: 'ফিল্টার',
    search: 'সন্ধান করুন',
    exportSql: 'SQL মাইগ্রেশন দেখুন',
    copied: 'অনুলিপি করা হয়েছে!'
  },
  en: {
    // Brand & Header
    companyName: 'TOMSHOPBD',
    tagline: 'Online Grocery, Shopping & Trusted E-Commerce Platform',
    searchPlaceholder: 'Search products, categories or services...',
    languageName: 'English',
    
    // Auth & Account
    login: 'Log In',
    register: 'Register',
    logout: 'Log Out',
    emailOrMobile: 'Email or Mobile Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    mobileNumber: 'Mobile Number',
    googleLogin: 'Continue with Google',
    phoneLogin: 'Log in with Phone OTP',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    enterOtp: 'Enter 4-digit OTP Code',
    sendOtp: 'Send OTP',
    verifyOtp: 'Verify OTP',
    
    // Profile & Address
    myProfile: 'My Profile',
    personalInfo: 'Personal Information',
    nationalId: 'National ID (NID)',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    serviceAddress: 'Mandatory Service & Delivery Address',
    division: 'Division',
    district: 'District',
    upazila: 'Upazila',
    union: 'Union',
    areaDetails: 'Road / House / Area Details',
    postalCode: 'Postal Code',
    saveProfile: 'Save Profile',
    
    // Status & KYC
    accountStatus: 'Account Status',
    active: 'Active',
    suspended: 'Suspended',
    banned: 'Banned',
    pending: 'Pending',
    kycStatus: 'KYC Verification Status',
    verified: 'Verified',
    unverified: 'Unverified',
    pendingKyc: 'KYC Pending',
    rejected: 'Rejected',
    submitKyc: 'Submit NID & KYC',
    nidFrontImage: 'NID Front Image',
    nidBackImage: 'NID Back Image',
    
    // Global Settings & Token
    tomokTokenBalance: 'TOMOK Token Balance',
    currency: 'Taka (৳)',
    timezone: 'Asia/Dhaka',
    systemRules: 'System & Security Rules',
    rlsSecurityActive: 'Row Level Security (RLS) Active',
    
    // Dashboard Common
    dashboard: 'Dashboard',
    switchRoleView: 'Switch Role Dashboard',
    notifications: 'Notifications',
    markAllAsRead: 'Mark All as Read',
    noNotifications: 'No new notifications',
    auditLogs: 'Audit Logs',
    globalSettings: 'Global Settings',
    
    // Super Admin Dashboard
    superAdminTitle: 'Super Admin Dashboard',
    platformOverview: 'Platform Overview',
    totalUsers: 'Total System Users',
    tomokReserve: 'TOMOK Token Reserve',
    activeRolesCount: 'Active User Role Distribution',
    systemHealth: 'System Health & Server Status',
    rlsPolicies: 'RLS Security Policies & Permission Matrix',
    databaseTables: 'Database Tables & Migrations',

    // Admin Dashboard
    adminTitle: 'Admin Dashboard',
    operationalCommand: 'Operational Command Center',
    kycQueue: 'KYC Verification Queue',
    pendingVendors: 'Pending Vendor Applications',
    regionalDistribution: 'Division & District Distribution',
    broadcastNotification: 'Send Bulk Notification',

    // Customer Dashboard
    customerTitle: 'Customer Dashboard',
    myOrdersPreview: 'My Orders & Token Rewards',
    mandateAddressInfo: 'Your primary service address must conform strictly to the BD administrative division structure.',
    securityAndSessions: 'Security & Active Sessions',
    
    // Vendor Dashboard
    vendorTitle: 'Vendor / Dealer Dashboard',
    shopDetails: 'Shop & Outlet Details',
    tradeLicense: 'Trade License Number',
    commissionTier: 'Commission Tier Status',
    outletAddress: 'Outlet Address & Coverage Zone',
    salesPipeline: 'Sales Pipeline & Commission Preview',

    // Operations Partner Dashboard
    partnerTitle: 'Operations Partner Dashboard',
    hubCode: 'Hub Code',
    coverageMatrix: 'Union Level Coverage Matrix',
    partnerQuota: 'Partner Quota & Targets',
    subDealerNetwork: 'Sub-Dealer Network Overview',

    // Delivery Rider Dashboard
    riderTitle: 'Delivery Rider Dashboard',
    dutyStatus: 'Duty Status',
    goOnline: 'Go Online',
    goOffline: 'Go Offline',
    vehicleInfo: 'Vehicle & License Information',
    assignedUnionArea: 'Assigned Coverage Area (Upazila/Union)',
    completedDeliveries: 'Completed Deliveries',
    todayEarnings: 'Today\'s Earnings Preview',

    // Actions & Buttons
    save: 'Save Changes',
    cancel: 'Cancel',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    filter: 'Filter',
    search: 'Search',
    exportSql: 'View SQL Migration',
    copied: 'Copied!'
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations.bn): string {
  const dict = translations[lang] || translations.bn;
  return dict[key] || translations.bn[key] || key;
}
