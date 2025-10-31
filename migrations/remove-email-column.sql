-- ============================================
-- Migration: Remove email column from users table
-- ============================================
-- This migration removes the email column from the users table
-- Email is now only stored in Supabase Auth (required for authentication)
-- 
-- Run this in Supabase SQL Editor if you already have existing data

-- Remove email column from users table
ALTER TABLE users DROP COLUMN IF EXISTS email;

-- Remove unique constraint on email if it exists
-- (This might fail if the constraint doesn't exist, that's okay)
DO $$ 
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

