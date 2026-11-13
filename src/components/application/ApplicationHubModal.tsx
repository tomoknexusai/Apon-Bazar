/**
 * Apon Bazar APPLICATION HUB & ROLE ONBOARDING MODAL
 * Dedicated Forms for:
 * 1. APPLY FOR ADMIN (1 per District)
 * 2. APPLY FOR OPERATIONAL OFFICER (1 per Upazila)
 * 3. APPLY FOR PRODUCT DELIVERY MAN (Unlimited)
 * Plus Real-time Application Status Tracker
 *
 * Project: Apon Bazar
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRoleApplications } from '../../context/RoleApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  ApplicationRoleType,
  RoleApplication,
  Gender
} from '../../types';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList
} from '../../lib/bd-locations';
import {
  X,
  ShieldCheck,
  Building2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ChevronRight,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  Copy,
  ArrowRight,
  Navigation,
  Key
} from 'lucide-react';

interface ApplicationHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: ApplicationRoleType | 'tracker';
}

export const ApplicationHubModal: React.FC<ApplicationHubModalProps> = ({
  isOpen,
  onClose,
  initialRole
}) => {
  const { language } = useLanguage();
  const { currentUser, isLoggedIn } = useAuth();
  const {
    submitRoleApplication,
    checkDistrictAdminVacancy,
    checkUpazilaOfficerVacancy,
    getDeliveryMenCountForArea,
    getApplicationByTracking,
    getApplicationsByMobile
  } = useRoleApplications();

  // Active Tab: 'roles' (select one of 3) | 'admin' | 'operational_officer' | 'delivery_man' | 'tracker'
  const [activeTab, setActiveTab] = useState<'roles' | ApplicationRoleType | 'tracker'>(
    initialRole || 'roles'
  );

  useEffect(() => {
    if (initialRole) {
      setActiveTab(initialRole);
    } else {
      setActiveTab('roles');
    }
  }, [initialRole, isOpen]);

  // Form State
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.mobileNumber || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [nationalId, setNationalId] = useState(currentUser?.nationalId || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || '');
  const [gender, setGender] = useState<Gender>(currentUser?.gender || 'male');

  // Location Hierarchy
  const [division, setDivision] = useState(currentUser?.mandatoryAddress?.division || 'ঢাকা');
  const [district, setDistrict] = useState(currentUser?.mandatoryAddress?.district || 'ঢাকা');
  const [upazila, setUpazila] = useState(currentUser?.mandatoryAddress?.upazila || '');
  const [unionName, setUnionName] = useState(currentUser?.mandatoryAddress?.unionName || '');
  const [villagePara, setVillagePara] = useState(currentUser?.mandatoryAddress?.area || '');
  const [fullAddress, setFullAddress] = useState(currentUser?.mandatoryAddress?.fullServiceAddress || '');

  // Qualifications & Experience
  const [educationalQualification, setEducationalQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('1-3 Years');
  const [previousExperience, setPreviousExperience] = useState('');
  const [statementOfPurpose, setStatementOfPurpose] = useState('');

  // Delivery Rider Specific
  const [vehicleType, setVehicleType] = useState<'Motorcycle' | 'Bicycle' | 'Electric Scooter' | 'Van/Easybike' | 'Foot/Walking' | 'Other'>('Motorcycle');
  const [vehicleRegNumber, setVehicleRegNumber] = useState('');
  const [drivingLicenseNumber, setDrivingLicenseNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Father / Guardian');

  // Tracking Lookup State
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedApplication, setSearchedApplication] = useState<RoleApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<RoleApplication | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Available options derived from location selections
  const availableDistricts = getDistrictsList(division);
  const availableUpazilas = getUpazilasList(division, district);
  const availableUnions = getUnionsList(division, district, upazila);

  // Reset dependent dropdowns when parent changes
  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const distList = getDistrictsList(newDiv);
    if (distList.length > 0) {
      setDistrict(distList[0].nameBn);
      const upzList = getUpazilasList(newDiv, distList[0].nameBn);
      if (upzList.length > 0) {
        setUpazila(upzList[0].nameBn);
      } else {
        setUpazila('');
      }
    } else {
      setDistrict('');
      setUpazila('');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const upzList = getUpazilasList(division, newDist);
    if (upzList.length > 0) {
      setUpazila(upzList[0].nameBn);
    } else {
      setUpazila('');
    }
  };

  // Real-time Vacancy & Occupancy Checks
  const districtAdminVacancy = checkDistrictAdminVacancy(district);
  const upazilaOfficerVacancy = checkUpazilaOfficerVacancy(district, upazila);
  const deliveryMenStats = getDeliveryMenCountForArea(district, upazila);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!fullName.trim()) {
      setSubmitError('অনুগ্রহ করে আপনার পুরো নাম প্রদান করুন।');
      return;
    }
    if (!mobileNumber.trim()) {
      setSubmitError('অনুগ্রহ করে সচল মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    if (!nationalId.trim()) {
      setSubmitError('জাতীয় পরিচয়পত্র (NID) নম্বর আবশ্যক।');
      return;
    }
    if (!district) {
      setSubmitError('জেলা নির্বাচন আবশ্যক।');
      return;
    }

    if (activeTab === 'operational_officer' && !upazila) {
      setSubmitError('অপারেশনাল অফিসার পদের জন্য উপজেলা নির্বাচন আবশ্যক।');
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await submitRoleApplication({
        roleType: activeTab as ApplicationRoleType,
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || undefined,
        nationalId: nationalId.trim(),
        dateOfBirth: dateOfBirth || undefined,
        gender,
        division,
        district,
        upazila: upazila || undefined,
        unionName: unionName || undefined,
        villagePara: villagePara || undefined,
        fullAddress: fullAddress || `${villagePara ? villagePara + ', ' : ''}${upazila ? upazila + ', ' : ''}${district}`,
        educationalQualification: educationalQualification || undefined,
        experienceYears,
        previousExperience: previousExperience || undefined,
        statementOfPurpose: statementOfPurpose || undefined,
        vehicleType: activeTab === 'delivery_man' ? vehicleType : undefined,
        vehicleRegNumber: activeTab === 'delivery_man' ? vehicleRegNumber : undefined,
        drivingLicenseNumber: activeTab === 'delivery_man' ? drivingLicenseNumber : undefined,
        emergencyContact: activeTab === 'delivery_man' ? emergencyContact : undefined,
        emergencyContactRelation: activeTab === 'delivery_man' ? emergencyContactRelation : undefined
      });

      if (!res.success) {
        setSubmitError(res.message);
        return;
      }

      setSubmittedApp(res.application || null);
    } catch (err: any) {
      setSubmitError(err?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;

    setHasSearched(true);
    const result = getApplicationByTracking(trackingQuery);
    setSearchedApplication(result || null);
  };

  const copyTrackingToClipboard = (trackNo: string) => {
    navigator.clipboard.writeText(trackNo);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-emerald-800 via-teal-700 to-neutral-900 p-5 sm:p-6 text-white overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-xs">
                <ShieldCheck className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 px-2 py-0.5 rounded-full">
                    Apon Bazar CAREER & LEADERSHIP
                  </span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded-full font-bold">
                    Official Portal
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                  {language === 'bn' ? 'Apon Bazar অ্যাপ্লিকেশন সিস্টেম' : 'Apon Bazar Application Portal'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Sub-Navigation Bar */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setActiveTab('roles');
                setSubmittedApp(null);
                setSubmitError(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {language === 'bn' ? 'আবেদন তালিকা' : 'Overview'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setSubmittedApp(null);
                setSubmitError(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              1. {language === 'bn' ? 'জেলা অ্যাডমিন' : 'APPLY FOR ADMIN'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('operational_officer');
                setSubmittedApp(null);
                setSubmitError(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'operational_officer'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              2. {language === 'bn' ? 'অপারেশনাল অফিসার' : 'OPERATIONAL OFFICER'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('delivery_man');
                setSubmittedApp(null);
                setSubmitError(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'delivery_man'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              3. {language === 'bn' ? 'ডেলিভারি ম্যান' : 'DELIVERY MAN'}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('tracker');
                setSubmittedApp(null);
                setSubmitError(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activeTab === 'tracker'
                  ? 'bg-amber-400 text-neutral-900 shadow-xs'
                  : 'bg-amber-400/20 text-amber-200 hover:bg-amber-400/30'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'স্ট্যাটাস ট্র্যাকার' : 'Track Status'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* =========================================================================
              VIEW 1: 3 SEPARATE BUTTONS / CARDS SELECTION (THE EXACT REQUEST SPEC)
             ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h4 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                  {language === 'bn' ? 'দায়িত্বপ্রাপ্ত পদের জন্য আবেদন করুন' : 'Select Your Desired Position'}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {language === 'bn'
                    ? 'Apon Bazar-এর নির্দিষ্ট জেলা, উপজেলা ও ডেলিভারি এলাকায় দায়িত্ব পালনের জন্য সরাসরি আবেদন করুন।'
                    : 'Choose from 3 designated operational roles with distinct jurisdictional responsibilities.'}
                </p>
              </div>

              {/* Area Hierarchy Info Pill */}
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 text-xs">
                <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 mb-1.5">
                  <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'bn' ? 'এলাকাভিত্তিক সাংগঠনিক কাঠামো:' : 'Area Hierarchy Structure:'}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span><strong>প্রতি জেলায়:</strong> ১ জন জেলা অ্যাডমিন</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <span><strong>প্রতি উপজেলায়:</strong> ১ জন অপারেশনাল অফিসার</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span><strong>প্রতি এলাকায়:</strong> আনলিমিটেড ডেলিভারি ম্যান</span>
                  </div>
                </div>
              </div>

              {/* 3 SEPARATE APPLICATION BUTTONS & CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. APPLY FOR ADMIN */}
                <div className="relative p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-b from-indigo-50/70 to-white dark:from-indigo-950/20 dark:to-neutral-900 flex flex-col justify-between space-y-4 hover:border-indigo-500 transition-all shadow-xs group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                        ১ জেলা = ১ অ্যাডমিন
                      </span>
                    </div>

                    <div>
                      <h5 className="font-black text-sm text-neutral-900 dark:text-white">
                        {language === 'bn' ? '১. জেলা অ্যাডমিন' : '1. DISTRICT ADMIN'}
                      </h5>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {language === 'bn'
                          ? 'একটি নির্দিষ্ট জেলার সামগ্রিক কার্যক্রম, ভেন্ডর সমন্বয় ও অর্ডার মনিটরিং-এর সর্বোচ্চ স্থানীয় দায়িত্ব।'
                          : 'Responsible for assigned District. Strictly 1 active Admin per District with Super Admin verification.'}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>সুপার অ্যাডমিন দ্বারা অনুমোদন</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>জেলা অ্যাডমিন কন্ট্রোল প্যানেল এক্সেস</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin');
                      setSubmittedApp(null);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{language === 'bn' ? 'APPLY FOR ADMIN' : 'APPLY FOR ADMIN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. APPLY FOR OPERATIONAL OFFICER */}
                <div className="relative p-5 rounded-3xl border-2 border-teal-200 dark:border-teal-800/60 bg-gradient-to-b from-teal-50/70 to-white dark:from-teal-950/20 dark:to-neutral-900 flex flex-col justify-between space-y-4 hover:border-teal-500 transition-all shadow-xs group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                        ১ উপজেলা = ১ অফিসার
                      </span>
                    </div>

                    <div>
                      <h5 className="font-black text-sm text-neutral-900 dark:text-white">
                        {language === 'bn' ? '২. অপারেশনাল অফিসার' : '2. OPERATIONAL OFFICER'}
                      </h5>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {language === 'bn'
                          ? 'উপজেলা পর্যায়ে লোকাল হাব, কাঁচাবাজার পণ্য কালেকশন ও রাইডার সুপারভিশন কার্যক্রম পরিচালনা।'
                          : 'Responsible for assigned Upazila. Strictly 1 active Officer per Upazila with Admin verification.'}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>উপজেলা হাব ও অর্ডার পরিচালনা</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>ডেলিভারি রাইডার সমন্বয় ও ট্র্যাকিং</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('operational_officer');
                      setSubmittedApp(null);
                    }}
                    className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{language === 'bn' ? 'APPLY FOR OPERATIONAL OFFICER' : 'APPLY FOR OPERATIONAL OFFICER'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. APPLY FOR PRODUCT DELIVERY MAN */}
                <div className="relative p-5 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800/60 bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/20 dark:to-neutral-900 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all shadow-xs group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Truck className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                        আনলিমিটেড আসন
                      </span>
                    </div>

                    <div>
                      <h5 className="font-black text-sm text-neutral-900 dark:text-white">
                        {language === 'bn' ? '৩. প্রোডাক্ট ডেলিভারি ম্যান' : '3. PRODUCT DELIVERY MAN'}
                      </h5>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                        {language === 'bn'
                          ? 'পণ্য পিকআপ থেকে কাস্টমারের ঠিকানায় দ্রুততম সময়ে ডেলিভারি করে আকর্ষণীয় ডেলিভারি ফি উপার্জন।'
                          : 'Unlimited registrations per District & Upazila. Fast verification and Rider Dashboard access.'}
                      </p>
                    </div>

                    <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>দৈনিক/সাপ্তাহিক নিয়মিত কমিশন পেমেন্ট</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>লাইভ অর্ডার নেভিগেশন ও রাইডার আইডি</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('delivery_man');
                      setSubmittedApp(null);
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{language === 'bn' ? 'APPLY FOR PRODUCT DELIVERY MAN' : 'APPLY FOR DELIVERY MAN'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: SUBMISSION CONFIRMATION SCREEN
             ========================================================================= */}
          {submittedApp && (
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300">
                  আবেদন সফলভাবে গৃহীত হয়েছে
                </span>
                <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100 mt-2">
                  ধন্যবাদ, {submittedApp.fullName}!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                  আপনার {submittedApp.roleType === 'admin' ? 'জেলা অ্যাডমিন' : submittedApp.roleType === 'operational_officer' ? 'উপজেলা অপারেশনাল অফিসার' : 'প্রোডাক্ট ডেলিভারি ম্যান'} পদের আবেদনটি পর্যালোচনার জন্য জমা হয়েছে।
                </p>
              </div>

              {/* Tracking Number Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-700 max-w-sm mx-auto shadow-xs flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                    আপনার ট্র্যাকিং আইডি
                  </span>
                  <span className="font-mono font-black text-base text-neutral-900 dark:text-white">
                    {submittedApp.trackingNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyTrackingToClipboard(submittedApp.trackingNumber)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedTracking ? 'কপি হয়েছে!' : 'কপি করুন'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrackingQuery(submittedApp.trackingNumber);
                    setActiveTab('tracker');
                    setSubmittedApp(null);
                  }}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold cursor-pointer"
                >
                  স্ট্যাটাস দেখুন
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: SPECIFIC APPLICATION FORM (ADMIN / OPS OFFICER / DELIVERY MAN)
             ========================================================================= */}
          {(activeTab === 'admin' || activeTab === 'operational_officer' || activeTab === 'delivery_man') && !submittedApp && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
              
              {/* Form Title & Role Description */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-xs ${
                      activeTab === 'admin'
                        ? 'bg-indigo-600'
                        : activeTab === 'operational_officer'
                        ? 'bg-teal-600'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {activeTab === 'admin' ? (
                      <Building2 className="w-5 h-5" />
                    ) : activeTab === 'operational_officer' ? (
                      <Briefcase className="w-5 h-5" />
                    ) : (
                      <Truck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                      {activeTab === 'admin'
                        ? 'জেলা অ্যাডমিন আবেদন ফরম (District Admin Application)'
                        : activeTab === 'operational_officer'
                        ? 'উপজেলা অপারেশনাল অফিসার আবেদন ফরম (Operational Officer)'
                        : 'প্রোডাক্ট ডেলিভারি ম্যান আবেদন ফরম (Delivery Rider)'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {activeTab === 'admin'
                        ? 'প্রতি জেলায় সর্বোচ্চ ১ জন অনুমোদিত অ্যাডমিন।'
                        : activeTab === 'operational_officer'
                        ? 'প্রতি উপজেলায় সর্বোচ্চ ১ জন অনুমোদিত অপারেশনাল অফিসার।'
                        : 'আনলিমিটেড ডেলিভারি ম্যান রেজিস্ট্রেশন।'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('roles')}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline cursor-pointer"
                >
                  পদ পরিবর্তন করুন
                </button>
              </div>

              {/* LIVE VACANCY / AREA STATUS BANNER */}
              {activeTab === 'admin' && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                    districtAdminVacancy.isVacant
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {districtAdminVacancy.isVacant ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-black text-xs block">
                      {districtAdminVacancy.isVacant ? 'আসন খালি রয়েছে (Seat Vacant)' : 'আসন পূর্ণ (Seat Occupied)'}
                    </span>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {districtAdminVacancy.message}
                    </p>
                    {districtAdminVacancy.pendingCount > 0 && districtAdminVacancy.isVacant && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mt-1">
                        বর্তমানে এই জেলায় {districtAdminVacancy.pendingCount} টি আবেদন পর্যালোচনায় রয়েছে।
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'operational_officer' && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                    upazilaOfficerVacancy.isVacant
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {upazilaOfficerVacancy.isVacant ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-black text-xs block">
                      {upazilaOfficerVacancy.isVacant ? 'উপজেলা আসন খালি রয়েছে (Seat Vacant)' : 'উপজেলা আসন পূর্ণ (Seat Occupied)'}
                    </span>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {upazilaOfficerVacancy.message}
                    </p>
                    {upazilaOfficerVacancy.pendingCount > 0 && upazilaOfficerVacancy.isVacant && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mt-1">
                        বর্তমানে এই উপজেলায় {upazilaOfficerVacancy.pendingCount} টি আবেদন পর্যালোচনায় রয়েছে।
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'delivery_man' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{district} জেলায় আনলিমিটেড ডেলিভারি ম্যান যুক্ত হতে পারেন।</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-md">
                    সক্রিয় ডেলিভারি ম্যান: {deliveryMenStats.activeCount} জন
                  </span>
                </div>
              )}

              {/* SECTION 1: Personal & Contact Information */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>১. ব্যক্তিগত ও যোগাযোগ তথ্য (Personal Details)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      পুরো নাম (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="আপনার পূর্ণ নাম"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      মোবাইল নম্বর (Mobile Number) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      জাতীয় পরিচয়পত্র নম্বর (NID Number) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="10, 13 বা 17 ডিজিটের NID"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      ইমেইল ঠিকানা (Email - Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      জন্ম তারিখ (Date of Birth)
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      লিঙ্গ (Gender)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      <option value="male">পুরুষ (Male)</option>
                      <option value="female">মহিলা (Female)</option>
                      <option value="other">অন্যান্য (Other)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Area & Jurisdiction Assignment (Cascading Selection) */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>২. দায়িত্বের এলাকা ও সার্ভিস ঠিকানা (Area & Location)</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      বিভাগ (Division) *
                    </label>
                    <select
                      value={division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      {BD_DIVISIONS.map((d) => (
                        <option key={d.nameBn} value={d.nameBn}>
                          {d.nameBn} ({d.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      জেলা (District) *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold text-neutral-900 dark:text-white"
                    >
                      {availableDistricts.map((dist) => (
                        <option key={dist.nameBn} value={dist.nameBn}>
                          {dist.nameBn} ({dist.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {(activeTab === 'operational_officer' || activeTab === 'delivery_man') && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        উপজেলা (Upazila) *
                      </label>
                      <select
                        required
                        value={upazila}
                        onChange={(e) => setUpazila(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold text-neutral-900 dark:text-white"
                      >
                        <option value="">উপজেলা নির্বাচন করুন</option>
                        {availableUpazilas.map((upz) => (
                          <option key={upz.nameBn} value={upz.nameBn}>
                            {upz.nameBn} ({upz.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activeTab === 'delivery_man' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        ইউনিয়ন / এলাকা (Union / Area)
                      </label>
                      <select
                        value={unionName}
                        onChange={(e) => setUnionName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="">ইউনিয়ন নির্বাচন করুন (Optional)</option>
                        {availableUnions.map((u) => (
                          <option key={u.nameBn} value={u.nameBn}>
                            {u.nameBn}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={activeTab === 'admin' ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-2'}>
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      বিস্তারিত ঠিকানা / অফিস লোকেশন (Full Address)
                    </label>
                    <input
                      type="text"
                      value={fullAddress}
                      onChange={(e) => setFullAddress(e.target.value)}
                      placeholder="রোড নং, বাড়ি নং, বাজার বা ল্যান্ডমার্ক"
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Role Specific Qualifications / Vehicle Info */}
              {activeTab === 'delivery_man' ? (
                /* Delivery Man Specific: Vehicle & Emergency Contact */
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>৩. বাহন ও জরুরি যোগাযোগ (Vehicle & Emergency)</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        বাহনের ধরন (Vehicle Type) *
                      </label>
                      <select
                        value={vehicleType}
                        onChange={(e: any) => setVehicleType(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="Motorcycle">মোটরসাইকেল (Motorcycle)</option>
                        <option value="Bicycle">সাইকেল (Bicycle)</option>
                        <option value="Electric Scooter">ইলেকট্রিক স্কুটার (E-Bike)</option>
                        <option value="Van/Easybike">ভ্যান / ইজিবাইক</option>
                        <option value="Foot/Walking">হেঁটে ডেলিভারি (Walking)</option>
                        <option value="Other">অন্যান্য</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        গাড়ির রেজিস্ট্রেশন নং (Vehicle Reg - Optional)
                      </label>
                      <input
                        type="text"
                        value={vehicleRegNumber}
                        onChange={(e) => setVehicleRegNumber(e.target.value)}
                        placeholder="ঢাকা মেট্রো-হ-..."
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        ড্রাইভিং লাইসেন্স নং (Driving License - Optional)
                      </label>
                      <input
                        type="text"
                        value={drivingLicenseNumber}
                        onChange={(e) => setDrivingLicenseNumber(e.target.value)}
                        placeholder="লাইসেন্স নম্বর"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        জরুরি যোগাযোগের নম্বর (Emergency Contact) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="অভিভাবকের মোবাইল নম্বর"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        সম্পর্ক (Relation)
                      </label>
                      <input
                        type="text"
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        placeholder="বাবা / ভাই / অভিভাবক"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Admin & Operational Officer: Qualifications & Experience */
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-3">
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>৩. শিক্ষাগত যোগ্যতা ও অভিজ্ঞতা (Qualifications & Experience)</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        সর্বোচ্চ শিক্ষাগত যোগ্যতা (Education Qualification)
                      </label>
                      <input
                        type="text"
                        value={educationalQualification}
                        onChange={(e) => setEducationalQualification(e.target.value)}
                        placeholder="উদাঃ BBA / MBA / স্নাতক / মাস্টার্স"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        কাজের অভিজ্ঞতা (Experience Years)
                      </label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="Fresh / 0-1 Year">নতুন / ০-১ বছর</option>
                        <option value="1-3 Years">১-৩ বছর</option>
                        <option value="3-5 Years">৩-৫ বছর</option>
                        <option value="5+ Years">৫ বছরের অধিক</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        পূর্ববর্তী অভিজ্ঞতা ও কাজের বিবরণ (Past Experience)
                      </label>
                      <textarea
                        rows={2}
                        value={previousExperience}
                        onChange={(e) => setPreviousExperience(e.target.value)}
                        placeholder="আপনার পূর্ববর্তী কাজের অভিজ্ঞতা, ব্যবসা বা সাপ্লাই চেইন সংক্রান্ত তথ্য..."
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                        আবেদনের উদ্দেশ্য ও প্রতিশ্রুতি (Statement of Purpose)
                      </label>
                      <textarea
                        rows={2}
                        value={statementOfPurpose}
                        onChange={(e) => setStatementOfPurpose(e.target.value)}
                        placeholder="আপনি কেন এই পদের জন্য যোগ্য এবং কীভাবে এলাকার গ্রাহক সেবা নিশ্চিত করবেন?"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message Box */}
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Buttons & Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('roles')}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  ফিরে যান
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (activeTab === 'admin' && !districtAdminVacancy.isVacant) ||
                    (activeTab === 'operational_officer' && !upazilaOfficerVacancy.isVacant)
                  }
                  className={`px-6 py-2.5 rounded-2xl font-black text-xs text-white transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                    (activeTab === 'admin' && !districtAdminVacancy.isVacant) ||
                    (activeTab === 'operational_officer' && !upazilaOfficerVacancy.isVacant)
                      ? 'bg-neutral-400 dark:bg-neutral-700 cursor-not-allowed'
                      : activeTab === 'admin'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : activeTab === 'operational_officer'
                      ? 'bg-teal-600 hover:bg-teal-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {activeTab === 'admin'
                          ? 'জেলা অ্যাডমিন আবেদন জমা দিন'
                          : activeTab === 'operational_officer'
                          ? 'অপারেশনাল অফিসার আবেদন জমা দিন'
                          : 'ডেলিভারি ম্যান আবেদন জমা দিন'}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* =========================================================================
              VIEW 4: APPLICATION STATUS TRACKER
             ========================================================================= */}
          {activeTab === 'tracker' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="text-center max-w-md mx-auto space-y-1">
                <h4 className="text-base font-black text-neutral-900 dark:text-white">
                  আবেদন স্ট্যাটাস ট্র্যাকার (Application Status Tracker)
                </h4>
                <p className="text-xs text-neutral-500">
                  আপনার ট্র্যাকিং আইডি (উদাঃ APP-ADM-260101) বা নিবন্ধিত মোবাইল নম্বর দিয়ে বর্তমান অবস্থা যাচাই করুন।
                </p>
              </div>

              {/* Search Form */}
              <form onSubmit={handleTrackSearch} className="max-w-md mx-auto flex gap-2">
                <input
                  type="text"
                  required
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="ট্র্যাকিং আইডি অথবা মোবাইল নম্বর"
                  className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>খুঁজুন</span>
                </button>
              </form>

              {/* Search Result Card */}
              {hasSearched && searchedApplication && (
                <div className="max-w-lg mx-auto p-5 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                        ট্র্যাকিং আইডি: {searchedApplication.trackingNumber}
                      </span>
                      <h5 className="font-black text-sm text-neutral-900 dark:text-white mt-0.5">
                        {searchedApplication.fullName}
                      </h5>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-tight flex items-center gap-1.5 ${
                        searchedApplication.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300'
                          : searchedApplication.status === 'under_review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                          : searchedApplication.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-300'
                      }`}
                    >
                      {searchedApplication.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {searchedApplication.status === 'under_review' && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                      {searchedApplication.status === 'rejected' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {searchedApplication.status === 'pending' && <Clock className="w-3.5 h-3.5 text-blue-600" />}
                      <span>
                        {searchedApplication.status === 'approved'
                          ? 'অনুমোদিত (Approved)'
                          : searchedApplication.status === 'under_review'
                          ? 'পর্যালোচনাধীন (Under Review)'
                          : searchedApplication.status === 'rejected'
                          ? 'বাতিলকৃত (Rejected)'
                          : 'অপেক্ষমাণ (Pending)'}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">আবেদনকৃত পদ:</span>
                      <span>
                        {searchedApplication.roleType === 'admin'
                          ? 'জেলা অ্যাডমিন (District Admin)'
                          : searchedApplication.roleType === 'operational_officer'
                          ? 'অপারেশনাল অফিসার (Ops Officer)'
                          : 'প্রোডাক্ট ডেলিভারি ম্যান (Delivery Man)'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">এলাকা:</span>
                      <span>
                        {searchedApplication.upazila ? searchedApplication.upazila + ', ' : ''}
                        {searchedApplication.district}, {searchedApplication.division}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">মোবাইল:</span>
                      <span className="font-mono">{searchedApplication.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-neutral-800 dark:text-neutral-200">আবেদনের তারিখ:</span>
                      <span>{new Date(searchedApplication.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {searchedApplication.status === 'approved' && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                      <div className="font-black flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-emerald-600" />
                        <span>রোল আইডি: {searchedApplication.assignedRoleUniqueId}</span>
                      </div>
                      <p className="text-[11px]">
                        আপনার রোল ও ড্যাশবোর্ড অনুমোদন সক্রিয় করা হয়েছে। আপনার নিবন্ধিত মোবাইল ও পাসওয়ার্ড দিয়ে লগইন করে ড্যাশবোর্ডে প্রবেশ করুন।
                      </p>
                    </div>
                  )}

                  {searchedApplication.status === 'rejected' && searchedApplication.rejectionReason && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-0.5">
                      <span className="font-bold block">বাতিলের কারণ:</span>
                      <p className="text-[11px]">{searchedApplication.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {hasSearched && !searchedApplication && (
                <div className="max-w-md mx-auto p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
                  <h6 className="font-bold text-xs text-neutral-900 dark:text-white">
                    কোনো আবেদন খুঁজে পাওয়া যায়নি
                  </h6>
                  <p className="text-[11px] text-neutral-500">
                    অনুগ্রহ করে ট্র্যাকিং আইডি বা মোবাইল নম্বরটি সঠিক কিনা যাচাই করুন।
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
