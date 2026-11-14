/**
 * Network Marketing Engine Context Provider
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import {
  ActivationPackage,
  AIActivationPlacementResult,
  AISmartGeoResult,
  BinaryTreePersistenceState,
  CommissionConfig,
  NetworkMember,
  NetworkReportData,
  RankLevel,
  RankRequirement,
  UserWallets,
  WalletTransaction,
  WalletType,
  WithdrawalMethod,
  WithdrawalRequest,
  ReservedSlot,
  MatchingRecord,
  COMPANY_MASTER_ROOT_ID
} from '../types/networkMarketing';
import { calculateIdGrade } from '../lib/binaryNetworkEngine';
import { INITIAL_MATCHING_HISTORY, SEED_BINARY_MEMBERS } from '../lib/seedBinaryMembers';
import {
  BlankSlotRegistrationParams,
  BlankSlotRegistrationResult,
  IsolatedSubtreeStats,
  executeAtomicBlankSlotRegistration,
  extractIsolatedBinarySubtree,
  findBinaryTreeNodeById,
  formatBinaryCompanyId,
  isCompanyIdInSubtree,
  parseBinaryCompanyIdSeq,
  reconcileBinaryTreeState
} from '../lib/binaryBlankPositionEngine';

export interface IsolatedSubtreeApiResponse {
  success: boolean;
  statusCode: number;
  errorCode?: 'INVALID_INPUT' | 'ACCESS_DENIED' | 'NOT_FOUND';
  message: string;
  rootId?: string;
  rootNode?: NetworkMember;
  nodes?: NetworkMember[];
  stats?: IsolatedSubtreeStats;
  authorizedScope?: 'admin_full' | 'member_subtree';
}

export { INITIAL_MATCHING_HISTORY };

// ----------------------------------------------------------------------
// Default Activation Packages (100 PV - 500 PV)
// ----------------------------------------------------------------------
const DEFAULT_PACKAGES: ActivationPackage[] = [
  {
    id: 'pkg-100',
    name: 'Starter Member Package',
    nameBn: 'স্টার্টার মেম্বার প্যাকেজ (100 PV)',
    pv: 100,
    priceBDT: 3500,
    benefitsBn: [
      '১০০ PV পয়েন্ট অ্যাক্টিভেশন',
      '১০% স্পন্সর কমিশন এলিজিবিলিটি',
      'দৈনিক ৫,০০০ টাকা পর্যন্ত বাইনারি ম্যাচিং ক্যাপ',
      '৫ জেনারেশন পর্যন্ত ইনকাম এক্সেস'
    ],
    benefitsEn: [
      '100 PV Point Activation',
      '10% Sponsor Commission Eligibility',
      'Daily Binary Matching Cap up to BDT 5,000',
      'Access to 5 Generation Incomes'
    ],
    isActive: true
  },
  {
    id: 'pkg-200',
    name: 'Executive Member Package',
    nameBn: 'এক্সিকিউটিভ মেম্বার প্যাকেজ (200 PV)',
    pv: 200,
    priceBDT: 6800,
    benefitsBn: [
      '২০০ PV পয়েন্ট অ্যাক্টিভেশন',
      '১২% স্পন্সর কমিশন এলিজিবিলিটি',
      'দৈনিক ১০,০০০ টাকা বাইনারি ম্যাচিং ক্যাপ',
      '১০ জেনারেশন জেনারেশনাল বোনাস'
    ],
    benefitsEn: [
      '200 PV Point Activation',
      '12% Sponsor Commission Eligibility',
      'Daily Binary Cap BDT 10,000',
      '10 Generations Bonus Access'
    ],
    isPopular: true,
    isActive: true
  },
  {
    id: 'pkg-300',
    name: 'Business Prime Package',
    nameBn: 'বিজনেস প্রাইম প্যাকেজ (300 PV)',
    pv: 300,
    priceBDT: 9900,
    benefitsBn: [
      '৩০০ PV পয়েন্ট অ্যাক্টিভেশন',
      '১৫% স্পন্সর কমিশন এলিজিবিলিটি',
      'দৈনিক ১৫,০০০ টাকা বাইনারি ম্যাচিং ক্যাপ',
      '১৫ জেনারেশন ক্যাশব্যাক ও গ্লোবাল লিডারশিপ রিওয়ার্ড'
    ],
    benefitsEn: [
      '300 PV Point Activation',
      '15% Sponsor Commission',
      'Daily Binary Cap BDT 15,000',
      '15 Generations Global Leadership Rewards'
    ],
    isActive: true
  },
  {
    id: 'pkg-400',
    name: 'Director Club Package',
    nameBn: 'ডাইরেক্টর ক্লাব প্যাকেজ (400 PV)',
    pv: 400,
    priceBDT: 12900,
    benefitsBn: [
      '৪০০ PV পয়েন্ট অ্যাক্টিভেশন',
      '১৮% স্পন্সর কমিশন',
      'দৈনিক ২৫,০০০ টাকা বাইনারি ম্যাচিং ক্যাপ',
      '১৮ জেনারেশন পর্যন্ত অটো কমিশন রিওয়ার্ডস'
    ],
    benefitsEn: [
      '400 PV Point Activation',
      '18% Sponsor Commission',
      'Daily Binary Cap BDT 25,000',
      '18 Generations Auto Rewards'
    ],
    isActive: true
  },
  {
    id: 'pkg-500',
    name: 'Founder Elite Package',
    nameBn: 'ফাউন্ডার এলিট প্যাকেজ (500 PV)',
    pv: 500,
    priceBDT: 15500,
    benefitsBn: [
      '৫০০ PV পয়েন্ট হাই-ভ্যালু অ্যাক্টিভেশন',
      '২০% সর্বোচ্চ স্পন্সর কমিশন',
      'দৈনিক ৫০,০০০ টাকা সর্বোচ্চ বাইনারি ক্যাপ',
      '২০ জেনারেশন সম্পূর্ণ জেনারেশন বোনাস + কার ও হাউজ ফান্ড ইনসেন্টিভ'
    ],
    benefitsEn: [
      '500 PV High-Value Activation',
      '20% Max Sponsor Commission',
      'Daily Binary Cap BDT 50,000',
      'Full 20 Generations Bonus + Car & House Fund'
    ],
    isPopular: true,
    isActive: true
  }
];

// ----------------------------------------------------------------------
// Default Ranks (10 Levels: Customer to Founder)
// ----------------------------------------------------------------------
const DEFAULT_RANKS: RankRequirement[] = [
  {
    rank: 'customer',
    titleEn: 'Customer',
    titleBn: 'সাধারণ গ্রাহক',
    level: 1,
    requiredPV: 0,
    requiredTeamPV: 0,
    requiredActiveDirects: 0,
    rewardType: 'recognition',
    rewardTitleBn: 'স্বাগতম বোনাস ৫% ক্যাশব্যাক',
    rewardTitleEn: 'Welcome Bonus 5% Cashback',
    rewardValueBDT: 0,
    badgeIcon: 'ShoppingBag',
    certificateAvailable: false
  },
  {
    rank: 'network_member',
    titleEn: 'Network Member',
    titleBn: 'নেটওয়ার্ক মেম্বার',
    level: 2,
    requiredPV: 100,
    requiredTeamPV: 500,
    requiredActiveDirects: 2,
    rewardType: 'cash',
    rewardTitleBn: '৳ ১,০০০ নগদ র‍্যাঙ্ক প্রমোশন বোনাস',
    rewardTitleEn: 'BDT 1,000 Cash Rank Promotion Bonus',
    rewardValueBDT: 1000,
    badgeIcon: 'Award',
    certificateAvailable: true
  },
  {
    rank: 'senior_network_member',
    titleEn: 'Senior Network Member',
    titleBn: 'সিনিয়র নেটওয়ার্ক মেম্বার',
    level: 3,
    requiredPV: 200,
    requiredTeamPV: 2000,
    requiredActiveDirects: 4,
    rewardType: 'cash',
    rewardTitleBn: '৳ ২,৫০০ নগদ প্রমোশন ইনসেন্টিভ',
    rewardTitleEn: 'BDT 2,500 Cash Promotion Incentive',
    rewardValueBDT: 2500,
    badgeIcon: 'ShieldCheck',
    certificateAvailable: true
  },
  {
    rank: 'team_leader',
    titleEn: 'Team Leader',
    titleBn: 'টিম লিডার',
    level: 4,
    requiredPV: 300,
    requiredTeamPV: 5000,
    requiredActiveDirects: 6,
    rewardType: 'gift',
    rewardTitleBn: 'স্মার্টফোন বা ৳ ৮,০০০ গিফট বোনাস',
    rewardTitleEn: 'Smartphone or BDT 8,000 Gift Bonus',
    rewardValueBDT: 8000,
    badgeIcon: 'Users',
    certificateAvailable: true
  },
  {
    rank: 'senior_team_leader',
    titleEn: 'Senior Team Leader',
    titleBn: 'সিনিয়র টিম লিডার',
    level: 5,
    requiredPV: 400,
    requiredTeamPV: 12000,
    requiredActiveDirects: 8,
    rewardType: 'gift',
    rewardTitleBn: 'স্মার্ট ল্যাপটপ বা ৳ ২৫,০০০ ক্যাশ ইনসেন্টিভ',
    rewardTitleEn: 'Laptop or BDT 25,000 Cash Incentive',
    rewardValueBDT: 25000,
    badgeIcon: 'Briefcase',
    certificateAvailable: true
  },
  {
    rank: 'area_manager',
    titleEn: 'Area Manager',
    titleBn: 'এরিয়া ম্যানেজার',
    level: 6,
    requiredPV: 500,
    requiredTeamPV: 30000,
    requiredActiveDirects: 10,
    rewardType: 'travel',
    rewardTitleBn: 'কক্সবাজার ৩ দিন ২ রাত কাপল ট্যুর বা ৳ ৪০,০০০',
    rewardTitleEn: 'Cox’s Bazar Couple Tour or BDT 40,000',
    rewardValueBDT: 40000,
    badgeIcon: 'Navigation',
    certificateAvailable: true
  },
  {
    rank: 'regional_manager',
    titleEn: 'Regional Manager',
    titleBn: 'রিজিওনাল ম্যানেজার',
    level: 7,
    requiredPV: 500,
    requiredTeamPV: 75000,
    requiredActiveDirects: 12,
    rewardType: 'travel',
    rewardTitleBn: 'থাইল্যান্ড/মালয়েশিয়া ৫ দিন ট্যুর বা ৳ ১,২০,০০০',
    rewardTitleEn: 'Thailand/Malaysia Tour or BDT 120,000',
    rewardValueBDT: 120000,
    badgeIcon: 'Globe',
    certificateAvailable: true
  },
  {
    rank: 'general_manager',
    titleEn: 'General Manager',
    titleBn: 'জেনারেল ম্যানেজার',
    level: 8,
    requiredPV: 500,
    requiredTeamPV: 180000,
    requiredActiveDirects: 15,
    rewardType: 'vehicle',
    rewardTitleBn: 'ব্র্যান্ড নিউ স্পোর্টস বাইক বা ৳ ২,৫০,০০০',
    rewardTitleEn: 'Brand New Sports Bike or BDT 250,000',
    rewardValueBDT: 250000,
    badgeIcon: 'Zap',
    certificateAvailable: true
  },
  {
    rank: 'director',
    titleEn: 'Director Club Member',
    titleBn: 'ডাইরেক্টর ক্লাব সদস্য',
    level: 9,
    requiredPV: 500,
    requiredTeamPV: 450000,
    requiredActiveDirects: 20,
    rewardType: 'vehicle',
    rewardTitleBn: 'ব্র্যান্ড নিউ প্রাইভেট কার / SUV ফান্ড ৳ ১২,০০,০০০',
    rewardTitleEn: 'Brand New Private SUV Fund BDT 1,200,000',
    rewardValueBDT: 1200000,
    badgeIcon: 'Crown',
    certificateAvailable: true
  },
  {
    rank: 'founder',
    titleEn: 'Founder Member',
    titleBn: 'ফাউন্ডার ক্লাব গ্লোবাল পার্টনার',
    level: 10,
    requiredPV: 500,
    requiredTeamPV: 1000000,
    requiredActiveDirects: 25,
    rewardType: 'house',
    rewardTitleBn: 'ড্রিম হাউজ ফান্ড / ডুপ্লেক্স ইনসেন্টিভ ৳ ৫০,০০,০০০ + গ্লোবাল শেয়ার',
    rewardTitleEn: 'Dream House Fund BDT 5,000,000 + Global Profit Share',
    rewardValueBDT: 5000000,
    badgeIcon: 'Sparkles',
    certificateAvailable: true
  }
];

// ----------------------------------------------------------------------
// Default Super Admin Commission Config
// ----------------------------------------------------------------------
const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  sponsorCommissionPct: 15, // 15% Sponsor Commission
  binaryMatchingRateBDT: 10, // ৳ 10 per 1 matched PV pair
  binaryMatchingCapDailyPV: 5000, // 5000 PV daily limit
  generationCommissionPcts: [
    5, 3, 2, 1.5, 1, 0.8, 0.6, 0.5, 0.5, 0.5,
    0.4, 0.4, 0.3, 0.3, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1
  ], // 20 Levels breakdown
  leadershipBonusPct: 5,
  rankBonusValues: {
    customer: 0,
    network_member: 1000,
    senior_network_member: 2500,
    team_leader: 8000,
    senior_team_leader: 25000,
    area_manager: 40000,
    regional_manager: 120000,
    general_manager: 250000,
    director: 1200000,
    founder: 5000000
  },
  cashbackPct: 5,
  salesBonusPct: 3,
  performanceBonusPct: 4,
  campaignBonusPct: 2,
  specialIncentiveBDT: 5000,
  pendingHoldingDays: 7, // 7 Days holding before auto release
  withdrawalMinBDT: 500,
  withdrawalFeePct: 2 // 2% withdrawal charge
};

const SEED_MEMBERS: NetworkMember[] = SEED_BINARY_MEMBERS;

export const generateNextMemberId = (existingMembers: NetworkMember[]): string => {
  let maxNum = 1;
  existingMembers.forEach((m) => {
    const num = parseBinaryCompanyIdSeq(m.id);
    if (num > maxNum) maxNum = num;
  });
  return formatBinaryCompanyId(maxNum + 1);
};

// Initial Transactions
const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1001',
    userId: 'usr-cust-001',
    walletType: 'commission',
    type: 'credit',
    amount: 4500,
    source: 'binary_matching',
    status: 'completed',
    description: 'বাইনারি ডেইলি ম্যাচিং বোনাস (৪৫০ PV ম্যাচিং x ৳ ১০)',
    date: '2026-08-01 18:30'
  },
  {
    id: 'tx-1002',
    userId: 'usr-cust-001',
    walletType: 'pending',
    type: 'credit',
    amount: 1500,
    source: 'sponsor_commission',
    status: 'pending',
    description: 'নতুন স্পন্সর যোগদান কমিশন (তাহমিনা আক্তার ২০০ PV x ১৫%)',
    date: '2026-08-04 12:15'
  },
  {
    id: 'tx-1003',
    userId: 'usr-cust-001',
    walletType: 'reward',
    type: 'credit',
    amount: 40000,
    source: 'rank_reward',
    status: 'completed',
    description: 'এরিয়া ম্যানেজার র‍্যাঙ্ক অর্জন কক্সবাজার ট্যুর ইকুইভ্যালেন্ট রিওয়ার্ড',
    date: '2026-07-28 10:00'
  },
  {
    id: 'tx-1004',
    userId: 'usr-cust-001',
    walletType: 'cash',
    type: 'credit',
    amount: 2500,
    source: 'cashback',
    status: 'completed',
    description: 'পাবনার খাঁটি ঘি ও মধু ক্রয়ে ৫% ইনস্ট্যান্ট ই-কমার্স ক্যাশব্যাক',
    date: '2026-08-03 15:45'
  },
  {
    id: 'tx-1005',
    userId: 'usr-cust-001',
    walletType: 'commission',
    type: 'withdrawal',
    amount: 2000,
    source: 'withdrawal',
    status: 'completed',
    description: 'bKash (01711998877) ইনস্ট্যান্ট টাকা উত্তোলন সফল',
    date: '2026-08-02 20:10',
    referenceId: 'BK-884920'
  }
];

// Initial Withdrawals
const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd-901',
    userId: 'usr-cust-001',
    userName: 'মো: আরিফুল ইসলাম',
    userMobile: '01711998877',
    method: 'bkash',
    accountDetails: 'bKash Personal: 01711998877',
    amount: 2000,
    fee: 40,
    netAmount: 1960,
    status: 'instant_completed',
    requestDate: '2026-08-02 20:10',
    processedDate: '2026-08-02 20:10'
  },
  {
    id: 'wd-902',
    userId: 'usr-cust-001',
    userName: 'মো: আরিফুল ইসলাম',
    userMobile: '01711998877',
    method: 'bank',
    accountDetails: 'Islami Bank BD Ltd, Gulshan Branch AC: 2050119988',
    amount: 5000,
    fee: 100,
    netAmount: 4900,
    status: 'instant_completed',
    requestDate: '2026-07-25 14:20',
    processedDate: '2026-07-25 14:20'
  }
];

// Context Interface Definition
export interface PlacementRuleResult {
  sponsorId: string;
  sponsorMember?: NetworkMember;
  sponsorName: string;
  placementId: string;
  placementMember: NetworkMember;
  placementName: string;
  placementLeg: 'left' | 'right';
  positionText: string;
  isOccupiedRedirect: boolean;
  isValidSponsor: boolean;
  isValidPlacement: boolean;
  error?: string;
  priorityRule: 1 | 2 | 3 | 4;
  isFallbackUsed: boolean;
  appliedRule?: 'custom_both' | 'sponsor_only' | 'company_fallback' | 'invalid_rejected';
}

interface NetworkMarketingContextType {
  members: NetworkMember[];
  allTreeNodes: NetworkMember[];
  blankPositions: NetworkMember[];
  treeState: BinaryTreePersistenceState;
  currentMember: NetworkMember;
  ownCompanyMemberId: string | null;
  isNetworkActive: boolean;
  packages: ActivationPackage[];
  ranks: RankRequirement[];
  commissionConfig: CommissionConfig;
  wallets: UserWallets;
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  networkReports: NetworkReportData;
  reservedPlacements: ReservedSlot[];
  
  // Member & Tree Operations
  getBlankSlotForParent: (parentId: string, leg: 'left' | 'right') => NetworkMember | undefined;
  registerBlankSlotAtomic: (
    params: BlankSlotRegistrationParams
  ) => Promise<BlankSlotRegistrationResult & { sponsorName?: string; placementName?: string }>;
  fetchIsolatedSubtree: (companyId: string) => Promise<IsolatedSubtreeApiResponse>;
  refreshBinaryTreeFromServer: () => Promise<void>;
  activatePackage: (packageId: string) => void;
  addReservedSlot: (slot: Omit<ReservedSlot, 'id' | 'createdAt'>) => ReservedSlot;
  releaseReservedSlot: (parentMemberId: string, leg: 'left' | 'right') => void;
  reserveSlotDuringRegistration: (parentMemberId: string, leg: 'left' | 'right', customerName?: string) => string;
  findSponsor: (sponsorIdOrCode: string) => NetworkMember | undefined;
  validateSponsorId: (sponsorIdInput: string) => { isValid: boolean; sponsor?: NetworkMember; message: string };
  validateReferId: (referIdInput?: string) => { isValid: boolean; sponsor?: NetworkMember; message: string };
  validatePlacementId: (placementIdInput?: string) => { isValid: boolean; placementParent?: NetworkMember; message: string };
  getCompanyMasterMember: () => NetworkMember;
  findSmartGeoSponsor: (userLat?: number, userLng?: number, userDistrict?: string, userUpazila?: string) => AISmartGeoResult;
  calculatePlacementRule: (
    referralIdInput?: string,
    placementIdInput?: string,
    preferredLeg?: 'left' | 'right'
  ) => PlacementRuleResult;
  findAIBinaryPlacement: (sponsorId?: string, preferredLeg?: 'left' | 'right', reservedSlot?: { parentMemberId: string; leg: 'left' | 'right' }) => { parentId: string; parentMember: NetworkMember; placementLeg: 'left' | 'right'; positionText: string };
  executeNetworkActivationAndPlacement: (params: {
    userId: string;
    fullName: string;
    username?: string;
    customerId?: string;
    mobile: string;
    email?: string;
    address?: string;
    registrationSource?: 'Dashboard' | 'Binary Tree' | string;
    sponsorIdInput?: string;
    placementIdInput?: string;
    preferredLeg?: 'left' | 'right';
    packageId?: string;
    latitude?: number;
    longitude?: number;
    district?: string;
    upazila?: string;
    permanentMemberId?: string;
    reservedSlot?: { parentMemberId: string; leg: 'left' | 'right' };
  }) => AIActivationPlacementResult;
  activateNetworkMarketing: (sponsorIdInput?: string, leg?: 'left' | 'right', packageId?: string) => { success: boolean; message: string; member?: NetworkMember };
  placeMemberInTree: (newMemberName: string, newMemberMobile: string, sponsorId: string, parentId: string, leg: 'left' | 'right', packageId: string) => void;
  runDailyMatchingEngine: () => { matchedPV: number; totalPayoutBDT: number };
  
  // Wallet & Withdrawal Operations
  requestInstantWithdrawal: (amount: number, method: WithdrawalMethod, accountDetails: string) => { success: boolean; message: string };
  processPendingHoldingAutoRelease: () => void;
  
  // Admin Configuration Operations
  updateMemberProfile: (targetUserId: string, data: { fullName?: string; mobile?: string; email?: string; avatarUrl?: string }) => void;
  updateCommissionConfig: (newConfig: Partial<CommissionConfig>) => void;
  updatePackages: (packages: ActivationPackage[]) => void;
  updateRanks: (ranks: RankRequirement[]) => void;
  toggleWithdrawalHold: (withdrawalId: string, hold: boolean, reason?: string) => void;
  manualWalletAdjustment: (userId: string, walletType: WalletType, amount: number, isCredit: boolean, reason: string) => void;
  reassignBinaryPlacementBySuperAdmin: (params: {
    targetMemberId: string;
    newBinaryParentId: string;
    newPosition: 'left' | 'right';
    reason: string;
  }) => { success: boolean; message: string };

  // Dedicated Binary Matching Engine Operations
  matchingHistory: MatchingRecord[];
  executeMemberMatching: (memberId: string, adminId: string, reason?: string) => { success: boolean; record?: MatchingRecord; message: string };
  executeNetworkBatchMatching: (adminId: string, reason?: string) => { success: boolean; records: MatchingRecord[]; totalMatchedPV: number; message: string };
  manualCarryForwardAdjustment: (memberId: string, leftAdjust: number, rightAdjust: number, reason: string, adminId: string) => { success: boolean; message: string };
}

const NetworkMarketingContext = createContext<NetworkMarketingContextType | undefined>(undefined);

export const NetworkMarketingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, activeRole, isLoggedIn, addAuditLog, systemSettings } = useAuth();
  const { addNotification } = useNotifications();

  const [treeState, setTreeState] = useState<BinaryTreePersistenceState>(() => {
    try {
      const savedFull = localStorage.getItem('aponbazar_binary_tree_state');
      if (savedFull) {
        const parsedState = JSON.parse(savedFull) as BinaryTreePersistenceState;
        if (parsedState && Array.isArray(parsedState.nodes) && parsedState.nodes.length > 0) {
          return reconcileBinaryTreeState(
            parsedState.nodes,
            parsedState.lastCompanySeq || 15,
            parsedState.allocatedIds || {},
            parsedState.version || 1
          );
        }
      }

      const saved =
        localStorage.getItem('aponbazar_network_members') ||
        localStorage.getItem('tomshopbd_network_members');
      if (saved) {
        let parsed: NetworkMember[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasGbdRoot = parsed.some((m) => m.id === 'GBD000001');
          if (!hasGbdRoot) {
            parsed = parsed.map((m) => ({
              ...m,
              id: m.id ? m.id.replace('TMK', 'GBD') : m.id,
              member_id: m.id ? m.id.replace('TMK', 'GBD') : m.id,
              sponsorId: m.sponsorId ? m.sponsorId.replace('TMK', 'GBD') : 'GBD000001',
              sponsor_id: m.sponsor_id ? m.sponsor_id.replace('TMK', 'GBD') : 'GBD000001',
              parentId: m.parentId ? m.parentId.replace('TMK', 'GBD') : undefined,
              parent_id: m.parentId ? m.parentId.replace('TMK', 'GBD') : undefined,
              binaryParentId: m.binaryParentId ? m.binaryParentId.replace('TMK', 'GBD') : undefined,
              binary_parent_id: m.binary_parent_id ? m.binary_parent_id.replace('TMK', 'GBD') : undefined,
              placementId: m.placementId ? m.placementId.replace('TMK', 'GBD') : undefined,
              placement_id: m.placementId ? m.placementId.replace('TMK', 'GBD') : undefined,
              leftChildId: m.leftChildId ? m.leftChildId.replace('TMK', 'GBD') : undefined,
              rightChildId: m.rightChildId ? m.rightChildId.replace('TMK', 'GBD') : undefined
            }));
            if (!parsed.some((m) => m.id === 'GBD000001')) {
              parsed = SEED_MEMBERS;
            }
          }
          return reconcileBinaryTreeState(parsed, 15, {}, 1);
        }
      }
    } catch (e) {
      console.error('Error loading binary tree state from localStorage', e);
    }
    return reconcileBinaryTreeState(SEED_MEMBERS, 15, {}, 1);
  });

  const allTreeNodes = treeState.nodes;
  const members = React.useMemo(
    () => treeState.nodes.filter((n) => n.nodeStatus !== 'blank'),
    [treeState.nodes]
  );
  const blankPositions = React.useMemo(
    () => treeState.nodes.filter((n) => n.nodeStatus === 'blank'),
    [treeState.nodes]
  );

  // Compatibility setter ensuring every tree mutation preserves Left & Right blank slots
  const setMembers = (updater: React.SetStateAction<NetworkMember[]>) => {
    setTreeState((prev) => {
      const currentRegistered = prev.nodes.filter((n) => n.nodeStatus !== 'blank');
      const nextRegistered =
        typeof updater === 'function' ? updater(currentRegistered) : updater;
      const existingBlanks = prev.nodes.filter((n) => n.nodeStatus === 'blank');
      return reconcileBinaryTreeState(
        [...nextRegistered, ...existingBlanks],
        prev.lastCompanySeq,
        prev.allocatedIds,
        prev.version + 1
      );
    });
  };

  // Sync treeState & registered members cache to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('aponbazar_binary_tree_state', JSON.stringify(treeState));
      localStorage.setItem('aponbazar_network_members', JSON.stringify(members));
      localStorage.setItem('tomshopbd_network_members', JSON.stringify(members));
    } catch (e) {
      console.error('Error saving binary tree state to localStorage', e);
    }
  }, [treeState, members]);

  const refreshBinaryTreeFromServer = async () => {
    try {
      const resp = await fetch('/api/network/tree');
      if (!resp.ok) return;
      const json = await resp.json();
      if (json?.success && json.treeState?.nodes?.length > 0) {
        setTreeState(json.treeState);
        if (Array.isArray(json.matchingHistory) && json.matchingHistory.length > 0) {
          setMatchingHistory(json.matchingHistory);
        }
      }
    } catch (err) {
      console.warn('[BinaryTree] Using cached local tree state (server unreachable):', err);
    }
  };

  const fetchIsolatedSubtree = async (companyId: string): Promise<IsolatedSubtreeApiResponse> => {
    const cleanId = (companyId || '').trim();
    if (!cleanId) {
      return {
        success: false,
        statusCode: 400,
        errorCode: 'INVALID_INPUT',
        message: 'অনুগ্রহ করে একটি বৈধ Company ID লিখুন।'
      };
    }

    const effectiveRole = (activeRole || currentUser?.primaryRole || 'customer').toLowerCase();
    const effectiveUserId = isLoggedIn ? (currentUser?.id || 'guest') : 'guest';
    const resolvedOwnerId =
      currentUser?.binaryCompanyId ||
      allTreeNodes.find((n) => n.nodeStatus !== 'blank' && n.userId === effectiveUserId)?.id ||
      (effectiveUserId === 'usr-network-07' ? 'GBD000002' : '');

    try {
      const resp = await fetch(`/api/network/tree/subtree/${encodeURIComponent(cleanId)}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'x-user-role': effectiveRole,
          'x-user-id': effectiveUserId,
          'x-company-id': resolvedOwnerId
        }
      });
      const json = (await resp.json()) as IsolatedSubtreeApiResponse;
      return {
        ...json,
        statusCode: json?.statusCode || resp.status
      };
    } catch (err) {
      // Offline / unreachable server fallback using strict identical RBAC + isolated subtree extraction
      if (!isLoggedIn || effectiveUserId === 'guest') {
        return {
          success: false,
          statusCode: 403,
          errorCode: 'ACCESS_DENIED',
          message: 'অননুমোদিত প্রবেশাধিকার (Access Denied): অনুগ্রহ করে লগইন করুন।'
        };
      }
      const isAdmin = effectiveRole === 'super_admin' || effectiveRole === 'admin';
      const targetNode = findBinaryTreeNodeById(allTreeNodes, cleanId);
      if (!isAdmin) {
        if (!resolvedOwnerId) {
          return {
            success: false,
            statusCode: 403,
            errorCode: 'ACCESS_DENIED',
            message: 'Access Denied: আপনার অ্যাকাউন্টের সাথে কোনো অনুমোদিত Company ID যুক্ত নেই।'
          };
        }
        if (!targetNode) {
          return {
            success: false,
            statusCode: 404,
            errorCode: 'NOT_FOUND',
            message: `Company ID '${cleanId}' ডাটাবেজে পাওয়া যায়নি (Not Found)।`
          };
        }
        if (!isCompanyIdInSubtree(allTreeNodes, resolvedOwnerId, targetNode.id)) {
          return {
            success: false,
            statusCode: 403,
            errorCode: 'ACCESS_DENIED',
            message: `Access Denied: আপনি শুধুমাত্র আপনার নিজের Company ID (${resolvedOwnerId}) এবং এর অধীনস্থ ডাউনলাইন নেটওয়ার্ক দেখতে পারবেন।`
          };
        }
      }
      const extraction = extractIsolatedBinarySubtree(allTreeNodes, cleanId);
      if (!extraction.found || !extraction.rootNode || !extraction.stats) {
        return {
          success: false,
          statusCode: 404,
          errorCode: 'NOT_FOUND',
          message: `Company ID '${cleanId}' ডাটাবেজে পাওয়া যায়নি (Not Found)।`
        };
      }
      return {
        success: true,
        statusCode: 200,
        message: `Isolated binary subtree loaded for ${extraction.rootId}.`,
        rootId: extraction.rootId,
        rootNode: extraction.rootNode,
        nodes: extraction.nodes,
        stats: extraction.stats,
        authorizedScope: isAdmin ? 'admin_full' : 'member_subtree'
      };
    }
  };

  // Hydrate authoritative tree state from Express persistent store on mount
  useEffect(() => {
    refreshBinaryTreeFromServer();
  }, []);

  // Immutable Matching Transaction History Storage
  const [matchingHistory, setMatchingHistory] = useState<MatchingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('aponbazar_matching_history') || localStorage.getItem('tomshopbd_matching_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading matching history from localStorage', e);
    }
    return INITIAL_MATCHING_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aponbazar_matching_history', JSON.stringify(matchingHistory));
      localStorage.setItem('tomshopbd_matching_history', JSON.stringify(matchingHistory));
    } catch (e) {
      console.error('Error saving matching history to localStorage', e);
    }
  }, [matchingHistory]);

  const [packages, setPackages] = useState<ActivationPackage[]>(DEFAULT_PACKAGES);
  const [ranks, setRanks] = useState<RankRequirement[]>(DEFAULT_RANKS);
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION_CONFIG);
  
  const [wallets, setWallets] = useState<UserWallets>({
    mainWallet: 15400,
    commissionWallet: 12500,
    pendingCommissionWallet: 3500,
    rewardWallet: 40000,
    cashWallet: 2500
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>(INITIAL_TRANSACTIONS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [reservedPlacements, setReservedPlacements] = useState<ReservedSlot[]>([]);

  // Get active Company Master Member from settings (Fixed Company Master ID: GBD000001)
  const getCompanyMasterMember = (): NetworkMember => {
    const configuredId = systemSettings?.companyMasterId?.trim();
    if (configuredId) {
      const found = members.find(
        (m) =>
          m.id.toLowerCase() === configuredId.toLowerCase() ||
          m.userId.toLowerCase() === configuredId.toLowerCase()
      );
      if (found && found.active) return found;
    }
    return members.find((m) => m.id === 'GBD000001' || m.id === 'TMK000001' || m.id === 'AANO000001' || m.id === 'mem-root') || members[0];
  };

  const validateReferId = (referIdInput?: string): { isValid: boolean; sponsor?: NetworkMember; message: string } => {
    const trimmed = (referIdInput || '').trim();
    if (!trimmed) {
      const master = getCompanyMasterMember();
      return {
        isValid: true,
        sponsor: master,
        message: `রেফার আইডি ফাঁকা থাকায় ডিফল্ট কোম্পানি মাস্টার আইডি (${master.fullName} - ${master.id}) প্রযোজ্য হবে।`
      };
    }
    const q = trimmed.toLowerCase();
    const found = members.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.userId.toLowerCase() === q ||
        (m.customerId && m.customerId.toLowerCase() === q) ||
        (m.permanentMemberId && m.permanentMemberId.toLowerCase() === q) ||
        (m.mobile && m.mobile.replace(/\D/g, '').endsWith(q.replace(/\D/g, ''))) ||
        m.fullName.toLowerCase() === q
    );
    if (found) {
      return {
        isValid: true,
        sponsor: found,
        message: `বৈধ স্পন্সর: ${found.fullName} (${found.customerId || found.id})`
      };
    }
    return {
      isValid: false,
      message: 'Invalid Refer ID. Please enter a valid Refer ID.'
    };
  };

  const validatePlacementId = (placementIdInput?: string): { isValid: boolean; placementParent?: NetworkMember; message: string } => {
    const trimmed = (placementIdInput || '').trim();
    if (!trimmed) {
      return {
        isValid: true,
        message: 'প্লেসমেন্ট আইডি ফাঁকা থাকায় স্বয়ংক্রিয় প্লেসমেন্ট প্রযোজ্য হবে।'
      };
    }
    const q = trimmed.toLowerCase();
    const found = members.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.userId.toLowerCase() === q ||
        (m.customerId && m.customerId.toLowerCase() === q) ||
        (m.permanentMemberId && m.permanentMemberId.toLowerCase() === q) ||
        (m.mobile && m.mobile.replace(/\D/g, '').endsWith(q.replace(/\D/g, ''))) ||
        m.fullName.toLowerCase() === q
    );
    if (found) {
      return {
        isValid: true,
        placementParent: found,
        message: `বৈধ প্লেসমেন্ট প্যারেন্ট: ${found.fullName} (${found.customerId || found.id})`
      };
    }
    return {
      isValid: false,
      message: 'Invalid Placement ID. Please enter a valid Placement ID.'
    };
  };

  const addReservedSlot = (slotData: Omit<ReservedSlot, 'id' | 'createdAt'>): ReservedSlot => {
    const newSlot: ReservedSlot = {
      ...slotData,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setReservedPlacements((prev) => [...prev, newSlot]);
    addNotification({
      userId: slotData.userId,
      title: 'বাইনারি স্লট রিজার্ভ নিশ্চিত!',
      message: `${slotData.customerName}-এর নামে ${slotData.leg === 'left' ? 'বাম' : 'ডান'} স্লট রিজার্ভ করা হয়েছে। প্রথম অর্ডার ডেলিভারি ও পেমেন্ট পাওয়া মাত্রই AI সদস্যপদ সক্রিয় করবে।`,
      channel: 'in_app'
    });
    return newSlot;
  };

  const releaseReservedSlot = (parentMemberId: string, leg: 'left' | 'right') => {
    setReservedPlacements((prev) =>
      prev.filter(
        (r) =>
          !(
            (r.parentMemberId.toLowerCase() === parentMemberId.toLowerCase() ||
             r.id.toLowerCase() === parentMemberId.toLowerCase()) &&
            r.leg === leg
          )
      )
    );
  };

  const reserveSlotDuringRegistration = (
    parentMemberId: string,
    leg: 'left' | 'right',
    customerName: string = 'Pending Customer Registration'
  ): string => {
    const tempId = `temp-res-${Date.now()}`;
    const newSlot: ReservedSlot = {
      id: tempId,
      userId: tempId,
      customerName,
      customerMobile: '',
      parentMemberId,
      leg,
      createdAt: new Date().toISOString()
    };
    setReservedPlacements((prev) => {
      const filtered = prev.filter(
        (r) =>
          !(
            (r.parentMemberId.toLowerCase() === parentMemberId.toLowerCase() ||
             r.id.toLowerCase() === parentMemberId.toLowerCase()) &&
            r.leg === leg
          )
      );
      return [...filtered, newSlot];
    });
    return tempId;
  };

  // Derive Current Logged-in Network Member & Active Status
  const activeMemberMatch = currentUser
    ? members.find(
        (m) =>
          m.userId === currentUser.id ||
          (currentUser.binaryCompanyId && m.id === currentUser.binaryCompanyId) ||
          (currentUser.id === 'usr-network-07' && m.id === 'GBD000002') ||
          ((currentUser.primaryRole === 'super_admin' || currentUser.primaryRole === 'admin') &&
            m.id === COMPANY_MASTER_ROOT_ID)
      )
    : undefined;
  const ownCompanyMemberId = activeMemberMatch?.id || currentUser?.binaryCompanyId || null;
  const isNetworkActive = !!(activeMemberMatch && activeMemberMatch.active);

  const currentMember = activeMemberMatch || members[1] || members[0];

  // ----------------------------------------------------------------------
  // 1. Activate or Upgrade Activation Package
  // ----------------------------------------------------------------------
  const activatePackage = (packageId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    if (wallets.mainWallet < pkg.priceBDT) {
      if (currentUser) {
        addNotification({
          userId: currentUser.id,
          title: 'প্যাকেজ ক্রয় ব্যর্থ!',
          message: `আপনার মেইন ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। প্রয়োজন: ৳ ${pkg.priceBDT.toLocaleString()}`,
          channel: 'in_app'
        });
      }
      return;
    }

    // Deduct Main Wallet
    setWallets((prev) => ({
      ...prev,
      mainWallet: prev.mainWallet - pkg.priceBDT
    }));

    // Log Package Purchase Transaction
    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      walletType: 'main',
      type: 'debit',
      amount: pkg.priceBDT,
      source: 'package_activation',
      status: 'completed',
      description: `নেটওয়ার্ক মার্কেটিং প্যাকেজ অ্যাক্টিভেশন: ${pkg.nameBn} (${pkg.pv} PV)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTransactions((prev) => [tx, ...prev]);

    // Update Current Member PV & Package Name
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === currentMember.id) {
          const newPV = m.pv + pkg.pv;
          return {
            ...m,
            pv: newPV,
            packageId: pkg.id,
            packageName: pkg.nameBn
          };
        }
        return m;
      })
    );

    // Calculate Direct Sponsor Commission for Sponsor if exists
    if (currentMember.sponsorId) {
      const sponsorCommBDT = Math.round(pkg.priceBDT * (commissionConfig.sponsorCommissionPct / 100));
      const pendingTx: WalletTransaction = {
        id: `tx-sp-${Date.now()}`,
        userId: currentMember.sponsorId,
        walletType: 'pending',
        type: 'credit',
        amount: sponsorCommBDT,
        source: 'sponsor_commission',
        status: 'pending',
        description: `স্পন্সর ডাইরেক্ট রেফারেল কমিশন (${currentMember.fullName} - ${pkg.pv} PV)`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      setTransactions((prev) => [pendingTx, ...prev]);
      setWallets((prev) => ({
        ...prev,
        pendingCommissionWallet: prev.pendingCommissionWallet + sponsorCommBDT
      }));
    }

    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        title: 'প্যাকেজ অ্যাক্টিভেশন সফল!',
        message: `অভিনন্দন! আপনি সফলভাবে ${pkg.nameBn} অ্যাক্টিভেট করেছেন। +${pkg.pv} PV যুক্ত হয়েছে।`,
        channel: 'in_app'
      });
    }
  };

  // ----------------------------------------------------------------------
  // 1.5 Sponsor Lookup & Validation Helper
  // ----------------------------------------------------------------------
  const findSponsor = (sponsorIdOrCode: string): NetworkMember | undefined => {
    if (!sponsorIdOrCode || !sponsorIdOrCode.trim()) return members[0];
    const query = sponsorIdOrCode.trim().toLowerCase();

    // Default company root sponsor alias handling
    if (
      query === 'gbd000001' ||
      query === 'tmk000001' ||
      query === 'mem-root' ||
      query === 'company' ||
      query === 'tomokary' ||
      query === 'root' ||
      query === 'mem-leader-top'
    ) {
      return members.find((m) => m.id === COMPANY_MASTER_ROOT_ID) || members[0];
    }

    return members.find((m) => {
      const matchId = m.id.toLowerCase() === query;
      const matchUserId = m.userId.toLowerCase() === query;
      const matchCustomerId = Boolean(m.customerId && m.customerId.toLowerCase() === query);
      const matchUsername = Boolean(m.username && m.username.toLowerCase() === query);
      const matchMobile = m.mobile.toLowerCase() === query || (m.mobile && m.mobile.replace(/\D/g, '').endsWith(query.replace(/\D/g, '')));
      const matchEmail = m.email.toLowerCase() === query;
      const matchName = m.fullName.toLowerCase() === query;
      return matchId || matchUserId || matchCustomerId || matchUsername || matchMobile || matchEmail || matchName;
    });
  };

  const validateSponsorId = (sponsorIdInput: string): { isValid: boolean; sponsor?: NetworkMember; message: string } => {
    if (!sponsorIdInput || !sponsorIdInput.trim()) {
      return { isValid: false, message: 'স্পন্সর আইডি বা রেফারেল কোড খালি' };
    }

    const sponsor = findSponsor(sponsorIdInput);
    if (sponsor && sponsor.active) {
      return {
        isValid: true,
        sponsor,
        message: `বৈধ স্পন্সর: ${sponsor.fullName} (${sponsor.id})`
      };
    }

    return {
      isValid: false,
      message: 'অবৈধ বা অকার্যকর স্পন্সর আইডি। অনুগ্রহ করে সঠিক মেম্বার আইডি লিখুন।'
    };
  };

  // ----------------------------------------------------------------------
  // 1.6 AI Smart Geo Placement Engine (Nearest Eligible Active Member)
  // ----------------------------------------------------------------------
  const findSmartGeoSponsor = (
    userLat?: number,
    userLng?: number,
    userDistrict?: string,
    userUpazila?: string
  ): AISmartGeoResult => {
    const activeMembers = members.filter((m) => m.active);
    if (activeMembers.length === 0) {
      const root = members[0];
      return {
        sponsor: root,
        distanceKm: 0,
        reasoning: 'সিস্টেম রুট মেম্বার (ডিফল্ট স্পন্সর)'
      };
    }

    // Haversine Distance
    const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    let bestSponsor = activeMembers[0];
    let minDistance = 999999;
    let reasoningText = '';

    if (userLat && userLng) {
      for (const m of activeMembers) {
        // Map seed coordinates or default Dhaka coordinates
        const mLat = m.userId === 'usr-vendor-001' ? 22.3569 : 23.8103;
        const mLng = m.userId === 'usr-vendor-001' ? 91.7832 : 90.4125;
        const dist = getDistanceKm(userLat, userLng, mLat, mLng);

        if (dist < minDistance) {
          minDistance = dist;
          bestSponsor = m;
        }
      }
      reasoningText = `AI Smart Geo Placement: নিকটস্থ সক্রিয় মেম্বার (${bestSponsor.fullName}, ${minDistance.toFixed(1)} কিমি দূরে)`;
    } else {
      // Sort by team size to balance regional workload
      const sorted = [...activeMembers].sort((a, b) => a.teamMembersCount - b.teamMembersCount);
      bestSponsor = sorted[0];
      minDistance = 2.4;
      reasoningText = `AI Regional Balancing: আঞ্চলিক স্পন্সর অ্যাসাইনমেন্ট (${bestSponsor.fullName})`;
    }

    return {
      sponsor: bestSponsor,
      distanceKm: Math.round(minDistance * 10) / 10,
      reasoning: reasoningText
    };
  };

  // ----------------------------------------------------------------------
  // 1.7 Business Rule Placement Engine (Priority 1 - 4 Hierarchy)
  // ----------------------------------------------------------------------
  const calculatePlacementRule = (
    referralIdInput?: string,
    placementIdInput?: string,
    preferredLeg: 'left' | 'right' = 'right'
  ): PlacementRuleResult => {
    const masterMember = getCompanyMasterMember();
    const cleanRefer = (referralIdInput || '').trim();
    const cleanPlacement = (placementIdInput || '').trim();
    const chosenLeg = preferredLeg || 'right';

    const lookupMember = (q: string): NetworkMember | undefined => {
      if (!q) return undefined;
      const lower = q.toLowerCase();
      return members.find((m) =>
        m.id.toLowerCase() === lower ||
        m.userId.toLowerCase() === lower ||
        (m.customerId && m.customerId.toLowerCase() === lower) ||
        (m.username && m.username.toLowerCase() === lower) ||
        (m.mobile && m.mobile.replace(/\D/g, '').endsWith(lower.replace(/\D/g, ''))) ||
        m.fullName.toLowerCase() === lower
      );
    };

    // Helper: Find first available slot in binary subtree under a given root
    const findFirstAvailableSubtreeSlot = (startNode: NetworkMember, legPref: 'left' | 'right') => {
      const queue: NetworkMember[] = [startNode];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (visited.has(curr.id)) continue;
        visited.add(curr.id);

        if (legPref === 'left') {
          if (!curr.leftChildId) return { parent: curr, leg: 'left' as const, redirected: curr.id !== startNode.id };
          if (!curr.rightChildId) return { parent: curr, leg: 'right' as const, redirected: true };
        } else {
          if (!curr.rightChildId) return { parent: curr, leg: 'right' as const, redirected: curr.id !== startNode.id };
          if (!curr.leftChildId) return { parent: curr, leg: 'left' as const, redirected: true };
        }

        const firstChild = members.find((m) => m.id === (legPref === 'left' ? curr.leftChildId : curr.rightChildId));
        const secondChild = members.find((m) => m.id === (legPref === 'left' ? curr.rightChildId : curr.leftChildId));
        if (firstChild) queue.push(firstChild);
        if (secondChild) queue.push(secondChild);
      }
      return { parent: startNode, leg: legPref, redirected: false };
    };

    // ------------------------------------------------------------------
    // PRIORITY 4: INVALID REFER ID OR INVALID PLACEMENT ID
    // ------------------------------------------------------------------
    const sponsorMember = cleanRefer ? lookupMember(cleanRefer) : undefined;
    if (cleanRefer && !sponsorMember) {
      return {
        sponsorId: cleanRefer,
        sponsorName: 'Unknown',
        placementId: cleanPlacement || '',
        placementMember: masterMember,
        placementName: 'Unknown',
        placementLeg: chosenLeg,
        positionText: 'অবৈধ রেফার আইডি (Invalid Refer ID)। অনুগ্রহ করে সঠিক রেফার আইডি দিন।',
        isOccupiedRedirect: false,
        isValidSponsor: false,
        isValidPlacement: false,
        error: 'Invalid Refer ID. Please enter a valid Refer ID.',
        priorityRule: 4,
        isFallbackUsed: false,
        appliedRule: 'invalid_rejected'
      };
    }

    const explicitPlacementParent = cleanPlacement ? lookupMember(cleanPlacement) : undefined;
    if (cleanPlacement && !explicitPlacementParent) {
      return {
        sponsorId: sponsorMember?.id || masterMember.id,
        sponsorMember: sponsorMember || masterMember,
        sponsorName: sponsorMember?.fullName || masterMember.fullName,
        placementId: cleanPlacement,
        placementMember: masterMember,
        placementName: 'Unknown',
        placementLeg: chosenLeg,
        positionText: 'অবৈধ প্লেসমেন্ট আইডি (Invalid Placement ID)। অনুগ্রহ করে সঠিক প্লেসমেন্ট আইডি দিন।',
        isOccupiedRedirect: false,
        isValidSponsor: !cleanRefer || !!sponsorMember,
        isValidPlacement: false,
        error: 'Invalid Placement ID. Please enter a valid Placement ID.',
        priorityRule: 4,
        isFallbackUsed: false,
        appliedRule: 'invalid_rejected'
      };
    }

    // ------------------------------------------------------------------
    // PRIORITY 1: Refer ID + Placement ID both provided and valid
    // -> Provided Refer ID = Sponsor
    // -> Under Provided Placement ID (respect leg preference or first open slot)
    // ------------------------------------------------------------------
    if (cleanPlacement && explicitPlacementParent) {
      // Validate occupied positions
      if (preferredLeg === 'left' && explicitPlacementParent.leftChildId) {
        return {
          sponsorId: sponsorMember?.id || masterMember.id,
          sponsorMember: sponsorMember || masterMember,
          sponsorName: sponsorMember?.fullName || masterMember.fullName,
          placementId: explicitPlacementParent.id,
          placementMember: explicitPlacementParent,
          placementName: explicitPlacementParent.fullName,
          placementLeg: 'left',
          positionText: `⚠️ প্লেসমেন্ট আইডি ${explicitPlacementParent.id} এর বাম শাখা ইতিমধ্যে পূর্ণ রয়েছে।`,
          isOccupiedRedirect: false,
          isValidSponsor: !cleanRefer || !!sponsorMember,
          isValidPlacement: false,
          priorityRule: 1,
          isFallbackUsed: false,
          appliedRule: 'custom_both',
          error: `This placement position (Left) under ${explicitPlacementParent.id} is already occupied. Please select an empty position or choose another Placement ID.`
        };
      }

      if (preferredLeg === 'right' && explicitPlacementParent.rightChildId) {
        return {
          sponsorId: sponsorMember?.id || masterMember.id,
          sponsorMember: sponsorMember || masterMember,
          sponsorName: sponsorMember?.fullName || masterMember.fullName,
          placementId: explicitPlacementParent.id,
          placementMember: explicitPlacementParent,
          placementName: explicitPlacementParent.fullName,
          placementLeg: 'right',
          positionText: `⚠️ প্লেসমেন্ট আইডি ${explicitPlacementParent.id} এর ডান শাখা ইতিমধ্যে পূর্ণ রয়েছে।`,
          isOccupiedRedirect: false,
          isValidSponsor: !cleanRefer || !!sponsorMember,
          isValidPlacement: false,
          priorityRule: 1,
          isFallbackUsed: false,
          appliedRule: 'custom_both',
          error: `This placement position (Right) under ${explicitPlacementParent.id} is already occupied. Please select an empty position or choose another Placement ID.`
        };
      }

      if (explicitPlacementParent.leftChildId && explicitPlacementParent.rightChildId) {
        return {
          sponsorId: sponsorMember?.id || masterMember.id,
          sponsorMember: sponsorMember || masterMember,
          sponsorName: sponsorMember?.fullName || masterMember.fullName,
          placementId: explicitPlacementParent.id,
          placementMember: explicitPlacementParent,
          placementName: explicitPlacementParent.fullName,
          placementLeg: 'left',
          positionText: `⚠️ প্লেসমেন্ট আইডি ${explicitPlacementParent.id} এর উভয় শাখা (বাম ও ডান) পূর্ণ রয়েছে।`,
          isOccupiedRedirect: false,
          isValidSponsor: !cleanRefer || !!sponsorMember,
          isValidPlacement: false,
          priorityRule: 1,
          isFallbackUsed: false,
          appliedRule: 'custom_both',
          error: `This Placement ID (${explicitPlacementParent.id}) has both Left and Right positions occupied. Please select another Placement ID.`
        };
      }

      let slotLeg: 'left' | 'right' = chosenLeg;
      if (preferredLeg) {
        slotLeg = preferredLeg;
      } else if (!explicitPlacementParent.leftChildId) {
        slotLeg = 'left';
      } else {
        slotLeg = 'right';
      }

      const activeSponsor = sponsorMember || masterMember;
      return {
        sponsorId: activeSponsor.id,
        sponsorMember: activeSponsor,
        sponsorName: activeSponsor.fullName,
        placementId: explicitPlacementParent.id,
        placementMember: explicitPlacementParent,
        placementName: explicitPlacementParent.fullName,
        placementLeg: slotLeg,
        positionText: `রেফার: ${activeSponsor.fullName} (${activeSponsor.id}) — প্লেসমেন্ট: ${explicitPlacementParent.fullName} (${explicitPlacementParent.id}) এর ${slotLeg === 'left' ? 'বাম' : 'ডান'} পজিশন`,
        isOccupiedRedirect: false,
        isValidSponsor: true,
        isValidPlacement: true,
        priorityRule: 1,
        isFallbackUsed: !sponsorMember,
        appliedRule: 'custom_both'
      };
    }

    // ------------------------------------------------------------------
    // PRIORITY 2: Refer ID provided + Placement ID blank
    // -> Provided Refer ID = Sponsor
    // -> Automatic placement under Sponsor
    // ------------------------------------------------------------------
    if (cleanRefer && !cleanPlacement && sponsorMember) {
      const res = findFirstAvailableSubtreeSlot(sponsorMember, chosenLeg);
      return {
        sponsorId: sponsorMember.id,
        sponsorMember: sponsorMember,
        sponsorName: sponsorMember.fullName,
        placementId: res.parent.id,
        placementMember: res.parent,
        placementName: res.parent.fullName,
        placementLeg: res.leg,
        positionText: `রেফার: ${sponsorMember.fullName} (${sponsorMember.id}) — স্বয়ংক্রিয় প্লেসমেন্ট: ${res.parent.fullName} (${res.parent.id}) এর ${res.leg === 'left' ? 'বাম' : 'ডান'} পজিশন`,
        isOccupiedRedirect: res.redirected,
        isValidSponsor: true,
        isValidPlacement: true,
        priorityRule: 2,
        isFallbackUsed: false,
        appliedRule: 'sponsor_only'
      };
    }

    // ------------------------------------------------------------------
    // PRIORITY 3: Refer ID blank + Placement ID blank (Fallback Rule)
    // -> 1. Company Master ID = Sponsor
    // -> 2. Company Master ID's Right Side -> Downline:
    //       traverse down right branch to find first available placement position
    // ------------------------------------------------------------------
    let curr = masterMember;
    while (curr && curr.rightChildId) {
      const nextRight = members.find((m) => m.id === curr.rightChildId);
      if (nextRight) {
        curr = nextRight;
      } else {
        break;
      }
    }

    return {
      sponsorId: masterMember.id,
      sponsorMember: masterMember,
      sponsorName: `${masterMember.fullName} (Company Master)`,
      placementId: curr.id,
      placementMember: curr,
      placementName: curr.fullName,
      placementLeg: 'right',
      positionText: `কোম্পানি মাস্টার আইডি (${masterMember.fullName} - ${masterMember.id}) — স্বয়ংক্রিয় ডান-ডাউনলাইন প্লেসমেন্ট (${curr.fullName} - ${curr.id} এর ডান পজিশন)`,
      isOccupiedRedirect: false,
      isValidSponsor: true,
      isValidPlacement: true,
      priorityRule: 3,
      isFallbackUsed: true,
      appliedRule: 'company_fallback'
    };
  };

  // ----------------------------------------------------------------------
  // 1.8 AI Binary Tree Placement Search (Strict Priority Algorithm)
  // ----------------------------------------------------------------------
  const findAIBinaryPlacement = (
    sponsorId?: string,
    preferredLeg?: 'left' | 'right',
    reservedSlot?: { parentMemberId: string; leg: 'left' | 'right' }
  ): {
    parentId: string;
    parentMember: NetworkMember;
    placementLeg: 'left' | 'right';
    positionText: string;
  } => {
    // Priority 1: Reserved Slot if available & valid
    if (reservedSlot && reservedSlot.parentMemberId) {
      const parentNode = members.find((m) => m.id === reservedSlot.parentMemberId);
      if (parentNode) {
        const isSlotEmpty = reservedSlot.leg === 'left' ? !parentNode.leftChildId : !parentNode.rightChildId;
        if (isSlotEmpty) {
          return {
            parentId: parentNode.id,
            parentMember: parentNode,
            placementLeg: reservedSlot.leg,
            positionText: `সংরক্ষিত ${reservedSlot.leg === 'left' ? 'বাম' : 'ডান'} স্লটে AI প্লেসমেন্ট: ${parentNode.fullName} (${parentNode.id})`
          };
        }
      }
    }

    const res = calculatePlacementRule(sponsorId, undefined, preferredLeg);
    return {
      parentId: res.placementId,
      parentMember: res.placementMember,
      placementLeg: res.placementLeg,
      positionText: res.positionText
    };
  };

  // ----------------------------------------------------------------------
  // 1.75 Blank Position Lookup & Atomic Server Registration
  // ----------------------------------------------------------------------
  const getBlankSlotForParent = (parentId: string, leg: 'left' | 'right'): NetworkMember | undefined => {
    const q = (parentId || '').trim().toLowerCase();
    const parent = members.find(
      (m) => m.id.toLowerCase() === q || (m.customerId && m.customerId.toLowerCase() === q)
    );
    const resolvedParentId = parent ? parent.id : parentId.trim();
    return blankPositions.find(
      (b) => b.parentId === resolvedParentId && (b.placementLeg || '').toLowerCase() === leg
    );
  };

  const registerBlankSlotAtomic = async (
    params: BlankSlotRegistrationParams
  ): Promise<BlankSlotRegistrationResult & { sponsorName?: string; placementName?: string }> => {
    const pkg = packages.find((p) => p.id === (params.packageId || 'pkg-100')) || packages[0];
    const enrichedParams: BlankSlotRegistrationParams = {
      ...params,
      packageId: pkg.id,
      packageName: params.packageName || pkg.nameBn,
      pv: typeof params.pv === 'number' ? params.pv : pkg.pv
    };

    try {
      const resp = await fetch('/api/network/blank-slot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedParams)
      });
      const json = (await resp.json()) as BlankSlotRegistrationResult;
      if (!resp.ok || !json.success) {
        if (resp.status === 409) {
          refreshBinaryTreeFromServer();
        }
        return {
          success: false,
          statusCode: resp.status || json.statusCode || 409,
          message: json.message || 'বাইনারি Blank Position নিবন্ধন ব্যর্থ হয়েছে।'
        };
      }

      if (json.state) {
        setTreeState(json.state);
      }
      const registeredMember = json.registeredMember;
      const sponsorNode = (json.state?.nodes || members).find((m) => m.id === registeredMember?.sponsorId);
      const placementNode = (json.state?.nodes || members).find((m) => m.id === registeredMember?.parentId);

      addNotification({
        userId: params.userId,
        title: 'সদস্যপদ ও ২ নতুন Blank Position তৈরি সম্পন্ন!',
        message: `${params.fullName} (${registeredMember?.id}) সফলভাবে নিবন্ধিত হয়েছে এবং বাম (${json.newLeftBlank?.id}) ও ডান (${json.newRightBlank?.id}) Blank Position তৈরি হয়েছে!`,
        channel: 'in_app'
      });

      return {
        ...json,
        sponsorName: sponsorNode?.fullName || params.sponsorName || COMPANY_MASTER_ROOT_ID,
        placementName: placementNode?.fullName || registeredMember?.parentId || COMPANY_MASTER_ROOT_ID
      };
    } catch {
      const localRes = executeAtomicBlankSlotRegistration(treeState, enrichedParams);
      if (localRes.success && localRes.state) {
        setTreeState(localRes.state);
        const sponsorNode = localRes.state.nodes.find((m) => m.id === localRes.registeredMember?.sponsorId);
        const placementNode = localRes.state.nodes.find((m) => m.id === localRes.registeredMember?.parentId);
        return {
          ...localRes,
          sponsorName: sponsorNode?.fullName || params.sponsorName || COMPANY_MASTER_ROOT_ID,
          placementName: placementNode?.fullName || localRes.registeredMember?.parentId || COMPANY_MASTER_ROOT_ID
        };
      }
      return localRes;
    }
  };

  // ----------------------------------------------------------------------
  // 1.8 Complete AI Automatic Referral and Placement Engine
  // ----------------------------------------------------------------------
  const executeNetworkActivationAndPlacement = (params: {
    userId: string;
    fullName: string;
    username?: string;
    customerId?: string;
    mobile: string;
    email?: string;
    address?: string;
    registrationSource?: 'Dashboard' | 'Binary Tree' | string;
    sponsorIdInput?: string;
    placementIdInput?: string;
    preferredLeg?: 'left' | 'right';
    packageId?: string;
    latitude?: number;
    longitude?: number;
    district?: string;
    upazila?: string;
    permanentMemberId?: string;
    reservedSlot?: { parentMemberId: string; leg: 'left' | 'right' };
  }): AIActivationPlacementResult => {
    const {
      userId,
      fullName,
      username,
      customerId,
      mobile,
      email,
      address,
      registrationSource = 'Dashboard',
      sponsorIdInput,
      placementIdInput,
      preferredLeg,
      packageId = 'pkg-100',
      reservedSlot
    } = params;

    // Duplicate Placement Prevention
    const existingInTree = members.find((m) => m.userId === userId);
    if (existingInTree && existingInTree.parentId) {
      const parentNode = members.find((m) => m.id === existingInTree.parentId);
      return {
        success: false,
        message: 'ডুপ্লিকেট প্লেসমেন্ট প্রতিরোধ: ব্যবহারকারী ইতিমধ্যেই বাইনারি ট্রি-তে প্লেস করা আছে।',
        member: existingInTree,
        referralCode: existingInTree.id,
        referralLink: `${window.location.origin}/register?ref=${existingInTree.id}`,
        sponsorId: existingInTree.sponsorId || COMPANY_MASTER_ROOT_ID,
        sponsorName: existingInTree.sponsorName || 'Company Master (GBD000001)',
        placementId: existingInTree.parentId,
        placementName: parentNode?.fullName || 'Root Upline',
        placementLeg: existingInTree.placementLeg,
        binaryPositionText: `${existingInTree.placementLeg === 'left' ? 'বাম' : 'ডান'} লেগে প্লেসমেন্ট আইডি ${existingInTree.parentId}`
      };
    }

    const activeReserved = reservedSlot || reservedPlacements.find((r) => r.userId === userId);

    let finalSponsorId: string;
    let finalSponsorName: string;
    let finalPlacementId: string;
    let finalPlacementName: string;
    let finalPlacementLeg: 'left' | 'right';
    let finalPositionText: string;

    if (activeReserved) {
      const master = getCompanyMasterMember();
      const parentNode = members.find((m) => m.id === activeReserved.parentMemberId) || master;
      finalSponsorId = sponsorIdInput ? (findSponsor(sponsorIdInput)?.id || master.id) : master.id;
      finalSponsorName = members.find((m) => m.id === finalSponsorId)?.fullName || master.fullName;
      finalPlacementId = parentNode.id;
      finalPlacementName = parentNode.fullName;
      finalPlacementLeg = activeReserved.leg;
      finalPositionText = `সংরক্ষিত ${activeReserved.leg === 'left' ? 'বাম' : 'ডান'} স্লটে AI প্লেসমেন্ট: ${parentNode.fullName} (${parentNode.id})`;
    } else {
      const ruleResult = calculatePlacementRule(sponsorIdInput, placementIdInput, preferredLeg);
      if (ruleResult.error) {
        return {
          success: false,
          message: ruleResult.error,
          referralCode: '',
          referralLink: '',
          sponsorId: '',
          sponsorName: '',
          placementId: '',
          placementName: '',
          placementLeg: 'right',
          binaryPositionText: ruleResult.positionText
        };
      }
      finalSponsorId = ruleResult.sponsorId;
      finalSponsorName = ruleResult.sponsorName;
      finalPlacementId = ruleResult.placementId;
      finalPlacementName = ruleResult.placementName;
      finalPlacementLeg = ruleResult.placementLeg;
      finalPositionText = ruleResult.positionText;
    }

    const pkg = packages.find((p) => p.id === packageId) || packages[0];
    const targetBlank = getBlankSlotForParent(finalPlacementId, finalPlacementLeg);
    const atomicParams: BlankSlotRegistrationParams = {
      reservedCompanyId: targetBlank?.id,
      parentId: finalPlacementId,
      leg: finalPlacementLeg,
      userId,
      username,
      aponUniqueId: customerId,
      fullName,
      mobile,
      email: email || `${mobile}@aponbazar.com`,
      address,
      registrationSource,
      sponsorId: finalSponsorId,
      sponsorName: finalSponsorName,
      packageId: pkg.id,
      packageName: pkg.nameBn,
      pv: pkg.pv
    };

    const atomicRes = executeAtomicBlankSlotRegistration(treeState, atomicParams);
    if (!atomicRes.success || !atomicRes.state || !atomicRes.registeredMember) {
      return {
        success: false,
        message: atomicRes.message,
        referralCode: '',
        referralLink: '',
        sponsorId: finalSponsorId,
        sponsorName: finalSponsorName,
        placementId: finalPlacementId,
        placementName: finalPlacementName,
        placementLeg: finalPlacementLeg,
        binaryPositionText: finalPositionText
      };
    }

    setTreeState(atomicRes.state);

    // Persist asynchronously to server durable store
    fetch('/api/network/blank-slot/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(atomicParams)
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json.state) {
          setTreeState(json.state);
        }
      })
      .catch(() => undefined);

    if (activeReserved) {
      setReservedPlacements((prev) => prev.filter((r) => r.userId !== userId));
    }

    const assignedCompanyId = atomicRes.registeredMember.id;
    const referralCode = assignedCompanyId;
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    addNotification({
      userId: userId,
      title: 'নেটওয়ার্ক অ্যাক্টিভেশন ও AI প্লেসমেন্ট সফল!',
      message: `অভিনন্দন ${fullName}! মেম্বার আইডি: ${assignedCompanyId}, নতুন ২টি Blank Slot: ${atomicRes.newLeftBlank?.id} (LEFT) ও ${atomicRes.newRightBlank?.id} (RIGHT)।`,
      channel: 'in_app'
    });

    return {
      success: true,
      message: `নেটওয়ার্ক প্লেসমেন্ট সফল হয়েছে (${finalPositionText})`,
      member: atomicRes.registeredMember,
      referralCode,
      referralLink,
      sponsorId: finalSponsorId,
      sponsorName: finalSponsorName,
      placementId: finalPlacementId,
      placementName: finalPlacementName,
      placementLeg: finalPlacementLeg,
      binaryPositionText: finalPositionText
    };
  };

  // ----------------------------------------------------------------------
  // 1.9 Activate Network Marketing wrapper
  // ----------------------------------------------------------------------
  const activateNetworkMarketing = (
    sponsorIdInput?: string,
    leg: 'left' | 'right' = 'left',
    packageId: string = 'pkg-100'
  ): { success: boolean; message: string; member?: NetworkMember } => {
    if (!currentUser) {
      return { success: false, message: 'সদস্য হতে অনুগ্রহ করে লগইন করুন।' };
    }

    const res = executeNetworkActivationAndPlacement({
      userId: currentUser.id,
      fullName: currentUser.fullName,
      mobile: currentUser.mobileNumber,
      email: currentUser.email,
      sponsorIdInput: sponsorIdInput || currentUser.sponsorId,
      preferredLeg: leg,
      packageId,
      latitude: currentUser.latitude,
      longitude: currentUser.longitude,
      permanentMemberId: currentUser.permanentMemberId
    });

    return {
      success: res.success,
      message: res.message,
      member: res.member
    };
  };

  // ----------------------------------------------------------------------
  // 2. Place New Direct Recount in Binary Tree (Spillover engine)
  // ----------------------------------------------------------------------
  const placeMemberInTree = (
    newMemberName: string,
    newMemberMobile: string,
    sponsorId: string,
    parentId: string,
    leg: 'left' | 'right',
    packageId: string
  ) => {
    const pkg = packages.find((p) => p.id === packageId) || packages[0];
    const sponsorObj = findSponsor(sponsorId) || members[0];
    const actualSponsorId = sponsorObj.id;

    // Auto find available parent node down the leg if given parent is filled
    const findAvailableParent = (startId: string, targetLeg: 'left' | 'right'): string => {
      let current = members.find((m) => m.id === startId);
      if (!current) return startId;

      while (current) {
        const childId = targetLeg === 'left' ? current.leftChildId : current.rightChildId;
        if (!childId) {
          return current.id;
        }
        const nextNode = members.find((m) => m.id === childId);
        if (!nextNode) return current.id;
        current = nextNode;
      }
      return startId;
    };

    const targetParentId = parentId && members.some((m) => m.id === parentId) ? parentId : actualSponsorId;
    const actualParentId = findAvailableParent(targetParentId, leg);
    const blankSlot = getBlankSlotForParent(actualParentId, leg);

    const atomicParams: BlankSlotRegistrationParams = {
      reservedCompanyId: blankSlot?.id,
      parentId: actualParentId,
      leg,
      userId: `usr-new-${Date.now()}`,
      fullName: newMemberName,
      mobile: newMemberMobile,
      email: `${newMemberMobile}@aponbazar.com`,
      sponsorId: actualSponsorId,
      sponsorName: sponsorObj.fullName,
      packageId: pkg.id,
      packageName: pkg.nameBn,
      pv: pkg.pv
    };

    const res = executeAtomicBlankSlotRegistration(treeState, atomicParams);
    if (res.success && res.state) {
      setTreeState(res.state);
      fetch('/api/network/blank-slot/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atomicParams)
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (json?.success && json.state) setTreeState(json.state);
        })
        .catch(() => undefined);
    }

    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        title: 'নতুন মেম্বার যুক্ত হয়েছে!',
        message: `${newMemberName} (${res.registeredMember?.id || ''})-কে সফলভাবে স্পন্সর ${sponsorObj.fullName}-এর অধীনে বাইনারি ট্রির ${leg === 'left' ? 'বাম' : 'ডান'} লেগে যুক্ত করা হয়েছে।`,
        channel: 'in_app'
      });
    }
  };

  // ----------------------------------------------------------------------
  // 3. Daily Binary Matching Engine Calculation
  // ----------------------------------------------------------------------
  const runDailyMatchingEngine = () => {
    let matchedPV = 0;
    let totalPayoutBDT = 0;

    setMembers((prev) =>
      prev.map((m) => {
        const leftTotal = m.leftCarryForward;
        const rightTotal = m.rightCarryForward;
        const minMatch = Math.min(leftTotal, rightTotal);

        if (minMatch > 0) {
          const cappedMatch = Math.min(minMatch, commissionConfig.binaryMatchingCapDailyPV);
          const payout = cappedMatch * commissionConfig.binaryMatchingRateBDT;
          matchedPV += cappedMatch;
          totalPayoutBDT += payout;

          if (m.id === currentMember.id) {
            // Award to pending commission wallet
            setWallets((w) => ({
              ...w,
              pendingCommissionWallet: w.pendingCommissionWallet + payout
            }));

            // Record transaction log
            setTransactions((t) => [
              {
                id: `tx-bm-${Date.now()}`,
                userId: m.userId,
                walletType: 'pending',
                type: 'credit',
                amount: payout,
                source: 'binary_matching',
                status: 'pending',
                description: `ডেইলি বাইনারি ম্যাচিং কমিশন (${cappedMatch} PV ম্যাচিং x ৳ ${commissionConfig.binaryMatchingRateBDT})`,
                date: new Date().toISOString().replace('T', ' ').substring(0, 16)
              },
              ...t
            ]);
          }

          return {
            ...m,
            leftCarryForward: leftTotal - cappedMatch,
            rightCarryForward: rightTotal - cappedMatch,
            totalMatchedPV: m.totalMatchedPV + cappedMatch
          };
        }
        return m;
      })
    );

    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        title: 'ডেইলি বাইনারি ম্যাচিং সম্পন্ন!',
        message: `মোট ${matchedPV} PV ম্যাচিং করা হয়েছে। পে-আউট হিসাব: ৳ ${totalPayoutBDT.toLocaleString()}`,
        channel: 'in_app'
      });
    }

    return { matchedPV, totalPayoutBDT };
  };

  // ----------------------------------------------------------------------
  // 4. Instant Withdrawal Processing Engine
  // ----------------------------------------------------------------------
  const requestInstantWithdrawal = (
    amount: number,
    method: WithdrawalMethod,
    accountDetails: string
  ): { success: boolean; message: string } => {
    if (!currentUser) {
      return { success: false, message: 'উইথড্র করার জন্য লগইন করুন।' };
    }

    if (amount < commissionConfig.withdrawalMinBDT) {
      return {
        success: false,
        message: `সর্বনিম্ন উইথড্রয়াল অ্যামাউন্ট ৳ ${commissionConfig.withdrawalMinBDT}`
      };
    }

    if (wallets.commissionWallet < amount) {
      return {
        success: false,
        message: 'আপনার কমিশন ওয়ালেটে পর্যাপ্ত ফ্রি ব্যালেন্স নেই!'
      };
    }

    const fee = Math.round(amount * (commissionConfig.withdrawalFeePct / 100));
    const netAmount = amount - fee;

    // Instantly Deduct Commission Wallet
    setWallets((prev) => ({
      ...prev,
      commissionWallet: prev.commissionWallet - amount
    }));

    const newWithdrawal: WithdrawalRequest = {
      id: `wd-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userMobile: currentUser.mobileNumber,
      method,
      accountDetails,
      amount,
      fee,
      netAmount,
      status: 'instant_completed',
      requestDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      processedDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    // Transaction Record
    const tx: WalletTransaction = {
      id: `tx-wd-${Date.now()}`,
      userId: currentUser.id,
      walletType: 'commission',
      type: 'withdrawal',
      amount,
      source: 'withdrawal',
      status: 'completed',
      description: `${method.toUpperCase()} (${accountDetails}) এ ইনস্ট্যান্ট উইথড্রয়াল সম্পন্ন। চার্জ: ৳ ${fee}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      referenceId: newWithdrawal.id
    };

    setTransactions((prev) => [tx, ...prev]);

    addNotification({
      userId: currentUser.id,
      title: 'ইনস্ট্যান্ট উইথড্রয়াল সফল!',
      message: `৳ ${netAmount.toLocaleString()} টাকা আপনার ${method.toUpperCase()} একাউন্টে পাঠানো হয়েছে।`,
      channel: 'in_app'
    });

    return {
      success: true,
      message: `ইনস্ট্যান্ট উইথড্রয়াল সফল! নিট প্রাপ্তি: ৳ ${netAmount.toLocaleString()}`
    };
  };

  // ----------------------------------------------------------------------
  // 5. Automatic Pending Commission Release to Commission Wallet
  // ----------------------------------------------------------------------
  const processPendingHoldingAutoRelease = () => {
    if (wallets.pendingCommissionWallet <= 0) return;

    const releaseAmount = wallets.pendingCommissionWallet;
    setWallets((prev) => ({
      ...prev,
      pendingCommissionWallet: 0,
      commissionWallet: prev.commissionWallet + releaseAmount
    }));

    const tx: WalletTransaction = {
      id: `tx-rel-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      walletType: 'commission',
      type: 'auto_release',
      amount: releaseAmount,
      source: 'admin_adjustment',
      status: 'completed',
      description: `পেন্ডিং ওয়ালেট থেকে ${commissionConfig.pendingHoldingDays} দিন হোল্ডিং পিরিয়ড শেষে কমিশন ওয়ালেটে অটো-রিলিজ সম্পন্ন`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setTransactions((prev) => [tx, ...prev]);

    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        title: 'কমিশন অটো-রিলিজ!',
        message: `৳ ${releaseAmount.toLocaleString()} টাকা পেন্ডিং ওয়ালেট থেকে আপনার কমিশন ওয়ালেটে যুক্ত হয়েছে।`,
        channel: 'in_app'
      });
    }
  };

  // ----------------------------------------------------------------------
  // 6. Admin Control Operations
  // ----------------------------------------------------------------------
  const updateMemberProfile = (
    targetUserId: string,
    data: { fullName?: string; mobile?: string; email?: string; avatarUrl?: string }
  ) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.userId === targetUserId || m.id === targetUserId) {
          return {
            ...m,
            ...(data.fullName ? { fullName: data.fullName } : {}),
            ...(data.mobile ? { mobile: data.mobile } : {}),
            ...(data.email ? { email: data.email } : {}),
            ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {})
          };
        }
        return m;
      })
    );
  };

  const updateCommissionConfig = (newConfig: Partial<CommissionConfig>) => {
    setCommissionConfig((prev) => ({ ...prev, ...newConfig }));
    if (currentUser) {
      addNotification({
        userId: currentUser.id,
        title: 'কমিশন রুলস আপডেট হয়েছে!',
        message: 'সুপার এডমিন প্যানেল থেকে কমিশন কনফিগারেশন পরিবর্তন সফল হয়েছে।',
        channel: 'in_app'
      });
    }
  };

  const updatePackages = (newPackages: ActivationPackage[]) => {
    setPackages(newPackages);
  };

  const updateRanks = (newRanks: RankRequirement[]) => {
    setRanks(newRanks);
  };

  const toggleWithdrawalHold = (withdrawalId: string, hold: boolean, reason?: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => {
        if (w.id === withdrawalId) {
          return {
            ...w,
            status: hold ? 'held_for_security_review' : 'admin_approved',
            holdReason: hold ? reason || 'সিকিউরিটি ও ফ্রড রিভিউ এর জন্য স্থগিত' : undefined
          };
        }
        return w;
      })
    );
  };

  const manualWalletAdjustment = (
    userId: string,
    walletType: WalletType,
    amount: number,
    isCredit: boolean,
    reason: string
  ) => {
    setWallets((prev) => {
      const keyMap: Record<WalletType, keyof UserWallets> = {
        main: 'mainWallet',
        commission: 'commissionWallet',
        pending: 'pendingCommissionWallet',
        reward: 'rewardWallet',
        cash: 'cashWallet'
      };
      const key = keyMap[walletType];
      return {
        ...prev,
        [key]: isCredit ? prev[key] + amount : Math.max(0, prev[key] - amount)
      };
    });

    const tx: WalletTransaction = {
      id: `tx-adj-${Date.now()}`,
      userId,
      walletType,
      type: isCredit ? 'credit' : 'debit',
      amount,
      source: 'admin_adjustment',
      status: 'completed',
      description: `এডমিন ম্যানুয়াল এডজাস্টমেন্ট: ${reason}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setTransactions((prev) => [tx, ...prev]);
  };

  // ----------------------------------------------------------------------
  // 6.5 Super Admin Exclusive Permanent Binary Tree Placement Reassignment
  // ----------------------------------------------------------------------
  const reassignBinaryPlacementBySuperAdmin = (params: {
    targetMemberId: string;
    newBinaryParentId: string;
    newPosition: 'left' | 'right';
    reason: string;
  }): { success: boolean; message: string } => {
    const isSuperAdmin = currentUser?.primaryRole === 'super_admin';
    if (!isSuperAdmin) {
      if (addAuditLog) {
        addAuditLog(
          'UNAUTHORIZED_BINARY_PLACEMENT_CHANGE_ATTEMPT',
          'PermanentBinaryTree',
          `BLOCKED: User '${currentUser?.fullName || 'Guest'}' (${currentUser?.primaryRole || 'user'}) attempted to reassign binary placement for member ID ${params.targetMemberId}.`
        );
      }
      return {
        success: false,
        message: 'অননুমোদিত: শুধুমাত্র সুপার এডমিন পারমানেন্ট বাইনারি ট্রি প্লেসমেন্ট পরিবর্তন করতে পারেন।'
      };
    }

    const { targetMemberId, newBinaryParentId, newPosition, reason } = params;

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: 'প্লেসমেন্ট পরিবর্তনের কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।'
      };
    }

    const target = members.find((m) => m.id === targetMemberId);
    if (!target) {
      return { success: false, message: 'টার্গেট মেম্বার খুঁজে পাওয়া যায়নি।' };
    }

    if (target.id === COMPANY_MASTER_ROOT_ID || target.id === 'TMK000001' || !target.parentId) {
      return { success: false, message: 'কোম্পানি রুট নোড (Root Node) স্থানান্তর করা সম্ভব নয়।' };
    }

    const newParent = members.find((m) => m.id === newBinaryParentId);
    if (!newParent) {
      return { success: false, message: 'নতুন প্যারেন্ট নোড খুঁজে পাওয়া যায়নি।' };
    }

    if (newParent.id === target.id) {
      return { success: false, message: 'একজন সদস্য নিজের প্যারেন্ট হতে পারেন না।' };
    }

    // Circular loop check: Cannot place a node under any of its own descendants
    const isDescendant = (nodeId: string, potentialAncestorId: string): boolean => {
      let curr = members.find((m) => m.id === nodeId);
      const visited = new Set<string>();
      while (curr && curr.parentId && !visited.has(curr.id)) {
        visited.add(curr.id);
        if (curr.parentId === potentialAncestorId) {
          return true;
        }
        curr = members.find((m) => m.id === curr?.parentId);
      }
      return false;
    };

    if (isDescendant(newParent.id, target.id)) {
      return {
        success: false,
        message: 'সার্কুলার লুপ ত্রুটি: কোনো সদস্যকে তার নিজের ডাউনলাইনের অধীনস্থ নোডে স্থানান্তর করা যাবে না।'
      };
    }

    // Check if slot on new parent is already occupied by someone else
    const currentOccupantId = newPosition === 'left' ? newParent.leftChildId : newParent.rightChildId;
    if (currentOccupantId && currentOccupantId !== target.id) {
      const occupant = members.find((m) => m.id === currentOccupantId);
      return {
        success: false,
        message: `নির্বাচিত ${newPosition === 'left' ? 'বাম' : 'ডান'} স্লটটিতে ইতিমধ্যেই সদস্য '${occupant?.fullName || currentOccupantId}' অবস্থান করছেন। সর্বোচ্চ ২টি চাইল্ড স্লট অনুমোদিত।`
      };
    }

    const oldParentId = target.parentId;
    const oldPosition = target.position || target.placementLeg;

    // Tombstone replaced blank node ID (never reuse) and generate fresh Blank ID for vacated old slot
    setTreeState((prev) => {
      const replacedBlankId =
        newPosition === 'left' ? newParent.leftBlankId : newParent.rightBlankId;
      const nextAllocated = { ...prev.allocatedIds };
      if (replacedBlankId) {
        nextAllocated[replacedBlankId] = 'tombstoned';
      }
      const nextNodes = prev.nodes
        .filter((m) => m.id !== replacedBlankId)
        .map((m) =>
          m.id === target.id
            ? {
                ...m,
                parentId: newParent.id,
                parent_id: newParent.id,
                binaryParentId: newParent.id,
                binary_parent_id: newParent.id,
                placementId: newParent.id,
                placement_id: newParent.id,
                placementLeg: newPosition,
                position: newPosition === 'left' ? 'LEFT' : 'RIGHT',
                placementLocked: true
              }
            : m
        );
      return reconcileBinaryTreeState(nextNodes, prev.lastCompanySeq, nextAllocated, prev.version + 1);
    });

    fetch('/api/network/placement/reassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetMemberId, newBinaryParentId, newPosition, reason })
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && json.data?.treeState) setTreeState(json.data.treeState);
      })
      .catch(() => undefined);

    // Record Audit Log
    if (addAuditLog) {
      addAuditLog(
        'SUPER_ADMIN_BINARY_PLACEMENT_REASSIGNED',
        'PermanentBinaryTree',
        `Super Admin '${currentUser?.fullName || 'SuperAdmin'}' (${currentUser?.id || 'admin'}) reassigned binary placement for ${target.fullName} (ID: ${target.id}). Previous Parent: ${oldParentId || 'None'} (${oldPosition}), New Parent: ${newParent.fullName} (${newParent.id}) [Leg: ${newPosition}]. Reason: ${reason}`
      );
    }

    addNotification({
      userId: currentUser?.id || 'admin',
      title: 'বাইনারি প্লেসমেন্ট সফলভাবে পুনর্নির্ধারণ করা হয়েছে!',
      message: `${target.fullName} (${target.id})-কে ${newParent.fullName}-এর ${newPosition === 'left' ? 'বাম' : 'ডান'} লেগে স্থানান্তর করা হয়েছে।`,
      channel: 'in_app'
    });

    return {
      success: true,
      message: `সদস্য ${target.fullName} (${target.id})-এর বাইনারি প্লেসমেন্ট সফলভাবে আপডেট হয়েছে এবং অডিট লগ লিপিবদ্ধ করা হয়েছে!`
    };
  };

  // ----------------------------------------------------------------------
  // 6.6 Dedicated Binary Matching Engine Operations (Strict Super Admin)
  // ----------------------------------------------------------------------
  const executeMemberMatching = (
    memberId: string,
    adminId: string,
    reason?: string
  ): { success: boolean; record?: MatchingRecord; message: string } => {
    const member = members.find((m) => m.id === memberId || m.customerId === memberId);
    if (!member) {
      return { success: false, message: `মেম্বার আইডি '${memberId}' পাওয়া যায়নি।` };
    }

    const leftEligible = Number(member.leftCarryForward) || 0;
    const rightEligible = Number(member.rightCarryForward) || 0;

    if (leftEligible <= 0 || rightEligible <= 0) {
      return {
        success: false,
        message: `ম্যাচিং করার মতো পর্যাপ্ত ক্যারি ফরোয়ার্ড PV নেই (Left CF: ${leftEligible.toLocaleString()}, Right CF: ${rightEligible.toLocaleString()})। উভয় লেগে ধনাত্মক PV পয়েন্ট আবশ্যক।`
      };
    }

    const matchedPV = Math.min(leftEligible, rightEligible);
    const newLeftCF = leftEligible - matchedPV;
    const newRightCF = rightEligible - matchedPV;
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    const record: MatchingRecord = {
      matching_id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      member_id: member.id,
      member_name: member.fullName,
      left_pv: leftEligible,
      right_pv: rightEligible,
      matched_pv: matchedPV,
      left_carry_forward: newLeftCF,
      right_carry_forward: newRightCF,
      matching_date: dateStr,
      created_by: adminId || currentUser?.id || 'AANO-SADMIN-001',
      created_at: nowIso,
      notes: reason?.trim() || 'Super Admin Single Member Matching Execution'
    };

    // Immutable state updates
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              leftCarryForward: newLeftCF,
              rightCarryForward: newRightCF,
              left_carry_forward: newLeftCF,
              right_carry_forward: newRightCF,
              totalMatchedPV: (m.totalMatchedPV || 0) + matchedPV
            }
          : m
      )
    );

    setMatchingHistory((prev) => [record, ...prev]);

    fetch('/api/network/matching/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, adminId, reason })
    }).catch(() => undefined);

    if (addAuditLog) {
      addAuditLog(
        'BINARY_MATCHING_EXECUTED',
        'BinaryMatchingEngine',
        `Admin '${adminId}' executed matching for Member '${member.fullName}' (${member.id}): Matched ${matchedPV} PV (Left CF: ${newLeftCF}, Right CF: ${newRightCF}). Reason: ${reason || 'Manual single member execution'}`
      );
    }

    return {
      success: true,
      record,
      message: `সফলভাবে মেম্বার ${member.fullName} (${member.id}) এর জন্য ${matchedPV.toLocaleString()} PV ম্যাচিং সম্পন্ন হয়েছে!`
    };
  };

  const executeNetworkBatchMatching = (
    adminId: string,
    reason?: string
  ): { success: boolean; records: MatchingRecord[]; totalMatchedPV: number; message: string } => {
    const eligibleMembers = members.filter(
      (m) => (m.leftCarryForward || 0) > 0 && (m.rightCarryForward || 0) > 0
    );

    if (eligibleMembers.length === 0) {
      return {
        success: false,
        records: [],
        totalMatchedPV: 0,
        message: 'বর্তমানে কোনো মেম্বারের উভয় লেগে ম্যাচিংযোগ্য ক্যারি ফরোয়ার্ড PV নেই।'
      };
    }

    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];
    const newRecords: MatchingRecord[] = [];
    let totalMatchedPV = 0;

    const memberUpdateMap = new Map<string, { leftCF: number; rightCF: number; addedMatch: number }>();

    eligibleMembers.forEach((member, idx) => {
      const leftEligible = member.leftCarryForward;
      const rightEligible = member.rightCarryForward;
      const matched = Math.min(leftEligible, rightEligible);
      if (matched > 0) {
        const leftCF = leftEligible - matched;
        const rightCF = rightEligible - matched;
        totalMatchedPV += matched;

        memberUpdateMap.set(member.id, { leftCF, rightCF, addedMatch: matched });

        newRecords.push({
          matching_id: `MATCH-${Date.now()}-${idx + 1}`,
          member_id: member.id,
          member_name: member.fullName,
          left_pv: leftEligible,
          right_pv: rightEligible,
          matched_pv: matched,
          left_carry_forward: leftCF,
          right_carry_forward: rightCF,
          matching_date: dateStr,
          created_by: adminId || currentUser?.id || 'AANO-SADMIN-001',
          created_at: nowIso,
          notes: reason?.trim() || `Company-wide Batch Matching Cycle (Count: ${eligibleMembers.length})`
        });
      }
    });

    setMembers((prev) =>
      prev.map((m) => {
        const update = memberUpdateMap.get(m.id);
        if (update) {
          return {
            ...m,
            leftCarryForward: update.leftCF,
            rightCarryForward: update.rightCF,
            left_carry_forward: update.leftCF,
            right_carry_forward: update.rightCF,
            totalMatchedPV: (m.totalMatchedPV || 0) + update.addedMatch
          };
        }
        return m;
      })
    );

    setMatchingHistory((prev) => [...newRecords, ...prev]);

    fetch('/api/network/matching/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, reason })
    }).catch(() => undefined);

    if (addAuditLog) {
      addAuditLog(
        'NETWORK_BATCH_MATCHING_EXECUTED',
        'BinaryMatchingEngine',
        `Admin '${adminId}' executed Company-Wide Batch Matching: ${newRecords.length} members matched, Total PV: ${totalMatchedPV.toLocaleString()}. Reason: ${reason || 'Company-wide cycle'}`
      );
    }

    return {
      success: true,
      records: newRecords,
      totalMatchedPV,
      message: `কোম্পানির ${newRecords.length} জন মেম্বারের মোট ${totalMatchedPV.toLocaleString()} PV সফলভাবে ম্যাচিং হয়েছে!`
    };
  };

  const manualCarryForwardAdjustment = (
    memberId: string,
    leftNew: number,
    rightNew: number,
    reason: string,
    adminId: string
  ): { success: boolean; message: string } => {
    if (!reason || !reason.trim()) {
      return { success: false, message: 'এডজাস্টমেন্টের কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।' };
    }
    const member = members.find((m) => m.id === memberId || m.customerId === memberId);
    if (!member) {
      return { success: false, message: `মেম্বার '${memberId}' পাওয়া যায়নি।` };
    }

    const prevLeft = member.leftCarryForward;
    const prevRight = member.rightCarryForward;

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              leftCarryForward: Math.max(0, leftNew),
              rightCarryForward: Math.max(0, rightNew),
              left_carry_forward: Math.max(0, leftNew),
              right_carry_forward: Math.max(0, rightNew)
            }
          : m
      )
    );

    fetch('/api/network/carry-forward/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, leftNew, rightNew, reason, adminId })
    }).catch(() => undefined);

    if (addAuditLog) {
      addAuditLog(
        'MANUAL_CARRY_FORWARD_ADJUSTMENT',
        'BinaryTreeManager',
        `Super Admin '${adminId}' manually adjusted carry-forward for '${member.fullName}' (${member.id}): Left CF (${prevLeft} -> ${leftNew}), Right CF (${prevRight} -> ${rightNew}). Reason: ${reason.trim()}`
      );
    }

    return {
      success: true,
      message: `মেম্বার ${member.fullName} (${member.id}) এর ক্যারি ফরোয়ার্ড সফলভাবে আপডেট করা হয়েছে (Left CF: ${leftNew}, Right CF: ${rightNew})!`
    };
  };

  // ----------------------------------------------------------------------
  // Reports Aggregation Data
  // ----------------------------------------------------------------------
  const networkReports: NetworkReportData = {
    weeklyGrowth: [
      { week: 'সপ্তাহ ১', newMembers: 14, totalPV: 4500, commissionPaid: 18500 },
      { week: 'সপ্তাহ ২', newMembers: 22, totalPV: 7800, commissionPaid: 32000 },
      { week: 'সপ্তাহ ৩', newMembers: 35, totalPV: 12400, commissionPaid: 54000 },
      { week: 'সপ্তাহ ৪', newMembers: 48, totalPV: 18200, commissionPaid: 79500 }
    ],
    monthlyGrowth: [
      { month: 'মে', newMembers: 85, totalPV: 28000, commissionPaid: 120000 },
      { month: 'জুন', newMembers: 140, totalPV: 52000, commissionPaid: 210000 },
      { month: 'জুলাই', newMembers: 210, totalPV: 89000, commissionPaid: 380000 },
      { month: 'আগস্ট', newMembers: 320, totalPV: 135000, commissionPaid: 580000 }
    ],
    commissionBreakdown: [
      { category: 'স্পন্সর কমিশন', amount: 145000, percentage: 35 },
      { category: 'বাইনারি ম্যাচিং', amount: 185000, percentage: 42 },
      { category: 'জেনারেশন বোনাস (২০ লেভেল)', amount: 65000, percentage: 14 },
      { category: 'র‍্যাঙ্ক ও লিডারশিপ রিওয়ার্ড', amount: 40000, percentage: 9 }
    ],
    topPerformers: [
      { name: 'তাহমিনা আক্তার', rank: 'টিম লিডার', gv: 14700, earnings: 48500 },
      { name: 'ইঞ্জিনিয়ার তানভীর আহমেদ', rank: 'সিনিয়র নেটওয়ার্ক মেম্বার', gv: 9500, earnings: 32000 },
      { name: 'মাহমুদুল হাসান', rank: 'সিনিয়র নেটওয়ার্ক মেম্বার', gv: 6000, earnings: 21500 },
      { name: 'হাসান পারভেজ', rank: 'সিনিয়র টিম লিডার', gv: 41800, earnings: 145000 }
    ]
  };

  // ----------------------------------------------------------------------
  // Auto Member Activation Trigger on Order Delivery + Payment
  // ----------------------------------------------------------------------
  useEffect(() => {
    const handleOrderDelivered = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { userId, customerName, customerPhone, customerEmail } = customEvent.detail || {};
      if (!userId) return;

      const existingMember = members.find((m) => m.userId === userId || m.id === userId);
      if (existingMember && existingMember.active) return; // Already active member

      const reserved = reservedPlacements.find((r) => r.userId === userId);

      executeNetworkActivationAndPlacement({
        userId,
        fullName: customerName || 'নতুন গ্রাহক',
        mobile: customerPhone || '01700000000',
        email: customerEmail,
        sponsorIdInput: 'mem-root',
        reservedSlot: reserved ? { parentMemberId: reserved.parentMemberId, leg: reserved.leg } : undefined
      });
    };

    window.addEventListener('ORDER_DELIVERED_AND_PAID', handleOrderDelivered);
    return () => {
      window.removeEventListener('ORDER_DELIVERED_AND_PAID', handleOrderDelivered);
    };
  }, [members, reservedPlacements]);

  return (
    <NetworkMarketingContext.Provider
      value={{
        members,
        allTreeNodes,
        blankPositions,
        treeState,
        currentMember,
        ownCompanyMemberId,
        isNetworkActive,
        packages,
        ranks,
        commissionConfig,
        wallets,
        transactions,
        withdrawals,
        networkReports,
        reservedPlacements,
        getBlankSlotForParent,
        registerBlankSlotAtomic,
        fetchIsolatedSubtree,
        refreshBinaryTreeFromServer,
        activatePackage,
        addReservedSlot,
        releaseReservedSlot,
        reserveSlotDuringRegistration,
        findSponsor,
        validateSponsorId,
        validateReferId,
        validatePlacementId,
        getCompanyMasterMember,
        findSmartGeoSponsor,
        calculatePlacementRule,
        findAIBinaryPlacement,
        executeNetworkActivationAndPlacement,
        activateNetworkMarketing,
        placeMemberInTree,
        runDailyMatchingEngine,
        requestInstantWithdrawal,
        processPendingHoldingAutoRelease,
        updateMemberProfile,
        updateCommissionConfig,
        updatePackages,
        updateRanks,
        toggleWithdrawalHold,
        manualWalletAdjustment,
        reassignBinaryPlacementBySuperAdmin,
        matchingHistory,
        executeMemberMatching,
        executeNetworkBatchMatching,
        manualCarryForwardAdjustment
      }}
    >
      {children}
    </NetworkMarketingContext.Provider>
  );
};

export const useNetworkMarketing = () => {
  const context = useContext(NetworkMarketingContext);
  if (!context) {
    throw new Error('useNetworkMarketing must be used within NetworkMarketingProvider');
  }
  return context;
};
