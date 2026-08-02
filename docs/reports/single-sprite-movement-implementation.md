# Single-Sprite Movement Implementation Report

## Outcome

The four-pose runtime has been replaced by one right-facing world image per character. Left movement uses horizontal mirroring. Idle, locomotion, attack emphasis, and weight are expressed at runtime with profile-driven bob, squash/stretch, lean, and an independently animated shadow. Physics and network roots remain unscaled and unrotated.

## Architecture

- `SingleSpriteMotionController` converts interpolated displacement into facing and a deterministic visual pose.
- Motion profiles cover light, normal, heavy, jelly, floating, and boss silhouettes.
- A 4 px movement threshold and 120 ms idle timeout suppress network jitter.
- Vertical-only movement preserves the most recent horizontal facing.
- Local heroes/followers, remote heroes/followers, monsters, the guardian, adds, and NPC registry entries share the same world-image contract.
- Missing production WebPs render explicit procedural fallbacks; they never trigger a return to pose atlases.

## Four-pose migration

Six hero `.sprite_directional` manifest entries became `.world` entries. Atlas frame metadata and direction-frame selection were removed from active runtime paths. Five monster left-facing runtime contracts became right-facing `.world` contracts. Historical pose text remains in owner prompt files, clearly marked as migration history.

## Asset state

The active source manifest contains 17 world images: 6 heroes, 5 monsters, 1 guardian, 2 adds, and 3 NPCs. The required production WebPs are not yet present. The six existing hero PNGs are preserved as identity/reference inputs, not runtime assets.

## Verification

- Motion and sprite runtime tests passed.
- Asset manifest generation/validation passed: 75 IDs; priorities 39/17/19; sources 6/5/40/51.
- Prompt validation passed for 6/5/1/2/3 active world sources.
- Workspace typecheck, lint, and production build passed.

## Limitations

- Final authored transparent WebPs still need to be generated from the active prompts.
- Procedural fallback art is intentionally graybox-quality.
- The production bundle remains a single large client chunk (about 1.80 MB, 495.61 KB gzip).
