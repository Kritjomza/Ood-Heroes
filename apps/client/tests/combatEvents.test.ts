import { describe, expect, it } from 'vitest';
import { CombatEventDeduplicator } from '../src/game/multiplayer/combatEvents';

describe('combat event deduplication', () => {
  it('accepts each event ID once and stays bounded at 256 entries', () => {
    const dedupe = new CombatEventDeduplicator();
    expect(dedupe.accept('evt-1')).toBe(true);
    expect(dedupe.accept('evt-1')).toBe(false);
    for (let index = 2; index <= 300; index++) dedupe.accept(`evt-${index}`);
    expect(dedupe.size).toBe(256);
    dedupe.clear();
    expect(dedupe.size).toBe(0);
  });
});
