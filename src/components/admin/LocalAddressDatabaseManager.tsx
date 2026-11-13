/**
 * Level 2 Local Service Address Database Management Center
 * Super Admin Dedicated Dashboard Component
 * Project: Apon Somaj / Apon Bazar
 */

import React, { useState, useMemo } from 'react';
import { useLocalAddressDatabase } from '../../context/LocalAddressDatabaseContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  UnionRecord,
  WardRecord,
  LocalPlaceRecord,
  PlaceType,
  RecordStatus,
  PLACE_TYPE_CONFIGS
} from '../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../lib/bd-locations';
import { LocalAddressSearchDropdown } from '../common/LocalAddressSearchDropdown';
import { LocationManagementActionButtons } from './local-address/LocationManagementActionButtons';
import { HierarchicalLocationWorkflow } from './local-address/HierarchicalLocationWorkflow';
import { AdminAddressMasterTable } from './local-address/AdminAddressMasterTable';
import { UnionFormModal } from './local-address/UnionFormModal';
import { WardFormModal } from './local-address/WardFormModal';
import { PlaceFormModal } from './local-address/PlaceFormModal';
import {
  Database,
  Building2,
  Store,
  MapPin,
  ShoppingBag,
  Compass,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Sparkles,
  AlertTriangle,
  X,
  Table as TableIcon
} from 'lucide-react';

type SubTab = 'master_table' | 'unions' | 'wards' | 'places' | 'sandbox' | 'import_export';

