/**
 * Bolt-Style Fast & Clean ProductSection Component for "আনো বাজার (AANO BAZAR)"
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { useECommerceContext } from '../../context/ECommerceContext';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '../common/ProductCardSkeleton';
import {
  Flame,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  PackageX,
  Grid,
  TrendingUp
} from 'lucide-react';

export type FilterCriteriaType =
  | 'top_selling'
  | 'new_arrivals'
  | 'best_offers'
  | 'high_pv'
  | 'all'
  | string
  | ((product: Product) => boolean)
  | { categoryId?: string; tag?: string; minRating?: number; maxPrice?: number };

export interface ProductSectionProps {
  title?: string;
  subtitle?: string;
  filterCriteria?: FilterCriteriaType;
  sectionType?: 'top_selling' | 'new_arrivals' | 'best_offers' | 'high_pv' | 'category' | 'custom';
  customProducts?: Product[];
  categoryId?: string;
  icon?: React.ReactNode;
  badgeText?: string;
  limit?: number;
  layout?: 'horizontal_scroll' | 'carousel' | 'grid';
  onQuickView?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onViewAll?: () => void;
  className?: string;
  isLoadingOverride?: boolean;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  title,
  subtitle,
  filterCriteria = 'top_selling',
  sectionType,
  customProducts,
  categoryId,
  icon,
  badgeText,
  limit = 8,
  layout: initialLayout = 'horizontal_scroll',
  onQuickView,
  onBuyNow,
  onViewAll,
  className = '',
  isLoadingOverride
}) => {
  const { products, orders } = useECommerceContext();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const normalizedInitialLayout = initialLayout === 'grid' ? 'grid' : 'horizontal_scroll';
  const [layoutMode, setLayoutMode] = useState<'horizontal_scroll' | 'grid'>(normalizedInitialLayout);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [filterCriteria, sectionType, categoryId, products.length, orders.length]);

  const activeLoadingState = isLoadingOverride !== undefined ? isLoadingOverride : isLoading;

  const productSalesMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (Array.isArray(orders)) {
      orders.forEach((order) => {
        if (order.orderStatus !== 'cancelled') {
          order.items?.forEach((item) => {
            const pId = item.productId || item.product?.id;
            if (pId) {
              map[pId] = (map[pId] || 0) + (item.quantity || 1);
            }
          });
        }
      });
    }
    return map;
  }, [orders]);

  const displayedProducts = useMemo(() => {
    let result: Product[] = [];

    if (customProducts && customProducts.length > 0) {
      result = [...customProducts];
    } else {
      const baseProducts = [...products];
      const effectiveCriteria = sectionType || filterCriteria;

      if (typeof effectiveCriteria === 'function') {
        result = baseProducts.filter(effectiveCriteria);
      } else if (typeof effectiveCriteria === 'object' && effectiveCriteria !== null) {
        const { categoryId: cId, tag, minRating, maxPrice } = effectiveCriteria;
        result = baseProducts.filter((p) => {
          if (cId && cId !== 'all' && p.categoryId !== cId) return false;
          if (tag && !p.tags?.includes(tag)) return false;
          if (minRating && p.rating < minRating) return false;
          const effPrice = p.campaignPrice || (p.mrp - p.discount);
          if (maxPrice && effPrice > maxPrice) return false;
          return true;
        });
      } else {
        const criteriaStr = String(effectiveCriteria);

        switch (criteriaStr) {
          case 'top_selling':
            result = baseProducts.sort((a, b) => {
              const salesA = productSalesMap[a.id] || 0;
              const salesB = productSalesMap[b.id] || 0;
              if (salesB !== salesA) return salesB - salesA;
              const tagScoreA = (a.tags?.includes('Best Seller') ? 10 : 0) + a.rating;
              const tagScoreB = (b.tags?.includes('Best Seller') ? 10 : 0) + b.rating;
              return tagScoreB - tagScoreA;
            });
            break;

          case 'new_arrivals':
            result = baseProducts.sort((a, b) => {
              const isNewA = a.tags?.includes('New') ? 1 : 0;
              const isNewB = b.tags?.includes('New') ? 1 : 0;
              if (isNewB !== isNewA) return isNewB - isNewA;
              return b.id.localeCompare(a.id);
            });
            break;

          case 'best_offers':
          case 'discount':
            result = baseProducts
              .filter((p) => {
                const effPrice = p.campaignPrice || (p.mrp - p.discount);
                return p.mrp > effPrice;
              })
              .sort((a, b) => {
                const savingsA = a.mrp - (a.campaignPrice || (a.mrp - a.discount));
                const savingsB = b.mrp - (b.campaignPrice || (b.mrp - b.discount));
                return savingsB - savingsA;
              });
            break;

          case 'high_pv':
            result = baseProducts
              .filter((p) => p.pvValue > 0)
              .sort((a, b) => b.pvValue - a.pvValue);
            break;

          case 'category':
            if (categoryId && categoryId !== 'all') {
              result = baseProducts.filter((p) => p.categoryId === categoryId);
            } else {
              result = baseProducts;
            }
            break;

          case 'all':
            result = baseProducts;
            break;

          default:
            result = baseProducts.filter(
              (p) =>
                p.categoryId === criteriaStr ||
                p.tags?.includes(criteriaStr) ||
                p.titleBn.toLowerCase().includes(criteriaStr.toLowerCase())
            );
            break;
        }
      }
    }

    return limit && limit > 0 ? result.slice(0, limit) : result;
  }, [products, customProducts, filterCriteria, sectionType, categoryId, limit, productSalesMap]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const headerConfig = useMemo(() => {
    let defTitle = title;
    let defSubtitle = subtitle;
    let defIcon = icon;
    let defBadge = badgeText;

    if (!defTitle) {
      switch (sectionType || filterCriteria) {
        case 'top_selling':
          defTitle = 'সেরা বিক্রিত পণ্য (Top Selling)';
          defSubtitle = 'গ্রাহকদের পছন্দের সেরা খাদ্য ও অর্গানিক সামগ্রী';
          defIcon = <Flame className="w-4 h-4 text-amber-500" />;
          defBadge = 'জনপ্রিয়';
          break;
        case 'new_arrivals':
          defTitle = 'নতুন সংকলন (New Arrivals)';
          defSubtitle = 'সদ্য যুক্ত হওয়া ফ্রেশ অর্গানিক কালেকশন';
          defIcon = <Sparkles className="w-4 h-4 text-emerald-500" />;
          defBadge = 'নতুন';
          break;
        case 'best_offers':
          defTitle = 'বিশেষ ছাড়ের অফার (Best Deals)';
          defSubtitle = 'আকর্ষণীয় মূল্যে সেরা ছাড়ের পণ্যসমূহ';
          defIcon = <Flame className="w-4 h-4 text-rose-500" />;
          defBadge = 'মেগা ছাড়';
          break;
        default:
          defTitle = 'প্রোডাক্টস';
          defIcon = <Sparkles className="w-4 h-4 text-emerald-500" />;
          break;
      }
    }

    return {
      title: defTitle,
      subtitle: defSubtitle,
      icon: defIcon,
      badge: defBadge
    };
  }, [title, subtitle, icon, badgeText, sectionType, filterCriteria]);

  const handleQuickViewSafe = (product: Product) => {
    if (onQuickView) onQuickView(product);
  };

  const handleBuyNowSafe = (product: Product) => {
    if (onBuyNow) onBuyNow(product);
  };

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Clean Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {headerConfig.icon}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-none">
              {headerConfig.title}
            </h2>
            {headerConfig.subtitle && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 hidden sm:block">
                {headerConfig.subtitle}
              </p>
            )}
          </div>
          {headerConfig.badge && (
            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded">
              {headerConfig.badge}
            </span>
          )}
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-1.5">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-0.5 px-1.5 py-1"
            >
              <span>সব দেখুন</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setLayoutMode('horizontal_scroll')}
              className={`p-1 rounded text-xs transition-colors ${
                layoutMode === 'horizontal_scroll'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Horizontal Scroll"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`p-1 rounded text-xs transition-colors ${
                layoutMode === 'grid'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Carousel Arrows */}
          {layoutMode === 'horizontal_scroll' && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Rendering */}
      {activeLoadingState ? (
        <ProductGridSkeleton count={4} />
      ) : displayedProducts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center space-y-2">
          <PackageX className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="text-xs text-neutral-500">কোনো পণ্য পাওয়া যায়নি</p>
        </div>
      ) : layoutMode === 'horizontal_scroll' ? (
        <div
          ref={scrollRef}
          className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x"
        >
          {displayedProducts.map((prod) => (
            <div
              key={prod.id}
              className="w-[165px] sm:w-[210px] md:w-[225px] shrink-0 snap-start flex flex-col justify-between"
            >
              <ProductCard
                product={prod}
                onQuickView={handleQuickViewSafe}
                onBuyNow={handleBuyNowSafe}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {displayedProducts.map((prod) => (
            <div key={prod.id} className="flex flex-col justify-between">
              <ProductCard
                product={prod}
                onQuickView={handleQuickViewSafe}
                onBuyNow={handleBuyNowSafe}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
