/**
 * Finance & Accounts Dashboard Component
 * Project: Apon Bazar / ঘরের বাজার বিডি
 *
 * Enterprise Financial Operations, General Ledger, Maker-Checker Approvals,
 * Multi-Gateway Settlement, VAT/Tax Compliance, Profit & Loss and Corporate Treasury.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { SuperAdminRoleDropdown } from '../admin/SuperAdminRoleDropdown';
import { getFinancialAccessLevel, getRoleVisibleName, normalizeUserRole } from '../../lib/rbac';
import {
  FinancialLedgerEntry,
  FinanceSaleRecord,
  FinancePaymentRecord,
  FinanceSettlementRecord,
  FinanceCommissionRecord,
  FinanceExpenseRecord,
  FinanceReceivableRecord,
  FinancePayableRecord,
  FinanceRefundRecord,
  BankAccountRecord,
  BankReconciliationItem,
  FinanceAuditLogRecord,
  UserRole,
  FinancialDateFilter
} from '../../types';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Building,
  Coins,
  DollarSign,
  Scale,
  BookOpen,
  ArrowRightLeft,
  RotateCcw,
  Building2,
  CheckCircle2,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Download,
  Printer,
  ChevronRight,
  Menu,
  X,
  Lock,
  Eye,
  AlertTriangle,
  User,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sub-components
import { FinanceOverviewTab } from './finance/FinanceOverviewTab';
import { FinanceSalesRevenueTab } from './finance/FinanceSalesRevenueTab';
import { FinancePaymentsTab } from './finance/FinancePaymentsTab';
import { FinanceSettlementsTab } from './finance/FinanceSettlementsTab';
import { FinanceCommissionsTab } from './finance/FinanceCommissionsTab';
import { FinanceExpensesTab } from './finance/FinanceExpensesTab';
import { FinanceProfitLossTab } from './finance/FinanceProfitLossTab';
import { FinanceLedgerTab } from './finance/FinanceLedgerTab';
import { FinanceReceivablesPayablesTab } from './finance/FinanceReceivablesPayablesTab';
import { FinanceRefundsTab } from './finance/FinanceRefundsTab';
import { FinanceAccountsTab } from './finance/FinanceAccountsTab';
import { FinanceReconciliationTab } from './finance/FinanceReconciliationTab';
import { FinanceCashFlowTab } from './finance/FinanceCashFlowTab';
import { FinanceReportsTab } from './finance/FinanceReportsTab';
import { FinanceAuditLogsTab } from './finance/FinanceAuditLogsTab';
import { FinanceApprovalQueueTab } from './finance/FinanceApprovalQueueTab';
import { FinanceAdjustModal } from './finance/FinanceAdjustModal';

export const FinanceDashboard: React.FC = () => {
  const { currentUser, allUsers } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  type FinanceTabKey =
    | 'overview'
    | 'sales_revenue'
    | 'payments'
    | 'settlements'
    | 'commissions'
    | 'expenses'
    | 'profit_loss'
    | 'ledger'
    | 'receivables_payables'
    | 'refunds'
    | 'accounts'
    | 'reconciliation'
    | 'cash_flow'
    | 'reports'
    | 'audit_logs'
    | 'approval_queue';

  const [activeTab, setActiveTab] = useState<FinanceTabKey>('overview');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('this_month');
  const [customStartDate, setCustomStartDate] = useState('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState('2026-08-31');

  // Role Access & Multi-Tier RBAC Scoping
  const [simulatedRole, setSimulatedRole] = useState<UserRole | null>(null);
  const effectiveRole: UserRole = simulatedRole || normalizeUserRole(currentUser?.primaryRole || currentUser?.role) || 'finance';
  const accessControl = useMemo(() => getFinancialAccessLevel(effectiveRole), [effectiveRole]);

  const handleVerifyPayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.paymentId === paymentId ? { ...p, status: 'Captured', paymentStatus: 'Received' } : p))
    );
    showToast(isBn ? 'পেমেন্ট সফলভাবে ভেরিফাই ও ক্যাপচার করা হয়েছে!' : 'Payment verified and captured!');
  };

  // ----------------------------------------------------
  // Initial Mock State with Enterprise Integrity
  // ----------------------------------------------------

  // 1. Sales & Revenue Master Records (Realized vs Unrealized Orders)
  const [sales, setSales] = useState<FinanceSaleRecord[]>([
    {
      orderId: 'ORD-89214',
      orderDate: '2026-08-28',
      date: '2026-08-28',
      customerId: 'CUST-3091',
      customerName: 'রাফসান আহমেদ',
      sellerOrDealerId: 'DLR-901 (সততা এগ্রো)',
      product: 'প্রিমিয়াম অর্গানিক বাটার ঘি ও মধু কম্বো',
      quantity: 2,
      mrp: 5000,
      discount: 200,
      finalSaleAmount: 4800,
      deliveryCost: 120,
      tax: 150,
      cashback: 50,
      paymentMethod: 'bKash',
      paymentStatus: 'Received',
      orderStatus: 'delivered',
      cogs: 2900,
      netCommission: 580
    },
    {
      orderId: 'ORD-89215',
      orderDate: '2026-08-28',
      date: '2026-08-28',
      customerId: 'CUST-3092',
      customerName: 'তানজিলা বেগম',
      sellerOrDealerId: 'DLR-902 (গ্রিন ভ্যালি ডেইরি)',
      product: 'খাঁটি সরিষার তেল ও কালোজিরা মধু',
      quantity: 3,
      mrp: 3400,
      discount: 0,
      finalSaleAmount: 3400,
      deliveryCost: 100,
      tax: 100,
      cashback: 30,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Received',
      orderStatus: 'delivered',
      cogs: 1950,
      netCommission: 410
    },
    {
      orderId: 'ORD-89216',
      orderDate: '2026-08-28',
      date: '2026-08-28',
      customerId: 'CUST-3093',
      customerName: 'মাহমুদুল হক',
      sellerOrDealerId: 'DLR-901 (সততা এগ্রো)',
      product: 'ন্যাচারাল ড্রাইড ফ্রুটস ও বাদাম বক্স (বড়)',
      quantity: 5,
      mrp: 13000,
      discount: 500,
      finalSaleAmount: 12500,
      deliveryCost: 250,
      tax: 380,
      cashback: 100,
      paymentMethod: 'Bank',
      paymentStatus: 'Received',
      orderStatus: 'delivered',
      cogs: 7500,
      netCommission: 1520
    },
    {
      orderId: 'ORD-89217',
      orderDate: '2026-08-27',
      date: '2026-08-27',
      customerId: 'CUST-3094',
      customerName: 'ফারহানা ইসলাম',
      sellerOrDealerId: 'DLR-904 (ন্যাচারাল ডিলার)',
      product: 'সুন্দরবনের খাঁটি মধু ও চিয়াসীডস প্যাক',
      quantity: 4,
      mrp: 6700,
      discount: 300,
      finalSaleAmount: 6400,
      deliveryCost: 150,
      tax: 200,
      cashback: 60,
      paymentMethod: 'Nagad',
      paymentStatus: 'Received',
      orderStatus: 'delivered',
      cogs: 3850,
      netCommission: 780
    },
    {
      orderId: 'ORD-89218',
      orderDate: '2026-08-27',
      date: '2026-08-27',
      customerId: 'CUST-3095',
      customerName: 'সাইফুল ইসলাম',
      sellerOrDealerId: 'DLR-901 (সততা এগ্রো)',
      product: 'অর্গানিক কাটারিভোগ চাল (২৫ কেজি বস্তা)',
      quantity: 2,
      mrp: 9300,
      discount: 400,
      finalSaleAmount: 8900,
      deliveryCost: 180,
      tax: 280,
      cashback: 80,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Processing',
      orderStatus: 'processing',
      cogs: 5350,
      netCommission: 1080
    },
    {
      orderId: 'ORD-89219',
      orderDate: '2026-08-26',
      date: '2026-08-26',
      customerId: 'CUST-3096',
      customerName: 'নাজমুল হাসান',
      sellerOrDealerId: 'DLR-903 (পপুলার হার্বাল)',
      product: 'অ্যালোভেরা জুস ও অর্গানিক হেয়ার অয়েল',
      quantity: 1,
      mrp: 2400,
      discount: 200,
      finalSaleAmount: 2200,
      deliveryCost: 80,
      tax: 70,
      cashback: 0,
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Failed',
      orderStatus: 'cancelled',
      cogs: 1300,
      netCommission: 0
    },
    {
      orderId: 'ORD-89220',
      orderDate: '2026-08-26',
      date: '2026-08-26',
      customerId: 'CUST-3097',
      customerName: 'জাহিদুল কবির',
      sellerOrDealerId: 'DLR-901 (সততা এগ্রো)',
      product: 'প্রিমিয়াম কাজুবাদাম ও কিশমিশ প্যাকেজ',
      quantity: 2,
      mrp: 4200,
      discount: 100,
      finalSaleAmount: 4100,
      deliveryCost: 120,
      tax: 120,
      cashback: 0,
      paymentMethod: 'Crypto',
      paymentStatus: 'Failed',
      orderStatus: 'failed',
      cogs: 2400,
      netCommission: 0
    }
  ]);

  // 2. Payments Master Records (with explicit 1.8% MFS gateway fee)
  const [payments, setPayments] = useState<FinancePaymentRecord[]>([
    {
      paymentId: 'PAY-77101',
      orderId: 'ORD-89214',
      customerId: 'CUST-3091',
      customerName: 'রাফসান আহমেদ',
      amount: 5070,
      paymentMethod: 'bKash',
      gatewayName: 'bKash Direct Merchant API',
      gatewayFeePercentage: 1.8,
      gatewayFeeAmount: 91,
      gatewayCharge: 91,
      netSettledAmount: 4979,
      transactionId: 'BK90214890',
      paymentDate: '2026-08-28 10:14:22',
      dateTime: '2026-08-28 10:14:22',
      paymentStatus: 'Received',
      status: 'Captured',
      receivedBy: 'bKash Gateway Master',
      verifiedBy: 'usr-finance-01 (Automated Webhook)',
      notes: 'Standard bKash 1.8% gateway charge deducted'
    },
    {
      paymentId: 'PAY-77102',
      orderId: 'ORD-89215',
      customerId: 'CUST-3092',
      customerName: 'তানজিলা বেগম',
      amount: 3500,
      paymentMethod: 'Cash on Delivery',
      gatewayName: 'In-house Fleet COD Vault',
      gatewayFeePercentage: 0,
      gatewayFeeAmount: 0,
      gatewayCharge: 0,
      netSettledAmount: 3500,
      transactionId: 'COD-RDR-118-01',
      paymentDate: '2026-08-28 12:45:00',
      dateTime: '2026-08-28 12:45:00',
      paymentStatus: 'Received',
      status: 'Captured',
      receivedBy: 'তারেক রহমান (Rider RDR-118)',
      verifiedBy: 'usr-ops-dhaka-01 (Hub Officer)',
      notes: 'Customer Money Receipt confirmed via SMS'
    },
    {
      paymentId: 'PAY-77103',
      orderId: 'ORD-89216',
      customerId: 'CUST-3093',
      customerName: 'মাহমুদুল হক',
      amount: 13130,
      paymentMethod: 'Bank',
      gatewayName: 'City Bank CyberSource POS/PG',
      gatewayFeePercentage: 0,
      gatewayFeeAmount: 0,
      gatewayCharge: 0,
      netSettledAmount: 13130,
      transactionId: 'CB99812401',
      paymentDate: '2026-08-28 14:20:11',
      dateTime: '2026-08-28 14:20:11',
      paymentStatus: 'Received',
      status: 'Captured',
      receivedBy: 'City Bank Corporate A/C',
      verifiedBy: 'usr-finance-01',
      notes: 'Corporate Card transaction confirmed via NPSB'
    },
    {
      paymentId: 'PAY-77104',
      orderId: 'ORD-89217',
      customerId: 'CUST-3094',
      customerName: 'ফারহানা ইসলাম',
      amount: 6750,
      paymentMethod: 'Nagad',
      gatewayName: 'Nagad Direct PG',
      gatewayFeePercentage: 1.8,
      gatewayFeeAmount: 122,
      gatewayCharge: 122,
      netSettledAmount: 6628,
      transactionId: 'NG7719024',
      paymentDate: '2026-08-27 16:30:00',
      dateTime: '2026-08-27 16:30:00',
      paymentStatus: 'Received',
      status: 'Captured',
      receivedBy: 'Nagad Merchant Master',
      verifiedBy: 'usr-finance-01',
      notes: 'Nagad 1.8% gateway fee deducted'
    },
    {
      paymentId: 'PAY-77105',
      orderId: 'ORD-89218',
      customerId: 'CUST-3095',
      customerName: 'সাইফুল ইসলাম',
      amount: 9360,
      paymentMethod: 'Cash on Delivery',
      gatewayName: 'In-house Fleet COD Vault',
      gatewayFeePercentage: 0,
      gatewayFeeAmount: 0,
      gatewayCharge: 0,
      netSettledAmount: 9360,
      transactionId: 'COD-RDR-122-09',
      paymentDate: '2026-08-28 15:30:10',
      dateTime: '2026-08-28 15:30:10',
      paymentStatus: 'Processing',
      status: 'Processing',
      receivedBy: 'নুরুল হুদা (Rider RDR-122)',
      verifiedBy: 'Pending Verification',
      notes: 'Money Receipt issued by Rider'
    },
    {
      paymentId: 'PAY-77106',
      orderId: 'ORD-89221',
      customerId: 'CUST-3098',
      customerName: 'আনিসুল ইসলাম',
      amount: 4500,
      paymentMethod: 'Crypto',
      gatewayName: 'Apon Bazar Web3 Payment Gateway',
      gatewayFeePercentage: 0,
      gatewayFeeAmount: 0,
      gatewayCharge: 0,
      netSettledAmount: 4500,
      transactionId: '0x88f9104b9c107',
      paymentDate: '2026-08-28 17:00:00',
      dateTime: '2026-08-28 17:00:00',
      paymentStatus: 'Pending',
      status: 'Pending',
      receivedBy: 'Apon Bazar Treasury Multi-Sig',
      verifiedBy: 'Pending Confirmation',
      notes: 'Blockchain block verification in progress'
    }
  ]);

  // 3. Settlements (Maker-Checker queue)
  const [settlements, setSettlements] = useState<FinanceSettlementRecord[]>([
    {
      settlementId: 'SET-5011',
      beneficiaryId: 'DLR-901',
      beneficiaryName: 'সততা এগ্রো অ্যান্ড ডেইরি ফার্ম (হোলসেল ডিলার)',
      beneficiaryRole: 'Dealer',
      grossSalesAmount: 145000,
      deductions: 14500,
      platformFee: 7250,
      taxDeducted: 1450,
      netPayableAmount: 121800,
      paymentMethod: 'City Bank Corporate Current A/C',
      paymentReference: 'BEFTN-CB-88910',
      requestDate: '2026-08-26',
      approvalDate: '2026-08-27',
      paymentDate: '2026-08-28',
      status: 'Settled',
      settledBy: 'usr-finance-01',
      approvedBy: 'usr-superadmin (Founder)'
    },
    {
      settlementId: 'SET-5012',
      beneficiaryId: 'OPS-302',
      beneficiaryName: 'মোহাম্মদ করিম (মিরপুর উপজেলা অপারেশনস অফিসার)',
      beneficiaryRole: 'Operations Officer',
      grossSalesAmount: 48000,
      deductions: 2400,
      platformFee: 0,
      taxDeducted: 480,
      netPayableAmount: 45120,
      paymentMethod: 'bKash Business Merchant Master',
      requestDate: '2026-08-28',
      status: 'Requested'
    },
    {
      settlementId: 'SET-5013',
      beneficiaryId: 'RDR-114',
      beneficiaryName: 'হাসান জামিল (ডেলিভারি রাইডার - ধানমন্ডি জোন)',
      beneficiaryRole: 'Delivery Rider',
      grossSalesAmount: 18500,
      deductions: 500,
      platformFee: 0,
      taxDeducted: 185,
      netPayableAmount: 17815,
      paymentMethod: 'bKash Business Merchant Master',
      requestDate: '2026-08-28',
      status: 'Approved'
    }
  ]);

  // 4. Commissions Master Records (7 Automated Tiers)
  const [commissions, setCommissions] = useState<FinanceCommissionRecord[]>([
    {
      commissionId: 'COM-991',
      orderId: 'ORD-89214',
      beneficiaryId: 'DLR-901',
      beneficiaryName: 'সততা এগ্রো ডিলার',
      beneficiaryRole: 'Seller / Dealer',
      commissionType: 'Seller/Dealer Commission',
      grossAmount: 4800,
      commissionRate: 5.0,
      commissionAmount: 240,
      status: 'Paid',
      approvalDate: '2026-08-28',
      paymentDate: '2026-08-28',
      approvedBy: 'usr-finance-01'
    },
    {
      commissionId: 'COM-992',
      orderId: 'ORD-89214',
      beneficiaryId: 'OPS-302',
      beneficiaryName: 'মোহাম্মদ করিম (অপারেশনস অফিসার)',
      beneficiaryRole: 'Operations Officer',
      commissionType: 'Operations Officer Commission',
      grossAmount: 4800,
      commissionRate: 2.0,
      commissionAmount: 96,
      status: 'Payable',
      approvalDate: '2026-08-28',
      approvedBy: 'usr-finance-01'
    },
    {
      commissionId: 'COM-993',
      orderId: 'ORD-89214',
      beneficiaryId: 'RDR-114',
      beneficiaryName: 'হাসান জামিল (ডেলিভারি ম্যান)',
      beneficiaryRole: 'Delivery Man',
      commissionType: 'Delivery Man Commission',
      grossAmount: 4800,
      commissionRate: 3.5,
      commissionAmount: 168,
      status: 'Paid',
      approvalDate: '2026-08-28',
      paymentDate: '2026-08-28',
      approvedBy: 'usr-finance-01'
    },
    {
      commissionId: 'COM-994',
      orderId: 'ORD-89214',
      beneficiaryId: 'REF-708',
      beneficiaryName: 'সাকিব আল হাসান (স্পন্সর)',
      beneficiaryRole: 'Referral / Sponsor',
      commissionType: 'Referral Commission',
      grossAmount: 4800,
      commissionRate: 1.5,
      commissionAmount: 72,
      status: 'Payable',
      approvalDate: '2026-08-28',
      approvedBy: 'usr-finance-01'
    },
    {
      commissionId: 'COM-995',
      orderId: 'ORD-89214',
      beneficiaryId: 'NET-1042',
      beneficiaryName: 'আব্দুল কাদের (নেটওয়ার্ক লিডার)',
      beneficiaryRole: 'Network Member',
      commissionType: 'Network Commission',
      grossAmount: 4800,
      commissionRate: 2.0,
      commissionAmount: 96,
      status: 'Approved',
      approvalDate: '2026-08-28',
      approvedBy: 'usr-finance-01'
    },
    {
      commissionId: 'COM-996',
      orderId: 'ORD-89214',
      beneficiaryId: 'Apon Bazar-TREASURY',
      beneficiaryName: 'Apon Bazar কেন্দ্রীয় ট্রেজারি',
      beneficiaryRole: 'Company / Admin',
      commissionType: 'Company/Admin Share',
      grossAmount: 4800,
      commissionRate: 6.0,
      commissionAmount: 288,
      status: 'Paid',
      approvalDate: '2026-08-28',
      paymentDate: '2026-08-28',
      approvedBy: 'usr-superadmin'
    },
    {
      commissionId: 'COM-997',
      orderId: 'ORD-89214',
      beneficiaryId: 'CAMP-55',
      beneficiaryName: 'ইদ স্পেশাল প্রোমোশনাল ক্যাম্পেইন পুল',
      beneficiaryRole: 'Company / Admin',
      commissionType: 'Other approved commissions',
      grossAmount: 4800,
      commissionRate: 1.0,
      commissionAmount: 48,
      status: 'Pending',
      approvedBy: 'Pending Review'
    }
  ]);

  // 5. Operating Expenses (12 Categories)
  const [expenses, setExpenses] = useState<FinanceExpenseRecord[]>([
    {
      expenseId: 'EXP-8801',
      category: 'Technology/Server',
      description: 'Cloud Infrastructure & High-Availability Database Hosting',
      amount: 45000,
      paymentMethod: 'City Bank Corporate Account',
      reference: 'INV-GCP-89201',
      status: 'Paid',
      submittedBy: 'usr-finance-01',
      approvedBy: 'usr-superadmin',
      date: '2026-08-25'
    },
    {
      expenseId: 'EXP-8802',
      category: 'Office Expense',
      description: 'Dhaka Central Hub Utility & Fiber Internet Bill',
      amount: 14500,
      paymentMethod: 'bKash Business Merchant',
      reference: 'DESCO-AUG-26',
      status: 'Paid',
      submittedBy: 'usr-finance-01',
      approvedBy: 'usr-superadmin',
      date: '2026-08-26'
    },
    {
      expenseId: 'EXP-8803',
      category: 'Marketing Expense',
      description: 'Nationwide Organic Grocery Awareness Campaign',
      amount: 85000,
      paymentMethod: 'City Bank Corporate Account',
      reference: 'MKT-AUG-99',
      status: 'Pending Approval',
      submittedBy: 'usr-finance-01',
      date: '2026-08-28'
    },
    {
      expenseId: 'EXP-8804',
      category: 'Delivery Expense',
      description: 'Fleet Fuel Subsidies & Maintenance Support',
      amount: 28000,
      paymentMethod: 'Central Petty Cash Vault',
      reference: 'FLEET-7712',
      status: 'Approved',
      submittedBy: 'usr-ops-dhaka-01',
      approvedBy: 'usr-finance-01',
      date: '2026-08-27'
    }
  ]);

  // 6. Double-Entry General Ledger
  const [ledger, setLedger] = useState<FinancialLedgerEntry[]>([
    {
      transactionId: 'TRX-100891',
      dateTime: '2026-08-28 10:14:22',
      account: 'bKash Business Merchant Master',
      referenceType: 'Order',
      referenceId: 'ORD-89214',
      description: 'Direct customer bKash collection for Order ORD-89214',
      debit: 4870,
      credit: 0,
      runningBalance: 320500,
      createdBy: 'usr-finance-01',
      approvedBy: 'System Auto-Capture',
      status: 'Posted'
    },
    {
      transactionId: 'TRX-100892',
      dateTime: '2026-08-28 10:14:22',
      account: 'Sales Revenue Account',
      referenceType: 'Order',
      referenceId: 'ORD-89214',
      description: 'Gross sales revenue recognition for Order ORD-89214',
      debit: 0,
      credit: 4870,
      runningBalance: 4820000,
      createdBy: 'usr-finance-01',
      approvedBy: 'System Auto-Capture',
      status: 'Posted'
    },
    {
      transactionId: 'TRX-100893',
      dateTime: '2026-08-28 11:30:00',
      account: 'Accounts Payable (Dealers & Vendors)',
      referenceType: 'Settlement',
      referenceId: 'SET-5011',
      description: 'Wholesale sales settlement released to Satata Agro Farm',
      debit: 121800,
      credit: 0,
      runningBalance: 654200,
      createdBy: 'usr-finance-01',
      approvedBy: 'usr-superadmin',
      status: 'Posted'
    },
    {
      transactionId: 'TRX-100894',
      dateTime: '2026-08-28 11:30:00',
      account: 'City Bank Corporate Current A/C',
      referenceType: 'Settlement',
      referenceId: 'SET-5011',
      description: 'BEFTN bank transfer payout for Satata Agro Farm',
      debit: 0,
      credit: 121800,
      runningBalance: 1250000,
      createdBy: 'usr-finance-01',
      approvedBy: 'usr-superadmin',
      status: 'Posted'
    }
  ]);

  // 7. Receivables & Payables
  const [receivables, setReceivables] = useState<FinanceReceivableRecord[]>([
    {
      receivableId: 'REC-301',
      partyId: 'PATHAO-LOGISTICS',
      partyName: 'Pathao Courier & COD Collection Services',
      partyRole: 'Logistics Partner',
      totalAmount: 185000,
      collectedAmount: 120000,
      outstandingAmount: 65000,
      dueDate: '2026-08-30',
      aging: '0-7 Days',
      status: 'Partially Collected',
      reference: 'BATCH-AUG-WK4'
    },
    {
      receivableId: 'REC-302',
      partyId: 'B2B-SUPERSTORE-09',
      partyName: 'স্বপ্ন সুপারশপ (বনশ্রী আউটলেট - কর্পোরেট সাপ্লাই)',
      partyRole: 'Corporate B2B Buyer',
      totalAmount: 95000,
      collectedAmount: 0,
      outstandingAmount: 95000,
      dueDate: '2026-09-05',
      aging: '8-15 Days',
      status: 'Pending',
      reference: 'PO-SWP-9921'
    }
  ]);

  const [payables, setPayables] = useState<FinancePayableRecord[]>([
    {
      payableId: 'PAYB-401',
      partyId: 'DLR-901',
      partyName: 'সততা এগ্রো অ্যান্ড ডেইরি ফার্ম',
      partyRole: 'Dealer',
      category: 'Seller Product Payout',
      totalAmount: 240000,
      paidAmount: 121800,
      outstandingAmount: 118200,
      dueDate: '2026-08-31',
      aging: '0-7 Days',
      status: 'Partially Paid',
      reference: 'SETTLE-CYCLE-AUG'
    },
    {
      payableId: 'PAYB-402',
      partyId: 'SUP-PACK-01',
      partyName: 'প্রাইম প্যাকেজিং অ্যান্ড প্রিন্টার্স বিডি',
      partyRole: 'Supplier',
      category: 'Eco Box Packaging Supply',
      totalAmount: 54000,
      paidAmount: 0,
      outstandingAmount: 54000,
      dueDate: '2026-09-02',
      aging: '8-15 Days',
      status: 'Pending',
      reference: 'BILL-PRIME-441'
    }
  ]);

  // 8. Refunds
  const [refunds, setRefunds] = useState<FinanceRefundRecord[]>([
    {
      refundId: 'REF-201',
      orderId: 'ORD-89210',
      customerId: 'CUST-3088',
      customerName: 'কামরুল হাসান',
      originalOrderAmount: 2400,
      refundAmount: 2400,
      reason: 'Damaged Organic Honey Jar in Transit - Replacement Declined by Customer',
      status: 'Refunded',
      refundMethod: 'bKash Instant Refund',
      refundDate: '2026-08-27',
      approvedBy: 'usr-finance-01'
    },
    {
      refundId: 'REF-202',
      orderId: 'ORD-89212',
      customerId: 'CUST-3089',
      customerName: 'নুসরাত জাহান',
      originalOrderAmount: 1850,
      refundAmount: 1850,
      reason: 'Wrong Item Size Dispatched from Regional Warehouse Hub',
      status: 'Approved',
      refundMethod: 'bKash Direct Wallet',
      approvedBy: 'usr-finance-01'
    }
  ]);

  // 9. Bank & Treasury Accounts
  const [accounts, setAccounts] = useState<BankAccountRecord[]>([
    {
      accountId: 'acc-01',
      accountName: 'City Bank Corporate Current A/C',
      accountNumber: '3102948291001',
      accountType: 'Bank Current A/C',
      openingBalance: 1100000,
      currentBalance: 1250000,
      totalDebit: 450000,
      totalCredit: 300000,
      reconciliationStatus: 'Reconciled'
    },
    {
      accountId: 'acc-02',
      accountName: 'bKash Business Merchant Master',
      accountNumber: '01312480175',
      accountType: 'Mobile Financial Merchant',
      openingBalance: 280000,
      currentBalance: 320500,
      totalDebit: 180500,
      totalCredit: 140000,
      reconciliationStatus: 'Reconciled'
    },
    {
      accountId: 'acc-03',
      accountName: 'BRAC Bank Escrow & Operations A/C',
      accountNumber: '150120489912001',
      accountType: 'Bank Escrow A/C',
      openingBalance: 850000,
      currentBalance: 920000,
      totalDebit: 250000,
      totalCredit: 180000,
      reconciliationStatus: 'Reconciled'
    },
    {
      accountId: 'acc-04',
      accountName: 'Nagad Commercial Settlement A/C',
      accountNumber: '01719998877',
      accountType: 'Mobile Financial Merchant',
      openingBalance: 150000,
      currentBalance: 185400,
      totalDebit: 95400,
      totalCredit: 60000,
      reconciliationStatus: 'Reconciled'
    },
    {
      accountId: 'acc-05',
      accountName: 'Company Cash Vault (Dhaka HQ)',
      accountNumber: 'VAULT-DHAKA-01',
      accountType: 'Cash Vault',
      openingBalance: 210000,
      currentBalance: 174100,
      totalDebit: 64100,
      totalCredit: 100000,
      reconciliationStatus: 'Reconciled'
    },
    {
      accountId: 'acc-06',
      accountName: 'Crypto Reserve Treasury (USDT / Digital Assets)',
      accountNumber: 'TRC20-TREASURY-8812',
      accountType: 'Crypto / Token Reserve',
      openingBalance: 1400000,
      currentBalance: 1400000,
      totalDebit: 0,
      totalCredit: 0,
      reconciliationStatus: 'Reconciled'
    }
  ]);

  // 10. Bank Reconciliation
  const [reconciliations, setReconciliations] = useState<BankReconciliationItem[]>([
    {
      reconciliationId: 'REC-ITEM-01',
      transactionId: 'BK90214890',
      bankName: 'bKash Merchant Master Wallet',
      bankAccountNumber: '01312480175',
      systemAmount: 4870,
      bankAmount: 4870,
      difference: 0,
      status: 'Matched',
      statementDate: '2026-08-28',
      notes: 'Direct API webhook settlement match'
    },
    {
      reconciliationId: 'REC-ITEM-02',
      transactionId: 'BEFTN-CB-88910',
      bankName: 'City Bank Corporate Current Account',
      bankAccountNumber: '3102948291001',
      systemAmount: 121800,
      bankAmount: 121800,
      difference: 0,
      status: 'Reconciled',
      statementDate: '2026-08-28',
      notes: 'BEFTN batch clearance confirmed by bank portal'
    },
    {
      reconciliationId: 'REC-ITEM-03',
      transactionId: 'NG-BATCH-771',
      bankName: 'Nagad Commercial Settlement',
      bankAccountNumber: '01719998877',
      systemAmount: 6450,
      bankAmount: 6450,
      difference: 0,
      status: 'Matched',
      statementDate: '2026-08-27'
    }
  ]);

  // 11. Audit Logs (Immutable)
  const [auditLogs, setAuditLogs] = useState<FinanceAuditLogRecord[]>([
    {
      logId: 'AUD-88001',
      dateTime: '2026-08-28 10:14:22',
      userId: 'usr-finance-01',
      userName: 'Finance & Accounts Officer',
      userRole: 'Finance Officer',
      action: 'ORDER_PAYMENT_CAPTURED',
      targetEntity: 'PaymentRecord',
      entityId: 'PAY-77101',
      previousValue: 'Status: Pending',
      newValue: 'Status: Captured (৳4,870)',
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: 'Automatic webhook payment capture for Order ORD-89214'
    },
    {
      logId: 'AUD-88002',
      dateTime: '2026-08-28 11:30:00',
      userId: 'usr-superadmin',
      userName: 'Founder & Super Admin',
      userRole: 'Super Admin',
      action: 'SETTLEMENT_APPROVED_AND_PAID',
      targetEntity: 'SettlementRecord',
      entityId: 'SET-5011',
      previousValue: 'Status: Approved',
      newValue: 'Status: Settled (৳121,800)',
      ipAddress: '103.220.21.1',
      status: 'Success',
      details: 'Maker-Checker 2nd level authorization for Satata Agro Farm settlement'
    }
  ]);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 3500);
  };

  // ----------------------------------------------------
  // Core Business Actions & Ledger Auto-Posting
  // ----------------------------------------------------

  // A. Approve Settlement (Maker-Checker Step 2)
  const handleApproveSettlement = (settlementId: string) => {
    setSettlements((prev) =>
      prev.map((s) => {
        if (s.settlementId === settlementId) {
          return {
            ...s,
            status: 'Approved',
            approvedBy: currentUser?.name || 'Finance Checker'
          };
        }
        return s;
      })
    );

    // Audit Log
    const newLog: FinanceAuditLogRecord = {
      logId: `AUD-${Date.now().toString().slice(-5)}`,
      dateTime: new Date().toLocaleString(),
      userId: currentUser?.id || 'usr-finance-01',
      userName: currentUser?.name || 'Finance Officer',
      userRole: currentUser?.role || 'Finance',
      action: 'SETTLEMENT_APPROVED',
      targetEntity: 'SettlementRecord',
      entityId: settlementId,
      newValue: 'Status: Approved',
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: 'Checker review cleared for payout disbursement'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(isBn ? 'সেটেলমেন্ট সফলভাবে অনুমোদিত হয়েছে!' : 'Settlement successfully approved!');
  };

  // B. Disburse/Release Settlement Funds
  const handleReleaseSettlement = (settlementId: string) => {
    const target = settlements.find((s) => s.settlementId === settlementId);
    if (!target) return;

    setSettlements((prev) =>
      prev.map((s) => {
        if (s.settlementId === settlementId) {
          return {
            ...s,
            status: 'Settled',
            paymentDate: new Date().toISOString().slice(0, 10),
            settledBy: currentUser?.name || 'Finance Officer'
          };
        }
        return s;
      })
    );

    // Auto-Post to General Ledger
    const debitEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${Date.now().toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: 'Accounts Payable (Dealers & Vendors)',
      referenceType: 'Settlement',
      referenceId: settlementId,
      description: `Settlement payout release for ${target.beneficiaryName}`,
      debit: target.netPayableAmount,
      credit: 0,
      runningBalance: 532400,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Maker-Checker Verified',
      status: 'Posted'
    };

    const creditEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${(Date.now() + 1).toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: target.paymentMethod || 'City Bank Corporate Current A/C',
      referenceType: 'Settlement',
      referenceId: settlementId,
      description: `Bank disbursement for settlement ${settlementId}`,
      debit: 0,
      credit: target.netPayableAmount,
      runningBalance: 1128200,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Maker-Checker Verified',
      status: 'Posted'
    };

    setLedger((prev) => [debitEntry, creditEntry, ...prev]);

    // Audit Log
    const newLog: FinanceAuditLogRecord = {
      logId: `AUD-${Date.now().toString().slice(-5)}`,
      dateTime: new Date().toLocaleString(),
      userId: currentUser?.id || 'usr-finance-01',
      userName: currentUser?.name || 'Finance Officer',
      userRole: currentUser?.role || 'Finance',
      action: 'SETTLEMENT_DISBURSED',
      targetEntity: 'SettlementRecord',
      entityId: settlementId,
      newValue: `Disbursed ৳${target.netPayableAmount.toLocaleString()}`,
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: 'Funds disbursed and double-entry general ledger updated'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(isBn ? 'সেটেলমেন্ট অর্থ সফলভাবে পরিশোধিত ও লেজারে অন্তর্ভুক্ত হয়েছে!' : 'Settlement disbursed and posted to Ledger!');
  };

  // C. Disburse Commission
  const handleDisburseCommission = (commissionId: string) => {
    setCommissions((prev) =>
      prev.map((c) => {
        if (c.commissionId === commissionId) {
          return {
            ...c,
            status: 'Paid',
            paymentDate: new Date().toISOString().slice(0, 10)
          };
        }
        return c;
      })
    );
    showToast(isBn ? 'কমিশন সফলভাবে ওয়ালেটে প্রদান করা হয়েছে!' : 'Commission disbursed to wallet!');
  };

  // D. Create New Operating Expense Voucher
  const handleCreateExpense = (newExp: Partial<FinanceExpenseRecord>) => {
    const expenseId = `EXP-${Date.now().toString().slice(-4)}`;
    const fullExpense: FinanceExpenseRecord = {
      expenseId,
      category: newExp.category || 'Office Expense',
      description: newExp.description || '',
      amount: newExp.amount || 0,
      paymentMethod: newExp.paymentMethod || 'City Bank Corporate Account',
      reference: newExp.reference || '',
      notes: newExp.notes || '',
      status: 'Pending Approval',
      submittedBy: currentUser?.name || 'Finance Officer',
      date: new Date().toISOString().slice(0, 10)
    };

    setExpenses((prev) => [fullExpense, ...prev]);

    // Audit Log
    const newLog: FinanceAuditLogRecord = {
      logId: `AUD-${Date.now().toString().slice(-5)}`,
      dateTime: new Date().toLocaleString(),
      userId: currentUser?.id || 'usr-finance-01',
      userName: currentUser?.name || 'Finance Officer',
      userRole: currentUser?.role || 'Finance',
      action: 'EXPENSE_VOUCHER_CREATED',
      targetEntity: 'ExpenseRecord',
      entityId: expenseId,
      newValue: `Amount: ৳${fullExpense.amount.toLocaleString()} (${fullExpense.category})`,
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: 'Expense voucher registered for Maker-Checker review'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(isBn ? 'নতুন খরচ ভাউচার সফলভাবে দাখিল হয়েছে!' : 'Expense voucher submitted for review!');
  };

  // E. Approve Expense Voucher
  const handleApproveExpense = (expenseId: string) => {
    const exp = expenses.find((e) => e.expenseId === expenseId);
    if (!exp) return;

    setExpenses((prev) =>
      prev.map((e) => {
        if (e.expenseId === expenseId) {
          return {
            ...e,
            status: 'Approved',
            approvedBy: currentUser?.name || 'Finance Checker'
          };
        }
        return e;
      })
    );

    // Auto-Post to General Ledger
    const debitEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${Date.now().toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: 'Operating Expense Ledger',
      referenceType: 'Expense',
      referenceId: expenseId,
      description: `${exp.category}: ${exp.description}`,
      debit: exp.amount,
      credit: 0,
      runningBalance: 640000,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: currentUser?.name || 'Finance Checker',
      status: 'Posted'
    };

    const creditEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${(Date.now() + 1).toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: exp.paymentMethod || 'City Bank Corporate Current A/C',
      referenceType: 'Expense',
      referenceId: expenseId,
      description: `Payment for expense voucher ${expenseId}`,
      debit: 0,
      credit: exp.amount,
      runningBalance: 1205000,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: currentUser?.name || 'Finance Checker',
      status: 'Posted'
    };

    setLedger((prev) => [debitEntry, creditEntry, ...prev]);

    // Audit Log
    const newLog: FinanceAuditLogRecord = {
      logId: `AUD-${Date.now().toString().slice(-5)}`,
      dateTime: new Date().toLocaleString(),
      userId: currentUser?.id || 'usr-finance-01',
      userName: currentUser?.fullName || currentUser?.name || 'Finance Officer',
      userRole: currentUser?.primaryRole || currentUser?.role || 'Finance',
      action: 'EXPENSE_APPROVED_AND_POSTED',
      targetEntity: 'ExpenseRecord',
      entityId: expenseId,
      newValue: `Approved ৳${exp.amount.toLocaleString()}`,
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: 'Voucher approved and double-entry ledger updated'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(isBn ? 'খরচ ভাউচার অনুমোদিত ও লেজারে অন্তর্ভুক্ত হয়েছে!' : 'Expense voucher approved and posted!');
  };

  // F. Process Refund
  const handleProcessRefund = (refundId: string) => {
    const ref = refunds.find((r) => r.refundId === refundId);
    if (!ref) return;

    setRefunds((prev) =>
      prev.map((r) => {
        if (r.refundId === refundId) {
          return {
            ...r,
            status: 'Refunded',
            refundDate: new Date().toISOString().slice(0, 10),
            approvedBy: currentUser?.name || 'Finance Officer'
          };
        }
        return r;
      })
    );

    // Auto-Post to General Ledger
    const debitEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${Date.now().toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: 'Customer Refund Adjustments',
      referenceType: 'Refund',
      referenceId: refundId,
      description: `Customer refund for order ${ref.orderId} (${ref.reason})`,
      debit: ref.refundAmount,
      credit: 0,
      runningBalance: 42500,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Authorized Finance Officer',
      status: 'Posted'
    };

    const creditEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${(Date.now() + 1).toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: 'bKash Business Merchant Master',
      referenceType: 'Refund',
      referenceId: refundId,
      description: `Refund reversal payout to customer ${ref.customerName}`,
      debit: 0,
      credit: ref.refundAmount,
      runningBalance: 318100,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Authorized Finance Officer',
      status: 'Posted'
    };

    setLedger((prev) => [debitEntry, creditEntry, ...prev]);
    showToast(isBn ? 'গ্রাহক রিফান্ড সফলভাবে সম্পন্ন হয়েছে!' : 'Customer refund processed successfully!');
  };

  // G. Transfer Funds Between Treasury Accounts
  const handleTransferFunds = (fromAcc: string, toAcc: string, amount: number, note: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.accountName === fromAcc) {
          return {
            ...acc,
            currentBalance: acc.currentBalance - amount,
            totalCredit: acc.totalCredit + amount
          };
        }
        if (acc.accountName === toAcc) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + amount,
            totalDebit: acc.totalDebit + amount
          };
        }
        return acc;
      })
    );

    // Double-Entry Ledger Entry
    const debitEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${Date.now().toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: toAcc,
      referenceType: 'Adjustment',
      referenceId: `TRF-${Date.now().toString().slice(-4)}`,
      description: `Inter-account transfer from ${fromAcc}: ${note}`,
      debit: amount,
      credit: 0,
      runningBalance: 1500000,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Treasury Controller',
      status: 'Posted'
    };

    const creditEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${(Date.now() + 1).toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: fromAcc,
      referenceType: 'Adjustment',
      referenceId: `TRF-${Date.now().toString().slice(-4)}`,
      description: `Inter-account transfer to ${toAcc}: ${note}`,
      debit: 0,
      credit: amount,
      runningBalance: 1200000,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Treasury Controller',
      status: 'Posted'
    };

    setLedger((prev) => [debitEntry, creditEntry, ...prev]);
    showToast(isBn ? 'অভ্যন্তরীণ ফান্ড ট্রান্সফার সফল হয়েছে!' : 'Inter-account fund transfer successful!');
  };

  // H. Match Bank Reconciliation Item
  const handleMatchReconciliation = (reconciliationId: string) => {
    setReconciliations((prev) =>
      prev.map((r) => {
        if (r.reconciliationId === reconciliationId) {
          return {
            ...r,
            status: 'Matched',
            difference: 0,
            notes: 'Manual auditor verification matched'
          };
        }
        return r;
      })
    );
    showToast(isBn ? 'রিকনসিলেশন সফলভাবে মিল করা হয়েছে!' : 'Reconciliation item matched!');
  };

  // I. Post Authorized Adjustment / Reversal Journal Voucher
  const handleSaveAdjustment = (adj: {
    debitAccount: string;
    creditAccount: string;
    amount: number;
    reason: string;
    reference: string;
    notes: string;
  }) => {
    const debitEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${Date.now().toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: adj.debitAccount,
      referenceType: 'Adjustment',
      referenceId: adj.reference,
      description: `Authorized Adjustment: ${adj.reason} (${adj.notes})`,
      debit: adj.amount,
      credit: 0,
      runningBalance: 1250000 + adj.amount,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Dual Maker-Checker Authorization',
      status: 'Posted'
    };

    const creditEntry: FinancialLedgerEntry = {
      transactionId: `TRX-${(Date.now() + 1).toString().slice(-6)}`,
      dateTime: new Date().toLocaleString(),
      account: adj.creditAccount,
      referenceType: 'Adjustment',
      referenceId: adj.reference,
      description: `Authorized Balancing Credit: ${adj.reason}`,
      debit: 0,
      credit: adj.amount,
      runningBalance: 654200 - adj.amount,
      createdBy: currentUser?.name || 'Finance Officer',
      approvedBy: 'Dual Maker-Checker Authorization',
      status: 'Posted'
    };

    setLedger((prev) => [debitEntry, creditEntry, ...prev]);

    // Audit Log
    const newLog: FinanceAuditLogRecord = {
      logId: `AUD-${Date.now().toString().slice(-5)}`,
      dateTime: new Date().toLocaleString(),
      userId: currentUser?.id || 'usr-finance-01',
      userName: currentUser?.fullName || currentUser?.name || 'Finance Officer',
      userRole: currentUser?.primaryRole || currentUser?.role || 'Finance',
      action: 'JOURNAL_ADJUSTMENT_POSTED',
      targetEntity: 'GeneralLedger',
      entityId: adj.reference,
      previousValue: `Balanced Dr: ${adj.debitAccount}`,
      newValue: `Cr: ${adj.creditAccount} (৳${adj.amount.toLocaleString()})`,
      ipAddress: '103.220.21.14',
      status: 'Success',
      details: `Reason: ${adj.reason} | Notes: ${adj.notes}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast(isBn ? 'অ্যাডজাস্টমেন্ট ভাউচার সফলভাবে পোস্টেড হয়েছে!' : 'Adjustment journal posted successfully!');
  };

  // ----------------------------------------------------
  // Dynamic Date Filtering & Scoped Metric Calculations
  // ----------------------------------------------------
  const totalSalesRevenue = useMemo(() => {
    return sales.reduce((acc, s) => acc + s.totalAmount, 0) + 4820000;
  }, [sales]);

  const totalCOGS = useMemo(() => {
    return Math.round(totalSalesRevenue * 0.58);
  }, [totalSalesRevenue]);

  const totalCommissions = useMemo(() => {
    return commissions.reduce((acc, c) => acc + c.commissionAmount, 0) + 580000;
  }, [commissions]);

  const totalSettlements = useMemo(() => {
    return settlements
      .filter((s) => s.status === 'Settled')
      .reduce((acc, s) => acc + s.netPayableAmount, 0) + 2790000;
  }, [settlements]);

  const totalExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.status === 'Approved' || e.status === 'Paid')
      .reduce((acc, e) => acc + e.amount, 0) + 640000;
  }, [expenses]);

  const totalRefundAmount = useMemo(() => {
    return refunds
      .filter((r) => r.status === 'Refunded')
      .reduce((acc, r) => acc + r.refundAmount, 0) + 38500;
  }, [refunds]);

  const pendingSettlementCount = useMemo(() => {
    return settlements.filter((s) => s.status === 'Requested' || s.status === 'Under Review').length;
  }, [settlements]);

  const pendingExpenseCount = useMemo(() => {
    return expenses.filter((e) => e.status === 'Pending Approval').length;
  }, [expenses]);

  const totalPendingQueue = pendingSettlementCount + pendingExpenseCount;

  // Dynamically calculate the 12 Summary Cards based on the selected Date Filter & Role Scoping
  const computedMetrics = useMemo(() => {
    let periodFactor = 1.0;
    let isToday = false;

    switch (dateFilter) {
      case 'today':
        periodFactor = 0.021;
        isToday = true;
        break;
      case 'yesterday':
        periodFactor = 0.019;
        break;
      case 'last_7_days':
        periodFactor = 0.23;
        break;
      case 'this_month':
        periodFactor = 1.0;
        break;
      case 'last_month':
        periodFactor = 0.88;
        break;
      case 'this_year':
        periodFactor = 6.4;
        break;
      case 'custom':
        periodFactor = 0.45;
        break;
      default:
        periodFactor = 1.0;
    }

    // Role-specific scope coefficient
    let roleScopeFactor = 1.0;
    if (accessControl.level === 'district_admin_scoped') {
      roleScopeFactor = 0.28; // Scoped to assigned district
    } else if (accessControl.level === 'operations_officer_scoped') {
      roleScopeFactor = 0.09; // Scoped to assigned Upazila hub
    } else if (accessControl.level === 'delivery_man_scoped') {
      roleScopeFactor = 0.025; // Scoped to own collections and earnings
    } else if (accessControl.level === 'seller_dealer_scoped') {
      roleScopeFactor = 0.12; // Scoped to own store sales
    } else if (accessControl.level === 'customer_scoped') {
      roleScopeFactor = 0.003; // Scoped to own orders & payments
    }

    const scopedBaseSales = Math.round(totalSalesRevenue * roleScopeFactor);
    const scopedBaseExpenses = Math.round(
      totalExpenses *
        (accessControl.level === 'customer_scoped' || accessControl.level === 'delivery_man_scoped'
          ? 0.001
          : roleScopeFactor)
    );
    const scopedBaseCommissions = Math.round(totalCommissions * roleScopeFactor);
    const scopedBaseSettlements = Math.round(totalSettlements * roleScopeFactor);
    const scopedBaseRefunds = Math.round(totalRefundAmount * roleScopeFactor);

    // 12 Cards Dynamic Calculation
    const periodSales = Math.round(scopedBaseSales * periodFactor);
    const periodCollection = Math.round(periodSales * 0.94);
    const periodExpense = Math.round(scopedBaseExpenses * periodFactor);
    const periodCommission = Math.round(scopedBaseCommissions * periodFactor);
    const periodPaidSettlement = Math.round(scopedBaseSettlements * periodFactor);
    const periodRefund = Math.round(scopedBaseRefunds * periodFactor);
    const periodCOGS = Math.round(periodSales * 0.58);
    const periodProfit = periodSales - (periodCOGS + periodCommission + periodExpense + periodRefund);

    // Today metrics (reflects today or period)
    const todaySales = isToday ? periodSales : Math.round(scopedBaseSales * 0.021);
    const todayCollection = Math.round(todaySales * 0.94);
    const todayExpense = isToday ? periodExpense : Math.round(scopedBaseExpenses * 0.021);
    const todayProfit =
      todaySales -
      (Math.round(todaySales * 0.58) + Math.round(scopedBaseCommissions * 0.021) + todayExpense + Math.round(scopedBaseRefunds * 0.021));

    const pendingSettlement = Math.round(scopedBaseSettlements * 0.16);

    return {
      todaySales,
      todayCollection,
      todayExpense,
      todayProfit,
      totalSales: periodSales,
      totalCollection: periodCollection,
      totalExpense: periodExpense,
      totalCommission: periodCommission,
      pendingSettlement,
      paidSettlement: periodPaidSettlement,
      refundAmount: periodRefund,
      netProfit: periodProfit
    };
  }, [
    dateFilter,
    customStartDate,
    customEndDate,
    accessControl.level,
    totalSalesRevenue,
    totalExpenses,
    totalCommissions,
    totalSettlements,
    totalRefundAmount
  ]);

  // Tab Permission Verification for Scoped Roles
  const isTabPermittedForRole = (tabKey: FinanceTabKey): boolean => {
    if (accessControl.canAccessAllTabs) return true;
    if (tabKey === 'overview') return true;

    if (accessControl.level === 'district_admin_scoped') {
      return ['overview', 'sales_revenue', 'payments', 'settlements', 'commissions', 'refunds', 'reports'].includes(tabKey);
    }
    if (accessControl.level === 'operations_officer_scoped') {
      return ['overview', 'settlements', 'payments', 'commissions', 'refunds'].includes(tabKey);
    }
    if (accessControl.level === 'delivery_man_scoped') {
      return ['overview', 'payments', 'settlements', 'commissions'].includes(tabKey);
    }
    if (accessControl.level === 'seller_dealer_scoped') {
      return ['overview', 'sales_revenue', 'settlements', 'commissions', 'receivables_payables'].includes(tabKey);
    }
    if (accessControl.level === 'customer_scoped') {
      return ['overview', 'payments', 'refunds'].includes(tabKey);
    }
    return false;
  };

  // Tabs Configuration
  const tabsList: { id: FinanceTabKey; labelBn: string; labelEn: string; icon: React.FC<any>; badge?: number; restricted?: boolean }[] = [
    { id: 'overview', labelBn: 'ড্যাশবোর্ড ওভারভিউ', labelEn: 'Overview', icon: LayoutDashboard },
    { id: 'sales_revenue', labelBn: 'বিক্রয় ও রাজস্ব', labelEn: 'Sales & Revenue', icon: TrendingUp },
    { id: 'payments', labelBn: 'পেমেন্ট কালেকশন', labelEn: 'Payments', icon: CreditCard },
    { id: 'settlements', labelBn: 'মার্কেটপ্লেস সেটেলমেন্ট', labelEn: 'Settlements', icon: Building, badge: pendingSettlementCount },
    { id: 'commissions', labelBn: 'কমিশন ব্যবস্থাপনা', labelEn: 'Commissions', icon: Coins },
    { id: 'expenses', labelBn: 'পরিচালন ব্যয় (১২ খাত)', labelEn: 'Operating Expenses', icon: DollarSign, badge: pendingExpenseCount },
    { id: 'profit_loss', labelBn: 'লাভ-ক্ষতি বিবরণী (P&L)', labelEn: 'Profit & Loss (P&L)', icon: Scale },
    { id: 'ledger', labelBn: 'জেনারেল লেজার', labelEn: 'General Ledger', icon: BookOpen },
    { id: 'receivables_payables', labelBn: 'প্রাপ্য ও প্রদেয় (AR/AP)', labelEn: 'Receivables & Payables', icon: ArrowRightLeft },
    { id: 'refunds', labelBn: 'রিটার্ন ও রিফান্ড', labelEn: 'Refunds & Returns', icon: RotateCcw },
    { id: 'accounts', labelBn: 'ব্যাংক ও ক্যাশ ভল্ট', labelEn: 'Treasury & Accounts', icon: Building2 },
    { id: 'reconciliation', labelBn: 'ব্যাংক রিকনসিলেশন', labelEn: 'Reconciliation', icon: CheckCircle2 },
    { id: 'cash_flow', labelBn: 'ক্যাশ ফ্লো স্টেটমেন্ট', labelEn: 'Cash Flow', icon: Activity },
    { id: 'reports', labelBn: '১৮টি আর্থিক রিপোর্ট', labelEn: '18 Financial Reports', icon: FileSpreadsheet },
    { id: 'audit_logs', labelBn: 'অডিট লগ ও ট্রেইল', labelEn: 'Audit Logs', icon: ShieldCheck },
    { id: 'approval_queue', labelBn: 'মেকার-চেকার কিউ', labelEn: 'Maker-Checker Queue', icon: UserCheck, badge: totalPendingQueue }
  ];

  // Permitted Role Simulation Quick-Switches for Demo & RBAC Compliance
  const roleOptions: { role: UserRole; nameBn: string; nameEn: string; icon: string }[] = [
    { role: 'founder', nameBn: '👑 ফাউন্ডার (Full Access)', nameEn: '👑 Founder (Full)', icon: '👑' },
    { role: 'super_admin', nameBn: '🛡️ সুপার অ্যাডমিন (Full Access)', nameEn: '🛡️ Super Admin (Full)', icon: '🛡️' },
    { role: 'finance', nameBn: '💼 ফিন্যান্স ও অ্যাকাউন্টস অফিসার', nameEn: '💼 Finance & Accounts Officer', icon: '💼' },
    { role: 'district_admin', nameBn: '🏢 জেলা অ্যাডমিন (ঢাকা জোন)', nameEn: '🏢 District Admin (Dhaka)', icon: '🏢' },
    { role: 'operations_partner', nameBn: '🏬 অপারেশনস অফিসার (মিরপুর)', nameEn: '🏬 Operations Officer (Hub)', icon: '🏬' },
    { role: 'delivery_rider', nameBn: '🛵 ডেলিভারি ম্যান (হাসান জামিল)', nameEn: '🛵 Delivery Man (Rider)', icon: '🛵' },
    { role: 'dealer', nameBn: '🏪 সেলার / ডিলার (সততা এগ্রো)', nameEn: '🏪 Seller / Dealer', icon: '🏪' },
    { role: 'customer', nameBn: '👤 কাস্টমার (রাফসান আহমেদ)', nameEn: '👤 Customer View', icon: '👤' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {notificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{notificationToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <DashboardHeader
        title={isBn ? 'ফাইন্যান্স ও অ্যাকাউন্টস ড্যাশবোর্ড' : 'Finance & Accounts Enterprise Dashboard'}
        subtitle={
          isBn
            ? 'Apon Bazar ই-কমার্স ও নেটওয়ার্ক মার্কেটপ্লেসের প্রাতিষ্ঠানিক হিসাবরক্ষণ ও অডিট প্ল্যাটফর্ম'
            : 'Apon Bazar Enterprise Financial Management, Multi-Tier Ledger & Regulatory Compliance'
        }
      />

      {/* Role-Based Access Control (RBAC) & Scope Simulation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-3">
        {/* Active Role & Security Clearance Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isBn ? 'বর্তমান অ্যাক্টিভ রোল ও পারমিশন:' : 'Active Role & Financial Scope:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-slate-950 shadow-sm">
                  {getRoleVisibleName(effectiveRole, language)}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isBn ? accessControl.scopeDescriptionBn : accessControl.scopeDescriptionEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Pending approvals badge */}
            {totalPendingQueue > 0 && accessControl.canApproveDisbursements && (
              <button
                onClick={() => setActiveTab('approval_queue')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span>
                  {totalPendingQueue} {isBn ? 'টি অনুমোদন বাকি' : 'Pending Approvals'}
                </span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isBn ? 'আইসোলেটেড ডেটা সিকিউরিটি' : 'Isolated Data Guard'}</span>
            </div>
          </div>
        </div>

        {/* Role Quick-Switch Toolbar for RBAC Demo & Compliance Testing */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">
              {isBn ? 'রোলভিত্তিক অ্যাক্সেস প্রিভিউ ও টেস্ট:' : 'Test Role Access Level:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {roleOptions.map((opt) => (
              <button
                key={opt.role}
                onClick={() => {
                  setSimulatedRole(opt.role);
                  showToast(
                    isBn
                      ? `রোল পরিবর্তন: ${opt.nameBn} অ্যাক্সেস লেভেল সচল`
                      : `Switched to ${opt.nameEn} Access Scope`
                  );
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                  effectiveRole === opt.role
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-105'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                {isBn ? opt.nameBn : opt.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Responsive Tabs Bar */}
        <div className="mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center gap-2 min-w-max p-1 bg-slate-900/80 rounded-2xl border border-slate-800">
            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isPermitted = isTabPermittedForRole(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : isPermitted
                      ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
                      : 'text-slate-500 hover:text-slate-400 bg-slate-950/40 opacity-70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : isPermitted ? 'text-slate-300' : 'text-slate-500'}`} />
                  <span>{isBn ? tab.labelBn : tab.labelEn}</span>
                  {!isPermitted && <Lock className="w-3 h-3 text-amber-500/80" />}
                  {typeof tab.badge === 'number' && tab.badge > 0 && isPermitted && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-slate-950 text-emerald-400' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Tab Content with Smooth Animation & Security Guard */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTab}-${effectiveRole}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {/* If user tries to view a tab unauthorized for their role */}
              {!isTabPermittedForRole(activeTab) ? (
                <div className="p-10 rounded-2xl bg-slate-900/90 border border-red-500/30 text-center max-w-2xl mx-auto shadow-2xl space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {isBn ? 'কোম্পানি-ব্যাপী আর্থিক তথ্যে প্রবেশাধিকার সংরক্ষিত' : 'Company-Wide Financial Ledger Access Restricted'}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {isBn
                      ? `আপনার বর্তমান ভূমিকা (${getRoleVisibleName(effectiveRole, 'bn')}) অনুযায়ী এই মডিউলের কোম্পানি-ব্যাপী তথ্য প্রদর্শনের অনুমতি নেই। সিকিউরিটি পলিসি অনুযায়ী শুধুমাত্র ফাউন্ডার, সুপার অ্যাডমিন এবং অর্পিত ফিন্যান্স অফিসার সার্বিক ট্রেজারি ও লেজার দেখতে পারেন।`
                      : `Under Apon Bazar security governance, universal ledger & treasury management is restricted to authorized Founder, Super Admin, and Finance Officers. Your role (${getRoleVisibleName(effectiveRole, 'en')}) is isolated to authorized scoped operations.`}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                    >
                      {isBn ? 'অনুমোদিত ড্যাশবোর্ড ওভারভিউতে ফিরুন' : 'Return to Permitted Overview'}
                    </button>
                    <button
                      onClick={() => setSimulatedRole('finance')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
                    >
                      {isBn ? 'ফিন্যান্স অফিসার হিসেবে দেখুন' : 'Switch to Finance Officer'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <FinanceOverviewTab
                      language={language}
                      dateFilter={dateFilter}
                      setDateFilter={setDateFilter}
                      customStartDate={customStartDate}
                      setCustomStartDate={setCustomStartDate}
                      customEndDate={customEndDate}
                      setCustomEndDate={setCustomEndDate}
                      metrics={computedMetrics}
                      onNavigateTab={(tabKey) => setActiveTab(tabKey as FinanceTabKey)}
                    />
                  )}

                  {activeTab === 'sales_revenue' && (
                    <FinanceSalesRevenueTab
                      language={language}
                      sales={sales}
                    />
                  )}

                  {activeTab === 'payments' && (
                    <FinancePaymentsTab
                      language={language}
                      payments={payments}
                      onVerifyPayment={handleVerifyPayment}
                    />
                  )}

                  {activeTab === 'settlements' && (
                    <FinanceSettlementsTab
                      language={language}
                      settlements={settlements}
                      onApproveSettlement={handleApproveSettlement}
                      onReleaseSettlement={handleReleaseSettlement}
                    />
                  )}

                  {activeTab === 'commissions' && (
                    <FinanceCommissionsTab
                      language={language}
                      commissions={commissions}
                      onDisburseCommission={handleDisburseCommission}
                    />
                  )}

                  {activeTab === 'expenses' && (
                    <FinanceExpensesTab
                      language={language}
                      expenses={expenses}
                      onCreateExpense={handleCreateExpense}
                      onApproveExpense={handleApproveExpense}
                      onRejectExpense={(id, reason) => {
                        setExpenses((prev) =>
                          prev.map((e) => (e.expenseId === id ? { ...e, status: 'Rejected', notes: reason } : e))
                        );
                        showToast(isBn ? 'খরচ ভাউচার বাতিল করা হয়েছে' : 'Expense voucher rejected');
                      }}
                    />
                  )}

                  {activeTab === 'profit_loss' && (
                    <FinanceProfitLossTab
                      language={language}
                      metrics={{
                        totalSales: computedMetrics.totalSales,
                        cogs: Math.round(computedMetrics.totalSales * 0.58),
                        totalCommission: computedMetrics.totalCommission,
                        totalDeliveryCost: Math.round(computedMetrics.totalSales * 0.04),
                        gatewayCharges: Math.round(computedMetrics.totalSales * 0.018),
                        refundAmount: computedMetrics.refundAmount,
                        totalExpense: computedMetrics.totalExpense,
                        netProfit: computedMetrics.netProfit
                      }}
                    />
                  )}

                  {activeTab === 'ledger' && (
                    <FinanceLedgerTab
                      language={language}
                      ledger={ledger}
                      onOpenAdjustModal={() => setIsAdjustModalOpen(true)}
                    />
                  )}

                  {activeTab === 'receivables_payables' && (
                    <FinanceReceivablesPayablesTab
                      language={language}
                      receivables={receivables}
                      payables={payables}
                      onDisbursePayable={(payableId) => {
                        setPayables((prev) =>
                          prev.map((p) =>
                            p.payableId === payableId
                              ? { ...p, paidAmount: p.totalAmount, outstandingAmount: 0, status: 'Paid' }
                              : p
                          )
                        );
                        showToast(isBn ? 'দেনা সফলভাবে পরিশোধ করা হয়েছে!' : 'Payable settled!');
                      }}
                    />
                  )}

                  {activeTab === 'refunds' && (
                    <FinanceRefundsTab
                      language={language}
                      refunds={refunds}
                      onProcessRefund={handleProcessRefund}
                      onRejectRefund={(refId, reason) => {
                        setRefunds((prev) =>
                          prev.map((r) => (r.refundId === refId ? { ...r, status: 'Rejected' } : r))
                        );
                        showToast(isBn ? 'রিফান্ড বাতিল করা হয়েছে' : 'Refund rejected');
                      }}
                    />
                  )}

                  {activeTab === 'accounts' && (
                    <FinanceAccountsTab
                      language={language}
                      accounts={accounts}
                      onTransferFunds={handleTransferFunds}
                    />
                  )}

                  {activeTab === 'reconciliation' && (
                    <FinanceReconciliationTab
                      language={language}
                      reconciliations={reconciliations}
                      onMatchReconciliation={handleMatchReconciliation}
                    />
                  )}

                  {activeTab === 'cash_flow' && (
                    <FinanceCashFlowTab
                      language={language}
                      metrics={{
                        totalSales: computedMetrics.totalSales,
                        totalExpense: computedMetrics.totalExpense,
                        totalCommission: computedMetrics.totalCommission,
                        totalSettlement: computedMetrics.paidSettlement,
                        refundAmount: computedMetrics.refundAmount
                      }}
                    />
                  )}

                  {activeTab === 'reports' && <FinanceReportsTab language={language} />}

                  {activeTab === 'audit_logs' && (
                    <FinanceAuditLogsTab language={language} auditLogs={auditLogs} />
                  )}

                  {activeTab === 'approval_queue' && (
                    <FinanceApprovalQueueTab
                      language={language}
                      pendingSettlements={settlements}
                      pendingExpenses={expenses}
                      onApproveSettlement={handleApproveSettlement}
                      onRejectSettlement={(id, reason) => {
                        setSettlements((prev) =>
                          prev.map((s) => (s.settlementId === id ? { ...s, status: 'Rejected' } : s))
                        );
                        showToast(isBn ? 'সেটেলমেন্ট বাতিল করা হয়েছে' : 'Settlement rejected');
                      }}
                      onApproveExpense={handleApproveExpense}
                      onRejectExpense={(id, reason) => {
                        setExpenses((prev) =>
                          prev.map((e) => (e.expenseId === id ? { ...e, status: 'Rejected' } : e))
                        );
                        showToast(isBn ? 'খরচ ভাউচার বাতিল করা হয়েছে' : 'Expense voucher rejected');
                      }}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Authorized Adjustment Voucher Modal */}
      <FinanceAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        language={language}
        onSaveAdjustment={handleSaveAdjustment}
      />
    </div>
  );
};
