/**
 * Pure Binary Tree Engine — AB-1000000001+ Customer IDs, Separated Blank Tree Slots & BFS Placement
 * Shared by Server Persistence Store (binaryTreeStore.ts) and NetworkMarketingContext.tsx
 *
 * Enforces all strict invariants:
 * 1. Root Master ID: AB-1000000001 (migrated from GBD000001)
 * 2. Every registered member auto-generates 2 Blank Child Positions (1st = LEFT, 2nd = RIGHT)
 * 3. Blank Positions are stored as Tree Slots (SLOT-<parentId>-LEFT / SLOT-<parentId>-RIGHT)
 *    and NEVER pre-allocate or burn AB- Customer IDs!
 * 4. Official sequential Customer IDs (AB-1000000001+) are allocated strictly upon successful registration.
 * 5. Automatic BFS Placement checks Referral ID's LEFT -> RIGHT -> level-by-level BFS (LEFT before RIGHT)
 *    strictly within the Referral ID's downward binary subtree.
 * 6. Max 2 direct children per parent enforced via UNIQUE(parentId, leg) checks.
 */

import {
  BinaryTreePersistenceState,
  COMPANY_MASTER_ROOT_ID,
  IdMigrationMapping,
  LegSummaryStats,
  NetworkMember,
  RankLevel
} from '../types/networkMarketing';
import { calculateIdGrade } from './binaryNetworkEngine';
import {
  AB_ID_START_SEQ,
  formatAbCustomerId,
  isBlankSlotIdentifier,
  isValidAbCustomerId,
  makeBlankSlotId,
  parseAbCustomerIdSeq,
  parseLegacyCompanySeq,
  resolveMappedCustomerId
} from './abIdMigrationEngine';

export function formatBinaryCompanyId(seq: number): string {
  if (seq >= AB_ID_START_SEQ) {
    return formatAbCustomerId(seq);
  }
  return formatAbCustomerId(AB_ID_START_SEQ + Math.max(1, Math.floor(seq)) - 1);
}

export function parseBinaryCompanyIdSeq(id?: string | null): number {
  const ab = parseAbCustomerIdSeq(id);
  if (ab > 0) return ab;
  return parseLegacyCompanySeq(id);
}

export function isBlankNode(node?: Pick<NetworkMember, 'nodeStatus' | 'isBlankSlot'> | null): boolean {
  return node?.nodeStatus === 'blank' || node?.isBlankSlot === true;
}

export function isRegisteredNode(node?: Pick<NetworkMember, 'nodeStatus' | 'isBlankSlot'> | null): boolean {
  return !!node && node.nodeStatus !== 'blank' && node.isBlankSlot !== true;
}

export function createBlankChildNode(
  parentId: string,
  leg: 'left' | 'right',
  slotId?: string,
  nowIso: string = new Date().toISOString()
): NetworkMember {
  const resolvedSlotId = (slotId && isBlankSlotIdentifier(slotId)
    ? slotId.trim().toUpperCase()
    : makeBlankSlotId(parentId, leg));
  return {
    id: resolvedSlotId,
    slotId: resolvedSlotId,
    internalId: `slot-${parentId.toLowerCase()}-${leg}`,
    isBlankSlot: true,
    member_id: resolvedSlotId,
    userId: '',
    customerId: '',
    permanentMemberId: '',
    fullName: leg === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT',
    full_name: leg === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT',
    mobile: '',
    email: '',
    joinDate: '',
    created_at: nowIso,
    updated_at: nowIso,
    reservedAt: nowIso,
    rank: 'customer',
    packageId: '',
    packageName: '',
    sponsorId: parentId,
    sponsor_id: parentId,
    parentId,
    parent_id: parentId,
    binaryParentId: parentId,
    binary_parent_id: parentId,
    placementId: parentId,
    placement_id: parentId,
    placementLeg: leg,
    position: leg === 'left' ? 'LEFT' : 'RIGHT',
    leftChildId: undefined,
    rightChildId: undefined,
    leftBlankId: undefined,
    rightBlankId: undefined,
    pv: 0,
    personal_pv: 0,
    leftPV: 0,
    left_pv: 0,
    rightPV: 0,
    right_pv: 0,
    leftCarryForward: 0,
    left_carry_forward: 0,
    rightCarryForward: 0,
    right_carry_forward: 0,
    totalMatchedPV: 0,
    directReferralsCount: 0,
    teamMembersCount: 0,
    active: false,
    status: 'inactive',
    nodeStatus: 'blank',
    placementLocked: false
  };
}

function allocateNextAbCustomerId(
  allocatedIds: Record<string, 'blank' | 'registered' | 'tombstoned'>,
  existingNodes: NetworkMember[],
  lastAbSeq: number
): { customerId: string; nextAbSeq: number } {
  let maxSeq = Math.max(AB_ID_START_SEQ, lastAbSeq);

  for (const n of existingNodes) {
    if (n.nodeStatus !== 'blank') {
      const s = parseAbCustomerIdSeq(n.id);
      if (s > maxSeq) maxSeq = s;
    }
  }
  for (const key of Object.keys(allocatedIds)) {
    if (isValidAbCustomerId(key)) {
      const s = parseAbCustomerIdSeq(key);
      if (s > maxSeq) maxSeq = s;
    }
  }

  let seq = maxSeq + 1;
  let customerId = formatAbCustomerId(seq);
  while (
    allocatedIds[customerId] ||
    existingNodes.some((n) => n.id.toUpperCase() === customerId)
  ) {
    seq += 1;
    customerId = formatAbCustomerId(seq);
  }
  allocatedIds[customerId] = 'registered';
  return { customerId, nextAbSeq: seq };
}

/**
 * Reconciles a node list into a valid, invariant-safe BinaryTreePersistenceState:
 * - Preserves all registered AB- members and their existing relationships
 * - Converts/maintains Blank Child Slots strictly as SLOT-<parentId>-LEFT / SLOT-<parentId>-RIGHT
 * - Enforces UNIQUE(parentId, leg) and max 2 direct children per parent
 * - NEVER burns or increments lastAbCustomerSeq for Blank Slots
 */
