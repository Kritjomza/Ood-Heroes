import { FLOOR_ONE_MAP, WORLD } from '@odd-tower/game-core';
import type { MultiplayerUiState } from '../../game/multiplayer/MultiplayerBridge';
import { TeamStatusPanel } from './TeamStatusPanel';
import { TowerHud } from '../tower/TowerHud';
import { createFloorOneMinimapModel, createOnlineTowerHudModel } from '../tower/towerHudModel';

export function OnlineCombatHud({ state, onLeave, onToggleAutoHunt }: { state: MultiplayerUiState; onLeave: () => void; onToggleAutoHunt: () => void }) {
  return (
    <div className="online-hud-shell">
      <TowerHud
        model={createOnlineTowerHudModel(state)}
        minimap={createFloorOneMinimapModel({ map: FLOOR_ONE_MAP, tileSize: WORLD.tileSize, ...state.world })}
        onToggleAuto={onToggleAutoHunt}
        onPause={() => {}}
        onLeave={onLeave}
      />
      <TeamStatusPanel heroes={state.heroes} />
      {state.error && <div role="alert" className="network-error">{state.error}</div>}
      {state.connection === 'reconnecting' && (
        <div role="status" aria-live="assertive" className="reconnecting-overlay">
          <strong>Reconnecting</strong><span>The tower is holding your place.</span>
        </div>
      )}
    </div>
  );
}
