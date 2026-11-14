/**
 * Apon Bazar (আপন বাজার) - Unified Registration System
 * 
 * 1. Role Selection Page / Modal:
 *    - BUYER: Register as a Buyer / Customer
 *    - SELLER: Register as a Seller / Dealer
 * 
 * 2. Buyer Registration Form:
 *    - Account Information: Full Name, Mobile Number, Referral ID (Optional),
 *      Placement Position (Left/Right), Placement ID (System-Determined & Read-Only),
 *      Password, Re-Password
 *    - Address: Division, District, Upazila, Union, Village/Area
 *    - System Placement Calculation & Binary Network Integration
 *    - Generates Customer ID & Confirmation Screen with Auto-Login
 * 
 * 3. Seller Registration Form:
 *    - Separate flow for Vendors/Merchants/Dealers (No network binary placement)
 *    - Shop Name, Owner Name, Mobile, Business Category, Address, Trade License/NID, Password
 *    - Generates Dealer ID & Confirmation Screen with Auto-Login
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { previewRoleUniqueId } from '../../lib/security';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList,
  getUnionPostalCode
} from '../../lib/bd-locations';
import { BrandLogo } from '../common/BrandLogo';
import {
  X,
  UserCheck,
  ShoppingBag,
  Store,
  CheckCircle2,
  AlertCircle,
  User,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  Sparkles,
  Building,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  GitBranch,
  Info,
  Briefcase,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  Mail,
  LogIn
} from 'lucide-react';
import { CustomerRegistrationForm } from './CustomerRegistrationForm';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: (prefilledIdentifier?: string) => void;
  initialRole?: 'buyer' | 'seller';
  initialReferralId?: string;
  initialPlacementId?: string;
  initialPlacementPosition?: 'left' | 'right';
  lockPlacement?: boolean;
  registrationSource?: 'Dashboard' | 'Binary Tree' | 'dashboard' | 'binary_tree' | 'ai_placement';
}

type RegistrationView =
  | 'role_selection'
  | 'buyer_form'
  | 'seller_form'
  | 'buyer_confirmation'
  | 'seller_confirmation';

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  initialRole,
  initialReferralId,
  initialPlacementId,
  initialPlacementPosition,
  lockPlacement = false,
  registrationSource
}) => {
  const { registerUser, rollbackUserRegistration, setActiveRole, systemSettings, allUsers } = useAuth();

  // Official seller/dealer contact email dynamically loaded from system settings
  const sellerContactEmail = useMemo(() => {
    return (
      systemSettings?.sellerContactEmail ||
      systemSettings?.dealerContactEmail ||
      'dealer@aponbazar.com'
    );
  }, [systemSettings]);
  const {
    members,
    calculatePlacementRule,
    executeNetworkActivationAndPlacement,
    validateReferId,
    validatePlacementId,
    getCompanyMasterMember,
    reserveSlotDuringRegistration,
    releaseReservedSlot,
    reservedPlacements
  } = useNetworkMarketing();
  const { addNotification } = useNotifications();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Modal Step / View State
  const [currentView, setCurrentView] = useState<RegistrationView>(
    initialRole === 'seller' ? 'seller_form' : 'buyer_form'
  );

  // New UI & Security states for registration page
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [turnstileChecking, setTurnstileChecking] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordInput, setForgotPasswordInput] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [socialNotice, setSocialNotice] = useState<string | null>(null);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);

  // Sync initialRole and placement props when modal opens & handle slot reservation
  useEffect(() => {
    if (isOpen) {
      if (initialRole === 'seller') {
        setCurrentView('seller_form');
      } else {
        // Default directly to the clean Create Account buyer registration form
        setCurrentView('buyer_form');
      }
      if (initialReferralId) {
        setBuyerReferralId(initialReferralId.trim());
      }
      if (initialPlacementId) {
        setBuyerPlacementId(initialPlacementId.trim());
      }
      if (initialPlacementPosition) {
        setBuyerPlacementPosition(initialPlacementPosition);
      }
      setError('');
      setSocialNotice(null);

      // Slot reservation: If started from binary tree, reserve the selected slot
      if (initialPlacementId && initialPlacementPosition) {
        const resId = reserveSlotDuringRegistration(
          initialPlacementId.trim(),
          initialPlacementPosition,
          'Pending Registration'
        );
        setActiveReservationId(resId);
      }
    }
  }, [isOpen, initialRole, initialReferralId, initialPlacementId, initialPlacementPosition]);

  // Handle modal close with safe slot reservation release
  const handleModalClose = () => {
    if (activeReservationId && (buyerPlacementId || initialPlacementId) && (buyerPlacementPosition || initialPlacementPosition)) {
      releaseReservedSlot(buyerPlacementId || initialPlacementId || '', buyerPlacementPosition || initialPlacementPosition || 'right');
      setActiveReservationId(null);
    }
    onClose();
  };

  // --------------------------------------------------------------------------
  // COMMON UI STATES
  // --------------------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string>('');

  const copyToClipboard = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  const handleTurnstileClick = () => {
    if (turnstileVerified || turnstileChecking) return;
    setTurnstileChecking(true);
    setTimeout(() => {
      setTurnstileChecking(false);
      setTurnstileVerified(true);
    }, 500);
  };

  // --------------------------------------------------------------------------
  // 1. BUYER REGISTRATION FORM STATE
  // --------------------------------------------------------------------------
  const [buyerFullName, setBuyerFullName] = useState('');
  const [buyerUsername, setBuyerUsername] = useState('');
  const [buyerMobile, setBuyerMobile] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerReferralId, setBuyerReferralId] = useState('');
  const [buyerPlacementId, setBuyerPlacementId] = useState('');
  const [buyerPlacementPosition, setBuyerPlacementPosition] = useState<'left' | 'right'>('right');
  const [passwordMode, setPasswordMode] = useState<'normal' | 'strong'>('normal');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerConfirmPassword, setBuyerConfirmPassword] = useState('');
  const [showBuyerPassword, setShowBuyerPassword] = useState(false);
  const [showBuyerConfirmPassword, setShowBuyerConfirmPassword] = useState(false);

  // Address (Buyer)
  const [buyerDivision, setBuyerDivision] = useState<string>('ঢাকা');
  const [buyerDistrict, setBuyerDistrict] = useState<string>('ঢাকা');
  const [buyerUpazila, setBuyerUpazila] = useState<string>('ধানমন্ডি');
  const [buyerUnion, setBuyerUnion] = useState<string>('ধানমন্ডি আ/এ');
  const [buyerVillage, setBuyerVillage] = useState<string>('সোবহানবাগ');
  const [buyerHousePara, setBuyerHousePara] = useState<string>('বাড়ি ২৭, সড়ক ০৪');

  // Preview Customer ID (Auto-generated AponCN-XXXXXX format, read-only, non-mutating)
  const previewCustomerId = useMemo(() => {
    return previewRoleUniqueId('customer_networker', allUsers);
  }, [allUsers]);

  // URL Query param auto-referral and auto-placement code detection
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('sponsor') || params.get('referral');
      if (urlRef && !initialReferralId) {
        setBuyerReferralId(urlRef.trim());
      }
      const urlPlacement = params.get('placement') || params.get('parent') || params.get('place');
      if (urlPlacement && !initialPlacementId) {
        setBuyerPlacementId(urlPlacement.trim());
      }
    }
  }, [isOpen, initialReferralId, initialPlacementId]);

  // Real-time username verification against system accounts
  const usernameValidation = useMemo(() => {
    const clean = buyerUsername.trim();
    if (!clean) {
      return { status: 'empty', message: '', isValid: false };
    }
    if (clean.length < 3) {
      return {
        status: 'too_short',
        message: isBn ? 'ইউজার আইডি সর্বনিম্ন ৩ অক্ষরের হতে হবে।' : 'User ID must be at least 3 characters.',
        isValid: false
      };
    }
    const validFormat = /^[a-zA-Z0-9_]+$/.test(clean);
    if (!validFormat) {
      return {
        status: 'invalid_format',
        message: isBn ? 'শুধুমাত্র অক্ষর (a-z, A-Z), সংখ্যা (0-9) বা _ ব্যবহার করা যাবে।' : 'Only letters, numbers, or _ allowed.',
        isValid: false
      };
    }
    const cleanLower = clean.toLowerCase();
    const isTaken = allUsers.some(
      (u) =>
        u.username?.toLowerCase() === cleanLower ||
        u.customerId?.toLowerCase() === cleanLower ||
        u.permanentMemberId?.toLowerCase() === cleanLower ||
        u.id.toLowerCase() === cleanLower
    );
    if (isTaken) {
      return {
        status: 'taken',
        message: 'User ID already exists. Please choose another User ID.',
        isValid: false
      };
    }
    return {
      status: 'available',
      message: isBn ? '✅ এই Users ID টি খালি আছে (Available)' : '✅ This Users ID is available.',
      isValid: true
    };
  }, [buyerUsername, allUsers, isBn]);

  // Real-time validations
  const referValidation = useMemo(() => {
    return validateReferId(buyerReferralId.trim());
  }, [buyerReferralId, validateReferId]);

  const placementValidation = useMemo(() => {
    return validatePlacementId(buyerPlacementId.trim());
  }, [buyerPlacementId, validatePlacementId]);

  // Real-time occupied placement slot detection
  const isSelectedSlotOccupied = useMemo(() => {
    if (!placementValidation.isValid || !placementValidation.placementParent) return false;
    const parent = placementValidation.placementParent;
    if (buyerPlacementPosition === 'left' && parent.leftChildId) return true;
    if (buyerPlacementPosition === 'right' && parent.rightChildId) return true;
    
    // Check if slot is reserved by another registration
    const isOtherReserved = reservedPlacements.some(
      (r) =>
        (r.parentMemberId.toLowerCase() === parent.id.toLowerCase() ||
         r.parentMemberId.toLowerCase() === (parent.customerId || '').toLowerCase()) &&
        r.leg === buyerPlacementPosition &&
        r.id !== activeReservationId &&
        r.userId !== activeReservationId
    );
    if (isOtherReserved) return true;
    return false;
  }, [placementValidation, buyerPlacementPosition, reservedPlacements, activeReservationId]);

  // Buyer Placement Calculation (Live & Real-time Priority 1 - 4 Hierarchy)
  const buyerPlacementCalc = useMemo(() => {
    return calculatePlacementRule(buyerReferralId.trim(), buyerPlacementId.trim(), buyerPlacementPosition);
  }, [buyerReferralId, buyerPlacementId, buyerPlacementPosition, calculatePlacementRule]);

  // Buyer Registration Result Summary
  const [buyerRegisteredSummary, setBuyerRegisteredSummary] = useState<{
    customerId: string;
    username: string;
    fullName: string;
    mobile: string;
    sponsorId: string;
    sponsorName: string;
    placementId: string;
    placementName: string;
    placementLeg: 'left' | 'right';
    addressText: string;
  } | null>(null);

  // --------------------------------------------------------------------------
  // 2. SELLER REGISTRATION FORM STATE
  // --------------------------------------------------------------------------
  const [sellerOwnerName, setSellerOwnerName] = useState('');
  const [sellerMobile, setSellerMobile] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerShopName, setSellerShopName] = useState('');
  const [sellerCategory, setSellerCategory] = useState('মুদি ও খাদ্য সামগ্রী (Grocery & Foods)');
  const [sellerTradeLicense, setSellerTradeLicense] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerConfirmPassword, setSellerConfirmPassword] = useState('');
  const [showSellerPassword, setShowSellerPassword] = useState(false);
  const [showSellerConfirmPassword, setShowSellerConfirmPassword] = useState(false);

  // Address (Seller)
  const [sellerDivision, setSellerDivision] = useState<string>('ঢাকা');
  const [sellerDistrict, setSellerDistrict] = useState<string>('ঢাকা');
  const [sellerUpazila, setSellerUpazila] = useState<string>('ধানমন্ডি');
  const [sellerUnion, setSellerUnion] = useState<string>('ধানমন্ডি আ/এ');
  const [sellerShopAddress, setSellerShopAddress] = useState<string>('দোকান নং ১২, সেন্ট্রাল মার্কেট');

  // Seller Registration Result Summary
  const [sellerRegisteredSummary, setSellerRegisteredSummary] = useState<{
    dealerId: string;
    shopName: string;
    ownerName: string;
    mobile: string;
    email: string;
    category: string;
    addressText: string;
  } | null>(null);

  // --------------------------------------------------------------------------
  // LOCATION CASCADING HANDLERS (BUYER)
  // --------------------------------------------------------------------------
  const handleBuyerDivisionChange = (newDiv: string) => {
    setBuyerDivision(newDiv);
    const distList = getDistrictsList(newDiv);
    const newDist = distList[0]?.nameBn || '';
    setBuyerDistrict(newDist);
    const upaList = getUpazilasList(newDiv, newDist);
    const newUpa = upaList[0]?.nameBn || '';
    setBuyerUpazila(newUpa);
    const uniList = getUnionsList(newDiv, newDist, newUpa);
    setBuyerUnion(uniList[0]?.nameBn || '');
  };

  const handleBuyerDistrictChange = (newDist: string) => {
    setBuyerDistrict(newDist);
    const upaList = getUpazilasList(buyerDivision, newDist);
    const newUpa = upaList[0]?.nameBn || '';
    setBuyerUpazila(newUpa);
    const uniList = getUnionsList(buyerDivision, newDist, newUpa);
    setBuyerUnion(uniList[0]?.nameBn || '');
  };

  const handleBuyerUpazilaChange = (newUpa: string) => {
    setBuyerUpazila(newUpa);
    const uniList = getUnionsList(buyerDivision, buyerDistrict, newUpa);
    setBuyerUnion(uniList[0]?.nameBn || '');
  };

  // --------------------------------------------------------------------------
  // LOCATION CASCADING HANDLERS (SELLER)
  // --------------------------------------------------------------------------
  const handleSellerDivisionChange = (newDiv: string) => {
    setSellerDivision(newDiv);
    const distList = getDistrictsList(newDiv);
    const newDist = distList[0]?.nameBn || '';
    setSellerDistrict(newDist);
    const upaList = getUpazilasList(newDiv, newDist);
    const newUpa = upaList[0]?.nameBn || '';
    setSellerUpazila(newUpa);
    const uniList = getUnionsList(newDiv, newDist, newUpa);
    setSellerUnion(uniList[0]?.nameBn || '');
  };

  const handleSellerDistrictChange = (newDist: string) => {
    setSellerDistrict(newDist);
    const upaList = getUpazilasList(sellerDivision, newDist);
    const newUpa = upaList[0]?.nameBn || '';
    setSellerUpazila(newUpa);
    const uniList = getUnionsList(sellerDivision, newDist, newUpa);
    setSellerUnion(uniList[0]?.nameBn || '');
  };

  const handleSellerUpazilaChange = (newUpa: string) => {
    setSellerUpazila(newUpa);
    const uniList = getUnionsList(sellerDivision, sellerDistrict, newUpa);
    setSellerUnion(uniList[0]?.nameBn || '');
  };

  // --------------------------------------------------------------------------
  // SUBMIT HANDLER: BUYER REGISTRATION
  // --------------------------------------------------------------------------
  const handleBuyerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedName = buyerFullName.trim();
    const trimmedUsername = buyerUsername.trim();
    const trimmedMobile = buyerMobile.trim();
    const trimmedEmail = buyerEmail.trim().toLowerCase();
    const trimmedPassword = buyerPassword.trim();
    const trimmedConfirmPassword = buyerConfirmPassword.trim();
    const trimmedVillage = buyerVillage.trim();
    const trimmedHousePara = buyerHousePara.trim();

    // 1. Full Name validation
    if (!trimmedName) {
      setError(isBn ? 'অনুগ্রহ করে সম্পূর্ণ নাম লিখুন।' : 'Please enter full name.');
      return;
    }

    // 2. Users ID validation
    if (!trimmedUsername) {
      setError('User ID already exists. Please choose another User ID.');
      return;
    }
    if (!usernameValidation.isValid) {
      setError(usernameValidation.message || 'User ID already exists. Please choose another User ID.');
      return;
    }

    // 3. Mobile Number or Email validation
    if (!trimmedMobile && !trimmedEmail) {
      setError(isBn ? 'অনুগ্রহ করে মোবাইল নম্বর অথবা ইমেইল ঠিকানা দিন।' : 'Please enter Mobile Number or Email.');
      return;
    }
    if (trimmedMobile && trimmedMobile.length < 11) {
      setError(isBn ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের কাস্টমার মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please enter a valid 11-digit mobile number.');
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(isBn ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।' : 'Please enter a valid email address.');
      return;
    }

    // 4. Password validation (Normal vs Strong)
    if (passwordMode === 'strong') {
      const hasUpper = /[A-Z]/.test(trimmedPassword);
      const hasLower = /[a-z]/.test(trimmedPassword);
      const hasNumber = /[0-9]/.test(trimmedPassword);
      const hasSpecial = /[^A-Za-z0-9]/.test(trimmedPassword);
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || trimmedPassword.length < 6) {
        setError(
          isBn
            ? 'শক্তিশালী পাসওয়ার্ডে অবশ্যই বড় হাতের অক্ষর, ছোট হাতের অক্ষর, সংখ্যা এবং বিশেষ চিহ্ন থাকতে হবে (সর্বনিম্ন ৬ অক্ষর)।'
            : 'Strong password must include uppercase letters, lowercase letters, numbers, and special characters (min 6 characters).'
        );
        return;
      }
    } else {
      if (!trimmedPassword || trimmedPassword.length < 4) {
        setError(isBn ? 'পাসওয়ার্ড সর্বনিম্ন ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
        return;
      }
    }

    // 5. Password confirmation
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError('Password does not match.');
      return;
    }

    // 6. Security verification (Cloudflare Turnstile)
    if (!turnstileVerified) {
      setError(
        isBn
          ? 'অনুগ্রহ করে নিরাপত্তা যাচাই (Cloudflare Turnstile) সম্পন্ন করুন।'
          : 'Please complete the security verification (Cloudflare Turnstile).'
      );
      return;
    }

    // 7. Terms & Conditions acceptance
    if (!agreeTerms) {
      setError('Please accept the Terms & Conditions.');
      return;
    }

    // 8. Refer ID validation (if provided)
    if (buyerReferralId.trim() && !referValidation.isValid) {
      setError('Invalid Refer ID.');
      return;
    }

    // 9. Occupied slot check
    if (isSelectedSlotOccupied) {
      setError('This placement slot is already occupied.');
      return;
    }

    // 10. Basic Address validation
    if (!buyerDivision || !buyerDistrict) {
      setError(isBn ? 'অনুগ্রহ করে বিভাগ ও জেলা নির্বাচন করুন।' : 'Please select Division and District.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullAddressStr = `${trimmedHousePara ? trimmedHousePara + ', ' : ''}${trimmedVillage ? 'গ্রাম: ' + trimmedVillage + ', ' : ''}ইউনিয়ন: ${buyerUnion || 'সদর'}, উপজেলা: ${buyerUpazila || 'সদর'}, জেলা: ${buyerDistrict}, বিভাগ: ${buyerDivision}`;
      const postalCode = getUnionPostalCode(buyerDivision, buyerDistrict, buyerUpazila, buyerUnion) || '1209';

      // 1. Calculate & Validate Placement Rule (Priorities 1 - 4)
      const calcResult = calculatePlacementRule(buyerReferralId.trim(), buyerPlacementId.trim(), buyerPlacementPosition);
      
      // Priority 4 Check: Reject invalid Refer ID or Placement ID
      if (calcResult.error || !calcResult.isValidSponsor || !calcResult.isValidPlacement) {
        setError(calcResult.error || (isBn ? 'অবৈধ রেফার আইডি অথবা প্লেসমেন্ট আইডি প্রদান করা হয়েছে।' : 'Invalid Refer ID.'));
        setLoading(false);
        return;
      }

      const chosenSponsorId = calcResult.sponsorId;
      const chosenPlacementId = calcResult.placementId;
      const chosenPlacementLeg = calcResult.placementLeg;
      const regSource: string =
        registrationSource || (lockPlacement || initialPlacementId ? 'Binary Tree' : 'Dashboard');

      // 2. Register User as Customer in AuthContext
      const newUser = registerUser({
        fullName: trimmedName,
        username: trimmedUsername,
        mobileNumber: trimmedMobile,
        email: trimmedEmail || `${trimmedUsername}@customer.aponbazar.com`,
        password: trimmedPassword,
        role: 'customer',
        division: buyerDivision,
        district: buyerDistrict,
        upazila: buyerUpazila,
        unionName: buyerUnion,
        village: trimmedVillage,
        para: trimmedHousePara,
        houseNo: trimmedHousePara,
        area: `${trimmedHousePara}, ${trimmedVillage}`,
        postalCode: postalCode,
        fullServiceAddress: fullAddressStr,
        sponsorId: chosenSponsorId,
        referralId: chosenSponsorId,
        placementId: chosenPlacementId,
        placementLeg: chosenPlacementLeg
      });

      if (!newUser || !newUser.id) {
        throw new Error('কাস্টমার অ্যাকাউন্ট সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }

      // 3. Register and place member in the binary network
      const userPermanentId = newUser.customerId || newUser.permanentMemberId || newUser.id;
      const netRes = executeNetworkActivationAndPlacement({
        userId: newUser.id,
        fullName: trimmedName,
        username: trimmedUsername,
        customerId: newUser.customerId || userPermanentId,
        mobile: trimmedMobile,
        email: trimmedEmail || newUser.email,
        address: fullAddressStr,
        registrationSource: regSource,
        sponsorIdInput: buyerReferralId.trim(),
        placementIdInput: buyerPlacementId.trim(),
        preferredLeg: chosenPlacementLeg,
        district: buyerDistrict,
        upazila: buyerUpazila,
        permanentMemberId: userPermanentId
      });

      if (!netRes.success) {
        if (newUser && newUser.id && rollbackUserRegistration) {
          rollbackUserRegistration(newUser.id);
        }
        throw new Error(netRes.message || 'নেটওয়ার্ক প্লেসমেন্ট ব্যর্থ হয়েছে।');
      }

      // 4. Activate Customer session
      if (setActiveRole) {
        setActiveRole('customer');
      }

      // 5. Welcome in-app notification
      if (addNotification) {
        addNotification({
          userId: newUser.id,
          title: isBn ? 'কাস্টমার নিবন্ধন ও স্লট রিজার্ভেশন সম্পন্ন!' : 'Customer Registration & Slot Reservation Completed!',
          message: isBn
            ? `স্বাগতম ${trimmedName}! আপনার কাস্টমার আইডি: ${userPermanentId}, Users ID: ${trimmedUsername}। আপনি সরাসরি লগইন হয়েছেন এবং ১০০ সাইনআপ টোকেন পেয়েছেন।`
            : `Welcome ${trimmedName}! Your Customer ID is ${userPermanentId}, Users ID is ${trimmedUsername}.`,
          channel: 'in_app'
        });
      }

      // 6. Set Summary & Go to Confirmation
      setBuyerRegisteredSummary({
        customerId: userPermanentId,
        username: trimmedUsername,
        fullName: trimmedName,
        mobile: trimmedMobile,
        sponsorId: chosenSponsorId,
        sponsorName: calcResult.sponsorName,
        placementId: chosenPlacementId,
        placementName: calcResult.placementName,
        placementLeg: chosenPlacementLeg,
        addressText: fullAddressStr
      });

      setCurrentView('buyer_confirmation');
    } catch (err: any) {
      console.error('Buyer registration error:', err);
      setError(err?.message || 'নিবন্ধন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // SUBMIT HANDLER: SELLER REGISTRATION
  // --------------------------------------------------------------------------
  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedOwner = sellerOwnerName.trim();
    const trimmedMobile = sellerMobile.trim();
    const trimmedEmail = sellerEmail.trim();
    const trimmedShop = sellerShopName.trim();
    const trimmedPassword = sellerPassword.trim();
    const trimmedConfirmPassword = sellerConfirmPassword.trim();
    const trimmedAddress = sellerShopAddress.trim();

    // Validation
    if (!trimmedOwner) {
      setError(isBn ? 'অনুগ্রহ করে স্বত্বাধিকারী / প্রতিনিধির নাম লিখুন।' : 'Please enter Owner/Representative name.');
      return;
    }
    if (!trimmedShop) {
      setError(isBn ? 'অনুগ্রহ করে দোকান / ব্যবসার নাম লিখুন।' : 'Please enter Shop/Business name.');
      return;
    }
    if (!trimmedMobile || trimmedMobile.length < 11) {
      setError(isBn ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please enter a valid 11-digit mobile number.');
      return;
    }
    if (!trimmedEmail) {
      setError(isBn ? 'অনুগ্রহ করে আপনার ইমেইল এড্রেস লিখুন।' : 'Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError(
        isBn
          ? 'অনুগ্রহ করে সঠিক ফরম্যাটের ইমেইল এড্রেস লিখুন (যেমন: name@example.com)।'
          : 'Please enter a valid email address (e.g. name@example.com).'
      );
      return;
    }
    const normalizedEmail = trimmedEmail.toLowerCase();
    const existingDealer = allUsers?.find(
      (u) =>
        (u.email || '').toLowerCase() === normalizedEmail &&
        (u.primaryRole === 'dealer' || (u.roles && u.roles.includes('dealer')))
    );
    if (existingDealer) {
      setError(
        isBn
          ? `ইমেইল এড্রেস '${trimmedEmail}' দিয়ে ইতোমধ্যে একজন ডিলার নিবন্ধিত রয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন বা লগইন করুন।`
          : `A dealer with email '${trimmedEmail}' is already registered. Please use another email or log in.`
      );
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      setError(isBn ? 'পাসওয়ার্ড সর্বনিম্ন ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }
    if (trimmedPassword !== trimmedConfirmPassword) {
      setError(isBn ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড একই হতে হবে।' : 'Passwords do not match.');
      return;
    }
    if (!sellerDivision || !sellerDistrict || !sellerUpazila) {
      setError(isBn ? 'অনুগ্রহ করে বিভাগ, জেলা ও উপজেলা নির্বাচন করুন।' : 'Please select Division, District and Upazila.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullShopAddress = `${trimmedAddress ? trimmedAddress + ', ' : ''}ইউনিয়ন/পৌরসভা: ${sellerUnion || 'সদর'}, উপজেলা: ${sellerUpazila}, জেলা: ${sellerDistrict}, বিভাগ: ${sellerDivision}`;

      // Register Seller / Dealer in AuthContext (No network binary placement)
      const newSeller = registerUser({
        fullName: trimmedOwner,
        mobileNumber: trimmedMobile,
        email: trimmedEmail,
        password: trimmedPassword,
        role: 'dealer',
        shopName: trimmedShop,
        businessType: sellerCategory,
        tradeLicenseNumber: sellerTradeLicense.trim(),
        division: sellerDivision,
        district: sellerDistrict,
        upazila: sellerUpazila,
        unionName: sellerUnion,
        area: fullShopAddress,
        fullServiceAddress: fullShopAddress
      });

      if (!newSeller || !newSeller.id) {
        throw new Error('সেলার অ্যাকাউন্ট তৈরি করা সম্ভব হয়নি।');
      }

      // Activate Dealer session
      if (setActiveRole) {
        setActiveRole('dealer');
      }

      const dealerId = newSeller.permanentMemberId || newSeller.id;

      // Welcome Notification
      if (addNotification) {
        addNotification({
          userId: newSeller.id,
          title: isBn ? 'সেলার মার্চেন্ট অ্যাকাউন্ট তৈরি হয়েছে!' : 'Seller Account Created!',
          message: isBn
            ? `স্বাগতম ${trimmedShop}! আপনার ডিলার আইডি: ${dealerId}। এখন পণ্য লিস্টিং ও বিক্রি শুরু করতে পারেন।`
            : `Welcome ${trimmedShop}! Your Dealer ID is ${dealerId}.`,
          channel: 'in_app'
        });
      }

      setSellerRegisteredSummary({
        dealerId,
        shopName: trimmedShop,
        ownerName: trimmedOwner,
        mobile: trimmedMobile,
        email: trimmedEmail,
        category: sellerCategory,
        addressText: fullShopAddress
      });

      setCurrentView('seller_confirmation');
    } catch (err: any) {
      console.error('Seller registration error:', err);
      setError(err?.message || 'সেলার নিবন্ধন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Dropdown lists
  const buyerDistrictList = getDistrictsList(buyerDivision);
  const buyerUpazilaList = getUpazilasList(buyerDivision, buyerDistrict);
  const buyerUnionList = getUnionsList(buyerDivision, buyerDistrict, buyerUpazila);

  const sellerDistrictList = getDistrictsList(sellerDivision);
  const sellerUpazilaList = getUpazilasList(sellerDivision, sellerDistrict);
  const sellerUnionList = getUnionsList(sellerDivision, sellerDistrict, sellerUpazila);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] flex flex-col transition-all">
        
        {/* Top Action Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            {(currentView === 'buyer_form' || currentView === 'seller_form') && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('role_selection');
                  setError('');
                }}
                className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title={isBn ? 'ভূমিকা পরিবর্তনে ফিরে যান' : 'Back to role selection'}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{isBn ? 'ভূমিকা নির্বাচন' : 'Change Type'}</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <BrandLogo size="xs" iconOnly={true} className="shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Apon Bazar • {isBn ? 'রেজিস্ট্রেশন পোর্টাল' : 'Registration Portal'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleModalClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 space-y-4 flex-1">

          {/* ================================================================
              VIEW 1: ROLE SELECTION MODAL (BUYER vs SELLER)
              ================================================================ */}
          {currentView === 'role_selection' && (
            <div className="py-2 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                  {isBn ? 'অ্যাকাউন্টের ধরন নির্বাচন করুন' : 'Choose Your Account Type'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                  {isBn
                    ? 'আপনি কীভাবে Apon Bazar এর সাথে যুক্ত হতে চান তা নির্ধারণ করে এগিয়ে যান।'
                    : 'Select whether you want to register as a Customer or a Merchant/Dealer.'}
                </p>
              </div>

              {/* Two Option Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* OPTION 1: BUYER REGISTRATION */}
                <div
                  id="btn-select-buyer-role"
                  onClick={() => {
                    setCurrentView('buyer_form');
                    setError('');
                  }}
                  className="group relative bg-gradient-to-b from-white to-emerald-50/40 dark:from-neutral-850 dark:to-neutral-900 border-2 border-emerald-200 dark:border-emerald-800/70 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-3xl p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {isBn ? 'জনপ্রিয়' : 'Buyer / Customer'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        {isBn ? 'BUYER / কাস্টমার' : 'BUYER'}
                      </h3>
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {isBn ? 'Register as a Buyer / Customer' : 'Shop, save, earn referral rewards'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{isBn ? '১০০% আসল ও খাঁটি পণ্য হোম ডেলিভারি' : '100% authentic fresh grocery products'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{isBn ? 'প্রতি কেনাকাটায় ক্যাশব্যাক ও পয়েন্ট' : 'Instant cashback & reward tokens'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{isBn ? 'ঐচ্ছিক রেফারেল বোনাস ও বাইনারি নেটওয়ার্ক' : 'Referral bonus & binary network earning'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-emerald-100 dark:border-neutral-800">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all group-hover:shadow-emerald-600/30 cursor-pointer"
                    >
                      <span>{isBn ? 'Buyer Registration (কাস্টমার)' : 'Buyer Registration'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* OPTION 2: SELLER REGISTRATION */}
                <div
                  id="btn-select-seller-role"
                  onClick={() => {
                    setCurrentView('seller_form');
                    setError('');
                  }}
                  className="group relative bg-gradient-to-b from-white to-amber-50/40 dark:from-neutral-850 dark:to-neutral-900 border-2 border-amber-200 dark:border-amber-800/70 hover:border-amber-600 dark:hover:border-amber-500 rounded-3xl p-5 sm:p-6 transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Store className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                        {isBn ? 'মার্চেন্ট / ডিলার' : 'Seller / Dealer'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        {isBn ? 'SELLER / বিক্রেতা বা ডিলার' : 'SELLER'}
                      </h3>
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {isBn ? 'Register as a Seller / Dealer' : 'Sell products nationwide with 0% listing fee'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{isBn ? 'দেশব্যাপী পণ্য বিক্রির সুবিধা (০% লিস্টিং ফি)' : 'Sell products nationwide with 0% listing fee'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{isBn ? '২৪-৪৮ ঘণ্টায় বিকাশ/নগদ/ব্যাংকে পেমেন্ট' : 'Fast 24-48h automated payout settlements'}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>{isBn ? 'পৃথক ডেডিকেটেড মার্চেন্ট ও ভেন্ডর প্যানেল' : 'Dedicated merchant inventory & orders portal'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-amber-100 dark:border-neutral-800">
                    <button
                      type="button"
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all group-hover:shadow-amber-600/30 cursor-pointer"
                    >
                      <span>{isBn ? 'Seller Registration (ডিলার/মার্চেন্ট)' : 'Seller Registration'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <div className="mt-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <a
                        id="role-seller-quick-email-btn"
                        href={`mailto:${sellerContactEmail}?subject=${encodeURIComponent(
                          isBn ? 'সেলার / ডিলার রেজিস্ট্রেশন সম্পর্কিত যোগাযোগ - Apon Bazar' : 'Seller / Dealer Registration Inquiry - Apon Bazar'
                        )}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[#198754] hover:text-[#157347] dark:text-emerald-400 font-bold hover:underline"
                        title={`Email: ${sellerContactEmail}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-[#198754] dark:text-emerald-400" />
                        <span>{isBn ? '📧 Email Us (আমাদের ইমেইল করুন)' : '📧 Email Us'}</span>
                      </a>
                    </div>
                  </div>
                </div>

              </div>

              {/* Already have an account? */}
              <div className="text-center pt-2 text-xs text-neutral-600 dark:text-neutral-400">
                <span>{isBn ? 'ইতিমধ্যেই Apon Bazar অ্যাকাউন্ট আছে?' : 'Already have a Apon Bazar account?'} </span>
                <button
                  type="button"
                  onClick={() => onSwitchToLogin()}
                  className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer ml-1"
                >
                  {isBn ? 'লগইন করুন' : 'Log In'}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              VIEW 2: BUYER REGISTRATION FORM
              ================================================================ */}
          {/* ================================================================
              VIEW 2: BUYER REGISTRATION FORM (কাস্টমার নিবন্ধন ও স্লট রিজার্ভেশন)
              ================================================================ */}
          {currentView === 'buyer_form' ? (
            <CustomerRegistrationForm
              source={
                registrationSource === 'Binary Tree' || registrationSource === 'binary_tree'
                  ? 'binary_tree'
                  : registrationSource === 'ai_placement'
                  ? 'ai_placement'
                  : 'dashboard'
              }
              initialReferralId={initialReferralId}
              initialPlacementId={initialPlacementId}
              initialPlacementPosition={initialPlacementPosition}
              lockPlacement={lockPlacement}
              onClose={onClose}
              onSwitchToLogin={onSwitchToLogin}
              isModal={true}
            />
          ) : null}

          {false && currentView === 'buyer_form' && (
            <form onSubmit={handleBuyerSubmit} className="space-y-4">
              
              {/* Form Header */}
              <div className="text-center pt-1 pb-2 border-b border-neutral-100 dark:border-neutral-800 space-y-1">
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                  Create Account
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  Join Apon Bazar today.
                </p>
              </div>

              {/* Binary Tree Slot Reservation Banner (if active) */}
              {(lockPlacement || initialPlacementId || activeReservationId) && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
                    <GitBranch className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">
                        {isBn ? 'বাইনারি ট্রি স্লট সংরক্ষিত' : 'Binary Tree Slot Reserved'}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        {isBn ? 'প্লেসমেন্ট:' : 'Placement:'} {buyerPlacementPosition === 'left' ? 'LEFT' : 'RIGHT'} under [{buyerPlacementId || initialPlacementId}] (Sponsor: {buyerReferralId || initialReferralId || 'Master ID'})
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-mono font-bold rounded-lg shrink-0 shadow-xs">
                    Slot Reserved
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* FIELD 1: কাস্টমার নাম */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  {isBn ? '১. কাস্টমার নাম' : '1. Customer Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    id="buyer-fullname-input"
                    type="text"
                    required
                    value={buyerFullName}
                    onChange={(e) => setBuyerFullName(e.target.value)}
                    placeholder={isBn ? 'যেমন: মোঃ আনিসুর রহমান' : 'e.g. John Doe'}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all min-h-[44px]"
                  />
                </div>
              </div>

              {/* FIELD 2: Mobile Number or Email */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    2. Mobile Number or Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <input
                      id="buyer-mobile-input"
                      type="tel"
                      value={buyerMobile}
                      onChange={(e) => setBuyerMobile(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all min-h-[44px]"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 block mt-1">
                    {isBn
                      ? 'একই মোবাইল নম্বর বা ইমেইল দিয়ে একাধিক কাস্টমার অ্যাকাউন্ট খোলা যাবে।'
                      : 'Multiple customer records are allowed to use the same mobile number or email address.'}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      Email Address <span className="text-[11px] text-neutral-400 font-normal">({isBn ? 'ঐচ্ছিক' : 'Optional'})</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <input
                      id="buyer-email-input"
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* User ID & Customer ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* User ID */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    User ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                    <input
                      id="buyer-username-input"
                      type="text"
                      required
                      value={buyerUsername}
                      onChange={(e) => setBuyerUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder={isBn ? 'যেমন: Mirzabd' : 'e.g. Mirzabd'}
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-semibold outline-hidden transition-all min-h-[44px] ${
                        buyerUsername.trim()
                          ? usernameValidation.isValid
                            ? 'border-emerald-500 ring-1 ring-emerald-500'
                            : 'border-rose-400 ring-1 ring-rose-400'
                          : 'border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="mt-1 min-h-[18px]">
                    {buyerUsername.trim() ? (
                      <p className={`text-[11px] font-semibold flex items-center gap-1 ${
                        usernameValidation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        {usernameValidation.isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{usernameValidation.message}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-neutral-400">
                        {isBn ? 'লগইন করার জন্য আপনার পছন্দের ইউনিক User ID তৈরি করুন।' : 'Unique login ID for this customer.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer ID Badge */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Customer ID <span className="text-[10px] text-neutral-400 font-normal">({isBn ? 'স্বয়ংক্রিয়' : 'Auto-Generated'})</span>
                  </label>
                  <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between min-h-[44px]">
                    <div>
                      <span className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300 block">
                        {previewCustomerId}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {isBn ? 'মোবাইল নম্বর থেকে আলাদা' : 'Distinct from mobile'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-md">
                      Read-only
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Section with Selectable Modes */}
              <div className="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-700/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                      Password Mode <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-neutral-400 block">
                      {passwordMode === 'normal'
                        ? 'Normal Password (e.g. 123456, numeric password allowed)'
                        : 'Strong Password (uppercase, lowercase, numbers & special characters)'}
                    </span>
                  </div>

                  {/* Mode Selector Buttons */}
                  <div className="flex bg-neutral-200 dark:bg-neutral-750 p-0.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPasswordMode('normal')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        passwordMode === 'normal'
                          ? 'bg-white dark:bg-neutral-900 text-emerald-600 shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      Normal Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordMode('strong')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        passwordMode === 'strong'
                          ? 'bg-white dark:bg-neutral-900 text-emerald-600 shadow-2xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      Strong Password
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      3. Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="buyer-password-input"
                        type={showBuyerPassword ? 'text' : 'password'}
                        required
                        value={buyerPassword}
                        onChange={(e) => setBuyerPassword(e.target.value)}
                        placeholder={passwordMode === 'normal' ? '123456' : 'Apon Bazar@2026'}
                        className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBuyerPassword(!showBuyerPassword)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                      >
                        {showBuyerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      4. Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="buyer-confirm-password-input"
                        type={showBuyerConfirmPassword ? 'text' : 'password'}
                        required
                        value={buyerConfirmPassword}
                        onChange={(e) => setBuyerConfirmPassword(e.target.value)}
                        placeholder={passwordMode === 'normal' ? '123456' : 'Apon Bazar@2026'}
                        className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowBuyerConfirmPassword(!showBuyerConfirmPassword)}
                        className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                      >
                        {showBuyerConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Match Status */}
                {buyerPassword && buyerConfirmPassword && (
                  <div className="text-[11px] font-semibold">
                    {buyerPassword === buyerConfirmPassword ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Password does not match.
                      </span>
                    )}
                  </div>
                )}

                {passwordMode === 'strong' && buyerPassword && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
                    <span className={`flex items-center gap-1 ${/[A-Z]/.test(buyerPassword) ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Uppercase
                    </span>
                    <span className={`flex items-center gap-1 ${/[a-z]/.test(buyerPassword) ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Lowercase
                    </span>
                    <span className={`flex items-center gap-1 ${/[0-9]/.test(buyerPassword) ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Number
                    </span>
                    <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(buyerPassword) ? 'text-emerald-600 font-bold' : 'text-neutral-400'}`}>
                      <CheckCircle2 className="w-3 h-3" /> Special Char
                    </span>
                  </div>
                )}
              </div>

              {/* FIELD 7: Refer ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    {isBn ? '৭. Refer ID' : '7. Refer ID'}
                  </label>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    ({isBn ? 'ঐচ্ছিক' : 'Optional'})
                  </span>
                </div>
                <div className="relative">
                  <Tag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    id="buyer-referral-input"
                    type="text"
                    value={buyerReferralId}
                    onChange={(e) => setBuyerReferralId(e.target.value.toUpperCase())}
                    placeholder={isBn ? 'যেমন: TMK000001 (ঐচ্ছিক)' : 'e.g. TMK000001 (Optional)'}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-hidden uppercase transition-all min-h-[44px] font-mono font-medium ${
                      buyerReferralId.trim()
                        ? referValidation.isValid
                          ? 'border-emerald-500 ring-1 ring-emerald-500'
                          : 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                <div className="mt-1 min-h-[18px]">
                  {buyerReferralId.trim() ? (
                    referValidation.isValid ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isBn ? 'বৈধ স্পন্সর:' : 'Verified Sponsor:'} {referValidation.sponsor?.fullName} ({referValidation.sponsor?.id})
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isBn ? 'অবৈধ রেফার আইডি! সঠিক আইডি প্রদান করুন।' : 'Invalid Refer ID! Please check again.'}</span>
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{isBn ? 'ফাঁকা রাখলে কোম্পানি মাস্টার আইডি স্পন্সর হবে।' : 'Defaults to Company Master ID if blank.'}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* FIELD 8: Position */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    {isBn ? '৮. Position' : '8. Position'} <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-neutral-400">
                    {isBn ? '(বাম শাখা / ডান শাখা)' : '(Left Leg / Right Leg)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={lockPlacement}
                    onClick={() => setBuyerPlacementPosition('left')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      buyerPlacementPosition === 'left'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বাম লেগ (LEFT Leg)' : 'LEFT Leg'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={lockPlacement}
                    onClick={() => setBuyerPlacementPosition('right')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${
                      buyerPlacementPosition === 'right'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ডান লেগ (RIGHT Leg)' : 'RIGHT Leg'}</span>
                  </button>
                </div>
              </div>

              {/* FIELD 9: Placement ID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    {isBn ? '৯. Placement ID' : '9. Placement ID'}
                  </label>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    ({isBn ? 'ঐচ্ছিক / ট্রি থেকে নির্বাচিত' : 'Optional / Selected from tree'})
                  </span>
                </div>
                <div className="relative">
                  <GitBranch className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    id="buyer-placement-input"
                    type="text"
                    disabled={lockPlacement}
                    value={buyerPlacementId}
                    onChange={(e) => setBuyerPlacementId(e.target.value.toUpperCase())}
                    placeholder={isBn ? 'যেমন: TMK000002 (ঐচ্ছিক)' : 'e.g. TMK000002 (Optional)'}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white outline-hidden uppercase transition-all min-h-[44px] font-mono font-medium disabled:opacity-75 disabled:bg-neutral-100 dark:disabled:bg-neutral-800/60 ${
                      buyerPlacementId.trim()
                        ? placementValidation.isValid
                          ? 'border-emerald-500 ring-1 ring-emerald-500'
                          : 'border-rose-400 ring-1 ring-rose-400'
                        : 'border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
                <div className="mt-1 min-h-[18px]">
                  {buyerPlacementId.trim() ? (
                    placementValidation.isValid ? (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isBn ? 'বৈধ আপলাইন:' : 'Verified Upline:'} {placementValidation.placementParent?.fullName} ({placementValidation.placementParent?.id})
                        </span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{isBn ? 'অবৈধ প্লেসমেন্ট আইডি! সঠিক আইডি প্রদান করুন।' : 'Invalid Placement ID! Please check again.'}</span>
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{isBn ? 'ফাঁকা রাখলে সিস্টেম নিয়মানুযায়ী প্লেস করবে।' : 'Auto-assigned by hierarchy rule if blank.'}</span>
                    </p>
                  )}
                </div>

                {/* Locked Placement Notice */}
                {lockPlacement && (
                  <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-semibold">
                    <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{isBn ? 'বাইনারি ট্রি থেকে প্লেসমেন্ট নোড ও পজিশন নির্দিষ্ট করে লক করা হয়েছে।' : 'Placement position locked from binary tree.'}</span>
                  </div>
                )}

                {/* Real-time Occupied Slot Warning */}
                {isSelectedSlotOccupied && (
                  <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p>
                        This placement position ({buyerPlacementPosition === 'left' ? 'Left' : 'Right'}) under [{buyerPlacementId}] is already occupied. Please select another position or ID.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* FIELD 10: Address */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? '১০. Address' : '10. Address'}</span> <span className="text-rose-500">*</span>
                </div>

                {/* Division, District, Upazila */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'বিভাগ (Division)' : 'Division'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="buyer-division-select"
                      value={buyerDivision}
                      onChange={(e) => handleBuyerDivisionChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                    >
                      {BD_DIVISIONS.map((div) => (
                        <option key={div.nameEn} value={div.nameBn}>
                          {isBn ? div.nameBn : div.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'জেলা (District)' : 'District'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="buyer-district-select"
                      value={buyerDistrict}
                      onChange={(e) => handleBuyerDistrictChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                    >
                      {buyerDistrictList.map((d) => (
                        <option key={d.nameEn} value={d.nameBn}>
                          {isBn ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'উপজেলা / থানা (Upazila)' : 'Upazila'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="buyer-upazila-select"
                      value={buyerUpazila}
                      onChange={(e) => handleBuyerUpazilaChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                    >
                      {buyerUpazilaList.map((u) => (
                        <option key={u.nameEn} value={u.nameBn}>
                          {isBn ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Union/Municipality & Village/Para */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'ইউনিয়ন / পৌরসভা (Union/Municipality)' : 'Union / Area'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="buyer-union-select"
                      value={buyerUnion}
                      onChange={(e) => setBuyerUnion(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                    >
                      {buyerUnionList.map((uni) => (
                        <option key={uni.nameEn} value={uni.nameBn}>
                          {isBn ? uni.nameBn : uni.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'গ্রাম / মহল্লা / পাড়া (Village/Street)' : 'Village / Street / Para'}
                    </label>
                    <input
                      id="buyer-village-input"
                      type="text"
                      value={buyerVillage}
                      onChange={(e) => setBuyerVillage(e.target.value)}
                      placeholder={isBn ? 'যেমন: সোবহানবাগ, ধানমন্ডি' : 'e.g. Sobhanbagh'}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* System Placement Resolution & Priority Status Card */}
              <div className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                buyerPlacementCalc.error || isSelectedSlotOccupied
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                  : 'bg-neutral-50/80 dark:bg-neutral-850/80 border-neutral-200 dark:border-neutral-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {isBn ? 'সিস্টেম নেটওয়ার্ক প্লেসমেন্ট রেজোলিউশন' : 'System Placement Resolution'}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                    buyerPlacementCalc.error || isSelectedSlotOccupied
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : buyerPlacementCalc.appliedRule === 'custom_both'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : buyerPlacementCalc.appliedRule === 'sponsor_only'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                  }`}>
                    {buyerPlacementCalc.appliedRule === 'custom_both'
                      ? (isBn ? 'Priority 1: কাস্টম উভয় আইডি' : 'Priority 1: Both IDs')
                      : buyerPlacementCalc.appliedRule === 'sponsor_only'
                      ? (isBn ? 'Priority 2: রেফার অনুযায়ী প্লেস' : 'Priority 2: Refer Auto-place')
                      : buyerPlacementCalc.appliedRule === 'company_fallback'
                      ? (isBn ? 'Priority 3: কোম্পানি মাস্টার ফলব্যাক' : 'Priority 3: Master Fallback')
                      : (isBn ? 'Priority 4: ত্রুটি' : 'Priority 4: Error')}
                  </span>
                </div>

                {buyerPlacementCalc.error ? (
                  <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{buyerPlacementCalc.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
                        <span className="block text-[10px] text-neutral-400 uppercase font-semibold">
                          {isBn ? 'নির্ধারিত স্পন্সর (Sponsor)' : 'Assigned Sponsor'}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white text-xs">
                          {buyerPlacementCalc.sponsorName}{' '}
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            ({buyerPlacementCalc.sponsorId})
                          </span>
                        </span>
                      </div>

                      <div className="p-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
                        <span className="block text-[10px] text-neutral-400 uppercase font-semibold">
                          {isBn ? 'আপলাইন প্লেসমেন্ট (Placement Upline)' : 'Placement Upline'}
                        </span>
                        <span className="font-bold text-neutral-900 dark:text-white text-xs">
                          {buyerPlacementCalc.placementName}{' '}
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            ({buyerPlacementCalc.placementId})
                          </span>
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md font-sans">
                            {buyerPlacementCalc.placementLeg === 'left' ? (isBn ? 'বাম লেগ' : 'Left') : (isBn ? 'ডান লেগ' : 'Right')}
                          </span>
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-normal">
                      {buyerPlacementCalc.positionText}
                    </p>
                  </>
                )}
              </div>

              {/* Cloudflare Turnstile / Security Verification */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-750 flex items-center justify-between gap-3">
                <button
                  type="button"
                  id="cloudflare-turnstile-button"
                  onClick={handleTurnstileClick}
                  className="flex items-center gap-3 cursor-pointer select-none text-left bg-transparent border-0 p-0"
                >
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                    turnstileVerified
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : turnstileChecking
                      ? 'bg-neutral-100 dark:bg-neutral-800 border-neutral-400'
                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:border-emerald-500'
                  }`}>
                    {turnstileVerified ? (
                      <Check className="w-4 h-4" />
                    ) : turnstileChecking ? (
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : null}
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
                      {turnstileVerified
                        ? (isBn ? 'যাচাই সফল হয়েছে' : 'Verification successful')
                        : turnstileChecking
                        ? (isBn ? 'যাচাই করা হচ্ছে...' : 'Verifying...')
                        : (isBn ? 'নিরাপত্তা যাচাই (ক্লিক করুন)' : 'Verify you are human')}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Cloudflare Turnstile • Security Verification
                    </span>
                  </div>
                </button>

                {/* Cloudflare Brand Mark */}
                <div className="flex flex-col items-end text-[9px] text-neutral-400 shrink-0">
                  <div className="flex items-center gap-1 font-semibold text-neutral-500 dark:text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cloudflare</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Privacy</span>
                    <span>•</span>
                    <span>Terms</span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="agree-terms-checkbox"
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded-sm text-emerald-600 border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="agree-terms-checkbox" className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                  {isBn ? 'আমি শর্তাবলীর সাথে একমত ' : 'I agree to the '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline"
                  >
                    Terms & Conditions
                  </button>
                </label>
              </div>

              {/* Primary Button: Create Account */}
              <div className="pt-1">
                <button
                  id="btn-buyer-register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{isBn ? 'রেজিস্ট্রেশন সম্পন্ন হচ্ছে...' : 'Creating Account...'}</span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>

              {/* or Divider */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
                <span className="shrink-0 mx-3 text-xs text-neutral-400 font-medium lowercase">or</span>
                <div className="grow border-t border-neutral-200 dark:border-neutral-800"></div>
              </div>

              {/* Social Notice */}
              {socialNotice && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium">
                  {socialNotice}
                </div>
              )}

              {/* Social Login Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  id="continue-with-google-btn"
                  onClick={() => setSocialNotice('Google sign-in is currently running in preview mode. Please complete account creation using the registration form above.')}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  type="button"
                  id="continue-with-facebook-btn"
                  onClick={() => setSocialNotice('Facebook sign-in is currently running in preview mode. Please complete account creation using the registration form above.')}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Continue with Facebook</span>
                </button>
              </div>

              {/* Bottom Links: Already have an account? Log in and Forgot password? */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => onSwitchToLogin ? onSwitchToLogin() : undefined}
                    className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:underline cursor-pointer font-medium"
                >
                  Forgot password?
                </button>
              </div>

            </form>
          )}

          {/* ================================================================
              VIEW 3: SELLER REGISTRATION FORM
              ================================================================ */}
          {currentView === 'seller_form' && (
            <form onSubmit={handleSellerSubmit} className="space-y-5">
              
              {/* Form Title */}
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-amber-900 dark:text-amber-200">
                      {isBn ? 'Seller / ডিলার বা মার্চেন্ট রেজিস্ট্রেশন' : 'Seller / Dealer Registration'}
                    </h3>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      {isBn ? 'আপনার দোকান বা ব্যবসার বিবরণ দিয়ে মার্চেন্ট অ্যাকাউন্ট খুলুন' : 'Open your seller account with zero onboarding fee'}
                    </p>

                    {/* Attractive CTA Email Us Button Below Text */}
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      <a
                        id="seller-dealer-email-us-btn"
                        href={`mailto:${sellerContactEmail}?subject=${encodeURIComponent(
                          isBn ? 'সেলার / ডিলার রেজিস্ট্রেশন সংক্রান্ত জিজ্ঞাসা - Apon Bazar' : 'Seller / Dealer Registration Inquiry - Apon Bazar'
                        )}&body=${encodeURIComponent(
                          isBn
                            ? `সম্মানিত Apon Bazar টিম,\n\nআমি Apon Bazar-তে সেলার / ডিলার হিসেবে যুক্ত হতে আগ্রহী।\n\nদোকান / প্রতিষ্ঠানের নাম:\nস্বত্বাধিকারীর নাম:\nমোবাইল নম্বর:\nঠিকানা (জেলা/উপজেলা):\nপণ্য ক্যাটাগরি:\n\nধন্যবাদ।`
                            : `Dear Apon Bazar Team,\n\nI am interested in registering as a Seller / Dealer on Apon Bazar.\n\nShop/Business Name:\nOwner Name:\nMobile Number:\nLocation (District/Upazila):\nProduct Category:\n\nThank you.`
                        )}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#198754] hover:bg-[#157347] active:bg-[#115c38] active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-700/25 transition-all cursor-pointer whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-[#198754] focus:ring-offset-2"
                        title={`Email: ${sellerContactEmail}`}
                      >
                        <Mail className="w-4 h-4 text-white shrink-0" />
                        <span>{isBn ? '📧 Email Us (আমাদের ইমেইল করুন)' : '📧 Email Us'}</span>
                      </a>
                      <span className="text-[11px] text-amber-900/70 dark:text-amber-300/70 font-mono font-medium">
                        ({sellerContactEmail})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* SECTION 1: BUSINESS & OWNER INFORMATION */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBn ? '১. ব্যবসা ও স্বত্বাধিকারীর তথ্য (Business & Owner Info)' : '1. Business Info'}</span>
                </div>

                {/* Shop Name & Owner Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'দোকান / ব্যবসার নাম (Shop Name)' : 'Shop/Business Name'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-shopname-input"
                        type="text"
                        required
                        value={sellerShopName}
                        onChange={(e) => setSellerShopName(e.target.value)}
                        placeholder={isBn ? 'যেমন: ভাই ভাই এন্টারপ্রাইজ' : 'e.g. Green Agro Traders'}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'স্বত্বাধিকারীর নাম (Owner Name)' : 'Owner Full Name'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-ownername-input"
                        type="text"
                        required
                        value={sellerOwnerName}
                        onChange={(e) => setSellerOwnerName(e.target.value)}
                        placeholder={isBn ? 'যেমন: হাজী রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Number & Email Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'মোবাইল নম্বর (Mobile Number)' : 'Mobile Number'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-mobile-input"
                        type="tel"
                        required
                        value={sellerMobile}
                        onChange={(e) => setSellerMobile(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'ইমেইল এড্রেস (Email Address)' : 'Email Address'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-email-input"
                        type="email"
                        required
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Trade License (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'পণ্যের ক্যাটাগরি (Business Category)' : 'Business Category'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="seller-category-select"
                      value={sellerCategory}
                      onChange={(e) => setSellerCategory(e.target.value)}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    >
                      <option value="মুদি ও খাদ্য সামগ্রী (Grocery & Foods)">{isBn ? 'মুদি ও খাদ্য সামগ্রী (Grocery & Foods)' : 'Grocery & Food Items'}</option>
                      <option value="কৃষি পণ্য ও ফলমূল (Agro & Fruits)">{isBn ? 'কৃষি পণ্য ও ফলমূল (Agro & Fruits)' : 'Agro & Farm Produce'}</option>
                      <option value="খাঁটি মধু, ঘি ও তেল (Honey, Ghee & Oils)">{isBn ? 'খাঁটি মধু, ঘি ও তেল (Honey, Ghee & Oils)' : 'Pure Honey, Ghee & Organic Oils'}</option>
                      <option value="হস্তশিল্প ও কুটির শিল্প (Handicrafts)">{isBn ? 'হস্তশিল্প ও কুটির শিল্প (Handicrafts)' : 'Handicrafts & Village Crafts'}</option>
                      <option value="ইলেকট্রনিক্স ও গ্যাজেট (Electronics)">{isBn ? 'ইলেকট্রনিক্স ও গ্যাজেট (Electronics)' : 'Electronics & Home Appliances'}</option>
                      <option value="জেনারেল মার্চেন্ট ও ডিলার (General Merchant)">{isBn ? 'জেনারেল মার্চেন্ট ও ডিলার (General Merchant)' : 'General Merchant & Distributor'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'ট্রেড লাইসেন্স / এনআইডি নম্বর (Trade License / NID)' : 'Trade License / NID'} <span className="text-neutral-400 font-normal">({isBn ? 'ঐচ্ছিক' : 'Optional'})</span>
                    </label>
                    <input
                      id="seller-license-input"
                      type="text"
                      value={sellerTradeLicense}
                      onChange={(e) => setSellerTradeLicense(e.target.value)}
                      placeholder={isBn ? 'ট্রেড লাইসেন্স বা জাতীয় পরিচয়পত্র নং' : 'Trade License or NID Number'}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'পাসওয়ার্ড (Password)' : 'Password'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-password-input"
                        type={showSellerPassword ? 'text' : 'password'}
                        required
                        value={sellerPassword}
                        onChange={(e) => setSellerPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSellerPassword(!showSellerPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                      >
                        {showSellerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'রি-পাসওয়ার্ড (Re-Password)' : 'Re-Password'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                      <input
                        id="seller-confirm-password-input"
                        type={showSellerConfirmPassword ? 'text' : 'password'}
                        required
                        value={sellerConfirmPassword}
                        onChange={(e) => setSellerConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSellerConfirmPassword(!showSellerConfirmPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                      >
                        {showSellerConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* SECTION 2: SHOP ADDRESS */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 pb-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isBn ? '২. দোকান বা ব্যবসার ঠিকানা (Shop Address)' : '2. Shop Address'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'বিভাগ (Division)' : 'Division'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="seller-division-select"
                      value={sellerDivision}
                      onChange={(e) => handleSellerDivisionChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    >
                      {BD_DIVISIONS.map((div) => (
                        <option key={div.nameEn} value={div.nameBn}>
                          {isBn ? div.nameBn : div.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'জেলা (District)' : 'District'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="seller-district-select"
                      value={sellerDistrict}
                      onChange={(e) => handleSellerDistrictChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    >
                      {sellerDistrictList.map((d) => (
                        <option key={d.nameEn} value={d.nameBn}>
                          {isBn ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'উপজেলা / থানা (Upazila)' : 'Upazila'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="seller-upazila-select"
                      value={sellerUpazila}
                      onChange={(e) => handleSellerUpazilaChange(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    >
                      {sellerUpazilaList.map((u) => (
                        <option key={u.nameEn} value={u.nameBn}>
                          {isBn ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'ইউনিয়ন / পৌরসভা (Union/Municipality)' : 'Union / Area'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="seller-union-select"
                      value={sellerUnion}
                      onChange={(e) => setSellerUnion(e.target.value)}
                      className="w-full py-2 px-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    >
                      {sellerUnionList.map((uni) => (
                        <option key={uni.nameEn} value={uni.nameBn}>
                          {isBn ? uni.nameBn : uni.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'দোকান নং / মার্কেট / সড়ক (Shop No/Market)' : 'Shop No / Market / Road'}
                    </label>
                    <input
                      id="seller-address-input"
                      type="text"
                      value={sellerShopAddress}
                      onChange={(e) => setSellerShopAddress(e.target.value)}
                      placeholder={isBn ? 'যেমন: দোকান ১২, সেন্ট্রাল মার্কেট' : 'e.g. Shop 12, Central Market'}
                      className="w-full py-2 px-3 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-hidden transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-seller-register-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>{isBn ? 'মার্চেন্ট নিবন্ধন সম্পন্ন হচ্ছে...' : 'Processing Registration...'}</span>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>{isBn ? 'Seller / মার্চেন্ট রেজিস্ট্রেশন সম্পন্ন করুন' : 'Complete Seller Registration'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* ================================================================
              VIEW 4: BUYER CONFIRMATION SCREEN
              ================================================================ */}
          {currentView === 'buyer_confirmation' && buyerRegisteredSummary && (
            <div className="py-2 space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-4 border-emerald-200 dark:border-emerald-800 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  {isBn ? 'কাস্টমার রেজিস্ট্রেশন সফল হয়েছে!' : 'Buyer Registration Completed!'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {isBn
                    ? 'আপনার কাস্টমার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে এবং স্বয়ংক্রিয়ভাবে লগইন হয়েছে।'
                    : 'Your account is ready and you are automatically logged in.'}
                </p>
              </div>

              {/* Customer ID & User ID Highlight Boxes */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border-2 border-emerald-200 dark:border-emerald-800 text-left space-y-3.5">
                
                {/* 1. Customer ID Card (Permanent System Generated) */}
                <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      {isBn ? 'স্বয়ংক্রিয় কাস্টমার আইডি (Customer ID)' : 'Auto Customer ID (Non-editable)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(buyerRegisteredSummary.customerId, 'customerId')}
                      className="flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 bg-emerald-50 dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedField === 'customerId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'customerId' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি করুন' : 'Copy')}</span>
                    </button>
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-700 dark:text-emerald-300">
                    {buyerRegisteredSummary.customerId}
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    {isBn ? 'সিস্টেম কর্তৃক স্থায়ী ও ইউনিকভাবে বরাদ্দকৃত।' : 'Permanently & uniquely assigned by system.'}
                  </span>
                </div>

                {/* 2. User ID Card (Login Username) */}
                <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {isBn ? 'লগইন ইউজার আইডি (User ID / Username)' : 'Login User ID (Username)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(buyerRegisteredSummary.username, 'username')}
                      className="flex items-center gap-1 text-[11px] font-black text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 bg-emerald-50 dark:bg-neutral-800 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedField === 'username' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'username' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি করুন' : 'Copy')}</span>
                    </button>
                  </div>
                  <div className="text-lg sm:text-xl font-black font-mono tracking-wide text-neutral-900 dark:text-white">
                    {buyerRegisteredSummary.username}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'নিবন্ধিত নাম:' : 'Full Name:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{buyerRegisteredSummary.fullName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'মোবাইল নম্বর:' : 'Mobile:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{buyerRegisteredSummary.mobile}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'স্পন্সর আইডি:' : 'Sponsor ID:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">{buyerRegisteredSummary.sponsorId}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'প্লেসমেন্ট আইডি ও শাখা:' : 'Placement & Leg:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">{buyerRegisteredSummary.placementId} ({buyerRegisteredSummary.placementLeg.toUpperCase()})</span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-xl border border-neutral-200 dark:border-neutral-800 text-left text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {isBn
                    ? 'পরবর্তীতে লগইন করতে আপনার এই ইউজার আইডি (অথবা কাস্টমার আইডি) এবং আপনার দেওয়া পাসওয়ার্ড ব্যবহার করুন।'
                    : 'You can sign in later using your User ID (or Customer ID) and your chosen password.'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isBn ? 'ড্যাশবোর্ড / কেনাকাটা' : 'Go to Dashboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin(buyerRegisteredSummary.username);
                  }}
                  className="w-full py-3 px-4 rounded-xl border-2 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-black text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isBn ? 'লগইন পেজে যান' : 'Go to Login'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              VIEW 5: SELLER CONFIRMATION SCREEN
              ================================================================ */}
          {currentView === 'seller_confirmation' && sellerRegisteredSummary && (
            <div className="py-2 space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border-4 border-amber-200 dark:border-amber-800 shadow-md">
                <Store className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  {isBn ? 'সেলার মার্চেন্ট রেজিস্ট্রেশন সফল হয়েছে!' : 'Seller Registration Completed!'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {isBn
                    ? 'আপনার মার্চেন্ট ড্যাশবোর্ড প্রস্তুত। ০% লিস্টিং ফিতে পণ্য বিক্রি শুরু করুন।'
                    : 'Your merchant portal is ready. You can now list and sell products.'}
                </p>
              </div>

              {/* Dealer ID Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/60 dark:to-orange-950/60 border-2 border-amber-200 dark:border-amber-800 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {isBn ? 'আপনার স্থায়ী ডিলার / মার্চেন্ট আইডি:' : 'Permanent Dealer ID:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(sellerRegisteredSummary.dealerId, 'dealerId')}
                    className="flex items-center gap-1 text-xs font-black text-amber-700 dark:text-amber-300 hover:text-amber-900 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedField === 'dealerId' ? <Check className="w-3.5 h-3.5 text-amber-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'dealerId' ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>

                <div className="text-2xl font-black font-mono tracking-wider text-amber-700 dark:text-amber-300 bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800/80 text-center">
                  {sellerRegisteredSummary.dealerId}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'দোকানের নাম:' : 'Shop Name:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{sellerRegisteredSummary.shopName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'স্বত্বাধিকারী:' : 'Owner:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white">{sellerRegisteredSummary.ownerName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'মোবাইল নম্বর:' : 'Mobile Number:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white font-mono">{sellerRegisteredSummary.mobile}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'ইমেইল এড্রেস:' : 'Email Address:'}</span>
                    <span className="font-bold text-neutral-900 dark:text-white truncate block text-[11px] sm:text-xs" title={sellerRegisteredSummary.email}>{sellerRegisteredSummary.email}</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-amber-200/60 dark:border-amber-800/60 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{sellerRegisteredSummary.category}</span>
                </div>
              </div>

              {/* Action Button to Open Seller Dashboard */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (typeof window !== 'undefined') {
                      window.history.pushState({}, '', '/vendor/dashboard');
                      window.dispatchEvent(new Event('popstate'));
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>{isBn ? 'সেলার / মার্চেন্ট ড্যাশবোর্ডে প্রবেশ করুন' : 'Go to Seller Dashboard'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Terms & Conditions Modal Overlay */}
          {showTermsModal && (
            <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Terms & Conditions</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-2 max-h-60 overflow-y-auto pr-1">
                  <p>
                    <strong>1. Account Creation:</strong> By creating an account at Apon Bazar/Apon Bazar, you agree to provide authentic and accurate personal details. Multiple customer accounts are permitted per phone number, provided unique User IDs are utilized.
                  </p>
                  <p>
                    <strong>2. Security & Passwords:</strong> You can select either Normal Password or Strong Password. You are responsible for safeguarding your login credentials.
                  </p>
                  <p>
                    <strong>3. Orders & Delivery:</strong> Detailed delivery location and preferences will be collected during order checkout.
                  </p>
                  <p>
                    <strong>4. Network & Binary Placement:</strong> Buyer accounts are assigned a unique Customer ID and placed in the network structure according to system placement rules.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAgreeTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  I Understand & Agree
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Modal Overlay */}
          {showForgotPasswordModal && (
            <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="font-bold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-emerald-600" />
                    <span>Reset Password</span>
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
                      If an account exists for <span className="font-bold font-mono">{forgotPasswordInput}</span>, password reset instructions have been sent.
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
                      Back to Registration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Enter your registered Mobile Number, Email, or User ID to receive password recovery instructions.
                    </p>
                    <input
                      type="text"
                      value={forgotPasswordInput}
                      onChange={(e) => setForgotPasswordInput(e.target.value)}
                      placeholder="Mobile, Email, or User ID"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                    <button
                      type="button"
                      disabled={!forgotPasswordInput.trim()}
                      onClick={() => setForgotPasswordSent(true)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      Send Reset Link / Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
