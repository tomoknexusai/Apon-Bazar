/**
 * Super Admin Delivery Management System
 * Project: Apon Bazar (Ghorer Bazar BD)
 * 
 * Features:
 * 1. Dealer Point Address -> Customer Delivery Address road distance engine
 * 2. Normal Courier Slabs (0–10 KG) with per-zone rates
 * 3. Local Heavy Delivery Slabs (10–50 KG) with FIXED distance tiers
 * 4. Heavy Cargo (50+ KG), Road Cargo / Covered Van, Air Cargo formula
 * 5. Dealer Points Manager (CRUD + coverage)
 * 6. Local Delivery Man (Rider) Incentive & Settlement rules
 * 7. Manual Order Delivery Override with full audit trail
 * 8. Comprehensive Interactive Rate Simulator
 */

import React, { useState, useMemo } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import {
  SuperAdminDeliveryConfig,
  DeliveryZoneType,
  DeliveryMode,
  CourierWeightSlab,
  LocalHeavyDistanceSlab,
  DealerPoint,
  CargoWeightTierConfig
} from '../../types';
import {
  calculateCourierShippingCharge,
  validateDeliveryConfig,
  DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG,
  DEFAULT_COURIER_SLABS,
  DEFAULT_LOCAL_HEAVY_CONFIG,
  DEFAULT_CARGO_TIERS,
  DEFAULT_ROAD_CARGO_CONFIG,
  DEFAULT_AIR_CARGO_CONFIG,
  DEFAULT_RIDER_INCENTIVE,
  DEFAULT_DEALER_POINTS,
  formatWeightDisplay
} from '../../lib/deliveryWeightCalculator';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import {
  getAllDeliveryZones,
  getStoredZoneRateConfig,
  saveStoredZoneRateConfig,
  saveZoneOverride,
  getZoneByUpazila,
  DeliveryZone,
  ZoneDeliveryRateConfig
} from '../../services/DeliveryZoneService';
import { saveRegisteredDealer } from '../../services/DealerInventoryService';
import { OperationOfficeManagement } from './OperationOfficeManagement';
import {
  Truck,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Scale,
  Navigation,
  Calculator,
  Sliders,
  Info,
  Plus,
  Trash2,
  Edit3,
  Search,
  History,
  Bike,
  Plane,
  Package,
  Loader2,
  Compass,
  ArrowRight,
  Layers,
  Building2
} from 'lucide-react';

type ManagementTab =
  | 'delivery_zones'
  | 'operation_offices'
  | 'courier_and_local_heavy'
  | 'cargo_and_air'
  | 'dealer_points'
  | 'rider_incentives'
  | 'order_override'
  | 'audit_logs'
  | 'rate_simulator';

