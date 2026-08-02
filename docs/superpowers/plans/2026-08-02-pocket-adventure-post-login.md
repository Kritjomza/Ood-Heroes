# Pocket Adventure Post-Login UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the authenticated Odd Tower UI with a mobile-first Pocket Adventure Board that integrates loading, persistent navigation, RPG summaries, collection, summon, team, account, AFK rewards, and save feedback.

**Architecture:** Keep `PersistentShell` as the authoritative screen and mutation coordinator. Add pure derived RPG selectors and small shared presentation components, then migrate each existing screen to those interfaces without changing server contracts. CSS remains in the existing global stylesheet and persistent token file, organized under one Hallmark-stamped post-login system.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest, Testing Library, CSS custom properties, existing `@odd-tower/game-core` and `@odd-tower/network-protocol` packages.

## Global Constraints

- Mobile portrait is primary; verify 320, 375, 414, and 768 CSS-pixel widths before desktop at 1280×800 and 1440×900.
- Preserve authentication behavior, API endpoints, mutation authority, persistence semantics, and existing React screen ownership.
- Use only existing `PlayerBootstrap` data for derived information; never persist derived values.
- Use solid system color fields, molded highlights, and directional shadows; do not add decorative or haphazard gradients.
- Use authored SVG icons and registered hero art; do not use emoji as UI icons or artwork.
- Touch targets are at least 48 CSS pixels, labels remain one line, and focus states appear instantly.
- All authored motion honors `prefers-reduced-motion` and avoids animating layout properties.
- Run Hallmark's slop test and Impeccable's single bounded desktop/mobile inspection before completion.

---

## File Structure

### Create

- `apps/client/src/ui/persistent/derived-player-view.ts` — pure RPG summary selectors.
- `apps/client/src/ui/persistent/AdventureIcons.tsx` — one authored SVG icon set.
- `apps/client/src/ui/persistent/AdventureNav.tsx` — mobile bottom tabs and desktop rail.
- `apps/client/src/ui/persistent/PlayerStrip.tsx` — player identity, currency, and save summary.
- `apps/client/src/ui/persistent/TowerLoader.tsx` — phase-aware loading and recovery scene.
- `apps/client/src/ui/persistent/HeroSticker.tsx` — reusable owned/locked hero presentation.
- `apps/client/tests/derivedPlayerView.test.ts` — selector tests.
- `apps/client/tests/PersistentShellUi.test.tsx` — shell, navigation, and loading tests.
- `apps/client/tests/PostLoginScreens.test.tsx` — integrated screen-state tests.

### Modify

- `apps/client/src/ui/persistent/PersistentShell.tsx` — shared shell, navigation, loading phases, global feedback.
- `apps/client/src/ui/persistent/HomeScreen.tsx` — expedition dashboard.
- `apps/client/src/ui/persistent/CollectionScreen.tsx` — sticker album and filters.
- `apps/client/src/ui/persistent/HeroDetailScreen.tsx` — progression-first detail.
- `apps/client/src/ui/persistent/SummonScreen.tsx` — server-gated reveal sequence.
- `apps/client/src/ui/persistent/TeamBuilderScreen.tsx` — formation board and team summaries.
- `apps/client/src/ui/persistent/AccountScreen.tsx` — player passport.
- `apps/client/src/ui/persistent/AfkRewardModal.tsx` — peel-open reward parcel.
- `apps/client/src/ui/persistent/PersistenceStatus.tsx` — text-complete save states.
- `apps/client/src/ui/persistent/OAuthCallbackScreen.tsx` — reuse the new loader.
- `apps/client/src/ui/persistent/HeroMock.tsx` — render registered image sources when available.
- `apps/client/src/ui/persistent/tokens.css` — semantic surface, material, motion, spacing, and layer tokens.
- `apps/client/src/styles.css` — append the Pocket Adventure component and responsive rules.
- `apps/client/tests/PersistentUi.test.tsx` — update incumbent assertions after emoji removal.

---

### Task 1: Pure RPG-Derived Player Summaries

**Files:**
- Create: `apps/client/src/ui/persistent/derived-player-view.ts`
- Create: `apps/client/tests/derivedPlayerView.test.ts`

