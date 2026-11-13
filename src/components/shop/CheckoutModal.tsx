/**
 * Complete Checkout & Order Placement Modal Component
 * Project: Apon Bazar / আপন বাজার
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CustomerRegistrationForm } from '../auth/CustomerRegistrationForm';
import { BrandLogo } from '../common/BrandLogo';
import { formatPV, formatTP } from '../../lib/ecommerce-data';
import {
  calculateProductPricing,
  calculatePaymentCharge,
  formatPrice,
  getOrderAvailablePaymentMethods,
  getStoredPaymentCharges
} from '../../lib/pricing';
import { calculateCartDelivery } from '../../lib/deliveryWeightCalculator';
import { downloadInvoicePDF, printInvoiceView } from '../../lib/invoicePdfGenerator';
import { ServiceAddress, PaymentMethod, Order } from '../../types';
import { BDAddressPicker, BDAddressFields } from '../common/BDAddressPicker';
import {
  getZoneByUpazila,
  getZoneForDealer,
  getZoneById,
  determineZoneDeliveryType,
  getStoredZoneRateConfig,
  calculateZoneDeliveryCost
} from '../../services/DeliveryZoneService';
import {
  X,
  CreditCard,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Download,
  ShoppingBag,
  Building2,
  DollarSign,
  Loader2,
  AlertCircle,
  Coins,
  QrCode,
  FileText,
  MapPin,
  Compass,
  ArrowRight
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  directProductOrder?: {
    product: any;
    selectedVariant?: any;
    quantity: number;
  };
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  directProductOrder
}) => {
  const { t } = useLanguage();
  const { currentUser, isLoggedIn, updateMandatoryAddress } = useAuth();
  const isCustomerAuthenticated = Boolean(isLoggedIn && currentUser && currentUser.id !== 'guest');
  const {
    cart,
    products,
    couponDiscountAmount,
    placeOrder,
    calculateNearestLogistics,
    deliveryConfig
  } = useECommerce();

  // Address Form State via BDAddressFields
  const [addressData, setAddressData] = useState<BDAddressFields>({
    division: currentUser?.mandatoryAddress?.division || 'ঢাকা',
    district: currentUser?.mandatoryAddress?.district || 'ঢাকা',
    upazila: currentUser?.mandatoryAddress?.upazila || 'ধানমন্ডি',
    unionName: currentUser?.mandatoryAddress?.unionName || 'ধানমন্ডি আ/এ',
    ward: currentUser?.mandatoryAddress?.ward || 'ওয়ার্ড ০১',
    area: currentUser?.mandatoryAddress?.area || 'সোবহানবাগ রোড, বাড়ি ২৭',
    marketBazar: currentUser?.mandatoryAddress?.marketBazar || 'রাপা প্লাজা',
    postalCode: currentUser?.mandatoryAddress?.postalCode || '১২০৯',
    fullServiceAddress: currentUser?.mandatoryAddress?.fullServiceAddress || 'সোবহানবাগ রোড, বাড়ি ২৭, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা, ঢাকা বিভাগ (১২০৯)',
    latitude: currentUser?.mandatoryAddress?.latitude || 23.7461,
    longitude: currentUser?.mandatoryAddress?.longitude || 90.3742
  });
  const [isPaurashava, setIsPaurashava] = useState<boolean>(currentUser?.mandatoryAddress?.isPaurashava !== undefined ? currentUser.mandatoryAddress.isPaurashava : true);
  const [distanceKm, setDistanceKm] = useState<number>(currentUser?.mandatoryAddress?.distanceKm !== undefined ? currentUser.mandatoryAddress.distanceKm : 1);
  const [isAddressValid, setIsAddressValid] = useState<boolean>(true);

  // Delivery, Payment, Loading, Error
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [notes, setNotes] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentAddress: ServiceAddress = {
    id: 'addr-checkout',
    userId: currentUser?.id || 'guest',
    title: 'চেকআউট ডেলিভারি ঠিকানা',
    division: addressData.division,
    district: addressData.district,
    upazila: addressData.upazila,
    unionName: addressData.unionName,
    ward: addressData.ward,
    area: addressData.area,
    marketBazar: addressData.marketBazar,
    postalCode: addressData.postalCode,
    fullServiceAddress: addressData.fullServiceAddress,
    latitude: addressData.latitude,
    longitude: addressData.longitude,
    isPaurashava,
    distanceKm,
    isMandatoryServiceAddress: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const logistics = calculateNearestLogistics(currentAddress);

  // Dynamic Price & Order Summary Calculations from Cart / Product Data
  const checkoutItems = directProductOrder
    ? [
        (() => {
          const pricing = calculateProductPricing(
            directProductOrder.product,
            directProductOrder.quantity,
            directProductOrder.selectedVariant
          );
          return {
            title: directProductOrder.product.titleBn || directProductOrder.product.title,
            quantity: directProductOrder.quantity,
            mrp: pricing.mrp,
            sellingPrice: pricing.sellingPrice,
            discount: pricing.totalDiscount,
            itemTotal: pricing.totalSellingPrice,
            itemMrpTotal: pricing.totalMrp,
            pv: pricing.totalPv,
            cashback: Math.round((pricing.sellingPrice * (directProductOrder.product.cashbackPct || 0)) / 100) * directProductOrder.quantity
          };
        })()
      ]
    : cart.map((item) => {
        const pricing = calculateProductPricing(item.product, item.quantity, item.selectedVariant);
        return {
          title: item.productTitle || item.product?.titleBn || item.product?.title || 'পণ্য',
          quantity: item.quantity,
          mrp: pricing.mrp,
          sellingPrice: pricing.sellingPrice,
          discount: pricing.totalDiscount,
          itemTotal: pricing.totalSellingPrice,
          itemMrpTotal: pricing.totalMrp,
          pv: pricing.totalPv,
          cashback: Math.round((pricing.sellingPrice * (item.product?.cashbackPct || 0)) / 100) * item.quantity
        };
      });

  const totalMrp = checkoutItems.reduce((acc, item) => acc + item.itemMrpTotal, 0);
  const totalSellingPrice = checkoutItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const totalDiscount = Math.max(0, totalMrp - totalSellingPrice);
  const totalPv = checkoutItems.reduce((acc, item) => acc + item.pv, 0);
  const couponDiscount = directProductOrder ? 0 : couponDiscountAmount;

  // Products involved in this checkout
  const orderProducts = useMemo(() => {
    if (directProductOrder) {
      return [directProductOrder.product];
    }
    return cart.map((i) => i.product || products.find((p) => p.id === i.productId)).filter(Boolean);
  }, [directProductOrder, cart, products]);

  // Determine allowed payment methods based on products in the order
  const availablePaymentOptions = useMemo(() => {
    return getOrderAvailablePaymentMethods(orderProducts);
  }, [orderProducts]);

  // Load configured payment charges (e.g. customized by Super Admin)
  const paymentChargesConfig = useMemo(() => {
    return getStoredPaymentCharges();
  }, []);

  // Gracefully fallback if selected payment method is not allowed by this order's products
  useEffect(() => {
    if (paymentMethod === 'cod' && !availablePaymentOptions.cod) {
      if (availablePaymentOptions.bkash) setPaymentMethod('online_bkash');
      else if (availablePaymentOptions.nagad) setPaymentMethod('online_nagad');
      else if (availablePaymentOptions.rocket) setPaymentMethod('online_rocket');
      else if (availablePaymentOptions.bank) setPaymentMethod('bank_transfer');
      else setPaymentMethod('wallet');
    } else if (paymentMethod === 'online_bkash' && !availablePaymentOptions.bkash) {
      if (availablePaymentOptions.cod) setPaymentMethod('cod');
      else if (availablePaymentOptions.nagad) setPaymentMethod('online_nagad');
      else if (availablePaymentOptions.rocket) setPaymentMethod('online_rocket');
      else if (availablePaymentOptions.bank) setPaymentMethod('bank_transfer');
      else setPaymentMethod('wallet');
    } else if (paymentMethod === 'online_nagad' && !availablePaymentOptions.nagad) {
      if (availablePaymentOptions.cod) setPaymentMethod('cod');
      else if (availablePaymentOptions.bkash) setPaymentMethod('online_bkash');
      else if (availablePaymentOptions.rocket) setPaymentMethod('online_rocket');
      else if (availablePaymentOptions.bank) setPaymentMethod('bank_transfer');
      else setPaymentMethod('wallet');
    } else if (paymentMethod === 'online_rocket' && !availablePaymentOptions.rocket) {
      if (availablePaymentOptions.cod) setPaymentMethod('cod');
      else if (availablePaymentOptions.bkash) setPaymentMethod('online_bkash');
      else if (availablePaymentOptions.nagad) setPaymentMethod('online_nagad');
      else if (availablePaymentOptions.bank) setPaymentMethod('bank_transfer');
      else setPaymentMethod('wallet');
    } else if (paymentMethod === 'bank_transfer' && !availablePaymentOptions.bank) {
      if (availablePaymentOptions.cod) setPaymentMethod('cod');
      else if (availablePaymentOptions.bkash) setPaymentMethod('online_bkash');
      else if (availablePaymentOptions.nagad) setPaymentMethod('online_nagad');
      else if (availablePaymentOptions.rocket) setPaymentMethod('online_rocket');
      else setPaymentMethod('wallet');
    }
  }, [availablePaymentOptions, paymentMethod]);

  // Delivery Cost: computed dynamically from product and variant weights (Formula: Variant Weight × Quantity)
  const deliveryCalcResult = useMemo(() => {
    const itemsList = directProductOrder
      ? [
          {
            product: directProductOrder.product,
            selectedVariant: directProductOrder.selectedVariant,
            quantity: directProductOrder.quantity
          }
        ]
      : cart
          .map((i) => ({
            product: (i.product || products.find((p) => p.id === i.productId))!,
            selectedVariant: i.selectedVariant,
            quantity: i.quantity
          }))
          .filter((i) => Boolean(i.product));

    return calculateCartDelivery(
      itemsList,
      currentAddress,
      products,
      products,
      distanceKm,
      deliveryConfig
    );
  }, [directProductOrder, cart, products, currentAddress, distanceKm, deliveryConfig]);

  // Delivery Zone Foundation (1 Upazila/Thana = 1 Delivery Zone)
  // Step 1: Customer selects Division -> District -> Upazila/Thana => System automatically identifies Customer Zone
  const customerZone = useMemo(() => {
    return getZoneByUpazila(addressData.upazila, addressData.district, addressData.division);
  }, [addressData.upazila, addressData.district, addressData.division]);

  // Dealer Zone is determined from the order's product seller or registered dealer address
  const dealerZone = useMemo(() => {
    const firstProd = orderProducts[0];
    if (firstProd?.zone_id) {
      return getZoneById(firstProd.zone_id) || getZoneForDealer({ upazila: firstProd.upazila, district: firstProd.district });
    }
    return getZoneForDealer({ upazila: firstProd?.upazila, district: firstProd?.district });
  }, [orderProducts]);

  // First Delivery Cost Decision: Dealer Zone ID === Customer Zone ID ? WITHIN_ZONE : ZONE_TO_ZONE
  const zoneDecision = useMemo(() => {
    return determineZoneDeliveryType(dealerZone, customerZone);
  }, [dealerZone, customerZone]);

  const zoneRateConfig = useMemo(() => {
    return getStoredZoneRateConfig();
  }, []);

  const zoneDeliveryCalc = useMemo(() => {
    return calculateZoneDeliveryCost({
      dealerZone,
      customerZone,
      totalWeightKg: deliveryCalcResult.totalWeightKg || 1,
      distanceKm,
      rateConfig: zoneRateConfig,
      orderSubtotal: totalSellingPrice
    });
  }, [dealerZone, customerZone, deliveryCalcResult.totalWeightKg, distanceKm, zoneRateConfig, totalSellingPrice]);

  // Configurable Delivery Charge (Super Admin configured Within Zone vs Zone-to-Zone rates)
  const shippingCharge = zoneDeliveryCalc.totalCost !== undefined
    ? zoneDeliveryCalc.totalCost
    : (deliveryCalcResult.totalDeliveryCost !== undefined ? deliveryCalcResult.totalDeliveryCost : 60);

  // VAT/Tax: computed from product's configured VAT % on MRP
  const taxAmount = useMemo(() => {
    if (directProductOrder) {
      const vatRate = directProductOrder.product.vatTax !== undefined ? Number(directProductOrder.product.vatTax) : 5;
      return Math.round((directProductOrder.product.mrp || 0) * (vatRate / 100) * directProductOrder.quantity);
    }
    return checkoutItems.reduce((acc, item, idx) => {
      const prod = cart[idx]?.product || products.find((p) => p.id === cart[idx]?.productId);
      const vatRate = prod?.vatTax !== undefined ? Number(prod.vatTax) : 5;
      return acc + Math.round(item.itemMrpTotal * (vatRate / 100));
    }, 0);
  }, [directProductOrder, cart, products, checkoutItems]);

  // Subtotal = Selling Price + Delivery Cost + VAT/Tax
  const checkoutSubtotal = totalSellingPrice + shippingCharge + taxAmount;
  const paymentChargeResult = calculatePaymentCharge(checkoutSubtotal, paymentMethod, paymentChargesConfig);
  const paymentCharge = paymentChargeResult.charge;

  // Total Amount = Subtotal + Payment Charge (- couponDiscount if any)
  const totalPayable = Number((checkoutSubtotal + paymentCharge - couponDiscount).toFixed(2));

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAddressValid) {
      setErrorMessage('অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা (বিভাগ, জেলা, উপজেলা, এলাকা ও পোস্টাল কোড) সঠিকভাবে নির্দেশ করুন।');
      return;
    }

    if (!addressData.area || !addressData.area.trim()) {
      setErrorMessage('অনুগ্রহ করে ডেলিভারি এলাকা, সড়ক অথবা গৃহ নম্বর পূরণ করুন।');
      return;
    }

    if (!directProductOrder && (!cart || cart.length === 0)) {
      setErrorMessage('আপনার শপিং কার্ট খালি! অনুগ্রহ করে কোনো পণ্য কার্টে যোগ করে পুনরায় চেষ্টা করুন।');
      return;
    }

    setIsPlacingOrder(true);

    try {
      if (updateMandatoryAddress) {
        updateMandatoryAddress(currentAddress);
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      const order = placeOrder(
        currentAddress,
        paymentMethod,
        notes,
        directProductOrder
      );

      if (order) {
        setConfirmedOrder(order);
      } else {
        setErrorMessage('অর্ডার প্লেস করা সম্ভব হয়নি! অনুগ্রহ করে তথ্য পরীক্ষা করে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(
        err?.message || 'অর্ডার প্রসেস করার সময় সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="xs" iconOnly={true} className="shrink-0" />
            <h2 className="font-black text-neutral-900 dark:text-white text-base">
              {confirmedOrder
                ? 'অর্ডার ইনভয়েস ও কনফার্মেশন'
                : !isCustomerAuthenticated
                ? 'কাস্টমার রেজিস্ট্রেশন (Customer Only)'
                : 'অর্ডার চেকআউট ও ডেলিভারি গেটওয়ে'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {confirmedOrder ? (
          /* Printable Invoice Screen */
          <div className="p-6 space-y-6 print:p-0">
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                ধন্যবাদ! আপনার অর্ডার সফলভাবে গৃহীত হয়েছে।
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                অর্ডার নম্বর: <strong className="font-mono text-sm">{confirmedOrder.id}</strong>
              </p>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                অর্ডার স্ট্যাটাস: <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2.5 py-0.5 rounded-md font-mono text-xs uppercase">Order Placed</span>
              </p>
              <div className="inline-block px-3 py-1 bg-white dark:bg-neutral-900 rounded-lg text-xs font-bold text-neutral-800 dark:text-neutral-200 border border-emerald-300">
                ডেলিভারি ওটিপি কোড: <strong className="text-rose-600 font-mono text-sm">{confirmedOrder.otpCode}</strong> (রাইডারকে দেখাবেন)
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div id={`checkout-printable-invoice-${confirmedOrder.id}`} className="p-5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                <div className="flex items-center gap-3">
                  <BrandLogo size="md" iconOnly={true} className="shrink-0" />
                  <div>
                    <h4 className="font-black text-neutral-900 dark:text-white text-base flex items-center gap-1.5">
                      <span className="text-emerald-700 dark:text-emerald-400">Apon</span>
                      <span className="text-orange-500">Bazar</span>
                      <span className="text-xs font-bold text-neutral-500">ইনভয়েস (Official Invoice)</span>
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Invoice No: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{confirmedOrder.invoiceNumber || `INV-${confirmedOrder.id}`}</strong> • তারিখ: {confirmedOrder.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => downloadInvoicePDF(confirmedOrder, `checkout-printable-invoice-${confirmedOrder.id}`)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="px-3.5 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-neutral-300 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>প্রিন্ট</span>
                  </button>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-neutral-500 block text-[10px]">গ্রাহকের নাম ও সার্ভিস ঠিকানা:</span>
                  <p className="font-bold text-neutral-900 dark:text-white">{confirmedOrder.customerName || 'গ্রাহক'}</p>
                  <p className="text-neutral-600 dark:text-neutral-300">ফোন: {confirmedOrder.customerPhone || 'N/A'}</p>
                  <p className="text-neutral-500 text-[11px]">
                    {confirmedOrder.shippingAddress?.fullServiceAddress ||
                      [
                        confirmedOrder.shippingAddress?.area,
                        confirmedOrder.shippingAddress?.unionName,
                        confirmedOrder.shippingAddress?.upazila,
                        confirmedOrder.shippingAddress?.district
                      ].filter(Boolean).join(', ') || 'ঠিকানা সংগৃহীত'}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-neutral-500 block text-[10px]">অটো-অ্যাসাইন লজিস্টিকস হাব:</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{confirmedOrder.logistics?.vendorShopName || 'কেন্দ্রীয় লজিস্টিকস হাব'}</p>
                  <p className="text-neutral-600 dark:text-neutral-300 text-[11px]">
                    নির্ধারিত রাইডার: {confirmedOrder.logistics?.riderName || 'রাইডার পাওয়া যায়নি'}
                    {confirmedOrder.logistics?.riderFound && confirmedOrder.logistics?.riderDistanceKm ? ` (${confirmedOrder.logistics.riderDistanceKm} km)` : ''}
                  </p>
                  <p className="text-neutral-500 text-[11px]">পেমেন্ট মেথড: {(confirmedOrder.paymentMethod || 'cod').toUpperCase()}</p>
                </div>
              </div>

              {/* Delivery Zone Foundation Snapshot on Invoice */}
              {confirmedOrder.zoneSnapshot && (
                <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ডেলিভারি জোন স্ন্যাপশট (Delivery Zone Snapshot)</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      confirmedOrder.zoneSnapshot.deliveryType === 'WITHIN_ZONE'
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200'
                    }`}>
                      {confirmedOrder.zoneSnapshot.deliveryTypeBn}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">গ্রাহক জোন (Customer Zone):</span>
                      <strong>{confirmedOrder.zoneSnapshot.customerZone.zone_name_bn}</strong> ({confirmedOrder.zoneSnapshot.customerZone.division} → {confirmedOrder.zoneSnapshot.customerZone.district} → {confirmedOrder.zoneSnapshot.customerZone.upazila})
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">ডিলার জোন (Dealer Pickup Zone):</span>
                      <strong>{confirmedOrder.zoneSnapshot.dealerZone.zone_name_bn}</strong> ({confirmedOrder.zoneSnapshot.dealerZone.division} → {confirmedOrder.zoneSnapshot.dealerZone.district} → {confirmedOrder.zoneSnapshot.dealerZone.upazila})
                    </div>
                  </div>
                </div>
              )}

              {/* 1. Ordered Products List */}
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 space-y-2">
                <span className="font-extrabold text-neutral-900 dark:text-white block text-xs uppercase tracking-wider">
                  ১. পণ্যের তালিকা (Ordered Products):
                </span>
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                        <th className="p-2.5">Product Name</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-right">MRP</th>
                        <th className="p-2.5 text-right">Item Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {(confirmedOrder.items || []).map((item, idx) => {
                        const itemTitle = item.productTitle || item.product?.titleBn || item.product?.title || 'পণ্য';
                        const qty = item.quantity || 1;
                        const itemMrp = item.product?.mrp || item.mrp || item.unitPrice || 0;
                        const lineTotal = itemMrp * qty;

                        return (
                          <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                            <td className="p-2.5 font-medium text-neutral-900 dark:text-white">{itemTitle}</td>
                            <td className="p-2.5 text-center font-bold font-mono text-neutral-800 dark:text-neutral-200">{qty}</td>
                            <td className="p-2.5 text-right font-bold font-mono text-neutral-700 dark:text-neutral-300">৳{itemMrp.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">৳{lineTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Summary Calculation */}
              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
                <span className="font-black text-neutral-900 dark:text-white block border-b border-neutral-200 dark:border-neutral-700 pb-1">
                  Order Summary
                </span>
                
                {(() => {
                  const confItems = confirmedOrder.items || [];
                  const mrpTot = confirmedOrder.mrpTotal || confItems.reduce((sum, ci) => sum + ((ci.product?.mrp || ci.mrp || ci.unitPrice || 0) * (ci.quantity || 1)), 0);
                  const sellingTot = confirmedOrder.subtotal || confItems.reduce((sum, ci) => sum + ((ci.unitPrice || 0) * (ci.quantity || 1)), 0);
                  const disc = Math.max(0, mrpTot - sellingTot);
                  const cpnDisc = confirmedOrder.couponDiscount || 0;
                  const del = confirmedOrder.shippingCharge ?? 60;
                  const vat = confirmedOrder.tax ?? Math.round(mrpTot * 0.05);
                  const payCharge = confirmedOrder.paymentCharge || 0;
                  const totPv = confirmedOrder.pvEarned ?? confItems.reduce((sum, ci) => sum + (ci.pvPoint || ((ci.product?.pvValue || 0) * (ci.quantity || 1))), 0);
                  const totPay = confirmedOrder.grandTotal || Number((sellingTot + del + vat + payCharge - cpnDisc).toFixed(2));
                  const payResult = calculatePaymentCharge(sellingTot + del + vat, confirmedOrder.paymentMethod);

                  return (
                    <div className="space-y-2 text-xs font-semibold">
                      {/* 1. Selling Price */}
                      <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                        <span>Selling Price</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{formatPrice(sellingTot)}</span>
                      </div>

                      {/* 2. Delivery Cost */}
                      <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                        <span>Delivery Cost</span>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">{formatPrice(del)}</span>
                      </div>

                      {/* 3. VAT/Tax */}
                      <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                        <span>VAT/Tax</span>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">{formatPrice(vat)}</span>
                      </div>

                      {/* 4. PV */}
                      <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                        <span className="font-bold">PV</span>
                        <span className="font-mono font-bold text-sm">{formatPV(totPv)} PV</span>
                      </div>

                      {/* 5. Payment Charge */}
                      <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                        <span>Payment Charge{payResult.rate > 0 ? ` (${payResult.percentText})` : ''}</span>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">{formatPrice(payCharge)}</span>
                      </div>

                      {cpnDisc > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                          <span>Coupon Discount</span>
                          <span className="font-mono font-bold text-sm">- {formatPrice(cpnDisc)}</span>
                        </div>
                      )}

                      {/* 6. Total Amount */}
                      <div className="border-t border-neutral-300 dark:border-neutral-700 pt-2 flex justify-between items-center text-sm font-black text-neutral-900 dark:text-white">
                        <span>Total Amount</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-bold">{formatPrice(totPay)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-800"
              >
                ড্যাশবোর্ডে ফিরে যান
              </button>
            </div>
          </div>
        ) : !isCustomerAuthenticated ? (
          /* Customer Only Registration / Login View */
          <div className="p-4 sm:p-6">
            <CustomerRegistrationForm
              source="checkout"
              title="কাস্টমার রেজিস্ট্রেশন (Customer Only)"
              subtitle="অর্ডার সম্পন্ন করতে কাস্টমার একাউন্টে প্রবেশ করুন"
              pendingProductName={
                directProductOrder
                  ? (directProductOrder.product.titleBn || directProductOrder.product.title)
                  : (cart[0]?.product?.titleBn || cart[0]?.product?.title || cart[0]?.productTitle || 'Tooth Paste')
              }
              pendingQuantity={
                directProductOrder
                  ? directProductOrder.quantity
                  : (cart.reduce((sum, item) => sum + item.quantity, 0) || 1)
              }
              showTabs={true}
              onClose={onClose}
              onSuccess={(summary) => {
                if (summary.fullServiceAddress) {
                  setAddressData((prev) => ({
                    ...prev,
                    fullServiceAddress: summary.fullServiceAddress
                  }));
                }
              }}
            />
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleConfirmOrder} className="p-6 space-y-6">
            
            {/* 1. Address Selection via BDAddressPicker */}
            <div className="space-y-3">
              <BDAddressPicker
                initialAddress={addressData}
                onChange={(data, valid) => {
                  setAddressData(data);
                  setIsAddressValid(valid);
                }}
                lang="bn"
                title="১. শিপিং, বিলিং ও ডেলিভারি সার্ভিস ঠিকানা (বাংলাদেশ প্রশাসনিক এড্রেস সিষ্টেম)"
                subtitle="আপনার সঠিক বিভাগ, জেলা, উপজেলা, ইউনিয়ন, ওয়ার্ড, গ্রাম ও বাজার পছন্দ করুন"
              />

              {/* Delivery Zone Decision & Location Foundation */}
              <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-indigo-50/80 dark:from-emerald-950/40 dark:via-neutral-900/80 dark:to-indigo-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3.5 text-xs">
                
                {/* Header: Zone Architecture Notice */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-neutral-700/60 pb-2.5">
                  <div className="flex items-center gap-2 font-black text-neutral-900 dark:text-white">
                    <Compass className="w-4 h-4 text-emerald-600" />
                    <span>১ উপজেলা = ১ ডেলিভারি জোন (Foundation Delivery Zone System)</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-black text-xs shadow-xs flex items-center gap-1.5 ${
                    zoneDecision.isSameZone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    {zoneDecision.isSameZone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>WITHIN ZONE (একই জোন)</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>ZONE TO ZONE (জোন টু জোন)</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 2 Zones Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Zone */}
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-emerald-300 dark:border-emerald-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> গ্রাহক ডেলিভারি জোন (Customer Zone)
                      </span>
                      <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        ID: {customerZone.zone_id}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                      {customerZone.zone_name_bn}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {customerZone.division_name} বিভাগ → {customerZone.district_name} জেলা → {customerZone.upazila_name} উপজেলা
                    </p>
                  </div>

                  {/* Dealer Zone */}
                  <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> ডিলার পিকআপ জোন (Dealer Zone)
                      </span>
                      <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 px-1.5 py-0.5 rounded font-bold">
                        ID: {dealerZone.zone_id}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                      {dealerZone.zone_name_bn}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {dealerZone.division_name} বিভাগ → {dealerZone.district_name} জেলা → {dealerZone.upazila_name} উপজেলা
                    </p>
                  </div>
                </div>

                {/* Delivery Decision & Cost Explanation */}
                <div className="p-3 bg-white/90 dark:bg-neutral-900/90 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>ডেলিভারি ধরন:</span>
                      <strong className={zoneDecision.isSameZone ? 'text-emerald-600' : 'text-indigo-600'}>
                        {zoneDecision.deliveryTypeBn}
                      </strong>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {zoneDecision.appliedReason}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="text-[10px] text-neutral-400 block font-sans">নির্ধারিত ডেলিভারি চার্জ:</span>
                    <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      ৳ {shippingCharge}
                    </span>
                    <span className="text-[10px] text-neutral-400 block font-mono">
                      (বেস রেট: ৳{zoneDeliveryCalc.baseRate})
                    </span>
                  </div>
                </div>

                {/* Refinements: Paurashava & Distance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                  {/* Paurashava status toggle */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 block">
                      এলাকার ধরন (পৌরসভা / ইউনিয়ন):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPaurashava(true)}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                          isPaurashava
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        পৌরসভা / সিটি কর্পোরেশন
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPaurashava(false)}
                        className={`py-1.5 px-3 rounded-xl font-bold text-xs border text-center transition-all ${
                          !isPaurashava
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        ইউনিয়ন / গ্রামীণ এলাকা
                      </button>
                    </div>
                  </div>

                  {/* Distance (KM) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <label className="font-semibold text-neutral-600 dark:text-neutral-300">
                        নিকটস্থ ডিলার হাব হতে দূরত্ব:
                      </label>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {distanceKm} কিমি
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0.5"
                        max="30"
                        step="0.5"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Math.max(0.5, Number(e.target.value) || 0.5))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0.5"
                        max="50"
                        step="0.5"
                        value={distanceKm}
                        onChange={(e) => setDistanceKm(Math.max(0.5, Number(e.target.value) || 0.5))}
                        className="w-16 p-1.5 text-center font-mono font-bold border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {deliveryCalcResult.deliverySnapshot?.deliveryModeLabel && (
                  <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 bg-white/70 dark:bg-neutral-900/60 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="font-semibold">ডেলিভারি মোড: {deliveryCalcResult.deliverySnapshot.deliveryModeLabel}</span>
                    <span className="font-mono font-bold">মোট ওজন: {deliveryCalcResult.deliverySnapshot.totalWeightDisplay || `${deliveryCalcResult.deliverySnapshot.totalWeightKg} kg`}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Auto Nearest Logistics Engine */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Building2 className="w-4 h-4" />
                <span>২. অটো-অ্যাসাইন লজিস্টিকস ও নিকটস্থ রাইডার নির্বাচন</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">নিকটস্থ ভেন্ডর শপ:</span>
                  <span className="font-bold text-neutral-900 dark:text-white block truncate">{logistics.vendorShopName}</span>
                  <span className="text-emerald-600 font-mono">দূরত্ব: {logistics.vendorDistanceKm} km</span>
                </div>

                <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">আঞ্চলিক হাব কোড:</span>
                  <span className="font-bold text-neutral-900 dark:text-white block font-mono">{logistics.hubCode}</span>
                  <span className="text-emerald-600 font-mono">দূরত্ব: {logistics.hubDistanceKm} km</span>
                </div>

                <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px]">অ্যাসাইনকৃত রাইডার:</span>
                  <span className={`font-bold block truncate ${logistics.riderFound ? 'text-neutral-900 dark:text-white' : 'text-rose-500'}`}>
                    {logistics.riderName}
                  </span>
                  {logistics.riderFound ? (
                    <>
                      {logistics.riderVehicle && (
                        <span className="text-emerald-600 font-mono block text-[10px]">{logistics.riderVehicle}</span>
                      )}
                      {logistics.riderDistanceKm !== undefined && (
                        <span className="text-neutral-500 font-mono text-[10px] block">দূরত্ব: {logistics.riderDistanceKm} km</span>
                      )}
                    </>
                  ) : (
                    <span className="text-neutral-400 text-[10px] block">বর্তমানে কোনো available rider নেই</span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Ordered Products List Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h3>৩. পণ্যের তালিকা (Ordered Products)</h3>
                </div>
                <span className="text-xs text-neutral-500 font-medium">মোট পণ্য: {checkoutItems.length} টি</span>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">MRP</th>
                      <th className="p-3 text-right">Item Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {checkoutItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                        <td className="p-3 font-semibold text-neutral-900 dark:text-white">{item.title}</td>
                        <td className="p-3 text-center font-bold font-mono text-neutral-800 dark:text-neutral-200">{item.quantity}</td>
                        <td className="p-3 text-right font-bold font-mono text-neutral-700 dark:text-neutral-300">৳{item.mrp.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">৳{item.itemTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Payment Method Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CreditCard className="w-5 h-5" />
                  <h3>৪. পেমেন্ট পদ্ধতি নির্বাচন করুন</h3>
                </div>
                <span className="text-[11px] text-neutral-500 font-medium">
                  পণ্যভিত্তিক অনুমোদিত গেটওয়ে
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {/* 1. Cash on Delivery (COD) */}
                {availablePaymentOptions.cod && (
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                        চার্জ ৳০
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white block">ক্যাশ অন ডেলিভারি</span>
                      <span className="text-[10px] text-neutral-500">পণ্য হাতে পেয়ে পেমেন্ট (COD)</span>
                    </div>
                  </label>
                )}

                {/* 2. bKash */}
                {availablePaymentOptions.bkash && (
                  <label
                    onClick={() => setPaymentMethod('online_bkash')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                      paymentMethod === 'online_bkash'
                        ? 'border-pink-600 bg-pink-50/60 dark:bg-pink-950/40 shadow-sm ring-1 ring-pink-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-pink-600 font-mono tracking-tight">bKash</span>
                      <span className="font-bold text-[10px] bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300 px-1.5 py-0.5 rounded">
                        {paymentChargesConfig.bkashRate > 0 ? `${paymentChargesConfig.bkashRate}% চার্জ` : 'চার্জ ৳০'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white block">বিকাশ (bKash)</span>
                      <span className="text-[10px] text-neutral-500">অনলাইন পেমেন্ট গেটওয়ে</span>
                    </div>
                  </label>
                )}

                {/* 3. Nagad */}
                {availablePaymentOptions.nagad && (
                  <label
                    onClick={() => setPaymentMethod('online_nagad')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                      paymentMethod === 'online_nagad'
                        ? 'border-orange-600 bg-orange-50/60 dark:bg-orange-950/40 shadow-sm ring-1 ring-orange-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-orange-600 font-mono tracking-tight">Nagad</span>
                      <span className="font-bold text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 px-1.5 py-0.5 rounded">
                        {paymentChargesConfig.nagadRate > 0 ? `${paymentChargesConfig.nagadRate}% চার্জ` : 'চার্জ ৳০'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white block">নগদ (Nagad)</span>
                      <span className="text-[10px] text-neutral-500">অনলাইন পেমেন্ট গেটওয়ে</span>
                    </div>
                  </label>
                )}

                {/* 4. Rocket */}
                {availablePaymentOptions.rocket && (
                  <label
                    onClick={() => setPaymentMethod('online_rocket')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                      paymentMethod === 'online_rocket'
                        ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/40 shadow-sm ring-1 ring-purple-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-purple-600 font-mono tracking-tight">Rocket</span>
                      <span className="font-bold text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded">
                        {paymentChargesConfig.rocketRate > 0 ? `${paymentChargesConfig.rocketRate}% চার্জ` : 'চার্জ ৳০'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white block">রকেট (Rocket)</span>
                      <span className="text-[10px] text-neutral-500">অনলাইন পেমেন্ট গেটওয়ে</span>
                    </div>
                  </label>
                )}

                {/* 5. Bank Payment */}
                {availablePaymentOptions.bank && (
                  <label
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-sm ring-1 ring-blue-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        {paymentChargesConfig.bankRate > 0 ? `${paymentChargesConfig.bankRate}% চার্জ` : 'চার্জ ৳০'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-xs text-neutral-900 dark:text-white block">ব্যাংক ট্রান্সফার</span>
                      <span className="text-[10px] text-neutral-500">সরাসরি ব্যাংক ডিপোজিট</span>
                    </div>
                  </label>
                )}

                {/* 6. Tomok Wallet */}
                <label
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col justify-between space-y-2 transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/40 shadow-sm ring-1 ring-amber-500'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">চার্জ ৳০</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-neutral-900 dark:text-white block">টমক ওয়ালেট</span>
                    <span className="text-[10px] text-neutral-500">ইনস্ট্যান্ট ব্যালেন্স কর্তন</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 5. Special Instructions */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300">বিশেষ ডেলিভারি নির্দেশিকা (ঐচ্ছিক):</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: গেটে দিয়ে কল দিন..."
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white"
              />
            </div>

            {/* Error Message display */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 6. Customer Final Checkout Summary Section */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
              <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <span className="font-black text-neutral-900 dark:text-white text-sm">Customer Final Checkout Summary</span>
                {paymentChargeResult.rate === 0 ? (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                    {paymentMethod === 'cod' ? 'COD' : 'Wallet'}: Charge ৳0
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                    {paymentMethod === 'online_bkash'
                      ? 'bKash'
                      : paymentMethod === 'online_nagad'
                      ? 'Nagad'
                      : paymentMethod === 'online_rocket'
                      ? 'Rocket'
                      : paymentMethod === 'bank_transfer'
                      ? 'Bank'
                      : 'Gateway'}: {paymentChargeResult.percentText} Charge
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs font-semibold">
                {/* 1. Selling Price */}
                <div className="flex justify-between items-center text-neutral-800 dark:text-neutral-200">
                  <span>Selling Price</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatPrice(totalSellingPrice)}
                  </span>
                </div>

                {/* 2. Delivery Cost */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Delivery Cost</span>
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {deliveryCalcResult.zoneNameBn} • {isPaurashava ? 'পৌরসভা' : 'গ্রামীণ'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                        {deliveryCalcResult.totalWeightDisplay}
                      </span>
                      {distanceKm > 1 && (
                        <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                          {distanceKm} km
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                      {formatPrice(shippingCharge)}
                    </span>
                  </div>
                  {deliveryCalcResult.deliverySnapshot?.rateBreakdown && (
                    <p className="text-[10px] text-neutral-500 font-normal truncate">
                      {deliveryCalcResult.deliverySnapshot.rateBreakdown}
                    </p>
                  )}
                </div>

                {/* 3. VAT/Tax */}
                <div className="flex justify-between items-center text-neutral-700 dark:text-neutral-300">
                  <span>VAT/Tax</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
                    {formatPrice(taxAmount)}
                  </span>
                </div>

                {/* 4. PV */}
                <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="font-bold">PV</span>
                  <span className="font-mono font-extrabold text-sm">
                    {formatPV(totalPv)} PV
                  </span>
                </div>

                {/* 5. Payment Charge */}
                <div className={`flex justify-between items-center ${
                  paymentChargeResult.rate > 0 
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/50 p-2 rounded-xl border border-rose-200 dark:border-rose-900' 
                    : 'text-neutral-700 dark:text-neutral-300'
                }`}>
                  <span className="font-semibold">
                    Payment Charge{paymentChargeResult.rate > 0 ? ` (${paymentChargeResult.percentText})` : ''}
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {formatPrice(paymentCharge)}
                  </span>
                </div>

                {/* Optional Coupon Discount (if applied) */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount</span>
                    <span className="font-mono font-bold text-sm">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}

                {/* Divider Line */}
                <div className="border-t border-neutral-300 dark:border-neutral-700 my-2" />

                {/* 6. Total Amount */}
                <div className="pt-1 flex justify-between items-center text-sm font-black text-neutral-900 dark:text-white">
                  <span className="text-sm sm:text-base">Total Amount</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-lg sm:text-xl font-black">
                    {formatPrice(totalPayable)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPlacingOrder}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-transform active:scale-98 cursor-pointer mt-3"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>অর্ডার তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>অর্ডার নিশ্চিত করুন ({formatPrice(totalPayable)})</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
