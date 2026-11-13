/**
 * Visual Analytics Component for Market/Bazar Management
 * Uses Recharts to render interactive charts for market distribution by type
 * and active/inactive status breakdown within a selected Ward or administrative boundary.
 */

import React, { useState, useMemo } from 'react';
import { MarketItem, MarketType } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Store,
  Filter,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface MarketAnalyticsProps {
  markets: MarketItem[];
  selectedDivision?: string;
  selectedDistrict?: string;
  selectedUpazila?: string;
  selectedUnion?: string;
  selectedWard?: string;
  onSelectWard?: (ward: string) => void;
  availableWards?: string[];
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  'Daily Market': '#10b981', // Emerald
  'Weekly Hat': '#f59e0b', // Amber
  'Shopping Mall': '#a855f7', // Purple
  'Super Shop': '#3b82f6', // Blue
  'Wholesale Market': '#6366f1', // Indigo
  'Local Market': '#14b8a6', // Teal
  'Other': '#6b7280' // Gray
};

const TYPE_LABELS_BN: Record<string, string> = {
  'Daily Market': 'দৈনিক কাঁচাবাজার',
  'Weekly Hat': 'সাপ্তাহিক হাট',
  'Shopping Mall': 'শপিং মল',
  'Super Shop': 'সুপার শপ',
  'Wholesale Market': 'পাইকারী বাজার',
  'Local Market': 'স্থানীয় বাজার',
  'Other': 'অন্যান্য'
};

const STATUS_COLORS = {
  Active: '#10b981', // Green
  Inactive: '#f43f5e' // Rose
};

