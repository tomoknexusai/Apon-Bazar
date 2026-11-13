/**
 * Product Details View Modal
 * Project: TOMSHOPBD (টমশপবিডি)
 */

import React, { useState } from 'react';
import { Product } from '../../types';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { formatPV } from '../../lib/ecommerce-data';
import { calculateProductPricing } from '../../lib/pricing';
import { ProductImageMagnifier } from '../shop/ProductImageMagnifier';
import { getProductStockLocation, getProductMultiZoneStocks } from '../../services/DealerInventoryService';
import {
  X,
  ShoppingBag,
  Store,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Tag,
  Star,
  Award,
  Building2
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const { addToCart } = useECommerce();
  const { currentUser } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  const isStaffOrDealer = Boolean(
    currentUser && (
      currentUser.role === 'admin' ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'dealer' ||
      currentUser.role === 'merchant'
    )
  );

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'];

  const pricing = calculateProductPricing(product);
  const discountAmount = pricing.discountAmount;
  const isDiscounted = discountAmount > 0;
  const inStock = (product.stock ?? product.stockQuantity ?? 0) > 0;

  const estimatedDelivery = '২৪-৪৮ ঘণ্টার মধ্যে এক্সপ্রেস হোম ডেলিভারি';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/80 sticky top-0 z-10 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full font-bold text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{product.categoryName || 'পণ্য বিস্তারিত'}</span>
            </span>
            {product.subCategory && (
              <span className="px-2.5 py-1 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 rounded-full font-bold text-[11px]">
                {product.subCategory}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Gallery Section */}
            <div className="space-y-3">
              <ProductImageMagnifier
                images={images}
                productTitle={product.titleBn || product.title}
                zoomLevel={2.4}
                badge={
                  <div className="flex flex-col gap-1.5">
                    {isDiscounted && (
                      <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow">
                        ৳{discountAmount} ছাড়
                      </span>
                    )}
                    {product.pvValue !== undefined && product.pvValue > 0 && (
                      <span className="bg-amber-500 text-neutral-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>{formatPV(product.pvValue)} PV Points</span>
                      </span>
                    )}
                  </div>
                }
              />
            </div>

            {/* Product Meta Section */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  ব্র্যান্ড: {product.brandName || 'TOMSHOPBD Pure'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight">
                  {product.titleBn || product.title}
                </h1>
                {product.title && product.titleBn && product.title !== product.titleBn && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {product.title}
                  </p>
                )}
              </div>

              {/* Price Row */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                    ৳{pricing.sellingPrice}
                  </span>
                  {pricing.discountAmount > 0 && (
                    <span className="text-sm line-through text-neutral-400 font-semibold">
                      ৳{pricing.mrp}
                    </span>
                  )}
                  {pricing.discountPercent > 0 && (
                    <span className="text-xs bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 font-bold px-2 py-0.5 rounded-full">
                      {pricing.discountPercent}% ছাড়
                    </span>
                  )}
                  {product.unit && (
                    <span className="text-xs text-neutral-500 font-medium">
                      / প্রতি {product.unit}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs pt-1 font-semibold border-t border-emerald-200/60 dark:border-emerald-800/40">
                  {isStaffOrDealer && product.dealerPrice !== undefined && (
                    <span className="text-amber-800 dark:text-amber-300">
                      ডিলার প্রাইস: ৳{product.dealerPrice}
                    </span>
                  )}
                  {pricing.vatTaxPercent > 0 && (
                    <span className="text-neutral-600 dark:text-neutral-400">
                      VAT/Tax: {pricing.vatTaxPercent}%
                    </span>
                  )}
                  <span className="text-emerald-800 dark:text-emerald-300 font-bold ml-auto font-mono">
                    অর্জিত PV: {formatPV(pricing.pv)} Points
                  </span>
                </div>
              </div>

              {/* Shop, Market & Delivery Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-bold">
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>শপ/ডিলার: {product.vendorShopName || 'TOMSHOPBD প্রাইম আউটলেট'}</span>
                </div>

                {product.marketBazar && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>মার্কেট/বাজার: {product.marketBazar}</span>
                  </div>
                )}

                {product.googleMapsUrl && (
                  <div className="pt-1">
                    <a
                      href={product.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>গুগল ম্যাপসে দোকান বা বাজারের লোকেশন দেখুন</span>
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>আনুমানিক ডেলিভারি সময়: {estimatedDelivery}</span>
                </div>
              </div>

              {/* Official Trade License Stock Location & Multi-Zone Breakdown */}
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
                          {product.stock ?? stockLoc.availableStock} {product.unit || 'পিস'}
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

              {/* Stock & Warranty / Expiry */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-500 block font-medium">স্টক স্ট্যাটাস:</span>
                  <span className={`font-bold block text-sm mt-0.5 ${inStock ? 'text-emerald-600' : 'text-red-600'}`}>
                    {inStock ? `স্টকে আছে (${product.stock ?? product.stockQuantity ?? 0} ${product.unit || 'টি'})` : 'স্টক শেষ'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                  <span className="text-neutral-500 block font-medium">ওয়ারেন্টি / মেয়াদ:</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200 block text-xs mt-0.5">
                    {product.warranty || (product.expiryDate ? `মেয়াদ: ${product.expiryDate}` : '১০০% খাঁটি ও তাজা অর্গানিক গ্যারান্টি')}
                  </span>
                </div>
              </div>

              {/* Add to Cart Action */}
              <button
                type="button"
                onClick={() => {
                  addToCart(product, undefined, 1);
                  onClose();
                }}
                disabled={!inStock}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{inStock ? 'কার্টে যুক্ত করুন (Add to Cart)' : 'পণ্যটি বর্তমানে আউট অফ স্টক'}</span>
              </button>

            </div>

          </div>

          {/* Description Details */}
          {product.descriptionBn && (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>পণ্যের পূর্ণাঙ্গ বিবরণ ও সবিস্তার তথ্য</span>
              </h3>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {product.descriptionBn}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
