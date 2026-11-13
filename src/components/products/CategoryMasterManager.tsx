/**
 * Master Data Category Management (Admin Only)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCategory } from '../../types';
import { Plus, Edit3, Trash2, Tag, Check, X, ShieldAlert, Sparkles, FolderPlus } from 'lucide-react';

export const CategoryMasterManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { categories, addCategory, editCategory, deleteCategory } = useECommerce();

  const isAdmin = currentUser.primaryRole === 'admin' || currentUser.primaryRole === 'super_admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [subCategoriesInput, setSubCategoriesInput] = useState('');

  const handleOpenModal = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setNameBn(cat.nameBn);
      setNameEn(cat.name);
      setSubCategoriesInput(cat.subCategories ? cat.subCategories.join(', ') : '');
    } else {
      setEditingCategory(null);
      setNameBn('');
      setNameEn('');
      setSubCategoriesInput('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim() || !nameEn.trim()) return;

    const subCats = subCategoriesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      editCategory(editingCategory.id, {
        name: nameEn.trim(),
        nameBn: nameBn.trim(),
        slug,
        subCategories: subCats.length > 0 ? subCats : ['সাধারণ সাব-ক্যাটাগরি']
      });
    } else {
      addCategory({
        name: nameEn.trim(),
        nameBn: nameBn.trim(),
        slug,
        icon: 'Sparkles',
        subCategories: subCats.length > 0 ? subCats : ['সাধারণ সাব-ক্যাটাগরি']
      });
    }

    setIsModalOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-6 rounded-3xl text-center space-y-2">
        <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
        <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">
          কেবলমাত্র এডমিন এক্সেস (Admin Permission Required)
        </h3>
        <p className="text-xs text-amber-700 dark:text-amber-300">
          ডিলার এবং অপারেশন্স পার্টনারগণ ক্যাটাগরি তৈরি বা পরিবর্তন করতে পারবেন না। আপনারা কেবল বিদ্যমান ক্যাটালগ থেকে নির্বাচন করতে পারবেন।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-black text-neutral-900 dark:text-white">
              মাস্টার ক্যাটাগরি ও সাব-ক্যাটাগরি ম্যানেজমেন্ট (Master Categories)
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            কেবল এডমিন ক্যাটাগরি যুক্ত, সংশোধন ও ডিলিট করতে পারবেন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md text-xs flex items-center gap-2 whitespace-nowrap self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>নতুন ক্যাটাগরি যোগ করুন</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                    {cat.nameBn}
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block font-medium">
                    {cat.name}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold rounded-full">
                  {cat.slug}
                </span>
              </div>

              {/* Sub Categories Tags */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-bold text-neutral-400 block">সাব-ক্যাটাগরি সমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(cat.subCategories || ['সাধারণ']).map((sub, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium rounded-lg border border-neutral-200 dark:border-neutral-700"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => handleOpenModal(cat)}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>সম্পাদনা</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`আপনি কি "${cat.nameBn}" ক্যাটাগরিটি মুছে ফেলতে চান?`)) {
                    deleteCategory(cat.id);
                  }
                }}
                className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>মুছুন</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-black text-neutral-900 dark:text-white text-base">
                {editingCategory ? 'ক্যাটাগরি সম্পাদনা করুন' : 'নতুন মাস্টার ক্যাটাগরি তৈরি করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ক্যাটাগরি নাম (বাংলা) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: খাঁটি মধু ও ডেইরি"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category Name (English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Honey & Organic Dairy"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  সাব-ক্যাটাগরি কমা দিয়ে লিখুন (Sub Categories - Comma Separated)
                </label>
                <textarea
                  value={subCategoriesInput}
                  onChange={(e) => setSubCategoriesInput(e.target.value)}
                  rows={3}
                  placeholder="সুন্দরবনের মধু, খাঁটি ঘি, ডেইরি মিল্ক, অর্গানিক বাটার"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
