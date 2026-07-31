# Odd Tower Phase 4 Persistent Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for inline execution or `superpowers:subagent-driven-development` if the user explicitly selects delegated execution. Do not use Git. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the temporary online combat sandbox into an authenticated, server-authoritative persistent MVP with six collectible heroes, summoning, teams, exactly-once combat rewards, trusted-time AFK rewards, replaceable mock assets, and complete security/performance evidence.

**Architecture:** Supabase Auth establishes identity and PostgreSQL functions enforce atomic gameplay mutations behind RLS. Pure shared packages own deterministic rules and transport contracts; the Node/Colyseus server verifies JWTs, owns persistence APIs and a bounded reward queue, and injects saved teams into the existing 20 Hz combat simulation. React owns an event-driven responsive screen stack, Phaser remains the combat renderer, and all visual locations resolve through an Asset Registry.

**Tech Stack:** Node.js 22.12+, npm workspaces, strict TypeScript 5.9, React 19.2, Phaser 3.90, Vite 8.1, Colyseus 0.17, Supabase CLI 2.110, `@supabase/supabase-js` 2.111, `jose` 6.2, PostgreSQL, Vitest 3.2, pgTAP/Supabase database tests, Testing Library, Playwright 1.55.

## Global Constraints

- Never execute a Git command; modify only the current workspace and track files through notes.
- Preserve the independently playable Local Prototype and every Phase 1–3.5 regression.
- Supabase Auth and PostgreSQL are required; Local Storage, mocks, or an in-memory service cannot replace production persistence.
- The verified JWT subject is the only persistent identity; never trust a client user ID, display name, hero, reward, currency, or random result.
- No browser-visible secret or service-role key; secret values never use a `VITE_` prefix.
- All protected gameplay mutations execute through trusted server code and atomic database functions.
- RLS is enabled on every exposed table; direct client mutation of protected gameplay state is denied.
- Combat remains server-authoritative at a nominal 20 Hz and must sustain at least 19 Hz under the required persistent load.
- Combat ticks never await database I/O; reward persistence uses a bounded asynchronous queue.
- Mutation retries preserve their original idempotency key or reward identity.
- No unbounded queue, retry loop, listener, history fetch, metric window, or per-frame React update.
- UI uses safe-area-aware responsive layout, minimum 48 px touch targets, visible focus, accessible labels, Thai-compatible fallbacks, and reduced-motion behavior.
- Use programmatic mock assets only; do not add final AI-generated or downloaded artwork.
- Do not add any Phase 5 system listed in the approved brief.
- Test controls require `ODD_TOWER_TEST_MODE=1` and are inert otherwise.
- Record actual verification evidence; an unexecuted or blocked check is not passed.

## File Structure

### Root and Supabase

- Modify `package.json`, `package-lock.json`, `.env.example`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `README.md`.
- Create `supabase/config.toml`, `supabase/seed.sql`.
- Create `supabase/migrations/202607300001_phase4_schema.sql` for extensions, schema-version table, enums/checks, gameplay tables, constraints, and base indexes.
- Create `supabase/migrations/202607300002_phase4_security.sql` for RLS, read policies, privilege revocation, and helper security functions.
- Create `supabase/migrations/202607300003_phase4_transactions.sql` for initialization, Summon, Star, Team, combat reward, and AFK functions.
- Create `supabase/migrations/202607300004_phase4_grants.sql` for explicit function ownership/execution grants and final hardening.
- Create `supabase/tests/001_schema.test.sql`, `002_rls.test.sql`, `003_transactions.test.sql`, and `004_security.test.sql`.

### Shared packages

- Create `packages/game-core/src/progression.ts`, `hero-definitions.ts`, `persistent-rules.ts`.
- Create `packages/game-core/tests/progression-phase4.test.ts`, `persistent-rules.test.ts`.
- Modify `packages/game-core/src/index.ts`, `types.ts`, `rules.ts` only where shared Phase 4 exports or compatible cumulative EXP behavior require it.
- Create `packages/network-protocol/src/persistence-types.ts`, `persistence-validation.ts`, `persistence-config.ts`.
- Create `packages/network-protocol/tests/persistence-validation.test.ts`.
- Modify `packages/network-protocol/src/index.ts`, `types.ts`, `validation.ts`, `config.ts` for protocol v4 authenticated join and persistence events.

