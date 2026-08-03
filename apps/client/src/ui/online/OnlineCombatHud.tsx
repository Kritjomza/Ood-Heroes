import type { MultiplayerUiState } from '../../game/multiplayer/MultiplayerBridge';
import { CombatStatusBubble } from './CombatStatusBubble';
import { ONLINE_COPY } from './copy';
import { RespawnOverlay } from './RespawnOverlay';
import { SessionRewardBadge } from './SessionRewardBadge';
import { TeamStatusPanel } from './TeamStatusPanel';
import { TowerHud } from '../tower/TowerHud';
import { createOnlineTowerHudModel } from '../tower/towerHudModel';
import { createFloorOneMinimapModel } from '../tower/towerHudModel';
import { FLOOR_ONE_MAP, WORLD } from '@odd-tower/game-core';

export function OnlineCombatHud({
  state,
  onLeave,
  onToggleAutoHunt,
}: {
  state: MultiplayerUiState;
  onLeave: () => void;
  onToggleAutoHunt: () => void;
}) {
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
      {state.connection !== 'reconnecting' && <CombatStatusBubble state={state.autoHuntState} />}
      <SessionRewardBadge gold={state.sessionGold} focus={state.focusedMonsterName} />
      <p className="temporary-progress-notice">ⓘ {ONLINE_COPY.temporaryProgress}</p>
      {state.error && (
        <div role="alert" className="network-error">
          {state.error}
        </div>
      )}
      {state.connection === 'reconnecting' && (
        <div role="status" aria-live="assertive" className="reconnecting-overlay">
          <strong>{ONLINE_COPY.reconnecting}</strong>
          <span>{ONLINE_COPY.reconnectingDetail}</span>
        </div>
      )}
      <RespawnOverlay seconds={state.respawnSeconds} />
      <div className="orientation-hint" role="note">
        Rotate to landscape for more tower wiggle room.
      </div>
    </div>
  );
}
