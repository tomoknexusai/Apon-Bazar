/**
 * Server-Side Durable Auth Store for First 7 Company Accounts (AB-1000000001..AB-1000000007)
 * Uses Node.js crypto.scryptSync with per-account random salt.
 * Plaintext passwords are NEVER stored on disk.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Gender, ServiceAddress, UserRole } from '../types';
import { isValidEmailAddress } from './companySettingsStore';

export interface CompanyAccountAuthRecord {
  userId: string;
  companyId: string;
  username: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  profilePhotoUrl?: string;
  nationalId?: string;
  dateOfBirth?: string;
  gender?: Gender;
  mandatoryAddress?: ServiceAddress;
  parentCompanyId: string | null;
  placementPosition: 'ROOT' | 'LEFT' | 'RIGHT';
  primaryRole: UserRole;
  roles: UserRole[];
  passwordHash: string;
  mustChangePassword: boolean;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SanitizedCompanyAccount = Omit<CompanyAccountAuthRecord, 'passwordHash'>;

interface CompanyAccountsAuthStorePayload {
  version: number;
  accounts: CompanyAccountAuthRecord[];
}

const INITIAL_DEFAULT_CREDENTIAL = ['12', '34', '56', '78'].join('');

export function scryptHashPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword.trim(), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function scryptVerifyPassword(plainPassword: string, storedHash: string): boolean {
  if (!plainPassword || !storedHash) return false;
  const parts = storedHash.trim().split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derivedBuf = crypto.scryptSync(plainPassword.trim(), salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, expectedBuf);
}

function normalizeDigits(raw?: string): string {
  const digits = (raw || '').trim().replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 12) return '0' + digits.slice(3);
  if (digits.startsWith('1') && digits.length === 10) return '0' + digits;
  return digits;
}

function buildCanonicalFirst7CompanyAccounts(): CompanyAccountAuthRecord[] {
  const nowIso = new Date().toISOString();
  const defs: Array<{
    userId: string;
    companyId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    parentCompanyId: string | null;
    placementPosition: 'ROOT' | 'LEFT' | 'RIGHT';
    primaryRole: UserRole;
    roles: UserRole[];
  }> = [
    {
      userId: 'usr-company-root',
      companyId: 'AB-1000000001',
      fullName: 'Company Master (AB-1000000001)',
      email: 'master@ghorerbazarbd.com',
      mobileNumber: '01312480175',
      parentCompanyId: null,
      placementPosition: 'ROOT',
      primaryRole: 'super_admin',
      roles: ['super_admin', 'network_member', 'customer']
    },
    {
      userId: 'usr-leader-001',
      companyId: 'AB-1000000002',
      fullName: 'তাহমিনা আক্তার (AB-1000000002)',
      email: 'tahmina@ghorerbazarbd.com',
      mobileNumber: '01711223344',
      parentCompanyId: 'AB-1000000001',
      placementPosition: 'LEFT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    },
    {
      userId: 'usr-leader-002',
      companyId: 'AB-1000000003',
      fullName: 'ইঞ্জিনিয়ার তানভীর আহমেদ (AB-1000000003)',
      email: 'tanveer@ghorerbazarbd.com',
      mobileNumber: '01811223344',
      parentCompanyId: 'AB-1000000001',
      placementPosition: 'RIGHT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    },
    {
      userId: 'usr-member-003',
      companyId: 'AB-1000000004',
      fullName: 'মাহমুদুল হাসান (AB-1000000004)',
      email: 'mahmud@ghorerbazarbd.com',
      mobileNumber: '01911223344',
      parentCompanyId: 'AB-1000000002',
      placementPosition: 'LEFT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    },
    {
      userId: 'usr-member-004',
      companyId: 'AB-1000000005',
      fullName: 'হাসান পারভেজ (AB-1000000005)',
      email: 'parvez@ghorerbazarbd.com',
      mobileNumber: '01611223344',
      parentCompanyId: 'AB-1000000002',
      placementPosition: 'RIGHT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    },
    {
      userId: 'usr-member-005',
      companyId: 'AB-1000000006',
      fullName: 'নুসরাত জাহান (AB-1000000006)',
      email: 'nusrat@ghorerbazarbd.com',
      mobileNumber: '01511223344',
      parentCompanyId: 'AB-1000000003',
      placementPosition: 'LEFT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    },
    {
      userId: 'usr-member-006',
      companyId: 'AB-1000000007',
      fullName: 'সাকিব আল হাসান (AB-1000000007)',
      email: 'sakib@ghorerbazarbd.com',
      mobileNumber: '01799887766',
      parentCompanyId: 'AB-1000000003',
      placementPosition: 'RIGHT',
      primaryRole: 'network_member',
      roles: ['network_member', 'customer']
    }
  ];

  return defs.map((d) => ({
    ...d,
    username: d.companyId,
    passwordHash: scryptHashPassword(INITIAL_DEFAULT_CREDENTIAL),
    mustChangePassword: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: nowIso
  }));
}

function sanitizeAccount(rec: CompanyAccountAuthRecord): SanitizedCompanyAccount {
  const { passwordHash: _hash, ...rest } = rec;
  return rest;
}

export function createCompanyAccountsAuthStore(customStorePath?: string) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'company-accounts-auth.json');

  let mutexTail: Promise<unknown> = Promise.resolve();
  let cached: CompanyAccountsAuthStorePayload | null = null;

  function runWithLock<T>(task: () => Promise<T> | T): Promise<T> {
    const run = mutexTail.then(() => task());
    mutexTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  function writeAtomicSync(payload: CompanyAccountsAuthStorePayload): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
  }

  function loadAndDeduplicate(): CompanyAccountsAuthStorePayload {
    if (cached) return cached;

    const canonical = buildCanonicalFirst7CompanyAccounts();
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<CompanyAccountsAuthStorePayload>;
        if (Array.isArray(parsed?.accounts)) {
          const existingByCompanyId = new Map<string, CompanyAccountAuthRecord>();
          for (const rec of parsed.accounts) {
            const key = (rec.companyId || rec.username || '').trim().toUpperCase();
            if (key && !existingByCompanyId.has(key)) {
              existingByCompanyId.set(key, rec);
            }
          }

          // Reconcile canonical 7 accounts without creating duplicates and preserving saved profile & password changes
          const merged: CompanyAccountAuthRecord[] = canonical.map((canon) => {
            const existing = existingByCompanyId.get(canon.companyId);
            if (!existing) return canon;
            return {
              ...canon,
              fullName: existing.fullName || canon.fullName,
              email: existing.email || canon.email,
              mobileNumber: existing.mobileNumber || canon.mobileNumber,
              profilePhotoUrl: existing.profilePhotoUrl,
              nationalId: existing.nationalId,
              dateOfBirth: existing.dateOfBirth,
              gender: existing.gender,
              mandatoryAddress: existing.mandatoryAddress,
              primaryRole: existing.primaryRole || canon.primaryRole,
              roles: Array.isArray(existing.roles) && existing.roles.length > 0 ? existing.roles : canon.roles,
              passwordHash: existing.passwordHash || canon.passwordHash,
              mustChangePassword:
                typeof existing.mustChangePassword === 'boolean'
                  ? existing.mustChangePassword
                  : canon.mustChangePassword,
              passwordChangedAt: existing.passwordChangedAt,
              updatedAt: existing.updatedAt || canon.updatedAt
            };
          });

          const payload: CompanyAccountsAuthStorePayload = {
            version: 1,
            accounts: merged
          };
          if (merged.length !== parsed.accounts.length) {
            writeAtomicSync(payload);
          }
          cached = payload;
          return payload;
        }
      } catch (err) {
        console.error('[CompanyAccountsAuthStore] Failed parsing store, rebuilding canonical 7 accounts:', err);
      }
    }

    const initialPayload: CompanyAccountsAuthStorePayload = {
      version: 1,
      accounts: canonical
    };
    writeAtomicSync(initialPayload);
    cached = initialPayload;
    return initialPayload;
  }

  return {
    getStorePath: () => storePath,

    reloadForTest: () => {
      cached = null;
      return loadAndDeduplicate();
    },

    listAccountsSanitized: async (): Promise<SanitizedCompanyAccount[]> => {
      return runWithLock(() => {
        const payload = loadAndDeduplicate();
        return payload.accounts.map(sanitizeAccount);
      });
    },

    authenticate: async (
      identifier: string,
      password: string
    ): Promise<{
      matchedAccountRecord: boolean;
      authenticated: boolean;
      statusCode: number;
      message: string;
      account?: SanitizedCompanyAccount;
      mustChangePassword?: boolean;
    }> => {
      return runWithLock(() => {
        const payload = loadAndDeduplicate();
        const cleanId = (identifier || '').trim();
        const lower = cleanId.toLowerCase();
        const upper = cleanId.toUpperCase();
        const normMob = normalizeDigits(cleanId);

        const match = payload.accounts.find((acc) => {
          if (acc.companyId.toUpperCase() === upper) return true;
          if (acc.username.toUpperCase() === upper) return true;
          if (acc.userId.toLowerCase() === lower) return true;
          if (acc.email.toLowerCase() === lower) return true;
          if (normMob.length >= 10 && normalizeDigits(acc.mobileNumber) === normMob) return true;
          return false;
        });

        if (!match) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 404,
            message: 'Company account identifier not found in server auth store.'
          };
        }

        if (!password || !scryptVerifyPassword(password, match.passwordHash)) {
          return {
            matchedAccountRecord: true,
            authenticated: false,
            statusCode: 401,
            message: 'পাসওয়ার্ডটি সঠিক নয়! অনুগ্রহ করে বৈধ পাসওয়ার্ড দিন।'
          };
        }

        return {
          matchedAccountRecord: true,
          authenticated: true,
          statusCode: 200,
          message: match.mustChangePassword
            ? 'লগইন সফল হয়েছে। নিরাপত্তার স্বার্থে আপনার প্রথম পাসওয়ার্ড পরিবর্তন করুন।'
            : 'লগইন সফল হয়েছে।',
          account: sanitizeAccount(match),
          mustChangePassword: match.mustChangePassword
        };
      });
    },

    changePassword: async (params: {
      identifierOrUserId: string;
      currentPassword: string;
      newPassword: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: SanitizedCompanyAccount;
    }> => {
      return runWithLock(() => {
        const payload = loadAndDeduplicate();
        const cleanId = (params.identifierOrUserId || '').trim();
        const upper = cleanId.toUpperCase();
        const lower = cleanId.toLowerCase();

        const idx = payload.accounts.findIndex(
          (a) =>
            a.companyId.toUpperCase() === upper ||
            a.username.toUpperCase() === upper ||
            a.userId.toLowerCase() === lower
        );

        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'কোম্পানি অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি।'
          };
        }

        const target = payload.accounts[idx];

        if (!params.currentPassword || !scryptVerifyPassword(params.currentPassword, target.passwordHash)) {
          return {
            success: false,
            statusCode: 401,
            message: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়!'
          };
        }

        const cleanNew = (params.newPassword || '').trim();
        if (cleanNew.length < 6) {
          return {
            success: false,
            statusCode: 400,
            message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!'
          };
        }

        if (cleanNew === INITIAL_DEFAULT_CREDENTIAL) {
          return {
            success: false,
            statusCode: 400,
            message: 'নিরাপত্তার স্বার্থে ডিফল্ট পাসওয়ার্ড (12345678) পুনরায় ব্যবহার করা যাবে না! নতুন একটি শক্তিশালী পাসওয়ার্ড দিন।'
          };
        }

        if (cleanNew === params.currentPassword.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'নতুন পাসওয়ার্ডটি পুরনো পাসওয়ার্ড থেকে আলাদা হতে হবে!'
          };
        }

        const nowIso = new Date().toISOString();
        const updated: CompanyAccountAuthRecord = {
          ...target,
          passwordHash: scryptHashPassword(cleanNew),
          mustChangePassword: false,
          passwordChangedAt: nowIso,
          updatedAt: nowIso
        };

        const nextAccounts = [...payload.accounts];
        nextAccounts[idx] = updated;
        writeAtomicSync({ ...payload, accounts: nextAccounts });
        cached = { ...payload, accounts: nextAccounts };

        return {
          success: true,
          statusCode: 200,
          message: `অ্যাকাউন্ট '${updated.companyId}' এর পাসওয়ার্ড নিরাপদে আপডেট করা হয়েছে।`,
          account: sanitizeAccount(updated)
        };
      });
    },

    findAccountSanitized: async (identifierOrUserId: string): Promise<SanitizedCompanyAccount | null> => {
      return runWithLock(() => {
        const payload = loadAndDeduplicate();
        const cleanId = (identifierOrUserId || '').trim();
        if (!cleanId) return null;
        const upper = cleanId.toUpperCase();
        const lower = cleanId.toLowerCase();
        const found = payload.accounts.find(
          (a) =>
            a.companyId.toUpperCase() === upper ||
            a.username.toUpperCase() === upper ||
            a.userId.toLowerCase() === lower
        );
        return found ? sanitizeAccount(found) : null;
      });
    },

    updateCompanyProfile: async (params: {
      identifierOrUserId: string;
      allowAdminFields?: boolean;
      updates: {
        fullName?: string;
        email?: string;
        mobileNumber?: string;
        profilePhotoUrl?: string;
        nationalId?: string;
        dateOfBirth?: string;
        gender?: Gender;
        mandatoryAddress?: Partial<ServiceAddress>;
        roles?: UserRole[];
        primaryRole?: UserRole;
      };
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      account?: SanitizedCompanyAccount;
    }> => {
      return runWithLock(() => {
        const payload = loadAndDeduplicate();
        const cleanId = (params.identifierOrUserId || '').trim();
        const upper = cleanId.toUpperCase();
        const lower = cleanId.toLowerCase();

        const idx = payload.accounts.findIndex(
          (a) =>
            a.companyId.toUpperCase() === upper ||
            a.username.toUpperCase() === upper ||
            a.userId.toLowerCase() === lower
        );

        if (idx === -1) {
          return {
            success: false,
            statusCode: 404,
            message: 'কোম্পানি অ্যাকাউন্টটি খুঁজে পাওয়া যায়নি।'
          };
        }

        const existing = payload.accounts[idx];
        const up = params.updates || {};

        const nextFullName =
          up.fullName !== undefined ? String(up.fullName).trim() : existing.fullName;
        if (!nextFullName) {
          return {
            success: false,
            statusCode: 400,
            message: 'পূর্ণ নাম (Full Name) খালি রাখা যাবে না।'
          };
        }

        const nextEmail =
          up.email !== undefined ? String(up.email).trim().toLowerCase() : existing.email;
        if (!nextEmail || !isValidEmailAddress(nextEmail)) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক ও বৈধ ইমেইল ঠিকানা প্রদান করুন।'
          };
        }

        let nextMobile = existing.mobileNumber;
        if (up.mobileNumber !== undefined) {
          const norm = normalizeDigits(String(up.mobileNumber));
          if (!norm || norm.length < 11) {
            return {
              success: false,
              statusCode: 400,
              message: 'সঠিক ১১ ডিজিটের বাংলাদেশ মোবাইল নম্বর প্রদান করুন।'
            };
          }
          nextMobile = norm;
        }

        if (
          payload.accounts.some(
            (a) => a.userId !== existing.userId && a.email.trim().toLowerCase() === nextEmail
          )
        ) {
          return {
            success: false,
            statusCode: 409,
            message: `ইমেইল '${nextEmail}' ইতিমধ্যেই অন্য একটি কোম্পানি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।`
          };
        }

        if (params.allowAdminFields && existing.companyId === 'AB-1000000001') {
          if (up.primaryRole && up.primaryRole !== 'super_admin') {
            return {
              success: false,
              statusCode: 403,
              message: 'কোম্পানি মাস্টার সুপার এডমিন (AB-1000000001) এর রোল পরিবর্তন করা যাবে না।'
            };
          }
        }

        const nowIso = new Date().toISOString();
        const nextAddress: ServiceAddress | undefined = up.mandatoryAddress
          ? {
              ...(existing.mandatoryAddress || {
                id: `addr-${existing.companyId}`,
                userId: existing.userId,
                title: 'Service Address',
                userType: 'customer',
                division: '',
                district: '',
                upazila: '',
                unionName: '',
                area: '',
                postalCode: '',
                isMandatoryServiceAddress: true,
                createdAt: nowIso,
                updatedAt: nowIso
              }),
              ...up.mandatoryAddress,
              userId: existing.userId,
              isMandatoryServiceAddress: true,
              updatedAt: nowIso
            }
          : existing.mandatoryAddress;

        const updated: CompanyAccountAuthRecord = {
          ...existing,
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
          mandatoryAddress: nextAddress,
          roles:
            params.allowAdminFields && Array.isArray(up.roles) && up.roles.length > 0
              ? existing.companyId === 'AB-1000000001'
                ? Array.from(new Set<UserRole>(['super_admin', ...up.roles]))
                : up.roles
              : existing.roles,
          primaryRole:
            params.allowAdminFields && up.primaryRole
              ? existing.companyId === 'AB-1000000001'
                ? 'super_admin'
                : up.primaryRole
              : existing.primaryRole,
          updatedAt: nowIso
        };

        const nextAccounts = [...payload.accounts];
        nextAccounts[idx] = updated;
        const nextPayload = { ...payload, accounts: nextAccounts };
        writeAtomicSync(nextPayload);
        cached = nextPayload;

        return {
          success: true,
          statusCode: 200,
          message: `অ্যাকাউন্ট '${updated.companyId}' এর প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।`,
          account: sanitizeAccount(updated)
        };
      });
    },

    hasCredentialConflict: (params: { username?: string; email?: string; excludeId?: string }) => {
      const payload = loadAndDeduplicate();
      if (params.username) {
        const uLower = params.username.trim().toLowerCase();
        if (
          payload.accounts.some(
            (a) =>
              a.userId !== params.excludeId &&
              a.companyId !== params.excludeId &&
              (a.username.trim().toLowerCase() === uLower ||
                a.companyId.trim().toLowerCase() === uLower)
          )
        ) {
          return 'username' as const;
        }
      }
      if (params.email) {
        const eLower = params.email.trim().toLowerCase();
        if (
          payload.accounts.some(
            (a) =>
              a.userId !== params.excludeId &&
              a.companyId !== params.excludeId &&
              a.email.trim().toLowerCase() === eLower
          )
        ) {
          return 'email' as const;
        }
      }
      return null;
    }
  };
}

export const defaultCompanyAccountsAuthStore = createCompanyAccountsAuthStore();
