-- =========================================================================
-- APON BAZAR — ID-WISE INDIVIDUAL NETWORK TREE VIEW (ISOLATED SUBTREE RPC)
-- Additive Migration Only (Do not execute automatically without approval)
-- =========================================================================

-- Recursive CTE function that extracts ONLY the downward subtree starting
-- strictly from `p_root_company_id`, enforcing server-side role/subtree RBAC.
CREATE OR REPLACE FUNCTION get_isolated_binary_subtree(
  p_root_company_id TEXT,
  p_requestor_role TEXT DEFAULT 'customer',
  p_requestor_user_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_root TEXT := UPPER(TRIM(COALESCE(p_root_company_id, '')));
  v_clean_role TEXT := LOWER(TRIM(COALESCE(p_requestor_role, '')));
  v_is_admin BOOLEAN := v_clean_role IN ('super_admin', 'admin');
  v_owner_company_id TEXT;
  v_target_exists BOOLEAN := FALSE;
  v_authorized BOOLEAN := FALSE;
  v_nodes JSONB;
  v_members_count INTEGER := 0;
  v_blank_count INTEGER := 0;
  v_tree_levels INTEGER := 0;
BEGIN
  IF v_clean_root = '' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'statusCode', 400,
      'errorCode', 'INVALID_INPUT',
      'message', 'Company ID is required.'
    );
  END IF;

  IF p_requestor_user_id IS NULL OR TRIM(p_requestor_user_id) = '' OR LOWER(TRIM(p_requestor_user_id)) = 'guest' THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'statusCode', 403,
      'errorCode', 'ACCESS_DENIED',
      'message', 'Authentication required to inspect network tree.'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM binary_tree_nodes WHERE UPPER(id) = v_clean_root
  ) INTO v_target_exists;

  IF NOT v_is_admin THEN
    SELECT id INTO v_owner_company_id
    FROM binary_tree_nodes
    WHERE user_id = p_requestor_user_id
      AND node_status = 'registered'
    LIMIT 1;

    IF v_owner_company_id IS NULL THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'statusCode', 403,
        'errorCode', 'ACCESS_DENIED',
        'message', 'No Company ID bound to requestor account.'
      );
    END IF;

    IF NOT v_target_exists THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'statusCode', 404,
        'errorCode', 'NOT_FOUND',
        'message', format('Company ID %s not found.', v_clean_root)
      );
    END IF;

    WITH RECURSIVE owner_subtree AS (
      SELECT id, parent_id
      FROM binary_tree_nodes
      WHERE id = v_owner_company_id
      UNION ALL
      SELECT c.id, c.parent_id
      FROM binary_tree_nodes c
      INNER JOIN owner_subtree os ON c.parent_id = os.id
    )
    SELECT EXISTS (
      SELECT 1 FROM owner_subtree WHERE UPPER(id) = v_clean_root
    ) INTO v_authorized;

    IF NOT v_authorized THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'statusCode', 403,
        'errorCode', 'ACCESS_DENIED',
        'message', format('Access Denied: Normal member %s cannot inspect ancestor or sibling branches.', v_owner_company_id)
      );
    END IF;
  END IF;

  IF NOT v_target_exists THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'statusCode', 404,
      'errorCode', 'NOT_FOUND',
      'message', format('Company ID %s not found.', v_clean_root)
    );
  END IF;

  WITH RECURSIVE isolated_subtree AS (
    SELECT
      n.*,
      1 AS tree_level,
      NULL::TEXT AS isolated_parent_id
    FROM binary_tree_nodes n
    WHERE UPPER(n.id) = v_clean_root

    UNION ALL

    SELECT
      child.*,
      parent.tree_level + 1 AS tree_level,
      child.parent_id AS isolated_parent_id
    FROM binary_tree_nodes child
    INNER JOIN isolated_subtree parent ON child.parent_id = parent.id
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', id,
        'fullName', full_name,
        'nodeStatus', node_status,
        'position', position,
        'placementLeg', placement_leg,
        'parentId', isolated_parent_id,
        'sponsorId', sponsor_id,
        'personalPV', personal_pv,
        'leftPV', left_pv,
        'rightPV', right_pv,
        'leftChildId', left_child_id,
        'rightChildId', right_child_id,
        'leftBlankId', left_blank_id,
        'rightBlankId', right_blank_id,
        'treeLevel', tree_level
      )
      ORDER BY tree_level ASC, id ASC
    ), '[]'::JSONB),
    COUNT(*) FILTER (WHERE node_status <> 'blank'),
    COUNT(*) FILTER (WHERE node_status = 'blank'),
    COALESCE(MAX(tree_level), 0)
  INTO v_nodes, v_members_count, v_blank_count, v_tree_levels
  FROM isolated_subtree;

  RETURN jsonb_build_object(
    'success', TRUE,
    'statusCode', 200,
    'rootId', v_clean_root,
    'nodes', v_nodes,
    'stats', jsonb_build_object(
      'selectedCompanyId', v_clean_root,
      'networkMembers', v_members_count,
      'blankPositions', v_blank_count,
      'totalNodes', v_members_count + v_blank_count,
      'treeLevels', v_tree_levels
    )
  );
END;
$$;
