/**
 * Multi-Channel Order Management System (OMS) Schema & Types
 * Project: AANO BAZAR / ঘরের বাজার বিডি
 *
 * Defines complete schemas, interfaces, enums, workflow state machines,
 * payment references, and validation structures for multi-channel ordering:
 * - 5+ Ingress Channels: Website, WhatsApp, Messenger, SMS, AI Voice Call, POS/Outlet
 * - Unique Customer Identity & Verification (Customer ID, Phone, OTP)
 * - Granular Order Items & Variants
 * - End-to-End Status Lifecycle & Workflow Transitions
 * - Payment References, Financials & Logistics Routing
 */

import { ServiceAddress } from '../types';

// ============================================================================
// 1. ORDER CHANNELS & CHANNEL METADATA
// ============================================================================

export type OMSOrderChannel =
  | 'website'
  | 'whatsapp'
  | 'messenger'
  | 'sms'
  | 'voice_call'
  | 'mobile_app'
  | 'pos_outlet';

export interface ChannelMetadata {
  channel: OMSOrderChannel;
  displayNameBn: string;
  displayNameEn: string;
  prefix: string;
  iconName: string;
  badgeBgColor: string;
  badgeTextColor: string;
  isAiAssisted?: boolean;
  requiresOtpVerification?: boolean;
}

export const CHANNEL_CONFIGS: Record<OMSOrderChannel, ChannelMetadata> = {
  website: {
    channel: 'website',
    displayNameBn: 'ওয়েবসাইট সরাসরি অর্ডার',
    displayNameEn: 'Website Direct Order',
    prefix: 'ORD-WEB',
    iconName: 'Globe',
    badgeBgColor: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeTextColor: 'text-emerald-800 dark:text-emerald-300',
    isAiAssisted: false,
    requiresOtpVerification: true,
  },
  whatsapp: {
    channel: 'whatsapp',
    displayNameBn: 'হোয়াটসঅ্যাপ বট শপ',
    displayNameEn: 'WhatsApp Bot Shop',
    prefix: 'ORD-WA',
    iconName: 'MessageSquare',
    badgeBgColor: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeTextColor: 'text-emerald-700 dark:text-emerald-300',
    isAiAssisted: true,
    requiresOtpVerification: true,
  },
  messenger: {
    channel: 'messenger',
    displayNameBn: 'মেসেঞ্জার অ্যাসিস্ট্যান্ট',
    displayNameEn: 'Messenger Assistant',
    prefix: 'ORD-MSG',
    iconName: 'MessageCircle',
    badgeBgColor: 'bg-blue-100 dark:bg-blue-950/80',
    badgeTextColor: 'text-blue-700 dark:text-blue-300',
    isAiAssisted: true,
    requiresOtpVerification: true,
  },
  sms: {
    channel: 'sms',
    displayNameBn: 'ইন্টারেক্টিভ এসএমএস পোর্টাল',
    displayNameEn: 'Interactive SMS Portal',
    prefix: 'ORD-SMS',
    iconName: 'Smartphone',
    badgeBgColor: 'bg-amber-100 dark:bg-amber-950/80',
    badgeTextColor: 'text-amber-800 dark:text-amber-300',
    isAiAssisted: false,
    requiresOtpVerification: true,
  },
  voice_call: {
    channel: 'voice_call',
    displayNameBn: 'এআই ভয়েস কল অর্ডার',
    displayNameEn: 'AI Voice Call Order',
    prefix: 'ORD-VOC',
    iconName: 'PhoneCall',
    badgeBgColor: 'bg-purple-100 dark:bg-purple-950/80',
    badgeTextColor: 'text-purple-700 dark:text-purple-300',
    isAiAssisted: true,
    requiresOtpVerification: true,
  },
  mobile_app: {
    channel: 'mobile_app',
    displayNameBn: 'মোবাইল অ্যাপ',
    displayNameEn: 'Mobile App',
    prefix: 'ORD-APP',
    iconName: 'Smartphone',
    badgeBgColor: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeTextColor: 'text-indigo-700 dark:text-indigo-300',
    isAiAssisted: false,
    requiresOtpVerification: true,
  },
  pos_outlet: {
    channel: 'pos_outlet',
    displayNameBn: 'ডিলার আউটলেট / POS',
    displayNameEn: 'Dealer Outlet / POS',
    prefix: 'ORD-POS',
    iconName: 'Store',
    badgeBgColor: 'bg-neutral-100 dark:bg-neutral-800',
    badgeTextColor: 'text-neutral-800 dark:text-neutral-200',
    isAiAssisted: false,
    requiresOtpVerification: false,
  },
};

