# Supabase Setup Guide

This guide will help you set up your Supabase database before starting the project.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Project Name**: `rotate-mmo-site` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_ANON_KEY`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 3. Run the Database Setup SQL

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify that all tables were created successfully (check the Messages tab)

### 4. Create Storage Bucket (Optional - for file uploads)

If you plan to use file uploads (boss images, etc.):

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `uploads`
4. Choose **Private** or **Public** (based on your needs)
5. Click **Create bucket**

### 5. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 6. Configure Supabase Auth Settings

To allow user registration, you may need to adjust Supabase Auth settings:

1. Go to your Supabase Dashboard → **Authentication** → **Settings**

2. **Email Auth Settings**:
   - **Enable email confirmations**: 
     - For development/testing: Set to **OFF** (allows immediate login without email verification)
     - For production: Set to **ON** (requires email verification)
   - **Email templates**: Customize if needed

3. **Email Domain Restrictions** (Optional):
   - By default, Supabase may block certain test domains like `example.com`
   - For testing: Use real email addresses (Gmail, etc.) or disable domain restrictions
   - You can add specific domains to an allowlist in Auth settings

4. **Rate Limiting**: Adjust if needed for development

### 7. Test the Connection

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Start the development server:
   ```bash
   yarn dev
   ```

3. Check the console for any connection errors

**Important - Email Requirements**:
- Supabase Auth **requires** an email address for user registration
- Even with Admin API, Supabase may block temporary/test email domains like `@temp.local`, `@example.com`, etc.
- **Recommended**: Always provide a real email address when registering users
- **Alternative**: If you need to allow users without email, you'll need to:
  1. Configure Supabase Auth to allow specific domains in Auth settings
  2. Or use a temporary email service that Supabase accepts (like `10minutemail.com`)

**Note**: If you're getting "User not allowed" or "Email address is invalid" errors:
- This means Supabase is blocking the email domain
- **Solution**: Provide a real email address (Gmail, Outlook, etc.)
- The Admin API still validates email domains for security reasons
- Check Supabase Dashboard → Authentication → Settings → Email Auth for domain restrictions

## Database Tables Created

The setup script creates the following tables:

1. **bosses** - Stores boss information
2. **spawn_events** - Tracks boss spawn events
3. **users** - User profiles (extends Supabase Auth)
4. **comments** - Comments on bosses
5. **guilds** - Guild information
6. **guild_member_contributions** - Tracks member contributions

## Row Level Security (RLS)

RLS policies have been set up to:
- Allow public read access to most data
- Require authentication for creating/updating records
- Allow users to manage their own records
- Use service role for administrative operations

## Important Notes

1. **Service Role Key**: This key bypasses RLS. Keep it secret and never expose it in client-side code!

2. **UUID Extension**: The script enables the UUID extension if it's not already enabled.

3. **Foreign Keys**: Tables are linked with foreign key constraints for data integrity.

4. **Indexes**: Performance indexes have been created on commonly queried fields.

5. **Triggers**: Automatic `updated` timestamp triggers are set up on all tables.

## Troubleshooting

### Issue: "relation already exists"
- Some tables might already exist if you've run the script before
- You can drop and recreate, or modify the script to use `CREATE TABLE IF NOT EXISTS`

### Issue: "permission denied"
- Make sure you're running the SQL as the project owner
- Check that you have the correct permissions in Supabase

### Issue: "foreign key constraint fails"
- Make sure to run the SQL script in order
- If guilds table has issues, note that users table references guilds, so guilds must be created first

### Issue: Connection errors in app
- Verify your `.env` file has correct credentials
- Check that your Supabase project is active (not paused)
- Ensure network connectivity to Supabase

## Next Steps

After completing the setup:

1. ✅ Verify all tables are created (check in Supabase Table Editor)
2. ✅ Test creating a user via the API
3. ✅ Test creating a boss record
4. ✅ Verify indexes are created (check in Supabase Database → Indexes)

Your database is now ready to use!

