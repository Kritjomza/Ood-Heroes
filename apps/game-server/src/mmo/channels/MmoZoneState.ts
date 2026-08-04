import { MapSchema, Schema, defineTypes } from '@colyseus/schema';

export class MmoTeamViewSchema extends Schema {
  declare accountId: string;
  declare leaderX: number;
  declare leaderY: number;
  declare heroCount: number;
  declare aliveHeroCount: number;
  declare autoHuntEnabled: boolean;
  declare autoHuntState: string;
  declare weaknessUntilTick: number;
  declare adventureRank: number;
  declare heroLevels: string;

  constructor() {
    super();
    this.accountId = '';
    this.leaderX = 0;
    this.leaderY = 0;
    this.heroCount = 3;
    this.aliveHeroCount = 3;
    this.autoHuntEnabled = false;
    this.autoHuntState = 'disabled';
    this.weaknessUntilTick = 0;
    this.adventureRank = 1;
    this.heroLevels = '1,1,1';
  }
}

defineTypes(MmoTeamViewSchema, {
  accountId: 'string',
  leaderX: 'number',
  leaderY: 'number',
  heroCount: 'number',
  aliveHeroCount: 'number',
  autoHuntEnabled: 'boolean',
  autoHuntState: 'string',
  weaknessUntilTick: 'number',
  adventureRank: 'number',
  heroLevels: 'string',
});

export class MmoZoneState extends Schema {
  declare channelId: string;
  declare zoneId: string;
  declare population: number;
  declare maxPlayers: number;
  declare worldRevision: number;
  declare connectionState: string;
  declare teams: MapSchema<MmoTeamViewSchema>;
  declare activeMonsterCount: number;
  declare worldBossId: string;
  declare zoneActivity: number;
  declare bossEventId: string;
  declare bossStatus: string;
  declare bossCountdownTicks: number;
  declare bossContributionTotal: number;
  declare pendingRewardCount: number;

  constructor() {
    super();
    this.channelId = '';
    this.zoneId = 'floor-1';
    this.population = 0;
    this.maxPlayers = 30;
    this.worldRevision = 0;
    this.connectionState = 'connecting';
    this.teams = new MapSchema<MmoTeamViewSchema>();
    this.activeMonsterCount = 0;
    this.worldBossId = '';
    this.zoneActivity = 0;
    this.bossEventId = '';
    this.bossStatus = 'idle';
    this.bossCountdownTicks = 0;
    this.bossContributionTotal = 0;
    this.pendingRewardCount = 0;
  }
}

defineTypes(MmoZoneState, {
  channelId: 'string',
  zoneId: 'string',
  population: 'number',
  maxPlayers: 'number',
  worldRevision: 'number',
  connectionState: 'string',
  teams: { map: MmoTeamViewSchema },
  activeMonsterCount: 'number',
  worldBossId: 'string',
  zoneActivity: 'number',
  bossEventId: 'string',
  bossStatus: 'string',
  bossCountdownTicks: 'number',
  bossContributionTotal: 'number',
  pendingRewardCount: 'number',
});
