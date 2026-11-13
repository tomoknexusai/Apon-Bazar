/**
 * Wishlist Modal Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { Product } from '../../types';
import {
  X,
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProduct?: (productId: string) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  onOpenProduct
}) => {
  const { wishlist, toggleWishlist, products, addToCart } = useECommerce();
  const { language } = useLanguage();
  const { addNotification } = useNotifications();

  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    addNotification({
      title: language === 'bn' ? 'কার্টে যোগ করা হয়েছে' : 'Added to Cart',
      message: language === 'bn' ? `${product.titleBn || product.title} কার্টে যোগ হয়েছে।` : `${product.title} has been added to your cart.`,
      type: 'success'
    });
  };

  const handleRemove = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'পছন্দের তালিকা (Wishlist)' : 'My Wishlist'}</span>
                <span className="px-2 py-0.5 text-xs font-black rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {wishlistedProducts.length}
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {language === 'bn'
                  ? 'আপনার সংরক্ষিত পছন্দের পণ্যসমূহ সহজেই কার্টে যোগ করুন'
                  : 'Easily manage and purchase your saved favorite items'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
          {wishlistedProducts.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-400 mx-auto">
                <Heart className="w-8 h-8 stroke-1" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">
                  {language === 'bn' ? 'পছন্দের তালিকা খালি' : 'Your Wishlist is Empty'}
                </h4>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  {language === 'bn'
                    ? 'যেকোনো পণ্যের হার্ট (Heart) আইকনে ক্লিক করে পছন্দের তালিকায় যুক্ত করতে পারেন।'
                    : 'Click on the heart icon on any product to save it here for future shopping.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{language === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Explore Products'}</span>
              </button>
            </div>
          ) : (
            wishlistedProducts.map((product) => {
              const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400';
              const effectivePrice = product.campaignPrice || (product.mrp - (product.discount || 0));
              const isOutOfStock = product.inStock === false || (product.stockQuantity !== undefined && product.stockQuantity <= 0) || (product.stock !== undefined && product.stock <= 0);

              return (
                <div
                  key={product.id}
                  className="pt-3 first:pt-0 flex items-center justify-between gap-4 group"
                >
                  <div
                    className="flex items-center gap-3.5 flex-1 cursor-pointer"
                    onClick={() => {
                      if (onOpenProduct) {
                        onOpenProduct(product.id);
                        onClose();
                      }
                    }}
                  >
                    <img
                      src={mainImage}
                      alt={product.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-neutral-100 dark:border-neutral-800 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {language === 'bn' ? (product.titleBn || product.title) : product.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ৳ {effectivePrice.toLocaleString()}
                        </span>
                        {product.mrp > effectivePrice && (
                          <span className="text-neutral-400 line-through text-[11px]">
                            ৳ {product.mrp.toLocaleString()}
                          </span>
                        )}
                        {(product.pvValue ?? 0) > 0 && (
                          <span className="px-1.5 py-0.2 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-[10px] rounded border border-teal-200/60 dark:border-teal-800/60">
                            {product.pvValue} PV
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]">
                        {isOutOfStock ? (
                          <span className="text-rose-500 font-semibold">
                            {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">
                            {language === 'bn' ? 'স্টকে আছে' : 'In Stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => handleAddToCart(product, e)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                      title="Add to Cart"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{language === 'bn' ? 'কার্টে নিন' : 'Add to Cart'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleRemove(product.id, e)}
                      className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove from Wishlist'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {wishlistedProducts.length > 0 && (
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-4">
            <span className="text-xs text-neutral-500">
              {language === 'bn'
                ? `মোট ${wishlistedProducts.length} টি পণ্য সংরক্ষিত রয়েছে`
                : `Total ${wishlistedProducts.length} items saved`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
