# Odd Tower Phase 3 Shared World Combat Implementation Plan

> **For agentic workers:** Execute inline with `superpowers:executing-plans` and `superpowers:test-driven-development`. Every production behavior begins with a focused failing test. Do not execute Git commands.

**Goal:** Upgrade the existing Online Movement Sandbox into a complete one-to-ten-player server-authoritative shared combat sandbox while preserving the Phase 1 Local Prototype and all Phase 2 movement, room, prediction, interpolation, reconnection, rate-limit, and cleanup behavior.

**Architecture:** Pure `game-core` modules own deterministic formulas, definitions, navigation decisions, state transitions, contribution eligibility, progression, and seeded randomness. `network-protocol` owns protocol v3 wire types and strict validators. A room-owned `CombatSimulation` in the Colyseus server advances movement and combat on one 20 Hz tick and projects bounded authoritative state into schema. Phaser renders snapshots and ephemeral effects; React renders meaningful combat HUD updates from the existing bridge.

**Tech Stack:** strict TypeScript 5.9, npm workspaces, React 19, Phaser 3.90, Vite 8, Colyseus 0.17/schema 4, Vitest 3, Testing Library, Playwright 1.55.

## Global Constraints

- No Git command may be executed; edit only the current working directory.
- Preserve the 20 Hz simulation and patch rate, 50 ms tick, 100 ms interpolation delay, 150 ms extrapolation cap, 15-second reconnect grace period, and Phase 2 movement limit.
- The server alone owns monsters, hero HP, cooldowns, damage, status effects, targeting, Auto Hunt, death, respawn, contribution, EXP, Gold, and reward identity.
- Online progression is session-only and must be labeled `Session Gold`, `Session Level`, and `Session EXP`.
- `game-core` and `network-protocol` remain framework-independent and transport-neutral respectively.
- No database, authentication, persistent account/currency/progression, collection, inventory, boss, portal, PvP, later floor, or final art system is introduced.
- All collections and histories are bounded; no per-monster unmanaged timers or intervals are allowed.
- Four-direction grid navigation is authoritative and recalculates at most twice per second per entity.

## Existing Architecture Assessment

- `game-core` already supplies the Floor 1 collision grid, formation offsets, deterministic four-neighbor A\*, damage/progression helpers, safe-zone geometry, and cardinal movement shared by the server and predicted client.
- Protocol v2 currently validates only movement/heartbeat commands and serializes anchor presence. It is the correct seam for combat command/state/event additions and a version increment to 3.
- `FloorOneRoom` owns one controlled simulation interval, reconnect lifecycle, schema projection, and rate limiting. Combat will extend this room rather than create a second online architecture.
- `MultiplayerClient` already consumes schema state, predicts only the local anchor, interpolates remote anchors, and performs lifecycle cleanup. Combat snapshots will be copied into immutable client views without predicting combat outcomes.
- `MultiplayerScene` already renders all online teams and the shared collision map. It will add monster/entity views and hero combat visuals while preserving one-canvas cleanup.
- React receives low-frequency bridge updates. The online HUD can expand without polling Phaser.
- Untouched Phase 2 baseline: install, format, lint, typecheck, 83 tests, 90.03% statement/line coverage, builds, 12 browser tests, focused multiplayer, and ten-player load all pass.

## Exact File Map

### Pure game core

- Create `packages/game-core/src/combat-config.ts`: five monster definitions, hero balance aliases, combat/AI/Auto Hunt/reward/status-effect tuning, spawn descriptors, and typed constants.
- Create `packages/game-core/src/random.ts`: deterministic room-seeded PRNG with explicit state.
- Create `packages/game-core/src/combat.ts`: safe damage, hero effective positions, hero/monster target ordering, contribution eligibility, reward identity, status-effect refresh/expiry, safe-zone and leveling helpers.
- Create `packages/game-core/src/combat-navigation.ts`: safe-zone-excluding walkability, bounded cardinal path lookup, line-clear checks, and target/path helpers.
- Modify `packages/game-core/src/types.ts`, `map.ts`, `rules.ts`, and `index.ts` to expose the Phase 3 domain types and retain Phase 1 compatibility.
- Create `packages/game-core/tests/combat-phase3.test.ts`, `monster-definitions.test.ts`, and `auto-hunt-phase3.test.ts`.

### Protocol

- Modify `packages/network-protocol/src/config.ts`: protocol v3 and centralized combat/network limits.
- Modify `packages/network-protocol/src/types.ts`: focus/Auto Hunt commands, hero/player/monster snapshots, timed effects, combat events, and error codes.
- Modify `packages/network-protocol/src/validation.ts`: strict command/event validation, bounded IDs/strings, finite numbers, and exact boolean handling.
- Modify `packages/network-protocol/tests/validation.test.ts`: protocol v3 command and malformed event/state coverage.

