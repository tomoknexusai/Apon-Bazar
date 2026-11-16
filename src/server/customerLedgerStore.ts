/**
 * Durable Server-Side Customer Auth, Wallet Ledger, TOMOK Token Ledger,
 * Package Activation & Earned Rank Store
 * Persists atomically to `.data/customer-ledger-store.json` with promise mutex.
 *
 * ZERO hardcoded demo wallet / TOMOK / starter-package balances for new customers:
 * every balance is computed strictly from ledger entries (defaulting to 0).
 */

import fs from 'fs';
import path from 'path';
import type {
  ActivationPackage,
  CustomerDashboardSummary,
  IdMigrationMapping,
  NetworkMember,
  RankLevel,
  TokenLedgerSummary,
  TokenTransaction,
  UserWallets,
  WalletLedgerSummary,
  WalletTransaction
} from '../types/networkMarketing';
import type { UserRole } from '../types';
import {
  computePlacementLevel,
  computeSubtreeLegStats,
  findBinaryTreeNodeById
} from '../lib/binaryBlankPositionEngine';
import {
  scryptHashPassword,
  scryptVerifyPassword
} from './companyAccountsAuthStore';
import { createCrossProcessLock } from './fileLock';

export interface PersistedCustomerAuthRecord {
  userId: string;
  customerId: string;
  username: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  address?: string;
  nidNumber?: string;
  passwordHash: string;
  primaryRole: UserRole;
  roles: UserRole[];
  sponsorId: string;
  placementParentId: string;
  placementPosition: 'LEFT' | 'RIGHT' | 'ROOT';
  placementLevel: number;
  registeredAt: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  updatedAt: string;
}

export interface PackageActivationRecord {
  id: string;
  userId: string;
  customerId: string;
  packageId: string;
  packageName: string;
  pv: number;
  priceBDT: number;
  paymentSource: 'main_wallet' | 'payment_gateway' | 'admin_verified';
  orderOrPaymentRef: string;
  status: 'active' | 'pending' | 'cancelled';
  activatedAt: string;
}

export interface CustomerLedgerPayload {
  version: number;
  updatedAt: string;
  customerAccounts: PersistedCustomerAuthRecord[];
  walletTransactions: WalletTransaction[];
  tokenTransactions: TokenTransaction[];
  packageActivations: PackageActivationRecord[];
}

export const SERVER_ACTIVATION_PACKAGES: Pick<
  ActivationPackage,
  'id' | 'name' | 'nameBn' | 'pv' | 'priceBDT' | 'isActive'
>[] = [
  { id: 'pkg-100', name: 'Starter Member Package', nameBn: 'স্টার্টার মেম্বার প্যাকেজ (100 PV)', pv: 100, priceBDT: 3500, isActive: true },
  { id: 'pkg-200', name: 'Executive Member Package', nameBn: 'এক্সিকিউটিভ মেম্বার প্যাকেজ (200 PV)', pv: 200, priceBDT: 6800, isActive: true },
  { id: 'pkg-300', name: 'Business Prime Package', nameBn: 'বিজনেস প্রাইম প্যাকেজ (300 PV)', pv: 300, priceBDT: 9900, isActive: true },
  { id: 'pkg-400', name: 'Director Club Package', nameBn: 'ডাইরেক্টর ক্লাব প্যাকেজ (400 PV)', pv: 400, priceBDT: 12900, isActive: true },
  { id: 'pkg-500', name: 'Founder Elite Package', nameBn: 'ফাউন্ডার এলিট প্যাকেজ (500 PV)', pv: 500, priceBDT: 15500, isActive: true }
];

