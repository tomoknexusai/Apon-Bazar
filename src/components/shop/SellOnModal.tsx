/**
 * Sell On Ghorer Bazar (Vendor / Merchant / Dealer Onboarding Modal)
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Store,
  CheckCircle2,
  TrendingUp,
  Truck,
  ShieldCheck,
  Zap,
  ArrowRight,
  PhoneCall,
  UserCheck
} from 'lucide-react';

interface SellOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterAsDealer: () => void;
}

export const SellOnModal: React.FC<SellOnModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterAsDealer
}) => {
  const { language } = useLanguage();

  if (!isOpen) return null;

  const benefits = [
    {
      titleBn: '০% লিস্টিং ফি ও ফ্রি অনবোর্ডিং',
      titleEn: '0% Listing Fee & Free Onboarding',
      descBn: 'কোনো অগ্রিম চার্জ ছাড়াই আপনার পণ্যসমূহ সারা দেশের ক্রেতাদের সামনে তুলে ধরুন।',
      descEn: 'List and sell unlimited products without any initial registration fees.',
      icon: Zap
    },
    {
      titleBn: 'দ্রুততম ২৪-৪৮ ঘণ্টা পেমেন্ট সেটেলমেন্ট',
      titleEn: 'Fast 24-48h Payout Settlement',
      descBn: 'অর্ডার সফলভাবে ডেলিভারি হওয়ার সাথে সাথে ব্যাংক বা বিকাশ/নগদে নিয়মিত পেমেন্ট।',
      descEn: 'Automated direct bank & mobile wallet payouts with instant statements.',
      icon: TrendingUp
    },
    {
      titleBn: 'দেশব্যাপী রাইডার ও ওয়্যারহাউস নেটওয়ার্ক',
      titleEn: 'Nationwide Logistics & Delivery Hubs',
      descBn: 'পণ্য পিকআপ থেকে শুরু করে কাস্টমারের দ্বোরগোড়ায় ডেলিভারি করবে আমাদের টিম।',
      descEn: 'Door-to-door rider pickup and delivery management across 64 districts.',
      icon: Truck
    },
    {
      titleBn: 'অ্যাফিলিয়েট নেটওয়ার্ক মার্কেটিং পাওয়ার',
      titleEn: 'Affiliate Marketing Referral Power',
      descBn: 'হাজারো সক্রিয় নেটওয়ার্ক মেম্বার আপনার পণ্যের প্রচার ও সেলস বৃদ্ধিতে কাজ করবে।',
      descEn: 'Boost sales with our dedicated network marketing referral members.',
      icon: ShieldCheck
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="relative bg-gradient-to-tr from-teal-700 via-emerald-600 to-amber-600 p-6 text-white overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-xs">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  {language === 'bn' ? 'মার্চেন্ট / ডিলার প্রোগ্রাম' : 'Merchant Partner Program'}
                </span>
                <h3 className="text-lg font-black tracking-tight mt-0.5">
                  {language === 'bn' ? 'TOMSHOPBD-এ সেলার হন' : 'Sell On TOMSHOPBD'}
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
          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
            {language === 'bn'
              ? 'আপনার প্রিমিয়াম গ্রোসারি, ফুড আইটেম বা যেকোনো অনুমোদিত পণ্য ঘরে বসেই সারা দেশে বিক্রি করুন। যুক্ত হন দেশের দ্রুত বর্ধনশীল ই-কমার্স ও নেটওয়ার্ক মার্কেটিং প্ল্যাটফর্মে।'
              : 'Grow your business by selling your products to hundreds of thousands of active customers with our integrated logistics & affiliate network.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {benefits.map((b, i) => {
              const IconComp = b.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-1.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white">
                    {language === 'bn' ? b.titleBn : b.titleEn}
                  </h5>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                    {language === 'bn' ? b.descBn : b.descEn}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
              <span className="font-bold block text-xs">
                {language === 'bn' ? 'সহজ ডিলার ও ভেন্ডর রেজিস্ট্রেশন' : 'Easy Dealer/Vendor Registration'}
              </span>
              {language === 'bn'
                ? 'অনলাইনে আবেদন করুন এবং ২৪ ঘণ্টার মধ্যে আমাদের টিম আপনার স্টোর অনুমোদন করবে।'
                : 'Apply online and our merchant support team will review and approve your store within 24 hours.'}
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>হেল্পলাইন: +880 1700-000000</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegisterAsDealer();
              }}
              className="flex-1 sm:flex-initial px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'bn' ? 'সেলার হিসেবে আবেদন করুন' : 'Apply to Sell'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