export function reconcileBinaryTreeState(
  inputNodes: NetworkMember[],
  prevSeq: number = 0,
  prevAllocated: Record<string, 'blank' | 'registered' | 'tombstoned'> = {},
  version: number = 1,
  lastAbSeq?: number,
  idMigrationMappings?: IdMigrationMapping[],
  migrationReport?: BinaryTreePersistenceState['migrationReport']
): BinaryTreePersistenceState {
  const nowIso = new Date().toISOString();
  const allocatedIds: Record<string, 'blank' | 'registered' | 'tombstoned'> = {
    ...prevAllocated
  };

  let maxAbSeq = Math.max(AB_ID_START_SEQ, lastAbSeq || AB_ID_START_SEQ);
  for (const idKey of Object.keys(allocatedIds)) {
    const ab = parseAbCustomerIdSeq(idKey);
    if (ab > maxAbSeq) maxAbSeq = ab;
  }

  // Clone and deduplicate by node ID (registered takes precedence over blank)
  const nodeMap = new Map<string, NetworkMember>();
  for (const raw of inputNodes) {
    if (!raw || !raw.id) continue;
    const normStatus: 'blank' | 'registered' =
      raw.nodeStatus === 'blank' || raw.isBlankSlot ? 'blank' : 'registered';
    const existing = nodeMap.get(raw.id);
    if (existing && existing.nodeStatus === 'registered' && normStatus === 'blank') {
      continue;
    }

    const legNormalized: 'left' | 'right' =
      raw.placementLeg === 'left' || String(raw.position).toLowerCase() === 'left'
        ? 'left'
        : 'right';

    const resolvedId =
      normStatus === 'blank' && raw.parentId
        ? makeBlankSlotId(raw.parentId, legNormalized)
        : raw.id;

    const normalizedNode: NetworkMember = {
      ...raw,
      id: resolvedId,
      ...(normStatus === 'blank'
        ? {
            slotId: resolvedId,
            isBlankSlot: true,
            customerId: '',
            permanentMemberId: '',
            fullName: legNormalized === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT',
            full_name: legNormalized === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT'
          }
        : {
            isBlankSlot: false,
            member_id: raw.member_id || resolvedId,
            customerId: raw.customerId || resolvedId,
            permanentMemberId: raw.permanentMemberId || resolvedId
          }),
      nodeStatus: normStatus,
      placementLeg: legNormalized,
      position:
        resolvedId === COMPANY_MASTER_ROOT_ID
          ? 'Root'
          : legNormalized === 'left'
          ? 'LEFT'
          : 'RIGHT',
      parent_id: raw.parentId,
      binaryParentId: raw.parentId,
      binary_parent_id: raw.parentId,
      placement_id: raw.parentId
    };

    nodeMap.set(normalizedNode.id, normalizedNode);

    if (normStatus === 'registered') {
      const abSeq = parseAbCustomerIdSeq(normalizedNode.id);
      if (abSeq > maxAbSeq) maxAbSeq = abSeq;
    }

    if (allocatedIds[normalizedNode.id] !== 'tombstoned') {
      allocatedIds[normalizedNode.id] = normStatus;
    }
  }

  // Clear derived parent link pointers before rebuilding deterministically
  for (const node of nodeMap.values()) {
    node.leftChildId = undefined;
    node.rightChildId = undefined;
    node.leftBlankId = undefined;
    node.rightBlankId = undefined;
  }

  // Registered nodes win over blank slots on (parentId, leg)
  const sortedNodes = Array.from(nodeMap.values()).sort((a, b) => {
    if (a.nodeStatus !== b.nodeStatus) {
      return a.nodeStatus === 'registered' ? -1 : 1;
    }
    const sa = parseBinaryCompanyIdSeq(a.id);
    const sb = parseBinaryCompanyIdSeq(b.id);
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  const legSlotOwner = new Map<string, NetworkMember>();

  for (const node of sortedNodes) {
    if (!node.parentId || node.id === COMPANY_MASTER_ROOT_ID) continue;
    const parent = nodeMap.get(node.parentId);
    if (!parent || parent.nodeStatus === 'blank') continue;

    const leg: 'left' | 'right' = node.placementLeg === 'left' ? 'left' : 'right';
    const slotKey = `${parent.id}::${leg}`;

    if (legSlotOwner.has(slotKey)) {
      if (node.nodeStatus === 'blank') {
        nodeMap.delete(node.id);
      }
      continue;
    }

    legSlotOwner.set(slotKey, node);

    if (node.nodeStatus === 'registered') {
      if (leg === 'left') {
        parent.leftChildId = node.id;
        parent.leftBlankId = undefined;
      } else {
        parent.rightChildId = node.id;
        parent.rightBlankId = undefined;
      }
    } else {
      if (leg === 'left') {
        parent.leftBlankId = node.id;
      } else {
        parent.rightBlankId = node.id;
      }
    }
  }

  // Ensure EVERY registered node has a LEFT & RIGHT Blank Tree Slot on unoccupied legs
  const registeredNodes = Array.from(nodeMap.values())
    .filter((n) => n.nodeStatus === 'registered')
    .sort((a, b) => parseBinaryCompanyIdSeq(a.id) - parseBinaryCompanyIdSeq(b.id));

  for (const parent of registeredNodes) {
    if (!parent.leftChildId && !parent.leftBlankId) {
      const leftSlot = createBlankChildNode(parent.id, 'left', makeBlankSlotId(parent.id, 'left'), nowIso);
      nodeMap.set(leftSlot.id, leftSlot);
      allocatedIds[leftSlot.id] = 'blank';
      parent.leftBlankId = leftSlot.id;
    }

    if (!parent.rightChildId && !parent.rightBlankId) {
      const rightSlot = createBlankChildNode(parent.id, 'right', makeBlankSlotId(parent.id, 'right'), nowIso);
      nodeMap.set(rightSlot.id, rightSlot);
      allocatedIds[rightSlot.id] = 'blank';
      parent.rightBlankId = rightSlot.id;
    }
  }

  const finalNodes = Array.from(nodeMap.values()).sort((a, b) => {
    if (a.nodeStatus !== b.nodeStatus) {
      return a.nodeStatus === 'registered' ? -1 : 1;
    }
    const sa = parseBinaryCompanyIdSeq(a.id);
    const sb = parseBinaryCompanyIdSeq(b.id);
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });

  // Compute deterministic placementLevel for all nodes
  const finalNodeMap = new Map(finalNodes.map((n) => [n.id, n]));
  const computedLevels = new Map<string, number>();
  const resolveLevel = (nodeId: string, seen: Set<string>): number => {
    const cached = computedLevels.get(nodeId);
    if (cached !== undefined) return cached;
    if (seen.has(nodeId)) return 1;
    seen.add(nodeId);
    const n = finalNodeMap.get(nodeId);
    if (!n || !n.parentId || n.id === COMPANY_MASTER_ROOT_ID) {
      computedLevels.set(nodeId, 1);
      return 1;
    }
    const parentLvl = resolveLevel(n.parentId, seen);
    const lvl = parentLvl + 1;
    computedLevels.set(nodeId, lvl);
    return lvl;
  };
  for (const n of finalNodes) {
    n.placementLevel = resolveLevel(n.id, new Set<string>());
  }

  const regCount = registeredNodes.length;

  return {
    nodes: finalNodes,
    lastCompanySeq: Math.max(prevSeq || 0, regCount),
    lastAbCustomerSeq: maxAbSeq,
    allocatedIds,
    idMigrationMappings,
    migrationReport,
    version,
    updatedAt: nowIso
  };
}

export function computePlacementLevel(
  allNodes: NetworkMember[],
  nodeId?: string | null
): number {
  if (!nodeId) return 0;
  const nodeById = new Map<string, NetworkMember>();
  for (const n of allNodes) {
    if (n?.id) nodeById.set(n.id, n);
  }
  let curr = nodeById.get(nodeId);
  if (!curr) return 0;
  let level = 1;
  const visited = new Set<string>([curr.id]);
  while (curr && curr.parentId && curr.id !== COMPANY_MASTER_ROOT_ID) {
    if (visited.has(curr.parentId)) break;
    visited.add(curr.parentId);
    const parent = nodeById.get(curr.parentId);
    if (!parent) break;
    level += 1;
    curr = parent;
  }
  return level;
}

export function computeSubtreeLegStats(
  allNodes: NetworkMember[],
  memberId?: string | null
): {
  left: LegSummaryStats;
  right: LegSummaryStats;
  matchingPV: number;
} {
  const emptyLeg: LegSummaryStats = {
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    computedSubtreePV: 0,
    recordedLegPV: 0,
    carryForwardPV: 0,
    totalEligiblePV: 0
  };
  if (!memberId) {
    return { left: { ...emptyLeg }, right: { ...emptyLeg }, matchingPV: 0 };
  }

  const nodeById = new Map<string, NetworkMember>();
  const childrenByParentId = new Map<string, NetworkMember[]>();
  for (const n of allNodes) {
    if (!n?.id || n.nodeStatus === 'blank' || n.isBlankSlot) continue;
    nodeById.set(n.id, n);
    if (n.parentId && n.id !== COMPANY_MASTER_ROOT_ID) {
      const list = childrenByParentId.get(n.parentId) || [];
      list.push(n);
      childrenByParentId.set(n.parentId, list);
    }
  }

  const root = nodeById.get(memberId);
  if (!root) {
    return { left: { ...emptyLeg }, right: { ...emptyLeg }, matchingPV: 0 };
  }

  const countLeg = (startChildId: string | undefined, recordedPV: number, carryForwardPV: number): LegSummaryStats => {
    if (!startChildId || !nodeById.has(startChildId)) {
      return {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        computedSubtreePV: 0,
        recordedLegPV: recordedPV,
        carryForwardPV,
        totalEligiblePV: Math.max(0, recordedPV)
      };
    }

    const queue: string[] = [startChildId];
    const visited = new Set<string>([root.id]);
    let totalMembers = 0;
    let activeMembers = 0;
    let inactiveMembers = 0;
    let computedSubtreePV = 0;

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);
      const curr = nodeById.get(currId);
      if (!curr) continue;

      totalMembers += 1;
      const isActiveNode = curr.active !== false && curr.status !== 'inactive' && (curr.pv || 0) > 0;
      if (isActiveNode) {
        activeMembers += 1;
        computedSubtreePV += Math.max(0, Number(curr.pv) || 0);
      } else {
        inactiveMembers += 1;
      }

      const fallbackChildren = childrenByParentId.get(curr.id) || [];
      const lId =
        curr.leftChildId ||
        fallbackChildren.find((c) => c.placementLeg === 'left' || String(c.position).toLowerCase() === 'left')?.id;
      const rId =
        curr.rightChildId ||
        fallbackChildren.find((c) => c.placementLeg === 'right' || String(c.position).toLowerCase() === 'right')?.id;

      if (lId && !visited.has(lId)) queue.push(lId);
      if (rId && !visited.has(rId)) queue.push(rId);
    }

    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      computedSubtreePV,
      recordedLegPV: recordedPV,
      carryForwardPV,
      totalEligiblePV: Math.max(recordedPV, computedSubtreePV)
    };
  };

  const rootFallbackChildren = childrenByParentId.get(root.id) || [];
  const leftChildId =
    root.leftChildId ||
    rootFallbackChildren.find((c) => c.placementLeg === 'left' || String(c.position).toLowerCase() === 'left')?.id;
  const rightChildId =
    root.rightChildId ||
    rootFallbackChildren.find((c) => c.placementLeg === 'right' || String(c.position).toLowerCase() === 'right')?.id;

  const left = countLeg(leftChildId, Number(root.leftPV) || 0, Number(root.leftCarryForward) || 0);
  const right = countLeg(rightChildId, Number(root.rightPV) || 0, Number(root.rightCarryForward) || 0);
  const matchingPV = Math.min(left.carryForwardPV, right.carryForwardPV);

  return { left, right, matchingPV };
}

