export type FloorGuardianStatus = 'locked' | 'available' | 'active' | 'defeated';
export type FloorGuardianEvent = {
  type: 'frontal-attack' | 'cold-wind' | 'summon-adds' | 'enraged' | 'defeated' | 'reset';
  tick: number;
};
export type FloorGuardianState = {
  id: 'angry-refrigerator';
  status: FloorGuardianStatus;
  phase: 'normal' | 'enraged';
  maxHp: 5000;
  currentHp: number;
  tick: number;
  nextFrontalTick: number;
  nextColdWindTick: number;
  nextSummonTick: number;
  activeAdds: number;
  participantDamage: Record<string, number>;
  eligiblePlayerIds: string[];
};

export function createFloorGuardian(): FloorGuardianState {
  return {
    id: 'angry-refrigerator',
    status: 'locked',
    phase: 'normal',
    maxHp: 5000,
    currentHp: 5000,
    tick: 0,
    nextFrontalTick: 20,
    nextColdWindTick: 40,
    nextSummonTick: 60,
    activeAdds: 0,
    participantDamage: {},
    eligiblePlayerIds: [],
  };
}

export function startFloorGuardian(
  state: FloorGuardianState,
  floorProgress: number,
): { state: FloorGuardianState; events: FloorGuardianEvent[] } {
  if (floorProgress < 100) return { state: { ...state, status: 'locked' }, events: [] };
  return {
    state: {
      ...state,
      status: 'active',
      phase: 'normal',
      currentHp: state.maxHp,
      tick: 0,
      nextFrontalTick: 20,
      nextColdWindTick: 40,
      nextSummonTick: 60,
      activeAdds: 0,
      participantDamage: {},
      eligiblePlayerIds: [],
    },
    events: [],
  };
}

export function advanceFloorGuardian(
  state: FloorGuardianState,
  tick: number,
): { state: FloorGuardianState; events: FloorGuardianEvent[] } {
  if (state.status !== 'active') return { state: { ...state, tick }, events: [] };
  if (tick >= 600 && Object.keys(state.participantDamage).length === 0) {
    return {
      state: { ...createFloorGuardian(), status: 'available', tick },
      events: [{ type: 'reset', tick }],
    };
  }
  const events: FloorGuardianEvent[] = [];
  let nextFrontalTick = state.nextFrontalTick;
  let nextColdWindTick = state.nextColdWindTick;
  let nextSummonTick = state.nextSummonTick;
  let activeAdds = state.activeAdds;
  if (tick >= nextFrontalTick) {
    events.push({ type: 'frontal-attack', tick });
    nextFrontalTick = tick + (state.phase === 'enraged' ? 24 : 36);
  }
  if (tick >= nextColdWindTick) {
    events.push({ type: 'cold-wind', tick });
    nextColdWindTick = tick + (state.phase === 'enraged' ? 50 : 70);
  }
  if (tick >= nextSummonTick) {
    events.push({ type: 'summon-adds', tick });
    activeAdds = 2;
    nextSummonTick = tick + 120;
  }
  return {
    state: { ...state, tick, nextFrontalTick, nextColdWindTick, nextSummonTick, activeAdds },
    events,
  };
}

export function damageFloorGuardian(
  state: FloorGuardianState,
  playerId: string,
  amount: number,
): { state: FloorGuardianState; events: FloorGuardianEvent[] } {
  if (state.status !== 'active' || !Number.isFinite(amount) || amount <= 0)
    return { state, events: [] };
  const currentHp = Math.max(0, state.currentHp - amount);
  const participantDamage = {
    ...state.participantDamage,
    [playerId]: (state.participantDamage[playerId] ?? 0) + amount,
  };
  const phase = currentHp > 0 && currentHp / state.maxHp < 0.3 ? 'enraged' : state.phase;
  const events: FloorGuardianEvent[] = [];
  if (phase === 'enraged' && state.phase !== 'enraged') events.push({ type: 'enraged', tick: state.tick });
  if (currentHp === 0) {
    const eligiblePlayerIds = Object.entries(participantDamage)
      .filter(([, damage]) => damage >= state.maxHp * 0.01)
      .map(([id]) => id);
    events.push({ type: 'defeated', tick: state.tick });
    return {
      state: { ...state, currentHp, phase, status: 'defeated', activeAdds: 0, participantDamage, eligiblePlayerIds },
      events,
    };
  }
  return { state: { ...state, currentHp, phase, participantDamage }, events };
}
