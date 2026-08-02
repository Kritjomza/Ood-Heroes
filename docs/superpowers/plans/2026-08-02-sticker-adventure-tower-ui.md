# Sticker Adventure Tower UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute inline; no subagents requested.

**Goal:** Build one responsive Sticker Adventure HUD and richer pixel-style Floor 1 presentation for Local and Online Tower modes.

**Architecture:** Pure typed HUD/minimap view models feed shared React presentation. Existing local and online bridges adapt into shared components. Phaser renderer gains deterministic layered pixel-style helpers while gameplay data remains authoritative.

**Tech Stack:** React, TypeScript, CSS, Phaser 3, Vitest, Playwright.

## Global Constraints

- No Git commands or `.git` edits.
- Preserve unrelated work.
- Keep one right-facing world image, horizontal flip, runtime squash/stretch.
- Keep `FLOOR_ONE_MAP` authoritative for map, collision, and navigation.
- Reuse existing dependencies; no heavy UI library.
- Support desktop, ultrawide, mobile landscape, portrait, safe areas, focus, and reduced motion.

---

### Task 1: Shared HUD view model and minimap projection

**Files:**
- Create: `apps/client/src/ui/tower/towerHudModel.ts`
- Create: `apps/client/src/ui/tower/TowerMinimap.tsx`
- Test: `apps/client/tests/towerHudModel.test.ts`

**Interfaces:**
- Produces `TowerHudModel`, `createLocalTowerHudModel`, `projectFloorOneMinimap`.

- [ ] Write tests proving health/progress clamping, Local labels, and 64×64 minimap projection.
- [ ] Run tests and confirm failure from missing module.
- [ ] Implement pure model and projection.
- [ ] Run tests and confirm pass.

### Task 2: Shared Sticker Adventure HUD

**Files:**
- Create: `apps/client/src/ui/tower/TowerHud.tsx`
- Create: `apps/client/src/ui/tower/TowerPartyCard.tsx`
- Create: `apps/client/src/ui/tower/TowerActionDock.tsx`
- Create: `apps/client/src/ui/tower/tower-hud.css`
- Modify: `apps/client/src/ui/Hud.tsx`
- Modify: `apps/client/src/ui/OnlineHud.tsx`
- Test: `apps/client/tests/TowerHud.test.tsx`

**Interfaces:**
- Consumes `TowerHudModel`.
- Produces shared `TowerHud` with mode, objective, party, actions, minimap, pause, and Auto Hunt callbacks.

- [ ] Write rendering tests for Local/Online labels, progress, controls, and accessible names.
- [ ] Confirm tests fail before component exists.
- [ ] Implement shared components and adapters.
- [ ] Add anchored responsive sticker theme, focus states, reduced motion, and safe-area rules.
- [ ] Run component and existing HUD tests.

### Task 3: Layered pixel-style Floor 1 renderer

**Files:**
- Create: `apps/client/src/game/map/floorOneVisualModel.ts`
- Test: `apps/client/tests/floorOneVisualModel.test.ts`
- Modify: `apps/client/src/game/map/FloorOneRenderer.ts`

**Interfaces:**
- Produces deterministic ground-detail placements and zone palettes derived from `FLOOR_ONE_MAP`.

- [ ] Write tests for deterministic placement, collision-safe decorative points, zone palettes, and depth bands.
- [ ] Confirm expected missing-module failure.
- [ ] Implement pure visual model.
- [ ] Refactor renderer into layered ground, paths, water/slow terrain, landmarks, decor, ambient, Guardian, and portal passes.
- [ ] Run visual-model and existing map tests.

### Task 4: Encounter, portal, and responsive integration

**Files:**
- Modify: `apps/client/src/game/scenes/GameScene.ts`
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Modify: `apps/client/src/styles.css`
- Modify: `tests/e2e/phase1.spec.ts`

**Interfaces:**
- Guardian snapshot drives boss plaque/phase.
- Portal proximity drives interact-slot state and `E` prompt.

- [ ] Add tests for boss/portal HUD states through pure model inputs.
- [ ] Confirm failure.
- [ ] Connect scene/bridge events without changing authoritative rules.
- [ ] Add desktop/mobile layout assertions to Playwright test.
- [ ] Run focused tests.

### Task 5: Verification and report

**Files:**
- Create: `docs/reports/sticker-adventure-tower-ui-implementation.md`
- Modify: `docs/qa/floor-1-visual-and-gameplay-checklist.md`

- [ ] Run focused Vitest suites.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run browser QA through configured E2E runtime; report environment blockers exactly.
- [ ] Record files, results, preserved work, missing assets, limitations, and no-Git confirmation.