### Authoritative server

- Create `apps/game-server/src/simulation/combatTypes.ts`: internal mutable hero, player-combat, monster, contribution, path, and diagnostic types not exposed to clients.
- Create `apps/game-server/src/simulation/combatFactory.ts`: deterministic player teams and validated/scaled Floor 1 monster spawns.
- Create `apps/game-server/src/simulation/CombatSimulation.ts`: room-owned tick orchestration, AI, navigation, hero/monster attacks, special abilities, status effects, deaths, reward finalization, leveling, healing/revival, respawns, Auto Hunt, and bounded events/diagnostics.
- Modify `apps/game-server/src/simulation/playerSimulation.ts` so authoritative manual or Auto Hunt intent uses one movement path and active slows affect speed.
- Modify `apps/game-server/src/schema/RoomState.ts`: schema classes/maps for heroes, player combat, monsters, status effects, tick, and bounded event batch.
- Modify `apps/game-server/src/validation/rateLimiter.ts`: isolated movement/focus/Auto Hunt buckets.
- Modify `apps/game-server/src/rooms/FloorOneRoom.ts`: command dispatch, simulation integration, schema projection, disconnect protection, reconnect restore, and disposal cleanup.
- Create `apps/game-server/tests/combatSimulation.test.ts`, `combatRoom.test.ts`, and `sustainedCombat.test.ts`; extend lifecycle/rate-limit tests.

### Client transport, Phaser, and React

- Create `apps/client/src/game/multiplayer/monsterInterpolation.ts`: bounded authoritative monster interpolation with discontinuity snap.
- Create `apps/client/src/game/multiplayer/combatEvents.ts`: bounded event-ID deduplication.
- Modify `apps/client/src/game/multiplayer/MultiplayerBridge.ts`: session progression, three hero summaries, Auto Hunt, focus target, living count, respawn countdown, and temporary-progress notice.
- Modify `apps/client/src/game/multiplayer/MultiplayerClient.ts`: consume combat schema, expose immutable monster/player views, send validated focus/Auto Hunt commands once, deduplicate presentation events, and reset combat buffers on leave/reconnect.
- Modify `apps/client/src/game/scenes/MultiplayerScene.ts`: render/pool five monster placeholders, HP/level labels, target ring, hero HP/defeat/slow visuals, and bounded attack/heal/charge/level effects; add pointer/touch focus targeting and diagnostics.
- Modify `apps/client/src/ui/ModeSelection.tsx`, `OnlineLobby.tsx`, `OnlineHud.tsx`, `App.tsx`, and `styles.css`: Shared Combat wording, accessible responsive HUD, Auto Hunt toggle, progression notice, target, HP/EXP/levels, and countdown.
- Extend `apps/client/tests/MultiplayerBridge.test.ts`, `MultiplayerClient.test.ts`, and `OnlineUi.test.tsx`; create `combatEvents.test.ts` and `monsterInterpolation.test.ts`.

### End-to-end, load, scripts, and docs

- Extend `tests/e2e/multiplayer.spec.ts` with observable two-client shared combat, no-last-hit, Auto Hunt/manual override, retreat/recovery, wipe, reconnect, isolation, and mobile focus/toggle scenarios using deterministic test configuration.
- Create `tests/load/sustained-shared-combat.ts` for an accelerated equivalent of ten simulated gameplay minutes.
- Create `tests/load/ten-player-shared-combat.ts` for a real 60-second ten-client combat load.
- Modify root `package.json` to add `test:combat`, `test:sustained`, and `test:load:combat` while preserving all prior scripts.
- Modify `README.md`; create `docs/phase-3-handoff.md`.

## Authoritative Data and Tick Design

The room stores one `CombatSimulation` keyed by session ID and monster ID. Player anchors remain the only networked movement bodies. The simulation derives fighter/tank/support positions from the authoritative anchor and facing on demand. Schema is a presentation projection: internal contribution ledgers, path caches, blacklist entries, RNG state, processed reward IDs, and hit-once charge sets never cross the wire.

Each 50 ms tick executes this fixed order: validated queued inputs; manual/Auto Hunt movement; effect expiry; 5 Hz AI decisions when due; monster movement/path following; hero attacks; monster attacks and charge impacts; Pudding healing; death resolution; contribution/reward finalization; EXP/level changes; safe-zone healing and individual revival; monster/team respawns; bounded event publication and schema projection. Tick drift samples are retained in a fixed-size diagnostic window.

## Monster and Spawn Design

Definitions are keyed by `grumpy-radish`, `jumping-sauce-bag`, `shoe-biting-dust-ball`, `wild-sausage`, and `lost-pudding`, with all specified level ranges, stats, rewards, and respawn delays. The base spawn table contains 34 validated points partitioned into beginner, intermediate, and navigation/high-level regions. Additional deterministic slots scale toward 50 as room population rises. IDs remain stable (`spawn-slot-N`) while `spawnGeneration` increments per respawn; reward identity is `roomId:monsterId:generation`.

