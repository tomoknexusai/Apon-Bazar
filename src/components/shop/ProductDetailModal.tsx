/**
 * Detailed Product Modal Component
 * Project: TOMSHOPBD (টমশপবিডি)
 */

import React, { useState } from 'react';
import { Product, ProductVariant } from '../../types';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateProductPricing, formatPV } from '../../lib/pricing';
import { ProductImageMagnifier } from './ProductImageMagnifier';
import { ClothingVariantSelector } from './ClothingVariantSelector';
import { isClothingCategory } from '../../lib/deliveryWeightCalculator';
import { getZoneForDealer } from '../../services/DeliveryZoneService';
import { getProductStockLocation, getProductMultiZoneStocks } from '../../services/DealerInventoryService';
import {
  X,
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Building2,
  Truck,
  Heart,
  Scale,
  Video,
  Plus,
  Minus,
  MessageSquare,
  CheckCircle2,
  Coins,
  Sparkles,
  MapPin,
  Store
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onBuyNowDirect: (product: Product, variant?: ProductVariant, qty?: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onBuyNowDirect
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addToCart, addReview, wishlist, toggleWishlist, compareList, toggleCompare } = useECommerce();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants?.[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // New Review State
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [showVideo, setShowVideo] = useState(false);

  if (!isOpen || !product) return null;

  const isClothing = isClothingCategory(product.category, product.categoryId, product.categoryName);
  const isClothingWithVariants = Boolean(isClothing && product.variants && product.variants.length > 0);
  const currentVariantStock = isClothingWithVariants
    ? (selectedVariant?.stock ?? selectedVariant?.stockQuantity ?? 0)
    : (product.stock || 0);
  const isOrderable = isClothingWithVariants
    ? Boolean(selectedVariant && currentVariantStock > 0)
    : (product.stock > 0);

  const displayImages = selectedVariant?.image && !product.images.includes(selectedVariant.image)
    ? [selectedVariant.image, ...product.images]
    : product.images;

  // Single-source dynamic calculation based on quantity and variant
  const pricing = calculateProductPricing(product, quantity, selectedVariant);
  const effectivePrice = pricing.sellingPrice;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addReview(product.id, newRating, newComment, currentUser?.fullName || 'সম্মানিত গ্রাহক');
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shadow transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Product Hero */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-neutral-100 dark:border-neutral-800">
          
          {/* Gallery & Video Container */}
          <div className="space-y-3">
            {showVideo ? (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-950 text-white p-6 text-center space-y-3 flex flex-col items-center justify-center border border-neutral-800">
                <Video className="w-12 h-12 text-rose-500 animate-pulse" />
                <p className="font-bold text-xs">পণ্য অরিজিনালিটি ও ফার্মিং ভিডিও প্রিভিউ</p>
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                >
                  ইউটিউবে প্লে করুন
                </a>
                <button
                  type="button"
                  onClick={() => setShowVideo(false)}
                  className="text-neutral-400 hover:text-white text-xs underline cursor-pointer"
                >
                  ছবি গ্যালারিতে ফিরে যান
                </button>
              </div>
            ) : (
              <ProductImageMagnifier
                images={displayImages && displayImages.length > 0 ? displayImages : [product.images?.[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800']}
                productTitle={product.titleBn || product.title}
                zoomLevel={2.4}
                badge={
                  product.mrp > effectivePrice ? (
                    <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-[11px] rounded-lg shadow-md">
                      ৳{product.mrp - effectivePrice} ছাড়
                    </span>
                  ) : undefined
                }
                extraAction={
                  product.videoUrl ? (
                    <button
                      type="button"
                      onClick={() => setShowVideo(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Video className="w-4 h-4" />
                      <span>ভিডিও দেখুন</span>
                    </button>
                  ) : undefined
                }
              />
            )}
          </div>

          {/* Product Overview & Purchase Matrix */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>{product.categoryName} • {product.brandName}</span>
                {pricing.pv > 0 && (
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold rounded-full flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>{formatPV(pricing.totalPv)} PV Network Point</span>
                  </span>
                )}
              </div>

              <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white leading-tight">
                {product.titleBn}
              </h2>

              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{product.rating}</span>
                  <span className="font-normal text-neutral-400">({product.reviewsCount} রিভিউ)</span>
                </div>
                <span>|</span>
                <span className="font-mono">SKU: {product.sku}</span>
                <span>|</span>
                <span className="font-mono">বারকোড: {product.barcode}</span>
              </div>

              {/* Customer-Safe Pricing Breakdown (strictly hides internal dealer costs & profits) */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                
                {/* MRP */}
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">MRP (খুচরা মূল্য):</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                    ৳ {pricing.totalMrp.toLocaleString()}
                  </span>
                </div>

                {/* Selling Price */}
                <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                  <span className="font-bold">Selling Price (বিক্রয় মূল্য):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-base">
                    ৳ {pricing.totalSellingPrice.toLocaleString()}
                  </span>
                </div>

                {/* Discount (if applicable) */}
                {pricing.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                    <span className="font-semibold">Discount ({pricing.discountPercent}% ছাড়):</span>
                    <span className="font-mono font-bold">- ৳ {pricing.totalDiscount.toLocaleString()}</span>
                  </div>
                )}

                {/* Delivery Cost */}
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">Delivery Cost (ডেলিভারি চার্জ):</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    ৳ {pricing.totalDeliveryCost.toLocaleString()}
                  </span>
                </div>

                {/* VAT/Tax */}
                <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">VAT/Tax ({pricing.vatTaxPercent}%):</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    ৳ {pricing.totalVatTax.toLocaleString()}
                  </span>
                </div>

                {/* PV (Dynamically updated for quantity) */}
                <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PV (পয়েন্ট ভ্যালু):</span>
                  </span>
                  <span className="font-mono font-black text-sm text-amber-700 dark:text-amber-300">
                    {formatPV(pricing.totalPv)} PV
                  </span>
                </div>

                {/* Total Amount */}
                <div className="flex justify-between items-center border-t border-neutral-200 dark:border-neutral-700 pt-2 font-black text-sm text-neutral-900 dark:text-white">
                  <span>Total Amount (সর্বমোট মূল্য):</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg font-black">
                    ৳ {pricing.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Variants Selector */}
              {isClothingWithVariants ? (
                <ClothingVariantSelector
                  variants={product.variants!}
                  selectedVariant={selectedVariant}
                  onSelectVariant={setSelectedVariant}
                  quantity={quantity}
                  basePrice={product.mrp || product.dealerPrice || 0}
                  onVariantImageChange={() => setActiveImageIndex(0)}
                />
              ) : product.variants && product.variants.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 text-xs block">
                    ভেরিয়েন্ট সাইজ নির্বাচন করুন:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          selectedVariant?.id === v.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-emerald-500'
                        }`}
                      >
                        {v.name || v.title || v.sku} — ৳{v.price}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-neutral-700 dark:text-neutral-300 text-xs">
                  পরিমাণ (Quantity):
                </span>
                <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold px-2 font-mono text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dealer Point / Inventory Stock Location Info */}
            {(() => {
              const stockLoc = getProductStockLocation(product);
              const multiZoneStocks = getProductMultiZoneStocks(product);
              const hasMultiZone = multiZoneStocks && multiZoneStocks.length > 1;

              return (
                <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 text-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>মজুদ অবস্থান: <strong className="font-black text-slate-900 dark:text-white">{stockLoc.tradeLicenseBusinessName}</strong></span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium pl-5">
                        Zone: <span className="font-semibold text-slate-800 dark:text-slate-200">{stockLoc.upazilaName || stockLoc.zoneName}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-neutral-500 block">উপলব্ধ মজুদ</span>
                      <strong className="text-emerald-600 font-mono font-bold text-xs">
                        {isClothingWithVariants
                          ? `${currentVariantStock} পিস`
                          : `${product.stock ?? stockLoc.availableStock} ${product.unit || 'পিস'}`}
                      </strong>
                    </div>
                  </div>

                  {/* Multi-Zone Dealer Stock Breakdown Table */}
                  {hasMultiZone && (
                    <div className="pt-2 border-t border-blue-200/80 dark:border-blue-900/60 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span>এলাকাভিত্তিক মজুদ বণ্টন (Multi-Zone Stock)</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full font-mono font-bold">
                          Total Stock = {multiZoneStocks.reduce((sum, s) => sum + s.stock, 0)} {product.unit || 'pcs'}
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-neutral-900/90 shadow-2xs">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 dark:bg-neutral-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-1.5 px-2.5 font-bold">Zone</th>
                              <th className="py-1.5 px-2.5 font-bold">Dealer / Stock Location</th>
                              <th className="py-1.5 px-2.5 text-right font-bold">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {multiZoneStocks.map((item, idx) => (
                              <tr key={item.dealerId || idx} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40">
                                <td className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                  {item.upazila || item.zoneName}
                                </td>
                                <td className="py-1.5 px-2.5 text-slate-900 dark:text-white font-bold">
                                  {item.tradeLicenseBusinessName}
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-mono font-black text-emerald-600">
                                  {item.stock}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={!isOrderable}
                onClick={() => {
                  if (!isOrderable) return;
                  addToCart(product, selectedVariant, quantity);
                  onClose();
                }}
                className={`py-3 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow ${
                  isOrderable
                    ? 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white cursor-pointer'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOrderable ? 'কার্টে যোগ করুন' : 'Unavailable'}</span>
              </button>

              <button
                type="button"
                disabled={!isOrderable}
                onClick={() => {
                  if (!isOrderable) return;
                  onBuyNowDirect(product, selectedVariant, quantity);
                  onClose();
                }}
                className={`py-3 font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isOrderable
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isOrderable ? 'এখনই অর্ডার করুন' : 'স্টক শেষ (Out of Stock)'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-neutral-100 dark:border-neutral-800 flex gap-6 text-xs font-bold text-neutral-500">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            পণ্যের পূর্ণ বিবরণ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            গ্রাহক রিভিউ ও রেটিং ({product.reviewsCount})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              <p className="text-sm font-semibold">{product.descriptionBn}</p>
              <p className="text-neutral-500">{product.description}</p>
              
              {/* Verified Seller & Dealer Geographic Info */}
              {(() => {
                const sellerZone = product.zone_id
                  ? {
                      zone_id: product.zone_id,
                      zone_name: product.zone_name || 'Thakurgaon Sadar Zone',
                      zone_name_bn: product.zone_name_bn || 'ঠাকুরগাঁও সদর জোন',
                      district_name: product.district || 'ঠাকুরগাঁও',
                      upazila_name: product.upazila || 'ঠাকুরগাঁও সদর'
                    }
                  : getZoneForDealer({ upazila: product.upazila, district: product.district });

                const sellerName = product.dealer_name || product.vendorShopName || 'Apon Bazar অনুমোদিত ডিলার';
                const dealerId = product.dealer_id || product.vendorId || 'DLR-10025';
                const shopName = product.dealer_shop_name || product.vendorShopName || 'Apon Bazar শপ';
                const locationDisplay = product.upazila && product.district
                  ? `${product.upazila}, ${product.district}`
                  : (sellerZone.upazila_name ? `${sellerZone.upazila_name}, ${sellerZone.district_name}` : 'ঠাকুরগাঁও সদর');
                const zoneDisplay = sellerZone.zone_name_bn || `${sellerZone.upazila_name} জোন`;

                return (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-neutral-50 dark:from-emerald-950/40 dark:via-neutral-900/60 dark:to-neutral-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                      <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                        <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>বিক্রেতা ও ডিলার তথ্য (Seller / Dealer Information)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        যাচাইকৃত ডিলার
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Seller / Dealer Name:</span>
                        <span className="font-bold text-neutral-900 dark:text-white block truncate">{sellerName}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Dealer ID:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 block">{dealerId}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Business / Shop Name:</span>
                        <span className="font-bold text-neutral-900 dark:text-white block truncate">{shopName}</span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Location:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate">{locationDisplay}</span>
                      </div>

                      <div className="space-y-0.5 sm:col-span-2">
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Zone:</span>
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{zoneDisplay}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700">
                            ID: {sellerZone.zone_id}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono">
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-400 text-[10px] block font-sans">ওজন (Weight):</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{product.weightKg} kg</span>
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-400 text-[10px] block font-sans">প্যাকেজিং ডায়মেনশন:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{product.dimensionsCm} cm</span>
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-400 text-[10px] block font-sans">ক্যাশ অন ডেলিভারি:</span>
                  <span className="font-bold text-emerald-600">{product.codAvailable ? 'প্রযোজ্য (COD)' : 'শুধুমাত্র অনলাইন'}</span>
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-400 text-[10px] block font-sans">ভেন্ডর শপ:</span>
                  <span className="font-bold text-neutral-900 dark:text-white truncate block">{product.vendorShopName}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 text-xs">
              {/* Existing Reviews List */}
              <div className="space-y-3">
                {product.reviews.length === 0 ? (
                  <p className="text-neutral-400 italic">এখনো কোনো রিভিউ দেওয়া হয়নি। প্রথম রিভিউটি দিন!</p>
                ) : (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-white">{rev.userName}</span>
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{rev.rating}</span>
                        </div>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-300">{rev.comment}</p>
                      <span className="text-[10px] text-neutral-400 block">{rev.date} • যাচাইকৃত সংগ্রাহক</span>
                    </div>
                  ))
                )}
              </div>

              {/* Add Review Form */}
              <form onSubmit={handleReviewSubmit} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-neutral-900 dark:text-white">আপনার মতামত ও রেটিং জমা দিন</h4>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">রেটিং:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 text-amber-400"
                      >
                        <Star className={`w-5 h-5 ${star <= newRating ? 'fill-current' : 'text-neutral-400'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="পণ্যটি আপনার কেমন লেগেছে? অভিজ্ঞতা লিখুন..."
                  rows={2}
                  required
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white text-xs"
                />

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow"
                >
                  রিভিউ জমা দিন
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
