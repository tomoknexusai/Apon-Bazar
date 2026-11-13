/**
 * Role-Based Access Control (RBAC) Validation & Enforcement Engine
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import { UserRole, UserProfile, FIXED_SUPER_ADMIN_ID, FIXED_FOUNDER_ID } from '../types';

export { FIXED_SUPER_ADMIN_ID, FIXED_FOUNDER_ID };

/**
 * Checks if a given ID or profile is the fixed immutable Super Admin or Founder
 */
export function isImmutableSuperAdmin(userOrId: string | UserProfile | undefined | null): boolean {
  if (!userOrId) return false;
  if (typeof userOrId === 'string') {
    const clean = userOrId.trim().toUpperCase();
    return (
      clean === FIXED_SUPER_ADMIN_ID ||
      clean === FIXED_FOUNDER_ID ||
      clean === 'USR-SUPER-ADMIN-01' ||
      clean === 'USR-FOUNDER-01'
    );
  }
  const idMatch = (userOrId.id || '').toUpperCase();
  const permMatch = (userOrId.permanentMemberId || '').toUpperCase();
  return (
    idMatch === FIXED_SUPER_ADMIN_ID ||
    idMatch === FIXED_FOUNDER_ID ||
    idMatch === 'USR-SUPER-ADMIN-01' ||
    idMatch === 'USR-FOUNDER-01' ||
    permMatch === FIXED_SUPER_ADMIN_ID ||
    permMatch === FIXED_FOUNDER_ID ||
    userOrId.primaryRole === 'super_admin' ||
    userOrId.primaryRole === 'founder'
  );
}

/**
 * Validates that an operation cannot mutate or delete the immutable Super Admin or Founder
 */
export function validateSuperAdminImmutability(
  targetId: string,
  action: 'DELETE' | 'CHANGE_ROLE' | 'CHANGE_ID' | 'SUSPEND' | 'DEACTIVATE'
): { allowed: boolean; errorCode?: number; message?: string } {
  if (isImmutableSuperAdmin(targetId)) {
    return {
      allowed: false,
      errorCode: 403,
      message: `403 Security Exception: Executive ID '${targetId}' is immutable and protected by server-side RLS and security rules. Action '${action}' is strictly prohibited.`
    };
  }
  return { allowed: true };
}

/**
 * Role Permission Matrix
 * Maps each UserRole to the list of dashboard views they are permitted to access.
 */
export const ROLE_PERMISSIONS: Record<UserRole, UserRole[]> = {
  founder: [
    'founder',
    'super_admin',
    'admin',
    'district_admin',
    'account_officer',
    'finance',
    'finance_officer',
    'hr',
    'customer_networker',
    'customer',
    'network_member',
    'vendor_dealer_shop',
    'vendor',
    'dealer',
    'operations_partner',
    'operations_officer',
    'rider',
    'delivery_rider',
    'delivery_man'
  ],
  super_admin: [
    'founder',
    'super_admin',
    'admin',
    'district_admin',
    'account_officer',
    'finance',
    'finance_officer',
    'hr',
    'customer_networker',
    'customer',
    'network_member',
    'vendor_dealer_shop',
    'vendor',
    'dealer',
    'operations_partner',
    'operations_officer',
    'rider',
    'delivery_rider',
    'delivery_man'
  ],
  account_officer: ['account_officer', 'finance', 'finance_officer', 'customer'],
  finance: ['finance', 'finance_officer', 'account_officer', 'customer'],
  finance_officer: ['finance', 'finance_officer', 'account_officer', 'customer'],
  hr: ['hr', 'customer'],
  admin: ['admin', 'district_admin', 'customer'],
  district_admin: ['district_admin', 'admin', 'customer'],
  vendor_dealer_shop: ['vendor_dealer_shop', 'dealer', 'vendor', 'customer'],
  dealer: ['dealer', 'vendor', 'vendor_dealer_shop', 'customer'],
  vendor: ['vendor', 'dealer', 'vendor_dealer_shop', 'customer'],
  operations_partner: ['operations_partner', 'operations_officer', 'customer'],
  operations_officer: ['operations_officer', 'operations_partner', 'customer'],
  rider: ['rider', 'delivery_rider', 'delivery_man', 'customer'],
  delivery_rider: ['delivery_rider', 'delivery_man', 'rider', 'customer'],
  delivery_man: ['delivery_rider', 'delivery_man', 'rider', 'customer'],
  customer_networker: ['customer_networker', 'customer', 'network_member'],
  network_member: ['customer', 'network_member', 'customer_networker'],
  customer: ['customer', 'customer_networker']
};

