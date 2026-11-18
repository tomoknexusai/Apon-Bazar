/**
 * Durable Server-Side General User Profile Store
 * Persists Super Admin, Admin, Customer, Network Member, Operations Partner,
 * Finance Officer, HR Officer, and any newly created general user profiles
 * atomically to `.data/general-users-store.json` with cross-process locking.
 *
 * Security & Integrity Guarantees:
 * - Never stores plaintext passwords or exposes passwordHash in API responses.
 * - Permanent IDs (`id`, `permanentMemberId`, `aponUniqueId`, `customerId`, `username`,
 *   `sponsorId`, `placementId`) remain immutable across profile edits.
 * - Enforces email/username uniqueness across the store (and optional external check).
 */

import fs from 'fs';
import path from 'path';
import type {
  AccountStatus,
  BusinessType,
  Gender,
  KycStatus,
  Language,
  ServiceAddress,
  UserProfile,
  UserRole
} from '../types';
import { createCrossProcessLock } from './fileLock';
import { isValidEmailAddress } from './companySettingsStore';
import { scryptHashPassword, scryptVerifyPassword } from './companyAccountsAuthStore';
import {
  getZoneById,
  getZoneByUpazila,
  resolveZoneFromNameOrText,
  type DeliveryZone
} from '../services/DeliveryZoneService';

export type StoredGeneralUserRecord = Omit<UserProfile, 'password'> & {
  accountStatus: AccountStatus;
  verificationStatus: KycStatus;
  languagePreference: Language;
  tomokTokenBalance: number;
  roles: UserRole[];
  primaryRole: UserRole;
  passwordHash?: string;
};

interface GeneralUsersStorePayload {
  version: number;
  updatedAt: string;
  users: StoredGeneralUserRecord[];
}

export interface GeneralExternalConflictCheck {
  hasEmailOrUsernameConflict?: (params: {
    username?: string;
    email?: string;
    excludeIds: string[];
  }) => Promise<{ conflictField?: 'username' | 'email'; message?: string } | null>;
}

export const FIXED_ROOT_SUPER_ADMIN_ID = 'AANO-SADMIN-001';

export function normalizeBdMobileServer(raw?: string): string {
  const digits = (raw || '').trim().replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880') && digits.length >= 13) return '0' + digits.slice(3, 13);
  if (digits.startsWith('880') && digits.length === 12) return '0' + digits.slice(3);
  if (digits.startsWith('1') && digits.length === 10) return '0' + digits;
  return digits;
}

