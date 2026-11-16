/**
 * Super Admin Company & Branding Settings Management Panel
 * Project: APON BAZAR (আপন বাজার)
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CredentialAuditLogRecord } from '../../types';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Image as ImageIcon,
  FileText,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Sparkles
} from 'lucide-react';

export const CompanyBrandingSettingsPanel: React.FC = () => {
  const {
    systemSettings,
    updateSystemSettings,
    refreshCompanySettings,
    currentUser,
    activeRole
  } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [companyName, setCompanyName] = useState(systemSettings.companyName || 'APON BAZAR');
  const [companyNameBn, setCompanyNameBn] = useState(systemSettings.companyNameBn || 'আপন বাজার');
  const [supportEmail, setSupportEmail] = useState(systemSettings.supportEmail || '');
  const [customerServiceEmail, setCustomerServiceEmail] = useState(systemSettings.customerServiceEmail || '');
  const [sellerContactEmail, setSellerContactEmail] = useState(
    systemSettings.sellerContactEmail || systemSettings.dealerContactEmail || ''
  );
  const [officialPhone, setOfficialPhone] = useState(systemSettings.officialPhone || '');
  const [companyAddress, setCompanyAddress] = useState(systemSettings.companyAddress || '');
  const [websiteUrl, setWebsiteUrl] = useState(systemSettings.websiteUrl || '');
  const [companyLogoUrl, setCompanyLogoUrl] = useState(systemSettings.companyLogoUrl || '/apon-bazar-logo.png');
  const [invoiceDisplayInfo, setInvoiceDisplayInfo] = useState(systemSettings.invoiceDisplayInfo || '');
  const [emailSenderName, setEmailSenderName] = useState(systemSettings.emailSenderName || 'APON BAZAR');
  const [emailSenderEmail, setEmailSenderEmail] = useState(systemSettings.emailSenderEmail || '');
  const [tokenName, setTokenName] = useState(systemSettings.tokenName || 'TOMOK');
  const [currencyCode, setCurrencyCode] = useState(systemSettings.currencyCode || 'BDT');
  const [currencySymbol, setCurrencySymbol] = useState(systemSettings.currencySymbol || '৳');
  const [timezone, setTimezone] = useState(systemSettings.timezone || 'Asia/Dhaka');
  const [companyMasterId, setCompanyMasterId] = useState(systemSettings.companyMasterId || 'AB-1000000001');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<CredentialAuditLogRecord[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const syncFormFromSettings = (src = systemSettings) => {
    setCompanyName(src.companyName || 'APON BAZAR');
    setCompanyNameBn(src.companyNameBn || 'আপন বাজার');
    setSupportEmail(src.supportEmail || '');
    setCustomerServiceEmail(src.customerServiceEmail || '');
    setSellerContactEmail(src.sellerContactEmail || src.dealerContactEmail || '');
    setOfficialPhone(src.officialPhone || '');
    setCompanyAddress(src.companyAddress || '');
    setWebsiteUrl(src.websiteUrl || '');
    setCompanyLogoUrl(src.companyLogoUrl || '/apon-bazar-logo.png');
    setInvoiceDisplayInfo(src.invoiceDisplayInfo || '');
    setEmailSenderName(src.emailSenderName || src.companyName || 'APON BAZAR');
    setEmailSenderEmail(src.emailSenderEmail || '');
    setTokenName(src.tokenName || 'TOMOK');
    setCurrencyCode(src.currencyCode || 'BDT');
    setCurrencySymbol(src.currencySymbol || '৳');
    setTimezone(src.timezone || 'Asia/Dhaka');
    setCompanyMasterId(src.companyMasterId || 'AB-1000000001');
  };

  useEffect(() => {
    syncFormFromSettings(systemSettings);
  }, [
    systemSettings.companyName,
    systemSettings.companyNameBn,
    systemSettings.supportEmail,
    systemSettings.customerServiceEmail,
    systemSettings.sellerContactEmail,
    systemSettings.dealerContactEmail,
    systemSettings.officialPhone,
    systemSettings.companyAddress,
    systemSettings.websiteUrl,
    systemSettings.companyLogoUrl,
    systemSettings.invoiceDisplayInfo,
    systemSettings.emailSenderName,
    systemSettings.emailSenderEmail,
    systemSettings.tokenName,
    systemSettings.currencyCode,
    systemSettings.currencySymbol,
    systemSettings.timezone,
    systemSettings.companyMasterId
  ]);

  const fetchSettingsAndAudits = async () => {
    await refreshCompanySettings();
    setLoadingAudit(true);
    try {
      const resp = await fetch('/api/super-admin/credential-audit-logs?limit=25', {
        headers: {
          'x-user-role': currentUser?.primaryRole || activeRole || '',
          'x-user-id': currentUser?.id || '',
          'x-user-name': encodeURIComponent(currentUser?.fullName || '')
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        const logs = Array.isArray(data?.logs) ? (data.logs as CredentialAuditLogRecord[]) : [];
        setAuditLogs(logs.filter((l) => l.actionType === 'COMPANY_SETTINGS_UPDATED'));
      }
    } catch {
      // Ignore transient network audit read errors
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndAudits();
  }, [currentUser?.id, activeRole]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে একটি সঠিক ইমেজ ফাইল (PNG/JPG/WebP/SVG) নির্বাচন করুন।' : 'Please select a valid image file.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setErrorMessage(isBn ? 'লোগো ফাইলের আকার ১.৫ MB-এর কম হতে হবে।' : 'Logo file size must be under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCompanyLogoUrl(reader.result);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSaveMessage(null);

    if (!companyName.trim()) {
      setErrorMessage(isBn ? 'ইংরেজি কোম্পানির নাম (Company Display Name) আবশ্যক।' : 'English company display name is required.');
      return;
    }
    if (!companyNameBn.trim()) {
      setErrorMessage(isBn ? 'বাংলা কোম্পানির নাম আবশ্যক।' : 'Bengali company display name is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailFields: Array<{ label: string; value: string }> = [
      { label: 'Support Email', value: supportEmail.trim() },
      { label: 'Customer Service Email', value: customerServiceEmail.trim() },
      { label: 'Seller/Dealer Contact Email', value: sellerContactEmail.trim() },
      { label: 'Email Notification Sender Email', value: emailSenderEmail.trim() }
    ];
    for (const field of emailFields) {
      if (field.value && !emailRegex.test(field.value)) {
        setErrorMessage(`${field.label}-এর ফরম্যাট সঠিক নয়।`);
        return;
      }
    }

    if (websiteUrl.trim() && !/^https?:\/\/[^\s]+$/i.test(websiteUrl.trim())) {
      setErrorMessage(isBn ? 'ওয়েবসাইট URL অবশ্যই http:// অথবা https:// দিয়ে শুরু হতে হবে।' : 'Website URL must start with http:// or https://');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateSystemSettings({
        companyName: companyName.trim(),
        companyNameBn: companyNameBn.trim(),
        supportEmail: supportEmail.trim(),
        customerServiceEmail: customerServiceEmail.trim(),
        sellerContactEmail: sellerContactEmail.trim(),
        dealerContactEmail: sellerContactEmail.trim(),
        officialPhone: officialPhone.trim(),
        companyAddress: companyAddress.trim(),
        websiteUrl: websiteUrl.trim(),
        companyLogoUrl: companyLogoUrl.trim() || '/apon-bazar-logo.png',
        invoiceDisplayInfo: invoiceDisplayInfo.trim(),
        emailSenderName: emailSenderName.trim() || companyName.trim(),
        emailSenderEmail: emailSenderEmail.trim(),
        tokenName: tokenName.trim() || 'TOMOK',
        currencyCode: currencyCode.trim() || 'BDT',
        currencySymbol: currencySymbol.trim() || '৳',
        timezone: timezone.trim() || 'Asia/Dhaka',
        companyMasterId: companyMasterId.trim().toUpperCase() || 'AB-1000000001'
      });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setSaveMessage(
        isBn
          ? 'কোম্পানি ও ব্র্যান্ডিং সেটিংস সফলভাবে ব্যাকএন্ডে সংরক্ষিত ও সিস্টেমে সিঙ্ক করা হয়েছে!'
          : 'Company & branding settings saved and synchronized across the application!'
      );
      await fetchSettingsAndAudits();
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'সেটিংস সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  const emailProviderStatus = systemSettings.emailProviderStatus;
  const isProviderConfigured = Boolean(emailProviderStatus?.configured);

  return (
    <div className="space-y-6">
      {/* Header & Honest Email Provider Status */}
      <div className="bg-white border border-[#C8E6C9] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8F5E9] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F5E9] border border-[#A5D6A7] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[#157347]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#157347]">
                কোম্পানি ও ব্র্যান্ডিং সেটিংস (Company & Branding Settings)
              </h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                এখানে সংরক্ষিত তথ্য হেডার, ফুটার, এসইও, ইনভয়েস PDF, রেজিস্ট্রেশন ও ফাইন্যান্স রিপোর্টে সরাসরি প্রতিফলিত হবে।
              </p>
            </div>
          </div>

          {/* Live Brand Preview Pill */}
          <div className="flex items-center gap-3 bg-[#F4FBF5] border border-[#C8E6C9] rounded-xl px-3.5 py-2 shrink-0">
            <img
              src={companyLogoUrl || '/apon-bazar-logo.png'}
              alt={companyName}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/apon-bazar-logo.png';
              }}
              className="w-9 h-9 rounded-lg object-cover border border-emerald-200 bg-white"
            />
            <div>
              <div className="text-xs font-black text-[#157347] uppercase leading-tight">{companyName || 'APON BAZAR'}</div>
              <div className="text-[11px] font-bold text-emerald-700 leading-tight">{companyNameBn || 'আপন বাজার'}</div>
            </div>
          </div>
        </div>

        {/* Honest Server Email Provider Status */}
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            isProviderConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {isProviderConfigured ? (
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="font-bold">
              সার্ভার ইমেইল প্রোভাইডার অবস্থা:{' '}
              {isProviderConfigured
                ? `কনফিগারড (${emailProviderStatus?.provider.toUpperCase()})`
                : 'কনফিগার করা নেই (Not Configured — SMTP / Resend / SendGrid পাওয়া যায়নি)'}
            </div>
            <p className="text-[11px] opacity-90">
              {emailProviderStatus?.message ||
                'বর্তমানে সার্ভার এনভায়রনমেন্টে কোনো বাস্তব ইমেইল প্রোভাইডার (SMTP / Resend / SendGrid) কনফিগার করা নেই। আপনি এখান থেকে প্রেরকের নাম ও ইমেইল সংরক্ষণ করতে পারবেন, তবে প্রোভাইডার কনফিগার না হওয়া পর্যন্ত স্বয়ংক্রিয় ইমেইল পাঠানো হবে না।'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Editable Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#C8E6C9] rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 text-xs">
        {/* Identity & Logo Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#157347] flex items-center gap-2 border-b border-[#E8F5E9] pb-2">
            <Sparkles className="w-4 h-4" />
            <span>১. প্রতিষ্ঠানের মূল পরিচয় ও লোগো (Brand Identity & Logo)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">
                কোম্পানির নাম (ইংরেজি) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                id="input-company-name-en"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="APON BAZAR"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">
                কোম্পানির নাম (বাংলা) <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                id="input-company-name-bn"
                value={companyNameBn}
                onChange={(e) => setCompanyNameBn(e.target.value)}
                required
                placeholder="আপন বাজার"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#157347]" />
                <span>কোম্পানির লোগো URL বা ফাইল আপলোড (Company Logo)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="text"
                  id="input-company-logo-url"
                  value={companyLogoUrl}
                  onChange={(e) => setCompanyLogoUrl(e.target.value)}
                  placeholder="/apon-bazar-logo.png"
                  className="flex-1 bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
                />
                <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#157347] border border-[#A5D6A7] rounded-xl font-bold cursor-pointer transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>লোগো আপলোড</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Public Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#157347] flex items-center gap-2 border-b border-[#E8F5E9] pb-2">
            <Mail className="w-4 h-4" />
            <span>২. অফিসিয়াল যোগাযোগ ও ঠিকানা (Contact & Support Details)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">অফিসিয়াল সাপোর্ট ইমেইল (Support Email)</label>
              <input
                type="email"
                id="input-support-email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="সুপার এডমিন কর্তৃক কনফিগারযোগ্য"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">কাস্টমার সার্ভিস ইমেইল (Customer Service Email)</label>
              <input
                type="email"
                id="input-customer-service-email"
                value={customerServiceEmail}
                onChange={(e) => setCustomerServiceEmail(e.target.value)}
                placeholder="কাস্টমার সাপোর্ট ইমেইল লিখুন"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">সেলার ও ডিলার যোগাযোগ ইমেইল (Seller/Dealer Contact Email)</label>
              <input
                type="email"
                id="input-seller-contact-email"
                value={sellerContactEmail}
                onChange={(e) => setSellerContactEmail(e.target.value)}
                placeholder="ডিলার/সেলার যোগাযোগের ইমেইল লিখুন"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#157347]" />
                <span>অফিসিয়াল যোগাযোগ নম্বর (Official Contact Number)</span>
              </label>
              <input
                type="text"
                id="input-official-phone"
                value={officialPhone}
                onChange={(e) => setOfficialPhone(e.target.value)}
                placeholder="+880..."
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#157347]" />
                <span>অফিসিয়াল ওয়েবসাইট URL (Website URL)</span>
              </label>
              <input
                type="url"
                id="input-website-url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#157347]" />
                <span>প্রতিষ্ঠানের ঠিকানা (Company Address)</span>
              </label>
              <input
                type="text"
                id="input-company-address"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="অফিসের পূর্ণাঙ্গ ঠিকানা লিখুন"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice, Email Sender & Core System Parameters */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#157347] flex items-center gap-2 border-b border-[#E8F5E9] pb-2">
            <FileText className="w-4 h-4" />
            <span>৩. ইনভয়েস, ইমেইল প্রেরক ও কোর সিস্টেম সেটিংস (Invoice, Email Sender & Core Config)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-neutral-700 block">
                ইনভয়েস ডিসপ্লে তথ্য / ফুটার নোট (Invoice Display Info)
              </label>
              <textarea
                rows={2}
                id="input-invoice-display-info"
                value={invoiceDisplayInfo}
                onChange={(e) => setInvoiceDisplayInfo(e.target.value)}
                placeholder="ইনভয়েস PDF ও প্রিন্টে প্রদর্শিত হওয়ার জন্য অতিরিক্ত তথ্য (ঐচ্ছিক)"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">ইমেইল প্রেরকের নাম (Email Sender Name)</label>
              <input
                type="text"
                id="input-email-sender-name"
                value={emailSenderName}
                onChange={(e) => setEmailSenderName(e.target.value)}
                placeholder="APON BAZAR"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">ইমেইল প্রেরকের ঠিকানা (Email Sender Address)</label>
              <input
                type="email"
                id="input-email-sender-email"
                value={emailSenderEmail}
                onChange={(e) => setEmailSenderEmail(e.target.value)}
                placeholder="সার্ভার ইমেইল প্রেরকের ঠিকানা (ঐচ্ছিক)"
                className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">টোকেন নাম ও কোম্পানি মাস্টার আইডি</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono font-bold outline-none"
                />
                <input
                  type="text"
                  value={companyMasterId}
                  onChange={(e) => setCompanyMasterId(e.target.value.toUpperCase())}
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono font-bold uppercase outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-neutral-700 block">মুদ্রা ও টাইমজোন (Currency & Timezone)</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 font-mono outline-none"
                />
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 text-center font-bold outline-none"
                />
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-[#F4FBF5] border border-[#C8E6C9] focus:bg-white focus:border-[#198754] rounded-xl p-2.5 text-neutral-900 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 text-[#198754] shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8F5E9]">
          <span className="text-[11px] text-neutral-500">
            সর্বশেষ আপডেট: {systemSettings.updatedAt ? new Date(systemSettings.updatedAt).toLocaleString('bn-BD') : 'ব্যাকএন্ড সিঙ্কড'}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                syncFormFromSettings(systemSettings);
                setErrorMessage(null);
              }}
              disabled={isSaving}
              className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
            <button
              type="submit"
              id="btn-save-company-branding-settings"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#198754] hover:bg-[#157347] text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>সেটিংস সংরক্ষণ করুন</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Audit Logs for Company Settings */}
      <div className="bg-white border border-[#C8E6C9] rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E8F5E9] pb-2">
          <div className="flex items-center gap-2 text-sm font-black text-[#157347]">
            <Activity className="w-4 h-4 text-[#198754]" />
            <span>কোম্পানি ও ব্র্যান্ডিং পরিবর্তনের অডিট লগ (Company Settings Audit Trail)</span>
          </div>
          <span className="text-xs font-mono text-neutral-500">{auditLogs.length} টি রেকর্ড</span>
        </div>
        {loadingAudit ? (
          <div className="text-xs text-neutral-500 py-3 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>অডিট লগ লোড হচ্ছে...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-neutral-500 py-2">এখনো কোনো কোম্পানি সেটিংস পরিবর্তনের অডিট রেকর্ড তৈরি হয়নি।</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-[#F4FBF5] border border-[#E8F5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-emerald-950">{log.details}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    সুপার এডমিন: {log.superAdminName} ({log.superAdminId})
                  </div>
                </div>
                <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                  {new Date(log.timestamp).toLocaleString('bn-BD')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