/**
 * Normalizes role string to canonical UserRole
 */
export function normalizeUserRole(role: string | UserRole | undefined | null): UserRole {
  if (!role) return 'customer';
  const clean = role.toLowerCase().trim();
  if (
    clean === 'founder' ||
    clean === 'owner' ||
    clean === 'managing_director' ||
    clean === 'md'
  ) {
    return 'super_admin';
  }
  if (
    clean === 'super_admin' ||
    clean === 'super-admin' ||
    clean === 'superadmin' ||
    clean === 'super admin' ||
    clean === 'sadmin'
  ) {
    return 'super_admin';
  }
  if (
    clean === 'admin' ||
    clean === 'administrator' ||
    clean === 'system_admin' ||
    clean === 'sysadmin' ||
    clean === 'sub_admin'
  ) {
    return 'admin';
  }
  if (clean === 'district_admin' || clean === 'district-admin' || clean === 'district admin') {
    return 'district_admin';
  }
  if (
    clean === 'account_officer' ||
    clean === 'account-officer' ||
    clean === 'account officer' ||
    clean === 'accounts_officer'
  ) {
    return 'account_officer';
  }
  if (
    clean === 'finance' ||
    clean === 'finance_officer' ||
    clean === 'finance-officer' ||
    clean === 'accounts' ||
    clean === 'finance_manager' ||
    clean === 'accountant' ||
    clean === 'cfo' ||
    clean === 'finance & accounts officer'
  ) {
    return 'finance';
  }
  if (
    clean === 'hr' ||
    clean === 'human_resources' ||
    clean === 'human-resources' ||
    clean === 'hr_officer' ||
    clean === 'hr officer'
  ) {
    return 'hr';
  }
  if (
    clean === 'operations_partner' ||
    clean === 'operations-partner' ||
    clean === 'operations_officer' ||
    clean === 'operations-officer' ||
    clean === 'operations officer' ||
    clean === 'operation officer' ||
    clean === 'partner' ||
    clean === 'operations' ||
    clean === 'ops'
  ) {
    return clean === 'operations_officer' || clean === 'operations-officer' || clean === 'operations officer' || clean === 'operation officer'
      ? 'operations_officer'
      : 'operations_partner';
  }
  if (
    clean === 'rider'
  ) {
    return 'rider';
  }
  if (
    clean === 'delivery_man' ||
    clean === 'delivery-man' ||
    clean === 'delivery_rider' ||
    clean === 'delivery-rider' ||
    clean === 'delivery man' ||
    clean === 'delivery rider' ||
    clean === 'courier'
  ) {
    return 'delivery_rider';
  }
  if (
    clean === 'vendor_dealer_shop' ||
    clean === 'vendor-dealer-shop' ||
    clean === 'vds' ||
    clean === 'shop'
  ) {
    return 'vendor_dealer_shop';
  }
  if (
    clean === 'dealer' ||
    clean === 'distributor' ||
    clean === 'wholesaler'
  ) {
    return 'dealer';
  }
  if (
    clean === 'vendor' ||
    clean === 'seller' ||
    clean === 'merchant' ||
    clean === 'shopkeeper' ||
    clean === 'store_owner'
  ) {
    return 'vendor';
  }
  if (clean === 'customer_networker' || clean === 'customer-networker') {
    return 'customer_networker';
  }
  if (clean === 'network_member' || clean === 'network-member' || clean === 'network' || clean === 'member' || clean === 'affiliate') {
    return 'network_member';
  }
  if (clean === 'customer' || clean === 'user' || clean === 'client' || clean === 'general' || clean === 'buyer') {
    return 'customer';
  }
  return (clean as UserRole) || 'customer';
}

