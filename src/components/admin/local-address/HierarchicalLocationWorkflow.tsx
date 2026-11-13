import React, { useState, useMemo } from 'react';
import {
  UnionRecord,
  WardRecord,
  LocalPlaceRecord,
  PlaceType
} from '../../../types/local-address';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList
} from '../../../lib/bd-locations';
import {
  MapPin,
  Building2,
  Layers,
  Store,
  ShoppingBag,
  Compass,
  Mail,
  Plus,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';

interface HierarchicalLocationWorkflowProps {
  unions: UnionRecord[];
  wards: WardRecord[];
  places: LocalPlaceRecord[];
  selectedDivision: string;
  selectedDistrict: string;
  selectedUpazila: string;
  selectedUnionId: string;
  selectedWardId: string;
  onSelectDivision: (div: string) => void;
  onSelectDistrict: (dist: string) => void;
  onSelectUpazila: (upz: string) => void;
  onSelectUnionId: (id: string) => void;
  onSelectWardId: (id: string) => void;
  onOpenAddUnion: () => void;
  onOpenAddWard: () => void;
  onOpenAddPlace: (type: PlaceType) => void;
  onNavigateToCategoryFilter?: (type: PlaceType | 'ward') => void;
}

export const HierarchicalLocationWorkflow: React.FC<HierarchicalLocationWorkflowProps> = ({
  unions,
  wards,
  places,
  selectedDivision,
  selectedDistrict,
  selectedUpazila,
  selectedUnionId,
  selectedWardId,
  onSelectDivision,
  onSelectDistrict,
  onSelectUpazila,
  onSelectUnionId,
  onSelectWardId,
  onOpenAddUnion,
  onOpenAddWard,
  onOpenAddPlace,
  onNavigateToCategoryFilter
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'ward' | 'bazar_market' | 'village_area' | 'shopping_mall' | 'local_shop' | 'landmark' | 'post_office' | null
  >('bazar_market');

  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = useMemo(() => getDistrictsList(selectedDivision), [selectedDivision]);
  const upazilas = useMemo(
    () => getUpazilasList(selectedDivision, selectedDistrict),
    [selectedDivision, selectedDistrict]
  );

  // Unions matching current Upazila
  const currentUnions = useMemo(() => {
    return unions.filter(
      (u) =>
        u.divisionName === selectedDivision &&
        u.districtName === selectedDistrict &&
        u.upazilaName === selectedUpazila &&
        u.status === 'active'
    );
  }, [unions, selectedDivision, selectedDistrict, selectedUpazila]);

  // Selected union object
  const selectedUnion = useMemo(() => {
    return unions.find((u) => u.id === selectedUnionId);
  }, [unions, selectedUnionId]);

  // Wards matching selected Union
  const currentWards = useMemo(() => {
    if (!selectedUnionId) return [];
    return wards.filter((w) => w.unionId === selectedUnionId && w.status === 'active');
  }, [wards, selectedUnionId]);

  // Selected ward object
  const selectedWard = useMemo(() => {
    return wards.find((w) => w.id === selectedWardId);
  }, [wards, selectedWardId]);

  // Places matching selected Union and optional Ward
  const currentPlaces = useMemo(() => {
    return places.filter((p) => {
      if (selectedUnionId && p.unionId !== selectedUnionId) return false;
      if (selectedWardId && p.wardId && p.wardId !== selectedWardId) return false;
      return true;
    });
  }, [places, selectedUnionId, selectedWardId]);

  // Counts for categories in current location
  const categoryCounts = useMemo(() => {
    return {
      wards: currentWards.length,
      bazar_market: currentPlaces.filter((p) => p.placeType === 'bazar' || p.placeType === 'market').length,
      village_area: currentPlaces.filter((p) => p.placeType === 'village' || p.placeType === 'area').length,
      shopping_mall: currentPlaces.filter((p) => p.placeType === 'shopping_mall').length,
      local_shop: currentPlaces.filter((p) => p.placeType === 'local_shop').length,
      landmark: currentPlaces.filter((p) => p.placeType === 'landmark').length,
      post_office: currentPlaces.filter((p) => p.placeType === 'post_office').length
    };
  }, [currentWards, currentPlaces]);

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-emerald-500/30 dark:border-emerald-700/50 rounded-3xl p-5 md:p-6 shadow-md space-y-6">
      {/* 1. Official Bangladesh Database Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-full flex items-center gap-2 shadow-2xs">
            <span className="text-lg">🇧🇩</span>
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 tracking-wide uppercase">
              Official Bangladesh Database Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold overflow-x-auto whitespace-nowrap py-1">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Division</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">District</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Upazila</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-teal-700 dark:text-teal-400 font-bold">Union</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-blue-700 dark:text-blue-400 font-bold">Ward</span>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-bold">Local Places</span>
        </div>
      </div>

      {/* 2. STEP 1: LOCATION & ADMINISTRATIVE SELECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#198754] text-white flex items-center justify-center font-black text-xs shadow-xs">
              ১
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                লোকেশন ও প্রশাসনিক ইউনিয়ন নির্বাচন করুন
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Step 1: বাংলাদেশ প্রশাসনিক স্তরক্রম অনুসারে বিভাগ, জেলা, উপজেলা এবং ইউনিয়ন নির্বাচন করুন
              </p>
            </div>
          </div>

          <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
            {selectedDivision} → {selectedDistrict} → {selectedUpazila}
          </div>
        </div>

        {/* Dropdowns Row: Division, District, Upazila */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Division Dropdown */}
          <div className="bg-neutral-50/80 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              বিভাগ (Division) *
            </label>
            <select
              id="select-stepper-division"
              value={selectedDivision}
              onChange={(e) => onSelectDivision(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-emerald-500"
            >
              {divisions.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {d.nameBn} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="bg-neutral-50/80 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              জেলা (District) *
            </label>
            <select
              id="select-stepper-district"
              value={selectedDistrict}
              onChange={(e) => onSelectDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-emerald-500"
            >
              {districts.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {d.nameBn} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* Upazila / Thana Dropdown */}
          <div className="bg-neutral-50/80 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/60">
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              উপজেলা / থানা *
            </label>
            <select
              id="select-stepper-upazila"
              value={selectedUpazila}
              onChange={(e) => onSelectUpazila(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white shadow-2xs focus:ring-2 focus:ring-emerald-500"
            >
              {upazilas.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {u.nameBn} ({u.nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* After Upazila Selection -> + Add New Union & Union Dropdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/60">
          <div className="lg:col-span-8 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                {selectedUnion?.isMunicipality ? 'পৌরসভা (Official Pourashava) *' : 'প্রকৃত ইউনিয়ন (Actual Union Name) *'}
              </label>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                {currentUnions.length} টি ইউনিয়ন উপলব্ধ
              </span>
            </div>
            <select
              id="select-stepper-union"
              value={selectedUnionId}
              onChange={(e) => onSelectUnionId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-extrabold text-neutral-900 dark:text-white shadow-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- প্রকৃত ইউনিয়ন নির্বাচন করুন ({currentUnions.length} টি ইউনিয়ন) --</option>
              {currentUnions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.isMunicipality ? `[পৌরসভা] ${u.unionName}` : u.unionName}
                </option>
              ))}
            </select>
          </div>

          {/* Prominent + Add New Union button */}
          <div className="lg:col-span-4 flex flex-col justify-end">
            <span className="text-[10px] text-neutral-500 font-semibold mb-1 hidden lg:block">
              উপজেলায় নতুন ইউনিয়ন অন্তর্ভুক্ত করুন
            </span>
            <button
              type="button"
              id="btn-stepper-add-new-union"
              onClick={onOpenAddUnion}
              className="w-full py-2.5 px-4 bg-[#198754] hover:bg-[#157347] text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-400/40 active:scale-98 uppercase"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>＋ Add New Union (নতুন ইউনিয়ন)</span>
            </button>
          </div>
        </div>

        {/* After Union Selection -> Ward Selection & + Add New Ward button */}
        {selectedUnionId ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/60 animate-in fade-in">
            <div className="lg:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-blue-950 dark:text-blue-200">
                  {selectedUnion?.isMunicipality ? 'পৌরসভা ওয়ার্ড নম্বর (Ward Number)' : 'ওয়ার্ড নম্বর (Ward Number)'}
                </label>
                <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                  {currentWards.length} টি ওয়ার্ড সংরক্ষিত
                </span>
              </div>
              <select
                id="select-stepper-ward"
                value={selectedWardId}
                onChange={(e) => onSelectWardId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- সব ওয়ার্ড (পুরো এলাকা জুড়ে) --</option>
                {currentWards.map((w) => (
                  <option key={w.id} value={w.id}>
                    ওয়ার্ড {w.wardNumber} ({w.wardName})
                  </option>
                ))}
              </select>
            </div>

            {/* Prominent + Add New Ward button */}
            <div className="lg:col-span-4 flex flex-col justify-end">
              <span className="text-[10px] text-neutral-500 font-semibold mb-1 hidden lg:block">
                এই ইউনিয়নে নতুন ওয়ার্ড যুক্ত করুন
              </span>
              <button
                type="button"
                id="btn-stepper-add-new-ward"
                onClick={onOpenAddWard}
                className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-blue-400/40 active:scale-98 uppercase"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>＋ Add New Ward (নতুন ওয়ার্ড)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span className="font-bold">⚠️ নির্দেশিকা:</span>
            <span>অনুগ্রহ করে ড্রপডাউন থেকে একটি ইউনিয়ন বা পৌরসভা নির্বাচন করুন অথবা ‘＋ Add New Union’ বাটনে ক্লিক করে নতুন ইউনিয়ন তৈরি করুন।</span>
          </div>
        )}
      </div>

      {/* 3. STEP 2: LOCAL SERVICE CATEGORIES */}
      {selectedUnionId && (
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                ২
              </div>
              <div>
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  ২. স্থানীয় সার্ভিস ক্যাটাগরি বেছে নিন
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  নির্ধারিত ইউনিয়ন ও ওয়ার্ডে স্থানীয় সেবা ও স্থানের তথ্য যুক্ত করতে ক্যাটাগরি বাটনে ক্লিক করুন
                </p>
              </div>
            </div>

            <div className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl">
              নির্বাচিত ইউনিয়ন: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedUnion?.unionName}</span>
              {selectedWard && (
                <> • <span className="text-blue-600 dark:text-blue-400">{selectedWard.wardName}</span></>
              )}
            </div>
          </div>

          {/* 7 Interactive Category Action Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* 1. Ward Number */}
            <div
              onClick={() => {
                setActiveCategory('ward');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('ward');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'ward'
                  ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 ring-2 ring-blue-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.wards}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Ward Number</h4>
                <p className="text-[10px] text-neutral-500">ওয়ার্ড তালিকা ও পরিচালনা</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddWard();
                }}
                className="mt-2.5 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Ward</span>
              </button>
            </div>

            {/* 2. Bazar / Market */}
            <div
              onClick={() => {
                setActiveCategory('bazar_market');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('bazar');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'bazar_market'
                  ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.bazar_market}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Bazar / Market</h4>
                <p className="text-[10px] text-neutral-500">বাজার ও কাঁচাবাজার</p>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2.5">
                <button
                  type="button"
                  id="btn-category-add-bazar"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddPlace('bazar');
                  }}
                  className="py-1 px-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer truncate"
                  title="Add Bazar"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>+ Bazar</span>
                </button>
                <button
                  type="button"
                  id="btn-category-add-market"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddPlace('market');
                  }}
                  className="py-1 px-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer truncate"
                  title="Add Market"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>+ Market</span>
                </button>
              </div>
            </div>

            {/* 3. Village / Area */}
            <div
              onClick={() => {
                setActiveCategory('village_area');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('village');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'village_area'
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.village_area}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Village / Area</h4>
                <p className="text-[10px] text-neutral-500">গ্রাম ও পাড়া/মহল্লা</p>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-2.5">
                <button
                  type="button"
                  id="btn-category-add-village"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddPlace('village');
                  }}
                  className="py-1 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer truncate"
                  title="Add Village"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>+ Village</span>
                </button>
                <button
                  type="button"
                  id="btn-category-add-area"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddPlace('area');
                  }}
                  className="py-1 px-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 cursor-pointer truncate"
                  title="Add Area"
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>+ Area</span>
                </button>
              </div>
            </div>

            {/* 4. Shopping Mall */}
            <div
              onClick={() => {
                setActiveCategory('shopping_mall');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('shopping_mall');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'shopping_mall'
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-400 ring-2 ring-indigo-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.shopping_mall}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Shopping Mall</h4>
                <p className="text-[10px] text-neutral-500">শপিং মল ও কমপ্লেক্স</p>
              </div>
              <button
                type="button"
                id="btn-category-add-mall"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddPlace('shopping_mall');
                }}
                className="mt-2.5 py-1 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Mall</span>
              </button>
            </div>

            {/* 5. Grocery / Local Shop */}
            <div
              onClick={() => {
                setActiveCategory('local_shop');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('local_shop');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'local_shop'
                  ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-400 ring-2 ring-rose-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.local_shop}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Grocery / Shop</h4>
                <p className="text-[10px] text-neutral-500">মুদি ও লোকাল দোকান</p>
              </div>
              <button
                type="button"
                id="btn-category-add-shop"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddPlace('local_shop');
                }}
                className="mt-2.5 py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Shop</span>
              </button>
            </div>

            {/* 6. Landmark */}
            <div
              onClick={() => {
                setActiveCategory('landmark');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('landmark');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'landmark'
                  ? 'bg-purple-50/90 dark:bg-purple-950/60 border-purple-400 ring-2 ring-purple-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.landmark}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Landmark</h4>
                <p className="text-[10px] text-neutral-500">ল্যান্ডমার্ক ও মোড়</p>
              </div>
              <button
                type="button"
                id="btn-category-add-landmark"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddPlace('landmark');
                }}
                className="mt-2.5 py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Landmark</span>
              </button>
            </div>

            {/* 7. Post Office */}
            <div
              onClick={() => {
                setActiveCategory('post_office');
                if (onNavigateToCategoryFilter) onNavigateToCategoryFilter('post_office');
              }}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                activeCategory === 'post_office'
                  ? 'bg-orange-50/90 dark:bg-orange-950/60 border-orange-400 ring-2 ring-orange-400/40 shadow-xs'
                  : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-black text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-950 px-1.5 py-0.5 rounded">
                  {categoryCounts.post_office}
                </span>
              </div>
              <div className="mt-2">
                <h4 className="text-xs font-black text-neutral-900 dark:text-white">Post Office</h4>
                <p className="text-[10px] text-neutral-500">পোস্ট অফিস ও পোস্টকোড</p>
              </div>
              <button
                type="button"
                id="btn-category-add-post-office"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAddPlace('post_office');
                }}
                className="mt-2.5 py-1 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Post Office</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
