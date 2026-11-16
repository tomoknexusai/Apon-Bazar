/**
 * Server-Side Authoritative Company & Branding Settings Store
 * Persists cleanly to `.data/company-settings.json` with atomic write & mutex lock.
 *
 * Honesty & Branding Rules:
 * - Only APON BAZAR / আপন বাজার brand identity.
 * - Never invents fake legal registration names, email addresses, or phone numbers.
 * - Optional contact fields remain empty ('') until explicitly configured by Super Admin.
 * - Accurately reports server email provider availability from getEmailProviderConfig().
 */

import fs from 'fs';
import path from 'path';
import type { EmailProviderStatus, SystemSettings } from '../types';
import { getEmailProviderConfig } from './emailService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmailAddress(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidHttpUrlOrPath(url: string): boolean {
  const clean = url.trim();
  if (!clean) return true;
  if (clean.startsWith('/') || clean.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildDefaultCompanySettings(): SystemSettings {
  return {
    siteName: 'APON BAZAR',
    companyName: 'APON BAZAR',
    companyNameBn: 'আপন বাজার',
    tokenName: 'APON_POINTS',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    defaultLanguage: 'bn',
    timezone: 'Asia/Dhaka',
    enableEmailNotifications: true,
    enableSmsNotifications: true,
    enablePushNotifications: true,
    maintenanceMode: false,
    supportEmail: '',
    customerServiceEmail: '',
    sellerContactEmail: '',
    dealerContactEmail: '',
    officialPhone: '',
    companyAddress: '',
    websiteUrl: '',
    companyLogoUrl: '/apon-bazar-logo.png',
    invoiceDisplayInfo: '',
    emailSenderName: 'APON BAZAR',
    emailSenderEmail: '',
    companyMasterId: 'AB-1000000001',
    updatedAt: '2026-01-01T00:00:00.000Z'
  };
}

function buildEmailProviderStatus(settings: SystemSettings): EmailProviderStatus {
  const cfg = getEmailProviderConfig({
    name: settings.emailSenderName,
    email: settings.emailSenderEmail
  });
  const senderConfigured = Boolean(
    (settings.emailSenderEmail || '').trim() && isValidEmailAddress(settings.emailSenderEmail || '')
  );

  return {
    configured: cfg.configured,
    provider: cfg.provider,
    senderConfigured,
    message: cfg.configured
      ? senderConfigured
        ? `${cfg.message} Sender address configured: ${settings.emailSenderEmail}.`
        : `${cfg.message} Set Email Notification Sender Email in Company Settings if overriding default.`
      : 'Email provider is not configured on the server (SMTP credentials or API key missing). Emails will not be sent until a provider is configured.'
  };
}

export function createCompanySettingsStore(customStorePath?: string) {
  const storePath =
    customStorePath || path.join(process.cwd(), '.data', 'company-settings.json');

  let mutexTail: Promise<unknown> = Promise.resolve();
  let cached: SystemSettings | null = null;

  function runWithLock<T>(task: () => Promise<T> | T): Promise<T> {
    const run = mutexTail.then(() => task());
    mutexTail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  function writeAtomicSync(payload: SystemSettings): void {
    const dir = path.dirname(storePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${storePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
    fs.renameSync(tmpPath, storePath);
  }

  function loadSettings(): SystemSettings {
    if (cached) return cached;

    const defaults = buildDefaultCompanySettings();
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<SystemSettings>;
        if (parsed && typeof parsed === 'object') {
          cached = {
            ...defaults,
            ...parsed,
            companyName: (parsed.companyName || defaults.companyName).trim(),
            companyNameBn: (parsed.companyNameBn || defaults.companyNameBn || 'আপন বাজার').trim()
          };
          return cached;
        }
      } catch (err) {
        console.error('[CompanySettingsStore] Failed reading settings store, using defaults:', err);
      }
    }

    writeAtomicSync(defaults);
    cached = defaults;
    return defaults;
  }

  return {
    getStorePath: () => storePath,

    getSettings: async (): Promise<SystemSettings> => {
      return runWithLock(() => {
        const settings = loadSettings();
        return {
          ...settings,
          emailProviderStatus: buildEmailProviderStatus(settings)
        };
      });
    },

    updateSettings: async (params: {
      updates: Partial<SystemSettings>;
      actorId: string;
      actorName?: string;
    }): Promise<{
      success: boolean;
      statusCode: number;
      message: string;
      settings?: SystemSettings;
      changedFields?: string[];
    }> => {
      return runWithLock(() => {
        const current = loadSettings();
        const input = params.updates || {};

        const nextCompanyName =
          input.companyName !== undefined ? String(input.companyName).trim() : current.companyName;
        const nextCompanyNameBn =
          input.companyNameBn !== undefined
            ? String(input.companyNameBn).trim()
            : current.companyNameBn || 'আপন বাজার';

        if (!nextCompanyName) {
          return {
            success: false,
            statusCode: 400,
            message: 'কোম্পানির ইংরেজি নাম (Company Display Name) অবশ্যই প্রদান করতে হবে।'
          };
        }
        if (!nextCompanyNameBn) {
          return {
            success: false,
            statusCode: 400,
            message: 'কোম্পানির বাংলা নাম (Bengali Display Name) অবশ্যই প্রদান করতে হবে।'
          };
        }

        const emailFields: Array<{ key: keyof SystemSettings; label: string }> = [
          { key: 'supportEmail', label: 'Official Support Email' },
          { key: 'customerServiceEmail', label: 'Customer Service Email' },
          { key: 'sellerContactEmail', label: 'Seller/Dealer Contact Email' },
          { key: 'dealerContactEmail', label: 'Dealer Contact Email' },
          { key: 'emailSenderEmail', label: 'Email Notification Sender Email' }
        ];

        for (const field of emailFields) {
          if (input[field.key] !== undefined) {
            const rawVal = String(input[field.key] || '').trim();
            if (rawVal && !isValidEmailAddress(rawVal)) {
              return {
                success: false,
                statusCode: 400,
                message: `অবৈধ ইমেইল ফরম্যাট (${field.label}): '${rawVal}'`
              };
            }
          }
        }

        const nextWebsiteUrl =
          input.websiteUrl !== undefined ? String(input.websiteUrl || '').trim() : current.websiteUrl || '';
        if (nextWebsiteUrl && !isValidHttpUrlOrPath(nextWebsiteUrl)) {
          return {
            success: false,
            statusCode: 400,
            message: 'ওয়েবসাইট URL সঠিক ফরম্যাটে হতে হবে (যেমন: https://example.com)।'
          };
        }
        if (nextWebsiteUrl && (nextWebsiteUrl.startsWith('/') || nextWebsiteUrl.startsWith('data:'))) {
          return {
            success: false,
            statusCode: 400,
            message: 'ওয়েবসাইট URL অবশ্যই http:// অথবা https:// দিয়ে শুরু হতে হবে।'
          };
        }

        const nextLogoUrl =
          input.companyLogoUrl !== undefined
            ? String(input.companyLogoUrl || '').trim()
            : current.companyLogoUrl || '/apon-bazar-logo.png';
        if (nextLogoUrl && !isValidHttpUrlOrPath(nextLogoUrl)) {
          return {
            success: false,
            statusCode: 400,
            message: 'কোম্পানি লোগো URL বা পাথ সঠিক নয়।'
          };
        }

        const cleanSellerEmail =
          input.sellerContactEmail !== undefined
            ? String(input.sellerContactEmail || '').trim().toLowerCase()
            : input.dealerContactEmail !== undefined
            ? String(input.dealerContactEmail || '').trim().toLowerCase()
            : current.sellerContactEmail || current.dealerContactEmail || '';

        const updated: SystemSettings = {
          ...current,
          siteName: nextCompanyName,
          companyName: nextCompanyName,
          companyNameBn: nextCompanyNameBn,
          tokenName:
            input.tokenName !== undefined && String(input.tokenName).trim()
              ? String(input.tokenName).trim()
              : current.tokenName,
          currencyCode:
            input.currencyCode !== undefined && String(input.currencyCode).trim()
              ? String(input.currencyCode).trim()
              : current.currencyCode,
          currencySymbol:
            input.currencySymbol !== undefined && String(input.currencySymbol).trim()
              ? String(input.currencySymbol).trim()
              : current.currencySymbol,
          timezone:
            input.timezone !== undefined && String(input.timezone).trim()
              ? String(input.timezone).trim()
              : current.timezone,
          companyMasterId:
            input.companyMasterId !== undefined && String(input.companyMasterId).trim()
              ? String(input.companyMasterId).trim().toUpperCase()
              : current.companyMasterId,
          supportEmail:
            input.supportEmail !== undefined
              ? String(input.supportEmail || '').trim().toLowerCase()
              : current.supportEmail || '',
          customerServiceEmail:
            input.customerServiceEmail !== undefined
              ? String(input.customerServiceEmail || '').trim().toLowerCase()
              : current.customerServiceEmail || '',
          sellerContactEmail: cleanSellerEmail,
          dealerContactEmail: cleanSellerEmail,
          officialPhone:
            input.officialPhone !== undefined
              ? String(input.officialPhone || '').trim()
              : current.officialPhone || '',
          companyAddress:
            input.companyAddress !== undefined
              ? String(input.companyAddress || '').trim()
              : current.companyAddress || '',
          websiteUrl: nextWebsiteUrl,
          companyLogoUrl: nextLogoUrl || '/apon-bazar-logo.png',
          invoiceDisplayInfo:
            input.invoiceDisplayInfo !== undefined
              ? String(input.invoiceDisplayInfo || '').trim()
              : current.invoiceDisplayInfo || '',
          emailSenderName:
            input.emailSenderName !== undefined
              ? String(input.emailSenderName || '').trim() || nextCompanyName
              : current.emailSenderName || nextCompanyName,
          emailSenderEmail:
            input.emailSenderEmail !== undefined
              ? String(input.emailSenderEmail || '').trim().toLowerCase()
              : current.emailSenderEmail || '',
          enableEmailNotifications:
            input.enableEmailNotifications !== undefined
              ? Boolean(input.enableEmailNotifications)
              : current.enableEmailNotifications,
          enableSmsNotifications:
            input.enableSmsNotifications !== undefined
              ? Boolean(input.enableSmsNotifications)
              : current.enableSmsNotifications,
          enablePushNotifications:
            input.enablePushNotifications !== undefined
              ? Boolean(input.enablePushNotifications)
              : current.enablePushNotifications,
          updatedBy: params.actorName || params.actorId,
          updatedAt: new Date().toISOString()
        };

        const trackedKeys: Array<keyof SystemSettings> = [
          'companyName',
          'companyNameBn',
          'supportEmail',
          'customerServiceEmail',
          'sellerContactEmail',
          'officialPhone',
          'companyAddress',
          'websiteUrl',
          'companyLogoUrl',
          'invoiceDisplayInfo',
          'emailSenderName',
          'emailSenderEmail',
          'tokenName',
          'currencyCode',
          'timezone',
          'companyMasterId'
        ];
        const changedFields = trackedKeys.filter((k) => current[k] !== updated[k]).map(String);

        writeAtomicSync(updated);
        cached = updated;

        return {
          success: true,
          statusCode: 200,
          message: 'কোম্পানি ও ব্র্যান্ডিং সেটিংস সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে!',
          settings: {
            ...updated,
            emailProviderStatus: buildEmailProviderStatus(updated)
          },
          changedFields
        };
      });
    }
  };
}

export const defaultCompanySettingsStore = createCompanySettingsStore();
