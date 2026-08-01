# Odd Tower Asset Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit the repository and create a validated `art-prompts/00_asset_inventory.md` containing exactly 123 wired production assets plus a separately counted inventory of unwired Floor 1 GDD requirements.

**Architecture:** Treat `docs/assets/phase-4-asset-manifest.json` as the canonical technical contract for Inventory A, then trace its families through the registry, UI, Phaser scenes, core definitions, and tests. Derive Inventory B only from explicit Floor 1 GDD requirements that have no wired ID, assign deterministic `PENDING-F1-*` identifiers, and validate that the two namespaces and counts cannot overlap.

**Tech Stack:** Markdown, JSON, TypeScript/TSX source inspection, Node.js validation commands, Git.

## Global Constraints

- Inventory A must contain exactly 123 unique wired production IDs unless the active repository audit proves that the manifest changed; any discrepancy is a stop condition.
- Preserve every wired asset's exact ID, priority, dimensions, WebP format, transparency, directions, frame count, anchor, atlas group, and replacement path.
- Count asset deliverables separately from animation frames contained inside atlases.
- Inventory B contains only unwired Floor 1 GDD requirements and uses unique `PENDING-F1-*` IDs.
- Pending assets receive no production replacement path, active atlas group, or runtime status.
- Repeat code–GDD conflicts beside every affected asset family.
- Do not generate production prompts during this plan.
- P2 polish and Floors 2–10 remain outside immediate production scope.

## File Structure

- Create `art-prompts/00_asset_inventory.md`: authoritative human-readable audit, Inventory A, Inventory B, matrices, conflicts, evidence, production order, and validation report.
- Read `docs/assets/phase-4-asset-manifest.json`: canonical wired asset technical metadata.
- Read `apps/client/src/assets/manifests/phase-4-assets.ts`: runtime registry IDs and fallback implementation.
- Read `docs/assets/phase-4-asset-report.md` and `docs/assets/phase-4-replacement-guide.md`: project-authored asset pipeline evidence.
- Read `packages/game-core/src/hero-definitions.ts`, `packages/game-core/src/combat-config.ts`, `packages/game-core/src/map.ts`, and active client/server render paths: gameplay usage evidence.
- Read `odd_tower_game_design_document_v0.1.md`: explicit unwired Floor 1 requirements and conflict evidence.

---

### Task 1: Validate the Wired Contract Before Authoring

**Files:**
- Read: `docs/assets/phase-4-asset-manifest.json`
- Read: `apps/client/src/assets/manifests/phase-4-assets.ts`
- Read: `docs/assets/phase-4-asset-report.md`

**Interfaces:**
- Consumes: active repository files at the current commit.
- Produces: verified wired ID count, uniqueness result, priority totals, frame total, and technical-field schema used by Inventory A.

- [ ] **Step 1: Count and validate unique manifest IDs**

Run:

```powershell
node -e "const m=require('./docs/assets/phase-4-asset-manifest.json'); const ids=m.assets.map(a=>a.assetId); const dup=ids.filter((id,i)=>ids.indexOf(id)!==i); console.log(JSON.stringify({count:ids.length,unique:new Set(ids).size,duplicates:[...new Set(dup)]},null,2)); process.exit(ids.length===123&&new Set(ids).size===123?0:1)"
```

Expected: `count` and `unique` both equal `123`, `duplicates` is empty, exit code 0. If not, stop and report the manifest path, observed counts, and duplicate IDs without creating the inventory.

- [ ] **Step 2: Calculate priority and contained-frame totals**

Run:

```powershell
node -e "const a=require('./docs/assets/phase-4-asset-manifest.json').assets; const priorities=Object.groupBy(a,x=>x.priority); console.log(JSON.stringify({deliverables:a.length,priorities:Object.fromEntries(Object.entries(priorities).map(([k,v])=>[k,v.length])),containedFrames:a.reduce((n,x)=>n+x.frameCount,0)},null,2))"
```

Expected: deliverable total 123 and priority totals consistent with `docs/assets/phase-4-asset-report.md`. Record the contained-frame total separately.

- [ ] **Step 3: Compare runtime registry IDs with manifest IDs**

