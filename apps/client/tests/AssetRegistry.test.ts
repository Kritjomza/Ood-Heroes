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
      PHASE_4_ASSETS.every((entry) => entry.replacementPath.startsWith('/assets/final/')),
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
});
