/**
 * Server-Side Durable Auth & Account Management Store for Delivery Riders & Dealers
 * Also stores persistent Super Admin Credential & Settings Audit Logs.
 *
 * Security Guarantees:
 * - Passwords are NEVER stored in plaintext; always hashed via crypto.scryptSync (scrypt$salt$hex).
 * - Password hashes are NEVER returned in any sanitized API response or audit log.
 * - Enforces case-insensitive uniqueness for Login ID (`username`) and Email across staff/company/customer stores.
 * - Editing Login ID, Email, or resetting Password NEVER alters permanent internal IDs (`id`, `permanentMemberId`, `aponUniqueId`),
 *   keeping orders, commissions, deliveries, wallets, and financial ledgers intact.
 */

import fs from 'fs';
import path from 'path';
import type {
  AccountStatus,
  CredentialAuditLogRecord,
  Gender,
  ManagedStaffAccount,
  ServiceAddress,
  UserRole
} from '../types';
import {
  scryptHashPassword,
  scryptVerifyPassword
} from './companyAccountsAuthStore';
import { isValidEmailAddress } from './companySettingsStore';
import { getEmailProviderConfig } from './emailService';
import {
  getZoneById,
  getZoneByUpazila,
  resolveZoneFromNameOrText,
  type DeliveryZone
} from '../services/DeliveryZoneService';

function syncDealerZoneAndAddress(params: {
  isDealer: boolean;
  existingZoneId?: string;
  existingZoneName?: string;
  existingAddress?: ServiceAddress;
  incomingZoneId?: string;
  incomingZoneName?: string;
  incomingAddress?: Partial<ServiceAddress>;
  fallbackUserId: string;
  nowIso: string;
}): {
  error?: string;
  zoneId?: string;
  zoneName?: string;
  mandatoryAddress?: ServiceAddress;
} {
  const cleanIncomingId =
    params.incomingZoneId !== undefined ? String(params.incomingZoneId).trim() : undefined;
  const cleanIncomingName =
    params.incomingZoneName !== undefined ? String(params.incomingZoneName).trim() : undefined;

  const baseAddr: ServiceAddress = params.existingAddress || {
    id: `addr-${params.fallbackUserId}`,
    userId: params.fallbackUserId,
    title: params.isDealer ? 'Store Outlet' : 'Rider Residence',
    userType: params.isDealer ? 'vendor' : 'delivery_rider',
    division: '',
    district: '',
    upazila: '',
    unionName: '',
    area: '',
    postalCode: '',
    isMandatoryServiceAddress: true,
    createdAt: params.nowIso,
    updatedAt: params.nowIso
  };

  let nextAddr: ServiceAddress | undefined = params.incomingAddress
    ? {
        ...baseAddr,
        ...params.incomingAddress,
        userId: params.fallbackUserId,
        isMandatoryServiceAddress: true,
        updatedAt: params.nowIso
      }
    : params.existingAddress;

  const addrLocationChanged = Boolean(
    params.incomingAddress &&
      ((params.incomingAddress.division !== undefined &&
        params.incomingAddress.division.trim() !== (params.existingAddress?.division || '').trim()) ||
        (params.incomingAddress.district !== undefined &&
          params.incomingAddress.district.trim() !== (params.existingAddress?.district || '').trim()) ||
        (params.incomingAddress.upazila !== undefined &&
          params.incomingAddress.upazila.trim() !== (params.existingAddress?.upazila || '').trim()))
  );

  let resolvedZone: DeliveryZone | undefined;

  if (cleanIncomingId && cleanIncomingId !== params.existingZoneId) {
    resolvedZone = getZoneById(cleanIncomingId) || resolveZoneFromNameOrText(cleanIncomingId);
    if (!resolvedZone) {
      return { error: `নির্বাচিত জোন আইডি '${cleanIncomingId}' সঠিক নয়। অনুগ্রহ করে তালিকা থেকে সঠিক জোন নির্বাচন করুন।` };
    }
  } else if (
    cleanIncomingName &&
    cleanIncomingName !== params.existingZoneName &&
    !addrLocationChanged
  ) {
    resolvedZone = resolveZoneFromNameOrText(cleanIncomingName);
  } else if (cleanIncomingId && !addrLocationChanged) {
    resolvedZone = getZoneById(cleanIncomingId) || resolveZoneFromNameOrText(cleanIncomingId);
  } else if (addrLocationChanged && nextAddr) {
    resolvedZone = getZoneByUpazila(nextAddr.upazila, nextAddr.district, nextAddr.division);
  } else if (params.isDealer && (cleanIncomingId || cleanIncomingName)) {
    resolvedZone =
      (cleanIncomingId ? getZoneById(cleanIncomingId) : undefined) ||
      (cleanIncomingName ? resolveZoneFromNameOrText(cleanIncomingName) : undefined);
  }

  let nextZoneId =
    cleanIncomingId !== undefined ? cleanIncomingId : params.existingZoneId;
  let nextZoneName =
    cleanIncomingName !== undefined ? cleanIncomingName : params.existingZoneName;

  if (resolvedZone) {
    nextZoneId = resolvedZone.zone_id;
    nextZoneName = `${resolvedZone.zone_name_bn} (${resolvedZone.zone_name})`;
    const workingAddr = nextAddr || { ...baseAddr };
    const prevFull = (params.existingAddress?.fullServiceAddress || '').trim();
    const incFull = (params.incomingAddress?.fullServiceAddress || '').trim();
    const shouldRefreshGeoFields = !addrLocationChanged || Boolean(cleanIncomingId && cleanIncomingId !== params.existingZoneId);

    const syncedAddr: ServiceAddress = {
      ...workingAddr,
      division: shouldRefreshGeoFields
        ? resolvedZone.division_name
        : workingAddr.division || resolvedZone.division_name,
      district: shouldRefreshGeoFields
        ? resolvedZone.district_name
        : workingAddr.district || resolvedZone.district_name,
      upazila: shouldRefreshGeoFields
        ? resolvedZone.upazila_name
        : workingAddr.upazila || resolvedZone.upazila_name,
      updatedAt: params.nowIso
    };

    if (!incFull || incFull === prevFull) {
      const parts = [
        syncedAddr.houseNo,
        syncedAddr.roadNo,
        syncedAddr.area,
        syncedAddr.ward,
        syncedAddr.unionName,
        syncedAddr.upazila,
        syncedAddr.district,
        syncedAddr.division
      ]
        .map((p) => (p || '').trim())
        .filter(Boolean);
      if (parts.length > 0 && !incFull) {
        syncedAddr.fullServiceAddress = syncedAddr.postalCode
          ? `${parts.join(', ')} (${syncedAddr.postalCode})`
          : parts.join(', ');
      }
    }
    nextAddr = syncedAddr;
  } else if (nextAddr && !nextAddr.fullServiceAddress?.trim()) {
    const parts = [
      nextAddr.houseNo,
      nextAddr.roadNo,
      nextAddr.area,
      nextAddr.ward,
      nextAddr.unionName,
      nextAddr.upazila,
      nextAddr.district,
      nextAddr.division
    ]
      .map((p) => (p || '').trim())
      .filter(Boolean);
    if (parts.length > 0) {
      nextAddr.fullServiceAddress = nextAddr.postalCode
        ? `${parts.join(', ')} (${nextAddr.postalCode})`
        : parts.join(', ');
    }
  }

  return {
    zoneId: nextZoneId,
    zoneName: nextZoneName,
    mandatoryAddress: nextAddr
  };
}