### Server

- Create `apps/game-server/src/auth/AuthVerifier.ts`, `SupabaseAuthVerifier.ts`, `authMiddleware.ts`, `ActiveUserRegistry.ts`.
- Create `apps/game-server/src/api/domainErrors.ts`, `requestContext.ts`, `apiRateLimiter.ts`, `playerRoutes.ts`.
- Create `apps/game-server/src/persistence/persistence-types.ts`, `PersistenceService.ts`, `SupabasePersistenceService.ts`, `InMemoryPersistenceService.ts`, `PersistenceQueue.ts`, `PersistenceHealth.ts`, `PersistenceMetrics.ts`.
- Create `apps/game-server/tests/authVerifier.test.ts`, `activeUserRegistry.test.ts`, `playerRoutes.test.ts`, `persistenceService.test.ts`, `persistenceQueue.test.ts`, `persistenceHealth.test.ts`, `databaseIntegration.test.ts`, `securityIntegration.test.ts`.
- Modify `apps/game-server/src/config.ts`, `app.ts`, `index.ts`, `rooms/FloorOneRoom.ts`, `simulation/CombatSimulation.ts`, `schema/RoomState.ts`, and the server workspace manifest.

### Client

- Create `apps/client/src/persistence/auth-client.ts`, `game-api-client.ts`, `player-store.ts`, `player-types.ts`, `auth-state.ts`, `persistence-errors.ts`, `idempotency.ts`.
- Create `apps/client/src/assets/asset-types.ts`, `asset-registry.ts`, `asset-resolver.ts`, `manifests/phase-4-assets.ts`, and mock renderer modules under `assets/mock/`.
- Create persistent UI modules under `apps/client/src/ui/persistent/`: `PersistentShell.tsx`, `AuthScreen.tsx`, `HomeScreen.tsx`, `CollectionScreen.tsx`, `HeroDetailScreen.tsx`, `SummonScreen.tsx`, `TeamBuilderScreen.tsx`, `AfkRewardModal.tsx`, `AccountScreen.tsx`, `PersistenceStatus.tsx`, `HeroMock.tsx`, `copy.ts`, `tokens.css`.
- Create `apps/client/tests/authState.test.ts`, `playerStore.test.ts`, `gameApiClient.test.ts`, `AssetRegistry.test.ts`, `PersistentUi.test.tsx`.
- Modify `apps/client/src/App.tsx`, `styles.css`, `game/multiplayer/MultiplayerClient.ts`, `MultiplayerBridge.ts`, `game/scenes/MultiplayerScene.ts`, and the client workspace manifest.

### Tools, E2E, load, assets, and docs

- Create `tests/helpers/supabaseTestUsers.ts`, `persistentTestServer.ts`, `testClock.ts`.
- Create `tests/e2e/auth.spec.ts`, `persistence.spec.ts`, `assets.spec.ts`, `restart.spec.ts`.
- Create `tests/load/ten-player-persistent-combat.ts`.
- Create `tools/validate-phase4-assets.ts`, `tools/capture-phase4-screenshots.ts`, `tools/scan-client-secrets.ts`.
- Create every document listed in the approved brief under `docs/auth/`, `docs/database/`, `docs/assets/`, plus `docs/phase-4-handoff.md`.

---

### Task 1: Toolchain, Environment, and Shared Persistence Contract

**Files:**

- Modify: `package.json`, `package-lock.json`, `.env.example`, `tsconfig.json`, `packages/network-protocol/src/config.ts`, `packages/network-protocol/src/index.ts`
- Create: `packages/network-protocol/src/persistence-types.ts`, `persistence-config.ts`, `persistence-validation.ts`
- Test: `packages/network-protocol/tests/persistence-validation.test.ts`

**Interfaces:**

- Produces `DATA_SCHEMA_VERSION = 1`, protocol version 4, `DomainErrorCode`, `PlayerBootstrap`, mutation request/result DTOs, `AuthenticatedJoinOptions`, and non-throwing runtime validators.
- All server/client tasks consume these exact shared contracts.

- [ ] **Step 1: Add dependencies and root capabilities**

Add exact compatible dependencies: `@supabase/supabase-js@2.111.0` to client/server runtime, `jose@6.2.5` to server runtime, and `supabase@2.110.0` to root development dependencies. Add the required `supabase:*`, `db:*`, `test:*`, `assets:*`, and secret-scan scripts without removing existing scripts.

