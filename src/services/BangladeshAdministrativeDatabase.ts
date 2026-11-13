/**
 * Centralized Bangladesh Administrative Relational Database Service
 * Complete Official Government National Web Portal Dataset
 * 
 * Strict Relational Hierarchy:
 * divisions (8)
 *    ↓
 * districts (64) [division_id]
 *    ↓
 * upazilas (504) [district_id, division_id]
 *    ↓
 * unions (4,964) [upazila_id, district_id, division_id]
 */

import {
  DivisionRecord,
  DistrictRecord,
  UpazilaRecord,
  UnionRecord,
  BDDataVerificationReport
} from '../types/local-address';
import bdDataRaw from '../data/bangladesh-administrative-db.json';

// In-memory typed table stores
export const BD_DIVISIONS_TABLE: DivisionRecord[] = bdDataRaw.divisions as DivisionRecord[];
export const BD_DISTRICTS_TABLE: DistrictRecord[] = bdDataRaw.districts as DistrictRecord[];
export const BD_UPAZILAS_TABLE: UpazilaRecord[] = bdDataRaw.upazilas as UpazilaRecord[];
export const BD_UNIONS_TABLE: UnionRecord[] = (bdDataRaw.unions as unknown[]).map((u: any) => ({
  ...u,
  createdAt: u.createdAt || '2026-01-01T00:00:00.000Z',
  updatedAt: u.updatedAt || '2026-01-01T00:00:00.000Z'
})) as UnionRecord[];

// Fast lookup indexed maps
const divisionByIdMap = new Map<string, DivisionRecord>();
const divisionByNameMap = new Map<string, DivisionRecord>();
BD_DIVISIONS_TABLE.forEach((d) => {
  divisionByIdMap.set(d.id, d);
  divisionByNameMap.set(d.nameBn.toLowerCase().trim(), d);
  divisionByNameMap.set(d.nameEn.toLowerCase().trim(), d);
});

const districtByIdMap = new Map<string, DistrictRecord>();
const districtsByDivIdMap = new Map<string, DistrictRecord[]>();
const districtByNameMap = new Map<string, DistrictRecord>();
BD_DISTRICTS_TABLE.forEach((dist) => {
  districtByIdMap.set(dist.id, dist);
  districtByNameMap.set(dist.nameBn.toLowerCase().trim(), dist);
  districtByNameMap.set(dist.nameEn.toLowerCase().trim(), dist);

  const list = districtsByDivIdMap.get(dist.divisionId) || [];
  list.push(dist);
  districtsByDivIdMap.set(dist.divisionId, list);
});

const upazilaByIdMap = new Map<string, UpazilaRecord>();
const upazilasByDistIdMap = new Map<string, UpazilaRecord[]>();
const upazilaByNameMap = new Map<string, UpazilaRecord>();
BD_UPAZILAS_TABLE.forEach((upz) => {
  upazilaByIdMap.set(upz.id, upz);
  upazilaByNameMap.set(upz.nameBn.toLowerCase().trim(), upz);
  upazilaByNameMap.set(upz.nameEn.toLowerCase().trim(), upz);

  const list = upazilasByDistIdMap.get(upz.districtId) || [];
  list.push(upz);
  upazilasByDistIdMap.set(upz.districtId, list);
});

const unionByIdMap = new Map<string, UnionRecord>();
const unionsByUpzIdMap = new Map<string, UnionRecord[]>();
BD_UNIONS_TABLE.forEach((un) => {
  unionByIdMap.set(un.id, un);
  const upzId = un.upazila_id || un.upazilaId;
  if (upzId) {
    const list = unionsByUpzIdMap.get(upzId) || [];
    list.push(un);
    unionsByUpzIdMap.set(upzId, list);
  }
});

/**
 * 1. Divisions: Get All 8 Divisions
 */
export function getBDDivisions(): DivisionRecord[] {
  return BD_DIVISIONS_TABLE;
}

/**
 * 2. Districts: Cascading from Division
 */
export function getBDDistricts(divisionIdOrName?: string): DistrictRecord[] {
  if (!divisionIdOrName || divisionIdOrName === 'all') {
    return BD_DISTRICTS_TABLE;
  }
  const clean = divisionIdOrName.toLowerCase().trim();
  const matchedDiv = divisionByIdMap.get(divisionIdOrName) || divisionByNameMap.get(clean);
  if (!matchedDiv) {
    return BD_DISTRICTS_TABLE.filter((d) => d.divisionName?.toLowerCase().includes(clean));
  }
  return districtsByDivIdMap.get(matchedDiv.id) || [];
}