export const MarketAnalytics: React.FC<MarketAnalyticsProps> = ({
  markets,
  selectedDivision = '',
  selectedDistrict = '',
  selectedUpazila = '',
  selectedUnion = '',
  selectedWard = '',
  onSelectWard,
  availableWards = [],
  className = ''
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'type_bar' | 'status_stacked' | 'status_pie'>('type_bar');
  const [internalWardFilter, setInternalWardFilter] = useState<string>(selectedWard);

  // Synchronize internal ward filter if prop changes
  const currentWard = selectedWard || internalWardFilter;

  // Filter markets based on scope
  const scopedMarkets = useMemo(() => {
    return markets.filter((m) => {
      if (selectedDivision && m.division !== selectedDivision) return false;
      if (selectedDistrict && m.district !== selectedDistrict) return false;
      if (selectedUpazila && m.upazila !== selectedUpazila) return false;
      if (selectedUnion && m.unionName !== selectedUnion) return false;
      if (currentWard && m.ward !== currentWard) return false;
      return true;
    });
  }, [markets, selectedDivision, selectedDistrict, selectedUpazila, selectedUnion, currentWard]);

  // Extract unique ward list if not explicitly passed
  const wardList = useMemo(() => {
    if (availableWards && availableWards.length > 0) return availableWards;
    const wardSet = new Set<string>();
    markets.forEach((m) => {
      if (m.ward) wardSet.add(m.ward);
    });
    return Array.from(wardSet).sort();
  }, [markets, availableWards]);

  // Key KPI Metrics
  const totalCount = scopedMarkets.length;
  const activeCount = scopedMarkets.filter((m) => m.status === 'Active').length;
  const inactiveCount = scopedMarkets.filter((m) => m.status === 'Inactive').length;
  const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

  // Distribution by Market Type Data
  const typeDistributionData = useMemo(() => {
    const counts: Record<string, { total: number; active: number; inactive: number }> = {};

    scopedMarkets.forEach((m) => {
      const typeKey = m.marketType || 'Other';
      if (!counts[typeKey]) {
        counts[typeKey] = { total: 0, active: 0, inactive: 0 };
      }
      counts[typeKey].total += 1;
      if (m.status === 'Active') {
        counts[typeKey].active += 1;
      } else {
        counts[typeKey].inactive += 1;
      }
    });

    return Object.keys(counts).map((typeKey) => ({
      type: typeKey,
      name: isBn ? TYPE_LABELS_BN[typeKey] || typeKey : typeKey,
      count: counts[typeKey].total,
      Active: counts[typeKey].active,
      Inactive: counts[typeKey].inactive,
      fill: TYPE_COLORS[typeKey] || '#6b7280'
    }));
  }, [scopedMarkets, isBn]);

  // Top market type
  const topMarketType = useMemo(() => {
    if (typeDistributionData.length === 0) return 'N/A';
    const sorted = [...typeDistributionData].sort((a, b) => b.count - a.count);
    return sorted[0]?.name || 'N/A';
  }, [typeDistributionData]);

  // Status Pie Chart Data
  const statusPieData = useMemo(() => {
    return [
      { name: isBn ? 'সক্রিয় বাজার (Active)' : 'Active Markets', value: activeCount, color: STATUS_COLORS.Active },
      { name: isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive Markets', value: inactiveCount, color: STATUS_COLORS.Inactive }
    ].filter((item) => item.value > 0);
  }, [activeCount, inactiveCount, isBn]);

  const handleWardChange = (wardVal: string) => {
    setInternalWardFilter(wardVal);
    if (onSelectWard) {
      onSelectWard(wardVal);
    }
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-5 ${className}`}>
      {/* Header & Ward Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span>{isBn ? 'ওয়ার্ডভিত্তিক বাজার এনালিটিক্স (Ward Visual Analytics)' : 'Ward Market Analytics'}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                {currentWard ? (isBn ? `${currentWard}` : `${currentWard}`) : (isBn ? 'সকল ওয়ার্ড' : 'All Wards')}
              </span>
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isBn
                ? 'বাজারের ধরনভিত্তিক বণ্টন ও ওয়ার্ড ভিত্তিক সক্রিয়/নিষ্ক্রিয় অবস্থার চিত্র।'
                : 'Interactive chart showing market types distribution & status per ward.'}
            </p>
          </div>
        </div>

        {/* Ward Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={currentWard}
            onChange={(e) => handleWardChange(e.target.value)}
            className="text-xs font-bold bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-1.5 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{isBn ? 'সকল ওয়ার্ড (All Wards)' : 'All Wards'}</option>
            {wardList.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Markets */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/60 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
            <span className="text-[10px] font-bold uppercase">{isBn ? 'মোট বাজার' : 'Total Markets'}</span>
            <Store className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-neutral-900 dark:text-white">{totalCount}</div>
          <div className="text-[10px] text-neutral-500">{isBn ? 'নিবন্ধিত মার্কেট' : 'Registered Markets'}</div>
        </div>

        {/* Active Markets */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-[10px] font-bold uppercase">{isBn ? 'সক্রিয় বাজার' : 'Active Markets'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-900 dark:text-emerald-100">{activeCount}</div>
          <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
            {activePercentage}% {isBn ? 'সক্রিয়তার হার' : 'Active Rate'}
          </div>
        </div>

        {/* Inactive Markets */}
        <div className="bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
            <span className="text-[10px] font-bold uppercase">{isBn ? 'নিষ্ক্রিয় বাজার' : 'Inactive Markets'}</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-black text-rose-900 dark:text-rose-100">{inactiveCount}</div>
          <div className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">
            {totalCount > 0 ? Math.round((inactiveCount / totalCount) * 100) : 0}% {isBn ? 'নিষ্ক্রিয়' : 'Inactive'}
          </div>
        </div>

        {/* Dominant Type */}
        <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-3 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300">
            <span className="text-[10px] font-bold uppercase">{isBn ? 'প্রধান ক্যাটাগরি' : 'Top Type'}</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xs font-black text-purple-900 dark:text-purple-100 truncate" title={topMarketType}>
            {topMarketType}
          </div>
          <div className="text-[10px] text-purple-700 dark:text-purple-300">
            {isBn ? 'সর্বাধিক উপস্থিত বাজার' : 'Most Frequent'}
          </div>
        </div>
      </div>

      {/* View Switch Tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('type_bar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'type_bar'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{isBn ? 'বাজারের ধরন বণ্টন' : 'Market Types'}</span>
        </button>

        <button
          onClick={() => setActiveTab('status_stacked')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'status_stacked'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isBn ? 'সক্রিয়তা তুলনা (Stacked)' : 'Active vs Inactive (Types)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('status_pie')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'status_pie'
              ? 'bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <PieIcon className="w-3.5 h-3.5" />
          <span>{isBn ? 'স্ট্যাটাস পাই চার্ট' : 'Status Ratio'}</span>
        </button>
      </div>

      {/* Chart Canvas Container */}
      <div className="bg-neutral-50/50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4 min-h-[280px]">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 text-center text-neutral-400 space-y-2">
            <Store className="w-8 h-8 opacity-40" />
            <p className="text-xs font-bold">
              {isBn ? 'নির্বাচিত ওয়ার্ড বা এলাকায় কোন বাজার নিবন্ধিত নেই।' : 'No markets registered in selected scope.'}
            </p>
          </div>
        ) : activeTab === 'type_bar' ? (
          /* Bar Chart: Markets Distribution by Type */
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {isBn ? 'মার্কেট / বাজারের ধরনের ভিত্তিতে মোট সংখ্যা:' : 'Total markets grouped by type:'}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888888' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#888888' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [value, isBn ? 'সংখ্যা' : 'Count']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {typeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : activeTab === 'status_stacked' ? (
          /* Stacked Bar Chart: Active vs Inactive per Type */
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {isBn ? 'প্রতিটি বাজারের ধরন অনুযায়ী সক্রিয় ও নিষ্ক্রিয় হিসাব:' : 'Active vs Inactive market breakdown by type:'}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#888888' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10, fill: '#888888' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Active" name={isBn ? 'সক্রিয় (Active)' : 'Active'} stackId="a" fill={STATUS_COLORS.Active} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Inactive" name={isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'} stackId="a" fill={STATUS_COLORS.Inactive} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Pie Chart: Overall Status Distribution */
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 text-center">
              {isBn ? 'সার্বিক সক্রিয় বনাম নিষ্ক্রিয় বাজারের অনুপাত:' : 'Overall Active vs Inactive ratio:'}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
