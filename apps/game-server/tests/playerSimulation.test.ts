// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  acceptPlayerCommand,
  createSimulationPlayer,
  tickPlayer,
} from '../src/simulation/playerSimulation';

describe('authoritative player simulation', () => {
  it('moves cardinally at 120 px/s on a fixed 50 ms tick and acknowledges input', () => {
    const player = createSimulationPlayer('p1', 'One', { x: 1024, y: 1024 });
    expect(
      acceptPlayerCommand(
        player,
        { type: 'move', sequence: 1, direction: 'right', clientSentAtMs: 0 },
        0,
      ),
    ).toBe('accepted');
    tickPlayer(player, 50);
    expect(player.state).toMatchObject({
      x: 1030,
      y: 1024,
      direction: 'right',
      moving: true,
      lastProcessedInputSequence: 1,
    });
  });

  it('stops a stuck direction after 500 ms without valid input', () => {
    const player = createSimulationPlayer('p1', 'One', { x: 1024, y: 1024 });
    acceptPlayerCommand(
      player,
      { type: 'move', sequence: 1, direction: 'up', clientSentAtMs: 0 },
      0,
    );
    tickPlayer(player, 501);
    expect(player.state).toMatchObject({ x: 1024, y: 1024, direction: 'none', moving: false });
  });

  it('ignores duplicate and old sequences and rejects a huge sequence jump', () => {
    const player = createSimulationPlayer('p1', 'One', { x: 1024, y: 1024 });
    const first = { type: 'move', sequence: 5, direction: 'left', clientSentAtMs: 0 } as const;
    expect(acceptPlayerCommand(player, first, 0)).toBe('accepted');
    expect(acceptPlayerCommand(player, first, 1)).toBe('stale');
    expect(acceptPlayerCommand(player, { ...first, sequence: 4 }, 2)).toBe('stale');
    expect(acceptPlayerCommand(player, { ...first, sequence: 10_006 }, 3)).toBe('jump');
    tickPlayer(player, 50);
    expect(player.state.lastProcessedInputSequence).toBe(5);
  });

  it('does not move through shared collision or world bounds', () => {
    const wall = createSimulationPlayer('p1', 'One', { x: 559, y: 544 });
    acceptPlayerCommand(
      wall,
      { type: 'move', sequence: 1, direction: 'right', clientSentAtMs: 0 },
      0,
    );
    tickPlayer(wall, 50);
    expect(wall.state.x).toBe(559);

    const edge = createSimulationPlayer('p2', 'Two', { x: 15, y: 100 });
    acceptPlayerCommand(
      edge,
      { type: 'move', sequence: 1, direction: 'left', clientSentAtMs: 0 },
      0,
    );
    tickPlayer(edge, 50);
    expect(edge.state.x).toBe(15);
  });

  it('heartbeat acknowledges without starting movement', () => {
    const player = createSimulationPlayer('p1', 'One', { x: 1024, y: 1024 });
    acceptPlayerCommand(player, { type: 'heartbeat', sequence: 1, clientSentAtMs: 20 }, 20);
    tickPlayer(player, 50);
    expect(player.state).toMatchObject({ moving: false, lastProcessedInputSequence: 1 });
  });
});
