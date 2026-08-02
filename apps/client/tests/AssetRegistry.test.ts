import { describe, expect, it } from 'vitest';
import { AssetRegistry } from '../src/assets/asset-registry';
import { PHASE_4_ASSETS } from '../src/assets/manifests/phase-4-assets';

describe('AssetRegistry', () => {
  it('contains six replaceable Hero IDs and a clean missing fallback', () => {
    const registry = new AssetRegistry();
    expect(
      registry.entries().filter((entry) => entry.kind === 'hero' && entry.id.endsWith('.portrait')),
    ).toHaveLength(6);
    expect(
      PHASE_4_ASSETS.every(
        (entry) =>
          entry.replacementPath.startsWith('/assets/final/') ||
          entry.replacementPath.startsWith('/assets/game/'),
      ),
    ).toBe(true);
    expect(registry.resolve('missing.asset')).toMatchObject({
      fallback: '?',
      label: 'Missing asset',
    });
  });

  it('rejects duplicate stable IDs', () => {
    expect(() => new AssetRegistry([PHASE_4_ASSETS[0]!, PHASE_4_ASSETS[0]!])).toThrow(
      'Duplicate Asset ID',
    );
  });

  it('uses the approved 75-ID contract with six single-image hero world visuals', () => {
    const ids = PHASE_4_ASSETS.map((asset) => asset.id);
    expect(ids).toHaveLength(75);
    expect(ids.filter((id) => id.endsWith('.world'))).toHaveLength(6);
    expect(ids.some((id) => /\.sprite_(idle_|walk_|attack$)/u.test(id))).toBe(false);
    expect(ids).toContain('hero.grilled_chicken.world');
    expect(ids).toContain('hero.samurai_bread.world');
  });
});
