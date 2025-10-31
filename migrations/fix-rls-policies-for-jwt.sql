-- ============================================
-- Migration: Fix RLS policies for JWT-only authentication
-- ============================================
-- This migration updates all RLS policies to allow service_role
-- (Since we're using JWT-only auth, service_role is used by the backend API)
-- Run this in Supabase SQL Editor

-- Bosses: Allow public inserts (API endpoint is protected by JWT authentication)
DROP POLICY IF EXISTS "Authenticated users can create bosses" ON bosses;
DROP POLICY IF EXISTS "Allow boss creation via API" ON bosses;
CREATE POLICY "Allow boss creation via API" ON bosses
  FOR INSERT WITH CHECK (true);

-- Spawn Events: Allow public inserts (API endpoint is protected by JWT)
DROP POLICY IF EXISTS "Authenticated users can create spawn events" ON spawn_events;
DROP POLICY IF EXISTS "Allow spawn event creation via API" ON spawn_events;
CREATE POLICY "Allow spawn event creation via API" ON spawn_events
  FOR INSERT WITH CHECK (true);

-- Comments: Allow public inserts (API endpoint is protected by JWT)
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Allow comment creation via API" ON comments;
CREATE POLICY "Allow comment creation via API" ON comments
  FOR INSERT WITH CHECK (true);

-- Guilds: Allow public inserts (API endpoint is protected by JWT)
DROP POLICY IF EXISTS "Authenticated users can create guilds" ON guilds;
DROP POLICY IF EXISTS "Allow guild creation via API" ON guilds;
CREATE POLICY "Allow guild creation via API" ON guilds
  FOR INSERT WITH CHECK (true);

-- Guild Member Contributions: Allow public inserts (API endpoint is protected by JWT)
DROP POLICY IF EXISTS "Authenticated users can create contributions" ON guild_member_contributions;
DROP POLICY IF EXISTS "Allow contribution creation via API" ON guild_member_contributions;
CREATE POLICY "Allow contribution creation via API" ON guild_member_contributions
  FOR INSERT WITH CHECK (true);

