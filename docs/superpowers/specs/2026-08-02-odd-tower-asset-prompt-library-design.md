# Odd Tower Asset Prompt Library Design

## Objective

Create an evidence-based asset inventory and, after its validation, a production-ready English image-generation prompt library for Odd Tower. The implemented codebase is the immediate source of truth. The GDD supplies explicitly pending Floor 1 requirements that are not yet wired into the runtime.

The first implementation milestone is limited to auditing and creating `art-prompts/00_asset_inventory.md`. Full production prompts must not be written until both inventory counts have been validated.

## Source Priority

Use evidence in this order:

1. Active code paths and the active production asset manifest.
2. Existing project-authored assets and mockups.
3. `odd_tower_game_design_document_v0.1.md`.
4. Approved visual direction in this specification.
5. Restrained visual inference, explicitly labeled as requiring approval.

Do not invent file paths, identifiers, runtime states, or implemented features.

## Inventory Architecture

`art-prompts/00_asset_inventory.md` contains two inventories.

### Inventory A: Wired Production Assets

- Contains exactly the 123 asset IDs in the active manifest/code contract.
- Preserves each asset's exact ID, priority, dimensions, WebP format, transparency, directions, frame count, anchors, atlas group, and replacement path.
- Counts asset deliverables separately from animation frames stored inside atlases.
- Uses only the statuses `Wired in Code` or `Wired with Placeholder`, based on evidence.
- Includes implementation evidence for every family: file path, identifier or asset key, and a concise usage explanation.
- Stops the implementation and reports evidence if the active audited manifest does not contain exactly 123 unique wired IDs.

### Inventory B: Unwired GDD Floor 1 Assets

- Contains only explicit Floor 1 requirements from the GDD that are absent from Inventory A.
- Uses unique provisional IDs in the `PENDING-F1-*` namespace.
- Labels every entry `Pending Implementation — GDD Requirement` and `GDD-Defined, Not Wired`.
- Never assigns an existing production ID, replacement path, atlas group, or runtime status to pending content.
- Uses `Proposed Visual Inference — Requires Approval` where the GDD establishes a gameplay need but not a complete appearance.
- Does not contribute to the 123 wired production-asset count.

## Classification Rules

Every inventory entry has one source/status classification:

- `Wired in Code`
- `Wired with Placeholder`
- `GDD-Defined, Not Wired`
- `Proposed Visual Inference — Requires Approval`

The master visual designs for the six heroes, five Floor 1 monsters, Floor 1 boss, and Floor 1 environment families use:

`Proposed Visual Design — Becomes Master Reference if Approved`

This label does not claim that final art exists or has previously been approved.

## Approved Style DNA

Use the user's supplied reference only for broad visual principles. Create original Odd Tower designs without copying its characters, costumes, props, or compositions.

- Compact food-fantasy chibi figures with oversized heads, tiny bodies, short limbs, and strong silhouette asymmetry.
- Thick, smooth, rounded dark-chocolate linework based on `#2b1a14`; never pure black.
- Flat saturated candy colors, generally limited to three to five main colors per character.
- Minimal cel shading: one broad shadow region and one controlled highlight region.
- Large geometric eyes, tiny mouths, and readable eyebrow or eyelid expressions.
- Simple costume and prop shapes, with detail concentrated around the face and signature feature.
- No photorealism, painterly texture, thin sterile vectors, anatomical realism, or dense micro-detail.
- Three-quarter top-down gameplay camera with consistent upper-left lighting.
- Strong silhouette and facial readability at 48 CSS pixels.

Use a tiered rendering system: gameplay sprites receive the simplest flat treatment; portraits and collection cards may add controlled highlights and presentation polish without changing the master silhouette, palette, materials, face, costume, outline treatment, or signature features.

## Technical Inheritance

Once a master visual design is approved, every related atlas, portrait, icon, effect, and variant inherits its fixed invariant block:

- Silhouette and body proportions
- Main and secondary palette
- Material language and surface treatment
- Facial structure and expression language
- Costume, body features, weapon, prop, and toppings
- Chocolate outline color and thickness behavior
- Camera angle and scale
- Upper-left lighting direction
- Ground-contact position and anchor behavior
- Mobile readability requirements

Every eventual production prompt must be self-contained. Family-level organization may reduce document repetition, but no copy-ready prompt may rely on unstated context.

## Code–GDD Conflicts

Record conflicts in the initial audit and repeat them beside every affected asset family. Each conflict states:

- Current implementation
- GDD requirement
- Asset impact
- Recommended decision

The current production inventory always follows the active code contract. The GDD alternative remains pending unless and until the runtime is updated.

## Production Scope and Ordering

1. Audit and validate Inventory A and Inventory B.
2. Obtain approval for `00_asset_inventory.md` and its counts.
3. Establish and approve master references.
4. Produce copy-ready prompts for wired P0 assets.
5. Produce copy-ready prompts for wired P1 assets.
6. Produce Batch 2 prompts for pending Floor 1 GDD assets.

P2 polish assets and Floors 2–10 are outside the immediate production scope. They may be inventoried where required for completeness but do not delay P0/P1 or pending Floor 1 work.

## Validation

Before presenting `00_asset_inventory.md`:

- Confirm Inventory A has exactly 123 unique production IDs.
- Confirm every ID matches the active manifest exactly.
- Confirm technical fields match the manifest without normalization or inference.
- Confirm aggregate priority counts match project evidence.
- Confirm deliverable counts and contained frame counts are separate.
- Confirm Inventory B contains no Inventory A ID or replacement path.
- Confirm all Inventory B IDs are unique and use `PENDING-F1-*`.
- Confirm every row cites a real source.
- Confirm all missing design information is explicitly labeled.
- Confirm no unwired GDD content is described as runtime-supported.

Any discrepancy in the active wired count is a stop condition requiring an evidence report before further work.

## Deliverable Files

The eventual library follows the requested `art-prompts/00_...13_...` structure. The first approved implementation deliverable is only:

- `art-prompts/00_asset_inventory.md`

The remaining prompt files begin only after both inventories and their counts are reviewed and approved.