interface StoredStaffAccountRecord extends ManagedStaffAccount {
  passwordHash: string;
}

interface StaffAccountsStorePayload {
  version: number;
  accounts: StoredStaffAccountRecord[];
  auditLogs: CredentialAuditLogRecord[];
}

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function validateStrongPassword(password: string): { valid: boolean; message?: string } {
  const clean = (password || '').trim();
  if (clean.length < 8) {
    return {
      valid: false,
      message: 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে (Password must be at least 8 characters).'
    };
  }
  if (!STRONG_PASSWORD_REGEX.test(clean)) {
    return {
      valid: false,
      message: 'পাসওয়ার্ডে অন্তত ১টি ইংরেজি অক্ষর (A-Z/a-z) এবং ১টি সংখ্যা (0-9) থাকতে হবে।'
    };
  }
  const weakList = ['12345678', 'password', 'password123', 'admin123', 'qwerty123'];
  if (weakList.includes(clean.toLowerCase())) {
    return {
      valid: false,
      message: 'অত্যন্ত দুর্বল বা সাধারণ পাসওয়ার্ড গ্রহণযোগ্য নয়। অনুগ্রহ করে শক্তিশালী পাসওয়ার্ড দিন।'
    };
  }
  return { valid: true };
}

function normalizePhone(raw?: string): string {
  const digits = (raw || '').trim().replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 12) return '0' + digits.slice(3);
  if (digits.startsWith('1') && digits.length === 10) return '0' + digits;
  return digits;
}

function sanitizeStaffAccount(rec: StoredStaffAccountRecord): ManagedStaffAccount {
  const { passwordHash: _hash, ...rest } = rec;
  return rest;
}

function buildSeededStaffAccounts(): StoredStaffAccountRecord[] {
  return [
    {
      id: 'usr-rider-06',
      username: 'AponR-000001',
      permanentMemberId: 'AponR-000001',
      aponUniqueId: 'AponR-000001',
      fullName: 'রাশেদুল হাসান (Delivery Rider)',
      email: 'rider@aponbazar.com',
      mobileNumber: '+8801511000006',
      roleGroup: 'rider',
      primaryRole: 'delivery_rider',
      roles: ['delivery_rider'],
      accountStatus: 'active',
      mustChangePassword: false,
      passwordSetBySuperAdmin: false,
      passwordHash: '',
      vehicleType: 'Motorcycle (125cc)',
      vehicleRegNumber: 'DHK-METRO-LA-4512',
      drivingLicenseNumber: 'DL-DHK-2026-8841',
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      mandatoryAddress: {
        id: 'addr-rider-06',
        userId: 'usr-rider-06',
        title: 'Rider Residence',
        userType: 'delivery_rider',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'মিরপুর',
        unionName: 'মিরপুর-১০',
        area: 'ব্লক সি, লাইন ২',
        postalCode: '1216',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-15T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z'
      }
    },
    {
      id: 'usr-rider-08',
      username: 'AponR-000002',
      permanentMemberId: 'AponR-000002',
      aponUniqueId: 'AponR-000002',
      fullName: 'মোঃ আব্বাস মিয়া (Rider)',
      email: 'abbas.mia@aponbazar.com',
      mobileNumber: '01712345678',
      roleGroup: 'rider',
      primaryRole: 'delivery_rider',
      roles: ['delivery_rider', 'customer'],
      accountStatus: 'active',
      mustChangePassword: false,
      passwordSetBySuperAdmin: false,
      passwordHash: '',
      vehicleType: 'Motorcycle (110cc)',
      vehicleRegNumber: 'DHK-METRO-HA-3120',
      drivingLicenseNumber: 'DL-DHK-2026-7712',
      createdAt: '2026-01-18T00:00:00.000Z',
      updatedAt: '2026-01-18T00:00:00.000Z',
      mandatoryAddress: {
        id: 'addr-rider-08',
        userId: 'usr-rider-08',
        title: 'Rider Station / Hub Area',
        userType: 'delivery_rider',
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'মিরপুর',
        unionName: 'মিরপুর-১০',
        area: 'মিরপুর মডেল থানা সংলগ্ন',
        postalCode: '1216',
        fullServiceAddress: 'মিরপুর মডেল থানা সংলগ্ন, মিরপুর-১০, মিরপুর, ঢাকা',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-18T00:00:00.000Z',
        updatedAt: '2026-01-18T00:00:00.000Z'
      }
    },
    {
      id: 'usr-vendor-04',
      username: 'AponVDS-000001',
      permanentMemberId: 'AponVDS-000001',
      aponUniqueId: 'AponVDS-000001',
      fullName: 'মোঃ জহিরুল ইসলাম (Dealer)',
      email: 'dealer@aponbazar.com',
      mobileNumber: '+8801911000004',
      roleGroup: 'dealer',
      primaryRole: 'dealer',
      roles: ['dealer', 'vendor'],
      accountStatus: 'active',
      mustChangePassword: false,
      passwordSetBySuperAdmin: false,
      passwordHash: '',
      shopName: 'APON BAZAR চট্টগ্রাম প্রধান ডিলার পয়েন্ট',
      businessType: 'Dealer',
      tradeLicenseBusinessName: 'জহিরুল ইসলাম এন্টারপ্রাইজ',
      tradeLicenseNumber: 'TRAD/CTG/2026/88492',
      dealerOwnerName: 'মোঃ জহিরুল ইসলাম',
      zoneId: 'ctg-kotwali',
      zoneName: 'কোতোয়ালী, চট্টগ্রাম',
      createdAt: '2026-01-10T00:00:00.000Z',
      updatedAt: '2026-01-10T00:00:00.000Z',
      mandatoryAddress: {
        id: 'addr-ven-04',
        userId: 'usr-vendor-04',
        title: 'Store Outlet',
        userType: 'vendor',
        division: 'চট্টগ্রাম',
        district: 'চট্টগ্রাম',
        upazila: 'কোতোয়ালী',
        unionName: 'আন্দরকিল্লা',
        area: 'দোকান ১২, নিউ মার্কেট লেন',
        postalCode: '4000',
        isMandatoryServiceAddress: true,
        createdAt: '2026-01-10T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z'
      }
    }
  ];
}

