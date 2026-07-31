# Google OAuth Manual Checklist

## Google Cloud

- [ ] Select or create Google Cloud project `<GOOGLE_CLOUD_PROJECT_NAME>`.
- [ ] Configure OAuth consent/branding and choose the intended Internal or External audience.
- [ ] Configure only `openid`, `email`, and `profile` scopes.
- [ ] Create OAuth Client type **Web application**.
- [ ] Add Authorized JavaScript Origin `http://127.0.0.1:4173`.
- [ ] Add production origin `https://<YOUR_GAME_DOMAIN>`.
- [ ] Add Authorized Redirect URI `http://127.0.0.1:54321/auth/v1/callback`.
- [ ] Add `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
- [ ] Copy the Client ID and Client Secret into the appropriate Supabase configuration. Never send the secret in chat.

## Local Supabase

- [ ] Put `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in `.env.local`.
- [ ] Confirm `[auth.external.google]` is enabled in `supabase/config.toml`.
- [ ] Confirm `auth.enable_manual_linking = true`.
- [ ] Run `npm run supabase:stop` and `npm run supabase:start`.
- [ ] Run `npm run supabase:status` and open the local Studio Authentication provider settings to verify Google is enabled.

## Hosted Supabase and production

- [ ] Authentication → Providers → Google: enable and paste credentials.
- [ ] Authentication → Settings: enable Manual Identity Linking.
- [ ] Authentication → URL Configuration: Site URL `https://<YOUR_GAME_DOMAIN>`.
- [ ] Add Redirect URLs `https://<YOUR_GAME_DOMAIN>/auth/callback` and `https://<YOUR_GAME_DOMAIN>/auth/link-callback`.
- [ ] Deploy `VITE_APP_BASE_URL=https://<YOUR_GAME_DOMAIN>` and hosted Supabase browser-safe values, rebuild, and redeploy.
- [ ] Keep all secrets out of Vite variables and restart the game server after server-only configuration changes.

## Real-provider verification

- [ ] New Google account reaches Home; reload has one profile, one Starter Hero, and one starter-currency grant.
- [ ] Returning Google account retains Heroes, currencies, Team, pity, rewards, and AFK state.
- [ ] Guest protection retains the exact Auth UUID and progression, then shows Permanent / Google connected.
- [ ] Sign out and sign in again; verify another browser/device.
- [ ] Cancel consent and confirm a recoverable message with no stale loading state.
- [ ] Try a Google identity linked elsewhere; confirm no merge and unchanged Guest progress.
- [ ] Verify the production redirect and authenticated room join/reconnect.
