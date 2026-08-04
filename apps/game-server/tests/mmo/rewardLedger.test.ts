import { describe, expect, it } from 'vitest';
import { RewardLedger } from '../../src/mmo/rewards/RewardLedger.js';

describe('MMO reward ledger', () => {
  it('keeps pending rewards visible but unusable until committed', () => {
    const ledger = new RewardLedger();
    const pending = ledger.prepare({ rewardIdentity: 'room:monster:1', accountId: 'account-1', payload: { gold: 10 }, createdAtMs: 1 });
    expect(pending.status).toBe('pending');
    expect(ledger.committed('room:monster:1')).toBe(false);
    expect(ledger.commit('room:monster:1', 2).status).toBe('committed');
  });

  it('is idempotent for replayed prepare and commit operations', () => {
    const ledger = new RewardLedger();
    const first = ledger.prepare({ rewardIdentity: 'room:monster:2', accountId: 'account-1', payload: { xp: 20 }, createdAtMs: 1 });
    const replay = ledger.prepare({ rewardIdentity: 'room:monster:2', accountId: 'account-1', payload: { xp: 999 }, createdAtMs: 9 });
    expect(replay).toEqual(first);
    expect(ledger.commit('room:monster:2', 2)).toEqual(ledger.commit('room:monster:2', 3));
  });
});
