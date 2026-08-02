import {
  advanceFloorGuardian,
  applyFloorProgress,
  completeFloorOne,
  createFloorCompletionState,
  createFloorGuardian,
  damageFloorGuardian,
  portalEligibility,
  startFloorGuardian,
  type FloorCompletionState,
  type FloorGuardianEvent,
  type FloorGuardianState,
} from '@odd-tower/game-core';

type PlayerFloorState = {
  floorProgress: number;
  bossDefeated: boolean;
  completion: FloorCompletionState;
};

export class FloorOneProgressionSimulation {
  private guardian: FloorGuardianState = createFloorGuardian();
  private readonly players = new Map<string, PlayerFloorState>();
  private pendingEvents: FloorGuardianEvent[] = [];

  addPlayer(playerId: string) {
    if (!this.players.has(playerId))
      this.players.set(playerId, {
        floorProgress: 0,
        bossDefeated: false,
        completion: createFloorCompletionState(playerId),
      });
  }

  removePlayer(playerId: string) {
    this.players.delete(playerId);
  }

  recordMonsterReward(playerId: string) {
    const player = this.players.get(playerId);
    if (player) player.floorProgress = applyFloorProgress(player.floorProgress, 5);
  }

  forceEligible(playerId: string) {
    this.addPlayer(playerId);
    this.players.get(playerId)!.floorProgress = 100;
  }

  startGuardian(playerId: string) {
    const player = this.players.get(playerId);
    if (!player || player.floorProgress < 100 || this.guardian.status === 'active') return false;
    const result = startFloorGuardian(this.guardian, player.floorProgress);
    this.guardian = result.state;
    this.pendingEvents.push(...result.events);
    return this.guardian.status === 'active';
  }

  damageGuardian(playerId: string, amount: number) {
    const result = damageFloorGuardian(this.guardian, playerId, amount);
    this.guardian = result.state;
    this.pendingEvents.push(...result.events);
    if (this.guardian.status === 'defeated')
      for (const eligibleId of this.guardian.eligiblePlayerIds) {
        const player = this.players.get(eligibleId);
        if (player) player.bossDefeated = true;
      }
    return Math.max(0, amount);
  }

  tick(tick: number) {
    const result = advanceFloorGuardian(this.guardian, tick);
    this.guardian = result.state;
    this.pendingEvents.push(...result.events);
  }

  completePortal(playerId: string, requestId: string, manualEntry: boolean) {
    const player = this.players.get(playerId);
    if (!player) return { status: 'progress-required' as const };
    const result = completeFloorOne(player.completion, {
      manualEntry,
      floorProgress: player.floorProgress,
      bossDefeated: player.bossDefeated,
      requestId,
    });
    player.completion = result.state;
    return result.result;
  }

  playerSnapshot(playerId: string) {
    const player = this.players.get(playerId) ?? {
      floorProgress: 0,
      bossDefeated: false,
      completion: createFloorCompletionState(playerId),
    };
    return {
      floorProgress: player.floorProgress,
      guardianEligible: player.floorProgress >= 100,
      bossDefeated: player.bossDefeated,
      portalEligibility: portalEligibility({
        floorProgress: player.floorProgress,
        bossDefeated: player.bossDefeated,
        alreadyCompleted: player.completion.completed,
      }),
      floorCompleted: player.completion.completed,
    };
  }

  guardianSnapshot() {
    return {
      ...this.guardian,
      participantDamage: { ...this.guardian.participantDamage },
      eligiblePlayerIds: [...this.guardian.eligiblePlayerIds],
      portalUnlocked: this.guardian.status === 'defeated',
    };
  }

  drainEvents() {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  dispose() {
    this.players.clear();
    this.pendingEvents.length = 0;
    this.guardian = createFloorGuardian();
  }
}
