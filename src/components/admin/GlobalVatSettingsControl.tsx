import React, { useState, useEffect } from 'react';
import {
  Percent,
  CheckCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  RefreshCw,
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import {
  GlobalVatSettings,
  getStoredGlobalVatSettings,
  saveStoredGlobalVatSettings,
  getStoredVatAuditLogs,
  addVatAuditLog,
  bulkApplyGlobalTaxToProducts,
  VatAuditLog
} from '../../lib/vatPricingEngine';

interface GlobalVatSettingsControlProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const GlobalVatSettingsControl: React.FC<GlobalVatSettingsControlProps> = ({
  onClose,
  isModal = false
}) => {
  const { products, editProduct, bulkUpdateProducts } = useECommerce() as any;
  const { currentUser } = useAuth();

  const [settings, setSettings] = useState<GlobalVatSettings>(getStoredGlobalVatSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bulk update modal state
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    affected: number;
    skipped: number;
    custom: number;
  } | null>(null);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<VatAuditLog[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);

  useEffect(() => {
    setAuditLogs(getStoredVatAuditLogs());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (settings.defaultVatRate < 0 || settings.defaultVatRate > 100) {
      setErrorMsg('ভ্যাট হার অবশ্যই ০% থেকে ১০০% এর মধ্যে হতে হবে।');
      return;
    }

    setIsSaving(true);
    try {
      const prev = getStoredGlobalVatSettings();
      const updated: GlobalVatSettings = {
        ...settings,
        defaultVatRate: Number(settings.defaultVatRate) || 0,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.id || 'APON-SADMIN-001'
      };

      saveStoredGlobalVatSettings(updated);
      setSettings(updated);

      // Audit Log
      addVatAuditLog({
        actorId: currentUser?.id || 'APON-SADMIN-001',
        actorName: currentUser?.fullName || 'Super Admin',
        actorRole: currentUser?.primaryRole || 'super_admin',
        action: 'GLOBAL_VAT_UPDATE',
        previousValue: prev,
        newValue: updated,
        vatRate: updated.defaultVatRate,
        details: `Global VAT updated to ${updated.defaultVatRate}% (${updated.defaultVatMode})`
      });
      setAuditLogs(getStoredVatAuditLogs());

      setSuccessMsg('গ্লোবাল ভ্যাট ও ট্যাক্স সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'সেটিংস সংরক্ষণে ত্রুটি দেখা দিয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToAllProducts = async () => {
    if (!currentUser) return;
    setIsBulkApplying(true);
    setErrorMsg(null);

    try {
      await new Promise((r) => setTimeout(r, 400));
      const res = bulkApplyGlobalTaxToProducts(products, settings, currentUser as any);

      // Apply to context if helper exists or batch edit
      if (bulkUpdateProducts) {
        bulkUpdateProducts(res.updatedProducts);
      } else {
        res.updatedProducts.forEach((p) => {
          editProduct(p.id, {
            vatTax: p.vatTax,
            taxRate: p.taxRate,
            taxMode: p.taxMode,
            taxSource: p.taxSource,
            mrpExclTax: p.mrpExclTax,
            mrpInclTax: p.mrpInclTax,
            mrp: p.mrp,
            sellingPriceExclTax: p.sellingPriceExclTax,
            sellingPriceInclTax: p.sellingPriceInclTax,
            campaignPrice: p.campaignPrice,
            discountPrice: p.discountPrice
          });
        });
      }

      setBulkResult({
        affected: res.affectedCount,
        skipped: res.skippedCount,
        custom: res.customCount
      });
      setIsBulkConfirmOpen(false);
      setAuditLogs(getStoredVatAuditLogs());
      setSuccessMsg(`বাল্ক আপডেট সফল হয়েছে! ${res.affectedCount} টি পণ্য আপডেট হয়েছে।`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'পণ্য তালিকায় গ্লোবাল ভ্যাট প্রয়োগ করতে ত্রুটি হয়েছে');
    } finally {
      setIsBulkApplying(false);
    }
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              গ্লোবাল ভ্যাট ও ট্যাক্স কনফিগারেশন (Global VAT/Tax)
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Super Admin
              </span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              পুরো Apon Bazar-এর ডিফল্ট ট্যাক্স রেট, ট্যাক্স মোড ও বাল্ক আপডেট নিয়ন্ত্রণ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAuditLogs(!showAuditLogs)}
          className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-blue-500" />
          <span>অডিট লগ ({auditLogs.length})</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bulk Update Report Banner if applicable */}
      {bulkResult && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>বাল্ক ভ্যাট আপডেট ফলাফল রিপোর্ট:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-neutral-700 dark:text-neutral-300">
            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-[10px] text-neutral-400 block font-semibold">আপডেটকৃত পণ্য:</span>
              <strong className="text-emerald-600 font-mono text-sm">{bulkResult.affected} টি</strong>
            </div>
            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-[10px] text-neutral-400 block font-semibold">কাস্টম ট্যাক্স সংরক্ষিত:</span>
              <strong className="text-amber-600 font-mono text-sm">{bulkResult.custom} টি</strong>
            </div>
            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-[10px] text-neutral-400 block font-semibold">অপরিবর্তিত (Skipped):</span>
              <strong className="text-neutral-600 font-mono text-sm">{bulkResult.skipped} টি</strong>
            </div>
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400 pt-1 font-medium">
            * নিশ্চিত করা হয়েছে: পূর্বে সম্পন্নকৃত কোনো অর্ডার বা ইনভয়েসের হিসাব অপরিবর্তিত রাখা হয়েছে।
          </p>
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* 1. Global VAT Enabled Switch */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 text-xs block">
                গ্লোবাল ভ্যাট ও ট্যাক্স সক্রিয় (Global VAT/Tax Enabled)
              </label>
              <p className="text-[11px] text-neutral-500">
                সক্রিয় থাকলে পণ্যে স্বয়ংক্রিয়ভাবে ভ্যাট গণনা ও ইনভয়েস যুক্ত হবে
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* 2. Default VAT/Tax Rate */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
            <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
              <span>ডিফল্ট ভ্যাট হার (Default VAT/Tax Rate %)</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">
                বর্তমানে: {settings.defaultVatRate}%
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.defaultVatRate}
                onChange={(e) =>
                  setSettings({ ...settings, defaultVatRate: Number(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-neutral-400 font-mono">
                %
              </span>
            </div>
            <p className="text-[10px] text-neutral-500">
              যেমন: বাংলাদেশে স্ট্যান্ডার্ড পণ্য ভ্যাট ১৫% অথবা খাদ্যশস্যে ৫%
            </p>
          </div>

          {/* 3. VAT/Tax Mode */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-2 md:col-span-2">
            <label className="font-bold text-neutral-800 dark:text-neutral-200 block">
              ভ্যাট মোড নির্বাচন (VAT/Tax Mode)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setSettings({ ...settings, defaultVatMode: 'included' })}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  settings.defaultVatMode === 'included'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                }`}
              >
                <input
                  type="radio"
                  name="vatMode"
                  checked={settings.defaultVatMode === 'included'}
                  onChange={() => {}}
                  className="mt-1 text-emerald-600"
                />
                <div>
                  <strong className="text-xs text-neutral-900 dark:text-white block font-bold">
                    VAT/Tax Included (মূল্যের সাথে অন্তর্ভুক্ত)
                  </strong>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    গ্রাহকের প্রদর্শিত বিক্রয়মূল্যের মধ্যেই ভ্যাট অন্তর্ভুক্ত থাকবে। খুচরা বিক্রয় ও এমআরপিতে এটি সর্বাধিক ব্যবহৃত হয়।
                  </p>
                </div>
              </label>

              <label
                onClick={() => setSettings({ ...settings, defaultVatMode: 'excluded' })}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  settings.defaultVatMode === 'excluded'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                }`}
              >
                <input
                  type="radio"
                  name="vatMode"
                  checked={settings.defaultVatMode === 'excluded'}
                  onChange={() => {}}
                  className="mt-1 text-emerald-600"
                />
                <div>
                  <strong className="text-xs text-neutral-900 dark:text-white block font-bold">
                    VAT/Tax Excluded (মূল্যের অতিরিক্ত প্রযোজ্য)
                  </strong>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    পণ্যের বিক্রয়মূল্যের সাথে চেকআউটে আলাদাভাবে ভ্যাট যুক্ত হবে। পাইকারি বা বিশেষ করযুক্ত পণ্যের জন্য উপযুক্ত।
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Bulk Update Trigger */}
          <button
            type="button"
            onClick={() => setIsBulkConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Apply Global Tax to Existing Products (বাল্ক আপডেট)</span>
          </button>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                বাতিল (Close)
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন (Save Changes)'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal for Bulk Apply */}
      {isBulkConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                গ্লোবাল ভ্যাট বাল্ক আপডেট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                "You are about to update VAT/Tax for all applicable products. Existing orders will not be affected."
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-2xl text-xs space-y-1.5 border border-neutral-200 dark:border-neutral-700">
              <div className="flex justify-between">
                <span className="text-neutral-500">প্রযোজ্য ভ্যাট হার:</span>
                <strong className="text-emerald-600 font-mono">{settings.defaultVatRate}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">ট্যাক্স মোড:</span>
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {settings.defaultVatMode === 'included' ? 'VAT Included' : 'VAT Excluded'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">কাস্টম ট্যাক্স পণ্য:</span>
                <span className="text-amber-600 font-bold">স্বয়ংক্রিয়ভাবে সংরক্ষিত থাকবে</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkConfirmOpen(false)}
                disabled={isBulkApplying}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleApplyToAllProducts}
                disabled={isBulkApplying}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isBulkApplying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>আপডেট হচ্ছে...</span>
                  </>
                ) : (
                  <span>হ্যাঁ, সকল পণ্যে প্রয়োগ করুন</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Drawer / Section */}
      {showAuditLogs && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-500" />
              <span>ভ্যাট ও ট্যাক্স পরিবর্তন অডিট লগ (VAT Audit History)</span>
            </h3>
            <span className="text-[11px] text-neutral-400 font-mono">
              মোট রেকর্ড: {auditLogs.length}
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-neutral-500 py-3 text-center">
              এখনো কোনো ভ্যাট পরিবর্তনের অডিট লগ সংরক্ষিত নেই।
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {log.action === 'GLOBAL_VAT_UPDATE'
                        ? 'গ্লোবাল ভ্যাট পরিবর্তন'
                        : log.action === 'BULK_VAT_APPLIED'
                        ? 'বাল্ক ভ্যাট প্রয়োগ'
                        : 'পণ্য ভ্যাট পরিবর্তন'}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(log.timestamp).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500">
                    <span>সম্পাদনাকারী: <strong>{log.actorName}</strong> ({log.actorRole})</span>
                    {log.vatRate !== undefined && (
                      <span className="font-mono font-bold text-emerald-600">
                        • {log.vatRate}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
