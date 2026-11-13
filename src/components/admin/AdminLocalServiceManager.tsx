/**
 * Admin Local Service Database Management Module
 * Enables Administrators to manage local level entries per Union:
 * - Markets / Bazars
 * - Villages / Areas
 * - Shopping Malls
 * - Local Shops / Groceries
 * - Landmarks
 * - Post Offices
 *
 * Entries automatically become searchable for future users selecting that Union.
 * Project: Apon Bazar
 */

import React, { useState } from 'react';
import { useBDLocalDatabase, LocalCategory } from '../../context/BDLocalDatabaseContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList
} from '../../lib/bd-locations';
import {
  MapPin,
  Building2,
  Store,
  ShoppingBag,
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Database,
  Layers,
  Sparkles
} from 'lucide-react';

export const AdminLocalServiceManager: React.FC = () => {
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const {
    addLocalEntry,
    editLocalEntry,
    deleteLocalEntry,
    deleteDefaultWard,
    getMergedWards,
    getCustomEntriesForUnion,
    getMergedVillages,
    getMergedMarkets,
    getMergedShoppingMalls,
    getMergedLocalShops,
    getMergedLandmarks,
    getMergedPostOffices
  } = useBDLocalDatabase();

  // Selected Location Hierarchy
  const [selectedDivision, setSelectedDivision] = useState<string>('ঢাকা');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ঢাকা');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('ধানমন্ডি');
  const [selectedUnion, setSelectedUnion] = useState<string>('ধানমন্ডি আ/এ');

  // Selected Category
  const [activeCategory, setActiveCategory] = useState<LocalCategory>('market');

  // Form State for Adding
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBn, setEditBn] = useState('');
  const [editEn, setEditEn] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete & Saving States
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Dropdown lists
  const divisions = BD_DIVISIONS.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
  const districts = getDistrictsList(selectedDivision);
  const upazilas = getUpazilasList(selectedDivision, selectedDistrict);
  const unions = getUnionsList(selectedDivision, selectedDistrict, selectedUpazila);

  // Handlers for cascading selects
  const handleDivisionChange = (val: string) => {
    setSelectedDivision(val);
    const newDistricts = getDistrictsList(val);
    const firstDist = newDistricts[0]?.nameBn || val;
    setSelectedDistrict(firstDist);

    const newUpazilas = getUpazilasList(val, firstDist);
    const firstUpaz = newUpazilas[0]?.nameBn || firstDist;
    setSelectedUpazila(firstUpaz);

    const newUnions = getUnionsList(val, firstDist, firstUpaz);
    setSelectedUnion(newUnions[0]?.nameBn || firstUpaz);
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    const newUpazilas = getUpazilasList(selectedDivision, val);
    const firstUpaz = newUpazilas[0]?.nameBn || val;
    setSelectedUpazila(firstUpaz);

    const newUnions = getUnionsList(selectedDivision, val, firstUpaz);
    setSelectedUnion(newUnions[0]?.nameBn || firstUpaz);
  };

  const handleUpazilaChange = (val: string) => {
    setSelectedUpazila(val);
    const newUnions = getUnionsList(selectedDivision, selectedDistrict, val);
    setSelectedUnion(newUnions[0]?.nameBn || val);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) return;

    setIsAddingEntry(true);
    try {
      addLocalEntry(
        selectedDivision,
        selectedDistrict,
        selectedUpazila,
        selectedUnion,
        activeCategory,
        nameBn.trim(),
        nameEn.trim() || nameBn.trim()
      );

      addNotification({
        title: language === 'bn' ? 'এন্ট্রি যোগ হয়েছে' : 'Entry Added',
        message: `${nameBn} ${language === 'bn' ? 'সফলভাবে যোগ ও সংরক্ষণ করা হয়েছে' : 'has been saved to'} ${selectedUnion}`,
        type: 'info'
      });

      setNameBn('');
      setNameEn('');
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleSaveEdit = async (entryId: string) => {
    if (!editBn.trim()) return;

    setIsSavingEdit(true);
    try {
      editLocalEntry(
        selectedDivision,
        selectedDistrict,
        selectedUpazila,
        selectedUnion,
        entryId,
        editBn.trim(),
        editEn.trim() || editBn.trim()
      );

      addNotification({
        title: language === 'bn' ? 'এন্ট্রি আপডেট হয়েছে' : 'Entry Updated',
        message: `${editBn} ${language === 'bn' ? 'সফলভাবে আপডেট ও সংরক্ষণ করা হয়েছে' : 'updated successfully'}`,
        type: 'info'
      });

      setEditingId(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteLocalEntry(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, deleteConfirm.id);
    addNotification({
      title: language === 'bn' ? 'এন্ট্রি মুছে ফেলা হয়েছে' : 'Entry Deleted',
      message: `${deleteConfirm.name} ${language === 'bn' ? 'তালিকা থেকে রিমুভ করা হয়েছে' : 'removed'}`,
      type: 'warning'
    });
    setDeleteConfirm(null);
  };

  // Get custom entries for current Union
  const customEntries = getCustomEntriesForUnion(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion);
  const customCategoryEntries = customEntries.filter((e) => e.category === activeCategory);

  // Get merged list of all items for display
  const wardItems = getMergedWards(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion);

  let mergedItems: string[] = [];
  if (activeCategory === 'ward') {
    mergedItems = wardItems.map((w) => (language === 'en' ? w.wardNoEn : w.wardNoBn));
  } else if (activeCategory === 'village') {
    mergedItems = getMergedVillages(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  } else if (activeCategory === 'market') {
    mergedItems = getMergedMarkets(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  } else if (activeCategory === 'shoppingMall') {
    mergedItems = getMergedShoppingMalls(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  } else if (activeCategory === 'localShop') {
    mergedItems = getMergedLocalShops(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  } else if (activeCategory === 'landmark') {
    mergedItems = getMergedLandmarks(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  } else if (activeCategory === 'postOffice') {
    mergedItems = getMergedPostOffices(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, language);
  }

  const filteredMergedItems = mergedItems.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: { id: LocalCategory; labelBn: string; labelEn: string; icon: any }[] = [
    { id: 'ward', labelBn: 'ওয়ার্ড নম্বর', labelEn: 'Ward Number', icon: Layers },
    { id: 'market', labelBn: 'বাজার / মার্কেট', labelEn: 'Market / Bazar', icon: Store },
    { id: 'village', labelBn: 'গ্রাম / এলাকা', labelEn: 'Village / Area', icon: MapPin },
    { id: 'shoppingMall', labelBn: 'শপিং মল', labelEn: 'Shopping Mall', icon: Building2 },
    { id: 'localShop', labelBn: 'গ্রোসারী / দোকান', labelEn: 'Local Shop / Grocery', icon: ShoppingBag },
    { id: 'landmark', labelBn: 'পরিচিত ল্যান্ডমার্ক', labelEn: 'Landmark', icon: Compass },
    { id: 'postOffice', labelBn: 'ডাকঘর', labelEn: 'Post Office', icon: Layers }
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{language === 'bn' ? 'স্থানীয় সার্ভিস এড্রেস ডাটাবেজ ম্যানেজমেন্ট' : 'Local Service Database Management'}</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300/40">
                Level 2 Search Engine
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {language === 'bn'
                ? 'ইউনিয়ন অনুযায়ী বাজার, গ্রাম, শপিং মল, লোকাল শপ ও ল্যান্ডমার্ক সংরক্ষণ করুন। এটি ইউজারদের সার্চ ড্রপডাউনে লাইভ দেখাবে।'
                : 'Manage Markets, Villages, Malls, Shops & Landmarks per Union. Auto-populates search dropdowns for all users.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-xl border border-emerald-200/50 text-xs font-bold shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>
            {language === 'bn' ? 'অফিসিয়াল বাংলাদেশ ডাটাবেজ সক্রিয়' : 'Official BD Administrative DB Active'}
          </span>
        </div>
      </div>

      {/* 1. Cascading Union Location Selector */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 p-4.5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? '১. লোকেশন ও প্রশাসনিক ইউনিয়ন নির্বাচন করুন:' : '1. Select Location Hierarchy & Union:'}</span>
          </span>
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
            {selectedUnion} ({selectedUpazila}, {selectedDistrict})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Division */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
              {language === 'bn' ? 'বিভাগ (Division)' : 'Division'}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {divisions.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {language === 'en' ? d.nameEn : d.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
              {language === 'bn' ? 'জেলা (District)' : 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {districts.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {language === 'en' ? d.nameEn : d.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
              {language === 'bn' ? 'উপজেলা / থানা' : 'Upazila / Thana'}
            </label>
            <select
              value={selectedUpazila}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              {upazilas.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {language === 'en' ? u.nameEn : u.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Union */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
              {language === 'bn' ? 'ইউনিয়ন / পৌরসভা' : 'Union / Municipality'}
            </label>
            <select
              value={selectedUnion}
              onChange={(e) => setSelectedUnion(e.target.value)}
              className="w-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 rounded-xl p-2.5 text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500"
            >
              {unions.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {language === 'en' ? u.nameEn : u.nameBn}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Category Selector Tabs */}
      <div className="space-y-2">
        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
          {language === 'bn' ? '২. স্থানীয় সার্ভিস ক্যাটাগরি বেছে নিন:' : '2. Select Service Category:'}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-500/50'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs font-bold leading-tight">
                  {language === 'bn' ? cat.labelBn : cat.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Add New Entry Form */}
      <form onSubmit={handleAddEntry} className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-4.5 rounded-2xl space-y-3">
        <span className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>
            {language === 'bn'
              ? `নতুন ${categories.find((c) => c.id === activeCategory)?.labelBn} অন্তর্ভুক্ত করুন (${selectedUnion}-এর জন্য)`
              : `Add New ${categories.find((c) => c.id === activeCategory)?.labelEn} for ${selectedUnion}`}
          </span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder={language === 'bn' ? 'বাংলা নাম (যেমন: রাপা প্লাজা)' : 'Bangla Name'}
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder={language === 'bn' ? 'ইংরেজি নাম (যেমন: Rapa Plaza)' : 'English Name'}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3.5 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="sm:col-span-1 flex items-center gap-2">
            <button
              type="submit"
              disabled={!nameBn.trim() || isAddingEntry}
              className="flex-1 h-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingEntry ? (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ ও যুক্ত করুন' : 'Save & Add')}</span>
            </button>
            {nameBn && (
              <button
                type="button"
                onClick={() => {
                  setNameBn('');
                  setNameEn('');
                }}
                className="px-3 py-2.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                title={language === 'bn' ? 'বাতিল' : 'Cancel'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* 4. Display Existing Local Entries & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-neutral-900 dark:text-white">
              {language === 'bn'
                ? `${selectedUnion} এলাকার ${categories.find((c) => c.id === activeCategory)?.labelBn} তালিকা (${mergedItems.length})`
                : `${categories.find((c) => c.id === activeCategory)?.labelEn} List for ${selectedUnion} (${mergedItems.length})`}
            </h3>
            {customCategoryEntries.length > 0 && (
              <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-300/40">
                {customCategoryEntries.length} {language === 'bn' ? 'এডমিন কাস্টম এন্ট্রি' : 'Admin Custom Entries'}
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'bn' ? 'খুঁজুন...' : 'Search items...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-8 pr-3 py-1.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Custom Admin Added Entries Table / Cards */}
        {customCategoryEntries.length > 0 && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 p-3.5 rounded-2xl space-y-2">
            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block">
              ⭐ {language === 'bn' ? 'আপনার যোগ করা কাস্টম ডাটাবেজ এন্ট্রিগুলো:' : 'Custom Admin Entries:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {customCategoryEntries.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-800/80 p-3 rounded-xl shadow-xs flex items-center justify-between gap-2"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-500">বাংলা নাম:</label>
                          <input
                            type="text"
                            value={editBn}
                            onChange={(e) => setEditBn(e.target.value)}
                            className="w-full text-xs font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-1.5 rounded-lg"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-neutral-500">ইংরেজি নাম (ঐচ্ছিক):</label>
                          <input
                            type="text"
                            value={editEn}
                            onChange={(e) => setEditEn(e.target.value)}
                            className="w-full text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-1.5 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={!editBn.trim() || isSavingEdit}
                            onClick={() => handleSaveEdit(item.id)}
                            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSavingEdit ? (language === 'bn' ? 'সংরক্ষণ...' : 'Saving...') : (language === 'bn' ? 'সংরক্ষণ ও আপডেট করুন' : 'Save Changes')}</span>
                          </button>
                          <button
                            type="button"
                            disabled={isSavingEdit}
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'বাতিল' : 'Cancel'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-hidden">
                          <span className="font-bold text-xs text-neutral-900 dark:text-white block truncate">
                            {item.nameBn}
                          </span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                            {item.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditBn(item.nameBn);
                              setEditEn(item.nameEn);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-emerald-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ id: item.id, name: item.nameBn })}
                            className="p-1.5 text-neutral-500 hover:text-rose-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Available Suggestions Tag Cloud */}
        <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl">
          {filteredMergedItems.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-4">
              {language === 'bn' ? 'কোনো এন্ট্রি পাওয়া যায়নি' : 'No entries found'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredMergedItems.map((item, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'এন্ট্রি মুছে ফেলার নিশ্চয়তা' : 'Confirm Delete Entry'}
                </h4>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {language === 'bn'
                  ? `আপনি কি নিশ্চিতভাবে '${deleteConfirm.name}' এন্ট্রিটি ডাটাবেজ থেকে মুছে ফেলতে চান? এটি মুছে ফেললে ব্যবহারকারীরা সাজেশন হিসেবে এটি আর পাবেন না।`
                  : `Are you sure you want to permanently delete '${deleteConfirm.name}'?`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {language === 'bn' ? 'নিশ্চিত ডিলিট করুন' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
