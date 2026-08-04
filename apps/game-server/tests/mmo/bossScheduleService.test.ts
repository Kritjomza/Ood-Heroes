import { describe, expect, it } from 'vitest';
import { BossScheduleService } from '../../src/mmo/activities/BossScheduleService.js';

describe('MMO published boss schedule', () => {
  it('returns deterministic events and UTC countdowns', () => {
    const schedule = new BossScheduleService({ firstStartAtMs: 1_000, periodMs: 10_000, leadTimeMs: 2_000 });
    const event = schedule.nextEvent('floor-1', 9_000);
    expect(event).toMatchObject({ eventId: 'floor-1:scheduled:11000', startAtMs: 11_000 });
    expect(schedule.countdown(event.eventId, 10_000)).toBe(1_000);
    expect(schedule.isAnnounced(event, 9_500)).toBe(true);
  });

  it('never returns a negative countdown after the event begins', () => {
    const schedule = new BossScheduleService({ firstStartAtMs: 1_000, periodMs: 10_000 });
    const event = schedule.nextEvent('floor-1', 1_000);
    expect(schedule.countdown(event.eventId, 20_000)).toBe(0);
  });
});
