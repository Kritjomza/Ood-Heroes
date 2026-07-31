export type PersistenceQueueOptions = {
  concurrency?: number;
  maxPendingPerRoom?: number;
  retryAttempts?: number;
  initialRetryMs?: number;
  maxRetryMs?: number;
};

type Job = {
  roomId: string;
  key: string;
  run: () => Promise<void>;
  attempt: number;
};

export class PersistenceQueue {
  readonly #options: Required<PersistenceQueueOptions>;
  readonly #pending: Job[] = [];
  readonly #pendingByRoom = new Map<string, number>();
  readonly #keys = new Set<string>();
  #active = 0;
  #completed = 0;
  #retried = 0;
  #failed = 0;
  #flushWaiters = new Set<() => void>();

  constructor(options: PersistenceQueueOptions = {}) {
    this.#options = {
      concurrency: options.concurrency ?? 4,
      maxPendingPerRoom: options.maxPendingPerRoom ?? 200,
      retryAttempts: options.retryAttempts ?? 5,
      initialRetryMs: options.initialRetryMs ?? 250,
      maxRetryMs: options.maxRetryMs ?? 5_000,
    };
  }

  enqueue(roomId: string, key: string, run: () => Promise<void>) {
    const compositeKey = `${roomId}:${key}`;
    if (this.#keys.has(compositeKey)) return true;
    if ((this.#pendingByRoom.get(roomId) ?? 0) >= this.#options.maxPendingPerRoom) return false;
    this.#keys.add(compositeKey);
    this.#pendingByRoom.set(roomId, (this.#pendingByRoom.get(roomId) ?? 0) + 1);
    this.#pending.push({ roomId, key, run, attempt: 1 });
    queueMicrotask(() => this.#pump());
    return true;
  }

  snapshot() {
    return {
      depth: this.#pending.length,
      active: this.#active,
      completed: this.#completed,
      retried: this.#retried,
      failed: this.#failed,
    };
  }

  async flush(timeoutMs = 10_000) {
    if (this.#pending.length === 0 && this.#active === 0) return true;
    return new Promise<boolean>((resolve) => {
      const done = () => {
        clearTimeout(timeout);
        this.#flushWaiters.delete(done);
        resolve(true);
      };
      const timeout = setTimeout(() => {
        this.#flushWaiters.delete(done);
        resolve(false);
      }, timeoutMs);
      this.#flushWaiters.add(done);
      this.#pump();
    });
  }

  #pump() {
    while (this.#active < this.#options.concurrency && this.#pending.length > 0) {
      const job = this.#pending.shift()!;
      this.#active += 1;
      void this.#execute(job);
    }
    this.#notifyIfIdle();
  }

  async #execute(job: Job) {
    try {
      await job.run();
      this.#completed += 1;
      this.#finish(job);
    } catch {
      if (job.attempt < this.#options.retryAttempts) {
        this.#retried += 1;
        const delay = Math.min(
          this.#options.initialRetryMs * 2 ** (job.attempt - 1),
          this.#options.maxRetryMs,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        this.#pending.unshift({ ...job, attempt: job.attempt + 1 });
      } else {
        this.#failed += 1;
        this.#finish(job);
      }
    } finally {
      this.#active -= 1;
      this.#pump();
    }
  }

  #finish(job: Job) {
    this.#keys.delete(`${job.roomId}:${job.key}`);
    const count = (this.#pendingByRoom.get(job.roomId) ?? 1) - 1;
    if (count === 0) this.#pendingByRoom.delete(job.roomId);
    else this.#pendingByRoom.set(job.roomId, count);
  }

  #notifyIfIdle() {
    if (this.#pending.length > 0 || this.#active > 0) return;
    for (const notify of [...this.#flushWaiters]) notify();
  }
}
