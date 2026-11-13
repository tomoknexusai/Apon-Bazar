/**
 * Customer Authentication Modal for Direct Product Purchase Flow
 * Uses the single shared CustomerRegistrationForm (Customer-Only)
 * Project: Apon Bazar / আপন বাজার
 */

import React from 'react';
import { CustomerRegistrationForm } from './CustomerRegistrationForm';

export interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pendingProductName?: string;
  pendingQuantity?: number;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pendingProductName,
  pendingQuantity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-6 border border-neutral-200 dark:border-neutral-800 my-auto animate-in fade-in zoom-in-95">
        <CustomerRegistrationForm
          source="checkout"
          title="কাস্টমার রেজিস্ট্রেশন (Customer Only)"
          subtitle="অর্ডার সম্পন্ন করতে কাস্টমার একাউন্টে প্রবেশ করুন"
          pendingProductName={pendingProductName}
          pendingQuantity={pendingQuantity}
          isModal={false}
          showTabs={true}
          onClose={onClose}
          onSuccess={() => {
            onSuccess();
          }}
        />
      </div>
    </div>
  );
};
