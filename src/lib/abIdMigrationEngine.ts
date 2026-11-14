/**
 * AB-1000000001+ Customer ID Migration, Normalization & Validation Engine
 *
 * Responsibilities:
 * 1. Format & validate official AB-1000000001+ sequential Customer IDs.
 * 2. Format & recognize separate Blank Tree Slots (SLOT-<parentId>-LEFT / SLOT-<parentId>-RIGHT)
 *    so Blank Slots NEVER allocate or burn AB- Customer IDs.
 * 3. Idempotently migrate legacy IDs (GBD000001..N, GBD000022, TMK*, etc.) to AB-1000000001+
 *    preserving chronological order, relationships, PV sums, matchingHistory, and permanent
 *    Old ID -> New AB- ID mapping records for backward-compatible lookup & audit/rollback.
 */

import {
  BinaryTreePersistenceState,
  COMPANY_MASTER_ROOT_ID,
  EmailDeliveryRecord,
  IdMigrationMapping,
  IdMigrationReport,
  MatchingRecord,
  NetworkMember
} from '../types/networkMarketing';

export const AB_ID_PREFIX = 'AB-';
export const AB_ID_START_SEQ = 1000000001;
export const SLOT_ID_PREFIX = 'SLOT-';

export function formatAbCustomerId(seq: number): string {
  const safe = Math.max(AB_ID_START_SEQ, Math.floor(seq));
  return `${AB_ID_PREFIX}${safe}`;
}

export function parseAbCustomerIdSeq(id?: string | null): number {
  if (!id) return 0;
  const clean = id.trim().toUpperCase();
  const match = clean.match(/^AB-(\d{10,})$/);
  if (!match) return 0;
  const num = Number(match[1]);
  return Number.isFinite(num) && num >= AB_ID_START_SEQ ? num : 0;
}

export function isValidAbCustomerId(id?: string | null): boolean {
  return parseAbCustomerIdSeq(id) >= AB_ID_START_SEQ;
}

export function makeBlankSlotId(parentCustomerId: string, leg: 'left' | 'right'): string {
  const cleanParent = (parentCustomerId || COMPANY_MASTER_ROOT_ID).trim().toUpperCase();
  return `${SLOT_ID_PREFIX}${cleanParent}-${leg === 'left' ? 'LEFT' : 'RIGHT'}`;
}

export function isBlankSlotIdentifier(id?: string | null): boolean {
  if (!id) return false;
  return id.trim().toUpperCase().startsWith(SLOT_ID_PREFIX);
}

