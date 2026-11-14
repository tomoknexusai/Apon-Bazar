/**
 * Enterprise Security & Role ID Generator
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import { UserRole, UserProfile } from '../types';
import { UniqueIdService } from '../services/UniqueIdService';

/**
 * Standard Bangladesh Mobile Number Normalizer
 */
export function normalizeBDMobileNumber(rawNumber?: string): string {
  if (!rawNumber) return '';
  const bnToEnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  let cleaned = rawNumber.toString().replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('88') && cleaned.length > 11) {
    cleaned = cleaned.slice(2);
  }

  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

/**
 * Pure TypeScript standard SHA-256 implementation (works synchronously and universally)
 */
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let compositeClearHex = '';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    const code = ascii.charCodeAt(i);
    compositeClearHex += (code < 16 ? '0' : '') + code.toString(16);
  }

  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      let s0, s1, ch, temp1, temp2, maj;
      if (j < 16) {
        // w[j] already initialized
      } else {
        const gamma0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
        const gamma1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }

      s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      temp1 = (hash[7] + s1 + ch + k[j] + w[j]) | 0;

      s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      temp2 = (s0 + maj) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6]
      ];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Securely hashes a plain text password using SHA-256
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return '';
  const trimmed = plainText.trim();
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(trimmed);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    } catch (e) {
      console.warn('Subtle crypto fallback to sync SHA-256', e);
    }
  }
  return `sha256:${sha256Sync(trimmed)}`;
}

/**
 * Synchronous hash helper for instant state creation
 */
export function hashPasswordSync(plainText: string): string {
  if (!plainText) return '';
  return `sha256:${sha256Sync(plainText.trim())}`;
}

/**
 * Securely verifies a plain text password against stored hash or legacy plaintext
 */
export async function verifyPassword(
  inputPassword?: string,
  storedPasswordOrHash?: string
): Promise<boolean> {
  if (!storedPasswordOrHash) return true; // If no password was configured on account
  if (!inputPassword) return false;

  const cleanInput = inputPassword.trim();
  const cleanStored = storedPasswordOrHash.trim();

  // 1. Direct match (plain text legacy/seed users)
  if (cleanStored === cleanInput) return true;

  // 2. Hash match
  const hashedInput = await hashPassword(cleanInput);
  if (cleanStored === hashedInput) return true;

  // 3. Prefix stripped match
  if (cleanStored.startsWith('sha256:')) {
    const rawStored = cleanStored.replace('sha256:', '');
    const rawComputed = sha256Sync(cleanInput);
    if (rawStored === rawComputed) return true;
  }

  // 4. In case stored was raw hex hash without prefix
  if (sha256Sync(cleanInput) === cleanStored) return true;

  return false;
}

/**
 * Synchronous password verifier
 */
export function verifyPasswordSync(
  inputPassword?: string,
  storedPasswordOrHash?: string
): boolean {
  if (!storedPasswordOrHash) return true;
  if (!inputPassword) return false;

  const cleanInput = inputPassword.trim();
  const cleanStored = storedPasswordOrHash.trim();

  if (cleanStored === cleanInput) return true;

  const computedRaw = sha256Sync(cleanInput);
  if (cleanStored === `sha256:${computedRaw}`) return true;
  if (cleanStored === computedRaw) return true;
  if (cleanStored.startsWith('sha256:') && cleanStored.replace('sha256:', '') === computedRaw) return true;

  return false;
}

/**
 * Get standardized Role ID Prefix adhering strictly to Apon Bazar 8 Final Roles
 */
export function getRoleIdPrefix(role: string): string {
  return UniqueIdService.getRolePrefix(role).replace(/-$/, '');
}

/**
 * Get readable Bengali name for Role
 */
export function getRoleBanglaName(role: string): string {
  const titles = UniqueIdService.getRoleTitle(role);
  return `${titles.bn} (${titles.en})`;
}

/**
 * Generates a strictly unique, permanent role-specific ID Number
 * Formats:
 * - Customer & Networker: AponCN-000001
 * - Operation Officer: AponOO-000001
 * - Vendor / Dealer / Shop: AponVDS-000001
 * - Rider: AponR-000001
 * - Admin: AponA-000001
 * - Super Admin: AponSA-000001
 * - Account Officer: AponAO-000001
 * - HR: AponHR-000001
 */