export interface AutoBfsPlacementResult {
  found: boolean;
  message: string;
  referralNode?: NetworkMember;
  placementParentNode?: NetworkMember;
  position?: 'LEFT' | 'RIGHT';
  leg?: 'left' | 'right';
  blankSlotId?: string;
}

export interface ReferralValidationResult {
  valid: boolean;
  statusCode: number;
  message: string;
  referralNode?: NetworkMember;
}

/**
 * Validates that a Referral ID exists, is registered (not a blank slot),
 * and is eligible (not deactivated or suspended).
 */
export function validateReferralMember(
  allNodes: NetworkMember[],
  referralIdInput?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): ReferralValidationResult {
  const cleanRef = (referralIdInput || '').trim();
  if (!cleanRef) {
    return {
      valid: false,
      statusCode: 400,
      message: 'অনুগ্রহ করে একটি বৈধ Referral ID প্রদান করুন।'
    };
  }

  const referralNode = findBinaryTreeNodeById(allNodes, cleanRef, idMigrationMappings);
  if (!referralNode || referralNode.nodeStatus === 'blank' || referralNode.isBlankSlot) {
    return {
      valid: false,
      statusCode: 404,
      message: `Referral ID '${cleanRef}' ডাটাবেজে খুঁজে পাওয়া যায়নি বা অনুমোদিত মেম্বার নয়।`
    };
  }

  if (referralNode.registrationStatus === 'pending') {
    return {
      valid: false,
      statusCode: 403,
      message: `Referral ID '${referralNode.id}' এখনো নিবন্ধন সম্পন্ন করেনি।`
    };
  }

  // Newly registered unpaid customer (0 PV, activationStatus === 'inactive', no package) may still share referral link;
  // Explicitly deactivated or previously-active inactive members (e.g. status='inactive' & active=false on seeded/existing) are rejected.
  const isUnactivatedNewCustomer =
    referralNode.activationStatus === 'inactive' &&
    (referralNode.pv || 0) === 0 &&
    !referralNode.packageId &&
    referralNode.registrationStatus === 'completed';

  const isDeactivated =
    (referralNode.active === false || referralNode.status === 'inactive') &&
    !isUnactivatedNewCustomer;

  if (isDeactivated) {
    return {
      valid: false,
      statusCode: 400,
      message: `Referral ID '${referralNode.id}' (${referralNode.fullName}) বর্তমানে নিষ্ক্রিয় (Inactive)। সক্রিয় Referral ID ব্যবহার করুন।`
    };
  }

  return {
    valid: true,
    statusCode: 200,
    message: `বৈধ স্পন্সর: ${referralNode.fullName} (${referralNode.id})`,
    referralNode
  };
}

