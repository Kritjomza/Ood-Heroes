import { moveCardinal, prototypeMap, type Vector2 } from '@odd-tower/game-core';
import {
  NETWORK_CONFIG,
  type CardinalDirection,
  type ClientHeartbeatCommand,
  type ClientMoveCommand,
} from '@odd-tower/network-protocol';

export type Reconciliation = {
  kind: 'none' | 'smooth' | 'snap';
  position: Vector2;
  correction: Vector2;
};

export class PredictionController {
  private predicted: Vector2;
  private pending: ClientMoveCommand[] = [];
  private sequence = 0;
  private connected = true;

  constructor(initial: Vector2) {
    this.predicted = { ...initial };
  }

  get position() {
    return { ...this.predicted };
  }

  get pendingCount() {
    return this.pending.length;
  }

  applyInput(direction: CardinalDirection, clientSentAtMs: number): ClientMoveCommand | null {
    if (!this.connected) return null;
    const command: ClientMoveCommand = {
      type: 'move',
      sequence: ++this.sequence,
      direction,
      clientSentAtMs,
    };
    this.predicted = this.apply(this.predicted, command);
    this.pending.push(command);
    if (this.pending.length > NETWORK_CONFIG.maxPendingInputs)
      this.pending.splice(0, this.pending.length - NETWORK_CONFIG.maxPendingInputs);
    return command;
  }

  createHeartbeat(clientSentAtMs: number): ClientHeartbeatCommand {
    return { type: 'heartbeat', sequence: ++this.sequence, clientSentAtMs };
  }

  reconcile(authoritative: Vector2, acknowledgedSequence: number): Reconciliation {
    const before = this.predicted;
    this.pending = this.pending.filter((command) => command.sequence > acknowledgedSequence);
    this.predicted = this.pending.reduce((position, command) => this.apply(position, command), {
      ...authoritative,
    });
    const correction = { x: this.predicted.x - before.x, y: this.predicted.y - before.y };
    const distance = Math.hypot(correction.x, correction.y);
    return {
      kind:
        distance < NETWORK_CONFIG.smoothCorrectionMin
          ? 'none'
          : distance > NETWORK_CONFIG.hardSnapDistance
            ? 'snap'
            : 'smooth',
      position: this.position,
      correction,
    };
  }

  disconnect() {
    this.connected = false;
    this.pending = [];
  }

  reset(position: Vector2, acknowledgedSequence = 0) {
    this.connected = true;
    this.predicted = { ...position };
    this.pending = [];
    this.sequence = acknowledgedSequence;
  }

  private apply(position: Vector2, command: ClientMoveCommand) {
    return moveCardinal(
      position,
      command.direction,
      NETWORK_CONFIG.tickMs,
      NETWORK_CONFIG.playerSpeed,
      prototypeMap,
      NETWORK_CONFIG.playerRadius,
    );
  }
}
