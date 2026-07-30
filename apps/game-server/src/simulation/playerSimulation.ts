import { moveCardinal, prototypeMap, type Vector2 } from '@odd-tower/game-core';
import {
  NETWORK_CONFIG,
  type CardinalDirection,
  type ClientCommand,
  type NetworkPlayerState,
} from '@odd-tower/network-protocol';

export type SimulationPlayer = {
  state: NetworkPlayerState;
  latestAcceptedSequence: number;
  latestDirection: CardinalDirection;
  lastValidInputAtMs: number;
};

export function createSimulationPlayer(
  id: string,
  displayName: string,
  spawn: Vector2,
): SimulationPlayer {
  return {
    state: {
      id,
      displayName,
      x: spawn.x,
      y: spawn.y,
      direction: 'none',
      moving: false,
      connected: true,
      lastProcessedInputSequence: 0,
    },
    latestAcceptedSequence: 0,
    latestDirection: 'none',
    lastValidInputAtMs: 0,
  };
}

export function acceptPlayerCommand(
  player: SimulationPlayer,
  command: ClientCommand,
  receivedAtMs: number,
): 'accepted' | 'stale' | 'jump' {
  if (command.sequence <= player.latestAcceptedSequence) return 'stale';
  if (command.sequence - player.latestAcceptedSequence > NETWORK_CONFIG.maxSequenceJump)
    return 'jump';
  player.latestAcceptedSequence = command.sequence;
  player.lastValidInputAtMs = receivedAtMs;
  player.latestDirection = command.type === 'move' ? command.direction : 'none';
  return 'accepted';
}

export function tickPlayer(player: SimulationPlayer, nowMs: number) {
  const stale = nowMs - player.lastValidInputAtMs > NETWORK_CONFIG.inputTimeoutMs;
  const direction = player.state.connected && !stale ? player.latestDirection : 'none';
  const next = moveCardinal(
    { x: player.state.x, y: player.state.y },
    direction,
    NETWORK_CONFIG.tickMs,
    NETWORK_CONFIG.playerSpeed,
    prototypeMap,
    NETWORK_CONFIG.playerRadius,
  );
  player.state.x = next.x;
  player.state.y = next.y;
  player.state.direction = direction;
  player.state.moving = direction !== 'none';
  player.state.lastProcessedInputSequence = player.latestAcceptedSequence;
}

export function stopPlayer(player: SimulationPlayer) {
  player.latestDirection = 'none';
  player.state.direction = 'none';
  player.state.moving = false;
}
