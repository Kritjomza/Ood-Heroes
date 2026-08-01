# Google OAuth Setup

Odd Tower requests only `openid`, `email`, and `profile`. Google provider tokens are never sent to the game server or stored by the application.

## Local Supabase setup

1. In Google Cloud, create a **Web application** OAuth client. Set Authorized JavaScript Origin to `http://127.0.0.1:4173` and Authorized Redirect URI to `http://127.0.0.1:54321/auth/v1/callback`.
2. Copy `.env.example` to the repository-root `.env.local` and set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`. Project scripts explicitly load this file for Vite, the game server, Supabase CLI, and database integration tests; neither secret may have a `VITE_` prefix.
3. `supabase/config.toml` enables `[auth.external.google]`, environment-backed credentials, nonce checking, manual identity linking, and both app redirects.
4. Run `npm run supabase:stop`, `npm run supabase:start`, then `npm run supabase:status`.

The two callback layers are different:

- Google → Supabase Auth: `http://127.0.0.1:54321/auth/v1/callback`
- Supabase Auth → Odd Tower: `http://127.0.0.1:4173/auth/callback` or `http://127.0.0.1:4173/auth/link-callback`

The Authorized JavaScript Origin contains no path. Supabase Site URL is `http://127.0.0.1:4173`; its Redirect URL allow list contains both Odd Tower callback URLs.

## Hosted Supabase production setup

Do this manually in the target project:

1. Dashboard → Authentication → Providers → Google: enable Google and paste the Web client ID and secret.
2. Copy the displayed hosted callback (normally `https://<PROJECT_REF>.supabase.co/auth/v1/callback`) into Google Cloud as an Authorized Redirect URI.
3. Dashboard → Authentication → Settings: enable **Manual Identity Linking**.
4. Dashboard → Authentication → URL Configuration: set Site URL to `https://<YOUR_GAME_DOMAIN>` and add `https://<YOUR_GAME_DOMAIN>/auth/callback` plus `https://<YOUR_GAME_DOMAIN>/auth/link-callback` to Redirect URLs.
5. Set browser-safe deployment variables `VITE_APP_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`. Keep `SUPABASE_SECRET_KEY` and the Google secret server-only.

Production must use HTTPS. Rebuild the frontend after changing `VITE_` values and restart the server after server-only values change. Do not invent or add account-merging code: Supabase's verified-email/identity behavior remains authoritative, and unsafe link conflicts are recoverable errors.
