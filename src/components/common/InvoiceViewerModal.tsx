import React, { useState } from 'react';
import { Order } from '../../types';
import { formatTP } from '../../lib/ecommerce-data';
import { downloadInvoicePDF, printInvoiceView } from '../../lib/invoicePdfGenerator';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  MapPin,
  Building2,
  Store,
  Truck,
  ShieldCheck,
  QrCode,
  Sparkles,
  FileText
} from 'lucide-react';

interface InvoiceViewerModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceViewerModal: React.FC<InvoiceViewerModalProps> = ({ order, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const invoiceNum = order.invoiceNumber || `INV-${order.id}`;

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    setDownloadSuccess(false);
    const success = await downloadInvoicePDF(order, `invoice-printable-content-${order.id}`);
    setIsGenerating(false);
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handlePrint = () => {
    printInvoiceView(`invoice-printable-content-${order.id}`);
  };

  const confItems = order.items || [];
  const mrpSubtotal = order.mrpTotal || order.subtotal || confItems.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
  const shipping = order.shippingCharge ?? 60;
  const vat = order.tax ?? Math.round(mrpSubtotal * 0.05);
  const payCharge = order.paymentCharge || 0;
  const couponDiscount = order.couponDiscount || (order.discountAmount ?? 0);
  const totalTp = formatTP(order.totalPvEarned ?? order.pvEarned);
  const grandTotal = order.grandTotal || (mrpSubtotal - couponDiscount + shipping + vat + payCharge);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Top Modal Navigation Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/80 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-black text-neutral-900 dark:text-white text-sm sm:text-base">
                অফিসিয়াল অর্ডার ইনভয়েস (Official Invoice)
              </h2>
              <span className="text-[11px] text-neutral-500 font-mono">
                Invoice No: {invoiceNum} • Order ID: {order.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'PDF তৈরি হচ্ছে...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-100 text-emerald-800 px-4 py-2 text-xs font-bold text-center border-b border-emerald-200 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ইনভয়েস PDF সফলভাবে ডাউনলোড হয়েছে এবং স্থানীয়ভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}

        {/* Printable & Printable-Captured Invoice Content Container */}
        <div id={`invoice-printable-content-${order.id}`} className="p-6 space-y-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
          
          {/* Invoice Header Brand Banner */}
          <div className="p-5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl text-white space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-300" />
                  <h1 className="text-xl font-black tracking-wide">Apon Bazar</h1>
                </div>
                <p className="text-xs text-emerald-100 font-medium">
                  Apon Bazar — জাতীয় ই-কমার্স ও অটোমেটেড লোকাল রাউটিং ইনভয়েস
                </p>
              </div>

              <div className="sm:text-right font-mono bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/20">
                <span className="text-[10px] text-emerald-200 uppercase block font-semibold">ইনভয়েস নম্বর (Unique ID)</span>
                <strong className="text-sm text-white font-black">{invoiceNum}</strong>
                <span className="text-[10px] text-emerald-200 block mt-0.5">
                  তারিখ: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-900/80 text-emerald-100 rounded-md font-bold uppercase font-mono text-[10px]">
                  STATUS: {(order.orderStatus || 'CONFIRMED').toUpperCase()}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500 text-emerald-950 font-black rounded-md font-mono text-[10px]">
                  PAYMENT: {(order.paymentMethod || 'COD').toUpperCase()} ({(order.paymentStatus || 'PENDING').toUpperCase()})
                </span>
              </div>

              <div className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 font-mono">
                <span>ডেলিভারি OTP কোড:</span>
                <strong className="text-amber-200 text-sm tracking-wider">{order.otpCode}</strong>
              </div>
            </div>
          </div>

          {/* Location Routing & Customer Delivery Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Customer & Address Details */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <MapPin className="w-4 h-4" />
                <span>১. গ্রাহকের স্থান ও ডেলিভারি বিবরণ</span>
              </div>
              <p className="font-bold text-neutral-900 dark:text-white">{order.customerName}</p>
              <p className="text-neutral-600 dark:text-neutral-300">মোবাইল: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{order.customerPhone}</strong></p>
              {order.customerEmail && <p className="text-neutral-500">ইমেইল: {order.customerEmail}</p>}
              <div className="pt-1 text-neutral-600 dark:text-neutral-300">
                <span className="text-[10px] text-neutral-400 font-bold uppercase block">পূর্ণাঙ্গ সার্ভিস এড্রেস:</span>
                <p className="font-medium text-[11px]">
                  {order.shippingAddress?.fullServiceAddress || 
                    [order.shippingAddress?.area, order.shippingAddress?.unionName, order.shippingAddress?.upazila, order.shippingAddress?.district, order.shippingAddress?.division].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>

            {/* Auto Location-Routed Partners Summary */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black border-b border-emerald-200 dark:border-emerald-800 pb-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>২. অটোমেটিক লোকেশন রাউটিং পার্টনারস</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start gap-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">অপারেশন পার্টনার হাব:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">{order.assignedOpPartnerName || 'ঢাকা সেন্ট্রাল হাব (WH-DHK-01)'}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">নির্ধারিত ডিলার আউটলেট:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">{order.assignedDealerShopName || 'TOMOK প্রাইম শপ'}</strong>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-neutral-500 font-bold block">অ্যাসাইনকৃত রাইডার:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {order.assignedDeliveryRiderName || 'রাইডার পাওয়া যায়নি'}
                      {order.assignedDeliveryRiderPhone && order.assignedDeliveryRiderPhone !== 'N/A'
                        ? ` (${order.assignedDeliveryRiderPhone})`
                        : ''}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Products Item Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>৩. পণ্যের তালিকা ও ভ্যাট/ট্যাক্স হিসাব (Ordered Items & VAT Breakdown)</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                NBR Certified VAT Rates
              </span>
            </h3>

            <div className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700 text-[11px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">পণ্য</th>
                    <th className="p-3 text-center">পরিমাণ</th>
                    <th className="p-3 text-right">একক মূল্য</th>
                    <th className="p-3 text-center">ভ্যাট হার</th>
                    <th className="p-3 text-right">ভ্যাট (৳)</th>
                    <th className="p-3 text-right">TP Points</th>
                    <th className="p-3 text-right">মোট মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 text-[11px]">
                  {confItems.map((item, idx) => {
                    const title = item.productTitle || item.product?.titleBn || item.product?.title || 'পণ্য';
                    const qty = item.quantity || 1;
                    const uPrice = item.vatSnapshot?.unitPriceInclTax ?? item.unitPrice ?? 0;
                    const tot = item.vatSnapshot?.totalPriceInclTax ?? item.totalPrice ?? (uPrice * qty);
                    const vatRate = item.vatSnapshot?.vatRate ?? 15;
                    const itemVat = item.vatSnapshot?.totalTaxAmount ?? Math.round(tot - (tot / (1 + vatRate / 100)));
                    const tpVal = formatTP(item.pvPoint || (item.product?.pvValue ? item.product.pvValue * qty : ((item.product?.mrp && item.product?.dealerPrice) ? ((item.product.mrp - item.product.dealerPrice) * 0.8 / 10) * qty : 0)));

                    return (
                      <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-3 font-mono text-neutral-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-neutral-900 dark:text-white">
                          <div>{title}</div>
                          {item.vatSnapshot && (
                            <span className="text-[9px] text-neutral-400 font-mono">
                              Excl: ৳{item.vatSnapshot.unitPriceExclTax} | Tax: ৳{item.vatSnapshot.unitTaxAmount}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold">{qty} টি</td>
                        <td className="p-3 text-right font-mono">৳ {(uPrice ?? 0).toLocaleString()}</td>
                        <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">{vatRate}%</td>
                        <td className="p-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">৳ {itemVat.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">{tpVal} TP</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">৳ {(tot ?? 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Calculation Summary & QR Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Security Guarantee & Verification QR Representation */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase block">নিরাপত্তা ও ইউনিকনেস বার্তা</span>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  এই ইনভয়েসটি অটো-জেনারেটেড এবং গ্রাহকের গন্তব্য অনুযায়ী এডমিন, সুপার এডমিন, অপারেশনস পার্টনার, ডিলার ও ডেলিভারি রাইডার ড্যাশবোর্ডে সংরক্ষিত হয়েছে।
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-8 h-8 text-emerald-600" />
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 block font-mono">VERIFIED INVOICE</span>
                    <span className="text-[11px] font-mono font-bold text-neutral-800 dark:text-neutral-200">{invoiceNum}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded border border-emerald-300">
                  NO DUPLICATE
                </span>
              </div>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>পণ্যের নিট মূল্য (Excl. VAT):</span>
                <span>৳ {(order.subtotalExclTax ?? Math.max(0, mrpSubtotal - (order.totalVatTax || vat))).toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>সরকারি ভ্যাট ({order.taxMode === 'excluded' ? 'অতিরিক্ত' : 'অন্তর্ভুক্ত'}):</span>
                <span>৳ {(order.totalVatTax ?? vat ?? 0).toLocaleString()}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>ডিসকাউন্ট:</span>
                  <span>- ৳ {(couponDiscount ?? 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>ডেলিভারি চার্জ:</span>
                <span>৳ {(shipping ?? 60).toLocaleString()}</span>
              </div>

              {payCharge > 0 && (
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>পেমেন্ট গেটওয়ে চার্জ:</span>
                  <span>৳ {(payCharge ?? 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-emerald-600 font-bold border-t border-neutral-200 dark:border-neutral-700 pt-2">
                <span>অর্জিত মোট টোকেন পয়েন্ট:</span>
                <span>{totalTp} TP</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span>সর্বমোট ইনভয়েস মূল্য:</span>
                <span className="text-base">৳ {(grandTotal ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
