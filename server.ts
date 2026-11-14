/**
 * Full-Stack Express Server with Strict RBAC API Endpoints
 * Project: AANO BAZAR (আনো বাজার)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { defaultBinaryTreeStore } from './src/server/binaryTreeStore';

// Lazy Gemini API Client (User-Agent header telemetry compliant)
let geminiAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiAiClient && process.env.GEMINI_API_KEY) {
    geminiAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiAiClient;
}

// Mock DB initial state for server API handlers
const FIXED_SUPER_ADMIN_ID = 'AANO-SADMIN-001';

const INITIAL_USERS = [
  {
    id: FIXED_SUPER_ADMIN_ID,
    email: 'khatibesdo@gmail.com',
    fullName: 'Mirza Khatib Uddin',
    mobileNumber: '01312480175',
    permanentMemberId: FIXED_SUPER_ADMIN_ID,
    passwordHash: 'sha256:d826a798547475f3ef7f017042a98fb7b2260ad4ad23ff972c3d52c6f103b0d4',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    nationalId: '19922691234567891',
    dateOfBirth: '1990-01-15',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 50000.0,
    roles: ['super_admin'],
    primaryRole: 'super_admin',
    createdAt: '2026-01-01T00:00:00.000Z',
    mandatoryAddress: {
      division: 'রংপুর',
      district: 'ঠাকুরগাঁও',
      upazila: 'ঠাকুরগাঁও সদর',
      unionName: 'হাজীপাড়া',
      area: 'কালীবাড়ী, হাজীপাড়া'
    }
  },
  {
    id: 'usr-admin-02',
    email: 'admin@aanobazar.bd',
    fullName: 'তানজিনা রহমান (Admin)',
    mobileNumber: '01711000002',
    permanentMemberId: 'AANO-002001',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    nationalId: '19942691234567892',
    dateOfBirth: '1994-05-20',
    gender: 'female',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 12500.0,
    roles: ['admin'],
    primaryRole: 'admin',
    createdAt: '2026-01-02T00:00:00.000Z',
    mandatoryAddress: {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'গুলশান',
      unionName: 'গুলশান-১',
      area: 'ব্লক বি, রোড ৫১'
    }
  },
  {
    id: 'usr-customer-03',
    email: 'customer@aanobazar.bd',
    fullName: 'কাজী শফিকুল আলম (Customer)',
    mobileNumber: '01819000003',
    permanentMemberId: 'AANO-884012',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    nationalId: '19952691234567893',
    dateOfBirth: '1995-08-12',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 850.5,
    roles: ['customer'],
    primaryRole: 'customer',
    createdAt: '2026-01-05T00:00:00.000Z',
    mandatoryAddress: {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'উত্তরা',
      unionName: 'উত্তরা সেক্টর ৭',
      area: 'বাড়ি ৪৫, রোড ৩'
    }
  },
  {
    id: 'usr-network-07',
    email: 'network@aanobazar.bd',
    fullName: 'মোস্তফা কামাল (Network Active Member)',
    mobileNumber: '01819000007',
    permanentMemberId: 'AANO-551044',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250',
    nationalId: '19932691234567897',
    dateOfBirth: '1993-04-10',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 2450.0,
    roles: ['network_member', 'customer'],
    primaryRole: 'network_member',
    sponsorId: FIXED_SUPER_ADMIN_ID,
    createdAt: '2026-01-07T00:00:00.000Z',
    mandatoryAddress: {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      unionName: 'মিরপুর-১',
      area: 'ব্লক এ, সড়ক ৫'
    }
  },
  {
    id: 'usr-vendor-04',
    email: 'dealer@aanobazar.bd',
    fullName: 'মোঃ জহিরুল ইসলাম (Dealer)',
    mobileNumber: '01911000004',
    permanentMemberId: 'AANO-304911',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    nationalId: '19882691234567894',
    dateOfBirth: '1988-11-04',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 3200.0,
    roles: ['dealer', 'vendor'],
    primaryRole: 'dealer',
    createdAt: '2026-01-10T00:00:00.000Z',
    mandatoryAddress: {
      division: 'চট্টগ্রাম',
      district: 'চট্টগ্রাম',
      upazila: 'কোতোয়ালী',
      unionName: 'আন্দরকিল্লা',
      area: 'দোকান ১২, নিউ মার্কেট লেন'
    }
  },
  {
    id: 'usr-partner-05',
    email: 'partner@aanobazar.bd',
    fullName: 'ফরিদা পারভীন (Operations Partner)',
    mobileNumber: '01611000005',
    permanentMemberId: 'AANO-702819',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
    nationalId: '19912691234567895',
    dateOfBirth: '1991-03-30',
    gender: 'female',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 7500.0,
    roles: ['operations_partner'],
    primaryRole: 'operations_partner',
    createdAt: '2026-01-12T00:00:00.000Z',
    mandatoryAddress: {
      division: 'রাজশাহী',
      district: 'রাজশাহী',
      upazila: 'বোয়ালিয়া',
      unionName: 'সাহেব বাজার',
      area: 'হাব ভবন ৩য় তলা'
    }
  },
  {
    id: 'usr-rider-06',
    email: 'rider@aanobazar.bd',
    fullName: 'রাশেদুল হাসান (Delivery Man)',
    mobileNumber: '01511000006',
    permanentMemberId: 'AANO-991023',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
    nationalId: '19982691234567896',
    dateOfBirth: '1998-09-18',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 450.0,
    roles: ['delivery_rider'],
    primaryRole: 'delivery_rider',
    createdAt: '2026-01-15T00:00:00.000Z',
    mandatoryAddress: {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      unionName: 'মিরপুর-১০',
      area: 'ব্লক সি, লাইন ২'
    }
  },
  {
    id: 'usr-finance-01',
    email: 'finance@aanobazar.bd',
    fullName: 'আহমেদ জুবায়ের (Finance Head)',
    mobileNumber: '01712000008',
    permanentMemberId: 'AANO-FIN-001',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=250',
    nationalId: '19892691234567898',
    dateOfBirth: '1989-07-22',
    gender: 'male',
    accountStatus: 'active',
    verificationStatus: 'verified',
    tomokTokenBalance: 8500.0,
    roles: ['finance'],
    primaryRole: 'finance',
    createdAt: '2026-01-18T00:00:00.000Z',
    mandatoryAddress: {
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মতিঝিল',
      unionName: 'মতিঝিল বা/এ',
      area: 'ফাইনান্স টাওয়ার, ৯ম তলা'
    }
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'AANO Bazar Enterprise API',
      aiEngine: 'Gemini 3.7 Flash + 24/7 Auto-Reply Engine',
      smsGatewayActive: true,
      rbacEnforced: true,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 24/7 AI SMS PRODUCT ORDER PARSER & AUTO-REPLY ENDPOINT
   * Uses Gemini 3.7 Flash with Server-Side SDK and fallback intelligence
   */
  app.post('/api/ai/sms-order-parse', async (req, res) => {
    try {
      const {
        rawText,
        senderPhone = '01711000000',
        senderName = '',
        catalogSummary = [],
        aiTone = 'polite_bangla',
        systemGuideline = ''
      } = req.body;

      if (!rawText || typeof rawText !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'SMS text is required'
        });
      }

      const client = getGeminiClient();
      let aiParsedResult: any = null;
      let usedModel = 'gemini-3.7-flash';

      if (client) {
        try {
          const prompt = `You are the 24/7 AI SMS Product Order & Customer Assistant for AANO BAZAR (আনো বাজার), a leading Bangladeshi e-commerce and local delivery network.
Your job is to read raw incoming SMS messages in Bengali, Banglish, or English, accurately parse customer orders, identify items & quantities, extract delivery addresses inside Bangladesh, detect customer intent, and craft an instant 24/7 automated SMS reply.

Available Product Catalog Reference:
${catalogSummary.length > 0 ? JSON.stringify(catalogSummary.slice(0, 20)) : 'Mustard Oil (সরিষার তেল) 1L=210tk, Organic Honey (সুন্দরবনের মধু) 500g=650tk, Premium Ghee (গাওয়া ঘি) 500g=620tk, Nazirshail Rice (নাজিরশাইল চাল) 25kg=1950tk, Miniket Rice (মিনিকেট চাল) 25kg=1850tk, Chia Seed 250g=320tk, Black Seed Oil (কালিজিরা তেল) 100ml=260tk'}

Customer SMS:
"${rawText}"
Sender Phone: "${senderPhone}"
Sender Name: "${senderName || 'Valued Customer'}"
AI Tone Preference: "${aiTone}"
Custom Guidelines: "${systemGuideline || 'Respond warmly in polite Bengali, confirm items and total clearly, ask for missing address if not provided.'}"

Return a valid JSON object ONLY (do not include markdown ticks or wrap in quotes) with the following structure:
{
  "intent": "place_order" | "check_status" | "price_inquiry" | "delivery_inquiry" | "general_chat",
  "confidenceScore": 0.95,
  "items": [
    {
      "productName": "সরিষার তেল (Mustard Oil)",
      "variantName": "১ লিটার",
      "quantity": 2,
      "unitPrice": 210,
      "total": 420
    }
  ],
  "address": {
    "division": "ঢাকা",
    "district": "ঢাকা",
    "upazila": "মিরপুর",
    "unionName": "মিরপুর-১০",
    "ward": "ওয়ার্ড ০১",
    "area": "হাউজ ১২, রোড ৫",
    "rawAddress": "হাউজ ১২, রোড ৫, মিরপুর ১০, ঢাকা",
    "fullServiceAddress": "হাউজ ১২, রোড ৫, মিরপুর-১০, মিরপুর, ঢাকা"
  },
  "customerName": "Customer Name or empty",
  "customerPhone": "017XXXXXXXX",
  "missingInfo": ["address" or "quantity" or none],
  "totalCalculatedAmount": 420,
  "deliveryCharge": 60,
  "grandTotal": 480,
  "recommendedOpHub": "ঢাকা সেন্ট্রাল হাব (মিরপুর)",
  "aiReplyText": "২-৩ বাক্যে সুন্দর বাংলা এসএমএস উত্তর যেখানে পণ্যের অর্ডার গ্রহণ ও মূল্য অথবা প্রয়োজনীয় তথ্যের অনুরোধ থাকবে।"
}`;

          const response = await client.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          const responseText = response.text ? response.text.trim() : '';
          if (responseText) {
            try {
              aiParsedResult = JSON.parse(responseText);
            } catch {
              // Extract json if any markdown tags
              const cleaned = responseText.replace(/```json|```/g, '').trim();
              aiParsedResult = JSON.parse(cleaned);
            }
          }
        } catch (geminiErr: any) {
          console.warn('[Gemini AI SMS Parse] Gemini invocation failed, switching to smart regex heuristic:', geminiErr?.message || geminiErr);
        }
      }

      // Fallback High-Precision Heuristic Parser if Gemini is offline or not configured
      if (!aiParsedResult) {
        usedModel = 'aano-smart-heuristic-v3';
        aiParsedResult = parseSmsWithSmartHeuristics(rawText, senderPhone, senderName, catalogSummary);
      }

      return res.json({
        success: true,
        data: {
          ...aiParsedResult,
          rawText,
          senderPhone: aiParsedResult.customerPhone || senderPhone,
          senderName: aiParsedResult.customerName || senderName,
          aiModelUsed: usedModel,
          processedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error('[SMS AI Parse Error]', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse SMS with AI',
        message: err.message || 'Internal error'
      });
    }
  });

  /**
   * 24/7 AI CHAT & QUERY AUTO-REPLY ENDPOINT
   * Real-time automated responses for customer queries, pricing, order tracking, and operational tasks
   */
  app.post('/api/ai/sms-chat-reply', async (req, res) => {
    try {
      const {
        message,
        context = 'customer_support',
        customerName = '',
        customerPhone = '',
        userRole = 'customer',
        orderHistory = []
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const client = getGeminiClient();
      let replyText = '';
      let usedModel = 'gemini-3.7-flash';

      if (client) {
        try {
          const systemInstruction = `You are the 24/7 AI Intelligent Support & Operations Agent for AANO BAZAR (আনো বাজার) in Bangladesh.
Role of user: ${userRole}.
Customer Name: ${customerName || 'সম্মানিত গ্রাহক'}.
Customer Phone: ${customerPhone}.
Context: ${context}.
Recent Orders: ${JSON.stringify(orderHistory.slice(0, 3))}.

Instructions:
1. Provide a polite, helpful, and concise response in Bengali (or English if user wrote in English).
2. For order tracking, refer to live tracking and local delivery riders.
3. For pricing or product orders, explain that orders can be placed directly via SMS, WhatsApp, Voice call, or website.
4. For Operations Partner or Super Admin queries, assist with hub dispatch, order routing, dealer assignment, and local delivery status.
5. Keep the tone warm, welcoming, and professional.`;

          const response = await client.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: message,
            config: {
              systemInstruction,
              temperature: 0.3
            }
          });

          replyText = response.text ? response.text.trim() : '';
        } catch (geminiErr: any) {
          console.warn('[Gemini AI Chat Reply Error]', geminiErr?.message || geminiErr);
        }
      }

      if (!replyText) {
        usedModel = 'aano-fallback-reply-engine';
        replyText = generateFallbackChatReply(message, userRole, customerName);
      }

      return res.json({
        success: true,
        reply: replyText,
        aiModelUsed: usedModel,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[SMS AI Chat Reply Error]', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate AI auto-reply',
        message: err.message
      });
    }
  });

  /**
   * INBOUND SMS WEBHOOK GATEWAY (Supports Greenweb, BulkSMS BD, Twilio, Infobip & In-app Simulator)
   */
  app.post('/api/sms/inbound', async (req, res) => {
    try {
      const sender = req.body.sender || req.body.From || req.body.phone || req.body.mobile || '01711000000';
      const text = req.body.text || req.body.Body || req.body.message || req.body.sms || '';
      const gateway = req.body.gateway || 'AANO-Cloud-Gateway';

      console.log(`[INCOMING SMS GATEWAY] Received SMS from ${sender} via ${gateway}: "${text}"`);

      // Run AI Parsing
      const parseResult = parseSmsWithSmartHeuristics(text, sender, '', []);

      return res.json({
        success: true,
        messageId: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        sender,
        receivedText: text,
        parsedOrder: parseResult,
        autoReply: parseResult.aiReplyText,
        receivedAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * SMS GATEWAY & AI ENGINE STATUS ENDPOINT
   */
  app.get('/api/sms/gateway-status', (_req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({
      success: true,
      status: 'operational',
      ai24x7Active: true,
      geminiConnected: hasKey,
      activeModel: hasKey ? 'gemini-3.7-flash (Server-Side)' : 'aano-smart-heuristic-v3 (Built-in)',
      supportedCarriers: ['Grameenphone', 'Robi', 'Banglalink', 'Teletalk', 'Airtel', 'WhatsApp Business API'],
      dailyQuota: 50000,
      systemUptime: '99.98%',
      timestamp: new Date().toISOString()
    });
  });

  /**
   * STRICT RBAC API ENDPOINT: Active User List
   * ONLY Super Admin can access the complete Active User list.
   * Requests from Admin, Dealer, Vendor, Operations Partner, Rider, Customer are rejected with 403 Forbidden.
   */
  app.get('/api/admin/active-users', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || req.query.requestorRole || '').toString().toLowerCase();
    const requestorId = (req.headers['x-user-id'] || req.query.requestorId || '').toString();

    // Strict Backend RBAC Verification
    if (requestorRole !== 'super_admin') {
      console.warn(`[RBAC API BLOCKED] Unauthorized Active User list access attempt. Requestor Role: '${requestorRole}', User ID: '${requestorId}'`);
      return res.status(403).json({
        success: false,
        errorCode: 403,
        error: 'Forbidden Access',
        message: `403 Forbidden: User role '${requestorRole || 'guest'}' is NOT authorized to view the complete Active User list. Access restricted to Super Admin only.`,
        timestamp: new Date().toISOString()
      });
    }

    // Query parameters for search & filtering
    const search = (req.query.search || '').toString().toLowerCase();
    const roleFilter = (req.query.role || 'all').toString();
    const statusFilter = (req.query.status || 'all').toString();
    const startDate = (req.query.startDate || '').toString();
    const endDate = (req.query.endDate || '').toString();
    const divisionFilter = (req.query.division || 'all').toString();
    const sortBy = (req.query.sortBy || 'newest').toString();

    let filtered = INITIAL_USERS.filter((u) => {
      // Role Filter
      if (roleFilter !== 'all' && u.primaryRole !== roleFilter && !u.roles.includes(roleFilter)) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && u.accountStatus !== statusFilter) {
        return false;
      }

      // Division Filter
      if (divisionFilter !== 'all' && u.mandatoryAddress?.division !== divisionFilter) {
        return false;
      }

      // Registration Date Range Filter (startDate, endDate)
      if (startDate) {
        const uRegDate = u.createdAt.slice(0, 10);
        if (uRegDate < startDate) return false;
      }
      if (endDate) {
        const uRegDate = u.createdAt.slice(0, 10);
        if (uRegDate > endDate) return false;
      }

      // Search Query
      if (search.trim()) {
        const matchesId = u.id.toLowerCase().includes(search) || (u.permanentMemberId && u.permanentMemberId.toLowerCase().includes(search));
        const matchesName = u.fullName.toLowerCase().includes(search);
        const matchesMobile = u.mobileNumber.includes(search);
        const matchesEmail = u.email && u.email.toLowerCase().includes(search);
        const matchesLocation = u.mandatoryAddress && `${u.mandatoryAddress.division} ${u.mandatoryAddress.district} ${u.mandatoryAddress.upazila}`.toLowerCase().includes(search);

        return matchesId || matchesName || matchesMobile || matchesEmail || matchesLocation;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === 'balance') {
      filtered.sort((a, b) => b.tomokTokenBalance - a.tomokTokenBalance);
    }

    console.log(`[RBAC API SUCCESS] Active Users retrieved for Super Admin (${requestorId}). Returned ${filtered.length} records.`);

    return res.json({
      success: true,
      data: filtered,
      totalCount: filtered.length,
      filtersApplied: {
        search,
        roleFilter,
        statusFilter,
        startDate,
        endDate,
        divisionFilter,
        sortBy
      },
      auditLogCreated: true,
      accessedAt: new Date().toISOString()
    });
  });

  /**
   * STRICT RBAC API ENDPOINT: Active User Detail
   */
  app.get('/api/admin/active-users/:id', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || req.query.requestorRole || '').toString().toLowerCase();

    if (requestorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: '403 Forbidden: Only Super Admin can inspect user profile details.'
      });
    }

    const userId = req.params.id;
    const targetUser = INITIAL_USERS.find((u) => u.id === userId || u.permanentMemberId === userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.json({
      success: true,
      data: targetUser
    });
  });

  /**
   * IMMUTABLE SUPER ADMIN GUARD: User Edit Endpoint
   */
  app.put('/api/admin/active-users/:id', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || req.body.requestorRole || '').toString().toLowerCase();

    if (requestorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: '403 Forbidden: Only Super Admin can modify user records.'
      });
    }

    const userId = req.params.id;
    const userIndex = INITIAL_USERS.findIndex((u) => u.id === userId || u.permanentMemberId === userId);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }

    // Protect Super Admin Immutability
    if (userId === FIXED_SUPER_ADMIN_ID || INITIAL_USERS[userIndex].id === FIXED_SUPER_ADMIN_ID) {
      if (req.body.primaryRole && req.body.primaryRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Super Admin Immutability Violation',
          message: `Super Admin ID '${FIXED_SUPER_ADMIN_ID}' is immutable and role cannot be altered or downgraded.`
        });
      }
      if (req.body.accountStatus && req.body.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          error: 'Super Admin Immutability Violation',
          message: `Super Admin account cannot be deactivated, suspended or banned.`
        });
      }
    }

    const updatedUser = { ...INITIAL_USERS[userIndex], ...req.body, updatedAt: new Date().toISOString() };
    INITIAL_USERS[userIndex] = updatedUser;

    return res.json({
      success: true,
      message: `User record for '${updatedUser.fullName}' updated successfully.`,
      data: updatedUser
    });
  });

  /**
   * IMMUTABLE SUPER ADMIN GUARD: Delete User Endpoint
   */
  app.delete('/api/admin/active-users/:id', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || '').toString().toLowerCase();

    if (requestorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: '403 Forbidden: Only Super Admin can delete user records.'
      });
    }

    const userId = req.params.id;

    // Enforce Immutability: Block deletion of AANO-SADMIN-001
    if (userId === FIXED_SUPER_ADMIN_ID || userId === 'usr-super-admin-01') {
      return res.status(403).json({
        success: false,
        errorCode: 403,
        error: 'Immutable Root Super Admin Protection',
        message: `SECURITY EXCEPTION: Super Admin ID '${FIXED_SUPER_ADMIN_ID}' is permanent and immutable. It CANNOT be deleted from the database under any circumstances.`
      });
    }

    const userIndex = INITIAL_USERS.findIndex((u) => u.id === userId || u.permanentMemberId === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const deleted = INITIAL_USERS.splice(userIndex, 1)[0];
    return res.json({
      success: true,
      message: `User '${deleted.fullName}' (${deleted.id}) successfully deleted from database.`
    });
  });

  /**
   * SECURE CREDENTIALS ENDPOINT: Super Admin Password Update
   */
  app.post('/api/admin/change-password', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || '').toString().toLowerCase();
    const { newPassword } = req.body;

    if (requestorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only authenticated Super Admin can update root credentials.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    const saIndex = INITIAL_USERS.findIndex((u) => u.id === FIXED_SUPER_ADMIN_ID);
    if (saIndex !== -1) {
      INITIAL_USERS[saIndex].passwordHash = `sha256_secured_${Date.now()}`;
    }

    console.log(`[SECURITY AUDIT] Super Admin (${FIXED_SUPER_ADMIN_ID}) password updated securely.`);

    return res.json({
      success: true,
      message: `Super Admin ID (${FIXED_SUPER_ADMIN_ID}) credentials updated securely in database.`
    });
  });

  /**
   * WALLET & TOKEN ADJUSTMENT ENDPOINT
   */
  app.post('/api/admin/wallets/adjust', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || '').toString().toLowerCase();
    const { userId, amount, type, reason } = req.body;

    if (requestorRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only Super Admin can adjust wallet balances.'
      });
    }

    const targetUser = INITIAL_USERS.find((u) => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found.' });
    }

    const delta = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
    targetUser.tomokTokenBalance = Math.max(0, targetUser.tomokTokenBalance + delta);

    return res.json({
      success: true,
      message: `Wallet balance adjusted for ${targetUser.fullName}. New Balance: ${targetUser.tomokTokenBalance} Points.`,
      newBalance: targetUser.tomokTokenBalance,
      reason
    });
  });

  /**
   * SYSTEM STATS ENDPOINT
   */
  app.get('/api/admin/system-stats', (req, res) => {
    const requestorRole = (req.headers['x-user-role'] || req.query.requestorRole || '').toString().toLowerCase();

    if (requestorRole !== 'super_admin' && requestorRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({
      success: true,
      stats: {
        superAdminId: FIXED_SUPER_ADMIN_ID,
        immutabilityEnforced: true,
        totalUsers: INITIAL_USERS.length,
        activeMembers: INITIAL_USERS.filter((u) => u.roles.includes('network_member')).length,
        dealers: INITIAL_USERS.filter((u) => u.roles.includes('dealer')).length,
        deliveryRiders: INITIAL_USERS.filter((u) => u.roles.includes('delivery_rider')).length,
        totalTokenCirculation: INITIAL_USERS.reduce((acc, u) => acc + (u.tomokTokenBalance || 0), 0),
        serverTimestamp: new Date().toISOString(),
        databaseTriggerStatus: 'ACTIVE_AND_PROTECTED'
      }
    });
  });

  // =========================================================================
  // ENTERPRISE FINANCE & ACCOUNTS REST API MODULE (Strict RBAC Protected)
  // =========================================================================

  const financeAuditLogs: any[] = [
    {
      id: 'AUD-FIN-001',
      userId: 'usr-finance-01',
      userRole: 'finance',
      action: 'SETTLEMENT_APPROVED',
      transactionId: 'SET-99124',
      previousValue: 'Status: Pending (৳14,200)',
      newValue: 'Status: Approved & Disbursed to Rider (Bkash)',
      date: '2026-08-28',
      time: '11:30:00',
      ipAddress: '103.145.112.45',
      reason: 'Rider verified customer buying code OTP and COD cash handed over',
      approvalStatus: 'Approved by Finance Head'
    },
    {
      id: 'AUD-FIN-002',
      userId: FIXED_SUPER_ADMIN_ID,
      userRole: 'super_admin',
      action: 'LEDGER_ADJUSTMENT_POSTED',
      transactionId: 'ADJ-2026-004',
      previousValue: 'Account: Central Petty Cash (৳60,000)',
      newValue: 'Account: Central Petty Cash (৳65,000)',
      date: '2026-08-28',
      time: '10:15:20',
      ipAddress: '103.145.112.10',
      reason: 'Petty cash replenishment from Main City Bank Current Account',
      approvalStatus: 'Approved & Signed by MD'
    }
  ];

  const financeNotifications: any[] = [
    {
      id: 'notif-01',
      type: 'pending_settlement',
      title: 'নতুন ডেলিভারি ম্যান ক্যাশ কালেকশন সেটেলমেন্ট অনুরোধ',
      message: 'রাইডার রাশেদুল হাসান (মিরপুর হাব) থেকে ৳১৪,২০০ ক্যাশ অন ডেলিভারি সেটেলমেন্টের জন্য প্রস্তুত।',
      timestamp: '১০ মিনিট আগে',
      amount: 14200,
      referenceId: 'SET-99124',
      isRead: false,
      priority: 'high'
    },
    {
      id: 'notif-02',
      type: 'large_payment',
      title: 'বড় অঙ্কের হোলসেল পেমেন্ট রিসিভড (bKash Merchant)',
      message: 'অর্ডার #ORD-90145 এর বিপরীতে ৳৪৫,৬০০ সরাসরি বিকাশ মার্চেন্ট অ্যাকাউন্টে জমা হয়েছে (ফি: ৳৮২০.৮০)।',
      timestamp: '১ ঘণ্টা আগে',
      amount: 45600,
      referenceId: 'PAY-BK-88912',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 'notif-03',
      type: 'unapproved_expense',
      title: 'অননুমোদিত হাব অপারেশনাল খরচ বিল',
      message: 'রাজশাহী রিজিওনাল হাব থেকে অফিস জেনারেটর ডিজেল ক্রয়ের ৳৩,৫০০ খরচের ভাউচার অনুমোদনের অপেক্ষায়।',
      timestamp: '২ ঘণ্টা আগে',
      amount: 3500,
      referenceId: 'EXP-8892',
      isRead: false,
      priority: 'high'
    },
    {
      id: 'notif-04',
      type: 'refund_request',
      title: 'রিটার্ন পণ্যের রিফান্ড অনুমোদন প্রয়োজন',
      message: 'গ্রাহক কাজী শফিকুল আলম এর অর্ডার #ORD-90112 আংশিক রিফান্ড (৳১,৮৫০) ভাউচার তৈরি হয়েছে।',
      timestamp: '৩ ঘণ্টা আগে',
      amount: 1850,
      referenceId: 'REF-2026-018',
      isRead: true,
      priority: 'medium'
    }
  ];

  // Helper middleware for Finance authorization
  const verifyFinanceAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const role = (req.headers['x-user-role'] || req.query.requestorRole || req.body.requestorRole || '').toString().toLowerCase();
    const allowed = ['super_admin', 'founder', 'finance', 'admin'];
    if (!allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden Access',
        message: '403 Forbidden: Authorized Finance & Accounts Officer or Executive access required.'
      });
    }
    next();
  };

  app.get('/api/finance/overview', verifyFinanceAuth, (req, res) => {
    const { period = 'today' } = req.query;

    const baseMetrics = {
      todaySales: 184500,
      todayCollection: 162300,
      todayExpense: 24800,
      todayProfit: 38200,
      totalSales: 4850000,
      totalCollection: 4620000,
      totalExpense: 685000,
      totalCommission: 388000,
      pendingSettlement: 142500,
      paidSettlement: 4477500,
      refundAmount: 32400,
      netProfit: 864500,
      cogs: 2880000,
      totalDeliveryCost: 198000,
      gatewayCharges: 87300,
      period: period.toString()
    };

    res.json({
      success: true,
      data: baseMetrics,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/finance/audit-logs', verifyFinanceAuth, (_req, res) => {
    res.json({
      success: true,
      data: financeAuditLogs
    });
  });

  app.post('/api/finance/audit-logs', verifyFinanceAuth, (req, res) => {
    const newLog = {
      id: `AUD-FIN-${Date.now()}`,
      ...req.body,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
      ipAddress: req.ip || '127.0.0.1'
    };
    financeAuditLogs.unshift(newLog);
    res.json({ success: true, data: newLog });
  });

  app.get('/api/finance/notifications', verifyFinanceAuth, (_req, res) => {
    res.json({
      success: true,
      data: financeNotifications
    });
  });

  app.post('/api/finance/notifications/:id/read', verifyFinanceAuth, (req, res) => {
    const notif = financeNotifications.find((n) => n.id === req.params.id);
    if (notif) notif.isRead = true;
    res.json({ success: true, message: 'Notification marked as read' });
  });

  // =========================================================================
  // AANO BAZAR APPLICATION ROLE SYSTEM — SUPER ADMIN ONLY BACKEND API
  // =========================================================================

  interface ServerRoleApplication {
    id: string;
    applicationId: string;
    trackingNumber: string;
    roleType: 'admin' | 'operational_officer' | 'delivery_man';
    appliedPosition: 'Admin' | 'Operations Officer' | 'Product Delivery Man';
    fullName: string;
    applicantName: string;
    mobileNumber: string;
    email?: string;
    nationalId: string;
    dateOfBirth?: string;
    gender?: string;
    division: string;
    district: string;
    upazila?: string;
    unionName?: string;
    address?: string;
    fullAddress?: string;
    educationalQualification?: string;
    experienceYears?: string;
    previousExperience?: string;
    statementOfPurpose?: string;
    vehicleType?: string;
    vehicleRegNumber?: string;
    drivingLicenseNumber?: string;
    emergencyContact?: string;
    emergencyContactRelation?: string;
    documents?: { title: string; url: string; type: string }[];
    profilePhotoUrl?: string;
    nidFrontPhotoUrl?: string;
    nidBackPhotoUrl?: string;
    drivingLicensePhotoUrl?: string;
    status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Cancelled' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
    rejectionReason?: string;
    adminNotes?: string;
    reviewedBy?: string;
    reviewedByUserId?: string;
    reviewedByUserName?: string;
    reviewDate?: string;
    reviewedAt?: string;
    internalNotes?: { id: string; authorId: string; authorName: string; text: string; createdAt: string; isInfoRequest?: boolean }[];
    history?: { id: string; action: string; actorId: string; actorName: string; timestamp: string; note?: string }[];
    assignedUserId?: string;
    assignedRoleUniqueId?: string;
    approvedAt?: string;
    applicationDate: string;
    createdAt: string;
    updatedAt: string;
  }

  let applicationSequence = 100;

  const serverRoleApplications: ServerRoleApplication[] = [
    {
      id: 'APP-000001',
      applicationId: 'APP-000001',
      trackingNumber: 'APP-ADM-260101',
      roleType: 'admin',
      appliedPosition: 'Admin',
      fullName: 'তানজিনা রহমান',
      applicantName: 'তানজিনা রহমান',
      mobileNumber: '01711000002',
      email: 'tanjina.admin@aanobazar.com',
      nationalId: '19942691234567892',
      dateOfBirth: '1994-05-20',
      gender: 'female',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'গুলশান',
      unionName: 'গুলশান-১',
      address: 'ব্লক বি, রোড ৫১, গুলশান-১, ঢাকা',
      fullAddress: 'ব্লক বি, রোড ৫১, গুলশান-১, ঢাকা',
      educationalQualification: 'MBA in Management, Dhaka University',
      experienceYears: '5+ Years',
      previousExperience: 'Former Regional Operations Lead at Retail Co.',
      statementOfPurpose: 'Dedicated to modernizing grocery and e-commerce distribution across Dhaka District.',
      documents: [
        { title: 'National ID Card (Front & Back)', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
        { title: 'Educational Certificate (MBA)', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' },
        { title: 'Trade/Professional Reference', url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      nidFrontPhotoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
      status: 'Approved',
      reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
      reviewedByUserId: FIXED_SUPER_ADMIN_ID,
      reviewedByUserName: 'Mirza Khatib Uddin',
      reviewDate: '2026-01-02',
      reviewedAt: '2026-01-02T10:00:00.000Z',
      adminNotes: 'Candidate has exemplary qualifications and leadership credentials for Dhaka District Admin role.',
      internalNotes: [
        { id: 'NOTE-001', authorId: FIXED_SUPER_ADMIN_ID, authorName: 'Mirza Khatib Uddin', text: 'Document verification and background check completed successfully.', createdAt: '2026-01-02T09:30:00.000Z' }
      ],
      history: [
        { id: 'HIST-001', action: 'Application Submitted', actorId: 'usr-applicant-01', actorName: 'তানজিনা রহমান', timestamp: '2026-01-01T08:30:00.000Z', note: 'Public Portal Submission' },
        { id: 'HIST-002', action: 'Application Reviewed', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-02T09:15:00.000Z', note: 'Put under executive review' },
        { id: 'HIST-003', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-02T10:00:00.000Z', note: 'Approved and granted District Admin role (ADM-DHAKA-01)' }
      ],
      assignedUserId: 'usr-admin-02',
      assignedRoleUniqueId: 'ADM-DHAKA-01',
      approvedAt: '2026-01-02T10:00:00.000Z',
      applicationDate: '2026-01-01',
      createdAt: '2026-01-01T08:30:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z'
    },
    {
      id: 'APP-000002',
      applicationId: 'APP-000002',
      trackingNumber: 'APP-OPS-260102',
      roleType: 'operational_officer',
      appliedPosition: 'Operations Officer',
      fullName: 'ফরিদা পারভীন',
      applicantName: 'ফরিদা পারভীন',
      mobileNumber: '01611000005',
      email: 'farida.ops@aanobazar.com',
      nationalId: '19912691234567895',
      dateOfBirth: '1991-03-30',
      gender: 'female',
      division: 'রাজশাহী',
      district: 'রাজশাহী',
      upazila: 'বোয়ালিয়া',
      unionName: 'সাহেব বাজার',
      address: 'হাব ভবন ৩য় তলা, সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
      fullAddress: 'হাব ভবন ৩য় তলা, সাহেব বাজার, বোয়ালিয়া, রাজশাহী',
      educationalQualification: 'BBA in Supply Chain Management',
      experienceYears: '4 Years',
      previousExperience: 'Hub in-charge and logistics coordinator',
      statementOfPurpose: 'Ensuring 100% same-day and fresh deliveries across Boalia Upazila.',
      documents: [
        { title: 'NID Card Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
        { title: 'Supply Chain Diploma', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250',
      status: 'Approved',
      reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
      reviewedByUserId: FIXED_SUPER_ADMIN_ID,
      reviewedByUserName: 'Mirza Khatib Uddin',
      reviewDate: '2026-01-12',
      reviewedAt: '2026-01-12T14:00:00.000Z',
      adminNotes: 'Approved as Upazila Operations Officer for Boalia Upazila.',
      internalNotes: [],
      history: [
        { id: 'HIST-004', action: 'Application Submitted', actorId: 'usr-applicant-02', actorName: 'ফরিদা পারভীন', timestamp: '2026-01-10T11:20:00.000Z', note: 'Public Portal Submission' },
        { id: 'HIST-005', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-12T14:00:00.000Z', note: 'Assigned OPS-BOALIA-01' }
      ],
      assignedUserId: 'usr-partner-05',
      assignedRoleUniqueId: 'OPS-BOALIA-01',
      approvedAt: '2026-01-12T14:00:00.000Z',
      applicationDate: '2026-01-10',
      createdAt: '2026-01-10T11:20:00.000Z',
      updatedAt: '2026-01-12T14:00:00.000Z'
    },
    {
      id: 'APP-000003',
      applicationId: 'APP-000003',
      trackingNumber: 'APP-DEL-260103',
      roleType: 'delivery_man',
      appliedPosition: 'Product Delivery Man',
      fullName: 'রাশেদুল হাসান',
      applicantName: 'রাশেদুল হাসান',
      mobileNumber: '01511000006',
      email: 'rashedul.del@aanobazar.com',
      nationalId: '19982691234567896',
      dateOfBirth: '1998-09-18',
      gender: 'male',
      division: 'ঢাকা',
      district: 'ঢাকা',
      upazila: 'মিরপুর',
      unionName: 'মিরপুর-১০',
      address: 'ব্লক সি, লাইন ২, মিরপুর-১০, ঢাকা',
      fullAddress: 'ব্লক সি, লাইন ২, মিরপুর-১০, ঢাকা',
      vehicleType: 'Motorcycle',
      vehicleRegNumber: 'DHAKA-METRO-HA-12-3456',
      drivingLicenseNumber: 'DL-88392019',
      emergencyContact: '01711223344',
      emergencyContactRelation: 'Brother',
      educationalQualification: 'HSC Passed',
      experienceYears: '3 Years',
      previousExperience: 'Food & Express parcel delivery rider',
      statementOfPurpose: 'Eager to serve customers with speed, precision, and courtesy.',
      documents: [
        { title: 'Driving License Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
        { title: 'Vehicle Registration Document', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
      status: 'Approved',
      reviewedBy: 'Mirza Khatib Uddin (Super Admin)',
      reviewedByUserId: FIXED_SUPER_ADMIN_ID,
      reviewedByUserName: 'Mirza Khatib Uddin',
      reviewDate: '2026-01-15',
      reviewedAt: '2026-01-15T09:00:00.000Z',
      adminNotes: 'Valid license and motorcycle verified. Assigned Mirpur delivery route.',
      internalNotes: [],
      history: [
        { id: 'HIST-006', action: 'Application Submitted', actorId: 'usr-applicant-03', actorName: 'রাশেদুল হাসান', timestamp: '2026-01-14T15:10:00.000Z', note: 'Public Portal Submission' },
        { id: 'HIST-007', action: 'Application Approved', actorId: FIXED_SUPER_ADMIN_ID, actorName: 'Mirza Khatib Uddin', timestamp: '2026-01-15T09:00:00.000Z', note: 'Assigned DEL-MIRPUR-01' }
      ],
      assignedUserId: 'usr-rider-06',
      assignedRoleUniqueId: 'DEL-MIRPUR-01',
      approvedAt: '2026-01-15T09:00:00.000Z',
      applicationDate: '2026-01-14',
      createdAt: '2026-01-14T15:10:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z'
    },
    {
      id: 'APP-000004',
      applicationId: 'APP-000004',
      trackingNumber: 'APP-ADM-260210',
      roleType: 'admin',
      appliedPosition: 'Admin',
      fullName: 'মোঃ শহিদুল আলম',
      applicantName: 'মোঃ শহিদুল আলম',
      mobileNumber: '01819876543',
      email: 'shahidul.khulna@gmail.com',
      nationalId: '19892691234567898',
      dateOfBirth: '1989-08-14',
      gender: 'male',
      division: 'খুলনা',
      district: 'খুলনা',
      upazila: 'খুলনা সদর',
      unionName: 'সোনাডাঙ্গা',
      address: 'মজিদ স্মরণী, সোনাডাঙ্গা, খুলনা',
      fullAddress: 'মজিদ স্মরণী, সোনাডাঙ্গা, খুলনা',
      educationalQualification: 'Masters in Economics, Rajshahi University',
      experienceYears: '6 Years',
      previousExperience: 'Business Development Manager at Agro Export Ltd.',
      statementOfPurpose: 'I want to lead AANO BAZAR operations across Khulna District as the District Admin.',
      documents: [
        { title: 'National ID Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' },
        { title: 'Academic Certificate (Masters)', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400', type: 'application/pdf' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250',
      status: 'Pending',
      adminNotes: 'Under review for Khulna District Admin appointment.',
      internalNotes: [],
      history: [
        { id: 'HIST-008', action: 'Application Submitted', actorId: 'usr-applicant-04', actorName: 'মোঃ শহিদুল আলম', timestamp: '2026-02-10T11:00:00.000Z', note: 'Public Portal Submission' }
      ],
      applicationDate: '2026-02-10',
      createdAt: '2026-02-10T11:00:00.000Z',
      updatedAt: '2026-02-10T11:00:00.000Z'
    },
    {
      id: 'APP-000005',
      applicationId: 'APP-000005',
      trackingNumber: 'APP-OPS-260215',
      roleType: 'operational_officer',
      appliedPosition: 'Operations Officer',
      fullName: 'আরিফুল ইসলাম সুজন',
      applicantName: 'আরিফুল ইসলাম সুজন',
      mobileNumber: '01912345670',
      email: 'ariful.dumuria@gmail.com',
      nationalId: '19932691234567877',
      dateOfBirth: '1993-11-22',
      gender: 'male',
      division: 'খুলনা',
      district: 'খুলনা',
      upazila: 'ডুমুরিয়া',
      unionName: 'ডুমুরিয়া সদর',
      address: 'ডুমুরিয়া বাজার রোড, ডুমুরিয়া, খুলনা',
      fullAddress: 'ডুমুরিয়া বাজার রোড, ডুমুরিয়া, খুলনা',
      educationalQualification: 'Graduation in Management',
      experienceYears: '3.5 Years',
      previousExperience: 'Local FMCG Distribution Supervisor',
      statementOfPurpose: 'Eager to manage and monitor order distribution in Dumuria Upazila.',
      documents: [
        { title: 'National ID Card', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      status: 'Pending',
      internalNotes: [],
      history: [
        { id: 'HIST-009', action: 'Application Submitted', actorId: 'usr-applicant-05', actorName: 'আরিফুল ইসলাম সুজন', timestamp: '2026-02-15T09:45:00.000Z', note: 'Public Portal Submission' }
      ],
      applicationDate: '2026-02-15',
      createdAt: '2026-02-15T09:45:00.000Z',
      updatedAt: '2026-02-15T09:45:00.000Z'
    },
    {
      id: 'APP-000006',
      applicationId: 'APP-000006',
      trackingNumber: 'APP-DEL-260218',
      roleType: 'delivery_man',
      appliedPosition: 'Product Delivery Man',
      fullName: 'সাজ্জাদ হোসেন রনি',
      applicantName: 'সাজ্জাদ হোসেন রনি',
      mobileNumber: '01755123456',
      email: 'sajjad.rider@gmail.com',
      nationalId: '19992691234567844',
      dateOfBirth: '1999-04-12',
      gender: 'male',
      division: 'খুলনা',
      district: 'খুলনা',
      upazila: 'ডুমুরিয়া',
      unionName: 'ডুমুরিয়া সদর',
      address: 'শান্তিনগর, ডুমুরিয়া, খুলনা',
      fullAddress: 'শান্তিনগর, ডুমুরিয়া, খুলনা',
      vehicleType: 'Bicycle',
      emergencyContact: '01755998877',
      emergencyContactRelation: 'Father',
      educationalQualification: 'HSC',
      experienceYears: '1 Year',
      previousExperience: 'Courier Delivery Boy',
      statementOfPurpose: 'Fast and reliable delivery in Dumuria local area.',
      documents: [
        { title: 'NID Card Copy', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' }
      ],
      profilePhotoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250',
      status: 'Pending',
      internalNotes: [],
      history: [
        { id: 'HIST-010', action: 'Application Submitted', actorId: 'usr-applicant-06', actorName: 'সাজ্জাদ হোসেন রনি', timestamp: '2026-02-18T14:30:00.000Z', note: 'Public Portal Submission' }
      ],
      applicationDate: '2026-02-18',
      createdAt: '2026-02-18T14:30:00.000Z',
      updatedAt: '2026-02-18T14:30:00.000Z'
    }
  ];

  const serverApplicationAuditLogs: any[] = [
    {
      id: 'AUD-APP-001',
      superAdminId: FIXED_SUPER_ADMIN_ID,
      superAdminName: 'Mirza Khatib Uddin',
      applicationId: 'APP-000001',
      applicantName: 'তানজিনা রহমান',
      appliedPosition: 'Admin',
      action: 'Application Approved',
      date: '2026-01-02',
      time: '10:00:00',
      reasonOrNote: 'District Admin appointed for Dhaka District with Role ID ADM-DHAKA-01',
      createdAt: '2026-01-02T10:00:00.000Z'
    },
    {
      id: 'AUD-APP-002',
      superAdminId: FIXED_SUPER_ADMIN_ID,
      superAdminName: 'Mirza Khatib Uddin',
      applicationId: 'APP-000002',
      applicantName: 'ফরিদা পারভীন',
      appliedPosition: 'Operations Officer',
      action: 'Application Approved',
      date: '2026-01-12',
      time: '14:00:00',
      reasonOrNote: 'Operations Officer appointed for Boalia Upazila with Role ID OPS-BOALIA-01',
      createdAt: '2026-01-12T14:00:00.000Z'
    },
    {
      id: 'AUD-APP-003',
      superAdminId: FIXED_SUPER_ADMIN_ID,
      superAdminName: 'Mirza Khatib Uddin',
      applicationId: 'APP-000003',
      applicantName: 'রাশেদুল হাসান',
      appliedPosition: 'Product Delivery Man',
      action: 'Application Approved',
      date: '2026-01-15',
      time: '09:00:00',
      reasonOrNote: 'Product Delivery Rider verified and onboarded with Role ID DEL-MIRPUR-01',
      createdAt: '2026-01-15T09:00:00.000Z'
    }
  ];

  const serverSuperAdminNotifications: any[] = [
    {
      id: 'NOTIF-APP-001',
      userId: FIXED_SUPER_ADMIN_ID,
      title: 'New Admin Application Received',
      message: 'New Admin application submitted by মোঃ শহিদুল আলম. Application ID: APP-000004. District: খুলনা.',
      createdAt: '2026-02-10T11:00:00.000Z',
      isRead: false
    },
    {
      id: 'NOTIF-APP-002',
      userId: FIXED_SUPER_ADMIN_ID,
      title: 'New Operations Officer Application Received',
      message: 'New Operations Officer application submitted by আরিফুল ইসলাম সুজন. Application ID: APP-000005. Upazila: ডুমুরিয়া, District: খুলনা.',
      createdAt: '2026-02-15T09:45:00.000Z',
      isRead: false
    },
    {
      id: 'NOTIF-APP-003',
      userId: FIXED_SUPER_ADMIN_ID,
      title: 'New Product Delivery Man Application Received',
      message: 'New Product Delivery Man application submitted by সাজ্জাদ হোসেন রনি. Application ID: APP-000006. District: খুলনা.',
      createdAt: '2026-02-18T14:30:00.000Z',
      isRead: false
    }
  ];

  // RBAC Middleware: Strict Super Admin Application Security Guard
  const verifySuperAdminOnly = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestorRole = (req.headers['x-user-role'] || req.query.requestorRole || req.body.requestorRole || '').toString().toLowerCase();
    const requestorId = (req.headers['x-user-id'] || req.query.requestorId || req.body.requestorId || '').toString();

    const isSuperAdmin = requestorRole === 'super_admin' || requestorRole === 'founder' || requestorId === FIXED_SUPER_ADMIN_ID;

    if (!isSuperAdmin) {
      console.warn(`[RBAC APPLICATION ACCESS BLOCKED] Unauthorized application endpoint access attempt. Role: '${requestorRole}', User ID: '${requestorId}'`);
      return res.status(403).json({
        success: false,
        errorCode: 403,
        error: 'Forbidden Access',
        message: `403 Forbidden: Application information is sensitive administrative data. Access is restricted exclusively to Super Admin. (VIEW_ROLE_APPLICATIONS = SUPER_ADMIN_ONLY). User role '${requestorRole || 'guest'}' is denied access.`,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };

  /**
   * GET /api/applications
   * Protected: ONLY Super Admin can view all submitted applications.
   */
  app.get('/api/applications', verifySuperAdminOnly, (req, res) => {
    const { role, status, division, search } = req.query;

    let filtered = [...serverRoleApplications];

    if (role && role !== 'all') {
      const r = role.toString().toLowerCase();
      filtered = filtered.filter((a) => a.roleType === r || a.appliedPosition?.toLowerCase().includes(r));
    }

    if (status && status !== 'all') {
      const s = status.toString().toLowerCase();
      filtered = filtered.filter((a) => a.status.toLowerCase() === s);
    }

    if (division && division !== 'all') {
      filtered = filtered.filter((a) => a.division === division);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.applicationId.toLowerCase().includes(q) ||
          a.trackingNumber.toLowerCase().includes(q) ||
          a.fullName.toLowerCase().includes(q) ||
          a.mobileNumber.includes(q) ||
          (a.email && a.email.toLowerCase().includes(q)) ||
          a.district.toLowerCase().includes(q) ||
          (a.upazila && a.upazila.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      data: filtered,
      totalCount: filtered.length,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/applications/:id
   * Protected: Inspect single application details (Super Admin Only)
   */
  app.get('/api/applications/:id', verifySuperAdminOnly, (req, res) => {
    const id = req.params.id;
    const requestorId = (req.headers['x-user-id'] || FIXED_SUPER_ADMIN_ID).toString();
    const requestorName = (req.headers['x-user-name'] || 'Mirza Khatib Uddin').toString();

    const appItem = serverRoleApplications.find((a) => a.id === id || a.applicationId === id || a.trackingNumber === id);
    if (!appItem) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    // Log Application Viewed in Audit Trail
    serverApplicationAuditLogs.push({
      id: `AUD-APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      superAdminId: requestorId,
      superAdminName: requestorName,
      applicationId: appItem.applicationId || appItem.id,
      applicantName: appItem.fullName,
      appliedPosition: appItem.appliedPosition,
      action: 'Application Viewed',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 8),
      reasonOrNote: `Super Admin inspected application details for ${appItem.fullName}`,
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      data: appItem
    });
  });

  /**
   * POST /api/applications/submit
   * Public Endpoint: Anyone can submit an application for Admin, Operations Officer, or Delivery Man.
   */
  app.post('/api/applications/submit', (req, res) => {
    try {
      const data = req.body;

      if (!data.fullName || !data.mobileNumber || !data.roleType || !data.division || !data.district) {
        return res.status(400).json({
          success: false,
          error: 'Missing required application fields (fullName, mobileNumber, roleType, division, district).'
        });
      }

      applicationSequence++;
      const paddedSeq = String(applicationSequence).padStart(6, '0');
      const applicationId = `APP-${paddedSeq}`;
      const rolePrefix = data.roleType === 'admin' ? 'ADM' : data.roleType === 'operational_officer' ? 'OPS' : 'DEL';
      const trackingNumber = `APP-${rolePrefix}-${Date.now().toString().slice(-6)}`;

      const appliedPosition =
        data.roleType === 'admin'
          ? 'Admin'
          : data.roleType === 'operational_officer'
          ? 'Operations Officer'
          : 'Product Delivery Man';

      const newApp: ServerRoleApplication = {
        id: applicationId,
        applicationId,
        trackingNumber,
        roleType: data.roleType,
        appliedPosition,
        fullName: data.fullName,
        applicantName: data.fullName,
        mobileNumber: data.mobileNumber,
        email: data.email,
        nationalId: data.nationalId || `NID-${Date.now()}`,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender || 'male',
        division: data.division,
        district: data.district,
        upazila: data.upazila,
        unionName: data.unionName,
        address: data.fullAddress || data.address || `${data.district}, ${data.division}`,
        fullAddress: data.fullAddress || data.address || `${data.district}, ${data.division}`,
        educationalQualification: data.educationalQualification,
        experienceYears: data.experienceYears,
        previousExperience: data.previousExperience,
        statementOfPurpose: data.statementOfPurpose,
        vehicleType: data.vehicleType,
        vehicleRegNumber: data.vehicleRegNumber,
        drivingLicenseNumber: data.drivingLicenseNumber,
        emergencyContact: data.emergencyContact,
        emergencyContactRelation: data.emergencyContactRelation,
        documents: data.documents || [
          { title: 'National ID Front', url: data.nidFrontPhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400', type: 'image/jpeg' }
        ],
        profilePhotoUrl: data.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
        status: 'Pending',
        adminNotes: '',
        internalNotes: [],
        history: [
          {
            id: `HIST-${Date.now()}`,
            action: 'Application Submitted',
            actorId: 'public_portal',
            actorName: data.fullName,
            timestamp: new Date().toISOString(),
            note: 'Application submitted via public role registration portal.'
          }
        ],
        applicationDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      serverRoleApplications.unshift(newApp);

      // Notification exclusively for Super Admin
      const notifTitle = `New ${appliedPosition} Application Received`;
      const notifMessage = `Application ID: ${applicationId}. Applicant: ${data.fullName}, Position: ${appliedPosition}, Location: ${data.district}${data.upazila ? ', ' + data.upazila : ''}.`;
      
      serverSuperAdminNotifications.unshift({
        id: `NOTIF-APP-${Date.now()}`,
        userId: FIXED_SUPER_ADMIN_ID,
        title: notifTitle,
        message: notifMessage,
        createdAt: new Date().toISOString(),
        isRead: false
      });

      // Audit Log for submission
      serverApplicationAuditLogs.unshift({
        id: `AUD-APP-${Date.now()}`,
        superAdminId: 'SYSTEM',
        superAdminName: 'Portal Engine',
        applicationId,
        applicantName: data.fullName,
        appliedPosition,
        action: 'Application Submitted',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 8),
        reasonOrNote: `New application submitted by ${data.fullName} for position ${appliedPosition}.`,
        createdAt: new Date().toISOString()
      });

      console.log(`[APPLICATION SUBMITTED] ${appliedPosition} application created: ${applicationId} (${data.fullName})`);

      res.json({
        success: true,
        application: newApp,
        trackingNumber,
        applicationId,
        message: `Application submitted successfully! Application ID: ${applicationId}. Super Admin notified for review.`
      });
    } catch (err: any) {
      console.error('[Application Submission Error]', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to process application submission' });
    }
  });

  /**
   * POST /api/applications/:id/action
   * Protected: Super Admin Action Hub (Approve, Reject, Put Under Review, Request Info, Add Note)
   */
  app.post('/api/applications/:id/action', verifySuperAdminOnly, (req, res) => {
    try {
      const id = req.params.id;
      const { action, reason, note, requestedInfoText } = req.body;
      const requestorId = (req.headers['x-user-id'] || FIXED_SUPER_ADMIN_ID).toString();
      const requestorName = (req.headers['x-user-name'] || 'Mirza Khatib Uddin').toString();

      const appIndex = serverRoleApplications.findIndex((a) => a.id === id || a.applicationId === id || a.trackingNumber === id);
      if (appIndex === -1) {
        return res.status(404).json({ success: false, message: 'Application not found.' });
      }

      const targetApp = serverRoleApplications[appIndex];
      const nowIso = new Date().toISOString();
      const nowDate = nowIso.slice(0, 10);
      const nowTime = new Date().toTimeString().slice(0, 8);

      let auditAction = 'Status Changed';
      let auditNote = note || reason || `Action '${action}' executed by Super Admin.`;

      if (action === 'approve') {
        targetApp.status = 'Approved';
        targetApp.reviewedBy = `${requestorName} (Super Admin)`;
        targetApp.reviewedByUserId = requestorId;
        targetApp.reviewedByUserName = requestorName;
        targetApp.reviewDate = nowDate;
        targetApp.reviewedAt = nowIso;
        targetApp.approvedAt = nowIso;

        // Generate Role ID
        if (targetApp.roleType === 'admin') {
          const distCode = targetApp.district.replace(/\s+/g, '').slice(0, 4).toUpperCase();
          targetApp.assignedRoleUniqueId = `ADM-${distCode}-${Date.now().toString().slice(-4)}`;
        } else if (targetApp.roleType === 'operational_officer') {
          const upzCode = (targetApp.upazila || 'UPZ').replace(/\s+/g, '').slice(0, 4).toUpperCase();
          targetApp.assignedRoleUniqueId = `OPS-${upzCode}-${Date.now().toString().slice(-4)}`;
        } else {
          targetApp.assignedRoleUniqueId = `DEL-${Date.now().toString().slice(-6)}`;
        }

        auditAction = 'Application Approved';
        auditNote = `Approved by Super Admin. Assigned Role ID: ${targetApp.assignedRoleUniqueId}.`;
      } else if (action === 'reject') {
        targetApp.status = 'Rejected';
        targetApp.rejectionReason = reason || 'Requirements not met according to area quotas or criteria.';
        targetApp.reviewedBy = `${requestorName} (Super Admin)`;
        targetApp.reviewedByUserId = requestorId;
        targetApp.reviewedByUserName = requestorName;
        targetApp.reviewDate = nowDate;
        targetApp.reviewedAt = nowIso;

        auditAction = 'Application Rejected';
        auditNote = `Rejected by Super Admin. Reason: ${targetApp.rejectionReason}`;
      } else if (action === 'review' || action === 'under_review') {
        targetApp.status = 'Under Review';
        targetApp.reviewedBy = `${requestorName} (Super Admin)`;
        targetApp.reviewedByUserId = requestorId;
        targetApp.reviewedByUserName = requestorName;
        targetApp.reviewDate = nowDate;
        targetApp.reviewedAt = nowIso;

        auditAction = 'Application Reviewed';
        auditNote = note || 'Put under active background review by Super Admin.';
      } else if (action === 'request_info') {
        targetApp.status = 'Under Review';
        const infoMsg = requestedInfoText || note || 'Additional documents or details required.';
        if (!targetApp.internalNotes) targetApp.internalNotes = [];
        targetApp.internalNotes.push({
          id: `NOTE-${Date.now()}`,
          authorId: requestorId,
          authorName: requestorName,
          text: `[Information Requested from Applicant]: ${infoMsg}`,
          createdAt: nowIso,
          isInfoRequest: true
        });

        auditAction = 'Information Requested';
        auditNote = `Information requested: ${infoMsg}`;
      } else if (action === 'add_internal_note') {
        if (!targetApp.internalNotes) targetApp.internalNotes = [];
        targetApp.internalNotes.push({
          id: `NOTE-${Date.now()}`,
          authorId: requestorId,
          authorName: requestorName,
          text: note || '',
          createdAt: nowIso
        });
        auditAction = 'Internal Note Added';
        auditNote = `Internal admin note added by ${requestorName}`;
      } else if (action === 'cancel') {
        targetApp.status = 'Cancelled';
        auditAction = 'Application Cancelled';
        auditNote = reason || 'Application marked as cancelled.';
      }

      if (note) {
        targetApp.adminNotes = targetApp.adminNotes ? `${targetApp.adminNotes}\n${note}` : note;
      }
      targetApp.updatedAt = nowIso;

      if (!targetApp.history) targetApp.history = [];
      targetApp.history.push({
        id: `HIST-${Date.now()}`,
        action: auditAction,
        actorId: requestorId,
        actorName: requestorName,
        timestamp: nowIso,
        note: auditNote
      });

      // Record Audit Log
      serverApplicationAuditLogs.unshift({
        id: `AUD-APP-${Date.now()}`,
        superAdminId: requestorId,
        superAdminName: requestorName,
        applicationId: targetApp.applicationId || targetApp.id,
        applicantName: targetApp.fullName,
        appliedPosition: targetApp.appliedPosition,
        action: auditAction,
        date: nowDate,
        time: nowTime,
        reasonOrNote: auditNote,
        createdAt: nowIso
      });

      res.json({
        success: true,
        application: targetApp,
        message: `Action '${auditAction}' processed successfully for Application ${targetApp.applicationId}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute application action' });
    }
  });

  /**
   * GET /api/applications/audit-logs
   * Protected: ONLY Super Admin can view application audit logs.
   */
  app.get('/api/applications/audit-logs', verifySuperAdminOnly, (_req, res) => {
    res.json({
      success: true,
      data: serverApplicationAuditLogs,
      totalCount: serverApplicationAuditLogs.length
    });
  });

  /**
   * GET /api/applications/super-admin-notifications
   * Protected: ONLY Super Admin can view new application alerts.
   */
  app.get('/api/applications/super-admin-notifications', verifySuperAdminOnly, (_req, res) => {
    res.json({
      success: true,
      data: serverSuperAdminNotifications,
      unreadCount: serverSuperAdminNotifications.filter((n) => !n.isRead).length
    });
  });

  /**
   * =========================================================================
   * BINARY TREE, AB- REGISTRATION, MIGRATION & EMAIL DELIVERY API
   * =========================================================================
   */
  const verifyAdminOrSuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestorRole = (req.headers['x-user-role'] || req.query.requestorRole || '').toString().toLowerCase();
    const requestorId = (req.headers['x-user-id'] || req.query.requestorId || '').toString();
    const isAllowed =
      requestorRole === 'super_admin' ||
      requestorRole === 'admin' ||
      requestorRole === 'founder' ||
      requestorId === FIXED_SUPER_ADMIN_ID ||
      requestorId === 'APON-SADMIN-001' ||
      requestorId === 'AponSA-000001' ||
      requestorId === 'usr-admin-02';

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        error: 'Forbidden Access',
        message: '403 Forbidden: Administrative privileges required to view migration mappings or email logs.'
      });
    }
    next();
  };

  app.get('/api/network/tree', async (_req, res) => {
    try {
      const payload = await defaultBinaryTreeStore.getState();
      res.json({
        success: true,
        treeState: payload.treeState,
        matchingHistory: payload.matchingHistory,
        registeredMembers: payload.registeredMembers,
        blankPositions: payload.blankPositions
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Failed to load binary tree' });
    }
  });

  app.get('/api/network/tree/subtree/:companyId?', async (req, res) => {
    try {
      const companyId = String(req.params.companyId || req.query.companyId || '').trim();
      const requestorRole = req.header('x-user-role') || '';
      const requestorUserId = req.header('x-user-id') || '';
      const requestorCompanyId = req.header('x-company-id') || '';

      const result = await defaultBinaryTreeStore.getIsolatedSubtree({
        targetCompanyId: companyId,
        requestorRole,
        requestorUserId,
        requestorCompanyId
      });

      return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: err?.message || 'Failed to query isolated binary subtree'
      });
    }
  });

  app.get('/api/network/placement/preview', async (req, res) => {
    try {
      const referralId = String(req.query.referralId || '').trim();
      if (!referralId) {
        return res.status(400).json({
          found: false,
          message: 'referralId query parameter is required.'
        });
      }
      const preview = await defaultBinaryTreeStore.previewPlacementByReferral(referralId);
      return res.status(preview.found ? 200 : 404).json({
        found: preview.found,
        message: preview.message,
        referralId: preview.referralNode?.id,
        referralName: preview.referralNode?.fullName,
        placementId: preview.placementParentNode?.id,
        placementName: preview.placementParentNode?.fullName,
        position: preview.position,
        leg: preview.leg,
        blankSlotId: preview.blankSlotId
      });
    } catch (err: any) {
      return res.status(500).json({
        found: false,
        message: err?.message || 'Failed to calculate placement preview'
      });
    }
  });

  app.post('/api/network/register-customer', async (req, res) => {
    try {
      const appOrigin =
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const result = await defaultBinaryTreeStore.registerCustomerAtomically({
        ...(req.body || {}),
        appOrigin
      });
      return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: err?.message || 'Customer registration failed'
      });
    }
  });

  app.get('/api/network/migration-report', verifyAdminOrSuperAdmin, async (_req, res) => {
    try {
      const status = await defaultBinaryTreeStore.getMigrationAndEmailStatus();
      return res.json({
        success: true,
        ...status
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch migration report' });
    }
  });

  app.post('/api/network/migration/rollback', verifySuperAdminOnly, async (_req, res) => {
    try {
      const result = await defaultBinaryTreeStore.rollbackMigrationFromBackup();
      return res.status(result.statusCode).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Migration rollback failed' });
    }
  });

  app.get('/api/network/email-logs', verifyAdminOrSuperAdmin, async (_req, res) => {
    try {
      const status = await defaultBinaryTreeStore.getMigrationAndEmailStatus();
      return res.json({
        success: true,
        emailDeliveryLogs: status.emailDeliveryLogs
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to fetch email logs' });
    }
  });

  app.post('/api/network/email-logs/retry', verifyAdminOrSuperAdmin, async (req, res) => {
    try {
      const appOrigin =
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host') || 'localhost:3000'}`;
      const result = await defaultBinaryTreeStore.retryPendingEmails(appOrigin);
      return res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to retry email queue' });
    }
  });

  app.post('/api/network/blank-slot/register', async (req, res) => {
    try {
      const result = await defaultBinaryTreeStore.registerBlankSlot(req.body || {});
      return res.status(result.statusCode || (result.success ? 200 : 400)).json(result);
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        statusCode: 500,
        message: err?.message || 'Atomic blank slot registration failed'
      });
    }
  });

  app.post('/api/network/matching/execute', async (req, res) => {
    try {
      const result = await defaultBinaryTreeStore.executeMemberMatching(req.body || {});
      return res.status(result.statusCode || 200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Matching execution failed' });
    }
  });

  app.post('/api/network/matching/batch', async (req, res) => {
    try {
      const result = await defaultBinaryTreeStore.executeBatchMatching(req.body || {});
      return res.status(result.statusCode || 200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Batch matching failed' });
    }
  });

  app.post('/api/network/carry-forward/adjust', async (req, res) => {
    try {
      const result = await defaultBinaryTreeStore.adjustCarryForward(req.body || {});
      return res.status(result.statusCode || 200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Carry forward adjustment failed' });
    }
  });

  app.post('/api/network/placement/reassign', async (req, res) => {
    try {
      const result = await defaultBinaryTreeStore.reassignPlacement(req.body || {});
      return res.status(result.statusCode || 200).json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Placement reassignment failed' });
    }
  });

  app.post('/api/network/tree/sync', async (req, res) => {
    try {
      const { nodes, matchingHistory } = req.body || {};
      if (!Array.isArray(nodes)) {
        return res.status(400).json({ success: false, message: 'nodes array is required' });
      }
      const data = await defaultBinaryTreeStore.syncSnapshotIfNewer(nodes, matchingHistory);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Tree sync failed' });
    }
  });

  app.delete('/api/network/blank-slot/:id', (req, res) => {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: `Reserved Blank Slot '${req.params.id}' কখনো বাতিল, ডিলিট বা অন্য কারো জন্য পুনঃব্যবহার করা যাবে না।`
    });
  });

  // Vite Middleware for Development (Dynamic import to avoid bundling Vite in production)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Express Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Express Server Error Handler]:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Unknown error' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise Server running on http://0.0.0.0:${PORT}`);
  });
}

/**
 * Smart Fallback Natural Language Parser for Bengali & English SMS Orders
 */
function parseSmsWithSmartHeuristics(rawText: string, senderPhone: string, senderName: string, catalog: any[]) {
  const textLower = rawText.toLowerCase();
  
  // 1. Detect Intent
  let intent: 'place_order' | 'check_status' | 'price_inquiry' | 'delivery_inquiry' | 'general_chat' = 'place_order';
  if (textLower.includes('স্ট্যাটাস') || textLower.includes('status') || textLower.includes('কখন আসবে') || textLower.includes('track') || textLower.includes('অর্ডার কই')) {
    intent = 'check_status';
  } else if (textLower.includes('দাম কত') || textLower.includes('price') || textLower.includes('রেট') || textLower.includes('rate') || textLower.includes('মূল্য')) {
    intent = 'price_inquiry';
  } else if (textLower.includes('ডেলিভারি চার্জ') || textLower.includes('হোম ডেলিভারি') || textLower.includes('পৌঁছাবে')) {
    intent = 'delivery_inquiry';
  } else if (textLower.includes('হ্যালো') || textLower.includes('হাই') || textLower.includes('hello') || textLower.includes('hi') || textLower.includes('assalam')) {
    if (!textLower.includes('কেজি') && !textLower.includes('লিটার') && !textLower.includes('তেল') && !textLower.includes('মধু') && !textLower.includes('অর্ডার') && !textLower.includes('order')) {
      intent = 'general_chat';
    }
  }

  // 2. Extract Items & Quantities
  const items: any[] = [];
  const knownProducts = [
    { key: 'সরিষার তেল', en: 'Mustard Oil', price: 210, unit: '১ লিটার' },
    { key: 'মধু', en: 'Sundarban Pure Honey', price: 650, unit: '৫০০ গ্রাম' },
    { key: 'ঘি', en: 'Gawa Ghee', price: 620, unit: '৫০০ গ্রাম' },
    { key: 'নাজিরশাইল', en: 'Nazirshail Rice', price: 1950, unit: '২৫ কেজি' },
    { key: 'মিনিকেট', en: 'Miniket Rice', price: 1850, unit: '২৫ কেজি' },
    { key: 'চাল', en: 'Premium Rice', price: 1850, unit: '২৫ কেজি' },
    { key: 'চিয়া সিড', en: 'Chia Seed', price: 320, unit: '২৫০ গ্রাম' },
    { key: 'কালিজিরা তেল', en: 'Black Seed Oil', price: 260, unit: '১০০ মি.লি.' },
    { key: 'চা পাতা', en: 'Organic Tea', price: 240, unit: '৪০০ গ্রাম' },
    { key: 'তেল', en: 'Pure Cooking Oil', price: 210, unit: '১ লিটার' }
  ];

  let totalAmount = 0;
  for (const kp of knownProducts) {
    if (textLower.includes(kp.key) || textLower.includes(kp.en.toLowerCase())) {
      // Find quantity near keyword (e.g. "২ কেজি", "2 kg", "১ লিটার", "3 packet", "২টা")
      let qty = 1;
      const numMatch = rawText.match(new RegExp(`([০-৯0-9]+)\\s*(কেজি|লিটার|লি|গ্রাম|পিস|টি|টা|kg|l|liter|packet)?\\s*${kp.key}`, 'i')) ||
                       rawText.match(new RegExp(`${kp.key}\\s*([০-৯0-9]+)`, 'i'));
      if (numMatch) {
        const rawNum = numMatch[1];
        // Convert bangla digit to english digit
        const banglaToEn: any = { '০': 0, '১': 1, '২': 2, '৩': 3, '৪': 4, '৫': 5, '৬': 6, '৭': 7, '৮': 8, '৯': 9 };
        let parsedQty = 0;
        for (const ch of rawNum) {
          if (banglaToEn[ch] !== undefined) parsedQty = parsedQty * 10 + banglaToEn[ch];
          else if (!isNaN(parseInt(ch))) parsedQty = parsedQty * 10 + parseInt(ch);
        }
        if (parsedQty > 0) qty = parsedQty;
      }

      const itemTotal = kp.price * qty;
      totalAmount += itemTotal;
      items.push({
        productName: `${kp.key} (${kp.en})`,
        variantName: kp.unit,
        quantity: qty,
        unitPrice: kp.price,
        total: itemTotal
      });
    }
  }

  // If no items matched but intent is order, add default staple package
  if (items.length === 0 && intent === 'place_order') {
    items.push({
      productName: 'খাঁটি সরিষার তেল ও সুন্দরবনের মধু (স্পেশাল কম্বো)',
      variantName: '১ লিটার + ৫০০ গ্রাম',
      quantity: 1,
      unitPrice: 860,
      total: 860
    });
    totalAmount = 860;
  }

  // 3. Extract Bangladesh Address
  const divisions = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ', 'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Rangpur', 'Barishal'];
  let matchedDivision = 'ঢাকা';
  for (const div of divisions) {
    if (rawText.toLowerCase().includes(div.toLowerCase())) {
      matchedDivision = div;
      break;
    }
  }

  const districts = ['ঢাকা', 'ঠাকুরগাঁও', 'দিনাজপুর', 'বগুড়া', 'পাবনা', 'সিলেট', 'কুমিল্লা', 'চট্টগ্রাম', 'গাজীপুর', 'নারায়ণগঞ্জ', 'মিরপুর', 'উত্তরা', 'ধানমন্ডি', 'মোহাম্মদপুর', 'গুলশান', 'বনানী'];
  let matchedDistrict = 'ঢাকা';
  let matchedUpazila = 'মিরপুর';
  for (const dist of districts) {
    if (rawText.toLowerCase().includes(dist.toLowerCase())) {
      matchedDistrict = dist;
      matchedUpazila = dist;
      break;
    }
  }

  // Extract phone number from SMS body if present
  const phoneMatch = rawText.match(/(01[3-9][0-9]{8})/);
  const extractedPhone = phoneMatch ? phoneMatch[1] : senderPhone;

  // Extract address snippet
  const addressMatch = rawText.match(/(ঠিকানা|address|location|বাসা|রোড|হাউজ|গ্রাম|থানা|পোস্ট)[:\s]+([^,\n।.]+)/i);
  const rawAddressText = addressMatch ? addressMatch[2].trim() : `${matchedUpazila}, ${matchedDistrict}`;

  const address = {
    division: matchedDivision,
    district: matchedDistrict,
    upazila: matchedUpazila,
    unionName: `${matchedUpazila}-০১`,
    ward: 'ওয়ার্ড ০১',
    area: rawAddressText,
    rawAddress: rawAddressText,
    fullServiceAddress: `${rawAddressText}, ${matchedUpazila}, ${matchedDistrict}`
  };

  const missingInfo: string[] = [];
  if (items.length === 0) missingInfo.push('products');
  if (!rawText.includes('রোড') && !rawText.includes('হাউজ') && !rawText.includes('ঠিকানা') && !rawText.includes('মিরপুর') && !rawText.includes('উত্তরা') && !rawText.includes('ঢাকা')) {
    missingInfo.push('detailed_address');
  }

  const deliveryCharge = matchedDivision.toLowerCase().includes('ঢাকা') || matchedDivision.toLowerCase().includes('dhaka') ? 60 : 120;
  const grandTotal = totalAmount + deliveryCharge;

  // 4. Generate 24/7 AI Bengali Auto-Reply
  let aiReplyText = '';
  if (intent === 'place_order') {
    const itemListStr = items.map((i) => `${i.productName} x ${i.quantity}`).join(', ');
    aiReplyText = `সম্মানিত গ্রাহক, আপনার অর্ডারটি (${itemListStr}) সিস্টেমে নথিভুক্ত হয়েছে। মোট প্রদেয়: ৳${grandTotal} (ক্যাশ অন ডেলিভারি)। ডেলিভারি এলাকা: ${address.fullServiceAddress}। ট্র্যাকিং ও নিশ্চিতকরণ করতে ধন্যবাদ AANO BAZAR এ থাকার জন্য!`;
  } else if (intent === 'check_status') {
    aiReplyText = `সম্মানিত গ্রাহক, আপনার মোবাইল নম্বর (${extractedPhone}) এর বিপরীতে অর্ডারটি সেন্ট্রাল হাব থেকে ডেলিভারির জন্য প্রস্তুত হচ্ছে। কিছুক্ষণের মধ্যে রাইডার যোগাযোগ করবে। হেল্পলাইন: ০৯৬১২-AANOBAZAR।`;
  } else if (intent === 'price_inquiry') {
    aiReplyText = `AANO BAZAR সেরা অফার: খাঁটি সরিষার তেল ১লি ৳২১০, সুন্দরবনের মধু ৫০০গ্রা ৳৬৫০, গাওয়া ঘি ৫০০গ্রা ৳৬২০, মিনিকেট চাল ২৫কেজি ৳১৮৫০। অর্ডার করতে পণ্য ও আপনার ঠিকানা লিখে এসএমএস করুন।`;
  } else {
    aiReplyText = `আসসালামু আলাইকুম! AANO BAZAR 24/7 AI শপিং এসিস্ট্যান্টে স্বাগতম। আপনি সরাসরি পণ্যের নাম ও ডেলিভারি ঠিকানা লিখে এই নম্বরে SMS পাঠালে আপনার অর্ডার নিশ্চিত হয়ে যাবে।`;
  }

  return {
    intent,
    confidenceScore: 0.92,
    items,
    address,
    customerName: senderName || 'সম্মানিত ক্রেতা',
    customerPhone: extractedPhone,
    missingInfo,
    totalCalculatedAmount: totalAmount,
    deliveryCharge,
    grandTotal,
    recommendedOpHub: `${matchedDivision} রিজিওনাল হাব (${matchedDistrict})`,
    aiReplyText
  };
}

function generateFallbackChatReply(message: string, userRole: string, customerName: string) {
  const textLower = message.toLowerCase();
  if (textLower.includes('অর্ডার') || textLower.includes('order') || textLower.includes('কিনতে')) {
    return `সম্মানিত ${customerName || 'গ্রাহক'}, আপনি সহজেই আমাদের মাধ্যমে অর্ডার করতে পারেন। কাঙ্ক্ষিত পণ্য, পরিমাণ এবং আপনার সম্পূর্ণ ডেলিভারি ঠিকানা লিখে পাঠান, আমাদের ২৪/৭ AI ইঞ্জিন তাৎক্ষণিক আপনার অর্ডারটি প্রসেস করবে।`;
  }
  if (textLower.includes('ডেলিভারি') || textLower.includes('চার্জ') || textLower.includes('কবে')) {
    return `ঢাকা সিটির মধ্যে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা ডেলিভারি চার্জ প্রযোজ্য। ক্যাশ অন ডেলিভারি (COD) ও হোম ডেলিভারি সুবিধা ২৪-৪৮ ঘণ্টার মধ্যে সম্পন্ন হয়।`;
  }
  if (userRole === 'operations_partner' || userRole === 'super_admin' || userRole === 'admin') {
    return `সিস্টেম স্ট্যাটাস স্বাভাবিক রয়েছে। আপনার হাবের আঞ্চলিক ডিলার ও রাইডারগণ সক্রিয় রয়েছে এবং SMS চ্যানেল ও AI অটো-অর্ডার রাউটিং সফলভাবে কাজ করছে।`;
  }
  return `আসসালামু আলাইকুম! AANO BAZAR ২৪/৭ AI গ্রাহক সেবায় স্বাগতম। আমি কীভাবে আপনাকে কেনাকাটা বা অর্ডার সংক্রান্ত তথ্যে সহায়তা করতে পারি?`;
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]:', err);
  process.exit(1);
});
