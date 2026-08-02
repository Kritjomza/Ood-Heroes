# Lightweight Mirrored Gameplay Sprites Design

**Status:** Draft for review  
**Date:** 2026-08-02  
**Scope:** Runtime sprite semantics, active asset contracts, and prompt-production workflow. No image generation or production-asset movement.

## 1. Migration Summary

Odd Tower will replace four-direction hero poses and eight-frame monster atlases with a lightweight side-facing system. Production IDs and paths remain stable, so the wired inventory stays at 75 IDs with priorities P0/P1/P2 `39/17/19`.

Each hero keeps one four-frame 384 × 96 atlas, but the frames become `idle_a`, `idle_b`, `move_left_a`, and `move_left_b`. Each monster keeps its current `monster.<slug>` ID and production path but becomes one 96 × 96 left-facing transparent WebP. Phaser alternates frames, mirrors left movement art for right-facing movement, and supplies transient motion through tweens and separate VFX.

This is a replacement contract. The previous hero down/up/left/right semantics and monster eight-frame directional semantics are deleted from active prompts, manifests, validators, and runtime selection logic.

## 2. Stable Production Contract

No production ID is added or removed.

- Wired IDs: 75
- P0: 39
- P1: 17
- P2: 19
- Hero gameplay deliverables: 6
- Monster gameplay deliverables: 5
- Wired animated VFX deliverables: 5

The six hero IDs remain `hero.<slug>.sprite_directional` for compatibility, even though the atlas now contains pose states rather than four directions. The five monster IDs remain `monster.<slug>`. Their existing exact replacement paths remain unchanged.

## 3. New Image Counts

| Family | Deliverables | Google Flow gameplay sources per deliverable | Total gameplay sources |
|---|---:|---:|---:|
| Heroes | 6 atlases | 4 | 24 |
| Monsters | 5 static sprites | 1 | 5 |
| Wired VFX | 5 atlases | 8 | 40 |
| **Total** | **16** | — | **69** |

The 24 hero gameplay sources are static source images assembled into six lightweight looping atlases. The five monster gameplay sources are final static production images and require no atlas assembly. VFX remain at the currently wired five families/eight frames each because this request does not redefine their active technical contracts.

Master-reference and presentation prompts are tracked separately:

- Hero master references: 6
- Hero portraits: 6
- Hero icons: 6
- Hero collection cards: 6
- Monster master references: 5

These 29 reference/presentation images do not count toward the 69 gameplay/VFX source images.

## 4. Hero Gameplay Contract

Each hero has exactly four 96 × 96 transparent WebP source images:

| Atlas frame | Semantic | Intake filename pattern |
|---:|---|---|
| 0 | `idle_a` | `hero_<slug>_idle_a.webp` |
| 1 | `idle_b` | `hero_<slug>_idle_b.webp` |
| 2 | `move_left_a` | `hero_<slug>_move_left_a.webp` |
| 3 | `move_left_b` | `hero_<slug>_move_left_b.webp` |

The assembled production atlas remains 384 × 96 WebP, transparent, with four horizontal frames and anchor `0.5, 0.82`. Sources use `art-review/incoming/heroes/<slug>/`; only the assembled atlas receives the existing production path.

`idle_a` is the primary neutral front-three-quarter standing pose. `idle_b` is a subtle secondary pose with the same contact point and identity—small breathing/weight variation only. Movement sources face left. `move_left_b` differs through a readable step/weight shift without motion blur or silhouette drift.

Google Flow never generates the assembled atlas. Sources are normalized for baseline, occupied area, contact point, silhouette scale, camera, lighting, and transparent margins, then assembled programmatically.

## 5. Monster Gameplay Contract

Each monster has one final gameplay source:

- Filename: `monster_<slug>_left.webp`
- Intake: `art-review/incoming/monsters/<slug>/monster_<slug>_left.webp`
- Format: transparent WebP
- Dimensions: 96 × 96
- Direction: left
- Frame count: 1
- Anchor: `0.5, 0.82`
- Final destination: the unchanged active manifest path for `monster.<slug>`

No programmatic atlas assembly is needed. The reviewed source becomes the production replacement after exact validation. Right-facing movement uses `setFlipX(true)`; left uses `false`.

## 6. Runtime Motion and Direction Assumptions

### Heroes

- Stationary heroes alternate frames 0/1 at a slow cadence.
- Moving heroes alternate frames 2/3 at a faster cadence.
- The renderer stores a visual facing value of `left` or `right`.
- Horizontal movement updates visual facing.
- Pure vertical movement retains the last horizontal facing and still uses frames 2/3; no vertical artwork exists.
- Right-facing movement applies horizontal mirroring; left-facing movement does not.
- Neutral idle frames are not direction-specific and are not mirrored.
- Attack uses the current movement frame plus lunge/recoil; no attack atlas exists.
- Hit and defeat use flash/shake and squash/rotation/fade without changing source frames.