Run:

```powershell
npm run assets:validate
```

Expected: exit code 0 and no missing, duplicate, or invalid asset contract entries.

- [ ] **Step 4: Record the validated baseline in working notes**

Record the exact counts and any documented differences between the TypeScript runtime registry and JSON manifest. Do not normalize discrepancies; cite both sources.

### Task 2: Trace Active Usage and Classify Existing Art

**Files:**
- Read: `apps/client/src/assets/asset-registry.ts`
- Read: `apps/client/src/assets/asset-resolver.ts`
- Read: `apps/client/src/ui/**/*.tsx`
- Read: `apps/client/src/game/**/*.ts`
- Read: `packages/game-core/src/**/*.ts`
- Read: `apps/game-server/src/**/*.ts`
- Read: `docs/assets/mockup-screens/*.png`
- Read: `docs/assets/screenshots/*.png`

**Interfaces:**
- Consumes: the validated 123-ID baseline from Task 1.
- Produces: family-level evidence map and one of the allowed wired statuses for every production ID.

- [ ] **Step 1: Locate every wired ID and family reference**

Run:

```powershell
rg -n "hero\.|monster\.|map\.floor_1|vfx\.|item\.|ui\." apps packages docs --glob '!docs/assets/phase-4-asset-manifest.json' --glob '!docs/assets/phase-4-asset-manifest.csv'
```

Expected: references from runtime registry, persistent UI, scenes, tests, and asset documentation. Save only real file paths and identifiers as evidence.

- [ ] **Step 2: Trace implemented hero, monster, movement, and combat states**

Run:

```powershell
rg -n "HERO_DEFINITIONS|MONSTER_DEFINITIONS|CardinalDirection|idle|walk|attack|movement-slow|charge-warning|charge-impact|monster-heal|spawnEffect" apps packages
```

Expected: six enabled persistent heroes, five monster definitions, four cardinal render directions, and the concrete combat/VFX events used by the active build.

- [ ] **Step 3: Classify existing visual state**

Inspect the resolver, asset report, screenshots, and mockups. Mark assets `Wired with Placeholder` when they resolve to CSS shapes, glyphs, or mock files. Use `Wired in Code` only for a genuinely wired non-placeholder visual contract; do not imply final art approval.

- [ ] **Step 4: Build the evidence map**

For each family, record the source file, asset key or component/function/configuration identifier, and one-sentence runtime usage. Every Inventory A row must link to one family evidence entry.

### Task 3: Audit Explicit Unwired Floor 1 GDD Requirements

**Files:**
- Read: `odd_tower_game_design_document_v0.1.md`
- Read: `packages/game-core/src/map.ts`
- Read: `packages/game-core/src/combat-config.ts`
- Read: `apps/client/src/game/scenes/GameScene.ts`
- Read: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Read: `apps/client/src/ui/**/*.tsx`

**Interfaces:**
- Consumes: Inventory A IDs and active-usage evidence from Tasks 1–2.
- Produces: deduplicated list of explicit unwired Floor 1 requirements and code–GDD conflicts.

- [ ] **Step 1: Extract Floor 1 GDD entities, zones, states, UI, items, and interactions**

Run:

```powershell
rg -n "Floor 1|ชั้น 1|Guardian|Refrigerator|Portal|Safe Zone|Camp|Shrine|Station|Chest|Vegetable|Sauce|Chocolate|Arena|boss|AFK|Summon|Inventory|HUD|Progress" odd_tower_game_design_document_v0.1.md
```

Expected: evidence lines for explicit Floor 1 requirements. Read surrounding sections before classifying any result.

- [ ] **Step 2: Subtract wired production coverage**

Compare each explicit requirement with Inventory A IDs and active render paths. If no current ID or runtime binding exists, classify it as `GDD-Defined, Not Wired`; if its appearance is underspecified, add `Proposed Visual Inference — Requires Approval`.

- [ ] **Step 3: Assign deterministic provisional IDs**

Assign sequential IDs `PENDING-F1-001`, `PENDING-F1-002`, and onward in stable production order: boss and combat-critical assets, environment zones and structures, gameplay indicators/VFX, items/rewards, then pending UI/screens. Never reuse or skip an ID after the document is presented for review.

