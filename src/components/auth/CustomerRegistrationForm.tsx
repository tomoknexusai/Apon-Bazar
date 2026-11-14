/**
 * Single Shared Customer Registration & Authentication Component
 * Used across all three registration entry points:
 * 1. Checkout registration (Apon Bazar Customer-Only Registration & Login)
 * 2. Customer Dashboard registration
 * 3. Binary Network Tree registration (Left/Right Slot Locked)
 * 
 * Strict Role Constraint: Customer Only (No Admin, Super Admin, Dealer, Vendor, Staff)
 * Project: Apon Bazar / আপন বাজার
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  RegistrationSource,
  CustomerRegistrationService
} from '../../services/CustomerRegistrationService';
import {
  SlotReservationService,
  AIPlacementRecommendation
} from '../../services/SlotReservationService';
import { COMPANY_MASTER_ROOT_ID } from '../../types/networkMarketing';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList,
  getUnionPostalCode
} from '../../lib/bd-locations';
import { BrandLogo } from '../common/BrandLogo';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  X,
  UserPlus,
  LogIn,
  ShoppingBag,
  Building,
  Home,
  Check,
  ArrowRight
} from 'lucide-react';

export interface CustomerRegistrationFormProps {
  source?: RegistrationSource; // 'checkout' | 'dashboard' | 'binary_tree' | 'ai_placement'
  title?: string;
  subtitle?: string;
  pendingProductName?: string;
  pendingQuantity?: number;
  initialReferralId?: string;
  initialPlacementId?: string;
  initialPlacementPosition?: 'left' | 'right';
  reservedCompanyId?: string;
  lockPlacement?: boolean;
  aiRecommendation?: AIPlacementRecommendation;
  onSuccess?: (summary: {
    customerId: string;
    binaryCompanyId?: string;
    newLeftBlankId?: string;
    newRightBlankId?: string;
    username: string;
    fullName: string;
    mobile: string;
    sponsorId: string;
    placementId: string;
    placementLeg: 'left' | 'right';
    registrationSource: RegistrationSource;
    fullServiceAddress: string;
  }) => void;
  onClose?: () => void;
  onSwitchToLogin?: (prefilledIdentifier?: string) => void;
  isModal?: boolean;
  defaultTab?: 'signup' | 'login';
  showTabs?: boolean;
}

export const CustomerRegistrationForm: React.FC<CustomerRegistrationFormProps> = ({
  source = 'checkout',
  title,
  subtitle,
  pendingProductName,
  pendingQuantity,
  initialReferralId,
  initialPlacementId,
  initialPlacementPosition,
  reservedCompanyId,
  lockPlacement = false,
  aiRecommendation,
  onSuccess,
  onClose,
  onSwitchToLogin,
  isModal = false,
  defaultTab = 'signup',
  showTabs = true
}) => {
  const {
    registerUser,
    linkBinaryCompanyId,
    loginWithEmailPassword,
    rollbackUserRegistration,
    setActiveRole,
    allUsers,
    isLoggedIn
  } = useAuth();
  const {
    members,
    allTreeNodes,
    currentMember,
    calculatePlacementRule,
    getBlankSlotForParent,
    registerBlankSlotAtomic,
    refreshBinaryTreeFromServer,
    reserveSlotDuringRegistration,
    releaseReservedSlot,
    reservedPlacements
  } = useNetworkMarketing();
  const { addNotification } = useNotifications();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Tabs: 'signup' (নতুন কাস্টমার সাইন আপ) or 'login' (লগইন)
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>(defaultTab);

  // Titles
  const pageTitle = title || 'কাস্টমার রেজিস্ট্রেশন (Customer Only)';
  const pageSubtitle = subtitle || 'অর্ডার সম্পন্ন করতে কাস্টমার একাউন্টে প্রবেশ করুন';

  // Signup Form Field States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [passwordMode, setPasswordMode] = useState<'normal' | 'strong'>('normal');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address Cascading States
  const [division, setDivision] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [upazila, setUpazila] = useState<string>('');
  const [unionName, setUnionName] = useState<string>('');
  const [ward, setWard] = useState<string>('');
  const [detailedAddress, setDetailedAddress] = useState<string>('');

  // Referral & Placement States
  const [referralId, setReferralId] = useState(initialReferralId || '');
  const [placementId, setPlacementId] = useState(initialPlacementId || '');
  const [placementPosition, setPlacementPosition] = useState<'left' | 'right'>(
    initialPlacementPosition || 'right'
  );

  // Login Form States
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Execution & Feedback States
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const isPrivilegedSessionRegistration = source === 'binary_tree' && isLoggedIn;

  const [registrationSuccessSummary, setRegistrationSuccessSummary] = useState<{
    customerId: string;
    binaryCompanyId?: string;
    newLeftBlankId?: string;
    newRightBlankId?: string;
    username: string;
    fullName: string;
    mobile: string;
    sponsorId: string;
    placementId: string;
    placementLeg: 'left' | 'right';
    registrationSource: RegistrationSource;
    fullServiceAddress: string;
  } | null>(null);

  // Forgot password modal state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordInput, setForgotPasswordInput] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Preview Customer ID (non-mutating AponCN-XXXXXX preview, distinct from phone number)
  const previewCustomerId = useMemo(() => {
    return CustomerRegistrationService.previewUniqueCustomerId(allUsers);
  }, [allUsers]);

  // Resolve pre-reserved Binary Company ID for the targeted Blank Position
  const resolvedBlankSlot = useMemo(() => {
    const targetParent = (placementId || initialPlacementId || '').trim();
    const targetLeg = placementPosition || initialPlacementPosition || 'right';
    if (!targetParent) return undefined;
    return getBlankSlotForParent(targetParent, targetLeg);
  }, [placementId, initialPlacementId, placementPosition, initialPlacementPosition, getBlankSlotForParent]);

  const effectiveReservedCompanyId =
    reservedCompanyId || resolvedBlankSlot?.id || aiRecommendation?.reservedCompanyId;

  // Synchronize initial referral / placement props
  useEffect(() => {
    if (initialReferralId) {
      setReferralId(initialReferralId.trim());
    } else if (source === 'binary_tree') {
      const loggedInCustomerId = currentMember?.customerId || currentMember?.id || COMPANY_MASTER_ROOT_ID;
      setReferralId(loggedInCustomerId);
    } else if (source === 'ai_placement' && aiRecommendation) {
      setReferralId(aiRecommendation.sponsorId);
    } else if (source === 'checkout' && !referralId) {
      setReferralId(COMPANY_MASTER_ROOT_ID);
    }

    if (initialPlacementId) {
      setPlacementId(initialPlacementId.trim());
    } else if (source === 'ai_placement' && aiRecommendation) {
      setPlacementId(aiRecommendation.placementId);
    }

    if (initialPlacementPosition) {
      setPlacementPosition(initialPlacementPosition);
    } else if (source === 'ai_placement' && aiRecommendation) {
      setPlacementPosition(aiRecommendation.position);
    }
  }, [initialReferralId, initialPlacementId, initialPlacementPosition, source, aiRecommendation, currentMember]);

  // Slot Reservation Lifecycle for binary tree
  useEffect(() => {
    const targetParent = (placementId || initialPlacementId)?.trim();
    const targetLeg = placementPosition || initialPlacementPosition;

    if (targetParent && targetLeg && (source === 'binary_tree' || source === 'ai_placement')) {
      const resId = reserveSlotDuringRegistration(
        targetParent,
        targetLeg,
        `Pending Registration (${source})`
      );
      setActiveReservationId(resId);
    }

    return () => {
      if (targetParent && targetLeg) {
        releaseReservedSlot(targetParent, targetLeg);
      }
    };
  }, []);

  // Safe manual close handler
  const handleCancelAndClose = () => {
    if (activeReservationId && placementId && placementPosition) {
      releaseReservedSlot(placementId, placementPosition);
      setActiveReservationId(null);
    }
    if (onClose) onClose();
  };

  // Real-time username verification
  const usernameValidation = useMemo(() => {
    if (!username.trim()) {
      return { isValid: false, message: 'ইউজার আইডি আবশ্যক' };
    }
    return CustomerRegistrationService.validateUserId(username, allUsers);
  }, [username, allUsers]);

  // Real-time Refer ID verification
  const referValidation = useMemo(() => {
    return CustomerRegistrationService.validateReferId(
      referralId,
      members,
      source === 'dashboard' || source === 'checkout'
    );
  }, [referralId, members, source]);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, textBn: '', color: 'bg-neutral-200' };
    if (passwordMode === 'normal') {
      if (password.length < 4) return { level: 1, textBn: 'দুর্বল (কমপক্ষে ৪ অক্ষর)', color: 'bg-rose-500' };
      if (password.length <= 6) return { level: 2, textBn: 'স্বাভাবিক', color: 'bg-amber-500' };
      return { level: 3, textBn: 'ভালো', color: 'bg-emerald-500' };
    } else {
      let score = 0;
      if (password.length >= 6) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[a-z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      if (score < 3) return { level: 1, textBn: 'দুর্বল', color: 'bg-rose-500' };
      if (score < 5) return { level: 2, textBn: 'মাঝারি', color: 'bg-amber-500' };
      return { level: 3, textBn: 'শক্তিশালী', color: 'bg-emerald-500' };
    }
  }, [password, passwordMode]);

  // Address Cascading Lists
  const availableDistricts = useMemo(() => {
    if (!division || division === 'বিভাগ নির্বাচন করুন') return [];
    return getDistrictsList(division);
  }, [division]);

  const availableUpazilas = useMemo(() => {
    if (!division || !district || district === 'জেলা নির্বাচন করুন') return [];
    return getUpazilasList(division, district);
  }, [division, district]);

  const availableUnions = useMemo(() => {
    if (!division || !district || !upazila || upazila === 'উপজেলা / থানা নির্বাচন করুন') return [];
    return getUnionsList(division, district, upazila);
  }, [division, district, upazila]);

  // Address Cascading Handlers
  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    setDistrict('');
    setUpazila('');
    setUnionName('');
    if (formErrors.division) {
      setFormErrors((prev) => ({ ...prev, division: '' }));
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    setUpazila('');
    setUnionName('');
    if (formErrors.district) {
      setFormErrors((prev) => ({ ...prev, district: '' }));
    }
  };

  const handleUpazilaChange = (newUpa: string) => {
    setUpazila(newUpa);
    setUnionName('');
    if (formErrors.upazila) {
      setFormErrors((prev) => ({ ...prev, upazila: '' }));
    }
  };

  // Submit Handler: Customer Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setGeneralError('');
    setFormErrors({});

    const effectiveReferralId = referralId.trim() || COMPANY_MASTER_ROOT_ID;

    const payload = {
      fullName: fullName.trim(),
      username: username.trim(),
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
      passwordMode,
      referralId: effectiveReferralId,
      placementId: placementId.trim(),
      position: placementPosition,
      reservedCompanyId: effectiveReservedCompanyId,
      division,
      district,
      upazila,
      unionName,
      ward: ward.trim(),
      village: detailedAddress.trim() || ward.trim(),
      housePara: detailedAddress.trim(),
      detailedAddress: detailedAddress.trim(),
      turnstileVerified: true,
      agreeTerms: true,
      registrationSource: source,
      reservationId: activeReservationId || undefined
    };

    // Client validation
    const val = CustomerRegistrationService.validateForm(
      payload,
      allUsers,
      allTreeNodes,
      reservedPlacements
    );

    if (!val.isValid) {
      setFormErrors(val.errors);
      setGeneralError(val.generalError || 'অনুগ্রহ করে লাল চিহ্নিত তথ্যগুলো সঠিকভাবে পূরণ করুন।');
      return;
    }

    setLoading(true);

    try {
      const fullAddressStr = [
        detailedAddress.trim() ? detailedAddress.trim() : '',
        ward.trim() ? `ওয়ার্ড: ${ward.trim()}` : '',
        unionName ? `ইউনিয়ন/পৌরসভা: ${unionName}` : '',
        upazila ? `উপজেলা/থানা: ${upazila}` : '',
        district ? `জেলা: ${district}` : '',
        division ? `বিভাগ: ${division}` : ''
      ].filter(Boolean).join(', ');

      const postalCode = getUnionPostalCode(division, district, upazila, unionName) || '১২০৯';

      // Placement calculation
      const calcResult = calculatePlacementRule(
        payload.referralId,
        payload.placementId,
        payload.position
      );

      if (calcResult.error) {
        throw new Error(calcResult.error);
      }

      const chosenSponsorId = calcResult.sponsorId || COMPANY_MASTER_ROOT_ID;
      const chosenPlacementId = calcResult.placementId || COMPANY_MASTER_ROOT_ID;
      const chosenPlacementLeg = calcResult.placementLeg || 'right';

      const targetBlankSlot =
        effectiveReservedCompanyId ||
        getBlankSlotForParent(chosenPlacementId, chosenPlacementLeg)?.id;

      // 1. Register User in AuthContext (preserve Super Admin / logged-in tree operator session if applicable)
      const newUser = registerUser({
        fullName: payload.fullName,
        username: payload.username,
        mobileNumber: payload.mobile,
        email: payload.email || `${payload.username}@customer.aponbazar.com`,
        password: payload.password,
        role: 'customer',
        division,
        district,
        upazila,
        unionName,
        ward: payload.ward,
        village: payload.detailedAddress,
        para: payload.detailedAddress,
        houseNo: payload.detailedAddress,
        area: `${payload.detailedAddress}, ${payload.unionName || ''}`,
        postalCode,
        fullServiceAddress: fullAddressStr,
        sponsorId: chosenSponsorId,
        referralId: chosenSponsorId,
        placementId: chosenPlacementId,
        placementLeg: chosenPlacementLeg,
        registrationSource: source,
        preserveCurrentSession: isPrivilegedSessionRegistration
      });

      if (!newUser || !newUser.id) {
        throw new Error('কাস্টমার একাউন্ট তৈরিতে সমস্যা হয়েছে।');
      }

      // 2. Atomic Blank Position Conversion + 2 New Blank Child Positions Generation
      const userPermanentId = newUser.customerId || newUser.permanentMemberId || newUser.id;
      const atomicRes = await registerBlankSlotAtomic({
        reservedCompanyId: targetBlankSlot,
        parentId: chosenPlacementId,
        leg: chosenPlacementLeg,
        userId: newUser.id,
        username: payload.username,
        aponUniqueId: userPermanentId,
        fullName: payload.fullName,
        mobile: payload.mobile,
        email: payload.email || newUser.email,
        address: fullAddressStr,
        registrationSource: source,
        sponsorId: chosenSponsorId,
        sponsorName: calcResult.sponsorName,
        packageId: 'pkg-100'
      });

      if (!atomicRes.success || !atomicRes.registeredMember) {
        rollbackUserRegistration(newUser.id);
        refreshBinaryTreeFromServer();
        if (activeReservationId && chosenPlacementId) {
          releaseReservedSlot(chosenPlacementId, chosenPlacementLeg);
          setActiveReservationId(null);
        }
        setGeneralError(
          atomicRes.message ||
            'নির্বাচিত Blank Position-এ নিবন্ধন ব্যর্থ হয়েছে। অনুগ্রহ করে ট্রি রিফ্রেশ করে আবার চেষ্টা করুন।'
        );
        return;
      }

      linkBinaryCompanyId(newUser.id, atomicRes.registeredMember.id);

      // 3. Release slot reservation if active
      if (activeReservationId && chosenPlacementId) {
        releaseReservedSlot(chosenPlacementId, chosenPlacementLeg);
        setActiveReservationId(null);
      }

      // 4. Switch Active Role to customer ONLY for standalone self-signup
      if (setActiveRole && !isPrivilegedSessionRegistration) {
        setActiveRole('customer');
      }

      // 5. In-app Notification
      if (addNotification) {
        addNotification({
          userId: newUser.id,
          title: 'কাস্টমার ও বাইনারি মেম্বার রেজিস্ট্রেশন সফল!',
          message: `স্বাগতম ${payload.fullName}! Company ID: ${atomicRes.registeredMember.id}, Customer ID: ${userPermanentId}, নতুন Blank Slots: ${atomicRes.newLeftBlank?.id} (LEFT) & ${atomicRes.newRightBlank?.id} (RIGHT)।`,
          channel: 'in_app'
        });
      }

      const summary = {
        customerId: userPermanentId,
        binaryCompanyId: atomicRes.registeredMember.id,
        newLeftBlankId: atomicRes.newLeftBlank?.id,
        newRightBlankId: atomicRes.newRightBlank?.id,
        username: payload.username,
        fullName: payload.fullName,
        mobile: payload.mobile,
        sponsorId: chosenSponsorId,
        placementId: chosenPlacementId,
        placementLeg: chosenPlacementLeg,
        registrationSource: source,
        fullServiceAddress: fullAddressStr
      };

      setRegistrationSuccessSummary(summary);
      if (onSuccess) {
        onSuccess(summary);
      }
    } catch (err: any) {
      console.error('Customer registration error:', err);
      setGeneralError(err?.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler: Customer Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginError('');

    if (!loginUserId.trim()) {
      setLoginError('ইউজার আইডি বা মোবাইল নম্বর আবশ্যক');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('পাসওয়ার্ড আবশ্যক');
      return;
    }

    setLoginLoading(true);

    try {
      const success = await loginWithEmailPassword(loginUserId.trim(), loginPassword.trim());
      if (success) {
        if (onSuccess) {
          onSuccess({
            customerId: loginUserId.trim(),
            username: loginUserId.trim(),
            fullName: 'Customer',
            mobile: '',
            sponsorId: COMPANY_MASTER_ROOT_ID,
            placementId: '',
            placementLeg: 'right',
            registrationSource: source,
            fullServiceAddress: ''
          });
        }
        if (onClose) {
          onClose();
        }
      } else {
        setLoginError('ইউজার আইডি বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoginLoading(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (registrationSuccessSummary) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-7 max-w-lg mx-auto border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5 text-neutral-900 dark:text-neutral-100 animate-in fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="text-center space-y-1.5">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-full uppercase tracking-wider">
            মেম্বার ও অটো Blank Position তৈরি সম্পন্ন
          </span>
          <h3 className="font-black text-2xl text-neutral-900 dark:text-white">
            রেজিস্ট্রেশন সফল হয়েছে!
          </h3>
          <p className="text-xs text-neutral-500">
            {isPrivilegedSessionRegistration
              ? 'সদস্যটি বাইনারি ট্রির সংরক্ষিত পজিশনে যুক্ত হয়েছে এবং তার অধীনে স্বয়ংক্রিয়ভাবে ২টি নতুন Blank Position তৈরি হয়েছে।'
              : 'আপনার কাস্টমার একাউন্ট ও বাইনারি নেটওয়ার্ক পজিশন সফলভাবে তৈরি হয়েছে।'}
          </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl p-4 space-y-2.5 border border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">কাস্টমার নাম:</span>
            <span className="font-bold text-neutral-900 dark:text-white">{registrationSuccessSummary.fullName}</span>
          </div>

          {registrationSuccessSummary.binaryCompanyId && (
            <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 font-medium">Binary Company ID:</span>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                {registrationSuccessSummary.binaryCompanyId}
              </span>
            </div>
          )}

          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Customer ID (স্থায়ী):</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {registrationSuccessSummary.customerId}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">User ID (লগইন):</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {registrationSuccessSummary.username}
            </span>
          </div>

          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">মোবাইল নম্বর:</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {registrationSuccessSummary.mobile}
            </span>
          </div>

          {(registrationSuccessSummary.newLeftBlankId || registrationSuccessSummary.newRightBlankId) && (
            <div className="pt-1">
              <span className="text-neutral-500 font-bold block mb-1.5">
                অটো-জেনারেটেড ২টি নতুন চাইল্ড Blank Position:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="block text-[10px] font-bold text-amber-700 dark:text-amber-300">LEFT BLANK</span>
                  <span className="font-mono font-black text-xs text-neutral-900 dark:text-white">
                    {registrationSuccessSummary.newLeftBlankId || '—'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
                  <span className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300">RIGHT BLANK</span>
                  <span className="font-mono font-black text-xs text-neutral-900 dark:text-white">
                    {registrationSuccessSummary.newRightBlankId || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {registrationSuccessSummary.fullServiceAddress && (
            <div className="py-1">
              <span className="text-neutral-500 font-medium block mb-0.5">বিলিং ঠিকানা:</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 block text-[11px] leading-relaxed">
                {registrationSuccessSummary.fullServiceAddress}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{isPrivilegedSessionRegistration ? 'বাইনারি ট্রি-তে ফিরে যান' : 'অর্ডার সম্পন্ন করতে এগিয়ে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 ${isModal ? 'max-h-[85vh] overflow-y-auto px-1' : ''}`}>
      
      {/* 1. FORM HEADER */}
      <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" iconOnly={true} className="shrink-0" />
          <div>
            <h2 className="font-black text-xl text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{pageTitle}</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleCancelAndClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 cursor-pointer rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. DYNAMIC SELECTED PRODUCT SUMMARY BANNER */}
      {(pendingProductName || source === 'checkout') && (
        <div className="mt-3.5 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                আপনার নির্বাচিত পণ্য:
              </span>
              <strong className="text-neutral-900 dark:text-white text-xs sm:text-sm font-black">
                {pendingProductName || 'Tooth Paste'}
              </strong>
            </div>
          </div>
          <div className="text-right pl-2">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 block">
              পরিমাণ:
            </span>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-mono font-bold text-xs">
              {pendingQuantity || 1}
            </span>
          </div>
        </div>
      )}

      {/* 3. ACCOUNT TABS: নতুন কাস্টমার সাইন আপ & লগইন (Login) */}
      {showTabs && (
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mt-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setGeneralError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন কাস্টমার সাইন আপ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setGeneralError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন (Login)</span>
          </button>
        </div>
      )}

      {/* ERROR MESSAGE ALERT */}
      {generalError && (
        <div className="mt-3.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{generalError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: নতুন কাস্টমার সাইন আপ (NEW CUSTOMER SIGN UP) */}
      {/* ========================================================================= */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignupSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Reserved Blank Position Lock Details Card */}
          {(effectiveReservedCompanyId || lockPlacement) && (
            <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  সংরক্ষিত বাইনারি পজিশন (Reserved Blank Position)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                  Read-Only Lock
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-100 dark:border-indigo-900">
                  <span className="block text-[10px] text-neutral-400 font-semibold">Reserved Company ID</span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                    {effectiveReservedCompanyId || 'AUTO'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-100 dark:border-indigo-900">
                  <span className="block text-[10px] text-neutral-400 font-semibold">Parent ID</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    {placementId || initialPlacementId || COMPANY_MASTER_ROOT_ID}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-100 dark:border-indigo-900">
                  <span className="block text-[10px] text-neutral-400 font-semibold">Position</span>
                  <span className="font-mono font-black uppercase text-emerald-600 dark:text-emerald-400">
                    {placementPosition}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instruction Note */}
          <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            অনুগ্রহ করে একটি ইউনিক ইউজার আইডি (User ID) নির্বাচন করুন।
          </div>

          {/* 1. FULL NAME */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              আপনার সম্পূর্ণ নাম (Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="আপনার সম্পূর্ণ নাম লিখুন"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border ${
                  formErrors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs`}
              />
            </div>
            {formErrors.fullName && (
              <span className="text-[11px] text-rose-500 font-bold block mt-1">
                {formErrors.fullName}
              </span>
            )}
          </div>

          {/* 2. USER ID & AUTO-GENERATED CUSTOMER ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* USER ID (UNIQUE & LIVE CHECK) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  ইউজার আইডি (User ID) <span className="text-rose-500">*</span>
                </label>
                {username.trim() && (
                  <span
                    className={`text-[11px] font-bold ${
                      usernameValidation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                    }`}
                  >
                    {usernameValidation.isValid ? '✅ User ID Available' : '❌ User ID Already Taken'}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  if (formErrors.username) setFormErrors((prev) => ({ ...prev, username: '' }));
                }}
                placeholder="একটি ইউনিক User ID নির্বাচন করুন"
                className={`w-full px-3.5 py-2.5 rounded-xl border ${
                  formErrors.username || (username.trim() && !usernameValidation.isValid)
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-neutral-300 dark:border-neutral-700'
                } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs font-mono`}
              />
              {formErrors.username ? (
                <span className="text-[11px] text-rose-500 font-bold block mt-1">
                  {formErrors.username}
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও আন্ডারস্কোর (_) ব্যবহার করুন।
                </span>
              )}
            </div>

            {/* CUSTOMER ID (AUTO-GENERATED & READ-ONLY) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  Customer ID (স্বয়ংক্রিয়)
                </label>
                <span className="text-[10px] text-neutral-400">Read-only</span>
              </div>
              <input
                type="text"
                readOnly
                value={previewCustomerId}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs cursor-not-allowed"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                সিস্টেমে স্বয়ংক্রিয়ভাবে তৈরি স্থায়ী আইডি (উদাঃ AponCN-000001)।
              </span>
            </div>
          </div>

          {/* 3. MOBILE NUMBER (01XXXXXXXXX) */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              মোবাইল নম্বর (Mobile) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (formErrors.mobile) setFormErrors((prev) => ({ ...prev, mobile: '' }));
                }}
                placeholder="01XXXXXXXXX"
                className={`w-full pl-10 pr-3 py-2.5 rounded-xl border ${
                  formErrors.mobile ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs font-mono`}
              />
            </div>
            {formErrors.mobile ? (
              <span className="text-[11px] text-rose-500 font-bold block mt-1">
                {formErrors.mobile}
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                ১১ ডিজিটের সঠিক বাংলাদেশী মোবাইল নম্বর লিখুন।
              </span>
            )}
          </div>

          {/* 4. PASSWORD MODE SELECTION (NORMAL VS STRONG) */}
          <div className="space-y-1.5">
            <label className="block font-bold text-neutral-700 dark:text-neutral-300">
              পাসওয়ার্ড মোড নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPasswordMode('normal')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  passwordMode === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span>Normal Password</span>
                <span className="text-[10px] opacity-75 font-normal">(যেমন: 123456)</span>
              </button>

              <button
                type="button"
                onClick={() => setPasswordMode('strong')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  passwordMode === 'strong'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <span>Strong Password</span>
                <span className="text-[10px] opacity-75 font-normal">(বড়+ছোট+সংখ্যা)</span>
              </button>
            </div>
          </div>

          {/* 5. PASSWORD & CONFIRM PASSWORD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  পাসওয়ার্ড <span className="text-rose-500">*</span>
                </label>
                {password && (
                  <span className={`text-[10px] font-bold ${
                    passwordStrength.level === 3 ? 'text-emerald-600' : passwordStrength.level === 2 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {passwordStrength.textBn}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder={passwordMode === 'strong' ? 'Abc@1234' : '123456'}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                    formErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter Bar */}
              {password && (
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                  />
                </div>
              )}

              {formErrors.password && (
                <span className="text-[11px] text-rose-500 font-bold block mt-1">
                  {formErrors.password}
                </span>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                কনফার্ম পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                    formErrors.confirmPassword || (confirmPassword && password !== confirmPassword)
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="text-[11px] text-rose-500 font-bold block mt-1">
                  পাসওয়ার্ড মিলছে না
                </span>
              )}
              {formErrors.confirmPassword && (
                <span className="text-[11px] text-rose-500 font-bold block mt-1">
                  {formErrors.confirmPassword}
                </span>
              )}
            </div>
          </div>

          {/* 6. BILLING ADDRESS SECTION (বিলিং ঠিকানা) */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-xs text-neutral-900 dark:text-white">
                বিলিং ঠিকানা (Billing Address)
              </h3>
            </div>

            {/* Division & District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* বিভাগ * */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  বিভাগ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    formErrors.division ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500`}
                >
                  <option value="">বিভাগ নির্বাচন করুন</option>
                  <option value="ঢাকা">ঢাকা</option>
                  <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                  <option value="রাজশাহী">রাজশাহী</option>
                  <option value="খুলনা">খুলনা</option>
                  <option value="বরিশাল">বরিশাল</option>
                  <option value="সিলেট">সিলেট</option>
                  <option value="রংপুর">রংপুর</option>
                  <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                </select>
                {formErrors.division && (
                  <span className="text-[11px] text-rose-500 font-bold block mt-1">
                    {formErrors.division}
                  </span>
                )}
              </div>

              {/* জেলা * */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  জেলা <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!division}
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    formErrors.district ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    !division ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/50' : ''
                  }`}
                >
                  <option value="">জেলা নির্বাচন করুন</option>
                  {availableDistricts.map((d) => (
                    <option key={d.nameBn} value={d.nameBn}>
                      {d.nameBn}
                    </option>
                  ))}
                </select>
                {formErrors.district && (
                  <span className="text-[11px] text-rose-500 font-bold block mt-1">
                    {formErrors.district}
                  </span>
                )}
              </div>
            </div>

            {/* Upazila & Union */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* উপজেলা / থানা * */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  উপজেলা / থানা <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!district}
                  value={upazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    formErrors.upazila ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    !district ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/50' : ''
                  }`}
                >
                  <option value="">উপজেলা / থানা নির্বাচন করুন</option>
                  {availableUpazilas.map((u) => (
                    <option key={u.nameBn} value={u.nameBn}>
                      {u.nameBn}
                    </option>
                  ))}
                </select>
                {formErrors.upazila && (
                  <span className="text-[11px] text-rose-500 font-bold block mt-1">
                    {formErrors.upazila}
                  </span>
                )}
              </div>

              {/* পৌরসভা / ইউনিয়ন * */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  পৌরসভা / ইউনিয়ন
                </label>
                <select
                  disabled={!upazila}
                  value={unionName}
                  onChange={(e) => setUnionName(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    !upazila ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800/50' : ''
                  }`}
                >
                  <option value="">পৌরসভা / ইউনিয়ন নির্বাচন করুন</option>
                  {availableUnions.map((un) => (
                    <option key={un.nameBn} value={un.nameBn}>
                      {un.nameBn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ward (Optional) */}
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                ওয়ার্ড <span className="text-neutral-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="ওয়ার্ড নম্বর"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden text-xs"
              />
            </div>

            {/* বিস্তারিত ঠিকানা (Textarea) */}
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                বিস্তারিত ঠিকানা
              </label>
              <textarea
                rows={2}
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
                placeholder="বাড়ি/রোড/গ্রাম/মহল্লা/এলাকার বিস্তারিত ঠিকানা লিখুন"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden text-xs resize-none"
              />
            </div>
          </div>

          {/* 7. REFERRAL / BINARY NETWORK CONFIGURATION */}
          <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>রেফারেল ও নেটওয়ার্ক কনফিগারেশন</span>
              </span>
              {lockPlacement && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                  লকড স্লট
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  রেফার আইডি (Refer ID)
                </label>
                <input
                  type="text"
                  value={referralId}
                  readOnly={lockPlacement && Boolean(initialReferralId)}
                  onChange={(e) => setReferralId(e.target.value.toUpperCase())}
                  placeholder={`${COMPANY_MASTER_ROOT_ID} (ঐচ্ছিক)`}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-xs"
                />
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  ফাঁকা রাখলে কোম্পানি মাস্টার আইডি ({COMPANY_MASTER_ROOT_ID}) প্রযোজ্য হবে।
                </span>
              </div>

              {source !== 'checkout' && (
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    পজিশন (Position)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={lockPlacement}
                      onClick={() => setPlacementPosition('left')}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        placementPosition === 'left'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Left
                    </button>
                    <button
                      type="button"
                      disabled={lockPlacement}
                      onClick={() => setPlacementPosition('right')}
                      className={`py-2 rounded-xl border font-bold text-xs transition-all ${
                        placementPosition === 'right'
                          ? 'border-emerald-500 bg-emerald-600 text-white shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Right
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 8. PRIMARY REGISTRATION BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>একাউন্ট তৈরি করা হচ্ছে...</span>
              </>
            ) : (
              <span>কাস্টমার একাউন্ট তৈরি করুন</span>
            )}
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: লগইন (LOGIN) */}
      {/* ========================================================================= */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4 text-xs">
          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          {/* USER ID */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              ইউজার আইডি (User ID) / Customer ID / মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginUserId}
                onChange={(e) => setLoginUserId(e.target.value)}
                placeholder="আপনার User ID বা Customer ID বা মোবাইল লিখুন"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-neutral-700 dark:text-neutral-300">
                পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-semibold cursor-pointer"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type={showLoginPassword ? 'text' : 'password'}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-xs"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loginLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>লগইন করা হচ্ছে...</span>
              </>
            ) : (
              <span>লগইন করুন</span>
            )}
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD MODAL OVERLAY */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h4 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>পাসওয়ার্ড রিসেট করুন</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordSent(false);
                  setForgotPasswordInput('');
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotPasswordSent ? (
              <div className="space-y-3 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                  আপনার মেম্বার আইডি বা মোবাইল নম্বরে পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে।
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordSent(false);
                    setForgotPasswordInput('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  ফিরে যান
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  আপনার নিবন্ধিত মোবাইল নম্বর, ইমেইল বা মেম্বার আইডি প্রবেশ করান:
                </p>
                <input
                  type="text"
                  value={forgotPasswordInput}
                  onChange={(e) => setForgotPasswordInput(e.target.value)}
                  placeholder="মোবাইল বা ইউজার আইডি"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <button
                  type="button"
                  disabled={!forgotPasswordInput.trim()}
                  onClick={() => setForgotPasswordSent(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                >
                  রিসেট কোড পাঠান
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
