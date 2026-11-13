/**
 * Customer Registration Modal Wrapper
 * Wraps the single shared CustomerRegistrationForm in a clean, accessible dialog
 * Project: Apon Bazar / Apon Bazar
 */

import React from 'react';
import { CustomerRegistrationForm, CustomerRegistrationFormProps } from './CustomerRegistrationForm';

export interface CustomerRegistrationModalProps extends Omit<CustomerRegistrationFormProps, 'isModal'> {
  isOpen: boolean;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  ...formProps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-7 my-auto">
        <CustomerRegistrationForm
          {...formProps}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