The FSM uses `idle`, `wandering`, `chasing`, `attacking`, `windup`, `charging`, `healing`, `returning`, `defeated`, and `respawning`. AI decisions run every fourth server tick. Cached paths refresh no faster than ten ticks, when the goal changes tile, or when invalid. Returning regenerates 10% max HP per second. Dust Ball refreshes one 20% slow for 40 ticks. Wild Sausage uses a 15-tick wind-up, locked cardinal charge path, collision stop, and per-charge hero hit set. Lost Pudding checks every 60 ticks and heals the lowest-HP living ally in 120 px before attacking.

## Combat, Contribution, and Rewards

Damage is `floor(max(1, attack - defense * 0.5) * multiplier)`, clamped to at least one with a seeded room PRNG multiplier in `[0.90, 1.10]`. Non-finite inputs fail safely. Hero target priority is valid manual focus, valid current target, nearest in acquisition range, then Auto Hunt target. Monster target score is distance, multiplied by `0.85` for Tanks when candidates are comparable, with stable ID tie-breaking.

Each monster generation owns a map with one entry per player. Eligibility requires at least `max(1, floor(maxHp * 0.01))` confirmed damage and contribution within 200 ticks of death. A processed `(rewardIdentity, playerId)` set makes reward application idempotent. Eligible players receive full Gold; living heroes receive full EXP and defeated heroes half EXP. Shared progression uses `floor(50 * level^1.35)`, existing rounded growth, multi-level rewards, and level cap 20.

## Safe Zone, Wipe, and Auto Hunt

Safe-zone checks use shared `WORLD` geometry. Living heroes heal 10% max HP per second. If any hero lives, defeated heroes accumulate a five-second revive only while the anchor remains inside and revive at 50%; leaving resets progress. Monsters clear protected targets and return without entering the zone.

All-three defeat starts a 100-tick countdown, disables movement/Auto Hunt, clears targets, and makes the team untargetable. Completion places the anchor at a deterministic safe spawn, restores full HP, clears effects/navigation, and keeps session progression.

Auto Hunt states are `disabled`, `acquiring-target`, `navigating`, `engaging`, `retreating`, `recovering`, and `waiting`. It chooses the nearest reachable non-blacklisted living monster with stable tie-breaking, follows server paths, retreats below 25% combined living-team HP, heals/revives in the Safe Zone, and resumes at 80%. Any valid non-`none` manual command disables it immediately. Unreachable IDs enter a bounded eight-entry blacklist for 100 ticks; waiting retries every ten ticks.

## Protocol and Event Design

Protocol v3 adds `{type:'focus-target', targetMonsterId, clientSentAtMs}` and `{type:'auto-hunt', enabled, clientSentAtMs}` without accepting client combat values. IDs are printable bounded strings. Events have bounded unique IDs derived from room tick plus a monotonic counter, a validated type union, tick, and minimal payload. The room retains only the current tick batch; the client retains a bounded 256-ID dedupe set. Durable HP, progression, death, and current targets remain schema truth.

## Test and Verification Strategy

### Task 1: Core definitions, RNG, and combat math

- [ ] Add focused tests that fail because the five definitions, seeded RNG, safe damage guard, and reward identity APIs do not exist.
- [ ] Run `npx vitest run packages/game-core/tests/combat-phase3.test.ts packages/game-core/tests/monster-definitions.test.ts` and verify expected missing-export failures.
- [ ] Implement the smallest typed modules and exports; rerun focused and all core tests.

### Task 2: Targeting, effects, contribution, progression, and navigation

- [ ] Add failing cases for formation range, manual/current/nearest priority, Tank-biased stable targeting, slow refresh/expiry, eligibility window, multi-level rewards, blocked cardinal pursuit, safe-zone exclusion, and bounded unreachable handling.
- [ ] Implement pure helpers and rerun until green; refactor only with all core tests green.

### Task 3: Protocol v3

- [ ] Add failing validator/type tests for focus, clearing focus, Auto Hunt, unknown/malformed commands/events, bounded strings/IDs, finite numbers, and mismatch.
- [ ] Implement protocol v3 types/config/validation and run focused protocol tests plus strict typecheck.

### Task 4: Server combat factories and basic loop

- [ ] Add failing tests for three-hero creation, 34 valid base spawns, player-count scaling, identical shared IDs, cooldown attacks, shared HP, and once-only death/respawn.
- [ ] Implement factories and `CombatSimulation` through normal combat/death/respawn; run focused server tests.

### Task 5: Monster AI and special behaviors

