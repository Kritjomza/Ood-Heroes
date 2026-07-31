export type FixedStepAdvance = { steps: number; skippedSteps: number; late: boolean };

export class FixedStepScheduler {
  private accumulatorMs = 0;
  private lateCallbacks = 0;
  private skippedSteps = 0;

  constructor(
    private readonly stepMs: number,
    private readonly maxCatchUpSteps: number,
  ) {
    if (!(stepMs > 0) || !Number.isInteger(maxCatchUpSteps) || maxCatchUpSteps < 1)
      throw new Error('Fixed-step scheduler configuration must be positive.');
  }

  advance(elapsedMs: number): FixedStepAdvance {
    const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
    this.accumulatorMs += safeElapsed;
    const available = Math.floor((this.accumulatorMs + Number.EPSILON) / this.stepMs);
    const steps = Math.min(available, this.maxCatchUpSteps);
    const skippedSteps = Math.max(0, available - steps);
    const late = available > 1;
    if (late) this.lateCallbacks += 1;
    this.skippedSteps += skippedSteps;
    this.accumulatorMs -= available * this.stepMs;
    return { steps, skippedSteps, late };
  }

  diagnostics() {
    return {
      accumulatorMs: this.accumulatorMs,
      lateCallbacks: this.lateCallbacks,
      skippedSteps: this.skippedSteps,
    };
  }

  reset() {
    this.accumulatorMs = 0;
    this.lateCallbacks = 0;
    this.skippedSteps = 0;
  }
}
