/**
 * Apon Bazar APPLICATION SECTION (Storefront / Global Section)
 * Features exactly 3 separate buttons:
 * 1. APPLY FOR ADMIN
 * 2. APPLY FOR OPERATIONAL OFFICER
 * 3. APPLY FOR PRODUCT DELIVERY MAN
 * Plus real-time Vacancy stats and Area Hierarchy
 *
 * Project: Apon Bazar
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRoleApplications } from '../../context/RoleApplicationContext';
import { ApplicationRoleType } from '../../types';
import {
  Building2,
  Briefcase,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Search,
  Sparkles
} from 'lucide-react';

interface ApplicationBannerSectionProps {
  onOpenApplicationModal: (role?: ApplicationRoleType | 'tracker') => void;
}

export const ApplicationBannerSection: React.FC<ApplicationBannerSectionProps> = ({
  onOpenApplicationModal
}) => {
  const { language } = useLanguage();
  const { getOverallStats } = useRoleApplications();
  const stats = getOverallStats();

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 text-white relative overflow-hidden my-8 rounded-3xl border border-neutral-800 shadow-2xl">
      {/* Background Glows */}
      <div className="absolute left-1/4 top-0 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-0 translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apon Bazar APPLICATION ROLE SYSTEM</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {language === 'bn' ? 'Apon Bazar দায়িত্বপ্রাপ্ত পদে আবেদন' : 'Official Career & Leadership Applications'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {language === 'bn'
                ? 'আপনার জেলা, উপজেলা অথবা ইউনিয়ন পর্যায়ে Apon Bazar নেটওয়ার্কের দায়িত্বশীল পদে যোগ দিন। নিচে উল্লেখিত ৩টি নির্দিষ্ট পদে সরাসরি আবেদন করুন।'
                : 'Join our decentralized district and upazila logistics management. Choose from 3 designated roles below.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenApplicationModal('tracker')}
            className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/30 text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>{language === 'bn' ? 'আবেদন স্ট্যাটাস চেক করুন' : 'Track Application Status'}</span>
          </button>
        </div>

        {/* Live Area Network Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">
              {stats.districtsOccupied}
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">সক্রিয় জেলা অ্যাডমিন</span>
              <span className="text-xs font-black text-neutral-200">৬৪ জেলার মধ্যে {stats.districtsOccupied} টিতে</span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
              {stats.upazilasOccupied}
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">অপারেশনাল অফিসার</span>
              <span className="text-xs font-black text-neutral-200">৪৯৫ উপজেলার মধ্যে</span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              {stats.totalDeliveryMen}+
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">ডেলিভারি ম্যান</span>
              <span className="text-xs font-black text-neutral-200">দেশব্যাপী আনলিমিটেড</span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-800/60 rounded-2xl border border-neutral-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              {stats.pendingApplications}
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase">আবেদন পর্যালোচনায়</span>
              <span className="text-xs font-black text-neutral-200">যাচাই-বাছাই চলছে</span>
            </div>
          </div>
        </div>

        {/* 3 SEPARATE ACTION CARDS / BUTTONS (EXACT 3 BUTTONS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          
          {/* BUTTON 1: APPLY FOR ADMIN */}
          <div className="relative p-6 rounded-3xl bg-neutral-800/80 hover:bg-neutral-800 border-2 border-indigo-500/40 hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between space-y-6 group shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ১ জেলা = ১ অ্যাডমিন
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  ১. জেলা অ্যাডমিন
                </h3>
                <span className="text-xs text-indigo-400 font-bold block mb-1">
                  District Admin (1 Per District)
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  নির্ধারিত জেলার সামগ্রিক অপারেশন, বাজার ডাটাবেজ, মার্চেন্ট অনবোর্ডিং ও অর্ডার ডেলিভারি তদারকি। সুপার অ্যাডমিন দ্বারা যাচাই ও অনুমোদন।
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>জেলা প্রতি শুধুমাত্র ১ জন সক্রিয় অ্যাডমিন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>অনুমোদনের পর জেলা অ্যাডমিন ড্যাশবোর্ড এক্সেস</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenApplicationModal('admin')}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer"
            >
              <span>APPLY FOR ADMIN</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* BUTTON 2: APPLY FOR OPERATIONAL OFFICER */}
          <div className="relative p-6 rounded-3xl bg-neutral-800/80 hover:bg-neutral-800 border-2 border-teal-500/40 hover:border-teal-400 transition-all duration-300 flex flex-col justify-between space-y-6 group shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ১ উপজেলা = ১ অফিসার
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  ২. অপারেশনাল অফিসার
                </h3>
                <span className="text-xs text-teal-400 font-bold block mb-1">
                  Operational Officer (1 Per Upazila)
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  উপজেলা ভিত্তিক গ্রোসারি কালেকশন হাব, বাজার ডাটা এন্ট্রি ও রাইডার টিম পরিচালনা। অ্যাডমিন ও সুপার অ্যাডমিন দ্বারা যাচাই ও অনুমোদন।
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>উপজেলা প্রতি সর্বোচ্চ ১ জন দায়িত্বপ্রাপ্ত অফিসার</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>অপারেশনাল পার্টনার হাব ম্যানেজমেন্ট এক্সেস</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenApplicationModal('operational_officer')}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 cursor-pointer"
            >
              <span>APPLY FOR OPERATIONAL OFFICER</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* BUTTON 3: APPLY FOR PRODUCT DELIVERY MAN */}
          <div className="relative p-6 rounded-3xl bg-neutral-800/80 hover:bg-neutral-800 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between space-y-6 group shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  আনলিমিটেড আসন
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  ৩. প্রোডাক্ট ডেলিভারি ম্যান
                </h3>
                <span className="text-xs text-emerald-400 font-bold block mb-1">
                  Product Delivery Man (Unlimited)
                </span>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  পণ্য পিকআপ থেকে কাস্টমারের দরজায় হোম ডেলিভারি দিয়ে আকর্ষণীয় নিয়মিত ডেলিভারি কমিশন ও টিপস উপার্জন। দ্রুততম ভেরিফিকেশন ও রাইডার আইডি।
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>যেকোনো জেলা বা উপজেলায় আনলিমিটেড রেজিস্ট্রেশন</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>লাইভ ডেলিভারি রুট নেভিগেশন ও ওয়ালেট এক্সেস</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenApplicationModal('delivery_man')}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <span>APPLY FOR PRODUCT DELIVERY MAN</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
