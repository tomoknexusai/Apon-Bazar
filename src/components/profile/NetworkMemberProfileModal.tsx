/**
 * Network Active Member Profile & Edit Modal Component
 * Handles viewing permanent network IDs and updating editable profile information
 * with Bangladesh mobile normalization, duplicate validation, and OTP verification.
 * 
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth, normalizeBDMobileNumber } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import { ServiceAddress } from '../../types';
import { LocationPicker } from '../common/LocationPicker';
import { ProfilePictureUploader } from './ProfilePictureUploader';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Lock,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  BadgeCheck,
  Calendar,
  Users,
  GitBranch,
  Hash,
  Sparkles,
  Camera,
  RefreshCw
} from 'lucide-react';

interface NetworkMemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NetworkMemberProfileModal: React.FC<NetworkMemberProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentUser, allUsers, updateProfile, updateServiceAddress } = useAuth();
  const { currentMember, updateMemberProfile } = useNetworkMarketing();
  const { language, t } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    currentUser?.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  );

  // Address State
  const [address, setAddress] = useState<Partial<ServiceAddress>>(
    currentUser?.mandatoryAddress || {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'ধানমন্ডি',
      unionName: 'ধানমন্ডি আ/এ',
      ward: 'ওয়ার্ড ০১',
      area: 'সোবহানবাগ রোড',
      postalCode: '1209',
      fullServiceAddress: 'সোবহানবাগ রোড, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা'
    }
  );

  // Validation & OTP State
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showOtpPrompt, setShowOtpPrompt] = useState(false);
  const [otpInput, setOtpInput] = useState('1234');
  const [pendingNormalizedMobile, setPendingNormalizedMobile] = useState('');

  if (!isOpen || !currentUser) return null;

  // Permanent Locked Values
  const permanentMemberId = currentUser.permanentMemberId || currentMember?.id || 'GBBD-100293';
  const networkMemberId = currentMember?.id || currentUser.id || 'mem-101';
  const sponsorId = currentMember?.sponsorId || currentUser.sponsorId || 'mem-root';
  const placementId = currentMember?.parentId || 'GBD000001';
  const registrationDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '১৫ জানুয়ারী, ২০২৫';

  // Handle Edit Profile Button Click
  const handleStartEdit = () => {
    setFullName(currentUser.fullName);
    setEmail(currentUser.email);
    setMobileNumber(currentUser.mobileNumber);
    setProfilePhotoUrl(
      currentUser.profilePhotoUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    );
    setAddress(
      currentUser.mandatoryAddress || {
        division: 'ঢাকা',
        district: 'ঢাকা',
        upazila: 'ধানমন্ডি',
        unionName: 'ধানমন্ডি আ/এ',
        ward: 'ওয়ার্ড ০১',
        area: 'সোবহানবাগ রোড',
        postalCode: '1209',
        fullServiceAddress: 'সোবহানবাগ রোড, ওয়ার্ড ০১, ধানমন্ডি আ/এ, ধানমন্ডি, ঢাকা'
      }
    );
    setErrorMessage('');
    setSuccessMessage('');
    setShowOtpPrompt(false);
    setIsEditing(true);
  };

  // Initiate Save Validation
  const handlePreSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage(language === 'bn' ? 'পূর্ণ নাম প্রদান করা আবশ্যক।' : 'Full Name is required.');
      return;
    }

    const normMobile = normalizeBDMobileNumber(mobileNumber);
    if (!normMobile || normMobile.length < 11) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশ মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।'
          : 'Please enter a valid 11-digit Bangladesh mobile number.'
      );
      return;
    }

    const currentNormMobile = normalizeBDMobileNumber(currentUser.mobileNumber);
    const isMobileChanged = normMobile !== currentNormMobile;

    if (isMobileChanged) {
      // 1. Check duplicate mobile number against all valid registered accounts
      const duplicateUser = allUsers.find((u) => {
        if (u.id === currentUser.id) return false;
        const uNorm = normalizeBDMobileNumber(u.mobileNumber);
        return uNorm === normMobile && (u.accountStatus === 'active' || u.accountStatus === 'pending');
      });

      if (duplicateUser) {
        setErrorMessage(
          language === 'bn'
            ? `⚠️ মোবাইল নম্বর '${normMobile}' দিয়ে ইতোমধ্যে একটি একাউন্ট নিবন্ধিত রয়েছে। অন্য নম্বর ব্যবহার করুন।`
            : `Mobile number '${normMobile}' is already registered to another account.`
        );
        return;
      }

      // 2. Mobile changed & unique -> Require OTP Verification
      setPendingNormalizedMobile(normMobile);
      setShowOtpPrompt(true);
      return;
    }

    // Mobile not changed -> Save directly
    executeProfileSave(normMobile);
  };

  // Verify OTP and Complete Profile Save
  const handleVerifyOtpAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.length < 4) {
      setErrorMessage(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক ৪-ডিজিটের OTP কোড প্রবেশ করান (ডিফল্ট: 1234)।'
          : 'Please enter valid 4-digit OTP (Default: 1234).'
      );
      return;
    }

    // Verify simulated OTP (1234 or any 4 digits)
    setShowOtpPrompt(false);
    executeProfileSave(pendingNormalizedMobile || normalizeBDMobileNumber(mobileNumber));
  };

  // Core Save Execution
  const executeProfileSave = (finalMobile: string) => {
    // 1. Update Auth Profile
    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber: finalMobile,
      profilePhotoUrl: profilePhotoUrl.trim()
    });

    // 2. Update Service Address
    if (address) {
      updateServiceAddress(address);
    }

    // 3. Update Network Marketing Member List (Preserves ID, Sponsor, Placement, Tree Position & Commissions)
    updateMemberProfile(currentUser.id, {
      fullName: fullName.trim(),
      mobile: finalMobile,
      email: email.trim(),
      avatarUrl: profilePhotoUrl.trim()
    });

    // 4. State & UI Refresh
    setSuccessMessage(
      language === 'bn'
        ? '✅ প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!'
        : 'Profile information updated successfully!'
    );
    setIsEditing(false);
    setShowOtpPrompt(false);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl my-8 p-6 shadow-2xl relative space-y-5 text-xs text-neutral-900 dark:text-neutral-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3.5">
            <ProfilePictureUploader
              currentPhotoUrl={isEditing ? profilePhotoUrl : currentUser.profilePhotoUrl}
              onPhotoSaved={(newUrl) => {
                setProfilePhotoUrl(newUrl);
                setSuccessMessage(
                  language === 'bn'
                    ? '✅ প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!'
                    : 'Profile picture updated successfully!'
                );
              }}
              size="sm"
              showUploadButton={false}
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-neutral-900 dark:text-white">
                  {currentUser.fullName}
                </h2>
                <BadgeCheck className="w-4 h-4 text-emerald-500" />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                  Network Active Member
                </span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" />
                <span>Permanent Member ID: <strong>{permanentMemberId}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW MODE                                                        */}
        {/* ----------------------------------------------------------------- */}
        {!isEditing && (
          <div className="space-y-4">
            
            {/* Permanent Locked Identifiers Card */}
            <div className="p-4 bg-gradient-to-br from-neutral-900 via-neutral-900 to-slate-950 text-white rounded-2xl border border-neutral-800 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Lock className="w-4 h-4" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    {language === 'bn' ? 'স্থায়ী ও পরিবর্তনঅযোগ্য নেটওয়ার্ক তথ্য' : 'Permanent & Locked Network Credentials'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-950 text-red-300 border border-red-800">
                  LOCKED 🔒
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-neutral-400 font-semibold block">🆔 Unique ID</span>
                  <span className="font-mono font-black text-emerald-400 text-xs">{currentUser.aponUniqueId || permanentMemberId}</span>
                </div>

                {currentUser.businessType && (
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] text-neutral-400 font-semibold block">🏢 Business Type</span>
                    <span className="font-bold text-amber-300 text-xs">{currentUser.businessType}</span>
                  </div>
                )}

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-neutral-400 font-semibold block">🆔 Network Member ID</span>
                  <span className="font-mono font-bold text-teal-300 text-xs">{networkMemberId}</span>
                </div>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-neutral-400 font-semibold block">👥 Sponsor ID</span>
                  <span className="font-mono font-bold text-sky-300 text-xs">{sponsorId}</span>
                </div>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-neutral-400 font-semibold block">👥 Placement ID</span>
                  <span className="font-mono font-bold text-indigo-300 text-xs">{placementId}</span>
                </div>

                <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 sm:col-span-2 md:col-span-1">
                  <span className="text-[10px] text-neutral-400 font-semibold block">📅 Registration Date</span>
                  <span className="font-bold text-neutral-200 text-xs">{registrationDate}</span>
                </div>
              </div>
            </div>

            {/* Editable Profile Information Summary */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
                <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Profile Information'}</span>
                </span>

                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>[ Edit Profile ]</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">👤 Full Name</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs">{currentUser.fullName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">📱 Mobile Number</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs">{currentUser.mobileNumber}</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">✉️ Email Address</span>
                  <span className="font-bold text-neutral-900 dark:text-white text-xs">{currentUser.email}</span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">🟢 Account Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Active & Verified</span>
                </div>
              </div>

              {currentUser.mandatoryAddress && (
                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Mandatory Service Address</span>
                  </span>
                  <p className="font-bold text-neutral-900 dark:text-white text-xs">
                    {currentUser.mandatoryAddress.area}, {currentUser.mandatoryAddress.unionName},{' '}
                    {currentUser.mandatoryAddress.upazila}, {currentUser.mandatoryAddress.district} -{' '}
                    {currentUser.mandatoryAddress.postalCode}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>[ Edit Profile ]</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 font-bold text-xs rounded-xl transition-all"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close Profile'}
              </button>
            </div>

          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* EDIT MODE FORM                                                   */}
        {/* ----------------------------------------------------------------- */}
        {isEditing && (
          <form onSubmit={handlePreSave} className="space-y-4">
            
            <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔒 নিরাপত্তা নির্দেশিকা:</strong> স্থায়ী মেম্বার আইডি, স্পন্সর আইডি, প্লেসমেন্ট আইডি, বাইনারি অবস্থান ও কমিশন হিস্ট্রি চিরস্থায়ী এবং পরিবর্তনঅযোগ্য। কেবল আপনার ব্যক্তিগত যোগাযোগের তথ্য ও সার্ভিস এড্রেস আপডেট করতে পারবেন।
              </div>
            </div>

            {/* Locked Read-Only Fields Container */}
            <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-2">
              <span className="font-extrabold text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>{language === 'bn' ? 'স্থায়ী মেম্বারশিপ ও নেটওয়ার্ক আইডি (পরিবর্তনঅযোগ্য)' : 'Permanent Locked Credentials'}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-semibold">
                    Permanent Member ID
                  </label>
                  <input
                    type="text"
                    value={permanentMemberId}
                    disabled
                    readOnly
                    className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-mono font-black text-emerald-600 dark:text-emerald-400 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-semibold">
                    Network Member ID
                  </label>
                  <input
                    type="text"
                    value={networkMemberId}
                    disabled
                    readOnly
                    className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-neutral-700 dark:text-neutral-300 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-semibold">
                    Sponsor ID
                  </label>
                  <input
                    type="text"
                    value={sponsorId}
                    disabled
                    readOnly
                    className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-sky-600 dark:text-sky-400 cursor-not-allowed text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-semibold">
                    Placement ID
                  </label>
                  <input
                    type="text"
                    value={placementId}
                    disabled
                    readOnly
                    className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-not-allowed text-xs"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-2">
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-semibold">
                    Registration Date
                  </label>
                  <input
                    type="text"
                    value={registrationDate}
                    disabled
                    readOnly
                    className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-bold text-neutral-700 dark:text-neutral-300 cursor-not-allowed text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Editable Profile Fields */}
            <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
              <span className="font-bold text-neutral-900 dark:text-white block border-b border-neutral-100 dark:border-neutral-800 pb-2 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সম্পাদনাযোগ্য প্রোফাইল ফিল্ডসমূহ' : 'Editable Profile Fields'}</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                    {t('fullName')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block">
                    ইমেইল ঠিকানা <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                {/* Mobile Number with Format Validation Note */}
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block flex items-center justify-between">
                    <span>{t('mobileNumber')} <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-semibold">BD Format 01XXXXXXXXX</span>
                  </label>
                  <input
                    type="text"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-neutral-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    * মোবাইল নম্বর পরিবর্তন করলে নতুন নম্বরে OTP যাচাইকরণ আবশ্যক।
                  </span>
                </div>

                {/* Profile Photo Management */}
                <div className="space-y-2 sm:col-span-2 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300 block flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-500" />
                      <span>প্রোফাইল ছবি পরিবর্তন (ক্যামেরা ও গ্যালারি)</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">অটো স্কয়ার ক্রপ</span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <ProfilePictureUploader
                      currentPhotoUrl={profilePhotoUrl}
                      onPhotoSaved={(newUrl) => setProfilePhotoUrl(newUrl)}
                      size="sm"
                      showUploadButton={true}
                    />
                    
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[10px] text-neutral-400 block font-medium">
                        সরাসরি ইমেজ লিংক (ঐচ্ছিক):
                      </label>
                      <input
                        type="text"
                        value={profilePhotoUrl}
                        onChange={(e) => setProfilePhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2 text-neutral-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory Service Address Component */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <LocationPicker
                  initialAddress={address}
                  onSaveAddress={(updatedAddr) => setAddress(updatedAddr)}
                  title="বাধ্যতামূলক সার্ভিস ডেলিভারি এড্রেস"
                />
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>আপডেট ও সংরক্ষণ করুন</span>
              </button>
            </div>

          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* OTP VERIFICATION MODAL OVERLAY FOR MOBILE CHANGE                  */}
        {/* ----------------------------------------------------------------- */}
        {showOtpPrompt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    মোবাইল নম্বর পরিবর্তন OTP যাচাইকরণ
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    নতুন নম্বর: <strong className="font-mono text-emerald-600">{pendingNormalizedMobile}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                আপনার নতুন মোবাইল নম্বরে একটি ৪-ডিজিটের নিরাপত্তা OTP কোড পাঠানো হয়েছে। অনুগ্রহ করে কোডটি প্রবেশ করিয়ে আপডেটটি সম্পন্ন করুন।
              </p>

              <form onSubmit={handleVerifyOtpAndSave} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                    ৪-ডিজিট OTP কোড (ডিফল্ট: 1234)
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={4}
                    required
                    className="w-full text-center text-lg font-mono font-black tracking-widest bg-neutral-50 dark:bg-neutral-800 border-2 border-emerald-500 rounded-2xl p-2.5 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpPrompt(false)}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold rounded-xl text-xs"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md"
                  >
                    OTP যাচাইকরণ ও সেভ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
