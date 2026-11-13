/**
 * Shopping Cart Drawer Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import { calculateProductPricing, formatPV, formatPrice } from '../../lib/pricing';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldCheck,
  Coins,
  Sparkles
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOpenCheckout }) => {
  const { t } = useLanguage();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartMrpTotal,
    cartPvTotal,
    cartCashbackTotal,
    appliedCoupon,
    couponDiscountAmount,
    applyCoupon,
    removeCoupon
  } = useECommerce();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError('');
      setCouponInput('');
    }
  };

  const totalDiscount = Math.max(0, cartMrpTotal - cartSubtotal);
  const estimatedShipping = cart.length > 0 ? 60 : 0;
  const estimatedTax = Math.round(cartMrpTotal * 0.05);
  const grandTotal = Math.max(
    0,
    cartSubtotal - couponDiscountAmount + estimatedShipping + estimatedTax
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-neutral-200 dark:border-neutral-800 animate-slide-left text-xs sm:text-sm">
        
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-black text-neutral-900 dark:text-white text-base">
              আমার শপিং কার্ট ({cart.length})
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

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6 text-neutral-400">
              <ShoppingBag className="w-16 h-16 stroke-1 text-neutral-300 dark:text-neutral-700" />
              <p className="font-bold text-sm text-neutral-600 dark:text-neutral-400">
                আপনার কার্ট খালি রয়েছে!
              </p>
              <p className="text-xs">
                ঘাঁটি ভাঙা তেল, খাঁটি মধু ও ডেইরি ক্যাটালগ থেকে পছন্দসই পণ্য যোগ করুন।
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 flex items-center gap-3 relative"
              >
                <img
                  src={item.product.images[0]}
                  alt={item.product.titleBn}
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-bold text-neutral-900 dark:text-white text-xs truncate">
                    {item.product.titleBn}
                  </h4>
                  {item.selectedVariant && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      ভেরিয়েন্ট: {item.selectedVariant.name}
                    </span>
                  )}
                  {(() => {
                    const itemPricing = calculateProductPricing(item.product, item.quantity, item.selectedVariant);
                    return (
                      <div className="flex items-center gap-2">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳ {itemPricing.totalSellingPrice.toLocaleString()}
                        </span>
                        {itemPricing.totalPv > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            +{formatPV(itemPricing.totalPv)} PV
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-neutral-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="text-neutral-500 hover:text-black dark:hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold font-mono text-xs">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="text-neutral-500 hover:text-black dark:hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart.length > 0 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
            
            {/* Coupon Promo Field */}
            <form onSubmit={handleApplyCoupon} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="কুপন কোড (যেমন: GHORER2026)"
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl py-1.5 pl-8 pr-3 text-xs font-mono text-neutral-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-bold text-xs hover:bg-neutral-800 transition-colors"
                >
                  প্রয়োগ
                </button>
              </div>

              {couponError && <p className="text-[10px] text-rose-500 font-medium">{couponError}</p>}

              {appliedCoupon && (
                <div className="flex items-center justify-between p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> কুপন '{appliedCoupon.code}' সক্রিয়! (৳{couponDiscountAmount} ছাড়)
                  </span>
                  <button type="button" onClick={removeCoupon} className="font-bold underline text-xs">
                    রিমুভ
                  </button>
                </div>
              )}
            </form>

            {/* Price Calculations */}
            <div className="space-y-1.5 text-xs border-t border-neutral-200 dark:border-neutral-700 pt-2.5">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>MRP:</span>
                <span className="font-mono font-bold">{formatPrice(cartMrpTotal)}</span>
              </div>

              <div className="flex justify-between text-neutral-800 dark:text-neutral-200 font-semibold">
                <span>Selling Price:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400">
                  <span>Discount:</span>
                  <span className="font-mono font-bold">- {formatPrice(totalDiscount)}</span>
                </div>
              )}

              {couponDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code}):</span>
                  <span className="font-mono">- {formatPrice(couponDiscountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Delivery Cost:</span>
                <span className="font-mono">{formatPrice(estimatedShipping)}</span>
              </div>

              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>VAT/Tax (5%):</span>
                <span className="font-mono">{formatPrice(estimatedTax)}</span>
              </div>

              <div className="flex justify-between text-amber-600 font-bold pt-1 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                <span>PV:</span>
                <span className="font-mono">{formatPV(cartPvTotal)} PV</span>
              </div>

              <div className="flex justify-between text-sm font-black text-neutral-900 dark:text-white pt-1.5 border-t border-neutral-200 dark:border-neutral-700">
                <span>Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base font-bold">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Trigger */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all"
            >
              <span>চেকআউট করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
