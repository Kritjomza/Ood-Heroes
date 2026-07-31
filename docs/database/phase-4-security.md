# Phase 4 Database Security

Supabase Auth is the identity source. The game server derives the owner UUID only from
a verified access token; browser-supplied user IDs are ignored. Server-only credentials
never use a `VITE_` name and are not returned in errors or logs.

Row Level Security is enabled on every exposed progression table. Authenticated browser
roles may read their permitted state but cannot grant currency, Heroes, EXP, Shards,
Stars, team slots, rewards, summons, or AFK claims directly. Protected mutation
functions revoke execution from browser roles and are invoked only through the trusted
game server.

Database constraints cover ownership, nonnegative balances, supported enum values,
team uniqueness and positions, and idempotency uniqueness. Cross-user reads and writes,
direct protected mutations, and browser invocation of trusted RPCs are exercised by
the database and integration test suites.
