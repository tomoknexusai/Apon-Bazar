/**
 * Add Customer & Reserve Binary Slot Modal - DEPRECATED WRAPPER
 * Delegated to the single shared CustomerRegistrationModal
 */

import React from 'react';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';

interface AddCustomerSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMemberId: string;
  parentMemberName?: string;
  leg: 'left' | 'right';
  sponsorId?: string;
}

export const AddCustomerSlotModal: React.FC<AddCustomerSlotModalProps> = ({
  isOpen,
  onClose,
  parentMemberId,
  leg,
  sponsorId
}) => {
  return (
    <CustomerRegistrationModal
      isOpen={isOpen}
      onClose={onClose}
      source="binary_tree"
      title="Customer Registration & Slot Reserved"
      initialReferralId={sponsorId || 'TMK000001'}
      initialPlacementId={parentMemberId}
      initialPlacementPosition={leg}
      lockPlacement={true}
    />
  );
};