// ============================================================================
// 2. CUSTOMER IDENTITY & PROFILE REFERENCE
// ============================================================================

export interface OMSCustomerReference {
  /** Permanent Unique Customer ID (e.g. CUST-98421) */
  customerId: string;
  /** Primary identifier (11 digits verified Bangladeshi mobile number) */
  mobileNumber: string;
  fullName: string;
  email?: string;
  isVerified: boolean;
  registeredChannel: OMSOrderChannel;
  /** Channel specific handle e.g. WhatsApp Phone, Messenger PSID */
  channelIdentifier?: string;
  /** Total past confirmed orders count */
  totalOrdersCount?: number;
  /** Customer classification tier */
  customerTier?: 'Standard' | 'Silver' | 'Gold' | 'VIP' | 'Wholesale';
}

// ============================================================================
// 3. ORDER ITEMS & LINE-ITEM PRICING
// ============================================================================

export interface OMSItemVariant {
  id: string;
  sku: string;
  name: string;
  nameBn?: string;
  price: number;
  mrp?: number;
  weightKg?: number;
  attributes?: Record<string, string>;
}

export interface OMSOrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productTitleBn?: string;
  productImage?: string;
  sku: string;
  barcode?: string;
  selectedVariant?: OMSItemVariant;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  discountAmount?: number;
  totalPrice: number;
  pvPoint?: number;
  vatAmount?: number;
  vendorId?: string;
  vendorShopName?: string;
  warehouseId?: string;
}

// ============================================================================
// 4. ORDER STATUS WORKFLOW & LIFECYCLE
// ============================================================================

/**
 * Standard Multi-Step Status Lifecycle
 */
export type OMSOrderStatus =
  | 'pending'            // 0. Initial Created State (Awaiting validation/OTP)
  | 'placed'             // 1. Validated & Placed
  | 'processing'         // 2. Processing in central hub
  | 'op_assigned'        // 3. Operations Partner Assigned
  | 'dealer_assigned'    // 4. Dealer Assigned
  | 'product_ready'      // 5. Packed & Ready for Dispatch
  | 'shipped'            // 6. Shipped / Dispatched
  | 'delivery_assigned'  // 7. Delivery Rider Assigned
  | 'picked_up'          // 8. Rider Picked Up from Hub/Dealer
  | 'out_for_delivery'   // 9. Out for Final Delivery to Customer
  | 'delivered'          // 10. Handed over & OTP Verified
  | 'completed'          // 11. Fully Reconciled & Closed
  | 'cancelled'          // X. Cancelled (Customer/Merchant)
  | 'returned'           // R. Returned / Disputed
  | 'refunded';          // RF. Refunded

export interface StatusWorkflowStep {
  status: OMSOrderStatus;
  stepNumber: number;
  labelBn: string;
  labelEn: string;
  descriptionBn: string;
  allowedNextStatuses: OMSOrderStatus[];
  badgeClass: string;
}

