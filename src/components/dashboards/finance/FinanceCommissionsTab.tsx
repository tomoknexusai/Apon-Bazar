import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Download,
  AlertCircle,
  Building,
  TrendingUp,
  Percent,
  Check,
  DollarSign,
  Users,
  Shield,
  Layers,
  ArrowRight,
  Calculator,
  UserCheck,
  Truck,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { FinanceCommissionRecord } from '../../../types';

interface FinanceCommissionsTabProps {
  language: 'bn' | 'en';
  commissions: FinanceCommissionRecord[];
  onDisburseCommission: (commissionId: string) => void;
}

export const FinanceCommissionsTab: React.FC<FinanceCommissionsTabProps> = ({
  language,
  commissions,
  onDisburseCommission
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCommission, setSelectedCommission] = useState<FinanceCommissionRecord | null>(null);

  // Live Commission Calculator Simulator
  const [simOrderAmount, setSimOrderAmount] = useState<number>(5000);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (item.commissionId || '').toLowerCase().includes(search) ||
        (item.beneficiaryId || '').toLowerCase().includes(search) ||
        (item.beneficiaryName || '').toLowerCase().includes(search) ||
        (item.orderId || '').toLowerCase().includes(search) ||
        (item.commissionType || '').toLowerCase().includes(search) ||
        (item.beneficiaryRole || '').toLowerCase().includes(search);

      const matchesType = typeFilter === 'all' || item.commissionType === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [commissions, searchTerm, typeFilter, statusFilter]);

  // Aggregate totals
  const totalCommissionAmount = useMemo(() => {
    return filteredCommissions.reduce((acc, item) => acc + item.commissionAmount, 0);
  }, [filteredCommissions]);

  const totalPaidCommission = useMemo(() => {
    return filteredCommissions
      .filter((item) => item.status === 'Paid')
      .reduce((acc, item) => acc + item.commissionAmount, 0);
  }, [filteredCommissions]);

  const totalPendingCommission = useMemo(() => {
    return filteredCommissions
      .filter((item) => item.status === 'Pending' || item.status === 'Payable' || item.status === 'Approved')
      .reduce((acc, item) => acc + item.commissionAmount, 0);
  }, [filteredCommissions]);

  const totalCompanyShare = useMemo(() => {
    return filteredCommissions
      .filter((item) => item.commissionType.includes('Company') || item.commissionType.includes('Admin'))
      .reduce((acc, item) => acc + item.commissionAmount, 0);
  }, [filteredCommissions]);

  const formatTk = (val: number) => `৳${(val || 0).toLocaleString('en-US')}`;

  const exportCSV = () => {
    const headers = [
      'Commission ID',
      'Beneficiary ID',
      'Beneficiary Name',
      'Beneficiary Role',
      'Order ID',
      'Commission Type',
      'Gross Amount (Tk)',
      'Commission Rate (%)',
      'Commission Amount (Tk)',
      'Status',
      'Approval Date',
      'Payment Date',
      'Approved By'
    ];

    const rows = filteredCommissions.map((c) => [
      c.commissionId,
      c.beneficiaryId,
      `"${c.beneficiaryName}"`,
      `"${c.beneficiaryRole}"`,
      c.orderId,
      `"${c.commissionType}"`,
      c.grossAmount,
      `${c.commissionRate}%`,
      c.commissionAmount,
      c.status,
      c.approvalDate || '',
      c.paymentDate || '',
      `"${c.approvedBy || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apon Bazar_Commissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Commission Simulator Tiers for ৳simOrderAmount
  const simSplits = useMemo(() => {
    const amt = simOrderAmount || 0;
    return [
      { type: 'Seller / Dealer Commission', rate: 5.0, amount: Math.round(amt * 0.05), role: 'সেলার / ডিলার' },
      { type: 'Operations Officer Commission', rate: 2.0, amount: Math.round(amt * 0.02), role: 'অপারেশনস অফিসার' },
      { type: 'Delivery Man Commission', rate: 3.5, amount: Math.round(amt * 0.035), role: 'ডেলিভারি রাইডার' },
      { type: 'Referral Commission', rate: 1.5, amount: Math.round(amt * 0.015), role: 'রেফারেল স্পন্সর' },
      { type: 'Network Commission', rate: 2.0, amount: Math.round(amt * 0.02), role: 'নেটওয়ার্ক ট্রি' },
      { type: 'Company / Admin Share', rate: 6.0, amount: Math.round(amt * 0.06), role: 'কোম্পানি ট্রেজারি' },
      { type: 'Other approved commissions', rate: 1.0, amount: Math.round(amt * 0.01), role: 'ক্যাম্পেইন বোনাস' }
    ];
  }, [simOrderAmount]);

  return (
    <div className="space-y-6">
      {/* Top Commission KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট অর্জিত কমিশন (Total)' : 'Total Calculated Commissions'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-white mt-1.5">{formatTk(totalCommissionAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredCommissions.length} {isBn ? 'টি কমিশন ডিস্ট্রিবিউশন' : 'commission records'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              {isBn ? 'পরিশোধিত কমিশন (Paid)' : 'Paid Commissions'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1.5">{formatTk(totalPaidCommission)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'ট্রেজারি হতে ওয়ালেটে স্থানান্তরিত' : 'Successfully disbursed'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">
              {isBn ? 'প্রদেয় / পেন্ডিং কমিশন' : 'Payable / Pending Queue'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1.5">{formatTk(totalPendingCommission)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'অনুমোদন ও বিতরণের অপেক্ষায়' : 'Awaiting payout release'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">
              {isBn ? 'কোম্পানি ও এডমিন শেয়ার' : 'Company Platform Share'}
            </span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-xl font-black text-purple-400 mt-1.5">{formatTk(totalCompanyShare)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'প্ল্যাটফর্ম প্রফিট ফান্ড' : 'Retained company revenue'}
          </p>
        </div>
      </div>

      {/* Interactive Multi-Tier Commission Simulator */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">
                {isBn ? 'স্বয়ংক্রিয় মাল্টি-টিয়ার কমিশন ক্যালকুলেটর ও স্প্লিট সিমুলেটর' : 'Automated Multi-Tier Commission Split Engine'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn
                  ? 'প্রতিটি অর্ডারে ৭টি স্তরে স্বয়ংক্রিয় কমিশন হিসাব ও বিতরণ প্রক্রিয়া'
                  : 'Real-time multi-stakeholder payout engine across 7 automated tiers'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{isBn ? 'অর্ডার মূল্য:' : 'Order Value:'}</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">৳</span>
              <input
                type="number"
                value={simOrderAmount}
                onChange={(e) => setSimOrderAmount(parseFloat(e.target.value) || 0)}
                className="w-28 pl-6 pr-2.5 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 7 Split Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {simSplits.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
              <div className="text-[10px] text-slate-400 truncate" title={item.type}>
                {item.role}
              </div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{formatTk(item.amount)}</div>
              <div className="text-[9px] text-cyan-400 font-mono">({item.rate}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'কমিশন আইডি, সুবিধাভোগী, অর্ডার বা রোল দিয়ে খুঁজুন...' : 'Search Commission ID, Beneficiary, Order ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল কমিশন টাইপ (৭টি টিয়ার)' : 'All Commission Types (7 Tiers)'}</option>
            <option value="Seller/Dealer Commission">{isBn ? 'Seller/Dealer Commission (সেলার/ডিলার)' : 'Seller/Dealer Commission'}</option>
            <option value="Operations Officer Commission">{isBn ? 'Operations Officer Commission (অপারেশনস অফিসার)' : 'Operations Officer Commission'}</option>
            <option value="Delivery Man Commission">{isBn ? 'Delivery Man Commission (ডেলিভারি ম্যান)' : 'Delivery Man Commission'}</option>
            <option value="Referral Commission">{isBn ? 'Referral Commission (রেফারেল)' : 'Referral Commission'}</option>
            <option value="Network Commission">{isBn ? 'Network Commission (নেটওয়ার্ক)' : 'Network Commission'}</option>
            <option value="Company/Admin Share">{isBn ? 'Company/Admin Share (কোম্পানি শেয়ার)' : 'Company/Admin Share'}</option>
            <option value="Other approved commissions">{isBn ? 'Other (অন্যান্য অনুমোদিত কমিশন)' : 'Other approved commissions'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
            <option value="Pending">Pending (পেন্ডিং)</option>
            <option value="Approved">Approved (অনুমোদিত)</option>
            <option value="Payable">Payable (প্রদেয়)</option>
            <option value="Paid">Paid (পরিশোধিত)</option>
            <option value="Hold">Hold (হোল্ড)</option>
            <option value="Cancelled">Cancelled (বাতিলকৃত)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'কমিশন এক্সপোর্ট' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Main Commissions Table - Showing all required fields */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">{isBn ? 'কমিশন আইডি' : 'Commission ID'}</th>
                <th className="py-3 px-3.5">{isBn ? 'সুবিধাভোগী আইডি ও নাম' : 'Beneficiary ID & Name'}</th>
                <th className="py-3 px-3.5">{isBn ? 'সুবিধাভোগী রোল' : 'Beneficiary Role'}</th>
                <th className="py-3 px-3.5">{isBn ? 'অর্ডার আইডি' : 'Order ID'}</th>
                <th className="py-3 px-3.5">{isBn ? 'কমিশন টাইপ' : 'Commission Type'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'গ্রস অর্ডার মূল্য' : 'Gross Amount'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'কমিশন হার (%)' : 'Rate (%)'}</th>
                <th className="py-3 px-3.5 text-right">{isBn ? 'কমিশন অর্থ' : 'Commission Amount'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3 px-3.5">{isBn ? 'অনুমোদন ও পরিশোধ তারিখ' : 'Approval & Payment Date'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    {isBn ? 'কোনো কমিশন রেকর্ড পাওয়া যায়নি' : 'No commission records found'}
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((c) => (
                  <tr key={c.commissionId} className="hover:bg-slate-800/40 transition-colors">
                    {/* 1. Commission ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-100 font-mono">{c.commissionId}</span>
                    </td>

                    {/* 2. Beneficiary ID & Name */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{c.beneficiaryName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.beneficiaryId}</div>
                    </td>

                    {/* 3. Beneficiary Role */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                        {c.beneficiaryRole}
                      </span>
                    </td>

                    {/* 4. Order ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-emerald-400 font-mono font-semibold">{c.orderId}</span>
                    </td>

                    {/* 5. Commission Type */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/30 text-emerald-300 border border-emerald-500/20">
                        {c.commissionType}
                      </span>
                    </td>

                    {/* 6. Gross Amount */}
                    <td className="py-3 px-3 text-right whitespace-nowrap text-slate-300 font-mono">
                      {formatTk(c.grossAmount)}
                    </td>

                    {/* 7. Commission Rate (%) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-cyan-400 font-bold">
                      {c.commissionRate}%
                    </td>

                    {/* 8. Commission Amount */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-emerald-400 font-mono text-sm">
                      {formatTk(c.commissionAmount)}
                    </td>

                    {/* 9. Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : c.status === 'Payable' || c.status === 'Approved'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : c.status === 'Hold'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                            : c.status === 'Cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* 10 & 11. Approval Date & Payment Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-slate-300">
                      <div>Appr: {c.approvalDate || '—'}</div>
                      <div className="text-[10px] text-slate-400">Paid: {c.paymentDate || 'Pending'}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {c.status !== 'Paid' && c.status !== 'Cancelled' ? (
                        <button
                          onClick={() => onDisburseCommission(c.commissionId)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all mx-auto"
                          title="কমিশন ওয়ালেটে বিতরণ করুন"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isBn ? 'বিতরণ' : 'Disburse'}</span>
                        </button>
                      ) : (
                        <span className="p-1 text-emerald-400 inline-block" title="পরিশোধ সম্পন্ন">
                          <CheckCircle2 className="w-4 h-4 mx-auto" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