**Interfaces:**
- Consumes: `PlayerBootstrap`, `PlayerHero`, `PersistentHeroRole`, and `starUpgradeCost`.
- Produces: `derivePlayerView(player: PlayerBootstrap): DerivedPlayerView` and `deriveTeamView(player, selectedIds): DerivedTeamView`.

- [ ] **Step 1: Write the failing selector tests**

```ts
it('derives collection, summon, upgrade, and team summaries', () => {
  const view = derivePlayerView(player);
  expect(view.collection).toEqual({ owned: 1, total: 2, percent: 50, upgradeReady: 1 });
  expect(view.affordableSummons).toBe(3);
  expect(view.pityPercent).toBe(25);
  expect(view.team).toMatchObject({ occupied: 1, capacity: 2, averageLevel: 4, totalStars: 2 });
});

it('reports duplicated roles for a selected formation', () => {
  expect(deriveTeamView(player, ['hero-a', 'hero-b']).duplicateRoles).toEqual(['fighter']);
});
```

- [ ] **Step 2: Run tests and verify the missing-module failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/derivedPlayerView.test.ts`

Expected: FAIL because `derived-player-view.ts` does not exist.

- [ ] **Step 3: Implement the pure view types and selectors**

```ts
export type DerivedPlayerView = {
  collection: { owned: number; total: number; percent: number; upgradeReady: number };
  roleCounts: Partial<Record<PersistentHeroRole, number>>;
  affordableSummons: number;
  pityPercent: number;
  nextUpgradeHeroId: string | null;
  team: DerivedTeamView;
};

export function deriveTeamView(player: PlayerBootstrap, selectedIds: string[]): DerivedTeamView;
export function derivePlayerView(player: PlayerBootstrap): DerivedPlayerView;
```

Use guarded division for zero-cost/zero-threshold banners, round percentages to whole numbers, resolve definitions through maps, and use `starUpgradeCost(hero.stars)` for upgrade readiness.

- [ ] **Step 4: Run selector tests**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/derivedPlayerView.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the selector slice**

```powershell
git add apps/client/src/ui/persistent/derived-player-view.ts apps/client/tests/derivedPlayerView.test.ts
git commit -m "feat: derive persistent RPG summaries"
```

### Task 2: Shared Icons, Tokens, and Tower Loading States

**Files:**
- Create: `apps/client/src/ui/persistent/AdventureIcons.tsx`
- Create: `apps/client/src/ui/persistent/TowerLoader.tsx`
- Modify: `apps/client/src/ui/persistent/tokens.css`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PersistentShellUi.test.tsx`

**Interfaces:**
- Produces: `AdventureIcon({ name, decorative })` and `TowerLoader({ phase, error, onRetry })`.
- `phase` is `'auth' | 'bootstrap' | 'oauth' | 'mutation'`.

- [ ] **Step 1: Write failing loader tests**

```tsx
render(<TowerLoader phase="bootstrap" />);
expect(screen.getByRole('status')).toHaveTextContent('Gathering your heroes');

render(<TowerLoader phase="bootstrap" error="No connection" onRetry={retry} />);
expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
expect(screen.getByText('No connection')).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PersistentShellUi.test.tsx`

Expected: FAIL because the shared loader is missing.

- [ ] **Step 3: Implement the shared SVG icon and loader interfaces**

Provide icons for `home`, `heroes`, `summon`, `team`, `account`, `gold`, `gem`, `jelly`, `back`, `play`, `lock`, `star`, `shield`, and `save`. Each icon uses the same rounded stroke vocabulary and is either labelled by its parent or `aria-hidden`.

Map loader phases exactly:

```ts
const loadingCopy = {
  auth: 'Opening your tower…',
  bootstrap: 'Gathering your heroes…',
  oauth: 'Restoring your adventure…',
  mutation: 'Counting your treasure…',
} as const;
```

- [ ] **Step 4: Add semantic design tokens and loader CSS**

