/**
 * Network Marketing Engine Domain Types
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

export type RankLevel =
  | 'customer'
  | 'network_member'
  | 'senior_network_member'
  | 'team_leader'
  | 'senior_team_leader'
  | 'area_manager'
  | 'regional_manager'
  | 'general_manager'
  | 'director'
  | 'founder';

export interface ActivationPackage {
  id: string;
  name: string;
  nameBn: string;
  pv: number; // 100, 200, 300, 400, 500 PV
  priceBDT: number;
  benefitsBn: string[];
  benefitsEn: string[];
  isPopular?: boolean;
  isActive: boolean;
}

export interface IdGradeConfig {
  minPV: number;
  gradeName: string;
  badgeClass?: string;
}

export const COMPANY_MASTER_ROOT_ID = 'GBD000001';

export interface MatchingRecord {
  matching_id: string;
  member_id: string;
  member_name: string;
  left_pv: number;
  right_pv: number;
  matched_pv: number;
  left_carry_forward: number;
  right_carry_forward: number;
  matching_date: string;
  created_by: string;
  created_at: string;
  notes?: string;
  audit_hash?: string;
}

export interface NetworkMember {
  id: string;
  member_id?: string; // Relational database alias
  userId: string;
  username?: string; // Manual User ID (e.g. Mirzabd)
  customerId?: string; // Auto-generated permanent Customer ID (e.g. CUST-100001)
  permanentMemberId?: string; // Permanent unique identifier
  fullName: string;
  full_name?: string; // Relational database alias
  mobile: string;
  email: string;
  address?: string;
  registrationSource?: 'Dashboard' | 'Binary Tree' | string;
  joinDate: string;
  created_at?: string; // Relational database alias
  updated_at?: string;
  rank: RankLevel;
  idGrade?: string; // Dynamic ID Grade (e.g. 200 PV, 100 PV, 0 PV)
  packageId: string;
  packageName: string;
  sponsorId?: string; // Direct Referrer ID (sponsor_id)
  sponsor_id?: string; // Alias for sponsor_id
  sponsorName?: string;
  parentId?: string; // Binary Placement Parent ID (binary_parent_id, NULL for Root)
  parent_id?: string; // Relational alias
  binaryParentId?: string; // Alias for binary_parent_id
  binary_parent_id?: string; // Alias for binary_parent_id
  placementId?: string;
  placement_id?: string; // Relational alias
  placementLeg: 'left' | 'right';
  position?: 'left' | 'right' | 'Root' | string; // Binary Position: left / right
  leftChildId?: string; // Max 1 Left Child in Binary Tree
  rightChildId?: string; // Max 1 Right Child in Binary Tree
  pv: number; // Personal Volume
  personal_pv?: number; // Relational alias
  leftPV: number; // Group Volume Left Leg
  left_pv?: number; // Relational alias
  rightPV: number; // Group Volume Right Leg
  right_pv?: number; // Relational alias
  leftCarryForward: number;
  left_carry_forward?: number; // Relational alias
  rightCarryForward: number;
  right_carry_forward?: number; // Relational alias
  totalMatchedPV: number;
  directReferralsCount: number;
  teamMembersCount: number;
  active: boolean;
  status?: 'active' | 'inactive'; // Relational alias
  avatarUrl?: string;
  memberType?: 'Company' | 'Personal' | string;
  member_type?: string; // Relational alias
  mentorLeader?: string;
  placementLocked?: boolean; // Locked permanently once set
}

export interface CommissionConfig {
  sponsorCommissionPct: number; // e.g. 10%
  binaryMatchingRateBDT: number; // e.g. 10 BDT per 1 PV matched
  binaryMatchingCapDailyPV: number; // e.g. 5000 PV cap/day
  generationCommissionPcts: number[]; // Array of 20 levels (e.g. [5, 3, 2, 1, 1, 0.5, ...])
  leadershipBonusPct: number; // e.g. 5%
  rankBonusValues: Record<string, number>; // BDT per rank
  cashbackPct: number; // e.g. 5%
  salesBonusPct: number; // e.g. 3%
  performanceBonusPct: number; // e.g. 4%
  campaignBonusPct: number; // e.g. 2%
  specialIncentiveBDT: number; // e.g. 5000
  pendingHoldingDays: number; // e.g. 7 days holding period
  withdrawalMinBDT: number; // e.g. 500 BDT
  withdrawalFeePct: number; // e.g. 2%
}

export interface UserWallets {
  mainWallet: number;
  commissionWallet: number;
  pendingCommissionWallet: number;
  rewardWallet: number;
  cashWallet: number;
}

export type WalletType = 'main' | 'commission' | 'pending' | 'reward' | 'cash';

export interface WalletTransaction {
  id: string;
  userId: string;
  walletType: WalletType;
  type: 'credit' | 'debit' | 'transfer' | 'payout' | 'auto_release' | 'withdrawal';
  amount: number;
  source:
    | 'sponsor_commission'
    | 'binary_matching'
    | 'generation_bonus'
    | 'leadership_bonus'
    | 'rank_reward'
    | 'cashback'
    | 'withdrawal'
    | 'deposit'
    | 'admin_adjustment'
    | 'package_activation';
  status: 'completed' | 'pending' | 'held_for_review' | 'rejected';
  description: string;
  date: string;
  referenceId?: string;
}

export interface RankRequirement {
  rank: RankLevel;
  titleEn: string;
  titleBn: string;
  level: number;
  requiredPV: number; // Personal PV
  requiredTeamPV: number; // Total Group PV (GV)
  requiredActiveDirects: number;
  rewardType: 'cash' | 'gift' | 'travel' | 'vehicle' | 'house' | 'recognition';
  rewardTitleBn: string;
  rewardTitleEn: string;
  rewardValueBDT: number;
  badgeIcon: string;
  certificateAvailable: boolean;
}

export type WithdrawalMethod = 'bank' | 'bkash' | 'nagad' | 'rocket' | 'cash_wallet';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userMobile: string;
  method: WithdrawalMethod;
  accountDetails: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'instant_completed' | 'held_for_security_review' | 'admin_approved' | 'rejected';
  holdReason?: string;
  requestDate: string;
  processedDate?: string;
}

export interface AISmartGeoResult {
  sponsor: NetworkMember;
  distanceKm: number;
  reasoning: string;
}

export interface AIActivationPlacementResult {
  success: boolean;
  message: string;
  member?: NetworkMember;
  referralCode?: string;
  referralLink?: string;
  sponsorId?: string;
  sponsorName?: string;
  placementId?: string;
  placementName?: string;
  placementLeg?: 'left' | 'right';
  binaryPositionText?: string;
  isGeoMatched?: boolean;
  geoDistanceKm?: number;
}

export interface NetworkReportData {
  weeklyGrowth: { week: string; newMembers: number; totalPV: number; commissionPaid: number }[];
  monthlyGrowth: { month: string; newMembers: number; totalPV: number; commissionPaid: number }[];
  commissionBreakdown: { category: string; amount: number; percentage: number }[];
  topPerformers: { name: string; rank: string; gv: number; earnings: number }[];
}

export interface ReservedSlot {
  id: string;
  userId: string;
  customerName: string;
  customerMobile: string;
  parentMemberId: string;
  leg: 'left' | 'right';
  createdAt: string;
}
