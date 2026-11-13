/**
 * Side-by-Side Product Compare Modal Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { formatPV } from '../../lib/ecommerce-data';
import { X, Trash2, ShoppingBag, Star, ShieldCheck, Tag } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose }) => {
  const { products, compareList, toggleCompare, clearCompare, addToCart } = useECommerce();

  if (!isOpen) return null;

  const comparedProducts = products.filter((p) => compareList.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col my-auto text-xs sm:text-sm">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-neutral-900 dark:text-white text-base">
              পণ্য তুলনা ম্যাট্রিক্স ({comparedProducts.length} টি পণ্য)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg text-xs font-bold"
              >
                সব খালি করুন
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        {comparedProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 space-y-2">
            <p className="font-bold text-sm">তুলনা তালিকায় কোনো পণ্য যুক্ত করা হয়নি।</p>
            <p className="text-xs">পণ্য কার্ডের স্কেল (Scale) আইকনে ক্লিক করে সর্বোচ্চ ৪টি পণ্য তুলনা করুন।</p>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="p-3 font-bold text-neutral-400 w-32">বৈশিষ্ট্যসমূহ</th>
                  {comparedProducts.map((p) => (
                    <th key={p.id} className="p-3 text-center min-w-[180px]">
                      <div className="space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => toggleCompare(p.id)}
                          className="absolute -top-1 -right-1 p-1 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <img
                          src={p.images[0]}
                          alt={p.titleBn}
                          className="w-20 h-20 rounded-xl object-cover mx-auto border border-neutral-200 dark:border-neutral-700"
                        />
                        <h4 className="font-bold text-neutral-900 dark:text-white text-xs line-clamp-2">
                          {p.titleBn}
                        </h4>
                        <button
                          type="button"
                          onClick={() => addToCart(p)}
                          className="w-full py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>কার্টে নিন</span>
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                <tr>
                  <td className="p-3 font-bold text-neutral-500">বিক্রয় মূল্য:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      ৳ {(p.campaignPrice || p.mrp - p.discount).toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">MRP মূল্য:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-mono text-neutral-400 line-through">
                      ৳ {p.mrp.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">Network Marketing PV পয়েন্ট:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-bold text-amber-600">
                      {formatPV(p.pvValue)} PV
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">ক্যাশব্যাক:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-bold text-emerald-600">
                      +{p.cashbackPct}%
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">ওজন / একক:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-mono">
                      {p.weightKg} kg / {p.unit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">স্টক অবস্থা:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                        {p.stock} {p.unit}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">ক্যাশ অন ডেলিভারি:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-bold text-emerald-600">
                      {p.codAvailable ? 'হ্যাঁ (COD)' : 'না'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-bold text-neutral-500">রেটিং:</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-3 text-center font-bold text-amber-500">
                      ★ {p.rating} ({p.reviewsCount})
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};
