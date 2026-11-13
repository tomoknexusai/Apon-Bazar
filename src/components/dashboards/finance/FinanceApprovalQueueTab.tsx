import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  Building,
  DollarSign,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { FinanceSettlementRecord, FinanceExpenseRecord } from '../../../types';

interface FinanceApprovalQueueTabProps {
  language: 'bn' | 'en';
  pendingSettlements: FinanceSettlementRecord[];
  pendingExpenses: FinanceExpenseRecord[];
  onApproveSettlement: (settlementId: string) => void;
  onRejectSettlement: (settlementId: string, reason: string) => void;
  onApproveExpense: (expenseId: string) => void;
  onRejectExpense: (expenseId: string, reason: string) => void;
}

export const FinanceApprovalQueueTab: React.FC<FinanceApprovalQueueTabProps> = ({
  language,
  pendingSettlements,
  pendingExpenses,
  onApproveSettlement,
  onRejectSettlement,
  onApproveExpense,
  onRejectExpense
}) => {
  const isBn = language === 'bn';
  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  const unapprovedSettlements = pendingSettlements.filter(
    (s) => s.status === 'Requested' || s.status === 'Under Review' || s.status === 'Pending Approval'
  );
  const unapprovedExpenses = pendingExpenses.filter(
    (e) => e.status === 'Pending Approval' || e.status === 'Draft'
  );

  const totalPendingQueueCount = unapprovedSettlements.length + unapprovedExpenses.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {isBn ? 'মেকার-চেকার আর্থিক অনুমোদন কিউ (Maker-Checker Approval Queue)' : 'Maker-Checker Financial Approval Queue'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'আর্থিক ঝুঁকি ও কারসাজি রোধে প্রতিটি উচ্চ-মূল্যের পেমেন্ট ও সেটেলমেন্ট ২য় স্তরের অনুমোদন আবশ্যক।'
                : 'Enforcing dual-authorization control for all major payouts, settlements, and expense disbursements.'}
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>
            {totalPendingQueueCount} {isBn ? 'টি আইটেম অপেক্ষমাণ' : 'Pending in Queue'}
          </span>
        </div>
      </div>

      {/* Grid of Pending Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Settlements Review */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'পেন্ডিং ডিলার / সেলার সেটেলমেন্ট' : 'Pending Settlements Review'}</span>
            </h4>
            <span className="text-xs text-slate-400">({unapprovedSettlements.length})</span>
          </div>

          {unapprovedSettlements.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              {isBn ? 'কোনো সেটেলমেন্ট অনুমোদনের অপেক্ষায় নেই' : 'No pending settlements in queue'}
            </div>
          ) : (
            <div className="space-y-3">
              {unapprovedSettlements.map((item) => (
                <div
                  key={item.settlementId}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{item.beneficiaryName}</span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.settlementId} • {item.beneficiaryRole}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-emerald-400 font-mono">
                        {formatTk(item.netPayableAmount)}
                      </span>
                      <p className="text-[10px] text-slate-400">{item.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px]">
                    <span className="text-slate-400">{item.requestDate}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRejectSettlement(item.settlementId, 'Rejected by Checker')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                      </button>
                      <button
                        onClick={() => onApproveSettlement(item.settlementId)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন ও পেআউট' : 'Approve & Release'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Expenses Review */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-rose-400" />
              <span>{isBn ? 'পেন্ডিং পরিচালন ব্যয় ভাউচার' : 'Pending Expense Vouchers'}</span>
            </h4>
            <span className="text-xs text-slate-400">({unapprovedExpenses.length})</span>
          </div>

          {unapprovedExpenses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              {isBn ? 'কোনো খরচ ভাউচার অনুমোদনের অপেক্ষায় নেই' : 'No pending expense vouchers in queue'}
            </div>
          ) : (
            <div className="space-y-3">
              {unapprovedExpenses.map((exp) => (
                <div
                  key={exp.expenseId}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-100 text-sm">{exp.category}</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">{exp.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-rose-400 font-mono">
                        {formatTk(exp.amount)}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">{exp.expenseId}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-[11px]">
                    <span className="text-slate-400">By: {exp.submittedBy}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRejectExpense(exp.expenseId, 'Rejected by Checker')}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                      </button>
                      <button
                        onClick={() => onApproveExpense(exp.expenseId)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন ও লেজার পোস্ট' : 'Approve & Post'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
