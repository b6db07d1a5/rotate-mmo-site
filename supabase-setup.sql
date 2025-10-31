-- ============================================
-- Supabase Database Setup Script
-- ============================================
-- Run this SQL in the Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)

-- ============================================
-- 1. Enable UUID extension (if not already enabled)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. Create bosses table
-- ============================================
CREATE TABLE IF NOT EXISTS bosses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  location TEXT NOT NULL,
  respawn_time INTEGER NOT NULL, -- in minutes
  last_spawn TIMESTAMPTZ,
  next_spawn TIMESTAMPTZ,
  server TEXT NOT NULL,
  image TEXT,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme', 'legendary')),
  created_by UUID, -- Foreign key will be added after users table is created
  verified BOOLEAN DEFAULT false,
  tags TEXT[],
  drops TEXT[],
  requirements TEXT[]
);

-- ============================================
-- 3. Create spawn_events table
-- ============================================
CREATE TABLE IF NOT EXISTS spawn_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  boss_id UUID NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
  spawn_time TIMESTAMPTZ NOT NULL,
  reported_by UUID, -- Foreign key will be added after users table is created
  verified BOOLEAN DEFAULT false,
  server TEXT NOT NULL,
  notes TEXT,
  coordinates JSONB, -- {x: number, y: number, z?: number}
  participants TEXT[], -- array of member names
  kill_time TIMESTAMPTZ
);

-- ============================================
-- 4. Create users table (extends auth.users)
-- Note: guild foreign key will be added after guilds table is created
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Hashed password with bcrypt
  favorite_bosses UUID[] DEFAULT ARRAY[]::UUID[],
  notification_settings JSONB DEFAULT '{
    "push_notifications": true,
    "notification_timing": [],
    "guild_notifications": false,
    "rare_boss_alerts": false
  }'::jsonb,
  guild UUID, -- Will add foreign key constraint after guilds table is created
  stats JSONB DEFAULT '{
    "reports_count": 0,
    "verified_reports": 0,
    "accuracy_rate": 0,
    "favorite_bosses_count": 0,
    "achievements": []
  }'::jsonb,
  avatar TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ
);

-- Add foreign key constraints for bosses and spawn_events (created before users table)
ALTER TABLE bosses 
  ADD CONSTRAINT bosses_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE spawn_events 
  ADD CONSTRAINT spawn_events_reported_by_fkey 
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- 5. Create comments table
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  boss_id UUID NOT NULL REFERENCES bosses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  replies UUID[] DEFAULT ARRAY[]::UUID[],
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT false
);

-- ============================================
-- 6. Create guilds table
-- ============================================
CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  members UUID[] DEFAULT ARRAY[]::UUID[],
  boss_tracking_enabled BOOLEAN DEFAULT true,
  notification_channel TEXT,
  stats JSONB DEFAULT '{
    "total_members": 0,
    "active_members": 0,
    "boss_kills": 0,
    "accuracy_rate": 0
  }'::jsonb
);

-- Add foreign key constraint for users.guild after guilds table is created
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_guild_fkey;
ALTER TABLE users ADD CONSTRAINT users_guild_fkey 
  FOREIGN KEY (guild) REFERENCES guilds(id) ON DELETE SET NULL;

-- ============================================
-- 7. Create guild_member_contributions table
-- ============================================
CREATE TABLE IF NOT EXISTS guild_member_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created TIMESTAMPTZ DEFAULT NOW(),
  updated TIMESTAMPTZ DEFAULT NOW(),
  guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contribution_score INTEGER DEFAULT 0,
  last_event_date TIMESTAMPTZ,
  UNIQUE(guild_id, member_name) -- Prevent duplicate entries for same member in same guild
);

-- ============================================
-- 8. Create indexes for better performance
-- ============================================

-- Bosses indexes
CREATE INDEX IF NOT EXISTS idx_bosses_server ON bosses(server);
CREATE INDEX IF NOT EXISTS idx_bosses_difficulty ON bosses(difficulty);
CREATE INDEX IF NOT EXISTS idx_bosses_verified ON bosses(verified);
CREATE INDEX IF NOT EXISTS idx_bosses_created_by ON bosses(created_by);
CREATE INDEX IF NOT EXISTS idx_bosses_name ON bosses(name);