export function previewRoleUniqueId(role: UserRole | string, existingUsers: UserProfile[] = []): string {
  return UniqueIdService.previewNextUniqueId(role, existingUsers);
}

export function generateRoleUniqueId(role: UserRole | string, existingUsers: UserProfile[] = []): string {
  return UniqueIdService.generateNextUniqueId(role, undefined, existingUsers);
}

/**
 * Normalize role checking:
 * 'dealer' and 'vendor' are treated as the same business role
 * 'super_admin' and 'admin' are treated as admin tier
 */
export function normalizeRoleTier(role: UserRole): string {
  if (role === 'dealer' || role === 'vendor') return 'dealer';
  if (role === 'admin' || role === 'super_admin') return 'admin';
  return role;
}

/**
 * Production PostgreSQL & Supabase Row Level Security (RLS) Policy & Trigger Script
 * Enforces immutable Super Admin ID: AANO-SADMIN-001 and full system view/edit control
 */
export const SUPER_ADMIN_RLS_POLICIES_SQL = `-- ==============================================================================
-- 1. ROW LEVEL SECURITY (RLS) & IMMUTABILITY ENFORCEMENT SCRIPT
-- Project: TOMSHOPBD
-- Target Fixed Super Admin: AANO-SADMIN-001
-- ==============================================================================

-- Enable RLS across all core tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.network_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. IMMUTABLE SUPER ADMIN DATABASE TRIGGER (Prevents Deletion & ID Modification)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_super_admin_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- Block Deletion of Fixed Super Admin ID
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.id = 'AANO-SADMIN-001' OR OLD.permanent_member_id = 'AANO-SADMIN-001') THEN
            RAISE EXCEPTION 'SECURITY ERROR 403: Super Admin ID (AANO-SADMIN-001) is immutable and CANNOT BE DELETED from database.';
        END IF;
        RETURN OLD;
    END IF;

    -- Block Modification of Super Admin ID or Primary Role Downgrade
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.id = 'AANO-SADMIN-001') THEN
            IF (NEW.id <> 'AANO-SADMIN-001') THEN
                RAISE EXCEPTION 'SECURITY ERROR 403: Super Admin Primary ID is immutable and CANNOT BE MODIFIED.';
            END IF;
            IF (NEW.primary_role <> 'super_admin') THEN
                RAISE EXCEPTION 'SECURITY ERROR 403: Super Admin Role cannot be downgraded or revoked.';
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS trg_super_admin_immutability ON public.profiles;
CREATE TRIGGER trg_super_admin_immutability
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION check_super_admin_immutability();

-- ------------------------------------------------------------------------------
-- 3. SUPER ADMIN FULL SYSTEM VIEW / EDIT CONTROL RLS POLICIES
-- ------------------------------------------------------------------------------

-- Profiles: Super Admin full control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Profiles" ON public.profiles;
CREATE POLICY "SuperAdmin Full Control on Profiles"
ON public.profiles
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' 
    OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
    OR (SELECT primary_role FROM public.profiles WHERE id = auth.uid()::text) = 'super_admin'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' 
    OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
    OR (SELECT primary_role FROM public.profiles WHERE id = auth.uid()::text) = 'super_admin'
);

-- Products: Super Admin full view/edit control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Products" ON public.products;
CREATE POLICY "SuperAdmin Full Control on Products"
ON public.products
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);

-- Orders: Super Admin full view/edit control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Orders" ON public.orders;
CREATE POLICY "SuperAdmin Full Control on Orders"
ON public.orders
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);

-- Payments: Super Admin full view/edit control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Payments" ON public.payments;
CREATE POLICY "SuperAdmin Full Control on Payments"
ON public.payments
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);

-- Wallets: Super Admin full view/edit control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Wallets" ON public.wallets;
CREATE POLICY "SuperAdmin Full Control on Wallets"
ON public.wallets
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);

-- Commissions: Super Admin full view/edit control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Commissions" ON public.commissions;
CREATE POLICY "SuperAdmin Full Control on Commissions"
ON public.commissions
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);

-- System Settings: Super Admin full control
DROP POLICY IF EXISTS "SuperAdmin Full Control on Settings" ON public.system_settings;
CREATE POLICY "SuperAdmin Full Control on Settings"
ON public.system_settings
FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
)
WITH CHECK (
    auth.jwt() ->> 'role' = 'super_admin' OR auth.jwt() ->> 'user_id' = 'AANO-SADMIN-001'
);
`;
