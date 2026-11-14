-- ============================================================================
-- Apon Bazar Binary Tree: Mandatory Auto-Generate Left & Right Blank Positions
-- Additive Schema & Transactional PL/pgSQL Functions
-- DO NOT auto-execute on production DB without Super Admin approval.
-- ============================================================================

-- 1. Non-Reusable Sequence & Registry for Binary Company IDs (GBDxxxxxx)
CREATE SEQUENCE IF NOT EXISTS public.binary_company_id_seq
  START WITH 16
  INCREMENT BY 1
  NO MAXVALUE
  CACHE 1;

CREATE TABLE IF NOT EXISTS public.allocated_binary_company_ids (
  company_id TEXT PRIMARY KEY,
  seq_number BIGINT UNIQUE NOT NULL,
  allocation_status TEXT NOT NULL CHECK (allocation_status IN ('blank', 'registered', 'tombstoned')),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ
);

-- Guard: Pre-reserved Binary Company IDs can NEVER be deleted or reused
CREATE OR REPLACE FUNCTION public.prevent_allocated_binary_id_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Pre-reserved Binary Company ID (%) cannot be deleted, cancelled, or reused.', OLD.company_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_allocated_binary_id_delete ON public.allocated_binary_company_ids;
CREATE TRIGGER trg_prevent_allocated_binary_id_delete
  BEFORE DELETE ON public.allocated_binary_company_ids
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_allocated_binary_id_deletion();

