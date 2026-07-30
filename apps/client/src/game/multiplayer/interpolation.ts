import { NETWORK_CONFIG, type NetworkPlayerState } from '@odd-tower/network-protocol';

export type TimedPlayerSnapshot = NetworkPlayerState & { atMs: number };
type RenderedPlayer = Omit<TimedPlayerSnapshot, 'atMs'>;

export class RemoteInterpolator {
  private readonly buffers = new Map<string, TimedPlayerSnapshot[]>();

  get playerCount() {
    return this.buffers.size;
  }

  playerIds() {
    return [...this.buffers.keys()];
  }

  add(snapshot: TimedPlayerSnapshot) {
    const values = this.buffers.get(snapshot.id) ?? [];
    values.push({ ...snapshot });
    values.sort((a, b) => a.atMs - b.atMs);
    if (values.length > NETWORK_CONFIG.interpolationBufferLimit)
      values.splice(0, values.length - NETWORK_CONFIG.interpolationBufferLimit);
    this.buffers.set(snapshot.id, values);
  }

  sizeFor(playerId: string) {
    return this.buffers.get(playerId)?.length ?? 0;
  }

  remove(playerId: string) {
    this.buffers.delete(playerId);
  }

  clear() {
    this.buffers.clear();
  }

  sample(playerId: string, renderAtMs: number): RenderedPlayer | null {
    const values = this.buffers.get(playerId);
    if (!values?.length) return null;
    const futureIndex = values.findIndex((snapshot) => snapshot.atMs >= renderAtMs);
    if (futureIndex > 0) {
      const previous = values[futureIndex - 1]!;
      const future = values[futureIndex]!;
      const gap = Math.hypot(future.x - previous.x, future.y - previous.y);
      if (gap > NETWORK_CONFIG.hardSnapDistance)
        return this.withoutTime(renderAtMs >= future.atMs ? future : previous);
      const span = Math.max(1, future.atMs - previous.atMs);
      const ratio = Math.max(0, Math.min(1, (renderAtMs - previous.atMs) / span));
      return {
        ...this.withoutTime(previous),
        x: previous.x + (future.x - previous.x) * ratio,
        y: previous.y + (future.y - previous.y) * ratio,
        direction: ratio < 1 ? previous.direction : future.direction,
        moving: ratio < 1 ? previous.moving : future.moving,
        connected: future.connected,
        lastProcessedInputSequence: future.lastProcessedInputSequence,
      };
    }
    if (futureIndex === 0) return this.withoutTime(values[0]!);

    const latest = values[values.length - 1]!;
    if (!latest.moving || latest.direction === 'none') return this.withoutTime(latest);
    const elapsed = Math.max(
      0,
      Math.min(NETWORK_CONFIG.extrapolationLimitMs, renderAtMs - latest.atMs),
    );
    const distance = NETWORK_CONFIG.playerSpeed * (elapsed / 1000);
    return {
      ...this.withoutTime(latest),
      x:
        latest.x +
        (latest.direction === 'left' ? -distance : latest.direction === 'right' ? distance : 0),
      y:
        latest.y +
        (latest.direction === 'up' ? -distance : latest.direction === 'down' ? distance : 0),
    };
  }

  private withoutTime(snapshot: TimedPlayerSnapshot): RenderedPlayer {
    return {
      id: snapshot.id,
      displayName: snapshot.displayName,
      x: snapshot.x,
      y: snapshot.y,
      direction: snapshot.direction,
      moving: snapshot.moving,
      connected: snapshot.connected,
      lastProcessedInputSequence: snapshot.lastProcessedInputSequence,
    };
  }
}