- [ ] **Step 2: Write failing protocol tests**

Cover all required error codes, positive bootstrap parsing, rejection of missing schema versions, malformed currency/hero/team values, invalid UUID idempotency keys, and authenticated join rejection when access token or protocol version is absent.

```ts
expect(validateAuthenticatedJoinOptions({ accessToken: '', protocolVersion: 4 })).toEqual({
  ok: false,
  code: 'AUTH_REQUIRED',
});
expect(validateMutationEnvelope({ idempotencyKey: 'not-a-uuid', payload: {} }).ok).toBe(false);
```

- [ ] **Step 3: Run the focused test and confirm RED**

Run: `npx vitest run packages/network-protocol/tests/persistence-validation.test.ts`  
Expected: failure because Phase 4 modules/exports do not exist.

- [ ] **Step 4: Implement the shared contract**

Use explicit records rather than `unknown` blobs. Define `CurrencyCode = 'gold' | 'gem' | 'upgrade_jelly'`, all 26 required domain errors, the six roles/four rarities, versioned bootstrap data, bounded Summon history response, and persistence statuses `healthy | degraded | unavailable`.

- [ ] **Step 5: Verify the contract**

Run the focused test, `npm run typecheck`, and `npm run format:check`; all must pass.

### Task 2: Deterministic Hero, Summon, Team, and AFK Rules

**Files:**

- Create: `packages/game-core/src/progression.ts`, `hero-definitions.ts`, `persistent-rules.ts`
- Modify: `packages/game-core/src/index.ts`, `types.ts`, `rules.ts`
- Test: `packages/game-core/tests/progression-phase4.test.ts`, `persistent-rules.test.ts`

**Interfaces:**

- Produces `levelFromTotalExperience(total: number): number`, `totalExperienceCap(): number`, `effectiveHeroStats(definition, totalExperience, stars)`, `starUpgradeCost(stars)`, `teamSlotEligibility(input)`, `advancePity(rarity)`, and `calculateAfkIntervals(input)`.

- [ ] **Step 1: Write failing progression/stat tests**

Test levels 1–20, exact cumulative boundaries, negative/unsafe integer rejection, Level-20 clamping, `Math.round` stat growth, and Star multipliers 1.00 through 1.32.

- [ ] **Step 2: Write failing economy/rule tests**

Test six definitions, starter eligibility, integer weights `2750/2750/1500/1500/1200/300`, pity at pull 20, duplicate Shards `10/15/30/60`, Star costs `20/50/100/200`, Slot 2/3 requirements, and AFK values at 29/30/59/60/480/>480 minutes.

- [ ] **Step 3: Confirm RED**

Run: `npx vitest run packages/game-core/tests/progression-phase4.test.ts packages/game-core/tests/persistent-rules.test.ts`.

- [ ] **Step 4: Implement minimal pure rules**

Hero definitions use the six required IDs and data-driven base stats. `calculateAfkIntervals` accepts trusted epoch milliseconds, returns complete intervals capped at 16 plus the remainder cursor, and never reads the ambient clock.

- [ ] **Step 5: Verify rules and regressions**

Run focused tests followed by `npx vitest run packages/game-core` and `npm run typecheck`.

### Task 3: Local Supabase Schema, Seed, Indexes, and RLS

**Files:**

- Create: `supabase/config.toml`, `seed.sql`, migrations `202607300001_phase4_schema.sql`, `202607300002_phase4_security.sql`
- Create tests: `supabase/tests/001_schema.test.sql`, `002_rls.test.sql`, `004_security.test.sql`
- Modify: `.env.example`, root scripts

**Interfaces:**

- Produces all required tables, schema version 1, deterministic hero/banner seed, ownership indexes, and read-only RLS policies.

- [ ] **Step 1: Configure local services**

Set project ID `odd-tower`, API port 54321, database port 54322, Studio port 54323, Inbucket port 54324, `site_url = 'http://127.0.0.1:4173'`, anonymous sign-ins enabled, email signup enabled, and local email confirmations disabled for deterministic E2E. Document that hosted confirmation behavior is configurable.

- [ ] **Step 2: Write failing schema/RLS tests**

