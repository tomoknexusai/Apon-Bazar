/**
 * Delivery Rider Account & Credential Management Component
 * Project: APON BAZAR (আপন বাজার)
 */

import React from 'react';
import { StaffCredentialManager } from './StaffCredentialManager';

export const RiderAccountManager: React.FC = () => {
  return <StaffCredentialManager roleGroup="rider" />;
};
