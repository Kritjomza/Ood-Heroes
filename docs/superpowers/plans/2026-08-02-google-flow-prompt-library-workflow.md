# Google Flow Prompt Library Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the Odd Tower prompt library into one-owner production files and an exact Google Flow intake manifest aligned with the 75-ID runtime contract.

**Architecture:** Character/family files exclusively own complete prompts, while numbered family files become navigation indexes. A machine-checkable documentation validator enforces counts, filename uniqueness, ownership, links, pending-path isolation, and alignment with the active generated manifest.

**Tech Stack:** Markdown, TypeScript/tsx validation script, JSON active manifest, npm scripts, Google Flow intake conventions.

## Global Constraints

- Do not use Git or perform Git operations.
- Do not generate images or move production assets.
- Runtime plan must first produce the canonical 75-ID manifest with priorities `39/17/19`.
- Exactly six hero files, five monster files, and one wired VFX owner file.
- Exactly 24 hero directional, 40 monster, and 40 VFX source filenames.
- Hero prompts contain no idle/walk/attack animation atlas requirements or obsolete IDs.
- Every prompt is self-contained; indexes never duplicate full prompts.
- Pending assets use `PENDING-F1-*`, `Pending Implementation — GDD Requirement`, and no production path or invented technical contract.
- All filenames are lowercase ASCII with underscores and no version suffixes.

## File Responsibility Map

- `art-prompts/heroes/*.md`: one hero's complete master/static/directional prompt ownership.
- `art-prompts/monsters/*.md`: one monster's master/eight-frame prompt ownership.
- `art-prompts/vfx/floor_1_vfx.md`: five wired animated VFX families.
- `art-prompts/bosses/*.md`: pending boss/minion designs.
- `art-prompts/environments/floor_1/*.md`: pending world-family designs.
- `art-prompts/02,03,04,05,06,08*.md`: indexes only.
- `art-prompts/14_google_flow_file_manifest.md`: every source intake row.
- `tools/validate-art-prompts.ts`: structural/count/ownership validator.
- `package.json`: `prompts:validate` command.

---

### Task 1: Prompt Workflow Validator Skeleton

