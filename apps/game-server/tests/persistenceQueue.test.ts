// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { PersistenceQueue } from '../src/persistence/PersistenceQueue';

describe('PersistenceQueue', () => {
  it('bounds pending jobs per room and processes work outside the caller', async () => {
    const queue = new PersistenceQueue({ concurrency: 1, maxPendingPerRoom: 2, retryAttempts: 1 });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    expect(queue.enqueue('room-a', 'one', () => gate)).toBe(true);
    expect(queue.enqueue('room-a', 'two', async () => undefined)).toBe(true);
    expect(queue.enqueue('room-a', 'three', async () => undefined)).toBe(false);
    release();
    await queue.flush(1_000);
    expect(queue.snapshot()).toMatchObject({ depth: 0, active: 0, failed: 0 });
  });

  it('retries with the same logical job and records exhausted failures', async () => {
    const succeeds = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    const queue = new PersistenceQueue({
      concurrency: 1,
      maxPendingPerRoom: 2,
      retryAttempts: 2,
      initialRetryMs: 1,
      maxRetryMs: 1,
    });
    queue.enqueue('room-a', 'stable-key', succeeds);
    await queue.flush(1_000);
    expect(succeeds).toHaveBeenCalledTimes(2);
    expect(queue.snapshot()).toMatchObject({ completed: 1, retried: 1, failed: 0 });
  });
});
