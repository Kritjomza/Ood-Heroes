export type MmoConnectionState =
  | 'idle'
  | 'locating'
  | 'joining'
  | 'connected'
  | 'recovering'
  | 'incompatible'
  | 'failed';

export type MmoWorldSnapshot = {
  channelId: string;
  zoneId: string;
  population: number;
  worldRevision: number;
  connectionState: string;
  activeMonsterCount?: number;
  worldBossId?: string;
  zoneActivity?: number;
  bossEventId?: string;
  bossStatus?: string;
  bossCountdownTicks?: number;
  bossContributionTotal?: number;
  pendingRewardCount?: number;
};

export type MmoWorldUiState = {
  connection: MmoConnectionState;
  zoneId: string;
  channelId: string;
  population: number;
  worldRevision: number;
  errorCode: string;
  autoHuntEnabled?: boolean;
  activeMonsterCount?: number;
  worldBossId?: string;
  zoneActivity?: number;
  bossEventId?: string;
  bossStatus?: string;
  bossCountdownTicks?: number;
  bossContributionTotal?: number;
  pendingRewardCount?: number;
};

export const initialMmoWorldState: Readonly<MmoWorldUiState> = Object.freeze({
  connection: 'idle',
  zoneId: '',
  channelId: '',
  population: 0,
  worldRevision: 0,
  errorCode: '',
  autoHuntEnabled: false,
  activeMonsterCount: 0,
  worldBossId: '',
  zoneActivity: 0,
  bossEventId: '',
  bossStatus: 'idle',
  bossCountdownTicks: 0,
  bossContributionTotal: 0,
  pendingRewardCount: 0,
});

export class MmoWorldBridge {
  private readonly listeners = new Set<(state: Readonly<MmoWorldUiState>) => void>();
  private state: Readonly<MmoWorldUiState> = initialMmoWorldState;

  get listenerCount() {
    return this.listeners.size;
  }

  snapshot() {
    return this.state;
  }

  subscribe(listener: (state: Readonly<MmoWorldUiState>) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  update(update: Partial<MmoWorldUiState>) {
    const next = Object.freeze({ ...this.state, ...update });
    if (sameState(this.state, next)) return;
    this.state = next;
    for (const listener of this.listeners) listener(this.state);
  }

  applyWorldSnapshot(snapshot: MmoWorldSnapshot) {
    if (!validSnapshot(snapshot) || snapshot.worldRevision < this.state.worldRevision) return;
    this.update({
      channelId: snapshot.channelId,
      zoneId: snapshot.zoneId,
      population: snapshot.population,
      worldRevision: snapshot.worldRevision,
      activeMonsterCount: snapshot.activeMonsterCount ?? this.state.activeMonsterCount,
      worldBossId: snapshot.worldBossId ?? this.state.worldBossId,
      zoneActivity: snapshot.zoneActivity ?? this.state.zoneActivity,
      bossEventId: snapshot.bossEventId ?? this.state.bossEventId,
      bossStatus: snapshot.bossStatus ?? this.state.bossStatus,
      bossCountdownTicks: snapshot.bossCountdownTicks ?? this.state.bossCountdownTicks,
      bossContributionTotal: snapshot.bossContributionTotal ?? this.state.bossContributionTotal,
      pendingRewardCount: snapshot.pendingRewardCount ?? this.state.pendingRewardCount,
    });
  }

  reset() {
    this.state = initialMmoWorldState;
    for (const listener of this.listeners) listener(this.state);
  }
}

function validSnapshot(snapshot: MmoWorldSnapshot) {
  return (
    typeof snapshot.channelId === 'string' &&
    snapshot.channelId.length > 0 &&
    typeof snapshot.zoneId === 'string' &&
    snapshot.zoneId.length > 0 &&
    Number.isSafeInteger(snapshot.population) &&
    snapshot.population >= 0 &&
    snapshot.population <= 30 &&
    Number.isSafeInteger(snapshot.worldRevision) &&
    snapshot.worldRevision >= 0
  );
}

function sameState(left: Readonly<MmoWorldUiState>, right: Readonly<MmoWorldUiState>) {
  return (
    left.connection === right.connection &&
    left.zoneId === right.zoneId &&
    left.channelId === right.channelId &&
    left.population === right.population &&
    left.worldRevision === right.worldRevision &&
    left.errorCode === right.errorCode
    && left.autoHuntEnabled === right.autoHuntEnabled
    && left.activeMonsterCount === right.activeMonsterCount
    && left.worldBossId === right.worldBossId
    && left.zoneActivity === right.zoneActivity
    && left.bossEventId === right.bossEventId
    && left.bossStatus === right.bossStatus
    && left.bossCountdownTicks === right.bossCountdownTicks
    && left.bossContributionTotal === right.bossContributionTotal
    && left.pendingRewardCount === right.pendingRewardCount
  );
}