export const ORDER_STATUS_WORKFLOW_MAP: Record<OMSOrderStatus, StatusWorkflowStep> = {
  pending: {
    status: 'pending',
    stepNumber: 0,
    labelBn: 'পেন্ডিং / অপেক্ষমাণ',
    labelEn: 'Pending',
    descriptionBn: 'অর্ডারটি তৈরি হয়েছে কিন্তু এখনো চূড়ান্ত নিশ্চিত করা হয়নি।',
    allowedNextStatuses: ['placed', 'cancelled'],
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300',
  },
  placed: {
    status: 'placed',
    stepNumber: 1,
    labelBn: 'অর্ডার প্লেসড',
    labelEn: 'Order Placed',
    descriptionBn: 'গ্রাহক দ্বারা অর্ডার সফলভাবে প্লেস করা হয়েছে।',
    allowedNextStatuses: ['processing', 'op_assigned', 'cancelled'],
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300',
  },
  processing: {
    status: 'processing',
    stepNumber: 2,
    labelBn: 'প্রসেসিং হচ্ছে',
    labelEn: 'Processing',
    descriptionBn: 'সেন্ট্রাল অ্যাডমিন বা সেন্ট্রাল হাব কর্তৃক অর্ডার প্রক্রিয়াজাত হচ্ছে।',
    allowedNextStatuses: ['op_assigned', 'dealer_assigned', 'product_ready', 'cancelled'],
    badgeClass: 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300',
  },
  op_assigned: {
    status: 'op_assigned',
    stepNumber: 3,
    labelBn: 'অপারেশন্স পার্টনার নিযুক্ত',
    labelEn: 'OP Assigned',
    descriptionBn: 'সংশ্লিষ্ট এরিয়া বা উপজেলার অপারেশন্স পার্টনার নিযুক্ত করা হয়েছে।',
    allowedNextStatuses: ['dealer_assigned', 'product_ready', 'cancelled'],
    badgeClass: 'bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300',
  },
  dealer_assigned: {
    status: 'dealer_assigned',
    stepNumber: 4,
    labelBn: 'ডিলার আউটলেট নিযুক্ত',
    labelEn: 'Dealer Assigned',
    descriptionBn: 'নিকটস্থ ডিলার বা ডিস্ট্রিবিউটর আউটলেট নিযুক্ত করা হয়েছে।',
    allowedNextStatuses: ['product_ready', 'cancelled'],
    badgeClass: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300',
  },
  product_ready: {
    status: 'product_ready',
    stepNumber: 5,
    labelBn: 'পণ্য প্রস্তুত / প্যাকড',
    labelEn: 'Product Ready / Packed',
    descriptionBn: 'পণ্য গুদাম বা আউটলেট থেকে প্যাক করে শিপমেন্টের জন্য প্রস্তুত করা হয়েছে।',
    allowedNextStatuses: ['shipped', 'delivery_assigned', 'picked_up', 'cancelled'],
    badgeClass: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950/80 dark:text-cyan-300',
  },
  shipped: {
    status: 'shipped',
    stepNumber: 6,
    labelBn: 'শিপড / ডিসপ্যাচড',
    labelEn: 'Shipped',
    descriptionBn: 'পণ্য সেন্ট্রাল হাব বা আউটলেট থেকে রওয়ানা হয়েছে।',
    allowedNextStatuses: ['delivery_assigned', 'picked_up', 'out_for_delivery', 'returned'],
    badgeClass: 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300',
  },
  delivery_assigned: {
    status: 'delivery_assigned',
    stepNumber: 7,
    labelBn: 'ডেলিভারি রাইডার নিযুক্ত',
    labelEn: 'Rider Assigned',
    descriptionBn: 'গ্রাহকের ঠিকানায় পৌঁছানোর জন্য ডেলিভারি ম্যান/রাইডার নিযুক্ত করা হয়েছে।',
    allowedNextStatuses: ['picked_up', 'out_for_delivery', 'cancelled'],
    badgeClass: 'bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-300',
  },
  picked_up: {
    status: 'picked_up',
    stepNumber: 8,
    labelBn: 'রাইডার পিকড-আপ',
    labelEn: 'Picked Up',
    descriptionBn: 'ডেলিভারি রাইডার পার্সেল সংগ্রহ করেছেন।',
    allowedNextStatuses: ['out_for_delivery', 'returned'],
    badgeClass: 'bg-lime-100 text-lime-900 dark:bg-lime-950/80 dark:text-lime-300',
  },
  out_for_delivery: {
    status: 'out_for_delivery',
    stepNumber: 9,
    labelBn: 'ডেলিভারির জন্য বের হয়েছে',
    labelEn: 'Out for Delivery',
    descriptionBn: 'রাইডার গ্রাহকের ঠিকানার পথে রওয়ানা হয়েছেন।',
    allowedNextStatuses: ['delivered', 'returned'],
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 font-bold',
  },
  delivered: {
    status: 'delivered',
    stepNumber: 10,
    labelBn: 'ডেলিভার্ড',
    labelEn: 'Delivered',
    descriptionBn: 'গ্রাহক ওটিপি যাচাই সাপেক্ষে পণ্য সফলভাবে বুঝে পেয়েছেন।',
    allowedNextStatuses: ['completed', 'returned'],
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold',
  },
  completed: {
    status: 'completed',
    stepNumber: 11,
    labelBn: 'সম্পন্ন (Completed)',
    labelEn: 'Completed',
    descriptionBn: 'লেনদেন ও হিসাব সফলভাবে রিকনসিল এবং সমাপ্ত হয়েছে।',
    allowedNextStatuses: ['refunded', 'returned'],
    badgeClass: 'bg-green-100 text-green-900 dark:bg-green-950/80 dark:text-green-300 font-black',
  },
  cancelled: {
    status: 'cancelled',
    stepNumber: -1,
    labelBn: 'বাতিলকৃত (Cancelled)',
    labelEn: 'Cancelled',
    descriptionBn: 'অর্ডারটি বাতিল করা হয়েছে।',
    allowedNextStatuses: [],
    badgeClass: 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300',
  },
  returned: {
    status: 'returned',
    stepNumber: -2,
    labelBn: 'রিটার্নড (Returned)',
    labelEn: 'Returned',
    descriptionBn: 'পণ্য গ্রাহক কর্তৃক ফেরত পাঠানো হয়েছে।',
    allowedNextStatuses: ['refunded', 'completed'],
    badgeClass: 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300',
  },
  refunded: {
    status: 'refunded',
    stepNumber: -3,
    labelBn: 'রিফান্ডেড (Refunded)',
    labelEn: 'Refunded',
    descriptionBn: 'গ্রাহকের পরিশোধকৃত টাকা ফেরত দেওয়া হয়েছে।',
    allowedNextStatuses: [],
    badgeClass: 'bg-orange-100 text-orange-900 dark:bg-orange-950/80 dark:text-orange-300',
  },
};

