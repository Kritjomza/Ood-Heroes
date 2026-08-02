# Lightweight Mirrored Gameplay Sprites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four-direction hero and eight-frame monster art contracts with four-pose hero atlases and one mirrored left-facing monster sprite per monster.

**Architecture:** Stable production IDs and paths receive new technical semantics. Pure frame/facing helpers drive Phaser rendering; manifests and prompt validators encode the same counts and filenames so runtime, documentation, and Google Flow intake cannot drift.

**Tech Stack:** TypeScript 5.9, Phaser 3.90, Vitest 3, Markdown, JSON/CSV manifest generation, npm workspaces.

## Global Constraints

- Do not use Git or perform Git operations.
- Do not generate images or move production assets.
- Preserve exactly 75 wired IDs with priorities P0/P1/P2 `39/17/19`.
- Preserve all six hero and five monster production IDs and replacement paths.
- Hero atlas: 384 × 96 transparent WebP, four 96 × 96 frames ordered `idle_a`, `idle_b`, `move_left_a`, `move_left_b`, anchor `0.5,0.82`.
- Monster sprite: 96 × 96 transparent WebP, one left-facing frame, anchor `0.5,0.82`.
- Gameplay/VFX source counts: heroes 24, monsters 5, VFX 40, total 69.
- Horizontal mirroring affects visual objects only, never simulation coordinates.
- Missing/unknown assets retain identity-safe generated-shape fallbacks.
- Use the supplied image only for style principles; all character designs remain original.

## File Responsibility Map

- `apps/client/src/game/scenes/heroDirectionalSprites.ts`: pure hero pose cadence and horizontal-facing rules.
- `apps/client/src/game/scenes/MultiplayerScene.ts`: hero/monster textures, mirroring, cadence, tweens, and fallbacks.
- `apps/client/src/assets/manifests/phase-4-assets.ts`: stable runtime IDs/paths.
- `tools/generate-phase4-asset-manifest.ts`: hero/monster technical contract generation.
- `tools/validate-phase4-assets.ts`: exact counts, dimensions, semantics, and obsolete-contract rejection.
- `art-prompts/heroes/*.md`: one hero's master/presentation/four gameplay prompts.
- `art-prompts/monsters/*.md`: one monster's master/one gameplay prompt.
- `art-prompts/vfx/floor_1_vfx.md`: unchanged five wired VFX families.
- `art-prompts/00`, `01`, `12`, `13`, `14`: inventory, style, order, validation, and intake tracking.
- `tools/validate-art-prompts.ts`: exact prompt/file/filename/count checks.

---

### Task 1: Pure Hero Pose and Facing Contract

**Files:**
- Modify: `apps/client/src/game/scenes/heroDirectionalSprites.ts`
- Modify: `apps/client/tests/heroDirectionalSprites.test.ts`

**Interfaces:**
- Produces: `heroGameplayFrame(moving: boolean, phase: 0 | 1): 0 | 1 | 2 | 3`.
- Produces: `nextHorizontalFacing(direction: CardinalDirection, previous: HorizontalFacing): HorizontalFacing`.
- Produces: `shouldMirrorHero(moving: boolean, facing: HorizontalFacing): boolean`.
- Retains: `heroTextureKey(definitionId: string): string | null`.

- [ ] **Step 1: Replace directional expectations with failing pose tests**

```ts
expect(heroGameplayFrame(false, 0)).toBe(0);
expect(heroGameplayFrame(false, 1)).toBe(1);
expect(heroGameplayFrame(true, 0)).toBe(2);
expect(heroGameplayFrame(true, 1)).toBe(3);
expect(nextHorizontalFacing('right', 'left')).toBe('right');
expect(nextHorizontalFacing('up', 'right')).toBe('right');
expect(shouldMirrorHero(true, 'right')).toBe(true);
expect(shouldMirrorHero(false, 'right')).toBe(false);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run apps/client/tests/heroDirectionalSprites.test.ts`

Expected: FAIL because the new helpers do not exist and the old down/up/left/right frame mapping remains.

- [ ] **Step 3: Implement the minimal pure helpers**

