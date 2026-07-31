// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FixedStepScheduler } from '../src/simulation/FixedStepScheduler';
import { SimulationMetrics } from '../src/simulation/SimulationMetrics';

describe('FixedStepScheduler', () => {
  it('preserves a 20 Hz fixed step across drifting room callbacks', () => {
    const scheduler = new FixedStepScheduler(50, 2);
    let executed = 0;
    for (let callback = 0; callback < 16; callback++) executed += scheduler.advance(62.5).steps;
    expect(executed).toBe(20);
    expect(scheduler.diagnostics().skippedSteps).toBe(0);
  });

  it('caps catch-up work and records skipped late steps', () => {
    const scheduler = new FixedStepScheduler(50, 2);
    expect(scheduler.advance(260)).toMatchObject({ steps: 2, skippedSteps: 3, late: true });
    expect(scheduler.diagnostics()).toMatchObject({ lateCallbacks: 1, skippedSteps: 3 });
  });

  it('runs staggered AI at 5 Hz, paths at no more than 2 Hz, and wander at 1 Hz', () => {
    const due = (tick: number, interval: number, slot = 0) => tick % interval === slot;
    expect(Array.from({ length: 20 }, (_, tick) => due(tick, 4)).filter(Boolean)).toHaveLength(5);
    expect(Array.from({ length: 20 }, (_, tick) => due(tick, 10)).filter(Boolean)).toHaveLength(2);
    expect(Array.from({ length: 20 }, (_, tick) => due(tick, 20)).filter(Boolean)).toHaveLength(1);
  });
});

describe('SimulationMetrics', () => {
  it('keeps a bounded duration window and reports deterministic percentiles', () => {
    const metrics = new SimulationMetrics(4);
    for (const duration of [1, 2, 3, 4, 100]) metrics.recordTick(duration, duration > 50);
    expect(metrics.snapshot()).toMatchObject({
      tickCount: 5,
      retainedDurations: 4,
      p50TickDurationMs: 3,
      p95TickDurationMs: 100,
      p99TickDurationMs: 100,
      maxTickDurationMs: 100,
      lateTicks: 1,
    });
  });
});