export const SERVER_RANK_THRESHOLDS: Array<{
  rank: RankLevel;
  titleEn: string;
  titleBn: string;
  level: number;
  requiredPV: number;
  requiredTeamPV: number;
  requiredActiveDirects: number;
}> = [
  { rank: 'customer', titleEn: 'Customer', titleBn: 'সাধারণ গ্রাহক', level: 1, requiredPV: 0, requiredTeamPV: 0, requiredActiveDirects: 0 },
  { rank: 'network_member', titleEn: 'Network Member', titleBn: 'নেটওয়ার্ক মেম্বার', level: 2, requiredPV: 100, requiredTeamPV: 500, requiredActiveDirects: 2 },
  { rank: 'senior_network_member', titleEn: 'Senior Network Member', titleBn: 'সিনিয়র নেটওয়ার্ক মেম্বার', level: 3, requiredPV: 200, requiredTeamPV: 2000, requiredActiveDirects: 4 },
  { rank: 'team_leader', titleEn: 'Team Leader', titleBn: 'টিম লিডার', level: 4, requiredPV: 300, requiredTeamPV: 5000, requiredActiveDirects: 6 },
  { rank: 'senior_team_leader', titleEn: 'Senior Team Leader', titleBn: 'সিনিয়র টিম লিডার', level: 5, requiredPV: 400, requiredTeamPV: 12000, requiredActiveDirects: 8 },
  { rank: 'area_manager', titleEn: 'Area Manager', titleBn: 'এরিয়া ম্যানেজার', level: 6, requiredPV: 500, requiredTeamPV: 30000, requiredActiveDirects: 10 },
  { rank: 'regional_manager', titleEn: 'Regional Manager', titleBn: 'রিজিওনাল ম্যানেজার', level: 7, requiredPV: 500, requiredTeamPV: 75000, requiredActiveDirects: 12 },
  { rank: 'general_manager', titleEn: 'General Manager', titleBn: 'জেনারেল ম্যানেজার', level: 8, requiredPV: 500, requiredTeamPV: 180000, requiredActiveDirects: 15 },
  { rank: 'director', titleEn: 'Director Club Member', titleBn: 'ডাইরেক্টর ক্লাব সদস্য', level: 9, requiredPV: 500, requiredTeamPV: 450000, requiredActiveDirects: 20 },
  { rank: 'founder', titleEn: 'Founder Member', titleBn: 'ফাউন্ডার ক্লাব গ্লোবাল পার্টনার', level: 10, requiredPV: 500, requiredTeamPV: 1000000, requiredActiveDirects: 25 }
];

function normalizePhoneDigits(mobile: string): string {
  const digits = (mobile || '').trim().replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 12) return '0' + digits.slice(3);
  if (digits.startsWith('1') && digits.length === 10) return '0' + digits;
  return digits;
}

function buildSeededLegacyTransactions(): WalletTransaction[] {
  // Preserved strictly for the seeded demo customer usr-cust-001 (AB-1000000008).
  // NEVER returned or applied to any newly registered customer (e.g. AB-1000000016).
  return [
    {
      id: 'tx-seed-1',
      userId: 'usr-cust-001',
      walletType: 'commission',
      type: 'credit',
      amount: 12500,
      source: 'binary_matching',
      status: 'completed',
      description: 'বাইনারি ম্যাচিং ও লিডারশিপ কমিশন ক্রেডিট (AB-1000000008)',
      date: '2026-02-20T10:00:00.000Z',
      referenceId: 'SEED-COMM-001'
    },
    {
      id: 'tx-seed-2',
      userId: 'usr-cust-001',
      walletType: 'main',
      type: 'credit',
      amount: 15400,
      source: 'deposit',
      status: 'completed',
      description: 'মেইন ওয়ালেট ডিপোজিট ব্যালেন্স (AB-1000000008)',
      date: '2026-02-22T09:00:00.000Z',
      referenceId: 'SEED-MAIN-001'
    },
    {
      id: 'tx-seed-3',
      userId: 'usr-cust-001',
      walletType: 'pending',
      type: 'credit',
      amount: 3500,
      source: 'sponsor_commission',
      status: 'pending',
      description: 'স্পন্সর পেন্ডিং কমিশন হোল্ড (AB-1000000008)',
      date: '2026-02-25T14:30:00.000Z',
      referenceId: 'SEED-PEND-001'
    },
    {
      id: 'tx-seed-4',
      userId: 'usr-cust-001',
      walletType: 'reward',
      type: 'credit',
      amount: 40000,
      source: 'rank_reward',
      status: 'completed',
      description: 'এরিয়া/টিম লিডার র‍্যাঙ্ক রিওয়ার্ড ক্রেডিট (AB-1000000008)',
      date: '2026-02-26T11:00:00.000Z',
      referenceId: 'SEED-REW-001'
    },
    {
      id: 'tx-seed-5',
      userId: 'usr-cust-001',
      walletType: 'cash',
      type: 'credit',
      amount: 2500,
      source: 'cashback',
      status: 'completed',
      description: 'শপিং ক্যাশব্যাক ক্রেডিট (AB-1000000008)',
      date: '2026-02-27T16:00:00.000Z',
      referenceId: 'SEED-CASH-001'
    }
  ];
}

