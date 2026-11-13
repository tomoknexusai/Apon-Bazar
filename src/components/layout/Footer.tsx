/**
 * Enterprise Footer Component
 * Project: Apon Bazar (আপন বাজার)
 */

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { generateRobotsTxt, generateSitemapXml } from '../../lib/seo';
import { BrandLogo } from '../common/BrandLogo';
import { ShieldCheck, Database, Globe, FileText, Code2, X, Phone, Mail, MapPin, HelpCircle, FileCheck, Lock, Info, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const { systemSettings, setActiveRole } = useAuth();

  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [showModal, setShowModal] = useState(false);

  const openInfoModal = (title: string, content: React.ReactNode) => {
    setModalTitle(title);
    setModalContent(content);
    setShowModal(true);
  };

  const openRobots = () => {
    openInfoModal('robots.txt', <pre className="bg-black/50 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-[11px] text-emerald-300 font-mono">{generateRobotsTxt()}</pre>);
  };

  const openSitemap = () => {
    openInfoModal('sitemap.xml', <pre className="bg-black/50 p-4 rounded-xl border border-neutral-800 overflow-x-auto text-[11px] text-emerald-300 font-mono">{generateSitemapXml()}</pre>);
  };

  const openAbout = () => {
    openInfoModal(
      language === 'bn' ? 'আপন বাজার (Apon Bazar) পরিচিতি' : 'About Apon Bazar',
      <div className="space-y-3 text-xs leading-relaxed text-neutral-300">
        <p>
          <strong className="text-white">আপন বাজার (Apon Bazar)</strong> হলো বাংলাদেশের একটি অত্যাধুনিক, সম্পূর্ণ বিশ্বস্ত ই-কমার্স ও ডিজিটাল নেটওয়ার্ক প্ল্যাটফর্ম। আমাদের মূল লক্ষ্য সারাদেশে গুণগত মানের পণ্য ও খাঁটি খাবার ঘরে ঘরে দ্রুত পৌঁছে দেওয়া।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <div className="p-2.5 bg-neutral-800/80 rounded-xl border border-neutral-700">
            <h5 className="font-bold text-emerald-400">১০০% খাঁটি ও গুণগত মান</h5>
            <p className="text-[11px] text-neutral-400 mt-0.5">ন্যায্য মূল্যে নির্ভরযোগ্য উৎপাদক ও ডিলার থেকে সংগৃহীত।</p>
          </div>
          <div className="p-2.5 bg-neutral-800/80 rounded-xl border border-neutral-700">
            <h5 className="font-bold text-emerald-400">স্মার্ট ডেলিভারি নেটওয়ার্ক</h5>
            <p className="text-[11px] text-neutral-400 mt-0.5">লোকাল ডিলার হাব থেকে কাস্টমার অ্যাড্রেস পর্যন্ত দ্রুততম সরবরাহ।</p>
          </div>
        </div>
      </div>
    );
  };

  const openContact = () => {
    openInfoModal(
      language === 'bn' ? 'যোগাযোগ ও সাপোর্ট' : 'Contact & Support',
      <div className="space-y-3 text-xs text-neutral-300">
        <p>যেকোনো প্রশ্ন, পণ্যের তথ্য বা অর্ডার সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 p-2 bg-neutral-800/80 rounded-xl">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400">হটলাইন (২৪/৭)</div>
              <div className="font-bold text-white">+880 9612-APONBAZAR (০৯৬১২-২৭৬৬২)</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 bg-neutral-800/80 rounded-xl">
            <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400">ইমেইল</div>
              <div className="font-bold text-white">support@aponbazar.com</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 bg-neutral-800/80 rounded-xl">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400">হেড অফিস</div>
              <div className="font-bold text-white">প্লট ১৪, রোড ০২, মিরপুর ১০, ঢাকা ১২১৬, বাংলাদেশ</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const openTerms = () => {
    openInfoModal(
      language === 'bn' ? 'শর্তাবলী (Terms & Conditions)' : 'Terms & Conditions',
      <div className="space-y-3 text-xs leading-relaxed text-neutral-300 max-h-[60vh] overflow-y-auto pr-2">
        <h5 className="font-bold text-white text-sm">১. একাউন্ট ও নিবন্ধন</h5>
        <p>আপন বাজার (Apon Bazar)-এ একাউন্ট তৈরি করতে সঠিক ও প্রমাণযোগ্য তথ্য প্রদান বাধ্যতামূলক। একই ফোন নাম্বারে পরিবারভিত্তিক একাধিক কাস্টমার আইডি খোলার সুবিধা বিদ্যমান।</p>
        <h5 className="font-bold text-white text-sm">২. অর্ডার ও পেমেন্ট</h5>
        <p>ক্যাশ অন ডেলিভারি (COD 0%), বিকাশ (1.8%), নগদ (1.8%) এবং রকেট (1.8%) পেমেন্ট গেটওয়ে গ্রহণযোগ্য।</p>
        <h5 className="font-bold text-white text-sm">৩. পয়েন্ট ভ্যালু (PV) ও নেটওয়ার্ক রুলস</h5>
        <p>PV হিসাব করা হয় সেলিং প্রাইস থেকে ডিলার প্রাইস বাদ দিয়ে গ্রস প্রফিটের ৮০% ভ্যালুর উপর ভিত্তি করে (২০% অ্যাডমিন ফি বাদে)। ডেলিভারি চার্জ বা ভ্যাট PV-এর অন্তর্ভুক্ত নয়।</p>
        <h5 className="font-bold text-white text-sm">৪. রিটার্ন ও রিফান্ড নীতি</h5>
        <p>পণ্যে কোনো ত্রুটি থাকলে ডেলিভারি গ্রহণের ৭২ ঘণ্টার মধ্যে রিটার্ন অনুরোধ করতে হবে।</p>
      </div>
    );
  };

  const openPrivacy = () => {
    openInfoModal(
      language === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy',
      <div className="space-y-3 text-xs leading-relaxed text-neutral-300 max-h-[60vh] overflow-y-auto pr-2">
        <h5 className="font-bold text-white text-sm">১. তথ্যের নিরাপত্তা</h5>
        <p>আপন বাজার (Apon Bazar) গ্রাহকদের ব্যক্তিগত তথ্য (নাম, ফোন নাম্বার, ইমেইল, ঠিকানা) সর্বোচ্চ নিরাপত্তা কাঠামোর মাধ্যমে সুরক্ষিত রাখে।</p>
        <h5 className="font-bold text-white text-sm">২. পাসওয়ার্ড নিরাপত্তা</h5>
        <p>গ্রাহকদের পাসওয়ার্ড শক্তিশালী ক্রিপ্টোগ্রাফিক সল্টিং ও হ্যাশিং অ্যালগরিদম দ্বারা সুরক্ষিত। এমনকি সিস্টেম অ্যাডমিনও পাসওয়ার্ড দেখতে পান না।</p>
        <h5 className="font-bold text-white text-sm">৩. তৃতীয় পক্ষের সাথে তথ্য আদান-প্রদান</h5>
        <p>কেবলমাত্র অর্ডার ডেলিভারি সম্পন্ন করার জন্য অনুমোদিত ডিলার ও কুরিয়ার সার্ভিসের সাথে প্রয়োজনীয় শিপিং তথ্য শেয়ার করা হয়।</p>
      </div>
    );
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          
          {/* Column 1: Brand & Identity */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="md" iconOnly={true} className="shrink-0" />
              <div>
                <h3 className="font-black text-neutral-900 dark:text-white text-base leading-none flex items-center gap-1">
                  <span className="text-emerald-700 dark:text-emerald-400">Apon</span>
                  <span className="text-orange-500">Bazar</span>
                </h3>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium block mt-0.5">
                  — আপনার প্রয়োজন, আমাদের প্রতিশ্রুতি —
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
              বাংলাদেশের আধুনিক, নির্ভরযোগ্য অনলাইন শপিং, বিশ্বস্ত অর্গানিক গ্রোসারি, বাইনারি নেটওয়ার্ক ও দ্রুততম ডিলার পয়েন্ট ডেলিভারি প্ল্যাটফর্ম।
            </p>
            <div className="pt-1 flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>১০০% ক্যাশ অন ডেলিভারি ও রিয়েল-টাইম ট্র্যাকিং</span>
            </div>
          </div>

          {/* Column 2: Shop & Categories */}
          <div className="space-y-2">
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              কেনাকাটা ও পণ্য (Shop)
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-storefront-root')} className="hover:text-emerald-600 transition-colors">
                  হোম (Home)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-main-catalog-section')} className="hover:text-emerald-600 transition-colors">
                  সকল পণ্য (Shop & Products)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-fixed-category-menu')} className="hover:text-emerald-600 transition-colors">
                  ক্যাটাগরি সমূহ (Categories)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-main-catalog-section')} className="hover:text-emerald-600 transition-colors">
                  বিশেষ অফার (Offers)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-main-catalog-section')} className="hover:text-emerald-600 transition-colors">
                  নতুন আগমন (New Arrivals)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('aponbazar-main-catalog-section')} className="hover:text-emerald-600 transition-colors">
                  বেস্ট সেলিং (Best Selling)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Account & Services */}
          <div className="space-y-2">
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              গ্রাহক সেবা ও একাউন্ট
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button type="button" onClick={() => setActiveRole('customer')} className="hover:text-emerald-600 transition-colors">
                  কাস্টমার ড্যাশবোর্ড (Customer Dashboard)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setActiveRole('network_member')} className="hover:text-emerald-600 transition-colors">
                  বাইনারি নেটওয়ার্ক ট্রি (Network Tree)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent('open-customer-reg-modal')); }} className="hover:text-emerald-600 transition-colors">
                  কাস্টমার নিবন্ধন (Customer Registration)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent('open-order-tracker')); }} className="hover:text-emerald-600 transition-colors">
                  অর্ডার ট্র্যাকিং (Order Tracking)
                </button>
              </li>
              <li>
                <button type="button" onClick={openAbout} className="hover:text-emerald-600 transition-colors">
                  আপন বাজার সম্পর্কে (About Apon Bazar)
                </button>
              </li>
              <li>
                <button type="button" onClick={openContact} className="hover:text-emerald-600 transition-colors">
                  সাহায্য ও সাপোর্ট (Help / Support)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Policies & Contacts */}
          <div className="space-y-2">
            <h4 className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[11px]">
              নীতিমালা ও প্রযুক্তি
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button type="button" onClick={openTerms} className="hover:text-emerald-600 transition-colors">
                  শর্তাবলী (Terms & Conditions)
                </button>
              </li>
              <li>
                <button type="button" onClick={openPrivacy} className="hover:text-emerald-600 transition-colors">
                  গোপনীয়তা নীতি (Privacy Policy)
                </button>
              </li>
              <li>
                <button type="button" onClick={openContact} className="hover:text-emerald-600 transition-colors">
                  যোগাযোগ (Contact Us)
                </button>
              </li>
              <li className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={openRobots}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                >
                  <FileText className="w-3 h-3" /> robots.txt
                </button>
                <button
                  type="button"
                  onClick={openSitemap}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                >
                  <Code2 className="w-3 h-3" /> sitemap.xml
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-500 gap-2">
          <span>© ২০২৬ আপন বাজার (Apon Bazar). সর্বস্বত্ব সংরক্ষিত।</span>
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>নিরাপদ ও নির্ভরযোগ্য ই-কমার্স ইকোসিস্টেম</span>
          </span>
        </div>

      </div>

      {/* Info / Legal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-neutral-900 text-neutral-200 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {modalTitle}
            </h3>
            <div className="mt-2">
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