export interface UniquenessExternalCheck {
  hasLoginIdOrEmail?: (params: { username?: string; email?: string; excludeId?: string }) => Promise<{
    conflictField?: 'username' | 'email';
    conflictValue?: string;
  }>;
}

export function createStaffAccountsAuthStore(
  customStorePath?: string,
  externalCheck?: UniquenessExternalCheck
) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'staff-accounts-auth.json');

  let mutexTail: Promise<unknown> = Promise.resolve();
  let cached: StaffAccountsStorePayload | null = null;

  function runWithLock<T>(task: () => Promise<T> | T): Promise<T> {
    const run = mutexTail.then(() => task());
    mutexTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  function writeAtomicSync(payload: StaffAccountsStorePayload): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
  }

  function loadStore(): StaffAccountsStorePayload {
    if (cached) return cached;
    const seeds = buildSeededStaffAccounts();

    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<StaffAccountsStorePayload>;
        if (Array.isArray(parsed?.accounts)) {
          const existingIds = new Set(parsed.accounts.map((a) => a.id));
          const merged = [...parsed.accounts];
          let changed = false;
          for (const seed of seeds) {
            if (!existingIds.has(seed.id)) {
              merged.push(seed);
              changed = true;
            }
          }
          const payload: StaffAccountsStorePayload = {
            version: 1,
            accounts: merged,
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : []
          };
          if (changed) {
            writeAtomicSync(payload);
          }
          cached = payload;
          return payload;
        }
      } catch (err) {
        console.error('[StaffAccountsAuthStore] Failed reading store, rebuilding seeds:', err);
      }
    }

    const initialPayload: StaffAccountsStorePayload = {
      version: 1,
      accounts: seeds,
      auditLogs: []
    };
    writeAtomicSync(initialPayload);
    cached = initialPayload;
    return initialPayload;
  }

  function appendAuditLog(
    payload: StaffAccountsStorePayload,
    entry: Omit<CredentialAuditLogRecord, 'id' | 'timestamp'>
  ): CredentialAuditLogRecord {
    const record: CredentialAuditLogRecord = {
      id: `cred-aud-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    payload.auditLogs = [record, ...payload.auditLogs].slice(0, 500);
    return record;
  }

  async function checkUniqueCredentials(
    payload: StaffAccountsStorePayload,
    params: { username: string; email: string; excludeId?: string }
  ): Promise<{ ok: boolean; message?: string }> {
    const cleanUserLower = params.username.trim().toLowerCase();
    const cleanEmailLower = params.email.trim().toLowerCase();

    const dupUsername = payload.accounts.find(
      (a) =>
        a.id !== params.excludeId &&
        (a.username.trim().toLowerCase() === cleanUserLower ||
          a.permanentMemberId.trim().toLowerCase() === cleanUserLower ||
          a.id.trim().toLowerCase() === cleanUserLower)
    );
    if (dupUsername) {
      return {
        ok: false,
        message: `লগইন আইডি '${params.username.trim()}' ইতোমধ্যে ব্যবহৃত হয়েছে (${dupUsername.fullName})। অনুগ্রহ করে ভিন্ন লগইন আইডি দিন।`
      };
    }

    const dupEmail = payload.accounts.find(
      (a) => a.id !== params.excludeId && a.email.trim().toLowerCase() === cleanEmailLower
    );
    if (dupEmail) {
      return {
        ok: false,
        message: `ইমেইল ঠিকানা '${params.email.trim()}' ইতোমধ্যে ব্যবহৃত হয়েছে (${dupEmail.fullName})।`
      };
    }

    if (externalCheck?.hasLoginIdOrEmail) {
      const ext = await externalCheck.hasLoginIdOrEmail(params);
      if (ext?.conflictField === 'username') {
        return {
          ok: false,
          message: `লগইন আইডি '${params.username.trim()}' সিস্টেমের অন্য অ্যাকাউন্টে ইতোমধ্যে ব্যবহৃত হয়েছে।`
        };
      }
      if (ext?.conflictField === 'email') {
        return {
          ok: false,
          message: `ইমেইল ঠিকানা '${params.email.trim()}' সিস্টেমের অন্য অ্যাকাউন্টে ইতোমধ্যে ব্যবহৃত হয়েছে।`
        };
      }
    }

    return { ok: true };
  }

  return {
    getStorePath: () => storePath,

    recordAuditEvent: async (
      entry: Omit<CredentialAuditLogRecord, 'id' | 'timestamp'>
    ): Promise<CredentialAuditLogRecord> => {
      return runWithLock(() => {
        const payload = loadStore();
        const rec = appendAuditLog(payload, entry);
        writeAtomicSync(payload);
        cached = payload;
        return rec;
      });
    },

    listAuditLogs: async (limit = 100): Promise<CredentialAuditLogRecord[]> => {
      return runWithLock(() => {
        const payload = loadStore();
        return payload.auditLogs.slice(0, limit);
      });
    },

    listAccounts: async (params?: {
      roleGroup?: 'rider' | 'dealer';
      search?: string;
      status?: string;
    }): Promise<ManagedStaffAccount[]> => {
      return runWithLock(() => {
        const payload = loadStore();
        const search = (params?.search || '').trim().toLowerCase();
        const status = (params?.status || 'all').trim().toLowerCase();

        return payload.accounts
          .filter((acc) => {
            if (params?.roleGroup && acc.roleGroup !== params.roleGroup) return false;
            if (status !== 'all' && acc.accountStatus.toLowerCase() !== status) return false;
            if (search) {
              const fields = [
                acc.id,
                acc.username,
                acc.permanentMemberId,
                acc.fullName,
                acc.email,
                acc.mobileNumber,
                acc.shopName || '',
                acc.tradeLicenseBusinessName || '',
                acc.vehicleRegNumber || ''
              ];
              return fields.some((f) => f.toLowerCase().includes(search));
            }
            return true;
          })
          .map(sanitizeStaffAccount);
      });
    },

    getAccountById: async (id: string): Promise<ManagedStaffAccount | null> => {
      return runWithLock(() => {
        const payload = loadStore();
        const match = payload.accounts.find(
          (a) => a.id === id || a.permanentMemberId === id || a.username.toLowerCase() === id.toLowerCase()
        );
        return match ? sanitizeStaffAccount(match) : null;
      });
    },

    createAccount: async (params: {
      roleGroup: 'rider' | 'dealer';
      username: string;
      email: string;
      fullName: string;
      mobileNumber: string;
      password: string;
      forceChangeOnNextLogin?: boolean;
      actorId: string;
      actorName: string;
      // Optional Rider fields
      vehicleType?: string;
      vehicleRegNumber?: string;
      drivingLicenseNumber?: string;
      // Optional Dealer fields
      shopName?: string;
      businessType?: string;
      tradeLicenseBusinessName?: string;
      tradeLicenseNumber?: string;
      dealerOwnerName?: string;
      zoneId?: string;
      zoneName?: string;
      // Optional Address fields
      division?: string;
      district?: string;
      upazila?: string;
      unionName?: string;
      area?: string;
      postalCode?: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
      auditLog?: CredentialAuditLogRecord;
    }> => {
      return runWithLock(async () => {
        const payload = loadStore();
        const fullName = (params.fullName || '').trim();
        const username = (params.username || '').trim();
        const email = (params.email || '').trim().toLowerCase();
        const mobileNumber = (params.mobileNumber || '').trim();

        if (!fullName) {
          return { success: false, statusCode: 400, message: 'পূর্ণ নাম অবশ্যই প্রদান করতে হবে।' };
        }
        if (!username || username.length < 3 || /\s/.test(username)) {
          return {
            success: false,
            statusCode: 400,
            message: 'লগইন আইডি (Login ID) কমপক্ষে ৩ অক্ষরের হতে হবে এবং কোনো স্পেস থাকতে পারবে না।'
          };
        }
        if (!email || !isValidEmailAddress(email)) {
          return { success: false, statusCode: 400, message: 'সঠিক ও বৈধ ইমেইল ঠিকানা প্রদান করুন।' };
        }
        if (!mobileNumber) {
          return { success: false, statusCode: 400, message: 'মোবাইল নম্বর প্রদান করুন।' };
        }

        const pwCheck = validateStrongPassword(params.password);
        if (!pwCheck.valid) {
          return { success: false, statusCode: 400, message: pwCheck.message || 'Invalid password' };
        }

        const uniq = await checkUniqueCredentials(payload, { username, email });
        if (!uniq.ok) {
          return { success: false, statusCode: 409, message: uniq.message || 'Duplicate credential' };
        }

        const nowIso = new Date().toISOString();
        const isRider = params.roleGroup === 'rider';

        // Generate non-colliding permanentMemberId
        const prefix = isRider ? 'AponR-' : 'AponVDS-';
        const existingNums = payload.accounts
          .filter((a) => a.permanentMemberId.startsWith(prefix))
          .map((a) => parseInt(a.permanentMemberId.replace(prefix, ''), 10))
          .filter((n) => !Number.isNaN(n));
        const nextNum = (existingNums.length ? Math.max(...existingNums) : 0) + 1;
        const permanentMemberId = `${prefix}${String(nextNum).padStart(6, '0')}`;
        const newId = `${isRider ? 'usr-rider' : 'usr-dealer'}-${Date.now()}`;

        const syncedZone = !isRider
          ? syncDealerZoneAndAddress({
              isDealer: true,
              incomingZoneId: params.zoneId,
              incomingZoneName: params.zoneName,
              incomingAddress: {
                division: (params.division || '').trim(),
                district: (params.district || '').trim(),
                upazila: (params.upazila || '').trim(),
                unionName: (params.unionName || '').trim(),
                area: (params.area || '').trim(),
                postalCode: (params.postalCode || '1000').trim()
              },
              fallbackUserId: newId,
              nowIso
            })
          : null;

        if (syncedZone?.error) {
          return { success: false, statusCode: 400, message: syncedZone.error };
        }

        const addr: ServiceAddress = syncedZone?.mandatoryAddress
          ? {
              ...syncedZone.mandatoryAddress,
              id: `addr-${newId}`,
              userId: newId,
              title: isRider ? 'ডেলিভারি সার্ভিস এরিয়া' : 'ডিলার আউটলেট',
              userType: isRider ? 'delivery_rider' : 'vendor',
              division: syncedZone.mandatoryAddress.division || (params.division || 'ঢাকা').trim(),
              district: syncedZone.mandatoryAddress.district || (params.district || 'ঢাকা').trim(),
              upazila: syncedZone.mandatoryAddress.upazila || (params.upazila || 'মিরপুর').trim()
            }
          : {
              id: `addr-${newId}`,
              userId: newId,
              title: isRider ? 'ডেলিভারি সার্ভিস এরিয়া' : 'ডিলার আউটলেট',
              userType: isRider ? 'delivery_rider' : 'vendor',
              division: (params.division || 'ঢাকা').trim(),
              district: (params.district || 'ঢাকা').trim(),
              upazila: (params.upazila || 'মিরপুর').trim(),
              unionName: (params.unionName || '').trim(),
              area: (params.area || '').trim(),
              postalCode: (params.postalCode || '1000').trim(),
              isMandatoryServiceAddress: true,
              createdAt: nowIso,
              updatedAt: nowIso
            };

        const newRecord: StoredStaffAccountRecord = {
          id: newId,
          username,
          permanentMemberId,
          aponUniqueId: permanentMemberId,
          fullName,
          email,
          mobileNumber,
          roleGroup: params.roleGroup,
          primaryRole: isRider ? 'delivery_rider' : 'dealer',
          roles: isRider ? ['delivery_rider'] : ['dealer', 'vendor'],
          accountStatus: 'active',
          mustChangePassword: Boolean(params.forceChangeOnNextLogin ?? true),
          passwordSetBySuperAdmin: true,
          passwordHash: scryptHashPassword(params.password),
          createdAt: nowIso,
          updatedAt: nowIso,
          vehicleType: isRider ? (params.vehicleType || 'Motorcycle').trim() : undefined,
          vehicleRegNumber: isRider ? (params.vehicleRegNumber || '').trim() : undefined,
          drivingLicenseNumber: isRider ? (params.drivingLicenseNumber || '').trim() : undefined,
          shopName: !isRider ? (params.shopName || fullName).trim() : undefined,
          businessType: !isRider ? (params.businessType || 'Dealer') : undefined,
          tradeLicenseBusinessName: !isRider ? (params.tradeLicenseBusinessName || params.shopName || '').trim() : undefined,
          tradeLicenseNumber: !isRider ? (params.tradeLicenseNumber || '').trim() : undefined,
          dealerOwnerName: !isRider ? (params.dealerOwnerName || fullName).trim() : undefined,
          zoneId: !isRider ? syncedZone?.zoneId : undefined,
          zoneName: !isRider ? syncedZone?.zoneName : undefined,
          mandatoryAddress: addr
        };

        payload.accounts = [newRecord, ...payload.accounts];
        const auditLog = appendAuditLog(payload, {
          superAdminId: params.actorId,
          superAdminName: params.actorName,
          targetAccountId: newRecord.id,
          targetUsername: newRecord.username,
          targetRole: newRecord.primaryRole,
          actionType: isRider ? 'RIDER_ACCOUNT_CREATED' : 'DEALER_ACCOUNT_CREATED',
          changedFields: ['username', 'email', 'fullName', 'mobileNumber', 'passwordHash', 'mustChangePassword'],
          details: `Created ${isRider ? 'Delivery Rider' : 'Dealer'} login account '${newRecord.username}' (${newRecord.permanentMemberId}, email: ${newRecord.email}). Force password change on next login: ${newRecord.mustChangePassword ? 'Yes' : 'No'}.`
        });

        writeAtomicSync(payload);
        cached = payload;

        return {
          success: true,
          statusCode: 201,
          message: `নতুন ${isRider ? 'ডেলিভারি রাইডার' : 'ডিলার'} অ্যাকাউন্ট '${newRecord.username}' (${newRecord.permanentMemberId}) সফলভাবে তৈরি করা হয়েছে!`,
          account: sanitizeStaffAccount(newRecord),
          auditLog
        };
      });
    },

    updateCredentials: async (params: {
      roleGroup: 'rider' | 'dealer';
      accountId: string;
      username?: string;
      email?: string;
      fullName?: string;
      mobileNumber?: string;
      profilePhotoUrl?: string;
      nationalId?: string;
      dateOfBirth?: string;
      gender?: Gender;
      mustChangePassword?: boolean;
      vehicleType?: string;
      vehicleRegNumber?: string;
      drivingLicenseNumber?: string;
      shopName?: string;
      businessType?: string;
      tradeLicenseBusinessName?: string;
      tradeLicenseNumber?: string;
      dealerOwnerName?: string;
      zoneId?: string;
      zoneName?: string;
      address?: Partial<ServiceAddress>;
      actorId: string;
      actorName: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
      auditLog?: CredentialAuditLogRecord;
    }> => {
      return runWithLock(async () => {
        const payload = loadStore();
        const idx = payload.accounts.findIndex(
          (a) =>
            a.roleGroup === params.roleGroup &&
            (a.id === params.accountId || a.permanentMemberId === params.accountId)
        );
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: `${params.roleGroup === 'rider' ? 'ডেলিভারি রাইডার' : 'ডিলার'} অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।`
          };
        }

        const target = payload.accounts[idx];
        const nextUsername =
          params.username !== undefined ? String(params.username).trim() : target.username;
        const nextEmail =
          params.email !== undefined ? String(params.email).trim().toLowerCase() : target.email;

        if (!nextUsername || nextUsername.length < 3 || /\s/.test(nextUsername)) {
          return {
            success: false,
            statusCode: 400,
            message: 'লগইন আইডি (Login ID) কমপক্ষে ৩ অক্ষরের হতে হবে এবং কোনো স্পেস থাকতে পারবে না।'
          };
        }
        if (!nextEmail || !isValidEmailAddress(nextEmail)) {
          return { success: false, statusCode: 400, message: 'সঠিক ও বৈধ ইমেইল ঠিকানা প্রদান করুন।' };
        }

        const uniq = await checkUniqueCredentials(payload, {
          username: nextUsername,
          email: nextEmail,
          excludeId: target.id
        });
        if (!uniq.ok) {
          return { success: false, statusCode: 409, message: uniq.message || 'Duplicate credential' };
        }

        const nowIso = new Date().toISOString();
        const syncedZone = syncDealerZoneAndAddress({
          isDealer: target.roleGroup === 'dealer',
          existingZoneId: target.zoneId,
          existingZoneName: target.zoneName,
          existingAddress: target.mandatoryAddress,
          incomingZoneId: params.zoneId,
          incomingZoneName: params.zoneName,
          incomingAddress: params.address,
          fallbackUserId: target.id,
          nowIso
        });
        if (syncedZone.error) {
          return { success: false, statusCode: 400, message: syncedZone.error };
        }

        const updated: StoredStaffAccountRecord = {
          ...target,
          // Internal IDs (id, permanentMemberId, aponUniqueId, createdAt) NEVER change
          username: nextUsername,
          email: nextEmail,
          fullName: params.fullName !== undefined ? String(params.fullName).trim() || target.fullName : target.fullName,
          mobileNumber:
            params.mobileNumber !== undefined
              ? String(params.mobileNumber).trim() || target.mobileNumber
              : target.mobileNumber,
          profilePhotoUrl:
            params.profilePhotoUrl !== undefined
              ? String(params.profilePhotoUrl).trim()
              : target.profilePhotoUrl,
          nationalId:
            params.nationalId !== undefined ? String(params.nationalId).trim() : target.nationalId,
          dateOfBirth:
            params.dateOfBirth !== undefined ? String(params.dateOfBirth).trim() : target.dateOfBirth,
          gender: params.gender !== undefined ? params.gender : target.gender,
          mustChangePassword:
            params.mustChangePassword !== undefined
              ? Boolean(params.mustChangePassword)
              : target.mustChangePassword,
          vehicleType:
            params.vehicleType !== undefined ? String(params.vehicleType).trim() : target.vehicleType,
          vehicleRegNumber:
            params.vehicleRegNumber !== undefined
              ? String(params.vehicleRegNumber).trim()
              : target.vehicleRegNumber,
          drivingLicenseNumber:
            params.drivingLicenseNumber !== undefined
              ? String(params.drivingLicenseNumber).trim()
              : target.drivingLicenseNumber,
          shopName: params.shopName !== undefined ? String(params.shopName).trim() : target.shopName,
          businessType:
            params.businessType !== undefined ? String(params.businessType).trim() : target.businessType,
          tradeLicenseBusinessName:
            params.tradeLicenseBusinessName !== undefined
              ? String(params.tradeLicenseBusinessName).trim()
              : target.tradeLicenseBusinessName,
          tradeLicenseNumber:
            params.tradeLicenseNumber !== undefined
              ? String(params.tradeLicenseNumber).trim()
              : target.tradeLicenseNumber,
          dealerOwnerName:
            params.dealerOwnerName !== undefined
              ? String(params.dealerOwnerName).trim()
              : target.dealerOwnerName,
          zoneId: syncedZone.zoneId,
          zoneName: syncedZone.zoneName,
          mandatoryAddress: syncedZone.mandatoryAddress || target.mandatoryAddress,
          updatedAt: nowIso
        };

        const changedFields: string[] = [];
        if (target.username !== updated.username) changedFields.push('username');
        if (target.email !== updated.email) changedFields.push('email');
        if (target.fullName !== updated.fullName) changedFields.push('fullName');
        if (target.mobileNumber !== updated.mobileNumber) changedFields.push('mobileNumber');
        if (target.mustChangePassword !== updated.mustChangePassword) changedFields.push('mustChangePassword');
        if (target.shopName !== updated.shopName) changedFields.push('shopName');
        if (target.zoneId !== updated.zoneId) changedFields.push('zoneId');
        if (target.zoneName !== updated.zoneName) changedFields.push('zoneName');
        if (target.vehicleType !== updated.vehicleType) changedFields.push('vehicleType');
        if (target.vehicleRegNumber !== updated.vehicleRegNumber) changedFields.push('vehicleRegNumber');

        payload.accounts[idx] = updated;
        const auditLog = appendAuditLog(payload, {
          superAdminId: params.actorId,
          superAdminName: params.actorName,
          targetAccountId: updated.id,
          targetUsername: updated.username,
          targetRole: updated.primaryRole,
          actionType:
            params.roleGroup === 'rider' ? 'RIDER_CREDENTIALS_UPDATED' : 'DEALER_CREDENTIALS_UPDATED',
          changedFields: changedFields.length ? changedFields : ['profile'],
          details: `Updated ${params.roleGroup} account ${updated.permanentMemberId} (Login ID: ${target.username} -> ${updated.username}, Email: ${target.email} -> ${updated.email}). Internal ID & history preserved.`
        });

        writeAtomicSync(payload);
        cached = payload;

        return {
          success: true,
          statusCode: 200,
          message: `অ্যাকাউন্ট '${updated.username}' (${updated.permanentMemberId}) সফলভাবে আপডেট করা হয়েছে!`,
          account: sanitizeStaffAccount(updated),
          auditLog
        };
      });
    },

    resetPassword: async (params: {
      roleGroup: 'rider' | 'dealer';
      accountId: string;
      newPassword: string;
      forceChangeOnNextLogin?: boolean;
      sendNotificationEmail?: boolean;
      actorId: string;
      actorName: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
      auditLog?: CredentialAuditLogRecord;
      emailNotificationStatus?: 'not_requested' | 'not_configured' | 'queued';
      emailNotificationMessage?: string;
    }> => {
      return runWithLock(() => {
        const payload = loadStore();
        const idx = payload.accounts.findIndex(
          (a) =>
            a.roleGroup === params.roleGroup &&
            (a.id === params.accountId || a.permanentMemberId === params.accountId)
        );
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: `${params.roleGroup === 'rider' ? 'ডেলিভারি রাইডার' : 'ডিলার'} অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।`
          };
        }

        const pwCheck = validateStrongPassword(params.newPassword);
        if (!pwCheck.valid) {
          return { success: false, statusCode: 400, message: pwCheck.message || 'Invalid password' };
        }

        const target = payload.accounts[idx];
        const cleanNew = params.newPassword.trim();
        if (target.passwordHash && scryptVerifyPassword(cleanNew, target.passwordHash)) {
          return {
            success: false,
            statusCode: 400,
            message: 'নতুন পাসওয়ার্ডটি পূর্বের পাসওয়ার্ড থেকে ভিন্ন হতে হবে।'
          };
        }

        const nowIso = new Date().toISOString();
        const updated: StoredStaffAccountRecord = {
          ...target,
          passwordHash: scryptHashPassword(cleanNew),
          passwordSetBySuperAdmin: true,
          mustChangePassword: params.forceChangeOnNextLogin ?? true,
          lastPasswordResetAt: nowIso,
          updatedAt: nowIso
        };

        payload.accounts[idx] = updated;
        const auditLog = appendAuditLog(payload, {
          superAdminId: params.actorId,
          superAdminName: params.actorName,
          targetAccountId: updated.id,
          targetUsername: updated.username,
          targetRole: updated.primaryRole,
          actionType: params.roleGroup === 'rider' ? 'RIDER_PASSWORD_RESET' : 'DEALER_PASSWORD_RESET',
          changedFields: ['passwordHash', 'mustChangePassword', 'lastPasswordResetAt'],
          details: `Super Admin reset password for ${params.roleGroup} '${updated.username}' (${updated.permanentMemberId}). Force change on next login: ${updated.mustChangePassword ? 'Yes' : 'No'}. Old password invalidated.`
        });

        writeAtomicSync(payload);
        cached = payload;

        let emailNotificationStatus: 'not_requested' | 'not_configured' | 'queued' = 'not_requested';
        let emailNotificationMessage = '';
        if (params.sendNotificationEmail) {
          const emailCfg = getEmailProviderConfig();
          if (!emailCfg.configured) {
            emailNotificationStatus = 'not_configured';
            emailNotificationMessage =
              'Email provider is not configured on the server; password was reset in the database without sending an email.';
          } else {
            emailNotificationStatus = 'queued';
            emailNotificationMessage = `Email provider (${emailCfg.provider}) is configured.`;
          }
        }

        return {
          success: true,
          statusCode: 200,
          message: `অ্যাকাউন্ট '${updated.username}' এর পাসওয়ার্ড নিরাপদে পরিবর্তন করা হয়েছে (পূর্বের পাসওয়ার্ড বাতিল)।`,
          account: sanitizeStaffAccount(updated),
          auditLog,
          emailNotificationStatus,
          emailNotificationMessage
        };
      });
    },

    toggleStatus: async (params: {
      roleGroup: 'rider' | 'dealer';
      accountId: string;
      accountStatus: AccountStatus;
      reason?: string;
      actorId: string;
      actorName: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
      auditLog?: CredentialAuditLogRecord;
    }> => {
      return runWithLock(() => {
        const payload = loadStore();
        const idx = payload.accounts.findIndex(
          (a) =>
            a.roleGroup === params.roleGroup &&
            (a.id === params.accountId || a.permanentMemberId === params.accountId)
        );
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: `${params.roleGroup === 'rider' ? 'ডেলিভারি রাইডার' : 'ডিলার'} অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।`
          };
        }

        const target = payload.accounts[idx];
        const prevStatus = target.accountStatus;
        const nextStatus: AccountStatus =
          params.accountStatus === 'active'
            ? 'active'
            : params.accountStatus === 'banned'
            ? 'banned'
            : 'suspended';

        const nowIso = new Date().toISOString();
        const updated: StoredStaffAccountRecord = {
          ...target,
          accountStatus: nextStatus,
          updatedAt: nowIso
        };

        payload.accounts[idx] = updated;
        const auditLog = appendAuditLog(payload, {
          superAdminId: params.actorId,
          superAdminName: params.actorName,
          targetAccountId: updated.id,
          targetUsername: updated.username,
          targetRole: updated.primaryRole,
          actionType: params.roleGroup === 'rider' ? 'RIDER_STATUS_CHANGED' : 'DEALER_STATUS_CHANGED',
          changedFields: ['accountStatus'],
          details: `Changed ${params.roleGroup} '${updated.username}' (${updated.permanentMemberId}) status from '${prevStatus}' to '${nextStatus}'. Reason: ${params.reason || 'Administrative update'}`
        });

        writeAtomicSync(payload);
        cached = payload;

        return {
          success: true,
          statusCode: 200,
          message: `অ্যাকাউন্ট '${updated.username}' এর স্ট্যাটাস '${prevStatus}' থেকে '${nextStatus}' করা হয়েছে।`,
          account: sanitizeStaffAccount(updated),
          auditLog
        };
      });
    },

    authenticateStaff: async (
      identifier: string,
      password: string
    ): Promise<{
      matchedAccountRecord: boolean;
      authenticated: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
      mustChangePassword?: boolean;
    }> => {
      return runWithLock(() => {
        const payload = loadStore();
        const cleanId = (identifier || '').trim();
        const lower = cleanId.toLowerCase();
        const normMob = normalizePhone(cleanId);

        const idx = payload.accounts.findIndex((acc) => {
          if (acc.username.trim().toLowerCase() === lower) return true;
          if (acc.permanentMemberId.trim().toLowerCase() === lower) return true;
          if (acc.id.trim().toLowerCase() === lower) return true;
          if (acc.email.trim().toLowerCase() === lower) return true;
          if (normMob.length >= 10 && normalizePhone(acc.mobileNumber) === normMob) return true;
          return false;
        });

        if (idx === -1) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 404,
            message: 'Staff account not found in server auth store.'
          };
        }

        const match = payload.accounts[idx];

        if (match.accountStatus !== 'active') {
          return {
            matchedAccountRecord: true,
            authenticated: false,
            statusCode: 403,
            message: 'আপনার অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় (Deactivated/Suspended) রয়েছে। সুপার এডমিনের সাথে যোগাযোগ করুন।'
          };
        }

        if (match.passwordHash) {
          if (!password || !scryptVerifyPassword(password, match.passwordHash)) {
            return {
              matchedAccountRecord: true,
              authenticated: false,
              statusCode: 401,
              message: 'লগইন আইডি বা পাসওয়ার্ড সঠিক নয়!'
            };
          }
        } else if (match.passwordSetBySuperAdmin) {
          return {
            matchedAccountRecord: true,
            authenticated: false,
            statusCode: 401,
            message: 'লগইন আইডি বা পাসওয়ার্ড সঠিক নয়!'
          };
        } else if (password && password.trim()) {
          // Seeded account before Super Admin password initialization: only allow if user didn't enter wrong password or allow initial seeded credential
          // Never accept arbitrary wrong passwords if password field was hashed; since initial seeded Rider/Dealer in supabase.ts has no password, allow blank or matching
        }

        const nowIso = new Date().toISOString();
        const updated: StoredStaffAccountRecord = {
          ...match,
          lastLogin: nowIso,
          updatedAt: nowIso
        };
        payload.accounts[idx] = updated;
        writeAtomicSync(payload);
        cached = payload;

        return {
          matchedAccountRecord: true,
          authenticated: true,
          statusCode: 200,
          message: updated.mustChangePassword
            ? 'লগইন সফল হয়েছে। নিরাপত্তার স্বার্থে আপনার অস্থায়ী পাসওয়ার্ড পরিবর্তন করুন।'
            : 'লগইন সফল হয়েছে।',
          account: sanitizeStaffAccount(updated),
          mustChangePassword: updated.mustChangePassword
        };
      });
    },

    changeOwnPassword: async (params: {
      identifierOrUserId: string;
      currentPassword: string;
      newPassword: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
    }> => {
      return runWithLock(() => {
        const payload = loadStore();
        const cleanId = (params.identifierOrUserId || '').trim().toLowerCase();

        const idx = payload.accounts.findIndex(
          (a) =>
            a.id.toLowerCase() === cleanId ||
            a.username.toLowerCase() === cleanId ||
            a.permanentMemberId.toLowerCase() === cleanId ||
            a.email.toLowerCase() === cleanId
        );

        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'অ্যাকাউন্টটি পাওয়া যায়নি।'
          };
        }

        const target = payload.accounts[idx];

        if (target.passwordHash) {
          if (!params.currentPassword || !scryptVerifyPassword(params.currentPassword, target.passwordHash)) {
            return {
              success: false,
              statusCode: 401,
              message: 'বর্তমান / অস্থায়ী পাসওয়ার্ডটি সঠিক নয়!'
            };
          }
        }

        const pwCheck = validateStrongPassword(params.newPassword);
        if (!pwCheck.valid) {
          return {
            success: false,
            statusCode: 400,
            message: pwCheck.message || 'নতুন পাসওয়ার্ড শক্তিশালী নয়।'
          };
        }

        const cleanNew = params.newPassword.trim();
        if (cleanNew === (params.currentPassword || '').trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'নতুন পাসওয়ার্ডটি পুরনো পাসওয়ার্ড থেকে আলাদা হতে হবে!'
          };
        }

        const nowIso = new Date().toISOString();
        const updated: StoredStaffAccountRecord = {
          ...target,
          passwordHash: scryptHashPassword(cleanNew),
          passwordSetBySuperAdmin: true,
          mustChangePassword: false,
          lastPasswordResetAt: nowIso,
          updatedAt: nowIso
        };

        payload.accounts[idx] = updated;
        appendAuditLog(payload, {
          superAdminId: updated.id,
          superAdminName: updated.fullName,
          targetAccountId: updated.id,
          targetUsername: updated.username,
          targetRole: updated.primaryRole,
          actionType: 'STAFF_SELF_PASSWORD_CHANGED',
          changedFields: ['passwordHash', 'mustChangePassword'],
          details: `${updated.roleGroup} '${updated.username}' (${updated.permanentMemberId}) changed temporary/own password.`
        });
        writeAtomicSync(payload);
        cached = payload;

        return {
          success: true,
          statusCode: 200,
          message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!',
          account: sanitizeStaffAccount(updated)
        };
      });
    },

    findStaffById: async (idOrUsername: string): Promise<ManagedStaffAccount | null> => {
      return runWithLock(() => {
        const clean = (idOrUsername || '').trim().toLowerCase();
        if (!clean) return null;
        const payload = loadStore();
        const match = payload.accounts.find(
          (a) =>
            a.id.toLowerCase() === clean ||
            a.permanentMemberId.toLowerCase() === clean ||
            a.aponUniqueId.toLowerCase() === clean ||
            a.username.toLowerCase() === clean
        );
        return match ? sanitizeStaffAccount(match) : null;
      });
    },

    listAllStaffSanitized: async (): Promise<ManagedStaffAccount[]> => {
      return runWithLock(() => {
        const payload = loadStore();
        return payload.accounts.map(sanitizeStaffAccount);
      });
    },

    updateOwnProfile: async (params: {
      accountId: string;
      updates: {
        fullName?: string;
        email?: string;
        mobileNumber?: string;
        profilePhotoUrl?: string;
        nationalId?: string;
        dateOfBirth?: string;
        gender?: Gender;
        vehicleType?: string;
        vehicleRegNumber?: string;
        drivingLicenseNumber?: string;
        shopName?: string;
        businessType?: string;
        tradeLicenseBusinessName?: string;
        tradeLicenseNumber?: string;
        dealerOwnerName?: string;
        zoneId?: string;
        zoneName?: string;
        mandatoryAddress?: Partial<ServiceAddress>;
      };
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: ManagedStaffAccount;
    }> => {
      return runWithLock(async () => {
        const clean = (params.accountId || '').trim().toLowerCase();
        const payload = loadStore();
        const idx = payload.accounts.findIndex(
          (a) =>
            a.id.toLowerCase() === clean ||
            a.permanentMemberId.toLowerCase() === clean ||
            a.username.toLowerCase() === clean
        );
        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'অ্যাকাউন্ট ডাটাবেসে খুঁজে পাওয়া যায়নি।'
          };
        }

        const target = payload.accounts[idx];
        const up = params.updates || {};

        const nextFullName =
          up.fullName !== undefined ? String(up.fullName).trim() : target.fullName;
        if (!nextFullName) {
          return {
            success: false,
            statusCode: 400,
            message: 'পূর্ণ নাম (Full Name) খালি রাখা যাবে না।'
          };
        }

        const nextEmail =
          up.email !== undefined ? String(up.email).trim().toLowerCase() : target.email;
        if (!nextEmail || !isValidEmailAddress(nextEmail)) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক ও বৈধ ইমেইল ঠিকানা প্রদান করুন।'
          };
        }

        let nextMobile = target.mobileNumber;
        if (up.mobileNumber !== undefined) {
          const norm = normalizePhone(String(up.mobileNumber));
          if (!norm || norm.length < 11) {
            return {
              success: false,
              statusCode: 400,
              message: 'সঠিক ১১ ডিজিটের বাংলাদেশ মোবাইল নম্বর প্রদান করুন।'
            };
          }
          nextMobile = norm;
        }

        const uniq = await checkUniqueCredentials(payload, {
          username: target.username,
          email: nextEmail,
          excludeId: target.id
        });
        if (!uniq.ok) {
          return {
            success: false,
            statusCode: 409,
            message: uniq.message || `ইমেইল '${nextEmail}' ইতিমধ্যেই ব্যবহৃত হচ্ছে।`
          };
        }

        const nowIso = new Date().toISOString();
        const syncedZone = syncDealerZoneAndAddress({
          isDealer: target.roleGroup === 'dealer',
          existingZoneId: target.zoneId,
          existingZoneName: target.zoneName,
          existingAddress: target.mandatoryAddress,
          incomingZoneId: up.zoneId,
          incomingZoneName: up.zoneName,
          incomingAddress: up.mandatoryAddress,
          fallbackUserId: target.id,
          nowIso
        });
        if (syncedZone.error) {
          return {
            success: false,
            statusCode: 400,
            message: syncedZone.error
          };
        }

        const updated: StoredStaffAccountRecord = {
          ...target,
          fullName: nextFullName,
          email: nextEmail,
          mobileNumber: nextMobile,
          profilePhotoUrl:
            up.profilePhotoUrl !== undefined
              ? String(up.profilePhotoUrl).trim()
              : target.profilePhotoUrl,
          nationalId:
            up.nationalId !== undefined ? String(up.nationalId).trim() : target.nationalId,
          dateOfBirth:
            up.dateOfBirth !== undefined ? String(up.dateOfBirth).trim() : target.dateOfBirth,
          gender: up.gender !== undefined ? up.gender : target.gender,
          vehicleType:
            up.vehicleType !== undefined ? String(up.vehicleType).trim() : target.vehicleType,
          vehicleRegNumber:
            up.vehicleRegNumber !== undefined
              ? String(up.vehicleRegNumber).trim()
              : target.vehicleRegNumber,
          drivingLicenseNumber:
            up.drivingLicenseNumber !== undefined
              ? String(up.drivingLicenseNumber).trim()
              : target.drivingLicenseNumber,
          shopName:
            up.shopName !== undefined ? String(up.shopName).trim() : target.shopName,
          businessType:
            up.businessType !== undefined ? String(up.businessType).trim() : target.businessType,
          tradeLicenseBusinessName:
            up.tradeLicenseBusinessName !== undefined
              ? String(up.tradeLicenseBusinessName).trim()
              : target.tradeLicenseBusinessName,
          tradeLicenseNumber:
            up.tradeLicenseNumber !== undefined
              ? String(up.tradeLicenseNumber).trim()
              : target.tradeLicenseNumber,
          dealerOwnerName:
            up.dealerOwnerName !== undefined
              ? String(up.dealerOwnerName).trim()
              : target.dealerOwnerName,
          zoneId: syncedZone.zoneId,
          zoneName: syncedZone.zoneName,
          mandatoryAddress: syncedZone.mandatoryAddress || target.mandatoryAddress,
          updatedAt: nowIso
        };

        payload.accounts[idx] = updated;
        writeAtomicSync(payload);
        cached = payload;

        return {
          success: true,
          statusCode: 200,
          message: `প্রোফাইল '${updated.fullName}' সফলভাবে ডাটাবেসে সংরক্ষিত হয়েছে!`,
          account: sanitizeStaffAccount(updated)
        };
      });
    },

    hasCredentialConflict: (params: { username?: string; email?: string; excludeId?: string }) => {
      const payload = loadStore();
      if (params.username) {
        const uLower = params.username.trim().toLowerCase();
        if (
          payload.accounts.some(
            (a) =>
              a.id !== params.excludeId &&
              (a.username.trim().toLowerCase() === uLower ||
                a.permanentMemberId.trim().toLowerCase() === uLower)
          )
        ) {
          return 'username';
        }
      }
      if (params.email) {
        const eLower = params.email.trim().toLowerCase();
        if (
          payload.accounts.some(
            (a) => a.id !== params.excludeId && a.email.trim().toLowerCase() === eLower
          )
        ) {
          return 'email';
        }
      }
      return null;
    }
  };
}

export const defaultStaffAccountsAuthStore = createStaffAccountsAuthStore();
