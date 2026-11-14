/**
 * Slot Reservation Service
 * Handles temporary slot reservations and AI placement slot recommendations
 * Project: Apon Bazar / Apon Bazar
 */

import { COMPANY_MASTER_ROOT_ID, NetworkMember, ReservedSlot } from '../types/networkMarketing';

export interface SlotAvailabilityResult {
  isAvailable: boolean;
  reason?: string;
  occupiedBy?: string;
  isReserved?: boolean;
  reservedCompanyId?: string;
}

export interface AIPlacementRecommendation {
  sponsorId: string;
  sponsorName: string;
  placementId: string;
  placementName: string;
  position: 'left' | 'right';
  reservedCompanyId?: string;
  statusText: string;
  isAvailable: boolean;
  reasonText: string;
}

export class SlotReservationService {
  /**
   * Check if a specific placement slot (parent + leg) is available
   * Checks both permanent children in the tree and active temporary reservations
   */
  static isSlotAvailable(
    parentId: string,
    leg: 'left' | 'right',
    members: NetworkMember[],
    reservedPlacements: ReservedSlot[] = [],
    currentReservationId?: string
  ): SlotAvailabilityResult {
    if (!parentId) {
      return { isAvailable: false, reason: 'Placement ID is required' };
    }

    const registeredMembers = members.filter((m) => m.nodeStatus !== 'blank');
    const cleanParentId = parentId.trim().toUpperCase();
    const parentNode = registeredMembers.find(
      (m) =>
        m.id.toUpperCase() === cleanParentId ||
        (m.customerId && m.customerId.toUpperCase() === cleanParentId) ||
        (m.userId && m.userId.toUpperCase() === cleanParentId)
    );

    if (!parentNode) {
      return { isAvailable: false, reason: `Placement ID "${parentId}" not found in network tree` };
    }

    // 1. Check permanent registered child
    const childId = leg === 'left' ? parentNode.leftChildId : parentNode.rightChildId;
    if (childId) {
      const childNode = registeredMembers.find((m) => m.id === childId || m.customerId === childId);
      const childName = childNode ? `${childNode.fullName} (${childNode.id})` : childId;
      return {
        isAvailable: false,
        reason: `This ${leg === 'left' ? 'Left' : 'Right'} slot is permanently occupied by ${childName}`,
        occupiedBy: childName
      };
    }

    // 2. Check active temporary reservation by another user
    const activeReservation = reservedPlacements.find((r) => {
      const isSameParent =
        r.parentMemberId.toUpperCase() === parentNode.id.toUpperCase() ||
        r.parentMemberId.toUpperCase() === cleanParentId;
      const isSameLeg = r.leg === leg;
      const isDifferentUser = !currentReservationId || r.id !== currentReservationId;
      return isSameParent && isSameLeg && isDifferentUser;
    });

    if (activeReservation) {
      return {
        isAvailable: false,
        isReserved: true,
        reason: `This ${leg === 'left' ? 'Left' : 'Right'} slot is temporarily reserved by another pending registration (${activeReservation.customerName || 'In progress'})`,
        occupiedBy: activeReservation.customerName || 'Reserved'
      };
    }

    // 3. Resolve pre-reserved blank position Company ID if present on parent or all nodes
    const blankNode = members.find(
      (m) =>
        m.nodeStatus === 'blank' &&
        m.parentId?.toUpperCase() === parentNode.id.toUpperCase() &&
        (m.placementLeg || '').toLowerCase() === leg
    );
    const reservedCompanyId =
      (leg === 'left' ? parentNode.leftBlankId : parentNode.rightBlankId) || blankNode?.id;

    return { isAvailable: true, reservedCompanyId };
  }

