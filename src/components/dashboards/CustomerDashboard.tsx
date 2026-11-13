/**
 * Customer Dashboard Component with Integrated E-Commerce Storefront & Network Activation
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth, normalizeBDMobileNumber } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { ProfileEditor } from '../profile/ProfileEditor';
import { ECommerceStorefront } from '../shop/ECommerceStorefront';
import { OrderTrackerModal } from '../shop/OrderTrackerModal';
import { InvoiceViewerModal } from '../common/InvoiceViewerModal';
import { downloadInvoicePDF } from '../../lib/invoicePdfGenerator';
import { MasterProductManagement } from '../products/MasterProductManagement';
import { SponsorTreeViewer } from '../network/SponsorTreeViewer';
import { BinaryTreeViewer } from '../network/BinaryTreeViewer';
import { WalletDashboard } from '../network/WalletDashboard';
import { PackagesSection } from '../network/PackagesSection';
import { RankRewardsViewer } from '../network/RankRewardsViewer';
import { NetworkReportsDashboard } from '../network/NetworkReportsDashboard';
import { ActivateNetworkModal } from '../network/ActivateNetworkModal';
import {
  ShoppingBag,
  Coins,
  ShieldCheck,
  User,
  Laptop,
  GitBranch,
  Users,
  Wallet,
  Zap,
  Crown,
  BarChart3,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package,
  Calendar,
  ChevronRight,
  Clock,
  Truck,
  FileText,
  Download,
  Printer,
  UserPlus
} from 'lucide-react';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { motion, AnimatePresence } from 'motion/react';

export const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders } = useECommerce();
  const { isNetworkActive } = useNetworkMarketing();
  const { language, t } = useLanguage();

  const customerOrders = orders.filter((o) => {
    if (!currentUser || currentUser.id === 'guest') return false;
    if (o.userId === currentUser.id) return true;
    if (currentUser.mobileNumber && o.customerPhone) {
      const uNorm = normalizeBDMobileNumber(currentUser.mobileNumber);
      const oNorm = normalizeBDMobileNumber(o.customerPhone);
      if (uNorm && oNorm && uNorm === oNorm) return true;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'store' | 'orders' | 'network' | 'profile' | 'security'>('store');
  const [networkSubTab, setNetworkSubTab] = useState<'binary' | 'sponsor' | 'wallets' | 'packages' | 'ranks' | 'reports'>('binary');
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [selectedOrderIdForModal, setSelectedOrderIdForModal] = useState<string | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<typeof orders[0] | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isRegisterCustomerOpen, setIsRegisterCustomerOpen] = useState(false);

  const openOrderDetails = (orderId: string) => {
    setSelectedOrderIdForModal(orderId);
    setIsTrackerOpen(true);
  };

  const openInvoiceModal = (order: typeof orders[0]) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={t('customerTitle')}
        subtitle={t('mandateAddressInfo')}
        icon={<ShoppingBag className="w-6 h-6 text-emerald-300" />}
      />

      {/* Quick Status Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
          <Coins className="w-4 h-4 text-emerald-500" />
          <span>
            {language === 'bn' ? 'টোকেন ব্যালেন্স:' : 'Token Balance:'}{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              {(currentUser?.tomokTokenBalance ?? 0).toLocaleString()} TOMOK
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRegisterCustomerOpen(true)}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'কাস্টমার নিবন্ধন' : 'Register Customer'}</span>
          </button>

          {!isNetworkActive ? (
            <button
              type="button"
              onClick={() => setIsActivateModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{language === 'bn' ? 'নেটওয়ার্ক অ্যাকাউন্ট অ্যাক্টিভেট করুন' : 'Activate Network Marketing'}</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Network Active Member</span>
            </div>
          )}
        </div>
      </div>

      {/* Network Marketing Activation Callout Banner if Customer is not yet Active */}
      {!isNetworkActive && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                  নেটওয়ার্ক মার্কেটিং অ্যাকাউন্ট অ্যাক্টিভেট করুন
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  Affiliate Earning Opportunity
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-2xl">
                আপনি সাধারণ কাস্টমার হিসেবে পণ্য কেনাকাটা করতে পারছেন। আপনার বর্তমান কাস্টমার আইডি অপরিবর্তিত রেখে আফিলিয়েট নেটওয়ার্ক মার্কেটিং মেম্বার হতে এখানে ক্লিক করুন।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsActivateModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>নেটওয়ার্ক মার্কেটিং অ্যাক্টিভেট করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>অনলাইন শপ (E-Commerce Store)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>আমার অর্ডারসমূহ ({customerOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('network')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'network'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <GitBranch className="w-4 h-4 text-amber-300" />
          <span>নেটওয়ার্ক মার্কেটিং পোর্টাল</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>আমার প্রোফাইল ও ঠিকানা</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>নিরাপত্তা ও সেশন</span>
        </button>
      </div>

      {/* Network Marketing Sub-Navigation Bar when Network Tab is Active */}
      {activeTab === 'network' && (
        <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-wrap items-center gap-2 text-xs font-bold">
          {[
            { id: 'binary', label: 'বাইনারি ট্র্রি ও ম্যাচিং', icon: GitBranch },
            { id: 'sponsor', label: 'স্পন্সর ট্রি (২০ জেনারেশন)', icon: Users },
            { id: 'wallets', label: '৫টি ওয়ালেট ও উইথড্রয়াল', icon: Wallet },
            { id: 'packages', label: 'অ্যাক্টিভেশন প্যাকেজ (100-500 PV)', icon: Zap },
            { id: 'ranks', label: 'র‍্যাঙ্ক প্রমোশন ও রিওয়ার্ডস', icon: Crown },
            { id: 'reports', label: 'গ্রোথ অ্যানালিটিক্স ও রিপোর্টস', icon: BarChart3 }
          ].map((sub) => {
            const Icon = sub.icon;
            const isSubActive = networkSubTab === sub.id;

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setNetworkSubTab(sub.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isSubActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (activeTab === 'network' ? `_${networkSubTab}` : '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'store' && <ECommerceStorefront />}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="font-black text-neutral-900 dark:text-white text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>আমার অর্ডারের তালিকা (Order History)</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  আপনার করা সকল ক্রয়ের রসিদ ও বিস্তারিত তথ্য
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs rounded-full">
                মোট {customerOrders.length} টি অর্ডার
              </span>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="w-12 h-12 text-neutral-300 mx-auto" />
                <h4 className="font-bold text-neutral-600 dark:text-neutral-400 text-sm">
                  আপনি এখনো কোনো অর্ডার করেননি।
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  কেনাকাটা শুরু করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {customerOrders.map((order) => {
                  const itemsCount = order.items?.reduce((a, b) => a + (b.quantity || 1), 0) || order.items?.length || 0;

                  return (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-500/50 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                              #{order.id}
                            </span>
                            <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[10px] font-bold rounded">
                              {order.paymentMethod?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-neutral-400 block font-semibold">Total Payable</span>
                          <span className="font-black font-mono text-base text-emerald-600 dark:text-emerald-400">
                            ৳{(order.grandTotal ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-neutral-500 font-semibold block">
                            পণ্যসমূহ ({itemsCount} টি):
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {order.items?.map((item, i) => (
                              <span key={i} className="px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 font-medium">
                                {item.productTitle || item.product?.titleBn || 'পণ্য'} × {item.quantity}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadInvoicePDF(order)}
                            className="px-3.5 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                            title="ইনভয়েস PDF ডাউনলোড করুন"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>ইনভয়েস PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openInvoiceModal(order)}
                            className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer shrink-0"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ইনভয়েস দেখুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openOrderDetails(order.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-xs transition-transform active:scale-98 cursor-pointer shrink-0"
                          >
                            <span>ট্র্যাকিং ও বিস্তারিত</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-6">
          {!isNetworkActive && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-3xl p-6 text-center space-y-3">
              <Zap className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-black text-neutral-900 dark:text-white">
                নেটওয়ার্ক মার্কেটিং হাব আনলক করতে আপনার অ্যাকাউন্ট অ্যাক্টিভেট করুন
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto">
                আপনি বর্তমানে কাস্টমার মোডে আছেন। অ্যাক্টিভেট বোতামে ক্লিক করে স্পন্সর আইডি নির্বাচন করুন এবং আপনার অ্যাকাউন্টকে আফিলিয়েট মেম্বারে উন্নীত করুন।
              </p>
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>অ্যাক্টিভেট নেটওয়ার্ক মার্কেটিং নাও</span>
              </button>
            </div>
          )}

          {networkSubTab === 'binary' && <BinaryTreeViewer />}
          {networkSubTab === 'sponsor' && <SponsorTreeViewer />}
          {networkSubTab === 'wallets' && <WalletDashboard />}
          {networkSubTab === 'packages' && <PackagesSection />}
          {networkSubTab === 'ranks' && <RankRewardsViewer />}
          {networkSubTab === 'reports' && <NetworkReportsDashboard />}
        </div>
      )}

      {activeTab === 'profile' && <ProfileEditor />}

      {activeTab === 'security' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <ShieldCheck className="w-5 h-5" />
            <h3>{t('securityAndSessions')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-start gap-3">
              <Laptop className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-neutral-900 dark:text-white block">
                  বর্তমান সক্রিয় সেশন (Chrome / Cloud Run Container)
                </span>
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  IP: 103.102.14.88 | অবস্থান: ঢাকা, বাংলাদেশ
                </p>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold text-[10px]">
                  Active Now
                </span>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
              <span className="font-bold text-neutral-900 dark:text-white block">
                টু-ফ্যাক্টর অ্যাথেনটিকেশন (2FA / Security)
              </span>
              <p className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                আপনার এনক্রিপ্টেড পাসওয়ার্ড ও সিকিউরিটি টোকেন নিরাপদ রয়েছে।
              </p>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {/* Activation Modal */}
      <ActivateNetworkModal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
      />

      {/* Order Details Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        targetOrderId={selectedOrderIdForModal || undefined}
      />

      {/* Invoice Viewer Modal */}
      {selectedOrderForInvoice && (
        <InvoiceViewerModal
          order={selectedOrderForInvoice}
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedOrderForInvoice(null);
          }}
        />
      )}

      {/* Dashboard Customer Registration Modal - EXACT SAME SHARED FORM */}
      {isRegisterCustomerOpen && (
        <CustomerRegistrationModal
          isOpen={isRegisterCustomerOpen}
          onClose={() => setIsRegisterCustomerOpen(false)}
          source="dashboard"
          title="কাস্টমার রেজিস্ট্রেশন (Customer Only)"
          subtitle="নতুন কাস্টমার একাউন্ট তৈরি করুন"
          initialReferralId={currentUser?.customerId || 'TMK000001'}
        />
      )}

    </div>
  );
};
