/**
 * Clothing Variant Management Component
 * Project: TOMSHOPBD
 * 
 * Specifically designed for Clothing/Fashion category products:
 * Matrix: Color + Size + Weight
 * Features:
 * - Generate Variants Matrix (Cartesian product of Colors x Sizes x Weights)
 * - Add individual custom variant combinations
 * - Inline editing of Stock, SKU, Price Adjustment, and Variant Image
 * - Variant Weight synchronization for delivery logistics
 */

import React, { useState } from 'react';
import { ProductVariant } from '../../types';
import { parseWeightToGrams, formatWeightDisplay } from '../../lib/deliveryWeightCalculator';
import {
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Hash,
  Scale,
  Palette,
  Maximize2,
  DollarSign,
  Boxes,
  RefreshCw,
  Copy
} from 'lucide-react';

interface ClothingVariantManagerProps {
  variants: ProductVariant[];
  onChange: (updatedVariants: ProductVariant[]) => void;
  basePrice: number;
  baseMrp: number;
  productSlugOrSku?: string;
  onStockSumChange?: (totalStock: number) => void;
}

const COLOR_PRESETS = ['Black', 'White', 'Navy Blue', 'Maroon', 'Olive Green', 'Heather Grey', 'Royal Blue', 'Red'];
const SIZE_PRESETS = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
const WEIGHT_PRESETS = ['200g', '220g', '250g', '270g', '300g', '350g'];

