/**
 * Operations Partner Dashboard Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { ZoneOrderFulfillmentBoard } from '../partner/ZoneOrderFulfillmentBoard';
import { OperationsPartnerWardManager } from '../partner/OperationsPartnerWardManager';
import { MarketDatabaseManager } from '../common/MarketDatabaseManager';
import { OrderRoutingManagerHub } from '../shop/OrderRoutingManagerHub';
import { Network, Building2, MapPin, Users, Target, Zap } from 'lucide-react';
import { motion } from 'motion/react';

export const OperationsPartnerDashboard: React.FC = () => {
  const { language, t } = useLanguage();
  const { currentUser } = useAuth();

  const assignedArea = currentUser?.mandatoryAddress
    ? {
        division: currentUser.mandatoryAddress.division,
        district: currentUser.mandatoryAddress.district,
        upazila: currentUser.mandatoryAddress.upazila,
        unionName: currentUser.mandatoryAddress.unionName,
        ward: currentUser.mandatoryAddress.ward
      }
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={language === 'bn' ? 'অপারেশন অফিস ও অফিসার ড্যাশবোর্ড' : t('partnerTitle')}
        subtitle={
          language === 'bn'
            ? 'জোনভিত্তিক অপারেশন অফিস, অর্ডার ফুলফিলমেন্ট, রাইডার রি-অ্যাসাইনমেন্ট ও ডেলিভারি ব্যবস্থাপনা'
            : 'Zone operation office, order fulfillment, rider reassignment & delivery management'
        }
        icon={<Zap className="w-6 h-6 text-emerald-300" />}
      />

      {/* Main Zone Order Fulfillment & Rider Reassignment Board */}
      <ZoneOrderFulfillmentBoard />

      {/* Operations Partner Order Routing Hub */}
      <OrderRoutingManagerHub role="operations_partner" title="অপারেশন পার্টনার আঞ্চলিক রাউটিং মডিউল (Role: Operation Partner)" />

      {/* Ward Management Module for Operations Partner */}
      <OperationsPartnerWardManager />

      {/* Market/Bazar Management Module for Operations Partner */}
      <MarketDatabaseManager
        userRole="operations_partner"
        currentUserId={currentUser?.id}
        currentUserName={currentUser?.fullName}
        assignedArea={assignedArea}
      />

      {/* Union Coverage Matrix Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-base">
            <MapPin className="w-5 h-5" />
            <h3>{t('coverageMatrix')} (রাজশাহী হাব)</h3>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 font-semibold">
              <tr>
                <th className="p-3 rounded-l-lg">উপজেলা</th>
                <th className="p-3">ইউনিয়ন / ওয়ার্ড</th>
                <th className="p-3">পোস্টাল কোড</th>
                <th className="p-3">দায়িত্বপ্রাপ্ত সাব-ডিলার</th>
                <th className="p-3 rounded-r-lg">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {[
                { upazila: 'বোয়ালিয়া', union: 'সাহেব বাজার', code: '6000', dealer: 'মোঃ শরিফুল ইসলাম', status: 'সক্রিয়' },
                { upazila: 'বোয়ালিয়া', union: 'কাজলা', code: '6204', dealer: 'আলমগীর হোসেন', status: 'সক্রিয়' },
                { upazila: 'পবা', union: 'হরিপুর', code: '6201', dealer: 'রাজশাহী লোকাল এক্সপ্রেস', status: 'সক্রিয়' },
                { upazila: 'পবা', union: 'দামকুড়া', code: '6202', dealer: 'নূরে আলম ডিলারশিপ', status: 'প্রক্রিয়াধীন' }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-3 font-semibold text-neutral-900 dark:text-white">{row.upazila}</td>
                  <td className="p-3">{row.union}</td>
                  <td className="p-3 font-mono">{row.code}</td>
                  <td className="p-3">{row.dealer}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'সক্রিয়'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
