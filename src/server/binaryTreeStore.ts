/**
 * Durable Server-Side Binary Tree, AB-1000000001+ Migration, BFS Placement & Email Delivery Store
 * Persists atomically to disk with an async mutex queue for concurrency safety.
 */

import fs from 'fs';
import path from 'path';
import type { Transporter } from 'nodemailer';
import {
  BinaryTreePersistenceState,
  COMPANY_MASTER_ROOT_ID,
  EmailDeliveryRecord,
  IdMigrationReport,
  MatchingRecord,
  NetworkMember
} from '../types/networkMarketing';
import { INITIAL_MATCHING_HISTORY, SEED_BINARY_MEMBERS } from '../lib/seedBinaryMembers';
import {
  AB_ID_START_SEQ,
  migrateLegacyTreePayloadToAB,
  needsAbIdMigration
} from '../lib/abIdMigrationEngine';
import {
  AutoBfsPlacementResult,
  BlankSlotRegistrationParams,
  BlankSlotRegistrationResult,
  IsolatedSubtreeStats,
  executeAtomicBlankSlotRegistration,
  extractIsolatedBinarySubtree,
  findAutoBfsBinaryPlacement,
  findBinaryTreeNodeById,
  isCompanyIdInSubtree,
  reconcileBinaryTreeState
} from '../lib/binaryBlankPositionEngine';
import { dispatchRegistrationConfirmationEmail } from './emailService';

export interface PersistedBinaryStorePayload {
  treeState: BinaryTreePersistenceState;
  matchingHistory: MatchingRecord[];
  emailDeliveryLogs?: EmailDeliveryRecord[];
}

export interface ServerMatchingResult {
  success: boolean;
  statusCode: number;
  message: string;
  record?: MatchingRecord;
  records?: MatchingRecord[];
  totalMatchedPV?: number;
  data?: PersistedBinaryStorePayload;
}

export interface SubtreeQueryRequest {
  targetCompanyId: string;
  requestorRole?: string;
  requestorUserId?: string;
  requestorCompanyId?: string;
}

export interface SubtreeQueryResponse {
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

export interface CustomerRegistrationApiInput {
  referralId: string;
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  nidNumber: string;
  password: string;
  confirmPassword: string;
  username?: string;
  userId?: string;
  packageId?: string;
  packageName?: string;
  pv?: number;
  registrationSource?: string;
  placementMode?: 'auto_bfs' | 'locked_slot';
  placementId?: string;
  placementPosition?: 'LEFT' | 'RIGHT' | 'left' | 'right';
  slotId?: string;
  appOrigin?: string;
}

export interface CustomerRegistrationApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  customerId?: string;
  customerName?: string;
  referralId?: string;
  placementId?: string;
  placementPosition?: 'LEFT' | 'RIGHT';
  registrationDate?: string;
  newLeftBlankId?: string;
  newRightBlankId?: string;
  emailStatus?: EmailDeliveryRecord['status'];
  emailRecord?: EmailDeliveryRecord;
  registeredMember?: NetworkMember;
  newLeftBlank?: NetworkMember;
  newRightBlank?: NetworkMember;
  treeState?: BinaryTreePersistenceState;
}

function redactPiiForNonAdmin(
  nodes: NetworkMember[],
  ownerNodeId?: string
): NetworkMember[] {
  return nodes.map((n) => {
    if (n.nodeStatus === 'blank' || (ownerNodeId && n.id === ownerNodeId)) {
      return n;
    }
    return {
      ...n,
      mobile: n.mobile ? `${n.mobile.slice(0, 3)}****${n.mobile.slice(-2)}` : '',
      email: 'redacted@private',
      address: undefined,
      nidNumber: undefined
    };
  });
}

function normalizePhoneDigits(mobile: string): string {
  const digits = (mobile || '').trim().replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 12) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