```ts
export type HorizontalFacing = 'left' | 'right';
export function heroGameplayFrame(moving: boolean, phase: 0 | 1): 0 | 1 | 2 | 3 {
  return moving ? (phase === 0 ? 2 : 3) : phase;
}
export function nextHorizontalFacing(direction: CardinalDirection, previous: HorizontalFacing) {
  return direction === 'left' || direction === 'right' ? direction : previous;
}
export function shouldMirrorHero(moving: boolean, facing: HorizontalFacing) {
  return moving && facing === 'right';
}
```

Remove `directionalFrame` so no up/down frame contract survives.

- [ ] **Step 4: Run the focused tests**

Expected: all pure helper and six-identity texture tests PASS.

- [ ] **Step 5: Record a no-Git checkpoint**

Record modified files and command output; do not stage or commit.

### Task 2: Phaser Hero Cadence and Mirroring

**Files:**
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Create: `apps/client/tests/lightweightSpriteRuntime.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces: per-hero `facing`, `animationPhase`, and `nextFrameAt` visual state.

- [ ] **Step 1: Write failing runtime-state tests**

Test a small exported visual-state reducer or scene helper with these assertions:

```ts
expect(updateHeroVisual(state, { direction: 'up', moving: true }, 200).facing).toBe('right');
expect(updateHeroVisual(state, { direction: 'right', moving: true }, 200).flipX).toBe(true);
expect(updateHeroVisual(state, { direction: 'none', moving: false }, 600).frame).toBe(1);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run apps/client/tests/lightweightSpriteRuntime.test.ts`

Expected: FAIL because the lightweight reducer/helper does not exist.

- [ ] **Step 3: Implement cadence state**

Idle phase changes every 520 ms; movement phase changes every 140 ms. Horizontal directions update facing; up/down/none preserve it. Apply `setFrame(heroGameplayFrame(...))` and `setFlipX(shouldMirrorHero(...))` only to sprites. Neutral idle is never mirrored.

- [ ] **Step 4: Preserve tween/fallback behavior**

Keep bob, bounce, squash/stretch, attack lunge/recoil, hit flash/shake, defeat squash/rotation/fade, VFX overlays, and generated circles. Reset transient transforms relative to their stable base values.

- [ ] **Step 5: Run runtime, combat-event, and client type tests**

Run: `npx vitest run apps/client/tests/lightweightSpriteRuntime.test.ts apps/client/tests/heroDirectionalSprites.test.ts apps/client/tests/combatEvents.test.ts && npx tsc -p apps/client/tsconfig.json --noEmit`

Expected: PASS.

- [ ] **Step 6: Record a no-Git checkpoint**

Record results only.

### Task 3: Static Monster Texture and Mirroring Runtime

**Files:**
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Modify: `apps/client/tests/lightweightSpriteRuntime.test.ts`

**Interfaces:**
- Produces: `monsterTextureKey(definitionId: string): string | null` for five definitions.
- Produces: monster visual facing retained through vertical/idle directions.

- [ ] **Step 1: Add failing monster mapping/mirroring tests**

```ts
expect(monsterTextureKey('grumpy-radish')).toBe('monster.grumpy_radish');
expect(monsterTextureKey('unknown')).toBeNull();
expect(nextHorizontalFacing('down', 'left')).toBe('left');
expect(monsterFlipX('right')).toBe(true);
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npx vitest run apps/client/tests/lightweightSpriteRuntime.test.ts`

- [ ] **Step 3: Load/render static monster sprites**

Preload each existing `/assets/final/monster/<slug>.webp` as an image. In `createMonster`, use the mapped texture when valid and a generated shape otherwise. Store facing; apply `setFlipX(facing === 'right')` only to image objects. Preserve definition identity and all HP/target/warning UI.

- [ ] **Step 4: Add code-driven monster motion**

Apply a subtle visual-only bob/squash while moving; use existing hit flash/shake and defeat/respawn effects. Never offset authoritative container coordinates permanently.

- [ ] **Step 5: Run focused tests/typecheck**

Expected: mapping, mirroring, unknown fallback, and client compilation PASS.

- [ ] **Step 6: Record a no-Git checkpoint**

Record results only.

### Task 4: Manifest Generator and Active Contract

**Files:**
- Modify: `tools/generate-phase4-asset-manifest.ts`
- Modify: `tools/validate-phase4-assets.ts`
- Modify: `apps/client/tests/AssetRegistry.test.ts`
- Regenerate: `docs/assets/phase-4-asset-manifest.json`
- Regenerate: `docs/assets/phase-4-asset-manifest.csv`
- Modify: `docs/assets/phase-4-asset-report.md`
- Modify: `docs/assets/phase-4-replacement-guide.md`

**Interfaces:**
- Consumes: stable 75-entry runtime registry.
- Produces: hero pose semantics and one-frame monster technical contracts.

- [ ] **Step 1: Write failing manifest assertions**

Require every hero sprite to have `384/96/4`, directions/semantics `idle_a,idle_b,move_left_a,move_left_b`, and every monster to have `96/96/1`, required direction `left`, anchor `0.5/0.82`.

- [ ] **Step 2: Run validator and verify RED**

Run: `npm run assets:validate`

Expected: FAIL against current monster `256 × 256 / 8` and hero direction metadata.

- [ ] **Step 3: Update generator branches**

Use explicit hero-sprite and monster branches. Preserve IDs, priorities, categories, atlas groups where meaningful, and target paths. Monster `atlasGroup` becomes `null` because it is static.

- [ ] **Step 4: Recalculate validator counts**

Require wired/P0/P1/P2 `75/39/17/19`, source counts `24/5/40/69`, zero hero directional semantics, and zero multi-frame monster entries.

- [ ] **Step 5: Regenerate and validate**

Run: `npm run assets:manifest && npm run assets:validate && npx vitest run apps/client/tests/AssetRegistry.test.ts`

Expected: PASS with stable IDs/paths and new technical contracts.

- [ ] **Step 6: Update reports and checkpoint**

Report 24 hero sources, five monster sources, 40 VFX frames, and 69 total. Record without Git.

### Task 5: Rewrite Six Hero Prompt Owners

**Files:**
- Modify: all six `art-prompts/heroes/hero_<slug>.md` files.

**Interfaces:**
- Consumes: approved master invariants and Task 4 hero contract.
- Produces: exactly four gameplay prompts per hero and 24 unique intake filenames.

- [ ] **Step 1: Update one hero file and make prompt validation fail narrowly**

Use required sections: identity, short summary, fixed invariants, master, portrait, icon, card, four gameplay prompts, filenames, intake paths, negative prompt, readability checklist.

- [ ] **Step 2: Write the four self-contained gameplay prompts**

Each repeats identity invariants and outputs one of:

```text
hero_<slug>_idle_a.webp
hero_<slug>_idle_b.webp
hero_<slug>_move_left_a.webp
hero_<slug>_move_left_b.webp
```

Intake is `art-review/incoming/heroes/<slug>/`. Prompts prohibit sheets, up/down/right source art, attack poses, dense detail, copied characters, and harsh black outlines.

- [ ] **Step 3: Rewrite the remaining five hero files**

Preserve each approved original silhouette, palette, materials, face, signature item, stance, and personality. Replace every old directional filename/heading.

- [ ] **Step 4: Run hero prompt checks**

Expected: six files, four gameplay prompts each, 24 unique filenames, no old direction-source language.

- [ ] **Step 5: Record a no-Git checkpoint**

Record files and counts.

### Task 6: Rewrite Five Monster Owners and Shared VFX

**Files:**
- Modify: all five `art-prompts/monsters/monster_<slug>.md` files.
- Modify: `art-prompts/vfx/floor_1_vfx.md` only to simplify language and retain exact active contracts.

**Interfaces:**
- Consumes: Task 4 monster/VFX contracts.
- Produces: five unique final monster gameplay filenames and unchanged 40 VFX sources.

- [ ] **Step 1: Rewrite each monster owner**

Retain identity, behavior, invariants, and master prompt. Replace eight frame prompts/atlas assembly with exactly one left-facing prompt named `monster_<slug>_left.webp` at `art-review/incoming/monsters/<slug>/`.

- [ ] **Step 2: Make monster prompts final-source aware**

Document that each reviewed 96 × 96 source receives the existing production path after validation; no atlas assembly occurs.

- [ ] **Step 3: Simplify VFX wording without changing five-by-eight contract**

Keep attack hit, heal, movement slow, charge warning, and P0 summon reveal glow. Preserve unique frame filenames and assembly order.

- [ ] **Step 4: Run focused prompt checks**

Expected: five files, one gameplay prompt each, five unique left filenames, no monster atlas or directional-frame prompt.

- [ ] **Step 5: Record a no-Git checkpoint**

Record results.

### Task 7: Inventory, Flow Manifest, Shared Docs, and Obsolete File Deletion

**Files:**
- Modify: `art-prompts/00_asset_inventory.md`
- Modify: `art-prompts/01_odd_tower_style_dna.md`
- Modify: `art-prompts/12_generation_order.md`
- Modify: `art-prompts/13_asset_consistency_checklist.md`
- Modify: `art-prompts/14_google_flow_file_manifest.md`
- Modify: `tools/validate-art-prompts.ts`
- Delete: `art-prompts/02_hero_master_designs.md`
- Delete: `art-prompts/03_hero_animation_prompts.md`
- Delete: `art-prompts/04_monster_prompts.md`
- Delete: `art-prompts/08_vfx_prompts.md`

**Interfaces:**
- Consumes: Tasks 4–6.
- Produces: canonical 69-source Flow workflow and no redundant prompt indexes.

- [ ] **Step 1: Write failing prompt-validator expectations**

Require 24 hero gameplay rows, five monster gameplay rows, 40 VFX rows, unique filenames, stable P0/P1 owners, and absence of the four obsolete files.

- [ ] **Step 2: Run prompt validation and verify RED**

Run: `npm run prompts:validate`

Expected: FAIL on current 40 monster rows and existing index files.

- [ ] **Step 3: Recalculate Inventory A and generation documents**

Keep 75 IDs, change hero semantics and monster dimensions/frame counts, report `24/5/40/69`, and separate 29 master/presentation images from gameplay counts. Preserve Inventory B with no production paths.

- [ ] **Step 4: Rebuild file 14 rows**

Replace hero direction filenames with four pose filenames per hero and 40 monster rows with five left-facing rows. Preserve wired static, 40 VFX, 11 master-reference, and 13 approved pending rows.

- [ ] **Step 5: Transfer discoverability and delete obsolete indexes**

Ensure files `00`, `12`, and `14` directly link every retained owner, then delete the four exact redundant files using `apply_patch` only.

- [ ] **Step 6: Run prompt validation**

Expected: PASS with no duplicate filename, missing owner, pending production path, old hero directional source, or old monster atlas/frame reference.

- [ ] **Step 7: Record deletion and recovery status**

Report the four deleted documentation files as intentionally removed and not recoverable through Git because Git operations are prohibited; their retained content lives in owner files.

### Task 8: Full Verification and Handoff

**Files:**
- Modify only files exposed by verified failures; do not expand scope.

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: final evidence-backed migration report.

- [ ] **Step 1: Scan for obsolete contracts**

Use read-only searches for `direction_down`, `direction_up`, `direction_right`, monster `_frame_`, monster 8-frame contracts, and deleted index filenames across active code, tools, prompts, and asset docs. Historical specs/plans may describe migration history but must not be active sources.

- [ ] **Step 2: Run both validators**

Run: `npm run assets:validate && npm run prompts:validate`

- [ ] **Step 3: Run typecheck and production build**

Run: `npm run typecheck && npm run build`

- [ ] **Step 4: Run targeted tests**

Run: `npx vitest run apps/client/tests/heroDirectionalSprites.test.ts apps/client/tests/lightweightSpriteRuntime.test.ts apps/client/tests/AssetRegistry.test.ts apps/client/tests/combatEvents.test.ts`

- [ ] **Step 5: Run full unit suite**

Run: `npx vitest run --reporter=dot`

- [ ] **Step 6: Record tests not run**

If Playwright multiplayer/combat E2E is not run, report its browser/service environment requirement explicitly. Do not claim visual asset validation because no final WebPs exist.

- [ ] **Step 7: Produce final report**

List changed/deleted files, stable IDs/counts, 24/5/40/69 sources, runtime mirroring assumptions, compatibility impact, validator/build/test output, unrun tests, image operations (`none`), production moves (`none`), and Git operations (`none`).