Add named tokens for the five system colors, plastic highlights, matte surfaces, shadow levels, spacing, radii, durations, easing, and z-layers. Add one Hallmark system stamp before the new post-login rules. Implement tower assembly, flag motion, and window-light motion with a reduced-motion override that removes translation and assembly.

- [ ] **Step 5: Run loader tests and CSS formatting**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PersistentShellUi.test.tsx`

Run: `npx prettier --check apps/client/src/ui/persistent/AdventureIcons.tsx apps/client/src/ui/persistent/TowerLoader.tsx apps/client/src/ui/persistent/tokens.css apps/client/src/styles.css`

Expected: PASS.

- [ ] **Step 6: Commit the loading foundation**

```powershell
git add apps/client/src/ui/persistent/AdventureIcons.tsx apps/client/src/ui/persistent/TowerLoader.tsx apps/client/src/ui/persistent/tokens.css apps/client/src/styles.css apps/client/tests/PersistentShellUi.test.tsx
git commit -m "feat: add pocket adventure loading system"
```

### Task 3: Persistent Mobile Tabs, Desktop Rail, and Player Strip

**Files:**
- Create: `apps/client/src/ui/persistent/AdventureNav.tsx`
- Create: `apps/client/src/ui/persistent/PlayerStrip.tsx`
- Modify: `apps/client/src/ui/persistent/PersistentShell.tsx`
- Modify: `apps/client/src/ui/persistent/PersistenceStatus.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PersistentShellUi.test.tsx`

**Interfaces:**
- Export `type PersistentScreen = 'home' | 'collection' | 'hero' | 'summon' | 'team' | 'account'` from `PersistentShell.tsx` or a sibling type file.
- `AdventureNav` consumes `active: PersistentScreen` and `onSelect(screen)`.
- `PlayerStrip` consumes `player: PlayerBootstrap` and renders `PersistenceStatus`.

- [ ] **Step 1: Add failing navigation tests**

```tsx
expect(screen.getByRole('navigation', { name: 'Adventure' })).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Heroes' })).toHaveAttribute('aria-current', 'page');
await user.click(screen.getByRole('button', { name: 'Team' }));
expect(onSelect).toHaveBeenCalledWith('team');
```

- [ ] **Step 2: Verify test failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PersistentShellUi.test.tsx`

Expected: FAIL because navigation and player strip are absent.

- [ ] **Step 3: Implement navigation and shell ownership**

Render one stable shell after bootstrap:

```tsx
<div className={`adventure-shell system-${screen === 'hero' ? 'collection' : screen}`}>
  <PlayerStrip player={player} />
  <div className="adventure-screen" key={screen}>{screenContent}</div>
  <AdventureNav active={screen === 'hero' ? 'collection' : screen} onSelect={setScreen} />
</div>
```

Replace auth/bootstrap text loaders with `TowerLoader`. Keep mutation state localized and keep global errors in a fixed live region.

- [ ] **Step 4: Implement bottom-tab and desktop-rail CSS**

Use a fixed safe-area bottom rail below 768 px and a left rail at desktop widths. Reserve content padding so neither rail covers controls. Active state must combine position, shape, text, and color. Add `overflow-x: clip` without breaking game-canvas screens.

