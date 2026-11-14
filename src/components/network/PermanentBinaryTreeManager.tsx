/**
 * Permanent Binary Tree System Management Hub for Super Admin
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 * 
 * Rules:
 * - Sponsor Tree & Binary Tree are strictly separated.
 * - sponsor_id: Who referred the member (Direct Sponsor / Referral).
 * - binary_parent_id: Direct parent in binary tree.
 * - position: 'left' | 'right' (max 2 children per parent node: leftChildId & rightChildId).
 * - Permanent placement locked once set. Regular Admin cannot change.
 * - Only Super Admin can reassign with mandatory Audit Log.
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { COMPANY_MASTER_ROOT_ID, NetworkMember } from '../../types/networkMarketing';
import {
  GitBranch,
  Users,
  ShieldCheck,
  Lock,
  Search,
  ChevronRight,
  Home,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Zap,
  User,
  Info,
  Sliders,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  UserPlus
} from 'lucide-react';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { BinaryTreeNodeCard, EmptySlotCard } from './BinaryTreeNodeCard';

export const PermanentBinaryTreeManager: React.FC = () => {
  const { currentUser, auditLogs, allUsers } = useAuth();
  const {
    members,
    currentMember,
    getBlankSlotForParent,
    reassignBinaryPlacementBySuperAdmin,
    commissionConfig,
    runDailyMatchingEngine
  } = useNetworkMarketing();

  const isSuperAdmin = currentUser?.primaryRole === 'super_admin';

  const [activeView, setActiveView] = useState<'visual_binary' | 'sponsor_tree' | 'matrix_table' | 'audit_logs'>('visual_binary');
  const [focusMemberId, setFocusMemberId] = useState<string>(COMPANY_MASTER_ROOT_ID);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeDetails, setSelectedNodeDetails] = useState<NetworkMember | null>(null);

  // New Member Slot Registration Modal State
  const [registerSlotModal, setRegisterSlotModal] = useState<{
    sponsorId: string;
    placementId: string;
    leg: 'left' | 'right';
    reservedCompanyId?: string;
  } | null>(null);

  // Super Admin Placement Reassignment Modal State
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [targetMemberForReassign, setTargetMemberForReassign] = useState<NetworkMember | null>(null);
  const [newParentId, setNewParentId] = useState<string>(COMPANY_MASTER_ROOT_ID);
  const [newPosition, setNewPosition] = useState<'left' | 'right'>('left');
  const [reassignReason, setReassignReason] = useState<string>('');
  const [reassignFeedback, setReassignFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Daily matching result state
  const [matchingResult, setMatchingResult] = useState<{ matchedPV: number; totalPayoutBDT: number } | null>(null);

  // Find member helper
  const getMemberById = (id?: string): NetworkMember | undefined => {
    if (!id) return undefined;
    return members.find((m) => m.id === id || m.userId === id);
  };

  const activeFocusMember = getMemberById(focusMemberId) || members[0];

  // Breadcrumb path from Root to Active Focus Member
  const breadcrumbPath = useMemo(() => {
    const path: NetworkMember[] = [];
    let curr: NetworkMember | undefined = activeFocusMember;
    const visited = new Set<string>();

    while (curr && !visited.has(curr.id)) {
      visited.add(curr.id);
      path.unshift(curr);
      if (!curr.parentId) break;
      curr = getMemberById(curr.parentId);
    }
    return path;
  }, [activeFocusMember, members]);

  // Binary Tree Children Nodes for Multi-Level Rendering
  const level1Left = getMemberById(activeFocusMember?.leftChildId);
  const level1Right = getMemberById(activeFocusMember?.rightChildId);

  const level2LL = level1Left ? getMemberById(level1Left.leftChildId) : undefined;
  const level2LR = level1Left ? getMemberById(level1Left.rightChildId) : undefined;
  const level2RL = level1Right ? getMemberById(level1Right.leftChildId) : undefined;
  const level2RR = level1Right ? getMemberById(level1Right.rightChildId) : undefined;

  // Placement Audit Logs filtered for Binary Tree
  const binaryAuditLogs = useMemo(() => {
    return auditLogs.filter(
      (log) =>
        log.resource === 'PermanentBinaryTree' ||
        log.action.includes('BINARY') ||
        log.details.includes('binary') ||
        log.details.includes('বাইনারি')
    );
  }, [auditLogs]);

  // Handle Search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toLowerCase();
    const match = members.find(
      (m) =>
        m.id.toLowerCase().includes(query) ||
        m.fullName.toLowerCase().includes(query) ||
        m.mobile.includes(query) ||
        (m.email && m.email.toLowerCase().includes(query))
    );
    if (match) {
      setFocusMemberId(match.id);
    } else {
      alert('সদস্য পাওয়া যায়নি! অনুগ্রহ করে সঠিক মেম্বার আইডি বা মোবাইল নম্বর লিখুন।');
    }
  };

  // Open Reassign Modal
  const handleOpenReassignModal = (member: NetworkMember) => {
    if (!isSuperAdmin) {
      alert('অননুমোদিত: শুধুমাত্র সুপার এডমিন পারমানেন্ট বাইনারি প্লেসমেন্ট পরিবর্তন করতে পারেন।');
      return;
    }
    if (member.id === COMPANY_MASTER_ROOT_ID || member.id === 'TMK000001' || !member.parentId) {
      alert('কোম্পানি রুট নোড (Root Node) স্থানান্তর করা সম্ভব নয়।');
      return;
    }
    setTargetMemberForReassign(member);
    setNewParentId(member.parentId || COMPANY_MASTER_ROOT_ID);
    setNewPosition((member.position === 'right' || member.placementLeg === 'right') ? 'right' : 'left');
    setReassignReason('');
    setReassignFeedback(null);
    setReassignModalOpen(true);
  };

  // Execute Reassign by Super Admin
  const handleExecuteReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMemberForReassign) return;
    if (!reassignReason.trim()) {
      setReassignFeedback({
        type: 'error',
        message: 'প্লেসমেন্ট পরিবর্তনের কারণ (Reason) স্পষ্টভাবে উল্লেখ করা বাধ্যতামূলক।'
      });
      return;
    }

    setIsProcessing(true);
    setReassignFeedback(null);

    const result = reassignBinaryPlacementBySuperAdmin({
      targetMemberId: targetMemberForReassign.id,
      newBinaryParentId: newParentId,
      newPosition: newPosition,
      reason: reassignReason.trim()
    });

    setIsProcessing(false);
    if (result.success) {
      setReassignFeedback({ type: 'success', message: result.message });
      setTimeout(() => {
        setReassignModalOpen(false);
        setTargetMemberForReassign(null);
      }, 1800);
    } else {
      setReassignFeedback({ type: 'error', message: result.message });
    }
  };

  // Check Slot Availability on Selected Target Parent
  const targetParentCandidate = getMemberById(newParentId);
  const isLeftOccupiedOnCandidate = !!(
    targetParentCandidate &&
    targetParentCandidate.leftChildId &&
    targetParentCandidate.leftChildId !== targetMemberForReassign?.id
  );
  const isRightOccupiedOnCandidate = !!(
    targetParentCandidate &&
    targetParentCandidate.rightChildId &&
    targetParentCandidate.rightChildId !== targetMemberForReassign?.id
  );

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <GitBranch className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black tracking-tight">
                পারমানেন্ট বাইনারি ট্রি সিস্টেম (Permanent Binary Tree Architecture)
              </h2>
              <span className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 font-black text-[10px] rounded-full uppercase tracking-wider">
                Permanent 1-to-2 Binary Node Lock
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
              স্পন্সর ট্রি (রেফারেল) ও বাইনারি ট্রি সম্পূর্ণ পৃথক। প্রতিটি নোডের সর্বোচ্চ ২টি চাইল্ড (Left/Right)। 
              প্লেসমেন্ট একবার সেট হলে স্থায়ীভাবে সংরক্ষিত থাকে এবং সাধারণ এডমিন পরিবর্তন করতে পারে না। শুধুমাত্র সুপার এডমিনের অনুমোদনে অডিট লগসহ পরিবর্তনযোগ্য।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
            <button
              type="button"
              onClick={() => {
                const res = runDailyMatchingEngine();
                setMatchingResult(res);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-transform hover:scale-102 shrink-0"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>ডেইলি বাইনারি ম্যাচিং রান</span>
            </button>

            <span className="px-3 py-2 bg-neutral-800/90 text-emerald-300 border border-neutral-700 font-bold rounded-xl text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>রোল: {currentUser?.primaryRole === 'super_admin' ? 'সুপার এডমিন (পূর্ণ অনুমতি)' : 'সাধারণ এডমিন (রিড-অনলি)'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Matching Notification Toast */}
      {matchingResult && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600 rounded-2xl text-xs text-amber-950 dark:text-amber-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="font-bold">
              ম্যাচিং সফল! মোট <strong>{formatPV(matchingResult.matchedPV)} PV</strong> ম্যাচিং সম্পন্ন হয়েছে। আনুমানিক পে-আউট: ৳ {(matchingResult.totalPayoutBDT ?? 0).toLocaleString()} (রেট: ৳ {commissionConfig.binaryMatchingRateBDT}/PV)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMatchingResult(null)}
            className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold rounded-lg text-[10px]"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Key Architectural Schema Rules Pill Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">sponsor_id</span>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              সরাসরি রেফারেল স্পন্সর (Unilevel ২০ লেভেল জেনারেশন ট্রি)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <GitBranch className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">binary_parent_id</span>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              বাইনারি ট্রির সরাসরি প্যারেন্ট নোড (সর্বোচ্চ ২টি চাইল্ড)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 block">position = left | right</span>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              বাম লেগ অথবা ডান লেগ প্লেসমেন্ট (leftChild / rightChild)
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs flex items-start gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-red-600 dark:text-red-400 block">Permanent Lock & Audit</span>
            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-medium">
              সাধারণ এডমিন অপরিবর্তনশীল; কেবল সুপার এডমিন অডিট লগসহ প্রযোজ্য
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 pb-2 text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveView('visual_binary')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'visual_binary'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>ভিজুয়াল বাইনারি ট্রি ডায়াগ্রাম (Visual Binary Tree)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('matrix_table')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'matrix_table'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>মেম্বার ডাটাবেজ ও বাইনারি ম্যাট্রিক্স টেবিল (Matrix Table)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('sponsor_tree')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'sponsor_tree'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>স্পন্সর / রেফারেল ট্রি (Sponsor Unilevel Tree)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('audit_logs')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeView === 'audit_logs'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-300" />
          <span>প্লেসমেন্ট পরিবর্তন অডিট লগ ({binaryAuditLogs.length})</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 1. VISUAL BINARY TREE DIAGRAM VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'visual_binary' && (
        <div className="space-y-5">
          
          {/* Controls Bar: Breadcrumb + Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setFocusMemberId(COMPANY_MASTER_ROOT_ID)}
                className="px-2.5 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 rounded-xl flex items-center gap-1 transition-colors"
                title="রুট নোডে ফিরে যান"
              >
                <Home className="w-3.5 h-3.5" />
                <span>কোম্পানি রুট ({COMPANY_MASTER_ROOT_ID})</span>
              </button>

              {breadcrumbPath.map((node, idx) => {
                if (idx === 0) return null; // Skip root as it is already the Home button
                const isLast = idx === breadcrumbPath.length - 1;
                return (
                  <div key={node.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    <button
                      type="button"
                      onClick={() => setFocusMemberId(node.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        isLast
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      {node.fullName} ({node.id})
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Search Member Form */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`মেম্বার আইডি (e.g. ${COMPANY_MASTER_ROOT_ID}) বা নাম...`}
                  className="pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs w-60 font-mono text-neutral-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                খুঁজুন
              </button>
            </form>
          </div>

          {/* Active Node Summary Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-semibold block">ফোকাস নোড (Active Node):</span>
              <p className="text-sm font-black text-neutral-900 dark:text-white truncate">
                {activeFocusMember.fullName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono">
                <span>ID: {activeFocusMember.id}</span>
                <span>•</span>
                <span className="capitalize">{activeFocusMember.rank.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-semibold block">বাম লেগ GV (Left Volume):</span>
              <p className="text-xl font-black text-emerald-600 font-mono">
                {formatPV(activeFocusMember.leftPV)} PV
              </p>
              <span className="text-[10px] text-neutral-400 block">ক্যারী ফরওয়ার্ড: {formatPV(activeFocusMember.leftCarryForward)} PV</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-semibold block">ডান লেগ GV (Right Volume):</span>
              <p className="text-xl font-black text-teal-600 font-mono">
                {formatPV(activeFocusMember.rightPV)} PV
              </p>
              <span className="text-[10px] text-neutral-400 block">ক্যারী ফরওয়ার্ড: {formatPV(activeFocusMember.rightCarryForward)} PV</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-semibold block">সর্বমোট ম্যাচিং PV & কমিশন:</span>
              <p className="text-xl font-black text-amber-600 font-mono">
                {formatPV(activeFocusMember.totalMatchedPV)} PV
              </p>
              <span className="text-[10px] text-amber-600 font-bold block">
                মোট কমিশন: ৳ {(activeFocusMember.totalMatchedPV * commissionConfig.binaryMatchingRateBDT).toLocaleString()}
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3.5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[11px] text-neutral-500 font-semibold block">স্পন্সর ও প্যারেন্ট রেফারেন্স:</span>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 truncate">
                স্পন্সর: <strong>{activeFocusMember.sponsorId || 'None'}</strong>
              </p>
              <p className="text-[11px] text-neutral-700 dark:text-neutral-300 truncate">
                প্যারেন্ট: <strong>{activeFocusMember.parentId || 'Root'}</strong> ({activeFocusMember.position || activeFocusMember.placementLeg})
              </p>
            </div>
          </div>

          {/* Interactive Multi-Level Binary Tree Visualization Canvas */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs overflow-x-auto min-w-[760px] space-y-8">
            
            {/* LEVEL 0: ROOT / FOCUS NODE */}
            <div className="flex flex-col items-center">
              <BinaryTreeNodeCard
                member={activeFocusMember}
                allMembers={members}
                allUsers={allUsers}
                isRoot={activeFocusMember.id === COMPANY_MASTER_ROOT_ID}
                legLabel={activeFocusMember.id === COMPANY_MASTER_ROOT_ID ? 'COMPANY ROOT (LEVEL 0)' : `FOCUS NODE (${activeFocusMember.id})`}
                isSuperAdmin={isSuperAdmin}
                onFocus={setFocusMemberId}
                onDetails={setSelectedNodeDetails}
                onReassign={handleOpenReassignModal}
              />
            </div>

            {/* Tree Branch Connector SVG Lines Level 0 to Level 1 */}
            <div className="relative w-full flex justify-center">
              <div className="w-2/3 border-t-2 border-dashed border-emerald-400 dark:border-emerald-600 h-6" />
            </div>

            {/* LEVEL 1: TWO CHILDREN (LEFT LEG vs RIGHT LEG) */}
            <div className="grid grid-cols-2 gap-10">
              {/* LEFT CHILD (LEFT LEG) */}
              <div className="flex flex-col items-center space-y-3">
                {level1Left ? (
                  <BinaryTreeNodeCard
                    member={level1Left}
                    allMembers={members}
                    allUsers={allUsers}
                    legLabel="LEFT LEG (বাম শাখা - 1)"
                    isSuperAdmin={isSuperAdmin}
                    onFocus={setFocusMemberId}
                    onDetails={setSelectedNodeDetails}
                    onReassign={handleOpenReassignModal}
                  />
                ) : (
                  <EmptySlotCard
                    parentMember={activeFocusMember}
                    leg="left"
                    reservedBlankId={activeFocusMember.leftBlankId || getBlankSlotForParent(activeFocusMember.id, 'left')?.id}
                    onRegister={(sponsorId, placementId, leg, reservedCompanyId) =>
                      setRegisterSlotModal({ sponsorId, placementId, leg, reservedCompanyId })
                    }
                  />
                )}
              </div>

              {/* RIGHT CHILD (RIGHT LEG) */}
              <div className="flex flex-col items-center space-y-3">
                {level1Right ? (
                  <BinaryTreeNodeCard
                    member={level1Right}
                    allMembers={members}
                    allUsers={allUsers}
                    legLabel="RIGHT LEG (ডান শাখা - 2)"
                    isSuperAdmin={isSuperAdmin}
                    onFocus={setFocusMemberId}
                    onDetails={setSelectedNodeDetails}
                    onReassign={handleOpenReassignModal}
                  />
                ) : (
                  <EmptySlotCard
                    parentMember={activeFocusMember}
                    leg="right"
                    reservedBlankId={activeFocusMember.rightBlankId || getBlankSlotForParent(activeFocusMember.id, 'right')?.id}
                    onRegister={(sponsorId, placementId, leg, reservedCompanyId) =>
                      setRegisterSlotModal({ sponsorId, placementId, leg, reservedCompanyId })
                    }
                  />
                )}
              </div>
            </div>

            {/* LEVEL 2: 4 GRANDCHILDREN (LL, LR, RL, RR) */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <div className="text-center text-xs font-bold text-neutral-500 mb-4">
                লেভেল ২ ডাউনলাইন সাব-নোড (Level 2 Subtree Matrix)
              </div>

              <div className="grid grid-cols-4 gap-3 text-xs">
                {/* LL */}
                <div>
                  {level2LL ? (
                    <BinaryTreeNodeCard
                      member={level2LL}
                      allMembers={members}
                      allUsers={allUsers}
                      legLabel="Left ➔ Left"
                      isCompact={true}
                      onFocus={setFocusMemberId}
                      onDetails={setSelectedNodeDetails}
                    />
                  ) : level1Left ? (
                    (() => {
                      const blankLL = level1Left.leftBlankId || getBlankSlotForParent(level1Left.id, 'left')?.id;
                      return (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl text-center space-y-1">
                          <span className="text-[9px] font-bold text-emerald-600 block">Left ➔ Left (LEFT BLANK)</span>
                          {blankLL && <span className="font-mono font-black text-[11px] text-indigo-600 block">[{blankLL}]</span>}
                          <button
                            type="button"
                            onClick={() =>
                              setRegisterSlotModal({
                                sponsorId: level1Left.customerId || level1Left.id,
                                placementId: level1Left.id,
                                leg: 'left',
                                reservedCompanyId: blankLL
                              })
                            }
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline block mx-auto py-0.5 cursor-pointer"
                          >
                            + Click to Register
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-neutral-400 block">Left ➔ Left</span>
                      <span className="text-[10px] text-neutral-400 italic">স্লট লকড</span>
                    </div>
                  )}
                </div>

                {/* LR */}
                <div>
                  {level2LR ? (
                    <BinaryTreeNodeCard
                      member={level2LR}
                      allMembers={members}
                      allUsers={allUsers}
                      legLabel="Left ➔ Right"
                      isCompact={true}
                      onFocus={setFocusMemberId}
                      onDetails={setSelectedNodeDetails}
                    />
                  ) : level1Left ? (
                    (() => {
                      const blankLR = level1Left.rightBlankId || getBlankSlotForParent(level1Left.id, 'right')?.id;
                      return (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl text-center space-y-1">
                          <span className="text-[9px] font-bold text-emerald-600 block">Left ➔ Right (RIGHT BLANK)</span>
                          {blankLR && <span className="font-mono font-black text-[11px] text-indigo-600 block">[{blankLR}]</span>}
                          <button
                            type="button"
                            onClick={() =>
                              setRegisterSlotModal({
                                sponsorId: level1Left.customerId || level1Left.id,
                                placementId: level1Left.id,
                                leg: 'right',
                                reservedCompanyId: blankLR
                              })
                            }
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline block mx-auto py-0.5 cursor-pointer"
                          >
                            + Click to Register
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-neutral-400 block">Left ➔ Right</span>
                      <span className="text-[10px] text-neutral-400 italic">স্লট লকড</span>
                    </div>
                  )}
                </div>

                {/* RL */}
                <div>
                  {level2RL ? (
                    <BinaryTreeNodeCard
                      member={level2RL}
                      allMembers={members}
                      allUsers={allUsers}
                      legLabel="Right ➔ Left"
                      isCompact={true}
                      onFocus={setFocusMemberId}
                      onDetails={setSelectedNodeDetails}
                    />
                  ) : level1Right ? (
                    (() => {
                      const blankRL = level1Right.leftBlankId || getBlankSlotForParent(level1Right.id, 'left')?.id;
                      return (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-dashed border-teal-300 dark:border-teal-800 rounded-xl text-center space-y-1">
                          <span className="text-[9px] font-bold text-teal-600 block">Right ➔ Left (LEFT BLANK)</span>
                          {blankRL && <span className="font-mono font-black text-[11px] text-indigo-600 block">[{blankRL}]</span>}
                          <button
                            type="button"
                            onClick={() =>
                              setRegisterSlotModal({
                                sponsorId: level1Right.customerId || level1Right.id,
                                placementId: level1Right.id,
                                leg: 'left',
                                reservedCompanyId: blankRL
                              })
                            }
                            className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline block mx-auto py-0.5 cursor-pointer"
                          >
                            + Click to Register
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-neutral-400 block">Right ➔ Left</span>
                      <span className="text-[10px] text-neutral-400 italic">স্লট লকড</span>
                    </div>
                  )}
                </div>

                {/* RR */}
                <div>
                  {level2RR ? (
                    <BinaryTreeNodeCard
                      member={level2RR}
                      allMembers={members}
                      allUsers={allUsers}
                      legLabel="Right ➔ Right"
                      isCompact={true}
                      onFocus={setFocusMemberId}
                      onDetails={setSelectedNodeDetails}
                    />
                  ) : level1Right ? (
                    (() => {
                      const blankRR = level1Right.rightBlankId || getBlankSlotForParent(level1Right.id, 'right')?.id;
                      return (
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-dashed border-teal-300 dark:border-teal-800 rounded-xl text-center space-y-1">
                          <span className="text-[9px] font-bold text-teal-600 block">Right ➔ Right (RIGHT BLANK)</span>
                          {blankRR && <span className="font-mono font-black text-[11px] text-indigo-600 block">[{blankRR}]</span>}
                          <button
                            type="button"
                            onClick={() =>
                              setRegisterSlotModal({
                                sponsorId: level1Right.customerId || level1Right.id,
                                placementId: level1Right.id,
                                leg: 'right',
                                reservedCompanyId: blankRR
                              })
                            }
                            className="text-[10px] text-teal-600 hover:text-teal-700 font-bold hover:underline block mx-auto py-0.5 cursor-pointer"
                          >
                            + Click to Register
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl text-center">
                      <span className="text-[9px] font-bold text-neutral-400 block">Right ➔ Right</span>
                      <span className="text-[10px] text-neutral-400 italic">স্লট লকড</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. ALL MEMBERS & BINARY MATRIX TABLE VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'matrix_table' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>পারমানেন্ট বাইনারি মেম্বার ম্যাট্রিক্স ডাটাবেজ</span>
              </h3>
              <p className="text-xs text-neutral-500">
                সকল মেম্বারের Sponsor ID, Binary Parent ID, Position, Child Slots ও PV ক্যালকুলেশন
              </p>
            </div>

            <div className="text-xs font-mono font-bold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl">
              মোট মেম্বার: {members.length} জন
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">মেম্বার আইডি & নাম</th>
                  <th className="py-3 px-3">স্পন্সর (sponsor_id)</th>
                  <th className="py-3 px-3">প্যারেন্ট (binary_parent_id)</th>
                  <th className="py-3 px-3">পজিশন</th>
                  <th className="py-3 px-3">লেফট চাইল্ড</th>
                  <th className="py-3 px-3">রাইট চাইল্ড</th>
                  <th className="py-3 px-3 text-right">Left PV / Right PV</th>
                  <th className="py-3 px-3 text-right">ম্যাচিং PV</th>
                  <th className="py-3 px-3 text-center">স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-center">একশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {members.map((m) => {
                  const sponsorObj = getMemberById(m.sponsorId);
                  const parentObj = getMemberById(m.parentId);
                  const leftChildObj = getMemberById(m.leftChildId);
                  const rightChildObj = getMemberById(m.rightChildId);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">{m.fullName}</p>
                            <span className="font-mono text-[10px] text-emerald-600 font-bold">{m.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">{m.sponsorId || 'None'}</span>
                        <span className="text-[10px] text-neutral-400 truncate block max-w-[120px]">{sponsorObj?.fullName || 'Root Upline'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">{m.parentId || 'Root'}</span>
                        <span className="text-[10px] text-neutral-400 truncate block max-w-[120px]">{parentObj?.fullName || 'Root Leader'}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            m.position === 'Root' || !m.parentId
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : m.position === 'left' || m.placementLeg === 'left'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          }`}
                        >
                          {m.position || m.placementLeg || 'Root'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {leftChildObj ? (
                          <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {leftChildObj.id} ({leftChildObj.fullName.split(' ')[0]})
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">খালি</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {rightChildObj ? (
                          <span className="font-mono text-[11px] font-bold text-teal-600 dark:text-teal-400">
                            {rightChildObj.id} ({rightChildObj.fullName.split(' ')[0]})
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">খালি</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-emerald-600 font-bold">{formatPV(m.leftPV)} PV</div>
                        <div className="text-teal-600 font-bold">{formatPV(m.rightPV)} PV</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                        {formatPV(m.totalMatchedPV)} PV
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          <Lock className="w-3 h-3 text-neutral-500" />
                          <span>পারমানেন্ট</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFocusMemberId(m.id);
                              setActiveView('visual_binary');
                            }}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg"
                            title="ট্রি ডায়াগ্রামে দেখুন"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                          
                          {isSuperAdmin && m.parentId && (
                            <button
                              type="button"
                              onClick={() => handleOpenReassignModal(m)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs"
                              title="সুপার এডমিন প্লেসমেন্ট পরিবর্তন"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>রি-অ্যাসাইন</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 3. SPONSOR TREE VIEW (UNILEVEL REFERRAL STRUCTURE) */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'sponsor_tree' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>স্পন্সর / রেফারেল ট্রি (Direct Sponsor Unilevel Hierarchy)</span>
              </h3>
              <p className="text-xs text-neutral-500">
                `sponsor_id` এর ভিত্তিতে সরাসরি রেফারেল অনুযায়ী ২০ জেনারেশন টিম স্ট্রাকচার
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-xl text-xs font-bold font-mono">
              Unilevel Direct Referrals
            </span>
          </div>

          <div className="space-y-3">
            {members.map((m) => {
              const directs = members.filter((child) => child.sponsorId === m.id);
              if (directs.length === 0 && m.id !== COMPANY_MASTER_ROOT_ID) return null;

              return (
                <div key={m.id} className="p-4 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white">{m.fullName}</h4>
                        <span className="font-mono text-[10px] text-blue-600 font-bold">Sponsor ID: {m.id}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-neutral-500">
                      সরাসরি স্পন্সরকৃত: <strong className="text-blue-600">{directs.length} জন</strong>
                    </div>
                  </div>

                  {directs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-4 border-l-2 border-blue-400 dark:border-blue-700">
                      {directs.map((d) => (
                        <div key={d.id} className="p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">{d.fullName}</p>
                            <span className="text-[10px] font-mono text-neutral-400">{d.id}</span>
                          </div>
                          <div className="text-right text-[10px]">
                            <span className="text-neutral-500 block">Binary Parent:</span>
                            <span className="font-mono font-bold text-emerald-600">{d.parentId} ({d.position})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 4. AUDIT LOGS VIEW */}
      {/* ---------------------------------------------------------------------- */}
      {activeView === 'audit_logs' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h3 className="font-black text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>পারমানেন্ট বাইনারি প্লেসমেন্ট অডিট লগ (Audit Log)</span>
              </h3>
              <p className="text-xs text-neutral-500">
                সুপার এডমিন কর্তৃক সম্পাদিত প্রতিটি প্লেসমেন্ট পরিবর্তন, তারিখ, পূর্ববর্তী প্যারেন্ট, নতুন প্যারেন্ট ও কারণ
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold">
              মোট অডিট রেকর্ড: {binaryAuditLogs.length} টি
            </span>
          </div>

          {binaryAuditLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-400 text-xs border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
              এখনও পর্যন্ত কোনো প্লেসমেন্ট পরিবর্তন করা হয়নি। ট্রি সম্পূর্ণ স্থায়ী রয়েছে।
            </div>
          ) : (
            <div className="space-y-2.5">
              {binaryAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-red-600 dark:text-red-400 text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('bn-BD') : 'Recent'}
                    </span>
                  </div>
                  <p className="text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                    {log.details}
                  </p>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                    <span>রিসোর্স: {log.resource}</span>
                    <span>•</span>
                    <span>এডমিন: {log.actorName} ({log.actorRole})</span>
                    <span>•</span>
                    <span>আইডি: {log.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SUPER ADMIN PLACEMENT REASSIGNMENT MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {reassignModalOpen && targetMemberForReassign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-red-600">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white">
                  সুপার এডমিন প্লেসমেন্ট পুনর্নির্ধারণ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-xs text-red-900 dark:text-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>সতর্কবার্তা (Super Admin Authorization Required)</span>
              </div>
              <p className="text-[11px]">
                এই পরিবর্তনটি সরাসরি বাইনারি ট্রি স্ট্রাকচারকে প্রভাবিত করবে। প্রতিটি পরিবর্তনের রেকর্ড স্থায়ী <strong>Audit Log</strong>-এ সংরক্ষিত হবে।
              </p>
            </div>

            <form onSubmit={handleExecuteReassign} className="space-y-4 text-xs">
              
              {/* Target Member Info */}
              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl space-y-1">
                <span className="text-[10px] text-neutral-500 font-bold block">স্থানান্তরকৃত মেম্বার (Target Member):</span>
                <p className="font-black text-neutral-900 dark:text-white text-sm">
                  {targetMemberForReassign.fullName} ({targetMemberForReassign.id})
                </p>
                <p className="text-[10px] text-neutral-500 font-mono">
                  বর্তমান প্যারেন্ট: {targetMemberForReassign.parentId} (Leg: {targetMemberForReassign.position || targetMemberForReassign.placementLeg})
                </p>
              </div>

              {/* New Parent Node Selector */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  নতুন বাইনারি প্যারেন্ট নির্বাচন করুন (New binary_parent_id):
                </label>
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-xs font-bold text-neutral-900 dark:text-white font-mono"
                >
                  {members
                    .filter((m) => m.id !== targetMemberForReassign.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} - {m.fullName} ({m.rank.replace(/_/g, ' ')})
                      </option>
                    ))}
                </select>
              </div>

              {/* Position Selector (Left vs Right) */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  পজিশন নির্বাচন করুন (Position: left / right):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPosition('left')}
                    className={`p-3 rounded-xl font-bold border flex flex-col items-center gap-1 transition-all ${
                      newPosition === 'left'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span>বাম শাখা (LEFT LEG)</span>
                    <span className="text-[10px] font-normal">
                      {isLeftOccupiedOnCandidate ? '⚠️ পূর্ণ (Occupied)' : '✅ খালি স্লট'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPosition('right')}
                    className={`p-3 rounded-xl font-bold border flex flex-col items-center gap-1 transition-all ${
                      newPosition === 'right'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                        : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <span>ডান শাখা (RIGHT LEG)</span>
                    <span className="text-[10px] font-normal">
                      {isRightOccupiedOnCandidate ? '⚠️ পূর্ণ (Occupied)' : '✅ খালি স্লট'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mandatory Reason */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  পরিবর্তনের কারণ (Mandatory Audit Reason): <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="যেমন: সাংগঠনিক ভারসাম্য রক্ষা ও সুপার এডমিন বিশেষ অনুমোদন..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-white"
                />
              </div>

              {/* Feedback Alert */}
              {reassignFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    reassignFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {reassignFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>{reassignFeedback.message}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isProcessing ? 'আপডেট হচ্ছে...' : 'প্লেসমেন্ট পরিবর্তন নিশ্চিত করুন'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* NODE DETAILS DRAWER/MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {selectedNodeDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-neutral-900 dark:text-white">
                  মেম্বার নোড ও বাইনারি রেকর্ড
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeDetails(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl space-y-1">
                <h4 className="font-black text-sm text-neutral-900 dark:text-white">{selectedNodeDetails.fullName}</h4>
                <div className="flex items-center gap-2 text-neutral-500 font-mono text-[10px]">
                  <span>Member ID: {selectedNodeDetails.id}</span>
                  <span>•</span>
                  <span>Mobile: {selectedNodeDetails.mobile}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Sponsor ID:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedNodeDetails.sponsorId || 'None'}</span>
                </div>

                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Binary Parent ID:</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedNodeDetails.parentId || 'Root'}</span>
                </div>

                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Position Leg:</span>
                  <span className="font-bold uppercase text-neutral-800 dark:text-neutral-200">
                    {selectedNodeDetails.position || selectedNodeDetails.placementLeg}
                  </span>
                </div>

                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-[10px] text-neutral-400 block">Personal PV:</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatPV(selectedNodeDetails.pv)} PV</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Left Leg GV:</span>
                  <span className="font-bold text-emerald-600">{formatPV(selectedNodeDetails.leftPV)} PV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Right Leg GV:</span>
                  <span className="font-bold text-teal-600">{formatPV(selectedNodeDetails.rightPV)} PV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Matched PV:</span>
                  <span className="font-bold text-amber-600">{formatPV(selectedNodeDetails.totalMatchedPV)} PV</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-500">Binary Commission:</span>
                  <span className="font-bold text-amber-600">৳ {(selectedNodeDetails.totalMatchedPV * commissionConfig.binaryMatchingRateBDT).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setFocusMemberId(selectedNodeDetails.id);
                  setSelectedNodeDetails(null);
                  setActiveView('visual_binary');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                এই নোডে ট্রি ফোকাস করুন
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Member Slot Registration Modal - EXACT SAME SHARED FORM */}
      {registerSlotModal && (
        <CustomerRegistrationModal
          isOpen={!!registerSlotModal}
          onClose={() => setRegisterSlotModal(null)}
          onSwitchToLogin={() => setRegisterSlotModal(null)}
          source="binary_tree"
          title="Customer Registration & Slot Reserved"
          reservedCompanyId={registerSlotModal.reservedCompanyId}
          initialReferralId={registerSlotModal.sponsorId}
          initialPlacementId={registerSlotModal.placementId}
          initialPlacementPosition={registerSlotModal.leg}
          lockPlacement={true}
        />
      )}

    </div>
  );
};
