import { FLOOR_ONE_MAP } from '@odd-tower/game-core';
import { projectFloorOneMinimap } from './towerHudModel';

const map = projectFloorOneMinimap(FLOOR_ONE_MAP);

export function TowerMinimap() {
  return (
    <div className="tower-minimap sticker-panel" role="img" aria-label="Floor 1 minimap">
      <div className="minimap-land" />
      <div className="minimap-swamp" />
      <div className="minimap-arena" />
      {map.markers.map((marker) => (
        <i key={marker.id} className={`minimap-marker marker-${marker.kind}`} style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }} title={marker.kind} />
      ))}
      <i className="minimap-player" aria-hidden="true" />
      <span>F1</span>
    </div>
  );
}
