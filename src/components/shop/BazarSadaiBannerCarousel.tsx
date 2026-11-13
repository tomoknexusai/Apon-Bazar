/**
 * Fast, Clean, Smart & Colorful Digital Hero Banner Carousel for "আনো বাজার (AANO BAZAR)"
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Truck,
  ArrowRight,
  Cpu
} from 'lucide-react';

interface BannerSlide {
  id: string;
  titleBn: string;
  subtitleBn: string;
  badgeBn: string;
  discountTag: string;
  imageUrl: string;
  bgGradient: string;
  accentColor: string;
  ctaText: string;
  categoryFilterId?: string;
}

const bannerSlides: BannerSlide[] = [
  {
    id: 'banner-1',
    titleBn: 'সুন্দরবনের প্রাকৃতিক চাকভাঙা কাঁচা মধু',
    subtitleBn: '১০০% প্রসেসমুক্ত কাঁচা মধু, প্রাকৃতিক এনজাইম ও অ্যান্টিঅক্সিডেন্ট সমৃদ্ধ খাঁটি খাদ্য',
    badgeBn: '১০০% প্রাকৃতিক ও বিশুদ্ধ',
    discountTag: '২৫% মেগা অফার',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
    bgGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    accentColor: 'text-emerald-400',
    ctaText: 'অর্ডার করুন',
    categoryFilterId: 'cat-1'
  },
  {
    id: 'banner-2',
    titleBn: 'কাঠের ঘানি ভাঙা সরিষার তেল ও গাওয়া ঘি',
    subtitleBn: 'ঐতিহ্যবাহী কাঠের ঘানি ভাঙা প্রথম চাপের খাস তেল ও খাঁটি গাওয়া ঘি সরাসরি খামার থেকে',
    badgeBn: 'খামার থেকে সরাসরি',
    discountTag: 'ফ্রি হোম ডেলিভারি',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800',
    bgGradient: 'from-slate-950 via-indigo-950 to-emerald-950',
    accentColor: 'text-amber-400',
    ctaText: 'পণ্য দেখুন',
    categoryFilterId: 'cat-2'
  },
  {
    id: 'banner-3',
    titleBn: 'মদিনার আজওয়া খেজুর ও প্রিমিয়াম ড্রাই ফ্রুটস',
    subtitleBn: 'সুস্বাদু ও পুষ্টিকর খাস খেজুর, কাঠবাদাম, কাজুবাদাম ও পেস্তাবাদাম মিক্স সুপার প্যাক',
    badgeBn: 'প্রিমিয়াম কোয়ালিটি',
    discountTag: 'বিশেষ ক্যাশব্যাক',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=800',
    bgGradient: 'from-purple-950 via-slate-900 to-cyan-950',
    accentColor: 'text-purple-400',
    ctaText: 'অফার কালেকশন',
    categoryFilterId: 'cat-3'
  },
  {
    id: 'banner-4',
    titleBn: 'AI-পাওয়ার্ড কেনাকাটা ও TOMSHOPBD নেটওয়ার্ক আয়!',
    subtitleBn: 'প্রতিটি অর্ডারে আকর্ষণীয় PV ইনকাম পয়েন্ট, লাইভ ডেলিভারি ট্র্যাকিং ও ইনস্ট্যান্ট ক্যাশব্যাক',
    badgeBn: 'Smart Digital MLM',
    discountTag: 'ইনস্ট্যান্ট পয়েন্ট',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800',
    bgGradient: 'from-cyan-950 via-indigo-950 to-pink-950',
    accentColor: 'text-cyan-400',
    ctaText: 'পয়েন্ট প্রোডাক্টস',
    categoryFilterId: 'all'
  }
];

interface BazarSadaiBannerCarouselProps {
  onSelectCategory?: (catId: string) => void;
}

export const BazarSadaiBannerCarousel: React.FC<BazarSadaiBannerCarouselProps> = ({
  onSelectCategory
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  const activeSlide = bannerSlides[currentIndex];

  return (
    <div className="relative rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 group shadow-md transition-all duration-300">
      
      {/* Background & Slide Content */}
      <div
        className={`relative min-h-[180px] sm:min-h-[230px] bg-gradient-to-r ${activeSlide.bgGradient} text-white p-4 sm:p-6 flex flex-col justify-between transition-colors duration-500 overflow-hidden`}
      >
        {/* Subtle Futuristic Glow Spheres */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Digital Micro Matrix Overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.25) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />

        {/* Background Image Accent with subtle blend */}
        <div className="absolute inset-0 opacity-20 dark:opacity-25 pointer-events-none mix-blend-luminosity">
          <img
            src={activeSlide.imageUrl}
            alt={activeSlide.titleBn}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Header & Badges */}
        <div className="relative z-10 space-y-1.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-bold text-[10px] sm:text-[11px] rounded-md shadow-xs">
              <Zap className="w-3 h-3 fill-current" />
              {activeSlide.discountTag}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 backdrop-blur-xs text-emerald-300 border border-white/10 rounded-md text-[10px] font-semibold">
              <Sparkles className="w-2.5 h-2.5" />
              {activeSlide.badgeBn}
            </span>
          </div>

          <h2 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug drop-shadow-xs">
            {activeSlide.titleBn}
          </h2>

          <p className="text-[11px] sm:text-xs text-neutral-200 font-normal line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {activeSlide.subtitleBn}
          </p>
        </div>

        {/* Call to Action & Navigation */}
        <div className="relative z-10 pt-3 flex items-center justify-between gap-3 border-t border-white/10 mt-2">
          <button
            type="button"
            onClick={() => {
              if (activeSlide.categoryFilterId && onSelectCategory) {
                onSelectCategory(activeSlide.categoryFilterId);
              }
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <span>{activeSlide.ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Quick Badges in Banner */}
          <div className="hidden md:flex items-center gap-3 text-[11px] text-emerald-200 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ক্যাশ অন ডেলিভারি
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-400" /> দ্রুত ডেলিভারি
            </span>
            <span className="flex items-center gap-1 text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> স্মার্ট ট্র্যাকিং
            </span>
          </div>
        </div>

      </div>

      {/* Prev / Next Touch Control Buttons */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-0.5 bg-black/30 backdrop-blur-xs rounded-full">
        {bannerSlides.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all rounded-full cursor-pointer ${
              currentIndex === idx
                ? 'w-4 h-1.5 bg-emerald-400'
                : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
};
