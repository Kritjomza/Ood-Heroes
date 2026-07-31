import type {
  AutoHuntState,
  ConnectionState,
  HeroCombatStatus,
  HeroRole,
} from '@odd-tower/network-protocol';

export type CombatHeroUiState = {
  id: string;
  role: HeroRole;
  level: number;
  experience: number;
  nextExperience: number;
  currentHp: number;
  maxHp: number;
  status: HeroCombatStatus;
  slowed?: boolean;
};

export type MultiplayerUiState = {
  connection: ConnectionState;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  latencyMs: number | null;
  displayName: string;
  error: string;
  sessionGold: number;
  heroes: CombatHeroUiState[];
  autoHuntEnabled: boolean;
  autoHuntState: AutoHuntState;
  focusedMonsterName: string;
  livingHeroes: number;
  respawnSeconds: number;
};

export const initialMultiplayerState: MultiplayerUiState = {
  connection: 'offline',
  roomCode: '',
  playerCount: 0,
  maxPlayers: 10,
  latencyMs: null,
  displayName: '',
  error: '',
  sessionGold: 0,
  heroes: [],
  autoHuntEnabled: false,
  autoHuntState: 'disabled',
  focusedMonsterName: 'None',
  livingHeroes: 3,
  respawnSeconds: 0,
};

export class MultiplayerBridge {
  private readonly listeners = new Set<(state: MultiplayerUiState) => void>();
  state: MultiplayerUiState = { ...initialMultiplayerState };

  get listenerCount() {
    return this.listeners.size;
  }

  subscribe(listener: (state: MultiplayerUiState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  update(update: Partial<MultiplayerUiState>) {
    const next = { ...this.state, ...update };
    if (sameUiState(this.state, next)) return;
    this.state = next;
    for (const listener of this.listeners) listener(this.state);
  }

  reset() {
    this.state = { ...initialMultiplayerState };
    for (const listener of this.listeners) listener(this.state);
  }
}

function sameUiState(a: MultiplayerUiState, b: MultiplayerUiState) {
  if (
    a.connection !== b.connection ||
    a.roomCode !== b.roomCode ||
    a.playerCount !== b.playerCount ||
    a.maxPlayers !== b.maxPlayers ||
    a.latencyMs !== b.latencyMs ||
    a.displayName !== b.displayName ||
    a.error !== b.error ||
    a.sessionGold !== b.sessionGold ||
    a.autoHuntEnabled !== b.autoHuntEnabled ||
    a.autoHuntState !== b.autoHuntState ||
    a.focusedMonsterName !== b.focusedMonsterName ||
    a.livingHeroes !== b.livingHeroes ||
    a.respawnSeconds !== b.respawnSeconds ||
    a.heroes.length !== b.heroes.length
  )
    return false;
  return a.heroes.every((hero, index) => {
    const other = b.heroes[index];
    return (
      other !== undefined &&
      hero.id === other.id &&
      hero.role === other.role &&
      hero.level === other.level &&
      hero.experience === other.experience &&
      hero.nextExperience === other.nextExperience &&
      hero.currentHp === other.currentHp &&
      hero.maxHp === other.maxHp &&
      hero.status === other.status &&
      hero.slowed === other.slowed
    );
  });
}
