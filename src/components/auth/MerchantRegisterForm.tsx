/**
 * Apon Bazar - Redesigned Seller / Dealer / Merchant Registration Form
 * 
 * Features:
 * - Mobile-first Android responsive layout & desktop 2-column optimization
 * - Real-time validation (BD mobile, email format, password strength & match)
 * - Strict Dependent Location Hierarchy (Division -> District -> Upazila -> Union)
 * - Live GPS "Use My Location" integration with coordinates preview
 * - Double-click prevention & Loading state ("Creating your merchant account...")
 * - Professional Success Screen with Generated Merchant ID & 1-click Copy
 * - Clean soft digital gradient aesthetic with Apon Bazar branding
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList
} from '../../lib/bd-locations';
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  Layers,
  FileText,
  Navigation,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export interface MerchantRegistrationSummary {
  dealerId: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email?: string;
  category: string;
  addressText: string;
  coordinates?: { lat: number; lng: number };
}

interface MerchantRegisterFormProps {
  onSuccess?: (summary: MerchantRegistrationSummary) => void;
  onBack?: () => void;
  onSwitchToLogin?: () => void;
  isModal?: boolean;
}

const BUSINESS_CATEGORIES = [
  { id: 'grocery', bn: 'মুদি ও খাদ্য সামগ্রী (Grocery & Foods)', en: 'Grocery & Foods' },
  { id: 'agro', bn: 'কৃষি পণ্য ও ফলমূল (Agro & Fruits)', en: 'Agro & Fruits' },
  { id: 'honey_oil', bn: 'খাঁটি মধু, ঘি ও তেল (Honey, Ghee & Oils)', en: 'Honey, Ghee & Oils' },
  { id: 'handicrafts', bn: 'হস্তশিল্প ও কুটির শিল্প (Handicrafts & Cottage Industry)', en: 'Handicrafts & Cottage Industry' },
  { id: 'electronics', bn: 'ইলেকট্রনিক্স ও গ্যাজেট (Electronics & Gadgets)', en: 'Electronics & Gadgets' },
  { id: 'general', bn: 'জেনারেল মার্চেন্ট ও ডিলার (General Merchant & Dealer)', en: 'General Merchant & Dealer' }
];

export const MerchantRegisterForm: React.FC<MerchantRegisterFormProps> = ({
  onSuccess,
  onBack,
  onSwitchToLogin,
  isModal = false
}) => {
  const { registerUser, setActiveRole, systemSettings, allUsers } = useAuth();

  const sellerContactEmail = useMemo(() => {
    return (
      systemSettings?.sellerContactEmail ||
      systemSettings?.dealerContactEmail ||
      'dealer@aponbazar.com'
    );
  }, [systemSettings]);
  const { addNotification } = useNotifications();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Form Fields
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [category, setCategory] = useState(BUSINESS_CATEGORIES[0].bn);
  const [tradeLicense, setTradeLicense] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Show / Hide Password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address - Dependent System
  const [division, setDivision] = useState('ঢাকা');
  const [district, setDistrict] = useState('ঢাকা');
  const [upazila, setUpazila] = useState('ধানমন্ডি');
  const [union, setUnion] = useState('ধানমন্ডি আ/এ');
  const [shopLocation, setShopLocation] = useState('');

  // GPS Location
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [registeredSummary, setRegisteredSummary] = useState<MerchantRegistrationSummary | null>(null);
  const [copiedField, setCopiedField] = useState<string>('');

  // Location Hierarchy Lists
  const districtList = useMemo(() => getDistrictsList(division), [division]);
  const upazilaList = useMemo(() => getUpazilasList(division, district), [division, district]);
  const unionList = useMemo(() => getUnionsList(division, district, upazila), [division, district, upazila]);

  // Handle Division Change
  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const dList = getDistrictsList(newDiv);
    const firstDist = dList[0]?.nameBn || '';
    setDistrict(firstDist);

    const uList = getUpazilasList(newDiv, firstDist);
    const firstUpa = uList[0]?.nameBn || '';
    setUpazila(firstUpa);

    const unList = getUnionsList(newDiv, firstDist, firstUpa);
    setUnion(unList[0]?.nameBn || '');
  };

  // Handle District Change
  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const uList = getUpazilasList(division, newDist);
    const firstUpa = uList[0]?.nameBn || '';
    setUpazila(firstUpa);

    const unList = getUnionsList(division, newDist, firstUpa);
    setUnion(unList[0]?.nameBn || '');
  };

  // Handle Upazila Change
  const handleUpazilaChange = (newUpa: string) => {
    setUpazila(newUpa);
    const unList = getUnionsList(division, district, newUpa);
    setUnion(unList[0]?.nameBn || '');
  };

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, textBn: '', textEn: '', color: 'bg-neutral-200', barWidth: 'w-0' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) {
      return { level: 1, textBn: 'দুর্বল পাসওয়ার্ড', textEn: 'Weak Password', color: 'bg-rose-500', barWidth: 'w-1/4' };
    } else if (score === 2 || score === 3) {
      return { level: 2, textBn: 'মোটামুটি শক্তিশালী', textEn: 'Moderate Password', color: 'bg-amber-500', barWidth: 'w-2/3' };
    } else {
      return { level: 3, textBn: 'খুব শক্তিশালী পাসওয়ার্ড', textEn: 'Strong Password', color: 'bg-emerald-500', barWidth: 'w-full' };
    }
  }, [password]);

  // GPS Location Trigger
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus(isBn ? 'আপনার ডিভাইসে ব্রাউজার লোকেশন সাপোর্ট করে না।' : 'Geolocation not supported.');
      return;
    }
    setIsGettingGps(true);
    setGpsStatus(isBn ? 'স্যাটেলাইট জিপিএস লোকেশন সনাক্ত করা হচ্ছে...' : 'Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setGpsLocation(coords);
        setIsGettingGps(false);
        setGpsStatus(
          isBn
            ? `দোকানের জিপিএস লোকেশন সফলভাবে যুক্ত হয়েছে (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
            : `GPS Location detected (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        );
      },
      (error) => {
        setIsGettingGps(false);
        setGpsStatus(
          isBn
            ? 'লোকেশন পারমিশন পাওয়া যায়নি। ম্যানুয়াল ঠিকানা ব্যবহার করুন।'
            : 'Location permission denied. Please use manual address.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Form Field Validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!shopName.trim()) {
      errors.shopName = isBn ? 'দয়া করে ব্যবসার নাম লিখুন।' : 'Please enter shop/business name.';
    }

    if (!ownerName.trim()) {
      errors.ownerName = isBn ? 'দয়া করে স্বত্বাধিকারীর নাম লিখুন।' : 'Please enter owner name.';
    }

    const trimmedMobile = mobile.trim();
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!trimmedMobile) {
      errors.mobile = isBn ? 'দয়া করে মোবাইল নম্বর লিখুন।' : 'Please enter mobile number.';
    } else if (!bdPhoneRegex.test(trimmedMobile)) {
      errors.mobile = isBn
        ? 'সঠিক মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।'
        : 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 017XXXXXXXX).';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = isBn ? 'দয়া করে আপনার ইমেইল এড্রেস লিখুন।' : 'Please enter your email address.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = isBn
          ? 'অনুগ্রহ করে সঠিক ফরম্যাটের ইমেইল এড্রেস লিখুন (যেমন: name@example.com)।'
          : 'Please enter a valid email address (e.g. name@example.com).';
      } else {
        const normalizedEmail = trimmedEmail.toLowerCase();
        const existingDealer = allUsers?.find(
          (u) =>
            (u.email || '').toLowerCase() === normalizedEmail &&
            (u.primaryRole === 'dealer' || (u.roles && u.roles.includes('dealer')))
        );
        if (existingDealer) {
          errors.email = isBn
            ? `ইমেইল এড্রেস '${trimmedEmail}' দিয়ে ইতোমধ্যে একজন ডিলার নিবন্ধিত রয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন বা লগইন করুন।`
            : `A dealer with email '${trimmedEmail}' is already registered. Please use another email or log in.`;
        }
      }
    }

    if (!password) {
      errors.password = isBn ? 'পাসওয়ার্ড প্রদান করুন।' : 'Please enter a password.';
    } else if (password.length < 4) {
      errors.password = isBn ? 'পাসওয়ার্ড সর্বনিম্ন ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = isBn ? 'রি-পাসওয়ার্ড প্রদান করুন।' : 'Please confirm password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = isBn ? 'Password দুটির মধ্যে মিল নেই।' : 'Passwords do not match.';
    }

    if (!division || !district || !upazila) {
      errors.location = isBn ? 'অনুগ্রহ করে বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।' : 'Please select Division, District and Upazila.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setGlobalError('');
    if (!validateForm()) {
      const firstError = Object.values(fieldErrors)[0];
      if (firstError) setGlobalError(firstError);
      return;
    }

    setLoading(true);

    try {
      const trimmedOwner = ownerName.trim();
      const trimmedShop = shopName.trim();
      const trimmedMobile = mobile.trim();
      const trimmedEmail = email.trim() || undefined;
      const trimmedTradeLicense = tradeLicense.trim() || undefined;
      const trimmedLocation = shopLocation.trim();

      const fullShopAddress = `${trimmedLocation ? trimmedLocation + ', ' : ''}ইউনিয়ন/পৌরসভা: ${union || 'সদর'}, উপজেলা: ${upazila}, জেলা: ${district}, বিভাগ: ${division}`;

      // Register Seller / Dealer in AuthContext
      const newSeller = registerUser({
        fullName: trimmedOwner,
        mobileNumber: trimmedMobile,
        email: trimmedEmail,
        password: password.trim(),
        role: 'dealer',
        shopName: trimmedShop,
        businessType: category,
        tradeLicenseNumber: trimmedTradeLicense,
        division: division,
        district: district,
        upazila: upazila,
        unionName: union,
        area: fullShopAddress,
        fullServiceAddress: fullShopAddress,
        latitude: gpsLocation?.lat || 23.8103,
        longitude: gpsLocation?.lng || 90.4125
      });

      if (!newSeller || !newSeller.id) {
        throw new Error(isBn ? 'সেলার অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি।' : 'Failed to create merchant account.');
      }

      // Auto-activate Dealer role
      if (setActiveRole) {
        setActiveRole('dealer');
      }

      const dealerId = newSeller.permanentMemberId || newSeller.id;

      // Welcome Notification
      if (addNotification) {
        addNotification({
          userId: newSeller.id,
          title: isBn ? 'সেলার মার্চেন্ট অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!' : 'Merchant Account Created!',
          message: isBn
            ? `স্বাগতম ${trimmedShop}! আপনার স্থায়ী মার্চেন্ট ডিলার আইডি: ${dealerId}। এখন ০% ফিতে পণ্য বিক্রি শুরু করুন।`
            : `Welcome ${trimmedShop}! Your Merchant ID is ${dealerId}.`,
          channel: 'in_app'
        });
      }

      const summaryData: MerchantRegistrationSummary = {
        dealerId,
        shopName: trimmedShop,
        ownerName: trimmedOwner,
        mobile: trimmedMobile,
        email: trimmedEmail,
        category,
        addressText: fullShopAddress,
        coordinates: gpsLocation || undefined
      };

      setRegisteredSummary(summaryData);
      if (onSuccess) {
        onSuccess(summaryData);
      }
    } catch (err: any) {
      console.error('Merchant registration error:', err);
      setGlobalError(err?.message || (isBn ? 'মার্চেন্ট নিবন্ধন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' : 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  // --------------------------------------------------------------------------
  // SUCCESS SCREEN
  // --------------------------------------------------------------------------
  if (registeredSummary) {
    return (
      <div id="merchant-registration-success-card" className="w-full max-w-xl mx-auto py-4 px-2 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Store className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isBn ? 'রেজিস্ট্রেশন সফল' : 'Registration Successful'}</span>
          </span>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {isBn ? 'আপনার Seller / Merchant Account সফলভাবে তৈরি হয়েছে!' : 'Merchant Account Created Successfully!'}
          </h2>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
            {isBn
              ? 'আপনার মার্চেন্ট ড্যাশবোর্ড সম্পূর্ণ প্রস্তুত। ০% লিস্টিং ফিতে দেশব্যাপী পণ্য বিক্রি ও ডেলিভারি শুরু করুন।'
              : 'Your merchant portal is ready. Start listing your products nationwide with 0% onboarding fee.'}
          </p>
        </div>

        {/* Merchant ID Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-teal-500/5 dark:from-amber-950/40 dark:via-orange-950/20 dark:to-teal-950/20 border-2 border-amber-300/80 dark:border-amber-700/80 shadow-md text-left space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 block">
                {isBn ? 'আপনার স্থায়ী মার্চেন্ট / ডিলার আইডি:' : 'Permanent Merchant ID:'}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {isBn ? 'লগইন ও কাস্টমার সাপোর্টে এই আইডি ব্যবহার করবেন' : 'Use this ID for login and support'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(registeredSummary.dealerId, 'merchantId')}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 shadow-2xs hover:bg-amber-50 dark:hover:bg-neutral-700 cursor-pointer transition-all active:scale-95"
            >
              {copiedField === 'merchantId' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBn ? 'কপি করুন' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-amber-700 dark:text-amber-300 bg-white dark:bg-neutral-900 px-4 py-3 rounded-2xl border border-amber-300 dark:border-amber-800/80 text-center shadow-inner select-all">
            {registeredSummary.dealerId}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-amber-200/60 dark:border-amber-800/60">
            <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'দোকানের নাম:' : 'Shop Name:'}</span>
              <span className="font-bold text-neutral-900 dark:text-white">{registeredSummary.shopName}</span>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'স্বত্বাধিকারী:' : 'Owner Name:'}</span>
              <span className="font-bold text-neutral-900 dark:text-white">{registeredSummary.ownerName}</span>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'মোবাইল নম্বর:' : 'Mobile:'}</span>
              <span className="font-bold text-neutral-900 dark:text-white font-mono">{registeredSummary.mobile}</span>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'ইমেইল এড্রেস:' : 'Email Address:'}</span>
              <span className="font-bold text-neutral-900 dark:text-white truncate block" title={registeredSummary.email}>{registeredSummary.email}</span>
            </div>
            <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50 sm:col-span-2">
              <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
              <span className="font-bold text-neutral-900 dark:text-white">{registeredSummary.category}</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-neutral-900/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/50 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'ঠিকানা:' : 'Address:'}</span>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">{registeredSummary.addressText}</span>
          </div>
        </div>

        {/* Security / Login Notice */}
        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            {isBn
              ? 'পরবর্তীতে লগইন করতে আপনার এই মার্চেন্ট আইডি অথবা নিবন্ধিত মোবাইল নম্বর এবং আপনার দেওয়া পাসওয়ার্ড ব্যবহার করুন।'
              : 'You can sign in later using this Merchant ID or your Mobile Number with your password.'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            id="btn-go-merchant-dashboard"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/dealer/dashboard');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Store className="w-4 h-4" />
            <span>{isBn ? 'মার্চেন্ট ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Merchant Dashboard'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            type="button"
            id="btn-switch-to-merchant-login"
            onClick={() => {
              if (onSwitchToLogin) {
                onSwitchToLogin();
              } else if (typeof window !== 'undefined') {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new Event('popstate'));
              }
            }}
            className="w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>{isBn ? 'Login করুন' : 'Sign In'}</span>
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN REGISTRATION FORM
  // --------------------------------------------------------------------------
  return (
    <div className={`w-full ${isModal ? '' : 'max-w-4xl mx-auto'}`}>
      
      {/* Back button if present */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white mb-3 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isBn ? 'পেছনে ফিরে যান' : 'Back'}</span>
        </button>
      )}

      {/* Page Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-700 p-5 sm:p-6 text-white shadow-lg mb-6">
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shrink-0 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {isBn ? 'মার্চেন্ট / ডিলার পোর্টাল' : 'Merchant & Dealer Program'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {isBn ? 'Seller / Dealer / Merchant Registration' : 'Seller / Dealer / Merchant Registration'}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-0.5">
                {isBn
                  ? 'আপনার দোকান বা ব্যবসার তথ্য দিয়ে Apon Bazar-তে Merchant Account খুলুন।'
                  : 'Register your business on Apon Bazar with 0% onboarding fee.'}
              </p>
              
              {/* Email Us CTA Button */}
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <a
                  id="merchant-form-email-us-btn"
                  href={`mailto:${sellerContactEmail}?subject=${encodeURIComponent(
                    isBn ? 'সেলার / ডিলার রেজিস্ট্রেশন সংক্রান্ত জিজ্ঞাসা - Apon Bazar' : 'Seller / Dealer Registration Inquiry - Apon Bazar'
                  )}&body=${encodeURIComponent(
                    isBn
                      ? `সম্মানিত Apon Bazar টিম,\n\nআমি Apon Bazar-তে সেলার / ডিলার হিসেবে যুক্ত হতে আগ্রহী।\n\nদোকান / প্রতিষ্ঠানের নাম:\nস্বত্বাধিকারীর নাম:\nমোবাইল নম্বর:\nঠিকানা:\nপণ্য বিবরণ:\n\nধন্যবাদ।`
                      : `Dear Apon Bazar Team,\n\nI am interested in registering as a Seller / Dealer on Apon Bazar.\n\nShop/Business Name:\nOwner Name:\nMobile Number:\nLocation:\nProduct Category:\n\nThank you.`
                  )}`}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#198754] hover:bg-amber-50 active:scale-[0.98] text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-white"
                  title={`Email: ${sellerContactEmail}`}
                >
                  <Mail className="w-4 h-4 text-[#198754] shrink-0" />
                  <span>{isBn ? '📧 Email Us (আমাদের ইমেইল করুন)' : '📧 Email Us'}</span>
                </a>
                <span className="text-[11px] text-white/90 font-mono font-medium">
                  ({sellerContactEmail})
                </span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-bold bg-black/20 px-3 py-1 rounded-xl text-amber-100 border border-white/15">
              {isBn ? '০% লিস্টিং ফি' : '0% Listing Fee'}
            </span>
            <span className="text-[11px] text-white/80 mt-1">
              {isBn ? '২৪-৪৮ ঘণ্টায় সেটেলমেন্ট' : 'Fast 24h Payouts'}
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {globalError && (
        <div className="p-4 mb-5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 font-semibold animate-in shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-black block">{isBn ? 'ত্রুটি পরিলক্ষিত হয়েছে:' : 'Error:'}</span>
            <span>{globalError}</span>
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECTION 1 — ACCOUNT INFORMATION */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <Mail className="w-4 h-4 text-amber-600" />
            <span>{isBn ? 'একাউন্ট তথ্য (Account Information)' : 'Account Information'}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                id="merchant-email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                placeholder={isBn ? 'আপনার ইমেইল ঠিকানা প্রদান করুন' : 'yourname@domain.com'}
                className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border ${
                  fieldErrors.email
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                    : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                } focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              {isBn ? 'জরুরি অর্ডার নোটিফিকেশন ও মাসিক ইনভয়েসের জন্য ব্যবহৃত হবে।' : 'Used for order updates and monthly settlement invoices.'}
            </p>
          </div>
        </div>

        {/* SECTION 2 — BUSINESS & OWNER INFORMATION */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <Briefcase className="w-4 h-4 text-amber-600" />
            <span>{isBn ? '১. ব্যবসা ও স্বত্বাধিকারীর তথ্য (Business & Owner Information)' : '1. Business & Owner Information'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Shop / Business Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'দোকান / ব্যবসার নাম' : 'Shop / Business Name'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  id="merchant-shopname-input"
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (fieldErrors.shopName) {
                      setFieldErrors((prev) => ({ ...prev, shopName: '' }));
                    }
                  }}
                  placeholder={isBn ? 'দোকান বা ব্যবসা প্রতিষ্ঠানের নাম লিখুন' : 'e.g. Green Agro Traders'}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border ${
                    fieldErrors.shopName
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900'
                  } text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all`}
                />
              </div>
              {fieldErrors.shopName && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.shopName}</span>
                </p>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'স্বত্বাধিকারীর নাম' : 'Owner Name'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  id="merchant-ownername-input"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    if (fieldErrors.ownerName) {
                      setFieldErrors((prev) => ({ ...prev, ownerName: '' }));
                    }
                  }}
                  placeholder={isBn ? 'স্বত্বাধিকারী বা প্রতিনিধির নাম' : 'e.g. Rafiqul Islam'}
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border ${
                    fieldErrors.ownerName
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900'
                  } text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all`}
                />
              </div>
              {fieldErrors.ownerName && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.ownerName}</span>
                </p>
              )}
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  id="merchant-mobile-input"
                  type="tel"
                  required
                  maxLength={11}
                  value={mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobile(val);
                    if (fieldErrors.mobile) {
                      setFieldErrors((prev) => ({ ...prev, mobile: '' }));
                    }
                  }}
                  placeholder="017XXXXXXXX"
                  className={`w-full pl-10 pr-4 py-3 text-xs sm:text-sm font-mono rounded-2xl border ${
                    fieldErrors.mobile
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900'
                  } text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all`}
                />
              </div>
              {fieldErrors.mobile && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.mobile}</span>
                </p>
              )}
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 block">
                {isBn ? '১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর (013-019)' : '11-digit Bangladeshi mobile number'}
              </span>
            </div>

            {/* Business Category */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'পণ্যের ক্যাটাগরি' : 'Business Category'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  id="merchant-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all cursor-pointer"
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.bn}>
                      {isBn ? cat.bn : cat.en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Trade License / NID (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                {isBn ? 'ট্রেড লাইসেন্স / এনআইডি নম্বর' : 'Trade License / NID'}
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                {isBn ? 'ঐচ্ছিক' : 'Optional'}
              </span>
            </div>
            <div className="relative">
              <FileText className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                id="merchant-trade-license-input"
                type="text"
                value={tradeLicense}
                onChange={(e) => setTradeLicense(e.target.value)}
                placeholder={isBn ? 'ট্রেড লাইসেন্স বা জাতীয় পরিচয়পত্র নম্বর (যদি থাকে)' : 'Trade License or National ID (Optional)'}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Password & Re-Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            
            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'পাসওয়ার্ড' : 'Password'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  id="merchant-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-2xl border ${
                    fieldErrors.password
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900'
                  } text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5 cursor-pointer transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div className={`h-full ${passwordStrength.color} ${passwordStrength.barWidth} transition-all duration-300`} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                    <span>{isBn ? passwordStrength.textBn : passwordStrength.textEn}</span>
                    <span>{password.length >= 8 ? '✓ ৮+ অক্ষর' : 'কমপক্ষে ৪-৮ অক্ষর'}</span>
                  </div>
                </div>
              )}

              {fieldErrors.password && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Re-Password */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'রি-পাসওয়ার্ড' : 'Re-Password'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                <input
                  id="merchant-confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-2xl border ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/30'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900'
                  } text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-0.5 cursor-pointer transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live match indicator */}
              {confirmPassword && password && (
                <div className="mt-1 text-[10px] font-bold">
                  {password === confirmPassword ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isBn ? 'পাসওয়ার্ড মিলেছে' : 'Passwords match'}</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{isBn ? 'Password দুটির মধ্যে মিল নেই।' : 'Passwords do not match.'}</span>
                    </span>
                  )}
                </div>
              )}

              {fieldErrors.confirmPassword && (
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 3 — SHOP / BUSINESS ADDRESS (DEPENDENT SYSTEM) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>{isBn ? '২. দোকান বা ব্যবসার ঠিকানা (Shop / Business Address)' : '2. Shop / Business Address'}</span>
            </div>
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
              {isBn ? 'ডিপেনডেন্ট লোকেশন' : 'Dependent Location'}
            </span>
          </div>

          {/* Division, District, Upazila (3-col responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Division */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'বিভাগ (Division)' : 'Division'} <span className="text-rose-500">*</span>
              </label>
              <select
                id="merchant-division-select"
                value={division}
                onChange={(e) => handleDivisionChange(e.target.value)}
                className="w-full py-3 px-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all cursor-pointer"
              >
                {BD_DIVISIONS.map((div) => (
                  <option key={div.nameEn} value={div.nameBn}>
                    {isBn ? div.nameBn : div.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* District (Dependent) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'জেলা (District)' : 'District'} <span className="text-rose-500">*</span>
              </label>
              <select
                id="merchant-district-select"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full py-3 px-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all cursor-pointer"
              >
                {districtList.map((d) => (
                  <option key={d.nameEn} value={d.nameBn}>
                    {isBn ? d.nameBn : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Upazila / Thana (Dependent) */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
                {isBn ? 'উপজেলা / থানা' : 'Upazila / Thana'} <span className="text-rose-500">*</span>
              </label>
              <select
                id="merchant-upazila-select"
                value={upazila}
                onChange={(e) => handleUpazilaChange(e.target.value)}
                className="w-full py-3 px-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all cursor-pointer"
              >
                {upazilaList.map((u) => (
                  <option key={u.nameEn} value={u.nameBn}>
                    {isBn ? u.nameBn : u.nameEn}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Union / Municipality (Dependent) */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {isBn ? 'ইউনিয়ন / ওয়ার্ড / পৌরসভা' : 'Union / Ward / Municipality'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                id="merchant-union-select"
                value={union}
                onChange={(e) => setUnion(e.target.value)}
                className="w-full pl-10 pr-8 py-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all cursor-pointer"
              >
                {unionList.map((un) => (
                  <option key={un.nameEn} value={un.nameBn}>
                    {isBn ? un.nameBn : un.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shop No / Market / Road */}
          <div>
            <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1.5">
              {isBn ? 'দোকান নং / মার্কেট / সড়ক' : 'Shop No / Market / Road'}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
              <input
                id="merchant-shop-location-input"
                type="text"
                value={shopLocation}
                onChange={(e) => setShopLocation(e.target.value)}
                placeholder={isBn ? 'দোকান নং, মার্কেটের নাম বা সড়কের নাম লিখুন' : 'Shop #12, Central Market, Main Road'}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
              />
            </div>
          </div>

          {/* GPS Location & Live Map Integration */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBn ? '📍 দোকানের Location (ঐচ্ছিক)' : 'Shop GPS Location (Optional)'}</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {gpsStatus || (isBn ? 'কাছের কাস্টমারদের কাছে দ্রুত ডেলিভারি পেতে লোকেশন সেট করুন।' : 'Set exact GPS coordinate for instant local deliveries.')}
              </p>
            </div>

            <button
              type="button"
              id="merchant-use-my-location-btn"
              onClick={handleGetLocation}
              disabled={isGettingGps}
              className="py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              {isGettingGps ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isBn ? 'সনাক্ত করা হচ্ছে...' : 'Detecting...'}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isBn ? 'Use My Location' : 'Use My Location'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-submit-merchant-registration"
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm sm:text-base shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isBn ? 'Creating your merchant account...' : 'Creating your merchant account...'}</span>
              </>
            ) : (
              <>
                <Store className="w-5 h-5" />
                <span>{isBn ? 'Seller / Merchant Registration সম্পন্ন করুন' : 'Complete Merchant Registration'}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};