Assert every required column/type/check/foreign key/index, RLS enabled on every exposed table, one-active-team partial index, deterministic six-hero/one-banner seed, own-row reads, cross-user denials, unauthenticated denials, and direct mutation denials.

- [ ] **Step 3: Start Docker/Supabase and confirm RED**

Run `npm run supabase:start`, `npm run db:reset`, and `npm run db:test`. If Docker is unavailable, record the blocker and continue only with non-database tasks; never substitute mocks as evidence.

- [ ] **Step 4: Implement schema and security migrations**

Use `timestamptz`, explicit checks, `bigint`/integer guards where needed, `auth.users(id)` cascades, stable constraint/index names, `alter table ... enable row level security`, explicit own-row SELECT policies, and revoke all protected DML from `anon` and `authenticated`.

- [ ] **Step 5: Seed deterministically**

Use `INSERT ... ON CONFLICT DO UPDATE` for exactly six definitions, their required roles/rarities/starter flags/asset keys/weights, Standard Banner cost 100/pity 20, and its six pool entries. A second reset must yield the same rows.

- [ ] **Step 6: Verify database foundation**

Run `npm run db:reset` twice, `npm run db:lint`, `npm run db:test`, and `npm run db:types`.

### Task 4: Atomic Initialization, Summon, Star, and Team Transactions

**Files:**

- Create: `supabase/migrations/202607300003_phase4_transactions.sql`, `202607300004_phase4_grants.sql`
- Test: `supabase/tests/003_transactions.test.sql`, `apps/game-server/tests/databaseIntegration.test.ts`

**Interfaces:**

- Produces server-only functions `initialize_player_account`, `perform_summon`, `upgrade_hero_star`, `update_active_team`, and `unlock_team_slot` returning typed JSON compatible with `PlayerBootstrap` and mutation DTOs.

- [ ] **Step 1: Write failing transaction tests**

Cover ten concurrent initializations yielding one profile/starter/team/ledger, same-key Summon replay, no overspend, exact duplicate Shards, pity reset/increment, insufficient funds with no mutation, same-key Star replay, max Stars, cross-user teams, duplicates, locked slots, automatic Slot 2, and atomic 500-Gold Slot 3 unlock.

- [ ] **Step 2: Confirm RED against the reset database**

Run `npm run db:test` and focused server database integration tests.

- [ ] **Step 3: Implement transaction functions**

Each function uses `security definer`, `set search_path = pg_catalog, public`, explicit parameter types, `FOR UPDATE` locks, no dynamic SQL, UUID idempotency, stable `raise exception using errcode = 'P0001', message = '<DOMAIN_CODE>'`, and a complete authoritative JSON return.

- [ ] **Step 4: Restrict execution**

Revoke function execution from `public`, `anon`, and `authenticated`; grant only to the local/hosted trusted server role used by the secret client. Verify the publishable key cannot invoke functions.

- [ ] **Step 5: Verify transactions and concurrency**

Run `npm run db:reset`, `npm run db:test`, and `npm run test:database` twice.

### Task 5: Exactly-Once Combat Rewards and Trusted-Time AFK Transactions

**Files:**

- Modify: transaction/grant migrations before they are treated as released artifacts
- Create/extend tests: database transaction tests, `apps/game-server/tests/databaseIntegration.test.ts`

**Interfaces:**

- Produces `apply_combat_reward`, `prepare_afk_claim`, `claim_afk_reward`, and bounded activity-update behavior.

- [ ] **Step 1: Write failing reward tests**

Assert one `(user_id, reward_identity)` application, same-key retry, restart retry, two-user independence, no ineligible invocation, exact Gold, full living/half defeated Hero EXP, and Level-20 clamping.

- [ ] **Step 2: Write failing AFK tests**

Assert 29/30/59/60 minutes, 8-hour cap, preserved remainder, one pending period under concurrency, reload/restart durability, exact Gold/Jelly/team EXP, one claim under concurrency, already-claimed behavior, and immunity to client timestamps.

- [ ] **Step 3: Implement database functions**

Use database `clock_timestamp()` or injected trusted test time guarded by a server-controlled test path. The production SQL signature does not accept a browser timestamp. Ledger identity for AFK is stable from claim ID; combat identity remains `roomId:monsterId:spawnGeneration` plus authenticated user uniqueness.

- [ ] **Step 4: Verify database safety**

