/**
 * Master Centralized Brand Management System
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { Brand, BrandType } from '../../types';
import { normalizeBrandName } from '../../lib/ecommerce-data';
import {
  Award,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Edit3,
  Trash2,
  ShieldAlert,
  Layers,
  X,
  AlertTriangle,
  Building2
} from 'lucide-react';

export const BrandMasterManager: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    brands,
    categories,
    addBrand,
    editBrand,
    deleteBrand,
    brandRequests,
    approveBrandRequest,
    rejectBrandRequest
  } = useECommerce();

  const isAdmin = currentUser.primaryRole === 'admin' || currentUser.primaryRole === 'super_admin';

  // Sub-tabs: 'master_list' | 'requests'
  const [activeTab, setActiveTab] = useState<'master_list' | 'requests'>('master_list');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandType, setSelectedBrandType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [brandType, setBrandType] = useState<BrandType>('National/Established Brand');
  const [countryOfOrigin, setCountryOfOrigin] = useState('Bangladesh');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState<string>('');
  const [modalSubCategory, setModalSubCategory] = useState<string>('');

  // Rejection Dialog State
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleOpenModal = (b?: Brand) => {
    if (b) {
      setEditingBrand(b);
      setName(b.name);
      setBrandType(b.brandType || 'National/Established Brand');
      setCountryOfOrigin(b.countryOfOrigin || 'Bangladesh');
      setLogoUrl(b.logoUrl || '');
      setDescription(b.description || '');
      const catId = b.categoryIds?.[0] || categories[0]?.id || '';
      setModalCategoryId(catId);
      const catObj = categories.find((c) => c.id === catId);
      const defaultSub = b.subCategories?.[0] || catObj?.subCategories?.[0] || '';
      setModalSubCategory(defaultSub);
    } else {
      setEditingBrand(null);
      setName('');
      setBrandType('National/Established Brand');
      setCountryOfOrigin('Bangladesh');
      setLogoUrl('');
      setDescription('');
      const defaultCatId = categories[0]?.id || '';
      setModalCategoryId(defaultCatId);
      const catObj = categories.find((c) => c.id === defaultCatId);
      setModalSubCategory(catObj?.subCategories?.[0] || '');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('অনুগ্রহ করে ব্র্যান্ডের নাম প্রদান করুন।');
      return;
    }

    if (!modalCategoryId) {
      alert('ব্র্যান্ড যোগ করার পূর্বে অবশ্যই প্যারেন্ট ক্যাটাগরি নির্বাচন করতে হবে!');
      return;
    }

    if (!modalSubCategory) {
      alert('ব্র্যান্ড যোগ করার পূর্বে অবশ্যই সাব-ক্যাটাগরি নির্বাচন করতে হবে!');
      return;
    }

    const selectedCat = categories.find((c) => c.id === modalCategoryId);
    if (editingBrand) {
      editBrand(editingBrand.id, {
        name: name.trim(),
        brandType,
        countryOfOrigin: countryOfOrigin.trim() || 'Bangladesh',
        logoUrl: logoUrl.trim() || undefined,
        description: description.trim() || undefined,
        categoryId: modalCategoryId,
        categoryName: selectedCat?.name,
        categoryNameBn: selectedCat?.nameBn,
        categoryIds: [modalCategoryId],
        subCategories: [modalSubCategory]
      });
    } else {
      const res = addBrand({
        name: name.trim(),
        brandType,
        countryOfOrigin: countryOfOrigin.trim() || 'Bangladesh',
        logoUrl: logoUrl.trim() || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=150',
        description: description.trim() || `${name.trim()} - খাঁটি প্রিমিয়াম ব্র্যান্ড`,
        status: 'active',
        categoryId: modalCategoryId,
        categoryName: selectedCat?.name,
        categoryNameBn: selectedCat?.nameBn,
        categoryIds: [modalCategoryId],
        subCategories: [modalSubCategory]
      });

      if (!res.success) {
        alert(res.message);
        return;
      }
    }

    setIsModalOpen(false);
  };

  // Filtered Master Brands
  const filteredBrands = brands.filter((b) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchOrigin = (b.countryOfOrigin || '').toLowerCase().includes(q);
      if (!matchName && !matchOrigin) return false;
    }

    if (selectedBrandType !== 'all' && b.brandType !== selectedBrandType) {
      return false;
    }

    if (selectedCategory !== 'all') {
      if (!b.categoryIds || (!b.categoryIds.includes(selectedCategory) && b.categoryIds.length > 0)) {
        return false;
      }
    }

    return true;
  });

  const pendingRequests = brandRequests.filter((r) => r.status === 'pending');

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-6 rounded-3xl text-center space-y-2">
        <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
        <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">
          কেবলমাত্র এডমিন এক্সেস (Admin Permission Required)
        </h3>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          ডিলার ও সাধারণ ব্যবহারকারীগণ নতুন ব্র্যান্ড তৈরি করতে পারবেন না। পণ্য যুক্ত করার সময় আপনারা বিদ্যমান মাস্টার ব্র্যান্ড নির্বাচন অথবা ব্র্যান্ড অনুমোদনের জন্য আবেদন পেশ করতে পারেন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Navigation */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                সেন্ট্রাল ব্র্যান্ড মাস্টার ডাটাবেজ (Central Brand Master)
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              সকল ১৮ টি মাস্টার ক্যাটাগরির অন্তর্ভুক্ত ব্র্যান্ড নিয়ন্ত্রণ, টাইপিং, এবং ডিলার ব্র্যান্ড অনুমোদনের কেন্দ্রীয় হাব।
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-2xl shadow-md text-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন মাস্টার ব্র্যান্ড যোগ করুন</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('master_list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'master_list'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>সকল ব্র্যান্ডস তালিকা ({brands.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'requests'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ব্র্যান্ড অনুমোদনের আবেদন ({pendingRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'master_list' && (
        <>
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ব্র্যান্ড নাম অথবা দেশ অনুসন্ধান করুন..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Brand Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-neutral-400" />
              <select
                value={selectedBrandType}
                onChange={(e) => setSelectedBrandType(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">সকল ব্র্যান্ড টাইপ</option>
                <option value="National/Established Brand">National/Established Brand</option>
                <option value="Local Brand">Local Brand</option>
                <option value="Other Brand">Other Brand</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => {
              const categoryNames = (brand.categoryIds || [])
                .map((cid) => categories.find((c) => c.id === cid)?.nameBn)
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={brand.id}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-100 flex items-center justify-center p-1">
                        <img
                          src={brand.logoUrl || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=150'}
                          alt={brand.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        brand.brandType === 'National/Established Brand'
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40'
                          : brand.brandType === 'Local Brand'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {brand.brandType || 'Brand'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-neutral-900 dark:text-white text-base group-hover:text-amber-600 transition-colors">
                        {brand.name}
                      </h3>
                      {brand.countryOfOrigin && (
                        <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-0.5">
                          <Globe className="w-3 h-3 text-neutral-400" />
                          <span>{brand.countryOfOrigin}</span>
                        </div>
                      )}
                    </div>

                    {categoryNames && (
                      <div className="text-[10px] bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 line-clamp-2">
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">ক্যাটাগরি:</span> {categoryNames}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(brand)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`আপনি কি "${brand.name}" ব্র্যান্ডটি মুছে ফেলতে চান?`)) {
                          deleteBrand(brand.id);
                        }
                      }}
                      className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Brand Requests Approval View */}
      {activeTab === 'requests' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">
              ডিলার ও পার্টনারদের ব্র্যান্ড অনুমোদনের আবেদনসমূহ (Pending Requests)
            </h3>
            <span className="text-xs text-neutral-500 font-medium">
              সর্বমোট পেন্ডিং: {pendingRequests.length}
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="font-bold text-sm">কোনো পেন্ডিং ব্র্যান্ড আবেদন নেই!</p>
              <p className="text-xs text-neutral-400">সকল ব্র্যান্ড রিকোয়েস্ট প্রক্রিয়াজাত করা হয়েছে।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const normReq = normalizeBrandName(req.brandName);
                const existingMatch = brands.find((b) => normalizeBrandName(b.name) === normReq);

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-neutral-900 dark:text-white text-base">
                          {req.brandName}
                        </span>
                        <span className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300/40">
                          {req.brandType}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-600 dark:text-neutral-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span><strong>আবেদনকারী:</strong> {req.requestedByUserName} ({req.requestedByUserRole})</span>
                        <span><strong>ক্যাটাগরি:</strong> {req.categoryName}</span>
                        <span><strong>দেশ/উৎপত্তি:</strong> {req.countryOfOrigin || 'N/A'}</span>
                        <span><strong>তারিখ:</strong> {req.createdAt}</span>
                      </div>

                      {/* Normalization Duplicate Alert Warning */}
                      {existingMatch && (
                        <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 text-red-800 dark:text-red-300 p-2.5 rounded-xl text-xs flex items-center gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>
                            <strong>সতর্কতা (Duplicate Detection):</strong> মাস্টার তালিকায় সমজাতীয় নাম <strong>"{existingMatch.name}"</strong> বিদ্যমান আছে। অনুমোদন দিলে ডুপ্লিকেট তৈরি হবে!
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => approveBrandRequest(req.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>অনুমোদন করুন (Approve)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRejectingRequestId(req.id);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl font-bold text-xs flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>বাতিল করুন</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal for Creating / Editing Master Brand */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-black text-neutral-900 dark:text-white text-base">
                {editingBrand ? 'মাস্টার ব্র্যান্ড এডিট করুন' : 'নতুন মাস্টার ব্র্যান্ড যুক্ত করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full text-neutral-400 hover:bg-neutral-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ব্র্যান্ডের নাম (Brand Name) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: Teer, PRAN, Radhuni, Walton"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    ব্র্যান্ড টাইপ (Brand Type)
                  </label>
                  <select
                    value={brandType}
                    onChange={(e) => setBrandType(e.target.value as BrandType)}
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                  >
                    <option value="National/Established Brand">National/Established Brand</option>
                    <option value="Local Brand">Local Brand</option>
                    <option value="Other Brand">Other Brand</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    উৎপাদনকারী দেশ (Origin Country)
                  </label>
                  <input
                    type="text"
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="যেমন: Bangladesh"
                    className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  লোগো ছবি URL (Logo Image URL)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>

              {/* Step 1: Parent Category Selection */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ১. প্যারেন্ট ক্যাটাগরি (Parent Category) <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalCategoryId}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    setModalCategoryId(newCatId);
                    const catObj = categories.find((c) => c.id === newCatId);
                    setModalSubCategory(catObj?.subCategories?.[0] || '');
                  }}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold text-xs"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Subcategory Selection */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ২. সাব-ক্যাটাগরি (Subcategory) <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalSubCategory}
                  onChange={(e) => setModalSubCategory(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold text-xs"
                  required
                >
                  {(categories.find((c) => c.id === modalCategoryId)?.subCategories || ['সাধারণ সাব-ক্যাটাগরি']).map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ব্র্যান্ড বিবরণ (Description)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="ব্র্যান্ড সম্পর্কিত তথ্য..."
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow"
                >
                  {editingBrand ? 'হালনাগাদ করুন' : 'মাস্টার ব্র্যান্ড তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-red-600">
              ব্র্যান্ড রিকোয়েস্ট বাতিলের কারণ (Rejection Reason)
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="যেমন: এই ব্র্যান্ডটি ইতিমধ্যে 'ACI' নামে মাস্টার তালিকায় উপস্থিত আছে।"
              rows={3}
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectBrandRequest(rejectingRequestId, rejectionReason || 'মাস্টার ব্র্যান্ড পলিসি অনুযায়ী নাম গ্রহণযোগ্য নয়।');
                  setRejectingRequestId(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow"
              >
                প্রত্যাখ্যান নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