export interface PlacementSlotAvailability {
  position: 'LEFT' | 'RIGHT';
  leg: 'left' | 'right';
  status: 'available' | 'occupied';
  slotId: string;
  occupiedById?: string;
  occupiedByName?: string;
}

export interface PlacementParentInspectionResult {
  found: boolean;
  eligible: boolean;
  statusCode: number;
  message: string;
  parentNode?: NetworkMember;
  parentId?: string;
  parentName?: string;
  parentLevel?: number;
  left?: PlacementSlotAvailability;
  right?: PlacementSlotAvailability;
}

/**
 * Inspects a Placement Parent ID and returns exact availability for LEFT and RIGHT child slots.
 */
export function inspectPlacementParentSlots(
  allNodes: NetworkMember[],
  parentIdInput?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): PlacementParentInspectionResult {
  const cleanParent = (parentIdInput || '').trim();
  if (!cleanParent) {
    return {
      found: false,
      eligible: false,
      statusCode: 400,
      message: 'অনুগ্রহ করে একটি বৈধ Placement ID প্রদান করুন।'
    };
  }

  const parentNode = findBinaryTreeNodeById(allNodes, cleanParent, idMigrationMappings);
  if (!parentNode || parentNode.nodeStatus === 'blank' || parentNode.isBlankSlot) {
    return {
      found: false,
      eligible: false,
      statusCode: 404,
      message: `Placement ID '${cleanParent}' ডাটাবেজে খুঁজে পাওয়া যায়নি বা নিবন্ধিত সদস্য নয়।`
    };
  }

  const nodeById = new Map<string, NetworkMember>();
  for (const n of allNodes) {
    if (n && n.id) nodeById.set(n.id, n);
  }

  const leftChild = parentNode.leftChildId ? nodeById.get(parentNode.leftChildId) : undefined;
  const rightChild = parentNode.rightChildId ? nodeById.get(parentNode.rightChildId) : undefined;

  const leftOccupied = Boolean(parentNode.leftChildId);
  const rightOccupied = Boolean(parentNode.rightChildId);

  const left: PlacementSlotAvailability = {
    position: 'LEFT',
    leg: 'left',
    status: leftOccupied ? 'occupied' : 'available',
    slotId: parentNode.leftBlankId || makeBlankSlotId(parentNode.id, 'left'),
    occupiedById: parentNode.leftChildId,
    occupiedByName: leftChild?.fullName
  };

  const right: PlacementSlotAvailability = {
    position: 'RIGHT',
    leg: 'right',
    status: rightOccupied ? 'occupied' : 'available',
    slotId: parentNode.rightBlankId || makeBlankSlotId(parentNode.id, 'right'),
    occupiedById: parentNode.rightChildId,
    occupiedByName: rightChild?.fullName
  };

  const eligible = !leftOccupied || !rightOccupied;
  const parentLevel = computePlacementLevel(allNodes, parentNode.id) || 1;

  return {
    found: true,
    eligible,
    statusCode: eligible ? 200 : 409,
    message: eligible
      ? `বৈধ প্লেসমেন্ট প্যারেন্ট: ${parentNode.fullName} (${parentNode.id}) — ${
          !leftOccupied && !rightOccupied
            ? 'LEFT ও RIGHT উভয় পজিশন খালি আছে'
            : !leftOccupied
            ? 'শুধু LEFT পজিশন খালি আছে'
            : 'শুধু RIGHT পজিশন খালি আছে'
        }`
      : `Placement ID '${parentNode.id}' (${parentNode.fullName})-এর LEFT ও RIGHT উভয় পজিশনই ইতিমধ্যে পূর্ণ রয়েছে। অন্য কোনো খালি Placement ID নির্বাচন করুন।`,
    parentNode,
    parentId: parentNode.id,
    parentName: parentNode.fullName,
    parentLevel,
    left,
    right
  };
}

/**
 * Searches registered members by ID, name, or mobile for Manual Placement parent selection,
 * returning up to `limit` matches with their LEFT/RIGHT slot availability.
 */
export function searchPlacementParentCandidates(
  allNodes: NetworkMember[],
  query?: string,
  limit: number = 10
): Array<{
  id: string;
  fullName: string;
  leftAvailable: boolean;
  rightAvailable: boolean;
  eligible: boolean;
}> {
  const q = (query || '').trim().toLowerCase();
  const registered = allNodes.filter((n) => n.nodeStatus !== 'blank' && !n.isBlankSlot);
  const filtered = q
    ? registered.filter(
        (n) =>
          n.id.toLowerCase().includes(q) ||
          n.fullName.toLowerCase().includes(q) ||
          (n.mobile && n.mobile.includes(q))
      )
    : registered;

  return filtered
    .sort((a, b) => {
      const aOpen = !a.leftChildId || !a.rightChildId ? 0 : 1;
      const bOpen = !b.leftChildId || !b.rightChildId ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return a.id.localeCompare(b.id);
    })
    .slice(0, limit)
    .map((n) => {
      const leftAvailable = !n.leftChildId;
      const rightAvailable = !n.rightChildId;
      return {
        id: n.id,
        fullName: n.fullName,
        leftAvailable,
        rightAvailable,
        eligible: leftAvailable || rightAvailable
      };
    });
}

