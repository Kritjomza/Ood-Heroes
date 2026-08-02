# Hero Directional Sprite and Google Flow Workflow Design

**Status:** Draft for review  
**Date:** 2026-08-02  
**Scope:** Specification only; no runtime migration, image generation, atlas assembly, or production-asset movement is authorized by this document.

## 1. Decision Summary

Odd Tower will replace the 54 wired hero idle, walk, and attack atlas IDs with six four-direction static gameplay atlas IDs. Persistent hero identity will travel through multiplayer state as `definitionId`, independent from combat `role`, and the Phaser renderer will select hero artwork using `definitionId`.

The prompt library will also be split into small production files. This split is a documentation and Google Flow production-workflow decision; it does not alter runtime behavior or production IDs. The `definitionId` data flow, directional frame selection, tween motion, reconnect behavior, and fallback renderer are runtime changes.

The target production contract is:

| Metric | Target |
|---|---:|
| Wired production asset IDs | 75 |
| P0 | 39 |
| P1 | 17 |
| P2 | 19 |
| Hero directional atlas deliverables | 6 |
| Hero directional source images | 24 static images |
| Monster atlas deliverables / source frames | 5 / 40 |
| Animated VFX deliverables / source frames | 5 / 40 |
| Retained animated frames | 80 |
| Total visual source frames | 104 |

The fifth animated VFX is `ui.summon.reveal_glow`, a wired P0 manifest entry with eight frames. The other four are P1 entries in the `vfx.*` namespace. Therefore the active 123-ID manifest currently contains five animated VFX even though only four IDs start with `vfx.`.

## 2. Goals and Non-Goals

### Goals

- Preserve all six persistent hero identities from team selection through room join, reconnect, respawn, and state resynchronization.
- Make `definitionId` authoritative for hero visual selection while keeping `role` authoritative for combat behavior.
- Use one transparent 384 × 96 WebP gameplay atlas per hero, containing down, up, left, and right static frames.
- Replace sprite animation with code-driven Phaser motion and separate VFX overlays.
- Remove obsolete hero animation IDs from all active contracts, generators, loaders, validators, tests, inventories, and prompt ownership.
- Give every Google Flow source image a unique filename, intake path, prompt owner, parent asset, and atlas position or static destination.
- Separate prompt ownership by hero, monster, VFX family, boss family, and Floor 1 environment family.
- Keep wired production assets and pending GDD assets explicitly separated.

### Non-Goals

- Generating any images.
- Moving or overwriting production assets.
- Defining runtime contracts for pending bosses, minions, or unwired Floor 1 environment assets.
- Changing production IDs beyond the approved hero atlas migration.
- Changing combat behavior classifications or deriving `definitionId` from `role`.
- Adding Floors 2–10 or P2 polish to the immediate production batch.

## 3. Production Asset Migration

### 3.1 Removed IDs

For each of six hero slugs, remove these nine patterns from the active production contract:

- `hero.<slug>.sprite_idle_down`
- `hero.<slug>.sprite_idle_up`
- `hero.<slug>.sprite_idle_left`
- `hero.<slug>.sprite_idle_right`
- `hero.<slug>.sprite_walk_down`
- `hero.<slug>.sprite_walk_up`
- `hero.<slug>.sprite_walk_left`
- `hero.<slug>.sprite_walk_right`
- `hero.<slug>.sprite_attack`

This removes exactly 54 P1 IDs and 432 animation frames. They are historical/deprecated identifiers, not required placeholders or production deliverables. No prompt may continue to own them.

### 3.2 Added IDs

Add exactly these six P1 IDs:

- `hero.grilled_chicken.sprite_directional`
- `hero.pink_chocolate_lizard.sprite_directional`
- `hero.robot_jelly.sprite_directional`
- `hero.tofu_rabbit.sprite_directional`
- `hero.accountant_octopus.sprite_directional`
- `hero.samurai_bread.sprite_directional`

Each points to `/assets/final/hero/<hero_slug>/sprite_directional.webp`, subject to exact confirmation by the regenerated active manifest. A discrepancy in a generated replacement path must stop implementation and be reported; an old atlas path must not be reused silently.

The count changes from 123 to 75: `123 - 54 + 6 = 75`. Priority totals change from P0/P1/P2 `39/65/19` to `39/17/19`.

## 4. Hero Directional Atlas Contract

Every hero gameplay atlas has this fixed contract:

| Field | Contract |
|---|---|
| Format | WebP |
| Background | Transparent |
| Frame size | 96 × 96 px |
| Atlas size | 384 × 96 px |
| Frame count | 4 static frames |
| Layout | One horizontal row |
| Frame 0 | down |
| Frame 1 | up |
| Frame 2 | left |
| Frame 3 | right |
| Anchor | 0.5, 0.82 |

