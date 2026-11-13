/**
 * Daily Sales & Registration Trends Recharts Widget
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Store, Calendar, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// 10-Day Historical Trend Analytics Data
const dailyTrendData = [
  { date: '০৪ আগস্ট', sales: 48500, registrations: 14, dealers: 2, orders: 42 },
  { date: '০৫ আগস্ট', sales: 52000, registrations: 19, dealers: 3, orders: 48 },
  { date: '০৬ আগস্ট', sales: 61500, registrations: 22, dealers: 3, orders: 55 },
  { date: '০৭ আগস্ট', sales: 58200, registrations: 18, dealers: 2, orders: 50 },
  { date: '০৮ আগস্ট', sales: 74000, registrations: 28, dealers: 4, orders: 62 },
  { date: '০৯ আগস্ট', sales: 82500, registrations: 31, dealers: 5, orders: 71 },
  { date: '১০ আগস্ট', sales: 79000, registrations: 27, dealers: 3, orders: 68 },
  { date: '১১ আগস্ট', sales: 94800, registrations: 38, dealers: 6, orders: 84 },
  { date: '১২ আগস্ট', sales: 108500, registrations: 44, dealers: 8, orders: 95 },
  { date: '১৩ আগস্ট', sales: 124000, registrations: 52, dealers: 10, orders: 112 },
];

export const DailyTrendsWidget: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [activeMetric, setActiveMetric] = useState<'all' | 'sales' | 'registrations'>('all');

  const totalSales = dailyTrendData.reduce((acc, curr) => acc + curr.sales, 0);
  const totalRegistrations = dailyTrendData.reduce((acc, curr) => acc + curr.registrations, 0);
  const totalDealers = dailyTrendData.reduce((acc, curr) => acc + curr.dealers, 0);
  const totalOrders = dailyTrendData.reduce((acc, curr) => acc + curr.orders, 0);

  return (
    <div className="bg-white border border-[#C8E6C9] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 text-neutral-800">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8F5E9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#157347]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                {isBn ? 'দৈনিক বিক্রি ও ইউজার নিবন্ধন এনালিটিক্স' : 'Daily Sales & Registration Analytics'}
              </h3>
              <p className="text-xs text-neutral-600">
                {isBn ? 'গত ১০ দিনের রিয়েল-টাইম রেভিনিউ, মার্চেন্ট ডিলার সাইন-আপ ও মেম্বারশিপ গ্রাফ' : 'Real-time revenue, dealer sign-ups & membership trends over 10 days'}
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-[#F4FBF5] border border-[#C8E6C9] p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeMetric === 'all'
                ? 'bg-[#198754] text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-[#157347]'
            }`}
          >
            {isBn ? 'কম্বাইন্ড ভিউ' : 'Combined'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('sales')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeMetric === 'sales'
                ? 'bg-[#198754] text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-[#157347]'
            }`}
          >
            {isBn ? 'ডেইলি সেলস (BDT)' : 'Daily Sales'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('registrations')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeMetric === 'registrations'
                ? 'bg-[#198754] text-white shadow-xs font-bold'
                : 'text-neutral-600 hover:text-[#157347]'
            }`}
          >
            {isBn ? 'নতুন ইউজার ও ডিলার' : 'Registrations'}
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#F4FBF5] border border-[#C8E6C9] p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-[#157347] font-bold block flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5 text-[#198754]" />
            {isBn ? 'মোট বিক্রি (১০ দিন)' : 'Total Sales (10 Days)'}
          </span>
          <div className="flex items-baseline justify-between">
            <p className="text-lg sm:text-xl font-black text-[#157347] font-mono">
              ৳ {(totalSales ?? 0).toLocaleString('bn-BD')}
            </p>
            <span className="text-[10px] text-[#198754] font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +১৮.৪%
            </span>
          </div>
        </div>

        <div className="bg-[#F4FBF5] border border-[#C8E6C9] p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-[#157347] font-bold block flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#198754]" />
            {isBn ? 'নতুন ইউজার সাইন-আপ' : 'New Registrations'}
          </span>
          <div className="flex items-baseline justify-between">
            <p className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
              {totalRegistrations ?? 0} জন
            </p>
            <span className="text-[10px] text-[#198754] font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> +২২%
            </span>
          </div>
        </div>

        <div className="bg-[#F4FBF5] border border-[#C8E6C9] p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-[#157347] font-bold block flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-amber-600" />
            {isBn ? 'নতুন নিবন্ধিত ডিলার' : 'New Dealers Joined'}
          </span>
          <p className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
            {totalDealers ?? 0} আউটলেট
          </p>
        </div>

        <div className="bg-[#F4FBF5] border border-[#C8E6C9] p-3.5 rounded-2xl space-y-1">
          <span className="text-[11px] text-neutral-600 font-bold block flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            {isBn ? 'মোট সম্পন্ন অর্ডার' : 'Completed Orders'}
          </span>
          <p className="text-lg sm:text-xl font-black text-neutral-900 font-mono">
            {totalOrders ?? 0} টি
          </p>
        </div>
      </div>

      {/* Recharts Chart Visualization Container */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'sales' ? (
            <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `৳${val / 1000}k`} />
              <Tooltip
                formatter={(value: any) => [`৳ ${Number(value ?? 0).toLocaleString('bn-BD')}`, 'বিক্রি পরিমাণ (BDT)']}
                contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="sales" name="বিক্রি (BDT)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
            </AreaChart>
          ) : activeMetric === 'registrations' ? (
            <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="registrations" name="সাধারণ ইউজার নিবন্ধন" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="dealers" name="ডিলার ও আউটলেট সাইন-আপ" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradCombo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="regGradCombo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(val) => `৳${val / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: any, name: any) => [
                  name === 'sales' ? `৳ ${Number(value ?? 0).toLocaleString('bn-BD')}` : value,
                  name === 'sales' ? 'বিক্রি (BDT)' : name === 'registrations' ? 'ইউজার নিবন্ধন' : 'ডিলার সাইন-আপ'
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area yAxisId="left" type="monotone" dataKey="sales" name="sales" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGradCombo)" />
              <Area yAxisId="right" type="monotone" dataKey="registrations" name="registrations" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#regGradCombo)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

    </div>
  );
};
