-- SQL Migration Script for ঘরের বাজার বিডি (Ghorer Bazar BD)
-- Target Platform: Supabase / PostgreSQL Enterprise Foundation
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Custom Enum Types
CREATE TYPE user_role_type AS ENUM (
  'super_admin',
  'admin',
  'customer',
  'vendor',
  'operations_partner',
  'delivery_rider'
);

CREATE TYPE account_status_type AS ENUM (
  'active',
  'pending',
  'suspended',
  'banned'
);

CREATE TYPE kyc_status_type AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

CREATE TYPE gender_type AS ENUM (
  'male',
  'female',
  'other'
);

CREATE TYPE notification_channel_type AS ENUM (
  'in_app',
  'email',
  'sms',
  'push'
);

-- 1. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL DEFAULT 'ঘরের বাজার বিডি',
  token_name VARCHAR(50) NOT NULL DEFAULT 'TOMOK',
  currency_code VARCHAR(10) NOT NULL DEFAULT 'BDT',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT '৳',
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
  default_language VARCHAR(10) NOT NULL DEFAULT 'bn',
  enable_email_notifications BOOLEAN DEFAULT TRUE,
  enable_sms_notifications BOOLEAN DEFAULT TRUE,
  enable_push_notifications BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ
);

-- Insert Default Global System Settings
INSERT INTO public.system_settings (
  company_name, token_name, currency_code, currency_symbol, timezone, default_language
) VALUES (
  'ঘরের বাজার বিডি', 'TOMOK', 'BDT', '৳', 'Asia/Dhaka', 'bn'
) ON CONFLICT DO NOTHING;

-- 2. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) UNIQUE,
  profile_photo_url TEXT,
  national_id VARCHAR(50),
  date_of_birth DATE,
  gender gender_type,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  language_preference VARCHAR(10) DEFAULT 'bn',
  account_status account_status_type DEFAULT 'active',
  verification_status kyc_status_type DEFAULT 'unverified',
  tomok_token_balance NUMERIC(18, 4) DEFAULT 0.0000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. USER ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. SERVICE ADDRESSES TABLE (Bangladesh Administrative Hierarchy)
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(100) DEFAULT 'Home Address',
  division VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  upazila VARCHAR(100) NOT NULL,
  union_name VARCHAR(100) NOT NULL,
  area TEXT NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  is_mandatory_service_address BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 5. KYC VERIFICATION TABLE
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nid_number VARCHAR(50) NOT NULL,
  nid_front_image_url TEXT,
  nid_back_image_url TEXT,
  dob DATE NOT NULL,
  status kyc_status_type DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VENDOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  trade_license_number VARCHAR(100),
  commission_tier VARCHAR(50) DEFAULT 'Standard Dealer',
  outlet_address TEXT,
  division VARCHAR(100),
  district VARCHAR(100),
  upazila VARCHAR(100),
  union_name VARCHAR(100),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. OPERATIONS PARTNER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.operations_partner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hub_code VARCHAR(50) UNIQUE NOT NULL,
  coverage_division VARCHAR(100) NOT NULL,
  coverage_district VARCHAR(100) NOT NULL,
  coverage_upazila VARCHAR(100) NOT NULL,
  partner_quota INTEGER DEFAULT 100,
  sub_dealer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DELIVERY RIDER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.delivery_rider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50) DEFAULT 'Motorcycle',
  vehicle_reg_number VARCHAR(50),
  driving_license_number VARCHAR(50),
  assigned_upazila VARCHAR(100),
  assigned_union VARCHAR(100),
  is_online BOOLEAN DEFAULT FALSE,
  current_lat NUMERIC(10, 7),
  current_lng NUMERIC(10, 7),
  completed_deliveries INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channel notification_channel_type DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_bd_hierarchy ON public.addresses(division, district, upazila, union_name);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- APPLY UPDATED_AT TRIGGERS
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_modtime BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_modtime BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES: PROFILES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- POLICIES: ADDRESSES
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- POLICIES: NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- POLICIES: SYSTEM SETTINGS
CREATE POLICY "System settings visible to all authenticated" ON public.system_settings FOR SELECT TO authenticated USING (true);
