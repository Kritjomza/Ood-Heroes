import { describe, expect, it, vi } from 'vitest';
import {
  MultiplayerBridge,
  initialMultiplayerState,
} from '../src/game/multiplayer/MultiplayerBridge';

describe('MultiplayerBridge', () => {
  it('publishes meaningful connection changes and unsubscribes cleanly', () => {
    const bridge = new MultiplayerBridge();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe(listener);
    bridge.update({ connection: 'connected', roomCode: 'ABC234', playerCount: 2 });
    expect(listener).toHaveBeenLastCalledWith({
      ...initialMultiplayerState,
      connection: 'connected',
      roomCode: 'ABC234',
      playerCount: 2,
    });
    expect(bridge.listenerCount).toBe(1);
    unsubscribe();
    expect(bridge.listenerCount).toBe(0);
  });

  it('resets transient room data after leave while preserving no stale errors', () => {
    const bridge = new MultiplayerBridge();
    bridge.update({ connection: 'failed', error: 'Room missing', latencyMs: 50 });
    bridge.reset();
    expect(bridge.state).toEqual(initialMultiplayerState);
  });

  it('publishes server-owned session combat state without per-frame mutation', () => {
    const bridge = new MultiplayerBridge();
    bridge.update({
      sessionGold: 12,
      autoHuntEnabled: true,
      autoHuntState: 'navigating',
      focusedMonsterName: 'Grumpy Radish',
      livingHeroes: 2,
      respawnSeconds: 4,
      heroes: [
        {
          id: 'p:fighter',
          definitionId: 'hero_001_grilled_chicken',
          role: 'fighter',
          level: 2,
          experience: 3,
          nextExperience: 127,
          currentHp: 80,
          maxHp: 121,
          status: 'alive',
        },
      ],
    });
    expect(bridge.state).toMatchObject({
      sessionGold: 12,
      autoHuntEnabled: true,
      autoHuntState: 'navigating',
      focusedMonsterName: 'Grumpy Radish',
      livingHeroes: 2,
      respawnSeconds: 4,
    });
  });

  it('does not notify React when a server patch has no visible state change', () => {
    const bridge = new MultiplayerBridge();
    const listener = vi.fn();
    bridge.subscribe(listener);
    const heroes = [
      {
        id: 'p:fighter',
        definitionId: 'hero_001_grilled_chicken',
        role: 'fighter' as const,
        level: 1,
        experience: 0,
        nextExperience: 50,
        currentHp: 100,
        maxHp: 100,
        status: 'alive' as const,
      },
    ];
    bridge.update({ connection: 'connected', heroes });
    bridge.update({ connection: 'connected', heroes: heroes.map((hero) => ({ ...hero })) });
    expect(listener).toHaveBeenCalledTimes(2);
    bridge.update({ heroes: [{ ...heroes[0]!, currentHp: 90 }] });
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('publishes a patch when persistent hero identity changes without a role change', () => {
    const bridge = new MultiplayerBridge();
    const listener = vi.fn();
    bridge.subscribe(listener);
    const hero = {
      id: 'owned-hero',
      definitionId: 'hero_001_grilled_chicken',
      role: 'fighter' as const,
      level: 1,
      experience: 0,
      nextExperience: 50,
      currentHp: 100,
      maxHp: 100,
      status: 'alive' as const,
    };
    bridge.update({ heroes: [hero] });
    bridge.update({
      heroes: [{ ...hero, definitionId: 'hero_002_pink_chocolate_lizard' }],
    });
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
