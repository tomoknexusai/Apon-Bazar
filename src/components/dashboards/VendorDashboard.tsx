/**
 * Vendor / Dealer Dashboard Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useECommerce } from '../../context/ECommerceContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { VendorProductFormModal } from '../shop/VendorProductFormModal';
import { OrderRoutingManagerHub } from '../shop/OrderRoutingManagerHub';
import { getZoneForDealer } from '../../services/DeliveryZoneService';
import { getProductStockLocation } from '../../services/DealerInventoryService';
import { calculateProductPricing } from '../../lib/pricing';
import { Store, ShieldCheck, MapPin, Award, TrendingUp, CheckCircle2, Plus, Package, ShoppingBag, Compass, Building2 } from 'lucide-react';
import { motion } from 'motion/react';

export const VendorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const { products, orders, updateOrderStatus } = useECommerce();

  const [shopName, setShopName] = useState(() => 
    currentUser?.shopName || currentUser?.mandatoryAddress?.shopName || 'Apon Bazar ডিলার প্রিমিয়াম শপ'
  );
  const [dealerEmail, setDealerEmail] = useState(() =>
    currentUser?.email || 'dealer@aponbazar.com'
  );
  const [tradeLicense, setTradeLicense] = useState('TRAD/CTG/2026/88492');
  const [commissionTier, setCommissionTier] = useState('প্ল্যাটিনাম ডিলার (8.5% Commission)');
  const [outletAddress, setOutletAddress] = useState(() => 
    currentUser?.mandatoryAddress?.fullServiceAddress || 'দোকান ১২, নিউ মার্কেট লেন, আন্দরকিল্লা, কোতোয়ালী, চট্টগ্রাম'
  );
  const [isApproved, setIsApproved] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Automatically determine Dealer Zone from Dealer's registered location
  const dealerZone = getZoneForDealer(currentUser?.mandatoryAddress);

  const vendorProducts = products.filter((p) => (currentUser?.id && p.vendorId === currentUser.id) || p.vendorShopName?.includes('চট্টগ্রাম') || true);

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={language === 'bn' ? 'ডিলার ও ভেন্ডর ড্যাশবোর্ড' : 'Dealer & Vendor Dashboard'}
        subtitle={language === 'bn' ? 'আউটলেট কভারেজ জোন, প্রডাক্ট ক্যাটালগ ও ডিলার কমিশন ইনভেন্টরি পোর্টাল' : 'Outlet management, catalog & dealer commission inventory portal'}
        icon={<Store className="w-6 h-6 text-emerald-300" />}
      />

      {/* Quick Action & Tier Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{commissionTier}</span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন পণ্য যোগ করুন' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Dealer Designated Delivery Zone Card (1 Upazila = 1 Zone) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Compass className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                <MapPin className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-300">
                  নির্ধারিত ডিলার ডেলিভারি জোন (Registered Dealer Zone)
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{dealerZone.zone_name_bn}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                    ID: {dealerZone.zone_id}
                  </span>
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90 pt-1">
              <span>বিভাগ: <strong>{dealerZone.division_name}</strong></span>
              <span>•</span>
              <span>জেলা: <strong>{dealerZone.district_name}</strong></span>
              <span>•</span>
              <span>উপজেলা: <strong>{dealerZone.upazila_name}</strong></span>
              <span>•</span>
              <span>পয়েন্ট: <strong>{dealerZone.zone_point_name}</strong></span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs shrink-0 max-w-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>১ উপজেলা = ১ ডেলিভারি জোন</span>
            </div>
            <p className="text-[11px] text-emerald-100/80 leading-snug">
              ডিলারের নিবন্ধিত ঠিকানা অনুযায়ী জোন স্বয়ংক্রিয়ভাবে নির্ধারিত। কোনো অসঙ্গতিপূর্ণ জোন ম্যানুয়ালি নির্বাচন প্রযোজ্য নয়।
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Profile Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base">
            <Store className="w-5 h-5" />
            <h3>{t('shopDetails')}</h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isApproved
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {isApproved ? 'অনুমোদিত ডিলার (Approved Outlet)' : 'যাচাই করা হচ্ছে'}
          </span>
        </div>

        <form onSubmit={handleSaveVendor} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                দোকান / শোরুমের নাম
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                ইমেইল এড্রেস (Email Address)
              </label>
              <input
                type="email"
                value={dealerEmail}
                onChange={(e) => setDealerEmail(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                {t('tradeLicense')}
              </label>
              <input
                type="text"
                value={tradeLicense}
                onChange={(e) => setTradeLicense(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                {t('commissionTier')}
              </label>
              <input
                type="text"
                value={commissionTier}
                onChange={(e) => setCommissionTier(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                আউটলেটের ঠিকানা
              </label>
              <input
                type="text"
                value={outletAddress}
                onChange={(e) => setOutletAddress(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> আউটলেট তথ্য সংরক্ষিত হয়েছে!
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">
                * স্থানীয় প্রশাসন ও ট্রেড রেজিস্ট্রি অনুযায়ী তথ্য যাচাই করা হয়
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* Vendor Inventory Management Grid */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-base">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3>আমার আউটলেট ইনভেন্টরি ও পণ্য তালিকা ({vendorProducts.length})</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {vendorProducts.map((p) => (
            <div
              key={p.id}
              className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center gap-3"
            >
              <img
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'}
                alt={p.titleBn || p.title || 'Product'}
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="font-bold text-neutral-900 dark:text-white truncate">{p.titleBn || p.title || 'পণ্য'}</h4>
                <p className="text-[10px] text-neutral-500 font-mono">SKU: {p.sku || 'N/A'}</p>
                {(() => {
                  const stockLoc = getProductStockLocation(p);
                  return (
                    <div className="text-[10px] text-blue-700 dark:text-blue-300 font-medium truncate">
                      মজুদ: <strong className="font-bold">{stockLoc.tradeLicenseBusinessName}</strong> ({stockLoc.upazilaName || stockLoc.zoneName})
                    </div>
                  );
                })()}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="font-black text-emerald-600 font-mono">৳ {calculateProductPricing(p).sellingPrice}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    স্টক: {p.stock ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dealer Order Routing & Fulfillment Hub */}
      <OrderRoutingManagerHub role="dealer" title="ডিলার ও আউটলেট অর্ডার প্রসেসিং হাব (Role: Dealer)" />

      {/* Sales & Commission Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            চলতি মাসের ডিলার বিক্রি (Sales Volume)
          </span>
          <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            ৳ ৩,৪৫,০০০.০০
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">+১২.৫% বৃদ্ধি</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            অর্জিত কমিশন রিওয়ার্ডস
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳ ২৯,৩২৫.০০
          </p>
          <span className="text-[10px] text-neutral-400">টমক ওয়ালেটে জমা প্রদানযোগ্য</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            ডেলিভারি কভারেজ ইউনিয়ন
          </span>
          <p className="text-2xl font-black text-neutral-900 dark:text-white">
            ৮ টি ইউনিয়ন
          </p>
          <span className="text-[10px] text-neutral-400">চট্টগ্রাম কোতোয়ালী হাব</span>
        </div>
      </div>

      <VendorProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

    </motion.div>
  );
};
