/**
 * Role-Based Unique ID System Service for Apon Bazar
 * 
 * Rules:
 * Exactly 8 Final Roles:
 * 1. Customer & Networker   -> Prefix: AponCN-  (e.g. AponCN-000001)
 * 2. Operation Officer       -> Prefix: AponOO-  (e.g. AponOO-000001)
 * 3. Vendor / Dealer / Shop  -> Prefix: AponVDS- (e.g. AponVDS-000001) [Business Type: Vendor | Dealer | Shop]
 * 4. Rider                   -> Prefix: AponR-   (e.g. AponR-000001)
 * 5. Admin                   -> Prefix: AponA-   (e.g. AponA-000001)
 * 6. Super Admin             -> Prefix: AponSA-  (e.g. AponSA-000001)
 * 7. Account Officer         -> Prefix: AponAO-  (e.g. AponAO-000001)
 * 8. HR                      -> Prefix: AponHR-  (e.g. AponHR-000001)
 * 
 * Sequence Rule:
 * - Always 6 digits, padded with leading zeros (e.g. 000001).
 * - Independent monotonic sequence per role.
 * - Concurrency-safe atomic generation.
 * - Permanent: Never reused, deleted accounts never release their ID, sequence never resets.
 * - Changing Business Type for Vendor/Dealer/Shop does NOT change the Unique ID.
 */

import { FinalRole, BusinessType, FINAL_ROLE_DEFINITIONS, UserProfile } from '../types';

export interface AllocatedIdRecord {
  uniqueId: string;
  userId: string;
  role: FinalRole;
  businessType?: BusinessType;
  allocatedAt: string;
  status: 'active' | 'deleted' | 'suspended';
}

const STORAGE_SEQUENCES_KEY = 'aponbazar_unique_id_sequences';
const STORAGE_ALLOCATED_IDS_KEY = 'aponbazar_allocated_unique_ids';

const memoryStoreFallback: Record<string, string> = {};

function readStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return memoryStoreFallback[key] ?? null;
  } catch {
    return memoryStoreFallback[key] ?? null;
  }
}

function writeStorageItem(key: string, value: string): void {
  memoryStoreFallback[key] = value;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.error('Error writing unique ID storage', e);
  }
}

export class UniqueIdService {
  /**
   * Normalizes any input role string (including legacy roles) to one of the 8 final canonical roles.
   */
  static normalizeToFinalRole(roleInput?: string | null): FinalRole {
    if (!roleInput) return 'customer_networker';
    const r = roleInput.toLowerCase().trim();

    switch (r) {
      case 'super_admin':
      case 'super-admin':
      case 'super admin':
      case 'founder':
      case 'superadmin':
      case 'sadmin':
        return 'super_admin';

      case 'admin':
      case 'district_admin':
      case 'district-admin':
      case 'district admin':
      case 'sub_admin':
      case 'administrator':
        return 'admin';

      case 'operations_officer':
      case 'operations-officer':
      case 'operations officer':
      case 'operations_partner':
      case 'operations-partner':
      case 'operation_officer':
      case 'operation officer':
      case 'ops_partner':
      case 'ops':
        return 'operations_officer';

      case 'account_officer':
      case 'account-officer':
      case 'account officer':
      case 'accounts_officer':
      case 'finance':
      case 'finance_officer':
      case 'finance-officer':
      case 'accounts':
      case 'accountant':
        return 'account_officer';

      case 'rider':
      case 'delivery_rider':
      case 'delivery-rider':
      case 'delivery rider':
      case 'delivery_man':
      case 'delivery-man':
      case 'delivery man':
      case 'deliveryman':
      case 'courier':
        return 'rider';

      case 'vendor_dealer_shop':
      case 'vendor-dealer-shop':
      case 'vds':
      case 'vendor':
      case 'dealer':
      case 'shop':
      case 'seller':
      case 'merchant':
      case 'shopkeeper':
      case 'store_owner':
        return 'vendor_dealer_shop';

      case 'hr':
      case 'hr_manager':
      case 'hr_officer':
      case 'hr officer':
      case 'human_resources':
      case 'human-resources':
        return 'hr';

      case 'customer_networker':
      case 'customer-networker':
      case 'customer':
      case 'network_member':
      case 'network-member':
      case 'networker':
      default:
        return 'customer_networker';
    }
  }

  /**
   * Returns role prefix for the given role (e.g. 'AponCN-', 'AponVDS-').
   */
  static getRolePrefix(role: string): string {
    const finalRole = this.normalizeToFinalRole(role);
    return FINAL_ROLE_DEFINITIONS[finalRole].prefix;
  }

