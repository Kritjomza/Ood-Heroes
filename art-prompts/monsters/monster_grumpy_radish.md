# Grumpy Radish Production Prompts

> **Active gameplay contract:** one right-facing `world.webp`; the left-facing section below is retained as migration history.

## Active World Image Prompt

- Filename: `monster_grumpy_radish_world.webp`
- Production: `/assets/game/monsters/grumpy_radish/world.webp`

Create one isolated right-facing 96 × 96 transparent WebP world image of the approved Grumpy Radish: round magenta bulb, leaf eyebrows, chipped root-tooth, dirt-stained fists, root feet, offended frown, fixed palette and thick rounded chocolate outline. Orthographic three-quarter top-down, anchor 0.5,0.82, neutral movement-ready stance for runtime mirroring and squash. One monster only; no sheet, alternate pose, shadow, background, text, blur, or copied character.

## Monster Identity

- **Parent Asset ID:** `monster.grumpy_radish`
- **Implementation:** Wired with Placeholder
- **Master Status:** Proposed Visual Design — Becomes Master Reference if Approved

## Behavior Summary

close-range attacker; special: Beginner Vegetable Patch

## Short Design Summary

## Fixed Visual Invariants

Preserve exactly magenta #c95078, leaf #6fbd62, dirt #9b6748, cream #fff3df; a round magenta radish bulb with two leaf eyebrows, one chipped root-tooth, tiny dirt-stained fists, short root feet, and a permanently offended frown; palette compact round bulb; leaf eyebrows form horn-like silhouette; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Fixed Visual Invariant Block

Preserve exactly magenta #c95078, leaf #6fbd62, dirt #9b6748, cream #fff3df; a round magenta radish bulb with two leaf eyebrows, one chipped root-tooth, tiny dirt-stained fists, short root feet, and a permanently offended frown; palette compact round bulb; leaf eyebrows form horn-like silhouette; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels.

## Master-Reference Prompt

- **Google Flow Filename:** `master_monster_grumpy_radish.webp`
- **Intake:** `art-review/incoming/monsters/grumpy_radish/master_monster_grumpy_radish.webp`

Create an original full-body master reference for Grumpy Radish. Preserve exactly magenta #c95078, leaf #6fbd62, dirt #9b6748, cream #fff3df; a round magenta radish bulb with two leaf eyebrows, one chipped root-tooth, tiny dirt-stained fists, short root feet, and a permanently offended frown; palette compact round bulb; leaf eyebrows form horn-like silhouette; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Present an oversized chibi head, tiny body, rounded simple silhouette, expressive funny face, one memorable visual gimmick, bright pastel candy palette, clean flat blocking, minimal cel shading, upper-left highlights, and thick smooth chocolate #2b1a14 outlines. Show a left-facing gameplay identity view plus a clean silhouette callout. No labels, copied character, realism, gritty texture, or dense detail.

## Left-Facing Gameplay Sprite Prompt

- **Google Flow Filename:** `monster_grumpy_radish_left.webp`
- **Intake:** `art-review/incoming/monsters/grumpy_radish/monster_grumpy_radish_left.webp`
- **Final Production Path:** `/assets/final/monster/grumpy_radish.webp`

Create one original isolated left-facing 96 × 96 transparent WebP gameplay sprite for Grumpy Radish. Preserve exactly magenta #c95078, leaf #6fbd62, dirt #9b6748, cream #fff3df; a round magenta radish bulb with two leaf eyebrows, one chipped root-tooth, tiny dirt-stained fists, short root feet, and a permanently offended frown; palette compact round bulb; leaf eyebrows form horn-like silhouette; none; thick rounded #2b1a14 outline; upper-left light; orthographic three-quarter top-down camera; fixed anchor 0.5, 0.82; cute hostile expression; readable at 48 CSS pixels. Match the approved master exactly while simplifying for tiny gameplay scale: oversized expressive head, tiny compact body, one strong funny visual gimmick, clear left-facing movement-ready stance, bright pastel candy colors, minimal cel shading, clean color blocks, upper-left highlight, and thick smooth chocolate #2b1a14 outline. Keep the ground contact stable at anchor 0.5, 0.82 with safe transparent margins. One monster only; no animation atlas, alternate direction, background, shadow, text, border, VFX, motion blur, realistic anatomy, gritty rendering, painterly texture, dense detail, harsh black outline, photorealism, or copied character design.

## Runtime Contract

The reviewed source becomes the final one-frame production asset after validation. Phaser mirrors it horizontally for right-facing movement and uses code-driven bob, bounce, squash/stretch, hit flash/shake, and defeat fade.

## Negative Prompt

No copied character, multiple frames, atlas, right-facing source, up/down source, text, background, realistic anatomy, horror treatment, gritty texture, painterly rendering, dense detail, harsh black outline, or photorealism.

## Readability Checklist

- [ ] Silhouette, face, gimmick, and left-facing orientation read at 48 CSS pixels
- [ ] Master palette, material, outline, camera, light, scale, and contact point match
- [ ] 96 × 96 WebP has clean transparency and safe margins
- [ ] Exactly one gameplay sprite exists; no atlas assembly is required
