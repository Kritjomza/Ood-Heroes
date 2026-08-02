# Hero Definition Directional Runtime Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry persistent `definitionId` through multiplayer combat and render six heroes from four-frame directional atlases while reducing the active manifest to 75 IDs.

**Architecture:** The server copies validated persistent identity into simulation and Colyseus state; the client preserves it through snapshots and selects textures from an explicit identity map. Static directional frames provide pose while Phaser tweens provide motion, and generated shapes remain a safe identity-preserving fallback.

**Tech Stack:** TypeScript 5.9, Colyseus 0.17/schema 4, Phaser 3.90, Vitest 3, Vite 8, npm workspaces.

## Global Constraints

- Do not use Git or perform Git operations.
- Do not generate images or move production assets.
- `role` is combat behavior; `definitionId` is persistent visual identity; never derive either from the other.
- Approved atlas IDs are the six `hero.<slug>.sprite_directional` IDs from the specification.
- Atlas contract: WebP, transparent, 384 × 96, four 96 × 96 horizontal frames ordered down/up/left/right, anchor `0.5, 0.82`.
- Remove exactly 54 obsolete hero idle/walk/attack IDs from active requirements.
- Final manifest totals must be wired/P0/P1/P2 `75/39/17/19`.
- Missing, unknown, absent, or invalid sprite data must use generated fallback without changing `definitionId`.
- No client artwork selection may depend solely on combat role.

## File Responsibility Map

- `packages/network-protocol/src/types.ts`: canonical network combat shape.
- `apps/game-server/src/simulation/CombatSimulation.ts`: authoritative combat identity retention and snapshot output.
- `apps/game-server/src/schema/RoomState.ts`: Colyseus schema field.
- `apps/game-server/src/rooms/FloorOneRoom.ts`: persistent bootstrap and schema projection.
- `apps/client/src/game/multiplayer/MultiplayerClient.ts`: schema-to-client normalization, including legacy absence.
- `apps/client/src/game/multiplayer/MultiplayerBridge.ts`: UI state equality and identity propagation.
- `apps/client/src/game/scenes/heroDirectionalSprites.ts`: new pure identity/texture/frame mapping.
- `apps/client/src/game/scenes/MultiplayerScene.ts`: hero views, sprite fallback, resync, and tweens.
- `apps/client/src/assets/manifests/phase-4-assets.ts`: six new directional manifest definitions and removal of old definitions.
- `tools/generate-phase4-asset-manifest.ts`: exact directional technical contract.
- `tools/validate-phase4-assets.ts`: exact count/obsolete-ID/frame validation.
- `docs/assets/*`: regenerated manifest outputs, report, and replacement guide.

---

### Task 1: Network Identity Contract

**Files:**
- Modify: `packages/network-protocol/src/types.ts`
- Modify: `packages/network-protocol/tests/validation.test.ts`

**Interfaces:**
- Produces: `NetworkHeroCombatState.definitionId: string`.
- Consumes: none.

- [ ] **Step 1: Add a failing compile/runtime fixture assertion**

Create a combat-state fixture in `validation.test.ts` containing `definitionId: 'hero_001_grilled_chicken'`, assert it remains present after the existing validation/fixture path, and add a type assertion that omission is invalid for current snapshots.

```ts
expect(hero.definitionId).toBe('hero_001_grilled_chicken');
// @ts-expect-error current combat snapshots require persistent visual identity
const invalid: NetworkHeroCombatState = { id: 'hero-1', role: 'fighter' };
```

- [ ] **Step 2: Run the targeted test/typecheck and verify failure**

Run: `npx vitest run packages/network-protocol/tests/validation.test.ts && npx tsc -p packages/network-protocol/tsconfig.json --noEmit`

Expected: fixture/type access fails because `definitionId` is not declared.

- [ ] **Step 3: Add the protocol field**

```ts
export type NetworkHeroCombatState = {
  id: string;
  definitionId: string;
  role: CombatHeroRole;
  // retain existing fields unchanged
};
```

- [ ] **Step 4: Re-run targeted test/typecheck**

Expected: PASS with no type errors.

- [ ] **Step 5: Record a no-Git checkpoint**

List modified files and test output in the execution log; do not stage or commit.

### Task 2: Simulation Identity Retention

**Files:**
- Modify: `apps/game-server/src/simulation/CombatSimulation.ts`
- Modify: `apps/game-server/tests/combatSimulation.test.ts`

**Interfaces:**
- Consumes: `NetworkHeroCombatState.definitionId: string`.
- Produces: `CombatHeroInput.definitionId: string`; simulation hero snapshots carrying the same value.

