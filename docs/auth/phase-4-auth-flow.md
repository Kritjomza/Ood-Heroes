# Phase 4 Authentication Flow

The client creates one persistent Supabase browser client and disposes its single auth-state subscription on unmount. Guest, email/password, and Google users all receive standard Supabase sessions. Only the Supabase access token is sent to the protected game API and Colyseus; JWT subject remains the player UUID.

Google sign-in redirects to `/auth/callback`. The callback restores the session, validates it with `getUser`, then the shell loads or idempotently initializes progression. Returning users never run a destructive reset.

Guest protection calls `linkIdentity`, never ordinary OAuth sign-in, and redirects to `/auth/link-callback`. A five-minute session-storage intent records only the original UUID. The callback requires the same UUID, `is_anonymous === false`, and a Google identity, refreshes the session, upgrades account kind through the trusted profile API, and reloads bootstrap. Conflicts never trigger application account merging.

Email/password creation, sign-in, and in-place Guest protection remain available for compatibility and recovery. Signing out clears protected client state through the auth listener. Provider metadata is presentation-only and never determines authorization.
