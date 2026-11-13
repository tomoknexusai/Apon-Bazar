import React from 'react';
import { PlaceType } from '../../../types/local-address';
import {
  MapPin,
  Building2,
  Store,
  ShoppingBag,
  Compass,
  Mail,
  Plus
} from 'lucide-react';

interface LocationManagementActionButtonsProps {
  onAddUnion: () => void;
  onAddWard: () => void;
  onAddPlace: (type: PlaceType) => void;
}

export const LocationManagementActionButtons: React.FC<LocationManagementActionButtonsProps> = ({
  onAddUnion,
  onAddWard,
  onAddPlace
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 dark:from-neutral-800/80 dark:via-neutral-800/60 dark:to-neutral-800/80 border border-emerald-200 dark:border-emerald-800/70 rounded-3xl p-5 shadow-sm space-y-4">
      {/* SECTION 1: LOCATION MANAGEMENT */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#198754] text-white flex items-center justify-center shadow-xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-300">
              LOCATION MANAGEMENT (প্রশাসনিক অবস্থান ব্যবস্থাপনা)
            </h3>
          </div>
          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold bg-emerald-100/80 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300/50">
            Tier 4 & 5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-action-add-new-union"
            onClick={onAddUnion}
            className="group py-3.5 px-4 bg-[#198754] hover:bg-[#157347] text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-2 ring-emerald-400/40 active:scale-[0.99]"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span>+ Add New Union (নতুন ইউনিয়ন)</span>
          </button>

          <button
            type="button"
            id="btn-action-add-new-ward"
            onClick={onAddWard}
            className="group py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-2xl shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer ring-2 ring-emerald-500/40 active:scale-[0.99]"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <span>+ Add New Ward (নতুন ওয়ার্ড)</span>
          </button>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-emerald-200/80 dark:border-emerald-800/40" />

      {/* SECTION 2: LOCAL PLACE MANAGEMENT */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Store className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-teal-300">
              LOCAL PLACE MANAGEMENT (স্থানীয় স্থান ও বাজার ব্যবস্থাপনা)
            </h3>
          </div>
          <span className="text-[10px] text-teal-800 dark:text-teal-400 font-semibold bg-teal-100/80 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-300/50">
            Tier 6 (Local Service Points)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {/* + Add Village Name */}
          <button
            type="button"
            id="btn-action-add-village-name"
            onClick={() => onAddPlace('village')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">+ Village</span>
          </button>

          {/* + Add Area Name */}
          <button
            type="button"
            id="btn-action-add-area-name"
            onClick={() => onAddPlace('area')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">+ Area</span>
          </button>

          {/* + Add Bazar Name */}
          <button
            type="button"
            id="btn-action-add-bazar-name"
            onClick={() => onAddPlace('bazar')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 ring-1 ring-amber-400/50"
          >
            <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">+ Bazar</span>
          </button>

          {/* + Add Market Name */}
          <button
            type="button"
            id="btn-action-add-market-name"
            onClick={() => onAddPlace('market')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate">+ Market</span>
          </button>

          {/* + Add Shopping Mall */}
          <button
            type="button"
            id="btn-action-add-shopping-mall"
            onClick={() => onAddPlace('shopping_mall')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">+ Mall</span>
          </button>

          {/* + Add Local Shop */}
          <button
            type="button"
            id="btn-action-add-local-shop"
            onClick={() => onAddPlace('local_shop')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">+ Local Shop</span>
          </button>

          {/* + Add Grocery */}
          <button
            type="button"
            id="btn-action-add-grocery"
            onClick={() => onAddPlace('grocery')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">+ Grocery</span>
          </button>

          {/* + Add Landmark */}
          <button
            type="button"
            id="btn-action-add-landmark"
            onClick={() => onAddPlace('landmark')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate">+ Landmark</span>
          </button>

          {/* + Add Post Office */}
          <button
            type="button"
            id="btn-action-add-post-office"
            onClick={() => onAddPlace('post_office')}
            className="py-2.5 px-2 bg-white dark:bg-neutral-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-orange-300 dark:border-orange-700 text-orange-950 dark:text-orange-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 ring-1 ring-orange-400/40"
          >
            <Plus className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="truncate">+ Post Office</span>
          </button>
        </div>
      </div>
    </div>
  );
};
