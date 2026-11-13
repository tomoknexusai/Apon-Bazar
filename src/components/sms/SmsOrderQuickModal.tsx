/**
 * Customer Quick Order via SMS Modal
 * 24/7 AI-Powered Instant Ordering
 * Project: AANO BAZAR (আনো বাজার)
 */

import React, { useState } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Sparkles,
  Bot,
  Send,
  CheckCircle2,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Zap,
  Copy,
  Check,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product;
}

export const SmsOrderQuickModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialProduct
}) => {
  const { processIncomingSmsOrder } = useECommerce();
  const { currentUser } = useAuth();

  const [phone, setPhone] = useState(currentUser?.mobileNumber || '01711223344');
  const [name, setName] = useState(currentUser?.fullName || '');
  const [smsBody, setSmsBody] = useState(
    initialProduct
      ? `আমাকে ১টি ${initialProduct.titleBn || initialProduct.title} পাঠান। ঠিকানা: মিরপুর ১০, ঢাকা।`
      : 'আমাকে ২ লিটার খাঁটি সরিষার তেল ও ১ কেজি মধু পাঠান। ঠিকানা: মিরপুর ১০, ঢাকা।'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    replyText: string;
    orderId?: string;
    items: string[];
    total: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsBody.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await processIncomingSmsOrder(smsBody, phone, name, 'web_sms');
      if (res.success && res.data) {
        setResult({
          success: true,
          replyText: res.data.aiReplyText,
          orderId: res.autoConvertedOrder?.id || res.data.convertedOrderId,
          items: res.data.parsedItems.map((i) => `${i.productName} (${i.quantity}টি)`),
          total: res.data.totalCalculatedAmount + res.data.deliveryCharge
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySms = () => {
    navigator.clipboard.writeText(smsBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const directSmsUri = `sms:+8809612226622?body=${encodeURIComponent(smsBody)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                  ২৪/৭ SMS এ পণ্য অর্ডার ও AI সহায়তা
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                ইন্টারনেট ছাড়াই শুধু সাধারণ SMS পাঠিয়ে যেকোনো সময় অর্ডার করুন
              </p>
            </div>
          </div>
          <button
            id="btn-close-sms-quick-modal"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Form or Result View */}
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  আপনার মোবাইল নম্বর
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-mono text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  আপনার নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: শরিফুল ইসলাম"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                  পণ্য ও ঠিকানার SMS লিখুন
                </label>
                <button
                  type="button"
                  onClick={handleCopySms}
                  className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'কপি হয়েছে' : 'টেক্সট কপি করুন'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="যেমন: ১ কেজি মধু ও ২ লিটার সরিষার তেল পাঠান। মিরপুর ১০, ঢাকা..."
                required
                className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white text-xs font-medium"
              />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong>ক্যাশ অন ডেলিভারি:</strong> মেসেজ পাঠানোর সাথে সাথে Gemini AI আপনার অর্ডার শনাক্ত করে সংশ্লিষ্ট আঞ্চলিক হাব ও রাইডারকে অ্যালার্ট পাঠাবে।
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={directSmsUri}
                className="flex-1 py-2.5 border border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl text-center font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>ফোনের SMS অ্যাপ খুলুন</span>
              </a>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI পার্সিং হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>এখনই অর্ডার পাঠান</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>SMS অর্ডার সফলভাবে সম্পন্ন হয়েছে!</span>
              </div>

              {result.orderId && (
                <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <span>অর্ডার ট্র্যাকিং আইডি:</span>
                  <span className="font-mono text-emerald-600 font-bold">#{result.orderId}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-neutral-500 uppercase">শনাক্তকৃত আইটেম:</span>
                <p className="text-neutral-800 dark:text-neutral-200 font-medium">{result.items.join(', ')}</p>
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/30 p-3 rounded-xl border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300 text-[11px]">
                  <Bot className="w-3.5 h-3.5" />
                  <span>২৪/৭ AI অটো-রিপ্লাই নিশ্চিতকরণ:</span>
                </div>
                <p className="text-sky-950 dark:text-sky-200">{result.replyText}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl font-bold text-xs"
              >
                আরেকটি SMS পাঠান
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                সম্পন্ন হয়েছে
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