  /**
   * Calculate AI Placement Recommendation
   * Evaluates team volume and finds the optimal available placement slot
   */
  static calculateAIRecommendation(
    sponsorId: string | undefined,
    members: NetworkMember[],
    reservedPlacements: ReservedSlot[] = [],
    preferredLeg?: 'left' | 'right'
  ): AIPlacementRecommendation {
    const registeredMembers = members.filter((m) => m.nodeStatus !== 'blank');

    // 1. Resolve sponsor
    const masterMember: NetworkMember = registeredMembers.find((m) => m.id === COMPANY_MASTER_ROOT_ID) || registeredMembers[0] || ({
      id: COMPANY_MASTER_ROOT_ID,
      userId: 'admin-master',
      customerId: COMPANY_MASTER_ROOT_ID,
      fullName: 'Company Master Account',
      mobile: '01700000000',
      email: 'master@aponbazar.com',
      role: 'admin',
      joinDate: new Date().toISOString(),
      leftChildId: undefined,
      rightChildId: undefined,
      leftPV: 0,
      rightPV: 0,
      totalEarned: 0,
      currentBalance: 0,
      rank: 'Member',
      isActive: true
    } as unknown as NetworkMember);

    let sponsor: NetworkMember = masterMember;
    if (sponsorId) {
      const cleanSponsor = sponsorId.trim().toUpperCase();
      const found = registeredMembers.find(
        (m) =>
          m.id.toUpperCase() === cleanSponsor ||
          (m.customerId && m.customerId.toUpperCase() === cleanSponsor) ||
          (m.userId && m.userId.toUpperCase() === cleanSponsor)
      );
      if (found) sponsor = found;
    }

    // 2. Determine target leg (auto-balance volume or honor preferred)
    let targetLeg: 'left' | 'right' = preferredLeg || 'right';
    if (!preferredLeg) {
      const leftVol = Number(sponsor.leftPV) || 0;
      const rightVol = Number(sponsor.rightPV) || 0;
      targetLeg = leftVol <= rightVol ? 'left' : 'right';
    }

    // 3. Search downline of sponsor for first slot that is BOTH physically empty and not reserved
    const queue: NetworkMember[] = [sponsor];
    const visited = new Set<string>();

    let chosenParent: NetworkMember = sponsor;
    let chosenPosition: 'left' | 'right' = targetLeg;
    let chosenReservedCompanyId: string | undefined;
    let foundSlot = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);

      // Check chosen preferred leg first on this node
      const firstLeg = targetLeg;
      const secondLeg = targetLeg === 'left' ? 'right' : 'left';

      const firstCheck = this.isSlotAvailable(current.id, firstLeg, members, reservedPlacements);
      if (firstCheck.isAvailable) {
        chosenParent = current;
        chosenPosition = firstLeg;
        chosenReservedCompanyId = firstCheck.reservedCompanyId;
        foundSlot = true;
        break;
      }

      const secondCheck = this.isSlotAvailable(current.id, secondLeg, members, reservedPlacements);
      if (secondCheck.isAvailable) {
        chosenParent = current;
        chosenPosition = secondLeg;
        chosenReservedCompanyId = secondCheck.reservedCompanyId;
        foundSlot = true;
        break;
      }

      // Add children to queue
      if (current.leftChildId) {
        const leftNode = registeredMembers.find((m) => m.id === current.leftChildId);
        if (leftNode) queue.push(leftNode);
      }
      if (current.rightChildId) {
        const rightNode = registeredMembers.find((m) => m.id === current.rightChildId);
        if (rightNode) queue.push(rightNode);
      }
    }

    // Fallback if full subtree saturated
    if (!foundSlot) {
      chosenParent = sponsor;
      chosenPosition = targetLeg;
    }

    return {
      sponsorId: sponsor.id,
      sponsorName: sponsor.fullName,
      placementId: chosenParent.id,
      placementName: chosenParent.fullName,
      position: chosenPosition,
      reservedCompanyId: chosenReservedCompanyId,
      statusText: 'Available',
      isAvailable: true,
      reasonText: `AI Smart Placement has selected the optimal ${chosenPosition === 'left' ? 'Left' : 'Right'} slot under ${chosenParent.fullName} (${chosenParent.id})${chosenReservedCompanyId ? ` [Reserved ID: ${chosenReservedCompanyId}]` : ''} based on network balance.`
    };
  }
}
