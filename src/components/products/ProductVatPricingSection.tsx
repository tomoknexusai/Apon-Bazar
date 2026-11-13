import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Percent,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Info,
  CheckCircle2,
  DollarSign,
  ArrowRightLeft
} from 'lucide-react';
import {
  round2,
  calcFromExcl,
  calcFromIncl,
  getStoredGlobalVatSettings,
  GlobalVatSettings
} from '../../lib/vatPricingEngine';

export interface ProductVatPricingValues {
  mrpExclTax: number;
  mrpInclTax: number;
  sellingPriceExclTax: number;
  sellingPriceInclTax: number;
  taxRate: number;
  taxMode: 'included' | 'excluded';
  taxSource: 'global' | 'custom';
  discount: number;
  discountAmount: number;
  isManualOverride: boolean;
}

interface ProductVatPricingSectionProps {
  values: ProductVatPricingValues;
  onChange: (updates: Partial<ProductVatPricingValues & {
    mrp: number;
    sellingPrice: number;
    vatTax: number;
  }>) => void;
  dealerPrice?: number;
  onDealerPriceChange?: (val: number) => void;
  disabled?: boolean;
}

export const ProductVatPricingSection: React.FC<ProductVatPricingSectionProps> = ({
  values,
  onChange,
  dealerPrice,
  onDealerPriceChange,
  disabled = false
}) => {
  const [globalSettings] = useState<GlobalVatSettings>(() => getStoredGlobalVatSettings());

  const effectiveVatRate = values.taxSource === 'global' ? globalSettings.defaultVatRate : values.taxRate;
  const isOverride = values.isManualOverride;

  // Compute calculated Tax amounts for visual display
  const mrpTaxAmount = round2(Math.abs(values.mrpInclTax - values.mrpExclTax));
  const sellingTaxAmount = round2(Math.abs(values.sellingPriceInclTax - values.sellingPriceExclTax));

  // Handler for Price Excl changes
  const handleMrpExclChange = (valStr: string) => {
    const val = valStr === '' ? 0 : Number(valStr);
    if (isOverride) {
      onChange({
        mrpExclTax: val,
        mrp: values.taxMode === 'included' ? values.mrpInclTax : val
      });
    } else {
      const { priceIncl } = calcFromExcl(val, effectiveVatRate);
      // Also adjust selling price proportionally if discount is present
      const newSellingExcl = round2(val * (1 - (values.discount || 0) / 100));
      const { priceIncl: newSellingIncl } = calcFromExcl(newSellingExcl, effectiveVatRate);
      const newDiscountAmount = round2(val - newSellingExcl);

      onChange({
        mrpExclTax: val,
        mrpInclTax: priceIncl,
        mrp: values.taxMode === 'included' ? priceIncl : val,
        sellingPriceExclTax: newSellingExcl,
        sellingPriceInclTax: newSellingIncl,
        sellingPrice: values.taxMode === 'included' ? newSellingIncl : newSellingExcl,
        discountAmount: newDiscountAmount
      });
    }
  };

  // Handler for Price Incl changes
  const handleMrpInclChange = (valStr: string) => {
    const val = valStr === '' ? 0 : Number(valStr);
    if (isOverride) {
      onChange({
        mrpInclTax: val,
        mrp: values.taxMode === 'included' ? val : values.mrpExclTax
      });
    } else {
      const { priceExcl } = calcFromIncl(val, effectiveVatRate);
      const newSellingExcl = round2(priceExcl * (1 - (values.discount || 0) / 100));
      const { priceIncl: newSellingIncl } = calcFromExcl(newSellingExcl, effectiveVatRate);
      const newDiscountAmount = round2(priceExcl - newSellingExcl);

      onChange({
        mrpInclTax: val,
        mrpExclTax: priceExcl,
        mrp: values.taxMode === 'included' ? val : priceExcl,
        sellingPriceExclTax: newSellingExcl,
        sellingPriceInclTax: newSellingIncl,
        sellingPrice: values.taxMode === 'included' ? newSellingIncl : newSellingExcl,
        discountAmount: newDiscountAmount
      });
    }
  };

  // Handler for Selling Price Excl changes
  const handleSellingExclChange = (valStr: string) => {
    const val = valStr === '' ? 0 : Number(valStr);
    if (isOverride) {
      onChange({
        sellingPriceExclTax: val,
        sellingPrice: values.taxMode === 'included' ? values.sellingPriceInclTax : val
      });
    } else {
      const { priceIncl } = calcFromExcl(val, effectiveVatRate);
      const discAmt = round2(Math.max(0, values.mrpExclTax - val));
      const discPct = values.mrpExclTax > 0 ? round2((discAmt / values.mrpExclTax) * 100) : 0;

      onChange({
        sellingPriceExclTax: val,
        sellingPriceInclTax: priceIncl,
        sellingPrice: values.taxMode === 'included' ? priceIncl : val,
        discount: discPct,
        discountAmount: discAmt
      });
    }
  };

  // Handler for Selling Price Incl changes
  const handleSellingInclChange = (valStr: string) => {
    const val = valStr === '' ? 0 : Number(valStr);
    if (isOverride) {
      onChange({
        sellingPriceInclTax: val,
        sellingPrice: values.taxMode === 'included' ? val : values.sellingPriceExclTax
      });
    } else {
      const { priceExcl } = calcFromIncl(val, effectiveVatRate);
      const discAmt = round2(Math.max(0, values.mrpExclTax - priceExcl));
      const discPct = values.mrpExclTax > 0 ? round2((discAmt / values.mrpExclTax) * 100) : 0;

      onChange({
        sellingPriceInclTax: val,
        sellingPriceExclTax: priceExcl,
        sellingPrice: values.taxMode === 'included' ? val : priceExcl,
        discount: discPct,
        discountAmount: discAmt
      });
    }
  };

  // Handler for Discount % changes
  const handleDiscountPercentChange = (valStr: string) => {
    const pct = valStr === '' ? 0 : Math.min(100, Math.max(0, Number(valStr)));
    const newSellingExcl = round2(values.mrpExclTax * (1 - pct / 100));
    const { priceIncl: newSellingIncl } = calcFromExcl(newSellingExcl, effectiveVatRate);
    const discAmt = round2(values.mrpExclTax - newSellingExcl);

    onChange({
      discount: pct,
      discountAmount: discAmt,
      sellingPriceExclTax: newSellingExcl,
      sellingPriceInclTax: newSellingIncl,
      sellingPrice: values.taxMode === 'included' ? newSellingIncl : newSellingExcl
    });
  };

  // Handler for Discount Amount changes
  const handleDiscountAmountChange = (valStr: string) => {
    const amt = valStr === '' ? 0 : Math.max(0, Number(valStr));
    const newSellingExcl = round2(Math.max(0, values.mrpExclTax - amt));
    const { priceIncl: newSellingIncl } = calcFromExcl(newSellingExcl, effectiveVatRate);
    const discPct = values.mrpExclTax > 0 ? round2((amt / values.mrpExclTax) * 100) : 0;

    onChange({
      discount: discPct,
      discountAmount: amt,
      sellingPriceExclTax: newSellingExcl,
      sellingPriceInclTax: newSellingIncl,
      sellingPrice: values.taxMode === 'included' ? newSellingIncl : newSellingExcl
    });
  };

  // Handler for VAT Rate changes
  const handleVatRateChange = (rateStr: string) => {
    const rate = rateStr === '' ? 0 : Math.max(0, Number(rateStr));
    if (isOverride) {
      onChange({ taxRate: rate, vatTax: rate, taxSource: 'custom' });
    } else {
      // Recompute prices based on current taxMode
      let newMrpIncl = values.mrpInclTax;
      let newMrpExcl = values.mrpExclTax;
      let newSellingIncl = values.sellingPriceInclTax;
      let newSellingExcl = values.sellingPriceExclTax;

      if (values.taxMode === 'included') {
        newMrpExcl = calcFromIncl(values.mrpInclTax, rate).priceExcl;
        newSellingExcl = calcFromIncl(values.sellingPriceInclTax, rate).priceExcl;
      } else {
        newMrpIncl = calcFromExcl(values.mrpExclTax, rate).priceIncl;
        newSellingIncl = calcFromExcl(values.sellingPriceExclTax, rate).priceIncl;
      }

      onChange({
        taxRate: rate,
        vatTax: rate,
        taxSource: 'custom',
        mrpExclTax: newMrpExcl,
        mrpInclTax: newMrpIncl,
        mrp: values.taxMode === 'included' ? newMrpIncl : newMrpExcl,
        sellingPriceExclTax: newSellingExcl,
        sellingPriceInclTax: newSellingIncl,
        sellingPrice: values.taxMode === 'included' ? newSellingIncl : newSellingExcl
      });
    }
  };

  // Handler for Tax Mode change (Included vs Excluded)
  const handleTaxModeChange = (mode: 'included' | 'excluded') => {
    onChange({
      taxMode: mode,
      mrp: mode === 'included' ? values.mrpInclTax : values.mrpExclTax,
      sellingPrice: mode === 'included' ? values.sellingPriceInclTax : values.sellingPriceExclTax
    });
  };

  // Toggle Override Mode
  const toggleOverride = (overrideState: boolean) => {
    onChange({ isManualOverride: overrideState });
  };

  return (
    <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl space-y-5 shadow-xs">
      {/* Header & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/70 dark:border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
              প্রোডাক্ট প্রাইসিং ও ভ্যাট/ট্যাক্স হিসাব (Product Pricing & VAT/Tax)
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                NBR Certified
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              MRP, বিক্রয় মূল্য, ভ্যাট/ট্যাক্স হার ও ডিসকাউন্ট স্বয়ংক্রিয় সমন্বয়
            </p>
          </div>
        </div>

        {/* Auto Calculate vs Manual Override Controls */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => toggleOverride(false)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              !isOverride
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto Calculate (স্বয়ংক্রিয়)</span>
          </button>

          <button
            type="button"
            onClick={() => toggleOverride(true)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isOverride
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/50'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Manual Override (ম্যানুয়াল)</span>
          </button>
        </div>
      </div>

      {/* Manual Override Warning Banner */}
      {isOverride && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 rounded-2xl text-xs font-medium flex items-start gap-2.5 shadow-xs animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Manual price override is active.</span> Changing VAT/Tax rate may not automatically preserve this price. আপনি প্রতিটি মূল্য স্বাধীনভাবে পরিবর্তন করতে পারবেন।
          </div>
        </div>
      )}

      {/* VAT / Tax Configuration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 text-xs">
        {/* Tax Source */}
        <div>
          <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
            ভ্যাট উৎস (Tax Source)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange({
                  taxSource: 'global',
                  taxRate: globalSettings.defaultVatRate,
                  vatTax: globalSettings.defaultVatRate
                });
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold border text-center transition-all ${
                values.taxSource === 'global'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              গ্লোবাল ({globalSettings.defaultVatRate}%)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ taxSource: 'custom' })}
              className={`flex-1 py-2 px-2.5 rounded-xl font-bold border text-center transition-all ${
                values.taxSource === 'custom'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              কাস্টম হার
            </button>
          </div>
        </div>

        {/* VAT Rate Input */}
        <div>
          <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
            VAT / Tax হার (VAT Rate %) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              disabled={disabled || values.taxSource === 'global'}
              value={effectiveVatRate}
              onChange={(e) => handleVatRateChange(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-neutral-900 dark:text-white disabled:opacity-60"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">%</span>
          </div>
        </div>

        {/* VAT Mode (Included vs Excluded) */}
        <div>
          <label className="block text-neutral-700 dark:text-neutral-300 font-bold mb-1">
            ভ্যাট মোড (VAT Mode) *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleTaxModeChange('included')}
              className={`flex-1 py-2 px-2 rounded-xl font-bold border text-center transition-all ${
                values.taxMode === 'included'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              মূল্যে অন্তর্ভুক্ত (Included)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleTaxModeChange('excluded')}
              className={`flex-1 py-2 px-2 rounded-xl font-bold border text-center transition-all ${
                values.taxMode === 'excluded'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              মূল্য অতিরিক্ত (Excluded)
            </button>
          </div>
        </div>
      </div>

      {/* Main Pricing Matrix: MRP vs Selling Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MRP Box */}
        <div className="p-4 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
            <span className="font-black text-xs text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>১. MRP মূল্য (Maximum Retail Price)</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ভ্যাট: ৳ {mrpTaxAmount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* MRP Excl VAT */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                MRP Excluding VAT (৳) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  disabled={disabled}
                  value={values.mrpExclTax}
                  onChange={(e) => handleMrpExclChange(e.target.value)}
                  placeholder="1000"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">ভ্যাট ছাড়া নিট MRP</span>
            </div>

            {/* MRP Incl VAT */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                MRP Including VAT (৳) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  disabled={disabled}
                  value={values.mrpInclTax}
                  onChange={(e) => handleMrpInclChange(e.target.value)}
                  placeholder="1150"
                  className="w-full bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-sm font-black font-mono text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-bold">
                কাস্টমার প্যাক প্রাইস (ভ্যাটসহ)
              </span>
            </div>
          </div>
        </div>

        {/* Selling Price Box */}
        <div className="p-4 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
            <span className="font-black text-xs text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>২. বিক্রয় মূল্য (Selling Price)</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ভ্যাট: ৳ {sellingTaxAmount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Selling Price Excl VAT */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Selling Price Excluding VAT (৳) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  disabled={disabled}
                  value={values.sellingPriceExclTax}
                  onChange={(e) => handleSellingExclChange(e.target.value)}
                  placeholder="900"
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-neutral-400 block mt-0.5">ভ্যাট ছাড়া প্রকৃত বিক্রয়</span>
            </div>

            {/* Selling Price Incl VAT */}
            <div>
              <label className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                Selling Price Including VAT (৳) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  disabled={disabled}
                  value={values.sellingPriceInclTax}
                  onChange={(e) => handleSellingInclChange(e.target.value)}
                  placeholder="1035"
                  className="w-full bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl px-3 py-2 text-sm font-black font-mono text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5 font-bold">
                কাস্টমার ইনভয়েস মূল্য
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount & Dealer Price Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Discount Percentage */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            ডিসকাউন্ট শতকরা (Discount %)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              disabled={disabled}
              value={values.discount}
              onChange={(e) => handleDiscountPercentChange(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-neutral-900 dark:text-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">%</span>
          </div>
        </div>

        {/* Discount Amount */}
        <div>
          <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            ডিসকাউন্ট পরিমাণ (Discount Amount ৳)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0"
              disabled={disabled}
              value={values.discountAmount}
              onChange={(e) => handleDiscountAmountChange(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-neutral-900 dark:text-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-neutral-400">৳</span>
          </div>
        </div>

        {/* Dealer Price (if editable) */}
        {dealerPrice !== undefined && onDealerPriceChange && (
          <div>
            <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-500" /> ডিলার ক্রয় মূল্য (Dealer Price ৳)
              </span>
              <span className="text-[9px] bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-amber-800 dark:text-amber-300 font-bold">
                Admin
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                disabled={disabled}
                value={dealerPrice}
                onChange={(e) => onDealerPriceChange(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full bg-amber-50/40 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-black font-mono text-amber-900 dark:text-amber-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-600">৳</span>
            </div>
          </div>
        )}
      </div>

      {/* Realtime Example / Verification Bar */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <span className="text-neutral-500">
          ক্যালকুলেশন মেকানিজম: <strong>{effectiveVatRate}% VAT Rate</strong> ({values.taxMode === 'included' ? 'ভ্যাট অন্তর্ভূক্ত' : 'ভ্যাট অতিরিক্ত'})
        </span>
        <div className="flex items-center gap-3">
          <span className="text-neutral-700 dark:text-neutral-300">
            MRP: <strong className="text-emerald-600">৳{values.mrpInclTax.toLocaleString()}</strong> (Excl: ৳{values.mrpExclTax.toLocaleString()})
          </span>
          <span className="text-neutral-700 dark:text-neutral-300">
            Selling: <strong className="text-emerald-600">৳{values.sellingPriceInclTax.toLocaleString()}</strong> (Excl: ৳{values.sellingPriceExclTax.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};
