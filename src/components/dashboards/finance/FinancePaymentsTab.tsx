import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Building,
  Smartphone,
  Coins,
  ShieldCheck,
  Download,
  Filter,
  Check,
  FileText,
  Eye,
  DollarSign,
  Percent,
  Receipt,
  HelpCircle,
  Printer
} from 'lucide-react';
import { FinancePaymentRecord } from '../../../types';

interface FinancePaymentsTabProps {
  language: 'bn' | 'en';
  payments: FinancePaymentRecord[];
  onVerifyPayment: (paymentId: string) => void;
}

export const FinancePaymentsTab: React.FC<FinancePaymentsTabProps> = ({
  language,
  payments,
  onVerifyPayment
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeReceipt, setActiveReceipt] = useState<FinancePaymentRecord | null>(null);
  const [verifyModalPayment, setVerifyModalPayment] = useState<FinancePaymentRecord | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // 1.8% Gateway Fee Helper (for bKash and Nagad)
  const isMfsGateway = (method: string) => {
    const m = (method || '').toLowerCase();
    return m.includes('bkash') || m.includes('nagad');
  };

  const calculateGatewayFee = (payment: FinancePaymentRecord) => {
    if (payment.gatewayCharge !== undefined) return payment.gatewayCharge;
    if (payment.gatewayFeeAmount !== undefined) return payment.gatewayFeeAmount;
    if (isMfsGateway(payment.paymentMethod)) {
      return Math.round(payment.amount * 0.018); // 1.8%
    }
    return 0;
  };

  const calculateNetSettled = (payment: FinancePaymentRecord) => {
    if (payment.netSettledAmount !== undefined) return payment.netSettledAmount;
    const fee = calculateGatewayFee(payment);
    return payment.amount - fee;
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (p.paymentId || '').toLowerCase().includes(search) ||
        (p.orderId || '').toLowerCase().includes(search) ||
        (p.customerId || '').toLowerCase().includes(search) ||
        (p.transactionId || '').toLowerCase().includes(search) ||
        (p.paymentMethod || '').toLowerCase().includes(search) ||
        (p.receivedBy || '').toLowerCase().includes(search) ||
        (p.verifiedBy || '').toLowerCase().includes(search);

      const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
      const matchesStatus = statusFilter === 'all' || p.paymentStatus === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [payments, searchTerm, methodFilter, statusFilter]);

  const totalGrossAmount = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.amount, 0);
  }, [filteredPayments]);

  const totalGatewayCharges = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + calculateGatewayFee(p), 0);
  }, [filteredPayments]);

  const totalNetSettled = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + calculateNetSettled(p), 0);
  }, [filteredPayments]);

  const totalReceivedCount = useMemo(() => {
    return filteredPayments.filter((p) => p.paymentStatus === 'Received').length;
  }, [filteredPayments]);

  const formatTk = (val: number) => `৳${(val || 0).toLocaleString('en-US')}`;

  const handleConfirmVerify = () => {
    if (verifyModalPayment) {
      onVerifyPayment(verifyModalPayment.paymentId);
      setVerifyModalPayment(null);
      setVerificationNotes('');
    }
  };

  const exportCSV = () => {
    const headers = [
      'Payment ID',
      'Order ID',
      'Customer ID',
      'Gross Amount (Tk)',
      'Payment Method',
      'Gateway Charge 1.8% (Tk)',
      'Net Settled Amount (Tk)',
      'Transaction ID',
      'Payment Date',
      'Payment Status',
      'Received By',
      'Verified By',
      'Notes'
    ];

    const rows = filteredPayments.map((p) => {
      const fee = calculateGatewayFee(p);
      const net = calculateNetSettled(p);
      return [
        p.paymentId,
        p.orderId,
        p.customerId,
        p.amount,
        `"${p.paymentMethod}"`,
        fee,
        net,
        `"${p.transactionId}"`,
        p.paymentDate || p.dateTime || '',
        p.paymentStatus,
        `"${p.receivedBy || ''}"`,
        `"${p.verifiedBy || ''}"`,
        `"${p.notes || ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Apon Bazar_Payment_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Payments KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট পেমেন্ট ভলিউম (Gross)' : 'Total Gross Payment Volume'}
            </span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-white mt-1.5">{formatTk(totalGrossAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredPayments.length} {isBn ? 'টি লেনদেন রেকর্ড' : 'total transactions recorded'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">
              {isBn ? 'বিকাশ ও নগদ গেটওয়ে ফি (১.৮%)' : 'bKash / Nagad Charge (1.8%)'}
            </span>
            <Smartphone className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-xl font-black text-rose-400 mt-1.5">{formatTk(totalGatewayCharges)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'এমএফএস চার্জ পৃথকভাবে সংরক্ষিত' : 'MFS Merchant standard deductions'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              {isBn ? 'নিট সেটেল্ড পেমেন্ট (Net)' : 'Net Realized Payment'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1.5">{formatTk(totalNetSettled)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'চার্জ কর্তনের পর মূল ট্রেজারি একাউন্টে জমা' : 'After gateway deduction settlement'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'যাচাইকৃত পেমেন্ট সংখ্যা' : 'Verified Success Rate'}
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-cyan-400 mt-1.5">
            {filteredPayments.length > 0
              ? `${Math.round((totalReceivedCount / filteredPayments.length) * 100)}%`
              : '১০০%'}
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalReceivedCount} / {filteredPayments.length} {isBn ? 'পেমেন্ট রিসিভড' : 'received & verified'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'পেমেন্ট আইডি, TrxID, অর্ডার বা গ্রাহক দিয়ে খুঁজুন...' : 'Search Payment ID, TrxID, Order, Customer...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল পেমেন্ট মাধ্যম' : 'All Payment Methods'}</option>
            <option value="Cash on Delivery">{isBn ? 'Cash on Delivery (ক্যাশ অন ডেলিভারি)' : 'Cash on Delivery'}</option>
            <option value="bKash">{isBn ? 'bKash (বিকাশ মার্চেন্ট - ১.৮% চার্জ)' : 'bKash (1.8% Fee)'}</option>
            <option value="Nagad">{isBn ? 'Nagad (নগদ বাণিজ্যিক - ১.৮% চার্জ)' : 'Nagad (1.8% Fee)'}</option>
            <option value="Bank">{isBn ? 'Bank (ব্যাংক ট্রান্সফার / POS)' : 'Bank Transfer'}</option>
            <option value="Crypto">{isBn ? 'Crypto (ক্রিপ্টো / টোকেন)' : 'Crypto'}</option>
            <option value="Other approved payment methods">{isBn ? 'Other (অনুমোদিত অন্যান্য মাধ্যম)' : 'Other approved methods'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল পেমেন্ট স্ট্যাটাস' : 'All Payment Statuses'}</option>
            <option value="Pending">{isBn ? 'Pending (পেন্ডিং)' : 'Pending'}</option>
            <option value="Processing">{isBn ? 'Processing (প্রসেসিং)' : 'Processing'}</option>
            <option value="Received">{isBn ? 'Received (রিসিভড / সংগৃহীত)' : 'Received'}</option>
            <option value="Failed">{isBn ? 'Failed (ব্যর্থ)' : 'Failed'}</option>
            <option value="Refunded">{isBn ? 'Refunded (রিফান্ডেড)' : 'Refunded'}</option>
            <option value="Partially Refunded">{isBn ? 'Partially Refunded (আংশিক রিফান্ড)' : 'Partially Refunded'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'পেমেন্ট এক্সপোর্ট' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Main Payments Table - Displaying all required fields */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">{isBn ? 'পেমেন্ট আইডি' : 'Payment ID'}</th>
                <th className="py-3 px-3.5">{isBn ? 'অর্ডার ও গ্রাহক ID' : 'Order & Customer ID'}</th>
                <th className="py-3 px-3.5">{isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'মোট অর্থ (Amount)' : 'Gross Amount'}</th>
                <th className="py-3 px-3 text-right text-rose-400">{isBn ? 'গেটওয়ে চার্জ (১.৮%)' : 'Gateway Fee (1.8%)'}</th>
                <th className="py-3 px-3.5 text-right text-emerald-400">{isBn ? 'নিট সেটেল্ড' : 'Net Settled'}</th>
                <th className="py-3 px-3.5">{isBn ? 'ট্রানজ্যাকশন ID ও তারিখ' : 'Trx ID & Date'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}</th>
                <th className="py-3 px-3.5">{isBn ? 'রিসিভ ও ভেরিফাই তথ্য' : 'Received & Verified By'}</th>
                <th className="py-3 px-3.5 max-w-[140px]">{isBn ? 'নোটস' : 'Notes'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-500">
                    {isBn ? 'কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি' : 'No payment records found matching criteria'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const fee = calculateGatewayFee(payment);
                  const net = calculateNetSettled(payment);
                  const isMfs = isMfsGateway(payment.paymentMethod);

                  return (
                    <tr key={payment.paymentId} className="hover:bg-slate-800/40 transition-colors">
                      {/* 1. Payment ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-100 font-mono">{payment.paymentId}</div>
                      </td>

                      {/* 2 & 3. Order ID & Customer ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="text-emerald-400 font-mono font-semibold">{payment.orderId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Cust: {payment.customerId}</div>
                      </td>

                      {/* 5. Payment Method */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                            {payment.paymentMethod}
                          </span>
                          {isMfs && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-mono font-bold">
                              1.8%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-white font-mono">
                        {formatTk(payment.amount)}
                      </td>

                      {/* Separate 1.8% Payment Charge */}
                      <td className="py-3 px-3 text-right whitespace-nowrap text-rose-400 font-mono font-medium">
                        {fee > 0 ? `-${formatTk(fee)}` : <span className="text-slate-600">৳০</span>}
                      </td>

                      {/* Net Realized Settlement */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-emerald-400 font-mono">
                        {formatTk(net)}
                      </td>

                      {/* 6 & 7. Transaction ID & Payment Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono text-slate-200 text-[11px] font-semibold">{payment.transactionId}</div>
                        <div className="text-[10px] text-slate-400">{payment.paymentDate || payment.dateTime}</div>
                      </td>

                      {/* 8. Payment Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            payment.paymentStatus === 'Received' || payment.status === 'Captured'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : payment.paymentStatus === 'Processing'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : payment.paymentStatus === 'Refunded'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                              : payment.paymentStatus === 'Partially Refunded'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : payment.paymentStatus === 'Failed'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {payment.paymentStatus || payment.status}
                        </span>
                      </td>

                      {/* 9 & 10. Received By & Verified By */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px]">
                        <div className="text-slate-200">
                          <span className="text-slate-400">Ver: </span>
                          <span className="font-mono text-[10px]">{payment.verifiedBy || 'Pending'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          <span>Recv: </span>
                          <span className="font-mono">{payment.receivedBy || 'System Gateway'}</span>
                        </div>
                      </td>

                      {/* 11. Notes */}
                      <td className="py-3 px-3.5 max-w-[140px] truncate text-[11px] text-slate-400" title={payment.notes}>
                        {payment.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {payment.paymentStatus === 'Pending' || payment.paymentStatus === 'Processing' ? (
                            <button
                              onClick={() => {
                                setVerifyModalPayment(payment);
                                setVerificationNotes(payment.notes || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                              title="পেমেন্ট যাচাই ও নিশ্চিত করুন"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isBn ? 'ভেরিফাই' : 'Verify'}</span>
                            </button>
                          ) : (
                            <span className="p-1 text-emerald-400" title="যাচাই সম্পন্ন">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            onClick={() => setActiveReceipt(payment)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                            title="মানি রিসিট ও গেটওয়ে স্লিপ দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Payment Modal */}
      {verifyModalPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'পেমেন্ট ট্রানজ্যাকশন যাচাইকরণ' : 'Authorize & Verify Payment'}
                </h3>
              </div>
              <button
                onClick={() => setVerifyModalPayment(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment ID:</span>
                <span className="font-bold text-white font-mono">{verifyModalPayment.paymentId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-bold text-emerald-400 font-mono">{verifyModalPayment.orderId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Customer ID:</span>
                <span className="font-mono text-slate-200">{verifyModalPayment.customerId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-cyan-400">{verifyModalPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Transaction ID (TrxID):</span>
                <span className="font-mono text-amber-400 font-bold">{verifyModalPayment.transactionId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Gross Amount:</span>
                <span className="font-bold text-white font-mono">{formatTk(verifyModalPayment.amount)}</span>
              </div>

              {isMfsGateway(verifyModalPayment.paymentMethod) && (
                <div className="flex justify-between p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300">
                  <span>MFS Payment Charge (1.8%):</span>
                  <span className="font-mono font-bold">-{formatTk(calculateGatewayFee(verifyModalPayment))}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  {isBn ? 'অডিট নোটস ও মন্তব্য (ঐচ্ছিক):' : 'Audit & Verification Notes:'}
                </label>
                <textarea
                  rows={2}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={isBn ? 'ব্যাংক স্টেটমেন্ট বা গেটওয়ে রিকনসিলেশন রেফারেন্স...' : 'Bank statement or gateway settlement reference...'}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setVerifyModalPayment(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmVerify}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>{isBn ? 'ভেরিফাই ও রিসিভ নিশ্চিত করুন' : 'Confirm & Mark Received'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt / Gateway Slip Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'পেমেন্ট মানি রিসিট ও ট্রানজ্যাকশন স্লিপ' : 'Official Payment Receipt Slip'}
                </h3>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment ID:</span>
                <span className="font-bold text-white font-mono">{activeReceipt.paymentId}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-bold text-emerald-400 font-mono">{activeReceipt.orderId}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Customer ID:</span>
                <span className="font-mono text-slate-200">{activeReceipt.customerId}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold text-cyan-400">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono text-amber-400 font-bold">{activeReceipt.transactionId}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment Date:</span>
                <span className="text-slate-200">{activeReceipt.paymentDate || activeReceipt.dateTime}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Gross Amount:</span>
                <span className="font-bold text-white font-mono">{formatTk(activeReceipt.amount)}</span>
              </div>

              {isMfsGateway(activeReceipt.paymentMethod) && (
                <div className="flex justify-between p-2 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 font-mono">
                  <span>MFS Payment Charge (1.8%):</span>
                  <span>-{formatTk(calculateGatewayFee(activeReceipt))}</span>
                </div>
              )}

              <div className="flex justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 font-bold">
                <span>Net Settled Amount:</span>
                <span className="font-mono text-sm">{formatTk(calculateNetSettled(activeReceipt))}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-slate-400 block">Received By:</span>
                  <span className="font-mono text-slate-200">{activeReceipt.receivedBy || 'System Gateway'}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <span className="text-slate-400 block">Verified By:</span>
                  <span className="font-mono text-emerald-400">{activeReceipt.verifiedBy || 'Pending'}</span>
                </div>
              </div>

              {activeReceipt.notes && (
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px]">
                  <span className="text-slate-400 block mb-0.5">Notes / Reference:</span>
                  <p className="text-slate-200">{activeReceipt.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'রিসিট প্রিন্ট' : 'Print Slip'}</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