- [ ] Add failing deterministic tests for idle/wander/chase/attack/return/regen, Dust Ball slow, Wild Sausage warning/locked collision/hit-once charge, and Pudding priority heal.
- [ ] Implement state transitions in the room tick without detached timers; rerun focused tests.

### Task 6: Auto Hunt, Safe Zone, wipe, and reconnect lifecycle

- [ ] Add failing tests for acquisition/navigation/engagement, manual disable, retreat/recovery/resume, waiting/blacklist bounds, individual revival/cancel, wipe countdown/respawn, disconnect protection, and reconnect preservation.
- [ ] Implement minimal state machines and cleanup; rerun server simulation tests.

### Task 7: Schema and room integration

- [ ] Add failing two-client room tests for identical monsters, shared damage, separate eligible rewards, ineligible exclusion, once-only respawn, reconnect idempotency, ten-player scaling, and empty disposal.
- [ ] Extend schema/room/rate limits, project state, and run all server/protocol tests.

### Task 8: Client state, event dedupe, interpolation, and React HUD

- [ ] Add failing client tests for combat snapshot copying, entity removal, dedupe cap, focus/Auto Hunt send-once, state restoration, cleanup, temporary copy, hero HP/level/EXP/Gold/countdown rendering, and accessible controls.
- [ ] Implement bridge/client/UI changes and run component/client tests, lint, and typecheck.

### Task 9: Phaser shared-combat presentation

- [ ] Add testable view-model/interpolation assertions and browser diagnostics for monster IDs/HP, target state, and entity counts.
- [ ] Implement pooled placeholder entities/effects, focus pointer handling, combat hero visuals, and shutdown cleanup.
- [ ] Verify one canvas/listener set across repeated leave/rejoin.

### Task 10: Sustained combat and ten-player load

- [ ] Add deterministic accelerated simulation that fails on duplicate rewards, count drift, stuck Auto Hunt, collection growth, or cleanup failure.
- [ ] Add ten real clients for at least 60 seconds with movement, focus, Auto Hunt, deaths/respawns/rewards, drift/latency/heap/tick/error counters.
- [ ] Add root scripts and run short smoke variants before final-duration runs.

### Task 11: Browser combat scenarios

- [ ] Add Playwright scenarios for shared visibility/combat/no-last-hit, Auto Hunt/manual override, retreat/recovery, wipe, reconnect, isolation, and mobile controls with observable state waits.
- [ ] Run Chromium-focused combat first, then the full desktop/mobile matrix and inspect all page/server errors.

### Task 12: Documentation and final verification

- [ ] Update README and write the handoff with exact implemented behavior, authority, state machines, idempotency, evidence, limitations, and Phase 4 persistence seam.
- [ ] Run clean install, format, lint, typecheck, unit, coverage, build, E2E, multiplayer, combat, sustained, both load scripts, and production dependency audit.
- [ ] Start compiled server and preview client, verify `/health`, manually exercise two-browser combat and mobile layout, record FPS/tick/heap observations, stop all processes, and confirm ports are released.

## Performance Constraints

- AI decision work is 5 Hz and path search is capped at 2 Hz/entity; cached grid data is immutable.
- Combat/event/contribution work is bounded by ten players, fifty monsters, three heroes/player, a 256-event client dedupe set, an eight-entry Auto Hunt blacklist, and per-generation contribution maps cleared on respawn.
- Phaser creates persistent entity views and pools ephemeral effects; React updates only on bridge state changes.
- Final evidence must report release-browser FPS, tick drift, latency, heap delta, monster-count stability, and cleanup rather than infer performance from code.

## Phase 3 Exclusions and Phase 4 Handoff

Phase 3 does not add persistence, accounts, authentication, collection, summoning, shards, inventory, equipment, AFK rewards, bosses, portals, PvP, later floors, social systems, monetization, or final artwork. Phase 4 should introduce a repository boundary that converts the already authoritative in-room reward/progression result into authenticated persistence after successful transaction commit. It must not move combat authority to clients or expose internal contribution ledgers.

## Self-Review

- Coverage: every numbered acceptance area maps to a core, protocol, server, client, integration, browser, load, documentation, or final-verification task.
- Ownership: no client type or command can author damage, HP, rewards, levels, death, positions, or paths.
- Bounds: event IDs, effects, paths, blacklist, contributions, timers, interpolation, and diagnostics have explicit limits or lifecycle cleanup.
- Idempotency: monster generation and `(rewardIdentity, playerId)` prevent duplicate death/reward application and allow valid later respawns.
- Consistency: all timing is expressed from the 50 ms authoritative tick; 5 Hz is four ticks, 2 Hz is ten ticks, five seconds is 100 ticks, ten seconds is 200 ticks.
- Scope: no Phase 4 or later feature is scaffolded or represented as working.
- Placeholder scan: the plan contains no deferred implementation marker or unspecified production behavior.