export interface OMSStatusAuditEntry {
  id: string;
  status: OMSOrderStatus;
  updatedAt: string;
  updatedByUserId?: string;
  updatedByUserName?: string;
  updatedByRole: string;
  notes?: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// 5. PAYMENT REFERENCES & FINANCIALS
// ============================================================================

export type OMSPaymentMethod =
  | 'cod'               // Cash on Delivery
  | 'wallet'            // TOMSHOPBD Digital Wallet Balance
  | 'online_bkash'      // bKash PGW
  | 'online_nagad'      // Nagad PGW
  | 'online_rocket'     // Rocket PGW
  | 'online_card'       // Debit/Credit Card / SSLCommerz / Shurjopay
  | 'bank_transfer';    // Direct Bank Wire

export type OMSPaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'partially_paid'
  | 'failed'
  | 'refunded';

export interface OMSPaymentReference {
  paymentMethod: OMSPaymentMethod;
  paymentStatus: OMSPaymentStatus;
  currency: 'BDT';
  transactionId?: string;
  gatewayName?: string;
  bankAccountRef?: string;
  paidAmount: number;
  dueAmount: number;
  cashbackApplied?: number;
  couponCode?: string;
  couponDiscount?: number;
  deliveryCharge: number;
  vatTaxAmount: number;
  platformFee: number;
  totalMrpAmount: number;
  grandTotal: number;
  paidAt?: string;
  paymentReceiptUrl?: string;
}

// ============================================================================
// 6. OMS ROUTING & LOGISTICS REFERENCE
// ============================================================================

export interface OMSRoutingAssignment {
  opPartnerId?: string;
  opPartnerName?: string;
  opPartnerHubCode?: string;
  dealerId?: string;
  dealerName?: string;
  dealerShopName?: string;
  deliveryRiderId?: string;
  deliveryRiderName?: string;
  deliveryRiderPhone?: string;
  deliveryRiderVehicle?: string;
  routedDivision: string;
  routedDistrict: string;
  routedUpazila: string;
  routedUnionOrArea: string;
  routedAt: string;
  deliveryOtpCode?: string;
  deliveryOtpVerified?: boolean;
}

// ============================================================================
// 7. COMPREHENSIVE OMS ORDER INTERFACE
// ============================================================================

export interface OMSOrder {
  /** Unique Order Identification Number (e.g. ORD-WA-84721) */
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;

