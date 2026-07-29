# Odd Tower Phase 1 Core Local Prototype Implementation Plan

> **For agentic workers:** Implement task-by-task with red/green/refactor TDD for deterministic rules.

**Goal:** Ship a polished local Phaser/React vertical slice where a three-hero team explores one floor, auto-fights, levels, respawns, and can Auto Hunt safely.

**Architecture:** `packages/game-core` owns strict, deterministic, DOM-free rules. `apps/client` owns Phaser rendering/Arcade Physics and React HUD/lifecycle, communicating through a typed event bridge. A programmatic 64×64 collision grid is the single source for Phaser obstacles and A\* walkability.

**Tech Stack:** npm workspaces, React, TypeScript strict mode, Vite, Phaser 3, Vitest, Testing Library, Playwright, ESLint, Prettier.

## Global Constraints

- Phase 1 is local single-player only; no persistence, networking, collection, economy, boss, portal, PvP, audio, or final artwork.
- Four-direction movement and four-direction deterministic A\* only.
- Tunable gameplay values live in typed configuration.
- React receives meaningful bridge events, never per-frame state updates.
- Runtime-generated shapes provide all placeholder art.

## Exact File Map

- Root: `package.json`, lockfile, TypeScript/ESLint/Prettier/Playwright configs, `README.md` — workspace commands and developer entry points.
- `packages/game-core/src/{types,config,math,combat,progression,formation,navigation,auto-hunt,monster-ai,simulation,map}.ts` — pure rules and fixed-step world simulation.
- `packages/game-core/tests/*.test.ts` — behavior and state-transition tests for every deterministic acceptance area.
- `apps/client/src/game/{bridge,createGame,scenes/GameScene}.ts` — typed bridge, Phaser lifecycle, rendering, input, collision, camera, and simulation synchronization.
- `apps/client/src/ui/{Hud,Joystick,ErrorBoundary}.tsx`, `apps/client/src/styles.css` — accessible responsive HUD, touch input, pause/error states.
- `apps/client/src/{App,main}.tsx`, `apps/client/index.html` — React application shell.
- `apps/client/tests/*.test.tsx` — HUD interaction, state updates, countdown, pause, and cleanup.
- `tests/e2e/phase1.spec.ts` — observable browser smoke and responsive layout checks.
- `docs/phase-1-handoff.md` — architecture, gameplay, tuning, map/art replacement, evidence, limitations, Phase 2 seam.

## Implementation Order

### 1. Workspace and test harness

- [ ] Initialize npm workspaces and strict shared tooling.
- [ ] Install only the mandated runtime and verification dependencies.
- [ ] Confirm an empty Vitest suite and strict typecheck execute.

### 2. Pure domain model, configuration, and validation

- [ ] Write failing tests for entity/map configuration guards.
- [ ] Implement typed entities, balance values, factories, math helpers, and guards.
- [ ] Run focused tests and commit the coherent foundation.

### 3. Combat and progression

- [ ] Write failing tests for damage, RNG repeatability, cooldowns, one-time rewards, EXP curve, multi-level growth, cap, and HP growth.
- [ ] Implement minimal combat and progression functions, then refactor shared rounding.
- [ ] Run focused and full unit tests.

### 4. Formation, map, and navigation

- [ ] Write failing tests for directional offsets, follow/recovery, map bounds, straight/blocked/unreachable/deterministic paths.
- [ ] Implement programmatic collision grid and deterministic cardinal A\*.
- [ ] Verify every monster spawn is outside the Safe Zone and reachable.

### 5. Monster AI, Auto Hunt, and simulation

- [ ] Write failing transition tests for aggro/leash/safe-zone/respawn and all Auto Hunt safety states.
- [ ] Implement fixed-step simulation, target selection, path throttling, attacks, rewards, healing, wipe countdown, and clean respawn.
- [ ] Run the full game-core suite.

### 6. Phaser presentation

- [ ] Build one scene with runtime textures, Arcade bodies/obstacle colliders, bounds, cardinal keyboard input, focus targeting, smooth bounded camera, and formation interpolation.
- [ ] Mount/destroy exactly one Phaser instance under React Strict Mode and clean all listeners on shutdown.
- [ ] Expose observable position/status diagnostics for smoke tests without coupling React to frames.

### 7. React HUD and mobile controls

- [ ] Write failing component tests for controls, bridge updates, pause/countdown, and unsubscription.
- [ ] Implement responsive safe-area HUD, accessible controls, four-way pointer joystick, cancellation/reset handling, error boundary, and initialization error UI.
- [ ] Verify desktop and mobile-landscape layouts.

### 8. Browser tests, documentation, and release checks

- [ ] Add Playwright checks for load, one canvas, HUD, movement, Auto Hunt/cancel, and mobile overlap.
- [ ] Write README and handoff with exact scope and extension seams.
- [ ] Run format, lint, typecheck, unit/coverage, build, E2E, diff checks, and manual browser verification; record only observed evidence.

## Test Strategy

- Unit: deterministic pure functions and state transitions using injected RNG and explicit timestamps.
- Component: bridge-driven React behavior with real subscription cleanup.
- E2E: observable DOM diagnostics and canvas/HUD interaction; no arbitrary sleeps.
- Manual: keyboard, emulated touch, collisions, formation, camera, combat loop, retreat/recovery, wipe/respawn, pause, resize, and console inspection.

## Dependency Decisions

- Phaser Arcade Physics is the only physics system.
- Internal A\* avoids a pathfinding dependency.
- React context/state plus a small typed emitter avoids a state-management dependency.
- Runtime geometry avoids art and asset-pipeline dependencies.

## Verification Commands

`npm ci`; `npm run format:check`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run test:coverage`; `npm run build`; `npm run test:e2e`; `git diff --check`; `git status --short`; `git diff --stat`.

## Self-review

The plan covers every Phase 1 subsystem, keeps excluded future systems absent, defines the React/Phaser/core interfaces, and contains no deferred placeholders. The main risk is scene breadth; it is contained by keeping all rules in small pure modules and limiting Phaser to adapter/render responsibilities.