export function computeWalletsAndSummaryForUser(
  allTransactions: WalletTransaction[],
  ownerKeys: string[]
): {
  wallets: UserWallets;
  summary: WalletLedgerSummary;
  transactions: WalletTransaction[];
} {
  const keySet = new Set(ownerKeys.filter(Boolean).map((k) => k.trim().toLowerCase()));
  const userTx = allTransactions
    .filter((tx) => keySet.has((tx.userId || '').trim().toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const wallets: UserWallets = {
    mainWallet: 0,
    commissionWallet: 0,
    pendingCommissionWallet: 0,
    rewardWallet: 0,
    cashWallet: 0
  };

  let totalCredit = 0;
  let totalDebit = 0;

  for (const tx of userTx) {
    const amt = Math.max(0, Number(tx.amount) || 0);
    if (tx.status === 'rejected') continue;
    const isDebit = tx.type === 'debit' || tx.type === 'withdrawal';
    const isCredit = tx.type === 'credit' || tx.type === 'auto_release';

    if (tx.walletType === 'pending' && tx.status === 'pending') {
      if (isCredit) wallets.pendingCommissionWallet += amt;
      if (isDebit) wallets.pendingCommissionWallet = Math.max(0, wallets.pendingCommissionWallet - amt);
      continue;
    }

    if (tx.walletType === 'commission') {
      if (tx.status === 'completed') {
        if (isCredit) {
          wallets.commissionWallet += amt;
          totalCredit += amt;
        } else if (isDebit) {
          wallets.commissionWallet = Math.max(0, wallets.commissionWallet - amt);
          totalDebit += amt;
        }
      } else if (tx.status === 'pending' || tx.status === 'held_for_review') {
        if (isDebit) {
          wallets.commissionWallet = Math.max(0, wallets.commissionWallet - amt);
          totalDebit += amt;
        } else if (isCredit) {
          wallets.pendingCommissionWallet += amt;
        }
      }
      continue;
    }

    if (tx.status !== 'completed' && !isDebit) continue;

    if (tx.walletType === 'main') {
      wallets.mainWallet = isCredit ? wallets.mainWallet + amt : Math.max(0, wallets.mainWallet - amt);
    } else if (tx.walletType === 'reward') {
      wallets.rewardWallet = isCredit ? wallets.rewardWallet + amt : Math.max(0, wallets.rewardWallet - amt);
    } else if (tx.walletType === 'cash') {
      wallets.cashWallet = isCredit ? wallets.cashWallet + amt : Math.max(0, wallets.cashWallet - amt);
    }
  }

  return {
    wallets,
    summary: {
      openingBalance: 0,
      totalCredit,
      totalDebit,
      availableBalance: wallets.commissionWallet,
      pendingBalance: wallets.pendingCommissionWallet
    },
    transactions: userTx
  };
}

export function computeTokenSummaryForUser(
  allTokens: TokenTransaction[],
  ownerKeys: string[]
): TokenLedgerSummary {
  const keySet = new Set(ownerKeys.filter(Boolean).map((k) => k.trim().toLowerCase()));
  const userTx = allTokens
    .filter((tx) => keySet.has((tx.userId || '').trim().toLowerCase()) || (tx.customerId && keySet.has(tx.customerId.trim().toLowerCase())))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  let totalCredit = 0;
  let totalDebit = 0;

  for (const tx of userTx) {
    if (tx.status !== 'completed') continue;
    const amt = Math.max(0, Number(tx.amount) || 0);
    if (tx.type === 'credit') totalCredit += amt;
    if (tx.type === 'debit') totalDebit += amt;
  }

  return {
    openingBalance: 0,
    totalCredit,
    totalDebit,
    balance: Math.max(0, totalCredit - totalDebit),
    transactions: userTx
  };
}

export function evaluateEarnedRank(params: {
  personalPV: number;
  teamPV: number;
  activeDirectReferrals: number;
  hasActivePackage: boolean;
  historicalRank?: RankLevel;
  rankAchievedAt?: string | null;
}): {
  rank: RankLevel;
  titleBn: string;
  titleEn: string;
  qualificationStatus: 'qualified' | 'unqualified' | 'initial';
  achievedDate: string | null;
} {
  const { personalPV, teamPV, activeDirectReferrals, hasActivePackage, rankAchievedAt } = params;

  // Walk highest to lowest rank whose real criteria are satisfied
  let qualifiedTier = SERVER_RANK_THRESHOLDS[0];
  for (let i = SERVER_RANK_THRESHOLDS.length - 1; i >= 1; i--) {
    const tier = SERVER_RANK_THRESHOLDS[i];
    if (
      hasActivePackage &&
      personalPV >= tier.requiredPV &&
      teamPV >= tier.requiredTeamPV &&
      activeDirectReferrals >= tier.requiredActiveDirects
    ) {
      qualifiedTier = tier;
      break;
    }
  }

  if (qualifiedTier.rank !== 'customer') {
    return {
      rank: qualifiedTier.rank,
      titleBn: qualifiedTier.titleBn,
      titleEn: qualifiedTier.titleEn,
      qualificationStatus: 'qualified',
      achievedDate: rankAchievedAt || new Date().toISOString()
    };
  }

  return {
    rank: 'customer',
    titleBn: 'সাধারণ গ্রাহক',
    titleEn: 'Customer',
    qualificationStatus: hasActivePackage ? 'initial' : 'unqualified',
    achievedDate: null
  };
}

export function createCustomerLedgerStore(customStorePath?: string) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'customer-ledger-store.json');

  const runWithLock = createCrossProcessLock(storePath);
  let cachedPayload: CustomerLedgerPayload | null = null;
  let cachedMtimeMs = 0;
  let cachedSize = -1;

  function writeAtomicSync(payload: CustomerLedgerPayload): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
    try {
      const st = fs.statSync(storePath);
      cachedMtimeMs = st.mtimeMs;
      cachedSize = st.size;
    } catch {
      cachedMtimeMs = 0;
      cachedSize = -1;
    }
  }

  function loadFromDisk(): CustomerLedgerPayload {
    if (fs.existsSync(storePath)) {
      try {
        const st = fs.statSync(storePath);
        if (cachedPayload && st.mtimeMs === cachedMtimeMs && st.size === cachedSize) {
          return cachedPayload;
        }
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<CustomerLedgerPayload>;
        if (parsed && Array.isArray(parsed.customerAccounts)) {
          const payload: CustomerLedgerPayload = {
            version: Number(parsed.version) || 1,
            updatedAt: parsed.updatedAt || new Date().toISOString(),
            customerAccounts: parsed.customerAccounts || [],
            walletTransactions: Array.isArray(parsed.walletTransactions)
              ? parsed.walletTransactions
              : buildSeededLegacyTransactions(),
            tokenTransactions: Array.isArray(parsed.tokenTransactions)
              ? parsed.tokenTransactions
              : [],
            packageActivations: Array.isArray(parsed.packageActivations)
              ? parsed.packageActivations
              : []
          };
          cachedPayload = payload;
          cachedMtimeMs = st.mtimeMs;
          cachedSize = st.size;
          return payload;
        }
      } catch (err) {
        console.error('[CustomerLedgerStore] Failed parsing store, initializing fresh:', err);
      }
    }

    const initialPayload: CustomerLedgerPayload = {
      version: 1,
      updatedAt: new Date().toISOString(),
      customerAccounts: [],
      walletTransactions: buildSeededLegacyTransactions(),
      tokenTransactions: [],
      packageActivations: []
    };
    writeAtomicSync(initialPayload);
    cachedPayload = initialPayload;
    return initialPayload;
  }

  function savePayload(payload: CustomerLedgerPayload): CustomerLedgerPayload {
    const next = {
      ...payload,
      version: (payload.version || 0) + 1,
      updatedAt: new Date().toISOString()
    };
    writeAtomicSync(next);
    cachedPayload = next;
    return next;
  }

  return {
    getStorePath: () => storePath,

    upsertRegisteredCustomerAccount: async (params: {
      userId: string;
      customerId: string;
      username: string;
      fullName: string;
      mobileNumber: string;
      email: string;
      address?: string;
      nidNumber?: string;
      plainPassword: string;
      sponsorId: string;
      placementParentId: string;
      placementPosition: 'LEFT' | 'RIGHT' | 'ROOT';
      placementLevel: number;
      registeredAt: string;
    }): Promise<PersistedCustomerAuthRecord> => {
      return runWithLock(() => {
        const payload = loadFromDisk();
        const normMobile = normalizePhoneDigits(params.mobileNumber);
        const nowIso = new Date().toISOString();
        const existingIdx = payload.customerAccounts.findIndex(
          (a) =>
            a.customerId.toUpperCase() === params.customerId.toUpperCase() ||
            a.userId === params.userId
        );

        const record: PersistedCustomerAuthRecord = {
          userId: params.userId,
          customerId: params.customerId,
          username: params.username || params.customerId,
          fullName: params.fullName,
          mobileNumber: normMobile || params.mobileNumber,
          email: (params.email || '').trim().toLowerCase(),
          address: params.address,
          nidNumber: params.nidNumber,
          passwordHash: scryptHashPassword(params.plainPassword),
          primaryRole: 'customer',
          roles: ['customer'],
          sponsorId: params.sponsorId,
          placementParentId: params.placementParentId,
          placementPosition: params.placementPosition,
          placementLevel: params.placementLevel,
          registeredAt: params.registeredAt || nowIso,
          accountStatus: 'active',
          updatedAt: nowIso
        };

        const accounts = [...payload.customerAccounts];
        if (existingIdx >= 0) {
          accounts[existingIdx] = record;
        } else {
          accounts.unshift(record);
        }

        savePayload({
          ...payload,
          customerAccounts: accounts
        });

        return record;
      });
    },

    findAccountByUserIdOrCustomerId: async (
      idOrUserId: string
    ): Promise<Omit<PersistedCustomerAuthRecord, 'passwordHash'> | null> => {
      return runWithLock(() => {
        const clean = (idOrUserId || '').trim().toLowerCase();
        if (!clean) return null;
        const payload = loadFromDisk();
        const match = payload.customerAccounts.find(
          (a) =>
            a.userId.toLowerCase() === clean ||
            a.customerId.toLowerCase() === clean ||
            a.username.toLowerCase() === clean ||
            normalizePhoneDigits(a.mobileNumber) === normalizePhoneDigits(clean)
        );
        if (!match) return null;
        const { passwordHash: _omit, ...sanitized } = match;
        return sanitized;
      });
    },

    authenticateCustomer: async (
      identifier: string,
      password: string
    ): Promise<{
      matchedAccountRecord: boolean;
      authenticated: boolean;
      statusCode: number;
      message: string;
      account?: Omit<PersistedCustomerAuthRecord, 'passwordHash'> & {
        companyId: string;
        mustChangePassword: boolean;
      };
    }> => {
      return runWithLock(() => {
        const clean = (identifier || '').trim().toLowerCase();
        const normDigits = normalizePhoneDigits(identifier || '');
        const cleanPass = (password || '').trim();
        if (!clean || !cleanPass) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 400,
            message: 'Customer ID / মোবাইল নম্বর এবং পাসওয়ার্ড দিন।'
          };
        }

        const payload = loadFromDisk();
        const candidates = payload.customerAccounts.filter((a) => {
          if (a.customerId.toLowerCase() === clean) return true;
          if (a.username.toLowerCase() === clean) return true;
          if (a.userId.toLowerCase() === clean) return true;
          if (a.email && a.email.toLowerCase() === clean) return true;
          if (normDigits && normDigits.length >= 10 && normalizePhoneDigits(a.mobileNumber) === normDigits) return true;
          return false;
        });

        if (candidates.length === 0) {
          return {
            matchedAccountRecord: false,
            authenticated: false,
            statusCode: 404,
            message: 'কোনো নিবন্ধিত অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।'
          };
        }

        const verified = candidates.find((c) => scryptVerifyPassword(cleanPass, c.passwordHash));
        if (!verified) {
          return {
            matchedAccountRecord: true,
            authenticated: false,
            statusCode: 401,
            message: 'পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।'
          };
        }

        const { passwordHash: _omit, ...sanitized } = verified;
        return {
          matchedAccountRecord: true,
          authenticated: true,
          statusCode: 200,
          message: 'লগইন সফল হয়েছে!',
          account: {
            ...sanitized,
            companyId: sanitized.customerId,
            mustChangePassword: false
          }
        };
      });
    },

    getCustomerDashboardSummary: async (params: {
      targetCustomerId: string;
      nodes: NetworkMember[];
      mappings?: IdMigrationMapping[];
      appOrigin?: string;
    }): Promise<CustomerDashboardSummary | null> => {
      return runWithLock(() => {
        const payload = loadFromDisk();
        const cleanTarget = (params.targetCustomerId || '').trim();
        const origin = (params.appOrigin || '').replace(/\/$/, '');

        const node = findBinaryTreeNodeById(params.nodes, cleanTarget, params.mappings);
        const authAccount = payload.customerAccounts.find(
          (a) =>
            a.customerId.toLowerCase() === cleanTarget.toLowerCase() ||
            a.userId.toLowerCase() === cleanTarget.toLowerCase()
        );

        if (!node && !authAccount) {
          return null;
        }

        const customerId = node?.id || authAccount?.customerId || cleanTarget;
        const userId = node?.userId || authAccount?.userId || customerId;
        const fullName = node?.fullName || authAccount?.fullName || '';
        const mobile = node?.mobile || authAccount?.mobileNumber || '';
        const email = node?.email || authAccount?.email || '';

        const sponsorId = node?.sponsorId || node?.referralId || authAccount?.sponsorId || '';
        const sponsorNode = sponsorId
          ? findBinaryTreeNodeById(params.nodes, sponsorId, params.mappings)
          : undefined;
        const sponsorName = node?.sponsorName || sponsorNode?.fullName || (sponsorId ? sponsorId : 'N/A');

        const placementParentId =
          customerId === 'AB-1000000001'
            ? null
            : node?.parentId || node?.placementId || authAccount?.placementParentId || null;
        const placementParentNode = placementParentId
          ? findBinaryTreeNodeById(params.nodes, placementParentId, params.mappings)
          : undefined;
        const placementParentName = placementParentNode?.fullName || null;

        const placementPosition: CustomerDashboardSummary['placementPosition'] =
          customerId === 'AB-1000000001'
            ? 'ROOT'
            : node
            ? node.placementLeg === 'left' || String(node.position).toUpperCase() === 'LEFT'
              ? 'LEFT'
              : 'RIGHT'
            : authAccount?.placementPosition || 'UNPLACED';

        const placementLevel = node
          ? node.placementLevel || computePlacementLevel(params.nodes, node.id)
          : authAccount?.placementLevel || 0;

        const registrationTimestamp =
          node?.registeredAt || node?.created_at || authAccount?.registeredAt || '';

        const legStats = node
          ? computeSubtreeLegStats(params.nodes, node.id)
          : {
              left: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, computedSubtreePV: 0, recordedLegPV: 0, carryForwardPV: 0, totalEligiblePV: 0 },
              right: { totalMembers: 0, activeMembers: 0, inactiveMembers: 0, computedSubtreePV: 0, recordedLegPV: 0, carryForwardPV: 0, totalEligiblePV: 0 },
              matchingPV: 0
            };

        const activePackageRecord = payload.packageActivations.find(
          (p) =>
            p.status === 'active' &&
            (p.customerId.toLowerCase() === customerId.toLowerCase() || p.userId === userId)
        );

        const personalPV = Math.max(0, Number(node?.pv ?? activePackageRecord?.pv ?? 0));
        const hasActivePackage =
          Boolean(activePackageRecord) ||
          (Boolean(node?.packageId) && personalPV > 0 && node?.active !== false && node?.status !== 'inactive');

        const activationPackage: CustomerDashboardSummary['activationPackage'] = hasActivePackage
          ? {
              packageId: activePackageRecord?.packageId || node?.packageId || null,
              packageName: activePackageRecord?.packageName || node?.packageName || `${personalPV} PV Package`,
              pv: personalPV,
              status: 'active',
              activationDate: activePackageRecord?.activatedAt || node?.activationDate || registrationTimestamp || null,
              orderOrPaymentRef: activePackageRecord?.orderOrPaymentRef || node?.orderOrPaymentRef || null
            }
          : {
              packageId: null,
              packageName: 'কোনো সক্রিয় প্যাকেজ নেই',
              pv: 0,
              status: 'inactive',
              activationDate: null,
              orderOrPaymentRef: null
            };

        // Direct active referrals count strictly verified from tree nodes
        const activeDirectReferrals = params.nodes.filter(
          (n) =>
            n.nodeStatus !== 'blank' &&
            !n.isBlankSlot &&
            n.id !== customerId &&
            (n.sponsorId || n.referralId) === customerId &&
            n.active !== false &&
            n.status !== 'inactive' &&
            (n.pv || 0) > 0
        ).length;

        const totalTeamPV = legStats.left.totalEligiblePV + legStats.right.totalEligiblePV;
        const seededPresetTier =
          node && node.id <= 'AB-1000000015' && node.rank && node.rank !== 'customer'
            ? SERVER_RANK_THRESHOLDS.find((r) => r.rank === node.rank)
            : undefined;

        const evaluatedRank = seededPresetTier
          ? {
              rank: seededPresetTier.rank,
              titleBn: seededPresetTier.titleBn,
              titleEn: seededPresetTier.titleEn,
              qualificationStatus: 'qualified' as const,
              achievedDate: node?.rankAchievedAt || registrationTimestamp || null
            }
          : evaluateEarnedRank({
              personalPV,
              teamPV: totalTeamPV,
              activeDirectReferrals,
              hasActivePackage,
              rankAchievedAt: node?.rankAchievedAt || activationPackage.activationDate
            });

        const ownerKeys = [userId, customerId];
        const walletData = computeWalletsAndSummaryForUser(payload.walletTransactions, ownerKeys);
        const tokenData = computeTokenSummaryForUser(payload.tokenTransactions, ownerKeys);

        const accountStatus = authAccount?.accountStatus || (node ? 'active' : 'inactive');
        const networkStatus: CustomerDashboardSummary['networkStatus'] = !node
          ? 'unplaced'
          : hasActivePackage
          ? 'active'
          : 'inactive';

        const referralLink = origin
          ? `${origin}/register?ref=${customerId}`
          : `/register?ref=${customerId}`;

        return {
          customerId,
          userId,
          fullName,
          mobile,
          email,
          accountStatus,
          networkStatus,
          referralCode: customerId,
          referralLink,
          sponsorId,
          sponsorName,
          placementParentId,
          placementParentName,
          placementPosition,
          placementLevel,
          registrationTimestamp,
          leftLeg: legStats.left,
          rightLeg: legStats.right,
          matchingPV: legStats.matchingPV,
          personalPV,
          activationPackage,
          earnedRank: {
            ...evaluatedRank,
            activeDirectReferrals,
            teamPV: totalTeamPV
          },
          wallets: walletData.wallets,
          walletSummary: walletData.summary,
          walletTransactions: walletData.transactions,
          tokenSummary: tokenData
        };
      });
    },

    recordPackageActivationLedger: async (params: {
      userId: string;
      customerId: string;
      packageId: string;
      paymentSource?: 'main_wallet' | 'payment_gateway' | 'admin_verified';
      orderOrPaymentRef?: string;
      sponsorUserId?: string;
      sponsorCustomerId?: string;
      sponsorCommissionPct?: number;
      memberFullName?: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      pkg?: (typeof SERVER_ACTIVATION_PACKAGES)[number];
      activationRecord?: PackageActivationRecord;
    }> => {
      return runWithLock(() => {
        const pkg = SERVER_ACTIVATION_PACKAGES.find((p) => p.id === params.packageId);
        if (!pkg) {
          return {
            success: false,
            statusCode: 404,
            message: 'অ্যাক্টিভেশন প্যাকেজ খুঁজে পাওয়া যায়নি।'
          };
        }

        const payload = loadFromDisk();
        const paymentSource = params.paymentSource || 'main_wallet';
        const ownerKeys = [params.userId, params.customerId];
        const currentWallets = computeWalletsAndSummaryForUser(payload.walletTransactions, ownerKeys);

        if (paymentSource === 'main_wallet' && currentWallets.wallets.mainWallet < pkg.priceBDT) {
          return {
            success: false,
            statusCode: 400,
            message: `আপনার মেইন ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন: ৳${pkg.priceBDT.toLocaleString()}, বর্তমান ব্যালেন্স: ৳${currentWallets.wallets.mainWallet.toLocaleString()}।`
          };
        }

        if (paymentSource === 'payment_gateway' && !params.orderOrPaymentRef?.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'প্যাকেজ অ্যাক্টিভেশনের জন্য বৈধ পেমেন্ট/অর্ডার রেফারেন্স আবশ্যক।'
          };
        }

        const nowIso = new Date().toISOString();
        const orderRef =
          params.orderOrPaymentRef?.trim() ||
          `PKG-${pkg.pv}-${Date.now().toString().slice(-6)}`;

        const newWalletTx: WalletTransaction[] = [];
        if (paymentSource === 'main_wallet') {
          newWalletTx.push({
            id: `tx-pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: params.userId,
            walletType: 'main',
            type: 'debit',
            amount: pkg.priceBDT,
            source: 'package_activation',
            status: 'completed',
            description: `${pkg.nameBn} অ্যাক্টিভেশন (${pkg.pv} PV)`,
            date: nowIso,
            referenceId: orderRef
          });
        }

        if (params.sponsorUserId && params.sponsorUserId !== params.userId) {
          const pct = Number(params.sponsorCommissionPct) || 15;
          const sponsorBonus = Math.round((pkg.priceBDT * pct) / 100);
          if (sponsorBonus > 0) {
            newWalletTx.push({
              id: `tx-sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: params.sponsorUserId,
              walletType: 'pending',
              type: 'credit',
              amount: sponsorBonus,
              source: 'sponsor_commission',
              status: 'pending',
              description: `স্পন্সর ডাইরেক্ট কমিশন (${params.memberFullName || params.customerId} - ${pkg.pv} PV)`,
              date: nowIso,
              referenceId: orderRef
            });
          }
        }

        const activationRecord: PackageActivationRecord = {
          id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: params.userId,
          customerId: params.customerId,
          packageId: pkg.id,
          packageName: pkg.nameBn,
          pv: pkg.pv,
          priceBDT: pkg.priceBDT,
          paymentSource,
          orderOrPaymentRef: orderRef,
          status: 'active',
          activatedAt: nowIso
        };

        // Mark older activation records for this user superseded only in history or keep latest active
        const nextActivations = [
          activationRecord,
          ...payload.packageActivations.map((rec) =>
            rec.customerId.toLowerCase() === params.customerId.toLowerCase() && rec.status === 'active'
              ? { ...rec, status: 'cancelled' as const }
              : rec
          )
        ];

        savePayload({
          ...payload,
          walletTransactions: [...newWalletTx, ...payload.walletTransactions],
          packageActivations: nextActivations
        });

        return {
          success: true,
          statusCode: 200,
          message: `অভিনন্দন! '${pkg.nameBn}' সফলভাবে অ্যাক্টিভ হয়েছে এবং ${pkg.pv} PV যুক্ত হয়েছে।`,
          pkg,
          activationRecord
        };
      });
    },

    recordWalletTransaction: async (params: {
      userId: string;
      customerId?: string;
      walletType: WalletTransaction['walletType'];
      type: WalletTransaction['type'];
      amount: number;
      source: WalletTransaction['source'];
      status?: WalletTransaction['status'];
      description: string;
      referenceId?: string;
    }): Promise<{ success: boolean; statusCode: number; message: string; transaction?: WalletTransaction }> => {
      return runWithLock(() => {
        const amt = Math.max(0, Number(params.amount) || 0);
        if (amt <= 0) {
          return { success: false, statusCode: 400, message: 'পরিমাণ অবশ্যই শূন্যের বেশি হতে হবে।' };
        }
        const payload = loadFromDisk();
        const ownerKeys = [params.userId, params.customerId || ''].filter(Boolean);
        const currentWallets = computeWalletsAndSummaryForUser(payload.walletTransactions, ownerKeys);

        if (params.type === 'debit' || params.type === 'withdrawal') {
          const bal =
            params.walletType === 'commission'
              ? currentWallets.wallets.commissionWallet
              : params.walletType === 'main'
              ? currentWallets.wallets.mainWallet
              : params.walletType === 'reward'
              ? currentWallets.wallets.rewardWallet
              : params.walletType === 'cash'
              ? currentWallets.wallets.cashWallet
              : currentWallets.wallets.pendingCommissionWallet;
          if (bal < amt) {
            return {
              success: false,
              statusCode: 400,
              message: `অপর্যাপ্ত ব্যালেন্স! বর্তমান ব্যালেন্স: ৳${bal.toLocaleString()}`
            };
          }
        }

        const tx: WalletTransaction = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: params.userId,
          walletType: params.walletType,
          type: params.type,
          amount: amt,
          source: params.source,
          status: params.status || 'completed',
          description: params.description,
          date: new Date().toISOString(),
          referenceId: params.referenceId
        };

        savePayload({
          ...payload,
          walletTransactions: [tx, ...payload.walletTransactions]
        });

        return {
          success: true,
          statusCode: 200,
          message: 'ওয়ালেট লেনদেন সফলভাবে সংরক্ষিত হয়েছে।',
          transaction: tx
        };
      });
    },

    recordTokenTransaction: async (params: {
      userId: string;
      customerId?: string;
      type: 'credit' | 'debit';
      amount: number;
      source: TokenTransaction['source'];
      description: string;
      referenceId?: string;
    }): Promise<{ success: boolean; statusCode: number; message: string; transaction?: TokenTransaction }> => {
      return runWithLock(() => {
        const amt = Math.max(0, Number(params.amount) || 0);
        if (amt <= 0) {
          return { success: false, statusCode: 400, message: 'টোকেনের পরিমাণ শূন্যের বেশি হতে হবে।' };
        }
        const payload = loadFromDisk();
        const ownerKeys = [params.userId, params.customerId || ''].filter(Boolean);
        const currentToken = computeTokenSummaryForUser(payload.tokenTransactions, ownerKeys);

        if (params.type === 'debit' && currentToken.balance < amt) {
          return {
            success: false,
            statusCode: 400,
            message: `অপর্যাপ্ত TOMOK টোকেন ব্যালেন্স! বর্তমান ব্যালেন্স: ${currentToken.balance}`
          };
        }

        const tx: TokenTransaction = {
          id: `tmk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: params.userId,
          customerId: params.customerId,
          type: params.type,
          amount: amt,
          source: params.source,
          status: 'completed',
          description: params.description,
          referenceId: params.referenceId,
          createdAt: new Date().toISOString()
        };

        savePayload({
          ...payload,
          tokenTransactions: [tx, ...payload.tokenTransactions]
        });

        return {
          success: true,
          statusCode: 200,
          message: 'TOMOK টোকেন লেজার সফলভাবে আপডেট হয়েছে।',
          transaction: tx
        };
      });
    },

    hasCredentialConflict: (params: { username?: string; email?: string; excludeId?: string }) => {
      const payload = loadFromDisk();
      if (params.username) {
        const uLower = params.username.trim().toLowerCase();
        if (
          payload.customerAccounts.some(
            (a) =>
              a.userId !== params.excludeId &&
              a.customerId !== params.excludeId &&
              (a.username.trim().toLowerCase() === uLower ||
                a.customerId.trim().toLowerCase() === uLower)
          )
        ) {
          return 'username' as const;
        }
      }
      if (params.email) {
        const eLower = params.email.trim().toLowerCase();
        if (
          payload.customerAccounts.some(
            (a) =>
              a.userId !== params.excludeId &&
              a.customerId !== params.excludeId &&
              a.email &&
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

export const defaultCustomerLedgerStore = createCustomerLedgerStore();
