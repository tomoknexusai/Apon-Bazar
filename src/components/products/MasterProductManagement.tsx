/**
 * Master Product Management System
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { formatPV } from '../../lib/ecommerce-data';
import { calculateProductPricing } from '../../lib/pricing';
import { getProductStockLocation } from '../../services/DealerInventoryService';
import { Product } from '../../types';
import { ProductEntryModal } from './ProductEntryModal';
import { ProductDetailsModal } from './ProductDetailsModal';
import { CategoryMasterManager } from './CategoryMasterManager';
import { BrandMasterManager } from './BrandMasterManager';
import { ProductApprovalManager } from './ProductApprovalManager';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Layers,
  Flame,
  Star,
  ShieldCheck,
  Building2,
  BadgePercent
} from 'lucide-react';

interface MasterProductManagementProps {
  initialTab?: 'catalog' | 'add_product' | 'categories' | 'brands' | 'approvals';
}

export const MasterProductManagement: React.FC<MasterProductManagementProps> = ({
  initialTab = 'catalog'
}) => {
  const { currentUser } = useAuth();
  const { categories, brands, products, deleteProduct } = useECommerce();

  const userRole = currentUser?.primaryRole || currentUser?.roles?.[0] || 'customer';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isOpsPartner = userRole === 'operations_partner';
  const isDealer = userRole === 'dealer' || userRole === 'vendor';

  // Permission Check for Product Listing:
  // Approved Dealers, Operations Partners, and Admin can add products
  const canAddProduct = isAdmin || isOpsPartner || isDealer;

  const [activeTab, setActiveTab] = useState<'catalog' | 'categories' | 'brands' | 'approvals'>(
    initialTab === 'categories' && isAdmin
      ? 'categories'
      : initialTab === 'brands' && isAdmin
      ? 'brands'
      : initialTab === 'approvals' && (isAdmin || isOpsPartner)
      ? 'approvals'
      : 'catalog'
  );

  // Modals State
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [specialFilter, setSpecialFilter] = useState<'all' | 'new_arrival' | 'featured' | 'best_selling' | 'discount'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'pv_high'>('newest');

  // Sub-categories list based on selected category
  const selectedCatObj = categories.find((c) => c.id === selectedCategory);
  const availableSubCats = selectedCatObj?.subCategories || [];

  // Dynamically filter available brands based on selected Category and Subcategory
  const availableBrandsForFilter = brands.filter((b) => {
    if (selectedCategory !== 'all') {
      if (b.categoryIds && b.categoryIds.length > 0 && !b.categoryIds.includes(selectedCategory)) {
        return false;
      }
    }
    if (selectedSubCategory !== 'all') {
      if (b.subCategories && b.subCategories.length > 0 && !b.subCategories.includes(selectedSubCategory)) {
        return false;
      }
    }
    return true;
  });

  // Handle Add Product Button
  const handleOpenAddProduct = () => {
    if (!canAddProduct) {
      alert('দুঃখিত! পন্য যোগ করার ক্ষমতা কেবল অনুমোদিত ডিলার, অপারেশন্স পার্টনার এবং এডমিনদের জন্য প্রযোজ্য।');
      return;
    }
    setEditingProduct(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsEntryModalOpen(true);
  };

  const handleViewDetails = (prod: Product) => {
    setSelectedProductDetails(prod);
    setIsDetailsModalOpen(true);
  };

  // Pending Count for Approval Badge
  const pendingCount = products.filter((p) => !p.isApproved && p.approvalStatus !== 'Rejected').length;

  // Filtered Products List
  const filteredProducts = products.filter((product) => {
    // Visibility: In Catalog, non-admins only see Approved products unless it's their own pending product
    const isApproved = product.isApproved || product.approvalStatus === 'Approved';
    const isOwnProduct = product.vendorId === currentUser.id;
    if (!isAdmin && !isOpsPartner && !isApproved && !isOwnProduct) {
      return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (product.titleBn || '').toLowerCase().includes(q) || (product.title || '').toLowerCase().includes(q);
      const matchSku = (product.sku || '').toLowerCase().includes(q);
      const matchBrand = (product.brandName || '').toLowerCase().includes(q);
      const matchCat = (product.categoryName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSku && !matchBrand && !matchCat) return false;
    }

    // Category Filter
    if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
      return false;
    }

    // Sub Category Filter
    if (selectedSubCategory !== 'all' && product.subCategory !== selectedSubCategory) {
      return false;
    }

    // Brand Filter
    if (selectedBrand !== 'all' && product.brandId !== selectedBrand) {
      return false;
    }

    // Special Filter Tabs
    if (specialFilter === 'new_arrival' && !product.isNewArrival && product.createdAt && new Date(product.createdAt) < new Date('2026-01-01')) {
      // Show newest products
    } else if (specialFilter === 'featured' && !product.isFeatured) {
      return false;
    } else if (specialFilter === 'best_selling' && !product.isBestSelling && (product.reviewsCount || 0) < 5) {
      return false;
    } else if (specialFilter === 'discount') {
      const discount = product.discountPrice || product.discount || 0;
      if (discount <= 0) return false;
    }

    return true;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discountPrice || a.campaignPrice || a.mrp || 0;
    const priceB = b.discountPrice || b.campaignPrice || b.mrp || 0;

    if (sortBy === 'price_low') return priceA - priceB;
    if (sortBy === 'price_high') return priceB - priceA;
    if (sortBy === 'pv_high') return (b.pvValue || 0) - (a.pvValue || 0);
    return (b.id || '').localeCompare(a.id || '');
  });

  return (
    <div className="space-y-6">
      
      {/* Title & Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-300" />
            <h1 className="text-xl sm:text-2xl font-black">
              মাস্টার প্রোডাক্ট ম্যানেজমেন্ট সিস্টেম (Master Product Management)
            </h1>
          </div>
          <p className="text-xs text-emerald-100/80">
            ক্যাটাগরি, ব্র্যান্ড, অটোমেটিক পিভি ক্যালকুলেশন, ডিলার প্রোডাক্ট পোস্টিং ও কোয়ালিটি রিভিউ পোর্টাল
          </p>
        </div>

        {/* Add Product CTA Button */}
        {canAddProduct && (
          <button
            type="button"
            onClick={handleOpenAddProduct}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-neutral-950 font-black rounded-2xl shadow-lg text-xs flex items-center gap-2 whitespace-nowrap transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>নতুন পণ্য লিস্টিং করুন (Add Product)</span>
          </button>
        )}
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 text-xs font-bold">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* 1. Catalog Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>পণ্য ক্যাটালগ (Product Catalog)</span>
          </button>

          {/* 2. Category Master Data (Admin Only) */}
          <button
            type="button"
            onClick={() => {
              if (isAdmin) setActiveTab('categories');
              else alert('ক্যাটাগরি মাস্টার ডেটা কেবল এডমিন পরিবর্তন করতে পারেন।');
            }}
            className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>ক্যাটাগরি মাস্টার (Master Categories)</span>
            {!isAdmin && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
          </button>

          {/* 3. Brand Master Data (Admin Only) */}
          <button
            type="button"
            onClick={() => {
              if (isAdmin) setActiveTab('brands');
              else alert('ব্র্যান্ড মাস্টার ডেটা কেবল এডমিন পরিবর্তন করতে পারেন।');
            }}
            className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 ${
              activeTab === 'brands'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>ব্র্যান্ড মাস্টার (Master Brands)</span>
            {!isAdmin && <Lock className="w-3 h-3 text-amber-500 ml-0.5" />}
          </button>

          {/* 4. Product Approvals (Admin & Ops Partner) */}
          {(isAdmin || isOpsPartner) && (
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 ${
                activeTab === 'approvals'
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>পণ্য রিভিউ ও অনুমোদন ({pendingCount})</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

        </div>

        {/* Quick Permission Status Badge */}
        <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>রোল: <strong className="uppercase">{userRole}</strong></span>
        </div>
      </div>

      {/* Tab Content Renderer */}
      {activeTab === 'categories' ? (
        <CategoryMasterManager />
      ) : activeTab === 'brands' ? (
        <BrandMasterManager />
      ) : activeTab === 'approvals' ? (
        <ProductApprovalManager onViewProductDetails={handleViewDetails} />
      ) : (
        /* Catalog Tab with Full Search, Filter & Display */
        <div className="space-y-6">
          
          {/* Controls Bar: Search, Category, Brand, Sub Category & Special Tabs */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
            
            {/* Search + Sort Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="পণ্য, ক্যাটাগরি, ব্র্যান্ড অথবা SKU কোড দিয়ে খুঁজুন..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 py-2.5 text-xs font-bold"
                >
                  <option value="newest">সদ্য যুক্ত হওয়া পণ্য (Newest First)</option>
                  <option value="price_low">মূল্য: কম থেকে বেশি (Price Low to High)</option>
                  <option value="price_high">মূল্য: বেশি থেকে কম (Price High to Low)</option>
                  <option value="pv_high">সর্বোচ্চ PV পয়েন্ট (Highest PV First)</option>
                </select>
              </div>
            </div>

            {/* Filter Dropdowns: Category, Sub Category, Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">ক্যাটাগরি ফিল্টার</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubCategory('all');
                    setSelectedBrand('all');
                  }}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-xs font-medium"
                >
                  <option value="all">সকল ক্যাটাগরি (All Categories)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">সাব-ক্যাটাগরি ফিল্টার</label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => {
                    setSelectedSubCategory(e.target.value);
                    setSelectedBrand('all');
                  }}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-xs font-medium"
                >
                  <option value="all">সকল সাব-ক্যাটাগরি</option>
                  {availableSubCats.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 mb-1">ব্র্যান্ড ফিল্টার</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-xs font-medium"
                >
                  <option value="all">সকল ব্র্যান্ড (All Brands)</option>
                  {availableBrandsForFilter.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Special Collection Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs font-bold">
              <span className="text-[11px] font-bold text-neutral-400 mr-1">কালেকশন:</span>
              
              <button
                type="button"
                onClick={() => setSpecialFilter('all')}
                className={`px-3 py-1.5 rounded-xl border transition-all ${
                  specialFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}
              >
                সবকটি পণ্য ({filteredProducts.length})
              </button>

              <button
                type="button"
                onClick={() => setSpecialFilter('new_arrival')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                  specialFilter === 'new_arrival'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>New Arrival</span>
              </button>

              <button
                type="button"
                onClick={() => setSpecialFilter('featured')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                  specialFilter === 'featured'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Featured</span>
              </button>

              <button
                type="button"
                onClick={() => setSpecialFilter('best_selling')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                  specialFilter === 'best_selling'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Best Selling</span>
              </button>

              <button
                type="button"
                onClick={() => setSpecialFilter('discount')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 ${
                  specialFilter === 'discount'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
                }`}
              >
                <BadgePercent className="w-3.5 h-3.5 text-red-500" />
                <span>Discount Offers</span>
              </button>
            </div>

          </div>

          {/* Product Cards Grid */}
          {sortedProducts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 text-center space-y-3">
              <Package className="w-12 h-12 text-neutral-400 mx-auto" />
              <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                কোনো পণ্য পাওয়া যায়নি!
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                আপনার অনুসন্ধানের ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProducts.map((product) => {
                const isApproved = product.isApproved || product.approvalStatus === 'Approved';
                const isOwnProduct = product.vendorId === currentUser.id;

                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-3">
                      
                      {/* Image Frame */}
                      <div className="relative aspect-square rounded-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'}
                          alt={product.titleBn || product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />

                        {/* PV Badge */}
                        {product.pvValue !== undefined && product.pvValue > 0 && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-neutral-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            <span>{formatPV(product.pvValue)} PV</span>
                          </div>
                        )}

                        {/* Approval Status Badge */}
                        {!isApproved && (
                          <div className="absolute top-2 right-2 bg-amber-500 text-neutral-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow">
                            Pending Approval
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-bold">
                          <span>{product.categoryName}</span>
                          <span>{product.brandName}</span>
                        </div>

                        <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                          {product.titleBn || product.title}
                        </h3>
                      </div>

                      {/* Pricing */}
                      {(() => {
                        const pricing = calculateProductPricing(product);
                        return (
                          <div className="bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-baseline justify-between text-xs">
                            <div>
                              <span className="font-black text-emerald-700 dark:text-emerald-400 text-base">
                                ৳{pricing.sellingPrice}
                              </span>
                              {pricing.discountAmount > 0 && (
                                <span className="text-[10px] line-through text-neutral-400 font-semibold ml-1.5">
                                  ৳{pricing.mrp}
                                </span>
                              )}
                            </div>

                            {product.dealerPrice && (isAdmin || isOpsPartner || isDealer) && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                ডিলার ৳{product.dealerPrice}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Stock Location */}
                      {(() => {
                        const stockLoc = getProductStockLocation(product);
                        return (
                          <div className="px-2.5 py-1.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 text-[11px] space-y-0.5">
                            <div className="flex items-center gap-1 text-blue-800 dark:text-blue-300 font-bold truncate">
                              <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">মজুদ: {stockLoc.tradeLicenseBusinessName}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 pl-4 truncate">
                              Zone: {stockLoc.upazilaName || stockLoc.zoneName} ({product.stock ?? stockLoc.availableStock} {product.unit || 'পিস'})
                            </div>
                          </div>
                        );
                      })()}

                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(product)}
                        className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>বিস্তারিত</span>
                      </button>

                      {/* Edit/Delete permissions */}
                      {(isAdmin || (isDealer && isOwnProduct)) && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(product)}
                            className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`পণ্যটি ডিরেক্টরি থেকে মুছে ফেলতে চান?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Entry Modal */}
      {isEntryModalOpen && (
        <ProductEntryModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          editProductData={editingProduct}
        />
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedProductDetails && (
        <ProductDetailsModal
          product={selectedProductDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}

    </div>
  );
};
