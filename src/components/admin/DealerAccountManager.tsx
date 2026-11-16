/**
 * Dealer Account & Credential Management Component
 * Project: APON BAZAR (আপন বাজার)
 */

import React from 'react';
import { StaffCredentialManager } from './StaffCredentialManager';

export const DealerAccountManager: React.FC = () => {
  return <StaffCredentialManager roleGroup="dealer" />;
};
