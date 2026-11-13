/**
 * Apon Bazar ROLE APPLICATION & AREA QUOTA CONTROL CENTER
 * Used by Super Admin and District Admins to:
 * - Review and process applications for Admin, Operational Officer, Delivery Man
 * - Enforce strictly 1 Admin per District & 1 Operational Officer per Upazila
 * - Manage and explore live area vacancies across 64 Districts and 495+ Upazilas
 * - Grant roles, unique Role IDs, and dashboard access upon approval
 *
 * Project: Apon Bazar
 */

import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRoleApplications } from '../../context/RoleApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  RoleApplication,
  ApplicationRoleType,
  ApplicationStatus,
  DistrictAdminQuota,
  UpazilaOfficerQuota
} from '../../types';
import { BD_DIVISIONS, getDistrictsList, getUpazilasList } from '../../lib/bd-locations';
import { canAccessRoleApplications } from '../../lib/rbac';
import {
  ShieldCheck,
  Building2,
  Briefcase,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  User,
  GraduationCap,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Key,
  Lock
} from 'lucide-react';

export const RoleApplicationManager: React.FC = () => {
  const { language } = useLanguage();
  const { currentUser } = useAuth();
  const hasAccess = canAccessRoleApplications(currentUser);
  const isSuperAdmin = currentUser?.primaryRole === 'super_admin' || currentUser?.roles?.includes('super_admin');
  const isAdmin = isSuperAdmin || currentUser?.primaryRole === 'admin' || currentUser?.roles?.includes('admin');
  const {
    applications,
    putUnderReview,
    rejectApplication,
    approveApplication,
    deleteApplication,
    getAllDistrictQuotas,
    getAllUpazilaQuotas,
    getOverallStats,
    checkDistrictAdminVacancy,
    checkUpazilaOfficerVacancy
  } = useRoleApplications();

  const stats = getOverallStats();

  // Active Main Sub-Tab: 'applications' | 'district_quotas' | 'upazila_quotas'
  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'district_quotas' | 'upazila_quotas'>(
    'applications'
  );

  // Filters for Applications
  const [roleFilter, setRoleFilter] = useState<'all' | ApplicationRoleType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ApplicationStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  // Selected Application for Detail Modal
  const [viewingApp, setViewingApp] = useState<RoleApplication | null>(null);

  // Rejection Dialog State
  const [rejectingAppId, setRejectingAppId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // District Quota search
  const [districtSearch, setDistrictSearch] = useState('');
  const [quotaDivisionFilter, setQuotaDivisionFilter] = useState('all');

  // Upazila Quota filter
  const [upazilaDistrictFilter, setUpazilaDistrictFilter] = useState('');

  if (!hasAccess) {
    return (
      <div className="p-8 rounded-3xl bg-neutral-900 border border-red-500/30 text-white space-y-4 max-w-2xl mx-auto shadow-2xl my-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black tracking-widest uppercase text-red-400 bg-red-950/60 px-3 py-1 rounded-full border border-red-800">
            403 FORBIDDEN &bull; STRICT ACCESS CONTROL
          </span>
          <h2 className="text-xl font-bold text-white">
            {language === 'bn' ? 'আবেদন তথ্য শুধুমাত্র সুপার অ্যাডমিন ড্যাশবোর্ডে সুরক্ষিত' : 'Access Restricted: Super Admin Exclusive'}
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {language === 'bn'
              ? 'Apon Bazar নিরাপত্তা নীতি অনুযায়ী সকল দায়িত্বশীল পদের আবেদনপত্র শুধুমাত্র সুপার অ্যাডমিন ড্যাশবোর্ড থেকে পর্যবেক্ষণ ও নিয়ন্ত্রণযোগ্য।'
              : 'Per Apon Bazar policy, role application data is strictly confidential and accessible exclusively to the Super Admin.'}
          </p>
        </div>
      </div>
    );
  }

  // Filtered Applications List
  const filteredApplications = applications.filter((app) => {
    if (roleFilter !== 'all' && app.roleType !== roleFilter) return false;
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (selectedDivision !== 'all' && app.division !== selectedDivision) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.fullName.toLowerCase().includes(q);
      const matchMobile = app.mobileNumber.includes(q);
      const matchTrack = app.trackingNumber.toLowerCase().includes(q);
      const matchNid = app.nationalId?.toLowerCase().includes(q);
      const matchDistrict = app.district.toLowerCase().includes(q);
      const matchUpazila = app.upazila?.toLowerCase().includes(q);
      return matchName || matchMobile || matchTrack || matchNid || matchDistrict || matchUpazila;
    }

    return true;
  });

  const handleApprove = async (appId: string) => {
    setActionMessage(null);
    setProcessingId(appId);
    try {
      const res = await approveApplication(appId);
      if (!res.success) {
        setActionMessage({ text: res.message, type: 'error' });
      } else {
        setActionMessage({ text: res.message, type: 'success' });
      }
    } catch (e: any) {
      setActionMessage({ text: e?.message || 'অনুমোদন ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReview = async (appId: string) => {
    setActionMessage(null);
    setProcessingId(appId);
    try {
      const res = await putUnderReview(appId);
      setActionMessage({ text: res.message, type: 'success' });
    } catch (e: any) {
      setActionMessage({ text: e?.message || 'ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingAppId) return;
    setActionMessage(null);
    setProcessingId(rejectingAppId);
    try {
      const res = await rejectApplication(rejectingAppId, rejectionReason);
      setActionMessage({ text: res.message, type: 'success' });
      setRejectingAppId(null);
      setRejectionReason('');
    } catch (e: any) {
      setActionMessage({ text: e?.message || 'বাতিলকরণ ব্যর্থ হয়েছে।', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই আবেদনটি তালিকা থেকে মুছে ফেলতে চান?')) return;
    await deleteApplication(appId);
  };

  const districtQuotas = getAllDistrictQuotas().filter((d) => {
    if (quotaDivisionFilter !== 'all' && d.divisionName !== quotaDivisionFilter) return false;
    if (districtSearch.trim()) {
      return d.districtName.includes(districtSearch.trim()) || (d.activeAdminName && d.activeAdminName.includes(districtSearch.trim()));
    }
    return true;
  });

  const upazilaQuotas = getAllUpazilaQuotas(upazilaDistrictFilter || undefined);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-neutral-700">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
              APPLICATION ROLE SYSTEM & AREA QUOTA CONTROL
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              Strict 1 Admin/District & 1 Officer/Upazila
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {language === 'bn' ? 'আবেদন ও এলাকাভিত্তিক কোটা ব্যবস্থাপনা' : 'Role Applications & Area Quota Manager'}
          </h2>
          <p className="text-xs text-neutral-300 max-w-2xl">
            জেলা অ্যাডমিন (১ জন প্রতি জেলা), অপারেশনাল অফিসার (১ জন প্রতি উপজেলা) এবং প্রোডাক্ট ডেলিভারি ম্যান (আনলিমিটেড)-এর আবেদন যাচাই, এলাকা নিয়ন্ত্রণ ও রোল অনুমোদন।
          </p>
        </div>

        {/* Quick Nav Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('applications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'applications'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            আবেদন তালিকা ({applications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('district_quotas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'district_quotas'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            ৬৪ জেলা কোটা ({stats.districtsOccupied}/64)
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('upazila_quotas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'upazila_quotas'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            উপজেলা কোটা
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-bold">{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-black/10 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
            মোট আবেদন জমা
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-neutral-900 dark:text-white">
              {stats.totalApplications}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              {stats.pendingApplications} অপেক্ষমাণ
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
            জেলা অ্যাডমিন কোটা (১/জেলা)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.districtsOccupied} <span className="text-xs text-neutral-400 font-normal">/ {stats.totalDistricts}</span>
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              {stats.districtsVacant} টি খালি
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
            অপারেশনাল অফিসার (১/উপজেলা)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {stats.upazilasOccupied} <span className="text-xs text-neutral-400 font-normal">/ {stats.totalUpazilas}</span>
            </span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/50 px-2 py-0.5 rounded-full">
              {stats.upazilasVacant} টি খালি
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
            সক্রিয় ডেলিভারি ম্যান
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.totalDeliveryMen}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              আনলিমিটেড
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB 1: APPLICATIONS LIST & MANAGEMENT
         ========================================================================= */}
      {activeSubTab === 'applications' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, মোবাইল, ট্র্যাকিং আইডি বা এলাকা দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-bold">পদ:</span>
              <select
                value={roleFilter}
                onChange={(e: any) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-bold cursor-pointer"
              >
                <option value="all">সকল পদ (All Roles)</option>
                <option value="admin">১. জেলা অ্যাডমিন</option>
                <option value="operational_officer">২. অপারেশনাল অফিসার</option>
                <option value="delivery_man">৩. ডেলিভারি ম্যান</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-500 font-bold">অবস্থা:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-bold cursor-pointer"
              >
                <option value="all">সকল অবস্থা (All Status)</option>
                <option value="pending">অপেক্ষমাণ (Pending)</option>
                <option value="under_review">পর্যালোচনাধীন (Under Review)</option>
                <option value="approved">অনুমোদিত (Approved)</option>
                <option value="rejected">বাতিলকৃত (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Applications Table / Cards */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">ট্র্যাকিং ও আবেদনকারী</th>
                    <th className="px-4 py-3">আবেদনকৃত পদ</th>
                    <th className="px-4 py-3">এলাকা ও এখতিয়ার</th>
                    <th className="px-4 py-3">এলাকার অবস্থা</th>
                    <th className="px-4 py-3">স্ট্যাটাস</th>
                    <th className="px-4 py-3 text-right">কার্যক্রম (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-neutral-400">
                        কোনো আবেদন পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => {
                      const adminVac = checkDistrictAdminVacancy(app.district);
                      const opsVac = app.upazila ? checkUpazilaOfficerVacancy(app.district, app.upazila) : null;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          {/* Applicant Info */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              <span className="font-mono text-[10px] font-bold text-neutral-400 block">
                                {app.trackingNumber}
                              </span>
                              <div className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <span>{app.fullName}</span>
                                {app.gender && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                    {app.gender}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-neutral-400" />
                                <span>{app.mobileNumber}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                                app.roleType === 'admin'
                                  ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                                  : app.roleType === 'operational_officer'
                                  ? 'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                                  : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {app.roleType === 'admin' && <Building2 className="w-3.5 h-3.5" />}
                              {app.roleType === 'operational_officer' && <Briefcase className="w-3.5 h-3.5" />}
                              {app.roleType === 'delivery_man' && <Truck className="w-3.5 h-3.5" />}
                              <span>
                                {app.roleType === 'admin'
                                  ? 'জেলা অ্যাডমিন'
                                  : app.roleType === 'operational_officer'
                                  ? 'অপারেশনাল অফিসার'
                                  : 'ডেলিভারি ম্যান'}
                              </span>
                            </span>
                          </td>

                          {/* Area */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200 block">
                                {app.district}, {app.division}
                              </span>
                              {app.upazila && (
                                <span className="text-[11px] text-neutral-500 block">
                                  উপজেলা: {app.upazila}
                                </span>
                              )}
                              {app.unionName && (
                                <span className="text-[10px] text-neutral-400 block">
                                  ইউনিয়ন: {app.unionName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Area Quota Status */}
                          <td className="px-4 py-3.5">
                            {app.roleType === 'admin' && (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  adminVac.isVacant || app.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                                }`}
                              >
                                {app.status === 'approved'
                                  ? 'বর্তমান অ্যাডমিন'
                                  : adminVac.isVacant
                                  ? 'আসন খালি (Vacant)'
                                  : 'আসন পূর্ণ (Occupied)'}
                              </span>
                            )}

                            {app.roleType === 'operational_officer' && opsVac && (
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                                  opsVac.isVacant || app.status === 'approved'
                                    ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300'
                                }`}
                              >
                                {app.status === 'approved'
                                  ? 'বর্তমান অফিসার'
                                  : opsVac.isVacant
                                  ? 'আসন খালি (Vacant)'
                                  : 'আসন পূর্ণ (Occupied)'}
                              </span>
                            )}

                            {app.roleType === 'delivery_man' && (
                              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                আনলিমিটেড
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit ${
                                app.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                                  : app.status === 'under_review'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                                  : app.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                                  : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200'
                              }`}
                            >
                              {app.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {app.status === 'under_review' && <Clock className="w-3 h-3 text-amber-600" />}
                              {app.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                              {app.status === 'pending' && <Clock className="w-3 h-3 text-blue-600" />}
                              <span>
                                {app.status === 'approved'
                                  ? 'অনুমোদিত'
                                  : app.status === 'under_review'
                                  ? 'পর্যালোচনাধীন'
                                  : app.status === 'rejected'
                                  ? 'বাতিলকৃত'
                                  : 'অপেক্ষমাণ'}
                              </span>
                            </span>
                            {app.assignedRoleUniqueId && (
                              <span className="text-[10px] font-mono text-emerald-600 font-bold block mt-1">
                                আইডি: {app.assignedRoleUniqueId}
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingApp(app)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                                title="সম্পূর্ণ তথ্য দেখুন"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Put Under Review */}
                              {app.status === 'pending' && (
                                <button
                                  type="button"
                                  disabled={processingId === app.id}
                                  onClick={() => handleReview(app.id)}
                                  className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 cursor-pointer"
                                  title="পর্যালোচনাধীন তালিকায় নিন"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              )}

                              {/* Approve Button */}
                              {app.status !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={processingId === app.id}
                                  onClick={() => handleApprove(app.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                                  title="অনুমোদন ও রোল আইডি প্রদান করুন"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>অনুমোদন</span>
                                </button>
                              )}

                              {/* Reject Button */}
                              {app.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingAppId(app.id);
                                    setRejectionReason('');
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 cursor-pointer"
                                  title="বাতিল করুন"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDelete(app.id)}
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="তালিকা থেকে মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: 64 DISTRICT ADMIN QUOTA GRID (STRICTLY 1 PER DISTRICT)
         ========================================================================= */}
      {activeSubTab === 'district_quotas' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                placeholder="জেলা বা বর্তমান অ্যাডমিনের নাম দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-500">বিভাগ:</span>
              <select
                value={quotaDivisionFilter}
                onChange={(e) => setQuotaDivisionFilter(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-bold cursor-pointer"
              >
                <option value="all">সকল বিভাগ (All Divisions)</option>
                {BD_DIVISIONS.map((d) => (
                  <option key={d.nameBn} value={d.nameBn}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 64 District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {districtQuotas.map((dist) => (
              <div
                key={dist.districtName}
                className={`p-4 rounded-3xl border transition-all ${
                  dist.hasActiveAdmin
                    ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">
                    {dist.divisionName}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      dist.hasActiveAdmin
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {dist.hasActiveAdmin ? '১/১ পূর্ণ (Occupied)' : 'আসন খালি (Vacant)'}
                  </span>
                </div>

                <h4 className="font-black text-sm text-neutral-900 dark:text-white">
                  {dist.districtName} জেলা
                </h4>

                {dist.hasActiveAdmin ? (
                  <div className="mt-3 p-2.5 rounded-2xl bg-white dark:bg-neutral-800/80 border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs">
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                      সক্রিয় জেলা অ্যাডমিন:
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {dist.activeAdminName}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      আইডি: {dist.activeAdminMemberId || dist.activeAdminId}
                    </div>
                    {dist.activeAdminMobile && (
                      <div className="text-[10px] text-neutral-500 font-mono">
                        মোবাইল: {dist.activeAdminMobile}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-1">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      আসন খালি রয়েছে
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      {dist.pendingApplicationsCount > 0
                        ? `${dist.pendingApplicationsCount} টি আবেদন পর্যালোচনায়`
                        : 'কোনো আবেদন জমা পড়েনি'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: UPAZILA OFFICER QUOTA GRID (STRICTLY 1 PER UPAZILA)
         ========================================================================= */}
      {activeSubTab === 'upazila_quotas' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="font-bold text-neutral-500">জেলা ফিল্টার:</span>
              <select
                value={upazilaDistrictFilter}
                onChange={(e) => setUpazilaDistrictFilter(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none font-bold cursor-pointer"
              >
                <option value="">সকল জেলা (All Districts)</option>
                {getAllDistrictQuotas().map((d) => (
                  <option key={d.districtName} value={d.districtName}>
                    {d.districtName} ({d.divisionName})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-bold text-neutral-500">
              মোট উপজেলা কোটা প্রদর্শন: {upazilaQuotas.length} টি
            </span>
          </div>

          {/* Upazila Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {upazilaQuotas.map((upz) => (
              <div
                key={`${upz.districtName}-${upz.upazilaName}`}
                className={`p-4 rounded-3xl border transition-all ${
                  upz.hasActiveOfficer
                    ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/60 shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">
                    {upz.districtName}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      upz.hasActiveOfficer
                        ? 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}
                  >
                    {upz.hasActiveOfficer ? '১/১ পূর্ণ (Occupied)' : 'আসন খালি (Vacant)'}
                  </span>
                </div>

                <h4 className="font-black text-sm text-neutral-900 dark:text-white">
                  {upz.upazilaName} উপজেলা
                </h4>

                {upz.hasActiveOfficer ? (
                  <div className="mt-3 p-2.5 rounded-2xl bg-white dark:bg-neutral-800/80 border border-teal-100 dark:border-teal-900/50 space-y-1 text-xs">
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block">
                      দায়িত্বপ্রাপ্ত অফিসার:
                    </span>
                    <div className="font-bold text-neutral-900 dark:text-white">
                      {upz.activeOfficerName}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      আইডি: {upz.activeOfficerMemberId || upz.activeOfficerId}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-1">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                      আসন খালি রয়েছে
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      {upz.pendingApplicationsCount > 0
                        ? `${upz.pendingApplicationsCount} টি আবেদন জমা`
                        : 'আবেদন গ্রহণ করা হচ্ছে'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: APPLICATION FULL PROFILE DETAILS
         ========================================================================= */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 block">
                  {viewingApp.trackingNumber}
                </span>
                <h3 className="text-base font-black text-neutral-900 dark:text-white">
                  {viewingApp.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500 font-bold block">আবেদনকৃত পদ:</span>
                  <span className="font-extrabold text-neutral-900 dark:text-white">
                    {viewingApp.roleType === 'admin'
                      ? 'জেলা অ্যাডমিন (District Admin)'
                      : viewingApp.roleType === 'operational_officer'
                      ? 'অপারেশনাল অফিসার (Operational Officer)'
                      : 'প্রোডাক্ট ডেলিভারি ম্যান (Delivery Rider)'}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 font-bold block">এলাকা:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {viewingApp.upazila ? viewingApp.upazila + ', ' : ''}
                    {viewingApp.district}, {viewingApp.division}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 font-bold block">মোবাইল নম্বর:</span>
                  <span className="font-mono">{viewingApp.mobileNumber}</span>
                </div>

                <div>
                  <span className="text-neutral-500 font-bold block">NID নম্বর:</span>
                  <span className="font-mono">{viewingApp.nationalId}</span>
                </div>

                {viewingApp.email && (
                  <div>
                    <span className="text-neutral-500 font-bold block">ইমেইল:</span>
                    <span>{viewingApp.email}</span>
                  </div>
                )}

                {viewingApp.dateOfBirth && (
                  <div>
                    <span className="text-neutral-500 font-bold block">জন্ম তারিখ:</span>
                    <span>{viewingApp.dateOfBirth}</span>
                  </div>
                )}
              </div>

              {viewingApp.fullAddress && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl">
                  <span className="text-neutral-500 font-bold block">পূর্ণ ঠিকানা:</span>
                  <p>{viewingApp.fullAddress}</p>
                </div>
              )}

              {viewingApp.educationalQualification && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl">
                  <span className="text-neutral-500 font-bold block">শিক্ষাগত যোগ্যতা:</span>
                  <p>{viewingApp.educationalQualification} (অভিজ্ঞতা: {viewingApp.experienceYears})</p>
                </div>
              )}

              {viewingApp.previousExperience && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl">
                  <span className="text-neutral-500 font-bold block">পূর্ব অভিজ্ঞতা:</span>
                  <p>{viewingApp.previousExperience}</p>
                </div>
              )}

              {viewingApp.statementOfPurpose && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl">
                  <span className="text-neutral-500 font-bold block">আবেদনের উদ্দেশ্য:</span>
                  <p>{viewingApp.statementOfPurpose}</p>
                </div>
              )}

              {viewingApp.vehicleType && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-neutral-500 font-bold block">বাহনের ধরন:</span>
                    <span className="font-bold">{viewingApp.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 font-bold block">জরুরি যোগাযোগ:</span>
                    <span className="font-mono">{viewingApp.emergencyContact} ({viewingApp.emergencyContactRelation})</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setViewingApp(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>

              {viewingApp.status !== 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(viewingApp.id);
                    setViewingApp(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  অনুমোদন দিন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REJECTION REASON DIALOG
         ========================================================================= */}
      {rejectingAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-black text-sm text-neutral-900 dark:text-white">
                আবেদন বাতিলের কারণ উল্লেখ করুন
              </h4>
            </div>

            <p className="text-xs text-neutral-500">
              আবেদনকারী ট্র্যাকিং সিস্টেমে এই কারণটি দেখতে পারবেন।
            </p>

            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="বাতিলের কারণ লিখুন..."
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs outline-none resize-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingAppId(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
