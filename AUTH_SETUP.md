# Authentication Setup Guide

This application uses NextAuth.js with Google and Facebook OAuth for admin authentication.

## Setup Instructions

### 1. Configure Admin Emails

Edit the `.env` file and add your admin email addresses:

```env
ADMIN_EMAILS="your-email@gmail.com,another-admin@example.com"
```

Only users with these email addresses will be able to sign in and access admin pages.

### 2. Google OAuth Setup

The Google OAuth credentials are already configured. If you need to update them:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Update `.env` with your credentials:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 3. Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook` (development)
   - `https://yourdomain.com/api/auth/callback/facebook` (production)
5. Update `.env` with your credentials:
   ```env
   FACEBOOK_CLIENT_ID="your-app-id"
   FACEBOOK_CLIENT_SECRET="your-app-secret"
   ```

### 4. NextAuth Secret

The `NEXTAUTH_SECRET` is already configured. To generate a new one:

```bash
openssl rand -base64 32
```

Then update `.env`:
```env
NEXTAUTH_SECRET="your-generated-secret"
```

### 5. Protected Routes

The following routes are automatically protected and require admin authentication:

- `/admin/*` - Global admin pages
- `/t/[tournamentId]/admin/*` - Tournament-specific admin pages

This includes:
- Settings page
- Score entry page
- Scorecard management
- Any future admin features

### 6. Testing Authentication

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to any admin page (e.g., `/t/your-tournament/admin/settings`)

3. You'll be redirected to the sign-in page

4. Sign in with Google or Facebook using an email from `ADMIN_EMAILS`

5. If successful, you'll be redirected back to the admin page

6. If your email is not in the allowlist, you'll see an access denied error

### 7. Sign Out

Click the "Sign Out" button in the navigation bar to end your session.

## Security Notes

- Never commit `.env` file to version control
- Keep your OAuth secrets secure
- Regularly rotate your `NEXTAUTH_SECRET`
- Only add trusted email addresses to `ADMIN_EMAILS`
- Use HTTPS in production

## Troubleshooting

**Issue**: "Access Denied" after signing in
- **Solution**: Verify your email is in the `ADMIN_EMAILS` list in `.env`

**Issue**: OAuth errors
- **Solution**: Check that redirect URIs are correctly configured in Google/Facebook console

**Issue**: Session not persisting
- **Solution**: Ensure `NEXTAUTH_SECRET` is set and database is accessible
