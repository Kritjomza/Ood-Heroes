export type DomainErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_INVALID'
  | 'AUTH_EXPIRED'
  | 'PROFILE_NOT_FOUND'
  | 'PROFILE_INITIALIZATION_FAILED'
  | 'DISPLAY_NAME_INVALID'
  | 'PLAYER_ALREADY_CONNECTED'
  | 'PERSISTENCE_UNAVAILABLE'
  | 'PERSISTENCE_DEGRADED'
  | 'IDEMPOTENCY_REQUIRED'
  | 'INSUFFICIENT_GEMS'
  | 'INSUFFICIENT_GOLD'
  | 'INSUFFICIENT_SHARDS'
  | 'HERO_NOT_OWNED'
  | 'HERO_ALREADY_MAX_STARS'
  | 'TEAM_SLOT_LOCKED'
  | 'TEAM_INVALID'
  | 'ACTIVE_COMBAT_RESTRICTION'
  | 'BANNER_NOT_FOUND'
  | 'BANNER_DISABLED'
  | 'AFK_CLAIM_NOT_FOUND'
  | 'AFK_ALREADY_CLAIMED'
  | 'RATE_LIMITED'
  | 'SCHEMA_VERSION_MISMATCH'
  | 'SERVER_ERROR';

export type PersistentHeroRole = 'fighter' | 'tank' | 'trickster' | 'healer' | 'support' | 'ranger';
export type HeroRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type AccountKind = 'guest' | 'permanent';
export type PersistenceStatus = 'healthy' | 'degraded' | 'unavailable';

export type AuthenticatedJoinOptions = {
  accessToken: string;
  protocolVersion: number;
};

export type MutationEnvelope<T extends Record<string, unknown> = Record<string, unknown>> = {
  idempotencyKey: string;
  payload: T;
};

export type PlayerProfile = {
  userId: string;
  displayName: string;
  accountKind: AccountKind;
  teamSlots: number;
  onboardingStep: number;
};

export type PlayerCurrencies = {
  gold: number;
  gem: number;
  upgradeJelly: number;
};

export type HeroDefinition = {
  id: string;
  displayName: string;
  role: PersistentHeroRole;
  rarity: HeroRarity;
  assetKey: string;
};

export type PlayerHero = {
  id: string;
  definitionId: string;
  totalExperience: number;
  level: number;
  stars: number;
  shards: number;
};

export type ActiveTeam = {
  id: string;
  name: string;
  slots: Array<{ slotIndex: number; playerHeroId: string }>;
};

export type SummonBannerState = {
  id: string;
  displayName: string;
  gemCost: number;
  pityThreshold: number;
  pullsSinceEpic: number;
  totalPulls: number;
};

export type AfkClaimPreview = {
  id: string;
  intervalCount: number;
  periodStart: string;
  periodEnd: string;
  gold: number;
  heroExperience: number;
  upgradeJelly: number;
} | null;

export type PersistenceHealthSnapshot = {
  status: PersistenceStatus;
  queueDepth: number;
};

export type PlayerBootstrap = {
  contractVersion: number;
  schemaVersion: number;
  serverTime: string;
  profile: PlayerProfile;
  currencies: PlayerCurrencies;
  heroDefinitions: HeroDefinition[];
  heroes: PlayerHero[];
  activeTeam: ActiveTeam;
  banner: SummonBannerState;
  pendingAfkClaim: AfkClaimPreview;
  persistence: PersistenceHealthSnapshot;
};

export type PersistenceValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: DomainErrorCode };
