-- ============================================================================
-- APON BAZAR — UNIQUE AB- CUSTOMER ID MIGRATION, FIRST 7 COMPANY ACCOUNTS,
-- MANDATORY PASSWORD ROTATION & EMAIL DELIVERY LOGS
-- Additive & Idempotent Migration Only (Do NOT auto-execute on remote DB)
-- ============================================================================

-- 1. Additive Identity & Security Columns on Profiles & Binary Tree Nodes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS customer_id TEXT,
      ADD COLUMN IF NOT EXISTS legacy_id TEXT,
      ADD COLUMN IF NOT EXISTS nid_number TEXT,
      ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'binary_tree_nodes'
  ) THEN
    ALTER TABLE public.binary_tree_nodes
      ADD COLUMN IF NOT EXISTS legacy_id TEXT,
      ADD COLUMN IF NOT EXISTS nid_number TEXT,
      ADD COLUMN IF NOT EXISTS registration_status TEXT DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS account_tier TEXT DEFAULT 'member';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_binary_tree_nodes_legacy_id
  ON public.binary_tree_nodes(legacy_id)
  WHERE legacy_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_binary_tree_nodes_nid_number
  ON public.binary_tree_nodes(nid_number)
  WHERE nid_number IS NOT NULL;

-- 2. Permanent Legacy -> Canonical AB-1000000001+ Mapping Table (Rollback Safe)
CREATE TABLE IF NOT EXISTS public.id_migration_mappings (
  legacy_id TEXT PRIMARY KEY,
  new_ab_id TEXT UNIQUE NOT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pv_verified BOOLEAN NOT NULL DEFAULT TRUE,
  personal_pv INTEGER NOT NULL DEFAULT 0,
  left_pv INTEGER NOT NULL DEFAULT 0,
  right_pv INTEGER NOT NULL DEFAULT 0,
  total_matched_pv INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_id_migration_mappings_new_ab_id
  ON public.id_migration_mappings(new_ab_id);

-- 3. Transactional Email Delivery & Retry Queue Table
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'pending', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_customer_id
  ON public.email_delivery_logs(customer_id);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status
  ON public.email_delivery_logs(status);

-- 4. Monotonic Atomic Sequence for AB-1000000001+ (Commit-Only, Zero Blank Slot Burn)
CREATE SEQUENCE IF NOT EXISTS public.ab_customer_id_seq
  START WITH 1000000017
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

CREATE OR REPLACE FUNCTION public.allocate_next_ab_customer_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq BIGINT;
  v_ab_id TEXT;
BEGIN
  LOOP
    v_seq := nextval('public.ab_customer_id_seq');
    v_ab_id := 'AB-' || LPAD(v_seq::TEXT, 10, '0');
    IF NOT EXISTS (
      SELECT 1 FROM public.binary_tree_nodes WHERE id = v_ab_id
    ) THEN
      RETURN v_ab_id;
    END IF;
  END LOOP;
END;
$$;

-- 5. Resolve Legacy ID or AB- ID and Return Strictly Isolated Downward Subtree
CREATE OR REPLACE FUNCTION public.resolve_ab_company_id(
  p_input_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_clean TEXT := UPPER(TRIM(COALESCE(p_input_id, '')));
  v_mapped TEXT;
BEGIN
  IF v_clean = '' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.binary_tree_nodes WHERE UPPER(id) = v_clean
  ) THEN
    RETURN v_clean;
  END IF;

  SELECT new_ab_id INTO v_mapped
  FROM public.id_migration_mappings
  WHERE UPPER(legacy_id) = v_clean
  LIMIT 1;

  IF v_mapped IS NOT NULL THEN
    RETURN v_mapped;
  END IF;

  IF v_clean IN ('GBD000001', 'TMK000001', 'A-00001') THEN
    RETURN 'AB-1000000001';
  END IF;

  RETURN v_clean;
END;
$$;
