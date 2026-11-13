/**
 * SMS Order Management Hub & 24/7 AI Auto-Reply Command Center
 * Multi-Role: Super Admin, Admin, Operations Partner
 * Project: Apon Bazar (আপন বাজার)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  MessageSquare,
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  Radio,
  ShoppingBag,
  ArrowRight,
  Phone,
  MapPin,
  RefreshCw,
  Trash2,
  Edit3,
  Sliders,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  Truck,
  Building2,
  Zap,
  Info,
  Save,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SmsOrderMessage, SmsIntentType, SmsMessageStatus, SmsAiTone } from '../../types';

interface Props {
  role?: 'super_admin' | 'admin' | 'operations_partner' | 'customer';
  title?: string;
  regionalFilter?: string; // e.g. 'রাজশাহী' for OP Partner
}

export const SmsOrderManagementHub: React.FC<Props> = ({
  role = 'admin',
  title,
  regionalFilter
}) => {
  const {
    smsOrderMessages,
    smsGatewayConfig,
    updateSmsGatewayConfig,
    processIncomingSmsOrder,
    convertSmsToConfirmedOrder,
    sendSmsCustomReply,
    triggerAiReParseSms,
    deleteSmsOrderMessage
  } = useECommerce();
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'inbox' | 'simulator' | 'gateway_settings' | 'ai_prompts'>('inbox');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SmsMessageStatus>('all');
  const [intentFilter, setIntentFilter] = useState<'all' | SmsIntentType>('all');
  
  // Selected SMS for Detail Modal / Quick Action
  const [selectedSms, setSelectedSms] = useState<SmsOrderMessage | null>(null);
  const [customReplyText, setCustomReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isReParsing, setIsReParsing] = useState(false);

  // Simulator Form State
  const [simPhone, setSimPhone] = useState('01711223344');
  const [simName, setSimName] = useState('মোঃ জহিরুল ইসলাম');
  const [simText, setSimText] = useState('আমাকে ২ লিটার খাঁটি সরিষার তেল ও ১ কেজি সুন্দরবনের মধু পাঠান। ঠিকানা: হাউজ ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা।');
  const [simLoading, setSimLoading] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState('');

  // Gateway Settings Draft State (Strict Save/Cancel Pattern)
  const [gatewayDraft, setGatewayDraft] = useState({ ...smsGatewayConfig });
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [gatewaySaveMessage, setGatewaySaveMessage] = useState('');

  // Sync draft when config changes from server unless user modified it
  useEffect(() => {
    setGatewayDraft({ ...smsGatewayConfig });
  }, [smsGatewayConfig]);

  const isGatewayDirty = useMemo(() => {
    return (
      gatewayDraft.gatewayName !== smsGatewayConfig.gatewayName ||
      gatewayDraft.senderId !== smsGatewayConfig.senderId ||
      gatewayDraft.dailySmsQuota !== smsGatewayConfig.dailySmsQuota ||
      gatewayDraft.aiAutoReplyEnabled !== smsGatewayConfig.aiAutoReplyEnabled ||
      gatewayDraft.aiAutoOrderConversion !== smsGatewayConfig.aiAutoOrderConversion ||
      gatewayDraft.aiTone !== smsGatewayConfig.aiTone
    );
  }, [gatewayDraft, smsGatewayConfig]);

  const handleDiscardGatewayDraft = () => {
    setGatewayDraft({ ...smsGatewayConfig });
    setGatewaySaveMessage('');
  };

  const handleSaveGatewayConfig = async () => {
    setIsSavingGateway(true);
    setGatewaySaveMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateSmsGatewayConfig({
        gatewayName: gatewayDraft.gatewayName,
        senderId: gatewayDraft.senderId,
        dailySmsQuota: gatewayDraft.dailySmsQuota,
        aiAutoReplyEnabled: gatewayDraft.aiAutoReplyEnabled,
        aiAutoOrderConversion: gatewayDraft.aiAutoOrderConversion,
        aiTone: gatewayDraft.aiTone
      });
      setGatewaySaveMessage('SMS গেটওয়ে সেটিংস ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে!');
      setTimeout(() => setGatewaySaveMessage(''), 4000);
    } finally {
      setIsSavingGateway(false);
    }
  };

  // Prompt guideline edit state
  const [promptGuideline, setPromptGuideline] = useState(smsGatewayConfig.systemPromptGuideline || '');
  const [savedPromptNotice, setSavedPromptNotice] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  useEffect(() => {
    setPromptGuideline(smsGatewayConfig.systemPromptGuideline || '');
  }, [smsGatewayConfig.systemPromptGuideline]);

  const isPromptDirty = promptGuideline !== (smsGatewayConfig.systemPromptGuideline || '');

  const handleDiscardPrompt = () => {
    setPromptGuideline(smsGatewayConfig.systemPromptGuideline || '');
    setSavedPromptNotice(false);
  };

  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateSmsGatewayConfig({ systemPromptGuideline: promptGuideline });
      setSavedPromptNotice(true);
      setTimeout(() => setSavedPromptNotice(false), 4000);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Filter messages based on role & search
  const filteredMessages = useMemo(() => {
    return smsOrderMessages.filter((msg) => {
      // Regional filter for Operations Partner
      if (role === 'operations_partner' && regionalFilter) {
        const raw = (msg.rawText + ' ' + (msg.assignedOpPartnerName || '') + ' ' + (msg.parsedAddress.division || '') + ' ' + (msg.parsedAddress.district || '')).toLowerCase();
        if (!raw.includes(regionalFilter.toLowerCase())) {
          return false;
        }
      }

      if (statusFilter !== 'all' && msg.status !== statusFilter) return false;
      if (intentFilter !== 'all' && msg.parsedIntent !== intentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          msg.id.toLowerCase().includes(q) ||
          msg.senderPhone.includes(q) ||
          (msg.senderName && msg.senderName.toLowerCase().includes(q)) ||
          msg.rawText.toLowerCase().includes(q) ||
          (msg.aiReplyText && msg.aiReplyText.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [smsOrderMessages, statusFilter, intentFilter, searchQuery, role, regionalFilter]);

  // Statistics
  const totalReceived = smsOrderMessages.length;
  const totalParsed = smsOrderMessages.filter((m) => m.status === 'ai_parsed' || m.status === 'converted_to_order').length;
  const totalConverted = smsOrderMessages.filter((m) => m.status === 'converted_to_order').length;
  const aiAutoRepliedCount = smsOrderMessages.filter((m) => m.isAiAutoReplied).length;

  const handleSimulateSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    setSimLoading(true);
    setSimSuccessMsg('');

    try {
      const res = await processIncomingSmsOrder(simText, simPhone, simName, 'sms');
      if (res.success) {
        setSimSuccessMsg(
          res.autoConvertedOrder
            ? `✅ SMS গৃহীত! AI স্বয়ংক্রিয়ভাবে অর্ডার #${res.autoConvertedOrder.id} তৈরি করেছে ও ২৪/৭ রিপ্লাই পাঠিয়েছে।`
            : `✅ SMS সফলভাবে প্রসেস হয়েছে ও ২৪/৭ AI রিপ্লাই পাঠানো হয়েছে!`
        );
        setSelectedSms(res.data);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedSms || !customReplyText.trim()) return;
    setIsReplying(true);
    try {
      await sendSmsCustomReply(selectedSms.id, customReplyText.trim());
      setSelectedSms((prev) => (prev ? { ...prev, aiReplyText: customReplyText.trim(), isAiAutoReplied: true } : null));
      setCustomReplyText('');
    } finally {
      setIsReplying(false);
    }
  };

  const handleReParse = async (smsId: string) => {
    setIsReParsing(true);
    try {
      const res = await triggerAiReParseSms(smsId);
      if (res.success && res.data) {
        setSelectedSms(res.data);
      }
    } finally {
      setIsReParsing(false);
    }
  };

  const handleConvertOrder = (smsId: string) => {
    const res = convertSmsToConfirmedOrder(smsId);
    if (res.success && res.order) {
      setSelectedSms((prev) => (prev ? { ...prev, status: 'converted_to_order', convertedOrderId: res.order?.id } : null));
    }
  };

  const sampleTemplates = [
    {
      label: '১. সরিষার তেল ও মধু (মিরপুর ঢাকা)',
      text: 'আমাকে ২ লিটার খাঁটি সরিষার তেল ও ১ কেজি সুন্দরবনের মধু পাঠান। ঠিকানা: হাউজ ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা।',
      phone: '01711223344',
      name: 'মোঃ জহিরুল ইসলাম'
    },
    {
      label: '২. ঘি ও চা পাতা (রাজশাহী হাব)',
      text: 'গাওয়া ঘি ৫০০ গ্রাম এবং ২ প্যাকেট চাপাতা সাহেব বাজার, বোয়ালিয়া, রাজশাহী ঠিকানায় পাঠান। মোবাইল: ০১৭২২৩৩৪৪৫৫',
      phone: '01722334455',
      name: 'মোঃ শরিফুল ইসলাম'
    },
    {
      label: '৩. চাল ও তেল ইনকোয়ারি (চট্টগ্রাম)',
      text: 'খাঁটি সরিষার তেল ২ লিটার এবং নাজিরশাইল চাল ২৫ কেজি জিইসি মোড়, চট্টগ্রাম ঠিকানায় পাঠাতে কত লাগবে?',
      phone: '01912889900',
      name: 'ফারহানা ইয়াসমিন'
    },
    {
      label: '৪. অর্ডার স্ট্যাটাস ট্র্যাকিং',
      text: 'আমার অর্ডার #ORD-2026-8812 এর বর্তমান স্ট্যাটাস কী? কখন রাইডার আসবে?',
      phone: '01312480175',
      name: 'আহমেদ হাসান'
    }
  ];

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 md:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white">
                {title || 'SMS Product Order System & 24/7 AI Auto-Reply Hub'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                24/7 Live AI Active
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {role === 'super_admin'
                ? 'Super Admin মাস্টার কমান্ড: SMS গেটওয়ে, জেমিনি AI অর্ডার পার্সিং, অটো-কনভার্সন ও রোল-ওয়াইজ কনফিগারেশন'
                : role === 'operations_partner'
                ? `আঞ্চলিক হাব (${regionalFilter || 'সকল'}) SMS অর্ডার ব্যবস্থাপনা, অটো-ডিলার রাউটিং ও লোকাল ডেলিভারি অ্যাসাইনমেন্ট`
                : 'অ্যাডমিন ড্যাশবোর্ড: ইনকামিং SMS অর্ডার অডিট, ২৪/৭ AI অটো-রিপ্লাই ও কাস্টমার মেসেজ ট্র্যাকিং'}
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-xl self-start md:self-auto text-xs font-medium">
          <button
            id="tab-sms-inbox"
            onClick={() => setActiveTab('inbox')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'inbox'
                ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ইনবক্স ও অর্ডার ({filteredMessages.length})</span>
          </button>

          <button
            id="tab-sms-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>লাইভ SMS সিমুলেটর</span>
          </button>

          {(role === 'super_admin' || role === 'admin') && (
            <button
              id="tab-sms-settings"
              onClick={() => setActiveTab('gateway_settings')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'gateway_settings'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>গেটওয়ে ও AI সেটিংস</span>
            </button>
          )}

          {role === 'super_admin' && (
            <button
              id="tab-sms-prompts"
              onClick={() => setActiveTab('ai_prompts')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'ai_prompts'
                  ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI প্রম্পট টিউনিং</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 md:p-6 bg-neutral-50/40 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 text-xs">
        <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span>মোট ইনকামিং SMS</span>
            <MessageSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white font-mono">{totalReceived}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">১০০% ক্যাশ অন ডেলিভারি সাপোর্ট</span>
        </div>

        <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span>AI পার্সড অর্ডার</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-white font-mono">{totalParsed}</p>
          <span className="text-[10px] text-neutral-500">Gemini 3.7 Flash Engine</span>
        </div>

        <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span>অর্ডারে রূপান্তরিত</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalConverted}</p>
          <span className="text-[10px] text-emerald-600 font-medium">সরাসরি রাউট ও ডেলিভারি</span>
        </div>

        <div className="bg-white dark:bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
            <span>২৪/৭ AI অটো-রিপ্লাই</span>
            <Bot className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-xl font-bold text-sky-600 dark:text-sky-400 font-mono">{aiAutoRepliedCount}</p>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">গড় প্রতিক্রিয়া সময়: ০.৩ সে.</span>
        </div>
      </div>

      {/* TAB CONTENT 1: INBOX & ORDERS */}
      {activeTab === 'inbox' && (
        <div className="p-4 md:p-6 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                id="search-sms-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="মোবাইল নম্বর, নাম, পণ্য বা বার্তা খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                id="filter-sms-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-neutral-700 dark:text-neutral-200 font-medium"
              >
                <option value="all">সব স্ট্যাটাস</option>
                <option value="converted_to_order">অর্ডারে রূপান্তরিত</option>
                <option value="ai_parsed">AI পার্সড</option>
                <option value="received">রিসিভড</option>
                <option value="need_info">অতিরিক্ত তথ্য প্রয়োজন</option>
              </select>

              <select
                id="filter-sms-intent"
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value as any)}
                className="py-2 px-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none text-neutral-700 dark:text-neutral-200 font-medium"
              >
                <option value="all">সব ক্যাটাগরি / ইনটেন্ট</option>
                <option value="place_order">অর্ডার প্রদান (Place Order)</option>
                <option value="check_status">স্ট্যাটাস অনুসন্ধান</option>
                <option value="price_inquiry">মূল্য ও স্টক অনুসন্ধান</option>
                <option value="general_chat">সাধারণ প্রশ্ন</option>
              </select>
            </div>
          </div>

          {/* Messages Grid / List */}
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
              <MessageSquare className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">কোনো SMS বার্তা পাওয়া যায়নি</p>
              <p className="text-xs text-neutral-500 mt-1">"লাইভ SMS সিমুলেটর" ট্যাব থেকে নতুন মেসেজ পাঠিয়ে টেস্ট করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredMessages.map((msg) => {
                const isConverted = msg.status === 'converted_to_order';
                return (
                  <div
                    key={msg.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all ${
                      isConverted
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-white dark:bg-neutral-800/90 border-neutral-200 dark:border-neutral-700/80 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      {/* Left: Message details */}
                      <div className="space-y-2.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs">
                            {msg.id}
                          </span>
                          <span className="font-semibold text-neutral-900 dark:text-white text-sm flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {msg.senderPhone}
                          </span>
                          {msg.senderName && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                              ({msg.senderName})
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {msg.receivedAt}
                          </span>

                          {/* Status Badge */}
                          {isConverted ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              অর্ডার সম্পন্ন: #{msg.convertedOrderId}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI পার্সড (অপেক্ষমাণ)
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                            ইনটেন্ট: {msg.parsedIntent === 'place_order' ? 'অর্ডার' : msg.parsedIntent === 'check_status' ? 'স্ট্যাটাস' : 'ইনকোয়ারি'}
                          </span>
                        </div>

                        {/* Raw SMS Box */}
                        <div className="bg-neutral-50 dark:bg-neutral-900/80 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                            গ্রাহকের ইনকামিং SMS টেক্সট:
                          </span>
                          <p className="text-neutral-900 dark:text-white font-medium italic">"{msg.rawText}"</p>
                        </div>

                        {/* Parsed Items & Address */}
                        {msg.parsedItems && msg.parsedItems.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-neutral-600 dark:text-neutral-400">শনাক্তকৃত পণ্য:</span>
                            {msg.parsedItems.map((it, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 font-medium"
                              >
                                {it.productName} ({it.variantName || `${it.quantity}টি`}) - ৳{it.total || it.unitPrice}
                              </span>
                            ))}
                            {msg.parsedAddress?.fullServiceAddress && (
                              <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                                {msg.parsedAddress.fullServiceAddress}
                              </span>
                            )}
                          </div>
                        )}

                        {/* AI Auto-Reply Box */}
                        {msg.aiReplyText && (
                          <div className="bg-sky-50/60 dark:bg-sky-950/20 p-3 rounded-xl border border-sky-200/80 dark:border-sky-900/50 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-sky-800 dark:text-sky-300">
                              <span className="flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-sky-600" />
                                24/7 AI প্রেরিত SMS উত্তর ({msg.aiModelUsed || 'Gemini 3.7 Flash'}):
                              </span>
                              <span className="text-[10px] text-sky-600 dark:text-sky-400">{msg.aiRepliedAt}</span>
                            </div>
                            <p className="text-sky-950 dark:text-sky-200 font-sans">{msg.aiReplyText}</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex lg:flex-col items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        {!isConverted ? (
                          <button
                            id={`btn-convert-order-${msg.id}`}
                            onClick={() => handleConvertOrder(msg.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>অর্ডার কনফার্ম করুন</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>রাউটেড</span>
                          </span>
                        )}

                        <button
                          id={`btn-custom-reply-${msg.id}`}
                          onClick={() => {
                            setSelectedSms(msg);
                            setCustomReplyText(msg.aiReplyText || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>কাস্টম রিপ্লাই</span>
                        </button>

                        <button
                          id={`btn-reparse-${msg.id}`}
                          onClick={() => handleReParse(msg.id)}
                          title="AI দিয়ে পুনরায় পার্স করুন"
                          className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {(role === 'super_admin' || role === 'admin') && (
                          <button
                            id={`btn-delete-sms-${msg.id}`}
                            onClick={() => deleteSmsOrderMessage(msg.id)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 text-neutral-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: LIVE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Simulator */}
            <div className="lg:col-span-7 space-y-4">
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <h3>টেলিকম ক্যারিয়ার SMS গেটওয়ে সিমুলেটর</h3>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">Gateway: +880 9612-APONBAZAR</span>
                </div>

                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-neutral-500">দ্রুত পরীক্ষার জন্য স্যাম্পল টেমপ্লেট নির্বাচন করুন:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sampleTemplates.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSimText(tpl.text);
                          setSimPhone(tpl.phone);
                          setSimName(tpl.name);
                        }}
                        className="text-left p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-emerald-500 transition text-xs font-medium text-neutral-800 dark:text-neutral-200"
                      >
                        <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mb-0.5">
                          {tpl.label}
                        </span>
                        <span className="line-clamp-1 text-neutral-500 text-[11px]">{tpl.text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSimulateSms} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        গ্রাহকের মোবাইল নম্বর
                      </label>
                      <input
                        id="sim-phone"
                        type="text"
                        value={simPhone}
                        onChange={(e) => setSimPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        গ্রাহকের নাম (ঐচ্ছিক)
                      </label>
                      <input
                        id="sim-name"
                        type="text"
                        value={simName}
                        onChange={(e) => setSimName(e.target.value)}
                        placeholder="নাম লিখুন..."
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      ইনকামিং SMS মেসেজ বডি (বাংলা বা ইংরেজিতে লিখুন)
                    </label>
                    <textarea
                      id="sim-text"
                      rows={3}
                      value={simText}
                      onChange={(e) => setSimText(e.target.value)}
                      placeholder="যেমন: আমাকে ২ কেজি মধু ও ১ লিটার সরিষার তেল পাঠান। মিরপুর ১০, ঢাকা..."
                      className="w-full p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white font-medium"
                      required
                    />
                  </div>

                  <button
                    id="btn-submit-sim-sms"
                    type="submit"
                    disabled={simLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {simLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gemini 3.7 Flash প্রসেসিং করছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>SMS পাঠান ও ২৪/৭ AI অটো-রিপ্লাই পান</span>
                      </>
                    )}
                  </button>

                  {simSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-xl text-xs font-medium"
                    >
                      {simSuccessMsg}
                    </motion.div>
                  )}
                </form>
              </div>
            </div>

            {/* Right: Simulated Mobile Phone Screen Preview */}
            <div className="lg:col-span-5">
              <div className="border-4 border-neutral-800 dark:border-neutral-700 rounded-3xl p-4 bg-neutral-900 text-white shadow-xl space-y-3 font-sans">
                {/* Phone Top Header */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-400">Apon Bazar 24/7 Gateway</span>
                  </div>
                  <span className="text-neutral-400">৮৮০ ৯৬১২-APONBAZAR</span>
                </div>

                {/* Simulated Chat Feed */}
                <div className="space-y-3 min-h-[220px] max-h-[300px] overflow-y-auto py-2 text-xs">
                  {/* Sent message */}
                  <div className="flex justify-end">
                    <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none max-w-[85%] space-y-1 shadow-sm">
                      <p>{simText}</p>
                      <span className="text-[9px] text-emerald-200 block text-right">
                        {simPhone} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* AI Reply */}
                  {selectedSms?.aiReplyText && (
                    <div className="flex justify-start">
                      <div className="bg-neutral-800 text-neutral-100 p-3 rounded-2xl rounded-tl-none max-w-[85%] space-y-1 border border-neutral-700">
                        <div className="flex items-center gap-1 text-[10px] text-sky-400 font-bold">
                          <Bot className="w-3 h-3" />
                          <span>Apon Bazar AI 24/7 Auto-Reply</span>
                        </div>
                        <p className="text-neutral-200">{selectedSms.aiReplyText}</p>
                        <span className="text-[9px] text-neutral-400 block">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Delivered
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800 text-[10px] text-neutral-400 flex items-center justify-between">
                  <span>Carrier: Grameenphone/Robi</span>
                  <span className="text-emerald-400 font-mono">Status: Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: GATEWAY & AI SETTINGS */}
      {activeTab === 'gateway_settings' && (role === 'super_admin' || role === 'admin') && (
        <div className="p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gateway Config */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <Radio className="w-4 h-4 text-emerald-600" />
                <h3>SMS গেটওয়ে প্যারামিটার</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    ক্যারিয়ার গেটওয়ে নাম
                  </label>
                  <input
                    type="text"
                    value={gatewayDraft.gatewayName}
                    onChange={(e) => setGatewayDraft((prev) => ({ ...prev, gatewayName: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    অনুমোদিত প্রেরক আইডি (Sender ID)
                  </label>
                  <input
                    type="text"
                    value={gatewayDraft.senderId}
                    onChange={(e) => setGatewayDraft((prev) => ({ ...prev, senderId: e.target.value }))}
                    className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      দৈনিক SMS কোটা
                    </label>
                    <input
                      type="number"
                      value={gatewayDraft.dailySmsQuota}
                      onChange={(e) => setGatewayDraft((prev) => ({ ...prev, dailySmsQuota: Number(e.target.value) || 0 }))}
                      className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                      আজকের ব্যবহৃত SMS
                    </label>
                    <input
                      type="number"
                      disabled
                      value={smsGatewayConfig.smsUsedToday}
                      className="w-full p-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono font-bold text-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Auto-Reply & Tone Config */}
            <div className="bg-neutral-50/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <Bot className="w-4 h-4 text-sky-600" />
                <h3>24/7 AI অটো-রিপ্লাই ইঞ্জিন</h3>
              </div>

              <div className="space-y-4 text-xs">
                {/* 24/7 Toggle */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">২৪/৭ AI অটো-রিপ্লাই চালু</span>
                    <span className="text-[11px] text-neutral-500">যেকোনো সময় আগত SMS এ তাৎক্ষণিক বুদ্ধিমান উত্তর প্রেরণ</span>
                  </div>
                  <button
                    id="toggle-ai-auto-reply"
                    type="button"
                    onClick={() => setGatewayDraft((prev) => ({ ...prev, aiAutoReplyEnabled: !prev.aiAutoReplyEnabled }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                      gatewayDraft.aiAutoReplyEnabled ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* Auto Order Conversion Toggle */}
                <div className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">অটো-অর্ডার কনভার্সন</span>
                    <span className="text-[11px] text-neutral-500">পণ্য ও ঠিকানা শনাক্ত হলে স্বয়ংক্রিয় অর্ডার প্লেস ও হাব অ্যাসাইনমেন্ট</span>
                  </div>
                  <button
                    id="toggle-ai-auto-order"
                    type="button"
                    onClick={() => setGatewayDraft((prev) => ({ ...prev, aiAutoOrderConversion: !prev.aiAutoOrderConversion }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                      gatewayDraft.aiAutoOrderConversion ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                {/* Tone Select */}
                <div>
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    AI উত্তরের ভাষা ও টোন
                  </label>
                  <select
                    id="select-ai-tone"
                    value={gatewayDraft.aiTone}
                    onChange={(e) => setGatewayDraft((prev) => ({ ...prev, aiTone: e.target.value as any }))}
                    className="w-full p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                  >
                    <option value="polite_bangla">আন্তরিক ও বিনয়ী বাংলা (Polite Bengali)</option>
                    <option value="corporate_bangla">প্রাতিষ্ঠানিক বাংলা (Corporate Bangla)</option>
                    <option value="fast_english">দ্রুত ও সংক্ষিপ্ত ইংরেজি (Fast English)</option>
                    <option value="bilingual">দ্বিভাষিক (Bangla + English)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Explicit Save & Cancel Action Bar */}
          <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {isGatewayDirty ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  অসংরক্ষিত পরিবর্তন রয়েছে (Unsaved Changes)
                </span>
              ) : (
                <span className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  সকল সেটিংস ডাটাবেজের সাথে সিঙ্ক আছে
                </span>
              )}

              {gatewaySaveMessage && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {gatewaySaveMessage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                id="btn-cancel-sms-gateway-settings"
                disabled={!isGatewayDirty || isSavingGateway}
                onClick={handleDiscardGatewayDraft}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-40 text-neutral-700 dark:text-neutral-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>পরিবর্তন বাতিল (Cancel / Discard)</span>
              </button>

              <button
                type="button"
                id="btn-save-sms-gateway-settings"
                disabled={!isGatewayDirty || isSavingGateway}
                onClick={handleSaveGatewayConfig}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingGateway ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>পরিবর্তন সংরক্ষণ ও আপডেট করুন (Save Changes / Update)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: AI PROMPTS (SUPER ADMIN ONLY) */}
      {activeTab === 'ai_prompts' && role === 'super_admin' && (
        <div className="p-4 md:p-6 space-y-4">
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <h3>Super Admin AI সিস্টেম প্রম্পট ও কাস্টম গাইডলাইন</h3>
              </div>
              <span className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md font-semibold">
                Gemini 3.7 Flash Tuning
              </span>
            </div>

            <p className="text-xs text-neutral-500">
              এখানে কাস্টম সিস্টেম প্রম্পট বা বিশেষ অফার/ডেলিভারি নিয়মাবলী লিখুন যা AI প্রতিটি SMS রিপ্লাই ও অর্ডার পার্সিং এ অনুসরণ করবে।
            </p>

            <textarea
              id="prompt-guideline-textarea"
              rows={4}
              value={promptGuideline}
              onChange={(e) => setPromptGuideline(e.target.value)}
              className="w-full p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {isPromptDirty ? (
                  <span className="text-xs text-amber-600 font-bold">
                    * প্রম্পটে অসংরক্ষিত পরিবর্তন রয়েছে
                  </span>
                ) : null}
                {savedPromptNotice && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> প্রম্পট গাইডলাইন সফলভাবে হালনাগাদ হয়েছে!
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="btn-cancel-prompt-guideline"
                  disabled={!isPromptDirty || isSavingPrompt}
                  onClick={handleDiscardPrompt}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-40 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>বাতিল (Cancel)</span>
                </button>

                <button
                  id="btn-save-prompt-guideline"
                  type="button"
                  disabled={!isPromptDirty || isSavingPrompt}
                  onClick={handleSavePrompt}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {isSavingPrompt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>প্রম্পট পরিবর্তন সংরক্ষণ ও আপডেট করুন (Save Changes / Update)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REPLY MODAL */}
      {selectedSms && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white text-base">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  <span>কাস্টম SMS উত্তর প্রেরণ ({selectedSms.senderPhone})</span>
                </div>
                <button
                  onClick={() => setSelectedSms(null)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-xl text-xs space-y-1">
                <span className="font-bold text-neutral-500 block">মূল SMS:</span>
                <p className="text-neutral-800 dark:text-neutral-200 italic">"{selectedSms.rawText}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  গ্রাহককে পাঠানোর উত্তর:
                </label>
                <textarea
                  rows={4}
                  value={customReplyText}
                  onChange={(e) => setCustomReplyText(e.target.value)}
                  className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSms(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isReplying || !customReplyText.trim()}
                  onClick={handleSendReply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>SMS সেন্ড করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};
