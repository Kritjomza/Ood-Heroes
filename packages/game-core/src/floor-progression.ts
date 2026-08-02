export type PortalEligibility = 'eligible' | 'progress-required' | 'boss-required' | 'already-completed';
export type FloorCompletionResult = {
  status: 'completed' | 'manual-entry-required' | PortalEligibility;
  completionId?: string;
  gold?: number;
  gem?: number;
};
export type FloorCompletionState = {
  playerId: string;
  completed: boolean;
  requestId: string | null;
  result: FloorCompletionResult | null;
};

export function applyFloorProgress(current: number, earned: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(earned)) return 0;
  return Math.max(0, Math.min(100, Math.floor(current + Math.max(0, earned))));
}

export function portalEligibility(input: {
  floorProgress: number;
  bossDefeated: boolean;
  alreadyCompleted: boolean;
}): PortalEligibility {
  if (input.alreadyCompleted) return 'already-completed';
  if (input.floorProgress < 100) return 'progress-required';
  if (!input.bossDefeated) return 'boss-required';
  return 'eligible';
}

export function createFloorCompletionState(playerId: string): FloorCompletionState {
  return { playerId, completed: false, requestId: null, result: null };
}

export function completeFloorOne(
  state: FloorCompletionState,
  input: { manualEntry: boolean; floorProgress: number; bossDefeated: boolean; requestId: string },
): { state: FloorCompletionState; result: FloorCompletionResult } {
  if (state.requestId === input.requestId && state.result) return { state, result: state.result };
  if (state.completed) return { state, result: { status: 'already-completed' } };
  if (!input.manualEntry) return { state, result: { status: 'manual-entry-required' } };
  const eligibility = portalEligibility({
    floorProgress: input.floorProgress,
    bossDefeated: input.bossDefeated,
    alreadyCompleted: state.completed,
  });
  if (eligibility !== 'eligible') return { state, result: { status: eligibility } };
  const result: FloorCompletionResult = {
    status: 'completed',
    completionId: `floor_1:${state.playerId}`,
    gold: 500,
    gem: 100,
  };
  return {
    state: { ...state, completed: true, requestId: input.requestId, result },
    result,
  };
}