- [ ] **Step 5: Run shell tests and build**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PersistentShellUi.test.tsx apps/client/tests/PersistentUi.test.tsx`

Run: `npm run build:client`

Expected: PASS.

- [ ] **Step 6: Commit the navigation shell**

```powershell
git add apps/client/src/ui/persistent/AdventureNav.tsx apps/client/src/ui/persistent/PlayerStrip.tsx apps/client/src/ui/persistent/PersistentShell.tsx apps/client/src/ui/persistent/PersistenceStatus.tsx apps/client/src/styles.css apps/client/tests/PersistentShellUi.test.tsx
git commit -m "feat: add persistent adventure navigation"
```

### Task 4: Expedition Home Dashboard

**Files:**
- Modify: `apps/client/src/ui/persistent/HomeScreen.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`
- Test: `apps/client/tests/PersistentUi.test.tsx`

**Interfaces:**
- Consumes `derivePlayerView(player)` and existing `onPlayLocal`, `onPlayOnline`, and `navigate` callbacks.

- [ ] **Step 1: Write failing Home assertions**

```tsx
expect(screen.getByRole('heading', { name: 'Your expedition' })).toBeInTheDocument();
expect(screen.getByText('1 of 2 heroes')).toBeInTheDocument();
expect(screen.getByText('3 summons ready')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Enter Floor 1 online' })).toBeInTheDocument();
```

- [ ] **Step 2: Run and confirm failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/PersistentUi.test.tsx`

- [ ] **Step 3: Rebuild Home as an asymmetric expedition dashboard**

Lead with active team stickers and two distinct play controls. Add compact, non-card-in-card modules for AFK rewards, collection progress, pity/affordable pulls, and the next upgrade-ready hero. Remove duplicate navigation feature cards because persistent tabs now own routing.

- [ ] **Step 4: Add Home responsive rules and states**

Ensure zero-hero, empty-team, no-AFK, zero-gem, and no-upgrade-ready states have truthful copy and working actions.

- [ ] **Step 5: Run Home tests and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/PersistentUi.test.tsx`

```powershell
git add apps/client/src/ui/persistent/HomeScreen.tsx apps/client/src/styles.css apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/PersistentUi.test.tsx
git commit -m "feat: redesign expedition home dashboard"
```

### Task 5: Sticker Album Collection and Hero Progression

**Files:**
- Create: `apps/client/src/ui/persistent/HeroSticker.tsx`
- Modify: `apps/client/src/ui/persistent/HeroMock.tsx`
- Modify: `apps/client/src/ui/persistent/CollectionScreen.tsx`
- Modify: `apps/client/src/ui/persistent/HeroDetailScreen.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`

**Interfaces:**
- `HeroSticker` consumes `definition`, optional `hero`, `activeSlot`, `selected`, `onSelect`, and `size`.
- Collection owns local filters: ownership, rarity, role, team status, upgrade readiness, and level ordering.

- [ ] **Step 1: Write failing collection and detail tests**

```tsx
expect(screen.getByText('50% collected')).toBeInTheDocument();
expect(screen.getByRole('button', { name: /fighter filter/i })).toBeInTheDocument();
expect(screen.getByRole('button', { name: /Grilled Chicken Executioner, owned, level 4/i })).toBeInTheDocument();
expect(screen.getByText('2 / 5 shards')).toBeInTheDocument();
expect(screen.getByText('Active slot 1')).toBeInTheDocument();
```

- [ ] **Step 2: Run and confirm failures**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx`

- [ ] **Step 3: Implement `HeroSticker` and real asset rendering**

Update `HeroMock` to render an `<img>` when `resolveAsset(assetId).replacementPath` is non-empty and retain the labelled fallback otherwise. Keep rarity and ownership in accessible text, not only CSS classes.

- [ ] **Step 4: Implement collection summaries and filtering**

Use maps and memoized derived arrays. Preserve all hero definitions so locked heroes remain visible. Filters must be real buttons with pressed state and deterministic sorting.

- [ ] **Step 5: Implement progression-first Hero Detail**

Display level, total experience, stars, shards against `starUpgradeCost`, active-team slot, maximum-star state, affordability, and localized busy copy. Remove the invented `22,864` experience denominator because the protocol does not supply a level threshold.

- [ ] **Step 6: Run tests/build and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/PersistentUi.test.tsx`

Run: `npm run build:client`

```powershell
git add apps/client/src/ui/persistent/HeroSticker.tsx apps/client/src/ui/persistent/HeroMock.tsx apps/client/src/ui/persistent/CollectionScreen.tsx apps/client/src/ui/persistent/HeroDetailScreen.tsx apps/client/src/styles.css apps/client/tests/PostLoginScreens.test.tsx
git commit -m "feat: build hero sticker album UI"
```

### Task 6: Server-Gated Capsule Summon Sequence

**Files:**
- Modify: `apps/client/src/ui/persistent/SummonScreen.tsx`
- Modify: `apps/client/src/ui/persistent/PersistentShell.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`

**Interfaces:**
- Change the screen callback to `summon: () => Promise<SummonUiResult | null>`.
- Define `type SummonUiResult = { outcomeType: 'new' | 'duplicate'; message: string }` in `SummonScreen.tsx`.
- `PersistentShell` maps the existing mutation response only after a successful server result.

- [ ] **Step 1: Write failing summon-state tests**

```tsx
expect(screen.getByText('3 pulls available')).toBeInTheDocument();
expect(screen.getByRole('progressbar', { name: 'Epic guarantee progress' })).toHaveAttribute('aria-valuenow', '5');
await user.click(screen.getByRole('button', { name: 'Summon for 100 gems' }));
expect(await screen.findByRole('status')).toHaveTextContent('Duplicate');
expect(screen.getByRole('button', { name: 'Skip reveal' })).toBeInTheDocument();
```

- [ ] **Step 2: Verify failure before implementation**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx`

- [ ] **Step 3: Implement a server-gated reveal state machine**

```ts
type RevealPhase = 'idle' | 'requesting' | 'charge' | 'reveal' | 'arrived';
```

Remain in `requesting` until the mutation resolves. Begin the visual reveal only with a non-null authoritative result. Use timers that are cleared on unmount, permit Skip after `charge`, and move immediately to `arrived` under reduced motion.

- [ ] **Step 4: Implement the solid-color capsule stage**

Show banner name, cost, current gems, affordable pulls, pity fraction, and threshold. Use authored SVG geometry for the machine and capsule; do not introduce gradients or unsourced odds.

- [ ] **Step 5: Run tests/build and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx`

Run: `npm run build:client`

```powershell
git add apps/client/src/ui/persistent/SummonScreen.tsx apps/client/src/ui/persistent/PersistentShell.tsx apps/client/src/styles.css apps/client/tests/PostLoginScreens.test.tsx
git commit -m "feat: add capsule summon reveal sequence"
```

### Task 7: Formation Board and Team Validation

**Files:**
- Modify: `apps/client/src/ui/persistent/TeamBuilderScreen.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`

**Interfaces:**
- Consumes `deriveTeamView(player, selected)`.
- Preserves `save(ids)`, `unlock()`, and `busy` callbacks.

- [ ] **Step 1: Write failing formation tests**

```tsx
expect(screen.getByText('Average level 4')).toBeInTheDocument();
expect(screen.getByText('2 total stars')).toBeInTheDocument();
expect(screen.getByText('Two fighters')).toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Save formation' })).toBeDisabled();
```

Add interaction tests for selecting, removing, slot capacity, locked slots, unaffordable unlock, unchanged formation, and save enablement.

- [ ] **Step 2: Run and verify failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx`

- [ ] **Step 3: Implement stable formation state**

Normalize initial IDs by slot order. Compare `selected` to the normalized initial list for dirty state. Reject duplicate IDs and selections beyond `player.profile.teamSlots`. Render role composition and duplicate-role warnings as informational text.

- [ ] **Step 4: Implement board and roster styling**

Use three ordered formation slots and a flowing roster. Sticker settling uses transform only and has a reduced-motion override. Lock requirements must display both hero-count and 500-gold requirements already enforced by the current UI.

- [ ] **Step 5: Run tests and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx`

```powershell
git add apps/client/src/ui/persistent/TeamBuilderScreen.tsx apps/client/src/styles.css apps/client/tests/PostLoginScreens.test.tsx
git commit -m "feat: redesign team formation board"
```

### Task 8: Player Passport, AFK Parcel, OAuth, and Save Feedback

**Files:**
- Modify: `apps/client/src/ui/persistent/AccountScreen.tsx`
- Modify: `apps/client/src/ui/persistent/AfkRewardModal.tsx`
- Modify: `apps/client/src/ui/persistent/OAuthCallbackScreen.tsx`
- Modify: `apps/client/src/ui/persistent/PersistenceStatus.tsx`
- Modify: `apps/client/src/styles.css`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`
- Test: `apps/client/tests/oauth.test.ts`

**Interfaces:**
- Account continues to consume `player`, `back`, and `onProtected`.
- OAuth callback reuses `TowerLoader phase="oauth"` without changing callback validation.

- [ ] **Step 1: Write failing account, reward, and persistence tests**

```tsx
expect(screen.getByText('Guest adventurer')).toBeInTheDocument();
expect(screen.getByText('Save paused · 2 changes waiting')).toBeInTheDocument();
expect(screen.getByRole('dialog', { name: 'While you were away' })).toHaveTextContent('500 Gold');
expect(screen.getByRole('button', { name: 'Collect rewards' })).toBeInTheDocument();
```

- [ ] **Step 2: Run and verify failure**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/oauth.test.ts`

- [ ] **Step 3: Implement the player passport**

Present display name, guest/permanent state, Google identity, provider email when available, protection action, and sign out. Keep the existing email-protection behavior because it is already implemented, but place it in a secondary disclosure so Google remains the primary protection path. Put user ID and contract/schema versions in a `<details>` section.

- [ ] **Step 4: Implement the AFK parcel and save wording**

Replace emoji reward glyphs with `AdventureIcon`. Itemize exact gold, jelly, per-active-hero experience, and interval count. Use `queueDepth` in degraded/unavailable save copy and expose `role="status"`.

- [ ] **Step 5: Reuse the loader in OAuth callback without changing flow logic**

Map OAuth states to the existing validated messages and preserve callback cleanup, identity checks, refresh, and error routing.

- [ ] **Step 6: Run tests/build and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/oauth.test.ts`

Run: `npm run build:client`

```powershell
git add apps/client/src/ui/persistent/AccountScreen.tsx apps/client/src/ui/persistent/AfkRewardModal.tsx apps/client/src/ui/persistent/OAuthCallbackScreen.tsx apps/client/src/ui/persistent/PersistenceStatus.tsx apps/client/src/styles.css apps/client/tests/PostLoginScreens.test.tsx apps/client/tests/oauth.test.ts
git commit -m "feat: integrate account and reward surfaces"
```

### Task 9: Responsive, Accessibility, Hallmark, and Visual Verification

**Files:**
- Modify as findings require: `apps/client/src/styles.css`
- Modify as findings require: `apps/client/src/ui/persistent/*.tsx`
- Test: `apps/client/tests/PersistentShellUi.test.tsx`
- Test: `apps/client/tests/PostLoginScreens.test.tsx`
- Test: `tests/e2e/persistence.spec.ts`

**Interfaces:**
- No new production interfaces; this task verifies the integrated system.

- [ ] **Step 1: Add the missing integrated accessibility assertions**

Assert one current-page tab, ordered headings, labelled progress elements, labelled hero ownership, keyboard-reachable navigation, single live global error region, and non-color save/rarity text.

- [ ] **Step 2: Run all client unit tests**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests`

Expected: PASS with zero failing tests.

- [ ] **Step 3: Build the production client**

Run: `npm run build:client`

Expected: PASS with no TypeScript or bundling error.

- [ ] **Step 4: Run the persistence E2E flow when local Supabase is available**

Run: `npm run test:e2e -- tests/e2e/persistence.spec.ts --project=chromium`

Expected: PASS. If local Supabase is unavailable, record that environmental blocker exactly and do not claim E2E coverage.

- [ ] **Step 5: Perform one bounded visual inspection round**

Capture Home, Heroes, Summon, Team, and Account at 375×812 and 1280×800. In the same pass check 320, 414, and 768 widths for horizontal overflow, covered controls, wrapped tab labels, safe-area padding, long hero names, empty states, and focus visibility.

- [ ] **Step 6: Fix all findings in one consolidated patch and confirm once**

Repeat screenshots only for changed breakpoints and stop after the confirmation round. Run Hallmark's 58-gate slop test, confirm the pre-emit critique stamp, and verify no new inline color/font values escaped the token file.

- [ ] **Step 7: Run final verification and commit**

Run: `node node_modules/vitest/vitest.mjs run apps/client/tests && npm run build:client && git diff --check`

```powershell
git add apps/client/src/styles.css apps/client/src/ui/persistent apps/client/tests tests/e2e/persistence.spec.ts
git commit -m "test: verify pocket adventure post-login UI"
```
