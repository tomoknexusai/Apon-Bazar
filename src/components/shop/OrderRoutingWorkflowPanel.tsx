/**
 * Role-Based Order Routing & Workflow Stepper Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { Order, OrderStatus, UserRole } from '../../types';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { InvoiceViewerModal } from '../common/InvoiceViewerModal';
import { downloadInvoicePDF } from '../../lib/invoicePdfGenerator';
import {
  MapPin,
  Building2,
  Store,
  Truck,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Phone,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  KeyRound,
  FileText,
  Printer,
  Download
} from 'lucide-react';

interface OrderRoutingWorkflowPanelProps {
  order: Order;
  userRole?: UserRole;
  showDetails?: boolean;
}

export const OrderRoutingWorkflowPanel: React.FC<OrderRoutingWorkflowPanelProps> = ({
  order,
  userRole,
  showDetails = true
}) => {
  const { updateOrderStatus, verifyDeliveryOtp } = useECommerce();
  const { currentUser } = useAuth();

  const activeRole = userRole || currentUser?.primaryRole || 'customer';

  const [otpInput, setOtpInput] = useState('');
  const [otpMsg, setOtpMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Workflow steps mapping
  const WORKFLOW_STEPS: { id: OrderStatus; labelBn: string; labelEn: string; icon: string; assignedRole: string }[] = [
    { id: 'placed', labelBn: 'ORDER PLACED', labelEn: 'Order Placed', icon: '1', assignedRole: 'Customer' },
    { id: 'op_assigned', labelBn: 'OPERATION PARTNER ASSIGNED', labelEn: 'Op Partner Assigned', icon: '2', assignedRole: 'Operation Partner' },
    { id: 'dealer_assigned', labelBn: 'DEALER ASSIGNED', labelEn: 'Dealer Assigned', icon: '3', assignedRole: 'Dealer' },
    { id: 'product_ready', labelBn: 'PRODUCT READY', labelEn: 'Product Ready', icon: '4', assignedRole: 'Dealer' },
    { id: 'delivery_assigned', labelBn: 'DELIVERY MAN ASSIGNED', labelEn: 'Delivery Man Assigned', icon: '5', assignedRole: 'Delivery Rider' },
    { id: 'picked_up', labelBn: 'PICKED UP', labelEn: 'Picked Up', icon: '6', assignedRole: 'Delivery Rider' },
    { id: 'out_for_delivery', labelBn: 'OUT FOR DELIVERY', labelEn: 'Out For Delivery', icon: '7', assignedRole: 'Delivery Rider' },
    { id: 'delivered', labelBn: 'DELIVERED', labelEn: 'Delivered', icon: '8', assignedRole: 'Delivery Rider' },
    { id: 'completed', labelBn: 'COMPLETED', labelEn: 'Completed', icon: '9', assignedRole: 'Admin / System' }
  ];

  // Map legacy status strings to workflow indices
  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'placed': case 'pending': return 0;
      case 'op_assigned': case 'confirmed': return 1;
      case 'dealer_assigned': case 'vendor_accepted': return 2;
      case 'product_ready': case 'packed': return 3;
      case 'delivery_assigned': case 'assigned': case 'rider_assigned': return 4;
      case 'picked_up': case 'picked': return 5;
      case 'out_for_delivery': case 'in_transit': case 'processing': return 6;
      case 'delivered': return 7;
      case 'completed': return 8;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.orderStatus);

  // Status Action Buttons per Role
  const handleNextStatus = (nextStatus: OrderStatus) => {
    updateOrderStatus(order.id, nextStatus);
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const res = verifyDeliveryOtp(order.id, otpInput);
    setOtpMsg({ success: res.success, text: res.message });
    if (res.success) {
      setOtpInput('');
    }
  };

  // Maps location link generator
  const mapUrl = order.shippingAddress?.latitude && order.shippingAddress?.longitude
    ? `https://maps.google.com/?q=${order.shippingAddress.latitude},${order.shippingAddress.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(
        [order.shippingAddress?.area, order.shippingAddress?.upazila, order.shippingAddress?.district].filter(Boolean).join(', ')
      )}`;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-5 text-xs">
      
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
              {order.id}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
              {WORKFLOW_STEPS[currentStepIdx]?.labelBn || order.orderStatus.toUpperCase()}
            </span>
          </div>
          <p className="text-neutral-500 text-[11px] mt-0.5">
            গ্রাহক: <strong className="text-neutral-800 dark:text-neutral-200">{order.customerName}</strong> ({order.customerPhone})
          </p>
        </div>

        {/* Google Maps Location Pill */}
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Google Maps লোকেশন দেখুন</span>
          <ExternalLink className="w-3 h-3 text-emerald-500" />
        </a>
      </div>

      {/* Role-Based Assignment Matrix (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Operation Partner */}
        <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/60 space-y-1">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-bold text-[11px]">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> ১. Operation Partner
            </span>
            <span className="text-[9px] bg-purple-200 dark:bg-purple-900 px-1.5 py-0.2 rounded font-mono">
              {order.logistics?.hubCode || 'HUB-OP'}
            </span>
          </div>
          <p className="font-bold text-neutral-900 dark:text-white text-xs truncate">
            {order.assignedOpPartnerName || order.logistics?.vendorShopName || 'রাজশাহী সেন্ট্রাল হাব'}
          </p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400">
            এরিয়া: {order.shippingAddress?.division} {'>'} {order.shippingAddress?.district} {'>'} {order.shippingAddress?.upazila}
          </p>
        </div>

        {/* 2. Dealer / Vendor */}
        <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-bold text-[11px]">
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> ২. Dealer / Fulfillment
            </span>
            <span className="text-[9px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.2 rounded">
              আউটলেট
            </span>
          </div>
          <p className="font-bold text-neutral-900 dark:text-white text-xs truncate">
            {order.assignedDealerShopName || order.assignedDealerName || order.logistics?.vendorShopName || 'TOMSHOPBD প্রাইম আউটলেট'}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400">
            ফুলফিলমেন্ট ডিলার পয়েন্ট
          </p>
        </div>

        {/* 3. Delivery Man */}
        <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-900/60 space-y-1">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 font-bold text-[11px]">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" /> ৩. Delivery Man
            </span>
            <a href={`tel:${order.assignedDeliveryRiderPhone || order.logistics?.riderPhone}`} className="text-[9px] bg-sky-200 dark:bg-sky-900 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
              <Phone className="w-2.5 h-2.5" /> কল দিন
            </a>
          </div>
          <p className="font-bold text-neutral-900 dark:text-white text-xs truncate">
            {order.assignedDeliveryRiderName || order.logistics?.riderName || 'রাইডার পাওয়া যায়নি'}
          </p>
          {(order.assignedDeliveryRiderPhone || order.logistics?.riderPhone) && (
            <p className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">
              {order.assignedDeliveryRiderPhone || order.logistics?.riderPhone}
            </p>
          )}
        </div>
      </div>

      {/* 9-Step Visual Order Routing Workflow Stepper */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            অর্ডার রাউটিং ওয়ার্কফ্লো স্ট্যাটাস ট্র্যাকার (9-Step Routing Workflow)
          </span>
          <span className="text-[11px] font-mono font-bold text-emerald-600">
            ধাপ {currentStepIdx + 1} / ৯
          </span>
        </div>

        {/* Horizontal Workflow Stepper */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center min-w-[700px] gap-1">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isPassed = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex-1 p-2 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-600 font-black shadow'
                        : isPassed
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                        : 'bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-black mb-0.5">
                      {isPassed ? '✓' : `0${idx + 1}`}
                    </div>
                    <div className="text-[9px] leading-tight font-extrabold uppercase truncate">
                      {step.labelBn}
                    </div>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ChevronRight className={`w-3 h-3 shrink-0 ${idx < currentStepIdx ? 'text-emerald-600' : 'text-neutral-300'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Authorized Role Action Controls */}
      {showDetails && (
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-3">
          <span className="font-bold text-neutral-900 dark:text-white text-xs block">
            আপনার রোল ({activeRole.toUpperCase()}) অনুযায়ী অনুমোদিত একশন কন্ট্রোল:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {/* Operation Partner Actions */}
            {(activeRole === 'operations_partner' || activeRole === 'admin' || activeRole === 'super_admin') && (
              <>
                {currentStepIdx === 0 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('op_assigned')}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>অপারেশন পার্টনার কনফার্ম ও ডিলার নির্দেশ দিন</span>
                  </button>
                )}
                {currentStepIdx === 1 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('dealer_assigned')}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>ডিলারকে অর্ডার হস্তান্তর করুন (DEALER ASSIGNED)</span>
                  </button>
                )}
              </>
            )}

            {/* Dealer Actions */}
            {(activeRole === 'dealer' || activeRole === 'vendor' || activeRole === 'admin' || activeRole === 'super_admin') && (
              <>
                {currentStepIdx === 2 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('product_ready')}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>পণ্য প্যাকিং ও রেডি মার্ক করুন (PRODUCT READY)</span>
                  </button>
                )}
              </>
            )}

            {/* Delivery Man Actions */}
            {(activeRole === 'delivery_rider' || activeRole === 'admin' || activeRole === 'super_admin') && (
              <>
                {currentStepIdx === 3 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('delivery_assigned')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>রাইডার অ্যাসাইন গ্রহণ করুন (DELIVERY MAN ASSIGNED)</span>
                  </button>
                )}
                {currentStepIdx === 4 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('picked_up')}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>পার্সেল পিক আপ করুন (PICKED UP)</span>
                  </button>
                )}
                {currentStepIdx === 5 && (
                  <button
                    type="button"
                    onClick={() => handleNextStatus('out_for_delivery')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>গন্তব্যের উদ্দেশ্যে রওনা দিন (OUT FOR DELIVERY)</span>
                  </button>
                )}
              </>
            )}

            {/* OTP Delivery Confirmation Form for Delivery Rider / Admin */}
            {(activeRole === 'delivery_rider' || activeRole === 'admin' || activeRole === 'super_admin') && currentStepIdx >= 6 && currentStepIdx < 8 && (
              <form onSubmit={handleOtpVerify} className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-2 rounded-xl border border-neutral-300 dark:border-neutral-700">
                <KeyRound className="w-4 h-4 text-rose-500" />
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="গ্রাহকের ৪-ডিজিট OTP (e.g. 8842)"
                  maxLength={4}
                  className="bg-transparent border-none outline-none font-mono font-bold w-48 text-neutral-900 dark:text-white text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                >
                  ওটিপি ভেরিফাই ও ডেলিভারড করুন
                </button>
              </form>
            )}

            {/* Completion Action */}
            {(activeRole === 'admin' || activeRole === 'super_admin' || activeRole === 'operations_partner') && currentStepIdx === 7 && (
              <button
                type="button"
                onClick={() => handleNextStatus('completed')}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>অর্ডার চূড়ান্তভাবে সম্পন্ন করুন (COMPLETED)</span>
              </button>
            )}

            {currentStepIdx === 8 && (
              <span className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> অর্ডার সফলভাবে কমপ্লিট করা হয়েছে।
              </span>
            )}

            {/* Universal Invoice PDF Button */}
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>ইনভয়েস PDF (View & Download)</span>
            </button>
          </div>

          {otpMsg && (
            <p className={`text-xs font-bold ${otpMsg.success ? 'text-emerald-600' : 'text-rose-600'}`}>
              {otpMsg.text}
            </p>
          )}

          {/* Invoice Modal Integration */}
          <InvoiceViewerModal
            order={order}
            isOpen={isInvoiceOpen}
            onClose={() => setIsInvoiceOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