  /** Multi-Channel Ingress Configuration */
  orderChannel: OMSOrderChannel;
  voiceTranscript?: string;
  channelSpecificPayload?: Record<string, any>;

  /** Customer Linkage */
  customer: OMSCustomerReference;
  shippingAddress: ServiceAddress;
  billingAddress?: ServiceAddress;

  /** Items & Quantities */
  items: OMSOrderItem[];
  totalItemCount: number;

  /** Financials & Payment Details */
  financials: OMSPaymentReference;

  /** Lifecycle Status Workflow */
  orderStatus: OMSOrderStatus;
  statusHistory: OMSStatusAuditEntry[];

  /** Routing & Logistics Partner Assignment */
  routing: OMSRoutingAssignment;

  /** Special Instructions & Metadata */
  customerNotes?: string;
  adminNotes?: string;
  securityOtp: string;
  estimatedDeliveryDate?: string;
  deliveredAt?: string;
}

// ============================================================================
// 8. UTILITY FUNCTIONS & STATE VALIDATORS
// ============================================================================

/**
 * Validates if an order can transition from currentStatus to nextStatus
 */
export function canTransitionOrderStatus(
  currentStatus: OMSOrderStatus,
  nextStatus: OMSOrderStatus
): boolean {
  const currentStep = ORDER_STATUS_WORKFLOW_MAP[currentStatus];
  if (!currentStep) return false;
  return currentStep.allowedNextStatuses.includes(nextStatus);
}

/**
 * Generates formatted order ID with channel prefix and random digits
 */
export function generateChannelOrderId(channel: OMSOrderChannel): string {
  const config = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.website;
  const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
  return `${config.prefix}-${randomSuffix}`;
}

/**
 * Generates an official invoice number
 */
export function generateInvoiceNumber(orderId: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanId = orderId.replace(/^ORD-/, '');
  return `INV-${dateStr}-${cleanId}`;
}

/**
 * Calculates complete order financial breakdown
 */
export function calculateOrderFinancials(
  items: OMSOrderItem[],
  options?: {
    couponDiscount?: number;
    cashbackPct?: number;
    shippingCharge?: number;
    vatPct?: number;
    platformFee?: number;
  }
): {
  totalMrpAmount: number;
  subtotal: number;
  couponDiscount: number;
  cashbackApplied: number;
  shippingCharge: number;
  vatTaxAmount: number;
  platformFee: number;
  grandTotal: number;
  totalPvEarned: number;
} {
  const totalMrpAmount = items.reduce((sum, item) => sum + (item.mrp || item.unitPrice) * item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalPvEarned = items.reduce((sum, item) => sum + (item.pvPoint || 0) * item.quantity, 0);

  const couponDiscount = options?.couponDiscount || 0;
  const cashbackPct = options?.cashbackPct || 0;
  const cashbackApplied = Math.round(subtotal * (cashbackPct / 100));
  const shippingCharge = options?.shippingCharge !== undefined ? options.shippingCharge : 60;
  const vatPct = options?.vatPct !== undefined ? options.vatPct : 5;
  const vatTaxAmount = Math.round(subtotal * (vatPct / 100));
  const platformFee = options?.platformFee || 0;

  const grandTotal = Math.max(
    0,
    subtotal + shippingCharge + vatTaxAmount + platformFee - couponDiscount - cashbackApplied
  );

  return {
    totalMrpAmount,
    subtotal,
    couponDiscount,
    cashbackApplied,
    shippingCharge,
    vatTaxAmount,
    platformFee,
    grandTotal,
    totalPvEarned,
  };
}