export const DeliveryChargeManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    deliveryConfig,
    updateDeliveryConfig,
    resetDeliveryConfigToDefault,
    orders,
    overrideOrderDeliveryCharge,
    addDealerPoint,
    updateDealerPoint,
    deleteDealerPoint
  } = useECommerce();

  // Top-level authorization check
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      currentUser.primaryRole === 'super_admin' ||
      currentUser.primaryRole === 'founder' ||
      (Array.isArray(currentUser.roles) &&
        (currentUser.roles.includes('super_admin') || currentUser.roles.includes('founder'))) ||
      isImmutableSuperAdmin(currentUser)
    );
  }, [currentUser]);

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<ManagementTab>('delivery_zones');

  // Zone Foundation State (1 Upazila = 1 Zone)
  const [zoneRateConfig, setZoneRateConfig] = useState<ZoneDeliveryRateConfig>(() => getStoredZoneRateConfig());
  const [zoneSearchTerm, setZoneSearchTerm] = useState('');
  const [zoneDivisionFilter, setZoneDivisionFilter] = useState('all');
  const [zoneDistrictFilter, setZoneDistrictFilter] = useState('all');
  const [zoneSavedMsg, setZoneSavedMsg] = useState<string | null>(null);
  const [allZones, setAllZones] = useState<DeliveryZone[]>(() => getAllDeliveryZones());
  const [editingZonePoint, setEditingZonePoint] = useState<DeliveryZone | null>(null);
  const [zonePointEditForm, setZonePointEditForm] = useState({ pointName: '', pointAddress: '' });

  // Draft config for editing
  const [draftConfig, setDraftConfig] = useState<SuperAdminDeliveryConfig>(() => ({
    ...deliveryConfig,
    zones: {
      inside_dhaka: { ...deliveryConfig.zones.inside_dhaka },
      suburban_dhaka: { ...deliveryConfig.zones.suburban_dhaka },
      outside_dhaka: { ...deliveryConfig.zones.outside_dhaka }
    },
    distanceRule: { ...deliveryConfig.distanceRule },
    paurashavaRule: { ...deliveryConfig.paurashavaRule },
    defaultWeightRates: { ...deliveryConfig.defaultWeightRates },
    courierSlabs: deliveryConfig.courierSlabs?.map(s => ({ ...s })) || DEFAULT_COURIER_SLABS,
    localHeavyConfig: deliveryConfig.localHeavyConfig
      ? { ...deliveryConfig.localHeavyConfig, slabs: deliveryConfig.localHeavyConfig.slabs.map(s => ({ ...s })) }
      : DEFAULT_LOCAL_HEAVY_CONFIG,
    cargoTiers: deliveryConfig.cargoTiers?.map(t => ({ ...t })) || DEFAULT_CARGO_TIERS,
    roadCargoConfig: deliveryConfig.roadCargoConfig ? { ...deliveryConfig.roadCargoConfig } : DEFAULT_ROAD_CARGO_CONFIG,
    airCargoConfig: deliveryConfig.airCargoConfig ? { ...deliveryConfig.airCargoConfig } : DEFAULT_AIR_CARGO_CONFIG,
    dealerPoints: deliveryConfig.dealerPoints?.map(dp => ({ ...dp })) || DEFAULT_DEALER_POINTS,
    riderIncentive: deliveryConfig.riderIncentive ? { ...deliveryConfig.riderIncentive } : DEFAULT_RIDER_INCENTIVE,
    auditLogs: deliveryConfig.auditLogs ? [...deliveryConfig.auditLogs] : []
  }));

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dealer Point Form Modal / State
  const [editingDealerPoint, setEditingDealerPoint] = useState<DealerPoint | null>(null);
  const [showDealerModal, setShowDealerModal] = useState<boolean>(false);
  const [dealerFormData, setDealerFormData] = useState<Omit<DealerPoint, 'id'>>({
    name: '',
    tradeLicenseBusinessName: '',
    tradeLicenseNumber: '',
    dealerOwnerName: '',
    code: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    division: 'ঢাকা',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    unionOrArea: '',
    latitude: 23.8069,
    longitude: 90.3687,
    coverageRadiusKm: 25,
    isActive: true,
    supportedModes: ['motorcycle', 'courier', 'road_cargo']
  });

  // Manual Override Tab State
  const [overrideOrderId, setOverrideOrderId] = useState<string>('');
  const [overrideNewCharge, setOverrideNewCharge] = useState<number>(60);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [overrideStatusMsg, setOverrideStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Rate Simulator State
  const [simDealerId, setSimDealerId] = useState<string>(deliveryConfig.dealerPoints?.[0]?.id || 'dp-dhk-01');
  const [simZone, setSimZone] = useState<DeliveryZoneType>('inside_dhaka');
  const [simIsPaurashava, setSimIsPaurashava] = useState<boolean>(true);
  const [simWeightKg, setSimWeightKg] = useState<number>(0.5);
  const [simDistanceKm, setSimDistanceKm] = useState<number>(1);
  const [simMode, setSimMode] = useState<DeliveryMode | 'auto'>('auto');

  // Selected order for manual override
  const targetOrder = useMemo(() => {
    if (!overrideOrderId.trim()) return null;
    return orders.find(
      o =>
        o.id.toLowerCase() === overrideOrderId.trim().toLowerCase() ||
        o.invoiceNumber?.toLowerCase() === overrideOrderId.trim().toLowerCase() ||
        o.customerPhone?.includes(overrideOrderId.trim())
    );
  }, [overrideOrderId, orders]);

  const [isSavingRates, setIsSavingRates] = useState<boolean>(false);

  // Detect unsaved draft modifications compared to active deliveryConfig
  const isDirty = useMemo(() => {
    return JSON.stringify(draftConfig) !== JSON.stringify(deliveryConfig);
  }, [draftConfig, deliveryConfig]);

  // Handle Discard Draft Config & Restore to active persisted settings
  const handleDiscardDraft = () => {
    setDraftConfig({
      ...deliveryConfig,
      zones: {
        inside_dhaka: { ...deliveryConfig.zones.inside_dhaka },
        suburban_dhaka: { ...deliveryConfig.zones.suburban_dhaka },
        outside_dhaka: { ...deliveryConfig.zones.outside_dhaka }
      },
      distanceRule: { ...deliveryConfig.distanceRule },
      paurashavaRule: { ...deliveryConfig.paurashavaRule },
      defaultWeightRates: { ...deliveryConfig.defaultWeightRates },
      courierSlabs: deliveryConfig.courierSlabs?.map(s => ({ ...s })) || DEFAULT_COURIER_SLABS,
      localHeavyConfig: deliveryConfig.localHeavyConfig
        ? { ...deliveryConfig.localHeavyConfig, slabs: deliveryConfig.localHeavyConfig.slabs.map(s => ({ ...s })) }
        : DEFAULT_LOCAL_HEAVY_CONFIG,
      cargoTiers: deliveryConfig.cargoTiers?.map(t => ({ ...t })) || DEFAULT_CARGO_TIERS,
      roadCargoConfig: deliveryConfig.roadCargoConfig ? { ...deliveryConfig.roadCargoConfig } : DEFAULT_ROAD_CARGO_CONFIG,
      airCargoConfig: deliveryConfig.airCargoConfig ? { ...deliveryConfig.airCargoConfig } : DEFAULT_AIR_CARGO_CONFIG,
      dealerPoints: deliveryConfig.dealerPoints?.map(dp => ({ ...dp })) || DEFAULT_DEALER_POINTS,
      riderIncentive: deliveryConfig.riderIncentive ? { ...deliveryConfig.riderIncentive } : DEFAULT_RIDER_INCENTIVE,
      auditLogs: deliveryConfig.auditLogs ? [...deliveryConfig.auditLogs] : []
    });
    setValidationErrors([]);
    setSuccessMsg('সকল অসংরক্ষিত পরিবর্তন বাতিল করে সক্রিয় কনফিগারেশন রিস্টোর করা হয়েছে।');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Handle Save Draft Config
  const handleSaveAllRates = async () => {
    setValidationErrors([]);
    setSuccessMsg(null);

    const validation = validateDeliveryConfig(draftConfig);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSavingRates(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const res = updateDeliveryConfig(draftConfig, 'সুপার অ্যাডমিন রেট আপডেট করেছেন');
      if (res.success) {
        setSuccessMsg('ডেলিভারি ম্যানেজমেন্ট সিস্টেমের সমস্ত রেট সফলভাবে সংরক্ষিত হয়েছে!');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setValidationErrors(res.errors || [res.message]);
      }
    } finally {
      setIsSavingRates(false);
    }
  };

  // Handle Reset to Default
  const handleResetDefaults = () => {
    if (window.confirm('আপনি কি সমস্ত ডেলিভারি রেট সিস্টেম ডিফল্টে ফিরিয়ে আনতে চান?')) {
      resetDeliveryConfigToDefault();
      setDraftConfig({ ...DEFAULT_SUPER_ADMIN_DELIVERY_CONFIG });
      setSuccessMsg('ডিফল্ট ডেলিভারি কনফিগারেশনে সফলভাবে রিস্টোর করা হয়েছে।');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Handle Dealer Point Submit
  const handleDealerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tradeLicenseBusinessName = (dealerFormData.tradeLicenseBusinessName || dealerFormData.name).trim();
    if (!tradeLicenseBusinessName || !dealerFormData.address) {
      alert('অনুগ্রহ করে ট্রেড লাইসেন্স ব্যবসার নাম এবং ঠিকানা পূরণ করুন');
      return;
    }

    // Derive stable Zone from Division -> District -> Upazila
    const derivedZone = getZoneByUpazila(dealerFormData.upazila, dealerFormData.district, dealerFormData.division);
    const zoneId = derivedZone.zone_id;
    const zoneName = derivedZone.zone_name;

    const officialDealerPoint: DealerPoint = {
      ...dealerFormData,
      name: tradeLicenseBusinessName, // Official display name = Trade License Business Name
      tradeLicenseBusinessName,
      zoneId,
      zoneName,
      dealerId: dealerFormData.dealerId || dealerFormData.code || `DLR-${Math.floor(100 + Math.random() * 900)}`,
      id: editingDealerPoint ? editingDealerPoint.id : ((dealerFormData as any).id || `dp-${Date.now()}`)
    };

    // Synchronize with central dealer registry service
    saveRegisteredDealer({
      dealerId: officialDealerPoint.dealerId || officialDealerPoint.id,
      dealerOwnerName: officialDealerPoint.dealerOwnerName || officialDealerPoint.contactPerson || 'স্বত্বাধিকারী',
      tradeLicenseBusinessName,
      tradeLicenseNumber: officialDealerPoint.tradeLicenseNumber || 'TRAD/2026/001',
      contactPhone: officialDealerPoint.contactPhone,
      address: officialDealerPoint.address,
      division: officialDealerPoint.division,
      district: officialDealerPoint.district,
      upazila: officialDealerPoint.upazila,
      zoneId,
      zoneName,
      isActive: officialDealerPoint.isActive
    });

    if (editingDealerPoint) {
      updateDealerPoint(officialDealerPoint);
      setDraftConfig(prev => ({
        ...prev,
        dealerPoints: (prev.dealerPoints || []).map(p => p.id === officialDealerPoint.id ? officialDealerPoint : p)
      }));
    } else {
      addDealerPoint(officialDealerPoint);
      setDraftConfig(prev => ({
        ...prev,
        dealerPoints: [...(prev.dealerPoints || []), officialDealerPoint]
      }));
    }

    setShowDealerModal(false);
    setEditingDealerPoint(null);
  };

  // Handle Manual Order Delivery Override Submit
  const handleApplyOverride = () => {
    if (!targetOrder) {
      setOverrideStatusMsg({ success: false, text: 'অনুগ্রহ করে সঠিক অর্ডার আইডি নির্বাচন করুন।' });
      return;
    }
    if (overrideNewCharge < 0) {
      setOverrideStatusMsg({ success: false, text: 'ডেলিভারি চার্জ ঋণাত্মক হতে পারে না।' });
      return;
    }
    if (!overrideReason.trim()) {
      setOverrideStatusMsg({ success: false, text: 'ওভাররাইড করার নির্দিষ্ট কারণ লিখুন।' });
      return;
    }

    const res = overrideOrderDeliveryCharge(
      targetOrder.id,
      overrideNewCharge,
      overrideReason,
      currentUser?.fullName || 'সুপার অ্যাডমিন'
    );

    setOverrideStatusMsg({ success: res.success, text: res.message });
    if (res.success) {
      setOverrideReason('');
    }
  };

  // Zone Foundation Handlers (1 Upazila = 1 Zone)
  const handleSaveZoneRates = () => {
    const res = saveStoredZoneRateConfig(zoneRateConfig);
    if (res.success) {
      setZoneSavedMsg('জোন ডেলিভারি রেট সফলভাবে সংরক্ষিত ও আপডেট হয়েছে!');
      setTimeout(() => setZoneSavedMsg(null), 4000);
    } else {
      alert(res.message);
    }
  };

  const handleToggleZoneStatus = (zoneId: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    saveZoneOverride(zoneId, { status: nextStatus });
    setAllZones(getAllDeliveryZones());
  };

  const handleOpenEditZonePoint = (zone: DeliveryZone) => {
    setEditingZonePoint(zone);
    setZonePointEditForm({
      pointName: zone.zone_point_name || '',
      pointAddress: zone.zone_point_address || ''
    });
  };

  const handleSaveZonePointModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZonePoint) return;
    saveZoneOverride(editingZonePoint.zone_id, {
      zone_point_name: zonePointEditForm.pointName,
      zone_point_address: zonePointEditForm.pointAddress
    });
    setAllZones(getAllDeliveryZones());
    setEditingZonePoint(null);
  };

  const filteredZones = useMemo(() => {
    let list = allZones;
    if (zoneDivisionFilter !== 'all') {
      list = list.filter((z) => z.division_name === zoneDivisionFilter || z.division_id === zoneDivisionFilter);
    }
    if (zoneDistrictFilter !== 'all') {
      list = list.filter((z) => z.district_name === zoneDistrictFilter || z.district_id === zoneDistrictFilter);
    }
    const q = zoneSearchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (z) =>
          z.zone_name.toLowerCase().includes(q) ||
          z.zone_name_bn.toLowerCase().includes(q) ||
          z.upazila_name.toLowerCase().includes(q) ||
          z.district_name.toLowerCase().includes(q) ||
          z.division_name.toLowerCase().includes(q) ||
          z.zone_id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allZones, zoneDivisionFilter, zoneDistrictFilter, zoneSearchTerm]);

  // Live Simulator Calculation
  const simResult = useMemo(() => {
    const selectedDealer = (draftConfig.dealerPoints || DEFAULT_DEALER_POINTS).find(p => p.id === simDealerId) || DEFAULT_DEALER_POINTS[0];
    const dummyAddr = {
      id: 'sim-addr',
      userId: 'admin',
      title: 'Simulator Address',
      division: simZone === 'outside_dhaka' ? 'চট্টগ্রাম' : 'ঢাকা',
      district: simZone === 'inside_dhaka' ? 'ঢাকা' : (simZone === 'suburban_dhaka' ? 'গাজীপুর' : 'চট্টগ্রাম'),
      upazila: simZone === 'inside_dhaka' ? 'মিরপুর' : 'সদর',
      unionName: simIsPaurashava ? 'পৌরসভা' : 'ইউনিয়ন',
      area: 'সিমুলেটেড এলাকা',
      postalCode: '1200',
      isMandatoryServiceAddress: false,
      isPaurashava: simIsPaurashava,
      distanceKm: simDistanceKm,
      createdAt: '',
      updatedAt: ''
    };

    const weightGrams = Math.round(simWeightKg * 1000);
    const prefMode = simMode === 'auto' ? undefined : simMode;

    return calculateCourierShippingCharge(
      weightGrams,
      dummyAddr,
      undefined,
      simDistanceKm,
      draftConfig,
      prefMode,
      selectedDealer
    );
  }, [simDealerId, simZone, simIsPaurashava, simWeightKg, simDistanceKm, simMode, draftConfig]);

  if (!isAuthorized) {
    return (
      <div id="unauthorized-container" className="p-8 max-w-xl mx-auto my-12 bg-rose-50 border border-rose-200 rounded-xl text-center">
        <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-rose-900 mb-2">অননুমোদিত এক্সেস (Unauthorized)</h2>
        <p className="text-sm text-rose-700 mb-4">
          শুধুমাত্র অনুমোদিত সুপার অ্যাডমিন ও ফাউন্ডার ডেলিভারি রেট ও পলিসি কনফিগারেশন পরিবর্তন করতে পারেন।
        </p>
      </div>
    );
  }

  return (
    <div id="delivery-charge-management-panel" className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div id="delivery-panel-header" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">ডেলিভারি ম্যানেজমেন্ট সিস্টেম</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                v{draftConfig.version || 2} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ডিলার পয়েন্ট থেকে গ্রাহক সড়ক দূরত্ব (Google Maps Road Engine), কুরিয়ার স্ল্যাব, লোকাল হেভি ফিক্সড স্ল্যাব ও কার্গো পলিসি
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg animate-pulse">
              অসংরক্ষিত ড্রাফট রয়েছে
            </span>
          )}
          <button
            type="button"
            id="btn-reset-defaults"
            onClick={handleResetDefaults}
            disabled={isSavingRates}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            title="ফ্যাক্টরি ডিফল্ট রেটে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ডিফল্ট রেট
          </button>
          <button
            type="button"
            id="btn-discard-draft-rates"
            onClick={handleDiscardDraft}
            disabled={!isDirty || isSavingRates}
            className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            পরিবর্তন বাতিল (Cancel)
          </button>
          <button
            type="button"
            id="btn-save-all-rates"
            onClick={handleSaveAllRates}
            disabled={isSavingRates}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            {isSavingRates ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                সংরক্ষণ হচ্ছে...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                রেট সংরক্ষণ ও আপডেট করুন
              </>
            )}
          </button>
        </div>
      </div>

      {/* Emergency Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">জরুরি ডেলিভারি নোটিশ ও রুট অ্যালার্ট</h4>
            <input
              type="text"
              value={draftConfig.emergencyNotice || ''}
              onChange={(e) => setDraftConfig(prev => ({ ...prev, emergencyNotice: e.target.value }))}
              placeholder="যেমন: অতিবৃষ্টি ও বন্যায় উত্তরাঞ্চলের ডেলিভারি ২৪-৪৮ ঘণ্টা বিলম্বিত হতে পারে..."
              className="mt-1 w-full text-xs bg-white border border-amber-300 rounded px-2.5 py-1 text-slate-800 focus:outline-emerald-600"
            />
          </div>
        </div>
        <span className="text-[11px] text-amber-700 shrink-0">গ্রাহক চেকআউট ও ট্র্যাকিংয়ে প্রদর্শিত হবে</span>
      </div>

      {/* Status Alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>সংশোধন প্রয়োজন:</span>
          </div>
          <ul className="list-disc list-inside text-rose-700 pl-4">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs font-medium pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('delivery_zones')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'delivery_zones'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          ১ উপজেলা = ১ ডেলিভারি জোন ও রেট পলিসি ({allZones.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operation_offices')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'operation_offices'
              ? 'bg-white border-t-2 border-indigo-600 font-bold text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          অপারেশন অফিস ও অফিসার নিয়োগ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('courier_and_local_heavy')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'courier_and_local_heavy'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          কুরিয়ার (০–১০ কেজি) ও লোকাল হেভি (১০–৫০ কেজি)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cargo_and_air')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'cargo_and_air'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          হেভি কার্গো, রোড ও এয়ার ফ্রেইট
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dealer_points')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'dealer_points'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          ডিলার পয়েন্ট হাব ({draftConfig.dealerPoints?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rider_incentives')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'rider_incentives'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          রাইডার প্রণোদনা ও সেটেলমেন্ট
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('order_override')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'order_override'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          অর্ডার চার্জ ওভাররাইড
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rate_simulator')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'rate_simulator'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4" />
          লাইভ রেট সিমুলেটর
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-t-lg transition whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'audit_logs'
              ? 'bg-white border-t-2 border-emerald-600 font-bold text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          অডিট লগ
        </button>
      </div>

      {/* TAB 0: DELIVERY ZONES & RATES POLICY (1 UPAZILA = 1 ZONE) */}
      {activeTab === 'delivery_zones' && (
        <div className="space-y-6">
          {/* Section 1: Foundation Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/50 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
              <Compass className="w-56 h-56 text-white" />
            </div>
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                    <Compass className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      ১ উপজেলা = ১ অ্যাক্টিভ ডেলিভারি জোন ফাউন্ডেশন (Foundation Delivery Zone System)
                    </h3>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      বাংলাদেশ জাতীয় ভৌগোলিক ডাটাবেসের ৫০৪টি উপজেলা/থানা সরাসরি ডেলিভারি জোন হিসেবে ব্যবহৃত হচ্ছে
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 rounded-xl text-xs font-bold font-mono">
                    ৫০৪ টি সক্রিয় জোন
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-xl text-xs font-bold">
                    ৬৪ জেলা • ৮ বিভাগ
                  </span>
                </div>
              </div>

              {/* Core Rules Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>১. জোন নির্ধারণ নীতি</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                    বিভাগ → জেলা → উপজেলা/থানা = স্বয়ংক্রিয় জোন। কোনো পৃথক বা অসংলগ্ন জোন ডাটাবেস প্রয়োজন নেই।
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>২. ডিলার ও গ্রাহক জোন</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                    ডিলারের নিবন্ধিত উপজেলা = ডিলার জোন। চেকআউটে গ্রাহকের নির্বাচিত উপজেলা = গ্রাহক জোন।
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15 space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>৩. প্রথম ডেলিভারি কস্ট সিদ্ধান্ত</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                    ডিলার জোন ID = গ্রাহক জোন ID হলে <strong>WITHIN ZONE</strong>; অন্যথায় <strong>ZONE TO ZONE</strong>।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Super Admin Configurable Delivery Rates (Not Hardcoded) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span>সুপার অ্যাডমিন জোন ডেলিভারি রেট কনফিগারেশন (Super Admin Zone Rate Settings)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ডেলিভারি রেট কোডে ফিক্সড নয়। সুপার অ্যাডমিন এখান থেকে Within Zone ও Zone-to-Zone বেস রেট কনফিগার করতে পারবেন।
                </p>
              </div>

              {zoneSavedMsg && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-300 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {zoneSavedMsg}
                </span>
              )}

              <button
                type="button"
                onClick={handleSaveZoneRates}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>জোন রেট সংরক্ষণ ও আপডেট করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              {/* Field 1: Within Zone Base Rate */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-emerald-950 block">
                  ১. একই জোন ডেলিভারি বেস রেট (Within Zone) (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.withinZoneBaseRate}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      withinZoneBaseRate: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-mono font-black text-sm text-emerald-900"
                />
                <span className="text-[11px] text-emerald-700 block">
                  ডিলার ও গ্রাহক একই উপজেলায় অবস্থান করলে প্রযোজ্য (ডিফল্ট: ৳৫০)
                </span>
              </div>

              {/* Field 2: Zone to Zone Base Rate */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-indigo-950 block">
                  ২. জোন টু জোন ডেলিভারি বেস রেট (Zone to Zone) (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.zoneToZoneBaseRate}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      zoneToZoneBaseRate: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-indigo-300 rounded-lg p-2 font-mono font-black text-sm text-indigo-900"
                />
                <span className="text-[11px] text-indigo-700 block">
                  ভিন্ন জোনে পার্সেল স্থানান্তরের প্রারম্ভিক বেস রেট (ডিফল্ট: ৳১০০)
                </span>
              </div>

              {/* Field 3: Inter-District Base Rate */}
              <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-sky-950 block">
                  ৩. আন্তঃজেলা জোন বেস রেট (Inter-District) (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.interDistrictBaseRate}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      interDistrictBaseRate: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-sky-300 rounded-lg p-2 font-mono font-black text-sm text-sky-900"
                />
                <span className="text-[11px] text-sky-700 block">
                  ভিন্ন জেলার জোনে প্রেরণের রেট (ডিফল্ট: ৳১৩০)
                </span>
              </div>

              {/* Field 4: Inter-Division Base Rate */}
              <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-purple-950 block">
                  ৪. আন্তঃবিভাগ জোন বেস রেট (Inter-Division) (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.interDivisionBaseRate}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      interDivisionBaseRate: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-purple-300 rounded-lg p-2 font-mono font-black text-sm text-purple-900"
                />
                <span className="text-[11px] text-purple-700 block">
                  অন্য বিভাগে লং-হাওল ডেলিভারি রেট (ডিফল্ট: ৳১৫০)
                </span>
              </div>

              {/* Field 5: Weight Surcharge */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-amber-950 block">
                  ৫. অতিরিক্ত ওজন সারচার্জ (১ কেজির পর প্রতি কেজি) (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.weightSurchargePerKg}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      weightSurchargePerKg: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 font-mono font-black text-sm text-amber-900"
                />
                <span className="text-[11px] text-amber-700 block">
                  ১ কেজি ঊর্ধ্বে প্রতি কেজিতে যুক্ত হবে (ডিফল্ট: ৳২০)
                </span>
              </div>

              {/* Field 6: Free Delivery Threshold */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1.5">
                <label className="font-extrabold text-teal-950 block">
                  ৬. ফ্রি ডেলিভারি নূন্যতম অর্ডার মূল্য (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={zoneRateConfig.freeDeliveryThreshold}
                  onChange={(e) =>
                    setZoneRateConfig((prev) => ({
                      ...prev,
                      freeDeliveryThreshold: Math.max(0, Number(e.target.value) || 0)
                    }))
                  }
                  className="w-full bg-white border border-teal-300 rounded-lg p-2 font-mono font-black text-sm text-teal-900"
                />
                <span className="text-[11px] text-teal-700 block">
                  এই অর্ডারের বেশিতে ডেলিভারি চার্জ সম্পূর্ণ ফ্রি (ডিফল্ট: ৳৩,০০০)
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: National Upazila Zones Directory (504 Zones) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>বাংলাদেশ জাতীয় ৫০৪টি উপজেলা ডেলিভারি জোন তালিকা (504 Active Zones)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  প্রতিটি উপজেলার জন্য একটি স্থায়ী জোন আইডি নির্ধারিত রয়েছে। জোন পয়েন্ট ও সক্রিয় অবস্থা এখান থেকে পরিচালনা করুন।
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                প্রদর্শিত জোন: {filteredZones.length} টি
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="উপজেলা, জেলা বা জোন নাম দিয়ে খুঁজুন (যেমন: ঠাকুরগাঁও সদর)..."
                  value={zoneSearchTerm}
                  onChange={(e) => setZoneSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-emerald-600"
                />
              </div>

              <div>
                <select
                  value={zoneDivisionFilter}
                  onChange={(e) => setZoneDivisionFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-emerald-600 font-semibold"
                >
                  <option value="all">-- সকল বিভাগ ({allZones.length} জোন) --</option>
                  <option value="রংপুর">রংপুর বিভাগ</option>
                  <option value="ঢাকা">ঢাকা বিভাগ</option>
                  <option value="চট্টগ্রাম">চট্টগ্রাম বিভাগ</option>
                  <option value="রাজশাহী">রাজশাহী বিভাগ</option>
                  <option value="খুলনা">খুলনা বিভাগ</option>
                  <option value="বরিশাল">বরিশাল বিভাগ</option>
                  <option value="সিলেট">সিলেট বিভাগ</option>
                  <option value="ময়মনসিংহ">ময়মনসিংহ বিভাগ</option>
                </select>
              </div>

              <div>
                <select
                  value={zoneDistrictFilter}
                  onChange={(e) => setZoneDistrictFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-emerald-600 font-semibold"
                >
                  <option value="all">-- সকল জেলা --</option>
                  {Array.from(new Set(allZones.map((z) => z.district_name))).sort().map((d) => (
                    <option key={d} value={d}>
                      {d} জেলা
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Zones Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Zone ID</th>
                    <th className="p-3">জোন নাম (Zone Name)</th>
                    <th className="p-3">উপজেলা</th>
                    <th className="p-3">জেলা</th>
                    <th className="p-3">বিভাগ</th>
                    <th className="p-3">জোন পয়েন্ট ও ঠিকানা</th>
                    <th className="p-3">অপারেশন অফিস</th>
                    <th className="p-3 text-center">স্ট্যাটাস</th>
                    <th className="p-3 text-center">একশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredZones.slice(0, 100).map((zone) => (
                    <tr key={zone.zone_id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-emerald-700">
                        {zone.zone_id}
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900">{zone.zone_name_bn}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{zone.zone_name_en}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{zone.upazila_name}</td>
                      <td className="p-3 font-medium text-slate-800">{zone.district_name}</td>
                      <td className="p-3 font-medium text-slate-800">{zone.division_name}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{zone.zone_point_name}</span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-xs">{zone.zone_point_address}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">
                        {zone.operation_office_id || `office_${zone.zone_id}`}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleZoneStatus(zone.zone_id, zone.status)}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition cursor-pointer ${
                            zone.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {zone.status === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEditZonePoint(zone)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>এডিট</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredZones.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        কোনো জোন খুঁজে পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredZones.length > 100 && (
              <p className="text-[11px] text-slate-400 text-right">
                * প্রথম ১০০টি জোন প্রদর্শিত হচ্ছে। আরও নির্দিষ্ট জোন দেখতে অনুসন্ধান করুন।
              </p>
            )}
          </div>

          {/* Edit Zone Point Modal */}
          {editingZonePoint && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b pb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>জোন পয়েন্ট তথ্য সম্পাদন: {editingZonePoint.zone_name_bn}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingZonePoint(null)}
                    className="text-slate-400 hover:text-slate-600 text-base"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveZonePointModal} className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">জোন পয়েন্টের নাম:</label>
                    <input
                      type="text"
                      value={zonePointEditForm.pointName}
                      onChange={(e) =>
                        setZonePointEditForm((prev) => ({ ...prev, pointName: e.target.value }))
                      }
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">জোন পয়েন্টের ঠিকানা:</label>
                    <input
                      type="text"
                      value={zonePointEditForm.pointAddress}
                      onChange={(e) =>
                        setZonePointEditForm((prev) => ({ ...prev, pointAddress: e.target.value }))
                      }
                      required
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingZonePoint(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs"
                    >
                      সংরক্ষণ করুন
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: OPERATION OFFICES & ZONE MAPPING */}
      {activeTab === 'operation_offices' && (
        <OperationOfficeManagement />
      )}

      {/* TAB 1: COURIER & LOCAL HEAVY */}
      {activeTab === 'courier_and_local_heavy' && (
        <div className="space-y-6">
          {/* Section A: Normal Courier Slabs (0–10 KG) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  রেগুলার কুরিয়ার ওজন স্ল্যাব (০–১০ কেজি রেট)
                </h3>
                <p className="text-xs text-slate-500">
                  নির্ধারিত ১০টি ওজন স্ল্যাব। ঢাকা মেট্রো, ঢাকা উপশহর ও ঢাকার বাইরের জন্য রেট এডিট করুন।
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ওজন স্ল্যাব</th>
                    <th className="py-2.5 px-3">শুরু (কেজি)</th>
                    <th className="py-2.5 px-3">শেষ (কেজি)</th>
                    <th className="py-2.5 px-3 text-emerald-700">ঢাকা মেট্রো (৳)</th>
                    <th className="py-2.5 px-3 text-blue-700">উপশহর (৳)</th>
                    <th className="py-2.5 px-3 text-amber-700">ঢাকার বাইরে (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(draftConfig.courierSlabs || DEFAULT_COURIER_SLABS).map((slab, index) => (
                    <tr key={slab.id} className="hover:bg-slate-50/70">
                      <td className="py-2 px-3 font-medium text-slate-800">{slab.label}</td>
                      <td className="py-2 px-3 text-slate-500">{slab.minKg}</td>
                      <td className="py-2 px-3 text-slate-500">{slab.maxKg}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">৳</span>
                          <input
                            type="number"
                            value={slab.rateInsideDhaka}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDraftConfig(prev => {
                                const copy = [...(prev.courierSlabs || DEFAULT_COURIER_SLABS)];
                                copy[index] = { ...copy[index], rateInsideDhaka: val };
                                return { ...prev, courierSlabs: copy };
                              });
                            }}
                            className="w-20 px-2 py-1 bg-emerald-50/50 border border-emerald-200 rounded text-slate-800 font-medium text-xs focus:bg-white focus:outline-emerald-600"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">৳</span>
                          <input
                            type="number"
                            value={slab.rateSuburban}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDraftConfig(prev => {
                                const copy = [...(prev.courierSlabs || DEFAULT_COURIER_SLABS)];
                                copy[index] = { ...copy[index], rateSuburban: val };
                                return { ...prev, courierSlabs: copy };
                              });
                            }}
                            className="w-20 px-2 py-1 bg-blue-50/50 border border-blue-200 rounded text-slate-800 font-medium text-xs focus:bg-white focus:outline-blue-600"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">৳</span>
                          <input
                            type="number"
                            value={slab.rateOutsideDhaka}
                            onChange={(e) => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setDraftConfig(prev => {
                                const copy = [...(prev.courierSlabs || DEFAULT_COURIER_SLABS)];
                                copy[index] = { ...copy[index], rateOutsideDhaka: val };
                                return { ...prev, courierSlabs: copy };
                              });
                            }}
                            className="w-20 px-2 py-1 bg-amber-50/50 border border-amber-200 rounded text-slate-800 font-medium text-xs focus:bg-white focus:outline-amber-600"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Local Heavy Delivery Slabs (10–50 KG) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-purple-600" />
                  লোকাল হেভি ডেলিভারি ফিক্সড স্ল্যাব (১০–৫০ কেজি, ০–১০ কিমি)
                </h3>
                <p className="text-xs text-slate-500">
                  নিকটস্থ ডিলার পয়েন্ট থেকে ১০ কিমির মধ্যে ভারী পণ্যের স্থির দূরত্ব ভিত্তিক স্ল্যাব চার্জ (দূরত্ব দিয়ে গুণ হবে না)
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftConfig.localHeavyConfig?.enabled ?? true}
                  onChange={(e) =>
                    setDraftConfig(prev => ({
                      ...prev,
                      localHeavyConfig: {
                        ...(prev.localHeavyConfig || DEFAULT_LOCAL_HEAVY_CONFIG),
                        enabled: e.target.checked
                      }
                    }))
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                লোকাল হেভি ডেলিভারি সক্রিয়
              </label>
            </div>

            {/* Critical rule explanation */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                কঠোর ব্যবসায়িক নিয়ম (Strict Business Rule):
              </span>
              <p>
                লোকাল হেভি ডেলিভারি (১০–৫০ কেজি) গ্রাহক যদি ডিলার পয়েন্টের ১০ কিমির মধ্যে থাকে, তবে সম্পূর্ণ ডেলিভারি চার্জ হবে নির্বাচিত দূরত্বের <strong>স্থির ফ্ল্যাট চার্জ (Fixed Slab Charge)</strong>।
                যেমন: ৫০ কেজি চালের বস্তা ০.৮ কিমিতে ৳৫০, ২.৫ কিমিতে ৳৯০, ৭ কিমিতে ৳১৮০। কোনো প্রতি-কেজি বা গুণিতক চার্জ প্রযোজ্য নয়।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(draftConfig.localHeavyConfig?.slabs || DEFAULT_LOCAL_HEAVY_CONFIG.slabs).map((slab, index) => (
                <div key={slab.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{slab.label}</span>
                    <span className="text-slate-500">{slab.minKm}–{slab.maxKm} কিমি</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">স্থির চার্জ:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">৳</span>
                      <input
                        type="number"
                        value={slab.charge}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setDraftConfig(prev => {
                            const copy = [...(prev.localHeavyConfig?.slabs || DEFAULT_LOCAL_HEAVY_CONFIG.slabs)];
                            copy[index] = { ...copy[index], charge: val };
                            return {
                              ...prev,
                              localHeavyConfig: {
                                ...(prev.localHeavyConfig || DEFAULT_LOCAL_HEAVY_CONFIG),
                                slabs: copy
                              }
                            };
                          });
                        }}
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-bold text-xs focus:outline-purple-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Beyond 10 KM Policy */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800">১০ কিমির বেশি দূরত্বের ক্ষেত্রে নীতি (Beyond 10 KM Policy):</span>
                <p className="text-slate-500 mt-0.5">১০-৫০ কেজির পার্সেল ১০ কিমির বাইরে গেলে কোন রেট কার্যকর হবে?</p>
              </div>
              <select
                value={draftConfig.localHeavyConfig?.beyondMaxDistancePolicy || 'road_cargo'}
                onChange={(e) =>
                  setDraftConfig(prev => ({
                    ...prev,
                    localHeavyConfig: {
                      ...(prev.localHeavyConfig || DEFAULT_LOCAL_HEAVY_CONFIG),
                      beyondMaxDistancePolicy: e.target.value as any
                    }
                  }))
                }
                className="bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-purple-600"
              >
                <option value="road_cargo">রোড কার্গো / কাভার্ড ভ্যান রেট প্রয়োগ করুন (প্রস্তাবিত)</option>
                <option value="courier">১০ কেজি কুরিয়ার বেস + অতিরিক্ত কেজি চার্জ</option>
                <option value="custom_quote">কাস্টম কোটেশন রিকোয়ার্ড</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CARGO, ROAD & AIR TRANSPORT */}
      {activeTab === 'cargo_and_air' && (
        <div className="space-y-6">
          {/* Section A: Heavy Cargo Tiers (50+ KG) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-blue-600" />
              হেভি কার্গো ওজন স্তর (৫০+ কেজি বাল্ক শিপমেন্ট)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(draftConfig.cargoTiers || DEFAULT_CARGO_TIERS).map((tier, index) => (
                <div key={tier.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{tier.nameBn}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                      {tier.minKg}–{tier.maxKg} কেজি
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">বেস ফি (Base Fee):</span>
                      <div className="flex items-center gap-1">
                        <span>৳</span>
                        <input
                          type="number"
                          value={tier.baseCharge}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDraftConfig(prev => {
                              const copy = [...(prev.cargoTiers || DEFAULT_CARGO_TIERS)];
                              copy[index] = { ...copy[index], baseCharge: val };
                              return { ...prev, cargoTiers: copy };
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-medium text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">প্রতি কেজি (Per KG):</span>
                      <div className="flex items-center gap-1">
                        <span>৳</span>
                        <input
                          type="number"
                          value={tier.perKgCharge}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDraftConfig(prev => {
                              const copy = [...(prev.cargoTiers || DEFAULT_CARGO_TIERS)];
                              copy[index] = { ...copy[index], perKgCharge: val };
                              return { ...prev, cargoTiers: copy };
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-medium text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">প্রতি কিমি (Per KM):</span>
                      <div className="flex items-center gap-1">
                        <span>৳</span>
                        <input
                          type="number"
                          value={tier.perKmCharge}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDraftConfig(prev => {
                              const copy = [...(prev.cargoTiers || DEFAULT_CARGO_TIERS)];
                              copy[index] = { ...copy[index], perKmCharge: val };
                              return { ...prev, cargoTiers: copy };
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-medium text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">সর্বনিম্ন চার্জ (Min Total):</span>
                      <div className="flex items-center gap-1">
                        <span>৳</span>
                        <input
                          type="number"
                          value={tier.minTotalCharge}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDraftConfig(prev => {
                              const copy = [...(prev.cargoTiers || DEFAULT_CARGO_TIERS)];
                              copy[index] = { ...copy[index], minTotalCharge: val };
                              return { ...prev, cargoTiers: copy };
                            });
                          }}
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-medium text-right"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Air Cargo Formula */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plane className="w-4 h-4 text-sky-600" />
              এয়ার কার্গো এক্সপ্রেস রেট (Air Cargo Multi-Leg Formula)
            </h3>
            <p className="text-xs text-slate-500">
              ডিলার → ডিপারচার এয়ারপোর্ট হ্যান্ডলিং → বিমান ফ্রেইট → গন্তব্য এয়ারপোর্ট হ্যান্ডলিং → লাস্ট-মাইল ডেলিভারি
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-600 font-medium">এয়ারপোর্ট ট্রান্সপোর্ট ফি:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>৳</span>
                  <input
                    type="number"
                    value={draftConfig.airCargoConfig?.dealerToAirportFee || 200}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDraftConfig(prev => ({
                        ...prev,
                        airCargoConfig: { ...(prev.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG), dealerToAirportFee: val }
                      }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-600 font-medium">ডিপারচার ও অ্যারাইভাল হ্যান্ডলিং:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>৳</span>
                  <input
                    type="number"
                    value={draftConfig.airCargoConfig?.departureAirportHandlingFee || 150}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDraftConfig(prev => ({
                        ...prev,
                        airCargoConfig: { ...(prev.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG), departureAirportHandlingFee: val, destinationAirportHandlingFee: val }
                      }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-600 font-medium">প্রতি কেজি বিমান ফ্রেইট চার্জ:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>৳</span>
                  <input
                    type="number"
                    value={draftConfig.airCargoConfig?.airFreightPerKgRate || 45}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDraftConfig(prev => ({
                        ...prev,
                        airCargoConfig: { ...(prev.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG), airFreightPerKgRate: val }
                      }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sky-700"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-600 font-medium">সর্বনিম্ন ফ্রেইট চার্জ:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>৳</span>
                  <input
                    type="number"
                    value={draftConfig.airCargoConfig?.minimumFreightCharge || 500}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDraftConfig(prev => ({
                        ...prev,
                        airCargoConfig: { ...(prev.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG), minimumFreightCharge: val }
                      }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-slate-600 font-medium">লাস্ট-মাইল লোকাল ডেলিভারি:</span>
                <div className="flex items-center gap-1 mt-1">
                  <span>৳</span>
                  <input
                    type="number"
                    value={draftConfig.airCargoConfig?.finalLastMileFee || 250}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDraftConfig(prev => ({
                        ...prev,
                        airCargoConfig: { ...(prev.airCargoConfig || DEFAULT_AIR_CARGO_CONFIG), finalLastMileFee: val }
                      }));
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEALER POINTS */}
      {activeTab === 'dealer_points' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                ডিলার পয়েন্ট হাব তালিকা (Dealer Fulfillment Hubs)
              </h3>
              <p className="text-xs text-slate-500">
                গ্রাহক ঠিকানার সড়ক দূরত্ব হিসেব করার মূল কেন্দ্র। এখান থেকে ডেলিভারি রাইডার ও কাভার্ড ভ্যান এসাইন হয়।
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingDealerPoint(null);
                setDealerFormData({
                  name: '',
                  tradeLicenseBusinessName: '',
                  tradeLicenseNumber: '',
                  dealerOwnerName: '',
                  code: `DP-POINT-${Math.floor(10 + Math.random() * 90)}`,
                  contactPerson: '',
                  contactPhone: '',
                  address: '',
                  division: 'ঢাকা',
                  district: 'ঢাকা',
                  upazila: 'মিরপুর',
                  unionOrArea: '',
                  latitude: 23.8069,
                  longitude: 90.3687,
                  coverageRadiusKm: 25,
                  isActive: true,
                  supportedModes: ['motorcycle', 'courier', 'road_cargo']
                });
                setShowDealerModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              নতুন ডিলার পয়েন্ট
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(draftConfig.dealerPoints || DEFAULT_DEALER_POINTS).map((point) => (
              <div
                key={point.id}
                className={`p-4 bg-white border rounded-xl shadow-xs space-y-3 transition ${
                  point.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        মজুদ অবস্থান: {point.tradeLicenseBusinessName || point.name}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded">
                        {point.code || point.dealerId}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Zone: {point.upazila} {point.zoneName ? `(${point.zoneName})` : ''}
                    </div>
                    {point.tradeLicenseNumber && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        ট্রেড লাইসেন্স নং: {point.tradeLicenseNumber}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{point.address}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      point.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {point.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ইনচার্জ / যোগাযোগ:</span>
                    <span className="font-medium text-slate-800">{point.contactPerson}</span>
                    <div className="text-slate-500 font-mono text-[11px]">{point.contactPhone}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">লোকেশন ও কাভারেজ:</span>
                    <span className="font-medium text-slate-800">{point.upazila}, {point.district}</span>
                    <div className="text-slate-500 text-[11px]">ব্যাসার্ধ: {point.coverageRadiusKm} কিমি</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <span>GPS:</span>
                    <span>{point.latitude?.toFixed(4)}, {point.longitude?.toFixed(4)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDealerPoint(point);
                        setDealerFormData({ ...point });
                        setShowDealerModal(true);
                      }}
                      className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-200 flex items-center gap-1 text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      এডিট
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`আপনি কি '${point.name}' ডিলার পয়েন্ট মুছে ফেলতে চান?`)) {
                          deleteDealerPoint(point.id);
                          setDraftConfig(prev => ({
                            ...prev,
                            dealerPoints: (prev.dealerPoints || []).filter(p => p.id !== point.id)
                          }));
                        }
                      }}
                      className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Add / Edit Dealer Point */}
          {showDealerModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingDealerPoint ? 'ডিলার পয়েন্ট সম্পাদনা' : 'নতুন ডিলার পয়েন্ট সংযোজন'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowDealerModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleDealerSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">
                      ট্রেড লাইসেন্স অনুযায়ী ব্যবসার নাম (Trade License Business Name) <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={dealerFormData.tradeLicenseBusinessName || dealerFormData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDealerFormData(prev => ({ ...prev, name: val, tradeLicenseBusinessName: val }));
                      }}
                      placeholder="যেমন: M/S Rahman Enterprise বা M/S Karim Traders"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800 font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      * এই ট্রেড লাইসেন্স নাম-ই ইনভেন্টরি মজুদ অবস্থান (Stock Location) হিসেবে প্রদর্শিত হবে।
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">ডিলার স্বত্বাধিকারীর নাম (Owner Name):</label>
                      <input
                        type="text"
                        value={dealerFormData.dealerOwnerName || ''}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, dealerOwnerName: e.target.value }))}
                        placeholder="মোঃ আব্দুর রহমান"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">ট্রেড লাইসেন্স নম্বর (Trade License No):</label>
                      <input
                        type="text"
                        value={dealerFormData.tradeLicenseNumber || ''}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, tradeLicenseNumber: e.target.value }))}
                        placeholder="TRAD/THAK/2026/0192"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">ডিলার আইডি / হাব কোড (Dealer ID):</label>
                      <input
                        type="text"
                        required
                        value={dealerFormData.dealerId || dealerFormData.code}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, code: e.target.value, dealerId: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">কাভারেজ ব্যাসার্ধ (কিমি):</label>
                      <input
                        type="number"
                        value={dealerFormData.coverageRadiusKm}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, coverageRadiusKm: parseFloat(e.target.value) || 20 }))}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">ইনচার্জ / ম্যানেজার:</label>
                      <input
                        type="text"
                        value={dealerFormData.contactPerson}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="ম্যানেজার / প্রতিনিধি"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">মোবাইল নম্বর (Contact Phone):</label>
                      <input
                        type="text"
                        value={dealerFormData.contactPhone}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+88017..."
                        className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">বিভাগ (Division):</label>
                      <input
                        type="text"
                        value={dealerFormData.division}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, division: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">জেলা (District):</label>
                      <input
                        type="text"
                        value={dealerFormData.district}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">উপজেলা / জোন (Upazila):</label>
                      <input
                        type="text"
                        value={dealerFormData.upazila}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, upazila: e.target.value }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                    <span>
                      নির্ধারিত জোন: <strong>{dealerFormData.upazila || 'ঠাকুরগাঁও সদর'} জোন</strong>
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono">1 Upazila = 1 Zone</span>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">সম্পূর্ণ আউটলেট ঠিকানা:</label>
                    <textarea
                      rows={2}
                      value={dealerFormData.address}
                      onChange={(e) => setDealerFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="দোকান নং, রোড নং, এলাকা..."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">অক্ষাংশ (Latitude):</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={dealerFormData.latitude}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 23.8069 }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">দ্রাঘিমাংশ (Longitude):</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={dealerFormData.longitude}
                        onChange={(e) => setDealerFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 90.3687 }))}
                        className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 font-semibold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dealerFormData.isActive}
                      onChange={(e) => setDealerFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded text-emerald-600"
                    />
                    ডিলার পয়েন্ট সক্রিয় (Active for order routing)
                  </label>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDealerModal(false);
                        setEditingDealerPoint(null);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      বাতিল (Cancel)
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {editingDealerPoint ? 'পয়েন্ট আপডেট সংরক্ষণ করুন (Update Point)' : 'নতুন পয়েন্ট সংরক্ষণ করুন (Save Point)'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RIDER INCENTIVES & SETTLEMENT */}
      {activeTab === 'rider_incentives' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bike className="w-4 h-4 text-emerald-600" />
            লোকাল ডেলিভারি ম্যান (রাইডার) প্রণোদনা ও সেটেলমেন্ট কনফিগারেশন
          </h3>
          <p className="text-xs text-slate-500">
            গ্রাহকের ডেলিভারি চার্জ থেকে রাইডারের পারিশ্রমিক ও প্রণোদনা সম্পূর্ণ আলাদা। রাইডার সফল ডেলিভারির ভিত্তিতে কমিশন ও বোনাস পাবেন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-slate-600 font-semibold block">প্রতি সফল অর্ডারে বেস ফি:</span>
              <div className="flex items-center gap-1">
                <span>৳</span>
                <input
                  type="number"
                  value={draftConfig.riderIncentive?.baseFeePerOrder || 35}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDraftConfig(prev => ({
                      ...prev,
                      riderIncentive: { ...(prev.riderIncentive || DEFAULT_RIDER_INCENTIVE), baseFeePerOrder: val }
                    }));
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-bold text-emerald-700"
                />
              </div>
              <span className="text-[10px] text-slate-400">প্রতিটি পার্সেল ডেলিভারিতে নিশ্চিত ফি</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-slate-600 font-semibold block">দূরত্ব বোনাস (প্রতি অতিরিক্ত কিমি):</span>
              <div className="flex items-center gap-1">
                <span>৳</span>
                <input
                  type="number"
                  value={draftConfig.riderIncentive?.extraPerKmFee || 6}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDraftConfig(prev => ({
                      ...prev,
                      riderIncentive: { ...(prev.riderIncentive || DEFAULT_RIDER_INCENTIVE), extraPerKmFee: val }
                    }));
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-bold text-emerald-700"
                />
              </div>
              <span className="text-[10px] text-slate-400">ডিলার পয়েন্ট থেকে দূরত্বের জন্য অতিরিক্ত</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-slate-600 font-semibold block">হেভি পার্সেল বোনাস (১০–৫০ কেজি):</span>
              <div className="flex items-center gap-1">
                <span>৳</span>
                <input
                  type="number"
                  value={draftConfig.riderIncentive?.heavyWeightBonusKg10To50 || 45}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDraftConfig(prev => ({
                      ...prev,
                      riderIncentive: { ...(prev.riderIncentive || DEFAULT_RIDER_INCENTIVE), heavyWeightBonusKg10To50: val }
                    }));
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-bold text-purple-700"
                />
              </div>
              <span className="text-[10px] text-slate-400">ভারী চাল, তেল বা বাল্ক পণ্যের বিশেষ হ্যান্ডলিং বোনাস</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-slate-600 font-semibold block">আল্ট্রা হেভি বোনাস (৫০+ কেজি):</span>
              <div className="flex items-center gap-1">
                <span>৳</span>
                <input
                  type="number"
                  value={draftConfig.riderIncentive?.heavyWeightBonusKg50Plus || 120}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setDraftConfig(prev => ({
                      ...prev,
                      riderIncentive: { ...(prev.riderIncentive || DEFAULT_RIDER_INCENTIVE), heavyWeightBonusKg50Plus: val }
                    }));
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-bold text-blue-700"
                />
              </div>
              <span className="text-[10px] text-slate-400">রোড কার্গো লোডিং/আনলোডিং সহায়তা ফি</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ORDER DELIVERY OVERRIDE */}
      {activeTab === 'order_override' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              ম্যানুয়াল অর্ডার ডেলিভারি চার্জ ওভাররাইড (Manual Delivery Override)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              বিশেষ বিবেচনায় বা কর্পোরেট চুক্তির কারণে যেকোনো কনফার্মড অর্ডারের ডেলিভারি চার্জ সুপার অ্যাডমিন কর্তৃক পরিবর্তন করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={overrideOrderId}
                onChange={(e) => setOverrideOrderId(e.target.value)}
                placeholder="অর্ডার আইডি (যেমন: ORD-WA-12345) বা গ্রাহকের ফোন নম্বর দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-emerald-600"
              />
            </div>
          </div>

          {targetOrder ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="font-bold text-sm text-slate-900">অর্ডার: {targetOrder.id}</span>
                  <p className="text-slate-500">গ্রাহক: {targetOrder.customerName} ({targetOrder.customerPhone})</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">বর্তমান ডেলিভারি চার্জ:</span>
                  <span className="text-base font-bold text-emerald-700">৳{targetOrder.shippingCharge}</span>
                </div>
              </div>

              {targetOrder.deliverySnapshot && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <span className="font-semibold text-slate-800 block">সংরক্ষিত রেট স্ন্যাপশট (Delivery Snapshot):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 text-[11px]">
                    <div>ডিলার: {targetOrder.deliverySnapshot.dealerPoint?.name || 'ঢাকা সেন্ট্রাল'}</div>
                    <div>দূরত্ব: {targetOrder.deliverySnapshot.distanceKm} কিমি</div>
                    <div>ওজন: {targetOrder.deliverySnapshot.totalWeightDisplay || `${targetOrder.deliverySnapshot.totalWeightKg} kg`}</div>
                    <div>মোড: {targetOrder.deliverySnapshot.deliveryModeLabel || 'কুরিয়ার'}</div>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">ব্রেকডাউন: {targetOrder.deliverySnapshot.rateBreakdown}</div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">অনুমোদিত নতুন ডেলিভারি চার্জ (৳):</label>
                  <input
                    type="number"
                    value={overrideNewCharge}
                    onChange={(e) => setOverrideNewCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-emerald-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">গ্রাহকের সর্বমোট চালানে এই পরিমাণ যুক্ত হবে</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">ওভাররাইডের কারণ (বাধ্যতামূলক):</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="যেমন: ডিলার ভিআইপি গ্রাহক ছাড়, বিশেষ প্রমোশন ইত্যাদি"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {overrideStatusMsg && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    overrideStatusMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {overrideStatusMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{overrideStatusMsg.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOverrideOrderId('');
                    setOverrideReason('');
                    setOverrideStatusMsg(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="button"
                  id="btn-apply-delivery-override"
                  onClick={handleApplyOverride}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  ওভাররাইড সংরক্ষণ ও কার্যকর করুন (Save Override)
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
              নির্দিষ্ট কোনো অর্ডারের ডেলিভারি চার্জ পরিবর্তন করতে উপরে অর্ডার আইডি বা ফোন নম্বর লিখুন।
            </div>
          )}
        </div>
      )}

      {/* TAB 6: RATE SIMULATOR */}
      {activeTab === 'rate_simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-4 h-4 text-emerald-600" />
              সিমুলেশন প্যারামিটার
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">ডিলার পয়েন্ট হাব:</label>
                <select
                  value={simDealerId}
                  onChange={(e) => setSimDealerId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium"
                >
                  {(draftConfig.dealerPoints || DEFAULT_DEALER_POINTS).map((dp) => (
                    <option key={dp.id} value={dp.id}>
                      {dp.name} ({dp.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">ডেলিভারি জোন:</label>
                <select
                  value={simZone}
                  onChange={(e) => setSimZone(e.target.value as DeliveryZoneType)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium"
                >
                  <option value="inside_dhaka">ঢাকা মেট্রো (Inside Dhaka)</option>
                  <option value="suburban_dhaka">ঢাকা উপশহর ও পার্শ্ববর্তী (Suburban Dhaka)</option>
                  <option value="outside_dhaka">ঢাকার বাইরে (Outside Dhaka)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">মোট পার্সেল ওজন (কেজি):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={simWeightKg}
                    onChange={(e) => setSimWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold"
                  />
                  <span className="text-slate-500 shrink-0">কেজি</span>
                </div>
                {/* Quick weight shortcuts */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[0.5, 1, 2, 5, 10, 25, 50, 80, 150].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSimWeightKg(w)}
                      className={`px-2 py-0.5 text-[10px] rounded border ${
                        simWeightKg === w ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">সড়ক দূরত্ব (ডিলার পয়েন্ট থেকে কিমি):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0.2"
                    value={simDistanceKm}
                    onChange={(e) => setSimDistanceKm(Math.max(0.2, parseFloat(e.target.value) || 1))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 font-bold"
                  />
                  <span className="text-slate-500 shrink-0">কিমি</span>
                </div>
                {/* Quick distance shortcuts */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[0.5, 1, 2, 5, 8, 10, 15, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSimDistanceKm(d)}
                      className={`px-2 py-0.5 text-[10px] rounded border ${
                        simDistanceKm === d ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {d} km
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">ডেলিভারি মোড:</label>
                <select
                  value={simMode}
                  onChange={(e) => setSimMode(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-800 font-medium"
                >
                  <option value="auto">অটো সিলেকশন (প্রস্তাবিত নিয়ম অনুযায়ী)</option>
                  <option value="motorcycle">মোটরসাইকেল / লোকাল হেভি</option>
                  <option value="courier">রেগুলার কুরিয়ার</option>
                  <option value="road_cargo">রোড কার্গো / কাভার্ড ভ্যান</option>
                  <option value="air_cargo">এয়ার কার্গো এক্সপ্রেস</option>
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simIsPaurashava}
                  onChange={(e) => setSimIsPaurashava(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                পৌরসভা এলাকা (Inside Paurashava / City)
              </label>
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">সিমুলেশন ক্যালকুলেশন ফলাফল</h3>
                <p className="text-xs text-slate-500">প্রস্তাবিত নিয়ম ও স্ল্যাব অনুযায়ী লাইভ গণনা</p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                {simResult.deliveryModeLabel}
              </span>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-700 font-semibold block">চূড়ান্ত ডেলিভারি চার্জ (Final Delivery Charge)</span>
                <div className="text-3xl font-black text-emerald-900 mt-1">৳{simResult.totalDeliveryCharge}</div>
                <div className="text-xs text-emerald-800 font-medium mt-1">
                  প্রযুক্ত নিয়ম: <strong>{simResult.appliedRule}</strong>
                </div>
              </div>
              <div className="text-right text-xs text-emerald-800 space-y-0.5">
                <div>ওজন: <strong>{formatWeightDisplay(simResult.totalWeightGrams)}</strong></div>
                <div>কার্যকর দূরত্ব: <strong>{simResult.effectiveDistanceKm} কিমি</strong></div>
                <div>ডিলার হাব: <strong>{simResult.dealerPoint.name}</strong></div>
              </div>
            </div>

            {/* Step by step breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800">চার্জের বিস্তারিত বিভাজন (Detailed Breakdown):</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">বেস স্ল্যাব চার্জ</span>
                  <span className="font-bold text-slate-900 text-sm">৳{simResult.baseCharge}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{simResult.weightSlabLabel}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">দূরত্ব চার্জ</span>
                  <span className="font-bold text-slate-900 text-sm">৳{simResult.distanceCharge}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{simResult.effectiveDistanceKm} কিমি</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">পৌরসভা সারচার্জ</span>
                  <span className="font-bold text-slate-900 text-sm">৳{simResult.paurashavaSurcharge}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {simIsPaurashava ? 'পৌরসভা (৳০)' : 'পৌরসভার বাইরে'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block text-[11px]">ওজন ও হ্যান্ডলিং ফি</span>
                  <span className="font-bold text-slate-900 text-sm">৳{simResult.weightSurcharge + simResult.handlingCharge}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">স্পেশাল হ্যান্ডলিং</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700">
                <span className="font-semibold text-slate-900">চালানে প্রদর্শিত হবে: </span>
                <span className="font-mono">{simResult.rateBreakdown}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-4 h-4 text-emerald-600" />
            ডেলিভারি রেট ও পলিসি পরিবর্তনের অডিট লগ
          </h3>

          {(draftConfig.auditLogs && draftConfig.auditLogs.length > 0) ? (
            <div className="divide-y divide-slate-100 text-xs">
              {draftConfig.auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.actionSummary}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded font-mono">
                        {log.type}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      অ্যাডমিন: <strong>{log.adminName}</strong> {log.reason && ` | কারণ: ${log.reason}`}
                    </p>
                  </div>
                  <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
              কোনো পরিবর্তন এখনও অডিট লগে রেকর্ড হয়নি।
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom Action Bar for Delivery Charge Management */}
      <div className="sticky bottom-4 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isDirty
              ? 'সতর্কতা: আপনার করা পরিবর্তনগুলো এখনও ডাটাবেজে সংরক্ষণ করা হয়নি'
              : 'সকল ডেলিভারি রেট, স্ল্যাব ও কনফিগারেশন সক্রিয় ও সংরক্ষিত'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-sticky-reset-defaults"
            onClick={handleResetDefaults}
            disabled={isSavingRates}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition cursor-pointer"
            title="সিস্টেম ডিফল্টে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
            ডিফল্ট রেট
          </button>
          <button
            type="button"
            id="btn-sticky-discard-delivery-draft"
            onClick={handleDiscardDraft}
            disabled={!isDirty || isSavingRates}
            className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>পরিবর্তন বাতিল (Cancel / Discard)</span>
          </button>
          <button
            type="button"
            id="btn-sticky-save-delivery-rates"
            onClick={handleSaveAllRates}
            disabled={isSavingRates}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            {isSavingRates ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>পরিবর্তন সংরক্ষণ ও আপডেট করুন (Save Changes)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
