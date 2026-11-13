import React, { useState, useMemo } from 'react';
import {
  UnionRecord,
  WardRecord,
  LocalPlaceRecord,
  PlaceType,
  RecordStatus,
  PLACE_TYPE_CONFIGS
} from '../../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../../lib/bd-locations';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  Layers,
  Store,
  MapPin,
  ShoppingBag,
  Compass,
  Mail,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface UnifiedAddressRow {
  id: string;
  name: string;
  nameEn?: string;
  type: 'union' | 'ward' | PlaceType;
  typeLabelBn: string;
  typeLabelEn: string;
  divisionName: string;
  districtName: string;
  upazilaName: string;
  unionName: string;
  wardName: string;
  status: RecordStatus;
  rawType: 'union' | 'ward' | 'place';
  originalUnion?: UnionRecord;
  originalWard?: WardRecord;
  originalPlace?: LocalPlaceRecord;
  createdAt?: string;
}

interface AdminAddressMasterTableProps {
  unions: UnionRecord[];
  wards: WardRecord[];
  places: LocalPlaceRecord[];
  onEditUnion: (u: UnionRecord) => void;
  onEditWard: (w: WardRecord) => void;
  onEditPlace: (p: LocalPlaceRecord) => void;
  onToggleUnionStatus: (id: string) => void;
  onToggleWardStatus: (id: string) => void;
  onTogglePlaceStatus: (id: string) => void;
  onRequestDelete: (type: 'union' | 'ward' | 'place', id: string, name: string) => void;
  onQuickAddPlace: (type: PlaceType) => void;
}

