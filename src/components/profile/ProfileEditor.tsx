/**
 * Comprehensive User Profile Editor & KYC Verification Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth, normalizeBDMobileNumber } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useLanguage } from '../../context/LanguageContext';
import { LocationPicker } from '../common/LocationPicker';
import { ProfilePictureUploader } from './ProfilePictureUploader';
import {
  User,
  ShieldCheck,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Lock,
  KeyRound,
  Hash,
  Camera
} from 'lucide-react';

export const ProfileEditor: React.FC = () => {
  const { currentUser, allUsers, updateProfile, updateServiceAddress, submitKyc } = useAuth();
  const { currentMember, updateMemberProfile } = useNetworkMarketing();
  const { language, t } = useLanguage();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    currentUser?.profilePhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
  );
  const [nationalId, setNationalId] = useState(currentUser?.nationalId || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || '1995-01-01');
  const [gender, setGender] = useState(currentUser?.gender || 'male');
  
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // OTP Verification for Mobile Number Update
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('1234');
  const [pendingMobile, setPendingMobile] = useState('');

  // KYC Modal State
  const [showKycModal, setShowKycModal] = useState(false);
  const [nidNumberInput, setNidNumberInput] = useState(currentUser?.nationalId || '');
  const [dobInput, setDobInput] = useState(currentUser?.dateOfBirth || '1995-01-01');

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-neutral-500 font-sans">
        প্রোফাইল সম্পাদনা করার জন্য অনুগ্রহ করে লগইন করুন।
      </div>
    );
  }

  const isSuperAdmin = currentUser?.roles?.includes('super_admin') || currentUser?.primaryRole === 'super_admin';

  // Permanent Locked Identifiers
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg(language === 'bn' ? 'পূর্ণ নাম প্রদান করা আবশ্যক।' : 'Full Name is required.');
      return;
    }

    const normMobile = normalizeBDMobileNumber(mobileNumber);
    if (!normMobile || normMobile.length < 11) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের বাংলাদেশ মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।'
          : 'Please enter a valid 11-digit Bangladesh mobile number.'
      );
      return;
    }

    const currentNormMobile = normalizeBDMobileNumber(currentUser.mobileNumber);
    const isMobileChanged = normMobile !== currentNormMobile;

    if (isMobileChanged) {
      // Duplicate check against other valid accounts
      const duplicateUser = allUsers.find((u) => {
        if (u.id === currentUser.id) return false;
        const uNorm = normalizeBDMobileNumber(u.mobileNumber);
        return uNorm === normMobile && (u.accountStatus === 'active' || u.accountStatus === 'pending');
      });

      if (duplicateUser) {
        setErrorMsg(
          language === 'bn'
            ? `⚠️ মোবাইল নম্বর '${normMobile}' দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত রয়েছে। অন্য নম্বর ব্যবহার করুন।`
            : `Mobile number '${normMobile}' is already registered to another account.`
        );
        return;
      }

      // Require OTP verification
      setPendingMobile(normMobile);
      setShowOtpModal(true);
      return;
    }

    // Direct Save
    executeSave(normMobile);
  };

  const handleVerifyOtpAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.length < 4) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে সঠিক ৪-ডিজিটের OTP কোড প্রবেশ করান (ডিফল্ট: 1234)।'
          : 'Please enter valid 4-digit OTP.'
      );
      return;
    }

    setShowOtpModal(false);
    executeSave(pendingMobile || normalizeBDMobileNumber(mobileNumber));
  };

  const executeSave = (finalMobile: string) => {
    updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      mobileNumber: finalMobile,
      profilePhotoUrl: profilePhotoUrl.trim(),
      nationalId,
      dateOfBirth,
      gender
    });

    updateMemberProfile(currentUser.id, {
      fullName: fullName.trim(),
      mobile: finalMobile,
      email: email.trim(),
      avatarUrl: profilePhotoUrl.trim()
    });

    setSavedMsg(true);
    setErrorMsg('');
    setTimeout(() => setSavedMsg(false), 4000);
  };

  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitKyc(nidNumberInput, dobInput);
    setShowKycModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Large Touch-Friendly Profile Picture Uploader with Camera, Gallery & Auto-Crop */}
            <ProfilePictureUploader
              currentPhotoUrl={profilePhotoUrl}
              onPhotoSaved={(newUrl) => setProfilePhotoUrl(newUrl)}
              size="md"
              showUploadButton={true}
            />

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  {currentUser.fullName}
                </h2>
                {currentUser.verificationStatus === 'verified' && (
                  <span title="Verified User"><ShieldCheck className="w-5 h-5 text-emerald-500" /></span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                {currentUser.email} | {currentUser.mobileNumber}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {t('accountStatus')}: {t(currentUser.accountStatus as any)}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    currentUser.verificationStatus === 'verified'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : currentUser.verificationStatus === 'pending'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300'
                  }`}
                >
                  {t('kycStatus')}: {t(currentUser.verificationStatus as any)}
                </span>
              </div>
            </div>
          </div>

          {/* TOMOK Token Balance Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-md min-w-[240px]">
            <span className="text-[11px] font-medium opacity-85 block uppercase tracking-wider">
              {t('tomokTokenBalance')}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono">
                {(currentUser?.tomokTokenBalance || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold">TOMOK</span>
            </div>
            <span className="text-[10px] opacity-75 block mt-1">
              ১ TOMOK ≈ ১.০০ {t('currency')}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* Global Messages */}
        {savedMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>প্রোফাইল তথ্য সফলভাবে আপডেট করা হয়েছে!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl font-bold text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Permanent Locked Network Identifiers */}
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-2">
            <span className="font-extrabold text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>স্থায়ী ও পরিবর্তনঅযোগ্য নেটওয়ার্ক সদস্য আইডি</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              LOCKED 🔒
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">
                🆔 Permanent Member ID
              </label>
              <input
                type="text"
                value={permanentMemberId}
                disabled
                readOnly
                className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-black text-emerald-600 dark:text-emerald-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">
                🆔 Network Member ID
              </label>
              <input
                type="text"
                value={networkMemberId}
                disabled
                readOnly
                className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-neutral-700 dark:text-neutral-300 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">
                👥 Sponsor ID
              </label>
              <input
                type="text"
                value={sponsorId}
                disabled
                readOnly
                className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-sky-600 dark:text-sky-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">
                👥 Placement ID
              </label>
              <input
                type="text"
                value={placementId}
                disabled
                readOnly
                className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-mono font-bold text-indigo-600 dark:text-indigo-400 cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-2">
              <label className="text-[10px] text-neutral-500 dark:text-neutral-400 font-semibold block">
                📅 Registration Date
              </label>
              <input
                type="text"
                value={registrationDate}
                disabled
                readOnly
                className="w-full bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2 font-bold text-neutral-700 dark:text-neutral-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <User className="w-5 h-5" />
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">
              {t('personalInfo')}
            </h3>
          </div>

          {currentUser.verificationStatus !== 'verified' && (
            <button
              type="button"
              onClick={() => setShowKycModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{t('submitKyc')}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>{t('fullName')} <span className="text-rose-500">*</span></span>
                {!isSuperAdmin && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> আইডি হোল্ডার পরিবর্তন করতে পারবেন না
                  </span>
                )}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={!isSuperAdmin}
                readOnly={!isSuperAdmin}
                className={`w-full rounded-lg p-2.5 font-medium transition-all ${
                  !isSuperAdmin
                    ? 'bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {!isSuperAdmin && (
                <p className="text-[10px] text-neutral-500 font-medium">
                  🔒 সিকিউরিটি পলিসি: অ্যাকাউন্ট হোল্ডার নাম পরিবর্তন করতে পারবেন না (কেবলমাত্র সুপার এডমিন পরিবর্তন করতে পারেন)।
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">
                ইমেইল ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>{t('mobileNumber')} <span className="text-rose-500">*</span></span>
                {!isSuperAdmin && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> আইডি হোল্ডার পরিবর্তন করতে পারবেন না
                  </span>
                )}
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                disabled={!isSuperAdmin}
                readOnly={!isSuperAdmin}
                className={`w-full rounded-lg p-2.5 font-medium transition-all ${
                  !isSuperAdmin
                    ? 'bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-1 focus:ring-emerald-500'
                }`}
              />
              {!isSuperAdmin && (
                <p className="text-[10px] text-neutral-500 font-medium">
                  🔒 সিকিউরিটি পলিসি: অ্যাকাউন্ট হোল্ডার মোবাইল নম্বর পরিবর্তন করতে পারবেন না (কেবলমাত্র সুপার এডমিন পরিবর্তন করতে পারেন)।
                </p>
              )}
            </div>

            {/* Profile Photo Management Section */}
            <div className="space-y-2 sm:col-span-2 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700">
              <label className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  <span>প্রোফাইল ছবি (ক্যামেরা / গ্যালারি আপলোড)</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  অটো ক্রপ ও ফাস্ট কম্প্রেশন
                </span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ProfilePictureUploader
                  currentPhotoUrl={profilePhotoUrl}
                  onPhotoSaved={(newUrl) => setProfilePhotoUrl(newUrl)}
                  size="sm"
                  showUploadButton={true}
                />
                
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium block">
                    সরাসরি ইমেজ URL লিংক ব্যবহার করুন (ঐচ্ছিক):
                  </label>
                  <input
                    type="text"
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-neutral-400">
                    💡 ক্যামেরা বা গ্যালারি থেকে ছবি তুলতে উপরের "ছবি আপলোড করুন" বাটনে ট্যাপ করুন।
                  </p>
                </div>
              </div>
            </div>

            {/* National ID */}
            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">
                {t('nationalId')} (NID)
              </label>
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="১০, ১৩ বা ১৭ ডিজিট NID"
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">
                  {t('dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-neutral-700 dark:text-neutral-300">
                  {t('gender')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                  <option value="other">{t('other')}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            {savedMsg ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> প্রোফাইল তথ্য আপডেট করা হয়েছে!
              </span>
            ) : (
              <span className="text-neutral-400 text-[11px]">
                * আপনার তথ্য সুরক্ষিতভাবে এনক্রিপ্ট করে ডাটাবেসে সংরক্ষিত হয়
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-xs"
            >
              {t('saveProfile')}
            </button>
          </div>
        </form>
      </div>

      {/* Mandatory Service Address Section */}
      <LocationPicker
        initialAddress={currentUser.mandatoryAddress}
        onSaveAddress={(addr) => updateServiceAddress(addr)}
        userType={
          currentUser?.primaryRole === 'vendor'
            ? 'vendor'
            : currentUser?.primaryRole === 'operations_partner'
            ? 'operations_partner'
            : currentUser?.primaryRole === 'delivery_rider'
            ? 'delivery_rider'
            : 'customer'
        }
      />

      {/* KYC Modal */}
      {showKycModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-neutral-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>{t('submitKyc')}</span>
            </h3>

            <form onSubmit={handleKycSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('nationalId')} (NID) নম্বর
                </label>
                <input
                  type="text"
                  value={nidNumberInput}
                  onChange={(e) => setNidNumberInput(e.target.value)}
                  placeholder="১৯৯১১৯০১২৩৪৫৬৭৮৯১"
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {t('dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  required
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg p-2.5 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 text-center space-y-1">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 block">
                    {t('nidFrontImage')}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    ফাইল পছন্দ করুন (Max 5MB)
                  </span>
                  <input type="file" accept="image/*" className="hidden" id="nid-front" />
                  <label
                    htmlFor="nid-front"
                    className="inline-block mt-2 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded cursor-pointer text-[11px]"
                  >
                    ছবি আপলোড
                  </label>
                </div>

                <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-4 text-center space-y-1">
                  <span className="font-medium text-neutral-700 dark:text-neutral-300 block">
                    {t('nidBackImage')}
                  </span>
                  <span className="text-[10px] text-neutral-400 block">
                    ফাইল পছন্দ করুন (Max 5MB)
                  </span>
                  <input type="file" accept="image/*" className="hidden" id="nid-back" />
                  <label
                    htmlFor="nid-back"
                    className="inline-block mt-2 px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded cursor-pointer text-[11px]"
                  >
                    ছবি আপলোড
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold rounded-lg"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow"
                >
                  জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Mobile OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                  নতুন নম্বর: <strong className="font-mono text-emerald-600">{pendingMobile}</strong>
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
                  onClick={() => setShowOtpModal(false)}
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
  );
};