/**
 * Strict Role Priority Order:
 * Super Admin > Admin > Staff/Partners > Vendor/Dealer > Customer
 */
export const ROLE_PRIORITY_ORDER: UserRole[] = [
  'super_admin',
  'founder',
  'admin',
  'district_admin',
  'account_officer',
  'finance',
  'finance_officer',
  'hr',
  'operations_officer',
  'operations_partner',
  'rider',
  'delivery_rider',
  'delivery_man',
  'vendor_dealer_shop',
  'dealer',
  'vendor',
  'network_member',
  'customer_networker',
  'customer'
];

/**
 * Resolves the highest authority role for a user account.
 * Super Admin credentials or assigned roles will ALWAYS resolve to 'super_admin',
 * preventing accidental fallback to dealer/vendor dashboards.
 */
export function resolveUserHighestRole(
  roles?: (UserRole | string)[] | null,
  primaryRole?: UserRole | string | null,
  userId?: string | null
): UserRole {
  // If immutable Super Admin ID, immediately return 'super_admin'
  if (userId && (userId === FIXED_SUPER_ADMIN_ID || isImmutableSuperAdmin(userId))) {
    return 'super_admin';
  }

  const allRoles: string[] = [];
  if (primaryRole) allRoles.push(primaryRole);
  if (Array.isArray(roles)) allRoles.push(...roles);

  const normalized = allRoles.map((r) => normalizeUserRole(r));

  for (const prioritizedRole of ROLE_PRIORITY_ORDER) {
    if (normalized.includes(prioritizedRole)) {
      if (prioritizedRole === 'founder') return 'super_admin';
      return prioritizedRole;
    }
  }

  return 'customer';
}

/**
 * Determines specific Financial Access Level for RBAC
 */
