# Robot Jelly Production Prompts

> **Active gameplay contract:** one right-facing transparent world image. Four-pose sections below are retained only as migration history.

## Active World Image Prompt

- Filename: `hero_robot_jelly_world.webp`
- Production: `/assets/game/heroes/hero_003_robot_jelly/world.webp`

Create one isolated right-facing 96 × 96 transparent WebP world image of the approved Robot Jelly, preserving its exact jelly-machine silhouette, palette, face, mechanical features, thick rounded chocolate outline, and orthographic three-quarter top-down camera. Neutral movement-ready stance, stable contact at anchor 0.5,0.82, designed for elastic runtime squash. One character only; no sheet, alternate pose, shadow, background, text, blur, or copied character.

## Hero Identity

- **Definition ID:** `hero_003_robot_jelly`
- **Combat Role:** tank
- **Rarity:** common
- **Approval Status:** Proposed Visual Design — Becomes Master Reference if Approved
- **Implementation Status:** Wired with Placeholder


**Master Status:** Proposed Visual Design — Becomes Master Reference if Approved  
**Silhouette:** short, widest hero, dome top and blocky shield arms  
**Permanent Palette:** mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24  
**Body/Costume/Prop:** a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right  
**Dominant Personality:** earnest defensive appliance  
**Scale Class:** short-wide  
**Ground Contact:** centered under the body mass; all later gameplay frames use anchor 0.5, 0.82  

## Copy-Ready Master Reference Prompt

Create an original full-body master reference for Robot Jelly, a common tank in Odd Tower. a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Show front three-quarter, back three-quarter, and clean silhouette callout on a neutral cream presentation sheet, with no labels or text. Compact food-fantasy chibi proportions, expressive graphic face, strong 48 px readability, consistent upper-left lighting, no environment. This sheet establishes the permanent appearance for all portraits, icons, cards, and orthographic three-quarter top-down gameplay sprites.

## Master Negative Prompt

Use the universal negative prompt. Also exclude new costume pieces, alternate weapons, extra toppings, anatomy redesign, different eye style, different outline color, side-view-only pose, isometric projection, and text annotations.

## hero.robot_jelly.portrait — Robot Jelly portrait

**Category:** Hero  
**MVP or Post-MVP:** MVP P0  
**Source:** Proposed Visual Design — Becomes Master Reference if Approved  
**Implementation Status:** Wired with Placeholder  
**Gameplay Purpose:** Collection, Hero Detail, Team Builder, and Combat portrait  
**Recommended Background:** Transparent  
**Camera and Direction:** front three-quarter portrait derived from master  
**Output Contract:** 512 × 512 WebP  
**Required Variants:** One  
**Permanent Visual Invariants:** Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.  
**Generation Order:** After master approval; before directional atlas assembly  
**Recommended Filename:** `/assets/final/hero/robot_jelly/portrait.webp`

### Design Summary

Robot Jelly is an original tank hero with a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. The short, widest hero, dome top and blocky shield arms supports instant recognition at mobile scale.

### Copy-Ready Main Prompt

Create one original Odd Tower portrait for Robot Jelly, a common tank. a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. Composition: head-and-upper-body portrait with signature prop edge visible and generous transparent safe area. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Use clean saturated candy color blocks, minimal cel shading, soft upper-left light, crisp alpha transparency, no cast shadow, no environment, no text. Verify recognition at 48 CSS pixels. Output exactly 512 × 512 pixels for WebP export.

### Copy-Ready Negative Prompt

Use the universal negative prompt from 01_odd_tower_style_dna.md, including no text, no copied character, no pure black, no photorealism, no painterly texture, no extra/missing limbs, no altered prop, no unsafe crop, and no baked background.

### Consistency Notes

Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.

### Cleanup Notes

Check eye spacing, outline thickness, signature-prop geometry, alpha fringe, safe crop, and 48 px readability. Correct any extra markings or accessory drift manually.
## hero.robot_jelly.icon — Robot Jelly icon

**Category:** Hero  
**MVP or Post-MVP:** MVP P0  
**Source:** Proposed Visual Design — Becomes Master Reference if Approved  
**Implementation Status:** Wired with Placeholder  
**Gameplay Purpose:** Small HUD and selection identity  
**Recommended Background:** Transparent  
**Camera and Direction:** front three-quarter close icon derived from master  
**Output Contract:** 128 × 128 WebP  
**Required Variants:** One  
**Permanent Visual Invariants:** Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.  
**Generation Order:** After master approval; before directional atlas assembly  
**Recommended Filename:** `/assets/final/hero/robot_jelly/icon.webp`

### Design Summary

Robot Jelly is an original tank hero with a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. The short, widest hero, dome top and blocky shield arms supports instant recognition at mobile scale.

### Copy-Ready Main Prompt