  /**
   * Returns human-readable role name in English and Bengali.
   */
  static getRoleTitle(role: string): { en: string; bn: string } {
    const finalRole = this.normalizeToFinalRole(role);
    const def = FINAL_ROLE_DEFINITIONS[finalRole];
    return { en: def.nameEn, bn: def.nameBn };
  }

  /**
   * Gets current stored sequences map.
   */
  private static getStoredSequences(): Record<FinalRole, number> {
    try {
      const saved = readStorageItem(STORAGE_SEQUENCES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          customer_networker: parsed.customer_networker || 0,
          operations_officer: parsed.operations_officer || 0,
          vendor_dealer_shop: parsed.vendor_dealer_shop || 0,
          rider: parsed.rider || 0,
          admin: parsed.admin || 0,
          super_admin: parsed.super_admin || 0,
          account_officer: parsed.account_officer || 0,
          hr: parsed.hr || 0
        };
      }
    } catch (e) {
      console.error('Error reading unique ID sequences', e);
    }

    return {
      customer_networker: 0,
      operations_officer: 0,
      vendor_dealer_shop: 0,
      rider: 0,
      admin: 0,
      super_admin: 0,
      account_officer: 0,
      hr: 0
    };
  }

  /**
   * Saves updated sequences map.
   */
  private static saveStoredSequences(seq: Record<FinalRole, number>): void {
    try {
      writeStorageItem(STORAGE_SEQUENCES_KEY, JSON.stringify(seq));
    } catch (e) {
      console.error('Error saving unique ID sequences', e);
    }
  }

  /**
   * Gets allocated/tombstoned IDs registry.
   */
  static getAllocatedIds(): Record<string, AllocatedIdRecord> {
    try {
      const saved = readStorageItem(STORAGE_ALLOCATED_IDS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error reading allocated unique IDs', e);
    }
    return {};
  }

  /**
   * Saves allocated IDs registry.
   */
  private static saveAllocatedIds(registry: Record<string, AllocatedIdRecord>): void {
    try {
      writeStorageItem(STORAGE_ALLOCATED_IDS_KEY, JSON.stringify(registry));
    } catch (e) {
      console.error('Error saving allocated unique IDs', e);
    }
  }

  /**
   * Computes the highest currently allocated/known sequence number for a role prefix without side effects.
   */
  private static computeMaxSequenceForRole(
    finalRole: FinalRole,
    sequences: Record<FinalRole, number>,
    allocated: Record<string, AllocatedIdRecord>,
    existingUsers: UserProfile[] = []
  ): number {
    const prefix = FINAL_ROLE_DEFINITIONS[finalRole].prefix;
    let maxNum = sequences[finalRole] || 0;

    Object.keys(allocated).forEach((id) => {
      if (id.startsWith(prefix)) {
        const numPart = parseInt(id.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    existingUsers.forEach((u) => {
      const candidates = [u.aponUniqueId, u.permanentMemberId, u.customerId];
      candidates.forEach((idToCheck) => {
        if (idToCheck && idToCheck.startsWith(prefix)) {
          const numPart = parseInt(idToCheck.replace(prefix, ''), 10);
          if (!isNaN(numPart) && numPart > maxNum) {
            maxNum = numPart;
          }
        }
      });
    });

    return maxNum;
  }

  /**
   * Pure non-mutating preview of the next Unique ID for UI display in registration forms.
   * NEVER increments stored sequences and NEVER writes to allocated registry.
   */
  static previewNextUniqueId(
    roleInput: string,
    existingUsers: UserProfile[] = []
  ): string {
    const finalRole = this.normalizeToFinalRole(roleInput);
    const prefix = FINAL_ROLE_DEFINITIONS[finalRole].prefix;
    const sequences = this.getStoredSequences();
    const allocated = this.getAllocatedIds();
    const maxNum = this.computeMaxSequenceForRole(finalRole, sequences, allocated, existingUsers);
    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(6, '0')}`;
  }

  /**
   * Concurrency-safe atomic generation of the next Unique ID for a role.
   * Guarantees 6-digit zero padding and non-reuse.
   */
  static generateNextUniqueId(
    roleInput: string,
    userId?: string,
    existingUsers: UserProfile[] = [],
    businessType?: BusinessType
  ): string {
    const finalRole = this.normalizeToFinalRole(roleInput);
    const prefix = FINAL_ROLE_DEFINITIONS[finalRole].prefix;

    const sequences = this.getStoredSequences();
    const allocated = this.getAllocatedIds();

    const maxNum = this.computeMaxSequenceForRole(finalRole, sequences, allocated, existingUsers);

    // Increment atomically and skip any unlikely collision
    let nextNum = maxNum + 1;
    let formattedId = `${prefix}${nextNum.toString().padStart(6, '0')}`;
    while (allocated[formattedId]) {
      nextNum += 1;
      formattedId = `${prefix}${nextNum.toString().padStart(6, '0')}`;
    }

    // Update sequence
    sequences[finalRole] = nextNum;
    this.saveStoredSequences(sequences);

    // Record into allocated registry
    allocated[formattedId] = {
      uniqueId: formattedId,
      userId: userId || `usr-${Date.now()}`,
      role: finalRole,
      businessType: finalRole === 'vendor_dealer_shop' ? businessType || 'Dealer' : undefined,
      allocatedAt: new Date().toISOString(),
      status: 'active'
    };
    this.saveAllocatedIds(allocated);

    return formattedId;
  }

  /**
   * Registers a pre-existing or manual Unique ID to ensure it is accounted for in sequences
   * and can never be duplicated.
   */
  static registerExistingUniqueId(
    uniqueId: string,
    userId: string,
    roleInput: string,
    businessType?: BusinessType
  ): void {
    const finalRole = this.normalizeToFinalRole(roleInput);
    const prefix = FINAL_ROLE_DEFINITIONS[finalRole].prefix;

    if (!uniqueId.startsWith(prefix)) return;

    const numPart = parseInt(uniqueId.replace(prefix, ''), 10);
    if (isNaN(numPart)) return;

    const sequences = this.getStoredSequences();
    if (numPart > (sequences[finalRole] || 0)) {
      sequences[finalRole] = numPart;
      this.saveStoredSequences(sequences);
    }

    const allocated = this.getAllocatedIds();
    allocated[uniqueId] = {
      uniqueId,
      userId,
      role: finalRole,
      businessType,
      allocatedAt: new Date().toISOString(),
      status: 'active'
    };
    this.saveAllocatedIds(allocated);
  }

  /**
   * Permanently marks a deleted user's ID as tombstoned so it is NEVER released or reused.
   */
  static recordAccountDeletion(uniqueId: string, userId: string): void {
    const allocated = this.getAllocatedIds();
    if (allocated[uniqueId]) {
      allocated[uniqueId].status = 'deleted';
    } else {
      allocated[uniqueId] = {
        uniqueId,
        userId,
        role: this.parseUniqueId(uniqueId).role || 'customer_networker',
        allocatedAt: new Date().toISOString(),
        status: 'deleted'
      };
    }
    this.saveAllocatedIds(allocated);
  }

  /**
   * Validates if a string adheres strictly to the Apon Unique ID format:
   * e.g. AponCN-000001, AponVDS-000145
   */
  static isUniqueIdValid(id?: string | null): boolean {
    if (!id) return false;
    const regex = /^Apon(CN|OO|VDS|R|A|SA|AO|HR)-\d{6}$/;
    return regex.test(id.trim());
  }

  /**
   * Parses an Apon Unique ID into its components.
   */
  static parseUniqueId(id?: string | null): {
    isValid: boolean;
    prefix?: string;
    role?: FinalRole;
    sequenceNumber?: number;
  } {
    if (!id || !this.isUniqueIdValid(id)) {
      return { isValid: false };
    }

    const clean = id.trim();
    const parts = clean.split('-');
    const prefix = parts[0] + '-';
    const seq = parseInt(parts[1], 10);

    const matchRole = (Object.keys(FINAL_ROLE_DEFINITIONS) as FinalRole[]).find(
      (r) => FINAL_ROLE_DEFINITIONS[r].prefix === prefix
    );

    return {
      isValid: true,
      prefix,
      role: matchRole,
      sequenceNumber: seq
    };
  }

  /**
   * Safely migrates an existing list of users to assign permanent Role-Based Unique IDs.
   * If a user already has a valid Apon Unique ID, it is preserved without mutating input objects.
   * Preserves historical orders, referrals, and passwords.
   */
  static migrateUsers(users: UserProfile[]): { updatedUsers: UserProfile[]; modifiedCount: number } {
    let modifiedCount = 0;
    const allocated = this.getAllocatedIds();
    const sequences = this.getStoredSequences();
    const seenValidIds = new Set<string>();
    const isAbId = (val?: string | null) => !!val && /^AB-\d{10,}$/i.test(val.trim());

    // First pass: register all already valid, non-duplicate Apon IDs or AB- IDs without mutating input array
    const resolvedCandidates = users.map((u) => {
      const abExisting = [u.customerId, u.binaryCompanyId, u.aponUniqueId, u.permanentMemberId].find(
        (id) => isAbId(id)
      );
      if (abExisting) {
        const normAb = abExisting.trim().toUpperCase();
        seenValidIds.add(normAb);
        return normAb;
      }

      const candidate = [u.aponUniqueId, u.permanentMemberId, u.customerId].find((id) =>
        this.isUniqueIdValid(id)
      );
      if (candidate && !seenValidIds.has(candidate)) {
        seenValidIds.add(candidate);
        const parsed = this.parseUniqueId(candidate);
        if (parsed.role && parsed.sequenceNumber) {
          if (parsed.sequenceNumber > (sequences[parsed.role] || 0)) {
            sequences[parsed.role] = parsed.sequenceNumber;
          }
          const prevRecord = allocated[candidate];
          allocated[candidate] = {
            uniqueId: candidate,
            userId: u.id,
            role: parsed.role,
            businessType: u.businessType || (parsed.role === 'vendor_dealer_shop' ? 'Dealer' : undefined),
            allocatedAt: prevRecord?.allocatedAt || u.createdAt || new Date().toISOString(),
            status:
              prevRecord?.status === 'deleted'
                ? 'deleted'
                : u.accountStatus === 'suspended'
                ? 'suspended'
                : 'active'
          };
        }
        return candidate;
      }
      return undefined;
    });

    this.saveStoredSequences(sequences);
    this.saveAllocatedIds(allocated);

    // Second pass: assign IDs to users missing one
    const updatedUsers = users.map((u, idx) => {
      const existingValidId = resolvedCandidates[idx];
      const finalRole = this.normalizeToFinalRole(u.finalRole || u.primaryRole);
      let bType = u.businessType;
      if (finalRole === 'vendor_dealer_shop' && !bType) {
        bType = u.primaryRole === 'vendor' ? 'Vendor' : (u.primaryRole as string) === 'shop' ? 'Shop' : 'Dealer';
      }

      if (existingValidId) {
        if (isAbId(existingValidId)) {
          return {
            ...u,
            customerId: existingValidId,
            binaryCompanyId: u.binaryCompanyId || existingValidId,
            permanentMemberId: existingValidId,
            aponUniqueId: u.aponUniqueId || existingValidId,
            finalRole,
            businessType: bType
          };
        }
        if (u.aponUniqueId !== existingValidId || u.permanentMemberId !== existingValidId || u.finalRole !== finalRole) {
          modifiedCount++;
        }
        return {
          ...u,
          aponUniqueId: existingValidId,
          permanentMemberId: existingValidId,
          customerId: finalRole === 'customer_networker' ? (u.customerId && isAbId(u.customerId) ? u.customerId : existingValidId) : u.customerId,
          finalRole,
          businessType: bType
        };
      }

      const newId = this.generateNextUniqueId(finalRole, u.id, users, bType);
      modifiedCount++;

      return {
        ...u,
        aponUniqueId: newId,
        permanentMemberId: newId,
        customerId: finalRole === 'customer_networker' ? newId : u.customerId,
        finalRole,
        businessType: bType
      };
    });

    return { updatedUsers, modifiedCount };
  }

  /**
   * Fast indexed search of users by Unique ID.
   */
  static searchUsersByUniqueId(users: UserProfile[], query: string): UserProfile[] {
    if (!query || !query.trim()) return users;
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      const uid = (u.aponUniqueId || u.permanentMemberId || '').toLowerCase();
      const name = (u.fullName || '').toLowerCase();
      const mobile = (u.mobileNumber || '').toLowerCase();
      const email = (u.email || '').toLowerCase();

      return (
        uid.includes(q) ||
        name.includes(q) ||
        mobile.includes(q) ||
        email.includes(q)
      );
    });
  }

  /**
   * Changes the Business Type for Vendor / Dealer / Shop.
   * STRICT RULE: The Unique ID (e.g. AponVDS-000145) MUST NOT CHANGE.
   */
  static updateBusinessType(
    user: UserProfile,
    newBusinessType: BusinessType
  ): UserProfile {
    const finalRole = this.normalizeToFinalRole(user.finalRole || user.primaryRole);
    if (finalRole !== 'vendor_dealer_shop') {
      return user;
    }

    const retainedId = user.aponUniqueId || user.permanentMemberId;
    if (retainedId) {
      const allocated = this.getAllocatedIds();
      if (allocated[retainedId]) {
        allocated[retainedId] = {
          ...allocated[retainedId],
          businessType: newBusinessType
        };
        this.saveAllocatedIds(allocated);
      }
    }

    return {
      ...user,
      businessType: newBusinessType,
      // Retain the existing permanent AponVDS ID
      aponUniqueId: retainedId,
      permanentMemberId: retainedId,
      updatedAt: new Date().toISOString()
    };
  }
}