export function getFinancialAccessLevel(role: UserRole | string | undefined | null): {
  level:
    | 'founder_full'
    | 'super_admin_full'
    | 'finance_officer_full'
    | 'district_admin_scoped'
    | 'operations_officer_scoped'
    | 'delivery_man_scoped'
    | 'seller_dealer_scoped'
    | 'customer_scoped';
  canAccessAllTabs: boolean;
  canApproveDisbursements: boolean;
  canMakeAdjustments: boolean;
  canViewCompanyTreasury: boolean;
  scopeDescriptionBn: string;
  scopeDescriptionEn: string;
} {
  const norm = normalizeUserRole(role);
  switch (norm) {
    case 'founder':
      return {
        level: 'founder_full',
        canAccessAllTabs: true,
        canApproveDisbursements: true,
        canMakeAdjustments: true,
        canViewCompanyTreasury: true,
        scopeDescriptionBn: 'ফাউন্ডার: সম্পূর্ণ কোম্পানি-ব্যাপী আর্থিক ডেটা, ট্রেজারি ও ব্যালেন্স শিট এক্সেস।',
        scopeDescriptionEn: 'Founder: Full company-wide financial access, treasury and balance sheet.'
      };
    case 'super_admin':
      return {
        level: 'super_admin_full',
        canAccessAllTabs: true,
        canApproveDisbursements: true,
        canMakeAdjustments: true,
        canViewCompanyTreasury: true,
        scopeDescriptionBn: 'সুপার অ্যাডমিন: পূর্ণ আর্থিক নিয়ন্ত্রণ ও সার্বিক মডিউল অনুমতি।',
        scopeDescriptionEn: 'Super Admin: Full financial control and universal module clearance.'
      };
    case 'account_officer':
    case 'finance':
    case 'finance_officer':
      return {
        level: 'finance_officer_full',
        canAccessAllTabs: true,
        canApproveDisbursements: true,
        canMakeAdjustments: true,
        canViewCompanyTreasury: true,
        scopeDescriptionBn: 'একাউন্ট অফিসার: অর্পিত দায়িত্ব অনুযায়ী পূর্ণ আর্থিক ও হিসাবরক্ষণ এক্সেস।',
        scopeDescriptionEn: 'Account Officer: Full financial ledger and treasury access.'
      };
    case 'district_admin':
    case 'admin':
      return {
        level: 'district_admin_scoped',
        canAccessAllTabs: false,
        canApproveDisbursements: false,
        canMakeAdjustments: false,
        canViewCompanyTreasury: false,
        scopeDescriptionBn: 'জেলা অ্যাডমিন: শুধুমাত্র নিজ জেলার বিক্রয়, কমিশন ও হাব সেটেলমেন্ট তথ্য প্রদর্শিত।',
        scopeDescriptionEn: 'District Admin: Scoped to assigned district sales, commissions & hub settlements.'
      };
    case 'operations_partner':
    case 'operations_officer':
      return {
        level: 'operations_officer_scoped',
        canAccessAllTabs: false,
        canApproveDisbursements: false,
        canMakeAdjustments: false,
        canViewCompanyTreasury: false,
        scopeDescriptionBn: 'অপারেশনস অফিসার: শুধুমাত্র নিজ উপজেলার অপারেশনাল ডেলিভারি ও সেটেলমেন্ট তথ্য প্রদর্শিত।',
        scopeDescriptionEn: 'Operations Officer: Scoped to own Upazila operational settlements.'
      };
    case 'rider':
    case 'delivery_rider':
    case 'delivery_man':
      return {
        level: 'delivery_man_scoped',
        canAccessAllTabs: false,
        canApproveDisbursements: false,
        canMakeAdjustments: false,
        canViewCompanyTreasury: false,
        scopeDescriptionBn: 'ডেলিভারি ম্যান: শুধুমাত্র নিজস্ব ক্যাশ কালেকশন, কমিশন ও সেটেলমেন্ট পে-আউট প্রদর্শিত।',
        scopeDescriptionEn: 'Delivery Man: Scoped to own COD collections and settlement payout history.'
      };
    case 'vendor_dealer_shop':
    case 'dealer':
    case 'vendor':
      return {
        level: 'seller_dealer_scoped',
        canAccessAllTabs: false,
        canApproveDisbursements: false,
        canMakeAdjustments: false,
        canViewCompanyTreasury: false,
        scopeDescriptionBn: 'সেলার/ডিলার: শুধুমাত্র নিজস্ব পণ্য বিক্রয়, ডিলার কমিশন ও পে-আউট সেটেলমেন্ট প্রদর্শিত।',
        scopeDescriptionEn: 'Seller/Dealer: Scoped to own store sales, commissions and vendor settlements.'
      };
    case 'hr':
    case 'customer_networker':
    case 'customer':
    default:
      return {
        level: 'customer_scoped',
        canAccessAllTabs: false,
        canApproveDisbursements: false,
        canMakeAdjustments: false,
        canViewCompanyTreasury: false,
        scopeDescriptionBn: 'কাস্টমার: শুধুমাত্র নিজস্ব অর্ডার পেমেন্ট, ইনভয়েস এবং রিফান্ড তথ্য প্রদর্শিত।',
        scopeDescriptionEn: 'Customer: Scoped to personal order payments and refund transactions.'
      };
  }
}

/**
 * Returns canonical browser URL path for a given role's dashboard
 */
export function getDashboardPathForRole(role: UserRole | string | undefined | null): string {
  if (!role) return '/';
  const norm = normalizeUserRole(role);
  switch (norm) {
    case 'founder':
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'admin':
    case 'district_admin':
      return '/admin/dashboard';
    case 'hr':
      return '/hr/dashboard';
    case 'vendor_dealer_shop':
    case 'dealer':
      return '/dealer/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'rider':
    case 'delivery_rider':
    case 'delivery_man':
      return '/delivery/dashboard';
    case 'operations_partner':
    case 'operations_officer':
      return '/operations/dashboard';
    case 'account_officer':
    case 'finance':
    case 'finance_officer':
      return '/finance/dashboard';
    case 'network_member':
      return '/network/dashboard';
    case 'customer_networker':
    case 'customer':
    default:
      return '/';
  }
}