export const ClothingVariantManager: React.FC<ClothingVariantManagerProps> = ({
  variants,
  onChange,
  basePrice,
  baseMrp,
  productSlugOrSku = 'CLOTH',
  onStockSumChange
}) => {
  // Generator Input States
  const [colorInput, setColorInput] = useState<string>('Black, White');
  const [sizeInput, setSizeInput] = useState<string>('S, M, L, XL');
  const [weightInput, setWeightInput] = useState<string>('220g, 250g, 270g');
  const [defaultStockInput, setDefaultStockInput] = useState<number>(25);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(variants.length === 0);

  // Single Variant Addition State
  const [singleColor, setSingleColor] = useState<string>('Black');
  const [singleSize, setSingleSize] = useState<string>('M');
  const [singleWeight, setSingleWeight] = useState<string>('250g');
  const [singleStock, setSingleStock] = useState<number>(20);
  const [singlePriceAdj, setSinglePriceAdj] = useState<number>(0);
  const [singleImage, setSingleImage] = useState<string>('');
  const [showSingleModal, setShowSingleModal] = useState<boolean>(false);

  // Error/Success Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  // Generate Matrix
  const handleGenerateMatrix = () => {
    const colors = colorInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const sizes = sizeInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const weights = weightInput
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    if (colors.length === 0 || sizes.length === 0 || weights.length === 0) {
      setFeedback('দয়া করে কমপক্ষে একটি Color, Size এবং Weight প্রদান করুন।');
      return;
    }

    const cleanBaseSku = (productSlugOrSku || 'CLOTH')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);

    const newGenerated: ProductVariant[] = [];
    const timestamp = Date.now();
    let idx = 0;

    for (const color of colors) {
      const colorShort = color.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'CLR';
      for (const size of sizes) {
        const sizeShort = size.toUpperCase().replace(/\s+/g, '');
        for (const weight of weights) {
          idx++;
          const weightGrams = parseWeightToGrams(weight);
          const weightKg = Number((weightGrams / 1000).toFixed(3));
          const weightShort = `${weightGrams}G`;

          const sku = `${cleanBaseSku}-${colorShort}-${sizeShort}-${weightShort}`;

          newGenerated.push({
            id: `var-${timestamp}-${idx}`,
            name: `${color} / ${size} / ${weight}`,
            title: `${color} - ${size} (${weight})`,
            color,
            size,
            weight,
            weightGrams,
            weightKg,
            sku,
            price: basePrice,
            mrp: baseMrp || basePrice,
            stock: defaultStockInput,
            stockQuantity: defaultStockInput,
            priceAdjustment: 0,
            image: '',
            isAvailable: true
          });
        }
      }
    }

    // Merge or replace
    const combined = [...variants, ...newGenerated];
    // Deduplicate by Color + Size + Weight
    const uniqueVariants = combined.filter(
      (v, index, self) =>
        index ===
        self.findIndex(
          (other) =>
            String(other.color).toLowerCase() === String(v.color).toLowerCase() &&
            String(other.size).toLowerCase() === String(v.size).toLowerCase() &&
            parseWeightToGrams(other.weight) === parseWeightToGrams(v.weight)
        )
    );

    onChange(uniqueVariants);
    const totalStock = uniqueVariants.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);
    if (onStockSumChange) onStockSumChange(totalStock);

    setFeedback(`${newGenerated.length} টি ভ্যারিয়েন্ট সফলভাবে তৈরি হয়েছে!`);
    setIsGeneratorOpen(false);
  };

  // Add Single Combination
  const handleAddSingle = () => {
    if (!singleColor.trim() || !singleSize.trim() || !singleWeight.trim()) {
      setFeedback('Color, Size ও Weight তথ্য সঠিকভাবে দিন।');
      return;
    }

    const weightGrams = parseWeightToGrams(singleWeight);
    const weightKg = Number((weightGrams / 1000).toFixed(3));
    const cleanBaseSku = (productSlugOrSku || 'CLOTH')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const colorShort = singleColor.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'CLR';
    const sizeShort = singleSize.toUpperCase().replace(/\s+/g, '');
    const sku = `${cleanBaseSku}-${colorShort}-${sizeShort}-${weightGrams}G`;

    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      name: `${singleColor} / ${singleSize} / ${singleWeight}`,
      title: `${singleColor} - ${singleSize} (${singleWeight})`,
      color: singleColor.trim(),
      size: singleSize.trim(),
      weight: singleWeight.trim(),
      weightGrams,
      weightKg,
      sku,
      price: basePrice + singlePriceAdj,
      mrp: baseMrp ? baseMrp + singlePriceAdj : basePrice + singlePriceAdj,
      stock: singleStock,
      stockQuantity: singleStock,
      priceAdjustment: singlePriceAdj,
      image: singleImage.trim() || '',
      isAvailable: singleStock > 0
    };

    // Check duplicate
    const exists = variants.some(
      (v) =>
        String(v.color).toLowerCase() === newVar.color?.toLowerCase() &&
        String(v.size).toLowerCase() === newVar.size?.toLowerCase() &&
        parseWeightToGrams(v.weight) === weightGrams
    );

    if (exists) {
      setFeedback(`সতর্কতা: ${singleColor} / ${singleSize} / ${singleWeight} ভ্যারিয়েন্টটি ইতিমধ্যে তালিকায় বিদ্যমান!`);
      return;
    }

    const updated = [newVar, ...variants];
    onChange(updated);
    const totalStock = updated.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);
    if (onStockSumChange) onStockSumChange(totalStock);

    setShowSingleModal(false);
    setSingleImage('');
    setFeedback('নতুন ভ্যারিয়েন্ট সফলভাবে যোগ হয়েছে!');
  };

  // Update Individual Variant
  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    const updated = variants.map((v) => {
      if (v.id !== id) return v;
      const merged = { ...v, ...updates };

      if (updates.weight !== undefined) {
        const parsedGrams = parseWeightToGrams(updates.weight);
        merged.weightGrams = parsedGrams;
        merged.weightKg = Number((parsedGrams / 1000).toFixed(3));
      }

      if (updates.priceAdjustment !== undefined) {
        merged.price = basePrice + Number(updates.priceAdjustment || 0);
        merged.mrp = baseMrp ? baseMrp + Number(updates.priceAdjustment || 0) : merged.price;
      }

      if (updates.stock !== undefined) {
        merged.stockQuantity = Number(updates.stock) || 0;
        merged.stock = Number(updates.stock) || 0;
        merged.isAvailable = merged.stock > 0;
      }

      return merged;
    });

    onChange(updated);
    const totalStock = updated.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);
    if (onStockSumChange) onStockSumChange(totalStock);
  };

  // Remove Variant
  const handleRemoveVariant = (id: string) => {
    const updated = variants.filter((v) => v.id !== id);
    onChange(updated);
    const totalStock = updated.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);
    if (onStockSumChange) onStockSumChange(totalStock);
  };

  // Clear All
  const handleClearAll = () => {
    if (window.confirm('আপনি কি সব ভ্যারিয়েন্ট মুছে ফেলতে চান?')) {
      onChange([]);
      if (onStockSumChange) onStockSumChange(0);
      setFeedback('সব ভ্যারিয়েন্ট মুছে ফেলা হয়েছে।');
    }
  };

  const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || v.stockQuantity || 0), 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Clothing Product Variants (Color + Size + Weight)</span>
                <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Fashion Matrix
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                প্রতিটি ভ্যারিয়েন্ট Color + Size + Weight কম্বিনেশনে গঠিত এবং পৃথক ওজন অনুযায়ী কুরিয়ার ডেলিভারি হিসাব হবে।
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isGeneratorOpen ? 'জেনারেটর লুকান' : 'Generate Variants Matrix'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSingleModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>সিঙ্গেল ভ্যারিয়েন্ট</span>
          </button>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors"
              title="মুছে ফেলুন"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-amber-700 dark:text-amber-300 hover:text-amber-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* MATRIX GENERATOR BOX */}
      {isGeneratorOpen && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-neutral-50 to-indigo-50/40 dark:from-neutral-800/80 dark:via-neutral-900 dark:to-neutral-800/60 border border-indigo-200 dark:border-indigo-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>র‌্যাপিড ভ্যারিয়েন্ট ম্যাট্রিক্স জেনারেটর (Multi-Combination Matrix)</span>
            </span>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Color × Size × Weight কম্বিনেশন তৈরি করুন
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Colors Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-indigo-500" />
                <span>Colors (কমা দিয়ে আলাদা করুন):</span>
              </label>
              <input
                type="text"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                placeholder="Black, White, Navy Blue"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {COLOR_PRESETS.slice(0, 5).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (!colorInput.includes(p)) {
                        setColorInput(colorInput ? `${colorInput}, ${p}` : p);
                      }
                    }}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[10px] text-neutral-700 dark:text-neutral-300"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sizes (কমা দিয়ে আলাদা করুন):</span>
              </label>
              <input
                type="text"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="S, M, L, XL"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {SIZE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (!sizeInput.includes(p)) {
                        setSizeInput(sizeInput ? `${sizeInput}, ${p}` : p);
                      }
                    }}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[10px] text-neutral-700 dark:text-neutral-300 font-bold"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Weights Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>Weights (কমা দিয়ে আলাদা করুন):</span>
              </label>
              <input
                type="text"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="220g, 250g, 270g"
                className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {WEIGHT_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      if (!weightInput.includes(p)) {
                        setWeightInput(weightInput ? `${weightInput}, ${p}` : p);
                      }
                    }}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-700 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-[10px] text-neutral-700 dark:text-neutral-300"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-indigo-100 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                ডিফল্ট স্টক প্রতিটি ভ্যারিয়েন্টে:
              </span>
              <input
                type="number"
                min="0"
                value={defaultStockInput}
                onChange={(e) => setDefaultStockInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-20 px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-center font-bold"
              />
              <span className="text-xs text-neutral-500">পিস</span>
            </div>

            <button
              type="button"
              onClick={handleGenerateMatrix}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-xs font-extrabold shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Combinations</span>
            </button>
          </div>
        </div>
      )}

      {/* SINGLE COMBINATION MODAL / DRAWER */}
      {showSingleModal && (
        <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-amber-600" />
              <span>একটি একক ভ্যারিয়েন্ট যোগ করুন (Add Single Variant)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSingleModal(false)}
              className="text-neutral-500 hover:text-neutral-800 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Color:</label>
              <input
                type="text"
                value={singleColor}
                onChange={(e) => setSingleColor(e.target.value)}
                placeholder="Black"
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Size:</label>
              <input
                type="text"
                value={singleSize}
                onChange={(e) => setSingleSize(e.target.value)}
                placeholder="M"
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Weight:</label>
              <input
                type="text"
                value={singleWeight}
                onChange={(e) => setSingleWeight(e.target.value)}
                placeholder="250g"
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">স্টক (Stock):</label>
              <input
                type="number"
                min="0"
                value={singleStock}
                onChange={(e) => setSingleStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Price Adjust (৳):</label>
              <input
                type="number"
                value={singlePriceAdj}
                onChange={(e) => setSinglePriceAdj(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-medium text-center"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Image URL:</label>
              <input
                type="text"
                value={singleImage}
                onChange={(e) => setSingleImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSingleModal(false)}
              className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={handleAddSingle}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
            >
              যোগ করুন
            </button>
          </div>
        </div>
      )}

      {/* VARIANTS LIST TABLE */}
      {variants.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
          <Layers className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto" />
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            এখনও কোনো Clothing ভ্যারিয়েন্ট তৈরি করা হয়নি
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            উপরে &ldquo;Generate Variants Matrix&rdquo; বাটনে ক্লিক করে Color, Size ও Weight দিয়ে এক ক্লিকে সব কম্বিনেশন তৈরি করুন।
          </p>
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm mt-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Generate Variants</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">
                মোট কম্বিনেশন: <strong className="font-mono text-sm text-indigo-700 dark:text-indigo-400">{variants.length}</strong> টি
              </span>
              <span className="text-neutral-400">|</span>
              <span className="font-bold text-neutral-700 dark:text-neutral-300">
                সর্বমোট স্টক: <strong className="font-mono text-sm text-emerald-600">{totalVariantStock}</strong> পিস
              </span>
            </div>
            <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-indigo-500" />
              <span>ডেলিভারি ওজন: Variant Weight × Quantity ফর্মুলায় স্বয়ংক্রিয়ভাবে হিসাব হবে</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-neutral-700">
                <tr>
                  <th className="py-2.5 px-3">Color</th>
                  <th className="py-2.5 px-2.5">Size</th>
                  <th className="py-2.5 px-2.5">Weight (ওজন)</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Stock (স্টক)</th>
                  <th className="py-2.5 px-3">Price Adj (৳)</th>
                  <th className="py-2.5 px-3">কার্যকর মূল্য</th>
                  <th className="py-2.5 px-3">Image</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {variants.map((v) => {
                  const weightGrams = parseWeightToGrams(v.weight);
                  const effectivePrice = basePrice + Number(v.priceAdjustment || 0);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                    >
                      {/* Color */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs flex-shrink-0"
                            style={{
                              backgroundColor:
                                v.color?.toLowerCase() === 'white'
                                  ? '#ffffff'
                                  : v.color?.toLowerCase() === 'black'
                                  ? '#111827'
                                  : v.color?.toLowerCase().includes('navy')
                                  ? '#1e3a8a'
                                  : v.color?.toLowerCase().includes('red')
                                  ? '#dc2626'
                                  : v.color?.toLowerCase().includes('grey')
                                  ? '#9ca3af'
                                  : '#6366f1'
                            }}
                          />
                          <span className="font-bold text-neutral-900 dark:text-white">{v.color || '-'}</span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-2 px-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-extrabold text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700">
                          {v.size || '-'}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 font-mono">
                            {formatWeightDisplay(weightGrams)}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={v.sku || ''}
                          onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value })}
                          className="w-32 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[11px] font-mono"
                        />
                      </td>

                      {/* Stock */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={v.stock !== undefined ? v.stock : v.stockQuantity || 0}
                          onChange={(e) => handleUpdateVariant(v.id, { stock: parseInt(e.target.value, 10) || 0 })}
                          className="w-16 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-center font-mono focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Price Adjustment */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={v.priceAdjustment || 0}
                            onChange={(e) =>
                              handleUpdateVariant(v.id, { priceAdjustment: Number(e.target.value) || 0 })
                            }
                            className="w-16 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs text-center font-mono"
                          />
                        </div>
                      </td>

                      {/* Effective Price */}
                      <td className="py-2 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{effectivePrice}
                      </td>

                      {/* Image */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          {v.image ? (
                            <img
                              src={v.image}
                              alt={v.name}
                              className="w-7 h-7 rounded object-cover border border-neutral-300"
                            />
                          ) : (
                            <span className="w-7 h-7 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                              <ImageIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <input
                            type="text"
                            value={v.image || ''}
                            onChange={(e) => handleUpdateVariant(v.id, { image: e.target.value })}
                            placeholder="Image URL"
                            className="w-24 px-1.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[10px] truncate"
                          />
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