Create one original Odd Tower icon for Robot Jelly, a common tank. a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. Composition: extreme simplified face-and-signature-feature icon, no crop ambiguity, readable at 48 CSS pixels. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Use clean saturated candy color blocks, minimal cel shading, soft upper-left light, crisp alpha transparency, no cast shadow, no environment, no text. Verify recognition at 48 CSS pixels. Output exactly 128 × 128 pixels for WebP export.

### Copy-Ready Negative Prompt

Use the universal negative prompt from 01_odd_tower_style_dna.md, including no text, no copied character, no pure black, no photorealism, no painterly texture, no extra/missing limbs, no altered prop, no unsafe crop, and no baked background.

### Consistency Notes

Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.

### Cleanup Notes

Check eye spacing, outline thickness, signature-prop geometry, alpha fringe, safe crop, and 48 px readability. Correct any extra markings or accessory drift manually.
## hero.robot_jelly.collection_card — Robot Jelly collection card

**Category:** Hero  
**MVP or Post-MVP:** MVP P0  
**Source:** Proposed Visual Design — Becomes Master Reference if Approved  
**Implementation Status:** Wired with Placeholder  
**Gameplay Purpose:** Hero Collection and summon presentation  
**Recommended Background:** Transparent  
**Camera and Direction:** front three-quarter full-body presentation pose  
**Output Contract:** 640 × 800 WebP  
**Required Variants:** One  
**Permanent Visual Invariants:** Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.  
**Generation Order:** After master approval; before directional atlas assembly  
**Recommended Filename:** `/assets/final/hero/robot_jelly/collection_card.webp`

### Design Summary

Robot Jelly is an original tank hero with a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. The short, widest hero, dome top and blocky shield arms supports instant recognition at mobile scale.

### Copy-Ready Main Prompt

Create one original Odd Tower collection card for Robot Jelly, a common tank. a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right. Composition: full-body dynamic collectible pose with signature prop, restrained role-colored abstract particles only, transparent background and no card text. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Use clean saturated candy color blocks, minimal cel shading, soft upper-left light, crisp alpha transparency, no cast shadow, no environment, no text. Verify recognition at 48 CSS pixels. Output exactly 640 × 800 pixels for WebP export.

### Copy-Ready Negative Prompt

Use the universal negative prompt from 01_odd_tower_style_dna.md, including no text, no copied character, no pure black, no photorealism, no painterly texture, no extra/missing limbs, no altered prop, no unsafe crop, and no baked background.

### Consistency Notes

Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking.

### Cleanup Notes

Check eye spacing, outline thickness, signature-prop geometry, alpha fringe, safe crop, and 48 px readability. Correct any extra markings or accessory drift manually.

## Google Flow Output Map

| Output | Filename | Intake path | Production destination |
|---|---|---|---|
| Master reference | `master_hero_robot_jelly.webp` | `art-review/incoming/heroes/robot_jelly/master_hero_robot_jelly.webp` | Review-only master |
| Portrait | `hero_robot_jelly_portrait.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_portrait.webp` | `/assets/final/hero/robot_jelly/portrait.webp` |
| Icon | `hero_robot_jelly_icon.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_icon.webp` | `/assets/final/hero/robot_jelly/icon.webp` |
| Collection card | `hero_robot_jelly_collection_card.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_collection_card.webp` | `/assets/final/hero/robot_jelly/collection_card.webp` |
| idle_a | `hero_robot_jelly_idle_a.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_idle_a.webp` | Atlas source only |
| idle_b | `hero_robot_jelly_idle_b.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_idle_b.webp` | Atlas source only |
| move_left_a | `hero_robot_jelly_move_left_a.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_move_left_a.webp` | Atlas source only |
| move_left_b | `hero_robot_jelly_move_left_b.webp` | `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_move_left_b.webp` | Atlas source only |

## Four Gameplay Prompts

### idle_a

- **Prompt ID:** hero.robot_jelly.gameplay.idle_a
- **Google Flow Filename:** `hero_robot_jelly_idle_a.webp`
- **Intake Path:** `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_idle_a.webp`
- **Atlas Frame:** 0

Create one isolated 96 × 96 transparent WebP gameplay source for Robot Jelly. Use a neutral front-three-quarter standing pose that is not direction-specific. Create the primary clear pose for this state. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Preserve the approved original master identity: oversized chibi head, tiny body, rounded simplified shape language, expressive face, signature feature/prop, bright pastel candy colors, minimal cel shading, clean flat color blocking, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the feet on the shared baseline at anchor 0.5, 0.82 with identical occupied area and transparent margins. Funny, charming, collectible, and readable at 48 CSS pixels. One character only. No sprite sheet, up/down/right source pose, attack pose, motion blur, environment, floor shadow, text, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

### idle_b

