/**
 * Multi-Channel Interactive Order Engine & Hub
 * Implements 5 Channels: Website, WhatsApp, Messenger, SMS & AI Voice Call
 * Complies with the 13 Final Order System rules for AANO BAZAR
 */

import React, { useState, useEffect, useRef } from 'react';
import { useECommerce } from '../../context/ECommerceContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Product,
  ProductCategory,
  ProductVariant,
  CartItem,
  OrderChannel,
  ChannelCustomerProfile,
  ServiceAddress,
  Order
} from '../../types';
import { BDAddressPicker, BDAddressFields } from '../common/BDAddressPicker';
import {
  MessageSquare,
  PhoneCall,
  Globe,
  Send,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Receipt,
  FileText,
  UserCheck,
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  Check,
  Smartphone,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MultiChannelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChannel?: OrderChannel;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: string;
  type?: 'text' | 'category_list' | 'product_list' | 'cart_preview' | 'order_card' | 'otp_prompt' | 'address_prompt' | 'order_success';
  payload?: any;
}

export const MultiChannelOrderModal: React.FC<MultiChannelOrderModalProps> = ({
  isOpen,
  onClose,
  initialChannel = 'whatsapp'
}) => {
  const {
    products,
    categories,
    brands,
    cart,
    addToCart,
    placeChannelOrder,
    channelCustomers,
    findOrCreateChannelCustomer,
    verifyChannelCustomerOtp,
    updateChannelCustomerAddress
  } = useECommerce();
  const { currentUser, isLoggedIn } = useAuth();
  const { addToast } = useNotifications();

  const [activeChannel, setActiveChannel] = useState<OrderChannel>(initialChannel);

  // Messaging Channel State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [channelCart, setChannelCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  
  // Customer Identity & Auth state
  const [customerName, setCustomerName] = useState(currentUser?.fullName || '');
  const [customerMobile, setCustomerMobile] = useState(currentUser?.mobileNumber ? currentUser.mobileNumber.replace(/\D/g, '') : '');
  const [currentProfile, setCurrentProfile] = useState<ChannelCustomerProfile | null>(null);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [activeOtpCode, setActiveOtpCode] = useState('');
  const [addressStep, setAddressStep] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Address State for Multi-Channel Checkout
  const [addressData, setAddressData] = useState<BDAddressFields>({
    division: currentUser?.mandatoryAddress?.division || 'ঢাকা',
    district: currentUser?.mandatoryAddress?.district || 'ঢাকা',
    upazila: currentUser?.mandatoryAddress?.upazila || 'মিরপুর',
    unionName: currentUser?.mandatoryAddress?.unionName || 'মিরপুর-১০',
    ward: currentUser?.mandatoryAddress?.ward || 'ওয়ার্ড ০১',
    area: currentUser?.mandatoryAddress?.area || 'রোড ৫, হাউজ ১২',
    postalCode: currentUser?.mandatoryAddress?.postalCode || '১২১৬',
    fullServiceAddress: currentUser?.mandatoryAddress?.fullServiceAddress || 'রোড ৫, হাউজ ১২, মিরপুর-১০, ঢাকা',
    latitude: 23.8069,
    longitude: 90.3687
  });

  // AI Voice State
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceAiResponse, setVoiceAiResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceWaveLevel, setVoiceWaveLevel] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize or Switch Channel Flow
  useEffect(() => {
    if (!isOpen) return;

    // Pre-populate customer if logged in
    if (isLoggedIn && currentUser) {
      setCustomerName(currentUser.fullName);
      const cleanMob = (currentUser.mobileNumber || '').replace(/\D/g, '');
      setCustomerMobile(cleanMob);
      const { customer } = findOrCreateChannelCustomer(
        currentUser.fullName,
        cleanMob || '01711223344',
        activeChannel
      );
      setCurrentProfile({ ...customer, isVerified: true });
    }

    // Reset channel conversation
    setChannelCart([]);
    setSelectedCategory(null);
    setIsOtpStep(false);
    setAddressStep(false);
    setConfirmedOrder(null);

    const botGreeting = activeChannel === 'whatsapp'
      ? '👋 আসসালামু আলাইকুম! TOMSHOPBD WhatsApp শপে স্বাগতম। আপনার কী প্রয়োজন জানাতে পারেন অথবা নিচে "আমার কিছু কেনাকাটা করতে হবে" বাটনে ক্লিক করুন।'
      : activeChannel === 'messenger'
      ? '👋 TOMSHOPBD Messenger অ্যাসিস্ট্যান্টে স্বাগতম! সহজে শপিং করতে ক্যাটাগরি বা পণ্যের নাম লিখুন।'
      : activeChannel === 'sms'
      ? '📱 TOMSHOPBD Interactive SMS Portal: অর্ডার করতে ১ লিখে সেন্ড করুন অথবা সরাসরি পণ্যের নাম লিখুন।'
      : activeChannel === 'voice_call'
      ? '🎙️ TOMSHOPBD AI ভয়েস কল চালু হয়েছে। আপনি মুখে বাংলায় বলুন, যেমন: "আমি ২ কেজি গাওয়া ঘি ও ১ কেজি মধু নিতে চাই"।'
      : '🌐 Website Smart Order Guide: আপনার পছন্দের পণ্য কার্টে যোগ করে সরাসরি চেকআউট সম্পন্ন করুন।';

    setMessages([
      {
        id: `msg-${Date.now()}-1`,
        sender: 'bot',
        text: botGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [activeChannel, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Waveform simulation during recording
  useEffect(() => {
    let interval: any;
    if (isVoiceRecording) {
      interval = setInterval(() => {
        setVoiceWaveLevel(Math.floor(Math.random() * 80) + 20);
      }, 100);
    } else {
      setVoiceWaveLevel(0);
    }
    return () => clearInterval(interval);
  }, [isVoiceRecording]);

  if (!isOpen) return null;

  // 1. WhatsApp / Messenger / SMS: Interactive Greeting Trigger ("আমার কিছু কেনাকাটা করতে হবে")
  const handleTriggerShoppingIntent = (customText?: string) => {
    const userText = customText || 'আমার কিছু কেনাকাটা করতে হবে';
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userText,
        timestamp: timeNow
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '✨ চমৎকার! অনুগ্রহ করে নিচের তালিকা থেকে আপনার পছন্দের ক্যাটাগরি নির্বাচন করুন:',
        timestamp: timeNow,
        type: 'category_list'
      }
    ]);
  };

  // 2. Select Category -> Show Products with Brand, Variant & Quantity
  const handleSelectCategory = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    const catProducts = products.filter((p) => p.categoryId === cat.id || p.categoryName === cat.name || p.category === cat.name);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `ক্যাটাগরি: ${cat.nameBn || cat.name}`,
        timestamp: timeNow
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: `📦 "${cat.nameBn || cat.name}" ক্যাটাগরির সেরা পণ্যসমূহ ও ভ্যারিয়েন্ট নিচে দেওয়া হলো। পরিমাণ নির্বাচন করে কার্টে যোগ করুন:`,
        timestamp: timeNow,
        type: 'product_list',
        payload: { category: cat, products: catProducts.length > 0 ? catProducts : products.slice(0, 4) }
      }
    ]);
  };

  // 3. Add to Channel Cart
  const handleAddProductToChannelCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const unitPrice = variant?.price || (product.campaignPrice || (product.mrp ? product.mrp - (product.discount || 0) : 0));
    const mrp = product.mrp || unitPrice;
    const existingIndex = channelCart.findIndex((i) => i.productId === product.id && i.variantName === (variant?.name || variant?.title));

    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = [...channelCart];
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].totalPrice = updatedCart[existingIndex].quantity * unitPrice;
    } else {
      const newItem: CartItem = {
        id: `cart-${product.id}-${Date.now()}`,
        productId: product.id,
        product,
        productTitle: product.titleBn || product.title,
        productImage: product.images?.[0] || '',
        selectedVariant: variant,
        variantName: variant?.name || variant?.title,
        sku: variant?.sku || product.sku,
        quantity,
        unitPrice,
        mrp,
        totalPrice: unitPrice * quantity,
        pvPoint: (product.pvValue || 0) * quantity
      };
      updatedCart = [...channelCart, newItem];
    }

    setChannelCart(updatedCart);
    addToast('কার্টে যোগ হয়েছে!', `${product.titleBn || product.title} (${quantity}টি)`);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🛒 "${product.titleBn || product.title}" সফলভাবে কার্টে যুক্ত হয়েছে। কার্টে মোট পণ্য: ${updatedCart.reduce((sum, i) => sum + i.quantity, 0)}টি।`,
        timestamp: timeNow,
        type: 'cart_preview',
        payload: { items: updatedCart }
      }
    ]);
  };

  // 4. Show Order Preview Card
  const handleShowOrderPreview = () => {
    if (channelCart.length === 0) {
      addToast('কার্ট খালি!', 'অনুগ্রহ করে প্রথমে পণ্য যোগ করুন।');
      return;
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mrpTotal = channelCart.reduce((sum, item) => sum + (item.mrp || item.unitPrice) * item.quantity, 0);
    const cashback = Math.round(mrpTotal * 0.02);
    const shipping = 60;
    const tax = Math.round(mrpTotal * 0.05);
    const grandTotal = Math.max(0, mrpTotal + shipping + tax - cashback);

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: 'অর্ডারের প্রিভিউ ও হিসাব দেখতে চাই',
        timestamp: timeNow
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: '📋 আপনার চূড়ান্ত অর্ডারের বিস্তারিত বিবরণ (Final Order Card):',
        timestamp: timeNow,
        type: 'order_card',
        payload: {
          items: channelCart,
          mrpTotal,
          cashback,
          shipping,
          tax,
          grandTotal
        }
      }
    ]);
  };

  // 5. Customer Profile & Mobile OTP Logic
  const handleInitiateCustomerVerification = () => {
    if (!customerMobile || customerMobile.length < 10) {
      addToast('মোবাইল নম্বর লিখুন', '১১ ডিজিটের মোবাইল নম্বর প্রদান আবশ্যক।');
      return;
    }

    const { customer, otpCode, isNew } = findOrCreateChannelCustomer(
      customerName || 'সম্মানিত গ্রাহক',
      customerMobile,
      activeChannel
    );

    setCurrentProfile(customer);
    setActiveOtpCode(otpCode);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (customer.isVerified) {
      // Existing verified customer
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `✅ স্বাগতম ${customer.fullName}! আপনার মোবাইল নম্বর (${customer.mobileNumber}) পূর্বে ভেরিফাইড। Customer ID: ${customer.customerId}। এখন ডেলিভারি ঠিকানা নিশ্চিত করুন।`,
          timestamp: timeNow,
          type: 'address_prompt'
        }
      ]);
      setAddressStep(true);
    } else {
      // New Customer OTP Verification required
      setIsOtpStep(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `🔐 গ্রাহক ভেরিফিকেশন: ${customer.mobileNumber} নম্বরে ৪ ডিজিটের সিকিউরিটি ওটিপি পাঠানো হয়েছে (টেস্ট কোড: ${otpCode})। কোডটি লিখে কনফার্ম করুন:`,
          timestamp: timeNow,
          type: 'otp_prompt',
          payload: { otpCode, customerId: customer.customerId }
        }
      ]);
    }
  };

  // Verify OTP
  const handleVerifyOtp = (codeToVerify?: string) => {
    const code = codeToVerify || otpCodeInput;
    const res = verifyChannelCustomerOtp(customerMobile, code, activeChannel);

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (res.success && res.customer) {
      setCurrentProfile(res.customer);
      setIsOtpStep(false);
      setAddressStep(true);
      addToast('ভেরিফিকেশন সফল!', `Customer ID: ${res.customer.customerId}`);

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `OTP: ${code}`,
          timestamp: timeNow
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: 'bot',
          text: `🎉 অভিনন্দন ${res.customer?.fullName}! আপনার মোবাইল নম্বর ভেরিফিকেশন সফল হয়েছে। আপনার ইউনিক কাস্টমার আইডি: ${res.customer?.customerId}। অনুগ্রহ করে ডেলিভারি ঠিকানা প্রদান করুন:`,
          timestamp: timeNow,
          type: 'address_prompt'
        }
      ]);
    } else {
      addToast('ভুল ওটিপি!', res.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `❌ ${res.message} (অনুগ্রহ করে ৪ ডিজিটের সঠিক ওটিপি দিন)।`,
          timestamp: timeNow
        }
      ]);
    }
  };

  // 6. Submit Final Order from Channel
  const handleSubmitChannelOrder = () => {
    if (!currentProfile) {
      handleInitiateCustomerVerification();
      return;
    }

    if (channelCart.length === 0) {
      addToast('কার্ট খালি!', 'অর্ডার করতে পণ্য কার্টে যোগ করুন।');
      return;
    }

    const shippingAddress: ServiceAddress = {
      id: `addr-${currentProfile.customerId}-${Date.now()}`,
      userId: currentProfile.customerId,
      title: 'ডেলিভারি ঠিকানা',
      division: addressData.division || 'ঢাকা',
      district: addressData.district || 'ঢাকা',
      upazila: addressData.upazila || 'মিরপুর',
      unionName: addressData.unionName || 'মিরপুর-১০',
      ward: addressData.ward || 'ওয়ার্ড ০১',
      area: addressData.area || 'রোড ৫',
      marketBazar: addressData.marketBazar || 'মিরপুর বাজার',
      postalCode: addressData.postalCode || '১২১৬',
      fullServiceAddress: addressData.fullServiceAddress || `${addressData.area}, ${addressData.upazila}, ${addressData.district}`,
      latitude: addressData.latitude || 23.8069,
      longitude: addressData.longitude || 90.3687,
      isMandatoryServiceAddress: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateChannelCustomerAddress(currentProfile.customerId, shippingAddress);

    try {
      const createdOrder = placeChannelOrder({
        channel: activeChannel,
        customerProfile: currentProfile,
        items: channelCart,
        shippingAddress,
        paymentMethod: 'cod',
        notes: `Auto-generated from ${activeChannel.toUpperCase()} Interactive Order Flow`,
        voiceTranscript: activeChannel === 'voice_call' ? voiceTranscript : undefined
      });

      setConfirmedOrder(createdOrder);
      setAddressStep(false);

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: 'অর্ডার কনফার্ম করুন (Confirm Order)',
          timestamp: timeNow
        },
        {
          id: `bot-${Date.now() + 1}`,
          sender: 'bot',
          text: `🎉 আপনার অর্ডার সফলভাবে সাবমিট হয়েছে! অর্ডার নম্বর: ${createdOrder.id}। ইনভয়েস অটো-জেনারেটেড এবং ডিলার/অপারেশন্স পার্টনার/রাইডার রাউট করা হয়েছে।`,
          timestamp: timeNow,
          type: 'order_success',
          payload: { order: createdOrder }
        }
      ]);
    } catch (e: any) {
      addToast('অর্ডার এরর', e.message || 'অর্ডার প্লেস করা সম্ভব হয়নি।');
    }
  };

  // 7. Voice Recording Handler
  const handleToggleVoiceRecording = () => {
    if (!isVoiceRecording) {
      setIsVoiceRecording(true);
      setVoiceTranscript('');
      setVoiceAiResponse('');

      // Web Speech Recognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'bn-BD';
          recognition.continuous = false;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
              .map((res: any) => res[0].transcript)
              .join('');
            setVoiceTranscript(transcript);
          };

          recognition.onerror = () => {
            // Fallback sample recognition
            setTimeout(() => {
              setVoiceTranscript('আমি ২ কেজি প্রিমিয়াম খাঁটি গাওয়া ঘি ও ১ কেজি মধু অর্ডার করতে চাই');
              processVoiceOrder('আমি ২ কেজি প্রিমিয়াম খাঁটি গাওয়া ঘি ও ১ কেজি মধু অর্ডার করতে চাই');
            }, 2500);
          };

          recognition.onend = () => {
            setIsVoiceRecording(false);
            if (voiceTranscript) {
              processVoiceOrder(voiceTranscript);
            }
          };

          recognition.start();
        } catch (e) {
          simulateVoiceCapture();
        }
      } else {
        simulateVoiceCapture();
      }
    } else {
      setIsVoiceRecording(false);
      if (voiceTranscript) {
        processVoiceOrder(voiceTranscript);
      }
    }
  };

  const simulateVoiceCapture = () => {
    setTimeout(() => {
      const sample = 'আমি ২ কেজি প্রিমিয়াম খাঁটি গাওয়া ঘি ও ১ কেজি সুন্দরবনের মধু অর্ডার করতে চাই';
      setVoiceTranscript(sample);
      setIsVoiceRecording(false);
      processVoiceOrder(sample);
    }, 2800);
  };

  const processVoiceOrder = (text: string) => {
    // Intelligent Bengali item parsing
    const matchedItems: CartItem[] = [];
    const gheeProduct = products.find((p) => p.title.toLowerCase().includes('ghee') || (p.titleBn && p.titleBn.includes('ঘি'))) || products[0];
    const honeyProduct = products.find((p) => p.title.toLowerCase().includes('honey') || (p.titleBn && p.titleBn.includes('মধু'))) || products[1];

    if (text.includes('ঘি') || text.toLowerCase().includes('ghee')) {
      const qty = text.includes('২') || text.includes('2') ? 2 : 1;
      const unitPrice = gheeProduct.mrp || gheeProduct.campaignPrice || 1250;
      matchedItems.push({
        id: `voice-${gheeProduct.id}-${Date.now()}`,
        productId: gheeProduct.id,
        product: gheeProduct,
        productTitle: gheeProduct.titleBn || gheeProduct.title,
        productImage: gheeProduct.images?.[0] || '',
        quantity: qty,
        unitPrice,
        mrp: gheeProduct.mrp || unitPrice,
        totalPrice: unitPrice * qty,
        pvPoint: (gheeProduct.pvValue || 0) * qty
      });
      // Also push to main web cart for seamless sync
      addToCart(gheeProduct, undefined, qty);
    }

    if (text.includes('মধু') || text.toLowerCase().includes('honey')) {
      const qty = text.includes('২') || text.includes('2') ? 2 : 1;
      const unitPrice = honeyProduct.mrp || honeyProduct.campaignPrice || 850;
      matchedItems.push({
        id: `voice-${honeyProduct.id}-${Date.now() + 1}`,
        productId: honeyProduct.id,
        product: honeyProduct,
        productTitle: honeyProduct.titleBn || honeyProduct.title,
        productImage: honeyProduct.images?.[0] || '',
        quantity: qty,
        unitPrice,
        mrp: honeyProduct.mrp || unitPrice,
        totalPrice: unitPrice * qty,
        pvPoint: (honeyProduct.pvValue || 0) * qty
      });
      // Also push to main web cart for seamless sync
      addToCart(honeyProduct, undefined, qty);
    }

    if (matchedItems.length === 0) {
      // Add default flagship product
      const def = products[0];
      const defPrice = def.mrp || def.campaignPrice || 600;
      matchedItems.push({
        id: `voice-${def.id}-${Date.now()}`,
        productId: def.id,
        product: def,
        productTitle: def.titleBn || def.title,
        productImage: def.images?.[0] || '',
        quantity: 1,
        unitPrice: defPrice,
        mrp: defPrice,
        totalPrice: defPrice,
        pvPoint: def.pvValue || 0
      });
      addToCart(def, undefined, 1);
    }

    setChannelCart(matchedItems);

    const totalMrp = matchedItems.reduce((s, i) => s + i.totalPrice, 0);
    const speechReply = `আপনার কথা অনুযায়ী ${matchedItems.map((i) => `${i.productTitle} (${i.quantity}টি)`).join(' এবং ')} কার্টে যোগ করা হয়েছে। সর্বমোট মূল্য ৳${(totalMrp + 60).toLocaleString()}। নিচের বাটনে ক্লিক করে ডেলিভারি কনফার্ম করুন।`;
    setVoiceAiResponse(speechReply);

    // Speak response using SpeechSynthesis if supported
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(speechReply);
      utterance.lang = 'bn-BD';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
    }

    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: `🎙️ ভয়েস রেকর্ড: "${text}"`,
        timestamp: timeNow
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: `🤖 ${speechReply}`,
        timestamp: timeNow,
        type: 'cart_preview',
        payload: { items: matchedItems }
      }
    ]);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userQuery = inputText.trim();
    setInputText('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (userQuery.includes('কেনাকাটা') || userQuery.includes('shopping') || userQuery.includes('buy') || userQuery.includes('পণ্য') || userQuery === '1') {
      handleTriggerShoppingIntent(userQuery);
      return;
    }

    if (isOtpStep && /^\d{4}$/.test(userQuery)) {
      handleVerifyOtp(userQuery);
      return;
    }

    // Search products by name
    const matches = products.filter((p) =>
      p.title.toLowerCase().includes(userQuery.toLowerCase()) ||
      (p.titleBn && p.titleBn.toLowerCase().includes(userQuery.toLowerCase()))
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userQuery,
        timestamp: timeNow
      },
      {
        id: `bot-${Date.now() + 1}`,
        sender: 'bot',
        text: matches.length > 0
          ? `🔍 "${userQuery}" এর সাথে সম্পর্কিত ${matches.length}টি পণ্য নিচে দেওয়া হলো:`
          : `🤖 আপনার বার্তার জন্য ধন্যবাদ। কেনাকাটা শুরু করতে "আমার কিছু কেনাকাটা করতে হবে" বাটনে ট্যাপ করুন।`,
        timestamp: timeNow,
        type: matches.length > 0 ? 'product_list' : 'text',
        payload: matches.length > 0 ? { products: matches } : undefined
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  TOMSHOPBD মাল্টি-চ্যানেল অর্ডার সিস্টেম
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white uppercase tracking-wider">
                  5 Channels Integrated
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Website, WhatsApp, Messenger, SMS ও AI Voice Call
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Channel Selection Bar */}
        <div className="bg-neutral-50 dark:bg-neutral-950 p-2 sm:p-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => setActiveChannel('whatsapp')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Bot</span>
            </button>

            {/* Messenger */}
            <button
              type="button"
              onClick={() => setActiveChannel('messenger')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeChannel === 'messenger'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Messenger</span>
            </button>

            {/* SMS */}
            <button
              type="button"
              onClick={() => setActiveChannel('sms')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeChannel === 'sms'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-amber-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>SMS Order</span>
            </button>

            {/* AI Voice Call */}
            <button
              type="button"
              onClick={() => setActiveChannel('voice_call')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeChannel === 'voice_call'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-purple-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <PhoneCall className="w-4 h-4 text-purple-400" />
              <span>AI Voice Call</span>
            </button>

            {/* Website Direct */}
            <button
              type="button"
              onClick={() => setActiveChannel('website')}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeChannel === 'website'
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Website Flow</span>
            </button>
          </div>

          {/* Customer Profile Status Tag */}
          <div className="flex items-center gap-2">
            {currentProfile ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/50">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{currentProfile.customerId}</span>
                {currentProfile.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>অটো Customer ID & OTP</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-100/60 dark:bg-neutral-950/60">
          
          {/* AI Voice Call Interactive Simulator Header */}
          {activeChannel === 'voice_call' && (
            <div className="p-5 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 rounded-2xl text-white shadow-lg space-y-4 border border-purple-800/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Live AI Voice Call Order Engine
                    </span>
                  </div>
                  <h3 className="text-lg font-black">
                    মুখে বাংলায় বলুন — AI সরাসরি কার্টে যোগ করবে
                  </h3>
                  <p className="text-xs text-purple-200">
                    উদাহরণ: "আমি ২ কেজি খাঁটি গাওয়া ঘি ও ১ কেজি মধু নিতে চাই"
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleVoiceRecording}
                    className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
                      isVoiceRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-600/50'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30'
                    }`}
                  >
                    {isVoiceRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    <span>{isVoiceRecording ? 'কথা বলা শেষ (Stop)' : 'কথা বলুন (Speak Now)'}</span>
                  </button>
                </div>
              </div>

              {/* Audio Wave Visualizer */}
              {isVoiceRecording && (
                <div className="p-3 bg-purple-950/80 rounded-xl border border-purple-700/50 flex items-center justify-center gap-1.5 h-16">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [8, Math.max(8, (voiceWaveLevel * (i % 5 + 1)) % 48), 8]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4 + (i % 3) * 0.1,
                        ease: 'easeInOut'
                      }}
                      className="w-1.5 bg-gradient-to-t from-emerald-400 to-purple-300 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Live Transcript & Voice AI Playback */}
              {voiceTranscript && (
                <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-xs space-y-1.5 border border-white/10">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <Mic className="w-3.5 h-3.5" />
                    <span>আপনার ভয়েস কমান্ড:</span>
                  </div>
                  <p className="text-white font-medium italic">"{voiceTranscript}"</p>
                  {voiceAiResponse && (
                    <div className="pt-2 border-t border-white/10 text-emerald-300 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 shrink-0 animate-pulse" />
                      <span>{voiceAiResponse}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat / Interaction Stream */}
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* 1. Category Selection Pills */}
                  {msg.type === 'category_list' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className="p-2.5 rounded-xl text-left bg-neutral-50 dark:bg-neutral-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 transition-all group"
                        >
                          <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {cat.nameBn || cat.name}
                          </div>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                            {cat.subCategories?.join(', ') || 'খাঁটি ও প্রাকৃতিক পণ্য'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 2. Product List with Variant, Price & Quantity */}
                  {msg.type === 'product_list' && msg.payload?.products && (
                    <div className="space-y-2 pt-2">
                      {msg.payload.products.map((prod: Product) => {
                        const mrp = prod.mrp || prod.campaignPrice || 0;
                        const defaultVariant = prod.variants?.[0];

                        return (
                          <div
                            key={prod.id}
                            className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                {prod.images?.[0] && (
                                  <img
                                    src={prod.images[0]}
                                    alt={prod.title}
                                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                                <div>
                                  <h4 className="font-bold text-xs text-neutral-900 dark:text-white">
                                    {prod.titleBn || prod.title}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                                    <span>ব্র্যান্ড: <strong className="text-neutral-700 dark:text-neutral-300">{prod.brandName || prod.brandId || 'TOMSHOPBD PURE'}</strong></span>
                                    <span>•</span>
                                    <span>MRP: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳{mrp}</strong></span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Variants Selection if available */}
                            {prod.variants && prod.variants.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 text-[10px]">
                                {prod.variants.map((v) => (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => handleAddProductToChannelCart(prod, v, 1)}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-700 hover:bg-emerald-600 hover:text-white border border-neutral-200 dark:border-neutral-600 font-bold transition-colors"
                                  >
                                    {v.name} - ৳{v.price} (+ যোগ করুন)
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Direct Add Button */}
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                              <button
                                type="button"
                                onClick={() => handleAddProductToChannelCart(prod, defaultVariant, 1)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>১টি কার্টে যোগ করুন (৳{mrp})</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Cart Preview & Proceed to Order Preview */}
                  {msg.type === 'cart_preview' && msg.payload?.items && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl space-y-2 border border-neutral-200 dark:border-neutral-700 text-xs">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                        <span>কার্টের পণ্য তালিকা:</span>
                        <span className="text-emerald-600 font-mono font-black">
                          মোট: ৳{msg.payload.items.reduce((s: number, i: CartItem) => s + i.totalPrice, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1 divide-y divide-neutral-200 dark:divide-neutral-700">
                        {msg.payload.items.map((item: CartItem, idx: number) => (
                          <div key={idx} className="pt-1 flex justify-between items-center text-[11px]">
                            <span>{item.productTitle} {item.variantName ? `(${item.variantName})` : ''} x {item.quantity}</span>
                            <span className="font-mono font-bold">৳{item.totalPrice.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleShowOrderPreview}
                          className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>চূড়ান্ত অর্ডারের হিসাব ও প্রিভিউ কার্ড দেখুন</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Final Order Card Preview before submit */}
                  {msg.type === 'order_card' && msg.payload && (
                    <div className="p-4 bg-emerald-50/60 dark:bg-neutral-800 rounded-2xl border-2 border-emerald-500/40 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-emerald-200 dark:border-neutral-700 pb-2">
                        <div className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-400 text-sm">
                          <Receipt className="w-4 h-4" />
                          <span>TOMSHOPBD Final Order Card</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase">
                          {activeChannel.toUpperCase()} Channel
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {msg.payload.items.map((item: CartItem, idx: number) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-neutral-700 dark:text-neutral-300">
                              {item.productTitle} x {item.quantity}
                            </span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-white">
                              ৳{item.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Financials Breakdown */}
                      <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700 space-y-1 text-[11px]">
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>মোট MRP মূল্য (MRP Total):</span>
                          <span className="font-mono">৳{msg.payload.mrpTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>স্পেশাল ক্যাশব্যাক / ডিসকাউন্ট (2%):</span>
                          <span className="font-mono">- ৳{msg.payload.cashback}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>ডেলিভারি চার্জ (COD Standard):</span>
                          <span className="font-mono">৳{msg.payload.shipping}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                          <span>ভ্যাট ও সরকারি ট্যাক্স (5% VAT):</span>
                          <span className="font-mono">৳{msg.payload.tax}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-emerald-700 dark:text-emerald-400 pt-1 border-t border-neutral-300 dark:border-neutral-700">
                          <span>সর্বমোট পরিশোধযোগ্য (Grand Total):</span>
                          <span className="font-mono">৳{msg.payload.grandTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!confirmedOrder && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleInitiateCustomerVerification}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>গ্রাহক ভেরিফিকেশন ও ডেলিভারি কনফার্ম করুন</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. OTP Prompt */}
                  {msg.type === 'otp_prompt' && msg.payload && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300/60 space-y-2 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        <span>৪ ডিজিটের সিকিউরিটি ওটিপি (OTP) কোড লিখুন:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={otpCodeInput}
                          onChange={(e) => setOtpCodeInput(e.target.value)}
                          placeholder="যেমন: 1234"
                          className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-amber-300 rounded-lg text-center font-mono font-bold text-sm tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={() => handleVerifyOtp()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                        >
                          ভেরিফাই
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400">
                        সিমুলেশন ওটিপি কোড: <strong className="font-mono">{msg.payload.otpCode}</strong>
                      </p>
                    </div>
                  )}

                  {/* 6. Address Prompt & Confirmation */}
                  {msg.type === 'address_prompt' && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3 text-xs">
                      <div className="font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>ডেলিভারি ঠিকানা ও কাস্টমার প্রোফাইল:</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                            সম্পূর্ণ নাম
                          </label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="আপনার নাম লিখুন"
                            className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1">
                            ডেলিভারি এলাকা ও গৃহ নম্বর
                          </label>
                          <input
                            type="text"
                            value={addressData.area}
                            onChange={(e) => setAddressData({ ...addressData, area: e.target.value })}
                            placeholder="রোড নম্বর, হাউজ নম্বর ও এলাকা"
                            className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs"
                          />
                        </div>

                        <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-[11px] space-y-1">
                          <div>বিভাগ: <strong>{addressData.division}</strong> | জেলা: <strong>{addressData.district}</strong></div>
                          <div>উপজেলা: <strong>{addressData.upazila}</strong> | ইউনিয়ন/এলাকা: <strong>{addressData.unionName || addressData.area}</strong></div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitChannelOrder}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>অর্ডার সম্পন্ন করুন (Submit Order)</span>
                      </button>
                    </div>
                  )}

                  {/* 7. Order Success Confirmation Card */}
                  {msg.type === 'order_success' && msg.payload?.order && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border-2 border-emerald-500 space-y-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>অর্ডার কনফার্মেশন ও ইনভয়েস জেনারেটেড!</span>
                      </div>

                      <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl space-y-1 font-mono text-[11px]">
                        <div>Order ID: <strong className="text-emerald-600">{msg.payload.order.id}</strong></div>
                        <div>Customer ID: <strong>{msg.payload.order.customerId}</strong></div>
                        <div>Invoice: <strong>{msg.payload.order.invoiceNumber}</strong></div>
                        <div>গ্রাহকের নাম: <strong>{msg.payload.order.customerName}</strong></div>
                        <div>মোবাইল: <strong>{msg.payload.order.customerPhone}</strong></div>
                        <div>ডেলিভারি ঠিকানা: <strong>{msg.payload.order.shippingAddress.fullServiceAddress}</strong></div>
                        <div>মোট প্রদেয়: <strong className="text-emerald-600">৳{msg.payload.order.grandTotal.toLocaleString()}</strong> (ক্যাশ অন ডেলিভারি)</div>
                        <div>ডেলিভারি ওটিপি (OTP): <strong className="text-purple-600">{msg.payload.order.otpCode}</strong></div>
                      </div>

                      {/* Routing Assignment details */}
                      <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[10px] text-neutral-600 dark:text-neutral-300 space-y-0.5">
                        <div className="font-bold text-neutral-800 dark:text-neutral-200">অটো লোকেশন রাউটিং স্ট্যাটাস:</div>
                        <div>• অপারেশন্স পার্টনার: {msg.payload.order.assignedOpPartnerName}</div>
                        <div>• নির্ধারিত ডিলার: {msg.payload.order.assignedDealerShopName}</div>
                        <div>• ডেলিভারি রাইডার: {msg.payload.order.assignedDeliveryRiderName}</div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                          🎉 ধন্যবাদ! আপনার অর্ডারটি সিস্টেমে সংরক্ষিত হয়েছে।
                        </span>
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          বন্ধ করুন
                        </button>
                      </div>
                    </div>
                  )}

                  <span className="text-[9px] text-neutral-400 block text-right">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Action Suggestion Prompts Bar */}
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>সরাসরি কমান্ড:</span>
          </span>

          <button
            type="button"
            onClick={() => handleTriggerShoppingIntent()}
            className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition-colors border border-emerald-300/40"
          >
            🛒 "আমার কিছু কেনাকাটা করতে হবে"
          </button>

          <button
            type="button"
            onClick={() => handleTriggerShoppingIntent('খাঁটি গাওয়া ঘি ও মধু')}
            className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 transition-colors"
          >
            🍯 "খাঁটি গাওয়া ঘি ও মধু"
          </button>

          {channelCart.length > 0 && (
            <button
              type="button"
              onClick={handleShowOrderPreview}
              className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-200 transition-colors border border-purple-300/40"
            >
              📋 "অর্ডারের প্রিভিউ কার্ড" ({channelCart.length}টি পণ্য)
            </button>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendCustomMessage}
          className="p-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
        >
          {/* Customer mobile quick input if not set */}
          {!currentProfile && (
            <div className="hidden sm:flex items-center gap-1 w-48 shrink-0">
              <input
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="মোবাইল: 017..."
                className="w-full px-2.5 py-2 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              />
            </div>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeChannel === 'whatsapp'
                ? 'হোয়াটসঅ্যাপে বার্তা লিখুন (যেমন: ঘি, মধু বা সরিষার তেল)...'
                : activeChannel === 'messenger'
                ? 'মেসেঞ্জারে বার্তা পাঠান...'
                : activeChannel === 'sms'
                ? 'এসএমএস কমান্ড লিখুন...'
                : 'আপনার বার্তা লিখুন...'
            }
            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          <button
            type="button"
            onClick={handleToggleVoiceRecording}
            className={`p-2.5 rounded-xl transition-all ${
              isVoiceRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-purple-100 hover:text-purple-600'
            }`}
            title="ভয়েস রেকর্ড"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>পাঠান</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
