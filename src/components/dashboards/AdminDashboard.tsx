/**
 * Admin Dashboard Component with User Creation & 10-Level BD Address Picker
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { UserCheck, FileCheck, Send, MapPin, CheckCircle2, XCircle, BellRing, UserPlus, Shield, ShieldCheck, Settings2, Sparkles, Check, Globe, ToggleLeft, ToggleRight, Building2, ShoppingBag, Truck, Users } from 'lucide-react';
import { NotificationChannel, UserRole } from '../../types';
import { BDAddressPicker, BDAddressFields } from '../common/BDAddressPicker';
import { AdminLocalServiceManager } from '../admin/AdminLocalServiceManager';
import { MarketDatabaseManager } from '../common/MarketDatabaseManager';
import { OrderRoutingManagerHub } from '../shop/OrderRoutingManagerHub';
import { SmsOrderManagementHub } from '../sms/SmsOrderManagementHub';
import { DailyTrendsWidget } from '../common/DailyTrendsWidget';
import { Database, LayoutDashboard, Store, MessageSquare, Award, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  const { allUsers, approveKyc, rejectKyc, registerUser } = useAuth();
  const { sendNotification } = useNotifications();
  const { language, t } = useLanguage();
  const { isPilotMode, setPilotMode, togglePilotMode, pilotArea } = useSystemSettings();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders_routing' | 'sms_ai_hub' | 'pilot_settings' | 'address_db' | 'markets_db'>('overview');

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<NotificationChannel>('in_app');
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Admin User Creation Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('customer');
  const [newAddressData, setNewAddressData] = useState<BDAddressFields>({
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    unionName: 'ধানমন্ডি আ/এ',
    ward: 'ওয়ার্ড ০১',
    area: 'মিরপুর রোড',
    marketBazar: 'রাপা প্লাজা',
    postalCode: '১২০৯',
    fullServiceAddress: 'মিরপুর রোড, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা',
    latitude: 23.7461,
    longitude: 90.3742
  });
  const [userCreatedSuccess, setUserCreatedSuccess] = useState(false);

  const pendingKycUsers = allUsers.filter((u) => u.verificationStatus === 'pending');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    allUsers.forEach((u) => {
      sendNotification(u.id, broadcastTitle, broadcastMessage, broadcastChannel);
    });

    setBroadcastSent(true);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleCreateUserByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = (newFullName || '').trim();
    const trimmedMobile = (newMobile || '').trim();
    if (!trimmedName || !trimmedMobile) return;

    try {
      await registerUser({
        fullName: trimmedName,
        email: (newEmail || '').trim() || `${trimmedMobile}@aponbazar.com`,
        mobileNumber: trimmedMobile,
        role: newRole || 'customer',
        division: newAddressData?.division || 'ঢাকা',
        district: newAddressData?.district || 'ঢাকা',
        upazila: newAddressData?.upazila || 'ধানমন্ডি',
        unionName: newAddressData?.unionName || 'ধানমন্ডি আ/এ',
        ward: newAddressData?.ward || 'ওয়ার্ড ০১',
        area: newAddressData?.area || '',
        marketBazar: newAddressData?.marketBazar || '',
        postalCode: newAddressData?.postalCode || '১২০৯',
        fullServiceAddress: newAddressData?.fullServiceAddress || '',
        latitude: typeof newAddressData?.latitude === 'number' ? newAddressData.latitude : 23.7461,
        longitude: typeof newAddressData?.longitude === 'number' ? newAddressData.longitude : 90.3742
      });

      setUserCreatedSuccess(true);
      setTimeout(() => {
        setUserCreatedSuccess(false);
        setShowUserModal(false);
        setNewFullName('');
        setNewMobile('');
        setNewEmail('');
      }, 1500);
    } catch (err) {
      console.error('Failed to create user by admin:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={t('adminTitle')}
        subtitle={`${t('operationalCommand')} — ${language === 'bn' ? 'কেওয়াইসি ভেরিফিকেশন, ইউজার ক্রিয়েশন ও এড্রেস ডাটাবেজ হাব' : 'KYC verification, user creation & address database hub'}`}
        icon={<UserCheck className="w-6 h-6 text-emerald-300" />}
      />

      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowUserModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>{language === 'bn' ? 'নতুন ইউজার বা পার্টনার যোগ করুন' : 'Add New User / Partner'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>ওভারভিউ & কেওয়াইসি (Overview & KYC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders_routing')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orders_routing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-emerald-300" />
          <span>অল বাংলাদেশ অর্ডার রাউটিং (Order Routing Hub)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pilot_settings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'pilot_settings'
              ? 'bg-emerald-600 text-white shadow-xs font-black'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>পাইলট মোড সেটিংস (Pilot Mode Settings)</span>
          <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full ${isPilotMode ? 'bg-emerald-200 text-emerald-950' : 'bg-neutral-200 text-neutral-700'}`}>
            {isPilotMode ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address_db')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'address_db'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-300" />
          <span>এড্রেস ডাটাবেজ (Level 2 Address DB)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('markets_db')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'markets_db'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Store className="w-4 h-4 text-emerald-300" />
          <span>মার্কেট / বাজার ডাটাবেজ (Market Database)</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'orders_routing' && (
            <OrderRoutingManagerHub role="admin" title="এডমিন অল বাংলাদেশ রাউটিং মনিটরিং পোর্টাল" />
          )}

          {activeTab === 'pilot_settings' ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Pilot Mode Status Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shrink-0">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                    {language === 'bn' ? 'সিস্টেম পাইলট মোড কন্ট্রোল হাব' : 'System Pilot Mode Control Hub'}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black ${
                    isPilotMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {isPilotMode ? 'PILOT MODE: ON' : 'PILOT MODE: OFF'}
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                  {language === 'bn'
                    ? 'পাইলট এরিয়া: ঠাকুরগাঁও সদর উপজেলা, ঠাকুরগাঁও জেলা, বাংলাদেশ।'
                    : 'Pilot Area: Thakurgaon Sadar Upazila, Thakurgaon District, Bangladesh.'}
                </p>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={togglePilotMode}
              className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-3 transition-all shadow-md shrink-0 ${
                isPilotMode
                  ? 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/20'
              }`}
            >
              {isPilotMode ? (
                <>
                  <ToggleRight className="w-6 h-6 text-amber-200" />
                  <span>{language === 'bn' ? 'পাইলট মোড বন্ধ করুন (Nationwide Mode)' : 'Turn OFF Pilot Mode (Nationwide)'}</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-emerald-200" />
                  <span>{language === 'bn' ? 'পাইলট মোড চালু করুন (Thakurgaon Sadar)' : 'Turn ON Pilot Mode'}</span>
                </>
              )}
            </button>
          </div>

          {/* Pilot Area Location Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                বিভাগ (Division)
              </span>
              <p className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>{pilotArea.divisionBn} ({pilotArea.divisionEn})</span>
              </p>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                জেলা (District)
              </span>
              <p className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>{pilotArea.districtBn} ({pilotArea.districtEn})</span>
              </p>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                উপজেলা / থানা (Upazila)
              </span>
              <p className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{pilotArea.upazilaBn} ({pilotArea.upazilaEn})</span>
              </p>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                পোস্ট কোড (Postal Code)
              </span>
              <p className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                {pilotArea.postalCode}
              </p>
            </div>
          </div>

          {/* Permitted Roles during Pilot Mode */}
          <div className="space-y-3">
            <h3 className="font-black text-neutral-900 dark:text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>
                {language === 'bn'
                  ? 'পাইলট মোডে অনুমোদিত ৮টি ইউজার রোল'
                  : '8 Permitted Operational Roles in Pilot Mode'}
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { role: 'Customer', nameBn: 'কাস্টমার', icon: <Users className="w-3.5 h-3.5 text-blue-500" /> },
                { role: 'Network Marketing Member', nameBn: 'নেটওয়ার্ক মেম্বার', icon: <Globe className="w-3.5 h-3.5 text-teal-500" /> },
                { role: 'Dealer', nameBn: 'ডিলার', icon: <Building2 className="w-3.5 h-3.5 text-emerald-500" /> },
                { role: 'Vendor', nameBn: 'ভেন্ডর', icon: <ShoppingBag className="w-3.5 h-3.5 text-orange-500" /> },
                { role: 'Company Partner', nameBn: 'কোম্পানি পার্টনার', icon: <Shield className="w-3.5 h-3.5 text-purple-500" /> },
                { role: 'Operations Partner', nameBn: 'অপারেশনস পার্টনার', icon: <Settings2 className="w-3.5 h-3.5 text-amber-500" /> },
                { role: 'Delivery Partner', nameBn: 'ডেলিভারি ম্যান', icon: <Truck className="w-3.5 h-3.5 text-sky-500" /> },
                { role: 'Admin', nameBn: 'অ্যাডমিন', icon: <ShieldCheck className="w-3.5 h-3.5 text-rose-500" /> },
              ].map((r, idx) => (
                <div key={r?.role || idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/80 flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  {r?.icon}
                  <div>
                    <span className="block text-xs">{r?.nameBn}</span>
                    <span className="text-[10px] font-normal text-neutral-500">{r?.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules & Architectural Readiness Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3">
            <h4 className="font-black text-amber-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {language === 'bn'
                  ? 'পাইলট এরিয়া সংক্রান্ত ৮টি মূল প্ল্যাটফর্ম ফিচার ও আর্কিটেকচার নিয়ম'
                  : '8 Core Pilot Platform Rules & Expansion Architecture'}
              </span>
            </h4>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-300">
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>১. রেজিস্ট্রেশন: কাস্টমার, নেটওয়ার্ক মেম্বার, ডিলার ও ডেলিভারি ম্যান ঠাকুরগাঁও সদরে স্থান নির্দিষ্ট।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>২. পণ্য ও অর্ডারিং: পণ্য কেনাকাটা, কার্ট ও ডেলিভারি কেবল ঠাকুরগাঁও সদর এলাকায় চালুকৃত।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৩. নেটওয়ার্ক প্লেসমেন্ট: AI Smart Geo Placement ঠাকুরগাঁও সদরের সক্রিয় মেম্বারদের বাইনারি প্লেসমেন্টে যুক্ত করে।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৪. কমিশন ও পয়েন্ট: PV ম্যাচিং, ক্যাশব্যাক ও লেভেল বোনাস ঠাকুরগাঁও পাইলট এরিয়ার অর্ডারে হিসাবকৃত।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৫. এড্রেস পিকিং: ১০-লেভেল অফিশিয়াল এড্রেস সিলেক্টর পাইলট এরিয়া নোটিশ এবং জেলা রেস্ট্রিকশন প্রদর্শন করে।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৬. ডাটাবেজ প্রসেসিং: ডাটাবেজ মডেল সরাসরি ৬৪ জেলার জন্য প্রস্তুত (স্কেলেবিলিটি অক্ষুণ্ণ)।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৭. সুইচিং: পাইলট মোড বন্ধ করলে কোনো ডাটাবেজ পরিবর্তনের প্রয়োজন ছাড়াই সমগ্র দেশে সম্প্রসারিত হবে।</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>৮. ব্যাজ এনফোর্সমেন্ট: অ্যাডমিন ড্যাশবোর্ড ও গ্লোবাল হেডার ব্যাজে সরাসরি পাইলট ব্যাজ দৃশ্যমান।</span>
              </li>
            </ul>
          </div>
        </div>
      ) : activeTab === 'address_db' ? (
        <AdminLocalServiceManager />
      ) : activeTab === 'markets_db' ? (
        <MarketDatabaseManager userRole="admin" />
      ) : (
        <>
          {/* Daily Sales & Registration Trends Recharts Widget */}
          <DailyTrendsWidget />

          {/* KYC Verification Queue */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-base">
            <FileCheck className="w-5 h-5" />
            <h3>{t('kycQueue')}</h3>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-xs font-bold">
            {pendingKycUsers.length} অপেক্ষমাণ
          </span>
        </div>

        {pendingKycUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg">
            কোনো পেন্ডিং কেওয়াইসি আবেদন নেই। সমস্ত প্রোফাইল হালনাগাদ করা রয়েছে।
          </div>
        ) : (
          <div className="space-y-3">
            {pendingKycUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-2 py-0.5 rounded font-mono">
                      NID: {user.nationalId || 'N/A'}
                    </span>
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400">
                    ইমেইল: {user.email} | ফোন: {user.mobileNumber} | DOB: {user.dateOfBirth || 'N/A'}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ঠিকানা: {user.mandatoryAddress?.fullServiceAddress || `${user.mandatoryAddress?.area}, ${user.mandatoryAddress?.unionName}, ${user.mandatoryAddress?.upazila}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => approveKyc(user.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>অনুমোদন করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => rejectKyc(user.id, 'NID অস্পষ্ট')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>বাতিল</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regional Statistics & Broadcast Notification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional BD Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-base border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <MapPin className="w-5 h-5" />
            <h3>{t('regionalDistribution')}</h3>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { division: 'ঢাকা বিভাগ (Dhaka)', count: 4, pct: '66%' },
              { division: 'চট্টগ্রাম বিভাগ (Chattogram)', count: 1, pct: '17%' },
              { division: 'রাজশাহী বিভাগ (Rajshahi)', count: 1, pct: '17%' },
              { division: 'খুলনা / সিলেট / অন্যান্য', count: 0, pct: '0%' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-medium text-neutral-800 dark:text-neutral-200">
                  <span>{item.division}</span>
                  <span>{item.count} ব্যবহারকারী ({item.pct})</span>
                </div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: item.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Broadcast Notification Module */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-base border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <BellRing className="w-5 h-5" />
            <h3>{t('broadcastNotification')}</h3>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                বিজ্ঞপ্তির শিরোনাম
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="যেমন: বিশেষ অফার ও সিস্টেম আপডেট"
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                বিজ্ঞপ্তির বিস্তারিত বিবরণ
              </label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="বার্তা লিখুন..."
                rows={3}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <select
                value={broadcastChannel}
                onChange={(e) => setBroadcastChannel(e.target.value as NotificationChannel)}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 font-semibold text-xs"
              >
                <option value="in_app">ইন-অ্যাপ নোটিফিকেশন (In-App)</option>
                <option value="sms">এসএমএস গ্যাংওয়ে (SMS)</option>
                <option value="email">ইমেইল সংকেত (Email)</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ব্রডকাস্ট পাঠান</span>
              </button>
            </div>
            {broadcastSent && (
              <span className="text-emerald-600 font-bold block text-[11px]">
                ✓ সকল ব্যবহারকারীকে ব্রডকাস্ট পাঠানো হয়েছে!
              </span>
            )}
          </form>
        </div>
      </div>
      </>
      )}
        </motion.div>
      </AnimatePresence>

      {/* Admin User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-black text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>নতুন ইউজার বা পার্টনার অ্যাকাউন্ট এনরোলমেন্ট (Admin)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {userCreatedSuccess ? (
              <div className="p-8 text-center space-y-2 text-emerald-600 font-black text-sm">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce text-emerald-500" />
                <span>ইউজার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!</span>
              </div>
            ) : (
              <form onSubmit={handleCreateUserByAdmin} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      সম্পূর্ণ নাম *
                    </label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="মোঃ রফিকুল ইসলাম"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      মোবাইল নম্বর *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="01700000000"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-mono text-neutral-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                      অ্যাকাউন্ট রোল / টাইপ *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 font-bold text-neutral-900 dark:text-white"
                    >
                      <option value="customer">কাস্টমার (Customer)</option>
                      <option value="vendor">ভেন্ডর / মার্চেন্ট (Vendor)</option>
                      <option value="dealer">ডিলার (Dealer)</option>
                      <option value="operations_partner">অপারেশনস পার্টনার (Hub)</option>
                      <option value="delivery_rider">ডেলিভারি রাইডার (Rider)</option>
                      <option value="admin">সিস্টেম অ্যাডমিন (Admin)</option>
                    </select>
                  </div>
                </div>

                {/* BD 10-Level Address Picker */}
                <BDAddressPicker
                  initialAddress={newAddressData}
                  onChange={(data) => setNewAddressData(data)}
                  lang="bn"
                  title="ইউজার সার্ভিস অ্যাড্রেস (BD Administrative Hierarchy)"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg"
                  >
                    ইউজার তৈরি করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
