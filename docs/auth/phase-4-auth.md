# Phase 4 Authentication

The browser uses Supabase Auth for anonymous and email/password sessions. It sends only the access token to the game server. The game server verifies the token through JWKS when possible and the supported Supabase Auth `/user` endpoint for local/shared-secret projects. The verified `sub` is the only player ID.

Anonymous accounts can attach email/password credentials with `updateUser`; the Auth user ID does not change, so every gameplay foreign key remains intact. Sign-out leaves combat, clears protected client state, and then removes the local session.

Required browser variables are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Required server-only variables are `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`. Never prefix the secret key with `VITE_`.

Hosted projects may require email confirmation. Local configuration disables confirmation for deterministic development.
