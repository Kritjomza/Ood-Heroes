import { describe, expect, it } from 'vitest';
import {
  applyFloorProgress,
  completeFloorOne,
  createFloorCompletionState,
  portalEligibility,
} from '../src/index';

describe('Floor 1 progress and portal completion', () => {
  it('caps farming progress and gates the guardian at 100 percent', () => {
    expect(applyFloorProgress(94, 10)).toBe(100);
    expect(portalEligibility({ floorProgress: 99, bossDefeated: true, alreadyCompleted: false })).toBe('progress-required');
    expect(portalEligibility({ floorProgress: 100, bossDefeated: false, alreadyCompleted: false })).toBe('boss-required');
  });

  it('requires manual eligible entry and grants completion once', () => {
    const initial = createFloorCompletionState('player-1');
    const first = completeFloorOne(initial, {
      manualEntry: true,
      floorProgress: 100,
      bossDefeated: true,
      requestId: 'portal-request-1',
    });
    expect(first.result).toMatchObject({ status: 'completed', gold: 500, gem: 100 });
    expect(first.state.completed).toBe(true);
    const duplicate = completeFloorOne(first.state, {
      manualEntry: true,
      floorProgress: 100,
      bossDefeated: true,
      requestId: 'portal-request-1',
    });
    expect(duplicate).toEqual(first);
  });

  it('fails closed for Auto Hunt, ineligible entry, and conflicting duplicate requests', () => {
    const initial = createFloorCompletionState('player-2');
    expect(completeFloorOne(initial, { manualEntry: false, floorProgress: 100, bossDefeated: true, requestId: 'auto' }).result.status).toBe('manual-entry-required');
    expect(completeFloorOne(initial, { manualEntry: true, floorProgress: 80, bossDefeated: true, requestId: 'early' }).result.status).toBe('progress-required');
    const completed = completeFloorOne(initial, { manualEntry: true, floorProgress: 100, bossDefeated: true, requestId: 'first' });
    expect(completeFloorOne(completed.state, { manualEntry: true, floorProgress: 100, bossDefeated: true, requestId: 'second' }).result.status).toBe('already-completed');
  });
});
