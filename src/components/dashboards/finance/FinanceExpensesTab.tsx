import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  DollarSign,
  Paperclip,
  Building2,
  AlertCircle,
  Eye,
  Check,
  Download
} from 'lucide-react';
import { FinanceExpenseRecord } from '../../../types';

interface FinanceExpensesTabProps {
  language: 'bn' | 'en';
  expenses: FinanceExpenseRecord[];
  onCreateExpense: (newExp: Partial<FinanceExpenseRecord>) => void;
  onApproveExpense: (expenseId: string) => void;
  onRejectExpense: (expenseId: string, reason: string) => void;
}

export const FinanceExpensesTab: React.FC<FinanceExpensesTabProps> = ({
  language,
  expenses,
  onCreateExpense,
  onApproveExpense,
  onRejectExpense
}) => {
  const isBn = language === 'bn';
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeExpenseItem, setActiveExpenseItem] = useState<FinanceExpenseRecord | null>(null);

  // New Expense Form State
  const [newCategory, setNewCategory] = useState('Office Expense');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('City Bank Corporate Account');
  const [newReference, setNewReference] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const categoriesList = [
    'Delivery Expense',
    'Employee Salary',
    'Office Expense',
    'Marketing Expense',
    'Advertising',
    'Technology/Server',
    'Payment Gateway Fee',
    'Refund Expense',
    'Transportation',
    'Supplier Expense',
    'Maintenance',
    'Other Expense'
  ];

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.expenseId.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        (item.reference && item.reference.toLowerCase().includes(search));

      const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const approvedExpenseAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const pendingApprovalAmount = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.status === 'Pending Approval' || e.status === 'Draft')
      .reduce((acc, e) => acc + e.amount, 0);
  }, [filteredExpenses]);

  const formatTk = (val: number) => `৳${val.toLocaleString('en-US')}`;

  const handleSubmitNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim() || !newAmount || Number(newAmount) <= 0) return;

    onCreateExpense({
      category: newCategory,
      description: newDescription.trim(),
      amount: Number(newAmount),
      paymentMethod: newPaymentMethod,
      reference: newReference.trim() || `VOUCHER-${Date.now().toString().slice(-4)}`,
      notes: newNotes.trim(),
      status: 'Pending Approval',
      submittedBy: 'usr-finance-01 (Finance Officer)',
      date: new Date().toISOString().slice(0, 10)
    });

    setIsAddModalOpen(false);
    setNewDescription('');
    setNewAmount('');
    setNewReference('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Expense KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট পরিচালন ব্যয় (Total Expenses)' : 'Total Operating Expenses'}
            </span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <h4 className="text-xl font-black text-rose-400 mt-1">{formatTk(totalExpenseAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {filteredExpenses.length} {isBn ? 'টি খরচের ভাউচার' : 'expense vouchers registered'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'অনুমোদিত ও পরিশোধিত ব্যয়' : 'Approved & Disbursed'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1">{formatTk(approvedExpenseAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'লেজার হিসাবভুক্ত ও ক্লিয়ার্ড' : 'Posted to General Ledger'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'Pending Approval'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1">{formatTk(pendingApprovalAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'মেকার-চেকার রিভিউ বাকি' : 'Maker-Checker Queue'}
          </p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'খরচের বিবরণ, ক্যাটাগরি বা ভাউচার নম্বর...' : 'Search description, category or voucher ref...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল ১২টি ক্যাটাগরি' : 'All 12 Categories'}</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল স্ট্যাটাস' : 'All Statuses'}</option>
            <option value="Approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved'}</option>
            <option value="Pending Approval">{isBn ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'Pending Approval'}</option>
            <option value="Paid">{isBn ? 'পরিশোধিত (Paid)' : 'Paid'}</option>
            <option value="Rejected">{isBn ? 'বাতিলকৃত (Rejected)' : 'Rejected'}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন খরচ ভাউচার তৈরি' : 'Create Expense Voucher'}</span>
          </button>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">{isBn ? 'ভাউচার আইডি ও তারিখ' : 'Expense ID & Date'}</th>
                <th className="py-3.5 px-4">{isBn ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-3.5 px-4">{isBn ? 'বিবরণ ও রেফারেন্স' : 'Description & Ref'}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? 'পরিমাণ (টাকা)' : 'Amount (BDT)'}</th>
                <th className="py-3.5 px-4">{isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</th>
                <th className="py-3.5 px-4">{isBn ? 'দাখিলকারী' : 'Submitted By'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                <th className="py-3.5 px-4">{isBn ? 'অনুমোদনকারী' : 'Approved By'}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    {isBn ? 'কোনো খরচের রেকর্ড পাওয়া যায়নি' : 'No expense records found'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.expenseId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100">{exp.expenseId}</div>
                      <div className="text-[11px] text-slate-400">{exp.date}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="font-medium text-slate-200 truncate" title={exp.description}>
                        {exp.description}
                      </div>
                      {exp.reference && (
                        <div className="text-[10px] text-slate-400 font-mono">Ref: {exp.reference}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-rose-400 font-mono text-sm">
                      {formatTk(exp.amount)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-[11px]">
                      {exp.paymentMethod}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 text-[11px]">
                      {exp.submittedBy}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          exp.status === 'Approved' || exp.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : exp.status === 'Rejected'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-300">
                      {exp.approvedBy || (isBn ? 'অপেক্ষমাণ' : 'Pending')}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {exp.status === 'Pending Approval' && (
                          <button
                            onClick={() => onApproveExpense(exp.expenseId)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-all flex items-center gap-1"
                            title="অনুমোদন করুন"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => setActiveExpenseItem(exp)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="ভাউচার বিবরণ দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'নতুন প্রাতিষ্ঠানিক খরচ ভাউচার এন্ট্রি' : 'New Institutional Expense Voucher Entry'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewExpense} className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'খরচের ক্যাটাগরি (১২টি অফিসিয়াল ক্যাটাগরি):' : 'Expense Category:'}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'খরচের বিস্তারিত বিবরণ:' : 'Detailed Description:'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: ঢাকা সেন্ট্রাল হাব ইন্টারনেট বিল বা অফিস জেনারেটর ডিজেল বিল...' : 'e.g., Central Hub Cloud Server hosting fee...'}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBn ? 'পরিমাণ (টাকা):' : 'Amount (BDT):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="৳ 0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBn ? 'পেমেন্ট মাধ্যম / অ্যাকাউন্ট:' : 'Payment Account:'}
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="City Bank Corporate Account">City Bank Corporate Current A/C</option>
                    <option value="bKash Business Merchant">bKash Business Merchant Master</option>
                    <option value="Central Petty Cash Vault">Central Petty Cash Vault</option>
                    <option value="BRAC Bank Escrow">BRAC Bank Escrow & Operations A/C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBn ? 'ইনভয়েস / ভাউচার রেফারেন্স:' : 'Invoice / Bill Reference:'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., BILL-90214"
                    value={newReference}
                    onChange={(e) => setNewReference(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {isBn ? 'রিসিপ্ট / ইনভয়েস ফাইল সংযুক্ত:' : 'Attach Receipt (Simulated):'}
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                    <Paperclip className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] truncate">{isBn ? 'রিসিপ্ট সংযুক্ত হয়েছে (PDF/JPG)' : 'Receipt Attached (PDF)'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  {isBn ? 'অডিট নোট (ঐচ্ছিক):' : 'Audit Note:'}
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={isBn ? 'মেকার-চেকার রিভিউ নোট বা অনুমোদনের রেফারেন্স লিখুন...' : 'Internal finance audit notes...'}
                  className="w-full h-16 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  {isBn ? 'ভাউচার সাবমিট করুন' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Detail View Modal */}
      {activeExpenseItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'খরচ ভাউচার বিবরণ' : 'Expense Voucher Audit Record'}
                </h3>
              </div>
              <button
                onClick={() => setActiveExpenseItem(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Voucher ID:</span>
                <span className="font-bold text-white font-mono">{activeExpenseItem.expenseId}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-rose-300">{activeExpenseItem.category}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Description:</span>
                <p className="font-semibold text-white mt-1">{activeExpenseItem.description}</p>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Disbursed Amount:</span>
                <span className="font-bold text-rose-400 text-sm font-mono">{formatTk(activeExpenseItem.amount)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Account:</span>
                <span className="text-slate-200">{activeExpenseItem.paymentMethod}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Status & Approval:</span>
                <span className="font-bold text-emerald-400">
                  {activeExpenseItem.status} (by {activeExpenseItem.approvedBy || 'Pending'})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveExpenseItem(null)}
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
