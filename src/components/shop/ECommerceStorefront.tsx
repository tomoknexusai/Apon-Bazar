/**
 * Fast, Clean & Minimal Bolt-Style E-Commerce Homepage for "আনো বাজার (AANO BAZAR)"
 */

import React, { useState, useRef } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, ProductVariant, OrderChannel } from '../../types';

// Sub-Components
import { BazarSadaiBannerCarousel } from './BazarSadaiBannerCarousel';
import { BazarSadaiDrawer } from './BazarSadaiDrawer';
import { BazarSadaiFloatingCart } from './BazarSadaiFloatingCart';
import { ProductCard } from './ProductCard';
import { ProductSection } from './ProductSection';
import { ProductDetailModal } from './ProductDetailModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrderTrackerModal } from './OrderTrackerModal';
import { CompareModal } from './CompareModal';
import { GoogleMapLogisticsView } from './GoogleMapLogisticsView';
import { VendorProductFormModal } from './VendorProductFormModal';
import { MultiChannelOrderModal } from './MultiChannelOrderModal';
import { NetworkMemberProfileModal } from '../profile/NetworkMemberProfileModal';
import { CustomerAuthModal } from '../auth/CustomerAuthModal';

import {
  Sparkles,
  Plus,
  SlidersHorizontal,
  ShoppingBag,
  Building2,
  Tag,
  Grid
} from 'lucide-react';

