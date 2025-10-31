-- ============================================
-- Migration: Fix foreign key constraints to reference users table instead of auth.users
-- ============================================
-- This migration updates all foreign keys that referenced auth.users(id)
-- to now reference users(id) for JWT-only authentication
-- Run this in Supabase SQL Editor

-- Drop existing foreign key constraints that reference auth.users
ALTER TABLE bosses DROP CONSTRAINT IF EXISTS bosses_created_by_fkey;
ALTER TABLE spawn_events DROP CONSTRAINT IF EXISTS spawn_events_reported_by_fkey;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
ALTER TABLE guilds DROP CONSTRAINT IF EXISTS guilds_leader_id_fkey;
ALTER TABLE guild_member_contributions DROP CONSTRAINT IF EXISTS guild_member_contributions_member_id_fkey;

-- Recreate foreign keys pointing to users table (not auth.users)
ALTER TABLE bosses 
  ADD CONSTRAINT bosses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE spawn_events 
  ADD CONSTRAINT spawn_events_reported_by_fkey 
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE guilds 
  ADD CONSTRAINT guilds_leader_id_fkey 
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE guild_member_contributions 
  ADD CONSTRAINT guild_member_contributions_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE SET NULL;

