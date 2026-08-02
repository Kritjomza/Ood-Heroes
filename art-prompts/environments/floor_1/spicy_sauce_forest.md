# Spicy Sauce Forest

**Pending Implementation — GDD Requirement**  
**Proposed Visual Design — Becomes Master Reference if Approved**

## PENDING-F1-011 — Spicy Sauce Forest Environment Family

**Category:** Environment  
**MVP or Post-MVP:** Floor 1 MVP Batch 2  
**Source:** GDD §9 lines 269–273  
**Implementation Status:** Pending Implementation — GDD Requirement  
**Design Status:** Proposed Visual Design — Becomes Master Reference if Approved  
**Gameplay Purpose:** terrain, narrow paths, obstacles, transitions  
**Recommended Background:** Environment / seamless families  
**Camera and Direction:** Orthographic top-down aligned to 32 px logical tiles  
**Scale Class:** Lower detail and contrast than heroes  
**Required Variants:** terrain, narrow paths, obstacles, transitions  
**Permanent Visual Invariants:** warm coral-red ground accents, dark green chili foliage, twisted sauce-vine silhouettes, narrower but readable paths, medium rounded obstacles, restrained heat haze; rounded #2b1a14-brown structural accents, upper-left light, cream/mint shared Floor 1 base, sparse decoration, mobile path readability  
**Generation Order:** After Floor 1 style board; before props/structures  
**Recommended Filename:** Not confirmed by current project sources

### Design Summary

warm coral-red ground accents, dark green chili foliage, twisted sauce-vine silhouettes, narrower but readable paths, medium rounded obstacles, restrained heat haze. **Code–GDD Conflict C2:** this zone is explicit in the GDD but has no distinct runtime asset ID or slicing contract.

### Copy-Ready Main Prompt

Create an original Odd Tower environment style board and modular terrain family for Spicy Sauce Forest. Visual language: warm coral-red ground accents, dark green chili foliage, twisted sauce-vine silhouettes, narrower but readable paths, medium rounded obstacles, restrained heat haze. Show center terrain, four outer edges, four outer corners, four inner corners, one transition into the shared cream-and-mint Floor 1 base, two restrained decorative variations, and clear examples of terrain, narrow paths, obstacles, transitions. Orthographic top-down, tile-grid aligned, saturated pastel food-fantasy color, rounded chocolate-brown structural lines based on #2b1a14, upper-left light, low detail density, large readable paths, no text, no characters, no isometric perspective. Dimensions and final slicing remain unconfirmed.

### Copy-Ready Negative Prompt

Universal negative prompt plus no isometric diamonds, cinematic perspective, dense clutter, tiny props everywhere, unreadable paths, baked labels, realistic dirt/food, horror, random tile sizes, or character silhouettes.

### Variant Prompts

- **Center/edges/corners:** seamless grid alignment and identical material scale.
- **Transition:** clear blend into shared Floor 1 base without muddy color.
- **Decoration:** no more than 20% decorated area; preserve gameplay clarity.
- **Gameplay states:** terrain, narrow paths, obstacles, transitions; communicate without text.

### Consistency Notes

Keep shared outline, upper-left light, tile scale, path width language, and subdued environment contrast across all Floor 1 zones.

### Cleanup Notes

Correct seams, corner mismatches, inconsistent tile scale, false text, perspective drift, over-decoration, and collision-edge ambiguity.

## Runtime Decisions Pending

No production path, final dimensions, anchor, frame count, or atlas layout is assigned until runtime implementation defines the contract.
