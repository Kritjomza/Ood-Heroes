# Odd Tower Prompt Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the complete English image-generation prompt library for all approved wired P0/P1 assets and the separately identified Batch 2 Floor 1 GDD requirements.

**Architecture:** Establish one immutable Style DNA and one approved master-invariant record per character/environment family before authoring derivative prompts. Map every prompt back to Inventory A or Inventory B, preserve exact wired contracts, and keep unresolved GDD-only requirements explicitly provisional rather than inventing runtime details.

**Tech Stack:** Markdown, JSON/TypeScript source inspection, Node.js validation, project asset manifest.

## Global Constraints

- Do not use Git, create commits, or create worktrees.
- Inventory A remains exactly 123 wired IDs; immediate prompt scope is its 39 P0 and 65 P1 IDs.
- The 19 wired P2 IDs remain documented but receive no immediate production prompts.
- Inventory B remains 43 provisional `PENDING-F1-*` families and never receives production replacement paths.
- Every copy-ready prompt is self-contained and includes a complete invariant block.
- All wired technical fields are copied exactly from the active manifest.
- WebP is the final wired output format; use transparency exactly where required.
- Gameplay art must remain readable at 48 CSS pixels.
- Linework is rounded dark chocolate based on `#2b1a14`, never pure black.
- Use original compact food-fantasy chibi designs; the user reference supplies broad visual principles only.
- Repeat relevant code–GDD conflicts beside affected prompt families.
- Do not claim that proposed master designs already exist in production.

---

### Task 1: Universal Production Language

**Files:**
- Create: `art-prompts/01_odd_tower_style_dna.md`
- Create: `art-prompts/13_asset_consistency_checklist.md`

**Interfaces:**
- Consumes: approved design specification and `00_asset_inventory.md`.
- Produces: canonical style, palette, line, camera, lighting, scale, shadow, transparency, negative-prompt, and validation blocks inherited by every later family.

- [ ] Define the tiered rendering system for gameplay sprites versus portraits/cards.
- [ ] Define shared palette roles, `#2b1a14` outline behavior, upper-left lighting, orthographic three-quarter top-down camera, 48 px readability, and export rules.
- [ ] Define universal and animation-specific negative prompts.
- [ ] Define master approval states and a family-level consistency checklist.
- [ ] Validate that no instruction copies characters, costumes, props, or compositions from the supplied reference.

### Task 2: Six Hero Master References

**Files:**
- Create: `art-prompts/02_hero_master_designs.md`

**Interfaces:**
- Consumes: Style DNA; six enabled hero names, roles, rarities, and stats.
- Produces: permanent invariant blocks and copy-ready master, portrait, icon, and collection-card prompts for all six heroes.

- [ ] Define original silhouette, food/body material, palette, face, proportions, signature prop, costume/body features, texture, markings, toppings, height, contact point, and comedic personality for each hero.
- [ ] Include exact P0 asset IDs, dimensions, transparency, paths, purpose, negative prompts, cleanup notes, and generation order.
- [ ] Mark each master `Proposed Visual Design — Becomes Master Reference if Approved`.
- [ ] Validate six distinct silhouettes and role readability at 48 px.

### Task 3: Wired Hero Animation Atlases

**Files:**
- Create: `art-prompts/03_hero_animation_prompts.md`

**Interfaces:**
- Consumes: six hero invariant blocks and manifest contracts.
- Produces: self-contained prompts for all 54 wired P1 hero sprite deliverables and their 432 contained frames.

- [ ] Author four 4-frame idle atlas prompts per hero.
- [ ] Author four 6-frame walk atlas prompts per hero.
- [ ] Author one 32-frame four-direction attack atlas prompt per hero.
- [ ] Preserve exact dimensions, anchors, atlas groups, transparency, and replacement paths.
- [ ] Repeat C1 and describe how pose holds/tween-friendly motion satisfy the larger wired frame budget.
- [ ] Validate exactly 54 wired hero animation IDs and 432 frames.

### Task 4: Five Wired Monster Masters/Atlases

**Files:**
- Create: `art-prompts/04_monster_prompts.md`

**Interfaces:**
- Consumes: Style DNA and five monster definitions/specials.
- Produces: self-contained master/atlas prompts for all five wired P1 monster IDs.

- [ ] Define material, silhouette, face, movement, attack, defeat, relative scale, zone association, particles, and status feedback per monster.
- [ ] Preserve each exact 256 × 256 WebP, transparency, four-direction requirement, 8 frames, anchor `0.5, 0.82`, atlas `monsters.floor_1`, and replacement path.
- [ ] Repeat C3 beside Jumping Sauce Bag.
- [ ] Validate five IDs and 40 frames.

### Task 5: Wired Map and Batch 2 Environment/Boss

