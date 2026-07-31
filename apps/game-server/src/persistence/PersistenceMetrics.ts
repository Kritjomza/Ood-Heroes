export class PersistenceMetrics {
  readonly #samples: number[] = [];
  readonly #outcomes = new Map<string, number>();

  record(operation: string, durationMs: number, outcome: 'ok' | 'error') {
    this.#samples.push(durationMs);
    if (this.#samples.length > 256) this.#samples.shift();
    const key = `${operation}:${outcome}`;
    this.#outcomes.set(key, (this.#outcomes.get(key) ?? 0) + 1);
  }

  snapshot() {
    const sorted = [...this.#samples].sort((a, b) => a - b);
    return {
      samples: sorted.length,
      p95Ms: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0,
      outcomes: Object.fromEntries(this.#outcomes),
    };
  }
}