- [ ] **Step 1: Write failing simulation tests**

Construct two inputs with the same role but different definition IDs and assert snapshots preserve both across initialization, defeat/respawn APIs already used by the suite, and subsequent ticks.

```ts
expect(snapshot.heroes.map((hero) => hero.definitionId)).toEqual([
  'hero_001_grilled_chicken',
  'hero_002_pink_chocolate_lizard',
]);
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run apps/game-server/tests/combatSimulation.test.ts`

Expected: FAIL because simulation inputs/snapshots omit `definitionId`.

- [ ] **Step 3: Implement minimal retention**

Add `definitionId: string` to `CombatHeroInput` and the internal `Hero` type/creation object, then include `definitionId: hero.definitionId` in `getSnapshot()` mapping. Never recompute it during respawn/reset.

- [ ] **Step 4: Run simulation tests**

Expected: PASS, including distinct identities with equal roles.

- [ ] **Step 5: Record a no-Git checkpoint**

Record files/results; perform no Git action.

### Task 3: Colyseus Schema and Room Projection

**Files:**
- Modify: `apps/game-server/src/schema/RoomState.ts`
- Modify: `apps/game-server/src/rooms/FloorOneRoom.ts`
- Modify: `apps/game-server/tests/schemaProjection.test.ts`
- Modify: `apps/game-server/tests/combatRoom.test.ts`

**Interfaces:**
- Consumes: validated persistent `hero.definitionId`; simulation snapshot `definitionId`.
- Produces: `HeroCombatSchema.definitionId: string` in initial and patched room state.

- [ ] **Step 1: Write failing projection and room tests**

Assert the selected persistent definitions appear in `state.combatByPlayer.get(playerId).heroes`, including after leave/reconnect test flow and respawn/resync projection.

```ts
expect([...combat.heroes].map((hero) => hero.definitionId)).toEqual(selectedDefinitionIds);
```

- [ ] **Step 2: Run the targeted tests**

Run: `npx vitest run apps/game-server/tests/schemaProjection.test.ts apps/game-server/tests/combatRoom.test.ts`

Expected: FAIL because schema and bootstrap inputs omit the field.

- [ ] **Step 3: Add schema and authoritative copies**

```ts
export class HeroCombatSchema extends Schema {
  declare definitionId: string;
  // existing fields
  constructor() {
    super();
    this.definitionId = '';
    // retain existing initialization
  }
}
defineTypes(HeroCombatSchema, {
  id: 'string',
  definitionId: 'string',
  // retain every existing field registration
});
```

Set `definitionId: definition.id` when building `CombatHeroInput`. In `projectCombat()`, set `heroSchema.definitionId = hero.definitionId` both when creating and refreshing entries.

- [ ] **Step 4: Run room/projection tests**

Expected: PASS for all six definitions and reconnect/respawn cases.

- [ ] **Step 5: Run server typecheck and checkpoint**

Run: `npx tsc -p apps/game-server/tsconfig.json --noEmit`

Expected: PASS. Record results without Git.

### Task 4: Client State and Legacy Compatibility

**Files:**
- Modify: `apps/client/src/game/multiplayer/MultiplayerClient.ts`
- Modify: `apps/client/src/game/multiplayer/MultiplayerBridge.ts`
- Modify: `apps/client/tests/MultiplayerClient.test.ts`
- Modify: `apps/client/tests/MultiplayerBridge.test.ts`

**Interfaces:**
- Consumes: schema hero `definitionId?: unknown` for compatibility.
- Produces: normalized `definitionId: string`; UI equality includes identity.

- [ ] **Step 1: Write failing current/legacy snapshot tests**

Assert valid IDs survive normalization and bridge updates; absent, non-string, and unknown strings respectively normalize to `''`, `''`, and the unchanged unknown string.

```ts
expect(current.heroes[0].definitionId).toBe('hero_006_samurai_bread');
expect(legacy.heroes[0].definitionId).toBe('');
expect(unknown.heroes[0].definitionId).toBe('hero_unknown_future');
```

Also assert changing only `definitionId` triggers a bridge state update.

- [ ] **Step 2: Run client multiplayer tests and verify failure**

Run: `npx vitest run apps/client/tests/MultiplayerClient.test.ts apps/client/tests/MultiplayerBridge.test.ts`

Expected: FAIL because identity is not mapped/compared.

- [ ] **Step 3: Implement normalization and equality**

```ts
definitionId: typeof hero.definitionId === 'string' ? hero.definitionId : '',
```

