/**
 * Interactive ID-Wise Isolated Binary Tree Viewer & AI Placement Component
 * Project: আপন বাজার (Apon Bazar)
 *
 * Enforces strict server-verified subtree isolation:
 * - Normal Members can ONLY view their own Company ID and downward descendants.
 * - Ancestors above the selected Company ID and sibling branches are NEVER returned or rendered.
 * - Supports unlimited depth expansion, Left & Right Blank Positions, Zoom/Expand/Collapse,
 *   Level Navigation, Back navigation stack, and URL refresh persistence.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { COMPANY_MASTER_ROOT_ID, NetworkMember } from '../../types/networkMarketing';
import { IsolatedSubtreeStats } from '../../lib/binaryBlankPositionEngine';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { SlotReservationService } from '../../services/SlotReservationService';
import { PlacementManagementModal } from './PlacementManagementModal';
import {
  GitBranch,
  Zap,
  User,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Bot,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Lock,
  AlertTriangle,
  FolderTree
} from 'lucide-react';

const TREE_URL_PARAM = 'treeCompanyId';

function getUrlTreeCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const val = params.get(TREE_URL_PARAM)?.trim();
    return val || null;
  } catch {
    return null;
  }
}

function syncUrlTreeCompanyId(companyId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set(TREE_URL_PARAM, companyId);
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // Ignore constrained history environments
  }
}

export const BinaryTreeViewer: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const {
    allTreeNodes,
    treeState,
    currentMember,
    ownCompanyMemberId,
    reservedPlacements,
    fetchIsolatedSubtree,
    runDailyMatchingEngine
  } = useNetworkMarketing();

  const isAdminViewer =
    (activeRole || currentUser?.primaryRole) === 'super_admin' ||
    (activeRole || currentUser?.primaryRole) === 'admin';

  const defaultRootId = isAdminViewer
    ? COMPANY_MASTER_ROOT_ID
    : ownCompanyMemberId || '';

  const [selectedRootId, setSelectedRootId] = useState<string>(() => {
    const fromUrl = getUrlTreeCompanyId();
    return fromUrl || defaultRootId;
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => getUrlTreeCompanyId() || '');
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [isolatedNodes, setIsolatedNodes] = useState<NetworkMember[]>([]);
  const [isolatedStats, setIsolatedStats] = useState<IsolatedSubtreeStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [subtreeError, setSubtreeError] = useState<{
    statusCode: number;
    code?: string;
    message: string;
  } | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [inSubtreeQuery, setInSubtreeQuery] = useState<string>('');

  const [addCustomerSlot, setAddCustomerSlot] = useState<{
    parentId: string;
    parentName: string;
    leg: 'left' | 'right';
    reservedCompanyId?: string;
  } | null>(null);

  const [aiRegistrationOpen, setAiRegistrationOpen] = useState(false);

  const [selectedPlacementTarget, setSelectedPlacementTarget] = useState<{
    parentId: string;
    leg: 'left' | 'right';
  } | null>(null);

  const [matchingResult, setMatchingResult] = useState<{ matchedPV: number; totalPayoutBDT: number } | null>(null);

  const isolatedNodeMap = useMemo(() => {
    const map = new Map<string, NetworkMember>();
    for (const n of isolatedNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [isolatedNodes]);

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

      if (maxLevels === 'all' || level < maxLevels) {
        exp[id] = true;
        const leftId = node.leftChildId || node.leftBlankId;
        const rightId = node.rightChildId || node.rightBlankId;
        if (leftId) queue.push({ id: leftId, level: level + 1 });
        if (rightId) queue.push({ id: rightId, level: level + 1 });
      }
    }
    return exp;
  };

  const openIsolatedSubtree = async (
    targetCompanyId: string,
    options?: { pushHistory?: boolean; resetZoom?: boolean }
  ) => {
    const cleanTarget = (targetCompanyId || '').trim();
    if (!cleanTarget) {
      setSubtreeError({
        statusCode: 403,
        code: 'ACCESS_DENIED',
        message: 'আপনার অ্যাকাউন্টের সাথে এখনো কোনো সক্রিয় বাইনারি Company ID যুক্ত হয়নি।'
      });
      setIsolatedNodes([]);
      setIsolatedStats(null);
      return;
    }

    setIsLoading(true);
    const resp = await fetchIsolatedSubtree(cleanTarget);
    setIsLoading(false);

    if (!resp.success || !resp.rootId || !resp.nodes || !resp.stats) {
      // Strictly clear tree if 403 Forbidden (URL tampering / cross-branch attempt)
      if (resp.statusCode === 403) {
        setIsolatedNodes([]);
        setIsolatedStats(null);
      }
      setSubtreeError({
        statusCode: resp.statusCode || 404,
        code: resp.errorCode,
        message: resp.message || `Company ID '${cleanTarget}' পাওয়া যায়নি।`
      });
      return;
    }

    if (options?.pushHistory && selectedRootId && selectedRootId.toUpperCase() !== resp.rootId.toUpperCase()) {
      setHistoryStack((prev) => [...prev, selectedRootId]);
    }

    setSubtreeError(null);
    setSelectedRootId(resp.rootId);
    setIsolatedNodes(resp.nodes);
    setIsolatedStats(resp.stats);
    setSelectedLevelFilter('all');
    setExpandedNodes(computeExpandedForSubtree(resp.nodes, resp.rootId, 'all'));
    setHighlightNodeId(null);
    if (options?.resetZoom) {
      setZoomLevel(1);
    }
    syncUrlTreeCompanyId(resp.rootId);
  };

  useEffect(() => {
    const fromUrl = getUrlTreeCompanyId();
    const initialTarget = fromUrl || defaultRootId;
    if (initialTarget) {
      openIsolatedSubtree(initialTarget, { pushHistory: false });
    } else {
      setSubtreeError({
        statusCode: 403,
        code: 'ACCESS_DENIED',
        message: 'আপনার অ্যাকাউন্টের জন্য এখনো কোনো Company ID বরাদ্দ হয়নি। আগে নেটওয়ার্ক মেম্বারশিপ সক্রিয় করুন।'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, ownCompanyMemberId, treeState.version]);

  const activeFocusMember =
    isolatedNodeMap.get(selectedRootId) || isolatedNodes[0] || null;

  // Real-time AI Placement Recommendation scoped to user's allowed root
  const aiRecommendation = useMemo(() => {
    const scopeRoot = activeFocusMember?.id || ownCompanyMemberId || currentMember.id || COMPANY_MASTER_ROOT_ID;
    return SlotReservationService.calculateAIRecommendation(
      scopeRoot,
      allTreeNodes,
      reservedPlacements
    );
  }, [activeFocusMember, ownCompanyMemberId, currentMember, allTreeNodes, reservedPlacements]);

  const handleRunMatching = () => {
    const res = runDailyMatchingEngine();
    setMatchingResult(res);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) {
      setSubtreeError({
        statusCode: 400,
        code: 'INVALID_INPUT',
        message: 'অনুগ্রহ করে একটি বৈধ Company ID লিখুন।'
      });
      return;
    }
    openIsolatedSubtree(clean, { pushHistory: true, resetZoom: true });
  };

  const handleGoBack = () => {
    if (historyStack.length === 0) return;
    const prevId = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setSearchQuery(prevId);
    openIsolatedSubtree(prevId, { pushHistory: false, resetZoom: true });
  };

  const handleGoHomeNode = () => {
    if (!defaultRootId) return;
    setHistoryStack([]);
    setSearchQuery('');
    openIsolatedSubtree(defaultRootId, { pushHistory: false, resetZoom: true });
  };

  const handleSelectTreeLevel = (levelVal: number | 'all') => {
    setSelectedLevelFilter(levelVal);
    if (activeFocusMember) {
      setExpandedNodes(computeExpandedForSubtree(isolatedNodes, activeFocusMember.id, levelVal));
    }
  };

  const handleFindInSubtree = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inSubtreeQuery.trim().toLowerCase();
    if (!q) {
      setHighlightNodeId(null);
      return;
    }
    const match = isolatedNodes.find(
      (n) =>
        n.id.toLowerCase() === q ||
        n.id.toLowerCase().includes(q) ||
        n.fullName.toLowerCase().includes(q) ||
        (n.mobile && n.mobile.includes(q))
    );
    if (match) {
      setHighlightNodeId(match.id);
      const nextExp: Record<string, boolean> = { ...expandedNodes, [match.id]: true };
      let curr: NetworkMember | undefined = match;
      const visited = new Set<string>();
      while (curr?.parentId && !visited.has(curr.id)) {
        visited.add(curr.id);
        nextExp[curr.parentId] = true;
        curr = isolatedNodeMap.get(curr.parentId);
      }
      setExpandedNodes(nextExp);
    } else {
      setHighlightNodeId(null);
      setSubtreeError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `এই সাব-ট্রির ভেতরে '${inSubtreeQuery}' পাওয়া যায়নি।`
      });
    }
  };

  // Recursive Unlimited-Level Tree Renderer (reads ONLY from isolatedNodeMap)
  const renderSubtreeNode = (
    nodeId: string | undefined,
    positionLabel: 'ROOT' | 'LEFT' | 'RIGHT',
    depth: number
  ): React.ReactNode => {
    if (!nodeId) return null;
    const node = isolatedNodeMap.get(nodeId);
    if (!node) return null;

    if (node.nodeStatus === 'blank') {
      const isLeftBlank = (node.placementLeg || positionLabel.toLowerCase()) === 'left';
      const parentId = node.parentId || selectedRootId;
      const parentNode = isolatedNodeMap.get(parentId);
      const isReserved = reservedPlacements.find(
        (r) => r.parentMemberId === parentId && r.leg === (isLeftBlank ? 'left' : 'right')
      );

      if (isReserved) {
        return (
          <div className="w-56 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-dashed border-amber-400 rounded-2xl text-center space-y-1.5">
            <span className="bg-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> সংরক্ষিত স্লট
            </span>
            <h5 className="font-bold text-xs text-amber-950 dark:text-amber-200">{isReserved.customerName}</h5>
            <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{isReserved.customerMobile}</p>
          </div>
        );
      }

      return (
        <button
          type="button"
          onClick={() =>
            setAddCustomerSlot({
              parentId,
              parentName: parentNode?.fullName || parentId,
              leg: isLeftBlank ? 'left' : 'right',
              reservedCompanyId: node.id
            })
          }
          className={`w-56 rounded-2xl p-3.5 border-2 border-dashed text-left transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] ${
            highlightNodeId === node.id
              ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50'
              : isLeftBlank
              ? 'border-blue-400/80 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/25'
              : 'border-teal-400/80 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-950/25'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                isLeftBlank ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
              }`}
            >
              {isLeftBlank ? 'LEFT BLANK' : 'RIGHT BLANK'}
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Reserved
            </span>
          </div>
          <div className="font-mono font-black text-sm text-neutral-900 dark:text-white">[{node.id}]</div>
          <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center justify-between">
            <span>Status: <strong>BLANK</strong></span>
            <span>Parent: <strong className="font-mono">{parentId}</strong></span>
          </div>
          <div
            className={`mt-2 py-1 px-2 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 ${
              isLeftBlank ? 'bg-blue-600' : 'bg-teal-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Click to Register</span>
          </div>
        </button>
      );
    }

    const member = node;
    const isTemporaryRoot = member.id === selectedRootId;
    const isExpanded = !!expandedNodes[member.id];
    const leftTargetId = member.leftChildId || member.leftBlankId;
    const rightTargetId = member.rightChildId || member.rightBlankId;
    const hasChildren = !!leftTargetId || !!rightTargetId;

    return (
      <div className="flex flex-col items-center">
        <div
          className={`relative w-60 p-4 rounded-2xl border shadow-sm transition-all ${
            highlightNodeId === member.id
              ? 'ring-4 ring-amber-400 border-amber-500 bg-amber-50/90 dark:bg-amber-950/90'
              : isTemporaryRoot
              ? 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-neutral-900 border-2 border-emerald-500 shadow-md'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                isTemporaryRoot
                  ? 'bg-emerald-600 text-white'
                  : positionLabel === 'LEFT'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
              }`}
            >
              {isTemporaryRoot ? (member.id === ownCompanyMemberId ? 'ROOT (YOU)' : 'SELECTED ROOT') : positionLabel}
            </span>
            <span className="font-mono font-black text-xs text-neutral-900 dark:text-white">
              {member.id}
            </span>
          </div>

          <h4 className="font-black text-sm text-neutral-900 dark:text-white truncate" title={member.fullName}>
            {member.fullName}
          </h4>
          <p className="text-[10px] text-emerald-600 font-semibold truncate mb-2">
            Personal PV: {formatPV(member.pv)} PV
          </p>

          <div className="grid grid-cols-2 gap-1.5 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-[10px] font-mono mb-2">
            <div className="text-blue-700 dark:text-blue-300 font-bold">
              L: {formatPV(member.leftPV)} PV
            </div>
            <div className="text-teal-700 dark:text-teal-300 font-bold">
              R: {formatPV(member.rightPV)} PV
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => openIsolatedSubtree(member.id, { pushHistory: true, resetZoom: true })}
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>ট্রি খুলুন</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-neutral-400 font-mono">
              Matched: {formatPV(member.totalMatchedPV)}
            </span>
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={() =>
                setExpandedNodes((prev) => ({
                  ...prev,
                  [member.id]: !prev[member.id]
                }))
              }
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 shadow-xs cursor-pointer z-10"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-3">
            <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-start">
              <div className="flex flex-col items-center px-3 relative">
                <div className="absolute top-0 right-1/2 w-full h-0.5 bg-neutral-300 dark:bg-neutral-700 translate-x-1/2" />
                <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700" />
                {renderSubtreeNode(leftTargetId, 'LEFT', depth + 1)}
              </div>
              <div className="flex flex-col items-center px-3 relative">
                <div className="absolute top-0 left-1/2 w-full h-0.5 bg-neutral-300 dark:bg-neutral-700 -translate-x-1/2" />
                <div className="w-0.5 h-6 bg-neutral-300 dark:bg-neutral-700" />
                {renderSubtreeNode(rightTargetId, 'RIGHT', depth + 1)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-teal-700/40">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-emerald-300" />
            <h3 className="font-black text-xl">বাইনারি নেটওয়ার্ক ট্রি ও ID-ভিত্তিক সাব-ট্রি ভিউয়ার</h3>
          </div>
          <p className="text-xs text-teal-100/80 mt-1">
            অনুমোদিত Company ID অনুযায়ী বিচ্ছিন্ন বাইনারি নেটওয়ার্ক, প্রি-রিজার্ভড Left/Right Blank Position ও রিয়েল-টাইম PV বিশ্লেষণ
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunMatching}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-2xl text-xs shadow-lg flex items-center gap-2 transition-transform hover:scale-105 shrink-0 cursor-pointer"
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

      {/* ID-Wise Tree Header: Search Box + Required Counters + Back / Home Controls */}
      <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[230px] max-w-md">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Enter Company ID to View Network"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (subtreeError) setSubtreeError(null);
                }}
                placeholder="Enter Company ID to View Network"
                className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderTree className="w-3.5 h-3.5" />}
              <span>Open Network</span>
            </button>

            {historyStack.length > 0 && (
              <button
                type="button"
                onClick={handleGoBack}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back ({historyStack[historyStack.length - 1]})</span>
              </button>
            )}

            {defaultRootId && (
              <button
                type="button"
                onClick={handleGoHomeNode}
                className="px-3 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-800"
              >
                <Home className="w-3.5 h-3.5" />
                <span>আমার হোম ({defaultRootId})</span>
              </button>
            )}
          </form>

          {/* Header Stats */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <span className="text-neutral-500">Selected Company ID: </span>
              <strong className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                {isolatedStats?.selectedCompanyId || selectedRootId || 'N/A'}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              <span className="text-neutral-500">Network Members: </span>
              <strong className="font-mono font-black text-blue-700 dark:text-blue-300">
                {isolatedStats?.networkMembers ?? 0}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
              <span className="text-neutral-500">Tree Levels: </span>
              <strong className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                {isolatedStats?.treeLevels ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Access Denied / Not Found Alert */}
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
              {subtreeError.statusCode === 403 ? (
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              )}
              <span>{subtreeError.message}</span>
            </div>
            {defaultRootId && subtreeError.statusCode === 403 && (
              <button
                type="button"
                onClick={handleGoHomeNode}
                className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg text-[11px] shrink-0 cursor-pointer"
              >
                Return to My ID ({defaultRootId})
              </button>
            )}
          </div>
        )}

        {/* Toolbar: In-subtree Search, Level Selector, Zoom & Expand/Collapse */}
        {activeFocusMember && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <form onSubmit={handleFindInSubtree} className="flex items-center gap-1.5">
              <input
                type="text"
                value={inSubtreeQuery}
                onChange={(e) => setInSubtreeQuery(e.target.value)}
                placeholder="এই ট্রির ভেতরে খুঁজুন..."
                className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs w-44"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-neutral-800 text-white rounded-xl font-bold cursor-pointer"
              >
                Highlight
              </button>
            </form>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <select
                  aria-label="Member Tree Level View"
                  value={selectedLevelFilter === 'all' ? 'all' : String(selectedLevelFilter)}
                  onChange={(e) =>
                    handleSelectTreeLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="all">All Levels ({isolatedStats?.treeLevels || 1})</option>
                  {Array.from({ length: Math.max(1, isolatedStats?.treeLevels || 1) }, (_, i) => i + 1).map(
                    (lvl) => (
                      <option key={lvl} value={String(lvl)}>
                        Up to Level {lvl}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2))}
                  className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-2">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.45))}
                  className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTreeLevel('all')}
                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedLevelFilter(1);
                  setExpandedNodes({});
                }}
                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl font-semibold cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>
        )}
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
            className="text-[10px] underline font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Group Volume Metrics for Isolated Temporary Root */}
      {activeFocusMember && (
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
            <span className="text-neutral-500 text-[11px] font-semibold block">আইসোলেটেড রুট (Isolated Root):</span>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {activeFocusMember.id}
            </p>
            <span className="text-[10px] text-neutral-400 block truncate">{activeFocusMember.fullName}</span>
          </div>
        </div>
      )}

      {/* Visual Unlimited-Depth Isolated Binary Tree Container */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs overflow-x-auto min-h-[420px] flex justify-center">
        {activeFocusMember ? (
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center'
            }}
            className="inline-block py-4"
          >
            {renderSubtreeNode(activeFocusMember.id, 'ROOT', 0)}
          </div>
        ) : (
          <div className="m-auto text-center max-w-md p-6 space-y-2">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              {subtreeError?.statusCode === 403 ? 'Access Denied' : 'নেটওয়ার্ক ট্রি পাওয়া যায়নি'}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {subtreeError?.message || 'বৈধ Company ID দিয়ে চেষ্টা করুন।'}
            </p>
          </div>
        )}
      </div>

      {/* Binary Tree Customer Slot Reservation Modal - EXACT SAME SHARED FORM */}
      {addCustomerSlot && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setAddCustomerSlot(null)}
          source="binary_tree"
          title="কাস্টমার রেজিস্ট্রেশন ও স্লট রিজার্ভ"
          subtitle={`নির্বাচিত পজিশন: ${addCustomerSlot.leg === 'left' ? 'বাম (Left)' : 'ডান (Right)'}`}
          reservedCompanyId={addCustomerSlot.reservedCompanyId}
          initialReferralId={ownCompanyMemberId || currentMember?.customerId || currentMember?.id || COMPANY_MASTER_ROOT_ID}
          initialPlacementId={addCustomerSlot.parentId}
          initialPlacementPosition={addCustomerSlot.leg}
          lockPlacement={true}
          onSwitchToLogin={() => setAddCustomerSlot(null)}
          onSuccess={() => {
            if (selectedRootId) {
              openIsolatedSubtree(selectedRootId, { pushHistory: false });
            }
          }}
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
          reservedCompanyId={aiRecommendation.reservedCompanyId}
          initialReferralId={aiRecommendation.sponsorId}
          initialPlacementId={aiRecommendation.placementId}
          initialPlacementPosition={aiRecommendation.position}
          lockPlacement={true}
          onSwitchToLogin={() => setAiRegistrationOpen(false)}
          onSuccess={() => {
            if (selectedRootId) {
              openIsolatedSubtree(selectedRootId, { pushHistory: false });
            }
          }}
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
