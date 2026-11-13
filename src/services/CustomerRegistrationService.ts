/**
 * Shared Customer Registration Service
 * Unified validation, customer ID generation, and account creation service
 * Used by:
 * 1. Dashboard → Customer Registration
 * 2. Binary Network Tree → Customer Registration & Slot Reserved
 * 3. AI Placement Engine → Customer Registration & Slot Reserved
 * Project: Apon Bazar / Apon Bazar
 */

import { UserProfile } from '../types';
import { NetworkMember, ReservedSlot } from '../types/networkMarketing';
import { SlotReservationService } from './SlotReservationService';
import { UniqueIdService } from './UniqueIdService';

export type RegistrationSource = 'dashboard' | 'binary_tree' | 'ai_placement' | 'checkout';

export interface CustomerRegistrationPayload {
  fullName: string;
  username: string;
  mobile: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  passwordMode: 'normal' | 'strong';
  referralId: string;
  placementId?: string;
  position?: 'left' | 'right';
  division: string;
  district: string;
  upazila: string;
  unionName?: string;
  ward?: string;
  village?: string;
  housePara?: string;
  detailedAddress?: string;
  turnstileVerified?: boolean;
  agreeTerms?: boolean;
  registrationSource: RegistrationSource;
  reservationId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  generalError?: string;
}

export interface RegistrationExecutionResult {
  success: boolean;
  customerId: string;
  username: string;
  fullName: string;
  mobile: string;
  email: string;
  sponsorId: string;
  sponsorName: string;
  placementId: string;
  placementName: string;
  placementLeg: 'left' | 'right';
  registrationSource: RegistrationSource;
  fullServiceAddress: string;
  message?: string;
}

export class CustomerRegistrationService {
  /**
   * Generates a permanent unique Customer & Networker ID in format AponCN-000001
   * Concurrency-safe atomic generation, never reused, sequence never resets.
   */
  static generateUniqueCustomerId(existingUsers: UserProfile[]): string {
    return UniqueIdService.generateNextUniqueId('customer_networker', undefined, existingUsers);
  }

  /**
   * Validates user ID (username) format and global uniqueness
   */
  static validateUserId(userId: string, existingUsers: UserProfile[], currentUserId?: string): { isValid: boolean; message?: string } {
    const clean = userId.trim();
    if (!clean) {
      return { isValid: false, message: 'ইউজার আইডি আবশ্যক' };
    }
    if (clean.length < 3 || clean.length > 20 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      return { isValid: false, message: 'একটি ইউনিক User ID নির্বাচন করুন' };
    }

    const lower = clean.toLowerCase();
    const isTaken = existingUsers.some(
      (u) =>
        u.id !== currentUserId &&
        (u.username?.toLowerCase() === lower ||
         u.id.toLowerCase() === lower ||
         u.customerId?.toLowerCase() === lower ||
         u.permanentMemberId?.toLowerCase() === lower)
    );

    if (isTaken) {
      return { isValid: false, message: 'এই User ID ইতিমধ্যে ব্যবহৃত হয়েছে' };
    }

    return { isValid: true };
  }

  /**
   * Validates Refer ID
   * If empty and source is dashboard or checkout, will default to TMK000001
   */
  static validateReferId(
    referId: string,
    members: NetworkMember[],
    allowEmptyDefault: boolean = true
  ): { isValid: boolean; sponsor?: NetworkMember; message?: string } {
    const clean = referId.trim();
    if (!clean) {
      if (allowEmptyDefault) {
        const master = members.find((m) => m.id === 'TMK000001') || members[0];
        return { isValid: true, sponsor: master };
      }
      return { isValid: false, message: 'রেফার আইডি আবশ্যক' };
    }

    const cleanUpper = clean.toUpperCase();
    const found = members.find(
      (m) =>
        m.id.toUpperCase() === cleanUpper ||
        (m.customerId && m.customerId.toUpperCase() === cleanUpper) ||
        (m.userId && m.userId.toUpperCase() === cleanUpper)
    );

    if (!found) {
      return { isValid: false, message: `রেফার আইডি "${referId}" সঠিক নয় বা বিদ্যমান নেই।` };
    }

    return { isValid: true, sponsor: found };
  }

  /**
   * Validates Placement ID & Slot availability
   */
  static validatePlacementSlot(
    placementId: string,
    leg: 'left' | 'right',
    members: NetworkMember[],
    reservedPlacements: ReservedSlot[] = [],
    currentReservationId?: string
  ): { isValid: boolean; parent?: NetworkMember; message?: string } {
    const clean = placementId.trim();
    if (!clean) {
      return { isValid: false, message: 'প্লেসমেন্ট আইডি আবশ্যক' };
    }

    const cleanUpper = clean.toUpperCase();
    const parent = members.find(
      (m) =>
        m.id.toUpperCase() === cleanUpper ||
        (m.customerId && m.customerId.toUpperCase() === cleanUpper) ||
        (m.userId && m.userId.toUpperCase() === cleanUpper)
    );

    if (!parent) {
      return { isValid: false, message: `প্লেসমেন্ট আইডি "${placementId}" সিস্টেমে পাওয়া যায়নি।` };
    }

    // Check slot availability
    const avail = SlotReservationService.isSlotAvailable(
      parent.id,
      leg,
      members,
      reservedPlacements,
      currentReservationId
    );

    if (!avail.isAvailable) {
      return { isValid: false, parent, message: avail.reason || 'এই প্লেসমেন্ট স্লটটি বর্তমানে খালি নেই।' };
    }

    return { isValid: true, parent };
  }

