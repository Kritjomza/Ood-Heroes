import { Schema, defineTypes } from '@colyseus/schema';

export class MmoInstanceState extends Schema {
  declare instanceId: string;
  declare kind: string;
  declare status: string;
  declare memberCount: number;
  declare readyCount: number;
  declare checkpointRevision: number;
  declare worldRevision: number;
  declare encounterIndex: number;
  declare encounterCount: number;
  declare encounterProgress: number;
  declare objective: string;
  declare bossActive: boolean;
  declare reviveTokens: number;

  constructor() {
    super();
    this.instanceId = '';
    this.kind = 'story';
    this.status = 'forming';
    this.memberCount = 0;
    this.readyCount = 0;
    this.checkpointRevision = 0;
    this.worldRevision = 0;
    this.encounterIndex = 0;
    this.encounterCount = 0;
    this.encounterProgress = 0;
    this.objective = 'prepare';
    this.bossActive = false;
    this.reviveTokens = 0;
  }
}

defineTypes(MmoInstanceState, {
  instanceId: 'string',
  kind: 'string',
  status: 'string',
  memberCount: 'number',
  readyCount: 'number',
  checkpointRevision: 'number',
  worldRevision: 'number',
  encounterIndex: 'number',
  encounterCount: 'number',
  encounterProgress: 'number',
  objective: 'string',
  bossActive: 'boolean',
  reviveTokens: 'number',
});
