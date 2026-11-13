import React from 'react';
import { ChevronRight, FolderTree, Layers, Building2, Boxes, Check } from 'lucide-react';
import { ProductCategory, Brand } from '../../types';

interface WarehouseItem {
  id: string;
  name: string;
}

interface ProductHierarchyBreadcrumbProps {
  selectedCategory: string;
  selectedSubCategory: string;
  selectedBrand: string;
  selectedWarehouse?: string;
  categories: ProductCategory[];
  availableBrands: Brand[];
  warehouses?: WarehouseItem[];
}

export const ProductHierarchyBreadcrumb: React.FC<ProductHierarchyBreadcrumbProps> = ({
  selectedCategory,
  selectedSubCategory,
  selectedBrand,
  selectedWarehouse = '',
  categories,
  availableBrands,
  warehouses = []
}) => {
  const categoryObj = categories.find((c) => c.id === selectedCategory);
  const brandObj = availableBrands.find((b) => b.id === selectedBrand);
  const warehouseObj = warehouses.find((w) => w.id === selectedWarehouse);

  const stepsCompleted = (selectedCategory ? 1 : 0) +
    (selectedSubCategory ? 1 : 0) +
    (selectedBrand ? 1 : 0) +
    (selectedWarehouse ? 1 : 0);

  return (
    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center justify-between">
        <span>লাইভ হায়্যারার্কিক্যাল পজিশন (Breadcrumb Navigation)</span>
        <span className="text-[10px] text-emerald-600 font-semibold">
          {stepsCompleted === 4 ? '১০০% সম্পূর্ণ' : `${stepsCompleted * 25}% ধাপ`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
        {/* Step 1: Category */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition ${
            selectedCategory
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
              : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            selectedCategory ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
          }`}>
            {selectedCategory ? <Check className="w-2.5 h-2.5" /> : '১'}
          </div>
          <FolderTree className={`w-3.5 h-3.5 shrink-0 ${selectedCategory ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="truncate max-w-[140px]" title={categoryObj?.nameBn || 'ক্যাটাগরি'}>
            {categoryObj?.nameBn || '১. ক্যাটাগরি'}
          </span>
        </div>

        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedCategory ? 'text-emerald-500' : 'text-slate-300'}`} />

        {/* Step 2: Subcategory */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition ${
            selectedSubCategory
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
              : selectedCategory
              ? 'bg-amber-50/80 text-amber-900 border border-amber-200 font-medium'
              : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
          }`}
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            selectedSubCategory ? 'bg-emerald-600 text-white' : selectedCategory ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'
          }`}>
            {selectedSubCategory ? <Check className="w-2.5 h-2.5" /> : '২'}
          </div>
          <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedSubCategory ? 'text-emerald-600' : selectedCategory ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="truncate max-w-[140px]" title={selectedSubCategory || 'সাব-ক্যাটাগরি'}>
            {selectedSubCategory || '২. সাব-ক্যাটাগরি'}
          </span>
        </div>

        <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedSubCategory ? 'text-emerald-500' : 'text-slate-300'}`} />

        {/* Step 3: Brand */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition ${
            selectedBrand
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
              : selectedSubCategory
              ? 'bg-amber-50/80 text-amber-900 border border-amber-200 font-medium'
              : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
          }`}
        >
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            selectedBrand ? 'bg-emerald-600 text-white' : selectedSubCategory ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'
          }`}>
            {selectedBrand ? <Check className="w-2.5 h-2.5" /> : '৩'}
          </div>
          <Building2 className={`w-3.5 h-3.5 shrink-0 ${selectedBrand ? 'text-emerald-600' : selectedSubCategory ? 'text-amber-600' : 'text-slate-400'}`} />
          <span className="truncate max-w-[140px]" title={brandObj?.name || 'ব্র্যান্ড'}>
            {brandObj?.name || '৩. ব্র্যান্ড'}
          </span>
        </div>

        {warehouses.length > 0 && (
          <>
            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${selectedBrand ? 'text-emerald-500' : 'text-slate-300'}`} />

            {/* Step 4: Warehouse */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md transition ${
                selectedWarehouse
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold'
                  : selectedBrand
                  ? 'bg-amber-50/80 text-amber-900 border border-amber-200 font-medium'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 opacity-60'
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                selectedWarehouse ? 'bg-emerald-600 text-white' : selectedBrand ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                {selectedWarehouse ? <Check className="w-2.5 h-2.5" /> : '৪'}
              </div>
              <Boxes className={`w-3.5 h-3.5 shrink-0 ${selectedWarehouse ? 'text-emerald-600' : selectedBrand ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[140px]" title={warehouseObj?.name || 'ওয়্যারহাউজ'}>
                {warehouseObj?.name || '৪. ওয়্যারহাউজ'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