/**
 * Returns formatted visible display name for a role
 */
export function getRoleVisibleName(role: UserRole | string | undefined | null, lang: 'bn' | 'en' = 'en'): string {
  if (!role) return lang === 'bn' ? 'কাস্টমার' : 'Customer';
  const norm = normalizeUserRole(role);
  switch (norm) {
    case 'founder':
      return lang === 'bn' ? 'ফাউন্ডার ও নির্বাহী পরিচালক' : 'Founder & Managing Director';
    case 'super_admin':
      return lang === 'bn' ? 'সুপার এডমিন' : 'Super Admin';
    case 'account_officer':
      return lang === 'bn' ? 'একাউন্ট অফিসার' : 'Account Officer';
    case 'finance':
    case 'finance_officer':
      return lang === 'bn' ? 'ফিন্যান্স ও অ্যাকাউন্টস অফিসার' : 'Finance & Accounts Officer';
    case 'hr':
      return lang === 'bn' ? 'এইচআর' : 'HR';
    case 'district_admin':
      return lang === 'bn' ? 'জেলা এডমিন' : 'District Admin';
    case 'admin':
      return lang === 'bn' ? 'এডমিন' : 'Admin';
    case 'operations_officer':
      return lang === 'bn' ? 'অপারেশন অফিসার' : 'Operation Officer';
    case 'operations_partner':
      return lang === 'bn' ? 'অপারেশনস পার্টনার' : 'Operations Partner';
    case 'rider':
      return lang === 'bn' ? 'রাইডার' : 'Rider';
    case 'delivery_rider':
    case 'delivery_man':
      return lang === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Man';
    case 'vendor_dealer_shop':
      return lang === 'bn' ? 'ভেন্ডর / ডিলার / শপ' : 'Vendor / Dealer / Shop';
    case 'dealer':
      return lang === 'bn' ? 'ডিলার' : 'Dealer';
    case 'vendor':
      return lang === 'bn' ? 'ভেন্ডর' : 'Vendor';
    case 'customer_networker':
      return lang === 'bn' ? 'কাস্টমার ও নেটওয়ার্কার' : 'Customer & Networker';
    case 'network_member':
      return lang === 'bn' ? 'নেটওয়ার্ক মেম্বার' : 'Network Active Member';
    case 'customer':
    default:
      return lang === 'bn' ? 'কাস্টমার' : 'Customer';
  }
}

/**
 * Validates whether a user with given roles is authorized to access a target dashboard role.
 * Both frontend UI and backend API/Context handlers use this validation logic.
 */
export function isRoleAuthorized(
  userRoles: UserRole[] | undefined,
  targetRole: UserRole
): boolean {
  if (!targetRole) return false;
  if (targetRole === 'customer') return true;
  if (!userRoles || !Array.isArray(userRoles) || userRoles.length === 0) {
    return false;
  }

  // Super admin has universal access to all dashboards
  if (userRoles.includes('super_admin')) {
    return true;
  }

  const normTarget = normalizeUserRole(targetRole);

  // Check if any of the user's assigned roles allow access to targetRole
  return userRoles.some((role) => {
    const normRole = normalizeUserRole(role);
    const allowed = ROLE_PERMISSIONS[normRole] || [];
    return (
      allowed.includes(normTarget) ||
      allowed.includes(targetRole) ||
      normRole === normTarget
    );
  });
}

/**
 * Returns all dashboard roles that a given user profile is permitted to view.
 */
export function getAllowedDashboardRoles(user: UserProfile | undefined | null): UserRole[] {
  if (!user || !user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    return ['customer'];
  }

  // If super_admin, return all roles
  if (user.roles?.includes('super_admin')) {
    return [
      'super_admin',
      'admin',
      'account_officer',
      'hr',
      'customer_networker',
      'customer',
      'network_member',
      'vendor_dealer_shop',
      'dealer',
      'vendor',
      'operations_officer',
      'operations_partner',
      'rider',
      'delivery_rider'
    ];
  }

  // Aggregate allowed roles from user's role list
  const allowedSet = new Set<UserRole>();
  (user.roles || []).forEach((role) => {
    const norm = normalizeUserRole(role);
    const allowed = ROLE_PERMISSIONS[norm] || ROLE_PERMISSIONS[role] || [];
    allowed.forEach((r) => allowedSet.add(r));
  });

  return Array.from(allowedSet);
}