Run database, concurrency, idempotency, and RLS suites; query row counts to prove one ledger row per logical reward.

### Task 6: Server Configuration, JWT Verification, and Active User Registry

**Files:**

- Create auth modules and tests listed in File Structure
- Modify: `apps/game-server/src/config.ts`, server manifest

**Interfaces:**

- `AuthVerifier.verifyAccessToken(token): Promise<AuthenticatedIdentity>`
- `ActiveUserRegistry.reserve(userId, roomId)`, `reconnect(userId, roomId)`, `release(userId, roomId)`, `isActive(userId)`.

- [ ] **Step 1: Write failing Auth tests**

Test missing/malformed/expired/wrong-issuer/wrong-project tokens, missing subject, anonymous/permanent identity extraction, redacted errors, cached JWKS bounds, and local HS256 fallback through the supported Auth `/user` verification path when JWKS cannot verify the signing algorithm.

- [ ] **Step 2: Write failing registry tests**

Test first reservation, duplicate-account rejection, same-room reconnect, wrong-room reconnect rejection, release idempotency, and cleanup after room disposal.

- [ ] **Step 3: Implement validated configuration**

Require `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`; derive/validate the expected issuer from the configured project URL; never include values in thrown messages.

- [ ] **Step 4: Implement verification and middleware**

Use `jose` remote JWKS for asymmetric keys with issuer and subject validation. For local/legacy shared-secret projects, validate via the Supabase Auth user endpoint using the publishable key. Map failures to `AUTH_REQUIRED`, `AUTH_INVALID`, or `AUTH_EXPIRED`.

- [ ] **Step 5: Verify focused and existing server tests**

Run Auth/registry tests, `npx vitest run apps/game-server`, lint, and typecheck.

### Task 7: Persistence Service, Protected API, and Stable Errors

**Files:**

- Create persistence/API modules and tests listed in File Structure
- Modify: `apps/game-server/src/app.ts`, `index.ts`

**Interfaces:**

- Implement every method in the approved `PlayerPersistenceService`.
- Protected routes return `{ data, requestId }` or `{ error: { code, message, requestId } }`.

- [ ] **Step 1: Write failing service and route tests**

Cover bootstrap initialization, schema mismatch, profile validation, all mutations, Bearer requirement, per-user/per-IP rates, idempotency requirement, safe CORS, active-combat restrictions, bounded history pagination, and absence of raw database errors.

- [ ] **Step 2: Confirm RED**

Run focused server service/route tests.

- [ ] **Step 3: Implement service adapters**

`SupabasePersistenceService` calls named RPCs only and maps errors through `domainErrors.ts`. `InMemoryPersistenceService` implements the same typed contract for isolated unit/fault tests and throws if selected outside test mode.

- [ ] **Step 4: Implement routes and observability**

Mount the exact protected endpoints from the brief, assign UUID request IDs, enforce specified rate limits, require UUID idempotency keys on mutations, use explicit validators, and record bounded latency/outcome metrics.

- [ ] **Step 5: Verify API and secret handling**

Run focused tests, full server tests, lint, typecheck, and a log scan using synthetic token/secret markers.

### Task 8: Bounded Persistence Queue, Health, Readiness, and Degraded Mode

**Files:**

- Create: `PersistenceQueue.ts`, `PersistenceHealth.ts`, `PersistenceMetrics.ts`
- Test: queue/health tests
- Modify: `app.ts`, `index.ts`, `FloorOneRoom.ts`, `CombatSimulation.ts`

**Interfaces:**

- `enqueue(job): 'accepted' | 'saturated'`
- `flushRoom(roomId, timeoutMs): Promise<FlushResult>`
- `health.snapshot(): PersistenceHealthSnapshot`
- `CombatSimulation.setPersistenceGate('healthy' | 'degraded')`.

- [ ] **Step 1: Write failing deterministic queue tests**

Use injected clock/timers to test concurrency 4, room cap 200, five attempts, delays 250/500/1000/2000/5000 ms capped, same identity reuse, saturation, transient recovery, exhausted failure, bounded metrics, no unhandled rejection, room flush, and 10-second timeout.

- [ ] **Step 2: Write failing health/degraded tests**

Test startup unavailable, schema/seed mismatch, recovery, `/health` liveness, `/ready` rejection/recovery, join rejection, Auto Hunt disable, reward-bearing attack pause, movement preservation, and resume.

