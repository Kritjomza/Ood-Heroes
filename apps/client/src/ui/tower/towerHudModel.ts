import type { HudState } from '../../game/bridge';
import type { MultiplayerUiState } from '../../game/multiplayer/MultiplayerBridge';
import type { FLOOR_ONE_MAP } from '@odd-tower/game-core';

export type TowerHudModel = {
  mode: 'local' | 'online';
  modeLabel: string;
  playerName: string;
  level: number;
  health: number;
  maxHealth: number;
  healthRatio: number;
  experience: number;
  nextExperience: number;
  experienceRatio: number;
  partyAlive: number;
  partySize: number;
  autoEnabled: boolean;
  autoState: string;
  target: string;
  connectionLabel: string;
  playerCount: number;
  capacityLabel: string;
  latencyLabel: string;
  objective: string;
  objectiveRatio: number;
  gold: number;
  respawnSeconds: number;
};

export type MinimapFacing = 'left' | 'right' | 'up' | 'down';
export type MinimapMarker = {
  id: string;
  kind: 'camp' | 'boss' | 'portal' | 'landmark' | 'target';
  x: number;
  y: number;
  label: string;
  state?: 'locked' | 'ready' | 'idle' | 'active';
};
export type MinimapPlayer = { x: number; y: number; facing: MinimapFacing };
export type FloorOneMinimapModel = { width: number; height: number; markers: MinimapMarker[]; player?: MinimapPlayer };
export type WorldPoint = { x: number; y: number };
export type FloorOneMinimapInput = {
  map: typeof FLOOR_ONE_MAP;
  tileSize: number;
  player?: WorldPoint & { facing?: MinimapFacing };
  portalUnlocked?: boolean;
  guardianActive?: boolean;
  target?: WorldPoint & { id: string; label: string };
};

const ratio = (value: number, max: number) => Math.max(0, Math.min(1, value / Math.max(1, max)));

export function createLocalTowerHudModel(state: HudState): TowerHudModel {
  return {
    mode: 'local', modeLabel: 'LOCAL ADVENTURE', playerName: 'Grilled Chicken', level: state.level,
    health: state.hp, maxHealth: state.maxHp, healthRatio: ratio(state.hp, state.maxHp),
    experience: state.experience, nextExperience: state.nextExperience,
    experienceRatio: ratio(state.experience, state.nextExperience), partyAlive: state.living,
    partySize: 3, autoEnabled: state.autoEnabled, autoState: state.autoState,
    target: state.target, connectionLabel: 'Solo', playerCount: 1, capacityLabel: '1 Player', latencyLabel: 'Local',
    objective: state.target === 'None' ? 'Find trouble. Preferably weird trouble.' : `Bonk ${state.target}`,
    objectiveRatio: ratio(state.experience, state.nextExperience), gold: 0,
    respawnSeconds: state.respawnSeconds,
  };
}

export function createOnlineTowerHudModel(state: MultiplayerUiState): TowerHudModel {
  const leader = state.heroes[0];
  return {
    mode: 'online', modeLabel: 'ONLINE PARTY', playerName: state.displayName || 'Odd Hero',
    level: leader?.level ?? 1, health: leader?.currentHp ?? 0, maxHealth: leader?.maxHp ?? 1,
    healthRatio: ratio(leader?.currentHp ?? 0, leader?.maxHp ?? 1), experience: leader?.experience ?? 0,
    nextExperience: leader?.nextExperience ?? 1,
    experienceRatio: ratio(leader?.experience ?? 0, leader?.nextExperience ?? 1),
    partyAlive: state.livingHeroes, partySize: Math.max(3, state.heroes.length),
    autoEnabled: state.autoHuntEnabled, autoState: state.autoHuntState,
    target: state.focusedMonsterName, connectionLabel: state.connection,
    playerCount: state.playerCount, capacityLabel: `${state.playerCount} / ${state.maxPlayers}`,
    latencyLabel: state.latencyMs === null ? '— ms' : `${state.latencyMs} ms`,
    objective: `Guardian training · ${state.sessionGold} shiny coins`,
    objectiveRatio: Math.min(1, state.sessionGold / 100), gold: state.sessionGold,
    respawnSeconds: state.respawnSeconds,
  };
}

export function projectWorldPoint(point: WorldPoint, map: typeof FLOOR_ONE_MAP, tileSize: number) {
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return {
    x: clamp(point.x / Math.max(1, map.width * tileSize)),
    y: clamp(point.y / Math.max(1, map.height * tileSize)),
  };
}

function markerLabel(kind: MinimapMarker['kind'], id: string) {
  if (kind === 'portal') return 'Floor 2 portal';
  if (kind === 'boss') return 'Floor guardian';
  if (kind === 'camp') return 'Central camp';
  if (id.includes('summon')) return 'Summon shrine';
  if (id.includes('team')) return 'Team station';
  if (id.includes('afk')) return 'AFK rewards';
  return 'Floor landmark';
}

export function projectFloorOneMinimap(map: typeof FLOOR_ONE_MAP): FloorOneMinimapModel {
  const markers: MinimapMarker[] = map.objects.flatMap((object) => {
    const kind = object.type === 'portal' ? 'portal' : object.type === 'boss_spawn' ? 'boss' : object.type === 'landmark' ? 'landmark' : object.zone === 'central_camp' && object.type === 'player_spawn' ? 'camp' : null;
    return kind ? [{
      id: object.id,
      kind,
      x: Math.max(0, Math.min(1, (object.x + object.width / 2) / Math.max(1, map.width))),
      y: Math.max(0, Math.min(1, (object.y + object.height / 2) / Math.max(1, map.height))),
      label: markerLabel(kind, object.id),
    }] : [];
  });
  return { width: map.width, height: map.height, markers };
}

export function createFloorOneMinimapModel(input: FloorOneMinimapInput): FloorOneMinimapModel {
  const base = projectFloorOneMinimap(input.map);
  const markers = base.markers.map((marker) => {
    if (marker.kind === 'portal') return { ...marker, state: input.portalUnlocked ? 'ready' as const : 'locked' as const };
    if (marker.kind === 'boss') return { ...marker, state: input.guardianActive ? 'active' as const : 'idle' as const };
    return marker;
  });
  if (input.target) {
    markers.push({
      id: input.target.id,
      kind: 'target',
      label: input.target.label,
      ...projectWorldPoint(input.target, input.map, input.tileSize),
    });
  }
  return {
    ...base,
    markers,
    player: input.player ? { ...projectWorldPoint(input.player, input.map, input.tileSize), facing: input.player.facing ?? 'down' } : undefined,
  };
}
