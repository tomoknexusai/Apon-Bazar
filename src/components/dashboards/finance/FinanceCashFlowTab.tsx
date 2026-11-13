import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building,
  Printer,
  Scale
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

interface FinanceCashFlowTabProps {
  language: 'bn' | 'en';
  metrics: {
    totalSales: number;
    totalExpense: number;
    totalCommission: number;
    totalSettlement: number;
    refundAmount: number;
  };
}

export const FinanceCashFlowTab: React.FC<FinanceCashFlowTabProps> = ({
  language,
  metrics
}) => {
  const isBn = language === 'bn';

  // Opening Cash Balance
  const openingBalance = 4250000;

  // Operating Inflows
  const customerCollections = metrics.totalSales;
  const merchantFees = Math.round(metrics.totalSales * 0.035);
  const otherOperatingInflow = 120000;
  const totalInflows = customerCollections + merchantFees + otherOperatingInflow;

  // Operating Outflows
  const dealerSettlements = metrics.totalSettlement;
  const commissionsDisbursed = metrics.totalCommission;
  const operatingExpenses = metrics.totalExpense;
  const customerRefunds = metrics.refundAmount;
  const totalOutflows = dealerSettlements + commissionsDisbursed + operatingExpenses + customerRefunds;

  // Net Cash Flow & Closing
  const netCashFlow = totalInflows - totalOutflows;
  const closingBalance = openingBalance + netCashFlow;

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  const weeklyTrendData = [
    { week: isBn ? 'সপ্তাহ ১' : 'Week 1', inflow: 980000, outflow: 620000, net: 360000 },
    { week: isBn ? 'সপ্তাহ ২' : 'Week 2', inflow: 1140000, outflow: 710000, net: 430000 },
    { week: isBn ? 'সপ্তাহ ৩' : 'Week 3', inflow: 1250000, outflow: 840000, net: 410000 },
    { week: isBn ? 'সপ্তাহ ৪ (বর্তমান)' : 'Week 4', inflow: totalInflows - 3370000, outflow: totalOutflows - 2170000, net: netCashFlow - 1200000 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Cash Flow Formula Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Activity className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">
              {isBn ? 'ক্যাশ ফ্লো বিবরণী ও তারল্য বিশ্লেষণ' : 'Cash Flow Statement & Liquidity Dynamics'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-mono">
            Closing Cash Balance = Opening Cash + Cash Inflows − Cash Outflows
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>{isBn ? 'প্রিন্ট ক্যাশ ফ্লো' : 'Print Cash Flow'}</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400">
            {isBn ? 'প্রারম্ভিক ক্যাশ (Opening)' : 'Opening Cash Balance'}
          </span>
          <h4 className="text-xl font-black text-slate-200 mt-1 font-mono">{formatTk(openingBalance)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{isBn ? 'মাসের শুরুতে মোট ভল্ট ও ব্যাংক' : 'Beginning of period'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400">
            {isBn ? 'মোট ক্যাশ ইনফ্লো (Inflows)' : 'Total Cash Inflows'}
          </span>
          <h4 className="text-xl font-black text-emerald-400 mt-1 font-mono">+{formatTk(totalInflows)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{isBn ? 'বিক্রয় সংগ্রহ ও ফি' : 'Sales collection & fees'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400">
            {isBn ? 'মোট ক্যাশ আউটফ্লো (Outflows)' : 'Total Cash Outflows'}
          </span>
          <h4 className="text-xl font-black text-rose-400 mt-1 font-mono">-{formatTk(totalOutflows)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{isBn ? 'সেটেলমেন্ট, কমিশন ও খরচ' : 'Settlements, payout & expense'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-md">
          <span className="text-xs font-semibold text-emerald-400">
            {isBn ? 'সমাপনী ক্যাশ (Closing Cash)' : 'Closing Cash Balance'}
          </span>
          <h4 className="text-xl font-black text-emerald-300 mt-1 font-mono">{formatTk(closingBalance)}</h4>
          <p className="text-[11px] text-emerald-400/80 mt-0.5 font-semibold">{isBn ? 'নেট বৃদ্ধি: ' : 'Net change: '}+{formatTk(netCashFlow)}</p>
        </div>
      </div>

      {/* Cash Flow Statement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflows breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'ক্যাশ ইনফ্লো বিভাজন (Cash Inflows)' : 'Cash Inflows Breakdown'}</span>
            </h4>
            <span className="font-mono font-bold text-emerald-400">+{formatTk(totalInflows)}</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'কাস্টমার অর্ডার ও সিওডি পেমেন্ট কালেকশন' : 'Customer COD & Online Order Collections:'}</span>
              <span className="font-mono font-bold text-emerald-400">+{formatTk(customerCollections)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'মার্কেটপ্লেস ও সেলার প্ল্যাটফর্ম সার্ভিস ফি' : 'Marketplace & Seller Service Fee:'}</span>
              <span className="font-mono font-bold text-emerald-400">+{formatTk(merchantFees)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'অন্যান্য প্রাতিষ্ঠানিক পরিচালন ইনফ্লো' : 'Other Institutional Inflows:'}</span>
              <span className="font-mono font-bold text-emerald-400">+{formatTk(otherOperatingInflow)}</span>
            </div>
          </div>
        </div>

        {/* Outflows breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
              <span>{isBn ? 'ক্যাশ আউটফ্লো বিভাজন (Cash Outflows)' : 'Cash Outflows Breakdown'}</span>
            </h4>
            <span className="font-mono font-bold text-rose-400">-{formatTk(totalOutflows)}</span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'ডিলার ও সেলার সেলস সেটেলমেন্ট পেআউট' : 'Dealer & Seller Sales Settlements:'}</span>
              <span className="font-mono font-bold text-rose-400">-{formatTk(dealerSettlements)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'কমিশন ও ইনসেন্টিভ ডিজবার্সমেন্ট' : 'Commissions & Incentive Payouts:'}</span>
              <span className="font-mono font-bold text-rose-400">-{formatTk(commissionsDisbursed)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'প্রাতিষ্ঠানিক পরিচালন ব্যয় (১২টি খাত)' : 'Operating Expenses (12 Heads):'}</span>
              <span className="font-mono font-bold text-rose-400">-{formatTk(operatingExpenses)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/50">
              <span>{isBn ? 'গ্রাহক রিটার্ন ও রিফান্ড ডিসবার্সমেন্ট' : 'Customer Return & Refund Disbursements:'}</span>
              <span className="font-mono font-bold text-rose-400">-{formatTk(customerRefunds)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