- [ ] **Step 3: Implement queue and health**

Queue execution runs in detached controlled workers outside simulation. Graceful process shutdown stops acceptance, flushes bounded work, logs incomplete counts without secrets, then closes transport.

- [ ] **Step 4: Verify failure behavior**

Run queue/health tests and existing combat scheduler/hardening tests to prove tick cadence and combat ordering remain unchanged.

### Task 9: Authenticated Rooms, Persistent Teams, and Reward Acknowledgement

**Files:**

- Modify: `FloorOneRoom.ts`, `CombatSimulation.ts`, `RoomState.ts`, protocol join/event types, multiplayer client/bridge
- Test: room/combat tests and new persistence integration cases

**Interfaces:**

- `CombatSimulation.addPersistentPlayer(userId, team: PersistentCombatHero[])`
- `CombatSimulation.drainPersistenceJobs(): CombatRewardJob[]`
- `CombatSimulation.acknowledgeReward(result): void`
- Room schema includes authenticated user ID server-side and safe persistence status client-side.

- [ ] **Step 1: Write failing persistent-room tests**

Test token-only join, profile display name, one-to-three saved heroes in slot order, derived stats, empty-team rejection, duplicate account rejection, same-user reconnect, wrong-user reconnect rejection, active registry cleanup, acknowledged Gold/EXP, pending-save visibility, same reward retry, and no duplicate after reconnect.

- [ ] **Step 2: Refactor combat reward seam under tests**

Replace immediate session reward mutation in online persistent mode with immutable jobs while retaining the existing contribution and reward identity calculation. Local/session test fixtures can use an explicit test reward sink; production uses the persistence queue.

- [ ] **Step 3: Inject persistent heroes without changing AI layers**

Keep the scheduler, FSM, `MonsterNavigator`, spatial grid, contribution rules, targeting, and movement unchanged. Map saved roles to formation slots and use definition-derived range/cooldown/stats.

- [ ] **Step 4: Implement acknowledgement events**

Publish `saving`, `saved`, and `degraded` semantic events. Only `saved` updates persistent Gold/EXP/Level/stat projections. Bound pending acknowledgement state and clear it on disposal after flush.

- [ ] **Step 5: Verify regressions and short load**

Run server room/combat/sustained tests, focused multiplayer client tests, and a shortened persistent load smoke.

### Task 10: Client Auth, API Client, Player Store, and Lifecycle

**Files:**

- Create client persistence modules and tests listed in File Structure
- Modify: `App.tsx`, client manifest

**Interfaces:**

- `AuthClient` exposes restore, guest, signup, signin, upgrade, signout, accessToken, and one bounded subscription.
- `GameApiClient` exposes typed protected methods with `AbortSignal` and idempotency keys.
- `PlayerStore` exposes immutable state plus subscribe/actions; no per-frame updates.

- [ ] **Step 1: Write failing lifecycle/store tests**

Test session restore, Guest, signup/signin errors, same-user upgrade, existing-email conflict, token refresh, one listener, stale-request abort, double-submit prevention, authoritative mutation merge, last-valid-state retention, room leave without Auth loss, and complete sign-out cleanup.

- [ ] **Step 2: Confirm RED and implement Auth adapter**

Use one lazily created Supabase browser client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never surface tokens in state or DOM.

- [ ] **Step 3: Implement API client and store**

Attach the current access token just before each request, parse shared response validators, reuse an operation's UUID during retry, abort superseded loads, and never optimistically mutate protected values.

- [ ] **Step 4: Implement App screen ownership**

Use an explicit screen stack with Auth/Home/persistent screens/lobby/room and a preserved Local Prototype path. Lazy-load persistent screen bundles and guarantee one Phaser canvas/socket at a time.

- [ ] **Step 5: Verify client foundation**

Run focused client tests, all existing client tests, lint, typecheck, and build; compare the bundle warning/size to baseline.

### Task 11: Asset Registry, Manifest, Validation, and Cartoon UI Foundation

**Files:**

- Create asset modules, tool scripts, asset tests, manifest JSON/CSV/schema/report/replacement guide
- Create `persistent/tokens.css`, `copy.ts`, `HeroMock.tsx`, `PersistentShell.tsx`, `PersistenceStatus.tsx`

**Interfaces:**

