import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ShieldCheck,
  Lock,
  Calendar,
  User,
  History,
  AlertCircle,
  Eye,
  FileText,
  Activity
} from 'lucide-react';
import { FinanceAuditLogRecord } from '../../../types';

interface FinanceAuditLogsTabProps {
  language: 'bn' | 'en';
  auditLogs: FinanceAuditLogRecord[];
}

export const FinanceAuditLogsTab: React.FC<FinanceAuditLogsTabProps> = ({
  language,
  auditLogs
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [activeLog, setActiveLog] = useState<FinanceAuditLogRecord | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        log.logId.toLowerCase().includes(search) ||
        log.userId.toLowerCase().includes(search) ||
        log.userName.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.targetEntity.toLowerCase().includes(search) ||
        log.entityId.toLowerCase().includes(search) ||
        (log.details && log.details.toLowerCase().includes(search));

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const uniqueActions = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.action));
    return Array.from(set);
  }, [auditLogs]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isBn ? 'অপরিবর্তনীয় আর্থিক অডিট লগ ও ট্রেইল (Immutable Audit Logs)' : 'Immutable Financial Audit Trail'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'সিস্টেমের প্রতিটি অনুমোদন, পেমেন্ট, রিভার্সাল ও এডজাস্টমেন্ট স্বয়ংক্রিয়ভাবে ক্রিপ্টোগ্রাফিক টাইমস্ট্যাম্পে সংরক্ষিত।'
                : 'Every single approval, payment, reversal and balance adjustment is permanently logged with IP and user hash.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" />
          <span>{isBn ? 'লগ ট্যাম্পার-প্রুফ সুরক্ষিত' : 'Tamper-Proof Verification Active'}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'লগ আইডি, ব্যবহারকারী, অ্যাকশন বা এন্টিটি দিয়ে অনুসন্ধান...' : 'Search by Log ID, user, action or entity...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল অ্যাকশন' : 'All Actions'}</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBn ? 'লগ আইডি ও সময়' : 'Log ID & Timestamp'}</th>
                <th className="py-3.5 px-4">{isBn ? 'ব্যবহারকারী ও রোল' : 'User & Role'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অ্যাকশন (Action)' : 'Action'}</th>
                <th className="py-3.5 px-4">{isBn ? 'টার্গেট এন্টিটি ও আইডি' : 'Target Entity'}</th>
                <th className="py-3.5 px-4">{isBn ? 'আইপি এড্রেস' : 'IP Address'}</th>
                <th className="py-3.5 px-4">{isBn ? 'পরিবর্তন বিবরণ' : 'Change Details'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'ভিউ' : 'View'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {isBn ? 'কোনো অডিট লগ পাওয়া যায়নি' : 'No audit logs found'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 font-mono">{log.logId}</div>
                      <div className="text-[10px] text-slate-400">{log.dateTime}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.userId} ({log.userRole})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-300 font-medium">{log.targetEntity}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{log.entityId}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.ipAddress}
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px] text-[11px] text-slate-300">
                      <div className="truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'Success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setActiveLog(log)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'পূর্ণাঙ্গ অডিট ট্রেইল রেকর্ড' : 'Cryptographic Audit Trail Record'}
                </h3>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Log ID:</span>
                <span className="font-bold text-white font-mono">{activeLog.logId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Actor:</span>
                <span className="text-white font-semibold">
                  {activeLog.userName} ({activeLog.userId})
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Action:</span>
                <span className="font-bold text-indigo-400">{activeLog.action}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Target Entity:</span>
                <span className="text-emerald-400 font-mono">
                  {activeLog.targetEntity} : {activeLog.entityId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">Previous Value:</span>
                  <p className="font-mono text-slate-300 mt-1">{activeLog.previousValue || 'N/A'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-slate-400 block text-[10px]">New Value:</span>
                  <p className="font-mono text-emerald-400 mt-1">{activeLog.newValue || 'N/A'}</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Details:</span>
                <p className="text-slate-200 mt-1">{activeLog.details}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
