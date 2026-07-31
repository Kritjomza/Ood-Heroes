# Google OAuth Authentication Upgrade Plan

## Existing Auth architecture

The React client owns one browser Supabase client and one `onAuthStateChange` subscription. `PersistentShell` restores the session, sends only the Supabase access token to the protected game API, loads an existing bootstrap, and calls the idempotent `initialize_player_account` RPC only when no profile exists. PostgreSQL uniqueness constraints and transactional starter-ledger logic protect initialization. The server derives ownership solely from the verified JWT subject and maps `is_anonymous` to `guest` or `permanent`.

## Architecture and compatibility decisions

- Add a focused OAuth coordinator that validates the configured application base URL, creates `/auth/callback` and `/auth/link-callback` redirects, prevents concurrent operations, and stores only a short-lived link intent (original user UUID and expiry; never tokens).
- Keep Guest and email/password flows. Google is the primary permanent action.
- Ordinary Google sign-in uses `signInWithOAuth`; Guest protection exclusively uses `linkIdentity`.
- Callback processing calls `getSession`, then `getUser`, verifies link invariants, refreshes the session, and invokes the trusted profile-update API. Application code never merges accounts.
- The existing bootstrap RPC remains the only initialization path. Its conflict-safe inserts and starter ledger prevent duplicate profiles, heroes, currencies, teams, pity, and AFK state.
- Account kind upgrades remain idempotent through `update_player_profile`; permanent accounts cannot be downgraded.

## Implementation tasks

1. Add unit tests for base URL validation, redirect construction, state transitions, double submission, intent expiry/cleanup, sign-in SDK calls, linking SDK calls, callback errors, missing sessions, and unchanged Guest UUID verification.
2. Implement the OAuth coordinator and safe error-copy mapping.
3. Add a reload-safe callback screen and route selection without introducing a router dependency.
4. Update Auth and Account screens, including provider/email display, accessible loading states, Google-first hierarchy, and preserved email/password compatibility.
5. Refresh the trusted game API bootstrap after linking and upgrade account kind through the existing protected profile route.
6. Add Google-shaped Supabase JWT tests and persistence route tests proving provider metadata does not alter JWT subject ownership or duplicate initialization.
7. Configure local Google provider and redirect allow-list with environment substitution; replace credentials in `.env.example` with placeholders.
8. Extend secret scanning for Google secrets/provider tokens and inspect the production bundle.
9. Document local/hosted Google and Supabase configuration, callbacks, manual identity linking, real-provider checks, rollback compatibility, and recovery errors.
10. Run formatting, lint, typecheck, unit/integration/E2E suites, build, secret scan, production audit, and available local Supabase checks. Record external-configuration limitations accurately.

## Error handling

OAuth URL errors map to `OAUTH_CANCELLED`, `OAUTH_PROVIDER_ERROR`, or `OAUTH_CALLBACK_INVALID`. Missing or invalid restored sessions map to `AUTH_SESSION_MISSING`. Link conflicts map to `GOOGLE_IDENTITY_ALREADY_LINKED` or `GOOGLE_IDENTITY_LINK_CONFLICT`. Bootstrap failures map to `PROFILE_BOOTSTRAP_FAILED`. UI copy is safe and never renders raw callback parameters.

## Configuration and rollback

Local Google-to-Supabase callback: `http://127.0.0.1:54321/auth/v1/callback`. Local app callbacks: `http://127.0.0.1:4173/auth/callback` and `/auth/link-callback`. Hosted values remain placeholders. Disabling the Google provider and removing its two UI actions rolls back OAuth without affecting Guest, email/password, profiles, database schema, JWT verification, or progression.

## Verification strategy

Deterministic tests use injected Supabase-auth adapters and browser storage. Real Google consent remains a documented manual test because no provider credentials or controlled Google account are assumed. No Google token is requested, stored, logged, or sent to the game server.
