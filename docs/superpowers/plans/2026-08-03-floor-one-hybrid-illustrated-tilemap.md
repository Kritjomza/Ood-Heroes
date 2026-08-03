# Floor 1 Hybrid Illustrated Tilemap Implementation Plan

**Goal:** Deliver a replaceable, modular illustrated Floor 1 without changing gameplay authority.

**Architecture:** Keep the existing map definition authoritative. Add pure sprite-sizing and asset-registry boundaries, then let `FloorOneRenderer` consume deterministic placements and loaded-or-generated textures.

**Tech Stack:** Phaser 3.90, TypeScript 5.9, Vitest, Vite.

## Constraints

- Do not use Git or modify Git state.
- Preserve networking, combat, movement, spawns, rooms, minimap coordinates, and database behavior.
- Final files replace placeholders at stable paths without code edits.

### Task 1: Scale and collision defects

- Add failing pure tests for display-height normalization and base-scale composition.
- Implement the sizing helpers and apply them to online heroes and monsters.
- Keep physics/click bodies foot-centered and smaller than artwork.
- Remove visible collision rectangles while retaining invisible bodies and optional debug rendering.

### Task 2: Asset registry and fallbacks

- Add failing tests for unique IDs/paths and complete metadata.
- Add the centralized Floor 1 registry and exact public asset paths.
- Load registered images and generate safe fallback textures for missing assets.

### Task 3: Illustrated map layers

- Extend the deterministic model with zones, ground cells, river segments, props, decals, landmarks, depths, rotation, and mirroring rules.
- Render all layers from stable asset IDs while preserving coordinates.
- Keep collision and terrain cost independent from artwork.

### Task 4: Documentation and verification

- Create the complete asset requirements and placement checklist.
- Run focused tests, full typecheck, lint, full tests, and production build.
- Perform one desktop/mobile visual pass and one confirmation pass, recording honest limitations.

