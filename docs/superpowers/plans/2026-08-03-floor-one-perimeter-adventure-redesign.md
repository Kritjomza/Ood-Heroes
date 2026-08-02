# Floor 1 Perimeter Adventure Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-portrait-first Perimeter Adventure HUD and richer Floor 1 world while preserving all existing gameplay, multiplayer, persistence, and input contracts.

**Architecture:** Keep React presentation behind the existing `towerHudModel` boundary and move all map math into pure functions. Feed live local-player coordinates into a controlled `TowerMinimap`; let `TowerHud` own expanded-map state and focus restoration. Keep Phaser responsible only for deterministic world rendering and event-driven visual feedback.

**Tech Stack:** React 19, TypeScript 5.9, Phaser 3.90, Vite 8, Vitest 3, Testing Library, Playwright.

## Global Constraints

- Mobile portrait is the primary authored composition; mobile landscape, tablet, and desktop must remain fully functional adaptations.
- Preserve current React, Phaser, multiplayer, combat, progression, persistence, and server-authority contracts.
- Keep Bonk, Odd Skill, Snack, and Interact visible in mobile portrait.
- Minimum touch target is 44 × 44 CSS pixels; safe-area insets are required.
- Support keyboard, pointer, touch, visible focus, English, Thai, long names, large values, and `prefers-reduced-motion`.
- Use existing product truth only; locked inventory remains disabled and no unsupported gameplay is added.
- Emoji and Unicode glyphs must not be final control icons; use consistent authored SVG geometry or the incumbent icon component if one exists.
- No database or persistence schema changes.

## File Structure

- `apps/client/src/ui/tower/towerHudModel.ts`: pure HUD ratios, world-position parsing, minimap projection, static/live marker derivation.
- `apps/client/src/ui/tower/TowerMinimap.tsx`: compact and expanded semantic map renderer; no game-global reads.
- `apps/client/src/ui/tower/TowerHud.tsx`: Perimeter Adventure composition, callbacks, expanded-map state, focus handoff.
- `apps/client/src/ui/tower/tower-hud.css`: responsive portrait-first design, interaction states, safe areas, and reduced motion.
- `apps/client/src/game/map/floorOneVisualModel.ts`: deterministic zone palettes, path/decor placement, and rendering-scale constants.
- `apps/client/src/game/map/FloorOneRenderer.ts`: consume the pure visual model to render richer zones, paths, landmarks, portal, and feedback.
- `apps/client/src/ui/Hud.tsx`, `apps/client/src/ui/online/OnlineCombatHud.tsx`: supply local-player/world state and existing callbacks to the shared HUD.
- `apps/client/tests/towerHudModel.test.ts`: map math and edge-state unit tests.
- `apps/client/tests/TowerHud.test.tsx`: HUD/map interaction and accessibility tests.
- `apps/client/tests/floorOneVisualModel.test.ts`: deterministic decoration, collision safety, and scale/depth contract tests.
- `tests/e2e/combat.spec.ts`: portrait and desktop smoke coverage for real controls and map state.

---

### Task 1: Live Minimap Projection Model

**Files:**
- Modify: `apps/client/src/ui/tower/towerHudModel.ts`
- Test: `apps/client/tests/towerHudModel.test.ts`

**Interfaces:**
- Consumes: `FLOOR_ONE_MAP`, optional world coordinates in pixels, portal/guardian/target state.
- Produces: `projectWorldPoint(point, map, tileSize)`, `createFloorOneMinimapModel(input)`, `FloorOneMinimapModel`, and `MinimapMarker` with accessible `label` and `state`.

- [ ] **Step 1: Write failing projection and state tests**

```ts
it('projects and clamps a live pixel position onto Floor 1', () => {
  expect(projectWorldPoint({ x: 1024, y: 512 }, FLOOR_ONE_MAP, 32)).toEqual({ x: 0.5, y: 0.25 });
  expect(projectWorldPoint({ x: -20, y: 99999 }, FLOOR_ONE_MAP, 32)).toEqual({ x: 0, y: 1 });
});

it('derives live portal, guardian, and player map state', () => {
  const model = createFloorOneMinimapModel({
    map: FLOOR_ONE_MAP,
    tileSize: 32,
    player: { x: 1024, y: 1536, facing: 'left' },
    portalUnlocked: true,
    guardianActive: true,
  });
  expect(model.player).toMatchObject({ x: 0.5, y: 0.75, facing: 'left' });
  expect(model.markers.find((item) => item.kind === 'portal')?.state).toBe('ready');
  expect(model.markers.find((item) => item.kind === 'boss')?.state).toBe('active');
});
```

