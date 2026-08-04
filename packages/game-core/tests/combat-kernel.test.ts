import { describe, expect, it } from 'vitest';
import {
  COMBAT_KERNEL_VERSION,
  stepCombatKernel,
  type CombatKernelInput,
} from '../src/kernel/combat-kernel';

const fixture = (): CombatKernelInput => ({
  tick: 12,
  seed: 12345,
  heroes: [
    {
      id: 'hero-b',
      currentHp: 80,
      maxHp: 80,
      attack: 20,
      defense: 4,
      cooldownReadyTick: 12,
    },
    {
      id: 'hero-a',
      currentHp: 100,
      maxHp: 100,
      attack: 10,
      defense: 8,
      cooldownReadyTick: 12,
    },
  ],
  monsters: [
    {
      id: 'monster-a',
      currentHp: 50,
      maxHp: 50,
      attack: 6,
      defense: 10,
      cooldownReadyTick: 12,
    },
  ],
  intents: [
    { sourceId: 'hero-b', targetId: 'monster-a', kind: 'basic-attack' },
    { sourceId: 'hero-a', targetId: 'monster-a', kind: 'basic-attack' },
  ],
});

describe('deterministic combat kernel', () => {
  it('replays identical frozen inputs without mutating them and orders simultaneous events', () => {
    const firstInput = fixture();
    const secondInput = fixture();
    const original = structuredClone(firstInput);
    Object.freeze(firstInput);
    Object.freeze(firstInput.heroes);
    Object.freeze(firstInput.monsters);
    Object.freeze(firstInput.intents);

    const first = stepCombatKernel(firstInput);
    const second = stepCombatKernel(secondInput);

    expect(COMBAT_KERNEL_VERSION).toBe(1);
    expect(first).toEqual(second);
    expect(firstInput).toEqual(original);
    expect(first.events.map((event) => event.id)).toEqual([
      '12:hero-a:monster-a:basic-attack',
      '12:hero-b:monster-a:basic-attack',
    ]);
  });

  it('uses the authoritative damage formula and preserves input cooldown state', () => {
    const input = fixture();
    const result = stepCombatKernel(input);

    expect(result.events.map((event) => event.damage)).toEqual([4, 13]);
    expect(result.monsters[0]?.currentHp).toBe(33);
    expect(result.heroes).toEqual(input.heroes);
    expect(result.heroes).not.toBe(input.heroes);
    expect(result.monsters).not.toBe(input.monsters);
  });
});