export const AdminAddressMasterTable: React.FC<AdminAddressMasterTableProps> = ({
  unions,
  wards,
  places,
  onEditUnion,
  onEditWard,
  onEditPlace,
  onToggleUnionStatus,
  onToggleWardStatus,
  onTogglePlaceStatus,
  onRequestDelete,
  onQuickAddPlace
}) => {
  // Filter States
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterUpazila, setFilterUpazila] = useState<string>('all');
  const [filterUnion, setFilterUnion] = useState<string>('all');
  const [filterWard, setFilterWard] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<'name' | 'type' | 'division' | 'district' | 'upazila' | 'union' | 'ward' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Hierarchy dropdown helpers
  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = useMemo(() => {
    if (filterDivision === 'all') return [];
    return getDistrictsList(filterDivision);
  }, [filterDivision]);

  const upazilas = useMemo(() => {
    if (filterDivision === 'all' || filterDistrict === 'all') return [];
    return getUpazilasList(filterDivision, filterDistrict);
  }, [filterDivision, filterDistrict]);

  const availableUnions = useMemo(() => {
    return unions.filter((u) => {
      if (filterDivision !== 'all' && u.divisionName !== filterDivision) return false;
      if (filterDistrict !== 'all' && u.districtName !== filterDistrict) return false;
      if (filterUpazila !== 'all' && u.upazilaName !== filterUpazila) return false;
      return true;
    });
  }, [unions, filterDivision, filterDistrict, filterUpazila]);

  const availableWards = useMemo(() => {
    return wards.filter((w) => {
      if (filterUnion !== 'all' && w.unionName !== filterUnion) return false;
      return true;
    });
  }, [wards, filterUnion]);

  // Unified Rows Construction
  const allRows: UnifiedAddressRow[] = useMemo(() => {
    const rows: UnifiedAddressRow[] = [];

    // 1. Unions
    unions.forEach((u) => {
      rows.push({
        id: u.id,
        name: u.unionName,
        nameEn: u.unionNameEn,
        type: 'union',
        typeLabelBn: 'ইউনিয়ন',
        typeLabelEn: 'Union',
        divisionName: u.divisionName,
        districtName: u.districtName,
        upazilaName: u.upazilaName,
        unionName: u.unionName,
        wardName: '—',
        status: u.status,
        rawType: 'union',
        originalUnion: u,
        createdAt: u.createdAt
      });
    });

    // 2. Wards
    wards.forEach((w) => {
      rows.push({
        id: w.id,
        name: w.wardName,
        nameEn: w.wardNameEn,
        type: 'ward',
        typeLabelBn: 'ওয়ার্ড',
        typeLabelEn: 'Ward',
        divisionName: w.divisionName,
        districtName: w.districtName,
        upazilaName: w.upazilaName,
        unionName: w.unionName,
        wardName: w.wardName,
        status: w.status,
        rawType: 'ward',
        originalWard: w,
        createdAt: w.createdAt
      });
    });

    // 3. Places (Village, Market, Bazar, Shopping Mall, Local Shop, Landmark, Other)
    places.forEach((p) => {
      const config = PLACE_TYPE_CONFIGS[p.placeType] || PLACE_TYPE_CONFIGS.market;
      rows.push({
        id: p.id,
        name: p.placeName,
        nameEn: p.placeNameEn,
        type: p.placeType,
        typeLabelBn: config.labelBn,
        typeLabelEn: config.labelEn,
        divisionName: p.divisionName,
        districtName: p.districtName,
        upazilaName: p.upazilaName,
        unionName: p.unionName,
        wardName: p.wardName || '—',
        status: p.status,
        rawType: 'place',
        originalPlace: p,
        createdAt: p.createdAt
      });
    });

    return rows;
  }, [unions, wards, places]);

  // Filtering
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Division
      if (filterDivision !== 'all' && row.divisionName !== filterDivision) return false;
      // District
      if (filterDistrict !== 'all' && row.districtName !== filterDistrict) return false;
      // Upazila
      if (filterUpazila !== 'all' && row.upazilaName !== filterUpazila) return false;
      // Union
      if (filterUnion !== 'all' && row.unionName !== filterUnion) return false;
      // Ward
      if (filterWard !== 'all' && row.wardName !== filterWard) return false;
      // Type
      if (filterType !== 'all') {
        if (filterType === 'union' && row.type !== 'union') return false;
        if (filterType === 'ward' && row.type !== 'ward') return false;
        if (filterType === 'bazar' && row.type !== 'bazar') return false;
        if (filterType === 'market' && row.type !== 'market') return false;
        if (filterType === 'village' && row.type !== 'village') return false;
        if (filterType === 'shopping_mall' && row.type !== 'shopping_mall') return false;
        if (filterType === 'local_shop' && row.type !== 'local_shop') return false;
        if (filterType === 'landmark' && row.type !== 'landmark') return false;
      }
      // Status
      if (filterStatus !== 'all' && row.status !== filterStatus) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = row.name.toLowerCase().includes(q) || (row.nameEn && row.nameEn.toLowerCase().includes(q));
        const matchType = row.typeLabelBn.toLowerCase().includes(q) || row.typeLabelEn.toLowerCase().includes(q);
        const matchLoc =
          row.divisionName.toLowerCase().includes(q) ||
          row.districtName.toLowerCase().includes(q) ||
          row.upazilaName.toLowerCase().includes(q) ||
          row.unionName.toLowerCase().includes(q) ||
          (row.wardName && row.wardName.toLowerCase().includes(q));
        const matchId = row.id.toLowerCase().includes(q);
        if (!matchName && !matchType && !matchLoc && !matchId) return false;
      }
      return true;
    });
  }, [allRows, filterDivision, filterDistrict, filterUpazila, filterUnion, filterWard, filterType, filterStatus, searchQuery]);

  // Sorting
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortField) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'type':
          valA = a.type;
          valB = b.type;
          break;
        case 'division':
          valA = a.divisionName;
          valB = b.divisionName;
          break;
        case 'district':
          valA = a.districtName;
          valB = b.districtName;
          break;
        case 'upazila':
          valA = a.upazilaName;
          valB = b.upazilaName;
          break;
        case 'union':
          valA = a.unionName;
          valB = b.unionName;
          break;
        case 'ward':
          valA = a.wardName;
          valB = b.wardName;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        default:
          valA = a.name;
          valB = b.name;
      }

      const cmp = valA.localeCompare(valB, 'bn');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredRows, sortField, sortOrder]);

  // Pagination Slice
  const totalItems = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + pageSize);

  const resetFilters = () => {
    setFilterDivision('all');
    setFilterDistrict('all');
    setFilterUpazila('all');
    setFilterUnion('all');
    setFilterWard('all');
    setFilterType('all');
    setFilterStatus('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getTypeBadge = (type: 'union' | 'ward' | PlaceType, labelBn: string) => {
    if (type === 'union') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60">
          <Building2 className="w-3 h-3" />
          <span>ইউনিয়ন</span>
        </span>
      );
    }
    if (type === 'ward') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300/60">
          <Layers className="w-3 h-3" />
          <span>ওয়ার্ড</span>
        </span>
      );
    }
    if (type === 'bazar') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-400 ring-1 ring-amber-400/40">
          <Store className="w-3 h-3 text-amber-700" />
          <span>বাজার (Bazar)</span>
        </span>
      );
    }
    if (type === 'market') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/60">
          <Store className="w-3 h-3 text-sky-600" />
          <span>মার্কেট</span>
        </span>
      );
    }
    if (type === 'village') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300/60">
          <MapPin className="w-3 h-3 text-teal-600" />
          <span>গ্রাম</span>
        </span>
      );
    }
    if (type === 'area') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/70 text-teal-900 dark:text-teal-300 border border-teal-300/60">
          <MapPin className="w-3 h-3 text-teal-600" />
          <span>এলাকা</span>
        </span>
      );
    }
    if (type === 'shopping_mall') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300/60">
          <Building2 className="w-3 h-3 text-indigo-600" />
          <span>শপিং মল</span>
        </span>
      );
    }
    if (type === 'local_shop') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/60">
          <ShoppingBag className="w-3 h-3 text-rose-600" />
          <span>দোকান</span>
        </span>
      );
    }
    if (type === 'grocery') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 border border-teal-300/60">
          <Store className="w-3 h-3 text-teal-600" />
          <span>গ্রোসারী</span>
        </span>
      );
    }
    if (type === 'post_office') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-900 dark:text-orange-300 border border-orange-400/70 ring-1 ring-orange-400/30">
          <Mail className="w-3 h-3 text-orange-600" />
          <span>পোস্ট অফিস</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300/60">
        <Compass className="w-3 h-3 text-purple-600" />
        <span>{labelBn}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3">
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ডাটাবেজ খুঁজুন (নাম, স্থান, কোড, বা ধরণ অনুযায়ী সার্চ করুন)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between">
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
              ফলাফল: <span className="font-mono text-emerald-700 dark:text-emerald-400">{filteredRows.length}</span> টি
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:text-rose-600 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ফিল্টার রিসেট</span>
            </button>
          </div>
        </div>

        {/* Multi-tier Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {/* Division Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">বিভাগ</label>
            <select
              value={filterDivision}
              onChange={(e) => {
                setFilterDivision(e.target.value);
                setFilterDistrict('all');
                setFilterUpazila('all');
                setFilterUnion('all');
                setFilterWard('all');
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
            >
              <option value="all">সব বিভাগ (All)</option>
              {divisions.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {d.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">জেলা</label>
            <select
              disabled={filterDivision === 'all'}
              value={filterDistrict}
              onChange={(e) => {
                setFilterDistrict(e.target.value);
                setFilterUpazila('all');
                setFilterUnion('all');
                setFilterWard('all');
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs disabled:opacity-50"
            >
              <option value="all">সব জেলা (All)</option>
              {districts.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {d.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">উপজেলা / থানা</label>
            <select
              disabled={filterDistrict === 'all'}
              value={filterUpazila}
              onChange={(e) => {
                setFilterUpazila(e.target.value);
                setFilterUnion('all');
                setFilterWard('all');
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs disabled:opacity-50"
            >
              <option value="all">সব উপজেলা</option>
              {upazilas.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {u.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Union Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">ইউনিয়ন</label>
            <select
              value={filterUnion}
              onChange={(e) => {
                setFilterUnion(e.target.value);
                setFilterWard('all');
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
            >
              <option value="all">সব ইউনিয়ন</option>
              {availableUnions.map((u) => (
                <option key={u.id} value={u.unionName}>
                  {u.unionName}
                </option>
              ))}
            </select>
          </div>

          {/* Ward Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">ওয়ার্ড</label>
            <select
              value={filterWard}
              onChange={(e) => {
                setFilterWard(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
            >
              <option value="all">সব ওয়ার্ড</option>
              {availableWards.map((w) => (
                <option key={w.id} value={w.wardName}>
                  {w.wardName}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">রেকর্ডের ধরণ</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold"
            >
              <option value="all">সব ধরণের রেকর্ড</option>
              <option value="union">ইউনিয়ন (Union)</option>
              <option value="ward">ওয়ার্ড (Ward)</option>
              <option value="village">গ্রাম (Village)</option>
              <option value="area">এলাকা (Area)</option>
              <option value="bazar">বাজার (Bazar)</option>
              <option value="market">মার্কেট (Market)</option>
              <option value="shopping_mall">শপিং মল (Mall)</option>
              <option value="local_shop">লোকাল শপ (Shop)</option>
              <option value="grocery">মুদি দোকান / গ্রোসারী (Grocery)</option>
              <option value="landmark">ল্যান্ডমার্ক (Landmark)</option>
              <option value="post_office">পোস্ট অফিস (Post Office)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">স্ট্যাটাস</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="active">সক্রিয় (Active)</option>
              <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/80 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 font-bold">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name (নাম)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('type')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type (ধরণ)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('division')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>Division (বিভাগ)</span>
                </th>
                <th
                  onClick={() => handleSort('district')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>District (জেলা)</span>
                </th>
                <th
                  onClick={() => handleSort('upazila')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>Upazila (উপজেলা)</span>
                </th>
                <th
                  onClick={() => handleSort('union')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>Union (ইউনিয়ন)</span>
                </th>
                <th
                  onClick={() => handleSort('ward')}
                  className="py-3 px-3 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>Ward (ওয়ার্ড)</span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Action (অ্যাকশন)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-semibold">কোনো রেকর্ড পাওয়া যায়নি।</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      ফিল্টার পরিবর্তন করুন অথবা নতুন ইউনিয়ন, ওয়ার্ড বা বাজার যোগ করুন।
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isActive = row.status === 'active';

                  return (
                    <tr
                      key={`${row.rawType}-${row.id}`}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                    >
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-neutral-900 dark:text-white">
                          {row.name}
                        </div>
                        {row.nameEn && (
                          <div className="text-[11px] text-neutral-500 font-mono">
                            {row.nameEn}
                          </div>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {row.id}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getTypeBadge(row.type, row.typeLabelBn)}
                      </td>

                      {/* Division */}
                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300 font-medium">
                        {row.divisionName}
                      </td>

                      {/* District */}
                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300 font-medium">
                        {row.districtName}
                      </td>

                      {/* Upazila */}
                      <td className="py-3 px-3 text-neutral-700 dark:text-neutral-300 font-medium">
                        {row.upazilaName}
                      </td>

                      {/* Union */}
                      <td className="py-3 px-3 text-neutral-800 dark:text-neutral-200 font-semibold">
                        {row.unionName}
                      </td>

                      {/* Ward */}
                      <td className="py-3 px-3 text-neutral-600 dark:text-neutral-400">
                        {row.wardName}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-100 text-[#198754] border border-emerald-300/60'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Inactive
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions: Edit | Activate/Deactivate | Delete */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (row.rawType === 'union' && row.originalUnion) {
                                onEditUnion(row.originalUnion);
                              } else if (row.rawType === 'ward' && row.originalWard) {
                                onEditWard(row.originalWard);
                              } else if (row.rawType === 'place' && row.originalPlace) {
                                onEditPlace(row.originalPlace);
                              }
                            }}
                            title="Edit Record"
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-neutral-700 dark:text-neutral-300 hover:text-[#198754] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => {
                              if (row.rawType === 'union') {
                                onToggleUnionStatus(row.id);
                              } else if (row.rawType === 'ward') {
                                onToggleWardStatus(row.id);
                              } else if (row.rawType === 'place') {
                                onTogglePlaceStatus(row.id);
                              }
                            }}
                            title={isActive ? 'Deactivate Record' : 'Activate Record'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-[#198754]'
                            }`}
                          >
                            {isActive ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onRequestDelete(row.rawType, row.id, row.name)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-neutral-700 dark:text-neutral-300 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500">প্রতি পেজে রেকর্ড:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-semibold"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-neutral-500">
              ({startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} এর মধ্যে মোট {totalItems} টি)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPageSafe <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>পূর্ববর্তী</span>
            </button>

            <span className="px-3 py-1 font-bold text-neutral-800 dark:text-neutral-200">
              পেজ {currentPageSafe} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPageSafe >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <span>পরবর্তী</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