Add `definitionId` to `CombatHeroUiState` if it is a separate type and compare it in hero equality without deriving from role.

- [ ] **Step 4: Re-run targeted tests and client typecheck**

Run: `npx vitest run apps/client/tests/MultiplayerClient.test.ts apps/client/tests/MultiplayerBridge.test.ts && npx tsc -p apps/client/tsconfig.json --noEmit`

Expected: PASS.

- [ ] **Step 5: Record a no-Git checkpoint**

Record compatibility behavior and results.

### Task 5: Pure Directional Sprite Mapping

**Files:**
- Create: `apps/client/src/game/scenes/heroDirectionalSprites.ts`
- Create: `apps/client/tests/heroDirectionalSprites.test.ts`

**Interfaces:**
- Produces: `HERO_DIRECTIONAL_ASSET_IDS`, `heroTextureKey(definitionId: string): string | null`, `directionalFrame(direction: Direction): 0 | 1 | 2 | 3`.
- Consumes: existing scene `Direction` type; if private, export a shared equivalent from this module.

- [ ] **Step 1: Write failing pure mapping tests**

Test all six definition IDs, all four directions, empty/unknown IDs, and that no lookup argument or key uses role.

```ts
expect(directionalFrame('down')).toBe(0);
expect(directionalFrame('up')).toBe(1);
expect(heroTextureKey('hero_001_grilled_chicken')).toBe('hero.grilled_chicken.sprite_directional');
expect(heroTextureKey('fighter')).toBeNull();
```

- [ ] **Step 2: Run and verify module-not-found failure**

Run: `npx vitest run apps/client/tests/heroDirectionalSprites.test.ts`

- [ ] **Step 3: Implement explicit immutable maps**

Define all six identity-to-asset entries and a switch/map for frame numbers. Unknown values return `null`.

- [ ] **Step 4: Re-run tests**

Expected: PASS for 6 identities and 4 directions.

- [ ] **Step 5: Record a no-Git checkpoint**

Record results only.

### Task 6: Phaser Hero Views, Fallback, Resync, and Tweens

**Files:**
- Modify: `apps/client/src/game/scenes/MultiplayerScene.ts`
- Create: `apps/client/tests/MultiplayerSceneHeroRendering.test.ts`

**Interfaces:**
- Consumes: `heroTextureKey`, `directionalFrame`, client hero `id`, `definitionId`, `status`, position/event data.
- Produces: hero views keyed by combat hero ID and identity-safe generated fallback behavior.

- [ ] **Step 1: Extract/test scene decision helpers**

Using mocked Phaser texture/sprite/tween APIs, assert known identity selects its atlas/frame, unknown identity creates neutral fallback, and fallback retains the original identity in the view model.

- [ ] **Step 2: Add failing resync and motion tests**

Assert resync removes orphaned views, creates missing views, changes textures when authoritative identity changes, and never selects by role. Assert attack/hit/defeat dispatch finite relative tweens and movement uses bob/tilt on the current frame.

- [ ] **Step 3: Run and verify failures**

Run: `npx vitest run apps/client/tests/MultiplayerSceneHeroRendering.test.ts`

- [ ] **Step 4: Replace role-owned circles with hero-ID views**

Use `Map<string, HeroView>`, preload/resolve all six atlases, apply frame `directionalFrame(currentDirection)`, and create a neutral chocolate-outline generated texture when `heroTextureKey()` is null or the texture is unavailable/invalid. Do not rewrite `view.definitionId`.

- [ ] **Step 5: Implement relative tween model**

Store `baseX/baseY/baseScaleX/baseScaleY`; cancel incompatible tweens before movement bob, attack lunge/recoil, hit flash/shake, or defeat squash/rotation/fade. Apply separate existing VFX overlays. Restore base transform on completion/resync.

- [ ] **Step 6: Re-run renderer and existing combat-event tests**

Run: `npx vitest run apps/client/tests/MultiplayerSceneHeroRendering.test.ts apps/client/tests/combatEvents.test.ts`

Expected: PASS.

- [ ] **Step 7: Run client typecheck and checkpoint**

Run: `npx tsc -p apps/client/tsconfig.json --noEmit`

Expected: PASS. Record without Git.

### Task 7: Active Asset Manifest Source Migration

**Files:**
- Modify: `apps/client/src/assets/manifests/phase-4-assets.ts`
- Modify: `apps/client/tests/AssetRegistry.test.ts`
- Modify: `tools/generate-phase4-asset-manifest.ts`
- Modify: `tools/validate-phase4-assets.ts`

