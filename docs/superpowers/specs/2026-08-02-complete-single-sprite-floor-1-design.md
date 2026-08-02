# Complete Single-Sprite Floor 1 Design

**Status:** Approved  
**Date:** 2026-08-02  
**Source of truth:** The complete single-sprite implementation brief and `odd_tower_game_design_document_v0.1.md`.

## Objective

Ship an integrated Floor 1 MVP in the existing Odd Tower application. Every hero, follower, remote hero, monster, boss, moving NPC, and summoned add uses exactly one primary world image, mirrored horizontally at runtime and animated without changing its authoritative physics transform. Floor 1 remains a 64 × 64 tile, 32-pixel-tile, 2,048 × 2,048 world with data-driven zones, collisions, navigation costs, boss rules, and portal completion.

## Existing Architecture and Migration Boundary

The repository already provides deterministic local rules, a shared 64 × 64 collision grid, four-neighbor A*, server-authoritative Colyseus movement/combat, interpolated client rendering, persistent hero progression, authentication, collection, summoning, team management, AFK rewards, and generated visual fallbacks.

The uncommitted four-pose migration is preserved except where its atlas semantics conflict with this design. Hero and monster production IDs stay stable where possible, while their world contracts become one transparent image per entity. Historical plans remain historical; active registries, validators, prompts, runtime helpers, and reports use the single-image contract.

## World Visual Architecture

`SingleSpriteMotionController` owns presentation state only. An entity view consists of a stable root/body, ground shadow, visual container, main sprite or fallback visual, health/name UI outside the visual container, and optional status/effect layers. The controller receives visual velocity, time, and action events and returns or applies visual-only transforms.

Horizontal visual velocity beyond a configurable threshold updates `left` or `right`; vertical movement, idle, joystick noise, and small network corrections preserve the last facing. The approved source orientation faces right, so right uses `flipX = false` and left uses `flipX = true`. Local views use rendered root displacement; remote views use interpolated displacement rather than raw packets.

Persistent sine motion supplies idle breathing and walk bob/squash/tilt. Profiles `light`, `normal`, `heavy`, `jelly`, `floating`, and `boss` configure amplitude and cadence. Bounded reusable action tweens handle start, stop, attack, hit, defeat, and respawn. Physics coordinates, health bars, nameplates, and shadows never inherit sprite deformation.

## Asset Contract

Each world entity definition resolves through one registry entry containing a stable ID, texture key, source path, scale, anchor, shadow scale, default facing, and motion profile. World paths use one `world.webp` per entity family. Missing or invalid files resolve to identity-safe generated fallbacks and never crash loading.

The asset audit records approved, usable, placeholder, missing, and conflicting files. Every missing image receives a self-contained English prompt before any later image generation. This implementation does not claim final artwork exists and does not require generating images.

## Floor 1 Data

`floor-one-map.ts` is a typed, Tiled-compatible map definition and the single gameplay source for dimensions, layers, zones, tile properties, object properties, collision, terrain cost, spawn groups, landmarks, arena bounds, portal objects, and minimap regions. It exposes named layers equivalent to:

`Ground_Base`, `Ground_Detail`, `Terrain_Slow`, `Decor_Below`, `Collision`, `Gameplay_Objects`, `Monster_Spawns`, `Boss_Objects`, `Portal_Objects`, `Decor_Above`, `Occlusion`, and `Debug`.

The map validator rejects incorrect dimensions, missing layers, duplicate object IDs, invalid critical properties, spawn points in the Safe Zone, disconnected required zones, and invalid portal/boss references. A derived navigation grid uses the same collision cells and terrain costs as movement. No scene maintains a second collision map.

The layout places the Portal at rows 0–8, arena at rows 8–20, Chocolate Swamp and Spicy Sauce Forest across rows 16–38, and vegetable fields/camp across rows 34–54. The camp has three broad exits and the portal lies behind the arena. Procedural Phaser rendering provides readable biome ground, paths, landmarks, obstacles, slow terrain, arena boundaries, and portal states until audited final art is available.

## Navigation and Movement

Manual movement remains normalized and collision-authoritative. Slow terrain changes movement speed through map-derived multipliers and contributes weighted path cost. Auto Hunt excludes portal cells, excludes the locked boss area, reuses paths, rate-limits recalculation, detects stuck progress, and selects another reachable target when necessary. Followers remain non-blocking and use collision-aware formation recovery.

## Boss and Portal Authority

The Angry Refrigerator is server authoritative and uses the existing combat event/state projection model. Eligibility opens the arena when the player's Floor Progress reaches 100%. The shared boss supports a frontal attack, cold-wind slow, summoned frozen-food adds, sub-30% enrage, participation rewards, wipe/reset behavior, and deterministic cleanup.

Defeat records eligible participants and unlocks the portal per player. Auto Hunt never enters it. Manual portal interaction validates eligibility on the server, records an idempotency key, persists Floor 1 completion and rewards once, and returns a completion summary. Duplicate completion attempts return the prior result without duplicating rewards. Persistence uncertainty fails closed.

## MVP Integration

Existing authentication, lobby, collection, summon, team, AFK, persistence, reconnect, combat, and contribution systems remain intact. Floor 1 adds only the minimum contracts and UI needed to enter the world, display progress/boss/portal state, complete the boss, enter the portal manually, and show the summary. Unknown assets and older incomplete snapshots degrade safely.

## Testing and Evidence

TDD covers facing thresholds, facing persistence, motion profiles, diagonal normalization, map validation, derived collision, slow-terrain cost, zone reachability, portal exclusion, boss eligibility/state transitions, boss rewards, portal idempotency, schema projection, missing-asset fallback, and completion flow. Integration checks cover map load, camera bounds, collision, follower formation, reconnect, boss unlock, and completion persistence.

Final evidence includes typecheck, lint, unit tests, integration tests, production build, asset/prompt/map validators, multiplayer/load checks where runnable, and desktop/mobile browser QA. Reports distinguish verified behavior, unrun physical-device checks, placeholder art, and remaining risks.

## Safety and Workspace Preservation

No Git commands or `.git` modifications are permitted. Existing files are read fully before targeted edits. Unrelated or uncertain pre-existing changes remain untouched and are reported. No production data is mutated. No image is generated before audit and prompt creation.