export const ECommerceStorefront: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, isLoggedIn } = useAuth();
  const {
    categories,
    products,
    selectedCategory,
    setSelectedCategory,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useECommerce();

  // Search & Filter States
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'rating' | 'pv'>('featured');
  const [showCodOnly, setShowCodOnly] = useState(false);

  // UI Modal & Navigation Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isVendorFormOpen, setIsVendorFormOpen] = useState(false);
  const [showMapSection, setShowMapSection] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMultiChannelOpen, setIsMultiChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<OrderChannel>('whatsapp');

  // Search Input Ref for focusing from bottom nav
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [directBuyItem, setDirectBuyItem] = useState<{
    product: Product;
    selectedVariant?: ProductVariant;
    quantity: number;
  } | undefined>(undefined);

  const [pendingDirectBuy, setPendingDirectBuy] = useState<{
    product: Product;
    selectedVariant?: ProductVariant;
    quantity: number;
  } | undefined>(undefined);

  // Filter matching helper supporting 19 Category Menu items + standard category IDs
  const matchesCategoryFilter = (p: Product, catId: string): boolean => {
    if (catId === 'all') return true;

    const tBn = (p.titleBn || '').toLowerCase();
    const tEn = (p.title || '').toLowerCase();
    const cName = (p.categoryName || '').toLowerCase();
    const catRefId = (p.categoryId || '').toLowerCase();
    const tags = (p.tags || []).map((t) => t.toLowerCase()).join(' ');

    switch (catId) {
      case 'combos':
        return (
          tBn.includes('কম্বো') ||
          tEn.includes('combo') ||
          tBn.includes('প্যাক') ||
          tags.includes('combo') ||
          (p.discount > 0 && p.mrp >= 800)
        );
      case 'offer_zone':
        return p.discount > 0 || Boolean(p.campaignPrice) || tags.includes('offer') || tags.includes('deal');
      case 'honey':
        return tBn.includes('মধু') || tEn.includes('honey') || cName.includes('honey') || tags.includes('honey');
      case 'oil_ghee':
        return (
          tBn.includes('তেল') ||
          tBn.includes('ঘি') ||
          tEn.includes('oil') ||
          tEn.includes('ghee') ||
          cName.includes('oil')
        );
      case 'dates':
        return tBn.includes('খেজুর') || tBn.includes('আজওয়া') || tEn.includes('date') || tags.includes('dates');
      case 'spices':
        return (
          tBn.includes('মসলা') ||
          tBn.includes('মরিচ') ||
          tBn.includes('হলুদ') ||
          tBn.includes('জিরা') ||
          tBn.includes('ধনিয়া') ||
          tEn.includes('spice')
        );
      case 'nuts_seeds':
        return (
          tBn.includes('বাদাম') ||
          tBn.includes('কাজু') ||
          tBn.includes('কাঠবাদাম') ||
          tBn.includes('বীজ') ||
          tBn.includes('চিয়া') ||
          tEn.includes('nut') ||
          tEn.includes('seed')
        );
      case 'beverage':
        return (
          catRefId === 'cat-beverage' ||
          tBn.includes('চা') ||
          tBn.includes('কফি') ||
          tBn.includes('পানীয়') ||
          tBn.includes('পানীয়') ||
          tEn.includes('tea') ||
          tEn.includes('coffee') ||
          tEn.includes('beverage')
        );
      case 'rice':
        return (
          tBn.includes('চাল') ||
          tBn.includes('চিনিকুড়া') ||
          tBn.includes('বাসমতি') ||
          tBn.includes('নাজিরশাইল') ||
          tEn.includes('rice')
        );
      case 'flours_lentils':
        return (
          tBn.includes('আটা') ||
          tBn.includes('ময়দা') ||
          tBn.includes('ডাল') ||
          tBn.includes('মসুর') ||
          tEn.includes('flour') ||
          tEn.includes('atta') ||
          tEn.includes('dal') ||
          tEn.includes('lentil')
        );
      case 'certified':
        return (
          Boolean(p.isOrganicCertified) ||
          tags.includes('certified') ||
          tags.includes('organic') ||
          tBn.includes('খাঁটি') ||
          tBn.includes('সার্টিফাইড')
        );
      case 'pickle':
        return tBn.includes('আচার') || tBn.includes('চাটনি') || tEn.includes('pickle');
      case 'grocery':
        return catRefId === 'cat-grocery' || cName.includes('grocery') || cName.includes('মুদি');
      case 'food_beverage':
        return catRefId === 'cat-grocery' || catRefId === 'cat-beverage' || cName.includes('food');
      case 'organic_products':
        return Boolean(p.isOrganicCertified) || tags.includes('organic') || tBn.includes('অর্গানিক') || tBn.includes('প্রাকৃতিক');
      case 'personal_care':
        return catRefId === 'cat-personal-care' || cName.includes('personal') || tBn.includes('শ্যাম্পু') || tBn.includes('সাবান');
      case 'household':
        return (
          catRefId === 'cat-home-cleaning' ||
          catRefId === 'cat-kitchen-household' ||
          cName.includes('cleaning') ||
          cName.includes('household')
        );
      case 'electronics':
        return (
          catRefId === 'cat-electronics' ||
          catRefId === 'cat-mobile-accessories' ||
          catRefId === 'cat-computer-it' ||
          cName.includes('electronics')
        );
      case 'fashion':
        return (
          catRefId === 'cat-clothing-fashion' ||
          catRefId === 'cat-footwear' ||
          cName.includes('fashion') ||
          cName.includes('clothing')
        );
      default:
        return p.categoryId === catId;
    }
  };

  // Filtered Products Algorithm
  const filteredProducts = products
    .filter((p) => {
      const query = globalSearchQuery.trim().toLowerCase();
      if (query) {
        const matchTitle =
          p.titleBn.toLowerCase().includes(query) || p.title.toLowerCase().includes(query);
        const matchCat = p.categoryName.toLowerCase().includes(query);
        const matchSku = p.sku.toLowerCase().includes(query);
        if (!matchTitle && !matchCat && !matchSku) return false;
      }

      if (selectedCategory !== 'all' && !matchesCategoryFilter(p, selectedCategory)) return false;
      if (selectedBrandId !== 'all' && p.brandId !== selectedBrandId) return false;
      if (selectedWarehouseId !== 'all' && p.warehouseId !== selectedWarehouseId) return false;
      if (showCodOnly && !p.codAvailable) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') {
        return (a.campaignPrice || a.mrp - a.discount) - (b.campaignPrice || b.mrp - b.discount);
      }
      if (sortBy === 'price_high') {
        return (b.campaignPrice || b.mrp - b.discount) - (a.campaignPrice || a.mrp - a.discount);
      }
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'pv') return b.pvValue - a.pvValue;
      return 0;
    });

  const handleQuickView = (product: Product) => {
    setSelectedProductDetail(product);
    setIsDetailModalOpen(true);
  };

  const handleBuyNowDirect = (product: Product, variant?: ProductVariant, qty = 1) => {
    if (!isLoggedIn) {
      setPendingDirectBuy({ product, selectedVariant: variant, quantity: qty });
      setIsAuthModalOpen(true);
    } else {
      setDirectBuyItem({ product, selectedVariant: variant, quantity: qty });
      setIsCheckoutOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    if (pendingDirectBuy) {
      setDirectBuyItem(pendingDirectBuy);
      setIsCheckoutOpen(true);
      setPendingDirectBuy(undefined);
    }
  };

  const handleResetFilters = () => {
    setGlobalSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrandId('all');
    setSelectedWarehouseId('all');
    setShowCodOnly(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isVendorOrAdmin =
    currentUser?.primaryRole === 'super_admin' ||
    currentUser?.primaryRole === 'admin' ||
    currentUser?.primaryRole === 'vendor' ||
    currentUser?.primaryRole === 'dealer';

  return (
    <div id="tomshopbd-storefront-root" className="space-y-3 sm:space-y-4 pb-20 text-neutral-900 dark:text-neutral-100 min-h-screen">
      
      {/* Main Storefront Container — starts directly with website banner and products */}
      <div id="tomshopbd-main-content-container" className="max-w-7xl mx-auto px-2.5 sm:px-4 space-y-4 pt-1">
        
        {/* HERO BANNER CAROUSEL — DIRECTLY BELOW CATEGORY MENU */}
        <BazarSadaiBannerCarousel
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            window.scrollTo({ top: 350, behavior: 'smooth' });
          }}
        />

        {/* Horizontal Product Sections (Top Selling & New Arrivals) */}
        {selectedCategory === 'all' && !globalSearchQuery && (
          <div className="space-y-4">
            <ProductSection
              title="সেরা বিক্রিত পণ্য (Top Selling)"
              filterCriteria="top_selling"
              limit={8}
              layout="horizontal_scroll"
              onQuickView={handleQuickView}
              onBuyNow={(p) => handleBuyNowDirect(p)}
            />

            <ProductSection
              title="নতুন সংকলন (New Arrivals)"
              filterCriteria="new_arrivals"
              limit={8}
              layout="horizontal_scroll"
              onQuickView={handleQuickView}
              onBuyNow={(p) => handleBuyNowDirect(p)}
            />
          </div>
        )}

        {/* 5. Main Catalog Product Grid & Filter Bar */}
        <section id="tomshopbd-main-catalog-section" className="space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {selectedCategory === 'all'
                    ? 'সকল পণ্য'
                    : categories.find((c) => c.id === selectedCategory)?.nameBn || 'পণ্যসমূহ'}{' '}
                  ({filteredProducts.length})
                </span>
              </h2>

              <button
                type="button"
                onClick={() => setShowMapSection(!showMapSection)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline sm:hidden flex items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{showMapSection ? 'ম্যাপ লুকান' : 'ডিপো ম্যাপ'}</span>
              </button>
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-end">
              
              <button
                type="button"
                onClick={() => setShowMapSection(!showMapSection)}
                className="hidden sm:flex text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline items-center gap-1 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{showMapSection ? 'ম্যাপ লুকান' : 'লজিস্টিকস ম্যাপ'}</span>
              </button>

              {isVendorOrAdmin && (
                <button
                  type="button"
                  onClick={() => setIsVendorFormOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন পণ্য</span>
                </button>
              )}

              {/* Sorting */}
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <SlidersHorizontal className="w-3 h-3 text-neutral-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                >
                  <option value="featured">ফিচার্ড</option>
                  <option value="price_low">মূল্য: কম → বেশি</option>
                  <option value="price_high">মূল্য: বেশি → কম</option>
                  <option value="rating">রেটিং</option>
                  <option value="pv">PV পয়েন্ট</option>
                </select>
              </div>

            </div>

          </div>

          {/* Interactive Depot Map */}
          {showMapSection && <GoogleMapLogisticsView />}

          {/* Responsive 2-Column Mobile / Multi-column Desktop Grid */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-neutral-400 mx-auto" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                কোনো পণ্য পাওয়া যায়নি
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                সার্চ বা ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
              {filteredProducts.map((prod) => (
                <div key={prod.id} className="flex flex-col justify-between">
                  <ProductCard
                    product={prod}
                    onQuickView={handleQuickView}
                    onBuyNow={(p) => handleBuyNowDirect(p)}
                  />
                </div>
              ))}
            </div>
          )}

        </section>

      </div>

      {/* Floating Cart Button */}
      <BazarSadaiFloatingCart onOpenCart={() => setIsCartOpen(true)} />

      {/* Navigation Drawer */}
      <BazarSadaiDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedCatId={selectedCategory}
        onSelectCategory={(catId) => setSelectedCategory(catId)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderTracker={() => setIsTrackerOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onToggleMap={() => setShowMapSection(!showMapSection)}
        onOpenMultiChannel={(channel) => {
          setSelectedChannel(channel || 'whatsapp');
          setIsMultiChannelOpen(true);
        }}
      />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onBuyNowDirect={(product, variant, qty) =>
          handleBuyNowDirect(product, variant, qty)
        }
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenCheckout={() => {
          setDirectBuyItem(undefined);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectBuyItem(undefined);
        }}
        directProductOrder={directBuyItem}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

      <VendorProductFormModal
        isOpen={isVendorFormOpen}
        onClose={() => setIsVendorFormOpen(false)}
      />

      <NetworkMemberProfileModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        pendingProductName={pendingDirectBuy?.product.titleBn}
        pendingQuantity={pendingDirectBuy?.quantity}
      />

      <MultiChannelOrderModal
        isOpen={isMultiChannelOpen}
        onClose={() => setIsMultiChannelOpen(false)}
        initialChannel={selectedChannel}
      />

    </div>
  );
};
