# Production Bootstrap 503 Implementation Plan

> **For agentic workers:** Execute inline with strict red-green TDD and verification before completion.

**Goal:** Make Supabase-authenticated player bootstrap secure, correctly classified, recoverable, observable, and operational against the seeded production database.

**Architecture:** Keep authentication at the middleware boundary and persistence behind `PlayerPersistenceService`. Verify asymmetric Supabase tokens locally against JWKS with issuer, audience, signature, and expiry checks; preserve the Auth `/user` path for local legacy tokens. Make initialization repair incomplete player aggregates through the existing idempotent RPC, classify missing profiles separately from unavailable persistence, and emit structured safe bootstrap diagnostics.

**Tech Stack:** TypeScript, Express, Colyseus, jose, Supabase JS, PostgreSQL, Vitest, Supertest.

## Global Constraints

- Do not expose secrets, tokens, personal data, or sensitive Supabase responses.
- Do not weaken signature, issuer, audience, or expiry validation.
- Preserve local Supabase, Google OAuth, guest/email login, and the public API contract where possible.
- Do not reset/delete production data or run Git commands.

---

### Task 1: JWT verification and HTTP authentication mapping

**Files:**
- Modify: `apps/game-server/src/auth/SupabaseAuthVerifier.ts`
- Modify: `apps/game-server/tests/authVerifier.test.ts`
- Modify: `apps/game-server/tests/playerRoutes.test.ts`

- [ ] Add ES256 tests using a real generated EC key and controlled JWKS response for valid, invalid-signature, wrong-issuer, wrong-audience, and expired tokens.
- [ ] Run the focused tests and confirm the new cases fail for the intended missing checks/test seam.
- [ ] Restrict asymmetric verification to supported Supabase algorithms, require issuer and `authenticated` audience, and retain the Auth user endpoint for legacy/local tokens.
- [ ] Verify missing/invalid/expired authentication remains 401 and never reaches persistence.

### Task 2: Bootstrap recovery, status mapping, and safe diagnostics

**Files:**
- Modify: `apps/game-server/src/persistence/SupabasePersistenceService.ts`
- Modify: `apps/game-server/src/api/playerRoutes.ts`
- Modify: `apps/game-server/src/api/domainErrors.ts`
- Modify: `apps/game-server/tests/playerRoutes.test.ts`
- Modify: `apps/game-server/tests/databaseIntegration.test.ts`

- [ ] Add failing tests for first initialization, repeat idempotency, partial-state repair, missing-profile status mapping, database failure status mapping, and sanitized request-ID/stage/error-code logging.
- [ ] Make a null `get_player_bootstrap` result map to `PROFILE_NOT_FOUND` rather than a 503 contract failure.
- [ ] Add structured safe logging at the route boundary without logging tokens, user identifiers, keys, or response bodies.
- [ ] Confirm initialization uses the existing idempotent RPC to fill missing player aggregate rows.

### Task 3: Production metadata and seed repair

**Files:**
- Reuse without editing: `supabase/seed.sql`

- [ ] Verify tables, private objects, functions, grants, triggers, RLS, aggregate player-state completeness, and seed counts with read-only SQL.
- [ ] Apply the existing idempotent seed upserts only; do not delete or reset data.
- [ ] Re-query exact aggregate counts: 6 heroes, 1 banner, 6 pool entries.

### Task 4: Verification

- [ ] Run all new focused tests.
- [ ] Run `npm run build:server`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test:auth`.
- [ ] Run `npm run test:persistence`.
- [ ] Run `npm run test:database`.
- [ ] Perform read-only production health/bootstrap checks and report any access limitation accurately.
