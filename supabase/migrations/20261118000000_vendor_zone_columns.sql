-- Migration: Add canonical Zone ID and Zone Name columns to public.vendor_profiles
-- Preserves existing schema, constraints, and Row Level Security (RLS) policies.

ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS zone_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS zone_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_zone_id
  ON public.vendor_profiles (zone_id);
