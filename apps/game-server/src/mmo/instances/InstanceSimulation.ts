import type { PrivateInstanceKind } from './PrivateInstanceRegistry.js';

export type InstanceSimulationState = {
  encounterIndex: number;
  encounterCount: number;
  progress: number;
  objective: 'prepare' | 'clear' | 'boss' | 'complete';
  bossActive: boolean;
};

export function createInstanceSimulation(kind: PrivateInstanceKind, _seed: number): InstanceSimulationState {
  const encounterCount = kind === 'dungeon' ? 5 : 3;
  return { encounterIndex: 0, encounterCount, progress: 0, objective: 'prepare', bossActive: false };
}

export function tickInstanceSimulation(state: InstanceSimulationState, ready: boolean) {
  if (!ready || state.objective === 'complete') return false;
  state.objective = state.encounterIndex === state.encounterCount - 1 ? 'boss' : 'clear';
  state.bossActive = state.objective === 'boss';
  state.progress = Math.min(100, state.progress + (state.bossActive ? 2 : 4));
  if (state.progress < 100) return true;
  if (state.encounterIndex + 1 >= state.encounterCount) {
    state.objective = 'complete';
    state.bossActive = false;
    return true;
  }
  state.encounterIndex += 1;
  state.progress = 0;
  state.objective = 'prepare';
  state.bossActive = false;
  return true;
}
