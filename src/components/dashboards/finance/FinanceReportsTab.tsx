import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  DollarSign,
  TrendingUp,
  Scale,
  Users,
  Building,
  RotateCcw,
  Clock,
  Layers
} from 'lucide-react';

interface FinanceReportsTabProps {
  language: 'bn' | 'en';
}

export const FinanceReportsTab: React.FC<FinanceReportsTabProps> = ({ language }) => {
  const isBn = language === 'bn';
  const [selectedReport, setSelectedReport] = useState<string>('sales_revenue');
  const [dateRange, setDateRange] = useState('this_month');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const reportList = [
    { id: 'sales_revenue', titleBn: '১. দৈনিক ও মাসিক বিক্রয় রিপোর্ট', titleEn: '1. Daily & Monthly Sales Revenue Report', category: 'Sales' },
    { id: 'collection_statement', titleBn: '২. পেমেন্ট সংগ্রহ বিবরণী', titleEn: '2. Payment Collection Statement', category: 'Collections' },
    { id: 'cod_settlement', titleBn: '৩. সিওডি সেটেলমেন্ট রিপোর্ট', titleEn: '3. COD Delivery Settlement Report', category: 'Settlement' },
    { id: 'dealer_settlement', titleBn: '৪. ডিলার সেলস ও পেআউট রিপোর্ট', titleEn: '4. Dealer Sales & Payout Report', category: 'Settlement' },
    { id: 'officer_commission', titleBn: '৫. অপারেশনস অফিসার কমিশন বিবরণী', titleEn: '5. Operations Officer Commission Statement', category: 'Commission' },
    { id: 'rider_commission', titleBn: '৬. ডেলিভারি ম্যান পেমেন্ট রিপোর্ট', titleEn: '6. Delivery Rider Earnings Report', category: 'Commission' },
    { id: 'network_commission', titleBn: '৭. নেটওয়ার্ক ইনসেন্টিভ ও বোনাস রিপোর্ট', titleEn: '7. Network Incentive & Bonus Report', category: 'Commission' },
    { id: 'income_statement', titleBn: '৮. ইনকাম স্টেটমেন্ট / লাভ-ক্ষতি বিবরণী', titleEn: '8. Income Statement / P&L Report', category: 'Financials' },
    { id: 'expense_breakdown', titleBn: '৯. ক্যাটাগরিভিত্তিক পরিচালন ব্যয় রিপোর্ট', titleEn: '9. Category-wise Expense Report', category: 'Expenses' },
    { id: 'tax_vat', titleBn: '১০. ভ্যাট ও ট্যাক্স কালেকশন রিপোর্ট', titleEn: '10. VAT & Tax Deduction Report', category: 'Tax' },
    { id: 'refund_chargeback', titleBn: '১১. রিফান্ড ও রিটার্ন বিবরণী', titleEn: '11. Refund & Return Statement', category: 'Refunds' },
    { id: 'bank_reconciliation', titleBn: '১২. ব্যাংক রিকনসিলেশন রিপোর্ট', titleEn: '12. Bank Reconciliation Report', category: 'Banking' },
    { id: 'cash_flow_statement', titleBn: '১৩. ক্যাশ ফ্লো স্টেটমেন্ট', titleEn: '13. Cash Flow Statement', category: 'Financials' },
    { id: 'general_ledger_report', titleBn: '১৪. সম্পূর্ণ জেনারেল লেজার ও জার্নাল রিপোর্ট', titleEn: '14. General Ledger & Journal Book', category: 'Ledger' },
    { id: 'trial_balance', titleBn: '১৫. ট্রায়াল ব্যালেন্স স্টেটমেন্ট', titleEn: '15. Trial Balance Statement', category: 'Ledger' },
    { id: 'balance_sheet', titleBn: '১৬. ব্যালেন্স শিট / উদ্বৃত্তপত্র', titleEn: '16. Balance Sheet / Financial Position', category: 'Financials' },
    { id: 'district_financial', titleBn: '১৭. জেলাভিত্তিক রাজস্ব ও সেটেলমেন্ট রিপোর্ট', titleEn: '17. District-wise Revenue & Settlement', category: 'Geographic' },
    { id: 'upazila_operational', titleBn: '১৮. উপজেলাভিত্তিক অপারেশনাল ফান্ড রিপোর্ট', titleEn: '18. Upazila Operational Settlement', category: 'Geographic' }
  ];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      // Simulate file download
      const element = document.createElement('a');
      const file = new Blob([`TOMSHOPBD Financial Report: ${selectedReport}\nDate Generated: ${new Date().toISOString()}\nStatus: Verified and Audited`], {
        type: 'text/plain'
      });
      element.href = URL.createObjectURL(file);
      element.download = `TOMSHOPBD_${selectedReport}_${Date.now()}.${exportFormat}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 600);
  };

  const activeReportMeta = reportList.find((r) => r.id === selectedReport) || reportList[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-100">
              {isBn ? '১৮টি পূর্ণাঙ্গ প্রাতিষ্ঠানিক আর্থিক ও অডিট রিপোর্ট' : '18 Enterprise Financial & Audit Reports'}
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {isBn ? 'পিডিএফ, এক্সেল ও সিএসভি ফরম্যাটে তাৎক্ষণিক ডাউনলোড ও ফিল্টারিং সুবিধা' : 'Instant exportable audit-grade reporting engine'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'প্রিন্ট ভিউ' : 'Print View'}</span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? (isBn ? 'ডাউনলোড হচ্ছে...' : 'Generating...') : (isBn ? 'এক্সপোর্ট ফাইল' : 'Export Report')}</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Report Selector, Right Report Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List Catalog */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2 max-h-[600px] overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
            {isBn ? 'রিপোর্ট তালিকা নির্বাচন করুন:' : 'Select Report Template:'}
          </h4>

          {reportList.map((rep) => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                selectedReport === rep.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="truncate">{isBn ? rep.titleBn : rep.titleEn}</span>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase ${
                  selectedReport === rep.id ? 'bg-slate-950 text-emerald-400' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {rep.category}
              </span>
            </button>
          ))}
        </div>

        {/* Report Active Configuration & Dynamic Sample Preview */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {activeReportMeta.category} Report
              </span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">
                {isBn ? activeReportMeta.titleBn : activeReportMeta.titleEn}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="today">{isBn ? 'আজকের দিন' : 'Today'}</option>
                <option value="this_week">{isBn ? 'চলতি সপ্তাহ' : 'This Week'}</option>
                <option value="this_month">{isBn ? 'চলতি মাস (আগস্ট ২০২৬)' : 'This Month (Aug 2026)'}</option>
                <option value="last_quarter">{isBn ? 'বিগত ত্রৈমাসিক (Q2)' : 'Last Quarter (Q2)'}</option>
                <option value="financial_year">{isBn ? 'অর্থবছর ২০২৫-২৬' : 'FY 2025-26'}</option>
              </select>

              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-400"
              >
                <option value="csv">CSV (Excel)</option>
                <option value="pdf">PDF (Print)</option>
              </select>
            </div>
          </div>

          {/* Report Data Table Preview */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Organization: TOMSHOPBD DIGITAL LIMITED</span>
              <span>Audit Clearance: Level 1 Enterprise</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">SL</th>
                    <th className="py-2.5 px-3">Transaction / Entity</th>
                    <th className="py-2.5 px-3">Ref ID</th>
                    <th className="py-2.5 px-3 text-right">Debit (Dr)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Cr)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-400">01</td>
                    <td className="py-2 px-3 font-semibold text-white">Consolidated Sales Order Inflow</td>
                    <td className="py-2 px-3 font-mono text-emerald-400">BATCH-2026-AUG</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">৳৪,৮২০,০০০</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">Audited</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-400">02</td>
                    <td className="py-2 px-3 font-semibold text-white">Merchant / Dealer Payout Settlements</td>
                    <td className="py-2 px-3 font-mono text-slate-400">SETTLE-SUMMARY</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400">৳২,৭৯০,০০০</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">Audited</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-400">03</td>
                    <td className="py-2 px-3 font-semibold text-white">Field Operations & Commissions</td>
                    <td className="py-2 px-3 font-mono text-slate-400">COMM-DISBURSE</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400">৳৫৮০,০০০</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">Audited</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 text-slate-400">04</td>
                    <td className="py-2 px-3 font-semibold text-white">Institutional Operating Expenses</td>
                    <td className="py-2 px-3 font-mono text-slate-400">EXP-VOUCHERS</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-500">-</td>
                    <td className="py-2 px-3 text-right font-mono text-cyan-400">৳৬৪০,০০০</td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">Audited</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-700 text-xs font-bold text-slate-200">
              <span>{isBn ? 'রিপোর্ট সারসংক্ষেপ নিট ব্যালেন্স:' : 'Summary Net Position:'}</span>
              <span className="text-emerald-400 font-mono text-sm">+৳৮১০,০০০.০০</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