export const LocalAddressDatabaseManager: React.FC = () => {
  const { language } = useLanguage();
  const { addToast } = useNotifications();

  const {
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
    exportDatabase,
    importDatabase,
    resetToDefaultDatabase
  } = useLocalAddressDatabase();

  // Active Sub-Tab: Default to master_table for instant overview and management
  const [activeTab, setActiveTab] = useState<SubTab>('master_table');

  // Hierarchy Filters for individual tabs
  const [selectedDivision, setSelectedDivision] = useState<string>('রংপুর');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ঠাকুরগাঁও');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('ঠাকুরগাঁও সদর');
  const [selectedUnionId, setSelectedUnionId] = useState<string>('');
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  const [selectedUnionName, setSelectedUnionName] = useState<string>('all');
  const [selectedWardNumber, setSelectedWardNumber] = useState<string>('all');
  const [selectedPlaceType, setSelectedPlaceType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdowns for hierarchy
  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = useMemo(() => getDistrictsList(selectedDivision), [selectedDivision]);
  const upazilas = useMemo(() => getUpazilasList(selectedDivision, selectedDistrict), [selectedDivision, selectedDistrict]);

  // Handle Division Change
  const handleDivisionChange = (newDiv: string) => {
    setSelectedDivision(newDiv);
    const distList = getDistrictsList(newDiv);
    const firstDist = distList[0]?.nameBn || '';
    setSelectedDistrict(firstDist);

    const upzList = getUpazilasList(newDiv, firstDist);
    const firstUpz = upzList[0]?.nameBn || '';
    setSelectedUpazila(firstUpz);
    setSelectedUnionId('');
    setSelectedWardId('');
    setSelectedUnionName('all');
    setSelectedWardNumber('all');
  };

  // Handle District Change
  const handleDistrictChange = (newDist: string) => {
    setSelectedDistrict(newDist);
    const upzList = getUpazilasList(selectedDivision, newDist);
    const firstUpz = upzList[0]?.nameBn || '';
    setSelectedUpazila(firstUpz);
    setSelectedUnionId('');
    setSelectedWardId('');
    setSelectedUnionName('all');
    setSelectedWardNumber('all');
  };

  // Handle Upazila Change
  const handleUpazilaChange = (newUpz: string) => {
    setSelectedUpazila(newUpz);
    setSelectedUnionId('');
    setSelectedWardId('');
    setSelectedUnionName('all');
    setSelectedWardNumber('all');
  };

  // Handle Union ID Change
  const handleSelectUnionId = (unionId: string) => {
    setSelectedUnionId(unionId);
    setSelectedWardId('');
    setSelectedWardNumber('all');
    if (!unionId) {
      setSelectedUnionName('all');
    } else {
      const match = unions.find((u) => u.id === unionId);
      setSelectedUnionName(match ? match.unionName : 'all');
    }
  };

  // Handle Ward ID Change
  const handleSelectWardId = (wardId: string) => {
    setSelectedWardId(wardId);
    if (!wardId) {
      setSelectedWardNumber('all');
    } else {
      const match = wards.find((w) => w.id === wardId);
      setSelectedWardNumber(match ? match.wardNumber : 'all');
    }
  };

  // Available unions for selected upazila
  const availableUnions = useMemo(() => {
    return unions.filter(
      (u) =>
        u.divisionName === selectedDivision &&
        u.districtName === selectedDistrict &&
        u.upazilaName === selectedUpazila
    );
  }, [unions, selectedDivision, selectedDistrict, selectedUpazila]);

  // Auto ensure unions if none in memory for selected upazila
  React.useEffect(() => {
    if (selectedDivision && selectedDistrict && selectedUpazila && availableUnions.length === 0) {
      ensureUnionsForUpazila(selectedDivision, selectedDistrict, selectedUpazila);
    }
  }, [selectedDivision, selectedDistrict, selectedUpazila, availableUnions.length, ensureUnionsForUpazila]);

  // Sync selectedUnionId if available
  React.useEffect(() => {
    if (availableUnions.length > 0) {
      if (!selectedUnionId || !availableUnions.some((u) => u.id === selectedUnionId)) {
        setSelectedUnionId(availableUnions[0].id);
        setSelectedUnionName(availableUnions[0].unionName);
      }
    } else {
      setSelectedUnionId('');
      setSelectedUnionName('all');
    }
  }, [availableUnions, selectedUnionId]);

  // Available wards for selected union
  const availableWards = useMemo(() => {
    if (selectedUnionName === 'all') return [];
    return wards.filter(
      (w) =>
        w.divisionName === selectedDivision &&
        w.districtName === selectedDistrict &&
        w.upazilaName === selectedUpazila &&
        w.unionName === selectedUnionName
    );
  }, [wards, selectedDivision, selectedDistrict, selectedUpazila, selectedUnionName]);

  // ---------------------------------------------------------------------------
  // Modal States
  // ---------------------------------------------------------------------------
  // Union Modal
  const [showUnionModal, setShowUnionModal] = useState<boolean>(false);
  const [editingUnion, setEditingUnion] = useState<UnionRecord | null>(null);

  // Ward Modal
  const [showWardModal, setShowWardModal] = useState<boolean>(false);
  const [editingWard, setEditingWard] = useState<WardRecord | null>(null);

  // Place Modal
  const [showPlaceModal, setShowPlaceModal] = useState<boolean>(false);
  const [editingPlace, setEditingPlace] = useState<LocalPlaceRecord | null>(null);
  const [placeModalInitialType, setPlaceModalInitialType] = useState<PlaceType>('market');

  // Delete Confirmation Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'union' | 'ward' | 'place';
    id: string;
    name: string;
  } | null>(null);

  // Sandbox State
  const [sandboxValue, setSandboxValue] = useState<string>('');
  const [sandboxSelected, setSandboxSelected] = useState<any>(null);

  // Import JSON State
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importResult, setImportResult] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Modal Open Handlers
  // ---------------------------------------------------------------------------
  const handleOpenAddUnion = () => {
    setEditingUnion(null);
    setShowUnionModal(true);
  };

  const handleOpenEditUnion = (u: UnionRecord) => {
    setEditingUnion(u);
    setShowUnionModal(true);
  };

  const handleOpenAddWard = () => {
    setEditingWard(null);
    setShowWardModal(true);
  };

  const handleOpenEditWard = (w: WardRecord) => {
    setEditingWard(w);
    setShowWardModal(true);
  };

  const handleOpenAddPlace = (type: PlaceType = 'market') => {
    setEditingPlace(null);
    setPlaceModalInitialType(type);
    setShowPlaceModal(true);
  };

  const handleOpenEditPlace = (p: LocalPlaceRecord) => {
    setEditingPlace(p);
    setPlaceModalInitialType(p.placeType);
    setShowPlaceModal(true);
  };

  // ---------------------------------------------------------------------------
  // Save Handlers
  // ---------------------------------------------------------------------------
  const handleSaveUnion = (data: {
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
    if (editingUnion) {
      const res = updateUnion(editingUnion.id, {
        divisionName: data.divisionName,
        districtName: data.districtName,
        upazilaName: data.upazilaName,
        unionName: data.unionName,
        unionNameEn: data.unionNameEn,
        officialName: data.officialName,
        unionCode: data.unionCode,
        postalCode: data.postalCode,
        status: data.status,
        isMunicipality: data.isMunicipality
      });
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowUnionModal(false);
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    } else {
      const res = addUnion(data);
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowUnionModal(false);
        if (res.record) {
          setSelectedUnionId(res.record.id);
          setSelectedUnionName(res.record.unionName);
        }
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    }
  };

  const handleSaveWard = (data: {
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
    if (editingWard) {
      const res = updateWard(editingWard.id, {
        wardNumber: data.wardNumber,
        wardName: data.wardName,
        wardNameEn: data.wardNameEn,
        status: data.status
      });
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowWardModal(false);
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    } else {
      const res = addWard(data);
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowWardModal(false);
        if (res.record) {
          setSelectedWardId(res.record.id);
          setSelectedWardNumber(res.record.wardNumber);
        }
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    }
  };

  const handleSavePlace = (data: {
    placeName: string;
    placeNameEn?: string;
    placeType: PlaceType;
    divisionName: string;
    districtName: string;
    upazilaName: string;
    unionName: string;
    unionId: string;
    wardId?: string;
    wardName?: string;
    villageArea?: string;
    status: RecordStatus;
  }) => {
    if (editingPlace) {
      const res = updatePlace(editingPlace.id, {
        placeName: data.placeName,
        placeNameEn: data.placeNameEn,
        placeType: data.placeType,
        wardId: data.wardId,
        wardName: data.wardName,
        villageArea: data.villageArea,
        status: data.status
      });
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowPlaceModal(false);
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    } else {
      const res = addPlace(data);
      if (res.success) {
        addToast({ title: 'সফল', message: res.message, type: 'success' });
        setShowPlaceModal(false);
      } else {
        addToast({ title: 'ত্রুটি', message: res.message, type: 'error' });
      }
      return res;
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'union') {
      const res = deleteUnion(deleteConfirm.id);
      addToast({ title: 'ইউনিয়ন মুছে ফেলা হয়েছে', message: res.message, type: 'info' });
    } else if (deleteConfirm.type === 'ward') {
      const res = deleteWard(deleteConfirm.id);
      addToast({ title: 'ওয়ার্ড মুছে ফেলা হয়েছে', message: res.message, type: 'info' });
    } else if (deleteConfirm.type === 'place') {
      const res = deletePlace(deleteConfirm.id);
      addToast({ title: 'স্থান মুছে ফেলা হয়েছে', message: res.message, type: 'info' });
    }

    setDeleteConfirm(null);
  };

  // ---------------------------------------------------------------------------
  // Filtered Records for Secondary Individual Tabs
  // ---------------------------------------------------------------------------
  const filteredUnions = useMemo(() => {
    return unions.filter((u) => {
      if (selectedDivision !== 'all' && u.divisionName !== selectedDivision) return false;
      if (selectedDistrict !== 'all' && u.districtName !== selectedDistrict) return false;
      if (selectedUpazila !== 'all' && u.upazilaName !== selectedUpazila) return false;
      if (selectedStatus !== 'all' && u.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.unionName.toLowerCase().includes(q) || (u.unionNameEn && u.unionNameEn.toLowerCase().includes(q));
        const matchCode = u.unionCode.toLowerCase().includes(q);
        const matchId = u.id.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchId) return false;
      }
      return true;
    });
  }, [unions, selectedDivision, selectedDistrict, selectedUpazila, selectedStatus, searchQuery]);

  const filteredWards = useMemo(() => {
    return wards.filter((w) => {
      if (selectedDivision !== 'all' && w.divisionName !== selectedDivision) return false;
      if (selectedDistrict !== 'all' && w.districtName !== selectedDistrict) return false;
      if (selectedUpazila !== 'all' && w.upazilaName !== selectedUpazila) return false;
      if (selectedUnionName !== 'all' && w.unionName !== selectedUnionName) return false;
      if (selectedStatus !== 'all' && w.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = w.wardName.toLowerCase().includes(q) || (w.wardNameEn && w.wardNameEn.toLowerCase().includes(q));
        const matchNum = w.wardNumber.includes(q);
        const matchUnion = w.unionName.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchUnion) return false;
      }
      return true;
    });
  }, [wards, selectedDivision, selectedDistrict, selectedUpazila, selectedUnionName, selectedStatus, searchQuery]);

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (selectedDivision !== 'all' && p.divisionName !== selectedDivision) return false;
      if (selectedDistrict !== 'all' && p.districtName !== selectedDistrict) return false;
      if (selectedUpazila !== 'all' && p.upazilaName !== selectedUpazila) return false;
      if (selectedUnionName !== 'all' && p.unionName !== selectedUnionName) return false;
      if (selectedWardNumber !== 'all') {
        const matchWard = p.wardName?.includes(selectedWardNumber);
        if (!matchWard) return false;
      }
      if (selectedPlaceType !== 'all' && p.placeType !== selectedPlaceType) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.placeName.toLowerCase().includes(q) || (p.placeNameEn && p.placeNameEn.toLowerCase().includes(q));
        const matchArea = p.villageArea && p.villageArea.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchName && !matchArea && !matchId) return false;
      }
      return true;
    });
  }, [places, selectedDivision, selectedDistrict, selectedUpazila, selectedUnionName, selectedWardNumber, selectedPlaceType, selectedStatus, searchQuery]);

  // Export DB Trigger
  const handleExport = (format: 'json' | 'csv') => {
    const dataStr = exportDatabase(format);
    const blob = new Blob([dataStr], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apon_somaj_local_address_database_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({
      title: 'ডাটাবেজ এক্সপোর্ট সম্পন্ন',
      message: `${format.toUpperCase()} ফাইল ডাউনলোড শুরু হয়েছে।`,
      type: 'success'
    });
  };

  // Import JSON Trigger
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) {
      addToast({ title: 'ত্রুটি', message: 'JSON টেক্সট পেস্ট করুন।', type: 'error' });
      return;
    }
    const res = importDatabase(importJsonText);
    if (res.success) {
      addToast({ title: 'ইমপোর্ট সফল', message: res.message, type: 'success' });
      setImportResult(res.message);
      setImportJsonText('');
    } else {
      addToast({ title: 'ইমপোর্ট ব্যর্থ', message: res.message, type: 'error' });
      setImportResult(`ত্রুটি: ${res.message}`);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-[#C8E6C9] dark:border-neutral-800 rounded-3xl p-5 md:p-7 shadow-xl space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#198754] to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
                লোকাল এড্রেস ডাটাবেজ (Local Address Database)
              </h2>
              <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300/60">
                Level 2 Search Engine
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Super Admin → সেন্ট্রালাইজড লোকাল এড্রেস ডাটাবেজ ব্যবস্থাপনা। প্রতিটি ইউনিয়ন ও ওয়ার্ড ভিত্তিক বাজার, গ্রাম, শপিং মল, লোকাল শপ ও ল্যান্ডমার্ক সংরক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => handleExport('json')}
            title="Export JSON"
            className="px-3 py-2 border border-[#C8E6C9] dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Database</span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 1 & 2: OFFICIAL BANGLADESH DATABASE & HIERARCHICAL LOCATION WORKFLOW */}
      {/* --------------------------------------------------------------------- */}
      <HierarchicalLocationWorkflow
        unions={unions}
        wards={wards}
        places={places}
        selectedDivision={selectedDivision}
        selectedDistrict={selectedDistrict}
        selectedUpazila={selectedUpazila}
        selectedUnionId={selectedUnionId}
        selectedWardId={selectedWardId}
        onSelectDivision={handleDivisionChange}
        onSelectDistrict={handleDistrictChange}
        onSelectUpazila={handleUpazilaChange}
        onSelectUnionId={handleSelectUnionId}
        onSelectWardId={handleSelectWardId}
        onOpenAddUnion={handleOpenAddUnion}
        onOpenAddWard={handleOpenAddWard}
        onOpenAddPlace={handleOpenAddPlace}
        onNavigateToCategoryFilter={(type) => {
          if (type === 'ward') {
            setActiveTab('wards');
          } else {
            setSelectedPlaceType(type);
            setActiveTab('master_table');
          }
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* SEPARATED ACTION BUTTONS: LOCATION MANAGEMENT & LOCAL PLACE MANAGEMENT */}
      {/* --------------------------------------------------------------------- */}
      <LocationManagementActionButtons
        onAddUnion={handleOpenAddUnion}
        onAddWard={handleOpenAddWard}
        onAddPlace={handleOpenAddPlace}
      />

      {/* --------------------------------------------------------------------- */}
      {/* KPI Stats Banner (Now with dedicated Bazar Counter!) */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Total Unions */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-[11px] font-bold">মোট ইউনিয়ন</span>
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-emerald-900 dark:text-white mt-1 font-mono">
            {stats.totalUnions}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">
            সক্রিয়: {stats.activeUnions}
          </span>
        </div>

        {/* Total Wards */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
            <span className="text-[11px] font-bold">মোট ওয়ার্ড</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-black text-blue-900 dark:text-white mt-1 font-mono">
            {stats.totalWards}
          </p>
          <span className="text-[10px] text-blue-700 font-medium">
            সক্রিয়: {stats.activeWards}
          </span>
        </div>

        {/* Bazars (Dedicated Stat!) */}
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3 rounded-2xl ring-1 ring-amber-400/30">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-[11px] font-extrabold">বাজার (Bazar)</span>
            <Store className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-black text-amber-950 dark:text-amber-100 mt-1 font-mono">
            {stats.bazarsCount}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
            সেন্ট্রাল ও লোকাল বাজার
          </span>
        </div>

        {/* Markets */}
        <div className="bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400">
            <span className="text-[11px] font-bold">মার্কেট</span>
            <Store className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <p className="text-xl font-black text-sky-900 dark:text-white mt-1 font-mono">
            {stats.marketsCount}
          </p>
          <span className="text-[10px] text-sky-700 font-medium">কাঁচাবাজার/মার্কেট</span>
        </div>

        {/* Villages */}
        <div className="bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-400">
            <span className="text-[11px] font-bold">গ্রাম / এলাকা</span>
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <p className="text-xl font-black text-teal-900 dark:text-white mt-1 font-mono">
            {stats.villagesCount}
          </p>
          <span className="text-[10px] text-teal-700 font-medium">পল্লী ও পাড়া</span>
        </div>

        {/* Shopping Malls & Landmarks */}
        <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-[11px] font-bold">মল ও ল্যান্ডমার্ক</span>
            <Compass className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-900 dark:text-white mt-1 font-mono">
            {stats.landmarksCount + stats.shoppingMallsCount}
          </p>
          <span className="text-[10px] text-purple-700 font-medium">শপিং ও মোড়</span>
        </div>

        {/* Local Shops */}
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/40 p-3 rounded-2xl">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-[11px] font-bold">লোকাল শপ</span>
            <ShoppingBag className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-900 dark:text-white mt-1 font-mono">
            {stats.localShopsCount}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">মোট স্থান: {stats.totalPlaces}</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Sub-Navigation Tabs */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
        {/* TAB 0: MASTER TABLE */}
        <button
          type="button"
          id="tab-master-table"
          onClick={() => setActiveTab('master_table')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'master_table'
              ? 'bg-[#198754] text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>এডমিন মাস্টার টেবিল (Admin Master Table)</span>
        </button>

        {/* TAB 1: UNIONS */}
        <button
          type="button"
          id="tab-unions"
          onClick={() => setActiveTab('unions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'unions'
              ? 'bg-[#198754] text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>১. ইউনিয়ন ও পৌরসভা ({unions.length})</span>
        </button>

        {/* TAB 2: WARDS */}
        <button
          type="button"
          id="tab-wards"
          onClick={() => setActiveTab('wards')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'wards'
              ? 'bg-[#198754] text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>২. ওয়ার্ড ব্যবস্থাপনা ({wards.length})</span>
        </button>

        {/* TAB 3: PLACES */}
        <button
          type="button"
          id="tab-places"
          onClick={() => setActiveTab('places')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'places'
              ? 'bg-[#198754] text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>৩. স্থানীয় স্থান ও বাজার ({places.length})</span>
        </button>

        {/* TAB 4: SANDBOX */}
        <button
          type="button"
          id="tab-sandbox"
          onClick={() => setActiveTab('sandbox')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'sandbox'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-purple-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>৪. লাইভ সার্চ টেস্ট স্যান্ডবক্স</span>
        </button>

        {/* TAB 5: IMPORT / EXPORT */}
        <button
          type="button"
          id="tab-import-export"
          onClick={() => setActiveTab('import_export')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'import_export'
              ? 'bg-neutral-800 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>৫. ব্যাকআপ ও ইমপোর্ট</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 0: ADMIN MASTER TABLE (Requirement 12) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'master_table' && (
        <AdminAddressMasterTable
          unions={unions}
          wards={wards}
          places={places}
          onEditUnion={handleOpenEditUnion}
          onEditWard={handleOpenEditWard}
          onEditPlace={handleOpenEditPlace}
          onToggleUnionStatus={toggleUnionStatus}
          onToggleWardStatus={toggleWardStatus}
          onTogglePlaceStatus={togglePlaceStatus}
          onRequestDelete={(type, id, name) => setDeleteConfirm({ type, id, name })}
          onQuickAddPlace={handleOpenAddPlace}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: UNIONS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'unions' && (
        <div className="space-y-4">
          {/* Cascading Filter Bar */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  বিভাগ (Division)
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  {divisions.map((d) => (
                    <option key={d.nameBn} value={d.nameBn}>
                      {d.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  জেলা (District)
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  {districts.map((d) => (
                    <option key={d.nameBn} value={d.nameBn}>
                      {d.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  উপজেলা / থানা
                </label>
                <select
                  value={selectedUpazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  {upazilas.map((u) => (
                    <option key={u.nameBn} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="active">সক্রিয় (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ইউনিয়নের নাম বা কোড দিয়ে তাৎক্ষণিক সার্চ করুন..."
                className="w-full px-3.5 py-2 pl-9 pr-8 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              রেকর্ড সংখ্যা: <span className="font-mono text-emerald-700 dark:text-emerald-400">{filteredUnions.length}</span> টি ইউনিয়ন
            </div>
            <button
              type="button"
              onClick={handleOpenAddUnion}
              className="px-3.5 py-2 bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Union</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4">ইউনিয়ন কোড / ID</th>
                  <th className="py-3 px-4">ইউনিয়নের নাম</th>
                  <th className="py-3 px-4">উপজেলা / থানা</th>
                  <th className="py-3 px-4">জেলা ও বিভাগ</th>
                  <th className="py-3 px-4">ওয়ার্ড সংখ্যা</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredUnions.length > 0 ? (
                  filteredUnions.map((u) => {
                    const wardCount = wards.filter((w) => w.unionId === u.id).length;
                    const isRecordActive = u.status === 'active';

                    return (
                      <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {u.unionCode}
                          <span className="block text-[10px] text-neutral-400 font-normal">{u.id}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{u.unionName}</span>
                            {(u.isMunicipality || u.unionName.includes('পৌরসভা')) && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                                পৌরসভা
                              </span>
                            )}
                          </div>
                          {u.officialName && u.officialName !== u.unionName && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-normal">
                              {u.officialName}
                            </span>
                          )}
                          {u.unionNameEn && (
                            <span className="text-[11px] text-neutral-400 block font-normal font-mono">
                              {u.unionNameEn}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300">{u.upazilaName}</td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {u.districtName}, {u.divisionName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px]">
                            {wardCount} টি ওয়ার্ড
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleUnionStatus(u.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                              isRecordActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {isRecordActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUnion(u)}
                              className="p-1.5 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-neutral-100 rounded-lg cursor-pointer"
                              title="Edit Union"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ type: 'union', id: u.id, name: u.unionName })}
                              className="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Union"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      কোনো ইউনিয়ন পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: WARDS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'wards' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  উপজেলা / থানা
                </label>
                <select
                  value={selectedUpazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  {upazilas.map((u) => (
                    <option key={u.nameBn} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  ইউনিয়ন
                </label>
                <select
                  value={selectedUnionName}
                  onChange={(e) => setSelectedUnionName(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সকল ইউনিয়ন ({availableUnions.length})</option>
                  {availableUnions.map((u) => {
                    const isMuni = u.isMunicipality || u.unionName.includes('পৌরসভা');
                    return (
                      <option key={u.id} value={u.unionName}>
                        {isMuni ? `${u.unionName} [পৌরসভা]` : `${u.unionName} ইউনিয়ন`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="active">সক্রিয় (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  সার্চ
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ওয়ার্ডের নাম বা নম্বর..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              রেকর্ড সংখ্যা: <span className="font-mono text-emerald-700 dark:text-emerald-400">{filteredWards.length}</span> টি ওয়ার্ড
            </div>
            <button
              type="button"
              onClick={handleOpenAddWard}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Ward</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4">ওয়ার্ড আইডি</th>
                  <th className="py-3 px-4">ওয়ার্ড নম্বর</th>
                  <th className="py-3 px-4">ওয়ার্ডের নাম</th>
                  <th className="py-3 px-4">প্যারেন্ট ইউনিয়ন</th>
                  <th className="py-3 px-4">উপজেলা ও জেলা</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredWards.length > 0 ? (
                  filteredWards.map((w) => {
                    const isRecordActive = w.status === 'active';

                    return (
                      <tr key={w.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px]">
                          {w.id}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {w.wardNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                          {w.wardName}
                          {w.wardNameEn && (
                            <span className="text-[10px] text-neutral-400 block font-normal font-mono">
                              {w.wardNameEn}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-semibold">
                          {w.unionName}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {w.upazilaName}, {w.districtName}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => toggleWardStatus(w.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                              isRecordActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {isRecordActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditWard(w)}
                              className="p-1.5 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-neutral-100 rounded-lg cursor-pointer"
                              title="Edit Ward"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ type: 'ward', id: w.id, name: w.wardName })}
                              className="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Ward"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      কোনো ওয়ার্ড রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: LOCAL PLACES (with Bazar Support!) */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'places' && (
        <div className="space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  উপজেলা / থানা
                </label>
                <select
                  value={selectedUpazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  {upazilas.map((u) => (
                    <option key={u.nameBn} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  ইউনিয়ন
                </label>
                <select
                  value={selectedUnionName}
                  onChange={(e) => {
                    setSelectedUnionName(e.target.value);
                    setSelectedWardNumber('all');
                  }}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সকল ইউনিয়ন ({availableUnions.length})</option>
                  {availableUnions.map((u) => {
                    const isMuni = u.isMunicipality || u.unionName.includes('পৌরসভা');
                    return (
                      <option key={u.id} value={u.unionName}>
                        {isMuni ? `${u.unionName} [পৌরসভা]` : `${u.unionName} ইউনিয়ন`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  ওয়ার্ড
                </label>
                <select
                  disabled={selectedUnionName === 'all'}
                  value={selectedWardNumber}
                  onChange={(e) => setSelectedWardNumber(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl disabled:opacity-50"
                >
                  <option value="all">সকল ওয়ার্ড</option>
                  {availableWards.map((w) => (
                    <option key={w.id} value={w.wardNumber}>
                      {w.wardName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  স্থানের ধরণ (Place Type)
                </label>
                <select
                  value={selectedPlaceType}
                  onChange={(e) => setSelectedPlaceType(e.target.value)}
                  className="w-full text-xs font-bold px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সকল ধরণ</option>
                  <option value="bazar">বাজার (Bazar)</option>
                  <option value="market">মার্কেট (Market)</option>
                  <option value="village">গ্রাম / এলাকা (Village)</option>
                  <option value="shopping_mall">শপিং মল (Shopping Mall)</option>
                  <option value="local_shop">লোকাল শপ (Local Shop)</option>
                  <option value="landmark">পরিচিত ল্যান্ডমার্ক (Landmark)</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs font-medium px-2.5 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="active">সক্রিয় (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              রেকর্ড সংখ্যা: <span className="font-mono text-emerald-700 dark:text-emerald-400">{filteredPlaces.length}</span> টি স্থান
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenAddPlace('bazar')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer ring-1 ring-amber-400/50 shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Bazar</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddPlace('market')}
                className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Market</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddPlace('village')}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Village</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddPlace('shopping_mall')}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Mall</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddPlace('local_shop')}
                className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Shop</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddPlace('landmark')}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Landmark</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-3 px-4">স্থানের আইডি (Place ID)</th>
                  <th className="py-3 px-4">স্থানের নাম</th>
                  <th className="py-3 px-4">ধরণ (Type)</th>
                  <th className="py-3 px-4">প্যারেন্ট ইউনিয়ন ও ওয়ার্ড</th>
                  <th className="py-3 px-4">উপজেলা ও জেলা</th>
                  <th className="py-3 px-4">লোকাল এলাকা / গ্রাম</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredPlaces.length > 0 ? (
                  filteredPlaces.map((p) => {
                    const typeConfig = PLACE_TYPE_CONFIGS[p.placeType] || PLACE_TYPE_CONFIGS.other;
                    const isRecordActive = p.status === 'active';

                    return (
                      <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[11px] text-teal-700 dark:text-teal-400">
                          {p.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900 dark:text-white">
                            {p.placeName}
                          </span>
                          {p.placeNameEn && (
                            <span className="text-[10px] text-neutral-400 block font-normal font-mono">
                              {p.placeNameEn}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeConfig.badgeBorder} ${typeConfig.bgLight} ${typeConfig.bgDark} ${typeConfig.color}`}>
                            {typeConfig.labelBn}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                            {p.unionName}
                          </span>
                          {p.wardName && (
                            <span className="text-[10.5px] text-neutral-500 dark:text-neutral-400">
                              {p.wardName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          {p.upazilaName}, {p.districtName}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-300 text-[11px]">
                          {p.villageArea || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => togglePlaceStatus(p.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                              isRecordActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {isRecordActive ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPlace(p)}
                              className="p-1.5 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-neutral-100 rounded-lg cursor-pointer"
                              title="Edit Place"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ type: 'place', id: p.id, name: p.placeName })}
                              className="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Place"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-neutral-500">
                      কোনো স্থান রেকর্ড পাওয়া যায়নি।
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: LIVE SEARCH TEST SANDBOX */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'sandbox' && (
        <div className="bg-gradient-to-br from-purple-50/50 to-emerald-50/30 dark:from-neutral-900 dark:to-neutral-900 border border-purple-200 dark:border-neutral-800 p-6 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>লাইভ এড্রেস সার্চ সিমুলেটর (Live Search Engine Verification)</span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            নিচের ফিল্ডে সার্চ করে যাচাই করুন। ইউজার ইন্টারফেসে (যেমন চেকআউট বা রেজিস্ট্রেশন ফর্ম) যেভাবে লাইভ অটোসাজেশন কাজ করবে, এটি ঠিক একইভাবে কাজ করে।
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                প্যারেন্ট বিভাগ ও জেলা
              </label>
              <div className="px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300">
                {selectedDivision} &gt; {selectedDistrict}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                প্যারেন্ট উপজেলা
              </label>
              <select
                value={selectedUpazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              >
                {upazilas.map((u) => (
                  <option key={u.nameBn} value={u.nameBn}>
                    {u.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                নির্বাচিত ইউনিয়ন (Strict Scope)
              </label>
              <select
                value={selectedUnionName}
                onChange={(e) => setSelectedUnionName(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              >
                <option value="all">সকল ইউনিয়ন (Unscoped)</option>
                {availableUnions.map((u) => {
                  const isMuni = u.isMunicipality || u.unionName.includes('পৌরসভা');
                  return (
                    <option key={u.id} value={u.unionName}>
                      {isMuni ? `${u.unionName} [পৌরসভা]` : `${u.unionName} ইউনিয়ন`}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <LocalAddressSearchDropdown
              id="sandbox-live-picker"
              value={sandboxValue}
              onChange={setSandboxValue}
              onSelectSuggestion={(item) => setSandboxSelected(item)}
              divisionName={selectedDivision}
              districtName={selectedDistrict}
              upazilaName={selectedUpazila}
              unionName={selectedUnionName !== 'all' ? selectedUnionName : undefined}
              placeholder="এখানে বাজার, গ্রাম, ল্যান্ডমার্ক বা শপিং মলের নাম টাইপ করুন (যেমন: সিংগিয়া বাজার...)"
              label="লেভেল ২ লাইভ সার্চ সাজেশন ইনপুট"
              helperText={`বর্তমানে ফিল্টার: ${selectedDivision} > ${selectedDistrict} > ${selectedUpazila} ${selectedUnionName !== 'all' ? `> ${selectedUnionName} ইউনিয়ন` : ''}`}
            />
          </div>

          {sandboxSelected && (
            <div className="bg-white dark:bg-neutral-800 border border-emerald-300 dark:border-emerald-700 p-4 rounded-xl shadow-xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>নির্বাচিত স্থান থেকে প্রাপ্ত মেটাডাটা (Resolved Entity):</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div><span className="text-neutral-400">Place ID:</span> <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{sandboxSelected.placeId}</span></div>
                <div><span className="text-neutral-400">Type:</span> <span className="font-bold text-emerald-700">{sandboxSelected.placeTypeLabelBn}</span></div>
                <div><span className="text-neutral-400">Union:</span> <span className="font-bold">{sandboxSelected.unionName}</span></div>
                <div><span className="text-neutral-400">Ward:</span> <span className="font-bold">{sandboxSelected.wardName || '—'}</span></div>
                <div><span className="text-neutral-400">Local Area:</span> <span className="font-bold">{sandboxSelected.villageArea || '—'}</span></div>
                <div><span className="text-neutral-400">Full Address:</span> <span className="font-bold">{sandboxSelected.formattedAddress}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: IMPORT / EXPORT */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'import_export' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Box */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
              <Download className="w-4 h-4 text-emerald-600" />
              <span>ডাটাবেজ এক্সপোর্ট (Export Database)</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              সম্পূর্ণ লোকাল এড্রেস ডাটাবেজ (ইউনিয়ন, ওয়ার্ড ও লোকাল স্থানসমূহ) ব্যাকআপ বা শেয়ার করার জন্য ডাউনলোড করুন।
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="px-4 py-2.5 bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>JSON ব্যাকআপ ডাউনলোড</span>
              </button>

              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV ডাউনলোড (Places)</span>
              </button>
            </div>
          </div>

          {/* Import Box */}
          <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>ডাটাবেজ ইমপোর্ট (Import JSON)</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              JSON ডাটা পেস্ট করে ইমপোর্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে ডুপ্লিকেট চেক করবে এবং শুধুমাত্র নতুন রেকর্ডগুলো যুক্ত করবে।
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"version": "2.0.0", "unions": [...], "wards": [...], "places": [...]}'
                rows={4}
                className="w-full text-xs font-mono p-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-1 focus:ring-emerald-500"
              />

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>ইমপোর্ট ও ভেরিফাই করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('আপনি কি নিশ্চিত যে ডাটাবেজ ডিফল্ট পাইলট ডাটাতে রিসেট করতে চান?')) {
                      resetToDefaultDatabase();
                      addToast({ title: 'রিসেট সম্পন্ন', message: 'ডিফল্ট ডাটাবেজ লোড হয়েছে।', type: 'info' });
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  ডিফল্ট ডাটাতে রিসেট
                </button>
              </div>

              {importResult && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                  {importResult}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT UNION */}
      {/* --------------------------------------------------------------------- */}
      <UnionFormModal
        isOpen={showUnionModal}
        onClose={() => setShowUnionModal(false)}
        editingUnion={editingUnion}
        defaultDivision={selectedDivision}
        defaultDistrict={selectedDistrict}
        defaultUpazila={selectedUpazila}
        onSave={handleSaveUnion}
      />

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT WARD */}
      {/* --------------------------------------------------------------------- */}
      <WardFormModal
        isOpen={showWardModal}
        onClose={() => setShowWardModal(false)}
        editingWard={editingWard}
        unions={unions}
        defaultDivision={selectedDivision}
        defaultDistrict={selectedDistrict}
        defaultUpazila={selectedUpazila}
        defaultUnionId={selectedUnionId || availableUnions[0]?.id}
        onSave={handleSaveWard}
      />

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: ADD / EDIT PLACE */}
      {/* --------------------------------------------------------------------- */}
      <PlaceFormModal
        isOpen={showPlaceModal}
        onClose={() => setShowPlaceModal(false)}
        editingPlace={editingPlace}
        initialType={placeModalInitialType}
        unions={unions}
        wards={wards}
        defaultDivision={selectedDivision}
        defaultDistrict={selectedDistrict}
        defaultUpazila={selectedUpazila}
        defaultUnionId={selectedUnionId || availableUnions[0]?.id}
        defaultWardId={selectedWardId || undefined}
        onSave={handleSavePlace}
      />

      {/* --------------------------------------------------------------------- */}
      {/* CONFIRM DELETE DIALOG */}
      {/* --------------------------------------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                আপনি কি মুছে ফেলতে চান?
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                '{deleteConfirm.name}' স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
