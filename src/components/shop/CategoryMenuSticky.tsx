/**
 * TOMSHOPBD — FIXED & STICKY CATEGORY MENU (ক্যাটাগরি মেনু)
 * Positioned directly above Hero Banner on the Homepage.
 * 
 * 1. Name: "ক্যাটাগরি মেনু (Category Menu)"
 * 2. Position: Header → Category Menu → Hero Banner → Homepage Content
 * 3. Sticky Behavior: Remains fixed/sticky at top when scrolling with correct offset and z-index.
 * 4. Categories: Combos, Offer Zone, Honey, Oil & Ghee, Dates, Spices, Nuts & Seeds,
 *    Beverage, Rice, Flours & Lentils, Certified, Pickle, Grocery, Food & Beverage,
 *    Organic Products, Personal Care, Household, Electronics, Fashion.
 * 5. Desktop Design: Clean horizontal navigation with TOMSHOPBD green/light-green branding.
 * 6. Mobile Design: Horizontally scrollable, smooth touch navigation, no vertical overflow.
 */

import React, { useRef, useState, useEffect } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Droplet,
  Sun,
  Wheat,
  Coffee,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingBasket,
  Apple,
  Leaf,
  Smile,
  Home,
  Tv,
  Shirt,
  Layers,
  Tag,
  Grid
} from 'lucide-react';

export interface CategoryMenuItem {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  colorClass?: string;
  subtitleBn?: string;
}

export const CATEGORY_MENU_ITEMS: CategoryMenuItem[] = [
  {
    id: 'combos',
    nameBn: 'কম্বো অফার',
    nameEn: 'Combos',
    icon: Layers,
    badge: 'MEGA',
    colorClass: 'text-amber-600 dark:text-amber-400',
    subtitleBn: 'বিশেষ প্যাকেজ'
  },
  {
    id: 'offer_zone',
    nameBn: 'অফার জোন',
    nameEn: 'Offer Zone',
    icon: Flame,
    badge: 'HOT',
    colorClass: 'text-rose-600 dark:text-rose-400',
    subtitleBn: 'স্পেশাল ডিসকাউন্ট'
  },
  {
    id: 'honey',
    nameBn: 'মধু',
    nameEn: 'Honey',
    icon: Sparkles,
    badge: '১০০% খাঁটি',
    colorClass: 'text-amber-500 dark:text-amber-400',
    subtitleBn: 'সুন্দরবন ও পাহাড়ি'
  },
  {
    id: 'oil_ghee',
    nameBn: 'তেল ও ঘি',
    nameEn: 'Oil & Ghee',
    icon: Droplet,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    subtitleBn: 'ঘানি ভাঙা ও গাওয়া'
  },
  {
    id: 'dates',
    nameBn: 'খেজুর',
    nameEn: 'Dates',
    icon: Sun,
    colorClass: 'text-amber-700 dark:text-amber-400',
    subtitleBn: 'মদিনার আজওয়া'
  },
  {
    id: 'spices',
    nameBn: 'মসলা',
    nameEn: 'Spices',
    icon: Wheat,
    colorClass: 'text-orange-600 dark:text-orange-400',
    subtitleBn: 'খাঁটি গুঁড়া ও আস্ত'
  },
  {
    id: 'nuts_seeds',
    nameBn: 'বাদাম ও বীজ',
    nameEn: 'Nuts & Seeds',
    icon: Sparkles,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    subtitleBn: 'কাজু ও চিয়া সীড'
  },
  {
    id: 'beverage',
    nameBn: 'চা ও পানীয়',
    nameEn: 'Beverage',
    icon: Coffee,
    colorClass: 'text-teal-600 dark:text-teal-400',
    subtitleBn: 'সিলেটি চা ও কফি'
  },
  {
    id: 'rice',
    nameBn: 'চাল ও চালের পণ্য',
    nameEn: 'Rice',
    icon: Wheat,
    colorClass: 'text-lime-600 dark:text-lime-400',
    subtitleBn: 'চিনিকুড়া ও নাজিরশাইল'
  },
  {
    id: 'flours_lentils',
    nameBn: 'আটা, ময়দা ও ডাল',
    nameEn: 'Flours & Lentils',
    icon: Wheat,
    colorClass: 'text-yellow-700 dark:text-yellow-500',
    subtitleBn: 'লাল গম ও দেশি ডাল'
  },
  {
    id: 'certified',
    nameBn: 'সার্টিফাইড অর্গানিক',
    nameEn: 'Certified',
    icon: ShieldCheck,
    badge: 'BSTI/ISO',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    subtitleBn: 'ল্যাব পরীক্ষিত'
  },
  {
    id: 'pickle',
    nameBn: 'আচার ও চাটনি',
    nameEn: 'Pickle',
    icon: UtensilsCrossed,
    colorClass: 'text-red-600 dark:text-red-400',
    subtitleBn: 'ঘরোয়া স্বাদের'
  },
  {
    id: 'grocery',
    nameBn: 'মুদি সামগ্রী',
    nameEn: 'Grocery',
    icon: ShoppingBasket,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    subtitleBn: 'নিত্য প্রয়োজনীয়'
  },
  {
    id: 'food_beverage',
    nameBn: 'ফুড ও বেভারেজ',
    nameEn: 'Food & Beverage',
    icon: Apple,
    colorClass: 'text-rose-500 dark:text-rose-400',
    subtitleBn: 'স্ন্যাকস ও পানীয়'
  },
  {
    id: 'organic_products',
    nameBn: 'অর্গানিক ফুডস',
    nameEn: 'Organic Products',
    icon: Leaf,
    badge: 'ORGANIC',
    colorClass: 'text-green-600 dark:text-green-400',
    subtitleBn: 'প্রাকৃতিক পুষ্টি'
  },
  {
    id: 'personal_care',
    nameBn: 'পার্সোনাল কেয়ার',
    nameEn: 'Personal Care',
    icon: Smile,
    colorClass: 'text-pink-600 dark:text-pink-400',
    subtitleBn: 'ত্বক ও চুলের যত্ন'
  },
  {
    id: 'household',
    nameBn: 'গৃহস্থালি সামগ্রী',
    nameEn: 'Household',
    icon: Home,
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    subtitleBn: 'ক্লিনিং ও হোম'
  },
  {
    id: 'electronics',
    nameBn: 'ইলেকট্রনিক্স',
    nameEn: 'Electronics',
    icon: Tv,
    colorClass: 'text-blue-600 dark:text-blue-400',
    subtitleBn: 'গ্যাজেট ও হোম'
  },
  {
    id: 'fashion',
    nameBn: 'ফ্যাশন ও লাইফস্টাইল',
    nameEn: 'Fashion',
    icon: Shirt,
    colorClass: 'text-purple-600 dark:text-purple-400',
    subtitleBn: 'পোশাক ও এক্সেসরিজ'
  }
];

