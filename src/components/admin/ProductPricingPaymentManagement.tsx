import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  Save,
  X,
  History,
  Settings2,
  DollarSign,
  TrendingUp,
  Percent,
  Truck,
  Sparkles,
  Lock,
  Layers,
  HelpCircle,
  CreditCard,
  Building,
  Smartphone,
  Info,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useECommerce } from '../../context/ECommerceContext';
import { useNotifications } from '../../context/NotificationContext';
import { isImmutableSuperAdmin } from '../../lib/rbac';
import {
  Product,
  ProductPaymentOptions,
  PaymentChargesConfig,
  ProductPricingAuditLog
} from '../../types';
import {
  formatPrice,
  formatPV,
  DEFAULT_PRODUCT_PAYMENT_OPTIONS,
  DEFAULT_PAYMENT_CHARGES,
  getStoredPaymentCharges,
  saveStoredPaymentCharges,
  getProductPaymentOptions,
  calculatePaymentCharge,
  calculateProductPricing
} from '../../lib/pricing';
import { ProductVatPricingSection, ProductVatPricingValues } from '../products/ProductVatPricingSection';
import { resolveProductVatPricing, getStoredGlobalVatSettings, round2 } from '../../lib/vatPricingEngine';

export const ProductPricingPaymentManagement: React.FC = () => {
  const { currentUser, addAuditLog } = useAuth();
  const { products, editProduct, categories, brands } = useECommerce();
  const { addToast } = useNotifications();

  // 1. Super Admin Security Guard
  const isAuthorized = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'founder' ||
      isImmutableSuperAdmin(currentUser)
    );
  }, [currentUser]);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'mrp_asc' | 'mrp_desc' | 'selling_asc' | 'selling_desc' | 'pv_desc' | 'discount_desc'>('mrp_desc');

  // Modals & Drawers
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isChargesModalOpen, setIsChargesModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isSavingCharges, setIsSavingCharges] = useState(false);
  const [chargesSaveError, setChargesSaveError] = useState<string | null>(null);

  // Payment Charges Configuration
  const [chargesConfig, setChargesConfig] = useState<PaymentChargesConfig>(() => getStoredPaymentCharges());
  const [tempCharges, setTempCharges] = useState<PaymentChargesConfig>(() => getStoredPaymentCharges());

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<ProductPricingAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('apon_bazar_pricing_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'log-init-1',
        productId: 'prod-samsung-tv-43',
        productName: 'Samsung LED TV 43 Inch Crystal 4K UHD Smart Television',
        changedField: 'Initial Configuration',
        previousValue: 'N/A',
        newValue: 'MRP: ৳1500, DP: ৳1000, Disc: 1%, PV: 40',
        changedBy: 'Super Admin',
        changedByRole: 'super_admin',
        dateTime: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'log-init-2',
        productId: 'prod-aano-1500',
        productName: 'Apon Bazar Premium Cold Pressed Mustard Oil 5L',
        changedField: 'Initial Configuration',
        previousValue: 'N/A',
        newValue: 'MRP: ৳1500, DP: ৳1000, Disc: 1%, PV: 40',
        changedBy: 'Super Admin',
        changedByRole: 'super_admin',
        dateTime: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  });

  const [auditSearch, setAuditSearch] = useState('');

  // Persist Audit Logs
  useEffect(() => {
    try {
      localStorage.setItem('apon_bazar_pricing_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  // Edit Modal Form State
  const [editForm, setEditForm] = useState<{
    mrp: number;
    mrpExclTax: number;
    mrpInclTax: number;
    sellingPrice: number;
    sellingPriceExclTax: number;
    sellingPriceInclTax: number;
    taxRate: number;
    taxMode: 'included' | 'excluded';
    taxSource: 'global' | 'custom';
    discount: number;
    discountAmount: number;
    isManualOverride: boolean;
    dealerPrice: number;
    vatTax: number;
    deliveryCost: number;
    pvMode: 'auto' | 'manual';
    manualPv: number;
    paymentOptions: ProductPaymentOptions;
  }>({
    mrp: 1150,
    mrpExclTax: 1000,
    mrpInclTax: 1150,
    sellingPrice: 1035,
    sellingPriceExclTax: 900,
    sellingPriceInclTax: 1035,
    taxRate: 15,
    taxMode: 'included',
    taxSource: 'global',
    discount: 10,
    discountAmount: 100,
    isManualOverride: false,
    dealerPrice: 800,
    vatTax: 15,
    deliveryCost: 60,
    pvMode: 'auto',
    manualPv: 40,
    paymentOptions: { ...DEFAULT_PRODUCT_PAYMENT_OPTIONS }
  });

  // Open Edit Modal
  const handleOpenEdit = (product: Product) => {
    const opts = getProductPaymentOptions(product);
    const pvMode = product.pvMode || 'auto';
    const manualPv = product.manualPv !== undefined ? product.manualPv : (product.pvValue || product.pvPoint || 0);
    const resolvedVat = resolveProductVatPricing(product);

    setProductSaveError(null);
    setIsSavingProduct(false);
    setEditForm({
      mrp: resolvedVat.vatTaxMode === 'included' ? resolvedVat.mrpInclTax : resolvedVat.mrpExclTax,
      mrpExclTax: resolvedVat.mrpExclTax,
      mrpInclTax: resolvedVat.mrpInclTax,
      sellingPrice: resolvedVat.vatTaxMode === 'included' ? resolvedVat.sellingPriceInclTax : resolvedVat.sellingPriceExclTax,
      sellingPriceExclTax: resolvedVat.sellingPriceExclTax,
      sellingPriceInclTax: resolvedVat.sellingPriceInclTax,
      taxRate: resolvedVat.effectiveVatRate,
      taxMode: resolvedVat.vatTaxMode,
      taxSource: resolvedVat.taxSource,
      discount: resolvedVat.discountPercentage,
      discountAmount: resolvedVat.discountAmount,
      isManualOverride: resolvedVat.isManualOverride,
      dealerPrice: product.dealerPrice !== undefined ? product.dealerPrice : 0,
      vatTax: resolvedVat.effectiveVatRate,
      deliveryCost: product.deliveryCost !== undefined ? product.deliveryCost : 60,
      pvMode,
      manualPv,
      paymentOptions: { ...opts }
    });
    setEditingProduct(product);
  };

  // Real-time calculation within Edit Form
  const editMetrics = useMemo(() => {
    const mrp = Math.max(0, Number(editForm.mrp) || 0);
    const dealerPrice = Math.max(0, Number(editForm.dealerPrice) || 0);
    const discount = Math.max(0, Number(editForm.discount) || 0);
    const deliveryCost = Math.max(0, Number(editForm.deliveryCost) || 0);
    const vatTax = Math.max(0, Number(editForm.taxRate ?? editForm.vatTax) || 0);

    const discountAmount = editForm.discountAmount !== undefined ? editForm.discountAmount : Number(((mrp * discount) / 100).toFixed(2));
    const sellingPrice = editForm.sellingPrice !== undefined ? editForm.sellingPrice : Math.max(0, Number((mrp - discountAmount).toFixed(2)));

    // Gross Profit = Selling Price (Excl VAT basis preferred) - Dealer Price
    const baseSellingPrice = editForm.sellingPriceExclTax || sellingPrice;
    const grossProfit = Math.max(0, Number((baseSellingPrice - dealerPrice).toFixed(2)));
    const adminCost = Number((grossProfit * 0.20).toFixed(2));
    const pvValue = Math.max(0, Number((grossProfit - adminCost).toFixed(2)));
    const calculatedPv = Number((pvValue / 10).toFixed(2));

    const effectivePv =
      editForm.pvMode === 'manual' && editForm.manualPv !== undefined && !isNaN(editForm.manualPv)
        ? Number(editForm.manualPv)
        : calculatedPv;

    const vatAmount = editForm.taxMode === 'included'
      ? round2(editForm.sellingPriceInclTax - (editForm.sellingPriceExclTax || 0))
      : Number(((sellingPrice * vatTax) / 100).toFixed(2));
    const subtotal = Number((sellingPrice + deliveryCost).toFixed(2));

    const bkash = calculatePaymentCharge(subtotal, 'bkash', chargesConfig);
    const nagad = calculatePaymentCharge(subtotal, 'nagad', chargesConfig);
    const rocket = calculatePaymentCharge(subtotal, 'rocket', chargesConfig);
    const bank = calculatePaymentCharge(subtotal, 'bank', chargesConfig);

    return {
      mrp,
      dealerPrice,
      discount,
      discountAmount,
      sellingPrice,
      grossProfit,
      adminCost,
      pvValue,
      calculatedPv,
      effectivePv,
      deliveryCost,
      vatTax,
      vatAmount,
      subtotal,
      codTotal: subtotal,
      bkashTotal: Number((subtotal + bkash.charge).toFixed(2)),
      bkashCharge: bkash.charge,
      nagadTotal: Number((subtotal + nagad.charge).toFixed(2)),
      nagadCharge: nagad.charge,
      rocketTotal: Number((subtotal + rocket.charge).toFixed(2)),
      rocketCharge: rocket.charge,
      bankTotal: Number((subtotal + bank.charge).toFixed(2)),
      bankCharge: bank.charge
    };
  }, [editForm, chargesConfig]);

  // Save Product Pricing & Payment Options
  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setProductSaveError(null);

    // Strict validation
    if (editForm.mrp === undefined || editForm.mrp < 0) {
      setProductSaveError('MRP অবশ্যই ০ বা তার বেশি হতে হবে!');
      return;
    }
    if (editForm.dealerPrice === undefined || editForm.dealerPrice < 0) {
      setProductSaveError('Dealer Price অবশ্যই ০ বা তার বেশি হতে হবে!');
      return;
    }
    if (editForm.discount < 0 || editForm.discount > 100) {
      setProductSaveError('ডিসকাউন্ট ০% থেকে ১০০% এর মধ্যে হতে হবে!');
      return;
    }
    if (editForm.vatTax < 0 || editForm.vatTax > 100) {
      setProductSaveError('ভ্যাট/ট্যাক্স ০% থেকে ১০০% এর মধ্যে হতে হবে!');
      return;
    }
    if (editForm.deliveryCost < 0) {
      setProductSaveError('ডেলিভারি খরচ ০ বা তার বেশি হতে হবে!');
      return;
    }
    if (editForm.pvMode === 'manual' && (editForm.manualPv === undefined || editForm.manualPv < 0)) {
      setProductSaveError('ম্যানুয়াল PV পয়েন্ট অবশ্যই ০ বা তার বেশি হতে হবে!');
      return;
    }

    setIsSavingProduct(true);
    try {
      await new Promise((r) => setTimeout(r, 250));

      const newLogs: ProductPricingAuditLog[] = [];
      const actorName = currentUser?.name || currentUser?.email || 'Super Admin';
      const actorRole = currentUser?.role || 'super_admin';
      const time = new Date().toISOString();
      const prodName = editingProduct.titleBn || editingProduct.title;

      // Helper to log changes
      const checkAndLog = (field: string, oldVal: any, newVal: any) => {
        if (oldVal !== newVal) {
          newLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            productId: editingProduct.id,
            productName: prodName,
            changedField: field,
            previousValue: oldVal,
            newValue: newVal,
            changedBy: actorName,
            changedByRole: actorRole,
            dateTime: time
          });
        }
      };

      checkAndLog('MRP', editingProduct.mrp, editForm.mrp);
      checkAndLog('MRP Excl Tax', editingProduct.mrpExclTax, editForm.mrpExclTax);
      checkAndLog('MRP Incl Tax', editingProduct.mrpInclTax, editForm.mrpInclTax);
      checkAndLog('Selling Price Excl Tax', editingProduct.sellingPriceExclTax, editForm.sellingPriceExclTax);
      checkAndLog('Selling Price Incl Tax', editingProduct.sellingPriceInclTax, editForm.sellingPriceInclTax);
      checkAndLog('VAT/Tax Mode', editingProduct.taxMode || 'included', editForm.taxMode);
      checkAndLog('Dealer Price', editingProduct.dealerPrice, editForm.dealerPrice);
      checkAndLog('Discount (%)', editingProduct.discount, editForm.discount);
      checkAndLog('VAT/Tax (%)', editingProduct.vatTax, editForm.taxRate ?? editForm.vatTax);
      checkAndLog('Delivery Cost', editingProduct.deliveryCost, editForm.deliveryCost);
      checkAndLog('PV Mode', editingProduct.pvMode || 'auto', editForm.pvMode);

      const oldEffectivePv = editingProduct.pvMode === 'manual' ? editingProduct.manualPv : (editingProduct.pvValue || editingProduct.pvPoint);
      checkAndLog('Effective PV', oldEffectivePv, editMetrics.effectivePv);

      // Payment options comparison
      const oldOpts = getProductPaymentOptions(editingProduct);
      if (oldOpts.nagad !== editForm.paymentOptions.nagad) {
        checkAndLog('Payment Option: Nagad', oldOpts.nagad ? 'Enabled' : 'Disabled', editForm.paymentOptions.nagad ? 'Enabled' : 'Disabled');
      }
      if (oldOpts.bkash !== editForm.paymentOptions.bkash) {
        checkAndLog('Payment Option: bKash', oldOpts.bkash ? 'Enabled' : 'Disabled', editForm.paymentOptions.bkash ? 'Enabled' : 'Disabled');
      }
      if (oldOpts.rocket !== editForm.paymentOptions.rocket) {
        checkAndLog('Payment Option: Rocket', oldOpts.rocket ? 'Enabled' : 'Disabled', editForm.paymentOptions.rocket ? 'Enabled' : 'Disabled');
      }
      if (oldOpts.bank !== editForm.paymentOptions.bank) {
        checkAndLog('Payment Option: Bank', oldOpts.bank ? 'Enabled' : 'Disabled', editForm.paymentOptions.bank ? 'Enabled' : 'Disabled');
      }
      if (oldOpts.cod !== editForm.paymentOptions.cod) {
        checkAndLog('Payment Option: Cash on Delivery', oldOpts.cod ? 'Enabled' : 'Disabled', editForm.paymentOptions.cod ? 'Enabled' : 'Disabled');
      }

      // Apply updates via ECommerceContext
      editProduct(editingProduct.id, {
        mrp: editForm.mrp,
        mrpExclTax: editForm.mrpExclTax,
        mrpInclTax: editForm.mrpInclTax,
        dealerPrice: editForm.dealerPrice,
        sellingPrice: editForm.sellingPrice,
        sellingPriceExclTax: editForm.sellingPriceExclTax,
        sellingPriceInclTax: editForm.sellingPriceInclTax,
        discount: editForm.discount,
        discountAmount: editForm.discountAmount,
        isDiscountOverridden: Number(editForm.discount) > 0,
        discount_scope: Number(editForm.discount) > 0 ? 'product' : 'global',
        discount_source: Number(editForm.discount) > 0 ? 'Product Override' : 'Global',
        campaignPrice: editForm.sellingPrice,
        discountPrice: editForm.sellingPrice,
        vatTax: editForm.taxRate ?? editForm.vatTax,
        taxRate: editForm.taxRate ?? editForm.vatTax,
        taxMode: editForm.taxMode,
        taxSource: editForm.taxSource,
        isManualOverride: editForm.isManualOverride,
        deliveryCost: editForm.deliveryCost,
        pvMode: editForm.pvMode,
        manualPv: editForm.pvMode === 'manual' ? editForm.manualPv : undefined,
        pvValue: editMetrics.effectivePv,
        pvPoint: editMetrics.effectivePv,
        profit: editMetrics.grossProfit,
        adminCost: editMetrics.adminCost,
        netProfit: editMetrics.pvValue,
        paymentOptions: { ...editForm.paymentOptions }
      });

      if (newLogs.length > 0) {
        setAuditLogs((prev) => [...newLogs, ...prev]);
        if (addAuditLog) {
          addAuditLog(
            'UPDATE_PRODUCT_PRICING',
            'Product',
            `Product Pricing updated for ${prodName} (${newLogs.length} fields changed)`
          );
        }
      }

      addToast(
        'প্রাইসিং ও পেমেন্ট সংরক্ষিত',
        `${prodName}-এর নতুন মূল্য ও পেমেন্ট সেটিংস সফলভাবে আপডেট করা হয়েছে।`
      );

      setEditingProduct(null);
    } catch (err: any) {
      setProductSaveError(err?.message || 'পণ্য মূল্য সংরক্ষণ ব্যর্থ হয়েছে');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Quick toggle payment option directly from the table
  const handleQuickTogglePayment = (product: Product, key: keyof ProductPaymentOptions) => {
    const currentOpts = getProductPaymentOptions(product);
    const newOpts: ProductPaymentOptions = {
      ...currentOpts,
      [key]: !currentOpts[key]
    };

    const actorName = currentUser?.name || currentUser?.email || 'Super Admin';
    const actorRole = currentUser?.role || 'super_admin';
    const time = new Date().toISOString();
    const prodName = product.titleBn || product.title;

    const logEntry: ProductPricingAuditLog = {
      id: `log-${Date.now()}-${key}`,
      productId: product.id,
      productName: prodName,
      changedField: `Quick Toggle: ${key.toUpperCase()}`,
      previousValue: currentOpts[key] ? 'Enabled' : 'Disabled',
      newValue: newOpts[key] ? 'Enabled' : 'Disabled',
      changedBy: actorName,
      changedByRole: actorRole,
      dateTime: time
    };

    setAuditLogs((prev) => [logEntry, ...prev]);

    editProduct(product.id, {
      paymentOptions: newOpts
    });

    addToast(
      'পেমেন্ট অপশন আপডেট',
      `${prodName}-এ ${key.toUpperCase()} ${newOpts[key] ? 'চালু' : 'বন্ধ'} করা হয়েছে।`
    );
  };

  // Save Payment Charge Rates
  const handleSavePaymentCharges = async () => {
    setChargesSaveError(null);
    if (
      tempCharges.bkashRate < 0 || tempCharges.bkashRate > 100 ||
      tempCharges.nagadRate < 0 || tempCharges.nagadRate > 100 ||
      tempCharges.rocketRate < 0 || tempCharges.rocketRate > 100 ||
      tempCharges.bankRate < 0 || tempCharges.bankRate > 100 ||
      tempCharges.codRate < 0 || tempCharges.codRate > 100
    ) {
      setChargesSaveError('সকল গেটওয়ে চার্জ রেট অবশ্যই ০% থেকে ১০০% এর মধ্যে হতে হবে!');
      return;
    }

    setIsSavingCharges(true);
    try {
      await new Promise((r) => setTimeout(r, 250));

      setChargesConfig(tempCharges);
      saveStoredPaymentCharges(tempCharges);

      const logEntry: ProductPricingAuditLog = {
        id: `log-${Date.now()}-charges`,
        productId: 'GLOBAL-SETTINGS',
        productName: 'Global Gateway Charges',
        changedField: 'Payment Gateway Charges',
        previousValue: `bKash: ${chargesConfig.bkashRate}%, Nagad: ${chargesConfig.nagadRate}%, Rocket: ${chargesConfig.rocketRate}%, Bank: ${chargesConfig.bankRate}%, COD: ${chargesConfig.codRate}%`,
        newValue: `bKash: ${tempCharges.bkashRate}%, Nagad: ${tempCharges.nagadRate}%, Rocket: ${tempCharges.rocketRate}%, Bank: ${tempCharges.bankRate}%, COD: ${tempCharges.codRate}%`,
        changedBy: currentUser?.name || 'Super Admin',
        changedByRole: currentUser?.role || 'super_admin',
        dateTime: new Date().toISOString()
      };

      setAuditLogs((prev) => [logEntry, ...prev]);

      addToast('পেমেন্ট চার্জ কনফিগারেশন সংরক্ষিত', 'সকল পেমেন্ট গেটওয়ের পারসেন্টেজ রেট আপডেট করা হয়েছে।');
      setIsChargesModalOpen(false);
    } catch (err: any) {
      setChargesSaveError(err?.message || 'চার্জ কনফিগারেশন সংরক্ষণে ত্রুটি দেখা দিয়েছে');
    } finally {
      setIsSavingCharges(false);
    }
  };

  // Filtered & Sorted Products List
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const title = (prod.title || '').toLowerCase();
        const titleBn = (prod.titleBn || '').toLowerCase();
        const sku = (prod.sku || '').toLowerCase();
        const brand = (prod.brandName || '').toLowerCase();
        if (!title.includes(q) && !titleBn.includes(q) && !sku.includes(q) && !brand.includes(q)) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'all' && prod.categoryId !== selectedCategory) {
        return false;
      }

      // Brand
      if (selectedBrand !== 'all' && prod.brandId !== selectedBrand && prod.brandName !== selectedBrand) {
        return false;
      }

      // Payment Filter
      const opts = getProductPaymentOptions(prod);
      if (paymentFilter === 'nagad' && !opts.nagad) return false;
      if (paymentFilter === 'bkash' && !opts.bkash) return false;
      if (paymentFilter === 'rocket' && !opts.rocket) return false;
      if (paymentFilter === 'bank' && !opts.bank) return false;
      if (paymentFilter === 'cod' && !opts.cod) return false;
      if (paymentFilter === 'rocket_disabled' && opts.rocket) return false;
      if (paymentFilter === 'nagad_disabled' && opts.nagad) return false;
      if (paymentFilter === 'cod_disabled' && opts.cod) return false;

      return true;
    }).sort((a, b) => {
      const mrpA = a.mrp || 0;
      const mrpB = b.mrp || 0;
      const sellA = a.campaignPrice || (mrpA - (mrpA * (a.discount || 0)) / 100);
      const sellB = b.campaignPrice || (mrpB - (mrpB * (b.discount || 0)) / 100);
      const pvA = a.pvValue || a.pvPoint || 0;
      const pvB = b.pvValue || b.pvPoint || 0;

      if (sortBy === 'name') {
        return (a.titleBn || a.title || '').localeCompare(b.titleBn || b.title || '');
      }
      if (sortBy === 'mrp_desc') return mrpB - mrpA;
      if (sortBy === 'mrp_asc') return mrpA - mrpB;
      if (sortBy === 'selling_desc') return sellB - sellA;
      if (sortBy === 'selling_asc') return sellA - sellB;
      if (sortBy === 'pv_desc') return pvB - pvA;
      if (sortBy === 'discount_desc') return (b.discount || 0) - (a.discount || 0);

      return 0;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, paymentFilter, sortBy]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.productName.toLowerCase().includes(q) ||
        log.changedField.toLowerCase().includes(q) ||
        log.changedBy.toLowerCase().includes(q) ||
        String(log.previousValue).toLowerCase().includes(q) ||
        String(log.newValue).toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  // 403 Security Denial View if unauthorized
  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-12">
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500/50 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50 dark:ring-red-950">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-red-700 dark:text-red-300 tracking-tight">
            403 Security Exception: অ্যাক্সেস নিষিদ্ধ (Unauthorized Access)
          </h2>
          <p className="text-sm text-red-600/90 dark:text-red-300/80 max-w-lg mx-auto leading-relaxed">
            শুধুমাত্র <strong>Super Admin</strong> এই Product Pricing & Payment Management সিস্টেমের গোপনীয় তথ্য (যেমন ডিলার প্রাইজ, গ্রস প্রফিট, ইন্টারনাল কমিশন) দেখতে ও সম্পাদনা করতে পারবেন।
          </p>
          <div className="pt-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-white/60 dark:bg-neutral-900/60 p-3 rounded-xl max-w-md mx-auto border border-neutral-200 dark:border-neutral-800">
            Your Current Role: <span className="font-bold text-red-600">{currentUser?.role || 'Guest/Unauthorized'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  প্রোডাক্ট প্রাইসিং ও পেমেন্ট ব্যবস্থাপনা
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Super Admin Only
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  MRP, ডিলার প্রাইজ, ডিসকাউন্ট, ভ্যাট, ডেলিভারি কস্ট, PV মোড ও পেমেন্ট মেথড নিয়ন্ত্রণ প্যানেল
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setTempCharges({ ...chargesConfig });
                setIsChargesModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors border border-neutral-200 dark:border-neutral-700"
            >
              <Settings2 className="w-4 h-4 text-emerald-600" />
              পেমেন্ট চার্জ সেটিংস
            </button>

            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors border border-neutral-200 dark:border-neutral-700"
            >
              <History className="w-4 h-4 text-blue-600" />
              অডিট হিস্ট্রি ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* Super Admin Notice Card */}
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="leading-relaxed">
            <span className="font-bold">গোপনীয়তা নিয়মাবলী:</span> ডিলার প্রাইজ, গ্রস প্রফিট, ২০% অ্যাডমিন কস্ট এবং ইন্টারনাল কমিশন শুধুমাত্র Super Admin ড্যাশবোর্ডে দৃশ্যমান। কাস্টমার চেকআউটে কেবল <strong>Selling Price</strong>, <strong>Delivery Cost</strong>, <strong>VAT/Tax</strong>, <strong>PV</strong> ও <strong>Payment Charge</strong> প্রদর্শিত হবে।
          </div>
        </div>
      </div>

      {/* 2. KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">মোট পণ্য তালিকা</span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1 block">
            {products.length} টি
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">বিকাশ গেটওয়ে চার্জ</span>
          <span className="text-xl sm:text-2xl font-black text-pink-600 dark:text-pink-400 mt-1 block">
            {chargesConfig.bkashRate}%
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">নগদ গেটওয়ে চার্জ</span>
          <span className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
            {chargesConfig.nagadRate}%
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">ক্যাশ অন ডেলিভারি (COD)</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {chargesConfig.codRate}% (৳০)
          </span>
        </div>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="পণ্যের নাম, SKU বা ব্র্যান্ড দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল ক্যাটাগরি</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল পেমেন্ট অপশন</option>
              <option value="nagad">নগদ (Nagad) সক্রিয়</option>
              <option value="bkash">বিকাশ (bKash) সক্রিয়</option>
              <option value="rocket">রকেট (Rocket) সক্রিয়</option>
              <option value="bank">ব্যাংক (Bank) সক্রিয়</option>
              <option value="cod">ক্যাশ অন ডেলিভারি (COD) সক্রিয়</option>
              <option value="rocket_disabled">রকেট নিষ্ক্রিয় পণ্য</option>
              <option value="nagad_disabled">নগদ নিষ্ক্রিয় পণ্য</option>
              <option value="cod_disabled">COD নিষ্ক্রিয় পণ্য</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="mrp_desc">MRP: বেশি থেকে কম</option>
              <option value="mrp_asc">MRP: কম থেকে বেশি</option>
              <option value="selling_desc">Selling Price: বেশি থেকে কম</option>
              <option value="selling_asc">Selling Price: কম থেকে বেশি</option>
              <option value="pv_desc">PV: সর্বোচ্চ পয়েন্ট</option>
              <option value="discount_desc">সর্বোচ্চ ডিসকাউন্ট (%)</option>
              <option value="name">নামানুসারে (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
          <span>
            প্রদর্শিত হচ্ছে: <strong>{filteredProducts.length}</strong> / {products.length} টি পণ্য
          </span>
          {(searchQuery || selectedCategory !== 'all' || paymentFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedBrand('all');
                setPaymentFilter('all');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
            >
              ফিল্টার রিসেট করুন
            </button>
          )}
        </div>
      </div>

      {/* 4. Desktop Product List Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-3 text-right">MRP</th>
                <th className="py-3.5 px-3 text-right text-amber-700 dark:text-amber-400">
                  <span className="inline-flex items-center gap-1 justify-end">
                    <Lock className="w-3 h-3 text-amber-500" /> Dealer Price
                  </span>
                </th>
                <th className="py-3.5 px-3 text-right">Discount</th>
                <th className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400">Selling Price</th>
                <th className="py-3.5 px-3 text-right">VAT/Tax</th>
                <th className="py-3.5 px-3 text-right">Delivery Cost</th>
                <th className="py-3.5 px-3 text-center">Payment Options</th>
                <th className="py-3.5 px-3 text-right text-purple-600 dark:text-purple-400">PV</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-400">
                    কোনো পণ্য খুঁজে পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const pricing = calculateProductPricing(p);
                  const mrp = pricing.mrp;
                  const dealerPrice = p.dealerPrice !== undefined ? p.dealerPrice : 0;
                  const discountPct = pricing.discountPercent;
                  const discountAmt = pricing.discountAmount;
                  const sellingPrice = pricing.sellingPrice;
                  const vatPct = pricing.vatTaxPercent;
                  const vatAmt = pricing.vatTaxAmount;
                  const delivery = pricing.deliveryCost;

                  const opts = getProductPaymentOptions(p);
                  const pv = pricing.pv;
                  const isManualPv = p.pvMode === 'manual';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                            alt={p.title}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-neutral-900 dark:text-white block truncate text-xs" title={p.titleBn || p.title}>
                              {p.titleBn || p.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                              <span className="font-mono">{p.sku}</span>
                              <span>•</span>
                              <span className="truncate">{p.brandName || 'Apon Bazar'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* MRP */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                        {formatPrice(mrp)}
                      </td>

                      {/* Dealer Price (Super Admin Only) */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                        <div className="flex flex-col items-end">
                          <span>{formatPrice(dealerPrice)}</span>
                          <span className="text-[9px] text-amber-600 font-normal">Internal</span>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                            {discountPct}%
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            -{formatPrice(discountAmt)}
                          </span>
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatPrice(sellingPrice)}
                      </td>

                      {/* VAT/Tax */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <div className="flex flex-col items-end">
                          <span className="text-neutral-700 dark:text-neutral-300 font-bold">{formatPrice(vatAmt)}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">{vatPct}%</span>
                        </div>
                      </td>

                      {/* Delivery Cost */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-neutral-700 dark:text-neutral-300">
                        {formatPrice(delivery)}
                      </td>

                      {/* Payment Options */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Nagad */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePayment(p, 'nagad')}
                            title={`Nagad: ${opts.nagad ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              opts.nagad
                                ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            }`}
                          >
                            নগদ {opts.nagad ? '✓' : '✕'}
                          </button>

                          {/* bKash */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePayment(p, 'bkash')}
                            title={`bKash: ${opts.bkash ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              opts.bkash
                                ? 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            }`}
                          >
                            বিকাশ {opts.bkash ? '✓' : '✕'}
                          </button>

                          {/* Rocket */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePayment(p, 'rocket')}
                            title={`Rocket: ${opts.rocket ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              opts.rocket
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            }`}
                          >
                            রকেট {opts.rocket ? '✓' : '✕'}
                          </button>

                          {/* Bank */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePayment(p, 'bank')}
                            title={`Bank: ${opts.bank ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              opts.bank
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            }`}
                          >
                            ব্যাংক {opts.bank ? '✓' : '✕'}
                          </button>

                          {/* COD */}
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePayment(p, 'cod')}
                            title={`COD: ${opts.cod ? 'Enabled' : 'Disabled'} (Click to toggle)`}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              opts.cod
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700'
                            }`}
                          >
                            COD {opts.cod ? '✓' : '✕'}
                          </button>
                        </div>
                      </td>

                      {/* PV */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-black text-purple-700 dark:text-purple-300 text-sm">
                            {formatPV(pv)} PV
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              isManualPv
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {isManualPv ? 'Manual' : 'Auto'}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
                            title="Edit Pricing & Payment Options"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingProduct(p)}
                            className="p-1.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
                            title="View Full Pricing Summary"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Mobile Product Cards List */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            কোনো পণ্য খুঁজে পাওয়া যায়নি।
          </div>
        ) : (
          filteredProducts.map((p) => {
            const pricing = calculateProductPricing(p);
            const mrp = pricing.mrp;
            const dealerPrice = p.dealerPrice !== undefined ? p.dealerPrice : 0;
            const discountPct = pricing.discountPercent;
            const discountAmt = pricing.discountAmount;
            const sellingPrice = pricing.sellingPrice;
            const vatPct = pricing.vatTaxPercent;
            const vatAmt = pricing.vatTaxAmount;
            const delivery = pricing.deliveryCost;
            const opts = getProductPaymentOptions(p);
            const pv = pricing.pv;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                    alt={p.title}
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white line-clamp-1">
                      {p.titleBn || p.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-0.5">
                      <span className="font-mono">{p.sku}</span>
                      <span>•</span>
                      <span>{p.brandName || 'Apon Bazar'}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-emerald-600 font-black text-sm">
                        {formatPrice(sellingPrice)}
                      </span>
                      <span className="text-[10px] text-neutral-400 line-through">
                        {formatPrice(mrp)}
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold">
                        {discountPct}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Internal Super Admin Financials Strip */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-[11px]">
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Dealer Price</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                      {formatPrice(dealerPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">Delivery / VAT</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                      {formatPrice(delivery)} / {formatPrice(vatAmt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">PV Point</span>
                    <span className="font-black text-purple-700 dark:text-purple-300 font-mono">
                      {formatPV(pv)} PV
                    </span>
                  </div>
                </div>

                {/* Payment Options Badges */}
                <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${opts.nagad ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-neutral-100 text-neutral-400 line-through'}`}>
                      নগদ {opts.nagad ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${opts.bkash ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-neutral-100 text-neutral-400 line-through'}`}>
                      বিকাশ {opts.bkash ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${opts.rocket ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-neutral-100 text-neutral-400 line-through'}`}>
                      রকেট {opts.rocket ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${opts.bank ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-neutral-100 text-neutral-400 line-through'}`}>
                      ব্যাংক {opts.bank ? '✓' : '✕'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${opts.cod ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-400 line-through'}`}>
                      COD {opts.cod ? '✓' : '✕'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => setViewingProduct(p)}
                      className="p-1 rounded-lg text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Edit Product Pricing & Payment Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-2xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    প্রাইসিং ও পেমেন্ট সম্পাদনা
                  </h2>
                  <p className="text-xs text-neutral-500 truncate max-w-md">
                    {editingProduct.titleBn || editingProduct.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {productSaveError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{productSaveError}</span>
                </div>
              )}

              {/* Product Info Bar */}
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200/80 dark:border-neutral-700">
                <img
                  src={editingProduct.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                  alt={editingProduct.title}
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {editingProduct.titleBn || editingProduct.title}
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    SKU: {editingProduct.sku} | Brand: {editingProduct.brandName}
                  </p>
                </div>
              </div>

              {/* Product Pricing & VAT/Tax Management Matrix */}
              <ProductVatPricingSection
                values={{
                  mrpExclTax: editForm.mrpExclTax,
                  mrpInclTax: editForm.mrpInclTax,
                  sellingPriceExclTax: editForm.sellingPriceExclTax,
                  sellingPriceInclTax: editForm.sellingPriceInclTax,
                  taxRate: editForm.taxRate ?? editForm.vatTax,
                  taxMode: editForm.taxMode || 'included',
                  taxSource: editForm.taxSource || 'global',
                  discount: editForm.discount,
                  discountAmount: editForm.discountAmount,
                  isManualOverride: editForm.isManualOverride
                }}
                onChange={(updates) => {
                  setEditForm((prev) => ({
                    ...prev,
                    ...updates,
                    vatTax: updates.taxRate !== undefined ? updates.taxRate : (updates.vatTax !== undefined ? updates.vatTax : prev.vatTax)
                  }));
                }}
                dealerPrice={editForm.dealerPrice}
                onDealerPriceChange={(dealerPrice) => setEditForm((prev) => ({ ...prev, dealerPrice }))}
              />

              {/* Delivery Cost & PV Mode Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Delivery Cost */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    ডেলিভারি খরচ (Delivery Cost) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.deliveryCost}
                    onChange={(e) => setEditForm({ ...editForm, deliveryCost: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {/* PV Mode Selection */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-neutral-700 dark:text-neutral-300">
                    PV হিসাব মোড (PV Mode) *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, pvMode: 'auto' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        editForm.pvMode === 'auto'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      স্বয়ংক্রিয় (Automatic)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, pvMode: 'manual' })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        editForm.pvMode === 'manual'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      ম্যানুয়াল (Manual Override)
                    </button>
                  </div>
                </div>
              </div>

              {/* Manual PV Input if Manual Mode */}
              {editForm.pvMode === 'manual' ? (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1 text-xs">
                  <label className="font-bold text-amber-900 dark:text-amber-200">
                    ম্যানুয়াল PV এন্টার করুন (Manual Override PV):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.manualPv}
                    onChange={(e) => setEditForm({ ...editForm, manualPv: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">
                    স্বয়ংক্রিয় ফর্মুলা অনুযায়ী PV হতো: <strong>{editMetrics.calculatedPv} PV</strong>
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 rounded-xl text-xs text-purple-900 dark:text-purple-300 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>স্বয়ংক্রিয় PV ফর্মুলা অনুযায়ী হিসাব:</span>
                    <span className="font-black text-sm">{editMetrics.calculatedPv} PV</span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-700 dark:text-purple-400 leading-relaxed">
                    Gross Profit (৳{editMetrics.mrp} - ৳{editMetrics.dealerPrice} = ৳{editMetrics.grossProfit}) − Admin Cost 20% (৳{editMetrics.adminCost}) = PV Value ৳{editMetrics.pvValue} ÷ 10 = {editMetrics.calculatedPv} PV
                  </div>
                </div>
              )}

              {/* Payment Options Toggles */}
              <div className="space-y-2 text-xs">
                <label className="font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>পেমেন্ট অপশন নিয়ন্ত্রণ (Payment Options):</span>
                  <span className="text-[10px] text-neutral-400">
                    অনির্ধারিত অপশন কাস্টমার চেকআউটে প্রদর্শিত হবে না
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* Nagad */}
                  <label
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        paymentOptions: { ...editForm.paymentOptions, nagad: !editForm.paymentOptions.nagad }
                      })
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                      editForm.paymentOptions.nagad
                        ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-orange-600" />
                    <span className="text-xs">নগদ (Nagad)</span>
                    <span className="text-[9px]">{editForm.paymentOptions.nagad ? 'সক্রিয় ✓' : 'বন্ধ ✕'}</span>
                  </label>

                  {/* bKash */}
                  <label
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        paymentOptions: { ...editForm.paymentOptions, bkash: !editForm.paymentOptions.bkash }
                      })
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                      editForm.paymentOptions.bkash
                        ? 'border-pink-500 bg-pink-50/70 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-pink-600" />
                    <span className="text-xs">বিকাশ (bKash)</span>
                    <span className="text-[9px]">{editForm.paymentOptions.bkash ? 'সক্রিয় ✓' : 'বন্ধ ✕'}</span>
                  </label>

                  {/* Rocket */}
                  <label
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        paymentOptions: { ...editForm.paymentOptions, rocket: !editForm.paymentOptions.rocket }
                      })
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                      editForm.paymentOptions.rocket
                        ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="text-xs">রকেট (Rocket)</span>
                    <span className="text-[9px]">{editForm.paymentOptions.rocket ? 'সক্রিয় ✓' : 'বন্ধ ✕'}</span>
                  </label>

                  {/* Bank */}
                  <label
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        paymentOptions: { ...editForm.paymentOptions, bank: !editForm.paymentOptions.bank }
                      })
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                      editForm.paymentOptions.bank
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">ব্যাংক (Bank)</span>
                    <span className="text-[9px]">{editForm.paymentOptions.bank ? 'সক্রিয় ✓' : 'বন্ধ ✕'}</span>
                  </label>

                  {/* COD */}
                  <label
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        paymentOptions: { ...editForm.paymentOptions, cod: !editForm.paymentOptions.cod }
                      })
                    }
                    className={`p-2.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-1 transition-all ${
                      editForm.paymentOptions.cod
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">COD</span>
                    <span className="text-[9px]">{editForm.paymentOptions.cod ? 'সক্রিয় ✓' : 'বন্ধ ✕'}</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Real-Time Calculation Preview Card */}
              <div className="p-4 bg-neutral-900 text-white rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> রিয়েল-টাইম হিসাব প্রিভিউ (Customer vs Super Admin)
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">
                    Live Formula
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Left: Customer View */}
                  <div className="space-y-1.5 border-r border-neutral-800 pr-3">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                      কাস্টমার যা দেখবে (Customer View)
                    </span>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Selling Price:</span>
                      <span className="font-bold text-emerald-400 font-mono">{formatPrice(editMetrics.sellingPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Delivery Cost:</span>
                      <span className="font-mono">{formatPrice(editMetrics.deliveryCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">VAT/Tax ({editMetrics.vatTax}%):</span>
                      <span className="font-mono">{formatPrice(editMetrics.vatAmount)}</span>
                    </div>
                    <div className="flex justify-between text-purple-400 font-bold bg-purple-950/40 p-1 rounded">
                      <span>Customer PV:</span>
                      <span className="font-mono">{formatPV(editMetrics.effectivePv)} PV</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-800 pt-1 text-neutral-300">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">{formatPrice(editMetrics.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-emerald-300 font-black">
                      <span>COD Total (0%):</span>
                      <span className="font-mono">{formatPrice(editMetrics.codTotal)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-pink-300 font-black">
                      <span>bKash/Nagad Total ({chargesConfig.bkashRate}%):</span>
                      <span className="font-mono">{formatPrice(editMetrics.bkashTotal)}</span>
                    </div>
                  </div>

                  {/* Right: Internal Super Admin Metrics */}
                  <div className="space-y-1.5 pl-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> গোপনীয় (Internal Only)
                    </span>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Dealer Price:</span>
                      <span className="font-mono text-amber-400 font-bold">{formatPrice(editMetrics.dealerPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Gross Profit (MRP - DP):</span>
                      <span className="font-mono font-bold">{formatPrice(editMetrics.grossProfit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Admin Cost (20% GP):</span>
                      <span className="font-mono text-rose-400">{formatPrice(editMetrics.adminCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">PV Value (GP - Admin):</span>
                      <span className="font-mono text-purple-300 font-bold">{formatPrice(editMetrics.pvValue)}</span>
                    </div>
                    <div className="flex justify-between border-t border-neutral-800 pt-1 text-[11px] text-purple-300 font-black">
                      <span>Formula PV (PV Val ÷ 10):</span>
                      <span className="font-mono">{editMetrics.calculatedPv} PV</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2.5 bg-neutral-50/80 dark:bg-neutral-800/60 sticky bottom-0 z-10 backdrop-blur-sm">
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={() => {
                  setEditingProduct(null);
                  setProductSaveError(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                disabled={isSavingProduct}
                onClick={handleSaveProduct}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে... (Saving...)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>পরিবর্তন সংরক্ষণ করুন (Save Changes)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Product Full View Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                প্রোডাক্ট প্রাইসিং বিবরণ
              </h3>
              <button
                onClick={() => setViewingProduct(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={viewingProduct.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                alt={viewingProduct.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {viewingProduct.titleBn || viewingProduct.title}
                </h4>
                <p className="text-xs text-neutral-500 font-mono">
                  SKU: {viewingProduct.sku} | Category: {viewingProduct.categoryName}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs divide-y divide-neutral-100 dark:divide-neutral-800">
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-500">MRP:</span>
                <span className="font-mono font-bold">{formatPrice(viewingProduct.mrp)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-amber-700 dark:text-amber-400 font-bold bg-amber-50/50 dark:bg-amber-950/20 px-2 rounded">
                <span>Dealer Price (Super Admin Only):</span>
                <span className="font-mono">{formatPrice(viewingProduct.dealerPrice)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-500">Discount:</span>
                <span className="font-mono font-bold text-rose-600">{viewingProduct.discount || 0}%</span>
              </div>
              <div className="flex justify-between py-1.5 text-emerald-600 font-bold text-sm">
                <span>Customer Selling Price:</span>
                <span className="font-mono">
                  {formatPrice(
                    viewingProduct.campaignPrice ||
                      (viewingProduct.mrp || 0) - ((viewingProduct.mrp || 0) * (viewingProduct.discount || 0)) / 100
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-500">VAT / Tax:</span>
                <span className="font-mono font-bold">{viewingProduct.vatTax || 5}%</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-neutral-500">Delivery Cost:</span>
                <span className="font-mono font-bold">{formatPrice(viewingProduct.deliveryCost || 60)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-purple-700 dark:text-purple-300 font-black text-sm">
                <span>PV (Point Value):</span>
                <span className="font-mono">{formatPV(viewingProduct.pvValue || viewingProduct.pvPoint || 0)} PV</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  handleOpenEdit(p);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> এডিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Audit History Modal */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-3xl w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                    প্রাইসিং ও পেমেন্ট অডিট লগ হিস্ট্রি
                  </h3>
                  <p className="text-xs text-neutral-500">
                    সকল পরিবর্তন ও সম্পাদনার স্বয়ংক্রিয় অডিট রেকর্ড
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audit Search */}
            <div className="relative flex-shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="পণ্য বা ফিল্ড নাম দিয়ে অডিট ফিল্টার করুন..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white"
              />
            </div>

            {/* Audit Log Table */}
            <div className="overflow-y-auto flex-1 border border-neutral-100 dark:border-neutral-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Changed Field</th>
                    <th className="py-2.5 px-3">Previous Value</th>
                    <th className="py-2.5 px-3">New Value</th>
                    <th className="py-2.5 px-3">Changed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        কোনো অডিট রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                          {new Date(log.dateTime).toLocaleString('bn-BD', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-neutral-900 dark:text-white max-w-[160px] truncate">
                          {log.productName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                          {log.changedField}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-500 max-w-[120px] truncate">
                          {String(log.previousValue)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 max-w-[120px] truncate">
                          {String(log.newValue)}
                        </td>
                        <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          <span className="font-semibold">{log.changedBy}</span>
                          <span className="text-[10px] text-neutral-400 block">({log.changedByRole})</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. Payment Gateway Charges Settings Modal */}
      {isChargesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                  পেমেন্ট গেটওয়ে চার্জ কনফিগারেশন
                </h3>
              </div>
              <button
                onClick={() => setIsChargesModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {chargesSaveError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{chargesSaveError}</span>
              </div>
            )}

            <p className="text-xs text-neutral-500">
              চেকআউটে Subtotal (Selling Price + Delivery Cost + VAT/Tax) এর উপর পেমেন্ট চার্জ শতকরা হারে নির্ধারিত হবে:
            </p>

            <div className="space-y-3 text-xs">
              {/* COD */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>Cash on Delivery (COD) চার্জ %:</span>
                  <span className="text-emerald-600 font-mono font-bold">Standard 0%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={tempCharges.codRate}
                  onChange={(e) => setTempCharges({ ...tempCharges, codRate: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold font-mono"
                />
              </div>

              {/* bKash */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>bKash গেটওয়ে চার্জ %:</span>
                  <span className="text-pink-600 font-mono font-bold">Standard 1.8%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={tempCharges.bkashRate}
                  onChange={(e) => setTempCharges({ ...tempCharges, bkashRate: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold font-mono"
                />
              </div>

              {/* Nagad */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>Nagad গেটওয়ে চার্জ %:</span>
                  <span className="text-orange-600 font-mono font-bold">Standard 1.8%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={tempCharges.nagadRate}
                  onChange={(e) => setTempCharges({ ...tempCharges, nagadRate: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold font-mono"
                />
              </div>

              {/* Rocket */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>Rocket গেটওয়ে চার্জ %:</span>
                  <span className="text-purple-600 font-mono font-bold">Standard 1.8%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={tempCharges.rocketRate}
                  onChange={(e) => setTempCharges({ ...tempCharges, rocketRate: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold font-mono"
                />
              </div>

              {/* Bank */}
              <div className="space-y-1">
                <label className="font-bold text-neutral-700 dark:text-neutral-300 flex justify-between">
                  <span>Bank Payment চার্জ %:</span>
                  <span className="text-blue-600 font-mono font-bold">Standard 0%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={tempCharges.bankRate}
                  onChange={(e) => setTempCharges({ ...tempCharges, bankRate: Number(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
              <button
                type="button"
                disabled={isSavingCharges}
                onClick={() => {
                  setTempCharges(chargesConfig);
                  setChargesSaveError(null);
                  setIsChargesModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                disabled={isSavingCharges}
                onClick={handleSavePaymentCharges}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSavingCharges ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>চার্জ সংরক্ষণ করুন (Update Charges)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductPricingPaymentManagement;
