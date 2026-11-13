/**
 * Product Approval & Review Workflow Manager (Admin & Operations Partner)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { formatPV } from '../../lib/ecommerce-data';
import { Product } from '../../types';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Eye, Store, MapPin, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

interface ProductApprovalManagerProps {
  onViewProductDetails: (product: Product) => void;
}

export const ProductApprovalManager: React.FC<ProductApprovalManagerProps> = ({
  onViewProductDetails
}) => {
  const { currentUser } = useAuth();
  const { products, approveProduct, rejectProduct } = useECommerce();

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  
  // Rejection Modal State
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const pendingProducts = products.filter((p) => !p.isApproved && p.approvalStatus !== 'Rejected');
  const approvedProducts = products.filter((p) => p.isApproved || p.approvalStatus === 'Approved');
  const rejectedProducts = products.filter((p) => p.approvalStatus === 'Rejected');

  const displayedProducts = activeTab === 'pending'
    ? pendingProducts
    : activeTab === 'approved'
    ? approvedProducts
    : rejectedProducts;

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingProduct || !rejectionReason.trim()) return;

    rejectProduct(rejectingProduct.id, rejectionReason.trim());
    setRejectingProduct(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl border border-teal-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <h2 className="text-xl font-extrabold">
              পণ্য অনুমোদন ও রিভিউ প্যানেল (Product Approval Center)
            </h2>
          </div>
          <p className="text-xs text-teal-100/80">
            ডিলার ও ভেন্ডরদের নতুন পিস প্রোডাক্ট যাচাই, কোয়ালিটি রিভিউ এবং পাবলিশিং লাইফসাইকেল
          </p>
        </div>

        {/* Counter Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-300" />
            <span>অপেক্ষমাণ ({pendingProducts.length})</span>
          </div>
          <div className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>লাইভ ({approvedProducts.length})</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-neutral-950 shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>অপেক্ষমাণ রিভিউ (Pending Approval - {pendingProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>অনুমোদিত / পাবলিশড (Approved - {approvedProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'rejected'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <XCircle className="w-4 h-4" />
          <span>ফেরত পাঠানো (Returned/Rejected - {rejectedProducts.length})</span>
        </button>
      </div>

      {/* Products List */}
      {displayedProducts.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-10 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-neutral-900 dark:text-white text-base">
            এই তালিকায় কোনো পণ্য নেই!
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {activeTab === 'pending'
              ? 'বর্তমানে কোনো ডিলারের পণ্য অনুমোদনের জন্য অপেক্ষমাণ নেই।'
              : 'সকল পণ্য যথাযথ প্রক্রিয়ায় ফিল্টার করা রয়েছে।'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800'}
                    alt={product.titleBn || product.title}
                    className="w-16 h-16 rounded-2xl object-cover border border-neutral-200 dark:border-neutral-800 shrink-0 bg-neutral-100"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {product.categoryName || 'ক্যাটাগরি'}
                    </span>
                    <h3 className="font-bold text-neutral-900 dark:text-white text-sm line-clamp-1">
                      {product.titleBn || product.title}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      ব্র্যান্ড: {product.brandName || 'TOMSHOPBD Pure'}
                    </p>
                  </div>
                </div>

                {/* Price & Details */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl text-xs font-semibold">
                  <div>
                    <span className="text-neutral-400 text-[10px] block">ডিলার প্রাইজ</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">৳{product.dealerPrice || product.mrp}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">এমআরপি (MRP)</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">৳{product.mrp}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">হিসাবকৃত PV</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">{formatPV(product.pvValue)} PV</span>
                  </div>
                </div>

                {/* Vendor / Market Details */}
                <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">{product.vendorShopName || 'ডিলার আউটলেট'}</span>
                  </div>
                  {product.marketBazar && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{product.marketBazar}</span>
                    </div>
                  )}
                </div>

                {/* Rejection Reason if applicable */}
                {product.approvalStatus === 'Rejected' && product.rejectionReason && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>রিজেক্ট করার কারণ (Return Reason):</span>
                    </span>
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium">
                      {product.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => onViewProductDetails(product)}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>বিস্তারিত দেখুন</span>
                </button>

                {activeTab === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingProduct(product)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 rounded-xl font-bold text-xs flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>ফেরত পাঠান (Reject)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => approveProduct(product.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>অনুমোদন দিন (Approve)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal with Reason */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <XCircle className="w-5 h-5" />
              <h3>পণ্য ডিলারের কাছে ফেরত পাঠান (Return Product)</h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              পণ্য: <span className="font-bold text-neutral-900 dark:text-white">{rejectingProduct.titleBn || rejectingProduct.title}</span>
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  ফেরত পাঠানোর সুনির্দিষ্ট কারণ লিখুন (Reason) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="যেমন: পণ্যের ছবি অস্পষ্ট, মূল্য বেশি ধরা হয়েছে, কিংবা তথ্য অসম্পূর্ণ।"
                  className="w-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  কনফার্ম রিজেক্ট
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
