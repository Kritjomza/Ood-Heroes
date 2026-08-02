# Complete Single-Sprite Floor 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete playable Floor 1 MVP with one runtime-animated world image per moving entity, data-driven map/collision/navigation, an authoritative boss, and idempotent manual portal completion.

**Architecture:** A shared typed Floor 1 definition replaces the coded wall list and feeds rendering, collision, navigation, terrain, spawns, arena, and portal rules. A reusable visual-only motion controller drives all Phaser entity types, while the existing server simulation remains authoritative for movement, combat, boss state, eligibility, rewards, and persistence.

**Tech Stack:** TypeScript 5.9, Phaser 3.90, React 19, Colyseus 0.17, Vitest 3, Playwright 1.55, Supabase persistence.

## Global Constraints

- Do not run Git commands or modify `.git`.
- Preserve unrelated pre-existing workspace changes.
- Inspect every existing file before modifying it.
- Use one primary `world.webp` per hero, monster, boss, moving NPC, and add.
- Use runtime horizontal flipping; right is unflipped and left is flipped.
- Physics bodies, health bars, nameplates, and authoritative positions never inherit visual animation transforms.
- Floor 1 is exactly 64 × 64 tiles at 32 × 32 pixels, producing a 2,048 × 2,048 world.
- Rendering, collision, navigation, terrain cost, spawns, boss objects, and portal objects derive from one typed map source.
- Server authority owns combat, progress, eligibility, rewards, and completion.
- Missing images use safe fallbacks and receive prompt files before any future generation.
- Each production behavior follows a RED → GREEN → REFACTOR test cycle.

## File Responsibility Map

- `packages/game-core/src/floor-one-map.ts`: typed Tiled-compatible map, layer/object validation, zone/spawn/terrain data, collision and navigation derivation.
- `packages/game-core/src/navigation.ts` and `movement.ts`: weighted path cost, portal/boss exclusions, map-derived speed/collision.
- `packages/game-core/src/floor-progression.ts`: boss/portal eligibility and idempotent completion domain rules.
- `apps/client/src/game/animation/*`: single-sprite motion profiles, pure state reducer, Phaser adapter.
- `apps/client/src/game/entities/*`: stable root/visual/shadow/UI entity view assembly.
- `apps/client/src/game/map/FloorOneRenderer.ts`: map layer rendering, depth, portal state, debug overlays.
- `apps/client/src/game/scenes/GameScene.ts`: local integration only.
- `apps/client/src/game/scenes/MultiplayerScene.ts`: remote/follower/monster/boss/add integration only.
- `apps/game-server/src/simulation/*`: authoritative boss and Floor 1 completion state.
- `packages/network-protocol/src/types.ts`: boss, progress, portal, and completion wire contracts.
- `apps/client/src/assets/world-visuals.ts`: central single-image registry and fallback validation.
- `art-prompts/**` and `docs/art/asset-audit-floor-1.md`: audited single-image production inputs.

---

### Task 1: Audit Baseline and Protect Existing Work

**Files:**
- Create: `docs/reports/floor-1-preimplementation-audit.md`
- Inspect: all files named in later tasks before their first edit

**Interfaces:**
- Produces: an evidence table of existing behavior, conflicting four-pose sections, unrelated changes to preserve, asset gaps, and exact migration targets.

- [ ] Read current runtime, core, server, protocol, registry, prompt, test, and documentation files without Git.
- [ ] Record the current one/four/eight-frame contracts and identify only active conflicting sections.
- [ ] Record uncertain or unrelated changes that will not be edited.
- [ ] Write the preimplementation audit with no completion claims.

### Task 2: Typed Floor 1 Map and Validation

**Files:**
- Create: `packages/game-core/src/floor-one-map.ts`
- Create: `packages/game-core/tests/floor-one-map.test.ts`
- Modify: `packages/game-core/src/map.ts`
- Modify: `packages/game-core/src/index.ts`

**Interfaces:**
- Produces: `FLOOR_ONE_MAP`, `validateFloorOneMap(map)`, `createNavigationGrid(map)`, `terrainMultiplierAt(point)`, `floorOneObject(id)`, and `isZoneReachable(from, to)`.

- [ ] Write failing literal-fixture tests for dimensions, required layers, unique objects, safe spawns, biome zones, arena/portal references, collision derivation, slow costs, and zone reachability.
- [ ] Run `npx vitest run packages/game-core/tests/floor-one-map.test.ts` and confirm failures are caused by missing APIs.
- [ ] Implement the typed map definition, validation, objects, collision, terrain, and adapter-backed `prototypeMap`.
- [ ] Re-run the focused test and existing movement/navigation tests.

