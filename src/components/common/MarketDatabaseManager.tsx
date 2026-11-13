/**
 * Searchable Market/Bazar Database Management Component
 * Supports Role-Based Permissions:
 * - Admin: Full CRUD (Add, Edit, Delete) across all areas
 * - Operations Partner: Add in assigned area, Edit own markets, restricted access
 * - General/Vendor/Customer: Searchable Read-Only view with Google Maps location links
 * 
 * Hierarchy: Division -> District -> Upazila -> Union -> Ward -> Market/Bazar
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState, useMemo } from 'react';
import { MarketItem, MarketType, UserRole } from '../../types';
import { useBDLocalDatabase } from '../../context/BDLocalDatabaseContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  BD_DIVISIONS,
  getDistrictsList,
  getUpazilasList,
  getUnionsList
} from '../../lib/bd-locations';
import { MarketAnalytics } from './MarketAnalytics';
import { MarketAuditLogSidebar } from './MarketAuditLogSidebar';
import { MarketMapView } from './MarketMapView';
import {
  Store,
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  ShoppingBag,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  Info,
  BarChart3,
  Download,
  FileSpreadsheet,
  History
} from 'lucide-react';

interface MarketDatabaseManagerProps {
  userRole?: UserRole;
  currentUserId?: string;
  currentUserName?: string;
  assignedArea?: {
    division?: string;
    district?: string;
    upazila?: string;
    unionName?: string;
    ward?: string;
  };
  className?: string;
}

const MARKET_TYPES: { id: MarketType; labelBn: string; labelEn: string; color: string }[] = [
  { id: 'Daily Market', labelBn: 'দৈনিক কাঁচাবাজার (Daily Market)', labelEn: 'Daily Market', color: 'emerald' },
  { id: 'Weekly Hat', labelBn: 'সাপ্তাহিক হাট (Weekly Hat)', labelEn: 'Weekly Hat', color: 'amber' },
  { id: 'Shopping Mall', labelBn: 'শপিং মল (Shopping Mall)', labelEn: 'Shopping Mall', color: 'purple' },
  { id: 'Super Shop', labelBn: 'সুপার শপ (Super Shop)', labelEn: 'Super Shop', color: 'blue' },
  { id: 'Wholesale Market', labelBn: 'পাইকারী বাজার (Wholesale)', labelEn: 'Wholesale Market', color: 'indigo' },
  { id: 'Local Market', labelBn: 'স্থানীয় সাধারণ বাজার (Local Market)', labelEn: 'Local Market', color: 'teal' },
  { id: 'Other', labelBn: 'অন্যান্য মার্কেট/বাজার (Other)', labelEn: 'Other', color: 'neutral' }
];

export const MarketDatabaseManager: React.FC<MarketDatabaseManagerProps> = ({
  userRole = 'customer',
  currentUserId,
  currentUserName,
  assignedArea,
  className = ''
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { addNotification } = useNotifications();
  const {
    markets,
    addMarket,
    editMarket,
    deleteMarket,
    getMergedWards,
    marketLogs,
    clearMarketLogs
  } = useBDLocalDatabase();

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isPartner = userRole === 'operations_partner';
  const canManage = isAdmin || isPartner;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>(
    isPartner && assignedArea?.division ? assignedArea.division : ''
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    isPartner && assignedArea?.district ? assignedArea.district : ''
  );
  const [selectedUpazila, setSelectedUpazila] = useState<string>(
    isPartner && assignedArea?.upazila ? assignedArea.upazila : ''
  );
  const [selectedUnion, setSelectedUnion] = useState<string>(
    isPartner && assignedArea?.unionName ? assignedArea.unionName : ''
  );
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [showMapView, setShowMapView] = useState<boolean>(true);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<MarketItem | null>(null);

  // Form Fields
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formType, setFormType] = useState<MarketType>('Daily Market');
  const [formDivision, setFormDivision] = useState(
    isPartner && assignedArea?.division ? assignedArea.division : BD_DIVISIONS[0].nameBn
  );
  const [formDistrict, setFormDistrict] = useState('');
  const [formUpazila, setFormUpazila] = useState('');
  const [formUnion, setFormUnion] = useState('');
  const [formWard, setFormWard] = useState('');
  const [formGoogleMapsUrl, setFormGoogleMapsUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Dependent cascading options for filters
  const filterDistricts = useMemo(
    () => (selectedDivision ? getDistrictsList(selectedDivision) : []),
    [selectedDivision]
  );
  const filterUpazilas = useMemo(
    () => (selectedDivision && selectedDistrict ? getUpazilasList(selectedDivision, selectedDistrict) : []),
    [selectedDivision, selectedDistrict]
  );
  const filterUnions = useMemo(
    () => (selectedDivision && selectedDistrict && selectedUpazila ? getUnionsList(selectedDivision, selectedDistrict, selectedUpazila) : []),
    [selectedDivision, selectedDistrict, selectedUpazila]
  );
  const filterWards = useMemo(
    () => (selectedDivision && selectedDistrict && selectedUpazila && selectedUnion ? getMergedWards(selectedDivision, selectedDistrict, selectedUpazila, selectedUnion) : []),
    [selectedDivision, selectedDistrict, selectedUpazila, selectedUnion]
  );

  // Form cascading options
  const formDistricts = useMemo(() => getDistrictsList(formDivision), [formDivision]);
  const formUpazilas = useMemo(() => (formDistrict ? getUpazilasList(formDivision, formDistrict) : []), [formDivision, formDistrict]);
  const formUnions = useMemo(() => (formDistrict && formUpazila ? getUnionsList(formDivision, formDistrict, formUpazila) : []), [formDivision, formDistrict, formUpazila]);
  const formWards = useMemo(() => (formDistrict && formUpazila && formUnion ? getMergedWards(formDivision, formDistrict, formUpazila, formUnion) : []), [formDivision, formDistrict, formUpazila, formUnion]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingMarket(null);
    setFormNameBn('');
    setFormNameEn('');
    setFormType('Daily Market');

    const initDiv = isPartner && assignedArea?.division ? assignedArea.division : BD_DIVISIONS[0].nameBn;
    setFormDivision(initDiv);

    const dists = getDistrictsList(initDiv);
    const initDist = isPartner && assignedArea?.district ? assignedArea.district : (dists[0]?.nameBn || '');
    setFormDistrict(initDist);

    const upazs = getUpazilasList(initDiv, initDist);
    const initUpaz = isPartner && assignedArea?.upazila ? assignedArea.upazila : (upazs[0]?.nameBn || '');
    setFormUpazila(initUpaz);

    const unis = getUnionsList(initDiv, initDist, initUpaz);
    const initUni = isPartner && assignedArea?.unionName ? assignedArea.unionName : (unis[0]?.nameBn || '');
    setFormUnion(initUni);

    const wrds = getMergedWards(initDiv, initDist, initUpaz, initUni);
    setFormWard(wrds[0]?.wardNoBn || 'ওয়ার্ড ০১');

    setFormGoogleMapsUrl(`https://maps.google.com/?q=${encodeURIComponent(`${initUni} Market`)}`);
    setFormStatus('Active');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: MarketItem) => {
    // Permission check for partner
    if (isPartner) {
      const matchScope =
        !assignedArea?.division || item.division === assignedArea.division;
      if (!matchScope) {
        addNotification({
          title: isBn ? 'অনুমতি নেই' : 'Permission Denied',
          message: isBn ? 'আপনি শুধুমাত্র আপনার অর্পিত এলাকার মার্কেট সম্পাদনা করতে পারবেন।' : 'You can only edit markets inside your assigned area.',
          type: 'warning'
        });
        return;
      }
    }

    setEditingMarket(item);
    setFormNameBn(item.nameBn);
    setFormNameEn(item.nameEn);
    setFormType(item.marketType);
    setFormDivision(item.division);
    setFormDistrict(item.district);
    setFormUpazila(item.upazila);
    setFormUnion(item.unionName);
    setFormWard(item.ward);
    setFormGoogleMapsUrl(item.googleMapsUrl);
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameBn.trim() || !formGoogleMapsUrl.trim() || !formWard) {
      addNotification({
        title: isBn ? 'তথ্য অসম্পূর্ণ' : 'Incomplete Form',
        message: isBn ? 'অনুগ্রহ করে বাজারের নাম, ওয়ার্ড ও গুগল ম্যাপ লোকেশন পূরণ করুন।' : 'Please fill Market Name, Ward and Google Maps Location.',
        type: 'error'
      });
      return;
    }

    // Partner Area Security Validation
    if (isPartner && assignedArea) {
      if (assignedArea.division && formDivision !== assignedArea.division) {
        addNotification({
          title: isBn ? 'সীমানা লঙ্ঘন' : 'Scope Violation',
          message: isBn ? `আপনি শুধুমাত্র ${assignedArea.division} বিভাগে মার্কেট যোগ করতে পারবেন।` : `You can only add markets in ${assignedArea.division}.`,
          type: 'error'
        });
        return;
      }
    }

    const actorInfo = {
      name: currentUserName || (isAdmin ? 'System Admin' : 'Operations Partner'),
      role: userRole
    };

    if (editingMarket) {
      editMarket(
        editingMarket.id,
        {
          nameBn: formNameBn.trim(),
          nameEn: formNameEn.trim() || formNameBn.trim(),
          marketType: formType,
          division: formDivision,
          district: formDistrict,
          upazila: formUpazila,
          unionName: formUnion,
          ward: formWard,
          googleMapsUrl: formGoogleMapsUrl.trim(),
          status: formStatus
        },
        actorInfo
      );

      addNotification({
        title: isBn ? 'মার্কেট আপডেট সফল' : 'Market Updated',
        message: `${formNameBn} ${isBn ? 'সফলভাবে আপডেট করা হয়েছে।' : 'updated successfully.'}`,
        type: 'info'
      });
    } else {
      addMarket(
        {
          nameBn: formNameBn.trim(),
          nameEn: formNameEn.trim() || formNameBn.trim(),
          marketType: formType,
          division: formDivision,
          district: formDistrict,
          upazila: formUpazila,
          unionName: formUnion,
          ward: formWard,
          googleMapsUrl: formGoogleMapsUrl.trim(),
          status: formStatus,
          addedByRole: isAdmin ? 'admin' : 'operations_partner',
          addedByUserId: currentUserId,
          addedByUserName: currentUserName
        },
        actorInfo
      );

      addNotification({
        title: isBn ? 'নতুন মার্কেট যুক্ত হয়েছে' : 'New Market Created',
        message: `${formNameBn} ${isBn ? 'ডাটাবেজে যুক্ত করা হয়েছে।' : 'added to Market database.'}`,
        type: 'info'
      });
    }

    setIsModalOpen(false);
  };

  // Delete Handler
  const handleDelete = (item: MarketItem) => {
    if (!isAdmin) {
      addNotification({
        title: isBn ? 'অনুমতি নেই' : 'Permission Denied',
        message: isBn ? 'শুধুমাত্র সিস্টেম এডমিন মার্কেট মুছতে পারেন।' : 'Only System Admins can delete markets.',
        type: 'error'
      });
      return;
    }

    if (window.confirm(isBn ? `আপনি কি নিশ্চিতভাবে "${item.nameBn}" মুছতে চান?` : `Are you sure you want to delete "${item.nameBn}"?`)) {
      deleteMarket(item.id, {
        name: currentUserName || 'System Admin',
        role: userRole
      });
      addNotification({
        title: isBn ? 'মার্কেট মোছা হয়েছে' : 'Market Deleted',
        message: `${item.nameBn} ${isBn ? 'ডাটাবেজ থেকে মুছে ফেলা হয়েছে।' : 'removed from database.'}`,
        type: 'info'
      });
    }
  };

  // Filtered Markets
  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      // Role scope filter for Partner
      if (isPartner && assignedArea?.division) {
        if (m.division !== assignedArea.division) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const mBn = m.nameBn.toLowerCase().includes(q);
        const mEn = m.nameEn.toLowerCase().includes(q);
        const mType = m.marketType.toLowerCase().includes(q);
        const mWard = m.ward.toLowerCase().includes(q);
        const mUni = m.unionName.toLowerCase().includes(q);
        const mUpaz = m.upazila.toLowerCase().includes(q);
        if (!mBn && !mEn && !mType && !mWard && !mUni && !mUpaz) return false;
      }

      // Dropdown filters
      if (selectedDivision && m.division !== selectedDivision) return false;
      if (selectedDistrict && m.district !== selectedDistrict) return false;
      if (selectedUpazila && m.upazila !== selectedUpazila) return false;
      if (selectedUnion && m.unionName !== selectedUnion) return false;
      if (selectedWard && m.ward !== selectedWard) return false;
      if (selectedType && m.marketType !== selectedType) return false;
      if (selectedStatus && m.status !== selectedStatus) return false;

      return true;
    });
  }, [
    markets,
    searchTerm,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    selectedUnion,
    selectedWard,
    selectedType,
    selectedStatus,
    isPartner,
    assignedArea
  ]);

  // Export Filtered Markets to CSV
  const handleExportCSV = () => {
    if (filteredMarkets.length === 0) {
      addNotification({
        title: isBn ? 'কোন তথ্য নেই' : 'No Data',
        message: isBn ? 'ডাউনলোড করার জন্য কোন মার্কেট পাওয়া যায়নি।' : 'No markets available to export based on current filters.',
        type: 'warning'
      });
      return;
    }

    // UTF-8 BOM for Bengali unicode compatibility in Excel
    const BOM = '\uFEFF';
    const headers = [
      'Market ID',
      'Market Name (Bangla)',
      'Market Name (English)',
      'Market Type',
      'Division',
      'District',
      'Upazila',
      'Union/Municipality',
      'Ward',
      'Google Maps URL',
      'Status'
    ];

    const csvRows = filteredMarkets.map((m) => [
      `"${m.id}"`,
      `"${(m.nameBn || '').replace(/"/g, '""')}"`,
      `"${(m.nameEn || '').replace(/"/g, '""')}"`,
      `"${(m.marketType || '').replace(/"/g, '""')}"`,
      `"${(m.division || '').replace(/"/g, '""')}"`,
      `"${(m.district || '').replace(/"/g, '""')}"`,
      `"${(m.upazila || '').replace(/"/g, '""')}"`,
      `"${(m.unionName || '').replace(/"/g, '""')}"`,
      `"${(m.ward || '').replace(/"/g, '""')}"`,
      `"${(m.googleMapsUrl || '').replace(/"/g, '""')}"`,
      `"${(m.status || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = BOM + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const timestamp = new Date().toISOString().slice(0, 10);
    const wardSlug = selectedWard ? selectedWard.replace(/\s+/g, '_') : 'all_wards';
    link.setAttribute('download', `ghorer_bazar_markets_${wardSlug}_${timestamp}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification({
      title: isBn ? 'সিএসভি এক্সপোর্ট সফল' : 'CSV Export Successful',
      message: `${filteredMarkets.length} ${isBn ? 'টি মার্কেট সফলভাবে সিএসভি ফাইল হিসেবে সংগৃহীত হয়েছে।' : 'markets exported to CSV successfully.'}`,
      type: 'info'
    });
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'মার্কেট / বাজার সেন্ট্রাল ডাটাবেজ (Market Database)' : 'Market & Bazar Database'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                {markets.length} {isBn ? 'টি সক্রিয় মার্কেট' : 'Active Markets'}
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isBn
                ? 'ওয়ার্ডভিত্তিক নির্দিষ্ট মার্কেট / বাজার তালিকা। পরবর্তী সকল ডিলার, শপ, ভেন্ডর ও প্রোডাক্ট লিঙ্কিংয়ের জন্য ব্যবহৃত।'
                : 'Ward-linked Market / Bazar Directory. Used across Dealers, Shops, Vendors & Product assignments.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMapView(!showMapView)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              showMapView
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
            title={isBn ? 'ম্যাপ ভিউ চালু বা বন্ধ করুন' : 'Toggle spatial map view'}
          >
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isBn ? 'ম্যাপ ভিউ' : 'Map View'}</span>
          </button>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              showAnalytics
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isBn ? 'ভিজ্যুয়াল অ্যানালিটিক্স' : 'Visual Analytics'}</span>
          </button>

          <button
            onClick={() => setIsAuditLogOpen(true)}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 relative"
            title={isBn ? 'মার্কেট ডাটাবেজের সকল পরিবর্তন, সংযোজন ও বর্জনের অডিট লগ দেখুন' : 'View market database activity audit trail'}
          >
            <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{isBn ? 'অডিট লগ' : 'Audit Logs'}</span>
            {marketLogs.length > 0 && (
              <span className="bg-purple-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {marketLogs.length}
              </span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            title={isBn ? 'বর্তমান ফিল্টারকৃত তালিকা CSV ফাইল ফরম্যাটে ডাউনলোড করুন' : 'Export current filtered markets to CSV'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
          </button>

          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'নতুন মার্কেট যোগ করুন' : 'Add New Market'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Scope constraint badge for Partner */}
      {isPartner && assignedArea?.unionName && (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 p-3 rounded-xl flex items-center gap-2 text-xs text-purple-900 dark:text-purple-200">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            {isBn ? 'আপনার অর্পিত এলাকা কভারেজ:' : 'Your Coverage Area Scope:'}{' '}
            <strong>
              {assignedArea.division} → {assignedArea.district} → {assignedArea.upazila} → {assignedArea.unionName}
            </strong>
          </span>
        </div>
      )}

      {/* Spatial Planning Google Map Section */}
      {showMapView && (
        <MarketMapView
          markets={filteredMarkets}
          selectedWard={selectedWard}
          selectedUnion={selectedUnion}
          onEditMarket={handleOpenEditModal}
        />
      )}

      {/* Visual Analytics Chart Section (Recharts) */}
      {showAnalytics && (
        <MarketAnalytics
          markets={markets}
          selectedDivision={selectedDivision}
          selectedDistrict={selectedDistrict}
          selectedUpazila={selectedUpazila}
          selectedUnion={selectedUnion}
          selectedWard={selectedWard}
          onSelectWard={(w) => setSelectedWard(w)}
          availableWards={filterWards.map((w) => w.wardNoBn)}
        />
      )}

      {/* Search Bar & Filters Section */}
      <div className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder={isBn ? 'বাজারের নাম, ওয়ার্ড বা ধরন দিয়ে খুঁজুন...' : 'Search market by name, ward, or type...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-9 pr-4 py-2.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Reset Filters button */}
          {(searchTerm || selectedDivision || selectedDistrict || selectedUpazila || selectedUnion || selectedWard || selectedType || selectedStatus) && (
            <button
              onClick={() => {
                setSearchTerm('');
                if (!isPartner) {
                  setSelectedDivision('');
                  setSelectedDistrict('');
                  setSelectedUpazila('');
                  setSelectedUnion('');
                }
                setSelectedWard('');
                setSelectedType('');
                setSelectedStatus('');
              }}
              className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-200 font-bold text-xs rounded-xl transition-all shrink-0"
            >
              {isBn ? 'ফিল্টার রিসেট' : 'Reset Filters'}
            </button>
          )}
        </div>

        {/* Hierarchy Cascade Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {/* Division */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'বিভাগ' : 'Division'}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDistrict('');
                setSelectedUpazila('');
                setSelectedUnion('');
                setSelectedWard('');
              }}
              disabled={isPartner && !!assignedArea?.division}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল বিভাগ' : 'All Divisions'}</option>
              {BD_DIVISIONS.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'জেলা' : 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedUpazila('');
                setSelectedUnion('');
                setSelectedWard('');
              }}
              disabled={!selectedDivision || (isPartner && !!assignedArea?.district)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
              {filterDistricts.map((d) => (
                <option key={d.nameBn} value={d.nameBn}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'উপজেলা' : 'Upazila'}
            </label>
            <select
              value={selectedUpazila}
              onChange={(e) => {
                setSelectedUpazila(e.target.value);
                setSelectedUnion('');
                setSelectedWard('');
              }}
              disabled={!selectedDistrict || (isPartner && !!assignedArea?.upazila)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল উপজেলা' : 'All Upazilas'}</option>
              {filterUpazilas.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {isBn ? u.nameBn : u.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Union */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'ইউনিয়ন' : 'Union'}
            </label>
            <select
              value={selectedUnion}
              onChange={(e) => {
                setSelectedUnion(e.target.value);
                setSelectedWard('');
              }}
              disabled={!selectedUpazila || (isPartner && !!assignedArea?.unionName)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল ইউনিয়ন' : 'All Unions'}</option>
              {filterUnions.map((u) => (
                <option key={u.nameBn} value={u.nameBn}>
                  {isBn ? u.nameBn : u.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Ward */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'ওয়ার্ড' : 'Ward'}
            </label>
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              disabled={!selectedUnion}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল ওয়ার্ড' : 'All Wards'}</option>
              {filterWards.map((w) => (
                <option key={w.wardNoBn} value={w.wardNoBn}>
                  {isBn ? w.wardNoBn : w.wardNoEn}
                </option>
              ))}
            </select>
          </div>

          {/* Market Type */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'বাজারের ধরন' : 'Market Type'}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল ধরন' : 'All Types'}</option>
              {MARKET_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {isBn ? t.labelBn : t.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mb-1">
              {isBn ? 'স্ট্যাটাস' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5 text-neutral-900 dark:text-white"
            >
              <option value="">{isBn ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
              <option value="Active">{isBn ? 'সক্রিয় (Active)' : 'Active'}</option>
              <option value="Inactive">{isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Markets Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-bold">
          <span>
            {isBn ? `খুঁজে পাওয়া গেছে ${filteredMarkets.length} টি মার্কেট` : `Found ${filteredMarkets.length} Markets`}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
            {isBn ? 'সকল মার্কেট গুগল ম্যাপ লোকেশন ও ওয়ার্ডের সাথে সংযুক্ত' : 'Linked with Ward & Google Maps coordinates'}
          </span>
        </div>

        {filteredMarkets.length === 0 ? (
          <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-dashed border-neutral-300 dark:border-neutral-700 p-8 rounded-2xl text-center space-y-2">
            <Store className="w-8 h-8 text-neutral-400 mx-auto" />
            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
              {isBn ? 'কোন মার্কেট পাওয়া যায়নি' : 'No Markets Found'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isBn ? 'অনুগ্রহ করে সার্চ কীওয়ার্ড বা ফিল্টার প্যানেল পরিবর্তন করে চেষ্টা করুন।' : 'Try adjusting your search query or dropdown filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarkets.map((market) => {
              const typeObj = MARKET_TYPES.find((t) => t.id === market.marketType) || MARKET_TYPES[0];
              const isOwner = market.addedByUserId === currentUserId;

              return (
                <div
                  key={market.id}
                  className="bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Top Row: Type & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60">
                        {isBn ? typeObj.labelBn : typeObj.labelEn}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            market.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {market.status === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{market.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Market Name */}
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 dark:text-white leading-snug">
                        {market.nameBn}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        {market.nameEn}
                      </p>
                    </div>

                    {/* Location Hierarchy Badge */}
                    <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 p-2 rounded-xl text-xs space-y-1 text-neutral-700 dark:text-neutral-300">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span>{market.ward}</span>
                        <span className="text-neutral-400">({market.unionName})</span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-5">
                        {market.upazila}, {market.district}, {market.division}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Actions & Google Maps Link */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                    {/* Google Maps link */}
                    <a
                      href={market.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isBn ? 'গুগল ম্যাপস' : 'Google Maps'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Manage Actions */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(market)}
                          className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-all"
                          title={isBn ? 'সম্পাদনা করুন' : 'Edit Market'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(market)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-all"
                            title={isBn ? 'মুছে ফেলুন' : 'Delete Market'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Market Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingMarket
                    ? isBn
                      ? 'মার্কেট তথ্য সম্পাদনা'
                      : 'Edit Market Information'
                    : isBn
                    ? 'নতুন মার্কেট / বাজার নিবন্ধন'
                    : 'Add New Market / Bazar'}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isBn ? 'মার্কেট / বাজারের নাম (বাংলা) *' : 'Market Name (Bangla) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isBn ? 'যেমন: সাহেব বাজার কাঁচাবাজার' : 'e.g. সাহেব বাজার কাঁচাবাজার'}
                    value={formNameBn}
                    onChange={(e) => setFormNameBn(e.target.value)}
                    className="w-full font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isBn ? 'মার্কেট / বাজারের নাম (ইংরেজি)' : 'Market Name (English)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isBn ? 'যেমন: Saheb Bazar Market' : 'e.g. Saheb Bazar Market'}
                    value={formNameEn}
                    onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Market Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isBn ? 'বাজারের ধরন (Market Type) *' : 'Market Type *'}
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as MarketType)}
                    className="w-full font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                  >
                    {MARKET_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {isBn ? t.labelBn : t.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    {isBn ? 'সার্ভিস স্ট্যাটাস (Status) *' : 'Status *'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white"
                  >
                    <option value="Active">{isBn ? 'সক্রিয় (Active)' : 'Active'}</option>
                    <option value="Inactive">{isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
                  </select>
                </div>
              </div>

              {/* Hierarchy Selection */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl space-y-3">
                <div className="text-[11px] font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'প্রশাসনিক এরিয়া লিঙ্কিং (Hierarchy Location)' : 'Administrative Location Hierarchy'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'বিভাগ *' : 'Division *'}
                    </label>
                    <select
                      value={formDivision}
                      onChange={(e) => {
                        setFormDivision(e.target.value);
                        const dists = getDistrictsList(e.target.value);
                        setFormDistrict(dists[0]?.nameBn || '');
                      }}
                      disabled={isPartner && !!assignedArea?.division}
                      className="w-full font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5"
                    >
                      {BD_DIVISIONS.map((d) => (
                        <option key={d.nameBn} value={d.nameBn}>
                          {isBn ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'জেলা *' : 'District *'}
                    </label>
                    <select
                      value={formDistrict}
                      onChange={(e) => {
                        setFormDistrict(e.target.value);
                        const upazs = getUpazilasList(formDivision, e.target.value);
                        setFormUpazila(upazs[0]?.nameBn || '');
                      }}
                      disabled={isPartner && !!assignedArea?.district}
                      className="w-full font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5"
                    >
                      {formDistricts.map((d) => (
                        <option key={d.nameBn} value={d.nameBn}>
                          {isBn ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'উপজেলা *' : 'Upazila *'}
                    </label>
                    <select
                      value={formUpazila}
                      onChange={(e) => {
                        setFormUpazila(e.target.value);
                        const unis = getUnionsList(formDivision, formDistrict, e.target.value);
                        setFormUnion(unis[0]?.nameBn || '');
                      }}
                      disabled={isPartner && !!assignedArea?.upazila}
                      className="w-full font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5"
                    >
                      {formUpazilas.map((u) => (
                        <option key={u.nameBn} value={u.nameBn}>
                          {isBn ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isBn ? 'ইউনিয়ন / পৌরসভা *' : 'Union / Municipality *'}
                    </label>
                    <select
                      value={formUnion}
                      onChange={(e) => {
                        setFormUnion(e.target.value);
                        const wrds = getMergedWards(formDivision, formDistrict, formUpazila, e.target.value);
                        setFormWard(wrds[0]?.wardNoBn || 'ওয়ার্ড ০১');
                      }}
                      disabled={isPartner && !!assignedArea?.unionName}
                      className="w-full font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg p-1.5"
                    >
                      {formUnions.map((u) => (
                        <option key={u.nameBn} value={u.nameBn}>
                          {isBn ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                      {isBn ? 'সংযুক্ত ওয়ার্ড (Ward Belongs To) *' : 'Ward Belongs To *'}
                    </label>
                    <select
                      value={formWard}
                      onChange={(e) => setFormWard(e.target.value)}
                      required
                      className="w-full font-black bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-lg p-1.5"
                    >
                      {formWards.map((w) => (
                        <option key={w.wardNoBn} value={w.wardNoBn}>
                          {isBn ? w.wardNoBn : w.wardNoEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Google Maps Link Required */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                  <span>{isBn ? 'গুগল ম্যাপস লোকেশন লিঙ্ক (Google Maps Location) *' : 'Google Maps Location Link *'}</span>
                  <span className="text-[10px] text-rose-500 font-bold">* আবশ্যক</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://maps.google.com/?q=24.368,88.601"
                    value={formGoogleMapsUrl}
                    onChange={(e) => setFormGoogleMapsUrl(e.target.value)}
                    className="w-full font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {isBn ? 'গুগল ম্যাপ থেকে কপি করা স্থান শেয়ার লিঙ্ক অথবা অক্ষাংশ-দ্রাঘিমাংশ লিঙ্ক প্রদান করুন।' : 'Provide a valid Google Maps location or share link.'}
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingMarket ? (isBn ? 'আপডেট করুন' : 'Update Market') : (isBn ? 'সংরক্ষণ করুন' : 'Save Market')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Sidebar */}
      <MarketAuditLogSidebar
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={marketLogs}
        onClearLogs={clearMarketLogs}
        userRole={userRole}
      />
    </div>
  );
};