- `resolveAsset(assetId): ResolvedAsset`
- `AssetManifestEntry` exactly matches the approved manifest shape.
- UI consumes Asset IDs only.

- [ ] **Step 1: Write failing registry/validator tests**

Test unique IDs, complete six-hero asset families, unique target paths, valid dimensions/frame counts, definition asset-key coverage, absolute-path rejection, replacement instructions, fallback behavior, and component independence when a mock is replaced by a test PNG.

- [ ] **Step 2: Implement the registry and mock renderers**

Use project-authored inline SVG/CSS/Phaser primitives. Include every required Hero, rarity, currency, Summon, Team, AFK, Auth/Home, general, monster, map, and VFX entry. Missing assets resolve cleanly without broken image elements.

- [ ] **Step 3: Implement design tokens and shell accessibility**

Extend cream/peach/pink/yellow/mint/sky/lavender/chocolate tokens, rarity/currency accents, responsive containers, safe-area padding, 48 px controls, visible focus, modal focus trapping, Thai-compatible fonts, text-plus-color status, and reduced motion.

- [ ] **Step 4: Generate and validate documentation artifacts**

Generate JSON/CSV from one typed source, validate against JSON Schema, and write exact asset counts, frames, reuse/crop notes, dimensions, transparency, anchors, atlas groups, priorities, generation order, and screenshot locations without final prompts.

- [ ] **Step 5: Verify assets**

Run `npm run assets:validate`, focused asset tests, lint, typecheck, and build.

### Task 12: Auth, Home, Collection, Summon, Team, AFK, and Account UI

**Files:**

- Create all persistent screen components and `PersistentUi.test.tsx`
- Modify: `App.tsx`, `styles.css`

**Interfaces:**

- Screens consume `PlayerStore` selectors/actions and shared DTOs only.
- Each screen exposes a default-focus ref and returns through the screen stack.

- [ ] **Step 1: Write failing component tests**

Cover every required loading/empty/error/success state, Guest warning, password visibility, six collection slots, filters/sort, Hero Detail stats/upgrade affordability, Summon cost/pity/history/new/duplicate, Team tap-to-slot/reorder/remove/save/locked restrictions, AFK interval/cap/rewards/claim, account protection, accessible names/live regions, and reduced motion.

- [ ] **Step 2: Implement Auth and Home**

Use the required friendly copy, tower/hero-group mocks, persistent currencies/team/status, Protect Account, room actions, settings, and sign-out. Keep critical status plain alongside jokes.

- [ ] **Step 3: Implement Collection and Hero Detail**

Render six data-driven slots, silhouettes for unowned heroes, owned progression, role/rarity filters, stable sorting, team badges, effective stats, and Star upgrade confirmation/result.

- [ ] **Step 4: Implement Summon and Team Builder**

Reveal only server results, never optimistically deduct Gems, respect reduced motion, bound history, and support mobile tap-to-slot with optional desktop drag. Save team atomically and show active-combat restrictions.

- [ ] **Step 5: Implement AFK and Account screens**

Display server-derived time/intervals/cap/rewards/affected heroes and durable pending/claimed states. Upgrade Guest without profile replacement and explain hosted email confirmation behavior.

- [ ] **Step 6: Verify responsive/accessibility behavior**

Run component tests and inspect desktop, 390x844 portrait, 915x412, 844x390, and 740x360 landscape layouts with keyboard-only navigation.

### Task 13: Database/Auth/Persistence/Security/Restart E2E and Persistent Load

**Files:**

- Create E2E helpers/specs and `tests/load/ten-player-persistent-combat.ts`
- Modify: Playwright config and root scripts

**Interfaces:**

- Helpers create isolated Supabase users, use deterministic test-only controls, restart only the game server when required, and never print tokens/secrets.

- [ ] **Step 1: Write Auth and persistence E2E**

Implement Guest reload, permanent signup/signout/signin, same-user Guest upgrade, invalid credentials/session handling, starter initialization, collection, authoritative Summon/new/duplicate/pity, Team unlock/save/combat restriction, persistent reward acknowledgement/reload, and AFK pending/claim/idempotency.

- [ ] **Step 2: Write restart E2E**

Persist the complete scenario, stop/restart only the game server, retain the database, restore the Auth session, assert identical progression/team/pity/AFK state, rejoin, and prove no duplicate reward.