- [ ] **Step 2: Run the focused model tests and verify RED**

Run: `npx vitest run apps/client/tests/towerHudModel.test.ts`

Expected: FAIL because `projectWorldPoint` and `createFloorOneMinimapModel` do not exist.

- [ ] **Step 3: Implement pure projection and marker-state functions**

```ts
export type WorldPoint = { x: number; y: number };
export type MinimapPlayer = { x: number; y: number; facing: 'left' | 'right' | 'up' | 'down' };
export type FloorOneMinimapInput = {
  map: typeof FLOOR_ONE_MAP;
  tileSize: number;
  player?: WorldPoint & { facing?: MinimapPlayer['facing'] };
  portalUnlocked?: boolean;
  guardianActive?: boolean;
  target?: WorldPoint & { id: string; label: string };
};

export function projectWorldPoint(point: WorldPoint, map: typeof FLOOR_ONE_MAP, tileSize: number) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return { x: clamp(point.x / Math.max(1, map.width * tileSize)), y: clamp(point.y / Math.max(1, map.height * tileSize)) };
}
```

Extend marker derivation so all markers have `label`, portal/guardian markers have explicit state, missing live inputs are omitted safely, and zero denominators cannot produce `NaN`.

- [ ] **Step 4: Run model tests and verify GREEN**

Run: `npx vitest run apps/client/tests/towerHudModel.test.ts`

Expected: PASS with projection, clamping, static-marker, and live-state coverage.

- [ ] **Step 5: Commit the model boundary**

```powershell
git add apps/client/src/ui/tower/towerHudModel.ts apps/client/tests/towerHudModel.test.ts
git commit -m "feat: add live Floor 1 minimap model"
```

### Task 2: Functional Compact and Expanded Map

**Files:**
- Modify: `apps/client/src/ui/tower/TowerMinimap.tsx`
- Modify: `apps/client/src/ui/tower/TowerHud.tsx`
- Test: `apps/client/tests/TowerHud.test.tsx`

**Interfaces:**
- Consumes: `FloorOneMinimapModel`, `expanded`, `onOpen`, `onClose`, and an opener ref managed by `TowerHud`.
- Produces: semantic compact map button and `role="dialog"` expanded map with zone labels, legend, close/Escape/backdrop behavior, and focus restoration.

- [ ] **Step 1: Write failing map interaction tests**

