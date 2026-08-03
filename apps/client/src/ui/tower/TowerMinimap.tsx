import type { RefObject } from 'react';
import type { FloorOneMinimapModel } from './towerHudModel';

export type TowerMinimapProps = {
  model: FloorOneMinimapModel;
  expanded: boolean;
  onOpen: () => void;
  onClose: () => void;
  openerRef: RefObject<HTMLButtonElement | null>;
};

function MapField({ model, expanded = false }: { model: FloorOneMinimapModel; expanded?: boolean }) {
  const playerLabel = model.player ? `, player at ${Math.round(model.player.x * 100)} percent, ${Math.round(model.player.y * 100)} percent` : '';
  return (
    <span className={`minimap-field${expanded ? ' is-expanded' : ''}`} role="img" aria-label={`${expanded ? 'Expanded Floor 1 minimap' : 'Floor 1 minimap'}${playerLabel}`}>
      <span className="minimap-zone zone-fields" />
      <span className="minimap-zone zone-swamp" />
      <span className="minimap-zone zone-arena" />
      <span className="minimap-route" />
      {model.markers.map((marker) => (
        <i key={marker.id} className={`minimap-marker marker-${marker.kind} state-${marker.state ?? 'idle'}`} style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}>
          {expanded && <span>{marker.label}</span>}
        </i>
      ))}
      {model.player && <i className={`minimap-player facing-${model.player.facing}`} style={{ left: `${model.player.x * 100}%`, top: `${model.player.y * 100}%` }} />}
      <b>F1</b>
    </span>
  );
}

export function TowerMinimap({ model, expanded, onOpen, onClose, openerRef }: TowerMinimapProps) {
  return (
    <>
      <button ref={openerRef} type="button" className="tower-minimap sticker-panel" aria-label="Open Floor 1 map" onClick={onOpen}><MapField model={model} /></button>
      {expanded && (
        <div className="tower-map-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <section className="tower-map-dialog sticker-panel" role="dialog" aria-modal="true" aria-label="Floor 1 map">
            <header><div><small>THE ODD BEGINNING</small><h2>Floor 1 Map</h2></div><button type="button" aria-label="Close Floor 1 map" onClick={onClose}>Close</button></header>
            <MapField model={model} expanded />
            <div className="map-legend" aria-label="Map legend"><span>You</span><span>Camp</span><span>Guardian</span><span>Portal</span></div>
          </section>
        </div>
      )}
    </>
  );
}
