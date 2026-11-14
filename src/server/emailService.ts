/**
 * Server-Side Registration Confirmation Email Service
 *
 * Security & Honesty Rules:
 * - Reads SMTP credentials solely from environment variables (never hardcoded secrets).
 * - Subject: "APON BAZAR — Registration Successful"
 * - NEVER includes the user's password in any email body or log payload.
 * - Enforces strict idempotency per (customerId, templateType) so duplicates never fire.
 * - If SMTP / email provider credentials are missing or unconfigured, honestly records
 *   status='pending' ("Email Service Pending — SMTP provider not configured") and queues
 *   for retry rather than faking "sent".
 * - Email errors NEVER roll back or fail customer registration.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { EmailDeliveryRecord, EmailDeliveryStatus } from '../types/networkMarketing';

export interface RegistrationEmailInput {
  customerName: string;
  customerId: string;
  recipientEmail: string;
  referralId: string;
  placementId: string;
  placementPosition: 'LEFT' | 'RIGHT' | 'ROOT';
  registrationDate: string;
  appOrigin?: string;
}

export interface EmailSendResult {
  record: EmailDeliveryRecord;
  alreadySent: boolean;
}

export interface SmtpConfigSummary {
  configured: boolean;
  provider: 'smtp' | 'unconfigured';
  fromAddress: string;
  host?: string;
  port?: number;
}

export function getEmailProviderConfig(): SmtpConfigSummary {
  const host = (process.env.SMTP_HOST || '').trim();
  const portRaw = (process.env.SMTP_PORT || '').trim();
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const fromAddress =
    (process.env.SMTP_FROM || '').trim() ||
    (user ? `Apon Bazar <${user}>` : 'Apon Bazar <no-reply@aponbazar.com>');

  if (!host || !user || !pass) {
    return {
      configured: false,
      provider: 'unconfigured',
      fromAddress
    };
  }

  return {
    configured: true,
    provider: 'smtp',
    fromAddress,
    host,
    port: portRaw ? parseInt(portRaw, 10) || 587 : 587
  };
}

function resolveLoginUrl(appOrigin?: string): string {
  const base = (process.env.APP_URL || appOrigin || 'http://localhost:3000').trim().replace(/\/+$/, '');
  return `${base}/?login=1`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildRegistrationEmailContent(
  input: RegistrationEmailInput
): { subject: string; text: string; html: string; loginUrl: string } {
  const subject = 'APON BAZAR — Registration Successful';
  const loginUrl = resolveLoginUrl(input.appOrigin);
  const formattedDate = input.registrationDate.slice(0, 19).replace('T', ' ');

  const text = [
    `Dear ${input.customerName},`,
    '',
    'Welcome to APON BAZAR! Your customer and binary network registration has been completed successfully.',
    '',
    '--- Registration Summary ---',
    `Customer Name: ${input.customerName}`,
    `Customer ID: ${input.customerId}`,
    `Referral ID: ${input.referralId}`,
    `Placement ID: ${input.placementId}`,
    `Placement Position: ${input.placementPosition}`,
    `Registration Date: ${formattedDate}`,
    '',
    `Sign in to your account: ${loginUrl}`,
    '',
    'For your security, your password is never sent via email.',
    '',
    'Regards,',
    'APON BAZAR Team'
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #065f46; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">APON BAZAR — Registration Successful</h2>
        <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Welcome to the Apon Bazar Binary Network &amp; Marketplace</p>
      </div>
      <div style="padding: 24px; color: #111827; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${escapeHtml(input.customerName)}</strong>,</p>
        <p>Your registration is complete. Please save your permanent Customer ID below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f9fafb; border-radius: 8px;">
          <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer Name</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(input.customerName)}</td></tr>
          <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer ID</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; color: #059669;">${escapeHtml(input.customerId)}</td></tr>
          <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Referral ID</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${escapeHtml(input.referralId)}</td></tr>
          <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Placement ID</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${escapeHtml(input.placementId)}</td></tr>
          <tr><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Placement Position</td><td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(input.placementPosition)}</td></tr>
          <tr><td style="padding: 8px 12px; color: #6b7280;">Registration Date</td><td style="padding: 8px 12px;">${escapeHtml(formattedDate)}</td></tr>
        </table>
        <p style="margin: 20px 0;">
          <a href="${escapeHtml(loginUrl)}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold;">Login to Apon Bazar</a>
        </p>
        <p style="font-size: 12px; color: #6b7280;">Security notice: For your protection, your password is never included in emails.</p>
      </div>
    </div>
  `;

  return { subject, text, html, loginUrl };
}

export async function dispatchRegistrationConfirmationEmail(
  input: RegistrationEmailInput,
  existingLogs: EmailDeliveryRecord[],
  customTransport?: Transporter
): Promise<EmailSendResult> {
  const idempotencyKey = `registration_confirmation:${input.customerId}`;
  const alreadySentRecord = existingLogs.find(
    (l) => l.idempotencyKey === idempotencyKey && l.status === 'sent'
  );
  if (alreadySentRecord) {
    return { record: alreadySentRecord, alreadySent: true };
  }

  const nowIso = new Date().toISOString();
  const { subject, text, html, loginUrl } = buildRegistrationEmailContent(input);
  const existingRecord = existingLogs.find((l) => l.idempotencyKey === idempotencyKey);
  const attempts = (existingRecord?.attempts || 0) + 1;

  const baseRecord: EmailDeliveryRecord = {
    id: existingRecord?.id || `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    idempotencyKey,
    customerId: input.customerId,
    recipientEmail: input.recipientEmail,
    recipientName: input.customerName,
    subject,
    templateType: 'registration_confirmation',
    status: 'pending',
    attempts,
    retryQueued: false,
    lastAttemptAt: nowIso,
    payloadSummary: {
      customerName: input.customerName,
      customerId: input.customerId,
      referralId: input.referralId,
      placementId: input.placementId,
      placementPosition: input.placementPosition,
      registrationDate: input.registrationDate,
      loginUrl
    }
  };

  const smtpConfig = getEmailProviderConfig();

  if (!smtpConfig.configured && !customTransport) {
    const pendingRecord: EmailDeliveryRecord = {
      ...baseRecord,
      status: 'pending',
      retryQueued: true,
      errorReason:
        'Email Service Pending: SMTP provider credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured in environment.'
    };
    return { record: pendingRecord, alreadySent: false };
  }

  try {
    const transporter =
      customTransport ||
      nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port || 587,
        secure: process.env.SMTP_SECURE === 'true' || smtpConfig.port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

    const info = await transporter.sendMail({
      from: smtpConfig.fromAddress,
      to: input.recipientEmail,
      subject,
      text,
      html
    });

    const sentStatus: EmailDeliveryStatus = 'sent';
    return {
      record: {
        ...baseRecord,
        status: sentStatus,
        retryQueued: false,
        sentAt: nowIso,
        messageId: info?.messageId || `msg-${Date.now()}`,
        errorReason: undefined
      },
      alreadySent: false
    };
  } catch (err: any) {
    return {
      record: {
        ...baseRecord,
        status: 'failed',
        retryQueued: true,
        errorReason: err?.message || 'SMTP transport error while sending confirmation email'
      },
      alreadySent: false
    };
  }
}
