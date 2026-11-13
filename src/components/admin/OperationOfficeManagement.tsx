/**
 * Super Admin Operation Office Management Component
 * Project: Apon Bazar
 * 
 * Features:
 * 1. 1 Upazila = 1 Delivery Zone foundation.
 * 2. Complete Operation Office CRUD & Zone Assignment (504 Zones).
 * 3. Assign Operation Officers to Offices/Zones.
 * 4. Activate / Deactivate Operation Offices.
 * 5. Search and filter by Division, District, Upazila, and Office Status.
 */

import React, { useState, useMemo } from 'react';
import {
  getAllOperationOffices,
  saveOperationOffice,
  toggleOperationOfficeStatus,
  deleteOperationOffice,
  OperationOffice
} from '../../services/OperationOfficeService';
import { getAllDeliveryZones, DeliveryZone } from '../../services/DeliveryZoneService';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import {
  Building2,
  MapPin,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Phone,
  UserCheck,
  Shield,
  Layers,
  Compass,
  X,
  Save,
  Clock
} from 'lucide-react';

export const OperationOfficeManagement: React.FC = () => {
  const { users } = useAuth();
  const { orders } = useECommerce();

  const [offices, setOffices] = useState<OperationOffice[]>(() => getAllOperationOffices());
  const allZones = useMemo(() => getAllDeliveryZones(), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<OperationOffice | null>(null);

  const [formData, setFormData] = useState<{
    office_name: string;
    zone_id: string;
    division: string;
    district: string;
    upazila: string;
    address: string;
    mobile: string;
    officer_name: string;
    officer_user_id: string;
    officer_phone: string;
    latitude: number;
    longitude: number;
    status: 'active' | 'inactive';
  }>({
    office_name: '',
    zone_id: 'upz_435',
    division: 'রংপুর',
    district: 'ঠাকুরগাঁও',
    upazila: 'ঠাকুরগাঁও সদর',
    address: 'কালীবাড়ী মোড়, ঠাকুরগাঁও সদর',
    mobile: '01312480175',
    officer_name: 'মির্জা খতিব উদ্দিন',
    officer_user_id: '',
    officer_phone: '01312480175',
    latitude: 26.0333,
    longitude: 88.4667,
    status: 'active'
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Eligible officers pool from users
  const officerCandidates = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u.accountStatus === 'active' &&
        (u.primaryRole === 'operations_partner' ||
          u.primaryRole === 'admin' ||
          u.primaryRole === 'super_admin' ||
          (u.roles && u.roles.includes('operations_partner')))
    );
  }, [users]);

  // Filtered offices
  const filteredOffices = useMemo(() => {
    return offices.filter((o) => {
      if (divisionFilter !== 'all' && o.division !== divisionFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchesName = o.office_name.toLowerCase().includes(term);
        const matchesUpz = o.upazila.toLowerCase().includes(term);
        const matchesDist = o.district.toLowerCase().includes(term);
        const matchesZone = (o.zone_name || '').toLowerCase().includes(term) || (o.zone_name_bn || '').toLowerCase().includes(term);
        const matchesOfficer = (o.officer_name || '').toLowerCase().includes(term);
        if (!matchesName && !matchesUpz && !matchesDist && !matchesZone && !matchesOfficer) return false;
      }

      return true;
    });
  }, [offices, searchTerm, divisionFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingOffice(null);
    setFormData({
      office_name: '',
      zone_id: allZones[0]?.zone_id || 'upz_435',
      division: allZones[0]?.division_name || 'রংপুর',
      district: allZones[0]?.district_name || 'ঠাকুরগাঁও',
      upazila: allZones[0]?.upazila_name || 'ঠাকুরগাঁও সদর',
      address: `${allZones[0]?.upazila_name || 'ঠাকুরগাঁও সদর'} অপারেশন অফিস পয়েন্ট`,
      mobile: '01312480175',
      officer_name: 'অপারেশন অফিসার',
      officer_user_id: '',
      officer_phone: '01312480175',
      latitude: allZones[0]?.latitude || 26.0333,
      longitude: allZones[0]?.longitude || 88.4667,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (office: OperationOffice) => {
    setEditingOffice(office);
    setFormData({
      office_name: office.office_name,
      zone_id: office.zone_id,
      division: office.division,
      district: office.district,
      upazila: office.upazila,
      address: office.address,
      mobile: office.mobile,
      officer_name: office.officer_name || '',
      officer_user_id: office.officer_user_id || '',
      officer_phone: office.officer_phone || office.mobile,
      latitude: office.latitude || 23.7,
      longitude: office.longitude || 90.4,
      status: office.status
    });
    setIsModalOpen(true);
  };

  const handleZoneSelectChange = (zoneId: string) => {
    const selectedZone = allZones.find((z) => z.zone_id === zoneId);
    if (selectedZone) {
      setFormData((prev) => ({
        ...prev,
        zone_id: selectedZone.zone_id,
        division: selectedZone.division_name,
        district: selectedZone.district_name,
        upazila: selectedZone.upazila_name,
        office_name: prev.office_name || `${selectedZone.upazila_name} অপারেশন অফিস`,
        address: prev.address || selectedZone.zone_point_address
      }));
    }
  };

  const handleOfficerSelectChange = (userId: string) => {
    const officer = officerCandidates.find((u) => u.id === userId);
    if (officer) {
      setFormData((prev) => ({
        ...prev,
        officer_user_id: officer.id,
        officer_name: officer.fullName || officer.name || 'অপারেশন অফিসার',
        officer_phone: officer.mobileNumber || prev.officer_phone
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        officer_user_id: '',
        officer_name: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.office_name.trim()) {
      setFeedbackMsg({ type: 'error', text: 'অপারেশন অফিসের নাম দেওয়া আবশ্যক।' });
      return;
    }

    const payload = {
      ...formData,
      operation_office_id: editingOffice?.operation_office_id
    };

    const res = saveOperationOffice(payload);
    if (res.success) {
      setOffices(getAllOperationOffices());
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsModalOpen(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleToggleStatus = (officeId: string) => {
    toggleOperationOfficeStatus(officeId);
    setOffices(getAllOperationOffices());
  };

  const handleDelete = (officeId: string, officeName: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে '${officeName}' অপারেশন অফিসটি মুছে ফেলতে চান?`)) {
      deleteOperationOffice(officeId);
      setOffices(getAllOperationOffices());
      setFeedbackMsg({ type: 'success', text: `'${officeName}' সফলভাবে মুছে ফেলা হয়েছে।` });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-neutral-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
                <Building2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-black text-white">
                  বাংলাদেশ জোনভিত্তিক অপারেশন অফিস ব্যবস্থাপনা (Operation Office Management)
                </h3>
                <p className="text-xs text-indigo-200/90 mt-0.5">
                  প্রতিটি ডেলিভারি জোনের (উপজেলা/থানা) অধীনে অপারেশন অফিস ও অফিসার নিয়োগ পোর্টাল
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-indigo-100/90 pt-1">
              <span>মোট জাতীয় জোন: <strong>{allZones.length} টি</strong></span>
              <span>•</span>
              <span>নিবন্ধিত অফিস: <strong>{offices.length} টি</strong></span>
              <span>•</span>
              <span>সক্রিয় অফিস: <strong>{offices.filter((o) => o.status === 'active').length} টি</strong></span>
              <span>•</span>
              <span>দায়িত্বপ্রাপ্ত অফিসার: <strong>{officerCandidates.length} জন</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-98 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অপারেশন অফিস তৈরি করুন</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="অফিসের নাম, উপজেলা, জেলা বা অফিসার খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-indigo-600"
          />
        </div>

        <div>
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-indigo-600 font-semibold"
          >
            <option value="all">-- সকল বিভাগ ({offices.length} টি অফিস) --</option>
            <option value="ঢাকা">ঢাকা বিভাগ</option>
            <option value="চট্টগ্রাম">চট্টগ্রাম বিভাগ</option>
            <option value="রাজশাহী">রাজশাহী বিভাগ</option>
            <option value="রংপুর">রংপুর বিভাগ</option>
            <option value="খুলনা">খুলনা বিভাগ</option>
            <option value="বরিশাল">বরিশাল বিভাগ</option>
            <option value="সিলেট">সিলেট বিভাগ</option>
            <option value="ময়মনসিংহ">ময়মনসিংহ বিভাগ</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:bg-white focus:outline-indigo-600 font-semibold"
          >
            <option value="all">-- সকল স্ট্যাটাস --</option>
            <option value="active">শুধুমাত্র সক্রিয় (Active)</option>
            <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Offices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-800">
            তালিকাভুক্ত অপারেশন অফিস ({filteredOffices.length} টি)
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            স্বীকৃত এলাকা: ১ উপজেলা = ১ অফিস জোন
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">অফিস আইডি</th>
                <th className="p-3">অপারেশন অফিসের নাম</th>
                <th className="p-3">নির্ধারিত জোন (Upazila)</th>
                <th className="p-3">ঠিকানা ও জেলা</th>
                <th className="p-3">মোবাইল</th>
                <th className="p-3">দায়িত্বপ্রাপ্ত অফিসার</th>
                <th className="p-3 text-center">স্ট্যাটাস</th>
                <th className="p-3 text-center">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOffices.map((office) => (
                <tr key={office.operation_office_id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-indigo-700">
                    {office.operation_office_id}
                  </td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{office.office_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Zone: {office.zone_id}</span>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{office.upazila}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">{office.district} জেলা, {office.division}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-700 block truncate max-w-xs">{office.address}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-800">
                    {office.mobile}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-bold text-slate-900">{office.officer_name || 'নির্ধারিত হয়নি'}</span>
                    </div>
                    {office.officer_phone && (
                      <span className="text-[10px] text-slate-500 font-mono">{office.officer_phone}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(office.operation_office_id)}
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition cursor-pointer ${
                        office.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {office.status === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(office)}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 rounded-lg transition"
                        title="সম্পাদনা করুন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(office.operation_office_id, office.office_name)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-50 text-rose-700 rounded-lg transition"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Office */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <Building2 className="w-5 h-5" />
                <h3>{editingOffice ? 'অপারেশন অফিস সম্পাদনা করুন' : 'নতুন অপারেশন অফিস তৈরি করুন'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Select Delivery Zone (1 Upazila = 1 Zone) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  নির্ধারিত ডেলিভারি জোন ও উপজেলা (Zone Selection):
                </label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => handleZoneSelectChange(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-slate-50 font-semibold text-slate-900"
                >
                  {allZones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.upazila_name} জোন ({z.district_name}, {z.division_name}) — ID: {z.zone_id}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500">
                  বাংলাদেশ জাতীয় ৫০৪টি উপজেলার তালিকাভুক্ত যেকোনো একটি জোন নির্বাচন করুন।
                </span>
              </div>

              {/* Office Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">অপারেশন অফিসের নাম:</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ঠাকুরগাঁও সদর কেন্দ্রীয় অপারেশন অফিস"
                  value={formData.office_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, office_name: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-bold"
                />
              </div>

              {/* Address & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">অফিসের বিস্তারিত ঠিকানা:</label>
                  <input
                    type="text"
                    required
                    placeholder="হাজীপাড়া রোড, কালীবাড়ী মোড়"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">অফিসিয়াল যোগাযোগ মোবাইল:</label>
                  <input
                    type="text"
                    required
                    placeholder="01312480175"
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Assign Operation Officer */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                <span className="font-bold text-indigo-950 block flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-700" />
                  অপারেশন অফিসার নিয়োগ ও সংযোগ (Assign Operation Officer)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      সিস্টেম ইউজার একাউন্ট থেকে নির্বাচন:
                    </label>
                    <select
                      value={formData.officer_user_id}
                      onChange={(e) => handleOfficerSelectChange(e.target.value)}
                      className="w-full p-2 border border-indigo-300 rounded-xl bg-white font-medium text-slate-900"
                    >
                      <option value="">-- ইউজার নির্বাচন করুন (ঐচ্ছিক) --</option>
                      {officerCandidates.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.name} ({u.mobileNumber}) [{u.primaryRole}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      অফিসারের নাম:
                    </label>
                    <input
                      type="text"
                      placeholder="মির্জা খতিব উদ্দিন"
                      value={formData.officer_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, officer_name: e.target.value }))}
                      className="w-full p-2 border border-indigo-300 rounded-xl bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Latitude & Longitude & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Latitude (অক্ষরেখা):</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, latitude: Number(e.target.value) || 0 }))}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Longitude (দ্রাঘিমারেখা):</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData((prev) => ({ ...prev, longitude: Number(e.target.value) || 0 }))}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">স্ট্যাটাস:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-900"
                  >
                    <option value="active">সক্রিয় (Active)</option>
                    <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