```tsx
it('opens the Floor 1 map and restores focus when closed', () => {
  render(<TowerHud model={model} minimap={minimap} onToggleAuto={vi.fn()} onPause={vi.fn()} />);
  const opener = screen.getByRole('button', { name: /open floor 1 map/i });
  fireEvent.click(opener);
  expect(screen.getByRole('dialog', { name: /floor 1 map/i })).toBeInTheDocument();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: /floor 1 map/i })).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});

it('keeps all four primary actions present', () => {
  render(<TowerHud model={model} minimap={minimap} onToggleAuto={vi.fn()} onPause={vi.fn()} />);
  for (const name of ['Bonk', 'Odd skill', 'Snack', 'Interact']) expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run: `npx vitest run apps/client/tests/TowerHud.test.tsx`

Expected: FAIL because `TowerHud` has no `minimap` prop and the minimap is not interactive.

- [ ] **Step 3: Implement controlled minimap and dialog behavior**

```tsx
export type TowerMinimapProps = {
  model: FloorOneMinimapModel;
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
  openerRef: React.RefObject<HTMLButtonElement | null>;
};
```

Use native buttons, an expanded `role="dialog" aria-modal="true"`, a visible close control, document Escape handling only while open, backdrop close only when the backdrop itself is activated, and `openerRef.current?.focus()` after close. Render marker labels for the expanded view and concise accessible text for the compact view.

- [ ] **Step 4: Run component tests and verify GREEN**

Run: `npx vitest run apps/client/tests/TowerHud.test.tsx`

Expected: PASS with open, close, Escape, callbacks, focus restoration, and four-action coverage.

- [ ] **Step 5: Commit functional map interactions**

```powershell
git add apps/client/src/ui/tower/TowerMinimap.tsx apps/client/src/ui/tower/TowerHud.tsx apps/client/tests/TowerHud.test.tsx
git commit -m "feat: add interactive Floor 1 map"
```

### Task 3: Wire Real Local-Player and World State

**Files:**
- Modify: `apps/client/src/game/bridge.ts`
- Modify: `apps/client/src/game/multiplayer/MultiplayerBridge.ts`
- Modify: `apps/client/src/ui/Hud.tsx`
- Modify: `apps/client/src/ui/online/OnlineCombatHud.tsx`
- Modify: `apps/client/src/game/scenes/GameScene.ts`
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Test: `apps/client/tests/Hud.test.tsx`
- Test: `apps/client/tests/OnlineUi.test.tsx`

**Interfaces:**
- Consumes: authoritative scene player position, facing, portal unlock, and guardian state.
- Produces: `HudWorldState = { player?: { x: number; y: number; facing: Direction }; portalUnlocked: boolean; guardianActive: boolean }` exposed through existing bridge subscriptions and passed into `createFloorOneMinimapModel`.

- [ ] **Step 1: Write failing local and online wiring tests**

```tsx
it('passes live world coordinates to the shared tower map', () => {
  render(<Hud state={{ ...initialHudState, world: { player: { x: 640, y: 320, facing: 'left' }, portalUnlocked: false, guardianActive: false } }} {...callbacks} />);
  expect(screen.getByLabelText(/player at 31 percent, 16 percent/i)).toBeInTheDocument();
});
```

Add the equivalent online test using `initialMultiplayerState.world` so both modes prove the shared map receives real data.

- [ ] **Step 2: Run focused UI tests and verify RED**

Run: `npx vitest run apps/client/tests/Hud.test.tsx apps/client/tests/OnlineUi.test.tsx`

Expected: FAIL because current bridge/UI state lacks structured world data.

- [ ] **Step 3: Add structured world state to existing bridge updates**

Add `world` to local and multiplayer UI state. Publish only when position/facing or portal/guardian state changes enough to alter presentation. Keep the existing display `position` string temporarily if other diagnostics consume it; do not parse that string inside components.

- [ ] **Step 4: Build the minimap model at the UI boundary**

```ts
const minimap = createFloorOneMinimapModel({
  map: FLOOR_ONE_MAP,
  tileSize: WORLD.tileSize,
  player: state.world.player,
  portalUnlocked: state.world.portalUnlocked,
  guardianActive: state.world.guardianActive,
});
```

Pass `minimap` into `TowerHud` in both local and online compositions without changing existing pause, leave, auto-hunt, or interaction callbacks.

- [ ] **Step 5: Run UI and bridge tests and verify GREEN**

Run: `npx vitest run apps/client/tests/Hud.test.tsx apps/client/tests/OnlineUi.test.tsx apps/client/tests/MultiplayerBridge.test.ts`

Expected: PASS; local and online player markers reflect supplied coordinates.

- [ ] **Step 6: Commit live state wiring**

```powershell
git add apps/client/src/game/bridge.ts apps/client/src/game/multiplayer/MultiplayerBridge.ts apps/client/src/ui/Hud.tsx apps/client/src/ui/online/OnlineCombatHud.tsx apps/client/src/game/scenes/GameScene.ts apps/client/src/game/scenes/MultiplayerScene.ts apps/client/tests/Hud.test.tsx apps/client/tests/OnlineUi.test.tsx
git commit -m "feat: wire live world state into tower HUD"
```

### Task 4: Portrait-First Perimeter Adventure HUD

**Files:**
- Modify: `apps/client/src/ui/tower/TowerHud.tsx`
- Modify: `apps/client/src/ui/tower/TowerMinimap.tsx`
- Replace: `apps/client/src/ui/tower/tower-hud.css`
- Test: `apps/client/tests/TowerHud.test.tsx`

**Interfaces:**
- Consumes: existing `TowerHudModel`, the Task 1 minimap model, and existing callbacks.
- Produces: stable semantic regions and state class names: `tower-leader-plaque`, `tower-floor-ribbon`, `tower-job-ticket`, `tower-tool-rail`, `tower-action-dock`, `tower-map-trigger`, and `tower-map-dialog`.

- [ ] **Step 1: Add failing semantic/state tests**

```tsx
it('exposes named perimeter regions and honest tool states', () => {
  renderHud();
  expect(screen.getByRole('region', { name: /party status/i })).toBeInTheDocument();
  expect(screen.getByRole('region', { name: /floor objective/i })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: /combat actions/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /inventory locked/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /auto hunt/i })).toHaveAttribute('aria-pressed');
});
```

- [ ] **Step 2: Run the HUD tests and verify RED**

Run: `npx vitest run apps/client/tests/TowerHud.test.tsx`

Expected: FAIL on the new region names and action navigation label.

- [ ] **Step 3: Recompose JSX without changing callback semantics**

Use inline authored SVG icon components local to the tower UI for heart, attack, swirl, snack, door, bag, swords, map, pause, leave, party, and connection. Preserve exact button callbacks, disabled behavior, numeric values, and accessible names.

- [ ] **Step 4: Implement portrait-first CSS**

Define a single safe-area HUD grid. At portrait widths, place leader and floor regions at top, leave the center empty, keep all four actions in a two-by-two or four-column dock according to available width, place the job ticket above the dock, and place minimap/tool rail on the opposite edge. At `min-width: 700px` or landscape, adapt to perimeter corners; at desktop, reveal companion details without enlarging the central obstruction.

Include ready/hover/focus/active/disabled/cooldown classes, immediate visual meter values, 44px targets, tabular numerals, opaque readable surfaces, and `@media (prefers-reduced-motion: reduce)` overrides.

- [ ] **Step 5: Run HUD tests and build**

Run: `npx vitest run apps/client/tests/TowerHud.test.tsx && npm run build:client`

Expected: PASS with no TypeScript or Vite build errors.

- [ ] **Step 6: Commit the responsive HUD**

```powershell
git add apps/client/src/ui/tower/TowerHud.tsx apps/client/src/ui/tower/TowerMinimap.tsx apps/client/src/ui/tower/tower-hud.css apps/client/tests/TowerHud.test.tsx
git commit -m "feat: redesign Floor 1 perimeter HUD"
```

### Task 5: Rich Deterministic Floor 1 World

**Files:**
- Modify: `apps/client/src/game/map/floorOneVisualModel.ts`
- Modify: `apps/client/src/game/map/FloorOneRenderer.ts`
- Test: `apps/client/tests/floorOneVisualModel.test.ts`

**Interfaces:**
- Consumes: `FLOOR_ONE_MAP`, collision rectangles, zone objects, and deterministic seed.
- Produces: `FloorOneVisualModel` with `details`, `zoneStyles`, `paths`, `landmarks`, and `scale` constants consumed by `FloorOneRenderer`.

- [ ] **Step 1: Write failing visual-model tests**

```ts
it('builds deterministic collision-safe authored world layers', () => {
  const first = createFloorOneVisualModel(FLOOR_ONE_MAP, 1931);
  const second = createFloorOneVisualModel(FLOOR_ONE_MAP, 1931);
  expect(first).toEqual(second);
  expect(first.paths.length).toBeGreaterThan(0);
  expect(first.zoneStyles.map((zone) => zone.id)).toEqual(expect.arrayContaining(['central_camp', 'guardian_arena']));
  expect(first.details.every((detail) => !first.blocked.has(`${detail.tileX},${detail.tileY}`))).toBe(true);
  expect(first.scale.heroMaxTiles).toBeLessThanOrEqual(3);
});
```

- [ ] **Step 2: Run the visual-model test and verify RED**

Run: `npx vitest run apps/client/tests/floorOneVisualModel.test.ts`

Expected: FAIL because paths, zone styles, and scale contracts do not exist.

- [ ] **Step 3: Extend the pure visual model**

Add named zone color/material roles, centerline route segments derived from existing landmark/spawn relationships, collision-safe detail exclusion radii around interactive objects, and scale constants for hero, boss, labels, shadows, and foreground layers. Keep generation seed-stable.

- [ ] **Step 4: Render the richer model in Phaser**

Replace flat zone treatment with layered base/edge treatment, render paths below characters, add zone-specific deterministic details, improve landmark plaques, use grounded ellipse shadows, and add a portal shimmer that can be disabled under reduced motion. Do not move physics bodies or authoritative transforms.

- [ ] **Step 5: Run visual-model and existing world tests**

Run: `npx vitest run apps/client/tests/floorOneVisualModel.test.ts apps/client/tests/worldVisuals.test.ts apps/client/tests/singleSpriteMotion.test.ts`

Expected: PASS; generated data is deterministic and character motion contracts remain unchanged.

- [ ] **Step 6: Commit the world presentation**

```powershell
git add apps/client/src/game/map/floorOneVisualModel.ts apps/client/src/game/map/FloorOneRenderer.ts apps/client/tests/floorOneVisualModel.test.ts
git commit -m "feat: enrich deterministic Floor 1 world"
```

### Task 6: Purposeful Feedback and Regression Verification

**Files:**
- Modify: `apps/client/src/game/map/FloorOneRenderer.ts`
- Modify: `apps/client/src/ui/tower/tower-hud.css`
- Modify: `tests/e2e/combat.spec.ts`
- Create: `docs/reports/floor-one-perimeter-adventure-implementation.md`

**Interfaces:**
- Consumes: existing attack, hit, pickup, guardian, objective, and portal state changes already exposed in the scene/UI.
- Produces: bounded visual-only feedback presets and a verification report; no gameplay-state mutation.

- [ ] **Step 1: Add failing end-to-end assertions for critical controls**

Add a mobile portrait Playwright case at `390 × 844` that enters Floor 1, confirms all four action buttons are visible, opens/closes the map, toggles auto-hunt, and confirms the minimap player marker exists. Add a desktop case at `1440 × 900` that confirms pause/leave and map controls remain reachable.

- [ ] **Step 2: Run the focused E2E test and verify RED**

Run: `npx playwright test tests/e2e/combat.spec.ts --project=chromium`

Expected: FAIL on the new portrait visibility or expanded-map assertions until final wiring/styles are complete.

- [ ] **Step 3: Add proportional feedback presets**

Implement small feedback for button/pickup events, medium feedback for hits/abilities, and large feedback for guardian defeat/portal unlock. Use eased CSS/Phaser tweens and decaying camera visual offset only. Ensure all effects return to rest, do not delay input, and honor reduced motion.

- [ ] **Step 4: Run automated verification**

Run:

```powershell
npx vitest run apps/client/tests/towerHudModel.test.ts apps/client/tests/TowerHud.test.tsx apps/client/tests/floorOneVisualModel.test.ts apps/client/tests/Hud.test.tsx apps/client/tests/OnlineUi.test.tsx
npm run typecheck
npm run build:client
npx playwright test tests/e2e/combat.spec.ts --project=chromium
```

Expected: all commands PASS without new warnings or errors.

- [ ] **Step 5: Perform the bounded visual inspection**

Capture the live game once at `390 × 844`, `844 × 390`, and `1440 × 900`. Check center obstruction, text contrast, action reachability, map legibility, safe areas, long-name resilience, disabled/focus states, world scale, and reduced motion. Fix all material defects in one batch and confirm the same three viewports once more.

- [ ] **Step 6: Run Impeccable detector and finish review**

Run `node .agents/skills/impeccable/scripts/detect.mjs --json` against the changed UI targets once. Record mechanical fixes and any accepted findings. Complete the required Impeccable finish-review and DESIGN.md documentation flow using the installed skill instructions.

- [ ] **Step 7: Write the implementation report**

Document changed behavior, test/build commands and results, viewport screenshots, remaining known limitations, and confirmation that persistence/multiplayer contracts were unchanged in `docs/reports/floor-one-perimeter-adventure-implementation.md`.

- [ ] **Step 8: Commit verification artifacts**

```powershell
git add apps/client/src/game/map/FloorOneRenderer.ts apps/client/src/ui/tower/tower-hud.css tests/e2e/combat.spec.ts docs/reports/floor-one-perimeter-adventure-implementation.md
git commit -m "test: verify Floor 1 perimeter adventure redesign"
```

## Final Acceptance Run

Run `git status --short` and confirm only intentional artifacts remain. Re-run the focused Vitest suite, `npm run typecheck`, `npm run build:client`, and the Chromium combat E2E test from Task 6. Compare the final implementation against every acceptance criterion in `docs/superpowers/specs/2026-08-03-floor-one-perimeter-adventure-redesign.md` before claiming completion.
