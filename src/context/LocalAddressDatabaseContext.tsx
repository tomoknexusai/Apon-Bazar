/**
 * Level 2 Local Service Address Database Management Context
 * Project: Apon Somaj / Apon Bazar
 * 
 * Provides centralized reactive state and indexing for:
 * - Union / Paurashava Management
 * - Ward Management
 * - Local Places Database (Market, Village, Shopping Mall, Local Shop, Landmark, Other)
 * - Live Debounced Search Suggestions strictly filtered by parent hierarchy
 * - Duplicate Prevention Enforcement
 * - Persistence in localStorage and sync capabilities
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UnionRecord,
  WardRecord,
  LocalPlaceRecord,
  PlaceType,
  RecordStatus,
  LocalAddressSuggestion,
  LocalAddressDBExport
} from '../types/local-address';
import {
  getInitialSeedDatabase,
  generateDivisionId,
  generateDistrictId,
  generateUpazilaId,
  generateUnionId,
  generateWardId,
  generatePlaceId,
  createStandardWardsForUnion,
  checkDuplicateUnion,
  checkDuplicateWard,
  checkDuplicatePlace,
  LocalAddressIndexEngine,
  exportLocalDatabaseToJSON,
  exportLocalPlacesToCSV,
  parseAndValidateImportJSON
} from '../services/LocalAddressDatabaseService';
import { getUnionsList } from '../lib/bd-locations';

const STORAGE_KEY = 'apon_somaj_local_address_db_v3';

export interface LocalAddressDatabaseStats {
  totalUnions: number;
  activeUnions: number;
  totalWards: number;
  activeWards: number;
  totalPlaces: number;
  activePlaces: number;
  marketsCount: number;
  bazarsCount: number;
  villagesCount: number;
  shoppingMallsCount: number;
  localShopsCount: number;
  groceriesCount?: number;
  landmarksCount: number;
  otherCount: number;
}

interface LocalAddressDatabaseContextType {
  unions: UnionRecord[];
  wards: WardRecord[];
  places: LocalPlaceRecord[];
  stats: LocalAddressDatabaseStats;
  isLoading: boolean;

  // Union Operations
  addUnion: (data: {
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    unionNameEn?: string;
    officialName?: string;
    unionCode: string;
    postalCode?: string;
    status: RecordStatus;
    isMunicipality?: boolean;
    autoCreateWards?: boolean;
  }) => { success: boolean; message: string; record?: UnionRecord };

  updateUnion: (
    id: string,
    data: {
      divisionName: string;
      districtName: string;
      upazilaName: string;
      unionName: string;
      unionNameEn?: string;
      officialName?: string;
      unionCode: string;
      postalCode?: string;
      status: RecordStatus;
      isMunicipality?: boolean;
    }
  ) => { success: boolean; message: string; record?: UnionRecord };

  toggleUnionStatus: (id: string) => { success: boolean; message: string; newStatus: RecordStatus };
  deleteUnion: (id: string) => { success: boolean; message: string };

  // Ward Operations
  addWard: (data: {
    unionId: string;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    wardNumber: string;
    wardName: string;
    wardNameEn?: string;
    status: RecordStatus;
  }) => { success: boolean; message: string; record?: WardRecord };

  updateWard: (
    id: string,
    data: {
      wardNumber: string;
      wardName: string;
      wardNameEn?: string;
      status: RecordStatus;
    }
  ) => { success: boolean; message: string; record?: WardRecord };

  toggleWardStatus: (id: string) => { success: boolean; message: string; newStatus: RecordStatus };
  deleteWard: (id: string) => { success: boolean; message: string };

  // Place Operations
  addPlace: (data: {
    placeName: string;
    placeNameEn?: string;
    placeType: PlaceType;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    wardName?: string;
    villageArea?: string;
    postCode?: string;
    shopType?: string;
    status: RecordStatus;
    unionId?: string;
    wardId?: string;
  }) => { success: boolean; message: string; record?: LocalPlaceRecord };

  updatePlace: (
    id: string,
    data: {
      placeName: string;
      placeNameEn?: string;
      placeType: PlaceType;
      wardName?: string;
      villageArea?: string;
      postCode?: string;
      shopType?: string;
      status: RecordStatus;
      wardId?: string;
    }
  ) => { success: boolean; message: string; record?: LocalPlaceRecord };

  togglePlaceStatus: (id: string) => { success: boolean; message: string; newStatus: RecordStatus };
  deletePlace: (id: string) => { success: boolean; message: string };

  // Query & Live Search
  ensureUnionsForUpazila: (divisionName: string, districtName: string, upazilaName: string) => UnionRecord[];
  getUnionsForUpazila: (upazilaName: string, activeOnly?: boolean) => UnionRecord[];
  getWardsForUnion: (unionIdOrName: string, upazilaName?: string, activeOnly?: boolean) => WardRecord[];
  getPlacesForUnion: (
    unionIdOrName: string,
    upazilaName?: string,
    wardIdOrNumber?: string,
    placeType?: PlaceType,
    activeOnly?: boolean
  ) => LocalPlaceRecord[];
  searchLiveSuggestions: (
    query: string,
    scope: {
      divisionName?: string;
      districtName?: string;
      upazilaName?: string;
      unionName?: string;
      unionId?: string;
      wardId?: string;
      placeType?: PlaceType;
    },
    limit?: number
  ) => LocalAddressSuggestion[];

  // Import / Export
  exportDatabase: (format: 'json' | 'csv') => string;
  importDatabase: (rawJson: string) => { success: boolean; count: number; message: string; errors: string[] };
  resetToDefaultDatabase: () => void;
}

const LocalAddressDatabaseContext = createContext<LocalAddressDatabaseContextType | undefined>(undefined);

export const LocalAddressDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unions, setUnions] = useState<UnionRecord[]>([]);
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [places, setPlaces] = useState<LocalPlaceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage or seed
  useEffect(() => {
    const initial = getInitialSeedDatabase();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.unions) && parsed.unions.length > 0) {
          // Merge newly introduced seed unions if not yet present
          const existingUnionKeys = new Set(
            parsed.unions.map((u: UnionRecord) => `${u.upazilaName.trim()}_${u.unionName.trim()}`)
          );
          const missingUnions = initial.unions.filter(
            (iu) => !existingUnionKeys.has(`${iu.upazilaName.trim()}_${iu.unionName.trim()}`)
          );
          const mergedUnions = [...parsed.unions, ...missingUnions];

          const existingWardIds = new Set((parsed.wards || []).map((w: WardRecord) => w.id));
          const missingWards = initial.wards.filter((iw) => !existingWardIds.has(iw.id));
          const mergedWards = [...(parsed.wards || []), ...missingWards];

          const existingPlaceIds = new Set((parsed.places || []).map((p: LocalPlaceRecord) => p.id));
          const missingPlaces = initial.places.filter((ip) => !existingPlaceIds.has(ip.id));
          const mergedPlaces = [...(parsed.places || []), ...missingPlaces];

          setUnions(mergedUnions);
          setWards(mergedWards);
          setPlaces(mergedPlaces);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('[LocalAddressDB] Failed to parse stored DB, seeding defaults', e);
    }

    // Seed defaults
    setUnions(initial.unions);
    setWards(initial.wards);
    setPlaces(initial.places);
    setIsLoading(false);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (isLoading) return;
    try {
      const payload: LocalAddressDBExport = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        companyName: 'Apon Somaj / Apon Bazar',
        unions,
        wards,
        places
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('[LocalAddressDB] Failed to save DB to storage', e);
    }
  }, [unions, wards, places, isLoading]);

  // Maintain in-memory fast indexing engine
  const indexEngine = useMemo(() => {
    return new LocalAddressIndexEngine(unions, wards, places);
  }, [unions, wards, places]);

  // Real-time Database Statistics
  const stats: LocalAddressDatabaseStats = useMemo(() => {
    let marketsCount = 0;
    let bazarsCount = 0;
    let villagesCount = 0;
    let shoppingMallsCount = 0;
    let localShopsCount = 0;
    let groceriesCount = 0;
    let landmarksCount = 0;
    let otherCount = 0;
    let activePlaces = 0;

    for (const p of places) {
      if (p.status === 'active') activePlaces++;
      if (p.placeType === 'market') marketsCount++;
      else if (p.placeType === 'bazar') bazarsCount++;
      else if (p.placeType === 'village') villagesCount++;
      else if (p.placeType === 'shopping_mall') shoppingMallsCount++;
      else if (p.placeType === 'local_shop') localShopsCount++;
      else if (p.placeType === 'grocery') groceriesCount++;
      else if (p.placeType === 'landmark') landmarksCount++;
      else otherCount++;
    }

    return {
      totalUnions: unions.length,
      activeUnions: unions.filter((u) => u.status === 'active').length,
      totalWards: wards.length,
      activeWards: wards.filter((w) => w.status === 'active').length,
      totalPlaces: places.length,
      activePlaces,
      marketsCount,
      bazarsCount,
      villagesCount,
      shoppingMallsCount,
      localShopsCount,
      groceriesCount,
      landmarksCount,
      otherCount
    };
  }, [unions, wards, places]);

  // ---------------------------------------------------------------------------
  // Union Operations
  // ---------------------------------------------------------------------------
  const addUnion = useCallback((data: {
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    unionNameEn?: string;
    officialName?: string;
    unionCode: string;
    postalCode?: string;
    status: RecordStatus;
    isMunicipality?: boolean;
    autoCreateWards?: boolean;
  }) => {
    // 1. Validation
    if (!data.unionName.trim()) {
      return { success: false, message: 'ইউনিয়নের নাম আবশ্যক।' };
    }
    if (!data.upazilaName.trim()) {
      return { success: false, message: 'উপজেলা/থানা নির্বাচন করুন।' };
    }

    // 2. Duplicate Prevention under same Upazila
    const dupCheck = checkDuplicateUnion(unions, data.upazilaName, data.unionName);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: 'This name already exists in this location.'
      };
    }

    const divisionId = generateDivisionId(data.divisionName);
    const districtId = generateDistrictId(data.districtName);
    const upazilaId = generateUpazilaId(data.upazilaName);
    const unionId = generateUnionId(upazilaId, data.unionName, data.unionCode);
    const now = new Date().toISOString();

    const isMuni = !!data.isMunicipality || data.unionName.includes('পৌরসভা');
    const newUnion: UnionRecord = {
      id: unionId,
      union_id: unionId,
      divisionId,
      division_id: divisionId,
      districtId,
      district_id: districtId,
      upazilaId,
      upazila_id: upazilaId,
      divisionName: data.divisionName.trim(),
      districtName: data.districtName.trim(),
      upazilaName: data.upazilaName.trim(),
      unionName: data.unionName.trim(),
      union_name_bn: data.unionName.trim(),
      unionNameEn: data.unionNameEn?.trim() || data.unionName.trim(),
      union_name_en: data.unionNameEn?.trim() || data.unionName.trim(),
      officialName: data.officialName?.trim() || (isMuni ? data.unionName.trim() : `${data.unionName.trim()} ইউনিয়ন পরিষদ`),
      official_name: data.officialName?.trim() || (isMuni ? data.unionName.trim() : `${data.unionName.trim()} ইউনিয়ন পরিষদ`),
      unionCode: (data.unionCode && data.unionCode.trim()) || `UN-${Math.floor(1000 + Math.random() * 9000)}`,
      postalCode: data.postalCode?.trim() || '১২০০',
      status: data.status,
      isMunicipality: isMuni,
      createdAt: now,
      updatedAt: now
    };

    setUnions((prev) => [newUnion, ...prev]);

    // Optional: Auto create 9 standard wards for standard administrative convenience
    if (data.autoCreateWards !== false) {
      const generatedWards = createStandardWardsForUnion(
        unionId,
        divisionId,
        districtId,
        upazilaId,
        newUnion.divisionName,
        newUnion.districtName,
        newUnion.upazilaName,
        newUnion.unionName
      );
      setWards((prev) => [...generatedWards, ...prev]);
    }

    return {
      success: true,
      message: 'New Union added successfully.',
      record: newUnion
    };
  }, [unions]);

  const updateUnion = useCallback((
    id: string,
    data: {
      divisionName: string;
      districtName: string;
      upazilaName: string;
      unionName: string;
      unionNameEn?: string;
      unionCode: string;
      postalCode?: string;
      status: RecordStatus;
      officialName?: string;
      isMunicipality?: boolean;
    }
  ) => {
    if (!data.unionName.trim()) {
      return { success: false, message: 'ইউনিয়নের নাম আবশ্যক।' };
    }

    // Duplicate Prevention under same Upazila (excluding self)
    const dupCheck = checkDuplicateUnion(unions, data.upazilaName, data.unionName, id);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: 'This name already exists in this location.'
      };
    }

    const now = new Date().toISOString();
    let updatedRecord: UnionRecord | undefined;
    const isMuni = data.isMunicipality !== undefined ? data.isMunicipality : data.unionName.includes('পৌরসভা');

    setUnions((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          updatedRecord = {
            ...u,
            divisionName: data.divisionName.trim(),
            districtName: data.districtName.trim(),
            upazilaName: data.upazilaName.trim(),
            unionName: data.unionName.trim(),
            union_name_bn: data.unionName.trim(),
            unionNameEn: data.unionNameEn?.trim() || data.unionName.trim(),
            union_name_en: data.unionNameEn?.trim() || data.unionName.trim(),
            officialName: data.officialName?.trim() || u.officialName || (isMuni ? data.unionName.trim() : `${data.unionName.trim()} ইউনিয়ন পরিষদ`),
            official_name: data.officialName?.trim() || u.officialName || (isMuni ? data.unionName.trim() : `${data.unionName.trim()} ইউনিয়ন পরিষদ`),
            unionCode: data.unionCode.trim() || u.unionCode,
            postalCode: data.postalCode?.trim() || u.postalCode,
            status: data.status,
            isMunicipality: isMuni,
            updatedAt: now
          };
          return updatedRecord;
        }
        return u;
      })
    );

    // Also update denormalized names in associated wards & places
    setWards((prev) =>
      prev.map((w) =>
        w.unionId === id
          ? {
              ...w,
              unionName: data.unionName.trim(),
              upazilaName: data.upazilaName.trim(),
              districtName: data.districtName.trim(),
              divisionName: data.divisionName.trim(),
              updatedAt: now
            }
          : w
      )
    );

    setPlaces((prev) =>
      prev.map((p) =>
        p.unionId === id
          ? {
              ...p,
              unionName: data.unionName.trim(),
              upazilaName: data.upazilaName.trim(),
              districtName: data.districtName.trim(),
              divisionName: data.divisionName.trim(),
              updatedAt: now
            }
          : p
      )
    );

    return {
      success: true,
      message: `'${data.unionName}' ইউনিয়ন সফলভাবে আপডেট করা হয়েছে।`,
      record: updatedRecord
    };
  }, [unions]);

  const toggleUnionStatus = useCallback((id: string) => {
    const target = unions.find((u) => u.id === id);
    if (!target) return { success: false, message: 'রেকর্ড পাওয়া যায়নি।', newStatus: 'inactive' as RecordStatus };

    const newStatus: RecordStatus = target.status === 'active' ? 'inactive' : 'active';
    const now = new Date().toISOString();

    setUnions((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: newStatus, updatedAt: now } : u))
    );

    return {
      success: true,
      message: `${target.unionName} স্ট্যাটাস পরিবর্তিত হয়ে '${newStatus === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}' হয়েছে।`,
      newStatus
    };
  }, [unions]);

  const deleteUnion = useCallback((id: string) => {
    const target = unions.find((u) => u.id === id);
    if (!target) return { success: false, message: 'রেকর্ড পাওয়া যায়নি।' };

    setUnions((prev) => prev.filter((u) => u.id !== id));
    setWards((prev) => prev.filter((w) => w.unionId !== id));
    setPlaces((prev) => prev.filter((p) => p.unionId !== id));

    return {
      success: true,
      message: `'${target.unionName}' ইউনিয়ন ও সংশ্লিষ্ট ওয়ার্ড/স্থান ডাটাবেজ থেকে সফলভাবে মুছে ফেলা হয়েছে।`
    };
  }, [unions]);

  // ---------------------------------------------------------------------------
  // Ward Operations
  // ---------------------------------------------------------------------------
  const addWard = useCallback((data: {
    unionId: string;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    wardNumber: string;
    wardName: string;
    wardNameEn?: string;
    status: RecordStatus;
  }) => {
    if (!data.wardNumber.trim()) {
      return { success: false, message: 'ওয়ার্ড নম্বর আবশ্যক (যেমন: ০১, 01)।' };
    }
    if (!data.unionId) {
      return { success: false, message: 'প্যারেন্ট ইউনিয়ন নির্বাচন আবশ্যক।' };
    }

    // Duplicate Prevention under same Union
    const dupCheck = checkDuplicateWard(wards, data.unionId, data.wardNumber, data.wardName);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: 'This name already exists in this location.'
      };
    }

    const divisionId = generateDivisionId(data.divisionName);
    const districtId = generateDistrictId(data.districtName);
    const upazilaId = generateUpazilaId(data.upazilaName);
    const wardId = generateWardId(data.unionId, data.wardNumber);
    const now = new Date().toISOString();

    const newWard: WardRecord = {
      id: wardId,
      unionId: data.unionId,
      upazilaId,
      districtId,
      divisionId,
      divisionName: data.divisionName.trim(),
      districtName: data.districtName.trim(),
      upazilaName: data.upazilaName.trim(),
      unionName: data.unionName.trim(),
      wardNumber: data.wardNumber.trim(),
      wardName: (data.wardName && data.wardName.trim()) || `ওয়ার্ড ${data.wardNumber.trim()}`,
      wardNameEn: data.wardNameEn?.trim() || `Ward ${data.wardNumber.trim()}`,
      status: data.status,
      createdAt: now,
      updatedAt: now
    };

    setWards((prev) => [newWard, ...prev]);

    return {
      success: true,
      message: 'New Ward added successfully.',
      record: newWard
    };
  }, [wards]);

  const updateWard = useCallback((
    id: string,
    data: {
      wardNumber: string;
      wardName: string;
      wardNameEn?: string;
      status: RecordStatus;
    }
  ) => {
    const existing = wards.find((w) => w.id === id);
    if (!existing) return { success: false, message: 'ওয়ার্ড রেকর্ড পাওয়া যায়নি।' };

    // Duplicate check excluding self
    const dupCheck = checkDuplicateWard(wards, existing.unionId, data.wardNumber, data.wardName, id);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: 'This name already exists in this location.'
      };
    }

    const now = new Date().toISOString();
    let updatedRecord: WardRecord | undefined;

    setWards((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          updatedRecord = {
            ...w,
            wardNumber: data.wardNumber.trim(),
            wardName: data.wardName.trim() || `ওয়ার্ড ${data.wardNumber.trim()}`,
            wardNameEn: data.wardNameEn?.trim() || `Ward ${data.wardNumber.trim()}`,
            status: data.status,
            updatedAt: now
          };
          return updatedRecord;
        }
        return w;
      })
    );

    return {
      success: true,
      message: `'${data.wardName}' সফলভাবে আপডেট করা হয়েছে।`,
      record: updatedRecord
    };
  }, [wards]);

  const toggleWardStatus = useCallback((id: string) => {
    const target = wards.find((w) => w.id === id);
    if (!target) return { success: false, message: 'ওয়ার্ড পাওয়া যায়নি।', newStatus: 'inactive' as RecordStatus };

    const newStatus: RecordStatus = target.status === 'active' ? 'inactive' : 'active';
    const now = new Date().toISOString();

    setWards((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus, updatedAt: now } : w))
    );

    return {
      success: true,
      message: `${target.wardName} স্ট্যাটাস '${newStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}' করা হয়েছে।`,
      newStatus
    };
  }, [wards]);

  const deleteWard = useCallback((id: string) => {
    const target = wards.find((w) => w.id === id);
    if (!target) return { success: false, message: 'ওয়ার্ড পাওয়া যায়নি।' };

    setWards((prev) => prev.filter((w) => w.id !== id));
    return {
      success: true,
      message: `'${target.wardName}' ওয়ার্ড তালিকা থেকে মুছে ফেলা হয়েছে।`
    };
  }, [wards]);

  // ---------------------------------------------------------------------------
  // Place Operations (Market, Village, Mall, Shop, Landmark, Other)
  // ---------------------------------------------------------------------------
  const addPlace = useCallback((data: {
    placeName: string;
    placeNameEn?: string;
    placeType: PlaceType;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    wardName?: string;
    villageArea?: string;
    postCode?: string;
    shopType?: string;
    status: RecordStatus;
    unionId?: string;
    wardId?: string;
  }) => {
    if (!data.placeName.trim()) {
      return { success: false, message: 'স্থানের নাম আবশ্যক।' };
    }
    if (!data.unionName.trim()) {
      return { success: false, message: 'প্যারেন্ট ইউনিয়ন নির্বাচন আবশ্যক।' };
    }

    // Resolve unionId if not passed
    let resolvedUnionId = data.unionId;
    if (!resolvedUnionId) {
      const matchUnion = unions.find(
        (u) =>
          u.unionName === data.unionName &&
          u.upazilaName === data.upazilaName
      );
      resolvedUnionId = matchUnion ? matchUnion.id : generateUnionId(generateUpazilaId(data.upazilaName), data.unionName);
    }

    // Duplicate check under same union
    const dupCheck = checkDuplicatePlace(
      places,
      resolvedUnionId,
      data.placeName,
      data.placeType,
      data.wardId
    );
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: `This ${dupCheck.entityLabel || 'Place'} already exists in this location.`
      };
    }

    const divisionId = generateDivisionId(data.divisionName);
    const districtId = generateDistrictId(data.districtName);
    const upazilaId = generateUpazilaId(data.upazilaName);
    const placeId = generatePlaceId(resolvedUnionId, data.placeType, data.placeName);
    const now = new Date().toISOString();

    const newPlace: LocalPlaceRecord = {
      id: placeId,
      placeName: data.placeName.trim(),
      placeNameEn: data.placeNameEn?.trim() || data.placeName.trim(),
      placeType: data.placeType,
      divisionId,
      districtId,
      upazilaId,
      unionId: resolvedUnionId,
      wardId: data.wardId || undefined,
      divisionName: data.divisionName.trim(),
      districtName: data.districtName.trim(),
      upazilaName: data.upazilaName.trim(),
      unionName: data.unionName.trim(),
      wardName: data.wardName?.trim() || undefined,
      villageArea: data.villageArea?.trim() || undefined,
      postCode: data.postCode?.trim() || undefined,
      shopType: data.shopType?.trim() || undefined,
      status: data.status,
      createdAt: now,
      updatedAt: now
    };

    setPlaces((prev) => [newPlace, ...prev]);

    let successMsg = 'New Place added successfully.';
    if (data.placeType === 'village') successMsg = 'New Village added successfully.';
    else if (data.placeType === 'area') successMsg = 'New Area added successfully.';
    else if (data.placeType === 'bazar') successMsg = 'New Bazar added successfully.';
    else if (data.placeType === 'market') successMsg = 'New Market added successfully.';
    else if (data.placeType === 'shopping_mall') successMsg = 'New Shopping Mall added successfully.';
    else if (data.placeType === 'local_shop') successMsg = 'New Local Shop added successfully.';
    else if (data.placeType === 'grocery') successMsg = 'New Grocery added successfully.';
    else if (data.placeType === 'landmark') successMsg = 'New Landmark added successfully.';
    else if (data.placeType === 'post_office') successMsg = 'New Post Office added successfully.';

    return {
      success: true,
      message: successMsg,
      record: newPlace
    };
  }, [places, unions]);

  const updatePlace = useCallback((
    id: string,
    data: {
      placeName: string;
      placeNameEn?: string;
      placeType: PlaceType;
      wardName?: string;
      villageArea?: string;
      postCode?: string;
      shopType?: string;
      status: RecordStatus;
      wardId?: string;
    }
  ) => {
    const existing = places.find((p) => p.id === id);
    if (!existing) return { success: false, message: 'রেকর্ড পাওয়া যায়নি।' };

    // Duplicate check excluding self
    const dupCheck = checkDuplicatePlace(
      places,
      existing.unionId,
      data.placeName,
      data.placeType,
      data.wardId,
      id
    );
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        message: `This ${dupCheck.entityLabel || 'Place'} already exists in this location.`
      };
    }

    const now = new Date().toISOString();
    let updatedRecord: LocalPlaceRecord | undefined;

    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          updatedRecord = {
            ...p,
            placeName: data.placeName.trim(),
            placeNameEn: data.placeNameEn?.trim() || data.placeName.trim(),
            placeType: data.placeType,
            wardId: data.wardId || undefined,
            wardName: data.wardName?.trim() || undefined,
            villageArea: data.villageArea?.trim() || undefined,
            postCode: data.postCode?.trim() || undefined,
            shopType: data.shopType?.trim() || undefined,
            status: data.status,
            updatedAt: now
          };
          return updatedRecord;
        }
        return p;
      })
    );

    return {
      success: true,
      message: `'${data.placeName}' তথ্য সফলভাবে আপডেট হয়েছে।`,
      record: updatedRecord
    };
  }, [places]);

  const togglePlaceStatus = useCallback((id: string) => {
    const target = places.find((p) => p.id === id);
    if (!target) return { success: false, message: 'রেকর্ড পাওয়া যায়নি।', newStatus: 'inactive' as RecordStatus };

    const newStatus: RecordStatus = target.status === 'active' ? 'inactive' : 'active';
    const now = new Date().toISOString();

    setPlaces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, updatedAt: now } : p))
    );

    return {
      success: true,
      message: `'${target.placeName}' স্ট্যাটাস '${newStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}' করা হয়েছে।`,
      newStatus
    };
  }, [places]);

  const deletePlace = useCallback((id: string) => {
    const target = places.find((p) => p.id === id);
    if (!target) return { success: false, message: 'রেকর্ড পাওয়া যায়নি।' };

    setPlaces((prev) => prev.filter((p) => p.id !== id));
    return {
      success: true,
      message: `'${target.placeName}' সফলভাবে মুছে ফেলা হয়েছে।`
    };
  }, [places]);

  // ---------------------------------------------------------------------------
  // Cascading & Live Search Helpers
  // ---------------------------------------------------------------------------
  const ensureUnionsForUpazila = useCallback(
    (divisionName: string, districtName: string, upazilaName: string): UnionRecord[] => {
      if (!divisionName || !districtName || !upazilaName) return [];
      const existing = unions.filter(
        (u) =>
          u.divisionName.trim().toLowerCase() === divisionName.trim().toLowerCase() &&
          u.districtName.trim().toLowerCase() === districtName.trim().toLowerCase() &&
          u.upazilaName.trim().toLowerCase() === upazilaName.trim().toLowerCase()
      );
      if (existing.length > 0) return existing;

      // Fetch official unions for this upazila from Bangladesh administrative database
      const officialList = getUnionsList(divisionName, districtName, upazilaName);
      if (officialList.length === 0) return [];

      const now = new Date().toISOString();
      const divId = generateDivisionId(divisionName);
      const distId = generateDistrictId(districtName);
      const upzId = generateUpazilaId(upazilaName);

      const newUnions: UnionRecord[] = [];
      const newWards: WardRecord[] = [];

      officialList.forEach((ou, idx) => {
        const uCode = (ou as unknown as { code?: string }).code || (ou.postalCode ? `UN-${ou.postalCode}-${idx + 1}` : `UN-${idx + 1}`);
        const uId = generateUnionId(upzId, ou.nameBn, uCode);
        const isMuni = ou.nameBn.includes('পৌরসভা') || ou.nameBn.includes('সিটি কর্পোরেশন');
        const uRec: UnionRecord = {
          id: uId,
          union_id: uId,
          divisionId: divId,
          division_id: divId,
          districtId: distId,
          district_id: distId,
          upazilaId: upzId,
          upazila_id: upzId,
          divisionName,
          districtName,
          upazilaName,
          unionName: ou.nameBn,
          union_name_bn: ou.nameBn,
          unionNameEn: ou.nameEn,
          union_name_en: ou.nameEn,
          officialName: isMuni ? ou.nameBn : `${ou.nameBn} ইউনিয়ন পরিষদ`,
          official_name: isMuni ? ou.nameBn : `${ou.nameBn} ইউনিয়ন পরিষদ`,
          unionCode: uCode,
          status: 'active',
          isMunicipality: isMuni,
          createdAt: now,
          updatedAt: now
        };
        newUnions.push(uRec);

        const wardsForUnion = createStandardWardsForUnion(
          uId,
          divId,
          distId,
          upzId,
          divisionName,
          districtName,
          upazilaName,
          ou.nameBn
        );
        newWards.push(...wardsForUnion);
      });

      setUnions((prev) => [...prev, ...newUnions]);
      setWards((prev) => [...prev, ...newWards]);

      return newUnions;
    },
    [unions]
  );

  const getUnionsForUpazila = useCallback((upazilaName: string, activeOnly = true) => {
    if (!upazilaName) return [];
    return unions.filter(
      (u) =>
        u.upazilaName.trim().toLowerCase() === upazilaName.trim().toLowerCase() &&
        (!activeOnly || u.status === 'active')
    );
  }, [unions]);

  const getWardsForUnion = useCallback((unionIdOrName: string, upazilaName?: string, activeOnly = true) => {
    if (!unionIdOrName) return [];

    let targetUnionId = unionIdOrName;
    if (!unionIdOrName.startsWith('un_')) {
      const match = unions.find(
        (u) =>
          u.unionName.trim().toLowerCase() === unionIdOrName.trim().toLowerCase() &&
          (!upazilaName || u.upazilaName.trim().toLowerCase() === upazilaName.trim().toLowerCase())
      );
      if (match) targetUnionId = match.id;
    }

    return indexEngine.getWards(targetUnionId, activeOnly);
  }, [unions, indexEngine]);

  const getPlacesForUnion = useCallback((
    unionIdOrName: string,
    upazilaName?: string,
    wardIdOrNumber?: string,
    placeType?: PlaceType,
    activeOnly = true
  ) => {
    if (!unionIdOrName) return [];

    let targetUnionId = unionIdOrName;
    if (!unionIdOrName.startsWith('un_')) {
      const match = unions.find(
        (u) =>
          u.unionName.trim().toLowerCase() === unionIdOrName.trim().toLowerCase() &&
          (!upazilaName || u.upazilaName.trim().toLowerCase() === upazilaName.trim().toLowerCase())
      );
      if (match) targetUnionId = match.id;
    }

    return indexEngine.getPlaces(targetUnionId, wardIdOrNumber, placeType, activeOnly);
  }, [unions, indexEngine]);

  const searchLiveSuggestions = useCallback((
    query: string,
    scope: {
      divisionName?: string;
      districtName?: string;
      upazilaName?: string;
      unionName?: string;
      unionId?: string;
      wardId?: string;
      placeType?: PlaceType;
    },
    limit = 10
  ) => {
    return indexEngine.searchLiveSuggestions(query, scope, limit);
  }, [indexEngine]);

  // ---------------------------------------------------------------------------
  // Import & Export
  // ---------------------------------------------------------------------------
  const exportDatabase = useCallback((format: 'json' | 'csv') => {
    if (format === 'csv') {
      return exportLocalPlacesToCSV(places);
    }
    return exportLocalDatabaseToJSON(unions, wards, places);
  }, [unions, wards, places]);

  const importDatabase = useCallback((rawJson: string) => {
    const res = parseAndValidateImportJSON(rawJson);
    if (!res.success) {
      return { success: false, count: 0, message: res.error || 'ভুল JSON ফরম্যাট।', errors: [res.error || 'Parsing error'] };
    }

    let importedUnions = 0;
    let importedWards = 0;
    let importedPlaces = 0;

    // Merge unions avoiding duplicate names in same upazila
    setUnions((prev) => {
      const merged = [...prev];
      for (const u of res.unions) {
        const dup = checkDuplicateUnion(merged, u.upazilaName, u.unionName);
        if (!dup.isDuplicate) {
          merged.push(u);
          importedUnions++;
        }
      }
      return merged;
    });

    // Merge wards avoiding duplicate numbers in same union
    setWards((prev) => {
      const merged = [...prev];
      for (const w of res.wards) {
        const dup = checkDuplicateWard(merged, w.unionId, w.wardNumber, w.wardName);
        if (!dup.isDuplicate) {
          merged.push(w);
          importedWards++;
        }
      }
      return merged;
    });

    // Merge places avoiding duplicates in same union
    setPlaces((prev) => {
      const merged = [...prev];
      for (const p of res.places) {
        const dup = checkDuplicatePlace(merged, p.unionId, p.placeName, p.placeType, p.wardId);
        if (!dup.isDuplicate) {
          merged.push(p);
          importedPlaces++;
        }
      }
      return merged;
    });

    const totalImported = importedUnions + importedWards + importedPlaces;
    return {
      success: true,
      count: totalImported,
      message: `ইমপোর্ট সম্পন্ন: ${importedUnions} ইউনিয়ন, ${importedWards} ওয়ার্ড ও ${importedPlaces} টি লোকাল স্থান যুক্ত হয়েছে।`,
      errors: []
    };
  }, []);

  const resetToDefaultDatabase = useCallback(() => {
    const initial = getInitialSeedDatabase();
    setUnions(initial.unions);
    setWards(initial.wards);
    setPlaces(initial.places);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const contextValue = useMemo(() => ({
    unions,
    wards,
    places,
    stats,
    isLoading,
    addUnion,
    updateUnion,
    toggleUnionStatus,
    deleteUnion,
    addWard,
    updateWard,
    toggleWardStatus,
    deleteWard,
    addPlace,
    updatePlace,
    togglePlaceStatus,
    deletePlace,
    ensureUnionsForUpazila,
    getUnionsForUpazila,
    getWardsForUnion,
    getPlacesForUnion,
    searchLiveSuggestions,
    exportDatabase,
    importDatabase,
    resetToDefaultDatabase
  }), [
    unions,
    wards,
    places,
    stats,
    isLoading,
    addUnion,
    updateUnion,
    toggleUnionStatus,
    deleteUnion,
    addWard,
    updateWard,
    toggleWardStatus,
    deleteWard,
    addPlace,
    updatePlace,
    togglePlaceStatus,
    deletePlace,
    ensureUnionsForUpazila,
    getUnionsForUpazila,
    getWardsForUnion,
    getPlacesForUnion,
    searchLiveSuggestions,
    exportDatabase,
    importDatabase,
    resetToDefaultDatabase
  ]);

  return (
    <LocalAddressDatabaseContext.Provider value={contextValue}>
      {children}
    </LocalAddressDatabaseContext.Provider>
  );
};

export const useLocalAddressDatabase = (): LocalAddressDatabaseContextType => {
  const context = useContext(LocalAddressDatabaseContext);
  if (!context) {
    throw new Error('useLocalAddressDatabase must be used within a LocalAddressDatabaseProvider');
  }
  return context;
};
