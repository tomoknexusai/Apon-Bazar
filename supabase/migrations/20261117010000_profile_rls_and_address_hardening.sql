-- APON BAZAR — Profile Persistence, Address Fields & RLS Hardening Migration
-- Additive, idempotent migration for Supabase / PostgreSQL deployments.

-- 1. Extend public.addresses with granular Bangladesh administrative & street fields
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS ward VARCHAR(100),
  ADD COLUMN IF NOT EXISTS house_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS road_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS landmark VARCHAR(255),
  ADD COLUMN IF NOT EXISTS post_office VARCHAR(150),
  ADD COLUMN IF NOT EXISTS full_service_address TEXT;

-- 2. Extend public.vendor_profiles with business_type
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) DEFAULT 'Dealer';

-- 3. Helper function to check Super Admin / Admin role safely in RLS
CREATE OR REPLACE FUNCTION public.is_apon_super_admin(check_uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = check_uid
      AND ur.role IN ('super_admin')
  );
$$;

-- 4. Enable RLS on user_sessions (previously omitted)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Harden public.profiles policies (add WITH CHECK and Super Admin manage policy)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Super admin can manage all profiles" ON public.profiles;
CREATE POLICY "Super admin can manage all profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_apon_super_admin(auth.uid()))
  WITH CHECK (public.is_apon_super_admin(auth.uid()));

-- 6. Harden public.addresses policies (ensure WITH CHECK + Super Admin access)
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.addresses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super admin can manage all addresses" ON public.addresses;
CREATE POLICY "Super admin can manage all addresses"
  ON public.addresses
  FOR ALL
  USING (public.is_apon_super_admin(auth.uid()))
  WITH CHECK (public.is_apon_super_admin(auth.uid()));

-- 7. Add missing RLS policies for role-specific and verification tables
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admin manages user roles" ON public.user_roles;
CREATE POLICY "Super admin manages user roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_apon_super_admin(auth.uid()))
  WITH CHECK (public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own KYC" ON public.kyc_verifications;
CREATE POLICY "Users can manage own KYC"
  ON public.kyc_verifications
  FOR ALL
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Vendors can manage own vendor profile" ON public.vendor_profiles;
CREATE POLICY "Vendors can manage own vendor profile"
  ON public.vendor_profiles
  FOR ALL
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Operations partners can manage own partner profile" ON public.operations_partner_profiles;
CREATE POLICY "Operations partners can manage own partner profile"
  ON public.operations_partner_profiles
  FOR ALL
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Delivery riders can manage own rider profile" ON public.delivery_rider_profiles;
CREATE POLICY "Delivery riders can manage own rider profile"
  ON public.delivery_rider_profiles
  FOR ALL
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions
  FOR ALL
  USING (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_apon_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

DROP POLICY IF EXISTS "Super admin can read audit logs" ON public.audit_logs;
CREATE POLICY "Super admin can read audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (auth.uid() = actor_id OR public.is_apon_super_admin(auth.uid()));
