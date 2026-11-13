/**
 * Operations Partner Ward Management Module
 * Enables Operations Partners to view and ADD wards exclusively within their assigned Union.
 * Strictly enforces assigned Union scope & permission policies.
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useBDLocalDatabase } from '../../context/BDLocalDatabaseContext';
import {
  Layers,
  Plus,
  MapPin,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

export const OperationsPartnerWardManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { language } = useLanguage();
  const { addNotification } = useNotifications();
  const { addLocalEntry, getMergedWards } = useBDLocalDatabase();

  const isBn = language === 'bn';

  // Extract Operations Partner's assigned Union coverage area
  const assignedDivision = currentUser?.mandatoryAddress?.division || 'রাজশাহী';
  const assignedDistrict = currentUser?.mandatoryAddress?.district || 'রাজশাহী';
  const assignedUpazila = currentUser?.mandatoryAddress?.upazila || 'বোয়ালিয়া';
  const assignedUnion = currentUser?.mandatoryAddress?.unionName || 'সাহেব বাজার';

  // Form inputs for adding Ward
  const [wardNoBn, setWardNoBn] = useState('');
  const [wardNoEn, setWardNoEn] = useState('');

  // Get current merged wards for assigned union
  const mergedWards = getMergedWards(
    assignedDivision,
    assignedDistrict,
    assignedUpazila,
    assignedUnion
  );

  const handleAddWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardNoBn.trim()) return;

    addLocalEntry(
      assignedDivision,
      assignedDistrict,
      assignedUpazila,
      assignedUnion,
      'ward',
      wardNoBn,
      wardNoEn || wardNoBn
    );

    addNotification({
      title: isBn ? 'নতুন ওয়ার্ড অন্তর্ভুক্ত হয়েছে' : 'New Ward Added',
      message: `${wardNoBn} ${isBn ? 'ওয়ার্ডটি আপনার অর্পিত ইউনিয়ন' : 'added to your assigned union'} (${assignedUnion}) -এ যুক্ত হয়েছে।`,
      type: 'info'
    });

    setWardNoBn('');
    setWardNoEn('');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'ওয়ার্ড ব্যবস্থাপনা মডিউল (Ward Management)' : 'Ward Management Module'}</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md font-bold">
                {isBn ? 'অপারেশনস পার্টনার রোল' : 'Operations Partner'}
              </span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {isBn
                ? 'আপনার নির্ধারিত ইউনিয়নে নতুন ওয়ার্ড এন্ট্রি যোগ করুন। প্রতি ওয়ার্ড শুধুমাত্র একটি ইউনিয়নে নিবন্ধিত থাকে।'
                : 'Manage and append wards within your officially assigned Union.'}
            </p>
          </div>
        </div>

        {/* Coverage Badge */}
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 shrink-0">
          <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>
            {isBn ? 'আপনার অর্পিত ইউনিয়ন:' : 'Assigned Union:'} {assignedUnion} ({assignedUpazila}, {assignedDistrict})
          </span>
        </div>
      </div>

      {/* Permission Restriction Rules Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            {isBn
              ? 'নিরাপত্তা ও সীমানা নিয়মাবলী (Scope Constraint):'
              : 'Role Security & Coverage Scope Notice:'}
          </p>
          <p className="text-[11px] leading-relaxed opacity-90">
            {isBn
              ? `অপারেশনস পার্টনার হিসেবে আপনি শুধুমাত্র আপনার বরাদ্দকৃত ইউনিয়ন (${assignedUnion})-এ ওয়ার্ড যুক্ত করার ক্ষমতা রাখেন। অন্য ইউনিয়নে ওয়ার্ড যোগ করার জন্য সিস্টেম এডমিনের অনুমতি প্রয়োজন।`
              : `As an Operations Partner, you are permitted to add Wards exclusively inside your assigned Union (${assignedUnion}).`}
          </p>
        </div>
      </div>

      {/* Add New Ward Form */}
      <form onSubmit={handleAddWard} className="bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/60 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-purple-600" />
            <span>
              {isBn ? `নতুন ওয়ার্ড অন্তর্ভুক্ত করুন (${assignedUnion})` : `Add Ward for ${assignedUnion}`}
            </span>
          </span>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
            {isBn ? '* বাংলা ও ইংরেজি দুই নামেই সংরক্ষিত হবে' : '* Both Bangla & English names required'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? 'ওয়ার্ড বাংলা নাম *' : 'Ward Bangla Name *'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: ওয়ার্ড ১০ বা ওয়ার্ড উত্তর-০১' : 'e.g. ওয়ার্ড ১০'}
              value={wardNoBn}
              onChange={(e) => setWardNoBn(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              {isBn ? 'ওয়ার্ড ইংরেজি নাম' : 'Ward English Name'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: Ward 10' : 'e.g. Ward 10'}
              value={wardNoEn}
              onChange={(e) => setWardNoEn(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 text-neutral-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={!wardNoBn.trim()}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'ওয়ার্ড যোগ' : 'Add Ward'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Ward List for Assigned Union */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>
              {isBn
                ? `${assignedUnion} ইউনিয়নের সকল সক্রিয় ওয়ার্ড তালিকা (${mergedWards.length})`
                : `Active Wards in ${assignedUnion} (${mergedWards.length})`}
            </span>
          </h4>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            {isBn ? 'অফিসিয়াল সরকারী ও পার্টনার যোগকৃত ডাটা' : 'Government Official & Partner Added Wards'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {mergedWards.map((w, index) => (
            <div
              key={w.id || index}
              className="bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-xs font-black">
                  {index + 1}
                </div>
                <div>
                  <span className="font-bold text-xs text-neutral-900 dark:text-white block">
                    {w.wardNoBn}
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block font-mono">
                    {w.wardNoEn}
                  </span>
                </div>
              </div>

              <div>
                {w.isCustom ? (
                  <span className="text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-300/40">
                    {isBn ? 'পার্টনার এন্ট্রি' : 'Partner Added'}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-300/40">
                    {isBn ? 'সরকারী অফিশিয়াল' : 'Government Ward'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
