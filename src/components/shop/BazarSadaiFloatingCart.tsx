/**
 * Floating Cart / Order Summary Bar Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface BazarSadaiFloatingCartProps {
  onOpenCart: () => void;
}

export const BazarSadaiFloatingCart: React.FC<BazarSadaiFloatingCartProps> = ({ onOpenCart }) => {
  const { cart, cartSubtotal } = useECommerce();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-5 sm:bottom-6 right-3 sm:right-6 z-40 animate-bounce-short">
      <button
        type="button"
        onClick={onOpenCart}
        className="px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white dark:border-neutral-800 transition-transform active:scale-95"
        aria-label="Open Cart Summary"
      >
        {/* Cart Icon & Count Badge */}
        <div className="relative">
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-rose-600 text-white font-black text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-900 shadow">
            {totalItems}
          </span>
        </div>

        {/* Order Summary Total Price */}
        <div className="text-left border-l border-white/20 pl-3 leading-tight">
          <span className="text-[10px] text-emerald-200 uppercase font-bold block">
            কার্ট সামারি
          </span>
          <span className="text-sm font-black text-amber-300 font-mono">
            ৳ {cartSubtotal.toLocaleString()}
          </span>
        </div>

        <ChevronRight className="w-5 h-5 text-emerald-200" />
      </button>
    </div>
  );
};
