import type { AssetEntry } from './asset-types';
import { PHASE_4_ASSETS } from './manifests/phase-4-assets';

export class AssetRegistry {
  readonly #entries = new Map<string, AssetEntry>();

  constructor(entries: AssetEntry[] = PHASE_4_ASSETS) {
    for (const entry of entries) {
      if (this.#entries.has(entry.id)) throw new Error(`Duplicate Asset ID: ${entry.id}`);
      this.#entries.set(entry.id, entry);
    }
  }

  resolve(id: string): AssetEntry {
    return (
      this.#entries.get(id) ?? {
        id,
        kind: 'ui',
        label: 'Missing asset',
        mock: 'glyph',
        replacementPath: '',
        fallback: '?',
      }
    );
  }

  entries() {
    return [...this.#entries.values()];
  }
}

export const assetRegistry = new AssetRegistry();