/**
 * Pure Read-Only Breadth-First Search (BFS) Binary Placement Finder:
 * Given a Referral ID:
 * 1. Check Referral ID's direct LEFT position -> if empty, return it.
 * 2. Check Referral ID's direct RIGHT position -> if empty, return it.
 * 3. Traverse Referral ID's downward subtree level-by-level (LEFT before RIGHT)
 *    to locate the first open binary placement slot.
 * NEVER checks outside Referral ID's downward subtree and NEVER mutates sequences.
 */
export function findAutoBfsBinaryPlacement(
  allNodes: NetworkMember[],
  referralIdInput?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): AutoBfsPlacementResult {
  const refCheck = validateReferralMember(allNodes, referralIdInput, idMigrationMappings);
  if (!refCheck.valid || !refCheck.referralNode) {
    return {
      found: false,
      message: refCheck.message
    };
  }
  const referralNode = refCheck.referralNode;

  const nodeById = new Map<string, NetworkMember>();
  for (const n of allNodes) {
    if (n.nodeStatus !== 'blank') nodeById.set(n.id, n);
  }

  const queue: NetworkMember[] = [referralNode];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (visited.has(curr.id)) continue;
    visited.add(curr.id);

    // Always inspect LEFT first, then RIGHT
    if (!curr.leftChildId) {
      const slotId = curr.leftBlankId || makeBlankSlotId(curr.id, 'left');
      return {
        found: true,
        message: `Auto BFS Placement: ${curr.id} এর LEFT পজিশন খালি আছে`,
        referralNode,
        placementParentNode: curr,
        position: 'LEFT',
        leg: 'left',
        blankSlotId: slotId
      };
    }

    if (!curr.rightChildId) {
      const slotId = curr.rightBlankId || makeBlankSlotId(curr.id, 'right');
      return {
        found: true,
        message: `Auto BFS Placement: ${curr.id} এর RIGHT পজিশন খালি আছে`,
        referralNode,
        placementParentNode: curr,
        position: 'RIGHT',
        leg: 'right',
        blankSlotId: slotId
      };
    }

    const leftChild = nodeById.get(curr.leftChildId);
    const rightChild = nodeById.get(curr.rightChildId);
    if (leftChild && !visited.has(leftChild.id)) queue.push(leftChild);
    if (rightChild && !visited.has(rightChild.id)) queue.push(rightChild);
  }

  return {
    found: false,
    message: `Referral ID '${referralNode.id}'-এর সাবট্রি-তে কোনো খালি পজিশন পাওয়া যায়নি।`
  };
}

export interface BlankSlotRegistrationParams {
  reservedCompanyId?: string;
  slotId?: string;
  parentId: string;
  leg: 'left' | 'right';
  userId: string;
  username?: string;
  aponUniqueId?: string;
  fullName: string;
  mobile: string;
  email?: string;
  address?: string;
  nidNumber?: string;
  registrationSource?: string;
  sponsorId?: string;
  sponsorName?: string;
  packageId?: string;
  packageName?: string;
  pv?: number;
  activateWithPackage?: boolean;
  orderOrPaymentRef?: string | null;
  rank?: RankLevel;
  mentorLeader?: string;
  placementMethod?: 'MANUAL' | 'AUTO_BFS';
  enforceUniqueProfileFields?: boolean;
}

export interface BlankSlotRegistrationResult {
  success: boolean;
  statusCode: number;
  message: string;
  state?: BinaryTreePersistenceState;
  registeredMember?: NetworkMember;
  newLeftBlank?: NetworkMember;
  newRightBlank?: NetworkMember;
}

/**
 * Atomically registers a member onto a Blank Tree Slot:
 * - Validates parent, target slot, duplicate user / mobile / email / NID (when enabled)
 * - Allocates the next AB-1000000001+ Customer ID STRICTLY upon passing all validations
 *   (ZERO sequence burn on validation errors or cancelled registrations)
 * - Replaces the Blank Tree Slot with the newly registered AB- member
 * - Immediately auto-generates 2 new Blank Tree Slots underneath (SLOT-<newCustomerId>-LEFT / RIGHT)
 * - Updates parent links, sponsor directReferralsCount, and ancestor leg PVs & teamMembersCount
 */
