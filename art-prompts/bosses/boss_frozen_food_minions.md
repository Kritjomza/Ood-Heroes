# Frozen Food Minions

## Active Single-Sprite World Prompts

- `add_frozen_food_left_world.webp` → `/assets/game/adds/frozen_food_left/world.webp`
- `add_frozen_food_right_world.webp` → `/assets/game/adds/frozen_food_right/world.webp`

Create two separate isolated right-facing 96 × 96 transparent WebP world images for original Angry Refrigerator adds. Left: tiny pea bag with freezer-teal seams, silly annoyed face, cold-blue frost corners. Right: square fish-stick box with coral tab, freezer-teal markings without letters, silly determined face. Both use compact chibi geometry, thick rounded chocolate outlines, orthographic three-quarter top-down view, anchor 0.5,0.82, and neutral movement-ready poses for runtime mirroring. One add per file; no sheet, text, brand, shadow, background, alternate pose, or photorealism.

> Older family/variant material below is retained as design history; the two files above are the active runtime contract.

**Pending Implementation — GDD Requirement**  
**Proposed Visual Design — Becomes Master Reference if Approved**

## PENDING-F1-004 — Frozen-food minion family

**Category:** Boss / boss effect  
**MVP or Post-MVP:** Floor 1 MVP Batch 2  
**Source:** GDD §9, not wired  
**Implementation Status:** Pending Implementation — GDD Requirement  
**Design Status:** Proposed Visual Design — Becomes Master Reference if Approved  
**Gameplay Purpose:** undefined boss-family requirement  
**Recommended Background:** Transparent  
**Camera and Direction:** Orthographic three-quarter top-down; direction contract not confirmed  
**Scale Class:** Boss is 2.5–3 hero heights; minions smaller than normal monsters  
**Required Variants:** C6  
**Permanent Visual Invariants:** three modular original silhouettes: tiny pea bag, square fish-stick box, and wobbling ice-pop tray; shared freezer teal/cold-blue family marks and silly annoyed faces; palette cold blue #78c8e3, freezer teal #3c8f98, coral #e56c67, cream #fff3df; rounded #2b1a14 outline, upper-left light, cute graphic face, consistent scale and contact point  
**Generation Order:** After boss master approval and before runtime ID assignment  
**Recommended Filename:** Not confirmed by current project sources

### Design Summary

three modular original silhouettes: tiny pea bag, square fish-stick box, and wobbling ice-pop tray; shared freezer teal/cold-blue family marks and silly annoyed faces. **Code–GDD Conflict undefined:** no boss renderer, definition, or production asset contract exists; this remains provisional.

### Copy-Ready Main Prompt

Create an original Odd Tower provisional Frozen-food minion family visual. three modular original silhouettes: tiny pea bag, square fish-stick box, and wobbling ice-pop tray; shared freezer teal/cold-blue family marks and silly annoyed faces. Palette: cold blue #78c8e3, freezer teal #3c8f98, coral #e56c67, cream #fff3df. Required states: C6. Use compact candy-colored food-fantasy chibi geometry, thick rounded #2b1a14 outlines, minimal cel shading, upper-left light, transparent background, no text, and clear mobile readability. Preserve the exact Angry Refrigerator doors, handles, shelves, contents, face, upper-right dent, proportions, and scale whenever the boss appears. Do not assign dimensions, atlas layout, anchor, or production path.

### Copy-Ready Negative Prompt

Universal negative prompt plus no realistic appliance brand, logo, label, writing, horror, photorealism, changed door count, moved dent, changed handle, changed contents, extra shelves, perspective drift, or environment.

### Variant Prompts

- **C6:** Preserve all permanent geometry and palette; change only action pose, expression, deformation, light state, and required particles.

### Consistency Notes

Use one approved boss/minion master. The refrigerator interior shelf count, frozen contents, handles, dent, and indicator face never move between states.

### Cleanup Notes

Correct door geometry, shelf continuity, handle duplication, alpha fringe, false text on packaging, and phase-to-phase scale drift.

## PENDING-F1-005 — Blackout phase treatment

**Category:** Boss / boss effect  
**MVP or Post-MVP:** Floor 1 MVP Batch 2  
**Source:** GDD §9, not wired  
**Implementation Status:** Pending Implementation — GDD Requirement  
**Design Status:** Proposed Visual Inference — Requires Approval  
**Gameplay Purpose:** undefined boss-family requirement  
**Recommended Background:** Transparent  
**Camera and Direction:** Orthographic three-quarter top-down; direction contract not confirmed  
**Scale Class:** Boss is 2.5–3 hero heights; minions smaller than normal monsters  
**Required Variants:** C6  
**Permanent Visual Invariants:** same refrigerator with indicator eyes dark except one flickering coral emergency light, fixed dent and doors unchanged; surrounding scalloped dark-cocoa vignette and faster warning pulses; palette deep cocoa #4a2b24, coral #e56c67, cold blue #78c8e3; rounded #2b1a14 outline, upper-left light, cute graphic face, consistent scale and contact point  
**Generation Order:** After boss master approval and before runtime ID assignment  
**Recommended Filename:** Not confirmed by current project sources

### Design Summary

same refrigerator with indicator eyes dark except one flickering coral emergency light, fixed dent and doors unchanged; surrounding scalloped dark-cocoa vignette and faster warning pulses. **Code–GDD Conflict undefined:** no boss renderer, definition, or production asset contract exists; this remains provisional.

### Copy-Ready Main Prompt

Create an original Odd Tower provisional Blackout phase treatment visual. same refrigerator with indicator eyes dark except one flickering coral emergency light, fixed dent and doors unchanged; surrounding scalloped dark-cocoa vignette and faster warning pulses. Palette: deep cocoa #4a2b24, coral #e56c67, cold blue #78c8e3. Required states: C6. Use compact candy-colored food-fantasy chibi geometry, thick rounded #2b1a14 outlines, minimal cel shading, upper-left light, transparent background, no text, and clear mobile readability. Preserve the exact Angry Refrigerator doors, handles, shelves, contents, face, upper-right dent, proportions, and scale whenever the boss appears. Do not assign dimensions, atlas layout, anchor, or production path.

### Copy-Ready Negative Prompt

Universal negative prompt plus no realistic appliance brand, logo, label, writing, horror, photorealism, changed door count, moved dent, changed handle, changed contents, extra shelves, perspective drift, or environment.

### Variant Prompts

- **C6:** Preserve all permanent geometry and palette; change only action pose, expression, deformation, light state, and required particles.

### Consistency Notes

Use one approved boss/minion master. The refrigerator interior shelf count, frozen contents, handles, dent, and indicator face never move between states.

### Cleanup Notes

Correct door geometry, shelf continuity, handle duplication, alpha fringe, false text on packaging, and phase-to-phase scale drift.

## Runtime Decisions Pending

No production path, final dimensions, anchor, frame count, or atlas layout is assigned until runtime implementation defines the contract.
