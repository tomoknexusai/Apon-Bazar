/**
 * Activation Package System Component (100 PV - 500 PV)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { Zap, CheckCircle2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export const PackagesSection: React.FC = () => {
  const { packages, currentMember, customerDashboardSummary, wallets, activatePackage } = useNetworkMarketing();
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [paymentSource, setPaymentSource] = useState<'main_wallet' | 'payment_gateway'>('main_wallet');
  const [paymentRef, setPaymentRef] = useState('');
  const [activating, setActivating] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const activePackageId = customerDashboardSummary?.activationPackage?.packageId || currentMember?.packageId || '';
  const activePackageName =
    customerDashboardSummary?.activationPackage?.packageName ||
    currentMember?.packageName ||
    'কোনো সক্রিয় প্যাকেজ নেই';
  const activePackagePV = customerDashboardSummary?.activationPackage?.pv ?? currentMember?.pv ?? 0;
  const activePackageStatus =
    customerDashboardSummary?.activationPackage?.status ||
    (activePackagePV > 0 ? 'active' : 'inactive');
  const activationDate =
    customerDashboardSummary?.activationPackage?.activationDate || currentMember?.activationDate || null;
  const orderOrPaymentRef =
    customerDashboardSummary?.activationPackage?.orderOrPaymentRef || currentMember?.orderOrPaymentRef || null;

  const openConfirmModal = (pkgId: string, pkgPrice: number) => {
    setActionResult(null);
    setSelectedPkgId(pkgId);
    setPaymentSource((wallets?.mainWallet ?? 0) >= pkgPrice ? 'main_wallet' : 'payment_gateway');
    setPaymentRef(`PAY-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmActivate = async (pkgId: string) => {
    setActivating(true);
    setActionResult(null);
    const res = await activatePackage(
      pkgId,
      paymentSource,
      paymentSource === 'payment_gateway' ? paymentRef.trim() || `PAY-${Date.now()}` : undefined
    );
    setActivating(false);
    setActionResult(res);
    if (res.success) {
      setSelectedPkgId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-700/30">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h3 className="font-black text-xl">অ্যাক্টিভেশন ও আপগ্রেড প্যাকেজসমূহ</h3>
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            ১০০ PV থেকে ৫০০ PV পর্যন্ত নেটওয়ার্ক মার্কেটিং এক্সেস প্যাকেজ বেছে নিয়ে পেমেন্ট ও ভেরিফিকেশনের পর ইনকাম শুরু করুন
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs shrink-0 space-y-0.5">
          <span className="text-emerald-200 block text-[10px]">আপনার বর্তমান অ্যাক্টিভেশন প্যাকেজ:</span>
          <span className="font-black text-amber-300 text-sm block">{activePackageName}</span>
          <span className="text-[10px] text-emerald-100/80 block font-mono">
            {formatPV(activePackagePV)} PV • স্ট্যাটাস: {activePackageStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
            {activationDate ? ` • ${new Date(activationDate).toLocaleDateString('bn-BD')}` : ''}
            {orderOrPaymentRef ? ` • Ref: ${orderOrPaymentRef}` : ''}
          </span>
        </div>
      </div>

      {actionResult && (
        <div
          role="alert"
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            actionResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {actionResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {packages.map((pkg) => {
          const isCurrent = Boolean(activePackageId) && activePackageId === pkg.id && activePackageStatus === 'active';

          return (
            <div
              key={pkg.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between relative bg-white dark:bg-neutral-900 ${
                pkg.isPopular
                  ? 'border-2 border-emerald-500 shadow-xl ring-2 ring-emerald-500/20'
                  : 'border-neutral-200 dark:border-neutral-800 shadow-xs'
              }`}
            >
              {pkg.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-[9px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> জনপ্রিয় পছন্দ
                </span>
              )}

              <div className="space-y-4">
                <div className="text-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs rounded-full inline-block mb-2">
                    {formatPV(pkg.pv)} PV POINT
                  </span>
                  <h4 className="font-black text-sm text-neutral-900 dark:text-white leading-snug">
                    {pkg.nameBn}
                  </h4>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-emerald-600 font-mono">
                      ৳ {(pkg.priceBDT ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  {pkg.benefitsBn.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-5">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-bold text-xs rounded-2xl cursor-not-allowed text-center"
                  >
                    বর্তমান সক্রিয় প্যাকেজ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConfirmModal(pkg.id, pkg.priceBDT)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all text-center cursor-pointer"
                  >
                    অ্যাক্টিভেট করুন
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {selectedPkgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 text-xs shadow-2xl relative">
            <h4 className="font-black text-base text-neutral-900 dark:text-white">
              প্যাকেজ অ্যাক্টিভেশন নিশ্চিতকরণ
            </h4>
            
            {(() => {
              const pkg = packages.find((p) => p.id === selectedPkgId);
              if (!pkg) return null;
              const hasBalance = (wallets?.mainWallet ?? 0) >= pkg.priceBDT;
              const canSubmit =
                paymentSource === 'payment_gateway'
                  ? paymentRef.trim().length >= 3
                  : hasBalance;

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl space-y-1">
                    <p className="font-bold text-neutral-800 dark:text-neutral-200">{pkg.nameBn}</p>
                    <p className="text-emerald-600 font-black text-sm">৳ {(pkg.priceBDT ?? 0).toLocaleString()} ({formatPV(pkg.pv)} PV)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                      পেমেন্ট মাধ্যম নির্বাচন করুন:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentSource('main_wallet')}
                        className={`p-2 rounded-xl border text-left font-bold cursor-pointer ${
                          paymentSource === 'main_wallet'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        মেইন ওয়ালেট
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentSource('payment_gateway')}
                        className={`p-2 rounded-xl border text-left font-bold cursor-pointer ${
                          paymentSource === 'payment_gateway'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        পেমেন্ট গেটওয়ে / TrxID
                      </button>
                    </div>
                  </div>

                  {paymentSource === 'main_wallet' ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200">
                      <span className="block font-bold">মেইন ওয়ালেট ব্যালেন্স: ৳ {(wallets?.mainWallet ?? 0).toLocaleString()}</span>
                      {!hasBalance && (
                        <span className="text-red-600 font-bold block mt-1">
                          ⚠️ আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন ৳ {((pkg.priceBDT ?? 0) - (wallets?.mainWallet ?? 0)).toLocaleString()} বাড়তি অথবা পেমেন্ট গেটওয়ে নির্বাচন করুন।
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                        পেমেন্ট রেফারেন্স / TrxID:
                      </label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="উদাঃ BKASH-TRX-9988"
                        className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono font-bold text-neutral-900 dark:text-white"
                      />
                    </div>
                  )}

                  {actionResult && !actionResult.success && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-800 dark:text-rose-200 rounded-xl font-bold">
                      {actionResult.message}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={activating}
                      onClick={() => setSelectedPkgId(null)}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      disabled={!canSubmit || activating}
                      onClick={() => handleConfirmActivate(pkg.id)}
                      className="px-5 py-2 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {activating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>পেমেন্ট ও অ্যাক্টিভেট করুন</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