export function executeAtomicBlankSlotRegistration(
  currentState: BinaryTreePersistenceState,
  params: BlankSlotRegistrationParams,
  idMigrationMappings?: IdMigrationMapping[]
): BlankSlotRegistrationResult {
  const nowIso = new Date().toISOString();
  const cleanParentId = (params.parentId || '').trim();
  const leg: 'left' | 'right' = params.leg === 'left' ? 'left' : 'right';

  const parentNode = findBinaryTreeNodeById(
    currentState.nodes,
    cleanParentId,
    idMigrationMappings || currentState.idMigrationMappings
  );

  if (!parentNode || parentNode.nodeStatus === 'blank') {
    return {
      success: false,
      statusCode: 404,
      message: `প্যারেন্ট আইডি '${params.parentId}' বাইনারি ট্রিতে নিবন্ধিত নয় বা পাওয়া যায়নি।`
    };
  }

  // Prevent duplicate user placement
  if (params.userId) {
    const existingUserNode = currentState.nodes.find(
      (n) => n.nodeStatus === 'registered' && n.userId === params.userId
    );
    if (existingUserNode) {
      return {
        success: false,
        statusCode: 409,
        message: `ডুপ্লিকেট প্লেসমেন্ট প্রতিরোধ: এই ইউজার ইতিমধ্যেই Customer ID '${existingUserNode.id}'-এ প্লেস করা আছে।`
      };
    }
  }

  // Enforce duplicate mobile / email / NID protection on strict registration calls
  if (params.enforceUniqueProfileFields) {
    const normMobile = (params.mobile || '').replace(/\D/g, '').replace(/^880/, '0');
    if (normMobile) {
      const dupMobile = currentState.nodes.find((n) => {
        if (n.nodeStatus === 'blank' || !n.mobile) return false;
        const mNorm = n.mobile.replace(/\D/g, '').replace(/^880/, '0');
        return mNorm === normMobile;
      });
      if (dupMobile) {
        return {
          success: false,
          statusCode: 409,
          message: `এই মোবাইল নম্বর (${params.mobile}) দিয়ে ইতিমধ্যেই Customer ID '${dupMobile.id}' নিবন্ধিত রয়েছে।`
        };
      }
    }

    const normEmail = (params.email || '').trim().toLowerCase();
    if (normEmail) {
      const dupEmail = currentState.nodes.find(
        (n) =>
          n.nodeStatus !== 'blank' &&
          n.email &&
          n.email.trim().toLowerCase() === normEmail
      );
      if (dupEmail) {
        return {
          success: false,
          statusCode: 409,
          message: `এই ইমেইল ঠিকানা (${normEmail}) দিয়ে ইতিমধ্যেই Customer ID '${dupEmail.id}' নিবন্ধিত রয়েছে।`
        };
      }
    }

    const normNid = (params.nidNumber || '').trim().replace(/\s+/g, '');
    if (normNid) {
      const dupNid = currentState.nodes.find(
        (n) =>
          n.nodeStatus !== 'blank' &&
          n.nidNumber &&
          n.nidNumber.trim().replace(/\s+/g, '') === normNid
      );
      if (dupNid) {
        return {
          success: false,
          statusCode: 409,
          message: `এই NID নম্বর দিয়ে ইতিমধ্যেই Customer ID '${dupNid.id}' নিবন্ধিত রয়েছে।`
        };
      }
    }
  }

  // Check if target leg on parent already has a registered child (strict parent+position uniqueness invariant)
  const existingChildNode = currentState.nodes.find(
    (n) =>
      n.nodeStatus === 'registered' &&
      n.parentId === parentNode.id &&
      ((n.placementLeg || '').toLowerCase() === leg ||
        (n.position || '').toUpperCase() === leg.toUpperCase())
  );
  const existingRegisteredChildId =
    (leg === 'left' ? parentNode.leftChildId : parentNode.rightChildId) || existingChildNode?.id;
  if (existingRegisteredChildId) {
    return {
      success: false,
      statusCode: 409,
      message: `প্যারেন্ট '${parentNode.id}'-এর ${leg === 'left' ? 'LEFT' : 'RIGHT'} পজিশন ইতিমধ্যে '${existingRegisteredChildId}' দ্বারা পূর্ণ রয়েছে।`
    };
  }

  // Locate Blank Slot node to replace
  const slotQuery = (params.slotId || params.reservedCompanyId || '').trim().toUpperCase();
  const expectedBlankId = leg === 'left' ? parentNode.leftBlankId : parentNode.rightBlankId;

  let blankNode = currentState.nodes.find(
    (n) =>
      n.nodeStatus === 'blank' &&
      ((slotQuery && n.id.toUpperCase() === slotQuery) ||
        (expectedBlankId && n.id === expectedBlankId) ||
        (n.parentId === parentNode.id && (n.placementLeg || '').toLowerCase() === leg))
  );

  if (slotQuery && blankNode && blankNode.id.toUpperCase() !== slotQuery) {
    // Allow matching SLOT-<parent>-LEG alias cleanly
    const expectedSlotId = makeBlankSlotId(parentNode.id, leg);
    if (slotQuery !== expectedSlotId) {
      return {
        success: false,
        statusCode: 409,
        message: `Blank Slot '${slotQuery}' প্যারেন্ট '${parentNode.id}'-এর '${leg.toUpperCase()}' পজিশনের সাথে সামঞ্জস্যপূর্ণ নয়।`
      };
    }
  }

  if (!blankNode) {
    // If parent leg is genuinely empty but blank slot wasn't materialized yet, synthesize temporary slot descriptor
    blankNode = createBlankChildNode(parentNode.id, leg, makeBlankSlotId(parentNode.id, leg), nowIso);
  }

  // Verify max 2 registered children invariant on parent
  const parentRegisteredChildrenCount = currentState.nodes.filter(
    (n) => n.nodeStatus === 'registered' && n.parentId === parentNode.id
  ).length;
  if (parentRegisteredChildrenCount >= 2) {
    return {
      success: false,
      statusCode: 409,
      message: `প্যারেন্ট '${parentNode.id}'-এর অধীনে ইতিমধ্যে সর্বোচ্চ ২ জন Child বিদ্যমান।`
    };
  }

  // Resolve Sponsor (Referral ID) — strictly separate from Binary Placement Parent
  let sponsorNode = parentNode;
  if (params.sponsorId && params.sponsorId.trim()) {
    const refValidation = validateReferralMember(
      currentState.nodes,
      params.sponsorId,
      idMigrationMappings || currentState.idMigrationMappings
    );
    if (!refValidation.valid || !refValidation.referralNode) {
      return {
        success: false,
        statusCode: refValidation.statusCode,
        message: refValidation.message
      };
    }
    sponsorNode = refValidation.referralNode;
  }

  const hasPaidPackageActivation =
    params.activateWithPackage === true && typeof params.pv === 'number' && params.pv > 0;
  const pvValue = hasPaidPackageActivation ? Number(params.pv) : 0;
  const allocatedIds: Record<string, 'blank' | 'registered' | 'tombstoned'> = {
    ...currentState.allocatedIds
  };

  // CRITICAL: Allocate AB-1000000001+ Customer ID strictly NOW upon valid registration!
  const { customerId: newCustomerId, nextAbSeq } = allocateNextAbCustomerId(
    allocatedIds,
    currentState.nodes,
    currentState.lastAbCustomerSeq || AB_ID_START_SEQ
  );

  // Prevent self-referral or circular lineage
  if (sponsorNode.id === newCustomerId || parentNode.id === newCustomerId) {
    return {
      success: false,
      statusCode: 400,
      message: 'সেল্ফ-রেফারেল বা সার্কুলার প্লেসমেন্ট অনুমোদিত নয়।'
    };
  }

  // Mark consumed slot as tombstoned (never reused)
  if (blankNode.id) {
    allocatedIds[blankNode.id] = 'tombstoned';
  }

  // Create 2 new Blank Tree Slots under the newly registered member (using SLOT- IDs, zero AB- burn)
  const newLeftBlank = createBlankChildNode(
    newCustomerId,
    'left',
    makeBlankSlotId(newCustomerId, 'left'),
    nowIso
  );
  const newRightBlank = createBlankChildNode(
    newCustomerId,
    'right',
    makeBlankSlotId(newCustomerId, 'right'),
    nowIso
  );
  allocatedIds[newLeftBlank.id] = 'blank';
  allocatedIds[newRightBlank.id] = 'blank';

  const parentLevel = computePlacementLevel(currentState.nodes, parentNode.id) || 1;
  const newPlacementLevel = parentLevel + 1;

  const registeredMember: NetworkMember = {
    ...blankNode,
    id: newCustomerId,
    internalId: `int-${newCustomerId.toLowerCase()}`,
    slotId: undefined,
    isBlankSlot: false,
    member_id: newCustomerId,
    permanentMemberId: newCustomerId,
    customerId: newCustomerId,
    aponUniqueId: newCustomerId,
    userId: params.userId,
    username: params.username,
    fullName: params.fullName.trim(),
    full_name: params.fullName.trim(),
    mobile: params.mobile.trim(),
    email: (params.email || '').trim().toLowerCase() || `${params.mobile.trim()}@aponbazar.com`,
    address: params.address?.trim() || '',
    nidNumber: params.nidNumber?.trim() || '',
    kycStatus: params.nidNumber?.trim() ? 'verified' : 'pending',
    registrationStatus: 'completed',
    emailStatus: 'pending',
    registrationSource: params.registrationSource || 'Binary Tree',
    joinDate: nowIso.substring(0, 10),
    created_at: nowIso,
    registeredAt: nowIso,
    updated_at: nowIso,
    rank: hasPaidPackageActivation ? params.rank || 'network_member' : 'customer',
    idGrade: calculateIdGrade(pvValue),
    packageId: hasPaidPackageActivation ? params.packageId || 'pkg-100' : '',
    packageName: hasPaidPackageActivation ? params.packageName || 'স্টার্টার মেম্বার (100 PV)' : '',
    activationStatus: hasPaidPackageActivation ? 'active' : 'inactive',
    activationDate: hasPaidPackageActivation ? nowIso : null,
    orderOrPaymentRef: hasPaidPackageActivation ? params.orderOrPaymentRef || null : null,
    rankQualificationStatus: hasPaidPackageActivation ? 'qualified' : 'unqualified',
    rankAchievedAt: hasPaidPackageActivation ? nowIso : null,
    sponsorId: sponsorNode.id,
    sponsor_id: sponsorNode.id,
    referralId: sponsorNode.id,
    sponsorName: params.sponsorName || sponsorNode.fullName,
    parentId: parentNode.id,
    parent_id: parentNode.id,
    binaryParentId: parentNode.id,
    binary_parent_id: parentNode.id,
    placementId: parentNode.id,
    placement_id: parentNode.id,
    placementLeg: leg,
    position: leg === 'left' ? 'LEFT' : 'RIGHT',
    placementMethod: params.placementMethod || 'AUTO_BFS',
    placementLevel: newPlacementLevel,
    mentorLeader: params.mentorLeader || sponsorNode.fullName,
    memberType: 'Personal',
    member_type: 'Personal',
    leftChildId: undefined,
    rightChildId: undefined,
    leftBlankId: newLeftBlank.id,
    rightBlankId: newRightBlank.id,
    pv: pvValue,
    personal_pv: pvValue,
    leftPV: 0,
    left_pv: 0,
    rightPV: 0,
    right_pv: 0,
    leftCarryForward: 0,
    left_carry_forward: 0,
    rightCarryForward: 0,
    right_carry_forward: 0,
    totalMatchedPV: 0,
    directReferralsCount: 0,
    teamMembersCount: 0,
    active: hasPaidPackageActivation,
    status: hasPaidPackageActivation ? 'active' : 'inactive',
    nodeStatus: 'registered',
    placementLocked: true
  };

  // Compute upline ancestor deltas along binary parent chain
  const ancestorLegDeltas = new Map<string, 'left' | 'right'>();
  let traceParentId: string | undefined = parentNode.id;
  let traceLeg: 'left' | 'right' = leg;
  const visitedAncestors = new Set<string>([registeredMember.id]);

  while (traceParentId && !visitedAncestors.has(traceParentId)) {
    visitedAncestors.add(traceParentId);
    ancestorLegDeltas.set(traceParentId, traceLeg);
    const anc = currentState.nodes.find((n) => n.id === traceParentId);
    if (!anc || !anc.parentId) break;
    traceLeg = anc.placementLeg === 'left' ? 'left' : 'right';
    traceParentId = anc.parentId;
  }

  let replacedExistingBlank = false;
  const updatedNodes = currentState.nodes.map((node) => {
    let nextNode = node;

    if (node.id === blankNode!.id) {
      replacedExistingBlank = true;
      nextNode = registeredMember;
    } else {
      const ancLeg = ancestorLegDeltas.get(node.id);
      if (ancLeg) {
        const isImmediateParent = node.id === parentNode.id;
        nextNode = {
          ...nextNode,
          ...(isImmediateParent
            ? ancLeg === 'left'
              ? { leftChildId: registeredMember.id, leftBlankId: undefined }
              : { rightChildId: registeredMember.id, rightBlankId: undefined }
            : {}),
          ...(ancLeg === 'left'
            ? {
                leftPV: (nextNode.leftPV || 0) + pvValue,
                left_pv: (nextNode.leftPV || 0) + pvValue,
                leftCarryForward: (nextNode.leftCarryForward || 0) + pvValue,
                left_carry_forward: (nextNode.leftCarryForward || 0) + pvValue
              }
            : {
                rightPV: (nextNode.rightPV || 0) + pvValue,
                right_pv: (nextNode.rightPV || 0) + pvValue,
                rightCarryForward: (nextNode.rightCarryForward || 0) + pvValue,
                right_carry_forward: (nextNode.rightCarryForward || 0) + pvValue
              }),
          teamMembersCount: (nextNode.teamMembersCount || 0) + 1,
          updated_at: nowIso
        };
      }

      if (node.id === sponsorNode.id) {
        nextNode = {
          ...nextNode,
          directReferralsCount: (nextNode.directReferralsCount || 0) + 1,
          updated_at: nowIso
        };
      }
    }

    return nextNode;
  });

  if (!replacedExistingBlank) {
    updatedNodes.push(registeredMember);
  }
  updatedNodes.push(newLeftBlank, newRightBlank);

  const registeredTotal = updatedNodes.filter((n) => n.nodeStatus !== 'blank').length;

  const nextState: BinaryTreePersistenceState = {
    nodes: updatedNodes,
    lastCompanySeq: Math.max(currentState.lastCompanySeq || 0, registeredTotal),
    lastAbCustomerSeq: nextAbSeq,
    allocatedIds,
    idMigrationMappings: currentState.idMigrationMappings,
    migrationReport: currentState.migrationReport,
    version: currentState.version + 1,
    updatedAt: nowIso
  };

  return {
    success: true,
    statusCode: 200,
    message: `সদস্য ${registeredMember.fullName} (${registeredMember.id}) সফলভাবে নিবন্ধিত হয়েছে এবং বাম (${newLeftBlank.id}) ও ডান (${newRightBlank.id}) Blank Position তৈরি হয়েছে!`,
    state: nextState,
    registeredMember,
    newLeftBlank,
    newRightBlank
  };
}

