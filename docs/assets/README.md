# Phase 4 Mock Assets

All Phase 4 visuals are project-authored emoji/CSS/programmatic mocks resolved through stable Asset IDs. Runtime entries live in `apps/client/src/assets/manifests/phase-4-assets.ts`; matching JSON and CSV inventories live here.

To replace a mock, create the documented file at its `replacementPath`, update the renderer behind that Asset ID, and keep gameplay and screen code unchanged. Hero production exports retain transparent backgrounds, consistent optical scale, and the four lightweight states `idle_a`, `idle_b`, `move_left_a`, `move_left_b`. Monster gameplay exports are single left-facing static images mirrored by the runtime. Missing or invalid assets resolve to generated-shape fallbacks and never crash a screen.

Run `npm run assets:validate` after registry or manifest changes.

The canonical 123-entry deliverables are:

- `phase-4-asset-manifest.json`
- `phase-4-asset-manifest.csv`
- `phase-4-asset-manifest.schema.json`
- `phase-4-asset-report.md`
- `phase-4-replacement-guide.md`
- `mockup-screens/`

The older `phase-4-assets.json` and `phase-4-assets.csv` are retained as the initial
registry snapshot and are not the production handoff contract.
