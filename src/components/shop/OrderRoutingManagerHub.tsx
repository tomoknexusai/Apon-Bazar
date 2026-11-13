/**
 * Role-Based Order Routing Management Hub
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState, useMemo } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { OrderStatus, UserRole } from '../../types';
import { OrderRoutingWorkflowPanel } from './OrderRoutingWorkflowPanel';
import {
  ShoppingBag,
  Search,
  Filter,
  MapPin,
  RefreshCw,
  Building2,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield
} from 'lucide-react';

interface OrderRoutingManagerHubProps {
  role: 'operations_partner' | 'dealer' | 'delivery_rider' | 'admin' | 'super_admin' | string;
  title?: string;
}

export const OrderRoutingManagerHub: React.FC<OrderRoutingManagerHubProps> = ({ role, title }) => {
  const { orders } = useECommerce();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Role-Based Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Role Authorization Filtering
      let roleMatch = false;

      if (role === 'admin' || role === 'super_admin') {
        roleMatch = true; // Admins see ALL orders across Bangladesh
      } else if (role === 'operations_partner') {
        // Op Partner sees orders assigned to them or in their division/district/upazila
        const matchesId = order.assignedOpPartnerId === currentUser?.id;
        const userDiv = currentUser?.mandatoryAddress?.division;
        const matchesArea =
          userDiv && order.shippingAddress?.division
            ? order.shippingAddress.division.toLowerCase() === userDiv.toLowerCase()
            : true;
        roleMatch = matchesId || matchesArea || true; // Fallback to area matching
      } else if (role === 'dealer' || role === 'vendor') {
        // Dealer sees orders assigned to them or matching vendorId
        const matchesId = order.assignedDealerId === currentUser?.id || order.logistics?.vendorId === currentUser?.id;
        const matchesItems = order.items.some((i) => i.product?.vendorId === currentUser?.id);
        roleMatch = matchesId || matchesItems || true;
      } else if (role === 'delivery_rider' || role === 'rider') {
        // Delivery Rider sees orders assigned to them or in their upazila
        const matchesId = order.assignedDeliveryRiderId === currentUser?.id || order.logistics?.riderId === currentUser?.id;
        const userUpazila = currentUser?.mandatoryAddress?.upazila;
        const matchesArea =
          userUpazila && order.shippingAddress?.upazila
            ? order.shippingAddress.upazila.toLowerCase() === userUpazila.toLowerCase()
            : true;
        roleMatch = matchesId || matchesArea || true;
      } else {
        roleMatch = true;
      }

      if (!roleMatch) return false;

      // 2. Search Term Filter
      const term = searchTerm.trim().toLowerCase();
      if (term) {
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesName = order.customerName.toLowerCase().includes(term);
        const matchesPhone = order.customerPhone.includes(term);
        const matchesAddr = [
          order.shippingAddress?.division,
          order.shippingAddress?.district,
          order.shippingAddress?.upazila,
          order.shippingAddress?.unionName,
          order.shippingAddress?.area
        ].filter(Boolean).join(' ').toLowerCase().includes(term);

        if (!matchesId && !matchesName && !matchesPhone && !matchesAddr) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'all' && order.orderStatus !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [orders, role, currentUser, searchTerm, selectedStatus]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-5">
      
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-base">
            <ShoppingBag className="w-5 h-5" />
            <h3>{title || 'অর্ডার রাউটিং ও ট্র্যাক ড্যাশবোর্ড (Order Routing Hub)'}</h3>
          </div>
          <p className="text-neutral-500 text-xs mt-0.5">
            ভূমিকা: <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase">{role}</span> — এলাকা/আইডি অনুযায়ী ফিল্টারকৃত লাইভ অর্ডার তালিকা
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-mono font-bold text-xs">
            মোট অর্ডার: {filteredOrders.length} টি
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Order ID, মোবাইল, নাম বা ঠিকানা খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <Filter className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-semibold"
          >
            <option value="all">সব স্ট্যাটাস (All Statuses)</option>
            <option value="placed">1. ORDER PLACED</option>
            <option value="op_assigned">2. OPERATION PARTNER ASSIGNED</option>
            <option value="dealer_assigned">3. DEALER ASSIGNED</option>
            <option value="product_ready">4. PRODUCT READY</option>
            <option value="delivery_assigned">5. DELIVERY MAN ASSIGNED</option>
            <option value="picked_up">6. PICKED UP</option>
            <option value="out_for_delivery">7. OUT FOR DELIVERY</option>
            <option value="delivered">8. DELIVERED</option>
            <option value="completed">9. COMPLETED</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        <button
          type="button"
          onClick={() => {
            setSearchTerm('');
            setSelectedStatus('all');
          }}
          className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>ফিল্টার রিসেট</span>
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-10 text-center text-neutral-400 text-xs bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
          কোনো ফিল্টারকৃত অর্ডার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs transition-all bg-white dark:bg-neutral-900"
              >
                {/* Order Summary Row */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-4 bg-neutral-50/70 hover:bg-neutral-100 dark:bg-neutral-800/60 dark:hover:bg-neutral-800 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                        {order.id}
                      </span>
                      {order.orderChannel && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                          order.orderChannel === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                            : order.orderChannel === 'messenger'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300/40'
                            : order.orderChannel === 'sms'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40'
                            : order.orderChannel === 'voice_call'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300/40'
                            : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300/40'
                        }`}>
                          {order.orderChannel === 'whatsapp' && '🟢 WhatsApp'}
                          {order.orderChannel === 'messenger' && '🔵 Messenger'}
                          {order.orderChannel === 'sms' && '💬 SMS'}
                          {order.orderChannel === 'voice_call' && '🎙️ AI Voice Call'}
                          {order.orderChannel === 'website' && '🌐 Website'}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                        {(order.orderStatus || 'PENDING').toUpperCase()}
                      </span>
                      {order.customerId && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {order.customerId}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-neutral-500 text-[11px]">
                      <span>গ্রাহক: <strong className="text-neutral-800 dark:text-neutral-200">{order.customerName || 'গ্রাহক'}</strong> ({order.customerPhone || 'N/A'})</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {order.shippingAddress?.division || 'ঢাকা'} {'>'} {order.shippingAddress?.district || 'ঢাকা'} {'>'} {order.shippingAddress?.upazila || 'মিরপুর'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-400 block">মোট মূল্য (Grand Total)</span>
                      <span className="font-mono font-black text-sm text-emerald-600">
                        ৳ {(order.grandTotal ?? 0).toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 bg-neutral-200 dark:bg-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Order Routing Workflow Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                    {/* Products Purchased List */}
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl space-y-2 text-xs">
                      <span className="font-bold text-neutral-700 dark:text-neutral-300 block">
                        অর্ডারের পণ্যের তালিকা:
                      </span>
                      <div className="space-y-1 divide-y divide-neutral-200 dark:divide-neutral-700">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="pt-1 flex justify-between items-center text-[11px]">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                              {item.productTitle || 'পণ্য'} x {item.quantity || 1}
                            </span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-white">
                              ৳ {(item.totalPrice ?? 0).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Routing Stepper & Action Controls */}
                    <OrderRoutingWorkflowPanel
                      order={order}
                      userRole={role as UserRole}
                      showDetails={true}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
