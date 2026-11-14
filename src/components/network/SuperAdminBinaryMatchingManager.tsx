/**
 * Super Admin — Binary Tree & Matching Management System
 * Project: Apon Bazar (আপন বাজার)
 * 
 * Rules & Architecture:
 * 1. Company Master Root: GBD000001 is the fixed root node of the binary tree.
 * 2. True Two-Leg Binary Structure: Each parent node has at most one LEFT and one RIGHT child.
 * 3. Strict Separation: Sponsor Relationship (Recruiter) vs. Placement Relationship (Binary Parent).
 * 4. Formula: Matched PV = MIN(Left Eligible PV, Right Eligible PV),
 *    Left CF = Left PV - Matched PV, Right CF = Right PV - Matched PV.
 * 5. Immutable Matching Records: Historical matching events are never overwritten.
 * 6. Audit Logging: Manual adjustments require Reason + Admin ID + Timestamp.
 * 7. Security: Strictly protected for Super Admin users only.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { NetworkMember, MatchingRecord, COMPANY_MASTER_ROOT_ID } from '../../types/networkMarketing';
import {
  GitBranch,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Users,
  ShieldCheck,
  Lock,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  User,
  UserPlus,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  TrendingUp,
  Award,
  Eye,
  X,
  ExternalLink,
  ShieldAlert,
  ArrowDownRight,
  ArrowDownLeft,
  ArrowLeft,
  RefreshCw,
  FolderTree,
  Activity
} from 'lucide-react';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { IsolatedSubtreeStats } from '../../lib/binaryBlankPositionEngine';

const TREE_URL_PARAM = 'treeCompanyId';

function getInitialTreeCompanyIdFromUrl(defaultId: string): string {
  if (typeof window === 'undefined') return defaultId;
  try {
    const params = new URLSearchParams(window.location.search);
    const val = params.get(TREE_URL_PARAM)?.trim();
    return val || defaultId;
  } catch {
    return defaultId;
  }
}

function syncTreeCompanyIdToUrl(companyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(TREE_URL_PARAM, companyId);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // Ignore history restrictions in constrained frames
  }
}

export const SuperAdminBinaryMatchingManager: React.FC = () => {
  const { currentUser, allUsers, addAuditLog } = useAuth();
  const {
    members,
    allTreeNodes,
    blankPositions,
    treeState,
    matchingHistory,
    fetchIsolatedSubtree,
    executeMemberMatching,
    executeNetworkBatchMatching,
    manualCarryForwardAdjustment,
    commissionConfig
  } = useNetworkMarketing();

  const isSuperAdmin = currentUser?.primaryRole === 'super_admin';

  // Navigation Tabs: Binary Tree | Matching | Matching History | Member Search | Reports
  const [activeTab, setActiveTab] = useState<'binary_tree' | 'matching' | 'matching_history' | 'member_search' | 'reports'>('binary_tree');

  // Isolated ID-Wise Subtree State (synced with URL for refresh persistence)
  const [focusMemberId, setFocusMemberId] = useState<string>(() =>
    getInitialTreeCompanyIdFromUrl(COMPANY_MASTER_ROOT_ID)
  );
  const [treeHistoryStack, setTreeHistoryStack] = useState<string[]>([]);
  const [isolatedNodes, setIsolatedNodes] = useState<NetworkMember[]>([]);
  const [isolatedStats, setIsolatedStats] = useState<IsolatedSubtreeStats | null>(null);
  const [isLoadingSubtree, setIsLoadingSubtree] = useState<boolean>(false);
  const [subtreeError, setSubtreeError] = useState<{
    statusCode: number;
    code?: string;
    message: string;
    queriedId?: string;
  } | null>(null);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Blank Position Click -> Registration Modal State
  const [registerBlankSlotModal, setRegisterBlankSlotModal] = useState<{
    reservedCompanyId: string;
    parentId: string;
    leg: 'left' | 'right';
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Selected Member Details Slide-Over Modal
  const [selectedMemberModal, setSelectedMemberModal] = useState<NetworkMember | null>(null);

  // Main Company ID Search & Open State
  const [treeSearchQuery, setTreeSearchQuery] = useState<string>(() =>
    getInitialTreeCompanyIdFromUrl(COMPANY_MASTER_ROOT_ID) === COMPANY_MASTER_ROOT_ID
      ? ''
      : getInitialTreeCompanyIdFromUrl(COMPANY_MASTER_ROOT_ID)
  );
  const [inSubtreeFindQuery, setInSubtreeFindQuery] = useState<string>('');
  const [treeSearchHighlightId, setTreeSearchHighlightId] = useState<string | null>(null);

  // Dedicated Member Search Tab State
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [searchedMember, setSearchedMember] = useState<NetworkMember | null>(null);
  const [memberSearchError, setMemberSearchError] = useState<string | null>(null);

  // Matching View State
  const [matchingMemberId, setMatchingMemberId] = useState<string>(COMPANY_MASTER_ROOT_ID);
  const [matchingReason, setMatchingReason] = useState('');
  const [matchingFeedback, setMatchingFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessingMatching, setIsProcessingMatching] = useState(false);

  // Manual Adjustment Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustMemberId, setAdjustMemberId] = useState<string>(COMPANY_MASTER_ROOT_ID);
  const [adjustLeftNew, setAdjustLeftNew] = useState<number>(0);
  const [adjustRightNew, setAdjustRightNew] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustFeedback, setAdjustFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // History Tab Filter States
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'last_7_days' | 'this_month'>('all');

  // Reports Tab Filter States
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

  // Helper lookup (registered members for matching/reports tabs)
  const getMemberById = (id?: string): NetworkMember | undefined => {
    if (!id) return undefined;
    const clean = id.trim().toLowerCase();
    return members.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        (m.customerId && m.customerId.toLowerCase() === clean) ||
        (m.permanentMemberId && m.permanentMemberId.toLowerCase() === clean) ||
        (m.member_id && m.member_id.toLowerCase() === clean)
    );
  };

  // Strict isolated map for Binary Tree Canvas (contains ONLY nodes returned by server subtree endpoint)
  const isolatedNodeMap = useMemo(() => {
    const map = new Map<string, NetworkMember>();
    for (const n of isolatedNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [isolatedNodes]);

  const getIsolatedNodeById = (id?: string): NetworkMember | undefined => {
    if (!id) return undefined;
    return isolatedNodeMap.get(id);
  };

  // Helper to build depth-limited or full expansion state for the isolated subtree
  const computeExpandedForSubtree = (
    nodes: NetworkMember[],
    rootId: string,
    maxLevels: number | 'all'
  ): Record<string, boolean> => {
    const byId = new Map<string, NetworkMember>();
    nodes.forEach((n) => byId.set(n.id, n));
    const exp: Record<string, boolean> = {};
    const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: 1 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = byId.get(id);
      if (!node) continue;

      const shouldExpand = maxLevels === 'all' ? true : level < maxLevels;
      if (shouldExpand) {
        exp[id] = true;
        const leftId = node.leftChildId || node.leftBlankId;
        const rightId = node.rightChildId || node.rightBlankId;
        if (leftId) queue.push({ id: leftId, level: level + 1 });
        if (rightId) queue.push({ id: rightId, level: level + 1 });
      }
    }
    return exp;
  };

  // Open any Company ID as an isolated temporary root via server endpoint
  const openSubtreeById = async (
    targetId: string,
    options?: { pushHistory?: boolean; resetZoom?: boolean }
  ) => {
    const cleanTarget = (targetId || '').trim();
    if (!cleanTarget) {
      setSubtreeError({
        statusCode: 400,
        code: 'INVALID_INPUT',
        message: 'অনুগ্রহ করে একটি বৈধ Company ID লিখুন।'
      });
      return;
    }

    setIsLoadingSubtree(true);
    const resp = await fetchIsolatedSubtree(cleanTarget);
    setIsLoadingSubtree(false);

    if (!resp.success || !resp.rootId || !resp.nodes || !resp.stats) {
      // NEVER render a fake or guessed tree on 404/403
      setSubtreeError({
        statusCode: resp.statusCode || 404,
        code: resp.errorCode,
        message: resp.message || `Company ID '${cleanTarget}' পাওয়া যায়নি।`,
        queriedId: cleanTarget
      });
      return;
    }

    if (options?.pushHistory && focusMemberId && focusMemberId.toUpperCase() !== resp.rootId.toUpperCase()) {
      setTreeHistoryStack((prev) => [...prev, focusMemberId]);
    }

    setSubtreeError(null);
    setFocusMemberId(resp.rootId);
    setIsolatedNodes(resp.nodes);
    setIsolatedStats(resp.stats);
    setSelectedLevelFilter('all');
    setExpandedNodes(computeExpandedForSubtree(resp.nodes, resp.rootId, 'all'));
    setTreeSearchHighlightId(null);
    if (options?.resetZoom) {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }
    syncTreeCompanyIdToUrl(resp.rootId);
  };

  // Hydrate isolated subtree on mount, URL change, or tree mutation (e.g. blank slot registration)
  useEffect(() => {
    if (!isSuperAdmin) return;
    openSubtreeById(focusMemberId, { pushHistory: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, treeState.version]);

  const activeFocusMember = getIsolatedNodeById(focusMemberId) || isolatedNodes[0];
  const activeMatchingMember = getMemberById(matchingMemberId) || getMemberById(COMPANY_MASTER_ROOT_ID) || members[0];

  // Expand / Collapse / Level Navigation Helpers (scoped strictly to isolated subtree)
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const expandAllNodes = () => {
    setSelectedLevelFilter('all');
    setExpandedNodes(computeExpandedForSubtree(isolatedNodes, focusMemberId, 'all'));
  };

  const collapseAllNodes = () => {
    setSelectedLevelFilter(1);
    setExpandedNodes({});
  };

  const handleSelectTreeLevel = (levelVal: number | 'all') => {
    setSelectedLevelFilter(levelVal);
    setExpandedNodes(computeExpandedForSubtree(isolatedNodes, focusMemberId, levelVal));
  };

  const handleGoBackRoot = () => {
    if (treeHistoryStack.length === 0) return;
    const prevRoot = treeHistoryStack[treeHistoryStack.length - 1];
    setTreeHistoryStack((prev) => prev.slice(0, -1));
    setTreeSearchQuery(prevRoot === COMPANY_MASTER_ROOT_ID ? '' : prevRoot);
    openSubtreeById(prevRoot, { pushHistory: false, resetZoom: true });
  };

  const resetTreeView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setTreeHistoryStack([]);
    setTreeSearchQuery('');
    openSubtreeById(COMPANY_MASTER_ROOT_ID, { pushHistory: false });
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 2.0));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.4));

  // Canvas Pan Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Main Search & Open Handler: Opens entered Company ID as Isolated Temporary Root
  const handleTreeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = treeSearchQuery.trim();
    if (!clean) {
      setSubtreeError({
        statusCode: 400,
        code: 'INVALID_INPUT',
        message: 'অনুগ্রহ করে একটি Company ID লিখুন (যেমন: GBD000001, GBD000002, GBD000008)।'
      });
      return;
    }
    openSubtreeById(clean, { pushHistory: true, resetZoom: true });
  };

  // Quick Find & Highlight strictly within the currently loaded isolated subtree
  const handleFindInsideSubtree = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inSubtreeFindQuery.trim().toLowerCase();
    if (!q) {
      setTreeSearchHighlightId(null);
      return;
    }
    const match = isolatedNodes.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.id.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        (m.mobile && m.mobile.includes(q)) ||
        (m.aponUniqueId && m.aponUniqueId.toLowerCase().includes(q))
    );

    if (match) {
      setTreeSearchHighlightId(match.id);
      const newExp: Record<string, boolean> = { ...expandedNodes, [match.id]: true };
      let curr: NetworkMember | undefined = match;
      const visited = new Set<string>();
      while (curr?.parentId && !visited.has(curr.id)) {
        visited.add(curr.id);
        newExp[curr.parentId] = true;
        curr = getIsolatedNodeById(curr.parentId);
      }
      setExpandedNodes(newExp);
    } else {
      setTreeSearchHighlightId(null);
      setSubtreeError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `বর্তমান নেটওয়ার্ক (${focusMemberId})-এর ভেতরে '${inSubtreeFindQuery}' পাওয়া যায়নি।`,
        queriedId: inSubtreeFindQuery
      });
    }
  };

  // Dedicated Member Search Submit
  const handleDedicatedMemberSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberSearchQuery.trim()) return;
    const q = memberSearchQuery.trim().toLowerCase();
    const match = members.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.id.toLowerCase().includes(q) ||
        m.fullName.toLowerCase().includes(q) ||
        (m.mobile && m.mobile.includes(q))
    );
    if (match) {
      setMemberSearchError(null);
      setSearchedMember(match);
    } else {
      setSearchedMember(null);
      setMemberSearchError(`মেম্বার আইডি, নাম বা মোবাইল '${memberSearchQuery}' দিয়ে কোনো সদস্য খুঁজে পাওয়া যায়নি।`);
    }
  };

  // Execute Single Member Matching
  const handleExecuteSingleMatching = () => {
    if (!activeMatchingMember) return;
    setIsProcessingMatching(true);
    setMatchingFeedback(null);

    try {
      const res = executeMemberMatching(
        activeMatchingMember.id,
        currentUser?.id || 'AANO-SADMIN-001',
        matchingReason.trim() || 'Super Admin Single Member Matching Execution'
      );

      if (res.success) {
        setMatchingFeedback({ type: 'success', message: res.message });
        setMatchingReason('');
      } else {
        setMatchingFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setMatchingFeedback({ type: 'error', message: err?.message || 'ম্যাচিং প্রক্রিয়াকরণে ত্রুটি ঘটেছে।' });
    } finally {
      setIsProcessingMatching(false);
    }
  };

  // Execute Network-Wide Batch Matching
  const handleExecuteBatchMatching = () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে সম্পূর্ণ নেটওয়ার্কের জন্য একযোগে বাইনারি ম্যাচিং সাইকেল চালাতে চান?')) {
      return;
    }
    setIsProcessingMatching(true);
    setMatchingFeedback(null);

    try {
      const res = executeNetworkBatchMatching(
        currentUser?.id || 'AANO-SADMIN-001',
        'Company-wide Super Admin Automated Batch Matching Cycle'
      );

      if (res.success) {
        setMatchingFeedback({ type: 'success', message: res.message });
      } else {
        setMatchingFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setMatchingFeedback({ type: 'error', message: err?.message || 'ব্যাচ ম্যাচিং প্রক্রিয়াকরণে ত্রুটি ঘটেছে।' });
    } finally {
      setIsProcessingMatching(false);
    }
  };

  // Open Manual Carry Forward Modal
  const openAdjustModal = (member: NetworkMember) => {
    setAdjustMemberId(member.id);
    setAdjustLeftNew(member.leftCarryForward);
    setAdjustRightNew(member.rightCarryForward);
    setAdjustReason('');
    setAdjustFeedback(null);
    setAdjustModalOpen(true);
  };

  // Submit Manual Carry Forward Adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustReason.trim()) {
      setAdjustFeedback({ type: 'error', message: 'এডজাস্টমেন্টের কারণ (Reason) উল্লেখ করা বাধ্যতামূলক।' });
      return;
    }

    const res = manualCarryForwardAdjustment(
      adjustMemberId,
      Number(adjustLeftNew) || 0,
      Number(adjustRightNew) || 0,
      adjustReason.trim(),
      currentUser?.id || 'AANO-SADMIN-001'
    );

    if (res.success) {
      setAdjustFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setAdjustModalOpen(false);
      }, 1500);
    } else {
      setAdjustFeedback({ type: 'error', message: res.message });
    }
  };

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return matchingHistory.filter((item) => {
      // Search filter
      const matchesSearch =
        !historySearchQuery.trim() ||
        item.member_id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.member_name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.matching_id.toLowerCase().includes(historySearchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Date filter
      if (historyDateFilter === 'all') return true;

      const recordDate = new Date(item.matching_date || item.created_at);
      const now = new Date();

      if (historyDateFilter === 'today') {
        return recordDate.toDateString() === now.toDateString();
      }
      if (historyDateFilter === 'last_7_days') {
        const diffDays = (now.getTime() - recordDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (historyDateFilter === 'this_month') {
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [matchingHistory, historySearchQuery, historyDateFilter]);

  // Filtered Network Members for Report Tab
  const filteredReportMembers = useMemo(() => {
    return members.filter((m) => {
      if (reportStatusFilter === 'active' && !m.active) return false;
      if (reportStatusFilter === 'inactive' && m.active) return false;

      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.trim().toLowerCase();
        return (
          m.id.toLowerCase().includes(q) ||
          m.fullName.toLowerCase().includes(q) ||
          (m.mobile && m.mobile.includes(q)) ||
          (m.sponsorId && m.sponsorId.toLowerCase().includes(q)) ||
          (m.parentId && m.parentId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [members, reportStatusFilter, reportSearchQuery]);

  // Export Network Report to CSV
  const exportNetworkReportCSV = () => {
    const headers = [
      'member_id',
      'full_name',
      'mobile',
      'sponsor_id',
      'placement_id',
      'parent_id',
      'position',
      'member_type',
      'personal_pv',
      'left_pv',
      'right_pv',
      'left_carry_forward',
      'right_carry_forward',
      'total_matched_pv',
      'status',
      'created_at'
    ];

    const rows = filteredReportMembers.map((m) => [
      `"${m.id}"`,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.mobile || ''}"`,
      `"${m.sponsorId || 'None'}"`,
      `"${m.placementId || m.parentId || 'Root'}"`,
      `"${m.parentId || 'None'}"`,
      `"${m.position || m.placementLeg || 'left'}"`,
      `"${m.memberType || 'Personal'}"`,
      m.pv || 0,
      m.leftPV || 0,
      m.rightPV || 0,
      m.leftCarryForward || 0,
      m.rightCarryForward || 0,
      m.totalMatchedPV || 0,
      m.active ? 'ACTIVE' : 'INACTIVE',
      `"${m.joinDate || m.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AponBazar_Network_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Matching History to CSV
  const exportMatchingHistoryCSV = () => {
    const headers = [
      'matching_id',
      'member_id',
      'member_name',
      'left_pv',
      'right_pv',
      'matched_pv',
      'left_carry_forward',
      'right_carry_forward',
      'matching_date',
      'created_by',
      'created_at',
      'notes'
    ];

    const rows = filteredHistory.map((item) => [
      `"${item.matching_id}"`,
      `"${item.member_id}"`,
      `"${item.member_name.replace(/"/g, '""')}"`,
      item.left_pv,
      item.right_pv,
      item.matched_pv,
      item.left_carry_forward,
      item.right_carry_forward,
      `"${item.matching_date}"`,
      `"${item.created_by}"`,
      `"${item.created_at}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AponBazar_Matching_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Security Guard Check
  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-xl font-bold text-red-900">অননুমোদিত প্রবেশাধিকার সংরক্ষিত (Access Denied)</h3>
        <p className="text-sm text-red-700 max-w-md mx-auto">
          কোম্পানি মাস্টার রুট <span className="font-mono font-bold">{COMPANY_MASTER_ROOT_ID}</span> এবং পূর্ণাঙ্গ বাইনারি ট্রি ও ম্যাচিং ব্যবস্থাপনা শুধুমাত্র সুপার এডমিনদের জন্য উন্মুক্ত।
        </p>
      </div>
    );
  }

  // Recursive Tree Node Renderer (supports Registered Nodes & Pre-Reserved Left/Right Blank Positions at all levels)
  const renderTreeNode = (memberId: string | undefined, positionLabel: 'ROOT' | 'LEFT' | 'RIGHT', depth: number): React.ReactNode => {
    if (!memberId) {
      return (
        <div className="flex flex-col items-center">
          <div className="border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-3 bg-neutral-50/50 dark:bg-neutral-900/50 w-44 text-center">
            <span className="text-2xs font-semibold text-neutral-400 block mb-1">
              {positionLabel} SLOT
            </span>
            <span className="text-xs text-neutral-500 font-medium">ফাঁকা স্লট</span>
          </div>
        </div>
      );
    }

    const node = getIsolatedNodeById(memberId);
    if (!node) return null;

    // ------------------------------------------------------------------
    // BLANK POSITION NODE (Pre-Reserved Sequential Company ID, Click-to-Register)
    // ------------------------------------------------------------------
    if (node.nodeStatus === 'blank') {
      const isLeftBlank = (node.placementLeg || positionLabel.toLowerCase()) === 'left';
      const isBlankHighlighted = treeSearchHighlightId === node.id;
      const parentId = node.parentId || focusMemberId;

      return (
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() =>
              setRegisterBlankSlotModal({
                reservedCompanyId: node.id,
                parentId,
                leg: isLeftBlank ? 'left' : 'right'
              })
            }
            className={`w-56 rounded-2xl p-3.5 border-2 border-dashed text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] group ${
              isBlankHighlighted
                ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/80'
                : isLeftBlank
                ? 'border-blue-400/80 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/25 hover:border-blue-500'
                : 'border-indigo-400/80 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/25 hover:border-indigo-500'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  isLeftBlank
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isLeftBlank ? 'LEFT BLANK' : 'RIGHT BLANK'}
              </span>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                Reserved
              </span>
            </div>

            <div className="font-mono font-black text-sm text-neutral-900 dark:text-white tracking-tight">
              [{node.id}]
            </div>

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5 flex items-center justify-between">
              <span>Status: <strong className="text-amber-700 dark:text-amber-300">BLANK</strong></span>
              <span>Parent: <strong className="font-mono text-neutral-700 dark:text-neutral-200">{parentId}</strong></span>
            </div>

            <div
              className={`mt-2.5 w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 text-white transition-colors ${
                isLeftBlank
                  ? 'bg-blue-600 group-hover:bg-blue-700'
                  : 'bg-indigo-600 group-hover:bg-indigo-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Click to Register</span>
            </div>
          </button>
        </div>
      );
    }

    const member = node;
    const isTemporaryRoot = member.id === focusMemberId;
    const isCompanyMaster = member.id === COMPANY_MASTER_ROOT_ID;
    const isExpanded = !!expandedNodes[member.id];
    const isHighlighted = treeSearchHighlightId === member.id;
    const leftTargetId = member.leftChildId || member.leftBlankId;
    const rightTargetId = member.rightChildId || member.rightBlankId;
    const hasChildren = !!leftTargetId || !!rightTargetId;

    return (
      <div className="flex flex-col items-center">
        {/* Node Card */}
        <div
          className={`relative rounded-2xl p-4 transition-all w-60 shadow-xs border cursor-pointer ${
            isHighlighted
              ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50/90 dark:bg-amber-950/90'
              : isTemporaryRoot
              ? 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-neutral-900 border-emerald-500 ring-2 ring-emerald-400/40'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-400'
          }`}
          onClick={() => setSelectedMemberModal(member)}
        >
          {/* Header row: Position & ID */}
          <div className="flex items-center justify-between gap-1 mb-2">
            <span
              className={`text-2xs font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isTemporaryRoot
                  ? 'bg-emerald-600 text-white'
                  : positionLabel === 'LEFT'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
              }`}
            >
              {isCompanyMaster ? 'COMPANY ROOT' : isTemporaryRoot ? 'SELECTED ROOT' : positionLabel}
            </span>
            <span className="text-xs font-mono font-black text-neutral-900 dark:text-neutral-100">
              {member.id}
            </span>
          </div>

          {/* Member Name */}
          <div className="font-bold text-sm text-neutral-900 dark:text-white truncate mb-2" title={member.fullName}>
            {member.fullName}
          </div>

          {/* PV Metrics Grid */}
          <div className="grid grid-cols-2 gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-2xs mb-2">
            <div>
              <span className="text-neutral-500 block">Personal PV:</span>
              <span className="font-bold text-neutral-900 dark:text-white">{(member.pv || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Total Matched:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{(member.totalMatchedPV || 0).toLocaleString()}</span>
            </div>
            <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-blue-600 dark:text-blue-400 block font-semibold">Left Team PV:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {(member.leftPV || 0).toLocaleString()}
              </span>
              <span className="text-2xs text-neutral-400 block">CF: {(member.leftCarryForward || 0).toLocaleString()}</span>
            </div>
            <div className="pt-1 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-indigo-600 dark:text-indigo-400 block font-semibold">Right Team PV:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {(member.rightPV || 0).toLocaleString()}
              </span>
              <span className="text-2xs text-neutral-400 block">CF: {(member.rightCarryForward || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between text-2xs pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openSubtreeById(member.id, { pushHistory: true, resetZoom: true });
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
              title="Open this Member's Isolated Subtree"
            >
              <span>ট্রি খুলুন</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMatchingMemberId(member.id);
                setActiveTab('matching');
              }}
              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>ম্যাচিং</span>
              <DollarSign className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMemberModal(member);
              }}
              className="text-neutral-500 hover:text-neutral-700 font-medium cursor-pointer"
            >
              বিস্তারিত
            </button>
          </div>

          {/* Expand / Collapse Button if node has children */}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(member.id);
              }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 shadow-xs cursor-pointer z-10"
              title={isExpanded ? 'সংকোচন করুন (Collapse)' : 'সম্প্রসারণ করুন (Expand)'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Tree Connectors & Children */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-3">
            {/* Vertical stem down from parent */}
            <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700" />

            {/* Horizontal branch line connecting left and right */}
            <div className="flex items-start">
              {/* Left Subtree (Registered Member or Pre-Reserved Left Blank Position) */}
              <div className="flex flex-col items-center px-4 relative">
                {/* Horizontal line to left */}
                <div className="absolute top-0 right-1/2 w-full h-0.5 bg-neutral-300 dark:bg-neutral-700 translate-x-1/2" />
                {/* Vertical stem down to left child */}
                <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700 z-1" />
                {renderTreeNode(leftTargetId, 'LEFT', depth + 1)}
              </div>

              {/* Right Subtree (Registered Member or Pre-Reserved Right Blank Position) */}
              <div className="flex flex-col items-center px-4 relative">
                {/* Horizontal line to right */}
                <div className="absolute top-0 left-1/2 w-full h-0.5 bg-neutral-300 dark:bg-neutral-700 -translate-x-1/2" />
                {/* Vertical stem down to right child */}
                <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700 z-1" />
                {renderTreeNode(rightTargetId, 'RIGHT', depth + 1)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl md:text-2xl font-black">
                সুপার এডমিন: বাইনারি ট্রি ও ম্যাচিং ব্যবস্থাপনা (Binary Tree & Matching)
              </h2>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1">
              কোম্পানি মাস্টার আইডি: <span className="font-mono font-bold text-amber-300">{COMPANY_MASTER_ROOT_ID}</span> থেকে পরিচালিত পূর্ণাঙ্গ টু-লেগ বাইনারি প্লেসমেন্ট, প্রি-রিজার্ভড Blank Positions ও ম্যাচিং হিসাব।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-emerald-800/70 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>রুট নোড: <strong className="font-mono text-amber-300">{COMPANY_MASTER_ROOT_ID}</strong></span>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5">
              <span>নিবন্ধিত সদস্য: <strong>{members.length}</strong></span>
            </div>
            <div className="bg-amber-500/20 border border-amber-400/40 rounded-xl px-3 py-1.5 text-amber-200">
              <span>Blank Positions: <strong>{blankPositions.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Binary Tree | Matching | Matching History | Member Search | Reports */}
        <div className="flex items-center gap-1 mt-6 border-b border-white/15 pb-2 overflow-x-auto">
          <button
            type="button"
            id="tab-btn-binary-tree"
            onClick={() => setActiveTab('binary_tree')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'binary_tree'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>বাইনারি ট্রি (Binary Tree)</span>
          </button>

          <button
            type="button"
            id="tab-btn-matching-dashboard"
            onClick={() => setActiveTab('matching')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'matching'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>ম্যাচিং ড্যাশবোর্ড (Matching)</span>
          </button>

          <button
            type="button"
            id="tab-btn-matching-history"
            onClick={() => setActiveTab('matching_history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'matching_history'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ম্যাচিং হিস্ট্রি (Matching History)</span>
          </button>

          <button
            type="button"
            id="tab-btn-member-search"
            onClick={() => setActiveTab('member_search')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'member_search'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>মেম্বার সার্চ (Member Search)</span>
          </button>

          <button
            type="button"
            id="tab-btn-network-reports"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>রিপোর্টস ও এক্সপোর্ট (Reports)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BINARY TREE INTERACTIVE CANVAS (ID-WISE ISOLATED SUBTREE) */}
      {activeTab === 'binary_tree' && (
        <div className="space-y-4">
          {/* Isolated Subtree Header: Search & Open + Required Stats + Back Navigation */}
          <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* ID Search & Open Form */}
              <form onSubmit={handleTreeSearch} className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" />
                  <input
                    type="text"
                    aria-label="Enter Company ID to View Network"
                    placeholder="Enter Company ID to View Network"
                    value={treeSearchQuery}
                    onChange={(e) => {
                      setTreeSearchQuery(e.target.value);
                      if (subtreeError) setSubtreeError(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingSubtree}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {isLoadingSubtree ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderTree className="w-3.5 h-3.5" />}
                  <span>Open Network</span>
                </button>

                {treeHistoryStack.length > 0 && (
                  <button
                    type="button"
                    onClick={handleGoBackRoot}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back ({treeHistoryStack[treeHistoryStack.length - 1]})</span>
                  </button>
                )}

                {focusMemberId !== COMPANY_MASTER_ROOT_ID && (
                  <button
                    type="button"
                    onClick={resetTreeView}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl cursor-pointer border border-amber-300 dark:border-amber-800"
                  >
                    Master Root ({COMPANY_MASTER_ROOT_ID})
                  </button>
                )}
              </form>

              {/* Required Tree Header Counters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Selected Company ID: </span>
                  <strong className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                    {isolatedStats?.selectedCompanyId || focusMemberId}
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Network Members: </span>
                  <strong className="font-mono font-black text-blue-700 dark:text-blue-300">
                    {isolatedStats?.networkMembers ?? 0}
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Tree Levels: </span>
                  <strong className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                    {isolatedStats?.treeLevels ?? 0}
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                  <span className="text-neutral-500 dark:text-neutral-400">Blank Positions: </span>
                  <strong className="font-mono font-black text-amber-700 dark:text-amber-300">
                    {isolatedStats?.blankPositions ?? 0}
                  </strong>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center justify-between gap-2">
              <span>
                উদাহরণ: <code className="font-mono font-bold text-neutral-700 dark:text-neutral-300">GBD000001</code>,{' '}
                <code className="font-mono font-bold text-neutral-700 dark:text-neutral-300">GBD000002</code>,{' '}
                <code className="font-mono font-bold text-neutral-700 dark:text-neutral-300">GBD000004</code>,{' '}
                <code className="font-mono font-bold text-neutral-700 dark:text-neutral-300">GBD000008</code> — শুধুমাত্র নির্বাচিত ID-এর অধীনস্থ নেটওয়ার্কই প্রদর্শিত হবে।
              </span>
            </div>

            {/* Not Found / Access Denied Error Banner (NEVER renders fake or guessed tree) */}
            {subtreeError && (
              <div
                role="alert"
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  subtreeError.statusCode === 403
                    ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                    : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{subtreeError.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubtreeError(null)}
                  className="text-[11px] underline font-bold cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Controls Bar: Subtree Highlight, Level Navigation, Zoom, Expand/Collapse */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Find inside currently opened subtree */}
            <form onSubmit={handleFindInsideSubtree} className="flex items-center gap-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="এই ট্রির ভেতরে খুঁজুন..."
                  value={inSubtreeFindQuery}
                  onChange={(e) => setInSubtreeFindQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs w-48 font-medium"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-bold rounded-xl hover:bg-neutral-900 cursor-pointer"
              >
                Highlight
              </button>
            </form>

            {/* Level Navigation */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-neutral-500 font-semibold">Level View:</span>
              <select
                aria-label="Tree Level Navigation"
                value={selectedLevelFilter === 'all' ? 'all' : String(selectedLevelFilter)}
                onChange={(e) =>
                  handleSelectTreeLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="all">All Levels ({isolatedStats?.treeLevels || 1})</option>
                {Array.from({ length: Math.max(1, isolatedStats?.treeLevels || 1) }, (_, idx) => idx + 1).map(
                  (lvl) => (
                    <option key={lvl} value={String(lvl)}>
                      Up to Level {lvl}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Canvas Actions: Zoom, Reset, Expand All, Collapse All */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-2xs font-mono font-bold px-2 text-neutral-600 dark:text-neutral-400">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 cursor-pointer ml-1"
                  title="Reset Zoom & Pan"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={expandAllNodes}
                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 rounded-xl text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllNodes}
                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 rounded-xl text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Interactive Tree Viewport */}
          <div
            ref={treeContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative bg-neutral-100/70 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl min-h-[580px] overflow-auto select-none cursor-grab active:cursor-grabbing p-8 flex justify-center"
          >
            {/* Background Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {subtreeError && (!activeFocusMember || subtreeError.queriedId?.toUpperCase() !== focusMemberId.toUpperCase()) ? null : null}

            {/* Render ONLY if activeFocusMember exists in isolated server response and no blocking error for current query */}
            {subtreeError && subtreeError.statusCode === 404 && !activeFocusMember ? (
              <div className="relative z-10 m-auto text-center p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-amber-300 max-w-md space-y-2">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="font-black text-base text-neutral-900 dark:text-white">Company ID Not Found</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">{subtreeError.message}</p>
              </div>
            ) : activeFocusMember ? (
              <div
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'top center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out'
                }}
                className="inline-block py-6 relative z-10"
              >
                {renderTreeNode(activeFocusMember.id, 'ROOT', 0)}
              </div>
            ) : (
              <div className="relative z-10 m-auto text-center text-xs text-neutral-500">
                {isLoadingSubtree ? 'নেটওয়ার্ক ট্রি লোড হচ্ছে...' : 'সঠিক Company ID লিখে Open Network চাপুন।'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MATCHING CALCULATION & DASHBOARD */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          {/* Member Selection Bar */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  বাইনারি ম্যাচিং ক্যালকুলেটর ও ড্যাশবোর্ড (Binary Matching Dashboard)
                </h3>
                <p className="text-2xs text-neutral-500">
                  ফর্মুলা: <span className="font-mono font-bold text-emerald-600">Matched PV = MIN(Left Eligible PV, Right Eligible PV)</span>
                </p>
              </div>
            </div>

            {/* Member Selector Dropdown */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                সদস্য নির্বাচন:
              </label>
              <select
                value={matchingMemberId}
                onChange={(e) => {
                  setMatchingMemberId(e.target.value);
                  setMatchingFeedback(null);
                }}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-bold text-neutral-900 dark:text-white w-full md:w-64"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} - {m.fullName} (Left: {m.leftCarryForward}, Right: {m.rightCarryForward})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback message */}
          {matchingFeedback && (
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                matchingFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              {matchingFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{matchingFeedback.message}</span>
            </div>
          )}

          {/* Prompt Required Matching Card Presentation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* The Dedicated Matching Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-neutral-900 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-neutral-800">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                <div>
                  <span className="text-2xs font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    TARGET MATCHING AUDIT NODE
                  </span>
                  <h4 className="text-lg font-black flex items-center gap-2">
                    <span>Member: {activeMatchingMember.id}</span>
                    <span className="text-sm font-normal text-neutral-300">({activeMatchingMember.fullName})</span>
                  </h4>
                </div>
                <span className={`px-2.5 py-1 text-2xs font-bold rounded-lg ${activeMatchingMember.active ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                  {activeMatchingMember.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Exact Presentation from Prompt Requirement 6 */}
              <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6 font-mono text-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-neutral-400 text-xs">
                  <span>METRIC NAME</span>
                  <span>VALUE (PV)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 font-bold">Left Team PV</span>
                  <span className="text-base font-bold">{(activeMatchingMember.leftPV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-400 font-bold">Right Team PV</span>
                  <span className="text-base font-bold">{(activeMatchingMember.rightPV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-emerald-400">
                  <span className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Eligible Matched PV</span>
                  </span>
                  <span className="text-lg font-black">
                    {Math.min(activeMatchingMember.leftCarryForward || 0, activeMatchingMember.rightCarryForward || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>Left Carry Forward (New)</span>
                  <span className="font-bold">
                    {(
                      (activeMatchingMember.leftCarryForward || 0) -
                      Math.min(activeMatchingMember.leftCarryForward || 0, activeMatchingMember.rightCarryForward || 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>Right Carry Forward (New)</span>
                  <span className="font-bold">
                    {(
                      (activeMatchingMember.rightCarryForward || 0) -
                      Math.min(activeMatchingMember.leftCarryForward || 0, activeMatchingMember.rightCarryForward || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Controls for Single Member */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-neutral-800">
                <input
                  type="text"
                  placeholder="অডিট নোট / কারণ (ঐচ্ছিক)..."
                  value={matchingReason}
                  onChange={(e) => setMatchingReason(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 flex-1"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExecuteSingleMatching}
                    disabled={
                      isProcessingMatching ||
                      (activeMatchingMember.leftCarryForward || 0) <= 0 ||
                      (activeMatchingMember.rightCarryForward || 0) <= 0
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ম্যাচিং সম্পন্ন করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openAdjustModal(activeMatchingMember)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-neutral-700 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>ম্যানুয়াল এডজাস্ট</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Batch Runner */}
            <div className="space-y-4">
              {/* Batch Match Banner */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">কোম্পানি-ওয়াইড ব্যাচ ম্যাচিং</h4>
                </div>
                <p className="text-2xs text-neutral-600 dark:text-neutral-400 mb-4">
                  উভয় লেগে ক্যারি ফরোয়ার্ড পয়েন্ট থাকা সকল মেম্বারের জন্য এক ক্লিকে অফিশিয়াল ম্যাচিং সাইকেল হিসাব ও রেকর্ড করুন।
                </p>

                <button
                  type="button"
                  onClick={handleExecuteBatchMatching}
                  disabled={isProcessingMatching}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessingMatching ? 'animate-spin' : ''}`} />
                  <span>ব্যাচ ম্যাচিং সাইকেল রান করুন</span>
                </button>
              </div>

              {/* Member KPI Summary */}
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs space-y-3 text-xs">
                <h5 className="font-bold text-neutral-700 dark:text-neutral-300 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  {activeMatchingMember.fullName} কেপিআই স্ট্যাটাস
                </h5>

                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Current Left PV:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{(activeMatchingMember.leftPV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Current Right PV:</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{(activeMatchingMember.rightPV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Left Carry Forward:</span>
                  <span className="font-bold text-blue-600">{(activeMatchingMember.leftCarryForward || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Right Carry Forward:</span>
                  <span className="font-bold text-indigo-600">{(activeMatchingMember.rightCarryForward || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Total Historical Matched:</span>
                  <span className="font-bold text-emerald-600">{(activeMatchingMember.totalMatchedPV || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Matching Cap (Daily):</span>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">
                    {(commissionConfig?.binaryMatchingCapDailyPV || 5000).toLocaleString()} PV
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MATCHING HISTORY IMMUTABLE TABLE */}
      {activeTab === 'matching_history' && (
        <div className="space-y-4">
          {/* Header Controls: Filters & Export */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  ম্যাচিং হিস্ট্রি ও ট্রানজেকশন রেজিস্ট্রি (Immutable Matching Records)
                </h3>
                <p className="text-2xs text-neutral-500">
                  প্রতিটি ম্যাচিং ট্রানজেকশন অপরিবর্তনীয় অডিট-লগ হিসেবে সংরক্ষিত।
                </p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="মেম্বার আইডি / ট্রানজেকশন..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs w-48 font-medium"
                />
              </div>

              {/* Date Filter */}
              <select
                value={historyDateFilter}
                onChange={(e: any) => setHistoryDateFilter(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-medium"
              >
                <option value="all">সব সময় (All Time)</option>
                <option value="today">আজকের (Today)</option>
                <option value="last_7_days">গত ৭ দিন (Last 7 Days)</option>
                <option value="this_month">এই মাস (This Month)</option>
              </select>

              {/* Export CSV */}
              <button
                type="button"
                onClick={exportMatchingHistoryCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV ডাউনলোড</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">তারিখ (Date)</th>
                    <th className="py-3 px-4">ম্যাচিং আইডি</th>
                    <th className="py-3 px-4">মেম্বার আইডি</th>
                    <th className="py-3 px-4">নাম</th>
                    <th className="py-3 px-4 text-right">Left PV</th>
                    <th className="py-3 px-4 text-right">Right PV</th>
                    <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">Matched PV</th>
                    <th className="py-3 px-4 text-right">Left CF</th>
                    <th className="py-3 px-4 text-right">Right CF</th>
                    <th className="py-3 px-4">প্রসেস করেছে</th>
                    <th className="py-3 px-4">নোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-neutral-400">
                        কোনো ম্যাচিং রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.matching_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                          {item.matching_date}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-200 whitespace-nowrap">
                          {item.matching_id}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {item.member_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                          {item.member_name}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{(item.left_pv || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono">{(item.right_pv || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                          {(item.matched_pv || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-600">{(item.left_carry_forward || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-600">{(item.right_carry_forward || 0).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-2xs text-neutral-500 whitespace-nowrap">{item.created_by}</td>
                        <td className="py-3 px-4 text-neutral-500 text-2xs max-w-xs truncate" title={item.notes}>
                          {item.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBER SEARCH (DEEP RELATIONSHIP INSPECTOR) */}
      {activeTab === 'member_search' && (
        <div className="space-y-6">
          {/* Search Box Header */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-xs">
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              <span>সদস্য অনুসন্ধান ও সম্পর্ক নিরীক্ষণ (Member Relationship Search)</span>
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              মেম্বার আইডি (যেমন <span className="font-mono font-bold text-emerald-600">GBD000001</span>), নাম বা মোবাইল নম্বর দিয়ে সার্চ করুন।
            </p>

            <form onSubmit={handleDedicatedMemberSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="e.g. GBD000001, GBD000004, তাহমিনা..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-medium text-neutral-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                অনুসন্ধান
              </button>
            </form>
          </div>

          {/* Searched Member Profile Details */}
          {searchedMember ? (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border border-emerald-700/60 rounded-3xl p-6 text-white shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <span className="text-2xs font-mono font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                      VERIFIED NETWORK MEMBER FOUND
                    </span>
                    <h4 className="text-xl font-black flex items-center gap-2">
                      <span>{searchedMember.fullName}</span>
                      <span className="font-mono text-emerald-400">({searchedMember.id})</span>
                    </h4>
                    <p className="text-xs text-neutral-300 mt-1">মোবাইল: {searchedMember.mobile || 'N/A'} · যোগদানের তারিখ: {searchedMember.joinDate}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('binary_tree');
                        openSubtreeById(searchedMember.id, { pushHistory: true, resetZoom: true });
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>ট্রিতে দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMatchingMemberId(searchedMember.id);
                        setActiveTab('matching');
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>ম্যাচিং ড্যাশবোর্ড</span>
                    </button>
                  </div>
                </div>

                {/* 6 Metric Highlight Cards */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4 text-xs font-mono">
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-neutral-400 text-2xs block">Personal PV</span>
                    <span className="text-base font-bold text-white">{(searchedMember.pv || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-blue-400 text-2xs block">Left Team PV</span>
                    <span className="text-base font-bold text-white">{(searchedMember.leftPV || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-indigo-400 text-2xs block">Right Team PV</span>
                    <span className="text-base font-bold text-white">{(searchedMember.rightPV || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-emerald-400 text-2xs block">Matched PV</span>
                    <span className="text-base font-bold text-emerald-400">{(searchedMember.totalMatchedPV || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-blue-300 text-2xs block">Left Carry Forward</span>
                    <span className="text-base font-bold text-white">{(searchedMember.leftCarryForward || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <span className="text-indigo-300 text-2xs block">Right Carry Forward</span>
                    <span className="text-base font-bold text-white">{(searchedMember.rightCarryForward || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Strict Relational Separation: Sponsor vs Placement Parent vs Children */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* 1. Sponsor Node Details */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
                  <span className="text-2xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    ১. স্পন্সর রিলেশনশিপ (RECRUITER)
                  </span>
                  {searchedMember.sponsorId ? (
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {getMemberById(searchedMember.sponsorId)?.fullName || searchedMember.sponsorName || 'Unknown Sponsor'}
                      </div>
                      <div className="font-mono font-bold text-emerald-600 mt-0.5">{searchedMember.sponsorId}</div>
                      <p className="text-2xs text-neutral-500 mt-2">
                        এই সদস্যকে সরাসরি সিস্টেমে রেফার করেছেন এই স্পন্সর।
                      </p>
                    </div>
                  ) : (
                    <div className="text-neutral-500 font-medium">কোম্পানি রুট (কোনো স্পন্সর নেই)</div>
                  )}
                </div>

                {/* 2. Binary Parent Node Details */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
                  <span className="text-2xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    ২. প্লেসমেন্ট প্যারেন্ট (BINARY PARENT)
                  </span>
                  {searchedMember.parentId ? (
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {getMemberById(searchedMember.parentId)?.fullName || 'Parent Member'}
                      </div>
                      <div className="font-mono font-bold text-blue-600 mt-0.5">{searchedMember.parentId}</div>
                      <p className="text-2xs text-neutral-500 mt-2">
                        প্যারেন্টের অবস্থান: <strong className="uppercase">{searchedMember.position || searchedMember.placementLeg}</strong> লেগ
                      </p>
                    </div>
                  ) : (
                    <div className="text-neutral-500 font-medium">রুট নোড (কোনো প্যারেন্ট নেই)</div>
                  )}
                </div>

                {/* 3. Left Child Node Details */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
                  <span className="text-2xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                    ৩. বাম সন্তান (LEFT CHILD)
                  </span>
                  {searchedMember.leftChildId ? (
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {getMemberById(searchedMember.leftChildId)?.fullName || 'Left Child'}
                      </div>
                      <div className="font-mono font-bold text-indigo-600 mt-0.5">{searchedMember.leftChildId}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const child = getMemberById(searchedMember.leftChildId);
                          if (child) setSearchedMember(child);
                        }}
                        className="text-2xs text-emerald-600 hover:underline mt-2 font-bold cursor-pointer"
                      >
                        সন্তান প্রোফাইল দেখুন →
                      </button>
                    </div>
                  ) : (
                    <div className="text-neutral-400 font-medium">স্লট ফাঁকা (Empty Left Slot)</div>
                  )}
                </div>

                {/* 4. Right Child Node Details */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
                  <span className="text-2xs font-bold text-purple-600 uppercase tracking-wider block mb-1">
                    ৪. ডান সন্তান (RIGHT CHILD)
                  </span>
                  {searchedMember.rightChildId ? (
                    <div>
                      <div className="font-bold text-sm text-neutral-900 dark:text-white">
                        {getMemberById(searchedMember.rightChildId)?.fullName || 'Right Child'}
                      </div>
                      <div className="font-mono font-bold text-purple-600 mt-0.5">{searchedMember.rightChildId}</div>
                      <button
                        type="button"
                        onClick={() => {
                          const child = getMemberById(searchedMember.rightChildId);
                          if (child) setSearchedMember(child);
                        }}
                        className="text-2xs text-emerald-600 hover:underline mt-2 font-bold cursor-pointer"
                      >
                        সন্তান প্রোফাইল দেখুন →
                      </button>
                    </div>
                  ) : (
                    <div className="text-neutral-400 font-medium">স্লট ফাঁকা (Empty Right Slot)</div>
                  )}
                </div>
              </div>
            </div>
          ) : memberSearchError ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-3xl p-8 text-center text-amber-900 dark:text-amber-200 space-y-2">
              <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
              <p className="text-sm font-bold">{memberSearchError}</p>
            </div>
          ) : (
            <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl p-12 text-center text-neutral-400">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">কোনো সদস্যের বিস্তারিত দেখতে উপরে সার্চ করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORTS & AUDIT EXPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Quick Metrics KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
              <span className="text-2xs font-semibold text-neutral-500 block">মোট মেম্বার সংখ্যা</span>
              <span className="text-xl font-black text-neutral-900 dark:text-white">{members.length}</span>
              <span className="text-2xs text-emerald-600 font-medium block mt-1">
                {members.filter((m) => m.active).length} অ্যাক্টিভ · {members.filter((m) => !m.active).length} ইনঅ্যাক্টিভ
              </span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
              <span className="text-2xs font-semibold text-neutral-500 block">রুট নোড মোট Left PV</span>
              <span className="text-xl font-black text-blue-600">
                {(getMemberById(COMPANY_MASTER_ROOT_ID)?.leftPV || 0).toLocaleString()}
              </span>
              <span className="text-2xs text-neutral-400 block mt-1">কোম্পানি মাস্টার লেগ ১</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
              <span className="text-2xs font-semibold text-neutral-500 block">রুট নোড মোট Right PV</span>
              <span className="text-xl font-black text-indigo-600">
                {(getMemberById(COMPANY_MASTER_ROOT_ID)?.rightPV || 0).toLocaleString()}
              </span>
              <span className="text-2xs text-neutral-400 block mt-1">কোম্পানি মাস্টার লেগ ২</span>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs">
              <span className="text-2xs font-semibold text-neutral-500 block">কোম্পানি লাইফটাইম ম্যাচড PV</span>
              <span className="text-xl font-black text-emerald-600">
                {members.reduce((acc, m) => acc + (m.totalMatchedPV || 0), 0).toLocaleString()}
              </span>
              <span className="text-2xs text-emerald-600 font-medium block mt-1">অডিট রেকর্ড সুরক্ষিত</span>
            </div>
          </div>

          {/* Report Filter & Export Controls */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-white">নেটওয়ার্ক ডিরেক্টরি অডিট রিপোর্ট</h4>
                <p className="text-2xs text-neutral-500">
                  রুট <span className="font-mono">{COMPANY_MASTER_ROOT_ID}</span> সহ সকল মেম্বারের রিলেশনাল ফিল্ড ও PV হিস্ট্রি
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="রিপোর্ট সার্চ করুন..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs w-48 font-medium"
                />
              </div>

              <select
                value={reportStatusFilter}
                onChange={(e: any) => setReportStatusFilter(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-xs font-medium"
              >
                <option value="all">সব সদস্য (All Status)</option>
                <option value="active">শুধুমাত্র অ্যাক্টিভ (Active Only)</option>
                <option value="inactive">শুধুমাত্র ইনঅ্যাক্টিভ (Inactive Only)</option>
              </select>

              <button
                type="button"
                onClick={exportNetworkReportCSV}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>নেটওয়ার্ক CSV এক্সপোর্ট</span>
              </button>

              <button
                type="button"
                onClick={exportMatchingHistoryCSV}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ম্যাচিং CSV এক্সপোর্ট</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Sponsor ID</th>
                    <th className="py-3 px-4">Parent ID</th>
                    <th className="py-3 px-4">Position</th>
                    <th className="py-3 px-4 text-right">Personal PV</th>
                    <th className="py-3 px-4 text-right">Left PV</th>
                    <th className="py-3 px-4 text-right">Right PV</th>
                    <th className="py-3 px-4 text-right">Left CF</th>
                    <th className="py-3 px-4 text-right">Right CF</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-medium">
                  {filteredReportMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {m.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                        {m.fullName}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {m.sponsorId || 'Root'}
                      </td>
                      <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {m.parentId || 'None'}
                      </td>
                      <td className="py-3 px-4 uppercase text-2xs font-bold text-neutral-500">
                        {m.position || m.placementLeg}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">{m.pv || 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600">{(m.leftPV || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-600">{(m.rightPV || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">{(m.leftCarryForward || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">{(m.rightCarryForward || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-md ${
                            m.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {m.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SELECTED MEMBER FULL DETAILS SLIDE-OVER */}
      {selectedMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedMemberModal(null)}
              className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <User className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  {selectedMemberModal.fullName} ({selectedMemberModal.id})
                </h3>
                <span className="text-2xs text-neutral-500 font-mono">
                  Permanent Node: {selectedMemberModal.id} · Type: {selectedMemberModal.memberType || 'Personal'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Relational Distinctions Callout */}
              <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-2">
                <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                  স্পন্সর বনাম প্লেসমেন্ট সম্পর্ক পৃথকীকরণ (Strict Separation)
                </span>
                <div className="grid grid-cols-2 gap-3 text-2xs">
                  <div>
                    <span className="text-neutral-500 block">স্পন্সর (Who Recruited):</span>
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400 block text-xs">
                      {selectedMemberModal.sponsorId || 'Root Master'}
                    </strong>
                    <span className="text-neutral-500">
                      {getMemberById(selectedMemberModal.sponsorId)?.fullName || selectedMemberModal.sponsorName || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block">প্লেসমেন্ট প্যারেন্ট (Tree Placement):</span>
                    <strong className="font-mono text-blue-700 dark:text-blue-400 block text-xs">
                      {selectedMemberModal.parentId || 'Root'}
                    </strong>
                    <span className="text-neutral-500">
                      অবস্থান: <strong className="uppercase">{selectedMemberModal.position || selectedMemberModal.placementLeg}</strong> লেগ
                    </span>
                  </div>
                </div>
              </div>

              {/* Volume & Carry Forward Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-2xs text-neutral-500 block font-sans">Personal PV</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {(selectedMemberModal.pv || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-2xs text-blue-600 block font-sans">Left Team PV</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {(selectedMemberModal.leftPV || 0).toLocaleString()}
                  </span>
                  <span className="text-2xs text-neutral-400 block font-sans">
                    CF: {(selectedMemberModal.leftCarryForward || 0).toLocaleString()}
                  </span>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-2xs text-indigo-600 block font-sans">Right Team PV</span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {(selectedMemberModal.rightPV || 0).toLocaleString()}
                  </span>
                  <span className="text-2xs text-neutral-400 block font-sans">
                    CF: {(selectedMemberModal.rightCarryForward || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Children Nodes Details */}
              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-600 dark:text-neutral-400 block mb-1">Left Child Node:</span>
                  {selectedMemberModal.leftChildId ? (
                    <div>
                      <strong className="font-mono text-emerald-600 block text-xs">{selectedMemberModal.leftChildId}</strong>
                      <span>{getMemberById(selectedMemberModal.leftChildId)?.fullName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-blue-600 dark:text-blue-400 font-mono font-bold block">
                        LEFT BLANK: {selectedMemberModal.leftBlankId || 'AUTO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetParent = selectedMemberModal.id;
                          const reservedId = selectedMemberModal.leftBlankId || '';
                          setSelectedMemberModal(null);
                          setRegisterBlankSlotModal({
                            reservedCompanyId: reservedId,
                            parentId: targetParent,
                            leg: 'left'
                          });
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        + এই পজিশনে নিবন্ধন করুন
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
                  <span className="font-bold text-neutral-600 dark:text-neutral-400 block mb-1">Right Child Node:</span>
                  {selectedMemberModal.rightChildId ? (
                    <div>
                      <strong className="font-mono text-emerald-600 block text-xs">{selectedMemberModal.rightChildId}</strong>
                      <span>{getMemberById(selectedMemberModal.rightChildId)?.fullName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold block">
                        RIGHT BLANK: {selectedMemberModal.rightBlankId || 'AUTO'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const targetParent = selectedMemberModal.id;
                          const reservedId = selectedMemberModal.rightBlankId || '';
                          setSelectedMemberModal(null);
                          setRegisterBlankSlotModal({
                            reservedCompanyId: reservedId,
                            parentId: targetParent,
                            leg: 'right'
                          });
                        }}
                        className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        + এই পজিশনে নিবন্ধন করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = selectedMemberModal.id;
                    setSelectedMemberModal(null);
                    setActiveTab('binary_tree');
                    openSubtreeById(targetId, { pushHistory: true, resetZoom: true });
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>ট্রিতে ফোকাস করুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMatchingMemberId(selectedMemberModal.id);
                    setSelectedMemberModal(null);
                    setActiveTab('matching');
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>ম্যাচিং ড্যাশবোর্ডে খুলুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    openAdjustModal(selectedMemberModal);
                    setSelectedMemberModal(null);
                  }}
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>এডজাস্ট</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL CARRY FORWARD ADJUSTMENT (STRICT AUDIT LOG REQUIREMENT) */}
      {adjustModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <Sliders className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
                  ম্যানুয়াল ক্যারি ফরোয়ার্ড এডজাস্টমেন্ট (Audit Mandated)
                </h3>
                <span className="text-2xs text-neutral-500 font-mono">
                  সদস্য: {adjustMemberId} · এডমিন: {currentUser?.id || 'AANO-SADMIN-001'}
                </span>
              </div>
            </div>

            {adjustFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold mb-4 ${
                  adjustFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-red-50 text-red-800 border border-red-300'
                }`}
              >
                {adjustFeedback.message}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Left Carry Forward (PV):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={adjustLeftNew}
                    onChange={(e) => setAdjustLeftNew(Number(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Right Carry Forward (PV):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={adjustRightNew}
                    onChange={(e) => setAdjustRightNew(Number(e.target.value))}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2 font-mono font-bold text-neutral-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                  এডজাস্টমেন্টের কারণ (Mandatory Reason):
                </label>
                <textarea
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="কেন ক্যারি ফরোয়ার্ড পরিবর্তন করা হচ্ছে তার সুনির্দিষ্ট কারণ লিখুন..."
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl p-3 text-xs text-neutral-900 dark:text-white placeholder-neutral-400"
                  required
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-2xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  এই পরিবর্তনের সঙ্গে আপনার এডমিন আইডি ({currentUser?.id || 'AANO-SADMIN-001'}), বর্তমান টাইমস্ট্যাম্প ও অডিট লগ স্থায়ীভাবে যুক্ত হবে।
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  সংরক্ষণ করুন (Confirm Audit)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESERVED BLANK POSITION REGISTRATION (LOCKED COMPANY ID + PARENT + POSITION) */}
      {registerBlankSlotModal && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setRegisterBlankSlotModal(null)}
          onSwitchToLogin={() => setRegisterBlankSlotModal(null)}
          source="binary_tree"
          title={`বাইনারি মেম্বার নিবন্ধন (${registerBlankSlotModal.reservedCompanyId})`}
          subtitle={`Parent: ${registerBlankSlotModal.parentId} • Position: ${registerBlankSlotModal.leg.toUpperCase()}`}
          reservedCompanyId={registerBlankSlotModal.reservedCompanyId}
          initialReferralId={registerBlankSlotModal.parentId}
          initialPlacementId={registerBlankSlotModal.parentId}
          initialPlacementPosition={registerBlankSlotModal.leg}
          lockPlacement={true}
          onSuccess={(summary) => {
            openSubtreeById(focusMemberId, { pushHistory: false });
            setExpandedNodes((prev) => ({
              ...prev,
              [registerBlankSlotModal.parentId]: true,
              ...(summary.binaryCompanyId ? { [summary.binaryCompanyId]: true } : {})
            }));
          }}
        />
      )}
    </div>
  );
};
