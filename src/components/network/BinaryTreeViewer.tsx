/**
 * Interactive Binary Tree Diagram Viewer & Spillover Management Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState, useMemo } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { NetworkMember } from '../../types/networkMarketing';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { SlotReservationService } from '../../services/SlotReservationService';
import { PlacementManagementModal } from './PlacementManagementModal';
import {
  GitBranch,
  Plus,
  Zap,
  Award,
  User,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck,
  UserPlus,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  Home,
  Bot
} from 'lucide-react';

export const BinaryTreeViewer: React.FC = () => {
  const { members, currentMember, reservedPlacements, runDailyMatchingEngine } = useNetworkMarketing();

  const [focusMemberId, setFocusMemberId] = useState<string>(currentMember.id);
  const [searchQuery, setSearchQuery] = useState('');

  const [addCustomerSlot, setAddCustomerSlot] = useState<{
    parentId: string;
    parentName: string;
    leg: 'left' | 'right';
  } | null>(null);

  const [aiRegistrationOpen, setAiRegistrationOpen] = useState(false);

  const [selectedPlacementTarget, setSelectedPlacementTarget] = useState<{
    parentId: string;
    leg: 'left' | 'right';
  } | null>(null);

  const [matchingResult, setMatchingResult] = useState<{ matchedPV: number; totalPayoutBDT: number } | null>(null);

  const activeFocusMember = members.find((m) => m.id === focusMemberId) || currentMember;

  // Real-time AI Placement Recommendation for active member's network
  const aiRecommendation = useMemo(() => {
    return SlotReservationService.calculateAIRecommendation(
      activeFocusMember.id || currentMember.id || 'TMK000001',
      members,
      reservedPlacements
    );
  }, [activeFocusMember, currentMember, members, reservedPlacements]);

  const findMember = (id?: string): NetworkMember | undefined => {
    if (!id) return undefined;
    return members.find((m) => m.id === id);
  };

  const leftChild = findMember(activeFocusMember.leftChildId);
  const rightChild = findMember(activeFocusMember.rightChildId);

  const leftReserved = reservedPlacements.find(
    (r) => r.parentMemberId === activeFocusMember.id && r.leg === 'left'
  );
  const rightReserved = reservedPlacements.find(
    (r) => r.parentMemberId === activeFocusMember.id && r.leg === 'right'
  );

  const handleRunMatching = () => {
    const res = runDailyMatchingEngine();
    setMatchingResult(res);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = members.find(
      (m) =>
        m.id.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        m.fullName.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        m.mobile.includes(searchQuery.trim())
    );
    if (match) {
      setFocusMemberId(match.id);
    }
  };

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-700/40">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-300" />
            <h3 className="font-black text-xl">বাইনারি নেটওয়ার্ক ট্রি ও AI প্লেসমেন্ট ইঞ্জিন</h3>
          </div>
          <p className="text-xs text-teal-100/80 mt-1">
            বাম ও ডান লেগ ভলিউম (GV), খালি স্লটে কাস্টমার রেজিস্ট্রেশন রিজার্ভেশন এবং ডেলিভারি কনফার্মেশনে AI প্লেসমেন্ট
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunMatching}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-2xl text-xs shadow-lg flex items-center gap-2 transition-transform hover:scale-105 shrink-0"
        >
          <Zap className="w-4 h-4 fill-neutral-950" />
          <span>ডেইলি বাইনারি ম্যাচিং রান করুন</span>
        </button>
      </div>

      {/* AI Placement Engine Recommendation Card */}
      <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 dark:from-teal-950/40 dark:via-emerald-950/40 dark:to-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-black text-sm">
            <Bot className="w-5 h-5 text-teal-600" />
            <span>AI Placement Recommendation</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-mono font-bold">
              Recommended Slot: Available
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs font-mono pt-1 text-neutral-700 dark:text-neutral-300">
            <div>Refer ID: <strong className="text-neutral-900 dark:text-white font-bold">{aiRecommendation.sponsorId}</strong></div>
            <div>Placement ID: <strong className="text-neutral-900 dark:text-white font-bold">{aiRecommendation.placementId}</strong></div>
            <div>Position: <strong className="text-emerald-600 uppercase font-bold">{aiRecommendation.position}</strong></div>
            <div className="text-neutral-500 text-[11px] font-sans">({aiRecommendation.placementName})</div>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {aiRecommendation.reasonText}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAiRegistrationOpen(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md flex items-center gap-2 shrink-0 transition-all cursor-pointer hover:scale-102"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>কাস্টমার নিবন্ধন ও স্লট রিজার্ভ করুন (AI Engine)</span>
        </button>
      </div>

      {/* Navigation & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFocusMemberId(currentMember.id)}
            className="p-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>আমার হোম নোড</span>
          </button>

          {focusMemberId !== currentMember.id && (
            <span className="flex items-center gap-1 text-neutral-500">
              <ChevronRight className="w-4 h-4" />
              <span>ফোকাস নোড: <strong>{activeFocusMember.fullName}</strong> ({activeFocusMember.id})</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="মেম্বার আইডি, নাম বা ফোন নম্বর..."
              className="pl-9 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs w-56 font-mono text-neutral-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-bold"
          >
            খুঁজুন
          </button>
        </form>
      </div>

      {matchingResult && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <span className="font-bold">
              ম্যাচিং সম্পন্ন! মোট {formatPV(matchingResult.matchedPV)} PV ম্যাচিং করা হয়েছে। আনুমানিক ইনস্ট্যান্ট পে-আউট: ৳ {(matchingResult.totalPayoutBDT ?? 0).toLocaleString()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMatchingResult(null)}
            className="text-[10px] underline font-semibold"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Group Volume Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 text-[11px] font-semibold block">বাম লেগ GV (Left Volume):</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatPV(activeFocusMember.leftPV)} PV
          </p>
          <span className="text-[10px] text-neutral-400 block">ক্যারী ফরওয়ার্ড: {formatPV(activeFocusMember.leftCarryForward)} PV</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 text-[11px] font-semibold block">ডান লেগ GV (Right Volume):</span>
          <p className="text-2xl font-black text-teal-600 font-mono">
            {formatPV(activeFocusMember.rightPV)} PV
          </p>
          <span className="text-[10px] text-neutral-400 block">ক্যারী ফরওয়ার্ড: {formatPV(activeFocusMember.rightCarryForward)} PV</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 text-[11px] font-semibold block">সর্বমোট ম্যাচিং PV:</span>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {formatPV(activeFocusMember.totalMatchedPV)} PV
          </p>
          <span className="text-[10px] text-neutral-400 block">ম্যাচিং রেট: ৳ ১০ / PV</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-xs space-y-1">
          <span className="text-neutral-500 text-[11px] font-semibold block">স্পন্সর নিয়ম (Sponsor Rule):</span>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            কোম্পানি মাস্টার আইডি (GBD000001)
          </p>
          <span className="text-[10px] text-neutral-400 block">AI অটোমেটিক পজিশন প্লেসমেন্ট</span>
        </div>
      </div>

      {/* Visual Binary Tree Container */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs overflow-x-auto space-y-8 min-w-[650px]">
        {/* Parent Node */}
        <div className="flex flex-col items-center">
          <div className="w-64 p-4 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900 border-2 border-emerald-500 rounded-2xl shadow-lg text-center space-y-2 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-black text-[10px] px-3 py-0.5 rounded-full shadow">
              {activeFocusMember.id === currentMember.id ? 'ROOT NODE (YOU)' : `FOCUS NODE (${activeFocusMember.id})`}
            </span>
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center mx-auto shadow-md text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-neutral-900 dark:text-white">{activeFocusMember.fullName}</h4>
              <p className="text-[10px] text-emerald-600 font-semibold">{activeFocusMember.packageName} • {activeFocusMember.rank}</p>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] border-t border-emerald-200 dark:border-emerald-800 font-mono">
              <div className="text-emerald-700 dark:text-emerald-300 font-bold">L: {formatPV(activeFocusMember.leftPV)} PV</div>
              <div className="text-teal-700 dark:text-teal-300 font-bold">R: {formatPV(activeFocusMember.rightPV)} PV</div>
            </div>
          </div>
        </div>

        {/* Tree Connector Lines */}
        <div className="relative w-full flex justify-center">
          <div className="w-1/2 border-t-2 border-dashed border-emerald-400 dark:border-emerald-600 h-6" />
        </div>

        {/* Level 1 Children (Left Leg vs Right Leg) */}
        <div className="grid grid-cols-2 gap-8">
          {/* LEFT LEG NODE */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full">
              LEFT LEG (বাম শাখা)
            </div>

            {leftChild ? (
              <div
                onClick={() => setFocusMemberId(leftChild.id)}
                className="w-60 p-4 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-2xl shadow text-center space-y-2 cursor-pointer transition-all hover:scale-102"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white">{leftChild.fullName}</h5>
                  <p className="text-[10px] font-mono text-emerald-600">ID: {leftChild.id}</p>
                </div>
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold pt-1.5 border-t border-neutral-200 dark:border-neutral-700 flex justify-around">
                  <span>L: {formatPV(leftChild.leftPV)} PV</span>
                  <span>R: {formatPV(leftChild.rightPV)} PV</span>
                </div>
              </div>
            ) : leftReserved ? (
              <div className="w-60 p-4 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-dashed border-amber-400 rounded-2xl text-center space-y-2">
                <span className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 justify-center mx-auto w-fit">
                  <Clock className="w-3 h-3" /> সংরক্ষিত স্লট (পেন্ডিং অর্ডার)
                </span>
                <div>
                  <h5 className="font-bold text-xs text-amber-950 dark:text-amber-200">{leftReserved.customerName}</h5>
                  <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{leftReserved.customerMobile}</p>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-amber-200 dark:border-amber-800">
                  প্রথম অর্ডার ডেলিভারি ও পেমেন্ট সম্পন্ন হলে AI মেম্বার অ্যাক্টিভেট করবে
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setAddCustomerSlot({
                    parentId: activeFocusMember.id,
                    parentName: activeFocusMember.fullName,
                    leg: 'left'
                  })
                }
                className="w-60 p-5 border-2 border-dashed border-emerald-400 hover:border-emerald-600 dark:border-emerald-700 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex flex-col items-center gap-2 hover:scale-105 transition-all shadow-xs"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-full shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>+ কাস্টমার নিবন্ধন করুন (স্লট রিজার্ভ)</span>
              </button>
            )}
          </div>

          {/* RIGHT LEG NODE */}
          <div className="flex flex-col items-center space-y-4">
            <div className="text-xs font-black text-teal-600 bg-teal-100 dark:bg-teal-950 px-3 py-1 rounded-full">
              RIGHT LEG (ডান শাখা)
            </div>

            {rightChild ? (
              <div
                onClick={() => setFocusMemberId(rightChild.id)}
                className="w-60 p-4 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 hover:border-teal-500 rounded-2xl shadow text-center space-y-2 cursor-pointer transition-all hover:scale-102"
              >
                <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mx-auto shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-neutral-900 dark:text-white">{rightChild.fullName}</h5>
                  <p className="text-[10px] font-mono text-teal-600">ID: {rightChild.id}</p>
                </div>
                <div className="text-[10px] font-mono text-teal-700 dark:text-teal-300 font-bold pt-1.5 border-t border-neutral-200 dark:border-neutral-700 flex justify-around">
                  <span>L: {formatPV(rightChild.leftPV)} PV</span>
                  <span>R: {formatPV(rightChild.rightPV)} PV</span>
                </div>
              </div>
            ) : rightReserved ? (
              <div className="w-60 p-4 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-dashed border-amber-400 rounded-2xl text-center space-y-2">
                <span className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 justify-center mx-auto w-fit">
                  <Clock className="w-3 h-3" /> সংরক্ষিত স্লট (পেন্ডিং অর্ডার)
                </span>
                <div>
                  <h5 className="font-bold text-xs text-amber-950 dark:text-amber-200">{rightReserved.customerName}</h5>
                  <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{rightReserved.customerMobile}</p>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-amber-200 dark:border-amber-800">
                  প্রথম অর্ডার ডেলিভারি ও পেমেন্ট সম্পন্ন হলে AI মেম্বার অ্যাক্টিভেট করবে
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setAddCustomerSlot({
                    parentId: activeFocusMember.id,
                    parentName: activeFocusMember.fullName,
                    leg: 'right'
                  })
                }
                className="w-60 p-5 border-2 border-dashed border-teal-400 hover:border-teal-600 dark:border-teal-700 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 font-bold text-xs flex flex-col items-center gap-2 hover:scale-105 transition-all shadow-xs"
              >
                <div className="p-2 bg-teal-600 text-white rounded-full shadow-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>+ কাস্টমার নিবন্ধন করুন (স্লট রিজার্ভ)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Binary Tree Customer Slot Reservation Modal - EXACT SAME SHARED FORM */}
      {addCustomerSlot && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setAddCustomerSlot(null)}
          source="binary_tree"
          title="কাস্টমার রেজিস্ট্রেশন ও স্লট রিজার্ভ"
          subtitle={`নির্বাচিত পজিশন: ${addCustomerSlot.leg === 'left' ? 'বাম (Left)' : 'ডান (Right)'}`}
          initialReferralId={currentMember?.customerId || currentMember?.id || 'TMK000001'}
          initialPlacementId={addCustomerSlot.parentId}
          initialPlacementPosition={addCustomerSlot.leg}
          lockPlacement={true}
          onSwitchToLogin={() => setAddCustomerSlot(null)}
        />
      )}

      {/* AI Placement Engine Customer Registration Modal - EXACT SAME SHARED FORM */}
      {aiRegistrationOpen && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setAiRegistrationOpen(false)}
          source="ai_placement"
          title="Customer Registration & Slot Reserved"
          aiRecommendation={aiRecommendation}
          initialReferralId={aiRecommendation.sponsorId}
          initialPlacementId={aiRecommendation.placementId}
          initialPlacementPosition={aiRecommendation.position}
          lockPlacement={true}
          onSwitchToLogin={() => setAiRegistrationOpen(false)}
        />
      )}

      {selectedPlacementTarget && (
        <PlacementManagementModal
          isOpen={true}
          onClose={() => setSelectedPlacementTarget(null)}
          parentId={selectedPlacementTarget.parentId}
          leg={selectedPlacementTarget.leg}
        />
      )}
    </div>
  );
};
