/**
 * App Exclusive Deals & Mobile App Download Modal
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  X,
  Smartphone,
  Sparkles,
  Gift,
  Copy,
  Check,
  Download,
  QrCode,
  Flame,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';

interface AppDealsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDealsModal: React.FC<AppDealsModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const { addNotification } = useNotifications();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const deals = [
    {
      code: 'APPDEAL25',
      titleBn: 'অ্যাপে প্রথম অর্ডারে ২৫% ছাড়',
      titleEn: '25% OFF On First App Order',
      descBn: 'সর্বনিম্ন ৳ ৫০০ টাকার অর্ডারে অ্যাপ স্পেশাল ছাড়। কোড ব্যবহার করুন।',
      descEn: 'App special discount on minimum order of ৳500. Use coupon code.',
      badge: '🔥 HOT'
    },
    {
      code: 'FREEDELIVERY',
      titleBn: 'ফ্রি হোম ডেলিভারি অফার',
      titleEn: 'Free Nationwide Delivery',
      descBn: 'যেকোনো গ্রোসারি বা পণ্য অর্ডারে বিনামূল্যে হোম ডেলিভারি।',
      descEn: 'Zero delivery charge on any app purchase across Bangladesh.',
      badge: '⚡ FAST'
    },
    {
      code: 'PURECASHBACK',
      titleBn: '১০% ইনস্ট্যান্ট ক্যাশব্যাক',
      titleEn: '10% Instant Wallet Cashback',
      descBn: 'প্রতিটি প্রি-পেইড অর্ডারে সরাসরি আপনার ওয়ালেটে ক্যাশব্যাক।',
      descEn: 'Get instant cashback in your network wallet on prepaid orders.',
      badge: '💎 VIP'
    }
  ];

  const handleCopy = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      addNotification({
        title: language === 'bn' ? 'কুপন কপি হয়েছে!' : 'Coupon Copied!',
        message: language === 'bn' ? `কুপন কোড '${code}' সফলভাবে কপি হয়েছে।` : `Coupon code '${code}' copied to clipboard.`,
        type: 'success'
      });
      setTimeout(() => setCopiedCode(null), 2500);
    } catch (e) {
      setCopiedCode(code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="relative bg-gradient-to-tr from-emerald-600 via-teal-600 to-amber-500 p-6 text-white overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white">
                <Flame className="w-5 h-5 animate-pulse text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  {language === 'bn' ? 'এক্সক্লুসিভ অফার' : 'Exclusive Offers'}
                </span>
                <h3 className="text-lg font-black tracking-tight mt-0.5">
                  {language === 'bn' ? 'অ্যাপ স্পেশাল ডিল ও ডিসকাউন্ট' : 'App Exclusive Deals & Discounts'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Coupon Codes Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'bn' ? 'সক্রিয় কুপন কোডসমূহ' : 'Active Coupon Codes'}</span>
            </h4>

            <div className="space-y-2.5">
              {deals.map((deal) => {
                const isCopied = copiedCode === deal.code;
                return (
                  <div
                    key={deal.code}
                    className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800">
                          {deal.code}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                          {deal.badge}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-neutral-900 dark:text-white">
                        {language === 'bn' ? deal.titleBn : deal.titleEn}
                      </h5>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {language === 'bn' ? deal.descBn : deal.descEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(deal.code)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 hover:bg-emerald-50 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 shadow-2xs'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'কপি করুন' : 'Copy Code'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download App Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-neutral-800 dark:to-neutral-800/80 border border-emerald-200/80 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-black text-xs text-neutral-900 dark:text-white">
                    {language === 'bn' ? 'TOMSHOPBD মোবাইল অ্যাপ' : 'TOMSHOPBD Mobile App'}
                  </h5>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                    {language === 'bn'
                      ? 'অর্ডার ট্র্যাকিং, ইনস্ট্যান্ট নোটিফিকেশন ও দ্রুততম ডেলিভারি অভিজ্ঞতা'
                      : 'Real-time order tracking & instant flash deal notifications'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  addNotification({
                    title: language === 'bn' ? 'অ্যাপ ডাউনলোড শুরু হয়েছে' : 'App Download Started',
                    message: language === 'bn' ? 'TOMSHOPBD Android APK ডাউনলোড করা হচ্ছে।' : 'Downloading TOMSHOPBD Android APK.',
                    type: 'info'
                  });
                }}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'bn' ? 'Android APK ডাউনলোড' : 'Download APK'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addNotification({
                    title: language === 'bn' ? 'গুগল প্লে স্টোর' : 'Google Play Store',
                    message: language === 'bn' ? 'গুগল প্লে স্টোরে অ্যাপ পেজে রিডাইরেক্ট করা হচ্ছে।' : 'Redirecting to Google Play Store.',
                    type: 'info'
                  });
                }}
                className="p-2.5 rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-600 text-xs font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Play Store</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            {language === 'bn' ? 'ঠিক আছে' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