function buildSeededGeneralUsers(): StoredGeneralUserRecord[] {
  const nowIso = '2026-01-01T00:00:00.000Z';
  return [
    {
      id: FIXED_ROOT_SUPER_ADMIN_ID,
      username: 'superadmin',
      email: 'khatibesdo@gmail.com',
      fullName: 'Mirza Khatib Uddin',
      mobileNumber: '01312480175',
      aponUniqueId: 'AponSA-000001',
      permanentMemberId: FIXED_ROOT_SUPER_ADMIN_ID,
      finalRole: 'super_admin',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      nationalId: '19922691234567891',
      dateOfBirth: '1990-01-15',
      gender: 'male',
      latitude: 26.0333,
      longitude: 88.4667,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 50000.0,
      roles: ['super_admin', 'founder'],
      primaryRole: 'super_admin',
      mandatoryAddress: {
        id: 'addr-sa-01',
        userId: FIXED_ROOT_SUPER_ADMIN_ID,
        title: 'হেডকোয়ার্টার্স / প্রধান সার্ভিস ঠিকানা',
        userType: 'customer',
        division: 'রংপুর',
        district: 'ঠাকুরগাঁও',
        upazila: 'ঠাকুরগাঁও সদর',
        unionName: 'হাজীপাড়া',
        area: 'কালীবাড়ী, হাজীপাড়া',
        postalCode: '5100',
        fullServiceAddress: 'কালীবাড়ী, হাজীপাড়া, হাজীপাড়া, ঠাকুরগাঁও সদর, ঠাকুরগাঁও, রংপুর',
        latitude: 26.0333,
        longitude: 88.4667,
        isMandatoryServiceAddress: true,
        createdAt: nowIso,
        updatedAt: nowIso
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: nowIso
    },
    {
      id: 'usr-admin-02',
      username: 'admin01',
      email: 'admin@aponbazar.com',
      fullName: 'তানজিনা রহমান (Admin)',
      mobileNumber: '+8801711000002',
      aponUniqueId: 'AponA-000001',
      permanentMemberId: 'AponA-000001',
      finalRole: 'admin',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      nationalId: '19942691234567892',
      dateOfBirth: '1994-05-20',
      gender: 'female',
      latitude: 23.7925,
      longitude: 90.4078,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 12500.0,
      roles: ['admin'],
      primaryRole: 'admin',
      mandatoryAddress: {
        id: 'addr-adm-02',
        userId: 'usr-admin-02',
        title: 'Admin Office',
        userType: 'customer',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'গুলশান',
        unionName: 'গুলশান-১',
        area: 'ব্লক বি, রোড ৫১',
        postalCode: '1212',
        fullServiceAddress: 'ব্লক বি, রোড ৫১, গুলশান-১, গুলশান, ঢাকা',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z'
      },
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z'
    },
    {
      id: 'usr-customer-03',
      username: 'customer01',
      customerId: 'AponCN-000001',
      email: 'customer@aponbazar.com',
      fullName: 'কাজী শফিকুল আলম (Customer)',
      mobileNumber: '+8801819000003',
      aponUniqueId: 'AponCN-000001',
      permanentMemberId: 'AponCN-000001',
      finalRole: 'customer_networker',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      nationalId: '19952691234567893',
      dateOfBirth: '1995-08-12',
      gender: 'male',
      latitude: 23.8103,
      longitude: 90.4125,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 850.5,
      roles: ['customer'],
      primaryRole: 'customer',
      isNetworkActive: false,
      mandatoryAddress: {
        id: 'addr-cust-03',
        userId: 'usr-customer-03',
        title: 'Home Address',
        userType: 'customer',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'উত্তরা',
        unionName: 'উত্তরা সেক্টর ৭',
        area: 'বাড়ি ৪৫, রোড ৩',
        postalCode: '1230',
        fullServiceAddress: 'বাড়ি ৪৫, রোড ৩, উত্তরা সেক্টর ৭, উত্তরা, ঢাকা',
        latitude: 23.8759,
        longitude: 90.3795,
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-05T00:00:00.000Z',
        updatedAt: '2026-01-05T00:00:00.000Z'
      },
      createdAt: '2026-01-05T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z'
    },
    {
      id: 'usr-network-07',
      username: 'network01',
      email: 'network@aponbazar.com',
      fullName: 'মোস্তফা কামাল (Network Active Member)',
      mobileNumber: '+8801819000007',
      aponUniqueId: 'AponCN-000002',
      permanentMemberId: 'AponCN-000002',
      finalRole: 'customer_networker',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
      nationalId: '19932691234567897',
      dateOfBirth: '1993-04-10',
      gender: 'male',
      latitude: 23.8103,
      longitude: 90.4125,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 2450.0,
      roles: ['network_member', 'customer'],
      primaryRole: 'network_member',
      isNetworkActive: true,
      sponsorId: 'AB-1000000001',
      mandatoryAddress: {
        id: 'addr-net-07',
        userId: 'usr-network-07',
        title: 'Residence',
        userType: 'customer',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'মিরপুর',
        unionName: 'মিরপুর-১',
        area: 'ব্লক এ, সড়ক ৫',
        postalCode: '1216',
        fullServiceAddress: 'ব্লক এ, সড়ক ৫, মিরপুর-১, মিরপুর, ঢাকা',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-07T00:00:00.000Z',
        updatedAt: '2026-01-07T00:00:00.000Z'
      },
      createdAt: '2026-01-07T00:00:00.000Z',
      updatedAt: '2026-01-07T00:00:00.000Z'
    },
    {
      id: 'usr-partner-05',
      username: 'partner01',
      email: 'partner@aponbazar.com',
      fullName: 'ফরিদা পারভীন (Operations Partner)',
      mobileNumber: '+8801611000005',
      aponUniqueId: 'AponOO-000001',
      permanentMemberId: 'AponOO-000001',
      finalRole: 'operations_officer',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      nationalId: '19912691234567895',
      dateOfBirth: '1991-03-30',
      gender: 'female',
      latitude: 24.3636,
      longitude: 88.6241,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 7500.0,
      roles: ['operations_partner'],
      primaryRole: 'operations_partner',
      mandatoryAddress: {
        id: 'addr-part-05',
        userId: 'usr-partner-05',
        title: 'Regional Hub',
        userType: 'operations_partner',
        division: 'রাজশাহী',
        district: 'রাজশাহী',
        upazila: 'বোয়ালিয়া',
        unionName: 'সাহেব বাজার',
        area: 'হাব ভবন ৩য় তলা',
        postalCode: '6000',
        fullServiceAddress: 'হাব ভবন ৩য় তলা, সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-12T00:00:00.000Z',
        updatedAt: '2026-01-12T00:00:00.000Z'
      },
      createdAt: '2026-01-12T00:00:00.000Z',
      updatedAt: '2026-01-12T00:00:00.000Z'
    },
    {
      id: 'usr-finance-09',
      username: 'finance01',
      email: 'finance@aponbazar.com',
      fullName: 'আহমেদ জুবায়ের (Account Officer)',
      mobileNumber: '01719998877',
      aponUniqueId: 'AponAO-000001',
      permanentMemberId: 'AponAO-000001',
      finalRole: 'account_officer',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=250',
      nationalId: '19892691234567890',
      dateOfBirth: '1989-11-25',
      gender: 'male',
      latitude: 23.7925,
      longitude: 90.4078,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 35000.0,
      roles: ['finance', 'customer'],
      primaryRole: 'finance',
      mandatoryAddress: {
        id: 'addr-fin-09',
        userId: 'usr-finance-09',
        title: 'Finance & Treasury Headquarters',
        userType: 'customer',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'গুলশান',
        unionName: 'গুলশান-২',
        area: 'ট্রেজারি টাওয়ার, রোড ৪৪',
        postalCode: '1212',
        fullServiceAddress: 'ট্রেজারি টাওয়ার, রোড ৪৪, গুলশান-২, গুলশান, ঢাকা',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-20T00:00:00.000Z',
        updatedAt: '2026-01-20T00:00:00.000Z'
      },
      createdAt: '2026-01-20T00:00:00.000Z',
      updatedAt: '2026-01-20T00:00:00.000Z'
    },
    {
      id: 'usr-hr-10',
      username: 'hr01',
      email: 'hr@aponbazar.com',
      fullName: 'মাহবুবা আক্তার (HR Officer)',
      mobileNumber: '01819887766',
      aponUniqueId: 'AponHR-000001',
      permanentMemberId: 'AponHR-000001',
      finalRole: 'hr',
      profilePhotoUrl:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
      nationalId: '19932691234567891',
      dateOfBirth: '1993-02-14',
      gender: 'female',
      latitude: 23.7925,
      longitude: 90.4078,
      languagePreference: 'bn',
      accountStatus: 'active',
      verificationStatus: 'verified',
      tomokTokenBalance: 22000.0,
      roles: ['hr', 'customer'],
      primaryRole: 'hr',
      mandatoryAddress: {
        id: 'addr-hr-10',
        userId: 'usr-hr-10',
        title: 'Human Resources Department',
        userType: 'customer',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'গুলশান',
        unionName: 'গুলশান-২',
        area: 'ট্যালেন্ট হাউস, রোড ৩৮',
        postalCode: '1212',
        fullServiceAddress: 'ট্যালেন্ট হাউস, রোড ৩৮, গুলশান-২, গুলশান, ঢাকা',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-22T00:00:00.000Z',
        updatedAt: '2026-01-22T00:00:00.000Z'
      },
      createdAt: '2026-01-22T00:00:00.000Z',
      updatedAt: '2026-01-22T00:00:00.000Z'
    }
  ];
}

function sanitizeGeneralUser(user: any): StoredGeneralUserRecord {
  const { passwordHash: _ph, password: _pw, ...rest } = user || {};
  return rest as StoredGeneralUserRecord;
}

export function createGeneralUsersProfileStore(
  customStorePath?: string,
  externalCheck?: GeneralExternalConflictCheck
) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'general-users-store.json');
  const runWithCrossProcessLock = createCrossProcessLock(storePath);

  function writeAtomicSync(payload: GeneralUsersStorePayload): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
  }

  function loadRawStore(): GeneralUsersStorePayload {
    const seeds = buildSeededGeneralUsers();
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<GeneralUsersStorePayload>;
        if (Array.isArray(parsed?.users)) {
          return {
            version: parsed.version || 1,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            users: parsed.users as StoredGeneralUserRecord[]
          };
        }
      } catch (err) {
        console.error('[GeneralUsersProfileStore] Failed reading raw store, recreating seeds:', err);
      }
    }

    const initial: GeneralUsersStorePayload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      users: seeds
    };
    writeAtomicSync(initial);
    return initial;
  }

  function loadStore(): GeneralUsersStorePayload {
    const rawPayload = loadRawStore();
    return {
      ...rawPayload,
      users: rawPayload.users.map(sanitizeGeneralUser)
    };
  }

  function matchesUserIdentifier(u: StoredGeneralUserRecord, rawId: string): boolean {
    const clean = (rawId || '').trim().toLowerCase();
    if (!clean) return false;
    // Legacy alias usr-finance-01 -> usr-finance-09
    const normalized = clean === 'usr-finance-01' ? 'usr-finance-09' : clean;
    return (
      u.id.toLowerCase() === normalized ||
      (u.permanentMemberId || '').toLowerCase() === normalized ||
      (u.aponUniqueId || '').toLowerCase() === normalized ||
      (u.customerId || '').toLowerCase() === normalized ||
      (u.username || '').toLowerCase() === normalized
    );
  }

  function mergeAddress(
    existing: ServiceAddress | undefined,
    incoming: Partial<ServiceAddress> | undefined,
    userId: string,
    defaultUserType: ServiceAddress['userType'] = 'customer'
  ): ServiceAddress | undefined {
    if (!incoming) return existing;
    const nowIso = new Date().toISOString();
    const base: ServiceAddress = existing || {
      id: incoming.id || `addr-${userId}`,
      userId,
      title: incoming.title || 'Service Address',
      userType: incoming.userType || defaultUserType,
      division: incoming.division || '',
      district: incoming.district || '',
      upazila: incoming.upazila || '',
      unionName: incoming.unionName || '',
      area: incoming.area || '',
      postalCode: incoming.postalCode || '',
      isMandatoryServiceAddress: true,
      createdAt: incoming.createdAt || nowIso,
      updatedAt: nowIso
    };
    const merged: ServiceAddress = {
      ...base,
      ...incoming,
      id: existing?.id || incoming.id || base.id,
      userId,
      isMandatoryServiceAddress:
        incoming.isMandatoryServiceAddress ?? base.isMandatoryServiceAddress ?? true,
      createdAt: existing?.createdAt || base.createdAt,
      updatedAt: nowIso
    };
    const hasExplicitFull =
      typeof incoming.fullServiceAddress === 'string' && incoming.fullServiceAddress.trim().length > 0;
    if (!hasExplicitFull || !merged.fullServiceAddress) {
      const parts = [
        merged.houseNo,
        merged.roadNo,
        merged.area,
        merged.ward,
        merged.unionName,
        merged.upazila,
        merged.district,
        merged.division
      ]
        .map((p) => (p || '').trim())
        .filter(Boolean);
      if (parts.length > 0) {
        merged.fullServiceAddress = merged.postalCode
          ? `${parts.join(', ')} (${merged.postalCode})`
          : parts.join(', ');
      }
    }
    return merged;
  }

  return {
    getStorePath: () => storePath,

    listSanitized: async (): Promise<StoredGeneralUserRecord[]> => {
      return runWithCrossProcessLock(() => {
        return loadStore().users.map(sanitizeGeneralUser);
      });
    },

    findById: async (idOrMemberId: string): Promise<StoredGeneralUserRecord | null> => {
      return runWithCrossProcessLock(() => {
        const payload = loadStore();
        const found = payload.users.find((u) => matchesUserIdentifier(u, idOrMemberId));
        return found ? sanitizeGeneralUser(found) : null;
      });
    },

    findByMobile: async (mobile: string): Promise<StoredGeneralUserRecord | null> => {
      return runWithCrossProcessLock(() => {
        const norm = normalizeBdMobileServer(mobile);
        if (!norm || norm.length < 10) return null;
        const payload = loadStore();
        const found = payload.users.find(
          (u) => normalizeBdMobileServer(u.mobileNumber) === norm
        );
        return found ? sanitizeGeneralUser(found) : null;
      });
    },

    authenticateGeneralUser: async (
      identifier: string,
      password: string
    ): Promise<{
      matchedAccountRecord: boolean;
      authenticated: boolean;
      statusCode: number;
      message: string;
      account?: StoredGeneralUserRecord;
    }> => {
      return runWithCrossProcessLock(() => {
        const clean = (identifier || '').trim();
        if (!clean) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 404,
            message: 'Empty identifier.'
          };
        }
        const lower = clean.toLowerCase();
        const normMob = normalizeBdMobileServer(clean);
        const payload = loadRawStore();

        const idx = payload.users.findIndex((u) => {
          if (matchesUserIdentifier(u, clean)) return true;
          if (u.email && u.email.trim().toLowerCase() === lower) return true;
          if (normMob.length >= 10 && normalizeBdMobileServer(u.mobileNumber) === normMob) return true;
          return false;
        });

        if (idx === -1) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 404,
            message: 'General account not found.'
          };
        }

        const match = payload.users[idx];
        if (match.accountStatus !== 'active') {
          return {
            matchedAccountRecord: true,
            authenticated: false,
            statusCode: 403,
            message: 'আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় বা সাসপেন্ড রয়েছে।'
          };
        }

        // Known seeded default passwords for privileged demo accounts when passwordHash isn't initialized yet
        const defaultCredentialById: Record<string, string> = {
          [FIXED_ROOT_SUPER_ADMIN_ID]: 'Admin@2026',
          'usr-finance-09': 'Finance@2026',
          'usr-hr-10': 'Hr@2026'
        };
        const expectedSeedPass = defaultCredentialById[match.id];

        if (match.passwordHash) {
          if (!password || !scryptVerifyPassword(password, match.passwordHash)) {
            return {
              matchedAccountRecord: true,
              authenticated: false,
              statusCode: 401,
              message: 'লগইন আইডি বা পাসওয়ার্ড সঠিক নয়!'
            };
          }
        } else if (expectedSeedPass) {
          if (!password || password.trim() !== expectedSeedPass) {
            return {
              matchedAccountRecord: true,
              authenticated: false,
              statusCode: 401,
              message: 'লগইন আইডি বা পাসওয়ার্ড সঠিক নয়!'
            };
          }
        }

        const nowIso = new Date().toISOString();
        const updated: StoredGeneralUserRecord = {
          ...match,
          ...(expectedSeedPass && !match.passwordHash
            ? { passwordHash: scryptHashPassword(expectedSeedPass) }
            : {}),
          lastLogin: nowIso
        };
        const nextUsers = [...payload.users];
        nextUsers[idx] = updated;
        writeAtomicSync({
          version: payload.version,
          updatedAt: nowIso,
          users: nextUsers
        });

        return {
          matchedAccountRecord: true,
          authenticated: true,
          statusCode: 200,
          message: 'লগইন সফল হয়েছে।',
          account: sanitizeGeneralUser(updated)
        };
      });
    },

    hasCredentialConflict: async (params: {
      username?: string;
      email?: string;
      excludeId?: string;
    }): Promise<'username' | 'email' | null> => {
      return runWithCrossProcessLock(() => {
        const payload = loadStore();
        const ex = (params.excludeId || '').trim();
        if (params.username) {
          const uLower = params.username.trim().toLowerCase();
          if (
            payload.users.some(
              (u) =>
                (!ex || !matchesUserIdentifier(u, ex)) &&
                (u.username || '').trim().toLowerCase() === uLower
            )
          ) {
            return 'username';
          }
        }
        if (params.email) {
          const eLower = params.email.trim().toLowerCase();
          if (
            payload.users.some(
              (u) =>
                (!ex || !matchesUserIdentifier(u, ex)) &&
                (u.email || '').trim().toLowerCase() === eLower
            )
          ) {
            return 'email';
          }
        }
        return null;
      });
    },

    updateProfile: async (params: {
      targetId: string;
      allowAdminFields?: boolean;
      updates: {
        fullName?: string;
        email?: string;
        mobileNumber?: string;
        profilePhotoUrl?: string;
        nationalId?: string;
        dateOfBirth?: string;
        gender?: Gender;
        latitude?: number;
        longitude?: number;
        languagePreference?: Language;
        shopName?: string;
        businessType?: BusinessType;
        tradeLicenseBusinessName?: string;
        tradeLicenseNumber?: string;
        dealerOwnerName?: string;
        zoneId?: string;
        zoneName?: string;
        vehicleType?: string;
        vehicleRegNumber?: string;
        motorcycleModel?: string;
        drivingLicenseNumber?: string;
        mandatoryAddress?: Partial<ServiceAddress>;
        // Super Admin controlled fields
        roles?: UserRole[];
        primaryRole?: UserRole;
        accountStatus?: AccountStatus;
        verificationStatus?: KycStatus;
        username?: string;
      };
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      user?: StoredGeneralUserRecord;
    }> => {
      return runWithCrossProcessLock(async () => {
        const payload = loadStore();
        const idx = payload.users.findIndex((u) => matchesUserIdentifier(u, params.targetId));
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'ব্যবহারকারীর প্রোফাইল ডাটাবেসে খুঁজে পাওয়া যায়নি।'
          };
        }

        const existing = payload.users[idx];
        const up = params.updates || {};

        // Validate fullName if provided
        const nextFullName =
          up.fullName !== undefined ? String(up.fullName).trim() : existing.fullName;
        if (!nextFullName) {
          return {
            success: false,
            statusCode: 400,
            message: 'পূর্ণ নাম (Full Name) খালি রাখা যাবে না।'
          };
        }

        // Validate email if provided
        const nextEmail =
          up.email !== undefined ? String(up.email).trim().toLowerCase() : existing.email;
        if (!nextEmail || !isValidEmailAddress(nextEmail)) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক ও বৈধ ইমেইল ঠিকানা প্রদান করুন।'
          };
        }

        // Validate mobileNumber if provided
        let nextMobile = existing.mobileNumber;
        if (up.mobileNumber !== undefined) {
          const rawMob = String(up.mobileNumber).trim();
          const norm = normalizeBdMobileServer(rawMob);
          if (!norm || norm.length < 11) {
            return {
              success: false,
              statusCode: 400,
              message: 'সঠিক ১১ ডিজিটের বাংলাদেশ মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।'
            };
          }
          nextMobile = norm;
        }

        const nextUsername =
          params.allowAdminFields && up.username !== undefined
            ? String(up.username).trim()
            : existing.username;

        // Protect Super Admin immutability
        const isTargetSuperAdmin =
          existing.id === FIXED_ROOT_SUPER_ADMIN_ID ||
          existing.primaryRole === 'super_admin' ||
          existing.roles.includes('super_admin');

        if (params.allowAdminFields && existing.id === FIXED_ROOT_SUPER_ADMIN_ID) {
          if (up.primaryRole && up.primaryRole !== 'super_admin') {
            return {
              success: false,
              statusCode: 403,
              message: `Super Admin ID '${FIXED_ROOT_SUPER_ADMIN_ID}' is immutable and role cannot be altered or downgraded.`
            };
          }
          if (up.accountStatus && up.accountStatus !== 'active') {
            return {
              success: false,
              statusCode: 403,
              message: 'Super Admin account cannot be deactivated, suspended or banned.'
            };
          }
        }

        if (params.allowAdminFields && isTargetSuperAdmin) {
          const activeSuperAdmins = payload.users.filter(
            (u) =>
              (u.primaryRole === 'super_admin' || u.roles.includes('super_admin')) &&
              u.accountStatus === 'active'
          );
          const disabling =
            (up.accountStatus && up.accountStatus !== 'active') ||
            (up.primaryRole && up.primaryRole !== 'super_admin');
          if (disabling && activeSuperAdmins.length <= 1) {
            return {
              success: false,
              statusCode: 403,
              message: 'সিস্টেমের একমাত্র সক্রিয় সুপার এডমিন অ্যাকাউন্টটি নিষ্ক্রিয় বা ডাউনগ্রেড করা যাবে না।'
            };
          }
        }

        // Uniqueness checks inside general store
        const excludeIds = [
          existing.id,
          existing.permanentMemberId || '',
          existing.aponUniqueId || '',
          existing.customerId || ''
        ].filter(Boolean);

        if (
          payload.users.some(
            (u) =>
              u.id !== existing.id &&
              u.email &&
              u.email.trim().toLowerCase() === nextEmail
          )
        ) {
          return {
            success: false,
            statusCode: 409,
            message: `ইমেইল '${nextEmail}' ইতিমধ্যেই অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।`
          };
        }

        if (
          nextUsername &&
          payload.users.some(
            (u) =>
              u.id !== existing.id &&
              u.username &&
              u.username.trim().toLowerCase() === nextUsername.toLowerCase()
          )
        ) {
          return {
            success: false,
            statusCode: 409,
            message: `লগইন আইডি '${nextUsername}' ইতিমধ্যেই ব্যবহৃত হচ্ছে।`
          };
        }

        if (externalCheck?.hasEmailOrUsernameConflict) {
          const ext = await externalCheck.hasEmailOrUsernameConflict({
            email: nextEmail,
            username: nextUsername,
            excludeIds
          });
          if (ext) {
            return {
              success: false,
              statusCode: 409,
              message:
                ext.message ||
                (ext.conflictField === 'username'
                  ? `লগইন আইডি '${nextUsername}' ইতিমধ্যেই ব্যবহৃত হচ্ছে।`
                  : `ইমেইল '${nextEmail}' ইতিমধ্যেই অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।`)
            };
          }
        }

        const nowIso = new Date().toISOString();
        const defaultUserType: ServiceAddress['userType'] =
          existing.primaryRole === 'delivery_rider'
            ? 'delivery_rider'
            : existing.primaryRole === 'operations_partner'
            ? 'operations_partner'
            : existing.primaryRole === 'vendor' || existing.primaryRole === 'dealer'
            ? 'vendor'
            : 'customer';

        const nextAddress = mergeAddress(
          existing.mandatoryAddress,
          up.mandatoryAddress,
          existing.id,
          defaultUserType
        );

        const isVendorOrDealerUser =
          existing.primaryRole === 'dealer' ||
          existing.primaryRole === 'vendor' ||
          existing.primaryRole === 'vendor_dealer_shop' ||
          existing.roles.includes('dealer') ||
          existing.roles.includes('vendor');

        let nextZoneId =
          up.zoneId !== undefined ? String(up.zoneId).trim() : existing.zoneId;
        let nextZoneName =
          up.zoneName !== undefined ? String(up.zoneName).trim() : existing.zoneName;
        let finalAddress = nextAddress;

        if (isVendorOrDealerUser || up.zoneId !== undefined || up.zoneName !== undefined) {
          const cleanIncId = up.zoneId !== undefined ? String(up.zoneId).trim() : undefined;
          const cleanIncName = up.zoneName !== undefined ? String(up.zoneName).trim() : undefined;
          const addrGeoChanged = Boolean(
            up.mandatoryAddress &&
              ((up.mandatoryAddress.division !== undefined &&
                up.mandatoryAddress.division.trim() !== (existing.mandatoryAddress?.division || '').trim()) ||
                (up.mandatoryAddress.district !== undefined &&
                  up.mandatoryAddress.district.trim() !== (existing.mandatoryAddress?.district || '').trim()) ||
                (up.mandatoryAddress.upazila !== undefined &&
                  up.mandatoryAddress.upazila.trim() !== (existing.mandatoryAddress?.upazila || '').trim()))
          );

          let resolvedZone: DeliveryZone | undefined;
          if (cleanIncId && cleanIncId !== existing.zoneId) {
            resolvedZone = getZoneById(cleanIncId) || resolveZoneFromNameOrText(cleanIncId);
            if (!resolvedZone) {
              return {
                success: false,
                statusCode: 400,
                message: `নির্বাচিত জোন আইডি '${cleanIncId}' সঠিক নয়। অনুগ্রহ করে তালিকা থেকে সঠিক জোন নির্বাচন করুন।`
              };
            }
          } else if (cleanIncName && cleanIncName !== existing.zoneName && !addrGeoChanged) {
            resolvedZone = resolveZoneFromNameOrText(cleanIncName);
          } else if (cleanIncId && !addrGeoChanged) {
            resolvedZone = getZoneById(cleanIncId) || resolveZoneFromNameOrText(cleanIncId);
          } else if (addrGeoChanged && finalAddress) {
            resolvedZone = getZoneByUpazila(finalAddress.upazila, finalAddress.district, finalAddress.division);
          }

          if (resolvedZone) {
            nextZoneId = resolvedZone.zone_id;
            nextZoneName = `${resolvedZone.zone_name_bn} (${resolvedZone.zone_name})`;
            if (finalAddress) {
              const refreshGeo = !addrGeoChanged || Boolean(cleanIncId && cleanIncId !== existing.zoneId);
              finalAddress = {
                ...finalAddress,
                division: refreshGeo ? resolvedZone.division_name : finalAddress.division,
                district: refreshGeo ? resolvedZone.district_name : finalAddress.district,
                upazila: refreshGeo ? resolvedZone.upazila_name : finalAddress.upazila,
                updatedAt: nowIso
              };
            }
          }
        }

        const updated: StoredGeneralUserRecord = {
          ...existing,
          // Preserve immutable IDs & hierarchy
          id: existing.id,
          permanentMemberId: existing.permanentMemberId,
          aponUniqueId: existing.aponUniqueId,
          customerId: existing.customerId,
          binaryCompanyId: existing.binaryCompanyId,
          sponsorId: existing.sponsorId,
          referralId: existing.referralId,
          placementId: existing.placementId,
          placementLeg: existing.placementLeg,
          placementLevel: existing.placementLevel,
          tomokTokenBalance: existing.tomokTokenBalance,
          createdAt: existing.createdAt,
          // Editable profile fields
          fullName: nextFullName,
          email: nextEmail,
          mobileNumber: nextMobile,
          profilePhotoUrl:
            up.profilePhotoUrl !== undefined
              ? String(up.profilePhotoUrl).trim()
              : existing.profilePhotoUrl,
          nationalId:
            up.nationalId !== undefined ? String(up.nationalId).trim() : existing.nationalId,
          dateOfBirth:
            up.dateOfBirth !== undefined ? String(up.dateOfBirth).trim() : existing.dateOfBirth,
          gender: up.gender !== undefined ? up.gender : existing.gender,
          latitude:
            up.mandatoryAddress?.latitude ?? up.latitude ?? existing.latitude,
          longitude:
            up.mandatoryAddress?.longitude ?? up.longitude ?? existing.longitude,
          languagePreference: up.languagePreference ?? existing.languagePreference,
          shopName: up.shopName !== undefined ? String(up.shopName).trim() : existing.shopName,
          businessType: up.businessType ?? existing.businessType,
          tradeLicenseBusinessName:
            up.tradeLicenseBusinessName !== undefined
              ? String(up.tradeLicenseBusinessName).trim()
              : existing.tradeLicenseBusinessName,
          tradeLicenseNumber:
            up.tradeLicenseNumber !== undefined
              ? String(up.tradeLicenseNumber).trim()
              : existing.tradeLicenseNumber,
          dealerOwnerName:
            up.dealerOwnerName !== undefined
              ? String(up.dealerOwnerName).trim()
              : existing.dealerOwnerName,
          zoneId: nextZoneId,
          zoneName: nextZoneName,
          vehicleType:
            up.vehicleType !== undefined ? String(up.vehicleType).trim() : existing.vehicleType,
          vehicleRegNumber:
            up.vehicleRegNumber !== undefined
              ? String(up.vehicleRegNumber).trim()
              : existing.vehicleRegNumber,
          motorcycleModel:
            up.motorcycleModel !== undefined
              ? String(up.motorcycleModel).trim()
              : existing.motorcycleModel,
          drivingLicenseNumber:
            up.drivingLicenseNumber !== undefined
              ? String(up.drivingLicenseNumber).trim()
              : existing.drivingLicenseNumber,
          mandatoryAddress: finalAddress,
          // Admin-only fields
          username: nextUsername,
          roles:
            params.allowAdminFields && Array.isArray(up.roles) && up.roles.length > 0
              ? existing.id === FIXED_ROOT_SUPER_ADMIN_ID
                ? Array.from(new Set<UserRole>(['super_admin', ...up.roles]))
                : up.roles
              : existing.roles,
          primaryRole:
            params.allowAdminFields && up.primaryRole
              ? existing.id === FIXED_ROOT_SUPER_ADMIN_ID
                ? 'super_admin'
                : up.primaryRole
              : existing.primaryRole,
          accountStatus:
            params.allowAdminFields && up.accountStatus
              ? existing.id === FIXED_ROOT_SUPER_ADMIN_ID
                ? 'active'
                : up.accountStatus
              : existing.accountStatus,
          verificationStatus:
            params.allowAdminFields && up.verificationStatus
              ? up.verificationStatus
              : existing.verificationStatus,
          updatedAt: nowIso
        };

        const rawPayload = loadRawStore();
        const nextUsers = [...rawPayload.users];
        // Preserve passwordHash if present on raw stored record
        nextUsers[idx] = {
          ...updated,
          ...(rawPayload.users[idx]?.passwordHash
            ? { passwordHash: rawPayload.users[idx].passwordHash }
            : {})
        };
        writeAtomicSync({
          version: rawPayload.version,
          updatedAt: nowIso,
          users: nextUsers
        });

        return {
          success: true,
          statusCode: 200,
          message: `প্রোফাইল '${updated.fullName}' সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে!`,
          user: sanitizeGeneralUser(updated)
        };
      });
    },

    deleteBySuperAdmin: async (targetId: string): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
    }> => {
      return runWithCrossProcessLock(() => {
        if (
          targetId === FIXED_ROOT_SUPER_ADMIN_ID ||
          targetId === 'usr-super-admin-01'
        ) {
          return {
            success: false,
            statusCode: 403,
            message: `SECURITY EXCEPTION: Super Admin ID '${FIXED_ROOT_SUPER_ADMIN_ID}' is permanent and immutable. It CANNOT be deleted from the database under any circumstances.`
          };
        }

        const payload = loadStore();
        const idx = payload.users.findIndex((u) => matchesUserIdentifier(u, targetId));
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'User not found.'
          };
        }

        const target = payload.users[idx];
        const isTargetSA =
          target.primaryRole === 'super_admin' || target.roles.includes('super_admin');
        if (isTargetSA) {
          const activeSA = payload.users.filter(
            (u) =>
              (u.primaryRole === 'super_admin' || u.roles.includes('super_admin')) &&
              u.accountStatus === 'active'
          );
          if (activeSA.length <= 1) {
            return {
              success: false,
              statusCode: 403,
              message: 'সিস্টেমের একমাত্র সক্রিয় সুপার এডমিন অ্যাকাউন্টটি মুছে ফেলা যাবে না।'
            };
          }
        }

        const nextUsers = payload.users.filter((_, i) => i !== idx);
        writeAtomicSync({
          version: payload.version,
          updatedAt: new Date().toISOString(),
          users: nextUsers
        });

        return {
          success: true,
          statusCode: 200,
          message: `User '${target.fullName}' (${target.id}) successfully deleted from database.`
        };
      });
    }
  };
}

export const defaultGeneralUsersProfileStore = createGeneralUsersProfileStore();
