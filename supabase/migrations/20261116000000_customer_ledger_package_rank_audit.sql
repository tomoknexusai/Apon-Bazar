-- ============================================================================
-- APON BAZAR — Customer Ledger, Package Activation & Rank Separation Migration
-- File: 20261116000000_customer_ledger_package_rank_audit.sql
-- Strictly additive & idempotent local migration (NO destructive DDL)
-- ============================================================================

-- 1. Additive columns on network_members (safe if table already exists)
ALTER TABLE IF EXISTS public.network_members
  ADD COLUMN IF NOT EXISTS referral_id TEXT,
  ADD COLUMN IF NOT EXISTS placement_parent_id TEXT,
  ADD COLUMN IF NOT EXISTS placement_position TEXT CHECK (placement_position IN ('LEFT', 'RIGHT', 'ROOT')),
  ADD COLUMN IF NOT EXISTS placement_method TEXT NOT NULL DEFAULT 'AUTO_BFS' CHECK (placement_method IN ('MANUAL', 'AUTO_BFS')),
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS placement_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS activation_status TEXT NOT NULL DEFAULT 'inactive' CHECK (activation_status IN ('active', 'inactive', 'pending')),
  ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS order_or_payment_ref TEXT,
  ADD COLUMN IF NOT EXISTS rank_qualification_status TEXT NOT NULL DEFAULT 'unqualified' CHECK (rank_qualification_status IN ('qualified', 'unqualified', 'initial')),
  ADD COLUMN IF NOT EXISTS rank_achieved_at TIMESTAMPTZ;

-- 2. Ledger-derived Commission & Main Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_ledger_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id TEXT,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('main', 'commission', 'pending', 'reward', 'cash')),
  tx_type TEXT NOT NULL CHECK (tx_type IN ('credit', 'debit', 'transfer', 'payout', 'auto_release', 'withdrawal')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'held_for_review', 'rejected')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user_id ON public.wallet_ledger_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_customer_id ON public.wallet_ledger_transactions (customer_id, created_at DESC);

-- 3. Ledger-derived TOMOK Token transactions (0 initial balance for new customers)
CREATE TABLE IF NOT EXISTS public.token_ledger_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id TEXT,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('credit', 'debit')),
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  source TEXT NOT NULL CHECK (source IN ('reward', 'purchase_bonus', 'referral_bonus', 'admin_adjustment', 'redemption')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'reversed')),
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_ledger_user_id ON public.token_ledger_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_ledger_customer_id ON public.token_ledger_transactions (customer_id, created_at DESC);

-- 4. Real Package Activations (strictly separated from Earned Rank)
CREATE TABLE IF NOT EXISTS public.package_activations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  pv INTEGER NOT NULL CHECK (pv > 0),
  price_bdt NUMERIC(12, 2) NOT NULL CHECK (price_bdt >= 0),
  payment_source TEXT NOT NULL CHECK (payment_source IN ('main_wallet', 'payment_gateway', 'admin_verified')),
  order_or_payment_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'cancelled')),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_activations_customer ON public.package_activations (customer_id, activated_at DESC);

-- 5. Earned Rank History (strictly evaluated from real PV + Directs + Team PV)
CREATE TABLE IF NOT EXISTS public.rank_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  rank_code TEXT NOT NULL,
  rank_title_bn TEXT NOT NULL,
  rank_title_en TEXT NOT NULL,
  qualification_status TEXT NOT NULL CHECK (qualification_status IN ('qualified', 'unqualified', 'initial')),
  personal_pv INTEGER NOT NULL DEFAULT 0,
  team_pv INTEGER NOT NULL DEFAULT 0,
  active_directs INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_history_customer ON public.rank_history (customer_id, created_at DESC);

