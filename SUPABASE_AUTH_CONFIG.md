# Supabase Auth Configuration for Email-Free Login

Since we're using internal emails (`@noreply.internal`) that Supabase may block, you need to configure Supabase Auth settings:

## Solution 1: Disable Email Domain Restrictions (Recommended for Development)

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **"Email Auth"** section
3. Find **"Email Domain Restrictions"** or **"Blocked Email Domains"**
4. Either:
   - **Disable domain restrictions** entirely, OR
   - **Add `noreply.internal` to the allowed list**

## Solution 2: Use a Different Internal Email Domain

If Supabase continues to block `@noreply.internal`, we can change to a domain that Supabase accepts. Common options:
- Use your Supabase project subdomain: `@your-project-id.supabase.co`
- Use a local domain: `@localhost.local`
- Use a generic internal domain: `@internal.local`

## How to Update the Email Domain

If you need to change the email domain, update the domain in `src/models/SupabaseClient.ts`:

```typescript
// In the register() method, change:
const internalEmail = `${cleanUsername}_${uuid.replace(/-/g, '').substring(0, 24)}@noreply.internal`;
// To:
const internalEmail = `${cleanUsername}_${uuid.replace(/-/g, '').substring(0, 24)}@your-domain.local`;
```

## Current Implementation

- ✅ Email is **NOT stored** in the `users` table
- ✅ Email is **ONLY stored** in Supabase Auth (required by Supabase)
- ✅ Email is **NEVER exposed** to users in API responses
- ✅ Login uses **username + password** only (email retrieved internally)

## Troubleshooting

### Error: "User not allowed"
- **Cause**: Supabase is blocking the email domain
- **Solution**: Configure Supabase Auth to allow the domain (see Solution 1)

### Error: "Authentication failed"
- **Cause**: Wrong password or user doesn't exist
- **Solution**: Check username and password are correct

### Error: "User account error: authentication failed"
- **Cause**: Email not found in Supabase Auth metadata
- **Solution**: User might not have been created properly, try registering again

