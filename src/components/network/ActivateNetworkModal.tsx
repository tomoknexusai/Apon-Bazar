/**
 * Activate Network Marketing Modal Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { useNotifications } from '../../context/NotificationContext';
import {
  X,
  Zap,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Coins,
  Compass,
  Copy,
  Check,
  ExternalLink,
  Bot
} from 'lucide-react';

interface ActivateNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ActivateNetworkModal: React.FC<ActivateNetworkModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, updateProfile } = useAuth();
  const {
    findSponsor,
    validateSponsorId,
    findSmartGeoSponsor,
    findAIBinaryPlacement,
    executeNetworkActivationAndPlacement,
    packages
  } = useNetworkMarketing();
  const { addNotification } = useNotifications();

  const [sponsorInput, setSponsorInput] = useState(currentUser?.sponsorId || '');
  const [useSmartGeo, setUseSmartGeo] = useState(!currentUser?.sponsorId);
  const [placementLeg, setPlacementLeg] = useState<'left' | 'right'>('left');
  const [selectedPackageId, setSelectedPackageId] = useState('pkg-100');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [activationResult, setActivationResult] = useState<any>(null);

  if (!isOpen) return null;

  // AI Live Smart Geo Sponsor Calculation
  const geoResult = findSmartGeoSponsor(
    currentUser?.latitude,
    currentUser?.longitude,
    currentUser?.mandatoryAddress?.district,
    currentUser?.mandatoryAddress?.upazila
  );

  // Active Sponsor ID determination
  const effectiveSponsorId = useSmartGeo ? geoResult.sponsor.id : sponsorInput.trim();
  const sponsorValidation = effectiveSponsorId ? validateSponsorId(effectiveSponsorId) : { isValid: false, sponsor: undefined, message: '' };

  // AI Binary Tree Placement Location Preview
  const aiPlacementPreview = sponsorValidation.isValid && sponsorValidation.sponsor
    ? findAIBinaryPlacement(sponsorValidation.sponsor.id, placementLeg)
    : undefined;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!useSmartGeo && !sponsorInput.trim()) {
      setError('অনুগ্রহ করে সঠিক স্পন্সর আইডি প্রদান করুন অথবা AI Smart Geo Placement নির্বাচন করুন');
      return;
    }

    if (!useSmartGeo && !sponsorValidation.isValid) {
      setError(sponsorValidation.message || 'Invalid Sponsor ID');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      // Execute AI Automatic Referral and Placement Engine
      const res = executeNetworkActivationAndPlacement({
        userId: currentUser.id,
        fullName: currentUser.fullName,
        mobile: currentUser.mobileNumber,
        email: currentUser.email,
        sponsorIdInput: useSmartGeo ? geoResult.sponsor.id : sponsorInput.trim(),
        preferredLeg: placementLeg,
        packageId: selectedPackageId,
        latitude: currentUser.latitude,
        longitude: currentUser.longitude,
        district: currentUser.mandatoryAddress?.district,
        upazila: currentUser.mandatoryAddress?.upazila,
        permanentMemberId: currentUser.permanentMemberId
      });

      if (!res.success) {
        setError(res.message);
        setLoading(false);
        return;
      }

      // Update AuthContext Profile
      updateProfile({
        sponsorId: res.sponsorId,
        isNetworkActive: true
      });

      setActivationResult(res);
      setLoading(false);
      if (onSuccess) onSuccess();
    }, 600);
  };

  const handleCopyLink = (linkStr: string) => {
    navigator.clipboard.writeText(linkStr);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-emerald-600 rounded-2xl text-white shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>নেটওয়ার্ক অ্যাক্টিভেশন ও AI প্লেসমেন্ট</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Auto AI
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                স্থায়ী মেম্বার আইডি: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{currentUser.permanentMemberId || currentUser.id}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!activationResult ? (
          <form onSubmit={handleActivate} className="py-4 space-y-4 overflow-y-auto pr-1 flex-1">
            
            {/* Account preservation badge */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-2xl flex items-center gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  একই পারমানেন্ট মেম্বার আইডি ব্যবহার হচ্ছে
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Member ID: <strong className="font-mono">{currentUser.permanentMemberId || currentUser.id}</strong> | নাম: {currentUser.fullName}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Company Master ID Sponsor Notice */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>কোম্পানি মাস্টার আইডি স্পন্সর (Company Master ID)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 font-mono">
                  স্বয়ংক্রিয় স্পন্সর
                </span>
              </div>
              <div className="font-black text-neutral-900 dark:text-white text-sm">
                TOMSHOPBD Master Root (ID: GBD000001 / mem-root)
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                বাজার সদাই পলিসি অনুযায়ী স্পন্সর সর্বদা কোম্পানি মাস্টার আইডি। আলাদা কোনো ম্যানুয়াল স্পন্সর নির্বাচনের সুযোগ নেই। প্রথম অর্ডার ডেলিভারি ও পেমেন্ট প্রাপ্তির পর AI বাইনারি ট্রি-তে স্বয়ংক্রিয়ভাবে মেম্বার পজিশন প্লেসমেন্ট করবে।
              </p>
            </div>

            {/* AI Binary Tree Placement Preview */}
            {aiPlacementPreview && (
              <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 p-3 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>AI Binary Tree Target Location:</span>
                </span>
                <p className="text-[11px] text-teal-800 dark:text-teal-300 font-mono">
                  {aiPlacementPreview.positionText}
                </p>
              </div>
            )}

            {/* Binary Tree Placement Leg Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                বাইনারি ট্রি প্রেফারেন্স লেগ (Binary Preference Leg) *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlacementLeg('left')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    placementLeg === 'left'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="block text-[10px] font-mono text-neutral-400 uppercase">Left Team</span>
                  <span>বাম লেগ (Left Leg)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlacementLeg('right')}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    placementLeg === 'right'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="block text-[10px] font-mono text-neutral-400 uppercase">Right Team</span>
                  <span>ডান লেগ (Right Leg)</span>
                </button>
              </div>
            </div>

            {/* Starter Package Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                প্রারম্ভিক অ্যাক্টিভেশন প্যাকেজ নির্বাচন করুন *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      selectedPackageId === pkg.id
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 block font-mono">
                      {formatPV(pkg.pv)} PV
                    </span>
                    <span className="text-xs font-bold block truncate">{pkg.nameBn}</span>
                    <span className="text-[11px] font-mono text-neutral-500 block">৳ {(pkg.priceBDT ?? 0).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>অ্যাক্টিভেট করা হচ্ছে...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>নেটওয়ার্ক অ্যাক্টিভেশন ও AI প্লেসমেন্ট সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* SUCCESS & ASSET GENERATION CONFIRMATION VIEW */
          <div className="py-5 space-y-4 text-center overflow-y-auto pr-1 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl ring-8 ring-emerald-100 dark:ring-emerald-950/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                অ্যাক্টিভেশন ও প্লেসমেন্ট সফল হয়েছে!
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                {activationResult.message}
              </p>
            </div>

            {/* Generated Assets Card */}
            <div className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 text-left space-y-3 max-w-md mx-auto text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-700">
                <span className="font-bold text-neutral-900 dark:text-white">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Network Active Member
                </span>
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block font-mono">PERMANENT MEMBER ID</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{activationResult.referralCode}</span>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block font-mono">REFERRAL CODE</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">{activationResult.referralCode}</span>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block font-mono">SPONSOR ID</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">{activationResult.sponsorId}</span>
                </div>

                <div className="bg-white dark:bg-neutral-800 p-2 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] text-neutral-400 block font-mono">PLACEMENT ID</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">{activationResult.placementId}</span>
                </div>
              </div>

              {/* Referral Link Copy Field */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">
                  🔗 আপনার ইউনিক রেফারেল লিঙ্ক (Referral Link)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={activationResult.referralLink}
                    className="flex-1 bg-white dark:bg-neutral-900 text-[11px] font-mono p-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 text-neutral-800 dark:text-neutral-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(activationResult.referralLink)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Binary Position Text */}
              <div className="text-[11px] text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-xl font-mono">
                📍 <strong>Binary Position:</strong> {activationResult.binaryPositionText}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl shadow-md text-xs"
              >
                নেটওয়ার্ক ড্যাশবোর্ড দেখুন (Go to Dashboard)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