export interface CategoryMenuStickyProps {
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  className?: string;
}

export const CategoryMenuSticky: React.FC<CategoryMenuStickyProps> = ({
  selectedCategoryId,
  onSelectCategory,
  className = ''
}) => {
  const { selectedCategory, setSelectedCategory } = useECommerce();
  const currentSelectedCategory = selectedCategoryId !== undefined ? selectedCategoryId : selectedCategory;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isScrolledSticky, setIsScrolledSticky] = useState(false);

  // Check scroll position to show/hide left/right navigation arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  // Monitor window scroll to adjust elevation slightly when sticky
  useEffect(() => {
    const handleWindowScroll = () => {
      if (typeof window !== 'undefined') {
        setIsScrolledSticky(window.scrollY > 40);
      }
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (id: string) => {
    if (onSelectCategory) {
      onSelectCategory(id);
    } else {
      setSelectedCategory(id);
    }
    // Smooth scroll down to products section if clicked while hero banner is in view
    if (typeof window !== 'undefined') {
      const productSection = document.getElementById('tomshopbd-main-catalog-section');
      if (productSection) {
        const yOffset = -140;
        const y = productSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      id="tomshopbd-fixed-category-menu"
      aria-label="ক্যাটাগরি মেনু (Category Menu)"
      className={`w-full bg-[#F4FAF6]/98 dark:bg-neutral-900/98 backdrop-blur-md border-t border-[#C8E6C9] dark:border-emerald-950/80 transition-shadow duration-200 ${
        isScrolledSticky ? 'shadow-sm' : ''
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
        
        {/* Menu Bar Header / Title & Controls Container */}
        <div className="flex items-center gap-2 relative">
          
          {/* Menu Title Badge: "ক্যাটাগরি মেনু (Category Menu)" */}
          <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-neutral-800 rounded-lg border border-[#C8E6C9] dark:border-neutral-700 shadow-2xs select-none">
            <div className="w-5 h-5 rounded-md bg-[#198754] text-white flex items-center justify-center shrink-0">
              <Grid className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[11px] sm:text-xs font-black text-[#157347] dark:text-emerald-400 whitespace-nowrap">
                ক্যাটাগরি মেনু
              </span>
              <span className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tighter whitespace-nowrap hidden xs:inline">
                Category Menu
              </span>
            </div>
          </div>

          {/* Left Scroll Navigation Button (Desktop) */}
          {showLeftArrow && (
            <button
              type="button"
              onClick={handleScrollLeft}
              className="hidden md:flex absolute left-28 lg:left-32 z-10 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-[#C8E6C9] dark:border-neutral-700 text-[#157347] dark:text-emerald-400 items-center justify-center shadow-md hover:bg-emerald-50 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Horizontally Scrollable Categories Container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5 px-1 snap-x scroll-smooth select-none touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* 0. "সকল ক্যাটাগরি / All Categories" Button */}
            <button
              id="cat-menu-item-all"
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`snap-start shrink-0 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer min-h-[38px] ${
                currentSelectedCategory === 'all'
                  ? 'bg-[#198754] text-white border-[#157347] shadow-sm ring-2 ring-emerald-300/60 dark:ring-emerald-600/40'
                  : 'bg-white dark:bg-neutral-800/90 text-neutral-800 dark:text-neutral-200 border-[#C8E6C9] dark:border-neutral-700 hover:border-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-neutral-700/80'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${currentSelectedCategory === 'all' ? 'text-amber-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <div className="flex flex-col text-left leading-tight">
                <span className="whitespace-nowrap font-black">সকল পণ্য</span>
                <span className={`text-[9px] font-semibold whitespace-nowrap ${currentSelectedCategory === 'all' ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                  All Items
                </span>
              </div>
            </button>

            {/* 19 Specific Categories Requested */}
            {CATEGORY_MENU_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isSelected = currentSelectedCategory === item.id;

              return (
                <button
                  key={item.id}
                  id={`cat-menu-item-${item.id}`}
                  type="button"
                  onClick={() => handleCategoryClick(item.id)}
                  className={`snap-start shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer min-h-[38px] group relative ${
                    isSelected
                      ? 'bg-[#198754] text-white border-[#157347] shadow-sm ring-2 ring-emerald-300/60 dark:ring-emerald-600/40'
                      : 'bg-white dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-200 border-[#C8E6C9] dark:border-neutral-700 hover:border-emerald-400 hover:bg-emerald-50/70 dark:hover:bg-neutral-700/80 hover:text-[#157347]'
                  }`}
                  title={`${item.nameBn} (${item.nameEn}) - ${item.subtitleBn || ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E8F5E9] dark:bg-neutral-700 text-[#198754] dark:text-emerald-400'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex flex-col text-left leading-tight pr-0.5">
                    <div className="flex items-center gap-1">
                      <span className="whitespace-nowrap font-black">
                        {item.nameBn}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[8px] font-extrabold px-1 py-0.2 rounded-full uppercase leading-none tracking-tight ${
                            isSelected
                              ? 'bg-amber-400 text-neutral-950 font-black'
                              : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-semibold whitespace-nowrap ${
                        isSelected ? 'text-emerald-100' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {item.nameEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Navigation Button (Desktop) */}
          {showRightArrow && (
            <button
              type="button"
              onClick={handleScrollRight}
              className="hidden md:flex absolute right-1 z-10 w-7 h-7 rounded-full bg-white dark:bg-neutral-800 border border-[#C8E6C9] dark:border-neutral-700 text-[#157347] dark:text-emerald-400 items-center justify-center shadow-md hover:bg-emerald-50 dark:hover:bg-neutral-700 transition-all cursor-pointer active:scale-95"
              aria-label="Scroll categories right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>
    </nav>
  );
};
