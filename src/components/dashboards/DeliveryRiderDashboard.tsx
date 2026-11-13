/**
 * Delivery Rider Dashboard Component with Live Order Dispatch & OTP Verification
 * Project: Apon Bazar (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useECommerce } from '../../context/ECommerceContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { OrderRoutingManagerHub } from '../shop/OrderRoutingManagerHub';
import {
  Truck,
  Power,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  Phone,
  KeyRound,
  DollarSign,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  Bike,
  Building,
  FileCheck,
  Store,
  MapPin,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { OrderStatus } from '../../types';
import { getZoneByUpazila } from '../../services/DeliveryZoneService';
import { getOperationOfficeByZoneId } from '../../services/OperationOfficeService';

export const DeliveryRiderDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const {
    orders,
    verifyDeliveryOtp,
    markCodCollected,
    updateRiderDeliveryStatus,
    settleRiderCod,
    riderAcceptOrder,
    riderRejectOrder
  } = useECommerce();

  const [isOnline, setIsOnline] = useState(true);
  const [vehicleType] = useState('মোটরসাইকেল (125cc)');
  const [licenseNumber] = useState('DL/DHK/2026/99381');

  // Derive Rider's Registered Zone and Operation Office
  const riderZone = getZoneByUpazila(
    currentUser?.mandatoryAddress?.upazila,
    currentUser?.mandatoryAddress?.district,
    currentUser?.mandatoryAddress?.division
  );
  const riderOffice = getOperationOfficeByZoneId(riderZone.zone_id);

  const assignedUpazila = currentUser?.mandatoryAddress?.upazila || riderZone?.upazila_name || 'ঠাকুরগাঁও সদর';
  const assignedUnion = currentUser?.mandatoryAddress?.area || 'ঠাকুরগাঁও পৌরসভা ও সংলগ্ন ইউনিয়ন';

  // Rejection reason state
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<string, string>>({});
  const [activeRejectOrderId, setActiveRejectOrderId] = useState<string | null>(null);

  // OTP Verification State
  const [otpInputMap, setOtpInputMap] = useState<Record<string, string>>({});
  const [verifyMsgMap, setVerifyMsgMap] = useState<Record<string, { success: boolean; text: string }>>({});

  // Failure Modal / Prompt state
  const [failureReasonMap, setFailureReasonMap] = useState<Record<string, string>>({});
  const [activeFailureOrderId, setActiveFailureOrderId] = useState<string | null>(null);

  // Orders assigned to this rider
  const riderAssignedOrders = orders.filter((o) => {
    const isAssigned =
      o.assignedDeliveryRiderId === currentUser?.id ||
      o.logistics?.riderId === currentUser?.id ||
      // Fallback for demo when user is the demo rider
      (currentUser?.primaryRole === 'delivery_rider' && !o.assignedDeliveryRiderId);
    return isAssigned;
  });

  // Pending acceptance tasks (Waiting for Rider to Accept or Reject)
  const pendingRequests = riderAssignedOrders.filter(
    (o) =>
      o.riderAcceptanceStatus === 'pending' &&
      o.orderStatus !== 'delivered' &&
      o.orderStatus !== 'cancelled' &&
      o.orderStatus !== 'returned_to_dealer'
  );

  // Active ongoing deliveries (Accepted and in progress)
  const activeDeliveries = riderAssignedOrders.filter(
    (o) =>
      o.riderAcceptanceStatus !== 'pending' &&
      o.riderAcceptanceStatus !== 'rejected' &&
      o.orderStatus !== 'delivered' &&
      o.orderStatus !== 'cancelled' &&
      o.orderStatus !== 'returned_to_dealer'
  );

  const completedDeliveries = riderAssignedOrders.filter((o) => o.orderStatus === 'delivered');

  const totalCodCollected = completedDeliveries
    .filter((o) => o.codCollected && !o.codSettled)
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const handleAccept = (orderId: string) => {
    riderAcceptOrder(orderId);
  };

  const handleReject = (orderId: string) => {
    const reason = rejectReasonMap[orderId] || 'রাইডার কর্তৃক ডেলিভারি দায়িত্ব গ্রহণে অপারগতা';
    riderRejectOrder(orderId, reason);
    setActiveRejectOrderId(null);
  };

  const handleOtpVerifySubmit = (orderId: string, e: React.FormEvent) => {
    e.preventDefault();
    const otpVal = otpInputMap[orderId] || '';
    const res = verifyDeliveryOtp(orderId, otpVal);
    setVerifyMsgMap((prev) => ({ ...prev, [orderId]: { success: res.success, text: res.message } }));
    if (res.success) {
      setOtpInputMap((prev) => ({ ...prev, [orderId]: '' }));
    }
  };

  const handleStatusChange = (orderId: string, status: OrderStatus, notes?: string) => {
    updateRiderDeliveryStatus(orderId, status, notes);
  };

  const handleReportFailure = (orderId: string) => {
    const reason = failureReasonMap[orderId] || 'গ্রাহকের সাথে যোগাযোগ করা সম্ভব হয়নি';
    updateRiderDeliveryStatus(orderId, 'delivery_failed', `ডেলিভারি ব্যর্থ হয়েছে: ${reason}`, reason);
    setActiveFailureOrderId(null);
  };

  const handleSettleCod = (orderId: string, amount: number) => {
    settleRiderCod(orderId, amount, 'ডিলার পয়েন্ট হাব');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Universal Dashboard Header */}
      <DashboardHeader
        title={t('riderTitle')}
        subtitle={
          language === 'bn'
            ? 'রাইডার কভারেজ জোন, নতুন ডেলিভারি অ্যাকসেপ্ট/রিজেক্ট, ওটিপি ভেরিফিকেশন ও সিওডি ক্যাশ কালেকশন পোর্টাল'
            : 'Live order dispatch, OTP verification & cash on delivery panel'
        }
        icon={<Truck className="w-6 h-6 text-emerald-300" />}
      />

      {/* Rider Assigned Zone & Operation Office Card */}
      <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-sky-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-300">
                <Bike className="w-5 h-5" />
              </span>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                  নির্ধারিত রাইডার ডেলিভারি জোন (Registered Rider Zone)
                </span>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>{riderZone.zone_name_bn}</span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/40">
                    Zone ID: {riderZone.zone_id}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100/90 pt-1">
              <span>উপজেলা: <strong>{riderZone.upazila_name}</strong></span>
              <span>•</span>
              <span>জেলা: <strong>{riderZone.district_name}</strong></span>
              <span>•</span>
              <span>অপারেশন অফিস: <strong>{riderOffice?.office_name || 'লোকাল অপারেশন অফিস'}</strong></span>
              <span>•</span>
              <span>পয়েন্ট: <strong>{riderZone.zone_point_name}</strong></span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs shrink-0 max-w-xs space-y-1">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>১ উপজেলা = ১ ডেলিভারি জোন</span>
            </div>
            <p className="text-[11px] text-sky-100/80 leading-snug">
              আপনি এই উপজেলার দায়িত্বপ্রাপ্ত রাইডার হিসেবে অর্ডার গ্রহণ বা প্রত্যাখ্যান করতে পারবেন। প্রত্যাখ্যাত অর্ডার স্বয়ংক্রিয়ভাবে পরবর্তী রাইডারের কাছে যাবে।
            </p>
          </div>
        </div>
      </div>

      {/* Duty Status Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 dark:text-neutral-400">
            {language === 'bn' ? 'অনলাইন ডিউটি স্টেটাস:' : 'Online Duty Status:'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${
              isOnline
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            {isOnline ? 'Online (Active)' : 'Offline (Inactive)'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all ${
            isOnline
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? t('goOnline') : t('goOffline')}</span>
        </button>
      </div>

      {/* NEW: Incoming Delivery Task Requests (Accept / Reject) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded-3xl p-6 shadow-md space-y-4 animate-pulse">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800 pb-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-base">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <h3>নতুন ডেলিভারি টাস্ক অনুরোধ ({pendingRequests.length} টি অপেক্ষমাণ)</h3>
            </div>
            <span className="px-3 py-1 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-extrabold rounded-full text-xs font-mono">
              Action Required
            </span>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((order) => {
              const isWithinZone = order.zoneSnapshot?.deliveryType === 'WITHIN_ZONE';

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 shadow-sm space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                        অর্ডার #{order.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWithinZone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isWithinZone ? 'একই জোন (Within Zone)' : 'জোন টু জোন (Zone to Zone)'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-neutral-400 text-[11px] block">আদায়যোগ্য সিওডি:</span>
                      <span className="font-black text-emerald-600 font-mono text-sm">
                        ৳{order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Pickup & Delivery Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-0.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        <Store className="w-3.5 h-3.5" /> ১. ডিলার পয়েন্ট থেকে পিকআপ:
                      </span>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">
                        {order.assignedDealerShopName || 'ডিলার আউটলেট'}
                      </p>
                      <p className="text-neutral-500 text-[10px]">
                        জোন: {order.zoneSnapshot?.dealerZone?.zone_name_bn || 'ডিলার জোন'}
                      </p>
                      <p className="text-neutral-500 text-[10px]">
                        {order.zoneSnapshot?.dealerZone?.dealerAddress || order.shippingAddress?.area}
                      </p>
                    </div>

                    <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-0.5">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> ২. গ্রাহক ডেলিভারি গন্তব্য:
                      </span>
                      <p className="font-bold text-neutral-800 dark:text-neutral-200">
                        {order.customerName} ({order.customerPhone})
                      </p>
                      <p className="text-neutral-500 text-[10px]">
                        জোন: {order.zoneSnapshot?.customerZone?.zone_name_bn || order.shippingAddress?.upazila}
                      </p>
                      <p className="text-neutral-500 text-[10px]">
                        {order.shippingAddress?.area || order.shippingAddress?.fullServiceAddress}
                      </p>
                    </div>
                  </div>

                  {/* Accept / Reject Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setActiveRejectOrderId(activeRejectOrderId === order.id ? null : order.id)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>প্রত্যাখ্যান করুন (Reject)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(order.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>অর্ডার গ্রহণ করুন (Accept Task)</span>
                    </button>
                  </div>

                  {/* Reject Reason Form if open */}
                  {activeRejectOrderId === order.id && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 mt-2">
                      <span className="font-bold text-rose-900 block">প্রত্যাখ্যানের কারণ নির্বাচন করুন:</span>
                      <select
                        value={rejectReasonMap[order.id] || 'যানবাহন বা রুট সমস্যা'}
                        onChange={(e) => setRejectReasonMap((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg text-slate-800 font-medium"
                      >
                        <option value="যানবাহনে যান্ত্রিক ত্রুটি">যানবাহনে যান্ত্রিক ত্রুটি</option>
                        <option value="জোনের বাইরে অবস্থান করছি">বর্তমানে অন্য জোনে অবস্থান করছি</option>
                        <option value="ডেলিভারি ধারণক্ষমতা পূর্ণ (Overloaded)">হাতে ধারণক্ষমতার চেয়ে বেশি ডেলিভারি পার্সেল রয়েছে</option>
                        <option value="অসুস্থতা বা জরুরি ছুটি">অসুস্থতা বা ব্যক্তিগত জরুরি কারণ</option>
                        <option value="রুট প্রতিকূল বা আবহাওয়া খারাপ">প্রতিকূল আবহাওয়া বা দুর্গম রুট</option>
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveRejectOrderId(null)}
                          className="px-3 py-1 bg-white border rounded text-xs text-slate-600"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(order.id)}
                          className="px-4 py-1 bg-rose-600 text-white rounded font-bold text-xs"
                        >
                          নিশ্চিত প্রত্যাখ্যান ও রি-অ্যাসাইন
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            {t('dutyStatus')}
          </span>
          <p className="text-xl font-black flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className={isOnline ? 'text-emerald-600' : 'text-rose-600'}>
              {isOnline ? 'ডিউটিতে আছেন' : 'অফলাইন'}
            </span>
          </p>
          <span className="text-[10px] text-neutral-400">নতুন অর্ডারের জন্য প্রস্তুত</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            অ্যাসাইনকৃত পার্সেল
          </span>
          <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {activeDeliveries.length} টি
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">ইন-ট্রানজিট / পেন্ডিং</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            হাতে থাকা COD ক্যাশ
          </span>
          <p className="text-2xl font-black text-amber-600 font-mono">
            ৳ {totalCodCollected.toLocaleString()}
          </p>
          <span className="text-[10px] text-neutral-400">ডিলারে জমাযোগ্য</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
            সফল ডেলিভারি
          </span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {completedDeliveries.length} টি
          </p>
          <span className="text-[10px] text-neutral-400">সম্পন্ন টাস্ক</span>
        </div>
      </div>

      {/* Delivery Rider Order Routing Hub */}
      <OrderRoutingManagerHub role="delivery_rider" title="রাইডার এরিয়া ও ডেলিভারি ডিসপ্যাচ হাব (Role: Delivery Rider)" />

      {/* Assigned Parcels & Dispatch Lifecycle */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-base">
            <Truck className="w-5 h-5" />
            <h3>রাইডার ডেলিভারি টাস্ক ও হ্যান্ডওভার অ্যাকশন</h3>
          </div>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 text-xs">
            এখনো কোনো পেন্ডিং ডেলিভারি টাস্ক নেই।
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((order) => {
              const otpVal = otpInputMap[order.id] || '';
              const vMsg = verifyMsgMap[order.id];

              return (
                <div
                  key={order.id}
                  className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-neutral-900 dark:text-white">
                          অর্ডার #{order.id}
                        </span>
                        {order.deliverySnapshot?.deliveryModeLabel && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                            {order.deliverySnapshot.deliveryModeLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500 text-[11px]">
                        গ্রাহক: {order.customerName} ({order.customerPhone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-xs">
                        {(order.orderStatus || 'PENDING').toUpperCase()}
                      </span>
                      {order.customerPhone && (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address & Snapshot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-neutral-400 block">গন্তব্য ঠিকানা:</span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {order.shippingAddress?.division || 'ঢাকা'} {'>'} {order.shippingAddress?.district || 'ঢাকা'} {'>'} {order.shippingAddress?.upazila || 'মিরপুর'} {'>'} {order.shippingAddress?.area || order.shippingAddress?.fullServiceAddress || 'ঠিকানা'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block">আদায়যোগ্য ক্যাশ অন ডেলিভারি (COD):</span>
                      <span className="font-black text-emerald-600 font-mono text-sm">
                        ৳ {(order.grandTotal ?? 0).toLocaleString()} ({(order.paymentMethod || 'cod').toUpperCase()})
                      </span>
                    </div>
                  </div>

                  {order.deliverySnapshot && (
                    <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>সড়ক দূরত্ব: <strong>{order.deliverySnapshot.distanceKm} কিমি</strong></span>
                        <span>পার্সেল ওজন: <strong>{order.deliverySnapshot.totalWeightDisplay || `${order.deliverySnapshot.totalWeightKg} kg`}</strong></span>
                        <span>ডেলিভারি ফি: <strong>৳{order.shippingCharge}</strong></span>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono truncate">
                        ব্রেকডাউন: {order.deliverySnapshot.rateBreakdown}
                      </div>
                    </div>
                  )}

                  {/* Step Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                    {order.orderStatus !== 'picked_up' && order.orderStatus !== 'out_for_delivery' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'picked_up', 'রাইডার ডিলার পয়েন্ট থেকে পার্সেল পিকআপ সম্পন্ন করেছেন')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-xs transition"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        ডিলার থেকে পিকআপ নিশ্চিত
                      </button>
                    )}

                    {order.orderStatus === 'picked_up' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'out_for_delivery', 'রাইডার গ্রাহকের ঠিকানার উদ্দেশ্যে রওনা দিয়েছেন (Out for Delivery)')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-xs transition"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        ডেলিভারি যাত্রা শুরু (Out for Delivery)
                      </button>
                    )}

                    {/* Delivery Failure trigger */}
                    <button
                      type="button"
                      onClick={() => setActiveFailureOrderId(activeFailureOrderId === order.id ? null : order.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-xs flex items-center gap-1 transition"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      ব্যর্থ ডেলিভারি রিপোর্ট
                    </button>
                  </div>

                  {/* Failure reason popup/form */}
                  {activeFailureOrderId === order.id && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                      <span className="font-bold text-rose-900 text-xs block">ডেলিভারি ব্যর্থতার কারণ নির্বাচন করুন:</span>
                      <select
                        value={failureReasonMap[order.id] || 'গ্রাহক অনুপলব্ধ (Customer Unavailable)'}
                        onChange={(e) => setFailureReasonMap((prev) => ({ ...prev, [order.id]: e.target.value }))}
                        className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg text-slate-800"
                      >
                        <option value="গ্রাহক অনুপলব্ধ (Customer Unavailable)">গ্রাহক ফোন রিসিভ করছেন না / অনুপলব্ধ</option>
                        <option value="ঠিকানা ভুল বা অসম্পূর্ণ (Wrong Address)">ঠিকানা ভুল বা অসম্পূর্ণ</option>
                        <option value="গ্রাহক পণ্য গ্রহণে অসম্মতি (Customer Refused)">গ্রাহক পণ্য গ্রহণে অসম্মতি প্রকাশ করেছেন</option>
                        <option value="নগদ টাকার অভাব (Cash Shortage)">গ্রাহকের কাছে নগদ টাকা নেই</option>
                        <option value="প্যাকেজ ক্ষতিগ্রস্ত (Damaged Parcel)">ট্রানজিটে পার্সেল ক্ষতিগ্রস্ত</option>
                        <option value="পুনঃনির্ধারিত ডেলিভারি (Rescheduled)">গ্রাহক পরবর্তী সময়ে ডেলিভারি চেয়েছেন</option>
                      </select>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveFailureOrderId(null)}
                          className="px-3 py-1 text-slate-600 bg-white border border-slate-200 rounded text-xs"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportFailure(order.id)}
                          className="px-3 py-1 text-white bg-rose-600 hover:bg-rose-700 rounded text-xs font-semibold"
                        >
                          ব্যর্থ হিসেবে চিহ্নিত করুন
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rider OTP Input Form */}
                  <form
                    onSubmit={(e) => handleOtpVerifySubmit(order.id, e)}
                    className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-2"
                  >
                    <KeyRound className="w-5 h-5 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={otpVal}
                      onChange={(e) => setOtpInputMap((prev) => ({ ...prev, [order.id]: e.target.value }))}
                      placeholder="গ্রাহকের ৪-ডিজিট ওটিপি (e.g. 8842)"
                      maxLength={6}
                      required
                      className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-center text-neutral-900 dark:text-white"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 shadow-xs"
                    >
                      ওটিপি ভেরিফাই ও ডেলিভারি সম্পন্ন
                    </button>
                  </form>

                  {vMsg && (
                    <p
                      className={`text-[11px] font-bold ${
                        vMsg.success ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {vMsg.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COD Cash Settlement Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
            <DollarSign className="w-5 h-5" />
            <h3>ক্যাশ অন ডেলিভারি (COD) ডিলার সেটেলমেন্ট</h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">আদায়কৃত নগদ অর্থ ডিলার পয়েন্টে জমা দিন</span>
        </div>

        {completedDeliveries.filter((o) => o.codCollected && !o.codSettled).length === 0 ? (
          <div className="p-6 text-center text-neutral-400 text-xs">
            বর্তমানে কোনো আনসেটেল্ড সিওডি ক্যাশ বকেয়া নেই। সমস্ত আদায়কৃত অর্থ ডিলারে জমা হয়েছে।
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {completedDeliveries
              .filter((o) => o.codCollected && !o.codSettled)
              .map((order) => (
                <div key={order.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">অর্ডার #{order.id}</span>
                    <span className="text-neutral-500 ml-2">গ্রাহক: {order.customerName}</span>
                    <div className="text-[11px] text-emerald-600 font-bold">
                      আদায়কৃত সিওডি: ৳{(order.grandTotal ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSettleCod(order.id, order.grandTotal || 0)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ডিলার পয়েন্টে ক্যাশ জমা দিন
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Vehicle & Zone Info */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-base">
            <Navigation className="w-5 h-5" />
            <h3>{t('vehicleInfo')} & {t('assignedUnionArea')}</h3>
          </div>
          <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4" /> ড্রাইভিং লাইসেন্স ও NID যাচাইকৃত
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <div className="space-y-1">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400">যানবাহনের ধরন:</span>
              <p className="font-bold text-neutral-900 dark:text-white">{vehicleType}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400">ড্রাইভিং লাইসেন্স নম্বর:</span>
              <p className="font-bold text-neutral-900 dark:text-white font-mono">{licenseNumber}</p>
            </div>
          </div>

          <div className="space-y-3 p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700">
            <div className="space-y-1">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400">নির্ধারিত উপজেলা জোন:</span>
              <p className="font-bold text-neutral-900 dark:text-white">{assignedUpazila}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-neutral-500 dark:text-neutral-400">নির্ধারিত ইউনিয়ন / কভারেজ এরিয়া:</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{assignedUnion}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
