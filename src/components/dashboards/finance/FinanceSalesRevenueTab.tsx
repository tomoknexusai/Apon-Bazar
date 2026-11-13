import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  ShoppingBag,
  DollarSign,
  Truck,
  ShieldCheck,
  AlertCircle,
  Tag,
  Gift,
  Coins,
  Receipt
} from 'lucide-react';
import { FinanceSaleRecord } from '../../../types';

interface FinanceSalesRevenueTabProps {
  language: 'bn' | 'en';
  sales: FinanceSaleRecord[];
}

export const FinanceSalesRevenueTab: React.FC<FinanceSalesRevenueTabProps> = ({
  language,
  sales
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceSaleRecord | null>(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      // Search across all identifying attributes
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        (item.orderId || '').toLowerCase().includes(search) ||
        (item.customerId || '').toLowerCase().includes(search) ||
        (item.customerName || '').toLowerCase().includes(search) ||
        (item.sellerOrDealerId || '').toLowerCase().includes(search) ||
        (item.product || '').toLowerCase().includes(search) ||
        (item.paymentMethod || '').toLowerCase().includes(search);

      // Order Status Filter
      const matchesStatus =
        statusFilter === 'all' || item.orderStatus === statusFilter;

      // Payment Status Filter
      const matchesPaymentStatus =
        paymentStatusFilter === 'all' || item.paymentStatus === paymentStatusFilter;

      // Payment Method Filter
      const matchesMethod =
        methodFilter === 'all' || item.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesMethod;
    });
  }, [sales, searchTerm, statusFilter, paymentStatusFilter, methodFilter]);

  // STRICT REVENUE CALCULATION RULE:
  // "Revenue must be calculated from actual completed/paid orders. Do not count cancelled or failed orders as completed revenue."
  const isCompletedOrPaid = (sale: FinanceSaleRecord) => {
    // Exclude cancelled or failed orders strictly
    if (sale.orderStatus === 'cancelled' || sale.orderStatus === 'failed') return false;
    if (sale.paymentStatus === 'Failed' || sale.paymentStatus === 'Refunded') return false;
    // Count only actual delivered or received/paid orders
    return (
      sale.orderStatus === 'delivered' ||
      sale.paymentStatus === 'Received' ||
      sale.paymentStatus === 'Paid' ||
      sale.paymentStatus === 'Collected'
    );
  };

  const completedPaidSales = useMemo(() => {
    return filteredSales.filter(isCompletedOrPaid);
  }, [filteredSales]);

  const unrealizedCancelledFailedSales = useMemo(() => {
    return filteredSales.filter(
      (s) =>
        s.orderStatus === 'cancelled' ||
        s.orderStatus === 'failed' ||
        s.paymentStatus === 'Failed' ||
        s.paymentStatus === 'Refunded'
    );
  }, [filteredSales]);

  // Financial aggregates calculated exclusively on realized/completed orders
  const totalCompletedRevenue = useMemo(() => {
    return completedPaidSales.reduce((acc, s) => acc + (s.finalSaleAmount || 0), 0);
  }, [completedPaidSales]);

  const totalGrossOrderVolume = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + (s.finalSaleAmount || 0), 0);
  }, [filteredSales]);

  const totalDeliveryCostCollected = useMemo(() => {
    return completedPaidSales.reduce((acc, s) => acc + (s.deliveryCost || 0), 0);
  }, [completedPaidSales]);

  const totalTaxCollected = useMemo(() => {
    return completedPaidSales.reduce((acc, s) => acc + (s.tax || 0), 0);
  }, [completedPaidSales]);

  const totalCashbackGiven = useMemo(() => {
    return completedPaidSales.reduce((acc, s) => acc + (s.cashback || 0), 0);
  }, [completedPaidSales]);

  const totalDiscountGiven = useMemo(() => {
    return completedPaidSales.reduce((acc, s) => acc + (s.discount || 0), 0);
  }, [completedPaidSales]);

  const totalExcludedRevenue = useMemo(() => {
    return unrealizedCancelledFailedSales.reduce((acc, s) => acc + (s.finalSaleAmount || 0), 0);
  }, [unrealizedCancelledFailedSales]);

  const formatTk = (amount: number) => `৳${(amount || 0).toLocaleString('en-US')}`;

  const exportCSV = () => {
    const headers = [
      'Order ID',
      'Order Date',
      'Customer ID',
      'Customer Name',
      'Seller/Dealer ID',
      'Product',
      'Quantity',
      'MRP (Tk)',
      'Discount (Tk)',
      'Final Sale Amount (Tk)',
      'Delivery Cost (Tk)',
      'Tax (Tk)',
      'Cashback (Tk)',
      'Payment Method',
      'Payment Status',
      'Order Status'
    ];

    const rows = filteredSales.map((s) => [
      s.orderId,
      s.orderDate || s.date || '',
      s.customerId,
      `"${s.customerName}"`,
      s.sellerOrDealerId,
      `"${s.product}"`,
      s.quantity,
      s.mrp,
      s.discount,
      s.finalSaleAmount,
      s.deliveryCost,
      s.tax,
      s.cashback,
      `"${s.paymentMethod}"`,
      s.paymentStatus,
      s.orderStatus
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TOMSHOPBD_Sales_Revenue_Audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Revenue KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-300">
              {isBn ? 'প্রকৃত বাস্তবায়িত রেভিনিউ' : 'Completed Realized Revenue'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1.5">{formatTk(totalCompletedRevenue)}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isBn ? 'সফল ও পেইড অর্ডার হতে' : 'Delivered & paid orders only'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              {isBn ? 'আদায়কৃত ডেলিভারি ফি' : 'Delivery Charges'}
            </span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-cyan-400 mt-1.5">{formatTk(totalDeliveryCostCollected)}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isBn ? 'লজিস্টিকস ফান্ড' : 'Logistics collections'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              {isBn ? 'সংগৃহীত ভ্যাট/ট্যাক্স (NBR)' : 'Govt VAT / Tax'}
            </span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1.5">{formatTk(totalTaxCollected)}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isBn ? 'সরকারি কোষাগার প্রদেয়' : 'NBR compliant collection'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              {isBn ? 'মোট ডিসকাউন্ট ছাড়' : 'Total Discounts'}
            </span>
            <Tag className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-xl font-black text-rose-400 mt-1.5">{formatTk(totalDiscountGiven)}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isBn ? 'কুপন ও প্রচারমূলক ছাড়' : 'Promotions & promo codes'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400">
              {isBn ? 'ক্যাশব্যাক প্রদান' : 'Cashback Disbursed'}
            </span>
            <Coins className="w-4 h-4 text-purple-400" />
          </div>
          <h4 className="text-xl font-black text-purple-400 mt-1.5">{formatTk(totalCashbackGiven)}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isBn ? 'টোকেন ওয়ালেটে জমা' : 'Credited to customer wallet'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/20 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-300">
              {isBn ? 'বাতিল/ব্যর্থ (বাদ দেওয়া)' : 'Excluded Failed/Cancelled'}
            </span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-xl font-black text-slate-400 mt-1.5 line-through">{formatTk(totalExcludedRevenue)}</h4>
          <p className="text-[10px] text-rose-400 mt-0.5">
            {isBn ? 'রেভিনিউ হতে বাদ দেওয়া হয়েছে' : 'Strictly excluded from P&L'}
          </p>
        </div>
      </div>

      {/* Filter and Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'অর্ডার আইডি, গ্রাহক, ডিলার বা পণ্য দিয়ে খুঁজুন...' : 'Search Order ID, Customer, Seller/Dealer, Product...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল অর্ডার স্ট্যাটাস' : 'All Order Statuses'}</option>
            <option value="delivered">{isBn ? 'ডেলিভার্ড (Delivered)' : 'Delivered'}</option>
            <option value="processing">{isBn ? 'প্রসেসিং (Processing)' : 'Processing'}</option>
            <option value="shipped">{isBn ? 'শিপড (Shipped)' : 'Shipped'}</option>
            <option value="pending">{isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
            <option value="cancelled">{isBn ? 'বাতিল (Cancelled)' : 'Cancelled'}</option>
            <option value="failed">{isBn ? 'ব্যর্থ (Failed)' : 'Failed'}</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল পেমেন্ট স্ট্যাটাস' : 'All Payment Statuses'}</option>
            <option value="Received">{isBn ? 'রিসিভড (Received / Paid)' : 'Received / Paid'}</option>
            <option value="Pending">{isBn ? 'পেন্ডিং (Pending)' : 'Pending'}</option>
            <option value="Processing">{isBn ? 'প্রসেসিং (Processing)' : 'Processing'}</option>
            <option value="Refunded">{isBn ? 'রিফান্ডেড (Refunded)' : 'Refunded'}</option>
            <option value="Partially Refunded">{isBn ? 'আংশিক রিফান্ড' : 'Partially Refunded'}</option>
            <option value="Failed">{isBn ? 'ব্যর্থ (Failed)' : 'Failed'}</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল পেমেন্ট মাধ্যম' : 'All Payment Methods'}</option>
            <option value="Cash on Delivery">{isBn ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery'}</option>
            <option value="bKash">{isBn ? 'বিকাশ মার্চেন্ট' : 'bKash'}</option>
            <option value="Nagad">{isBn ? 'নগদ গেটওয়ে' : 'Nagad'}</option>
            <option value="Bank">{isBn ? 'ব্যাংক ট্রান্সফার' : 'Bank'}</option>
            <option value="Crypto">{isBn ? 'ক্রিপ্টো / টোকেন' : 'Crypto'}</option>
            <option value="Other approved payment methods">{isBn ? 'অনুমোদিত অন্যান্য মাধ্যম' : 'Other approved methods'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isBn ? 'এক্সপোর্ট CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Table - Explicitly displaying all 16 required fields */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">{isBn ? 'অর্ডার আইডি ও তারিখ' : 'Order ID & Date'}</th>
                <th className="py-3 px-3.5">{isBn ? 'গ্রাহক (ID ও নাম)' : 'Customer (ID & Name)'}</th>
                <th className="py-3 px-3.5">{isBn ? 'সেলার / ডিলার ID' : 'Seller / Dealer ID'}</th>
                <th className="py-3 px-3.5">{isBn ? 'পণ্য ও পরিমাণ' : 'Product & Qty'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'MRP' : 'MRP'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ছাড় (Discount)' : 'Discount'}</th>
                <th className="py-3 px-3.5 text-right">{isBn ? 'চূড়ান্ত বিক্রয় মূল্য' : 'Final Sale Amount'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ডেলিভারি খরচ' : 'Delivery Cost'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ভ্যাট/ট্যাক্স' : 'Tax'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ক্যাশব্যাক' : 'Cashback'}</th>
                <th className="py-3 px-3.5">{isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'অর্ডার স্ট্যাটাস' : 'Order Status'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'ইনভয়েস' : 'Invoice'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-500">
                    {isBn ? 'কোনো বিক্রয় ও রেভিনিউ রেকর্ড পাওয়া যায়নি' : 'No sales or revenue records found matching criteria'}
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isDeliveredOrPaid = isCompletedOrPaid(sale);
                  return (
                    <tr key={sale.orderId} className="hover:bg-slate-800/40 transition-colors">
                      {/* 1 & 2. Order ID & Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-100 font-mono">{sale.orderId}</span>
                        <div className="text-[10px] text-slate-400">{sale.orderDate || sale.date}</div>
                      </td>

                      {/* 3 & 4. Customer ID & Name */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-200">{sale.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sale.customerId}</div>
                      </td>

                      {/* 5. Seller/Dealer ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {sale.sellerOrDealerId}
                        </span>
                      </td>

                      {/* 6 & 7. Product & Quantity */}
                      <td className="py-3 px-3.5 max-w-[180px]">
                        <div className="truncate text-slate-200 font-medium" title={sale.product}>
                          {sale.product}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">{sale.quantity}x ইউনিট</div>
                      </td>

                      {/* 8. MRP */}
                      <td className="py-3 px-3 text-right whitespace-nowrap text-slate-300">
                        {formatTk(sale.mrp)}
                      </td>

                      {/* 9. Discount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {sale.discount > 0 ? (
                          <span className="text-rose-400">-{formatTk(sale.discount)}</span>
                        ) : (
                          <span className="text-slate-500">৳০</span>
                        )}
                      </td>

                      {/* 10. Final Sale Amount */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span
                          className={`font-bold font-mono ${
                            isDeliveredOrPaid ? 'text-emerald-400 text-sm' : 'text-slate-500 line-through text-xs'
                          }`}
                        >
                          {formatTk(sale.finalSaleAmount)}
                        </span>
                        {!isDeliveredOrPaid && (
                          <div className="text-[9px] text-rose-400 font-medium">
                            {isBn ? 'বাতিল/অসম্পন্ন' : 'Excluded (Unrealized)'}
                          </div>
                        )}
                      </td>

                      {/* 11. Delivery Cost */}
                      <td className="py-3 px-3 text-right whitespace-nowrap text-cyan-300 font-mono">
                        +{formatTk(sale.deliveryCost)}
                      </td>

                      {/* 12. Tax */}
                      <td className="py-3 px-3 text-right whitespace-nowrap text-amber-400 font-mono">
                        {sale.tax > 0 ? `+${formatTk(sale.tax)}` : '৳০'}
                      </td>

                      {/* 13. Cashback */}
                      <td className="py-3 px-3 text-right whitespace-nowrap text-purple-300 font-mono">
                        {sale.cashback > 0 ? formatTk(sale.cashback) : '৳০'}
                      </td>

                      {/* 14. Payment Method */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* 15. Payment Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.paymentStatus === 'Received' || sale.paymentStatus === 'Paid' || sale.paymentStatus === 'Collected'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : sale.paymentStatus === 'Processing'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : sale.paymentStatus === 'Failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : sale.paymentStatus === 'Refunded' || sale.paymentStatus === 'Partially Refunded'
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </td>

                      {/* 16. Order Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.orderStatus === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : sale.orderStatus === 'processing' || sale.orderStatus === 'shipped'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : sale.orderStatus === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : sale.orderStatus === 'failed'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {sale.orderStatus}
                        </span>
                      </td>

                      {/* Invoice & Voucher Viewer */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoice(sale)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="ইনভয়েস বা ভাউচার বিস্তারিত দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'অর্ডার ইনভয়েস ও রেভিনিউ ভাউচার' : 'Official Sales & Revenue Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div>
                  <span className="text-slate-400">Order ID:</span>
                  <p className="font-bold text-white font-mono">{selectedInvoice.orderId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Order Date:</span>
                  <p className="font-semibold text-slate-200">{selectedInvoice.orderDate || selectedInvoice.date}</p>
                </div>
                <div>
                  <span className="text-slate-400">Customer Name:</span>
                  <p className="font-semibold text-slate-200">{selectedInvoice.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Customer ID:</span>
                  <p className="font-mono text-slate-300">{selectedInvoice.customerId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Seller / Dealer ID:</span>
                  <p className="font-mono text-slate-300">{selectedInvoice.sellerOrDealerId}</p>
                </div>
                <div>
                  <span className="text-slate-400">Order Status:</span>
                  <p className="font-semibold text-emerald-400 uppercase">{selectedInvoice.orderStatus}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Product:</span>
                  <span className="font-semibold text-white text-right">{selectedInvoice.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="font-semibold text-emerald-400">{selectedInvoice.quantity} Units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">MRP (Original Price):</span>
                  <span>{formatTk(selectedInvoice.mrp)}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Discount:</span>
                  <span>-{formatTk(selectedInvoice.discount)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-200 border-t border-slate-700/60 pt-1.5">
                  <span>Final Sale Amount (Net Product):</span>
                  <span>{formatTk(selectedInvoice.finalSaleAmount)}</span>
                </div>
                <div className="flex justify-between text-cyan-400">
                  <span>Delivery Cost:</span>
                  <span>+{formatTk(selectedInvoice.deliveryCost)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Govt VAT / Tax:</span>
                  <span>+{formatTk(selectedInvoice.tax)}</span>
                </div>
                <div className="flex justify-between text-purple-400">
                  <span>Token Cashback:</span>
                  <span>{formatTk(selectedInvoice.cashback)}</span>
                </div>
                <div className="pt-2 border-t border-slate-700 flex justify-between font-bold text-sm text-emerald-400">
                  <span>Total Collected Invoice Value:</span>
                  <span>{formatTk(selectedInvoice.finalSaleAmount + selectedInvoice.deliveryCost + selectedInvoice.tax)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div>
                  <span className="text-slate-400">Payment Method:</span>
                  <p className="font-semibold text-slate-200">{selectedInvoice.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Payment Status:</span>
                  <p className="font-bold text-emerald-400">{selectedInvoice.paymentStatus}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'ইনভয়েস প্রিন্ট' : 'Print Invoice'}</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
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