export function createBinaryTreeStore(customStorePath?: string) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'binary-tree-store.json');
  const defaultBackupSnapshotPath = path.join(
    path.dirname(storePath),
    'backups',
    `${path.basename(storePath, '.json')}.pre-ab-migration.json`
  );

  let mutexTail: Promise<unknown> = Promise.resolve();
  let cachedPayload: PersistedBinaryStorePayload | null = null;

  function runWithLock<T>(task: () => Promise<T> | T): Promise<T> {
    const run = mutexTail.then(() => task());
    mutexTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  function writeAtomicSync(payload: PersistedBinaryStorePayload): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
  }

  function ensurePreMigrationBackup(rawContent: string): void {
    try {
      if (!fs.existsSync(defaultBackupSnapshotPath)) {
        const bDir = path.dirname(defaultBackupSnapshotPath);
        if (!fs.existsSync(bDir)) fs.mkdirSync(bDir, { recursive: true });
        fs.writeFileSync(defaultBackupSnapshotPath, rawContent, 'utf8');
      }
    } catch (err) {
      console.error('[BinaryTreeStore] Warning writing pre-migration snapshot:', err);
    }
  }

  function loadAndReconcileFromDisk(): PersistedBinaryStorePayload {
    if (cachedPayload) {
      return cachedPayload;
    }

    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<PersistedBinaryStorePayload>;
        if (parsed?.treeState && Array.isArray(parsed.treeState.nodes) && parsed.treeState.nodes.length > 0) {
          let workingTreeState = parsed.treeState;
          let workingMatching = Array.isArray(parsed.matchingHistory)
            ? parsed.matchingHistory
            : INITIAL_MATCHING_HISTORY;
          let workingEmailLogs = Array.isArray(parsed.emailDeliveryLogs)
            ? parsed.emailDeliveryLogs
            : [];
          let changed = false;

          // Migrate legacy GBD000001+ data into AB-1000000001+ cleanly (with pre-migration backup snapshot)
          if (needsAbIdMigration(workingTreeState.nodes)) {
            ensurePreMigrationBackup(raw);
            const migRes = migrateLegacyTreePayloadToAB({
              treeState: workingTreeState,
              matchingHistory: workingMatching,
              emailDeliveryLogs: workingEmailLogs,
              backupSnapshotPath: defaultBackupSnapshotPath
            });
            workingTreeState = migRes.treeState;
            workingMatching = migRes.matchingHistory;
            workingEmailLogs = migRes.emailDeliveryLogs;
            changed = true;
          }

          const reconciled = reconcileBinaryTreeState(
            workingTreeState.nodes,
            workingTreeState.lastCompanySeq || 0,
            workingTreeState.allocatedIds || {},
            workingTreeState.version || 1,
            workingTreeState.lastAbCustomerSeq || AB_ID_START_SEQ,
            workingTreeState.idMigrationMappings,
            workingTreeState.migrationReport
          );

          const payload: PersistedBinaryStorePayload = {
            treeState: reconciled,
            matchingHistory: workingMatching,
            emailDeliveryLogs: workingEmailLogs
          };

          if (changed || reconciled.nodes.length !== parsed.treeState.nodes.length) {
            writeAtomicSync(payload);
          }
          cachedPayload = payload;
          return payload;
        }
      } catch (err) {
        console.error('[BinaryTreeStore] Failed to parse existing store, bootstrapping from seed:', err);
      }
    }

    const migratedSeed = migrateLegacyTreePayloadToAB({
      treeState: { nodes: SEED_BINARY_MEMBERS },
      matchingHistory: [...INITIAL_MATCHING_HISTORY],
      emailDeliveryLogs: [],
      backupSnapshotPath: defaultBackupSnapshotPath
    });
    const initialTree = reconcileBinaryTreeState(
      migratedSeed.treeState.nodes,
      migratedSeed.treeState.lastCompanySeq,
      migratedSeed.treeState.allocatedIds,
      1,
      migratedSeed.treeState.lastAbCustomerSeq,
      migratedSeed.treeState.idMigrationMappings,
      migratedSeed.report
    );
    const initialPayload: PersistedBinaryStorePayload = {
      treeState: initialTree,
      matchingHistory: migratedSeed.matchingHistory,
      emailDeliveryLogs: []
    };
    writeAtomicSync(initialPayload);
    cachedPayload = initialPayload;
    return initialPayload;
  }

  function savePayload(payload: PersistedBinaryStorePayload): PersistedBinaryStorePayload {
    writeAtomicSync(payload);
    cachedPayload = payload;
    return payload;
  }

  return {
    getStorePath: () => storePath,
    getBackupSnapshotPath: () => defaultBackupSnapshotPath,

    reloadFromDiskForTest: () => {
      cachedPayload = null;
      return loadAndReconcileFromDisk();
    },

    getState: async () => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        const registeredMembers = payload.treeState.nodes.filter((n) => n.nodeStatus !== 'blank');
        const blankPositions = payload.treeState.nodes.filter((n) => n.nodeStatus === 'blank');
        return {
          ...payload,
          registeredMembers,
          blankPositions
        };
      });
    },

    previewPlacementByReferral: async (referralId: string): Promise<AutoBfsPlacementResult> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        return findAutoBfsBinaryPlacement(
          payload.treeState.nodes,
          referralId,
          payload.treeState.idMigrationMappings
        );
      });
    },

    getIsolatedSubtree: async (req: SubtreeQueryRequest): Promise<SubtreeQueryResponse> => {
      return runWithLock(() => {
        const cleanTarget = (req.targetCompanyId || '').trim();
        if (!cleanTarget) {
          return {
            success: false,
            statusCode: 400,
            errorCode: 'INVALID_INPUT',
            message: 'অনুগ্রহ করে একটি বৈধ Customer ID লিখুন।'
          };
        }

        const role = (req.requestorRole || '').trim().toLowerCase();
        const userId = (req.requestorUserId || '').trim();

        if (!userId || userId === 'guest' || !role) {
          return {
            success: false,
            statusCode: 403,
            errorCode: 'ACCESS_DENIED',
            message: 'অননুমোদিত প্রবেশাধিকার (Access Denied): নেটওয়ার্ক ট্রি দেখার জন্য অনুগ্রহ করে লগইন করুন।'
          };
        }

        const payload = loadAndReconcileFromDisk();
        const nodes = payload.treeState.nodes;
        const mappings = payload.treeState.idMigrationMappings;

        const isKnownAdminAccount =
          userId === 'APON-SADMIN-001' ||
          userId === 'AANO-SADMIN-001' ||
          userId === 'usr-super-admin-01' ||
          userId === 'usr-admin-02' ||
          userId === 'AponSA-000001' ||
          userId === 'AponA-000001' ||
          userId === 'usr-company-root';

        const isNonAdminMemberAccount =
          userId.startsWith('usr-member-') ||
          userId.startsWith('usr-leader-') ||
          userId.startsWith('usr-customer-') ||
          userId === 'usr-network-07' ||
          nodes.some((n) => n.userId === userId && n.userId !== 'usr-company-root');

        const isAdmin =
          (role === 'super_admin' || role === 'admin') &&
          (isKnownAdminAccount || !isNonAdminMemberAccount);

        const targetNode = findBinaryTreeNodeById(nodes, cleanTarget, mappings);
        let ownerNodeId: string | undefined;

        if (!isAdmin) {
          let ownerNode = nodes.find(
            (n) =>
              n.nodeStatus === 'registered' &&
              (n.userId === userId ||
                n.id === userId ||
                (n.aponUniqueId && n.aponUniqueId === userId))
          );

          // Compatibility mapping for seed active network member account
          if (!ownerNode && userId === 'usr-network-07') {
            ownerNode = findBinaryTreeNodeById(nodes, 'AB-1000000002', mappings);
          }

          if (!ownerNode && req.requestorCompanyId) {
            const candidateOwner = findBinaryTreeNodeById(nodes, req.requestorCompanyId, mappings);
            if (candidateOwner && candidateOwner.nodeStatus === 'registered' && candidateOwner.userId === userId) {
              ownerNode = candidateOwner;
            }
          }

          if (!ownerNode) {
            return {
              success: false,
              statusCode: 403,
              errorCode: 'ACCESS_DENIED',
              message: 'Access Denied: আপনার অ্যাকাউন্টের সাথে কোনো অনুমোদিত Customer ID যুক্ত নেই।'
            };
          }

          ownerNodeId = ownerNode.id;

          if (!targetNode) {
            return {
              success: false,
              statusCode: 404,
              errorCode: 'NOT_FOUND',
              message: `Customer ID '${cleanTarget}' ডাটাবেজে পাওয়া যায়নি (Not Found)।`
            };
          }

          const allowed = isCompanyIdInSubtree(nodes, ownerNode.id, targetNode.id, mappings);
          if (!allowed) {
            return {
              success: false,
              statusCode: 403,
              errorCode: 'ACCESS_DENIED',
              message: `Access Denied: আপনি শুধুমাত্র আপনার নিজের Customer ID (${ownerNode.id}) এবং এর অধীনস্থ ডাউনলাইন নেটওয়ার্ক দেখতে পারবেন। অন্য শাখা বা উপরের লেভেল দেখার অনুমতি নেই।`
            };
          }
        }

        const extraction = extractIsolatedBinarySubtree(nodes, cleanTarget, mappings);
        if (!extraction.found || !extraction.rootNode || !extraction.stats) {
          return {
            success: false,
            statusCode: 404,
            errorCode: 'NOT_FOUND',
            message: `Customer ID '${cleanTarget}' ডাটাবেজে পাওয়া যায়নি (Not Found)।`
          };
        }

        // Redact other members' private PII for non-admin responses
        const safeNodes = isAdmin
          ? extraction.nodes
          : redactPiiForNonAdmin(extraction.nodes, ownerNodeId);
        const safeRoot = safeNodes[0] || extraction.rootNode;

        return {
          success: true,
          statusCode: 200,
          message: `Isolated binary subtree loaded for ${extraction.rootId}.`,
          rootId: extraction.rootId,
          rootNode: safeRoot,
          nodes: safeNodes,
          stats: extraction.stats,
          authorizedScope: isAdmin ? 'admin_full' : 'member_subtree'
        };
      });
    },

    /**
     * Authoritative 10-field atomic Customer Registration with:
     * - Full server-side field validation (Referral ID, Full Name, Mobile, Email, Address, NID, Passwords)
     * - BFS automatic placement (or verified locked Blank Slot placement)
     * - Strict blocking of manual placement override when in auto_bfs mode
     * - Atomic AB-1000000001+ ID generation strictly on commit (ZERO burn on failure)
     * - Non-blocking real email notification & retry queue logging
     */
    registerCustomerAtomically: async (
      input: CustomerRegistrationApiInput,
      customEmailTransport?: Transporter
    ): Promise<CustomerRegistrationApiResponse> => {
      return runWithLock(async () => {
        const payload = loadAndReconcileFromDisk();
        const mappings = payload.treeState.idMigrationMappings;

        // 1. Validate required fields BEFORE any ID allocation
        const fullName = (input.fullName || '').trim();
        const normalizedMobile = normalizePhoneDigits(input.mobile || '');
        const email = (input.email || '').trim().toLowerCase();
        const address = (input.address || '').trim();
        const nidNumber = (input.nidNumber || '').trim();
        const password = (input.password || '').trim();
        const confirmPassword = (input.confirmPassword || '').trim();
        const cleanReferralId = (input.referralId || '').trim();

        if (!cleanReferralId) {
          return { success: false, statusCode: 400, message: 'Referral ID আবশ্যক।' };
        }
        if (!fullName || fullName.length < 2) {
          return { success: false, statusCode: 400, message: 'সদস্যের পূর্ণ নাম আবশ্যক।' };
        }
        if (!/^01[3-9]\d{8}$/.test(normalizedMobile)) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
          };
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক ইমেইল ঠিকানা (Email Address) আবশ্যক।'
          };
        }
        if (!address || address.length < 3) {
          return {
            success: false,
            statusCode: 400,
            message: 'সম্পূর্ণ ঠিকানা (Address) আবশ্যক।'
          };
        }
        if (!nidNumber || nidNumber.replace(/\D/g, '').length < 10) {
          return {
            success: false,
            statusCode: 400,
            message: 'সঠিক NID / জাতীয় পরিচয়পত্র নম্বর (কমপক্ষে ১০ সংখ্যা) আবশ্যক।'
          };
        }
        if (!password || password.length < 6) {
          return {
            success: false,
            statusCode: 400,
            message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          };
        }
        if (password !== confirmPassword) {
          return {
            success: false,
            statusCode: 400,
            message: 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।'
          };
        }

        // 2. Verify Referral ID exists & is registered
        const referralNode = findBinaryTreeNodeById(
          payload.treeState.nodes,
          cleanReferralId,
          mappings
        );
        if (!referralNode || referralNode.nodeStatus === 'blank') {
          return {
            success: false,
            statusCode: 404,
            message: `Referral ID '${cleanReferralId}' ডাটাবেজে পাওয়া যায়নি বা নিবন্ধিত নয়।`
          };
        }

        // 3. Determine target placement (Locked Blank Slot vs Automatic BFS)
        let targetParentId: string;
        let targetLeg: 'left' | 'right';
        let targetSlotId: string | undefined;

        if (input.placementMode === 'locked_slot' && input.placementId && input.placementPosition) {
          const requestedParent = findBinaryTreeNodeById(
            payload.treeState.nodes,
            input.placementId,
            mappings
          );
          if (!requestedParent || requestedParent.nodeStatus === 'blank') {
            return {
              success: false,
              statusCode: 404,
              message: `প্লেসমেন্ট প্যারেন্ট '${input.placementId}' খুঁজে পাওয়া যায়নি।`
            };
          }
          const reqPos = String(input.placementPosition).toLowerCase();
          if (reqPos !== 'left' && reqPos !== 'right') {
            return {
              success: false,
              statusCode: 400,
              message: 'Placement Position অবশ্যই LEFT অথবা RIGHT হতে হবে।'
            };
          }
          targetParentId = requestedParent.id;
          targetLeg = reqPos;
          targetSlotId = input.slotId;
        } else {
          // Automatic BFS placement under Referral ID
          const bfsRes = findAutoBfsBinaryPlacement(
            payload.treeState.nodes,
            referralNode.id,
            mappings
          );
          if (!bfsRes.found || !bfsRes.placementParentNode || !bfsRes.leg) {
            return {
              success: false,
              statusCode: 409,
              message: bfsRes.message
            };
          }

          // Reject manual override if caller submitted tampered placementId/position
          if (input.placementId && input.placementId.trim()) {
            const clientParent = findBinaryTreeNodeById(
              payload.treeState.nodes,
              input.placementId,
              mappings
            );
            if (!clientParent || clientParent.id !== bfsRes.placementParentNode.id) {
              return {
                success: false,
                statusCode: 400,
                message: `স্বয়ংক্রিয় বাইনারি প্লেসমেন্ট ম্যানুয়ালি পরিবর্তন করা যাবে না। অনুমোদিত BFS Placement ID: ${bfsRes.placementParentNode.id} (${bfsRes.position})।`
              };
            }
          }
          if (input.placementPosition) {
            const clientLeg = String(input.placementPosition).toLowerCase();
            if (clientLeg !== bfsRes.leg) {
              return {
                success: false,
                statusCode: 400,
                message: `স্বয়ংক্রিয় বাইনারি প্লেসমেন্ট পজিশন ম্যানুয়ালি পরিবর্তন করা যাবে না। অনুমোদিত Position: ${bfsRes.position}।`
              };
            }
          }

          targetParentId = bfsRes.placementParentNode.id;
          targetLeg = bfsRes.leg;
          targetSlotId = bfsRes.blankSlotId;
        }

        // 4. Execute atomic registration (validates duplicates & allocates AB- ID ONLY on commit)
        const generatedUserId =
          input.userId?.trim() || `usr-customer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const atomicRes = executeAtomicBlankSlotRegistration(
          payload.treeState,
          {
            slotId: targetSlotId,
            parentId: targetParentId,
            leg: targetLeg,
            userId: generatedUserId,
            username: input.username?.trim() || normalizedMobile,
            fullName,
            mobile: normalizedMobile,
            email,
            address,
            nidNumber,
            registrationSource: input.registrationSource || 'Binary Tree',
            sponsorId: referralNode.id,
            sponsorName: referralNode.fullName,
            packageId: input.packageId || 'pkg-100',
            packageName: input.packageName || 'স্টার্টার মেম্বার প্যাকেজ (100 PV)',
            pv: typeof input.pv === 'number' ? input.pv : 100,
            enforceUniqueProfileFields: true
          },
          mappings
        );

        if (!atomicRes.success || !atomicRes.state || !atomicRes.registeredMember) {
          return {
            success: false,
            statusCode: atomicRes.statusCode || 409,
            message: atomicRes.message
          };
        }

        const newMember = atomicRes.registeredMember;
        const regPosition: 'LEFT' | 'RIGHT' = targetLeg === 'left' ? 'LEFT' : 'RIGHT';

        // 5. Commit tree state first (email failure MUST NOT roll back registration)
        const baseEmailLogs = payload.emailDeliveryLogs || [];
        let updatedEmailLogs = [...baseEmailLogs];
        let finalMember = { ...newMember };
        let finalNodes = atomicRes.state.nodes;
        let emailRecord: EmailDeliveryRecord | undefined;

        try {
          const emailRes = await dispatchRegistrationConfirmationEmail(
            {
              customerName: newMember.fullName,
              customerId: newMember.id,
              recipientEmail: newMember.email,
              referralId: referralNode.id,
              placementId: targetParentId,
              placementPosition: regPosition,
              registrationDate: newMember.registeredAt || newMember.created_at || new Date().toISOString(),
              appOrigin: input.appOrigin
            },
            updatedEmailLogs,
            customEmailTransport
          );
          emailRecord = emailRes.record;
          updatedEmailLogs = [
            emailRes.record,
            ...updatedEmailLogs.filter((l) => l.idempotencyKey !== emailRes.record.idempotencyKey)
          ];
          finalMember = { ...newMember, emailStatus: emailRes.record.status };
          finalNodes = atomicRes.state.nodes.map((n) =>
            n.id === newMember.id ? finalMember : n
          );
        } catch {
          finalMember = { ...newMember, emailStatus: 'failed' };
          finalNodes = atomicRes.state.nodes.map((n) =>
            n.id === newMember.id ? finalMember : n
          );
        }

        const finalState: BinaryTreePersistenceState = {
          ...atomicRes.state,
          nodes: finalNodes
        };

        savePayload({
          treeState: finalState,
          matchingHistory: payload.matchingHistory,
          emailDeliveryLogs: updatedEmailLogs
        });

        return {
          success: true,
          statusCode: 200,
          message: `নিবন্ধন সফল হয়েছে! Customer ID: ${finalMember.id} (${targetParentId} এর ${regPosition} পজিশন)`,
          customerId: finalMember.id,
          customerName: finalMember.fullName,
          referralId: referralNode.id,
          placementId: targetParentId,
          placementPosition: regPosition,
          registrationDate: finalMember.registeredAt || finalMember.created_at,
          newLeftBlankId: atomicRes.newLeftBlank?.id,
          newRightBlankId: atomicRes.newRightBlank?.id,
          emailStatus: emailRecord?.status || finalMember.emailStatus || 'pending',
          emailRecord,
          registeredMember: finalMember,
          newLeftBlank: atomicRes.newLeftBlank,
          newRightBlank: atomicRes.newRightBlank,
          treeState: finalState
        };
      });
    },

    registerBlankSlot: async (
      params: BlankSlotRegistrationParams
    ): Promise<BlankSlotRegistrationResult & { fullPayload?: PersistedBinaryStorePayload }> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        if (!params.fullName || !params.fullName.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'সদস্যের পূর্ণ নাম আবশ্যক।'
          };
        }
        if (!params.mobile || !params.mobile.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'সদস্যের মোবাইল নম্বর আবশ্যক।'
          };
        }
        if (!params.parentId || !params.parentId.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'Parent ID আবশ্যক।'
          };
        }
        if (params.leg !== 'left' && params.leg !== 'right') {
          return {
            success: false,
            statusCode: 400,
            message: 'Position অবশ্যই left অথবা right হতে হবে।'
          };
        }

        const result = executeAtomicBlankSlotRegistration(
          payload.treeState,
          params,
          payload.treeState.idMigrationMappings
        );
        if (!result.success || !result.state) {
          return result;
        }

        const updatedPayload: PersistedBinaryStorePayload = {
          treeState: result.state,
          matchingHistory: payload.matchingHistory,
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(updatedPayload);

        return {
          ...result,
          fullPayload: updatedPayload
        };
      });
    },

    getMigrationAndEmailStatus: async (): Promise<{
      migrationReport?: IdMigrationReport;
      idMigrationMappings: BinaryTreePersistenceState['idMigrationMappings'];
      emailDeliveryLogs: EmailDeliveryRecord[];
      rollbackAvailable: boolean;
    }> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        return {
          migrationReport: payload.treeState.migrationReport,
          idMigrationMappings: payload.treeState.idMigrationMappings || [],
          emailDeliveryLogs: payload.emailDeliveryLogs || [],
          rollbackAvailable: fs.existsSync(defaultBackupSnapshotPath)
        };
      });
    },

    retryPendingEmails: async (
      appOrigin?: string,
      customTransport?: Transporter
    ): Promise<{
      processed: number;
      sentCount: number;
      pendingCount: number;
      failedCount: number;
      emailDeliveryLogs: EmailDeliveryRecord[];
    }> => {
      return runWithLock(async () => {
        const payload = loadAndReconcileFromDisk();
        const logs = [...(payload.emailDeliveryLogs || [])];
        let processed = 0;
        let sentCount = 0;
        let pendingCount = 0;
        let failedCount = 0;

        for (let i = 0; i < logs.length; i++) {
          const item = logs[i];
          if (item.status === 'sent') continue;
          processed += 1;
          const res = await dispatchRegistrationConfirmationEmail(
            {
              customerName: item.payloadSummary.customerName,
              customerId: item.payloadSummary.customerId,
              recipientEmail: item.recipientEmail,
              referralId: item.payloadSummary.referralId,
              placementId: item.payloadSummary.placementId,
              placementPosition: item.payloadSummary.placementPosition,
              registrationDate: item.payloadSummary.registrationDate,
              appOrigin
            },
            logs,
            customTransport
          );
          logs[i] = res.record;
          if (res.record.status === 'sent') sentCount += 1;
          else if (res.record.status === 'pending') pendingCount += 1;
          else failedCount += 1;
        }

        const updatedNodes = payload.treeState.nodes.map((n) => {
          const matchLog = logs.find((l) => l.customerId === n.id);
          return matchLog ? { ...n, emailStatus: matchLog.status } : n;
        });

        savePayload({
          treeState: {
            ...payload.treeState,
            nodes: updatedNodes
          },
          matchingHistory: payload.matchingHistory,
          emailDeliveryLogs: logs
        });

        return {
          processed,
          sentCount,
          pendingCount,
          failedCount,
          emailDeliveryLogs: logs
        };
      });
    },

    rollbackMigrationFromBackup: async (): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
    }> => {
      return runWithLock(() => {
        if (!fs.existsSync(defaultBackupSnapshotPath)) {
          return {
            success: false,
            statusCode: 404,
            message: 'Pre-migration backup snapshot খুঁজে পাওয়া যায়নি।'
          };
        }
        const rawBackup = fs.readFileSync(defaultBackupSnapshotPath, 'utf8');
        const parsedBackup = JSON.parse(rawBackup) as PersistedBinaryStorePayload;
        writeAtomicSync(parsedBackup);
        cachedPayload = parsedBackup;
        return {
          success: true,
          statusCode: 200,
          message: 'প্রি-মাইগ্রেশন ব্যাকআপ স্ন্যাপশটে সফলভাবে রোলব্যাক সম্পন্ন হয়েছে।'
        };
      });
    },

    executeMemberMatching: async (params: {
      memberId: string;
      adminId: string;
      reason?: string;
    }): Promise<ServerMatchingResult> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        const member = findBinaryTreeNodeById(
          payload.treeState.nodes,
          params.memberId,
          payload.treeState.idMigrationMappings
        );
        if (!member || member.nodeStatus === 'blank') {
          return {
            success: false,
            statusCode: 404,
            message: `মেম্বার আইডি '${params.memberId}' পাওয়া যায়নি।`
          };
        }

        const leftEligible = Number(member.leftCarryForward) || 0;
        const rightEligible = Number(member.rightCarryForward) || 0;
        if (leftEligible <= 0 || rightEligible <= 0) {
          return {
            success: false,
            statusCode: 400,
            message: `ম্যাচিং করার মতো পর্যাপ্ত ক্যারি ফরোয়ার্ড PV নেই (Left CF: ${leftEligible}, Right CF: ${rightEligible})।`
          };
        }

        const matchedPV = Math.min(leftEligible, rightEligible);
        const newLeftCF = leftEligible - matchedPV;
        const newRightCF = rightEligible - matchedPV;
        const nowIso = new Date().toISOString();

        const record: MatchingRecord = {
          matching_id: `MATCH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          member_id: member.id,
          member_name: member.fullName,
          left_pv: leftEligible,
          right_pv: rightEligible,
          matched_pv: matchedPV,
          left_carry_forward: newLeftCF,
          right_carry_forward: newRightCF,
          matching_date: nowIso.split('T')[0],
          created_by: params.adminId || 'AANO-SADMIN-001',
          created_at: nowIso,
          notes: params.reason?.trim() || 'Super Admin Single Member Matching Execution'
        };

        const updatedNodes = payload.treeState.nodes.map((m) =>
          m.id === member.id
            ? {
                ...m,
                leftCarryForward: newLeftCF,
                rightCarryForward: newRightCF,
                left_carry_forward: newLeftCF,
                right_carry_forward: newRightCF,
                totalMatchedPV: (m.totalMatchedPV || 0) + matchedPV,
                updated_at: nowIso
              }
            : m
        );

        const nextPayload: PersistedBinaryStorePayload = {
          treeState: {
            ...payload.treeState,
            nodes: updatedNodes,
            version: payload.treeState.version + 1,
            updatedAt: nowIso
          },
          matchingHistory: [record, ...payload.matchingHistory],
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(nextPayload);

        return {
          success: true,
          statusCode: 200,
          record,
          data: nextPayload,
          message: `সফলভাবে মেম্বার ${member.fullName} (${member.id}) এর জন্য ${matchedPV.toLocaleString()} PV ম্যাচিং সম্পন্ন হয়েছে!`
        };
      });
    },

    executeBatchMatching: async (params: {
      adminId: string;
      reason?: string;
    }): Promise<ServerMatchingResult> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        const eligibleMembers = payload.treeState.nodes.filter(
          (m) =>
            m.nodeStatus !== 'blank' &&
            (m.leftCarryForward || 0) > 0 &&
            (m.rightCarryForward || 0) > 0
        );

        if (eligibleMembers.length === 0) {
          return {
            success: false,
            statusCode: 400,
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
          const leftEligible = member.leftCarryForward || 0;
          const rightEligible = member.rightCarryForward || 0;
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
              created_by: params.adminId || 'AANO-SADMIN-001',
              created_at: nowIso,
              notes: params.reason?.trim() || `Company-wide Batch Matching Cycle (Count: ${eligibleMembers.length})`
            });
          }
        });

        const updatedNodes = payload.treeState.nodes.map((m) => {
          const upd = memberUpdateMap.get(m.id);
          if (!upd) return m;
          return {
            ...m,
            leftCarryForward: upd.leftCF,
            rightCarryForward: upd.rightCF,
            left_carry_forward: upd.leftCF,
            right_carry_forward: upd.rightCF,
            totalMatchedPV: (m.totalMatchedPV || 0) + upd.addedMatch,
            updated_at: nowIso
          };
        });

        const nextPayload: PersistedBinaryStorePayload = {
          treeState: {
            ...payload.treeState,
            nodes: updatedNodes,
            version: payload.treeState.version + 1,
            updatedAt: nowIso
          },
          matchingHistory: [...newRecords, ...payload.matchingHistory],
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(nextPayload);

        return {
          success: true,
          statusCode: 200,
          records: newRecords,
          totalMatchedPV,
          data: nextPayload,
          message: `কোম্পানির ${newRecords.length} জন মেম্বারের মোট ${totalMatchedPV.toLocaleString()} PV সফলভাবে ম্যাচিং হয়েছে!`
        };
      });
    },

    adjustCarryForward: async (params: {
      memberId: string;
      leftNew: number;
      rightNew: number;
      reason: string;
      adminId?: string;
    }): Promise<ServerMatchingResult> => {
      return runWithLock(() => {
        if (!params.reason || !params.reason.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'এডজাস্টমেন্টের কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।'
          };
        }
        const payload = loadAndReconcileFromDisk();
        const member = findBinaryTreeNodeById(
          payload.treeState.nodes,
          params.memberId,
          payload.treeState.idMigrationMappings
        );
        if (!member || member.nodeStatus === 'blank') {
          return {
            success: false,
            statusCode: 404,
            message: `মেম্বার '${params.memberId}' পাওয়া যায়নি।`
          };
        }

        const nowIso = new Date().toISOString();
        const leftClean = Math.max(0, Number(params.leftNew) || 0);
        const rightClean = Math.max(0, Number(params.rightNew) || 0);

        const updatedNodes = payload.treeState.nodes.map((m) =>
          m.id === member.id
            ? {
                ...m,
                leftCarryForward: leftClean,
                rightCarryForward: rightClean,
                left_carry_forward: leftClean,
                right_carry_forward: rightClean,
                updated_at: nowIso
              }
            : m
        );

        const nextPayload: PersistedBinaryStorePayload = {
          treeState: {
            ...payload.treeState,
            nodes: updatedNodes,
            version: payload.treeState.version + 1,
            updatedAt: nowIso
          },
          matchingHistory: payload.matchingHistory,
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(nextPayload);

        return {
          success: true,
          statusCode: 200,
          data: nextPayload,
          message: `মেম্বার ${member.fullName} (${member.id}) এর ক্যারি ফরোয়ার্ড সফলভাবে আপডেট করা হয়েছে (Left CF: ${leftClean}, Right CF: ${rightClean})!`
        };
      });
    },

    reassignPlacement: async (params: {
      targetMemberId: string;
      newBinaryParentId: string;
      newPosition: 'left' | 'right';
      reason: string;
    }): Promise<ServerMatchingResult> => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        const nodes = payload.treeState.nodes;

        if (!params.reason || !params.reason.trim()) {
          return {
            success: false,
            statusCode: 400,
            message: 'প্লেসমেন্ট পরিবর্তনের কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।'
          };
        }

        const target = findBinaryTreeNodeById(
          nodes,
          params.targetMemberId,
          payload.treeState.idMigrationMappings
        );
        if (!target || target.nodeStatus === 'blank') {
          return {
            success: false,
            statusCode: 404,
            message: 'টার্গেট মেম্বার খুঁজে পাওয়া যায়নি।'
          };
        }
        if (target.id === COMPANY_MASTER_ROOT_ID || !target.parentId) {
          return {
            success: false,
            statusCode: 400,
            message: 'কোম্পানি রুট নোড (Root Node) স্থানান্তর করা সম্ভব নয়।'
          };
        }

        const newParent = findBinaryTreeNodeById(
          nodes,
          params.newBinaryParentId,
          payload.treeState.idMigrationMappings
        );
        if (!newParent || newParent.nodeStatus === 'blank') {
          return {
            success: false,
            statusCode: 404,
            message: 'নতুন প্যারেন্ট নোড খুঁজে পাওয়া যায়নি।'
          };
        }
        if (newParent.id === target.id) {
          return {
            success: false,
            statusCode: 400,
            message: 'একজন সদস্য নিজের প্যারেন্ট হতে পারেন না।'
          };
        }

        let curr: NetworkMember | undefined = newParent;
        const visited = new Set<string>();
        while (curr && curr.parentId && !visited.has(curr.id)) {
          visited.add(curr.id);
          if (curr.parentId === target.id) {
            return {
              success: false,
              statusCode: 400,
              message: 'সার্কুলার লুপ ত্রুটি: কোনো সদস্যকে তার নিজের ডাউনলাইনের অধীনস্থ নোডে স্থানান্তর করা যাবে না।'
            };
          }
          curr = nodes.find((m) => m.id === curr?.parentId);
        }

        const currentOccupantId =
          params.newPosition === 'left' ? newParent.leftChildId : newParent.rightChildId;
        if (currentOccupantId && currentOccupantId !== target.id) {
          return {
            success: false,
            statusCode: 409,
            message: `নির্বাচিত ${params.newPosition === 'left' ? 'বাম' : 'ডান'} স্লটটি ইতিমধ্যেই '${currentOccupantId}' দ্বারা পূর্ণ রয়েছে।`
          };
        }

        const replacedBlankId =
          params.newPosition === 'left' ? newParent.leftBlankId : newParent.rightBlankId;
        const updatedAllocatedIds: Record<string, 'blank' | 'registered' | 'tombstoned'> = {
          ...payload.treeState.allocatedIds
        };
        if (replacedBlankId) {
          updatedAllocatedIds[replacedBlankId] = 'tombstoned';
        }

        const nowIso = new Date().toISOString();
        const filteredNodes = nodes
          .filter((m) => m.id !== replacedBlankId)
          .map((m) => {
            if (m.id === target.id) {
              return {
                ...m,
                parentId: newParent.id,
                parent_id: newParent.id,
                binaryParentId: newParent.id,
                binary_parent_id: newParent.id,
                placementId: newParent.id,
                placement_id: newParent.id,
                placementLeg: params.newPosition,
                position: params.newPosition === 'left' ? 'LEFT' : 'RIGHT',
                placementLocked: true,
                updated_at: nowIso
              };
            }
            return m;
          });

        const reconciledState = reconcileBinaryTreeState(
          filteredNodes,
          payload.treeState.lastCompanySeq,
          updatedAllocatedIds,
          payload.treeState.version + 1,
          payload.treeState.lastAbCustomerSeq,
          payload.treeState.idMigrationMappings,
          payload.treeState.migrationReport
        );

        const nextPayload: PersistedBinaryStorePayload = {
          treeState: reconciledState,
          matchingHistory: payload.matchingHistory,
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(nextPayload);

        return {
          success: true,
          statusCode: 200,
          data: nextPayload,
          message: `সদস্য ${target.fullName} (${target.id})-এর বাইনারি প্লেসমেন্ট সফলভাবে আপডেট হয়েছে এবং খালি পজিশনে নতুন Blank Slot তৈরি হয়েছে!`
        };
      });
    },

    syncSnapshotIfNewer: async (nodes: NetworkMember[], matchingHistory?: MatchingRecord[]) => {
      return runWithLock(() => {
        const payload = loadAndReconcileFromDisk();
        const reconciled = reconcileBinaryTreeState(
          nodes,
          payload.treeState.lastCompanySeq,
          payload.treeState.allocatedIds,
          payload.treeState.version + 1,
          payload.treeState.lastAbCustomerSeq,
          payload.treeState.idMigrationMappings,
          payload.treeState.migrationReport
        );
        const nextPayload: PersistedBinaryStorePayload = {
          treeState: reconciled,
          matchingHistory: Array.isArray(matchingHistory) ? matchingHistory : payload.matchingHistory,
          emailDeliveryLogs: payload.emailDeliveryLogs || []
        };
        savePayload(nextPayload);
        return nextPayload;
      });
    }
  };
}

export const defaultBinaryTreeStore = createBinaryTreeStore();
