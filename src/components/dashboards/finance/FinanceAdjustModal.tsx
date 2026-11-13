import React, { useState } from 'react';
import {
  ShieldAlert,
  Scale,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { FinancialLedgerEntry } from '../../../types';

interface FinanceAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
  onSaveAdjustment: (adj: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    reason: string;
    reference: string;
    notes: string;
  }) => void;
}

export const FinanceAdjustModal: React.FC<FinanceAdjustModalProps> = ({
  isOpen,
  onClose,
  language,
  onSaveAdjustment
}) => {
  const isBn = language === 'bn';

  const [debitAccount, setDebitAccount] = useState('City Bank Corporate Current A/C');
  const [creditAccount, setCreditAccount] = useState('Accounts Payable (Dealers & Vendors)');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Reversal of Duplicate COD Chargeback');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const accountList = [
    'Company Cash Vault (Dhaka HQ)',
    'City Bank Corporate Current A/C',
    'bKash Business Merchant Master',
    'BRAC Bank Escrow & Operations A/C',
    'Nagad Commercial Settlement A/C',
    'Crypto Reserve Treasury',
    'Accounts Receivable (Customers/COD)',
    'Accounts Payable (Dealers & Vendors)',
    'Sales Revenue Account',
    'Operating Expense Ledger',
    'Customer Refund Adjustments'
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || debitAccount === creditAccount) return;

    onSaveAdjustment({
      debitAccount,
      creditAccount,
      amount: Number(amount),
      reason,
      reference: reference.trim() || `ADJ-VOUCHER-${Date.now().toString().slice(-4)}`,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {isBn ? 'অনুমোদিত অ্যাডজাস্টমেন্ট ও রিভার্সাল ভাউচার' : 'Authorized Adjustment & Reversal Journal Voucher'}
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">
                {isBn ? 'নীতিমালা: কোনো সরাসরি ব্যালেন্স পরিবর্তন করা যাবে না' : 'Strict Rule: No direct balance overwriting permitted'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'ডেবিট হিসাব (Debit Account - Dr):' : 'Debit Account (Dr):'}
              </label>
              <select
                value={debitAccount}
                onChange={(e) => setDebitAccount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-medium focus:outline-none focus:border-emerald-500"
              >
                {accountList.map((acc) => (
                  <option key={`dr-${acc}`} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'ক্রেডিট হিসাব (Credit Account - Cr):' : 'Credit Account (Cr):'}
              </label>
              <select
                value={creditAccount}
                onChange={(e) => setCreditAccount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-400 font-medium focus:outline-none focus:border-emerald-500"
              >
                {accountList.map((acc) => (
                  <option key={`cr-${acc}`} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'অ্যাডজাস্টমেন্ট পরিমাণ (টাকা):' : 'Adjustment Amount (BDT):'}
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="৳ 0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'পূর্বতন ট্রানজ্যাকশন / অর্ডার রেফারেন্স:' : 'Original Trx / Order Ref:'}
              </label>
              <input
                type="text"
                placeholder="e.g., TRX-98213 / ORD-7712"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {isBn ? 'অ্যাডজাস্টমেন্টের কারণ:' : 'Adjustment Reason:'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Reversal of Duplicate COD Chargeback">Reversal of Duplicate COD Chargeback</option>
              <option value="Correction of Bank Gateway Charge Discrepancy">Correction of Bank Gateway Charge Discrepancy</option>
              <option value="Dealer Commission Overpayment Adjustment">Dealer Commission Overpayment Adjustment</option>
              <option value="Damaged Goods Inventory Valuation Write-off">Damaged Goods Inventory Valuation Write-off</option>
              <option value="End of Period Ledger Balancing Reconciliation">End of Period Ledger Balancing Reconciliation</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              {isBn ? 'মেকার-চেকার অডিট নোট ও অনুমোদন রেফারেন্স:' : 'Maker-Checker Audit & Justification Notes:'}
            </label>
            <textarea
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBn ? 'অডিট ও ভেরিফিকেশন প্রমাণক বিস্তারিত ব্যাখ্যা করুন...' : 'Provide complete audit verification justification...'}
              className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-[11px] text-amber-200">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              {isBn
                ? 'এই ভাউচারটি সাবমিট হলে স্বয়ংক্রিয়ভাবে অপরিবর্তনীয় অডিট লগে নিবন্ধিত হবে এবং লেজার রানিং ব্যালেন্সে সমন্বিত হবে।'
                : 'Submitting this voucher auto-creates matched debit & credit ledger entries with full cryptographic audit trail.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={debitAccount === creditAccount}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              {isBn ? 'পোস্ট অ্যাডজাস্টমেন্ট ভাউচার' : 'Post Authorized Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