- [ ] **Step 4: Record code–GDD conflicts**

For each affected family, record current implementation, GDD requirement, asset impact, and recommended decision. Repeat the conflict beside the corresponding Inventory A or B family.

### Task 4: Author the Two Inventories and Audit Matrices

**Files:**
- Create: `art-prompts/00_asset_inventory.md`

**Interfaces:**
- Consumes: validated production contract, evidence map, pending GDD list, and conflicts from Tasks 1–3.
- Produces: the reviewable asset inventory; no production prompts.

- [ ] **Step 1: Create the audit summary and status legend**

Write the source-priority rules, validated production count, placeholder conclusion, explicit separation between inventories, status definitions, and stop-condition policy.

- [ ] **Step 2: Write Inventory A with all 123 rows**

Use these columns exactly:

```markdown
| Asset ID | Asset name | Category | Priority | Status | Width | Height | Format | Background | Directions | Frames in deliverable | Anchor | Atlas group | Replacement path | Master dependency | Missing decisions | Production order |
```

Copy all technical fields directly from the manifest. Use `—` only where the source field is null or not applicable.

- [ ] **Step 3: Write Inventory B with provisional IDs**

Use these columns exactly:

```markdown
| Provisional ID | Asset name | Category | Priority | Implementation status | Design status | Suggested background | Direction/state needs | Master dependency | GDD evidence | Missing decisions | Production order |
```

Every row must state `Pending Implementation — GDD Requirement` and must not contain a production replacement path.

- [ ] **Step 4: Add required matrices and reports**

Add repository visual audit summary, implemented gameplay visual requirements, existing assets, missing/placeholder assets, animation/directional state matrix, UI/screen matrix, code–GDD conflict report, proposed inferences requiring approval, production order, and family-level implementation evidence.

- [ ] **Step 5: Add the master-design status note**

Apply `Proposed Visual Design — Becomes Master Reference if Approved` to the six heroes, five monsters, Floor 1 boss, and Floor 1 environment families without claiming that final artwork exists.

### Task 5: Validate the Inventory and Commit

**Files:**
- Validate: `art-prompts/00_asset_inventory.md`

**Interfaces:**
- Consumes: the authored inventory from Task 4 and canonical sources.
- Produces: a validated, committed audit ready for user review.

- [ ] **Step 1: Verify all production IDs occur in Inventory A exactly once**

Run a Node script that reads the manifest and Markdown, extracts the Inventory A section, and fails if any manifest ID is missing, duplicated, or if any extra dotted production ID appears as a row key. Print missing, duplicate, and extra arrays.

- [ ] **Step 2: Verify technical-field fidelity**

Parse Inventory A rows and compare ID, priority, dimensions, format, transparency/background, directions, frame count, anchors, atlas group, and replacement path against the JSON manifest. Fail on the first mismatch and print the ID, field, expected value, and actual value.

- [ ] **Step 3: Verify pending namespace isolation**

Extract Inventory B row IDs and assert that every ID matches `^PENDING-F1-\d{3}$`, all are unique, none occur in the production manifest, and no Inventory B row contains `/assets/final/`.

- [ ] **Step 4: Run content-quality checks**

Run:

```powershell
rg -n "TBD|TODO|Not confirmed by the current project sources|Pending Implementation — GDD Requirement|Proposed Visual Inference — Requires Approval|Proposed Visual Design — Becomes Master Reference if Approved" art-prompts/00_asset_inventory.md
git diff --check -- art-prompts/00_asset_inventory.md
```

Expected: no `TBD` or `TODO`; required uncertainty/status labels appear where appropriate; no whitespace errors.

- [ ] **Step 5: Review the final diff**

Confirm that no prompt-library files other than `00_asset_inventory.md` were created, no runtime files changed, P2/future-floor prompts were not generated, and `.superpowers/` remains untracked and unstaged.

- [ ] **Step 6: Commit the validated inventory**

Run:

```powershell
git add -- art-prompts/00_asset_inventory.md
git commit -m "docs: add validated Odd Tower asset inventory"
```

Expected: one commit containing only the inventory document.