export interface IsolatedSubtreeStats {
  selectedCompanyId: string;
  networkMembers: number;
  descendantMembers: number;
  blankPositions: number;
  totalNodes: number;
  treeLevels: number;
  registeredLevels: number;
}

export interface IsolatedSubtreeExtraction {
  found: boolean;
  rootId?: string;
  rootNode?: NetworkMember;
  nodes: NetworkMember[];
  stats?: IsolatedSubtreeStats;
}

/**
 * Resolves a node in the binary tree by Customer ID (AB-... / Member ID),
 * legacy ID mapped via idMigrationMappings (e.g. GBD000002 / A-00002), or Apon Unique ID.
 */
export function findBinaryTreeNodeById(
  allNodes: NetworkMember[],
  queryId?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): NetworkMember | undefined {
  const clean = (queryId || '').trim().toLowerCase();
  if (!clean) return undefined;

  const direct = allNodes.find(
    (n) =>
      n.id.toLowerCase() === clean ||
      (n.member_id && n.member_id.toLowerCase() === clean) ||
      (n.customerId && n.customerId.toLowerCase() === clean) ||
      (n.permanentMemberId && n.permanentMemberId.toLowerCase() === clean) ||
      (n.aponUniqueId && n.aponUniqueId.toLowerCase() === clean) ||
      (n.legacyId && n.legacyId.toLowerCase() === clean) ||
      (n.slotId && n.slotId.toLowerCase() === clean)
  );
  if (direct) return direct;

  // Resolve historical legacy ID through migration mapping registry
  const mappedAbId = resolveMappedCustomerId(queryId, idMigrationMappings);
  if (mappedAbId) {
    return allNodes.find((n) => n.id.toLowerCase() === mappedAbId.toLowerCase());
  }

  return undefined;
}