**Files:**
- Create: `tools/validate-art-prompts.ts`
- Create: `tools/validate-art-prompts.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `validatePromptLibrary(root: string, manifestPath: string): ValidationIssue[]` and `npm run prompts:validate`.
- Consumes: Markdown headings/tables and active manifest JSON.

- [ ] **Step 1: Write failing fixture tests**

Create temporary in-memory/on-disk fixtures using Vitest temp directories for duplicate intake filenames, obsolete IDs, pending production paths, missing index links, and wrong per-family counts.

```ts
expect(validatePromptLibrary(root, manifest)).toContainEqual(
  expect.objectContaining({ code: 'DUPLICATE_INTAKE_FILENAME' }),
);
```

- [ ] **Step 2: Run and verify module-not-found failure**

Run: `npx vitest run tools/validate-art-prompts.test.ts`

- [ ] **Step 3: Implement parser and stable issue codes**

Parse prompt metadata and file-manifest tables; enforce exact directory counts, unique filenames/prompt ownership, obsolete-pattern absence, pending-path absence, index links, and active P0/P1 ownership.

- [ ] **Step 4: Add npm script**

```json
"prompts:validate": "tsx tools/validate-art-prompts.ts"
```

- [ ] **Step 5: Run validator unit tests**

Expected: fixture tests PASS; live library validation FAILS because split files/file 14 do not yet exist.

- [ ] **Step 6: Record a no-Git checkpoint**

Record results only.

### Task 2: Six Hero Owner Files

**Files:**
- Create: `art-prompts/heroes/hero_grilled_chicken.md`
- Create: `art-prompts/heroes/hero_pink_chocolate_lizard.md`
- Create: `art-prompts/heroes/hero_robot_jelly.md`
- Create: `art-prompts/heroes/hero_tofu_rabbit.md`
- Create: `art-prompts/heroes/hero_accountant_octopus.md`
- Create: `art-prompts/heroes/hero_samurai_bread.md`
- Convert to index: `art-prompts/02_hero_master_designs.md`
- Convert to index: `art-prompts/03_hero_animation_prompts.md`

**Interfaces:**
- Consumes: active hero portrait/icon/card/directional IDs and exact replacement paths; approved style DNA.
- Produces: one exclusive owner per hero and 24 unique directional intake filenames.

- [ ] **Step 1: Create a complete 18-section grilled-chicken file**

Include identity, definition ID, role, proposed master label, fixed invariants, master/portrait/icon/card prompts, four self-contained directional prompts, atlas contract, filenames/paths, negatives, 48 px validation, consistency, and approval.

- [ ] **Step 2: Validate the first-file structure**

Run validator against a focused fixture or add `--file art-prompts/heroes/hero_grilled_chicken.md`; expected no missing-section issues.

- [ ] **Step 3: Create the other five owner files with their own complete invariants**

Use filenames `hero_<slug>_direction_<direction>.webp` and intake `art-review/incoming/heroes/<slug>/`. Individual inputs have no production path; only `sprite_directional.webp` does.

- [ ] **Step 4: Convert files 02 and 03 into indexes**

Include counts, links, order, and approval only. Remove all duplicated prompts and every old animation ID/prompt.

- [ ] **Step 5: Run focused validator checks**

Expected: exactly six hero files, 24 unique directions, no obsolete patterns, all owner files linked.

- [ ] **Step 6: Record a no-Git checkpoint**

Record counts/results.

### Task 3: Five Monster Owner Files

**Files:**
- Create: `art-prompts/monsters/monster_grumpy_radish.md`
- Create: `art-prompts/monsters/monster_jumping_sauce_bag.md`
- Create: `art-prompts/monsters/monster_shoe_biting_dust_ball.md`
- Create: `art-prompts/monsters/monster_wild_sausage.md`
- Create: `art-prompts/monsters/monster_lost_pudding.md`
- Convert to index: `art-prompts/04_monster_prompts.md`

**Interfaces:**
- Consumes: active five monster atlas contracts.
- Produces: 40 unique semantic source frames and one owner per monster.

- [ ] **Step 1: Build one monster file with all required sections**

Use audited mapping down idle/move, up idle/move, left idle/move, right idle/move and filenames `monster_<slug>_<direction>_frame_01.webp` for idle, `_02.webp` for move.

- [ ] **Step 2: Build remaining four files**

Repeat complete invariants in every individual frame prompt; document intake and final manifest destination separately.

- [ ] **Step 3: Convert file 04 into an index**

Keep scope/count/order/links/status; remove full prompt duplication.

- [ ] **Step 4: Run monster validations**

Expected: five files, eight source prompts each, 40 unique filenames, exact atlas positions, one owner each.

- [ ] **Step 5: Record a no-Git checkpoint**

Record results.

### Task 4: One Wired VFX Owner File

**Files:**
- Create: `art-prompts/vfx/floor_1_vfx.md`
- Convert to index: `art-prompts/08_vfx_prompts.md`

**Interfaces:**
- Consumes: active contracts for `ui.summon.reveal_glow` plus four `vfx.*` IDs.
- Produces: 40 unique VFX inputs with eight-frame mappings.

- [ ] **Step 1: Author five complete VFX families**

For each parent include purpose, footprint, color/shape language, eight isolated prompts, filenames `vfx_<effect_slug>_frame_<01-08>.webp`, ordering, intake, final dimensions/path, transparency, playback, negatives, and validation.

- [ ] **Step 2: Make summon classification explicit**

Document `ui.summon.reveal_glow` as the fifth wired P0 animated VFX; never invent a `vfx.summon_reveal_glow` production ID.

- [ ] **Step 3: Convert file 08 into an index**

Link the single owner file and show `5 deliverables / 40 frames`; remove duplicated prompts.

- [ ] **Step 4: Run VFX validations**

Expected: one VFX owner file, five parents, 40 unique filenames, exact manifest destinations.

- [ ] **Step 5: Record a no-Git checkpoint**

Record results.

### Task 5: Pending Boss and Environment Owner Files

**Files:**
- Create: `art-prompts/bosses/boss_angry_refrigerator.md`
- Create: `art-prompts/bosses/boss_frozen_food_minions.md`
- Create: nine files under `art-prompts/environments/floor_1/` exactly as specified.
- Convert to index: `art-prompts/05_boss_prompts.md`
- Convert to index: `art-prompts/06_floor_1_environment_prompts.md`

**Interfaces:**
- Consumes: Inventory B provisional IDs and GDD requirements.
- Produces: exclusive Batch 2 pending owners with no runtime paths/contracts.

- [ ] **Step 1: Create boss/minion files**

Apply both required pending/master labels, existing provisional IDs, and no production path/dimensions/anchor/atlas guesses.

- [ ] **Step 2: Create nine environment-family files**

Separate master concepts, tiles, props, structures, transitions, overlays, and pending decisions inside their correct family owner.

- [ ] **Step 3: Convert files 05 and 06 into indexes**

Include links/status/order only; eliminate duplicate full prompts.

- [ ] **Step 4: Run pending-contract validations**

Expected: no pending row/file contains `/assets/final/`, final dimensions, anchor, or an existing production ID.

- [ ] **Step 5: Record a no-Git checkpoint**

Record results.

### Task 6: Shared Inventory, Order, and Consistency Files

**Files:**
- Modify: `art-prompts/00_asset_inventory.md`
- Modify: `art-prompts/01_odd_tower_style_dna.md`
- Modify: `art-prompts/07_tiles_and_props.md`
- Modify: `art-prompts/09_items_and_rewards.md`
- Modify: `art-prompts/10_ui_and_hud_prompts.md`
- Modify: `art-prompts/12_generation_order.md`
- Modify: `art-prompts/13_asset_consistency_checklist.md`

**Interfaces:**
- Consumes: canonical 75-ID manifest and exclusive ownership map.
- Produces: exact Inventory A/B separation and complete wired P0/P1 prompt coverage.

- [ ] **Step 1: Recalculate Inventory A**

List exactly 75 wired IDs with source/status/technical contract and six directional IDs; remove 54 old rows.

- [ ] **Step 2: Preserve Inventory B separation**

Keep only unique `PENDING-F1-*` assets, pending labels, and blank production paths.

- [ ] **Step 3: Audit static P0/P1 owners**

Assign every non-character wired P0/P1 asset to exactly one existing shared prompt file; remove duplicate full ownership while allowing cross-links.

- [ ] **Step 4: Update order/checklist**

Prioritize P0/P1 wired generation, source review, programmatic assembly, then Batch 2 pending work; state 24/40/40/104 counts and prohibit old atlas prompts.

- [ ] **Step 5: Run ownership validations**

Expected: zero duplicate or missing P0/P1 owners and exact inventory totals.

- [ ] **Step 6: Record a no-Git checkpoint**

Record results.

### Task 7: Complete Google Flow File Manifest

**Files:**
- Create: `art-prompts/14_google_flow_file_manifest.md`

**Interfaces:**
- Consumes: every exclusive prompt owner from Tasks 2–6.
- Produces: canonical intake tracking table.

- [ ] **Step 1: Add the required columns and 24 hero rows**

Each row contains filename, prompt file/heading, parent ID, type, direction, frame, total, intake path, final destination, dimensions, transparency, master dependency, validation status, implementation status.

- [ ] **Step 2: Add 40 monster and 40 VFX rows**

Map each row to exactly one atlas slot. Individual inputs never receive production paths; the final-destination column names the parent atlas destination for traceability.

- [ ] **Step 3: Add static wired/master/pending Batch 2 rows**

Use exact owner links. Pending rows have provisional IDs and no final destination/runtime contract.

- [ ] **Step 4: Run filename and owner validation**

Run: `npm run prompts:validate`

Expected: exactly 24/40/40 animated/static source categories, no duplicate filename, no missing owner/link, and no pending production path.

- [ ] **Step 5: Record a no-Git checkpoint**

Record total manifest rows and category counts.

### Task 8: Complete Prompt-Library Verification and Report

**Files:**
- Modify only validator/tests/docs exposed by verification gaps.

**Interfaces:**
- Consumes: Tasks 1–7 and canonical runtime manifest.
- Produces: final production-workflow validation report.

- [ ] **Step 1: Run prompt validator tests and live validation**

Run: `npx vitest run tools/validate-art-prompts.test.ts && npm run prompts:validate`

- [ ] **Step 2: Run asset validator and cross-check totals**

Run: `npm run assets:validate`

Expected: `75/39/17/19`, six new IDs, no obsolete IDs.

- [ ] **Step 3: Scan for prohibited/duplicate content**

Run read-only `rg` checks for old hero ID patterns, `/assets/final/` in pending owner files, version suffixes, and full prompts inside index files.

- [ ] **Step 4: Run typecheck and relevant unit suite**

Run: `npm run typecheck && npx vitest run`

- [ ] **Step 5: Produce final workflow evidence**

Report specification and both plan paths, file tree, created/indexed/deprecated files, prompt-file counts, 24/40/40 sources, duplicates, missing owners, manifest totals, validators/tests run or skipped with reasons, compatibility handling, and `Git operations performed: none`.

