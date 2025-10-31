-- ============================================
-- Migration: Add password column to users table
-- ============================================
-- This migration adds a password column to the users table for JWT-only authentication
-- Run this in Supabase SQL Editor if you already have existing data

-- Add password column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Update users table to remove foreign key to auth.users (no longer needed)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Change id column to auto-generate UUIDs (no longer references auth.users)
-- First, we need to check if there are existing users
-- If users exist, you may need to generate new IDs or keep existing ones

-- Make password required for new users (existing users can have NULL temporarily)
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Note: If you have existing users, you'll need to either:
-- 1. Set a default password for existing users, OR
-- 2. Allow NULL temporarily and require password reset

