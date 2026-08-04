import { describe, expect, it } from 'vitest';
import { BossActivityService } from '../../src/mmo/activities/BossActivityService.js';

describe('MMO boss activities', () => {
  it('rewards contribution share rather than last-hit ownership', () => {
    const service = new BossActivityService();
    service.schedule('event-1', 'channel-1', 'world-boss', 1_000);
    service.start('event-1');
    service.recordContribution('event-1', 'account-a', 700, 10);
    service.recordContribution('event-1', 'account-b', 300, 11);
    const rewards = service.finish('event-1', '2026-08-04');
    expect(rewards.map((reward) => reward.accountId)).toEqual(['account-a', 'account-b']);
    expect(rewards[0]!.tier).toBe('gold');
    expect(rewards[1]!.tier).toBe('silver');
  });

  it('limits premium rewards per account per day and is idempotent', () => {
    const service = new BossActivityService();
    for (const eventId of ['event-1', 'event-2']) {
      service.schedule(eventId, 'channel-1', 'world-boss', 1_000);
      service.start(eventId);
      service.recordContribution(eventId, 'account-a', 900, 1);
      service.recordContribution(eventId, 'account-b', 100, 1);
    }
    const first = service.finish('event-1', '2026-08-04');
    const second = service.finish('event-2', '2026-08-04');
    expect(first.find((reward) => reward.accountId === 'account-a')!.premium).toBe(true);
    expect(second.find((reward) => reward.accountId === 'account-a')!.premium).toBe(false);
    expect(service.finish('event-1', '2026-08-04')).toEqual(first);
  });
});
