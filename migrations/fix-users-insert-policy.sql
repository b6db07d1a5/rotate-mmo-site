-- ============================================
-- Migration: Fix users table INSERT policy for JWT-only authentication
-- ============================================
-- This migration allows public inserts for user registration
-- (Registration endpoint should be publicly accessible)
-- Run this in Supabase SQL Editor

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Allow public inserts for user registration (common pattern for signup endpoints)
-- The registration endpoint itself should have rate limiting and validation
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Note: With service_role key, RLS should be bypassed automatically
-- But if still getting errors, this policy allows public inserts
-- You can add additional validation here if needed, e.g.:
-- WITH CHECK (username IS NOT NULL AND password IS NOT NULL)

