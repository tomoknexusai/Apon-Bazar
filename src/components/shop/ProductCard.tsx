/**
 * Smart, Colorful & Clean E-Commerce Product Card for "আনো বাজার (AANO BAZAR)"
 */

import React, { useState } from 'react';
import { Product } from '../../types';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateProductPricing, formatPV } from '../../lib/pricing';
import { LazyImage } from '../common/LazyImage';
import { getProductStockLocation } from '../../services/DealerInventoryService';
import {
  Star,
  Heart,
  Scale,
  ShoppingBag,
  Eye,
  Zap,
  Tag,
  CheckCircle2,
  Truck,
  Sparkles,
  Building2
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onBuyNow
}) => {
  const { t } = useLanguage();
  const { addToCart, wishlist, toggleWishlist, compareList, toggleCompare } = useECommerce();
  const [addedToast, setAddedToast] = useState(false);

  const isWishlisted = wishlist.includes(product.id);
  const isCompared = compareList.includes(product.id);

  // Standardized pricing & PV calculation
  const pricing = calculateProductPricing(product);
  const effectivePrice = pricing.sellingPrice;
  const savings = pricing.discountAmount;
  const discountPct = pricing.discountPercent;
  const deliveryCost = pricing.deliveryCost;
  const displayPv = pricing.pv;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  return (
    <div className="group bolt-card bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border border-neutral-200/90 dark:border-neutral-800/90 hover:border-emerald-400/60 dark:hover:border-emerald-600/60 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-950/40 rounded-xl overflow-hidden flex flex-col justify-between relative transition-all duration-200">
      
      {/* Toast Feedback Banner on Add to Cart */}
      {addedToast && (
        <div className="absolute top-2 left-2 right-2 z-30 bg-emerald-600 text-white text-[11px] font-bold py-1.5 px-2.5 rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all">
          <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
          <span>কার্টে যোগ হয়েছে</span>
        </div>
      )}

      {/* Top Left Badges (Discount & PV) */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {savings > 0 && (
          <span className="px-1.5 py-0.5 bg-rose-600 text-white font-bold text-[10px] sm:text-[11px] rounded-md shadow-xs flex items-center gap-0.5">
            <span>-{discountPct}%</span>
          </span>
        )}

        {displayPv > 0 && (
          <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-[10px] rounded-md shadow-xs flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" />
            <span>{formatPV(displayPv)} PV</span>
          </span>
        )}
      </div>

      {/* Top Right Quick Actions (Wishlist & Compare) */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs border ${
            isWishlisted
              ? 'bg-rose-500 text-white border-rose-500'
              : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 hover:text-rose-500 border-neutral-200 dark:border-neutral-700'
          }`}
          title="Wishlist"
          aria-label="Wishlist"
        >
          <Heart className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(product.id);
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs border ${
            isCompared
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white/90 dark:bg-neutral-900/90 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 border-neutral-200 dark:border-neutral-700'
          }`}
          title="Compare"
          aria-label="Compare"
        >
          <Scale className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Image */}
      <div
        onClick={() => onQuickView(product)}
        className="relative overflow-hidden cursor-pointer bg-neutral-50/80 dark:bg-neutral-800/80"
      >
        <LazyImage
          src={product.images[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=600'}
          alt={product.titleBn}
          aspectRatioClass="aspect-square"
          className="group-hover:scale-102 transition-transform duration-200"
        />

        {/* Hover Quick View Badge on desktop */}
        <div className="hidden sm:flex absolute inset-0 bg-neutral-900/10 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
          <span className="px-2.5 py-1 bg-white/95 dark:bg-neutral-900/95 text-neutral-800 dark:text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>দেখুন</span>
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
        
        <div className="space-y-1">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
            <span className="truncate max-w-[110px]">{product.categoryName}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-[10px] text-neutral-400">({product.reviewsCount})</span>
            </div>
          </div>

          {/* Product Bengali Title */}
          <h3
            onClick={() => onQuickView(product)}
            className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors leading-snug min-h-[34px] sm:min-h-[38px]"
          >
            {product.titleBn}
          </h3>

          {/* Delivery & Stock Location Tag */}
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{deliveryCost === 0 ? 'ফ্রি ডেলিভারি' : `৳${deliveryCost}`}</span>
              </span>
              {product.cashbackPct > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  +{product.cashbackPct}% ক্যাশব্যাক
                </span>
              )}
            </div>

            {/* Official Trade License Stock Location */}
            {(() => {
              const stockLoc = getProductStockLocation(product);
              return (
                <div
                  className="flex items-center gap-1 text-[10px] text-neutral-600 dark:text-neutral-300 truncate"
                  title={`মজুদ অবস্থান: ${stockLoc.tradeLicenseBusinessName} | Zone: ${stockLoc.upazilaName || stockLoc.zoneName}`}
                >
                  <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate font-semibold">{stockLoc.tradeLicenseBusinessName}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Price & Action Area */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          {/* Price */}
          <div className="flex items-baseline justify-between gap-1">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                ৳{effectivePrice.toLocaleString()}
              </span>
              {savings > 0 && (
                <span className="text-xs text-neutral-400 line-through">
                  ৳{product.mrp.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: 2-Button clean grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleAddToCart}
              className="py-2 px-1 bg-neutral-100/90 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] cursor-pointer"
              title="কার্টে যোগ করুন"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">কার্ট</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 min-h-[38px] sm:min-h-[40px] cursor-pointer shadow-xs active:scale-95"
              title="অর্ডার করুন"
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">অর্ডার</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