  /**
   * Unified Form Validator for all registration sources
   */
  static validateForm(
    payload: CustomerRegistrationPayload,
    existingUsers: UserProfile[],
    members: NetworkMember[],
    reservedPlacements: ReservedSlot[] = []
  ): ValidationResult {
    const errors: Record<string, string> = {};

    // 1. Full Name
    if (!payload.fullName.trim()) {
      errors.fullName = 'নাম আবশ্যক';
    }

    // 2. User ID
    const userVal = this.validateUserId(payload.username, existingUsers);
    if (!userVal.isValid) {
      errors.username = userVal.message || 'ইউজার আইডি আবশ্যক';
    }

    // 3. Mobile Number (Bangladesh format 01XXXXXXXXX)
    const cleanMobile = payload.mobile.trim().replace(/[\s-]/g, '');
    const isBDMobile = /^01[3-9]\d{8}$/.test(cleanMobile);
    if (!cleanMobile) {
      errors.mobile = 'মোবাইল নম্বর সঠিক নয়';
    } else if (!isBDMobile) {
      errors.mobile = 'মোবাইল নম্বর সঠিক নয়';
    }

    // 4. Password validation (Normal vs Strong)
    const pass = payload.password.trim();
    if (!pass) {
      errors.password = 'পাসওয়ার্ড আবশ্যক';
    } else if (payload.passwordMode === 'strong') {
      const hasUpper = /[A-Z]/.test(pass);
      const hasLower = /[a-z]/.test(pass);
      const hasNumber = /[0-9]/.test(pass);
      const hasSpecial = /[^A-Za-z0-9]/.test(pass);
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial || pass.length < 6) {
        errors.password = 'শক্তিশালী পাসওয়ার্ডে বড় ও ছোট হাতের অক্ষর, সংখ্যা ও স্পেশাল চিহ্ন থাকতে হবে (সর্বনিম্ন ৬ অক্ষর)';
      }
    } else {
      if (pass.length < 4) {
        errors.password = 'পাসওয়ার্ড সর্বনিম্ন ৪ অক্ষরের হতে হবে';
      }
    }

    // 5. Confirm Password validation
    if (payload.confirmPassword !== undefined && pass !== payload.confirmPassword.trim()) {
      errors.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    }

    // 6. Address validation
    if (!payload.division || payload.division === 'বিভাগ নির্বাচন করুন' || payload.division === '') {
      errors.division = 'বিভাগ নির্বাচন করুন';
    }
    if (!payload.district || payload.district === 'জেলা নির্বাচন করুন' || payload.district === '') {
      errors.district = 'জেলা নির্বাচন করুন';
    }
    if (!payload.upazila || payload.upazila === 'উপজেলা / থানা নির্বাচন করুন' || payload.upazila === '') {
      errors.upazila = 'উপজেলা/থানা নির্বাচন করুন';
    }

    // 7. Security verification (Cloudflare Turnstile) - optional for checkout
    if (payload.registrationSource !== 'checkout' && !payload.turnstileVerified) {
      errors.turnstile = 'অনুগ্রহ করে নিরাপত্তা ভেরিফিকেশন সম্পন্ন করুন।';
    }

    // 8. Terms & Conditions acceptance - optional for checkout
    if (payload.registrationSource !== 'checkout' && !payload.agreeTerms) {
      errors.terms = 'একাউন্ট তৈরি করতে শর্তাবলী মেনে নেওয়া আবশ্যক।';
    }

    // 9. Refer ID validation
    const allowDefaultRefer = payload.registrationSource === 'dashboard' || payload.registrationSource === 'checkout';
    const referVal = this.validateReferId(payload.referralId, members, allowDefaultRefer);
    if (!referVal.isValid) {
      errors.referralId = referVal.message || 'সঠিক রেফার আইডি প্রদান করুন।';
    }

    // 10. Placement ID & Position validation (if provided)
    if (payload.placementId && payload.placementId.trim() && payload.position) {
      const placementVal = this.validatePlacementSlot(
        payload.placementId,
        payload.position,
        members,
        reservedPlacements,
        payload.reservationId
      );
      if (!placementVal.isValid) {
        errors.placementId = placementVal.message || 'প্লেসমেন্ট স্লটটি খালি নেই বা সঠিক নয়।';
      }
    }

    const isValid = Object.keys(errors).length === 0;
    const firstErrorKey = Object.keys(errors)[0];
    const generalError = firstErrorKey ? errors[firstErrorKey] : undefined;

    return { isValid, errors, generalError };
  }
}