**Interfaces:**
- Produces: six directional entries with fixed contract; manifest validation totals `75/39/17/19`.
- Consumes: approved asset ID/path list.

- [ ] **Step 1: Write failing asset-registry assertions**

Assert all six directional IDs resolve, all 54 old patterns do not resolve, and registry count is 75.

- [ ] **Step 2: Add failing validator invariants**

Validator must reject any `sprite_idle_`, `sprite_walk_`, or `sprite_attack` hero ID; require six directional entries with width/height/frame/anchor/order; require priorities `39/17/19`; report `24 static hero sources`, `80 retained animated frames`, and `104 total sources`.

- [ ] **Step 3: Run tests/validator and confirm failure**

Run: `npx vitest run apps/client/tests/AssetRegistry.test.ts && npm run assets:validate`

- [ ] **Step 4: Replace manifest source definitions**

Generate one `sprite_directional` P1 entry per hero and remove the nine old entries per hero. Encode target path `/assets/final/hero/<slug>/sprite_directional.webp`, `384 × 96`, transparent, WebP, 4 frames, anchor `0.5/0.82`, directions `[down, up, left, right]`, atlas group `hero.<slug>`.

- [ ] **Step 5: Update generator/validator calculations**

Remove old hero frame-size branches and hard-coded 432. Calculate hero sources as `6 * 4`; animated frames from five monsters and five VFX, including `ui.summon.reveal_glow`.

- [ ] **Step 6: Re-run targeted tests/validator**

Expected: tests may pass while generated docs remain stale; validator must clearly identify only stale generated outputs before Task 8.

- [ ] **Step 7: Record a no-Git checkpoint**

Record exact removed/added IDs and calculated totals.

### Task 8: Regenerate Asset Contract Documents

**Files:**
- Modify (generated): `docs/assets/phase-4-asset-manifest.json`
- Modify (generated): `docs/assets/phase-4-asset-manifest.csv`
- Modify (generated as applicable): `docs/assets/phase-4-assets.json`
- Modify (generated as applicable): `docs/assets/phase-4-assets.csv`
- Modify: `docs/assets/phase-4-asset-report.md`
- Modify: `docs/assets/phase-4-replacement-guide.md`
- Modify: `docs/assets/README.md`

**Interfaces:**
- Consumes: Task 7 manifest source and generator.
- Produces: canonical 75-ID generated contract for prompt-workflow plan.

- [ ] **Step 1: Run generator**

Run: `npm run assets:manifest`

Expected: generated outputs contain 75 unique IDs.

- [ ] **Step 2: Inspect exact totals and obsolete absence**

Use a read-only PowerShell/Node query to assert counts `75/39/17/19`, six directional IDs, zero obsolete hero IDs, and exact atlas fields.

- [ ] **Step 3: Update human-readable reports**

Describe 24 static hero directional sources separately from 80 animated monster/VFX frames; remove all 432-frame and old-atlas requirements.

- [ ] **Step 4: Run asset validator**

Run: `npm run assets:validate`

Expected: PASS with exact totals.

- [ ] **Step 5: Record a no-Git checkpoint**

Record generated files and validator output.

### Task 9: Runtime Regression and Full Verification

**Files:**
- Modify only tests revealed incomplete by failures; do not broaden runtime scope.

**Interfaces:**
- Consumes: Tasks 1–8.
- Produces: verified runtime migration report inputs.

- [ ] **Step 1: Run targeted protocol/simulation/client suites**

Run: `npx vitest run packages/network-protocol apps/game-server/tests/combatSimulation.test.ts apps/game-server/tests/schemaProjection.test.ts apps/game-server/tests/combatRoom.test.ts apps/client/tests/MultiplayerClient.test.ts apps/client/tests/MultiplayerBridge.test.ts apps/client/tests/AssetRegistry.test.ts apps/client/tests/heroDirectionalSprites.test.ts apps/client/tests/MultiplayerSceneHeroRendering.test.ts`

- [ ] **Step 2: Run typecheck and builds**

Run: `npm run typecheck && npm run build`

- [ ] **Step 3: Run asset validation**

Run: `npm run assets:validate`

- [ ] **Step 4: Run complete unit suite**

Run: `npx vitest run`

- [ ] **Step 5: Run relevant E2E only if required services/browser are available**

Run: `npm run test:multiplayer` and `npm run test:combat`.

If unavailable, record the exact missing service/browser/dependency and do not claim the tests passed.

- [ ] **Step 6: Produce migration evidence**

Report removed/added IDs, exact totals, source/animated-frame counts, modified code/docs files, compatibility behavior, tests run/not run, validator results, and `Git operations performed: none`.
