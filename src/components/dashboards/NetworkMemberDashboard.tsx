/**
 * Network Active Member Dashboard Component
 * Dedicated dashboard for Network Active Members displaying Network MLM Features + E-Commerce Storefront
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { ECommerceStorefront } from '../shop/ECommerceStorefront';
import { BinaryTreeViewer } from '../network/BinaryTreeViewer';
import { SponsorTreeViewer } from '../network/SponsorTreeViewer';
import { WalletDashboard } from '../network/WalletDashboard';
import { PackagesSection } from '../network/PackagesSection';
import { RankRewardsViewer } from '../network/RankRewardsViewer';
import { NetworkReportsDashboard } from '../network/NetworkReportsDashboard';
import { CustomerRegistrationTable } from '../network/CustomerRegistrationTable';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { ProfileEditor } from '../profile/ProfileEditor';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  ShoppingBag,
  GitBranch,
  Users,
  Wallet,
  Zap,
  Crown,
  BarChart3,
  CheckCircle2,
  Coins,
  ShieldCheck,
  User,
  UserPlus
} from 'lucide-react';

export const NetworkMemberDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { isNetworkActive } = useNetworkMarketing();
  const { language, t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'network' | 'store' | 'profile'>('network');
  const [networkSubTab, setNetworkSubTab] = useState<'binary' | 'sponsor' | 'wallets' | 'packages' | 'ranks' | 'reports' | 'registrations'>('binary');
  const [isCustomerRegisterOpen, setIsCustomerRegisterOpen] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={language === 'bn' ? 'নেটওয়ার্ক অ্যাক্টিভ মেম্বার ড্যাশবোর্ড' : 'Network Active Member Dashboard'}
        subtitle={language === 'bn' ? 'বাইনারি টিম ট্রিকোলজি, স্পন্সর ট্রি, পিন ব্যাক ওয়ালেট ও কমিশন পোর্টাল' : 'Binary tree structure, sponsor genealogy, MLM wallets & commission analytics'}
        icon={<Network className="w-6 h-6 text-emerald-300" />}
      />

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-2 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'network'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>{language === 'bn' ? 'নেটওয়ার্ক মার্কেটিং ও মেম্বার প্যানেল' : 'Network Marketing Panel'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'store'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{language === 'bn' ? 'অনলাইন শপ (E-Commerce Store)' : 'E-Commerce Store'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === 'bn' ? 'প্রোফাইল সেটিংস' : 'My Profile'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomerRegisterOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{language === 'bn' ? 'কাস্টমার নিবন্ধন' : 'Customer Registration'}</span>
          </button>

          <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Active Status: VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (activeTab === 'network' ? `_${networkSubTab}` : '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: NETWORK MARKETING SUB-SYSTEM */}
          {activeTab === 'network' && (
            <div className="space-y-6">
              {/* Sub-tab pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNetworkSubTab('binary')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'binary'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>বাইনারি টিম ট্রিকোলজি (Binary Tree)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('sponsor')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'sponsor'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>স্পন্সর মেম্বার জিনিয়ালজি (Sponsor Tree)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('wallets')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'wallets'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>এমএলএম ওয়ালেট ও উইথড্র (Wallets)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('packages')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'packages'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>প্যাকেজ ও পিভি আপগ্রেড (Packages)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('ranks')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'ranks'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>র‍্যাংক ও ইনসেনটিভস (Ranks)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('reports')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'reports'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>রিপোর্ট ও এনালিটিক্স (Reports)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNetworkSubTab('registrations')}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    networkSubTab === 'registrations'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>কাস্টমার রেজিস্ট্রেশন তালিকা ও ফর্ম</span>
                </button>
              </div>

              {/* Sub Tab View Engine */}
              {networkSubTab === 'binary' && <BinaryTreeViewer />}
              {networkSubTab === 'sponsor' && <SponsorTreeViewer />}
              {networkSubTab === 'wallets' && <WalletDashboard />}
              {networkSubTab === 'packages' && <PackagesSection />}
              {networkSubTab === 'ranks' && <RankRewardsViewer />}
              {networkSubTab === 'reports' && <NetworkReportsDashboard />}
              {networkSubTab === 'registrations' && (
                <CustomerRegistrationTable onOpenRegisterModal={() => setIsCustomerRegisterOpen(true)} />
              )}
            </div>
          )}

          {/* TAB 2: STOREFRONT */}
          {activeTab === 'store' && <ECommerceStorefront />}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && <ProfileEditor />}
        </motion.div>
      </AnimatePresence>

      {/* Dashboard Customer Registration Modal - EXACT SAME SHARED FORM */}
      {isCustomerRegisterOpen && (
        <CustomerRegistrationModal
          isOpen={isCustomerRegisterOpen}
          onClose={() => setIsCustomerRegisterOpen(false)}
          source="dashboard"
          title="Customer Registration"
          initialReferralId={currentUser?.customerId || 'TMK000001'}
        />
      )}

    </div>
  );
};
