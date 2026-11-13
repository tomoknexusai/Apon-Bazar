/**
 * Customer Clothing Variant Selection Component
 * Project: TOMSHOPBD
 * 
 * Strict Flow:
 * 1. Select Color
 * 2. Select Size (filtered by selected Color)
 * 3. Select Weight (auto-populated/selectable by Color + Size)
 * 4. Resolves exact variant: SKU, Stock, Weight, Image, Price Adjustment
 * 5. Invalid combination marked: 'Unavailable / Out of Stock'
 * 6. Displays live delivery weight formula: Variant Weight × Quantity
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ProductVariant } from '../../types';
import {
  parseWeightToGrams,
  formatWeightDisplay,
  calculateItemTotalWeight
} from '../../lib/deliveryWeightCalculator';
import {
  Check,
  Scale,
  Boxes,
  AlertCircle,
  Hash,
  Truck,
  Sparkles,
  Tag
} from 'lucide-react';

interface ClothingVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant?: ProductVariant;
  onSelectVariant: (variant: ProductVariant | undefined) => void;
  quantity: number;
  basePrice: number;
  onVariantImageChange?: (imageUrl: string) => void;
}

export const ClothingVariantSelector: React.FC<ClothingVariantSelectorProps> = ({
  variants,
  selectedVariant,
  onSelectVariant,
  quantity,
  basePrice,
  onVariantImageChange
}) => {
  // Extract all distinct colors
  const distinctColors = useMemo(() => {
    const colors = variants
      .map((v) => v.color?.trim())
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(colors));
  }, [variants]);

  // Initial State: pick selectedVariant's attributes or the first available
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    if (selectedVariant?.color) return selectedVariant.color;
    // Prefer one with stock
    const inStockVar = variants.find((v) => (v.stock || v.stockQuantity || 0) > 0 && v.color);
    return inStockVar?.color || distinctColors[0] || '';
  });

  // Sizes available for the chosen color
  const availableSizesForColor = useMemo(() => {
    if (!selectedColor) return [];
    const sizes = variants
      .filter((v) => v.color?.toLowerCase() === selectedColor.toLowerCase())
      .map((v) => v.size?.trim())
      .filter((s): s is string => Boolean(s));
    return Array.from(new Set(sizes));
  }, [variants, selectedColor]);

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (selectedVariant?.size && selectedVariant.color?.toLowerCase() === selectedColor.toLowerCase()) {
      return selectedVariant.size;
    }
    return availableSizesForColor[0] || '';
  });

  // Keep size valid when color changes
  useEffect(() => {
    if (availableSizesForColor.length > 0) {
      if (!availableSizesForColor.includes(selectedSize)) {
        setSelectedSize(availableSizesForColor[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [selectedColor, availableSizesForColor, selectedSize]);

  // Weights available for chosen Color + Size
  const availableWeightsForColorAndSize = useMemo(() => {
    if (!selectedColor || !selectedSize) return [];
    const matched = variants.filter(
      (v) =>
        v.color?.toLowerCase() === selectedColor.toLowerCase() &&
        v.size?.toLowerCase() === selectedSize.toLowerCase()
    );

    const weights = matched.map((v) => ({
      raw: v.weight || `${v.weightGrams || 250}g`,
      grams: parseWeightToGrams(v.weight, v.weightKg),
      variant: v
    }));

    // Deduplicate by grams
    return weights.filter(
      (w, index, self) => index === self.findIndex((other) => other.grams === w.grams)
    );
  }, [variants, selectedColor, selectedSize]);

  const [selectedWeightGrams, setSelectedWeightGrams] = useState<number>(() => {
    if (selectedVariant?.weightGrams) return selectedVariant.weightGrams;
    return availableWeightsForColorAndSize[0]?.grams || 250;
  });

  // Keep weight valid when color or size changes
  useEffect(() => {
    if (availableWeightsForColorAndSize.length > 0) {
      const exists = availableWeightsForColorAndSize.some((w) => w.grams === selectedWeightGrams);
      if (!exists) {
        setSelectedWeightGrams(availableWeightsForColorAndSize[0].grams);
      }
    }
  }, [availableWeightsForColorAndSize, selectedWeightGrams]);

  // Find exact matching variant
  const currentMatchingVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return undefined;
    return variants.find((v) => {
      const isColorMatch = v.color?.toLowerCase() === selectedColor.toLowerCase();
      const isSizeMatch = v.size?.toLowerCase() === selectedSize.toLowerCase();
      const variantGrams = parseWeightToGrams(v.weight, v.weightKg);
      const isWeightMatch = variantGrams === selectedWeightGrams;
      return isColorMatch && isSizeMatch && isWeightMatch;
    });
  }, [variants, selectedColor, selectedSize, selectedWeightGrams]);

  // Notify parent of resolved variant
  useEffect(() => {
    onSelectVariant(currentMatchingVariant);

    if (currentMatchingVariant?.image && onVariantImageChange) {
      onVariantImageChange(currentMatchingVariant.image);
    }
  }, [currentMatchingVariant, onSelectVariant, onVariantImageChange]);

  const variantStock = currentMatchingVariant?.stock ?? currentMatchingVariant?.stockQuantity ?? 0;
  const isOutOfStock = !currentMatchingVariant || variantStock <= 0;

  // Delivery weight computation for selected variant and quantity
  const weightCalc = calculateItemTotalWeight(currentMatchingVariant, quantity);

  return (
    <div className="space-y-4 pt-1">
      {/* 1. SELECT COLOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
              ১
            </span>
            <span>কালার নির্বাচন করুন (Select Color):</span>
          </label>
          {selectedColor && (
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              নির্বাচিত: <strong>{selectedColor}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {distinctColors.map((color) => {
            const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
            // Check if any variant with this color has stock
            const colorStock = variants
              .filter((v) => v.color?.toLowerCase() === color.toLowerCase())
              .reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);
            const isColorOutOfStock = colorStock <= 0;

            const isWhite = color.toLowerCase() === 'white';
            const isBlack = color.toLowerCase() === 'black';

            return (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`relative px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800'
                    : 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-indigo-400'
                } ${isColorOutOfStock ? 'opacity-60' : ''}`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs flex-shrink-0"
                  style={{
                    backgroundColor: isWhite
                      ? '#ffffff'
                      : isBlack
                      ? '#111827'
                      : color.toLowerCase().includes('navy')
                      ? '#1e3a8a'
                      : color.toLowerCase().includes('red')
                      ? '#dc2626'
                      : color.toLowerCase().includes('maroon')
                      ? '#881337'
                      : color.toLowerCase().includes('grey')
                      ? '#6b7280'
                      : '#6366f1'
                  }}
                />
                <span>{color}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SELECT SIZE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
              ২
            </span>
            <span>সাইজ নির্বাচন করুন (Select Size):</span>
          </label>
          {selectedSize && (
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              নির্বাচিত: <strong>{selectedSize}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableSizesForColor.map((size) => {
            const isSelected = selectedSize.toLowerCase() === size.toLowerCase();
            // Total stock for this Color + Size
            const sizeStock = variants
              .filter(
                (v) =>
                  v.color?.toLowerCase() === selectedColor.toLowerCase() &&
                  v.size?.toLowerCase() === size.toLowerCase()
              )
              .reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);

            const isSizeAvailable = sizeStock > 0;

            return (
              <button
                key={size}
                type="button"
                disabled={!isSizeAvailable}
                onClick={() => setSelectedSize(size)}
                className={`min-w-[48px] px-3.5 py-2 rounded-xl border text-xs font-extrabold transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800'
                    : isSizeAvailable
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-indigo-400'
                    : 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-dashed border-neutral-300 cursor-not-allowed line-through'
                }`}
              >
                <span>{size}</span>
                {!isSizeAvailable && (
                  <span className="block text-[9px] font-normal no-underline text-rose-500">স্টক নেই</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SELECT WEIGHT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">
              ৩
            </span>
            <span>ফেব্রিক ওজন (Select Weight):</span>
          </label>
          <span className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-indigo-500" />
            <span>ডেলিভারি হিসেব Variant Weight দিয়ে হবে</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableWeightsForColorAndSize.map((item) => {
            const isSelected = selectedWeightGrams === item.grams;
            const itemStock = item.variant.stock ?? item.variant.stockQuantity ?? 0;
            const isWeightInStock = itemStock > 0;

            return (
              <button
                key={item.grams}
                type="button"
                onClick={() => setSelectedWeightGrams(item.grams)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800'
                    : isWeightInStock
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700 hover:border-indigo-400'
                    : 'bg-neutral-100 text-neutral-400 border-dashed cursor-not-allowed'
                }`}
              >
                <Scale className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-indigo-500'}`} />
                <span>{formatWeightDisplay(item.grams)}</span>
                {item.variant.priceAdjustment && item.variant.priceAdjustment !== 0 ? (
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-indigo-700 text-amber-200' : 'bg-emerald-50 text-emerald-700'}`}>
                    {item.variant.priceAdjustment > 0 ? `+৳${item.variant.priceAdjustment}` : `-৳${Math.abs(item.variant.priceAdjustment)}`}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EXACT VARIANT STATUS & SPECS CARD */}
      {currentMatchingVariant ? (
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            isOutOfStock
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-gradient-to-br from-indigo-50/60 via-emerald-50/40 to-indigo-50/30 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-emerald-950/20 border-indigo-200 dark:border-indigo-900/60'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                কম্বিনেশন: <strong className="text-indigo-700 dark:text-indigo-300 font-extrabold">{currentMatchingVariant.color} / {currentMatchingVariant.size} / {formatWeightDisplay(weightCalc.unitWeightGrams)}</strong>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                SKU: {currentMatchingVariant.sku}
              </span>
            </div>

            <div>
              {isOutOfStock ? (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-black flex items-center gap-1 border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unavailable / Out of Stock</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-300">
                  <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                  <span>মজুদ আছে: <strong className="font-mono text-sm">{variantStock}</strong> পিস</span>
                </span>
              )}
            </div>
          </div>

          {/* Delivery Weight Live Calculation Preview */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-950 dark:text-indigo-200 font-medium">
              <Truck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span>
                ডেলিভারি ওজন: <strong className="font-mono text-indigo-700 dark:text-indigo-300">{weightCalc.unitWeightDisplay}</strong> × <strong className="font-mono">{quantity} পিস</strong> = <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">{weightCalc.totalWeightDisplay}</strong>
              </span>
            </div>

            {currentMatchingVariant.priceAdjustment && currentMatchingVariant.priceAdjustment !== 0 ? (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                মূল্য সমন্বয়: {currentMatchingVariant.priceAdjustment > 0 ? `+৳${currentMatchingVariant.priceAdjustment}` : `-৳${Math.abs(currentMatchingVariant.priceAdjustment)}`}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>এই Color, Size ও Weight কম্বিনেশনটি অনুপলব্ধ (Unavailable / Out of Stock)। অন্য কোনো কম্বিনেশন নির্বাচন করুন।</span>
        </div>
      )}
    </div>
  );
};