- **Prompt ID:** hero.robot_jelly.gameplay.idle_b
- **Google Flow Filename:** `hero_robot_jelly_idle_b.webp`
- **Intake Path:** `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_idle_b.webp`
- **Atlas Frame:** 1

Create one isolated 96 × 96 transparent WebP gameplay source for Robot Jelly. Use a neutral front-three-quarter standing pose that is not direction-specific. Create a subtle alternate weight/breathing or step variation while preserving the exact silhouette scale and contact point. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Preserve the approved original master identity: oversized chibi head, tiny body, rounded simplified shape language, expressive face, signature feature/prop, bright pastel candy colors, minimal cel shading, clean flat color blocking, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the feet on the shared baseline at anchor 0.5, 0.82 with identical occupied area and transparent margins. Funny, charming, collectible, and readable at 48 CSS pixels. One character only. No sprite sheet, up/down/right source pose, attack pose, motion blur, environment, floor shadow, text, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

### move_left_a

- **Prompt ID:** hero.robot_jelly.gameplay.move_left_a
- **Google Flow Filename:** `hero_robot_jelly_move_left_a.webp`
- **Intake Path:** `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_move_left_a.webp`
- **Atlas Frame:** 2

Create one isolated 96 × 96 transparent WebP gameplay source for Robot Jelly. Face clearly left in a playful readable movement pose. Create the primary clear pose for this state. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Preserve the approved original master identity: oversized chibi head, tiny body, rounded simplified shape language, expressive face, signature feature/prop, bright pastel candy colors, minimal cel shading, clean flat color blocking, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the feet on the shared baseline at anchor 0.5, 0.82 with identical occupied area and transparent margins. Funny, charming, collectible, and readable at 48 CSS pixels. One character only. No sprite sheet, up/down/right source pose, attack pose, motion blur, environment, floor shadow, text, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

### move_left_b

- **Prompt ID:** hero.robot_jelly.gameplay.move_left_b
- **Google Flow Filename:** `hero_robot_jelly_move_left_b.webp`
- **Intake Path:** `art-review/incoming/heroes/robot_jelly/hero_robot_jelly_move_left_b.webp`
- **Atlas Frame:** 3

Create one isolated 96 × 96 transparent WebP gameplay source for Robot Jelly. Face clearly left in a playful readable movement pose. Create a subtle alternate weight/breathing or step variation while preserving the exact silhouette scale and contact point. Preserve exactly: short, widest hero, dome top and blocky shield arms; a wide translucent jelly dome mounted on a compact brass dessert-tin chassis, two square shield forearms, stubby piston feet, a visible single wobbling core cube, round LED eyes, and a straight tiny mouth; a wind-up key sits permanently on the back-right; permanent palette mint jelly #72d6aa, sky glass #6fc9e8, brass #d8a64a, cocoa mechanics #4a2b24; earnest defensive appliance; thick rounded #2b1a14 exterior outline with half-weight interior lines; flat graphic food-fantasy chibi rendering, one broad lower-right shadow and one compact upper-left highlight; no added accessory, costume, weapon, topping, or marking. Preserve the approved original master identity: oversized chibi head, tiny body, rounded simplified shape language, expressive face, signature feature/prop, bright pastel candy colors, minimal cel shading, clean flat color blocking, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the feet on the shared baseline at anchor 0.5, 0.82 with identical occupied area and transparent margins. Funny, charming, collectible, and readable at 48 CSS pixels. One character only. No sprite sheet, up/down/right source pose, attack pose, motion blur, environment, floor shadow, text, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

## Gameplay Atlas Assembly Contract

- Parent Asset ID: `hero.robot_jelly.sprite_directional` (stable compatibility ID)
- Frame order: `idle_a`, `idle_b`, `move_left_a`, `move_left_b`
- Four 96 × 96 transparent sources assembled horizontally into one 384 × 96 WebP
- Anchor: 0.5, 0.82
- Normalize baseline, occupied area, contact point, lighting, and transparent margins before assembly
- Assemble programmatically after all four sources pass review; Google Flow must not generate the atlas
- Production destination: `/assets/final/hero/robot_jelly/sprite_directional.webp`

## Negative Prompt

No copied character design, text, watermark, sprite sheet, up/down/right gameplay source, attack frame, realistic anatomy, gritty rendering, painterly texture, dense detail overload, harsh black outline, photorealism, camera drift, scale drift, or alpha fringe.

## Readability Checklist

- [ ] Original silhouette and personality read immediately at 48 CSS pixels
- [ ] Master identity, palette, materials, face, costume/body features, and signature item match
- [ ] All four sources share scale, baseline, contact point, camera, light, and margins
- [ ] idle_a/idle_b form a subtle loop; move_left_a/move_left_b form a playful loop
- [ ] No up/down/right or attack artwork is present
- [ ] Approval remains **Proposed Visual Design — Becomes Master Reference if Approved**
