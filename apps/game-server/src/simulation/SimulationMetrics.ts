export class SimulationMetrics {
  private readonly durations: number[] = [];
  private tickCount = 0;
  private lateTicks = 0;
  private consecutiveLateTicks = 0;
  private maximumConsecutiveLateTicks = 0;
  private maxTickDurationMs = 0;

  constructor(private readonly durationLimit = 256) {
    if (!Number.isInteger(durationLimit) || durationLimit < 1)
      throw new Error('Metric duration limit must be a positive integer.');
  }

  recordTick(durationMs: number, late: boolean) {
    const duration = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
    this.tickCount += 1;
    if (late) {
      this.lateTicks += 1;
      this.consecutiveLateTicks += 1;
      this.maximumConsecutiveLateTicks = Math.max(
        this.maximumConsecutiveLateTicks,
        this.consecutiveLateTicks,
      );
    } else this.consecutiveLateTicks = 0;
    this.maxTickDurationMs = Math.max(this.maxTickDurationMs, duration);
    this.durations.push(duration);
    if (this.durations.length > this.durationLimit)
      this.durations.splice(0, this.durations.length - this.durationLimit);
  }

  snapshot() {
    const sorted = [...this.durations].sort((a, b) => a - b);
    const percentile = (fraction: number) =>
      sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)]! : 0;
    const total = this.durations.reduce((sum, duration) => sum + duration, 0);
    return {
      tickCount: this.tickCount,
      retainedDurations: this.durations.length,
      averageTickDurationMs: this.durations.length ? total / this.durations.length : 0,
      p50TickDurationMs: percentile(0.5),
      p95TickDurationMs: percentile(0.95),
      p99TickDurationMs: percentile(0.99),
      maxTickDurationMs: this.maxTickDurationMs,
      lateTicks: this.lateTicks,
      consecutiveLateTicks: this.consecutiveLateTicks,
      maximumConsecutiveLateTicks: this.maximumConsecutiveLateTicks,
    };
  }

  clear() {
    this.durations.length = 0;
    this.tickCount = 0;
    this.lateTicks = 0;
    this.consecutiveLateTicks = 0;
    this.maximumConsecutiveLateTicks = 0;
    this.maxTickDurationMs = 0;
  }
}