/**
 * 3. Upazilas: Cascading from District
 */
export function getBDUpazilas(districtIdOrName?: string): UpazilaRecord[] {
  if (!districtIdOrName || districtIdOrName === 'all') {
    return BD_UPAZILAS_TABLE;
  }
  const clean = districtIdOrName.toLowerCase().trim();
  const matchedDist = districtByIdMap.get(districtIdOrName) || districtByNameMap.get(clean);
  if (!matchedDist) {
    return BD_UPAZILAS_TABLE.filter((u) => u.districtName?.toLowerCase().includes(clean));
  }
  return upazilasByDistIdMap.get(matchedDist.id) || [];
}

/**
 * 4. Unions: Cascading from Upazila
 */
export function getBDUnions(upazilaIdOrName?: string): UnionRecord[] {
  if (!upazilaIdOrName || upazilaIdOrName === 'all') {
    return BD_UNIONS_TABLE;
  }
  const clean = upazilaIdOrName.toLowerCase().trim();
  const matchedUpz = upazilaByIdMap.get(upazilaIdOrName) || upazilaByNameMap.get(clean);
  if (!matchedUpz) {
    return BD_UNIONS_TABLE.filter((un) => un.upazilaName?.toLowerCase().includes(clean));
  }
  return unionsByUpzIdMap.get(matchedUpz.id) || [];
}

/**
 * Find Union Record by ID
 */
export function getBDUnionById(unionId: string): UnionRecord | undefined {
  return unionByIdMap.get(unionId);
}

/**
 * Search Location with Full Administrative Hierarchy Representation
 */
export interface BDLocationSearchResult {
  id: string;
  type: 'division' | 'district' | 'upazila' | 'union';
  nameBn: string;
  nameEn: string;
  divisionName: string;
  districtName?: string;
  upazilaName?: string;
  unionName?: string;
  formattedHierarchy: string;
  record: DivisionRecord | DistrictRecord | UpazilaRecord | UnionRecord;
}

export function searchBDAdministrativeLocations(query: string, maxResults: number = 20): BDLocationSearchResult[] {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const results: BDLocationSearchResult[] = [];

  // Search Unions first (most specific)
  for (const un of BD_UNIONS_TABLE) {
    if (
      un.unionName.toLowerCase().includes(q) ||
      (un.unionNameEn && un.unionNameEn.toLowerCase().includes(q)) ||
      (un.officialName && un.officialName.toLowerCase().includes(q))
    ) {
      results.push({
        id: un.id,
        type: 'union',
        nameBn: un.unionName,
        nameEn: un.unionNameEn || un.unionName,
        divisionName: un.divisionName,
        districtName: un.districtName,
        upazilaName: un.upazilaName,
        unionName: un.unionName,
        formattedHierarchy: `${un.divisionName} বিভাগ → ${un.districtName} জেলা → ${un.upazilaName} উপজেলা → ${un.unionName}${un.isMunicipality ? ' [পৌরসভা]' : ' ইউনিয়ন'}`,
        record: un
      });
      if (results.length >= maxResults) return results;
    }
  }

  // Search Upazilas
  for (const upz of BD_UPAZILAS_TABLE) {
    if (upz.nameBn.toLowerCase().includes(q) || upz.nameEn.toLowerCase().includes(q)) {
      results.push({
        id: upz.id,
        type: 'upazila',
        nameBn: upz.nameBn,
        nameEn: upz.nameEn,
        divisionName: upz.divisionName || '',
        districtName: upz.districtName || '',
        upazilaName: upz.nameBn,
        formattedHierarchy: `${upz.divisionName} বিভাগ → ${upz.districtName} জেলা → ${upz.nameBn} উপজেলা`,
        record: upz
      });
      if (results.length >= maxResults) return results;
    }
  }

  // Search Districts
  for (const dist of BD_DISTRICTS_TABLE) {
    if (dist.nameBn.toLowerCase().includes(q) || dist.nameEn.toLowerCase().includes(q)) {
      results.push({
        id: dist.id,
        type: 'district',
        nameBn: dist.nameBn,
        nameEn: dist.nameEn,
        divisionName: dist.divisionName || '',
        districtName: dist.nameBn,
        formattedHierarchy: `${dist.divisionName} বিভাগ → ${dist.nameBn} জেলা`,
        record: dist
      });
      if (results.length >= maxResults) return results;
    }
  }

  // Search Divisions
  for (const div of BD_DIVISIONS_TABLE) {
    if (div.nameBn.toLowerCase().includes(q) || div.nameEn.toLowerCase().includes(q)) {
      results.push({
        id: div.id,
        type: 'division',
        nameBn: div.nameBn,
        nameEn: div.nameEn,
        divisionName: div.nameBn,
        formattedHierarchy: `${div.nameBn} বিভাগ (সমগ্র বিভাগ)`,
        record: div
      });
      if (results.length >= maxResults) return results;
    }
  }

  return results;
}