### Task 3: Single-Sprite Motion Foundation

**Files:**
- Create: `apps/client/src/game/animation/motionProfiles.ts`
- Create: `apps/client/src/game/animation/SingleSpriteMotionController.ts`
- Create: `apps/client/tests/singleSpriteMotion.test.ts`
- Modify: `apps/client/src/game/scenes/heroDirectionalSprites.ts`
- Modify: `apps/client/tests/heroDirectionalSprites.test.ts`

**Interfaces:**
- Produces: `MotionProfileName`, `MOTION_PROFILES`, `createMotionState()`, `updateSingleSpriteMotion(state, sample)`, and `SingleSpriteMotionController`.

- [ ] Write failing tests for thresholded facing, right/unflipped, left/flipped, vertical persistence, idle timeout, phase offsets, profile lookup, movement phase, and stable visual-only offsets.
- [ ] Run focused tests and confirm expected RED output.
- [ ] Implement pure motion state/profile logic, then the Phaser adapter without frame switching.
- [ ] Migrate only conflicting four-pose helpers to one-texture mapping.
- [ ] Re-run focused tests and client typecheck.

### Task 4: World Asset Registry and Prompt Audit

**Files:**
- Create: `apps/client/src/assets/world-visuals.ts`
- Create: `apps/client/tests/worldVisuals.test.ts`
- Modify: `apps/client/src/assets/manifests/phase-4-assets.ts`
- Modify: `tools/generate-phase4-asset-manifest.ts`
- Modify: `tools/validate-phase4-assets.ts`
- Modify: `tools/validate-art-prompts.ts`
- Regenerate: `docs/assets/phase-4-asset-manifest.json`
- Regenerate: `docs/assets/phase-4-asset-manifest.csv`
- Create: `docs/art/asset-audit-floor-1.md`
- Modify/Create: relevant `art-prompts/heroes`, `monsters`, `bosses`, `npcs`, `adds`, and `environments/floor_1` owner files

**Interfaces:**
- Produces: `WORLD_VISUALS`, `worldVisualFor(definitionId)`, and validation for duplicate IDs, paths, scales, anchors, profiles, formats, and one-frame contracts.

- [ ] Write failing registry/validator tests for one-image world contracts and fallback behavior.
- [ ] Run focused tests and both validators to capture RED evidence.
- [ ] Implement stable registry IDs and single `world.webp` paths without changing portrait/card contracts.
- [ ] Audit every repository image and classify each required Floor 1 visual.
- [ ] Migrate conflicting four-pose prompt/manifest sections and add self-contained prompts for every missing image.
- [ ] Regenerate manifests; run registry tests and both validators.

### Task 5: Local, Remote, Follower, Monster, NPC, Boss, and Add Views

**Files:**
- Create: `apps/client/src/game/entities/WorldEntityView.ts`
- Create: `apps/client/src/game/map/FloorOneRenderer.ts`
- Create: `apps/client/tests/worldEntityView.test.ts`
- Modify: `apps/client/src/game/scenes/GameScene.ts`
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Modify: `apps/client/tests/lightweightSpriteRuntime.test.ts`

**Interfaces:**
- Produces: stable entity hierarchy, lifecycle cleanup, motion sampling from interpolated displacement, action reactions, portal render states, and pooled transient effects.

- [ ] Write failing pure/lifecycle tests for view hierarchy, stable UI transforms, remote displacement facing, fallback entities, and cleanup.
- [ ] Run focused tests and confirm RED.
- [ ] Implement shared entity view and map renderer.
- [ ] Integrate all local and multiplayer entity types while preserving existing combat/reconnect behavior.
- [ ] Run client tests, combat event tests, and client typecheck.

### Task 6: Weighted Navigation, Collision, Slow Terrain, and Portal Exclusion

**Files:**
- Modify: `packages/game-core/src/navigation.ts`
- Modify: `packages/game-core/src/movement.ts`
- Modify: `packages/game-core/src/auto-hunt.ts`
- Modify: `apps/game-server/src/simulation/MonsterNavigator.ts`
- Modify: `apps/game-server/src/simulation/CombatSimulation.ts`
- Test: relevant `packages/game-core/tests/*` and `apps/game-server/tests/monsterNavigator.test.ts`

**Interfaces:**
- Produces: weighted deterministic A*, portal and locked-arena exclusions, terrain-adjusted movement, bounded recalculation, and safe stuck recovery.

