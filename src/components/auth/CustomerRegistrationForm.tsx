/**
 * Single Shared 10-Field Customer Registration & Authentication Component
 * Used across Checkout, Customer Dashboard, and Binary Network Tree Slot Registration.
 *
 * 10-Field Atomic Registration Specification:
 * 1. Referral ID (auto-BFS lookup -> populates Placement ID & Position)
 * 2. Placement ID (Read-Only, auto-BFS or locked Blank Slot parent)
 * 3. Placement Position LEFT/RIGHT (Read-Only, auto-BFS or locked Blank Slot leg)
 * 4. Full Name
 * 5. Mobile Number (01XXXXXXXXX)
 * 6. Email Address (Required — confirmation email dispatched on commit)
 * 7. Address (Required)
 * 8. NID / Identity Verification (Required, min 10 digits)
 * 9. Password (min 6 chars)
 * 10. Confirm Password
 *
 * Atomic ID Rule: AB-10000000XX Customer IDs are NEVER generated or burned before commit.
 * Project: APON BAZAR (আপন বাজার)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { useNotifications } from '../../context/NotificationContext';
import { RegistrationSource } from '../../services/CustomerRegistrationService';
import { AIPlacementRecommendation } from '../../services/SlotReservationService';
import { COMPANY_MASTER_ROOT_ID, EmailDeliveryRecord } from '../../types/networkMarketing';
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
  MapPin,
  X,
  UserPlus,
  LogIn,
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Send,
  Search
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
    email?: string;
    sponsorId: string;
    placementId: string;
    placementLeg: 'left' | 'right';
    placementMethod?: 'MANUAL' | 'AUTO_BFS';
    targetSlotId?: string;
    registrationDate?: string;
    emailStatus?: EmailDeliveryRecord['status'];
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
    isLoggedIn
  } = useAuth();
  const {
    currentMember,
    ownCompanyMemberId,
    previewPlacementByReferral,
    validateReferralOnServer,
    inspectPlacementParentOnServer,
    registerCustomerWithServer,
    refreshBinaryTreeFromServer,
    reserveSlotDuringRegistration,
    releaseReservedSlot
  } = useNetworkMarketing();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<'signup' | 'login'>(defaultTab);
  const pageTitle = title || 'নতুন কাস্টমার ও নেটওয়ার্ক নিবন্ধন';
  const pageSubtitle =
    subtitle || 'Referral ID ও Manual অথবা Auto BFS Placement নির্বাচন করে নতুন AB- Customer ID তৈরি করুন';

  // Placement Method: MANUAL (when blank slot pre-selected or user picks Manual) vs AUTO_BFS
  const [placementMethod, setPlacementMethod] = useState<'MANUAL' | 'AUTO_BFS'>(
    lockPlacement || Boolean(initialPlacementId) ? 'MANUAL' : 'AUTO_BFS'
  );

  // 10-Field Registration State
  const defaultRef =
    initialReferralId?.trim() ||
    aiRecommendation?.sponsorId ||
    ownCompanyMemberId ||
    currentMember?.id ||
    COMPANY_MASTER_ROOT_ID;

  const [referralId, setReferralId] = useState(defaultRef);
  // Isolated Manual Placement state (NEVER overwritten by Auto BFS lookups)
  const [manualPlacementId, setManualPlacementId] = useState(
    initialPlacementId?.trim() || ''
  );
  const [manualPlacementPosition, setManualPlacementPosition] = useState<'LEFT' | 'RIGHT'>(
    (initialPlacementPosition || 'left').toUpperCase() === 'RIGHT' ? 'RIGHT' : 'LEFT'
  );
  // Isolated Auto BFS preview state (NEVER overwrites Manual Placement state)
  const [autoBfsPreview, setAutoBfsPreview] = useState<{
    found: boolean;
    checking: boolean;
    referralId?: string;
    referralName?: string;
    placementId: string;
    placementName?: string;
    position: 'LEFT' | 'RIGHT';
    blankSlotId?: string;
    message?: string;
  }>({
    found: false,
    checking: false,
    placementId: aiRecommendation?.placementId || '',
    position: (aiRecommendation?.position || 'left').toUpperCase() === 'RIGHT' ? 'RIGHT' : 'LEFT'
  });

  const [referralMeta, setReferralMeta] = useState<{
    found: boolean;
    referralName?: string;
    placementName?: string;
    blankSlotId?: string;
    message?: string;
    checking?: boolean;
  }>({ found: true });

  const [manualPlacementMeta, setManualPlacementMeta] = useState<{
    found: boolean;
    eligible: boolean;
    parentId?: string;
    parentName?: string;
    message?: string;
    checking?: boolean;
    left?: {
      status: 'available' | 'occupied';
      slotId: string;
      occupiedById?: string;
      occupiedByName?: string;
    };
    right?: {
      status: 'available' | 'occupied';
      slotId: string;
      occupiedById?: string;
      occupiedByName?: string;
    };
  }>({ found: false, eligible: false });

  const [placementCandidates, setPlacementCandidates] = useState<
    Array<{
      id: string;
      fullName: string;
      leftAvailable: boolean;
      rightAvailable: boolean;
      eligible: boolean;
    }>
  >([]);
  const [showPlacementCandidates, setShowPlacementCandidates] = useState(false);

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
  const isPrivilegedSessionRegistration = isLoggedIn && source !== 'checkout';

  const [registrationSuccessSummary, setRegistrationSuccessSummary] = useState<{
    customerId: string;
    binaryCompanyId?: string;
    newLeftBlankId?: string;
    newRightBlankId?: string;
    username: string;
    fullName: string;
    mobile: string;
    email?: string;
    sponsorId: string;
    placementId: string;
    placementLeg: 'left' | 'right';
    placementMethod?: 'MANUAL' | 'AUTO_BFS';
    targetSlotId?: string;
    registrationDate?: string;
    emailStatus?: EmailDeliveryRecord['status'];
    registrationSource: RegistrationSource;
    fullServiceAddress: string;
  } | null>(null);

  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordInput, setForgotPasswordInput] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const activePlacementId =
    placementMethod === 'MANUAL' ? manualPlacementId : autoBfsPreview.placementId;
  const activePlacementPosition: 'LEFT' | 'RIGHT' =
    placementMethod === 'MANUAL' ? manualPlacementPosition : autoBfsPreview.position;

  const effectiveSlotId = useMemo(() => {
    if (placementMethod === 'MANUAL') {
      if (manualPlacementPosition === 'LEFT' && manualPlacementMeta.left?.slotId) {
        return manualPlacementMeta.left.slotId;
      }
      if (manualPlacementPosition === 'RIGHT' && manualPlacementMeta.right?.slotId) {
        return manualPlacementMeta.right.slotId;
      }
      if (
        reservedCompanyId &&
        (!initialPlacementId || manualPlacementId.trim().toUpperCase() === initialPlacementId.trim().toUpperCase())
      ) {
        return reservedCompanyId;
      }
      if (manualPlacementId.trim()) {
        return `SLOT-${manualPlacementId.trim().toUpperCase()}-${manualPlacementPosition}`;
      }
      return undefined;
    }
    return autoBfsPreview.blankSlotId;
  }, [
    placementMethod,
    manualPlacementPosition,
    manualPlacementId,
    manualPlacementMeta.left?.slotId,
    manualPlacementMeta.right?.slotId,
    reservedCompanyId,
    initialPlacementId,
    autoBfsPreview.blankSlotId
  ]);

  // Synchronize pre-filled slot props when opened from Binary Tree empty slot or URL
  useEffect(() => {
    if (initialReferralId) setReferralId(initialReferralId.trim());
    if (initialPlacementId) {
      setManualPlacementId(initialPlacementId.trim());
      setPlacementMethod('MANUAL');
    }
    if (initialPlacementPosition) {
      setManualPlacementPosition(initialPlacementPosition.toLowerCase() === 'right' ? 'RIGHT' : 'LEFT');
    }
  }, [initialReferralId, initialPlacementId, initialPlacementPosition]);

  // Helper to explicitly validate Referral ID and refresh Auto BFS preview WITHOUT mutating Manual state
  const runReferralValidationAndPreview = async (targetRef: string) => {
    const cleanRef = targetRef.trim();
    if (!cleanRef) {
      setReferralMeta({ found: false, checking: false, message: 'Referral ID আবশ্যক।' });
      setAutoBfsPreview((prev) => ({
        ...prev,
        found: false,
        checking: false,
        placementId: '',
        placementName: undefined,
        blankSlotId: undefined,
        message: 'Referral ID আবশ্যক।'
      }));
      return;
    }
    setReferralMeta((prev) => ({ ...prev, checking: true }));
    setAutoBfsPreview((prev) => ({ ...prev, checking: true }));

    // Always validate Referral ID and fetch Auto BFS preview cleanly in parallel/single check
    // so both Referral validation and Auto BFS preview stay accurate without touching Manual values
    const [valRes, bfsRes] = await Promise.all([
      validateReferralOnServer(cleanRef),
      previewPlacementByReferral(cleanRef)
    ]);

    if (valRes.valid) {
      setReferralMeta({
        found: true,
        referralName: valRes.referralName,
        placementName: bfsRes.placementName,
        blankSlotId: bfsRes.blankSlotId,
        message: valRes.message || `বৈধ স্পন্সর: ${valRes.referralName} (${valRes.referralId || cleanRef})`,
        checking: false
      });
      setFormErrors((prev) => ({ ...prev, referralId: '' }));
    } else {
      setReferralMeta({
        found: false,
        message: valRes.message || `Referral ID '${cleanRef}' পাওয়া যায়নি বা নিষ্ক্রিয়।`,
        checking: false
      });
    }

    if (bfsRes.found && bfsRes.placementId && bfsRes.position) {
      setAutoBfsPreview({
        found: true,
        checking: false,
        referralId: bfsRes.referralId || cleanRef,
        referralName: bfsRes.referralName || valRes.referralName,
        placementId: bfsRes.placementId,
        placementName: bfsRes.placementName,
        position: bfsRes.position,
        blankSlotId: bfsRes.blankSlotId,
        message: bfsRes.message
      });
    } else {
      setAutoBfsPreview({
        found: false,
        checking: false,
        referralId: cleanRef,
        referralName: valRes.referralName,
        placementId: '',
        position: 'LEFT',
        blankSlotId: undefined,
        message: bfsRes.message || valRes.message || `Referral ID '${cleanRef}' পাওয়া যায়নি বা নিষ্ক্রিয়।`
      });
    }
  };

  // Helper to inspect Manual Placement Parent & Slot availability (NEVER touches Auto BFS state)
  const runManualPlacementInspection = async (targetParent: string, searchQuery?: string) => {
    const cleanParent = targetParent.trim();
    setManualPlacementMeta((prev) => ({ ...prev, checking: true }));
    const res = await inspectPlacementParentOnServer(cleanParent || undefined, searchQuery);
    setPlacementCandidates(res.candidates || []);

    if (!cleanParent) {
      setManualPlacementMeta({
        found: false,
        eligible: false,
        checking: false,
        message: 'Manual Placement-এর জন্য Placement ID লিখুন বা তালিকা থেকে বাছাই করুন।'
      });
      return;
    }

    if (res.found && res.parentId) {
      setManualPlacementMeta({
        found: true,
        eligible: res.eligible,
        parentId: res.parentId,
        parentName: res.parentName,
        message: res.message,
        checking: false,
        left: res.left,
        right: res.right
      });

      // Auto-adjust ONLY Manual position if current manual position is occupied and the other is available
      setManualPlacementPosition((prevPos) => {
        if (prevPos === 'LEFT' && res.left?.status === 'occupied' && res.right?.status === 'available') {
          return 'RIGHT';
        }
        if (prevPos === 'RIGHT' && res.right?.status === 'occupied' && res.left?.status === 'available') {
          return 'LEFT';
        }
        return prevPos;
      });
      if (res.eligible) {
        setFormErrors((prev) => ({ ...prev, placementId: '' }));
      }
    } else {
      setManualPlacementMeta({
        found: false,
        eligible: false,
        checking: false,
        message: res.message || `Placement ID '${cleanParent}' খুঁজে পাওয়া যায়নি।`
      });
    }
  };

  // Live Referral Validation & Auto-BFS Preview whenever Referral ID changes (isolated from Manual selection)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      await runReferralValidationAndPreview(referralId);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralId]);

  // Live Manual Placement Parent & LEFT/RIGHT availability lookup when in MANUAL mode
  useEffect(() => {
    if (placementMethod !== 'MANUAL') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      await runManualPlacementInspection(manualPlacementId, manualPlacementId);
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualPlacementId, placementMethod]);

  // Temporary slot reservation while modal is open on a binary tree slot
  useEffect(() => {
    const targetParent = (initialPlacementId || manualPlacementId || '').trim();
    const targetLeg: 'left' | 'right' =
      (initialPlacementPosition || manualPlacementPosition).toLowerCase() === 'right' ? 'right' : 'left';

    if (targetParent && (source === 'binary_tree' || source === 'ai_placement')) {
      const resId = reserveSlotDuringRegistration(
        targetParent,
        targetLeg,
        `Pending Registration (${source})`
      );
      setActiveReservationId(resId);
    }

    return () => {
      if (targetParent) {
        releaseReservedSlot(targetParent, targetLeg);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancelAndClose = () => {
    if (activeReservationId && manualPlacementId) {
      releaseReservedSlot(
        manualPlacementId,
        manualPlacementPosition === 'RIGHT' ? 'right' : 'left'
      );
      setActiveReservationId(null);
    }
    if (onClose) onClose();
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: '', color: 'bg-neutral-200' };
    if (password.length < 6) {
      return { level: 1, text: 'দুর্বল (কমপক্ষে ৬ অক্ষর)', color: 'bg-rose-500' };
    }
    let score = 1;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score >= 3) return { level: 3, text: 'শক্তিশালী', color: 'bg-emerald-500' };
    return { level: 2, text: 'সঠিক', color: 'bg-amber-500' };
  }, [password]);

  const validateAll10Fields = (): boolean => {
    const errs: Record<string, string> = {};
    const cleanRef = referralId.trim();
    const cleanName = fullName.trim();
    const cleanMobile = mobile.trim().replace(/[\s-]/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = address.trim();
    const cleanNid = nidNumber.trim();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanRef) {
      errs.referralId = 'Referral ID আবশ্যক।';
    } else if (!referralMeta.found) {
      errs.referralId = referralMeta.message || 'বৈধ ও সক্রিয় Referral ID প্রদান করুন।';
    }

    if (placementMethod === 'MANUAL') {
      if (!manualPlacementId.trim()) {
        errs.placementId = 'Manual Placement-এর জন্য Placement ID প্রদান করুন।';
      } else if (!manualPlacementMeta.found) {
        errs.placementId = manualPlacementMeta.message || 'বৈধ Placement ID নির্বাচন করুন।';
      } else if (!manualPlacementMeta.eligible) {
        errs.placementId =
          manualPlacementMeta.message || 'এই Placement ID-এর LEFT ও RIGHT উভয় পজিশন ইতিমধ্যে পূর্ণ।';
      } else {
        const chosenSlot =
          manualPlacementPosition === 'LEFT' ? manualPlacementMeta.left : manualPlacementMeta.right;
        if (chosenSlot?.status === 'occupied') {
          errs.placementId = `Placement ID '${manualPlacementId.trim()}'-এর ${manualPlacementPosition} পজিশন ইতিমধ্যে পূর্ণ। খালি পজিশন নির্বাচন করুন।`;
        }
      }
    } else if (!autoBfsPreview.found || !autoBfsPreview.placementId.trim()) {
      errs.placementId = 'বৈধ Referral ID দিয়ে Auto BFS Placement ID নির্ধারণ করুন।';
    }

    if (!cleanName || cleanName.length < 2) {
      errs.fullName = 'সদস্যের পূর্ণ নাম আবশ্যক।';
    }
    if (!/^01[3-9]\d{8}$/.test(cleanMobile)) {
      errs.mobile = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।';
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'সঠিক ইমেইল ঠিকানা (Email Address) আবশ্যক।';
    }
    if (!cleanAddress || cleanAddress.length < 3) {
      errs.address = 'পূর্ণ ডেলিভারি/বাসার ঠিকানা (Address) আবশ্যক।';
    }
    if (!cleanNid || cleanNid.replace(/\D/g, '').length < 10) {
      errs.nidNumber = 'কমপক্ষে ১০ ডিজিটের বৈধ NID / Identity নম্বর দিন।';
    }
    if (!cleanPass || cleanPass.length < 6) {
      errs.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
    }
    if (cleanPass !== cleanConfirm) {
      errs.confirmPassword = 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।';
    }

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError(Object.values(errs)[0]);
      return false;
    }
    return true;
  };

  // Atomic 10-Field Submit Handler (Allocates AB- ID ONLY on server commit)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setGeneralError('');
    setFormErrors({});

    if (!validateAll10Fields()) {
      return;
    }

    setLoading(true);
    try {
      const cleanRef = referralId.trim();
      const cleanName = fullName.trim();
      const cleanMobile = mobile.trim().replace(/[\s-]/g, '');
      const cleanEmail = email.trim().toLowerCase();
      const cleanAddress = address.trim();
      const cleanNid = nidNumber.trim();
      const cleanPass = password.trim();
      const cleanConfirm = confirmPassword.trim();
      const chosenPlacementId = activePlacementId.trim();
      const chosenPlacementPosition = activePlacementPosition;
      const targetLeg: 'left' | 'right' = chosenPlacementPosition === 'RIGHT' ? 'right' : 'left';

      // 1. Atomic Server Registration FIRST — allocates AB-10000000XX ONLY upon validation & commit
      const serverRes = await registerCustomerWithServer({
        referralId: cleanRef,
        fullName: cleanName,
        mobile: cleanMobile,
        email: cleanEmail,
        address: cleanAddress,
        nidNumber: cleanNid,
        password: cleanPass,
        confirmPassword: cleanConfirm,
        registrationSource: source,
        placementMode: placementMethod === 'MANUAL' ? 'manual' : 'auto_bfs',
        placementMethod,
        placementId: chosenPlacementId,
        placementPosition: chosenPlacementPosition,
        slotId: effectiveSlotId
      });

      if (!serverRes.success || !serverRes.customerId) {
        if (serverRes.statusCode === 409) {
          refreshBinaryTreeFromServer();
          if (placementMethod === 'MANUAL') {
            runManualPlacementInspection(manualPlacementId);
          } else {
            runReferralValidationAndPreview(referralId);
          }
        }
        setGeneralError(
          serverRes.message || 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি। অনুগ্রহ করে তথ্য যাচাই করে আবার চেষ্টা করুন।'
        );
        return;
      }

      const assignedAbId = serverRes.customerId;
      const finalPlacementId = serverRes.placementId || chosenPlacementId;
      const finalPosition = (serverRes.placementPosition || chosenPlacementPosition).toUpperCase() === 'RIGHT' ? 'right' : 'left';

      // 2. Sync committed AB- ID into client AuthContext (zero ID burn)
      let newUserId = serverRes.registeredMember?.userId || assignedAbId;
      try {
        const newUser = registerUser({
          fullName: cleanName,
          username: assignedAbId,
          mobileNumber: cleanMobile,
          email: cleanEmail,
          password: cleanPass,
          nationalId: cleanNid,
          role: 'customer',
          fullServiceAddress: cleanAddress,
          sponsorId: serverRes.referralId || cleanRef,
          referralId: serverRes.referralId || cleanRef,
          placementId: finalPlacementId,
          placementLeg: finalPosition,
          registrationSource: source,
          preserveCurrentSession: isPrivilegedSessionRegistration,
          preAssignedCustomerId: assignedAbId,
          internalId: serverRes.registeredMember?.internalId,
          registrationStatus: 'completed',
          emailStatus: serverRes.emailStatus || 'pending'
        });
        newUserId = newUser.id;
        linkBinaryCompanyId(newUser.id, assignedAbId);
      } catch (authErr) {
        // Non-fatal if client auth cache already synced; rollback only if unhandled
        if (!newUserId) {
          rollbackUserRegistration(newUserId);
          throw authErr;
        }
      }

      if (activeReservationId && finalPlacementId) {
        releaseReservedSlot(finalPlacementId, targetLeg);
        setActiveReservationId(null);
      }

      if (setActiveRole && !isPrivilegedSessionRegistration) {
        setActiveRole('customer');
      }

      if (addNotification) {
        addNotification({
          userId: newUserId,
          title: `রেজিস্ট্রেশন সফল: ${assignedAbId}`,
          message: `স্বাগতম ${cleanName}! আপনার Customer ID: ${assignedAbId} (${finalPlacementId} → ${finalPosition.toUpperCase()})।`,
          channel: 'in_app'
        });
      }

      const summary = {
        customerId: assignedAbId,
        binaryCompanyId: assignedAbId,
        newLeftBlankId: serverRes.newLeftBlankId,
        newRightBlankId: serverRes.newRightBlankId,
        username: assignedAbId,
        fullName: cleanName,
        mobile: cleanMobile,
        email: cleanEmail,
        sponsorId: serverRes.referralId || cleanRef,
        placementId: finalPlacementId,
        placementLeg: finalPosition as 'left' | 'right',
        placementMethod: serverRes.placementMethod || placementMethod,
        targetSlotId: effectiveSlotId,
        registrationDate: serverRes.registrationDate || new Date().toISOString(),
        emailStatus: serverRes.emailStatus || 'pending',
        registrationSource: source,
        fullServiceAddress: cleanAddress
      };

      setRegistrationSuccessSummary(summary);
      if (onSuccess) {
        onSuccess(summary);
      }
    } catch (err: any) {
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
      setLoginError('ইউজার আইডি / Customer ID বা মোবাইল নম্বর আবশ্যক');
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError('পাসওয়ার্ড আবশ্যক');
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
            placementLeg: 'left',
            registrationSource: source,
            fullServiceAddress: ''
          });
        }
        if (onClose) onClose();
      } else {
        setLoginError('ইউজার আইডি বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'লগইন ব্যর্থ হয়েছে।');
    } finally {
      setLoginLoading(false);
    }
  };

  // REGISTRATION CONFIRMATION VIEW (Never displays password)
  if (registrationSuccessSummary) {
    const emailBadge =
      registrationSuccessSummary.emailStatus === 'sent'
        ? {
            cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
            text: 'Confirmation Email Sent'
          }
        : registrationSuccessSummary.emailStatus === 'failed'
        ? {
            cls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
            text: 'Email Failed (Queued for Retry)'
          }
        : {
            cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
            text: 'Email Queued / Pending SMTP'
          };

    return (
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 sm:p-6 max-w-lg mx-auto border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4 text-neutral-900 dark:text-neutral-100 animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="font-black text-xl text-neutral-900 dark:text-white">
            রেজিস্ট্রেশন সফল হয়েছে!
          </h3>
          <p className="text-xs text-neutral-500">
            নতুন Customer ID ও স্বয়ংক্রিয় LEFT/RIGHT Blank Slots তৈরি সম্পন্ন।
          </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl p-4 space-y-2 border border-neutral-200 dark:border-neutral-700 text-xs">
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Assigned Customer ID:</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {registrationSuccessSummary.customerId}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Customer Name:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {registrationSuccessSummary.fullName}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Referral ID:</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {registrationSuccessSummary.sponsorId}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Placement:</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-white">
              {registrationSuccessSummary.placementId} ({registrationSuccessSummary.placementLeg.toUpperCase()})
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Placement Method:</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {registrationSuccessSummary.placementMethod || 'AUTO_BFS'}
            </span>
          </div>
          {registrationSuccessSummary.targetSlotId && (
            <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-neutral-500 font-medium">Target Slot Consumed:</span>
              <span className="font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                {registrationSuccessSummary.targetSlotId}
              </span>
            </div>
          )}
          <div className="flex justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Registration Date:</span>
            <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
              {registrationSuccessSummary.registrationDate
                ? new Date(registrationSuccessSummary.registrationDate).toLocaleString()
                : new Date().toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-neutral-200 dark:border-neutral-700">
            <span className="text-neutral-500 font-medium">Email Status:</span>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold inline-flex items-center gap-1 ${emailBadge.cls}`}>
              <Send className="w-3 h-3" />
              {emailBadge.text}
            </span>
          </div>

          {(registrationSuccessSummary.newLeftBlankId || registrationSuccessSummary.newRightBlankId) && (
            <div className="pt-1.5">
              <span className="text-neutral-500 font-bold block mb-1">
                New Child Empty Slots:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
                  <span className="block text-[9px] font-bold text-neutral-500">LEFT SLOT</span>
                  <span className="font-mono font-bold text-[10px] text-neutral-800 dark:text-neutral-200">
                    {registrationSuccessSummary.newLeftBlankId || '—'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 text-center">
                  <span className="block text-[9px] font-bold text-neutral-500">RIGHT SLOT</span>
                  <span className="font-mono font-bold text-[10px] text-neutral-800 dark:text-neutral-200">
                    {registrationSuccessSummary.newRightBlankId || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{isPrivilegedSessionRegistration ? 'বাইনারি ট্রি-তে ফিরে যান' : 'এগিয়ে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 ${isModal ? 'max-h-[85vh] overflow-y-auto px-1' : ''}`}>
      {/* FORM HEADER */}
      <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" iconOnly={true} className="shrink-0" />
          <div>
            <h2 className="font-black text-lg sm:text-xl text-neutral-900 dark:text-white">
              {pageTitle}
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
            aria-label="Close registration modal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* DYNAMIC SELECTED PRODUCT SUMMARY BANNER */}
      {(pendingProductName || source === 'checkout') && (
        <div className="mt-3 p-3 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">
                নির্বাচিত পণ্য:
              </span>
              <strong className="text-neutral-900 dark:text-white text-xs sm:text-sm font-black">
                {pendingProductName || 'Apon Bazar Order'}
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

      {/* TABS */}
      {showTabs && (
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mt-3.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setGeneralError('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন নিবন্ধন (10-Field)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setGeneralError('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
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

      {/* ERROR MESSAGE */}
      {generalError && (
        <div role="alert" className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{generalError}</span>
        </div>
      )}

      {/* TAB 1: 10-FIELD REGISTRATION FORM */}
      {activeTab === 'signup' && (
        <form onSubmit={handleSignupSubmit} className="mt-3.5 space-y-3 text-xs">
          {/* Fields 1, 2, 3: Editable Referral ID + Placement Method (MANUAL vs AUTO_BFS) + Placement ID & LEFT/RIGHT Selection */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-xs flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>রেফারেল ও বাইনারি প্লেসমেন্ট নির্বাচন</span>
              </span>

              {/* Placement Method Toggle */}
              <div className="inline-flex bg-neutral-200/80 dark:bg-neutral-900 p-0.5 rounded-xl border border-neutral-300/60 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setPlacementMethod('MANUAL')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    placementMethod === 'MANUAL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  1. Manual Placement
                </button>
                <button
                  type="button"
                  onClick={() => setPlacementMethod('AUTO_BFS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    placementMethod === 'AUTO_BFS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  2. Auto BFS Placement
                </button>
              </div>
            </div>

            {/* 1. Always-Editable Referral ID + Search/Validate Button */}
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 text-[11px]">
                1. Referral ID (সর্বদা এডিটেবল) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  aria-label="Referral ID"
                  value={referralId}
                  onChange={(e) => {
                    setReferralId(e.target.value.toUpperCase());
                    if (formErrors.referralId) setFormErrors((prev) => ({ ...prev, referralId: '' }));
                  }}
                  placeholder={COMPANY_MASTER_ROOT_ID}
                  className={`flex-1 px-3 py-2 rounded-xl border font-mono font-bold text-xs bg-white dark:bg-neutral-800 ${
                    formErrors.referralId || (!referralMeta.found && !referralMeta.checking && referralId.trim())
                      ? 'border-rose-500 ring-1 ring-rose-400'
                      : referralMeta.found && referralMeta.referralName
                      ? 'border-emerald-500'
                      : 'border-neutral-300 dark:border-neutral-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => runReferralValidationAndPreview(referralId)}
                  disabled={referralMeta.checking}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{referralMeta.checking ? 'যাচাই...' : 'Search'}</span>
                </button>
              </div>
              {referralMeta.found && referralMeta.referralName ? (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    বৈধ স্পন্সর: {referralMeta.referralName} ({referralId.trim()})
                  </span>
                </div>
              ) : !referralMeta.checking && referralId.trim() && !referralMeta.found ? (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{referralMeta.message || 'অবৈধ বা নিষ্ক্রিয় Referral ID'}</span>
                </div>
              ) : null}
              {formErrors.referralId && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.referralId}</span>
              )}
            </div>

            {/* 2 & 3: MANUAL vs AUTO_BFS Placement Selection */}
            {placementMethod === 'MANUAL' ? (
              <div className="space-y-2.5 pt-1 border-t border-neutral-200/80 dark:border-neutral-700">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-neutral-700 dark:text-neutral-300 text-[11px]">
                      2. Placement ID (Manual Parent ID) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPlacementCandidates((v) => !v)}
                      className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {showPlacementCandidates ? 'তালিকা লুকান' : 'খালি প্যারেন্ট খুঁজুন'}
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      aria-label="Placement ID"
                      value={manualPlacementId}
                      onChange={(e) => {
                        setManualPlacementId(e.target.value.toUpperCase());
                        if (formErrors.placementId) setFormErrors((prev) => ({ ...prev, placementId: '' }));
                      }}
                      placeholder="যেমন: AB-1000000008"
                      className={`flex-1 px-3 py-2 rounded-xl border font-mono font-bold text-xs bg-white dark:bg-neutral-800 ${
                        formErrors.placementId || (manualPlacementId.trim() && !manualPlacementMeta.checking && (!manualPlacementMeta.found || !manualPlacementMeta.eligible))
                          ? 'border-rose-500 ring-1 ring-rose-400'
                          : manualPlacementMeta.found && manualPlacementMeta.eligible
                          ? 'border-emerald-500'
                          : 'border-neutral-300 dark:border-neutral-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        runManualPlacementInspection(manualPlacementId, manualPlacementId);
                        setShowPlacementCandidates(true);
                      }}
                      disabled={manualPlacementMeta.checking}
                      className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{manualPlacementMeta.checking ? 'চেক...' : 'Check Slots'}</span>
                    </button>
                  </div>

                  {manualPlacementMeta.found && manualPlacementMeta.parentId ? (
                    <div
                      className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
                        manualPlacementMeta.eligible
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {manualPlacementMeta.eligible ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>
                        {manualPlacementMeta.parentName} ({manualPlacementMeta.parentId}) —{' '}
                        {manualPlacementMeta.eligible ? 'খালি স্লট উপলব্ধ' : 'উভয় পজিশন পূর্ণ'}
                      </span>
                    </div>
                  ) : manualPlacementId.trim() && !manualPlacementMeta.checking ? (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{manualPlacementMeta.message}</span>
                    </div>
                  ) : null}

                  {showPlacementCandidates && placementCandidates.length > 0 && (
                    <div className="mt-2 p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 max-h-36 overflow-y-auto space-y-1">
                      <div className="text-[10px] font-bold text-neutral-500 px-1">
                        প্লেসমেন্ট প্যারেন্ট তালিকা (স্লট উপলব্ধতা অনুযায়ী):
                      </div>
                      {placementCandidates.map((cand) => (
                        <button
                          key={cand.id}
                          type="button"
                          disabled={!cand.eligible}
                          onClick={() => {
                            setManualPlacementId(cand.id);
                            if (cand.leftAvailable) setManualPlacementPosition('LEFT');
                            else if (cand.rightAvailable) setManualPlacementPosition('RIGHT');
                            setShowPlacementCandidates(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between gap-2 transition-colors ${
                            cand.eligible
                              ? 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer'
                              : 'opacity-50 cursor-not-allowed bg-neutral-50 dark:bg-neutral-800/40'
                          }`}
                        >
                          <span className="truncate">
                            <strong className="font-mono text-neutral-900 dark:text-white">{cand.id}</strong> — {cand.fullName}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 font-mono text-[9px] font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                cand.leftAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              L:{cand.leftAvailable ? 'Open' : 'Full'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                cand.rightAvailable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              R:{cand.rightAvailable ? 'Open' : 'Full'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. LEFT / RIGHT Slot Selector with Explicit Status */}
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 text-[11px]">
                    3. Placement Position (LEFT / RIGHT) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['LEFT', 'RIGHT'] as const).map((posKey) => {
                      const slotInfo = posKey === 'LEFT' ? manualPlacementMeta.left : manualPlacementMeta.right;
                      const isOccupied = slotInfo?.status === 'occupied';
                      const isSelected = !isOccupied && manualPlacementPosition === posKey;

                      return (
                        <button
                          key={posKey}
                          type="button"
                          data-testid={`slot-option-${posKey.toLowerCase()}`}
                          aria-pressed={isSelected}
                          disabled={isOccupied}
                          onClick={() => {
                            if (!isOccupied) setManualPlacementPosition(posKey);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isOccupied
                              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 opacity-70 cursor-not-allowed'
                              : isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm cursor-pointer'
                              : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-black text-xs">{posKey}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                isOccupied
                                  ? 'bg-rose-600 text-white'
                                  : isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isOccupied ? 'Occupied' : 'Available'}
                            </span>
                          </div>
                          <div
                            className={`text-[10px] mt-1 truncate ${
                              isSelected && !isOccupied
                                ? 'text-emerald-100'
                                : 'text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            {isOccupied
                              ? `Occupied by: ${slotInfo?.occupiedById || 'Member'}`
                              : slotInfo?.slotId || (manualPlacementId.trim() ? `SLOT-${manualPlacementId.trim()}-${posKey}` : 'খালি স্লট')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {formErrors.placementId && (
                    <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.placementId}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-neutral-200/80 dark:border-neutral-700">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 text-[11px]">
                    2. Placement ID <span className="text-[9px] text-neutral-400">(Auto BFS)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    aria-label="Auto BFS Placement ID"
                    value={autoBfsPreview.placementId || (autoBfsPreview.checking ? 'Checking...' : '—')}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/70 font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 text-[11px]">
                    3. Position <span className="text-[9px] text-neutral-400">(Auto BFS)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    aria-label="Auto BFS Position"
                    value={autoBfsPreview.found ? autoBfsPreview.position : '—'}
                    className={`w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/70 font-mono font-black text-xs uppercase cursor-not-allowed ${
                      autoBfsPreview.position === 'LEFT'
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-teal-700 dark:text-teal-300'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Pre-Submit Registration Preview Box */}
            <div
              data-testid="target-slot-preview"
              className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200/80 dark:border-emerald-900/60 text-[11px] space-y-1"
            >
              <div className="font-black text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>প্রি-সাবমিট প্লেসমেন্ট প্রিভিউ (Target Slot Preview)</span>
                <span className="font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {placementMethod}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div>
                  <span className="text-neutral-500">Referral ID: </span>
                  <strong className="font-mono text-neutral-900 dark:text-white" data-testid="preview-referral-id">
                    {referralId.trim() || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500">Placement ID: </span>
                  <strong className="font-mono text-neutral-900 dark:text-white" data-testid="preview-placement-id">
                    {activePlacementId.trim() || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500">Position: </span>
                  <strong className="font-mono text-emerald-700 dark:text-emerald-400" data-testid="preview-position">
                    {activePlacementId.trim() ? activePlacementPosition : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500">Target Slot: </span>
                  <strong className="font-mono text-[10px] text-neutral-800 dark:text-neutral-200" data-testid="preview-target-slot">
                    {effectiveSlotId || '—'}
                  </strong>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 pt-0.5 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
                <span>Customer ID (AB-):</span>
                <strong className="text-neutral-800 dark:text-neutral-200">Assigned on Commit</strong>
              </div>
            </div>
          </div>

          {/* Field 4 & 5: Full Name + Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                4. সম্পূর্ণ নাম (Full Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                    formErrors.fullName ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
              </div>
              {formErrors.fullName && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.fullName}</span>
              )}
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                5. মোবাইল নম্বর (Mobile Number) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (formErrors.mobile) setFormErrors((prev) => ({ ...prev, mobile: '' }));
                  }}
                  placeholder="01XXXXXXXXX"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono ${
                    formErrors.mobile ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
              </div>
              {formErrors.mobile && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.mobile}</span>
              )}
            </div>
          </div>

          {/* Field 6 & 8: Email Address (Required) + NID / Identity Verification (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                6. ইমেইল (Email Address) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                    formErrors.email ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
              </div>
              {formErrors.email && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.email}</span>
              )}
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                8. NID / জাতীয় পরিচয়পত্র নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => {
                    setNidNumber(e.target.value);
                    if (formErrors.nidNumber) setFormErrors((prev) => ({ ...prev, nidNumber: '' }));
                  }}
                  placeholder="১০-১৭ ডিজিটের NID নম্বর"
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono ${
                    formErrors.nidNumber ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
              </div>
              {formErrors.nidNumber && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.nidNumber}</span>
              )}
            </div>
          </div>

          {/* Field 7: Full Address */}
          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              7. সম্পূর্ণ ঠিকানা (Address) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="বাড়ি, রোড, এলাকা, থানা, জেলা লিখুন"
                className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                  formErrors.address ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                } bg-white dark:bg-neutral-800 text-xs`}
              />
            </div>
            {formErrors.address && (
              <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.address}</span>
            )}
          </div>

          {/* Field 9 & 10: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300">
                  9. পাসওয়ার্ড (Password) <span className="text-rose-500">*</span>
                </label>
                {password && (
                  <span className={`text-[10px] font-bold ${passwordStrength.level === 3 ? 'text-emerald-600' : passwordStrength.level === 2 ? 'text-amber-600' : 'text-rose-500'}`}>
                    {passwordStrength.text}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  placeholder="সর্বনিম্ন ৬ অক্ষর"
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border ${
                    formErrors.password ? 'border-rose-500' : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.password}</span>
              )}
            </div>

            <div>
              <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                10. কনফার্ম পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (formErrors.confirmPassword) setFormErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  placeholder="পাসওয়ার্ড পুনরায় লিখুন"
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border ${
                    formErrors.confirmPassword || (confirmPassword && password !== confirmPassword)
                      ? 'border-rose-500'
                      : 'border-neutral-300 dark:border-neutral-700'
                  } bg-white dark:bg-neutral-800 text-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">{formErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>অটো আইডি ও একাউন্ট তৈরি হচ্ছে...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>নিবন্ধন সম্পন্ন করুন (Commit & Assign AB- ID)</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: LOGIN */}
      {activeTab === 'login' && (
        <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4 text-xs">
          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Customer ID (AB-...) / User ID / মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={loginUserId}
                onChange={(e) => setLoginUserId(e.target.value)}
                placeholder="AB-1000000001 অথবা মোবাইল নম্বর"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword((v) => !v)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 p-0.5 cursor-pointer"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {loginLoading ? 'লগইন করা হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      )}

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
                className="text-neutral-400 hover:text-neutral-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotPasswordSent ? (
              <div className="space-y-3 text-center py-2">
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
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                >
                  ফিরে যান
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={forgotPasswordInput}
                  onChange={(e) => setForgotPasswordInput(e.target.value)}
                  placeholder="AB-10000000XX অথবা মোবাইল"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                />
                <button
                  type="button"
                  disabled={!forgotPasswordInput.trim()}
                  onClick={() => setForgotPasswordSent(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
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
