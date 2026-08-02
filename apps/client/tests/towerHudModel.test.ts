import { describe, expect, it } from 'vitest';
import { FLOOR_ONE_MAP } from '@odd-tower/game-core';
import { createLocalTowerHudModel, createOnlineTowerHudModel, projectFloorOneMinimap } from '../src/ui/tower/towerHudModel';
import { initialMultiplayerState } from '../src/game/multiplayer/MultiplayerBridge';

describe('tower HUD model', () => {
  it('clamps meters and describes local tower state', () => {
    const model = createLocalTowerHudModel({
      level: 3, hp: 120, maxHp: 100, experience: -2, nextExperience: 50,
      autoEnabled: true, autoState: 'engaging', target: 'Wild Sausage', living: 2,
      respawnSeconds: 0, paused: false, fps: 60, position: '1024, 1024',
    });
    expect(model.modeLabel).toBe('LOCAL ADVENTURE');
    expect(model.healthRatio).toBe(1);
    expect(model.experienceRatio).toBe(0);
    expect(model.partyAlive).toBe(2);
  });

  it('projects typed Floor 1 objects into normalized minimap markers', () => {
    const map = projectFloorOneMinimap(FLOOR_ONE_MAP);
    expect(map.width).toBe(64);
    expect(map.height).toBe(64);
    expect(map.markers.some((marker) => marker.kind === 'portal')).toBe(true);
    expect(map.markers.every((marker) => marker.x >= 0 && marker.x <= 1)).toBe(true);
  });

  it('keeps online room capacity and latency in shared session model', () => {
    const model = createOnlineTowerHudModel({ ...initialMultiplayerState, playerCount: 3, maxPlayers: 10, latencyMs: 42 });
    expect(model.capacityLabel).toBe('3 / 10');
    expect(model.latencyLabel).toBe('42 ms');
  });
});
