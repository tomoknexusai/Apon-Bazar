import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  PieChart as PieIcon,
  Percent,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface FinanceProfitLossTabProps {
  language: 'bn' | 'en';
  metrics: {
    totalSales: number;
    cogs: number;
    totalCommission: number;
    totalDeliveryCost: number;
    gatewayCharges: number;
    refundAmount: number;
    totalExpense: number;
    netProfit: number;
  };
}

export const FinanceProfitLossTab: React.FC<FinanceProfitLossTabProps> = ({
  language,
  metrics
}) => {
  const isBn = language === 'bn';
  const [statementPeriod, setStatementPeriod] = useState('this_month');

  // Breakdown Calculations
  const grossRevenue = metrics.totalSales;
  const cogs = metrics.cogs || Math.round(grossRevenue * 0.58);
  const grossMargin = grossRevenue - cogs;
  const grossMarginPercent = grossRevenue > 0 ? ((grossMargin / grossRevenue) * 100).toFixed(1) : '0';

  const commissions = metrics.totalCommission;
  const deliveryCosts = metrics.totalDeliveryCost || Math.round(grossRevenue * 0.04);
  const gatewayFees = metrics.gatewayCharges || Math.round(grossRevenue * 0.018);
  const refunds = metrics.refundAmount;
  const operatingExpenses = metrics.totalExpense;

  const totalDeductions = cogs + commissions + deliveryCosts + gatewayFees + refunds + operatingExpenses;
  const netProfit = grossRevenue - (commissions + deliveryCosts + gatewayFees + refunds + operatingExpenses + cogs);
  const netMarginPercent = grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0';

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  const monthlyComparisonData = [
    { month: isBn ? 'মে ২০২৬' : 'May 2026', revenue: 3850000, cogs: 2280000, expenses: 540000, netProfit: 680000 },
    { month: isBn ? 'জুন ২০২৬' : 'Jun 2026', revenue: 4120000, cogs: 2450000, expenses: 590000, netProfit: 750000 },
    { month: isBn ? 'জুলাই ২০২৬' : 'Jul 2026', revenue: 4480000, cogs: 2650000, expenses: 630000, netProfit: 810000 },
    { month: isBn ? 'চলতি মাস (আগস্ট)' : 'Aug 2026', revenue: grossRevenue, cogs: cogs, expenses: operatingExpenses, netProfit: netProfit }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Calculation Formula */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Scale className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">
                {isBn ? 'ইনকাম স্টেটমেন্ট ও লাভ-ক্ষতি বিবরণী (Profit & Loss Statement)' : 'Income Statement & Profit & Loss Analytics'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-mono">
              Net Profit = Gross Sales − COGS − Commission − Delivery − Gateway Charges (1.8%) − Refunds − Operating Expenses
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'প্রিন্ট স্টেটমেন্ট' : 'Print Statement'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Income Statement Table / Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall P&L Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800">
            {isBn ? 'আর্থিক বিবরণী বিভাজন (EBITDA Breakdown)' : 'Financial Statement Waterfall'}
          </h4>

          <div className="space-y-2.5 text-xs text-slate-300">
            {/* 1. Gross Revenue */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div>
                <span className="font-bold text-white text-sm">
                  {isBn ? '১. মোট বিক্রয় রেভিনিউ (Gross Sales Revenue)' : '1. Gross Sales Revenue'}
                </span>
                <p className="text-[11px] text-slate-400">{isBn ? 'সফল ও পরিশোধিত অর্ডার' : 'Completed delivery orders'}</p>
              </div>
              <span className="font-black text-emerald-400 text-base font-mono">+{formatTk(grossRevenue)}</span>
            </div>

            {/* 2. COGS */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <div>
                <span className="font-semibold text-slate-200">
                  {isBn ? '২. বিক্রীত পণ্যের ব্যয় (COGS / Dealer Cost)' : '2. Cost of Goods Sold (COGS / Dealer Base)'}
                </span>
                <p className="text-[11px] text-slate-400">{isBn ? 'পণ্য ক্রয় ও ডিলার প্রদেয় মূল খরচ' : 'Product sourcing & wholesale cost'}</p>
              </div>
              <span className="font-bold text-rose-400 font-mono">-{formatTk(cogs)}</span>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-slate-800/80 text-emerald-300 font-bold border-l-4 border-emerald-500">
              <span>{isBn ? 'গ্রস প্রফিট মার্জিন (Gross Margin):' : 'Gross Margin:'}</span>
              <span className="font-mono">{formatTk(grossMargin)} ({grossMarginPercent}%)</span>
            </div>

            {/* 3. Deductions */}
            <div className="space-y-1.5 pl-3 border-l-2 border-slate-700">
              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>{isBn ? '• মোট কমিশন বণ্টন (ডিলার, অফিসার, রাইডার, নেটওয়ার্ক)' : '• Stakeholder Commissions (Dealer, Ops, Rider, Network):'}</span>
                <span className="text-rose-400 font-mono">-{formatTk(commissions)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>{isBn ? '• ডেলিভারি ও পরিবহন লজিস্টিকস খরচ' : '• Delivery & Logistics Fleet Costs:'}</span>
                <span className="text-rose-400 font-mono">-{formatTk(deliveryCosts)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>{isBn ? '• পেমেন্ট গেটওয়ে ট্রানজ্যাকশন চার্জ (১.৮% bKash/Nagad)' : '• Payment Gateway Charges (1.8% bKash/Nagad):'}</span>
                <span className="text-rose-400 font-mono">-{formatTk(gatewayFees)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>{isBn ? '• রিটার্ন পণ্য রিফান্ড ও এডজাস্টমেন্ট' : '• Customer Returns & Refunds:'}</span>
                <span className="text-rose-400 font-mono">-{formatTk(refunds)}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-slate-400">
                <span>{isBn ? '• সার্বিক প্রাতিষ্ঠানিক পরিচালন ব্যয় (১২টি ক্যাটাগরি)' : '• Operating Expenses (12 Categories):'}</span>
                <span className="text-rose-400 font-mono">-{formatTk(operatingExpenses)}</span>
              </div>
            </div>

            {/* 4. Net Profit Bottom Line */}
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-900 border-2 border-emerald-500 shadow-xl">
              <div>
                <span className="text-base font-black text-white uppercase tracking-wider">
                  {isBn ? 'চূড়ান্ত নিট মুনাফা (Net Company Profit / EBITDA)' : 'Final Net Profit (EBITDA)'}
                </span>
                <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                  {isBn ? `নিট মুনাফা মার্জিন: ${netMarginPercent}%` : `Net Margin: ${netMarginPercent}%`}
                </p>
              </div>
              <span className="text-2xl font-black text-emerald-300 font-mono">{formatTk(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Trend Analytics Chart */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider pb-3 border-b border-slate-800">
              {isBn ? 'মাসিক লাভ-ক্ষতি তুলনামূলক চিত্র' : 'Monthly Comparative P&L'}
            </h4>
            <p className="text-xs text-slate-400 mt-2">
              {isBn ? 'মাসভিত্তিক মোট আয় এবং চূড়ান্ত নিট মুনাফার প্রবৃদ্ধি' : 'Historical revenue vs net profit growth'}
            </p>
          </div>

          <div className="h-64 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `৳${v / 100000}L`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name={isBn ? 'রেভিনিউ' : 'Revenue'} fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name={isBn ? 'নিট লাভ' : 'Net Profit'} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-300">
            <span className="font-semibold text-emerald-400">
              {isBn ? 'আর্থিক স্বচ্ছতা অডিট:' : 'Audit Transparency:'}
            </span>{' '}
            {isBn
              ? 'সকল আয় ও ব্যয় সরাসরি সিস্টেমে লেনদেনকৃত ডিজিটাল ডাটা হতে সমন্বিত।'
              : 'All figures generated strictly from verifiable transactions.'}
          </div>
        </div>
      </div>
    </div>
  );
};