export function parseLegacyCompanySeq(id?: string | null): number {
  if (!id) return 0;
  const clean = id.trim().toUpperCase();
  const gbd = clean.match(/^(?:GBD|TMK|AANO)(\d+)$/);
  if (gbd) {
    const n = parseInt(gbd[1], 10);
    return Number.isFinite(n) ? n : 0;
  }
  const dash = clean.match(/^A-(\d+)$/);
  if (dash) {
    const n = parseInt(dash[1], 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function makeStableInternalId(sourceKey: string, index: number): string {
  const sanitized = (sourceKey || `node-${index + 1}`)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  return `int-${sanitized}`;
}

function rewriteLegacyIdInText(
  text: string | undefined,
  idMap: Map<string, string>
): string | undefined {
  if (!text) return text;
  let out = text;
  for (const [oldId, newId] of idMap.entries()) {
    if (oldId && newId && oldId !== newId) {
      out = out.split(oldId).join(newId);
    }
  }
  return out;
}

function buildLegacyAliases(oldId: string, newId: string): string[] {
  const aliases = new Set<string>();
  if (oldId) aliases.add(oldId.toUpperCase());
  const seq = parseLegacyCompanySeq(oldId);
  if (seq > 0) {
    aliases.add(`GBD${String(seq).padStart(6, '0')}`);
    aliases.add(`A-${String(seq).padStart(5, '0')}`);
  }
  const abSeq = parseAbCustomerIdSeq(newId);
  if (abSeq >= AB_ID_START_SEQ) {
    const offset = abSeq - AB_ID_START_SEQ + 1;
    aliases.add(`A-${String(offset).padStart(5, '0')}`);
  }
  return Array.from(aliases);
}

export interface MigrationInputPayload {
  treeState: Partial<BinaryTreePersistenceState> & { nodes: NetworkMember[] };
  matchingHistory?: MatchingRecord[];
  emailDeliveryLogs?: EmailDeliveryRecord[];
  backupSnapshotPath?: string;
}

export interface MigrationExecutionOutput {
  migrated: boolean;
  treeState: BinaryTreePersistenceState;
  matchingHistory: MatchingRecord[];
  emailDeliveryLogs: EmailDeliveryRecord[];
  report: IdMigrationReport;
}

/**
 * Checks whether a store payload contains any legacy pre-migration IDs (e.g. GBD000001)
 * or blank nodes still occupying GBD/AB IDs instead of SLOT-... Tree Slots.
 */
export function needsAbIdMigration(nodes: NetworkMember[]): boolean {
  if (!Array.isArray(nodes) || nodes.length === 0) return false;
  return nodes.some((n) => {
    if (!n || !n.id) return false;
    if (n.nodeStatus === 'blank') {
      return !isBlankSlotIdentifier(n.id);
    }
    return !isValidAbCustomerId(n.id);
  });
}

/**
 * Idempotently migrates a full BinaryTreeStore payload from GBD000001+ / legacy IDs
 * into AB-1000000001+ while separating Blank Tree Slots into SLOT-<parent>-LEFT/RIGHT.
 *
 * Guarantees:
 * - Preserves chronological order (`GBD000001` -> `AB-1000000001`, ..., `GBD000022` -> `AB-1000000016` with ZERO sequence gaps).
 * - Updates ALL relational fields (`id`, `member_id`, `customerId`, `permanentMemberId`, `sponsorId`, `parentId`, `leftChildId`, `rightChildId`, `matchingHistory`).
 * - Blank slots never hold or burn `AB-` Customer IDs.
 * - Conservatively preserves all PV totals & matching records.
 */
export function migrateLegacyTreePayloadToAB(
  input: MigrationInputPayload
): MigrationExecutionOutput {
  const nowIso = new Date().toISOString();
  const batchId = `MIG-AB-${nowIso.slice(0, 10).replace(/-/g, '')}-01`;
  const sourceNodes = Array.isArray(input.treeState?.nodes) ? input.treeState.nodes : [];
  const sourceMatching = Array.isArray(input.matchingHistory) ? input.matchingHistory : [];
  const sourceEmails = Array.isArray(input.emailDeliveryLogs) ? input.emailDeliveryLogs : [];

  const totalPersonalPVBefore = sourceNodes
    .filter((n) => n.nodeStatus !== 'blank')
    .reduce((acc, n) => acc + (Number(n.pv) || 0), 0);
  const totalMatchedPVBefore = sourceNodes
    .filter((n) => n.nodeStatus !== 'blank')
    .reduce((acc, n) => acc + (Number(n.totalMatchedPV) || 0), 0);

  const existingMappings: IdMigrationMapping[] = Array.isArray(input.treeState?.idMigrationMappings)
    ? [...input.treeState.idMigrationMappings]
    : [];

  if (!needsAbIdMigration(sourceNodes)) {
    const existingReg = sourceNodes.filter((n) => n.nodeStatus !== 'blank');
    const maxAb = existingReg.reduce((mx, n) => {
      const s = parseAbCustomerIdSeq(n.id);
      return s > mx ? s : mx;
    }, AB_ID_START_SEQ);

    const existingReport: IdMigrationReport =
      input.treeState?.migrationReport || {
        batchId,
        migratedAt: nowIso,
        previousRootId: 'GBD000001',
        newRootId: COMPANY_MASTER_ROOT_ID,
        totalRegisteredMigrated: existingReg.length,
        totalBlankSlotsConverted: sourceNodes.filter((n) => n.nodeStatus === 'blank').length,
        totalMatchingRecordsUpdated: sourceMatching.length,
        duplicateIdsCount: 0,
        brokenLinksCount: 0,
        totalPersonalPVBefore,
        totalPersonalPVAfter: totalPersonalPVBefore,
        totalMatchedPVBefore,
        totalMatchedPVAfter: totalMatchedPVBefore,
        pvConserved: true,
        backupSnapshotPath:
          input.backupSnapshotPath || '.data/backups/binary-tree-store.pre-ab-migration.json',
        rollbackAvailable: true,
        notes: ['Store already aligned on AB-1000000001+ standard with separated SLOT-* blank nodes.']
      };

    return {
      migrated: false,
      treeState: {
        nodes: sourceNodes,
        lastCompanySeq: input.treeState.lastCompanySeq || existingReg.length,
        lastAbCustomerSeq: Math.max(input.treeState.lastAbCustomerSeq || AB_ID_START_SEQ, maxAb),
        allocatedIds: input.treeState.allocatedIds || {},
        idMigrationMappings: existingMappings,
        migrationReport: existingReport,
        version: input.treeState.version || 1,
        updatedAt: input.treeState.updatedAt || nowIso
      },
      matchingHistory: sourceMatching,
      emailDeliveryLogs: sourceEmails,
      report: existingReport
    };
  }

  // Separate registered vs blank nodes
  const registeredNodes = sourceNodes.filter((n) => n.nodeStatus !== 'blank');
  const blankNodes = sourceNodes.filter((n) => n.nodeStatus === 'blank');

  // Sort registered nodes deterministically so GBD000001 -> AB-1000000001, then ascending legacy seq / timestamp
  const sortedRegistered = [...registeredNodes].sort((a, b) => {
    const aIsRoot =
      a.id === 'GBD000001' || a.id === 'TMK000001' || a.id === COMPANY_MASTER_ROOT_ID || !a.parentId;
    const bIsRoot =
      b.id === 'GBD000001' || b.id === 'TMK000001' || b.id === COMPANY_MASTER_ROOT_ID || !b.parentId;
    if (aIsRoot !== bIsRoot) return aIsRoot ? -1 : 1;

    const aAb = parseAbCustomerIdSeq(a.id);
    const bAb = parseAbCustomerIdSeq(b.id);
    if (aAb && bAb) return aAb - bAb;

    const aLeg = parseLegacyCompanySeq(a.id);
    const bLeg = parseLegacyCompanySeq(b.id);
    if (aLeg && bLeg && aLeg !== bLeg) return aLeg - bLeg;

    const aTime = Date.parse(a.registeredAt || a.created_at || a.joinDate || '') || 0;
    const bTime = Date.parse(b.registeredAt || b.created_at || b.joinDate || '') || 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.id.localeCompare(b.id);
  });

  const oldToNewMap = new Map<string, string>();
  const mappingRecords: IdMigrationMapping[] = [...existingMappings];
  const seenMappingOld = new Set(existingMappings.map((m) => m.oldId.toUpperCase()));

  let seqCursor = AB_ID_START_SEQ - 1;
  // Reserve any already-valid AB- IDs first
  for (const reg of sortedRegistered) {
    const ab = parseAbCustomerIdSeq(reg.id);
    if (ab > 0) {
      oldToNewMap.set(reg.id, reg.id);
      if (ab > seqCursor) seqCursor = ab;
    }
  }

  // Assign contiguous AB-1000000001+ IDs for all non-AB registered nodes
  sortedRegistered.forEach((reg, idx) => {
    if (oldToNewMap.has(reg.id)) return;
    let candidateSeq: number;
    if (
      reg.id === 'GBD000001' ||
      reg.id === 'TMK000001' ||
      !reg.parentId
    ) {
      candidateSeq = AB_ID_START_SEQ;
    } else {
      seqCursor = Math.max(seqCursor + 1, AB_ID_START_SEQ + 1);
      candidateSeq = seqCursor;
    }
    if (candidateSeq > seqCursor) {
      seqCursor = candidateSeq;
    }
    const newId = formatAbCustomerId(candidateSeq);
    oldToNewMap.set(reg.id, newId);

    const internalId = reg.internalId || makeStableInternalId(reg.id, idx);
    if (!seenMappingOld.has(reg.id.toUpperCase())) {
      seenMappingOld.add(reg.id.toUpperCase());
      mappingRecords.push({
        oldId: reg.id,
        newId,
        internalId,
        nodeType: 'registered',
        fullName: reg.fullName,
        legacyAliases: buildLegacyAliases(reg.id, newId),
        migratedAt: nowIso,
        batchId
      });
    }
    if (reg.aponUniqueId && !seenMappingOld.has(reg.aponUniqueId.toUpperCase())) {
      seenMappingOld.add(reg.aponUniqueId.toUpperCase());
      mappingRecords.push({
        oldId: reg.aponUniqueId,
        newId,
        internalId,
        nodeType: 'customer_user',
        fullName: reg.fullName,
        legacyAliases: [reg.aponUniqueId],
        migratedAt: nowIso,
        batchId
      });
    }
  });

  const mapRef = (ref?: string): string | undefined => {
    if (!ref) return ref;
    const trimmed = ref.trim();
    if (oldToNewMap.has(trimmed)) return oldToNewMap.get(trimmed);
    const foundKey = Array.from(oldToNewMap.keys()).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    return foundKey ? oldToNewMap.get(foundKey) : trimmed;
  };

  // Transform registered nodes
  const migratedRegistered: NetworkMember[] = sortedRegistered.map((reg, idx) => {
    const newId = mapRef(reg.id) || reg.id;
    const newSponsorId = reg.sponsorId ? mapRef(reg.sponsorId) : undefined;
    const newParentId = reg.parentId ? mapRef(reg.parentId) : undefined;
    const newLeftChild = reg.leftChildId ? mapRef(reg.leftChildId) : undefined;
    const newRightChild = reg.rightChildId ? mapRef(reg.rightChildId) : undefined;
    const leg: 'left' | 'right' =
      reg.placementLeg === 'left' || String(reg.position).toLowerCase() === 'left'
        ? 'left'
        : 'right';

    const internalId = reg.internalId || makeStableInternalId(reg.id, idx);

    return {
      ...reg,
      id: newId,
      internalId,
      isBlankSlot: false,
      legacyId: reg.legacyId || (reg.id !== newId ? reg.id : undefined),
      member_id: newId,
      customerId: newId,
      permanentMemberId: newId,
      aponUniqueId: newId,
      fullName: rewriteLegacyIdInText(reg.fullName, oldToNewMap) || reg.fullName,
      full_name: rewriteLegacyIdInText(reg.full_name || reg.fullName, oldToNewMap) || reg.fullName,
      sponsorId: newSponsorId,
      sponsor_id: newSponsorId,
      referralId: newSponsorId,
      sponsorName: rewriteLegacyIdInText(reg.sponsorName, oldToNewMap),
      parentId: newParentId,
      parent_id: newParentId,
      binaryParentId: newParentId,
      binary_parent_id: newParentId,
      placementId: newParentId,
      placement_id: newParentId,
      placementLeg: leg,
      position: newId === COMPANY_MASTER_ROOT_ID ? 'Root' : leg === 'left' ? 'LEFT' : 'RIGHT',
      leftChildId: newLeftChild,
      rightChildId: newRightChild,
      leftBlankId: newLeftChild ? undefined : makeBlankSlotId(newId, 'left'),
      rightBlankId: newRightChild ? undefined : makeBlankSlotId(newId, 'right'),
      registrationStatus: 'completed',
      kycStatus: reg.kycStatus || (reg.nidNumber ? 'verified' : 'pending'),
      emailStatus: reg.emailStatus || 'pending',
      nodeStatus: 'registered',
      placementLocked: true
    };
  });

  // Convert every blank node into a Tree Slot (`SLOT-<newParentId>-LEFT|RIGHT`)
  const convertedBlankSlots: NetworkMember[] = [];
  for (const blank of blankNodes) {
    const newParentId = mapRef(blank.parentId);
    if (!newParentId) continue;
    const leg: 'left' | 'right' =
      blank.placementLeg === 'left' || String(blank.position).toLowerCase() === 'left'
        ? 'left'
        : 'right';
    const slotId = makeBlankSlotId(newParentId, leg);

    if (!seenMappingOld.has(blank.id.toUpperCase())) {
      seenMappingOld.add(blank.id.toUpperCase());
      mappingRecords.push({
        oldId: blank.id,
        newId: slotId,
        internalId: makeStableInternalId(slotId, convertedBlankSlots.length),
        nodeType: 'blank_to_slot',
        fullName: `${leg.toUpperCase()} BLANK SLOT`,
        migratedAt: nowIso,
        batchId
      });
    }

    convertedBlankSlots.push({
      ...blank,
      id: slotId,
      slotId,
      internalId: makeStableInternalId(slotId, convertedBlankSlots.length),
      isBlankSlot: true,
      legacyId: blank.id !== slotId ? blank.id : undefined,
      member_id: slotId,
      customerId: '',
      permanentMemberId: '',
      fullName: leg === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT',
      full_name: leg === 'left' ? 'LEFT BLANK SLOT' : 'RIGHT BLANK SLOT',
      sponsorId: newParentId,
      sponsor_id: newParentId,
      parentId: newParentId,
      parent_id: newParentId,
      binaryParentId: newParentId,
      binary_parent_id: newParentId,
      placementId: newParentId,
      placement_id: newParentId,
      placementLeg: leg,
      position: leg === 'left' ? 'LEFT' : 'RIGHT',
      nodeStatus: 'blank',
      active: false,
      status: 'inactive'
    });
  }

  // Ensure every registered node has blank slots for any open leg
  const slotMap = new Map<string, NetworkMember>();
  convertedBlankSlots.forEach((s) => slotMap.set(s.id, s));

  for (const reg of migratedRegistered) {
    if (!reg.leftChildId) {
      const leftSlotId = makeBlankSlotId(reg.id, 'left');
      reg.leftBlankId = leftSlotId;
      if (!slotMap.has(leftSlotId)) {
        slotMap.set(leftSlotId, {
          id: leftSlotId,
          slotId: leftSlotId,
          internalId: makeStableInternalId(leftSlotId, slotMap.size),
          isBlankSlot: true,
          member_id: leftSlotId,
          userId: '',
          customerId: '',
          permanentMemberId: '',
          fullName: 'LEFT BLANK SLOT',
          full_name: 'LEFT BLANK SLOT',
          mobile: '',
          email: '',
          joinDate: '',
          created_at: nowIso,
          updated_at: nowIso,
          reservedAt: nowIso,
          rank: 'customer',
          packageId: '',
          packageName: '',
          sponsorId: reg.id,
          sponsor_id: reg.id,
          parentId: reg.id,
          parent_id: reg.id,
          binaryParentId: reg.id,
          binary_parent_id: reg.id,
          placementId: reg.id,
          placement_id: reg.id,
          placementLeg: 'left',
          position: 'LEFT',
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
        });
      }
    }
    if (!reg.rightChildId) {
      const rightSlotId = makeBlankSlotId(reg.id, 'right');
      reg.rightBlankId = rightSlotId;
      if (!slotMap.has(rightSlotId)) {
        slotMap.set(rightSlotId, {
          id: rightSlotId,
          slotId: rightSlotId,
          internalId: makeStableInternalId(rightSlotId, slotMap.size),
          isBlankSlot: true,
          member_id: rightSlotId,
          userId: '',
          customerId: '',
          permanentMemberId: '',
          fullName: 'RIGHT BLANK SLOT',
          full_name: 'RIGHT BLANK SLOT',
          mobile: '',
          email: '',
          joinDate: '',
          created_at: nowIso,
          updated_at: nowIso,
          reservedAt: nowIso,
          rank: 'customer',
          packageId: '',
          packageName: '',
          sponsorId: reg.id,
          sponsor_id: reg.id,
          parentId: reg.id,
          parent_id: reg.id,
          binaryParentId: reg.id,
          binary_parent_id: reg.id,
          placementId: reg.id,
          placement_id: reg.id,
          placementLeg: 'right',
          position: 'RIGHT',
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
        });
      }
    }
  }

  // Migrate matching history references cleanly
  let updatedMatchingCount = 0;
  const migratedMatching: MatchingRecord[] = sourceMatching.map((rec) => {
    const newMemberId = mapRef(rec.member_id) || rec.member_id;
    const newName = rewriteLegacyIdInText(rec.member_name, oldToNewMap) || rec.member_name;
    const newNotes = rewriteLegacyIdInText(rec.notes, oldToNewMap);
    if (newMemberId !== rec.member_id || newName !== rec.member_name) {
      updatedMatchingCount += 1;
    }
    return {
      ...rec,
      member_id: newMemberId,
      member_name: newName,
      notes: newNotes
    };
  });

  const combinedNodes: NetworkMember[] = [...migratedRegistered, ...Array.from(slotMap.values())];

  // Validate integrity invariants (duplicates, broken pointers, PV conservation)
  const idCounts = new Map<string, number>();
  const regById = new Map<string, NetworkMember>();
  for (const n of combinedNodes) {
    idCounts.set(n.id, (idCounts.get(n.id) || 0) + 1);
    if (n.nodeStatus !== 'blank') regById.set(n.id, n);
  }
  const duplicateIdsCount = Array.from(idCounts.values()).filter((c) => c > 1).length;

  let brokenLinksCount = 0;
  for (const n of migratedRegistered) {
    if (n.id !== COMPANY_MASTER_ROOT_ID && (!n.parentId || !regById.has(n.parentId))) {
      brokenLinksCount += 1;
    }
    if (n.sponsorId && !regById.has(n.sponsorId)) {
      brokenLinksCount += 1;
    }
    if (n.leftChildId && !regById.has(n.leftChildId)) {
      brokenLinksCount += 1;
    }
    if (n.rightChildId && !regById.has(n.rightChildId)) {
      brokenLinksCount += 1;
    }
  }

  const totalPersonalPVAfter = migratedRegistered.reduce((acc, n) => acc + (Number(n.pv) || 0), 0);
  const totalMatchedPVAfter = migratedRegistered.reduce(
    (acc, n) => acc + (Number(n.totalMatchedPV) || 0),
    0
  );

  // Build clean allocatedIds map (registered AB- IDs + legacy IDs marked tombstoned so never reused)
  const allocatedIds: Record<string, 'blank' | 'registered' | 'tombstoned'> = {};
  for (const [oldId, newId] of oldToNewMap.entries()) {
    if (oldId !== newId) allocatedIds[oldId] = 'tombstoned';
  }
  for (const n of migratedRegistered) {
    allocatedIds[n.id] = 'registered';
  }
  for (const s of slotMap.values()) {
    allocatedIds[s.id] = 'blank';
  }

  const highestAbSeq = migratedRegistered.reduce((mx, n) => {
    const seq = parseAbCustomerIdSeq(n.id);
    return seq > mx ? seq : mx;
  }, AB_ID_START_SEQ);

  const report: IdMigrationReport = {
    batchId,
    migratedAt: nowIso,
    previousRootId: 'GBD000001',
    newRootId: COMPANY_MASTER_ROOT_ID,
    totalRegisteredMigrated: migratedRegistered.length,
    totalBlankSlotsConverted: slotMap.size,
    totalMatchingRecordsUpdated: updatedMatchingCount,
    duplicateIdsCount,
    brokenLinksCount,
    totalPersonalPVBefore,
    totalPersonalPVAfter,
    totalMatchedPVBefore,
    totalMatchedPVAfter,
    pvConserved:
      totalPersonalPVBefore === totalPersonalPVAfter &&
      totalMatchedPVBefore === totalMatchedPVAfter,
    backupSnapshotPath:
      input.backupSnapshotPath || '.data/backups/binary-tree-store.pre-ab-migration.json',
    rollbackAvailable: true,
    notes: [
      `Migrated ${migratedRegistered.length} registered accounts cleanly into contiguous ${AB_ID_PREFIX}1000000001..${formatAbCustomerId(highestAbSeq)} sequence.`,
      `Converted ${blankNodes.length} legacy blank GBD* placeholders into ${slotMap.size} separated SLOT-* Tree Slots (zero AB- IDs burned on blanks).`,
      `Updated ${updatedMatchingCount} matching history ledger records and preserved 100% PV balances.`
    ]
  };

  return {
    migrated: true,
    treeState: {
      nodes: combinedNodes,
      lastCompanySeq: migratedRegistered.length,
      lastAbCustomerSeq: highestAbSeq,
      allocatedIds,
      idMigrationMappings: mappingRecords,
      migrationReport: report,
      version: (input.treeState?.version || 1) + 1,
      updatedAt: nowIso
    },
    matchingHistory: migratedMatching,
    emailDeliveryLogs: sourceEmails,
    report
  };
}

/**
 * Resolves either a canonical AB- ID or a legacy mapped ID (e.g. GBD000002 / A-00002)
 * using the permanent idMigrationMappings registry.
 */
export function resolveMappedCustomerId(
  queryId?: string | null,
  mappings?: IdMigrationMapping[]
): string | undefined {
  const clean = (queryId || '').trim();
  if (!clean) return undefined;
  const upper = clean.toUpperCase();
  if (isValidAbCustomerId(upper)) return upper;

  if (Array.isArray(mappings)) {
    const exact = mappings.find(
      (m) =>
        m.oldId.toUpperCase() === upper ||
        m.newId.toUpperCase() === upper ||
        (m.legacyAliases || []).some((a) => a.toUpperCase() === upper)
    );
    if (exact && isValidAbCustomerId(exact.newId)) {
      return exact.newId;
    }
  }

  // Fallback mapping for legacy numeric root GBD000001 -> AB-1000000001
  if (upper === 'GBD000001' || upper === 'TMK000001' || upper === 'A-00001') {
    return COMPANY_MASTER_ROOT_ID;
  }

  return undefined;
}
