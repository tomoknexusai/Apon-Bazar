/**
 * Network Marketing Analytics & Reports Dashboard
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { TrendingUp, BarChart3, Users, DollarSign, Award, Download, Calendar, Filter } from 'lucide-react';

export const NetworkReportsDashboard: React.FC = () => {
  const { networkReports, currentMember } = useNetworkMarketing();
  const [activeTab, setActiveTab] = useState<'growth' | 'commissions' | 'performers'>('growth');

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <h3 className="font-black text-xl">নেটওয়ার্ক মার্কেটিং অ্যানালিটিক্স ও রিপোর্টস</h3>
          </div>
          <p className="text-xs text-indigo-100/80 mt-1">
            সাপ্তাহিক ও মাসিক নেটওয়ার্ক গ্রোথ, কমিশন ব্রেকডাউন এবং টিম পারফরম্যান্স লিডারবোর্ড
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('রিপোর্ট CSV ডাউনলোড শুরু হয়েছে!')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs border border-white/20 flex items-center gap-2 shadow-xs"
        >
          <Download className="w-4 h-4 text-emerald-300" />
          <span>এক্সপোর্ট রিপোর্ট (Export CSV)</span>
        </button>
      </div>

      {/* Report Category Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-bold">
        {[
          { id: 'growth', label: 'নেটওয়ার্ক গ্রোথ ও PV/GV', icon: TrendingUp },
          { id: 'commissions', label: 'কমিশন ব্রেকডাউন (২০ লেভেল)', icon: DollarSign },
          { id: 'performers', label: 'টিম পারফরমার লিডারবোর্ড', icon: Users }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Network Growth */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="font-black text-sm text-neutral-900 dark:text-white">
              সাপ্তাহিক গ্রোথ ট্রেন্ড (Weekly Growth Report)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                    <th className="py-2.5 px-3">সময়কাল (Week)</th>
                    <th className="py-2.5 px-3">নতুন মেম্বার যোগদান</th>
                    <th className="py-2.5 px-3">মোট জেনারেটেড PV</th>
                    <th className="py-2.5 px-3 text-right">বিতরণকৃত কমিশন (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {networkReports.weeklyGrowth.map((w, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3 px-3 font-bold text-neutral-800 dark:text-neutral-200">{w.week}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">+{w.newMembers} জন</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-600">{formatPV(w.totalPV)} PV</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-600">৳ {(w.commissionPaid ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="font-black text-sm text-neutral-900 dark:text-white">
              মাসিক সামারি ও গ্রোথ (Monthly Performance)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                    <th className="py-2.5 px-3">মাস (Month)</th>
                    <th className="py-2.5 px-3">নতুন মেম্বার</th>
                    <th className="py-2.5 px-3">মোট PV Volume</th>
                    <th className="py-2.5 px-3 text-right">মোট পে-আউট (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {networkReports.monthlyGrowth.map((m, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="py-3 px-3 font-bold text-neutral-800 dark:text-neutral-200">{m.month}</td>
                      <td className="py-3 px-3 text-emerald-600 font-bold">+{m.newMembers} জন</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-600">{formatPV(m.totalPV)} PV</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-600">৳ {(m.commissionPaid ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Commissions Breakdown */}
      {activeTab === 'commissions' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h4 className="font-black text-sm text-neutral-900 dark:text-white">
            কমিশন ক্যাটাগরি ব্রেকডাউন (Income Category Share)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {networkReports.commissionBreakdown.map((item, idx) => (
              <div key={idx} className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
                <span className="text-neutral-500 font-semibold text-xs block">{item.category}</span>
                <p className="text-xl font-black text-emerald-600 font-mono">৳ {(item.amount ?? 0).toLocaleString()}</p>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${item.percentage}%` }} />
                </div>
                <span className="text-[10px] text-neutral-400 block">{item.percentage}% মোট ইনকামের অংশ</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Performers Leaderboard */}
      {activeTab === 'performers' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-4">
          <h4 className="font-black text-sm text-neutral-900 dark:text-white">
            টিম মেম্বারস পারফরম্যান্স লিডারবোর্ড (Top Earners)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold">
                  <th className="py-2.5 px-3">অবস্থান</th>
                  <th className="py-2.5 px-3">লিডার নাম</th>
                  <th className="py-2.5 px-3">র‍্যাঙ্ক</th>
                  <th className="py-2.5 px-3">গ্রুপ ভলিউম (GV)</th>
                  <th className="py-2.5 px-3 text-right">মোট উপার্জন (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {networkReports.topPerformers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-3 px-3 font-bold font-mono text-amber-500">#{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-neutral-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-3 text-emerald-600 font-semibold">{p.rank}</td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-600">{formatPV(p.gv)} PV</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-600">৳ {(p.earnings ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
