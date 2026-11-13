/**
 * Zone-Based Order Fulfillment & Rider Reassignment Board
 * Project: Apon Bazar
 * 
 * CORE RULES ENFORCED:
 * 1. 1 Upazila/Thana = 1 Delivery Zone (504 Zones).
 * 2. Operation Officer is authorized for their assigned Zone/Operation Office.
 * 3. Shows Dealer Zone, Customer Zone, Delivery Type (WITHIN_ZONE vs ZONE_TO_ZONE).
 * 4. Displays full Reassignment History & Order Timeline.
 * 5. Instant manual / auto rider reassignment with reason audit trail.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import {
  getAllDeliveryZones,
  getZoneByUpazila,
  getZoneById,
  DeliveryZone,
  normalizeGeoText
} from '../../services/DeliveryZoneService';
import {
  getOperationOfficeByZoneId,
  isUserAuthorizedForZone,
  getAllOperationOffices,
  OperationOffice
} from '../../services/OperationOfficeService';
import { Order, OrderStatus, ReassignmentReason, ReassignmentHistoryItem } from '../../types';
import {
  Building2,
  MapPin,
  Truck,
  Compass,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  Phone,
  Store,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  RefreshCw,
  Send,
  Bike
} from 'lucide-react';

export const ZoneOrderFulfillmentBoard: React.FC = () => {
  const { currentUser, users } = useAuth();
  const {
    orders,
    updateOrderStatus,
    reassignOrderRider,
    autoReassignOrderRider
  } = useECommerce();

  const allZones = useMemo(() => getAllDeliveryZones(), []);
  const allOffices = useMemo(() => getAllOperationOffices(), []);

  // Determine officer's primary assigned zone
  const defaultOfficerZone = useMemo(() => {
    const userUpz = currentUser?.mandatoryAddress?.upazila;
    const userDist = currentUser?.mandatoryAddress?.district;
    const userDiv = currentUser?.mandatoryAddress?.division;
    if (userUpz) {
      return getZoneByUpazila(userUpz, userDist, userDiv);
    }
    // Check if officer is assigned in an operation office
    const office = allOffices.find((o) => o.officer_user_id === currentUser?.id);
    if (office) {
      return getZoneById(office.zone_id) || allZones[0];
    }
    return allZones[0]; // fallback
  }, [currentUser, allZones, allOffices]);

  // Is user a global admin (can view/switch any zone)
  const isGlobalAdmin =
    currentUser?.primaryRole === 'super_admin' ||
    currentUser?.primaryRole === 'admin' ||
    (currentUser?.roles && (currentUser.roles.includes('super_admin') || currentUser.roles.includes('admin')));

  // Selected Zone ID state
  const [selectedZoneId, setSelectedZoneId] = useState<string>(() => defaultOfficerZone.zone_id);

  // Active zone record
  const currentZone = useMemo(() => {
    return getZoneById(selectedZoneId) || defaultOfficerZone;
  }, [selectedZoneId, defaultOfficerZone]);

  // Associated Operation Office
  const currentOffice = useMemo(() => {
    return getOperationOfficeByZoneId(currentZone.zone_id);
  }, [currentZone]);

  // Authorization check
  const isAuthorized = useMemo(() => {
    return isUserAuthorizedForZone(currentUser, currentZone.zone_id);
  }, [currentUser, currentZone]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'WITHIN_ZONE' | 'ZONE_TO_ZONE'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeReassignOrder, setActiveReassignOrder] = useState<Order | null>(null);
  const [selectedNewRiderId, setSelectedNewRiderId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState<ReassignmentReason>('officer_manual_reassign');
  const [reassignCustomNotes, setReassignCustomNotes] = useState('');

  const [activeTimelineOrder, setActiveTimelineOrder] = useState<Order | null>(null);

  // Filter orders strictly belonging to this authorized zone:
  // An order belongs to this zone if Dealer Zone === currentZone OR Customer Zone === currentZone OR Shipping Upazila === currentZone.upazila_name
  const zoneOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDealerZoneId = order.zoneSnapshot?.dealerZone?.zone_id;
      const orderCustZoneId = order.zoneSnapshot?.customerZone?.zone_id;
      const orderUpazila = normalizeGeoText(order.shippingAddress?.upazila);
      const zoneUpazila = normalizeGeoText(currentZone.upazila_name);

      const matchesDealerZone = orderDealerZoneId === currentZone.zone_id;
      const matchesCustomerZone = orderCustZoneId === currentZone.zone_id;
      const matchesUpazila = orderUpazila && zoneUpazila && orderUpazila === zoneUpazila;

      // Global admin can see everything or filter by zone
      if (!isGlobalAdmin && !isAuthorized) {
        return false;
      }

      const isInZone = matchesDealerZone || matchesCustomerZone || matchesUpazila;
      if (!isInZone) return false;

      // Status Filter
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }

      // Delivery Type Filter
      if (deliveryTypeFilter !== 'all') {
        const dType = order.zoneSnapshot?.deliveryType || (orderDealerZoneId === orderCustZoneId ? 'WITHIN_ZONE' : 'ZONE_TO_ZONE');
        if (dType !== deliveryTypeFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesCustomer = order.customerName.toLowerCase().includes(q) || order.customerPhone.includes(q);
        const matchesDealer = (order.assignedDealerName || '').toLowerCase().includes(q) || (order.assignedDealerShopName || '').toLowerCase().includes(q);
        const matchesRider = (order.assignedDeliveryRiderName || '').toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesDealer && !matchesRider) return false;
      }

      return true;
    });
  }, [orders, currentZone, isGlobalAdmin, isAuthorized, statusFilter, deliveryTypeFilter, searchQuery]);

  // Zone Metrics
  const zoneStats = useMemo(() => {
    const total = zoneOrders.length;
    const readyForPickup = zoneOrders.filter((o) => o.orderStatus === 'product_ready' || o.orderStatus === 'dealer_assigned').length;
    const inTransit = zoneOrders.filter((o) => o.orderStatus === 'picked_up' || o.orderStatus === 'out_for_delivery').length;
    const delivered = zoneOrders.filter((o) => o.orderStatus === 'delivered' || o.orderStatus === 'completed').length;
    const withinZoneCount = zoneOrders.filter((o) => o.zoneSnapshot?.deliveryType === 'WITHIN_ZONE').length;
    const zoneToZoneCount = zoneOrders.filter((o) => o.zoneSnapshot?.deliveryType === 'ZONE_TO_ZONE').length;

    return {
      total,
      readyForPickup,
      inTransit,
      delivered,
      withinZoneCount,
      zoneToZoneCount
    };
  }, [zoneOrders]);

  // Active Riders in this Zone
  const zoneRiders = useMemo(() => {
    return (users || []).filter((u) => {
      const isRider =
        u.accountStatus === 'active' &&
        (u.primaryRole === 'delivery_rider' ||
          u.primaryRole === 'delivery_man' ||
          (u.roles && (u.roles.includes('delivery_rider') || u.roles.includes('delivery_man'))));
      if (!isRider) return false;

      // Rider in same upazila or district
      const riderUpz = normalizeGeoText(u.mandatoryAddress?.upazila);
      const zoneUpz = normalizeGeoText(currentZone.upazila_name);
      return riderUpz === zoneUpz || Boolean(u.mandatoryAddress?.district && normalizeGeoText(u.mandatoryAddress.district) === normalizeGeoText(currentZone.district_name));
    });
  }, [users, currentZone]);

  const handleOpenReassignModal = (order: Order) => {
    setActiveReassignOrder(order);
    setSelectedNewRiderId('');
    setReassignReason('officer_manual_reassign');
    setReassignCustomNotes('');
  };

  const handleExecuteReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReassignOrder) return;

    reassignOrderRider(
      activeReassignOrder.id,
      selectedNewRiderId || undefined,
      reassignReason,
      reassignCustomNotes || undefined
    );

    setActiveReassignOrder(null);
  };

  const handleAutoReassign1Click = (orderId: string) => {
    autoReassignOrderRider(orderId, 'officer_manual_reassign');
  };

  return (
    <div className="space-y-6">
      {/* 1. Zone & Operation Office Identity Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
          <Compass className="w-56 h-56 text-white" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                  <Building2 className="w-6 h-6" />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    দায়িত্বপ্রাপ্ত জোন অপারেশন অফিস (Zone Operation Office)
                  </span>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <span>{currentOffice?.office_name || `${currentZone.upazila_name} জোন অপারেশন অফিস`}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                      ID: {currentZone.zone_id}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90 pt-1">
                <span>উপজেলা: <strong>{currentZone.upazila_name}</strong></span>
                <span>•</span>
                <span>জেলা: <strong>{currentZone.district_name}</strong></span>
                <span>•</span>
                <span>বিভাগ: <strong>{currentZone.division_name}</strong></span>
                <span>•</span>
                <span>পয়েন্ট: <strong>{currentZone.zone_point_name}</strong></span>
                <span>•</span>
                <span>হেল্পলাইন: <strong>{currentOffice?.mobile || '01312480175'}</strong></span>
              </div>
            </div>

            {/* Zone Selector for Super Admin or Multi-Zone Officers */}
            {isGlobalAdmin && (
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-xs shrink-0 max-w-xs space-y-1.5">
                <span className="text-emerald-300 font-bold block">সুপার এডমিন: জোন পরিবর্তন করুন</span>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl p-2 font-bold text-white text-xs"
                >
                  {allZones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.upazila_name} জোন ({z.district_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Notice Badge */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>নির্ধারিত অফিসার:</strong> {currentOffice?.officer_name || currentUser?.fullName || 'অপারেশন অফিসার'} | এই জোনের আওতাধীন অর্ডার ও রাইডার অ্যাসাইনমেন্ট দায়িত্বপ্রাপ্ত
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-200">
              ১ উপজেলা = ১ ডেলিভারি জোন
            </span>
          </div>
        </div>
      </div>

      {/* 2. Zone KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-neutral-500 block font-semibold">জোনে মোট অর্ডার</span>
          <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">{zoneStats.total}</p>
          <span className="text-[10px] text-neutral-400">এই জোনের অ্যাক্টিভ</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-amber-600 block font-semibold">পণ্য পিকআপ প্রস্তুতি</span>
          <p className="text-2xl font-black text-amber-600 font-mono">{zoneStats.readyForPickup}</p>
          <span className="text-[10px] text-neutral-400">ডিলার পয়েন্টে অপেক্ষমাণ</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-sky-600 block font-semibold">রাইডার ইন-ট্রানজিট</span>
          <p className="text-2xl font-black text-sky-600 font-mono">{zoneStats.inTransit}</p>
          <span className="text-[10px] text-neutral-400">ডেলিভারির পথে</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-emerald-600 block font-semibold">সফল ডেলিভারি</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">{zoneStats.delivered}</p>
          <span className="text-[10px] text-neutral-400">OTP দ্বারা সম্পন্ন</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-emerald-700 block font-semibold">একই জোন ডেলিভারি</span>
          <p className="text-2xl font-black text-emerald-700 font-mono">{zoneStats.withinZoneCount}</p>
          <span className="text-[10px] text-neutral-400">Within Zone (লোকাল)</span>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-1 shadow-xs">
          <span className="text-indigo-600 block font-semibold">জোন-টু-জোন</span>
          <p className="text-2xl font-black text-indigo-600 font-mono">{zoneStats.zoneToZoneCount}</p>
          <span className="text-[10px] text-neutral-400">Zone to Zone</span>
        </div>
      </div>

      {/* 3. Zone Orders Management Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
              <Package className="w-5 h-5" />
              <h3>জোন অর্ডার ফুলফিলমেন্ট ও রাইডার পরিচালনা ড্যাশবোর্ড</h3>
            </div>
            <p className="text-neutral-500 text-xs mt-0.5">
              জোনের আওতাধীন ডিলার আউটলেট, গ্রাহক ডেলিভারি ও রাইডার রি-অ্যাসাইনমেন্ট পোর্টাল
            </p>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
            ফিল্টারকৃত অর্ডার: {zoneOrders.length} টি
          </span>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="অর্ডার আইডি, গ্রাহক, ডিলার বা রাইডারের নাম..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
            >
              <option value="all">-- সকল স্ট্যাটাস ({zoneOrders.length}) --</option>
              <option value="placed">অর্ডার প্লেসড (Placed)</option>
              <option value="op_assigned">অপারেশন পার্টনার কনফার্মড</option>
              <option value="dealer_assigned">ডিলার অ্যাসাইনড</option>
              <option value="product_ready">পণ্য প্রস্তুত (Product Ready)</option>
              <option value="delivery_assigned">রাইডার অ্যাসাইনড (Delivery Assigned)</option>
              <option value="picked_up">ডিলার থেকে পিকআপ সম্পন্ন</option>
              <option value="out_for_delivery">ডেলিভারির পথে (Out for Delivery)</option>
              <option value="delivered">ডেলিভারি সম্পন্ন (Delivered)</option>
            </select>
          </div>

          <div>
            <select
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value as any)}
              className="w-full py-2 px-3 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold"
            >
              <option value="all">-- ডেলিভারি ধরন: সকল --</option>
              <option value="WITHIN_ZONE">একই জোন (Within Zone)</option>
              <option value="ZONE_TO_ZONE">জোন টু জোন (Zone to Zone)</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="p-3">অর্ডার ও ইনভয়েস</th>
                <th className="p-3">গ্রাহক ও গন্তব্য জোন</th>
                <th className="p-3">ডিলার আউটলেট ও পিকআপ</th>
                <th className="p-3">ডেলিভারি ধরন</th>
                <th className="p-3">দূরত্ব ও ফি</th>
                <th className="p-3">দায়িত্বপ্রাপ্ত রাইডার</th>
                <th className="p-3">বর্তমান স্ট্যাটাস</th>
                <th className="p-3 text-center">একশন ও রি-অ্যাসাইন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {zoneOrders.map((order) => {
                const isWithinZone = order.zoneSnapshot?.deliveryType === 'WITHIN_ZONE';
                const dZone = order.zoneSnapshot?.dealerZone;
                const cZone = order.zoneSnapshot?.customerZone;
                const reassignCount = (order.reassignmentHistory || []).length;

                return (
                  <tr key={order.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition">
                    {/* Order ID */}
                    <td className="p-3">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white block">
                        {order.id}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {order.createdAt?.slice(0, 16)}
                      </span>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                        ৳{order.grandTotal.toLocaleString()} ({order.paymentMethod?.toUpperCase()})
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-3">
                      <span className="font-bold text-neutral-900 dark:text-white block">
                        {order.customerName}
                      </span>
                      <a href={`tel:${order.customerPhone}`} className="text-[11px] text-sky-600 font-mono block">
                        {order.customerPhone}
                      </a>
                      <span className="text-[10px] text-neutral-500 block truncate max-w-[180px]">
                        জোন: {cZone?.zone_name_bn || order.shippingAddress?.upazila} ({order.shippingAddress?.district})
                      </span>
                    </td>

                    {/* Dealer */}
                    <td className="p-3">
                      <span className="font-bold text-neutral-900 dark:text-white block truncate max-w-[180px]">
                        {order.assignedDealerShopName || dZone?.dealerShopName || 'ডিলার আউটলেট'}
                      </span>
                      <span className="text-[10px] text-neutral-500 block truncate max-w-[180px]">
                        জোন: {dZone?.zone_name_bn || 'ডিলার জোন'}
                      </span>
                      <span className="text-[10px] text-amber-600 block truncate max-w-[180px]">
                        {dZone?.dealerAddress || order.shippingAddress?.area}
                      </span>
                    </td>

                    {/* Delivery Type Badge */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          isWithinZone
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300'
                        }`}
                      >
                        {isWithinZone ? 'একই জোন (Within Zone)' : 'জোন টু জোন (Zone to Zone)'}
                      </span>
                    </td>

                    {/* Distance & Cost */}
                    <td className="p-3 font-mono">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        ৳{order.shippingCharge}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        {order.deliverySnapshot?.distanceKm ? `${order.deliverySnapshot.distanceKm} km` : '২.৫ km'}
                      </div>
                    </td>

                    {/* Assigned Rider */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="font-bold text-neutral-900 dark:text-white">
                          {order.assignedDeliveryRiderName || 'রাইডার পাওয়া যায়নি'}
                        </span>
                      </div>
                      {order.assignedDeliveryRiderPhone && (
                        <span className="text-[10px] font-mono text-neutral-500 block">
                          {order.assignedDeliveryRiderPhone}
                        </span>
                      )}
                      {reassignCount > 0 && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold text-[9px]">
                          {reassignCount} বার রি-অ্যাসাইনকৃত
                        </span>
                      )}
                    </td>

                    {/* Current Status */}
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 font-bold text-[10px] text-neutral-800 dark:text-neutral-200 uppercase block text-center">
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                      {order.riderAcceptanceStatus && (
                        <span
                          className={`text-[9px] font-bold block text-center mt-0.5 ${
                            order.riderAcceptanceStatus === 'accepted'
                              ? 'text-emerald-600'
                              : order.riderAcceptanceStatus === 'rejected'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          রাইডার: {order.riderAcceptanceStatus.toUpperCase()}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col gap-1 items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReassignModal(order)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>রাইডার রি-অ্যাসাইন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTimelineOrder(order)}
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                        >
                          <Clock className="w-3 h-3" />
                          <span>হিস্ট্রি ও টাইমলাইন</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {zoneOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-400 text-xs">
                    এই জোনে বর্তমানে কোনো সক্রিয় অর্ডার নেই।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Zone Registered Delivery Riders List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-sky-600 font-bold text-base">
            <Truck className="w-5 h-5" />
            <h3>জোনের নিবন্ধিত সক্রিয় ডেলিভারি রাইডার নেটওয়ার্ক ({zoneRiders.length} জন)</h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">উপজেলা/থানা জোন অনুযায়ী প্রস্তুত</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {zoneRiders.map((rider) => {
            const activeTasks = orders.filter(
              (o) =>
                o.assignedDeliveryRiderId === rider.id &&
                o.orderStatus !== 'delivered' &&
                o.orderStatus !== 'cancelled'
            ).length;

            return (
              <div
                key={rider.id}
                className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {rider.fullName || rider.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                    সক্রিয়
                  </span>
                </div>

                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 space-y-0.5">
                  <div>মোবাইল: <strong className="font-mono text-neutral-900 dark:text-white">{rider.mobileNumber}</strong></div>
                  <div>যানবাহন: <strong>{rider.vehicleType || 'মোটরসাইকেল'}</strong></div>
                  <div>হাতে থাকা ডেলিভারি টাস্ক: <strong className="text-indigo-600 font-mono">{activeTasks} টি</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Reassign Rider Modal */}
      {activeReassignOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <RotateCcw className="w-5 h-5" />
                <h3>রাইডার পরিবর্তন ও রি-অ্যাসাইন (Order #{activeReassignOrder.id})</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReassignOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Order Summary */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
              <div>গ্রাহক: <strong>{activeReassignOrder.customerName}</strong> ({activeReassignOrder.shippingAddress?.area})</div>
              <div>বর্তমান রাইডার: <strong>{activeReassignOrder.assignedDeliveryRiderName || 'নির্ধারিত হয়নি'}</strong></div>
              <div>ডেলিভারি ধরন: <strong>{activeReassignOrder.zoneSnapshot?.deliveryTypeBn || 'Within Zone'}</strong></div>
            </div>

            <form onSubmit={handleExecuteReassignment} className="space-y-4">
              {/* Select new rider */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  নতুন রাইডার নির্বাচন করুন:
                </label>
                <select
                  value={selectedNewRiderId}
                  onChange={(e) => setSelectedNewRiderId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium text-slate-900"
                >
                  <option value="">-- স্বয়ংক্রিয়ভাবে পরবর্তী নিকটতম রাইডারকে নির্বাচন করুন --</option>
                  {zoneRiders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName || r.name} ({r.mobileNumber}) [{r.vehicleType || 'বাইক'}]
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">
                  খালি রাখলে অ্যালগরিদম স্বয়ংক্রিয়ভাবে নিকটতম মুক্ত রাইডারকে বাছাই করবে।
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">রি-অ্যাসাইনের কারণ:</label>
                <select
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value as ReassignmentReason)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-semibold"
                >
                  <option value="officer_manual_reassign">অপারেশন অফিসার কর্তৃক পরিবর্তন (Officer Reassignment)</option>
                  <option value="rider_rejected">রাইডার দায়িত্ব গ্রহণে অসম্মতি জানিয়েছেন (Rider Rejected)</option>
                  <option value="timeout">রাইডার নির্ধারিত সময়ে রেসপন্স করেননি (Timeout)</option>
                  <option value="rider_offline">রাইডার বর্তমানে অফলাইন বা অনুপলব্ধ</option>
                  <option value="capacity_exceeded">রাইডারের ডেলিভারি ধারণক্ষমতা অতিক্রম করেছে</option>
                  <option value="vehicle_issue">যানবাহন বা রুট ত্রুটি</option>
                  <option value="emergency_reassign">জরুরি রি-অ্যাসাইনমেন্ট</option>
                </select>
              </div>

              {/* Custom Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">মন্তব্য ও অডিট নোট (ঐচ্ছিক):</label>
                <input
                  type="text"
                  placeholder="যেমন: রাইডার ফোন ধরছেন না, তাই নতুন রাইডারকে দেওয়া হলো"
                  value={reassignCustomNotes}
                  onChange={(e) => setReassignCustomNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white text-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setActiveReassignOrder(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>রাইডার রি-অ্যাসাইন নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Order Timeline & History Modal */}
      {activeTimelineOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                <Clock className="w-5 h-5" />
                <h3>অর্ডার লাইফসাইকেল ও রি-অ্যাসাইনমেন্ট হিস্ট্রি (#{activeTimelineOrder.id})</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTimelineOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reassignment Audit Logs */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-indigo-600" />
                রাইডার রি-অ্যাসাইনমেন্ট লগ (Reassignment History):
              </h4>

              {(!activeTimelineOrder.reassignmentHistory || activeTimelineOrder.reassignmentHistory.length === 0) ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                  এই অর্ডারে এখনো কোনো রাইডার রি-অ্যাসাইনমেন্ট ঘটেনি।
                </div>
              ) : (
                <div className="space-y-2">
                  {activeTimelineOrder.reassignmentHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between text-indigo-900 font-bold">
                        <span>ধাপ #{idx + 1}: {item.reasonBn || item.reason}</span>
                        <span className="font-mono text-[10px] text-slate-500">{item.timestamp}</span>
                      </div>
                      <div className="text-slate-700">
                        পূর্ববর্তী: <strong>{item.previousRiderName || 'কোনো রাইডার নয়'}</strong> ➔ নতুন: <strong>{item.newRiderName || 'রাইডার পাওয়া যায়নি'}</strong>
                      </div>
                      <div className="text-slate-500 italic">
                        নোট: "{item.notes || 'রি-অ্যাসাইন সম্পন্ন'}" (কর্তৃক: {item.reassignedByRole})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Progression History */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                অর্ডার স্ট্যাটাস অগ্রগতি ইতিহাস (Status History):
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {(activeTimelineOrder.statusHistory || []).map((sh, idx) => (
                  <div key={idx} className="p-2.5 bg-white text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold uppercase text-slate-900 mr-2">{sh.status}</span>
                      <span className="text-slate-600">{sh.notes}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">{sh.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
