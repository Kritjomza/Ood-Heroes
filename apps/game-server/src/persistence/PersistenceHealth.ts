import type { PersistenceStatus } from '@odd-tower/network-protocol';
import type { PlayerPersistenceService } from './persistence-types.js';
import type { PersistenceQueue } from './PersistenceQueue.js';

export class PersistenceHealth {
  #status: PersistenceStatus = 'healthy';
  #lastProbeAt = 0;

  constructor(
    private readonly service: PlayerPersistenceService,
    private readonly queue: PersistenceQueue,
  ) {}

  snapshot() {
    const queue = this.queue.snapshot();
    return { status: this.#status, queueDepth: queue.depth + queue.active, ...queue };
  }

  degrade() {
    this.#status = 'degraded';
  }

  unavailable() {
    this.#status = 'unavailable';
  }

  async probe(force = false) {
    const now = Date.now();
    if (!force && now - this.#lastProbeAt < 5_000) return this.snapshot();
    this.#lastProbeAt = now;
    this.#status = (await this.service.probe()) ? 'healthy' : 'unavailable';
    return this.snapshot();
  }
}
