import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Receipt,
  Wallet,
  Building2,
  Scale,
  RefreshCw,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface FinanceOverviewTabProps {
  language: 'bn' | 'en';
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  metrics: {
    todaySales: number;
    todayCollection: number;
    todayExpense: number;
    todayProfit: number;
    totalSales: number;
    totalCollection: number;
    totalExpense: number;
    totalCommission: number;
    pendingSettlement: number;
    paidSettlement: number;
    refundAmount: number;
    netProfit: number;
  };
  onNavigateTab: (tab: any) => void;
}

export const FinanceOverviewTab: React.FC<FinanceOverviewTabProps> = ({
  language,
  dateFilter,
  setDateFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  metrics,
  onNavigateTab
}) => {
  const isBn = language === 'bn';

  const chartData = [
    { name: isBn ? 'শনিবার' : 'Sat', sales: 42000, collections: 38500, expenses: 6200, profit: 8900 },
    { name: isBn ? 'রবিবার' : 'Sun', sales: 55000, collections: 49000, expenses: 7800, profit: 12400 },
    { name: isBn ? 'সোমবার' : 'Mon', sales: 68000, collections: 63000, expenses: 8400, profit: 15600 },
    { name: isBn ? 'মঙ্গলবার' : 'Tue', sales: 61000, collections: 58000, expenses: 7100, profit: 14200 },
    { name: isBn ? 'বুধবার' : 'Wed', sales: 74000, collections: 69500, expenses: 9500, profit: 18200 },
    { name: isBn ? 'বৃহস্পতিবার' : 'Thu', sales: 89000, collections: 81000, expenses: 11200, profit: 22500 },
    { name: isBn ? 'শুক্রবার' : 'Fri', sales: 98000, collections: 92300, expenses: 14800, profit: 24800 }
  ];

  const formatTk = (amount: number) => {
    return `৳${amount.toLocaleString('en-US')}`;
  };

  const filterButtons = [
    { id: 'today', label: isBn ? 'আজ' : 'Today' },
    { id: 'yesterday', label: isBn ? 'গতকাল' : 'Yesterday' },
    { id: 'last_7_days', label: isBn ? 'গত ৭ দিন' : 'Last 7 Days' },
    { id: 'this_month', label: isBn ? 'চলতি মাস' : 'This Month' },
    { id: 'last_month', label: isBn ? 'গত মাস' : 'Last Month' },
    { id: 'this_year', label: isBn ? 'চলতি বছর' : 'This Year' },
    { id: 'custom', label: isBn ? 'কাস্টম রেঞ্জ' : 'Custom Range' }
  ];

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-slate-200">
            {isBn ? 'আর্থিক সময়সীমা ফিল্টার:' : 'Financial Period Filter:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setDateFilter(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                dateFilter === btn.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto border-t sm:border-t-0 border-slate-800">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-400">{isBn ? 'থেকে' : 'to'}</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 12 Key Summary KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'আজকের বিক্রয় (Today Sales)' : "Today's Sales"}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <CircleDollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.todaySales)}</h3>
            <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+14.2% {isBn ? 'গতকালের চেয়ে' : 'vs yesterday'}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Today's Collection */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'আজকের কালেকশন (Today Collection)' : "Today's Collection"}
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.todayCollection)}</h3>
            <p className="mt-1 text-xs text-cyan-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isBn ? '৮৮% ক্যাশ/বিকাশ প্রাপ্ত' : '88% COD/Digital Collected'}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Today's Expense */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'আজকের মোট খরচ (Today Expense)' : "Today's Expense"}
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.todayExpense)}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {isBn ? 'হাব অপারেশন ও ডেলিভারি বিল' : 'Hub ops & logistics cost'}
            </p>
          </div>
        </div>

        {/* Card 4: Today's Profit */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'আজকের নিট লাভ (Today Profit)' : "Today's Profit"}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-300">{formatTk(metrics.todayProfit)}</h3>
            <p className="mt-1 text-xs text-amber-400 flex items-center gap-1 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'মার্জিন: ২০.৭%' : 'Margin: 20.7%'}</span>
            </p>
          </div>
        </div>

        {/* Card 5: Total Sales */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'সর্বমোট বিক্রয় (Total Sales)' : 'Total Sales'}
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.totalSales)}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {isBn ? 'সফল ডেলিভারি ও প্রদেয় অর্ডার' : 'Completed & paid orders'}
            </p>
          </div>
        </div>

        {/* Card 6: Total Collection */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'সর্বমোট কালেকশন (Total Collection)' : 'Total Collection'}
            </span>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.totalCollection)}</h3>
            <p className="mt-1 text-xs text-teal-400">
              {isBn ? 'মার্চেন্ট ও ক্যাশ ভল্টে জমা' : 'Secured in Treasury Vaults'}
            </p>
          </div>
        </div>

        {/* Card 7: Total Expense */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-red-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'সর্বমোট ব্যয় (Total Expense)' : 'Total Expense'}
            </span>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.totalExpense)}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {isBn ? 'অপারেশনাল ও লজিস্টিকস বিল' : 'Operating & gateway fee'}
            </p>
          </div>
        </div>

        {/* Card 8: Total Commission */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'মোট কমিশন বণ্টন (Total Commission)' : 'Total Commission'}
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.totalCommission)}</h3>
            <p className="mt-1 text-xs text-purple-400">
              {isBn ? 'ডিলার, অফিসার ও রাইডার কমিশন' : 'Dealer, Ops & Rider Share'}
            </p>
          </div>
        </div>

        {/* Card 9: Pending Settlement */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'পেন্ডিং সেটেলমেন্ট (Pending Settlement)' : 'Pending Settlement'}
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-300">{formatTk(metrics.pendingSettlement)}</h3>
            <button
              onClick={() => onNavigateTab('settlements')}
              className="mt-1 text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{isBn ? 'সেটেলমেন্ট অনুমোদন করুন' : 'Review & Disburse'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card 10: Paid Settlement */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'পরিশোধিত সেটেলমেন্ট (Paid Settlement)' : 'Paid Settlement'}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-300">{formatTk(metrics.paidSettlement)}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {isBn ? 'ব্যাংক ও বিকাশে সফল ট্রান্সফার' : 'Disbursed to Beneficiaries'}
            </p>
          </div>
        </div>

        {/* Card 11: Refund Amount */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-orange-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isBn ? 'মোট রিফান্ড (Refund Amount)' : 'Refund Amount'}
            </span>
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white">{formatTk(metrics.refundAmount)}</h3>
            <p className="mt-1 text-xs text-orange-400">
              {isBn ? 'রিটার্ন পণ্যের অর্থ ফেরত' : 'Customer Return Reversals'}
            </p>
          </div>
        </div>

        {/* Card 12: Net Profit */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/40 shadow-xl shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isBn ? 'নিট মুনাফা (Net Company Profit)' : 'Net Profit (EBITDA)'}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-300">{formatTk(metrics.netProfit)}</h3>
            <p className="mt-1 text-xs text-emerald-400/90 font-medium">
              {isBn ? 'রেভিনিউ − COGS − কমিশন − ব্যয়' : 'Revenue − COGS − Comm − Exp'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Collections Inflow Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>{isBn ? 'দৈনিক বিক্রয় ও ক্যাশ কালেকশন ট্রেন্ড' : 'Daily Sales & Cash Collection Inflow'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isBn ? 'গত ৭ দিনের লাইভ বিক্রয় বনাম ব্যাংক/ক্যাশ কালেকশন' : 'Last 7 days sales vs real-time collections'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                {isBn ? 'বিক্রয়' : 'Sales'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span>
                {isBn ? 'কালেকশন' : 'Collections'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="sales" name={isBn ? 'মোট বিক্রয়' : 'Sales'} stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collections" name={isBn ? 'আদায়কৃত ক্যাশ' : 'Collections'} stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#collectGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Expense vs Profit Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-amber-400" />
              <span>{isBn ? 'খরচ বনাম মুনাফা বিশ্লেষণ' : 'Expense vs Profit Breakdown'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isBn ? 'দৈনিক ব্যয় এবং নিট আয়ের ভারসাম্য' : 'Operating balance and margin analytics'}
            </p>
          </div>

          <div className="h-56 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="expenses" name={isBn ? 'ব্যয় (Expense)' : 'Expense'} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name={isBn ? 'মুনাফা (Profit)' : 'Profit'} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">{isBn ? 'গড় নিট প্রফিট মার্জিন:' : 'Avg Net Profit Margin:'}</span>
            <span className="font-bold text-emerald-400">২১.৪%</span>
          </div>
        </div>
      </div>

      {/* Quick Action & Critical Alerts Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              {isBn ? 'পেন্ডিং অ্যাকশন কিউ (Pending Action Queue)' : 'Pending Operational Actions'}
            </h4>
            <p className="text-xs text-slate-400">
              {isBn ? '৪টি ডেলিভারি সেটেলমেন্ট এবং ২টি খরচের ভাউচার অনুমোদনের অপেক্ষায় রয়েছে' : '4 Delivery settlements and 2 expense vouchers waiting for Maker-Checker review'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('settlements')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{isBn ? 'সেটেলমেন্ট কিউ' : 'Settlement Queue'}</span>
          </button>
          <button
            onClick={() => onNavigateTab('ledger')}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>{isBn ? 'জেনারেল লেজার দেখুন' : 'View General Ledger'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
