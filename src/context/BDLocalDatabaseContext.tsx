/**
 * Admin Local Address & Service Database State Management Context
 * Supports Admin CRUD (Add/Edit/Delete) for local service entities:
 * - Markets / Bazars
 * - Villages / Areas
 * - Shopping Malls
 * - Grocery / Local Shops
 * - Landmarks
 * - Post Offices
 *
 * Stored entries automatically merge with base BD administrative data
 * and become instantly searchable across all users in the same Union.
 *
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MarketItem, MarketType, MarketAuditLog } from '../types';
import {
  BDWard,
  getWardsList,
  getVillagesList,
  getMarketsList,
  getShoppingMallsList,
  getLocalShopsList,
  getLandmarksList,
  getPostOfficesList
} from '../lib/bd-locations';

export type LocalCategory = 'ward' | 'village' | 'market' | 'shoppingMall' | 'localShop' | 'landmark' | 'postOffice';

export interface LocalEntry {
  id: string;
  category: LocalCategory;
  nameBn: string;
  nameEn: string;
  createdAt: string;
}

export interface UnionLocalServiceRecord {
  unionKey: string; // "Division|District|Upazila|Union"
  entries: LocalEntry[];
}

export interface MergedWardItem {
  id?: string;
  wardNoBn: string;
  wardNoEn: string;
  isCustom?: boolean;
}

export interface MarketSearchFilters {
  division?: string;
  district?: string;
  upazila?: string;
  unionName?: string;
  ward?: string;
  marketType?: string;
  status?: string;
}

interface BDLocalDatabaseContextType {
  customRecords: Record<string, LocalEntry[]>;
  deletedDefaultWards: Record<string, string[]>;
  markets: MarketItem[];
  addLocalEntry: (division: string, district: string, upazila: string, union: string, category: LocalCategory, nameBn: string, nameEn: string) => void;
  editLocalEntry: (division: string, district: string, upazila: string, union: string, entryId: string, newNameBn: string, newNameEn: string) => void;
  deleteLocalEntry: (division: string, district: string, upazila: string, union: string, entryId: string) => void;
  deleteDefaultWard: (division: string, district: string, upazila: string, union: string, wardNoBn: string) => void;
  getMergedWards: (division: string, district: string, upazila: string, union: string) => MergedWardItem[];
  getMergedVillages: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getMergedMarkets: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getMergedShoppingMalls: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getMergedLocalShops: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getMergedLandmarks: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getMergedPostOffices: (division: string, district: string, upazila: string, union: string, lang?: 'bn' | 'en') => string[];
  getCustomEntriesForUnion: (division: string, district: string, upazila: string, union: string) => LocalEntry[];

  // Market/Bazar Management API
  addMarket: (market: Omit<MarketItem, 'id' | 'createdAt' | 'updatedAt'>, actorInfo?: { name?: string; role?: string }) => MarketItem;
  editMarket: (id: string, updates: Partial<MarketItem>, actorInfo?: { name?: string; role?: string }) => void;
  deleteMarket: (id: string, actorInfo?: { name?: string; role?: string }) => void;
  getMarketsForWard: (division: string, district: string, upazila: string, union: string, ward: string) => MarketItem[];
  getAllMarkets: () => MarketItem[];
  searchMarkets: (query: string, filters?: MarketSearchFilters) => MarketItem[];
  marketLogs: MarketAuditLog[];
  clearMarketLogs: () => void;
}

const STORAGE_KEY = 'ghorer_bazar_bd_local_db_v2';
const DELETED_WARDS_KEY = 'ghorer_bazar_bd_deleted_wards_v1';
const MARKETS_STORAGE_KEY = 'ghorer_bazar_bd_markets_v2';
const MARKET_LOGS_STORAGE_KEY = 'ghorer_bazar_bd_market_logs_v1';

const generateInitialSeedAuditLogs = (): MarketAuditLog[] => [
  {
    id: 'log_seed_1',
    marketId: 'mkt_seed_1',
    marketNameBn: 'সাহেব বাজার কাঁচাবাজার',
    marketNameEn: 'Saheb Bazar Kitchen Market',
    action: 'ADD',
    actorName: 'অ্যাডমিন ইউজার',
    actorRole: 'admin',
    details: 'নতুন কাঁচাবাজার ডাটাবেজে অন্তর্ভুক্ত করা হয়েছে (ওয়ার্ড ০১)',
    ward: 'ওয়ার্ড ০১',
    unionName: 'সাহেব বাজার',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'log_seed_2',
    marketId: 'mkt_seed_2',
    marketNameBn: 'নিউ মার্কেট শপিং মল',
    marketNameEn: 'New Market Shopping Mall',
    action: 'EDIT',
    actorName: 'অপারেশন পার্টনার',
    actorRole: 'operations_partner',
    details: 'মার্কেটের ধরন ও গুগল ম্যাপস লোকেশন লিংক হালনাগাদ করা হয়েছে',
    ward: 'ওয়ার্ড ০১',
    unionName: 'সাহেব বাজার',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const generateInitialSeedMarkets = (): MarketItem[] => [
  {
    id: 'mkt_seed_1',
    nameBn: 'সাহেব বাজার কাঁচাবাজার',
    nameEn: 'Saheb Bazar Kitchen Market',
    marketType: 'Daily Market',
    division: 'রাজশাহী',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    unionName: 'সাহেব বাজার',
    ward: 'ওয়ার্ড ০১',
    googleMapsUrl: 'https://maps.google.com/?q=24.368,88.601',
    status: 'Active',
    addedByRole: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mkt_seed_2',
    nameBn: 'নিউ মার্কেট শপিং মল',
    nameEn: 'New Market Shopping Mall',
    marketType: 'Shopping Mall',
    division: 'রাজশাহী',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    unionName: 'সাহেব বাজার',
    ward: 'ওয়ার্ড ০১',
    googleMapsUrl: 'https://maps.google.com/?q=24.369,88.602',
    status: 'Active',
    addedByRole: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mkt_seed_3',
    nameBn: 'ধানমন্ডি ১ নম্বর পাইকারী বাজার',
    nameEn: 'Dhanmondi Ward 1 Wholesale Market',
    marketType: 'Wholesale Market',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    unionName: 'ধানমন্ডি আ/এ',
    ward: 'ওয়ার্ড ০১',
    googleMapsUrl: 'https://maps.google.com/?q=23.746,90.375',
    status: 'Active',
    addedByRole: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mkt_seed_4',
    nameBn: 'ধানমন্ডি ওয়ার্ড ১ সুপার শপ',
    nameEn: 'Dhanmondi Ward 1 Super Shop',
    marketType: 'Super Shop',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    unionName: 'ধানমন্ডি আ/এ',
    ward: 'ওয়ার্ড ০১',
    googleMapsUrl: 'https://maps.google.com/?q=23.747,90.376',
    status: 'Active',
    addedByRole: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const BDLocalDatabaseContext = createContext<BDLocalDatabaseContextType | undefined>(undefined);

export const BDLocalDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customRecords, setCustomRecords] = useState<Record<string, LocalEntry[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local address db from localStorage:', e);
    }
    return {};
  });

  const [deletedDefaultWards, setDeletedDefaultWards] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(DELETED_WARDS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse deleted default wards:', e);
    }
    return {};
  });

  const [markets, setMarkets] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem(MARKETS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse markets from localStorage:', e);
    }
    return generateInitialSeedMarkets();
  });

  const [marketLogs, setMarketLogs] = useState<MarketAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(MARKET_LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse market audit logs from localStorage:', e);
    }
    return generateInitialSeedAuditLogs();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customRecords));
    } catch (e) {
      console.error('Failed to save local address db to localStorage:', e);
    }
  }, [customRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(DELETED_WARDS_KEY, JSON.stringify(deletedDefaultWards));
    } catch (e) {
      console.error('Failed to save deleted default wards:', e);
    }
  }, [deletedDefaultWards]);

  useEffect(() => {
    try {
      localStorage.setItem(MARKETS_STORAGE_KEY, JSON.stringify(markets));
    } catch (e) {
      console.error('Failed to save markets to localStorage:', e);
    }
  }, [markets]);

  useEffect(() => {
    try {
      localStorage.setItem(MARKET_LOGS_STORAGE_KEY, JSON.stringify(marketLogs));
    } catch (e) {
      console.error('Failed to save market audit logs to localStorage:', e);
    }
  }, [marketLogs]);

  const makeUnionKey = (division: string, district: string, upazila: string, union: string) =>
    `${division.trim()}|${district.trim()}|${upazila.trim()}|${union.trim()}`;

  const addLocalEntry = (
    division: string,
    district: string,
    upazila: string,
    union: string,
    category: LocalCategory,
    nameBn: string,
    nameEn: string
  ) => {
    if (!nameBn.trim()) return;
    const key = makeUnionKey(division, district, upazila, union);
    const newEntry: LocalEntry = {
      id: `local_ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category,
      nameBn: nameBn.trim(),
      nameEn: (nameEn || nameBn).trim(),
      createdAt: new Date().toISOString()
    };

    setCustomRecords((prev) => {
      const existing = prev[key] || [];
      return {
        ...prev,
        [key]: [...existing, newEntry]
      };
    });
  };

  const editLocalEntry = (
    division: string,
    district: string,
    upazila: string,
    union: string,
    entryId: string,
    newNameBn: string,
    newNameEn: string
  ) => {
    const key = makeUnionKey(division, district, upazila, union);
    setCustomRecords((prev) => {
      const existing = prev[key] || [];
      const updated = existing.map((item) =>
        item.id === entryId
          ? { ...item, nameBn: newNameBn.trim(), nameEn: (newNameEn || newNameBn).trim() }
          : item
      );
      return { ...prev, [key]: updated };
    });
  };

  const deleteLocalEntry = (
    division: string,
    district: string,
    upazila: string,
    union: string,
    entryId: string
  ) => {
    const key = makeUnionKey(division, district, upazila, union);
    setCustomRecords((prev) => {
      const existing = prev[key] || [];
      const updated = existing.filter((item) => item.id !== entryId);
      return { ...prev, [key]: updated };
    });
  };

  const deleteDefaultWard = (
    division: string,
    district: string,
    upazila: string,
    union: string,
    wardNoBn: string
  ) => {
    const key = makeUnionKey(division, district, upazila, union);
    setDeletedDefaultWards((prev) => {
      const existing = prev[key] || [];
      if (!existing.includes(wardNoBn)) {
        return { ...prev, [key]: [...existing, wardNoBn] };
      }
      return prev;
    });
  };

  const getCustomEntriesForUnion = (
    division: string,
    district: string,
    upazila: string,
    union: string
  ): LocalEntry[] => {
    const key = makeUnionKey(division, district, upazila, union);
    return customRecords[key] || [];
  };

  const getMergedWards = (division: string, district: string, upazila: string, union: string): MergedWardItem[] => {
    if (!division || !district || !upazila || !union) return [];
    const key = makeUnionKey(division, district, upazila, union);
    const baseWards = getWardsList(division, district, upazila, union);
    const deletedForUnion = deletedDefaultWards[key] || [];

    const activeBaseWards = baseWards
      .filter((w) => !deletedForUnion.includes(w.wardNoBn) && !deletedForUnion.includes(w.wardNoEn))
      .map((w) => ({ wardNoBn: w.wardNoBn, wardNoEn: w.wardNoEn, id: `def_${w.wardNoBn}`, isCustom: false }));

    const customWardEntries = (customRecords[key] || [])
      .filter((e) => e.category === 'ward')
      .map((e) => ({
        id: e.id,
        wardNoBn: e.nameBn,
        wardNoEn: e.nameEn,
        isCustom: true
      }));

    const map = new Map<string, MergedWardItem>();
    activeBaseWards.forEach((w) => map.set(w.wardNoBn, w));
    customWardEntries.forEach((w) => map.set(w.wardNoBn, w));

    return Array.from(map.values());
  };

  // --- MARKET / BAZAR MANAGEMENT IMPLEMENTATION ---

  const addMarket = (
    marketData: Omit<MarketItem, 'id' | 'createdAt' | 'updatedAt'>,
    actorInfo?: { name?: string; role?: string }
  ): MarketItem => {
    const now = new Date().toISOString();
    const newMarket: MarketItem = {
      ...marketData,
      id: `mkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now
    };

    setMarkets((prev) => [newMarket, ...prev]);

    // Record Audit Log
    const actorName = actorInfo?.name || marketData.addedByUserName || 'System Admin';
    const actorRole = actorInfo?.role || marketData.addedByRole || 'admin';
    const logEntry: MarketAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      marketId: newMarket.id,
      marketNameBn: newMarket.nameBn,
      marketNameEn: newMarket.nameEn,
      action: 'ADD',
      actorName,
      actorRole,
      details: `নতুন মার্কেট যুক্ত করা হয়েছে (${newMarket.marketType}) - ${newMarket.ward || 'N/A'}`,
      ward: newMarket.ward,
      unionName: newMarket.unionName,
      timestamp: now
    };
    setMarketLogs((prev) => [logEntry, ...prev]);

    return newMarket;
  };

  const editMarket = (
    id: string,
    updates: Partial<MarketItem>,
    actorInfo?: { name?: string; role?: string }
  ) => {
    const now = new Date().toISOString();
    let updatedItem: MarketItem | null = null;

    setMarkets((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...updates, updatedAt: now };
          return updatedItem;
        }
        return item;
      })
    );

    if (updatedItem) {
      const item = updatedItem as MarketItem;
      const actorName = actorInfo?.name || 'System Admin';
      const actorRole = actorInfo?.role || 'admin';
      const logEntry: MarketAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        marketId: id,
        marketNameBn: item.nameBn,
        marketNameEn: item.nameEn,
        action: 'EDIT',
        actorName,
        actorRole,
        details: `মার্কেটের তথ্য সংশোধিত হয়েছে (স্ট্যাটাস: ${item.status})`,
        ward: item.ward,
        unionName: item.unionName,
        timestamp: now
      };
      setMarketLogs((prev) => [logEntry, ...prev]);
    }
  };

  const deleteMarket = (id: string, actorInfo?: { name?: string; role?: string }) => {
    const target = markets.find((m) => m.id === id);
    setMarkets((prev) => prev.filter((item) => item.id !== id));

    if (target) {
      const now = new Date().toISOString();
      const actorName = actorInfo?.name || 'System Admin';
      const actorRole = actorInfo?.role || 'admin';
      const logEntry: MarketAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        marketId: id,
        marketNameBn: target.nameBn,
        marketNameEn: target.nameEn,
        action: 'DELETE',
        actorName,
        actorRole,
        details: `মার্কেট তালিকা থেকে মুছে ফেলা হয়েছে (${target.ward || 'N/A'})`,
        ward: target.ward,
        unionName: target.unionName,
        timestamp: now
      };
      setMarketLogs((prev) => [logEntry, ...prev]);
    }
  };

  const clearMarketLogs = () => {
    setMarketLogs([]);
  };

  const getMarketsForWard = (
    division: string,
    district: string,
    upazila: string,
    union: string,
    ward: string
  ): MarketItem[] => {
    if (!division || !district || !upazila || !union || !ward) return [];

    const normDiv = division.trim();
    const normDist = district.trim();
    const normUpaz = upazila.trim();
    const normUni = union.trim();
    const normWard = ward.trim();

    const matches = markets.filter(
      (m) =>
        (m.division === normDiv || !normDiv) &&
        (m.district === normDist || !normDist) &&
        (m.upazila === normUpaz || !normUpaz) &&
        (m.unionName === normUni || !normUni) &&
        (m.ward === normWard || m.ward.includes(normWard) || normWard.includes(m.ward))
    );

    if (matches.length > 0) {
      return matches;
    }

    // Generate dynamic default markets for this specific ward if none exist yet
    const defaultWardMarkets: MarketItem[] = [
      {
        id: `def_mkt_${normDiv}_${normDist}_${normUpaz}_${normUni}_${normWard}_1`,
        nameBn: `${normUni} ${normWard} কাঁচাবাজার`,
        nameEn: `${normUni} ${normWard} Kitchen Market`,
        marketType: 'Daily Market',
        division: normDiv,
        district: normDist,
        upazila: normUpaz,
        unionName: normUni,
        ward: normWard,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${normUni} ${normWard} Daily Market`)}`,
        status: 'Active',
        addedByRole: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `def_mkt_${normDiv}_${normDist}_${normUpaz}_${normUni}_${normWard}_2`,
        nameBn: `${normUni} ${normWard} সেন্ট্রাল শপিং সেন্টার`,
        nameEn: `${normUni} ${normWard} Central Shopping Center`,
        marketType: 'Shopping Mall',
        division: normDiv,
        district: normDist,
        upazila: normUpaz,
        unionName: normUni,
        ward: normWard,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${normUni} ${normWard} Shopping Center`)}`,
        status: 'Active',
        addedByRole: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `def_mkt_${normDiv}_${normDist}_${normUpaz}_${normUni}_${normWard}_3`,
        nameBn: `${normUni} ${normWard} পাইকারী বাজার`,
        nameEn: `${normUni} ${normWard} Wholesale Market`,
        marketType: 'Wholesale Market',
        division: normDiv,
        district: normDist,
        upazila: normUpaz,
        unionName: normUni,
        ward: normWard,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${normUni} ${normWard} Wholesale Market`)}`,
        status: 'Active',
        addedByRole: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `def_mkt_${normDiv}_${normDist}_${normUpaz}_${normUni}_${normWard}_4`,
        nameBn: `${normUni} ${normWard} সুপার শপ`,
        nameEn: `${normUni} ${normWard} Super Shop`,
        marketType: 'Super Shop',
        division: normDiv,
        district: normDist,
        upazila: normUpaz,
        unionName: normUni,
        ward: normWard,
        googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${normUni} ${normWard} Super Shop`)}`,
        status: 'Active',
        addedByRole: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return defaultWardMarkets;
  };

  const getAllMarkets = (): MarketItem[] => {
    return markets;
  };

  const searchMarkets = (query: string, filters?: MarketSearchFilters): MarketItem[] => {
    const q = query.trim().toLowerCase();
    return markets.filter((m) => {
      if (q) {
        const matchNameBn = m.nameBn.toLowerCase().includes(q);
        const matchNameEn = m.nameEn.toLowerCase().includes(q);
        const matchUnion = m.unionName.toLowerCase().includes(q);
        const matchWard = m.ward.toLowerCase().includes(q);
        const matchUpazila = m.upazila.toLowerCase().includes(q);
        const matchType = m.marketType.toLowerCase().includes(q);
        if (!matchNameBn && !matchNameEn && !matchUnion && !matchWard && !matchUpazila && !matchType) {
          return false;
        }
      }

      if (filters?.division && m.division !== filters.division) return false;
      if (filters?.district && m.district !== filters.district) return false;
      if (filters?.upazila && m.upazila !== filters.upazila) return false;
      if (filters?.unionName && m.unionName !== filters.unionName) return false;
      if (filters?.ward && m.ward !== filters.ward) return false;
      if (filters?.marketType && m.marketType !== filters.marketType) return false;
      if (filters?.status && m.status !== filters.status) return false;

      return true;
    });
  };

  // Generic helper to merge official base items with custom entries
  const mergeCategoryItems = (
    baseItems: string[],
    division: string,
    district: string,
    upazila: string,
    union: string,
    category: LocalCategory,
    lang: 'bn' | 'en' = 'bn'
  ): string[] => {
    const key = makeUnionKey(division, district, upazila, union);
    const customList = customRecords[key] || [];
    const customNames = customList
      .filter((e) => e.category === category)
      .map((e) => (lang === 'en' ? e.nameEn || e.nameBn : e.nameBn));

    const combined = Array.from(new Set([...baseItems, ...customNames]));
    return combined;
  };

  const getMergedVillages = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getVillagesList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'village', lang);
  };

  const getMergedMarkets = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getMarketsList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'market', lang);
  };

  const getMergedShoppingMalls = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getShoppingMallsList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'shoppingMall', lang);
  };

  const getMergedLocalShops = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getLocalShopsList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'localShop', lang);
  };

  const getMergedLandmarks = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getLandmarksList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'landmark', lang);
  };

  const getMergedPostOffices = (division: string, district: string, upazila: string, union: string, lang: 'bn' | 'en' = 'bn'): string[] => {
    const base = getPostOfficesList(division, district, upazila, union, lang);
    return mergeCategoryItems(base, division, district, upazila, union, 'postOffice', lang);
  };

  return (
    <BDLocalDatabaseContext.Provider
      value={{
        customRecords,
        deletedDefaultWards,
        markets,
        addLocalEntry,
        editLocalEntry,
        deleteLocalEntry,
        deleteDefaultWard,
        getMergedWards,
        getMergedVillages,
        getMergedMarkets,
        getMergedShoppingMalls,
        getMergedLocalShops,
        getMergedLandmarks,
        getMergedPostOffices,
        getCustomEntriesForUnion,
        addMarket,
        editMarket,
        deleteMarket,
        getMarketsForWard,
        getAllMarkets,
        searchMarkets,
        marketLogs,
        clearMarketLogs
      }}
    >
      {children}
    </BDLocalDatabaseContext.Provider>
  );
};

export const useBDLocalDatabase = () => {
  const context = useContext(BDLocalDatabaseContext);
  if (!context) {
    throw new Error('useBDLocalDatabase must be used within a BDLocalDatabaseProvider');
  }
  return context;
};

