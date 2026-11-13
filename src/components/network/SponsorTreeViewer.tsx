/**
 * Sponsor Tree (Unilevel Direct & Multi-Generation Tree) Component
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNetworkMarketing } from '../../context/NetworkMarketingContext';
import { formatPV } from '../../lib/ecommerce-data';
import { NetworkMember } from '../../types/networkMarketing';
import { Network, Search, User, Users, ChevronRight, ChevronDown, Award, Sparkles, Filter, ShieldCheck } from 'lucide-react';

export const SponsorTreeViewer: React.FC = () => {
  const { members, currentMember } = useNetworkMarketing();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenFilter, setSelectedGenFilter] = useState<number>(0); // 0 = all, 1 to 20 = specific generation
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [currentMember.id]: true
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Build recursive sponsor tree
  const getChildren = (parentId: string): NetworkMember[] => {
    return members.filter((m) => m.sponsorId === parentId);
  };

  const filterTreeMember = (m: NetworkMember): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(query) ||
      m.mobile.includes(query) ||
      m.rank.toLowerCase().includes(query) ||
      m.packageName.toLowerCase().includes(query)
    );
  };

  // Render Member Node
  const renderMemberNode = (m: NetworkMember, generation: number = 1) => {
    const children = getChildren(m.id);
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedNodes[m.id];

    if (selectedGenFilter > 0 && generation > selectedGenFilter) return null;
    if (!filterTreeMember(m) && children.every((c) => !filterTreeMember(c))) return null;

    return (
      <div key={m.id} className="space-y-2 pl-2 sm:pl-4 border-l-2 border-emerald-500/20 dark:border-emerald-500/30">
        <div className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2.5 min-w-0">
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleNode(m.id)}
                className="p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
              G{generation}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-neutral-900 dark:text-white truncate">
                  {m.fullName}
                </h4>
                {m.id === currentMember.id && (
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded">
                    You
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="font-mono">{m.mobile}</span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{m.packageName}</span>
                <span>•</span>
                <span className="capitalize">{m.rank.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Member PV & Team Metrics */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-xl border border-neutral-100 dark:border-neutral-700">
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">Personal PV</span>
              <span className="font-black text-emerald-600 font-mono">{formatPV(m.pv)} PV</span>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">ডাইরেক্ট টিম</span>
              <span className="font-bold text-neutral-800 dark:text-neutral-200">{m.directReferralsCount} জন</span>
            </div>

            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">মোট টিম সদস্য</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{m.teamMembersCount} জন</span>
            </div>
          </div>

        </div>

        {/* Children Render recursion */}
        {hasChildren && isExpanded && (
          <div className="space-y-2 pl-2 sm:pl-4">
            {children.map((child) => renderMemberNode(child, generation + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-emerald-800/40">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black text-lg">স্পন্সর ট্রি ও ডাইরেক্ট টিম স্ট্রাকচার</h3>
          </div>
          <p className="text-xs text-emerald-100/80 mt-1">
            আপনার স্পন্সরকৃত ২০ জেনারেশন পর্যন্ত ডাইরেক্ট টিম নেটওয়ার্ক ও মেম্বার হাইরারকি
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/20">
          <Award className="w-4 h-4 text-amber-300" />
          <span>আপনার ডাইরেক্ট রেফারেল: {currentMember.directReferralsCount} জন</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="মেম্বার নাম, মোবাইল বা র‍্যাঙ্ক খুঁজুন..."
            className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl py-1.5 pl-9 pr-3 text-xs text-neutral-900 dark:text-white"
          />
        </div>

        {/* Generation Level Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="font-bold text-neutral-600 dark:text-neutral-400">জেনারেশন ফিল্টার:</span>
          <select
            value={selectedGenFilter}
            onChange={(e) => setSelectedGenFilter(Number(e.target.value))}
            className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 font-bold text-neutral-800 dark:text-neutral-200"
          >
            <option value={0}>সব ২০ জেনারেশন</option>
            {Array.from({ length: 20 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>জেনারেশন {i + 1} (Level {i + 1})</option>
            ))}
          </select>
        </div>

      </div>

      {/* Tree Content Render */}
      <div className="p-4 bg-neutral-50/50 dark:bg-neutral-950/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
        {renderMemberNode(currentMember, 1)}
      </div>

    </div>
  );
};
