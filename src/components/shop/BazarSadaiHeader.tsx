/**
 * Fast & Clean Smart Header for "আপন বাজার (Apon Bazar)"
 */

import React from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import { OrderChannel } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import {
  Menu,
  ShoppingBag,
  Search,
  X,
  Mic,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface BazarSadaiHeaderProps {
  onOpenMenu: () => void;
  onOpenCart: () => void;
  onOpenMultiChannel?: (channel?: OrderChannel) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const BazarSadaiHeader: React.FC<BazarSadaiHeaderProps> = ({
  onOpenMenu,
  onOpenCart,
  onOpenMultiChannel,
  searchQuery,
  setSearchQuery,
  searchInputRef
}) => {
  const { cart } = useECommerce();
  const { t } = useLanguage();

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="bolt-card bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 rounded-xl p-2.5 sm:p-3 shadow-xs">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Top Row: Logo & Primary Actions */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Hamburger + Brand Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMenu}
              className="p-1.5 -ml-1 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <BrandLogo size="sm" iconOnly={true} className="shrink-0" />

              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black text-neutral-900 dark:text-white leading-none">
                    <span className="text-emerald-700 dark:text-emerald-400">Apon</span>
                    <span className="text-orange-500 ml-1">Bazar</span>
                    <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 ml-1">
                      (আপন বাজার)
                    </span>
                  </h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-[#198754] dark:text-emerald-300 border border-[#C8E6C9] dark:border-emerald-800 rounded-full hidden sm:inline-flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                    Express
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-emerald-800 dark:text-emerald-300 font-medium leading-tight hidden xs:block">
                  — আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Order Channels & Cart */}
          <div className="flex items-center gap-1.5">
            {onOpenMultiChannel && (
              <button
                type="button"
                onClick={() => onOpenMultiChannel('whatsapp')}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="৫ চ্যানেল অর্ডার হাব"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">অর্ডার হাব</span>
              </button>
            )}

            {onOpenMultiChannel && (
              <button
                type="button"
                onClick={() => onOpenMultiChannel('voice_call')}
                className="p-1.5 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 hover:from-cyan-500/20 hover:to-pink-500/20 border border-purple-200/60 dark:border-purple-800/60 text-purple-600 dark:text-purple-300 rounded-lg cursor-pointer transition-all shadow-xs"
                title="AI ভয়েস কল অর্ডার"
                aria-label="Voice Order"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
              aria-label="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline font-bold text-xs pr-1">কার্ট</span>
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-bold text-[10px] min-w-[18px] h-4.5 px-1 rounded-full flex items-center justify-center border border-white dark:border-neutral-900 shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Search Bar Row */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            
            <input
              ref={searchInputRef as any}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য বা ক্যাটাগরি খুঁজুন (মধু, ঘি, তেল, ড্রাই ফ্রুটস...)"
              className="w-full bg-neutral-100/90 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 pl-9 pr-9 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition-colors"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