The 24 directional source images are static review and assembly inputs, not animated frames and not production assets. Each source is normalized before assembly: common foot baseline, stable contact point, consistent occupied area, silhouette scale, transparent margins, camera angle, and lighting.

Google Flow generates the four isolated sources separately. It must never be asked to generate an assembled atlas. After all four are approved, a deterministic local assembly tool validates 96 × 96 transparent inputs and concatenates them in down/up/left/right order.

## 5. Multiplayer `definitionId` Migration

### 5.1 Identity Semantics

- `definitionId` is the persistent hero-definition identity, such as `hero_001_grilled_chicken`.
- `role` remains the combat-behavior classification used by simulation and AI.
- Neither value is derived from the other.
- Multiple definitions may share a combat role without sharing artwork.

### 5.2 Authoritative Data Flow

The selected persistent hero's definition ID is copied, never inferred, through:

1. persistent team selection and combat initialization;
2. `CombatHeroInput` and the authoritative combat simulation hero state;
3. the network protocol combat-hero shape;
4. Colyseus `HeroCombatSchema` and room-state projection;
5. serialized room snapshots, patches, reconnects, respawns, and resyncs;
6. client multiplayer state normalization;
7. Phaser hero-view creation and refresh;
8. texture selection and generated-shape fallback.

The server validates selected IDs against enabled `HERO_DEFINITIONS` when initializing combat. The simulation retains the validated ID on respawn and reset. Schema projection updates `definitionId` on both initial creation and subsequent state synchronization.

### 5.3 Compatibility and Safe Failure

Current servers always emit `definitionId`. Older room state may omit it. Client normalization maps absent/non-string values to an empty identity marker and renders a neutral generated fallback; it must not guess from `role`. Unknown IDs are preserved in client state for diagnostics and also render the neutral fallback.

This is additive at the protocol/schema boundary but visually incompatible with older rooms that do not send identity: those rooms remain playable with fallback shapes. New clients must not crash, disconnect, or relabel the hero. New servers reject invalid persistent selections at initialization using existing validation/error conventions.

## 6. Phaser Rendering and Tween Motion

The multiplayer scene replaces fixed role-owned hero visuals with hero views keyed by combat hero instance ID. Each view retains `definitionId`, direction, current texture/fallback, base scale, and transient tween state.

A fixed lookup maps each known `definitionId` to its approved production atlas ID. Direction maps to frames down `0`, up `1`, left `2`, right `3`. Current velocity selects movement direction; attack direction temporarily takes precedence during the attack event. If neither changes, the last valid direction remains.

The same directional frame supports all runtime states:

- movement bobbing and small positional bounce;
- slight squash/stretch and directional tilt;
- short attack lunge and recoil;
- hit flash and shake;
- defeat squash, rotation, and fade;
- separate combat VFX overlays.

Tweens operate relative to a stable base transform so repeated snapshot updates do not accumulate offsets. State changes cancel or reconcile conflicting tweens deterministically. Atlas loading failure, missing files, invalid dimensions, missing frames, unknown `definitionId`, or empty legacy identity all select a generated-shape fallback without mutating `definitionId`.

Reconnect/resync destroys orphaned views, creates missing views, reapplies authoritative identity/direction/state, and restores fallback or atlas textures from the latest snapshot. It does not depend on animation history.

## 7. Prompt-File Architecture Evaluation

The proposed split is optimal with the large family files converted into navigation indexes. Per-character files reduce copy mistakes and make review status local. A single VFX file is appropriate because the five families share one assembly/validation pattern and remain small enough to review together. Boss and environment files stay separate because they are pending and have unresolved runtime contracts.

The main trade-off is repetition: self-contained directional prompts repeat invariants. That repetition is intentional at prompt level because Google Flow must not be assumed to remember prior text. Shared indexes must not duplicate full prompts, which prevents ambiguous ownership.

### 7.1 Target Tree

