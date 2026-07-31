# Phase 4 Database

Migrations in `supabase/migrations` create schema version 1, six seeded Hero definitions, the Standard Banner, profiles, currencies, owned Heroes, active teams, summon state/history, reward ledger, and AFK state/claims.

Every exposed table has RLS enabled. Browser roles receive only explicit own-row or public-definition reads. Protected DML and gameplay RPC execution are revoked from `anon` and `authenticated`; only `service_role` can execute mutation functions.

Atomic functions lock balances/state before mutation. UUID keys make Summon, Star, Team, slot unlock, and AFK claim retries replay-safe. Combat uses `(user_id, reward_identity)` as its natural exactly-once key.

AFK preparation uses `clock_timestamp()`, counts complete 30-minute intervals, caps rewards at 16 intervals, and advances the cursor only through the last complete interval so the partial remainder survives.

Commands:

```text
npm run supabase:start
npm run db:reset
npm run db:lint
npm run db:test
npm run db:types
```