-- 2. Unified Binary Tree Nodes Table (Registered Members + Pre-Reserved Blank Slots)
CREATE TABLE IF NOT EXISTS public.binary_tree_nodes (
  id TEXT PRIMARY KEY REFERENCES public.allocated_binary_company_ids(company_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  parent_id TEXT REFERENCES public.binary_tree_nodes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  position TEXT NOT NULL CHECK (position IN ('ROOT', 'LEFT', 'RIGHT')),
  node_status TEXT NOT NULL CHECK (node_status IN ('blank', 'registered')),
  user_id UUID,
  apon_unique_id TEXT,
  sponsor_id TEXT,
  full_name TEXT NOT NULL DEFAULT 'BLANK',
  mobile TEXT,
  email TEXT,
  package_id TEXT,
  personal_pv INTEGER NOT NULL DEFAULT 0,
  left_pv INTEGER NOT NULL DEFAULT 0,
  right_pv INTEGER NOT NULL DEFAULT 0,
  left_carry_forward INTEGER NOT NULL DEFAULT 0,
  right_carry_forward INTEGER NOT NULL DEFAULT 0,
  total_matched_pv INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Invariant: Never more than 1 LEFT child and 1 RIGHT child under one parent
  CONSTRAINT uq_binary_parent_position UNIQUE (parent_id, position),
  CONSTRAINT chk_root_no_parent CHECK (
    (position = 'ROOT' AND parent_id IS NULL) OR (position IN ('LEFT', 'RIGHT') AND parent_id IS NOT NULL)
  ),
  CONSTRAINT chk_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX IF NOT EXISTS idx_binary_tree_nodes_parent ON public.binary_tree_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_binary_tree_nodes_status ON public.binary_tree_nodes(node_status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_binary_tree_registered_user
  ON public.binary_tree_nodes(user_id)
  WHERE user_id IS NOT NULL AND node_status = 'registered';

-- 3. Trigger: Enforce max 2 direct children per parent & prohibit deleting any blank/registered node
CREATE OR REPLACE FUNCTION public.enforce_binary_tree_node_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_sibling_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Binary tree node (%) with status (%) cannot be deleted or cancelled.', OLD.id, OLD.node_status;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.id <> NEW.id THEN
    RAISE EXCEPTION 'Binary Company ID (%) is permanent and immutable.', OLD.id;
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_sibling_count
    FROM public.binary_tree_nodes
    WHERE parent_id = NEW.parent_id
      AND id <> NEW.id;

    IF v_sibling_count >= 2 THEN
      RAISE EXCEPTION 'Binary parent (%) already has the maximum of 2 direct child positions (LEFT & RIGHT).', NEW.parent_id;
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_binary_node_invariants ON public.binary_tree_nodes;
CREATE TRIGGER trg_enforce_binary_node_invariants
  BEFORE INSERT OR UPDATE OR DELETE ON public.binary_tree_nodes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_binary_tree_node_invariants();

-- Helper: Allocate next monotonic non-reusable GBDxxxxxx ID
CREATE OR REPLACE FUNCTION public.allocate_next_binary_company_id(
  p_status TEXT DEFAULT 'blank'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq BIGINT;
  v_company_id TEXT;
BEGIN
  LOOP
    v_seq := nextval('public.binary_company_id_seq');
    v_company_id := 'GBD' || LPAD(v_seq::TEXT, 6, '0');
    BEGIN
      INSERT INTO public.allocated_binary_company_ids (company_id, seq_number, allocation_status)
      VALUES (v_company_id, v_seq, p_status);
      RETURN v_company_id;
    EXCEPTION WHEN unique_violation THEN
      -- Continue to next monotonic sequence value; never reuse
    END;
  END LOOP;
END;
$$;

-- 4. Atomic Transactional RPC: Claim Blank Position + Generate 2 New Blank Child Positions (1st LEFT, 2nd RIGHT)
CREATE OR REPLACE FUNCTION public.register_member_on_blank_slot(
  p_reserved_company_id TEXT,
  p_parent_id TEXT,
  p_position TEXT,
  p_user_id UUID,
  p_apon_unique_id TEXT,
  p_sponsor_id TEXT,
  p_full_name TEXT,
  p_mobile TEXT,
  p_email TEXT DEFAULT NULL,
  p_package_id TEXT DEFAULT 'pkg-100',
  p_personal_pv INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_blank public.binary_tree_nodes%ROWTYPE;
  v_left_blank_id TEXT;
  v_right_blank_id TEXT;
  v_pos TEXT := UPPER(TRIM(p_position));
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_pos NOT IN ('LEFT', 'RIGHT') THEN
    RAISE EXCEPTION 'Invalid binary position: %. Must be LEFT or RIGHT.', p_position;
  END IF;

  -- Lock the target blank position row for concurrent transaction safety
  SELECT * INTO v_blank
  FROM public.binary_tree_nodes
  WHERE id = UPPER(TRIM(p_reserved_company_id))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Blank position (%) not found.', p_reserved_company_id;
  END IF;

  IF v_blank.node_status <> 'blank' THEN
    RAISE EXCEPTION 'Blank position (%) has already been claimed.', v_blank.id;
  END IF;

  IF v_blank.parent_id <> UPPER(TRIM(p_parent_id)) OR v_blank.position <> v_pos THEN
    RAISE EXCEPTION 'Blank position (%) belongs to parent (%) position (%), mismatch with requested (%, %).',
      v_blank.id, v_blank.parent_id, v_blank.position, p_parent_id, v_pos;
  END IF;

  -- Convert blank position into registered member node retaining its exact pre-reserved Company ID
  UPDATE public.binary_tree_nodes
  SET
    node_status = 'registered',
    user_id = p_user_id,
    apon_unique_id = p_apon_unique_id,
    sponsor_id = COALESCE(NULLIF(TRIM(p_sponsor_id), ''), v_blank.parent_id),
    full_name = p_full_name,
    mobile = p_mobile,
    email = p_email,
    package_id = COALESCE(p_package_id, 'pkg-100'),
    personal_pv = GREATEST(0, COALESCE(p_personal_pv, 100)),
    is_active = TRUE,
    registered_at = v_now,
    updated_at = v_now
  WHERE id = v_blank.id;

  UPDATE public.allocated_binary_company_ids
  SET allocation_status = 'registered',
      registered_at = v_now
  WHERE company_id = v_blank.id;

  -- Immediately allocate 1st LEFT and 2nd RIGHT blank child positions underneath the newly registered node
  v_left_blank_id := public.allocate_next_binary_company_id('blank');
  INSERT INTO public.binary_tree_nodes (id, parent_id, position, node_status, sponsor_id, full_name, is_active, reserved_at)
  VALUES (v_left_blank_id, v_blank.id, 'LEFT', 'blank', v_blank.id, 'LEFT BLANK', FALSE, v_now);

  v_right_blank_id := public.allocate_next_binary_company_id('blank');
  INSERT INTO public.binary_tree_nodes (id, parent_id, position, node_status, sponsor_id, full_name, is_active, reserved_at)
  VALUES (v_right_blank_id, v_blank.id, 'RIGHT', 'blank', v_blank.id, 'RIGHT BLANK', FALSE, v_now);

  RETURN jsonb_build_object(
    'success', TRUE,
    'registeredCompanyId', v_blank.id,
    'parentId', v_blank.parent_id,
    'position', v_pos,
    'newLeftBlankId', v_left_blank_id,
    'newRightBlankId', v_right_blank_id
  );
END;
$$;
