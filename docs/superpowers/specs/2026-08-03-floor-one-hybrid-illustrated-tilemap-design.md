# Floor 1 Hybrid Illustrated Tilemap Design

## Outcome

Floor 1 keeps its existing 64 x 64, 32-pixel gameplay grid while replacing visible debug geometry with a layered, replaceable illustrated world. Character art is normalized to role-based display heights, animation composes with that base scale, and physics remains centered at the feet.

## Architecture

- A centralized asset registry owns stable IDs, final filenames, metadata, and fallback colors.
- Phaser renders reusable ground tiles, transitions, river segments, props, decals, and landmarks in deterministic layers.
- Missing art uses generated in-memory textures; final files can replace the registered paths without scene changes.
- Collision and slow-terrain layers remain authoritative data. Collision is invisible unless an explicit debug flag enables it.
- World coordinates, networking, combat, spawning, minimap projection, and room behavior remain unchanged.

## Visual Direction

- Zone 1: honey-gold stitched meadow, biscuit stones, warm flowers, friendly signs.
- Zone 2: mint marsh, glossy puddles, jelly reeds, stepping stones, soda-water bubbles.
- Zone 3: cocoa woodland, wafer paths, candy roots, ember peppers, dark shrubs, purple crystals.
- River: modular blueberry soda water with toy-like foam, banks, bends, crossings, and a bridge.

## Rendering Layers

Ground base -> ground variations -> transitions -> river -> paths/decals -> props below -> actors -> props above/landmarks -> effects -> optional debug collision.

## Verification

Pure tests cover scale composition, registry uniqueness, deterministic placement, collision-safe props, and fallback descriptors. Typecheck, lint, focused/full tests, production build, and bounded desktop/mobile browser checks are required before completion claims.