/**
 * Backend API & Context Operation Guard
 * Validates role access and throws/returns structured error for unauthorized operations.
 */
export function validateBackendRoleAccess(
  user: UserProfile | undefined | null,
  requiredRole: UserRole
): { authorized: boolean; errorCode?: number; message?: string } {
  if (!user) {
    return {
      authorized: false,
      errorCode: 401,
      message: '401 Unauthorized: User session is required.'
    };
  }

  const authorized = isRoleAuthorized(user?.roles, requiredRole);
  if (!authorized) {
    return {
      authorized: false,
      errorCode: 403,
      message: `403 Forbidden: User role '${user?.primaryRole || 'customer'}' is not authorized to access '${requiredRole}' resource.`
    };
  }

  return { authorized: true };
}

/**
 * Strict RBAC Rule: Only Super Admin can view the complete Active User list.
 * Normal Admins, Dealers, Vendors, Operations Partners, Delivery Riders, and Customers are restricted.
 */
export function canAccessActiveUserList(user: UserProfile | undefined | null): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    return false;
  }
  return (user?.roles?.includes('super_admin') ?? false) || user?.primaryRole === 'super_admin';
}

/**
 * API & Context Level Enforcement Guard for Active User List.
 * Returns 403 Forbidden structured response if user is not Super Admin.
 */
export function validateActiveUsersAccess(
  user: UserProfile | undefined | null
): { authorized: boolean; errorCode?: number; message?: string } {
  if (!user) {
    return {
      authorized: false,
      errorCode: 401,
      message: '401 Unauthorized: User session is required to access user records.'
    };
  }

  if (!canAccessActiveUserList(user)) {
    return {
      authorized: false,
      errorCode: 403,
      message: `403 Forbidden: User role '${user?.primaryRole || 'customer'}' is NOT authorized to view the complete Active User list. Access restricted to Super Admin only.`
    };
  }

  return { authorized: true };
}

/**
 * Strict RBAC Rule: Only Super Admin can view, process, and manage Role Applications.
 * Customer, Member, Seller/Dealer, Delivery Man, Operations Officer, District Admin, Finance, Public, and Normal Admin are restricted.
 */
export const PERMISSION_VIEW_ROLE_APPLICATIONS = 'SUPER_ADMIN_ONLY';

export function canAccessRoleApplications(user: UserProfile | undefined | null): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles) || user.roles.length === 0) {
    return false;
  }
  const isSuper = (user?.roles?.includes('super_admin') ?? false) || user?.primaryRole === 'super_admin' || user?.id === FIXED_SUPER_ADMIN_ID;
  const isFounder = (user?.roles?.includes('founder') ?? false) || user?.primaryRole === 'founder' || user?.id === FIXED_FOUNDER_ID;
  return isSuper || isFounder;
}

/**
 * API & Context Level Enforcement Guard for Role Applications.
 * Returns 403 Forbidden structured response if user is not Super Admin.
 */
export function validateRoleApplicationsAccess(
  user: UserProfile | undefined | null
): { authorized: boolean; errorCode?: number; message?: string } {
  if (!user) {
    return {
      authorized: false,
      errorCode: 401,
      message: '401 Unauthorized: Super Admin session is required to access Role Applications.'
    };
  }

  if (!canAccessRoleApplications(user)) {
    return {
      authorized: false,
      errorCode: 403,
      message: `403 Forbidden: Access Denied. User role '${user?.primaryRole || 'guest'}' is NOT authorized to access the Role Application Management module. All applications are restricted to Super Admin only (VIEW_ROLE_APPLICATIONS = SUPER_ADMIN_ONLY).`
    };
  }

  return { authorized: true };
}