-- Spawn events indexes
CREATE INDEX IF NOT EXISTS idx_spawn_events_boss_id ON spawn_events(boss_id);
CREATE INDEX IF NOT EXISTS idx_spawn_events_server ON spawn_events(server);
CREATE INDEX IF NOT EXISTS idx_spawn_events_spawn_time ON spawn_events(spawn_time);
CREATE INDEX IF NOT EXISTS idx_spawn_events_reported_by ON spawn_events(reported_by);
CREATE INDEX IF NOT EXISTS idx_spawn_events_verified ON spawn_events(verified);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_boss_id ON comments(boss_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- Guilds indexes
CREATE INDEX IF NOT EXISTS idx_guilds_leader_id ON guilds(leader_id);
CREATE INDEX IF NOT EXISTS idx_guilds_name ON guilds(name);

-- Guild member contributions indexes
CREATE INDEX IF NOT EXISTS idx_guild_member_contributions_guild_id ON guild_member_contributions(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_member_contributions_member_name ON guild_member_contributions(member_name);
CREATE INDEX IF NOT EXISTS idx_guild_member_contributions_member_id ON guild_member_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_guild_member_contributions_score ON guild_member_contributions(contribution_score DESC);

-- ============================================
-- 9. Create updated timestamp trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_bosses_updated BEFORE UPDATE ON bosses
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER update_spawn_events_updated BEFORE UPDATE ON spawn_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER update_users_updated BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER update_comments_updated BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER update_guilds_updated BEFORE UPDATE ON guilds
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

CREATE TRIGGER update_guild_member_contributions_updated BEFORE UPDATE ON guild_member_contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_column();

-- ============================================
-- 10. Set up Row Level Security (RLS) policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
ALTER TABLE spawn_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_member_contributions ENABLE ROW LEVEL SECURITY;

-- Bosses policies: Everyone can read, authenticated users can write
CREATE POLICY "Bosses are viewable by everyone" ON bosses
  FOR SELECT USING (true);

-- Allow public inserts (API endpoint is protected by JWT authentication middleware)
CREATE POLICY "Allow boss creation via API" ON bosses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own bosses" ON bosses
  FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own bosses" ON bosses
  FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- Spawn events policies
CREATE POLICY "Spawn events are viewable by everyone" ON spawn_events
  FOR SELECT USING (true);

CREATE POLICY "Allow spawn event creation via API" ON spawn_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own spawn events" ON spawn_events
  FOR UPDATE USING (auth.uid() = reported_by OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own spawn events" ON spawn_events
  FOR DELETE USING (auth.uid() = reported_by OR auth.role() = 'service_role');

-- Users policies
-- Allow public SELECT (anyone can view users)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Allow public inserts for user registration
-- (Registration endpoint has rate limiting and validation)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Allow comment creation via API" ON comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Guilds policies
CREATE POLICY "Guilds are viewable by everyone" ON guilds
  FOR SELECT USING (true);

CREATE POLICY "Allow guild creation via API" ON guilds
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guild leaders can update their guilds" ON guilds
  FOR UPDATE USING (auth.uid() = leader_id OR auth.role() = 'service_role');

-- Guild member contributions policies
CREATE POLICY "Contributions are viewable by everyone" ON guild_member_contributions
  FOR SELECT USING (true);

CREATE POLICY "Allow contribution creation via API" ON guild_member_contributions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update contributions" ON guild_member_contributions
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete contributions" ON guild_member_contributions
  FOR DELETE USING (auth.role() = 'service_role');

-- ============================================
-- 11. Create Storage bucket for uploads (if using file storage)
-- ============================================
-- Note: This requires Supabase Storage to be enabled
-- You can create this bucket manually in the Storage section of Supabase dashboard
-- Bucket name: 'uploads'
-- Public: false (or true if you want public access)

-- ============================================
-- Setup Complete!
-- ============================================
-- Next steps:
-- 1. Get your Supabase URL and keys from Settings > API
-- 2. Update your .env file with:
--    - SUPABASE_URL
--    - SUPABASE_SERVICE_ROLE_KEY
--    - SUPABASE_ANON_KEY
-- 3. Run: yarn install
-- 4. Run: yarn dev