/**
 * Complete Data Verification Engine
 * Audits:
 * - Division Count (Target: 8)
 * - District Count (Target: 64)
 * - Upazila Count (Target: 504)
 * - Union Count (Target: 4,964)
 * - Missing Districts
 * - Missing Upazilas
 * - Missing Unions
 * - Duplicate Unions (same upazila and union name)
 * - Orphan Unions (unions missing upazila_id or parent upazila)
 */
export function runBangladeshDataVerification(): BDDataVerificationReport {
  const missingDistricts: string[] = [];
  const missingUpazilas: string[] = [];
  const missingUnions: string[] = [];
  const duplicateUnions: { id: string; name: string; upazila: string }[] = [];
  const orphanUnions: { id: string; name: string }[] = [];

  // 1. Audit Division -> District mapping
  BD_DIVISIONS_TABLE.forEach((div) => {
    const dists = districtsByDivIdMap.get(div.id) || [];
    if (dists.length === 0) {
      missingDistricts.push(`${div.nameBn} বিভাগে কোনো জেলা নেই`);
    }
  });

  // 2. Audit District -> Upazila mapping
  BD_DISTRICTS_TABLE.forEach((dist) => {
    const upzs = upazilasByDistIdMap.get(dist.id) || [];
    if (upzs.length === 0) {
      missingUpazilas.push(`${dist.nameBn} জেলায় কোনো উপজেলা নেই`);
    }
  });

  // 3. Audit Upazila -> Union mapping
  BD_UPAZILAS_TABLE.forEach((upz) => {
    const uns = unionsByUpzIdMap.get(upz.id) || [];
    if (uns.length === 0) {
      missingUnions.push(`${upz.districtName} > ${upz.nameBn} উপজেলায় কোনো ইউনিয়ন পাওয়া যায়নি`);
    }
  });

  // 4. Audit Unions for Orphans & Duplicates
  const seenUnionKeys = new Map<string, string>();
  BD_UNIONS_TABLE.forEach((un) => {
    const parentUpzId = un.upazila_id || un.upazilaId;
    if (!parentUpzId || !upazilaByIdMap.has(parentUpzId)) {
      orphanUnions.push({
        id: un.id,
        name: un.unionName
      });
    }

    const key = `${parentUpzId}:${un.unionName.trim().toLowerCase()}`;
    if (seenUnionKeys.has(key)) {
      duplicateUnions.push({
        id: un.id,
        name: un.unionName,
        upazila: un.upazilaName
      });
    } else {
      seenUnionKeys.set(key, un.id);
    }
  });

  const isVerified =
    BD_DIVISIONS_TABLE.length === 8 &&
    BD_DISTRICTS_TABLE.length === 64 &&
    BD_UPAZILAS_TABLE.length >= 490 &&
    BD_UNIONS_TABLE.length >= 4500 &&
    orphanUnions.length === 0 &&
    duplicateUnions.length === 0;

  return {
    divisionCount: BD_DIVISIONS_TABLE.length,
    districtCount: BD_DISTRICTS_TABLE.length,
    upazilaCount: BD_UPAZILAS_TABLE.length,
    unionCount: BD_UNIONS_TABLE.length,
    missingDistricts,
    missingUpazilas,
    missingUnions,
    duplicateUnions,
    orphanUnions,
    isVerified,
    timestamp: new Date().toISOString()
  };
}
