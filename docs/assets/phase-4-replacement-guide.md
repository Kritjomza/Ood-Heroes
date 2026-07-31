# Phase 4 Asset Replacement Guide

Odd Tower resolves visuals by stable Asset ID through
`apps/client/src/assets/asset-registry.ts`. UI and gameplay components must request an
ID; they must not import a final image path directly.

## Replace a mock

1. Find the Asset ID in `phase-4-asset-manifest.json`.
2. Produce the file using its dimensions, transparency, directions, frame count,
   anchors, style notes, and negative requirements.
3. Export it to `targetFilePath` under `apps/client/public/assets/final/`. The leading
   `/assets/final/` is the browser URL.
4. Keep the Asset ID unchanged. Atlas metadata may be added beside the image, but the
   registry remains the stable lookup boundary.
5. Run `npm run assets:manifest` only after intentionally changing registry metadata.
6. Run `npm run assets:validate`, `npm run typecheck`, and the persistent browser test.
7. Compare the result with `docs/assets/mockup-screens/` at desktop and mobile
   landscape sizes.

If the final file is missing or fails to load, the registry's CSS/glyph fallback
continues to render. Replacement art must preserve readable silhouettes at 48 CSS
pixels, avoid baked text, and retain the documented anchor.

## Atlas conventions

- Idle: four frames for each of down, up, left, and right.
- Walk: six frames for each of down, up, left, and right.
- Attack: 32-frame atlas containing eight frames per direction.
- Hero feet use `(0.5, 0.82)`; centered VFX use `(0.5, 0.5)`.
- Do not silently change frame counts or directions; update and regenerate the
  manifest as an explicit contract change.
