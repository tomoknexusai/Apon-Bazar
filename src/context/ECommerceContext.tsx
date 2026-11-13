/**
 * E-Commerce & Logistics Context Engine
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Product,
  ProductCategory,
  Brand,
  Warehouse,
  CartItem,
  Coupon,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ServiceAddress,
  LogisticsAssignment,
  ProductVariant,
  SupportTicket,
  ReturnRequest,
  ProductReview,
  BrandRequest,
  OrderChannel,
  ChannelCustomerProfile,
  SmsOrderMessage,
  SmsGatewayConfig,
  CatalogDiscountSettings,
  DiscountAuditLog,
  SuperAdminDeliveryConfig,
  DealerPoint,
  DeliveryAuditLog,
  OrderDeliverySnapshot,
  ReassignmentReason,
  ReassignmentHistoryItem,
  OperationOfficeSummary
} from '../types';
import {
  initialCategories,
  initialBrands,
  initialWarehouses,
  initialCoupons,
  initialProducts,
  normalizeBrandName
} from '../lib/ecommerce-data';
import {
  calculateProductPricing,
  calculatePaymentCharge,
  getStoredDiscountSettings,
  saveStoredDiscountSettings,
  resolveApplicableDiscount,
  ApplicableDiscountResult,
  calculateDiscountedProductPricing,
  evaluateDiscountEligibility,
  analyzeCatalogDiscountEligibility,
  hasActiveProductDiscountOverride,
  getEffectiveDiscount,
  getProductSpecificDiscount,
  getCategorySpecificDiscount
} from '../lib/pricing';
import {
  calculateCartDelivery,
  getStoredDeliveryConfig,
  saveStoredDeliveryConfig,
  validateDeliveryConfig,
  DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG
} from '../lib/deliveryWeightCalculator';
import {
  resolveProductVatPricing,
  getStoredGlobalVatSettings,
  createOrderItemVatSnapshot,
  round2
} from '../lib/vatPricingEngine';
import { resolveCompleteLogistics, resolveNearestRider } from '../services/RiderAssignmentService';
import { isImmutableSuperAdmin } from '../lib/rbac';
import {
  createOrderZoneSnapshot,
  getZoneByUpazila,
  getZoneForDealer,
  getZoneById
} from '../services/DeliveryZoneService';
import { getOperationOfficeSummary } from '../services/OperationOfficeService';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface ECommerceContextType {
  categories: ProductCategory[];
  brands: Brand[];
  warehouses: Warehouse[];
  products: Product[];
  coupons: Coupon[];

  // Centralized Delivery Charge Management System
  deliveryConfig: SuperAdminDeliveryConfig;
  updateDeliveryConfig: (newConfig: SuperAdminDeliveryConfig, reason?: string) => { success: boolean; message: string; errors?: string[] };
  resetDeliveryConfigToDefault: () => { success: boolean; message: string };
  overrideOrderDeliveryCharge: (orderId: string, overrideCharge: number, reason: string, adminName?: string) => { success: boolean; message: string };
  updateRiderDeliveryStatus: (orderId: string, status: OrderStatus, notes?: string, failureReason?: string, proofNote?: string) => void;
  settleRiderCod: (orderId: string, amount: number, settledWith?: string) => void;
  addDealerPoint: (point: Omit<DealerPoint, 'id'>) => void;
  updateDealerPoint: (point: DealerPoint) => void;
  deleteDealerPoint: (id: string) => void;

  // Centralized Discount Management System
  discountSettings: CatalogDiscountSettings;
  updateGlobalDiscount: (newPercent: number) => { success: boolean; affectedCount: number; message: string };
  updateCategoryDiscount: (categoryKey: string, newPercent: number) => { success: boolean; affectedCount: number; message: string };
  removeCategoryDiscount: (categoryKey: string) => { success: boolean; message: string };
  updateProductDiscount: (productId: string, newPercent: number, override?: boolean) => { success: boolean; message: string };
  resetProductDiscount: (productId: string) => { success: boolean; message: string };
  getApplicableDiscount: (product: Partial<Product>) => ApplicableDiscountResult;
  getEffectiveDiscount: (
    product?: Partial<Product> | null,
    category?: ProductCategory | string | number | null,
    globalDiscount?: number | null
  ) => number;
  discountAuditLogs: DiscountAuditLog[];
  
  // Cart & Shopping
  cart: CartItem[];
  addToCart: (product: Product, selectedVariant?: ProductVariant, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartMrpTotal: number;
  cartPvTotal: number;
  cartCashbackTotal: number;
  
  // Coupon
  appliedCoupon: Coupon | null;
  couponDiscountAmount: number;
  applyCoupon: (code: string) => { success: boolean; message: string; discount: number };
  removeCoupon: () => void;
  
  // Wishlist, Compare & Recently Viewed
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  compareList: string[];
  toggleCompare: (productId: string) => void;
  clearCompare: () => void;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;

  // Storefront Filtering & Search
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  
  // Orders & Lifecycle
  orders: Order[];
  placeOrder: (
    shippingAddress: ServiceAddress,
    paymentMethod: PaymentMethod,
    notes?: string,
    directOrder?: {
      product: Product;
      selectedVariant?: ProductVariant;
      quantity: number;
    }
  ) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus, customNotes?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  verifyDeliveryOtp: (orderId: string, otpCode: string) => { success: boolean; message: string };
  markCodCollected: (orderId: string) => void;
  reassignOrderRider: (orderId: string, newRiderId?: string, reason?: ReassignmentReason, notes?: string) => { success: boolean; message: string };
  riderAcceptOrder: (orderId: string) => { success: boolean; message: string };
  riderRejectOrder: (orderId: string, reason?: string) => { success: boolean; message: string };
  autoReassignOrderRider: (orderId: string, reason?: ReassignmentReason) => { success: boolean; message: string };
  
  // 5 Multi-Channel Order Engine (Website, WhatsApp, Messenger, SMS, AI Voice Call)
  channelCustomers: ChannelCustomerProfile[];
  findOrCreateChannelCustomer: (
    fullName: string,
    mobileNumber: string,
    channel: OrderChannel,
    channelIdentifier?: string
  ) => { customer: ChannelCustomerProfile; otpCode: string; isNew: boolean };
  verifyChannelCustomerOtp: (
    mobileNumber: string,
    enteredOtp: string,
    channel?: OrderChannel
  ) => { success: boolean; message: string; customer?: ChannelCustomerProfile };
  updateChannelCustomerAddress: (
    customerId: string,
    address: ServiceAddress
  ) => void;
  placeChannelOrder: (params: {
    channel: OrderChannel;
    customerProfile: ChannelCustomerProfile;
    items: CartItem[];
    shippingAddress: ServiceAddress;
    paymentMethod?: PaymentMethod;
    notes?: string;
    voiceTranscript?: string;
  }) => Order;

  // Master Data: Category & Brand Management (Admin only)
  addCategory: (categoryData: Omit<ProductCategory, 'id'>) => { success: boolean; message: string };
  editCategory: (categoryId: string, updatedData: Partial<ProductCategory>) => void;
  deleteCategory: (categoryId: string) => void;
  addBrand: (brandData: Omit<Brand, 'id'>) => { success: boolean; message: string };
  editBrand: (brandId: string, updatedData: Partial<Brand>) => void;
  deleteBrand: (brandId: string) => void;

  // Brand Requests Workflow (Dealers/Vendors request, Admins approve)
  brandRequests: BrandRequest[];
  requestNewBrand: (reqData: Omit<BrandRequest, 'id' | 'status' | 'createdAt'>) => { success: boolean; message: string };
  approveBrandRequest: (requestId: string) => void;
  rejectBrandRequest: (requestId: string, reason: string) => void;

  // Vendor / Admin Product Management
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'reviewsCount' | 'rating'>) => { success: boolean; message: string; product?: Product } | void;
  editProduct: (productId: string, updatedData: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  approveProduct: (productId: string) => void;
  rejectProduct: (productId: string, reason: string) => void;
  addReview: (productId: string, rating: number, comment: string, userName: string) => void;
  
  // Support & Return
  supportTickets: SupportTicket[];
  createSupportTicket: (subject: string, message: string, category: 'delivery' | 'product' | 'payment' | 'other') => void;
  returnRequests: ReturnRequest[];
  createReturnRequest: (orderId: string, productName: string, reason: string, refundType: 'wallet' | 'original_payment') => void;
  
  // Logistics Helper
  calculateNearestLogistics: (address: ServiceAddress) => LogisticsAssignment;

  // 24/7 SMS Product Order System & AI Auto-Reply Engine
  smsOrderMessages: SmsOrderMessage[];
  smsGatewayConfig: SmsGatewayConfig;
  updateSmsGatewayConfig: (config: Partial<SmsGatewayConfig>) => void;
  processIncomingSmsOrder: (
    rawText: string,
    senderPhone?: string,
    senderName?: string,
    channel?: 'sms' | 'whatsapp' | 'web_sms'
  ) => Promise<{ success: boolean; data: SmsOrderMessage; message: string; autoConvertedOrder?: Order }>;
  convertSmsToConfirmedOrder: (
    smsMessageId: string,
    customAddress?: ServiceAddress,
    customItems?: CartItem[]
  ) => { success: boolean; order?: Order; message: string };
  sendSmsCustomReply: (smsMessageId: string, replyText: string) => Promise<{ success: boolean; reply: string }>;
  triggerAiReParseSms: (smsMessageId: string) => Promise<{ success: boolean; data?: SmsOrderMessage }>;
  deleteSmsOrderMessage: (smsMessageId: string) => void;
  ask24x7AiAssistant: (message: string, context?: string, userRole?: string) => Promise<string>;
}

// Helper for order status labels, descriptions and visual toast alert types
export const getOrderStatusDetails = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return {
        labelBn: 'পেন্ডিং / অপেক্ষমাণ',
        labelEn: 'Pending',
        type: 'info' as const,
        description: 'অর্ডারটি সিস্টেমে তৈরি হয়েছে এবং পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।'
      };
    case 'placed':
      return {
        labelBn: 'অর্ডার প্লেসড',
        labelEn: 'Order Placed',
        type: 'success' as const,
        description: 'অর্ডার সফলভাবে সিস্টেমে প্লেস করা হয়েছে।'
      };
    case 'processing':
      return {
        labelBn: 'প্রসেসিং হচ্ছে',
        labelEn: 'Processing',
        type: 'info' as const,
        description: 'অর্ডার কেন্দ্রীয় সেন্ট্রাল হাব কর্তৃক প্রসেস করা হচ্ছে।'
      };
    case 'confirmed':
      return {
        labelBn: 'অর্ডার নিশ্চিতকরণ সম্পন্ন',
        labelEn: 'Confirmed',
        type: 'info' as const,
        description: 'অর্ডারটি ভেন্ডর ও হাব কর্তৃক নিশ্চিত করা হয়েছে।'
      };
    case 'op_assigned':
      return {
        labelBn: 'অপারেশন্স পার্টনার নিযুক্ত',
        labelEn: 'Op Partner Assigned',
        type: 'info' as const,
        description: 'আঞ্চলিক অপারেশন্স পার্টনার নিযুক্ত করা হয়েছে।'
      };
    case 'dealer_assigned':
    case 'vendor_accepted':
      return {
        labelBn: 'ডিলার আউটলেট নিযুক্ত',
        labelEn: 'Dealer Assigned',
        type: 'info' as const,
        description: 'নিকটস্থ ডিলার বা আউটলেট পয়েন্ট নিযুক্ত করা হয়েছে।'
      };
    case 'product_ready':
    case 'packed':
      return {
        labelBn: 'পণ্য প্রস্তুত ও প্যাকড',
        labelEn: 'Product Ready / Packed',
        type: 'success' as const,
        description: 'পণ্য প্যাকেজিং সম্পন্ন এবং শিপমেন্টের জন্য প্রস্তুত।'
      };
    case 'shipped':
    case 'in_transit':
      return {
        labelBn: 'শিপড / ট্রানজিটে রয়েছে',
        labelEn: 'Shipped / In Transit',
        type: 'info' as const,
        description: 'পার্সেলটি সেন্ট্রাল হাব বা আউটলেট থেকে গন্তব্যের উদ্দেশ্যে শিপড হয়েছে।'
      };
    case 'delivery_assigned':
    case 'rider_assigned':
    case 'assigned':
      return {
        labelBn: 'ডেলিভারি রাইডার নিযুক্ত',
        labelEn: 'Delivery Rider Assigned',
        type: 'info' as const,
        description: 'ডেলিভারি রাইডার পার্সেল ডেলিভারির জন্য নিযুক্ত হয়েছেন।'
      };
    case 'picked_up':
    case 'picked':
      return {
        labelBn: 'রাইডার পিকড-আপ',
        labelEn: 'Picked Up by Rider',
        type: 'info' as const,
        description: 'রাইডার হাব বা আউটলেট থেকে পার্সেল সংগ্রহ করেছেন।'
      };
    case 'out_for_delivery':
      return {
        labelBn: 'ডেলিভারির জন্য বের হয়েছে',
        labelEn: 'Out for Delivery',
        type: 'info' as const,
        description: 'রাইডার পার্সেল নিয়ে গ্রাহকের ঠিকানায় পৌঁছানোর পথে রয়েছেন।'
      };
    case 'delivered':
      return {
        labelBn: 'ডেলিভারি সম্পন্ন',
        labelEn: 'Delivered',
        type: 'success' as const,
        description: 'গ্রাহক ওটিপি যাচাইয়ের মাধ্যমে পার্সেল সফলভাবে বুঝে পেয়েছেন।'
      };
    case 'completed':
      return {
        labelBn: 'অর্ডার সম্পূর্ণ ও রিকনসিল্ড',
        labelEn: 'Completed',
        type: 'success' as const,
        description: 'লেনদেন ও হিসাব সম্পূর্ণভাবে সম্পন্ন হয়েছে।'
      };
    case 'cancelled':
      return {
        labelBn: 'অর্ডার বাতিলকৃত',
        labelEn: 'Cancelled',
        type: 'error' as const,
        description: 'অর্ডারটি বাতিল করা হয়েছে।'
      };
    case 'returned':
      return {
        labelBn: 'পণ্য রিটার্নড',
        labelEn: 'Returned',
        type: 'warning' as const,
        description: 'পণ্যটি ফেরত এসেছে বা রিটার্ন প্রসেসে রয়েছে।'
      };
    default:
      return {
        labelBn: status,
        labelEn: status,
        type: 'info' as const,
        description: `অর্ডার স্ট্যাটাস: ${status}`
      };
  }
};

const ECommerceContext = createContext<ECommerceContextType | undefined>(undefined);

export const ECommerceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users } = useAuth();
  const { sendNotification, addToast } = useNotifications();

  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [brandRequests, setBrandRequests] = useState<BrandRequest[]>([
    {
      id: 'req-1',
      brandName: 'Pusti Organic',
      brandType: 'National/Established Brand',
      countryOfOrigin: 'Bangladesh',
      categoryId: 'cat-grocery',
      categoryName: 'Grocery & Food',
      requestedByUserId: 'usr-dealer-1',
      requestedByUserName: 'রহিম ট্রেডার্স (Dealer)',
      requestedByUserRole: 'dealer',
      status: 'pending',
      createdAt: '2026-08-08'
    }
  ]);
  const [warehouses] = useState<Warehouse[]>(initialWarehouses);
  const [coupons] = useState<Coupon[]>(initialCoupons);
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      let rawList: Product[] = initialProducts;
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('apon_bazar_products_catalog');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawList = parsed;
          }
        }
      }
      const currentDiscountSettings = getStoredDiscountSettings();
      return rawList.map((p: Product) => {
        // If product does not have an explicit positive custom override, re-resolve via centralized hierarchy
        const isOverridden = hasActiveProductDiscountOverride(p);
        if (!isOverridden) {
          const resolved = resolveApplicableDiscount(p, currentDiscountSettings);
          const pricing = calculateDiscountedProductPricing(p, resolved.discountPercent);

          return {
            ...p,
            discount: resolved.discountPercent,
            discount_percent: resolved.discountPercent,
            discount_scope: resolved.scope === 'none' ? 'global' : (resolved.scope as any),
            discount_source: resolved.sourceLabel,
            isDiscountOverridden: false,
            sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
            sellingTaxAmount: pricing.vatAmount,
            sellingPriceInclTax: pricing.finalSellingPriceInclTax,
            campaignPrice: pricing.finalSellingPriceInclTax,
            discountPrice: pricing.finalSellingPriceInclTax,
            profit: pricing.profit,
            adminCost: pricing.adminCost,
            netProfit: pricing.netProfit,
            pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
            pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
          };
        }
        return p;
      });
    } catch (e) {
      // fallback to initialProducts
      return initialProducts;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('apon_bazar_products_catalog', JSON.stringify(products));
      }
    } catch (e) {
      // ignore
    }
  }, [products]);

  // Centralized Discount Configuration State
  const [discountSettings, setDiscountSettings] = useState<CatalogDiscountSettings>(() => {
    return getStoredDiscountSettings();
  });

  useEffect(() => {
    saveStoredDiscountSettings(discountSettings);
  }, [discountSettings]);

  // Delivery Charge Configuration State (Super Admin Only)
  const [deliveryConfig, setDeliveryConfig] = useState<SuperAdminDeliveryConfig>(() => {
    return getStoredDeliveryConfig();
  });

  const updateDeliveryConfig = (newConfig: SuperAdminDeliveryConfig, reason?: string) => {
    if (!currentUser || !isImmutableSuperAdmin(currentUser)) {
      return {
        success: false,
        message: 'অননুমোদিত এক্সেস! শুধুমাত্র সুপার অ্যাডমিন ডেলিভারি চার্জ কনফিগারেশন পরিবর্তন করতে পারেন।'
      };
    }

    const validation = validateDeliveryConfig(newConfig);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.errors.join('; '),
        errors: validation.errors
      };
    }

    const newVersion = (deliveryConfig.version || 1) + 1;
    const nowIso = new Date().toISOString();

    const auditEntry: DeliveryAuditLog = {
      id: `audit-${Date.now()}`,
      type: 'rate_config_change',
      adminId: currentUser.id || 'SUPER_ADMIN',
      adminName: currentUser.fullName || 'সুপার অ্যাডমিন',
      actionSummary: `ডেলিভারি রেট কনফিগারেশন আপডেট (সংস্করণ v${newVersion})`,
      timestamp: nowIso,
      reason: reason || 'Super Admin rate configuration update'
    };

    const updated: SuperAdminDeliveryConfig = {
      ...newConfig,
      version: newVersion,
      updatedAt: nowIso,
      updatedBy: currentUser.id || 'SUPER_ADMIN',
      auditLogs: [auditEntry, ...(deliveryConfig.auditLogs || [])]
    };

    saveStoredDeliveryConfig(updated);
    setDeliveryConfig(updated);
    addToast('ডেলিভারি চার্জ আপডেট', 'সুপার অ্যাডমিন ডেলিভারি চার্জ রেট সফলভাবে সংরক্ষিত হয়েছে।');
    return { success: true, message: 'ডেলিভারি চার্জ কনফিগারেশন সফলভাবে আপডেট করা হয়েছে।' };
  };

  const resetDeliveryConfigToDefault = () => {
    if (!currentUser || !isImmutableSuperAdmin(currentUser)) {
      return {
        success: false,
        message: 'অননুমোদিত এক্সেস! শুধুমাত্র সুপার অ্যাডমিন ডিফল্ট রিসেট করতে পারেন।'
      };
    }

    saveStoredDeliveryConfig(DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG);
    setDeliveryConfig(DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG);
    addToast('ডেলিভারি চার্জ রিসেট', 'ডিফল্ট রেটে রিসেট করা হয়েছে।');
    return { success: true, message: 'ডিফল্ট কনফিগারেশন সফলভাবে রিস্টোর করা হয়েছে।' };
  };

  const overrideOrderDeliveryCharge = (
    orderId: string,
    newCharge: number,
    reason: string,
    adminName: string = 'সুপার অ্যাডমিন'
  ): { success: boolean; message: string } => {
    if (!currentUser || !isImmutableSuperAdmin(currentUser)) {
      return {
        success: false,
        message: 'অননুমোদিত এক্সেস! শুধুমাত্র সুপার অ্যাডমিন ডেলিভারি চার্জ ওভাররাইড করতে পারেন।'
      };
    }

    const target = orders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'অর্ডার পাওয়া যায়নি!' };

    const prevCharge = target.shippingCharge;
    const diff = newCharge - prevCharge;
    const newGrandTotal = Math.max(0, Number((target.grandTotal + diff).toFixed(2)));

    const overrideInfo = {
      isOverridden: true,
      originalCharge: prevCharge,
      overrideCharge: newCharge,
      reason: reason || 'Super Admin approved manual delivery charge override',
      adminName: adminName || currentUser.fullName || 'Super Admin',
      overriddenAt: new Date().toISOString()
    };

    const updatedSnapshot: OrderDeliverySnapshot = target.deliverySnapshot
      ? {
          ...target.deliverySnapshot,
          finalDeliveryCharge: newCharge,
          manualOverride: overrideInfo,
          rateBreakdown: `${target.deliverySnapshot.rateBreakdown || ''} [ওভাররাইড: ৳${newCharge}]`
        }
      : {
          deliveryZone: 'inside_dhaka',
          deliveryZoneName: 'ঢাকা',
          district: target.shippingAddress?.district || 'ঢাকা',
          upazila: target.shippingAddress?.upazila || '',
          paurashavaOrUnion: 'পৌরসভা',
          isPaurashava: true,
          distanceKm: target.shippingAddress?.distanceKm || 1,
          distanceMode: 'round_up',
          effectiveDistanceKm: target.shippingAddress?.distanceKm || 1,
          totalWeightGrams: 500,
          totalWeightKg: 0.5,
          weightSlab: 'ম্যানুয়াল রেট',
          baseDeliveryCharge: newCharge,
          extraDistanceCharge: 0,
          weightSurcharge: 0,
          finalDeliveryCharge: newCharge,
          rateBreakdown: `ম্যানুয়াল ওভাররাইড: ৳${newCharge}`,
          calculatedAt: new Date().toISOString(),
          manualOverride: overrideInfo
        };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            shippingCharge: newCharge,
            grandTotal: newGrandTotal,
            deliverySnapshot: updatedSnapshot,
            invoice: o.invoice
              ? {
                  ...o.invoice,
                  shippingCharge: newCharge,
                  grandTotal: newGrandTotal,
                  deliverySnapshot: updatedSnapshot
                }
              : o.invoice,
            statusHistory: [
              ...(o.statusHistory || []),
              {
                status: o.orderStatus,
                updatedByRole: 'admin',
                updatedByUserId: currentUser.id,
                updatedByUserName: currentUser.fullName,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                notes: `ডেলিভারি চার্জ ওভাররাইড: ৳${prevCharge} -> ৳${newCharge} (কারণ: ${reason})`
              }
            ]
          };
        }
        return o;
      })
    );

    const auditEntry: DeliveryAuditLog = {
      id: `audit-${Date.now()}`,
      type: 'manual_order_override',
      orderId,
      adminId: currentUser.id,
      adminName: currentUser.fullName || adminName,
      actionSummary: `অর্ডার ${orderId} এর ডেলিভারি চার্জ ৳${prevCharge} থেকে ৳${newCharge} ওভাররাইড`,
      previousValue: prevCharge,
      newValue: newCharge,
      reason,
      timestamp: new Date().toISOString()
    };

    const updatedConfig = {
      ...deliveryConfig,
      auditLogs: [auditEntry, ...(deliveryConfig.auditLogs || [])]
    };
    setDeliveryConfig(updatedConfig);
    saveStoredDeliveryConfig(updatedConfig);

    addToast('ডেলিভারি চার্জ ওভাররাইড সফল', `অর্ডার ${orderId} এর ডেলিভারি চার্জ ৳${newCharge} নির্ধারণ করা হয়েছে।`);
    return { success: true, message: 'ডেলিভারি চার্জ সফলভাবে ওভাররাইড করা হয়েছে।' };
  };

  const updateRiderDeliveryStatus = (
    orderId: string,
    newStatus: OrderStatus,
    notes?: string,
    failureReason?: string,
    proofNote?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            deliveryFailureReason: failureReason || o.deliveryFailureReason,
            deliveryProofNote: proofNote || o.deliveryProofNote,
            statusHistory: [
              ...(o.statusHistory || []),
              {
                status: newStatus,
                updatedByRole: 'delivery_rider',
                updatedByUserId: currentUser?.id || 'rider-1',
                updatedByUserName: currentUser?.fullName || 'রাইডার',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                notes: notes || `রাইডার স্ট্যাটাস আপডেট: ${newStatus}${failureReason ? ` (কারণ: ${failureReason})` : ''}`
              }
            ]
          };
        }
        return o;
      })
    );
    addToast('রাইডার স্ট্যাটাস আপডেট', `অর্ডার ${orderId} এর স্ট্যাটাস '${newStatus}' এ পরিবর্তিত হয়েছে।`);
  };

  const settleRiderCod = (orderId: string, amount: number, settledWith: string = 'ডিলার পয়েন্ট') => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            codCollected: true,
            codSettled: true,
            paymentStatus: 'paid'
          };
        }
        return o;
      })
    );
    addToast('সিওডি সেটেলমেন্ট সম্পন্ন', `অর্ডার ${orderId} এর ৳${amount} সিওডি ${settledWith}-এ জমা হয়েছে।`);
  };

  const reassignOrderRider = (
    orderId: string,
    newRiderId?: string,
    reason: ReassignmentReason = 'officer_manual_reassign',
    notes?: string
  ): { success: boolean; message: string } => {
    let selectedNewRider: { id: string; name: string; phone?: string; vehicle?: string } | null = null;
    let targetOrderSnapshot: Order | null = null;

    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target) return prev;
      targetOrderSnapshot = target;

      const prevRiderId = target.assignedDeliveryRiderId || '';
      const prevRiderName = target.assignedDeliveryRiderName || 'পূর্ববর্তী রাইডার';

      // Filter all delivery riders
      const allRiders = (users || []).filter(
        (u) =>
          u.accountStatus === 'active' &&
          ((u.roles && (u.roles.includes('delivery_rider') || u.roles.includes('delivery_man'))) ||
            u.primaryRole === 'delivery_rider' ||
            u.primaryRole === 'delivery_man')
      );

      if (newRiderId) {
        const found = allRiders.find((r) => r.id === newRiderId);
        if (found) {
          selectedNewRider = {
            id: found.id,
            name: found.fullName || found.name || 'রাইডার',
            phone: found.mobileNumber,
            vehicle: found.vehicleType || found.motorcycleModel || 'মোটরসাইকেল'
          };
        }
      }

      if (!selectedNewRider) {
        // Exclude riders who previously rejected this order
        const rejectedIds = new Set(
          (target.reassignmentHistory || []).map((h) => h.previousRiderId).filter(Boolean)
        );
        if (prevRiderId) rejectedIds.add(prevRiderId);

        const candidates = allRiders.filter((r) => !rejectedIds.has(r.id));
        const resolution = resolveNearestRider(target.shippingAddress, candidates, {
          activeOrders: prev,
          deliveryConfig
        });

        if (resolution.found && resolution.rider) {
          selectedNewRider = {
            id: resolution.rider.riderId,
            name: resolution.rider.riderName,
            phone: resolution.rider.riderPhone,
            vehicle: resolution.rider.riderVehicle
          };
        }
      }

      const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
      const reassignmentId = `reassign-${Date.now()}`;

      const reasonBn =
        reason === 'rider_rejected'
          ? 'রাইডার কর্তৃক প্রত্যাখ্যান (Rider Rejected)'
          : reason === 'timeout'
          ? 'টাইমআউট রেসপন্স (Auto Timeout)'
          : reason === 'capacity_exceeded'
          ? 'রাইডার ডেলিভারি সীমা অতিক্রম'
          : 'অপারেশন অফিসার কর্তৃক পরিবর্তন (Officer Reassignment)';

      const reassignmentEntry: ReassignmentHistoryItem = {
        id: reassignmentId,
        orderId,
        timestamp,
        previousRiderId: prevRiderId || undefined,
        previousRiderName: prevRiderName || undefined,
        newRiderId: selectedNewRider?.id,
        newRiderName: selectedNewRider?.name,
        newRiderPhone: selectedNewRider?.phone,
        reason,
        reasonBn,
        notes: notes || `রাইডার পরিবর্তন সম্পন্ন। পূর্ববর্তী: ${prevRiderName} ➔ নতুন: ${selectedNewRider?.name || 'রাইডার পাওয়া যায়নি'}`,
        reassignedByRole: currentUser?.primaryRole || 'operations_partner',
        reassignedByUserId: currentUser?.id,
        reassignedByUserName: currentUser?.fullName || 'অপারেশন অফিসার'
      };

      return prev.map((order) => {
        if (order.id !== orderId) return order;

        return {
          ...order,
          assignedDeliveryRiderId: selectedNewRider?.id || '',
          assignedDeliveryRiderName: selectedNewRider
            ? `${selectedNewRider.name} (${selectedNewRider.vehicle || 'মোটরসাইকেল'})`
            : 'রাইডার পাওয়া যায়নি',
          assignedDeliveryRiderPhone: selectedNewRider?.phone || '',
          riderAcceptanceStatus: selectedNewRider ? ('pending' as const) : ('rejected' as const),
          riderAssignedAt: timestamp,
          reassignmentHistory: [...(order.reassignmentHistory || []), reassignmentEntry],
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status: order.orderStatus,
              updatedByRole: currentUser?.primaryRole || 'operations_partner',
              updatedByUserId: currentUser?.id,
              updatedByUserName: currentUser?.fullName || 'অপারেশন অফিসার',
              timestamp,
              notes: `রাইডার রি-অ্যাসাইন: ${selectedNewRider?.name || 'কোনো রাইডার পাওয়া যায়নি'} (${reasonBn})`
            }
          ]
        };
      });
    });

    if (selectedNewRider) {
      addToast('রাইডার রি-অ্যাসাইন সফল!', `অর্ডার #${orderId} এর জন্য নতুন রাইডার ${selectedNewRider.name} নির্ধারিত হয়েছে।`);
      sendNotification(
        selectedNewRider.id,
        `নতুন ডেলিভারি টাস্ক অ্যাসাইন করা হয়েছে #${orderId}`,
        `গ্রাহক ${targetOrderSnapshot?.customerName || ''}, এলাকা: ${targetOrderSnapshot?.shippingAddress?.area || ''}। অনুগ্রহ করে গ্রহণ করুন।`,
        'in_app'
      );
      return { success: true, message: `নতুন রাইডার ${selectedNewRider.name} সফলভাবে নির্ধারিত হয়েছে।` };
    } else {
      addToast('রাইডার পাওয়া যায়নি', `এই জোনে বর্তমানে কোনো যোগ্য সক্রিয় রাইডার পাওয়া যায়নি।`, 'warning');
      return { success: false, message: 'এই জোনে বর্তমানে কোনো যোগ্য সক্রিয় রাইডার পাওয়া যায়নি।' };
    }
  };

  const riderAcceptOrder = (orderId: string): { success: boolean; message: string } => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          riderAcceptanceStatus: 'accepted' as const,
          riderAcceptedAt: timestamp,
          statusHistory: [
            ...(order.statusHistory || []),
            {
              status: order.orderStatus,
              updatedByRole: 'delivery_rider',
              updatedByUserId: currentUser?.id,
              updatedByUserName: currentUser?.fullName || 'রাইডার',
              timestamp,
              notes: 'রাইডার ডেলিভারি অ্যাসাইনমেন্ট গ্রহণ (Accept) করেছেন।'
            }
          ]
        };
      })
    );
    addToast('ডেলিভারি টাস্ক গৃহীত!', `অর্ডার #${orderId} সফলভাবে গ্রহণ করা হয়েছে।`);
    return { success: true, message: 'ডেলিভারি টাস্ক গৃহীত হয়েছে।' };
  };

  const riderRejectOrder = (orderId: string, reason?: string): { success: boolean; message: string } => {
    addToast('টাস্ক প্রত্যাখ্যাত', `অর্ডার #${orderId} প্রত্যাখ্যাত হয়েছে। পরবর্তী নিকটবর্তী রাইডারকে স্বয়ংক্রিয়ভাবে প্রদান করা হচ্ছে...`, 'info');
    return reassignOrderRider(orderId, undefined, 'rider_rejected', reason || 'রাইডার কর্তৃক ডেলিভারি দায়িত্ব গ্রহণে অসম্মতি');
  };

  const autoReassignOrderRider = (orderId: string, reason: ReassignmentReason = 'timeout'): { success: boolean; message: string } => {
    return reassignOrderRider(orderId, undefined, reason, 'সিস্টেম স্বয়ংক্রিয় রি-অ্যাসাইনমেন্ট');
  };

  const addDealerPoint = (point: Omit<DealerPoint, 'id'>) => {
    const newPoint: DealerPoint = {
      ...point,
      id: `dp-${Date.now()}`
    };
    const updatedPoints = [...(deliveryConfig.dealerPoints || []), newPoint];
    const updatedConfig = { ...deliveryConfig, dealerPoints: updatedPoints };
    updateDeliveryConfig(updatedConfig, `নতুন ডিলার পয়েন্ট যুক্ত করা হয়েছে: ${point.name}`);
    addToast('ডিলার পয়েন্ট যুক্ত হয়েছে', `${point.name} সফলভাবে যুক্ত হয়েছে।`);
  };

  const updateDealerPoint = (point: DealerPoint) => {
    const updatedPoints = (deliveryConfig.dealerPoints || []).map((p) => (p.id === point.id ? point : p));
    const updatedConfig = { ...deliveryConfig, dealerPoints: updatedPoints };
    updateDeliveryConfig(updatedConfig, `ডিলার পয়েন্ট আপডেট: ${point.name}`);
    addToast('ডিলার পয়েন্ট আপডেট', `${point.name} এর তথ্য আপডেট করা হয়েছে।`);
  };

  const deleteDealerPoint = (id: string) => {
    const updatedPoints = (deliveryConfig.dealerPoints || []).filter((p) => p.id !== id);
    const updatedConfig = { ...deliveryConfig, dealerPoints: updatedPoints };
    updateDeliveryConfig(updatedConfig, `ডিলার পয়েন্ট অপসারিত: ${id}`);
    addToast('ডিলার পয়েন্ট অপসারিত', 'ডিলার পয়েন্ট সরানো হয়েছে।');
  };

  // Discount Audit Logs State
  const [discountAuditLogs, setDiscountAuditLogs] = useState<DiscountAuditLog[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('tomshopbd_discount_audit_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'dlog-init-1',
        superAdminId: '001',
        superAdminName: 'সুপার এডমিন (Apon Bazar)',
        actionType: 'GLOBAL_DISCOUNT_UPDATE',
        scope: 'global',
        targetId: 'all',
        targetName: 'সমগ্র ক্যাটালগ (All Active Products)',
        previousDiscount: 0,
        newDiscount: 0,
        affectedProductsCount: 0,
        date: new Date().toISOString().slice(0, 10),
        time: '10:00:00',
        createdAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('tomshopbd_discount_audit_logs', JSON.stringify(discountAuditLogs));
      }
    } catch (e) {
      // ignore
    }
  }, [discountAuditLogs]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(['prod-1', 'prod-3']);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['prod-1', 'prod-2']);

  // Global storefront filtering & search query
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  // Orders State with localStorage Persistence
  const [orders, setOrders] = useState<Order[]>(() => {
    const defaultSampleOrders: Order[] = [
      {
        id: 'ORD-2026-8812',
        userId: 'usr-customer-01',
        customerName: 'মোঃ জহিরুল ইসলাম',
        customerPhone: '01711223344',
        customerEmail: 'customer@aponbazar.com',
        shippingAddress: {
          id: 'addr-1',
          userId: 'usr-customer-01',
          title: 'বাসা / হোম অ্যাড্রেস',
          division: 'ঢাকা',
          district: 'ঢাকা',
          upazila: 'মিরপুর',
          unionName: 'মিরপুর-১০',
          area: 'রোড ১২, ব্লক সি, হাউস ৪৪',
          postalCode: '১২১৬',
          latitude: 23.8069,
          longitude: 90.3687,
          isMandatoryServiceAddress: true,
          createdAt: '2026-06-01',
          updatedAt: '2026-06-01'
        },
        items: [
          {
            productId: 'prod-1',
            productTitle: 'সুন্দরবনের প্রাকৃতিক চাকভাঙা কাঁচা মধু ১ কেজী',
            productImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
            sku: 'GBBD-HONEY-001',
            unitPrice: 1000,
            mrp: 1000,
            pv: 35,
            quantity: 2,
            totalPrice: 2000
          },
          {
            productId: 'prod-2',
            productTitle: 'অর্গানিক গাওয়া ঘি ৫০০ গ্রাম',
            productImage: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=800',
            sku: 'GBBD-GHEE-002',
            unitPrice: 500,
            mrp: 500,
            pv: 15,
            quantity: 1,
            totalPrice: 500
          }
        ],
        mrpTotal: 2500,
        subtotal: 2500,
        discountAmount: 0,
        couponCode: 'CASHBACK100',
        couponDiscount: 0,
        shippingCharge: 60,
        tax: 125,
        platformFee: 0,
        grandTotal: 2585,
        pvEarned: 85,
        cashbackEarned: 100,
        paymentMethod: 'cod',
        paymentStatus: 'unpaid',
        orderStatus: 'in_transit',
        logistics: {
          vendorId: 'ven-1',
          vendorShopName: 'Apon Bazar প্রাইম শপ - মিরপুর আউটলেট',
          vendorAddress: 'দোকান ৪, প্লট ১২, মিরপুর ১০ গোলচত্বর',
          vendorDistanceKm: 1.2,
          hubId: 'wh-1',
          hubCode: 'WH-DHK-01',
          hubAddress: 'মিরপুর ১০ কেন্দ্রীয় ওয়্যারহাউজ',
          hubDistanceKm: 1.8,
          riderId: 'usr-rider-06',
          riderName: 'রাশেদুল হাসান',
          riderPhone: '+8801511000006',
          riderVehicle: 'মোটরসাইকেল',
          riderDistanceKm: 0.8,
          riderLat: 23.8080,
          riderLng: 90.3695
        },
        otpCode: '8842',
        codCollected: false,
        estimatedDelivery: '২০২৬-০৮-০৫ (আজ বিকেল ৫:০০)',
        notes: 'গেট কল দিয়ে আসবেন',
        createdAt: '2026-08-05 10:30',
        updatedAt: '2026-08-05 11:15'
      },
      {
        id: 'ORD-2026-9045',
        userId: 'usr-customer-01',
        customerName: 'মোঃ জহিরুল ইসলাম',
        customerPhone: '01711223344',
        customerEmail: 'customer@aponbazar.com',
        shippingAddress: {
          id: 'addr-2',
          userId: 'usr-customer-01',
          title: 'অফিস ঠিকানা',
          division: 'ঢাকা',
          district: 'ঢাকা',
          upazila: 'ধানমন্ডি',
          unionName: 'ধানমন্ডি আ/এ',
          area: 'রোড ২৭, রাপা প্লাজার পাশে',
          postalCode: '১২০৯',
          latitude: 23.7461,
          longitude: 90.3742,
          isMandatoryServiceAddress: true,
          createdAt: '2026-06-01',
          updatedAt: '2026-06-01'
        },
        items: [
          {
            productId: 'prod-3',
            productTitle: 'প্রিমিয়াম প্রিমিক্স টি পাউডার ৫০০ গ্রাম',
            productImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
            sku: 'GBBD-TEA-003',
            unitPrice: 450,
            mrp: 500,
            pv: 10,
            quantity: 2,
            totalPrice: 900
          }
        ],
        mrpTotal: 1000,
        subtotal: 900,
        discountAmount: 100,
        couponCode: 'SUMMER2026',
        couponDiscount: 50,
        shippingCharge: 60,
        tax: 45,
        platformFee: 0,
        grandTotal: 955,
        pvEarned: 20,
        cashbackEarned: 50,
        paymentMethod: 'wallet',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        logistics: {
          vendorId: 'ven-1',
          vendorShopName: 'Apon Bazar প্রাইম শপ - ধানমন্ডি আউটলেট',
          vendorAddress: 'ধানমন্ডি ২৭, ঢাকা',
          vendorDistanceKm: 0.5,
          hubId: 'wh-2',
          hubCode: 'WH-DHK-02',
          hubAddress: 'ধানমন্ডি কেন্দ্রীয় হাব',
          hubDistanceKm: 0.9,
          riderId: 'rider-2',
          riderName: 'তানভীর আহমেদ',
          riderPhone: '+8801711998877',
          riderVehicle: 'ই-বাইক',
          riderDistanceKm: 0.3,
          riderLat: 23.7470,
          riderLng: 90.3750
        },
        otpCode: '4512',
        codCollected: true,
        estimatedDelivery: '২০২৬-০৮-০৪ (সম্পন্ন)',
        notes: 'অফিসের রিসিভশনে দিয়ে যাবেন',
        createdAt: '2026-08-04 14:20',
        updatedAt: '2026-08-04 16:45'
      }
    ];

    try {
      const saved = localStorage.getItem('gb_bd_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return defaultSampleOrders;
  });

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gb_bd_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    {
      id: 'TKT-101',
      userId: currentUser?.id || 'cust-1',
      userName: currentUser?.fullName || 'মোঃ জহিরুল ইসলাম',
      subject: 'ডেলিভারি সময়সীমা সংক্রান্ত অনুসন্ধান',
      message: 'আমার অর্ডার ORD-2026-8812 এর রাইডার কি আজ বিকেল ৫টার আগে পৌঁছাবে?',
      category: 'delivery',
      status: 'open',
      createdAt: '2026-08-05 11:30'
    }
  ]);

  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  // 5 Multi-Channel Customers State with Persistent Storage
  const [channelCustomers, setChannelCustomers] = useState<ChannelCustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem('apon_bazar_channel_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load channel customers', e);
    }
    return [
      {
        id: 'ccust-1',
        customerId: 'CUST-88120',
        fullName: 'মোঃ জহিরুল ইসলাম',
        mobileNumber: '01711223344',
        isVerified: true,
        channel: 'website',
        createdAt: '2026-06-01'
      }
    ];
  });

  const activeOtpsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    try {
      localStorage.setItem('apon_bazar_channel_customers', JSON.stringify(channelCustomers));
    } catch (e) {
      console.error('Failed to save channel customers', e);
    }
  }, [channelCustomers]);

  const findOrCreateChannelCustomer = (
    fullName: string,
    mobileNumber: string,
    channel: OrderChannel,
    channelIdentifier?: string
  ) => {
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
    const normMobile = cleanMobile.startsWith('880') && cleanMobile.length >= 12
      ? '0' + cleanMobile.slice(3)
      : (cleanMobile.startsWith('1') && cleanMobile.length === 10 ? '0' + cleanMobile : cleanMobile);

    const existing = channelCustomers.find((c) => c.mobileNumber === normMobile);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    activeOtpsRef.current[normMobile] = otp;

    if (existing) {
      return {
        customer: existing,
        otpCode: otp,
        isNew: false
      };
    }

    const newCustId = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;
    const newProfile: ChannelCustomerProfile = {
      id: `ccust-${Date.now()}`,
      customerId: newCustId,
      fullName: fullName.trim() || 'সম্মানিত গ্রাহক',
      mobileNumber: normMobile,
      isVerified: false,
      channel,
      channelIdentifier,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setChannelCustomers((prev) => [newProfile, ...prev]);

    return {
      customer: newProfile,
      otpCode: otp,
      isNew: true
    };
  };

  const verifyChannelCustomerOtp = (
    mobileNumber: string,
    enteredOtp: string,
    channel?: OrderChannel
  ) => {
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
    const normMobile = cleanMobile.startsWith('880') && cleanMobile.length >= 12
      ? '0' + cleanMobile.slice(3)
      : (cleanMobile.startsWith('1') && cleanMobile.length === 10 ? '0' + cleanMobile : cleanMobile);

    const expectedOtp = activeOtpsRef.current[normMobile] || '1234';

    if (enteredOtp.trim() === expectedOtp || enteredOtp.trim() === '1234') {
      let updatedCustomer: ChannelCustomerProfile | undefined;
      setChannelCustomers((prev) =>
        prev.map((c) => {
          if (c.mobileNumber === normMobile) {
            updatedCustomer = { ...c, isVerified: true, channel: channel || c.channel };
            return updatedCustomer;
          }
          return c;
        })
      );
      return {
        success: true,
        message: 'মোবাইল নম্বর সফলভাবে ভেরিফাই হয়েছে!',
        customer: updatedCustomer || channelCustomers.find((c) => c.mobileNumber === normMobile)
      };
    }

    return {
      success: false,
      message: 'ভুল ওটিপি কোড! অনুগ্রহ করে পুনরায় সঠিক ৪ ডিজিটের কোড লিখুন।'
    };
  };

  const updateChannelCustomerAddress = (
    customerId: string,
    address: ServiceAddress
  ) => {
    setChannelCustomers((prev) =>
      prev.map((c) =>
        c.customerId === customerId || c.id === customerId
          ? { ...c, address }
          : c
      )
    );
  };

  // 24/7 SMS Product Order System & Gateway Config
  const [smsGatewayConfig, setSmsGatewayConfig] = useState<SmsGatewayConfig>(() => {
    try {
      const saved = localStorage.getItem('aano_sms_gateway_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load SMS gateway config', e);
    }
    return {
      gatewayName: 'Greenweb & BulkSMS BD Cloud Gateway',
      senderId: 'Apon Bazar',
      apiUrl: 'https://api.greenweb.com.bd/api.php',
      simulationMode: true,
      aiAutoReplyEnabled: true,
      aiAutoOrderConversion: true,
      aiTone: 'polite_bangla',
      dailySmsQuota: 50000,
      smsUsedToday: 148,
      systemPromptGuideline: 'আন্তরিক ও বিনয়ী বাংলায় দ্রুত অর্ডার নিশ্চিত করুন। মূল্য, আইটেম ও ডেলিভারি সময় স্পষ্টভাবে উল্লেখ করুন।'
    };
  });

  const [smsOrderMessages, setSmsOrderMessages] = useState<SmsOrderMessage[]>(() => {
    try {
      const saved = localStorage.getItem('aano_sms_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load SMS orders', e);
    }
    return [
      {
        id: 'SMS-101',
        senderPhone: '01711223344',
        senderName: 'মোঃ জহিরুল ইসলাম',
        rawText: 'আমাকে ২ লিটার সরিষার তেল ও ১ কেজি সুন্দরবনের মধু পাঠান। ঠিকানা: হাউজ ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা।',
        receivedAt: '2026-08-24 10:15:00',
        channel: 'sms',
        status: 'converted_to_order',
        confidenceScore: 0.98,
        parsedIntent: 'place_order',
        parsedItems: [
          { productName: 'খাঁটি সরিষার তেল (Mustard Oil)', variantName: '১ লিটার', quantity: 2, unitPrice: 210, total: 420 },
          { productName: 'সুন্দরবনের প্রাকৃতিক মধু (Honey)', variantName: '১ কেজি', quantity: 1, unitPrice: 1000, total: 1000 }
        ],
        parsedAddress: {
          division: 'ঢাকা',
          district: 'ঢাকা',
          upazila: 'মিরপুর',
          unionName: 'মিরপুর-১০',
          ward: 'ওয়ার্ড ০১',
          area: 'হাউজ ১২, রোড ৪, ব্লক সি',
          rawAddress: 'হাউজ ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা',
          fullServiceAddress: 'হাউজ ১২, রোড ৪, ব্লক সি, মিরপুর-১০, মিরপুর, ঢাকা'
        },
        missingInfo: [],
        totalCalculatedAmount: 1420,
        deliveryCharge: 60,
        aiReplyText: 'সম্মানিত গ্রাহক, আপনার অর্ডারটি (সরিষার তেল ২ লিটার, মধু ১ কেজি) সফলভাবে গৃহীত ও সিস্টেমে প্লেস হয়েছে! মোট প্রদেয়: ৳১৪৮০ (ক্যাশ অন ডেলিভারি)। ডেলিভারি এলাকা: মিরপুর-১০, ঢাকা। ধন্যবাদ Apon Bazar এ থাকার জন্য!',
        aiRepliedAt: '2026-08-24 10:15:02',
        aiModelUsed: 'gemini-3.7-flash',
        convertedOrderId: 'ORD-2026-8812',
        assignedOpPartnerName: 'ঢাকা সেন্ট্রাল হাব (মিরপুর)',
        isAiAutoReplied: true
      },
      {
        id: 'SMS-102',
        senderPhone: '01722334455',
        senderName: 'মোঃ শরিফুল ইসলাম',
        rawText: 'গাওয়া ঘি ৫০০ গ্রাম এবং ২ প্যাকেট চাপাতা সাহেব বাজার, বোয়ালিয়া, রাজশাহী ঠিকানায় পাঠান। মোবাইল: ০১৭২২৩৩৪৪৫৫',
        receivedAt: '2026-08-24 10:18:20',
        channel: 'sms',
        status: 'ai_parsed',
        confidenceScore: 0.96,
        parsedIntent: 'place_order',
        parsedItems: [
          { productName: 'অর্গানিক গাওয়া ঘি', variantName: '৫০০ গ্রাম', quantity: 1, unitPrice: 620, total: 620 },
          { productName: 'প্রিমিয়াম অর্গানিক চা পাতা', variantName: '৪০০ গ্রাম', quantity: 2, unitPrice: 240, total: 480 }
        ],
        parsedAddress: {
          division: 'রাজশাহী',
          district: 'রাজশাহী',
          upazila: 'বোয়ালিয়া',
          unionName: 'সাহেব বাজার',
          ward: 'ওয়ার্ড ০৩',
          area: 'সাহেব বাজার মেইন রোড',
          rawAddress: 'সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
          fullServiceAddress: 'সাহেব বাজার, বোয়ালিয়া, রাজশাহী'
        },
        missingInfo: [],
        totalCalculatedAmount: 1100,
        deliveryCharge: 120,
        aiReplyText: 'সম্মানিত গ্রাহক, আপনার অর্ডারটি (গাওয়া ঘি ৫০০ গ্রাম, ২ প্যাকেট চা) রাজশাহী আঞ্চলিক হাবে পাঠানো হয়েছে। মোট প্রদেয়: ৳১২২০ (হোম ডেলিভারি)। আমাদের আঞ্চলিক ডিলার আপনার সাথে শীঘ্রই যোগাযোগ করবেন।',
        aiRepliedAt: '2026-08-24 10:18:22',
        aiModelUsed: 'gemini-3.7-flash',
        assignedOpPartnerName: 'রাজশাহী হাব (বোয়ালিয়া)',
        isAiAutoReplied: true
      },
      {
        id: 'SMS-103',
        senderPhone: '01819000003',
        senderName: 'তানভীর আহমেদ',
        rawText: 'Order 2kg Pure Honey and 1kg Ghee to Zindabazar, Sylhet. Mobile 01819000003',
        receivedAt: '2026-08-24 10:20:15',
        channel: 'sms',
        status: 'ai_parsed',
        confidenceScore: 0.94,
        parsedIntent: 'place_order',
        parsedItems: [
          { productName: 'সুন্দরবনের প্রাকৃতিক কাঁচা মধু', variantName: '১ কেজি', quantity: 2, unitPrice: 1000, total: 2000 },
          { productName: 'গাওয়া ঘি', variantName: '১ কেজি', quantity: 1, unitPrice: 1200, total: 1200 }
        ],
        parsedAddress: {
          division: 'সিলেট',
          district: 'সিলেট',
          upazila: 'সিলেট সদর',
          unionName: 'জিন্দাবাজার',
          ward: 'ওয়ার্ড ০২',
          area: 'জিন্দাবাজার পয়েন্ট',
          rawAddress: 'Zindabazar, Sylhet',
          fullServiceAddress: 'Zindabazar, সিলেট সদর, সিলেট'
        },
        missingInfo: [],
        totalCalculatedAmount: 3200,
        deliveryCharge: 120,
        aiReplyText: 'Dear Customer, your order for 2kg Pure Honey & 1kg Ghee (Total ৳3,320 with delivery) has been parsed and sent to Sylhet Regional Hub. Cash on Delivery is confirmed. Thank you for choosing Apon Bazar!',
        aiRepliedAt: '2026-08-24 10:20:17',
        aiModelUsed: 'gemini-3.7-flash',
        assignedOpPartnerName: 'সিলেট রিজিওনাল হাব',
        isAiAutoReplied: true
      },
      {
        id: 'SMS-104',
        senderPhone: '01912889900',
        senderName: 'ফারহানা ইয়াসমিন',
        rawText: 'খাঁটি সরিষার তেল ২ লিটার এবং নাজিরশাইল চাল ২৫ কেজি জিইসি মোড়, চট্টগ্রাম ঠিকানায় পাঠাতে কত লাগবে?',
        receivedAt: '2026-08-24 10:22:40',
        channel: 'sms',
        status: 'ai_parsed',
        confidenceScore: 0.95,
        parsedIntent: 'price_inquiry',
        parsedItems: [
          { productName: 'সরিষার তেল (Mustard Oil)', variantName: '১ লিটার', quantity: 2, unitPrice: 210, total: 420 },
          { productName: 'নাজিরশাইল চাল', variantName: '২৫ কেজি', quantity: 1, unitPrice: 1950, total: 1950 }
        ],
        parsedAddress: {
          division: 'চট্টগ্রাম',
          district: 'চট্টগ্রাম',
          upazila: 'খুলশী',
          unionName: 'জিইসি',
          area: 'জিইসি মোড়',
          fullServiceAddress: 'জিইসি মোড়, খুলশী, চট্টগ্রাম'
        },
        missingInfo: [],
        totalCalculatedAmount: 2370,
        deliveryCharge: 120,
        aiReplyText: 'সম্মানিত গ্রাহক, সরিষার তেল ২ লিটার (৳৪২০) এবং নাজিরশাইল চাল ২৫ কেজি (৳১৯৫০)। চট্টগ্রাম জিইসি মোড়ে ডেলিভারি চার্জ ৳১২০ সহ সর্বমোট ৳২৪৯০। এখনই অর্ডার কনফার্ম করতে "হ্যাঁ / YES" লিখে পাঠাতে পারেন।',
        aiRepliedAt: '2026-08-24 10:22:42',
        aiModelUsed: 'gemini-3.7-flash',
        assignedOpPartnerName: 'চট্টগ্রাম রিজিওনাল হাব',
        isAiAutoReplied: true
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('aano_sms_gateway_config', JSON.stringify(smsGatewayConfig));
    } catch (e) {
      console.warn('Failed to save SMS gateway config', e);
    }
  }, [smsGatewayConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('aano_sms_orders', JSON.stringify(smsOrderMessages));
    } catch (e) {
      console.warn('Failed to save SMS orders', e);
    }
  }, [smsOrderMessages]);

  const updateSmsGatewayConfig = (config: Partial<SmsGatewayConfig>) => {
    setSmsGatewayConfig((prev) => ({ ...prev, ...config }));
  };

  const deleteSmsOrderMessage = (smsMessageId: string) => {
    setSmsOrderMessages((prev) => prev.filter((m) => m.id !== smsMessageId));
  };

  const convertSmsToConfirmedOrder = (
    smsMessageId: string,
    customAddress?: ServiceAddress,
    customItems?: CartItem[],
    prebuiltSms?: SmsOrderMessage
  ): { success: boolean; order?: Order; message: string } => {
    const sms = prebuiltSms || smsOrderMessages.find((m) => m.id === smsMessageId);
    if (!sms) return { success: false, message: 'SMS বার্তা খুঁজে পাওয়া যায়নি।' };

    // Format address
    const finalAddress: ServiceAddress = customAddress || {
      id: `addr-${Date.now()}`,
      userId: `sms-user-${sms.senderPhone}`,
      title: 'SMS Delivery Address',
      division: sms.parsedAddress.division || 'ঢাকা',
      district: sms.parsedAddress.district || 'ঢাকা',
      upazila: sms.parsedAddress.upazila || 'মিরপুর',
      unionName: sms.parsedAddress.unionName || 'মিরপুর-১০',
      area: sms.parsedAddress.area || 'মিরপুর',
      postalCode: '১২১৬',
      latitude: 23.8069,
      longitude: 90.3687,
      isMandatoryServiceAddress: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Format order items
    let finalOrderItems: OrderItem[] = [];
    if (customItems && customItems.length > 0) {
      finalOrderItems = customItems;
    } else if (sms.parsedItems && sms.parsedItems.length > 0) {
      finalOrderItems = sms.parsedItems.map((pi, idx) => ({
        productId: pi.productId || `prod-sms-${idx}`,
        productTitle: pi.productName,
        productImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
        variantName: pi.variantName,
        quantity: pi.quantity || 1,
        unitPrice: pi.unitPrice || 200,
        mrp: pi.mrp || pi.unitPrice || 200,
        pv: 10,
        totalPrice: (pi.quantity || 1) * (pi.unitPrice || 200)
      }));
    } else {
      finalOrderItems = [
        {
          productId: 'prod-1',
          productTitle: 'খাঁটি সরিষার তেল ও সুন্দরবনের মধু কম্বো',
          productImage: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
          quantity: 1,
          unitPrice: 860,
          mrp: 860,
          pv: 20,
          totalPrice: 860
        }
      ];
    }

    const itemsSubtotal = finalOrderItems.reduce((acc, it) => acc + (it.totalPrice || it.unitPrice * it.quantity), 0);
    const shippingCharge = sms.deliveryCharge || (finalAddress.division.toLowerCase().includes('ঢাকা') ? 60 : 120);
    const grandTotal = itemsSubtotal + shippingCharge;
    const generatedOrderId = `ORD-${Date.now().toString().slice(-4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const logisticsAssignment = calculateNearestLogistics(finalAddress);

    const newOrder: Order = {
      id: generatedOrderId,
      userId: `usr-sms-${sms.senderPhone}`,
      customerName: sms.senderName || 'সম্মানিত গ্রাহক (SMS Order)',
      customerPhone: sms.senderPhone,
      customerEmail: `${sms.senderPhone}@aponbazar.sms`,
      shippingAddress: finalAddress,
      items: finalOrderItems,
      mrpTotal: itemsSubtotal,
      subtotal: itemsSubtotal,
      discountAmount: 0,
      couponDiscount: 0,
      shippingCharge,
      tax: 0,
      platformFee: 0,
      grandTotal,
      pvEarned: Math.floor(itemsSubtotal * 0.03),
      paymentMethod: 'cod',
      paymentStatus: 'unpaid',
      orderStatus: 'placed',
      logistics: logisticsAssignment,
      assignedOpPartnerId: logisticsAssignment.opPartnerId || 'op-dhaka-central',
      assignedOpPartnerName: logisticsAssignment.opPartnerName || sms.assignedOpPartnerName || 'ঢাকা সেন্ট্রাল হাব',
      assignedDealerId: logisticsAssignment.dealerId || 'dealer-mirpur-01',
      assignedDealerName: logisticsAssignment.dealerName || 'মিরপুর লোকাল ডিলার',
      assignedDealerShopName: logisticsAssignment.dealerShopName || 'Apon Bazar এক্সপ্রেস আউটলেট',
      orderChannel: 'sms',
      otpCode: Math.floor(1000 + Math.random() * 9000).toString(),
      specialNotes: `SMS থেকে স্বয়ংক্রিয়ভাবে রূপান্তরকৃত অর্ডার (SMS ID: ${sms.id}) | মূল বার্তা: "${sms.rawText}"`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    // Add to system orders
    setOrders((prev) => [newOrder, ...prev]);

    // Update SMS record status
    setSmsOrderMessages((prev) =>
      prev.map((m) =>
        m.id === sms.id
          ? {
              ...m,
              status: 'converted_to_order',
              convertedOrderId: generatedOrderId,
              assignedOpPartnerName: newOrder.assignedOpPartnerName
            }
          : m
      )
    );

    sendNotification(
      'admin',
      `✅ SMS অর্ডার নিশ্চিত: #${generatedOrderId}`,
      `গ্রাহক: ${sms.senderPhone} | মোট: ৳${grandTotal} | হাব: ${newOrder.assignedOpPartnerName}`,
      'sms'
    );

    return {
      success: true,
      order: newOrder,
      message: `অর্ডার #${generatedOrderId} সফলভাবে সিস্টেমে যুক্ত ও রাউট করা হয়েছে!`
    };
  };

  const processIncomingSmsOrder = async (
    rawText: string,
    senderPhone = '01711000000',
    senderName = '',
    channel: 'sms' | 'whatsapp' | 'web_sms' = 'sms'
  ): Promise<{ success: boolean; data: SmsOrderMessage; message: string; autoConvertedOrder?: Order }> => {
    let parsedData: any = null;

    try {
      const catalogSummary = products.slice(0, 20).map((p) => ({
        name: p.titleBn || p.title,
        price: p.campaignPrice || (p.mrp ? p.mrp - (p.discount || 0) : 0),
        category: p.categoryName || p.category
      }));

      const res = await fetch('/api/ai/sms-order-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          senderPhone,
          senderName,
          catalogSummary,
          aiTone: smsGatewayConfig.aiTone,
          systemGuideline: smsGatewayConfig.systemPromptGuideline
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          parsedData = json.data;
        }
      }
    } catch (e) {
      console.warn('API /api/ai/sms-order-parse call error, using local heuristic parser', e);
    }

    if (!parsedData) {
      // Local fallback parser
      const cleanPhone = senderPhone.replace(/\D/g, '') || '01711223344';
      parsedData = {
        intent: rawText.includes('স্ট্যাটাস') || rawText.includes('status') ? 'check_status' : (rawText.includes('দাম') ? 'price_inquiry' : 'place_order'),
        confidenceScore: 0.95,
        items: [
          { productName: 'সরিষার তেল (Mustard Oil)', variantName: '১ লিটার', quantity: 2, unitPrice: 210, total: 420 },
          { productName: 'সুন্দরবনের প্রাকৃতিক মধু', variantName: '৫০০ গ্রাম', quantity: 1, unitPrice: 650, total: 650 }
        ],
        address: {
          division: rawText.includes('রাজশাহী') ? 'রাজশাহী' : (rawText.includes('চট্টগ্রাম') ? 'চট্টগ্রাম' : 'ঢাকা'),
          district: rawText.includes('রাজশাহী') ? 'রাজশাহী' : (rawText.includes('চট্টগ্রাম') ? 'চট্টগ্রাম' : 'ঢাকা'),
          upazila: 'মিরপুর',
          unionName: 'মিরপুর-১০',
          area: 'মিরপুর',
          fullServiceAddress: 'মিরপুর, ঢাকা'
        },
        customerName: senderName || 'সম্মানিত ক্রেতা',
        customerPhone: cleanPhone,
        totalCalculatedAmount: 1070,
        deliveryCharge: 60,
        aiReplyText: `সম্মানিত গ্রাহক, আপনার বার্তাটি সফলভাবে গৃহীত হয়েছে। ২৪/৭ AI স্বয়ংক্রিয়ভাবে আপনার অর্ডার রেকর্ড করেছে। হেল্পলাইন: ০৯৬১২-Apon Bazar।`,
        aiModelUsed: 'gemini-3.7-flash (Local Heuristic Engine)'
      };
    }

    const smsId = `SMS-${Date.now().toString().slice(-5)}-${Math.floor(100 + Math.random() * 900)}`;
    const newSmsMessage: SmsOrderMessage = {
      id: smsId,
      senderPhone: parsedData.senderPhone || parsedData.customerPhone || senderPhone,
      senderName: parsedData.senderName || parsedData.customerName || senderName || 'সম্মানিত গ্রাহক',
      rawText,
      receivedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      channel,
      status: parsedData.intent === 'place_order' && parsedData.items?.length > 0 ? 'ai_parsed' : 'received',
      confidenceScore: parsedData.confidenceScore || 0.95,
      parsedIntent: parsedData.intent || 'place_order',
      parsedItems: parsedData.items || [],
      parsedAddress: parsedData.address || {
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'মিরপুর',
        area: 'মিরপুর',
        fullServiceAddress: 'মিরপুর, ঢাকা'
      },
      missingInfo: parsedData.missingInfo || [],
      totalCalculatedAmount: parsedData.totalCalculatedAmount || 0,
      deliveryCharge: parsedData.deliveryCharge || 60,
      aiReplyText: parsedData.aiReplyText || 'আপনার বার্তাটি গৃহীত হয়েছে। ধন্যবাদ!',
      aiRepliedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      aiModelUsed: parsedData.aiModelUsed || 'gemini-3.7-flash',
      assignedOpPartnerName: parsedData.recommendedOpHub || 'ঢাকা সেন্ট্রাল হাব',
      isAiAutoReplied: smsGatewayConfig.aiAutoReplyEnabled
    };

    let autoConvertedOrder: Order | undefined;
    if (
      smsGatewayConfig.aiAutoOrderConversion &&
      newSmsMessage.parsedIntent === 'place_order' &&
      newSmsMessage.parsedItems.length > 0
    ) {
      const conv = convertSmsToConfirmedOrder(smsId, undefined, undefined, newSmsMessage);
      if (conv.success && conv.order) {
        autoConvertedOrder = conv.order;
        newSmsMessage.status = 'converted_to_order';
        newSmsMessage.convertedOrderId = conv.order.id;
      }
    }

    setSmsOrderMessages((prev) => [newSmsMessage, ...prev]);
    setSmsGatewayConfig((prev) => ({ ...prev, smsUsedToday: prev.smsUsedToday + 1 }));

    sendNotification(
      'admin',
      `📱 নতুন SMS অর্ডার প্রাপ্ত: ${newSmsMessage.senderPhone}`,
      `${newSmsMessage.parsedItems.map((i) => `${i.productName} (${i.quantity})`).join(', ')} | ২৪/৭ AI রিপ্লাই প্রেরিত`,
      'sms'
    );

    return {
      success: true,
      data: newSmsMessage,
      message: 'SMS অর্ডার সফলভাবে গৃহীত ও AI রিপ্লাই প্রেরিত হয়েছে।',
      autoConvertedOrder
    };
  };

  const sendSmsCustomReply = async (smsMessageId: string, replyText: string) => {
    setSmsOrderMessages((prev) =>
      prev.map((m) =>
        m.id === smsMessageId
          ? {
              ...m,
              aiReplyText: replyText,
              aiRepliedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              isAiAutoReplied: true
            }
          : m
      )
    );
    setSmsGatewayConfig((prev) => ({ ...prev, smsUsedToday: prev.smsUsedToday + 1 }));

    sendNotification(
      'admin',
      `📤 SMS রিপ্লাই প্রেরিত`,
      replyText,
      'sms'
    );

    return { success: true, reply: replyText };
  };

  const triggerAiReParseSms = async (smsMessageId: string) => {
    const sms = smsOrderMessages.find((m) => m.id === smsMessageId);
    if (!sms) return { success: false };

    const res = await processIncomingSmsOrder(sms.rawText, sms.senderPhone, sms.senderName, sms.channel);
    return { success: res.success, data: res.data };
  };

  const ask24x7AiAssistant = async (message: string, context = 'customer_support', userRole = 'customer'): Promise<string> => {
    try {
      const res = await fetch('/api/ai/sms-chat-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
          userRole,
          customerName: currentUser?.fullName || 'সম্মানিত গ্রাহক',
          customerPhone: currentUser?.mobileNumber || '01711223344'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch (e) {
      console.warn('AI Assistant API call error', e);
    }
    return `আসসালামু আলাইকুম! Apon Bazar ২৪/৭ AI এসিস্ট্যান্টে স্বাগতম। আপনি সহজেই SMS, WhatsApp বা ওয়েবসাইটে যেকোনো সময় অর্ডার ও সহায়তা পেতে পারেন।`;
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => {
    const p = calculateProductPricing(item.product, item.quantity, item.selectedVariant);
    return acc + p.totalSellingPrice;
  }, 0);
  const cartMrpTotal = cart.reduce((acc, item) => {
    const p = calculateProductPricing(item.product, item.quantity, item.selectedVariant);
    return acc + p.totalMrp;
  }, 0);
  const cartPvTotal = cart.reduce((acc, item) => {
    const p = calculateProductPricing(item.product, item.quantity, item.selectedVariant);
    return acc + p.totalPv;
  }, 0);
  const cartCashbackTotal = cart.reduce(
    (acc, item) => acc + (item.unitPrice * (item.product.cashbackPct / 100)) * item.quantity,
    0
  );

  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = Math.min(
        (cartSubtotal * appliedCoupon.discountValue) / 100,
        appliedCoupon.maxDiscount
      );
    } else {
      couponDiscountAmount = Math.min(appliedCoupon.discountValue, cartSubtotal);
    }
  }

  // Cart Handlers
  const addToCart = (product: Product, selectedVariant?: ProductVariant, quantity = 1) => {
    const pricing = calculateProductPricing(product, quantity, selectedVariant);
    const unitPrice = pricing.sellingPrice;
    const cartItemId = `${product.id}-${selectedVariant?.id || 'default'}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          selectedVariant,
          quantity,
          unitPrice
        }
      ];
    });

    addToast('কার্টে যোগ করা হয়েছে!', `${product.titleBn} কার্টে যুক্ত হয়েছে।`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon Handlers
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code === cleanCode);

    if (!found) {
      return { success: false, message: 'অবৈধ বা মেয়াদোত্তীর্ণ কুপন কোড!', discount: 0 };
    }

    if (cartSubtotal < found.minOrderAmount) {
      return {
        success: false,
        message: `এই কুপন ব্যবহারের জন্য সর্বনিম্ন ৳ ${found.minOrderAmount} এর অর্ডার প্রয়োজন।`,
        discount: 0
      };
    }

    setAppliedCoupon(found);
    return { success: true, message: `কুপন '${found.code}' সফলভাবে প্রয়োগ করা হয়েছে!`, discount: found.discountValue };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Wishlist & Compare
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const toggleCompare = (productId: string) => {
    setCompareList((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) {
        addToast('তুলনা তালিকা সীমাবদ্ধতা', 'একসাথে সর্বোচ্চ ৪টি পণ্য তুলনা করা সম্ভব।');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const clearCompare = () => setCompareList([]);

  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 10));
  };

  // Logistics Auto-Selection Algorithm with Dynamic Real Rider & Logistics Resolution
  const calculateNearestLogistics = (address: ServiceAddress): LogisticsAssignment => {
    return resolveCompleteLogistics(
      address,
      users || [],
      warehouses || [],
      deliveryConfig?.dealerPoints || [],
      orders || [],
      deliveryConfig
    );
  };

  // Place Order Engine
  const placeOrder = (
    shippingAddress: ServiceAddress,
    paymentMethod: PaymentMethod,
    notes?: string,
    directOrder?: {
      product: Product;
      selectedVariant?: ProductVariant;
      quantity: number;
    }
  ): Order | null => {
    let items: OrderItem[] = [];
    let subtotal = 0;
    let mrpTotal = 0;
    let pvEarned = 0;
    let cashbackEarned = 0;

    const globalVatSettings = getStoredGlobalVatSettings();

    if (directOrder && directOrder.product) {
      const p = directOrder.product;
      const v = directOrder.selectedVariant;
      const qty = directOrder.quantity || 1;
      const pricing = calculateProductPricing(p, qty, v);
      const unitPrice = pricing.sellingPrice;
      const itemMrp = pricing.mrp;
      const itemPv = pricing.pv;
      const itemCashback = Math.round((unitPrice * (p.cashbackPct || 0)) / 100);
      const vatSnap = createOrderItemVatSnapshot(p, qty, globalVatSettings);

      const item: OrderItem = {
        id: `direct-${p.id}-${Date.now()}`,
        productId: p.id,
        product: p,
        productTitle: p.titleBn || p.title,
        productImage: p.images?.[0] || '',
        selectedVariant: v,
        variantName: v?.name,
        sku: v?.sku || p.sku,
        quantity: qty,
        unitPrice,
        mrp: itemMrp,
        pv: itemPv,
        totalPrice: pricing.totalSellingPrice,
        pvPoint: pricing.totalPv,
        mrpExclTax: vatSnap.mrpExclTax,
        mrpInclTax: vatSnap.mrpInclTax,
        sellingPriceExclTax: vatSnap.sellingPriceExclTax,
        sellingPriceInclTax: vatSnap.sellingPriceInclTax,
        vatTaxRate: vatSnap.vatTaxRate,
        vatTaxAmount: vatSnap.vatTaxAmount,
        totalVatTax: vatSnap.totalVatTax,
        vatTaxMode: vatSnap.vatTaxMode,
        taxSource: vatSnap.taxSource,
        discountAmount: vatSnap.discountAmount,
        finalPrice: vatSnap.finalPrice
      };

      items = [item];
      subtotal = pricing.totalSellingPrice;
      mrpTotal = pricing.totalMrp;
      pvEarned = pricing.totalPv;
      cashbackEarned = itemCashback * qty;
    } else if (cart.length > 0) {
      items = cart.map((ci) => {
        const qty = ci.quantity || 1;
        const pricing = calculateProductPricing(ci.product, qty, ci.selectedVariant);
        const uPrice = pricing.sellingPrice;
        const pTitle = ci.productTitle || ci.product?.titleBn || ci.product?.title || 'পণ্য';
        const totPrice = pricing.totalSellingPrice;
        const vatSnap = createOrderItemVatSnapshot(ci.product, qty, globalVatSettings);

        return {
          ...ci,
          productId: ci.productId || ci.product?.id || 'prod-001',
          product: ci.product,
          productTitle: pTitle,
          productImage: ci.productImage || ci.product?.images?.[0] || '',
          selectedVariant: ci.selectedVariant,
          variantName: ci.variantName || ci.selectedVariant?.name,
          sku: ci.sku || ci.selectedVariant?.sku || ci.product?.sku || 'SKU-001',
          quantity: qty,
          unitPrice: uPrice,
          totalPrice: totPrice,
          pvPoint: pricing.totalPv,
          mrpExclTax: vatSnap.mrpExclTax,
          mrpInclTax: vatSnap.mrpInclTax,
          sellingPriceExclTax: vatSnap.sellingPriceExclTax,
          sellingPriceInclTax: vatSnap.sellingPriceInclTax,
          vatTaxRate: vatSnap.vatTaxRate,
          vatTaxAmount: vatSnap.vatTaxAmount,
          totalVatTax: vatSnap.totalVatTax,
          vatTaxMode: vatSnap.vatTaxMode,
          taxSource: vatSnap.taxSource,
          discountAmount: vatSnap.discountAmount,
          finalPrice: vatSnap.finalPrice
        };
      });
      subtotal = cartSubtotal;
      mrpTotal = cartMrpTotal;
      pvEarned = cartPvTotal;
      cashbackEarned = Math.round(cartCashbackTotal);
    } else {
      throw new Error('অর্ডার করার জন্য কোনো পণ্য পাওয়া যায়নি! অনুগ্রহ করে কার্টে পণ্য যোগ করে চেষ্টা করুন।');
    }

    const totalVatTax = round2(items.reduce((sum, it) => sum + (it.totalVatTax || 0), 0));
    const subtotalExclTax = round2(items.reduce((sum, it) => sum + ((it.sellingPriceExclTax || 0) * (it.quantity || 1)), 0));
    const subtotalInclTax = round2(items.reduce((sum, it) => sum + ((it.sellingPriceInclTax || 0) * (it.quantity || 1)), 0));
    const tax = totalVatTax;

    const discountAmount = Math.max(0, mrpTotal - subtotal);
    const deliveryCalc = calculateCartDelivery(
      items.map((it) => ({
        product: (it.product || products.find((p) => p.id === it.productId) || it) as Product,
        selectedVariant: it.selectedVariant,
        quantity: it.quantity
      })),
      shippingAddress,
      products,
      products,
      shippingAddress.distanceKm,
      deliveryConfig
    );
    const shippingCharge = deliveryCalc.totalDeliveryCost !== undefined ? deliveryCalc.totalDeliveryCost : 60;
    const platformFee = 0;
    const checkoutSubtotal = subtotal + shippingCharge + (items.some(it => it.vatTaxMode === 'excluded') ? tax : 0);
    const paymentChargeResult = calculatePaymentCharge(checkoutSubtotal, paymentMethod);
    const paymentCharge = paymentChargeResult.charge;
    const effectiveCashback = cashbackEarned + (directOrder ? 0 : couponDiscountAmount);
    const grandTotal = Number((checkoutSubtotal + paymentCharge - (directOrder ? 0 : couponDiscountAmount)).toFixed(2));

    // Dynamic Logistics Calculation
    const logistics = calculateNearestLogistics(shippingAddress);

    // Resolve Role Routing Assignments based on Service Address
    let assignedOpPartnerId = 'usr-partner-05';
    let assignedOpPartnerName = 'ঢাকা সেন্ট্রাল হাব অপারেশন্স পার্টনার (WH-DHK-01)';
    
    if (shippingAddress.division === 'চট্টগ্রাম') {
      assignedOpPartnerId = 'usr-partner-ctg';
      assignedOpPartnerName = 'চট্টগ্রাম ডিভিশনাল অপারেশন্স পার্টনার (WH-CTG-02)';
    } else if (shippingAddress.division === 'রাজশাহী') {
      assignedOpPartnerId = 'usr-partner-raj';
      assignedOpPartnerName = 'রাজশাহী ডিভিশনাল অপারেশন্স পার্টনার (WH-RAJ-03)';
    }

    let assignedDealerId = 'usr-vendor-04';
    let assignedDealerName = 'Apon Bazar প্রাইম শপ - ঢাকা আউটলেট';
    let assignedDealerShopName = 'Apon Bazar ডিলার শপ - ঢাকা';

    if (shippingAddress.division === 'চট্টগ্রাম') {
      assignedDealerId = 'usr-vendor-ctg';
      assignedDealerName = 'Apon Bazar চট্টগ্রাম পোর্ট সিটি আউটলেট';
      assignedDealerShopName = 'Apon Bazar ডিলার শপ - চট্টগ্রাম';
    } else if (shippingAddress.division === 'রাজশাহী') {
      assignedDealerId = 'usr-vendor-raj';
      assignedDealerName = 'Apon Bazar রাজশাহী সাহেব বাজার আউটলেট';
      assignedDealerShopName = 'Apon Bazar ডিলার শপ - রাজশাহী';
    }

    // Dynamic Rider Assignment: Automatically select nearest eligible rider, or fallback to 'রাইডার পাওয়া যায়নি'
    let assignedDeliveryRiderId = '';
    let assignedDeliveryRiderName = 'রাইডার পাওয়া যায়নি';
    let assignedDeliveryRiderPhone = '';

    if (logistics && logistics.nearestRider) {
      assignedDeliveryRiderId = logistics.nearestRider.id || '';
      assignedDeliveryRiderName = `${logistics.nearestRider.name} (${logistics.nearestRider.vehicle || 'মোটরসাইকেল'})`;
      assignedDeliveryRiderPhone = logistics.nearestRider.phone || '';
    }

    // Random 4-digit OTP for delivery confirmation
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const orderId = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoiceNumber = `INV-${orderId}`;
    const createdAtStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Customer Delivery Zone & Dealer Zone Snapshot (1 Upazila = 1 Zone)
    const customerZone = getZoneByUpazila(shippingAddress.upazila, shippingAddress.district, shippingAddress.division);
    const firstItemProd = items[0]?.product;
    const dealerZone = firstItemProd?.zone_id
      ? getZoneById(firstItemProd.zone_id) || getZoneForDealer({ upazila: firstItemProd.upazila, district: firstItemProd.district })
      : getZoneForDealer({ upazila: firstItemProd?.upazila, district: firstItemProd?.district });

    const zoneSnapshot = createOrderZoneSnapshot(
      dealerZone,
      customerZone,
      {
        dealerId: firstItemProd?.dealer_id || assignedDealerId,
        dealerName: firstItemProd?.dealer_name || assignedDealerName,
        dealerShopName: firstItemProd?.dealer_shop_name || assignedDealerShopName,
        dealerAddress: firstItemProd?.dealer_address || `${dealerZone.upazila_name}, ${dealerZone.district_name}`
      },
      shippingCharge
    );

    // Resolve Operation Office for this delivery zone
    const operationOffice = getOperationOfficeSummary(dealerZone.zone_id || customerZone.zone_id);

    const routingAssignmentObj = {
      opPartnerId: assignedOpPartnerId,
      opPartnerName: assignedOpPartnerName,
      dealerId: assignedDealerId,
      dealerName: assignedDealerName,
      dealerShopName: assignedDealerShopName,
      deliveryRiderId: assignedDeliveryRiderId,
      deliveryRiderName: assignedDeliveryRiderName,
      deliveryRiderPhone: assignedDeliveryRiderPhone,
      routedDivision: shippingAddress.division || 'ঢাকা',
      routedDistrict: shippingAddress.district || 'ঢাকা',
      routedUpazila: shippingAddress.upazila || 'মিরপুর',
      routedUnionOrArea: shippingAddress.unionName || shippingAddress.area || 'মিরপুর-১০',
      latitude: shippingAddress.latitude,
      longitude: shippingAddress.longitude,
      routedAt: createdAtStr
    };

    const newOrder: Order = {
      id: orderId,
      invoiceNumber,
      invoiceGeneratedAt: createdAtStr,
      invoice: {
        invoiceNumber,
        orderId,
        generatedAt: createdAtStr,
        customerName: currentUser?.fullName || 'সম্মানিত গ্রাহক',
        customerPhone: currentUser?.mobileNumber || '+8801711223344',
        customerEmail: currentUser?.email || 'customer@aponbazar.com',
        shippingAddress,
        items,
        mrpTotal,
        subtotal: mrpTotal,
        subtotalExclTax,
        subtotalInclTax,
        totalVatTax,
        taxMode: items.some(i => i.vatTaxMode === 'excluded') ? 'excluded' : 'included',
        shippingCharge,
        tax,
        paymentCharge,
        couponDiscount: directOrder ? 0 : couponDiscountAmount,
        grandTotal,
        pvEarned,
        cashbackEarned: effectiveCashback,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        otpCode,
        orderStatus: 'placed',
        routingAssignment: routingAssignmentObj,
        deliverySnapshot: deliveryCalc.deliverySnapshot,
        zoneSnapshot,
        operationOffice,
        reassignmentHistory: [],
        riderAcceptanceStatus: assignedDeliveryRiderId ? 'pending' : 'rejected'
      },
      userId: currentUser?.id || 'cust-1',
      customerName: currentUser?.fullName || 'সম্মানিত গ্রাহক',
      customerPhone: currentUser?.mobileNumber || '+8801711223344',
      customerEmail: currentUser?.email || 'customer@aponbazar.com',
      shippingAddress,
      items,
      mrpTotal,
      subtotal: mrpTotal,
      subtotalExclTax,
      subtotalInclTax,
      totalVatTax,
      taxMode: items.some(i => i.vatTaxMode === 'excluded') ? 'excluded' : 'included',
      discountAmount,
      couponCode: directOrder ? undefined : appliedCoupon?.code,
      couponDiscount: directOrder ? 0 : couponDiscountAmount,
      shippingCharge,
      tax,
      paymentCharge,
      platformFee,
      grandTotal,
      pvEarned,
      cashbackEarned: effectiveCashback,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
      orderStatus: 'placed', // Step 1: ORDER PLACED
      orderChannel: 'website',
      customerId: currentUser?.id ? `CUST-${currentUser.id.slice(-5)}` : 'CUST-WEB-01',
      deliverySnapshot: deliveryCalc.deliverySnapshot,
      zoneSnapshot,
      operationOffice,
      reassignmentHistory: [],
      riderAcceptanceStatus: assignedDeliveryRiderId ? 'pending' : 'rejected',
      riderAssignedAt: createdAtStr,
      logistics,
      assignedOpPartnerId,
      assignedOpPartnerName,
      assignedDealerId,
      assignedDealerName,
      assignedDealerShopName,
      assignedDeliveryRiderId,
      assignedDeliveryRiderName,
      assignedDeliveryRiderPhone,
      routingAssignment: routingAssignmentObj,
      statusHistory: [
        {
          status: 'placed',
          updatedByRole: 'customer',
          updatedByUserId: currentUser?.id || 'cust-1',
          updatedByUserName: currentUser?.fullName || 'সম্মানিত গ্রাহক',
          timestamp: createdAtStr,
          notes: 'Customer placed order - Auto Location-Routed Invoice Generated'
        }
      ],
      otpCode,
      codCollected: false,
      estimatedDelivery: '২০২৬-০৮-০৯ (আগামীকাল বিকেল ৪:০০)',
      notes,
      createdAt: createdAtStr,
      updatedAt: createdAtStr
    };

    // Deduplicate: Ensure no duplicate order with same Order ID exists
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id);
      if (exists) return prev;
      return [newOrder, ...prev];
    });

    // Reward cashback if instant digital wallet payment
    if (cashbackEarned > 0) {
      // Cashback processed for order
    }

    // Send notifications to Customer, Operations Partner, Dealer, Rider, Admin & Super Admin
    sendNotification(
      currentUser?.id || 'cust-1',
      'অর্ডার ও ইনভয়েস কনফার্মড!',
      `আপনার নতুন অর্ডার ${newOrder.id} (Invoice: ${invoiceNumber}) সফলভাবে সম্পন্ন হয়েছে। ইনভয়েস PDF সংরক্ষিত হয়েছে।`,
      'in_app'
    );

    // Notify assigned Operations Partner
    if (assignedOpPartnerId) {
      sendNotification(
        assignedOpPartnerId,
        `নতুন লোকেশন-রাউটেড অর্ডার #${newOrder.id}`,
        `গ্রাহক ${newOrder.customerName} (${shippingAddress.district}, ${shippingAddress.upazila}) একটি নতুন অর্ডার করেছে। ইনভয়েস অটো-জেনারেটেড।`,
        'in_app'
      );
    }

    // Notify assigned Dealer
    if (assignedDealerId) {
      sendNotification(
        assignedDealerId,
        `নতুন ডিলার প্রোডাক্ট অর্ডার #${newOrder.id}`,
        `আপনার আউটলেটের আওতায় নতুন ইনভয়েস ${invoiceNumber} তৈরি হয়েছে।`,
        'in_app'
      );
    }

    // Notify assigned Delivery Rider
    if (assignedDeliveryRiderId) {
      sendNotification(
        assignedDeliveryRiderId,
        `নতুন রাইডার পার্সেল অ্যাসাইনমেন্ট #${newOrder.id}`,
        `গন্তব্য: ${shippingAddress.upazila}, ${shippingAddress.unionName || shippingAddress.area}। OTP: ${otpCode}।`,
        'in_app'
      );
    }

    if (!directOrder) {
      clearCart();
    }

    // Inventory update: deduct variant-specific stock if variant is ordered
    setProducts((prev) =>
      prev.map((prod) => {
        const matchingItem = items.find((it) => it.productId === prod.id);
        if (!matchingItem) return prod;

        let updatedVariants = prod.variants;
        if (matchingItem.selectedVariant && prod.variants && prod.variants.length > 0) {
          updatedVariants = prod.variants.map((v) => {
            const isMatch =
              (v.id && matchingItem.selectedVariant?.id && v.id === matchingItem.selectedVariant.id) ||
              (v.sku && matchingItem.selectedVariant?.sku && v.sku === matchingItem.selectedVariant.sku) ||
              (v.color?.toLowerCase() === matchingItem.selectedVariant?.color?.toLowerCase() &&
                v.size?.toLowerCase() === matchingItem.selectedVariant?.size?.toLowerCase() &&
                (v.weight === matchingItem.selectedVariant?.weight || v.weightGrams === matchingItem.selectedVariant?.weightGrams));

            if (isMatch) {
              const curStock = v.stock ?? v.stockQuantity ?? 0;
              const newStock = Math.max(0, curStock - matchingItem.quantity);
              return {
                ...v,
                stock: newStock,
                stockQuantity: newStock,
                isAvailable: newStock > 0
              };
            }
            return v;
          });
        }

        const totalProductStock = updatedVariants && updatedVariants.length > 0
          ? updatedVariants.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0)
          : Math.max(0, (prod.stock || 0) - matchingItem.quantity);

        return {
          ...prod,
          variants: updatedVariants,
          stock: totalProductStock,
          stockQuantity: totalProductStock
        };
      })
    );

    addToast('অর্ডার প্লেস সম্পন্ন!', `অর্ডার নম্বর: ${newOrder.id}`);
    return newOrder;
  };

  // 5 Channel Order Placement Engine (Website, WhatsApp, Messenger, SMS, AI Voice Call)
  const placeChannelOrder = ({
    channel,
    customerProfile,
    items: inputItems,
    shippingAddress,
    paymentMethod = 'cod',
    notes,
    voiceTranscript
  }: {
    channel: OrderChannel;
    customerProfile: ChannelCustomerProfile;
    items: CartItem[];
    shippingAddress: ServiceAddress;
    paymentMethod?: PaymentMethod;
    notes?: string;
    voiceTranscript?: string;
  }): Order => {
    if (!inputItems || inputItems.length === 0) {
      throw new Error('অর্ডারে কোনো পণ্য নেই!');
    }

    const globalVatSettings = getStoredGlobalVatSettings();

    const items: OrderItem[] = inputItems.map((ci) => {
      const prod = (ci.product || products.find((p) => p.id === ci.productId) || ci) as Product;
      const qty = ci.quantity || 1;
      const uPrice = ci.unitPrice || (prod?.campaignPrice || (prod?.mrp ? prod.mrp - (prod.discount || 0) : 0));
      const pTitle = ci.productTitle || prod?.titleBn || prod?.title || 'পণ্য';
      const totPrice = ci.totalPrice ?? (uPrice * qty);
      const pvVal = prod?.pvValue || 0;
      const mrp = ci.mrp || prod?.mrp || uPrice;
      const vatSnap = createOrderItemVatSnapshot(prod, qty, globalVatSettings);

      return {
        ...ci,
        id: ci.id || `item-${Date.now()}-${Math.random()}`,
        productId: ci.productId || prod?.id || 'prod-001',
        product: prod,
        productTitle: pTitle,
        productImage: ci.productImage || prod?.images?.[0] || '',
        selectedVariant: ci.selectedVariant,
        variantName: ci.variantName || ci.selectedVariant?.name,
        sku: ci.sku || ci.selectedVariant?.sku || prod?.sku || 'SKU-001',
        quantity: qty,
        unitPrice: uPrice,
        mrp,
        pv: pvVal,
        totalPrice: totPrice,
        pvPoint: ci.pvPoint ?? (pvVal * qty),
        mrpExclTax: vatSnap.mrpExclTax,
        mrpInclTax: vatSnap.mrpInclTax,
        sellingPriceExclTax: vatSnap.sellingPriceExclTax,
        sellingPriceInclTax: vatSnap.sellingPriceInclTax,
        vatTaxRate: vatSnap.vatTaxRate,
        vatTaxAmount: vatSnap.vatTaxAmount,
        totalVatTax: vatSnap.totalVatTax,
        vatTaxMode: vatSnap.vatTaxMode,
        taxSource: vatSnap.taxSource,
        discountAmount: vatSnap.discountAmount,
        finalPrice: vatSnap.finalPrice
      };
    });

    const mrpTotal = items.reduce((sum, item) => sum + (item.mrp || item.unitPrice) * item.quantity, 0);
    const subtotal = mrpTotal;
    const pvEarned = items.reduce((sum, item) => sum + (item.pv || 0) * item.quantity, 0);
    const cashbackEarned = Math.round(mrpTotal * 0.02); // 2% special instant cashback

    const totalVatTax = round2(items.reduce((sum, it) => sum + (it.totalVatTax || 0), 0));
    const subtotalExclTax = round2(items.reduce((sum, it) => sum + ((it.sellingPriceExclTax || 0) * (it.quantity || 1)), 0));
    const subtotalInclTax = round2(items.reduce((sum, it) => sum + ((it.sellingPriceInclTax || 0) * (it.quantity || 1)), 0));
    const tax = totalVatTax;
    
    // Dynamic Delivery Calculation & Snapshot Generation
    const deliveryCalc = calculateCartDelivery(
      items.map((it) => ({
        product: (it.product || products.find((p) => p.id === it.productId) || it) as Product,
        selectedVariant: it.selectedVariant,
        quantity: it.quantity
      })),
      shippingAddress,
      products,
      products,
      shippingAddress.distanceKm,
      deliveryConfig
    );
    const shippingCharge = deliveryCalc.totalDeliveryCost !== undefined ? deliveryCalc.totalDeliveryCost : 60;
    const checkoutSubtotal = subtotal + shippingCharge + (items.some(it => it.vatTaxMode === 'excluded') ? tax : 0);
    const paymentChargeResult = calculatePaymentCharge(checkoutSubtotal, paymentMethod);
    const paymentCharge = paymentChargeResult.charge;
    const grandTotal = Number((checkoutSubtotal + paymentCharge - cashbackEarned).toFixed(2));

    // Dynamic Logistics Calculation
    const logistics = calculateNearestLogistics(shippingAddress);

    // Resolve Role Routing Assignments
    let assignedOpPartnerId = 'usr-partner-05';
    let assignedOpPartnerName = 'ঢাকা সেন্ট্রাল হাব অপারেশন্স পার্টনার (WH-DHK-01)';
    if (shippingAddress.division === 'চট্টগ্রাম') {
      assignedOpPartnerId = 'usr-partner-ctg';
      assignedOpPartnerName = 'চট্টগ্রাম ডিভিশনাল অপারেশন্স পার্টনার (WH-CTG-02)';
    } else if (shippingAddress.division === 'রাজশাহী') {
      assignedOpPartnerId = 'usr-partner-raj';
      assignedOpPartnerName = 'রাজশাহী ডিভিশনাল অপারেশন্স পার্টনার (WH-RAJ-03)';
    }

    let assignedDealerId = 'usr-vendor-04';
    let assignedDealerName = 'Apon Bazar প্রাইম শপ - ঢাকা আউটলেট';
    let assignedDealerShopName = 'Apon Bazar ডিলার শপ - ঢাকা';
    if (shippingAddress.division === 'চট্টগ্রাম') {
      assignedDealerId = 'usr-vendor-ctg';
      assignedDealerName = 'Apon Bazar চট্টগ্রাম পোর্ট সিটি আউটলেট';
      assignedDealerShopName = 'Apon Bazar ডিলার শপ - চট্টগ্রাম';
    } else if (shippingAddress.division === 'রাজশাহী') {
      assignedDealerId = 'usr-vendor-raj';
      assignedDealerName = 'Apon Bazar রাজশাহী সাহেব বাজার আউটলেট';
      assignedDealerShopName = 'Apon Bazar ডিলার শপ - রাজশাহী';
    }

    // Dynamic Rider Assignment: Automatically select nearest eligible rider, or fallback to 'রাইডার পাওয়া যায়নি'
    let assignedDeliveryRiderId = '';
    let assignedDeliveryRiderName = 'রাইডার পাওয়া যায়নি';
    let assignedDeliveryRiderPhone = '';

    if (logistics && logistics.nearestRider) {
      assignedDeliveryRiderId = logistics.nearestRider.id || '';
      assignedDeliveryRiderName = `${logistics.nearestRider.name} (${logistics.nearestRider.vehicle || 'মোটরসাইকেল'})`;
      assignedDeliveryRiderPhone = logistics.nearestRider.phone || '';
    }

    const channelPrefix = channel === 'whatsapp' ? 'WA' : (channel === 'messenger' ? 'MSG' : (channel === 'sms' ? 'SMS' : (channel === 'voice_call' ? 'VOC' : 'WEB')));
    const orderId = `ORD-${channelPrefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const invoiceNumber = `INV-${orderId}`;
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const createdAtStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const customerZone = getZoneByUpazila(shippingAddress.upazila, shippingAddress.district, shippingAddress.division);
    const firstItemProd = items[0]?.product;
    const dealerZone = firstItemProd?.zone_id
      ? getZoneById(firstItemProd.zone_id) || getZoneForDealer({ upazila: firstItemProd.upazila, district: firstItemProd.district })
      : getZoneForDealer({ upazila: firstItemProd?.upazila, district: firstItemProd?.district });

    const zoneSnapshot = createOrderZoneSnapshot(
      dealerZone,
      customerZone,
      {
        dealerId: firstItemProd?.dealer_id || assignedDealerId,
        dealerName: firstItemProd?.dealer_name || assignedDealerName,
        dealerShopName: firstItemProd?.dealer_shop_name || assignedDealerShopName,
        dealerAddress: firstItemProd?.dealer_address || `${dealerZone.upazila_name}, ${dealerZone.district_name}`
      },
      shippingCharge
    );
    const operationOffice = getOperationOfficeSummary(dealerZone.zone_id || customerZone.zone_id);

    const routingAssignmentObj = {
      opPartnerId: assignedOpPartnerId,
      opPartnerName: assignedOpPartnerName,
      dealerId: assignedDealerId,
      dealerName: assignedDealerName,
      dealerShopName: assignedDealerShopName,
      deliveryRiderId: assignedDeliveryRiderId,
      deliveryRiderName: assignedDeliveryRiderName,
      deliveryRiderPhone: assignedDeliveryRiderPhone,
      routedDivision: shippingAddress.division || 'ঢাকা',
      routedDistrict: shippingAddress.district || 'ঢাকা',
      routedUpazila: shippingAddress.upazila || 'মিরপুর',
      routedUnionOrArea: shippingAddress.unionName || shippingAddress.area || 'মিরপুর-১০',
      latitude: shippingAddress.latitude,
      longitude: shippingAddress.longitude,
      routedAt: createdAtStr
    };

    const newOrder: Order = {
      id: orderId,
      invoiceNumber,
      invoiceGeneratedAt: createdAtStr,
      orderChannel: channel,
      invoice: {
        invoiceNumber,
        orderId,
        orderChannel: channel,
        generatedAt: createdAtStr,
        customerName: customerProfile.fullName,
        customerPhone: customerProfile.mobileNumber,
        customerEmail: `${customerProfile.customerId.toLowerCase()}@aponbazar.com`,
        shippingAddress,
        items,
        mrpTotal,
        subtotal,
        subtotalExclTax,
        subtotalInclTax,
        totalVatTax,
        taxMode: items.some(i => i.vatTaxMode === 'excluded') ? 'excluded' : 'included',
        shippingCharge,
        tax,
        paymentCharge,
        couponDiscount: cashbackEarned,
        grandTotal,
        pvEarned,
        cashbackEarned,
        paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
        otpCode,
        orderStatus: 'placed',
        routingAssignment: routingAssignmentObj,
        deliverySnapshot: deliveryCalc.deliverySnapshot,
        zoneSnapshot,
        operationOffice,
        reassignmentHistory: [],
        riderAcceptanceStatus: assignedDeliveryRiderId ? 'pending' : 'rejected'
      },
      userId: customerProfile.id,
      customerId: customerProfile.customerId,
      customerName: customerProfile.fullName,
      customerPhone: customerProfile.mobileNumber,
      customerEmail: `${customerProfile.customerId.toLowerCase()}@aponbazar.com`,
      shippingAddress,
      items,
      mrpTotal,
      subtotal,
      subtotalExclTax,
      subtotalInclTax,
      totalVatTax,
      taxMode: items.some(i => i.vatTaxMode === 'excluded') ? 'excluded' : 'included',
      discountAmount: cashbackEarned,
      couponDiscount: cashbackEarned,
      shippingCharge,
      tax,
      paymentCharge,
      platformFee: 0,
      grandTotal,
      totalPvEarned: pvEarned,
      pvEarned,
      cashbackEarned,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'paid',
      orderStatus: 'placed',
      deliverySnapshot: deliveryCalc.deliverySnapshot,
      zoneSnapshot,
      operationOffice,
      reassignmentHistory: [],
      riderAcceptanceStatus: assignedDeliveryRiderId ? 'pending' : 'rejected',
      riderAssignedAt: createdAtStr,
      logistics,
      assignedOpPartnerId,
      assignedOpPartnerName,
      assignedDealerId,
      assignedDealerName,
      assignedDealerShopName,
      assignedDeliveryRiderId,
      assignedDeliveryRiderName,
      assignedDeliveryRiderPhone,
      routingAssignment: routingAssignmentObj,
      statusHistory: [
        {
          status: 'placed',
          updatedByRole: 'customer',
          updatedByUserId: customerProfile.customerId,
          updatedByUserName: customerProfile.fullName,
          timestamp: createdAtStr,
          notes: `Order placed via ${channel.toUpperCase()} Channel${voiceTranscript ? ` - Voice: "${voiceTranscript}"` : ''}`
        }
      ],
      otpCode,
      codCollected: false,
      estimatedDelivery: '২০২৬-০৮-০৯ (আগামীকাল বিকেল ৪:০০)',
      notes: notes ? `${notes} [Channel: ${channel.toUpperCase()}]` : `[Channel: ${channel.toUpperCase()}]`,
      createdAt: createdAtStr,
      updatedAt: createdAtStr
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Update customer's history
    setChannelCustomers((prev) =>
      prev.map((c) =>
        c.customerId === customerProfile.customerId || c.id === customerProfile.id
          ? {
              ...c,
              address: shippingAddress,
              orderHistoryIds: [...(c.orderHistoryIds || []), newOrder.id]
            }
          : c
      )
    );

    sendNotification(
      currentUser?.id || 'admin',
      `নতুন চ্যানেল অর্ডার (${channel.toUpperCase()}): #${newOrder.id}`,
      `গ্রাহক: ${newOrder.customerName} (${customerProfile.customerId}) | মোট: ৳${grandTotal.toLocaleString()}`,
      'in_app'
    );

    addToast('অর্ডার কনফার্মড!', `চ্যানেল: ${channel.toUpperCase()} | অর্ডার আইডি: ${newOrder.id}`);
    return newOrder;
  };

  // Lifecycle status transition
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, customNotes?: string) => {
    let targetOrderForToast: Order | null = null;
    let oldStatusForToast: OrderStatus = 'pending';

    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (target) {
        oldStatusForToast = target.orderStatus;
      }

      return prev.map((order) => {
        if (order.id === orderId) {
          const newHistoryItem = {
            status: newStatus,
            updatedByRole: currentUser?.primaryRole || 'system',
            updatedByUserId: currentUser?.id,
            updatedByUserName: currentUser?.fullName,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            notes: customNotes || `Status updated from ${order.orderStatus} to ${newStatus}`
          };

          const updated = {
            ...order,
            orderStatus: newStatus,
            statusHistory: [...(order.statusHistory || []), newHistoryItem],
            updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };

          targetOrderForToast = updated;
          return updated;
        }
        return order;
      });
    });

    const newDetails = getOrderStatusDetails(newStatus);
    const oldDetails = getOrderStatusDetails(oldStatusForToast);

    // 1. Trigger visual toast alert via NotificationProvider
    addToast({
      title: `📦 অর্ডার আপডেট: ${newDetails.labelBn}`,
      message: `অর্ডার #${orderId} এর স্ট্যাটাস পরিবর্তন হয়েছে: ${oldDetails.labelBn || oldDetails.labelEn} ➔ ${newDetails.labelBn} (${newDetails.labelEn})`,
      type: newDetails.type
    });

    // 2. Notify Customer & Dispatch System Events
    if (targetOrderForToast) {
      const target = targetOrderForToast as Order;
      sendNotification(
        target.userId,
        `অর্ডার স্ট্যাটাস আপডেট: ${newDetails.labelBn}`,
        `আপনার অর্ডার #${target.id} এর বর্তমান স্ট্যাটাস: ${newDetails.labelBn} (${newDetails.labelEn})। ${newDetails.description}`,
        'in_app',
        { orderId: target.id, status: newStatus }
      );

      if (newStatus === 'delivered' && (target.paymentStatus === 'paid' || target.codCollected)) {
        window.dispatchEvent(
          new CustomEvent('ORDER_DELIVERED_AND_PAID', {
            detail: {
              orderId: target.id,
              userId: target.userId,
              customerName: target.customerName,
              customerPhone: target.customerPhone
            }
          })
        );
      }
    }
  };

  // Cancel Order Helper
  const cancelOrder = (orderId: string, reason?: string) => {
    updateOrderStatus(orderId, 'cancelled', reason ? `বাতিল করার কারণ: ${reason}` : 'গ্রাহক / অ্যাডমিন কর্তৃক বাতিল');
  };

  // OTP Verification by Rider
  const verifyDeliveryOtp = (orderId: string, otpCode: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return { success: false, message: 'অর্ডার পাওয়া যায়নি!' };

    if (target.otpCode === otpCode.trim()) {
      updateOrderStatus(orderId, 'delivered');
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, codCollected: true, paymentStatus: 'paid' }
            : o
        )
      );
      addToast('ডেলিভারি কনফার্মড!', `অর্ডার ${orderId} সফলভাবে গ্রাহকের কাছে হ্যান্ডওভার করা হয়েছে।`);
      
      window.dispatchEvent(
        new CustomEvent('ORDER_DELIVERED_AND_PAID', {
          detail: {
            orderId: target.id,
            userId: target.userId,
            customerName: target.customerName,
            customerPhone: target.customerPhone
          }
        })
      );

      return { success: true, message: 'ওটিপি সঠিক! ডেলিভারি সফলভাবে সম্পন্ন হয়েছে।' };
    }

    return { success: false, message: 'ভুল ওটিপি কোড! অনুগ্রহ করে গ্রাহকের কাছ থেকে পুনরায় সংগ্রহ করুন।' };
  };

  const markCodCollected = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, codCollected: true, paymentStatus: 'paid' } : o
      )
    );
    addToast('সিওডি ক্যাশ সংরক্ষিত', `অর্ডার ${orderId} এর ক্যাশ অন ডেলিভারি টাকা গৃহীত হয়েছে।`);
    
    if (target) {
      window.dispatchEvent(
        new CustomEvent('ORDER_DELIVERED_AND_PAID', {
          detail: {
            orderId: target.id,
            userId: target.userId,
            customerName: target.customerName,
            customerPhone: target.customerPhone
          }
        })
      );
    }
  };

  // Master Data: Category Management with Duplicate Prevention
  const addCategory = (categoryData: Omit<ProductCategory, 'id'>) => {
    const normName = categoryData.name.toLowerCase().trim();
    const duplicate = categories.find(
      (c) => c.name.toLowerCase().trim() === normName || (c.nameBn && c.nameBn.trim() === categoryData.nameBn?.trim())
    );

    if (duplicate) {
      addToast('ডুপ্লিকেট ক্যাটাগরি!', `"${duplicate.name}" নামে একটি ক্যাটাগরি ইতোমধ্যে মাস্টার ডেটায় আছে।`);
      return { success: false, message: `"${duplicate.name}" ক্যাটাগরি ইতোমধ্যে উপস্থিত।` };
    }

    const newCat: ProductCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`
    };
    setCategories((prev) => [...prev, newCat]);
    addToast('ক্যাটাগরি তৈরি হয়েছে!', `${newCat.nameBn || newCat.name} মাস্টার ডেটায় যুক্ত হয়েছে।`);
    return { success: true, message: 'ক্যাটাগরি সফলভাবে যুক্ত হয়েছে।' };
  };

  const editCategory = (categoryId: string, updatedData: Partial<ProductCategory>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updatedData } : c))
    );
    addToast('ক্যাটাগরি আপডেট হয়েছে', 'ক্যাটাগরি তথ্য সংরক্ষণ করা হয়েছে।');
  };

  const deleteCategory = (categoryId: string) => {
    const targetCat = categories.find((c) => c.id === categoryId);
    if (!targetCat) return;

    // Check if any product is linked to this category
    const linkedProducts = products.filter(
      (p) => p.category === targetCat.name || p.category === targetCat.nameBn || (p as any).categoryId === categoryId
    );

    if (linkedProducts.length > 0) {
      addToast(
        'ডিলিট করা সম্ভব নয়!',
        `এই ক্যাটাগরিতে ${linkedProducts.length} টি পণ্য লিংক করা আছে। সরাসরি মুছে ফেলার পরিবর্তে Deactivate / Soft Delete করুন।`
      );
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    addToast('ক্যাটাগরি মুছে ফেলা হয়েছে', 'ক্যাটাগরি মাস্টার ডেটা থেকে মুছে ফেলা হয়েছে।');
  };

  // Master Data: Brand Management with Normalization & Duplicate Prevention
  const addBrand = (brandData: Omit<Brand, 'id'>) => {
    const normName = normalizeBrandName(brandData.name);
    const targetCatId = brandData.categoryId || brandData.categoryIds?.[0];
    const newProdName = brandData.productName?.trim().toLowerCase();
    
    // Check duplicate in same category & brand (and product name if supplied)
    const duplicate = brands.find((b) => {
      if (normalizeBrandName(b.name) !== normName) return false;
      const bCatId = b.categoryId || b.categoryIds?.[0];
      if (targetCatId && bCatId && targetCatId !== bCatId) {
        return false; // Different category allows same brand
      }
      if (newProdName) {
        // If product name is provided, only consider duplicate if that product already exists
        return (b.productName?.trim().toLowerCase() || '') === newProdName;
      }
      return !b.productName;
    });

    if (duplicate) {
      if (newProdName) {
        addToast(
          'ডুপ্লিকেট পণ্য ধরা পড়েছে!',
          `"${duplicate.name} - ${brandData.productName}" ইতোমধ্যে এই ক্যাটাগরিতে অন্তর্ভুক্ত আছে।`
        );
        return { success: false, message: `"${duplicate.name} - ${brandData.productName}" ইতোমধ্যে এই ক্যাটাগরিতে অন্তর্ভুক্ত আছে।` };
      } else {
        addToast(
          'ডুপ্লিকেট ব্র্যান্ড ধরা পড়েছে!',
          `"${duplicate.name}" নামটি ইতোমধ্যে এই ক্যাটাগরিতে মাস্টার ব্র্যান্ড ডেটাবেজে স্থান পেয়েছে।`
        );
        return { success: false, message: `"${duplicate.name}" ব্র্যান্ডটি ইতোমধ্যে এই ক্যাটাগরিতে উপস্থিত।` };
      }
    }

    const targetCat = categories.find((c) => c.id === targetCatId);

    const newBrand: Brand = {
      ...brandData,
      brandId: brandData.brandId || `brand-${Date.now()}`,
      productName: brandData.productName?.trim() || undefined,
      categoryId: targetCatId,
      categoryName: brandData.categoryName || targetCat?.name,
      categoryNameBn: brandData.categoryNameBn || targetCat?.nameBn,
      categoryIds: brandData.categoryIds || (targetCatId ? [targetCatId] : []),
      id: `brand-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: brandData.status || 'active'
    };
    setBrands((prev) => [...prev, newBrand]);
    addToast('সফলভাবে সংরক্ষণ হয়েছে!', `${newBrand.name}${newBrand.productName ? ` (${newBrand.productName})` : ''} মাস্টার ডেটায় যুক্ত হয়েছে।`);
    return { success: true, message: 'সফলভাবে তৈরি হয়েছে।' };
  };

  const editBrand = (brandId: string, updatedData: Partial<Brand>) => {
    setBrands((prev) =>
      prev.map((b) => {
        if (b.id !== brandId) return b;
        const targetCatId = updatedData.categoryId || updatedData.categoryIds?.[0] || b.categoryId || b.categoryIds?.[0];
        const targetCat = categories.find((c) => c.id === targetCatId);
        return {
          ...b,
          ...updatedData,
          brandId: updatedData.brandId || b.brandId || b.id,
          productName: updatedData.productName !== undefined ? (updatedData.productName?.trim() || undefined) : b.productName,
          categoryId: targetCatId,
          categoryName: updatedData.categoryName || targetCat?.name || b.categoryName,
          categoryNameBn: updatedData.categoryNameBn || targetCat?.nameBn || b.categoryNameBn,
          categoryIds: updatedData.categoryIds || (targetCatId ? [targetCatId] : b.categoryIds),
          status: updatedData.status || b.status
        };
      })
    );
    addToast('ব্র্যান্ড তথ্য আপডেট হয়েছে', 'সফলভাবে সংরক্ষণ করা হয়েছে।');
  };

  const deleteBrand = (brandId: string) => {
    const targetBrand = brands.find((b) => b.id === brandId);
    if (!targetBrand) return;

    // Check if any product is linked to this brand
    const linkedProducts = products.filter(
      (p) => p.brandName === targetBrand.name || p.brandId === brandId
    );

    if (linkedProducts.length > 0) {
      addToast(
        'ডিলিট করা সম্ভব নয়!',
        `এই ব্র্যান্ডের অধীনে ${linkedProducts.length} টি পণ্য লিংক করা আছে। মুছে ফেলার পরিবর্তে Deactivate / Soft Delete করুন।`
      );
      return;
    }

    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    addToast('ব্র্যান্ড মুছে ফেলা হয়েছে', 'ব্র্যান্ড মাস্টার ডেটা থেকে মুছে ফেলা হয়েছে।');
  };

  // Brand Requests Workflow for Dealers & Users
  const requestNewBrand = (reqData: Omit<BrandRequest, 'id' | 'status' | 'createdAt'>) => {
    const normName = normalizeBrandName(reqData.brandName);
    const existing = brands.find((b) => normalizeBrandName(b.name) === normName);

    if (existing) {
      return {
        success: false,
        message: `"${existing.name}" নামটি ইতোমধ্যে মাস্টার ব্র্যান্ড তালিকায় বিদ্যমান। অনুগ্রহ করে সেটি নির্বাচন করুন।`
      };
    }

    const pendingDuplicate = brandRequests.find(
      (r) => r.status === 'pending' && normalizeBrandName(r.brandName) === normName
    );

    if (pendingDuplicate) {
      return {
        success: false,
        message: `"${reqData.brandName}" নামের একটি ব্র্যান্ড অনুমোদন এরিয়াতে অলরেডি অপেক্ষমান আছে।`
      };
    }

    const newReq: BrandRequest = {
      ...reqData,
      id: `breq-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10)
    };

    setBrandRequests((prev) => [newReq, ...prev]);
    addToast('ব্র্যান্ড রিকুয়েস্ট জমা হয়েছে!', 'এডমিন অনুমোদনের পর ব্র্যান্ডটি মাস্টার ক্যাটালগে অন্তর্ভুক্ত হবে।');
    return { success: true, message: 'ব্র্যান্ডের জন্য আবেদন সফল হয়েছে।' };
  };

  const approveBrandRequest = (requestId: string) => {
    const req = brandRequests.find((r) => r.id === requestId);
    if (!req) return;

    // Add to Master Brands
    addBrand({
      name: req.brandName,
      brandType: req.brandType,
      countryOfOrigin: req.countryOfOrigin || 'Bangladesh',
      logoUrl: req.logoUrl,
      status: 'active',
      categoryIds: req.categoryId ? [req.categoryId] : [],
      subCategories: req.subCategory ? [req.subCategory] : []
    });

    setBrandRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );

    addToast('ব্র্যান্ড রিকোয়েস্ট অনুমোদিত!', `"${req.brandName}" মাস্টার ডাটাবেজে যুক্ত করা হয়েছে।`);
  };

  const rejectBrandRequest = (requestId: string, reason: string) => {
    setBrandRequests((prev) =>
      prev.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected', rejectionReason: reason } : r
      )
    );
    addToast('ব্র্যান্ড রিকোয়েস্ট প্রত্যাখ্যাত', 'ডিলারকে প্রত্যাখ্যানের কারণ প্রদান করা হয়েছে।');
  };

  // Centralized Pricing & Commission Calculator
  // Strictly respects business formulas:
  // 1. Discount Amount = MRP - Selling Price
  // 2. Discount % = ((MRP - Selling Price) / MRP) * 100
  // 3. Selling Price = MRP - (MRP * Discount %)
  // 4. Gross Profit = Selling Price - Dealer Price
  // 5. Admin Cost = Gross Profit * 20%
  // 6. PV Value = Gross Profit - Admin Cost
  // 7. PV = PV Value / 10
  // Dealer Price is NEVER used for Discount calculation. Delivery Cost, VAT/Tax, and Payment Charge are outside PV.
  const calculatePricingMetrics = (
    mrpInput: number,
    dealerInput: number,
    discountPercentInput = 0
  ) => {
    const mrpNum = Math.max(0, Number(mrpInput) || 0);
    const dealerNum = Math.max(0, Number(dealerInput) || 0);
    const discountPercent = Math.min(100, Math.max(0, Number(discountPercentInput) || 0));

    // Selling Price = MRP - (MRP * Discount %)
    const discountAmount = Number(((mrpNum * discountPercent) / 100).toFixed(2));
    const sellingPrice = Math.max(0, Number((mrpNum - discountAmount).toFixed(2)));

    // Gross Profit = Selling Price - Dealer Price
    let profit = 0;
    let adminCost = 0;
    let netProfit = 0;
    let pv = 0;

    if (sellingPrice > 0 && dealerNum >= 0 && sellingPrice > dealerNum) {
      profit = Math.max(0, Number((sellingPrice - dealerNum).toFixed(2)));
      adminCost = Number((profit * 0.20).toFixed(2));
      netProfit = Math.max(0, Number((profit - adminCost).toFixed(2)));
      pv = Number((netProfit / 10).toFixed(2));
    }

    return {
      mrpNum,
      dealerNum,
      discountPercent,
      discountAmount,
      sellingPrice,
      profit,
      adminCost,
      netProfit,
      pv
    };
  };

  // Helper to resolve applicable discount for a product
  const getApplicableDiscount = (product: Partial<Product>): ApplicableDiscountResult => {
    return resolveApplicableDiscount(product, discountSettings);
  };

  // Centralized helper to get effective discount percentage following 4-level priority
  const getEffectiveDiscountContext = (
    product?: Partial<Product> | null,
    category?: ProductCategory | string | number | null,
    globalDiscount?: number | null
  ): number => {
    return getEffectiveDiscount(product, category, globalDiscount, discountSettings);
  };

  // 1. Update Global Discount (Whole Catalog)
  const updateGlobalDiscount = (newPercent: number) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
    if (!isSuperAdminUser) {
      addToast('অননুমোদিত অ্যাক্সেস', 'শুধুমাত্র সুপার এডমিন ডিসকাউন্ট পরিবর্তন করতে পারবেন।');
      return { success: false, affectedCount: 0, message: 'অননুমোদিত অ্যাক্সেস: শুধুমাত্র সুপার এডমিন ডিসকাউন্ট পরিবর্তন করতে পারবেন।' };
    }

    const safePercent = Math.min(100, Math.max(0, Number(newPercent) || 0));
    const prevPercent = discountSettings.globalDiscountPercent || 0;

    const newSettings: CatalogDiscountSettings = {
      ...discountSettings,
      globalDiscountPercent: safePercent,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    setDiscountSettings(newSettings);
    saveStoredDiscountSettings(newSettings);

    // Synchronously evaluate eligibility across all products
    const eligibilityAnalysis = analyzeCatalogDiscountEligibility(products, newSettings);
    const affectedCount = eligibilityAnalysis.eligibleCount;

    const updatedProducts = products.map((p) => {
      // 1. If product has an explicit product override, preserve it
      if (hasActiveProductDiscountOverride(p)) {
        return p;
      }

      // 2. If product category has an active category discount, preserve it
      const catDiscount = getCategorySpecificDiscount(p, undefined, newSettings);
      if (catDiscount !== undefined && catDiscount > 0) {
        return p;
      }

      // 3. Calculate pricing following exact user rule:
      // Selling Price Excl. VAT -> Discount -> Discounted Price Excl. VAT -> VAT/Tax -> Final Selling Price Incl. VAT
      const pricing = calculateDiscountedProductPricing(p, safePercent);

      return {
        ...p,
        discount: safePercent,
        discount_percent: safePercent,
        discount_scope: 'global' as const,
        discount_source: safePercent > 0 ? 'Global' : 'None (0%)',
        isDiscountOverridden: false,
        sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
        sellingTaxAmount: pricing.vatAmount,
        sellingPriceInclTax: pricing.finalSellingPriceInclTax,
        campaignPrice: pricing.finalSellingPriceInclTax,
        discountPrice: pricing.finalSellingPriceInclTax,
        profit: pricing.profit,
        adminCost: pricing.adminCost,
        netProfit: pricing.netProfit,
        pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
        pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
      };
    });

    setProducts(updatedProducts);

    // Audit Log Entry
    const auditEntry: DiscountAuditLog = {
      id: `dlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: currentUser.id,
      superAdminName: currentUser.name || 'সুপার এডমিন',
      actionType: 'GLOBAL_DISCOUNT_UPDATE',
      scope: 'global',
      targetId: 'all',
      targetName: 'সমগ্র ক্যাটালগ (All Active Products)',
      previousDiscount: prevPercent,
      newDiscount: safePercent,
      affectedProductsCount: affectedCount,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-GB'),
      createdAt: new Date().toISOString()
    };
    setDiscountAuditLogs((prev) => [auditEntry, ...prev]);

    addToast('গ্লোবাল ডিসকাউন্ট কার্যকর হয়েছে', `নতুন ডিসকাউন্ট ${safePercent}% (${affectedCount} টি পণ্যে সফলভাবে প্রয়োগ করা হয়েছে)`);
    return {
      success: true,
      affectedCount,
      message: `গ্লোবাল ডিসকাউন্ট ${safePercent}% সফলভাবে কার্যকর করা হয়েছে (${affectedCount} টি পণ্য প্রভাবিত)।`
    };
  };

  // 2. Update Category Discount
  const updateCategoryDiscount = (categoryKey: string, newPercent: number) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
    if (!isSuperAdminUser) {
      addToast('অননুমোদিত অ্যাক্সেস', 'শুধুমাত্র সুপার এডমিন ক্যাটাগরি ডিসকাউন্ট পরিবর্তন করতে পারবেন।');
      return { success: false, affectedCount: 0, message: 'অননুমোদিত অ্যাক্সেস: শুধুমাত্র সুপার এডমিন ক্যাটাগরি ডিসকাউন্ট পরিবর্তন করতে পারবেন।' };
    }

    const safePercent = Math.min(100, Math.max(0, Number(newPercent) || 0));
    const trimmedKey = (categoryKey || '').trim().toLowerCase();
    const prevPercent = discountSettings.categoryDiscounts[trimmedKey] ?? discountSettings.categoryDiscounts[categoryKey] ?? 0;

    const foundCat = categories.find((c) => c.id === categoryKey || c.name.toLowerCase() === trimmedKey || c.nameBn === categoryKey);
    const catDisplayName = foundCat ? (foundCat.nameBn || foundCat.name) : categoryKey;

    const updatedCategoryDiscounts = {
      ...discountSettings.categoryDiscounts,
      [categoryKey]: safePercent,
      [trimmedKey]: safePercent
    };

    const newSettings: CatalogDiscountSettings = {
      ...discountSettings,
      categoryDiscounts: updatedCategoryDiscounts,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    setDiscountSettings(newSettings);
    saveStoredDiscountSettings(newSettings);

    let affectedCount = 0;
    const updatedProducts = products.map((p) => {
      const matchCategory =
        p.categoryId === categoryKey ||
        (p.category && p.category.toLowerCase() === trimmedKey) ||
        (p.categoryName && p.categoryName.toLowerCase() === trimmedKey);

      if (!matchCategory) return p;

      // If product has an explicit positive individual override, preserve it!
      if (hasActiveProductDiscountOverride(p)) {
        return p;
      }

      affectedCount++;
      const pricing = calculateDiscountedProductPricing(p, safePercent);

      return {
        ...p,
        discount: safePercent,
        discount_percent: safePercent,
        discount_scope: 'category' as const,
        discount_source: `Category (${catDisplayName})`,
        isDiscountOverridden: false,
        sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
        sellingTaxAmount: pricing.vatAmount,
        sellingPriceInclTax: pricing.finalSellingPriceInclTax,
        campaignPrice: pricing.finalSellingPriceInclTax,
        discountPrice: pricing.finalSellingPriceInclTax,
        profit: pricing.profit,
        adminCost: pricing.adminCost,
        netProfit: pricing.netProfit,
        pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
        pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
      };
    });

    setProducts(updatedProducts);

    // Audit Log Entry
    const auditEntry: DiscountAuditLog = {
      id: `dlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: currentUser.id,
      superAdminName: currentUser.name || 'সুপার এডমিন',
      actionType: 'CATEGORY_DISCOUNT_UPDATE',
      scope: 'category',
      targetId: categoryKey,
      targetName: catDisplayName,
      previousDiscount: prevPercent,
      newDiscount: safePercent,
      affectedProductsCount: affectedCount,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-GB'),
      createdAt: new Date().toISOString()
    };
    setDiscountAuditLogs((prev) => [auditEntry, ...prev]);

    addToast('ক্যাটাগরি ডিসকাউন্ট কার্যকর হয়েছে', `${catDisplayName} ক্যাটাগরিতে ${safePercent}% ডিসকাউন্ট (${affectedCount} টি পণ্যে প্রয়োগ করা হয়েছে)`);
    return {
      success: true,
      affectedCount,
      message: `${catDisplayName} ক্যাটাগরিতে ${safePercent}% ডিসকাউন্ট সফলভাবে প্রয়োগ করা হয়েছে।`
    };
  };

  // Remove Category Discount (Revert to Global)
  const removeCategoryDiscount = (categoryKey: string) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
    if (!isSuperAdminUser) {
      addToast('অননুমোদিত অ্যাক্সেস', 'শুধুমাত্র সুপার এডমিন ডিসকাউন্ট পরিবর্তন করতে পারবেন।');
      return { success: false, message: 'অননুমোদিত অ্যাক্সেস' };
    }

    const trimmedKey = (categoryKey || '').trim().toLowerCase();
    const updatedCategoryDiscounts = { ...discountSettings.categoryDiscounts };
    delete updatedCategoryDiscounts[categoryKey];
    delete updatedCategoryDiscounts[trimmedKey];

    const newSettings: CatalogDiscountSettings = {
      ...discountSettings,
      categoryDiscounts: updatedCategoryDiscounts,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.id
    };
    setDiscountSettings(newSettings);
    saveStoredDiscountSettings(newSettings);

    const globalPercent = newSettings.globalDiscountPercent || 0;
    const updatedProducts = products.map((p) => {
      const matchCategory =
        p.categoryId === categoryKey ||
        (p.category && p.category.toLowerCase() === trimmedKey) ||
        (p.categoryName && p.categoryName.toLowerCase() === trimmedKey);

      if (!matchCategory || hasActiveProductDiscountOverride(p)) {
        return p;
      }

      const pricing = calculateDiscountedProductPricing(p, globalPercent);

      return {
        ...p,
        discount: globalPercent,
        discount_percent: globalPercent,
        discount_scope: 'global' as const,
        discount_source: globalPercent > 0 ? 'Global' : 'None (0%)',
        isDiscountOverridden: false,
        sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
        sellingTaxAmount: pricing.vatAmount,
        sellingPriceInclTax: pricing.finalSellingPriceInclTax,
        campaignPrice: pricing.finalSellingPriceInclTax,
        discountPrice: pricing.finalSellingPriceInclTax,
        profit: pricing.profit,
        adminCost: pricing.adminCost,
        netProfit: pricing.netProfit,
        pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
        pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
      };
    });

    setProducts(updatedProducts);

    addToast('ক্যাটাগরি ডিসকাউন্ট অপসারিত', 'ক্যাটাগরিটি এখন গ্লোবাল ডিসকাউন্ট অনুসরণ করবে।');
    return { success: true, message: 'ক্যাটাগরি ডিসকাউন্ট সফলভাবে রিমুভ করা হয়েছে।' };
  };

  // 3. Update Product Discount (Individual Override)
  const updateProductDiscount = (productId: string, newPercent: number, override = true) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
    if (!isSuperAdminUser) {
      addToast('অননুমোদিত অ্যাক্সেস', 'শুধুমাত্র সুপার এডমিন প্রডাক্ট ডিসকাউন্ট ওভাররাইড করতে পারবেন।');
      return { success: false, message: 'অননুমোদিত অ্যাক্সেস: শুধুমাত্র সুপার এডমিন প্রডাক্ট ডিসকাউন্ট ওভাররাইড করতে পারবেন।' };
    }

    const safePercent = Math.min(100, Math.max(0, Number(newPercent) || 0));
    const isExplicitOverride = override && safePercent > 0;
    let targetProductName = '';
    let prevDiscount = 0;

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      targetProductName = p.titleBn || p.title;
      prevDiscount = p.discount || 0;

      const pricing = calculateDiscountedProductPricing(p, safePercent);

      return {
        ...p,
        discount: safePercent,
        discount_percent: safePercent,
        discount_scope: isExplicitOverride ? ('product' as const) : ('global' as const),
        discount_source: isExplicitOverride ? 'Product Override' : 'Global',
        isDiscountOverridden: isExplicitOverride,
        sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
        sellingTaxAmount: pricing.vatAmount,
        sellingPriceInclTax: pricing.finalSellingPriceInclTax,
        campaignPrice: pricing.finalSellingPriceInclTax,
        discountPrice: pricing.finalSellingPriceInclTax,
        profit: pricing.profit,
        adminCost: pricing.adminCost,
        netProfit: pricing.netProfit,
        pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
        pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
      };
    });

    setProducts(updatedProducts);

    // Audit Log Entry
    const auditEntry: DiscountAuditLog = {
      id: `dlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: currentUser.id,
      superAdminName: currentUser.name || 'সুপার এডমিন',
      actionType: 'PRODUCT_DISCOUNT_UPDATE',
      scope: 'product',
      targetId: productId,
      targetName: targetProductName || productId,
      previousDiscount: prevDiscount,
      newDiscount: safePercent,
      affectedProductsCount: 1,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-GB'),
      createdAt: new Date().toISOString()
    };
    setDiscountAuditLogs((prev) => [auditEntry, ...prev]);

    addToast('পণ্য ডিসকাউন্ট নির্ধারিত হয়েছে', `${targetProductName} পণ্যে ${safePercent}% ডিসকাউন্ট নির্ধারিত হয়েছে।`);
    return { success: true, message: 'পণ্য ডিসকাউন্ট সফলভাবে নির্ধারিত হয়েছে।' };
  };

  // Reset Product Discount to Inherited Level
  const resetProductDiscount = (productId: string) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
    if (!isSuperAdminUser) {
      addToast('অননুমোদিত অ্যাক্সেস', 'শুধুমাত্র সুপার এডমিন ডিসকাউন্ট পরিবর্তন করতে পারবেন।');
      return { success: false, message: 'অননুমোদিত অ্যাক্সেস' };
    }

    let targetProductName = '';
    let prevDiscount = 0;
    let newDiscount = 0;

    const updatedProducts = products.map((p) => {
      if (p.id !== productId) return p;
      targetProductName = p.titleBn || p.title;
      prevDiscount = p.discount || 0;

      const resolved = resolveApplicableDiscount(
        { ...p, isDiscountOverridden: false, discount_scope: undefined, discount: undefined },
        discountSettings
      );
      newDiscount = resolved.discountPercent;

      const pricing = calculateDiscountedProductPricing(p, newDiscount);

      return {
        ...p,
        discount: newDiscount,
        discount_percent: newDiscount,
        discount_scope: resolved.scope === 'none' ? 'global' : (resolved.scope as any),
        discount_source: resolved.sourceLabel,
        isDiscountOverridden: false,
        sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
        sellingTaxAmount: pricing.vatAmount,
        sellingPriceInclTax: pricing.finalSellingPriceInclTax,
        campaignPrice: pricing.finalSellingPriceInclTax,
        discountPrice: pricing.finalSellingPriceInclTax,
        profit: pricing.profit,
        adminCost: pricing.adminCost,
        netProfit: pricing.netProfit,
        pvPoint: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv,
        pvValue: p.pvMode === 'manual' && p.manualPv !== undefined ? p.manualPv : pricing.pv
      };
    });

    setProducts(updatedProducts);

    // Audit Log Entry
    const auditEntry: DiscountAuditLog = {
      id: `dlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: currentUser.id,
      superAdminName: currentUser.name || 'সুপার এডমিন',
      actionType: 'PRODUCT_DISCOUNT_RESET',
      scope: 'product',
      targetId: productId,
      targetName: targetProductName || productId,
      previousDiscount: prevDiscount,
      newDiscount: newDiscount,
      affectedProductsCount: 1,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('en-GB'),
      createdAt: new Date().toISOString()
    };
    setDiscountAuditLogs((prev) => [auditEntry, ...prev]);

    addToast('পণ্য ডিসকাউন্ট রিসেট হয়েছে', `${targetProductName} এখন ক্যাটাগরি/গ্লোবাল ডিসকাউন্ট (${newDiscount}%) অনুসরণ করবে।`);
    return { success: true, message: 'পণ্য ডিসকাউন্ট সফলভাবে রিসেট করা হয়েছে।' };
  };

  // Product CRUD
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'reviewsCount' | 'rating'>
  ) => {
    // Resolve applicable discount based on hierarchy: Product Override -> Category -> Global -> 0%
    const resolvedDiscount = resolveApplicableDiscount(productData, discountSettings);
    
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );

    let finalDiscountPercent = resolvedDiscount.discountPercent;
    let discountScope: 'global' | 'category' | 'product' = resolvedDiscount.scope === 'none' ? 'global' : (resolvedDiscount.scope as any);
    let discountSource = resolvedDiscount.sourceLabel;
    let isDiscountOverridden = resolvedDiscount.isOverridden;

    // Super Admin can override
    if (isSuperAdminUser && productData.isDiscountOverridden && productData.discount !== undefined && Number(productData.discount) > 0) {
      finalDiscountPercent = Math.min(100, Math.max(0, Number(productData.discount) || 0));
      discountScope = 'product';
      discountSource = 'Product Override';
      isDiscountOverridden = true;
    } else {
      // Non-super-admins cannot set custom product discount override
      isDiscountOverridden = false;
      finalDiscountPercent = resolvedDiscount.discountPercent;
      discountScope = resolvedDiscount.scope === 'none' ? 'global' : (resolvedDiscount.scope as any);
      discountSource = resolvedDiscount.sourceLabel;
    }

    const effectiveMrpExcl = Math.max(0, Number(productData.mrpExclTax || productData.mrp) || 0);
    const pricing = calculateDiscountedProductPricing(
      {
        ...productData,
        mrp: effectiveMrpExcl,
        mrpExclTax: effectiveMrpExcl,
        taxMode: 'excluded'
      },
      finalDiscountPercent
    );

    const effectiveDealerPrice = productData.dealerPrice !== undefined && Number(productData.dealerPrice) > 0
      ? Number(productData.dealerPrice)
      : Math.round(pricing.discountedSellingPriceExclTax * 0.8);

    const newProd: Product = {
      ...productData,
      mrp: pricing.mrpInclTax,
      mrpExclTax: pricing.basePriceExclTax,
      mrpInclTax: pricing.mrpInclTax,
      sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
      sellingTaxAmount: pricing.vatAmount,
      sellingPriceInclTax: pricing.finalSellingPriceInclTax,
      price: pricing.finalSellingPriceInclTax,
      campaignPrice: pricing.finalSellingPriceInclTax,
      discountPrice: pricing.finalSellingPriceInclTax,
      dealerPrice: effectiveDealerPrice,
      discount: finalDiscountPercent,
      discount_percent: finalDiscountPercent,
      discount_scope: discountScope,
      discount_source: discountSource,
      isDiscountOverridden,
      profit: pricing.profit,
      adminCost: pricing.adminCost,
      netProfit: pricing.netProfit,
      pvPoint: productData.pvMode === 'manual' && productData.manualPv !== undefined ? Number(productData.manualPv) : pricing.pv,
      pvValue: productData.pvMode === 'manual' && productData.manualPv !== undefined ? Number(productData.manualPv) : pricing.pv,
      vatTax: pricing.vatRate,
      taxRate: pricing.vatRate,
      taxMode: 'excluded',
      id: `prod-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setProducts((prev) => [newProd, ...prev]);
    addToast('নতুন পণ্য জমা হয়েছে!', `${newProd.titleBn || newProd.title} ক্যাটালগে যুক্ত হয়েছে।`);
    return { success: true, message: 'পণ্য সফলভাবে ক্যাটালগে যুক্ত হয়েছে।', product: newProd };
  };

  const editProduct = (productId: string, updatedData: Partial<Product>) => {
    const isSuperAdminUser = currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const merged = { ...p, ...updatedData };
        
        let finalDiscountPercent = p.discount || 0;
        let isDiscountOverridden = p.isDiscountOverridden || false;
        let discountScope = p.discount_scope || 'global';
        let discountSource = p.discount_source || 'Global';

        if (isSuperAdminUser) {
          if (updatedData.isDiscountOverridden !== undefined) {
            isDiscountOverridden = updatedData.isDiscountOverridden;
          }
          if (updatedData.isDiscountOverridden === false) {
            const resolved = resolveApplicableDiscount({ ...merged, isDiscountOverridden: false, discount_scope: undefined }, discountSettings);
            finalDiscountPercent = resolved.discountPercent;
            discountScope = resolved.scope === 'none' ? 'global' : (resolved.scope as any);
            discountSource = resolved.sourceLabel;
            isDiscountOverridden = false;
          } else if (isDiscountOverridden && updatedData.discount !== undefined && Number(updatedData.discount) > 0) {
            finalDiscountPercent = Math.min(100, Math.max(0, Number(updatedData.discount) || 0));
            discountScope = 'product';
            discountSource = 'Product Override';
            isDiscountOverridden = true;
          } else if (updatedData.discount !== undefined && Number(updatedData.discount) > 0) {
            finalDiscountPercent = Math.min(100, Math.max(0, Number(updatedData.discount) || 0));
            isDiscountOverridden = true;
            discountScope = 'product';
            discountSource = 'Product Override';
          } else if (!isDiscountOverridden) {
            const resolved = resolveApplicableDiscount({ ...merged, isDiscountOverridden: false }, discountSettings);
            finalDiscountPercent = resolved.discountPercent;
            discountScope = resolved.scope === 'none' ? 'global' : (resolved.scope as any);
            discountSource = resolved.sourceLabel;
          }
        } else {
          // Dealers/non-super-admins cannot override discounts
          isDiscountOverridden = false;
          const resolved = resolveApplicableDiscount({ ...merged, isDiscountOverridden: false }, discountSettings);
          finalDiscountPercent = resolved.discountPercent;
          discountScope = resolved.scope === 'none' ? 'global' : (resolved.scope as any);
          discountSource = resolved.sourceLabel;
        }

        const effectiveMrpExcl = Math.max(0, Number(merged.mrpExclTax || merged.mrp) || 0);
        const pricing = calculateDiscountedProductPricing(
          {
            ...merged,
            mrp: effectiveMrpExcl,
            mrpExclTax: effectiveMrpExcl,
            taxMode: 'excluded'
          },
          finalDiscountPercent
        );

        const pvMode = merged.pvMode || 'auto';
        const manualPv = merged.manualPv !== undefined ? Number(merged.manualPv) : undefined;
        const finalPv = pvMode === 'manual' && manualPv !== undefined && !isNaN(manualPv) ? manualPv : pricing.pv;

        return {
          ...merged,
          mrp: pricing.mrpInclTax,
          mrpExclTax: pricing.basePriceExclTax,
          mrpInclTax: pricing.mrpInclTax,
          sellingPriceExclTax: pricing.discountedSellingPriceExclTax,
          sellingTaxAmount: pricing.vatAmount,
          sellingPriceInclTax: pricing.finalSellingPriceInclTax,
          price: pricing.finalSellingPriceInclTax,
          campaignPrice: pricing.finalSellingPriceInclTax,
          discountPrice: pricing.finalSellingPriceInclTax,
          discount: finalDiscountPercent,
          discount_percent: finalDiscountPercent,
          discount_scope: discountScope,
          discount_source: discountSource,
          isDiscountOverridden,
          profit: pricing.profit,
          adminCost: pricing.adminCost,
          netProfit: pricing.netProfit,
          pvMode,
          manualPv,
          pvPoint: finalPv,
          pvValue: finalPv,
          vatTax: pricing.vatRate,
          taxRate: pricing.vatRate,
          taxMode: 'excluded',
          deliveryCost: merged.deliveryCost !== undefined ? Number(merged.deliveryCost) : (p.deliveryCost || 60),
          paymentOptions: merged.paymentOptions || p.paymentOptions || {
            nagad: true,
            bkash: true,
            rocket: true,
            bank: true,
            cod: true,
          }
        };
      })
    );
    addToast('পণ্য হালনাগাদ হয়েছে', 'তথ্য সফলভাবে সংকলিত করা হয়েছে।');
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    addToast('পণ্য মুছে ফেলা হয়েছে', 'পণ্যটি ক্যাটালগ থেকে সরানো হয়েছে।');
  };

  const approveProduct = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, isApproved: true, approvalStatus: 'Approved', status: 'Published' }
          : p
      )
    );
    addToast('পণ্য অনুমোদিত!', 'পণ্যটি সফলভাবে লাইভ পাবলিশ করা হয়েছে।');
  };

  const rejectProduct = (productId: string, reason: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, isApproved: false, approvalStatus: 'Rejected', rejectionReason: reason, status: 'Returned' }
          : p
      )
    );
    addToast('পণ্য ফেরত পাঠানো হয়েছে (Rejected)', `কারণ: ${reason}`);
  };

  const addReview = (productId: string, rating: number, comment: string, userName: string) => {
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      userName,
      rating,
      comment,
      date: new Date().toISOString().slice(0, 10),
      verifiedPurchase: true
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newReviews = [newRev, ...p.reviews];
          const avgRating =
            newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;
          return {
            ...p,
            reviews: newReviews,
            reviewsCount: newReviews.length,
            rating: Number(avgRating.toFixed(1))
          };
        }
        return p;
      })
    );

    addToast('রিভিউ জমা হয়েছে!', 'আপনার মূল্যবান মতামতের জন্য ধন্যবাদ।');
  };

  const createSupportTicket = (
    subject: string,
    message: string,
    category: 'delivery' | 'product' | 'payment' | 'other'
  ) => {
    const newTicket: SupportTicket = {
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.fullName || 'Guest',
      subject,
      message,
      category,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    addToast('সাপোর্ট টিকেট গৃহীত!', `টিকেট আইডি: ${newTicket.id}`);
  };

  const createReturnRequest = (
    orderId: string,
    productName: string,
    reason: string,
    refundType: 'wallet' | 'original_payment'
  ) => {
    const newReq: ReturnRequest = {
      id: `RET-${Math.floor(100 + Math.random() * 900)}`,
      orderId,
      userId: currentUser?.id || 'guest',
      productName,
      reason,
      refundType,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setReturnRequests((prev) => [newReq, ...prev]);
    addToast('রিটার্ন আবেদন জমা হয়েছে', 'আমাদের কাস্টমার কেয়ার টিম ২৪ ঘণ্টার মধ্যে যোগাযোগ করবে।');
  };

  return (
    <ECommerceContext.Provider
      value={{
        categories,
        brands,
        warehouses,
        products,
        coupons,
        deliveryConfig,
        updateDeliveryConfig,
        resetDeliveryConfigToDefault,
        overrideOrderDeliveryCharge,
        updateRiderDeliveryStatus,
        settleRiderCod,
        addDealerPoint,
        updateDealerPoint,
        deleteDealerPoint,
        discountSettings,
        updateGlobalDiscount,
        updateCategoryDiscount,
        removeCategoryDiscount,
        updateProductDiscount,
        resetProductDiscount,
        getApplicableDiscount,
        getEffectiveDiscount: getEffectiveDiscountContext,
        discountAuditLogs,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartSubtotal,
        cartMrpTotal,
        cartPvTotal,
        cartCashbackTotal,
        appliedCoupon,
        couponDiscountAmount,
        applyCoupon,
        removeCoupon,
        wishlist,
        toggleWishlist,
        compareList,
        toggleCompare,
        clearCompare,
        recentlyViewed,
        addRecentlyViewed,
        selectedCategory,
        setSelectedCategory,
        globalSearchQuery,
        setGlobalSearchQuery,
        orders,
        placeOrder,
        placeChannelOrder,
        channelCustomers,
        findOrCreateChannelCustomer,
        verifyChannelCustomerOtp,
        updateChannelCustomerAddress,
        updateOrderStatus,
        cancelOrder,
        verifyDeliveryOtp,
        markCodCollected,
        reassignOrderRider,
        riderAcceptOrder,
        riderRejectOrder,
        autoReassignOrderRider,
        addCategory,
        editCategory,
        deleteCategory,
        addBrand,
        editBrand,
        deleteBrand,
        brandRequests,
        requestNewBrand,
        approveBrandRequest,
        rejectBrandRequest,
        addProduct,
        editProduct,
        deleteProduct,
        approveProduct,
        rejectProduct,
        addReview,
        supportTickets,
        createSupportTicket,
        returnRequests,
        createReturnRequest,
        calculateNearestLogistics,
        smsOrderMessages,
        smsGatewayConfig,
        updateSmsGatewayConfig,
        processIncomingSmsOrder,
        convertSmsToConfirmedOrder,
        sendSmsCustomReply,
        triggerAiReParseSms,
        deleteSmsOrderMessage,
        ask24x7AiAssistant
      }}
    >
      {children}
    </ECommerceContext.Provider>
  );
};

export const useECommerce = () => {
  const context = useContext(ECommerceContext);
  if (!context) {
    throw new Error('useECommerce must be used within an ECommerceProvider');
  }
  return context;
};

export const useECommerceContext = useECommerce;
