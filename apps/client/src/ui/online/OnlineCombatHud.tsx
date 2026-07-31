import type { MultiplayerUiState } from '../../game/multiplayer/MultiplayerBridge';
import { AutoHuntButton } from './AutoHuntButton';
import { CombatStatusBubble } from './CombatStatusBubble';
import { ONLINE_COPY } from './copy';
import { RespawnOverlay } from './RespawnOverlay';
import { RoomStatusCard } from './RoomStatusCard';
import { SessionRewardBadge } from './SessionRewardBadge';
import { TeamStatusPanel } from './TeamStatusPanel';

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
    <div className="online-hud" data-testid="online-hud">
      <TeamStatusPanel heroes={state.heroes} />
      {state.connection !== 'reconnecting' && <CombatStatusBubble state={state.autoHuntState} />}
      <RoomStatusCard state={state} onLeave={onLeave} />
      <SessionRewardBadge gold={state.sessionGold} focus={state.focusedMonsterName} />
      <p className="temporary-progress-notice">ⓘ {ONLINE_COPY.temporaryProgress}</p>
      <AutoHuntButton
        enabled={state.autoHuntEnabled}
        state={state.autoHuntState}
        onToggle={onToggleAutoHunt}
      />
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
