import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  UserCheck,
  Building2,
  DollarSign,
  AlertCircle,
  Truck,
  FileCheck,
  Send,
  Smartphone,
  Eye,
  Check,
  Building,
  Calendar,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Printer,
  Download,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { FinanceSettlementRecord, DeliveryCollectionRecord } from '../../../types';

interface FinanceSettlementsTabProps {
  language: 'bn' | 'en';
  settlements: FinanceSettlementRecord[];
  collections?: DeliveryCollectionRecord[];
  onApproveSettlement: (settlementId: string) => void;
  onReleaseSettlement: (settlementId: string) => void;
  onRejectSettlement?: (settlementId: string, reason: string) => void;
  onReconcileSettlement?: (settlementId: string) => void;
  onRecordDeliveryCollection?: (record: DeliveryCollectionRecord) => void;
}

export const FinanceSettlementsTab: React.FC<FinanceSettlementsTabProps> = ({
  language,
  settlements,
  collections: initialCollections,
  onApproveSettlement,
  onReleaseSettlement,
  onRejectSettlement,
  onReconcileSettlement,
  onRecordDeliveryCollection
}) => {
  const isBn = language === 'bn';
  const [activeSubTab, setActiveSubTab] = useState<'collections' | 'settlements'>('collections');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<FinanceSettlementRecord | null>(null);
  const [activeCollectionItem, setActiveCollectionItem] = useState<DeliveryCollectionRecord | null>(null);

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<FinanceSettlementRecord | DeliveryCollectionRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Interactive Buying Code & Money Receipt Simulation Modal
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [simBuyingCode, setSimBuyingCode] = useState('BC-9042');
  const [simOrderId, setSimOrderId] = useState('ORD-89220');
  const [simCustomerId, setSimCustomerId] = useState('CUST-3098');
  const [simCustomerName, setSimCustomerName] = useState('আরিফুল ইসলাম');
  const [simDeliveryManId, setSimDeliveryManId] = useState('RDR-114 (হাসান জামিল)');
  const [simAmount, setSimAmount] = useState('2850');
  const [simPaymentMethod, setSimPaymentMethod] = useState<'Cash on Delivery' | 'bKash' | 'Nagad'>('Cash on Delivery');
  const [simStep, setSimStep] = useState<number>(1);
  const [isSimSuccess, setIsSimSuccess] = useState(false);

  // Delivery Collections Initial / Live State
  const [deliveryCollections, setDeliveryCollections] = useState<DeliveryCollectionRecord[]>(
    initialCollections && initialCollections.length > 0
      ? initialCollections
      : [
          {
            orderId: 'ORD-89214',
            customerId: 'CUST-3091',
            customerName: 'রাফসান আহমেদ',
            deliveryManId: 'RDR-114',
            deliveryManName: 'হাসান জামিল (ধানমন্ডি জোন)',
            deliveryManPhone: '01711-889901',
            district: 'ঢাকা',
            upazila: 'ধানমন্ডি',
            collectionAmount: 4870,
            paymentMethod: 'bKash',
            moneyReceiptStatus: 'confirmed_by_customer',
            collectionDate: '2026-08-28 10:14:22',
            settlementStatus: 'Settled',
            settlementDate: '2026-08-28',
            approvedBy: 'usr-finance-01 (Auto)',
            receiptNumber: 'MR-2026-0891',
            buyingCode: 'BC-8891'
          },
          {
            orderId: 'ORD-89215',
            customerId: 'CUST-3092',
            customerName: 'তানজিলা বেগম',
            deliveryManId: 'RDR-118',
            deliveryManName: 'তারেক রহমান (মিরপুর জোন)',
            deliveryManPhone: '01812-778899',
            district: 'ঢাকা',
            upazila: 'মিরপুর',
            collectionAmount: 3400,
            paymentMethod: 'Cash on Delivery',
            moneyReceiptStatus: 'confirmed_by_customer',
            collectionDate: '2026-08-28 12:45:00',
            settlementStatus: 'Approved',
            settlementDate: '2026-08-28',
            approvedBy: 'usr-ops-dhaka-01',
            receiptNumber: 'MR-2026-0892',
            buyingCode: 'BC-7721'
          },
          {
            orderId: 'ORD-89218',
            customerId: 'CUST-3095',
            customerName: 'সাইফুল ইসলাম',
            deliveryManId: 'RDR-122',
            deliveryManName: 'নুরুল হুদা (উত্তরা জোন)',
            deliveryManPhone: '01923-445566',
            district: 'ঢাকা',
            upazila: 'উত্তরা',
            collectionAmount: 8960,
            paymentMethod: 'Cash on Delivery',
            moneyReceiptStatus: 'issued',
            collectionDate: '2026-08-28 15:30:10',
            settlementStatus: 'Under Review',
            receiptNumber: 'MR-2026-0893',
            buyingCode: 'BC-9904'
          },
          {
            orderId: 'ORD-89219',
            customerId: 'CUST-3096',
            customerName: 'সেলিনা আক্তার',
            deliveryManId: 'RDR-114',
            deliveryManName: 'হাসান জামিল',
            deliveryManPhone: '01711-889901',
            district: 'ঢাকা',
            upazila: 'মোহাম্মদপুর',
            collectionAmount: 1850,
            paymentMethod: 'Cash on Delivery',
            moneyReceiptStatus: 'issued',
            collectionDate: '2026-08-28 16:10:00',
            settlementStatus: 'Pending',
            receiptNumber: 'MR-2026-0894',
            buyingCode: 'BC-4412'
          }
        ]
  );

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return deliveryCollections.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        c.orderId.toLowerCase().includes(search) ||
        c.customerId.toLowerCase().includes(search) ||
        (c.customerName || '').toLowerCase().includes(search) ||
        c.deliveryManId.toLowerCase().includes(search) ||
        c.deliveryManName.toLowerCase().includes(search) ||
        (c.receiptNumber || '').toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || c.settlementStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [deliveryCollections, searchTerm, statusFilter]);

  // Filtered Settlements
  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.settlementId.toLowerCase().includes(search) ||
        item.beneficiaryId.toLowerCase().includes(search) ||
        item.beneficiaryName.toLowerCase().includes(search) ||
        item.beneficiaryRole.toLowerCase().includes(search);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [settlements, searchTerm, statusFilter]);

  // KPI Calculations
  const totalCollectionsVolume = useMemo(() => {
    return deliveryCollections.reduce((acc, c) => acc + c.collectionAmount, 0);
  }, [deliveryCollections]);

  const totalPendingSettlementAmount = useMemo(() => {
    return deliveryCollections
      .filter((c) => c.settlementStatus === 'Pending' || c.settlementStatus === 'Under Review')
      .reduce((acc, c) => acc + c.collectionAmount, 0);
  }, [deliveryCollections]);

  const totalApprovedSettlementAmount = useMemo(() => {
    return deliveryCollections
      .filter((c) => c.settlementStatus === 'Approved')
      .reduce((acc, c) => acc + c.collectionAmount, 0);
  }, [deliveryCollections]);

  const totalPaidReconciledAmount = useMemo(() => {
    return deliveryCollections
      .filter((c) => c.settlementStatus === 'Paid' || c.settlementStatus === 'Reconciled' || c.settlementStatus === 'Settled')
      .reduce((acc, c) => acc + c.collectionAmount, 0);
  }, [deliveryCollections]);

  const formatTk = (val: number) => `৳${(val || 0).toLocaleString('en-US')}`;

  // Execute Buying Code & Money Receipt generation
  const handleGenerateMoneyReceipt = () => {
    const newRecord: DeliveryCollectionRecord = {
      orderId: simOrderId,
      customerId: simCustomerId,
      customerName: simCustomerName,
      deliveryManId: simDeliveryManId.split(' ')[0],
      deliveryManName: simDeliveryManId,
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      collectionAmount: parseFloat(simAmount) || 0,
      paymentMethod: simPaymentMethod,
      moneyReceiptStatus: 'confirmed_by_customer',
      collectionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
      settlementStatus: 'Pending',
      receiptNumber: `MR-2026-08${Math.floor(Math.random() * 90 + 10)}`,
      buyingCode: simBuyingCode
    };

    setDeliveryCollections((prev) => [newRecord, ...prev]);
    if (onRecordDeliveryCollection) {
      onRecordDeliveryCollection(newRecord);
    }
    setIsSimSuccess(true);
  };

  // Reconcile Action
  const handleLocalReconcile = (orderId: string) => {
    setDeliveryCollections((prev) =>
      prev.map((c) =>
        c.orderId === orderId
          ? { ...c, settlementStatus: 'Reconciled', settlementDate: '2026-08-28', approvedBy: 'usr-finance-01' }
          : c
      )
    );
  };

  // Approve Collection
  const handleLocalApprove = (orderId: string) => {
    setDeliveryCollections((prev) =>
      prev.map((c) =>
        c.orderId === orderId
          ? { ...c, settlementStatus: 'Approved', approvedBy: 'usr-finance-01' }
          : c
      )
    );
  };

  // Pay/Disburse Collection
  const handleLocalPay = (orderId: string) => {
    setDeliveryCollections((prev) =>
      prev.map((c) =>
        c.orderId === orderId
          ? { ...c, settlementStatus: 'Paid', settlementDate: '2026-08-28', approvedBy: 'usr-finance-01' }
          : c
      )
    );
  };

  // Handle Rejection
  const handleConfirmReject = () => {
    if (!rejectItem) return;
    if ('orderId' in rejectItem) {
      setDeliveryCollections((prev) =>
        prev.map((c) =>
          c.orderId === (rejectItem as DeliveryCollectionRecord).orderId
            ? { ...c, settlementStatus: 'Rejected', notes: rejectionReason }
            : c
        )
      );
    } else if ('settlementId' in rejectItem && onRejectSettlement) {
      onRejectSettlement((rejectItem as FinanceSettlementRecord).settlementId, rejectionReason);
    }
    setRejectItem(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Transaction Lifecycle Visualizer (AANO BAZAR 6-Step Delivery Protocol) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {isBn ? 'ডেলিভারি ম্যান কালেকশন ও ফিন্যান্স সেটেলমেন্ট প্রোটোকল' : 'Delivery Man Collection & Settlement Protocol'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn
                  ? 'বাইং কোড ভেরিফিকেশন ➔ পণ্য যাচাই ➔ অর্থ প্রদান ➔ মানি রিসিট ইস্যু ➔ কাস্টমার কনফার্মেশন ➔ ফিন্যান্সে পেন্ডিং সেটেলমেন্ট'
                  : 'Buying Code Check ➔ Product Verified ➔ Cash/MFS Handover ➔ Money Receipt Click ➔ SMS Confirmation ➔ Finance Queue'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsReceiptModalOpen(true);
              setSimStep(1);
              setIsSimSuccess(false);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isBn ? 'বাইং কোড ও মানি রিসিট সিমুলেটর' : 'Verify Buying Code & Issue Receipt'}</span>
          </button>
        </div>

        {/* 6 Step Flow Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block font-mono">১. BUYING CODE</span>
            <span className="text-[10px] text-slate-300">কোড ভেরিফিকেশন</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-cyan-400 block font-mono">২. PRODUCT CHECK</span>
            <span className="text-[10px] text-slate-300">গ্রাহক যাচাই</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-amber-400 block font-mono">৩. PAYMENT</span>
            <span className="text-[10px] text-slate-300">রাইডারকে টাকা প্রদান</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-purple-400 block font-mono">৪. MONEY RECEIPT</span>
            <span className="text-[10px] text-slate-300">রিসিট ক্লিক</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-center">
            <span className="text-[10px] font-bold text-emerald-300 block font-mono">৫. CONFIRMATION</span>
            <span className="text-[10px] text-slate-300">গ্রাহকের কাছে SMS</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block font-mono">৬. FINANCE QUEUE</span>
            <span className="text-[10px] text-emerald-200">পেন্ডিং সেটেলমেন্ট</span>
          </div>
        </div>
      </div>

      {/* Top Collection KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {isBn ? 'মোট সংগৃহীত ডেলিভারি অর্থ' : 'Total Collection Amount'}
            </span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-white mt-1.5">{formatTk(totalCollectionsVolume)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {deliveryCollections.length} {isBn ? 'টি মানি রিসিট ইস্যু করা হয়েছে' : 'money receipts registered'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300">
              {isBn ? 'পেন্ডিং সেটেলমেন্ট (Pending)' : 'Pending Settlement Queue'}
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <h4 className="text-xl font-black text-amber-400 mt-1.5">{formatTk(totalPendingSettlementAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'রাইডারের হাতে ও রিভিউতে আছে' : 'In rider vault or under review'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-300">
              {isBn ? 'অনুমোদিত সেটেলমেন্ট (Approved)' : 'Approved Settlements'}
            </span>
            <Check className="w-4 h-4 text-cyan-400" />
          </div>
          <h4 className="text-xl font-black text-cyan-400 mt-1.5">{formatTk(totalApprovedSettlementAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'ফান্ড রিলিজের জন্য প্রস্তুত' : 'Ready for payment release'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300">
              {isBn ? 'পরিশোধিত ও রিকনসাইল্ড' : 'Paid & Reconciled'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h4 className="text-xl font-black text-emerald-400 mt-1.5">{formatTk(totalPaidReconciledAmount)}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {isBn ? 'ব্যাংক স্টেটমেন্টের সাথে ম্যাচড' : 'Audited & reconciled in ledger'}
          </p>
        </div>
      </div>

      {/* Sub Tab Switcher & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('collections')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'collections'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{isBn ? 'ডেলিভারি ম্যান কালেকশন ও মানি রিসিট' : 'Delivery Collections & Receipts'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settlements')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'settlements'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{isBn ? 'মেকার-চেকার সেটেলমেন্ট কিউ' : 'Maker-Checker Queue'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? 'অর্ডার ID, গ্রাহক ID, রাইডার ID বা রিসিট নং...' : 'Search Order, Customer, Rider ID or Receipt...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{isBn ? 'সকল সেটেলমেন্ট স্ট্যাটাস' : 'All Settlement Statuses'}</option>
            <option value="Pending">Pending (পেন্ডিং)</option>
            <option value="Under Review">Under Review (রিভিউতে)</option>
            <option value="Approved">Approved (অনুমোদিত)</option>
            <option value="Paid">Paid (পরিশোধিত)</option>
            <option value="Reconciled">Reconciled (রিকনসাইল্ড)</option>
            <option value="Rejected">Rejected (বাতিলকৃত)</option>
          </select>
        </div>
      </div>

      {/* SUB TAB 1: DELIVERY MAN COLLECTIONS & MONEY RECEIPTS */}
      {activeSubTab === 'collections' && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">{isBn ? 'অর্ডার ও বাইং কোড' : 'Order & Buying Code'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'গ্রাহক আইডি' : 'Customer ID & Name'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'ডেলিভারি ম্যান আইডি' : 'Delivery Man ID & Zone'}</th>
                  <th className="py-3 px-3 text-right">{isBn ? 'কালেকশন অর্থ' : 'Collection Amount'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'মানি রিসিট স্ট্যাটাস' : 'Money Receipt Status'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'কালেকশন তারিখ' : 'Collection Date'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'সেটেলমেন্ট স্ট্যাটাস' : 'Settlement Status'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'সেটেলমেন্ট তারিখ ও অনুমোদন' : 'Settlement Date & Approver'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'অ্যাকশন' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500">
                      {isBn ? 'কোনো ডেলিভারি কালেকশন রেকর্ড পাওয়া যায়নি' : 'No delivery collection records found'}
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((col) => (
                    <tr key={col.orderId} className="hover:bg-slate-800/40 transition-colors">
                      {/* 1. Order ID & Buying Code */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-100 font-mono">{col.orderId}</div>
                        {col.buyingCode && (
                          <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <KeyRound className="w-3 h-3" />
                            <span>Code: {col.buyingCode}</span>
                          </div>
                        )}
                      </td>

                      {/* 2. Customer ID */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-200">{col.customerName || col.customerId}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{col.customerId}</div>
                      </td>

                      {/* 3. Delivery Man ID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{col.deliveryManName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{col.deliveryManId}</div>
                      </td>

                      {/* 4. Collection Amount */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-400 font-mono text-sm">
                        {formatTk(col.collectionAmount)}
                      </td>

                      {/* 5. Payment Method */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {col.paymentMethod}
                        </span>
                      </td>

                      {/* 6. Money Receipt Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              col.moneyReceiptStatus === 'confirmed_by_customer' || col.moneyReceiptStatus === 'confirmed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : col.moneyReceiptStatus === 'issued'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {col.moneyReceiptStatus === 'confirmed_by_customer'
                              ? 'Confirmed (Money Received)'
                              : col.moneyReceiptStatus === 'issued'
                              ? 'Issued by Rider'
                              : 'Pending Receipt'}
                          </span>
                        </div>
                        {col.receiptNumber && (
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{col.receiptNumber}</div>
                        )}
                      </td>

                      {/* 7. Collection Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-slate-300">
                        {col.collectionDate}
                      </td>

                      {/* 8. Settlement Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            col.settlementStatus === 'Reconciled' || col.settlementStatus === 'Settled'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : col.settlementStatus === 'Paid'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                              : col.settlementStatus === 'Approved'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : col.settlementStatus === 'Under Review'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : col.settlementStatus === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {col.settlementStatus}
                        </span>
                      </td>

                      {/* 9 & 10. Settlement Date & Approved By */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-slate-300">
                        <div>{col.settlementDate || (isBn ? 'অপেক্ষমাণ' : 'Pending Date')}</div>
                        <div className="text-[10px] text-slate-400">Appr: {col.approvedBy || 'Pending'}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {col.settlementStatus === 'Pending' ? (
                            <button
                              onClick={() => handleLocalApprove(col.orderId)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] border border-cyan-500/40 flex items-center gap-1 transition-all"
                              title="কালেকশন অনুমোদন করুন"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                            </button>
                          ) : col.settlementStatus === 'Approved' ? (
                            <button
                              onClick={() => handleLocalPay(col.orderId)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm flex items-center gap-1 transition-all"
                              title="ট্রেজারি সেটেলমেন্ট রিলিজ করুন"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isBn ? 'পরিশোধ' : 'Pay'}</span>
                            </button>
                          ) : col.settlementStatus === 'Paid' ? (
                            <button
                              onClick={() => handleLocalReconcile(col.orderId)}
                              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] border border-slate-700 flex items-center gap-1 transition-all"
                              title="ব্যাংক ও লেজারের সাথে রিকনসাইল করুন"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{isBn ? 'রিকনসাইল' : 'Reconcile'}</span>
                            </button>
                          ) : (
                            <span className="p-1 text-emerald-400" title="সেটেলমেন্ট সম্পন্ন">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}

                          <button
                            onClick={() => setActiveCollectionItem(col)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {col.settlementStatus !== 'Rejected' && col.settlementStatus !== 'Reconciled' && (
                            <button
                              onClick={() => setRejectItem(col)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                              title="রিজেক্ট করুন"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB TAB 2: STAKEHOLDER SETTLEMENT DISBURSEMENTS */}
      {activeSubTab === 'settlements' && (
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">{isBn ? 'সেটেলমেন্ট আইডি ও তারিখ' : 'Settlement ID & Date'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'সুবিধাভোগী ও পদবী' : 'Beneficiary & Role'}</th>
                  <th className="py-3 px-3 text-right">{isBn ? 'গ্রস অর্থ' : 'Gross Amount'}</th>
                  <th className="py-3 px-3 text-right text-rose-400">{isBn ? 'কর্তন / ফি' : 'Deductions'}</th>
                  <th className="py-3 px-3.5 text-right text-emerald-400">{isBn ? 'নিট প্রদেয় অর্থ' : 'Net Payable'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'পেমেন্ট মেথড' : 'Payment Method'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                  <th className="py-3 px-3.5">{isBn ? 'অনুমোদনকারী' : 'Approvals'}</th>
                  <th className="py-3 px-3 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      {isBn ? 'কোনো সেটেলমেন্ট রেকর্ড পাওয়া যায়নি' : 'No settlement records found'}
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map((item) => (
                    <tr key={item.settlementId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-100 font-mono">{item.settlementId}</div>
                        <div className="text-[10px] text-slate-400">{item.requestDate}</div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-200">{item.beneficiaryName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.beneficiaryId} ({item.beneficiaryRole})
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap text-slate-300">
                        {formatTk(item.grossSalesAmount)}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap text-rose-400 font-mono">
                        -{formatTk(item.deductions + (item.platformFee || 0) + (item.taxDeducted || 0))}
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-bold text-emerald-400 font-mono text-sm">
                        {formatTk(item.netPayableAmount)}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-slate-300">
                        <div>{item.paymentMethod}</div>
                        {item.paymentReference && (
                          <div className="text-[10px] text-slate-400 font-mono">Ref: {item.paymentReference}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Settled' || item.status === 'Paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : item.status === 'Approved'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : item.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap text-[11px] text-slate-300">
                        {item.approvedBy || (isBn ? 'মেকার রিভিউ বাকি' : 'Pending')}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {item.status === 'Requested' || item.status === 'Under Review' || item.status === 'Pending' ? (
                            <button
                              onClick={() => onApproveSettlement(item.settlementId)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold border border-cyan-500/40 transition-all flex items-center gap-1"
                              title="অনুমোদন করুন"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                            </button>
                          ) : item.status === 'Approved' ? (
                            <button
                              onClick={() => onReleaseSettlement(item.settlementId)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
                              title="ট্রেজারি পেআউট রিলিজ করুন"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isBn ? 'রিলিজ' : 'Release'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-semibold">{isBn ? 'পরিশোধিত' : 'Settled'}</span>
                          )}

                          <button
                            onClick={() => setActiveItem(item)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {item.status !== 'Settled' && item.status !== 'Rejected' && (
                            <button
                              onClick={() => setRejectItem(item)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                              title="রিজেক্ট করুন"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interactive Buying Code & Money Receipt Simulation Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'ডেলিভারি ম্যান লেনদেন ও মানি রিসিট প্রদান' : 'Delivery Handover & Money Receipt Flow'}
                </h3>
              </div>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {!isSimSuccess ? (
              <div className="space-y-4 text-xs text-slate-300">
                {/* 6 Step Progress bar */}
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>
                      {simStep === 1
                        ? 'ধাপ ১: গ্রাহকের বাইং কোড (Buying Code) যাচাই'
                        : simStep === 2
                        ? 'ধাপ ২: পণ্য ডেলিভারি ও অর্থ গ্রহণ'
                        : 'ধাপ ৩: মানি রিসিট (Money Receipt) ইস্যু'}
                    </span>
                    <span className="text-emerald-400 font-mono">Step {simStep} / 3</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${(simStep / 3) * 100}%` }}
                    />
                  </div>
                </div>

                {simStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        {isBn ? 'গ্রাহকের অনন্য বাইং কোড (Buying Code):' : "Customer's Buying Code:"}
                      </label>
                      <input
                        type="text"
                        value={simBuyingCode}
                        onChange={(e) => setSimBuyingCode(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                        placeholder="BC-XXXX"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {isBn
                          ? 'ডেলিভারি ম্যান গ্রাহকের অ্যাপ বা SMS হতে বাইং কোড ইনপুট দেন।'
                          : 'Rider inputs the OTP Buying Code received by customer to authenticate delivery.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                      <div>
                        <span className="text-slate-400">Order ID:</span>
                        <p className="font-bold text-white font-mono">{simOrderId}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Customer:</span>
                        <p className="font-semibold text-slate-200">{simCustomerName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {simStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-emerald-400" />
                      {isBn
                        ? 'বাইং কোড সঠিক হয়েছে। গ্রাহক পণ্য চেক ও গ্রহণ করেছেন।'
                        : 'Buying Code verified. Customer inspected and accepted goods.'}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          {isBn ? 'সংগৃহীত অর্থ (টাকা):' : 'Collected Amount (Tk):'}
                        </label>
                        <input
                          type="number"
                          value={simAmount}
                          onChange={(e) => setSimAmount(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          {isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}
                        </label>
                        <select
                          value={simPaymentMethod}
                          onChange={(e) => setSimPaymentMethod(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Cash on Delivery">Cash on Delivery (ক্যাশ)</option>
                          <option value="bKash">bKash (বিকাশ)</option>
                          <option value="Nagad">Nagad (নগদ)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        {isBn ? 'ডেলিভারি ম্যান:' : 'Delivery Rider ID & Name:'}
                      </label>
                      <input
                        type="text"
                        value={simDeliveryManId}
                        onChange={(e) => setSimDeliveryManId(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {simStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200 space-y-1.5">
                      <h5 className="font-bold text-sm text-purple-300">
                        {isBn ? 'মানি রিসিট (Money Receipt) জেনারেশন' : 'Generate Official Money Receipt'}
                      </h5>
                      <p className="text-[11px] text-purple-300/80">
                        {isBn
                          ? 'ডেলিভারি ম্যান "MONEY RECEIPT" চাপলে গ্রাহক তার মোবাইলে "Money Received" কনফার্মেশন পাবেন এবং ফিন্যান্সে পেন্ডিং সেটেলমেন্ট হিসেবে রেকর্ড হবে।'
                          : 'Clicking Money Receipt triggers instant customer SMS confirmation and queues this collection in Finance as Pending Settlement.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Buying Code:</span>
                        <span className="text-emerald-400 font-bold">{simBuyingCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order ID:</span>
                        <span className="text-white">{simOrderId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer ID:</span>
                        <span className="text-slate-300">{simCustomerId} ({simCustomerName})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment:</span>
                        <span className="text-cyan-400">{simPaymentMethod}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-1.5 text-sm font-bold text-emerald-400">
                        <span>Total Collection Amount:</span>
                        <span>৳{simAmount}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  {simStep > 1 ? (
                    <button
                      onClick={() => setSimStep((s) => s - 1)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      {isBn ? 'পূর্ববর্তী' : 'Back'}
                    </button>
                  ) : (
                    <div />
                  )}

                  {simStep < 3 ? (
                    <button
                      onClick={() => setSimStep((s) => s + 1)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1"
                    >
                      <span>{isBn ? 'পরবর্তী ধাপ' : 'Next Step'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateMoneyReceipt}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>{isBn ? 'মানি রিসিট ইস্যু করুন (MONEY RECEIPT)' : 'Issue MONEY RECEIPT'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {isBn ? 'মানি রিসিট সফলভাবে ইস্যু ও রেকর্ড হয়েছে!' : 'Money Receipt Successfully Issued!'}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                    {isBn
                      ? 'গ্রাহক "Money Received" কনফার্মেশন পেয়েছেন এবং সংগৃহীত অর্থ ফিন্যান্সে "Pending Settlement" হিসেবে অন্তর্ভুক্ত হয়েছে।'
                      : 'Customer received "Money Received" confirmation. The collected ৳' + simAmount + ' is now queued in Finance as Pending Settlement.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsReceiptModalOpen(false);
                      setIsSimSuccess(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                  >
                    {isBn ? 'ড্যাশবোর্ডে দেখুন' : 'View in Dashboard'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collection Item Details Modal */}
      {activeCollectionItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {isBn ? 'ডেলিভারি কালেকশন ও রিসিট ভাউচার' : 'Delivery Collection Voucher'}
                </h3>
              </div>
              <button
                onClick={() => setActiveCollectionItem(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-bold text-white font-mono">{activeCollectionItem.orderId}</span>
              </div>
              {activeCollectionItem.buyingCode && (
                <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                  <span className="text-slate-400">Verified Buying Code:</span>
                  <span className="font-bold text-emerald-400 font-mono">{activeCollectionItem.buyingCode}</span>
                </div>
              )}
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-semibold">{activeCollectionItem.customerName} ({activeCollectionItem.customerId})</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Delivery Rider:</span>
                <span className="text-cyan-300 font-semibold">{activeCollectionItem.deliveryManName}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Payment Method:</span>
                <span className="text-slate-200">{activeCollectionItem.paymentMethod}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 font-bold text-emerald-400">
                <span>Collection Amount:</span>
                <span className="font-mono text-sm">{formatTk(activeCollectionItem.collectionAmount)}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Money Receipt Status:</span>
                <span className="text-emerald-400 uppercase font-bold">{activeCollectionItem.moneyReceiptStatus}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-800/60">
                <span className="text-slate-400">Settlement Status:</span>
                <span className="text-cyan-400 font-bold">{activeCollectionItem.settlementStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
              </button>
              <button
                onClick={() => setActiveCollectionItem(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 pb-2 border-b border-slate-800">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                {isBn ? 'সেটেলমেন্ট বাতিলকরণ (Reject Settlement)' : 'Reject Settlement Request'}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {isBn
                ? 'অনুগ্রহ করে সেটেলমেন্ট প্রত্যাখ্যানের কারণ উল্লেখ করুন। এটি অডিট ট্রেইলে সংরক্ষিত হবে।'
                : 'Please state the reason for rejecting this settlement. This will be recorded in the audit trail.'}
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={isBn ? 'কারণ লিখুন (যেমন: ডিসক্রিপেন্সি, ব্যাংকিং তথ্যে অসঙ্গতি)...' : 'Reason for rejection (e.g. Ledger mismatch)...'}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectItem(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {isBn ? 'ফিরে যান' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {isBn ? 'প্রত্যাখ্যান নিশ্চিত করুন' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