### Monsters

- Every monster uses one left-facing source image.
- Horizontal velocity or authoritative direction chooses normal versus mirrored rendering.
- Pure vertical movement retains the previous horizontal facing.
- Bob, bounce, squash/stretch, hit flash/shake, and defeat fade affect only the visual object, never simulation coordinates.
- Charge warning, heal, slow, and hit feedback remain separate VFX overlays.

Missing/invalid files retain generated-shape fallbacks. Fallback rendering does not mutate hero `definitionId` or monster `definitionId`.

## 7. Style Contract

The supplied reference image guides proportion, density, charm, simplicity, and mood only. No exact character, costume, face, or prop may be copied.

All hero and monster prompts require original Odd Tower designs with oversized chibi heads, tiny bodies, rounded simplified silhouettes, expressive eyes/faces, funny personality, bright pastel candy colors, minimal cel shading, clean color blocking, and thick smooth chocolate-like `#2b1a14` outlines. Exclude realistic anatomy, gritty rendering, painterly texture, dense micro-detail, harsh black lines, and photorealism.

Approved master designs continue to control silhouette, palette, material, facial language, costume/body features, signature items, line treatment, lighting, camera, contact point, and small-scale readability.

## 8. Per-File Prompt Architecture

### Retained shared files

```text
art-prompts/
  00_asset_inventory.md
  01_odd_tower_style_dna.md
  05_boss_prompts.md
  06_floor_1_environment_prompts.md
  07_tiles_and_props.md
  09_items_and_rewards.md
  10_ui_and_hud_prompts.md
  11_future_floor_concepts.md
  12_generation_order.md
  13_asset_consistency_checklist.md
  14_google_flow_file_manifest.md
```

### Character and effect owners

```text
art-prompts/
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

Each hero owner contains identity, short summary, fixed invariants, master reference, portrait, icon, collection card, exactly four gameplay prompts, explicit filenames/intake paths, negative prompt, and readability checklist.

Each monster owner contains identity, behavior, fixed invariants, master reference, exactly one left-facing gameplay prompt, filename/intake path, negative prompt, and readability checklist.

## 9. Obsolete Prompt Cleanup

Delete these redundant indexes after their useful navigation links are transferred to Inventory, generation order, or file 14:

- `art-prompts/02_hero_master_designs.md`
- `art-prompts/03_hero_animation_prompts.md`
- `art-prompts/04_monster_prompts.md`
- `art-prompts/08_vfx_prompts.md`

Delete all obsolete prompt sections and Flow rows for:

- hero down/up/left/right sources;
- monster directional idle/move frames;
- monster atlas assembly;
- old 40-frame monster count;
- any hero multi-frame walk/attack or direction-based language.

Pending boss and environment indexes remain because they provide useful separation and discovery for Inventory B.

## 10. Manifest and Validator Changes

The active manifest generator and validator will encode:

- Hero: 384 × 96, 4 frames, semantics `idle_a/idle_b/move_left_a/move_left_b`, anchor `0.5,0.82`.
- Monster: 96 × 96, 1 frame, required direction `left`, anchor `0.5,0.82`.
- VFX: unchanged 5 × 8 frames.
- Asset totals: unchanged `75/39/17/19`.
- Gameplay/VFX source counts: `24/5/40/69`.

File 14 will contain exactly 24 hero gameplay rows and five monster gameplay rows with the new filenames, plus the unchanged VFX, wired static, master-reference, and approved pending rows. Every filename remains unique.

## 11. Runtime Files Requiring Change

- `apps/client/src/game/scenes/heroDirectionalSprites.ts`: replace direction-to-frame mapping with idle/move sequence helpers.
- `apps/client/src/game/scenes/MultiplayerScene.ts`: frame cadence, horizontal facing memory, `flipX`, hero/monster tween motion, and safe fallback.
- Monster rendering will load the five static production textures by monster `definitionId` and use generated shapes if unavailable.
- Asset registry, manifest generator, generated JSON/CSV, reports, validators, and related tests will receive the new semantics.

Network identity and `definitionId` propagation remain unchanged.

## 12. Validation

- Exactly six hero owner files with four gameplay prompts each.
- Exactly five monster owner files with one gameplay prompt each.
- Exactly 24 unique hero gameplay filenames and five unique monster gameplay filenames.
- No up/down hero source, right-side generated source, monster atlas prompt, or old monster frame filename remains.
- Hero frame order and atlas dimensions are exact.
- Monster static dimensions/path/anchor are exact.
- Runtime mirrors only visual objects and preserves simulation transforms.
- Unknown identities and missing textures use fallbacks safely.
- Manifest totals remain `75/39/17/19`.
- Source counts validate as `24/5/40/69`.
- Typecheck, build, targeted renderer/asset tests, both validators, and full unit suite pass.

## 13. Approval Gate

After this specification is approved, implementation will follow a written plan. No images will be generated, no production assets will move, and no Git operations will occur.
