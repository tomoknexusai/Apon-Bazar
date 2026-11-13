/**
 * Lightweight Audit Log Sidebar for Market Management Module
 * Displays an activity history drawer tracking creation, editing, and deletion of markets
 * with actor details, timestamps, action type badges, and search/filter options.
 */

import React, { useState, useMemo } from 'react';
import { MarketAuditLog } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  PlusCircle,
  Edit3,
  Trash2,
  Search,
  Filter,
  UserCheck,
  Clock,
  ShieldCheck,
  Store,
  Trash,
  RotateCcw,
  History,
  MapPin
} from 'lucide-react';

interface MarketAuditLogSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  logs: MarketAuditLog[];
  onClearLogs?: () => void;
  userRole?: string;
}

export const MarketAuditLogSidebar: React.FC<MarketAuditLogSidebarProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  userRole = 'admin'
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [selectedActionFilter, setSelectedActionFilter] = useState<'ALL' | 'ADD' | 'EDIT' | 'DELETE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter logs based on action and search text
  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (selectedActionFilter !== 'ALL' && log.action !== selectedActionFilter) {
        return false;
      }
      if (q) {
        const matchName = (log.marketNameBn || '').toLowerCase().includes(q) || (log.marketNameEn || '').toLowerCase().includes(q);
        const matchActor = (log.actorName || '').toLowerCase().includes(q);
        const matchWard = (log.ward || '').toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        if (!matchName && !matchActor && !matchWard && !matchDetails) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedActionFilter, searchQuery]);

  if (!isOpen) return null;

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return isBn ? 'এইমাত্র' : 'Just now';
      if (diffMins < 60) return isBn ? `${diffMins} মিনিট আগে` : `${diffMins}m ago`;
      if (diffHours < 24) return isBn ? `${diffHours} ঘণ্টা আগে` : `${diffHours}h ago`;
      if (diffDays < 7) return isBn ? `${diffDays} দিন আগে` : `${diffDays}d ago`;

      return date.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: MarketAuditLog['action']) => {
    switch (action) {
      case 'ADD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <PlusCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'সংযোজন (Added)' : 'Added'}</span>
          </span>
        );
      case 'EDIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{isBn ? 'সম্পাদনা (Edited)' : 'Edited'}</span>
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Trash2 className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>{isBn ? 'মুছে ফেলা (Deleted)' : 'Deleted'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin' || role === 'super_admin') return isBn ? 'অ্যাডমিন' : 'Admin';
    if (role === 'operations_partner') return isBn ? 'অপারেশন পার্টনার' : 'Ops Partner';
    return role;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-800 flex flex-col z-10">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <span>{isBn ? 'মার্কেট অডিট লগ' : 'Market Audit Logs'}</span>
                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {logs.length}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {isBn ? 'মার্কেট পরিবর্তন, সংযোজন ও বর্জনের ইতিহাস' : 'Track who added, edited or removed markets'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-2.5">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedActionFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedActionFilter === 'ALL'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200'
              }`}
            >
              {isBn ? 'সকল' : 'All'} ({logs.length})
            </button>
            <button
              onClick={() => setSelectedActionFilter('ADD')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedActionFilter === 'ADD'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isBn ? 'সংযোজন' : 'Added'} ({logs.filter((l) => l.action === 'ADD').length})
            </button>
            <button
              onClick={() => setSelectedActionFilter('EDIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedActionFilter === 'EDIT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              {isBn ? 'সম্পাদনা' : 'Edited'} ({logs.filter((l) => l.action === 'EDIT').length})
            </button>
            <button
              onClick={() => setSelectedActionFilter('DELETE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedActionFilter === 'DELETE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              {isBn ? 'মুছে ফেলা' : 'Deleted'} ({logs.filter((l) => l.action === 'DELETE').length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isBn ? 'মার্কেট, ওয়ার্ড বা ইউজারের নাম দিয়ে খুঁজুন...' : 'Search by market, ward, or user...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Audit Log Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-2 text-neutral-400">
              <History className="w-10 h-10 opacity-30" />
              <p className="text-xs font-bold">
                {isBn ? 'কোন মিল থাকা অডিট লগ পাওয়া যায়নি।' : 'No audit logs found matching criteria.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-neutral-50/80 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 rounded-xl p-3 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                {/* Header line: Action Badge & Time */}
                <div className="flex items-center justify-between gap-2">
                  {getActionBadge(log.action)}
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>

                {/* Market Details */}
                <div>
                  <h4 className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">{log.marketNameBn}</span>
                    {log.marketNameEn && (
                      <span className="text-[10px] font-normal text-neutral-500 truncate">
                        ({log.marketNameEn})
                      </span>
                    )}
                  </h4>
                  {log.details && (
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1 pl-5">
                      {log.details}
                    </p>
                  )}
                </div>

                {/* Footer: Actor & Ward Context */}
                <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-700/50 flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {log.actorName}
                    </span>
                    <span className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-1.5 py-0.2 rounded-xs font-mono text-[9px]">
                      {getRoleLabel(log.actorRole)}
                    </span>
                  </div>

                  {log.ward && (
                    <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                      <MapPin className="w-2.5 h-2.5" />
                      {log.ward}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        {onClearLogs && userRole === 'admin' && logs.length > 0 && (
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
            <span className="text-[11px] text-neutral-500 font-medium">
              {isBn ? 'সিস্টেম অ্যাডমিন অ্যাডভাইজরি' : 'Admin Audit Management'}
            </span>
            <button
              onClick={() => {
                if (window.confirm(isBn ? 'আপনি কি সকল অডিট লগ মুছে ফেলতে চান?' : 'Are you sure you want to clear all audit logs?')) {
                  onClearLogs();
                }
              }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            >
              <Trash className="w-3 h-3" />
              <span>{isBn ? 'লগ ক্লিয়ার করুন' : 'Clear Logs'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
