/**
 * 15-Field Customer Network & Financial Summary Panel
 * Strictly ledger-derived and isolated to the authenticated customer's AB- record.
 * Project: আপন বাজার (APON BAZAR)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { COMPANY_MASTER_ROOT_ID, CustomerDashboardSummary } from '../../types/networkMarketing';
import {
  User,
  Hash,
  ShieldCheck,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  Users,
  GitBranch,
  Layers,
  Zap,
  Crown,
  Wallet,
  Coins,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';

async function copyTextSafe(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  } catch {
    // Ignore
  }
  return false;
}

export const CustomerNetworkSummaryPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    currentMember,
    ownCompanyMemberId,
    customerDashboardSummary,
    dashboardLoading,
    dashboardError,
    refreshCustomerDashboard,
    wallets,
    walletSummary,
    tokenSummary,
    legStats,
    ranks
  } = useNetworkMarketing();

  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  if (!currentUser) return null;

  const handleCopy = async (value: string, type: 'code' | 'link') => {
    const ok = await copyTextSafe(value);
    if (ok) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  if (dashboardLoading && !customerDashboardSummary) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 flex items-center justify-center gap-3 text-xs text-neutral-500">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>নেটওয়ার্ক ও ওয়ালেট ড্যাশবোর্ড তথ্য লোড হচ্ছে...</span>
      </div>
    );
  }

  if (dashboardError && !customerDashboardSummary && !currentMember) {
    return (
      <div
        role="alert"
        className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200 font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{dashboardError}</span>
        </div>
        <button
          type="button"
          onClick={() => refreshCustomerDashboard()}
          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>আবার চেষ্টা করুন</span>
        </button>
      </div>
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fallbackRankObj = ranks.find((r) => r.rank === (currentMember?.rank || 'customer')) || ranks[0];
  const resolvedCustomerId =
    customerDashboardSummary?.customerId ||
    currentMember?.id ||
    ownCompanyMemberId ||
    currentUser.customerId ||
    currentUser.binaryCompanyId ||
    '';

  const summary: CustomerDashboardSummary | null =
    customerDashboardSummary ||
    (currentMember
      ? {
          customerId: currentMember.id,
          userId: currentMember.userId || currentUser.id,
          fullName: currentMember.fullName || currentUser.fullName,
          mobile: currentMember.mobile || currentUser.mobileNumber,
          email: currentMember.email || currentUser.email,
          accountStatus: currentUser.accountStatus === 'active' ? 'active' : 'inactive',
          networkStatus:
            currentMember.activationStatus === 'active' || (currentMember.pv || 0) > 0
              ? 'active'
              : 'inactive',
          referralCode: currentMember.id,
          referralLink: `${origin}/register?ref=${currentMember.id}`,
          sponsorId: currentMember.sponsorId || COMPANY_MASTER_ROOT_ID,
          sponsorName: currentMember.sponsorName || COMPANY_MASTER_ROOT_ID,
          placementParentId: currentMember.parentId || null,
          placementParentName: null,
          placementPosition:
            currentMember.id === COMPANY_MASTER_ROOT_ID
              ? 'ROOT'
              : currentMember.placementLeg === 'right'
              ? 'RIGHT'
              : 'LEFT',
          placementLevel: currentMember.placementLevel || 1,
          registrationTimestamp: currentMember.registeredAt || currentMember.joinDate || currentUser.createdAt,
          leftLeg: legStats.left,
          rightLeg: legStats.right,
          matchingPV: legStats.matchingPV,
          personalPV: currentMember.pv || 0,
          activationPackage: {
            packageId: currentMember.packageId || null,
            packageName: currentMember.packageName || 'কোনো সক্রিয় প্যাকেজ নেই',
            pv: currentMember.pv || 0,
            status:
              currentMember.activationStatus === 'active' || (currentMember.pv || 0) > 0
                ? 'active'
                : 'inactive',
            activationDate: currentMember.activationDate || null,
            orderOrPaymentRef: currentMember.orderOrPaymentRef || null
          },
          earnedRank: {
            rank: currentMember.rank || 'customer',
            titleBn: fallbackRankObj?.titleBn || 'সাধারণ গ্রাহক',
            titleEn: fallbackRankObj?.titleEn || 'Customer',
            qualificationStatus:
              currentMember.rankQualificationStatus ||
              (currentMember.rank && currentMember.rank !== 'customer' && (currentMember.pv || 0) > 0
                ? 'qualified'
                : 'unqualified'),
            achievedDate: currentMember.rankAchievedAt || null,
            activeDirectReferrals: currentMember.directReferralsCount || 0,
            teamPV: (currentMember.leftPV || 0) + (currentMember.rightPV || 0)
          },
          wallets,
          walletSummary,
          walletTransactions: [],
          tokenSummary
        }
      : null);

  if (!summary) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-600" />
              <span>গ্রাহক নেটওয়ার্ক ও ওয়ালেট সারসংক্ষেপ</span>
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              এই অ্যাকাউন্টটি এখনো কোনো বাইনারি নেটওয়ার্ক স্লটে প্লেস হয়নি। সকল ওয়ালেট ও টোকেন ব্যালেন্স ০ থেকে শুরু হয়।
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold text-[10px]">
            Network Status: UNPLACED
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">অ্যাক্টিভেশন প্যাকেজ</span>
            <strong className="text-xs text-neutral-900 dark:text-white">কোনো সক্রিয় প্যাকেজ নেই (0 PV)</strong>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">অর্জিত র‍্যাঙ্ক</span>
            <strong className="text-xs text-neutral-900 dark:text-white">সাধারণ গ্রাহক / Customer</strong>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">কমিশন ওয়ালেট</span>
            <strong className="text-sm font-mono font-black text-emerald-600">
              ৳ {(wallets?.commissionWallet || 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <span className="text-[10px] text-neutral-500 block">TOMOK টোকেন ব্যালেন্স</span>
            <strong className="text-sm font-mono font-black text-teal-600">
              {(tokenSummary?.balance || 0).toLocaleString()} TOMOK
            </strong>
          </div>
        </div>
      </div>
    );
  }

  const formattedRegTime = summary.registrationTimestamp
    ? new Date(summary.registrationTimestamp).toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—';

  const isPkgActive = summary.activationPackage.status === 'active' && summary.activationPackage.pv > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
        <div>
          <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>গ্রাহক নেটওয়ার্ক, প্যাকেজ, র‍্যাঙ্ক ও ওয়ালেট সারসংক্ষেপ (১৫-ফিল্ড অডিটেড ডাটা)</span>
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            প্রতিটি তথ্য শুধুমাত্র আপনার স্থায়ী লেজার ও বাইনারি ট্রি রেকর্ড থেকে সরাসরি হিসাবকৃত।
          </p>
        </div>

        <button
          type="button"
          onClick={() => refreshCustomerDashboard(resolvedCustomerId)}
          disabled={dashboardLoading}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* 15 Audited Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-xs">
        {/* 1. Member Profile */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-0.5">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <User className="w-3 h-3 text-emerald-600" /> ১. মেম্বার প্রোফাইল
          </span>
          <div className="font-black text-neutral-900 dark:text-white truncate">{summary.fullName}</div>
          <div className="text-[10px] text-neutral-500 font-mono truncate">{summary.mobile}</div>
          <div className="text-[10px] text-neutral-400 truncate">{summary.email}</div>
        </div>

        {/* 2. Customer ID */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-semibold">
            <Hash className="w-3 h-3" /> ২. কাস্টমার আইডি (Customer ID)
          </span>
          <div className="font-mono font-black text-sm text-emerald-900 dark:text-emerald-200">
            {summary.customerId}
          </div>
          <span className="text-[10px] text-neutral-500 block">স্থায়ী নেটওয়ার্ক আইডি</span>
        </div>

        {/* 3. Account Status */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> ৩. অ্যাকাউন্ট স্ট্যাটাস
          </span>
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                summary.accountStatus === 'active'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {summary.accountStatus === 'active' ? 'ACTIVE (সক্রিয়)' : summary.accountStatus}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 block">ই-কমার্স ও লগইন এক্সেস</span>
        </div>

        {/* 4. Network Status */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-1">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <Globe className="w-3 h-3 text-teal-600" /> ৪. নেটওয়ার্ক স্ট্যাটাস
          </span>
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                summary.networkStatus === 'active'
                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {summary.networkStatus === 'active' ? 'ACTIVE MEMBER' : 'INACTIVE (প্যাকেজ প্রয়োজন)'}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 block">Personal PV: {formatPV(summary.personalPV)} PV</span>
        </div>

        {/* 5. Referral Code */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <Hash className="w-3 h-3 text-emerald-600" /> ৫. রেফারেল কোড
          </span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="font-mono font-black text-neutral-900 dark:text-white truncate">
              {summary.referralCode}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(summary.referralCode, 'code')}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedType === 'code' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedType === 'code' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 6. Referral Link */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex flex-col justify-between">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <LinkIcon className="w-3 h-3 text-emerald-600" /> ৬. রেফারেল লিংক
          </span>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="font-mono text-[10px] text-neutral-700 dark:text-neutral-300 truncate">
              {summary.referralLink}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(summary.referralLink, 'link')}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedType === 'link' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedType === 'link' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* 7. Sponsor ID */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-0.5">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <Users className="w-3 h-3 text-sky-600" /> ৭. স্পন্সর আইডি (Sponsor)
          </span>
          <div className="font-mono font-black text-sky-700 dark:text-sky-300">{summary.sponsorId}</div>
          <div className="text-[10px] text-neutral-500 truncate">{summary.sponsorName}</div>
        </div>

        {/* 8. Placement Parent ID */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-0.5">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <GitBranch className="w-3 h-3 text-indigo-600" /> ৮. প্লেসমেন্ট প্যারেন্ট আইডি
          </span>
          <div className="font-mono font-black text-indigo-700 dark:text-indigo-300">
            {summary.placementParentId || 'ROOT'}
          </div>
          <div className="text-[10px] text-neutral-500 truncate">
            {summary.placementParentName || (summary.placementParentId ? summary.placementParentId : 'কোম্পানি মাস্টার রুট')}
          </div>
        </div>

        {/* 9. Placement Position + Level + Registered At */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-0.5">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <Layers className="w-3 h-3 text-indigo-600" /> ৯. প্লেসমেন্ট পজিশন ও লেভেল
          </span>
          <div className="font-black text-neutral-900 dark:text-white">
            {summary.placementPosition} • Level {summary.placementLevel}
          </div>
          <div className="text-[10px] text-neutral-400 truncate">নিবন্ধন: {formattedRegTime}</div>
        </div>

        {/* 10. Left Leg Summary */}
        <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-0.5">
          <span className="text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-1 font-semibold">
            <ArrowLeftRight className="w-3 h-3" /> ১০. বাম লেগ (Left Leg)
          </span>
          <div className="font-black text-blue-900 dark:text-blue-200 font-mono">
            {summary.leftLeg.totalMembers} জন • {formatPV(summary.leftLeg.totalEligiblePV)} PV
          </div>
          <div className="text-[10px] text-neutral-500">
            সক্রিয়: {summary.leftLeg.activeMembers} | নিষ্ক্রিয়: {summary.leftLeg.inactiveMembers}
          </div>
        </div>

        {/* 11. Right Leg Summary */}
        <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 space-y-0.5">
          <span className="text-[10px] text-teal-700 dark:text-teal-300 flex items-center gap-1 font-semibold">
            <ArrowLeftRight className="w-3 h-3" /> ১১. ডান লেগ (Right Leg)
          </span>
          <div className="font-black text-teal-900 dark:text-teal-200 font-mono">
            {summary.rightLeg.totalMembers} জন • {formatPV(summary.rightLeg.totalEligiblePV)} PV
          </div>
          <div className="text-[10px] text-neutral-500">
            সক্রিয়: {summary.rightLeg.activeMembers} | নিষ্ক্রিয়: {summary.rightLeg.inactiveMembers}
          </div>
        </div>

        {/* 12. Activation Package */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-0.5">
          <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-semibold">
            <Zap className="w-3 h-3 text-amber-500" /> ১২. অ্যাক্টিভেশন প্যাকেজ
          </span>
          <div className={`font-black truncate ${isPkgActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {summary.activationPackage.packageName}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            {formatPV(summary.activationPackage.pv)} PV • {isPkgActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
          </div>
        </div>

        {/* 13. Earned Rank */}
        <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-0.5">
          <span className="text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-1 font-semibold">
            <Crown className="w-3 h-3" /> ১৩. অর্জিত র‍্যাঙ্ক (Earned Rank)
          </span>
          <div className="font-black text-amber-900 dark:text-amber-200 truncate">
            {summary.earnedRank.titleBn} ({summary.earnedRank.titleEn})
          </div>
          <div className="text-[10px] text-neutral-500">
            যোগ্যতা: {summary.earnedRank.qualificationStatus === 'qualified' ? 'Qualified' : 'Unqualified (Initial)'}
          </div>
        </div>

        {/* 14. Commission Wallet */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-0.5">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1 font-semibold">
            <Wallet className="w-3 h-3" /> ১৪. কমিশন ওয়ালেট
          </span>
          <div className="font-mono font-black text-base text-emerald-700 dark:text-emerald-300">
            ৳ {(summary.wallets.commissionWallet ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            ক্রেডিট: ৳ {(summary.walletSummary.totalCredit ?? 0).toLocaleString()} | পেন্ডিং: ৳ {(summary.walletSummary.pendingBalance ?? 0).toLocaleString()}
          </div>
        </div>

        {/* 15. TOMOK Token Balance */}
        <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-300 dark:border-teal-800 space-y-0.5">
          <span className="text-[10px] text-teal-800 dark:text-teal-300 flex items-center gap-1 font-semibold">
            <Coins className="w-3 h-3" /> ১৫. TOMOK টোকেন ব্যালেন্স
          </span>
          <div className="font-mono font-black text-base text-teal-700 dark:text-teal-300">
            {(summary.tokenSummary.balance ?? 0).toLocaleString()} TOMOK
          </div>
          <div className="text-[10px] text-neutral-500 font-mono">
            ক্রেডিট: {(summary.tokenSummary.totalCredit ?? 0).toLocaleString()} | ডেবিট: {(summary.tokenSummary.totalDebit ?? 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