```text
art-prompts/
  00_asset_inventory.md
  01_odd_tower_style_dna.md
  02_hero_master_designs.md            # index
  03_hero_animation_prompts.md         # directional gameplay index; historical name retained
  04_monster_prompts.md                # index
  05_boss_prompts.md                   # index
  06_floor_1_environment_prompts.md    # index
  07_tiles_and_props.md
  08_vfx_prompts.md                    # index
  09_items_and_rewards.md
  10_ui_and_hud_prompts.md
  11_future_floor_concepts.md
  12_generation_order.md
  13_asset_consistency_checklist.md
  14_google_flow_file_manifest.md
  heroes/
    hero_grilled_chicken.md
    hero_pink_chocolate_lizard.md
    hero_robot_jelly.md
    hero_tofu_rabbit.md
    hero_accountant_octopus.md
    hero_samurai_bread.md
  monsters/
    monster_grumpy_radish.md
    monster_jumping_sauce_bag.md
    monster_shoe_biting_dust_ball.md
    monster_wild_sausage.md
    monster_lost_pudding.md
  vfx/
    floor_1_vfx.md
  bosses/
    boss_angry_refrigerator.md
    boss_frozen_food_minions.md
  environments/floor_1/
    floor_1_world_master.md
    central_camp.md
    beginner_vegetable_patch.md
    spicy_sauce_forest.md
    chocolate_swamp.md
    floor_guardian_arena.md
    portal_area.md
    floor_1_structures.md
    floor_1_tiles_and_transitions.md
```

No existing shared file needs deletion. Files `02`, `03`, `04`, `05`, `06`, and `08` become indexes. `03_hero_animation_prompts.md` retains its filename to avoid broken documentation links but its title and content explicitly describe static directional sprites, not animation.

### 7.2 Ownership Rules

- Each hero file exclusively owns that hero's master reference, portrait, icon, collection card, and four directional source prompts.
- Each monster file exclusively owns that monster's master reference and eight source-frame prompts.
- `vfx/floor_1_vfx.md` exclusively owns the five wired animated VFX families, including P0 `ui.summon.reveal_glow`.
- Boss files exclusively own their provisional boss/minion prompts.
- Each environment file owns only its named pending family.
- Existing shared static prompt files keep ownership of wired non-hero static P0/P1 assets unless the ownership audit assigns a more specific existing file.
- Indexes link to owners and contain counts, order, status, and summaries only—never full duplicate prompts.
- Pending assets use `PENDING-F1-*`, status `Pending Implementation — GDD Requirement`, no production path, and no invented dimensions, anchors, or atlas layouts.

## 8. Prompt Contracts

Each hero file contains the 18 required sections: identity, `definitionId`, role, proposed design, invariants, master prompt, portrait, icon, collection card, four directional prompts, atlas assembly, filenames, intake paths, production paths, negatives, 48 px checks, consistency, and approval. Proposed designs are labeled **Proposed Visual Design — Becomes Master Reference if Approved**.

Every directional prompt repeats material, head shape, proportions, silhouette, palette, costume, signature item, face, chocolate `#2b1a14` outline, upper-left lighting, orthographic three-quarter top-down camera, stable contact point, transparent background, and 48 px readability. When an approved master image is supplied, the prompt explicitly names it as the identity reference.

Each monster file preserves the audited eight-frame mapping: down idle, down move, up idle, up move, left idle, left move, right idle, right move. Individual frames are generated and reviewed before deterministic atlas assembly; Google Flow never generates the atlas.

The VFX file contains eight isolated frame prompts for each of `ui.summon.reveal_glow`, `vfx.attack_hit`, `vfx.heal`, `vfx.movement_slow`, and `vfx.charge_warning`. It documents parent ID, purpose, footprint, visual language, exact sequence/order, path, dimensions, transparency, loop/one-shot behavior, negative prompt, and validation.

## 9. Google Flow Intake Architecture

### 9.1 Hero Sources

Pattern: `hero_<slug>_direction_<down|up|left|right>.webp`  
Intake: `art-review/incoming/heroes/<slug>/`  
Assembled review output: `hero_<slug>_sprite_directional.webp`  
Production: `/assets/final/hero/<slug>/sprite_directional.webp`

Exactly 24 unique hero directional source filenames exist. Individual sources have no production path.

### 9.2 Monster Sources

Pattern: `monster_<slug>_<direction>_frame_<01|02>.webp`. Within each direction, frame `01` is idle and frame `02` is move. For example, `monster_grumpy_radish_down_frame_01.webp` maps to down idle and `monster_grumpy_radish_down_frame_02.webp` maps to down move. This produces exactly eight unique inputs per monster and preserves the audited atlas order: down idle, down move, up idle, up move, left idle, left move, right idle, right move. The per-file manifest records both the semantic state and zero-based atlas position so no filename is ambiguous in production tracking.

Intake: `art-review/incoming/monsters/<slug>/`  
Only the assembled atlas receives the active manifest production path.

### 9.3 VFX Sources

Pattern: `vfx_<effect_slug>_frame_<01-08>.webp`  
Intake: `art-review/incoming/vfx/<effect_slug>/`  
Only the assembled atlas receives the active manifest production path.

