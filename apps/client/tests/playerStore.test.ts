import { describe, expect, it, vi } from 'vitest';
import { PlayerStore } from '../src/persistence/player-store';

describe('PlayerStore', () => {
  it('prevents overlapping mutations and clears protected state on sign-out', () => {
    const store = new PlayerStore();
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.beginMutation('summon')).toBe(true);
    expect(store.beginMutation('summon-again')).toBe(false);
    store.endMutation();
    expect(store.beginMutation('team')).toBe(true);
    store.clear();
    expect(store.getSnapshot()).toEqual({
      bootstrap: null,
      loading: false,
      error: null,
      pendingMutation: null,
    });
    expect(listener).toHaveBeenCalled();
  });
});