-- 6. Database-Level Placement Uniqueness & Transactional Row-Locking Protection
-- Guarantees two concurrent registrations can NEVER occupy the same (placement_parent_id, placement_position)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'network_members'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_network_members_parent_position
      ON public.network_members (placement_parent_id, placement_position)
      WHERE placement_parent_id IS NOT NULL
        AND placement_position IN ('LEFT', 'RIGHT');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'binary_tree_nodes'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_binary_tree_nodes_parent_position
      ON public.binary_tree_nodes (parent_id, UPPER(position))
      WHERE node_status <> 'blank'
        AND parent_id IS NOT NULL
        AND UPPER(position) IN ('LEFT', 'RIGHT');
  END IF;
END $$;

-- Transactional Atomic Customer Registration RPC with Row-Level Locking (FOR UPDATE)
-- + Advisory Transaction Lock on (parent_id, position) + AB- Sequence Allocation ONLY on Commit
CREATE OR REPLACE FUNCTION public.register_customer_ab_atomic(
  p_referral_id TEXT,
  p_placement_parent_id TEXT,
  p_placement_position TEXT,
  p_placement_method TEXT,
  p_user_id UUID,
  p_full_name TEXT,
  p_mobile TEXT,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent public.binary_tree_nodes%ROWTYPE;
  v_ref public.binary_tree_nodes%ROWTYPE;
  v_pos TEXT := UPPER(TRIM(COALESCE(p_placement_position, '')));
  v_method TEXT := UPPER(TRIM(COALESCE(p_placement_method, 'AUTO_BFS')));
  v_new_customer_id TEXT;
BEGIN
  IF v_pos NOT IN ('LEFT', 'RIGHT') THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 400, 'message', 'Placement position must be LEFT or RIGHT.');
  END IF;

  IF v_method NOT IN ('MANUAL', 'AUTO_BFS') THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 400, 'message', 'Invalid placement method.');
  END IF;

  -- Transaction-scoped advisory lock serialized on (placement_parent_id, position)
  PERFORM pg_advisory_xact_lock(hashtext(UPPER(TRIM(p_placement_parent_id)) || ':' || v_pos));

  SELECT * INTO v_ref
  FROM public.binary_tree_nodes
  WHERE id = public.resolve_ab_company_id(p_referral_id)
    AND node_status <> 'blank'
  FOR SHARE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 404, 'message', 'Referral ID not found or inactive.');
  END IF;

  -- Row-level lock on placement parent node
  SELECT * INTO v_parent
  FROM public.binary_tree_nodes
  WHERE id = public.resolve_ab_company_id(p_placement_parent_id)
    AND node_status <> 'blank'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 404, 'message', 'Placement parent node not found.');
  END IF;

  IF (v_pos = 'LEFT' AND v_parent.left_child_id IS NOT NULL)
     OR (v_pos = 'RIGHT' AND v_parent.right_child_id IS NOT NULL) THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 409, 'message', 'Selected placement slot is already occupied.');
  END IF;

  -- Allocate AB- ID strictly after all validations and locks succeed
  v_new_customer_id := public.allocate_next_ab_customer_id();

  INSERT INTO public.binary_tree_nodes (
    id, user_id, full_name, mobile, sponsor_id, parent_id, position, node_status, registration_status
  ) VALUES (
    v_new_customer_id, p_user_id, p_full_name, p_mobile, v_ref.id, v_parent.id, LOWER(v_pos), 'registered', 'completed'
  );

  IF v_pos = 'LEFT' THEN
    UPDATE public.binary_tree_nodes SET left_child_id = v_new_customer_id, updated_at = NOW() WHERE id = v_parent.id;
  ELSE
    UPDATE public.binary_tree_nodes SET right_child_id = v_new_customer_id, updated_at = NOW() WHERE id = v_parent.id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'status_code', 200,
    'customer_id', v_new_customer_id,
    'referral_id', v_ref.id,
    'placement_parent_id', v_parent.id,
    'placement_position', v_pos,
    'placement_method', v_method
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', FALSE, 'status_code', 409, 'message', 'Concurrent placement conflict: slot already claimed.');
END;
$$;

