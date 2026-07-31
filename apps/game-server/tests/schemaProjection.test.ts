// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assignChanged, statusEffectSignature } from '../src/rooms/schemaProjection';

describe('change-aware schema projection', () => {
  it('does not invoke setters for unchanged primitive values', () => {
    let writes = 0;
    let stored = 4;
    const target = {
      get value() {
        return stored;
      },
      set value(next: number) {
        writes += 1;
        stored = next;
      },
    };
    expect(assignChanged(target, { value: 4 })).toBe(0);
    expect(writes).toBe(0);
    expect(assignChanged(target, { value: 5 })).toBe(1);
    expect(writes).toBe(1);
  });

  it('uses a stable status-effect signature so unchanged arrays are reusable', () => {
    const effects = [{ type: 'movement-slow', magnitude: 0.2, expirationTick: 40 }];
    expect(statusEffectSignature(effects)).toBe(statusEffectSignature([{ ...effects[0]! }]));
    expect(statusEffectSignature([])).not.toBe(statusEffectSignature(effects));
  });
});