- [ ] Write failing tests with hand-derived routes/costs for solid collision, chocolate slow terrain, portal exclusion, locked arena exclusion, unreachable targets, and normalized diagonals.
- [ ] Run focused tests and confirm RED.
- [ ] Implement weighted cost/exclusion options through the shared derived grid.
- [ ] Integrate server movement/path consumers and preserve existing leash/stuck budgets.
- [ ] Run core/server focused tests and typecheck.

### Task 7: Authoritative Boss Encounter

**Files:**
- Create: `apps/game-server/src/simulation/FloorGuardianSimulation.ts`
- Create: `apps/game-server/tests/floorGuardianSimulation.test.ts`
- Modify: `apps/game-server/src/simulation/CombatSimulation.ts`
- Modify: `apps/game-server/src/schema/RoomState.ts`
- Modify: `apps/game-server/src/rooms/schemaProjection.ts`
- Modify: `packages/network-protocol/src/types.ts`
- Modify: related protocol/client tests

**Interfaces:**
- Produces: boss snapshot/state/events for locked, available, active, enraged, defeated, and resetting states; frontal strike, cold wind, adds, contribution, and eligibility.

- [ ] Write failing deterministic tests for progress gating, attacks, slow, adds, enrage, contribution rewards, reset, disconnect cleanup, and defeat eligibility.
- [ ] Run focused tests and confirm RED.
- [ ] Implement the isolated boss simulation and wire it into the room tick/projection.
- [ ] Extend client normalization and rendering for boss/add snapshots and events.
- [ ] Run boss, schema, protocol, combat, and multiplayer client tests.

### Task 8: Manual Portal Completion and Idempotent Rewards

**Files:**
- Create: `packages/game-core/src/floor-progression.ts`
- Create: `packages/game-core/tests/floor-progression.test.ts`
- Modify: `apps/game-server/src/rooms/FloorOneRoom.ts`
- Modify: persistence interfaces/implementations only where required
- Modify: `packages/network-protocol/src/types.ts` and validation
- Modify: client bridge/HUD/UI for interaction and completion summary

**Interfaces:**
- Produces: `portalEligibility`, `completeFloorOne`, `floor_one_complete` command/result, and stable completion idempotency keys.

- [ ] Write failing tests for sealed/ineligible/manual-only entry, eligible completion, duplicate replay, failed persistence, reconnect restoration, and no Auto Hunt entry.
- [ ] Run focused tests and confirm RED.
- [ ] Implement pure domain rules and server command validation.
- [ ] Persist completion through the existing queue/repository boundary and return the original result for duplicates.
- [ ] Add portal interaction/summary UI and run focused integration tests.

### Task 9: MVP Integration, Reports, and QA Artifacts

**Files:**
- Modify: existing lobby/HUD/bridge files only at Floor 1 seams
- Create: `docs/reports/single-sprite-movement-implementation.md`
- Create: `docs/reports/floor-1-map-implementation.md`
- Create: `docs/qa/floor-1-visual-and-gameplay-checklist.md`
- Modify: `README.md` only for verified run instructions

**Interfaces:**
- Produces: connected login → lobby → team → Floor 1 → progress → boss → portal → summary loop and evidence-based reports.

- [ ] Add failing integration/E2E expectations for entering Floor 1, map load, fallback visuals, collision, slow terrain, boss unlock, portal completion, duplicate rejection, and reconnect.
- [ ] Run focused integration tests and confirm RED.
- [ ] Connect only missing UI/state seams and preserve existing collection/summon/team/AFK flows.
- [ ] Write reports with actual findings and provisional test-result fields.
- [ ] Run focused integration tests to GREEN.

### Task 10: Full Verification and Browser QA

**Files:**
- Modify only files implicated by verified failures.
- Finalize implementation reports with actual evidence.

**Interfaces:**
- Produces: final evidence, screenshots if captured, limitations, changed-file ledger, preservation ledger, and no-Git statement.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npx vitest run --reporter=dot`.
- [ ] Run `npm run build`.
- [ ] Run `npm run assets:validate` and `npm run prompts:validate` plus the map validator test.
- [ ] Run relevant Playwright desktop and mobile projects with the required local services.
- [ ] Run available 2/5/10-client and load checks; report unavailable environments precisely.
- [ ] Perform browser QA for movement, facing, physics separation, zones, slow terrain, boss, portal, summary, responsive UI, and console errors.
- [ ] Update reports and the exact file/preservation/migration ledger from direct filesystem inspection.
- [ ] Confirm no Git commands were used during implementation and disclose any command run before the restriction existed.
