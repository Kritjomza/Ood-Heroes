# Floor 1 Hybrid Illustrated Tilemap Implementation Report

## Audit Findings

- Floor 1 remains a 64 x 64 map with 32 px tiles and authoritative layers in `packages/game-core/src/floor-one-map.ts`.
- Online hero and monster PNGs were created at native dimensions. Movement animation then applied scale values centered on `1`, erasing any intended image scale and producing viewport-sized actors.
- Local and multiplayer scenes rendered interior blocked cells as dark rectangles. Local mode also used those rectangles as Arcade static bodies, coupling debug appearance to physics.
- The minimap already projects the unchanged world coordinates and therefore required no coordinate rewrite.
- Existing world assets use centralized definitions for actors, but Floor 1 environment paths were previously absent and rendering relied on Phaser rectangles/graphics.

## Skills Used

- superpowers:brainstorming
- superpowers:systematic-debugging
- superpowers:test-driven-development
- superpowers:writing-plans
- superpowers:executing-plans
- superpowers:verification-before-completion
- router
- phaser-core
- level-design
- rpg
- game-ui-ux
- impeccable
- browser:control-in-app-browser

## Implementation Summary

- Added pure display-height normalization and base-scale/motion composition. Heroes display at 72-84 world px by role; monsters display at 58 world px.
- Online click regions are reduced and foot-centered. Existing artwork origins remain near the feet.
- Removed visible blocked-cell scenery. Local static collision bodies remain active but invisible; the existing renderer debug layer can still expose collision explicitly.
- Added a centralized, validated registry of 29 replaceable Floor 1 images with stable IDs, exact public paths, dimensions, anchors, tiling, transformation, collision relationship, and layer metadata.
- Added Phaser loading plus generated fallback textures, so missing final artwork does not expose broken images or prevent scene creation.
- Replaced zone rectangles with reusable tile sprites and added deterministic transition, modular river, bridge, prop, decal, and landmark placements.
- Preserved the existing map, server authority, networking, movement, combat, spawning, room rules, terrain costs, portal behavior, and minimap projection.

## Files Changed

- `apps/client/src/game/rendering/spriteWorldScale.ts`: pure sprite normalization and composition contracts.
- `apps/client/src/game/scenes/MultiplayerScene.ts`: normalized actor rendering, preserved base scales, and removed visible collision cells.
- `apps/client/src/game/scenes/GameScene.ts`: invisible local static collision bodies and Floor 1 asset preload.
- `apps/client/src/game/map/floorOneAssetRegistry.ts`: machine-readable asset manifest.
- `apps/client/src/game/map/FloorOneAssetLoader.ts`: final-file loading and safe generated fallbacks.
- `apps/client/src/game/map/floorOneVisualModel.ts`: deterministic asset, transition, river, prop, and landmark placements.
- `apps/client/src/game/map/FloorOneRenderer.ts`: layered modular image rendering.
- `apps/client/tests/spriteWorldScale.test.ts`: scale regression tests.
- `apps/client/tests/floorOneAssetRegistry.test.ts`: registry validation tests.
- `apps/client/tests/floorOneVisualModel.test.ts`: modular layer and placement tests.
- `apps/client/public/assets/game/floor-01/README.md`: artwork drop-folder instructions.
- `docs/FLOOR_01_ASSET_REQUIREMENTS.md`: complete image specification.
- `docs/FLOOR_01_ASSET_PLACEMENT_CHECKLIST.md`: export and placement checklist.
- `docs/superpowers/specs/2026-08-03-floor-one-hybrid-illustrated-tilemap-design.md`: approved design record.
- `docs/superpowers/plans/2026-08-03-floor-one-hybrid-illustrated-tilemap.md`: implementation plan.

## Asset Root Directory

`apps/client/public/assets/game/floor-01/`

## Complete Image List

The authoritative 29-row image table is in `docs/FLOOR_01_ASSET_REQUIREMENTS.md`. It includes every ground, transition, river, prop, decal, and landmark file, with exact destination paths, dimensions, format, transparency, purpose, and status.

## Image Creation Details

Ground exports must tile on four edges. River endpoints align at module-edge midpoints. Transparent props retain 8 px padding, landmarks retain 16 px, and tall objects keep their contact point at the documented bottom-weighted origin. Collision-related art is only a visual cue; physics remains in the map data.

## Replacement Instructions

Export WebP artwork to the exact registered path, replace the generated-fallback state with the file, and restart Vite so Phaser rebuilds its texture cache. No TypeScript, map, collision, or minimap changes are required.

## Verification

- Focused Floor 1 tests: **5 passed / 5**.
- Typecheck: **passed** (`npm run typecheck`).
- Scoped lint over every changed source/test file: **passed**.
- Repository-wide lint: **blocked by 2,254 pre-existing errors inside `.agents/skills/impeccable`; no changed-file errors**.
- Production client build: **passed**. Vite reports existing large hero chunks and the existing `.env` `NODE_ENV` warning.
- Direct full Vitest run: **280 passed, 3 skipped, 3 pre-existing failures** (`PersistentUi`, `AssetRegistry`, and `prediction`).
- Standard `npm test`: **blocked because local Supabase is not running**.
- Standalone Vite client: **HTTP 200**, server starts successfully at the verification URL.
- Live browser inspection: **not completed** because the in-app browser automation runtime could not initialize in this environment. Therefore live Floor 1 loading, mobile screenshots, final character sizing, collision traversal, minimap synchronization, and console state are not claimed as visually verified.
- Impeccable detector: completed; findings were advisory pre-existing Phaser text colors/sizes, not new structural defects.

## Remaining Limitations

- Final illustration files are not present; the current renderer uses generated developer fallbacks.
- A real authenticated/local Supabase session is still required for end-to-end Floor 1, networking, and minimap verification.
- The three unrelated existing test failures and repository-wide lint configuration remain outside this task.
- The browser viewport pass must be repeated after final artwork is supplied because silhouette padding can affect perceived actor/prop size even when display bounds are correct.

