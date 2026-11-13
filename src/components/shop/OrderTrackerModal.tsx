/**
 * Redesigned Customer Order Details & Tracking Modal Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth, normalizeBDMobileNumber } from '../../context/AuthContext';
import { Order, OrderStatus } from '../../types';
import { formatPV } from '../../lib/ecommerce-data';
import { calculatePaymentCharge, formatPrice } from '../../lib/pricing';
import { InvoiceViewerModal } from '../common/InvoiceViewerModal';
import { downloadInvoicePDF } from '../../lib/invoicePdfGenerator';
import {
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Building2,
  MessageSquare,
  Package,
  Calendar,
  Tag,
  User,
  Printer,
  FileText,
  DollarSign,
  Download
} from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetOrderId?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  targetOrderId
}) => {
  const { orders, createSupportTicket } = useECommerce();
  const { currentUser } = useAuth();

  const userOrders = orders.filter((o) => {
    if (!currentUser || currentUser.primaryRole === 'super_admin' || currentUser.primaryRole === 'admin') return true;
    if (o.userId === currentUser.id) return true;
    if (currentUser.mobileNumber && o.customerPhone) {
      const uNorm = normalizeBDMobileNumber(currentUser.mobileNumber);
      const oNorm = normalizeBDMobileNumber(o.customerPhone);
      if (uNorm && oNorm && uNorm === oNorm) return true;
    }
    return false;
  });

  const displayOrders = userOrders.length > 0 ? userOrders : orders;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    targetOrderId || displayOrders[0]?.id || ''
  );
  const [supportMsg, setSupportMsg] = useState('');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  if (!isOpen) return null;

  // Get active order from data
  const activeOrder = displayOrders.find((o) => o.id === selectedOrderId) || displayOrders[0];

  // Helper for Order Status Display
  const getStatusBadge = (status?: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs font-black flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> ডেলিভারি সম্পন্ন (Delivered)
          </span>
        );
      case 'in_transit':
      case 'picked':
      case 'assigned':
        return (
          <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full text-xs font-black flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> ডেলিভারির পথে (In Transit)
          </span>
        );
      case 'packed':
      case 'confirmed':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-full text-xs font-black flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> কনফার্মড ও প্রসেসিং (Confirmed)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 rounded-full text-xs font-black flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> অর্ডারের অনুরোধ (Order Placed)
          </span>
        );
    }
  };

  const steps: { status: OrderStatus; label: string }[] = [
    { status: 'placed', label: '1. ORDER PLACED' },
    { status: 'op_assigned', label: '2. OP PARTNER' },
    { status: 'dealer_assigned', label: '3. DEALER ASSIGNED' },
    { status: 'product_ready', label: '4. PRODUCT READY' },
    { status: 'delivery_assigned', label: '5. DELIVERY MAN' },
    { status: 'picked_up', label: '6. PICKED UP' },
    { status: 'out_for_delivery', label: '7. OUT FOR DELIVERY' },
    { status: 'delivered', label: '8. DELIVERED' },
    { status: 'completed', label: '9. COMPLETED' }
  ];

  const statusHierarchy: OrderStatus[] = [
    'pending',
    'placed',
    'op_assigned',
    'confirmed',
    'dealer_assigned',
    'vendor_accepted',
    'product_ready',
    'packed',
    'delivery_assigned',
    'assigned',
    'rider_assigned',
    'picked_up',
    'picked',
    'out_for_delivery',
    'in_transit',
    'delivered',
    'completed'
  ];

  const currentStepIndex = Math.max(0, statusHierarchy.indexOf(activeOrder?.orderStatus || 'pending'));

  // ==========================================
  // DYNAMIC CALCULATIONS FROM ACTUAL ORDER DATA
  // Product Total = Sum of (MRP × Quantity) for all products
  // Total Payable = Product Total - Cashback + Delivery Charge + VAT & Tax
  // ==========================================
  const rawItems = activeOrder?.items || [];

  const sellingTotal = activeOrder?.subtotal || rawItems.reduce((acc, item) => {
    return acc + (item.totalPrice || (item.unitPrice * (item.quantity || 1)));
  }, 0);

  const mrpTotal = activeOrder?.mrpTotal || rawItems.reduce((acc, item) => {
    const itemMrp = item.product?.mrp || item.mrp || item.unitPrice || 0;
    const qty = item.quantity || 1;
    return acc + (itemMrp * qty);
  }, 0);

  const totalPv = activeOrder?.pvEarned || rawItems.reduce((sum, item) => sum + ((item.product?.pvValue || 0) * (item.quantity || 1)), 0);
  const couponDiscount = activeOrder?.couponDiscount || 0;
  const deliveryCharge = activeOrder?.shippingCharge ?? 60;
  const vatTax = activeOrder?.tax ?? Math.round(mrpTotal * 0.05);
  
  const subtotalForCharge = sellingTotal + deliveryCharge + vatTax;
  const payResult = calculatePaymentCharge(subtotalForCharge, activeOrder?.paymentMethod);
  const paymentCharge = activeOrder?.paymentCharge ?? payResult.charge;

  const totalPayable = activeOrder?.grandTotal || Number((subtotalForCharge + paymentCharge - couponDiscount).toFixed(2));

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMsg.trim() || !activeOrder) return;
    createSupportTicket(
      `অর্ডার ${activeOrder.id} সংক্রান্ত সাহায্য`,
      supportMsg,
      'delivery'
    );
    setSupportMsg('');
    setShowSupportModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:static print:bg-white">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm print:max-w-full print:max-h-full print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="font-black text-neutral-900 dark:text-white text-base">
                Customer Order Details (অর্ডারের বিবরণ)
              </h2>
              <p className="text-[11px] text-neutral-500">
                অর্ডারের বিবরণ, পণ্যের তালিকা এবং মূল্য সামারি
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!activeOrder ? (
          <div className="p-12 text-center text-neutral-400">
            কোনো সক্রিয় অর্ডার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Order Selection Bar (If customer has multiple orders) */}
            {displayOrders.length > 1 && (
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 print:hidden">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  অন্যান্য অর্ডার নির্বাচন করুন:
                </label>
                <select
                  value={activeOrder.id}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="bg-white dark:bg-neutral-900 font-bold font-mono text-xs px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-emerald-700 dark:text-emerald-400 outline-none cursor-pointer"
                >
                  {displayOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.createdAt} (৳{o.grandTotal})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SECTION 1: Top Overview Box (Order ID, Order Date, Order Status) */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-neutral-100 dark:from-emerald-950/40 dark:to-neutral-800/60 rounded-2xl border border-emerald-500/20 dark:border-neutral-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                
                {/* Order ID & Date */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      Order ID
                    </span>
                    <h3 className="text-base sm:text-lg font-black font-mono text-neutral-900 dark:text-white">
                      {activeOrder.id}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <strong>Order Date:</strong> {activeOrder.createdAt ? new Date(activeOrder.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <strong>Customer:</strong> {activeOrder.customerName || 'গ্রাহক'} ({activeOrder.customerPhone || 'N/A'})
                    </span>
                  </div>
                </div>

                {/* Order Status Badge & Invoice Action */}
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-[10px] text-neutral-400 block font-semibold mb-0.5">Order Status</span>
                    {getStatusBadge(activeOrder.orderStatus || 'pending')}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsInvoiceOpen(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span>ইনভয়েস PDF</span>
                  </button>
                </div>

              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/80 flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-neutral-900 dark:text-white">ডেলিভারি ঠিকানা:</strong>{' '}
                  {activeOrder.shippingAddress?.fullServiceAddress || 'ঢাকা, বাংলাদেশ'}
                </div>
              </div>
            </div>

            {/* SECTION 2: "অর্ডারের পণ্যসমূহ" (Ordered Products Section) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <h3 className="font-black text-neutral-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>অর্ডারের পণ্যসমূহ (Ordered Products)</span>
                </h3>
                <span className="text-xs text-neutral-500 font-bold">
                  মোট {rawItems.length} টি পণ্য
                </span>
              </div>

              {/* Responsive Product Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-extrabold text-xs uppercase border-b border-neutral-200 dark:border-neutral-800">
                      <th className="p-3 sm:p-3.5">Product Name</th>
                      <th className="p-3 sm:p-3.5 text-center w-24">Quantity</th>
                      <th className="p-3 sm:p-3.5 text-right w-32">MRP Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                    {rawItems.map((item, idx) => {
                      const itemMrp = item.mrp || item.unitPrice || 0;
                      const lineMrpTotal = itemMrp * (item.quantity || 1);

                      return (
                        <tr key={item.id || idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="p-3 sm:p-3.5">
                            <div className="flex items-center gap-3">
                              {item.productImage && (
                                <img
                                  src={item.productImage}
                                  alt={item.productTitle || 'Product'}
                                  className="w-10 h-10 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700 shrink-0"
                                />
                              )}
                              <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                                  {item.productTitle || item.product?.titleBn || item.product?.title || 'পণ্য'}
                                </h4>
                                {item.sku && (
                                  <span className="text-[10px] text-neutral-400 font-mono">
                                    SKU: {item.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 sm:p-3.5 text-center font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                            {item.quantity}
                          </td>

                          <td className="p-3 sm:p-3.5 text-right font-bold text-neutral-900 dark:text-white font-mono">
                            ৳{(lineMrpTotal ?? 0).toLocaleString()}
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              (৳{(itemMrp ?? 0).toLocaleString()} × {item.quantity || 1})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: "Order Summary" Section */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <h3 className="font-black text-neutral-900 dark:text-white text-sm sm:text-base border-b border-neutral-200 dark:border-neutral-700 pb-2">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs font-semibold">
                
                {/* 1. Selling Price */}
                <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                  <span>Selling Price</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPrice(sellingTotal)}
                  </span>
                </div>

                {/* 2. Delivery Cost */}
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-neutral-400" /> Delivery Cost
                  </span>
                  <span className="font-bold font-mono text-neutral-900 dark:text-white text-sm">
                    {formatPrice(deliveryCharge)}
                  </span>
                </div>

                {/* 3. VAT/Tax */}
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span>VAT/Tax</span>
                  <span className="font-bold font-mono text-neutral-900 dark:text-white text-sm">
                    {formatPrice(vatTax)}
                  </span>
                </div>

                {/* 4. PV */}
                <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="font-bold">PV</span>
                  <span className="font-extrabold font-mono text-sm">
                    {formatPV(totalPv)} PV
                  </span>
                </div>

                {/* 5. Payment Charge */}
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span>Payment Charge{payResult.rate > 0 ? ` (${payResult.percentText})` : ''}</span>
                  <span className="font-bold font-mono text-neutral-900 dark:text-white text-sm">
                    {formatPrice(paymentCharge)}
                  </span>
                </div>

                {/* Optional Coupon Discount (if applied) */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon Discount
                    </span>
                    <span className="font-bold font-mono text-sm">
                      - {formatPrice(couponDiscount)}
                    </span>
                  </div>
                )}

                {/* Divider Line */}
                <div className="border-t border-neutral-300 dark:border-neutral-700 my-2 pt-1" />

                {/* 6. Total Amount */}
                <div className="p-3.5 bg-emerald-600 text-white dark:bg-emerald-700 rounded-xl flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-xs font-bold block">Total Amount (সর্বমোট প্রদেয়)</span>
                  </div>
                  <span className="font-black font-mono text-lg sm:text-xl tracking-tight">
                    {formatPrice(totalPayable)}
                  </span>
                </div>

              </div>
            </div>

            {/* SECTION 4: Safe Delivery OTP Code & Live Tracking Progress */}
            <div className="space-y-4 print:hidden">
              
              {/* OTP Code Box */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                      নিরাপদ ডেলিভারি ওটিপি (PoD OTP Code)
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      পণ্য ডেলিভারি গ্রহণের সময় রাইডারকে এই সিকিউরিটি ওটিপি কোডটি প্রদান করবেন।
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white dark:bg-neutral-900 rounded-xl border border-emerald-400 shadow-xs text-center shrink-0">
                  <span className="text-[9px] text-neutral-400 block uppercase font-mono">OTP CODE</span>
                  <span className="font-black text-rose-600 font-mono text-lg tracking-widest">
                    {activeOrder.otpCode || '2026'}
                  </span>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs">অর্ডার লাইভ স্ট্যাটাস ট্র্যাকিং:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {steps.map((step, idx) => {
                    const isDone = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div
                        key={step.status}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 ${
                          isCurrent
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 shadow-xs font-bold text-emerald-700 dark:text-emerald-300'
                            : isDone
                            ? 'border-emerald-300 dark:border-emerald-900 bg-white dark:bg-neutral-800 text-emerald-600'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-400 bg-neutral-50 dark:bg-neutral-900/40 opacity-60'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-neutral-400" />
                        )}
                        <span className="text-[10px] block leading-tight">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rider & Outlet Info */}
              {activeOrder.logistics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                      নিয়োজিত রাইডার:
                    </span>
                    <h5 className="font-bold text-neutral-900 dark:text-white">
                      {activeOrder.logistics.riderName || 'প্রসেসিং এ আছে'}
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      {activeOrder.logistics.riderVehicle} ({activeOrder.logistics.riderPhone})
                    </p>
                  </div>

                  <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                      সোর্স আউটলেট/ওয়্যারহাউজ:
                    </span>
                    <h5 className="font-bold text-neutral-900 dark:text-white">
                      {activeOrder.logistics.vendorShopName || 'TOMSHOPBD ওয়্যারহাউজ'}
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      {activeOrder.logistics.hubAddress}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Actions: Support Ticket & Close */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-4 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(!showSupportModal)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>সাপোর্ট টিকেট খুলুন</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <span>ইনভয়েস প্রিন্ট করুন</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-neutral-900 text-white hover:bg-neutral-800 font-bold rounded-xl text-xs shadow-xs"
              >
                বন্ধ করুন
              </button>
            </div>

            {/* Support Ticket Modal Sub-view */}
            {showSupportModal && (
              <form onSubmit={handleSupportSubmit} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl space-y-3 print:hidden">
                <h4 className="font-bold text-neutral-900 dark:text-white text-xs">সাপোর্ট টিমকে বার্তা পাঠান</h4>
                <textarea
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="আপনার সমস্যা বা প্রশ্নের বিস্তারিত লিখুন..."
                  rows={2}
                  required
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-white outline-none"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSupportModal(false)}
                    className="px-3 py-1.5 text-neutral-500 text-xs font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs"
                  >
                    জমা দিন
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* Invoice Modal for Active Order */}
        {activeOrder && (
          <InvoiceViewerModal
            order={activeOrder}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        )}

      </div>
    </div>
  );
};
