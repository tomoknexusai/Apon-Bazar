/**
 * Interactive ID-Wise Compact Binary Tree Viewer
 * Project: আপন বাজার (APON BAZAR)
 *
 * Layout & Isolation Rules:
 * - Selected Company ID is Temporary Root at top-center.
 * - Default 3-Node Compact Focus Mode displays ONLY Selected Root + direct LEFT & RIGHT.
 * - Optional Compact Downline toggle shows up to Level 3 (or expanded levels) cleanly on 1366x768 & 1920x1080.
 * - Strictly NO upline, sponsor, ancestor, or cross-line IDs are returned or rendered.
 * - Empty positions use SLOT-* markers and NEVER pre-allocate or burn AB- Customer IDs.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { COMPANY_MASTER_ROOT_ID, NetworkMember } from '../../types/networkMarketing';
import { computeSubtreeLegStats, IsolatedSubtreeStats } from '../../lib/binaryBlankPositionEngine';
import { CustomerRegistrationModal } from '../auth/CustomerRegistrationModal';
import { SlotReservationService } from '../../services/SlotReservationService';
import { PlacementManagementModal } from './PlacementManagementModal';
import { BinaryTreeLegend } from './BinaryTreeLegend';
import {
  GitBranch,
  Zap,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Clock,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  AlertTriangle,
  FolderTree,
  Focus,
  Network
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

  // Default: Compact 3-Node Focus Mode (Selected ID + direct LEFT & RIGHT)
  const [viewMode, setViewMode] = useState<'focus3' | 'downline'>('focus3');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>(3);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [highlightNodeId, setHighlightNodeId] = useState<string | null>(null);
  const [inSubtreeQuery, setInSubtreeQuery] = useState<string>('');

  const [addCustomerSlot, setAddCustomerSlot] = useState<{
    parentId: string;
    parentName: string;
    leg: 'left' | 'right';
    reservedCompanyId?: string;
  } | null>(null);

  const [newRegistrationOpen, setNewRegistrationOpen] = useState(false);

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
    const initialDepth = viewMode === 'focus3' ? 2 : 3;
    setSelectedLevelFilter(initialDepth);
    setExpandedNodes(computeExpandedForSubtree(resp.nodes, resp.rootId, initialDepth));
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
        message: 'আপনার অ্যাকাউন্টের জন্য এখনো কোনো Company ID বরাদ্দ হয়নি।'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, ownCompanyMemberId, treeState.version]);

  const activeFocusMember =
    isolatedNodeMap.get(selectedRootId) || isolatedNodes[0] || null;

  const focusLegStats = useMemo(
    () => computeSubtreeLegStats(allTreeNodes, activeFocusMember?.id || null),
    [allTreeNodes, activeFocusMember?.id]
  );

  const aiRecommendation = useMemo(() => {
    const scopeRoot = activeFocusMember?.id || ownCompanyMemberId || currentMember?.id || COMPANY_MASTER_ROOT_ID;
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
        message: 'অনুগ্রহ করে একটি বৈধ Company ID লিখুন (উদাঃ AB-1000000001, AB-1000000002)।'
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

  const handleSwitchViewMode = (mode: 'focus3' | 'downline') => {
    setViewMode(mode);
    setZoomLevel(1);
    if (activeFocusMember) {
      const targetDepth = mode === 'focus3' ? 2 : 3;
      setSelectedLevelFilter(targetDepth);
      setExpandedNodes(computeExpandedForSubtree(isolatedNodes, activeFocusMember.id, targetDepth));
    }
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
      if (viewMode === 'focus3') {
        setViewMode('downline');
      }
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

  // Compact Node Renderer
  const renderSubtreeNode = (
    nodeId: string | undefined,
    positionLabel: 'ROOT' | 'LEFT' | 'RIGHT',
    depth: number
  ): React.ReactNode => {
    if (!nodeId) {
      return (
        <div className="w-[156px] sm:w-[168px] p-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/50 text-center text-[11px] text-neutral-500">
          Empty {positionLabel}
        </div>
      );
    }
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
          <div className="w-[156px] sm:w-[168px] p-2.5 bg-amber-50/80 dark:bg-amber-950/40 border-2 border-dashed border-amber-400 rounded-xl text-center space-y-1">
            <span className="bg-amber-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Reserved
            </span>
            <h5 className="font-bold text-[11px] text-amber-950 dark:text-amber-200 truncate">{isReserved.customerName}</h5>
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
          className={`w-[156px] sm:w-[168px] rounded-xl p-2.5 border-2 border-dashed text-left transition-all cursor-pointer hover:shadow-md ${
            highlightNodeId === node.id
              ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-50'
              : isLeftBlank
              ? 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-500'
              : 'border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20 hover:border-teal-500'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                isLeftBlank ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
              }`}
            >
              EMPTY {isLeftBlank ? 'LEFT' : 'RIGHT'}
            </span>
            <span className="text-[9px] font-semibold text-neutral-500">No ID Burn</span>
          </div>
          <div className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 truncate">
            Parent: <strong className="text-neutral-900 dark:text-neutral-200">{parentId}</strong>
          </div>
          <div
            className={`mt-2 py-1 px-2 rounded-lg text-[10px] font-bold text-white flex items-center justify-center gap-1 ${
              isLeftBlank ? 'bg-blue-600' : 'bg-teal-600'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span>Register</span>
          </div>
        </button>
      );
    }

    const member = node;
    const isTemporaryRoot = member.id === selectedRootId;
    const isCompanyAccount = /^AB-100000000[1-7]$/.test(member.id);
    const isExpanded = viewMode === 'focus3' ? depth === 0 : !!expandedNodes[member.id];
    const leftTargetId = member.leftChildId || member.leftBlankId;
    const rightTargetId = member.rightChildId || member.rightBlankId;
    const hasChildren = (viewMode === 'focus3' ? depth === 0 : true) && (!!leftTargetId || !!rightTargetId);

    return (
      <div className="flex flex-col items-center">
        <div
          onClick={() => {
            if (!isTemporaryRoot) {
              openIsolatedSubtree(member.id, { pushHistory: true, resetZoom: true });
            }
          }}
          className={`relative w-[162px] sm:w-[176px] p-2.5 rounded-xl border transition-all ${
            !isTemporaryRoot ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md' : ''
          } ${
            highlightNodeId === member.id
              ? 'ring-2 ring-amber-400 border-amber-500 bg-amber-50/90 dark:bg-amber-950/90'
              : isTemporaryRoot
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-600 shadow-sm'
              : isCompanyAccount
              ? 'bg-amber-50/40 dark:bg-neutral-900 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                isTemporaryRoot
                  ? 'bg-emerald-600 text-white'
                  : positionLabel === 'LEFT'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
              }`}
            >
              {isTemporaryRoot ? (member.id === ownCompanyMemberId ? 'YOU / ROOT' : 'SELECTED ROOT') : positionLabel}
            </span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                member.active ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              title={member.active ? 'Active' : 'Inactive'}
            />
          </div>

          <div className="font-mono tabular-nums font-black text-[11px] text-neutral-900 dark:text-white truncate">
            {member.id}
          </div>
          <h4 className="font-bold text-xs text-neutral-800 dark:text-neutral-200 truncate" title={member.fullName}>
            {member.fullName}
          </h4>

          <div className="grid grid-cols-2 gap-1 px-1.5 py-1 bg-neutral-50 dark:bg-neutral-800/70 rounded-lg text-[10px] font-mono tabular-nums mt-1.5">
            <div className="text-blue-700 dark:text-blue-300 font-bold truncate">
              L: {formatPV(member.leftPV)}
            </div>
            <div className="text-teal-700 dark:text-teal-300 font-bold truncate text-right">
              R: {formatPV(member.rightPV)}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] pt-1.5 mt-1.5 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openIsolatedSubtree(member.id, { pushHistory: true, resetZoom: true });
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>Open</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-[9px] text-neutral-500 font-mono tabular-nums">
              PV: {formatPV(member.pv)}
            </span>
          </div>

          {viewMode === 'downline' && hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedNodes((prev) => ({
                  ...prev,
                  [member.id]: !prev[member.id]
                }));
              }}
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 shadow-xs cursor-pointer z-10"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col items-center mt-1">
            <div className="w-0.5 h-3 bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-start">
              <div className="flex flex-col items-center px-2 relative">
                <div className="absolute top-0 left-1/2 right-0 h-0.5 bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-0.5 h-3 bg-neutral-300 dark:bg-neutral-700" />
                {renderSubtreeNode(leftTargetId, 'LEFT', depth + 1)}
              </div>
              <div className="flex flex-col items-center px-2 relative">
                <div className="absolute top-0 left-0 right-1/2 h-0.5 bg-neutral-300 dark:bg-neutral-700" />
                <div className="w-0.5 h-3 bg-neutral-300 dark:bg-neutral-700" />
                {renderSubtreeNode(rightTargetId, 'RIGHT', depth + 1)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 text-neutral-900 dark:text-neutral-100">
      {/* Compact Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-teal-700/40">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-300" />
            <h3 className="font-black text-base sm:text-lg">ID-ভিত্তিক কম্প্যাক্ট বাইনারি নেটওয়ার্ক ট্রি</h3>
          </div>
          <p className="text-[11px] text-teal-100/80 mt-0.5">
            শুধুমাত্র নির্বাচিত Company ID এবং তার নিজস্ব ডাউনলাইন শাখা (কোনো আপলাইন বা ক্রস-লাইন দেখানো হয় না)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setNewRegistrationOpen(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন মেম্বার নিবন্ধন (10-Field)</span>
          </button>

          <button
            type="button"
            onClick={handleRunMatching}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 fill-neutral-950" />
            <span>ডেইলি ম্যাচিং</span>
          </button>
        </div>
      </div>

      {/* ID Search, View Mode Toggle & Counters */}
      <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Enter Company ID to View Network"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (subtreeError) setSubtreeError(null);
                }}
                placeholder="উদাঃ AB-1000000002"
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderTree className="w-3.5 h-3.5" />}
              <span>Open Network</span>
            </button>

            {historyStack.length > 0 && (
              <button
                type="button"
                onClick={handleGoBack}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer border border-neutral-300 dark:border-neutral-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back ({historyStack[historyStack.length - 1]})</span>
              </button>
            )}

            {defaultRootId && (
              <button
                type="button"
                onClick={handleGoHomeNode}
                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800"
              >
                <Home className="w-3.5 h-3.5" />
                <span>হোম ({defaultRootId})</span>
              </button>
            )}
          </form>

          {/* Compact Header Stats */}
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
              <span className="text-neutral-500">Root: </span>
              <strong className="font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300">
                {isolatedStats?.selectedCompanyId || selectedRootId || 'N/A'}
              </strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
              <span className="text-neutral-500">Members: </span>
              <strong className="font-mono tabular-nums font-black text-blue-700 dark:text-blue-300">
                {isolatedStats?.networkMembers ?? 0}
              </strong>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
              <span className="text-neutral-500">Levels: </span>
              <strong className="font-mono tabular-nums font-black text-indigo-700 dark:text-indigo-300">
                {isolatedStats?.treeLevels ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Access Denied / Not Found Alert */}
        {subtreeError && (
          <div
            role="alert"
            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
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
                Return to {defaultRootId}
              </button>
            )}
          </div>
        )}

        {/* Compact Toolbar: 3-Node Focus vs Downline + Search + Level + Zoom */}
        {activeFocusMember && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchViewMode('focus3')}
                className={`px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer border ${
                  viewMode === 'focus3'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <Focus className="w-3.5 h-3.5" />
                <span>3-Node Focus (Selected + L/R)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchViewMode('downline')}
                className={`px-2.5 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 cursor-pointer border ${
                  viewMode === 'downline'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Full Downline</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <form onSubmit={handleFindInSubtree} className="flex items-center gap-1">
                <input
                  type="text"
                  value={inSubtreeQuery}
                  onChange={(e) => setInSubtreeQuery(e.target.value)}
                  placeholder="ট্রিতে খুঁজুন..."
                  className="px-2.5 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs w-36"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-neutral-800 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                >
                  Find
                </button>
              </form>

              {viewMode === 'downline' && (
                <>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <select
                      aria-label="Member Tree Level View"
                      value={selectedLevelFilter === 'all' ? 'all' : String(selectedLevelFilter)}
                      onChange={(e) =>
                        handleSelectTreeLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))
                      }
                      className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs font-bold"
                    >
                      <option value="all">All Levels ({isolatedStats?.treeLevels || 1})</option>
                      {Array.from({ length: Math.max(1, isolatedStats?.treeLevels || 1) }, (_, i) => i + 1).map(
                        (lvl) => (
                          <option key={lvl} value={String(lvl)}>
                            Level {lvl}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.8))}
                      className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1.5">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.5))}
                      className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:bg-white dark:hover:bg-neutral-700 rounded cursor-pointer"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {matchingResult && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>
              ম্যাচিং সম্পন্ন! মোট {formatPV(matchingResult.matchedPV)} PV ম্যাচিং (৳ {(matchingResult.totalPayoutBDT ?? 0).toLocaleString()})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMatchingResult(null)}
            className="text-[11px] underline font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      )}

      {/* Compact Legend Component */}
      <BinaryTreeLegend compact={true} />

      {/* Compact Binary Tree Canvas (Fits cleanly on 1366x768 & 1920x1080 without forced scroll) */}
      <div className="p-4 sm:p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-x-auto min-h-[340px] flex justify-center">
        {activeFocusMember ? (
          <div
            style={{
              transform: viewMode === 'downline' ? `scale(${zoomLevel})` : undefined,
              transformOrigin: 'top center'
            }}
            className="inline-block py-2"
          >
            {renderSubtreeNode(activeFocusMember.id, 'ROOT', 0)}
          </div>
        ) : (
          <div className="m-auto text-center max-w-md p-6 space-y-2">
            <ShieldAlert className="w-9 h-9 text-red-500 mx-auto" />
            <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
              {subtreeError?.statusCode === 403 ? 'Access Denied' : 'নেটওয়ার্ক ট্রি পাওয়া যায়নি'}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {subtreeError?.message || 'বৈধ Company ID দিয়ে চেষ্টা করুন (উদাঃ AB-1000000001)।'}
            </p>
          </div>
        )}
      </div>

      {/* Compact PV Metrics Strip Below Tree */}
      {activeFocusMember && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl">
            <span className="text-neutral-500 text-[10px] font-semibold block">Left Team GV & Count</span>
            <p className="text-base font-black text-emerald-600 font-mono tabular-nums">
              {formatPV(activeFocusMember.leftPV)} PV
            </p>
            <span className="text-[10px] text-neutral-400">
              সদস্য: {focusLegStats.left.totalMembers} (সক্রিয়: {focusLegStats.left.activeMembers}) • CF: {formatPV(activeFocusMember.leftCarryForward)} PV
            </span>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl">
            <span className="text-neutral-500 text-[10px] font-semibold block">Right Team GV & Count</span>
            <p className="text-base font-black text-teal-600 font-mono tabular-nums">
              {formatPV(activeFocusMember.rightPV)} PV
            </p>
            <span className="text-[10px] text-neutral-400">
              সদস্য: {focusLegStats.right.totalMembers} (সক্রিয়: {focusLegStats.right.activeMembers}) • CF: {formatPV(activeFocusMember.rightCarryForward)} PV
            </span>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl">
            <span className="text-neutral-500 text-[10px] font-semibold block">Total Matched PV</span>
            <p className="text-base font-black text-amber-600 font-mono tabular-nums">
              {formatPV(activeFocusMember.totalMatchedPV)} PV
            </p>
            <span className="text-[10px] text-neutral-400">৳ ১০ / PV</span>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl">
            <span className="text-neutral-500 text-[10px] font-semibold block">Selected Root</span>
            <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono truncate">
              {activeFocusMember.id}
            </p>
            <span className="text-[10px] text-neutral-400 truncate block">{activeFocusMember.fullName}</span>
          </div>
        </div>
      )}

      {/* Blank Slot Registration Modal */}
      {addCustomerSlot && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setAddCustomerSlot(null)}
          source="binary_tree"
          title="নতুন মেম্বার নিবন্ধন (10-Field)"
          subtitle={`Parent: ${addCustomerSlot.parentId} • Position: ${addCustomerSlot.leg.toUpperCase()}`}
          reservedCompanyId={addCustomerSlot.reservedCompanyId}
          initialReferralId={ownCompanyMemberId || activeFocusMember?.id || COMPANY_MASTER_ROOT_ID}
          initialPlacementId={addCustomerSlot.parentId}
          initialPlacementPosition={addCustomerSlot.leg}
          lockPlacement={true}
          showTabs={false}
          onSwitchToLogin={() => setAddCustomerSlot(null)}
          onSuccess={() => {
            if (selectedRootId) {
              openIsolatedSubtree(selectedRootId, { pushHistory: false });
            }
          }}
        />
      )}

      {/* Auto-BFS Registration Modal */}
      {newRegistrationOpen && (
        <CustomerRegistrationModal
          isOpen={true}
          onClose={() => setNewRegistrationOpen(false)}
          source="binary_tree"
          title="নতুন কাস্টমার ও নেটওয়ার্ক নিবন্ধন"
          subtitle="Referral ID পরিবর্তনযোগ্য এবং Manual অথবা Auto BFS Placement নির্বাচন করা যাবে"
          initialReferralId={activeFocusMember?.id || ownCompanyMemberId || aiRecommendation.sponsorId}
          showTabs={false}
          onSwitchToLogin={() => setNewRegistrationOpen(false)}
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
