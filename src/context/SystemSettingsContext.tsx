/**
 * System Settings Context
 * Pilot Mode State Management for 'Thakurgaon Sadar, Thakurgaon, Bangladesh'
 * Project: বাজার সদাই (Bazar Sadai)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PilotAreaSpec {
  divisionBn: string;
  divisionEn: string;
  districtBn: string;
  districtEn: string;
  upazilaBn: string;
  upazilaEn: string;
  postalCode: string;
}

export const DEFAULT_PILOT_AREA: PilotAreaSpec = {
  divisionBn: 'রংপুর',
  divisionEn: 'Rangpur',
  districtBn: 'ঠাকুরগাঁও',
  districtEn: 'Thakurgaon',
  upazilaBn: 'ঠাকুরগাঁও সদর',
  upazilaEn: 'Thakurgaon Sadar',
  postalCode: '5100'
};

interface SystemSettingsContextType {
  isPilotMode: boolean;
  setPilotMode: (enabled: boolean) => void;
  togglePilotMode: () => void;
  pilotArea: PilotAreaSpec;
  validatePilotLocation: (district?: string, upazila?: string) => { isValid: boolean; message: string };
  filterByPilotMode: <T extends { district?: string; upazila?: string; coverageDistrict?: string; coverageUpazila?: string; currentDistrict?: string; currentUpazila?: string }>(items: T[]) => T[];
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPilotMode, setIsPilotModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('bazar_sadai_pilot_mode');
    return saved !== null ? saved === 'true' : false; // Default: Nationwide Bangladesh Active (false)
  });

  useEffect(() => {
    localStorage.setItem('bazar_sadai_pilot_mode', String(isPilotMode));
  }, [isPilotMode]);

  const setPilotMode = (enabled: boolean) => {
    setIsPilotModeState(enabled);
  };

  const togglePilotMode = () => {
    setIsPilotModeState((prev) => !prev);
  };

  const validatePilotLocation = (district?: string, upazila?: string) => {
    if (!isPilotMode) {
      return { isValid: true, message: '' };
    }
    const distClean = district?.trim() || '';
    const upazClean = upazila?.trim() || '';

    const isDistValid = !distClean || distClean === DEFAULT_PILOT_AREA.districtBn || distClean === DEFAULT_PILOT_AREA.districtEn;
    const isUpazValid = !upazClean || upazClean === DEFAULT_PILOT_AREA.upazilaBn || upazClean === DEFAULT_PILOT_AREA.upazilaEn;

    if (isDistValid && isUpazValid) {
      return { isValid: true, message: '' };
    }

    return {
      isValid: false,
      message: `পাইলট মোড সক্রিয় রয়েছে। বর্তমানে সকল কার্যক্রম কেবল '${DEFAULT_PILOT_AREA.upazilaBn}, ${DEFAULT_PILOT_AREA.districtBn}' এলাকায় সীমাবদ্ধ।`
    };
  };

  const filterByPilotMode = <T extends { district?: string; upazila?: string; coverageDistrict?: string; coverageUpazila?: string; currentDistrict?: string; currentUpazila?: string }>(items: T[]): T[] => {
    if (!isPilotMode) return items;
    return items.filter((item) => {
      const dist = item.district || item.coverageDistrict || item.currentDistrict;
      const upaz = item.upazila || item.coverageUpazila || item.currentUpazila;
      if (!dist && !upaz) return true; // Keep general platform records
      const distMatch = !dist || dist === DEFAULT_PILOT_AREA.districtBn || dist === DEFAULT_PILOT_AREA.districtEn;
      const upazMatch = !upaz || upaz === DEFAULT_PILOT_AREA.upazilaBn || upaz === DEFAULT_PILOT_AREA.upazilaEn;
      return distMatch && upazMatch;
    });
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        isPilotMode,
        setPilotMode,
        togglePilotMode,
        pilotArea: DEFAULT_PILOT_AREA,
        validatePilotLocation,
        filterByPilotMode
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};