- [ ] **Step 3: Write security automation**

Use separate Guest/Permanent users to test cross-user RLS, direct protected mutation denial, function grant denial, JWT rejection, token-log scan, and built-client/source-map secret scan.

- [ ] **Step 4: Write asset/mobile E2E and screenshots**

Cover all required screens/results/HUD at desktop and mobile viewports, no broken images, mock fallback, reduced motion, one canvas, console/server errors, and capture the twelve named mock screenshots.

- [ ] **Step 5: Write the authenticated persistent load**

Measure all required tick, queue, persistence, latency, reward, connection, error, heap, row-count, and cleanup metrics for ten authenticated players/fifty monsters/60 seconds. Fail below 1,140 ticks or 19 Hz, on any duplicate/disconnect/valid rejection/server error, or when jobs remain after flush.

- [ ] **Step 6: Run focused suites**

Run `test:auth`, `test:persistence`, `test:database`, `test:security`, `test:restart`, `assets:screenshots`, and a short load smoke before the final 60-second run.

### Task 14: Documentation, Fresh Verification, and Phase 5 Gate

**Files:**

- Modify: `README.md`
- Create: `docs/phase-4-handoff.md`, database/auth/asset documents listed in the brief
- Update: this plan's checkboxes and implementation notes without Git-derived data

**Interfaces:**

- Documentation commands match actual root scripts and environment behavior.
- Handoff reports only observed evidence in the exact final response categories.

- [ ] **Step 1: Complete required documentation**

Document Auth architecture, schema, RLS, transaction locks/idempotency, queue/failure behavior, AFK cursor math, Summon/team rules, environment setup, database reset/test/type generation, assets, troubleshooting, limitations, and Phase 5 readiness.

- [ ] **Step 2: Stop project processes and verify clean ports**

Resolve exact project-owned processes before stopping them. Verify no listener remains on 2567, 4173, 54321–54324 before starting the clean run.

- [ ] **Step 3: Rebuild from a clean dependency/database state**

Run, in order: `npm ci`, `npm run supabase:start`, `npm run db:reset`, `npm run db:lint`, `npm run db:test`, `npm run db:types`.

- [ ] **Step 4: Run static/application verification**

Run: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run test:coverage`, `npm run test:auth`, `npm run test:persistence`, `npm run test:database`, `npm run test:security`.

- [ ] **Step 5: Run browser/restart/regression/load verification**

Run: `npm run test:multiplayer`, `npm run test:combat`, `npm run test:hardening`, `npm run test:e2e`, `npm run test:restart`, `npm run test:load:persistence`, `npm run assets:validate`, `npm run assets:screenshots`.

- [ ] **Step 6: Run production verification**

Run `npm run build` and `npm audit --omit=dev`; start the compiled server and verify `/health`, `/ready`, and `/api/persistence/health`; start built preview; inspect Browser console/server logs; run secret scans; then stop client, server, and Supabase and verify all project ports released.

- [ ] **Step 7: Record the Phase 5 gate honestly**

State `Phase 5 readiness: READY` only when every required database/Auth/upgrade/Summon/reward/AFK/restart/load/regression/asset condition has direct passing evidence. Otherwise state `NOT READY` and list exact blockers.

## Plan Self-Review

- Spec coverage: every authentication, schema, RLS, transaction, persistence, collection, Summon, Star, Team, reward, AFK, UI, asset, performance, security, documentation, and final-verification requirement maps to a task.
- Authority: browser code performs Auth only and requests mutations; all gameplay outcomes remain server/database authoritative.
- Tick isolation: the combat loop only creates bounded immutable jobs; workers own every awaited persistence call.
- Idempotency: initialization uses uniqueness, Summon/Star/Team/AFK mutations use UUID keys, and combat uses `(user_id, reward_identity)`.
- Concurrency: balance/state rows are locked before mutation and transactions return complete authoritative results.
- Security: RLS, grants, safe `search_path`, issuer verification, secret separation, redacted logs, and bundle scans are explicit.
- Bounds: queue, retries, history, metrics, listeners, API rates, and test waits all have stated caps.
- Type consistency: shared DTOs and named interfaces are established before server/client consumers.
- Scope: no excluded Phase 5 system or final-art dependency is introduced.
- Placeholder scan: the plan contains no deferred implementation marker.
- Git prohibition: no task invokes Git.
