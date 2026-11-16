-- ============================================================================
-- APON BAZAR — Company & Branding Settings + Rider/Dealer Credential Management
-- File: 20261117000000_company_settings_and_credential_management.sql
-- Strictly additive & idempotent local migration (NO destructive DDL)
-- ============================================================================

-- 1. Persistent Company & Branding Settings singleton table
-- Only APON BAZAR / আপন বাজার defaults; optional contact fields default to empty string.
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'APON BAZAR',
  company_name_bn TEXT NOT NULL DEFAULT 'আপন বাজার',
  support_email TEXT NOT NULL DEFAULT '',
  customer_service_email TEXT NOT NULL DEFAULT '',
  seller_contact_email TEXT NOT NULL DEFAULT '',
  official_phone TEXT NOT NULL DEFAULT '',
  company_address TEXT NOT NULL DEFAULT '',
  website_url TEXT NOT NULL DEFAULT '',
  company_logo_url TEXT NOT NULL DEFAULT '/apon-bazar-logo.png',
  invoice_display_info TEXT NOT NULL DEFAULT '',
  email_sender_name TEXT NOT NULL DEFAULT 'APON BAZAR',
  email_sender_email TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_company_settings_singleton CHECK (id = 'default'),
  CONSTRAINT chk_company_name_nonempty CHECK (LENGTH(TRIM(company_name)) > 0),
  CONSTRAINT chk_company_name_bn_nonempty CHECK (LENGTH(TRIM(company_name_bn)) > 0)
);

INSERT INTO public.company_settings (id, company_name, company_name_bn, email_sender_name)
VALUES ('default', 'APON BAZAR', 'আপন বাজার', 'APON BAZAR')
ON CONFLICT (id) DO NOTHING;

-- 2. Additive credential management columns on public.users (safe if table exists)
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_password_reset_at TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username_lower
      ON public.users (LOWER(username))
      WHERE username IS NOT NULL AND LENGTH(TRIM(username)) > 0;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
      ON public.users (LOWER(email))
      WHERE email IS NOT NULL AND LENGTH(TRIM(email)) > 0;
  END IF;
END $$;

-- 3. Immutable Credential & Company Settings Audit Logs
-- Plaintext passwords or password hashes are NEVER logged here.
CREATE TABLE IF NOT EXISTS public.credential_audit_logs (
  id TEXT PRIMARY KEY,
  super_admin_id TEXT NOT NULL,
  super_admin_name TEXT NOT NULL,
  target_account_id TEXT NOT NULL,
  target_username TEXT NOT NULL,
  target_role TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'COMPANY_SETTINGS_UPDATED',
      'RIDER_ACCOUNT_CREATED',
      'RIDER_CREDENTIALS_UPDATED',
      'RIDER_PASSWORD_RESET',
      'RIDER_STATUS_CHANGED',
      'DEALER_ACCOUNT_CREATED',
      'DEALER_CREDENTIALS_UPDATED',
      'DEALER_PASSWORD_RESET',
      'DEALER_STATUS_CHANGED',
      'STAFF_SELF_PASSWORD_CHANGED'
    )
  ),
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credential_audit_logs_created_at
  ON public.credential_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credential_audit_logs_target
  ON public.credential_audit_logs (target_account_id, created_at DESC);

-- 4. Row-Level Security (Strict Super Admin Write/Audit Access)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_settings' AND policyname = 'company_settings_public_read'
  ) THEN
    CREATE POLICY company_settings_public_read
      ON public.company_settings FOR SELECT
      USING (TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_settings' AND policyname = 'company_settings_super_admin_write'
  ) THEN
    CREATE POLICY company_settings_super_admin_write
      ON public.company_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()::text
            AND (u.primary_role = 'super_admin' OR 'super_admin' = ANY(u.roles))
            AND u.account_status = 'active'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credential_audit_logs' AND policyname = 'credential_audit_logs_super_admin_only'
  ) THEN
    CREATE POLICY credential_audit_logs_super_admin_only
      ON public.credential_audit_logs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()::text
            AND (u.primary_role = 'super_admin' OR 'super_admin' = ANY(u.roles))
            AND u.account_status = 'active'
        )
      );
  END IF;
END $$;
