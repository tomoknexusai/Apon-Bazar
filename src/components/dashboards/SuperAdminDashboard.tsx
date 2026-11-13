/**
 * Super Admin Dashboard Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { AdminNetworkControlPanel } from '../network/AdminNetworkControlPanel';
import { PermanentBinaryTreeManager } from '../network/PermanentBinaryTreeManager';
import { SuperAdminBinaryMatchingManager } from '../network/SuperAdminBinaryMatchingManager';
import { AdminLocalServiceManager } from '../admin/AdminLocalServiceManager';
import { LocalAddressDatabaseManager } from '../admin/LocalAddressDatabaseManager';
import { SuperAdminControlCenter } from '../admin/SuperAdminControlCenter';
import { SuperAdminRoleDropdown } from '../admin/SuperAdminRoleDropdown';
import { OrderRoutingManagerHub } from '../shop/OrderRoutingManagerHub';
import { SmsOrderManagementHub } from '../sms/SmsOrderManagementHub';
import { RoleApplicationManager } from '../admin/RoleApplicationManager';
import { SuperAdminIDProfileManager } from '../admin/SuperAdminIDProfileManager';
import { ProductPricingPaymentManagement } from '../admin/ProductPricingPaymentManagement';
import { DeliveryChargeManagement } from '../admin/DeliveryChargeManagement';
import { GlobalVatSettingsControl } from '../admin/GlobalVatSettingsControl';
import { DailyTrendsWidget } from '../common/DailyTrendsWidget';
import {
  ShieldCheck,
  Database,
  Settings,
  Activity,
  Users,
  Lock,
  Copy,
  Check,
  Server,
  Sliders,
  MapPin,
  Grid,
  ShoppingBag,
  GitBranch,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  MessageSquare,
  Award,
  Bot,
  DollarSign,
  Percent,
  Truck,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPER_ADMIN_RLS_POLICIES_SQL } from '../../lib/security';
import { FIXED_SUPER_ADMIN_ID } from '../../types';
import { DiscountManagementControl } from '../admin/DiscountManagementControl';

export const SuperAdminDashboard: React.FC = () => {
  const {
    systemSettings,
    updateSystemSettings,
    auditLogs,
    allUsers,
    changeSuperAdminPassword,
    currentUser
  } = useAuth();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'master_control' | 'product_pricing' | 'discount_management' | 'delivery_management' | 'vat_tax' | 'users_management' | 'orders_routing' | 'role_applications' | 'sms_ai_hub' | 'binary_tree' | 'overview' | 'network_control' | 'address_db'>('master_control');
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'vat_tax'>('general');

  const [companyName, setCompanyName] = useState(systemSettings.companyName);
  const [tokenName, setTokenName] = useState(systemSettings.tokenName);
  const [currencyCode, setCurrencyCode] = useState(systemSettings.currencyCode);
  const [currencySymbol, setCurrencySymbol] = useState(systemSettings.currencySymbol);
  const [timezone, setTimezone] = useState(systemSettings.timezone);
  const [companyMasterId, setCompanyMasterId] = useState(systemSettings.companyMasterId || 'GBD000001');
  const [sellerContactEmail, setSellerContactEmail] = useState(
    systemSettings.sellerContactEmail || systemSettings.dealerContactEmail || 'dealer@aponbazar.com'
  );
  const [savedSettings, setSavedSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Super Admin Password Management Form State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const totalTomok = allUsers.reduce((acc, u) => acc + u.tomokTokenBalance, 0);

  const handleCancelSettings = () => {
    setCompanyName(systemSettings.companyName);
    setTokenName(systemSettings.tokenName);
    setCurrencyCode(systemSettings.currencyCode);
    setCurrencySymbol(systemSettings.currencySymbol);
    setTimezone(systemSettings.timezone);
    setCompanyMasterId(systemSettings.companyMasterId || 'GBD000001');
    setSellerContactEmail(systemSettings.sellerContactEmail || systemSettings.dealerContactEmail || 'dealer@aponbazar.com');
    setSettingsError(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);

    // Strict Validation
    if (!companyName.trim()) {
      setSettingsError('কোম্পানির নাম অবশ্যই প্রদান করতে হবে!');
      return;
    }
    if (!tokenName.trim()) {
      setSettingsError('টোকেনের নাম অবশ্যই প্রদান করতে হবে!');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sellerContactEmail.trim() && !emailRegex.test(sellerContactEmail.trim())) {
      setSettingsError('সেলার/ডিলার যোগাযোগের জন্য সঠিক ইমেইল ঠিকানা প্রদান করুন!');
      return;
    }

    setIsSavingSettings(true);
    try {
      // Simulate micro async tick for safe state synchronization
      await new Promise((resolve) => setTimeout(resolve, 300));

      updateSystemSettings({
        companyName: companyName.trim(),
        tokenName: tokenName.trim(),
        currencyCode: currencyCode.trim() || 'BDT',
        currencySymbol: currencySymbol.trim() || '৳',
        timezone: timezone.trim() || 'Asia/Dhaka',
        companyMasterId: companyMasterId.trim() || 'GBD000001',
        sellerContactEmail: sellerContactEmail.trim(),
        dealerContactEmail: sellerContactEmail.trim()
      });
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 4000);
    } catch (err: any) {
      setSettingsError(err?.message || 'সেটিংস সংরক্ষণে ত্রুটি দেখা দিয়েছে');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSuperAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (newPass !== confirmPass) {
      setPassError('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    if (newPass.length < 6) {
      setPassError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
      return;
    }

    setPassLoading(true);
    try {
      const res = await changeSuperAdminPassword(currentPass, newPass);
      if (res.success) {
        setPassSuccess(res.message);
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassError(res.message);
      }
    } catch (err: any) {
      setPassError(err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setPassLoading(false);
    }
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPER_ADMIN_RLS_POLICIES_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 bg-[#E8F5E9] p-4 sm:p-6 rounded-3xl border border-[#C8E6C9] shadow-xs text-neutral-800">
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={t('superAdminTitle')}
        subtitle={language === 'bn' ? 'এন্টারপ্রাইজ ফাউন্ডেশন, সিস্টেম পারমিশন, টোকেন ইকোনমি ও বিশ্বস্ত নিরাপত্তা ড্যাশবোর্ড' : 'Enterprise architecture, system permissions, token economy & root security'}
        icon={<ShieldCheck className="w-6 h-6 text-[#157347]" />}
        rightAction={<SuperAdminRoleDropdown />}
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#C8E6C9] pb-2 text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('master_control')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'master_control'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>মাস্টার কন্ট্রোল সেন্টার (Master Control Center)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-pricing-payment"
          onClick={() => setActiveTab('product_pricing')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'product_pricing'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>প্রাইসিং ও পেমেন্ট ব্যবস্থাপনা (Pricing & Payment)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-discount-management"
          onClick={() => setActiveTab('discount_management')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'discount_management'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>সেন্ট্রালাইজড ডিসকাউন্ট কন্ট্রোল (Discount Management)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-delivery-management"
          onClick={() => setActiveTab('delivery_management')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'delivery_management'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>ডেলিভারি চার্জ কনফিগারেশন (Delivery Charge Management)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-vat-tax"
          onClick={() => setActiveTab('vat_tax')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'vat_tax'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>ভ্যাট ও ট্যাক্স সেটিংস (VAT/Tax Management)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-all-ids"
          onClick={() => setActiveTab('users_management')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'users_management'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সকল আইডি ও প্রোফাইল ব্যবস্থাপনা (All ID & Profile Management)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-binary-matching"
          onClick={() => setActiveTab('binary_tree')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'binary_tree'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>নেটওয়ার্ক ম্যানেজমেন্ট: বাইনারি ট্রি ও ম্যাচিং (Binary Tree & Matching)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders_routing')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'orders_routing'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>অল বাংলাদেশ অর্ডার রাউটিং ম্যাট্রিক্স (Order Routing Matrix)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-role-applications"
          onClick={() => setActiveTab('role_applications')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'role_applications'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>আবেদন ও কোটা নিয়ন্ত্রণ (Role Applications & Quotas)</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-sms-ai"
          onClick={() => setActiveTab('sms_ai_hub')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'sms_ai_hub'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>SMS অর্ডার সিস্টেম ও ২৪/৭ AI রিপ্লাই হাব (24/7 AI SMS Hub)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>সিস্টেম ওভারভিউ & RLS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('network_control')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'network_control'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>নেটওয়ার্ক মার্কেটিং এডমিন কনফিগারেশন</span>
        </button>

        <button
          type="button"
          id="btn-tab-superadmin-local-address-db"
          onClick={() => setActiveTab('address_db')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'address_db'
              ? 'bg-[#198754] text-white shadow-xs font-bold ring-2 ring-emerald-400'
              : 'bg-white text-neutral-700 hover:bg-emerald-50 hover:text-[#157347] border border-[#C8E6C9]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>লোকাল এড্রেস ডাটাবেজ (Local Address Database)</span>
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
          {activeTab === 'master_control' ? (
            <div className="space-y-6">
              <DailyTrendsWidget />
              <SuperAdminControlCenter />
            </div>
          ) : activeTab === 'product_pricing' ? (
            <ProductPricingPaymentManagement />
          ) : activeTab === 'discount_management' ? (
            <DiscountManagementControl />
          ) : activeTab === 'delivery_management' ? (
            <DeliveryChargeManagement />
          ) : activeTab === 'vat_tax' ? (
            <div className="bg-white border border-[#C8E6C9] rounded-2xl p-6 shadow-xs">
              <GlobalVatSettingsControl />
            </div>
          ) : activeTab === 'users_management' ? (
            <SuperAdminIDProfileManager />
          ) : activeTab === 'binary_tree' ? (
            <SuperAdminBinaryMatchingManager />
          ) : activeTab === 'orders_routing' ? (
            <OrderRoutingManagerHub role="super_admin" title="সুপার এডমিন অল বাংলাদেশ রাউটিং ম্যাট্রিক্স (Role: Super Admin)" />
          ) : activeTab === 'role_applications' ? (
            <RoleApplicationManager />
          ) : activeTab === 'sms_ai_hub' ? (
            <SmsOrderManagementHub role="super_admin" title="সুপার এডমিন: 24/7 SMS Product Order System & AI Gateway Control" />
          ) : activeTab === 'network_control' ? (
            <AdminNetworkControlPanel />
          ) : activeTab === 'address_db' ? (
            <LocalAddressDatabaseManager />
          ) : (
            <div className="space-y-6">
              <DailyTrendsWidget />
              {/* Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#C8E6C9] p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold">
                    <span>{t('totalUsers')}</span>
                    <Users className="w-4 h-4 text-[#157347]" />
                  </div>
                  <p className="text-2xl font-black text-[#157347] mt-2">
                    {allUsers.length}
                  </p>
                  <span className="text-[10px] text-emerald-800 font-medium">৬ টি পৃথক রোল সক্রিয়</span>
                </div>

                <div className="bg-white border border-[#C8E6C9] p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold">
                    <span>{t('tomokReserve')}</span>
                    <Database className="w-4 h-4 text-[#157347]" />
                  </div>
                  <p className="text-2xl font-black text-[#157347] mt-2 font-mono">
                    {(totalTomok ?? 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-neutral-500">টোকেন টিকার: {systemSettings.tokenName}</span>
                </div>

                <div className="bg-white border border-[#C8E6C9] p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold">
                    <span>{t('systemHealth')}</span>
                    <Activity className="w-4 h-4 text-[#157347]" />
                  </div>
                  <p className="text-2xl font-black text-[#157347] mt-2">
                    100% OK
                  </p>
                  <span className="text-[10px] text-neutral-500">Timezone: {systemSettings.timezone}</span>
                </div>

                <div className="bg-white border border-[#C8E6C9] p-4 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-neutral-600 text-xs font-semibold">
                    <span>{t('rlsSecurityActive')}</span>
                    <Lock className="w-4 h-4 text-[#157347]" />
                  </div>
                  <p className="text-2xl font-black text-[#157347] mt-2">
                    10 Policies
                  </p>
                  <span className="text-[10px] text-emerald-800 font-medium">RBAC Matrix Enforced</span>
                </div>
              </div>

              {/* Global Settings & Super Admin Security Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Immutable Super Admin Identity & Password Management */}
                <div className="bg-white text-neutral-800 rounded-2xl p-6 shadow-xs border border-[#C8E6C9] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-3">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-[#157347]" />
                      <h2 className="font-black text-sm text-[#157347]">
                        সুপার এডমিন নিরাপত্তা প্রোফাইল (Immutable ID)
                      </h2>
                    </div>
                    <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#157347] font-mono text-[10px] font-bold rounded-full border border-[#A5D6A7]">
                      RLS PROTECTED
                    </span>
                  </div>

                  <div className="p-3.5 bg-[#F4FBF5] rounded-xl border border-[#C8E6C9] space-y-2 text-xs text-neutral-700">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium text-[11px]">স্থায়ী সুপার এডমিন আইডি:</span>
                      <span className="font-mono font-black text-[#157347] text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-[#A5D6A7]">
                        {FIXED_SUPER_ADMIN_ID}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium text-[11px]">আইডি পরিবর্তনের অধিকার:</span>
                      <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3" /> অপরিবর্তনীয় (Immutable)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium text-[11px]">ডাটাবেজ ডিলিট প্রটেকশন:</span>
                      <span className="text-[#157347] font-bold text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Trigger Enforced
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600 font-medium text-[11px]">লগইন ক্রেডেনশিয়ালস:</span>
                      <span className="text-neutral-800 font-bold text-[11px]">
                        Salted SHA-256 (Never Plaintext)
                      </span>
                    </div>
                  </div>

                  {/* Secure Password Rotation Form */}
                  <form onSubmit={handleSuperAdminPasswordChange} className="space-y-3 pt-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#157347] font-bold">
                      <KeyRound className="w-4 h-4 text-amber-500" />
                      <span>সুপার এডমিন পাসওয়ার্ড পরিবর্তন করুন</span>
                    </div>

                    {passSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-[11px] flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                        <span>{passSuccess}</span>
                      </div>
                    )}

                    {passError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 font-bold text-[11px] flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{passError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-700 font-medium block">বর্তমান পাসওয়ার্ড</label>
                      <input
                        type="password"
                        placeholder="বর্তমান পাসওয়ার্ড দিন"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        required
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-lg p-2 text-neutral-900 font-mono text-xs focus:ring-1 focus:ring-[#198754] focus:border-[#198754] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-neutral-700 font-medium block">নতুন পাসওয়ার্ড</label>
                        <input
                          type="password"
                          placeholder="কমপক্ষে ৬ অক্ষর"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          required
                          className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-lg p-2 text-neutral-900 font-mono text-xs focus:ring-1 focus:ring-[#198754] focus:border-[#198754] outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-neutral-700 font-medium block">পুনরায় লিখুন</label>
                        <input
                          type="password"
                          placeholder="কনফার্ম করুন"
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          required
                          className="w-full bg-[#F4FBF5] border border-[#C8E6C9] rounded-lg p-2 text-neutral-900 font-mono text-xs focus:ring-1 focus:ring-[#198754] focus:border-[#198754] outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passLoading}
                      className="w-full py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {passLoading ? 'পাসওয়ার্ড আপডেট হচ্ছে...' : 'নিরাপদে পাসওয়ার্ড পরিবর্তন করুন'}
                    </button>
                  </form>
                </div>

                {/* Global Settings Form & VAT Settings */}
                <div className="lg:col-span-2 bg-white border border-[#C8E6C9] rounded-2xl p-6 shadow-xs space-y-4 text-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E8F5E9] pb-3 gap-3">
                    <div className="flex items-center gap-2 text-[#157347]">
                      <Settings className="w-5 h-5" />
                      <h2 className="font-semibold text-base text-[#157347]">
                        {settingsSubTab === 'general' ? t('globalSettings') : 'ভ্যাট ও ট্যাক্স কনফিগারেশন (VAT/Tax)'}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setSettingsSubTab('general')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          settingsSubTab === 'general'
                            ? 'bg-white text-[#157347] shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        কোম্পানি সেটিংস
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsSubTab('vat_tax')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          settingsSubTab === 'vat_tax'
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        <Percent className="w-3.5 h-3.5" />
                        <span>VAT / Tax সেটিংস</span>
                      </button>
                    </div>
                  </div>

                  {settingsSubTab === 'vat_tax' ? (
                    <GlobalVatSettingsControl />
                  ) : (
                    <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">
                        কোম্পানির নাম (Company Name)
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">
                        টোকেন নাম (Token Integration)
                      </label>
                      <input
                        type="text"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        required
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">
                        মুদ্রা চিহ্ন (Currency)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={currencyCode}
                          onChange={(e) => setCurrencyCode(e.target.value)}
                          className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900"
                        />
                        <input
                          type="text"
                          value={currencySymbol}
                          onChange={(e) => setCurrencySymbol(e.target.value)}
                          className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900 text-center font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">
                        টাইমজোন (Timezone)
                      </label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-700">
                        কোম্পানি মাস্টার আইডি (Company Master ID)
                      </label>
                      <input
                        type="text"
                        value={companyMasterId}
                        onChange={(e) => setCompanyMasterId(e.target.value.toUpperCase())}
                        placeholder="TMK000001"
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900 font-mono font-bold uppercase"
                      />
                      <p className="text-[10px] text-neutral-500">
                        রেফার ও প্লেসমেন্ট আইডি ছাড়া রেজিস্ট্রেশনের ক্ষেত্রে স্বয়ংক্রিয় ডান-ডাউনলাইন ফলব্যাক আইডি।
                      </p>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="font-semibold text-neutral-700">
                        সেলার / ডিলার যোগাযোগ ইমেইল (Seller/Dealer Contact Email)
                      </label>
                      <input
                        type="email"
                        value={sellerContactEmail}
                        onChange={(e) => setSellerContactEmail(e.target.value)}
                        placeholder="dealer@aponbazar.com"
                        className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-lg p-2.5 text-neutral-900 font-mono"
                      />
                      <p className="text-[11px] text-neutral-500">
                        রেজিস্ট্রেশন পেইজে সেলার ও ডিলারদের Email Us বাটনে এই ইমেইল ঠিকানা কার্যকর হবে।
                      </p>
                    </div>

                    {settingsError && (
                      <div className="md:col-span-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{settingsError}</span>
                      </div>
                    )}

                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8F5E9]">
                      <div>
                        {savedSettings ? (
                          <span className="text-[#157347] font-bold text-xs flex items-center gap-1.5 bg-[#E8F5E9] px-3 py-1.5 rounded-lg border border-[#A5D6A7]">
                            <Check className="w-4 h-4 text-[#198754]" /> গ্লোবাল সেটিংস সফলভাবে সংরক্ষিত হয়েছে! (Updated successfully)
                          </span>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">
                            * কোনো অটো-সেভ নেই। পরিবর্তন কার্যকর করতে 'Save Changes' বাটনে ক্লিক করুন।
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleCancelSettings}
                          disabled={isSavingSettings}
                          className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>বাতিল (Cancel)</span>
                        </button>
                        <button
                          type="submit"
                          id="btn-superadmin-save-global-settings"
                          disabled={isSavingSettings}
                          className="px-6 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl shadow-sm transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingSettings ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>সংরক্ষণ হচ্ছে... (Saving...)</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>পরিবর্তন সংরক্ষণ করুন (Save Changes)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                  )}
                </div>
              </div>

              {/* SQL Migration & Audit Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SQL Preview */}
                <div className="bg-white text-neutral-800 rounded-2xl p-5 border border-[#C8E6C9] shadow-xs space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-2">
                    <span className="text-[#157347] font-bold flex items-center gap-2">
                      <Database className="w-4 h-4" /> PostgreSQL Schema & RLS Policies ({FIXED_SUPER_ADMIN_ID})
                    </span>
                    <button
                      type="button"
                      onClick={copySqlToClipboard}
                      className="flex items-center gap-1 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#157347] border border-[#A5D6A7] px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-[#198754]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? t('copied') : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-[11px] text-emerald-950 leading-relaxed max-h-56 p-3 bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl">
                    {SUPER_ADMIN_RLS_POLICIES_SQL}
                  </pre>
                  <span className="text-[10px] text-neutral-500 block">
                    পূর্ণাঙ্গ PostgreSQL RLS এবং ট্রিগার রুলস: /src/lib/security.ts ও /supabase/migrations/
                  </span>
                </div>

                {/* Audit Logs */}
                <div className="bg-white border border-[#C8E6C9] rounded-2xl p-5 shadow-xs space-y-3 text-neutral-800">
                  <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-2">
                    <span className="font-bold text-sm text-[#157347] flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#198754]" /> {t('auditLogs')}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">{auditLogs.length} Records</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-[#F4FBF5] rounded-lg border border-[#E8F5E9] flex items-start justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-950">{log.action}</span>
                            <span className="text-[10px] bg-emerald-100 text-[#157347] px-1.5 py-0.5 rounded font-mono font-bold">
                              {log.resource}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-700 mt-0.5">
                            {log.details}
                          </p>
                          <span className="text-[10px] text-neutral-500 block mt-1">
                            Actor: {log.actorName} ({log.actorRole}) | IP: {log.ipAddress}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