**Files:**
- Create: `art-prompts/05_boss_prompts.md`
- Create: `art-prompts/06_floor_1_environment_prompts.md`
- Create: `art-prompts/07_tiles_and_props.md`

**Interfaces:**
- Consumes: Style DNA, wired map contracts, and Inventory B IDs 001–018.
- Produces: exact prompts for two wired map assets plus provisional boss, zone, structure, portal, tile, and prop prompt families.

- [ ] Author exact wired prompts for `map.floor_1.tiles` and `map.floor_1.background`.
- [ ] Define the Angry Refrigerator master, attacks, minions, and blackout treatment without production paths.
- [ ] Define six Floor 1 zone families, world shrine/station/chest, arena, portal area, portal states, healing ambience, and shared indicator.
- [ ] Mark all pending rows `Pending Implementation — GDD Requirement` and retain their provisional IDs.
- [ ] Repeat C2, C6, and C7 beside affected families.
- [ ] Keep dimensions/anchors/atlas groups explicitly unconfirmed where the code does not define them.

### Task 6: Wired and Pending VFX

**Files:**
- Create: `art-prompts/08_vfx_prompts.md`

**Interfaces:**
- Consumes: Style DNA, combat events, wired VFX manifest contracts, and pending VFX families.
- Produces: prompts for summon reveal plus four wired P1 combat effects and sourced pending boss/progress/reward effects.

- [ ] Author transparent start/middle/end prompts with exact effect footprints and limited palettes.
- [ ] Preserve exact wired 512 × 512, 8-frame, `0.5, 0.5`, `vfx.floor_1` contracts.
- [ ] Keep characters out of standalone VFX prompts.
- [ ] Repeat C5, C6, C8, and C9 where applicable.
- [ ] Mark skill/reward effects needing gameplay events as provisional rather than production-ready.

### Task 7: Wired Items, Summon, Team, AFK, Auth, Home, and UI

**Files:**
- Create: `art-prompts/09_items_and_rewards.md`
- Create: `art-prompts/10_ui_and_hud_prompts.md`

**Interfaces:**
- Consumes: Style DNA, wired P0 manifest rows, persistent UI components, and Inventory B IDs 019–043.
- Produces: self-contained prompts for all non-hero wired P0 assets and Batch 2 item/HUD/screen families.

- [ ] Author exact P0 prompts for Gold, Gem, Upgrade Jelly, Hero Shard, summon components, team slots, AFK pieces, Auth pieces, Home pieces, and summon reveal.
- [ ] Author provisional prompts for Hero EXP, GDD HUD controls, screen families, completion panel, and reward presentations.
- [ ] Exclude all baked text, numbers, unreadable symbols, and fake writing.
- [ ] Repeat C4, C7, C8, and C9 beside affected families.
- [ ] Keep full screen art compatible with current desktop and mobile-landscape layouts.

### Task 8: Scope Register and Generation Order

**Files:**
- Create: `art-prompts/11_future_floor_concepts.md`
- Create: `art-prompts/12_generation_order.md`

**Interfaces:**
- Consumes: completed prompt families and approved scope.
- Produces: explicit deferral register for P2/Floors 2–10 and dependency-safe production sequence.

- [ ] List the 19 wired P2 IDs as deferred without immediate copy-ready prompts.
- [ ] List Floors 2–10 as post-MVP deferred concepts; do not invent rosters, bosses, or production inventories.
- [ ] Provide generation batches, master dependencies, filename/export sequence, approval gates, and regeneration checkpoints.

### Task 9: Cross-Library Validation

**Files:**
- Validate: `art-prompts/00_asset_inventory.md` through `art-prompts/13_asset_consistency_checklist.md`

**Interfaces:**
- Consumes: all library documents.
- Produces: validation evidence that every in-scope ID is accounted for exactly once and no pending ID is misrepresented.

- [ ] Extract production IDs from prompt headings and verify all 39 P0 and 65 P1 IDs occur exactly once in copy-ready prompt scope.
- [ ] Verify the 19 P2 IDs appear only in the deferral register.
- [ ] Verify all 43 `PENDING-F1-*` IDs occur exactly once and never contain `/assets/final/`.
- [ ] Verify every production prompt contains category, status, purpose, background, camera, dimensions/scale, variants, invariants, generation order, filename/path, main prompt, negative prompt, consistency notes, and cleanup notes.
- [ ] Verify required labels, conflict references, `#2b1a14`, WebP, transparency, and 48 px readability language.
- [ ] Scan for placeholders, unsupported claims, copied character references, baked text requests, and contradictions.
- [ ] Run `npm run assets:validate`; report the unrelated full-suite Supabase prerequisite separately if it remains unavailable.
