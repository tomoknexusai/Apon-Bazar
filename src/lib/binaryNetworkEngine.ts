/**
 * Binary Network Engine & Dynamic PV / ID Grade Calculations
 * Project: TOMSHOPBD (Ghorer Bazar BD)
 */

import { NetworkMember, IdGradeConfig } from '../types/networkMarketing';
import { UserProfile } from '../types';

/**
 * Configurable ID Grade thresholds
 * 200 PV -> 200 PV Grade
 * 100 PV -> 100 PV Grade
 * <100 PV -> 0 PV Grade
 */
export const DEFAULT_ID_GRADE_CONFIGS: IdGradeConfig[] = [
  {
    minPV: 200,
    gradeName: '200 PV',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  },
  {
    minPV: 100,
    gradeName: '100 PV',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
  },
  {
    minPV: 0,
    gradeName: '0 PV',
    badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
  }
];

/**
 * Calculates ID Grade dynamically from Personal PV
 */
export function calculateIdGrade(personalPV: number, configs: IdGradeConfig[] = DEFAULT_ID_GRADE_CONFIGS): string {
  const pv = Number(personalPV) || 0;
  const sorted = [...configs].sort((a, b) => b.minPV - a.minPV);
  for (const grade of sorted) {
    if (pv >= grade.minPV) {
      return grade.gradeName;
    }
  }
  return '0 PV';
}

/**
 * Gets badge styling for an ID Grade
 */
export function getIdGradeBadgeClass(gradeName?: string, configs: IdGradeConfig[] = DEFAULT_ID_GRADE_CONFIGS): string {
  const match = configs.find((c) => c.gradeName === gradeName);
  return match?.badgeClass || 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-400';
}

/**
 * Traverses binary tree downwards and calculates the total PV in a subtree or specific leg.
 * Dynamic and non-hardcoded.
 */
export function calculateDynamicSubtreePV(
  memberId: string | undefined,
  members: NetworkMember[],
  leg?: 'left' | 'right'
): number {
  if (!memberId) return 0;
  const member = members.find((m) => m.id === memberId || m.customerId === memberId);
  if (!member) return 0;

  const targetRootChildId = leg === 'left' ? member.leftChildId : leg === 'right' ? member.rightChildId : undefined;

  // If calculating for a specific leg and that child doesn't exist:
  if (leg && !targetRootChildId) {
    return 0;
  }

  // If a specific leg was requested, traverse starting from that child node
  const startId = leg ? targetRootChildId : member.id;
  if (!startId) return 0;

  let totalPV = 0;
  const queue: string[] = [startId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentNode = members.find((m) => m.id === currentId || m.customerId === currentId);
    if (!currentNode) continue;

    // Accumulate Personal PV of node
    totalPV += Number(currentNode.pv) || 0;

    // Queue children
    if (currentNode.leftChildId && !visited.has(currentNode.leftChildId)) {
      queue.push(currentNode.leftChildId);
    }
    if (currentNode.rightChildId && !visited.has(currentNode.rightChildId)) {
      queue.push(currentNode.rightChildId);
    }
  }

  return totalPV;
}

/**
 * Formats date into "14 Sep 2026"
 */
export function formatJoiningDate(dateInput?: string | Date): string {
  if (!dateInput) {
    const now = new Date();
    return formatJoiningDate(now);
  }

  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return String(dateInput);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats number with commas e.g. 1,250
 */
export function formatPVNumber(num: number): string {
  const val = Math.round(Number(num) || 0);
  return val.toLocaleString('en-US');
}

export interface NodeDisplayData {
  name: string;
  customerId: string;
  userId: string;
  username: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  idGrade: string;
  personalPV: number;
  leftPV: number;
  rightPV: number;
  mobile: string;
  email: string;
  referId: string;
  placementId: string;
  position: string;
  address: string;
  registrationSource: string;
}

/**
 * Extract clean, verified Node display data conforming strictly to:
 * 1. Name
 * 2. Customer ID
 * 3. Joining Date
 * 4. Active / Inactive Status
 * 5. ID Grade
 * 6. Personal PV
 * 7. Left PV
 * 8. Right PV
 */
export function getNodeDisplayData(
  member: NetworkMember,
  allMembers: NetworkMember[],
  allUsers: UserProfile[] = []
): NodeDisplayData {
  const matchedUser = allUsers.find(
    (u) =>
      u.id === member.userId ||
      (member.customerId && (u.customerId === member.customerId || u.permanentMemberId === member.customerId)) ||
      (member.id && (u.permanentMemberId === member.id || u.customerId === member.id))
  );

  const name = member.fullName || matchedUser?.fullName || 'Anonymous';
  const customerId = member.customerId || matchedUser?.customerId || matchedUser?.permanentMemberId || member.id;
  const username = member.username || matchedUser?.username || '';
  const joiningDate = formatJoiningDate(member.joinDate || matchedUser?.createdAt);
  const status: 'ACTIVE' | 'INACTIVE' = member.active ? 'ACTIVE' : 'INACTIVE';
  
  // Calculate Personal PV
  const personalPV = Number(member.pv) || 0;

  // Auto-calculate dynamic ID Grade
  const idGrade = member.idGrade || calculateIdGrade(personalPV);

  // Calculate dynamic Left and Right PV from the tree
  const dynamicLeftPV = calculateDynamicSubtreePV(member.id, allMembers, 'left');
  const dynamicRightPV = calculateDynamicSubtreePV(member.id, allMembers, 'right');

  // Fallback to stored PV if dynamic returned 0 but member had cached PV (smooth migration)
  const finalLeftPV = dynamicLeftPV > 0 ? dynamicLeftPV : (Number(member.leftPV) || 0);
  const finalRightPV = dynamicRightPV > 0 ? dynamicRightPV : (Number(member.rightPV) || 0);

  const referId = member.sponsorId || matchedUser?.referralId || matchedUser?.sponsorId || 'None';
  const placementId = member.parentId || matchedUser?.placementId || 'Root';
  const position = (member.position || member.placementLeg || matchedUser?.placementLeg || 'right').toUpperCase();
  const address = member.address || matchedUser?.mandatoryAddress?.fullServiceAddress || 'N/A';
  const registrationSource = member.registrationSource || matchedUser?.registrationSource || 'Dashboard';

  return {
    name,
    customerId,
    userId: member.userId || matchedUser?.id || '',
    username,
    joiningDate,
    status,
    idGrade,
    personalPV,
    leftPV: finalLeftPV,
    rightPV: finalRightPV,
    mobile: member.mobile || matchedUser?.mobileNumber || '',
    email: member.email || matchedUser?.email || '',
    referId,
    placementId,
    position,
    address,
    registrationSource
  };
}