For the P0 summon effect, use effect slug `summon_reveal_glow`, producing `vfx_summon_reveal_glow_frame_01.webp` through `08` while retaining parent production ID `ui.summon.reveal_glow`.

### 9.4 File Manifest Columns

`14_google_flow_file_manifest.md` contains one row per individual source image with: intake filename, prompt-file path, section/prompt ID, parent production or provisional ID, asset type, direction/state, frame number, total frames, intake path, final atlas/static destination, dimensions, transparency, master dependency, validation status, and implementation status.

It includes the 24 hero, 40 monster, and 40 VFX sources; all required static P0/P1 wired images; proposed master references; and approved Batch 2 pending Floor 1 sources. Pending rows leave final destination and runtime contract fields explicitly unset. Every filename is lowercase ASCII with underscores and no spaces, version suffixes, parentheses, or Thai characters.

## 10. Atlas Assembly and Validation Workflow

1. Open the single owning prompt file and generate one isolated source in Google Flow.
2. Save it at the exact intake path from file `14`.
3. Validate dimensions, WebP format, transparency, filename uniqueness, master dependency, silhouette, camera, lighting, contact point, and gameplay-scale readability.
4. Record pass/fail and approval status without renaming to `_v2`, `_final`, `_new`, or `_fixed`.
5. Approve all source images for one parent atlas.
6. Normalize transparent margins, scale, baseline, footprint, and contact point without changing the approved design.
7. Assemble frames programmatically in the documented order.
8. Validate final dimensions, frame count, frame order, anchor metadata contract, alpha, and manifest destination.
9. Move only the approved assembled atlas through the separately authorized production replacement workflow.

Static assets skip atlas assembly but retain the same one-owner, one-intake-file, validation, and approval rules.

## 11. Planned Repository Changes After Approval

Runtime and contract implementation will update, as required by reference audit:

- `packages/game-core/src/hero-definitions.ts` only if a canonical visual mapping belongs in shared definitions;
- `packages/network-protocol/src/types.ts` and relevant protocol validation/tests;
- `apps/game-server/src/simulation/CombatSimulation.ts`;
- `apps/game-server/src/schema/RoomState.ts`;
- `apps/game-server/src/rooms/FloorOneRoom.ts` and schema projection;
- client multiplayer state/bridge/client serialization paths;
- `apps/client/src/game/scenes/MultiplayerScene.ts` and loader/asset-resolution paths;
- `apps/client/src/assets/manifests/phase-4-assets.ts`;
- `tools/generate-phase4-asset-manifest.ts` and `tools/validate-phase4-assets.ts`;
- generated JSON/CSV/report/replacement-guide assets under `docs/assets/`;
- affected server, protocol, simulation, client, asset-registry, and renderer tests;
- the prompt files and indexes described in section 7.

The implementation plan must identify exact functions and test files before edits. It must use test-driven changes and must not perform Git operations unless separately requested.

## 12. Validation Plan

### Runtime and Protocol

- All six definition IDs survive room join, reconnect, respawn, and full resync.
- Simulation and schema projection retain `definitionId` independently from `role`.
- Client rendering selects atlas solely by `definitionId`; no artwork lookup uses role alone.
- Missing/unknown IDs safely render a neutral generated shape without identity mutation.
- Direction selects frames `0/1/2/3` in down/up/left/right order.
- Movement, attack, hit, and defeat effects use tweens/VFX without alternate hero atlases.

### Manifest and Prompt Library

- Manifest totals are exactly `75 / 39 / 17 / 19`.
- Exactly 54 obsolete IDs are absent and six approved IDs are present.
- Exactly six hero prompt files, five monster prompt files, and one wired VFX owner file exist.
- Exactly 24 unique hero, 40 unique monster, and 40 unique VFX source filenames exist.
- Every wired P0/P1 asset has exactly one prompt owner and every owner is linked from an index.
- No duplicate prompt sections or intake filenames exist.
- Pending assets have provisional IDs, pending status, and no production path.
- Static source frames and animated frames are reported separately: 24 static hero sources, 80 retained animated frames, 104 total sources.

### Planned Commands

After implementation, run the manifest generator/check mode, phase-4 asset validator, targeted package tests for game-core/network-protocol/game-server/client, TypeScript checks for affected workspaces, and the complete repository test suite if its runtime/dependencies are available. Any unrun command must be listed with its exact reason.

## 13. Approval Gate

This specification must be reviewed and approved before an implementation plan is written or any runtime/prompt-library migration begins. Approval authorizes planning only unless the user separately directs implementation. No images or production assets are generated or moved by approval of this specification.