/**
 * Extracts strictly the downward binary subtree starting from `targetCompanyId`.
 * - ZERO ancestors above `targetCompanyId` are included.
 * - ZERO sibling branches are included.
 * - Strips parent/ancestor placement pointers from the temporary root DTO so callers see an isolated root.
 */
export function extractIsolatedBinarySubtree(
  allNodes: NetworkMember[],
  targetCompanyId?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): IsolatedSubtreeExtraction {
  const targetRoot = findBinaryTreeNodeById(allNodes, targetCompanyId, idMigrationMappings);
  if (!targetRoot) {
    return {
      found: false,
      nodes: []
    };
  }

  const nodeById = new Map<string, NetworkMember>();
  const childrenByParentId = new Map<string, NetworkMember[]>();

  for (const n of allNodes) {
    if (!n || !n.id) continue;
    nodeById.set(n.id, n);
    if (n.parentId && n.id !== COMPANY_MASTER_ROOT_ID) {
      const list = childrenByParentId.get(n.parentId) || [];
      list.push(n);
      childrenByParentId.set(n.parentId, list);
    }
  }

  const visited = new Set<string>([targetRoot.id]);
  const queue: Array<{ node: NetworkMember; level: number }> = [
    { node: targetRoot, level: 1 }
  ];
  const subtreeNodes: NetworkMember[] = [];

  let maxLevel = 1;
  let maxRegisteredLevel = targetRoot.nodeStatus === 'blank' ? 0 : 1;

  while (queue.length > 0) {
    const current = queue.shift()!;
    const { node, level } = current;

    if (level > maxLevel) maxLevel = level;
    if (node.nodeStatus !== 'blank' && level > maxRegisteredLevel) {
      maxRegisteredLevel = level;
    }

    const dto: NetworkMember =
      node.id === targetRoot.id
        ? {
            ...node,
            parentId: undefined,
            parent_id: undefined,
            binaryParentId: undefined,
            binary_parent_id: undefined,
            placementId: undefined,
            placement_id: undefined
          }
        : { ...node };

    subtreeNodes.push(dto);

    const fallbackChildren = childrenByParentId.get(node.id) || [];
    const leftId =
      node.leftChildId ||
      node.leftBlankId ||
      fallbackChildren.find(
        (c) => c.placementLeg === 'left' || String(c.position).toLowerCase() === 'left'
      )?.id;
    const rightId =
      node.rightChildId ||
      node.rightBlankId ||
      fallbackChildren.find(
        (c) => c.placementLeg === 'right' || String(c.position).toLowerCase() === 'right'
      )?.id;

    if (leftId && !visited.has(leftId)) {
      const leftChild = nodeById.get(leftId);
      if (leftChild) {
        visited.add(leftId);
        queue.push({ node: leftChild, level: level + 1 });
      }
    }

    if (rightId && !visited.has(rightId)) {
      const rightChild = nodeById.get(rightId);
      if (rightChild) {
        visited.add(rightId);
        queue.push({ node: rightChild, level: level + 1 });
      }
    }
  }

  const networkMembers = subtreeNodes.filter((n) => n.nodeStatus !== 'blank').length;
  const blankPositions = subtreeNodes.filter((n) => n.nodeStatus === 'blank').length;
  const rootIsRegistered = targetRoot.nodeStatus !== 'blank';

  const stats: IsolatedSubtreeStats = {
    selectedCompanyId: targetRoot.id,
    networkMembers,
    descendantMembers: Math.max(0, networkMembers - (rootIsRegistered ? 1 : 0)),
    blankPositions,
    totalNodes: subtreeNodes.length,
    treeLevels: maxLevel,
    registeredLevels: maxRegisteredLevel
  };

  return {
    found: true,
    rootId: targetRoot.id,
    rootNode: subtreeNodes[0],
    nodes: subtreeNodes,
    stats
  };
}

/**
 * Checks whether `targetCompanyId` equals `ancestorCompanyId` or resides strictly inside
 * `ancestorCompanyId`'s downward binary subtree.
 */
export function isCompanyIdInSubtree(
  allNodes: NetworkMember[],
  ancestorCompanyId?: string | null,
  targetCompanyId?: string | null,
  idMigrationMappings?: IdMigrationMapping[]
): boolean {
  const target = findBinaryTreeNodeById(allNodes, targetCompanyId, idMigrationMappings);
  if (!target) return false;
  const extraction = extractIsolatedBinarySubtree(allNodes, ancestorCompanyId, idMigrationMappings);
  if (!extraction.found) return false;
  return extraction.nodes.some((n) => n.id === target.id);
}
